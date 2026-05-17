# Krate Web Console Specification

> Exhaustive reference for the Krate web console.
> Source: `packages/krate/web/`
> Framework: Next.js 16 + React 19 (App Router)

---

## 1. Page Inventory (57 pages)

### 1.1 Top-Level Pages

| # | Route | File | Data Source | Purpose | Interactive Elements |
|---|-------|------|-------------|---------|---------------------|
| 1 | `/` | `page.jsx` | None | Landing/home page | Login CTA, org selector |
| 2 | `/login` | `login/page.jsx` | `listEnabledAuthProviders()` | Authentication login | Provider buttons (GitHub, SSO) |
| 3 | `/logout` | `logout/page.jsx` | None | Session logout | Auto-redirect to /login |
| 4 | `/orgs` | `orgs/page.jsx` | `fetchControllerUiModel()` | Organization list | Org cards, create org button |
| 5 | `/people` | `people/page.jsx` | `fetchControllerUiModel()` | People directory | User search, team filter |

### 1.2 Organization Dashboard (5 pages)

| # | Route | File | Data Source | Purpose | Interactive Elements |
|---|-------|------|-------------|---------|---------------------|
| 6 | `/orgs/[org]` | `orgs/[org]/page.jsx` | `uiModel.views.dashboard` | Org dashboard overview | Cards (repos, PRs, issues, runs), activity feed, quick actions |
| 7 | `/orgs/[org]/profile` | `orgs/[org]/profile/page.jsx` | `uiModel.identity` | User profile | Edit display name, email; linked identities |
| 8 | `/orgs/[org]/people` | `orgs/[org]/people/page.jsx` | `uiModel.identity.users` | Org members | Invite button, team assignment, role toggle |
| 9 | `/orgs/[org]/inbox` | `orgs/[org]/inbox/page.jsx` | `notifications.listNotifications()` | Notification inbox | Mark as read, filter by type, clear all |
| 10 | `/orgs/[org]/insights` | `orgs/[org]/insights/page.jsx` | `uiModel.metrics` | Analytics and insights | Time range selector, metric cards |

### 1.3 Ship (Repositories & Code) — 9 pages

| # | Route | File | Data Source | Purpose | Interactive Elements |
|---|-------|------|-------------|---------|---------------------|
| 11 | `/orgs/[org]/repositories` | `orgs/[org]/repositories/page.jsx` | `uiModel.views.dashboard.repositories` | Repository list | Create repo form, visibility filter, search |
| 12 | `/orgs/[org]/repositories/[repo]/code` | `repositories/[repo]/code/page.jsx` | `git-proxy` API | Code browser | File tree, branch selector, breadcrumb |
| 13 | `/orgs/[org]/repositories/[repo]/pull-requests` | `repositories/[repo]/pull-requests/page.jsx` | `uiModel resources PullRequest` | PR list | Status filter, create PR button |
| 14 | `/orgs/[org]/repositories/[repo]/issues` | `repositories/[repo]/issues/page.jsx` | `uiModel resources Issue` | Issue list | Label filter, assignee, new issue |
| 15 | `/orgs/[org]/repositories/[repo]/issues/[issue]` | `issues/[issue]/page.jsx` | Issue resource | Issue detail | Comment form, label editor, close/reopen |
| 16 | `/orgs/[org]/repositories/[repo]/hooks` | `repositories/[repo]/hooks/page.jsx` | `WebhookSubscription` | Webhook config | Add webhook form, delivery list, replay |
| 17 | `/orgs/[org]/repositories/[repo]/runs` | `repositories/[repo]/runs/page.jsx` | `AgentDispatchRun` filtered by repo | Repo agent runs | Run list, dispatch button, status filter |
| 18 | `/orgs/[org]/repositories/[repo]/settings` | `repositories/[repo]/settings/page.jsx` | Repository resource | Repo settings | Rename, visibility toggle, danger zone (delete) |
| 19 | `/orgs/[org]/runs` | `orgs/[org]/runs/page.jsx` | `uiModel.agents.runs` | All runs overview | Filter by stack, status, repository |

