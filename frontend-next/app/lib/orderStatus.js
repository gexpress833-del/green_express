/**
 * Libellés et fil d’étapes pour le suivi de commande (client / admin).
 */

export const ORDER_STATUS_LABELS = {
  pending_payment: 'En attente de paiement',
  paid: 'Paiement confirmé',
  pending: 'En préparation',
  out_for_delivery: 'En cours de livraison',
  delivered: 'Livrée',
  cancelled: 'Annulée',
}

const HAPPY_PATH = [
  'pending_payment',
  'paid',
  'pending',
  'out_for_delivery',
  'delivered',
]

/**
 * @param {string} [status]
 * @returns {string}
 */
export function getOrderStatusLabel(status) {
  const s = (status || '').toLowerCase()
  return ORDER_STATUS_LABELS[s] || status || 'Statut inconnu'
}

/**
 * Étapes pour une frise chronologique (accessibilité : ordre logique du parcours).
 * @param {string} [status]
 * @returns {{ key: string, label: string, state: 'done' | 'current' | 'upcoming' | 'cancelled' }[]}
 */
export function getOrderTimelineSteps(status) {
  const s = (status || '').toLowerCase()
  if (s === 'cancelled') {
    return [
      {
        key: 'cancelled',
        label: ORDER_STATUS_LABELS.cancelled,
        state: 'cancelled',
      },
    ]
  }

  let idx = HAPPY_PATH.indexOf(s)
  if (idx === -1) {
    idx = 0
  }

  return HAPPY_PATH.map((key, i) => ({
    key,
    label: ORDER_STATUS_LABELS[key] || key,
    state: i < idx ? 'done' : i === idx ? 'current' : 'upcoming',
  }))
}
