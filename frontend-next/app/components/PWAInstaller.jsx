'use client'

import { useEffect, useState } from 'react'
import styles from './PWAInstaller.module.css'

const DISMISS_KEY = 'gx-pwa-prompt-dismissed'
const DISMISS_DAYS = 7

function isRecentlyDismissed() {
  if (typeof window === 'undefined') return false
  const at = Number(localStorage.getItem(DISMISS_KEY) || 0)
  if (!at) return false
  return Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000
}

function isStandalone() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

/**
 * Enregistre le service worker et propose un bouton "Installer l'application"
 * via beforeinstallprompt (Chrome / Edge / Android). Sur iOS Safari, affiche
 * une instruction (Partager → Sur l'écran d'accueil).
 */
export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstall, setShowInstall] = useState(false)
  const [showIosHint, setShowIosHint] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    // Enregistrement du Service Worker (dev + prod) pour permettre l'installation PWA.
    // Le SW est sans-cache en dev grâce à ses conditions internes.
    const register = () => {
      navigator.serviceWorker
        .register('/service-worker.js', { scope: '/' })
        .catch((err) => console.warn('[PWA] SW register failed', err))
    }
    if (document.readyState === 'complete') register()
    else window.addEventListener('load', register, { once: true })

    if (isRecentlyDismissed() || isStandalone()) return

    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstall(true)
    }
    window.addEventListener('beforeinstallprompt', handler)

    const installedHandler = () => {
      setShowInstall(false)
      setDeferredPrompt(null)
      localStorage.setItem(DISMISS_KEY, String(Date.now()))
    }
    window.addEventListener('appinstalled', installedHandler)

    // iOS Safari : pas d'événement beforeinstallprompt
    const ua = window.navigator.userAgent.toLowerCase()
    const isIos = /iphone|ipad|ipod/.test(ua) && !/crios|fxios/.test(ua)
    if (isIos) setShowIosHint(true)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', installedHandler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    try {
      await deferredPrompt.userChoice
    } finally {
      setDeferredPrompt(null)
      setShowInstall(false)
    }
  }

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
    setShowInstall(false)
    setShowIosHint(false)
  }

  if (!showInstall && !showIosHint) return null

  return (
    <div className={styles.banner} role="dialog" aria-label="Installer Green Express">
      <div className={styles.header}>
        <div className={styles.iconBox} aria-hidden="true">📱</div>
        <div className={styles.body}>
          <p className={styles.title}>
            {showInstall ? 'Installer Green Express' : 'Ajouter à l\'écran d\'accueil'}
          </p>
          <p className={styles.subtitle}>
            {showInstall
              ? 'Accès plus rapide, notifications et expérience plein écran.'
              : 'Touchez Partager puis « Sur l\'écran d\'accueil » pour installer l\'application.'}
          </p>
        </div>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={handleDismiss}
          aria-label="Fermer"
        >
          ×
        </button>
      </div>

      <div className={styles.actions}>
        {showInstall ? (
          <>
            <button type="button" className={styles.dismissBtn} onClick={handleDismiss}>
              Plus tard
            </button>
            <button type="button" className={styles.installBtn} onClick={handleInstall}>
              Installer
            </button>
          </>
        ) : (
          <button type="button" className={styles.installBtn} onClick={handleDismiss}>
            J'ai compris
          </button>
        )}
      </div>
    </div>
  )
}
