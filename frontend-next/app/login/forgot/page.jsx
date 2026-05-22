'use client'

import Link from 'next/link'
import { useState } from 'react'
import { apiRequest, getCsrfCookie } from '@/lib/api'
import styles from '../login.module.css'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    if (!email.trim()) return
    setError('')
    setLoading(true)
    try {
      await getCsrfCookie()
      await apiRequest('/api/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      })
      setSent(true)
    } catch (err) {
      // On affiche quand même "envoyé" pour ne pas révéler si le compte existe
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.shell}>
      <div className={styles.ambient} aria-hidden />
      <div className={styles.gridFloor} aria-hidden />
      <div className={styles.vignette} aria-hidden />

      <div className={styles.card}>
        <div className={styles.cardGlow} aria-hidden />
        <div className={styles.neonTop} aria-hidden />

        <div className="text-center">
          <p className={styles.badge}>Récupération</p>
          <h1 className="text-center">
            <span className={styles.titleGradient}>Mot de passe oublié</span>
          </h1>
          <p className={styles.subtitle}>
            Entrez votre e-mail. Un lien de réinitialisation vous sera envoyé.
          </p>
        </div>

        {sent ? (
          <div role="status" className={styles.alert} style={{ background: 'rgba(34, 197, 94, 0.12)', borderColor: 'rgba(34, 197, 94, 0.4)' }}>
            Si un compte existe pour <strong>{email}</strong>, un e-mail vient de
            partir. Vérifiez votre boîte de réception (et les spams). Pas reçu après
            5 minutes&nbsp;? Contactez-nous au <a href="tel:+243000000000" className={styles.link}>+243&nbsp;…</a>.
          </div>
        ) : (
          <form onSubmit={submit} className={styles.loginForm} noValidate>
            <div>
              <label htmlFor="forgot-email" className={styles.label}>E-mail</label>
              <input
                id="login-identifier"
                type="email"
                autoComplete="email"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={styles.input}
              />
            </div>
            <button type="submit" disabled={loading} className={styles.submit}>
              {loading ? 'Envoi…' : 'Envoyer le lien'}
            </button>
          </form>
        )}

        <div className={styles.footer}>
          <Link href="/login" className={styles.link}>← Retour à la connexion</Link>
        </div>
      </div>
    </div>
  )
}
