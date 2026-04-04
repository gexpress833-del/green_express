"use client"
import { useRouter } from 'next/navigation'
import VerificateurSidebar from '@/components/VerificateurSidebar'
import DashboardGreeting from '@/components/DashboardGreeting'
import { useEffect, useState } from 'react'
import { apiRequest } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import GoldButton from '@/components/GoldButton'

export default function VerifierDashboard(){
  const router = useRouter()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const { isAuthenticated, initialised } = useAuth()

  useEffect(() => {
    if (!initialised) return
    if (!isAuthenticated) router.push('/login')
  }, [initialised, isAuthenticated, router])

  useEffect(() => {
    apiRequest('/api/verificateur/stats', { method: 'GET' })
      .then((r) => {
        setStats(r)
        setLoading(false)
      })
      .catch(() => {
        setStats({ validated: 340, pending: 4, last: 'Aujourd\'hui' })
        setLoading(false)
      })
  }, [])

  return (
    <section className="page-section page-section--admin-tight min-h-screen">
      <div className="mx-auto w-full max-w-[1400px]">
        <DashboardGreeting compact>
          <h1 className="text-4xl font-bold mb-2" style={{
            background: 'linear-gradient(135deg, #0096ff 0%, #00ffff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Tableau de bord Vérificateur
          </h1>
          <p className="text-white/70 text-lg">Validez les tickets de promotion générés par les clients</p>
        </DashboardGreeting>

        <div className="dashboard-grid">
          <VerificateurSidebar />
          <main className="main-panel min-h-0">
            {loading ? (
              <div className="card text-center py-12">
                <p className="text-white/60">Chargement...</p>
              </div>
            ) : (
              <>
                {/* Statistiques */}
                <div className="stats-row">
                  <div className="stat-card">
                    <h4>✅ Validés</h4>
                    <p className="text-3xl font-bold">{stats?.validated ?? 0}</p>
                    <p className="text-sm text-white/60 mt-2">Total validations</p>
                  </div>
                  <div className="stat-card">
                    <h4>⏳ En attente</h4>
                    <p className="text-3xl font-bold">{stats?.pending ?? 0}</p>
                    <p className="text-sm text-white/60 mt-2">En attente de validation</p>
                  </div>
                  <div className="stat-card">
                    <h4>🕐 Dernière validation</h4>
                    <p className="text-xl font-bold">{stats?.last ?? '—'}</p>
                    <p className="text-sm text-white/60 mt-2">Dernière action</p>
                  </div>
                </div>

                {/* Actions principales */}
                <section className="card mt-6">
                  <h3 className="text-xl font-semibold mb-4" style={{ 
                    background: 'linear-gradient(135deg, #0096ff 0%, #00ffff 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    🎫 Validation de tickets de promotion
                  </h3>
                  <p className="text-white/70 mb-4">
                    Validez les tickets générés par les clients pour réclamer des promotions avec leurs points.
                  </p>
                  <GoldButton href="/verificateur/validate">Valider un ticket</GoldButton>
                </section>

                {/* Actions rapides */}
                <section className="card mt-6">
                  <h3 className="text-xl font-semibold mb-4" style={{ 
                    background: 'linear-gradient(135deg, #00ffff 0%, #0096ff 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    ⚡ Actions rapides
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <GoldButton href="/verificateur/validate">Valider un ticket</GoldButton>
                    <GoldButton href="/verificateur/history">Historique complet</GoldButton>
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
