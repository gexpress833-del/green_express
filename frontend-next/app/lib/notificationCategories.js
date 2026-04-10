/**
 * Catégories alignées sur `data.category` / clés métier renvoyées par l’API Laravel.
 */
export function getNotificationType(notification) {
  const d = notification?.data || {}
  if (d.category === 'order' || d.order_id != null) return 'orders'
  if (d.category === 'event' || d.event_request_id != null) return 'events'
  if (d.category === 'subscription' || d.subscription_id != null) return 'subscriptions'
  if (d.category === 'promotion' || d.promotion_id != null) return 'promotions'
  if (d.category === 'announcement' || d.kind === 'announcement') return 'announcements'
  // Anciennes notifs sans catégorie : regroupées avec les annonces Green Express
  return 'announcements'
}

export const NOTIFICATION_TABS = [
  { id: 'all', label: 'Toutes' },
  { id: 'orders', label: 'Commandes' },
  { id: 'subscriptions', label: 'Abonnements' },
  { id: 'promotions', label: 'Promotions' },
  { id: 'events', label: 'Événements' },
  { id: 'announcements', label: 'Annonces' },
]
