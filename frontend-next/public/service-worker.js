// Service worker pour Green Express
// - Pusher Beams (push notifications natives)
// - Cache offline (PWA)

importScripts("https://js.pusher.com/beams/service-worker.js");

const CACHE_VERSION = 'gx-v2';
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

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || 'Nouvelle notification Green Express',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    vibrate: [200, 100, 200],
    data: {
      deep_link: data.deep_link || '/',
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Green Express', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const deepLink = event.notification.data?.deep_link || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === new URL(deepLink, self.location.origin).href && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(deepLink);
      }
    })
  );
});
