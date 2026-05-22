# release-automation — Uninstall Instructions

## Step 1: Interview the User

Ask what to remove:

1. **Workflows and configs only** — Keep CHANGELOG and version history, remove automation
2. **Everything** — Remove configs, workflows, commit-msg hook, and tooling packages
3. **Selective** — Let the user choose which layers to remove

**Warning**: Removing release automation mid-release-cycle can orphan a pending release PR. Finish or close it first.

## Step 2: Remove Release Engine Config

### semantic-release

```bash
rm -f .releaserc.json .releaserc .releaserc.js .releaserc.yml
npm uninstall semantic-release \
  @semantic-release/commit-analyzer \
  @semantic-release/release-notes-generator \
  @semantic-release/changelog \
  @semantic-release/npm \
  @semantic-release/git \
  @semantic-release/github
```

### release-please

```bash
rm -f release-please-config.json .release-please-manifest.json
```

Close any open release-please PRs manually before removing the workflow.

### goreleaser

```bash
rm -f .goreleaser.yml .goreleaser.yaml
```

## Step 3: Remove Commit-msg Hook

### husky + commitlint

```bash
rm -f .husky/commit-msg commitlint.config.mjs commitlint.config.js .commitlintrc.*
npm uninstall @commitlint/cli @commitlint/config-conventional
```

**Do not remove** husky if other plugins (e.g. `a11y`, `testing-suite`) use it.

### pre-commit framework

Edit `.pre-commit-config.yaml` and remove the `conventional-pre-commit` repo entry. If it was the only hook:

```bash
pre-commit uninstall --hook-type commit-msg
```

## Step 4: Remove GitHub Actions Workflows

```bash
rm -f .github/workflows/release.yml
rm -f .github/workflows/pr-title.yml
```

## Step 5: Remove npm Scripts

Edit `package.json` and delete any `release` or `semantic-release` scripts.

## Step 6: Keep or Archive CHANGELOG

Do **not** auto-delete `CHANGELOG.md` — it is historical record. Ask the user explicitly.

## Step 7: Remove Processes

```bash
rm -rf .a5c/processes/release-automation
```

## Step 8: Remove from Registry

```bash
babysitter plugin:remove-from-registry --plugin-name release-automation --project --json
```

## Notes

- Existing git tags and GitHub Releases are **not** removed — clean manually if desired
- If the project was mid-pre-release (`beta`/`rc`), tag the next manual release explicitly to reset the channel
- Secrets (`NPM_TOKEN`, `PYPI_API_TOKEN`) remain in repo settings — rotate or remove via GitHub UI
