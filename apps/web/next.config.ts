import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@jobboard/db", "@jobboard/types", "@jobboard/utils"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.digitaloceanspaces.com",
      },
      {
        protocol: "https",
        hostname: "*.cdn.digitaloceanspaces.com",
      },
    ],
  },
};

export default nextConfig;
