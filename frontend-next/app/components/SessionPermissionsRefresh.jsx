'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Recharge le profil (`user.permissions`) à l’entrée d’une zone protégée par rôle,
 * pour refléter les changements faits par l’admin sans déconnexion.
 */
export default function SessionPermissionsRefresh() {
  const { refreshUser } = useAuth()

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  return null
}
