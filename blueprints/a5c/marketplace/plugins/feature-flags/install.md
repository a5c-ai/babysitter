# feature-flags — Install Instructions

Wire a feature-flag system into your project — OpenFeature (vendor-neutral), LaunchDarkly, or Unleash — plus PR-time flag audits, stale-flag cleanup automation, and a CI workflow that fails if flags drift out of policy.

## Step 1: Interview the User

### Stage 1: Project Analysis

Before asking questions, analyze the project:
1. Read `package.json`, `pyproject.toml`, `go.mod`, `pom.xml` to identify language
2. Detect web/service entry points: `next.config.*`, `app.ts`, `server.py`, `main.go`
3. Check for existing flag SDKs: `@openfeature/*`, `launchdarkly-*`, `unleash-client`, `configcat-*`
4. Check for feature toggling idioms in code (search: `if (flag.` / `isEnabled(`)
5. Check for existing CI/CD
6. Summarize findings to the user

### Stage 2: Provider Selection

Ask which provider to install (single-select):

1. **OpenFeature** — Vendor-neutral API, swap providers later (recommended default)
2. **LaunchDarkly** — Enterprise SaaS, native SDK
3. **Unleash** — Open-source, self-hostable
4. **ConfigCat** — Free tier, simple
5. **Flagsmith** — Open-source, self-hostable alternative

### Stage 3: Flag Taxonomy

Ask:
- Flag naming convention: `kebab-case` (default), `snake_case`, `camelCase`
- Required metadata: `owner`, `createdAt`, `expiresAt`, `jiraTicket`, `description`
- Flag types used: `release`, `experiment`, `ops`, `permission` (default: all four)
- Max flag lifetime before auto-cleanup: `30d`, `60d`, `90d`, `never` (default: `60d` for release, `never` for ops)

### Stage 4: Audit & Cleanup Policy

Ask:
- Run PR flag audit on every PR? (default: yes)
- Fail PR if new flag lacks metadata? (default: yes)
- Fail PR if flag deleted from code but still exists remotely? (default: warn)
- Schedule weekly stale-flag cleanup job? (default: yes)

### Stage 5: Environments

Ask:
- Environments to configure: `dev`, `staging`, `prod` (default: all three)
- Per-environment default state for new flags: `off everywhere` (default) / `on in dev`
- Admin approval required for prod flag flip? (default: yes)

## Step 2: Install SDK

### OpenFeature (Node)

```bash
npm install @openfeature/server-sdk @openfeature/web-sdk
# Pick a provider:
npm install @openfeature/launchdarkly-provider
# or:
npm install @openfeature/unleash-provider
```

Create `src/flags/client.ts`:

```typescript
import { OpenFeature } from '@openfeature/server-sdk';
import { LaunchDarklyProvider } from '@openfeature/launchdarkly-provider';

await OpenFeature.setProviderAndWait(
  new LaunchDarklyProvider(process.env.LD_SDK_KEY!)
);

export const flags = OpenFeature.getClient();
```

### OpenFeature (Python)

```bash
pip install openfeature-sdk openfeature-provider-launchdarkly
```

```python
from openfeature import api
from openfeature.provider.launchdarkly import LaunchDarklyProvider

api.set_provider(LaunchDarklyProvider(sdk_key=os.environ["LD_SDK_KEY"]))
flags = api.get_client()
```

### OpenFeature (Go)

```bash
go get github.com/open-feature/go-sdk/openfeature
go get github.com/open-feature/go-sdk-contrib/providers/launchdarkly
```

### LaunchDarkly (direct SDK)

```bash
npm install launchdarkly-node-server-sdk
```

### Unleash

```bash
npm install unleash-client
```

## Step 3: Define Flag Schema

Create `flags/flags.yaml`:

```yaml
# Source-of-truth flag registry. Kept in git.
flags:
  - key: new-checkout-flow
    type: release
    owner: checkout-team
    description: Rollout of v2 checkout
    createdAt: 2026-04-01
    expiresAt: 2026-07-01
    jiraTicket: CHK-123
    defaults:
      dev: true
      staging: true
      prod: false

  - key: kill-switch-payments
    type: ops
    owner: platform
    description: Emergency disable of payments
    createdAt: 2026-01-01
    expiresAt: null   # ops flags don't expire
```

Validate with a JSON schema at `flags/schema.json`:

```json
{
  "type": "object",
  "required": ["flags"],
  "properties": {
    "flags": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["key", "type", "owner", "description", "createdAt"],
        "properties": {
          "key": { "type": "string", "pattern": "^[a-z0-9-]+$" },
          "type": { "enum": ["release", "experiment", "ops", "permission"] },
          "expiresAt": { "type": ["string", "null"], "format": "date" }
        }
      }
    }
  }
}
```

