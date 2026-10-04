/**
 * Uploads Z Studios' real photography from assets/brand-reference/ to Cloudinary.
 *
 *   npm run assets:upload
 *
 * Name files after the resource they belong to and they'll be attached to it:
 *   studio-main-01.jpg, studio-main-02.jpg  → The Studio (hero = first)
 *   sony-fx3-01.jpg                         → Sony FX3
 * Anything else is uploaded to zstudio/brand/ and listed so you can wire it up by hand.
 * Re-running is safe: public IDs are derived from file names and overwritten.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { cert, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { seedResources } from "../src/lib/booking/seed-data";

const DIR = path.join(process.cwd(), "assets", "brand-reference");
const IMAGE = /\.(jpe?g|png|webp|heic|tiff?)$/i;

const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const key = process.env.CLOUDINARY_API_KEY;
const secret = process.env.CLOUDINARY_API_SECRET;

// Signed upload via Cloudinary's REST API — avoids pulling in the full SDK for one script.
async function upload(file: string, publicId: string): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const params = { overwrite: "true", public_id: publicId, timestamp };
  const toSign = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  const signature = createHash("sha1").update(toSign + secret).digest("hex");

  const form = new FormData();
  form.append("file", new Blob([await readFile(path.join(DIR, file))]), file);
  for (const [k, v] of Object.entries(params)) form.append(k, v);
  form.append("api_key", key!);
  form.append("signature", signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { method: "POST", body: form });
  const body = (await res.json()) as { public_id?: string; error?: { message: string } };
  if (!res.ok || !body.public_id) throw new Error(`${file}: ${body.error?.message ?? res.status}`);
  return body.public_id;
}

async function main() {
  if (!cloud || !key || !secret) throw new Error("Set the three CLOUDINARY_* env vars in .env.local.");
  const files = (await readdir(DIR)).filter((f) => IMAGE.test(f)).sort();
  if (!files.length) return console.log(`No images in ${DIR}.`);

  const ids = seedResources.map((r) => r.id).sort((a, b) => b.length - a.length);
  const byResource = new Map<string, string[]>();
  const loose: string[] = [];

  for (const file of files) {
    const stem = path.parse(file).name.toLowerCase().replace(/[^a-z0-9-]+/g, "-");
    const owner = ids.find((id) => stem === id || stem.startsWith(`${id}-`));
    const publicId = await upload(file, owner ? `zstudio/resources/${stem}` : `zstudio/brand/${stem}`);
    console.log(`↑ ${file} → ${publicId}`);
    if (owner) byResource.set(owner, [...(byResource.get(owner) ?? []), publicId]);
    else loose.push(publicId);
  }

  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (byResource.size && (json || process.env.FIRESTORE_EMULATOR_HOST)) {
    initializeApp(json ? { credential: cert(JSON.parse(json)) } : { projectId: process.env.FIREBASE_PROJECT_ID ?? "zstudio-dev" });
    const db = getFirestore();
    for (const [id, images] of byResource) {
      await db.collection("resources").doc(id).set({ images, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      console.log(`✓ ${id}: ${images.length} image(s)`);
    }
  } else if (byResource.size) {
    console.log("\nFirebase not configured — add these to seed-data.ts `images`:");
    for (const [id, images] of byResource) console.log(`  ${id}: ${JSON.stringify(images)}`);
  }
  if (loose.length) console.log(`\nUnassigned brand images:\n  ${loose.join("\n  ")}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
