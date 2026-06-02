# Agent Mux source map for Krate integration

Research source: local `C:\Users\tmusk\IdeaProjects\babysitter` checkout on `staging`, the public Babysitter GitHub URL provided in the request, and Krate's local CI/docs surfaces. This is an implementation source map, not an ontology mapping.

## Krate CI and release paths

### GitHub Actions workflow

- `.github/workflows/publish.yml`
  - Pull request and main/tag publish workflow.
  - `validate` job runs `npm ci`, `npm run check`, `npm pack --json`, and uploads npm package, dist/chart/example artifacts, UI standalone artifacts, and release checksums.
  - `publish-image` builds/pushes `ghcr.io/${{ github.repository }}/krate-controller` after validation.
  - `publish-chart` lints/packages `charts/krate`, uploads chart artifacts, and pushes chart OCI artifacts on version tags.

Agent orchestration implications:

- Failed `validate` checks need logs from `npm run check`, package output, dist artifacts, UI standalone output, and checksum generation context.
- Image/chart publish jobs need release-readiness review, artifact consistency checks, and privileged write-back guardrails.
- PR-triggered agent repairs should never publish images or charts.

### Package scripts used by CI

- `package.json`
  - `check`: full gate composed of build, docs validation, tests, E2E, package check, smoke, UI validation, and UI build.
  - `validate:docs`: docs coverage check.
  - `test`, `e2e`, `smoke`, `ui:validate`, `ui:build`, `package:check`: focused gates that can become agent task scopes.

Agent orchestration implications:

- `taskKind=diagnose` should identify which sub-gate failed.
- `taskKind=repair` should prefer focused reproduction before broader `npm run check`.
- Agent context should include the failed command, failing test or route, and generated artifacts.

## Krate docs and product requirements to preserve

- `docs/system-requirements.md`
  - CI jobs must run under scoped Kubernetes ServiceAccounts, not PATs.
  - Runner integration composes with ARC for MVP and leaves seams for Tekton or Buildkite Agent.
  - Webhook delivery uses durable queueing and HMAC signing.
  - Release candidates must prove install, repository creation, PR, CI, policy, and webhook delivery.
- `docs/components/runners-ci.md`
  - Defines `RunnerPool`, `Pipeline`, and `Job` as first-class resources.
  - Captures trust tiers, scoped identity, cache isolation, queue metrics, log streaming, rerun semantics, and failure signatures.
- `docs/components/hooks-events.md`
  - Separates Git hooks, outbound webhooks, and admission webhooks.
  - Provides durable delivery, retries, signing, replay, and policy visibility requirements.
- `docs/components/web-ui.md`
  - Requires repository, PR, pipeline, runner, hook, and settings navigation.
  - Requires Watch/SSE updates and YAML/kubectl transparency for mutations.
- `docs/user-stories.md`
  - PR review and CI status, live log streaming, similar-run failure search, runner pool configuration, and inbox triage are existing product expectations.

## Babysitter / Agent Mux paths

### Workspace and packages

- `package.json`
  - Declares `packages/agent-mux/*` workspaces.
  - Defines build/test scripts such as `build:agent-mux`, `test:agent-mux`, and web UI scripts.
- `packages/agent-mux/README.md`
  - High-level Agent Mux entrypoint.
- `packages/agent-mux/core/`
  - Agent/session domain contracts.
  - Important files:
    - `packages/agent-mux/core/src/types.ts`
    - `packages/agent-mux/core/src/session-manager.ts`
    - `packages/agent-mux/core/src/workspace-service.ts` if present in this branch; otherwise follow imports from `@a5c-ai/agent-mux-comm`.
