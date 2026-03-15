"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function EntrepriseSidebar() {
  const pathname = usePathname()
  const menuItems = [
    { href: '/entreprise', label: 'Tableau de bord', icon: '📊' },
    { href: '/entreprise/employees', label: 'Employés', icon: '👥' },
    { href: '/entreprise/orders', label: 'Commandes', icon: '🛒' },
    { href: '/entreprise/subscriptions', label: 'Abonnements', icon: '💳' },
    { href: '/entreprise/budget', label: 'Budget', icon: '💰' },
    { href: '/entreprise/reports', label: 'Rapports', icon: '📈' },
    { href: '/profile', label: 'Mon profil', icon: '👤' },
  ]
  return (
    <aside className="sidebar">
      <nav>
        <ul>
          {menuItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={pathname === item.href || (item.href !== '/entreprise' && pathname.startsWith(item.href)) ? 'active' : ''}
              >
                <span style={{ marginRight: '8px' }}>{item.icon}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
