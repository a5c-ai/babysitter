# Tula UI Extraction & App Scaffolding Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract reusable agentic UI components from kradle-web into tula/ui shared library, create tula/web-app (replacing webui), and scaffold tula/desktop-app (Electron) — achieving zero duplication of chat views, tool call renderers, kanban boards, workspace management, and other agentic UI between kradle-web and tula apps.

**Architecture:** Three-layer approach: (1) Extract ~40 generic agentic React components from kradle-web into `packages/tula/ui/src/components/` as framework-agnostic exports, (2) Replace `packages/adapters/webui/` with `packages/tula/web-app/` using Vite + React Router + tula-ui, (3) Scaffold `packages/tula/desktop-app/` as Electron wrapper around the same tula-ui components. Kradle-web retains kradle-specific components (inference, external providers, settings) but imports shared agentic components from `@a5c-ai/tula-ui`.

**Tech Stack:** React 19, Vite, React Router v6, Electron 36, TypeScript, `@a5c-ai/tula-ui` as the shared component library.

---

## Audit Findings

### What exists today

| Package | Location | Build | Components | Purpose |
|---------|----------|-------|------------|---------|
| `@a5c-ai/tula-ui` | `packages/tula/ui/` | TS | 90 files | Cross-platform React primitives, session-flow, gateway client, event cards |
| `@a5c-ai/tula-webui` | `packages/tula/webui/` | Vite | 76 files | Browser SPA for adapters gateway control |
| `@a5c-ai/tula-tui` | `packages/tula/tui/` | TS+Ink | 50 files | Terminal UI |
| `@a5c-ai/kradle-web` | `packages/kradle/web/` | Next.js | 103 files | Kubernetes forge console |

### Component overlap (kradle-web ↔ tula-ui/tula-webui)

| Domain | Kradle Components | Tula Equivalent | Action |
|--------|-------------------|-----------------|--------|
| Chat/assistant | assistant-chat, assistant-chat-messages | SessionConversationSurface, EventCards | **Extract kradle → tula/ui** (kradle has richer message rendering) |
| Tool call rendering | tool-inspector | ToolCallCard, ToolResultCard | **Keep tula/ui** (already well-structured), extend with kradle's inspector |
| Session management | session-shell, session-cost, session-tabs | SessionFlowView, SessionObservabilityPanel | **Merge** — tula has realtime, kradle has CRD lifecycle |
| Kanban boards | kanban-enhanced, kanban-card, kanban-column, kanban-filters | KanbanLayout (webui) | **Extract kradle → tula/ui** (kradle is more complete) |
| Workspace | workspace-panel, workspace-associations, workspace-codespace | WorkspaceDetailShell, WorkspacesPage | **Extract kradle → tula/ui** |
| Dispatch/run | dispatch-button, run-actions, approval-actions | RunCard, RunList | **Merge** — both have pieces |
| Command palette | command-palette | - | **Extract to tula/ui** (remove next/navigation dep) |
| Confirm dialog | confirm-dialog | - | **Extract to tula/ui** |
| Pagination | pagination | PaginationControls | **Keep tula-webui's**, extract to tula/ui |
| Search | global-search | GlobalSearch (webui) | **Keep tula-webui's**, extract to tula/ui |
| Code editor | code-editor (CodeMirror) | - | **Keep in kradle** (forge-specific) |
| Inference/model | inference-*, model-route-*, virtual-model-* | - | **Keep in kradle** (forge-specific) |
| External providers | external-* | - | **Keep in kradle** (forge-specific) |
| Jitsi meetings | jitsi-* | - | **Keep in kradle** (forge-specific) |
| Settings | settings-*, app-settings | SettingsPage (webui) | **Both keep their own** (different domains) |
| Agent identity | agent-directory, agent-profile-*, agent-persona-*, agent-soul-*, agent-appearance-*, agent-voice-* | - | **Extract to tula/ui** (identity is cross-platform) |

### Components to extract from kradle → tula/ui (~35 files)

