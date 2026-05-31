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

/**
 * Récupère la configuration de la zone de livraison autorisée (geofence).
 * @returns {Promise<{enabled:boolean, require_location:boolean, zone_name:string, center_latitude:number, center_longitude:number, radius_km:number}|null>}
 */
export async function fetchDeliveryZone() {
  try {
    return await apiRequest('/api/delivery-zone', { method: 'GET' })
  } catch {
    return null
  }
}

/**
 * Distance en kilomètres entre deux points GPS (formule de haversine).
 */
export function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * La position est-elle dans la zone autorisée ?
 * @param {{center_latitude:number, center_longitude:number, radius_km:number}} zone
 * @param {{latitude:number, longitude:number}} position
 */
export function isWithinZone(zone, position) {
  if (!zone || !position) return false
  const d = distanceKm(
    zone.center_latitude,
    zone.center_longitude,
    position.latitude,
    position.longitude,
  )
  return d <= zone.radius_km
}
