"use client"
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Restricts /admin/* routes to administrators only.
 * RequireAuth a déjà vérifié la connexion ; ici on vérifie le rôle.
 */
export default function AdminGuard({ children }) {
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!user) return
    const isAdmin = user.role === 'admin'
    if (pathname?.startsWith('/admin') && !isAdmin) {
      const dashboard = user.role ? `/${user.role}` : '/client'
      router.replace(dashboard)
    }
  }, [user, pathname, router])

  if (user && user.role !== 'admin' && pathname?.startsWith('/admin')) {
    return null
  }

  return children
}
