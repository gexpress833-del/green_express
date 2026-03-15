"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCart } from '@/contexts/CartContext'

export default function ClientSidebar(){
  const pathname = usePathname()
  const { itemCount } = useCart()
  
  const menuItems = [
    { href: '/client', label: 'Tableau de bord', icon: '📊' },
    { href: '/client/menus', label: 'Menus', icon: '🍽️' },
    { href: '/client/cart', label: 'Panier', icon: '🛒', badge: itemCount },
    { href: '/client/orders', label: 'Mes commandes', icon: '📦' },
    { href: '/client/promotions', label: 'Promotions', icon: '🎁' },
    { href: '/client/subscriptions', label: 'Abonnements', icon: '💳' },
    { href: '/evenements', label: 'Service événementiel', icon: '🎉' },
    { href: '/client/event-requests', label: 'Mes demandes événements', icon: '📋' },
    { href: '/client/invoices', label: 'Factures', icon: '📄' },
    { href: '/profile', label: 'Mon profil', icon: '👤' },
  ]

  return (
    <aside className="sidebar">
      <nav>
        <ul>
          {menuItems.map(item => (
            <li key={item.href}>
              <Link 
                href={item.href}
                className={pathname === item.href ? 'active' : ''}
              >
                <span style={{ marginRight: '8px' }}>{item.icon}</span>
                {item.label}
                {item.badge != null && item.badge > 0 && (
                  <span style={{ marginLeft: 6, background: 'rgba(212, 175, 55, 0.3)', color: '#f5e08a', borderRadius: 999, padding: '2px 8px', fontSize: 12, fontWeight: 700 }}>{item.badge}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
