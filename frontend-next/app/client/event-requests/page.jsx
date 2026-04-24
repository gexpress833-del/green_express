"use client"
import ClientSubpageHeader from '@/components/ClientSubpageHeader'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { apiRequest } from '@/lib/api'
import Link from 'next/link'

function formatDate(iso) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return iso
  }
}

export default function ClientEventRequestsPage() {
  const router = useRouter()
  const { user, initialised, isAuthenticated } = useAuth()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState(null)

  const loadList = (nextPage = 1) => {
    const url = `/api/my-event-requests?page=${encodeURIComponent(nextPage)}&per_page=50`
    return apiRequest(url, { method: 'GET' })
      .then((payload) => {
        if (Array.isArray(payload)) {
          setList(payload)
          setMeta(null)
          setPage(1)
          return
        }
        const rows = Array.isArray(payload?.data) ? payload.data : []
        setList(rows)
        setMeta(payload?.meta || null)
        setPage(payload?.meta?.page || nextPage)
      })
      .catch(() => {
        setList([])
        setMeta(null)
      })
  }

  useEffect(() => {
    if (!initialised || !isAuthenticated) {
      router.replace('/login?returnUrl=' + encodeURIComponent('/client/event-requests'))
      return
    }
    setLoading(true)
    loadList(1).finally(() => setLoading(false))
  }, [initialised, isAuthenticated, router])

  if (!initialised || !isAuthenticated) {
    return (
      <section className="page-section min-h-screen flex items-center justify-center">
        <p className="text-white/60">Chargement…</p>
      </section>
    )
  }

  return (
    <section className="page-section min-h-screen bg-[#0b1220] text-white">
      <div className="container">
        <ClientSubpageHeader
          title="Mes demandes événementielles"
          subtitle="Suivi de vos demandes de devis et réponses de Green Express."
          icon="🎪"
        />

            <div className="mb-4">
              <Link
                href="/evenements"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white/90 hover:bg-white/15 transition text-sm"
              >
                ← Nouvelle demande de devis
              </Link>
            </div>
            {loading ? (
              <div className="card text-center py-12">
                <p className="text-white/60">Chargement...</p>
              </div>
            ) : list.length === 0 ? (
              <div className="card text-center py-12">
                <p className="text-white/60 mb-2">Aucune demande pour le moment.</p>
                <Link href="/evenements" className="text-cyan-400 hover:text-cyan-300 text-sm">
                  Soumettre une demande de devis →
                </Link>
              </div>
            ) : (
              <>
              {meta && meta.last_page > 1 && (
                <div className="mb-4 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const prev = Math.max(1, (meta.page || page) - 1)
                      setLoading(true)
                      loadList(prev).finally(() => setLoading(false))
                    }}
                    disabled={(meta.page || page) <= 1}
                    className="px-3 py-2 rounded-lg border border-white/20 text-white/80 hover:bg-white/10 transition text-sm disabled:opacity-50"
                  >
                    Précédent
                  </button>
                  <div className="text-xs text-white/60">
                    Page {meta.page} / {meta.last_page} — {meta.total} total
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = Math.min(meta.last_page || page, (meta.page || page) + 1)
                      setLoading(true)
                      loadList(next).finally(() => setLoading(false))
                    }}
                    disabled={(meta.page || page) >= (meta.last_page || page)}
                    className="px-3 py-2 rounded-lg border border-white/20 text-white/80 hover:bg-white/10 transition text-sm disabled:opacity-50"
                  >
                    Suivant
                  </button>
                </div>
              )}
              <div className="space-y-4">
                {list.map((row) => (
                  <div key={row.id} className="card p-6 border border-white/10">
                    <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-cyan-400">{row.event_type}</h3>
                        <p className="text-white/60 text-sm mt-1">
                          Date de l&apos;événement : {formatDate(row.event_date)} — {row.guest_count} personnes
                          {row.budget && ` — Budget : ${row.budget}`}
                        </p>
                        <p className="text-white/50 text-xs mt-1">Demande du {formatDate(row.created_at)}</p>
                      </div>
                      <span className={`badge ${row.status === 'pending' ? 'badge-warning' : row.status === 'contacted' ? 'badge-success' : 'badge-error'}`}>
                        {row.status === 'pending' ? 'En attente' : row.status === 'contacted' ? 'Contacté' : 'Clos'}
                      </span>
                    </div>
                    {row.message && (
                      <div className="mb-4 p-3 rounded-lg bg-white/5 border border-white/10">
                        <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-1">Votre message</p>
                        <p className="text-white/80 text-sm">{row.message}</p>
                      </div>
                    )}
                    {row.admin_response && (
                      <div
                        className="relative overflow-hidden"
                        style={{
                          padding: '1.5rem',
                          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.08) 100%)',
                          border: '1px solid rgba(16, 185, 129, 0.4)',
                          borderRadius: '16px',
                          boxShadow: '0 0 24px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255,255,255,0.06)',
                          textAlign: 'center',
                        }}
                      >
                        <div
                          className="absolute left-0 top-0 bottom-0 w-1"
                          style={{
                            background: 'linear-gradient(180deg, #34d399, #10b981, #059669)',
                            boxShadow: '0 0 12px rgba(16, 185, 129, 0.6)',
                            borderTopLeftRadius: '16px',
                            borderBottomLeftRadius: '16px',
                          }}
                        />
                        <p
                          className="text-xs font-bold uppercase tracking-widest mb-3"
                          style={{
                            color: '#6ee7b7',
                            textShadow: '0 0 20px rgba(110, 231, 183, 0.5)',
                            textAlign: 'center',
                          }}
                        >
                          Réponse de Green Express
                        </p>
                        <p
                          className="text-sm whitespace-pre-wrap leading-relaxed"
                          style={{
                            color: 'rgba(167, 243, 208, 0.95)',
                            textShadow: '0 0 12px rgba(16, 185, 129, 0.2)',
                            textAlign: 'center',
                            maxWidth: '36rem',
                            marginLeft: 'auto',
                            marginRight: 'auto',
                            lineHeight: 1.6,
                          }}
                        >
                          {row.admin_response}
                        </p>
                        {row.responded_at && (
                          <p className="text-xs mt-3" style={{ color: 'rgba(110, 231, 183, 0.7)', textAlign: 'center' }}>
                            Répondu le {formatDate(row.responded_at)}
                          </p>
                        )}
                      </div>
                    )}
                    {!row.admin_response && row.status !== 'pending' && (
                      <p className="text-white/50 text-sm italic">Aucune réponse enregistrée pour le moment.</p>
                    )}
                  </div>
                ))}
              </div>
              </>
            )}
      </div>
    </section>
  )
}
