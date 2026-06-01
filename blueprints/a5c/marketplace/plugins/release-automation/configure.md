# release-automation — Configuration

## 1. Configuration Options Table

| Option | Values | Default | Where |
|--------|--------|---------|-------|
| `engine` | `semantic-release`, `release-please`, `goreleaser` | stack-derived | config file presence |
| `releaseBranches` | array of branch names | `['main']` | `.releaserc.json` `branches` |
| `prereleaseChannel` | `alpha`, `beta`, `rc`, `next`, `off` | `beta` | `branches[].prerelease` |
| `publishTarget` | `npm`, `pypi`, `github-packages`, `none` | stack-derived | plugin list |
| `commitTypes` | conventional type list | `feat,fix,docs,...` | `commitlint.config` |
| `requireScopes` | `on`, `off` | `off` | `commitlint` `scope-empty` |
| `prTitleLint` | `on`, `off` | `on` | `.github/workflows/pr-title.yml` |
| `changelogFile` | path | `CHANGELOG.md` | `@semantic-release/changelog` |
| `autoMergePrRelease` | `on`, `off` | `off` | release-please labels |
| `breakingChangeBump` | `major`, `minor` | `major` | `commit-analyzer` preset |
| `versionBumpCommitSkip` | `on`, `off` | `on` | `[skip ci]` in commit msg |
| `signTags` | `on`, `off` | `off` | `@semantic-release/git` `gitUserSigningkey` |

## 2. Change Release Branches

Edit `.releaserc.json`:

```json
{
  "branches": [
    "main",
    { "name": "staging", "prerelease": "beta" },
    { "name": "next", "prerelease": "rc" },
    "1.x"
  ]
}
```

For release-please, add to `release-please-config.json`:

```json
{ "release-type": "node", "include-v-in-tag": true, "bootstrap-sha": "<sha>" }
```

## 3. Switch Publishing Target

### npm → GitHub Packages

```json
{
  "plugins": [
    ["@semantic-release/npm", { "npmPublish": true, "pkgRoot": "." }]
  ]
}
```

Add `.npmrc`:

```
@your-scope:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

### Disable publishing (tags + changelog only)

```json
["@semantic-release/npm", { "npmPublish": false }]
```

## 4. Adjust Commit-type → Version-bump Mapping

```json
{
  "plugins": [
    ["@semantic-release/commit-analyzer", {
      "preset": "conventionalcommits",
      "releaseRules": [
        { "type": "docs", "release": "patch" },
        { "type": "refactor", "release": "patch" },
        { "scope": "no-release", "release": false }
      ]
    }]
  ]
}
```

## 5. Change Changelog Sections

release-please:

```json
{
  "changelog-sections": [
    { "type": "feat", "section": "Features" },
    { "type": "fix", "section": "Bug Fixes" },
    { "type": "deps", "section": "Dependencies", "hidden": false }
  ]
}
```

## 6. Add Slack / Discord Announcements

```bash
npm install -D @semantic-release/exec
```

```json
["@semantic-release/exec", {
  "publishCmd": "curl -X POST -H 'Content-type: application/json' --data '{\"text\":\"Released ${nextRelease.version}\"}' $SLACK_WEBHOOK"
}]
```

## 7. Monorepo Mode (release-please)

```json
{
  "packages": {
    "packages/sdk": { "package-name": "@scope/sdk", "release-type": "node" },
    "packages/agent-mux/cli": { "package-name": "@scope/cli", "release-type": "node" }
  },
  "separate-pull-requests": true
}
```

## 8. Pre-release Testing

Trigger a dry run locally before enabling CI publishing:

```bash
npx semantic-release --dry-run --no-ci
```

## 9. Rollback a Bad Release

```bash
# Delete remote tag + GitHub release
gh release delete vX.Y.Z --yes
git push origin :refs/tags/vX.Y.Z

# Unpublish from npm (within 72h)
npm unpublish my-pkg@X.Y.Z
```

## 10. Fix Commit History Before First Release

Run the babysitter convergence process:

```bash
babysitter run:create \
  --process-id release-conventional-cleanup \
  --entry .a5c/processes/release/conventional-cleanup.js#process \
  --prompt "Rewrite recent commit messages to conventional-commits format without rewriting already-pushed history" \
  --json
```

## 11. Disable Hook for a Single Commit

```bash
git commit --no-verify -m "emergency fix"
```

Use sparingly — the next conventional commit will pick the bump correctly.
