# slsa-provenance — Install Instructions

Configure SLSA Level 3 build provenance for your release artifacts — reusable GitHub Actions workflows from `slsa-framework/slsa-github-generator`, keyless signing via Sigstore / cosign, attestation upload to the GitHub release, and a verification workflow that downstream consumers can run to prove an artifact came from your exact source commit.

## Step 1: Interview the User

### Stage 1: Project Analysis

Before asking questions, analyze the project:
1. Detect artifact type(s) produced by the project:
   - Generic archives: `.tar.gz`, `.zip` from `dist/`, `out/`, `build/`
   - Container images: `Dockerfile`, `docker-compose.yml`, references to `ghcr.io`
   - npm packages: `package.json` with `"private": false` and `publishConfig`
   - Go binaries: `go.mod` + `main.go`, typically released via GoReleaser
   - Python wheels: `pyproject.toml` with build backend
2. Check for existing release workflows: `.github/workflows/release.yml`, `.goreleaser.yml`
3. Check for existing signing: `.sigstore/`, `cosign.pub`, GPG artifacts
4. Check publish destinations: npm registry, ghcr.io, PyPI, GitHub Releases
5. Summarize findings to the user

### Stage 2: Artifact Scope

Ask which artifacts to generate provenance for (multi-select):

1. **Generic archives** — `slsa-framework/slsa-github-generator/.github/workflows/generator_generic_slsa3.yml`
2. **Container images** — `slsa-framework/slsa-github-generator/.github/workflows/generator_container_slsa3.yml`
3. **npm packages** — `slsa-framework/slsa-github-generator/.github/workflows/builder_nodejs_slsa3.yml`
4. **Go binaries** — `slsa-framework/slsa-github-generator/.github/workflows/builder_go_slsa3.yml`
5. **All applicable**

### Stage 3: Signing Backend

Ask:
- **Sigstore keyless** (recommended) — uses GitHub OIDC, no private keys to manage
- **cosign with KMS** — AWS KMS / GCP KMS / Azure Key Vault key reference
- **cosign with long-lived key** — `cosign.key` + password in `COSIGN_PASSWORD` (least recommended)

Default: **Sigstore keyless**.

### Stage 4: Verification

Ask:
- Generate a verification workflow consumers can copy? Default: **yes**
- Add a release-note snippet explaining how to verify? Default: **yes**

### Stage 5: Release Trigger

Confirm:
- Trigger on tag push (`v*.*.*`)? Default: **yes**
- Also on `workflow_dispatch`? Default: **yes** (for dry runs)

## Step 2: Prerequisites

Verify in the target repo:

1. Repository must be **public**, OR private with GitHub Advanced Security enabled (for OIDC)
2. `Settings → Actions → General → Workflow permissions` must allow writing `id-token: write`, `contents: write`, `attestations: write`
3. Releases must use tags matching the pattern configured below (`v*`)

## Step 3: Generic-Archive Workflow

Create `.github/workflows/release-slsa.yml`:

```yaml
name: Release (SLSA L3)

on:
  push:
    tags: ['v*.*.*']
  workflow_dispatch:

permissions:
  contents: read

jobs:
  build:
    runs-on: ubuntu-latest
    outputs:
      hashes: ${{ steps.hash.outputs.hashes }}
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: 'npm' }
      - run: npm ci
      - run: npm run build
      - name: Package
        run: |
          mkdir -p release
          tar -czf release/${{ github.event.repository.name }}-${{ github.ref_name }}.tar.gz -C dist .
      - name: Generate hashes
        id: hash
        run: |
          cd release
          echo "hashes=$(sha256sum * | base64 -w0)" >> "$GITHUB_OUTPUT"
      - uses: actions/upload-artifact@v4
        with:
          name: release-archives
          path: release/
          retention-days: 7

  provenance:
    needs: [build]
    permissions:
      actions: read
      id-token: write
      contents: write
    uses: slsa-framework/slsa-github-generator/.github/workflows/generator_generic_slsa3.yml@v2.0.0
    with:
      base64-subjects: "${{ needs.build.outputs.hashes }}"
      upload-assets: true

  release:
    needs: [build, provenance]
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: release-archives
          path: release
      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          files: release/*
          generate_release_notes: true
```

## Step 4: Container-Image Workflow

Create `.github/workflows/release-container-slsa.yml`:

