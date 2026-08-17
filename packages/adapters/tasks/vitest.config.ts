import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  root: dirname(fileURLToPath(import.meta.url)),
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // The FIX-012 packaged-surface parity gate is a standalone script executed
    // by `npm run test:packaged-surface-parity` (it packs the tarball and
    // installs it into a clean temporary consumer); it is not a vitest suite.
    exclude: [...configDefaults.exclude, "src/__tests__/packaged-surface-parity.test.ts"],
    reporters: "default",
    globals: false,
    testTimeout: 15000,
  },
});
