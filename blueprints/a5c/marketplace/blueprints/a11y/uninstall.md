# a11y — Uninstall Instructions

## Step 1: Interview the User

Ask what to remove:

1. **Processes and configs only** — Remove babysitter a11y processes but keep lint rules, hooks, workflow, and runtime tooling
2. **Everything** — Remove lint rules, hooks, workflow, runtime packages, and processes
3. **Selective** — Let the user choose which layers to remove

**Warning**: Removing a11y lint rules or the CI workflow will silently drop accessibility coverage. Confirm with the user.

## Step 2: Remove Lint Rules

### React / Next.js

Edit `eslint.config.mjs` and remove the `jsx-a11y` plugin block and its rules.

```bash
npm uninstall eslint-plugin-jsx-a11y
```

### Vue / Nuxt

```bash
npm uninstall eslint-plugin-vuejs-accessibility
```

Remove the `vuejs-accessibility` block from eslint config.

### Angular

```bash
npm uninstall @angular-eslint/eslint-plugin-template
```

Remove the `@angular-eslint/template/*` rules from the template override.

### Plain HTML

```bash
rm -f .htmlhintrc
npm uninstall htmlhint
```

### Django / Flask / Jinja

```bash
rm -f .djlintrc
pip uninstall djlint
```

## Step 3: Remove Pre-commit Hook Entries

### husky + lint-staged

Edit `package.json` and remove the a11y-specific globs from `lint-staged` (e.g. `"*.{jsx,tsx,vue,svelte}"` entries that only run a11y-related commands). If husky and lint-staged were installed solely for this plugin, uninstall:

```bash
npm uninstall husky lint-staged
rm -rf .husky/
```

**Do not remove** husky if it was pre-existing or installed by another plugin (e.g. `testing-suite`).

### pre-commit framework

Edit `.pre-commit-config.yaml` and remove:
- the `djlint/djLint` repo entry
- the local `pa11y-staged` hook

```bash
pre-commit uninstall  # only if this was the sole installer
```

## Step 4: Remove GitHub Actions Workflow

```bash
rm -f .github/workflows/a11y.yml
```

If the a11y jobs were added to an existing workflow, remove only those jobs — do not delete the workflow file.

## Step 5: Remove Runtime Scanning Tools

```bash
# Axe / Playwright
npm uninstall @axe-core/playwright
rm -f tests/a11y.spec.ts

# Lighthouse CI
npm uninstall @lhci/cli
rm -f lighthouserc.json
rm -rf .lighthouseci/

# pa11y
npm uninstall pa11y-ci
rm -f .pa11yci.json
```

**Do not uninstall** `@playwright/test` if other test suites use it — check with the user.

## Step 6: Remove a11y Scripts

Edit `package.json` and delete the `a11y:*` scripts:

```json
{
  "scripts": {
    "a11y:lint": "...",
    "a11y:axe": "...",
    "a11y:lighthouse": "...",
    "a11y:pa11y": "..."
  }
}
```

## Step 7: Remove Processes

```bash
rm -rf .a5c/processes/a11y
```

## Step 8: Remove from Registry

```bash
babysitter plugin:remove-from-registry --plugin-name a11y --project --json
```

## Notes

- Baseline reports and violation snapshots in `playwright-report/`, `.lighthouseci/`, or `pa11y-results/` are not removed — clean manually if desired
- If a11y lint rules were escalated to `'error'` and are now failing builds after uninstall, verify the eslint config no longer references the removed plugins before committing
- CI history from the removed workflow remains in GitHub Actions run history — no action required
