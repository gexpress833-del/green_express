'use client'

import { formatDate, formatCurrencyCDF } from '@/lib/helpers'

const STATUS_LABELS = {
  pending: 'En attente',
  active: 'Actif',
  paused: 'En pause',
  rejected: 'Refusé',
  expired: 'Expiré',
  cancelled: 'Annulé',
}

function getStatusBadge(status) {
  switch (status) {
    case 'active':
      return 'badge-success'
    case 'rejected':
    case 'cancelled':
      return 'badge-error'
    case 'pending':
    case 'paused':
    case 'expired':
      return 'badge-warning'
    default:
      return 'badge-warning'
  }
}

const WORK_DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven']

function getTodayWorkIndex() {
  const d = new Date().getDay()
  if (d >= 1 && d <= 5) return d - 1
  return -1
}

/**
 * Carte riche pour l’abonnement en cours (pending / active), formule décrite en hebdomadaire uniquement.
 */
export default function ClientOngoingSubscriptionCard({ subscription: s, onPayClick }) {
  const plan = s.subscription_plan
  const items = Array.isArray(plan?.items) ? plan.items.slice(0, 6) : []
  const isActive = s.status === 'active'
  const isPending = s.status === 'pending'
  const todayIdx = getTodayWorkIndex()
  const modifier = isActive ? 'client-sub-ongoing--active' : isPending ? 'client-sub-ongoing--pending' : 'client-sub-ongoing--neutral'

  return (
    <article className={`client-sub-ongoing ${modifier}`}>
      <div className="client-sub-ongoing__glow" aria-hidden />
      <span className={`client-sub-ongoing__badge badge ${getStatusBadge(s.status)}`}>
        {STATUS_LABELS[s.status] || s.status}
      </span>

      <div className="client-sub-ongoing__hero">
        <p className="client-sub-ongoing__eyebrow">
          {isActive ? 'Abonnement actif' : isPending ? 'Demande en cours' : 'Votre formule'}
        </p>
        <h3 className="client-sub-ongoing__title">{s.plan || 'Abonnement'}</h3>

        <div className="client-sub-ongoing__week" aria-label="Rythme sur la semaine ouvrée">
          {WORK_DAYS.map((label, i) => (
            <span
              key={label}
              className={`client-sub-ongoing__day${todayIdx === i ? ' client-sub-ongoing__day--today' : ''}`}
            >
              {label}
            </span>
          ))}
        </div>

        <div className="client-sub-ongoing__visual">
          {items.length > 0 ? (
            <div className="client-sub-ongoing__thumbs">
              {items.map((it) => (
                <div key={it.id} className="client-sub-ongoing__thumb-wrap" title={it.title || ''}>
                  {it.image ? (
                    <img src={it.image} alt="" className="client-sub-ongoing__thumb-img" loading="lazy" />
                  ) : (
                    <span className="client-sub-ongoing__thumb-fallback" aria-hidden>
                      🍽️
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="client-sub-ongoing__placeholder" aria-hidden>
              <span className="client-sub-ongoing__placeholder-icon">🥗</span>
              <span className="client-sub-ongoing__placeholder-ring" />
            </div>
          )}
        </div>

        <div className="client-sub-ongoing__price-block">
          <span className="client-sub-ongoing__price">{formatCurrencyCDF(Number(s.price))}</span>
          <span className="client-sub-ongoing__price-hint">par semaine · 5 jours ouvrés (lun–ven)</span>
        </div>
      </div>

      <div className="client-sub-ongoing__chips">
        <span className="client-sub-ongoing__chip">
          <span className="client-sub-ongoing__chip-k">Demandé</span>
          <span className="client-sub-ongoing__chip-v">{formatDate(s.created_at)}</span>
        </span>
        {isActive && s.started_at && (
          <span className="client-sub-ongoing__chip">
            <span className="client-sub-ongoing__chip-k">Début</span>
            <span className="client-sub-ongoing__chip-v">{formatDate(s.started_at)}</span>
          </span>
        )}
        {isActive && s.expires_at && (
          <span className="client-sub-ongoing__chip client-sub-ongoing__chip--accent">
            <span className="client-sub-ongoing__chip-k">Fin de cycle</span>
            <span className="client-sub-ongoing__chip-v">
              {formatDate(s.expires_at)}
              {s.days_until_expiry != null && (
                <span className="client-sub-ongoing__chip-sub">
                  {' '}
                  ({s.days_until_expiry} jour{s.days_until_expiry !== 1 ? 's' : ''} restant
                  {s.days_until_expiry !== 1 ? 's' : ''})
                </span>
              )}
            </span>
          </span>
        )}
      </div>

      {plan && Array.isArray(plan.meal_types) && plan.meal_types.length > 0 && (
        <div className="client-sub-active-detail client-sub-ongoing__meals">
          <p className="client-sub-active-detail__title">Repas inclus cette semaine</p>
          <ul className="client-sub-active-detail__list">
            {plan.meal_types.map((m, idx) => (
              <li key={idx}>
                {(m.emoji ? `${m.emoji} ` : '')}
                {m.label}
                {m.detail ? ` — ${m.detail}` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}

      {s.status === 'rejected' && s.rejected_reason && (
        <p className="client-sub-ongoing__reject text-red-300/90 text-sm sm:text-base mt-3 break-words">
          Motif : {(s.rejected_reason || '').replace(/\bpaiment\b/gi, 'paiement')}
        </p>
      )}

      {isPending && (
        <div className="client-sub-ongoing__pending">
          <p className="text-amber-200/95 text-base mt-1">En attente de validation après paiement.</p>
          {s.has_payment_received && (
            <p className="text-green-300/90 text-base mt-1">
              Paiement reçu — votre abonnement sera activé après vérification par notre équipe.
            </p>
          )}
          <button
            type="button"
            onClick={() => onPayClick?.(s)}
            className="client-sub-ongoing__pay-btn mt-4 px-5 py-2.5 rounded-lg text-base font-medium bg-[#d4af37] text-[#0b1220] hover:bg-[#e5c048] transition"
          >
            Payer avec Mobile Money
          </button>
        </div>
      )}
    </article>
  )
}
