# Gaps: Agent Mux Experiences → Kradle CRDs & UI

Status: Draft for review
Date: 2026-05-11

This document maps proven agent-mux UI/webui/core patterns to kradle CRDs and UI experiences. Each section identifies what exists in agent-mux, what kradle already has, and what's missing.

---

## 1. Transport & Adapter Layer

### What agent-mux has
Three adapter types form a discriminated union:
- **SubprocessAdapter** — spawn CLI processes (Claude Code, Codex, Gemini CLI, etc.)
- **RemoteAdapter** — HTTP/WebSocket/Unix socket connections to remote backends
- **ProgrammaticAdapter** — direct SDK integration via async iterables

Each adapter declares capabilities (resume, fork, streaming, thinking, tools) and supports different connection types (HttpConnection, WebSocketConnection).

### What kradle has
- `AgentStack.spec.adapter` — string field (adapter ID)
- `AgentStack.spec.baseAgent` — enum of known agents
- `agent-mux-client.js` — thin stub with `isAvailable()`, `launchSession()`

### Gaps → New CRDs

| CRD | Purpose | Fields |
|-----|---------|--------|
| **AgentAdapter** | First-class adapter definition with transport type and capabilities | `spec.adapterType` (subprocess/remote/programmatic), `spec.transport` (http/websocket/unix/stdio), `spec.capabilities` (resume, fork, streaming, thinking, tools, models), `spec.authType` (token/oauth/none), `spec.installationMethod` (npm/binary/docker/remote), `spec.healthEndpoint` |
| **AgentTransportBinding** | Connection configuration for a specific adapter instance | `spec.adapterRef`, `spec.endpoint`, `spec.protocol` (http/ws/grpc/unix), `spec.authSecretRef`, `spec.healthCheck` (interval, timeout), `spec.reconnectPolicy` (backoff, maxRetries), `status.connected`, `status.lastHealthCheck` |
| **AgentProviderConfig** | Model provider configuration (Anthropic, OpenAI, Bedrock, etc.) | `spec.provider`, `spec.apiBase`, `spec.authType`, `spec.defaultModel`, `spec.modelTranslations` (canonical → provider-specific), `spec.rateLimits`, `spec.secretRef` |

### UI impact
Stack builder should let users pick adapter type, configure transport, test connectivity, and select models — not just type an adapter string.

---

## 2. Session & Chat Experience

### What agent-mux has
- **SessionWorkspaceShell** — 4-panel resizable layout (workspace, chat, execution trace, runtime)
- **SessionConversationSurface** — chat-like interface with human/agent turns
- **SessionFlowView** — 3-mode visualization (flow lanes, transcript, files)
- **Multi-lane agent flow** — parallel runs visualized as swimlanes
- **File-attention tracking** — which files each run reads/writes/touches
- **Cost tracking** — per-session USD with token breakdown
- **Session forking** — branch conversation to different agent mid-flight
- **Transcript pagination** — load last 60 messages, paginate further
- **Keyboard shortcuts** — Shift+W/C/X/D to toggle panels
- **Attachments** — drag-drop files into compose box
- **Model picker** — inline model switching in compose
- **Agent picker** — switch agents creating forked session
- **Approval mode toggle** — yolo/prompt/deny per session

### What kradle has
- `AgentSession` resource (metadata only — mux session ID, dispatch run ref)
- Basic `/agents/runs` list page (table of dispatch runs)
- No chat interface, no session detail, no flow visualization

### Gaps → New CRDs + UI

| CRD | Purpose |
|-----|---------|
| **AgentSessionTranscript** (aggregated) | Durable transcript with message nodes (user/assistant/tool/thinking/error), pagination support, cost per turn |
| **AgentSessionAttachment** (aggregated) | File attached to a session message — source (file/url/base64), mimeType, digest, redaction status |

| UI Route | Experience |
|----------|------------|
| `/agents/sessions/:id` | Full session detail: 4-panel layout adapted from SessionWorkspaceShell (workspace files, chat transcript, execution flow, runtime details) |
| `/agents/sessions/:id/flow` | Multi-lane flow visualization showing parallel runs as swimlanes |
| `/agents/sessions/:id/files` | File-attention view showing which files were read/written/touched |
| Chat compose in session detail | Input bar with agent picker, model picker, approval mode toggle, attachment drag-drop |

---

## 3. Kanban & Issue Tracking

