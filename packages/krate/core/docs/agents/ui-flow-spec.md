# Agent UI flow and state spec

## Purpose

This document translates the agent specs into concrete UI flows that fit the existing Krate app. Current UI facts:

- Repository routes are already organized under `/orgs/[org]/repositories/[repo]/code`, `/issues`, `/pull-requests`, `/runs`, `/hooks`, and `/settings`.
- `apps/web/app/ui-shell.jsx` centralizes most page rendering and favors GitHub-like repository pages with advanced YAML panels.
- `LiveWatchPanel` already consumes `/api/watch/orgs/[org]/*` streams.
- Existing pages emphasize disabled states backed by access checks and advanced plans hidden behind expandable panels.

Agent UI should extend this style instead of becoming a separate chat-only dashboard.

## Navigation additions

Global routes:

- `/agents`: operational overview.
- `/agents/stacks`: stack registry and builder.
- `/agents/runs`: dispatch queue.
- `/agents/runs/[run]`: run/session detail.
- `/agents/rules`: trigger rules and dry-run.
- `/agents/workspaces`: workspace inventory.
- `/agents/approvals`: approval inbox.
- `/agents/identities`: ServiceAccounts, users, teams, native RBAC projections.
- `/agents/secrets`: Secret/ConfigMap grants and consumers.
- `/agents/permissions`: role templates, RoleBindings, drift, and permission review.

Repository route extensions:

- `/orgs/[org]/repositories/[repo]/code`: add `Dispatch agent` button, selected paths, branch/ref, active workspace/session chips.
- `/orgs/[org]/repositories/[repo]/issues`: add agent-ready board/list, context labels, linked workspaces/sessions/runs.
- `/orgs/[org]/repositories/[repo]/pull-requests`: add diagnose/repair/review agents, patch artifacts, write-back approvals.
- `/orgs/[org]/repositories/[repo]/runs`: show `AgentDispatchRun` rows beside `Pipeline` and `Job` rows.
- `/orgs/[org]/repositories/[repo]/hooks`: show trigger matches, delivery replay, and rule evaluation.
- `/orgs/[org]/repositories/[repo]/settings/agents`: stack permissions, triggers, ServiceAccounts, grants, runner policy.

## Stack builder flow

1. Choose base agent and adapter.
2. Choose model/provider and prompt.
3. Select runtime ServiceAccount.
4. Select tool profile, MCP servers, skills, subagents, context labels.
5. Choose runner pool and workspace policy.
6. UI calls permission review.
7. UI shows capability requirements matrix.
8. User fixes missing RBAC/Secret/Config grants or removes capabilities.
9. UI previews resource YAML.
10. Save applies resources through controller API.

Required states:

- no adapters configured;
- adapter capability unavailable;
- ServiceAccount missing;
- role escalation denied;
- missing Secret grant;
- missing ConfigMap grant;
- Secret key missing;
- ConfigMap key sensitive/hidden;
- stack ready;
- stack ready but requires approval for selected sources.

## Secret grant wizard

Entry points:

- stack builder warning;
- tool profile page;
- skill detail page;
- MCP server page;
- `/agents/secrets`;
- denied dispatch explanation.

Flow:

1. Show requesting capability and why it needs the Secret.
2. Show selected runtime ServiceAccount and repository/ref scope.
3. Let authorized user select Secret/key metadata or create write-only key.
4. Select purpose, mount policy, trigger/ref scope, and approval requirement.
5. Preview `AgentSecretGrant` YAML and permission review result.
6. Apply grant and recompute stack readiness.

UI must never show Secret values after write.

## Config grant wizard

Flow mirrors Secret grant wizard, but ConfigMap values can be shown only when native RBAC permits and Krate sensitivity policy allows it. Otherwise show key names and metadata only.

## Permission review panel

Reusable panel for stack builder, trigger dry-run, dispatch composer, and denied run states.

Sections:

