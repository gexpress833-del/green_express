'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useLandingMotionPrefs } from './useLandingMotionPrefs'
import { formatCurrencyCDF } from '@/lib/helpers'
import { LandingSection, MotionBlock } from './LandingMotion'
import LandingSectionHeader from './LandingSectionHeader'

export default function LandingSubscriptions({ plans, loadingPlans, subscriptionPlanHref }) {
  const { reduce } = useLandingMotionPrefs()

  return (
    <LandingSection className="landing-modern-section landing-modern-plans-wrap">
      <div className="landing-modern-container">
        <LandingSectionHeader
          title="Des abonnements pensés pour votre quotidien"
          description="Profitez de repas réguliers sans avoir à commander chaque jour. Choisissez une formule hebdomadaire ou mensuelle adaptée à votre rythme et à votre budget."
        />

        {loadingPlans ? (
          <MotionBlock>
            <div className="landing-modern-card landing-modern-card--loading">
              <p>Chargement des offres...</p>
            </div>
          </MotionBlock>
        ) : plans.length > 0 ? (
          <div className="landing-modern-plans">
            {plans.map((plan, index) => {
              const isPopular = plans.length >= 2 && index === Math.floor(plans.length / 2)
              return (
                <MotionBlock key={plan.id}>
                  <motion.article
                    className={`landing-modern-plan-card${isPopular ? ' landing-modern-plan-card--popular' : ''}`}
                    whileHover={reduce ? undefined : { y: -8 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                  >
                    {isPopular ? (
                      <span className="landing-modern-plan-card__badge">Populaire</span>
                    ) : null}
                    <h3 className="landing-modern-plan-card__name">{plan.name}</h3>
                    {plan.description ? (
                      <p className="landing-modern-plan-card__desc">{plan.description}</p>
                    ) : null}
                    <motion.div className="landing-modern-plan-card__prices">
                      <p>
                        <span className="landing-modern-plan-card__amount">
                          {formatCurrencyCDF(Number(plan.price_week))}
                        </span>
                        <span className="landing-modern-plan-card__period"> / semaine</span>
                      </p>
                      <p>
                        <span className="landing-modern-plan-card__amount">
                          {formatCurrencyCDF(Number(plan.price_month))}
                        </span>
                        <span className="landing-modern-plan-card__period"> / mois</span>
                      </p>
                    </motion.div>
                    <Link href={subscriptionPlanHref} className="landing-cta landing-cta--primary landing-cta--block">
                      Découvrir les formules
                    </Link>
                  </motion.article>
                </MotionBlock>
              )
            })}
          </div>
        ) : (
          <MotionBlock>
            <div className="landing-modern-card landing-modern-card--empty">
              <p>Aucun plan d&apos;abonnement disponible pour le moment.</p>
            </div>
          </MotionBlock>
        )}
      </div>
    </LandingSection>
  )
}
