import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const withSerwist = withSerwistInit({
  // Path to the Service Worker source file (relative to the project root)
  swSrc: "src/app/sw.ts",
  // Output path for the compiled SW (must be inside public/)
  swDest: "public/sw.js",
  // Disable Serwist in development to prevent conflicts with Next.js Fast Refresh
  disable: process.env.NODE_ENV === "development",
  // Scope: root of the app
  scope: "/",
  // The URL the SW will be served from
  swUrl: "/sw.js",
});

const nextConfig: NextConfig = {
  // Suppress Turbopack error: @serwist/next uses webpack plugin;
  // the empty turbopack config tells Next.js this is intentional.
  turbopack: {},
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:8000/:path*", // Proxy to FastAPI Server
      },
    ];
  },
};

export default withSerwist(nextConfig);
