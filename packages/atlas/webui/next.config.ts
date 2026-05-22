import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // In Docker the workspace is flattened — point root to webui dir itself
    root: process.env.DOCKER_BUILD ? __dirname : `${__dirname}/../../..`,
  },
  serverExternalPackages: ["pg"],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        pg: false,
        "pg-native": false,
      };
    }
    return config;
  },
};

export default nextConfig;
