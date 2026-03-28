"use client"
import Sidebar from '@/components/Sidebar'
import Link from 'next/link'
import { useEffect, useState, useCallback, useMemo } from 'react'
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
  const filteredSubs = statusFilter ? subs.filter((s) => s.status === statusFilter) : subs

  const sortedSubs = useMemo(() => {
    const order = { pending: 0, active: 1, paused: 2, expired: 3, rejected: 4, cancelled: 5 }
    return [...filteredSubs].sort((a, b) => {
      const da = order[a.status] ?? 99
      const db = order[b.status] ?? 99
      if (da !== db) return da - db
      return new Date(b.created_at) - new Date(a.created_at)
    })
  }, [filteredSubs])

  const STATUS_LABELS = { pending: 'En attente', active: 'Actif', paused: 'En pause', rejected: 'Refusé', expired: 'Expiré', cancelled: 'Annulé' }

  async function handleValidate(id) {
    setActioning(id)
    try {
      await apiRequest(`/api/admin/subscriptions/validate/${id}`, { method: 'POST' })
      setRejectId(null)
      loadSubs()
      pushToast({ message: 'Abonnement validé et activé.', type: 'success' })
    } catch (e) {
      console.error(e)
      pushToast({ message: e?.message || 'Erreur lors de la validation.', type: 'error' })
    } finally {
      setActioning(null)
    }
  }

  async function handleReject(id) {
    setActioning(id)
    try {
      await apiRequest(`/api/admin/subscriptions/reject/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: rejectReason.trim() || 'Demande refusée par l\'administrateur.',
        }),
      })
      setRejectId(null)
      setRejectReason('')
      loadSubs()
      pushToast({ message: 'Demande rejetée.', type: 'success' })
    } catch (e) {
      console.error(e)
      pushToast({ message: e?.message || 'Erreur lors du rejet.', type: 'error' })
    } finally {
      setActioning(null)
    }
  }

  async function handlePause(id) {
    setActioning(id)
    try {
      await apiRequest(`/api/admin/subscriptions/${id}/pause`, { method: 'POST' })
      loadSubs()
      pushToast({ message: 'Abonnement mis en pause.', type: 'success' })
    } catch (e) {
      console.error(e)
      pushToast({ message: e?.message || 'Erreur.', type: 'error' })
    } finally {
      setActioning(null)
    }
  }

  async function handleResume(id) {
    setActioning(id)
    try {
      await apiRequest(`/api/admin/subscriptions/${id}/resume`, { method: 'POST' })
      loadSubs()
      pushToast({ message: 'Abonnement repris.', type: 'success' })
    } catch (e) {
      console.error(e)
      pushToast({ message: e?.message || 'Erreur.', type: 'error' })
    } finally {
      setActioning(null)
    }
  }

  async function handleCancel(id) {
    setActioning(id)
    try {
      await apiRequest(`/api/admin/subscriptions/${id}/cancel`, { method: 'POST' })
      loadSubs()
      pushToast({ message: 'Abonnement annulé.', type: 'success' })
    } catch (e) {
      console.error(e)
      pushToast({ message: e?.message || 'Erreur.', type: 'error' })
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
            <p className="text-white/70 text-lg max-w-3xl">
              Toutes les souscriptions clients (particuliers) sont listées ici. Une demande reste <strong className="text-amber-200/90">en attente</strong> jusqu’à votre validation ou votre refus après vérification du paiement. Seul l’administrateur peut valider, rejeter, mettre en pause ou supprimer (annuler) un abonnement — le client ne peut pas suspendre son abonnement lui-même.
            </p>
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
                        <button
                          type="button"
                          onClick={() => {
                            if (!confirm('Supprimer cette demande sans l’examiner davantage ?')) return
                            handleCancel(s.id)
                          }}
                          disabled={actioning !== null}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white/10 border border-white/25 text-white/90 hover:bg-white/15 disabled:opacity-50"
                        >
                          Supprimer la demande
                        </button>
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
              ) : sortedSubs.length === 0 ? (
                <div className="card text-center py-12">
                  <p className="text-white/60">{statusFilter ? 'Aucun abonnement avec ce statut.' : 'Aucun abonnement.'}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedSubs.map((s) => (
                    <div key={s.id} className="card p-4 border border-white/10 flex flex-wrap justify-between items-start gap-4">
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-cyan-400">{s.plan}</span>
                        <span className={`badge ${getStatusBadge(s.status)} ml-2`}>{STATUS_LABELS[s.status] || s.status}</span>
                        {s.period && (
                          <span className="text-white/45 text-xs ml-2">
                            ({s.period === 'week' ? 'hebdomadaire' : 'mensuel'})
                          </span>
                        )}
                        {s.user && (
                          <p className="text-white/60 text-sm mt-1">{s.user.name || s.user.email}</p>
                        )}
                        <p className="text-white/70 text-sm mt-1">
                          {formatCurrencyCDF(Number(s.price))} {s.period === 'week' ? '/ semaine' : '/ mois'}
                        </p>
                        <p className="text-white/40 text-xs mt-0.5">Demande du {formatDate(s.created_at)}</p>
                        {(s.started_at || s.expires_at) && (
                          <p className="text-white/50 text-xs mt-1">
                            {s.started_at && `Début effectif ${formatDate(s.started_at)}`}
                            {s.expires_at && ` · Fin prévue ${formatDate(s.expires_at)}`}
                          </p>
                        )}
                        {s.status === 'pending' && s.has_payment_received && (
                          <span className="inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium bg-green-500/30 text-green-300 border border-green-500/50">Paiement signalé</span>
                        )}
                        {s.status === 'rejected' && s.rejected_reason && (
                          <p className="text-red-300/80 text-xs mt-1">Motif : {s.rejected_reason}</p>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 justify-end">
                        {s.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleValidate(s.id)}
                              disabled={actioning !== null}
                              className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-green-600 text-white hover:bg-green-500 disabled:opacity-50"
                            >
                              {actioning === s.id ? '…' : 'Approuver'}
                            </button>
                            {rejectId !== s.id ? (
                              <button
                                type="button"
                                onClick={() => { setRejectId(s.id); setRejectReason('') }}
                                disabled={actioning !== null}
                                className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-red-600/80 text-white hover:bg-red-500 disabled:opacity-50"
                              >
                                Rejeter
                              </button>
                            ) : (
                              <>
                                <input
                                  type="text"
                                  placeholder="Motif du refus (optionnel)"
                                  value={rejectReason}
                                  onChange={(e) => setRejectReason(e.target.value)}
                                  className="px-2 py-1 rounded bg-white/10 border border-white/20 text-white text-sm w-44 max-w-full"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleReject(s.id)}
                                  disabled={actioning !== null}
                                  className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-500 disabled:opacity-50"
                                >
                                  {actioning === s.id ? '…' : 'Confirmer rejet'}
                                </button>
                                <button type="button" onClick={() => { setRejectId(null); setRejectReason('') }} className="text-white/60 text-sm">
                                  Fermer
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                if (!confirm('Supprimer définitivement cette demande (sans l’approuver) ?')) return
                                handleCancel(s.id)
                              }}
                              disabled={actioning !== null}
                              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white/10 border border-white/25 text-white/90 hover:bg-white/15 disabled:opacity-50"
                            >
                              {actioning === s.id ? '…' : 'Supprimer la demande'}
                            </button>
                          </>
                        )}
                        {s.status === 'active' && (
                          <>
                            <button type="button" onClick={() => handlePause(s.id)} disabled={actioning !== null} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-amber-600 text-white hover:bg-amber-500 disabled:opacity-50">{actioning === s.id ? '…' : 'Mettre en pause'}</button>
                            <button type="button" onClick={() => { if (!confirm('Annuler cet abonnement actif ? Le client en sera informé via le statut.')) return; handleCancel(s.id) }} disabled={actioning !== null} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-600/80 text-white hover:bg-red-500 disabled:opacity-50">{actioning === s.id ? '…' : 'Résilier / annuler'}</button>
                          </>
                        )}
                        {s.status === 'paused' && (
                          <>
                            <button type="button" onClick={() => handleResume(s.id)} disabled={actioning !== null} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-500 disabled:opacity-50">{actioning === s.id ? '…' : 'Reprendre'}</button>
                            <button type="button" onClick={() => { if (!confirm('Annuler définitivement cet abonnement ?')) return; handleCancel(s.id) }} disabled={actioning !== null} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-600/80 text-white hover:bg-red-500 disabled:opacity-50">{actioning === s.id ? '…' : 'Résilier'}</button>
                          </>
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
