# secrets-management — Install Instructions

Set up secrets-management feedback loops — gitleaks pre-commit hook to block secrets before they land, truffleHog scan in CI (history + PR diff), a rotation runbook, and a HashiCorp Vault / cloud-KMS integration stub ready to wire up to the app.

## Step 1: Interview the User

### Stage 1: Project Analysis

1. Detect language(s) and deployment target (k8s, Lambda, Vercel, Fly, bare VM)
2. Discover env handling: `.env`, `.env.example`, `direnv`, `dotenv`, `chamber`, `sops`
3. Check for likely secret locations: `config/secrets.*`, `credentials.json`, `*.pem`, `*.key`
4. Check existing tooling: `gitleaks`, `trufflehog`, `detect-secrets`, `git-secrets`, `ggshield`
5. Check CI and pre-commit framework presence
6. Summarize findings to the user

### Stage 2: Layers

Ask the user which layers to install (multi-select):

1. **gitleaks pre-commit** — Block commits containing secrets
2. **truffleHog CI** — Scan PR diff + full history for high-entropy strings and verified leaks
3. **Rotation runbook** — Documented process for rotating each secret category
4. **Vault integration stub** — Opinionated Vault / KMS client + env-loader scaffolding
5. **`.env.example` enforcement** — Fail CI when `.env` committed or `.env.example` missing a key used in code
6. **All** — Install every layer

### Stage 3: Secret Backends

Ask:
- Secret backend? (HashiCorp Vault / AWS Secrets Manager / GCP Secret Manager / Azure Key Vault / Doppler / 1Password Connect)
- Runtime injection style? (env vars / file mount / SDK fetch)
- Rotation cadence? (default: `90 days` for long-lived credentials; `on-demand` for ephemeral)

## Step 2: Install gitleaks

```bash
# macOS
brew install gitleaks
# Linux / CI via action
```

Create `.gitleaks.toml` (extend defaults):

```toml
[extend]
useDefault = true

[[rules]]
id = "internal-api-token"
description = "Internal API tokens prefixed with a5c_"
regex = '''a5c_[A-Za-z0-9]{32,}'''
tags = ["key", "internal"]

[allowlist]
description = "Global allowlist"
paths = [
  '''\.env\.example$''',
  '''docs/examples/.*''',
  '''tests/fixtures/.*''',
]
regexes = [
  '''AKIAIOSFODNN7EXAMPLE''',           # AWS docs example
  '''wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY''',
]
```

## Step 3: Pre-commit Hook

Add gitleaks to `.pre-commit-config.yaml`:

```yaml
repos:
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.21.2
    hooks:
      - id: gitleaks
```

Install:

```bash
pip install pre-commit
pre-commit install
```

Alternative Node-only setup via husky:

```bash
# .husky/pre-commit
gitleaks protect --staged --redact --config .gitleaks.toml || {
  echo "Secrets detected — commit blocked. Fix or use --no-verify in emergencies."
  exit 1
}
```

## Step 4: truffleHog CI Scan

Create `.github/workflows/secrets.yml`:

```yaml
name: Secrets Scan

on:
  pull_request:
  push:
    branches: [main]
  schedule:
    - cron: '0 3 * * *'  # daily history scan

jobs:
  trufflehog-pr:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
        with: { fetch-depth: 0 }
      - uses: trufflesecurity/trufflehog@main
        with:
          base: ${{ github.event.repository.default_branch }}
          head: HEAD
          extra_args: --only-verified --fail

  trufflehog-history:
    if: github.event_name == 'schedule' || github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
        with: { fetch-depth: 0 }
      - uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          extra_args: --only-verified --fail

  gitleaks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
        with: { fetch-depth: 0 }
      - uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GITLEAKS_CONFIG: .gitleaks.toml

  env-example-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - run: bash scripts/env-example-check.sh
```

## Step 5: `.env.example` Enforcement

Create `scripts/env-example-check.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
# Fail if .env is committed
if git ls-files --error-unmatch .env 2>/dev/null; then
  echo "::error::.env is committed — remove via 'git rm --cached .env'"
  exit 1
fi
# Ensure .env is gitignored
grep -qE '^\.env$' .gitignore || {
  echo "::error::Add .env to .gitignore"
  exit 1
}
# Compare .env.example keys to code references
if [ -f .env.example ]; then
  used=$(grep -rhoE 'process\.env\.[A-Z_]+|os\.environ\[["'\'']([A-Z_]+)["'\'']\]|os\.getenv\(["'\'']([A-Z_]+)' src/ 2>/dev/null | \
    grep -oE '[A-Z_]+' | sort -u || true)
  documented=$(grep -oE '^[A-Z_]+' .env.example | sort -u)
  missing=$(comm -23 <(echo "$used") <(echo "$documented") || true)
  if [ -n "$missing" ]; then
    echo "::warning::Env vars referenced in code but missing from .env.example:"
    echo "$missing"
  fi
fi
```

