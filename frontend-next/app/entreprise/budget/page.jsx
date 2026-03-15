"use client"
import EntrepriseSidebar from '@/components/EntrepriseSidebar'
import GoldButton from '@/components/GoldButton'
import { useCompany } from '@/lib/useCompany'
import { apiRequest } from '@/lib/api'
import { useEffect, useState } from 'react'

export default function EntrepriseBudgetPage() {
  const { company, loading: companyLoading, error: companyError } = useCompany()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    apiRequest('/api/entreprise/stats', { method: 'GET' })
      .then((r) => setStats(r))
      .catch(() => setStats({ budget: 0, orders: 0 }))
  }, [])

  const budget = stats?.budget ?? 0
  const orders = stats?.orders ?? 0

  return (
    <section className="page-section min-h-screen bg-[#0b1220] text-white">
      <div className="container">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{
            background: 'linear-gradient(135deg, #39ff14 0%, #00ffff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Gérer le budget
          </h1>
          <p className="text-white/70 text-lg">Suivi du budget restauration.</p>
        </header>

        <div className="dashboard-grid">
          <EntrepriseSidebar />
          <main className="main-panel">
            {companyLoading ? (
              <div className="card p-6 text-center">
                <p className="text-white/60">Chargement...</p>
              </div>
            ) : companyError || !company ? (
              <div className="card p-6">
                <p className="text-white/80 mb-4">
                  {companyError || 'Aucune entreprise associée. En attente de validation.'}
                </p>
                <GoldButton href="/entreprise">Retour au tableau de bord</GoldButton>
              </div>
            ) : (
              <div className="card p-6">
                <h2 className="text-xl font-semibold mb-4 text-cyan-400">Budget — {company.name}</h2>
                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-white/60 text-sm">Budget / Montant suivi</p>
                    <p className="text-2xl font-bold text-green-400">{Number(budget).toLocaleString('fr-FR')} USD</p>
                  </div>
                  <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-white/60 text-sm">Nombre de commandes</p>
                    <p className="text-2xl font-bold text-cyan-400">{orders}</p>
                  </div>
                </div>
                <p className="text-white/60 text-sm mb-4">
                  Le budget affiché provient de votre entreprise et des commandes associées. Pour modifier le budget mensuel, contactez l&apos;administrateur.
                </p>
                <GoldButton href="/entreprise">Retour au tableau de bord</GoldButton>
              </div>
            )}
          </main>
        </div>
      </div>
    </section>
  )
}
