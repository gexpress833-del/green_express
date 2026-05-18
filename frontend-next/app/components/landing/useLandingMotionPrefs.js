'use client'

import { useReducedMotion } from 'framer-motion'
import { useClientMounted } from '@/lib/useClientMounted'

/** Avoid hydration mismatch: defer reduced-motion + entrance animations until mounted. */
export function useLandingMotionPrefs() {
  const mounted = useClientMounted()
  const reduceMotion = useReducedMotion()
  const reduce = mounted && reduceMotion

  function entranceProps(config) {
    if (!mounted || reduce) {
      return { initial: false, animate: undefined, transition: config?.transition }
    }
    return {
      initial: config.initial ?? false,
      animate: config.animate,
      transition: config.transition,
    }
  }

  return { mounted, reduce, entranceProps }
}
