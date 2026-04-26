import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pg", "pg-native", "@prisma/adapter-pg", "bcryptjs"],
};

export default nextConfig;