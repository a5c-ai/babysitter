# release-automation — Install Instructions

Automate semantic versioning, changelog generation, and release publishing for your project — conventional commit enforcement, semantic-release or release-please wiring, and a GitHub Actions workflow that cuts tagged releases on merge. Per-stack recommendations for Node, Python, and Go.

## Step 1: Interview the User

### Stage 1: Project Analysis

Before asking questions, analyze the project:
1. Read `package.json`, `pyproject.toml`, `go.mod`, or equivalent to identify language
2. Detect release stack:
   - Node: `package.json` present, publishes to npm or GitHub Packages
   - Python: `pyproject.toml` / `setup.py`, publishes to PyPI
   - Go: `go.mod`, releases via git tags + goreleaser
3. Check for existing release tooling: `.releaserc*`, `release-please-config.json`, `.goreleaser.yml`, `CHANGELOG.md`
4. Check for existing commit-lint: `commitlint.config.*`, `.commitlintrc*`, `.husky/commit-msg`
5. Check for existing CI/CD: `.github/workflows/`
6. Inspect commit history for existing conventions: `git log --oneline -50`
7. Summarize findings to the user

### Stage 2: Release Tool Selection

Ask which automation engine to install (single-select):

1. **semantic-release** — Node-centric, plugin-rich, publishes + tags + changelog in one step (default for Node)
2. **release-please** — Google's tool, PR-based, supports Node, Python, Go monorepos (default for Python and Go)
3. **goreleaser** — Go-native, cross-compile + archive + homebrew tap (default for Go binaries)

### Stage 3: Conventional Commits Policy

Ask:
- Enforce conventional commits via commit-msg hook? (default: yes)
- Allowed types: `feat,fix,docs,style,refactor,perf,test,build,ci,chore,revert` (default)
- Scopes required? (default: optional)
- Breaking-change notation: `!` in type or `BREAKING CHANGE:` footer (both supported)

### Stage 4: Versioning & Publishing

Ask:
- Initial version: `0.1.0`, `1.0.0`, or continue from existing tag (default: detect from `git tag --list`)
- Pre-release channels: `alpha`, `beta`, `rc`, `next` (default: `beta` + `next`)
- Publish target:
  - Node: npm registry / GitHub Packages / private
  - Python: PyPI / TestPyPI / private
  - Go: GitHub Releases (binaries via goreleaser)

### Stage 5: Branch Strategy

Ask:
- Release branch(es): `main` (default), `staging`, `next`
- Maintenance branches: `1.x`, `2.x` (default: none)
- Who can trigger releases: CI-only (default) or manual `workflow_dispatch`

## Step 2: Install Conventional Commit Enforcement

### Node stacks

```bash
npm install -D @commitlint/cli @commitlint/config-conventional husky
npx husky init
```

Create `commitlint.config.mjs`:

```javascript
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', [
      'feat', 'fix', 'docs', 'style', 'refactor', 'perf',
      'test', 'build', 'ci', 'chore', 'revert'
    ]],
    'subject-case': [2, 'never', ['start-case', 'pascal-case']],
  },
};
```

Add to `.husky/commit-msg`:

```bash
npx --no-install commitlint --edit "$1"
```

### Python / Go stacks (pre-commit framework)

```bash
pip install pre-commit
```

Add to `.pre-commit-config.yaml`:

```yaml
repos:
  - repo: https://github.com/compilerla/conventional-pre-commit
    rev: v3.6.0
    hooks:
      - id: conventional-pre-commit
        stages: [commit-msg]
        args: [feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert]
```

```bash
pre-commit install --hook-type commit-msg
```

## Step 3: Install Release Engine

### semantic-release (Node)

```bash
npm install -D semantic-release \
  @semantic-release/commit-analyzer \
  @semantic-release/release-notes-generator \
  @semantic-release/changelog \
  @semantic-release/npm \
  @semantic-release/git \
  @semantic-release/github
```

Create `.releaserc.json`:

```json
{
  "branches": ["main", { "name": "staging", "prerelease": "beta" }],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    ["@semantic-release/changelog", { "changelogFile": "CHANGELOG.md" }],
    "@semantic-release/npm",
    ["@semantic-release/git", {
      "assets": ["CHANGELOG.md", "package.json", "package-lock.json"],
      "message": "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}"
    }],
    "@semantic-release/github"
  ]
}
```

