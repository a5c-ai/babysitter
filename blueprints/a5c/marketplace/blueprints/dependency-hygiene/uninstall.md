# dependency-hygiene — Uninstall Instructions

## Step 1: Interview the User

Ask what to remove:

1. **Processes and configs only** — Remove babysitter processes but keep Renovate/Dependabot/license/SBOM
2. **Everything** — Remove all configs, scripts, workflow, and processes
3. **Selective** — Let the user choose which layers to remove

**Warning**: Removing license and outdated gates silently drops compliance and security coverage.

## Step 2: Remove Automated Update PRs

### Renovate

```bash
rm -f renovate.json .renovaterc .renovaterc.json
```

Optionally disable the Renovate GitHub App for this repo.

### Dependabot

```bash
rm -f .github/dependabot.yml
```

## Step 3: Remove License Audit

### Node

```bash
npm uninstall license-checker-rseidelsohn
rm -f scripts/license-check.sh
```

### Python

```bash
pip uninstall pip-licenses
```

### Go

```bash
# rm $(go env GOPATH)/bin/go-licenses  # if desired
```

Remove `deps:licenses` from `package.json` scripts.

## Step 4: Remove SBOM Generation

```bash
rm -f sbom.cdx.json sbom.spdx.json
# syft binary left installed; remove manually if not needed elsewhere
```

Remove `deps:sbom` from scripts.

## Step 5: Remove Outdated Gate

```bash
rm -f scripts/outdated-gate.mjs
```

Remove `deps:outdated` from scripts.

## Step 6: Remove GitHub Actions Workflow

```bash
rm -f .github/workflows/dependency-hygiene.yml
```

## Step 7: Remove Processes

```bash
rm -rf .a5c/processes/dependency-hygiene
```

## Step 8: Remove from Registry

```bash
babysitter plugin:remove-from-registry --plugin-name dependency-hygiene --project --json
```

## Notes

- Existing Renovate/Dependabot PRs remain open — close manually or let them merge/expire
- Previously-generated SBOM artifacts in Actions storage remain — rotate per retention policy
- Historical license audit results are not removed — clean manually
