# Test suite layout and naming

## Purpose

This document defines the future test directory layout, naming conventions, fixture locations, and ownership model. The current repository can keep existing tests while migrating incrementally toward this structure.

## Proposed layout

```text
tests/
  unit/
    resource-model.test.js
    route-helpers.test.js
    redaction.test.js
    memory-ref-resolution.test.js
  integration/
    api-controller.test.js
    controller-ui-model.test.js
    gitea-backend.test.js
    memory-import-normalizer.test.js
  api/
    org-resources.test.js
    agent-dispatch.test.js
    memory-query.test.js
    watch-filters.test.js
  e2e/
    lifecycle.test.js
    org-isolation.test.js
    repository-pr-ci.test.js
    deployment-promotion.test.js
    agent-memory-vertical.test.js
  browser/
    org-navigation.spec.ts
    repository-flow.spec.ts
    run-detail.spec.ts
    agent-memory.spec.ts
  fixtures/
    orgs/
    resources/
    repositories/
    webhooks/
    deployments/
    agents/
    memory/
      company-brain/
      a5c-runs/
      sessions/
  helpers/
    fake-kubernetes.js
    fake-gitea.js
    fake-agent-mux.js
    fake-memory-repo.js
    assertions.js
```

## Naming conventions

| Type | Convention |
| --- | --- |
| Node tests | `*.test.js` using Node `node:test`. |
| Playwright tests | `*.spec.ts` or `*.spec.js` under `tests/browser`. |
| Fixtures | kebab-case directory and file names. |
| Fake adapters | `fake-<adapter>.js`. |
| Golden outputs | `<scenario>.expected.json` only when stable and reviewed. |
| Redaction fixtures | include `redact-me` in synthetic secret values. |

## Test metadata

Each larger scenario test should declare:

```js
const meta = {
  area: 'agents-memory',
  owner: 'platform-agents',
  gate: 'pr|merge|nightly|release',
  requires: ['fake-kubernetes', 'fake-memory-repo'],
  covers: ['ORG-ISOLATION', 'MEMORY-SNAPSHOT']
};
```

Metadata can be comments or exported constants at first. Later it can feed reports.

## Fixture policy

- Tests may mutate copies of fixtures, never the fixture source.
- Fixtures with secret-like values must be synthetic and documented.
- Fixture IDs and timestamps should be stable.
- Fixture resource names should include org where useful.
- Large fixture artifacts should be minimized; prefer digest manifests.

## Migration from current layout

Current tests in `tests/*.test.js` and `tests/e2e/*.test.js` do not need to move immediately. Migration steps:

1. keep existing scripts green;
2. add new directories when first tests for that layer are created;
3. move tests only when imports and CI scripts are updated in the same change;
4. keep `npm test` backwards-compatible or make it run all unit/integration tests;
5. update docs/tests and package scripts together.

## Ownership labels

Recommended owners:

| Prefix | Area |
| --- | --- |
| `core-*` | resource model, API controller, storage. |
| `ui-*` | web UI, browser, accessibility. |
| `runtime-*` | runners, pipelines, jobs, Gitea, hooks. |
| `deploy-*` | Argo CD, KubeVela, chart/install. |
| `security-*` | auth, RBAC, secrets, policy, audit. |
| `agents-*` | agent stacks, Agent Mux, memory, triggers, imports. |

## Review checklist

- Does the test run without network unless marked live?
- Does it clean up temporary files/resources?
- Does it assert org and namespace where relevant?
- Does it assert stable error codes for failure paths?
- Does it avoid real secrets and PII?
- Does it avoid brittle visual or string-only assertions when semantic assertions are possible?
