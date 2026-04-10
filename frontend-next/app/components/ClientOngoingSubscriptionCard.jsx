'use client'

import { useMemo, useState } from 'react'
import { formatDate, formatCurrencyCDF } from '@/lib/helpers'

const STATUS_LABELS = {
  pending: 'En attente de paiement',
  scheduled: 'Planifié',
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
    case 'scheduled':
      return 'badge-scheduled'
    case 'pending':
      return 'badge-sub-pending'
    case 'rejected':
    case 'cancelled':
      return 'badge-error'
    case 'expired':
      return 'badge-expired'
    case 'paused':
      return 'badge-warning'
    default:
      return 'badge-warning'
  }
}

const WORK_DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven']
const WORK_DAYS_FULL = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi']

function getTodayWorkIndex() {
  const d = new Date().getDay()
  if (d >= 1 && d <= 5) return d - 1
  return -1
}

/** Lundi de la semaine civile courante (locale), puis +dayIndex */
function getCalendarDateForWorkday(dayIndex) {
  const now = new Date()
  const dow = now.getDay()
  const mondayOffset = dow === 0 ? -6 : 1 - dow
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset)
  monday.setHours(12, 0, 0, 0)
  const target = new Date(monday)
  target.setDate(monday.getDate() + dayIndex)
  return target
}

const longDateFmt = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

/**
 * Résout le contenu affiché pour un jour donné selon meal_types (1 à N entrées).
 */
function safeEmoji(raw, fallback = '🍽️') {
  if (raw == null || raw === '') return fallback
  const t = String(raw).trim()
  return t || fallback
}

function resolveDayMeals(mealTypes, dayIndex) {
  if (!Array.isArray(mealTypes) || mealTypes.length === 0) {
    return { mode: 'empty', items: [], headline: null }
  }
  if (mealTypes.length >= 5) {
    const m = mealTypes[dayIndex] ?? mealTypes[0]
    return { mode: 'single', items: m ? [m] : [], headline: 'Menu du jour' }
  }
  if (mealTypes.length === 1) {
    return { mode: 'single', items: [mealTypes[0]], headline: 'Votre formule' }
  }
  return { mode: 'multi', items: mealTypes, headline: 'Temps forts du jour' }
}

/**
 * Carte abonnement (pending / scheduled / active), formule hebdomadaire.
 */
