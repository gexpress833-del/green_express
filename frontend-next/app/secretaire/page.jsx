'use client'

import SecretaireSidebar from '@/components/SecretaireSidebar'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiRequest } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { getSecretaireQuickActions } from '@/lib/secretaireNav'

export default function SecretaireDashboard() {
  const { user } = useAuth()
  const quickActions = getSecretaireQuickActions(user)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiRequest('/api/secretaire/stats', { method: 'GET' })
      .then((r) => setStats(r))
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [])

  const metrics = [
    {
      key: 'today',
      label: "Aujourd'hui",
      value: stats?.orders_today,
      hint: 'Commandes créées',
      accent: 'from-amber-400/20 to-transparent',
    },
    {
      key: 'pay',
      label: 'Paiement',
      value: stats?.pending_payment,
      hint: 'En attente de paiement',
      accent: 'from-amber-300/25 to-transparent',
      valueClass: 'text-amber-200',
    },
    {
      key: 'driver',
      label: 'Sans livreur',
      value: stats?.awaiting_driver,
      hint: 'Code généré, à attribuer',
      accent: 'from-cyan-400/20 to-transparent',
      valueClass: 'text-cyan-200',
    },
    {
      key: 'route',
      label: 'En route',
      value: stats?.out_for_delivery,
      hint: 'Livraisons en cours',
      accent: 'from-violet-400/15 to-transparent',
    },
  ]

  return (
    <section className="secretaire-dashboard page-section page-section--admin-tight min-h-screen bg-[#0b1220] pb-12 text-white sm:pb-16">
      <div className="mx-auto w-full max-w-6xl px-0 sm:px-0">
        <header className="border-b border-white/10 pb-6 pt-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-200/75">Secrétariat</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{"Vue d'ensemble"}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/60">
            Indicateurs du jour pour la logistique. Pour attribuer un livreur, ouvrez{' '}
            <strong className="font-medium text-white/85">Commandes &amp; livreurs</strong>.
          </p>
        </header>

        <div className="dashboard-grid mt-8">
          <SecretaireSidebar />
          <main className="main-panel">
            {loading ? (
              <div
                className="flex min-h-[200px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]"
                role="status"
                aria-live="polite"
              >
                <p className="text-sm text-white/50">Chargement des indicateurs…</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {metrics.map((m) => (
                    <div
                      key={m.key}
                      className={`relative overflow-hidden rounded-2xl border border-cyan-400/12 bg-gradient-to-br ${m.accent} p-5 shadow-[0_8px_32px_rgba(0,0,0,0.25)]`}
                    >
                      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-cyan-400/60 via-cyan-300/30 to-transparent opacity-80" />
                      <h2 className="text-[11px] font-semibold uppercase tracking-wider text-white/55">{m.label}</h2>
                      <p
                        className={`mt-2 text-3xl font-bold tabular-nums tracking-tight sm:text-4xl ${
                          m.valueClass || ''
                        }`}
                        style={
                          !m.valueClass
                            ? {
                                background: 'linear-gradient(135deg, #a5f3fc 0%, #c4b5fd 45%, #fde68a 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                              }
                            : undefined
                        }
                      >
                        {m.value ?? '—'}
                      </p>
                      <p className="mt-2 text-xs leading-snug text-white/45">{m.hint}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">
                  <h2 className="text-base font-semibold text-white/95">Actions rapides</h2>
                  <p className="mt-1 text-sm text-white/50">Accès direct aux écrans autorisés pour votre profil.</p>
                  {quickActions.length === 0 ? (
                    <p className="mt-5 text-sm text-white/45">
                      Aucun raccourci : les permissions « commandes » ou « flux » ne sont pas activées pour votre compte.
                    </p>
                  ) : (
                    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                      {quickActions.map((action, i) => (
                        <Link
                          key={action.href}
                          href={action.href}
                          className={[
                            'inline-flex flex-1 items-center justify-center rounded-xl px-5 py-3 text-sm font-medium transition focus:outline-none sm:min-w-[180px]',
                            i === 0
                              ? 'border border-cyan-400/30 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/20 focus-visible:ring-2 focus-visible:ring-cyan-400'
                              : 'border border-white/15 bg-white/5 text-white/90 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/30',
                          ].join(' ')}
                        >
                          {action.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </section>
  )
}
