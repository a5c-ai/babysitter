import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    env: {
      TZ: 'UTC',
    },
    include: ['src/**/*.test.ts'],
    exclude: ['src/test/e2e/**'],
    globals: false,
    alias: {
      vscode: path.resolve(__dirname, 'src/__mocks__/vscode.ts')
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'lcov', 'json'],
      include: ['src/**/*.ts'],
      exclude: ['src/__mocks__/**', 'src/__fixtures__/**', 'src/**/*.test.ts', 'src/test/**'],
      thresholds: {
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80
      }
    }
  }
});
