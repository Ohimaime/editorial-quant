import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // Campaign photography comes only from the Unsplash CDN, which resizes at
    // the edge: a custom loader requests each srcset width directly
    // (lib/unsplash-loader.ts) instead of proxying through /_next/image.
    loader: "custom",
    loaderFile: "./lib/unsplash-loader.ts",
    // Required since Next.js 16 (quality allowlist).
    qualities: [75, 85],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
