"use client"
import EntrepriseSidebar from '@/components/EntrepriseSidebar'
import GoldButton from '@/components/GoldButton'
import { useCompany } from '@/lib/useCompany'
import { apiRequest, getApiErrorMessage } from '@/lib/api'
import { pushToast } from '@/components/Toaster'
import ConfirmModal from '@/components/ConfirmModal'
import { useEffect, useState, useCallback } from 'react'

const STATUS_LABELS = {
  pending: 'En attente',
  active: 'Actif',
  expired: 'Expiré',
  cancelled: 'Annulé',
}

/** Jours restants avant fin : abonnement actif considéré "en fin de période" si ≤ ce nombre de jours */
const NEARING_END_DAYS = 7

/** Indique si un abonnement actif arrive bientôt à échéance (derniers X jours) */
function isNearingEnd(sub) {
  if (!sub || sub.status !== 'active' || !sub.end_date) return false
  const end = new Date(sub.end_date)
  const now = new Date()
  const daysLeft = Math.ceil((end - now) / (24 * 60 * 60 * 1000))
  return daysLeft <= NEARING_END_DAYS && daysLeft >= 0
}

// Couleurs + effet néon (futuriste)
const BANDEAU_STYLES = {
  green: {
    borderLeft: '4px solid #22c55e',
    borderColor: 'rgba(34,197,94,0.4)',
    backgroundColor: 'rgba(34,197,94,0.08)',
    color: '#86efac',
    boxShadow: '0 0 30px rgba(34,197,94,0.2), inset 0 1px 0 rgba(255,255,255,0.05)',
  },
  orange: {
    borderLeft: '4px solid #f97316',
    borderColor: 'rgba(249,115,22,0.4)',
    backgroundColor: 'rgba(249,115,22,0.08)',
    color: '#fdba74',
    boxShadow: '0 0 30px rgba(249,115,22,0.2), inset 0 1px 0 rgba(255,255,255,0.05)',
  },
  red: {
    borderLeft: '4px solid #ef4444',
    borderColor: 'rgba(239,68,68,0.4)',
    backgroundColor: 'rgba(239,68,68,0.08)',
    color: '#fca5a5',
    boxShadow: '0 0 30px rgba(239,68,68,0.2), inset 0 1px 0 rgba(255,255,255,0.05)',
  },
  amber: {
    borderLeft: '4px solid #f59e0b',
    borderColor: 'rgba(245,158,11,0.4)',
    backgroundColor: 'rgba(245,158,11,0.08)',
    color: '#fcd34d',
    boxShadow: '0 0 25px rgba(245,158,11,0.15), inset 0 1px 0 rgba(255,255,255,0.05)',
  },
  cyan: {
    borderLeft: '4px solid #06b6d4',
    borderColor: 'rgba(6,182,212,0.35)',
    backgroundColor: 'rgba(6,182,212,0.06)',
    color: '#67e8f9',
    boxShadow: '0 0 25px rgba(6,182,212,0.15), inset 0 1px 0 rgba(255,255,255,0.05)',
  },
}

