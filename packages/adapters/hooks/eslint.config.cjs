/* eslint-env node */
const js = require("@eslint/js");
const tseslint = require("@typescript-eslint/eslint-plugin");
const tsparser = require("@typescript-eslint/parser");
const globals = require("globals");

module.exports = [
  {
    ignores: ["**/dist/**", "node_modules/**", "**/__tests__/**", "**/*.test.ts", "docs/**"]
  },
  {
    linterOptions: {
      reportUnusedDisableDirectives: "off"
    }
  },
  js.configs.recommended,
  {
    files: ["**/src/**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2022
      },
      parser: tsparser,
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
          "./adapter-openclaw/tsconfig.json",
          "./adapter-hermes/tsconfig.json"
        ],
        tsconfigRootDir: __dirname,
        allowAutomaticSingleRunInference: true
      }
    },
    plugins: {
      "@typescript-eslint": tseslint
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      "max-lines": [
        "warn",
        { max: 700, skipBlankLines: true, skipComments: true }
      ],
      "no-unused-vars": "off",
      "no-undef": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unsafe-function-type": "off",
      "@typescript-eslint/no-unnecessary-type-assertion": "off",
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_"
        }
      ]
    }
  }
];
