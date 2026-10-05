import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets a local production build run alongside `next dev` without clobbering .next.
  // Unset on Vercel.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  poweredByHeader: false,
  // Photo qualities the image optimiser may produce (see Media). Next 16 requires this list.
  images: { qualities: [75, 85, 92] },
};

export default nextConfig;
