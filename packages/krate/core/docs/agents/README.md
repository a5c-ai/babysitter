# Agent dispatch integration docs

This directory captures the docs-only specification for adding agent orchestration to Krate git workspaces. The focus is a system-wide orchestration model: define agent stacks, bind tools/skills/subagents, connect them to triggers, run them on policy-controlled workspaces, and present each dispatch like a CI pipeline run with live Agent Mux chat/session access.

No controller, UI, API, CRD, runner, or workflow implementation is part of this change.

## What this covers

- How to define reusable agent stacks such as a Claude Code based agent with model, approval mode, tools, MCP servers, skills, subagents, prompts, and runtime policy.
- How issue/session/workspace/dispatch relationships from Agent Mux kanban should become first-class system capabilities in Krate, not just UI widgets.
- How CI checks, incoming webhooks, issue/PR comments, labels, schedules, and manual actions should trigger agent dispatches.
- How agent dispatches should appear beside `Pipeline` and `Job` runs while also exposing Agent Mux transcript, session, runtime surfaces, approvals, artifacts, and workspace lifecycle actions.
- How context labels should inject reviewed prompt fragments into dispatch context without becoming hidden launch commands or secret channels.
- How Agent Mux can provide adapters, session streaming, chat, cancellation, run events, plugin/tool discovery, and workspace/session primitives while Krate remains the repository, policy, trigger, and audit source of truth.

## Documents

- [Agent system overview](./system-overview.md) is the short entry point for the complete architecture, MVP target, invariants, and where to read next.
- [Agent glossary](./glossary.md) standardizes terminology across resources, UI, controllers, and Agent Mux boundaries.
- [Agent traceability matrix](./traceability-matrix.md) maps requirements to resources, controllers, UI surfaces, docs, implementation files, and validation gates.

- [Agent stack management spec](./agent-stack-management-spec.md) defines agent definitions, subagents, MCP tools, skills, trigger management, policy, and CI-like dispatch visibility.
- [UI/UX system spec](./ui-ux-system-spec.md) maps agent screens and interactions to app routes, custom resources, aggregated resources, controllers, API actions, and watch streams.
- [Integration design](./dispatching-design.md) defines the proposed Krate resources, trigger flow, work-item/session/workspace associations, chat/run UX, and implementation phases.
- [CI orchestration spec](./ci-orchestration-spec.md) keeps the CI-specific failed-check, repair, flaky-test, and release-gate requirements.
- [Source map](./agent-mux-source-map.md) maps relevant Babysitter Agent Mux paths, Krate CI paths, and repo docs to inspect before implementation.
- [Implementation blueprint](./implementation-blueprint.md) maps the specs onto concrete Krate source files, controllers, routes, CRDs, API endpoints, rollout order, and tests.
- [Resource contract examples](./resource-contract-examples.md) provides implementation-ready YAML and JSON examples for stacks, subagents, tools, MCP, skills, triggers, dispatches, approvals, and work-item links.
- [RBAC, service account, secret, and config management spec](./rbac-secrets-management-spec.md) defines native Kubernetes Roles, RoleBindings, ServiceAccounts, permission review, Secret grants, ConfigMap grants, audit, drift handling, and UI permission management for agents, runners, tools, skills, and users.
- [Agent CRD schema spec](./crd-schema-spec.md) maps agent resources onto Krate's existing `CONFIG_KINDS`, `AGGREGATED_KINDS`, schemas, labels, status conditions, and storage classes.
- [Controller reconciliation spec](./controller-reconciliation-spec.md) defines reconciler loops, watches, outputs, idempotency, failure handling, and UI projection integration.
- [API contract spec](./api-contract-spec.md) defines typed agent endpoints while preserving current controller/resource/watch API boundaries.
- [UI flow and state spec](./ui-flow-spec.md) defines stack builder, grant wizards, permission review, dispatch composer, run detail, and repository settings flows.
- [Security threat model](./security-threat-model.md) covers prompt injection, RBAC escalation, secret exfiltration, untrusted forks, MCP/tool abuse, session confusion, and write-back abuse.
- [Acceptance test matrix](./acceptance-test-matrix.md) maps resources, controllers, APIs, UI, e2e flows, and package/chart validation to concrete acceptance gates.
- [Storage and migration spec](./storage-migration-spec.md) defines etcd/Postgres/object-storage/native-Kubernetes storage boundaries, snapshots, indexes, retention, and migrations.
- [Chart and packaging spec](./chart-packaging-spec.md) maps agent features into Helm values, CRDs, RBAC, deployments, NetworkPolicy, examples, and package validation.
- [Agent Mux adapter contract](./agent-mux-adapter-contract.md) defines the launch/capability/event/session boundary between Krate and Agent Mux.
- [Implementation rollout slices](./implementation-rollout-slices.md) sequences docs, resources, UI, permission review, stack registry, dispatch, Agent Mux binding, approvals, triggers, workspaces, and hardening.
- [Context assembly and prompt safety spec](./context-assembly-spec.md) defines prompt layers, source provenance, redaction, context labels, bundle snapshots, and preview requirements.
- [Observability and audit spec](./observability-audit-spec.md) defines metrics, events, traces, audit records, alerts, and run-detail projections.
- [Repository page integration spec](./repository-page-integration-spec.md) maps agent affordances into the existing Code, Issues, Pull Requests, Runs, Hooks, Settings, and Inbox pages.
- [Tools, MCP, and skills spec](./tools-mcp-skills-spec.md) defines tool profiles, MCP servers, skills, capability requirements, health, UI, and launch behavior.
- [Subagent orchestration spec](./subagent-orchestration-spec.md) defines parent/child agent modes, context slicing, output contracts, permissions, telemetry, and UI lanes.
- [Artifacts and write-back spec](./artifacts-writeback-spec.md) defines durable artifacts, patch/review outputs, approval-gated write-back, idempotency, and failure handling.
- [Workspace lifecycle spec](./workspace-lifecycle-spec.md) defines workspace ownership, issue/session/run links, git/runtime state, lifecycle actions, trust isolation, and recovery.
- [Resource relationship map](./resource-relationship-map.md) shows how agent resources connect to existing Krate repositories, PRs, issues, pipelines, webhooks, identity, RBAC, secrets, and UI pages.
- [Operator runbook](./operator-runbook.md) explains safe enablement, preflight checks, troubleshooting, rollback, metrics, and support bundles.
- [Developer implementation checklist](./developer-implementation-checklist.md) maps rollout slices to concrete files, tasks, validation commands, documentation updates, and stop conditions.
- [MVP vertical slice spec](./mvp-vertical-slice-spec.md) defines the first coherent implementation target, included/deferred scope, acceptance criteria, tests, and non-negotiables.
- [Decision log and open questions](./decision-log-open-questions.md) records accepted architecture decisions and open implementation questions.

