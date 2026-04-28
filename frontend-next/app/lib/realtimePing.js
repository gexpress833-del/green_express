"use client"

import { pushToast } from '@/components/Toaster'

/**
 * Affiche un ping discret (top-droite) lors de la réception d'un event temps réel.
 * Évite les flots de toasts identiques en mémorisant les derniers messages.
 */
const lastPing = { key: '', at: 0 }

export function pushRealtimePing(message, options = {}) {
  if (!message) return
  const key = String(message)
  const now = Date.now()
  const minGapMs = options.minGapMs ?? 1200

  if (key === lastPing.key && now - lastPing.at < minGapMs) {
    return
  }
  lastPing.key = key
  lastPing.at = now

  pushToast({
    type: 'info',
    subtle: true,
    duration: options.duration ?? 1800,
    message,
  })
}
