# container-security — Install Instructions

Set up container security feedback loops — hadolint for Dockerfile linting, Trivy for image vulnerability scanning, a distroless/rootless posture checklist, and docker-compose lint to catch misconfigurations before deployment.

## Step 1: Interview the User

### Stage 1: Project Analysis

1. Discover container assets: `Dockerfile`, `Containerfile`, `*.Dockerfile`, `docker-compose.yml`, `compose.yaml`
2. Identify base images in use (alpine, debian, ubuntu, distroless, scratch, node:*, python:*)
3. Check for multi-stage builds, USER directive, HEALTHCHECK
4. Check existing tooling: `hadolint`, `trivy`, `dockle`, `grype`, `syft`
5. Check CI: `.github/workflows/`, `.gitlab-ci.yml`
6. Summarize findings to the user

### Stage 2: Layers

Ask the user which layers to install (multi-select):

1. **hadolint** — Dockerfile best-practice lint
2. **Trivy** — Image vulnerability + config + secret scan
3. **Rootless/distroless checklist** — Posture audit of Dockerfiles
4. **Compose lint** — `docker compose config` + custom checks
5. **All** — Install every layer

### Stage 3: Severity & Gate

Ask:
- hadolint severity to fail? (default: `error` only; `warning+` is stricter)
- Trivy CVE severity to fail? (default: `HIGH,CRITICAL`)
- Block PRs on findings? (default: yes, with `.trivyignore` for accepted risk)
- Scan on PR and on push to main? (default: both)

## Step 2: Install hadolint

hadolint is a Haskell binary. In CI use the action; locally:

```bash
# macOS
brew install hadolint
# Docker
docker pull hadolint/hadolint
```

Create `.hadolint.yaml`:

```yaml
ignored:
  - DL3008   # pin apt-get versions — noisy; enable once you care
failure-threshold: error
trustedRegistries:
  - docker.io
  - ghcr.io
  - gcr.io
  - public.ecr.aws
override:
  error:
    - DL3002   # don't run as root
    - DL3025   # use JSON form for CMD/ENTRYPOINT
    - DL4006   # set SHELL with pipefail
```

Add script:

```json
{ "scripts": { "container:lint": "hadolint Dockerfile" } }
```

## Step 3: Install Trivy

```bash
# macOS
brew install trivy
# Linux / CI via Docker
docker pull aquasec/trivy:latest
```

Create `.trivyignore` (empty initially — add CVE IDs with justification over time):

```
# Accepted risk — CVE-YYYY-NNNNN: reason + review date
```

Add scripts:

```json
{
  "scripts": {
    "container:build": "docker build -t app:local .",
    "container:scan": "trivy image --severity HIGH,CRITICAL --exit-code 1 --ignorefile .trivyignore app:local",
    "container:scan-fs": "trivy fs --severity HIGH,CRITICAL --exit-code 1 ."
  }
}
```

## Step 4: Rootless / Distroless Checklist

Create `docs/container-security-checklist.md`:

```markdown
# Container Security Checklist

- [ ] Dockerfile sets `USER` to non-root (e.g. `USER 10001:10001`)
- [ ] Base image is distroless (`gcr.io/distroless/*`), alpine, or scratch
- [ ] Multi-stage build — final stage contains no build toolchain
- [ ] No secrets in ENV or in image layers (`--secret` mount only)
- [ ] HEALTHCHECK defined (or explicitly delegated to orchestrator)
- [ ] `.dockerignore` excludes `.git`, `node_modules`, `.env*`, `tests/`
- [ ] Pinned base image tag (digest preferred: `image@sha256:...`)
- [ ] No `ADD` with remote URL (use `curl | RUN` with checksum instead)
- [ ] Minimal exposed ports (`EXPOSE` matches actual runtime needs)
- [ ] Read-only root filesystem supported (`--read-only` runs cleanly)
```

Audit script `scripts/container-posture.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
fail=0
for f in $(git ls-files '*Dockerfile' '*.Dockerfile'); do
  grep -q '^USER ' "$f" || { echo "::warning file=$f::missing USER directive"; fail=1; }
  grep -Eq 'FROM\s+(gcr\.io/distroless|alpine|scratch|.*@sha256:)' "$f" || \
    echo "::warning file=$f::consider distroless/alpine or digest-pinned base"
  grep -q '^HEALTHCHECK' "$f" || echo "::notice file=$f::no HEALTHCHECK"
done
exit $fail
```

```json
{ "scripts": { "container:posture": "bash scripts/container-posture.sh" } }
```

## Step 5: Compose Lint

```bash
# Validate compose syntax
docker compose config -q
```

Add stricter check script `scripts/compose-lint.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
for f in docker-compose*.yml compose*.yaml; do
  [ -f "$f" ] || continue
  docker compose -f "$f" config -q
  grep -Eq 'privileged:\s*true' "$f" && { echo "::error file=$f::privileged:true is disallowed"; exit 1; } || true
  grep -Eq ':latest' "$f" && echo "::warning file=$f::avoid :latest tags"
done
```

```json
{ "scripts": { "container:compose-lint": "bash scripts/compose-lint.sh" } }
```

## Step 6: Set Up Pre-commit Hook

```bash
npm install -D husky lint-staged
npx husky init
```

```json
{
  "lint-staged": {
    "**/Dockerfile*": ["hadolint"],
    "**/docker-compose*.y*ml": ["bash scripts/compose-lint.sh"]
  }
}
```

## Step 7: Create GitHub Actions Workflow

Create `.github/workflows/container-security.yml`:

```yaml
name: Container Security

on:
  pull_request:
    paths: ['**/Dockerfile*', '**/docker-compose*.y*ml', '**/compose*.y*ml']
  push:
    branches: [main]

jobs:
  hadolint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: hadolint/hadolint-action@v3
        with:
          dockerfile: Dockerfile
          config: .hadolint.yaml
          failure-threshold: error

  trivy-fs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: aquasecurity/trivy-action@master
        with:
          scan-type: fs
          severity: HIGH,CRITICAL
          exit-code: '1'
          ignore-unfixed: true

  trivy-image:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - run: docker build -t app:ci .
      - uses: aquasecurity/trivy-action@master
        with:
          image-ref: app:ci
          severity: HIGH,CRITICAL
          exit-code: '1'
          ignore-unfixed: true

  posture:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - run: bash scripts/container-posture.sh

  compose-lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - run: bash scripts/compose-lint.sh
```

## Step 8: Run Baseline

```bash
npm run container:lint || true
npm run container:build && npm run container:scan || true
npm run container:posture || true
```

Report CVE counts and posture findings.

## Step 9: Register Plugin

```bash
babysitter plugin:update-registry --plugin-name container-security --plugin-version 1.0.0 --marketplace-name marketplace --project --json
```

## Step 10: Verify Setup

1. `hadolint Dockerfile` runs (0 or documented failures)
2. Trivy image scan reports CVEs with HIGH/CRITICAL gate
3. Posture checklist script runs and highlights gaps
4. `docker compose config -q` passes
5. Workflow committed at `.github/workflows/container-security.yml`

## Reference

- hadolint: https://github.com/hadolint/hadolint
- Trivy: https://aquasecurity.github.io/trivy/
- Distroless images: https://github.com/GoogleContainerTools/distroless
- Docker security cheatsheet: https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html
