import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  root: dirname(fileURLToPath(import.meta.url)),
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    reporters: "default",
    globals: false,
    testTimeout: 15000,
  },
});
