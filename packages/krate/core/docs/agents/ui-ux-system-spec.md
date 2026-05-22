# Agent UI/UX system spec

## Purpose

Agent UX in Krate must be more than screens. Every visible affordance should map to a resource, API contract, controller behavior, policy check, and event stream. This document defines how the Agent Mux-inspired UI primitives affect the app, agent stack model, custom resources, aggregated resources, and controllers.

## Design principle

The UI is a projection of the orchestration graph:

- If the user can click it, there must be a resource/action behind it.
- If an agent can do it, there must be a policy and audit path for it.
- If a run appears in the UI, it must be watchable and link back to source event, workspace, session, stack, artifacts, and approvals.
- If a setting changes launch behavior, it belongs in an `AgentStack`, tool/MCP/skill/subagent resource, trigger rule, or policy resource, not only in local UI state.

## Navigation model

### Global navigation

Add an `Agents` top-level section, but keep agent state visible in existing repository workflows.

Global pages:

- `/agents`: overview of stacks, active dispatches, trigger health, pending approvals, and workspace/session activity.
- `/agents/stacks`: stack registry for base agents, models, prompts, tools, MCP servers, skills, subagents, runner policy, and write-back policy.
- `/agents/runs`: cross-repository `AgentDispatchRun` list, shaped like pipeline runs.
- `/agents/rules`: trigger rules, deliveries, dry-runs, lifecycle, and execution summaries.
- `/agents/tools`: native tool profiles, command allow/deny policy, filesystem/network policy.
- `/agents/mcp`: MCP server registry, health, discovered tools, secret refs, and allowed stacks.
- `/agents/skills`: skill/runbook registry and validation state.
- `/agents/workspaces`: agent-owned or agent-linked workspace inventory.
- `/agents/approvals`: cross-repository approvals and human gates.
- `/agents/identities`: users, teams, agent ServiceAccounts, runner ServiceAccounts, and native Kubernetes RBAC projection.
- `/agents/secrets`: Secret and ConfigMap inventory, grants, consumers, rotation state, and missing-permission warnings.
- `/agents/permissions`: role templates, RoleBindings, ClusterRoleBindings, grant graph, drift, and escalation warnings.

Repository pages must embed agent affordances inline:

- `/orgs/[org]/repositories/[repo]/code`: manual dispatch from paths, workspace links, and active sessions.
- `/orgs/[org]/repositories/[repo]/pull-requests`: check diagnosis, repair, review agents, patch artifacts, and PR write-back approvals.
- `/orgs/[org]/repositories/[repo]/issues`: issue-to-agent workspace/session links, context labels, board state, and dispatch readiness.
- `/orgs/[org]/repositories/[repo]/runs`: agent dispatch rows beside pipeline/job rows.
- `/orgs/[org]/repositories/[repo]/hooks`: incoming webhook triggers and delivery replay.
- `/orgs/[org]/repositories/[repo]/settings/agents`: repository-scoped stack permissions, trigger rules, MCP/skill allow-lists, runner policy, ServiceAccount selection, Secret grants, ConfigMap grants, and native role bindings.

## Agent Mux route-to-Krate route mapping

Krate should keep GitHub-like repository navigation as the primary frame and use Agent Mux patterns inside that frame. Agent Mux standalone routes become either global operations pages or embedded repository tabs.

