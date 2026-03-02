import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    root: path.resolve(__dirname),
    environment: "node",
    include: ["*.test.ts"],
    reporters: ["default", "json"],
    outputFile: {
      json: "../../e2e-artifacts/test-results.json",
    },
    globals: false,
    testTimeout: 30_000,
    hookTimeout: 300_000,
    fileParallelism: false,
  },
});
