"use client"
import Sidebar from '@/components/Sidebar'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { apiRequest, fetchApiBlob, getApiErrorMessage } from '@/lib/api'

const STATUS_LABELS = {
  pending_payment: 'En attente paiement',
  pending: 'En cours',
  paid: 'Payée',
  out_for_delivery: 'En livraison',
  delivered: 'Livrée',
  cancelled: 'Annulée',
}
const STATUS_OPTIONS = Object.entries(STATUS_LABELS)

function getStatusClass(status) {
  switch (status) {
    case 'delivered':
    case 'paid':
      return 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/40'
    case 'pending':
    case 'out_for_delivery':
      return 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/40'
    case 'pending_payment':
      return 'bg-amber-500/25 text-amber-300 border border-amber-400/40'
    case 'cancelled':
      return 'bg-red-500/25 text-red-300 border border-red-400/40'
    default:
      return 'bg-white/15 text-white/80 border border-white/20'
  }
}

export default function AdminOrderTrackingPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [detailOrder, setDetailOrder] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [pdfId, setPdfId] = useState(null)
  const [error, setError] = useState('')

  function loadOrders() {
    setLoading(true)
    apiRequest('/api/orders', { method: 'GET' })
      .then((r) => setOrders(Array.isArray(r) ? r : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadOrders()
  }, [])

  const filtered = statusFilter ? orders.filter((o) => (o.status || '') === statusFilter) : orders
  const formatDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—')
  const getCurrencyLabel = (order) => {
    const currency = order?.items?.[0]?.menu?.currency || 'CDF'
    return currency === 'CDF' ? 'FC' : currency
  }

  async function handleShowDetail(order, e) {
    if (e) e.preventDefault()
    if (e) e.stopPropagation()
    setError('')
    try {
      const data = await apiRequest(`/api/orders/${order.id}`, { method: 'GET' })
      setDetailOrder(data)
    } catch (err) {
      setError(getApiErrorMessage(err))
      setDetailOrder(null)
    }
  }

  async function handleUpdateStatus(orderId, newStatus) {
    setUpdatingId(orderId)
    setError('')
    try {
      await apiRequest(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      loadOrders()
      if (detailOrder?.id === orderId) setDetailOrder((prev) => (prev ? { ...prev, status: newStatus } : null))
      setDetailOrder(null)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleDownloadPdf(orderId, e) {
    if (e) e.preventDefault()
    if (e) e.stopPropagation()
    setPdfId(orderId)
    setError('')
    try {
      const res = await fetchApiBlob(`/api/orders/${orderId}/pdf`, { headers: { Accept: 'application/pdf' } })
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `commande-${orderId}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err?.message || 'Erreur téléchargement PDF')
    } finally {
      setPdfId(null)
    }
  }

  async function handleDelete(orderId, e) {
    if (e) e.preventDefault()
    if (e) e.stopPropagation()
    if (!confirm('Supprimer cette commande ? Cette action est irréversible.')) return
    setDeletingId(orderId)
    setError('')
    try {
      await apiRequest(`/api/orders/${orderId}`, { method: 'DELETE' })
      loadOrders()
      if (detailOrder?.id === orderId) setDetailOrder(null)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setDeletingId(null)
    }
  }

  const list = filtered.slice(0, 50)

  return (
    <section className="page-section min-h-screen bg-[#0b1220]">
      <div className="container px-3 sm:px-4">
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Suivi des commandes</h1>
          <p className="text-white/70 mt-1 text-sm sm:text-base">État et suivi des commandes clients et entreprises.</p>
        </header>
        <div className="dashboard-grid">
          <Sidebar />
          <main className="main-panel min-w-0">
            <div className="card p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 mb-4">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm min-h-[44px] sm:min-h-0"
                  aria-label="Filtrer par statut"
                >
                  <option value="">Tous les statuts</option>
                  {STATUS_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <div className="flex flex-wrap gap-2">
                  <Link href="/admin/orders" className="inline-flex items-center min-h-[44px] px-4 rounded-lg text-cyan-400 hover:text-cyan-300 text-sm border border-cyan-400/30 hover:bg-cyan-400/10">
                    Gestion complète (assignation livreur) →
                  </Link>
                  <Link href="/admin/reports" className="inline-flex items-center min-h-[44px] px-4 py-2 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-200 text-sm hover:bg-amber-500/30">
                    Exporter la liste en PDF
                  </Link>
                </div>
              </div>
              {error && <p className="mb-4 text-red-300 text-sm" role="alert">{error}</p>}
              {loading ? (
                <p className="text-white/60 py-8 text-center">Chargement...</p>
              ) : list.length === 0 ? (
                <p className="text-white/60 py-8 text-center">Aucune commande.</p>
              ) : (
                <>
                  {/* Vue tableau (écrans md et plus) */}
                  <div className="hidden md:block overflow-x-auto -mx-2 rounded-xl border border-white/10 overflow-hidden">
                    <table className="w-full text-left text-sm min-w-[600px]">
                      <thead>
                        <tr className="bg-[#0f172a] border-b border-cyan-500/30">
                          <th className="px-4 py-3 text-cyan-200/90 font-semibold">N°</th>
                          <th className="px-4 py-3 text-cyan-200/90 font-semibold">Date</th>
                          <th className="px-4 py-3 text-cyan-200/90 font-semibold">Client / Montant</th>
                          <th className="px-4 py-3 text-cyan-200/90 font-semibold">Statut</th>
                          <th className="px-4 py-3 text-cyan-200/90 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {list.map((o, idx) => (
                          <tr
                            key={o.id}
                            className={`border-b border-white/10 ${idx % 2 === 0 ? 'bg-white/5' : 'bg-white/[0.07]'} hover:bg-cyan-500/10 transition-colors`}
                          >
                            <td className="px-4 py-3 text-white/90 font-mono">{o.id}</td>
                            <td className="px-4 py-3 text-white/80">{formatDate(o.created_at)}</td>
                            <td className="px-4 py-3 text-white/85">
                              {o.user?.name ?? o.user_id ?? '—'} · {o.total_amount ?? '—'} {getCurrencyLabel(o)}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium ${getStatusClass(o.status)}`}>
                                {STATUS_LABELS[o.status] ?? o.status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-2">
                                <button type="button" onClick={(e) => handleShowDetail(o, e)} className="min-h-[36px] min-w-[44px] px-3 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-medium cursor-pointer hover:bg-cyan-500/30 active:scale-[0.98]">
                                  Voir
                                </button>
                                <button type="button" onClick={(e) => handleDownloadPdf(o.id, e)} disabled={pdfId === o.id} className="min-h-[36px] min-w-[44px] px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs font-medium cursor-pointer hover:bg-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]">
                                  {pdfId === o.id ? '…' : 'PDF'}
                                </button>
                                <button type="button" onClick={(e) => handleDelete(o.id, e)} disabled={deletingId === o.id} className="min-h-[36px] min-w-[44px] px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-400/40 text-red-300 text-xs font-medium cursor-pointer hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]">
                                  {deletingId === o.id ? '…' : 'Suppr.'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Vue cartes (mobile) */}
                  <div className="md:hidden space-y-4">
                    {list.map((o) => (
                      <div key={o.id} className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-white/60 text-xs">N°</span>
                          <span className="text-white font-mono font-semibold">{o.id}</span>
                        </div>
                        <div className="flex justify-between items-center gap-2 text-sm">
                          <span className="text-white/60">Date</span>
                          <span className="text-white/90">{formatDate(o.created_at)}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-white/60">Client / Montant</span>
                          <p className="text-white/90 mt-0.5">
                            {o.user?.name ?? o.user_id ?? '—'} · {o.total_amount ?? '—'} {getCurrencyLabel(o)}
                          </p>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-white/60 text-sm">Statut</span>
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${getStatusClass(o.status)}`}>{STATUS_LABELS[o.status] ?? o.status}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
                          <button type="button" onClick={(e) => handleShowDetail(o, e)} className="min-h-[44px] flex-1 min-w-[80px] px-4 py-2.5 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-sm font-medium cursor-pointer hover:bg-cyan-500/30 active:scale-[0.98] touch-manipulation">
                            Voir
                          </button>
                          <button type="button" onClick={(e) => handleDownloadPdf(o.id, e)} disabled={pdfId === o.id} className="min-h-[44px] flex-1 min-w-[80px] px-4 py-2.5 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-200 text-sm font-medium cursor-pointer hover:bg-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] touch-manipulation">
                            {pdfId === o.id ? '…' : 'PDF'}
                          </button>
                          <button type="button" onClick={(e) => handleDelete(o.id, e)} disabled={deletingId === o.id} className="min-h-[44px] flex-1 min-w-[80px] px-4 py-2.5 rounded-lg bg-red-500/20 border border-red-400/40 text-red-300 text-sm font-medium cursor-pointer hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] touch-manipulation">
                            {deletingId === o.id ? '…' : 'Suppr.'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
              <p className="mt-4 text-white/60 text-sm"><Link href="/admin" className="text-cyan-400 hover:text-cyan-300">← Tableau de bord</Link></p>
            </div>
          </main>
        </div>
      </div>

      {detailOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setDetailOrder(null)} role="dialog" aria-modal="true" aria-labelledby="detail-title">
          <div className="bg-[#0b1220] border border-white/20 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto p-6" onClick={(e) => e.stopPropagation()}>
            <h2 id="detail-title" className="text-lg font-bold text-cyan-400 mb-4">Commande #{detailOrder.id}</h2>
            <p className="text-white/80 text-sm">Client : {detailOrder.user?.name ?? detailOrder.user?.email ?? '—'}</p>
            <p className="text-white/80 text-sm">Adresse : {detailOrder.delivery_address ?? '—'}</p>
            <p className="text-white/80 text-sm">Code livraison : {detailOrder.delivery_code ?? '—'}</p>
            <p className="text-white/80 text-sm mt-2">Statut : <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium ${getStatusClass(detailOrder.status)}`}>{STATUS_LABELS[detailOrder.status] ?? detailOrder.status}</span></p>
            <div className="mt-4">
              <label className="block text-white/70 text-xs mb-1">Changer le statut</label>
              <select
                value={detailOrder.status}
                onChange={(e) => { const v = e.target.value; if (v !== detailOrder.status) handleUpdateStatus(detailOrder.id, v); }}
                disabled={updatingId === detailOrder.id}
                className="w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm min-h-[44px]"
              >
                {STATUS_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              {updatingId === detailOrder.id && <p className="text-white/50 text-xs mt-1">Mise à jour…</p>}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={(e) => handleDownloadPdf(detailOrder.id, e)} disabled={pdfId === detailOrder.id} className="min-h-[44px] px-4 py-2.5 rounded-lg bg-amber-500/20 text-amber-200 text-sm font-medium cursor-pointer hover:bg-amber-500/30 disabled:opacity-50 touch-manipulation">
                Télécharger PDF
              </button>
              <button type="button" onClick={() => setDetailOrder(null)} className="min-h-[44px] px-4 py-2.5 rounded-lg border border-white/20 text-white/90 text-sm cursor-pointer hover:bg-white/10 touch-manipulation">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
