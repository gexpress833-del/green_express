"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { filterNavByPermissions } from '@/lib/navPermissions'

const menuItemsDef = [
  { href: '/verificateur', label: 'Tableau de bord', icon: '📊', always: true },
  { href: '/verificateur/validate', label: 'Valider un ticket', icon: '🎫', permission: 'promotions.validate-ticket' },
  {
    href: '/verificateur/history',
    label: 'Historique validations',
    icon: '📋',
    anyOf: ['promotions.validate-ticket', 'stats.verificateur.view'],
  },
  { href: '/profile', label: 'Mon profil', icon: '👤', permission: null },
]

export default function VerificateurSidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const menuItems = filterNavByPermissions(menuItemsDef, user, { requireRole: 'verificateur' })

  return (
    <aside className="sidebar">
      <nav>
        <ul>
          {menuItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/verificateur' && pathname.startsWith(item.href))
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
