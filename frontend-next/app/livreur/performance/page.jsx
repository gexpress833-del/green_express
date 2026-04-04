"use client"
import { useEffect, useState } from 'react'
import { apiRequest } from '@/lib/api'
import LivreurShell from '@/components/LivreurShell'
import Link from 'next/link'

export default function LivreurPerformance() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiRequest('/api/livreur/stats', { method: 'GET' })
      .then((r) => {
        setStats(r)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <LivreurShell
      title="Performance"
      subtitle="Indicateurs de livraison (missions assignees, livrees, note indicative)."
    >
            {loading ? (
              <div className="card text-center py-12 border border-white/10">
                <p className="text-white/60">Chargement...</p>
              </div>
            ) : !stats ? (
              <div className="card text-center py-12 border border-white/10">
                <p className="text-white/60">Aucune donnee pour le moment.</p>
              </div>
            ) : (
              <div className="stats-row">
                <div className="stat-card">
                  <h4>En cours</h4>
                  <p className="text-3xl font-bold tabular-nums">{stats.assigned ?? 0}</p>
                  <Link href="/livreur/assignments" className="text-sm text-pink-400 hover:text-pink-300 mt-2 inline-block">
                    Voir mes missions
                  </Link>
                </div>
                <div className="stat-card">
                  <h4>Livrees</h4>
                  <p className="text-3xl font-bold tabular-nums">{stats.delivered ?? 0}</p>
                  <p className="text-sm text-white/60 mt-2">Total completees</p>
                </div>
                <div className="stat-card">
                  <h4>Note</h4>
                  <p className="text-3xl font-bold tabular-nums">{stats.rating != null ? stats.rating : '—'}</p>
                  <p className="text-sm text-white/60 mt-2">Sur 5 (indicatif)</p>
                </div>
              </div>
            )}
    </LivreurShell>
  )
}
