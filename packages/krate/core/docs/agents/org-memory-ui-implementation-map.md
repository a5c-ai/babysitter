# Org memory UI implementation map

## Purpose

This document maps the org-scoped company brain and agent memory requirements onto the current Krate web app seams. It is docs-only and should guide implementation without changing code yet.

## Current UI anchors

The app already has organization-first navigation and repository routes:

| Current file/route | Existing role |
| --- | --- |
| `apps/web/app/ui-shell.jsx` | shared app shell, org switcher, org navigation, repository navigation, `orgHref()` route helper. |
| `apps/web/app/orgs/page.jsx` | organization list. |
| `apps/web/app/orgs/[org]/page.jsx` | org dashboard. |
| `apps/web/app/orgs/[org]/repositories/page.jsx` | org repository list. |
| `apps/web/app/orgs/[org]/repositories/[repo]/code/page.jsx` | org-scoped code page. |
| `apps/web/app/orgs/[org]/repositories/[repo]/issues/page.jsx` | org-scoped issues page. |
| `apps/web/app/orgs/[org]/repositories/[repo]/pull-requests/page.jsx` | org-scoped reviews/PR page. |
| `apps/web/app/orgs/[org]/repositories/[repo]/runs/page.jsx` | org-scoped runs page. |
| `apps/web/app/orgs/[org]/repositories/[repo]/hooks/page.jsx` | org-scoped automations page. |
| `apps/web/app/orgs/[org]/repositories/[repo]/settings/page.jsx` | org-scoped repository settings. |
| `apps/web/app/orgs/[org]/deployments/page.jsx` | org-scoped deployment page. |
| `apps/web/app/orgs/[org]/runs/page.jsx` | org-level run center. |
| `apps/web/app/api/orgs/[org]/resources/*` | org-scoped resource API bridge. |

This means the future agent/memory work should extend the existing org route tree rather than introduce global `/agents` pages first.

## Missing routes to add later

| Route | Purpose | Primary resources |
| --- | --- | --- |
| `/orgs/[org]/agents` | org agent dashboard | stacks, runs, approvals, memory health. |
| `/orgs/[org]/agents/stacks` | stack registry and builder | `AgentStack`, tools, MCP, skills, subagents. |
| `/orgs/[org]/agents/runs` | all org agent dispatches | `AgentDispatchRun`, attempts, sessions. |
| `/orgs/[org]/agents/runs/[run]` | CI-like run detail with Agent Mux chat | run, attempt, session, context, artifacts. |
| `/orgs/[org]/agents/rules` | trigger management | `AgentTriggerRule`, executions. |
| `/orgs/[org]/agents/workspaces` | workspace/session/work item management | `AgentWorkspace`, links. |
| `/orgs/[org]/agents/memory` | company brain dashboard | memory repo, ontology, imports, updates. |
| `/orgs/[org]/agents/memory/graph` | graph browser | graph records and edges. |
| `/orgs/[org]/agents/memory/search` | grep/frontmatter search | memory query. |
| `/orgs/[org]/agents/memory/imports` | `.a5c` and session import review | `AgentRunMemoryImport`. |
| `/orgs/[org]/agents/memory/updates` | memory update PR/review queue | `AgentMemoryUpdate`. |
| `/orgs/[org]/agents/permissions` | RBAC/secret/config/memory grants | grants and capability requirements. |

Repository pages should link into these routes with the active org and repo preserved in query params or source refs.

## Navigation changes

Add an `Agents` top-level item to org navigation after `Runs` and before `Capacity`. The item should display attention counters for:

- running/failed agent dispatches;
- pending approvals;
- memory imports awaiting review;
- blocked stacks due to missing RBAC, secrets, config, or memory grants;
- stale memory ontology/index status.

The `Advanced` page should keep raw resource plans, but day-to-day agent and memory management belongs under `Agents`.

## Repository page integrations

| Repository tab | Agent/memory additions |
| --- | --- |
| Code | dispatch agent from path/ref; include company brain records associated with path/repo; memory source preview. |
| Issues | linked sessions/workspaces/runs; issue-trigger dispatch; related memory runbooks and retrospectives. |
| Pull requests | failed-check repair dispatch; review artifacts; related decisions/runbooks; memory update suggestions. |
| Runs | merge CI pipeline rows with agent dispatch rows; link to Agent Mux chat/session. |
| Hooks | trigger dry-run and webhook-to-agent rule preview. |
| Settings | `AgentMemorySource`, stack defaults, trigger rules, permissions, secret/config/memory grants. |

## Components to add later

| Component | Responsibility |
| --- | --- |
| `AgentDashboardPage` | org-level agent overview and attention cards. |
| `AgentRunDetailPage` | CI-like run timeline, Agent Mux chat, context, memory, artifacts. |
| `MemoryDashboardPage` | company brain health, current commit, ontology, imports, updates. |
| `MemoryGraphBrowser` | node/edge browsing with org-scoped permissions. |
| `MemorySearchPanel` | graph/frontmatter/grep queries with redaction and source preview. |
| `MemoryImportReviewPanel` | `.a5c` import diff, redaction, validation, approval, merge. |
| `OrgScopedResourceGuard` | validates org route params against resource labels/namespace before render. |
| `AgentPermissionReviewPanel` | explains missing RBAC, Secret, ConfigMap, memory, tool, skill grants. |

## API calls needed by UI

- `GET /api/orgs/[org]/resources` for generic resource tables.
- `GET /api/orgs/[org]/agents/summary` for attention counters.
- `POST /api/orgs/[org]/agents/dispatch` for manual dispatch.
- `GET /api/orgs/[org]/agents/runs/[run]` for run detail projection.
- `POST /api/orgs/[org]/agents/memory/query` for preview/search.
- `POST /api/orgs/[org]/agents/memory/import-babysitter-run` for run import.
- `POST /api/orgs/[org]/agents/memory/updates/[id]/approve` for review actions.
- `GET /api/watch/orgs/[org]/agentdispatchruns` for live run updates.

## UX acceptance criteria

- Agent and memory pages never render without an org route param.
- Legacy global agent routes redirect to org routes only when org is unambiguous.
- Every memory result shows source path, memory commit, digest, and permission status.
- Every imported `.a5c` run shows source run, session, retention tier, redaction status, validation report, and target memory PR.
- Repository pages link to org-scoped agent/memory routes without losing repo context.

## Implementation order

1. Add resource-model kinds and examples so generic resource tables can display agent/memory data.
2. Add org route shells for `/orgs/[org]/agents` and `/orgs/[org]/agents/memory` with empty states.
3. Add summary endpoints and attention counters.
4. Add repository dispatch affordances and memory association previews.
5. Add run detail with Agent Mux session panel.
6. Add memory query/search/graph views.
7. Add memory import review and update review flows.
8. Add live watch streams and notification counters.

Each step should preserve the existing org shell and advanced YAML panels.
