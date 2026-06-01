# codeowners — Uninstall Instructions

## Step 1: Interview the User

Ask what to remove:

1. **Automation only** — Keep the `CODEOWNERS` file, remove validation/workflow/scripts
2. **Everything** — Delete the file and all tooling
3. **Selective** — Let the user choose which layers to remove

**Warning**: Deleting `CODEOWNERS` while branch protection requires Code Owner reviews will block all PRs from merging. Remove the branch protection requirement **first**.

## Step 2: Remove Validation Tool

```bash
npm uninstall codeowners-validator
# Or if binary-installed:
# rm -f /usr/local/bin/codeowners-validator
```

Remove the `codeowners:check` script from `package.json`.

## Step 3: Remove Generator Script

```bash
rm -f scripts/gen-codeowners.sh
```

## Step 4: Remove GitHub Actions Workflow

```bash
rm -f .github/workflows/codeowners.yml
```

## Step 5: Remove Pre-commit Entries

Edit `package.json` → `lint-staged` → remove the `.github/CODEOWNERS` entry.

Edit `.pre-commit-config.yaml` → remove the `codeowners-validator` hook.

## Step 6: Remove the CODEOWNERS File (Cautious)

```bash
rm -f .github/CODEOWNERS
```

Before doing this:

1. Disable **Require review from Code Owners** in branch protection
2. Notify maintainers — without CODEOWNERS, GitHub no longer auto-requests reviewers
3. Consider archiving ownership information in `TEAMS.md` or `docs/ownership.md` instead

## Step 7: Rotate CODEOWNERS Token

If a `CODEOWNERS_TOKEN` PAT was created for validation, revoke it in GitHub → Settings → Developer settings → Personal access tokens.

## Step 8: Remove Processes

```bash
rm -rf .a5c/processes/codeowners
```

## Step 9: Remove from Registry

```bash
babysitter plugin:remove-from-registry --plugin-name codeowners --project --json
```

## Notes

- Existing PR reviewer assignments (already requested) are not unassigned
- README references to CODEOWNERS should be cleaned up manually
- Without automation, ownership will drift — consider replacing with a documented manual process
