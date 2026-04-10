'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { flushSync } from 'react-dom'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import styles from './login.module.css'

function EyeIcon({ className }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M12 5C7 5 2.73 8.11 1 12.5 2.73 16.89 7 20 12 20s9.27-3.11 11-7.5C21.27 8.11 17 5 12 5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12.5" r="3.25" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  )
}

function EyeOffIcon({ className }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M3 4L21 22M10.6 10.6a3 3 0 004.8 4.8M9.9 5.1A10.4 10.4 0 0112 5c5 0 9.27 3.11 11 7.5a11.6 11.6 0 01-4.02 5.02M6.2 6.2C3.96 7.87 2.17 10.2 1 12.5 2.73 16.89 7 20 12 20c1.64 0 3.21-.32 4.65-.9"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9.88 9.88a3 3 0 104.24 4.24" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function LoginForm() {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const { login: authLogin } = useAuth()
  const passwordInputRef = useRef(null)
  const skipFirstPwFocus = useRef(true)

  useEffect(() => {
    setLoading(false)
  }, [])

  useEffect(() => {
    if (skipFirstPwFocus.current) {
      skipFirstPwFocus.current = false
      return
    }
    passwordInputRef.current?.focus()
  }, [showPassword])

  function readPasswordFromDom() {
    const el = passwordInputRef.current ?? document.getElementById('login-password')
    return el instanceof HTMLInputElement ? el.value : password
  }

  function handleTogglePasswordVisibility() {
    const raw = readPasswordFromDom()
    flushSync(() => setPassword(raw))
    setShowPassword((v) => !v)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const form = e.currentTarget
    const loginEl = form.elements.namedItem('login')
    const pwEl = form.elements.namedItem('password')
    const loginVal =
      loginEl instanceof HTMLInputElement ? loginEl.value.trim() : login.trim()
    const pwVal =
      pwEl instanceof HTMLInputElement ? pwEl.value : readPasswordFromDom()

    setLogin(loginVal)
    setPassword(pwVal)

    try {
      const response = await authLogin(loginVal, pwVal)
      if (!response?.user) {
        setError('Connexion réussie mais informations utilisateur manquantes.')
        setLoading(false)
        return
      }
      const role = response.user.role || 'client'
      const dashboardByRole = `/${role}`
      const returnUrl = searchParams.get('returnUrl') || ''
      const isOwnDashboard = returnUrl === dashboardByRole || returnUrl.startsWith(dashboardByRole + '/')
      const isProfileOnly = returnUrl === '/profile' || returnUrl === '/profile/' || returnUrl === ''
      const target = !isProfileOnly && isOwnDashboard ? returnUrl : dashboardByRole
      window.location.href = target
    } catch (err) {
      let msg =
        err?.data?.errors?.login?.[0] ??
        err?.data?.errors?.email?.[0] ??
        err?.data?.message ??
        err?.message ??
        'Erreur de connexion. Vérifiez vos identifiants.'
      if (msg === 'auth.failed' || String(msg).includes('auth.failed')) {
        msg = 'Identifiants incorrects. Vérifiez l’e-mail ou le numéro et le mot de passe.'
      }
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const passwordInputProps = {
    ref: passwordInputRef,
    id: 'login-password',
    name: 'password',
    autoComplete: 'current-password',
    placeholder: '••••••••',
    value: password,
    onChange: (e) => setPassword(e.target.value),
    onInput: (e) => setPassword(e.target.value),
    required: true,
    className: styles.input,
    spellCheck: false,
    autoCapitalize: 'off',
    autoCorrect: 'off',
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
          <p className={styles.badge}>Espace membre</p>
          <h1 className="text-center">
            <span className={styles.titleGradient}>Green Express</span>
          </h1>
          <p className={styles.subtitle}>
            Connectez-vous avec l&apos;e-mail ou le mobile enregistré — selon votre inscription : compte <strong>repas</strong> (parcours client) ou compte <strong>entreprise</strong> (gestion d&apos;équipe).
          </p>
          <p id="entreprise-help" className={`${styles.hint} max-w-md mx-auto mt-3 text-center`} style={{ lineHeight: 1.5 }}>
            Repas pris en charge par votre structure : utilisez un compte <strong>repas</strong>. Responsable RH ou finance : compte <strong>entreprise</strong>.
          </p>
        </div>

        {error && (
          <div role="alert" className={styles.alert}>
            {error}
          </div>
        )}

        <form method="post" onSubmit={handleSubmit} className={styles.loginForm} noValidate>
          <div>
            <label htmlFor="login-identifier" className={styles.label}>
              Identifiant
            </label>
            <input
              id="login-identifier"
              name="login"
              type="text"
              autoComplete="username"
              placeholder="E-mail ou numéro (RDC)"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              required
              className={styles.input}
            />
            <p className={styles.hint}>Formats acceptés : adresse e-mail, 08… / 09… / +243…</p>
          </div>

          <div className={styles.passwordField}>
            <label htmlFor="login-password" className={styles.label}>
              Mot de passe
            </label>
            <div className={styles.passwordInputWrapper}>
              {showPassword ? (
                <input {...passwordInputProps} key="login-pw-text" type="text" />
              ) : (
                <input {...passwordInputProps} key="login-pw-masked" type="password" />
              )}
              <button
                type="button"
                className={styles.togglePwButton}
                onClick={handleTogglePasswordVisibility}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                aria-pressed={showPassword}
                title={showPassword ? 'Masquer' : 'Afficher'}
              >
                {showPassword ? <EyeOffIcon className={styles.toggleIcon} /> : <EyeIcon className={styles.toggleIcon} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className={styles.submit}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <div className={styles.footer}>
          Pas encore de compte ?{' '}
          <Link href="/register" className={styles.link}>
            Créer un compte
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.shell} style={{ alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
          <p className={styles.subtitle} style={{ margin: 0 }}>Chargement…</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
