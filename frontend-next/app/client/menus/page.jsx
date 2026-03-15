"use client"
import ReadOnlyGuard from '@/components/ReadOnlyGuard'
import MenuCard from '@/components/MenuCard'
import { useEffect, useState } from 'react'
import { apiRequest } from '@/lib/api'

export default function ClientMenus() {
  const [menus, setMenus] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    loadMenus()
  }, [])

  const loadMenus = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ status: 'approved' })
      if (searchTerm) params.append('search', searchTerm)
      
      const response = await apiRequest(`/api/menus/browse?${params.toString()}`, { 
        method: 'GET' 
      })
      
      let menuList = []
      if (Array.isArray(response)) {
        menuList = response
      } else if (response?.data && Array.isArray(response.data)) {
        menuList = response.data
      } else if (response?.data?.data && Array.isArray(response.data.data)) {
        menuList = response.data.data
      }
      
      setMenus(menuList)
      setError('')
    } catch (err) {
      console.error('Erreur chargement menus:', err)
      setError('Erreur lors du chargement des menus')
      setMenus([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    loadMenus()
  }

  return (
    <ReadOnlyGuard allowedActions={['view', 'read', 'order']} showWarning={false}>
      <section className="page-section text-white min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-2"
                style={{
                  background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
              🍜 Menus disponibles
            </h1>
            <p className="text-slate-300 text-sm sm:text-base max-w-xl">
              Consultez nos plats du jour et passez votre commande en quelques clics.
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-8 bg-slate-900/70 rounded-2xl p-4 shadow-lg border border-slate-700/70 backdrop-blur">
            <form onSubmit={handleSearch} className="flex gap-3 flex-col sm:flex-row">
              <input
                type="text"
                placeholder="🔍 Rechercher un plat (nom, description...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-3 rounded-lg bg-slate-800 text-white placeholder-slate-400 border border-slate-600 focus:border-amber-400 focus:outline-none transition"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-black font-bold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95"
              >
                Rechercher
              </button>
            </form>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-500/20 border border-red-400 rounded-xl text-red-200 mb-8">
              ⚠️ {error}
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div 
                  key={i}
                  className="h-80 bg-slate-700/50 rounded-2xl animate-pulse"
                />
              ))}
            </div>
          ) : menus.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <div className="text-6xl mb-4">🍽️</div>
              <h3 className="text-2xl font-bold text-white mb-2">Aucun plat disponible</h3>
              <p className="text-slate-400 text-center max-w-md">
                {searchTerm 
                  ? `Aucun résultat pour "${searchTerm}". Essayez une autre recherche.`
                  : 'Revenez bientôt pour découvrir nos menus.'}
              </p>
            </div>
          ) : (
            /* Grid of Cards */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {menus.map(menu => (
                <MenuCard
                  key={menu.id}
                  menu={menu}
                  variant="client"
                />
              ))}
            </div>
          )}

          {/* Stats Footer */}
          {menus.length > 0 && !loading && (
            <div className="mt-12 p-6 bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl border border-slate-600 text-center">
              <p className="text-slate-300">
                <span className="font-bold text-amber-400 text-lg">{menus.length}</span> plat(s) disponible(s)
              </p>
            </div>
          )}
        </div>
      </section>
    </ReadOnlyGuard>
  )
}
