// next.config.ts
import type { NextConfig } from "next";
import { ASSET_BASE, CDN_PATH_PREFIXES } from "./src/lib/assets";
import { mediaOrigin } from "./src/lib/storage";

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
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },

  async rewrites() {
    // Media comes from Cloudinary when its keys are set, otherwise the R2 CDN (src/lib/storage.ts)
    return CDN_PATH_PREFIXES.map((prefix) => ({
      source: `/${prefix}/:path*`,
      destination: `${mediaOrigin(prefix, ASSET_BASE)}/${prefix}/:path*`,
    }));
  },
};

export default nextConfig;
