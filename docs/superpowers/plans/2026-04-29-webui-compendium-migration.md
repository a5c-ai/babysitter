# WebUI Compendium Migration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the agent-mux webui from mixed Radix/Tailwind/hand-rolled CSS to compendium as sole design system. Remove deprecated kanban package dependency. Fix all broken layouts and overlays.

**Architecture:** Two layers — compendium provides all UI primitives and design tokens; the webui owns pages, hooks, services, and types directly. No Radix UI, no Tailwind, no Next.js shims.

**Tech Stack:** React 18, React Router v6, Vite 8, @a5c-ai/compendium, Zustand, TypeScript

**Spec:** `docs/superpowers/specs/2026-04-29-webui-compendium-migration-design.md`

**Working directory:** `packages/agent-mux/webui`

---

## Phase 1 — Shell Replacement

### Task 1: Create app.css and update main.tsx entry point

Replace the three CSS imports (compendium/css, kanban/globals.css, styles/global.css) with a single `styles/app.css` that imports compendium tokens and defines minimal app layout.

**Files:**
- Create: `src/styles/app.css`
- Modify: `src/main.tsx`

- [ ] **Step 1: Create `src/styles/app.css`**

```css
@import '@a5c-ai/compendium/css';

/* ── App shell layout ─────────────────────────────────────────────── */

*,
*::before,
*::after {
  box-sizing: border-box;
}

html, body, #root {
  min-height: 100vh;
  margin: 0;
}

body {
  color: var(--tkc-ink);
  background: var(--tkc-paper);
}

a { color: inherit; }
img { display: block; max-width: 100%; }

.app-shell {
  display: flex;
  height: 100vh;
}

.app-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  background: var(--tkc-paper);
}

.app-content {
  flex: 1;
  padding: var(--tk-space-lg, 24px);
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
}

.app-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--tk-space-md, 16px) var(--tk-space-lg, 24px);
  border-bottom: 1px solid var(--tkc-rule);
}

.app-topbar h2 {
  margin: 0;
  font-size: 1.25rem;
}

.app-topbar__actions {
  display: flex;
  align-items: center;
  gap: var(--tk-space-sm, 8px);
}

.connection-pill {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-family: var(--font-mono, monospace);
  border: 1px solid var(--tkc-rule);
}

.connection-connected { color: var(--tkc-emerald); border-color: var(--tkc-emerald); }
.connection-disconnected { color: var(--tkc-cinnabar); border-color: var(--tkc-cinnabar); }
.connection-connecting { color: var(--tkc-amber); border-color: var(--tkc-amber); }

/* ── Login page ───────────────────────────────────────────────────── */

.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: clamp(20px, 4vw, 40px);
  background: var(--tkc-paper);
}

.login-card {
  width: min(42rem, 100%);
  padding: clamp(24px, 4vw, 40px);
}

/* ── Page layout helpers ──────────────────────────────────────────── */

.stack {
  display: grid;
  gap: 16px;
}

.dashboard-layout {
  display: grid;
  gap: 16px;
  align-content: start;
}

.flow-grid {
  display: grid;
  gap: 16px;
  align-content: start;
}

.pairing-layout {
  display: grid;
  gap: 16px;
  align-content: start;
}

.settings-grid {
  display: grid;
  gap: 16px;
}

.list-grid {
  display: grid;
  gap: 16px;
}

.summary-grid {
  display: grid;
  gap: 16px;
}

/* ── Responsive ───────────────────────────────────────────────────── */

@media (max-width: 768px) {
  .app-shell {
    flex-direction: column;
  }

  .app-content {
    padding: var(--tk-space-md, 16px);
  }
}
```

- [ ] **Step 2: Update `src/main.tsx` to use only app.css**

Replace the contents of `src/main.tsx` with:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';

import { App } from './App.js';
import './styles/app.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 3: Verify build compiles**

Run: `npm run build`
Expected: Build succeeds (pages will look different but app renders)

- [ ] **Step 4: Commit**

```bash
git add src/styles/app.css src/main.tsx
git commit -m "feat(webui): replace triple CSS imports with single app.css using compendium tokens"
```

