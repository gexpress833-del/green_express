"use client"
import ReadOnlyGuard from '@/components/ReadOnlyGuard'
import MenuCard from '@/components/MenuCard'
import ClientSubpageHeader from '@/components/ClientSubpageHeader'
import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { apiRequest } from '@/lib/api'
import { useCart } from '@/contexts/CartContext'

export default function ClientMenus() {
  const [menus, setMenus] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState('')
  const searchRef = useRef(searchTerm)
  searchRef.current = searchTerm
  const { preferredCurrency, setPreferredCurrency, clearCart } = useCart()

  const catalogueLabel = useMemo(() => {
    try {
      return new Date().toLocaleDateString('fr-CD', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    } catch {
      return ''
    }
  }, [])

  const loadMenus = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ status: 'approved' })
      const term = searchRef.current
      if (term) params.append('search', term)

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
  }, [])

  useEffect(() => {
    loadMenus()
  }, [loadMenus])

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

          <p className="client-menus-kicker">
            Catalogue du moment · {catalogueLabel}
          </p>

          <div className="card mb-5 border border-cyan-400/25 bg-cyan-500/[0.06]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-white font-semibold mb-1">Devise d’affichage et de paiement</h2>
                <p className="text-white/60 text-sm">
                  Choisissez FC ou USD. Ce choix sera utilisé pour les menus, le panier et la commande.
                </p>
              </div>
              <div className="inline-flex rounded-xl border border-white/10 bg-black/20 p-1">
                {['CDF', 'USD'].map((currency) => (
                  <button
                    key={currency}
                    type="button"
                    onClick={() => {
                      if (currency !== preferredCurrency) {
                        clearCart()
                        setPreferredCurrency(currency)
                      }
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
                      preferredCurrency === currency
                        ? 'bg-[#d4af37] text-[#0b1220]'
                        : 'text-white/75 hover:bg-white/10'
                    }`}
                  >
                    {currency === 'CDF' ? 'FC' : 'USD'}
                  </button>
                ))}
              </div>
            </div>
          </div>

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
