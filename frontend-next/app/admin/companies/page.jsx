"use client"
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import { apiRequest, getApiErrorMessage } from '@/lib/api'
import { pushToast } from '@/components/Toaster'

const STATUS_LABELS = { pending: 'En attente', active: 'Active', suspended: 'Suspendue', ended: 'Terminée', rejected: 'Rejetée' }
const STATUS_FILTER_OPTIONS = [{ value: '', label: 'Tous' }, ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))]

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [deleteModal, setDeleteModal] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const loadCompanies = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const url = statusFilter ? `/api/companies?status=${encodeURIComponent(statusFilter)}` : '/api/companies'
      const res = await apiRequest(url, { method: 'GET' })
      const raw = res?.data ?? res
      const list = Array.isArray(raw) ? raw : (raw?.data ?? [])
      setCompanies(list)
    } catch (err) {
      setError(err?.message || 'Erreur de chargement')
      setCompanies([])
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    loadCompanies()
  }, [loadCompanies])

  async function handleApprove(company) {
    setSubmitting(true)
    try {
      await apiRequest(`/api/companies/${company.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      pushToast({ type: 'success', message: 'Entreprise approuvée. Liste des agents enregistrée (référence livraison).' })
      loadCompanies()
    } catch (err) {
      pushToast({ type: 'error', message: getApiErrorMessage(err) || 'Erreur lors de l\'approbation.' })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteCompany(company) {
    if (!company?.id) return
    setSubmitting(true)
    try {
      await apiRequest(`/api/companies/${company.id}`, { method: 'DELETE' })
      pushToast({ type: 'success', message: 'Entreprise supprimée.' })
      setDeleteModal(null)
      loadCompanies()
    } catch (err) {
      pushToast({ type: 'error', message: getApiErrorMessage(err) || 'Erreur lors de la suppression.' })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRejectSubmit() {
    if (!rejectModal || !rejectReason.trim()) return
    setSubmitting(true)
    try {
      await apiRequest(`/api/companies/${rejectModal.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason.trim() }),
      })
      pushToast({ type: 'success', message: 'Entreprise rejetée.' })
      setRejectModal(null)
      setRejectReason('')
      loadCompanies()
    } catch (err) {
      pushToast({ type: 'error', message: getApiErrorMessage(err) || 'Erreur.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="page-section page-section--admin-tight min-h-screen bg-[#0b1220]">
        <header className="admin-companies-header">
          <h1 className="admin-companies-title">Entreprises (B2B)</h1>
          <p className="admin-companies-desc">Approuver ou rejeter les demandes d&apos;accès entreprise. Une fois approuvée, l&apos;entreprise accède à son tableau de bord.</p>
        </header>
        <div className="dashboard-grid">
          <Sidebar />
          <main className="main-panel">
            {loading ? (
              <div className="card p-8 text-center text-white/60">Chargement...</div>
            ) : error ? (
              <div className="card p-6 text-red-300">{error}</div>
            ) : (
              <div className="card overflow-hidden p-0">
                <div className="admin-companies-filter p-3 sm:p-4 border-b border-white/10 flex flex-wrap items-center gap-3">
                  <label className="text-white/80 text-sm font-medium">Filtrer par statut :</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="admin-companies-filter-select px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm outline-none"
                  >
                    {STATUS_FILTER_OPTIONS.map((opt) => (
                      <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="admin-companies-table-wrap overflow-x-auto">
                  <table className="admin-companies-table">
                    <thead>
                      <tr>
                        <th className="col-entreprise" style={{ width: '28%' }}>Entreprise</th>
                        <th className="col-contact" style={{ width: '22%' }}>Contact</th>
                        <th className="col-agents" style={{ width: '12%' }}>Agents</th>
                        <th className="col-statut" style={{ width: '14%' }}>Statut</th>
                        <th className="col-actions" style={{ width: '24%' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {companies.length === 0 ? (
                        <tr><td colSpan={5} className="p-10 text-white/50 text-center" style={{ background: 'rgba(255,255,255,0.05)' }}>Aucune entreprise.</td></tr>
                      ) : (
                        companies.map((c) => {
                          const contact = c.contact_user
                          const contactName = contact ? (contact.name || contact.email || '—') : '—'
                          const contactDetail = contact?.email && contact.email !== c.email ? contact.email : (contact?.phone || null)
                          const agentCount = (c.pending_employees && c.pending_employees.length) ? c.pending_employees.length : (c.employees?.length ?? c.employee_count ?? 0)
                          return (
                            <tr key={c.id}>
                              <td className="col-entreprise">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  <Link href={`/admin/companies/${c.id}`} style={{ color: '#fff', fontWeight: 600 }}>{c.name}</Link>
                                  {c.email && <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.875rem' }}>{(c.email || '').toLowerCase()}</span>}
                                </div>
                              </td>
                              <td className="col-contact">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  <span style={{ color: 'rgba(255,255,255,0.9)' }}>{contactName}</span>
                                  {contactDetail && <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.875rem' }}>{contactDetail}</span>}
                                  {!contact && <span style={{ color: 'rgba(255,255,255,0.4)' }}>—</span>}
                                </div>
                              </td>
                              <td className="col-agents">
                                {agentCount != null && agentCount !== '' ? (
                                  <span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>{Number(agentCount)}</span>
                                ) : (
                                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>—</span>
                                )}
                              </td>
                              <td className="col-statut">
                                <span className={c.status === 'pending' ? 'admin-badge-pending' : c.status === 'active' ? 'admin-badge-active' : c.status === 'rejected' ? 'admin-badge-rejected' : 'admin-badge-default'}>
                                  {STATUS_LABELS[c.status] || c.status}
                                </span>
                              </td>
                              <td className="col-actions">
                                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                                  <Link href={`/admin/companies/${c.id}`} style={{ color: '#22d3ee', fontSize: '0.875rem', fontWeight: 500 }}>Détails</Link>
                                  {c.status === 'pending' && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleApprove(c)}
                                        disabled={submitting}
                                        style={{ padding: '6px 12px', borderRadius: '8px', background: '#059669', color: '#fff', fontSize: '0.875rem', fontWeight: 500, border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.5 : 1 }}
                                      >
                                        Approuver
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setRejectModal(c)}
                                        disabled={submitting}
                                        style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', fontSize: '0.875rem', fontWeight: 500, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.5 : 1 }}
                                      >
                                        Rejeter
                                      </button>
                                    </>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setDeleteModal(c)}
                                    disabled={submitting}
                                    style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(220,38,38,0.2)', border: '1px solid rgba(220,38,38,0.5)', color: '#fca5a5', fontSize: '0.875rem', fontWeight: 500, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.5 : 1 }}
                                  >
                                    Supprimer
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="admin-companies-cards" style={{ display: 'none' }}>
                  {companies.length === 0 ? (
                    <div className="p-8 text-center text-white/50 text-sm">Aucune entreprise.</div>
                  ) : (
                    companies.map((c) => {
                      const contact = c.contact_user
                      const contactName = contact ? (contact.name || contact.email || '—') : '—'
                      const contactDetail = contact?.email && contact.email !== c.email ? contact.email : (contact?.phone || null)
                      const agentCount = (c.pending_employees && c.pending_employees.length) ? c.pending_employees.length : (c.employees?.length ?? c.employee_count ?? 0)
                      return (
                        <div key={c.id} className="admin-company-card">
                          <div className="card-row">
                            <span className="card-label cyan">Entreprise</span>
                            <span className="card-value"><Link href={`/admin/companies/${c.id}`} style={{ color: '#fff', fontWeight: 600 }}>{c.name}</Link></span>
                          </div>
                          {c.email && (
                            <div className="card-row">
                              <span className="card-label cyan">Email</span>
                              <span className="card-value" style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.7)' }}>{(c.email || '').toLowerCase()}</span>
                            </div>
                          )}
                          <div className="card-row">
                            <span className="card-label violet">Contact</span>
                            <span className="card-value">{contactName}{contactDetail ? ` · ${contactDetail}` : ''}</span>
                          </div>
                          <div className="card-row">
                            <span className="card-label amber">Agents</span>
                            <span className="card-value">{agentCount != null && agentCount !== '' ? Number(agentCount) : '—'}</span>
                          </div>
                          <div className="card-row">
                            <span className="card-label emerald">Statut</span>
                            <span className={c.status === 'pending' ? 'admin-badge-pending' : c.status === 'active' ? 'admin-badge-active' : c.status === 'rejected' ? 'admin-badge-rejected' : 'admin-badge-default'}>
                              {STATUS_LABELS[c.status] || c.status}
                            </span>
                          </div>
                          <div className="card-actions">
                            <Link href={`/admin/companies/${c.id}`}>Détails</Link>
                            {c.status === 'pending' && (
                              <>
                                <button type="button" className="approve" onClick={() => handleApprove(c)} disabled={submitting}>Approuver</button>
                                <button type="button" className="reject" onClick={() => setRejectModal(c)} disabled={submitting}>Rejeter</button>
                              </>
                            )}
                            <button type="button" onClick={() => setDeleteModal(c)} disabled={submitting} className="reject" style={{ background: 'rgba(220,38,38,0.2)', borderColor: 'rgba(220,38,38,0.5)', color: '#fca5a5' }}>Supprimer</button>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )}
          </main>
        </div>

      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={() => !submitting && setRejectModal(null)}>
          <div className="bg-[#0b1220] border border-white/20 rounded-xl max-w-md w-full p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-2">Rejeter la demande</h3>
            <p className="text-white/70 text-sm mb-4">Entreprise : {rejectModal.name}. Indiquez le motif du rejet (obligatoire).</p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Motif du rejet..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setRejectModal(null)} className="px-4 py-2 rounded-lg bg-white/10 text-white">Annuler</button>
              <button type="button" onClick={handleRejectSubmit} disabled={!rejectReason.trim() || submitting} className="px-4 py-2 rounded-lg bg-red-600 text-white disabled:opacity-50">
                {submitting ? 'Envoi...' : 'Rejeter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={() => !submitting && setDeleteModal(null)}>
          <div className="bg-[#0b1220] border border-red-500/30 rounded-xl max-w-md w-full p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-2">Supprimer l&apos;entreprise</h3>
            <p className="text-white/70 text-sm mb-4">
              Êtes-vous sûr de vouloir supprimer <strong className="text-white">{deleteModal.name}</strong> ? Cette action est irréversible (données entreprise, liste des agents, abonnements associés).
            </p>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setDeleteModal(null)} className="px-4 py-2 rounded-lg bg-white/10 text-white">Annuler</button>
              <button type="button" onClick={() => handleDeleteCompany(deleteModal)} disabled={submitting} className="px-4 py-2 rounded-lg bg-red-600 text-white disabled:opacity-50">
                {submitting ? 'Suppression…' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
