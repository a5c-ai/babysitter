# Product gaps

## Org-scoped company brain and run memory gap

Krate needs an explicit org scoping layer across the product. Repositories, deployments, agent stacks, triggers, runners, workspaces, sessions, company brain memory, secrets, config, and audit should all resolve under an `Organization`, with one Kubernetes namespace per org by default.

Required gap closures:

- add `Organization` and namespace binding semantics to product/API/resource docs;
- make repository and deployment routes org-aware, with no non-org repository or deployment routes;
- require org labels and namespace refs on product resources;
- reject cross-org refs by default in controllers and admission;
- scope ServiceAccounts, Roles, RoleBindings, Secrets, ConfigMaps, runners, agents, and users to the org namespace;
- manage one dedicated company brain memory repo per org;
- store admitted `MEMORY.md`, Babysitter sessions, `.a5c` run journals, task results, artifact manifests, and retrospectives in that org memory repo;
- expose org memory and run imports in `/orgs/[org]/agents/memory`;
- support historical memory dispatch by resolving the org memory repo to a commit from a timestamp;
- include org, namespace, memory commit, session ID, run ID, and journal digest in audit records.

The org-scoped resource model and route model are now implementation requirements: `Organization` resources live in the platform namespace, while each org binds exactly one namespace that contains repositories, deployments, runners, identity mappings, issues, reviews, runs, automations, memory, secrets, config, and audit records.

## Detailed gap matrix

| Gap | Why it matters | Docs now covering it |
| --- | --- | --- |
| Org namespace model | prevents repos, deployments, agents, memory, secrets, and sessions from mixing across tenants | `docs/agents/org-scoping-namespace-spec.md`, `docs/agents/org-route-resource-model-spec.md` |
| Org-aware routes | makes navigation GitHub-like and avoids ambiguous repository slugs | `docs/agents/org-route-resource-model-spec.md`, `docs/agents/ui-flow-spec.md` |
| Babysitter run memory import | turns useful `.a5c` run state into governed org memory without raw dumps | `docs/agents/agent-run-memory-import-spec.md` |
| `MEMORY.md` in company brain | provides a stable org orchestration entrypoint | `docs/agents/shared-memory-company-brain-spec.md` |
| Historical memory refs | enables reproducible runs with memory from a prior timestamp | `docs/agents/memory-context-integration-spec.md` |
| Org-scoped audit | makes cross-controller activity attributable and recoverable | `docs/agents/observability-audit-spec.md` |

## Remaining implementation follow-ups

- Define retention tiers for raw `.a5c` journal content versus summarized memory records.
- Decide whether generated memory indexes are committed to the org memory repo or stored as object artifacts with digest refs.
- Add org-scoped agent memory routes and audit records after the route/resource foundation is in place.

## Next implementation decomposition

The next docs-to-code decomposition should be:

1. org resource model and namespace binding;
2. org-first routes with no non-org repository or deployment route surface;
3. org admission preflight and same-org reference checks;
4. memory repository/source read-only UI;
5. memory context snapshots and historical refs;
6. `AgentRunMemoryImport` summary-only import;
7. curated journal imports and retention tiers;
8. memory update review, PR merge, and rollback.

This order avoids adding memory write paths before org isolation and admission are enforceable.

## Current implementation alignment gaps

Current code already includes some org foundations:

- `src/resource-model.js` includes `Organization`, `OrgNamespaceBinding`, and `organizationRef` on core resources.
- `apps/web/app/orgs/[org]` contains org dashboard, repositories, deployments, runs, inbox, people, hooks, insights, and settings-like pages.
- `apps/web/app/api/orgs/[org]/resources` provides an org-scoped resource API seam.

Remaining gaps are therefore additive:

- add agent/memory resources to the existing resource model;
- add `/orgs/[org]/agents/*` route tree;
- add memory query/import/update APIs under existing org API structure;
- add route guards and same-org admission for new resources;
- add UI links from existing repository pages to agent dispatch and memory association flows;
- add `AgentRunMemoryImport` validation and review UI.

## Docs-to-implementation readiness checklist

Before code work starts, the docs now require these checks to be true:

- resource model delta lists every new agent/memory kind and storage class;
- UI implementation map points every new surface at an existing or future org route;
- API contract defines org-scoped routes and stable errors;
- controller spec defines org preflight and memory import reconciliation;
- acceptance matrix includes cross-org denial and memory import scenarios;
- gaps file records current implementation seams and remaining additive work.

