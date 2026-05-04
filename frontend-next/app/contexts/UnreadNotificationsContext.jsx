'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { fetchNotifications } from '@/lib/notifications'
import { ensureEchoClient, getEchoClient } from '@/lib/echoBootstrap'

/** Un seul intervalle pour toute l’app : évite N× GET /api/notifications (Navbar + sidebars + pages). */
const POLL_INTERVAL_MS = 30000

const UnreadNotificationsContext = createContext(null)

function asUnreadCount(data) {
  return Number(data?.unread_count || 0)
}

function setupEchoRefresh({ enabled, userId, onRefresh }) {
  if (!enabled || !userId || typeof window === 'undefined') {
    return () => {}
  }

  if (process.env.NEXT_PUBLIC_NOTIFICATIONS_WS_ENABLED !== 'true') {
    return () => {}
  }

  const channelTemplate =
    process.env.NEXT_PUBLIC_NOTIFICATIONS_WS_CHANNEL || 'App.Models.User.{userId}'
  const channelName = channelTemplate.replace('{userId}', String(userId))
  const eventName =
    process.env.NEXT_PUBLIC_NOTIFICATIONS_WS_EVENT ||
    '.Illuminate\\Notifications\\Events\\BroadcastNotificationCreated'

  let disposed = false
  let channel = null

  ensureEchoClient()
    .then(() => {
      if (disposed) return
      const echo = getEchoClient()
      if (!echo || typeof echo.private !== 'function') {
        return
      }

      channel = echo.private(channelName)
      channel.listen(eventName, onRefresh)
    })
    .catch(() => {})

  return () => {
    disposed = true
    const echo = getEchoClient()
    if (channel && typeof channel.stopListening === 'function') {
      channel.stopListening(eventName)
    }
    if (echo && typeof echo.leave === 'function') {
      echo.leave(`private-${channelName}`)
    }
  }
}

export function UnreadNotificationsProvider({ children }) {
  const { user, initialised } = useAuth()
  const pathname = usePathname()
  const [unreadCount, setUnreadCount] = useState(0)

  const enabled = useMemo(
    () =>
      initialised &&
      !!user &&
      pathname !== '/login' &&
      pathname !== '/register',
    [initialised, user, pathname]
  )

  const refreshUnreadCount = useCallback(async () => {
    if (!enabled) {
      setUnreadCount(0)
      return
    }
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      return
    }
    try {
      const data = await fetchNotifications(1)
      setUnreadCount(asUnreadCount(data))
    } catch {
      setUnreadCount(0)
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) {
      setUnreadCount(0)
      return undefined
    }

    let cancelled = false
    let intervalId

    const refresh = async () => {
      if (cancelled) return
      await refreshUnreadCount()
    }

    refresh()
    intervalId = setInterval(refresh, POLL_INTERVAL_MS)

    const onVisibility = () => {
      if (!cancelled && document.visibilityState === 'visible') {
        refresh()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    const cleanupEcho = setupEchoRefresh({
      enabled,
      userId: user?.id,
      onRefresh: refresh,
    })

    return () => {
      cancelled = true
      if (intervalId) clearInterval(intervalId)
      document.removeEventListener('visibilitychange', onVisibility)
      cleanupEcho()
    }
  }, [enabled, refreshUnreadCount, user?.id])

  const value = useMemo(
    () => ({
      unreadCount,
      refreshUnreadCount,
    }),
    [unreadCount, refreshUnreadCount]
  )

  return (
    <UnreadNotificationsContext.Provider value={value}>
      {children}
    </UnreadNotificationsContext.Provider>
  )
}

export function useUnreadNotifications() {
  const ctx = useContext(UnreadNotificationsContext)
  if (!ctx) {
    return {
      unreadCount: 0,
      refreshUnreadCount: async () => {},
    }
  }
  return ctx
}
