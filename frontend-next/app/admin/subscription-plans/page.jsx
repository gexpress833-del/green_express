"use client"
import Sidebar from '@/components/Sidebar'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { apiRequest } from '@/lib/api'
import { formatCurrencyCDF } from '@/lib/helpers'
import GoldButton from '@/components/GoldButton'

export default function AdminSubscriptionPlansPage() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({
    name: '',
    description: '',
    price_week: '',
    price_month: '',
    currency: 'CDF',
    days_per_week: 5,
    days_per_month: 20,
    is_active: true,
    sort_order: 0,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadPlans = () => {
    setLoading(true)
    apiRequest('/api/subscription-plans', { method: 'GET' })
      .then((r) => setPlans(Array.isArray(r) ? r : []))
      .catch(() => setPlans([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadPlans() }, [])

  function openCreate() {
    setModal('create')
    setForm({
      name: '', description: '', price_week: '', price_month: '',
      currency: 'CDF', days_per_week: 5, days_per_month: 20,
      is_active: true, sort_order: plans.length,
    })
    setError('')
  }

  function openEdit(plan) {
    setModal({ id: plan.id })
    setForm({
      name: plan.name,
      description: plan.description || '',
      price_week: plan.price_week,
      price_month: plan.price_month,
      currency: plan.currency || 'CDF',
      days_per_week: plan.days_per_week ?? 5,
      days_per_month: plan.days_per_month ?? 20,
      is_active: plan.is_active ?? true,
      sort_order: plan.sort_order ?? 0,
    })
    setError('')
  }

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price_week: Number(form.price_week),
      price_month: Number(form.price_month),
      currency: form.currency,
      days_per_week: Number(form.days_per_week),
      days_per_month: Number(form.days_per_month),
      is_active: !!form.is_active,
      sort_order: Number(form.sort_order),
    }
    try {
      if (modal === 'create') {
        await apiRequest('/api/admin/subscription-plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else if (modal?.id) {
        await apiRequest(`/api/admin/subscription-plans/${modal.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }
      setModal(null)
      loadPlans()
    } catch (err) {
      setError(err?.message || 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer ce plan ?')) return
    try {
      await apiRequest(`/api/admin/subscription-plans/${id}`, { method: 'DELETE' })
      loadPlans()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <section className="page-section min-h-screen bg-[#0b1220] text-white">
      <div className="container">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/admin/subscriptions" className="text-white/60 hover:text-white text-sm mb-2 inline-block">← Abonnements</Link>
            <h1 className="text-4xl font-bold mb-2" style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f5e08a 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Plans d&apos;abonnement</h1>
            <p className="text-white/70 text-lg">Définissez les offres que les clients peuvent choisir (semaine / mois, FC).</p>
          </div>
          <GoldButton onClick={openCreate}>Créer un plan</GoldButton>
        </header>
        <div className="dashboard-grid">
          <Sidebar />
          <main className="main-panel">
            {loading ? (
              <div className="card text-center py-12"><p className="text-white/60">Chargement...</p></div>
            ) : plans.length === 0 ? (
              <div className="card text-center py-12">
                <p className="text-white/60 mb-4">Aucun plan. Créez-en un pour que les clients puissent souscrire.</p>
                <GoldButton onClick={openCreate}>Créer un plan</GoldButton>
              </div>
            ) : (
              <div className="space-y-3">
                {plans.map((plan) => (
                  <div key={plan.id} className="card p-4 border border-white/10 flex flex-wrap justify-between items-center gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-cyan-400">{plan.name}</h3>
                      {plan.description && <p className="text-white/60 text-sm mt-1">{plan.description}</p>}
                      <p className="text-white/80 text-sm mt-2">
                        {formatCurrencyCDF(plan.price_week)} / semaine · {formatCurrencyCDF(plan.price_month)} / mois
                        <span className="ml-2 text-white/50">({plan.days_per_week} j/sem, {plan.days_per_month} j/mois)</span>
                      </p>
                      {!plan.is_active && <span className="badge badge-error text-xs mt-1">Inactif</span>}
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => openEdit(plan)} className="px-3 py-1.5 rounded-lg text-sm border border-white/30 text-white/90 hover:bg-white/10">Modifier</button>
                      <button type="button" onClick={() => handleDelete(plan.id)} className="px-3 py-1.5 rounded-lg text-sm bg-red-600/80 text-white hover:bg-red-500">Supprimer</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={() => !saving && setModal(null)}>
          <div className="bg-[#0b1220] border border-white/20 rounded-2xl max-w-md w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-semibold text-white mb-4">{modal === 'create' ? 'Nouveau plan' : 'Modifier le plan'}</h3>
            {error && <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 text-sm">{error}</div>}
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-white/80 text-sm mb-1">Nom *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/20 text-white" />
              </div>
              <div>
                <label className="block text-white/80 text-sm mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/20 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-white/80 text-sm mb-1">Prix semaine (FC) *</label>
                  <input type="number" min={0} step={1} value={form.price_week} onChange={(e) => setForm({ ...form, price_week: e.target.value })} required className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/20 text-white" />
                </div>
                <div>
                  <label className="block text-white/80 text-sm mb-1">Prix mois (FC) *</label>
                  <input type="number" min={0} step={1} value={form.price_month} onChange={(e) => setForm({ ...form, price_month: e.target.value })} required className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/20 text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-white/80 text-sm mb-1">Jours/semaine</label>
                  <input type="number" min={1} max={7} value={form.days_per_week} onChange={(e) => setForm({ ...form, days_per_week: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/20 text-white" />
                </div>
                <div>
                  <label className="block text-white/80 text-sm mb-1">Jours/mois</label>
                  <input type="number" min={1} max={31} value={form.days_per_month} onChange={(e) => setForm({ ...form, days_per_month: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/20 text-white" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_active" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="rounded" />
                <label htmlFor="is_active" className="text-white/80 text-sm">Plan visible pour les clients</label>
              </div>
              <div className="flex gap-2 pt-4">
                <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg font-semibold bg-[#d4af37] text-[#0b1220] hover:bg-[#e5c048] disabled:opacity-50">{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
                <button type="button" onClick={() => !saving && setModal(null)} className="px-4 py-2 rounded-lg border border-white/30 text-white/90 hover:bg-white/10">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
