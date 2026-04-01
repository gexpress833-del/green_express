"use client"
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Sidebar from '@/components/Sidebar'
import DashboardGreeting from '@/components/DashboardGreeting'
import { apiRequest } from '@/lib/api'
import { formatDate } from '@/lib/helpers'
import Link from 'next/link'

function buildOperationalQuery(statusFilter, dateFilter, typeFilter, deliverTomorrow) {
  const params = new URLSearchParams()
  if (deliverTomorrow) {
    params.set('deliver_tomorrow', '1')
    params.set('type', typeFilter || 'personal')
  } else {
    if (statusFilter) params.set('status', statusFilter)
    if (dateFilter) params.set('date_filter', dateFilter)
    params.set('type', typeFilter || 'personal')
  }
  const qs = params.toString()
  return `/api/operational/subscriptions${qs ? `?${qs}` : ''}`
}

const STATUS_LABELS = {
  pending: 'En attente',
  scheduled: 'Planifié',
  active: 'Actif',
  paused: 'En pause',
  rejected: 'Refusé',
  expired: 'Expiré',
  cancelled: 'Annulé',
}

function getStatusBadge(status) {
  switch (status) {
    case 'active': return 'badge-success'
    case 'scheduled': return 'badge-scheduled'
    case 'rejected': return 'badge-error'
    case 'cancelled': return 'badge-error'
    case 'pending': return 'badge-sub-pending'
    case 'paused': return 'badge-warning'
    case 'expired': return 'badge-expired'
    default: return 'badge-warning'
  }
}