The main unresolved product choice is retention: how much `.a5c` journal detail should be imported by default beyond summary-only and curated-journal modes.

## Vertical slice acceptance target

The first code milestone should follow `docs/agents/org-memory-vertical-slice-spec.md` exactly. Success means a single-org manual dispatch can consume company brain memory, show the memory snapshot in run detail, import a summary-only Babysitter/Agent Mux run into the same org memory repo, and prove cross-org memory denial.

Anything beyond that is a later slice unless it directly enables the vertical path.

## Fixture-driven implementation proof

The future implementation should be considered incomplete until the fixture plan in `docs/agents/org-memory-e2e-fixture-plan.md` can run locally. The fixture intentionally includes duplicate repo slugs across orgs and secret-like `.a5c` journal content so route ambiguity, org isolation, and redaction are proven rather than assumed.

## QA automation gaps

The QA strategy in `docs/tests` is intentionally broader than current implementation. Remaining gaps:

- Add browser automation framework and route smoke tests.
- Add coverage reporting and thresholds.
- Split current Node tests into unit, integration, API, and E2E directories as suites grow.
- Add deterministic fixtures under `tests/fixtures` for org, repository, memory, `.a5c`, Agent Mux, webhooks, runners, and deployments.
- Add security/no-secret scans over API responses, browser traces, memory imports, and artifacts.
- Add org-scoped agent/company-brain vertical-slice tests.
- Add live/staging gates for Gitea, Argo CD, KubeVela, NATS, ARC, object storage, and Agent Mux.
- Add release artifacts for coverage, browser traces, rendered manifests, and SBOM/signing when release gates mature.

## QA adoption roadmap gaps

The docs now define a staged QA adoption roadmap. Implementation remains to:

- create `tests/fixtures` and helper fakes;
- add Playwright/browser route smoke;
- add coverage reporting and thresholds;
- add stable API error tests;
- add security/package hardening scans;
- automate the org-memory vertical slice;
- add live/staging reliability profiles;
- publish quality intelligence such as flaky tests and coverage trends.

## External backend integration gaps

The `docs/external` specs define GitHub and future provider integration, but implementation remains to:

- add `ExternalBackendProvider`, `ExternalBackendBinding`, sync policy, delivery, event, sync state, write intent, conflict, and object-link resources;
- implement provider registry and GitHub App auth without PATs;
- add three provider interfaces: issue tracking, CI/CD, and git forge;
- add webhook ingest, signature validation, delivery replay, event normalization, and backfill;
- add bidirectional sync conflict handling and reviewed write intents;
- add UI provider setup, repository sync status, external badges, conflict resolution, and sync health;
- add tests and fixtures for GitHub webhooks, Actions, issues, PRs, repos, keys, branch protection, rate limits, and cross-org denial.

## Expanded external backend gaps

Additional provider work now documented but not implemented:

- provider type registry and adapter descriptor loading;
- GitLab, Bitbucket Cloud/Data Center, Azure DevOps, Jira, Linear, Buildkite, CircleCI, Jenkins, Gitea external, Gerrit, raw Git, and custom provider profiles;
- org-scoped external backend settings UI and setup wizard;
- provider binding UI for mixed-interface backends;
- conflict and write-intent review UI;
- detailed `ExternalWebhookDelivery`, `ExternalSyncEvent`, `ExternalWriteIntent`, and `ExternalObjectLink` schemas;
- provider plugin contract and interface-specific sync controllers;
- rate-limit aware sync scheduling and status surfaces.



----

[ ] - add tools mux to enforce external tool use granular permissions beyond amux support for sanboxing and policy enforcement.

## External provider implementation-ready gaps

The external backend docs now define manifests, mappings, state machines, and UX flows. Remaining implementation gaps:

- create a provider capability manifest registry and loader;
- add `ExternalProviderCapabilityManifest` validation or bundled manifest files;
- implement external object envelope persistence on synced resources;
- implement rich text conversion and loss warnings for Jira/Linear/provider-specific formats;
- implement stable phase enums for providers, bindings, deliveries, backfills, writes, and conflicts;
- implement mixed-provider flows such as GitHub forge plus Buildkite CI;
- add UX acceptance tests for setup, conflict resolution, reviewed writes, webhook recovery, and rate limits.
