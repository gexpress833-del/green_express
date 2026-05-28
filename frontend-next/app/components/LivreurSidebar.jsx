"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { filterNavByPermissions } from '@/lib/navPermissions'

const menuItemsDef = [
  { href: '/livreur', label: 'Accueil', icon: '📊', always: true },
  {
    href: '/livreur/assignments',
    label: 'Missions',
    icon: '📦',
    anyOf: ['orders.list-assignments', 'orders.view-assignments'],
  },
  { href: '/livreur/performance', label: 'Stats', icon: '⭐', permission: 'stats.livreur.view' },
  { href: '/profile', label: 'Profil', icon: '👤', permission: null },
]

export default function LivreurSidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const menuItems = filterNavByPermissions(menuItemsDef, user, { requireRole: 'livreur' })

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sidebar livreur-desktop-sidebar">
        <nav>
          <ul>
            {menuItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/livreur' && pathname.startsWith(item.href))
              return (
                <li key={item.href}>
                  <Link href={item.href} className={isActive ? 'active' : ''}>
                    <span style={{ marginRight: '8px' }}>{item.icon}</span>
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="livreur-bottom-nav">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/livreur' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`livreur-bottom-nav-item${isActive ? ' active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="livreur-bottom-nav-icon">{item.icon}</span>
              <span className="livreur-bottom-nav-label">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
