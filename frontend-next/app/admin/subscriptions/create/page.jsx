"use client"
import Sidebar from '@/components/Sidebar'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { apiRequest } from '@/lib/api'
import { formatCurrencyCDF } from '@/lib/helpers'

export default function AdminCreateSubscriptionPage() {
  const router = useRouter()
  const [users, setUsers] = useState([])
  const [plans, setPlans] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [loadingPlans, setLoadingPlans] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState('')
  const [planId, setPlanId] = useState('')
  const [period, setPeriod] = useState('month')

  useEffect(() => {
    apiRequest('/api/users', { method: 'GET' })
      .then((r) => {
        const list = Array.isArray(r) ? r : (r?.data ? r.data : [])
        setUsers(list.filter((u) => u.role === 'client'))
      })
      .catch(() => setUsers([]))
      .finally(() => setLoadingUsers(false))
  }, [])

  useEffect(() => {
    apiRequest('/api/subscription-plans', { method: 'GET' })
      .then((r) => setPlans(Array.isArray(r) ? r : []))
      .catch(() => setPlans([]))
      .finally(() => setLoadingPlans(false))
  }, [])

  const selectedPlan = planId ? plans.find((p) => p.id === parseInt(planId, 10)) : null

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!userId || !selectedPlan) {
      setError('Veuillez sélectionner un client et un plan.')
      return
    }
    setSubmitting(true)
    try {
      await apiRequest('/api/admin/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: parseInt(userId, 10),
          subscription_plan_id: selectedPlan.id,
          period,
        }),
      })
      router.push('/admin/subscriptions')
    } catch (err) {
      setError(err?.message || 'Erreur lors de la création.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="page-section min-h-screen bg-[#0b1220] text-white">
      <div className="container">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{
            background: 'linear-gradient(135deg, #d4af37 0%, #f5e08a 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Créer un abonnement
          </h1>
          <p className="text-white/70 text-lg">Attribuer un abonnement à un client (FC, par semaine ou par mois).</p>
        </header>

        <div className="dashboard-grid">
          <Sidebar />
          <main className="main-panel">
            <div className="mb-4">
              <Link
                href="/admin/subscriptions"
                className="text-white/70 hover:text-white text-sm"
              >
                ← Retour à la liste des abonnements
              </Link>
            </div>

            <form onSubmit={handleSubmit} className="card p-6 max-w-xl">
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 text-sm">
                  {error}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-white/90 font-medium mb-2">Client *</label>
                <select
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white"
                  disabled={loadingUsers}
                >
                  <option value="">Choisir un client</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name || u.email} ({u.email})
                    </option>
                  ))}
                </select>
                {loadingUsers && <p className="text-white/50 text-xs mt-1">Chargement des clients...</p>}
              </div>

              <div className="mb-4">
                <label className="block text-white/90 font-medium mb-2">Plan *</label>
                <select
                  value={planId}
                  onChange={(e) => setPlanId(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white"
                  disabled={loadingPlans}
                >
                  <option value="">Choisir un plan</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {formatCurrencyCDF(p.price_week)} / sem · {formatCurrencyCDF(p.price_month)} / mois
                    </option>
                  ))}
                </select>
                {loadingPlans && <p className="text-white/50 text-xs mt-1">Chargement des plans...</p>}
              </div>

              <div className="mb-6">
                <label className="block text-white/90 font-medium mb-2">Période *</label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white"
                >
                  <option value="week">Par semaine</option>
                  <option value="month">Par mois</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting || !userId || !selectedPlan || loadingPlans}
                  className="px-4 py-2 rounded-lg font-semibold bg-[#d4af37] text-[#0b1220] hover:bg-[#e5c048] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Création...' : 'Créer l\'abonnement'}
                </button>
                <Link
                  href="/admin/subscriptions"
                  className="px-4 py-2 rounded-lg border border-white/30 text-white/90 hover:bg-white/10 transition"
                >
                  Annuler
                </Link>
              </div>
            </form>
          </main>
        </div>
      </div>
    </section>
  )
}
