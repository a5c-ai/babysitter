# Agent controller reconciliation spec

## Purpose

This document defines the controller loops needed for agent orchestration. It is grounded in the current Krate implementation:

- `src/api-controller.js` is an HTTP/application facade and should not own long-running reconciliation loops.
- `src/kubernetes-controller.js` already models list/get/apply/delete/watch over Kubernetes-style resources.
- `src/controller-ui.js` converts controller snapshots into UI-friendly view models.
- `apps/web/app/api/watch/[[...resource]]/route.js` streams org-scoped Krate live events as SSE.

Agent implementation should add focused controllers and keep UI/API handlers thin.

## Controller architecture

| Controller | Watches | Writes | Purpose |
| --- | --- | --- | --- |
| `agent-stack-controller` | stack/tool/MCP/skill/subagent/context/rbac/grant resources | stack status, capability requirements | Validate stack readiness. |
| `agent-rbac-controller` | users, teams, RepositoryPermission, AgentServiceAccount, AgentRoleBinding, native RBAC | native ServiceAccounts/Roles/RoleBindings, status | Sync Kubernetes identity/RBAC intent. |
| `agent-secret-config-controller` | Secret, ConfigMap, grants, capabilities | grant status, requirement status | Validate secret/config access and drift. |
| `agent-trigger-controller` | WebhookDelivery, Pipeline, Job, Issue, PullRequest, AgentTriggerRule | AgentTriggerExecution, AgentDispatchRun | Match events and create runs. |
| `agent-dispatch-controller` | AgentDispatchRun, AgentDispatchAttempt | attempts, sessions, artifacts, approvals, status | Launch/reconcile Agent Mux runs. |
| `agent-workspace-controller` | AgentWorkspacePolicy, AgentWorkspace, work-item links | workspace status, links | Manage worktrees/runtime state. |
| `agent-approval-controller` | AgentApproval, artifacts, write-back requests | approval status, repository/PR/check writes | Gate privileged actions. |
| `agent-ui-projection-controller` | all agent resources | controller-ui model additions | Build efficient route view models. |

## Shared reconciliation rules

- Reconcile by desired resource state and observed external state, not by UI events.
- Use `metadata.generation` and `status.observedGeneration` to avoid stale status updates.
- Every external side effect needs an idempotency key.
- Controllers must tolerate restart, duplicate events, partial Agent Mux outages, and Kubernetes watch reconnects.
- Conditions should explain every blocked UI action.
- Secret values must never be copied into status, audit events, logs, or prompt previews.

## Idempotency keys

| Side effect | Key |
| --- | --- |
| Trigger execution | source event UID + rule generation + dedupe key |
| Dispatch run creation | trigger execution UID or manual dispatch request UID |
| Attempt creation | dispatch run UID + attempt number + reason |
| Agent Mux launch | attempt UID + stack snapshot digest + context digest |
| Workspace provision | workspace policy + repo + ref + work item + attempt UID |
| Approval request | attempt UID + action type + target + artifact digest |
| Write-back | approval UID + artifact digest + target object |
| Native RBAC sync | AgentRoleBinding UID + roleRef + subject + scope |
| Secret/config grant review | grant UID + target metadata version + subject |

## `agent-stack-controller`

Inputs:

- `AgentStack`, `AgentToolProfile`, `AgentMcpServer`, `AgentSkill`, `AgentSubagent`, `AgentContextLabel`.
- `AgentServiceAccount`, `AgentRoleBinding`, `AgentSecretGrant`, `AgentConfigGrant`.
- Agent Mux capability manifests.

Reconcile steps:

1. Load stack and referenced config resources.
2. Query Agent Mux capabilities for adapter/model/session/tool support.
3. Compute `AgentCapabilityRequirement` for tools, MCP, skills, subagents, model provider, and runtime.
4. Call permission review for ServiceAccount/RBAC/Secret/Config access.
5. Probe MCP health where required.
6. Set readiness conditions and warnings.
7. Emit UI projection hints for stack builder.

Outputs:

- `AgentStack.status.conditions`.
- `AgentCapabilityRequirement` records.
- Audit events for readiness transitions when they affect dispatch admission.

## `agent-rbac-controller`

Inputs:

- `User`, `Team`, `IdentityMapping`, `RepositoryPermission`.
- `AgentServiceAccount`, `AgentRoleBinding`.
- Native Kubernetes `ServiceAccount`, `Role`, `ClusterRole`, `RoleBinding`, `ClusterRoleBinding`.

Reconcile steps:

1. Resolve Krate subject into Kubernetes user/group/ServiceAccount.
2. Determine whether Krate owns or imports the native object.
3. Run bind/escalate checks for requested role changes.
4. Apply or update owned native RBAC objects.
5. Detect drift and set conditions.
6. Notify stack controller when dependent identity or roles changed.

Failure handling:

- Missing subject: `SubjectsResolved=False`.
- Escalation denied: `EscalationAdmitted=False` and no native apply.
- Drift on owned privileged role: block dependent dispatches until resolved.

## `agent-secret-config-controller`

Inputs:

- Native `Secret` and `ConfigMap` metadata.
- `AgentSecretGrant`, `AgentConfigGrant`.
- `AgentCapabilityRequirement`.
- `AgentDispatchAttempt` for active snapshots.

Reconcile steps:

1. Check target Secret/ConfigMap existence and requested key names.
2. Check native RBAC visibility for metadata and apply policy for sensitive ConfigMap keys.
3. Match grants to capability requirements.
4. Mark stale grants when target metadata version changes.
5. Update affected stack readiness and active dispatch warnings.