### What agent-mux has
- **BacklogOverview** (240KB) — full kanban board with swimlanes, workflow columns, WIP limits
- **KanbanIssue** — issues with status (backlog/ready/in-progress/blocked/review/done), priority, assignees, dependencies, acceptance criteria
- **KanbanBoardCard** — cards with repo integration, PR links, blocked state
- **Issue-to-workspace linking** — issues linked to workspaces and sessions
- **Repository integration** — link to GitHub/Azure/GitLab/Bitbucket
- **Dispatch context labels** — instruction fragments attached to issues for agent context
- **Task tags** — custom categorization

### What kradle has
- `Issue` and `PullRequest` resources (aggregated, basic spec)
- `WorkItemSessionLink` and `WorkItemWorkspaceLink` — associations
- No kanban UI, no board view

### Gaps → New CRDs + UI

| CRD | Purpose |
|-----|---------|
| **AgentWorkflow** (config) | Workflow definition with states (todo/in-progress/review/done), transitions, WIP limits per state |
| **AgentProject** (config) | Project grouping issues with board config, default workflow, team refs |
| **AgentIssueDispatchContext** (config) | Reviewed dispatch instructions attached to an issue — prompt fragment, scope, allowed stacks |

| UI Route | Experience |
|----------|------------|
| `/agents/projects` | Project list with health cards |
| `/agents/projects/:id/board` | Kanban board with drag-drop, swimlanes, workflow columns |
| `/agents/projects/:id/issues/:id` | Issue detail with linked sessions, workspaces, PRs, acceptance criteria |

---

## 4. Workspace Lifecycle

### What agent-mux has
- **WorkspaceService** — create/archive/cleanup/recover workspaces
- **Git worktree lifecycle** — branch creation, commit tracking, rebase support
- **Workspace runtime surfaces** — preview URL, terminal, dev server, rebase status
- **WorkspaceDetailShell** — file explorer, console output, environment variables
- **WorkspaceProvisioningPage** — git repo + environment setup flow
- **Session binding** — workspaces bound to sessions with status tracking

### What kradle has
- `AgentWorkspace` resource (basic spec: repository, workspacePath, ownership)
- `AgentWorkspacePolicy` (config: mode, retention)
- No workspace UI beyond the list page

### Gaps → New CRDs + UI

| CRD | Purpose |
|-----|---------|
| **AgentWorkspaceRuntime** (aggregated) | Runtime surface state — cwd, env vars, process status, preview URL, terminal streams |
| **AgentWorkspaceRepo** (aggregated) | Git metadata per repo in workspace — branch, head commit, remote, dirty state |

| UI Route | Experience |
|----------|------------|
| `/agents/workspaces/:id` | Workspace detail: file explorer tree, console output stream, env vars, git status |
| `/agents/workspaces/new` | Provisioning flow: select repo, branch, workspace policy, launch |

---

## 5. Approval & Hook Inbox

### What agent-mux has
- **HookInboxScreen** — approval inbox with pending requests
- **HookApprovalPrompt** — countdown timer, tool preview, allow/deny actions
- **BreakpointPanel** — pulsing indicator, attached file preview
- **FilePreview** — syntax-highlighted context files in breakpoint

### What kradle has
- `AgentApproval` resource (basic spec: dispatchRun, action, requestedBy)
- `/agents/approvals` list in the agent view
- No approval inbox UI, no interactive approval flow

### Gaps → UI

| UI Route | Experience |
|----------|------------|
| `/agents/approvals` (enhanced) | Interactive inbox: pending approvals with countdown, tool preview, context files, allow/deny/delegate actions |
| Approval detail in session | Inline approval UI in session view when breakpoint/hook fires |

---

## 6. Automations & Triggers

### What agent-mux has
- **AutomationsPage** — rules with timer (cron) and webhook triggers
- **Templates** — issue/task templates for automated creation
- **Execution history** — per-rule run history

### What kradle has
- `AgentTriggerRule` resource (sources, agentStack, taskKind)
- `AgentTriggerExecution` (evaluation record)
- No automation UI beyond the rules list

### Gaps → UI

| UI Route | Experience |
|----------|------------|
| `/agents/rules/:name` | Rule detail: trigger config, execution history, delivery status, dry-run testing |
| `/agents/rules/new` | Rule builder: source picker (CI/webhook/comment/label/schedule/manual), stack selection, condition editor |

---

## 7. Execution Observability

