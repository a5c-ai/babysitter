import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
  },
  // Enable optimized barrel-import tree-shaking for heavy icon libraries.
  // This transforms `import { X } from "lucide-react"` into direct subpath
  // imports at build time, dramatically reducing the amount of module code
  // that webpack must parse and eliminating unused icons from the bundle.
  // Ignore TS errors from @types/react version mismatch in monorepo hoisting.
  // The observer-dashboard uses React 18, while other workspaces use React 19.
  // Radix UI peer deps resolve @types/react from root (v19) causing false positives.
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
    // The babysitter SDK is a server-only CommonJS package (run lock, journal,
    // hooks dispatcher) with heavy transitive deps. Keep it as a runtime
    // require instead of webpack-bundling it into the server action chunk.
    serverComponentsExternalPackages: ['@a5c-ai/babysitter-sdk'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // serverComponentsExternalPackages alone does not survive the monorepo
      // workspace symlink (node_modules/@a5c-ai/babysitter-sdk ->
      // ../../packages/babysitter-sdk): webpack resolves the real path first,
      // the prefix never matches, and the SDK dist gets bundled — dragging in
      // dist/harness/* and its optional adapter requires, which breaks the
      // build. Force every @a5c-ai/babysitter-sdk specifier (root and deep
      // subpaths) to a plain commonjs require in the server build instead.
      config.externals.push(({ request }, callback) => {
        if (request && /^@a5c-ai\/babysitter-sdk(\/|$)/.test(request)) {
          return callback(null, `commonjs ${request}`);
        }
        return callback();
      });
    }
    return config;
  },
};

export default nextConfig;
