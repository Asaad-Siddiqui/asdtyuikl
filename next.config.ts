import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Next.js blocks cross-origin requests to dev-only assets (/_next/*) by
   * default. When the dev server is reached through a tunnel (ngrok, etc.) the
   * browser's Origin doesn't match, so every JavaScript chunk returns 403 —
   * the page renders but React never hydrates and *no* button works.
   *
   * These entries are hostnames only: no scheme, no port, no path.
   * Only affects `next dev`; production builds are unaffected.
   */
  allowedDevOrigins: [
    "*.ngrok-free.app",
    "*.ngrok-free.dev",
    "*.ngrok.app",
    "*.ngrok.io",
    "*.loca.lt",
    "*.trycloudflare.com",
    "*.devtunnels.ms",
  ],
};

export default nextConfig;
