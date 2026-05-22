/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");

const firebaseConfig = {
  apiKey: "AIzaSyDn1u4anqSBQnLonEAChGU_NCfzJPs8g5s",
  authDomain: "greenexpress-push.firebaseapp.com",
  projectId: "greenexpress-push",
  storageBucket: "greenexpress-push.firebasestorage.app",
  messagingSenderId: "462190149988",
  appId: "1:462190149988:web:ef0643846ba2d53c55ba71",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Background message received: ", payload);

  const notificationTitle = payload.notification?.title || "Green Express";
  // Tag stable par type (deep_link) pour éviter l'accumulation de doublons identiques :
  // une nouvelle notif du même tag remplace la précédente.
  const tag = payload.data?.tag || payload.data?.deep_link || "green-express";
  const notificationOptions = {
    body: payload.notification?.body || "",
    icon: payload.notification?.icon || "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag,
    renotify: true,
    requireInteraction: true,
    vibrate: [200, 100, 200],
    data: payload.data || {},
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const deepLink = event.notification.data?.deep_link;
  if (deepLink) {
    event.waitUntil(
      clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
        // Si un onglet est déjà ouvert sur notre site, on le focus et on navigue
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.postMessage({ type: "NAVIGATE", url: deepLink });
            return client.focus();
          }
        }
        // Sinon, on ouvre un nouvel onglet
        if (clients.openWindow) {
          return clients.openWindow(deepLink);
        }
      })
    );
  }
});
