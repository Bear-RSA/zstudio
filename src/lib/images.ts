// Metadata for images that aren't Z Studios' own photography.
// `cutout`: transparent product shot, shown contained on the spotlit frame.
// `product`: product shot on its own white background, shown contained on a white panel.
//   The default for the client's gear photos (/equipment/*.webp), which need no entry here.
// `credit`: required by the licence (Creative Commons) or noting the source (manufacturer).

export interface ImageMeta {
  fit: "cover" | "cutout" | "product";
  credit?: { text: string; href: string; license?: string };
}

/** Per-image overrides. Empty for now: the client's gear shots get the `product` default below. */
export const imageMeta: Record<string, ImageMeta> = {};

export const isLocalImage = (src: string) => src.startsWith("/");

export function getImageMeta(src: string): ImageMeta | undefined {
  return imageMeta[src] ?? (src.startsWith("/equipment/") ? { fit: "product" } : undefined);
}
