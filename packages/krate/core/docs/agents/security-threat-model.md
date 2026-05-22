# Agent security threat model

## Purpose

Agent orchestration expands Krate from CI and repository management into autonomous tool execution. This document identifies threats and required mitigations for the docs-defined agent system.

## Security boundaries

| Boundary | Risk |
| --- | --- |
| User/browser to Krate API | forged UI actions, stale permissions, hidden local state |
| Krate API to Kubernetes API | RBAC bypass, privilege escalation, admission gaps |
| Krate controllers to Agent Mux | overbroad launch options, secret leakage, session confusion |
| Agent Mux to tool/runtime | tool abuse, command injection, MCP abuse |
| Runner/workspace to repository | untrusted code exfiltration, cross-run contamination |
| Trigger source to dispatch | label/comment prompt injection, webhook replay, dedupe bypass |
| Secret/ConfigMap grant to dispatch | credential overexposure, stale grants, rotation mismatch |
| Agent output to write-back | unauthorized PR comments, branch pushes, release actions |

## Threats and mitigations

### Prompt injection through labels/comments/context

Threat:

- Issue labels, PR comments, webhook payloads, or context labels inject hidden instructions or secret requests.

Mitigations:

- Context labels are reviewed resources, not raw hidden prompt text.
- Prompt preview shows all injected fragments and provenance.
- Secret/config access is controlled by grants, never by prompt content.
- Trigger dry-run shows rendered prompt and source payload summary.

### Privilege escalation through roles

Threat:

- A user grants an agent or runner a stronger Role/ClusterRole than they can bind.

Mitigations:

- `AgentRoleBinding` apply requires bind/escalate checks.
- Role templates show generated YAML before apply.
- Escalation attempts set conditions and audit events.
- Native Kubernetes RBAC remains authoritative.

### Secret exfiltration by tools or MCP servers

Threat:

- Tool, skill, MCP server, or agent code reads secrets not required for the task.

Mitigations:

- Secrets require explicit `AgentSecretGrant` by subject, purpose, repo/ref, trigger source, and mount policy.
- Agent launch passes only admitted references/mounts.
- Untrusted refs receive no privileged secrets.
- UI never shows Secret values; audit records only metadata and key names.

### ConfigMap misuse

Threat:

- Non-secret config changes execution behavior or contains sensitive values.

Mitigations:

- `AgentConfigGrant` gates ConfigMap usage.
- Sensitive keys are metadata-only in UI.
- ConfigMap consumers and breakage warnings are visible before deletion/change.

### Untrusted fork execution

Threat:

- Forked PR code runs on trusted runner or accesses privileged ServiceAccount/secrets.

Mitigations:

- Trust tier is part of trigger and runner admission.
- Fork refs force untrusted runner pools and unprivileged ServiceAccounts.
- Secret grants must explicitly allow untrusted refs; default deny.

### MCP/tool abuse

Threat:

- MCP server or native tool performs network, filesystem, or API actions beyond user intent.

Mitigations:

- `AgentToolProfile` defines filesystem/network/native tool policy.
- MCP servers declare required roles, Secret refs, ConfigMap refs, and allowed stacks.
- Tool approval policies gate privileged invocations.
- Runtime events stream tool calls into audit/observability.

### Agent Mux session confusion

Threat:

- A chat/session is linked to the wrong repository, workspace, dispatch attempt, or actor.

Mitigations:

- `AgentDispatchAttempt.status.agentMuxRunId` and `agentMuxSessionId` are bound once and audited.
- Run detail always shows source breadcrumbs.
- Continuation requests include dispatch/run/session IDs and permission review context.

### Write-back abuse

Threat:

- Agent posts comments, pushes branches, approves reviews, reruns checks, or publishes release artifacts without sufficient authorization.

Mitigations:

- Write-back is an explicit action with `AgentApproval` unless narrowly allowed by repository policy.
- Approval records include actor, approver, artifact digest, target, and source event.
- Write-back idempotency keys prevent duplicate comments/pushes/reruns.

### Replay and dedupe bypass

Threat:

- Webhook replay, repeated labels, or schedule storms create duplicate costly runs.

Mitigations:

- `WebhookDelivery` is durable before trigger evaluation.
- `AgentTriggerExecution` records dedupe/coalescing decisions.
- Dedupe keys include source object, commit SHA, failure signature, rule, and context digest.

### Workspace contamination

Threat:

- One agent attempt sees or mutates another run's workspace state.

Mitigations:

- Workspace policy selects isolated worktrees for untrusted or write-capable tasks.
- Workspace links record ownership and active sessions/runs.
- Missing/dirty/rebase states block unsafe write-back until resolved.

## Required audits

Every dispatch should preserve:

- actor and Kubernetes identity;
- source event and trigger rule;
- stack generation and permission snapshot digest;
- runtime and runner ServiceAccounts;
- Secret/ConfigMap grant names and key names only;
- tool/MCP/skill/subagent availability;
- Agent Mux run/session IDs;
- approvals and write-back decisions;
- artifacts and digests.

## Security acceptance criteria

- A fork PR cannot access privileged Secret grants or trusted ServiceAccounts.
- A label/comment cannot grant roles, secrets, configs, or write-back permission by itself.
- A stack with missing tool/skill/MCP Secret access cannot dispatch.
- Secret values are never visible in UI responses, status, logs, prompt previews, or audit events.
- Role binding escalation is denied by server-side review.
- Write-back to PRs, branches, checks, releases, or deployment surfaces is approval-gated and audited.

## Company brain memory threats

| Threat | Mitigation |
| --- | --- |
| prompt injection stored in memory | treat memory as untrusted input, scan risky instructions, render provenance, and separate memory from system/developer prompt layers. |
| stale memory drives bad action | show pinned commit and stale warning; allow diff against current; require explicit refresh. |
| unauthorized knowledge exposure | enforce `AgentMemorySource` path/kind grants and redact denied content before preview, prompt, transcript, or audit. |
| malicious memory update | require validation, source-run link, owners, review, PR diff, and merge permission. |
| secret leakage into memory | secret scan on reads and writes; block merge and redact selected context. |
| historical run escapes pinned memory | memory tools default to `AgentMemorySnapshot`; current-memory access requires refresh/approval. |

## Org boundary threats

| Threat | Mitigation |
| --- | --- |
| repository slug collision leaks data | non-org repository routes are not served; users must choose an organization explicitly. |
| cross-org Secret/ConfigMap mount | namespace and `organizationRef` admission checks before dispatch. |
| cross-org memory query | `AgentMemorySource` and memory APIs require org match and path/kind grant. |
| run journal imports leak another org | `AgentRunMemoryImport` resolves source repo/run/session ownership before reading `.a5c` material. |
| shared controller writes to wrong namespace | side effects use resolved org namespace and audit namespace. |