**Agentic core (from `components/agent/`):**
- dispatch-button.jsx → `tula/ui/src/components/Agent/DispatchButton.tsx`
- run-actions.jsx → `tula/ui/src/components/Agent/RunActions.tsx`
- approval-actions.jsx → `tula/ui/src/components/Agent/ApprovalActions.tsx`
- approval-mode-toggle.jsx → `tula/ui/src/components/Agent/ApprovalModeToggle.tsx`
- session-shell.jsx → `tula/ui/src/components/Session/SessionShell.tsx`
- session-cost.jsx → `tula/ui/src/components/Session/SessionCost.tsx`
- session-tabs.jsx → `tula/ui/src/components/Session/SessionTabs.tsx`
- stack-builder.jsx → `tula/ui/src/components/Agent/StackBuilder.tsx`
- agent-directory.jsx → `tula/ui/src/components/Agent/AgentDirectory.tsx`
- agent-profile-card.jsx → `tula/ui/src/components/Agent/AgentProfileCard.tsx`
- agent-profile-page.jsx → `tula/ui/src/components/Agent/AgentProfilePage.tsx`
- agent-create-wizard.jsx → `tula/ui/src/components/Agent/AgentCreateWizard.tsx`
- agent-persona-editor.jsx → `tula/ui/src/components/Agent/AgentPersonaEditor.tsx`
- agent-soul-editor.jsx → `tula/ui/src/components/Agent/AgentSoulEditor.tsx`
- agent-appearance-editor.jsx → `tula/ui/src/components/Agent/AgentAppearanceEditor.tsx`
- agent-voice-editor.jsx → `tula/ui/src/components/Agent/AgentVoiceEditor.tsx`

**Assistant/chat (from `components/assistant/`):**
- assistant-chat.jsx → `tula/ui/src/components/Chat/AssistantChat.tsx`
- assistant-chat-messages.jsx → `tula/ui/src/components/Chat/ChatMessages.tsx`
- assistant-chat-styles.jsx → `tula/ui/src/components/Chat/chatStyles.ts`

**Kanban (from `components/kanban/`):**
- kanban-enhanced.jsx → `tula/ui/src/components/Kanban/KanbanBoard.tsx`
- kanban-card.jsx → `tula/ui/src/components/Kanban/KanbanCard.tsx`
- kanban-column.jsx → `tula/ui/src/components/Kanban/KanbanColumn.tsx`
- kanban-filters.jsx → `tula/ui/src/components/Kanban/KanbanFilters.tsx`
- kanban-enhanced-helpers.jsx → `tula/ui/src/components/Kanban/kanbanHelpers.ts`

**Workspace (from `components/workspace/`):**
- workspace-panel.jsx → `tula/ui/src/components/Workspace/WorkspacePanel.tsx`
- workspace-associations.jsx → `tula/ui/src/components/Workspace/WorkspaceAssociations.tsx`
- workspace-codespace.jsx → `tula/ui/src/components/Workspace/WorkspaceCodespace.tsx`
- memory-search-form.jsx → `tula/ui/src/components/Memory/MemorySearchForm.tsx`
- memory-ontology-editor.jsx → `tula/ui/src/components/Memory/MemoryOntologyEditor.tsx`

**Shell primitives (from `components/shell/`):**
- confirm-dialog.jsx → `tula/ui/src/components/Primitives/ConfirmDialog.tsx`
- pagination.jsx → `tula/ui/src/components/Primitives/Pagination.tsx`
- command-palette.jsx → `tula/ui/src/components/Primitives/CommandPalette.tsx` (remove next/navigation)
- notification-bell.jsx → `tula/ui/src/components/Primitives/NotificationBell.tsx`

**Observability (from `components/observability/`):**
- tool-inspector.jsx → `tula/ui/src/components/Observability/ToolInspector.tsx`
- activity-feed.jsx → `tula/ui/src/components/Observability/ActivityFeed.tsx`

---

## Phase 1: Extract Components to tula/ui (Tasks 1-4)

### Task 1: Add agentic component directories to tula/ui

