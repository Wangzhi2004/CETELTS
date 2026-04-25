import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["pg", "pg-native", "wechaty", "wechaty-puppet-wechat", "qrcode-terminal"],
};

export default nextConfig;
