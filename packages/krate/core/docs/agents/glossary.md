# Agent glossary

## Purpose

This glossary standardizes terms used across the agent orchestration docs.

## Terms

| Term | Meaning |
| --- | --- |
| Agent stack | Reusable definition of an agent, model, prompt, tools, MCP servers, skills, subagents, permissions, runner, workspace, and write-back policy. |
| Agent Mux | External/embedded execution layer that owns adapter-specific run/session/chat/runtime behavior. |
| AgentDispatchRun | Logical CI-like agent run visible in Krate. |
| AgentDispatchAttempt | Concrete execution attempt for a run, including retry/resume/fork attempts. |
| AgentSession | Krate projection of an Agent Mux chat/session linked to a dispatch attempt. |
| AgentContextBundle | Durable, redacted, digest-addressed prompt/context snapshot for a dispatch. |
| Context label | Reviewed prompt fragment with provenance and source restrictions. |
| Capability requirement | Computed dependency from a stack/tool/MCP/skill/subagent to roles, secrets, configs, or adapter capabilities. |
| Runtime identity | Agent ServiceAccount used by an attempt. |
| Runner identity | ServiceAccount used by runner pod/execution host. |
| Permission review | Server-side decision that checks stack, actor, ServiceAccounts, RBAC, Secret grants, ConfigMap grants, source, trust tier, and approvals. |
| AgentSecretGrant | Explicit permission to use selected Secret keys for a specific subject/purpose/source scope. |
| AgentConfigGrant | Explicit permission to use selected ConfigMap keys for a specific subject/purpose/source scope. |
| Write-back | Any mutation to PRs, issues, branches, checks, reviews, releases, deployments, or repository state. |
| Approval | Human/policy gate for privileged tool use, secret use, write-back, network, release, or workspace operation. |
| Artifact | Durable agent output such as diagnosis, patch, review, test report, release report, or subagent output. |
| Workspace | Git worktree/runtime surface associated with an issue, PR, run, session, or repository. |
| Work item link | Association between issue/work item and session/workspace. |
| Trigger execution | Durable record of a trigger rule evaluation and its created/coalesced/rejected decision. |
| Dedupe key | Stable key used to coalesce repeated events into an existing run. |
| Trust tier | Source/execution trust classification such as trusted branch or untrusted fork. |
| Permission snapshot | Immutable digest of roles/grants/identity decisions used for an attempt. |
| Context digest | Immutable digest of assembled/redacted context bundle. |
| Adapter capability | Agent Mux-reported support for sessions, tools, MCP, skills, subagents, approvals, actions, and streaming. |
| Native RBAC | Kubernetes ServiceAccounts, Roles, ClusterRoles, RoleBindings, ClusterRoleBindings, and access reviews. |

## Naming conventions

- Resource kind names use `Agent*` when they are agent-specific.
- `spec` describes desired state or immutable execution request.
- `status` describes observed/reconciled state.
- Condition types use stable machine-readable enums.
- Secret/config references include namespace/name/key metadata only, never values.
- Agent Mux IDs are stored in status, not treated as Krate resource names.

## Avoid these terms

| Avoid | Use instead | Reason |
| --- | --- | --- |
| bot permission | ServiceAccount/RBAC/grant | Keep native Kubernetes model clear. |
| prompt tag | context label | Labels are reviewed prompt fragments with provenance. |
| run log | event timeline/transcript/artifact | Distinguish structured events from chat transcript and output. |
| agent job | AgentDispatchRun/Attempt | Align with CI-like run model. |
| secret access in prompt | AgentSecretGrant | Permissions cannot be prompt-injected. |

## Company brain

Org-level Git-backed shared agent memory managed by Krate. It contains Atlas-style graph YAML records, Markdown records with YAML frontmatter, ontology files, and free-form Markdown notes searchable with grep. Dispatches consume it through `AgentMemorySnapshot` and `AgentMemoryQuery` so memory is pinned, cited, redacted, and auditable.

## Memory snapshot

Immutable dispatch-time record of the company brain repository ref, resolved commit, ontology/index digests, query manifest, and selected records/excerpts. Retries reuse the snapshot unless explicitly refreshed.

## Memory update

Reviewable proposed change to the company brain, usually produced by an agent run and routed through validation, approval, and a PR or managed merge flow.
