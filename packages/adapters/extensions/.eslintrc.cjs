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
    project: ["./tsconfig.json"],
    allowAutomaticSingleRunInference: true,
  },
  ignorePatterns: ["src/**/__tests__/**"],
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended-type-checked"
  ],
  rules: {
    "max-lines": [
      "warn",
      { "max": 400, "skipBlankLines": false, "skipComments": false }
    ],
    "@typescript-eslint/no-unused-vars": [
      "error",
      { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }
    ]
  }
};
