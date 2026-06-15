// Flat config for ESLint v9
// Covers TypeScript in src/ and test files; integrates Prettier via eslint-config-prettier
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import prettier from "eslint-config-prettier";

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  // Global ignores (merge of base + PR)
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "tests/fixtures/**",
      "samples/**",
      "src/**/*.d.ts",
    ],
  },

  // JS files: enable Node/browser globals
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
  },
  // Base JS recommended rules with minor tweaks
  {
    ...js.configs.recommended,
    rules: {
      ...(js.configs.recommended.rules || {}),
      // Allow intentionally empty catch blocks for defensive parsing paths
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },

  // TypeScript support for project files
  ...tseslint.config(
    // Type-aware for src
    {
      files: ["src/**/*.ts"],
      languageOptions: {
        parser: tseslint.parser,
        parserOptions: {
          project: ["./tsconfig.json"],
          tsconfigRootDir: import.meta.dirname,
          sourceType: "module",
          ecmaVersion: "latest",
        },
        globals: { ...globals.node },
      },
      plugins: { "@typescript-eslint": tseslint.plugin },
      extends: [...tseslint.configs.recommended],
      rules: {
        "@typescript-eslint/no-unused-vars": [
          "warn",
          { argsIgnorePattern: "^_" },
        ],
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/ban-ts-comment": "off",
        "no-useless-escape": "off",
        "no-empty": ["error", { allowEmptyCatch: true }],
      },
    },
    // Non-type-aware for tests (avoid requiring project references)
    {
      files: ["test/**/*.ts", "tests/**/*.ts"],
      languageOptions: {
        parser: tseslint.parser,
        parserOptions: { ecmaVersion: "latest", sourceType: "module" },
        globals: { ...globals.node },
      },
      plugins: { "@typescript-eslint": tseslint.plugin },
      extends: [...tseslint.configs.recommended],
      rules: {
        "@typescript-eslint/no-unused-vars": [
          "warn",
          { argsIgnorePattern: "^_" },
        ],
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-require-imports": "off",
        "@typescript-eslint/ban-ts-comment": "off",
        "no-empty": ["error", { allowEmptyCatch: true }],
      },
    },
    { ignores: ["dist/**"] },
  ),

  // Prettier compatibility (disables conflicting stylistic rules)
  prettier,
];
