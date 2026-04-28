export function getNotificationField(notification, key) {
  const direct = notification?.[key]
  if (direct !== undefined && direct !== null && direct !== '') {
    return direct
  }
  return notification?.data?.[key]
}

export function getNotificationDeepLink(notification, fallbackHref = null) {
  const deepLink = getNotificationField(notification, 'deep_link')
  if (typeof deepLink === 'string' && deepLink.trim() !== '') {
    return deepLink
  }
  return fallbackHref
}
