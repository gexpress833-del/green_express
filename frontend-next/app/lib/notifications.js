import { apiRequest } from './api';

/**
 * @param {number} limit
 * @param {RequestInit} [fetchOptions] - ex. { signal: AbortSignal } pour timeout
 */
export async function fetchNotifications(limit = 20, fetchOptions = {}) {
  return apiRequest(`/api/notifications?limit=${encodeURIComponent(limit)}`, {
    method: 'GET',
    ...fetchOptions,
  });
}

export async function markNotificationRead(id) {
  return apiRequest(`/api/notifications/${encodeURIComponent(id)}/read`, { method: 'POST' });
}

export async function markAllNotificationsRead() {
  return apiRequest('/api/notifications/read-all', { method: 'POST' });
}

export async function deleteNotification(id) {
  const raw = id == null ? '' : String(id).trim();
  if (!raw) {
    throw new Error('Identifiant de notification manquant');
  }
  return apiRequest(`/api/notifications/${encodeURIComponent(raw)}`, { method: 'DELETE' });
}

export async function deleteAllNotifications() {
  return apiRequest('/api/notifications', { method: 'DELETE' });
}

/** Admin : annonce globale à tous les utilisateurs */
export async function broadcastAnnouncement(title, message) {
  return apiRequest('/api/notifications/broadcast', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, message }),
  });
}