### 1.4 Manage (Access & Policy) — 8 pages

| # | Route | File | Data Source | Purpose | Interactive Elements |
|---|-------|------|-------------|---------|---------------------|
| 20 | `/orgs/[org]/access/permissions` | `access/permissions/page.jsx` | `uiModel.identity.permissions` | Permission management | Grant/revoke, subject selector, permission level |
| 21 | `/orgs/[org]/access/ssh-keys` | `access/ssh-keys/page.jsx` | `uiModel.identity.sshKeys` | SSH key management | Add key form, revoke button, scope filter |
| 22 | `/orgs/[org]/access/branch-protection` | `access/branch-protection/page.jsx` | `BranchProtection` resources | Branch rules | Ref pattern input, toggle required reviews |
| 23 | `/orgs/[org]/settings` | `orgs/[org]/settings/page.jsx` | Organization resource | Org settings | Display name, slug, namespace info, danger zone |
| 24 | `/orgs/[org]/settings/secrets` | `settings/secrets/page.jsx` | `/api/orgs/:org/secrets` | Secret management | Add secret form, delete, grant management |
| 25 | `/orgs/[org]/hooks-events` | `orgs/[org]/hooks-events/page.jsx` | `WebhookSubscription + Delivery` | Webhook events | Subscription list, delivery inspector, replay |
| 26 | `/orgs/[org]/deployments` | `orgs/[org]/deployments/page.jsx` | `uiModel.delivery` | Deployments | Application list, release history, health |
| 27 | `/orgs/[org]/runners-ci` | `orgs/[org]/runners-ci/page.jsx` | `RunnerPool + Pipeline + Job` | Runner pools & CI | Pool editor, pipeline list, job detail |

### 1.5 Agents — 24 pages

