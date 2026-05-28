import {
  getNotificationDeepLink,
  getNotificationField,
} from '@/lib/notificationPayload'
import {
  getEventRequestDeepLink,
  getOrderDeepLink,
  getPromotionsDeepLink,
  getSubscriptionsDeepLink,
} from '@/lib/notificationNavigation'

export function resolveNotificationNavigateHref(notification, userRole) {
  const orderId = getNotificationField(notification, 'order_id')
  if (orderId) {
    return getNotificationDeepLink(notification, getOrderDeepLink(userRole, orderId))
  }
  if (getNotificationField(notification, 'event_request_id')) {
    return getNotificationDeepLink(notification, getEventRequestDeepLink(userRole))
  }
  if (
    getNotificationField(notification, 'subscription_id')
    || getNotificationField(notification, 'company_subscription_id')
  ) {
    return getNotificationDeepLink(notification, getSubscriptionsDeepLink(userRole))
  }
  if (getNotificationField(notification, 'promotion_id')) {
    return getNotificationDeepLink(
      notification,
      getPromotionsDeepLink(userRole, getNotificationField(notification, 'promotion_id')),
    )
  }
  return getNotificationDeepLink(notification, null)
}
