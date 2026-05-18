'use client'

import { useEffect, useState } from 'react'

/** True only after the first client commit — safe gate for SSR-only markup parity. */
export function useClientMounted() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return mounted
}
