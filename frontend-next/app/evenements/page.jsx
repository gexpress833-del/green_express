"use client"
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { apiRequest } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

export default function ServiceEvenementielPage() {
  const { user, initialised, isAuthenticated } = useAuth()
  const [isClient, setIsClient] = useState(false)
  const [eventTypes, setEventTypes] = useState([])
  const [form, setForm] = useState({
    contact_phone: '',
    event_type: '',
    event_date: '',
    guest_count: '',
    budget: '',
    message: '',
  })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Charger les types d'événements depuis l'API
  useEffect(() => {
    const fetchEventTypes = async () => {
      try {
        const response = await apiRequest('/api/event-types')
        if (response?.data) {
          setEventTypes(response.data)
        }
      } catch (err) {
        console.error('Erreur lors du chargement des types d\'événements:', err)
      }
    }
    
    if (isClient) {
      fetchEventTypes()
    }
  }, [isClient])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSending(true)
    try {
      await apiRequest('/api/event-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_phone: form.contact_phone.trim(),
          event_type: form.event_type,
          event_date: form.event_date,
          guest_count: parseInt(form.guest_count, 10),
          budget: form.budget,
          message: form.message,
        }),
      })
      setSent(true)
      setForm({ contact_phone: '', event_type: '', event_date: '', guest_count: '', budget: '', message: '' })
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'envoi. Réessayez.')
    } finally {
      setSending(false)
    }
  }

  if (!isClient || !initialised || !isAuthenticated) {
    return (
      <section className="page-section min-h-screen bg-[#0b1220] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/60">Chargement…</p>
          <p className="text-white/40 text-sm mt-2">Redirection vers la connexion si nécessaire.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="page-section min-h-screen bg-[#0b1220] text-white">
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <header className="mb-10">
          <h1 className="text-4xl font-extrabold mb-3" style={{
            background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Service événementiel
          </h1>
          <p className="text-white/70 text-lg">
            Green Express adapte son offre à votre budget, au nombre d&apos;invités, au type de menu et au format de l&apos;événement.
          </p>
        </header>

        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          {eventTypes.map((item) => (
            <div key={item.id} className="card p-5 border border-white/10">
              <h3 className="text-lg font-semibold text-cyan-400 mb-2">{item.title}</h3>
              <p className="text-white/70 text-sm">{item.description}</p>
            </div>
          ))}
        </div>

        <div className="card p-6 border border-white/10">
          <h2 className="text-xl font-semibold mb-3 text-white/90">Demande de devis</h2>
          <p className="text-white/70 text-sm mb-4">
            Indiquez le type d&apos;événement, la date, le nombre de personnes et votre budget. Nous vous recontactons pour une proposition sur mesure.
          </p>
          {sent && (
            <div className="mb-4 p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
              <p className="text-green-300 text-sm">Votre demande a bien été enregistrée. Green Express vous recontactera sous 48 h.</p>
            </div>
          )}
          {error && (
            <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="p-4 rounded-lg bg-white/5 border border-white/10 mb-4">
              <p className="text-white/60 text-xs font-medium mb-2 uppercase tracking-wider">Récupéré depuis votre compte</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/50 text-xs mb-1">Nom</label>
                  <p className="text-white font-medium">{user?.name || '—'}</p>
                </div>
                <div>
                  <label className="block text-white/50 text-xs mb-1">Email</label>
                  <p className="text-white font-medium">{user?.email || '—'}</p>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-white/80 text-sm font-medium mb-1">Téléphone</label>
              <input
                type="tel"
                placeholder="Ex. +243 812 345 678"
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-white/40"
                required
                value={form.contact_phone}
                onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
              />
              <p className="text-white/50 text-xs mt-1">Pour vous recontacter plus rapidement</p>
            </div>
            <div>
              <label className="block text-white/80 text-sm font-medium mb-1">Type d&apos;événement</label>
              <select
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white"
                required
                value={form.event_type}
                onChange={(e) => setForm({ ...form, event_type: e.target.value })}
              >
                <option value="">Sélectionnez...</option>
                {eventTypes.map((e) => (
                  <option key={e.id} value={e.title}>{e.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-white/80 text-sm font-medium mb-1">Date prévue</label>
              <input
                type="date"
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white"
                required
                value={form.event_date}
                onChange={(e) => setForm({ ...form, event_date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-white/80 text-sm font-medium mb-1">Nombre de personnes</label>
              <input
                type="number"
                min="1"
                placeholder="Ex. 50"
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-white/40"
                required
                value={form.guest_count}
                onChange={(e) => setForm({ ...form, guest_count: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-white/80 text-sm font-medium mb-1">Budget indicatif</label>
              <input
                type="text"
                placeholder="Ex. 500 USD"
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-white/40"
                required
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-white/80 text-sm font-medium mb-1">Message</label>
              <textarea
                rows={3}
                placeholder="Décrivez votre événement..."
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-white/40"
                required
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
            </div>
            <button
              type="submit"
              disabled={sending}
              className="w-full py-3 rounded-lg font-semibold bg-[#d4af37] text-[#0b1220] hover:bg-[#e5c048] transition disabled:opacity-60"
            >
              {sending ? 'Envoi en cours...' : 'Envoyer ma demande'}
            </button>
          </form>
        </div>

        <p className="text-center text-white/50 text-sm mt-8">
          <Link href="/client" className="text-cyan-400 hover:text-cyan-300">← Retour au tableau de bord</Link>
          {' · '}
          <Link href="/client/menus" className="text-cyan-400 hover:text-cyan-300">Voir les menus</Link>
        </p>
      </div>
    </section>
  )
}
