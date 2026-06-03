# @a5c-ai/kradle-web

Next.js 16 web console for the Kradle Kubernetes-native forge platform. Provides organization management, repository management, agent orchestration, external backend integration, and a live-updating dashboard.

## Development

```bash
npm run dev
```

Starts the Next.js development server with Turbopack (hot module reload). Requires `@a5c-ai/kradle-sdk` available in the monorepo workspace.

## Build

```bash
npm run build
```

Produces a standalone Next.js production build in `.next/standalone`.

## Architecture

- **Framework**: Next.js 16 with React 19
- **Bundler**: Turbopack (development), webpack (production)
- **Output**: `standalone` — self-contained deployment artifact
- **Styling**: Tailwind CSS via globals.css
- **Code editor**: CodeMirror 6 (YAML and JavaScript languages)
- **API layer**: `@a5c-ai/kradle-sdk` imported from the monorepo workspace
- **Data fetching**: Server Components + Route Handlers; client components use SWR-style polling or SSE

## Pages

### Top-level

| Route | Description |
|-------|-------------|
| `/` | Platform dashboard |
| `/login` | OAuth login page |
| `/logout` | Logout and session clear |
| `/people` | Platform-wide user list |

### Organization: `/orgs/[org]`

| Route | Description |
|-------|-------------|
| `/orgs/[org]` | Organization overview |
| `/orgs/[org]/profile` | Org profile and settings |
| `/orgs/[org]/people` | Org members and teams |
| `/orgs/[org]/repositories` | Repository list |
| `/orgs/[org]/repositories/[repo]/code` | Repository code browser |
| `/orgs/[org]/repositories/[repo]/issues` | Issue tracker |
| `/orgs/[org]/repositories/[repo]/pull-requests` | Pull request list |
| `/orgs/[org]/repositories/[repo]/runs` | CI pipeline runs |
| `/orgs/[org]/repositories/[repo]/hooks` | Webhook subscriptions |
| `/orgs/[org]/repositories/[repo]/settings` | Repository settings |
| `/orgs/[org]/runs` | All pipeline runs |
| `/orgs/[org]/runners-ci` | Runner pool management |
| `/orgs/[org]/deployments` | KubeVela application deployments |
| `/orgs/[org]/hooks-events` | Webhook delivery events |
| `/orgs/[org]/inbox` | Org notification inbox |
| `/orgs/[org]/insights` | Analytics and insights |
| `/orgs/[org]/controller-api` | Raw controller API explorer |
| `/orgs/[org]/operations-install` | Kradle installation wizard |
| `/orgs/[org]/settings` | Org-level settings |
| `/orgs/[org]/settings/secrets` | Secret grant management |
| `/orgs/[org]/access` | Access control (RBAC) |
| `/orgs/[org]/advanced-plans` | Advanced reconciliation plans |

### Agents: `/orgs/[org]/agents`

| Route | Description |
|-------|-------------|
| `/orgs/[org]/agents` | Agent orchestration overview |
| `/orgs/[org]/agents/stacks` | AgentStack list |
| `/orgs/[org]/agents/stacks/new` | Create new AgentStack |
| `/orgs/[org]/agents/stacks/[name]` | AgentStack detail with kanban |
| `/orgs/[org]/agents/runs` | AgentDispatchRun list |
| `/orgs/[org]/agents/runs/[runId]` | Run detail with live SSE updates |
| `/orgs/[org]/agents/sessions` | AgentSession list |
| `/orgs/[org]/agents/sessions/[sessionId]` | Session transcript and shell |
| `/orgs/[org]/agents/rules` | AgentTriggerRule list |
| `/orgs/[org]/agents/rules/new` | Create trigger rule |
| `/orgs/[org]/agents/rules/[ruleName]` | Trigger rule detail |
| `/orgs/[org]/agents/approvals` | AgentApproval queue |
| `/orgs/[org]/agents/memory` | Memory repository explorer |
| `/orgs/[org]/agents/projects` | KradleProject list |
| `/orgs/[org]/agents/workspaces` | KradleWorkspace list |
| `/orgs/[org]/agents/workspaces/[workspaceId]` | Workspace detail |
| `/orgs/[org]/agents/settings` | Agent settings (stacks, subagents, tools) |

