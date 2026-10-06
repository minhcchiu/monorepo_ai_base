import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cho phép Next transpile package workspace (types share qua packages/).
  transpilePackages: ["@cloudpulse/api-contract", "@cloudpulse/shared-ts"],
};

export default nextConfig;
