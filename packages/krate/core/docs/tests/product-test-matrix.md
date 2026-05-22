# Product test matrix

## Purpose

This matrix maps Krate product areas to required automated test coverage. It covers existing functionality and future agent/company-brain functionality so implementation work can add tests in the right layer instead of relying on one broad E2E path.

## Matrix legend

| Mark | Meaning |
| --- | --- |
| Required | must exist before feature is considered complete. |
| Recommended | should exist when the feature reaches production or staging. |
| Nightly | acceptable in slower scheduled/live suites. |
| Future | planned once the underlying feature exists. |

## Product-area coverage

| Product area | Unit | Integration/API | Browser/UI | E2E/scenario | Security | Package/install |
| --- | --- | --- | --- | --- | --- | --- |
| Resource model and schemas | Required | Required | Recommended | Recommended | Recommended | Required |
| Organization and namespace scoping | Required | Required | Required | Required | Required | Required |
| Repository data plane | Required | Required | Required | Required | Required | Required |
| Pull requests and reviews | Required | Required | Required | Required | Recommended | Recommended |
| Issues and inbox | Required | Required | Required | Recommended | Recommended | Recommended |
| Pipelines and jobs | Required | Required | Required | Required | Required | Required |
| Runner pools and job isolation | Required | Required | Recommended | Required | Required | Required |
| Webhook subscriptions and deliveries | Required | Required | Required | Required | Required | Recommended |
| Identity, auth, teams, invites | Required | Required | Required | Recommended | Required | Required |
| RBAC and policy | Required | Required | Recommended | Required | Required | Required |
| Secrets and config grants | Required | Required | Required | Required | Required | Recommended |
| Deployments and environments | Required | Required | Required | Required | Recommended | Required |
| Argo CD and KubeVela/OAM | Required | Required | Recommended | Nightly | Recommended | Required |
| Operations install/readiness | Required | Required | Required | Required | Required | Required |
| Web UI shell and navigation | Recommended | Recommended | Required | Required | Recommended | Recommended |
| Advanced YAML/resource panels | Required | Required | Required | Recommended | Required | Recommended |
| Agent stacks and capabilities | Future | Future | Future | Future | Future | Future |
| Agent dispatch and Agent Mux | Future | Future | Future | Future | Future | Future |
| Agent triggers | Future | Future | Future | Future | Future | Future |
| Agent workspaces and sessions | Future | Future | Future | Future | Future | Future |
| Company brain memory | Future | Future | Future | Future | Future | Future |
| `.a5c` run memory imports | Future | Future | Future | Future | Future | Future |
| Artifacts and write-back | Future | Future | Future | Future | Future | Future |
| Packaging and release | Required | Required | Recommended | Required | Required | Required |

## Existing command mapping

| Command | Covers | Gaps |
| --- | --- | --- |
| `npm test` | unit/integration tests in `tests/*.test.js` | not yet split by subsystem; no coverage report. |
| `npm run e2e` | current deterministic package/minikube E2E tests | no browser automation or live cluster path. |
| `npm run validate:docs` | docs/source/ontology coverage | does not validate all `docs/tests` requirements yet. |
| `npm run package:check` | package/chart/example coverage | not yet aware of future agent/memory CRDs. |
| `npm run smoke` | runtime smoke | should expand as APIs/routes grow. |
| `npm run ui:validate` | static UI validation | not a browser test. |
| `npm run ui:build` | Next production build | not behavioral UI coverage. |
| `npm run check` | all current gates | should remain required as new gates are added. |

## Future suite mapping

| Future suite | Product areas |
| --- | --- |
| `test:unit` | resource model, route helpers, redaction, context assembly, ref resolution, validators. |
| `test:integration` | API controller, controller fakes, memory import, Gitea/K8s/Agent Mux fakes. |
| `test:api` | org-scoped endpoints, stable errors, resource actions, watch filters. |
| `test:browser` | org navigation, repository flows, deployments, run detail, agent/memory flows. |
| `test:coverage` | coverage thresholds and untested-file reporting. |
| `test:security` | auth/RBAC/no-secret/cross-org/secret-grant checks. |
| `test:charts` | Helm render, CRD examples, kubeconform, APIService/RBAC. |
| `test:agents` | agent dispatch, context, memory, Agent Mux, imports, triggers. |
| `test:live` | real cluster/Gitea/Argo/KubeVela/NATS/ARC/Object storage. |

## Required negative coverage

Every relevant product area must include negative tests for:

- missing or mismatched `organizationRef`;
- wrong namespace for org;
- missing RBAC permission;
- missing Secret/ConfigMap grant;
- untrusted fork or untrusted runner tries privileged action;
- cross-org resource reference;
- invalid or stale Git ref;
- invalid webhook signature;
- resource deleted while a controller is reconciling;
- secret-like value appears in input and must not appear in output;
- watch reconnect after disconnect;
- duplicate event delivery and idempotency.

## Release readiness matrix

A release candidate is blocked if any of these are missing:

- package/chart validation;
- CRD/example coverage for every shipped kind;
- at least one install smoke path;
- auth/RBAC/no-secret tests;
- UI build and route smoke;
- repository/PR/CI core E2E;
- deployment/OAM smoke when deployment features ship;
- agent/company-brain vertical slice when agent features ship;
- documented known gaps and quarantined tests.

## External backend coverage

External provider support adds required coverage for:

| Area | Required tests |
| --- | --- |
| Provider auth | GitHub App Secret metadata, installation access, no-token leak. |
| Webhooks | signature validation, dedupe, replay, enqueue, malformed payload. |
| Issue interface | issue/comment/label sync, PR-backed issue handling, conflicts. |
| CI/CD interface | workflow run/job/check sync, rerun/cancel permissions, lazy logs. |
| Git forge interface | repo/PR/ref/key/branch protection sync and drift. |
| Bidirectional writes | write intent, approval, provider failure, confirmation, conflict. |
| Rate limits | backoff, degraded status, resume. |
| Cross-org | provider binding and native object references cannot cross orgs. |

## Pluggable provider contract tests

Each provider adapter should run a shared contract suite for every supported interface:

| Contract suite | Providers |
| --- | --- |
| Issue tracking contract | GitHub, GitLab, Bitbucket when enabled, Azure DevOps, Jira, Linear, Gitea, custom. |
| CI/CD contract | GitHub Actions, GitLab CI, Bitbucket Pipelines, Azure Pipelines, Buildkite, CircleCI, Jenkins, custom. |
| Git forge contract | GitHub, GitLab, Bitbucket, Azure Repos, Gitea, Gerrit, raw Git partial, custom. |
| Webhook contract | any provider with webhooks. |
| Write-intent contract | any provider with mutating operations. |
| Conflict contract | any bidirectional provider. |

Contract tests should use fake provider adapters first, then provider-specific fixtures and optional live tests.

## External UX flow tests

Browser and E2E tests should cover:

- connect GitHub provider;
- connect Jira issue-only provider;
- combine GitHub forge with Buildkite CI;
- resolve a sync conflict;
- approve an agent-proposed external write;
- replay a dead-lettered webhook;
- show provider rate-limit degraded state.

These flows are specified in `docs/external/external-backend-ux-flows.md`.
