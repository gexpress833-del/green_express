// Service worker pour Green Express
// - Pusher Beams (push notifications natives)
// - Cache offline (PWA)

importScripts("https://js.pusher.com/beams/service-worker.js");

const CACHE_VERSION = 'gx-v3';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const API_CACHE = `${CACHE_VERSION}-api`;

// Endpoints API qui ne doivent JAMAIS être servis depuis le cache
// (auth, csrf, logout, payements en cours, opérations sensibles)
const API_NEVER_CACHE = [
  '/api/auth',
  '/api/login',
  '/api/logout',
  '/api/register',
  '/api/csrf',
  '/api/sanctum',
  '/api/flexpay',
  '/api/payments/initiate',
  '/api/payments/check',
  '/api/health',
];

const PRECACHE_URLS = [
  '/',
  '/offline',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons/apple-touch-icon.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== RUNTIME_CACHE && k !== API_CACHE && k.startsWith('gx-'))
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // /sanctum/csrf-cookie : toujours réseau, pas de cache
  if (url.pathname.startsWith('/sanctum')) return;

  // /api/* : GET seulement (les autres méthodes ont déjà été filtrées plus haut)
  if (url.pathname.startsWith('/api')) {
    // Endpoints sensibles : toujours réseau direct
    if (API_NEVER_CACHE.some((p) => url.pathname.startsWith(p))) return;

    // Network-first avec fallback cache (lecture offline)
    event.respondWith(
      fetch(request)
        .then((res) => {
          // Ne cache que les réponses OK (pas les 401/403/500)
          if (res.ok) {
            const copy = res.clone();
            caches.open(API_CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(() =>
          caches.match(request).then((cached) => {
            if (cached) {
              // Marquer la réponse comme provenant du cache (utile pour debug côté front)
              const headers = new Headers(cached.headers);
              headers.set('X-From-Cache', '1');
              return cached.blob().then(
                (b) => new Response(b, { status: cached.status, statusText: cached.statusText, headers })
              );
            }
            // Aucune donnée en cache → renvoyer un 503 JSON propre
            return new Response(
              JSON.stringify({ error: 'offline', message: 'Aucune donnée hors-ligne disponible.' }),
              { status: 503, headers: { 'Content-Type': 'application/json', 'X-From-Cache': '0' } }
            );
          })
        )
    );
    return;
  }

  // Navigations HTML : network-first, fallback cache puis /offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request).then((m) => m || caches.match('/offline')))
    );
    return;
  }

  // Assets statiques : stale-while-revalidate
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/images/') ||
    url.pathname.startsWith('/icons/') ||
    /\.(?:png|jpg|jpeg|svg|webp|gif|woff2?|ttf|css|js)$/i.test(url.pathname)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((res) => {
            const copy = res.clone();
            caches.open(RUNTIME_CACHE).then((c) => c.put(request, copy));
            return res;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    );
  }
});

function normalizeBadgeCount(count) {
  const n = Math.floor(Number(count) || 0);
  if (n <= 0) return 0;
  return Math.min(n, 99);
}

async function applyAppBadge(count) {
  const n = normalizeBadgeCount(count);
  if (!('setAppBadge' in self.navigator)) return;
  try {
    if (n === 0 && typeof self.navigator.clearAppBadge === 'function') {
      await self.navigator.clearAppBadge();
    } else if (n > 0 && typeof self.navigator.setAppBadge === 'function') {
      await self.navigator.setAppBadge(n);
    }
  } catch {
    /* noop */
  }
}

/** Compteur non lues via API (cookies de session sur même origine). */
async function refreshBadgeFromApi() {
  try {
    const res = await fetch('/api/notifications?limit=1', {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const count = normalizeBadgeCount(data?.unread_count);
    await applyAppBadge(count);
    return count;
  } catch {
    return null;
  }
}

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }
  if (event.data?.type === 'SET_BADGE') {
    event.waitUntil(applyAppBadge(event.data.count));
    return;
  }
  if (event.data?.type === 'REFRESH_BADGE') {
    event.waitUntil(refreshBadgeFromApi());
  }
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }

  const options = {
    body: data.body || data.message || 'Nouvelle notification Green Express',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'gx-notification',
    renotify: true,
    data: {
      deep_link: data.deep_link || '/notifications',
      unread_count: data.unread_count,
    },
  };

  event.waitUntil(
    (async () => {
      await self.registration.showNotification(
        data.title || 'Green Express',
        options
      );
      if (data.unread_count != null) {
        await applyAppBadge(data.unread_count);
      } else {
        await refreshBadgeFromApi();
      }
    })()
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const deepLink = event.notification.data?.deep_link || '/notifications';

  event.waitUntil(
    (async () => {
      const clientList = await clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      const targetUrl = new URL(deepLink, self.location.origin).href;

      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          await client.focus();
          client.postMessage({ type: 'REFRESH_BADGE' });
          return;
        }
      }

      if (clients.openWindow) {
        await clients.openWindow(targetUrl);
      }
      await refreshBadgeFromApi();
    })()
  );
});
