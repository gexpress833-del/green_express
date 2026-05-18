/** Canal privé Echo pour les notifications utilisateur (aligné Laravel). */
export function getUserNotificationChannel(userId) {
  if (userId == null || userId === '') return null
  const channelTemplate =
    process.env.NEXT_PUBLIC_NOTIFICATIONS_WS_CHANNEL || 'App.Models.User.{userId}'
  return channelTemplate.replace('{userId}', String(userId))
}

export function getNotificationBroadcastEvent() {
  return (
    process.env.NEXT_PUBLIC_NOTIFICATIONS_WS_EVENT ||
    '.Illuminate\\Notifications\\Events\\BroadcastNotificationCreated'
  )
}

export function isNotificationsWsEnabled() {
  return process.env.NEXT_PUBLIC_NOTIFICATIONS_WS_ENABLED === 'true'
}

/** Données métier depuis un event broadcast Laravel. */
export function parseBroadcastNotificationPayload(payload) {
  if (!payload || typeof payload !== 'object') return null
  if (payload.data && typeof payload.data === 'object') return payload.data
  return payload
}
