# secrets-management — Uninstall Instructions

## Step 1: Interview the User

Ask what to remove:

1. **Processes and configs only** — Remove babysitter processes but keep gitleaks/trufflehog/runbook
2. **Everything** — Remove all configs, hooks, workflow, runbook, integration stub, and processes
3. **Selective** — Let the user choose which layers to remove

**Warning**: Removing the secrets scanning workflow silently removes a critical defense. Confirm with the user. Retain the rotation runbook unless certain — it's often a compliance artifact.

## Step 2: Remove gitleaks

```bash
rm -f .gitleaks.toml
# gitleaks binary left alone — brew/action installed
```

## Step 3: Remove Pre-commit Hook

Edit `.pre-commit-config.yaml` and remove the `gitleaks/gitleaks` repo entry.

```bash
pre-commit uninstall  # only if this was the sole installer
```

If the hook was installed via husky, edit `.husky/pre-commit` and remove the gitleaks line.

## Step 4: Remove truffleHog CI Config

Only the workflow references truffleHog — no local config to remove.

## Step 5: Remove `.env.example` Enforcement Script

```bash
rm -f scripts/env-example-check.sh
```

## Step 6: Remove Rotation Runbook

**Only if the user confirms** — this is often a compliance artifact:

```bash
rm -f docs/secrets-rotation.md
```

Prefer to archive (move to `docs/archive/`) instead of deleting.

## Step 7: Remove Vault Integration Stub

```bash
rm -f src/secrets.ts app/secrets.py
# Check for callers first — a direct delete may break builds
```

Uninstall SDKs only if no longer used:

```bash
npm uninstall node-vault
pip uninstall hvac
```

## Step 8: Remove GitHub Actions Workflow

```bash
rm -f .github/workflows/secrets.yml
```

## Step 9: Remove Processes

```bash
rm -rf .a5c/processes/secrets-management
```

## Step 10: Remove from Registry

```bash
babysitter plugin:remove-from-registry --plugin-name secrets-management --project --json
```

## Notes

- Any real secrets previously stored in the backend remain — rotate and remove via the backend's own tooling
- If the secrets scan was a required branch protection check, update branch protection
- Historical gitleaks/trufflehog findings in Actions artifacts remain — rotate per retention policy
- Never rely on deleting the scan to "fix" a reported secret — rotate the secret at its source first
