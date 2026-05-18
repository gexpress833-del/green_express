'use client'

import { motion } from 'framer-motion'
import { useLandingMotionPrefs } from './useLandingMotionPrefs'
import { LandingSection, MotionBlock } from './LandingMotion'
import LandingSectionHeader from './LandingSectionHeader'

const STEPS = [
  {
    num: '1',
    icon: '🍽️',
    title: 'Sélectionnez vos repas préférés',
    description:
      'Découvrez une sélection de repas préparés chaque jour et composez votre commande selon vos envies.',
  },
  {
    num: '2',
    icon: '💳',
    title: 'Payez facilement et en toute sécurité',
    description:
      'Réglez vos commandes via carte bancaire ou Mobile Money grâce à un système de paiement fiable et sécurisé.',
  },
  {
    num: '3',
    icon: '🛵',
    title: 'Recevez votre commande en temps réel',
    description:
      'Suivez votre livreur en direct et profitez d’un repas livré chaud, rapidement et dans les meilleures conditions.',
  },
]

export default function LandingHowItWorks() {
  const { reduce } = useLandingMotionPrefs()

  return (
    <LandingSection className="landing-modern-section landing-modern-steps-wrap">
      <motion.div className="landing-modern-container">
        <LandingSectionHeader
          title="Comment ça marche"
          description="Commandez votre repas en quelques minutes grâce à une expérience rapide, simple et intuitive."
        />
        <div className="landing-modern-steps">
          {STEPS.map((step) => (
            <MotionBlock key={step.num}>
              <motion.article
                className="landing-modern-step-card"
                whileHover={reduce ? undefined : { y: -6, boxShadow: '0 20px 40px rgba(0,0,0,0.35)' }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              >
                <span className="landing-modern-step-card__num">{step.num}</span>
                <span className="landing-modern-step-card__icon" aria-hidden>
                  {step.icon}
                </span>
                <h3 className="landing-modern-step-card__title">{step.title}</h3>
                <p className="landing-modern-step-card__desc">{step.description}</p>
              </motion.article>
            </MotionBlock>
          ))}
        </div>
      </motion.div>
    </LandingSection>
  )
}
