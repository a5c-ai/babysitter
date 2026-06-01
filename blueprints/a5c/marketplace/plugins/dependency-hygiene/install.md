# dependency-hygiene — Install Instructions

Set up dependency hygiene feedback loops — automated update PRs (Renovate or Dependabot), license allowlist audit, SBOM generation (syft), and a CI check that fails when dependencies drift too far behind upstream.

## Step 1: Interview the User

### Stage 1: Project Analysis

1. Detect package managers: `package.json` (npm/pnpm/yarn), `pyproject.toml` (pip/poetry/uv), `go.mod`, `Cargo.toml`, `Gemfile`, `composer.json`, `pom.xml`, `build.gradle`
2. Check existing automation: `.github/dependabot.yml`, `renovate.json`, `.renovaterc*`, `.mend/`
3. Check existing license tooling: `license-checker`, `license-checker-rseidelsohn`, `pip-licenses`, `go-licenses`, `cargo-deny`
4. Check for existing SBOM generation: `syft`, CycloneDX, SPDX files in repo or CI
5. Check CI: `.github/workflows/`
6. Summarize findings to the user

### Stage 2: Hygiene Layers

Ask the user which layers to install (multi-select):

1. **Automated update PRs** — Renovate or Dependabot
2. **License audit** — Fail CI on disallowed licenses in direct or transitive deps
3. **SBOM generation** — syft produces CycloneDX/SPDX SBOM per build
4. **Outdated-dep gate** — Fail CI when deps are >N versions behind latest
5. **All** — Install every layer

### Stage 3: Tool Selection

Confirm:

| Area | Default | Alternatives |
|------|---------|--------------|
| Updates | `Renovate` | `Dependabot` (simpler, GitHub-native) |
| License check (Node) | `license-checker-rseidelsohn` | `license-checker` |
| License check (Python) | `pip-licenses` | `liccheck` |
| License check (Go) | `go-licenses` | — |
| SBOM | `syft` (CycloneDX) | SPDX, cdxgen |

### Stage 4: Policy

Ask:
- Allowed licenses? (default: `MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC, 0BSD, Unlicense`)
- Block licenses? (default: `GPL-*, AGPL-*, SSPL-*, Commons-Clause, BUSL-*`)
- Max versions behind? (default: `3 majors`)
- Renovate schedule? (default: weekly, Monday before 6am, group minor+patch)

## Step 2: Install Automated Update PRs

### Renovate (recommended)

Install the Renovate GitHub App at https://github.com/apps/renovate, then create `renovate.json`:

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": [
    "config:recommended",
    ":semanticCommits",
    ":timezone(UTC)",
    "group:allNonMajor",
    "schedule:weekly"
  ],
  "labels": ["dependencies"],
  "prConcurrentLimit": 5,
  "vulnerabilityAlerts": { "enabled": true, "labels": ["security"] },
  "packageRules": [
    {
      "matchUpdateTypes": ["minor", "patch"],
      "automerge": true,
      "automergeType": "pr",
      "platformAutomerge": true
    },
    {
      "matchUpdateTypes": ["major"],
      "dependencyDashboardApproval": true
    }
  ]
}
```

### Dependabot (alternative)

Create `.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule: { interval: weekly, day: monday }
    open-pull-requests-limit: 5
    groups:
      minor-and-patch:
        update-types: [minor, patch]
  - package-ecosystem: pip
    directory: /
    schedule: { interval: weekly }
  - package-ecosystem: github-actions
    directory: /
    schedule: { interval: weekly }
