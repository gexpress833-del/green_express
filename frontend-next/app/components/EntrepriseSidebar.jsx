"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useCompany } from '@/lib/useCompany'
import { filterNavByPermissions } from '@/lib/navPermissions'

const baseItems = [
  { href: '/entreprise', label: 'Tableau de bord', icon: '📊', always: true, needsActiveCompany: false },
  {
    href: '/entreprise/subscriptions',
    label: 'Abonnements',
    icon: '💳',
    permission: 'subscriptions.view-own',
    needsActiveCompany: true,
  },
  { href: '/entreprise/budget', label: 'Budget', icon: '💰', permission: 'entreprise.b2b.access', needsActiveCompany: false },
  {
    href: '/entreprise/orders',
    label: 'Commandes',
    icon: '🛒',
    anyOf: ['orders.view-own', 'orders.list-own'],
    needsActiveCompany: false,
  },
  {
    href: '/entreprise/employees',
    label: 'Employés',
    icon: '👥',
    permission: 'company.employees.manage',
    needsActiveCompany: false,
  },
  {
    href: '/entreprise/reports',
    label: 'Rapports',
    icon: '📈',
    anyOf: ['stats.entreprise.view', 'entreprise.b2b.access'],
    needsActiveCompany: false,
  },
  { href: '/profile', label: 'Mon profil', icon: '👤', permission: null, needsActiveCompany: false },
]

export default function EntrepriseSidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const { company, loading } = useCompany()
  const subscriptionUnlocked = !loading && company?.status === 'active'

  const afterPerm = filterNavByPermissions(baseItems, user, { requireRole: 'entreprise' })
  const menuItems = afterPerm.filter((item) => !item.needsActiveCompany || subscriptionUnlocked)

  return (
    <aside className="sidebar">
      <nav>
        <ul>
          {menuItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={
                  pathname === item.href || (item.href !== '/entreprise' && pathname.startsWith(item.href)) ? 'active' : ''
                }
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
