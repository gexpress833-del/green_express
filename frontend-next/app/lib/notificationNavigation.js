import { ROLES } from '@/lib/constants'

/**
 * Liens depuis les notifications selon le rôle (évite /client pour les staffs).
 */
export function getOrderDeepLink(role, orderId) {
  if (orderId == null || orderId === '') return null
  const id = String(orderId).trim()
  if (!id) return null
  const enc = encodeURIComponent(id)
  const r = (role || '').toLowerCase()
  switch (r) {
    case ROLES.ADMIN:
      return `/admin/orders?order=${enc}`
    case ROLES.CLIENT:
      return `/client/orders/${enc}`
    case ROLES.LIVREUR:
      return `/livreur/order/${enc}`
    case ROLES.CUISINIER:
      return `/cuisinier/orders?order=${enc}`
    case ROLES.ENTREPRISE:
      return `/entreprise/orders?order=${enc}`
    case ROLES.VERIFICATEUR:
      return '/verificateur'
    default:
      return `/client/orders/${enc}`
  }
}

export function getEventRequestDeepLink(role) {
  const r = (role || '').toLowerCase()
  if (r === ROLES.ADMIN) return '/admin/event-requests'
  if (r === ROLES.SECRETAIRE) return '/secretaire/event-requests'
  if (r === ROLES.CLIENT) return '/client/event-requests'
  return role ? `/${role}` : '/client'
}

export function getSubscriptionsDeepLink(role) {
  const r = (role || '').toLowerCase()
  if (r === ROLES.ADMIN) return '/admin/subscriptions'
  if (r === ROLES.ENTREPRISE) return '/entreprise/subscriptions'
  if (r === ROLES.CLIENT) return '/client/subscriptions'
  return role ? `/${role}` : '/client/subscriptions'
}

export function getPromotionsDeepLink(role, promotionId) {
  const r = (role || '').toLowerCase()
  const pid = promotionId != null && promotionId !== '' ? String(promotionId).trim() : ''
  if (r === ROLES.ADMIN) {
    return pid ? `/admin/promotions/${encodeURIComponent(pid)}/edit` : '/admin/promotions'
  }
  if (r === ROLES.CLIENT) {
    return pid ? `/client/promotions?promo=${encodeURIComponent(pid)}` : '/client/promotions'
  }
  return role ? `/${role}` : '/client/promotions'
}
