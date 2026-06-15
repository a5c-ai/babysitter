// semantic-release configuration with conditional plugins per branch
// - On a5c/main (prerelease channel), avoid @semantic-release/git to prevent protected branch push
// - On main, include git plugin to update CHANGELOG.md and package.json

const commonPlugins = [
  ["@semantic-release/commit-analyzer", {
    preset: "conventionalcommits",
    releaseRules: [
      { type: "chore", release: "patch" },
      { type: "fix", release: "patch" },
      { type: "feat", release: "minor" },
      { type: "refactor", release: "patch" },
      { type: "perf", release: "patch" },
      { type: "revert", release: "patch" },
      { type: "style", release: "patch" },
      { type: "test", release: "patch" },
      { type: "docs", release: "patch" },
      { type: "ci", release: "patch" },
      { type: "build", release: "patch" },
    ],
  }],
  [
    "@semantic-release/release-notes-generator",
    { preset: "conventionalcommits" },
  ],
  ["@semantic-release/changelog", { changelogFile: "CHANGELOG.md" }],
  ["@semantic-release/npm", { npmPublish: true }],
  ["@semantic-release/github", { labels: ["release"] }],
];

function pluginsForBranch(branch) {
  if (branch === "a5c/main") {
    // Avoid direct pushes to protected branch
    return commonPlugins;
  }
  // Default: include git plugin to commit changelog and version bumps
  return [
    ...commonPlugins,
    [
      "@semantic-release/git",
      {
        assets: ["CHANGELOG.md", "package.json"],
        message:
          "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
      },
    ],
  ];
}

module.exports = {
  branches: [
    { name: "a5c/main", channel: "a5c-main", prerelease: "a5c-main" },
    { name: "main" },
  ],
  plugins: pluginsForBranch(
    process.env.GITHUB_REF_NAME || process.env.BRANCH_NAME || "",
  ),
};
