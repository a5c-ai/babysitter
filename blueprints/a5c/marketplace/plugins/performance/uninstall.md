# performance — Uninstall Instructions

## Step 1: Interview the User

Ask what to remove:

1. **Processes and configs only** — Remove babysitter perf processes but keep budgets, workflow, and load tests
2. **Everything** — Remove budgets, workflow, load tests, installed packages, and processes
3. **Selective** — Let the user choose which layers to remove

**Warning**: Removing bundle budgets or the perf workflow silently drops regression coverage. Confirm with the user.

## Step 2: Remove Bundle Size Budget

### size-limit

```bash
npm uninstall size-limit @size-limit/preset-app
```

Edit `package.json` and remove the `size-limit` block and `perf:size` script.

### bundlesize

```bash
npm uninstall bundlesize
```

Remove the `bundlesize` block from `package.json`.

## Step 3: Remove Lighthouse CI

```bash
npm uninstall @lhci/cli
rm -f lighthouserc.json
rm -rf .lighthouseci/
```

Remove `perf:lighthouse` from scripts.

## Step 4: Remove Load Testing

### k6

```bash
rm -rf perf/load
```

k6 itself is typically installed via brew/package manager — leave it alone unless the user asked to uninstall it.

### Artillery

```bash
npm uninstall artillery
rm -rf perf/load
```

## Step 5: Remove Pre-push Hook

Edit `.husky/pre-push` and remove the `perf:size` line. Do not delete husky itself unless it was installed solely for this plugin.

## Step 6: Remove GitHub Actions Workflow

```bash
rm -f .github/workflows/performance.yml
```

If perf jobs were added to an existing workflow, remove only those jobs.

## Step 7: Remove Processes

```bash
rm -rf .a5c/processes/performance
```

## Step 8: Remove from Registry

```bash
babysitter plugin:remove-from-registry --plugin-name performance --project --json
```

## Notes

- Historical perf reports (`.lighthouseci/`, `k6-results.json`) are not removed — clean manually
- If size-limit was enforcing a budget in a required branch protection check, update branch protection after removal
