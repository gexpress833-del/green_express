"use client"
import { useRouter } from 'next/navigation'
import LivreurShell from '@/components/LivreurShell'
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
        setStats({ assigned:0, delivered:0, rating:0 })
        setLoading(false)
      })
  },[])

  return (
    <LivreurShell
      title="Tableau de bord Livreur"
      subtitle="Livraisons assignees, validation des codes et performance."
    >
            {loading ? (
              <div className="card text-center py-12">
                <p className="text-white/60">Chargement...</p>
              </div>
            ) : (
              <>
                <div className="stats-row">
                  <div className="stat-card">
                    <h4>Assignees</h4>
                    <p className="text-3xl font-bold tabular-nums">{stats?.assigned ?? 0}</p>
                    <Link href="/livreur/assignments" className="text-sm text-pink-400 hover:text-pink-300 mt-2 inline-block">
                      Voir mes missions
                    </Link>
                  </div>
                  <div className="stat-card">
                    <h4>Livrees</h4>
                    <p className="text-3xl font-bold tabular-nums">{stats?.delivered ?? 0}</p>
                    <p className="text-sm text-white/60 mt-2">Total completees</p>
                  </div>
                  <div className="stat-card">
                    <h4>Note</h4>
                    <p className="text-3xl font-bold tabular-nums">{stats?.rating ?? '—'}</p>
                    <p className="text-sm text-white/60 mt-2">Indicateur sur 5</p>
                  </div>
                </div>

                <section className="card mt-6 border border-white/10">
                  <h3 className="text-xl font-semibold mb-3 text-white/95">
                    Missions en cours
                  </h3>
                  <p className="text-white/70 mb-4">
                    Ouvrez la liste pour voir adresses, plats et saisir le code GX- remis par le client.
                  </p>
                  <GoldButton href="/livreur/assignments">Voir mes missions</GoldButton>
                </section>

                <section className="card mt-6 border border-white/10">
                  <h3 className="text-xl font-semibold mb-3 text-white/95">Actions rapides</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <GoldButton href="/livreur/assignments">Mes livraisons</GoldButton>
                    <GoldButton href="/livreur/performance">Ma performance</GoldButton>
                  </div>
                </section>
              </>
            )}
    </LivreurShell>
  )
}
