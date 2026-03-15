"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiRequest } from '@/lib/api'

export default function AdminEventTypes() {
  const router = useRouter()
  const [eventTypes, setEventTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    is_active: true,
    sort_order: 0,
  })

  const loadEventTypes = async () => {
    try {
      setLoading(true)
      // Charger sans le filtre global pour voir tous les types y compris inactifs
      const response = await apiRequest('/api/event-types?include_inactive=true')
      setEventTypes(Array.isArray(response) ? response : (response?.data || []))
      setError(null)
    } catch (err) {
      setError('Erreur lors du chargement des types d\'événements')
      console.error(err)
      setEventTypes([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEventTypes()
  }, [])

  const handleAddNew = () => {
    setEditingId(null)
    setForm({ title: '', description: '', is_active: true, sort_order: 0 })
    setShowForm(true)
  }

  const handleEdit = (eventType) => {
    setEditingId(eventType.id)
    setForm({
      title: eventType.title,
      description: eventType.description,
      is_active: eventType.is_active,
      sort_order: eventType.sort_order,
    })
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setForm({ title: '', description: '', is_active: true, sort_order: 0 })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!form.title.trim()) {
      setError('Le titre est obligatoire')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      if (editingId) {
        // Mettre à jour
        await apiRequest(`/api/event-types/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
      } else {
        // Créer
        await apiRequest('/api/event-types', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
      }
      
      await loadEventTypes()
      handleCancel()
    } catch (err) {
      setError(err.message || 'Erreur lors de la sauvegarde')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce type d\'événement ?')) return
    
    setDeleting(id)
    setError(null)

    try {
      await apiRequest(`/api/event-types/${id}`, { method: 'DELETE' })
      await loadEventTypes()
    } catch (err) {
      setError(err.message || 'Erreur lors de la suppression')
      console.error(err)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <section className="min-h-screen bg-[#0b1220] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-cyan-400 hover:text-cyan-300 text-sm">
              ← Admin
            </Link>
            <h1 className="text-3xl font-bold">Types d'événements</h1>
          </div>
          {!showForm && (
            <button
              onClick={handleAddNew}
              className="px-6 py-2 bg-[#d4af37] text-[#0b1220] rounded-lg font-semibold hover:bg-[#e5c048] transition"
            >
              + Nouveau type
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Formulaire */}
        {showForm && (
          <div className="mb-8 p-6 bg-white/5 border border-white/10 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">
              {editingId ? 'Modifier le type' : 'Créer un nouveau type'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Titre <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-cyan-400"
                  placeholder="Ex: Mariages"
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-cyan-400"
                  placeholder="Ex: Buffets et formules sur mesure pour votre réception."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Ordre d'affichage
                  </label>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                      className="w-4 h-4 rounded accent-cyan-400"
                    />
                    <span className="text-white/80 text-sm font-medium">Actif</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-[#d4af37] text-[#0b1220] rounded-lg font-semibold hover:bg-[#e5c048] transition disabled:opacity-60"
                >
                  {submitting ? 'Enregistrement...' : 'Enregistrer'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-2 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Liste */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-white/60">Chargement...</p>
          </div>
        ) : eventTypes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/60">Aucun type d'événement trouvé</p>
          </div>
        ) : (
          <div className="space-y-4">
            {eventTypes.map((eventType) => (
              <div
                key={eventType.id}
                className="p-4 bg-white/5 border border-white/10 rounded-lg flex items-start justify-between hover:bg-white/10 transition"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-cyan-400">{eventType.title}</h3>
                    <span
                      className={`px-2 py-1 text-xs rounded font-semibold ${
                        eventType.is_active
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-gray-500/20 text-gray-300'
                      }`}
                    >
                      {eventType.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                  {eventType.description && (
                    <p className="text-white/60 text-sm mb-2">{eventType.description}</p>
                  )}
                  <p className="text-white/40 text-xs">Ordre: {eventType.sort_order}</p>
                </div>
                
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(eventType)}
                    className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded hover:bg-blue-500/30 transition text-sm font-medium"
                  >
                    Éditer
                  </button>
                  <button
                    onClick={() => handleDelete(eventType.id)}
                    disabled={deleting === eventType.id}
                    className="px-4 py-2 bg-red-500/20 text-red-300 rounded hover:bg-red-500/30 transition text-sm font-medium disabled:opacity-60"
                  >
                    {deleting === eventType.id ? 'Suppression...' : 'Supprimer'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
