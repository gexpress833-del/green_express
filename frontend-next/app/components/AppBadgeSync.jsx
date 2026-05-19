'use client'

import { useEffect } from 'react'
import { useUnreadNotifications } from '@/contexts/UnreadNotificationsContext'
import { syncAppIconBadge } from '@/lib/appBadge'

/** Synchronise le badge icône PWA avec le compteur de notifications non lues. */
export default function AppBadgeSync() {
  const { unreadCount } = useUnreadNotifications()

  useEffect(() => {
    syncAppIconBadge(unreadCount)
  }, [unreadCount])

  return null
}
