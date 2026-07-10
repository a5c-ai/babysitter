import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Scaffold has no tests yet; Phase D authors frozen conformance tests per milestone (ADR-B7).
    passWithNoTests: true,
  },
});
