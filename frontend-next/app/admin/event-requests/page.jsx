"use client"
import Sidebar from '@/components/Sidebar'
import { useEffect, useState } from 'react'
import { apiRequest } from '@/lib/api'

function formatDate(iso) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return iso
  }
}

// Couleurs par colonne (styles inline pour garantir l'affichage)
const COL_STYLES = {
  th: [
    { background: 'rgba(59, 130, 246, 0.25)', color: '#fff' },      // Date demande - bleu
    { background: 'rgba(6, 182, 212, 0.25)', color: '#fff' },      // Contact - cyan
    { background: 'rgba(139, 92, 246, 0.25)', color: '#fff' },    // Type - violet
    { background: 'rgba(99, 102, 241, 0.25)', color: '#fff' },    // Date événement - indigo
    { background: 'rgba(16, 185, 129, 0.25)', color: '#fff' },    // Personnes - vert
    { background: 'rgba(245, 158, 11, 0.25)', color: '#fff' },    // Budget - ambre
    { background: 'rgba(249, 115, 22, 0.25)', color: '#fff' },    // Statut - orange
    { background: 'rgba(100, 116, 139, 0.25)', color: '#fff' },   // Message - slate
    { background: 'rgba(236, 72, 153, 0.25)', color: '#fff' },   // Action - pink
  ],
  td: [
    { background: 'rgba(59, 130, 246, 0.12)', color: '#93c5fd' },
    { background: 'rgba(6, 182, 212, 0.12)', color: '#a5f3fc' },
    { background: 'rgba(139, 92, 246, 0.12)', color: '#c4b5fd' },
    { background: 'rgba(99, 102, 241, 0.12)', color: '#a5b4fc' },
    { background: 'rgba(16, 185, 129, 0.12)', color: '#6ee7b7' },
    { background: 'rgba(245, 158, 11, 0.12)', color: '#fcd34d' },
    { background: 'rgba(249, 115, 22, 0.12)', color: '#fff' },
    { background: 'rgba(100, 116, 139, 0.12)', color: '#cbd5e1' },
    { background: 'rgba(236, 72, 153, 0.12)', color: '#f9a8d4' },
  ],
}

