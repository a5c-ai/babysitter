# QA automation plan

## Scope

The QA plan covers:

- core resource model and CRDs;
- aggregated API and Postgres-backed resources;
- Kubernetes controller and gateway behavior;
- Gitea-backed repository data plane;
- web UI and route flows;
- CI/runners and pipeline/job lifecycle;
- hooks and webhook delivery;
- identity, RBAC, secrets, config, and policy;
- deployments and KubeVela/OAM integration;
- packaging, Helm chart, Docker image, install, smoke, and upgrade;
- future agents, Agent Mux integration, company brain memory, `.a5c` run imports, triggers, tools, skills, subagents, and orchestration.

## Test pyramid

| Layer | Goal | Examples | Required speed |
| --- | --- | --- | --- |
| Static checks | catch broken contracts before execution | docs coverage, package validation, schema lint, import checks | seconds. |
| Unit tests | verify pure functions and module contracts | resource schema, route helpers, auth helpers, redaction, ref resolution | seconds. |
| Integration tests | verify module boundaries with fakes | API controller, Kubernetes gateway, UI model, memory import normalizer | seconds to minutes. |
| Component/UI tests | verify rendered components and interactions | org switcher, repo tabs, dispatch composer, memory import panel | minutes. |
| Browser E2E | verify critical user journeys | create repo, run CI, dispatch agent, import memory | minutes. |
| Package/install tests | verify release artifact shape | Helm template, CRD coverage, minikube dry-run, Docker build | minutes. |
| Live cluster tests | verify real integrations | Gitea, NATS, ARC, Argo CD, KubeVela, webhooks | longer/nightly. |
| Chaos/reliability tests | verify failure behavior | watch reconnect, controller retry, Git outage, redaction failure | nightly/staging. |

## Definition of done

A feature is not done until:

- resource/API/schema docs are updated;
- unit or integration tests cover the core logic;
- at least one acceptance or E2E path covers the user-visible behavior;
- cross-org/RBAC/secret negative tests exist where relevant;
- docs validation and package validation pass;
- UI changes pass browser or component checks where relevant;
- release-impacting changes update chart/package tests;
- future agent/memory changes update the fixture plan and acceptance matrix.

## Rollout phases

### Phase 1: codify current gates

- Keep `npm run check` as the local all-up gate.
- Make `npm run validate:docs`, `npm test`, `npm run e2e`, `npm run package:check`, `npm run smoke`, `npm run ui:validate`, and `npm run ui:build` visible in CI docs.
- Add test ownership labels by subsystem.

### Phase 2: add browser automation

- Add Playwright for route-level browser tests.
- Cover org navigation, repository code/issues/runs/settings, deployments, and advanced plans.
- Add accessibility checks for primary routes.

### Phase 3: add API/controller contract tests

- Add table-driven tests for org-scoped API routes, resource apply/list/delete, watch, and errors.
- Add fake Kubernetes/Gitea/NATS/Agent Mux adapters.
- Add no-secret response tests.

### Phase 4: add agent/company-brain tests

- Add fixtures for org memory, `.a5c` run imports, historical memory refs, and Agent Mux session binding.
- Add cross-org denial and redaction tests.
- Add browser E2E for dispatch with memory and import review.

### Phase 5: staging and live integration

- Add nightly cluster tests for Gitea, Argo CD, KubeVela, ARC, NATS, webhooks, and object storage.
- Add upgrade/rollback tests.
- Add reliability and failure injection scenarios.

## Ownership model

| Area | Owner role | Required evidence |
| --- | --- | --- |
| Resource/API contracts | platform/backend | schema tests, API tests, docs coverage. |
| Controllers | platform/backend | reconciliation tests, idempotency tests, events/audit. |
| UI/UX | frontend/product | browser/component tests, accessibility, route guards. |
| CI/runners | platform/runtime | lifecycle E2E, isolation, ServiceAccount/RBAC tests. |
| Security | security/platform | auth/RBAC/secret/no-leak tests. |
| Packaging | release/platform | package/chart/install/smoke tests. |
| Agents/memory | agents/platform | dispatch, context, memory, Agent Mux, import, trigger tests. |

## Reporting

Every CI run should publish:

- command summary;
- pass/fail by suite;
- coverage by subsystem;
- flaky test list;
- failed test artifacts;
- browser traces/screenshots for UI failures;
- package/chart validation summary;
- security/secret-scan findings;
- links to run logs and relevant resources.