---

### Task 2: Rewrite AppShell layout in router.tsx

Replace `AppChrome` with `AppShell` using flexbox layout. Remove the `webui-rail` mobile nav. Keep all routes unchanged.

**Files:**
- Modify: `src/router.tsx`

- [ ] **Step 1: Rewrite the AppChrome component as AppShell**

Replace the `AppChrome` function (lines 59-148) in `src/router.tsx` with:

```tsx
function AppShell(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const { store } = useGateway();
  const { logout } = useGatewayAuth();
  const { mode, toggle } = useThemeMode();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const sessions = useStore(store, useShallow((state) => Object.values(state.sessions.byId)));

  const recentSessionActions = useMemo(
    () =>
      buildRecentSessionActions(sessions).map((action) => ({
        id: action.id,
        label: action.label,
        run: () => navigate(action.to),
      })),
    [navigate, sessions],
  );

  const actions = useMemo(
    () => [
      { id: 'projects', label: 'Open projects', run: () => navigate('/projects') },
      { id: 'runs', label: 'Open runs', run: () => navigate('/runs') },
      { id: 'new-session', label: 'Start session', run: () => navigate('/sessions/new') },
      { id: 'sessions', label: 'Browse sessions', run: () => navigate('/sessions') },
      { id: 'workspaces', label: 'Open workspaces', run: () => navigate('/workspaces') },
      { id: 'inbox', label: 'Open hook inbox', run: () => navigate('/inbox') },
      { id: 'pair', label: 'Pair device', run: () => navigate('/pair-device') },
      { id: 'theme', label: `Switch to ${mode === 'light' ? 'dark' : 'light'} theme`, run: () => toggle() },
      { id: 'logout', label: 'Forget token', run: () => logout() },
      ...recentSessionActions,
    ],
    [logout, mode, navigate, recentSessionActions, toggle],
  );

  React.useEffect(() => bindGlobalHotkeys({ openPalette: () => setPaletteOpen(true) }), []);

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <TopBar pathname={location.pathname} onOpenPalette={() => setPaletteOpen(true)} />
        <main className="app-content">
          <Routes>
            <Route path="/" element={<Navigate to="/projects" replace />} />
            <Route path="/agents" element={<AgentsPage />} />
            <Route path="/sessions" element={<SessionsPage />} />
            <Route path="/sessions/new" element={<NewRunPage />} />
            <Route path="/sessions/pending/:runId" element={<SessionPendingPage />} />
            <Route path="/runs/:runId" element={<SessionPendingPage />} />
            <Route path="/sessions/:sessionId" element={<SessionDetailPage />} />
            <Route path="/sessions/:agent/:sessionId" element={<LegacySessionRouteRedirect />} />
            <Route path="/pair-device" element={<PairDevicePage />} />
            <Route element={<KanbanLayout />}>
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/:projectId/board" element={<ProjectBoardPage />} />
              <Route path="/projects/:projectId/list" element={<ProjectListPage />} />
              <Route path="/projects/:projectId/issues/new" element={<ProjectIssueCreatePage />} />
              <Route path="/projects/:projectId/issues/:issueId" element={<ProjectIssuePage />} />
              <Route path="/projects/:projectId/workspaces/new" element={<ProjectWorkspaceCreatePage />} />
              <Route path="/projects/:projectId/issues/:issueId/workspace/new" element={<IssueWorkspaceCreatePage />} />
              <Route path="/issues/:issueId" element={<IssueDetailPage />} />
              <Route path="/runs" element={<KanbanRunsPage />} />
              <Route path="/workspaces" element={<KanbanWorkspacesPage />} />
              <Route path="/workspaces/new" element={<HostWorkspaceCreatePage />} />
              <Route path="/inbox" element={<KanbanInboxPage />} />
              <Route path="/automations" element={<AutomationsPage />} />
              <Route path="/settings" element={<KanbanSettingsPage />} />
            </Route>
            <Route path="/legacy-home" element={<HomePage />} />
            <Route path="/legacy-workspaces" element={<WorkspacesPage />} />
            <Route path="/legacy-inbox" element={<HookInboxPage />} />
            <Route path="/legacy-settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
      <CommandPalette actions={actions} open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
```

