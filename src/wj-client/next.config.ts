import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
    ],
  },

  // Performance optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === "production" ? {
      exclude: ["error", "warn"],
    } : false,
  },

  // Memory optimization settings
  experimental: {
    // Reduce memory usage during compilation
    optimizePackageImports: ['recharts', '@tanstack/react-query', '@tanstack/react-table'],
    // Optimize server actions
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // Explicit turbopack config for Next.js 16
  turbopack: {},
};

export default nextConfig;
