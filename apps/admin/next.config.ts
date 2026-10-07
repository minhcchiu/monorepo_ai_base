import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  transpilePackages: ["@cloudpulse/api-contract", "@cloudpulse/shared-ts"],
};

export default nextConfig;
