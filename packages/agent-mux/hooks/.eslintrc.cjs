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
    project: [
      "./core/tsconfig.json",
      "./cli/tsconfig.json",
      "./adapter-claude/tsconfig.json",
      "./adapter-codex/tsconfig.json",
      "./adapter-gemini/tsconfig.json",
      "./adapter-copilot/tsconfig.json",
      "./adapter-cursor/tsconfig.json",
      "./adapter-pi/tsconfig.json",
      "./adapter-oh-my-pi/tsconfig.json",
      "./adapter-opencode/tsconfig.json",
      "./adapter-openclaw/tsconfig.json"
    ],
    tsconfigRootDir: __dirname,
    allowAutomaticSingleRunInference: true
  },
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended-type-checked"
  ],
  ignorePatterns: ["**/dist/**", "node_modules/**", "**/__tests__/**", "docs/**"],
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
