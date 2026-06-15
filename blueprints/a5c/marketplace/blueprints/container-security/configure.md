# container-security — Configuration

## 1. Configuration Options Table

| Option | Values | Default | Where |
|--------|--------|---------|-------|
| `hadolintThreshold` | `info`, `warning`, `error`, `style` | `error` | `.hadolint.yaml` |
| `hadolintIgnored` | list of rule codes | `[DL3008]` | `.hadolint.yaml` ignored |
| `trivySeverity` | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` csv | `HIGH,CRITICAL` | workflow + scripts |
| `ignoreUnfixed` | `true`/`false` | `true` | trivy-action |
| `trivyScanType` | `fs`, `image`, `config`, `rootfs` | `fs`+`image` | workflow |
| `failOnSecretDetect` | `true`/`false` | `true` | Trivy secret scan |
| `postureRequireUser` | `true`/`false` | `true` | `container-posture.sh` |
| `postureRequireDistroless` | `true`/`false` | `false` (warn) | posture script |
| `composeDenyPrivileged` | `true`/`false` | `true` | compose-lint |
| `composeDenyLatestTag` | `warn`, `error`, `off` | `warn` | compose-lint |
| `ciGate` | `off`, `warn`, `error` | `error` | workflow |

## 2. Adjust hadolint Rules

Edit `.hadolint.yaml`:

```yaml
ignored:
  - DL3008
  - DL3018   # alpine pin
  - DL3013   # pip pin
override:
  error:
    - DL3002
    - DL3025
    - DL4006
  warning:
    - DL3059   # multiple consecutive RUN
```

## 3. Tune Trivy Severity

```bash
trivy image --severity MEDIUM,HIGH,CRITICAL --ignore-unfixed --exit-code 1 app:local
```

Workflow:

```yaml
- uses: aquasecurity/trivy-action@master
  with:
    severity: MEDIUM,HIGH,CRITICAL
    vuln-type: 'os,library'
    scanners: 'vuln,secret,config'
```

## 4. Ignore Specific CVEs

Edit `.trivyignore`:

```
# Accepted until 2026-06-01: vendor patch pending, mitigated by WAF
CVE-2025-12345
# Not applicable: vulnerable code path unreachable in our usage
CVE-2025-67890
```

Review dates matter — add a scheduled job to re-audit quarterly.

## 5. Distroless Migration

Swap a node:alpine base for distroless:

```dockerfile
# Build stage
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Runtime stage — distroless, no shell
FROM gcr.io/distroless/nodejs22-debian12
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
USER 10001:10001
CMD ["dist/index.js"]
```

## 6. Rootless Runtime

Add to Dockerfile:

```dockerfile
RUN addgroup -g 10001 -S app && adduser -u 10001 -S app -G app
USER 10001:10001
```

Verify at runtime: `docker run --read-only --cap-drop=ALL app:local`.

## 7. Image Digest Pinning

```dockerfile
# Instead of FROM node:22-alpine
FROM node:22-alpine@sha256:abc123...def789
```

Renovate can auto-update digests — add to `renovate.json`:

```json
{ "docker": { "pinDigests": true } }
```

## 8. Additional Compose Checks

Extend `scripts/compose-lint.sh`:

```bash
grep -Eq 'network_mode:\s*host' "$f" && echo "::error::host network mode disallowed" && exit 1
grep -Eq 'pid:\s*host' "$f" && echo "::error::host PID namespace disallowed" && exit 1
grep -Eq 'cap_add:.*SYS_ADMIN' "$f" && echo "::error::SYS_ADMIN capability disallowed" && exit 1
```

## 9. Run Container Hardening Process

```bash
babysitter run:create \
  --process-id container-harden \
  --entry .a5c/processes/container-security/harden.js#process \
  --prompt "Migrate all Dockerfiles to distroless base with USER 10001 and pinned digests; fix hadolint errors" \
  --json
```

## 10. SBOM + Vulnerability Correlation

Generate SBOM during image build and scan it:

```yaml
- uses: anchore/sbom-action@v0
  with:
    image: app:ci
    format: cyclonedx-json
- uses: anchore/scan-action@v3
  with:
    image: app:ci
    fail-build: true
    severity-cutoff: high
```

Upload SBOM as release asset for downstream consumers.
