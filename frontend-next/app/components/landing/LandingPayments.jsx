'use client'

import { Suspense, lazy } from 'react'
import { LandingSection, MotionBlock } from './LandingMotion'
import LandingSectionHeader from './LandingSectionHeader'

const PaymentMethodsBanner = lazy(() => import('@/components/PaymentMethodsBanner'))

export default function LandingPayments() {
  return (
    <LandingSection className="landing-modern-section landing-modern-payments-wrap">
      <div className="landing-modern-container landing-modern-payments">
        <LandingSectionHeader
          title="Des paiements simples et sécurisés"
          description="Réglez vos commandes en toute confiance grâce à des solutions de paiement fiables adaptées aux habitudes locales et internationales."
        />
        <MotionBlock>
          <Suspense
            fallback={
              <div className="landing-modern-payments-skeleton" aria-busy="true" aria-label="Chargement" />
            }
          >
            <div className="landing-modern-payments-banner payment-methods-banner--landing">
              <PaymentMethodsBanner />
            </div>
          </Suspense>
        </MotionBlock>
      </div>
    </LandingSection>
  )
}
