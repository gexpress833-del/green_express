import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, getToken, isSupported } from "firebase/messaging";

// Configuration Firebase (valeurs publiques provenant des variables d'environnement)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialisation de Firebase de manière sécurisée pour le SSR (Server-Side Rendering)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialisation de FCM (uniquement côté client)
export const getFcmMessaging = async () => {
  if (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "Notification" in window &&
    (await isSupported().catch(() => false))
  ) {
    try {
      return getMessaging(app);
    } catch (error) {
      console.warn("FCM messaging not supported or failed to initialize", error);
      return null;
    }
  }
  return null;
};

/**
 * Demande la permission de notification et renvoie le token FCM si accordé.
 */
export const requestFcmToken = async () => {
  const messaging = await getFcmMessaging();
  if (!messaging) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("FCM: Notification permission denied.");
      return null;
    }

    const serviceWorkerRegistration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js",
    );

    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration,
    });

    return token;
  } catch (error) {
    console.error("FCM: Error retrieving Token", error);
    return null;
  }
};
