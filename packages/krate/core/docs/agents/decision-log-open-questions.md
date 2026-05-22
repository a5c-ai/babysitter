# Agent decision log and open questions

## Purpose

This document records architecture decisions already made in the agent docs and tracks open questions that should be resolved before or during implementation. It helps keep future work aligned with the docs-only design.

## Accepted decisions

### Agents are repository-native, not a separate chat app

Decision:

- Agent state appears inside Code, Issues, Pull Requests, Runs, Hooks, Settings, Workspaces, Inbox, and global Agents pages.

Rationale:

- Krate is a forge/control-plane; agent dispatch is part of repository workflow.

### Krate owns policy and graph; Agent Mux owns adapter/session runtime

Decision:

- Krate owns resources, triggers, RBAC, grants, context bundles, dispatch runs, approvals, artifacts, workspaces, and audit.
- Agent Mux owns adapter-specific launch/session/chat/runtime details.

Rationale:

- Keeps repository source of truth in Krate while reusing Agent Mux execution primitives.

### Kubernetes RBAC remains authoritative

Decision:

- Krate can manage projections and UI forms, but enforcement must resolve to native users/groups/ServiceAccounts/Roles/RoleBindings and admission checks.

Rationale:

- Avoids a parallel permission system and aligns with existing Krate identity docs.

### Secret access is explicit and purpose-scoped

Decision:

- Tools, skills, MCP servers, model providers, agents, and runners need explicit `AgentSecretGrant`/`AgentConfigGrant` resources.

Rationale:

- Prevents prompt or label text from implying credential access.

### Dispatches look like CI runs

Decision:

- `AgentDispatchRun` should appear beside `Pipeline` and `Job` records while exposing Agent Mux chat/session.

Rationale:

- Users already understand run status, queueing, runner pools, logs, artifacts, and approvals.

### Context bundles are durable and digest-addressed

Decision:

- Prompt/context assembly produces `AgentContextBundle` with provenance, redaction, limits, and digest.

Rationale:

- Required for audit, retries, approvals, and prompt safety.

## Open questions before implementation

### Aggregated API backing

Question:

- Should MVP execution resources be CRD-backed for speed, or immediately served through aggregated API/Postgres?

Default recommendation:

- Keep config resources CRD-backed; for MVP, execution resources may be represented by lightweight resources if existing infrastructure requires it, but design should not assume etcd for high-volume history.

### Agent Mux deployment mode

Question:

- Is Agent Mux embedded in Krate controller/web process, sidecar, separate service, or external gateway?

Default recommendation:

- Treat it as external gateway first. Keep `src/agent-mux-client.js` thin so deployment mode can change.

### Secret materialization boundary

Question:

- Does Agent Mux receive secret references only, or does a trusted server-side process materialize values before launch?

Default recommendation:

- Prefer references/projected mounts. If values must be materialized, do it only server-side in controller/runtime, never through browser/API responses.

### First supported base agent

Question:

- Should the first stack target Claude Code only or support multiple adapters from day one?

Default recommendation:

- Implement one Claude Code diagnostic stack end-to-end, but keep `AgentStack.spec.baseAgent` and capability handshake generic.

### Repository settings route shape

Question:

- Add `/orgs/[org]/repositories/[repo]/settings/agents` immediately or embed in existing `/orgs/[org]/repositories/[repo]/settings` first?

Default recommendation:

- Embed a minimal panel first if route scaffolding cost is high; add sub-route when typed pages are introduced.

### UI component reuse from Agent Mux

Question:

- Copy, wrap, or depend on Agent Mux web UI primitives?

Default recommendation:

- Wrap/embed only session/transcript/observability primitives. Rebuild navigation/layout in Krate style.

### Trigger auto-run default

Question:

- Should labels/comments auto-dispatch by default?

Default recommendation:

- No. Start with manual dispatch and dry-run trigger previews; make auto-run explicit per repository/rule.

### Write-back scope for MVP

Question:

- Should MVP allow PR comments or branch pushes?

Default recommendation:

- No automatic write-back in MVP. Approval-gated comments can be the first write-back slice after run/session binding.

## Questions to revisit after MVP

- Multi-tenant namespace strategy for agent resources.
- Whether subagents are native Agent Mux only or Krate-emulated by default.
- Whether Agent Mux transcripts are retained in Krate object storage or linked externally.
- How much of MCP server management belongs in global Agents pages versus repository settings.
- Whether to add generated OpenAPI schemas for typed agent routes.
- How to expose cost controls and quotas by team/repository/stack.

## Decision update process

When an implementation decision changes:

1. Update this document.
2. Update the impacted spec.
3. Update `implementation-rollout-slices.md` if sequencing changes.
4. Update `acceptance-test-matrix.md` if validation expectations change.
5. Reference the decision in PR summary.