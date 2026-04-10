'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCart } from '@/contexts/CartContext'

export default function ProfileSidebar({ onLogout, dashboardHref = '/client' }) {
  const pathname = usePathname()
  const { itemCount } = useCart()

  const items = [
    { href: dashboardHref, label: 'Tableau de bord', icon: '📊' },
    { href: '/client/cart', label: 'Panier', icon: '🛒', badge: itemCount },
    { href: '/profile', label: 'Mon profil', icon: '👤' },
    { href: '/notifications', label: 'Notifications', icon: '🔔' },
  ]

  return (
    <aside className="profile-sidebar">
      <nav className="p-6" aria-label="Navigation compte">
        <ul className="flex flex-col gap-2">
          {items.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`profile-sidebar-link ${isActive ? 'profile-sidebar-link--active' : ''}`}
                >
                  <span className="profile-sidebar-icon" aria-hidden>{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {item.badge != null && item.badge > 0 && (
                    <span className="profile-sidebar-badge">{item.badge}</span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
        <div className="mt-6 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onLogout}
            className="profile-sidebar-link w-full justify-start text-red-300 hover:bg-red-500/10 hover:border-red-400/20 hover:text-red-200"
          >
            <span className="profile-sidebar-icon" aria-hidden>🚪</span>
            <span>Se déconnecter</span>
          </button>
        </div>
      </nav>
    </aside>
  )
}
