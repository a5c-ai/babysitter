# Agent orchestration implementation blueprint

## Purpose

This document converts the agent orchestration specs into a concrete Krate implementation plan. It is intentionally docs-only: it names the files, resources, controllers, API routes, UI routes, chart surfaces, tests, and rollout order that should be touched when implementation starts.

The target experience is repository-native and GitHub-like: agents appear inside Code, Issues, Pull Requests, Actions/Runs, Workspaces, Inbox, and Settings. Agent Mux provides adapter/session/chat/runtime primitives; Krate owns the resource graph, repository context, trigger policy, runner placement, approvals, audit, and UI projections.

## Implementation boundaries

| Layer | Krate owns | Agent Mux owns |
| --- | --- | --- |
| Product graph | repositories, issues, PRs, pipelines, jobs, workspaces, approvals, artifacts, audit | adapter-specific session/run internals |
| Declarative config | `AgentStack`, tools, MCP servers, skills, subagents, trigger rules, context labels, workspace policy | adapter capability manifests and launch option validation |
| Execution records | `AgentDispatchRun`, attempts, context bundle snapshots, approval state, write-back state | transcript, runtime events, tool activity, continuation/cancel/fork/resume primitives |
| UI frame | GitHub-like Krate navigation, route hierarchy, resource forms, policy explanations | chat transcript, event timeline, runtime panels that can be embedded |
| Security | repository trust, runner class, native Kubernetes RBAC, service account admission, secret/config admission, write-back approval, audit | adapter/tool execution according to admitted launch options |

## Existing Krate files to extend

### Resource model

- `src/resource-model.js`
  - Add config kinds to `CONFIG_KINDS`: `AgentStack`, `AgentSubagent`, `AgentToolProfile`, `AgentMcpServer`, `AgentSkill`, `AgentTriggerRule`, `AgentContextLabel`, `AgentWorkspacePolicy`, `AgentServiceAccount`, `AgentRoleBinding`, `AgentSecretGrant`, `AgentConfigGrant`.
  - Add execution kinds to `AGGREGATED_KINDS`: `AgentDispatchRun`, `AgentDispatchAttempt`, `AgentSession`, `AgentWorkspace`, `AgentApproval`, `AgentContextBundle`, `AgentReviewArtifact`, `AgentArtifact`, `AgentTriggerExecution`, `AgentCapabilityRequirement`.
  - Keep `status.conditions` in every schema so disabled UI states can be explained from resources.

### Controllers and services

- `src/kubernetes-controller.js`
  - Reconcile declarative agent config resources and expose them through the existing Krate resource gateway.
  - Watch CRD-backed config changes and trigger validation refreshes.
- `src/api-controller.js`
  - Add agent API routes through the existing controller boundary; do not bypass the Krate gateway from UI components.
- `src/controller-ui.js`
  - Add agent dashboard cards, repository route view models, operational counters, and validation checks.
  - Project dispatches beside existing `Pipeline` and `Job` resources.
- New `src/agent-stack-controller.js`
  - Resolve Agent Mux capabilities, MCP health, skill validation, subagent compatibility, and policy admission.
- New `src/agent-trigger-controller.js`
  - Normalize events, evaluate trigger rules, dry-run payloads, dedupe, coalesce, and create dispatch runs.
- New `src/agent-dispatch-controller.js`
  - Create attempts, call Agent Mux, bind session/run IDs, reconcile event streams, artifacts, and final status.
- New `src/agent-workspace-controller.js`
  - Provision/link/recover/archive/cleanup/rebase workspaces and maintain issue/session/workspace associations.
- New `src/agent-approval-controller.js`
  - Gate shell/tool/network/secret/write-back/rebase/release operations and audit decisions.
- New `src/agent-rbac-controller.js`
  - Sync Krate role/service-account intent to native Kubernetes ServiceAccounts, Roles, ClusterRoles, RoleBindings, and ClusterRoleBindings.
- New `src/agent-secret-config-controller.js`
  - Validate Secret/ConfigMap grants, tool-secret and skill-secret requirements, ConfigMap injection, rotation impact, and missing-permission warnings.
- New `src/agent-permission-review.js`
  - Produce a deterministic permission review for stack save, trigger dry-run, dispatch creation, and launch attempts.
