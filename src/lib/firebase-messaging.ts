import { getToken, onMessage as onFCMessage } from "firebase/messaging";
import { getFirebaseMessaging, getVapidKey } from "./firebase";
import { ref, set, remove } from "firebase/database";
import { getFirebaseDatabase } from "./firebase";

let currentToken: string | null = null;

function isBrowserSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator;
}

export async function tryRegisterFCM(userId: string): Promise<void> {
  if (!isBrowserSupported()) return;
  try {
    const messaging = getFirebaseMessaging();
    const vapidKey = getVapidKey();
    if (!messaging || !vapidKey) return;
    const token = await getToken(messaging, { vapidKey });
    currentToken = token;
    const db = getFirebaseDatabase();
    if (db) {
      await set(ref(db, `pushTokens/${userId}/${token.replace(/[:.]/g, "_")}`), {
        token,
        createdAt: Date.now(),
        userAgent: navigator.userAgent,
      });
    }
    const unsubscribe = onFCMessage(messaging, (payload: any) => {
      const n = payload?.notification;
      if (n?.title) {
        window.dispatchEvent(new CustomEvent("rc:fcm-message", { detail: payload }));
      }
    });
    window.addEventListener("beforeunload", () => unsubscribe(), { once: true });
  } catch {
    // FCM no disponible
  }
}

export async function tryUnregisterFCM(userId: string): Promise<void> {
  if (!currentToken) return;
  try {
    const db = getFirebaseDatabase();
    if (db) {
      await remove(ref(db, `pushTokens/${userId}/${currentToken.replace(/[:.]/g, "_")}`));
    }
  } catch {
    // ignore
  }
  currentToken = null;
}
