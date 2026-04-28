"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { filterNavByPermissions } from '@/lib/navPermissions'

const adminLinks = [
  { href: '/admin', label: 'Tableau de bord', permission: 'stats.admin.view' },
  { href: '/admin/menus', label: 'Menus', permission: 'menus.list' },
  { href: '/admin/promotions', label: 'Promotions', permission: 'promotions.list' },
  { href: '/admin/users', label: 'Utilisateurs', permission: 'users.list' },
  { href: '/admin/orders', label: 'Commandes', permission: 'orders.list' },
  { href: '/admin/companies', label: 'Entreprises', permission: 'admin.companies' },
  { href: '/admin/subscriptions', label: 'Abonnements', permission: 'admin.subscriptions' },
  { href: '/admin/company-subscriptions', label: 'Abonnements B2B', permission: 'admin.company-subscriptions' },
  { href: '/admin/subscription-plans', label: 'Plans abonnements', permission: 'admin.subscription-plans' },
  { href: '/admin/payments', label: 'Paiements', permission: 'admin.payments' },
  { href: '/admin/deliveries', label: 'Livraisons', permission: 'admin.deliveries' },
  { href: '/admin/order-tracking', label: 'Suivi commandes', permission: 'orders.list' },
  { href: '/admin/stats', label: 'Statistiques', permission: 'stats.admin.view' },
  { href: '/admin/roles', label: 'Rôles et permissions', permission: 'roles.manage_permissions' },
  { href: '/admin/reports', label: 'Rapports', permission: 'admin.reports' },
  { href: '/admin/event-requests', label: 'Demandes événements', permission: 'admin.event-requests' },
  { href: '/admin/event-types', label: 'Types d\'événements', permission: 'admin.event-types' },
  { href: '/notifications', label: 'Centre notifications', permission: null },
  { href: '/admin/notifications', label: 'Diffusion annonces', permission: 'admin.notifications.broadcast' },
  { href: '/profile', label: 'Mon profil', permission: null },
]

const cuisinierLinks = [
  { href: '/cuisinier', label: 'Tableau de bord', always: true },
  { href: '/cuisinier/menus', label: 'Menus', anyOf: ['menus.list-own', 'menus.view-own'] },
  { href: '/cuisinier/subscriptions', label: 'Abonnements & repas', permission: 'operational.subscriptions.view' },
  {
    href: '/cuisinier/orders',
    label: 'Commandes / livreurs',
    anyOf: ['orders.list-own-menus', 'orders.view-own-menus'],
  },
  { href: '/notifications', label: 'Notifications', permission: null },
  { href: '/profile', label: 'Mon profil', permission: null },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const isCuisinier = pathname?.startsWith('/cuisinier')

  const links = isCuisinier
    ? filterNavByPermissions(cuisinierLinks, user, { requireRole: 'cuisinier' })
    : filterNavByPermissions(adminLinks, user, { requireRole: 'admin' })

  return (
    <aside className="sidebar">
      <nav>
        <ul>
          {links.map(({ href, label }) => {
            const isActive = pathname === href || (href !== '/admin' && href !== '/cuisinier' && pathname.startsWith(href))
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={isActive ? 'active' : ''}
                >
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
