# release-please — Install Instructions

Set up [release-please](https://github.com/googleapis/release-please) via the `googleapis/release-please-action` GitHub Action. Generates release PRs from Conventional Commits, maintains `CHANGELOG.md`, bumps versions, tags, and creates GitHub Releases. Supports single-package repos and manifest-mode monorepos.

## Step 1: Interview the User

### Stage 1: Project Analysis

Before asking questions, analyze the project:
1. Read `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `composer.json`, or equivalent to identify language and release type
2. Detect monorepo structure:
   - `packages/*` with npm workspaces → manifest mode
   - `pnpm-workspace.yaml`, `lerna.json`, `nx.json`, `turbo.json` → manifest mode
   - Single root `package.json` without workspaces → simple mode
3. Check for existing release tooling: `.changeset/`, `.semantic-release.json`, `release.config.js`, `release-drafter.yml`
4. Check for existing Conventional Commits usage: `git log --oneline | head -40`
5. Check for existing `.github/workflows/release.yml` or similar
6. Detect default branch: `main`, `master`, or other
7. Summarize findings to the user

### Stage 2: Mode Selection

Ask the user which mode to configure:

1. **Simple** — Single package at repo root (`release-type: node`/`python`/`go`/etc.)
2. **Manifest** — Monorepo with multiple independently-versioned packages
3. **Hybrid** — Root package plus subpackages (rare; uses manifest)

### Stage 3: Release Type

Ask which release type applies to each package:

| Language / Ecosystem | `release-type` |
|----------------------|----------------|
| Node / npm | `node` |
| Python (PEP 440) | `python` |
| Go | `go` / `go-yoshi` |
| Rust / Cargo | `rust` |
| PHP / Composer | `php` |
| Ruby | `ruby` |
| Java (Maven/Gradle) | `java` |
| Terraform | `terraform-module` |
| Generic / other | `simple` |

### Stage 4: Branch Strategy

Ask:
- Release from which branch? (default: `main`)
- Also cut releases from `staging` / `next`? (default: no)
- Tag prefix per package? (default: `<package>-v` in manifest mode, `v` in simple mode)
- Include component in tag? (default: yes for manifest)

### Stage 5: Changelog & Commit Conventions

Ask:
- Enforce Conventional Commits? (default: yes — install `commitlint` if missing)
- Include all commit types in changelog, or only `feat`/`fix`/`perf`? (default: feat/fix/perf/revert/docs/refactor/deps)
- Group by commit scope? (default: yes)

## Step 2: Install commitlint (Recommended)

```bash
npm install -D @commitlint/cli @commitlint/config-conventional husky
npx husky init
```

Create `commitlint.config.js`:

```javascript
module.exports = { extends: ['@commitlint/config-conventional'] };
```

Add `.husky/commit-msg`:

```bash
npx --no -- commitlint --edit "$1"
```

## Step 3: Simple Mode — Single Package

Create `release-please-config.json`:

```json
{
  "$schema": "https://raw.githubusercontent.com/googleapis/release-please/main/schemas/config.json",
  "release-type": "node",
  "packages": {
    ".": {
      "package-name": "my-package",
      "include-component-in-tag": false,
      "changelog-sections": [
        { "type": "feat", "section": "Features" },
        { "type": "fix", "section": "Bug Fixes" },
        { "type": "perf", "section": "Performance Improvements" },
        { "type": "revert", "section": "Reverts" },
        { "type": "docs", "section": "Documentation" },
        { "type": "refactor", "section": "Code Refactoring" },
        { "type": "deps", "section": "Dependencies" }
      ]
    }
  }
}
```

Create `.release-please-manifest.json` seeded with the current version:

```json
{ ".": "1.0.0" }
```

## Step 4: Manifest Mode — Monorepo

Create `release-please-config.json`:

```json
{
  "$schema": "https://raw.githubusercontent.com/googleapis/release-please/main/schemas/config.json",
  "bootstrap-sha": "<sha-of-first-commit-to-track>",
  "release-type": "node",
  "include-component-in-tag": true,
  "separate-pull-requests": false,
  "plugins": ["node-workspace"],
  "packages": {
    "packages/sdk": { "package-name": "@a5c-ai/sdk", "release-type": "node" },
    "packages/agent-mux/cli": { "package-name": "@a5c-ai/cli", "release-type": "node" },
    "packages/catalog": { "package-name": "@a5c-ai/catalog", "release-type": "node" }
  }
}
```

Seed `.release-please-manifest.json`:

```json
{
  "packages/sdk": "0.1.0",
  "packages/agent-mux/cli": "0.1.0",
  "packages/catalog": "0.1.0"
}
```

The `node-workspace` plugin updates cross-package `dependencies` automatically when a sibling bumps.

## Step 5: Create GitHub Actions Workflow

Create `.github/workflows/release-please.yml`:

```yaml
name: release-please

on:
  push:
    branches: [main]

permissions:
  contents: write
  pull-requests: write
  issues: write

jobs:
  release-please:
    runs-on: ubuntu-latest
    steps:
      - uses: googleapis/release-please-action@v4
        id: release
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          config-file: release-please-config.json
          manifest-file: .release-please-manifest.json

      - uses: actions/checkout@v6
        if: ${{ steps.release.outputs.releases_created }}

      - uses: actions/setup-node@v4
        if: ${{ steps.release.outputs.releases_created }}
        with:
          node-version: 22
          registry-url: 'https://registry.npmjs.org'
          cache: 'npm'

      - run: npm ci
        if: ${{ steps.release.outputs.releases_created }}

      - run: npm run build
        if: ${{ steps.release.outputs.releases_created }}

      - name: Publish to npm
        if: ${{ steps.release.outputs.releases_created }}
        run: npm publish --workspaces --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

For non-Node ecosystems, replace the publish step with the appropriate registry push (`twine upload`, `cargo publish`, `gh release upload`).

## Step 6: Configure PAT for Release PRs (Optional)

`GITHUB_TOKEN` cannot trigger downstream workflows. If you want CI (tests, builds) to run on the release PR, create a PAT or GitHub App token and set it as `RELEASE_PLEASE_TOKEN`:

```yaml
- uses: googleapis/release-please-action@v4
  with:
    token: ${{ secrets.RELEASE_PLEASE_TOKEN }}
```

## Step 7: Bootstrap the First Release

If the repo already has a version, set `bootstrap-sha` in the config to the last commit that should NOT be included in the first auto-generated changelog. Otherwise release-please scans history from the beginning.

Alternatively, seed manually:

```bash
git commit --allow-empty -m "chore: release 1.0.0" -m "Release-As: 1.0.0"
git push origin main
```

## Step 8: Branch Protection

In GitHub branch protection for `main`:
- Require PR before merging
- Allow release-please bot to bypass required reviews (add its identity to the bypass list) OR accept manual approval on each release PR
- Require status checks: CI build + tests

## Step 9: Register Plugin

```bash
babysitter plugin:update-registry --plugin-name release-please --plugin-version 1.0.0 --marketplace-name marketplace --project --json
```

## Step 10: Verify Setup

1. A release PR appears after the next `feat:` or `fix:` commit on `main`
2. Merging the PR creates a tag, a GitHub Release, and publishes artifacts
3. `CHANGELOG.md` is updated with grouped commit sections
4. `.release-please-manifest.json` version matches the published tag
5. commitlint rejects non-conforming commit messages locally

## Reference

- release-please: https://github.com/googleapis/release-please
- release-please-action: https://github.com/googleapis/release-please-action
- Conventional Commits: https://www.conventionalcommits.org/
- Manifest mode: https://github.com/googleapis/release-please/blob/main/docs/manifest-releaser.md
- Customizing changelog sections: https://github.com/googleapis/release-please/blob/main/docs/customizing.md