- New `src/agent-mux-client.js`
  - Thin adapter around Agent Mux gateway/client for capability lookup, launch, stream, continue, cancel, retry, fork, resume, and approval forwarding.

### UI app routes

- `apps/web/app/agents/page.jsx`
  - Global operations overview: active dispatches, pending approvals, trigger health, workspace attention, stack readiness.
- `apps/web/app/agents/stacks/page.jsx`
  - Stack registry and builder for agent, model, prompt, approval mode, tools, MCP, skills, subagents, runner/workspace/write-back policy.
- `apps/web/app/agents/runs/page.jsx`
  - Cross-repository CI-like dispatch queue.
- `apps/web/app/agents/runs/[run]/page.jsx`
  - Dispatch detail with Agent Mux chat/session and observability panels.
- `apps/web/app/agents/rules/page.jsx`
  - Trigger rule lifecycle, dry-run, delivery replay, execution summaries.
- `apps/web/app/agents/workspaces/page.jsx`
  - Workspace inventory and attention mode.
- `apps/web/app/agents/approvals/page.jsx`
  - Approval inbox and action-required queue.
- `apps/web/app/agents/identities/page.jsx`
  - Users, teams, agent ServiceAccounts, runner ServiceAccounts, and native RBAC projection.
- `apps/web/app/agents/secrets/page.jsx`
  - Secret/ConfigMap inventory, grants, consumers, rotation state, and missing-permission warnings without exposing Secret values.
- `apps/web/app/agents/permissions/page.jsx`
  - Role templates, RoleBindings, ClusterRoleBindings, grant graph, drift, and escalation warnings.
- `apps/web/app/orgs/[org]/repositories/[repo]/settings/agents/page.jsx`
  - Repository-scoped stack permissions, triggers, MCP/skill/tool allow-lists, runner policy, and secrets policy.
- Existing repository routes
  - `code`: add path-aware manual dispatch and active workspace/session chips.
  - `issues`: add board/list associations, context labels, dispatch readiness, linked sessions/workspaces/runs.
  - `pull-requests`: add check diagnosis, review artifacts, patch proposals, and write-back approvals.
  - `pipelines`: add agent dispatch rows beside pipeline/job rows.
  - `hooks`: show trigger deliveries, replay, and rule matches.

### API routes

- `GET/POST /api/agents/stacks`
- `GET/PATCH/DELETE /api/agents/stacks/:name`
- `GET /api/agents/capabilities`
- `GET /api/agents/identities`
- `POST /api/agents/identities/service-accounts`
- `GET /api/agents/permissions`
- `POST /api/agents/permissions/role-bindings`
- `POST /api/agents/permissions/review`
- `GET /api/agents/secrets`
- `POST /api/agents/secrets/grants`
- `POST /api/agents/config/grants`
- `GET/POST /api/agents/runs`
- `GET /api/agents/runs/:run`
- `GET /api/agents/runs/:run/events`
- `POST /api/agents/runs/:run/cancel`
- `POST /api/agents/runs/:run/continue`
- `POST /api/agents/runs/:run/retry`
- `POST /api/agents/runs/:run/fork`
- `GET/POST /api/agents/rules`
- `POST /api/agents/rules/:rule/dry-run`
- `POST /api/agents/rules/:rule/lifecycle`
- `GET/POST /api/agents/workspaces`
- `POST /api/agents/workspaces/:workspace/action`
- `GET /api/agents/approvals`
- `POST /api/agents/approvals/:approval/decision`
- `GET /api/watch/orgs/[org]/agentdispatchruns`
- `GET /api/watch/orgs/[org]/agentapprovals`
- `GET /api/watch/orgs/[org]/agentworkspaces`

API handlers should delegate to controller modules. They should not mutate hidden UI-only state.

### Helm/chart/package surfaces

- `charts/krate/templates/crds.yaml`
  - Add CRDs for low-cardinality config resources first, including `AgentServiceAccount`, `AgentRoleBinding`, `AgentSecretGrant`, and `AgentConfigGrant`.
- `charts/krate/values.yaml`
  - Add Agent Mux gateway URL, execution mode, default runner pool, default agent ServiceAccount, Secret/ConfigMap grant feature gates, retention, and feature gates.
- `charts/krate/templates/deployment.yaml`
  - Add environment for Agent Mux gateway, secrets policy, stream retention, and runner integration.