Failure handling:

- Secret value unavailable to controller: acceptable; values are not required for metadata validation.
- Secret missing: block new dispatch and mark active snapshots stale.
- Key removed: block retry/resume and show affected consumers.

## `agent-trigger-controller`

Inputs:

- `WebhookDelivery`, `Pipeline`, `Job`, `Issue`, `PullRequest`, labels, comments, schedules, manual dispatch requests.
- `AgentTriggerRule`.

Reconcile steps:

1. Normalize event into a trigger payload.
2. Persist `AgentTriggerExecution` before dispatch.
3. Evaluate lifecycle, matcher, actor, repository/ref trust, dedupe, and concurrency.
4. Build context bundle plan and run permission review.
5. Create `AgentDispatchRun` when admitted.
6. Mark execution as created, coalesced, rejected, or waiting for approval.

Outputs:

- `AgentTriggerExecution`.
- `AgentDispatchRun` and initial source breadcrumbs.

## `agent-dispatch-controller`

Inputs:

- `AgentDispatchRun`, `AgentDispatchAttempt`, `AgentContextBundle`, permission snapshots.
- Agent Mux gateway/client.

Reconcile steps:

1. Create initial or retry attempt.
2. Materialize immutable stack/context/permission snapshots.
3. Select runner/external gateway and workspace.
4. Launch Agent Mux run/session with admitted tools, secrets, configs, and runtime identity references.
5. Persist Agent Mux run/session IDs.
6. Reconcile event stream into status, artifact, approval, cost, and subagent records.
7. Transition run to terminal state or waiting state.

Failure handling:

- Agent Mux unavailable: retry with backoff while attempt remains queued/starting.
- Session binding pending: set `AgentMuxSessionBound=False` with pending reason.
- Adapter rejects launch options: fail attempt and keep permission snapshot for diagnosis.

## `agent-workspace-controller`

Inputs:

- `AgentWorkspacePolicy`, `AgentWorkspace`, `WorkItemWorkspaceLink`, dispatch attempts.

Reconcile steps:

1. Decide workspace mode from policy and trust tier.
2. Provision/link worktree when needed.
3. Record branch, head, dirty state, ahead/behind, runtime URLs, and missing path state.
4. Handle pin, archive, cleanup, recover, notes, and rebase actions.
5. Link workspace to issue/PR/run/session.

## `agent-approval-controller`

Inputs:

- `AgentApproval`, write-back requests, artifacts, dispatch attempts.

Reconcile steps:

1. Validate approver identity and native RBAC.
2. Validate approval still matches current artifact digest and target object.
3. Apply approved action idempotently.
4. Write audit event and update approval/run status.

## UI projection integration

`src/controller-ui.js` should add an `agents` view model with:

- stack readiness counters;
- active dispatches and pending approvals;
- missing permission warnings;
- repository-scoped agent affordances for code/issues/PRs/runs/settings;
- watch resource names for `LiveWatchPanel`.

The existing app can initially expose agent resources through advanced resource tables, then add typed pages once controllers exist.

## Memory controller responsibilities

The memory controller reconciles the company brain control plane:

- watches `AgentMemoryRepository`, validates reachability, default branch, layout, and index freshness;
- watches `AgentMemorySource`, computes allowed path/kind scopes, and projects missing grants into `AgentCapabilityRequirement`;
- resolves current, explicit, snapshot-tag, and `refAt` memory refs for dispatch admission;
- creates `AgentMemorySnapshot` and `AgentMemoryQuery` records during context assembly;
- validates `AgentMemoryUpdate` patches, opens review branches/PRs when allowed, and records approval/merge status;
- updates `AgentMemoryOntology` status from parser, graph, frontmatter, edge, owner, and secret-scan validators;
- preserves historical snapshots even when memory sources or repositories are later disabled.

## Org-scoped controller reconciliation

Every controller reconciliation starts by resolving `organizationRef` and namespace. Controllers may cache cluster-wide watches, but each side effect must be namespaced to the owning org. Agent, memory, runner, trigger, deployment, repository, and secret/config controllers reject cross-org references unless an explicit sharing policy exists.

The memory controller also reconciles `AgentRunMemoryImport` records by reading admitted `.a5c` run/session/journal metadata, redacting it, normalizing it into the org memory repository, and linking imported records to the source `AgentDispatchRun` or Babysitter run ID.

## Org admission and memory import reconciler pseudocode

Org admission should run as a shared preflight:

```text
resolveOrg(resource)
assertNamespaceMatchesOrg(resource.namespace, org.namespace)
assertOrgLabels(resource.metadata.labels, org)
for ref in resource.spec.refs:
  assertSameOrg(ref, org) or assertSharingPolicy(ref, org)
assertKubernetesRbac(actor, org.namespace, verb, resource)
assertKratePermission(actor, org, action)
emitAuditPreflight(actor, org, resource, action)
```

`AgentRunMemoryImport` reconciliation:

```text
resolve import org and source run
verify source repository/session/run belongs to org
collect admitted MEMORY.md, session, journal, task, artifact metadata
compute source digests
redact secrets and unsafe prompt instructions
normalize to Markdown/YAML memory files
validate ontology/frontmatter/edges/owners
open or update memory repo PR
wait for approval/merge
record resulting memory commit and indexes
```

The reconciler must be idempotent by source digest, target path, and import generation.

## Sequence spec reference

The detailed org-memory sequences are defined in [Org memory controller sequence spec](./org-memory-controller-sequence-spec.md). Controller implementation should keep that document as the source of truth for ordering, idempotency keys, status conditions, and cross-org denial behavior.