### release-please (Node / Python / Go monorepos)

Create `release-please-config.json`:

```json
{
  "release-type": "node",
  "packages": {
    ".": { "package-name": "my-package" }
  },
  "changelog-sections": [
    { "type": "feat", "section": "Features" },
    { "type": "fix", "section": "Bug Fixes" },
    { "type": "perf", "section": "Performance" },
    { "type": "revert", "section": "Reverts" }
  ]
}
```

Create `.release-please-manifest.json`:

```json
{ ".": "0.1.0" }
```

For Python swap `"release-type": "python"`; for Go use `"go"` or `"go-yoshi"`.

### goreleaser (Go binaries)

```bash
go install github.com/goreleaser/goreleaser/v2@latest
goreleaser init
```

Edit `.goreleaser.yml`:

```yaml
version: 2
builds:
  - env: [CGO_ENABLED=0]
    goos: [linux, darwin, windows]
    goarch: [amd64, arm64]
archives:
  - format_overrides:
      - goos: windows
        format: zip
changelog:
  use: github
  sort: asc
  groups:
    - title: Features
      regexp: '^feat'
    - title: Bug Fixes
      regexp: '^fix'
```

## Step 4: Create GitHub Actions Release Workflow

### semantic-release workflow

Create `.github/workflows/release.yml`:

```yaml
name: Release
on:
  push:
    branches: [main, staging]
permissions:
  contents: write
  issues: write
  pull-requests: write
  id-token: write
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
        with: { fetch-depth: 0, persist-credentials: false }
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: 'npm', registry-url: 'https://registry.npmjs.org' }
      - run: npm ci
      - run: npm run build --if-present
      - run: npm test --if-present
      - run: npx semantic-release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### release-please workflow

```yaml
name: Release Please
on:
  push:
    branches: [main]
permissions:
  contents: write
  pull-requests: write
jobs:
  release-please:
    runs-on: ubuntu-latest
    steps:
      - uses: googleapis/release-please-action@v4
        with:
          config-file: release-please-config.json
          manifest-file: .release-please-manifest.json
```

### goreleaser workflow

```yaml
name: GoReleaser
on:
  push:
    tags: ['v*']
permissions:
  contents: write
jobs:
  goreleaser:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
        with: { fetch-depth: 0 }
      - uses: actions/setup-go@v5
        with: { go-version: stable }
      - uses: goreleaser/goreleaser-action@v6
        with: { version: latest, args: release --clean }
        env: { GITHUB_TOKEN: '${{ secrets.GITHUB_TOKEN }}' }
```

## Step 5: Seed CHANGELOG and Baseline Tag

```bash
touch CHANGELOG.md
git tag v0.0.0 2>/dev/null || true
```

Commit:

```bash
git add CHANGELOG.md .releaserc.json .github/workflows/release.yml
git commit -m "chore: add release automation"
```

## Step 6: Add PR Title Lint (Optional but Recommended)

Create `.github/workflows/pr-title.yml`:

```yaml
name: PR Title
on:
  pull_request:
    types: [opened, edited, synchronize]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: amannn/action-semantic-pull-request@v5
        env: { GITHUB_TOKEN: '${{ secrets.GITHUB_TOKEN }}' }
```

## Step 7: Configure Secrets

Provide the user with the list of required secrets:

- `NPM_TOKEN` — only if publishing to npm
- `PYPI_API_TOKEN` — only for Python
- `GITHUB_TOKEN` — auto-provided
- Optional: `SLACK_WEBHOOK` for release announcements

## Step 8: Register Plugin

```bash
babysitter plugin:update-registry --plugin-name release-automation --plugin-version 1.0.0 --marketplace-name marketplace --project --json
```

## Step 9: Verify Setup

1. Commit-msg hook rejects `"bad message"` but accepts `"feat: add thing"`
2. Release workflow runs on merge to `main`
3. CHANGELOG.md is updated automatically
4. First release produces a tag (`vX.Y.Z`) and GitHub Release
5. `.releaserc.json` / `release-please-config.json` / `.goreleaser.yml` committed
6. User knows how to bypass commit-msg in emergencies: `git commit --no-verify`

## Reference

- Conventional Commits: https://www.conventionalcommits.org/
- semantic-release: https://semantic-release.gitbook.io/
- release-please: https://github.com/googleapis/release-please
- goreleaser: https://goreleaser.com/