- `examples/`
  - Add minimal `AgentStack`, `AgentTriggerRule`, `AgentContextLabel`, and manual dispatch examples.
- `dist/`
  - Regenerate only through `npm run build` after implementation.

## Detailed implementation specs

Start with:

- [Agent system overview](./system-overview.md) for the architecture summary and invariants.
- [Agent glossary](./glossary.md) for shared terminology.
- [Agent traceability matrix](./traceability-matrix.md) for requirement-to-file/test mapping.

Use these companion docs before writing code:

- [Agent CRD schema spec](./crd-schema-spec.md) for exact resource classification, required fields, conditions, labels, and storage classes.
- [Controller reconciliation spec](./controller-reconciliation-spec.md) for watches, outputs, idempotency keys, and failure handling.
- [API contract spec](./api-contract-spec.md) for typed endpoint contracts and compatibility with the existing controller/resource/watch routes.
- [UI flow and state spec](./ui-flow-spec.md) for repository-native UX flows and denied/missing-grant states.
- [Security threat model](./security-threat-model.md) for required mitigations.
- [Acceptance test matrix](./acceptance-test-matrix.md) for implementation gates.
- [Storage and migration spec](./storage-migration-spec.md) for persistence, indexing, snapshots, retention, and migrations.
- [Chart and packaging spec](./chart-packaging-spec.md) for Helm values, CRDs, RBAC, deployments, examples, and package validation.
- [Agent Mux adapter contract](./agent-mux-adapter-contract.md) for capability discovery, launch, event normalization, and UI embedding.
- [Implementation rollout slices](./implementation-rollout-slices.md) for incremental delivery order.
- [Context assembly and prompt safety spec](./context-assembly-spec.md) for prompt/source/redaction/digest handling.
- [Observability and audit spec](./observability-audit-spec.md) for events, metrics, traces, audit records, and alerts.
- [Repository page integration spec](./repository-page-integration-spec.md) for adding agent affordances to existing repository pages.
- [Tools, MCP, and skills spec](./tools-mcp-skills-spec.md) for capability dependencies and launch policy.
- [Subagent orchestration spec](./subagent-orchestration-spec.md) for parent/child execution and telemetry.
- [Artifacts and write-back spec](./artifacts-writeback-spec.md) for durable outputs and gated mutations.
- [Workspace lifecycle spec](./workspace-lifecycle-spec.md) for workspace/session/work item associations and recovery.
- [Resource relationship map](./resource-relationship-map.md) for cross-resource dependencies and deletion impact.
- [Operator runbook](./operator-runbook.md) for safe enablement, troubleshooting, and rollback.
- [Developer implementation checklist](./developer-implementation-checklist.md) for file-by-file rollout execution.
- [MVP vertical slice spec](./mvp-vertical-slice-spec.md) for the first coherent build target and non-negotiables.
- [Decision log and open questions](./decision-log-open-questions.md) for accepted decisions and unresolved choices.
## Custom resources by storage class

### CRD-backed configuration resources

| Kind | Storage | Why declarative |
| --- | --- | --- |
| `AgentStack` | etcd | reusable agent launch definition and policy envelope |
| `AgentSubagent` | etcd | reusable child-agent role definition |
| `AgentToolProfile` | etcd | audited native tool and command policy |
| `AgentMcpServer` | etcd | managed server endpoint, secret refs, and health status |
| `AgentSkill` | etcd | reusable runbook/prompt/tool dependency bundle |
| `AgentTriggerRule` | etcd | reviewable event-to-agent routing policy |
| `AgentContextLabel` | etcd | reviewed prompt fragment and provenance metadata |
| `AgentWorkspacePolicy` | etcd | workspace provisioning, cleanup, retention, and trust policy |
| `AgentServiceAccount` | etcd | native Kubernetes ServiceAccount identity for agents and runner pools |
| `AgentRoleBinding` | etcd | native Role/ClusterRole and RoleBinding/ClusterRoleBinding intent |
| `AgentSecretGrant` | etcd | explicit Secret key access for users, teams, agents, tools, skills, MCP servers, and runners |
| `AgentConfigGrant` | etcd | explicit ConfigMap key access for users, teams, agents, tools, skills, MCP servers, and runners |

### Aggregated execution resources

