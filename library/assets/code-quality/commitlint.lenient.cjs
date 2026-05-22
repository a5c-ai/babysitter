module.exports = {
  extends: ["@commitlint/config-conventional"],
  parserPreset: {
    parserOpts: {
      headerPattern:
        /^(?:[^\p{L}\p{N}]+\s*)?(?:(?<type>build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test)(?:\((?<scope>[^)]+)\))?(?<breaking>!)?:\s*)?(?<subject>.+)$/u,
      headerCorrespondence: ["type", "scope", "breaking", "subject"],
    },
  },
  rules: {
    "type-empty": [0],
    "subject-case": [0],
    "scope-case": [2, "always", "kebab-case"],
    "header-max-length": [0],
    "body-max-line-length": [0],
    "footer-max-line-length": [0],
  },
};