| # | Route | File | Data Source | Purpose | Interactive Elements |
|---|-------|------|-------------|---------|---------------------|
| 28 | `/orgs/[org]/agents` | `agents/page.jsx` | `uiModel.agents` | Agent overview | Stack count cards, active runs, pending approvals |
| 29 | `/orgs/[org]/agents/stacks` | `agents/stacks/page.jsx` | `uiModel.agents.stacks` | Stack list | Readiness indicators, create button |
| 30 | `/orgs/[org]/agents/stacks/new` | `agents/stacks/new/page.jsx` | `STACK_LAYERS, COMPOSITION_FACETS` | Create stack | Multi-step StackBuilder form |
| 31 | `/orgs/[org]/agents/stacks/[name]` | `agents/stacks/[name]/page.jsx` | AgentStack resource | Stack detail | Conditions list, capabilities graph, edit |
| 32 | `/orgs/[org]/agents/runs` | `agents/runs/page.jsx` | `uiModel.agents.runs` | Dispatch run list | Phase filter, repository filter, cost summary |
| 33 | `/orgs/[org]/agents/runs/[runId]` | `agents/runs/[runId]/page.jsx` | AgentDispatchRun + Attempt | Run detail | Attempt timeline, transcript, workspace link |
| 34 | `/orgs/[org]/agents/sessions` | `agents/sessions/page.jsx` | `uiModel.agents.sessions` | Session list | Active/completed filter, cost column |
| 35 | `/orgs/[org]/agents/sessions/[sessionId]` | `agents/sessions/[sessionId]/page.jsx` | AgentSession + Transcript | Session detail | SessionTabs: transcript, tools, cost, shell |
| 36 | `/orgs/[org]/agents/rules` | `agents/rules/page.jsx` | `uiModel.agents.rules` | Trigger rule list | Source type badges, enable/disable toggle |
| 37 | `/orgs/[org]/agents/rules/new` | `agents/rules/new/page.jsx` | Stack list for dropdown | Create trigger rule | TriggerRuleForm with source type selector |
| 38 | `/orgs/[org]/agents/rules/[ruleName]` | `agents/rules/[ruleName]/page.jsx` | AgentTriggerRule resource | Rule detail | Edit form, execution history |
| 39 | `/orgs/[org]/agents/approvals` | `agents/approvals/page.jsx` | `uiModel.agents.approvals` | Approval queue | Approve/Deny buttons, filter by action type |
| 40 | `/orgs/[org]/agents/workspaces` | `agents/workspaces/page.jsx` | `uiModel.agents.workspaces` | Workspace list | Phase badges, repository links |
| 41 | `/orgs/[org]/agents/workspaces/[workspaceId]` | `agents/workspaces/[workspaceId]/page.jsx` | KrateWorkspace resource | Workspace detail | Codespace launch, associations, run history |
| 42 | `/orgs/[org]/agents/settings` | `agents/settings/page.jsx` | Adapter + Provider + Gateway | Agent settings | Adapter config, provider forms, gateway URL |
| 43 | `/orgs/[org]/agents/projects` | `agents/projects/page.jsx` | `uiModel.agents.projects` | Project list | Create project, kanban toggle |
| 44 | `/orgs/[org]/agents/projects/[projectId]` | `agents/projects/[projectId]/page.jsx` | KrateProject resource | Project detail | Kanban board, issue list, settings |
| 45 | `/orgs/[org]/agents/projects/[projectId]/issues` | `projects/[projectId]/issues/page.jsx` | Issues filtered by project | Project issues | Filter, create issue |
| 46 | `/orgs/[org]/agents/projects/[projectId]/issues/[issue]` | `issues/[issue]/page.jsx` | Issue resource | Project issue detail | Comment, labels, assign |
| 47 | `/orgs/[org]/agents/memory` | `agents/memory/page.jsx` | `uiModel.agents.memoryRepositories` | Memory overview | Repository list, snapshot count |
| 48 | `/orgs/[org]/agents/memory/search` | `agents/memory/search/page.jsx` | Memory query API | Memory search | MemorySearchForm, results display |
| 49 | `/orgs/[org]/agents/memory/ontology` | `agents/memory/ontology/page.jsx` | AgentMemoryOntology | Ontology editor | MemoryOntologyEditor, node/edge kind editors |
| 50 | `/orgs/[org]/agents/memory/imports` | `agents/memory/imports/page.jsx` | `uiModel.agents.memoryImports` | Import list | Status badges, review button |
| 51 | `/orgs/[org]/agents/memory/imports/[importId]` | `agents/memory/imports/[importId]/page.jsx` | AgentRunMemoryImport | Import detail | MemoryImportReview, approve/reject |

### 1.6 External — 4 pages

| # | Route | File | Data Source | Purpose | Interactive Elements |
|---|-------|------|-------------|---------|---------------------|
| 52 | `/orgs/[org]/external` | `orgs/[org]/external/page.jsx` | ExternalBackendProvider list | External overview | Provider cards, add button |
| 53 | `/orgs/[org]/external/providers/new` | `external/providers/new/page.jsx` | Provider type list | Add provider | ExternalProviderWizard (multi-step) |
| 54 | `/orgs/[org]/external/sync` | `external/sync/page.jsx` | ExternalSyncState | Sync dashboard | ExternalSyncDashboard, trigger sync |
| 55 | `/orgs/[org]/external/conflicts` | `external/conflicts/page.jsx` | ExternalSyncConflict list | Conflict list | ExternalConflictResolver, strategy selector |

### 1.7 Observe & Tools — 4 pages