Also update `AppRouter` to reference `AppShell`:

```tsx
export function AppRouter(): JSX.Element {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="*"
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      />
    </Routes>
  );
}
```

- [ ] **Step 2: Update TopBar to use new class names**

In `src/shell/TopBar.tsx`, replace the class names:

```tsx
import React from 'react';
import { useConnection } from '@a5c-ai/agent-mux-ui';
import { Button } from '@a5c-ai/compendium';
import { titleForPath } from './navigation.js';

export function TopBar(props: { pathname: string; onOpenPalette(): void }): JSX.Element {
  const connection = useConnection();
  return (
    <header className="app-topbar">
      <h2>{titleForPath(props.pathname)}</h2>
      <div className="app-topbar__actions">
        <span className={`connection-pill connection-${connection.status}`}>{connection.status}</span>
        <Button type="button" size="sm" onClick={props.onOpenPalette}>
          Command palette
        </Button>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Update Sidebar to use compendium classes**

In `src/shell/Sidebar.tsx`, replace with compendium-styled sidebar:

```tsx
import React from 'react';
import { NavLink } from 'react-router-dom-v6';
import { cx } from '@a5c-ai/compendium';

export function Sidebar(): JSX.Element {
  return (
    <aside className="tkc-panel" style={{ width: 240, padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 8, borderRight: '1px solid var(--tkc-rule)', flexShrink: 0 }}>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--tkc-ink-soft)', margin: '0 0 4px 8px' }}>agent-mux</p>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {[
          { to: '/projects', label: 'Projects' },
          { to: '/runs', label: 'Runs' },
          { to: '/agents', label: 'Agents' },
          { to: '/sessions', label: 'Sessions' },
          { to: '/sessions/new', label: 'New session' },
          { to: '/workspaces', label: 'Workspaces' },
          { to: '/inbox', label: 'Hook inbox' },
          { to: '/automations', label: 'Automations' },
          { to: '/pair-device', label: 'Pair device' },
          { to: '/settings', label: 'Settings' },
        ].map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cx('tkc-tree__node', isActive && 'tkc-tree__node--selected')}
            style={{ textDecoration: 'none', padding: '6px 12px', borderRadius: 6, fontSize: '0.875rem' }}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 4: Verify build compiles**

Run: `npm run build`
Expected: Build succeeds. Shell layout uses flexbox. CommandPalette renders as centered overlay via compendium Portal.

- [ ] **Step 5: Commit**

```bash
git add src/router.tsx src/shell/Sidebar.tsx src/shell/TopBar.tsx
git commit -m "feat(webui): replace AppChrome with AppShell using compendium layout primitives"
```

---

### Task 3: Delete old CSS files

Now that app.css is in place and the shell uses new class names, remove the old CSS files.

**Files:**
- Delete: `src/kanban/globals.css`
- Delete: `src/styles/global.css`

- [ ] **Step 1: Delete old CSS files**

```bash
git rm src/kanban/globals.css src/styles/global.css
```

- [ ] **Step 2: Update any remaining imports of these files**

Search for imports of the deleted files. The only import was in `main.tsx` (already updated in Task 1). Check for any other references:

```bash
grep -rn "globals.css\|styles/global.css" src/ --include="*.ts" --include="*.tsx" --include="*.css"
```

Expected: No matches (main.tsx was already updated).

- [ ] **Step 3: Verify build compiles**

Run: `npm run build`
Expected: Build succeeds. Some pages may have unstyled elements — that's expected, they'll be fixed in Phase 4.

- [ ] **Step 4: Commit**

```bash
git commit -m "chore(webui): delete kanban/globals.css and styles/global.css — replaced by app.css"
```

---

## Phase 2 — UI Primitive Swap

### Task 4: Replace cn() with cx() across codebase

The `cn()` utility (clsx + tailwind-merge) is replaced by compendium's `cx()` (simple string join).

