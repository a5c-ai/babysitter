# db-migrations-safety — Uninstall Instructions

## Step 1: Interview the User

Ask what to remove:

1. **CI guardrails only** — Keep local squawk/atlas, remove workflow
2. **Everything** — Remove linters, shadow scripts, workflow, PR template
3. **Selective** — Let the user choose which layers to remove

**Warning**: Disabling migration safety mid-sprint can land a table-locking DDL in production. Drain open migration PRs first.

## Step 2: Remove Linters

### squawk

```bash
npm uninstall squawk-cli
rm -f .squawk.toml
# If installed via brew / binary:
# brew uninstall squawk
# rm -f /usr/local/bin/squawk
```

### atlas

```bash
rm -f atlas.hcl
# Keep the binary if it's used outside this project:
# brew uninstall ariga/tap/atlas
```

## Step 3: Remove Shadow DB Script

```bash
rm -f scripts/migrate-shadow.sh
```

Remove corresponding npm script entries from `package.json`.

## Step 4: Remove GitHub Actions Workflow

```bash
rm -f .github/workflows/db-migrations.yml
```

## Step 5: Remove PR Template Section

Edit `.github/pull_request_template.md` and delete the **Migration Safety Checklist** block. Leave the file if other plugins contributed sections.

## Step 6: Remove Pre-commit Entries

Edit `package.json` → `lint-staged` → remove `migrations/*.sql` entry.

Edit `.pre-commit-config.yaml` → remove the `squawk` local hook.

## Step 7: Remove Safe-Migration Template

```bash
rm -f migrations/_TEMPLATE.sql
```

## Step 8: Remove Processes

```bash
rm -rf .a5c/processes/db-migrations-safety
```

## Step 9: Remove from Registry

```bash
babysitter plugin:remove-from-registry --plugin-name db-migrations-safety --project --json
```

## Notes

- Existing migration files are untouched (they belong to the app, not the plugin)
- Shadow DB containers started during CI are ephemeral — no cleanup required
- If the team relied on squawk rules to shape migrations, document manually what "safe migration" means before uninstalling
