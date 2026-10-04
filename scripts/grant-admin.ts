/**
 * Give (or remove) dashboard access for a staff account that already exists in Firebase Auth.
 *
 *   npm run admin:grant -- staff@zstudios.co.za
 *   npm run admin:grant -- staff@zstudios.co.za --revoke
 *
 * Create the account first: Firebase console → Authentication → Users → Add user.
 * Alternative without this script: list the email in ADMIN_EMAILS.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

async function main() {
  const [email, flag] = process.argv.slice(2);
  if (!email) throw new Error("Usage: npm run admin:grant -- <email> [--revoke]");
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!json && !process.env.FIREBASE_AUTH_EMULATOR_HOST) throw new Error("Set FIREBASE_SERVICE_ACCOUNT_JSON in .env.local.");
  initializeApp(json ? { credential: cert(JSON.parse(json)) } : { projectId: process.env.FIREBASE_PROJECT_ID ?? "zstudio-dev" });

  const auth = getAuth();
  const user = await auth.getUserByEmail(email);
  const revoke = flag === "--revoke";
  await auth.setCustomUserClaims(user.uid, { ...user.customClaims, admin: !revoke });
  // Revoking also signs them out everywhere (session cookies are checked for revocation).
  if (revoke) await auth.revokeRefreshTokens(user.uid);
  console.log(`${revoke ? "Removed" : "Granted"} dashboard access for ${email}.`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