```

## Step 3: Install License Audit

### Node

```bash
npm install -D license-checker-rseidelsohn
```

Create `scripts/license-check.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
ALLOWED="MIT;Apache-2.0;BSD-2-Clause;BSD-3-Clause;ISC;0BSD;Unlicense;CC0-1.0"
npx license-checker-rseidelsohn --production --onlyAllow "$ALLOWED" --summary
```

```json
{ "scripts": { "deps:licenses": "bash scripts/license-check.sh" } }
```

### Python

```bash
pip install pip-licenses
```

```bash
pip-licenses --allow-only="MIT License;Apache Software License;BSD License;ISC License (ISCL);Python Software Foundation License" --fail-on-forbidden
```

### Go

```bash
go install github.com/google/go-licenses@latest
go-licenses check ./... --disallowed_types=forbidden,restricted
```

## Step 4: Install SBOM Generation

```bash
# Install syft
curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b ~/.local/bin
```

Generate SBOM:

```bash
syft . -o cyclonedx-json=sbom.cdx.json -o spdx-json=sbom.spdx.json
```

Add script:

```json
{ "scripts": { "deps:sbom": "syft . -o cyclonedx-json=sbom.cdx.json" } }
```

## Step 5: Install Outdated Gate

### Node

```bash
npm outdated --json > /tmp/outdated.json || true
# Custom script: fail if any direct dep is >3 majors behind
```

Create `scripts/outdated-gate.mjs`:

```javascript
import { execSync } from 'node:child_process';
const MAX_MAJORS_BEHIND = 3;
const raw = execSync('npm outdated --json || true').toString().trim() || '{}';
const data = JSON.parse(raw);
const offenders = [];
for (const [name, info] of Object.entries(data)) {
  const cur = Number(String(info.current).split('.')[0]);
  const latest = Number(String(info.latest).split('.')[0]);
  if (!Number.isNaN(cur) && !Number.isNaN(latest) && latest - cur > MAX_MAJORS_BEHIND) {
    offenders.push(`${name}: ${info.current} -> ${info.latest}`);
  }
}
if (offenders.length) {
  console.error('Dependencies exceed max-majors-behind policy:\n' + offenders.join('\n'));
  process.exit(1);
}
```

```json
{ "scripts": { "deps:outdated": "node scripts/outdated-gate.mjs" } }
```

### Python — pip list --outdated

```bash
pip list --outdated --format=json | jq -e 'length == 0'
```

## Step 6: Create GitHub Actions Workflow

Create `.github/workflows/dependency-hygiene.yml`:

```yaml
name: Dependency Hygiene

on:
  pull_request:
  push:
    branches: [main]
  schedule:
    - cron: '0 4 * * 1'  # Weekly Monday 04:00 UTC

jobs:
  licenses:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: 'npm' }
      - run: npm ci
      - run: npm run deps:licenses

  sbom:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: anchore/sbom-action@v0
        with:
          format: cyclonedx-json
          artifact-name: sbom.cdx.json
      - uses: actions/upload-artifact@v4
        with:
          name: sbom
          path: sbom.cdx.json

  outdated:
    runs-on: ubuntu-latest
    if: github.event_name == 'schedule' || github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: 'npm' }
      - run: npm ci
      - run: npm run deps:outdated
```

## Step 7: Run Baseline

```bash
npm run deps:licenses || true
npm run deps:sbom || true
npm run deps:outdated || true
```

Report to user: disallowed licenses, SBOM component count, deps behind.

## Step 8: Register Plugin

```bash
babysitter plugin:update-registry --plugin-name dependency-hygiene --plugin-version 1.0.0 --marketplace-name marketplace --project --json
```

## Step 9: Verify Setup

1. `renovate.json` or `.github/dependabot.yml` present and valid
2. `npm run deps:licenses` passes or lists offenders
3. `sbom.cdx.json` generated
4. `npm run deps:outdated` runs
5. Workflow committed at `.github/workflows/dependency-hygiene.yml`

## Reference

- Renovate: https://docs.renovatebot.com/
- Dependabot: https://docs.github.com/en/code-security/dependabot
- syft: https://github.com/anchore/syft
- CycloneDX: https://cyclonedx.org/
- go-licenses: https://github.com/google/go-licenses
