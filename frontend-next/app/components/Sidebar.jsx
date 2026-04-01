"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const adminLinks = [
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

const cuisinierLinks = [
  { href: '/cuisinier', label: 'Tableau de bord' },
  { href: '/cuisinier/menus', label: 'Menus' },
  { href: '/cuisinier/subscriptions', label: 'Abonnements & repas' },
  { href: '/cuisinier/orders', label: 'Commandes / livreurs' },
  { href: '/notifications', label: 'Notifications' },
  { href: '/profile', label: 'Mon profil' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const isCuisinier = pathname?.startsWith('/cuisinier')
  const links = isCuisinier ? cuisinierLinks : adminLinks

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
