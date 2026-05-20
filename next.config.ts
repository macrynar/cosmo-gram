import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["tz-lookup", "astronomy-engine"],
};

export default nextConfig;