### External backends: `/orgs/[org]/external`

| Route | Description |
|-------|-------------|
| `/orgs/[org]/external` | External provider dashboard |
| `/orgs/[org]/external/providers/new` | Add external provider wizard |
| `/orgs/[org]/external/sync` | Sync event log |
| `/orgs/[org]/external/conflicts` | Conflict resolution queue |

## Client Components

All interactive components are under `app/components/` and use the `'use client'` directive.

| Component | Description |
|-----------|-------------|
| `agent-settings-form.jsx` | Form for creating/editing agent settings (stacks, subagents, tool profiles, MCP servers) |
| `app-settings.jsx` | Application-level settings panel |
| `approval-actions.jsx` | Approve / reject actions for AgentApproval resources |
| `approval-mode-toggle.jsx` | Toggle between automatic and manual approval modes |
| `code-editor.jsx` | CodeMirror 6 editor (YAML/JS) with syntax highlighting |
| `dispatch-button.jsx` | One-click agent dispatch button |
| `external-conflict-resolver.jsx` | UI for reviewing and resolving external sync conflicts |
| `external-provider-list.jsx` | List of configured external backend providers |
| `external-provider-wizard.jsx` | Step-by-step wizard for adding external providers |
| `external-sync-dashboard.jsx` | Live sync event stream dashboard |
| `kanban-enhanced.jsx` | Kanban board for AgentStack runs (drag-and-drop columns) |
| `kanban-interactive.jsx` | Interactive kanban with card editing and SSE live updates |
| `live-updates.jsx` | SSE-powered live data update wrapper |
| `memory-import-review.jsx` | Review and approve memory import batches |
| `memory-ontology-editor.jsx` | Visual editor for agent memory ontologies |
| `memory-search-form.jsx` | Search form for agent memory queries |
| `resource-actions.jsx` | Generic CRUD action buttons for any Kradle resource |
| `resource-crud-actions.jsx` | Inline create/edit/delete form for resources |
| `rule-actions.jsx` | Enable/disable/delete actions for AgentTriggerRule |
| `run-actions.jsx` | Cancel/retry actions for AgentDispatchRun |
| `secret-manager.jsx` | Create and revoke AgentSecretGrant resources |
| `session-cost.jsx` | Display token cost and billing for an AgentSession |
| `session-shell.jsx` | Terminal-style session transcript viewer |
| `session-tabs.jsx` | Tab navigation for session detail views |
| `stack-actions.jsx` | Dispatch/edit/delete actions for an AgentStack |
| `stack-builder-graph.jsx` | Visual graph builder for agent stack composition |
| `stack-builder.jsx` | Form-based builder for AgentStack resources |
| `tool-inspector.jsx` | Inspect tool call history within a session |
| `trigger-rule-form.jsx` | Create/edit AgentTriggerRule (cron, webhook, comment, label) |
| `user-profile.jsx` | User profile card with identity mapping display |
| `workspace-panel.jsx` | Workspace volume and runtime status panel |

## API Route Handlers

All server-side API routes live under `app/api/`:

