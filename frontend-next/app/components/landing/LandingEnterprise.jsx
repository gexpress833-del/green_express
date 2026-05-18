'use client'

import Link from 'next/link'
import { LandingSection, MotionBlock } from './LandingMotion'

export default function LandingEnterprise({ initialised, user, dashboardHref, loginHref = '/login' }) {
  return (
    <LandingSection className="landing-modern-section landing-modern-b2b-wrap">
      <div className="landing-modern-container">
        <MotionBlock>
          <div className="landing-modern-b2b">
            <div className="landing-modern-b2b__icons" aria-hidden>
              <span>🏢</span>
              <span>📊</span>
              <span>🤝</span>
            </div>
            <div className="landing-modern-b2b__content">
              <h2 className="landing-modern-b2b__title">Une solution de restauration pour votre entreprise</h2>
              <p className="landing-modern-b2b__desc">
                Simplifiez la gestion des repas de vos équipes grâce à une plateforme dédiée aux entreprises :
                commandes centralisées, gestion du budget cantine, suivi des livraisons et facturation simplifiée.
              </p>
              <p className="landing-modern-b2b__footnote">
                Une solution idéale pour les entreprises, écoles, administrations, hôpitaux et organisations privées.
              </p>
              <div className="landing-modern-b2b__actions">
                {!initialised ? (
                  <div className="landing-modern-b2b__skeleton" aria-busy="true" aria-label="Chargement" />
                ) : !user ? (
                  <>
                    <Link href={loginHref} className="landing-cta landing-cta--primary">
                      Connexion entreprise
                    </Link>
                    <Link href="/register" className="landing-cta landing-cta--secondary">
                      Créer un compte
                    </Link>
                  </>
                ) : user.role === 'entreprise' ? (
                  <Link href="/entreprise" className="landing-cta landing-cta--primary">
                    Mon espace entreprise
                  </Link>
                ) : (
                  <Link href={dashboardHref} className="landing-cta landing-cta--secondary">
                    Mon tableau de bord
                  </Link>
                )}
              </div>
            </div>
          </div>
        </MotionBlock>
      </div>
    </LandingSection>
  )
}
