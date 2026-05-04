"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { filterNavByPermissions } from '@/lib/navPermissions'
import { useUnreadNotifications } from '@/lib/useUnreadNotifications'

const menuItemsDef = [
  { href: '/client', label: 'Accueil repas', icon: '📊', always: true },
  {
    href: '/client/menus',
    label: 'Menus',
    icon: '🍽️',
    anyOf: ['menus.list-approved', 'menus.view-approved'],
  },
  { href: '/client/cart', label: 'Panier', icon: '🛒', permission: 'orders.create' },
  { href: '/client/orders', label: 'Mes commandes', icon: '�', anyOf: ['orders.view-own', 'orders.list-own'] },
  { href: '/notifications', label: 'Notifications', icon: '�', permission: null, badgeKey: 'notif' },
  {
    href: '/client/subscriptions',
    label: 'Abonnements',
    icon: '💳',
    anyOf: ['subscriptions.view-own', 'subscriptions.create'],
  },
  { href: '/client/promotions', label: 'Promotions', icon: '🎁', anyOf: ['promotions.view', 'promotions.list'] },
  { href: '/client/invoices', label: 'Factures', icon: '📄', anyOf: ['orders.view-own', 'orders.list-own'] },
  {
    href: '/evenements',
    label: 'Service événementiel',
    icon: '🎉',
    anyOf: ['stats.client.view', 'menus.list-approved'],
  },
  {
    href: '/client/event-requests',
    label: 'Mes demandes événements',
    icon: '📋',
    anyOf: ['stats.client.view', 'orders.create'],
  },
  { href: '/profile', label: 'Mon profil', icon: '👤', permission: null },
]

export default function ClientSidebar() {
  const pathname = usePathname()
  const { itemCount } = useCart()
  const { user } = useAuth()
  const { unreadCount: unreadNotif } = useUnreadNotifications()

  const menuItems = filterNavByPermissions(menuItemsDef, user, { requireRole: 'client' })

  return (
    <aside className="sidebar" aria-label="Espace client">
      <nav aria-label="Menu principal">
        <ul>
          {menuItems.map((item) => {
            const badge =
              item.href === '/client/cart' && itemCount > 0
                ? itemCount
                : item.badgeKey === 'notif' && unreadNotif > 0
                  ? unreadNotif
                  : null
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={pathname === item.href ? 'active' : ''}
                  aria-current={pathname === item.href ? 'page' : undefined}
                >
                  <span style={{ marginRight: '8px' }}>{item.icon}</span>
                  {item.label}
                  {badge != null && (
                    <span
                      key={badge}
                      className="cart-badge-bump"
                      style={{
                        marginLeft: 6,
                        background: 'rgba(212, 175, 55, 0.3)',
                        color: '#f5e08a',
                        borderRadius: 999,
                        padding: '2px 8px',
                        fontSize: 12,
                        fontWeight: 700,
                        display: 'inline-block',
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
