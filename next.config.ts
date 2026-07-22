import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Local video fallback (Blob client uploads bypass this on Vercel)
      bodySizeLimit: "100mb",
    },
  },
};

export default nextConfig;