```yaml
name: Container Release (SLSA L3)
on:
  push:
    tags: ['v*.*.*']

permissions:
  contents: read

env:
  IMAGE: ghcr.io/${{ github.repository }}

jobs:
  build:
    runs-on: ubuntu-latest
    outputs:
      image: ${{ steps.meta.outputs.image }}
      digest: ${{ steps.build.outputs.digest }}
    permissions:
      contents: read
      packages: write
      id-token: write
    steps:
      - uses: actions/checkout@v6
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - id: meta
        run: echo "image=${IMAGE}" >> "$GITHUB_OUTPUT"
      - id: build
        uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: |
            ${{ env.IMAGE }}:${{ github.ref_name }}
            ${{ env.IMAGE }}:latest
          provenance: true
          sbom: true

  provenance:
    needs: [build]
    permissions:
      actions: read
      id-token: write
      packages: write
    uses: slsa-framework/slsa-github-generator/.github/workflows/generator_container_slsa3.yml@v2.0.0
    with:
      image: ${{ needs.build.outputs.image }}
      digest: ${{ needs.build.outputs.digest }}
      registry-username: ${{ github.actor }}
    secrets:
      registry-password: ${{ secrets.GITHUB_TOKEN }}
```

## Step 5: npm Package Workflow

Create `.github/workflows/release-npm-slsa.yml`:

```yaml
name: npm Publish (SLSA L3)
on:
  push:
    tags: ['v*.*.*']

jobs:
  build:
    permissions:
      id-token: write
      contents: read
      actions: read
    uses: slsa-framework/slsa-github-generator/.github/workflows/builder_nodejs_slsa3.yml@v2.0.0
    with:
      run-scripts: 'build, test'
      node-version: 22

  publish:
    needs: [build]
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: slsa-framework/slsa-github-generator/actions/nodejs/publish@v2.0.0
        with:
          node-auth-token: ${{ secrets.NPM_TOKEN }}
          package-name: ${{ needs.build.outputs.package-name }}
          package-download-name: ${{ needs.build.outputs.package-download-name }}
          package-download-sha256: ${{ needs.build.outputs.package-download-sha256 }}
          provenance-name: ${{ needs.build.outputs.provenance-name }}
          provenance-download-name: ${{ needs.build.outputs.provenance-download-name }}
          provenance-download-sha256: ${{ needs.build.outputs.provenance-download-sha256 }}
```

## Step 6: Cosign Signing (Optional Supplement)

For additional signing with cosign keyless:

```yaml
      - uses: sigstore/cosign-installer@v3
      - name: Sign artifacts
        env:
          COSIGN_EXPERIMENTAL: '1'
        run: |
          for f in release/*; do
            cosign sign-blob --yes "$f" \
              --output-signature "$f.sig" \
              --output-certificate "$f.pem"
          done
```

## Step 7: Verification Workflow / Script

Create `scripts/verify-release.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
VERSION="${1:?usage: verify-release.sh <version>}"
REPO="${GITHUB_REPOSITORY:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}"
ARTIFACT="${2:?artifact filename}"

gh release download "$VERSION" --repo "$REPO" --pattern "$ARTIFACT" --pattern "${ARTIFACT}.intoto.jsonl" --clobber

# Requires https://github.com/slsa-framework/slsa-verifier
slsa-verifier verify-artifact "$ARTIFACT" \
  --provenance-path "${ARTIFACT}.intoto.jsonl" \
  --source-uri "github.com/${REPO}" \
  --source-tag "$VERSION"

echo "Provenance verified for ${ARTIFACT} at ${VERSION}"
```

```bash
chmod +x scripts/verify-release.sh
```

## Step 8: README / Release-Note Snippet

Append to `README.md`:

```markdown
## Verifying release provenance

Releases are built with [SLSA Level 3](https://slsa.dev/) provenance. To verify:

    # install slsa-verifier: go install github.com/slsa-framework/slsa-verifier/v2/cli/slsa-verifier@latest
    ./scripts/verify-release.sh v1.2.3 my-app-v1.2.3.tar.gz
```

## Step 9: Register Plugin

```bash
babysitter plugin:update-registry --plugin-name slsa-provenance --plugin-version 1.0.0 --marketplace-name marketplace --project --json
```

## Step 10: Verify End-to-End

1. Push a test tag `v0.0.0-slsa-test`
2. Workflow completes and attaches `*.intoto.jsonl` to the GitHub release
3. `scripts/verify-release.sh v0.0.0-slsa-test <artifact>` exits 0
4. For containers: `cosign verify-attestation ghcr.io/OWNER/REPO:v0.0.0-slsa-test --type slsaprovenance --certificate-identity-regexp ".*" --certificate-oidc-issuer https://token.actions.githubusercontent.com`
5. For npm: `npm audit signatures` on the consumer side reports attested provenance

## Reference

- SLSA spec: https://slsa.dev/
- slsa-github-generator: https://github.com/slsa-framework/slsa-github-generator
- slsa-verifier: https://github.com/slsa-framework/slsa-verifier
- Sigstore cosign: https://docs.sigstore.dev/
- GitHub Artifact Attestations: https://docs.github.com/actions/security-guides/using-artifact-attestations
