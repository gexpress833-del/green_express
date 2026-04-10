/**
 * Format date to readable string (FR)
 */
export function formatDate(date) {
  if (!date) return '';
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

/**
 * Format currency (EUR)
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

/**
 * Format en francs congolais (FC)
 */
export function formatCurrencyCDF(amount) {
  if (amount == null || amount === '') return '';
  const value = Number(amount);
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value) + ' FC';
}

/**
 * Montants commande (FC/CDF ou autre devise) — utilisé admin / cuisinier
 */
export function formatOrderMoney(amount, currency) {
  const c = (currency || 'CDF').toUpperCase();
  if (c === 'CDF' || c === 'FC') return formatCurrencyCDF(amount ?? 0);
  return `${Number(amount ?? 0).toLocaleString('fr-FR')}\u00a0${c}`;
}

/**
 * Get user role from token payload
 */
export function getRoleFromToken() {
  if (typeof window === 'undefined') return null;
  // Prefer session-stored user (set by AuthProvider). Fallback to token parsing for legacy cases.
  try {
    const userRaw = sessionStorage.getItem('auth_user');
    if (userRaw) {
      const user = JSON.parse(userRaw);
      return user?.role ?? null;
    }
  } catch {}

  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role || null;
  } catch {
    return null;
  }
}

/**
 * Validate email format
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password (min 6 chars)
 */
export function isValidPassword(password) {
  return password && password.length >= 6;
}

/**
 * Build Blob URL from image ID
 */
export function getBlobUrl(imageId) {
  if (!imageId) return '/placeholder.svg';
  return `${process.env.NEXT_PUBLIC_BLOB_BASE}/${imageId}`;
}

/**
 * Check if user has specific role
 */
export function hasRole(requiredRole) {
  const userRole = getRoleFromToken();
  return userRole === requiredRole;
}

/**
 * Check if user has any of the required roles
 */
export function hasAnyRole(requiredRoles) {
  const userRole = getRoleFromToken();
  return requiredRoles.includes(userRole);
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
