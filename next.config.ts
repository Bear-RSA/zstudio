import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets a local production build run alongside `next dev` without clobbering .next.
  // Unset on Vercel.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  poweredByHeader: false,
};

export default nextConfig;
