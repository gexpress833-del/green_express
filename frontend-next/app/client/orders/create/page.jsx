"use client"
import ClientSidebar from '@/components/ClientSidebar'
import ReadOnlyGuard from '@/components/ReadOnlyGuard'
import GoldButton from '@/components/GoldButton'
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { apiRequest } from '@/lib/api'
import { formatCurrencyCDF } from '@/lib/helpers'
import Image from 'next/image'
import Link from 'next/link'

export default function CreateOrder(){
  const searchParams = useSearchParams()
  const router = useRouter()
  const menuId = searchParams.get('menu_id')
  const orderIdParam = searchParams.get('order_id')
  
  const [menu, setMenu] = useState(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(1) // 1: formulaire, 2: paiement, 3: code généré
  const [order, setOrder] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    quantity: 1,
    delivery_address: '',
    client_phone_number: ''
  })
  const [error, setError] = useState(null)
  const [deliveryCode, setDeliveryCode] = useState(null)
  const [paymentPending, setPaymentPending] = useState(false)
  const [amountToDebit, setAmountToDebit] = useState(null)
  const [currencyToDebit, setCurrencyToDebit] = useState('CDF')

  useEffect(() => {
    if (orderIdParam) {
      apiRequest('/api/orders', { method: 'GET' })
        .then((list) => {
          const arr = Array.isArray(list) ? list : list?.data || []
          const found = arr.find((o) => String(o.id) === String(orderIdParam) || String(o.uuid) === String(orderIdParam))
          if (found) {
            setOrder(found)
            setStep(2)
          } else {
            setError('Commande introuvable.')
          }
          setLoading(false)
        })
        .catch(() => {
          setError('Erreur lors du chargement de la commande.')
          setLoading(false)
        })
      return
    }
    if (!menuId) {
      router.push('/client/menus')
      return
    }
    loadMenu()
  }, [menuId, orderIdParam, router])

  function loadMenu(){
    setLoading(true)
    apiRequest(`/api/menus/${menuId}`, { method: 'GET' })
      .then(r => {
        setMenu(r)
        setLoading(false)
      })
      .catch(() => {
        setError('Menu introuvable')
        setLoading(false)
      })
  }

  function handleCreateOrder(e){
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const orderData = {
      items: [{
        menu_id: parseInt(menuId),
        quantity: parseInt(formData.quantity),
        price: menu?.price
      }],
      delivery_address: formData.delivery_address
    }

    apiRequest('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    })
      .then(orderResponse => {
        setOrder(orderResponse)
        setStep(2) // Passer à l'étape paiement
        setSubmitting(false)
      })
      .catch(err => {
        setError(err.message || 'Erreur lors de la création de la commande')
        setSubmitting(false)
      })
  }

  function startPollingOrderStatus(orderId) {
    const maxAttempts = 60
    let attempts = 0
    const interval = setInterval(() => {
      attempts++
      apiRequest('/api/orders', { method: 'GET' })
        .then(orders => {
          const list = Array.isArray(orders) ? orders : orders?.data || []
          const o = list.find(or => or.id === orderId || or.uuid === orderId)
          if (o?.delivery_code && o?.status !== 'pending_payment') {
            clearInterval(interval)
            setPaymentPending(false)
            setDeliveryCode(o.delivery_code)
            setOrder(o)
            setStep(3)
          }
        })
        .catch(() => {})
      if (attempts >= maxAttempts) clearInterval(interval)
    }, 3000)
  }

  function normalizePhoneForDRC(value) {
    const cleaned = String(value).replace(/[\s\-\(\)]/g, '').replace(/^0+/, '')
    if (cleaned.startsWith('+')) return cleaned
    if (cleaned.startsWith('243')) return '+' + cleaned
    return '+243' + cleaned
  }

  function handlePayment(){
    if (!order) return

    if (!formData.client_phone_number.trim()) {
      setError('Veuillez entrer votre numéro de téléphone Mobile Money.')
      return
    }

    const prefix = '+243'
    const phoneNumber = normalizePhoneForDRC(formData.client_phone_number)

    // RDC : +243 + 9 chiffres = 12 caractères
    if (!phoneNumber.startsWith(prefix) || phoneNumber.length !== 12 || !/^\+243\d{9}$/.test(phoneNumber)) {
      setError('Numéro invalide. Utilisez exactement 9 chiffres après +243 (ex: +243812345678 ou 0812345678).')
      return
    }

    setSubmitting(true)
    setError(null)

    apiRequest(`/api/orders/${order.id}/initiate-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_phone_number: phoneNumber,
        country_code: 'DRC'
      })
    })
      .then(response => {
        const code = response.delivery_code ?? response.order?.delivery_code
        const completed = response.payment_completed === true || response.payment?.status === 'completed' || !!code
        if (response.amount_to_debit != null) {
          setAmountToDebit(response.amount_to_debit)
          setCurrencyToDebit(response.currency_to_debit || 'CDF')
        }
        if (completed && code) {
          setDeliveryCode(code)
          setStep(3)
          setPaymentPending(false)
        } else {
          setError(null)
          setPaymentPending(true)
          startPollingOrderStatus(order.id)
        }
        setSubmitting(false)
      })
      .catch(err => {
        let msg = err.message || err.error || err.data?.error || 'Erreur lors de l\'initiation du paiement.'
        if (msg.includes('non configuré') || msg.includes('Service de paiement')) {
          msg = 'Le paiement Mobile Money n\'est pas configuré. Contactez l\'administrateur.'
        }
        // Message "destination number invalid" (Shwary/opérateur) : déjà traduit côté backend si besoin
        if (msg.toLowerCase().includes('destination number') || msg.toLowerCase().includes('number you have entered is invalid')) {
          msg = 'Votre opérateur Mobile Money indique que le numéro est invalide. Utilisez exactement 9 chiffres (ex: +243812345678 ou 0812345678). Si le problème persiste après avoir reçu la demande de code sur votre téléphone, contactez le support.'
        }
        setError(msg)
        setSubmitting(false)
      })
  }

  if (loading) {
    return (
      <ReadOnlyGuard allowedActions={['view', 'read', 'order']} showWarning={false}>
        <section className="page-section min-h-screen">
          <div className="container">
            <div className="card text-center py-12">
              <p className="text-white/60">{orderIdParam ? 'Chargement de la commande...' : 'Chargement du menu...'}</p>
            </div>
          </div>
        </section>
      </ReadOnlyGuard>
    )
  }

  if (error && !menu && step === 1) {
    return (
      <ReadOnlyGuard allowedActions={['view', 'read', 'order']} showWarning={false}>
        <section className="page-section min-h-screen">
          <div className="container">
            <div className="card text-center py-12">
              <p className="text-white/60 mb-4">{error}</p>
              <GoldButton href="/client/menus">Retour aux menus</GoldButton>
            </div>
          </div>
        </section>
      </ReadOnlyGuard>
    )
  }

  const total = menu ? (menu.price * formData.quantity) : 0
  const pointsEarned = formData.quantity * 12 // 12 points par plat
  // Devise : priorité order (items.menu) > menu > CDF pour RDC (affichage "Fc")
  const orderCurrency = order?.items?.[0]?.menu?.currency || menu?.currency || 'CDF'
  const formatAmount = (amount, currency) => {
    if (!amount && amount !== 0) return '—'
    const c = (currency || 'CDF').toUpperCase()
    if (c === 'CDF' || c === 'FC') return formatCurrencyCDF(amount)
    return Number(amount).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' ' + (currency || '')
  }

  return (
    <ReadOnlyGuard allowedActions={['view', 'read', 'order']} showWarning={false}>
      <section className="page-section min-h-screen">
        <div className="container">
          <header className="mb-8">
            <h1 className="text-4xl font-bold mb-2" style={{
              background: 'linear-gradient(135deg, #00ffff 0%, #9d4edd 50%, #ff00ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              {step === 1 && 'Passer une commande'}
              {step === 2 && 'Paiement'}
              {step === 3 && 'Commande confirmée'}
            </h1>
            <p className="text-white/70 text-lg">
              {step === 1 && 'Complétez les informations pour finaliser votre commande'}
              {step === 2 && 'Confirmez le paiement pour générer votre code de livraison'}
              {step === 3 && 'Votre code de livraison unique'}
            </p>
          </header>

          <div className="dashboard-grid">
            <ClientSidebar />
            <main className="main-panel">
              {step === 1 && menu && (
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Informations du menu */}
                  <div className="card">
                    <h3 className="text-xl font-semibold mb-4" style={{
                      background: 'linear-gradient(135deg, #00ffff 0%, #ff00ff 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}>
                      Détails du plat
                    </h3>
                    
                    {menu.image && (
                      <div className="mb-4 w-full overflow-hidden bg-slate-700 rounded-2xl h-40 sm:h-52 md:h-64">
                        <Image
                          src={menu.image}
                          alt={menu.title}
                          width={400}
                          height={256}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      </div>
                    )}
                    
                    <h4 className="text-2xl font-bold mb-2">{menu.title}</h4>
                    {menu.description && (
                      <p className="text-white/70 mb-4">{menu.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-bold text-cyan-400">
                        {formatAmount(menu.price, menu.currency || 'CDF')}
                      </span>
                      {menu.status === 'approved' && (
                        <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold">
                          Disponible
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Formulaire de commande */}
                  <div className="card">
                    <h3 className="text-xl font-semibold mb-4" style={{
                      background: 'linear-gradient(135deg, #9d4edd 0%, #00ffff 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}>
                      Informations de commande
                    </h3>

                    <form onSubmit={handleCreateOrder}>
                      {error && (
                        <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                          <p className="text-red-400 text-sm">{error}</p>
                        </div>
                      )}

                      <div className="mb-4">
                        <label className="block text-white/80 mb-2 font-semibold">
                          Quantité
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={formData.quantity}
                          onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 1})}
                          className="w-full"
                          required
                        />
                      </div>

                      <div className="mb-4">
                        <label className="block text-white/80 mb-2 font-semibold">
                          Adresse de livraison *
                        </label>
                        <textarea
                          value={formData.delivery_address}
                          onChange={(e) => setFormData({...formData, delivery_address: e.target.value})}
                          className="w-full"
                          rows="4"
                          placeholder="Entrez votre adresse complète de livraison..."
                          required
                        />
                      </div>

                      <div className="mb-4">
                        <label className="block text-white/80 mb-2 font-semibold">
                          Pays
                        </label>
                        <input
                          type="text"
                          value="🇨🇩 République Démocratique du Congo (CDF)"
                          className="w-full"
                          disabled
                          style={{ cursor: 'not-allowed', opacity: 0.7 }}
                        />
                        <input
                          type="hidden"
                          value="DRC"
                          onChange={() => {}}
                        />
                      </div>

                      <div className="mb-4">
                        <label className="block text-white/80 mb-2 font-semibold">
                          Numéro de téléphone Mobile Money *
                        </label>
                        <div className="flex gap-2">
                          <span className="px-3 py-2 bg-cyan-500/20 text-cyan-400 rounded-l-lg border border-cyan-500/30 border-r-0 flex items-center">
                            +243
                          </span>
                          <input
                            type="tel"
                            value={formData.client_phone_number}
                            onChange={(e) => {
                              // Nettoyer le numéro (enlever les espaces, tirets, etc.)
                              const cleaned = e.target.value.replace(/[\s\-\(\)]/g, '')
                              setFormData({...formData, client_phone_number: cleaned})
                            }}
                            className="flex-1 rounded-r-lg"
                            placeholder="812345678"
                            required
                          />
                        </div>
                        <p className="text-white/50 text-xs mt-1">
                          Exactement 9 chiffres (ex: 812345678). Évite l’erreur « numéro de destination invalide » sur votre téléphone.
                        </p>
                      </div>

                      {/* Récapitulatif de commande */}
                      <div className="mb-6 rounded-xl border border-cyan-500/30 overflow-hidden bg-cyan-500/5">
                        <div className="px-4 py-3 border-b border-cyan-500/20 bg-cyan-500/10">
                          <h4 className="text-sm font-semibold uppercase tracking-wider text-cyan-300">
                            Récapitulatif
                          </h4>
                        </div>
                        <div className="p-5">
                          <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-10 gap-y-5 items-baseline">
                            <dt className="text-white/70 text-sm font-medium">Prix unitaire :</dt>
                            <dd className="text-white font-medium tabular-nums text-right">
                              {formatAmount(menu.price, menu.currency || 'CDF')}
                            </dd>

                            <dt className="text-white/70 text-sm font-medium">Quantité :</dt>
                            <dd className="text-white font-medium tabular-nums text-right">{formData.quantity}</dd>

                            <dt className="text-white/90 font-semibold pt-4 mt-2 border-t border-white/10">Total :</dt>
                            <dd className="text-xl font-bold text-cyan-400 tabular-nums text-right pt-4 mt-2 border-t border-white/10">
                              {formatAmount(total, menu.currency || 'CDF')}
                            </dd>

                            <dt className="text-white/70 text-sm font-medium">Points à gagner :</dt>
                            <dd className="font-semibold text-green-400 tabular-nums text-right">
                              {pointsEarned} pts
                            </dd>
                          </dl>
                        </div>
                        <div className="px-4 py-3 border-t border-cyan-500/20 bg-white/5">
                          <p className="text-white/45 text-xs italic leading-relaxed">
                            Les points seront crédités après validation du code de livraison par le livreur.
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                        <GoldButton type="submit" disabled={submitting} className="sm:flex-none">
                          {submitting ? 'Création...' : 'Créer la commande'}
                        </GoldButton>
                        <Link
                          href="/client/menus"
                          className="inline-flex justify-center items-center px-5 py-2.5 rounded-lg font-semibold bg-white/10 text-white hover:bg-white/20 transition border border-white/20 text-center"
                        >
                          Annuler
                        </Link>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {step === 2 && order && (
                <div className="max-w-2xl mx-auto">
                  <div className="card">
                    <h3 className="text-2xl font-bold mb-6 text-center" style={{
                      background: 'linear-gradient(135deg, #00ffff 0%, #9d4edd 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}>
                      Confirmer le paiement
                    </h3>

                    {error && (
                      <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                        <p className="text-red-400 text-sm">{error}</p>
                      </div>
                    )}

                    {paymentPending && (
                      <div className="mb-4 p-4 bg-amber-500/20 border border-amber-500/50 rounded-lg">
                        <p className="text-amber-300 text-sm font-medium mb-1">
                          Paiement en attente
                        </p>
                        <p className="text-amber-200/90 text-sm">
                          {amountToDebit != null
                            ? `Une demande de ${formatAmount(amountToDebit, currencyToDebit)} a été envoyée à votre numéro. `
                            : ''}
                          Acceptez la transaction sur votre téléphone (Orange Money, M-Pesa…). Cette page se mettra à jour automatiquement une fois le paiement reçu.
                        </p>
                      </div>
                    )}

                    <div className="mb-8 rounded-xl border border-cyan-500/30 overflow-hidden bg-cyan-500/5">
                      <div className="px-4 py-3 border-b border-cyan-500/20 bg-cyan-500/10">
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-cyan-300">
                          Récapitulatif
                        </h4>
                      </div>
                      <div className="p-5 space-y-0">
                        <div className="grid grid-cols-[minmax(0,160px)_1fr] gap-x-6 gap-y-2 items-baseline py-4 first:pt-4 border-b border-white/10">
                          <span className="text-white/60 text-sm shrink-0">N° commande :</span>
                          <span className="text-white font-medium font-mono text-sm tabular-nums break-all">{order.uuid}</span>
                        </div>
                        <div className="grid grid-cols-[minmax(0,160px)_1fr] gap-x-6 gap-y-2 items-baseline py-4 border-b border-white/10">
                          <span className="text-white/60 text-sm shrink-0">Montant total :</span>
                          <span className="text-xl font-bold text-cyan-400 tabular-nums">
                            {formatAmount(order.total_amount, orderCurrency)}
                          </span>
                        </div>
                        <div className="grid grid-cols-[minmax(0,160px)_1fr] gap-x-6 gap-y-2 items-baseline py-4 last:pb-0">
                          <span className="text-white/60 text-sm shrink-0">Points à gagner :</span>
                          <span className="font-semibold text-green-400 tabular-nums">
                            {order.points_earned} pts
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 mb-8 p-5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                      <p className="text-white/80 text-base font-semibold mb-3">
                        Paiement Mobile Money
                      </p>
                      <p className="text-white/60 text-sm leading-relaxed mb-2">
                        Le montant de la commande sera débité en <strong className="text-white/80">FC (CDF)</strong> sur le numéro que vous indiquez. Vous recevrez une demande de paiement (push) sur votre téléphone.
                      </p>
                      <p className="text-white/60 text-sm leading-relaxed">
                        Numéro utilisé : <span className="text-cyan-300 font-mono">{formData.client_phone_number ? normalizePhoneForDRC(formData.client_phone_number) : '…'}</span>. Acceptez la transaction dans votre application (Orange Money, M-Pesa, Airtel Money, etc.).
                      </p>
                    </div>

                    <div className="text-center">
                      <p className="text-white/70 text-sm leading-relaxed mb-8">
                        Cliquez sur le bouton ci-dessous pour initier le paiement Mobile Money.
                      </p>
                      <GoldButton onClick={handlePayment} disabled={submitting || !formData.client_phone_number.trim()}>
                        {submitting ? 'Traitement...' : 'Payer avec Mobile Money'}
                      </GoldButton>
                      <p className="text-white/50 text-xs mt-6">
                        Vous recevrez une notification de confirmation une fois le paiement effectué.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && deliveryCode && (
                <div className="max-w-2xl mx-auto">
                  <div className="card text-center">
                    <div className="text-6xl mb-6">✅</div>
                    <h2 className="text-3xl font-bold mb-4" style={{
                      background: 'linear-gradient(135deg, #00ffff 0%, #9d4edd 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}>
                      Paiement confirmé !
                    </h2>
                    
                    <div className="mb-6 p-6 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-2 border-cyan-500/50 rounded-lg">
                      <p className="text-white/70 mb-2 text-sm">Votre code de livraison unique</p>
                      <p className="text-4xl font-bold text-cyan-400 mb-2" style={{
                        letterSpacing: '4px',
                        fontFamily: 'monospace'
                      }}>
                        {deliveryCode}
                      </p>
                      <p className="text-white/60 text-xs">
                        Présentez ce code au livreur lors de la livraison
                      </p>
                    </div>

                    <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-left">
                      <p className="text-white/80 mb-2">
                        <strong>Prochaines étapes :</strong>
                      </p>
                      <ol className="text-white/70 text-sm space-y-1 list-decimal list-inside">
                        <li>Votre commande sera préparée</li>
                        <li>Un livreur vous contactera</li>
                        <li>Lors de la livraison, présentez votre code : <strong className="text-cyan-400">{deliveryCode}</strong></li>
                        <li>Après validation du code, vous recevrez <strong className="text-green-400">{order?.points_earned || pointsEarned} points</strong></li>
                      </ol>
                    </div>

                    <div className="flex gap-4 justify-center">
                      <GoldButton href="/client/orders">Voir mes commandes</GoldButton>
                      <Link href="/client/menus" className="gold" style={{textDecoration: 'none', display: 'inline-block'}}>
                        Commander autre chose
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      </section>
    </ReadOnlyGuard>
  )
}
