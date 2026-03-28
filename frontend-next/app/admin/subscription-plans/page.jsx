"use client"
import Sidebar from '@/components/Sidebar'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { apiRequest, uploadImageFile } from '@/lib/api'
import { formatCurrencyCDF } from '@/lib/helpers'
import GoldButton from '@/components/GoldButton'

const emptyItem = () => ({
  menu_id: null,
  title: '',
  description: '',
  image: '',
  meal_slot: '',
})

export default function AdminSubscriptionPlansPage() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({
    name: '',
    description: '',
    highlightsText: '',
    price_week: '',
    price_month: '',
    currency: 'CDF',
    days_per_week: 5,
    days_per_month: 20,
    is_active: false,
    sort_order: 0,
    items: [],
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [menuCatalog, setMenuCatalog] = useState([])
  const [menuFilter, setMenuFilter] = useState('')
  const [uploadingIndex, setUploadingIndex] = useState(null)

  const loadPlans = () => {
    setLoading(true)
    apiRequest('/api/subscription-plans', { method: 'GET' })
      .then((r) => setPlans(Array.isArray(r) ? r : []))
      .catch(() => setPlans([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadPlans() }, [])

  useEffect(() => {
    if (!modal) return
    apiRequest('/api/menus/browse?per_page=100', { method: 'GET' })
      .then((res) => {
        const rows = res?.data && Array.isArray(res.data) ? res.data : []
        setMenuCatalog(rows)
      })
      .catch(() => setMenuCatalog([]))
  }, [modal])

  const filteredMenus = useMemo(() => {
    const q = menuFilter.trim().toLowerCase()
    if (!q) return menuCatalog
    return menuCatalog.filter((m) => (m.title || '').toLowerCase().includes(q))
  }, [menuCatalog, menuFilter])

  function openCreate() {
    setModal('create')
    setForm({
      name: '', description: '', highlightsText: '', price_week: '', price_month: '',
      currency: 'CDF', days_per_week: 5, days_per_month: 20,
      is_active: false, sort_order: plans.length,
      items: [],
    })
    setMenuFilter('')
    setError('')
  }

  function openEdit(plan) {
    setModal({ id: plan.id })
    setForm({
      name: plan.name,
      description: plan.description || '',
      highlightsText: Array.isArray(plan.highlights) ? plan.highlights.join('\n') : '',
      price_week: plan.price_week,
      price_month: plan.price_month,
      currency: plan.currency || 'CDF',
      days_per_week: plan.days_per_week ?? 5,
      days_per_month: plan.days_per_month ?? 20,
      is_active: plan.is_active ?? false,
      sort_order: plan.sort_order ?? 0,
      items: (plan.items || []).map((it, i) => ({
        menu_id: it.menu_id ?? null,
        title: it.title || '',
        description: it.description || '',
        image: it.image || '',
        meal_slot: it.meal_slot || '',
        sort_order: it.sort_order ?? i,
      })),
    })
    setMenuFilter('')
    setError('')
  }

  function addItemFromMenu(menu) {
    setForm((f) => ({
      ...f,
      items: [
        ...f.items,
        {
          menu_id: menu.id,
          title: menu.title || '',
          description: menu.description || '',
          image: menu.image || '',
          meal_slot: '',
        },
      ],
    }))
  }

  function addCustomItem() {
    setForm((f) => ({ ...f, items: [...f.items, emptyItem()] }))
  }

  function updateItem(index, patch) {
    setForm((f) => ({
      ...f,
      items: f.items.map((it, i) => (i === index ? { ...it, ...patch } : it)),
    }))
  }

  function removeItem(index) {
    setForm((f) => ({
      ...f,
      items: f.items.filter((_, i) => i !== index),
    }))
  }

  function moveItem(index, dir) {
    setForm((f) => {
      const next = [...f.items]
      const j = index + dir
      if (j < 0 || j >= next.length) return f
      ;[next[index], next[j]] = [next[j], next[index]]
      return { ...f, items: next }
    })
  }

  async function handleImageUpload(index, e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingIndex(index)
    setError('')
    try {
      const data = await uploadImageFile(file, 'subscription-plans')
      const url = data?.url
      if (url) updateItem(index, { image: url })
      else setError('Réponse upload sans URL')
    } catch (err) {
      setError(err?.message || 'Échec upload image')
    } finally {
      setUploadingIndex(null)
      e.target.value = ''
    }
  }

  function buildPayload() {
    const items = form.items.map((it, i) => ({
      menu_id: it.menu_id ? Number(it.menu_id) : null,
      title: it.title.trim(),
      description: it.description?.trim() || null,
      image: it.image?.trim() || null,
      meal_slot: it.meal_slot?.trim() || null,
      sort_order: i,
    }))
    const highlights = form.highlightsText
      ? form.highlightsText.split('\n').map((l) => l.trim()).filter(Boolean)
      : []

    return {
      name: form.name.trim(),
      description: form.description.trim() || null,
      highlights,
      price_week: Number(form.price_week),
      price_month: Number(form.price_month),
      currency: form.currency,
      days_per_week: Number(form.days_per_week),
      days_per_month: Number(form.days_per_month),
      is_active: !!form.is_active,
      sort_order: Number(form.sort_order),
      items,
    }
  }

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    for (let i = 0; i < form.items.length; i++) {
      if (!form.items[i].title?.trim()) {
        setError(`Indiquez un titre pour le plat n°${i + 1} (ou supprimez la ligne).`)
        return
      }
    }
    setSaving(true)
    const payload = buildPayload()
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
            <p className="text-white/70 text-lg">
              Définissez les offres et les plats illustrés. Un plan n’apparaît sur la page Abonnements client que si vous cochez{' '}
              <strong className="text-white/90">Publier sur la vitrine</strong> (sinon il reste en brouillon).
            </p>
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
                <p className="text-white/60 mb-4">Aucun plan enregistré. Créez un plan et cochez « Publier sur la vitrine » pour l’afficher aux clients.</p>
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
                        {formatCurrencyCDF(plan.price_week)} / semaine
                        <span className="ml-2 text-white/50">({plan.days_per_week} j. ouvrés / sem.)</span>
                      </p>
                      {Array.isArray(plan.items) && plan.items.length > 0 && (
                        <p className="text-amber-200/90 text-xs mt-1">{plan.items.length} plat(s) illustré(s)</p>
                      )}
                      {plan.is_active ? (
                        <span className="inline-block mt-2 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-500/40">Publié — visible par les clients</span>
                      ) : (
                        <span className="inline-block mt-2 px-2 py-0.5 rounded text-xs font-semibold bg-white/10 text-white/70 border border-white/20">Brouillon — masqué côté client</span>
                      )}
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
          <div
            className="bg-[#0b1220] border border-white/20 rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold text-white mb-2">{modal === 'create' ? 'Nouveau plan' : 'Modifier le plan'}</h3>
            <p className="text-white/55 text-sm mb-4">
              Ajoutez les plats inclus dans l&apos;abonnement : titre, description marketing, image (catalogue ou upload). L&apos;ordre défini l&apos;affichage côté client.
            </p>
            {error && <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 text-sm">{error}</div>}
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-white/80 text-sm mb-1">Nom *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/20 text-white" />
              </div>
              <div>
                <label className="block text-white/80 text-sm mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/20 text-white" />
              </div>
              <div>
                <label className="block text-white/80 text-sm mb-1">Points forts (liste à puces, une ligne = une puce)</label>
                <textarea
                  value={form.highlightsText}
                  onChange={(e) => setForm({ ...form, highlightsText: e.target.value })}
                  rows={4}
                  placeholder={'Ex. : Cinq jours ouvrés par cycle (lun–ven)\nRenouvellement par période hebdomadaire'}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-white/35 text-sm"
                />
                <p className="text-white/45 text-xs mt-1">Ces lignes s’affichent sous la formule sur la page Abonnements (évitez toute mention « mensuel » si vous ne proposez que la semaine).</p>
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
              <div className="rounded-lg border border-white/15 bg-white/[0.04] p-3">
                <div className="flex items-start gap-3">
                  <input type="checkbox" id="is_active" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="rounded mt-1" />
                  <div>
                    <label htmlFor="is_active" className="text-white/90 text-sm font-medium cursor-pointer">Publier sur la vitrine Abonnements</label>
                    <p className="text-white/50 text-xs mt-1 m-0">Sans cette case, le plan reste un brouillon : les clients ne le voient pas et ne peuvent pas souscrire.</p>
                  </div>
                </div>
              </div>

              <div className="border border-white/15 rounded-xl p-4 bg-white/[0.03]">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <h4 className="text-sm font-semibold text-amber-200/95">Plats de la formule (vitrine client)</h4>
                  <div className="flex gap-2">
                    <button type="button" onClick={addCustomItem} className="text-xs px-2 py-1 rounded border border-white/25 text-white/90 hover:bg-white/10">
                      + Plat personnalisé
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-white/60 text-xs mb-1">Ajouter depuis le catalogue (menus approuvés)</label>
                  <input
                    type="search"
                    value={menuFilter}
                    onChange={(e) => setMenuFilter(e.target.value)}
                    placeholder="Filtrer par nom…"
                    className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/15 text-white text-sm mb-2"
                  />
                  <div className="max-h-32 overflow-y-auto rounded-lg border border-white/10 divide-y divide-white/10">
                    {filteredMenus.length === 0 ? (
                      <p className="text-white/40 text-xs p-2">Aucun menu trouvé.</p>
                    ) : (
                      filteredMenus.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => addItemFromMenu(m)}
                          className="w-full text-left px-2 py-1.5 text-xs text-white/85 hover:bg-white/10 flex justify-between gap-2"
                        >
                          <span className="truncate">{m.title}</span>
                          <span className="text-white/40 shrink-0">+</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {form.items.length === 0 ? (
                  <p className="text-white/45 text-sm">Aucun plat pour l’instant — utilisez le catalogue ou « Plat personnalisé ».</p>
                ) : (
                  <ul className="space-y-3">
                    {form.items.map((it, index) => (
                      <li key={`row-${index}`} className="rounded-lg border border-white/12 p-3 bg-[#0b1220]/80">
                        <div className="flex flex-wrap gap-3">
                          <div className="w-24 h-20 shrink-0 rounded-md overflow-hidden bg-black/40 border border-white/10">
                            {it.image ? (
                              <img src={it.image} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white/30 text-xl">—</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-[200px] space-y-2">
                            <input
                              type="text"
                              placeholder="Titre du plat *"
                              value={it.title}
                              onChange={(e) => updateItem(index, { title: e.target.value })}
                              className="w-full px-2 py-1.5 rounded bg-white/5 border border-white/15 text-white text-sm"
                            />
                            <textarea
                              placeholder="Description (accroche client)"
                              rows={2}
                              value={it.description}
                              onChange={(e) => updateItem(index, { description: e.target.value })}
                              className="w-full px-2 py-1.5 rounded bg-white/5 border border-white/15 text-white text-sm"
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <input
                                type="text"
                                placeholder="Créneau (ex. Déjeuner, Goûter)"
                                value={it.meal_slot}
                                onChange={(e) => updateItem(index, { meal_slot: e.target.value })}
                                className="px-2 py-1.5 rounded bg-white/5 border border-white/15 text-white text-xs"
                              />
                              <input
                                type="url"
                                placeholder="URL image (optionnel si upload)"
                                value={it.image}
                                onChange={(e) => updateItem(index, { image: e.target.value })}
                                className="px-2 py-1.5 rounded bg-white/5 border border-white/15 text-white text-xs"
                              />
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <label className="text-xs text-cyan-300/90 cursor-pointer border border-cyan-500/40 rounded px-2 py-1 hover:bg-cyan-500/10">
                                {uploadingIndex === index ? 'Upload…' : 'Upload image'}
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(index, e)} disabled={uploadingIndex !== null} />
                              </label>
                              {it.menu_id && (
                                <span className="text-[10px] text-white/40">lié menu #{it.menu_id}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-1 shrink-0">
                            <button type="button" onClick={() => moveItem(index, -1)} className="text-xs px-2 py-0.5 border border-white/20 rounded text-white/70 hover:bg-white/10" disabled={index === 0}>
                              ↑
                            </button>
                            <button type="button" onClick={() => moveItem(index, 1)} className="text-xs px-2 py-0.5 border border-white/20 rounded text-white/70 hover:bg-white/10" disabled={index === form.items.length - 1}>
                              ↓
                            </button>
                            <button type="button" onClick={() => removeItem(index)} className="text-xs px-2 py-0.5 rounded bg-red-600/50 text-white hover:bg-red-500/80">
                              Retirer
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={saving || uploadingIndex !== null} className="px-4 py-2 rounded-lg font-semibold bg-[#d4af37] text-[#0b1220] hover:bg-[#e5c048] disabled:opacity-50">{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
                <button type="button" onClick={() => !saving && setModal(null)} className="px-4 py-2 rounded-lg border border-white/30 text-white/90 hover:bg-white/10">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