**Files:**
- Create: `packages/tula/ui/src/components/Agent/index.ts`
- Create: `packages/tula/ui/src/components/Chat/index.ts`
- Create: `packages/tula/ui/src/components/Kanban/index.ts`
- Create: `packages/tula/ui/src/components/Workspace/index.ts`
- Create: `packages/tula/ui/src/components/Memory/index.ts`
- Create: `packages/tula/ui/src/components/Session/index.ts`
- Create: `packages/tula/ui/src/components/Observability/index.ts`
- Create: `packages/tula/ui/src/components/Primitives/index.ts`
- Modify: `packages/tula/ui/src/index.ts` (add new exports)
- Modify: `packages/tula/ui/package.json` (add new export paths)

This task creates the directory structure and barrel exports. No component code yet — just the skeleton.

- [ ] Create each directory with an empty `index.ts` that exports `{}`
- [ ] Add export paths to `packages/tula/ui/package.json` for each new entry point (e.g. `"./agent"`, `"./chat"`, `"./kanban"`)
- [ ] Add re-exports from `packages/tula/ui/src/index.ts`
- [ ] Run `npm run build --workspace=@a5c-ai/tula-ui` to verify
- [ ] Commit: `feat(tula-ui): add agentic component directory skeleton`

### Task 2: Extract shell primitives (ConfirmDialog, Pagination, CommandPalette, NotificationBell)

**Files:**
- Create: `packages/tula/ui/src/components/Primitives/ConfirmDialog.tsx`
- Create: `packages/tula/ui/src/components/Primitives/Pagination.tsx`
- Create: `packages/tula/ui/src/components/Primitives/CommandPalette.tsx`
- Create: `packages/tula/ui/src/components/Primitives/NotificationBell.tsx`
- Modify: `packages/tula/ui/src/components/Primitives/index.ts`
- Modify: `packages/kradle/web/app/components/shell/confirm-dialog.jsx` (re-export from tula-ui)
- Modify: `packages/kradle/web/app/components/shell/pagination.jsx` (re-export from tula-ui)

For each component:
- [ ] Copy the kradle JSX source to tula/ui as TSX
- [ ] Remove `'use client'` directive (not needed outside Next.js)
- [ ] Remove any `next/*` imports, replace with generic React equivalents (e.g. `useRouter` → callback props)
- [ ] Add TypeScript prop types
- [ ] Export from barrel index
- [ ] Build to verify: `npm run build --workspace=@a5c-ai/tula-ui`
- [ ] Update kradle component to re-export from `@a5c-ai/tula-ui/primitives`
- [ ] Run kradle tests: `cd packages/kradle/web && npm test`
- [ ] Commit: `feat(tula-ui): extract shell primitives from kradle`

### Task 3: Extract kanban + chat + session components

**Files:**
- Create: 5 files in `packages/tula/ui/src/components/Kanban/`
- Create: 3 files in `packages/tula/ui/src/components/Chat/`
- Create: 3 files in `packages/tula/ui/src/components/Session/`
- Modify: kradle kanban/, assistant/, agent/ components to re-export

Same pattern as Task 2 for each component group:
- [ ] Copy JSX → TSX, remove `'use client'`, add types
- [ ] Replace kradle-specific imports (orgHref, StatusPill) with prop callbacks
- [ ] Export from barrel indices
- [ ] Update kradle components to re-export
- [ ] Build tula-ui + run kradle tests
- [ ] Commit: `feat(tula-ui): extract kanban, chat, and session components from kradle`

### Task 4: Extract agent identity + workspace + observability components

**Files:**
- Create: 10+ files in `packages/tula/ui/src/components/Agent/`
- Create: 3 files in `packages/tula/ui/src/components/Workspace/`
- Create: 2 files in `packages/tula/ui/src/components/Memory/`
- Create: 2 files in `packages/tula/ui/src/components/Observability/`
- Modify: kradle components to re-export

Same pattern:
- [ ] Copy, convert, type, export
- [ ] Update kradle to re-export
- [ ] Build + test
- [ ] Commit: `feat(tula-ui): extract agent identity, workspace, and observability components`

---

## Phase 2: Create tula/web-app (Tasks 5-7)

### Task 5: Scaffold tula/web-app package

