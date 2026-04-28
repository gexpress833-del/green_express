// Service worker for Pusher Beams push notifications
// This file is imported by the Beams SDK automatically when initialized

importScripts("https://js.pusher.com/beams/service-worker.js");

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || 'Nouvelle notification Green Express',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
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
