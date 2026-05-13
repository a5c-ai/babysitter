import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = dirname(fileURLToPath(import.meta.url));

const monorepoRoot = join(webRoot, '../../..');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  outputFileTracingRoot: monorepoRoot,
  turbopack: {
    root: monorepoRoot,
    resolveAlias: {
      '@a5c-ai/krate-sdk': '../sdk/src/index.js',
    },
  },
};

nextConfig.webpack = (config) => {
  config.resolve.alias['@a5c-ai/krate-sdk'] = join(webRoot, '../sdk/src/index.js');
  return config;
};

export default nextConfig;
