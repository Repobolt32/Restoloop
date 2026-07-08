import type { NextConfig } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const allowedOrigin = siteUrl ? siteUrl.replace(/^https?:\/\//, '') : null;

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: allowedOrigin ? [allowedOrigin] : [],
    },
  },
  allowedDevOrigins: allowedOrigin ? [allowedOrigin] : [],
};

export default nextConfig;
