/**
 * Seeds the `resources` collection with the sample inventory.
 *   npm run seed                      → uses FIREBASE_SERVICE_ACCOUNT_JSON from .env.local
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npm run seed   → emulator
 * Existing resources keep their `images` so re-seeding doesn't wipe uploaded photos.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { seedResources } from "../src/lib/booking/seed-data";

async function main() {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!json && !process.env.FIRESTORE_EMULATOR_HOST) {
    throw new Error("Set FIREBASE_SERVICE_ACCOUNT_JSON or FIRESTORE_EMULATOR_HOST.");
  }
  initializeApp(json ? { credential: cert(JSON.parse(json)) } : { projectId: process.env.FIREBASE_PROJECT_ID ?? "zstudio-dev" });
  const db = getFirestore();

  const refs = seedResources.map((r) => db.collection("resources").doc(r.id));
  const existing = await db.getAll(...refs);
  const batch = db.batch();
  seedResources.forEach((data, i) => {
    const current = existing[i].data();
    batch.set(refs[i], { ...data, images: current?.images?.length ? current.images : data.images });
  });
  await batch.commit();
  console.log(`Seeded ${seedResources.length} resources.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