**Files:**
- Delete: `src/kanban/lib/cn.ts`
- Modify: All files that import `cn` from `@/lib/cn`

- [ ] **Step 1: Find all files importing cn**

```bash
grep -rn "from.*['\"]@/lib/cn['\"]" src/ --include="*.ts" --include="*.tsx" -l
```

- [ ] **Step 2: Replace all imports**

For every file found, replace:
```typescript
import { cn } from '@/lib/cn';
```
with:
```typescript
import { cx } from '@a5c-ai/compendium';
```

Then rename all `cn(` calls to `cx(` in those files.

- [ ] **Step 3: Delete the cn.ts file**

```bash
git rm src/kanban/lib/cn.ts
```

- [ ] **Step 4: Verify build compiles**

Run: `npm run build`

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "refactor(webui): replace cn() with compendium cx()"
```

---

### Task 5: Replace Radix UI wrapper components with compendium

Replace each wrapper in `src/kanban/components/ui/` with compendium equivalents.

**Files:**
- Delete: `src/kanban/components/ui/button.tsx`
- Delete: `src/kanban/components/ui/card.tsx`
- Delete: `src/kanban/components/ui/tabs.tsx`
- Delete: `src/kanban/components/ui/accordion.tsx`
- Delete: `src/kanban/components/ui/tooltip.tsx`
- Delete: `src/kanban/components/ui/badge.tsx`
- Delete: `src/kanban/components/ui/separator.tsx`
- Delete: `src/kanban/components/ui/scroll-area.tsx`
- Modify: All files that import from these wrappers

- [ ] **Step 1: Map all imports of UI wrappers**

```bash
grep -rn "from.*components/ui/" src/ --include="*.ts" --include="*.tsx" | grep -v "node_modules"
```

Build a mapping of what each consumer imports and what the compendium replacement is.

- [ ] **Step 2: Update Button imports**

Every file importing `Button` from `@/components/ui/button` changes to:
```typescript
import { Button } from '@a5c-ai/compendium';
```

For files using `buttonVariants` — remove the import, apply compendium's built-in button classes directly. The compendium Button accepts `variant` prop ("primary" | "ghost") and `size` prop ("sm").

- [ ] **Step 3: Update Tabs imports**

Replace:
```typescript
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
```
with:
```typescript
import { Tabs } from '@a5c-ai/compendium';
```

Compendium Tabs uses an `items` prop array instead of render children:
```tsx
<Tabs
  value={activeTab}
  onChange={setActiveTab}
  items={[
    { value: 'overview', label: 'Overview', body: <OverviewContent /> },
    { value: 'logs', label: 'Logs', body: <LogsContent /> },
  ]}
/>
```

Each consumer using the old Radix pattern needs restructuring to the `items` array pattern.

- [ ] **Step 4: Update Accordion imports**

Replace:
```typescript
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
```
with:
```typescript
import { Accordion } from '@a5c-ai/compendium';
```

Compendium Accordion uses `items` array:
```tsx
<Accordion items={[{ key: 'details', heading: 'Details', body: <DetailsContent /> }]} />
```

- [ ] **Step 5: Update Tooltip imports**

Replace:
```typescript
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
```
with:
```typescript
import { Tooltip } from '@a5c-ai/compendium';
```

Compendium Tooltip wraps the trigger child and takes a `label` prop:
```tsx
<Tooltip label="Helpful text">
  <button>Hover me</button>
</Tooltip>
```

- [ ] **Step 6: Replace Badge/StatusBadge with Tag**

Replace:
```typescript
import { Badge } from '@/components/ui/badge';
```
with:
```typescript
import { Tag } from '@a5c-ai/compendium';
```

Map badge variants to Tag: `<Tag>running</Tag>` (Tag accepts children as text content).

- [ ] **Step 7: Replace Separator with rule**

Replace:
```typescript
import { Separator } from '@/components/ui/separator';
```
with a plain `<hr className="tkc-rule" />`. No component import needed.

- [ ] **Step 8: Replace ScrollArea with native scroll**

Replace:
```typescript
import { ScrollArea } from '@/components/ui/scroll-area';
```
with a plain `<div style={{ overflowY: 'auto' }}>`. No component import needed.

- [ ] **Step 9: Replace Card with tkc-panel class**

Replace:
```typescript
import { Card, CardHeader, CardContent } from '@/components/ui/card';
```
with plain divs using compendium panel class:
```tsx
<div className="tkc-panel">
  <div style={{ padding: 16 }}>{/* header */}</div>
  <div style={{ padding: 16 }}>{/* content */}</div>