- actor and Kubernetes identity;
- runtime ServiceAccount and runner ServiceAccount;
- role checks;
- required Secrets and grants;
- required ConfigMaps and grants;
- trust-tier constraints;
- approval requirements;
- least-privilege suggested fixes;
- YAML preview for permitted fixes.

## Dispatch composer flow

On Code/Issue/PR/Pipeline pages:

1. User opens dispatch composer.
2. Source refs are prefilled from route context.
3. User chooses stack, task kind, context labels, paths/artifacts/logs, workspace mode.
4. UI calls permission review and context preview.
5. User confirms.
6. API creates `AgentDispatchRun` and `AgentDispatchAttempt` before Agent Mux launch.
7. UI navigates to run detail or keeps an inline status chip.

## Run detail flow

Layout should feel like a CI check page plus Agent Mux chat:

- Header: repository, source object, branch/SHA, stack, runner, ServiceAccounts, phase, approvals.
- Left: source context, logs/artifacts/files/context labels.
- Center: Agent Mux transcript and continuation composer.
- Right: attempts, event timeline, tools, MCP, skills, subagents, Secret/Config grants, approvals, artifacts.
- Footer: cancel/retry/resume/fork/continue controls when admitted.

States:

- queued;
- runner waiting;
- permission snapshot pending;
- Agent Mux session binding pending;
- stream disconnected/reconnecting;
- waiting for approval;
- workspace missing/rebase conflict;
- adapter launch rejected;
- succeeded/failed/cancelled.

## Repository settings agents tab

This page is the GitHub-like management hub for a repository:

- enabled stacks;
- allowed triggers;
- allowed runner pools;
- runtime ServiceAccounts;
- runner ServiceAccounts;
- Secret grants;
- ConfigMap grants;
- role bindings;
- dry-run permission review.

The page should show safe defaults first and advanced YAML only in expandable panels, matching current Krate UI conventions.

## Empty and denied states

Every action-disabled state must include:

- action attempted;
- resource involved;
- Kubernetes identity used;
- missing permission or policy reason;
- whether the user can fix it;
- link to permission review or relevant settings page.

## Integration with current app

Initial implementation can reuse:

- `apps/web/app/ui-shell.jsx` page patterns;
- `ResourceTable` for generic resource visibility;
- `PlanCard` for YAML previews;
- `LiveWatchPanel` for dispatch/watch streams;
- existing repository route wrappers in `apps/web/app/orgs/[org]/repositories/[repo]/*/page.jsx`.

Typed components should be introduced once the resource/controller contracts exist.

## Memory user flows

### Configure company brain

1. Admin opens `/agents/memory` and creates or adopts `AgentMemoryRepository`.
2. Krate validates layout and ontology.
3. Admin creates `AgentMemorySource` policies for repositories, teams, stacks, and triggers.
4. UI shows generated YAML, RBAC implications, and validation status.

### Dispatch with memory

1. User opens repository Code, Issue, PR, or Pipeline page.
2. User opens dispatch composer and expands Memory.
3. UI shows default memory source, current commit, query preview, and selected records/excerpts.
4. User optionally chooses explicit ref, snapshot tag, or `refAt` timestamp.
5. Krate resolves commit and creates `AgentMemorySnapshot` before launch.

### Review memory update

1. Agent proposes memory update from run detail.
2. UI shows diff, source run, evidence, ontology validation, secret scan, and owners.
3. Reviewer approves, requests changes, rejects, or merges.
4. Merge updates memory repo and links new commit to the source run.

## Org-scoped route migration flow

1. User opens `/orgs/[org]/repositories/[repo]/code`.
2. Server resolves visible repositories matching `[repo]`.
3. Krate stays within the explicit `/orgs/[org]` route and never resolves a repository without org context.
4. If multiple matches exist, show an org picker with visible org names only.
5. If no match exists, show a normal not-found state without leaking private orgs.

All dispatch composers, memory pages, deployment pages, and settings pages should use org-aware routes directly.
