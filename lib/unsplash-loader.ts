"use client";

/**
 * next/image loader for the Unsplash CDN (imgix).
 *
 * Unsplash resizes and re-encodes at the edge, so photographs are requested
 * straight from images.unsplash.com at each srcset width instead of being
 * proxied through the Next.js optimizer (which adds a hop and a ~7s upstream
 * timeout that 1 MB+ originals can exceed on slow links).
 *
 * The canonical URL in lib/mock-panoramic-data.ts keeps the broadcast crop
 * (`auto=format&fit=crop&w=1400&q=85`); only `w` and `q` are rewritten here.
 */

interface LoaderArgs {
  src: string;
  width: number;
  quality?: number;
}

export default function unsplashLoader({ src, width, quality }: LoaderArgs): string {
  // Local assets (e.g. /images/…) are served as-is; never parse them as absolute URLs.
  if (src.startsWith("/")) return src;
  const url = new URL(src);
  if (url.hostname !== "images.unsplash.com") return src;
  url.searchParams.set("auto", "format");
  url.searchParams.set("fit", "crop");
  url.searchParams.set("w", String(width));
  url.searchParams.set("q", String(quality ?? 85));
  return url.toString();
}
