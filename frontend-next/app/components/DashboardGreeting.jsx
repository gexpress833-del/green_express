"use client"
import { useAuth } from '@/contexts/AuthContext'

/**
 * Affiche "Bonjour, [Nom complet]" puis le contenu du header (titre + sous-titre).
 * Usage: <DashboardGreeting><h1 style={{...}}>Titre</h1><p>Sous-titre</p></DashboardGreeting>
 */
export default function DashboardGreeting({ children }) {
  const { user } = useAuth()
  const displayName = user?.name || 'Utilisateur'

  return (
    <header className="mb-8">
      <p className="text-white/90 text-lg mb-1">
        Bonjour, <span className="font-semibold text-[#d4af37]">{displayName}</span>
      </p>
      {children}
    </header>
  )
}
