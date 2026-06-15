/* eslint-env node */
const js = require("@eslint/js");
const tseslint = require("@typescript-eslint/eslint-plugin");
const tsparser = require("@typescript-eslint/parser");
const globals = require("globals");

module.exports = [
  {
    ignores: ["**/dist/**", "node_modules/**", "**/__tests__/**", "**/*.test.ts"]
  },
  {
    linterOptions: {
      reportUnusedDisableDirectives: "off"
    }
  },
  js.configs.recommended,
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2022
      },
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module"
      }
    },
    plugins: {
      "@typescript-eslint": tseslint
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      "no-redeclare": "off",
      "no-undef": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          "argsIgnorePattern": "^_",
          "varsIgnorePattern": "^_",
          "caughtErrors": "none",
          "caughtErrorsIgnorePattern": "^_"
        }
      ]
    }
  }
];
