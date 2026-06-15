/* eslint-env node */
module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true
  },
  extends: ["eslint:recommended"],
  ignorePatterns: ["node_modules/**", "dist/**"],
  rules: {
    "max-lines": [
      "warn",
      { max: 400, skipBlankLines: false, skipComments: false }
    ]
  }
};
