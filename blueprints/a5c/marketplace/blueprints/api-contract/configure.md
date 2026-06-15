# api-contract — Configuration

## 1. Configuration Options Table

| Option | Values | Default | Where |
|--------|--------|---------|-------|
| `specPath` | glob | `openapi.yaml` | all tools |
| `spectralRuleset` | `oas`, `oas:all`, `owasp`, custom | `oas` | `.spectral.yaml` extends |
| `breakingGate` | `off`, `warn`, `error` | `error` | workflow `fail-on-diff` |
| `driftChecks` | `all`, `response_schema_conformance`, `status_code_conformance`, custom | `all` | schemathesis `--checks` |
| `driftMaxExamples` | integer | `50` | schemathesis hypothesis |
| `oasdiffFailOn` | `ERR`, `WARN`, `INFO` | `ERR` | `oasdiff breaking` |
| `bundleFormat` | `yaml`, `json` | `yaml` | Redocly bundle |
| `ignoreRules` | list | `[]` | Spectral `rules:` overrides |
| `baseUrl` | URL | `http://localhost:8080` | schemathesis `--base-url` |
| `auth` | `none`, `bearer`, `basic`, `api-key` | `none` | schemathesis `--header` |

## 2. Customize Spectral Rules

Edit `.spectral.yaml`:

```yaml
extends:
  - spectral:oas
rules:
  operation-operationId: error
  operation-description: off          # relax
  custom-snake-case-ids:
    description: Operation IDs must be snake_case
    given: $.paths[*][*].operationId
    then:
      function: pattern
      functionOptions:
        match: "^[a-z][a-z0-9_]*$"
    severity: error
```

## 3. Tune Breaking-Change Sensitivity

`oasdiff` classifies changes. Configure what fails the PR:

```yaml
# .github/workflows/api-contract.yml
- uses: oasdiff/oasdiff-action/breaking@main
  with:
    base: origin/main:openapi.yaml
    revision: openapi.yaml
    fail-on-diff: true        # any breaking
    severity-level: WARN      # fail also on warnings
```

Allow explicit exceptions via `oasdiff --exclude-elements description,examples`.

## 4. Drift Test Filters

```bash
schemathesis run openapi.yaml \
  --base-url http://localhost:8080 \
  --endpoint '^/api/v1/.*' \
  --exclude-endpoint '^/api/v1/admin/.*' \
  --checks all \
  --hypothesis-max-examples 100
```

## 5. Auth for Drift Tests

Bearer token:

```bash
schemathesis run openapi.yaml \
  --base-url http://localhost:8080 \
  -H "Authorization: Bearer $TEST_TOKEN"
```

## 6. Gate Levels by Route

Use oasdiff's YAML config to scope enforcement:

```yaml
# oasdiff.yaml
strict: false
exclude-elements:
  - description
  - examples
paths:
  - '/api/v2/.*'   # v2 is stable; enforce strictly
excludePaths:
  - '/api/v1beta/.*'  # beta API exempt
```

## 7. Change Spec Format (YAML vs JSON)

```bash
# Convert yaml → json
npx @redocly/cli bundle openapi.yaml -o openapi.json
# Update all tool configs to point at new file
```

## 8. Stub Service for Contract Testing

Spin up a Prism mock from the spec:

```bash
npm install -D @stoplight/prism-cli
npx prism mock openapi.yaml --port 4010
```

Run consumer tests against `http://localhost:4010`.

## 9. Run API Contract Fix Process

```bash
babysitter run:create \
  --process-id api-contract-fix \
  --entry .a5c/processes/api-contract/fix.js#process \
  --prompt "Fix all Spectral errors and add missing operationId/summary to every endpoint" \
  --json
```

## 10. Publish Spec on Release

Add a release workflow step:

```yaml
- name: Bundle + upload spec
  run: npx @redocly/cli bundle openapi.yaml -o dist/openapi.yaml
- uses: actions/upload-artifact@v4
  with:
    name: openapi-spec
    path: dist/openapi.yaml
```

Downstream consumers pull the artifact or a published Redocly/Bump.sh doc.
