"use client"

import { API_BASE } from '@/lib/apiBase'

const DEFAULT_PUSHER_CDN = 'https://cdn.jsdelivr.net/npm/pusher-js@8.4.0/dist/web/pusher.min.js'
const DEFAULT_ECHO_CDN = 'https://cdn.jsdelivr.net/npm/laravel-echo@1.16.1/dist/echo.iife.js'

let echoInitPromise = null

function envFlag(name, fallback = false) {
  const raw = process.env[name]
  if (raw == null) return fallback
  return String(raw).toLowerCase() === 'true'
}

function loadScript(url) {
  return new Promise((resolve, reject) => {
    if (!url || typeof document === 'undefined') {
      reject(new Error('URL de script invalide'))
      return
    }

    const existing = document.querySelector(`script[data-ge-src="${url}"]`)
    if (existing?.dataset?.loaded === 'true') {
      resolve()
      return
    }

    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error(`Chargement échoué: ${url}`)), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = url
    script.async = true
    script.dataset.geSrc = url
    script.onload = () => {
      script.dataset.loaded = 'true'
      resolve()
    }
    script.onerror = () => reject(new Error(`Chargement échoué: ${url}`))
    document.head.appendChild(script)
  })
}

function getExistingEchoClient() {
  if (typeof window === 'undefined') return null

  const existing = window.__GE_ECHO
  if (existing && typeof existing.private === 'function') {
    return existing
  }

  if (window.Echo && typeof window.Echo.private === 'function') {
    window.__GE_ECHO = window.Echo
    return window.Echo
  }

  return null
}

function parsePort(value, fallback) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export function isEchoEnabled() {
  return envFlag('NEXT_PUBLIC_NOTIFICATIONS_WS_ENABLED', false)
}

export async function ensureEchoClient() {
  if (typeof window === 'undefined' || !isEchoEnabled()) {
    return null
  }

  const readyClient = getExistingEchoClient()
  if (readyClient) {
    return readyClient
  }

  if (echoInitPromise) {
    return echoInitPromise
  }

  echoInitPromise = (async () => {
    const loadFromCdn = envFlag('NEXT_PUBLIC_NOTIFICATIONS_WS_LOAD_CDN', true)

    if (loadFromCdn) {
      if (!window.Pusher) {
        await loadScript(process.env.NEXT_PUBLIC_NOTIFICATIONS_WS_PUSHER_CDN || DEFAULT_PUSHER_CDN)
      }
      if (!window.Echo || typeof window.Echo.private !== 'function') {
        await loadScript(process.env.NEXT_PUBLIC_NOTIFICATIONS_WS_ECHO_CDN || DEFAULT_ECHO_CDN)
      }
    }

    const EchoCtor = window.Echo
    const PusherCtor = window.Pusher

    if (!EchoCtor || !PusherCtor || typeof EchoCtor !== 'function') {
      return null
    }

    window.Pusher = PusherCtor

    const apiUrl = new URL(API_BASE)
    const broadcaster = process.env.NEXT_PUBLIC_NOTIFICATIONS_WS_BROADCASTER || 'pusher'
    const cluster = process.env.NEXT_PUBLIC_NOTIFICATIONS_WS_CLUSTER || 'mt1'
    const explicitHost = process.env.NEXT_PUBLIC_NOTIFICATIONS_WS_HOST
    const usePusherCloud = !explicitHost
    const forceTLS = envFlag(
      'NEXT_PUBLIC_NOTIFICATIONS_WS_FORCE_TLS',
      usePusherCloud ? true : apiUrl.protocol === 'https:'
    )

    const config = {
      broadcaster,
      key: process.env.NEXT_PUBLIC_NOTIFICATIONS_WS_KEY || 'green-express',
      cluster,
      forceTLS,
      enabledTransports: ['ws', 'wss'],
      authEndpoint: `${API_BASE}/api/broadcasting/auth`,
      withCredentials: true,
      disableStats: true,
    }

    // Mode self-hosted (Reverb / soketi / Pusher compatible derrière notre domaine) :
    // un host explicite est fourni, on configure les ports WS/WSS.
    if (!usePusherCloud) {
      config.wsHost = explicitHost
      config.wsPort = parsePort(process.env.NEXT_PUBLIC_NOTIFICATIONS_WS_PORT, forceTLS ? 443 : 80)
      config.wssPort = parsePort(process.env.NEXT_PUBLIC_NOTIFICATIONS_WS_WSS_PORT, forceTLS ? 443 : 80)
    }
    // Sinon (Pusher cloud officiel) : le SDK route automatiquement via le cluster.

    const echo = new EchoCtor(config)

    window.__GE_ECHO = echo
    return echo
  })()

  try {
    return await echoInitPromise
  } finally {
    echoInitPromise = null
  }
}

export function getEchoClient() {
  return getExistingEchoClient()
}
