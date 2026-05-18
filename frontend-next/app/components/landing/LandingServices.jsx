'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useLandingMotionPrefs } from './useLandingMotionPrefs'
import { LandingSection, MotionBlock } from './LandingMotion'
import LandingSectionHeader from './LandingSectionHeader'

const SERVICES = [
  {
    icon: '👤',
    accent: 'cyan',
    title: 'Restauration pour particuliers',
    description:
      'Commandez facilement vos repas du quotidien et profitez d’une livraison rapide à domicile ou au bureau, avec une expérience simple, moderne et sécurisée.',
    features: ['Commandes en ligne', 'Suivi en temps réel', 'Points fidélité', 'Abonnements flexibles'],
    cta: null,
  },
  {
    icon: '🎉',
    accent: 'violet',
    title: 'Service traiteur & événementiel',
    description:
      'Mariages, conférences, anniversaires ou événements d’entreprise : notre équipe conçoit des menus sur mesure adaptés à votre budget, au nombre d’invités et à vos attentes.',
    features: ['Mariages et réceptions', 'Conférences et séminaires', 'Événements privés', 'Devis sur mesure'],
    cta: { href: '/evenements', label: 'Obtenir un devis personnalisé' },
  },
]

export default function LandingServices() {
  const { reduce } = useLandingMotionPrefs()

  return (
    <LandingSection className="landing-modern-section landing-modern-services-wrap">
      <div className="landing-modern-container">
        <LandingSectionHeader
          title="Nos services"
          description="Green Express propose des solutions adaptées aussi bien aux besoins du quotidien qu’aux événements professionnels et privés."
        />
        <div className="landing-modern-services">
          {SERVICES.map((service) => (
            <MotionBlock key={service.title}>
              <motion.article
                className={`landing-modern-service-card landing-modern-service-card--${service.accent}`}
                whileHover={reduce ? undefined : { y: -8 }}
                transition={{ type: 'spring', stiffness: 360, damping: 24 }}
              >
                <div className="landing-modern-service-card__visual" aria-hidden>
                  <span className="landing-modern-service-card__icon">{service.icon}</span>
                </div>
                <h3 className="landing-modern-service-card__title">{service.title}</h3>
                <p className="landing-modern-service-card__desc">{service.description}</p>
                <ul className="landing-modern-service-card__list">
                  {service.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                {service.cta ? (
                  <Link href={service.cta.href} className="landing-cta landing-cta--secondary landing-cta--block">
                    {service.cta.label}
                  </Link>
                ) : null}
              </motion.article>
            </MotionBlock>
          ))}
        </div>
      </div>
    </LandingSection>
  )
}