export default function CuisinierSubscriptionsPage() {
  const router = useRouter()
  const { isAuthenticated, initialised } = useAuth()
  const [subs, setSubs] = useState([])
  const [tomorrow, setTomorrow] = useState(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('personal')
  const [deliverTomorrow, setDeliverTomorrow] = useState(false)

  useEffect(() => {
    if (!initialised) return
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [initialised, isAuthenticated, router])

  const load = useCallback(() => {
    setLoading(true)
    const url = buildOperationalQuery(statusFilter, dateFilter, typeFilter, deliverTomorrow)
    Promise.all([
      apiRequest(url, { method: 'GET' }),
      apiRequest('/api/operational/subscriptions/tomorrow', { method: 'GET' }).catch(() => null),
    ])
      .then(([opRaw, t]) => {
        setSubs(Array.isArray(opRaw?.data) ? opRaw.data : [])
        setTomorrow(t)
      })
      .catch(() => {
        setSubs([])
        setTomorrow(null)
      })
      .finally(() => setLoading(false))
  }, [statusFilter, dateFilter, typeFilter, deliverTomorrow])

  useEffect(() => {
    if (!isAuthenticated) return
    load()
  }, [load, isAuthenticated])

  const sorted = useMemo(() => {
    const order = { pending: 0, scheduled: 1, active: 2, paused: 3, expired: 4, rejected: 5, cancelled: 6 }
    return [...subs].sort((a, b) => {
      const da = order[a.status] ?? 99
      const db = order[b.status] ?? 99
      if (da !== db) return da - db
      return new Date(b.created_at) - new Date(a.created_at)
    })
  }, [subs])

  return (
    <section className="page-section min-h-screen bg-[#0b1220] text-white">
      <div className="container">
        <DashboardGreeting>
          <h1 className="text-3xl font-bold mb-2" style={{
            background: 'linear-gradient(135deg, #9d4edd 0%, #ff00ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Abonnements & repas
          </h1>
          <p className="text-white/70 text-lg max-w-2xl">
            Vue opérationnelle : filtres, volume pour demain et indication menu (selon les plans).
          </p>
        </DashboardGreeting>

        <div className="dashboard-grid">
          <Sidebar />
          <main className="main-panel space-y-6">
            {tomorrow?.summary && (
              <div className="card p-4 border border-emerald-500/30 bg-emerald-500/5">
                <h2 className="text-lg font-semibold text-emerald-200 mb-2">Repas à préparer demain</h2>
                {tomorrow.summary.is_weekend ? (
                  <p className="text-white/60 text-sm">Demain : jour non ouvré — pas de tournée standard.</p>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-white tabular-nums">{tomorrow.summary.estimated_meals} repas</p>
                    <p className="text-white/70 text-sm mt-1">{tomorrow.summary.client_count} client(s) · {tomorrow.summary.weekday_label}</p>
                    <p className="text-white/80 text-sm mt-2">Indication menu : <strong>{tomorrow.summary.menu_summary}</strong></p>
                    {tomorrow.subscriptions?.length > 0 && (
                      <ul className="mt-3 text-xs text-white/50 space-y-1 max-h-32 overflow-y-auto">
                        {tomorrow.subscriptions.slice(0, 20).map((row) => (
                          <li key={row.id}>{row.client_name} — {row.meal_hint}</li>
                        ))}
                        {tomorrow.subscriptions.length > 20 && (
                          <li>… et {tomorrow.subscriptions.length - 20} autre(s)</li>
                        )}
                      </ul>
                    )}
                  </>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-end gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
              <div>
                <label className="block text-xs text-white/50 mb-1">Statut</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  disabled={deliverTomorrow}
                  className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm disabled:opacity-50"
                >
                  <option value="">Tous</option>
                  <option value="pending">En attente</option>
                  <option value="scheduled">Planifié</option>
                  <option value="active">Actif</option>
                  <option value="paused">En pause</option>
                  <option value="expired">Expiré</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1">Période</label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  disabled={deliverTomorrow}
                  className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm disabled:opacity-50"
                >
                  <option value="">Toutes</option>
                  <option value="today">Aujourd&apos;hui</option>
                  <option value="tomorrow">Demain</option>
                  <option value="week">Cette semaine</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1">Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm"
                >
                  <option value="personal">Particulier</option>
                  <option value="company">Entreprise</option>
                  <option value="all">Tous</option>
                </select>
              </div>
              <button
                type="button"
                onClick={() => setDeliverTomorrow((v) => !v)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold border ${
                  deliverTomorrow ? 'bg-emerald-600/40 border-emerald-400 text-emerald-100' : 'bg-white/10 border-white/25'
                }`}
              >
                À livrer demain
              </button>
            </div>

            {loading ? (
              <div className="card text-center py-12">
                <p className="text-white/60">Chargement...</p>
              </div>
            ) : sorted.length === 0 ? (
              <div className="card text-center py-12">
                <p className="text-white/60">Aucun abonnement pour ces critères.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sorted.map((s) => (
                  <div key={`${s.subscription_kind || 'personal'}-${s.id}`} className="card p-4 border border-white/10">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <span className="font-semibold text-purple-300">{s.plan}</span>
                        <span className={`badge ${getStatusBadge(s.status)} ml-2`}>{STATUS_LABELS[s.status] || s.status}</span>
                        {s.subscription_type_label && (
                          <span className="text-white/45 text-xs ml-2">· {s.subscription_type_label}</span>
                        )}
                        <p className="text-white/70 text-sm mt-1">
                          {s.subscription_kind === 'company' ? (s.company_name || 'Entreprise') : (s.user?.name || s.user?.email || '—')}
                        </p>
                        {(s.started_at || s.expires_at) && (
                          <p className="text-white/45 text-xs mt-1">
                            {s.started_at && `Début ${formatDate(s.started_at)}`}
                            {s.expires_at && ` · Fin ${formatDate(s.expires_at)}`}
                          </p>
                        )}
                        {s.next_meal_day && (
                          <p className="text-emerald-200/80 text-xs mt-1">
                            Prochain repas : {formatDate(s.next_meal_day)}{s.next_meal_label ? ` — ${s.next_meal_label}` : ''}
                          </p>
                        )}
                      </div>
                      <Link href="/cuisinier" className="text-xs text-purple-400 hover:text-purple-300 shrink-0">← Tableau de bord</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </section>
  )
}