## Current decision

Treat agents as configurable work executors attached to Krate's repository graph, not as a standalone chat dashboard. Krate should own repository-native objects such as repositories, issues, PRs, checks, pipelines, jobs, runner pools, workspaces, labels, trigger rules, context labels, native Kubernetes role/service-account projections, secret/config grants, approvals, artifacts, and audit records. Agent Mux should own adapter-specific execution, session lifecycle, transcript/event streaming, chat continuation, cancellation, plugins/tool surfaces, and runtime state projection.

The first implementation should optimize for these paths:

1. Define an agent stack, for example `claude-code` with selected model, subagents, MCP servers, skills, allowed tools, approval mode, workspace policy, and runner pool.
2. Connect that agent stack to CI triggers, incoming webhooks, issue/PR mentions, labels, schedules, and manual dispatch buttons.
3. Dispatch an agent from a failed PR check, webhook, or issue and see it as a CI-like run with queue, runner, logs/events, artifacts, status, and approvals.
4. Open the linked Agent Mux chat/session from the run to continue, approve, cancel, inspect tools, follow subagents, and manage the associated workspace.

## Company brain memory additions

- [Shared memory company brain spec](./shared-memory-company-brain-spec.md) defines org-level Git-backed shared agent memory, Atlas-style graph/YAML/Markdown storage, memory resources, time-travel refs, update review, and UI requirements.
- [Memory context integration spec](./memory-context-integration-spec.md) defines how context bundles read graph records, Markdown frontmatter records, free-form grep excerpts, ontology reports, and historical memory snapshots.
- [Memory ontology and file schema spec](./memory-ontology-schema-spec.md) defines graph YAML, Markdown frontmatter, free-form notes, node/edge vocabulary, IDs, validation, indexes, and governance.
- [Memory operations runbook](./memory-operations-runbook.md) defines bootstrap, validation, current/historical dispatch, memory update, rollback, migration, dashboards, and alerts.

- [Org scoping and namespace spec](./org-scoping-namespace-spec.md) defines organization-first tenancy, one Kubernetes namespace per org, org-aware routes, labels, RBAC, cross-org rejection, and controller requirements.

- [Agent run memory import spec](./agent-run-memory-import-spec.md) defines how `MEMORY.md`, Agent Mux/Babysitter sessions, curated `.a5c` journals, task results, artifact manifests, and retrospectives become governed org memory.
- [Org route and resource model spec](./org-route-resource-model-spec.md) defines org-aware UI/API routes, resource refs, deployment scoping, namespace enforcement, and controller behavior.

- [Org memory UI implementation map](./org-memory-ui-implementation-map.md) maps company brain and agent pages onto the current `apps/web/app/orgs/[org]` route tree and API seams.
- [Org resource model delta spec](./org-resource-model-delta-spec.md) maps new agent/memory resources onto the existing `Organization`, `OrgNamespaceBinding`, `organizationRef`, CRD, and aggregated-resource model.

- [Org memory controller sequence spec](./org-memory-controller-sequence-spec.md) defines org bootstrap, memory bootstrap, dispatch, historical memory, tool calls, Babysitter import, memory update, cross-org denial, and watch/event sequences.
- [Org memory vertical slice spec](./org-memory-vertical-slice-spec.md) defines the smallest coherent implementation slice for org-scoped company brain memory and run imports.

- [Org memory API payload examples](./org-memory-api-payload-examples.md) provides concrete request/response contracts for summary, ref resolution, memory query, dispatch, run detail, run import, import detail, and stable errors.
- [Org memory E2E fixture plan](./org-memory-e2e-fixture-plan.md) defines deterministic org/repo/memory/`.a5c` fixtures and expected assertions for the vertical slice.
