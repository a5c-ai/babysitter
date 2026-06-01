# dependency-hygiene — Configuration

## 1. Configuration Options Table

| Option | Values | Default | Where |
|--------|--------|---------|-------|
| `updater` | `renovate`, `dependabot`, `none` | `renovate` | `renovate.json` / `dependabot.yml` |
| `updateSchedule` | cron-ish | `weekly monday` | Renovate `schedule:` / Dependabot `schedule` |
| `automergePatch` | `true`/`false` | `true` | Renovate `packageRules` |
| `automergeMinor` | `true`/`false` | `true` | Renovate `packageRules` |
| `automergeMajor` | `true`/`false` | `false` | Renovate `packageRules` |
| `allowedLicenses` | list | MIT/Apache-2.0/BSD/ISC | license-check script |
| `deniedLicenses` | list | GPL/AGPL/SSPL/BUSL | license-check script |
| `sbomFormat` | `cyclonedx-json`, `spdx-json`, `syft-table` | `cyclonedx-json` | syft `-o` |
| `maxMajorsBehind` | integer | `3` | outdated-gate.mjs |
| `prConcurrentLimit` | integer | `5` | Renovate |
| `groupStrategy` | `all`, `minor+patch`, `per-ecosystem`, `none` | `minor+patch` | Renovate `packageRules` |
| `vulnAlerts` | `on`, `off` | `on` | Renovate `vulnerabilityAlerts` |

## 2. Adjust Renovate Grouping

```json
{
  "packageRules": [
    {
      "matchPackagePatterns": ["^@types/"],
      "groupName": "type definitions",
      "automerge": true
    },
    {
      "matchPackagePatterns": ["eslint", "prettier"],
      "groupName": "linters"
    },
    {
      "matchDepTypes": ["devDependencies"],
      "matchUpdateTypes": ["patch", "minor"],
      "automerge": true
    }
  ]
}
```

## 3. Change License Policy

Edit `scripts/license-check.sh`:

```bash
ALLOWED="MIT;Apache-2.0;BSD-2-Clause;BSD-3-Clause;ISC;0BSD;Unlicense;CC0-1.0;MPL-2.0"
```

Explicitly deny:

```bash
npx license-checker-rseidelsohn --production --excludePackages "legacy-pkg@1.0.0" \
  --failOn "GPL-2.0;GPL-3.0;AGPL-3.0;SSPL-1.0"
```

## 4. Exempt Specific Packages

```bash
# Known-false-positive or blessed exception
npx license-checker-rseidelsohn \
  --excludePackages "some-pkg@1.2.3;another-pkg@2.0.0" \
  --onlyAllow "$ALLOWED"
```

## 5. Tune Outdated Threshold

Edit `scripts/outdated-gate.mjs`:

```javascript
const MAX_MAJORS_BEHIND = 2;  // tighter
const EXEMPT = new Set(['react', 'typescript']);  // deps we control manually
```

## 6. SBOM Attestation

Attach SBOM to release as signed attestation:

```yaml
- uses: anchore/sbom-action@v0
  with:
    format: cyclonedx-json
    artifact-name: sbom.cdx.json
    upload-release-assets: true
- uses: actions/attest-build-provenance@v1
  with:
    subject-path: 'dist/**'
```

## 7. Per-Ecosystem Dependabot Config

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: npm
    directory: /packages/frontend
    schedule: { interval: daily }
    open-pull-requests-limit: 3
  - package-ecosystem: pip
    directory: /services/api
    schedule: { interval: weekly }
    ignore:
      - dependency-name: "django"
        versions: ["5.x"]  # pin until migration ready
```

## 8. Security-Only Mode

For projects that don't want routine updates but still want vuln patches:

```json
{
  "extends": ["config:base"],
  "enabledManagers": ["npm"],
  "prHourlyLimit": 0,
  "prConcurrentLimit": 0,
  "vulnerabilityAlerts": {
    "enabled": true,
    "schedule": ["at any time"]
  }
}
```

## 9. Run Dependency Update Process

```bash
babysitter run:create \
  --process-id deps-bulk-update \
  --entry .a5c/processes/dependency-hygiene/bulk-update.js#process \
  --prompt "Review all open Renovate PRs, run tests on each, merge passing minor+patch, triage failing majors" \
  --json
```

## 10. SBOM Vulnerability Scan

Pair the generated SBOM with grype for continuous vuln scanning:

```yaml
- uses: anchore/scan-action@v3
  with:
    sbom: sbom.cdx.json
    fail-build: true
    severity-cutoff: high
```