| # | Route | File | Data Source | Purpose | Interactive Elements |
|---|-------|------|-------------|---------|---------------------|
| 56 | `/orgs/[org]/api-docs` | `orgs/[org]/api-docs/page.jsx` | controllerEndpoints | API documentation | Endpoint list, try-it panel |
| 57 | `/orgs/[org]/controller-api` | `orgs/[org]/controller-api/page.jsx` | Full snapshot | Controller API explorer | ApiExplorer with request/response |
| 58 | `/orgs/[org]/advanced-plans` | `orgs/[org]/advanced-plans/page.jsx` | Resource YAML | Advanced plans | YAML editor, apply button |
| 59 | `/orgs/[org]/operations-install` | `orgs/[org]/operations-install/page.jsx` | uiModel.operations | Operations install guide | Copy commands, step indicators |

---

## 2. Component Library (56 components)

### 2.1 Agent Components

| # | Component | File | Props | State | API Calls | Key Behavior |
|---|-----------|------|-------|-------|-----------|--------------|
| 1 | ApprovalActions | `approval-actions.jsx` | `{ approval, org, onDecide }` | — | POST approvals/:name/decide | Approve/Deny buttons with reason modal |
| 2 | ApprovalModeToggle | `approval-mode-toggle.jsx` | `{ stack, onToggle }` | `useState(mode)` | — | Toggle between yolo/prompt/deny |
| 3 | DispatchButton | `dispatch-button.jsx` | `{ stack, repo, org, onDispatch }` | `useState(loading)` | POST agents/dispatch | One-click dispatch with loading state |
| 4 | RunActions | `run-actions.jsx` | `{ run, org }` | — | — | Retry, cancel, view workspace links |
| 5 | RuleActions | `rule-actions.jsx` | `{ rule, org }` | — | — | Edit, disable, delete trigger rule |
| 6 | StackActions | `stack-actions.jsx` | `{ stack, org }` | — | — | Edit, dispatch, delete stack |
| 7 | StackBuilder | `stack-builder.jsx` | `{ org, layers, onSave }` | Multi-step form state | POST resources | Multi-step agent stack creation wizard |
| 8 | StackBuilderGraph | `stack-builder-graph.jsx` | `{ stack, capabilities }` | — | — | Visual capability graph |
| 9 | SessionCost | `session-cost.jsx` | `{ session, transcript }` | — | — | Token count and cost display |
| 10 | SessionShell | `session-shell.jsx` | `{ sessionId, org }` | SSE subscription | SSE stream | Terminal-style live session viewer |
| 11 | SessionTabs | `session-tabs.jsx` | `{ session, transcript }` | `useState(activeTab)` | — | Tabbed: Transcript, Tools, Cost, Shell |
| 12 | ToolInspector | `tool-inspector.jsx` | `{ mcpServers, toolProfiles }` | — | — | MCP tool listing with status |
| 13 | TriggerRuleForm | `trigger-rule-form.jsx` | `{ org, stacks, onSave }` | Form state | POST resources | Source type selector, cron/webhook/comment/label fields |

### 2.2 Memory Components

| # | Component | File | Props | Key Behavior |
|---|-----------|------|-------|--------------|
| 14 | MemorySearchForm | `memory-search-form.jsx` | `{ org, onSearch }` | Mode selector (graph/grep/both), query input, kind filter, depth |
| 15 | MemoryOntologyEditor | `memory-ontology-editor.jsx` | `{ ontology, org }` | Node kind editor, edge kind editor, vocabulary |
| 16 | MemoryImportReview | `memory-import-review.jsx` | `{ importResource, org }` | Diff view, approve/reject buttons |

### 2.3 External Components

| # | Component | File | Props | Key Behavior |
|---|-----------|------|-------|--------------|
| 17 | ExternalConflictResolver | `external-conflict-resolver.jsx` | `{ conflict, org }` | Side-by-side diff, strategy buttons |
| 18 | ExternalProviderList | `external-provider-list.jsx` | `{ providers }` | Cards with status indicators |
| 19 | ExternalProviderWizard | `external-provider-wizard.jsx` | `{ org, onComplete }` | Multi-step: type → credentials → scope → confirm |
| 20 | ExternalSyncDashboard | `external-sync-dashboard.jsx` | `{ syncStates, org }` | Status overview with metrics |

