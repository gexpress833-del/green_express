"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ClientSubpageHeader from '@/components/ClientSubpageHeader'
import ReadOnlyGuard from '@/components/ReadOnlyGuard'
import GoldButton from '@/components/GoldButton'
import Toaster, { pushToast } from '@/components/Toaster'
import ConfirmModal from '@/components/ConfirmModal'
import { useAuth } from '@/contexts/AuthContext'
import { apiRequest, getApiErrorMessage } from '@/lib/api'
import { formatCurrencyCDF, formatDate } from '@/lib/helpers'

const PROVIDER_OPTIONS = {
  DRC: [
    { value: '', label: 'Détection automatique (RDC)' },
    { value: 'VODACOM_MPESA_COD', label: 'Vodacom M-Pesa' },
    { value: 'AIRTEL_OAPI_COD', label: 'Airtel Money' },
    { value: 'ORANGE_OAPI_COD', label: 'Orange Money' },
  ],
  KE: [
    { value: 'SAFARICOM_MPESA_KEN', label: 'Safaricom M-Pesa' },
    { value: 'AIRTEL_OAPI_KEN', label: 'Airtel Money' },
  ],
  UG: [
    { value: 'MTN_MOMO_UGA', label: 'MTN MoMo' },
    { value: 'AIRTEL_OAPI_UGA', label: 'Airtel Money' },
  ],
}

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
  if (country === 'KE') return /^254\d{9}$/.test(digits)
  if (country === 'UG') return /^256\d{9}$/.test(digits)
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
  const [error, setError] = useState('')
  const [paymentInfo, setPaymentInfo] = useState(null)
  const [polling, setPolling] = useState(false)
  const [confirmModal, setConfirmModal] = useState(null)
  const pollRef = useRef({ timer: null, attempts: 0 })

  const loadOrders = useCallback(async () => {
    const result = await apiRequest('/api/orders', { method: 'GET' })
    const list = Array.isArray(result) ? result : []
    setOrders(list)
    if (orderId) {
      const found = list.find((item) => String(item.id) === String(orderId))
      setOrder(found || null)
    }
    return list
  }, [orderId])

  useEffect(() => {
    setLoading(true)
    setError('')
    setPaymentInfo(null)

    if (orderId) {
      loadOrders()
        .then(() => setSingleMenu(null))
        .catch(() => {
          setOrders([])
          setOrder(null)
        })
        .finally(() => setLoading(false))
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
  }, [loadOrders, menuId, orderId])

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

  /* Après création de commande : reprendre le numéro enregistré pour l’étape paiement */
  useEffect(() => {
    if (!order?.client_phone_number) return
    const d = String(order.client_phone_number).replace(/\D/g, '')
    if (d.length >= 12 && d.startsWith('243')) {
      setPhone(`+${d}`)
    }
  }, [order?.id, order?.client_phone_number])

  const selectedProviders = useMemo(() => PROVIDER_OPTIONS[country] || [], [country])

  const startPollingOrderStatus = useCallback(() => {
    if (!orderId) return
    setPolling(true)
    pollRef.current.attempts = 0

    const tick = async () => {
      pollRef.current.attempts += 1
      try {
        const list = await loadOrders()
        const found = list.find((item) => String(item.id) === String(orderId))
        if (found && found.delivery_code && String(found.status).toLowerCase() !== 'pending_payment') {
          setOrder(found)
          setPolling(false)
          pushToast({ type: 'success', message: 'Paiement confirmé. Code de livraison généré.' })
          return
        }
      } catch {
        /* erreurs réseau ignorées pendant le polling */
      }

      if (pollRef.current.attempts >= 60) {
        setPolling(false)
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
    if (country === 'KE') return '+254' + cleaned.replace(/^254/, '')
    if (country === 'UG') return '+256' + cleaned.replace(/^256/, '')
    return cleaned
  }

  async function doInitiatePayment() {
    if (!order) return
    const normalizedPhone = normalizePhone(phone.trim())
    setSubmitting(true)
    setError('')
    try {
      const payload = {
        client_phone_number: normalizedPhone,
        country_code: country,
      }
      if (provider) payload.provider = provider

      const response = await apiRequest(`/api/orders/${order.id}/initiate-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      setPaymentInfo(response)
      setOrder(response?.order || order)
      pushToast({ type: 'success', message: response?.message || 'Paiement initié.' })

      if (response?.delivery_code || response?.payment_completed) {
        await loadOrders()
      } else {
        startPollingOrderStatus()
      }
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  function handleInitiatePayment() {
    if (!order) return
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
    try {
      const createdOrder = await apiRequest('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ menu_id: singleMenu.id, quantity: 1 }],
          delivery_address: deliveryAddress.trim(),
          client_phone_number: normalizePhone(phone.trim()),
        }),
      })
      router.replace(`/client/orders/create?order_id=${createdOrder.id}`)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setCreatingOrder(false)
    }
  }

  function handleCreateSingleOrder() {
    if (!singleMenu) return
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
                        Ce numéro sera utilisé pour débiter le montant via Mobile Money à l’étape suivante.
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
                <div className="card text-center py-12">
                  <p className="text-white/60 text-lg">Commande introuvable.</p>
                  <div className="mt-4">
                    <GoldButton href="/client/orders">Retour à mes commandes</GoldButton>
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
                      {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 text-sm">
                          {error}
                        </div>
                      )}
                      {paymentInfo?.message && (
                        <div className="mb-4 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-200 text-sm">
                          {paymentInfo.message}
                        </div>
                      )}

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="block text-white/80 text-sm mb-2">Pays</label>
                          <select
                            value={country}
                            onChange={(e) => {
                              setCountry(e.target.value)
                              setProvider('')
                            }}
                            className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
                          >
                            <option value="DRC">RDC (+243)</option>
                            <option value="KE">Kenya (+254)</option>
                            <option value="UG">Ouganda (+256)</option>
                          </select>
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
                        <p className="text-white/40 text-xs mt-2">
                          En RDC, la détection automatique du provider fonctionne aussi si tu laisses l&apos;option automatique.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3 justify-end mt-6">
                        <GoldButton href="/client/orders">Retour</GoldButton>
                        <button
                          type="button"
                          onClick={handleInitiatePayment}
                          disabled={submitting || polling}
                          className="gold disabled:opacity-50"
                        >
                          {submitting ? 'Envoi...' : polling ? 'Vérification en cours...' : 'Lancer le paiement'}
                        </button>
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
            onCancel={() => setConfirmModal(null)}
          />
        )}
      </section>
    </ReadOnlyGuard>
  )
}
