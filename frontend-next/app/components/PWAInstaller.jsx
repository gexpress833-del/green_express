'use client'

import { useEffect, useState } from 'react'

/**
 * Enregistre le service worker et propose un bouton "Installer l'application"
 * via l'événement beforeinstallprompt (Android / desktop Chromium).
 * Sur iOS Safari, affiche un message d'instruction (Partager → Sur l'écran d'accueil).
 */
export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstall, setShowInstall] = useState(false)
  const [showIosHint, setShowIosHint] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    // Enregistre le SW (en production uniquement pour ne pas perturber HMR)
    if (process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/service-worker.js', { scope: '/' })
          .catch((err) => console.warn('[PWA] SW register failed', err))
      })
    }

    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      // Afficher le bouton seulement si pas déjà installée
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true
      if (!isStandalone) setShowInstall(true)
    }
    window.addEventListener('beforeinstallprompt', handler)

    const installedHandler = () => {
      setShowInstall(false)
      setDeferredPrompt(null)
    }
    window.addEventListener('appinstalled', installedHandler)

    // iOS : pas d'événement beforeinstallprompt
    const ua = window.navigator.userAgent.toLowerCase()
    const isIos = /iphone|ipad|ipod/.test(ua) && !/crios|fxios/.test(ua)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    const dismissedAt = Number(localStorage.getItem('gx-ios-pwa-hint-dismissed') || 0)
    const recent = Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000
    if (isIos && !isStandalone && !recent) {
      setShowIosHint(true)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', installedHandler)
    }
  }, [])

  const onInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    try {
      await deferredPrompt.userChoice
    } finally {
      setDeferredPrompt(null)
      setShowInstall(false)
    }
  }

  const dismissIos = () => {
    localStorage.setItem('gx-ios-pwa-hint-dismissed', String(Date.now()))
    setShowIosHint(false)
  }

  if (!showInstall && !showIosHint) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        background: '#0b1f17',
        color: '#fff',
        padding: '12px 16px',
        borderRadius: 12,
        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        maxWidth: 'calc(100vw - 24px)',
        fontSize: 14,
      }}
      role="dialog"
      aria-label="Installer Green Express"
    >
      {showInstall ? (
        <>
          <span>📱 Installer Green Express sur votre appareil</span>
          <button
            onClick={onInstall}
            style={{
              background: '#16a34a',
              color: '#fff',
              border: 0,
              padding: '8px 14px',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Installer
          </button>
          <button
            onClick={() => setShowInstall(false)}
            aria-label="Fermer"
            style={{ background: 'transparent', color: '#fff', border: 0, cursor: 'pointer', fontSize: 18 }}
          >
            ×
          </button>
        </>
      ) : (
        <>
          <span>📲 Sur iPhone : touchez <b>Partager</b> puis <b>Sur l'écran d'accueil</b>.</span>
          <button
            onClick={dismissIos}
            style={{ background: 'transparent', color: '#fff', border: '1px solid #fff', padding: '6px 12px', borderRadius: 8, cursor: 'pointer' }}
          >
            OK
          </button>
        </>
      )}
    </div>
  )
}
