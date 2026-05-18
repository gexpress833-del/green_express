'use client'

import { LandingSection, MotionBlock } from './LandingMotion'
import { LandingCtaPrimary, LandingCtaSecondary, LandingCtaRow } from './LandingCta'

export default function LandingFinalCta({ primaryCtaHref, primaryCtaLabel, secondaryCtaHref }) {
  return (
    <LandingSection className="landing-modern-section landing-modern-final-cta">
      <div className="landing-modern-container">
        <MotionBlock className="landing-modern-final-cta__inner">
          <h2 className="landing-modern-final-cta__title">Rejoignez la communauté Green Express</h2>
          <p className="landing-modern-final-cta__desc">
            Des milliers d&apos;utilisateurs font déjà confiance à Green Express pour leurs repas du quotidien.
            Inscription rapide, commande simple et livraison efficace.
          </p>
          <LandingCtaRow className="landing-modern-final-cta__actions">
            <LandingCtaPrimary href={primaryCtaHref || '/register'}>{primaryCtaLabel}</LandingCtaPrimary>
            <LandingCtaSecondary href={secondaryCtaHref}>Voir nos menus</LandingCtaSecondary>
          </LandingCtaRow>
        </MotionBlock>
      </div>
    </LandingSection>
  )
}
