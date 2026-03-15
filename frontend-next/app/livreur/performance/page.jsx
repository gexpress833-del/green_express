"use client"
import { useEffect, useState } from 'react'
import { apiRequest } from '@/lib/api'
import LivreurSidebar from '@/components/LivreurSidebar'
import Link from 'next/link'

export default function LivreurPerformance() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiRequest('/api/livreur/stats', { method: 'GET' })
      .then(r => { setStats(r); setLoading(false) })
      .catch(() => { setLoading(false) })
  }, [])

  return (
    <section className="page-section min-h-screen">
      <div className="container">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{
            background: 'linear-gradient(135deg, #ff1493 0%, #ff00ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Performance
          </h1>
          <p className="text-white/70 text-lg">Vos indicateurs de livraison et votre note</p>
        </header>

        <div className="dashboard-grid">
          <LivreurSidebar />
          <main className="main-panel">
            {loading ? (
              <div className="card text-center py-12">
                <p className="text-white/60">Chargement...</p>
              </div>
            ) : !stats ? (
              <div className="card text-center py-12">
                <p className="text-white/60">Aucune donnée de performance pour le moment.</p>
              </div>
            ) : (
              <div className="stats-row">
                <div className="stat-card">
                  <h4>📦 En cours</h4>
                  <p className="text-3xl font-bold">{stats.assigned ?? 0}</p>
                  <Link href="/livreur/assignments" className="text-sm text-pink-400 hover:text-pink-300 mt-2 inline-block">
                    Voir mes missions →
                  </Link>
                </div>
                <div className="stat-card">
                  <h4>✅ Livrées</h4>
                  <p className="text-3xl font-bold">{stats.delivered ?? 0}</p>
                  <p className="text-sm text-white/60 mt-2">Total complétées</p>
                </div>
                <div className="stat-card">
                  <h4>⭐ Note</h4>
                  <p className="text-3xl font-bold">{stats.rating != null ? stats.rating : '—'}</p>
                  <p className="text-sm text-white/60 mt-2">Note moyenne</p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </section>
  )
}
