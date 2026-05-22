# api-contract — Uninstall Instructions

## Step 1: Interview the User

Ask what to remove:

1. **Processes and configs only** — Remove babysitter api-contract processes but keep lint/drift/breaking checks
2. **Everything** — Remove all tooling, configs, workflow, and processes
3. **Selective** — Let the user choose which layers to remove

**Warning**: Removing the breaking-change gate silently lets breaking API changes land in main.

## Step 2: Remove Spectral

```bash
npm uninstall @stoplight/spectral-cli
rm -f .spectral.yaml .spectral.yml .spectral.json
```

Remove `api:lint` from `package.json` scripts.

## Step 3: Remove Drift Detection

### schemathesis

```bash
pip uninstall schemathesis
```

### Dredd

```bash
npm uninstall dredd
rm -f dredd.yml
```

Remove `api:drift` from scripts.

## Step 4: Remove Breaking-Change Gate

```bash
rm -f scripts/api-breaking-check.sh
# oasdiff binary: rm $(go env GOPATH)/bin/oasdiff (if installed via go install)
```

Remove `api:breaking` from scripts.

## Step 5: Remove Spec Build Check

```bash
npm uninstall @redocly/cli
rm -f redocly.yaml .redocly.yaml
```

Remove `api:build` from scripts.

## Step 6: Remove Pre-commit Hook

Edit `package.json` and remove openapi globs from `lint-staged`. Do not uninstall husky unless installed solely for this plugin.

## Step 7: Remove GitHub Actions Workflow

```bash
rm -f .github/workflows/api-contract.yml
```

## Step 8: Remove Processes

```bash
rm -rf .a5c/processes/api-contract
```

## Step 9: Remove from Registry

```bash
babysitter plugin:remove-from-registry --plugin-name api-contract --project --json
```

## Notes

- The `openapi.yaml` spec itself is not removed — it's project source
- If the breaking-change job was a required branch protection check, update branch protection
- Historical drift reports not removed — clean manually