| Kind | Storage | Why aggregated |
| --- | --- | --- |
| `AgentDispatchRun` | postgres | high-cardinality run state, source refs, artifacts, approvals, event cursor |
| `AgentDispatchAttempt` | postgres | retry/resume/fork attempts and Agent Mux session/run binding |
| `AgentSession` | postgres projection | durable session metadata linked to Agent Mux session IDs |
| `AgentWorkspace` | postgres projection | git worktree/runtime inventory and lifecycle state |
| `AgentApproval` | postgres | human-gate decisions and audit trail |
| `AgentContextBundle` | postgres/object storage | immutable context snapshot, prompt hash, attachment manifest |
| `AgentArtifact` | postgres/object storage | patches, logs, review artifacts, reports, subagent outputs |
| `AgentTriggerExecution` | postgres | webhook/rule evaluation, coalescing, rejection, and created-run links |
| `AgentCapabilityRequirement` | postgres projection | computed tool/MCP/skill/model/subagent requirements and missing grant warnings |

## Controller graph

```text
WebhookDelivery / CI event / issue or PR event / manual UI action
  -> agent-trigger-controller
  -> AgentTriggerExecution
  -> AgentContextBundle
  -> native RBAC + SecretGrant + ConfigGrant admission
  -> AgentDispatchRun
  -> AgentDispatchAttempt
  -> agent-mux-client
  -> Agent Mux run/session
  -> stream/event reconciliation
  -> AgentApproval / AgentArtifact / AgentWorkspace / WorkItem links
  -> repository UI projections and write-back actions
```

Controllers should be restart-safe. Every external side effect needs an idempotency key derived from source event, trigger rule, stack snapshot, context digest, and attempt number.

## User-flow acceptance contracts

### Manual code dispatch

1. User opens `/orgs/[org]/repositories/[repo]/code`.
2. User selects files/folder/ref and clicks `Dispatch agent`.
3. UI shows stack, context labels, workspace policy, prompt preview, and write-back policy.
4. Krate creates `AgentDispatchRun` and `AgentDispatchAttempt` before Agent Mux launch.
5. Run appears in repository pipelines and `/agents/runs`.
6. Detail page shows pending handoff, then chat/session once bound.

### Failed CI repair

1. Pipeline/job fails and creates/updates a durable CI event.
2. `AgentTriggerRule` matches workflow/job/step/failure signature.
3. Trigger controller creates `AgentTriggerExecution`; dedupe may coalesce into an existing run.
4. Dispatch uses untrusted runner policy for forked refs and privileged runner policy only for trusted refs.
5. Agent output becomes artifacts and approval requests.
6. PR comments, branch pushes, check reruns, and review submissions happen only after allowed write-back approval.

### Issue or PR mention dispatch

1. User mentions an agent or applies a dispatch label.
2. Krate records source actor, comment/label payload, repository trust, and context label set.
3. Rule dry-run preview shows task kind, prompt fragments, attachments, and dedupe key.
4. Dispatch links back to the issue/PR and optional workspace.
5. Chat/session stays reachable from the issue/PR, workspace, run, and global session list.

### Subagent orchestration

1. Parent `AgentStack` declares allowed subagents and concurrency limits.
2. Agent Mux reports whether adapter supports subagent dispatch or Krate emulates it as child dispatch attempts.
3. UI shows subagent lanes with status, context slice, output contract, artifacts, and parent decision impact.
4. Child output is immutable and linked to the parent attempt.

### Tool, MCP, and skill management

1. Stack builder validates tools, MCP servers, skills, and subagents before dispatch.
2. Execution context panel shows exactly what was injected into the prompt and launch options.
3. Tool/MCP/skill errors surface as `status.conditions`, not only toast notifications.
4. Disabling a tool/MCP/skill invalidates dependent stacks and rules until remediated.

## Rollout order

1. Add resource definitions, schemas, examples, and chart CRDs for config resources, including native RBAC/service-account/secret/config grant resources.
2. Add read-only UI projections and empty states in repository routes.
3. Add stack registry with Agent Mux capability validation and native RBAC/Secret/ConfigMap readiness checks.
4. Add manual dispatch from repository code page and dispatch run list/detail.
5. Add Agent Mux session binding, chat, event stream, and observability panel.
6. Add approvals, write-back gates, service-account binding, Secret grants, ConfigMap grants, and role-binding management.
7. Add trigger rules, dry-run, webhook deliveries, CI failure matching, and dedupe/coalescing.
8. Add workspace provisioning/recovery/rebase lifecycle and issue/session/workspace association graph.
9. Add subagent lanes, MCP health, skill validation, cost/usage, retention, and audit hardening.

