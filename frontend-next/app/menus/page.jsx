"use client"
import Link from 'next/link'
import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import MenuCard from '@/components/MenuCard'
import { useAuth } from '@/contexts/AuthContext'
import { apiRequest } from '@/lib/api'
import { getDashboardPathForRole } from '@/lib/permissions'

/**
 * Page publique /menus : visiteurs non-connectés.
 * - Clients connectés → redirigés vers /client/menus (expérience complète).
 * - Autres rôles connectés → redirigés vers leur espace dédié.
 * - Visiteurs → consultation libre, actions de commande redirigent vers /login.
 */
export default function PublicMenus() {
  const router = useRouter()
  const { user, initialised } = useAuth()
  const [menus, setMenus] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState('')
  const searchRef = useRef(searchTerm)
  searchRef.current = searchTerm

  // Redirection des utilisateurs connectés vers leur espace
  useEffect(() => {
    if (!initialised || !user?.role) return
    if (user.role === 'client') {
      router.replace('/client/menus')
    } else {
      router.replace(getDashboardPathForRole(user.role))
    }
  }, [initialised, user, router])

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

      const response = await apiRequest(
        `/api/menus/public/browse?${params.toString()}`,
        { method: 'GET' },
      )

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
      console.error('Erreur chargement menus publics:', err)
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

  // Ne rien afficher pendant la redirection des connectés
  if (initialised && user?.role) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-6"
        style={{ background: '#0b1220' }}
      >
        <p className="text-white/70">Ouverture de votre espace…</p>
      </div>
    )
  }

  return (
    <section className="page-section client-menus-page">
      <div className="client-menus-inner">
        {/* En-tête marketing */}
        <div
          className="text-center"
          style={{ maxWidth: 760, margin: '0 auto 28px' }}
        >
          <h1
            className="text-4xl font-bold mb-3"
            style={{
              background:
                'linear-gradient(135deg, #00ffff 0%, #9d4edd 50%, #ff00ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Nos menus du moment
          </h1>
          <p className="text-lg text-white/80">
            Découvrez librement nos plats préparés chaque jour. Pour commander,
            ajouter au panier ou souscrire à un abonnement, connectez-vous ou
            créez un compte gratuit.
          </p>

          <div
            style={{
              display: 'flex',
              gap: 10,
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginTop: 18,
            }}
          >
            <Link
              href={`/login?returnUrl=${encodeURIComponent('/client/menus')}`}
              className="inline-flex items-center justify-center"
              style={{
                minHeight: 44,
                padding: '10px 22px',
                borderRadius: 12,
                fontWeight: 700,
                fontSize: 14,
                color: '#0b1220',
                background: 'linear-gradient(135deg, #39ff14 0%, #22d3ee 100%)',
                border: '1px solid rgba(57, 255, 20, 0.5)',
              }}
            >
              Se connecter
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center"
              style={{
                minHeight: 44,
                padding: '10px 22px',
                borderRadius: 12,
                fontWeight: 700,
                fontSize: 14,
                color: '#a5f3fc',
                background: 'rgba(34, 211, 238, 0.14)',
                border: '1px solid rgba(34, 211, 238, 0.55)',
              }}
            >
              Créer un compte
            </Link>
          </div>
        </div>

        <p className="client-menus-kicker">
          Catalogue du moment · {catalogueLabel}
        </p>

        <div className="client-menus-search-panel">
          <div className="client-menus-search-head">
            <h2 className="client-menus-search-title">Trouver un plat</h2>
            <p className="client-menus-search-hint">
              Saisissez un mot-clé (nom du plat, ingrédient…) puis lancez la
              recherche.
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
              <MenuCard key={menu.id} menu={menu} variant="public" />
            ))}
          </div>
        )}

        {menus.length > 0 && !loading && (
          <div className="client-menus-footer-strip">
            <p
              style={{
                margin: 0,
                color: 'rgba(255,255,255,0.75)',
                fontSize: '0.9375rem',
              }}
            >
              <strong>{menus.length}</strong> plat
              {menus.length > 1 ? 's' : ''} au menu — Bon appétit !
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
