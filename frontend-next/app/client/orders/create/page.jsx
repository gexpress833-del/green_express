"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ClientSubpageHeader from '@/components/ClientSubpageHeader'
import ReadOnlyGuard from '@/components/ReadOnlyGuard'
import GoldButton from '@/components/GoldButton'
import Toaster, { pushToast } from '@/components/Toaster'
import ConfirmModal from '@/components/ConfirmModal'
import { useAuth } from '@/contexts/AuthContext'
import { apiRequest, getApiErrorMessage, getCsrfCookie } from '@/lib/api'
import { formatCurrencyCDF, formatDate } from '@/lib/helpers'
import PaymentMethodsBanner from '@/components/PaymentMethodsBanner'
import { PROVIDER_OPTIONS } from '@/lib/rdcMobileMoneyProviders'
import { analyzeRdcMobileMoneyPhone, buildRdcOperatorHint } from '@/lib/phoneRdc'

const CREATE_PAY_TIMEOUT_MS = 120000

function getStatusLabel(status) {
  const s = String(status || '').toLowerCase()
  switch (s) {
    case 'pending_payment': return 'En attente de paiement'
    case 'pending': return 'En attente de livraison'
    case 'paid': return 'Paiement confirmé'
    case 'out_for_delivery': return 'En cours de livraison'
    case 'delivered': return 'Livrée'
    case 'cancelled': return 'Annulée'
    default: return status || '—'
  }
}

function formatCurrency(amount, currency) {
  const cur = String(currency || 'CDF').toUpperCase()
  if (cur === 'CDF' || cur === 'FC') return formatCurrencyCDF(amount)
  return `${Number(amount || 0).toLocaleString('fr-FR')} ${cur}`
}

function getDefaultProvider(country) {
  const options = PROVIDER_OPTIONS[country] || []
  return options[0]?.value || ''
}

function isValidPhoneForCountry(phone, country) {
  const digits = String(phone || '').replace(/\D/g, '')
  if (country === 'DRC') return /^243(8|9)\d{8}$/.test(digits)
  return digits.length >= 9
}