// Bandeau de statut : vert (actif), orange (bientôt expiré), rouge (expiré)
function getSubscriptionStatusDisplay(state, currentSub) {
  const nearingEnd = currentSub && isNearingEnd(currentSub)
  switch (state) {
    case 'active':
      if (nearingEnd) {
        return {
          title: 'Abonnement actif — bientôt à échéance',
          subtitle: 'Votre abonnement arrive à son terme dans les prochains jours.',
          description: 'Pensez à renouveler avant l’échéance pour continuer à bénéficier des livraisons sans interruption.',
          style: BANDEAU_STYLES.orange,
          icon: '⏳',
        }
      }
      return {
        title: 'Abonnement actif',
        subtitle: 'Votre abonnement est en cours.',
        description: 'Les livraisons sont effectuées selon le plan souscrit. Vous avez accès à tous les services inclus.',
        style: BANDEAU_STYLES.green,
        icon: '✓',
      }
    case 'pending':
      return {
        title: 'En attente d’activation',
        subtitle: 'Demande enregistrée — activation par l’administrateur.',
        description: 'Votre demande a bien été reçue. L’abonnement passera à l’état Actif dès que l’administrateur aura confirmé la réception du paiement. Vous recevrez alors l’accès aux livraisons.',
        style: BANDEAU_STYLES.amber,
        icon: '⏳',
      }
    case 'expired':
      return {
        title: 'Abonnement expiré',
        subtitle: 'Échéance dépassée. Cet abonnement restera affiché jusqu’à ce que vous vous réabonniez.',
        description: 'Votre dernier abonnement est arrivé à échéance. Utilisez le bouton « Renouveler » ci-dessous pour créer une nouvelle période ; l’affichage de cet abonnement expiré disparaîtra uniquement après votre réabonnement.',
        style: BANDEAU_STYLES.red,
        icon: '—',
      }
    case 'none':
    default:
      return {
        title: 'Aucun abonnement',
        subtitle: 'Aucune souscription en cours.',
        description: 'Déposez une demande de souscription avec le bouton ci-dessous. Une seule demande active par entreprise ; l’administrateur l’activera après réception du paiement.',
        style: BANDEAU_STYLES.cyan,
        icon: '○',
      }
  }
}