- `packages/agent-mux/gateway/`
  - HTTP/WebSocket gateway and server-side run/session orchestration.
  - Important files:
    - `packages/agent-mux/gateway/src/server.ts`
    - `packages/agent-mux/gateway/src/runs/manager.ts`
    - `packages/agent-mux/gateway/src/runs/types.ts`
    - `packages/agent-mux/gateway/src/runs/session-runtime.ts`
    - `packages/agent-mux/gateway/src/runs/event-log.ts`
    - `packages/agent-mux/gateway/src/fanout/client-conn.ts`
    - `packages/agent-mux/gateway/src/fanout/subscriber.ts`
    - `packages/agent-mux/gateway/src/protocol/v1.ts`
    - `packages/agent-mux/gateway/src/protocol/frames.ts`
    - `packages/agent-mux/gateway/src/builtin-adapters.ts`
- `packages/agent-mux/gateway/src/kanban/`
  - Project, issue, workspace, automation, and dispatch surfaces closest to Krate's git-workspace domain.
  - Important files:
    - `packages/agent-mux/gateway/src/kanban/routes.ts`
    - `packages/agent-mux/gateway/src/kanban/lib/services/automation-rule-service.ts`
    - `packages/agent-mux/gateway/src/kanban/lib/services/automation-webhook-service.ts`
    - `packages/agent-mux/gateway/src/kanban/lib/services/dispatch-context-label-service.ts`
    - `packages/agent-mux/gateway/src/kanban/lib/services/run-query-service.ts`
    - `packages/agent-mux/gateway/src/kanban/lib/services/backlog-query-service.ts`
    - `packages/agent-mux/gateway/src/kanban/lib/review-service.ts`
    - `packages/agent-mux/gateway/src/kanban/lib/workspace-lifecycle.ts`
- `packages/agent-mux/webui/`
  - Product UI examples for sessions, dispatches, projects, issues, automations, workspaces, and inboxes.
  - Important files:
    - `packages/agent-mux/webui/src/router.tsx`
    - `packages/agent-mux/webui/src/pages/SessionDetailPage.tsx`
    - `packages/agent-mux/webui/src/pages/RunPage.tsx`
    - `packages/agent-mux/webui/src/pages/AgentsPage.tsx`
    - `packages/agent-mux/webui/src/pages/NewRunPage.tsx`
    - `packages/agent-mux/webui/src/pages/HookInboxPage.tsx`
    - `packages/agent-mux/webui/src/routes/AutomationsPage.tsx`
    - `packages/agent-mux/webui/src/routes/ProjectsPage.tsx`
    - `packages/agent-mux/webui/src/hooks/use-event-stream.ts`
    - `packages/agent-mux/webui/src/hooks/use-run-detail.ts`
    - `packages/agent-mux/webui/src/hooks/use-reviews.ts`
- `packages/agent-mux/cli/`
  - CLI flows for starting/listing/inspecting agent runs; useful as a non-UI fallback for Krate operations.
- `packages/agent-mux/adapters/`
  - Adapter layer for concrete agent runtimes.
- `packages/agent-mux/observability/`
  - Observability surfaces that can inform Krate run tracking.

## Researched Agent Mux route matrix

Current Babysitter `staging` exposes these Agent Mux Web UI routes from `packages/agent-mux/webui/src/router.tsx`. Krate should translate them into repository-centered pages instead of importing the route tree wholesale.

