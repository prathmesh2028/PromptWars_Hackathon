import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for Docker: generates a minimal self-contained server bundle
  output: "standalone",
};

export default nextConfig;
