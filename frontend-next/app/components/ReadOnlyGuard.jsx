"use client"
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Composant de protection pour limiter les clients en lecture seule.
 * Utilise la session (useAuth), pas de token.
 */
export default function ReadOnlyGuard({
  children,
  allowedActions = [],
  showWarning = true
}) {
  const { user } = useAuth()
  const userRole = user?.role ?? null
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (userRole === 'client' && pathname?.startsWith('/admin')) {
      router.push('/client')
    }
  }, [userRole, pathname, router])

  // If userRole is null (not authenticated) treat as guest: optionally show warning
  if (userRole === null) {
    if (showWarning) {
      return (
        <>
          {children}
          <div style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            background: 'rgba(220, 38, 38, 0.06)',
            border: '1px solid rgba(220, 38, 38, 0.15)',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.9)',
            zIndex: 1000,
            maxWidth: '320px'
          }}>
            Vous n'êtes pas connecté. Certaines actions (ex: réclamer une promotion) nécessitent une connexion.
          </div>
        </>
      )
    }
    return children
  }

  // Pour les clients, on vérifie si l'action est autorisée
  const isActionAllowed = (action) => {
    const clientAllowedActions = [
      'view', 'read', 'browse', // Lecture seule
      'order', 'command', 'claim', 'subscribe', // Actions spécifiques autorisées
      ...allowedActions
    ]
    return clientAllowedActions.includes(action)
  }

  return (
    <>
      {children}
      {showWarning && userRole === 'client' && (
        <div style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          background: 'rgba(212, 175, 55, 0.1)',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '12px',
          color: 'rgba(255, 255, 255, 0.7)',
          zIndex: 1000,
          maxWidth: '300px'
        }}>
          Mode lecture seule - Actions limitées
        </div>
      )}
    </>
  )
}
