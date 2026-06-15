import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/adapters/tests/e2e/**/*.test.ts'],
    environment: 'node',
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
