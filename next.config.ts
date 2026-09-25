import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Ship the z-ai SDK config file (written at build time from
  // ZAI_CONFIG_JSON / ZAI_BASE_URL + ZAI_API_KEY env vars — see
  // scripts/write-zai-config.mjs) into the serverless bundle so the
  // AI features work on Vercel as well.
  outputFileTracingIncludes: {
    "/api/seo/ai": ["./.z-ai-config"],
    "/api/seo/audit": ["./.z-ai-config"],
  },
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
