"use client"
import { useRouter } from 'next/navigation'
import EntrepriseSidebar from '@/components/EntrepriseSidebar'
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
            ) : stats?.company_pending ? (
              <div className="card p-8 text-center max-w-xl mx-auto">
                <div className="text-5xl mb-4" aria-hidden>⏳</div>
                <h2 className="text-xl font-semibold text-white mb-3">Compte entreprise en attente d&apos;activation</h2>
                <p className="text-white/80 mb-6">Votre demande d&apos;accès entreprise est en cours d&apos;examen par l&apos;administrateur. Une fois votre entreprise approuvée, vous pourrez gérer les employés, les abonnements et les commandes.</p>
                <p className="text-white/80 mb-4">Pour toute question, contactez Green Express :</p>
                <ul className="text-white/90 mb-6 list-none space-y-1">
                  <li><a href="mailto:gexpress833@gmail.com" className="hover:opacity-90 underline" style={{ color: '#d4af37' }}>gexpress833@gmail.com</a></li>
                  <li><a href="tel:+243990292005" className="hover:opacity-90 underline" style={{ color: '#d4af37' }}>+243 990 292 005</a></li>
                </ul>
                <GoldButton href="/profile">Mon profil</GoldButton>
              </div>
            ) : (
              <>
                {/* Statistiques */}
                <div className="stats-row">
                  <div className="stat-card">
                    <h4>👥 Employés</h4>
                    <p className="text-3xl font-bold">{stats?.employees ?? 0}</p>
                    <p className="text-sm text-white/60 mt-2">Employés enregistrés</p>
                  </div>
                  <div className="stat-card">
                    <h4>🛒 Commandes</h4>
                    <p className="text-3xl font-bold">{stats?.orders ?? 0}</p>
                    <Link href="/entreprise/orders" className="text-sm text-green-400 hover:text-green-300 mt-2 inline-block">
                      Voir les commandes →
                    </Link>
                  </div>
                  <div className="stat-card">
                    <h4>💰 Budget</h4>
                    <p className="text-3xl font-bold">{stats?.budget ?? 0} USD</p>
                    <p className="text-sm text-white/60 mt-2">Budget disponible</p>
                  </div>
                </div>

                {/* Actions principales */}
                <section className="card mt-6">
                  <h3 className="text-xl font-semibold mb-4" style={{ 
                    background: 'linear-gradient(135deg, #39ff14 0%, #00ffff 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    📊 Rapports et analyses
                  </h3>
                  <p className="text-white/70 mb-4">
                    Consultez les rapports détaillés de consommation et gérez vos abonnements.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <GoldButton href="/entreprise/reports">Voir les rapports</GoldButton>
                    <GoldButton href="/entreprise/subscriptions">Gérer les abonnements</GoldButton>
                  </div>
                </section>

                {/* Actions rapides */}
                <section className="card mt-6">
                  <h3 className="text-xl font-semibold mb-4" style={{ 
                    background: 'linear-gradient(135deg, #00ffff 0%, #9d4edd 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    ⚡ Actions rapides
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <GoldButton href="/entreprise/employees">Gérer les employés</GoldButton>
                    <GoldButton href="/entreprise/orders">Commandes entreprise</GoldButton>
                    <GoldButton href="/entreprise/budget">Gérer le budget</GoldButton>
                    <GoldButton href="/entreprise/reports">Rapports de consommation</GoldButton>
                  </div>
                </section>
              </>
            )}
          </main>
        </div>
      </div>
    </section>
  )
}
