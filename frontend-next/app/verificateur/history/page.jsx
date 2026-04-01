"use client"
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { apiRequest } from '@/lib/api'
import VerificateurSidebar from '@/components/VerificateurSidebar'
import DashboardGreeting from '@/components/DashboardGreeting'
import { useAuth } from '@/contexts/AuthContext'

export default function VerifierHistory() {
  const router = useRouter()
  const { isAuthenticated, initialised } = useAuth()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, per_page: 15, total: 0 })

  useEffect(() => {
    if (!initialised) return
    if (!isAuthenticated) router.push('/login')
  }, [initialised, isAuthenticated, router])

  const load = useCallback((page = 1) => {
    setLoading(true)
    apiRequest(`/api/verificateur/history?page=${page}&per_page=15`, { method: 'GET' })
      .then((r) => {
        setHistory(r?.data ?? [])
        setPagination({
          current_page: r?.current_page ?? 1,
          last_page: r?.last_page ?? 1,
          per_page: r?.per_page ?? 15,
          total: r?.total ?? 0,
        })
      })
      .catch(() => setHistory([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load(1)
  }, [load])

  const formatDate = (iso) => {
    if (!iso) return '—'
    try {
      const d = new Date(iso)
      return d.toLocaleDateString('fr-FR', { dateStyle: 'short' }) + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    } catch {
      return iso
    }
  }

  return (
    <section className="page-section min-h-screen">
      <div className="container">
        <DashboardGreeting title="Historique des validations" />
        <div className="dashboard-grid">
          <VerificateurSidebar />
          <main className="main-panel">
            {loading ? (
              <div className="card text-center py-12">
                <p className="text-white/60">Chargement...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="card text-center py-12">
                <p className="text-white/60">Aucune validation enregistrée.</p>
              </div>
            ) : (
              <>
                <div className="card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="p-3 text-white/80 font-medium">Ticket</th>
                          <th className="p-3 text-white/80 font-medium">Promotion</th>
                          <th className="p-3 text-white/80 font-medium">Client</th>
                          <th className="p-3 text-white/80 font-medium">Validé le</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((h) => (
                          <tr key={h.id} className="border-b border-white/5 hover:bg-white/5">
                            <td className="p-3 font-mono text-amber-400">{h.ticket_code || '—'}</td>
                            <td className="p-3 text-white/90">{h.promotion || '—'}</td>
                            <td className="p-3 text-white/70">{h.user_name || '—'}</td>
                            <td className="p-3 text-white/60 text-sm">{formatDate(h.validated_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                {pagination.last_page > 1 && (
                  <div className="mt-4 flex items-center justify-between text-white/70 text-sm">
                    <span>
                      Page {pagination.current_page} / {pagination.last_page} ({pagination.total} au total)
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => load(pagination.current_page - 1)}
                        disabled={pagination.current_page <= 1}
                        className="px-3 py-1 rounded bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Précédent
                      </button>
                      <button
                        type="button"
                        onClick={() => load(pagination.current_page + 1)}
                        disabled={pagination.current_page >= pagination.last_page}
                        className="px-3 py-1 rounded bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Suivant
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </section>
  )
}
