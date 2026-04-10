"use client"
import { useAuth } from '@/contexts/AuthContext'

/**
 * Affiche "Bonjour, [Nom complet]" puis le contenu du header (titre + sous-titre).
 * Usage: <DashboardGreeting><h1 style={{...}}>Titre</h1><p>Sous-titre</p></DashboardGreeting>
 */
export default function DashboardGreeting({ children, className, nameHighlightClassName, compact }) {
  const { user } = useAuth()
  const displayName = user?.name || 'Utilisateur'
  const marginClass = compact ? 'mb-4 sm:mb-5' : 'mb-8'

  return (
    <header className={className ? `${marginClass} ${className}` : marginClass}>
      <p className="text-white/90 text-lg mb-1">
        Bonjour,{' '}
        <span className={nameHighlightClassName ? `font-semibold ${nameHighlightClassName}` : 'font-semibold text-[#d4af37]'}>
          {displayName}
        </span>
      </p>
      {children}
    </header>
  )
}
