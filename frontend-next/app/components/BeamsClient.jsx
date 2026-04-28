"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

const BEAMS_CDN = 'https://js.pusher.com/beams/2.1.0/push-notifications-cdn.js'
const INSTANCE_ID = process.env.NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID || ''

function loadScript(url) {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('Document not available'))
      return
    }
    const existing = document.querySelector(`script[data-ge-src="${url}"]`)
    if (existing?.dataset?.loaded === 'true') {
      resolve()
      return
    }
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error(`Failed to load: ${url}`)), { once: true })
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
    script.onerror = () => reject(new Error(`Failed to load: ${url}`))
    document.head.appendChild(script)
  })
}

/**
 * Initialise Pusher Beams pour les notifications push natives.
 * S'abonne aux intérêts selon le rôle de l'utilisateur (client, admin, livreur).
 * Monté une fois dans Providers.
 */
export default function BeamsClient() {
  const { user } = useAuth()
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (!INSTANCE_ID || typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    let client = null

    const initBeams = async () => {
      try {
        if (!window.PusherPushNotifications) {
          await loadScript(BEAMS_CDN)
        }

        client = new window.PusherPushNotifications.Client({
          instanceId: INSTANCE_ID,
        })

        await client.start()
        await client.register()

        const interests = []

        // Intérêt par utilisateur (pour notifications ciblées)
        if (user?.id) {
          interests.push(String(user.id))
        }

        // Intérêts par rôle
        if (user?.role === 'admin') {
          interests.push('admins')
        }
        if (user?.role === 'livreur') {
          interests.push('livreurs')
        }

        if (interests.length > 0) {
          await client.addDeviceInterest(interests)
          console.log('[Beams] Subscribed to interests:', interests)
        }

        setInitialized(true)
      } catch (err) {
        console.warn('[Beams] Init failed:', err)
      }
    }

    initBeams()

    return () => {
      if (client) {
        client.stop().catch(() => {})
      }
    }
  }, [user?.id, user?.role])

  return null
}
