"use client"

import { useCallback, useEffect, useState } from 'react'
import { fetchNotifications } from '@/lib/notifications'
import { ensureEchoClient, getEchoClient } from '@/lib/echoBootstrap'

const DEFAULT_POLL_INTERVAL_MS = 5000

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

  const channelTemplate = process.env.NEXT_PUBLIC_NOTIFICATIONS_WS_CHANNEL || 'App.Models.User.{userId}'
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

export function useUnreadNotifications({ enabled, userId, intervalMs = DEFAULT_POLL_INTERVAL_MS } = {}) {
  const [unreadCount, setUnreadCount] = useState(0)

  const refreshUnreadCount = useCallback(async () => {
    if (!enabled) {
      setUnreadCount(0)
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
    intervalId = setInterval(refresh, intervalMs)

    const cleanupEcho = setupEchoRefresh({
      enabled,
      userId,
      onRefresh: refresh,
    })

    return () => {
      cancelled = true
      if (intervalId) clearInterval(intervalId)
      cleanupEcho()
    }
  }, [enabled, intervalMs, refreshUnreadCount, userId])

  return {
    unreadCount,
    refreshUnreadCount,
  }
}
