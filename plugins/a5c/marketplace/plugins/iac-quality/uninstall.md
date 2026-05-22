# iac-quality — Uninstall Instructions

## Step 1: Interview the User

Ask what to remove:

1. **Processes and configs only** — Remove babysitter IaC processes but keep lint/scan/policy
2. **Everything** — Remove all configs, policies, scripts, workflow, and processes
3. **Selective** — Let the user choose which layers to remove

**Warning**: Removing Checkov and OPA gates silently lets misconfigured infrastructure ship.

## Step 2: Remove tflint

```bash
rm -f .tflint.hcl
# tflint binary left alone — uninstall via brew/curl manually if desired
```

## Step 3: Remove Checkov

```bash
pip uninstall checkov
rm -f .checkov.yaml .checkov.yml
```

Remove `iac:checkov` from `package.json` scripts.

## Step 4: Remove OPA / Conftest Policies

```bash
rm -rf policy/
rm -f scripts/iac-opa.sh
# conftest binary left alone
```

Remove `iac:opa` from scripts.

## Step 5: Remove Pre-commit Hooks

Edit `.pre-commit-config.yaml` and remove:
- the `pre-commit-terraform` repo entry
- the `yamllint` entry (if added only for this plugin)

```bash
pre-commit uninstall  # only if this was the sole installer
```

## Step 6: Remove GitHub Actions Workflow

```bash
rm -f .github/workflows/iac-quality.yml
```

## Step 7: Remove Processes

```bash
rm -rf .a5c/processes/iac-quality
```

## Step 8: Remove from Registry

```bash
babysitter plugin:remove-from-registry --plugin-name iac-quality --project --json
```

## Notes

- Historical Checkov SARIF reports in GitHub code-scanning remain — dismiss manually if desired
- If Checkov was a required branch protection check, update branch protection
- Rego policies in `policy/` may be valuable institutional knowledge — back up before removing
- Generated `tfplan.bin` / `tfplan.json` files should be gitignored and are not removed by this uninstall