export default function AdminEventRequestsPage() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [treating, setTreating] = useState(null)
  const [responseStatus, setResponseStatus] = useState('contacted')
  const [responseText, setResponseText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const loadList = () => {
    return apiRequest('/api/admin/event-requests', { method: 'GET' })
      .then((data) => setList(Array.isArray(data) ? data : []))
      .catch(() => setList([]))
  }

  useEffect(() => {
    setLoading(true)
    loadList().finally(() => setLoading(false))
  }, [])

  function openTreat(row) {
    setTreating(row)
    setResponseStatus(row.status === 'pending' ? 'contacted' : row.status)
    setResponseText(row.admin_response || '')
    setError(null)
  }

  function handleTableWheel(e) {
    const el = e.currentTarget
    if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      el.scrollLeft += e.deltaX || e.deltaY
      e.preventDefault()
    }
  }

  async function submitResponse() {
    if (!treating || !responseText.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      await apiRequest(`/api/admin/event-requests/${treating.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: responseStatus, admin_response: responseText.trim() }),
      })
      loadList()
      setTreating(null)
      setResponseText('')
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'envoi.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="page-section min-h-screen bg-[#0b1220] text-white">
      <div className="container">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{
            background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Demandes événementielles
          </h1>
          <p className="text-white/70 text-lg">
            Demandes de devis reçues depuis la page Service événementiel.
          </p>
        </header>

        <div className="dashboard-grid">
          <Sidebar />
          <main className="main-panel">
            {loading ? (
              <div className="card text-center py-12">
                <p className="text-white/60">Chargement...</p>
              </div>
            ) : list.length === 0 ? (
              <div className="card text-center py-12">
                <p className="text-white/60">Aucune demande pour le moment.</p>
              </div>
            ) : (
              <div className="card p-0 min-w-0 overflow-hidden">
                <div className="px-5 py-4 border-b border-white/10 bg-white/5">
                  <h2 className="text-lg font-semibold text-white/90">Tableau des demandes</h2>
                  <p className="text-white/60 text-sm mt-1">{list.length} demande{list.length > 1 ? 's' : ''} — faites défiler horizontalement pour voir la colonne Message</p>
                </div>
                {/* Wrapper à largeur contrainte pour que le scroll ait une zone claire et que la barre soit cliquable */}
                <div className="max-w-full overflow-hidden" style={{ isolation: 'isolate' }}>
                  <div className="admin-table-scroll" tabIndex={0} title="Défiler horizontalement : molette (ou Shift+molette) ou barre de défilement" onWheel={handleTableWheel}>
                    <table className="text-left border-collapse" style={{ width: 'max-content', minWidth: '1100px' }}>
                    <thead>
                      <tr className="text-sm font-semibold">
                        <th className="py-3 px-4 border-b border-r border-white/15 text-center min-w-[120px]" style={COL_STYLES.th[8]}>Action</th>
                        <th className="py-3 px-4 border-b border-r border-white/15" style={COL_STYLES.th[0]}>Date demande</th>
                        <th className="py-3 px-4 border-b border-r border-white/15" style={COL_STYLES.th[1]}>Contact</th>
                        <th className="py-3 px-4 border-b border-r border-white/15" style={COL_STYLES.th[2]}>Type</th>
                        <th className="py-3 px-4 border-b border-r border-white/15 text-right" style={COL_STYLES.th[3]}>Date événement</th>
                        <th className="py-3 px-4 border-b border-r border-white/15 text-right" style={COL_STYLES.th[4]}>Personnes</th>
                        <th className="py-3 px-4 border-b border-r border-white/15" style={COL_STYLES.th[5]}>Budget</th>
                        <th className="py-3 px-4 border-b border-r border-white/15" style={COL_STYLES.th[6]}>Statut</th>
                        <th className="py-3 px-4 border-b border-white/15 min-w-[200px]" style={COL_STYLES.th[7]}>Message</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((row) => {
                        const contactName = row.contact_name || row.user?.name || null
                        const contactEmail = row.contact_email || row.user?.email || null
                        const hasContact = contactName || contactEmail
                        return (
                          <tr key={row.id} className="border-b border-white/10 hover:bg-white/[0.03] transition-colors">
                            <td className="py-3 px-4 text-center align-top min-w-[120px] border-r border-white/10" style={COL_STYLES.td[8]}>
                              <button
                                type="button"
                                onClick={() => openTreat(row)}
                                className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-[#d4af37] text-[#0b1220] hover:bg-[#e5c048] transition whitespace-nowrap"
                              >
                                {row.admin_response ? 'Modifier réponse' : 'Traiter'}
                              </button>
                            </td>
                            <td className="py-3 px-4 border-r border-white/10 text-sm whitespace-nowrap" style={COL_STYLES.td[0]}>{formatDate(row.created_at)}</td>
                            <td className="py-3 px-4 border-r border-white/10 text-sm align-top" style={COL_STYLES.td[1]}>
                              {hasContact ? (
                                <>
                                  <div className="font-medium">{contactName || '—'}</div>
                                  {contactEmail && (
                                    <a href={`mailto:${contactEmail}`} className="text-xs block truncate max-w-[200px] hover:underline" title={contactEmail} style={{ color: 'inherit' }}>
                                      {contactEmail}
                                    </a>
                                  )}
                                  {row.contact_phone && (
                                    <a href={`tel:${row.contact_phone}`} className="text-xs block mt-0.5 hover:underline" title={row.contact_phone} style={{ color: 'inherit', opacity: 0.9 }}>
                                      {row.contact_phone}
                                    </a>
                                  )}
                                  {row.user && (row.contact_name || row.contact_email) && (
                                    <span className="text-xs block mt-1" style={{ opacity: 0.7 }}>Compte lié</span>
                                  )}
                                </>
                              ) : (
                                <span className="italic" style={{ opacity: 0.8 }}>Ancienne demande (sans contact)</span>
                              )}
                            </td>
                            <td className="py-3 px-4 border-r border-white/10 font-medium text-sm" style={COL_STYLES.td[2]}>{row.event_type}</td>
                            <td className="py-3 px-4 border-r border-white/10 text-sm whitespace-nowrap text-right tabular-nums" style={COL_STYLES.td[3]}>{formatDate(row.event_date)}</td>
                            <td className="py-3 px-4 border-r border-white/10 text-right tabular-nums font-medium text-sm" style={COL_STYLES.td[4]}>{row.guest_count}</td>
                            <td className="py-3 px-4 border-r border-white/10 text-sm" style={COL_STYLES.td[5]}>{row.budget || '—'}</td>
                            <td className="py-3 px-4 border-r border-white/10" style={COL_STYLES.td[6]}>
                              <span className={`badge ${row.status === 'pending' ? 'badge-warning' : row.status === 'contacted' ? 'badge-success' : 'badge-error'}`}>
                                {row.status === 'pending' ? 'En attente' : row.status === 'contacted' ? 'Contacté' : 'Clos'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm min-w-[200px] max-w-[280px] align-top border-r border-white/10 break-words" style={COL_STYLES.td[7]} title={row.message || ''}>
                              {row.message || '—'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  </div>
                </div>
                <p className="px-5 py-2 text-white/50 text-xs border-t border-white/10">
                  ← Défiler horizontalement pour afficher toutes les colonnes (Message)
                </p>
              </div>
            )}
          </main>
        </div>

        {/* Modal Traiter la demande */}
        {treating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={() => !submitting && setTreating(null)}>
            <div className="bg-[#0b1220] border border-white/20 rounded-xl max-w-lg w-full p-6 shadow-xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-semibold text-white mb-2">Traiter la demande</h3>
              <p className="text-white/70 text-sm mb-4">
                Demande #{treating.id} — {treating.event_type} ({treating.guest_count} pers.)
              </p>
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 text-sm">{error}</div>
              )}
              <div className="mb-4">
                <label className="block text-white/80 text-sm font-medium mb-1">Nouveau statut</label>
                <select
                  value={responseStatus}
                  onChange={e => setResponseStatus(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white"
                >
                  <option value="contacted">Contacté</option>
                  <option value="closed">Clos</option>
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-white/80 text-sm font-medium mb-1">Réponse au client *</label>
                <textarea
                  value={responseText}
                  onChange={e => setResponseText(e.target.value)}
                  placeholder="Votre message sera envoyé au client (notification + visible dans « Mes demandes »)."
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-white/40"
                  required
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => !submitting && setTreating(null)}
                  className="px-4 py-2 rounded-lg border border-white/30 text-white/90 hover:bg-white/10 transition"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={submitResponse}
                  disabled={submitting || !responseText.trim()}
                  className="px-4 py-2 rounded-lg font-semibold bg-[#d4af37] text-[#0b1220] hover:bg-[#e5c048] transition disabled:opacity-50"
                >
                  {submitting ? 'Envoi...' : 'Envoyer la réponse'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