| Agent Mux route | Source component | Krate usage |
| --- | --- | --- |
| `/` -> `/projects` | router redirect | Krate home remains repository/org dashboard; agent summary can be a dashboard card. |
| `/agents` | `AgentsPage` | Global stack/adapter inventory and readiness summary. |
| `/sessions` | `SessionsPage` | Cross-repo session list, mostly secondary to dispatch/run pages. |
| `/sessions/new` | `NewRunPage` | Dispatch composer embedded in Code, Issues, PRs, and Pipelines. |
| `/sessions/pending/:runId` | `SessionPendingPage` | Pending handoff state for `AgentDispatchRun`. |
| `/dispatches/:runId` | `DispatchDetailPage` | Canonical CI-like dispatch run detail with Agent Mux chat. |
| `/runs/:runId` | `LegacyDispatchRouteRedirect` | Compatibility redirect only. |
| `/sessions/:sessionId` | `SessionDetailPage` | Chat/session tab inside dispatch/workspace pages. |
| `/sessions/:agent/:sessionId` | `LegacySessionRouteRedirect` | Compatibility redirect only. |
| `/pair-device` | `PairDevicePage` | Optional gateway auth/device-pairing administrative flow. |
| `/projects` | `ProjectsPage` | Repository/project issue board summary. |
| `/projects/:projectId/board` | `ProjectBoardPage` | Kanban board projection for work items and agent dispatch readiness. |
| `/projects/:projectId/list` | `ProjectListPage` | List/table projection for issues, sessions, workspaces, and runs. |
| `/projects/:projectId/issues/new` | `ProjectIssueCreatePage` | Issue/work-item creation with agent context labels. |
| `/projects/:projectId/issues/:issueId` | `ProjectIssuePage` | Issue hub with linked session/workspace/run graph. |
| `/projects/:projectId/workspaces/new` | `ProjectWorkspaceCreatePage` | Workspace provisioning from project/repository context. |
| `/projects/:projectId/issues/:issueId/workspace/new` | `IssueWorkspaceCreatePage` | Workspace provisioning from issue context. |
| `/issues/:issueId` | `IssueDetailPage` | Global issue deep link resolves into repository issue context. |
| `/dispatches` | `KanbanRunsPage` | Global dispatch queue and approval pressure. |
| `/runs` | `LegacyDispatchRouteRedirect` | Compatibility redirect only. |
| `/workspaces` | `KanbanWorkspacesPage` | Workspace inventory and attention mode. |
| `/workspaces/new` | `HostWorkspaceCreatePage` | Host/repository workspace provisioning. |
| `/inbox` | `KanbanInboxPage` | Approval, hook, review, and workspace attention inbox. |
| `/automations` | `AutomationsPage` | Trigger rule builder and execution history. |
| `/settings` | `KanbanSettingsPage` | Global policy/settings; repository settings stay under repo navigation. |
| `/legacy-home`, `/legacy-workspaces`, `/legacy-inbox`, `/legacy-settings` | legacy pages | Do not model as Krate product surface. |

## Researched Agent Mux gateway endpoint matrix

Current `packages/agent-mux/gateway/src/kanban/routes.ts` provides the closest server contracts to reuse or adapt.