### What agent-mux has
- **TaskDetailPanel** — multi-tab inspector (Agent/Timing/Logs/Data/Breakpoint tabs)
- **PipelineView** — DAG visualization of task flow
- **LogViewer** — streaming console with search and scroll-lock
- **JsonTree** — recursive JSON explorer with categorization
- **ParallelGroup** — grouped parallel tasks with timing heuristics
- **VirtualizedRunList** — efficient rendering for 100s of runs
- **CostMeter** — per-session and per-run USD display
- **TimingPanel** — duration metrics, critical path analysis

### What kradle has
- `/agents/runs` basic table with name, stack, status
- No task detail, no logs, no execution flow

### Gaps → UI

| UI Route | Experience |
|----------|------------|
| `/agents/runs/:id` | Run detail: task execution flow (DAG), timing, cost, linked session, context bundle, permission snapshot |
| `/agents/runs/:id/tasks/:effectId` | Task inspector: agent prompt, timing, logs (streaming), data (JSON tree), breakpoint approval |

---

## 8. Configuration & Settings

### What agent-mux has
- **SettingsModal** — theme, gateway config
- **Gateway configuration** — URL, auth token, auto-reconnect
- **Agent registry** — capabilities matrix per agent

### What kradle has
- Helm `values.yaml` with `agents.enabled` and `agents.agentMux.gateway`
- No runtime settings UI

### Gaps → New CRDs

| CRD | Purpose |
|-----|---------|
| **AgentGatewayConfig** (config) | Runtime Agent Mux gateway connection settings — URL, auth, reconnect policy, feature flags |

---

## 9. Event Streaming Infrastructure

### What agent-mux has
- **WebSocket** client with reconnect, subscription fan-out, backpressure
- **SSE** (Server-Sent Events) with batched updates and debouncing
- **Smart polling** with backoff (shorter when fresh, longer when stale)
- **EventBuffer** — sorted sequence numbers for correct replay on reconnect
- **67 structured event types** across 18 categories

### What kradle has
- `/api/watch/orgs/:org/*` — SSE endpoint (existing, non-agent)
- No agent-specific event streaming

### Gaps → Infrastructure

| Component | Purpose |
|-----------|---------|
| Agent event SSE channel | Extend existing watch endpoint with agent event types (dispatch status, session events, approval requests) |
| Event replay on reconnect | Buffer agent events with sequence numbers for catch-up |

---

## 10. Tool Rendering & Extensibility

### What agent-mux has
- **Extensible tool renderer registry** — `registerToolCallRenderer()` + `resolveToolCallRenderer()`
- **Built-in renderers** for 8 tools (bash, read, write, edit, glob, grep, web-fetch, web-search)
- **3 display modes** per renderer: compact, expanded, approvalPreview
- **MCP tool rendering** — separate card type for MCP-originated tools

### What kradle has
- Nothing — no tool rendering

### Gaps → UI Infrastructure

The kradle web console will need a tool rendering system when session detail views are built. This can import from `@a5c-ai/agent-mux-ui` or replicate the registry pattern.

---

## Summary: New CRDs to Add

### CONFIG_KINDS (etcd) — 5 new
1. **AgentAdapter** — adapter definition with transport and capabilities
2. **AgentTransportBinding** — connection config for adapter instance
3. **AgentProviderConfig** — model provider (Anthropic, OpenAI, etc.)
4. **AgentProject** — project grouping with board config
5. **AgentGatewayConfig** — runtime Agent Mux gateway settings

### AGGREGATED_KINDS (postgres) — 3 new
6. **AgentSessionTranscript** — durable chat transcript with pagination
7. **AgentSessionAttachment** — files attached to session messages
8. **AgentWorkspaceRuntime** — workspace runtime surface state

### CONFIG_KINDS (existing, to enrich)
- **AgentStack** — expand with adapter ref (instead of string), provider config ref, transport binding ref
- **AgentTriggerRule** — add cron schedule support, webhook template

---

## Summary: UI Experiences to Build

### Phase 1 (next implementation)
1. Session detail with chat transcript (core experience)
2. Run detail with task flow visualization
3. Enhanced approval inbox

### Phase 2
4. Kanban board for issues/projects
5. Workspace detail with file explorer
6. Rule builder with trigger source picker

### Phase 3
7. Multi-lane flow visualization
8. Tool rendering registry
9. Settings/gateway configuration UI
