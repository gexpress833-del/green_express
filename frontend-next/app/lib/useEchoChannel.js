"use client"

import { useEffect, useRef } from 'react'
import { ensureEchoClient, getEchoClient, isEchoEnabled } from '@/lib/echoBootstrap'

/**
 * Abonne le composant à un canal privé Echo et déclenche `onEvent` à chaque diffusion.
 * - Réinitialisation automatique si `channel` ou `event` change.
 * - Pas d'effet si Echo désactivé ou paramètres manquants : utile pour fallback polling.
 *
 * @param {{ enabled?: boolean, channel: string|null, event: string|null, onEvent: (payload: any) => void }} params
 */
export function useEchoChannel({ enabled = true, channel, event, onEvent }) {
  const handlerRef = useRef(onEvent)

  useEffect(() => {
    handlerRef.current = onEvent
  }, [onEvent])

  useEffect(() => {
    if (!enabled || !channel || !event || typeof window === 'undefined') {
      return undefined
    }
    if (!isEchoEnabled()) {
      return undefined
    }

    let disposed = false
    let activeChannel = null
    const listener = (payload) => {
      try {
        handlerRef.current?.(payload)
      } catch {
        /* noop : handler propre côté composant */
      }
    }

    ensureEchoClient()
      .then(() => {
        if (disposed) return
        const echo = getEchoClient()
        if (!echo || typeof echo.private !== 'function') return
        activeChannel = echo.private(channel)
        activeChannel.listen(event, listener)
      })
      .catch(() => {})

    return () => {
      disposed = true
      const echo = getEchoClient()
      if (activeChannel && typeof activeChannel.stopListening === 'function') {
        activeChannel.stopListening(event)
      }
      if (echo && typeof echo.leave === 'function') {
        echo.leave(`private-${channel}`)
      }
    }
  }, [enabled, channel, event])
}
