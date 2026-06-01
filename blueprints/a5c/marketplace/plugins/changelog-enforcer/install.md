# changelog-enforcer — Install Instructions

Set up a CHANGELOG.md gate for your project — scaffold a Keep-a-Changelog file, install `dangoslen/changelog-enforcer` as a GitHub Action (or a custom shell check if you dislike Actions), and fail PR CI when user-facing changes land without a CHANGELOG entry. Skip-labels supported because paperwork-theater helps nobody.

## Step 1: Interview the User

### Stage 1: Project Analysis

Before asking questions, analyze the project:
1. Check for existing CHANGELOG: `CHANGELOG.md`, `CHANGES.md`, `HISTORY.md`, `NEWS`
2. Detect format: Keep-a-Changelog, conventional-changelog, custom, or none
3. Detect versioning system: SemVer in `package.json`, `Cargo.toml`, `pyproject.toml`; git tags; calver
4. Detect release automation: `semantic-release`, `changesets`, `release-please`, manual
5. Detect existing CI: `.github/workflows/`, `.gitlab-ci.yml`, CircleCI, etc.
6. Detect if the project is a monorepo with per-package changelogs
7. Summarize findings to the user

### Stage 2: Enforcer Choice

Ask which implementation to use:

| Tool | Pros | Cons |
|------|------|------|
| **dangoslen/changelog-enforcer** (GitHub Action) | Zero setup, popular, skip-label support | GitHub Actions only |
| **changesets** (`@changesets/cli`) | Rich monorepo support, version bump automation | More moving parts |
| **release-please** (Google) | Conventional-commit driven, PR-based releases | Commit-message discipline required |
| **Custom shell check** | Works on any CI | Reinvents the wheel |

Default: `dangoslen/changelog-enforcer` for single-package repos, `changesets` for monorepos.

### Stage 3: Changelog Format

Ask which format:

1. **Keep a Changelog 1.1** (default) — Added/Changed/Deprecated/Removed/Fixed/Security
2. **Conventional Changelog** — auto-generated from commit messages
3. **Custom** — user-provided template

### Stage 4: Skip Rules

Ask which PRs should bypass the gate:

- Dependabot / Renovate PRs (default: **skip**)
- Docs-only changes (default: **skip** when touching only `docs/`, `*.md`)
- Internal refactors (default: require, but user may override)
- Chore / tooling commits (default: require, but allow via `skip-changelog` label)

### Stage 5: Monorepo Strategy (if applicable)

If monorepo:
- One root CHANGELOG vs. per-package CHANGELOGs
- Use `changesets` for per-package tracking with version bump proposals

## Step 2: Scaffold `CHANGELOG.md`

```bash
cat > CHANGELOG.md << 'EOF'
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
-

### Changed
-

### Deprecated
-

### Removed
-

### Fixed
-

### Security
-

## [0.1.0] - YYYY-MM-DD
- Initial release
EOF
```

If a CHANGELOG already exists, inspect and only add the `[Unreleased]` header if missing.

## Step 3: Install the Enforcer

### Option A — dangoslen/changelog-enforcer

Create `.github/workflows/changelog-enforcer.yml`:

```yaml
name: Changelog

on:
  pull_request:
    types: [opened, synchronize, reopened, labeled, unlabeled]

permissions:
  pull-requests: read
  contents: read

jobs:
  enforce:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: dangoslen/changelog-enforcer@v3
        with:
          changeLogPath: 'CHANGELOG.md'
          skipLabels: 'skip-changelog,dependencies,docs-only,release'
          missingUpdateErrorMessage: |
            This PR is missing a CHANGELOG.md entry under `## [Unreleased]`.
            Add one describing the user-visible change, or apply the `skip-changelog` label if this change truly does not need an entry.
          expectedLatestVersion: ''
```

### Option B — changesets (monorepo)

```bash
npm install -D @changesets/cli
npx changeset init
```

This creates `.changeset/` with config. Add a bot workflow:

```yaml
name: Release

on:
  push:
    branches: [main]

permissions:
  contents: write
  pull-requests: write

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci
      - uses: changesets/action@v1
        with:
          publish: npm run release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

And a PR check:

```yaml
name: Changesets

on:
  pull_request:
    types: [opened, synchronize, reopened, labeled, unlabeled]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
        with: { fetch-depth: 0 }
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci
      - run: npx changeset status --since=origin/${{ github.base_ref }}
```

### Option C — Custom shell check

`.github/workflows/changelog-shell.yml`:

```yaml
name: Changelog (shell)

on:
  pull_request:
    types: [opened, synchronize, reopened, labeled, unlabeled]

jobs:
  check:
    if: ${{ !contains(github.event.pull_request.labels.*.name, 'skip-changelog') }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
        with: { fetch-depth: 0 }
      - name: Verify CHANGELOG.md updated
        run: |
          base=${{ github.event.pull_request.base.sha }}
          head=${{ github.event.pull_request.head.sha }}
          if git diff --name-only "$base" "$head" | grep -qx CHANGELOG.md; then
            echo "CHANGELOG.md updated."
          else
            echo "::error::CHANGELOG.md not updated and 'skip-changelog' label not applied."
            exit 1
          fi
```

## Step 4: Create Skip Labels

```bash
gh label create skip-changelog --description "Bypass CHANGELOG.md enforcement" --color EDEDED
gh label create docs-only      --description "Docs-only change; no CHANGELOG entry needed" --color 0075CA
gh label create dependencies   --description "Dependency bumps (Dependabot/Renovate)" --color 0366D6
gh label create release        --description "Release PR" --color 5319E7
```

## Step 5: PR Template Reminder

Edit (or create) `.github/pull_request_template.md`:

```markdown
## Summary
<what changed and why>

## Changelog
- [ ] CHANGELOG.md entry added under `## [Unreleased]`
- [ ] Or: `skip-changelog` label applied with justification
```

## Step 6: Auto-format CHANGELOG (Optional)

```bash
npm install -D keep-a-changelog
```

Add to `package.json`:

```json
{
  "scripts": {
    "changelog:lint": "keep-a-changelog --format CHANGELOG.md"
  }
}
```

Optionally wire into a lint-staged pre-commit hook for edits to CHANGELOG.md.

## Step 7: Release Flow

On release, promote `## [Unreleased]` entries to a dated version section:

```bash
npm version minor   # bumps package.json + creates tag
# Manually move Unreleased → ## [0.2.0] - YYYY-MM-DD in CHANGELOG.md
# Or use release-please / semantic-release to automate
```

## Step 8: Register Plugin

```bash
babysitter plugin:update-registry --plugin-name changelog-enforcer --plugin-version 1.0.0 --marketplace-name marketplace --project --json
```

## Step 9: Verify Setup

1. `CHANGELOG.md` exists with `## [Unreleased]` section
2. Enforcer workflow triggers on `opened` / `synchronize` / label events
3. PR without CHANGELOG change and without skip label fails the check
4. PR with `skip-changelog` label passes
5. Dependabot PRs pass (via `dependencies` label)
6. PR template lists the CHANGELOG checkbox
7. User knows how to release-promote Unreleased → dated version

## Reference

- Keep a Changelog: https://keepachangelog.com/en/1.1.0/
- dangoslen/changelog-enforcer: https://github.com/dangoslen/changelog-enforcer
- Changesets: https://github.com/changesets/changesets
- release-please: https://github.com/googleapis/release-please
- Semantic Versioning: https://semver.org/