/** Style d’indication par statut : vert (actif), orange (bientôt expiré), rouge (expiré) */
function getSubscriptionItemStyle(sub) {
  if (sub.status === 'expired') {
    return {
      cardStyle: {
        border: '1px solid rgba(239,68,68,0.5)',
        backgroundColor: 'rgba(239,68,68,0.04)',
        boxShadow: '0 0 40px rgba(239,68,68,0.12), inset 0 1px 0 rgba(255,255,255,0.03)',
      },
      badgeStyle: { backgroundColor: 'rgba(239,68,68,0.2)', border: '1px solid #ef4444', color: '#fca5a5', boxShadow: '0 0 15px rgba(239,68,68,0.3)' },
      messageStyle: { color: '#fca5a5' },
    }
  }
  if (sub.status === 'active' && isNearingEnd(sub)) {
    return {
      cardStyle: {
        border: '1px solid rgba(249,115,22,0.5)',
        backgroundColor: 'rgba(249,115,22,0.04)',
        boxShadow: '0 0 40px rgba(249,115,22,0.12), inset 0 1px 0 rgba(255,255,255,0.03)',
      },
      badgeStyle: { backgroundColor: 'rgba(249,115,22,0.2)', border: '1px solid #f97316', color: '#fdba74', boxShadow: '0 0 15px rgba(249,115,22,0.3)' },
      messageStyle: { color: '#fdba74' },
    }
  }
  if (sub.status === 'active') {
    return {
      cardStyle: {
        border: '1px solid rgba(34,197,94,0.5)',
        backgroundColor: 'rgba(34,197,94,0.04)',
        boxShadow: '0 0 40px rgba(34,197,94,0.12), inset 0 1px 0 rgba(255,255,255,0.03)',
      },
      badgeStyle: { backgroundColor: 'rgba(34,197,94,0.2)', border: '1px solid #22c55e', color: '#86efac', boxShadow: '0 0 15px rgba(34,197,94,0.3)' },
      messageStyle: { color: '#86efac' },
    }
  }
  return {
    cardStyle: { border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.02)' },
    badgeStyle: { backgroundColor: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', color: '#fcd34d' },
    messageStyle: { color: '#fcd34d' },
  }
}

export default function EntrepriseSubscriptionsPage() {
  const { company, loading: companyLoading, error: companyError } = useCompany()
  const [subscriptions, setSubscriptions] = useState({ data: [] })
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState(false)
  const [renewingId, setRenewingId] = useState(null)
  const [error, setError] = useState('')
  const [confirmModal, setConfirmModal] = useState(null)

  const loadSubscriptions = useCallback(() => {
    if (!company?.id) return Promise.resolve()
    setLoading(true)
    return apiRequest(`/api/companies/${company.id}/subscriptions`, { method: 'GET' })
      .then((r) => { if (r?.success && r?.data) setSubscriptions(r.data) })
      .catch(() => setSubscriptions({ data: [] }))
      .finally(() => setLoading(false))
  }, [company?.id])

  useEffect(() => {
    loadSubscriptions()
  }, [loadSubscriptions])

  const list = Array.isArray(subscriptions?.data) ? subscriptions.data : []
  const currentSub = list.find((s) => s.status === 'active' || s.status === 'pending')
  const expiredSub = list.find((s) => s.status === 'expired')
  // Nombre d'agents : priorité à la liste (remplie à l'inscription), sinon employee_count
  const agentCount = Array.isArray(company?.pending_employees) && company.pending_employees.length > 0
    ? company.pending_employees.length
    : (company?.employee_count ?? 0)
  // Règle : pas de souscription possible sans liste d'agents enregistrée à la création du compte
  const hasAgentList = agentCount > 0
  const canSubscribe = !currentSub && company?.status === 'active' && hasAgentList
  const canRenew = !currentSub && !!expiredSub

  // État d'abonnement pour affichage clair : none | pending | active | expired
  const subscriptionState = currentSub
    ? (currentSub.status === 'active' ? 'active' : 'pending')
    : expiredSub
      ? 'expired'
      : 'none'
  const statusDisplay = getSubscriptionStatusDisplay(subscriptionState, currentSub)

  async function doSubscribe() {
    if (!company?.id || subscribing) return
    setError('')
    setSubscribing(true)
    try {
      await apiRequest(`/api/companies/${company.id}/subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency: 'USD' }),
      })
      pushToast({ type: 'success', message: 'Demande d\'abonnement créée. L\'admin l\'activera après paiement.' })
      loadSubscriptions()
    } catch (err) {
      const msg = getApiErrorMessage(err) || 'Erreur lors de la souscription.'
      setError(msg)
      pushToast({ type: 'error', message: msg })
      // Si le backend indique qu'un abonnement est déjà en cours, rafraîchir la liste puis effacer l'erreur pour afficher l'état réel
      if (msg.includes('déjà en cours') || msg.includes('already')) {
        loadSubscriptions().then(() => setError(''))
      }
    } finally {
      setSubscribing(false)
    }
  }

  function handleSubscribe() {
    if (!company?.id || subscribing) return
    const montant = agentCount > 0 ? `${30 * agentCount} USD / mois` : ''
    setConfirmModal({
      title: 'Confirmer la souscription',
      message: `Vous allez déposer une demande d'abonnement${montant ? ` pour ${agentCount} agent(s) — ${montant}` : ''}. L'administrateur l'activera après réception du paiement.`,
      variant: 'info',
      confirmLabel: 'Souscrire',
      onConfirm: () => { setConfirmModal(null); doSubscribe() },
    })
  }

  async function doRenew(sub) {
    if (!sub?.id || renewingId) return
    setError('')
    setRenewingId(sub.id)
    try {
      await apiRequest(`/api/subscriptions/${sub.id}/renew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency: 'USD' }),
      })
      pushToast({ type: 'success', message: 'Abonnement renouvelé. En attente d\'activation par l\'admin.' })
      loadSubscriptions()
    } catch (err) {
      const msg = getApiErrorMessage(err) || 'Erreur lors du renouvellement.'
      setError(msg)
      pushToast({ type: 'error', message: msg })
    } finally {
      setRenewingId(null)
    }
  }

  function handleRenew(sub) {
    if (!sub?.id || renewingId) return
    setConfirmModal({
      title: 'Renouveler l\'abonnement',
      message: 'Vous allez créer une nouvelle période d\'abonnement. L\'administrateur devra l\'activer après réception du paiement.',
      variant: 'warning',
      confirmLabel: 'Renouveler',
      onConfirm: () => { setConfirmModal(null); doRenew(sub) },
    })
  }

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—')
  const formatMoney = (v, cur) => (v != null ? Number(v).toLocaleString('fr-FR') + ' ' + (cur || 'USD') : '—')

  const deliveryDaysNote = 'Les livraisons sont assurées sur 20 jours ouvrés par mois (lundi à vendredi), hors week-ends. La période affichée correspond à la durée calendaire de l’abonnement.'

  return (
    <section className="page-section min-h-screen bg-[#0b1220] text-white overflow-hidden">
      <div className="container relative">
        <header className="mb-10 opacity-0 sub-anim-fade-in-up" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
          <h1
            className="text-3xl md:text-5xl font-bold tracking-tight mb-4 bg-clip-text text-transparent"
            style={{
              backgroundImage: 'linear-gradient(90deg, #22d3ee 0%, #06b6d4 35%, #22c55e 70%, #16a34a 100%)',
              backgroundSize: '100% 100%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
            }}
          >
            Abonnements entreprise
          </h1>
          <div className="h-px w-24 rounded-full opacity-60 mb-5" style={{ background: 'linear-gradient(90deg, #22d3ee, #22c55e)' }} />
          <p className="text-white/50 text-sm md:text-base max-w-2xl leading-relaxed tracking-wide">
            Gestion de votre abonnement professionnel. Tarification mensuelle sur la base du nombre d&apos;agents déclarés ; un abonnement actif par entreprise, renouvelable à échéance.
          </p>
        </header>

        <div className="dashboard-grid">
          <EntrepriseSidebar />
          <main className="main-panel">
            <div
              className="rounded-2xl p-6 md:p-8 mb-6 border border-white/10 backdrop-blur-xl opacity-0 sub-anim-fade-in-up"
              style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.06) 0%, rgba(34,197,94,0.04) 50%, rgba(255,255,255,0.02) 100%)', boxShadow: '0 0 60px rgba(0,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)', animationDelay: '100ms', animationFillMode: 'forwards' }}
            >
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400/80 mb-4">Modalités tarifaires</h2>
              <p className="text-white/80 text-sm md:text-base leading-relaxed mb-4">
                Formule Green Express : <strong className="text-white/95">1,50 USD par repas × 20 jours ouvrés × effectif déclaré</strong>. Les <strong className="text-white/95">20 jours ouvrés</strong> correspondent aux jours de livraison du lundi au vendredi (hors week-ends), soit 4 semaines × 5 jours.
              </p>
              {agentCount > 0 ? (
                <div
                  className="p-5 rounded-xl text-sm text-white/90 mb-4 border backdrop-blur-sm"
                  style={{ borderColor: 'rgba(6,182,212,0.3)', background: 'rgba(6,182,212,0.08)', boxShadow: '0 0 25px rgba(6,182,212,0.1)' }}
                >
                  <span className="text-white/60">Pour un effectif de</span> <strong className="text-white">{agentCount} agent(s)</strong> <span className="text-white/60">: 1,50 × 20 × {agentCount} =</span> <strong className="text-cyan-300" style={{ textShadow: '0 0 20px rgba(34,255,255,0.4)' }}>{30 * agentCount} USD / mois</strong>.
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 text-sm mb-4">
                  <strong>Aucune liste d&apos;agents enregistrée.</strong> La souscription n&apos;est possible qu&apos;après enregistrement de la liste des agents (fiche entreprise). Contacter l&apos;administrateur si besoin.
              </div>
              )}
              <p className="text-white/60 text-xs md:text-sm">
                L&apos;effectif retenu est celui validé par l&apos;administrateur. Toute mise à jour relève de l&apos;administration.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm">
                <span className="font-medium">Impossible de finaliser l&apos;opération.</span>
                <p className="mt-1 text-white/90">{error}</p>
              </div>
            )}

            <div
              className="rounded-2xl p-6 md:p-8 border border-white/10 backdrop-blur-xl opacity-0 sub-anim-fade-in-up"
              style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)', boxShadow: '0 0 50px rgba(0,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.03)', animationDelay: '200ms', animationFillMode: 'forwards' }}
            >
              <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <h2 className="text-lg font-semibold text-white tracking-tight" style={{ letterSpacing: '-0.01em' }}>Votre abonnement</h2>
                {canSubscribe && (
                  <GoldButton onClick={handleSubscribe} disabled={subscribing}>
                    {subscribing ? 'Envoi en cours…' : 'Souscrire'}
                  </GoldButton>
                )}
              </div>

              {companyLoading ? (
                <p className="text-white/60">Chargement...</p>
              ) : companyError || !company ? (
                <>
                  <p className="text-white/80 mb-4">{companyError || "Aucune structure associée à ce compte. Votre demande est en cours d'examen."}</p>
                  <GoldButton href="/entreprise">Revenir au tableau de bord</GoldButton>
                </>
              ) : company?.status !== 'active' ? (
                <div className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-200/90 mb-4">
                  <strong className="text-amber-200">Compte en attente de validation</strong>
                  <p className="mt-1 text-sm">Votre compte entreprise doit être validé par l&apos;administrateur avant toute souscription.</p>
                </div>
              ) : !hasAgentList ? (
                <div className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-200/90 mb-4">
                  <strong className="text-amber-200">Souscription impossible</strong>
                  <p className="mt-1 text-sm">Aucune liste d&apos;agents enregistrée à la création du compte. L&apos;administrateur doit compléter la fiche entreprise (liste des agents) pour permettre une souscription.</p>
                </div>
              ) : loading ? (
                <p className="text-white/60">Chargement des abonnements…</p>
              ) : (
                <>
                  {/* Bandeau de statut : vert (actif), orange (bientôt expiré), rouge (expiré) */}
                  <div
                    className="p-5 md:p-6 rounded-2xl border mb-6 backdrop-blur-md transition-all duration-300 opacity-0 sub-bandeau-entrance"
                    style={{
                      borderLeft: statusDisplay.style?.borderLeft,
                      borderColor: statusDisplay.style?.borderColor,
                      backgroundColor: statusDisplay.style?.backgroundColor,
                      boxShadow: statusDisplay.style?.boxShadow,
                    }}
                  >
                    <div className="flex items-start gap-5">
                      <span className="text-3xl md:text-4xl shrink-0 flex items-center justify-center w-14 h-14 rounded-xl border border-white/10 transition-transform duration-300 hover:scale-110" style={{ color: statusDisplay.style?.color, background: 'rgba(255,255,255,0.03)', boxShadow: 'inset 0 0 20px rgba(255,255,255,0.05)' }} aria-hidden>{statusDisplay.icon}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-base md:text-xl font-semibold tracking-tight" style={{ color: statusDisplay.style?.color }}>{statusDisplay.title}</p>
                        {statusDisplay.subtitle && <p className="text-white/60 text-sm mt-1.5">{statusDisplay.subtitle}</p>}
                        <p className="text-white/70 text-sm mt-3 leading-relaxed">{statusDisplay.description}</p>
                      </div>
                    </div>
                  </div>

                  {/* Note sur les 20 jours ouvrés et la période */}
                  <div
                    className="mb-8 p-5 rounded-2xl border border-white/10 text-sm text-white/70 leading-relaxed backdrop-blur-sm opacity-0 sub-anim-fade-in-up"
                    style={{ background: 'rgba(255,255,255,0.03)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)', animationDelay: '400ms', animationFillMode: 'forwards' }}
                  >
                    <p className="text-xs font-bold uppercase tracking-widest text-cyan-400/70 mb-2">Période et jours de livraison</p>
                    <p>{deliveryDaysNote}</p>
                  </div>

                  {subscriptionState === 'none' ? (
                    <p className="text-white/60 text-sm mb-6">
                      Utilisez le bouton « Souscrire » ci-dessus pour déposer une demande d&apos;abonnement.
                    </p>
                  ) : (
                    <ul className="space-y-5 mb-8">
                      {(currentSub ? [currentSub] : expiredSub ? [expiredSub] : list).slice(0, 5).map((sub, index) => {
                        const itemStyle = getSubscriptionItemStyle(sub)
                        const statusLabel = sub.status === 'active' && isNearingEnd(sub) ? 'Bientôt expiré' : (STATUS_LABELS[sub.status] || sub.status)
                        return (
                          <li
                            key={sub.id}
                            className="p-5 md:p-7 rounded-2xl backdrop-blur-md sub-hover-lift opacity-0 sub-anim-card-enter"
                            style={{ ...itemStyle.cardStyle, animationDelay: `${450 + index * 80}ms`, animationFillMode: 'forwards' }}
                          >
                            <div className="flex flex-wrap justify-between gap-4 items-start">
                              <div>
                                <p className="font-semibold text-white">
                                  {(sub.pricing_tier && sub.pricing_tier.plan_name) || 'Green Express'} — {sub.agent_count} agent(s)
                                </p>
                                <p className="text-white/70 text-sm mt-2">
                                  Période : {formatDate(sub.start_date)} → {formatDate(sub.end_date)}
                                </p>
                                <p className="text-white/80 text-sm mt-0.5 font-medium">
                                  {formatMoney(sub.total_monthly_price, sub.currency)} / mois · 20 jours ouvrés (lun.–ven.)
                                </p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg sub-badge-glow" style={itemStyle.badgeStyle}>
                                  {statusLabel}
                                </span>
                                {sub.status === 'expired' && canRenew && (
                                  <button
                                    type="button"
                                    onClick={() => handleRenew(sub)}
                                    disabled={!!renewingId || !!confirmModal}
                                    className="px-4 py-2 rounded-lg text-sm font-medium bg-[#d4af37] text-[#0b1220] hover:bg-[#e5c048] disabled:opacity-50"
                                  >
                                    {renewingId === sub.id ? 'Envoi…' : 'Renouveler'}
                                  </button>
                                )}
                              </div>
                            </div>
                            {sub.status === 'pending' && (
                              <p className="text-amber-200/90 text-sm mt-3 pt-3 border-t border-white/10">Activation par l&apos;administrateur après réception du paiement.</p>
                            )}
                            {sub.status === 'expired' && (
                              <>
                                <p className="text-sm mt-3 pt-3 border-t border-white/10" style={itemStyle.messageStyle}>Échéance dépassée. Utilisez « Renouveler » pour créer une nouvelle période.</p>
                                <p className="text-xs mt-2 opacity-90" style={itemStyle.messageStyle}>Cet abonnement expiré restera affiché ici jusqu’à ce que vous vous réabonniez.</p>
                              </>
                            )}
                            {sub.status === 'active' && (
                              <p className="text-sm mt-3 pt-3 border-t border-white/10" style={itemStyle.messageStyle}>
                                {isNearingEnd(sub) ? 'Votre abonnement arrive à échéance sous peu. Pensez à renouveler.' : 'Livraisons en cours selon le plan (20 jours ouvrés par mois).'}
                              </p>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </>
              )}
              <div className="pt-6 mt-6 border-t border-white/10">
                <GoldButton href="/entreprise" className="shadow-lg hover:shadow-xl transition-shadow">Revenir au tableau de bord</GoldButton>
              </div>
            </div>
          </main>
        </div>
      </div>
      {confirmModal && (
        <ConfirmModal
          {...confirmModal}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </section>
  )
}
