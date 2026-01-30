import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Configure allowed image domains if needed
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "github.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },

  // Enable typed routes (moved from experimental in Next.js 16)
  typedRoutes: true,

  // Empty turbopack config to silence the warning
  turbopack: {},

  // Server external packages for better-sqlite3
  serverExternalPackages: ["better-sqlite3"],

  // Output configuration
  output: "standalone",
};

export default nextConfig;
