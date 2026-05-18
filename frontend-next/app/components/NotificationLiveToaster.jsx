'use client'

import { useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useUnreadNotifications } from '@/contexts/UnreadNotificationsContext'
import { useEchoChannel } from '@/lib/useEchoChannel'
import { pushToast } from '@/components/Toaster'
import {
  getNotificationBroadcastEvent,
  getUserNotificationChannel,
  isNotificationsWsEnabled,
  parseBroadcastNotificationPayload,
} from '@/lib/notificationWs'

const EVENT_KINDS = new Set(['event_request_created', 'event_request_responded'])

/**
 * Toasts temps réel : nouvelle demande de devis (staff) et réponse Green Express (client).
 */
export default function NotificationLiveToaster() {
  const { user } = useAuth()
  const { refreshUnreadCount } = useUnreadNotifications()

  const onBroadcast = useCallback(
    (payload) => {
      const data = parseBroadcastNotificationPayload(payload)
      if (!data || !EVENT_KINDS.has(data.kind)) return

      refreshUnreadCount()

      if (data.kind === 'event_request_created') {
        pushToast({
          type: 'info',
          message: `${data.title || 'Nouvelle demande de devis'} — ${data.message || 'Un client a soumis une demande événementielle.'}`,
          duration: 6500,
        })
        return
      }

      const isContacted = data.status === 'contacted'
      const title =
        data.title ||
        (isContacted
          ? 'Green Express vous a contacté'
          : 'Mise à jour de votre demande événementielle')
      const message =
        data.message ||
        (isContacted
          ? 'Consultez la réponse à votre demande de devis.'
          : 'Votre demande événementielle a été traitée.')

      pushToast({
        type: 'success',
        message: `${title} — ${message}`,
        duration: 6500,
      })
    },
    [refreshUnreadCount],
  )

  useEchoChannel({
    enabled: Boolean(user?.id) && isNotificationsWsEnabled(),
    channel: getUserNotificationChannel(user?.id),
    event: getNotificationBroadcastEvent(),
    onEvent: onBroadcast,
  })

  return null
}
