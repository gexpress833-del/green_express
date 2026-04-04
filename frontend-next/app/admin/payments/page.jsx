"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import GoldButton from '@/components/GoldButton'
import Toaster, { pushToast } from '@/components/Toaster'
import { apiRequest } from '@/lib/api'
import { formatCurrencyCDF, formatDate } from '@/lib/helpers'
import ConfirmModal from '@/components/ConfirmModal'

function formatAmount(amount, currency) {
  const cur = String(currency || 'CDF').toUpperCase()
  if (cur === 'CDF' || cur === 'FC') return formatCurrencyCDF(amount)
  return `${Number(amount || 0).toLocaleString('fr-FR')} ${cur}`
}

export default function AdminPaymentsPage() {
  const [stats, setStats] = useState(null)
  const [payments, setPayments] = useState([])
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reconciling, setReconciling] = useState(false)
  const [confirmModal, setConfirmModal] = useState(null)
  const [filters, setFilters] = useState({
    status: '',
    date_from: '',
    date_to: '',
    page: 1,
  })

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    if (filters.status) params.set('status', filters.status)
    if (filters.date_from) params.set('date_from', filters.date_from)
    if (filters.date_to) params.set('date_to', filters.date_to)
    params.set('page', String(filters.page || 1))
    params.set('per_page', '20')
    return params.toString()
  }, [filters])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [statsResponse, paymentsResponse] = await Promise.all([
        apiRequest('/api/admin/payments/stats', { method: 'GET' }),
        apiRequest(`/api/admin/payments?${queryString}`, { method: 'GET' }),
      ])

      setStats(statsResponse)
      setPayments(Array.isArray(paymentsResponse?.data) ? paymentsResponse.data : [])
      setMeta({
        current_page: paymentsResponse?.current_page || 1,
        last_page: paymentsResponse?.last_page || 1,
        total: paymentsResponse?.total || 0,
      })
    } catch (err) {
      pushToast({ type: 'error', message: err?.message || 'Erreur lors du chargement des paiements.' })
    } finally {
      setLoading(false)
    }
  }, [queryString])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function doReconcile() {
    setReconciling(true)
    try {
      const response = await apiRequest('/api/admin/payments/reconcile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      pushToast({ type: 'success', message: response?.message || 'Réconciliation déclenchée.' })
    } catch (err) {
      pushToast({ type: 'error', message: err?.message || 'Erreur lors de la réconciliation.' })
    } finally {
      setReconciling(false)
    }
  }

  function handleReconcile() {
    setConfirmModal({
      title: 'Lancer la réconciliation',
      message: 'Cette opération va synchroniser les statuts des paiements en attente avec le prestataire Mobile Money. Confirmer ?',
      variant: 'warning',
      confirmLabel: 'Lancer la réconciliation',
      onConfirm: () => { setConfirmModal(null); doReconcile() },
    })
  }

  return (
    <section className="page-section page-section--admin-tight min-h-screen bg-[#0b1220] text-white">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{
            background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Paiements
          </h1>
          <p className="text-white/70 text-lg">Vue admin des paiements et de leur réconciliation.</p>
        </header>

        <div className="dashboard-grid">
          <Sidebar />
          <main className="main-panel space-y-6">
            <div className="flex flex-wrap gap-3 justify-end">
              <button
                type="button"
                onClick={handleReconcile}
                disabled={reconciling}
                className="gold disabled:opacity-50"
              >
                {reconciling ? 'Réconciliation...' : 'Lancer la réconciliation'}
              </button>
            </div>

            {stats && (
              <div className="grid gap-4 md:grid-cols-4">
                <div className="card"><p className="text-white/50 text-sm">Total</p><p className="text-2xl font-bold text-cyan-300 mt-2">{stats.total}</p></div>
                <div className="card"><p className="text-white/50 text-sm">Réussis</p><p className="text-2xl font-bold text-green-300 mt-2">{stats.total_success}</p></div>
                <div className="card"><p className="text-white/50 text-sm">En attente</p><p className="text-2xl font-bold text-amber-300 mt-2">{stats.total_pending}</p></div>
                <div className="card"><p className="text-white/50 text-sm">Montant encaissé</p><p className="text-2xl font-bold text-purple-300 mt-2">{formatCurrencyCDF(stats.revenue || 0)}</p></div>
              </div>
            )}

            <div className="card">
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <label className="block text-white/70 text-sm mb-2">Statut</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value, page: 1 }))}
                    className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
                  >
                    <option value="">Tous</option>
                    <option value="pending">En attente</option>
                    <option value="completed">Complété</option>
                    <option value="failed">Échoué</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-2">Date début</label>
                  <input
                    type="date"
                    value={filters.date_from}
                    onChange={(e) => setFilters((prev) => ({ ...prev, date_from: e.target.value, page: 1 }))}
                    className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-2">Date fin</label>
                  <input
                    type="date"
                    value={filters.date_to}
                    onChange={(e) => setFilters((prev) => ({ ...prev, date_to: e.target.value, page: 1 }))}
                    className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
                  />
                </div>
                <div className="flex items-end">
                  <GoldButton onClick={loadData}>Actualiser</GoldButton>
                </div>
              </div>
            </div>

            <div className="card overflow-x-auto">
              {loading ? (
                <p className="text-white/60">Chargement des paiements...</p>
              ) : payments.length === 0 ? (
                <p className="text-white/60">Aucun paiement trouvé.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-white/50 border-b border-white/10">
                      <th className="py-3 pr-4">Date</th>
                      <th className="py-3 pr-4">Provider</th>
                      <th className="py-3 pr-4">Référence</th>
                      <th className="py-3 pr-4">Montant</th>
                      <th className="py-3 pr-4">Statut</th>
                      <th className="py-3 pr-4">Client</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => {
                      const user = payment.order?.user || payment.subscription?.user
                      const status = String(payment.status || '').toLowerCase()
                      const statusColor = status === 'completed'
                        ? 'text-green-300'
                        : status === 'failed'
                          ? 'text-red-300'
                          : 'text-amber-300'

                      return (
                        <tr key={payment.id} className="border-b border-white/5 align-top">
                          <td className="py-3 pr-4 text-white/80">{formatDate(payment.created_at)}</td>
                          <td className="py-3 pr-4 text-cyan-300">{payment.provider || '—'}</td>
                          <td className="py-3 pr-4 text-white/70 font-mono break-all">
                            {payment.provider_payment_id || payment.reference_id || '—'}
                          </td>
                          <td className="py-3 pr-4 text-white/90">{formatAmount(payment.amount, payment.currency)}</td>
                          <td className={`py-3 pr-4 font-semibold ${statusColor}`}>{payment.status}</td>
                          <td className="py-3 pr-4 text-white/70">
                            {user?.name || user?.email || payment.phone || '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}

              {meta && meta.last_page > 1 && (
                <div className="flex justify-between items-center mt-6">
                  <p className="text-white/50 text-sm">
                    Page {meta.current_page} / {meta.last_page} — {meta.total} paiements
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={meta.current_page <= 1}
                      onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
                      className="px-3 py-2 rounded-lg border border-white/20 text-white/80 disabled:opacity-40"
                    >
                      Précédent
                    </button>
                    <button
                      type="button"
                      disabled={meta.current_page >= meta.last_page}
                      onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
                      className="px-3 py-2 rounded-lg border border-white/20 text-white/80 disabled:opacity-40"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      <Toaster />
      {confirmModal && (
        <ConfirmModal
          {...confirmModal}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </section>
  )
}
