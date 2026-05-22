# Agent developer implementation checklist

## Purpose

This checklist maps the agent docs to concrete files and implementation steps in the current Krate repo. It is intended to be used when the project moves from docs-only into code.

## Ground rules

- Keep changes incremental and validated.
- Preserve generic controller/resource/watch APIs.
- Add typed routes only as wrappers over controller/resource services.
- Keep Secret values out of UI, status, logs, audit, and tests.
- Update docs and examples with every implemented slice.

## Slice 1: resource definitions

Files:

- `src/resource-model.js`
- `src/kubernetes-controller.js`
- `charts/krate/crds/*.yaml`
- `examples/agents/*.yaml`
- `tests/*.test.js`

Tasks:

- add agent config kinds to `CONFIG_KINDS`;
- add agent execution kinds to `AGGREGATED_KINDS` if represented in the generic model;
- add `RESOURCE_DEFINITIONS` entries with plural/context/requiredSpec;
- add `KRATE_RESOURCES` entries;
- add minimal CRDs;
- add examples;
- update package validation when examples/CRDs are required.

Validation:

```powershell
npm run validate:docs
npm run package:check
npm test
```

## Slice 2: UI projection

Files:

- `src/controller-ui.js`
- `apps/web/app/ui-shell.jsx`
- `apps/web/app/agents/page.jsx`
- `apps/web/app/orgs/[org]/repositories/[repo]/*/page.jsx`
- `scripts/validate-ui.mjs`

Tasks:

- add `views.agents` to controller model;
- add agent dashboard card/counters;
- add repository affordance slots;
- keep empty states server-projected;
- add route wrappers for global `/agents` page;
- extend UI validation for agent routes once created.

Validation:

```powershell
npm run ui:validate
npm run validate:docs
```

## Slice 3: permission review

Files:

- `src/agent-permission-review.js`
- `src/agent-rbac-controller.js`
- `src/agent-secret-config-controller.js`
- `apps/web/app/api/agents/permissions/review/route.js`
- tests for API and controller behavior.

Tasks:

- implement deterministic permission review;
- check native RBAC/ServiceAccount/SecretGrant/ConfigGrant;
- return no Secret values;
- add denied response shape;
- wire stack builder warnings to review response.

Validation:

```powershell
npm test -- --test-name-pattern permission
npm run ui:validate
```

## Slice 4: stack registry

Files:

- `src/agent-stack-controller.js`
- `src/agent-mux-client.js` for capability lookup only;
- `apps/web/app/agents/stacks/page.jsx`;
- API routes under `apps/web/app/api/agents/stacks`.

Tasks:

- CRUD stacks through controller resources;
- compute capability requirements;
- query Agent Mux capabilities if configured;
- set readiness conditions;
- build stack builder UI.

Validation:

```powershell
npm test -- --test-name-pattern AgentStack
npm run ui:validate
```

## Slice 5: context and manual dispatch

Files:

- `src/agent-context-bundles.js`
- `src/agent-dispatch-controller.js`
- `apps/web/app/api/agents/runs/route.js`
- `apps/web/app/agents/runs/page.jsx`
- repository Code page components.

Tasks:

- assemble/redact context;
- create `AgentContextBundle`;
- create `AgentDispatchRun` and `AgentDispatchAttempt` before Agent Mux launch;
- add dispatch composer;
- show queued/pending run rows.

Validation:

```powershell
npm test -- --test-name-pattern dispatch
npm run ui:validate
```

## Slice 6: Agent Mux binding

Files:

- `src/agent-mux-client.js`
- `src/agent-dispatch-controller.js`
- `apps/web/app/agents/runs/[run]/page.jsx`
- Agent Mux embed components.

Tasks:

- launch through Agent Mux;
- bind run/session IDs;
- stream events;
- embed transcript and observability timeline;
- handle pending/reconnect/rejected states.

Validation:

```powershell
npm test -- --test-name-pattern agent-mux
npm run ui:validate
```

## Slice 7: approvals and write-back

Files:

- `src/agent-approval-controller.js`
- `src/agent-artifacts.js`
- `apps/web/app/agents/approvals/page.jsx`
- PR/issue/pipeline page integrations.

Tasks:

- persist artifacts;
- create approval requests;
- apply approved write-back idempotently;
- audit decisions;
- block digest mismatches.

Validation:

```powershell
npm test -- --test-name-pattern approval
npm run ui:validate
```

## Slice 8: triggers and CI

Files:

