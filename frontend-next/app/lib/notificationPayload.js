export function getNotificationField(notification, key) {
  const direct = notification?.[key]
  if (direct !== undefined && direct !== null && direct !== '') {
    return direct
  }
  const data = notification?.data || {}
  if (key === 'order_id') {
    return data.order_id ?? data.orderId ?? data.order?.id ?? data.commande_id ?? data.commandeId ?? null
  }
  if (key === 'promotion_id') {
    return data.promotion_id ?? data.promotionId ?? data.promotion?.id ?? null
  }
  if (key === 'subscription_id') {
    return data.subscription_id ?? data.subscriptionId ?? data.subscription?.id ?? null
  }
  return notification?.data?.[key]
}

export function getNotificationDeepLink(notification, fallbackHref = null) {
  const deepLink = getNotificationField(notification, 'deep_link')
  if (typeof deepLink === 'string') {
    const cleaned = deepLink.trim()
    if (cleaned !== '' && cleaned !== '/' && !cleaned.endsWith('/client')) {
      return cleaned
    }
  }
  return fallbackHref
}
