"use client"
import { useEffect, useState } from 'react'
import { apiRequest } from '@/lib/api'
import MenuCard from './MenuCard'
import Link from 'next/link'

export default function MenusListView({ variant = 'cuisinier' }) {
  const [menus, setMenus] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadMenus()
  }, [])

  const loadMenus = async () => {
    try {
      setLoading(true)
      const endpoint = variant === 'cuisinier' ? '/api/my-menus' : '/api/menus'
      const response = await apiRequest(endpoint, { method: 'GET' })
      setMenus(Array.isArray(response) ? response : (response.data || []))
      setError('')
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement des plats')
      setMenus([])
    } finally {
      setLoading(false)
    }
  }

  const handleMenuSelect = (menu) => {
    // À personnaliser selon le besoin (afficher détails, commander, etc.)
    console.log('Menu sélectionné:', menu)
  }

  return (
    <section className="w-full">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">
          {variant === 'cuisinier' ? '🍽️ Mes plats' : '🍜 Nos menus'}
        </h2>
        <p className="text-slate-400 text-sm sm:text-base">
          {variant === 'cuisinier' 
            ? 'Gérez vos plats proposés au menu'
            : 'Découvrez notre sélection de plats délicieux'
          }
        </p>
      </div>

      {/* Create Button for Cuisinier */}
      {variant === 'cuisinier' && (
        <div className="mb-8">
          <Link href="/cuisinier/menu/create" className="btn-primary">+ Créer un plat</Link>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/20 border border-red-400 rounded-xl text-red-200 mb-8 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="menus-grid">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div 
              key={i}
              className="h-56 bg-slate-700/50 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : menus.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="text-6xl mb-4">😕</div>
          <h3 className="text-xl font-bold text-white mb-2">Aucun plat disponible</h3>
          <p className="text-slate-400 text-center max-w-md text-sm">
            {variant === 'cuisinier' 
              ? 'Vous n\'avez pas encore créé de plat. Commencez maintenant !'
              : 'Revenez bientôt pour découvrir nos nouveaux plats.'
            }
          </p>
          {variant === 'cuisinier' && (
            <Link href="/cuisinier/menu/create" className="mt-6 inline-block px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl transition-all duration-200 text-center">
              Créer un plat
            </Link>
          )}
        </div>
      ) : (
        /* Grid of Cards */
        <div className="menus-grid">
          {menus.map(menu => (
            <MenuCard
              key={menu.id}
              menu={menu}
              variant={variant}
              onSelect={handleMenuSelect}
              onDelete={async (id) => {
                if (!confirm('Confirmer la suppression de ce plat ?')) return;
                try {
                  await apiRequest(`/api/menus/${id}`, { method: 'DELETE' });
                  // reload
                  loadMenus();
                } catch (err) {
                  alert(err.message || 'Erreur suppression');
                }
              }}
            />
          ))}
        </div>
      )}

      {/* Info Message for Cuisinier */}
      {variant === 'cuisinier' && menus.length > 0 && (
        <div className="mt-10 p-5 bg-cyan-500/15 border border-cyan-500/30 rounded-xl text-cyan-200 text-sm">
          <p className="font-semibold mb-2">💡 Conseils de gestion :</p>
          <ul className="space-y-1 text-xs sm:text-sm">
            <li>• Mettez à jour les images de vos plats régulièrement</li>
            <li>• Une bonne description augmente les commandes</li>
            <li>• Marquez les plats comme indisponibles si vous n'en avez plus</li>
          </ul>
        </div>
      )}
    </section>
  )
}
