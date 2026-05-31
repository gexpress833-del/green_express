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
import DeliveryCodeDisplay from '@/components/DeliveryCodeDisplay'
import { PROVIDER_OPTIONS } from '@/lib/rdcMobileMoneyProviders'
import { analyzeRdcMobileMoneyPhone, buildRdcOperatorHint } from '@/lib/phoneRdc'
import { convertMenuPrice, getStoredCurrencyPreference, getStoredUsdCdfRate, syncUsdCdfRate } from '@/lib/currencyPreference'
import { fetchDeliveryZone, isWithinZone } from '@/lib/geo'

const CREATE_PAY_TIMEOUT_MS = 120000
const PAYMENT_POLL_INTERVAL_MS = 3000
const PAYMENT_POLL_MAX_ATTEMPTS = 20
const PAYMENT_PENDING_SOFT_WARN_MS = 20000
const PAYMENT_STATUS_REQUEST_TIMEOUT_MS = 7000

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
  const [deliveryLatitude, setDeliveryLatitude] = useState(null)
  const [deliveryLongitude, setDeliveryLongitude] = useState(null)
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoError, setGeoError] = useState('')
  const [deliveryZone, setDeliveryZone] = useState(null)
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
  const [preferredCurrency, setPreferredCurrency] = useState('CDF')
  const [usdCdfRate, setUsdCdfRate] = useState(2800)
  const pollRef = useRef({ timer: null, attempts: 0, startedAt: 0 })
  const singleMenuPrice = singleMenu ? convertMenuPrice(singleMenu, preferredCurrency, usdCdfRate) : null

  const locationRequired = deliveryZone?.enabled && deliveryZone?.require_location
  const hasCoords = deliveryLatitude != null && deliveryLongitude != null
  const outOfZone =
    deliveryZone?.enabled &&
    hasCoords &&
    !isWithinZone(deliveryZone, { latitude: deliveryLatitude, longitude: deliveryLongitude })

  useEffect(() => {
    setPreferredCurrency(getStoredCurrencyPreference())
    setUsdCdfRate(getStoredUsdCdfRate())
    syncUsdCdfRate(apiRequest).then(setUsdCdfRate).catch(() => {})
  }, [])

  useEffect(() => {
    let cancelled = false
    fetchDeliveryZone().then((zone) => {
      if (!cancelled) setDeliveryZone(zone)
    })
    return () => {
      cancelled = true
    }
  }, [])

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

  const refreshOrderDetail = useCallback(async () => {
    if (!orderId) return null
    try {
      const detail = await apiRequest(`/api/orders/${orderId}`, { method: 'GET' })
      if (detail?.id) {
        setOrder(detail)
        return detail
      }
    } catch {
      await loadOrders()
    }
    return null
  }, [loadOrders, orderId])

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

  useEffect(() => {
    if (!order) return
    if (order.delivery_code) {
      setPaymentState({
        status: 'completed',
        message: 'Paiement confirmé. Présente ce code au livreur.',
      })
      return
    }
    if (order.status === 'paid') {
      refreshOrderDetail()
    }
  }, [order?.id, order?.delivery_code, order?.status, refreshOrderDetail])

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
    if (pollRef.current.timer) {
      clearTimeout(pollRef.current.timer)
      pollRef.current.timer = null
    }
    setPolling(true)
    pollRef.current.attempts = 0
    pollRef.current.startedAt = Date.now()

    const tick = async () => {
      pollRef.current.attempts += 1
      const statusController = new AbortController()
      const statusTimeoutId = setTimeout(() => statusController.abort(), PAYMENT_STATUS_REQUEST_TIMEOUT_MS)
      try {
        const status = await apiRequest(`/api/orders/${orderId}/payment-status`, {
          method: 'GET',
          signal: statusController.signal,
        })
        const s = String(status?.status || '').toLowerCase()

        if (s === 'completed') {
          const detail = await refreshOrderDetail()
          const code = detail?.delivery_code || status?.delivery_code
          setPaymentState({
            status: 'completed',
            message: code
              ? `Paiement confirmé. Code de livraison : ${code}.`
              : (status.message || 'Paiement confirmé.'),
          })
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
          const elapsedMs = Date.now() - (pollRef.current.startedAt || Date.now())
          const softWarn = elapsedMs >= PAYMENT_PENDING_SOFT_WARN_MS
          setPaymentState((prev) => ({
            status: 'pending',
            message: softWarn
              ? 'Confirmation en cours… Si vous avez déjà validé sur votre téléphone, patientez encore un instant.'
              : (status.message || prev.message || 'Paiement en cours…'),
          }))
        }
      } catch {
        /* erreurs reseau ignorees pendant le polling */
      } finally {
        clearTimeout(statusTimeoutId)
      }

      if (pollRef.current.attempts >= PAYMENT_POLL_MAX_ATTEMPTS) {
        // Timeout : 20 essais x 3s = 1 minute
        setPolling(false)
        setPaymentState({
          status: 'timeout',
          message: 'Pas de confirmation reçue après 1 minute. Vérifiez votre téléphone (USSD Mobile Money) ou réessayez. Si le problème persiste, annulez la commande.',
        })
        return
      }

      pollRef.current.timer = setTimeout(tick, PAYMENT_POLL_INTERVAL_MS)
    }

    tick()
  }, [loadOrders, orderId, refreshOrderDetail])

  const handleRefreshPaymentStatus = useCallback(() => {
    if (!orderId || polling) return
    setError('')
    pollRef.current.startedAt = Date.now()
    pollRef.current.attempts = 0
    setPaymentState({ status: 'pending', message: 'Vérification du paiement en cours…' })
    startPollingOrderStatus()
  }, [orderId, polling, startPollingOrderStatus])

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
        const detail = await refreshOrderDetail()
        const code = detail?.delivery_code || response?.delivery_code
        setPaymentState({
          status: 'completed',
          message: code
            ? `Paiement confirmé. Code de livraison : ${code}.`
            : (response?.message || 'Paiement confirmé.'),
        })
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

  function handleShareLocation() {
    setGeoLoading(true)
    setGeoError('')
    if (!navigator.geolocation) {
      setGeoError('La géolocalisation n\'est pas supportée par ce navigateur.')
      setGeoLoading(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDeliveryLatitude(pos.coords.latitude)
        setDeliveryLongitude(pos.coords.longitude)
        setGeoLoading(false)
        if (
          deliveryZone?.enabled &&
          !isWithinZone(deliveryZone, {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          })
        ) {
          setGeoError(
            `Service indisponible à votre position. Les commandes sont limitées à ${deliveryZone.zone_name} (rayon de ${Math.round(deliveryZone.radius_km)} km).`,
          )
        }
      },
      (err) => {
        setGeoLoading(false)
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setGeoError('Permission refusée. Activez le GPS dans les paramètres de votre navigateur.')
            break
          case err.POSITION_UNAVAILABLE:
            setGeoError('Position GPS indisponible. Vérifiez que le GPS est activé.')
            break
          case err.TIMEOUT:
            setGeoError('Délai de récupération de la position dépassé. Réessayez.')
            break
          default:
            setGeoError('Erreur de géolocalisation.')
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  async function doCreateSingleOrder() {
    setCreatingOrder(true)
    setError('')
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), CREATE_PAY_TIMEOUT_MS)
    try {
      await getCsrfCookie()
      const payload = {
        items: [{
          menu_id: singleMenu.id,
          quantity: 1,
          price: singleMenuPrice.price,
          currency: singleMenuPrice.currency,
          original_price: singleMenuPrice.originalPrice,
          original_currency: singleMenuPrice.originalCurrency,
        }],
        delivery_address: deliveryAddress.trim(),
        client_phone_number: normalizePhone(phone.trim()),
        currency: singleMenuPrice.currency,
      }
      if (deliveryLatitude != null && deliveryLongitude != null) {
        payload.delivery_latitude = deliveryLatitude
        payload.delivery_longitude = deliveryLongitude
      }
      const createdOrder = await apiRequest('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
    if (locationRequired && !hasCoords) {
      setError('Le partage de votre position GPS est obligatoire pour commander.')
      return
    }
    if (outOfZone) {
      setError(
        `Service indisponible à votre position. Les commandes sont limitées à ${deliveryZone.zone_name} (rayon de ${Math.round(deliveryZone.radius_km)} km).`,
      )
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
                        {formatCurrency(singleMenuPrice.price, singleMenuPrice.currency)}
                      </p>
                      {singleMenuPrice.converted && (
                        <p className="text-white/45 text-xs mt-2">
                          Converti depuis {formatCurrency(singleMenuPrice.originalPrice, singleMenuPrice.originalCurrency)}
                        </p>
                      )}
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
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={handleShareLocation}
                          disabled={geoLoading}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white rounded-lg text-sm font-medium transition flex items-center gap-2"
                        >
                          {geoLoading ? (
                            <span className="inline-block w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            '📍'
                          )}
                          {geoLoading ? 'Récupération…' : 'Partager ma position GPS'}
                        </button>
                        {hasCoords && !outOfZone && (
                          <span className="text-emerald-400 text-sm flex items-center gap-1">
                            ✅ Position capturée ({deliveryLatitude.toFixed(5)}, {deliveryLongitude.toFixed(5)})
                          </span>
                        )}
                        {hasCoords && outOfZone && (
                          <span className="text-red-400 text-sm flex items-center gap-1">
                            ⛔ Hors zone de livraison
                          </span>
                        )}
                      </div>
                      {geoError && (
                        <p className="text-red-400 text-xs mt-2">{geoError}</p>
                      )}
                      <p className="text-white/40 text-xs mt-2">
                        {locationRequired
                          ? `Obligatoire : le service est réservé à ${deliveryZone?.zone_name || 'la zone autorisée'}. Partagez votre position GPS pour commander.`
                          : 'Facultatif : partagez votre position pour aider le livreur à vous trouver plus facilement.'}
                      </p>
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
                        disabled={creatingOrder || (locationRequired && !hasCoords) || outOfZone}
                        className="gold disabled:opacity-50 disabled:cursor-not-allowed"
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
                      <span className={`badge ${order.delivery_code || order.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                        {order.delivery_code || order.status === 'paid' ? 'Paiement confirmé' : getStatusLabel(order.status)}
                      </span>
                    </div>

                    <div className="mt-5 pt-5 border-t border-white/10">
                      <p className="text-white/70 text-sm mb-3">Total à payer</p>
                      <p className="text-3xl font-bold text-cyan-300">
                        {formatCurrency(order.total_amount, order.currency || order.items?.[0]?.currency || order.items?.[0]?.menu?.currency || 'CDF')}
                      </p>
                    </div>
                  </div>

                  {(order.delivery_code || paymentState.status === 'completed') ? (
                    <div className="space-y-5">
                      <DeliveryCodeDisplay
                        code={order.delivery_code}
                        subtitle="Code de livraison"
                      />
                      <div className="flex justify-center">
                        <GoldButton href="/client/orders">Voir mes commandes</GoldButton>
                      </div>
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
                            <div className="flex-1">
                              <p className="text-cyan-200 font-medium">Paiement en cours…</p>
                              <p className="text-cyan-100/80 text-sm mt-1">{paymentState.message}</p>
                              <p className="text-cyan-100/60 text-xs mt-2">
                                Cette page se met à jour automatiquement. Cela peut prendre jusqu'à 1 minute.
                              </p>
                              <button
                                type="button"
                                onClick={handleRefreshPaymentStatus}
                                disabled={polling}
                                className="mt-3 mr-4 text-sm text-cyan-300 hover:text-white underline underline-offset-2 disabled:opacity-50 bg-transparent font-medium"
                              >
                                J&apos;ai confirmé sur mon téléphone — vérifier maintenant
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (pollRef.current.timer) {
                                    clearTimeout(pollRef.current.timer)
                                    pollRef.current.timer = null
                                  }
                                  setPolling(false)
                                  setPaymentState({
                                    status: 'failed',
                                    message: 'Paiement signalé comme non abouti par vous-même. Vous pouvez réessayer ou annuler la commande.',
                                  })
                                }}
                                className="mt-3 text-xs text-cyan-200 hover:text-white underline underline-offset-2 bg-transparent font-medium"
                              >
                                Le paiement n'a pas marché sur mon téléphone ?
                              </button>
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
                                  onClick={handleRefreshPaymentStatus}
                                  disabled={submitting || cancelling || polling}
                                  className="gold disabled:opacity-50"
                                >
                                  {polling ? 'Vérification…' : 'Vérifier à nouveau le paiement'}
                                </button>
                                <button
                                  type="button"
                                  onClick={handleRetryPayment}
                                  disabled={submitting || cancelling}
                                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 text-white text-sm disabled:opacity-50"
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
