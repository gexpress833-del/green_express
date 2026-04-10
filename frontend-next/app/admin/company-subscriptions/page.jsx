"use client"
import Sidebar from '@/components/Sidebar'
import Link from 'next/link'
import { useEffect, useState, useCallback } from 'react'
import { apiRequest, getApiErrorMessage } from '@/lib/api'
import { pushToast } from '@/components/Toaster'

const STATUS_LABELS = { pending: 'En attente', active: 'Actif', expired: 'Expiré', cancelled: 'Annulé' }

export default function AdminCompanySubscriptionsPage() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [actioning, setActioning] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    const url = statusFilter ? `/api/admin/company-subscriptions?status=${encodeURIComponent(statusFilter)}` : '/api/admin/company-subscriptions'
    apiRequest(url, { method: 'GET' })
      .then((r) => {
        const data = r?.data
        const items = data?.data ?? (Array.isArray(data) ? data : [])
        setList(Array.isArray(items) ? items : [])
      })
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }, [statusFilter])

  useEffect(() => { load() }, [load])

  async function handleActivate(sub) {
    if (!sub?.id) return
    setActioning(sub.id)
    try {
      await apiRequest(`/api/admin/company-subscriptions/${sub.id}/activate`, { method: 'POST' })
      pushToast({ type: 'success', message: 'Abonnement activé.' })
      load()
    } catch (err) {
      pushToast({ type: 'error', message: getApiErrorMessage(err) || 'Erreur lors de l\'activation.' })
    } finally {
      setActioning(null)
    }
  }

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—')
  const formatMoney = (v, cur) => (v != null ? Number(v).toLocaleString('fr-FR') + ' ' + (cur || 'USD') : '—')
  const companyName = (sub) => (sub.company?.name || '— (entreprise non associée)')
  const contactEmail = (sub) => (sub.company?.contact_user?.email || sub.company?.email || '—')

  return (
    <section className="page-section page-section--admin-tight min-h-screen bg-[#0b1220]">
        <header className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white">Abonnements entreprise (B2B)</h1>
          <p className="text-white/70 mt-1 text-sm md:text-base">
            Liste des abonnements souscrits par les entreprises. Une fois le paiement reçu, cliquez sur <strong>Activer</strong> pour activer l&apos;abonnement.
          </p>
        </header>
        <div className="dashboard-grid">
          <Sidebar />
          <main className="main-panel min-w-0">
            <div className="card p-4 sm:p-6">
              <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white/80 space-y-2">
                <p className="font-medium text-white/90">Comment utiliser cette page</p>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>En attente</strong> : l&apos;entreprise a souscrit ; après réception du paiement, cliquez sur <strong>Activer</strong>.</li>
                  <li><strong>Actif</strong> : l&apos;abonnement est en cours ; le lien <strong>Fiche entreprise</strong> ouvre la fiche de l&apos;entreprise.</li>
                  <li>Le lien <strong>Voir toutes les entreprises</strong> ci-dessous ouvre la liste des entreprises (création d&apos;abonnement possible depuis une fiche entreprise).</li>
                </ul>
              </div>
              <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-4 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <label className="text-white/70 text-sm">Filtrer par statut :</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm min-h-[44px] touch-manipulation"
                  >
                    <option value="">Tous</option>
                    <option value="pending">En attente</option>
                    <option value="active">Actif</option>
                    <option value="expired">Expiré</option>
                  </select>
                </div>
                <Link href="/admin/companies" className="text-cyan-400 hover:text-cyan-300 text-sm font-medium py-2 min-h-[44px] flex items-center">
                  Voir toutes les entreprises →
                </Link>
              </div>
              {loading ? (
                <p className="text-white/60 py-8 text-center">Chargement...</p>
              ) : list.length === 0 ? (
                <p className="text-white/60 py-8 text-center">Aucun abonnement entreprise.</p>
              ) : (
                <>
                  {/* Mobile: cartes empilées */}
                  <div className="block md:hidden space-y-4">
                    {list.map((sub) => {
                      const company = sub.company
                      const contact = company?.contact_user
                      return (
                        <div key={sub.id} className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                          <div className="flex justify-between items-start gap-2">
                            {company?.id ? (
                              <Link href={`/admin/companies/${company.id}`} className="text-cyan-400 hover:text-cyan-300 font-medium text-base">
                                {companyName(sub)}
                              </Link>
                            ) : (
                              <span className="text-white/70 font-medium text-base">{companyName(sub)}</span>
                            )}
                            <span className={`shrink-0 px-2 py-1 rounded text-xs font-medium ${
                              sub.status === 'active' ? 'bg-green-500/20 text-green-300' :
                              sub.status === 'pending' ? 'bg-amber-500/20 text-amber-300' :
                              'bg-white/10 text-white/70'
                            }`}>
                              {STATUS_LABELS[sub.status] ?? sub.status}
                            </span>
                          </div>
                          <p className="text-white/70 text-sm">{contactEmail(sub)}</p>
                          <p className="text-white/80 text-sm">{sub.agent_count ?? '—'} agents · {formatDate(sub.start_date)} → {formatDate(sub.end_date)}</p>
                          <p className="text-white/80 text-sm font-medium">{formatMoney(sub.total_monthly_price, sub.currency)}</p>
                          {sub.status === 'pending' && sub.payment_status && (
                            <p className="text-cyan-200/80 text-xs">Paiement : {sub.payment_status === 'paid' ? 'reçu (carte ou autre)' : sub.payment_status}</p>
                          )}
                          {sub.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => handleActivate(sub)}
                              disabled={!!actioning}
                              className="w-full min-h-[48px] px-4 py-3 rounded-xl text-sm font-medium bg-green-600 text-white hover:bg-green-500 disabled:opacity-50 touch-manipulation"
                            >
                              {actioning === sub.id ? 'En cours…' : 'Activer'}
                            </button>
                          )}
                          {sub.status === 'active' && (
                            <Link href={`/admin/companies/${company?.id}`} className="block text-center min-h-[48px] py-3 text-cyan-400 hover:text-cyan-300 text-sm font-medium">
                              Fiche entreprise →
                            </Link>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  {/* Desktop: tableau */}
                  <div className="hidden md:block overflow-x-auto -mx-2">
                    <table className="w-full text-left text-sm min-w-[640px]">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="p-2 text-white/80 font-semibold">Entreprise</th>
                          <th className="p-2 text-white/80 font-semibold">Contact</th>
                          <th className="p-2 text-white/80 font-semibold">Agents</th>
                          <th className="p-2 text-white/80 font-semibold">Période · Montant</th>
                          <th className="p-2 text-white/80 font-semibold">Statut</th>
                          <th className="p-2 text-white/80 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {list.map((sub) => {
                          const company = sub.company
                          const contact = company?.contact_user
                          return (
                            <tr key={sub.id} className="border-b border-white/5">
                              <td className="p-2">
                                {company?.id ? (
                                  <Link href={`/admin/companies/${company.id}`} className="text-cyan-400 hover:text-cyan-300 font-medium">
                                    {companyName(sub)}
                                  </Link>
                                ) : (
                                  <span className="text-white/70">{companyName(sub)}</span>
                                )}
                              </td>
                              <td className="p-2 text-white/80">{contactEmail(sub)}</td>
                              <td className="p-2 text-white/80">{sub.agent_count ?? '—'}</td>
                              <td className="p-2 text-white/80">
                                <span className="block">{formatDate(sub.start_date)} → {formatDate(sub.end_date)} · {formatMoney(sub.total_monthly_price, sub.currency)}</span>
                                {sub.status === 'pending' && sub.payment_status && (
                                  <span className="block text-cyan-300/80 text-xs mt-1">Paiement : {sub.payment_status === 'paid' ? 'reçu' : sub.payment_status}</span>
                                )}
                              </td>
                              <td className="p-2">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  sub.status === 'active' ? 'bg-green-500/20 text-green-300' :
                                  sub.status === 'pending' ? 'bg-amber-500/20 text-amber-300' :
                                  'bg-white/10 text-white/70'
                                }`}>
                                  {STATUS_LABELS[sub.status] ?? sub.status}
                                </span>
                              </td>
                              <td className="p-2">
                                {sub.status === 'pending' && (
                                  <button
                                    type="button"
                                    onClick={() => handleActivate(sub)}
                                    disabled={!!actioning}
                                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-500 disabled:opacity-50"
                                  >
                                    {actioning === sub.id ? 'En cours…' : 'Activer'}
                                  </button>
                                )}
                                {sub.status === 'active' && (
                                  <Link href={`/admin/companies/${company?.id}`} className="text-cyan-400 hover:text-cyan-300 text-sm">Fiche entreprise</Link>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </main>
        </div>
    </section>
  )
}
