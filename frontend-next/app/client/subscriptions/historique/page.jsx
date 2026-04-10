'use client'

import ClientSubpageHeader from '@/components/ClientSubpageHeader'
import ReadOnlyGuard from '@/components/ReadOnlyGuard'
import Link from 'next/link'
import { useEffect, useState, useCallback } from 'react'
import { apiRequest } from '@/lib/api'
import { formatDate, formatCurrencyCDF } from '@/lib/helpers'
import { pushToast } from '@/components/Toaster'

const STATUS_LABELS = {
  pending: 'En attente',
  active: 'Actif',
  paused: 'En pause',
  rejected: 'Refusé',
  expired: 'Expiré',
  cancelled: 'Annulé',
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

function periodLabel(period) {
  return period === 'week' ? 'semaine' : 'mois'
}

export default function ClientSubscriptionsHistoryPage() {
  const [subs, setSubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const [clearing, setClearing] = useState(false)

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

  const historySubs = subs.filter((s) => !['pending', 'active'].includes(s.status))

  async function handleDeleteOne(id) {
    if (!confirm('Retirer cette entrée de votre historique ? Cette action est définitive pour votre espace client.')) return
    setDeletingId(id)
    try {
      await apiRequest(`/api/subscriptions/my-history/${id}`, { method: 'DELETE' })
      pushToast({ type: 'success', message: 'Entrée supprimée de votre historique.' })
      loadSubs()
    } catch (err) {
      pushToast({ type: 'error', message: err?.message || 'Suppression impossible.' })
    } finally {
      setDeletingId(null)
    }
  }

  async function handleClearAll() {
    if (!confirm('Effacer tout l’historique affiché (abonnements terminés uniquement) ?')) return
    setClearing(true)
    try {
      const r = await apiRequest('/api/subscriptions/my-history', { method: 'DELETE' })
      pushToast({ type: 'success', message: r?.message || 'Historique effacé.' })
      loadSubs()
    } catch (err) {
      pushToast({ type: 'error', message: err?.message || 'Action impossible.' })
    } finally {
      setClearing(false)
    }
  }

  return (
    <ReadOnlyGuard allowedActions={['view', 'read', 'subscribe']} showWarning={false}>
      <section className="page-section min-h-screen bg-[#0b1220]">
        <div className="container">
          <div className="mb-6">
            <Link
              href="/client/subscriptions"
              className="text-cyan-300 hover:text-cyan-200 text-sm font-medium inline-block mb-4 underline underline-offset-2"
            >
              ← Retour à mes abonnements
            </Link>
            <ClientSubpageHeader
              title="Historique des abonnements"
              subtitle="Consultation des dossiers clôturés (refus, expiration, annulation). Vous pouvez retirer ces lignes de votre affichage — sans effet sur la facturation déjà traitée côté service."
              icon="📜"
            />
          </div>

          {loading ? (
            <div className="card text-center py-12">
              <p className="text-white/60">Chargement...</p>
            </div>
          ) : historySubs.length === 0 ? (
            <div className="card text-center py-14 px-4 border border-white/10">
              <p className="text-white/85 text-lg mb-2">Aucun historique à afficher</p>
              <p className="text-white/55 text-sm max-w-md mx-auto">
                Les demandes terminées apparaîtront ici. Les abonnements en cours restent sur la page principale.
              </p>
              <Link
                href="/client/subscriptions"
                className="inline-block mt-6 text-cyan-300 hover:text-cyan-200 text-sm font-medium underline"
              >
                Retour à l’espace abonnements
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2
                  className="text-base sm:text-lg font-bold text-white m-0"
                  style={{
                    background: 'linear-gradient(135deg, #9d4edd 0%, #22d3ee 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Dossiers passés
                </h2>
                <button
                  type="button"
                  onClick={handleClearAll}
                  disabled={clearing}
                  className="text-sm px-3 py-1.5 rounded-lg border border-red-500/50 text-red-200 hover:bg-red-500/15 disabled:opacity-50"
                >
                  {clearing ? 'Effacement…' : 'Tout effacer de l’historique'}
                </button>
              </div>

              <div className="space-y-3">
                {historySubs.map((s) => (
                  <div key={s.id} className="card p-3 sm:p-4 border border-white/12 bg-white/[0.02]">
                    <div className="flex flex-wrap justify-between items-start gap-3 sm:gap-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-white text-sm sm:text-base break-words">{s.plan || 'Abonnement'}</h3>
                        <p className="text-white/65 text-xs sm:text-sm mt-1 break-words">
                          {formatDate(s.created_at)} — {formatCurrencyCDF(Number(s.price))} ({periodLabel(s.period)})
                        </p>
                        {s.rejected_reason && (
                          <p className="text-red-300/85 text-xs sm:text-sm mt-1 break-words">
                            Motif : {(s.rejected_reason || '').replace(/\bpaiment\b/gi, 'paiement')}
                          </p>
                        )}
                        {s.expires_at && (s.status === 'expired' || s.status === 'cancelled') && (
                          <p className="text-white/50 text-xs mt-1">Échéance : {formatDate(s.expires_at)}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className={`badge ${getStatusBadge(s.status)}`}>{STATUS_LABELS[s.status] || s.status}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteOne(s.id)}
                          disabled={deletingId === s.id}
                          className="text-xs px-2 py-1 rounded border border-white/25 text-white/80 hover:bg-white/10 disabled:opacity-50"
                        >
                          {deletingId === s.id ? '…' : 'Retirer de mon historique'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </ReadOnlyGuard>
  )
}
