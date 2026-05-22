# QA adoption roadmap

## Purpose

This roadmap sequences QA automation work so Krate can improve coverage without blocking every product change on the final-state toolchain.

## Stage 0: current baseline

Status: available now.

Required gates:

- `npm run validate:docs`;
- `npm test`;
- `npm run e2e`;
- `npm run package:check`;
- `npm run smoke`;
- `npm run ui:validate`;
- `npm run ui:build`;
- `npm run check` before release-like changes.

## Stage 1: suite organization

Add:

- `tests/fixtures` with org/repository/resource fixtures;
- test helper modules for fake Kubernetes and API controller setup;
- metadata comments for owner/gate/area;
- docs check that `docs/tests` exists and is linked.

Exit criteria:

- existing tests still pass;
- new fixture policy is followed;
- no behavior change required.

## Stage 2: browser route smoke

Add:

- Playwright dependency and config;
- route smoke for org dashboard, repositories, repo code/issues/runs/settings, deployments, and operations pages;
- screenshot/trace capture on failure;
- accessibility smoke on primary routes.

Exit criteria:

- browser gate runs in CI for UI changes;
- route failures show useful artifacts;
- no test relies on live external services.

## Stage 3: coverage and API suites

Add:

- coverage command and reporting;
- split API/controller tests;
- stable error-code assertions;
- org mismatch tests;
- no-secret response assertions;
- watch filter tests.

Exit criteria:

- coverage report generated in CI;
- minimum thresholds set for critical modules;
- cross-org denial is tested for resource APIs.

## Stage 4: security and package hardening

Add:

- dependency/secret/license checks;
- rendered chart schema validation;
- action/workflow lint;
- Docker build smoke;
- SBOM/signature plan for release.

Exit criteria:

- release gate publishes security/package artifacts;
- chart regressions fail before release.

## Stage 5: agent/company-brain vertical slice

Add:

- org memory fixtures;
- fake Agent Mux;
- fake memory Git repo;
- dispatch with memory snapshot tests;
- summary-only `.a5c` import tests;
- cross-org memory denial tests;
- browser journey for memory preview/import review.

Exit criteria:

- `docs/agents/org-memory-vertical-slice-spec.md` acceptance paths are automated;
- no raw `.a5c` secret-like content leaks;
- retry uses pinned memory snapshot.

## Stage 6: live/staging reliability

Add:

- live cluster smoke profiles;
- Gitea, NATS, Argo CD, KubeVela, ARC, object storage checks;
- controller restart/idempotency tests;
- performance smoke for API/UI;
- webhook burst and retry tests.

Exit criteria:

- staging gates prove install, core workflows, and rollback;
- failure artifacts are actionable.

## Stage 7: continuous quality intelligence

Add:

- flaky test dashboard;
- coverage trend dashboard;
- failure signature clustering;
- ownership routing;
- QA metrics in release notes;
- automated gap reminders when new resources/routes lack tests.

Exit criteria:

- QA reports guide prioritization instead of only blocking merges.
