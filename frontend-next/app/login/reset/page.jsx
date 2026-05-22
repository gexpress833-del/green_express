'use client'

import Link from 'next/link'
import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { apiRequest, getCsrfCookie } from '@/lib/api'
import PasswordInput from '@/components/PasswordInput'
import styles from '../login.module.css'

function ResetForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') || ''
  const emailParam = searchParams.get('email') || ''

  const [email, setEmail] = useState(emailParam)
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')

    if (!password || password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (password !== passwordConfirmation) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)
    try {
      await getCsrfCookie()
      await apiRequest('/api/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token,
          email: email.trim(),
          password,
          password_confirmation: passwordConfirmation,
        }),
      })
      setSuccess(true)
      setTimeout(() => router.push('/login'), 3000)
    } catch (err) {
      const msg =
        err?.data?.errors?.email?.[0] ||
        err?.data?.message ||
        err?.message ||
        'Impossible de réinitialiser le mot de passe. Le lien est peut-être expiré.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className={styles.shell}>
        <div className={styles.ambient} aria-hidden />
        <div className={styles.gridFloor} aria-hidden />
        <div className={styles.vignette} aria-hidden />
        <div className={styles.card}>
          <div className={styles.cardGlow} aria-hidden />
          <div className={styles.neonTop} aria-hidden />
          <div className="text-center">
            <p className={styles.badge}>Erreur</p>
            <h1 className="text-center">
              <span className={styles.titleGradient}>Lien invalide</span>
            </h1>
            <p className={styles.subtitle}>
              Ce lien de réinitialisation est invalide ou a expiré.
            </p>
          </div>
          <div className={styles.footer}>
            <Link href="/login/forgot" className={styles.link}>
              Demander un nouveau lien
            </Link>
          </div>
        </div>
      </div>
    )
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
            <span className={styles.titleGradient}>Nouveau mot de passe</span>
          </h1>
          <p className={styles.subtitle}>
            Choisissez votre nouveau mot de passe.
          </p>
        </div>

        {success ? (
          <div
            role="status"
            className={styles.alert}
            style={{ background: 'rgba(34, 197, 94, 0.12)', borderColor: 'rgba(34, 197, 94, 0.4)', color: '#86efac' }}
          >
            Mot de passe réinitialisé avec succès ! Redirection vers la connexion…
          </div>
        ) : (
          <>
            {error && (
              <div role="alert" className={styles.alert}>
                {error}
              </div>
            )}

            <form onSubmit={submit} className={styles.loginForm} noValidate>
              <div>
                <label htmlFor="reset-email" className={styles.label}>E-mail</label>
                <input
                  id="login-identifier"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={styles.input}
                  style={{ opacity: emailParam ? 0.7 : 1 }}
                  readOnly={!!emailParam}
                />
              </div>
              <div>
                <label htmlFor="reset-password" className={styles.label}>Nouveau mot de passe</label>
                <PasswordInput
                  id="reset-password"
                  autoComplete="new-password"
                  placeholder="Au moins 8 caractères"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={styles.input}
                />
              </div>
              <div>
                <label htmlFor="reset-password2" className={styles.label}>Confirmer</label>
                <PasswordInput
                  id="reset-password2"
                  autoComplete="new-password"
                  placeholder="Retapez le mot de passe"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  required
                  className={styles.input}
                />
              </div>
              <button type="submit" disabled={loading} className={styles.submit}>
                {loading ? 'Réinitialisation…' : 'Réinitialiser'}
              </button>
            </form>
          </>
        )}

        <div className={styles.footer}>
          <Link href="/login" className={styles.link}>← Retour à la connexion</Link>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.shell} style={{ alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
          <p className={styles.subtitle} style={{ margin: 0 }}>Chargement…</p>
        </div>
      }
    >
      <ResetForm />
    </Suspense>
  )
}
