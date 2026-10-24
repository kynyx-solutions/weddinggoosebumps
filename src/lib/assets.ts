export const ASSET_BASE = process.env.NEXT_PUBLIC_ASSET_BASE ?? "https://img.weddinggoosebumps.com"; // R2 CDN

// Public paths served from the R2 CDN: next.config.ts rewrites them, and
// cloudflare-worker.ts sends image optimization for them straight to the CDN.
export const CDN_PATH_PREFIXES = [
  "logo",
  "about",
  "about-page",
  "footer",
  "galleries-page",
  "gallery",
  "journal-section",
  "kind-words-section",
  "quintessential-section",
  "service-level-section",
  "offerings-page",
  "videos",
  "inquire-page",
  // admin uploads (src/lib/r2.ts); a file still in public/uploads is served before this rewrite
  "uploads",
];

export function r2(path: string) {
  const clean = path.replace(/^\/+/, "");
  // Let Next.js / the browser handle encoding; do not pre-encode to avoid %2520
  return `${ASSET_BASE}/${clean}`;
}