| Agent Mux route | Krate route/surface | Backing resources | Controller/watch impact |
| --- | --- | --- | --- |
| `/agents` | `/agents` and `/agents/stacks` | `AgentStack`, adapter capability projections | Stack controller resolves capabilities, readiness, and warnings. |
| `/sessions`, `/sessions/new` | `/agents/sessions`, dispatch composer in repo/PR/issue pages | `AgentSession`, `AgentDispatchRun` draft | Dispatch controller creates runs; Agent Mux adapter opens or resumes sessions. |
| `/sessions/pending/:runId` | `/agents/runs/:runId?handoff=pending` | `AgentDispatchAttempt.status.agentMuxRunId` | Attempt waits for Agent Mux session binding and emits `SessionBindingPending`. |
| `/dispatches`, `/dispatches/:runId` | `/agents/runs`, `/orgs/[org]/repositories/[repo]/agents/[run]`, `/orgs/[org]/repositories/[repo]/runs/[run]` | `AgentDispatchRun`, `AgentDispatchAttempt`, `AgentApproval` | Dispatch controller reconciles CI-like run status, event cursor, approvals, and artifacts. |
| `/projects`, `/projects/:projectId/board`, `/projects/:projectId/list` | `/orgs/[org]/repositories/[repo]/issues`, `/orgs/[org]/repositories/[repo]/workspaces`, org project board if added | `WorkItem`, `WorkItemWorkspaceLink`, `WorkItemSessionLink` | Work graph controller maintains board/list projections and association edges. |
| `/projects/:projectId/issues/new`, `/issues/:issueId` | `/orgs/[org]/repositories/[repo]/issues/[issue]` and issue create drawer | `Issue`, `WorkItem`, `AgentContextLabel` | Issue controller exposes agent dispatch readiness and context labels. |
| `/projects/:projectId/workspaces/new`, `/projects/:projectId/issues/:issueId/workspace/new`, `/workspaces/new` | `/orgs/[org]/repositories/[repo]/workspaces/new` and issue workspace action | `AgentWorkspace`, `AgentWorkspacePolicy`, `WorkItemWorkspaceLink` | Workspace controller provisions git worktrees, records ownership, and links sessions/runs. |
| `/workspaces` | `/agents/workspaces`, `/orgs/[org]/repositories/[repo]/workspaces` | `AgentWorkspace`, runtime summaries | Workspace controller watches git/runtime state and lifecycle actions. |
| `/inbox` | `/agents/approvals` and repository inbox | `AgentApproval`, webhook delivery, review queue | Approval controller groups human gates, rejected writes, and action-required work. |
| `/automations` | `/agents/rules` and `/orgs/[org]/repositories/[repo]/settings/agents/triggers` | `AgentTriggerRule`, `WebhookDelivery`, rule execution records | Trigger controller handles lifecycle, dry-run, dedupe, coalescing, and replay. |
| `/settings` | `/agents/settings`, `/orgs/[org]/repositories/[repo]/settings/agents` | stack permissions, MCP allow-lists, runner policy | Policy controllers produce disabled states and admission errors. |

### GitHub-like repository hierarchy

Repository navigation should be consistent with GitHub mental models:

- `Code` owns manual dispatch from a path, file selection, branch/worktree status, and active workspace/session chips.
- `Issues` owns work item boards, context labels, linked workspaces, linked sessions, and issue-triggered dispatches.
- `Pull Requests` owns review agents, diff artifacts, check diagnosis, patch proposals, and write-back approval gates.
- `Actions` or `Runs` owns CI-like agent runs beside workflow/job rows, with identical status, duration, runner, and artifact affordances.
- `Settings > Agents` owns repository-scoped stacks, trigger rules, MCP/skill/tool allow-lists, runner placement, and secrets policy.

## Component primitive matrix

These Agent Mux primitives should be treated as product capabilities, not copied as isolated UI widgets.

| Agent Mux primitive | Krate capability | Backing resource/action | Required controller behavior |
| --- | --- | --- | --- |
| Command palette | Universal jump-to and quick actions for runs, sessions, workspaces, approvals, rules | `AgentActionSuggestion` aggregated from resources | Authorize every command server-side; palette only renders admitted actions. |
| Sidebar/topbar status pills | Live operational counters and connection health | watch summaries for runs/sessions/approvals/workspaces | Stream counters from controllers; show reconnect/stale states explicitly. |
| Project board/list | Issue-session-workspace management | `WorkItem`, `WorkItemWorkspaceLink`, `WorkItemSessionLink` | Maintain board state, WIP policy, child issues, and association graph. |
| Issue detail | Dispatch-ready work item hub | issue, context labels, linked sessions/workspaces/runs | Assemble context bundle preview and expose safe dispatch/write-back actions. |
| Dispatch queue | CI-like operational run list | `AgentDispatchRun`, `AgentDispatchAttempt`, `AgentApproval` | Reconcile Agent Mux event streams, approvals, retries, cancellation, and artifacts. |
| Dispatch detail | Run timeline plus chat handoff | dispatch attempt, Agent Mux run/session IDs | Bind pending session, redirect legacy run paths, and preserve run breadcrumbs. |
| Session conversation surface | Durable chat for an agent run | `AgentSession`, `AgentDispatchAttempt` | Proxy transcript, continuation, tool approvals, and reconnect events. |
| Session observability panel | Task/subagent/tool/runtime narrative | attempt event stream, subagent events, artifacts | Normalize events into timeline, cost, artifact shortcuts, and source links. |
| Workspace provisioning | Guided git worktree creation from issue/project/host | `AgentWorkspace`, `AgentWorkspacePolicy` | Enforce policy, create workspace, set ownership, and link to work item/session. |
| Workspace detail/runtime | Runtime preview, branch, notes, rebase and cleanup | workspace lifecycle action requests | Keep git status, runtime URL, sessions, runs, notes, and recovery state current. |
| Automations page | Trigger rule management | `AgentTriggerRule`, delivery records, execution summaries | Validate sources, lifecycle, target stack, dedupe/concurrency, and dry-runs. |
| Review panel | Agent-produced review artifact and decision workflow | `AgentReviewArtifact`, `AgentApproval`, linked PR | Gate comments/submissions, persist reviewer decisions, and apply write-back safely. |
| Execution context panel | Prompt/context transparency | `AgentContextBundle`, `AgentContextLabel`, attachments | Display provenance, redactions, prompt hash, and label-injected prompt fragments. |
| Breakpoint/approval panels | Human gates during execution | `AgentApproval` | Block continuation until decision; audit actor, reason, and policy source. |

