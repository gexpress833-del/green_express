"use client"

import { useEffect } from 'react'
import { ensureEchoClient } from '@/lib/echoBootstrap'

export default function EchoBootstrap() {
  useEffect(() => {
    ensureEchoClient().catch(() => {})
  }, [])

  return null
}
