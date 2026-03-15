"use client"
import Link from 'next/link'
import { useState, useEffect } from 'react'
import GoldButton from '@/components/GoldButton'
import { apiRequest } from '@/lib/api'

export default function PromotionsList(){
  const [promos, setPromos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    loadPromos()
  }, [])

  async function handleDelete(promo) {
    if (!window.confirm(`Supprimer la promotion « ${promo.title || 'Sans titre' } » ? Cette action est irréversible.`)) return
    setDeletingId(promo.id)
    setError('')
    try {
      await apiRequest(`/api/promotions/${promo.id}`, { method: 'DELETE' })
      setPromos(prev => prev.filter(p => p.id !== promo.id))
    } catch (err) {
      setError(err.message || 'Erreur lors de la suppression')
    } finally {
      setDeletingId(null)
    }
  }

  async function loadPromos() {
    try {
      setLoading(true)
      const data = await apiRequest('/api/promotions?per_page=100', { method: 'GET' })
      setPromos(data.data || data || [])
    } catch (err) {
      setError(err.message || 'Erreur de chargement')
      setPromos([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="page-section bg-[#0b1220] text-white min-h-screen">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-extrabold text-[#d4af37]">Promotions</h1>
          <p className="text-white/70 mt-2">Gérez les offres et promotions actives pour vos clients.</p>
        </header>

        <div className="mb-6 flex gap-2">
          <Link href="/admin/promotions/create"><GoldButton>Créer une promotion</GoldButton></Link>
        </div>

        {error && (
          <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200 mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="p-8 text-center text-white/60">
            Chargement des promotions...
          </div>
        ) : promos.length === 0 ? (
          <div className="p-8 text-center text-white/60">
            Aucune promotion créée.
          </div>
        ) : (
          <div className="grid gap-6">
            {promos.map(promo => (
              <div key={promo.id} className="bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/10 transition">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-[#d4af37] mb-2">
                      {promo.title || promo.menu?.title || 'Promotion'}
                    </h3>
                    {(promo.description || promo.menu?.description) && (
                      <p className="text-white/70 text-sm mb-2">{promo.description || promo.menu?.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {promo.discount && (
                      <div className="text-2xl font-bold text-green-400 bg-green-900/30 px-4 py-2 rounded-lg">
                        -{promo.discount}%
                      </div>
                    )}
                    <Link
                      href={`/admin/promotions/${promo.id}/edit`}
                      className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-[#d4af37] hover:text-[#0b1220] hover:border-[#d4af37] transition text-sm font-medium"
                    >
                      Modifier
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(promo)}
                      disabled={deletingId === promo.id}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-red-900/50 border border-red-700/50 text-red-200 hover:bg-red-900/70 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deletingId === promo.id ? 'Suppression...' : 'Supprimer'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm text-white/60 mb-4 md:grid-cols-4">
                  {promo.points_required && (
                    <div>
                      <span className="text-white/40">Points requis:</span> {promo.points_required}
                    </div>
                  )}
                  {promo.quantity_limit && (
                    <div>
                      <span className="text-white/40">Quantité:</span> {promo.quantity_limit}
                    </div>
                  )}
                  {promo.start_at && (
                    <div>
                      <span className="text-white/40">Début:</span> {new Date(promo.start_at).toLocaleDateString('fr')}
                    </div>
                  )}
                  {promo.end_at && (
                    <div>
                      <span className="text-white/40">Fin:</span> {new Date(promo.end_at).toLocaleDateString('fr')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
