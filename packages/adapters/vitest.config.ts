import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');

export default defineConfig({
  resolve: {
    alias: {
      '@a5c-ai/agent-catalog': path.resolve(rootDir, 'packages/atlas/src/catalog/index.ts'),
      '@a5c-ai/atlas/catalog': path.resolve(rootDir, 'packages/atlas/src/catalog/index.ts'),
      'next/server': path.resolve(rootDir, 'test-shims/next-server.ts'),
      'react-native': path.resolve(rootDir, 'test-shims/react-native.ts'),
    },
  },
  test: {
    include: [
      'packages/adapters/*/src/**/*.test.{ts,tsx}',
      'packages/adapters/*/tests/**/*.test.{ts,tsx}',
      'packages/adapters/tests/**/*.test.{ts,tsx}',
    ],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['packages/adapters/*/src/**/*.ts'],
      exclude: [
        'packages/adapters/*/src/**/*.test.ts',
        '**/index.ts',
      ],
      reporter: ['text', 'json-summary', 'html'],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 50,
        statements: 60,
      },
    },
  },
});
