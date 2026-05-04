"use client"
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import { PRIMARY_LOGO, nextLogoSrc } from '@/lib/landingMedia'
import { canPerform } from '@/lib/permissions'
import { useUnreadNotifications } from '@/lib/useUnreadNotifications'

const badgeStyle = {
  position: 'absolute',
  top: -6,
  right: -10,
  minWidth: 20,
  height: 20,
  padding: '0 6px',
  borderRadius: 999,
  fontSize: 11,
  lineHeight: '20px',
  color: 'white',
  fontWeight: 800,
  textAlign: 'center',
  boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
  border: '2px solid rgba(11, 18, 32, 0.95)',
}

export default function Navbar(){
  const { user, initialised, logout } = useAuth()
  const { itemCount: cartCount } = useCart()
  const [menuOpen, setMenuOpen] = useState(false)
  const [brandLogoSrc, setBrandLogoSrc] = useState(PRIMARY_LOGO)
  const pathname = usePathname()
  const isClient = user?.role === 'client'
  const { unreadCount } = useUnreadNotifications()

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (menuOpen) document.body.classList.add('nav-open')
    else document.body.classList.remove('nav-open')
    return () => document.body.classList.remove('nav-open')
  }, [menuOpen])

  async function handleLogout(e){
    e.preventDefault()
    await logout()
  }

  // Ne pas afficher la navbar sur les pages de login/register
  if (pathname === '/login' || pathname === '/register') {
    return null
  }

  return (
    <nav className="navbar">
      <div className="nav-inner">
        <Link href="/?from=brand" className="brand" aria-label="Green Express — page d'accueil">
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
          {!initialised ? (
            <span
              className="inline-block min-h-[40px] min-w-[160px] rounded-lg bg-white/5 align-middle animate-pulse max-sm:w-full"
              aria-busy="true"
              aria-label="Chargement de la session"
            />
          ) : user ? (
            <>
              <Link
                href={`/${user.role || 'client'}`}
                className={
                  pathname === `/${user.role || 'client'}` ||
                  (isClient && pathname?.startsWith('/client')) ||
                  (user.role === 'secretaire' && pathname?.startsWith('/secretaire'))
                    ? 'active'
                    : ''
                }
              >
                Tableau de bord
              </Link>
              {isClient && canPerform('orders.create', user) && (
                <Link
                  href="/client/cart"
                  className={`${pathname === '/client/cart' ? 'active' : ''} ${cartCount > 0 ? 'nav-link-has-badge' : ''}`.trim()}
                  style={{ position: 'relative' }}
                >
                  🛒 Panier
                  {cartCount > 0 && (
                    <span
                      key={cartCount}
                      className="cart-badge-bump"
                      style={{ ...badgeStyle, background: 'rgba(212, 175, 55, 0.95)' }}
                    >
                      {cartCount}
                    </span>
                  )}
                </Link>
              )}
              <Link href="/profile" className={pathname === '/profile' ? 'active' : ''}>
                Mon profil
              </Link>

              {isClient ? (
                <Link
                  href="/client/orders"
                  className={pathname === '/client/orders' || pathname?.startsWith('/client/orders/') ? 'active' : ''}
                >
                  Commandes
                </Link>
              ) : (
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
              )}

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
