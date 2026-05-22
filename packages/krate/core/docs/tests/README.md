# QA automation and test strategy

## Purpose

This directory defines Krate's QA automation plan, framework, and tooling for existing and future functionality. It covers unit tests, integration tests, API/controller tests, browser and UI tests, E2E tests, package/chart tests, security checks, accessibility, performance, coverage, fixtures, and CI gates.

The plan is product-wide: current forge features, Kubernetes-native resource APIs, org-scoped UI, Gitea/Git hosting, CI/runners, hooks, deployments, KubeVela/OAM, and future agent/company-brain functionality all share one quality model.

## Current test anchors

Krate already has these executable gates:

| Command | Current purpose |
| --- | --- |
| `npm test` | Node test runner over `tests/*.test.js`. |
| `npm run e2e` | Node test runner over `tests/e2e/*.test.js`. |
| `npm run validate:docs` | docs/ontology/source coverage validation. |
| `npm run package:check` | package/chart/example coverage validation. |
| `npm run ui:validate` | static UI validation. |
| `npm run ui:build` | Next.js production build. |
| `npm run smoke` | runtime smoke validation. |
| `npm run check` | full local quality gate chaining build, docs, tests, e2e, package, smoke, UI validation, and UI build. |

## Documents

- [QA automation plan](./qa-automation-plan.md) defines the lifecycle, test pyramid, responsibilities, rollout order, and done criteria.
- [Test framework and tools](./test-framework-tools.md) defines the recommended tools and how they map to Krate layers.
- [Coverage model](./coverage-model.md) defines coverage dimensions, thresholds, traceability, and reporting.
- [Unit and integration tests](./unit-integration-tests.md) defines module, controller, API, resource-model, and persistence tests.
- [E2E and scenario tests](./e2e-scenario-tests.md) defines end-to-end flows for forge, org, runners, hooks, deployments, and agents.
- [Browser and UI tests](./browser-ui-tests.md) defines browser automation, component tests, accessibility, visual, and UX assertions.
- [CI quality gates](./ci-quality-gates.md) defines PR, merge, release, nightly, and staging gates.
- [Fixtures and test data](./fixtures-test-data.md) defines deterministic org/repo/memory/.a5c fixtures and data policy.
- [Security and compliance tests](./security-compliance-tests.md) defines auth, RBAC, secret, supply-chain, and audit checks.
- [Observability and reliability tests](./observability-reliability-tests.md) defines metrics, events, logs, watches, retries, and failure injection.
- [Agent QA plan](./agent-qa-plan.md) defines tests for agent dispatch, Agent Mux sessions, company brain memory, triggers, tools, subagents, and run imports.

## Quality principles

- Every feature has tests at the lowest useful layer plus at least one user-facing acceptance path.
- Every controller side effect has idempotency, retry, and audit tests.
- Every org-scoped path has cross-org negative tests.
- Every UI action has a server-enforced permission test behind it.
- Every secret/config/tool/memory path has no-leak tests.
- Every future feature ships with fixtures before broad E2E expansion.
- Browser tests focus on critical workflows and route semantics, not brittle snapshots.
- Package/chart checks are release blockers, not optional validation.

## Additional planning docs

- [Product test matrix](./product-test-matrix.md) maps every major product area to unit, integration/API, browser/UI, E2E, security, and package coverage.
- [Test suite layout and naming](./test-suite-layout.md) defines future test directories, naming, metadata, fixtures, and migration rules.
- [QA adoption roadmap](./qa-adoption-roadmap.md) sequences the move from current gates to browser, coverage, security, agent, and live reliability gates.
