'use client'

import { motion } from 'framer-motion'
import { useLandingMotionPrefs } from './useLandingMotionPrefs'

export const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
}

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

export const stagger = {
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
}

export function LandingSection({ children, className = '', id, delay = 0 }) {
  const { mounted, reduce } = useLandingMotionPrefs()

  if (!mounted || reduce) {
    return (
      <section id={id} className={className}>
        {children}
      </section>
    )
  }

  return (
    <motion.section
      id={id}
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: 0.08, delayChildren: delay },
        },
      }}
    >
      {children}
    </motion.section>
  )
}

export function MotionBlock({ children, className = '', variants = fadeUp }) {
  const { mounted, reduce } = useLandingMotionPrefs()

  if (!mounted || reduce) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div className={className} variants={variants}>
      {children}
    </motion.div>
  )
}