</div>
```

- [ ] **Step 10: Delete all UI wrapper files**

```bash
git rm src/kanban/components/ui/button.tsx
git rm src/kanban/components/ui/card.tsx
git rm src/kanban/components/ui/tabs.tsx
git rm src/kanban/components/ui/accordion.tsx
git rm src/kanban/components/ui/tooltip.tsx
git rm src/kanban/components/ui/badge.tsx
git rm src/kanban/components/ui/separator.tsx
git rm src/kanban/components/ui/scroll-area.tsx
```

- [ ] **Step 11: Verify build compiles**

Run: `npm run build`

- [ ] **Step 12: Commit**

```bash
git add -A && git commit -m "refactor(webui): replace Radix UI wrappers with compendium components"
```

---

### Task 6: Replace dialog/modal usage with compendium Modal

Replace Radix Dialog usage in settings-modal, shortcuts-help, and dialog-shell with compendium's Modal.

**Files:**
- Modify: All files using `@radix-ui/react-dialog` or `dialog-shell`
- Delete: `src/kanban/components/shared/dialog-shell.tsx` (if it exists)

- [ ] **Step 1: Find all dialog/modal usage**

```bash
grep -rn "react-dialog\|DialogShell\|dialog-shell\|RadixDialog" src/ --include="*.ts" --include="*.tsx" -l
```

- [ ] **Step 2: Replace with compendium Modal**

For each consumer, replace:
```tsx
import * as Dialog from '@radix-ui/react-dialog';
// ...
<Dialog.Root open={open} onOpenChange={setOpen}>
  <Dialog.Portal>
    <Dialog.Overlay />
    <Dialog.Content>
      <Dialog.Title>Title</Dialog.Title>
      {children}
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

with:
```tsx
import { Modal } from '@a5c-ai/compendium';
// ...
<Modal open={open} onClose={() => setOpen(false)} title="Title">
  {children}
</Modal>
```

- [ ] **Step 3: Verify build compiles**

Run: `npm run build`

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "refactor(webui): replace Radix Dialog with compendium Modal"
```

---

### Task 7: Replace notification system with compendium ToastProvider

Replace the custom NotificationProvider with compendium's ToastProvider.

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/providers/NotificationProvider.tsx`
- Modify: Any files using `useNotifications()` or the notification context

- [ ] **Step 1: Add ToastProvider to App.tsx**

In `src/App.tsx`, wrap the app with compendium ToastProvider:

```tsx
import React from 'react';
import { BrowserRouter } from 'react-router-dom-v6';
import { ToastProvider } from '@a5c-ai/compendium';

import { GatewayProvider } from './providers/GatewayProvider.js';
import { NotificationProvider } from './providers/NotificationProvider.js';
import { ThemeProvider } from './providers/ThemeProvider.js';
import { AppRouter } from './router.js';

export function App(): JSX.Element {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <GatewayProvider>
            <NotificationProvider>
              <AppRouter />
            </NotificationProvider>
          </GatewayProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
```

- [ ] **Step 2: Update NotificationProvider to use compendium toasts**

In `src/providers/NotificationProvider.tsx`, replace the custom notification logic with compendium's `useToasts()`:

```tsx
import React from 'react';
import { useGatewayAuth } from './GatewayProvider.js';
import { useHookRequests } from '@a5c-ai/agent-mux-ui';
import { useToasts } from '@a5c-ai/compendium';

function NotificationBridge(): null {
  const hooks = useHookRequests();
  const { push } = useToasts();

  React.useEffect(() => {
    if (document.hidden && hooks.unread.length > 0) {
      for (const hook of hooks.unread) {
        push({ title: 'Hook request', message: hook.title || 'Pending approval', kind: 'info' });
      }
    }
  }, [hooks.unread, push]);

  return null;
}

export function NotificationProvider(props: { children: React.ReactNode }): JSX.Element {
  const { isAuthenticated } = useGatewayAuth();
  return (
    <>
      {isAuthenticated ? <NotificationBridge /> : null}
      {props.children}
    </>
  );
}
```

