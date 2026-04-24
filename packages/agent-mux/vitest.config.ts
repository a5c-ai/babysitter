import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      'packages/agent-mux/*/src/**/*.test.{ts,tsx}',
      'packages/agent-mux/*/tests/**/*.test.{ts,tsx}',
      'packages/agent-mux/tests/**/*.test.{ts,tsx}',
    ],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['packages/agent-mux/*/src/**/*.ts'],
      exclude: [
        'packages/agent-mux/*/src/**/*.test.ts',
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
