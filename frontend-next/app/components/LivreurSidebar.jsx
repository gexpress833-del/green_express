"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function LivreurSidebar() {
  const pathname = usePathname()
  const menuItems = [
    { href: '/livreur', label: 'Tableau de bord', icon: '📊' },
    { href: '/livreur/assignments', label: 'Mes missions', icon: '📦' },
    { href: '/livreur/performance', label: 'Ma performance', icon: '⭐' },
    { href: '/profile', label: 'Mon profil', icon: '👤' },
  ]
  return (
    <aside className="sidebar">
      <nav>
        <ul>
          {menuItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/livreur' && pathname.startsWith(item.href))
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
