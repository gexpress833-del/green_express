'use client'

import { motion } from 'framer-motion'
import { useLandingMotionPrefs } from './useLandingMotionPrefs'
import {
  nextLogoSrc,
  PRIMARY_LOGO,
} from '@/lib/landingMedia'
import { LandingCtaPrimary, LandingCtaSecondary, LandingCtaRow } from './LandingCta'
import LandingMenusCarousel from './LandingMenusCarousel'

const BADGES = [
  { label: 'Livraison rapide à Kolwezi', color: '#34d399' },
  { label: 'Paiement 100% sécurisé', color: '#22d3ee' },
  { label: 'Programme fidélité avantageux', color: '#a78bfa' },
  { label: 'Disponible 7j/7', color: '#fbbf24' },
]

export default function LandingHero({
  logoSrc,
  setLogoSrc,
  primaryCtaHref,
  primaryCtaLabel,
  secondaryCtaHref,
}) {
  const { reduce, entranceProps } = useLandingMotionPrefs()

  return (
    <section className="landing landing-modern-hero hero-anim-bg">
      <motion.div
        className="landing-modern-hero__glow landing-modern-hero__glow--a"
        aria-hidden
        {...entranceProps({
          animate: { opacity: [0.4, 0.7, 0.4] },
          transition: { duration: 8, repeat: Infinity, ease: 'easeInOut' },
        })}
      />
      <motion.div
        className="landing-modern-hero__glow landing-modern-hero__glow--b"
        aria-hidden
        {...entranceProps({
          animate: { opacity: [0.3, 0.55, 0.3] },
          transition: { duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 },
        })}
      />

      <motion.div className="landing-inner landing-modern-hero__inner">
        <div className="landing-modern-hero__grid">
          <div className="landing-modern-hero__copy">
            <motion.div
              className="hero-anim-logo landing-modern-hero__logo-wrap"
              {...entranceProps({
                initial: { opacity: 0, scale: 0.92 },
                animate: { opacity: 1, scale: 1 },
                transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
              })}
            >
              <img
                key={logoSrc}
                src={logoSrc}
                alt="Green Express"
                decoding="async"
                fetchPriority="high"
                className="landing-modern-hero__logo"
                onError={() => setLogoSrc((s) => nextLogoSrc(s))}
              />
            </motion.div>

            <motion.h1
              className="landing-modern-hero__title"
              {...entranceProps({
                initial: { opacity: 0, y: 24 },
                animate: { opacity: 1, y: 0 },
                transition: { duration: 0.65, delay: 0.15, ease: [0.22, 1, 0.36, 1] },
              })}
            >
              Des repas de qualité, livrés rapidement ou que vous soyez, chez vous ou à votre bureau.
            </motion.h1>

            <motion.div
              {...entranceProps({
                initial: { opacity: 0, y: 16 },
                animate: { opacity: 1, y: 0 },
                transition: { duration: 0.55, delay: 0.35 },
              })}
            >
              <LandingCtaRow>
                <LandingCtaPrimary href={primaryCtaHref || '/register'}>
                  {primaryCtaLabel}
                </LandingCtaPrimary>
                <LandingCtaSecondary href={secondaryCtaHref}>
                  Voir nos menus
                </LandingCtaSecondary>
              </LandingCtaRow>
            </motion.div>

            <motion.ul
              className="landing-modern-badges"
              {...entranceProps({
                initial: { opacity: 0 },
                animate: { opacity: 1 },
                transition: { duration: 0.5, delay: 0.5 },
              })}
            >
              {BADGES.map((b) => (
                <li key={b.label} className="landing-modern-badge">
                  <span className="landing-modern-badge__dot" style={{ background: b.color }} aria-hidden />
                  {b.label}
                </li>
              ))}
            </motion.ul>
          </div>

          <motion.div
            className="landing-modern-hero__visual"
            {...entranceProps({
              initial: { opacity: 0, x: 20 },
              animate: { opacity: 1, x: 0 },
              transition: { duration: 0.75, delay: 0.25, ease: [0.22, 1, 0.36, 1] },
            })}
          >
            <motion.div
              className="landing-food-card landing-food-card--1"
              whileHover={reduce ? undefined : { y: -6, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 320, damping: 22 }}
            >
              <span className="landing-food-card__emoji" aria-hidden>🥗</span>
              <span className="landing-food-card__label">Fraîcheur du jour</span>
            </motion.div>
            <motion.div
              className="landing-food-card landing-food-card--2"
              whileHover={reduce ? undefined : { y: -6, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 320, damping: 22 }}
            >
              <span className="landing-food-card__emoji" aria-hidden>🍲</span>
              <span className="landing-food-card__label">Cuisine maison</span>
            </motion.div>

            <motion.div className="landing-hero-video-wrap landing-modern-hero__video">
              <LandingMenusCarousel poster={logoSrc || PRIMARY_LOGO} />
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}