### 2.4 Kanban Components

| # | Component | File | Props | Key Behavior |
|---|-----------|------|-------|--------------|
| 21 | KanbanCard | `kanban-card.jsx` | `{ item, onDragStart }` | Draggable card with issue/PR preview |
| 22 | KanbanColumn | `kanban-column.jsx` | `{ status, items, onDrop }` | Drop target column |
| 23 | KanbanEnhanced | `kanban-enhanced.jsx` | `{ project, issues }` | Full board with columns |
| 24 | KanbanFilters | `kanban-filters.jsx` | `{ onFilter }` | Label, assignee, repository filters |
| 25 | KanbanInteractive | `kanban-interactive.jsx` | `{ project, org }` | SSE-powered live kanban with drag-drop |

### 2.5 Workspace Components

| # | Component | File | Props | Key Behavior |
|---|-----------|------|-------|--------------|
| 26 | WorkspacePanel | `workspace-panel.jsx` | `{ workspace }` | Overview: phase, repo, branch, PVC |
| 27 | WorkspaceCodespace | `workspace-codespace.jsx` | `{ workspace, org }` | Launch/stop codespace, URL display |
| 28 | WorkspaceAssociations | `workspace-associations.jsx` | `{ workspace }` | Add/remove run, user, session links |
| 29 | WorkspaceRunHistory | `workspace-run-history.jsx` | `{ workspace, runs }` | Active runs, historical runs table |

### 2.6 Repository Components

| # | Component | File | Props | Key Behavior |
|---|-----------|------|-------|--------------|
| 30 | RepoCodeBrowser | `repo-code-browser.jsx` | `{ org, repo, branch }` | File tree + content viewer via git-proxy |
| 31 | RepoRuns | `repo-runs.jsx` | `{ runs, org }` | Filtered run list for a repository |
| 32 | PullRequestList | `pull-request-list.jsx` | `{ pullRequests, org }` | PR list with status indicators |
| 33 | IssueList | `issue-list.jsx` | `{ issues, org }` | Filterable issue list |
| 34 | IssueEditor | `issue-editor.jsx` | `{ issue, org }` | Rich issue create/edit form |
| 35 | WebhookManager | `webhook-manager.jsx` | `{ subscriptions, deliveries }` | CRUD webhooks, delivery inspector |

### 2.7 Global Components

| # | Component | File | Props | Key Behavior |
|---|-----------|------|-------|--------------|
| 36 | CommandPalette | `command-palette.jsx` | `{ org }` | Cmd+K / Ctrl+K; full-text search, quick nav |
| 37 | KeyboardShortcuts | `keyboard-shortcuts.jsx` | — | ? overlay; nav shortcuts, action shortcuts |
| 38 | GlobalSearch | `global-search.jsx` | `{ org }` | Full-text search across all resources |
| 39 | NotificationBell | `notification-bell.jsx` | `{ org }` | Badge with unread count, dropdown panel |
| 40 | ActivityFeed | `activity-feed.jsx` | `{ org, events }` | Time-grouped activity entries |
| 41 | HealthMonitor | `health-monitor.jsx` | `{ connection }` | System component status indicators |
| 42 | LiveUpdates | `live-updates.jsx` | `{ org, onEvent }` | SSE connection, auto-reconnect |
| 43 | ThemeRuntime | `theme-runtime.jsx` | — | Dark/light toggle, system preference detection |
| 44 | KrateLoading | `krate-loading.jsx` | `{ label? }` | Branded loading spinner |

### 2.8 Settings Components

