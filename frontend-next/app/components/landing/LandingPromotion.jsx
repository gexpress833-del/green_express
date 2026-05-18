'use client'

import { Suspense, lazy } from 'react'
import { LandingSection, MotionBlock } from './LandingMotion'
import LandingSectionHeader from './LandingSectionHeader'

const PromoCard = lazy(() => import('@/components/PromoCard'))

export default function LandingPromotion({ loading, currentPromo, loginRequired }) {
  return (
    <LandingSection className="landing-modern-section landing-modern-promo-wrap">
      <div className="landing-modern-container">
        <LandingSectionHeader
          title="Offre exclusive du moment"
          description="Profitez de nos promotions limitées et échangez vos points fidélité contre des avantages exclusifs."
        />
        {loading ? (
          <MotionBlock>
            <div className="landing-modern-card landing-modern-card--loading">
              <p>Chargement de la promotion...</p>
            </div>
          </MotionBlock>
        ) : currentPromo ? (
          <MotionBlock>
            <Suspense
              fallback={
                <div className="landing-modern-promo-skeleton" aria-busy="true" aria-label="Chargement" />
              }
            >
              <div className="landing-modern-promo-frame">
                <PromoCard promo={currentPromo} loginRequired={loginRequired} />
              </div>
            </Suspense>
          </MotionBlock>
        ) : (
          <MotionBlock>
            <div className="landing-modern-card landing-modern-card--empty">
              <div className="landing-modern-card__emoji" aria-hidden>
                🎁
              </div>
              <p className="landing-modern-card__title">Aucune offre active actuellement.</p>
              <p className="landing-modern-card__hint">
                Revenez bientôt pour découvrir nos prochaines promotions exclusives.
              </p>
            </div>
          </MotionBlock>
        )}
      </div>
    </LandingSection>
  )
}