## Step 4: Install Audit Scripts

### Find undeclared flags in code

Create `scripts/audit-flags.mjs`:

```javascript
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import yaml from 'yaml';

const declared = new Set(
  yaml.parse(readFileSync('flags/flags.yaml', 'utf8')).flags.map((f) => f.key)
);

const grep = execSync(
  `git grep -hoE "(getBooleanValue|getStringValue|isEnabled)\\\\(['\\"]([a-z0-9-]+)['\\"]" -- '*.ts' '*.tsx' '*.js' '*.py' '*.go' || true`
).toString();

const used = new Set(
  [...grep.matchAll(/['"]([a-z0-9-]+)['"]/g)].map((m) => m[1])
);

const undeclared = [...used].filter((k) => !declared.has(k));
const unused = [...declared].filter((k) => !used.has(k));

if (undeclared.length) {
  console.error('Undeclared flags used in code:', undeclared);
  process.exit(1);
}
if (unused.length) {
  console.warn('Declared flags not used in code:', unused);
}
```

Add to `package.json`:

```json
{ "scripts": { "flags:audit": "node scripts/audit-flags.mjs" } }
```

### Find stale flags (past expiresAt)

Create `scripts/stale-flags.mjs`:

```javascript
import { readFileSync } from 'node:fs';
import yaml from 'yaml';

const { flags } = yaml.parse(readFileSync('flags/flags.yaml', 'utf8'));
const now = new Date();
const stale = flags.filter((f) => f.expiresAt && new Date(f.expiresAt) < now);

if (stale.length) {
  console.error('Stale flags (past expiresAt):');
  stale.forEach((f) => console.error(`  ${f.key} (owner: ${f.owner}, expired: ${f.expiresAt})`));
  process.exit(1);
}
```

## Step 5: Create GitHub Actions Workflow

Create `.github/workflows/flags.yml`:

```yaml
name: Feature Flags
on:
  pull_request:
    paths: ['flags/**', '**/*.ts', '**/*.tsx', '**/*.py', '**/*.go']
  schedule:
    - cron: '0 9 * * 1'  # Monday 09:00 UTC — stale-flag sweep
jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: 'npm' }
      - run: npm ci
      - name: Validate flag schema
        run: npx ajv validate -s flags/schema.json -d flags/flags.yaml
      - run: npm run flags:audit
  stale:
    if: github.event_name == 'schedule'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: node scripts/stale-flags.mjs
      - name: Open cleanup issue
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: 'Stale feature flags need cleanup',
              body: 'See workflow run for the list of expired flags.',
              labels: ['tech-debt', 'feature-flags']
            });
```

## Step 6: Add Pre-commit Validation

For Node:

```bash
npm install -D husky lint-staged
```

```json
{
  "lint-staged": {
    "flags/flags.yaml": ["npx ajv validate -s flags/schema.json -d"]
  }
}
```

For Python:

```yaml
repos:
  - repo: https://github.com/python-jsonschema/check-jsonschema
    rev: 0.29.4
    hooks:
      - id: check-jsonschema
        files: flags/flags\.yaml$
        args: [--schemafile, flags/schema.json]
```

## Step 7: Configure Secrets

- `LD_SDK_KEY` (LaunchDarkly server key)
- `UNLEASH_API_TOKEN` (Unleash)
- `FLAGSMITH_ENV_KEY` (Flagsmith)

Store per-environment in repo settings → Environments.

## Step 8: Seed Initial Flags

```bash
mkdir -p flags
cat > flags/flags.yaml <<'EOF'
flags: []
EOF
git add flags/ scripts/audit-flags.mjs .github/workflows/flags.yml
git commit -m "chore: add feature-flags plugin"
```

## Step 9: Register Plugin

```bash
babysitter plugin:update-registry --plugin-name feature-flags --plugin-version 1.0.0 --marketplace-name marketplace --project --json
```

## Step 10: Verify Setup

1. `npm run flags:audit` exits 0 with empty flag list
2. Adding a flag usage without declaring in `flags.yaml` fails the workflow
3. Schema validation catches malformed entries
4. Scheduled workflow detects flags past `expiresAt`
5. SDK client returns provider-evaluated values in the running app

## Reference

- OpenFeature: https://openfeature.dev/
- LaunchDarkly: https://docs.launchdarkly.com/
- Unleash: https://docs.getunleash.io/
- Flag lifecycle best practices: https://launchdarkly.com/blog/feature-flag-management/
