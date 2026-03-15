"use client"
import { useRouter } from 'next/navigation'
import ClientSidebar from '@/components/ClientSidebar'
import GoldButton from '@/components/GoldButton'
import DashboardGreeting from '@/components/DashboardGreeting'
import ReadOnlyGuard from '@/components/ReadOnlyGuard'
import { useEffect, useState } from 'react'
import { apiRequest } from '@/lib/api'
import Link from 'next/link'

export default function ClientDashboard(){
  const router = useRouter()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = () => {
    apiRequest('/api/client/stats', { method: 'GET' })
      .then(r => {
        setStats(r)
        setLoading(false)
      })
      .catch(() => {
        setStats(s => s ?? { points: 0, orders: 0, subscriptions: 0 })
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchStats()
  }, [])

  // Rafraîchir les stats toutes les 30 s (sans recharger la page)
  useEffect(() => {
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <ReadOnlyGuard allowedActions={['view', 'read', 'order', 'claim']} showWarning={false}>
      <section className="page-section min-h-screen">
        <div className="container">
          <DashboardGreeting>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2" style={{
              background: 'linear-gradient(135deg, #00ffff 0%, #9d4edd 50%, #ff00ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Tableau de bord Client
            </h1>
            <p className="text-white/70 text-sm sm:text-base lg:text-lg">Gérez vos commandes, points et abonnements</p>
          </DashboardGreeting>

          <div className="dashboard-grid">
            <ClientSidebar />
            <main className="main-panel">
              {loading ? (
                <div className="card text-center py-12">
                  <p className="text-white/60">Chargement...</p>
                </div>
              ) : (
                <>
                  {/* Bloc Points fidélité — design mis en avant */}
                  <div className="points-fidelity-card mb-6">
                    <div className="points-fidelity-inner">
                      <div className="points-fidelity-header">
                        <span className="points-fidelity-icon" aria-hidden>⭐</span>
                        <div>
                          <h3 className="points-fidelity-title">Points fidélité</h3>
                          <p className="points-fidelity-subtitle">Cumulables · Réductions · Repas gratuits · Promos</p>
                        </div>
                      </div>
                      <div className="points-fidelity-value-wrap">
                        <span className="points-fidelity-value">{stats?.points ?? 0}</span>
                        <span className="points-fidelity-unit">pts</span>
                      </div>
                      <Link
                        href="/client/promotions"
                        className="points-fidelity-cta"
                      >
                        Utiliser mes points →
                      </Link>
                    </div>
                  </div>

                  {/* Autres statistiques */}
                  <div className="stats-row">
                    <div className="stat-card">
                      <h4>🛒 Commandes</h4>
                      <p className="text-2xl sm:text-3xl font-bold">{stats?.orders ?? 0}</p>
                      <Link href="/client/orders" className="text-sm text-cyan-400 hover:text-cyan-300 mt-2 inline-block">
                        Voir l'historique →
                      </Link>
                    </div>
                    <div className="stat-card">
                      <h4>💳 Abonnements</h4>
                      <p className="text-2xl sm:text-3xl font-bold">{stats?.subscriptions ?? 0}</p>
                      <Link href="/client/subscriptions" className="text-sm text-cyan-400 hover:text-cyan-300 mt-2 inline-block">
                        Gérer mes abonnements →
                      </Link>
                    </div>
                  </div>

                  {/* Actions principales */}
                  <section className="card mt-6">
                    <h3 className="text-lg sm:text-xl font-semibold mb-4" style={{ 
                      background: 'linear-gradient(135deg, #00ffff 0%, #ff00ff 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}>
                      🎁 Promotions disponibles
                    </h3>
                    <p className="text-white/70 mb-4">
                      Consultez et réclamez les offres compatibles avec votre solde de points.
                    </p>
                    <GoldButton href="/client/promotions">Voir les promotions</GoldButton>
                  </section>

                  {/* Actions principales */}
                  <section className="card mt-6">
                    <h3 className="text-lg sm:text-xl font-semibold mb-4" style={{ 
                      background: 'linear-gradient(135deg, #00ffff 0%, #9d4edd 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}>
                      🍽️ Consulter les menus
                    </h3>
                    <p className="text-white/70 mb-4">
                      Parcourez nos plats disponibles et passez votre commande en quelques clics.
                    </p>
                    <GoldButton href="/client/menus">Voir les menus</GoldButton>
                  </section>

                  {/* Actions rapides */}
                  <section className="card mt-6">
                    <h3 className="text-lg sm:text-xl font-semibold mb-4" style={{ 
                      background: 'linear-gradient(135deg, #9d4edd 0%, #00ffff 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}>
                      📋 Actions rapides
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <GoldButton href="/client/menus">Voir les menus</GoldButton>
                      <GoldButton href="/client/orders">Mes commandes</GoldButton>
                      <GoldButton href="/client/subscriptions">Mes abonnements</GoldButton>
                      <GoldButton href="/client/promotions">Promotions</GoldButton>
                    </div>
                  </section>
                </>
              )}
            </main>
          </div>
        </div>
      </section>
    </ReadOnlyGuard>
  )
}
