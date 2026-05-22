"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/api";
import { getFcmMessaging, requestFcmToken } from "@/lib/firebase";
import { pushToast } from "@/components/Toaster";
import { onMessage } from "firebase/messaging";

export default function FcmBootstrap() {
  const { user } = useAuth();
  const hasBootstrapped = useRef(false);

  useEffect(() => {
    if (!user || hasBootstrapped.current) return;
    hasBootstrapped.current = true;

    const setupFcm = async () => {
      try {
        const token = await requestFcmToken();
        if (!token) {
          console.log("FCM: No token received (permission denied or error).");
          return;
        }

        console.log("FCM: Device Token acquired:", token.substring(0, 15) + "...");

        await apiRequest("/api/fcm/token", {
          method: "POST",
          body: JSON.stringify({
            token,
            platform: "web",
          }),
        });

        console.log("FCM: Token successfully registered on backend.");

        const messaging = await getFcmMessaging();
        if (messaging) {
          const unsubscribe = onMessage(messaging, (payload) => {
            console.log("FCM: Foreground message received:", payload);

            const title = payload.notification?.title || "Notification";
            const body = payload.notification?.body || "";

            pushToast({
              type: "info",
              message: `${title}${body ? ` — ${body}` : ""}`,
              duration: 6000,
            });
          });

          return unsubscribe;
        }
      } catch (error) {
        console.error("FCM Bootstrap failed:", error);
      }
    };

    let unsub;
    setupFcm().then(u => { unsub = u; });

    return () => {
      if (unsub) unsub();
    };
  }, [user]);

  return null;
}
