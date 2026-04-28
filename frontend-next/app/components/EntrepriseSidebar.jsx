"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useCompany } from '@/lib/useCompany'
import { filterNavByPermissions } from '@/lib/navPermissions'
import { useUnreadNotifications } from '@/lib/useUnreadNotifications'

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
  { href: '/notifications', label: 'Notifications', icon: '🔔', permission: null, needsActiveCompany: false, badgeKey: 'notif' },
  { href: '/profile', label: 'Mon profil', icon: '👤', permission: null, needsActiveCompany: false },
]

export default function EntrepriseSidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const { company, loading } = useCompany()
  const subscriptionUnlocked = !loading && company?.status === 'active'
  const { unreadCount: unreadNotif } = useUnreadNotifications({
    enabled: !!user,
    userId: user?.id,
    intervalMs: 30000,
  })

  const afterPerm = filterNavByPermissions(baseItems, user, { requireRole: 'entreprise' })
  const menuItems = afterPerm.filter((item) => !item.needsActiveCompany || subscriptionUnlocked)

  return (
    <aside className="sidebar">
      <nav>
        <ul>
          {menuItems.map((item) => {
            const badge = item.badgeKey === 'notif' && unreadNotif > 0 ? unreadNotif : null
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={
                    pathname === item.href || (item.href !== '/entreprise' && pathname.startsWith(item.href)) ? 'active' : ''
                  }
                >
                  <span style={{ marginRight: '8px' }}>{item.icon}</span>
                  {item.label}
                  {badge != null && (
                    <span
                      style={{
                        marginLeft: 6,
                        background: 'rgba(212, 175, 55, 0.3)',
                        color: '#f5e08a',
                        borderRadius: 999,
                        padding: '2px 8px',
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {badge}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
