import type { NextConfig } from "next";

const buildVersion =
  process.env.VERCEL_DEPLOYMENT_ID ??
  process.env.VERCEL_GIT_COMMIT_SHA ??
  process.env.VERCEL_URL ??
  "development";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_APP_BUILD_VERSION: buildVersion,
  },
};

export default nextConfig;
