# changelog-enforcer — Configuration

## 1. Configuration Options Table

| Option | Values | Default | Where |
|--------|--------|---------|-------|
| `implementation` | `dangoslen`, `changesets`, `release-please`, `shell` | `dangoslen` | workflow file |
| `changelogPath` | path | `CHANGELOG.md` | enforcer `changeLogPath` |
| `format` | `keep-a-changelog`, `conventional`, `custom` | `keep-a-changelog` | file contents |
| `skipLabels` | csv | `skip-changelog,dependencies,docs-only,release` | enforcer `skipLabels` |
| `enforceOnDraft` | `on`, `off` | `off` | workflow `if:` filter |
| `expectLatestVersion` | semver | (empty) | enforcer `expectedLatestVersion` |
| `perPackage` | `on`, `off` | `off` | monorepo — use changesets |
| `monorepoBumpPolicy` | `patch`, `minor`, `major`, `prompt` | `prompt` | changesets config |
| `autoFormat` | `on`, `off` | `off` | `keep-a-changelog` lint |
| `ciProvider` | `github`, `gitlab`, `circleci`, `buildkite` | `github` | workflow file location |

## 2. Change Skip Labels

Edit `.github/workflows/changelog-enforcer.yml`:

```yaml
with:
  skipLabels: 'skip-changelog,internal,ci-only'
```

Add corresponding labels:

```bash
gh label create internal --color EDEDED --description "Internal change; no CHANGELOG entry"
gh label create ci-only  --color EDEDED --description "CI config only"
```

## 3. Require a Specific Version Header

If releases are formally versioned in each PR (rare — most projects promote on release):

```yaml
with:
  expectedLatestVersion: '0.5.0'
```

The enforcer will fail the PR if `## [0.5.0]` is not the most recent section.

## 4. Allow Docs-only PRs

Default `docs-only` label works. To auto-apply it:

Create `.github/labeler.yml`:

```yaml
docs-only:
  - changed-files:
      - any-glob-to-all-files: ['docs/**', '**/*.md', 'README.md']
```

Add workflow `.github/workflows/labeler.yml`:

```yaml
on: [pull_request_target]
jobs:
  label:
    permissions: { contents: read, pull-requests: write }
    runs-on: ubuntu-latest
    steps:
      - uses: actions/labeler@v5
```

## 5. Switch to Conventional Changelog

```bash
npm install -D conventional-changelog-cli
```

```json
{
  "scripts": {
    "changelog:gen": "conventional-changelog -p angular -i CHANGELOG.md -s"
  }
}
```

Run on release:

```bash
npm run changelog:gen
git add CHANGELOG.md
git commit -m "chore(release): update changelog"
```

The enforcer still gates PRs — contributors add entries manually; the generator rewrites on release.

## 6. Switch to release-please

Remove the enforcer workflow and install:

```yaml
# .github/workflows/release-please.yml
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
          release-type: node
```

Contributors now write conventional-commit messages; release-please opens a rolling PR updating CHANGELOG + version.

## 7. Monorepo Per-Package Changelogs with Changesets

`.changeset/config.json`:

```json
{
  "changelog": ["@changesets/changelog-github", { "repo": "org/repo" }],
  "commit": false,
  "access": "restricted",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

Every PR with a user-facing change includes a `.changeset/<slug>.md` file describing the bump.

## 8. Auto-format CHANGELOG on Commit

Husky + lint-staged:

```json
{
  "lint-staged": {
    "CHANGELOG.md": ["keep-a-changelog --format", "git add"]
  }
}
```

## 9. Customize Error Message

Edit the `missingUpdateErrorMessage:` in the workflow. Keep it short, actionable, and link to the CHANGELOG section where the entry belongs:

```yaml
missingUpdateErrorMessage: |
  Please add a one-line entry under `## [Unreleased]` in CHANGELOG.md
  describing the user-visible effect of this change.
  If this PR does not affect users, apply the `skip-changelog` label.
```

## 10. Exempt Bot Authors Entirely

Add to workflow top-level `if:`:

```yaml
jobs:
  enforce:
    if: >
      !contains(github.event.pull_request.labels.*.name, 'skip-changelog') &&
      !endsWith(github.event.pull_request.user.login, '[bot]')
```

## 11. Scheduled Stale-Unreleased Reminder

If `## [Unreleased]` has entries older than 30 days without a release:

```yaml
on:
  schedule:
    - cron: '0 9 * * 1'
jobs:
  stale:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - name: Warn if Unreleased is stale
        run: |
          last=$(git log -1 --format=%ct -- CHANGELOG.md)
          age=$(( ( $(date +%s) - last ) / 86400 ))
          if [ "$age" -gt 30 ]; then
            gh issue create --title "CHANGELOG Unreleased is ${age} days stale" --body "Consider cutting a release."
          fi
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```