## Screen state requirements from Agent Mux research

Krate pages must preserve the operational states that make Agent Mux useful:

- `SessionBindingPending`: dispatch has a run ID but no durable chat session yet; show pending handoff and retry/recover controls.
- `LegacyRunRedirect`: old run links resolve to the canonical dispatch page without losing breadcrumbs.
- `StreamDisconnected` and `StreamReconnecting`: transcript/event timelines remain readable, mark stale data, and resume from cursor.
- `WorkspaceMissing`: workspace record exists but path is gone; allow recover, relink, archive, or cleanup according to policy.
- `WorkspaceRebaseNeeded` and `WorkspaceRebaseConflicts`: keep conflict files, auto-resolve attempt, editor link, and mark-resolved actions visible.
- `AutomationRejected`: trigger delivery matched but policy/admission rejected it; show rule, payload, actor, and rejection reason.
- `AutomationCoalesced`: trigger delivery deduped or concurrency-blocked; link to the existing run and coalescing key.
- `ReviewChangesRequested`: review artifact is not write-backable until agent/user follow-up resolves requested changes.
- `ApprovalBlocked`: run is waiting on a human decision for tool, network, secret, shell, write-back, rebase, or release action.
- `ContextLabelDrift`: context label changed after dispatch; preserve snapshot used by the run and warn before retry.

## UI primitives and system effects

| UI primitive | User sees | Backing resource/action | Controller effect |
| --- | --- | --- | --- |
| Stack builder | Form/YAML for base agent, model, prompt, tools, MCP, skills, subagents | `AgentStack`, `AgentToolProfile`, `AgentMcpServer`, `AgentSkill`, `AgentSubagent` | Validate adapter capabilities and policy; update stack status. |
| Trigger rule builder | Event source, matcher, dry-run preview, lifecycle controls | `AgentTriggerRule`, `WebhookDelivery`, sample event | Evaluate dry-run, persist rule, update execution summaries. |
| Dispatch composer | Prompt, context labels, files/logs/artifacts, selected stack | `AgentContextBundle`, `AgentDispatchRun` draft | Assemble/redact context, compute digest, require approval if needed. |
| CI-like agent run row | Status, queue, runner, source, duration, artifacts | `AgentDispatchRun`, `AgentDispatchAttempt` | Reconcile Agent Mux run/session state into Krate run status. |
| Chat/session panel | Transcript, continuation box, tool activity | Agent Mux session ID on `AgentDispatchAttempt` | Proxy/subscribe to Agent Mux events; submit continuation/cancel/resume. |
| Subagent tree | Child lanes with role, status, findings, artifacts | `AgentSubagent` snapshot plus attempt subevents | Record subagent start/complete/fail events and outputs. |
| Workspace shell | branch, git status, runtime preview, terminal/dev server, notes | `AgentWorkspace`, `WorkItemWorkspaceLink` | Inventory workspace, surface runtime state, run lifecycle actions. |
| Review artifact panel | Diff, comments, decision, execution targets | `AgentReviewArtifact` or `Review` extension | Persist artifact, gate write-back, link to PR/issue/workspace/session. |
| Approval inbox | Pending tool/write-back/rebase/secret/network approvals | `AgentApproval` | Block/release continuation or write-back; audit decision. |
| Context label chips | Prompt fragments and provenance | `AgentContextLabel` | Render context block, compute prompt hash, record label provenance. |
| MCP health card | Server status and discovered tools | `AgentMcpServer.status` | Probe MCP server and refresh discovered tool inventory. |
| ServiceAccount picker | Agent and runner runtime identities | `AgentServiceAccount`, native `ServiceAccount` | Sync/select identities and show token projection/readiness. |
| Role binding matrix | Users, teams, agents, runners, roles, and scopes | `AgentRoleBinding`, native RBAC | Sync RoleBindings and show denied/escalation/drift states. |
| Secret grant matrix | Secret keys, consumers, purposes, and grants | `AgentSecretGrant`, native `Secret` metadata | Validate access without exposing secret values. |
| Config grant matrix | ConfigMap keys, consumers, purposes, and grants | `AgentConfigGrant`, native `ConfigMap` metadata | Validate config access and warn on sensitive keys. |
| Capability requirements panel | Tool/skill/MCP/model secret and config needs | `AgentCapabilityRequirement` | Compare requirements with grants and block invalid stacks. |