- `GET /api/controller` — proxied Kradle controller snapshot
- `GET /api/orgs` — Organization list
- `GET /api/orgs/[org]/repositories` — Repository list
- `POST /api/orgs/[org]/repositories` — Create repository
- `GET|DELETE /api/orgs/[org]/repositories/[name]` — Get or delete a repository
- `GET|POST /api/orgs/[org]/resources` — List or apply any resource kind
- `GET|DELETE /api/orgs/[org]/resources/[kind]/[name]` — Get or delete a resource
- `GET /api/orgs/[org]/profile` — Org profile
- `GET /api/orgs/[org]/secrets` — List secret grants
- `POST /api/orgs/[org]/secrets` — Create secret grant
- `DELETE /api/orgs/[org]/secrets/[name]` — Revoke secret grant
- `POST /api/orgs/[org]/agents/dispatch` — Dispatch an agent run
- `GET /api/orgs/[org]/agents/memory/query` — Query agent memory
- `POST /api/orgs/[org]/agents/runs/[name]/cancel` — Cancel a run
- `POST /api/orgs/[org]/external/sync` — Trigger external sync
- `POST /api/orgs/[org]/external/conflicts/[id]/resolve` — Resolve a conflict
- `POST /api/orgs/[org]/external/write-intents/[name]/approve` — Approve a write intent
- `POST /api/orgs/[org]/external/write-intents/[name]/cancel` — Cancel a write intent
- `GET /api/orgs/[org]/policies` — List policies
- `GET /api/orgs/[org]/policy-exception-requests` — List policy exception requests
- `GET /api/orgs/[org]/policy-reports` — List policy reports
- `GET /api/atlas/search` — Atlas graph search
- `GET /api/watch/[[...resource]]` — Server-Sent Events watch stream
- `GET /api/auth/[provider]` — OAuth redirect
- `GET /api/auth/callback/[provider]` — OAuth callback
- `GET /api/auth/delegated` — Delegated auth header extraction
- `POST /api/auth/logout` — Session clear
- `GET /api/git-proxy` — Gitea proxy for code browser

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `KRADLE_CONTROLLER_URL` | — | URL of a remote Kradle controller API |
| `KRADLE_CONTROLLER_REQUEST_TIMEOUT_MS` | `5000` | Timeout for web-to-controller API proxy requests |
| `KRADLE_NAMESPACE` | `kradle-system` | Kubernetes namespace for the control plane |
| `KRADLE_ORG` | `default` | Default organization slug |
| `KRADLE_ADMIN_ORG` | — | Admin organization slug |
| `KRADLE_KUBECTL` | `kubectl` | Path to kubectl binary |
| `KRADLE_KUBECTL_TIMEOUT_MS` | `3000` | kubectl timeout in milliseconds |
| `KRADLE_SNAPSHOT_CACHE_TTL_MS` | `10000` | Snapshot cache TTL in milliseconds |
| `KRADLE_SESSION_SECRET` | — | HMAC secret for session cookie signing |
| `KRADLE_AUTH_PROVIDERS` | — | JSON array of enabled auth provider configs |
| `KRADLE_GITEA_URL` | — | Base URL for the Gitea git backend |
| `KRADLE_GITEA_TOKEN` | — | Admin token for Gitea API access |
| `KRADLE_KYVERNO_ENABLED` | — | Set to `true` to enable Kyverno discovery |
| `NEXT_PUBLIC_APP_URL` | — | Public base URL (used for OAuth redirects) |

## Playwright E2E

The Playwright suite lives in `packages/kradle/web/e2e`, matching
`playwright.config.js`.

| Variable | Description |
|----------|-------------|
| `KRADLE_E2E_URL` | Base URL for staging or another running Kradle web instance. When unset, Playwright starts `npm run dev`. |
| `KRADLE_E2E_ORG` | Organization slug for org-scoped tests. Defaults to `default`. |
| `KRADLE_E2E_AUTH_STATE` | Optional Playwright storage state JSON for signed staging sessions. |
| `KRADLE_E2E_ENABLE_MUTATING_STAGING` | Set to `1` to run shared-staging CRUD tests. Tests use `issue-609-e2e` names and exact cleanup only. |
| `KRADLE_E2E_ENABLE_SERVICE_FLOWS` | Set to `1` after #608-backed assistant, playground, and Agent Mux services are configured. |
| `KRADLE_E2E_ENABLE_MUTATING_LOCAL` | Optional local override for CRUD tests when running against a local dev server. |
