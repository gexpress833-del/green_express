"use client"
import { useRouter } from 'next/navigation'
import LivreurSidebar from '@/components/LivreurSidebar'
import DashboardGreeting from '@/components/DashboardGreeting'
import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import GoldButton from '@/components/GoldButton'
import { apiRequest } from '@/lib/api'
import Link from 'next/link'

export default function LivreurDashboard(){
  const router = useRouter()
  const [stats,setStats]=useState(null)
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
    apiRequest('/api/livreur/stats', { method:'GET' })
      .then(r=>{
        setStats(r)
        setLoading(false)
      })
      .catch(()=>{
        setStats({ assigned:5, delivered:120, rating:4.8 })
        setLoading(false)
      })
  },[])

  return (
    <section className="page-section min-h-screen">
      <div className="container">
        <DashboardGreeting>
          <h1 className="text-4xl font-bold mb-2" style={{
            background: 'linear-gradient(135deg, #ff1493 0%, #ff00ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Tableau de bord Livreur
          </h1>
          <p className="text-white/70 text-lg">Consultez vos livraisons assignées et suivez votre performance</p>
        </DashboardGreeting>

        <div className="dashboard-grid">
          <LivreurSidebar />
          <main className="main-panel">
            {loading ? (
              <div className="card text-center py-12">
                <p className="text-white/60">Chargement...</p>
              </div>
            ) : (
              <>
                {/* Statistiques */}
                <div className="stats-row">
                  <div className="stat-card">
                    <h4>📦 Assignées</h4>
                    <p className="text-3xl font-bold">{stats?.assigned ?? 0}</p>
                    <Link href="/livreur/assignments" className="text-sm text-pink-400 hover:text-pink-300 mt-2 inline-block">
                      Voir mes missions →
                    </Link>
                  </div>
                  <div className="stat-card">
                    <h4>✅ Livrées</h4>
                    <p className="text-3xl font-bold">{stats?.delivered ?? 0}</p>
                    <p className="text-sm text-white/60 mt-2">Total complétées</p>
                  </div>
                  <div className="stat-card">
                    <h4>⭐ Note</h4>
                    <p className="text-3xl font-bold">{stats?.rating ?? '—'}</p>
                    <p className="text-sm text-white/60 mt-2">Note moyenne clients</p>
                  </div>
                </div>

                {/* Actions principales */}
                <section className="card mt-6">
                  <h3 className="text-xl font-semibold mb-4" style={{ 
                    background: 'linear-gradient(135deg, #ff1493 0%, #ff00ff 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    🚚 Missions en cours
                  </h3>
                  <p className="text-white/70 mb-4">
                    Gérez vos livraisons assignées et validez les codes de réception.
                  </p>
                  <GoldButton href="/livreur/assignments">Voir mes missions</GoldButton>
                </section>

                {/* Actions rapides */}
                <section className="card mt-6">
                  <h3 className="text-xl font-semibold mb-4" style={{ 
                    background: 'linear-gradient(135deg, #00ffff 0%, #ff1493 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    ⚡ Actions rapides
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <GoldButton href="/livreur/assignments">Mes livraisons</GoldButton>
                    <GoldButton href="/livreur/performance">Ma performance</GoldButton>
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
