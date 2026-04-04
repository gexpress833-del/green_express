"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { filterNavByPermissions } from '@/lib/navPermissions'

const menuItemsDef = [
  { href: '/livreur', label: 'Tableau de bord', icon: '📊', always: true },
  {
    href: '/livreur/assignments',
    label: 'Mes missions',
    icon: '📦',
    anyOf: ['orders.list-assignments', 'orders.view-assignments'],
  },
  { href: '/livreur/performance', label: 'Ma performance', icon: '⭐', permission: 'stats.livreur.view' },
  { href: '/profile', label: 'Mon profil', icon: '👤', permission: null },
]

export default function LivreurSidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const menuItems = filterNavByPermissions(menuItemsDef, user, { requireRole: 'livreur' })

  return (
    <aside className="sidebar">
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
  )
}
