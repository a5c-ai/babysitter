import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    reporters: "default",
    globals: false,
    testTimeout: 15000,
  },
});
