'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { SECRETAIRE_NAV_CONFIG, filterSecretaireNavItems } from '@/lib/secretaireNav'

function IconLayout({ className }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="11" width="7" height="10" rx="1.5" />
      <rect x="3" y="15" width="7" height="6" rx="1.5" />
    </svg>
  )
}

function IconPackage({ className }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" />
    </svg>
  )
}

function IconTruck({ className }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M14 18V8a2 2 0 0 0-2-2H3.5A1.5 1.5 0 0 0 2 7.5V18" />
      <path d="M14 8h2.5l3.5 4.5V18h2" />
      <circle cx="6.5" cy="18.5" r="2" />
      <circle cx="17.5" cy="18.5" r="2" />
    </svg>
  )
}

const ICON_BY_HREF = {
  '/secretaire': IconLayout,
  '/secretaire/orders': IconPackage,
  '/secretaire/flux': IconTruck,
}

/**
 * Menu latéral secrétariat (icônes SVG cohérentes). Le profil reste dans la barre du haut.
 * Les entrées suivent les permissions Spatie (voir SECRETAIRE_NAV_CONFIG).
 */
export default function SecretaireSidebar() {
  const pathname = usePathname() || ''
  const { user } = useAuth()
  const navItems = filterSecretaireNavItems(SECRETAIRE_NAV_CONFIG, user)

  return (
    <aside
      className="w-full shrink-0 rounded-2xl border border-cyan-400/15 bg-[rgba(11,18,32,0.85)] p-3 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-md lg:sticky lg:top-24 lg:max-w-[280px] lg:self-start"
      aria-label="Navigation secrétariat"
    >
      <p className="mb-3 px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Menu</p>
      <nav aria-label="Sections secrétariat">
        {navItems.length === 0 ? (
          <p className="px-2 text-sm text-white/50">
            Aucun accès menu pour ce profil. Demandez à un administrateur d’attribuer les permissions au rôle secrétariat.
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => {
              const { href, label } = item
              const Icon = ICON_BY_HREF[href] || IconLayout
              const active = typeof item.isActive === 'function' ? item.isActive(pathname) : false
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={[
                      'group flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                      active
                        ? 'border border-cyan-400/35 bg-cyan-500/15 text-cyan-200 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.2)]'
                        : 'border border-transparent text-white/80 hover:border-white/10 hover:bg-white/5 hover:text-white',
                    ].join(' ')}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon
                      className={[
                        'shrink-0 opacity-90',
                        active ? 'text-cyan-300' : 'text-white/50 group-hover:text-cyan-200/80',
                      ].join(' ')}
                    />
                    <span>{label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </nav>
    </aside>
  )
}