## Custom resource split

Use CRDs for low-cardinality declarative configuration and aggregated resources for high-cardinality execution records.

### CRD-backed configuration

- `AgentStack`: reusable agent definition.
- `AgentSubagent`: reusable subagent definition.
- `AgentToolProfile`: tool/shell/filesystem/network policy.
- `AgentMcpServer`: MCP endpoint definition and allowed scopes.
- `AgentSkill`: skill/runbook source and compatibility policy.
- `AgentTriggerRule`: event-to-stack routing rule.
- `AgentContextLabel`: reviewed prompt fragment and attachments.
- `AgentWorkspacePolicy`: workspace provisioning, cleanup, rebase, retention, and trust policy.
- `AgentServiceAccount`: managed runtime identity for agents and runners.
- `AgentRoleBinding`: Krate-managed projection to native Kubernetes RBAC.
- `AgentSecretGrant`: Secret key access grant for users, teams, agents, tools, skills, MCP servers, and runners.
- `AgentConfigGrant`: ConfigMap key access grant for users, teams, agents, tools, skills, MCP servers, and runners.

These resources should support YAML transparency in the UI: view YAML, copy `kubectl apply`, save draft, or open a PR.

### Aggregated/high-cardinality resources

- `AgentDispatchRun`: logical dispatch visible like a pipeline run.
- `AgentDispatchAttempt`: concrete attempt/retry/resume/continuation.
- `AgentContextBundle`: materialized redacted context with digest and source refs.
- `AgentSession`: projection of Agent Mux session and transcript state.
- `AgentWorkspace`: inventory/projection of active/idle/archived/missing workspaces.
- `AgentApproval`: pending/completed human gates.
- `AgentReviewArtifact`: agent-produced diff/comment/decision artifact.
- `AgentTriggerExecution`: trigger rule execution summary with dedupe/rejection reason.
- `AgentToolEvent`: normalized tool/MCP/subagent event stream when retention policy requires queryable records.

These should be watchable, queryable, paginated, and backed by Postgres or another aggregated API storage path rather than etcd-only history.

## Controller responsibilities

### Agent stack controller

Watches `AgentStack`, `AgentSubagent`, `AgentToolProfile`, `AgentMcpServer`, and `AgentSkill`.

Responsibilities:

- resolve stack references;
- validate Agent Mux adapter capability compatibility;
- validate tool/MCP/skill/subagent policy;
- compute effective launch profile;
- update status with valid/warning/invalid and actionable reasons.

### Trigger controller

Watches `AgentTriggerRule`, repository events, CI events, webhook deliveries, comments, labels, pushes, tags, and schedules.

Responsibilities:

- evaluate matchers;
- dry-run sample events;
- dedupe and concurrency control;
- create/update work items when configured;
- materialize `AgentContextBundle`;
- create `AgentDispatchRun` and first `AgentDispatchAttempt`;
- update rule execution summaries.

### Dispatch controller

Watches `AgentDispatchRun` and `AgentDispatchAttempt`.

Responsibilities:

- place attempt on runner pool or external Agent Mux gateway;
- start Agent Mux run/session;
- persist Agent Mux IDs;
- stream status/events into Krate resources;
- handle cancel/retry/resume/fork/continue;
- collect artifacts and subagent outputs;
- transition phases and terminal states.

### Workspace controller

