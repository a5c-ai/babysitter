# WebUI Compendium Migration Design

Migrate the agent-mux webui from its current mixed styling system (Radix UI + Tailwind + hand-rolled CSS + partial compendium) to compendium as the sole design system. Remove the deprecated kanban package dependency. Fix all broken layouts, overlays, and usability issues.

## Context

The webui has broken layouts on most pages, the command palette renders at the bottom instead of as a centered overlay, and there are pervasive design inconsistencies. Root cause: `kanban/globals.css` (950+ lines of duplicate/conflicting CSS) shadows compendium's design tokens, Radix UI wrappers duplicate compendium components, and Next.js shims exist for a kanban package that is being removed.

## Architecture

Two layers after migration:

- **Compendium** (`@a5c-ai/compendium`) — sole design system. All UI primitives (Button, Modal, Tabs, CommandPalette, Sidebar, Toast, etc.), design tokens, and component CSS.
- **Webui** — owns all page components, hooks, services, and types. No kanban imports. No Radix UI. No Next.js shims.

### Directory Structure

```
src/
├── App.tsx
├── main.tsx
├── router.tsx                 # Routes + AppShell
├── shell/
│   ├── AppShell.tsx           # Sidebar + TopBar + content + CommandPalette
│   ├── Sidebar.tsx            # Wraps compendium Sidebar/NavItem
│   ├── TopBar.tsx             # Breadcrumbs + actions
│   └── CommandPalette.tsx     # Wraps compendium CommandPalette
├── pages/
│   ├── projects/
│   ├── runs/
│   ├── sessions/
│   ├── workspaces/
│   ├── inbox/
│   ├── automations/
│   ├── agents/
│   ├── settings/
│   └── login/
├── components/                # Domain-specific shared components
│   ├── pipeline/
│   ├── events/
│   ├── details/
│   ├── breakpoint/
│   ├── notifications/
│   └── review/
├── hooks/
├── lib/
├── providers/
├── types/
└── styles/
    └── app.css                # Compendium import + ~50 lines of app layout
```

### What Gets Deleted

- `src/kanban/` — entire directory (globals.css, component re-exports, shims)
- `src/kanban-shims/` — Next.js compatibility layer (next/link, next/navigation)
- `src/kanban/components/ui/` — Radix wrappers replaced by compendium
- `src/styles/global.css` — replaced by `app.css`

## Shell & Overlay System

### AppShell Layout

Replaces the current `AppChrome` CSS grid with a simple flexbox layout.

```tsx
<div className="app-shell">
  <Sidebar>
    <NavItem icon={...} href="/projects">Projects</NavItem>
    <NavItem icon={...} href="/runs">Runs</NavItem>
    <NavItem icon={...} href="/sessions">Sessions</NavItem>
    ...
  </Sidebar>
  <div className="app-main">
    <TopBar />
    <main className="app-content">
      <Outlet />
    </main>
  </div>
  <CommandPalette open={open} onClose={close} items={actions} onSelect={handler} />
</div>
```

### Overlay System

All overlays use compendium's Portal → rendered at `document.body`:
- Scrim: z-index 100, backdrop-filter blur
- Modal/CommandPalette content: z-index 101
- Toasts: z-index 120

No custom z-index values in webui CSS.

### Mobile

Drop the duplicate `webui-rail` bottom nav bar. Use compendium Sidebar's built-in collapse behavior. Single responsive breakpoint at 768px collapses sidebar.

### CSS

Single file `styles/app.css` replaces both `kanban/globals.css` and `styles/global.css`:

```css
@import '@a5c-ai/compendium/css';

.app-shell { display: flex; height: 100vh; }
.app-main  { flex: 1; min-width: 0; display: flex; flex-direction: column; overflow-y: auto; }
.app-content { padding: var(--tk-space-lg); max-width: 1200px; width: 100%; margin: 0 auto; }

@media (max-width: 768px) {
  .app-shell { flex-direction: column; }
}
```

Everything else comes from compendium component classes.

## Component Migration Map

| Current | Compendium replacement |
|---|---|
| `@radix-ui/react-dialog` + `dialog-shell.tsx` | `Modal`, `Drawer` |
| `@radix-ui/react-tabs` + `tabs.tsx` | `Tabs` |
| `@radix-ui/react-accordion` + `accordion.tsx` | `Accordion` |
| `@radix-ui/react-tooltip` + `tooltip.tsx` | `Tooltip` |
| `@radix-ui/react-scroll-area` | Native `overflow-y: auto` |
| `@radix-ui/react-separator` | `<hr className="tkc-rule">` |
| Custom `button.tsx` (CVA) | `Button`, `IconButton` |
| Custom `card.tsx` | `.tkc-panel` class |
| Custom `badge.tsx` / `status-badge.tsx` | `Tag` with variant |
| Custom `settings-modal.tsx` | Content wrapped in `Modal` |
| Custom `shortcuts-help.tsx` | Content wrapped in `Modal` |
| Custom `page-shell.tsx` | Remove — AppShell handles layout |
| Custom notification toasts | `ToastProvider` + `useToasts()` |
| `cn()` (tailwind-merge + clsx) | `cx()` from compendium |

### Unchanged

- Services & hooks (business logic, not UI) — move from `kanban/hooks/` and `kanban/lib/` to `hooks/` and `lib/`
- Zustand stores, gateway/auth flow, API layer
- Routing structure (same URLs)
- Specialized components (pipeline, events, JSON tree, agent panel) — keep structure, restyle with compendium tokens

### Dependencies Removed

- `@radix-ui/react-dialog`, `react-tabs`, `react-accordion`, `react-tooltip`, `react-scroll-area`, `react-separator`, `react-slot`
- `tailwind-merge`, `class-variance-authority`, `clsx`
- `tailwindcss`, `postcss`, `autoprefixer`

## Migration Phases

Each phase leaves the app in a working state.

### Phase 1 — Shell replacement

Replace AppChrome with AppShell. New `app.css` replaces both global CSS files. Sidebar, TopBar, CommandPalette rewired to compendium. Delete `webui-rail`. Fixes overlay/layout issues on every page immediately.

### Phase 2 — UI primitive swap

Replace Radix wrappers (`components/ui/`) with compendium imports. Button, Modal, Tabs, Accordion, Tooltip, Tag. Update all import paths. Delete `cn()`, switch to `cx()`. Remove Radix and Tailwind dependencies.

### Phase 3 — Move kanban internals into webui

Move hooks, services, types, and page components from `src/kanban/` to `src/hooks/`, `src/lib/`, `src/pages/`, `src/components/`. Delete Next.js shims. Delete `src/kanban/` and `src/kanban-shims/`.

### Phase 4 — Restyle page components

Page-by-page: replace Tailwind classes with compendium tokens on pipeline cards, event stream, JSON tree, dashboard grids, detail panels. Each page is independent.

### Phase 5 — Cleanup & verify

Remove Tailwind config files. Verify build. Test all routes. Verify dark/light theme toggle. Remove unused CSS.

## Testing Strategy

- After each phase: `npm run build` must succeed
- Manual smoke test: login → navigate all pages → command palette (Cmd+K) → theme toggle → mobile viewport
- Existing vitest tests updated as import paths change
- No new test framework
