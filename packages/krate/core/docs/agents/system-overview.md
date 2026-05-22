# Agent system overview

## Purpose

This document is the short entry point for the full agent orchestration spec set. It explains the product shape, implementation boundaries, and first build target without requiring readers to open every detailed spec first.

## Product thesis

Krate agents are repository-native work executors. They should feel like a CI run plus a durable chat/session: queued on runner capacity, scoped to a repository/ref/source object, governed by Kubernetes-native RBAC and grants, observable in real time, artifact-producing, approval-gated, and linked back to Code, Issues, Pull Requests, Runs, Hooks, Workspaces, Inbox, and Settings.

Agent Mux provides adapter/session/chat/runtime capabilities. Krate owns the repository graph, resource model, policy, triggers, RBAC, secret/config grants, context assembly, dispatch run state, approvals, artifacts, audit, and UI hierarchy.

## Big picture flow

```text
Repository/PR/Issue/Pipeline/Webhook/manual action
  -> trigger or manual dispatch request
  -> context assembly and redaction
  -> permission review
  -> AgentDispatchRun and AgentDispatchAttempt
  -> Agent Mux launch/session binding
  -> event/transcript/artifact reconciliation
  -> approvals and optional write-back
  -> repository page projections and audit
```

## Main resource families

| Family | Resources | Why it exists |
| --- | --- | --- |
| Stack config | `AgentStack`, `AgentToolProfile`, `AgentMcpServer`, `AgentSkill`, `AgentSubagent` | defines what can run. |
| Permission config | `AgentServiceAccount`, `AgentRoleBinding`, `AgentSecretGrant`, `AgentConfigGrant` | defines who/what can access roles, secrets, config, and runners. |
| Trigger config | `AgentTriggerRule`, `AgentContextLabel`, `AgentWorkspacePolicy` | defines when/how context and workspace are selected. |
| Execution records | `AgentDispatchRun`, `AgentDispatchAttempt`, `AgentSession`, `AgentTriggerExecution` | tracks work like CI runs. |
| Context/artifacts | `AgentContextBundle`, `AgentArtifact`, `AgentReviewArtifact` | makes prompts and outputs durable/auditable. |
| Human gates | `AgentApproval` | gates tools, secrets, write-back, release actions, and risky operations. |
| Work graph links | `AgentWorkspace`, `WorkItemSessionLink`, `WorkItemWorkspaceLink` | connects sessions/workspaces/runs to issues, PRs, and repository pages. |

## First build target

The MVP is intentionally narrow:

1. Define one read-only/diagnostic stack.
2. Validate Kubernetes-native ServiceAccount/RBAC/Secret/Config access.
3. Dispatch manually from Code or Runs.
4. Create `AgentDispatchRun`, `AgentDispatchAttempt`, context bundle, and permission snapshot before Agent Mux launch.
5. Show the run beside CI runs and in `/agents/runs`.
6. Bind Agent Mux session if configured; otherwise show a clear degraded state.

Deferred from MVP: auto triggers, write-back, branch pushes, full workspace lifecycle, subagent execution, retention jobs, and production MCP management.

## Existing Krate seams to preserve

- `src/resource-model.js` remains the kind/schema source of truth.
- `src/kubernetes-controller.js` remains the Kubernetes-style resource gateway.
- `src/api-controller.js` remains the HTTP/application facade.
- `src/controller-ui.js` remains the server-projected UI model.
- `/api/controller/resources` remains the generic list/apply path.
- `/api/watch/orgs/[org]/*` is the watch/SSE pattern.
- Repository routes stay under `/orgs/[org]/repositories/[repo]/...`.

Typed agent APIs and pages should wrap these seams, not bypass them.

## Safety invariants

- No Secret values in browser, prompt preview, status, logs, audit, or docs examples.
- Kubernetes RBAC remains authoritative.
- Labels/comments/context labels cannot grant permissions.
- Untrusted/forked refs cannot use privileged ServiceAccounts or secrets.
- Agent output cannot write back without policy and approval.
- Agent Mux is not source of truth for Krate repository objects.
- Every visible UI action maps to resource/action/controller/watch state.

## Where to read next

- Start implementation with [MVP vertical slice spec](./mvp-vertical-slice-spec.md).
- Add kinds from [Agent CRD schema spec](./crd-schema-spec.md).
- Add controllers from [Controller reconciliation spec](./controller-reconciliation-spec.md).
- Use [API contract spec](./api-contract-spec.md) for route bodies.
- Use [UI flow and state spec](./ui-flow-spec.md) for screens.
- Use [Security threat model](./security-threat-model.md) before enabling write-back or secrets.
- Use [Developer implementation checklist](./developer-implementation-checklist.md) as the execution checklist.

## Company brain memory layer

Krate should include an org-level company brain as a first-class context source. The company brain is a managed internal Git repository containing Atlas-style YAML graph records, Markdown files with YAML frontmatter, ontology definitions, and free-form Markdown notes searchable with grep. Dispatches can read current memory or a historical memory ref, and every selected memory item is captured in `AgentContextBundle` through `AgentMemorySnapshot` and `AgentMemoryQuery` records.

This layer belongs to Krate's repository and policy plane: Krate owns memory repository configuration, RBAC, path/kind grants, ref resolution, context digests, update approvals, validation, and audit. Agent Mux may execute memory tools inside a session only after Krate admits those capabilities.
