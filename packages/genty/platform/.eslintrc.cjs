/* eslint-env node */
module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    project: ["./tsconfig.json"]
  },
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended-type-checked"
  ],
  ignorePatterns: [
    "node_modules/**",
    "dist/**",
    "src/**/__tests__/**",
    "src/harness/agenticTools.ts",
    "src/harness/agenticTools/**",
    "src/harness/backgroundProcessRegistry.ts",
    "src/harness/deferredToolRegistry.ts"
  ],
  overrides: [
    {
      files: [
        "src/cli/commands/harness/resumeRun.ts",
        "src/harness/internal/createRun/orchestration/effects.ts",
        "src/harness/internal/createRun/orchestration/externalPhase.ts",
        "src/harness/internal/createRun/orchestration/internalPhase.ts",
        "src/harness/internal/createRun/output.ts",
        "src/harness/internal/createRun/planProcess/phase.ts",
        "src/harness/internal/createRun/prompts.ts",
        "src/harness/piWrapper.ts"
      ],
      rules: {
        "max-lines": [
          "warn",
          { max: 700, skipBlankLines: false, skipComments: false }
        ]
      }
    }
  ],
  rules: {
    "max-lines": [
      "warn",
      { max: 400, skipBlankLines: false, skipComments: false }
    ],
    "@typescript-eslint/no-unused-vars": [
      "error",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
    ]
  }
};
