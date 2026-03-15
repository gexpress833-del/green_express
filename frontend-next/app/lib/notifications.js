import { apiRequest } from './api';

export async function fetchNotifications(limit = 20) {
  return apiRequest(`/api/notifications?limit=${encodeURIComponent(limit)}`, { method: 'GET' });
}

export async function markNotificationRead(id) {
  return apiRequest(`/api/notifications/${encodeURIComponent(id)}/read`, { method: 'POST' });
}

export async function markAllNotificationsRead() {
  return apiRequest('/api/notifications/read-all', { method: 'POST' });
}