| Endpoint/action | Agent Mux purpose | Krate equivalent |
| --- | --- | --- |
| `GET /api/backlog` | Load project, issue, workspace, session, PR, review, and board graph | Read repository work graph aggregated projection. |
| `POST /api/backlog` `move-issue` | Move work item across workflow states | Patch `WorkItem.status.workflowState`. |
| `POST /api/backlog` `link-repository` | Associate project with repository provider/repo | Link Krate repository resource to work graph. |
| `POST /api/backlog` `update-repository-settings` | Update branch/review/check integration settings | Patch repository agent integration settings. |
| `POST /api/backlog` `create-pull-request` | Create linked PR metadata | Create/link PR write-back artifact under approval. |
| `POST /api/backlog` `create-issue` | Create issue/work item | Create issue and initial context labels. |
| `POST /api/backlog` `update-project-collaboration` | Update visibility, roles, workspace provisioning policy | Patch project/repository agent collaboration policy. |
| `POST /api/backlog` `update-issue-detail` | Edit title, description, relations, labels, review metadata | Patch issue/work item and context-label associations. |
| `POST /api/backlog` `update-issue-dispatch-context-labels` | Attach context labels to dispatch prompt | Patch `WorkItem.contextLabelRefs`; snapshot into runs. |
| `POST /api/backlog` `create-sub-issue` / `link-child-issue` | Manage child work items | Maintain parent/child work graph edges. |
| `POST /api/backlog` `create-issue-workspace` / `link-issue-workspace` / `link-issue-session` | Associate issue with workspace/session | Maintain `WorkItemWorkspaceLink` and `WorkItemSessionLink`. |
| `GET/POST/PATCH/DELETE /api/task-tags` | Manage prompt/task tags | `AgentContextLabel` or lightweight task taxonomy. |
| `GET/POST/PATCH/DELETE /api/dispatch-context-labels` | Manage reusable prompt labels | `AgentContextLabel` CRD and validation status. |
| `GET/POST /api/reviews` | Query/apply review artifact actions | `AgentReviewArtifact` plus approval/write-back controller. |
| `GET/POST/PATCH/DELETE /api/automations` | Manage automation rules | `AgentTriggerRule` CRUD, lifecycle, execution summary. |
| `POST /api/automations/:ruleId/lifecycle` | Enable, pause, resume, disable | Patch `AgentTriggerRule.spec.lifecycleState`. |
| `POST /api/automations/webhooks/:ruleId` | Deliver rule-specific webhook | Durable `WebhookDelivery` then trigger evaluation. |
| `GET/POST /api/settings/agent-configuration` | Agent config settings | `AgentStack` and policy defaults. |
| `GET/POST /api/settings/mcp-servers` | MCP server settings | `AgentMcpServer` registry and health probes. |
| `GET/POST /api/workspaces` | Inventory and lifecycle actions | `AgentWorkspace` list and action subresource. |
| Workspace actions `provision`, `pin`, `unpin`, `archive`, `cleanup`, `recover`, `notes-save`, `rebase-*` | Git workspace lifecycle | Workspace controller action requests with policy admission. |
| `GET /api/digest` | Dashboard digest | Agent operations summary aggregated resource. |
| `GET /api/runs`, `GET /api/runs/:runId` | Run list/detail | `AgentDispatchRun` and attempts. |
| `GET /api/runs/:runId/events` | Run event timeline | Watch/SSE projection from Agent Mux event cursor. |
| `GET /api/runs/:runId/tasks/:effectId` | Task/effect detail | Tool/subagent/task event detail. |
| `POST /api/runs/:runId/tasks/:effectId/approve` | Approve pending effect | `AgentApproval` decision subresource. |
| `GET /api/stream` | Server-sent updates | Krate watch stream for runs, sessions, workspaces, rules, approvals. |

## Researched component source matrix

| Source file | Product lesson for Krate |
| --- | --- |
| `packages/agent-mux/webui/src/shell/CommandPalette.tsx` | Global actions must be generated from authorized route/resource actions. |
| `packages/agent-mux/webui/src/shell/Sidebar.tsx` | Navigation badges should count active sessions, running dispatches, and pending hooks/approvals from live store state. |
| `packages/agent-mux/webui/src/shell/TopBar.tsx` | Top context should distinguish session chat, dispatch handoff, workspace, automations, and connectivity. |
| `packages/agent-mux/webui/src/pages/KanbanPages.tsx` | Board/list/issue/workspace/dispatch pages can share one work graph but still expose route-specific focus. |
| `packages/agent-mux/webui/src/components/dashboard/backlog-overview.tsx` | Repository issue board is the association hub for issues, sessions, workspaces, PRs, review artifacts, and dispatch labels. |
| `packages/agent-mux/webui/src/components/runs/run-realtime-execution-panel.tsx` | Dispatch rows need live event buffers and session observability, not static logs only. |
| `packages/agent-mux/webui/src/components/sessions/session-workspace-shell.tsx` | Chat, workspace, runtime, and observability should live in a viewport-contained shell. |
| `packages/agent-mux/webui/src/components/sessions/session-conversation-surface.tsx` | Continuation, transcript, tags, costs, approval mode, files, and runtime hints are part of the session contract. |
| `packages/agent-mux/webui/src/components/sessions/session-observability-panel.tsx` | Run events should be normalized into timeline, artifacts, runtime links, editor links, and cost summaries. |
| `packages/agent-mux/webui/src/components/workspaces/workspace-provisioning-page.tsx` | Workspace creation must be guided by ownership source: project, issue, or host/repository. |
| `packages/agent-mux/webui/src/components/workspaces/workspace-detail-shell.tsx` | Workspace detail owns sessions/runs/issues/reviews/rebase state, not just filesystem path. |
| `packages/agent-mux/webui/src/components/workspaces/workspace-runtime-panel.tsx` | Runtime preview/dev server/terminal surfaces need explicit health and unavailable states. |
| `packages/agent-mux/webui/src/components/automations/automations-page.tsx` | Trigger rules need source metadata, priority, lifecycle, target options, summaries, and webhook forms. |
| `packages/agent-mux/webui/src/components/review/review-panel.tsx` | Review artifacts require queue state, decision, provider integration, comments, anchors, and write-back lifecycle. |
| `packages/agent-mux/webui/src/components/shared/execution-context-panel.tsx` | Context must be inspectable as source, command, cwd, prompt/input, environment, and artifact provenance. |

