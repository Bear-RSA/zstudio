"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth, inMemoryPersistence, setPersistence, type Auth } from "firebase/auth";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

export const isFirebaseClientConfigured = Boolean(config.apiKey && config.authDomain && config.projectId);

let auth: Auth | undefined;

/**
 * Firebase Auth is only used to sign in and get an ID token; the server then issues its own
 * httpOnly session cookie. In-memory persistence means no Firebase session lingers in the browser.
 */
export async function clientAuth(): Promise<Auth> {
  if (auth) return auth;
  const app = getApps().length ? getApp() : initializeApp(config);
  auth = getAuth(app);
  const emulator = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST;
  if (emulator) connectAuthEmulator(auth, `http://${emulator}`, { disableWarnings: true });
  await setPersistence(auth, inMemoryPersistence);
  return auth;
}
