"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function VerificateurSidebar() {
  const pathname = usePathname()
  const menuItems = [
    { href: '/verificateur', label: 'Tableau de bord', icon: '📊' },
    { href: '/verificateur/validate', label: 'Valider un ticket', icon: '🎫' },
    { href: '/verificateur/history', label: 'Historique validations', icon: '📋' },
    { href: '/profile', label: 'Mon profil', icon: '👤' },
  ]
  return (
    <aside className="sidebar">
      <nav>
        <ul>
          {menuItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/verificateur' && pathname.startsWith(item.href))
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