## Krate paths to extend later

### Domain model and controller

- `src/resource-model.js`
  - Add future resource definitions for `Agent`, `AgentRun`, `AgentRunAttempt`, `AgentContextBundle`, `AgentDispatchRule`, `AgentContextLabel`, and `AgentApproval`.
  - Existing adjacent resources include `Repository`, `PullRequest`, `Issue`, `Review`, `Pipeline`, `Job`, `RunnerPool`, `WebhookSubscription`, and `WebhookDelivery`.
- `src/api-controller.js`
  - Add dispatch APIs once resources exist.
- `src/kubernetes-resource-gateway.js`
  - Persist CRD-backed or aggregated resource operations.
- `src/kubernetes-controller.js`
  - Add reconciliation loops from Krate resources to Agent Mux gateway calls.
- `src/controller-client.js` and `src/controller-ui.js`
  - Add UI model projections for failed-check agent actions, run summaries, active sessions, trigger rules, context labels, approvals, and chat transcript state.
- `src/http-server.js`
  - Add server endpoints if the local server needs direct Agent Mux proxying outside Next route handlers.

### Existing product surfaces

- `src/gitea-backend.js`
  - Map repository events, issues, PRs, labels, mentions, and check states into Krate dispatch events.
- `src/hooks-events.js`
  - Extend webhook delivery/inspection with CI and agent dispatch events plus rule evaluations.
- `src/runners-ci.js`
  - Host agent execution as a runner workload type or adjacent execution queue.
- `src/web-ui.js`
  - Add excellent-flow descriptions for failed-check diagnosis, repair, chat, dispatch, run tracking, and rule-driven automation.

### Next.js app surfaces

- `apps/web/app/ui-shell.jsx`
  - Add navigation and route components for agents, dispatch rules, context labels, approvals, and chat views.
- `apps/web/app/orgs/[org]/repositories/[repo]/pull-requests/page.jsx`
  - Add PR review agents, failed-check diagnosis, patch artifacts, and approval-gated write-back.
- `apps/web/app/orgs/[org]/repositories/[repo]/runs/page.jsx`
  - Show agent execution runs alongside pipeline runs and expose failed-job agent actions.
- `apps/web/app/orgs/[org]/repositories/[repo]/code/page.jsx`
  - Add repository-level agent entry points such as `Ask agent`, `Run task`, and file/context attachments.
- `apps/web/app/orgs/[org]/repositories/[repo]/issues/page.jsx`
  - Add issue-based dispatch and label/mention rule previews.
- `apps/web/app/orgs/[org]/repositories/[repo]/hooks/page.jsx`
  - Configure repository automation rules and webhook-backed dispatch.
- `apps/web/app/orgs/[org]/repositories/[repo]/settings/page.jsx`
  - Configure repository-scoped agent policy, allowed agents, context labels, and runner placement.
- `apps/web/app/inbox/page.jsx`
  - Add cross-repository agent dispatch inbox and human approval queue.
- `apps/web/app/runners-ci/page.jsx`
  - Add agent execution hosting, queues, logs, and runner utilization.
- `apps/web/app/api/controller/route.js`
  - Include agent resources in controller snapshots.