Watches work item/workspace/session links and workspace policies.

Responsibilities:

- provision/link workspaces;
- inventory git state and runtime surfaces;
- handle pin/archive/cleanup/recover/rebase/notes actions;
- attach workspace state to dispatch run and session views;
- enforce trust-tier workspace isolation.

### Approval/write-back controller

Watches `AgentApproval`, artifacts, and write-back requests.

Responsibilities:

- hold privileged actions until approved;
- apply approved PR comments, reviews, branch updates, workflow reruns, or issue updates;
- reject/expire blocked requests;
- record actor, approver, source event, stack snapshot, context digest, and artifact digest.

### RBAC and secret/config controller

Watches users, teams, ServiceAccounts, native RBAC resources, Secrets, ConfigMaps, agent stacks, tools, skills, MCP servers, and grant resources.

Responsibilities:

- sync Krate role/service-account intent into native Kubernetes RBAC resources;
- import external native RBAC as read-only projections when Krate does not own it;
- validate tool-secret, skill-secret, MCP-secret, model-secret, and ConfigMap requirements;
- show stack readiness warnings when selected ServiceAccount lacks required Secret, ConfigMap, or Role access;
- block dispatch when missing permissions cannot be safely approved;
- never expose Secret values in UI, logs, events, or prompt previews.

### Agent Mux gateway adapter

Internal module, not a user-facing controller by itself.

Responsibilities:

- query adapter capabilities/config schemas;
- launch sessions/runs;
- stream transcript/events;
- submit continuation, cancel, resume, fork, and approval input when supported;
- normalize Agent Mux runtime state into Krate `AgentSession`, `AgentDispatchAttempt`, and event projections.

## UI state rules

- Do not store launch-critical settings only in client state.
- Forms edit resource drafts and submit them through the same API path as YAML apply.
- Disabled actions must come from API authorization or policy status, not local UI-only role checks.
- Every mutating action must show the target resource, resulting YAML/action, and policy impact.
- Every long-running view must use Watch/SSE updates rather than polling-only UX.
- Every dispatch run must keep source-object breadcrumbs: repository, PR/issue/check/job/webhook/rule, workspace, session, runtime ServiceAccount, runner ServiceAccount, and artifacts.
- Secret/config grants and native RBAC status must drive stack warnings and disabled actions.
- A tool, skill, MCP server, or model provider that requires a Secret/ConfigMap must show a blocking warning when the selected agent identity lacks access.

## Screen-to-resource contracts

### Stack builder screen

Reads:

- `AgentStack`, `AgentSubagent`, `AgentToolProfile`, `AgentMcpServer`, `AgentSkill`, `AgentServiceAccount`, `AgentRoleBinding`, `AgentSecretGrant`, `AgentConfigGrant`, `AgentCapabilityRequirement`, adapter capabilities.

Writes:

- stack and referenced config resources.

Required UI states:

- invalid adapter capability;
- missing MCP health;
- missing ServiceAccount or runner identity;
- missing RoleBinding, Secret grant, or ConfigMap grant;
- permission review denied with least-privilege suggested fix;
- tool/skill/MCP/model requires secret or config the selected identity cannot access;
- unsupported subagent dispatch;
- unsafe approval mode for repo policy;
- dirty draft vs applied resource;
- YAML preview.

### Trigger builder screen

Reads:

- `AgentTriggerRule`, source event schemas, recent deliveries, stack list, context labels.

Writes:

- rule lifecycle changes and dry-run requests.

Required UI states:

- draft/active/paused/disabled/archived;
- sample event matched/not matched;
- dedupe key preview;
- expected context bundle preview;
- approval/write-back policy preview.

### Dispatch run screen

Reads:

- `AgentDispatchRun`, attempts, Agent Mux session, context bundle, approvals, artifacts, workspace, source refs.

Writes:

- cancel, retry, resume, fork, continue, approve/reject, write-back request.

Required UI states:

- queued/running/waiting/failed/succeeded/cancelled;
- transcript connected/disconnected/reconnecting;
- approval blocked;
- workspace missing/stale/rebase-needed;
- subagent running/failed/completed;
- artifact ready/pending/approved/applied.

### Workspace screen

Reads:

- `AgentWorkspace`, work item links, sessions, runs, git/runtime state, review artifacts.

Writes:

- lifecycle action requests and notes.

Required UI states:

