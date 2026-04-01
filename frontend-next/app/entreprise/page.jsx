"use client"
import { useRouter } from 'next/navigation'
import EntrepriseSidebar from '@/components/EntrepriseSidebar'
import EntrepriseSubscriptionSection from '@/components/EntrepriseSubscriptionSection'
import DashboardGreeting from '@/components/DashboardGreeting'
import GoldButton from '@/components/GoldButton'
import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { apiRequest } from '@/lib/api'
import Link from 'next/link'

export default function EntrepriseDashboard(){
  const router = useRouter()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const { isAuthenticated, initialised } = useAuth()

  useEffect(()=>{
    if (!initialised) return
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
  },[initialised, isAuthenticated, router])

  useEffect(()=>{
    apiRequest('/api/entreprise/stats', { method: 'GET' })
      .then(r => {
        setStats(r)
        setLoading(false)
      })
      .catch(() => {
        setStats({ employees: 0, orders: 0, budget: 0 })
        setLoading(false)
      })
  },[])

  return (
    <section className="page-section min-h-screen">
      <div className="container">
        <DashboardGreeting>
          <h1 className="text-4xl font-bold mb-2" style={{
            background: 'linear-gradient(135deg, #39ff14 0%, #00ffff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Tableau de bord Entreprise
          </h1>
          <p className="text-white/70 text-lg">Gérez vos employés, commandes et budget</p>
        </DashboardGreeting>

        <div className="dashboard-grid">
          <EntrepriseSidebar />
          <main className="main-panel">
            {loading ? (
              <div className="card text-center py-12">
                <p className="text-white/60">Chargement...</p>
              </div>
            ) : (
              <>
                <EntrepriseSubscriptionSection />
                {/* Statistiques */}
                <div className="stats-row">
                  <div className="stat-card">
                    <h4>👥 Employés</h4>
                    <p className="text-3xl font-bold">{stats?.employees ?? 0}</p>
                    <Link href="/entreprise/employees" className="text-sm text-green-400 hover:text-green-300 mt-2 inline-block">
                      Détail →
                    </Link>
                  </div>
                  <div className="stat-card">
                    <h4>🛒 Commandes</h4>
                    <p className="text-3xl font-bold">{stats?.orders ?? 0}</p>
                    <Link href="/entreprise/orders" className="text-sm text-green-400 hover:text-green-300 mt-2 inline-block">
                      Détail →
                    </Link>
                  </div>
                  <div className="stat-card">
                    <h4>💰 Budget</h4>
                    <p className="text-3xl font-bold">{stats?.budget ?? 0} USD</p>
                    <Link href="/entreprise/budget" className="text-sm text-green-400 hover:text-green-300 mt-2 inline-block">
                      Détail →
                    </Link>
                  </div>
                </div>

                <section className="card mt-6 border border-cyan-500/20 bg-cyan-500/5">
                  <h2 className="text-lg font-semibold text-white mb-3">Prochaines actions</h2>
                  <p className="text-white/65 text-sm mb-4">
                    Budget, commandes et répertoire des agents. L&apos;abonnement équipe est géré dans le bloc « Abonnement entreprise » ci-dessus.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <GoldButton href="/entreprise/budget">Budget</GoldButton>
                    <GoldButton href="/entreprise/orders">Commandes</GoldButton>
                    <GoldButton href="/entreprise/employees">Employés</GoldButton>
                  </div>
                </section>

                <section className="card mt-6">
                  <h3 className="text-xl font-semibold mb-2 text-white">
                    Rapports de consommation
                  </h3>
                  <p className="text-white/70 mb-4 text-sm sm:text-base">
                    Analysez la consommation et l&apos;historique pour votre structure.
                  </p>
                  <GoldButton href="/entreprise/reports">Voir les rapports</GoldButton>
                </section>
              </>
            )}
          </main>
        </div>
      </div>
    </section>
  )
}
