# Test framework and tools

## Existing baseline

Krate currently uses Node.js with ESM and the built-in `node:test` runner for unit and E2E tests. The package scripts are the source of truth for current gates.

Existing tools:

| Tool | Use |
| --- | --- |
| Node `node:test` | unit, integration, and current E2E tests. |
| `assert/strict` | assertions. |
| Next.js build | production UI build validation. |
| custom scripts | docs, package, smoke, UI, minikube dry-run validation. |
| Helm/minikube dry-run plans | install command validation without a live cluster. |

## Recommended additions

| Tool | Add when | Use |
| --- | --- | --- |
| Playwright | first browser suite | browser E2E, traces, screenshots, route assertions, accessibility hooks. |
| Testing Library / React test utilities | component-level UI tests | component interaction tests without full browser cost. |
| Istanbul/c8 or Node coverage | coverage reporting | line/branch/function coverage for `src` and critical scripts. |
| `axe-core` or Playwright accessibility assertions | UI accessibility gate | WCAG smoke checks on primary pages. |
| Helm unittest or template assertions | chart complexity grows | focused Helm render checks beyond current string tests. |
| kubeconform/kubeval | CRD/chart validation | Kubernetes schema validation for rendered manifests. |
| actionlint | workflow validation | GitHub Actions YAML checks. |
| secret scanner | before memory imports and release | ensure fixtures/logs/artifacts do not leak secrets. |
| dependency/license scanner | release gate | supply-chain checks. |
| k6 or autocannon | performance stage | API/web smoke load tests. |

## Tool selection principles

- Prefer fast built-in Node tests for pure logic and contracts.
- Use browser automation only for routes and interactions that cannot be validated below the browser layer.
- Use deterministic fakes for Kubernetes, Gitea, Agent Mux, NATS, Argo CD, and object storage in PR gates.
- Use live integration only in nightly/staging or explicit release gates.
- Keep tests runnable on Windows and Linux.
- Store fixtures in repo; avoid network calls in deterministic CI unless the suite is explicitly live.

## Proposed npm scripts

Future scripts should be additive and keep current scripts stable:

```json
{
  "test:unit": "node --test tests/unit/**/*.test.js",
  "test:integration": "node --test tests/integration/**/*.test.js",
  "test:api": "node --test tests/api/**/*.test.js",
  "test:e2e": "node --test tests/e2e/**/*.test.js",
  "test:browser": "playwright test",
  "test:coverage": "node --test --experimental-test-coverage tests/**/*.test.js",
  "test:security": "node scripts/security-check.mjs",
  "test:charts": "node scripts/validate-package.mjs",
  "test:all": "npm run check && npm run test:browser"
}
```

The exact script names can change during implementation, but the suite split should remain recognizable.

## Test doubles

Required fakes/mocks:

| Adapter | Fake behavior |
| --- | --- |
| Kubernetes API | list/get/apply/delete/watch resources, SubjectAccessReview, events. |
| Gitea/Git | repository create, refs, commits, clone URL, protected branches, webhook callbacks. |
| Postgres | aggregated resources and migrations, preferably in-memory or isolated test DB. |
| Object storage | artifact put/get by digest. |
| NATS/webhook queue | enqueue, deliver, retry, replay. |
| Agent Mux | create run/session, stream events, accept chat continuation, cancel/resume. |
| Memory Git repo | resolve refs, read files, grep, write branch/PR, merge, diff. |
| Argo CD/KubeVela | Application status, sync plan, rollout state. |

## Artifacts

Test failures should preserve:

- assertion output;
- API request/response body with secrets redacted;
- generated YAML/resource plans;
- browser trace and screenshot;
- console/network logs for browser failures;
- rendered Helm manifests;
- memory import validation report;
- `.a5c` fixture redaction report;
- coverage report.
