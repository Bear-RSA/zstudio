/**
 * Builds favicon.ico and apple-icon.png from the temporary SVG mark (src/app/icon.svg).
 *
 *   npm run favicon
 *
 * Once Z Studios' logo arrives, `npm run logo` replaces all of these with icons from the real artwork.
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { toIco } from "./ico";

const app = path.join(process.cwd(), "src", "app");
const svg = path.join(app, "icon.svg");

async function main() {
  writeFileSync(path.join(app, "favicon.ico"), await toIco(svg));
  // iOS draws the home-screen icon on a square and rounds the corners itself: fill the square.
  await sharp(svg, { density: 384 })
    .resize(140, 140)
    .extend({ top: 20, bottom: 20, left: 20, right: 20, background: "#0d0a0b" })
    .flatten({ background: "#0d0a0b" })
    .png()
    .toFile(path.join(app, "apple-icon.png"));
  console.log("Wrote src/app/favicon.ico and src/app/apple-icon.png from src/app/icon.svg");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
