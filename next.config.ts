import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the project root so Next doesn't get confused by other lockfiles
  // elsewhere on the machine.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
