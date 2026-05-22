# WebUI Compendium Migration — Remaining Work

**Plan:** `docs/superpowers/plans/2026-04-29-webui-compendium-migration.md`
**Spec:** `docs/superpowers/specs/2026-04-29-webui-compendium-migration-design.md`

## Completed

- [x] **Task 1** — Created `src/styles/app.css`, updated `main.tsx` to single CSS import
- [x] **Task 2** — Rewrote AppChrome → AppShell (flexbox layout, compendium sidebar/topbar, removed webui-rail)
- [x] **Task 3** — Deleted `kanban/globals.css` and `styles/global.css`
- [x] **Task 4** — Replaced `cn()` with compendium `cx()` across 55 files
- [x] **Task 5** — Replaced all 8 Radix UI wrappers (button, tabs, accordion, tooltip, badge, card, separator, scroll-area) with compendium equivalents across 86 files
- [x] **Task 6** — Replaced Radix Dialog with compendium Modal/Drawer/CommandPalette
- [x] **Task 7** — Replaced custom notification system with compendium ToastProvider
- [x] **Task 8** — Removed all Radix UI, Tailwind, CVA, clsx dependencies from package.json

## Remaining

### Task 9: Move hooks from kanban/hooks/ to hooks/

Move `src/kanban/hooks/*` → `src/hooks/`. Update all consumer import paths. Delete `src/kanban/hooks/`.

### Task 10: Move lib, services, types from kanban/

Move `src/kanban/lib/*` → `src/lib/`, `src/kanban/types/*` → `src/types/`. Update all import paths. Delete old directories.

### Task 11: Move components and delete kanban directory

This is the biggest remaining task:

1. Move `src/kanban/components/*` → `src/components/` (all subdirs: shared, dashboard, details, pipeline, events, breakpoint, review, notifications, sessions, runs, workspaces, automations, task-tags, agent-mux, providers)
2. Replace all `next/link` imports with React Router `Link` (change `href` prop to `to`)
3. Replace all `next/navigation` imports with React Router hooks (`useNavigate`, `useLocation`, `useSearchParams`)
4. Update Vite alias: change `@/` from `src/kanban/` to `src/`
5. Remove `next/link` and `next/navigation` aliases from `vite.config.ts`
6. Delete `src/kanban-shims/` (Next.js compatibility layer)
7. Delete `src/kanban/` entirely

**Critical note:** Since `@/` currently maps to `src/kanban/`, changing it to `src/` means most `@/` import paths stay the same after the file move. The main work is the physical file move + Next.js shim removal.

### Task 12: Restyle page components with compendium tokens

Go page-by-page and replace remaining Tailwind utility classes with compendium design tokens:

- `className="flex items-center gap-2"` → `style={{ display: 'flex', alignItems: 'center', gap: 8 }}`
- `className="text-sm text-muted-foreground"` → `style={{ fontSize: '0.875rem', color: 'var(--tkc-ink-soft)' }}`
- `className="bg-card border rounded-lg p-4"` → `className="tkc-panel"`
- `className="font-mono text-xs"` → `style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}`

Key token mappings:
- Colors: `var(--tkc-ink)`, `var(--tkc-ink-soft)`, `var(--tkc-paper)`, `var(--tkc-rule)`
- Status: `var(--tkc-emerald)`, `var(--tkc-cinnabar)`, `var(--tkc-amber)`, `var(--tkc-cyan)`
- Spacing: `var(--tk-space-sm)` (8px), `var(--tk-space-md)` (16px), `var(--tk-space-lg)` (24px)
- Typography: `var(--font-display)`, `var(--font-body)`, `var(--font-mono)`
- Panels: `.tkc-panel` class for card-like containers
- Rules: `<hr className="tkc-rule" />` for separators

Work through: dashboard/, details/, pipeline/, events/, shared/, automations/, breakpoint/, review/, notifications/, workspaces/, runs/, sessions/ components, then pages/.

### Task 13: Remove Tailwind config and unused files

- Delete `tailwind.config.*` and `postcss.config.*` if they exist
- Remove Tailwind-related Vite plugins from `vite.config.ts`
- Remove unused path aliases (react-native, etc.)
- Verify no Tailwind utility classes remain in src/

### Task 14: Final verification

- Verify all routes render: /login, /projects, /runs, /sessions, /agents, /workspaces, /inbox, /automations, /settings, /pair-device
- Verify CommandPalette: Cmd+K opens centered overlay, search works, Escape closes
- Verify theme toggle: light ↔ dark works on all pages
- Verify mobile viewport (375px): sidebar collapses, no horizontal overflow

## Reference

- Compendium source: `C:\work\compendium`
- Compendium storybooks: run `npm run storybook` in compendium dir
- Compendium exports: Button, Modal, Drawer, CommandPalette, Tabs, Accordion, Tooltip, Tag, ToastProvider, useToasts, cx, Sidebar, NavItem, Tree, Breadcrumbs, SplitPane, DataTable, Pagination, etc.
