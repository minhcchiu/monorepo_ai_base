import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cho phép Next transpile package workspace (types share qua packages/).
  transpilePackages: ["@pp09base/api-contract", "@pp09base/shared-ts"],
};

export default nextConfig;
