# sbom — Install Instructions

Generate Software Bill of Materials (SBOM) for every PR and release — using Syft (Anchore) or CycloneDX CLI — detect supply-chain changes with a PR diff check that flags new or upgraded dependencies, and attach signed SBOM artifacts to GitHub releases in both SPDX and CycloneDX formats.

## Step 1: Interview the User

### Stage 1: Project Analysis

Before asking questions, analyze the project:
1. Detect ecosystems:
   - Node: `package.json`, `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`
   - Python: `pyproject.toml`, `requirements.txt`, `poetry.lock`, `uv.lock`, `Pipfile.lock`
   - Go: `go.mod`, `go.sum`
   - Rust: `Cargo.toml`, `Cargo.lock`
   - Java: `pom.xml`, `build.gradle`
   - Ruby: `Gemfile.lock`
   - Container images: `Dockerfile`
2. Check for existing SBOM tooling: `.syft/`, `cyclonedx.json`, `sbom.json`, `.github/workflows/sbom*`
3. Check release process: `.github/workflows/release*.yml`, `.goreleaser.yml`
4. Check publish destinations: GitHub Releases, ghcr.io, npm
5. Summarize findings to the user

### Stage 2: Generator Selection

Ask which SBOM generator to install:

1. **Syft** (recommended) — One tool, works across ecosystems and container images, outputs SPDX + CycloneDX
2. **CycloneDX CLI** — Ecosystem-specific tools (`cyclonedx-bom` for npm, `cyclonedx-python`, etc.) — tighter fidelity per ecosystem but more tools to manage
3. **Both** — Use Syft for coverage and CycloneDX for per-ecosystem detail

Default: **Syft**.

### Stage 3: SBOM Formats

Multi-select output formats:

- `spdx-json` (widely accepted, NTIA-minimum-compatible)
- `cyclonedx-json` (dependency-track-friendly)
- `cyclonedx-xml` (legacy tooling)
- `syft-table` (human review only)

Default: **spdx-json + cyclonedx-json**.

### Stage 4: Scope

Ask:
- Run SBOM on every PR? Default: **yes** (as a diff against `main`)
- Run SBOM on every release tag? Default: **yes**
- Attach SBOM to container images as an attestation? Default: **yes** when Dockerfile present

### Stage 5: Diff Gating

Ask:
- Fail a PR when new high-severity vulnerabilities appear in the SBOM diff? Default: **yes** (via Grype)
- Fail a PR when a dependency is added without a license allowlist match? Default: **no** (warn-only)

## Step 2: Install Syft Locally (Document in README)

```bash
# Homebrew / macOS
brew install syft

# Linux / WSL
curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b /usr/local/bin

# Check
syft version
```

Generate a baseline SBOM:

```bash
syft . -o spdx-json=sbom.spdx.json -o cyclonedx-json=sbom.cdx.json
```

Add to `.gitignore`:

```
/sbom-*.json
/sbom.*.json
```

Do **not** commit SBOM files to source; they are build outputs.

## Step 3: CI Workflow — Generate SBOM on PRs

Create `.github/workflows/sbom.yml`:

```yaml
name: SBOM
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]
    tags: ['v*.*.*']
  workflow_dispatch:

permissions:
  contents: read

jobs:
  generate:
    runs-on: ubuntu-latest
    outputs:
      spdx-path: ${{ steps.out.outputs.spdx }}
      cdx-path: ${{ steps.out.outputs.cdx }}
    steps:
      - uses: actions/checkout@v6
        with: { fetch-depth: 0 }
      - name: Generate SBOM (Syft)
        uses: anchore/sbom-action@v0
        with:
          path: .
          format: spdx-json
          output-file: sbom.spdx.json
          upload-artifact: false
      - name: Generate SBOM (CycloneDX)
        uses: anchore/sbom-action@v0
        with:
          path: .
          format: cyclonedx-json
          output-file: sbom.cdx.json
          upload-artifact: false
      - id: out
        run: |
          echo "spdx=sbom.spdx.json" >> "$GITHUB_OUTPUT"
          echo "cdx=sbom.cdx.json" >> "$GITHUB_OUTPUT"
      - uses: actions/upload-artifact@v4
        with:
          name: sbom
          path: |
            sbom.spdx.json
            sbom.cdx.json
          retention-days: 90

  vuln-scan:
    needs: [generate]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with: { name: sbom }
      - name: Scan SBOM with Grype
        uses: anchore/scan-action@v6
        with:
          sbom: sbom.spdx.json
          fail-build: true
          severity-cutoff: high
          output-format: sarif
      - uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: results.sarif

  diff:
    if: github.event_name == 'pull_request'
    needs: [generate]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/download-artifact@v4
        with: { name: sbom, path: pr-sbom }
      - name: Fetch base branch SBOM
        run: |
          git fetch origin ${{ github.base_ref }}
          git checkout origin/${{ github.base_ref }} -- . || true
          syft . -o spdx-json=base.spdx.json || true
      - name: Compare SBOMs
        run: |
          jq -r '.packages[] | "\(.name)@\(.versionInfo)"' pr-sbom/sbom.spdx.json | sort -u > pr.list
          jq -r '.packages[] | "\(.name)@\(.versionInfo)"' base.spdx.json | sort -u > base.list
          echo "=== Added ===" > diff.md
          comm -23 pr.list base.list >> diff.md
          echo "" >> diff.md
          echo "=== Removed ===" >> diff.md
          comm -13 pr.list base.list >> diff.md
          cat diff.md
      - uses: marocchino/sticky-pull-request-comment@v2
        with:
          path: diff.md
          header: sbom-diff
```

