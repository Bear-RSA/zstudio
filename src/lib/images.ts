// Metadata for images that aren't Z Studios' own photography.
// `cutout`: transparent/white product shot, shown contained on the dark spotlit frame.
// `credit`: required by the licence (Creative Commons) or noting the source (manufacturer).
// Replace these with Zstudio's own shots of its gear when they're available.

export interface ImageMeta {
  fit: "cover" | "cutout";
  credit?: { text: string; href: string; license?: string };
}

const henry = (file: string) => ({
  text: "Henry Söderlund",
  href: `https://commons.wikimedia.org/wiki/File:${file}`,
  license: "CC BY 2.0",
});

const manufacturer = (text: string, href: string) => ({ text, href });

export const imageMeta: Record<string, ImageMeta> = {
  // Wikimedia Commons — Creative Commons licensed, attribution required.
  "/equipment/sony-fx3.jpg": {
    fit: "cover",
    credit: henry("Sony_FX3_with_Sony_FE_24mm_F1.4_GM_-_by_Henry_Söderlund_(51061907312,_cropped).jpg"),
  },
  "/equipment/sony-a7siii.jpg": {
    fit: "cover",
    credit: henry("Sony_α7S_III_with_Sony_FE_55mm_F1.8_ZA_-_by_Henry_Söderlund_(50427553021).jpg"),
  },
  "/equipment/sigma-24-70.jpg": { fit: "cover", credit: henry("Sigma_24-70mm_F2.8_DG_DN_Art_01.jpg") },
  "/equipment/rodecaster-pro.jpg": {
    fit: "cover",
    credit: {
      text: "TaurusEmerald",
      href: "https://commons.wikimedia.org/wiki/File:Rode_RodeCaster_Pro.jpg",
      license: "CC BY-SA 4.0",
    },
  },

  // Manufacturer product images — copyright the manufacturer.
  "/equipment/aputure-600d-pro.png": {
    fit: "cutout",
    credit: manufacturer("Aputure", "https://aputure.com/en-US/products/ls-600d-pro"),
  },
  "/equipment/amaran-200x.png": {
    fit: "cutout",
    credit: manufacturer("amaran", "https://amarancreators.com/products/amaran-200x-s"),
  },
  "/equipment/light-dome.png": {
    fit: "cutout",
    credit: manufacturer("Aputure", "https://aputure.com/en-US/products/light-dome-iii"),
  },
  "/equipment/dji-rs4.png": { fit: "cutout", credit: manufacturer("DJI", "https://www.dji.com/rs-4") },
  "/equipment/backdrop-paper.jpg": {
    fit: "cutout",
    credit: manufacturer("Savage Universal", "https://savageuniversal.com/"),
  },
  "/equipment/rode-podmic.png": {
    fit: "cutout",
    credit: manufacturer("RØDE", "https://rode.com/en/microphones/broadcast/podmic"),
  },
};

export const isLocalImage = (src: string) => src.startsWith("/");
