"use client"
import Sidebar from '@/components/Sidebar'
import Link from 'next/link'
import { useEffect, useState, useCallback } from 'react'
import { apiRequest } from '@/lib/api'
import { formatDate, formatCurrencyCDF } from '@/lib/helpers'
import GoldButton from '@/components/GoldButton'
import Toaster, { pushToast } from '@/components/Toaster'

export default function AdminSubscriptionsPage() {
  const [subs, setSubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [actioning, setActioning] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectId, setRejectId] = useState(null)
  const [statusFilter, setStatusFilter] = useState('') // '' = tous, ou pending, active, paused, etc.

  const loadSubs = useCallback(() => {
    setLoading(true)
    apiRequest('/api/subscriptions', { method: 'GET' })
      .then((r) => setSubs(Array.isArray(r) ? r : []))
      .catch(() => setSubs([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadSubs()
  }, [loadSubs])

  const pending = subs.filter((s) => s.status === 'pending')
  const active = subs.filter((s) => s.status === 'active')
  const rejected = subs.filter((s) => s.status === 'rejected')
  const filteredSubs = statusFilter ? subs.filter((s) => s.status === statusFilter) : subs
  const STATUS_LABELS = { pending: 'En attente', active: 'Actif', paused: 'En pause', rejected: 'Refusé', expired: 'Expiré', cancelled: 'Annulé' }

  async function handleValidate(id) {
    setActioning(id)
    try {
      await apiRequest(`/api/admin/subscriptions/validate/${id}`, { method: 'POST' })
      setRejectId(null)
      loadSubs()
      pushToast('Abonnement validé et activé.', 'success')
    } catch (e) {
      console.error(e)
      pushToast(e?.message || 'Erreur lors de la validation.', 'error')
    } finally {
      setActioning(null)
    }
  }

  async function handleReject(id) {
    if (!rejectReason.trim() && rejectId === id) return
    setActioning(id)
    try {
      await apiRequest(`/api/admin/subscriptions/reject/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason.trim() || 'Paiement non reçu ou échoué.' }),
      })
      setRejectId(null)
      setRejectReason('')
      loadSubs()
      pushToast('Demande rejetée.', 'success')
    } catch (e) {
      console.error(e)
      pushToast(e?.message || 'Erreur lors du rejet.', 'error')
    } finally {
      setActioning(null)
    }
  }

  async function handlePause(id) {
    setActioning(id)
    try {
      await apiRequest(`/api/admin/subscriptions/${id}/pause`, { method: 'POST' })
      loadSubs()
      pushToast('Abonnement mis en pause.', 'success')
    } catch (e) {
      console.error(e)
      pushToast(e?.message || 'Erreur.', 'error')
    } finally {
      setActioning(null)
    }
  }

  async function handleResume(id) {
    setActioning(id)
    try {
      await apiRequest(`/api/admin/subscriptions/${id}/resume`, { method: 'POST' })
      loadSubs()
      pushToast('Abonnement repris.', 'success')
    } catch (e) {
      console.error(e)
      pushToast(e?.message || 'Erreur.', 'error')
    } finally {
      setActioning(null)
    }
  }

  async function handleCancel(id) {
    if (!confirm('Annuler définitivement cet abonnement ?')) return
    setActioning(id)
    try {
      await apiRequest(`/api/admin/subscriptions/${id}/cancel`, { method: 'POST' })
      loadSubs()
      pushToast('Abonnement annulé.', 'success')
    } catch (e) {
      console.error(e)
      pushToast(e?.message || 'Erreur.', 'error')
    } finally {
      setActioning(null)
    }
  }

  function getStatusBadge(status) {
    switch (status) {
      case 'active': return 'badge-success'
      case 'rejected': return 'badge-error'
      case 'cancelled': return 'badge-error'
      case 'pending': return 'badge-warning'
      case 'paused': return 'badge-warning'
      case 'expired': return 'badge-warning'
      default: return 'badge-warning'
    }
  }

  return (
    <section className="page-section min-h-screen bg-[#0b1220] text-white">
      <div className="container">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2" style={{
              background: 'linear-gradient(135deg, #d4af37 0%, #f5e08a 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Abonnements clients
            </h1>
            <p className="text-white/70 text-lg">Validez ou rejetez les demandes après vérification du paiement. Gérez les plans ci-dessous.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/subscription-plans">
              <button type="button" className="px-4 py-2 rounded-lg border border-white/30 text-white/90 hover:bg-white/10 transition">
                Plans d&apos;abonnement (CRUD)
              </button>
            </Link>
            <Link href="/admin/subscriptions/create">
              <GoldButton>Créer un abonnement pour un client</GoldButton>
            </Link>
          </div>
        </header>

        <div className="dashboard-grid">
          <Sidebar />
          <main className="main-panel space-y-6">
            {pending.length > 0 && (
              <div className="card p-4 border-amber-500/30 bg-amber-500/5">
                <h2 className="text-lg font-semibold text-amber-300 mb-3">En attente de validation ({pending.length})</h2>
                <p className="text-white/60 text-sm mb-4">Vérifiez le paiement puis validez ou rejetez.</p>
                <div className="space-y-3">
                  {pending.map((s) => (
                    <div key={s.id} className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <span className="font-medium text-white">{s.plan}</span>
                        <span className="text-white/60 text-sm ml-2">
                          {formatCurrencyCDF(Number(s.price))} {s.period === 'week' ? '/ semaine' : '/ mois'}
                        </span>
                        {s.user && (
                          <p className="text-white/50 text-sm mt-1">{s.user.name || s.user.email}</p>
                        )}
                        <p className="text-white/40 text-xs mt-0.5">Demande du {formatDate(s.created_at)}</p>
                        {s.has_payment_received && (
                          <span className="inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium bg-green-500/30 text-green-300 border border-green-500/50">Paiement reçu</span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleValidate(s.id)}
                          disabled={actioning !== null}
                          className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-green-600 text-white hover:bg-green-500 disabled:opacity-50"
                        >
                          {actioning === s.id ? 'Validation…' : 'Valider'}
                        </button>
                        {rejectId !== s.id ? (
                          <button
                            type="button"
                            onClick={() => setRejectId(s.id)}
                            disabled={actioning !== null}
                            className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-red-600/80 text-white hover:bg-red-500 disabled:opacity-50"
                          >
                            Rejeter
                          </button>
                        ) : (
                          <>
                            <input
                              type="text"
                              placeholder="Motif (optionnel)"
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              className="px-2 py-1 rounded bg-white/10 border border-white/20 text-white text-sm w-48"
                            />
                            <button
                              type="button"
                              onClick={() => handleReject(s.id)}
                              disabled={actioning !== null}
                              className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-500 disabled:opacity-50"
                            >
                              {actioning === s.id ? 'Rejet…' : 'Confirmer rejet'}
                            </button>
                            <button type="button" onClick={() => setRejectId(null)} className="text-white/60 text-sm">Annuler</button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                <h2 className="text-lg font-semibold text-white/90">Historique — tous les abonnements</h2>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm"
                >
                  <option value="">Tous les statuts</option>
                  <option value="pending">En attente</option>
                  <option value="active">Actif</option>
                  <option value="paused">En pause</option>
                  <option value="expired">Expiré</option>
                  <option value="rejected">Refusé</option>
                  <option value="cancelled">Annulé</option>
                </select>
              </div>
              {loading ? (
                <div className="card text-center py-12">
                  <p className="text-white/60">Chargement...</p>
                </div>
              ) : filteredSubs.length === 0 ? (
                <div className="card text-center py-12">
                  <p className="text-white/60">{statusFilter ? 'Aucun abonnement avec ce statut.' : 'Aucun abonnement.'}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredSubs.map((s) => (
                    <div key={s.id} className="card p-4 border border-white/10 flex flex-wrap justify-between items-start gap-4">
                      <div>
                        <span className="font-semibold text-cyan-400">{s.plan}</span>
                        <span className={`badge ${getStatusBadge(s.status)} ml-2`}>{STATUS_LABELS[s.status] || s.status}</span>
                        {s.user && (
                          <p className="text-white/60 text-sm mt-1">{s.user.name || s.user.email}</p>
                        )}
                        <p className="text-white/70 text-sm mt-1">
                          {formatCurrencyCDF(Number(s.price))} {s.period === 'week' ? '/ semaine' : '/ mois'}
                        </p>
                        {(s.started_at || s.expires_at) && (
                          <p className="text-white/50 text-xs mt-1">
                            {s.started_at && `Du ${formatDate(s.started_at)}`}
                            {s.expires_at && ` au ${formatDate(s.expires_at)}`}
                          </p>
                        )}
                        {s.status === 'rejected' && s.rejected_reason && (
                          <p className="text-red-300/80 text-xs mt-1">Motif : {s.rejected_reason}</p>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {s.status === 'active' && (
                          <>
                            <button type="button" onClick={() => handlePause(s.id)} disabled={actioning !== null} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-amber-600 text-white hover:bg-amber-500 disabled:opacity-50">{actioning === s.id ? 'Mise en pause…' : 'Mettre en pause'}</button>
                            <button type="button" onClick={() => handleCancel(s.id)} disabled={actioning !== null} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-600/80 text-white hover:bg-red-500 disabled:opacity-50">{actioning === s.id ? 'Annulation…' : 'Annuler'}</button>
                          </>
                        )}
                        {s.status === 'paused' && (
                          <button type="button" onClick={() => handleResume(s.id)} disabled={actioning !== null} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-500 disabled:opacity-50">{actioning === s.id ? 'Reprise…' : 'Reprendre'}</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
      <Toaster />
    </section>
  )
}
