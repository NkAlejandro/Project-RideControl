import { initializeApp, type FirebaseApp } from "firebase/app";
import { getDatabase, type Database } from "firebase/database";
import { getAuth, type Auth } from "firebase/auth";

let app: FirebaseApp | null = null;
let database: Database | null = null;
let auth: Auth | null = null;

export function getFirebaseApp(): FirebaseApp | null {
  if (app) return app;
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  if (!apiKey) return null;
  app = initializeApp({
    apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  });
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
