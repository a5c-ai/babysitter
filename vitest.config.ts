import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
  esbuild: {
    tsconfig: path.resolve(__dirname, 'tsconfig.json'),
  },
  resolve: {
    alias: {
      '@a5c-ai/agent-catalog': path.resolve(__dirname, 'packages/atlas/src/catalog/index.ts'),
      '@a5c-ai/atlas/catalog': path.resolve(__dirname, 'packages/atlas/src/catalog/index.ts'),
      'next/server': path.resolve(__dirname, 'test-shims/next-server.ts'),
      'react-native': path.resolve(__dirname, 'test-shims/react-native.ts'),
      'react-native$': path.resolve(__dirname, 'test-shims/react-native.ts'),
    },
  },
  test: {
    include: [
      'packages/*/src/**/*.test.{ts,tsx}',
      'packages/*/src/**/*.contract.test.{ts,tsx}',
      'packages/*/tests/**/*.test.{ts,tsx}',
      'packages/*/tests/**/*.contract.test.{ts,tsx}',
      'packages/adapters/*/src/**/*.test.{ts,tsx}',
      'packages/adapters/*/src/**/*.contract.test.{ts,tsx}',
      'packages/adapters/*/tests/**/*.test.{ts,tsx}',
      'packages/adapters/*/tests/**/*.contract.test.{ts,tsx}',
    ],
    exclude: [
      '**/node_modules/**',
      '**/.git/**',
      'packages/adapters/webui/**/*.route.test.{ts,tsx}',
    ],
    setupFiles: ['vitest.setup.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['packages/*/src/**/*.ts', 'packages/adapters/*/src/**/*.ts'],
      exclude: [
        'packages/*/src/**/*.test.ts',
        'packages/*/src/**/*.contract.test.ts',
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
};