**Files:**
- Create: `packages/tula/web-app/package.json`
- Create: `packages/tula/web-app/tsconfig.json`
- Create: `packages/tula/web-app/vite.config.ts`
- Create: `packages/tula/web-app/index.html`
- Create: `packages/tula/web-app/src/main.tsx`
- Create: `packages/tula/web-app/src/App.tsx`
- Create: `packages/tula/web-app/src/routes.tsx`
- Modify: root `package.json` (add workspace)
- Modify: `scripts/check-architecture-boundaries.cjs` (add to dispatch-surfaces)

- [ ] Create `package.json` with name `@a5c-ai/tula-web-app`, deps: react, react-dom, react-router-dom, `@a5c-ai/tula-ui`, vite
- [ ] Create Vite config (same as current tula-webui)
- [ ] Create `index.html` with root div
- [ ] Create `main.tsx` with React root + BrowserRouter
- [ ] Create `App.tsx` with route layout (sidebar + main)
- [ ] Create `routes.tsx` with initial routes: /, /sessions, /agents, /kanban, /workspaces
- [ ] Add to root workspace array
- [ ] Add to architecture boundaries as dispatch-surface
- [ ] Build: `npm run build --workspace=@a5c-ai/tula-web-app`
- [ ] Commit: `feat(tula): scaffold tula/web-app package`

### Task 6: Port core pages from tula-webui to tula/web-app

**Files:**
- Create: `packages/tula/web-app/src/pages/HomePage.tsx`
- Create: `packages/tula/web-app/src/pages/SessionsPage.tsx`
- Create: `packages/tula/web-app/src/pages/AgentsPage.tsx`
- Create: `packages/tula/web-app/src/pages/KanbanPage.tsx`
- Create: `packages/tula/web-app/src/pages/WorkspacesPage.tsx`
- Create: `packages/tula/web-app/src/pages/SettingsPage.tsx`
- Create: `packages/tula/web-app/src/layout/AppShell.tsx`
- Create: `packages/tula/web-app/src/layout/Sidebar.tsx`

For each page:
- [ ] Import shared components from `@a5c-ai/tula-ui` (Agent, Session, Kanban, etc.)
- [ ] Import gateway hooks from `@a5c-ai/tula-ui/gateway`
- [ ] Compose page layout using tula-ui components
- [ ] No duplication — pages are thin wrappers around tula-ui components
- [ ] Build + dev server: `npm run dev --workspace=@a5c-ai/tula-web-app`
- [ ] Commit: `feat(tula-web-app): port core pages using tula-ui components`

### Task 7: Remove old tula-webui, update references

**Files:**
- Delete: `packages/tula/webui/` (entire directory)
- Modify: root `package.json` (remove old workspace)
- Modify: `.github/workflows/publish.yml` (update build/test/publish references)
- Modify: `scripts/check-architecture-boundaries.cjs` (replace @a5c-ai/tula-webui with @a5c-ai/tula-web-app)

- [ ] Remove old workspace entry
- [ ] Update workflow: build:webui → build:web-app, test:webui → test:web-app
- [ ] Update architecture boundary: tula-webui → tula-web-app
- [ ] Run boundary check: `node scripts/check-architecture-boundaries.cjs`
- [ ] Commit: `refactor: replace tula-webui with tula/web-app`

---

## Phase 3: Scaffold tula/desktop-app (Tasks 8-9)

### Task 8: Create Electron app scaffold

**Files:**
- Create: `packages/tula/desktop-app/package.json`
- Create: `packages/tula/desktop-app/tsconfig.json`
- Create: `packages/tula/desktop-app/src/main.ts` (Electron main process)
- Create: `packages/tula/desktop-app/src/preload.ts` (preload script)
- Create: `packages/tula/desktop-app/src/renderer/index.html`
- Create: `packages/tula/desktop-app/src/renderer/main.tsx` (React entry)
- Create: `packages/tula/desktop-app/src/renderer/App.tsx`
- Create: `packages/tula/desktop-app/electron-builder.yml`
- Modify: root `package.json` (add workspace)
- Modify: `scripts/check-architecture-boundaries.cjs` (add to dispatch-surfaces)

