# api-contract — Install Instructions

Set up API contract feedback loops — Spectral OpenAPI linting, drift detection against running services (schemathesis or Dredd), and a PR gate that fails on breaking changes to published endpoints. Works with any HTTP API that has an OpenAPI/Swagger spec.

## Step 1: Interview the User

### Stage 1: Project Analysis

1. Discover spec files: `openapi.yaml`, `openapi.json`, `swagger.yaml`, `api/**/*.yaml`, `docs/api/*.yaml`
2. Detect backend stack: Node (Express/Fastify/NestJS), Python (FastAPI/Django-REST/Flask), Go, Java (Spring), Ruby (Rails)
3. Check existing tooling: `@stoplight/spectral-cli`, `schemathesis`, `dredd`, `openapi-diff`, `oasdiff`
4. Check if spec is hand-written, generated from code, or code-first (FastAPI, NestJS decorators)
5. Check CI and git hooks
6. Summarize findings to the user

### Stage 2: Contract Layers

Ask the user which layers to install (multi-select):

1. **Spectral lint** — Style + correctness rules for OpenAPI spec
2. **Drift detection** — schemathesis / Dredd verifies running service matches spec
3. **Breaking-change gate** — oasdiff compares PR spec vs. main; fails PR on breakage
4. **Spec build check** — Ensure spec parses and references resolve
5. **All** — Install every layer

### Stage 3: Rule Sets

Confirm:
- Spectral ruleset? (`spectral:oas` [default], `@stoplight/spectral-owasp-ruleset`, custom)
- Drift tool? (`schemathesis` recommended for Python/any; `dredd` for Node)
- Breaking-change tool? (`oasdiff` recommended; `openapi-diff`)
- Gate level? (`breaking` blocks; `non-breaking` warns; `unclassified` warns)

## Step 2: Install Spectral

```bash
npm install -D @stoplight/spectral-cli
```

Create `.spectral.yaml`:

```yaml
extends:
  - spectral:oas
  - [spectral:oas, all]
rules:
  operation-operationId: error
  operation-summary: error
  operation-description: warn
  operation-tag-defined: error
  operation-success-response: error
  openapi-tags: warn
  info-contact: warn
  info-license: warn
  no-$ref-siblings: error
  duplicated-entry-in-enumeration: error
```

Add script:

```json
{ "scripts": { "api:lint": "spectral lint 'openapi.yaml'" } }
```

## Step 3: Install Drift Detection

### schemathesis (recommended)

```bash
pip install schemathesis
```

Run against a running service:

```bash
schemathesis run openapi.yaml --base-url http://localhost:8080 \
  --checks all \
  --hypothesis-max-examples 50
```

Add script to `package.json` or `Makefile`:

```json
{
  "scripts": {
    "api:drift": "schemathesis run openapi.yaml --base-url http://localhost:8080 --checks all"
  }
}
```

### Dredd (alternative for Node stacks)

```bash
npm install -D dredd
```

Create `dredd.yml`:

```yaml
dry-run: null
hookfiles: null
language: nodejs
server: null
server-wait: 3
reporter: apiary
blueprint: openapi.yaml
endpoint: "http://localhost:8080"
```

## Step 4: Install Breaking-Change Gate

```bash
# oasdiff via go install (preferred)
go install github.com/oasdiff/oasdiff@latest
# Or Docker
docker pull tufin/oasdiff
```

Script to compare PR spec vs. main:

```bash
# scripts/api-breaking-check.sh
git fetch origin main --depth=1
git show origin/main:openapi.yaml > /tmp/openapi-base.yaml
oasdiff breaking /tmp/openapi-base.yaml openapi.yaml --fail-on ERR
```

Add:

```json
{ "scripts": { "api:breaking": "bash scripts/api-breaking-check.sh" } }
```

## Step 5: Install Spec Build Check

Ensure refs resolve and spec is valid:

```bash
npm install -D @redocly/cli
```

```json
{ "scripts": { "api:build": "redocly lint openapi.yaml && redocly bundle openapi.yaml -o dist/openapi.yaml" } }
```

## Step 6: Set Up Pre-commit Hook

```bash
npm install -D husky lint-staged
npx husky init
```

```json
{
  "lint-staged": {
    "**/openapi.{yaml,yml,json}": ["spectral lint", "redocly lint"]
  }
}
```

## Step 7: Create GitHub Actions Workflow

Create `.github/workflows/api-contract.yml`:

```yaml
name: API Contract

on:
  pull_request:
    paths: ['openapi.yaml', 'openapi.json', 'api/**']
  push:
    branches: [main]

jobs:
  spectral:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: 'npm' }
      - run: npm ci
      - run: npm run api:lint

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: 'npm' }
      - run: npm ci
      - run: npm run api:build

  breaking-change:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v6
        with: { fetch-depth: 0 }
      - name: oasdiff
        uses: oasdiff/oasdiff-action/breaking@main
        with:
          base: origin/${{ github.base_ref }}:openapi.yaml
          revision: openapi.yaml
          fail-on-diff: true

  drift:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-python@v5
        with: { python-version: '3.12' }
      - run: pip install schemathesis
      - name: Start service
        run: |
          npm ci && npm run build
          npm run start &
          npx wait-on http://localhost:8080 --timeout 60000
      - run: schemathesis run openapi.yaml --base-url http://localhost:8080 --checks all
```

## Step 8: Run Baseline

```bash
npm run api:lint || true
npm run api:build || true
```

Report to the user: lint violations, unresolved refs, last breaking change commit.

## Step 9: Register Plugin

```bash
babysitter plugin:update-registry --plugin-name api-contract --plugin-version 1.0.0 --marketplace-name marketplace --project --json
```

## Step 10: Verify Setup

1. `npm run api:lint` completes with current violation count
2. `npm run api:build` bundles the spec without ref errors
3. `oasdiff breaking` runs locally against origin/main
4. Workflow is committed at `.github/workflows/api-contract.yml`
5. Drift job runs against a booted service and reports results

## Reference

- Spectral: https://docs.stoplight.io/docs/spectral/
- schemathesis: https://schemathesis.readthedocs.io/
- oasdiff: https://github.com/oasdiff/oasdiff
- Redocly CLI: https://redocly.com/docs/cli/
- OpenAPI 3.1 spec: https://spec.openapis.org/oas/v3.1.0