## Test and validation plan

- Unit tests for resource schemas, status conditions, trigger matchers, context bundle assembly, native RBAC admission, SecretGrant/ConfigGrant admission, and policy admission.
- Controller tests for idempotent dispatch creation, retry/resume/fork, workspace lifecycle, and approval decisions.
- API tests for every route listed above with denied/allowed policy cases, including missing Secret/ConfigMap/Role access.
- UI validation for GitHub-like route hierarchy, empty states, disabled actions, permission review explanations, missing-grant warnings, reconnect states, pending handoff, and approval-blocked runs.
- E2E tests for manual dispatch, failed CI dispatch, issue mention dispatch, workspace recovery, and write-back approval.
- Package/chart validation to ensure CRDs, examples, and Helm values stay in sync.

## Done criteria for the first production-ready slice

- A repository admin can create a Claude Code `AgentStack` with tools, MCP servers, skills, subagents, runtime ServiceAccount, runner ServiceAccount, Secret grants, ConfigMap grants, runner policy, and approval mode.
- A user can manually dispatch it from a repository page and see a CI-like run.
- The run binds to Agent Mux chat/session and streams events without losing source breadcrumbs.
- Pending approvals block privileged actions and can be decided from the run page or approval inbox.
- Workspace/session/run associations are visible from the source issue/PR/code/pipeline page and from global agent pages.
- Every UI action maps to a resource/action/controller/watch path documented in these specs.
- A stack that enables a tool/skill/MCP server requiring a Secret or ConfigMap shows a blocking warning until the selected agent identity has the matching grant.

## Company brain memory implementation slice

When implementation begins, add memory after the basic dispatch/context slice but before broad trigger automation:

1. Add `AgentMemoryRepository`, `AgentMemorySource`, `AgentMemoryOntology`, and `AgentMemoryAssociation` to `src/resource-model.js` and CRDs.
2. Add aggregated `AgentMemorySnapshot`, `AgentMemoryQuery`, and `AgentMemoryUpdate` storage.
3. Add memory ref resolution and query actions to `src/api-controller.js`.
4. Extend context assembly to add memory source manifests to `AgentContextBundle`.
5. Expose `/agents/memory` and repository settings associations in `src/controller-ui.js`.
6. Gate Agent Mux memory tools through stack capability and permission review.
7. Add validators for graph YAML, Markdown frontmatter, free-form path policy, ontology, indexes, and secret scans.

## Org-scoped resource implementation prerequisites

Before implementing company brain memory, Krate should add org scoping foundations:

1. Add `Organization`, `OrgNamespaceBinding`, and org labels to the resource model.
2. Make repository, deployment, agent, runner, memory, secret, config, session, workspace, and audit resources resolve `organizationRef`.
3. Keep API routes org-addressed and return not found for non-org repository paths.
4. Update controllers to reject cross-org references and use org namespace ServiceAccounts.
5. Add `AgentRunMemoryImport` for curated `MEMORY.md`, session, journal, task, and artifact-manifest imports into the org memory repo.

## Current app org-route alignment

The current app already exposes an org-scoped route tree under `apps/web/app/orgs/[org]` and org-scoped resource APIs under `apps/web/app/api/orgs/[org]`. Agent implementation should extend this tree instead of introducing global agent pages first.

Implementation deltas:

1. Add `Agents` to `orgNavigation` in `apps/web/app/ui-shell.jsx`.
2. Add routes under `apps/web/app/orgs/[org]/agents/*`.
3. Add repository page links from existing Code, Issues, Pull Requests, Runs, Hooks, and Settings pages into org-scoped agent routes.
4. Add org-scoped memory APIs under `apps/web/app/api/orgs/[org]/agents/memory/*`.
5. Preserve existing generic `/api/orgs/[org]/resources` behavior for YAML/resource views.
6. Keep advanced resource panels as escape hatches, but make normal memory/agent flows task-led.
