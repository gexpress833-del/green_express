"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCompany } from '@/lib/useCompany'

export default function EntrepriseSidebar() {
  const pathname = usePathname()
  const { company, loading } = useCompany()
  const subscriptionUnlocked = !loading && company?.status === 'active'

  const menuItems = [
    { href: '/entreprise', label: 'Tableau de bord', icon: '📊', needsActiveCompany: false },
    { href: '/entreprise/subscriptions', label: 'Abonnements', icon: '💳', needsActiveCompany: true },
    { href: '/entreprise/budget', label: 'Budget', icon: '💰', needsActiveCompany: false },
    { href: '/entreprise/orders', label: 'Commandes', icon: '🛒', needsActiveCompany: false },
    { href: '/entreprise/employees', label: 'Employés', icon: '👥', needsActiveCompany: false },
    { href: '/entreprise/reports', label: 'Rapports', icon: '📈', needsActiveCompany: false },
    { href: '/profile', label: 'Mon profil', icon: '👤', needsActiveCompany: false },
  ].filter((item) => !item.needsActiveCompany || subscriptionUnlocked)

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
