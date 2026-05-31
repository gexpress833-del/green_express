import { apiRequest } from './api'

/**
 * Envoie la position du client au backend.
 * @param {{ latitude: number, longitude: number, accuracy?: number }} coords
 */
export async function updateCustomerLocation(coords) {
  return apiRequest('/api/customer/location', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy || null,
    }),
  })
}

/**
 * Envoie la position du livreur au backend.
 * @param {{ latitude: number, longitude: number, accuracy?: number, order_id?: number }} coords
 */
export async function updateDriverLocation(coords) {
  return apiRequest('/api/driver/location', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy || null,
      order_id: coords.order_id || null,
    }),
  })
}

/**
 * Récupère la position d'une commande (client ou livreur).
 * @param {number} orderId
 */
export async function fetchOrderLocation(orderId) {
  return apiRequest(`/api/orders/${orderId}/location`, {
    method: 'GET',
  })
}

/**
 * Récupère les détails d'une commande avec positions.
 * @param {number} orderId
 */
export async function fetchOrderWithLocation(orderId) {
  return apiRequest(`/api/orders/${orderId}/tracking`, {
    method: 'GET',
  })
}
