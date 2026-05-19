/**
 * Badge sur l’icône PWA (iOS 16.4+, Android, Chrome desktop).
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Badging_API
 */

function normalizeCount(count) {
  const n = Math.floor(Number(count) || 0)
  if (n <= 0) return 0
  return Math.min(n, 99)
}

export function isAppBadgeSupported() {
  if (typeof navigator === 'undefined') return false
  return 'setAppBadge' in navigator || 'clearAppBadge' in navigator
}

/** Applique le badge via le service worker (page fermée ou API indisponible côté window). */
export async function syncAppIconBadgeViaServiceWorker(count) {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
  try {
    const registration = await navigator.serviceWorker.ready
    registration.active?.postMessage({
      type: 'SET_BADGE',
      count: normalizeCount(count),
    })
  } catch {
    /* noop */
  }
}

/**
 * Met à jour le badge sur l’icône d’accueil.
 * @param {number} count — nombre de notifications non lues (0 = effacer)
 */
export async function syncAppIconBadge(count) {
  const n = normalizeCount(count)

  if (typeof navigator !== 'undefined') {
    try {
      if (n === 0 && typeof navigator.clearAppBadge === 'function') {
        await navigator.clearAppBadge()
      } else if (n > 0 && typeof navigator.setAppBadge === 'function') {
        await navigator.setAppBadge(n)
      }
    } catch {
      /* Safari / permissions : fallback SW */
    }
  }

  await syncAppIconBadgeViaServiceWorker(n)
}
