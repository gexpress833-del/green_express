'use client'

import { formatCurrencyCDF } from '@/lib/helpers'

const WEEK_DAYS = [
  { short: 'Lun', full: 'Lundi' },
  { short: 'Mar', full: 'Mardi' },
  { short: 'Mer', full: 'Mercredi' },
  { short: 'Jeu', full: 'Jeudi' },
  { short: 'Ven', full: 'Vendredi' },
]

/**
 * Vitrine des abonnements particuliers — cycle hebdomadaire (lun–ven).
 */
export default function SubscriptionPlanShowcase({
  plans,
  loading,
  disabled,
  onSubscribeWeek,
  subscribing,
}) {
  if (loading) {
    return (
      <div className="client-sub-showcase client-sub-showcase--loading">
        <p className="client-sub-showcase__loading">Chargement des offres…</p>
      </div>
    )
  }

  if (!plans?.length) {
    return (
      <div className="client-sub-showcase client-sub-showcase--empty">
        <p>Aucun plan particulier n’est disponible pour le moment. Revenez plus tard ou contactez le support.</p>
      </div>
    )
  }

  return (
    <div className="client-sub-showcase">
      <div className="client-sub-showcase__intro">
        <h2 className="client-sub-showcase__title">Abonnements repas — particuliers</h2>
        <p className="client-sub-showcase__lead">
          Chaque formule couvre une <strong>semaine calendaire</strong> sur <strong>cinq jours ouvrés</strong> (lundi–vendredi).
          Les prestations décrites ci-dessous s’appliquent à chaque journée de ce cycle ; le renouvellement s’effectue par période hebdomadaire.
        </p>
      </div>

      <div className="client-sub-showcase__grid">
        {plans.map((plan) => (
          <article key={plan.id} className="client-sub-card">
            <header className="client-sub-card__head">
              <h3 className="client-sub-card__name">{plan.name}</h3>
              {plan.description && (
                <p className="client-sub-card__desc">{plan.description}</p>
              )}
            </header>

            <div className="client-sub-card__week" aria-label="Semaine type : cinq jours ouvrables">
              <p className="client-sub-card__week-label">Rythme hebdomadaire</p>
              <div className="client-sub-card__week-strip">
                {WEEK_DAYS.map((d) => (
                  <div key={d.short} className="client-sub-card__day" title={d.full}>
                    <span className="client-sub-card__day-short">{d.short}</span>
                    <span className="client-sub-card__day-check" aria-hidden>
                      ✓
                    </span>
                  </div>
                ))}
              </div>
              <p className="client-sub-card__week-note">
                Week-end non inclus — uniquement les{' '}
                <strong>{plan.days_per_week ?? 5} jours ouvrables</strong> par semaine calendaire.
              </p>
            </div>

            {Array.isArray(plan.items) && plan.items.length > 0 && (
              <div className="client-sub-card__dishes">
                <p className="client-sub-card__dishes-title">Illustration de la rotation hebdomadaire</p>
                <p className="client-sub-card__dishes-sub">
                  Une vignette par jour ouvré (lundi à vendredi) — aperçu indicatif de la diversité des mises en assiette.
                </p>
                <ul className="client-sub-card__dish-grid">
                  {plan.items.map((dish) => (
                    <li key={dish.id} className="client-sub-card__dish">
                      <div className="client-sub-card__dish-visual">
                        {dish.image ? (
                          <img
                            src={dish.image}
                            alt=""
                            className="client-sub-card__dish-img"
                            loading="lazy"
                          />
                        ) : (
                          <div className="client-sub-card__dish-placeholder" aria-hidden>
                            🍽️
                          </div>
                        )}
                      </div>
                      <div className="client-sub-card__dish-body">
                        {dish.meal_slot && (
                          <span className="client-sub-card__dish-slot">{dish.meal_slot}</span>
                        )}
                        <strong className="client-sub-card__dish-name">{dish.title}</strong>
                        {dish.description && (
                          <p className="client-sub-card__dish-desc">{dish.description}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {Array.isArray(plan.meal_types) && plan.meal_types.length > 0 && (
              <div className="client-sub-card__meals">
                <p className="client-sub-card__meals-title">Prestations sur les jours ouvrés</p>
                <ul className="client-sub-card__meal-list">
                  {plan.meal_types.map((m, idx) => (
                    <li key={idx} className="client-sub-card__meal-item">
                      <span className="client-sub-card__meal-emoji" aria-hidden>
                        {m.emoji || '🍴'}
                      </span>
                      <div>
                        <strong className="client-sub-card__meal-label">{m.label}</strong>
                        {m.detail && (
                          <p className="client-sub-card__meal-detail">{m.detail}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {Array.isArray(plan.highlights) && plan.highlights.length > 0 && (
              <ul className="client-sub-card__highlights">
                {plan.highlights.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            )}

            <div className="client-sub-card__pricing client-sub-card__pricing--single">
              <div className="client-sub-card__price-block client-sub-card__price-block--featured">
                <span className="client-sub-card__price-label">Tarif par semaine (5 j. ouvrés)</span>
                <span className="client-sub-card__price-value">{formatCurrencyCDF(plan.price_week)}</span>
              </div>
            </div>

            <div className="client-sub-card__actions">
              <button
                type="button"
                className="client-sub-card__btn client-sub-card__btn--primary"
                disabled={disabled || subscribing}
                onClick={() => onSubscribeWeek(plan.id)}
              >
                {subscribing ? 'Envoi…' : 'Souscrire — formule hebdomadaire'}
              </button>
            </div>
            {disabled && (
              <p className="client-sub-card__disabled-hint">
                Vous avez déjà un abonnement en cours. Renouvellement possible à l’échéance.
              </p>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}
