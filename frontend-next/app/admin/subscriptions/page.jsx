"use client"
import Sidebar from '@/components/Sidebar'
import Link from 'next/link'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { apiRequest } from '@/lib/api'
import { useEchoChannel } from '@/lib/useEchoChannel'
import { pushRealtimePing } from '@/lib/realtimePing'
import { formatDate, formatCurrencyCDF } from '@/lib/helpers'
import GoldButton from '@/components/GoldButton'
import Toaster, { pushToast } from '@/components/Toaster'
import styles from './subscriptions.module.css'

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

export default function AdminSubscriptionsPage() {
  const [subs, setSubs] = useState([])
  const [pendingList, setPendingList] = useState([])
  const [loading, setLoading] = useState(true)
  const [actioning, setActioning] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectId, setRejectId] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('personal')
  const [deliverTomorrow, setDeliverTomorrow] = useState(false)

  const loadSubs = useCallback(() => {
    setLoading(true)
    const url = buildOperationalQuery(statusFilter, dateFilter, typeFilter, deliverTomorrow)
    Promise.all([
      apiRequest('/api/subscriptions', { method: 'GET' }),
      apiRequest(url, { method: 'GET' }),
    ])
      .then(([allRaw, opRaw]) => {
        const all = Array.isArray(allRaw) ? allRaw : []
        setPendingList(all.filter((s) => s.status === 'pending'))
        setSubs(Array.isArray(opRaw?.data) ? opRaw.data : [])
      })
      .catch(() => {
        setPendingList([])
        setSubs([])
      })
      .finally(() => setLoading(false))
  }, [statusFilter, dateFilter, typeFilter, deliverTomorrow])

  useEffect(() => {
    loadSubs()
  }, [loadSubs])

  useEchoChannel({
    channel: 'subscriptions.admin',
    event: '.subscription.updated',
    onEvent: (payload) => {
      if (payload?.scope !== 'personal') return
      const ref = payload?.subscription_id ? `#${payload.subscription_id}` : ''
      const evt = payload?.event || 'updated'
      pushRealtimePing(`Abonnement ${ref} : ${evt}`.trim())
      loadSubs()
    },
  })

  const pending = pendingList

  const sortedSubs = useMemo(() => {
    const order = { pending: 0, scheduled: 1, active: 2, paused: 3, expired: 4, rejected: 5, cancelled: 6 }
    return [...subs].sort((a, b) => {
      const da = order[a.status] ?? 99
      const db = order[b.status] ?? 99
      if (da !== db) return da - db
      return new Date(b.created_at) - new Date(a.created_at)
    })
  }, [subs])

  const STATUS_LABELS = {
    pending: 'En attente',
    scheduled: 'Planifié',
    active: 'Actif',
    paused: 'En pause',
    rejected: 'Refusé',
    expired: 'Expiré',
    cancelled: 'Annulé',
  }

  async function handleValidate(id) {
    setActioning(id)
    try {
      await apiRequest(`/api/admin/subscriptions/validate/${id}`, { method: 'POST' })
      setRejectId(null)
      loadSubs()
      pushToast({ message: 'Abonnement planifié (premier jour ouvré).', type: 'success' })
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
      case 'scheduled': return 'badge-scheduled'
      case 'rejected': return 'badge-error'
      case 'cancelled': return 'badge-error'
      case 'pending': return 'badge-sub-pending'
      case 'paused': return 'badge-warning'
      case 'expired': return 'badge-expired'
      default: return 'badge-warning'
    }
  }

  return (
    <section className={`page-section page-section--admin-tight min-h-screen text-white bg-[#0b1220] ${styles.page}`}>
      <div className={styles.pageInner}>
        <header className={styles.hero}>
          <div>
            <h1 className={styles.title}>Abonnements clients</h1>
            <p className={styles.lead}>
              Toutes les souscriptions clients (particuliers) sont listées ici. Une demande reste <strong>en attente</strong> jusqu’à votre validation ou votre refus après vérification du paiement. Seul l’administrateur peut valider, rejeter, mettre en pause ou supprimer (annuler) un abonnement — le client ne peut pas suspendre son abonnement lui-même.
            </p>
          </div>
          <div className={styles.toolbar}>
            <Link href="/admin/subscription-plans" className={styles.btnGhost}>
              Plans d&apos;abonnement (CRUD)
            </Link>
            <GoldButton href="/admin/subscriptions/create">Créer un abonnement pour un client</GoldButton>
          </div>
        </header>

        <div className="dashboard-grid">
          <Sidebar />
          <main className="main-panel space-y-6">
            {pending.length > 0 && (
              <div className={styles.pendingBanner}>
                <h2 className={`${styles.sectionHeading} text-amber-200/95`}>En attente de validation ({pending.length})</h2>
                <p className="text-white/65 text-sm mb-4">Vérifiez le paiement puis validez ou rejetez.</p>
                <div className="space-y-3">
                  {pending.map((s) => (
                    <div key={s.id} className={`${styles.cardList} flex flex-wrap items-center justify-between gap-4`}>
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
                          className={`${styles.btn} ${styles.btnSuccess}`}
                        >
                          {actioning === s.id ? 'Validation…' : 'Valider'}
                        </button>
                        {rejectId !== s.id ? (
                          <button
                            type="button"
                            onClick={() => setRejectId(s.id)}
                            disabled={actioning !== null}
                            className={`${styles.btn} ${styles.btnDanger}`}
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
                              className={`${styles.inputInline} w-48 max-w-full`}
                            />
                            <button
                              type="button"
                              onClick={() => handleReject(s.id)}
                              disabled={actioning !== null}
                              className={`${styles.btn} ${styles.btnDanger}`}
                            >
                              {actioning === s.id ? 'Rejet…' : 'Confirmer rejet'}
                            </button>
                            <button type="button" onClick={() => setRejectId(null)} className={styles.linkQuiet}>Annuler</button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (!confirm('Supprimer cette demande sans l’examiner davantage ?')) return
                            handleCancel(s.id)
                          }}
                          disabled={actioning !== null}
                          className={`${styles.btn} ${styles.btnMuted}`}
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
              <h2 className={styles.h2Filters}>Historique — exploitation</h2>
              <div className={styles.filtersBar}>
                <div className={styles.filterField}>
                  <label htmlFor="sub-filter-status">Statut</label>
                  <select
                    id="sub-filter-status"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    disabled={deliverTomorrow}
                    className={styles.select}
                  >
                    <option value="">Tous les statuts</option>
                    <option value="pending">En attente</option>
                    <option value="scheduled">Planifié</option>
                    <option value="active">Actif</option>
                    <option value="paused">En pause</option>
                    <option value="expired">Expiré</option>
                    <option value="rejected">Refusé</option>
                    <option value="cancelled">Annulé</option>
                  </select>
                </div>
                <div className={styles.filterField}>
                  <label htmlFor="sub-filter-period">Période</label>
                  <select
                    id="sub-filter-period"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    disabled={deliverTomorrow}
                    className={styles.select}
                  >
                    <option value="">Toutes les dates</option>
                    <option value="today">Aujourd&apos;hui</option>
                    <option value="tomorrow">Demain</option>
                    <option value="week">Cette semaine</option>
                  </select>
                </div>
                <div className={styles.filterField}>
                  <label htmlFor="sub-filter-type">Type</label>
                  <select
                    id="sub-filter-type"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className={styles.select}
                  >
                    <option value="personal">Particulier</option>
                    <option value="company">Entreprise</option>
                    <option value="all">Tous</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => setDeliverTomorrow((v) => !v)}
                  className={`${styles.btnFilterToggle} ${deliverTomorrow ? styles.btnFilterToggleActive : ''}`}
                >
                  À livrer demain
                </button>
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
                    <div key={`${s.subscription_kind || 'personal'}-${s.id}`} className={`${styles.cardList} flex flex-wrap justify-between items-start gap-4`}>
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-cyan-400">{s.plan}</span>
                        <span className={`badge ${getStatusBadge(s.status)} ml-2`}>{STATUS_LABELS[s.status] || s.status}</span>
                        {s.subscription_type_label && (
                          <span className="text-white/45 text-xs ml-2">· {s.subscription_type_label}</span>
                        )}
                        {s.period && s.subscription_kind !== 'company' && (
                          <span className="text-white/45 text-xs ml-2">
                            ({s.period === 'week' ? 'hebdomadaire' : 'mensuel'})
                          </span>
                        )}
                        <p className="text-white/60 text-sm mt-1">
                          {s.subscription_kind === 'company' ? (s.company_name || 'Entreprise') : (s.user?.name || s.user?.email || '—')}
                        </p>
                        {s.subscription_kind === 'company' ? (
                          <p className="text-white/70 text-sm mt-1">
                            {s.price != null ? formatCurrencyCDF(Number(s.price)) : '—'} / mois
                            {s.subscription_agent_count != null ? ` · ${s.subscription_agent_count} agents` : ''}
                          </p>
                        ) : (
                          <p className="text-white/70 text-sm mt-1">
                            {formatCurrencyCDF(Number(s.price))} {s.period === 'week' ? '/ semaine' : '/ mois'}
                          </p>
                        )}
                        {s.next_meal_day && (
                          <p className="text-emerald-200/90 text-xs mt-1">
                            Prochain jour de repas : {formatDate(s.next_meal_day)}
                            {s.next_meal_label ? ` — ${s.next_meal_label}` : ''}
                          </p>
                        )}
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
                        {s.subscription_kind !== 'company' && s.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleValidate(s.id)}
                              disabled={actioning !== null}
                              className={`${styles.btn} ${styles.btnSuccess}`}
                            >
                              {actioning === s.id ? '…' : 'Approuver'}
                            </button>
                            {rejectId !== s.id ? (
                              <button
                                type="button"
                                onClick={() => { setRejectId(s.id); setRejectReason('') }}
                                disabled={actioning !== null}
                                className={`${styles.btn} ${styles.btnDanger}`}
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
                                  className={`${styles.inputInline} w-44 max-w-full`}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleReject(s.id)}
                                  disabled={actioning !== null}
                                  className={`${styles.btn} ${styles.btnDanger}`}
                                >
                                  {actioning === s.id ? '…' : 'Confirmer rejet'}
                                </button>
                                <button type="button" onClick={() => { setRejectId(null); setRejectReason('') }} className={styles.linkQuiet}>
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
                              className={`${styles.btn} ${styles.btnMuted}`}
                            >
                              {actioning === s.id ? '…' : 'Supprimer la demande'}
                            </button>
                          </>
                        )}
                        {s.subscription_kind !== 'company' && s.status === 'scheduled' && (
                          <button
                            type="button"
                            onClick={() => {
                              if (!confirm('Annuler cet abonnement planifié (avant la date d’effet) ?')) return
                              handleCancel(s.id)
                            }}
                            disabled={actioning !== null}
                            className={`${styles.btn} ${styles.btnDanger}`}
                          >
                            {actioning === s.id ? '…' : 'Annuler la planification'}
                          </button>
                        )}
                        {s.subscription_kind !== 'company' && s.status === 'active' && (
                          <>
                            <button type="button" onClick={() => handlePause(s.id)} disabled={actioning !== null} className={`${styles.btn} ${styles.btnAmber}`}>{actioning === s.id ? '…' : 'Mettre en pause'}</button>
                            <button type="button" onClick={() => { if (!confirm('Annuler cet abonnement actif ? Le client en sera informé via le statut.')) return; handleCancel(s.id) }} disabled={actioning !== null} className={`${styles.btn} ${styles.btnDanger}`}>{actioning === s.id ? '…' : 'Résilier / annuler'}</button>
                          </>
                        )}
                        {s.subscription_kind !== 'company' && s.status === 'paused' && (
                          <>
                            <button type="button" onClick={() => handleResume(s.id)} disabled={actioning !== null} className={`${styles.btn} ${styles.btnSuccess}`}>{actioning === s.id ? '…' : 'Reprendre'}</button>
                            <button type="button" onClick={() => { if (!confirm('Annuler définitivement cet abonnement ?')) return; handleCancel(s.id) }} disabled={actioning !== null} className={`${styles.btn} ${styles.btnDanger}`}>{actioning === s.id ? '…' : 'Résilier'}</button>
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
