# sbom — Configuration

## 1. Configuration Options Table

| Option | Values | Default | Where |
|--------|--------|---------|-------|
| `generator` | `syft`, `cyclonedx`, `both` | `syft` | workflow |
| `formats` | `spdx-json`, `cyclonedx-json`, `cyclonedx-xml`, `syft-table` | `spdx-json+cyclonedx-json` | `anchore/sbom-action` |
| `prDiff` | `on`, `off` | `on` | `diff` job in `sbom.yml` |
| `vulnScan` | `off`, `grype`, `trivy` | `grype` | `vuln-scan` job |
| `vulnSeverityCutoff` | `low`, `medium`, `high`, `critical` | `high` | `severity-cutoff` |
| `licenseCheck` | `on`, `off`, `warn` | `off` | License check step |
| `attestRelease` | `on`, `off` | `on` | `actions/attest-sbom` |
| `containerAttest` | `on`, `off` | `on` when Dockerfile present | `docker/build-push-action` |
| `retentionDays` | integer | `90` | `upload-artifact` |
| `depTrackPush` | `on`, `off` | `off` | curl step |

## 2. Swap Syft → Trivy

```yaml
- uses: aquasecurity/trivy-action@0.24.0
  with:
    scan-type: 'fs'
    format: 'cyclonedx'
    output: 'sbom.cdx.json'
```

Trivy doubles as vuln scanner; you can drop the separate Grype job.

## 3. Adjust Vulnerability Severity Gate

```yaml
- uses: anchore/scan-action@v6
  with:
    sbom: sbom.spdx.json
    fail-build: true
    severity-cutoff: critical   # only fail on critical
    only-fixed: true            # ignore unpatched vulns
```

## 4. Scope — Directories and Exclusions

```yaml
- uses: anchore/sbom-action@v0
  with:
    path: .
    format: spdx-json
    output-file: sbom.spdx.json
    config: .syft.yaml
```

`.syft.yaml`:

```yaml
exclude:
  - "./node_modules/**"
  - "./vendor/**"
  - "./third_party/**"
package:
  cataloger:
    enabled: true
file:
  metadata:
    selection: all
```

## 5. Expand License Allowlist

Edit `.allowed-licenses.txt`:

```
MIT
Apache-2.0
BSD-2-Clause
BSD-3-Clause
ISC
MPL-2.0
```

To ignore license violations for dev-dependencies, filter out `.type == "devDependency"` first in the jq query.

## 6. Warn-Only Mode During Rollout

```yaml
jobs:
  vuln-scan:
    continue-on-error: true   # grace period — flip to false after 2 weeks
  diff:
    continue-on-error: true
```

Track the deadline in a workflow comment.

## 7. Per-Ecosystem CycloneDX Jobs

```yaml
  cdx-npm:
    if: hashFiles('package-lock.json') != ''
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx -y @cyclonedx/cyclonedx-npm --output-file sbom-npm.cdx.json
      - uses: actions/upload-artifact@v4
        with: { name: sbom-npm, path: sbom-npm.cdx.json }

  cdx-python:
    if: hashFiles('pyproject.toml') != ''
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-python@v5
      - run: pip install cyclonedx-bom
      - run: cyclonedx-py requirements -i requirements.txt -o sbom-python.cdx.json
      - uses: actions/upload-artifact@v4
        with: { name: sbom-python, path: sbom-python.cdx.json }
```

## 8. PR Comment Template

Extend the `diff` job to produce a richer comment:

```bash
{
  echo "## SBOM diff vs \`${GITHUB_BASE_REF}\`"
  echo ""
  echo "### Added (${addedCount})"
  echo '```'
  comm -23 pr.list base.list
  echo '```'
  echo ""
  echo "### Removed (${removedCount})"
  echo '```'
  comm -13 pr.list base.list
  echo '```'
} > diff.md
```

## 9. Dependency Track Project Auto-Create

```yaml
      - name: Upload to Dependency Track
        run: |
          curl -sS -X POST "${{ secrets.DTRACK_URL }}/api/v1/bom" \
            -H "X-API-Key: ${{ secrets.DTRACK_API_KEY }}" \
            -F "projectName=${{ github.repository }}" \
            -F "projectVersion=${{ github.sha }}" \
            -F "autoCreate=true" \
            -F "bom=@sbom.cdx.json"
```

## 10. SBOM for Releases of Tagged Prereleases

```yaml
on:
  push:
    tags: ['v*.*.*', 'v*.*.*-*']  # include prereleases
```

Attach with a different suffix:

```yaml
output-file: "${{ github.event.repository.name }}-${{ github.ref_name }}-prerelease.spdx.json"
```

## 11. Reproducible SBOM Output

Set `SYFT_FILE_METADATA_DIGESTS=sha256` and sort packages in output:

```bash
syft . -o spdx-json | jq --sort-keys '.' > sbom.spdx.json
```

This makes SBOMs byte-identical for identical inputs, which is handy for caching.

## 12. Attest Third-Party Dependencies

Generate SBOMs for container base images too:

```bash
syft ghcr.io/OWNER/base-image:1.0 -o spdx-json=base.spdx.json
```

Attach as a separate release asset. Useful when your image inherits CVEs from the base.
