import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
      "@a5c-ai/atlas": path.resolve(__dirname, "../dist/index.js"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.{ts,tsx}"],
    clearMocks: true,
    restoreMocks: true,
  },
});