## Step 4: Release — Attach SBOM to GitHub Release

Create (or extend) `.github/workflows/release.yml`:

```yaml
  sbom-release:
    if: startsWith(github.ref, 'refs/tags/v')
    runs-on: ubuntu-latest
    permissions:
      contents: write
      id-token: write
      attestations: write
    steps:
      - uses: actions/checkout@v6
      - uses: anchore/sbom-action@v0
        with:
          format: spdx-json
          output-file: "${{ github.event.repository.name }}-${{ github.ref_name }}.spdx.json"
      - uses: anchore/sbom-action@v0
        with:
          format: cyclonedx-json
          output-file: "${{ github.event.repository.name }}-${{ github.ref_name }}.cdx.json"
      - name: Attest SBOM
        uses: actions/attest-sbom@v2
        with:
          subject-path: 'dist/*'
          sbom-path: "${{ github.event.repository.name }}-${{ github.ref_name }}.spdx.json"
      - uses: softprops/action-gh-release@v2
        with:
          files: |
            *.spdx.json
            *.cdx.json
```

## Step 5: Container Image SBOM Attestation

In the Dockerfile build step:

```yaml
      - uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: ghcr.io/${{ github.repository }}:${{ github.ref_name }}
          provenance: true
          sbom: true
```

Verify with:

```bash
docker buildx imagetools inspect ghcr.io/OWNER/REPO:TAG --format '{{ json .SBOM }}'
cosign download sbom ghcr.io/OWNER/REPO:TAG
```

## Step 6: CycloneDX Per-Ecosystem (Optional)

Higher fidelity for npm / Python:

```bash
# Node
npm install -g @cyclonedx/cyclonedx-npm
cyclonedx-npm --output-file sbom.cdx.json

# Python
pip install cyclonedx-bom
cyclonedx-py requirements -i requirements.txt -o sbom.cdx.json
```

Add a CI job per ecosystem that produces a matching SBOM.

## Step 7: License Allowlist Check (Optional)

Create `.allowed-licenses.txt`:

```
MIT
Apache-2.0
BSD-2-Clause
BSD-3-Clause
ISC
0BSD
Unlicense
CC0-1.0
```

Add to the `sbom.yml` workflow:

```yaml
      - name: License check
        run: |
          jq -r '.packages[]? | select(.licenseConcluded != null) | .licenseConcluded' sbom.spdx.json \
            | grep -v -F -f .allowed-licenses.txt \
            | sort -u > violations.txt || true
          if [ -s violations.txt ]; then
            echo "Licenses not in allowlist:"; cat violations.txt; exit 1
          fi
```

## Step 8: Dependency Track (Optional)

If the org runs Dependency Track, post each SBOM:

```yaml
      - name: Upload to Dependency Track
        run: |
          curl -X POST "${{ secrets.DTRACK_URL }}/api/v1/bom" \
            -H "X-API-Key: ${{ secrets.DTRACK_API_KEY }}" \
            -F "project=${{ secrets.DTRACK_PROJECT }}" \
            -F "bom=@sbom.cdx.json"
```

## Step 9: Register Plugin

```bash
babysitter plugin:update-registry --plugin-name sbom --plugin-version 1.0.0 --marketplace-name marketplace --project --json
```

## Step 10: Verify

1. Open a test PR — `sbom.yml` runs, comment appears with added/removed packages
2. Grype scan blocks PR if a high-severity vuln is introduced
3. Push a test tag — release receives `*.spdx.json` and `*.cdx.json`
4. Container image has SBOM attestation retrievable via `cosign download sbom`
5. `gh attestation verify <artifact> --repo OWNER/REPO` succeeds on released artifacts

## Reference

- Syft: https://github.com/anchore/syft
- Grype: https://github.com/anchore/grype
- CycloneDX: https://cyclonedx.org/
- SPDX: https://spdx.dev/
- actions/attest-sbom: https://github.com/actions/attest-sbom
- Dependency Track: https://dependencytrack.org/
