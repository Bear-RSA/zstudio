/**
 * Builds the logo and favicons from Z Studios' logo artwork.
 *
 *   npm run logo                                  (reads assets/brand-reference/logo.*)
 *   npm run logo -- path/to/logo.png
 *
 * The source is the black circle on a blurred, colourful background. We find the
 * circle (the large near-black region), cut it out with a transparent edge, and write:
 *   public/brand/logo.png      full circular logo, 1024px, transparent corners
 *   public/brand/mark.png      the spotlit "Z" only, 256px circle — for the header
 *   src/app/icon.png           favicon (the "Z" mark; "STUDIOS" is unreadable at 32px)
 *   src/app/apple-icon.png     180px home-screen icon (full logo on solid black, iOS adds rounding)
 */
import { existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();

function findSource(): string {
  const arg = process.argv[2];
  if (arg) return path.resolve(arg);
  const dir = path.join(root, "assets", "brand-reference");
  const file = existsSync(dir) ? readdirSync(dir).find((f) => /^logo\.(png|jpe?g|webp)$/i.test(f)) : undefined;
  if (!file) throw new Error("Put the logo at assets/brand-reference/logo.png (or pass a path).");
  return path.join(dir, file);
}

/** Bounding box of the circle: rows/columns where most pixels are near-black. */
async function detectCircle(src: string) {
  const { data, info } = await sharp(src).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const dark = (x: number, y: number) => {
    const i = (y * width + x) * 3;
    return data[i] < 20 && data[i + 1] < 20 && data[i + 2] < 20;
  };
  // A column/row belongs to the circle if a decent run of it is black. The background
  // is blurred colour, so it rarely produces long near-black runs.
  const minRun = Math.round(Math.min(width, height) * 0.08);
  const hasRun = (len: number, at: (k: number) => boolean) => {
    let run = 0;
    for (let k = 0; k < len; k++) {
      run = at(k) ? run + 1 : 0;
      if (run >= minRun) return true;
    }
    return false;
  };
  const cols = [...Array(width).keys()].filter((x) => hasRun(height, (y) => dark(x, y)));
  const rows = [...Array(height).keys()].filter((y) => hasRun(width, (x) => dark(x, y)));
  if (!cols.length || !rows.length) throw new Error("Couldn't find the black circle in the image.");
  const left = cols[0], right = cols[cols.length - 1], top = rows[0], bottom = rows[rows.length - 1];
  const r = Math.floor(Math.min(right - left, bottom - top) / 2);
  return { cx: Math.round((left + right) / 2), cy: Math.round((top + bottom) / 2), r };
}

const circleMask = (size: number, inset = 0) =>
  Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - inset}" fill="#fff"/></svg>`,
  );

async function main() {
  const src = findSource();
  const { cx, cy, r } = await detectCircle(src);
  console.log(`Circle: centre (${cx}, ${cy}), radius ${r}px`);

  const out = (...p: string[]) => path.join(root, ...p);
  mkdirSync(out("public", "brand"), { recursive: true });

  // Inset 1.5% so no background colour bleeds round the anti-aliased rim.
  const inner = Math.round(r * 0.985);
  const square = await sharp(src)
    .extract({ left: cx - inner, top: cy - inner, width: inner * 2, height: inner * 2 })
    .toBuffer();

  const logo = await sharp(square)
    .resize(1024, 1024)
    .composite([{ input: circleMask(1024), blend: "dest-in" }])
    .png()
    .toBuffer();
  await sharp(logo).toFile(out("public", "brand", "logo.png"));

  // The "Z" + spotlight sits slightly above centre; crop around it and re-circle it.
  const half = Math.round(inner * 0.4);
  const zcx = cx, zcy = cy - Math.round(inner * 0.13);
  const mark = await sharp(src)
    .extract({ left: zcx - half, top: zcy - half, width: half * 2, height: half * 2 })
    .resize(512, 512)
    .composite([{ input: circleMask(512), blend: "dest-in" }])
    .png()
    .toBuffer();
  await sharp(mark).resize(256, 256).toFile(out("public", "brand", "mark.png"));
  await sharp(mark).resize(96, 96).toFile(out("src", "app", "icon.png"));

  await sharp({ create: { width: 180, height: 180, channels: 4, background: "#0b0a09" } })
    .composite([{ input: await sharp(logo).resize(180, 180).toBuffer() }])
    .png()
    .toFile(out("src", "app", "apple-icon.png"));

  // Replace the default favicon and the temporary SVG icon so browsers pick up icon.png.
  rmSync(out("src", "app", "favicon.ico"), { force: true });
  rmSync(out("src", "app", "icon.svg"), { force: true });

  console.log("Wrote public/brand/logo.png, public/brand/mark.png, src/app/icon.png, src/app/apple-icon.png");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