## Step 6: Rotation Runbook

Create `docs/secrets-rotation.md`:

```markdown
# Secrets Rotation Runbook

## Inventory

| Secret | Backend Path | Category | Rotation Cadence | Owner | Last Rotated |
|--------|--------------|----------|------------------|-------|--------------|
| DATABASE_URL | vault://kv/prod/db | long-lived | 90d | platform | YYYY-MM-DD |
| STRIPE_SECRET_KEY | vault://kv/prod/stripe | long-lived | 180d | payments | YYYY-MM-DD |
| JWT_SIGNING_KEY | vault://kv/prod/jwt | long-lived | 90d | auth | YYYY-MM-DD |
| AWS_ACCESS_KEY_ID | AWS IAM | short-lived | on-demand via STS | platform | n/a |

## Procedure (Long-Lived Credential)

1. **Generate new secret** at source (DB user, API provider console, etc.)
2. **Store new version** in backend with staging label: `vault kv put kv/prod/<name> value=<new> stage=pending`
3. **Deploy apps** that read the secret — they pick up new version on restart
4. **Verify** downstream systems authenticate with new secret (monitor error rate)
5. **Promote**: `vault kv metadata patch kv/prod/<name> custom_metadata=stage=active`
6. **Revoke** old secret at source
7. **Update** `docs/secrets-rotation.md` with new `Last Rotated` date

## Incident (Leaked Secret)

1. Revoke immediately at source
2. Rotate per procedure above, skip graceful stage
3. Scrub history: `git filter-repo --replace-text secrets.txt` (coordinate with all contributors)
4. File incident ticket, notify security team
5. Run `trufflehog git file://. --since-commit <rewrite> --only-verified`
```

## Step 7: Vault Integration Stub

Create `src/secrets.ts` (Node example):

```typescript
// Opinionated wrapper over HashiCorp Vault KV v2
import vault from 'node-vault';

const client = vault({
  apiVersion: 'v1',
  endpoint: process.env.VAULT_ADDR || 'http://127.0.0.1:8200',
  token: process.env.VAULT_TOKEN,
});

const cache = new Map<string, { value: unknown; expires: number }>();
const TTL_MS = 5 * 60 * 1000;

export async function getSecret<T = string>(path: string, field = 'value'): Promise<T> {
  const key = `${path}::${field}`;
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as T;
  const res = await client.read(`kv/data/${path}`);
  const value = res.data.data[field] as T;
  cache.set(key, { value, expires: Date.now() + TTL_MS });
  return value;
}
```

Python equivalent in `app/secrets.py`:

```python
import os, time, hvac

_client = hvac.Client(url=os.environ.get("VAULT_ADDR", "http://127.0.0.1:8200"),
                      token=os.environ.get("VAULT_TOKEN"))
_cache: dict[tuple[str, str], tuple[object, float]] = {}
_TTL = 300

def get_secret(path: str, field: str = "value"):
    key = (path, field)
    now = time.time()
    if key in _cache and _cache[key][1] > now:
        return _cache[key][0]
    resp = _client.secrets.kv.v2.read_secret_version(path=path)
    value = resp["data"]["data"][field]
    _cache[key] = (value, now + _TTL)
    return value
```

Swap the backend (AWS Secrets Manager, GCP Secret Manager, Doppler) by replacing the client — keep the `getSecret` surface stable.

## Step 8: Run Baseline Scan

```bash
gitleaks detect --no-git --source . --config .gitleaks.toml || true
trufflehog git file://. --only-verified || true
```

Report findings; escalate any verified leaks through the rotation runbook immediately.

## Step 9: Register Plugin

```bash
babysitter plugin:update-registry --plugin-name secrets-management --plugin-version 1.0.0 --marketplace-name marketplace --project --json
```

## Step 10: Verify Setup

1. `gitleaks protect --staged` runs clean
2. `trufflehog git file://.` completes
3. `.env.example` present; `.env` is gitignored
4. `docs/secrets-rotation.md` exists and inventory is filled in
5. `src/secrets.ts` or `app/secrets.py` compiles/imports
6. Workflow committed at `.github/workflows/secrets.yml`

## Reference

- gitleaks: https://github.com/gitleaks/gitleaks
- truffleHog: https://github.com/trufflesecurity/trufflehog
- Vault KV v2: https://developer.hashicorp.com/vault/docs/secrets/kv/kv-v2
- AWS Secrets Manager: https://docs.aws.amazon.com/secretsmanager/
- GCP Secret Manager: https://cloud.google.com/secret-manager/docs
