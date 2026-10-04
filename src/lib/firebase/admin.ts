import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function app(): App {
  const existing = getApps()[0];
  if (existing) return existing;

  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) return initializeApp({ credential: cert(JSON.parse(json)) });

  // Emulator: FIRESTORE_EMULATOR_HOST is picked up automatically.
  return initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID ?? "zstudio-dev" });
}

export function db() {
  return getFirestore(app());
}
