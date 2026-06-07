import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    outputFileTracingIncludes: {
      '/*': ['./prisma/dev.db'],
    },
  },
  /* config options here */
};

export default nextConfig;