- [ ] **Step 3: Verify build compiles**

Run: `npm run build`

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "refactor(webui): replace custom notifications with compendium ToastProvider"
```

---

### Task 8: Remove Radix and Tailwind dependencies

Remove all deprecated dependencies from package.json now that nothing imports them.

**Files:**
- Modify: `packages/agent-mux/webui/package.json`

- [ ] **Step 1: Remove dependencies**

```bash
npm uninstall @radix-ui/react-accordion @radix-ui/react-dialog @radix-ui/react-scroll-area @radix-ui/react-separator @radix-ui/react-slot @radix-ui/react-tabs @radix-ui/react-tooltip class-variance-authority clsx tailwind-merge
```

- [ ] **Step 2: Remove dev dependencies**

```bash
npm uninstall --save-dev tailwindcss
```

- [ ] **Step 3: Verify no remaining Radix/Tailwind imports**

```bash
grep -rn "@radix-ui\|tailwind-merge\|class-variance-authority\|clsx" src/ --include="*.ts" --include="*.tsx"
```

Expected: No matches.

- [ ] **Step 4: Verify build compiles**

Run: `npm run build`

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(webui): remove Radix UI, Tailwind, CVA, clsx dependencies"
```

---

## Phase 3 — Move Kanban Internals Into Webui

### Task 9: Move hooks from kanban/hooks/ to hooks/

Move all React hooks from the kanban subdirectory to the webui's own hooks directory.

**Files:**
- Move: `src/kanban/hooks/*` → `src/hooks/`
- Modify: All files importing from `@/hooks/`

- [ ] **Step 1: Move hook files**

```bash
mkdir -p src/hooks
cp src/kanban/hooks/*.ts src/hooks/
cp src/kanban/hooks/*.tsx src/hooks/
```

- [ ] **Step 2: Update import paths in moved hooks**

Each hook may import from `@/lib/` (which maps to `src/kanban/lib/`). These will be updated in Task 10 when we move lib files. For now, update the Vite alias or use relative paths.

- [ ] **Step 3: Update all consumers to import from new path**

Replace `from '@/hooks/...'` with `from '@webui/hooks/...'` (or relative paths) across all page components.

- [ ] **Step 4: Delete old hook files**

```bash
git rm -r src/kanban/hooks/
```

- [ ] **Step 5: Verify build compiles**

