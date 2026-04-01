"use client"
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from '@/lib/notifications'
import { PRIMARY_LOGO, nextLogoSrc } from '@/lib/landingMedia'

const badgeStyle = {
  position: 'absolute',
  top: -6,
  right: -10,
  minWidth: 18,
  height: 18,
  padding: '0 5px',
  borderRadius: 999,
  fontSize: 11,
  lineHeight: '18px',
  color: 'white',
  fontWeight: 800,
  textAlign: 'center',
}

export default function Navbar(){
  const { user, loading, initialised, logout } = useAuth()
  const { itemCount: cartCount } = useCart()
  const [menuOpen, setMenuOpen] = useState(false)
  const [brandLogoSrc, setBrandLogoSrc] = useState(PRIMARY_LOGO)
  const [unreadCount, setUnreadCount] = useState(0)
  const router = useRouter()
  const pathname = usePathname()
  const isClient = user?.role === 'client'
  /** Sur les sous-pages client, le libellé « Tableau de bord » fait doublon avec le lien retour de page : on affiche « Accueil ». */
  const clientHubLabel =
    isClient && pathname !== '/client' && pathname?.startsWith('/client')
      ? 'Accueil'
      : null

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (menuOpen) document.body.classList.add('nav-open')
    else document.body.classList.remove('nav-open')
    return () => document.body.classList.remove('nav-open')
  }, [menuOpen])

  // Poll notifications uniquement quand l'utilisateur est connecté, auth initialisée, et pas sur login/register (évite 401 juste après connexion)
  useEffect(() => {
    if (!initialised || !user || pathname === '/login' || pathname === '/register') return
    let cancelled = false
    let intervalId

    async function load() {
      try {
        const data = await fetchNotifications(15)
        if (cancelled) return
        setUnreadCount(Number(data?.unread_count || 0))
      } catch {
        if (!cancelled) setUnreadCount(0)
      }
    }

    load()
    intervalId = setInterval(load, 15000)
    return () => {
      cancelled = true
      if (intervalId) clearInterval(intervalId)
    }
  }, [initialised, user, pathname])

  async function handleLogout(e){
    e.preventDefault()
    await logout()
    router.push('/')
    router.refresh()
  }

  // Ne pas afficher la navbar sur les pages de login/register
  if (pathname === '/login' || pathname === '/register') {
    return null
  }

  return (
    <nav className="navbar">
      <div className="nav-inner">
        <Link href="/" className="brand">
          <img
            key={brandLogoSrc}
            src={brandLogoSrc}
            alt="Green Express"
            width={42}
            height={42}
            decoding="async"
            className="logo-img"
            onError={() => setBrandLogoSrc((s) => nextLogoSrc(s))}
          />
          <span className="brand-text">Green Express</span>
        </Link>

        <button
          type="button"
          className="nav-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={menuOpen}
        >
          <span className="nav-toggle-bar" />
          <span className="nav-toggle-bar" />
          <span className="nav-toggle-bar" />
        </button>

        <div className="nav-links">
          {loading ? (
            // Afficher les boutons même pendant le chargement
            <>
              <Link href="/login">Se connecter</Link>
              <Link href="/register">S'inscrire</Link>
            </>
          ) : user ? (
            <>
              <Link
                href={`/${user.role || 'client'}`}
                className={
                  pathname === `/${user.role || 'client'}` ||
                  (isClient && pathname?.startsWith('/client'))
                    ? 'active'
                    : ''
                }
              >
                {user.role === 'livreur' || user.role === 'admin' || user.role === 'cuisinier' || user.role === 'verificateur' || user.role === 'entreprise'
                  ? 'Accueil'
                  : clientHubLabel || 'Tableau de bord'}
              </Link>
              {isClient && (
                <Link
                  href="/client/cart"
                  className={`${pathname === '/client/cart' ? 'active' : ''} ${cartCount > 0 ? 'nav-link-has-badge' : ''}`.trim()}
                  style={{ position: 'relative' }}
                >
                  🛒 Panier
                  {cartCount > 0 && (
                    <span style={{ ...badgeStyle, background: 'rgba(212, 175, 55, 0.95)' }}>
                      {cartCount}
                    </span>
                  )}
                </Link>
              )}
              <Link href="/profile" className={pathname === '/profile' ? 'active' : ''}>
                Mon profil
              </Link>

              <Link
                href="/notifications"
                className={`${pathname === '/notifications' ? 'active' : ''} ${unreadCount > 0 ? 'nav-link-has-badge' : ''}`.trim()}
                style={{ position: 'relative' }}
              >
                Notifications
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: -6,
                      right: -10,
                      minWidth: 18,
                      height: 18,
                      padding: '0 5px',
                      borderRadius: 999,
                      fontSize: 11,
                      lineHeight: '18px',
                      background: 'rgba(255, 20, 147, 0.95)',
                      color: 'white',
                      fontWeight: 800,
                      textAlign: 'center',
                    }}
                  >
                    {unreadCount}
                  </span>
                )}
              </Link>

              <button onClick={handleLogout} className="nav-link-button">
                Se déconnecter
              </button>
            </>
          ) : (
            <>
              <Link href="/login">Se connecter</Link>
              <Link href="/register">S'inscrire</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
