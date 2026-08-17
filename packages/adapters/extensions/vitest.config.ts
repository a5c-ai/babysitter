import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  root: dirname(fileURLToPath(import.meta.url)),
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 10000,
    // The FIX-004 packaged-artifact gate is a standalone script executed by
    // `npm run test:packaged-surface-parity` (it packs the tarball and installs
    // it into a clean temporary consumer); it is not a vitest suite.
    exclude: [...configDefaults.exclude, 'src/__tests__/packaged-surface-parity.test.ts'],
  },
});