- active/idle/archived/missing;
- dirty/clean/ahead/behind/rebase-conflict;
- dev server ready/unavailable;
- terminal command running/failed;
- linked issue/session/run absent or stale.

## API surface sketch

Future routes should mirror resources and actions:

- `GET /api/agents/stacks`
- `POST /api/agents/stacks`
- `GET /api/agents/capabilities`
- `GET /api/agents/identities`
- `POST /api/agents/identities/service-accounts`
- `GET /api/agents/permissions`
- `POST /api/agents/permissions/role-bindings`
- `POST /api/agents/permissions/review`
- `GET /api/agents/secrets`
- `POST /api/agents/secrets/grants`
- `POST /api/agents/config/grants`
- `GET /api/agents/runs`
- `POST /api/agents/runs`
- `GET /api/agents/runs/:run/events`
- `POST /api/agents/runs/:run/cancel`
- `POST /api/agents/runs/:run/continue`
- `POST /api/agents/runs/:run/retry`
- `GET /api/agents/rules`
- `POST /api/agents/rules/:rule/dry-run`
- `POST /api/agents/approvals/:approval/decision`
- `GET /api/agents/workspaces`
- `POST /api/agents/workspaces/:workspace/action`
- `GET /api/watch/orgs/[org]/agentdispatchruns`
- `GET /api/watch/orgs/[org]/agentapprovals`

These can later map to Kubernetes-style resource paths or aggregated API endpoints; the UI should not depend on in-memory-only route state.

## Acceptance criteria

- Every agent UI surface documents which resource(s) it reads, writes, and watches.
- Stack settings affect launch behavior only through persisted stack/tool/MCP/skill/subagent resources.
- Trigger settings affect dispatch only through `AgentTriggerRule` and recorded trigger executions.
- Dispatches appear beside pipeline runs and can open linked Agent Mux chat/session.
- Workspace/session links are visible from issue, PR, pipeline, run, workspace, and session pages.
- Privileged agent actions require `AgentApproval` or explicit repository policy.
- Native Kubernetes RBAC remains authoritative for users, agents, and runners; Krate syncs and projects it instead of replacing it.
- Secret and ConfigMap access is granted by explicit resources and surfaced in stack/tool/skill/MCP readiness.
- Controllers and APIs can be implemented from the spec without inventing hidden UI-only state.

## Company brain memory UX

Krate should expose company brain memory as a system capability, not a hidden retrieval feature.

| Surface | Required UX |
| --- | --- |
| `/agents/memory` | memory repo health, current commit, ontology status, index freshness, pending updates, stale records, and denied queries. |
| `/agents/memory/graph` | graph browser with node kind filters, edge traversal, owners, repository associations, and source files. |
| `/agents/memory/search` | grep-like Markdown search with path/kind scopes and permission-aware redaction. |
| `/agents/memory/updates` | proposed memory patches, validation report, source run, reviewers, PR link, approval, merge, reject. |
| dispatch composer | memory source picker, current/ref/tag/refAt control, query preview, selected graph records, selected grep excerpts, stale-memory warning. |
| run detail | memory snapshot commit, query manifest, selected memory, diff against current, update proposal actions. |
| repository settings | associate repo with memory paths, graph kinds, owners, and default query mode. |

Advanced controls such as `run with memory from two days ago` belong behind an expandable memory settings panel but should still resolve to an explicit timestamp and commit before dispatch.

## Org-scoped navigation

The app should behave like a GitHub organization-first product:

- global switcher selects the active org;
- repository, agent, deployment, memory, runner, secret, and settings pages live under `/orgs/[org]`;
- non-org repository routes are not product surface;
- breadcrumbs always show org, repository/deployment, and current resource;
- cross-org search results are grouped by org and require explicit permission;
- `/orgs/[org]/agents/memory` exposes `MEMORY.md`, sessions, run journals, retrospectives, and imports from that org only.

## Current UI seam alignment

The existing Krate UI already provides org navigation, repository tabs, deployment pages, run pages, and advanced resource panels. The agent experience should preserve that GitHub-like structure:

- add `Agents` to the org sidebar/topbar, not a separate standalone product shell;
- render agent runs beside repository runs and link to full run detail;
- expose company brain memory under the org's agent section;
- use repository settings for repo-specific memory sources, triggers, and grants;
- keep YAML/resource plans in expandable advanced panels consistent with current UI patterns;
- keep chat/session as a panel inside the run detail, not as the primary navigation object.
