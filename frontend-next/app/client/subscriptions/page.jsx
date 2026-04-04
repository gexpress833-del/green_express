"use client"
import ClientSubpageHeader from '@/components/ClientSubpageHeader'
import SubscriptionPlanShowcase from '@/components/SubscriptionPlanShowcase'
import ReadOnlyGuard from '@/components/ReadOnlyGuard'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { apiRequest } from '@/lib/api'
import { formatCurrencyCDF } from '@/lib/helpers'
import GoldButton from '@/components/GoldButton'
import ClientOngoingSubscriptionCard from '@/components/ClientOngoingSubscriptionCard'
import { pushToast } from '@/components/Toaster'
import PaymentMethodsBanner from '@/components/PaymentMethodsBanner'
import { PROVIDER_OPTIONS } from '@/lib/rdcMobileMoneyProviders'
import { analyzeRdcMobileMoneyPhone, buildRdcOperatorHint } from '@/lib/phoneRdc'

function getDefaultProvider(country) {
  const options = PROVIDER_OPTIONS[country] || []
  return options[0]?.value || ''
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
  const [payProvider, setPayProvider] = useState('')

  function isValidPhoneForCountry(phone, country) {
    const digits = String(phone || '').replace(/\D/g, '')
    if (country === 'DRC') return /^243(8|9)\d{8}$/.test(digits)
    return digits.length >= 9
  }

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
    if (typeof window === 'undefined') return
    const scrollRenew = () => {
      if (window.location.hash === '#renew') {
        document.getElementById('renew')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
    scrollRenew()
    window.addEventListener('hashchange', scrollRenew)
    return () => window.removeEventListener('hashchange', scrollRenew)
  }, [loading, subs])

  useEffect(() => {
    apiRequest('/api/subscription-plans', { method: 'GET' })
      .then((r) => setPlans(Array.isArray(r) ? r : []))
      .catch(() => setPlans([]))
      .finally(() => setLoadingPlans(false))
  }, [])

  useEffect(() => {
    if (payCountry === 'DRC') {
      setPayProvider('')
      return
    }

    setPayProvider((current) => current || getDefaultProvider(payCountry))
  }, [payCountry])

  const activeSubs = subs.filter((s) => s.status === 'active')
  const alertRenew = activeSubs.some((s) => s.days_until_expiry != null && s.days_until_expiry <= 2)
  const hasOngoing = subs.some((s) => ['pending', 'scheduled', 'active'].includes(s.status))
  const currentSubs = subs.filter((s) => ['pending', 'scheduled', 'active'].includes(s.status))

  const payPhoneAnalysis = useMemo(() => analyzeRdcMobileMoneyPhone(payPhone), [payPhone])
  const payOperatorOptions = useMemo(() => PROVIDER_OPTIONS[payCountry] || [], [payCountry])
  const payOperatorHint = useMemo(
    () =>
      buildRdcOperatorHint({
        country: payCountry,
        rawPhone: payPhone,
        phoneAnalysis: payPhoneAnalysis,
        provider: payProvider,
        providerOptions: payOperatorOptions,
      }),
    [payCountry, payPhone, payPhoneAnalysis, payProvider, payOperatorOptions],
  )

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
      pushToast({
        type: 'success',
        message:
          'Demande d’abonnement hebdomadaire enregistrée. Procédez au paiement Mobile Money si demandé.',
      })
    } catch (err) {
      const msg = err?.data?.message || err?.message || 'Erreur lors de la demande.'
      setSubscribeError(msg)
    } finally {
      setSubscribing(false)
    }
  }

  function normalizePhone(value) {
    const cleaned = String(value).replace(/[\s\-()]/g, '').replace(/^0+/, '')
    if (cleaned.startsWith('+')) return cleaned
    if (payCountry === 'DRC' && (cleaned.startsWith('243') || !cleaned.startsWith('+'))) return '+243' + cleaned.replace(/^243/, '')
    return cleaned
  }

  async function handlePayWithMobileMoney() {
    if (!paySubscription) return
    const phone = normalizePhone(payPhone.trim())
    if (!isValidPhoneForCountry(phone, payCountry)) {
      setPayError('Entrez un numéro de téléphone Mobile Money valide (ex: +243812345678).')
      return
    }
    setPayError('')
    setPaySubmitting(true)
    try {
      const payload = { client_phone_number: phone, country_code: payCountry }
      if (payProvider) payload.provider = payProvider

      const r = await apiRequest(`/api/subscriptions/${paySubscription.id}/initiate-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      setShowPayModal(false)
      setPaySubscription(null)
      setPayPhone('')
      setPayProvider('')
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
      <section className="client-subscriptions-page page-section page-section--admin-tight min-h-screen bg-[#0b1220] text-white">
        <div className="mx-auto w-full max-w-6xl px-0 sm:px-0">
          <ClientSubpageHeader
            title="Mes abonnements repas"
            subtitle="Formule hebdomadaire (lundi–vendredi) : souscription, paiement Mobile Money et suivi — même page, étapes guidées ci-dessous."
            icon="💳"
          />

          <div className="card mb-6 p-4 sm:p-5 border border-cyan-500/25 bg-cyan-500/5 text-center sm:text-left">
            <p className="text-white/90 text-sm sm:text-base leading-relaxed m-0">
              <strong className="text-cyan-300">Validation par l’équipe :</strong> après souscription, votre demande est
              <strong> en attente d’approbation</strong> par un administrateur (vérification du paiement Mobile Money).
              Vous ne pouvez pas <strong>mettre en pause</strong> ni <strong>résilier vous-même</strong> un abonnement en cours — seul l’administrateur peut approuver, refuser ou annuler. Pour toute question, contactez le support.
            </p>
            <div className="mt-4 pt-4 border-t border-cyan-500/25 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 items-center sm:items-stretch">
              <GoldButton href="/client/subscriptions/historique" className="!inline-flex items-center justify-center gap-2 shrink-0 px-5 py-3 text-[15px] shadow-[0_4px_20px_rgba(212,175,55,0.35)]">
                <span aria-hidden>📜</span>
                Historique des abonnements
              </GoldButton>
              <p className="text-white/80 text-sm m-0 leading-relaxed">
                Dossiers refusés, expirés ou clôturés — retrait ou effacement possible sur cette page.
              </p>
            </div>
          </div>

          <div id="renew" className="scroll-mt-20 sm:scroll-mt-24 space-y-6">
              {alertRenew && (
                <div className="mb-0 p-4 sm:p-5 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-200 flex items-center gap-4">
                  <span className="text-3xl">⚠️</span>
                  <div>
                    <strong className="text-base sm:text-lg">Réabonnement recommandé</strong>
                    <p className="text-sm sm:text-base mt-1">Il reste 2 jours ou moins sur l'un de vos abonnements. Pensez à renouveler pour ne pas être interrompu.</p>
                    <p className="text-sm mt-2 text-amber-100/90"><strong>Et maintenant ?</strong> Ouvrez « Payer » sur votre abonnement ou contactez le support si le paiement est déjà fait.</p>
                  </div>
                </div>
              )}

              {hasOngoing && (
                <div className="mb-0 p-4 sm:p-5 rounded-xl bg-cyan-500/20 border border-cyan-500/50 text-cyan-200 flex items-center gap-4">
                  <span className="text-3xl">ℹ️</span>
                  <div>
                    <strong className="text-base sm:text-lg">Abonnement en cours</strong>
                    <p className="text-sm sm:text-base mt-1">Vous avez déjà un abonnement en attente ou actif. Une nouvelle demande n'est possible qu'une fois l'abonnement actuel expiré ou traité par notre équipe.</p>
                    <p className="text-sm mt-2 text-cyan-100/90"><strong>Et maintenant ?</strong> Si c’est en attente de paiement, utilisez « Payer avec Mobile Money » sur la carte ci-dessous.</p>
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
                      <p className="text-white/60 text-sm sm:text-base mb-6 max-w-md mx-auto">Choisissez un plan ci-dessous (formules), lancez votre paiement Mobile Money. Après validation par notre équipe, votre abonnement apparaîtra ici.</p>
                      <GoldButton onClick={() => !hasOngoing && setShowModal(true)} disabled={hasOngoing}>
                        Demander un abonnement
                      </GoldButton>
                    </div>
                  ) : (
                    currentSubs.map((s) => (
                      <ClientOngoingSubscriptionCard
                        key={s.id}
                        subscription={s}
                        onPayClick={(sub) => {
                          setPaySubscription(sub)
                          setShowPayModal(true)
                          setPayError('')
                          setPayPhone('')
                          setPayProvider('')
                        }}
                      />
                    ))
                  )}
                </div>
              )}
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-white mt-10 mb-4 break-words" style={{
            background: 'linear-gradient(135deg, #9d4edd 0%, #00ffff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Formules et souscription
          </h2>
          <p className="text-white/65 text-sm mb-4 max-w-2xl">
            Si vous n&apos;avez pas encore d&apos;abonnement actif, choisissez une formule ici. Si un abonnement est déjà en cours, la souscription est désactivée jusqu&apos;à la fin de la période en cours.
          </p>
          <PaymentMethodsBanner className="mb-6 max-w-2xl" showHeading />
          <SubscriptionPlanShowcase
            plans={plans}
            loading={loadingPlans}
            disabled={hasOngoing}
            subscribing={subscribing}
            onSubscribeWeek={(planId) => handleSubscribe(planId, 'week')}
          />
        </div>
      </section>

      {/* Modal Payer avec Mobile Money (abonnement en attente) */}
      {showPayModal && paySubscription && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-black/70"
          onClick={() => !paySubmitting && (setShowPayModal(false), setPaySubscription(null), setPayError(''))}
        >
          <div className="flex min-h-full items-center justify-center p-4 py-8 sm:py-10">
            <div
              className="bg-[#0b1220] border border-white/20 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-xl max-h-[min(90vh,100%)] overflow-y-auto overscroll-contain flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
            <h3 className="text-xl font-semibold text-white mb-2">Payer avec Mobile Money</h3>
            <p className="text-white/70 text-base mb-3">
              {paySubscription.plan} — {formatCurrencyCDF(Number(paySubscription.price))}
              <span className="block text-white/50 text-sm mt-1">Formule hebdomadaire (lun–ven)</span>
            </p>
            <PaymentMethodsBanner compact className="mb-4" />
            <ol className="text-white/75 text-sm space-y-1.5 mb-4 list-decimal list-inside border border-white/10 rounded-lg p-3 bg-white/5">
              <li>Vérifiez le montant ci-dessus</li>
              <li>Indiquez votre numéro Mobile Money</li>
              <li>Appuyez sur « Lancer le paiement »</li>
              <li><strong className="text-cyan-300">Validez sur votre téléphone</strong> — en général moins de 2 minutes</li>
            </ol>
            {payError && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 text-sm">{payError}</div>
            )}
            <div className="space-y-4 sm:space-y-5">
              <p className="text-white/60 text-sm">
                Paiement sécurisé par <strong className="text-cyan-200/90">Mobile Money</strong> (RDC).
              </p>
              <div>
                <label className="block text-white/80 text-base mb-2">Pays</label>
                <div className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-white/90 text-sm">
                  RDC (+243)
                </div>
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
                {payOperatorHint && (
                  <p
                    className={`text-xs mt-2 ${
                      payOperatorHint.type === 'ok'
                        ? 'text-cyan-300/90'
                        : payOperatorHint.type === 'warn'
                          ? 'text-amber-200/90'
                          : payOperatorHint.type === 'manual'
                            ? 'text-white/65'
                            : 'text-white/45'
                    }`}
                  >
                    {payOperatorHint.text}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-white/80 text-base mb-2">Opérateur</label>
                <select
                  value={payProvider}
                  onChange={(e) => setPayProvider(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
                >
                  {(PROVIDER_OPTIONS[payCountry] || []).map((option) => (
                    <option key={option.value || 'auto'} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="text-white/60 text-xs mt-2">
                  L&apos;opérateur est déduit automatiquement des premiers chiffres de votre numéro. Le menu sert de rappel ; en cas d&apos;échec, choisissez explicitement Vodacom, Airtel, Orange ou Afrimoney.
                </p>
              </div>
              <div className="flex gap-2 justify-end pt-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => !paySubmitting && (setShowPayModal(false), setPaySubscription(null), setPayError(''))}
                  className="min-h-[44px] px-4 py-2 rounded-lg border border-white/30 text-white/90 hover:bg-white/10"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handlePayWithMobileMoney}
                  disabled={paySubmitting}
                  className="min-h-[44px] px-4 py-2 rounded-lg bg-[#d4af37] text-[#0b1220] font-semibold hover:bg-[#e5c048] disabled:opacity-50"
                >
                  {paySubmitting ? 'Envoi…' : 'Lancer le paiement'}
                </button>
              </div>
              <p className="text-white/45 text-xs mt-2 text-center shrink-0">
                Après l’envoi, une demande peut s’afficher sur votre téléphone — acceptez pour confirmer.
              </p>
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
                    {Array.isArray(plan.meal_types) && plan.meal_types.length > 0 && (
                      <p className="text-white/45 text-xs mt-2">
                        {plan.meal_types.map((m) => m.label).join(' · ')}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => handleSubscribe(plan.id, 'week')}
                        disabled={subscribing}
                        className="px-3 py-2 rounded-lg text-sm font-semibold bg-[#d4af37] text-[#0b1220] hover:bg-[#e5c048] disabled:opacity-50"
                      >
                        {formatCurrencyCDF(plan.price_week)} / semaine (5 j. ouvrés)
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
