# docs-quality — Uninstall Instructions

## Step 1: Interview the User

Ask what to remove:

1. **Processes and configs only** — Remove babysitter docs processes but keep lint/link/spell/coverage
2. **Everything** — Remove all tooling, configs, workflow, and processes
3. **Selective** — Let the user choose which layers to remove

**Warning**: Removing docs lint/spell/link coverage silently drops documentation quality enforcement.

## Step 2: Remove Markdownlint

```bash
npm uninstall markdownlint-cli2
rm -f .markdownlint-cli2.jsonc .markdownlint.json
```

Remove `docs:lint` from `package.json` scripts.

## Step 3: Remove Link Checker

```bash
rm -f lychee.toml
# lychee binary itself (brew / cargo) left alone — uninstall manually if desired
```

Remove `docs:links` from scripts.

## Step 4: Remove Spell Check

```bash
npm uninstall cspell
rm -f .cspell.json
rm -rf .cspell/
```

Remove `docs:spell` from scripts.

## Step 5: Remove Doc Coverage

```bash
# TypeScript
npm uninstall typedoc typedoc-plugin-coverage

# Python
pip uninstall interrogate
# Edit pyproject.toml and remove [tool.interrogate] block

# Go
# Uninstall godoc-lint manually: rm $(go env GOPATH)/bin/godoc-lint
```

Remove `docs:coverage` from scripts.

## Step 6: Remove Pre-commit Hook

Edit `package.json` and remove markdown globs from `lint-staged`. Do not remove husky itself unless installed solely for this plugin.

## Step 7: Remove GitHub Actions Workflow

```bash
rm -f .github/workflows/docs-quality.yml
rm -f .github/workflows/docs-links-nightly.yml
```

## Step 8: Remove Processes

```bash
rm -rf .a5c/processes/docs-quality
```

## Step 9: Remove from Registry

```bash
babysitter plugin:remove-from-registry --plugin-name docs-quality --project --json
```

## Notes

- Custom terms added to `.cspell/project-terms.txt` are removed with the directory — back up if the list is valuable
- Historical doc-coverage reports are not removed — clean manually