- `apps/web/app/api/controller/resources/route.js`
  - Accept future agent resource creates/updates.
- `apps/web/app/api/watch/[[...resource]]/route.js`
  - Stream `AgentRun`, `AgentRunAttempt`, `AgentApproval`, and dispatch event updates.

### Cluster/package surfaces

- `charts/krate/crds/`
  - Add CRDs for low-cardinality agent configuration resources when implementation begins.
- `charts/krate/templates/`
  - Add Agent Mux gateway deployment/config or references to an external gateway.
- `docs/components/runners-ci.md`, `docs/components/hooks-events.md`, `docs/components/web-ui.md`
  - Later cross-link after implementation starts.

## Agent stack, tools, and trigger source map

Agent Mux has normalized adapter and configuration concepts that should inform Krate's future `AgentStack` resources.

### Adapter capabilities and run options

- `packages/agent-mux/core/src/capabilities.ts`
  - Defines normalized adapter capabilities: resume/fork, multi-turn, streaming, native tools, MCP, parallel tool calls, approval modes, runtime hooks, thinking, structured output, skills, AGENTS.md, subagent dispatch, parallel execution, stdin injection, multimodal input, plugins, and plugin formats.
- `packages/agent-mux/core/src/run-options.ts`
  - Defines launch-time options including prompts, cwd/workspace, model/provider, approval/tool options, invocation mode, MCP servers, and execution constraints.
- `packages/agent-mux/core/src/config-types.ts`
  - Defines unified agent config: model, provider, temperature, max tokens, allowed/denied commands, approval mode, MCP servers, skills, agents doc, env, and native agent config.

### MCP/plugin/skill management

- `packages/agent-mux/core/src/plugin-types.ts`
  - Defines installed plugins, plugin listings/details, install options, search/browse options, and supported agent/plugin formats.
- `packages/agent-mux/core/src/plugin-manager.ts`
- `packages/agent-mux/core/src/plugin-manager-impl.ts`
  - Defines the manager surface for listing/installing/updating plugins by agent.
- `packages/agent-mux/adapters/src/mcp-plugins.ts`
  - Shared MCP-server plugin helper for adapters that store MCP servers under `mcpServers`.
- `packages/agent-mux/skills/integrate-harness/SKILL.md`
  - Adapter checklist shows required capability audit, config schema, hook/plugin wiring, MCP support, session parsing, and tests.

### Claude Code and runtime hooks

- `packages/agent-mux/adapters/src/claude-adapter.ts`
  - Claude adapter surface for config, MCP plugin handling, spawn args, auth/session parsing, and capabilities.
- `packages/agent-mux/adapters/src/claude-code/runtime-hooks/`
  - Runtime hook config and socket server for surfacing hook/tool lifecycle events into Agent Mux.

### Trigger and work management

- `packages/agent-mux/core/src/automation.ts`
  - Automation rule model with timer/webhook triggers, target routing, task templates, lifecycle state, source metadata, and execution records.
- `packages/agent-mux/core/src/kanban.ts`
  - Work-management model: projects, issues, board columns/swimlanes, dependencies, decomposition, dispatch readiness, context labels, issue-workspace links, issue-session links, repository lifecycle, CI gates, review artifacts, workspace inventory, and workspace actions.
- `packages/agent-mux/gateway/src/kanban/lib/services/automation-rule-service.ts`
  - Rule lifecycle/query/create/update/delete and execution summary behavior.
- `packages/agent-mux/gateway/src/kanban/lib/services/automation-webhook-service.ts`
  - Incoming webhook materialization and delivery/execution behavior.
- `packages/agent-mux/gateway/src/kanban/lib/services/backlog-query-service.ts`
  - Issue creation/move/update, repository linking, dispatch context labels, workspace links, session links, child issues, and PR creation.
- `packages/agent-mux/gateway/src/kanban/lib/workspace-lifecycle.ts`
  - Workspace inventory and lifecycle actions such as pin, archive, cleanup, recover, notes, and rebase actions.
