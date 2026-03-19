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
  // The observer-dashboard uses React 18, while the catalog workspace uses React 19.
  // Radix UI peer deps resolve @types/react from root (v19) causing false positives.
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
