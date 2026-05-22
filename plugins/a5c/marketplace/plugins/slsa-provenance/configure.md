# slsa-provenance — Configuration

## 1. Configuration Options Table

| Option | Values | Default | Where |
|--------|--------|---------|-------|
| `artifactTypes` | `generic`, `container`, `nodejs`, `go`, any combo | detected | which workflow file(s) |
| `triggerTags` | glob (e.g. `v*.*.*`) | `v*.*.*` | workflow `on.push.tags` |
| `signingBackend` | `sigstore-keyless`, `cosign-kms`, `cosign-key` | `sigstore-keyless` | signing step |
| `slsaLevel` | `3` | `3` | generator workflow ref |
| `generatorVersion` | pinned tag (e.g. `v2.0.0`) | `v2.0.0` | `uses:` ref |
| `uploadToRelease` | `true`, `false` | `true` | generator `with.upload-assets` |
| `registry` | `ghcr.io`, `docker.io`, custom | `ghcr.io` | container workflow env |
| `verificationScript` | `on`, `off` | `on` | `scripts/verify-release.sh` |

## 2. Pin Generator Version

Always pin to a released tag — never `main`:

```yaml
uses: slsa-framework/slsa-github-generator/.github/workflows/generator_generic_slsa3.yml@v2.0.0
```

Upgrade by bumping the tag, running a test release, and verifying the output before merging.

## 3. Change Trigger

```yaml
on:
  push:
    tags: ['release-*', 'v*']
  workflow_dispatch:
    inputs:
      tag:
        description: 'Tag to release'
        required: true
```

## 4. Switch to KMS-Backed Cosign

```yaml
      - uses: sigstore/cosign-installer@v3
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/cosign-signer
          aws-region: us-east-1
      - run: |
          cosign sign-blob --yes \
            --key awskms:///alias/cosign-signer \
            --output-signature release/app.sig \
            release/app.tar.gz
```

## 5. Use GitHub Artifact Attestations (Alternative Path)

GitHub's built-in attestation generator provides SLSA L3 provenance without the SLSA generator. Lighter weight:

```yaml
      - uses: actions/attest-build-provenance@v2
        with:
          subject-path: 'release/*'
```

Verify with:

```bash
gh attestation verify release/app.tar.gz --repo OWNER/REPO
```

Use `slsa-framework/slsa-github-generator` when you need the exact SLSA predicate format or have downstream consumers that expect `intoto.jsonl`.

## 6. Container Image — Custom Registry

```yaml
env:
  IMAGE: registry.example.com/team/app
  REGISTRY_USERNAME: ${{ secrets.REGISTRY_USERNAME }}
  REGISTRY_PASSWORD: ${{ secrets.REGISTRY_PASSWORD }}
```

Pass `registry-username` and `registry-password` to the generator workflow.

## 7. Go Releases via GoReleaser

Use the dedicated Go builder:

```yaml
jobs:
  build:
    permissions:
      id-token: write
      contents: write
      actions: read
    uses: slsa-framework/slsa-github-generator/.github/workflows/builder_go_slsa3.yml@v2.0.0
    with:
      go-version: '1.23'
      config-file: .slsa-goreleaser.yml
      evaluated-envs: 'VERSION:${{ github.ref_name }}'
```

`.slsa-goreleaser.yml`:

```yaml
version: 1
main: ./cmd/app
dir: ./
binary: app-{{ .OS }}-{{ .Arch }}
env: ['CGO_ENABLED=0']
flags: ['-trimpath']
ldflags: ['-X main.version={{ .Env.VERSION }}']
goos: [linux, darwin]
goarch: [amd64, arm64]
```

## 8. Verification in Consumers' CI

Consumers can verify each release in their CI:

```yaml
      - uses: slsa-framework/slsa-verifier/actions/installer@v2.7.0
      - run: |
          slsa-verifier verify-artifact \
            --provenance-path my-app.intoto.jsonl \
            --source-uri github.com/OWNER/REPO \
            --source-tag v1.2.3 \
            my-app-v1.2.3.tar.gz
```

## 9. Disable Upload to Release (Manual Publish)

```yaml
uses: slsa-framework/slsa-github-generator/.github/workflows/generator_generic_slsa3.yml@v2.0.0
with:
  base64-subjects: "${{ needs.build.outputs.hashes }}"
  upload-assets: false
```

The provenance artifact is then available as a workflow artifact only.

## 10. Gate Workflow on Environment Review

```yaml
jobs:
  release:
    environment:
      name: production-release
      url: https://github.com/${{ github.repository }}/releases/tag/${{ github.ref_name }}
```

Configure the environment to require manual approval before signing runs.

## 11. Draft Releases

```yaml
      - uses: softprops/action-gh-release@v2
        with:
          files: release/*
          draft: true
```

The provenance is still generated; the release stays a draft until manually published.

## 12. Multi-Platform Builds

For matrix builds, call the generator workflow once per matrix dimension or accumulate all subjects first and call the generator a single time. The latter produces one attestation covering all artifacts — preferred for atomicity.
