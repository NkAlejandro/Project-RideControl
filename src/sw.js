import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute, NavigationRoute } from "workbox-routing";
import { StaleWhileRevalidate } from "workbox-strategies";
import { initializeApp } from "firebase/app";
import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

registerRoute(
  ({ request }) => request.destination === "image" || request.destination === "font",
  new StaleWhileRevalidate({ cacheName: "assets" }),
);

registerRoute(
  new NavigationRoute(
    async ({ request }) => {
      try {
        const response = await fetch(request);
        if (response.status === 404) {
          const fallback = await caches.match("/index.html");
          if (fallback) return fallback;
          return Response.redirect("/", 302);
        }
        const cache = await caches.open("pages");
        cache.put(request, response.clone());
        return response;
      } catch {
        const cached = await caches.match(request);
        if (cached) return cached;
        return caches.match("/index.html");
      }
    },
  ),
);

const firebaseConfig = {
  apiKey: "AIzaSyC7FMr7eobA8Z0d5aeg__A2eQ1n--sboWk",
  authDomain: "ridecontrol-1caa4.firebaseapp.com",
  databaseURL: "https://ridecontrol-1caa4-default-rtdb.firebaseio.com",
  projectId: "ridecontrol-1caa4",
  storageBucket: "ridecontrol-1caa4.firebasestorage.app",
  messagingSenderId: "731042322632",
  appId: "1:731042322632:web:e2024b3e5594b927a9edfd",
  measurementId: "G-TSSB0HVWT6",
};

let messaging;
try {
  const app = initializeApp(firebaseConfig);
  messaging = getMessaging(app);
} catch (e) {
  console.error("[SW] Firebase init failed:", e);
}

if (messaging) {
  onBackgroundMessage(messaging, (payload) => {
    const { notification, data } = payload;
    const title = notification?.title || "RideControl";
    const options = {
      body: notification?.body || "",
      icon: "/favicon.svg",
      badge: "/favicon.svg",
      tag: data?.tag || "general",
      data: payload.data || {},
      requireInteraction: false,
      vibrate: [200, 100, 200],
    };
    self.registration.showNotification(title, options);
  });
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const urlToOpen = new URL("/", self.location.origin);
  const eventData = event.notification.data;
  if (eventData?.route) {
    urlToOpen.pathname = eventData.route;
  }
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === urlToOpen.href && "focus" in client) {
          return client.focus();
        }
      }
      return clients.openWindow(urlToOpen.href);
    }),
  );
});