export default function ClientOngoingSubscriptionCard({ subscription: s, onPayClick }) {
  const plan = s.subscription_plan
  const items = useMemo(
    () => (Array.isArray(plan?.items) ? plan.items.slice(0, 6) : []),
    [plan?.items]
  )
  const mealTypes = plan?.meal_types
  const isActive = s.status === 'active'
  const isPending = s.status === 'pending'
  const isScheduled = s.status === 'scheduled'
  const todayIdx = getTodayWorkIndex()
  const [selectedDayIdx, setSelectedDayIdx] = useState(() => (todayIdx >= 0 ? todayIdx : 0))

  const dayResolved = useMemo(
    () => resolveDayMeals(Array.isArray(mealTypes) ? mealTypes : [], selectedDayIdx),
    [mealTypes, selectedDayIdx]
  )

  const selectedDateLabel = useMemo(() => {
    const raw = longDateFmt.format(getCalendarDateForWorkday(selectedDayIdx))
    return raw.charAt(0).toUpperCase() + raw.slice(1)
  }, [selectedDayIdx])

  const heroItem = useMemo(() => {
    if (!items.length) return null
    return items[selectedDayIdx % items.length]
  }, [items, selectedDayIdx])

  const showDayplate = Array.isArray(mealTypes) && mealTypes.length > 0 && dayResolved.mode !== 'empty'

  const modifier = isActive
    ? 'client-sub-ongoing--active'
    : isPending
      ? 'client-sub-ongoing--pending'
      : isScheduled
        ? 'client-sub-ongoing--scheduled'
        : 'client-sub-ongoing--neutral'

  const statusLine = () => {
    if (isPending) {
      return (
        <p className="text-orange-300/95 text-base mt-3 font-medium">
          Paiement en cours de confirmation… Complétez le paiement Mobile Money si ce n&apos;est pas encore fait.
        </p>
      )
    }
    if (isScheduled && s.started_at) {
      const dus = s.days_until_start
      const startLabel = formatDate(s.started_at)
      if (dus === 1) {
        return (
          <p className="text-blue-300/95 text-base mt-3 font-medium">
            Votre abonnement démarre demain ({startLabel}). Les repas vous seront proposés à partir de cette date.
          </p>
        )
      }
      if (dus === 0) {
        return (
          <p className="text-blue-300/95 text-base mt-3 font-medium">
            Votre abonnement démarre aujourd&apos;hui. Les repas sont disponibles selon le calendrier.
          </p>
        )
      }
      return (
        <p className="text-blue-300/95 text-base mt-3 font-medium">
          Votre abonnement démarre le {startLabel}. Vous recevrez vos repas à partir de cette date.
        </p>
      )
    }
    if (isActive && s.expires_at) {
      return (
        <p className="text-green-300/95 text-base mt-3 font-medium">
          Votre abonnement est actif jusqu&apos;au {formatDate(s.expires_at)}.
        </p>
      )
    }
    return null
  }

  return (
    <article className={`client-sub-ongoing ${modifier}`}>
      <div className="client-sub-ongoing__glow" aria-hidden />
      <span className={`client-sub-ongoing__badge badge ${getStatusBadge(s.status)}`}>
        {STATUS_LABELS[s.status] || s.status}
      </span>

      <div className="client-sub-ongoing__hero">
        <p className="client-sub-ongoing__eyebrow">
          {isActive ? 'Abonnement actif' : isPending ? 'Demande en cours' : isScheduled ? 'Bientôt actif' : 'Votre formule'}
        </p>
        <h3 className="client-sub-ongoing__title">{s.plan || 'Abonnement'}</h3>

        <div
          className="client-sub-ongoing__week"
          role="group"
          aria-label="Choisir un jour ouvré pour afficher le plat du jour"
        >
          {WORK_DAYS.map((label, i) => {
            const isToday = todayIdx === i
            const isSelected = selectedDayIdx === i
            return (
              <button
                key={label}
                type="button"
                onClick={() => setSelectedDayIdx(i)}
                aria-pressed={isSelected}
                aria-label={`${WORK_DAYS_FULL[i]}, afficher le menu`}
                className={`client-sub-ongoing__day${isToday ? ' client-sub-ongoing__day--today' : ''}${isSelected ? ' client-sub-ongoing__day--selected' : ''}`}
              >
                {label}
              </button>
            )
          })}
        </div>

        <div className="client-sub-ongoing__visual">
          {showDayplate ? (
            <div className="client-sub-dayplate">
              <div className="client-sub-dayplate__mesh" aria-hidden />
              <div className={`client-sub-dayplate__frame${heroItem?.image ? ' client-sub-dayplate__frame--split' : ''}`}>
                {heroItem?.image ? (
                  <div className="client-sub-dayplate__photo">
                    <img src={heroItem.image} alt="" className="client-sub-dayplate__photo-img" loading="lazy" />
                    <div className="client-sub-dayplate__photo-scrim" aria-hidden />
                  </div>
                ) : null}
                <div className={`client-sub-dayplate__content${heroItem?.image ? ' client-sub-dayplate__content--on-photo' : ''}`}>
                  <p className="client-sub-dayplate__kicker">{dayResolved.headline || 'Plat du jour'}</p>
                  <p className="client-sub-dayplate__date">{selectedDateLabel}</p>
                  <p className="client-sub-dayplate__context">
                    {WORK_DAYS_FULL[selectedDayIdx]} · semaine en cours
                    {isActive && todayIdx === selectedDayIdx ? (
                      <span className="client-sub-dayplate__today-pill">Aujourd&apos;hui</span>
                    ) : null}
                  </p>

                  {dayResolved.mode === 'single' && dayResolved.items[0] && (
                    <div className="client-sub-dayplate__main">
                      <span className="client-sub-dayplate__emoji" aria-hidden>
                        {safeEmoji(dayResolved.items[0].emoji)}
                      </span>
                      <h4 className="client-sub-dayplate__title">{dayResolved.items[0].label}</h4>
                      {dayResolved.items[0].detail ? (
                        <p className="client-sub-dayplate__detail">{dayResolved.items[0].detail}</p>
                      ) : null}
                    </div>
                  )}

                  {dayResolved.mode === 'multi' && (
                    <ul className="client-sub-dayplate__multilist">
                      {dayResolved.items.map((m, idx) => (
                        <li key={idx} className="client-sub-dayplate__multirow">
                          <span className="client-sub-dayplate__multi-emoji" aria-hidden>
                            {safeEmoji(m.emoji, '·')}
                          </span>
                          <div>
                            <span className="client-sub-dayplate__multi-label">{m.label}</span>
                            {m.detail ? <p className="client-sub-dayplate__multi-detail">{m.detail}</p> : null}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          ) : items.length > 0 ? (
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
            <div className="client-sub-dayplate client-sub-dayplate--empty">
              <div className="client-sub-dayplate__mesh" aria-hidden />
              <div className="client-sub-dayplate__empty-body">
                <div className="client-sub-dayplate__empty-head">
                  <p className="client-sub-dayplate__kicker">Calendrier repas</p>
                  <p className="client-sub-dayplate__date">{selectedDateLabel}</p>
                  <p className="client-sub-dayplate__context">
                    {WORK_DAYS_FULL[selectedDayIdx]} · semaine en cours
                  </p>
                </div>
                <div className="client-sub-dayplate__empty-visual" aria-hidden>
                  <div className="client-sub-dayplate__empty-ring" />
                  <span className="client-sub-dayplate__empty-monogram-wrap">
                    <span className="client-sub-dayplate__empty-monogram">GX</span>
                  </span>
                </div>
                <h4 className="client-sub-dayplate__empty-title">Contenu catalogue en cours</h4>
                <p className="client-sub-dayplate__empty-text">
                  Les intitulés et visuels des menus seront publiés ici dès que votre formule sera complétée par l&apos;équipe cuisine.
                </p>
                <p className="client-sub-dayplate__empty-hint">
                  Vous pouvez changer de jour ci-dessus pour préparer votre semaine.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="client-sub-ongoing__price-block">
          <span className="client-sub-ongoing__price">{formatCurrencyCDF(Number(s.price))}</span>
          <span className="client-sub-ongoing__price-hint">par semaine · 5 jours ouvrés (lun–ven)</span>
        </div>
      </div>

      {statusLine()}

      <div className="client-sub-ongoing__chips">
        <span className="client-sub-ongoing__chip">
          <span className="client-sub-ongoing__chip-k">Demandé</span>
          <span className="client-sub-ongoing__chip-v">{formatDate(s.created_at)}</span>
        </span>
        {(isActive || isScheduled) && s.started_at && (
          <span className="client-sub-ongoing__chip">
            <span className="client-sub-ongoing__chip-k">{isScheduled ? 'Début prévu' : 'Début'}</span>
            <span className="client-sub-ongoing__chip-v">{formatDate(s.started_at)}</span>
          </span>
        )}
        {(isActive || isScheduled) && s.expires_at && (
          <span className="client-sub-ongoing__chip client-sub-ongoing__chip--accent">
            <span className="client-sub-ongoing__chip-k">Fin de cycle</span>
            <span className="client-sub-ongoing__chip-v">
              {formatDate(s.expires_at)}
              {isActive && s.days_until_expiry != null && (
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

      {isActive && plan && Array.isArray(plan.meal_types) && plan.meal_types.length > 0 && (
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
          <button
            type="button"
            onClick={() => onPayClick?.(s)}
            className="client-sub-ongoing__pay-btn mt-4 px-5 py-2.5 rounded-lg text-base font-medium bg-[#d4af37] text-[#0b1220] hover:bg-[#e5c048] transition min-h-[44px]"
          >
            Payer avec Mobile Money
          </button>
        </div>
      )}
    </article>
  )
}
