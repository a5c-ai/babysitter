# auto-labeler — Uninstall Instructions

## Step 1: Interview the User

Ask what to remove:

1. **Workflows only** — Keep labels for manual use, remove automation
2. **Everything** — Remove workflows, config, and labels
3. **Selective** — Let the user choose which layers to remove

**Warning**: Labels already applied to PRs remain. Release tooling that keys off `release/*` labels will stop reacting to new PRs after removal.

## Step 2: Remove Workflows

```bash
rm -f .github/workflows/labeler.yml
rm -f .github/workflows/label-type.yml
rm -f .github/workflows/label-size.yml
```

## Step 3: Remove Labeler Config

```bash
rm -f .github/labeler.yml
```

## Step 4: Remove Label Seed Script

```bash
rm -f scripts/seed-labels.sh
```

## Step 5: Remove Labels (Optional, Namespaced Only)

Only delete labels created by this plugin. Leave community labels (`bug`, `enhancement`, `good first issue`) alone.

```bash
for L in area/sdk area/catalog area/cli area/docs area/ci area/deps area/tests \
         type/feat type/fix type/docs type/chore type/refactor type/perf type/test \
         release/major release/minor release/patch \
         lang/typescript lang/python lang/sql \
         manual-label; do
  gh label delete "$L" --yes 2>/dev/null || true
done
```

## Step 6: Remove Processes

```bash
rm -rf .a5c/processes/auto-labeler
```

## Step 7: Remove from Registry

```bash
babysitter plugin:remove-from-registry --plugin-name auto-labeler --project --json
```

## Notes

- If `pr-templates` plugin also manages size labels, leave `size/*` labels in place
- If `release-automation` plugin uses `release/*` labels, coordinate removal — semantic-release will still work via commit analysis, but label-based release tools will not
- Triage dashboards that filter by label namespaces should be audited after removal
