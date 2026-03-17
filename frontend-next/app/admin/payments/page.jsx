"use client"
import Sidebar from '@/components/Sidebar'
import { useEffect, useState, useCallback } from 'react'
import { apiRequest } from '@/lib/api'
import { formatDate } from '@/lib/helpers'
import GoldButton from '@/components/GoldButton'
import Toaster, { pushToast } from '@/components/Toaster'

function formatAmount(amount, currency) {
  if (amount == null || amount === '') return '—'
  const value = Number(amount)
  if (currency === 'CDF') {
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value) + ' FC'
  }
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency || 'USD' }).format(value)
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState([])
  const [stats, setStats] = useState({ total: 0, total_success: 0, total_failed: 0, total_pending: 0, revenue: 0 })
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [reconciling, setReconciling] = useState(false)
  const [pagination, setPagination] = useState(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')

  const loadStats = useCallback(() => {
    apiRequest('/api/admin/payments/stats', { method: 'GET' })
      .then((r) => setStats(r || {}))
      .catch(() => setStats({ total: 0, total_success: 0, total_failed: 0, total_pending: 0, revenue: 0 }))
      .finally(() => setStatsLoading(false))
  }, [])

  const loadPayments = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ per_page: '50' })
    if (filterStatus) params.set('status', filterStatus)
    if (filterDateFrom) params.set('date_from', filterDateFrom)
    if (filterDateTo) params.set('date_to', filterDateTo)
    apiRequest(`/api/admin/payments?${params}`, { method: 'GET' })
      .then((r) => {
        setPayments(Array.isArray(r?.data) ? r.data : (Array.isArray(r) ? r : []))
        setPagination(r?.current_page != null ? { current_page: r.current_page, last_page: r.last_page, total: r.total } : null)
      })
      .catch(() => {
        setPayments([])
        setPagination(null)
      })
      .finally(() => setLoading(false))
  }, [filterStatus, filterDateFrom, filterDateTo])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  useEffect(() => {
    loadPayments()
  }, [loadPayments])

  useEffect(() => {
    const interval = setInterval(() => {
      loadPayments()
      loadStats()
    }, 5000)
    return () => clearInterval(interval)
  }, [loadPayments, loadStats])

  async function handleReconcile() {
    setReconciling(true)
    try {
      const r = await apiRequest('/api/admin/payments/reconcile', { method: 'POST' })
      pushToast(r?.message || 'Réconciliation déclenchée.', 'success')
      loadPayments()
      loadStats()
    } catch (err) {
      pushToast(err?.message || 'Erreur lors de la réconciliation.', 'error')
    } finally {
      setReconciling(false)
    }
  }

  function getUserName(p) {
    const user = p.order?.user || p.subscription?.user
    return user ? (user.name || user.email || user.id) : '—'
  }

  function getStatusBadge(status) {
    switch (status) {
      case 'completed':
      case 'paid':
      case 'success':
        return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
      case 'failed':
      case 'rejected':
        return 'bg-red-500/20 text-red-400 border border-red-500/40'
      case 'pending':
      default:
        return 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
    }
  }

  return (
    <section className="page-section min-h-screen bg-[#0b1220] text-white">
      <div className="container">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{
            background: 'linear-gradient(135deg, #d4af37 0%, #f5e08a 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Paiements
          </h1>
          <p className="text-white/70 text-lg">Dashboard temps réel — Shwary & réconciliation.</p>
        </header>

        <div className="dashboard-grid">
          <Sidebar />
          <main className="main-panel">
            {statsLoading ? null : (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="card p-4">
                  <p className="text-white/50 text-xs uppercase tracking-wider">Total</p>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
                <div className="card p-4 border border-emerald-500/30">
                  <p className="text-emerald-400/80 text-xs uppercase tracking-wider">Réussis</p>
                  <p className="text-2xl font-bold text-emerald-400">{stats.total_success}</p>
                </div>
                <div className="card p-4 border border-red-500/30">
                  <p className="text-red-400/80 text-xs uppercase tracking-wider">Échoués</p>
                  <p className="text-2xl font-bold text-red-400">{stats.total_failed}</p>
                </div>
                <div className="card p-4 border border-amber-500/30">
                  <p className="text-amber-400/80 text-xs uppercase tracking-wider">En attente</p>
                  <p className="text-2xl font-bold text-amber-400">{stats.total_pending}</p>
                </div>
                <div className="card p-4 col-span-2 md:col-span-1">
                  <p className="text-white/50 text-xs uppercase tracking-wider">Revenus</p>
                  <p className="text-xl font-bold text-cyan-400">{formatAmount(stats.revenue, 'CDF')}</p>
                </div>
              </div>
            )}

            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                >
                  <option value="">Tous les statuts</option>
                  <option value="pending">En attente</option>
                  <option value="completed">Payé</option>
                  <option value="failed">Échoué</option>
                </select>
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                />
                <input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
              <GoldButton onClick={handleReconcile} disabled={reconciling}>
                {reconciling ? 'Réconciliation…' : 'Reconcilier'}
              </GoldButton>
            </div>

            {loading ? (
              <div className="card text-center py-12">
                <p className="text-white/60">Chargement des paiements…</p>
              </div>
            ) : payments.length === 0 ? (
              <div className="card text-center py-12">
                <div className="text-5xl mb-4">💳</div>
                <p className="text-white/60 text-lg mb-2">Aucun paiement</p>
                <p className="text-white/40 text-sm">Les paiements apparaîtront ici (webhook ou job de réconciliation).</p>
              </div>
            ) : (
              <div className="card p-0 overflow-hidden">
                <div className="overflow-x-auto admin-table-scroll">
                  <table className="w-full text-left min-w-[700px]">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="p-3 text-white/80 font-semibold">ID</th>
                        <th className="p-3 text-white/80 font-semibold">Date</th>
                        <th className="p-3 text-white/80 font-semibold">Utilisateur</th>
                        <th className="p-3 text-white/80 font-semibold">Montant</th>
                        <th className="p-3 text-white/80 font-semibold">Téléphone</th>
                        <th className="p-3 text-white/80 font-semibold">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p) => (
                        <tr key={p.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="p-3 text-white/60 text-sm">#{p.id}</td>
                          <td className="p-3 text-white/80 text-sm">{formatDate(p.created_at)}</td>
                          <td className="p-3 text-white/90">{getUserName(p)}</td>
                          <td className="p-3 font-medium text-white">{formatAmount(p.amount, p.currency)}</td>
                          <td className="p-3 text-white/70 text-sm font-mono">{p.phone || '—'}</td>
                          <td className="p-3">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusBadge(p.status)}`}>
                              {p.status === 'completed' || p.status === 'paid' ? 'Payé' : p.status === 'pending' ? 'En attente' : p.status === 'failed' ? 'Échoué' : p.status || '—'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {pagination && pagination.last_page > 1 && (
                  <div className="p-3 border-t border-white/10 text-white/60 text-sm">
                    Page {pagination.current_page} / {pagination.last_page} — {pagination.total} paiement(s)
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
      <Toaster />
    </section>
  )
}
