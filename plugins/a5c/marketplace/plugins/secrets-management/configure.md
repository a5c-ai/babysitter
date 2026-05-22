# secrets-management — Configuration

## 1. Configuration Options Table

| Option | Values | Default | Where |
|--------|--------|---------|-------|
| `gitleaksConfig` | path | `.gitleaks.toml` | pre-commit + workflow |
| `gitleaksExtendDefault` | `true`/`false` | `true` | `.gitleaks.toml` `[extend]` |
| `trufflehogVerifiedOnly` | `true`/`false` | `true` | workflow `--only-verified` |
| `trufflehogHistoryCadence` | cron | `0 3 * * *` | workflow schedule |
| `blockCommitOnSecret` | `true`/`false` | `true` | pre-commit exit code |
| `envExampleEnforced` | `warn`, `error`, `off` | `warn` | env-example-check.sh |
| `secretBackend` | `vault`, `aws-sm`, `gcp-sm`, `azure-kv`, `doppler`, `1password` | `vault` | `src/secrets.ts` |
| `cacheTtlSec` | integer | `300` | secrets client |
| `rotationCadenceDays` | integer | `90` | runbook |
| `ciGate` | `off`, `warn`, `error` | `error` | workflow |

## 2. Add Custom Secret Patterns

Edit `.gitleaks.toml`:

```toml
[[rules]]
id = "internal-service-token"
description = "Internal service-to-service tokens"
regex = '''svc_[A-Za-z0-9_-]{40,}'''
tags = ["key", "internal"]

[[rules]]
id = "company-jwt"
description = "Company-issued JWT header"
regex = '''eyJhbGciOiJIUzI1NiIs[A-Za-z0-9._-]+'''
tags = ["jwt"]
```

## 3. Allowlist False Positives

```toml
[allowlist]
description = "Allowlist"
paths = [
  '''tests/fixtures/.*''',
  '''docs/examples/.*''',
  '''\.env\.example$''',
]
regexes = [
  '''TEST_[A-Z_]+=placeholder''',
]
commits = [
  "abc123def456",  # historical commit known to contain rotated-out secret
]
```

## 4. truffleHog Detector Tuning

```yaml
- uses: trufflesecurity/trufflehog@main
  with:
    base: ${{ github.event.repository.default_branch }}
    head: HEAD
    extra_args: --only-verified --include-detectors "all" --exclude-detectors "generic,base64"
```

Exclude noisy "generic" / "base64" detectors once baseline is clean.

## 5. Swap Secret Backend

### AWS Secrets Manager

```typescript
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
const client = new SecretsManagerClient({});

export async function getSecret(id: string) {
  const res = await client.send(new GetSecretValueCommand({ SecretId: id }));
  return JSON.parse(res.SecretString!);
}
```

### GCP Secret Manager

```typescript
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
const client = new SecretManagerServiceClient();

export async function getSecret(name: string) {
  const [v] = await client.accessSecretVersion({ name: `${name}/versions/latest` });
  return v.payload?.data?.toString();
}
```

Keep the `getSecret` surface stable so callers don't change.

## 6. Adjust Cache TTL

```typescript
const TTL_MS = Number(process.env.SECRETS_CACHE_TTL_MS || '300000');
```

Lower TTL = faster rotation propagation but more backend load.

## 7. Short-Lived Credentials (IAM / Workload Identity)

Prefer STS / Workload Identity Federation over long-lived access keys:

```yaml
# GitHub Actions OIDC → AWS
- uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: arn:aws:iam::123456789012:role/github-actions
    aws-region: us-east-1
```

No static keys checked in; rotation is automatic.

## 8. Enforce `.env.example` Strictly

Switch from warn to error in `scripts/env-example-check.sh`:

```bash
if [ -n "$missing" ]; then
  echo "::error::Env vars referenced in code but missing from .env.example:"
  echo "$missing"
  exit 1
fi
```

## 9. Run Secrets Audit Process

```bash
babysitter run:create \
  --process-id secrets-audit \
  --entry .a5c/processes/secrets-management/audit.js#process \
  --prompt "Walk docs/secrets-rotation.md and flag any entries with Last Rotated > 90 days or missing Owner; open rotation tickets" \
  --json
```

## 10. Handling a Live Leak

1. **Revoke** at source first (provider console / API)
2. **Rotate** per `docs/secrets-rotation.md` procedure
3. **Scrub** git history with `git filter-repo` — coordinate force-push with all contributors
4. **Re-scan**: `trufflehog git file://. --since-commit <rewrite> --only-verified`
5. **Document** the incident in `docs/incidents/YYYY-MM-DD-leak.md`

Never rely on deleting a file to "remove" a secret — the history still contains it. Always rotate at the source.