Run: `npm run build`

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "refactor(webui): move hooks from kanban/hooks/ to hooks/"
```

---

### Task 10: Move lib, services, and types from kanban/ to webui root

Move the library code, services, and type definitions.

**Files:**
- Move: `src/kanban/lib/*` → `src/lib/`
- Move: `src/kanban/types/*` → `src/types/`
- Modify: All files importing from `@/lib/` or `@/types/`

- [ ] **Step 1: Move lib and types**

```bash
mkdir -p src/lib src/lib/services src/types
cp src/kanban/lib/*.ts src/lib/
cp src/kanban/lib/services/*.ts src/lib/services/
cp src/kanban/types/*.ts src/types/
```

- [ ] **Step 2: Update all import paths**

Replace `@/lib/` imports with `@webui/lib/` (or relative) across the codebase. Same for `@/types/`.

- [ ] **Step 3: Delete old directories**

```bash
git rm -r src/kanban/lib/ src/kanban/types/
```

- [ ] **Step 4: Verify build compiles**

Run: `npm run build`

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "refactor(webui): move lib/ and types/ from kanban/ to webui root"
```

---

### Task 11: Move page components and delete kanban directory

Move remaining page components and shared components out of the kanban directory. Delete Next.js shims. Delete the kanban directory.

**Files:**
- Move: `src/kanban/components/shared/*` → `src/components/shared/`
- Move: `src/kanban/components/dashboard/*` → `src/components/dashboard/`
- Move: `src/kanban/components/details/*` → `src/components/details/`
- Move: `src/kanban/components/pipeline/*` → `src/components/pipeline/`
- Move: `src/kanban/components/events/*` → `src/components/events/`
- Move: `src/kanban/components/breakpoint/*` → `src/components/breakpoint/`
- Move: `src/kanban/components/review/*` → `src/components/review/`
- Move: `src/kanban/components/notifications/*` → `src/components/notifications/`
- Move: remaining kanban components as needed
- Delete: `src/kanban-shims/`
- Delete: `src/kanban/`

- [ ] **Step 1: Move component directories**

```bash
mkdir -p src/components/{shared,dashboard,details,pipeline,events,breakpoint,review,notifications,sessions,runs,workspaces,automations,task-tags,agent-mux}
# Copy each component group
cp -r src/kanban/components/shared/* src/components/shared/
cp -r src/kanban/components/dashboard/* src/components/dashboard/
cp -r src/kanban/components/details/* src/components/details/
cp -r src/kanban/components/pipeline/* src/components/pipeline/
cp -r src/kanban/components/events/* src/components/events/
cp -r src/kanban/components/breakpoint/* src/components/breakpoint/
cp -r src/kanban/components/review/* src/components/review/
cp -r src/kanban/components/notifications/* src/components/notifications/
cp -r src/kanban/components/sessions/* src/components/sessions/
cp -r src/kanban/components/runs/* src/components/runs/
cp -r src/kanban/components/workspaces/* src/components/workspaces/
cp -r src/kanban/components/automations/* src/components/automations/
cp -r src/kanban/components/task-tags/* src/components/task-tags/
cp -r src/kanban/components/agent-mux/* src/components/agent-mux/
cp -r src/kanban/components/providers/* src/components/providers/
```

- [ ] **Step 2: Update all import paths in moved files**

All `@/components/` imports now resolve to `src/components/` instead of `src/kanban/components/`. Update the Vite alias `@/` in `vite.config.ts` to point to `src/` instead of `src/kanban/`:

```typescript
// In vite.config.ts, change:
'@/': path.resolve(__dirname, 'src/kanban/'),
// To:
'@/': path.resolve(__dirname, 'src/'),
```

- [ ] **Step 3: Remove Next.js shims and update imports**

Replace all `next/link` imports with React Router `Link`:
```typescript
// Old:
import Link from 'next/link';
// New:
import { Link } from 'react-router-dom-v6';
```

Replace all `next/navigation` imports:
```typescript
// Old:
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
// New:
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom-v6';
```

Delete the shim files:
```bash
git rm -r src/kanban-shims/
```

- [ ] **Step 4: Delete the kanban directory**

```bash
git rm -r src/kanban/
```

- [ ] **Step 5: Update Vite alias config**

In `vite.config.ts`, remove the `@/` → `src/kanban/` alias and replace with `@/` → `src/`:

```typescript
resolve: {
  alias: {
    '@/': path.resolve(__dirname, 'src/'),
    '@webui/': path.resolve(__dirname, 'src/'),
    // Remove next/link, next/navigation aliases — shims are gone
  }
}
```

- [ ] **Step 6: Verify build compiles**

Run: `npm run build`
This is the hardest step — expect import resolution errors. Fix each one by updating the import path.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "refactor(webui): move all components out of kanban/, delete kanban/ and kanban-shims/"
```

---

## Phase 4 — Restyle Page Components

### Task 12: Restyle page components with compendium tokens

Go through each page component and replace Tailwind utility classes with compendium design tokens and component classes. This is the largest task by file count but each page is independent.

**Approach:** For each file, replace:
- `className="flex items-center gap-2"` → `style={{ display: 'flex', alignItems: 'center', gap: 8 }}`
- `className="text-sm text-muted-foreground"` → `style={{ fontSize: '0.875rem', color: 'var(--tkc-ink-soft)' }}`
- `className="bg-card border rounded-lg p-4"` → `className="tkc-panel"`
- `className="font-mono text-xs"` → `style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}`

**Key compendium token mappings:**
- Colors: `var(--tkc-ink)`, `var(--tkc-ink-soft)`, `var(--tkc-paper)`, `var(--tkc-rule)`
- Status: `var(--tkc-emerald)`, `var(--tkc-cinnabar)`, `var(--tkc-amber)`, `var(--tkc-cyan)`
- Spacing: `var(--tk-space-sm)` (8px), `var(--tk-space-md)` (16px), `var(--tk-space-lg)` (24px)
- Typography: `var(--font-display)`, `var(--font-body)`, `var(--font-mono)`
- Panels: `.tkc-panel` class for card-like containers
- Rules: `<hr className="tkc-rule" />` for separators

- [ ] **Step 1: Restyle dashboard components**

Work through `src/components/dashboard/` files, replacing Tailwind classes with compendium tokens.

- [ ] **Step 2: Restyle session/run detail components**

Work through `src/components/details/`, `src/components/pipeline/`, `src/components/events/`.

- [ ] **Step 3: Restyle shared components**

Work through `src/components/shared/` — app-header, error-boundary, page-shell (if kept), status-badge replacements.

- [ ] **Step 4: Restyle remaining page-specific components**

Work through automations, breakpoint, review, notifications, workspaces, runs, sessions components.

- [ ] **Step 5: Restyle page files**

Update `src/pages/` files: LoginPage, ProjectsPage, SessionsPage, AgentsPage, etc.

- [ ] **Step 6: Verify build compiles**

Run: `npm run build`

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "style(webui): restyle all page components with compendium design tokens"
```

---

## Phase 5 — Cleanup & Verify

### Task 13: Remove Tailwind config and unused files

**Files:**
- Delete: `tailwind.config.*` (if exists)
- Delete: `postcss.config.*` (if exists)
- Modify: `vite.config.ts` (remove Tailwind plugin if present)

- [ ] **Step 1: Find and delete Tailwind/PostCSS config files**

```bash
ls tailwind.config.* postcss.config.* 2>/dev/null
git rm tailwind.config.* postcss.config.* 2>/dev/null || true
```

- [ ] **Step 2: Clean Vite config**

Remove any Tailwind-related Vite plugins from `vite.config.ts`. Remove unused path aliases (next/link, next/navigation, react-native).

- [ ] **Step 3: Verify no Tailwind utility classes remain**

```bash
grep -rn "className=\"[^\"]*\b(flex|grid|items-|justify-|gap-|p-[0-9]|m-[0-9]|text-|bg-|border-|rounded-|w-|h-|min-|max-)" src/ --include="*.tsx" -l
```

Fix any remaining Tailwind classes found.

- [ ] **Step 4: Final build verification**

Run: `npm run build`
Expected: Clean build, no warnings about missing modules.

- [ ] **Step 5: Run existing tests**

Run: `npm test`
Expected: Tests pass (some may need import path updates).

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "chore(webui): remove Tailwind config, clean up Vite aliases"
```

---

### Task 14: Final verification and phase commit

- [ ] **Step 1: Verify all routes render**

Start dev server and manually navigate: `/login` → `/projects` → `/runs` → `/sessions` → `/agents` → `/workspaces` → `/inbox` → `/automations` → `/settings` → `/pair-device`

- [ ] **Step 2: Verify CommandPalette**

Press Cmd+K (or Ctrl+K). Verify:
- Palette appears as centered overlay with scrim backdrop
- Search filtering works
- Arrow key navigation works
- Escape closes

- [ ] **Step 3: Verify theme toggle**

Open CommandPalette → "Switch to dark theme". Verify:
- All pages switch to void/dark theme
- Colors, backgrounds, and text are readable
- Toggle back to light theme works

- [ ] **Step 4: Verify mobile viewport**

Resize browser to 375px width. Verify:
- Sidebar collapses
- Content is readable
- No horizontal overflow

- [ ] **Step 5: Final commit**

```bash
git add -A && git commit -m "feat(webui): complete compendium migration — all layouts, overlays, and pages use compendium design system"
```
