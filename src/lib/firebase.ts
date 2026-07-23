import { initializeApp, type FirebaseApp } from "firebase/app";
import { getDatabase, type Database } from "firebase/database";
import { getAuth, type Auth } from "firebase/auth";
import { getMessaging, type Messaging } from "firebase/messaging";

let app: FirebaseApp | null = null;
let database: Database | null = null;
let auth: Auth | null = null;
let messaging: Messaging | null = null;

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyC7FMr7eobA8Z0d5aeg__A2eQ1n--sboWk",
  authDomain: "ridecontrol-1caa4.firebaseapp.com",
  databaseURL: "https://ridecontrol-1caa4-default-rtdb.firebaseio.com",
  projectId: "ridecontrol-1caa4",
  storageBucket: "ridecontrol-1caa4.firebasestorage.app",
  messagingSenderId: "731042322632",
  appId: "1:731042322632:web:e2024b3e5594b927a9edfd",
  measurementId: "G-TSSB0HVWT6",
};

export function getFirebaseApp(): FirebaseApp | null {
  if (app) return app;
  app = initializeApp(FIREBASE_CONFIG);
  return app;
}

export function getFirebaseDatabase(): Database | null {
  if (database) return database;
  const a = getFirebaseApp();
  if (!a) return null;
  database = getDatabase(a);
  return database;
}

export function getFirebaseAuth(): Auth | null {
  if (auth) return auth;
  const a = getFirebaseApp();
  if (!a) return null;
  auth = getAuth(a);
  return auth;
}

export function getFirebaseMessaging(): Messaging | null {
  if (messaging) return messaging;
  const a = getFirebaseApp();
  if (!a) return null;
  messaging = getMessaging(a);
  return messaging;
}

export function getVapidKey(): string | null {
  return "BAji3MKsaTSOnzE_wPQd3Wf28tX5Xjk_QVIl-OXUz-sw97QO-FTdBNurigEVfXcPlfq0mKQhmZ1GhkbiUtAD1-I";
}
