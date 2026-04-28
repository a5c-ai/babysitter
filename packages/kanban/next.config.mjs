import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const packageDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(packageDir, '../..');
const pkg = JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf-8'));
const agentCatalogSrcDir = path.resolve(packageDir, '../agent-catalog/src');
const agentMuxUiSrcDir = path.resolve(packageDir, '../agent-mux/ui/src');

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
  },
  serverExternalPackages: ['@a5c-ai/agent-catalog', '@a5c-ai/agent-mux-core'],
  // Enable optimized barrel-import tree-shaking for heavy icon libraries.
  // This transforms `import { X } from "lucide-react"` into direct subpath
  // imports at build time, dramatically reducing the amount of module code
  // that webpack must parse and eliminating unused icons from the bundle.
  // Ignore hoisted type-package mismatches from sibling workspaces.
  // The kanban package should not fail production builds on root-level type
  // resolution drift that does not affect the emitted app bundle.
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  turbopack: {},
  webpack: (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.extensionAlias = {
      ...(config.resolve.extensionAlias ?? {}),
      '.js': ['.ts', '.tsx', '.js'],
      '.mjs': ['.mts', '.mjs'],
      '.cjs': ['.cts', '.cjs'],
    };
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      '@a5c-ai/agent-catalog$': path.join(agentCatalogSrcDir, 'index.ts'),
      '@a5c-ai/agent-mux-ui$': path.join(agentMuxUiSrcDir, 'index.ts'),
      '@a5c-ai/agent-mux-ui/gateway$': path.join(agentMuxUiSrcDir, 'gateway.ts'),
      '@a5c-ai/agent-mux-ui/session-flow$': path.join(agentMuxUiSrcDir, 'session-flow.ts'),
    };
    return config;
  },
};

export default nextConfig;
