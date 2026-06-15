export default {
  test: {
    include: ["tests/**/*.test.ts", "src/**/*.test.ts"],
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/index.ts", "src/cli.ts"],
      reporter: ["text", "json-summary", "html"],
      thresholds: {
        lines: 50,
        functions: 60,
        branches: 35,
        statements: 50,
      },
    },
  },
};
