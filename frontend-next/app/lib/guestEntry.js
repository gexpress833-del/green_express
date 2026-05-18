/**
 * Point d'entrée visiteurs : page d'accueil (landing) à la racine.
 * Les routes protégées redirigent vers / avec returnUrl pour reprendre après connexion.
 */

export function isSafeInternalPath(path) {
  if (!path || typeof path !== 'string') return false
  if (!path.startsWith('/') || path.startsWith('//')) return false
  if (path.startsWith('/login') || path.startsWith('/register')) return false
  return true
}

/** URL d'accueil pour un invité (landing), avec chemin de retour optionnel. */
export function getGuestEntryHref(returnPath) {
  if (!isSafeInternalPath(returnPath) || returnPath === '/') return '/'
  return `/?returnUrl=${encodeURIComponent(returnPath)}`
}

/** Lien connexion avec retour après authentification. */
export function getLoginHref(returnPath) {
  const base = '/login'
  if (!isSafeInternalPath(returnPath) || returnPath === '/') return base
  return `${base}?returnUrl=${encodeURIComponent(returnPath)}`
}
