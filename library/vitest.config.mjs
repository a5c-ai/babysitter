import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: __dirname,
  test: {
    include: ['__tests__/**/*.test.mjs'],
    testTimeout: 15000,
    hookTimeout: 15000,
  },
});
