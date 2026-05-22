# Agent MVP vertical slice spec

## Purpose

This document defines the smallest coherent implementation that proves Krate agent orchestration without attempting every spec at once. It should be the first code implementation target after the docs-only phase.

## MVP goal

A repository admin can define one read-only/diagnostic agent stack, review its Kubernetes-native permissions, manually dispatch it from a repository Code or Runs page, and see a CI-like `AgentDispatchRun` with context preview, permission snapshot, Agent Mux session binding when configured, and no write-back unless explicitly approved in a later slice.

## Included user flow

1. Admin creates minimal agent resources:
   - `AgentServiceAccount`;
   - `AgentRoleBinding` using read-only role template;
   - `AgentToolProfile` with read-only filesystem and no broad network;
   - optional `AgentMcpServer` if Agent Mux capability lookup requires it;
   - `AgentStack` for diagnostic/readonly work.
2. Admin runs permission review and sees `Ready=True` or exact blockers.
3. User opens `/orgs/[org]/repositories/[repo]/code` or `/orgs/[org]/repositories/[repo]/runs`.
4. User opens dispatch composer.
5. Krate assembles `AgentContextBundle` preview and permission review.
6. User confirms dispatch.
7. Krate creates `AgentDispatchRun` and `AgentDispatchAttempt` before Agent Mux launch.
8. Run appears in `/agents/runs` and repository Runs page.
9. If Agent Mux is configured, Krate launches and binds session/run IDs.
10. Run detail shows queued/running/completed/failed state, context digest, permission snapshot, event timeline, and linked session placeholder or chat panel.

## Included resources

Configuration:

- `AgentStack`;
- `AgentToolProfile`;
- `AgentServiceAccount`;
- `AgentRoleBinding`;
- `AgentSecretGrant` only for model provider token if required by deployment mode;
- `AgentConfigGrant` only if the selected tool/adapter needs non-secret config.

Execution:

- `AgentContextBundle`;
- `AgentDispatchRun`;
- `AgentDispatchAttempt`;
- `AgentCapabilityRequirement`;
- optional `AgentSession` projection if Agent Mux binds successfully;
- optional `AgentArtifact` for diagnosis summary.

## Included routes

Global:

- `/agents` overview;
- `/agents/stacks` minimal stack list/builder;
- `/agents/runs` dispatch list;
- `/agents/runs/[run]` run detail;
- `/agents/permissions` permission review panel.

Repository:

- `/orgs/[org]/repositories/[repo]/code` dispatch entry point;
- `/orgs/[org]/repositories/[repo]/runs` agent run rows beside pipeline/job rows;
- `/orgs/[org]/repositories/[repo]/settings/agents` minimal settings panel if sub-routes are available, otherwise embed in existing settings page.

API:

- generic resource API remains supported;
- `POST /api/agents/permissions/review`;
- `POST /api/agents/runs`;
- `GET /api/agents/runs`;
- `GET /api/agents/runs/:run`;
- `GET /api/agents/runs/:run/events` or watch equivalent.

## Explicitly deferred

- automatic trigger rules;
- issue/PR mention dispatch;
- write-back approvals and branch pushes;
- full Secret/ConfigMap grant wizard;
- subagent execution;
- workspace provisioning/rebase lifecycle;
- artifact write-back;
- retention jobs;
- full observability dashboards;
- broad chart feature gates beyond safe defaults;
- production MCP server management.

## MVP acceptance criteria

### Resource model

- Agent MVP kinds are in `src/resource-model.js` and `src/kubernetes-controller.js`.
- Generic `/api/controller/resources?kind=AgentStack` can list stacks.
- Agent resources render in advanced resource tables without custom UI hacks.

### Permission review

- Missing ServiceAccount blocks stack readiness.
- Missing role binding blocks stack readiness.
- Missing required Secret grant blocks stack readiness.
- Permission review response includes no Secret values.

### Manual dispatch

- Dispatch creates run and attempt before Agent Mux launch.
- Context bundle digest is attached to the attempt.
- Permission snapshot digest is attached to the attempt.
- Denied dispatch returns actionable policy/RBAC/grant reason.

### UI

- Code page shows dispatch entry point and disabled/missing-permission states.
- Runs page shows agent dispatch rows beside pipeline rows.
- Run detail shows source breadcrumbs, status, context, permission, and Agent Mux binding state.
- Empty states are server-projected through controller UI model.

### Agent Mux

- If gateway is unavailable, run remains failed/degraded with clear condition and Krate stays usable.
- If gateway is configured, run/session IDs are stored exactly once.
- Unsupported actions are disabled based on capability snapshot.

## MVP tests

Required minimum tests:

- resource schema test for `AgentStack` and `AgentDispatchRun`;
- permission review missing grant test;
- manual dispatch creates run/attempt/context test;
- Agent Mux unavailable fallback test;
- UI validation for Code dispatch entry and run detail empty/pending states;
- package validation for CRDs/examples.

## MVP non-negotiables

- No Secret values in browser, status, logs, prompt preview, or audit.
- No automatic writes to PRs, branches, checks, issues, or releases.
- No untrusted fork privileged ServiceAccount or Secret access.
- No UI-only permission checks for enabled actions.
- No Agent Mux state as source of truth for Krate repository resources.

## Org memory MVP slice

The org memory MVP is described in [Org memory vertical slice spec](./org-memory-vertical-slice-spec.md). It should be treated as the first coherent agent-memory build target: one org, one repository, one company brain repo, one manual dispatch with memory snapshot, and one summary-only run-memory import.

This slice is intentionally narrower than full agent orchestration. It excludes raw `.a5c` artifact retention, broad automation triggers, vector search, cross-org sharing, and advanced subagent orchestration.
