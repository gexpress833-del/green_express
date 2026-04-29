'use client'

import { useEffect, useState } from 'react'

/**
 * Bandeau discret qui s'affiche quand le navigateur passe offline.
 * Disparaît automatiquement au retour du réseau.
 * Les pages continuent de fonctionner en lecture grâce au service worker.
 */
export default function OfflineIndicator() {
  const [online, setOnline] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setOnline(navigator.onLine)
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  if (online) return null

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10000,
        background: '#b45309',
        color: '#fff',
        textAlign: 'center',
        fontSize: 13,
        fontWeight: 600,
        padding: '6px 12px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
      }}
    >
      📶 Hors ligne — vous consultez les données mises en cache.
    </div>
  )
}
