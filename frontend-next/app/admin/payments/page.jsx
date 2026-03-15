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
  const [loading, setLoading] = useState(true)
  const [reconciling, setReconciling] = useState(false)
  const [pagination, setPagination] = useState(null)

  const loadPayments = useCallback(() => {
    setLoading(true)
    apiRequest('/api/admin/payments?per_page=50', { method: 'GET' })
      .then((r) => {
        setPayments(Array.isArray(r?.data) ? r.data : (Array.isArray(r) ? r : []))
        setPagination(r?.current_page != null ? { current_page: r.current_page, last_page: r.last_page, total: r.total } : null)
      })
      .catch(() => {
        setPayments([])
        setPagination(null)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadPayments()
  }, [loadPayments])

  async function handleReconcile() {
    setReconciling(true)
    try {
      const r = await apiRequest('/api/admin/payments/reconcile', { method: 'POST' })
      pushToast(r?.message || 'Réconciliation déclenchée.', 'success')
      loadPayments()
    } catch (err) {
      pushToast(err?.message || 'Erreur lors de la réconciliation.', 'error')
    } finally {
      setReconciling(false)
    }
  }

  function getStatusBadge(status) {
    switch (status) {
      case 'completed':
      case 'paid':
      case 'success':
        return 'badge-success'
      case 'failed':
      case 'rejected':
        return 'badge-error'
      case 'pending':
      default:
        return 'badge-warning'
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
          <p className="text-white/70 text-lg">Suivi, réconciliation et remboursements.</p>
        </header>

        <div className="dashboard-grid">
          <Sidebar />
          <main className="main-panel">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <p className="text-white/60 text-sm">Historique des paiements enregistrés (commandes et abonnements).</p>
              <GoldButton onClick={handleReconcile} disabled={reconciling}>
                {reconciling ? 'Réconciliation…' : 'Reconcilier les paiements'}
              </GoldButton>
            </div>

            {loading ? (
              <div className="card text-center py-12">
                <p className="text-white/60">Chargement des paiements…</p>
              </div>
            ) : payments.length === 0 ? (
              <div className="card text-center py-12">
                <div className="text-5xl mb-4">💳</div>
                <p className="text-white/60 text-lg mb-2">Aucun paiement enregistré</p>
                <p className="text-white/40 text-sm">Les paiements apparaîtront ici après des commandes ou abonnements payés (webhook ou confirmation).</p>
              </div>
            ) : (
              <div className="card p-0 overflow-hidden">
                <div className="overflow-x-auto admin-table-scroll">
                  <table className="w-full text-left min-w-[700px]">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="p-3 text-white/80 font-semibold">Date</th>
                        <th className="p-3 text-white/80 font-semibold">Type</th>
                        <th className="p-3 text-white/80 font-semibold">Référence</th>
                        <th className="p-3 text-white/80 font-semibold">Montant</th>
                        <th className="p-3 text-white/80 font-semibold">Provider</th>
                        <th className="p-3 text-white/80 font-semibold">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p) => (
                        <tr key={p.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="p-3 text-white/80 text-sm">{formatDate(p.created_at)}</td>
                          <td className="p-3">
                            {p.order_id ? (
                              <span className="text-cyan-400">Commande</span>
                            ) : p.subscription_id ? (
                              <span className="text-amber-400">Abonnement</span>
                            ) : (
                              <span className="text-white/50">—</span>
                            )}
                          </td>
                          <td className="p-3 text-white/70 text-sm">
                            {p.order?.uuid && <span title={p.order.uuid}>{p.order.uuid.slice(0, 8)}…</span>}
                            {p.subscription?.uuid && !p.order_id && <span title={p.subscription.uuid}>{p.subscription.plan || p.subscription.uuid?.slice(0, 8)}…</span>}
                            {!p.order_id && !p.subscription_id && '—'}
                          </td>
                          <td className="p-3 font-medium text-white">{formatAmount(p.amount, p.currency)}</td>
                          <td className="p-3 text-white/70 text-sm">{p.provider || '—'}</td>
                          <td className="p-3">
                            <span className={`badge ${getStatusBadge(p.status)}`}>
                              {p.status === 'completed' || p.status === 'paid' ? 'Payé' : p.status === 'pending' ? 'En attente' : p.status || '—'}
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