- `src/agent-trigger-controller.js`
- `src/hooks-events.js`
- `src/runners-ci.js`
- `apps/web/app/agents/rules/page.jsx`
- repo hooks/runs pages.

Tasks:

- evaluate `AgentTriggerRule`;
- create `AgentTriggerExecution`;
- dry-run/replay deliveries;
- link failed `Pipeline`/`Job` to agent runs;
- coalesce duplicates.

Validation:

```powershell
npm test -- --test-name-pattern trigger
npm run ui:validate
```

## Slice 9: workspaces and subagents

Files:

- `src/agent-workspace-controller.js`
- `src/agent-subagents.js`
- `apps/web/app/agents/workspaces/page.jsx`
- issue/PR/run detail integrations.

Tasks:

- manage workspace lifecycle actions;
- link work items/sessions/workspaces;
- project subagent lanes;
- enforce child permission subsets;
- show workspace missing/rebase/dirty states.

Validation:

```powershell
npm test -- --test-name-pattern workspace
npm run ui:validate
```

## Slice 10: hardening

Files:

- chart values/templates;
- retention job/controller;
- observability/audit exporters;
- e2e tests;
- docs/examples.

Tasks:

- retention policies;
- metrics and alerts;
- chart feature gates;
- network policy;
- e2e coverage;
- update `npm run check` gates as needed.

Validation:

```powershell
npm run check
```

## Documentation updates per slice

Every implementation slice should update:

- relevant spec doc;
- `docs/agents/implementation-rollout-slices.md` status;
- `docs/agents/resource-contract-examples.md` if schema changes;
- `docs/agents/acceptance-test-matrix.md` with proof commands;
- README if user-facing behavior changes.

## Stop conditions

Stop implementation and fix docs/design first if:

- a UI action cannot map to a resource/controller/API path;
- a Secret value would need to pass through browser or status;
- a label/comment could escalate permissions;
- Agent Mux would become source of truth for Krate repository objects;
- generic resource/watch APIs would be bypassed without a typed wrapper rationale.

## Org memory implementation checklist

- Add org namespace model before adding memory write paths.
- Add `organizationRef` to agent, runner, memory, trigger, workspace, session, and dispatch schemas.
- Add `AgentRunMemoryImport` and curated journal/event schemas.
- Ensure `.a5c` imports store digests, redaction status, source run IDs, and target memory paths.
- Keep UI routes under `/orgs/[org]/...` and do not add non-org repository redirects.
- Add admission tests for cross-org repository, deployment, secret, config, memory, runner, and ServiceAccount references.

## Current app integration checklist

- Reuse `orgHref()` and `PageFrame` patterns from `apps/web/app/ui-shell.jsx` for agent/memory pages.
- Add an `Agents` org navigation item rather than a global top-level `/agents` root.
- Use existing org route params from `apps/web/app/orgs/[org]` for every agent and memory route.
- Extend `loadKrateUi()` to include agent and memory resources only after resource-model additions land.
- Add API handlers under `apps/web/app/api/orgs/[org]` and keep generic resource API compatibility.
- Add route guards that verify resource org labels before rendering run/memory detail pages.
- Link repository dispatch actions from existing repo tabs instead of creating a separate chat-first entry point.

## Org memory vertical implementation checklist

- Implement org and memory resource definitions before UI pages.
- Add memory dashboard empty state before query/import actions.
- Add manual dispatch memory preview before trigger automation.
- Add `AgentMemorySnapshot` creation before Agent Mux launch.
- Add summary-only `AgentRunMemoryImport` before curated/full journal modes.
- Add cross-org negative tests before enabling multi-org demo data.
- Keep raw `.a5c` artifacts out of memory by default.

## API and fixture checklist

- Use `org-memory-api-payload-examples.md` as request/response fixtures when adding typed endpoints.
- Use `org-memory-e2e-fixture-plan.md` for duplicate repo slug, company brain, and `.a5c` redaction tests.
- Keep stable error codes exactly as documented before wiring UI error states.
- Add fixture assertions for `organizationRef`, resolved memory commit, digest fields, and redaction status.
- Add historical memory retry assertion once `refAt` support lands.

## QA docs reference

Before implementing agent functionality, review:

- `docs/tests/product-test-matrix.md` for required suite coverage;
- `docs/tests/test-suite-layout.md` for test file placement and fixture rules;
- `docs/tests/agent-qa-plan.md` for agent-specific negative tests;
- `docs/tests/qa-adoption-roadmap.md` for staged gate expectations.
