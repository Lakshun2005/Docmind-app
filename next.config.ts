import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Prevent pdfjs-dist from being bundled into client-side chunks.
  // The legacy build is used only in API routes (server-side Node.js).
  serverExternalPackages: ['pdfjs-dist'],

  // Turbopack (default in Next.js 16) resolveAlias equivalent
  turbopack: {
    resolveAlias: {
      'pdfjs-dist': './node_modules/pdfjs-dist',
    },
  },

  webpack(config) {
    // Deduplicate pdfjs-dist so both react-pdf and any direct import
    // resolve to the same module instance, preventing the
    // "Object.defineProperty called on non-object" runtime error.
    config.resolve.alias = {
      ...config.resolve.alias,
      'pdfjs-dist': path.resolve('./node_modules/pdfjs-dist'),
    };
    return config;
  },
};

export default nextConfig;
