# Agent implementation rollout slices

## Purpose

This document turns the specs into incremental implementation slices. Each slice must leave Krate usable, respect the current app architecture, and keep tests/package validation green.

## Slice 0: docs and resource alignment

Status: current docs-only work.

Deliverables:

- agent docs indexed in `docs/agents/README.md`;
- CRD schema, controller, API, UI, security, storage, chart, adapter, and acceptance specs;
- no runtime behavior changes.

Validation:

- `npm run validate:docs`;
- `npm run package:check`.

## Slice 1: resource definitions and chart CRDs

Deliverables:

- add agent config kinds to `src/resource-model.js`;
- add agent resource entries to `src/kubernetes-controller.js` `KRATE_RESOURCES`;
- add chart CRDs for config resources;
- add examples under `examples/agents/`;
- update package validator required terms/kinds when appropriate.

UI impact:

- generic advanced resource tables can list/apply agent resources.
- no typed agent pages yet.

Tests:

- resource schema tests;
- package/chart validation;
- existing UI validation.

## Slice 2: read-only UI projection

Deliverables:

- extend `src/controller-ui.js` with `views.agents` summary;
- add `/agents` overview page;
- add repository route affordance slots for Code, Issues, PRs, Pipelines, Hooks, Settings;
- show empty states and disabled actions backed by missing resources.

UI impact:

- users can see where agent features will appear without mock data.

Tests:

- `npm run ui:validate`;
- route render tests if available;
- no Agent Mux dependency.

## Slice 3: RBAC and permission review MVP

Deliverables:

- add `AgentServiceAccount`, `AgentRoleBinding`, `AgentSecretGrant`, `AgentConfigGrant` support;
- add `src/agent-permission-review.js`;
- add `POST /api/agents/permissions/review`;
- add stack builder warning model for missing grants.

UI impact:

- `/agents/identities`, `/agents/secrets`, `/agents/permissions` can start as read-only + review panels.
- repository settings can show ServiceAccount/grant requirements.

Tests:

- missing Secret grant denied;
- role escalation denied;
- no Secret values in responses.

## Slice 4: stack registry MVP

Deliverables:

- implement stack CRUD through typed routes or generic apply wrappers;
- query Agent Mux capabilities if configured;
- compute `AgentCapabilityRequirement`;
- update stack readiness conditions.

UI impact:

- `/agents/stacks` builder can create a usable stack.

Tests:

- ready stack;
- missing MCP/skill/tool/permission blocks readiness;
- YAML preview matches applied resources.

## Slice 5: manual dispatch MVP

Deliverables:

- add `AgentDispatchRun`, `AgentDispatchAttempt`, `AgentContextBundle` creation;
- add manual dispatch API;
- add dispatch composer in repository Code page;
- create runs before Agent Mux launch.

UI impact:

- run appears in `/agents/runs` and repository Runs page.
- run detail can show queued/pending state.

Tests:

- manual dispatch creates run/attempt/context/permission snapshot;
- denied permission blocks run creation or creates rejected execution as designed.

## Slice 6: Agent Mux session binding

Deliverables:

- add `src/agent-mux-client.js`;
- launch Agent Mux run/session;
- bind IDs to attempts;
- stream events into run detail;
- embed transcript/observability panels.

UI impact:

- run detail becomes CI check page + Agent Mux chat.

Tests:

- gateway unavailable fallback;
- pending session handoff;
- stream reconnect state;
- launch rejected state.

## Slice 7: approvals and write-back

Deliverables:

- add `AgentApproval` action flow;
- implement approval inbox;
- gate PR comments, branch pushes, check reruns, review submissions;
- audit decisions and idempotency.

UI impact:

- pending approvals appear globally and in run detail.

Tests:

- approval required;
- wrong approver denied;
- artifact digest mismatch denied;
- idempotent write-back.

## Slice 8: trigger rules and CI integration

Deliverables:

- add `AgentTriggerRule` evaluation;
- add dry-run/replay;
- connect failed `Pipeline`/`Job`, issue/PR comments, labels, schedules, webhooks;
- create `AgentTriggerExecution` records.

UI impact:

- `/agents/rules` and repo hooks/settings show trigger health.
- agent runs appear beside CI runs.

Tests:

- failed CI dispatch;
- duplicate failure coalesced;
- fork PR forced untrusted;
- trigger dry-run output.

## Slice 9: workspace/session/work item graph

Deliverables:

- implement `AgentWorkspace`, `WorkItemSessionLink`, `WorkItemWorkspaceLink`;
- add workspace provisioning/recovery/rebase actions;
- link issue/PR/run/session/workspace views.

UI impact:

- issue/session/workspace associations behave like Agent Mux kanban, but inside Krate repository hierarchy.

Tests:

- create issue workspace;
- link session to issue;
- missing workspace recovery;
- rebase conflict state.

## Slice 10: production hardening

Deliverables:

- retention jobs;
- metrics;
- audit exports;
- chart values finalized;
- network policy for Agent Mux/MCP;
- scale/performance tuning;
- e2e suite in CI.

Done gate:

- `npm run check` green;
- chart package validation includes agent CRDs/examples;
- documented threat model mitigations covered by tests.

## Company brain memory slice

- Add memory resources and read-only UI first: repository health, ontology status, graph browse, and grep search.
- Add context integration next: `AgentMemorySnapshot`, `AgentMemoryQuery`, context preview, and run detail provenance.
- Add historical refs: explicit ref, snapshot tag, and `refAt` timestamp resolution.
- Add tool exposure: graph search, record read, docs grep, snapshot diff, update propose, ontology validate.
- Add write-back last: proposed PRs, validation reports, approval, merge, rollback, and audit.

## Org-scoped foundation slice

This slice must land before memory write-back and broad automation:

1. Introduce `Organization` and `OrgNamespaceBinding` resources.
2. Add org-aware routes and compatibility redirects.
3. Add `organizationRef` and org labels to repository, deployment, agent, runner, memory, session, workspace, secret, and config resources.
4. Add admission checks for same-org references.
5. Add org-scoped watch filters and audit fields.
6. Add `AgentRunMemoryImport` only after namespace enforcement is in place.

## Org memory vertical slice rollout

The first implementation slice should prove one org, one repo, one company brain, one manual dispatch, one memory snapshot, and one summary-only run-memory import:

1. enable org/resource model additions and CRD examples;
2. create org memory dashboard empty state;
3. configure `AgentMemoryRepository` and `AgentMemorySource` for one repo;
4. dispatch manually from repository Code page with memory preview;
5. show memory snapshot on run detail;
6. import summary-only `MEMORY.md`/session/run metadata through `AgentRunMemoryImport`;
7. query imported run memory in a later dispatch;
8. prove cross-org memory access is denied.

Do not implement broad trigger automation, raw artifact retention, or cross-org sharing in this slice.
