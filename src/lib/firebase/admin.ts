import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

export function isFirebaseConfigured(): boolean {
  return Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.FIRESTORE_EMULATOR_HOST);
}

export function firebaseApp(): App {
  const existing = getApps()[0];
  if (existing) return existing;

  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) return initializeApp({ credential: cert(JSON.parse(json)) });

  // Emulators: FIRESTORE_EMULATOR_HOST / FIREBASE_AUTH_EMULATOR_HOST are picked up automatically.
  return initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID ?? "zstudio-dev" });
}

export function db() {
  return getFirestore(firebaseApp());
}
