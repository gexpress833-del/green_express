"use client"
import ReadOnlyGuard from '@/components/ReadOnlyGuard'
import MenuCard from '@/components/MenuCard'
import ClientSubpageHeader from '@/components/ClientSubpageHeader'
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
        method: 'GET',
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
      <section className="page-section client-menus-page">
        <div className="client-menus-inner">
          <ClientSubpageHeader
            title="Menus disponibles"
            subtitle="Découvrez nos plats préparés avec soin — ajoutez au panier ou commandez en un clic."
            icon="🍜"
          />

          <p className="client-menus-kicker">Catalogue en direct</p>

          <div className="client-menus-search-panel">
            <div className="client-menus-search-head">
              <h2 className="client-menus-search-title">Trouver un plat</h2>
              <p className="client-menus-search-hint">
                Saisissez un mot-clé (nom du plat, ingrédient…) puis lancez la recherche.
              </p>
            </div>
            <form className="client-menus-form" onSubmit={handleSearch}>
              <div className="client-menus-input-wrap">
                <input
                  type="search"
                  className="client-menus-input"
                  placeholder="Ex. poulet, frites, dessert…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoComplete="off"
                  aria-label="Rechercher un plat"
                />
              </div>
              <button type="submit" className="client-menus-btn-submit">
                Rechercher
              </button>
            </form>
          </div>

          {error && (
            <div
              className="card"
              style={{
                marginBottom: 24,
                borderColor: 'rgba(248, 113, 113, 0.45)',
                background: 'rgba(127, 29, 29, 0.25)',
                color: '#fecaca',
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {loading ? (
            <div className="client-menus-grid">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="client-menus-skeleton" aria-hidden />
              ))}
            </div>
          ) : menus.length === 0 ? (
            <div className="client-menus-empty">
              <div className="client-menus-empty-emoji" aria-hidden>
                🍽️
              </div>
              <h3 className="client-menus-empty-title">Aucun plat disponible</h3>
              <p className="client-menus-empty-text">
                {searchTerm
                  ? `Aucun résultat pour « ${searchTerm} ». Essayez un autre mot-clé ou parcourez tout le catalogue.`
                  : 'Revenez bientôt pour découvrir nos nouveautés.'}
              </p>
            </div>
          ) : (
            <div className="client-menus-grid">
              {menus.map((menu) => (
                <MenuCard key={menu.id} menu={menu} variant="client" />
              ))}
            </div>
          )}

          {menus.length > 0 && !loading && (
            <div className="client-menus-footer-strip">
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.75)', fontSize: '0.9375rem' }}>
                <strong>{menus.length}</strong> plat{menus.length > 1 ? 's' : ''} au menu — Bon appétit !
              </p>
            </div>
          )}
        </div>
      </section>
    </ReadOnlyGuard>
  )
}
