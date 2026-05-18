'use client'

import { useEffect, useState } from 'react'
import styles from './PWAInstaller.module.css'
import { isIosSafari, isStandaloneDisplay } from '@/lib/pwaDetect'

const DISMISS_KEY = 'gx-pwa-prompt-dismissed'
const DISMISS_DAYS = 7

function isRecentlyDismissed() {
  if (typeof window === 'undefined') return false
  const at = Number(localStorage.getItem(DISMISS_KEY) || 0)
  if (!at) return false
  return Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000
}

/**
 * Service worker + invite à installer (Chrome/Android) ou guide iOS Safari.
 */
export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstall, setShowInstall] = useState(false)
  const [showIosHint, setShowIosHint] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    const register = () => {
      navigator.serviceWorker
        .register('/service-worker.js', { scope: '/' })
        .catch((err) => console.warn('[PWA] SW register failed', err))
    }
    if (document.readyState === 'complete') register()
    else window.addEventListener('load', register, { once: true })

    if (isRecentlyDismissed() || isStandaloneDisplay()) return

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

    let iosTimer
    if (isIosSafari()) {
      iosTimer = window.setTimeout(() => setShowIosHint(true), 2500)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', installedHandler)
      if (iosTimer) window.clearTimeout(iosTimer)
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
        <div className={styles.iconBox} aria-hidden="true">
          {showIosHint ? (
            <span className={styles.shareGlyph} aria-hidden>
              ⎋
            </span>
          ) : (
            '📱'
          )}
        </div>
        <div className={styles.body}>
          <p className={styles.title}>
            {showInstall ? 'Installer Green Express' : 'Installer sur iPhone / iPad'}
          </p>
          {showInstall ? (
            <p className={styles.subtitle}>
              Accès plus rapide, notifications et expérience plein écran.
            </p>
          ) : (
            <ol className={styles.iosSteps}>
              <li>
                Touchez <strong>Partager</strong>
                <span className={styles.iosShareHint} aria-hidden>
                  {' '}
                  (icône en bas de Safari)
                </span>
              </li>
              <li>
                Choisissez <strong>Sur l&apos;écran d&apos;accueil</strong>
              </li>
              <li>
                Confirmez avec <strong>Ajouter</strong>
              </li>
            </ol>
          )}
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
            J&apos;ai compris
          </button>
        )}
      </div>
    </div>
  )
}
