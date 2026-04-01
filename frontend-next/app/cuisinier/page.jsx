"use client"
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Sidebar from '@/components/Sidebar'
import DashboardGreeting from '@/components/DashboardGreeting'
import GoldButton from '@/components/GoldButton'
import { apiRequest } from '@/lib/api'
import Link from 'next/link'

export default function ChefDashboard(){
  const router = useRouter()
  const [stats, setStats] = useState(null)
  const [opStats, setOpStats] = useState(null)
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
    Promise.all([
      apiRequest('/api/cuisinier/stats', { method: 'GET' }),
      apiRequest('/api/operational/subscriptions/stats', { method: 'GET' }).catch(() => null),
    ])
      .then(([r, o]) => {
        setStats(r)
        setOpStats(o)
        setLoading(false)
      })
      .catch(()=> {
        setStats({ menus: 12, submitted: 3, validated: 9 })
        setOpStats(null)
        setLoading(false)
      })
  },[])

  return (
    <section className="page-section min-h-screen">
      <div className="container">
        <DashboardGreeting>
          <h1 className="text-4xl font-bold mb-2" style={{
            background: 'linear-gradient(135deg, #9d4edd 0%, #ff00ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Tableau de bord Cuisinier
          </h1>
          <p className="text-white/70 text-lg">Gérez vos plats, soumettez des menus et suivez vos ventes</p>
        </DashboardGreeting>

        <div className="dashboard-grid">
          <Sidebar />
          <main className="main-panel">
            {loading ? (
              <div className="card text-center py-12">
                <p className="text-white/60">Chargement...</p>
              </div>
            ) : (
              <>
                {/* Statistiques */}
                {opStats && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div className="stat-card border border-emerald-500/30 bg-emerald-500/5">
                      <h4 className="text-emerald-200/90">Demain</h4>
                      <p className="text-3xl font-bold tabular-nums">{opStats.tomorrow?.is_weekend ? '—' : (opStats.tomorrow?.meal_count ?? 0)}</p>
                      <p className="text-sm text-white/60 mt-2">repas à préparer</p>
                      <p className="text-xs text-white/50 mt-2 line-clamp-2">{opStats.tomorrow?.is_weekend ? 'Jour non ouvré' : (opStats.tomorrow?.menu_summary || '')}</p>
                      <p className="text-xs text-white/40 mt-1">{opStats.tomorrow?.client_count ?? 0} client(s)</p>
                    </div>
                    <div className="stat-card">
                      <h4>Abonnements</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                        <span><span className="text-emerald-400 font-bold">{opStats.subscriptions?.active ?? '—'}</span> <span className="text-white/60">actifs</span></span>
                        <span><span className="text-sky-400 font-bold">{opStats.subscriptions?.scheduled ?? '—'}</span> <span className="text-white/60">planifiés</span></span>
                        <span><span className="text-amber-400 font-bold">{opStats.subscriptions?.pending ?? '—'}</span> <span className="text-white/60">en attente</span></span>
                        <span><span className="text-red-400 font-bold">{opStats.subscriptions?.expired ?? '—'}</span> <span className="text-white/60">expirés</span></span>
                      </div>
                      <Link href="/cuisinier/subscriptions" className="text-sm text-purple-400 hover:text-purple-300 mt-3 inline-block">Abonnements & repas →</Link>
                    </div>
                  </div>
                )}

                <div className="stats-row">
                  <div className="stat-card">
                    <h4>🍽️ Menus</h4>
                    <p className="text-3xl font-bold">{stats?.menus ?? 0}</p>
                    <p className="text-sm text-white/60 mt-2">Total créés</p>
                  </div>
                  <div className="stat-card">
                    <h4>⏳ Soumis</h4>
                    <p className="text-3xl font-bold">{stats?.submitted ?? 0}</p>
                    <p className="text-sm text-white/60 mt-2">En attente d'approbation (admin)</p>
                  </div>
                  <div className="stat-card">
                    <h4>✅ Validés</h4>
                    <p className="text-3xl font-bold">{stats?.validated ?? 0}</p>
                    <Link href="/cuisinier/menus" className="text-sm text-purple-400 hover:text-purple-300 mt-2 inline-block">
                      Voir mes menus →
                    </Link>
                  </div>
                </div>

                {/* Actions principales */}
                <section className="card mt-6">
                  <h3 className="text-xl font-semibold mb-4" style={{ 
                    background: 'linear-gradient(135deg, #9d4edd 0%, #ff00ff 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    ➕ Créer un nouveau menu
                  </h3>
                  <p className="text-white/70 mb-4">
                    Ajoutez un nouveau plat à votre catalogue avec titre, description, prix et image.
                  </p>
                  <GoldButton href="/cuisinier/menu/create">Créer un menu</GoldButton>
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
                    <GoldButton href="/cuisinier/menus">Voir tous mes menus</GoldButton>
                    <GoldButton href="/cuisinier/orders">Commandes — Attribuer un livreur</GoldButton>
                    <GoldButton href="/cuisinier/subscriptions">Abonnements & repas demain</GoldButton>
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
