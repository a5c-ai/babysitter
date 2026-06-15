# pr-templates — Uninstall Instructions

## Step 1: Interview the User

Ask what to remove:

1. **Workflows only** — Keep templates, remove title-lint and size-labeler
2. **Everything** — Remove templates, issue forms, workflows, labels
3. **Selective** — Let the user choose which layers to remove

**Warning**: Removing templates mid-sprint leaves new issues/PRs without structure. Coordinate with the triage team before removing.

## Step 2: Remove PR Templates

```bash
rm -f .github/pull_request_template.md
rm -rf .github/PULL_REQUEST_TEMPLATE/
```

## Step 3: Remove Issue Forms

```bash
rm -rf .github/ISSUE_TEMPLATE/
```

Keep `config.yml` if `blank_issues_enabled: false` is desired independently.

## Step 4: Remove Workflows

```bash
rm -f .github/workflows/pr-title.yml
rm -f .github/workflows/pr-size.yml
```

## Step 5: Remove Size Labels (Optional)

```bash
for L in size/XS size/S size/M size/L size/XL; do
  gh label delete "$L" --yes
done
```

Labels already applied to PRs remain until manually removed. Consider leaving them as historical context.

## Step 6: Remove Label Seed Script

```bash
rm -f scripts/seed-labels.sh
```

## Step 7: Remove Processes

```bash
rm -rf .a5c/processes/pr-templates
```

## Step 8: Remove from Registry

```bash
babysitter plugin:remove-from-registry --plugin-name pr-templates --project --json
```

## Notes

- Existing PRs keep their current size labels; no automation re-evaluates them
- If the `release-automation` plugin relied on the semantic-PR title lint, uninstall both together or keep at least one title enforcement layer (commit-msg hook works too)
- Contact links in `.github/ISSUE_TEMPLATE/config.yml` are removed along with the directory — re-add manually if still needed