export default function ClientOrderPaymentPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id')
  const menuId = searchParams.get('menu_id')

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState(null)
  const [singleMenu, setSingleMenu] = useState(null)
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [country, setCountry] = useState('DRC')
  const [provider, setProvider] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [creatingOrder, setCreatingOrder] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState('')
  const [paymentInfo, setPaymentInfo] = useState(null)
  const [polling, setPolling] = useState(false)
  // paymentState: { status: 'idle'|'pending'|'completed'|'failed'|'cancelled'|'timeout', message: string, failureReason?: string }
  const [paymentState, setPaymentState] = useState({ status: 'idle', message: '' })
  const [confirmModal, setConfirmModal] = useState(null)
  const pollRef = useRef({ timer: null, attempts: 0 })

  const loadOrders = useCallback(async (options = {}) => {
    const { updateOrderFromList = true } = options
    const result = await apiRequest('/api/orders', { method: 'GET' })
    const list = Array.isArray(result) ? result : []
    setOrders(list)
    if (orderId && updateOrderFromList) {
      const found = list.find((item) => String(item.id) === String(orderId))
      if (found) setOrder(found)
    }
    return list
  }, [orderId])

  useEffect(() => {
    setLoading(true)
    setError('')
    setPaymentInfo(null)

    if (orderId) {
      ;(async () => {
        let detail = null
        try {
          detail = await apiRequest(`/api/orders/${orderId}`, { method: 'GET' })
        } catch {
          /* fallback list */
        }
        if (detail?.id) {
          setOrder(detail)
          setSingleMenu(null)
        }
        try {
          const result = await apiRequest('/api/orders', { method: 'GET' })
          const list = Array.isArray(result) ? result : []
          setOrders(list)
          if (!detail?.id) {
            const found = list.find((item) => String(item.id) === String(orderId))
            setOrder(found || null)
            if (!found) setError('Commande introuvable ou accès refusé.')
          }
        } catch {
          if (!detail?.id) {
            setOrders([])
            setOrder(null)
            setError('Impossible de charger la commande.')
          }
        } finally {
          setLoading(false)
        }
      })()
      return
    }

    if (menuId) {
      apiRequest(`/api/menus/${menuId}`, { method: 'GET' })
        .then((menu) => {
          setSingleMenu(menu)
          setOrder(null)
        })
        .catch(() => {
          setSingleMenu(null)
          setOrder(null)
          setError('Ce plat est introuvable ou indisponible.')
        })
        .finally(() => setLoading(false))
      return
    }

    setOrder(null)
    setSingleMenu(null)
    setLoading(false)
  }, [menuId, orderId])

  useEffect(() => () => {
    if (pollRef.current.timer) clearTimeout(pollRef.current.timer)
  }, [])

  useEffect(() => {
    if (country === 'DRC') {
      setProvider('')
      return
    }

    setProvider((current) => current || getDefaultProvider(country))
  }, [country])

  /* Préremplir le numéro de paiement (commande rapide) depuis le profil */
  useEffect(() => {
    if (!singleMenu || orderId) return
    if (user?.phone) {
      const d = String(user.phone).replace(/\D/g, '')
      if (d.startsWith('243')) {
        setPhone((prev) => (prev.trim() ? prev : `+${d}`))
      }
    }
  }, [singleMenu, orderId, user?.phone])

  /* Après création de commande : reprendre le numéro enregistré pour l'étape paiement */
  useEffect(() => {
    if (!order?.client_phone_number) return
    const d = String(order.client_phone_number).replace(/\D/g, '')
    if (d.length >= 12 && d.startsWith('243')) {
      setPhone(`+${d}`)
    }
  }, [order?.id, order?.client_phone_number])

  const selectedProviders = useMemo(() => PROVIDER_OPTIONS[country] || [], [country])

  const phoneAnalysis = useMemo(() => analyzeRdcMobileMoneyPhone(phone), [phone])

  const operatorHint = useMemo(
    () =>
      buildRdcOperatorHint({
        country,
        rawPhone: phone,
        phoneAnalysis,
        provider,
        providerOptions: selectedProviders,
      }),
    [country, phone, phoneAnalysis, provider, selectedProviders],
  )

  const startPollingOrderStatus = useCallback(() => {
    if (!orderId) return
    setPolling(true)
    pollRef.current.attempts = 0

    const tick = async () => {
      pollRef.current.attempts += 1
      try {
        const status = await apiRequest(`/api/orders/${orderId}/payment-status`, { method: 'GET' })
        const s = String(status?.status || '').toLowerCase()

        if (s === 'completed') {
          // Recharge la commande pour obtenir le delivery_code et items.menu a jour
          await loadOrders()
          setPaymentState({ status: 'completed', message: status.message || 'Paiement confirmé.' })
          setPolling(false)
          pushToast({ type: 'success', message: 'Paiement confirmé. Code de livraison généré.' })
          return
        }

        if (s === 'failed') {
          await loadOrders()
          setPaymentState({
            status: 'failed',
            message: status.message || 'Le paiement n\'a pas abouti.',
            failureReason: status.failure_reason,
          })
          setPolling(false)
          pushToast({ type: 'error', message: status.message || 'Paiement refusé.' })
          return
        }

        if (s === 'cancelled') {
          await loadOrders()
          setPaymentState({ status: 'cancelled', message: status.message || 'Commande annulée.' })
          setPolling(false)
          return
        }

        // Pending : on garde le message a jour pour l'UI
        if (s === 'pending') {
          setPaymentState((prev) => ({
            status: 'pending',
            message: status.message || prev.message || 'Paiement en cours…',
          }))
        }
      } catch {
        /* erreurs reseau ignorees pendant le polling */
      }

      if (pollRef.current.attempts >= 60) {
        // Timeout : 60 essais x 3s = 3 minutes
        setPolling(false)
        setPaymentState({
          status: 'timeout',
          message: 'Pas de confirmation reçue après 3 minutes. Vérifiez votre téléphone (USSD Mobile Money) ou réessayez. Si le problème persiste, annulez la commande.',
        })
        return
      }

      pollRef.current.timer = setTimeout(tick, 3000)
    }

    tick()
  }, [loadOrders, orderId])

  function normalizePhone(value) {
    const cleaned = String(value).replace(/[\s\-()]/g, '').replace(/^0+/, '')
    if (cleaned.startsWith('+')) return cleaned
    if (country === 'DRC') return '+243' + cleaned.replace(/^243/, '')
    return cleaned
  }

  async function doInitiatePayment() {
    if (!order) return
    const normalizedPhone = normalizePhone(phone.trim())
    setSubmitting(true)
    setError('')
    setPaymentState({ status: 'pending', message: 'Envoi de la demande à votre opérateur Mobile Money…' })
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), CREATE_PAY_TIMEOUT_MS)
    try {
      await getCsrfCookie()
      const payload = {
        client_phone_number: normalizedPhone,
        country_code: country,
      }
      if (provider) payload.provider = provider

      const response = await apiRequest(`/api/orders/${order.id}/initiate-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      setPaymentInfo(response)
      setOrder(response?.order || order)

      if (response?.delivery_code || response?.payment_completed) {
        // Paiement deja confirme cote backend (cas rare mais possible)
        await loadOrders()
        setPaymentState({ status: 'completed', message: response?.message || 'Paiement confirmé.' })
        pushToast({ type: 'success', message: 'Paiement confirmé.' })
      } else {
        setPaymentState({
          status: 'pending',
          message: response?.message || 'Paiement initié. Confirmez sur votre téléphone (Mobile Money).',
        })
        pushToast({ type: 'info', message: 'Paiement initié. Vérifiez votre téléphone.' })
        startPollingOrderStatus()
      }
    } catch (err) {
      let msg
      if (err?.name === 'AbortError') {
        msg = 'Délai dépassé. Si l\'API était en veille, réessayez dans une minute.'
      } else {
        msg = getApiErrorMessage(err)
      }
      setError(msg)
      setPaymentState({ status: 'failed', message: msg })
    } finally {
      clearTimeout(timeoutId)
      setSubmitting(false)
    }
  }

  function handleRetryPayment() {
    // Reessaye le paiement avec les memes infos. Garde le numero saisi.
    if (!order || submitting) return
    setError('')
    setPaymentInfo(null)
    setPaymentState({ status: 'idle', message: '' })
    if (pollRef.current.timer) {
      clearTimeout(pollRef.current.timer)
      pollRef.current.timer = null
    }
    pollRef.current.attempts = 0
    setPolling(false)
    handleInitiatePayment()
  }

  async function doCancelOwnOrder() {
    if (!order || cancelling) return
    setCancelling(true)
    setError('')
    if (pollRef.current.timer) {
      clearTimeout(pollRef.current.timer)
      pollRef.current.timer = null
    }
    setPolling(false)
    try {
      await getCsrfCookie()
      const response = await apiRequest(`/api/orders/${order.id}/cancel-own`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      setOrder(response?.order || { ...order, status: 'cancelled' })
      setPaymentState({ status: 'cancelled', message: 'Commande annulée.' })
      pushToast({ type: 'success', message: 'Commande annulée.' })
      // Redirection vers la liste des commandes apres un court delai
      setTimeout(() => router.replace('/client/orders'), 1200)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setCancelling(false)
    }
  }

  function handleCancelOwnOrder() {
    if (!order || cancelling) return
    setConfirmModal({
      title: 'Annuler la commande',
      message: `Confirmer l'annulation de la commande #${order.id} ? Aucun débit ne sera effectué si le paiement n'a pas encore abouti.`,
      variant: 'danger',
      confirmLabel: 'Annuler la commande',
      onConfirm: () => { setConfirmModal(null); doCancelOwnOrder() },
    })
  }

  function handleInitiatePayment() {
    if (!order || submitting || polling) return
    const normalizedPhone = normalizePhone(phone.trim())
    if (!isValidPhoneForCountry(normalizedPhone, country)) {
      setError('Entrez un numéro Mobile Money valide.')
      return
    }
    setConfirmModal({
      title: 'Confirmer le paiement',
      message: `Vous allez initier un paiement Mobile Money pour la commande #${order.id}. Un débit sera effectué sur votre compte.`,
      variant: 'warning',
      confirmLabel: 'Lancer le paiement',
      onConfirm: () => { setConfirmModal(null); doInitiatePayment() },
    })
  }

  async function doCreateSingleOrder() {
    setCreatingOrder(true)
    setError('')
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), CREATE_PAY_TIMEOUT_MS)
    try {
      await getCsrfCookie()
      const createdOrder = await apiRequest('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ menu_id: singleMenu.id, quantity: 1 }],
          delivery_address: deliveryAddress.trim(),
          client_phone_number: normalizePhone(phone.trim()),
        }),
        signal: controller.signal,
      })
      if (!createdOrder?.id) {
        setError('Réponse serveur invalide. Réessayez ou contactez le support.')
        pushToast({ type: 'error', message: 'Création de commande incomplète.' })
        return
      }
      pushToast({ type: 'success', message: `Commande #${createdOrder.id} créée. Étape paiement…` })
      router.replace(`/client/orders/create?order_id=${createdOrder.id}`)
    } catch (err) {
      if (err?.name === 'AbortError') {
        setError('Délai dépassé. Si l\'API était en veille, réessayez dans une minute.')
      } else {
        setError(getApiErrorMessage(err))
      }
    } finally {
      clearTimeout(timeoutId)
      setCreatingOrder(false)
    }
  }

  function handleCreateSingleOrder() {
    if (!singleMenu || creatingOrder) return
    if (!deliveryAddress.trim()) {
      setError("Veuillez indiquer l'adresse de livraison.")
      return
    }
    const np = normalizePhone(phone.trim())
    if (!isValidPhoneForCountry(np, 'DRC')) {
      setError('Indiquez un numéro Mobile Money RDC valide pour le paiement (ex. 08…, 09… ou +243…).')
      return
    }
    setError('')
    setConfirmModal({
      title: 'Confirmer la commande',
      message: `Vous allez commander « ${singleMenu.name || singleMenu.title} » avec livraison à : ${deliveryAddress.trim()}`,
      variant: 'info',
      confirmLabel: 'Créer puis payer',
      onConfirm: () => { setConfirmModal(null); doCreateSingleOrder() },
    })
  }

  return (
    <ReadOnlyGuard allowedActions={['view', 'read', 'order']} showWarning={false}>
      <section className="page-section min-h-screen bg-[#0b1220] text-white">
        <div className="container">
          <ClientSubpageHeader
            title="Paiement de commande"
            subtitle="Confirme ton paiement Mobile Money pour générer ton code de livraison."
            icon="💳"
          />

              {loading ? (
                <div className="card text-center py-12">
                  <p className="text-white/60">Chargement...</p>
                </div>
              ) : !order && singleMenu ? (
                <div className="space-y-6">
                  <div className="card">
                    <div className="flex flex-wrap justify-between items-start gap-4">
                      <div>
                        <h2 className="text-xl font-semibold text-cyan-400">{singleMenu.name || singleMenu.title}</h2>
                        <p className="text-white/60 text-sm mt-1">{singleMenu.description || 'Aucune description.'}</p>
                      </div>
                      <span className="badge badge-warning">Commande rapide</span>
                    </div>

                    <div className="mt-5 pt-5 border-t border-white/10">
                      <p className="text-white/70 text-sm mb-3">Montant estimé</p>
                      <p className="text-3xl font-bold text-cyan-300">
                        {formatCurrency(singleMenu.price, singleMenu.currency || 'CDF')}
                      </p>
                    </div>
                  </div>

                  <div className="card">
                    <h3 className="text-xl font-semibold mb-4">Créer la commande</h3>
                    <PaymentMethodsBanner compact className="mb-5" />
                    {error && (
                      <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 text-sm">
                        {error}
                      </div>
                    )}

                    <div>
                      <label className="block text-white/80 text-sm mb-2">Adresse de livraison</label>
                      <textarea
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        rows={3}
                        placeholder="Adresse complète de livraison..."
                        className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40"
                      />
                    </div>

                    <div className="mt-4">
                      <label className="block text-white/80 text-sm mb-2">Numéro Mobile Money (paiement)</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+243812345678 ou 0812345678"
                        autoComplete="tel"
                        className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40"
                      />
                      <p className="text-white/40 text-xs mt-2">
                        Ce numéro sera utilisé pour débiter le montant via Mobile Money à l'étape suivante.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3 justify-end mt-6">
                      <GoldButton href="/client/menus">Retour aux menus</GoldButton>
                      <button
                        type="button"
                        onClick={handleCreateSingleOrder}
                        disabled={creatingOrder}
                        className="gold disabled:opacity-50"
                      >
                        {creatingOrder ? 'Création...' : 'Créer puis payer'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : !order ? (
                <div className="card text-center py-12 max-w-xl mx-auto">
                  <p className="text-white/90 text-lg font-medium">
                    {orderId
                      ? `Impossible d’afficher la commande n°${orderId}`
                      : 'Aucune commande à payer'}
                  </p>
                  {error ? (
                    <p className="text-red-300/90 text-sm mt-3">{error}</p>
                  ) : (
                    <p className="text-white/50 text-sm mt-3 leading-relaxed">
                      {orderId
                        ? 'Cette commande n’existe plus sur le serveur (lien favori, ancienne notification ou base réinitialisée), ou elle est liée à un autre compte. Pour commander un repas : choisis un plat dans le catalogue.'
                        : 'Pour un repas individuel, ouvre un plat depuis les menus : une nouvelle commande sera créée, puis tu pourras payer.'}
                    </p>
                  )}
                  <div className="mt-6 flex flex-wrap gap-3 justify-center">
                    <GoldButton href="/client/menus">Choisir un plat</GoldButton>
                    <GoldButton href="/client/orders">Mes commandes</GoldButton>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="card">
                    <div className="flex flex-wrap justify-between items-start gap-4">
                      <div>
                        <h2 className="text-xl font-semibold text-cyan-400">Commande #{order.id}</h2>
                        <p className="text-white/60 text-sm mt-1">{formatDate(order.created_at)}</p>
                        {order.delivery_address && <p className="text-white/60 text-sm mt-1">📍 {order.delivery_address}</p>}
                      </div>
                      <span className="badge badge-warning">{getStatusLabel(order.status)}</span>
                    </div>

                    <div className="mt-5 pt-5 border-t border-white/10">
                      <p className="text-white/70 text-sm mb-3">Total à payer</p>
                      <p className="text-3xl font-bold text-cyan-300">
                        {formatCurrency(order.total_amount, order.items?.[0]?.menu?.currency || order.currency || 'CDF')}
                      </p>
                    </div>
                  </div>

                  {order.delivery_code ? (
                    <div className="card border border-cyan-500/30 bg-cyan-500/10">
                      <p className="text-white/70 text-sm">Code de livraison</p>
                      <p className="text-3xl font-bold text-cyan-400 font-mono mt-2">{order.delivery_code}</p>
                      <p className="text-white/60 text-sm mt-3">Présente ce code au livreur lors de la remise de ta commande.</p>
                    </div>
                  ) : (
                    <div className="card">
                      <h3 className="text-xl font-semibold mb-4">Payer avec Mobile Money</h3>
                      <PaymentMethodsBanner compact className="mb-5" />
                      {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 text-sm">
                          {error}
                        </div>
                      )}

                      {paymentState.status === 'pending' && (
                        <div className="mb-5 p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/40">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl animate-pulse" aria-hidden="true">📱</span>
                            <div>
                              <p className="text-cyan-200 font-medium">Paiement en cours…</p>
                              <p className="text-cyan-100/80 text-sm mt-1">{paymentState.message}</p>
                              <p className="text-cyan-100/60 text-xs mt-2">
                                Cette page se met à jour automatiquement. Cela peut prendre jusqu'à 3 minutes.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {paymentState.status === 'failed' && (
                        <div className="mb-5 p-4 rounded-lg bg-red-500/15 border border-red-500/50">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl" aria-hidden="true">❌</span>
                            <div className="flex-1">
                              <p className="text-red-200 font-semibold">Le paiement n'a pas abouti</p>
                              <p className="text-red-100/90 text-sm mt-1">{paymentState.message}</p>
                              <p className="text-red-100/70 text-xs mt-2">
                                Causes fréquentes : solde insuffisant, refus côté opérateur, code USSD non confirmé à temps.
                                Aucun montant n'a été débité.
                              </p>
                              <div className="flex flex-wrap gap-3 mt-4">
                                <button
                                  type="button"
                                  onClick={handleRetryPayment}
                                  disabled={submitting || cancelling}
                                  className="gold disabled:opacity-50"
                                >
                                  Réessayer le paiement
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelOwnOrder}
                                  disabled={submitting || cancelling}
                                  className="px-4 py-2 rounded-lg bg-red-500/30 hover:bg-red-500/40 border border-red-500/60 text-red-100 text-sm disabled:opacity-50"
                                >
                                  {cancelling ? 'Annulation…' : 'Annuler la commande'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {paymentState.status === 'timeout' && (
                        <div className="mb-5 p-4 rounded-lg bg-amber-500/15 border border-amber-500/50">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl" aria-hidden="true">⏱️</span>
                            <div className="flex-1">
                              <p className="text-amber-200 font-semibold">Pas de confirmation reçue</p>
                              <p className="text-amber-100/90 text-sm mt-1">{paymentState.message}</p>
                              <div className="flex flex-wrap gap-3 mt-4">
                                <button
                                  type="button"
                                  onClick={handleRetryPayment}
                                  disabled={submitting || cancelling}
                                  className="gold disabled:opacity-50"
                                >
                                  Réessayer le paiement
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelOwnOrder}
                                  disabled={submitting || cancelling}
                                  className="px-4 py-2 rounded-lg bg-red-500/30 hover:bg-red-500/40 border border-red-500/60 text-red-100 text-sm disabled:opacity-50"
                                >
                                  {cancelling ? 'Annulation…' : 'Annuler la commande'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {paymentState.status === 'cancelled' && (
                        <div className="mb-5 p-4 rounded-lg bg-white/5 border border-white/15">
                          <p className="text-white/80 text-sm">
                            ✖ {paymentState.message} Redirection vers vos commandes…
                          </p>
                        </div>
                      )}

                      <p className="text-white/60 text-sm mb-4">
                        Paiement sécurisé par <strong className="text-cyan-200/90">Mobile Money</strong> (RDC uniquement).
                      </p>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="block text-white/80 text-sm mb-2">Pays</label>
                          <div className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-white/90 text-sm">
                            RDC (+243)
                          </div>
                        </div>

                        <div>
                          <label className="block text-white/80 text-sm mb-2">Opérateur</label>
                          <select
                            value={provider}
                            onChange={(e) => setProvider(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
                          >
                            {selectedProviders.map((option) => (
                              <option key={option.value || 'auto'} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="block text-white/80 text-sm mb-2">Numéro Mobile Money</label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+243812345678"
                          className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40"
                        />
                        {operatorHint && (
                          <p
                            className={`text-xs mt-2 ${
                              operatorHint.type === 'ok'
                                ? 'text-cyan-300/90'
                                : operatorHint.type === 'warn'
                                  ? 'text-amber-200/90'
                                  : operatorHint.type === 'manual'
                                    ? 'text-white/65'
                                    : 'text-white/45'
                            }`}
                          >
                            {operatorHint.text}
                          </p>
                        )}
                        <p className="text-white/40 text-xs mt-2">
                          L&apos;opérateur est identifié automatiquement à partir des chiffres de ton numéro. Le menu « Opérateur » sert uniquement de rappel visuel — choisis « Détection automatique » ou précise l&apos;opérateur si tu préfères.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3 justify-end mt-6">
                        <GoldButton href="/client/orders">Retour</GoldButton>
                        {/* Le bouton principal est masque quand un etat d'echec/timeout est affiche : la carte ci-dessus propose Reessayer / Annuler. */}
                        {paymentState.status !== 'failed' && paymentState.status !== 'timeout' && paymentState.status !== 'cancelled' && (
                          <button
                            type="button"
                            onClick={handleInitiatePayment}
                            disabled={submitting || polling}
                            className="gold disabled:opacity-50"
                          >
                            {submitting ? 'Envoi...' : polling ? 'Vérification en cours...' : 'Lancer le paiement'}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
        </div>
        <Toaster />
        {confirmModal && (
          <ConfirmModal
            {...confirmModal}
            confirmDisabled={creatingOrder || submitting}
            onCancel={() => setConfirmModal(null)}
          />
        )}
      </section>
    </ReadOnlyGuard>
  )
}
