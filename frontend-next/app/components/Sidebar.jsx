"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Sidebar() {
  const pathname = usePathname()
  const links = [
    { href: '/admin', label: 'Tableau de bord' },
    { href: '/admin/menus', label: 'Menus' },
    { href: '/admin/promotions', label: 'Promotions' },
    { href: '/admin/users', label: 'Utilisateurs' },
    { href: '/admin/orders', label: 'Commandes' },
    { href: '/admin/companies', label: 'Entreprises' },
    { href: '/admin/subscriptions', label: 'Abonnements' },
    { href: '/admin/company-subscriptions', label: 'Abonnements B2B' },
    { href: '/admin/subscription-plans', label: 'Plans abonnements' },
    { href: '/admin/payments', label: 'Paiements' },
    { href: '/admin/deliveries', label: 'Livraisons' },
    { href: '/admin/order-tracking', label: 'Suivi commandes' },
    { href: '/admin/stats', label: 'Statistiques' },
    { href: '/admin/roles', label: 'Rôles et permissions' },
    { href: '/admin/reports', label: 'Rapports' },
    { href: '/admin/event-requests', label: 'Demandes événements' },
    { href: '/admin/event-types', label: 'Types d\'événements' },
    { href: '/admin/notifications', label: 'Notifications' },
    { href: '/profile', label: 'Mon profil' },
  ]
  return (
    <aside className="sidebar">
      <nav>
        <ul>
          {links.map(({ href, label }) => {
            const isActive = pathname === href || (href !== '/admin' && pathname.startsWith(href))
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