| # | Component | File | Props | Key Behavior |
|---|-----------|------|-------|--------------|
| 45 | AgentSettingsForm | `agent-settings-form.jsx` | `{ org }` | Combined adapters + providers + gateway form |
| 46 | SettingsAdapters | `settings-adapters.jsx` | `{ adapters, org }` | Adapter CRUD |
| 47 | SettingsProviders | `settings-providers.jsx` | `{ providers, org }` | Provider CRUD |
| 48 | SettingsGateway | `settings-gateway.jsx` | `{ gateway, org }` | Gateway URL + feature flags |
| 49 | AppSettings | `app-settings.jsx` | `{ org }` | App-level settings |
| 50 | SecretManager | `secret-manager.jsx` | `{ org }` | Secret CRUD with masked values |
| 51 | RunnerPoolManager | `runner-pool-manager.jsx` | `{ pools, org }` | Pool sizing with warm/max sliders |
| 52 | UserProfile | `user-profile.jsx` | `{ user, org }` | Profile display and edit |

### 2.9 Utility Components

| # | Component | File | Props | Key Behavior |
|---|-----------|------|-------|--------------|
| 53 | ResourceActions | `resource-actions.jsx` | `{ resource, org }` | View/Edit/Delete menu |
| 54 | ResourceCrudActions | `resource-crud-actions.jsx` | `{ kind, org }` | Full CRUD buttons |
| 55 | CodeEditor | `code-editor.jsx` | `{ value, language, onChange }` | Syntax-highlighted editor |
| 56 | ApiExplorer | `api-explorer.jsx` | `{ endpoints }` | Interactive API testing |
| 57 | DeploymentPipeline | `deployment-pipeline.jsx` | `{ applications }` | Visual pipeline progress |

---

## 3. Data Flow Architecture

### 3.1 Fetch Pipeline

```
Page Component (Server Component)
    → loadKrateUi() / fetchControllerUiModel({ baseUrl, org })
        → HTTP GET /api/controller?org=<org>
            → createKrateHttpHandler matches route
                → createControllerUiModel(snapshot, { organization })
                    → Stale-while-revalidate cache (30s TTL)
    → Pass data as props to Client Components
```

### 3.2 Controller UI Model Shape

`createControllerUiModel()` produces:

```javascript
{
  product: 'Krate',
  status: 'ready' | 'degraded',
  namespace: 'krate-org-acme',
  platformNamespace: 'krate-system',
  org: { name, slug, displayName, namespace },
  orgs: [...],
  generatedAt: ISO timestamp,
  controller: { mode, endpoints, architecture, storage, connection, apiService, commands },
  metrics: { components, resources, events, users, teams, repositories, pullRequests, issues, projects, pipelines, ... },
  components: [...runtimeComponents],
  resources: [...KRATE_RESOURCES mapped with items],
  events: [...last 8 K8s events],
  delivery: { applications, runtime, capabilityCatalog },
  policyEngine: { mode, health, profiles, templates, bindings, violations },
  agents: { stacks, runs, rules, sessions, workspaces, approvals, adapters, providers, projects, gateway, transcripts, memoryRepositories, memorySnapshots, memoryImports },
  identity: { counts, providers, users, teams, invites, mappings, permissions, sshKeys, reconciliation },
  validation: [...healthChecks],
  views: { dashboard, pullRequestReview, failingRun, runnerPoolEditor, webhookInspector, triageView }
}
```

### 3.3 API Proxy Routes (Web)

| Route | Target | Method |
|-------|--------|--------|
| `/api/orgs` | Krate API | GET |
| `/api/orgs/[org]/repositories` | Resource CRUD | GET/POST |
| `/api/auth/[provider]` | OAuth redirect | GET |
| `/api/auth/callback/[provider]` | OAuth callback | GET |
| `/api/auth/logout` | Session destruction | POST |
| `/api/auth/delegated` | Delegated identity | GET |
| `/api/atlas/search` | Atlas graph search | POST |
| `/api/git-proxy` | Gitea tree/blob proxy | POST |
| `/api/watch/[...resource]` | SSE watch endpoint | GET |

---

## 4. Navigation Architecture

### 4.1 Navigation Groups

