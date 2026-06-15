# container-security — Uninstall Instructions

## Step 1: Interview the User

Ask what to remove:

1. **Processes and configs only** — Remove babysitter processes but keep scanners/lint
2. **Everything** — Remove all configs, scripts, workflow, and processes
3. **Selective** — Let the user choose which layers to remove

**Warning**: Removing Trivy and hadolint gates silently lets vulnerable containers ship.

## Step 2: Remove hadolint

```bash
rm -f .hadolint.yaml .hadolint.yml
# hadolint binary left alone — brew/docker installed
```

Remove `container:lint` from `package.json` scripts.

## Step 3: Remove Trivy

```bash
rm -f .trivyignore
# trivy binary left alone — brew/docker installed
```

Remove `container:build`, `container:scan`, `container:scan-fs` from scripts.

## Step 4: Remove Posture Checklist

```bash
rm -f docs/container-security-checklist.md
rm -f scripts/container-posture.sh
```

Remove `container:posture` from scripts.

## Step 5: Remove Compose Lint

```bash
rm -f scripts/compose-lint.sh
```

Remove `container:compose-lint` from scripts.

## Step 6: Remove Pre-commit Hook

Edit `package.json` and remove Dockerfile / compose globs from `lint-staged`. Do not uninstall husky unless installed solely for this plugin.

## Step 7: Remove GitHub Actions Workflow

```bash
rm -f .github/workflows/container-security.yml
```

## Step 8: Remove Processes

```bash
rm -rf .a5c/processes/container-security
```

## Step 9: Remove from Registry

```bash
babysitter plugin:remove-from-registry --plugin-name container-security --project --json
```

## Notes

- `.trivyignore` may contain documented exceptions — archive if needed before removing
- If Trivy scan was a required branch protection check, update branch protection
- Historical scan results in Actions artifacts remain — rotate per retention policy
