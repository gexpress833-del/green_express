"use client"
import ClientSidebar from '@/components/ClientSidebar'
import ReadOnlyGuard from '@/components/ReadOnlyGuard'
import { useEffect, useState, useCallback } from 'react'
import { apiRequest } from '@/lib/api'
import { formatDate, formatCurrencyCDF } from '@/lib/helpers'
import GoldButton from '@/components/GoldButton'
import Toaster, { pushToast } from '@/components/Toaster'

const STATUS_LABELS = {
  pending: 'En attente',
  active: 'Actif',
  paused: 'En pause',
  rejected: 'Refusé',
  expired: 'Expiré',
  cancelled: 'Annulé',
}

export default function ClientSubscriptions() {
  const [subs, setSubs] = useState([])
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingPlans, setLoadingPlans] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [subscribing, setSubscribing] = useState(false)
  const [subscribeError, setSubscribeError] = useState('')
  const [showPayModal, setShowPayModal] = useState(false)
  const [paySubscription, setPaySubscription] = useState(null)
  const [paySubmitting, setPaySubmitting] = useState(false)
  const [payError, setPayError] = useState('')
  const [payPhone, setPayPhone] = useState('')
  const [payCountry, setPayCountry] = useState('DRC')

  const loadSubs = useCallback(() => {
    setLoading(true)
    apiRequest('/api/subscriptions', { method: 'GET' })
      .then((r) => setSubs(Array.isArray(r) ? r : []))
      .catch(() => setSubs([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadSubs()
  }, [loadSubs])

  useEffect(() => {
    apiRequest('/api/subscription-plans', { method: 'GET' })
      .then((r) => setPlans(Array.isArray(r) ? r : []))
      .catch(() => setPlans([]))
      .finally(() => setLoadingPlans(false))
  }, [])

  const activeSubs = subs.filter((s) => s.status === 'active')
  const alertRenew = activeSubs.some((s) => s.days_until_expiry != null && s.days_until_expiry <= 2)
  const hasOngoing = subs.some((s) => s.status === 'pending' || s.status === 'active')
  const currentSubs = subs.filter((s) => s.status === 'pending' || s.status === 'active')
  const historySubs = subs.filter((s) => !['pending', 'active'].includes(s.status))

  async function handleSubscribe(planId, period) {
    setSubscribeError('')
    setSubscribing(true)
    try {
      await apiRequest('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription_plan_id: planId, period }),
      })
      setShowModal(false)
      loadSubs()
    } catch (err) {
      const msg = err?.data?.message || err?.message || 'Erreur lors de la demande.'
      setSubscribeError(msg)
    } finally {
      setSubscribing(false)
    }
  }

  function getStatusBadge(status) {
    switch (status) {
      case 'active': return 'badge-success'
      case 'rejected': return 'badge-error'
      case 'cancelled': return 'badge-error'
      case 'pending': return 'badge-warning'
      case 'paused': return 'badge-warning'
      case 'expired': return 'badge-warning'
      default: return 'badge-warning'
    }
  }

  function normalizePhone(value) {
    const cleaned = String(value).replace(/[\s\-\(\)]/g, '').replace(/^0+/, '')
    if (cleaned.startsWith('+')) return cleaned
    if (payCountry === 'DRC' && (cleaned.startsWith('243') || !cleaned.startsWith('+'))) return '+243' + cleaned.replace(/^243/, '')
    if (payCountry === 'KE') return '+254' + cleaned.replace(/^254/, '')
    if (payCountry === 'UG') return '+256' + cleaned.replace(/^256/, '')
    return cleaned
  }

  async function handlePayWithMobileMoney() {
    if (!paySubscription) return
    const phone = normalizePhone(payPhone.trim())
    if (!phone || phone.length < 12) {
      setPayError('Entrez un numéro de téléphone Mobile Money valide (ex: +243812345678).')
      return
    }
    setPayError('')
    setPaySubmitting(true)
    try {
      const r = await apiRequest(`/api/subscriptions/${paySubscription.id}/initiate-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_phone_number: phone, country_code: payCountry }),
      })
      setShowPayModal(false)
      setPaySubscription(null)
      setPayPhone('')
      loadSubs()
      pushToast({ type: 'success', message: r?.message || (r?.payment_completed ? 'Abonnement activé.' : 'Paiement initié.') })
    } catch (err) {
      setPayError(err?.data?.message || err?.message || 'Erreur lors du paiement.')
    } finally {
      setPaySubmitting(false)
    }
  }

  return (
    <ReadOnlyGuard allowedActions={['view', 'read', 'subscribe']} showWarning={false}>
      <section className="page-section min-h-screen bg-[#0b1220]">
        <div className="container">
          <header className="mb-6 sm:mb-8 fade-in">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-2 break-words" style={{
              background: 'linear-gradient(135deg, #00ffff 0%, #9d4edd 50%, #ff00ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Mes abonnements
            </h1>
            <p className="text-white/80 text-base sm:text-lg md:text-xl leading-relaxed max-w-2xl">Choisissez un plan et payez par Mobile Money. Notre équipe validera ensuite votre abonnement. Vous pouvez suivre l’état de votre demande ici.</p>
          </header>

          <div className="dashboard-grid">
            <ClientSidebar />
            <main className="main-panel">
              {alertRenew && (
                <div className="mb-4 sm:mb-6 p-4 sm:p-5 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-200 flex items-center gap-4">
                  <span className="text-3xl">⚠️</span>
                  <div>
                    <strong className="text-base sm:text-lg">Réabonnement recommandé</strong>
                    <p className="text-sm sm:text-base mt-1">Il reste 2 jours ou moins sur l'un de vos abonnements. Pensez à renouveler pour ne pas être interrompu.</p>
                  </div>
                </div>
              )}

              {hasOngoing && (
                <div className="mb-4 sm:mb-6 p-4 sm:p-5 rounded-xl bg-cyan-500/20 border border-cyan-500/50 text-cyan-200 flex items-center gap-4">
                  <span className="text-3xl">ℹ️</span>
                  <div>
                    <strong className="text-base sm:text-lg">Abonnement en cours</strong>
                    <p className="text-sm sm:text-base mt-1">Vous avez déjà un abonnement en attente ou actif. Une nouvelle demande n'est possible qu'une fois l'abonnement actuel expiré ou traité par notre équipe.</p>
                  </div>
                </div>
              )}

              {loading ? (
                <div className="card text-center py-12">
                  <p className="text-white/60">Chargement...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center gap-3 justify-end">
                    {hasOngoing && (
                      <span className="text-white/50 text-sm sm:text-base">Un abonnement est déjà en cours.</span>
                    )}
                    <GoldButton onClick={() => setShowModal(true)} disabled={hasOngoing}>
                      + Demander un abonnement
                    </GoldButton>
                  </div>

                  <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 break-words" style={{
                    background: 'linear-gradient(135deg, #00ffff 0%, #9d4edd 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}>
                    Mon abonnement en cours
                  </h2>
                  {currentSubs.length === 0 ? (
                    <div className="card text-center py-10 sm:py-14 px-4 sm:px-6">
                      <div className="text-5xl sm:text-6xl mb-4 sm:mb-5">💳</div>
                      <p className="text-white/90 text-lg sm:text-xl font-semibold mb-2">Aucun abonnement actif</p>
                      <p className="text-white/60 text-sm sm:text-base mb-6 max-w-md mx-auto">Choisissez un plan ci-dessus et payez par Mobile Money. Après validation par notre équipe, votre abonnement apparaîtra ici.</p>
                      <GoldButton onClick={() => !hasOngoing && setShowModal(true)} disabled={hasOngoing}>
                        Demander un abonnement
                      </GoldButton>
                    </div>
                  ) : (
                    currentSubs.map((s) => (
                      <div key={s.id} className="card p-4 sm:p-6 border border-white/10 shadow-lg">
                        <div className="flex flex-wrap justify-between items-start gap-3 sm:gap-4">
                          <div className="min-w-0 flex-1">
                            <h3 className="text-base sm:text-xl font-bold text-cyan-400 break-words">{s.plan || 'Abonnement'}</h3>
                            <p className="text-white/70 text-sm sm:text-base mt-2">Demandé le {formatDate(s.created_at)}</p>
                            {s.status === 'active' && s.started_at && (
                              <p className="text-white/70 text-sm sm:text-base mt-1">Début de l'abonnement : {formatDate(s.started_at)}</p>
                            )}
                            <p className="text-white/90 text-base sm:text-lg font-semibold mt-2">
                              {formatCurrencyCDF(Number(s.price))}
                              {s.period === 'week' ? ' par semaine' : ' par mois'}
                            </p>
                            {s.status === 'active' && s.expires_at && (
                              <p className="text-white/70 text-sm sm:text-base mt-2">
                                Expire le {formatDate(s.expires_at)}
                                {s.days_until_expiry != null && (
                                  <span className="ml-2">({s.days_until_expiry} jour{s.days_until_expiry !== 1 ? 's' : ''} restant{s.days_until_expiry !== 1 ? 's' : ''})</span>
                                )}
                              </p>
                            )}
                            {s.status === 'rejected' && s.rejected_reason && (
                              <p className="text-red-300/90 text-sm sm:text-base mt-2 break-words">Motif : {(s.rejected_reason || '').replace(/\bpaiment\b/gi, 'paiement')}</p>
                            )}
                            {s.status === 'pending' && (
                              <>
                                <p className="text-amber-300/90 text-base mt-2">En attente de validation après paiement.</p>
                                {s.has_payment_received && (
                                  <p className="text-green-300/90 text-base mt-1">Paiement reçu — votre abonnement sera activé après vérification par notre équipe.</p>
                                )}
                                <button
                                  type="button"
                                  onClick={() => { setPaySubscription(s); setShowPayModal(true); setPayError(''); setPayPhone(''); }}
                                  className="mt-4 px-5 py-2.5 rounded-lg text-base font-medium bg-[#d4af37] text-[#0b1220] hover:bg-[#e5c048] transition"
                                >
                                  Payer avec Mobile Money
                                </button>
                              </>
                            )}
                          </div>
                          <span className={`badge ${getStatusBadge(s.status)}`}>
                            {STATUS_LABELS[s.status] || s.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}

                  {historySubs.length > 0 && (
                    <>
                      <h2 className="text-base sm:text-lg md:text-xl font-bold text-white mb-3 sm:mb-4 mt-8 sm:mt-10 leading-tight" style={{
                      background: 'linear-gradient(135deg, #9d4edd 0%, #00ffff 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}>
                        Historique de mes{'\u00A0'}abonnements
                      </h2>
                      <div className="space-y-3">
                        {historySubs.map((s) => (
                          <div key={s.id} className="card p-3 sm:p-4 border border-white/10 opacity-90">
                            <div className="flex flex-wrap justify-between items-start gap-3 sm:gap-4">
                              <div className="min-w-0 flex-1">
                                <h3 className="font-semibold text-white/90 text-sm sm:text-base break-words">{s.plan || 'Abonnement'}</h3>
                                <p className="text-white/60 text-xs sm:text-sm mt-1 break-words">{formatDate(s.created_at)} — {formatCurrencyCDF(Number(s.price))} ({s.period === 'week' ? 'semaine' : 'mois'})</p>
                                {s.rejected_reason && <p className="text-red-300/80 text-xs sm:text-sm mt-1 break-words">Motif : {(s.rejected_reason || '').replace(/\bpaiment\b/gi, 'paiement')}</p>}
                                {s.expires_at && (s.status === 'expired' || s.status === 'cancelled') && (
                                  <p className="text-white/50 text-xs mt-1">Expiré le {formatDate(s.expires_at)}</p>
                                )}
                              </div>
                              <span className={`badge ${getStatusBadge(s.status)}`}>{STATUS_LABELS[s.status] || s.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </main>
          </div>
        </div>
      </section>

      {/* Modal Payer avec Mobile Money (abonnement en attente) */}
      {showPayModal && paySubscription && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
          onClick={() => !paySubmitting && (setShowPayModal(false), setPaySubscription(null), setPayError(''))}
        >
          <div
            className="bg-[#0b1220] border border-white/20 rounded-2xl max-w-md w-full p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold text-white mb-2">Payer avec Mobile Money</h3>
            <p className="text-white/70 text-base mb-4">
              {paySubscription.plan} — {formatCurrencyCDF(Number(paySubscription.price))} ({paySubscription.period === 'week' ? 'semaine' : 'mois'})
            </p>
            {payError && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 text-sm">{payError}</div>
            )}
            <div className="space-y-6">
              <div>
                <label className="block text-white/80 text-base mb-2">Pays</label>
                <select
                  value={payCountry}
                  onChange={(e) => setPayCountry(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
                >
                  <option value="DRC">RDC (+243)</option>
                  <option value="KE">Kenya (+254)</option>
                  <option value="UG">Ouganda (+256)</option>
                </select>
              </div>
              <div>
                <label className="block text-white/80 text-base mb-2">Numéro Mobile Money</label>
                <input
                  type="tel"
                  value={payPhone}
                  onChange={(e) => setPayPhone(e.target.value)}
                  placeholder="+243812345678"
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => !paySubmitting && (setShowPayModal(false), setPaySubscription(null), setPayError(''))}
                  className="px-4 py-2 rounded-lg border border-white/30 text-white/90 hover:bg-white/10"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handlePayWithMobileMoney}
                  disabled={paySubmitting}
                  className="px-4 py-2 rounded-lg bg-[#d4af37] text-[#0b1220] font-semibold hover:bg-[#e5c048] disabled:opacity-50"
                >
                  {paySubmitting ? 'Envoi…' : 'Envoyer le lien de paiement'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Choisir un plan (définis par l'admin) */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
          onClick={() => !subscribing && setShowModal(false)}
        >
          <div
            className="bg-[#0b1220] border border-white/20 rounded-2xl max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold text-white mb-2">Choisir un abonnement</h3>
            <p className="text-white/70 text-base mb-4">Votre demande sera en attente. Après paiement, notre équipe validera votre abonnement.</p>
            {subscribeError && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 text-sm">
                {subscribeError}
              </div>
            )}
            {loadingPlans ? (
              <p className="text-white/50">Chargement des plans...</p>
            ) : plans.length === 0 ? (
              <p className="text-white/50">Aucun plan disponible. Contactez l'administrateur.</p>
            ) : (
              <div className="space-y-6">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className="p-4 rounded-xl bg-white/5 border border-white/10"
                  >
                    <div className="font-semibold text-white">{plan.name}</div>
                    {plan.description && (
                      <div className="text-white/60 text-sm mt-1">{plan.description}</div>
                    )}
                    <div className="flex flex-wrap gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => handleSubscribe(plan.id, 'week')}
                        disabled={subscribing}
                        className="px-3 py-2 rounded-lg text-sm font-medium bg-white/10 border border-white/20 text-white hover:bg-white/15 disabled:opacity-50"
                      >
                        {formatCurrencyCDF(plan.price_week)} / semaine
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSubscribe(plan.id, 'month')}
                        disabled={subscribing}
                        className="px-3 py-2 rounded-lg text-sm font-semibold bg-[#d4af37] text-[#0b1220] hover:bg-[#e5c048] disabled:opacity-50"
                      >
                        {formatCurrencyCDF(plan.price_month)} / mois
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => !subscribing && setShowModal(false)}
                className="px-4 py-2 rounded-lg border border-white/30 text-white/90 hover:bg-white/10 transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </ReadOnlyGuard>
  )
}
