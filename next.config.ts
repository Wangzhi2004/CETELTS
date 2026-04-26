import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["pg", "pg-native", "@prisma/adapter-pg", "bcryptjs"],
};

export default nextConfig;