"use client"
import { useId } from 'react'
import { useCompany } from '@/lib/useCompany'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './EntreprisePendingGate.module.css'

/**
 * Affiche la page "Compte en examen" tant que l'entreprise n'est pas activée par l'admin.
 * Sinon rend les children (tableau de bord, sidebar, etc.).
 */
export default function EntreprisePendingGate({ children }) {
  const iconGradientId = useId().replace(/:/g, '')
  const { company, loading, error } = useCompany()
  const { logout } = useAuth()
  const router = useRouter()
  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  if (loading) {
    return (
      <section className="page-section min-h-screen flex items-center justify-center">
        <div className="card p-8 text-center max-w-md">
          <p className="text-white/60">Chargement...</p>
        </div>
      </section>
    )
  }

  // Compte supprimé ou aucune entreprise associée
  if (!loading && !company && !error) {
    return (
      <section className="page-section min-h-screen flex items-center justify-center p-4 bg-[#0b1220]">
        <div className="card p-8 max-w-lg text-center">
          <div className="text-4xl mb-4" aria-hidden>⚠️</div>
          <h1 className="text-2xl font-bold text-white mb-4">Compte entreprise supprimé ou non associé</h1>
          <p className="text-white/80 mb-6">
            Votre compte utilisateur est toujours actif, mais l&apos;entreprise associée n&apos;existe plus ou a été supprimée par l&apos;administrateur. Vous ne pouvez plus accéder au tableau de bord entreprise.
          </p>
          <p className="text-white/70 text-sm mb-8">
            Pour toute question : <a href="mailto:gexpress833@gmail.com" className="underline" style={{ color: '#d4af37' }}>gexpress833@gmail.com</a> — <a href="tel:+243990292005" className="underline" style={{ color: '#d4af37' }}>+243 990 292 005</a>
          </p>
          <Link href="/profile" className="inline-block px-6 py-3 rounded-lg font-semibold bg-[#d4af37] text-[#0b1220] hover:bg-[#e5c048] transition">Mon profil</Link>
          <p className="mt-6">
            <button type="button" onClick={handleLogout} className="text-white/70 hover:text-white text-sm underline bg-transparent border-none cursor-pointer">Se déconnecter</button>
          </p>
        </div>
      </section>
    )
  }

  // Demande rejetée
  if (!loading && company && company.status === 'rejected') {
    return (
      <section className="page-section min-h-screen flex items-center justify-center p-4 bg-[#0b1220]">
        <div className="card p-8 max-w-lg text-center">
          <div className="text-4xl mb-4" aria-hidden>❌</div>
          <h1 className="text-2xl font-bold text-white mb-4">Demande d&apos;accès entreprise rejetée</h1>
          <p className="text-white/80 mb-4">
            Votre demande d&apos;accès au portail entreprise n&apos;a pas été retenue.
          </p>
          {company.rejection_reason && (
            <div className="p-4 rounded-lg bg-white/10 border border-white/20 text-left text-white/90 text-sm mb-6">
              <span className="text-white/60 block text-xs uppercase tracking-wider mb-1">Motif indiqué</span>
              {company.rejection_reason}
            </div>
          )}
          <p className="text-white/70 text-sm mb-8">
            Pour toute question : <a href="mailto:gexpress833@gmail.com" className="underline" style={{ color: '#d4af37' }}>gexpress833@gmail.com</a> — <a href="tel:+243990292005" className="underline" style={{ color: '#d4af37' }}>+243 990 292 005</a>
          </p>
          <Link href="/profile" className="inline-block px-6 py-3 rounded-lg font-semibold bg-[#d4af37] text-[#0b1220] hover:bg-[#e5c048] transition">Mon profil</Link>
          <p className="mt-6">
            <button type="button" onClick={handleLogout} className="text-white/70 hover:text-white text-sm underline bg-transparent border-none cursor-pointer">Se déconnecter</button>
          </p>
        </div>
      </section>
    )
  }

  // En attente de validation (examen en cours)
  const isPending = error || !company || (company.status !== 'active')
  if (isPending) {
    const supportMail = 'gexpress833@gmail.com'
    const supportTel = '+243990292005'
    const mailtoSupport = `mailto:${supportMail}?subject=${encodeURIComponent('Green Express — Espace entreprise')}`

    return (
      <section className={styles.pendingPage} aria-labelledby="pending-title">
        <div className={styles.pendingAmbient} aria-hidden />
        <div className={styles.pendingGrid} aria-hidden />

        <div className={styles.pendingGlass}>
          <div className={styles.headerIconWrap}>
            <div className={styles.headerIcon} aria-hidden>
              {/*
                Dossier + loupe = demande en examen / contrôle (SVG, pas d’image raster).
              */}
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id={`pg-${iconGradientId}`} x1="6" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#22d3ee" />
                    <stop offset="1" stopColor="#a78bfa" />
                  </linearGradient>
                  <linearGradient id={`pg-ring-${iconGradientId}`} x1="16" y1="2" x2="16" y2="30" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#22d3ee" stopOpacity="0.45" />
                    <stop offset="1" stopColor="#a78bfa" stopOpacity="0.25" />
                  </linearGradient>
                </defs>
                <circle cx="16" cy="16" r="14" stroke={`url(#pg-ring-${iconGradientId})`} strokeWidth="0.75" opacity="0.85" />
                {/* Dossier */}
                <path
                  d="M9 7.5h8.5L21 11v13.5a1.25 1.25 0 01-1.25 1.25H9A1.25 1.25 0 017.75 24.5V8.75A1.25 1.25 0 019 7.5z"
                  stroke={`url(#pg-${iconGradientId})`}
                  strokeWidth="1.15"
                  fill="rgba(6, 182, 212, 0.07)"
                  strokeLinejoin="round"
                />
                <path
                  d="M17.5 7.5V11h3.5"
                  stroke={`url(#pg-${iconGradientId})`}
                  strokeWidth="1.1"
                  strokeLinejoin="round"
                />
                <path d="M17.5 7.5L21 11" stroke={`url(#pg-${iconGradientId})`} strokeWidth="1.1" strokeLinecap="round" />
                {/* Lignes de texte (dossier en examen) */}
                <line x1="10.5" y1="14.5" x2="18" y2="14.5" stroke="rgba(148, 163, 184, 0.85)" strokeWidth="1" strokeLinecap="round" />
                <line x1="10.5" y1="17.5" x2="16.5" y2="17.5" stroke="rgba(148, 163, 184, 0.6)" strokeWidth="1" strokeLinecap="round" />
                <line x1="10.5" y1="20.5" x2="18" y2="20.5" stroke="rgba(148, 163, 184, 0.45)" strokeWidth="1" strokeLinecap="round" />
                {/* Loupe = contrôle / validation */}
                <circle cx="22.5" cy="13" r="4.25" stroke={`url(#pg-${iconGradientId})`} strokeWidth="1.2" fill="rgba(11, 15, 26, 0.35)" />
                <path d="M25.8 16.3l3.6 3.6" stroke={`url(#pg-${iconGradientId})`} strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          <div className={styles.spinnerWrap} aria-hidden>
            <svg className={styles.spinnerSvg} viewBox="0 0 56 56" fill="none">
              <circle cx="28" cy="28" r="26" stroke="rgba(6,182,212,0.25)" strokeWidth="2" />
              <circle
                cx="28"
                cy="28"
                r="26"
                stroke="#22d3ee"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="42 140"
                style={{
                  transform: 'rotate(-90deg)',
                  transformOrigin: '28px 28px',
                  animation: 'examenSpin 1.5s linear infinite',
                }}
              />
            </svg>
          </div>

          <h1 id="pending-title" className={styles.title}>
            Activation de votre espace entreprise
          </h1>
          <p className={styles.subtitle}>
            Votre demande est en cours de validation par notre système
          </p>

          <div className={styles.statusCard}>
            <div className={styles.statusRow}>
              <span className={styles.badge}>
                <span className={styles.badgeDot} aria-hidden />
                En cours de validation
              </span>
              <p className={styles.delayHint}>
                <strong>Activation estimée :</strong> moins de 48h
              </p>
            </div>
          </div>

          <div className={styles.stepper} role="list" aria-label="Étapes d'activation">
            <div className={`${styles.step} ${styles.stepDone}`} role="listitem" style={{ '--stagger': '80ms' }}>
              <div className={styles.stepLabel}>
                <span className={styles.stepGlyph} aria-hidden>
                  ✔
                </span>{' '}
                Demande envoyée
              </div>
              <div className={styles.stepMeta}>Terminé</div>
            </div>
            <div className={`${styles.step} ${styles.stepCurrent}`} role="listitem" style={{ '--stagger': '160ms' }}>
              <div className={styles.stepLabel}>
                <span className={styles.stepGlyphOrange} aria-hidden>
                  ●
                </span>{' '}
                Vérification en cours
              </div>
              <div className={styles.stepMeta}>Étape actuelle</div>
            </div>
            <div className={styles.step} role="listitem" style={{ '--stagger': '240ms' }}>
              <div className={styles.stepLabel}>
                <span className={styles.stepGlyphMuted} aria-hidden>
                  ⬜
                </span>{' '}
                Compte activé
              </div>
              <div className={styles.stepMeta}>À venir</div>
            </div>
          </div>

          <div className={styles.sectionBlock} style={{ '--stagger': '300ms' }}>
            <div className={styles.sectionLabel}>État actuel</div>
            <p className={styles.sectionText}>
              Votre espace entreprise est en cours d&apos;activation : la demande a été reçue et analysée par nos équipes.
            </p>
          </div>

          <div className={styles.sectionBlock} style={{ '--stagger': '380ms' }}>
            <div className={styles.sectionLabel}>Prochaine étape</div>
            <p className={styles.sectionText}>
              La validation finale est effectuée par Green Express. Vous recevrez une notification à l&apos;adresse e-mail associée à votre compte.
            </p>
          </div>

          <div className={styles.sectionBlock} style={{ '--stagger': '460ms' }}>
            <div className={styles.sectionLabel}>Après activation</div>
            <ul className={styles.featureList}>
              <li>Accès au tableau de bord entreprise</li>
              <li>Souscription à un abonnement</li>
              <li>Gestion des employés</li>
            </ul>
            <p className={styles.sectionNote}>
              La souscription aux abonnements n&apos;est possible qu&apos;après activation de votre espace.
            </p>
          </div>

          <p className={styles.contactRow}>
            <span className={styles.srOnly}>Contact : </span>
            <span className={styles.contactRowInner}>
              <a href={mailtoSupport} className={styles.contactLink}>
                {supportMail}
              </a>
              <span className={styles.contactSep} aria-hidden>
                ·
              </span>
              <a href={`tel:${supportTel.replace(/\s/g, '')}`} className={styles.contactLink}>
                {supportTel}
              </a>
            </span>
          </p>

          <div className={styles.actions}>
            <Link href="/profile" className={styles.btnSecondary}>
              Mon profil
            </Link>
            <a href={mailtoSupport} className={styles.btnOutline}>
              Contacter le support
            </a>
          </div>

          <div className={styles.logout}>
            <button type="button" onClick={handleLogout} className={styles.logoutBtn}>
              Se déconnecter
            </button>
          </div>
        </div>
      </section>
    )
  }

  return children
}
