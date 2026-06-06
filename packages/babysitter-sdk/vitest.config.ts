import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    setupFiles: ["./vitest.setup.ts"],
    reporters: "default",
    globals: false,
    testTimeout: 15000,
    env: {
      GEMINI_CLI: "",
    }
  }
});