- [ ] Create `package.json` with name `@a5c-ai/tula-desktop-app`, deps: electron, `@a5c-ai/tula-ui`, react, react-dom, electron-builder
- [ ] Create `src/main.ts` with BrowserWindow, loadURL for dev or loadFile for prod
- [ ] Create `src/preload.ts` with contextBridge for IPC
- [ ] Create renderer `index.html` + `main.tsx` + `App.tsx` (same structure as web-app)
- [ ] Create `electron-builder.yml` with macOS + Windows + Linux targets
- [ ] Add scripts: `dev` (electron .), `build` (electron-builder), `package` (electron-builder --dir)
- [ ] Add to root workspace + architecture boundaries
- [ ] Build: `npm run build --workspace=@a5c-ai/tula-desktop-app`
- [ ] Commit: `feat(tula): scaffold tula/desktop-app Electron package`

### Task 9: Wire tula-ui components into desktop app

**Files:**
- Modify: `packages/tula/desktop-app/src/renderer/App.tsx`
- Create: `packages/tula/desktop-app/src/renderer/pages/HomePage.tsx`
- Create: `packages/tula/desktop-app/src/renderer/pages/SessionsPage.tsx`
- Create: `packages/tula/desktop-app/src/renderer/layout/AppShell.tsx`

- [ ] Import and render tula-ui components (same as web-app pages)
- [ ] Add Electron-specific features: native menu bar, system tray, auto-updater stub
- [ ] Dev mode: `npm run dev --workspace=@a5c-ai/tula-desktop-app`
- [ ] Commit: `feat(tula-desktop-app): wire tula-ui components with Electron shell`

---

## Phase 4: Update kradle-web to consume from tula/ui (Tasks 10-11)

### Task 10: Update kradle-web imports to use tula-ui

**Files:**
- Modify: `packages/kradle/web/package.json` (add `@a5c-ai/tula-ui` dependency)
- Modify: `packages/kradle/web/app/components/shell/*.jsx` (import from tula-ui)
- Modify: `packages/kradle/web/app/components/kanban/*.jsx` (import from tula-ui)
- Modify: `packages/kradle/web/app/components/agent/*.jsx` (import shared components)
- Modify: `packages/kradle/web/app/components/assistant/*.jsx` (import from tula-ui)
- Modify: `packages/kradle/web/app/components/workspace/*.jsx` (import from tula-ui)

For each kradle component that was extracted:
- [ ] Replace the component body with a re-export: `export { ConfirmDialog } from '@a5c-ai/tula-ui/primitives'`
- [ ] Or wrap with kradle-specific props: `export function KradleConfirmDialog(props) { return <ConfirmDialog {...props} theme="kradle" /> }`
- [ ] Run: `cd packages/kradle/web && npm test && npm run build`
- [ ] Commit: `refactor(kradle-web): consume shared components from tula-ui`

### Task 11: Update docs, atlas graph, architecture boundaries

**Files:**
- Modify: `packages/kradle/web/app/components/README.md`
- Modify: `packages/kradle/docs/gaps/ui-ux-remaining.md`
- Modify: `scripts/check-architecture-boundaries.cjs` (verify all new packages classified)
- Create: `packages/tula/web-app/README.md`
- Create: `packages/tula/desktop-app/README.md`

- [ ] Update kradle component README to note shared components come from tula-ui
- [ ] Update gaps doc to reflect component extraction
- [ ] Verify all new packages are in architecture boundary families
- [ ] Write README for web-app and desktop-app
- [ ] Run full boundary check
- [ ] Commit: `docs: update for tula-ui extraction and new app packages`

---

## Verification Checklist

After all tasks:
- [ ] `npm run build --workspace=@a5c-ai/tula-ui` — builds with new components
- [ ] `npm run build --workspace=@a5c-ai/tula-web-app` — builds standalone
- [ ] `npm run build --workspace=@a5c-ai/tula-desktop-app` — builds Electron
- [ ] `cd packages/kradle/web && npm test` — all 300+ tests pass
- [ ] `cd packages/kradle/web && npm run build` — Next.js build succeeds
- [ ] `node scripts/check-architecture-boundaries.cjs` — passes
- [ ] No duplicate component implementations between kradle-web and tula-ui
