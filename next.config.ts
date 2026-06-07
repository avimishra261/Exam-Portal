import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  outputFileTracingIncludes: {
    '/*': ['./prisma/dev.db'],
  },
  /* config options here */
};

export default nextConfig;