| Group | Icon | Pages | Section |
|-------|------|-------|---------|
| **Ship** | Code | Repositories, PRs, Issues, Code, Runs | Primary development |
| **Manage** | Settings | Permissions, SSH Keys, Branch Protection, Settings, Secrets, Deployments, Runners | Administration |
| **Agents** | Bot | Stacks, Runs, Sessions, Rules, Approvals, Workspaces, Projects, Memory | AI orchestration |
| **Observe** | Eye | Hooks & Events, Insights, Inbox, Health, API Docs | Monitoring |
| **External** | Link | Providers, Sync, Conflicts | Integration |

### 4.2 Command Palette

- Trigger: `Cmd+K` (macOS) / `Ctrl+K` (Windows/Linux)
- Features: full-text search across resources, quick page navigation, recent items
- Implementation: `command-palette.jsx`

### 4.3 Keyboard Shortcuts

- `?` — Show shortcut overlay
- `j/k` — Navigate items in lists
- `n` — New (context-dependent)
- `Escape` — Close modal/palette

---

## 5. Real-Time Updates

### 5.1 LiveUpdates Component

```jsx
// Connection lifecycle:
// 1. Connect to /api/orgs/:org/agents/events/stream
// 2. Receive {"type":"connected"} — mark as connected
// 3. Process {"type":"resource-change", kind, name, operation}
// 4. On disconnect: auto-reconnect with backoff
// 5. Receive {"type":"heartbeat"} every 30s — keepalive
```

### 5.2 SSE-Powered Components

| Component | SSE Usage |
|-----------|-----------|
| KanbanInteractive | Live card movement on issue/PR status changes |
| NotificationBell | Real-time unread count updates |
| ActivityFeed | New events prepended |
| SessionShell | Live transcript streaming |
| HealthMonitor | Connection status indicator |

---

## 6. Theme System

### 6.1 Implementation

- CSS custom properties for all colors
- Two theme sets: `light` and `dark`
- Applied via `data-theme` attribute on `<html>`
- ThemeRuntime component manages state

### 6.2 Persistence

```javascript
// Read: localStorage.getItem('krate-theme')
// Write: localStorage.setItem('krate-theme', theme)
// Default: window.matchMedia('(prefers-color-scheme: dark)').matches
// Auto-update: mediaQuery.addEventListener('change', handler)
```

---

## 7. Form Patterns

### 7.1 Multi-Step Forms

| Form | Steps | Source |
|------|-------|--------|
| StackBuilder | Model → Provider → Transport → Tools → Skills → Review | `stack-builder.jsx` |
| ExternalProviderWizard | Type → Credentials → Scope → Confirm | `external-provider-wizard.jsx` |
| TriggerRuleForm | Source Type → Config → Stack Selection → Review | `trigger-rule-form.jsx` |

### 7.2 Error Handling

- Inline field errors below inputs
- Toast notifications for operation failures (auto-dismiss)
- Error boundary component (`error.jsx`) for unhandled errors
- Form-level validation before submission

### 7.3 Loading States

- `KrateLoading` spinner for full-page loads
- Disabled buttons with spinner during submission
- Skeleton loading for list views
- Optimistic updates on create/edit (revert on failure)

---

## 8. Authentication Flow (Web)

### 8.1 Login Flow

```
/login → Click provider → /api/auth/[provider]
    → 302 to OAuth provider
    → User authorizes
    → /api/auth/callback/[provider]?code=...
    → Exchange code → Create session cookie
    → 302 to /orgs/[org]
```

### 8.2 Session Validation

- Cookie `krate_session` sent on every request
- Web API routes verify via `parseSessionCookie()`
- Invalid sessions: redirect to `/login`
- Logout: clear cookie with `Max-Age=0`, redirect to `/login`

---

## 9. Error Page

Source: `packages/krate/web/app/error.jsx`

- React Error Boundary component
- Displays error message and stack trace (dev mode)
- "Try Again" button to reset error state
- Falls back to minimal UI on catastrophic failure
