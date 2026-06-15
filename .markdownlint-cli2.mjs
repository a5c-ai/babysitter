export default {
  globs: [
    "docs/cli-examples.md",
    "docs/github-actions-setup-babysitter.md",
    "docs/github-actions-setup-claude-code.md",
    "docs/github-actions-setup-codex.md",
    "docs/github-actions-setup-gemini-cli.md",
    "docs/release-pipeline.md",
    "docs/v6-spec-and-roadmap/testing-framework.md",
    "docs/v6-spec-and-roadmap/v6-implementation-roadmap.md",
  ],
  config: {
    default: false,
    MD009: true,
    MD010: true,
    MD012: true,
    MD037: true,
    MD038: true,
    MD047: true,
    MD048: {
      style: "backtick",
    },
  },
};
