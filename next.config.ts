// next.config.ts
import type { NextConfig } from "next";
import { ASSET_BASE, CDN_PATH_PREFIXES } from "./src/lib/assets";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Lets the Cloudflare (OpenNext) build patch the Prisma client for Workers
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  images: {
    formats: ["image/avif", "image/webp"],
    unoptimized: false,
    remotePatterns: [
      { protocol: "https", hostname: "img.weddinggoosebumps.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },

  async rewrites() {
    return CDN_PATH_PREFIXES.map((prefix) => ({
      source: `/${prefix}/:path*`,
      destination: `${ASSET_BASE}/${prefix}/:path*`,
    }));
  },
};

export default nextConfig;
