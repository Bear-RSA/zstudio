import sharp from "sharp";

/**
 * Packs an image into a multi-size .ico (16, 32 and 48px PNG entries).
 * Browsers request /favicon.ico directly, so it must exist and match the brand —
 * otherwise they fall back to whatever default icon is lying around.
 */
export async function toIco(input: Buffer | string, sizes = [16, 32, 48]): Promise<Buffer> {
  const pngs = await Promise.all(sizes.map((s) => sharp(input, { density: 384 }).resize(s, s).png().toBuffer()));

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(pngs.length, 4);

  const entries: Buffer[] = [];
  let offset = 6 + 16 * pngs.length;
  pngs.forEach((png, i) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(sizes[i] >= 256 ? 0 : sizes[i], 0); // width
    e.writeUInt8(sizes[i] >= 256 ? 0 : sizes[i], 1); // height
    e.writeUInt8(0, 2); // palette
    e.writeUInt8(0, 3); // reserved
    e.writeUInt16LE(1, 4); // colour planes
    e.writeUInt16LE(32, 6); // bits per pixel
    e.writeUInt32LE(png.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += png.length;
    entries.push(e);
  });

  return Buffer.concat([header, ...entries, ...pngs]);
}
