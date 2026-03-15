"use client"
import EntrepriseSidebar from '@/components/EntrepriseSidebar'
import GoldButton from '@/components/GoldButton'
import { useCompany } from '@/lib/useCompany'
import { useEffect, useState } from 'react'
import { apiRequest } from '@/lib/api'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

export default function EntrepriseReports() {
  const { company } = useCompany()
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!company?.id) {
      setLoading(false)
      return
    }
    apiRequest(`/api/companies/${company.id}/subscriptions`, { method: 'GET' })
      .then((r) => {
        const data = r?.data
        const items = data?.data ?? (Array.isArray(data) ? data : [])
        setSubscriptions(Array.isArray(items) ? items : [])
      })
      .catch(() => setSubscriptions([]))
      .finally(() => setLoading(false))
  }, [company?.id])

  const activeOrPending = subscriptions.filter((s) => s.status === 'active' || s.status === 'pending')
  const formatDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—')

  return (
    <section className="page-section bg-[#0b1220] text-white min-h-screen">
      <div className="container">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{
            background: 'linear-gradient(135deg, #39ff14 0%, #00ffff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Rapports Entreprise
          </h1>
          <p className="text-white/70 text-lg">Exports et rapports par employé / période.</p>
        </header>
        <div className="dashboard-grid">
          <EntrepriseSidebar />
          <main className="main-panel">
            <div className="card p-6">
              {loading ? (
                <p className="text-white/60 mb-4">Chargement...</p>
              ) : activeOrPending.length === 0 ? (
                <p className="text-white/70 mb-4">Aucun abonnement actif. Souscrivez à un abonnement pour accéder aux exports (plans de repas, livraisons).</p>
              ) : (
                <>
                  <h2 className="text-lg font-semibold text-cyan-400 mb-3">Téléchargements directs</h2>
                  <p className="text-white/70 mb-4">Exportez les plans de repas et livraisons pour chaque abonnement actif ou en attente.</p>
                  <ul className="space-y-4 mb-6">
                    {activeOrPending.slice(0, 5).map((sub) => (
                      <li key={sub.id} className="p-4 rounded-lg bg-white/5 border border-white/10">
                        <p className="text-white/90 font-medium mb-2">
                          {(sub.pricing_tier?.plan_name) || 'Abonnement'} — {sub.agent_count} agent(s) · {formatDate(sub.start_date)} → {formatDate(sub.end_date)}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <a
                            href={`${API_BASE}/api/subscriptions/${sub.id}/export/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block px-4 py-2 rounded-lg bg-red-500/20 text-red-200 hover:bg-red-500/30 text-sm font-medium border border-red-500/40"
                          >
                            Export PDF
                          </a>
                          <a
                            href={`${API_BASE}/api/subscriptions/${sub.id}/export/csv`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block px-4 py-2 rounded-lg bg-green-500/20 text-green-200 hover:bg-green-500/30 text-sm font-medium border border-green-500/40"
                          >
                            Export CSV
                          </a>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              <GoldButton href="/entreprise">Retour au tableau de bord</GoldButton>
            </div>
          </main>
        </div>
      </div>
    </section>
  )
}
