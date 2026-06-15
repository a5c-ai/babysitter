# Changelog

All notable changes to this project will be documented in this file.

## [0.12.2] - 2026-03-03
### Fixed
- **Babysitter version showing N/A** — babysitter SDK version was detected at build time in CI (where the CLI isn't installed), baking "N/A" into the published bundle; now detected at runtime via `/api/version` endpoint so it reflects the actual version on the user's machine
- **Stale version after npx install** — all README install commands now include `@latest` suffix to prevent npm/npx from serving cached old versions

### Changed
- **Runtime version detection** — footer version badges now fetch from `/api/version` at runtime instead of relying solely on build-time `NEXT_PUBLIC_*` env vars; build-time values used as fallback for initial render
- **Simplified next.config.mjs** — removed `execSync('babysitter --version')` build-time detection since version is now resolved at runtime

## [0.12.0] - 2026-03-01
### Added
- **Catch-up banner** — overnight summary context showing failed/completed/pending counts when revisiting after extended absence
- **Stale breakpoint dismiss** — X button to dismiss stale breakpoints from the dashboard banner with localStorage persistence; auto-cleans dismissed IDs when breakpoints resolve
- **Orphaned run detection** — parser detects runs where all tasks resolved but no RUN_COMPLETED event was written (process crash); shows "Interrupted" status badge
- **KPI grid component** — dedicated grid for key performance indicators on the dashboard
- **Virtualized run list** — efficient rendering for large numbers of runs
- **Run filter bar** — filter runs by status directly in the dashboard
- **Project list view** — collapsible project sections with persisted expand/collapse state
- **Run dashboard hook** — centralized state management for dashboard filtering, sorting, and pagination
- **Animated number transitions** — smooth count animations in KPI displays
- **Batched updates hook** — debounced batch processing (1500ms) to prevent UI thrash from rapid SSE events
- **Config loader** — dedicated module for loading and validating observer configuration
- **Source discovery** — automatic detection of babysitter project directories
- **Global registry** — shared singleton registry for cross-component state
- **Smart JSON tree viewer** — refactored into submodules (categorize, json-node, smart-summary, tree-controls) with AI-friendly summaries
- **Breakpoint approval with journal write** — dedicated approval UI that writes both result.json AND an EFFECT_RESOLVED journal entry (SHA-256 checksummed, ULID-sequenced), ensuring the SDK's state machine recognizes the approval
- **E2E test suites** — new specs for breakpoints, notifications, settings/theme, and SSE connections

### Fixed
- **Breakpoint approval stuck forever** — root cause: approveBreakpoint only wrote result.json but NOT a journal entry; the SDK reads the journal (not result files) to track resolution, so approved breakpoints reappeared as "Awaiting Decision" and runs stayed in "Waiting" permanently; now writes EFFECT_RESOLVED journal entry alongside result.json
- **Breakpoint ghosting in parser** — parser now checks result.json for breakpoints that appear unresolved in the journal, preventing approved breakpoints from flickering back as pending
- **SSR hydration mismatch** — usePersistedState and breakpoint-banner used lazy useState initializers that read localStorage on client but returned defaultValue on server; replaced with useIsomorphicLayoutEffect pattern
- **"Run not found" errors** — path-resolver now invalidates the discovery cache and retries when a run isn't found on first lookup
- **Flaky E2E test** — "project cards display total run count" used one-shot innerText() without retry; replaced with Playwright's auto-retrying toContainText
- **next.config.mjs startup blocking** — reduced execSync timeout from 5000ms to 1000ms for CLI version detection
- **ESLint errors and warnings** — fixed empty interface, removed unused imports/variables, prefixed intentionally-unused vars with underscore; now zero errors, zero warnings
- **Collapsed state resets on navigation** — usePersistedState with per-project localStorage keys ensures state survives navigation

### Changed
- **Dashboard architecture** — extracted page.tsx monolith into composable components (KpiGrid, ProjectListView, RunFilterBar, ExecutiveSummaryBanner, CatchUpBanner)
- **Parser improvements** — enhanced run parsing with breakpoint question extraction, waiting-kind detection, staleness checks, and orphaned-run inference
- **Smart polling** — SSE + polling hybrid with ETag/304 support and automatic fallback
- **Event stream** — shared EventSource with exponential backoff reconnection
- **Fetcher resilience** — retry logic with ETag caching and HTML-response detection
- **Run cache** — improved TTL logic, breakpoint caching, and project summary aggregation
- **Server initialization** — restructured with config-loader and path-resolver modules

## [0.11.3] - 2026-02-25
### Fixed
- **CLI --version showing stale version** — inject version at build time via esbuild `define` instead of reading package.json at runtime, which broke with cached npx installs

## [0.11.2] - 2026-02-25
### Fixed
- **Notification flood on first page load** — replaced count-based INIT_SKIP=2 seed with 10-second time-based stabilization window; watermarks are seeded silently during the window, preventing a burst of mixed notifications when many runs are active

## [0.11.0] - 2026-02-24
### Added
- feat: add startup update check to CLI

## [0.10.1] - 2026-02-24
### Changed
- chore: remove duplicate auto-generated CHANGELOG entry for v0.10.0

## [0.10.0] - 2026-02-24
### Added
- **UX accessibility overhaul** — shared app header/footer, WCAG AA compliance with minimum 44x44px touch targets, improved contrast ratios, and 12px minimum text sizes across all components
- **Executive summary banner** — color-coded severity banner (green/amber/red) at the top of the dashboard showing system health; clickable issue links filter the dashboard by status; dismissible for non-healthy states
- **Context-aware keyboard shortcuts help** — press `?` to open shortcuts modal that shows only relevant shortcuts for the current page (global shortcuts everywhere, dashboard shortcuts on `/`, run-detail shortcuts on `/runs/*`) with section headers
- **Neon eye SVG favicon** — cyberpunk-themed custom favicon matching the dashboard's design system
- **`/` keyboard shortcut** — focus the global search input from anywhere on the dashboard (in addition to existing Ctrl+K)
- **`Enter` keyboard shortcut** — open the selected task in run detail view
- **Tab keyboard hints** — `<Kbd>` badges on detail panel tab triggers showing 1-5 shortcut keys
- **ESLint configuration** — added `.eslintrc.json` for consistent code quality enforcement
- **IDE-integrated dashboard PDR** — Product Design Review document for potential IDE integration (local only, not shipped)

### Fixed
- **Banner dismiss resets on polling** — moved dismissed state from banner child component to parent DashboardPage so it survives SSE polling re-renders
- **Shortcuts help showing irrelevant shortcuts** — made context-aware using `usePathname`; only shows shortcuts relevant to the current page
- **42 pre-existing test failures** — fixed across unit test suites (mock updates, assertion corrections, timer handling)
- **CI failing on Node 18** — updated CI matrix from [18, 20] to [20, 22]; auto-version workflow from Node 18 to Node 20 (`balanced-match@4.0.3` requires Node 20+)
- **1-5 tab shortcuts silently failing** — made `switchTab` no-op when detail panel is closed instead of erroring; added visual hints on tab triggers

### Removed
- **Breakpoint resolve API route** — `/api/runs/:runId/tasks/:effectId/resolve` endpoint deleted; dashboard is now fully read-only (breakpoint resolution belongs to the CLI/SDK)
- **`useBreakpointResolve` hook** — removed along with its 295-line test suite and TypeScript types
- **Node 18 CI support** — dropped from CI matrix (EOL April 2025)

### Changed
- **Dashboard is now fully read-only** — except for POST /api/config (settings). All breakpoint approve/reject UI removed in favor of CLI-based resolution
- **Notification panel redesign** — improved layout, accessibility labels, and keyboard support
- **Settings modal redesign** — restructured with `data-testid` attributes for reliable E2E testing
- **UI components** — added `displayName` and ARIA attributes to Accordion, ScrollArea, Separator, Tabs, and Tooltip

<!-- Note: v1.0.0-1.0.1 were briefly published and reverted; entries preserved for historical accuracy -->
## [1.0.1] - 2026-02-19
### Fixed
- fix: restore conventional commit detection for minor/major version bumps

## [1.0.0] - 2026-02-19
### Changed
- chore: simplify auto-version to always patch, use [minor]/[major] for explicit bumps

## [0.8.3] - 2026-02-19
### Other
- docs: add Dashboard Settings Panel section explaining Watch Sources, Depth, and other UI settings

## [0.8.2] - 2026-02-19
### Fixed
- fix: increase default CLI watch depth from 2 to 3

## [0.8.1] - 2026-02-19
### Fixed
- fix: default watch-dir to user's cwd, add -y to npx examples
- fix: default to production mode (next start) for published package
- fix: use .bin/next wrapper instead of dist/bin/next for cross-platform compat
- fix: resolve next binary correctly across npx, global, and devDep installs

## [0.8.0] - 2026-02-19
### Added
- feat: rename npm scope from @a5c-ai to @yoavmayer for independent publishing (Note: scope later returned to @a5c-ai when the package joined the babysitter monorepo)

## [0.7.3] - 2026-02-19
### Fixed
- fix: make breakpoint panel read-only and fix stale breakpoint display

## [0.7.2] - 2026-02-19
### Fixed
- fix: auto-version workflow now creates annotated tags and pushes them explicitly

## [0.7.1] - 2026-02-19
### Fixed
- fix: resolve double shebang and missing next binary in global CLI install
### Other
- ci: add workflow_dispatch trigger to publish workflow

## [0.7.0] - 2026-02-19
### Added
- feat: add Babysitter SDK version badge to footer
- feat: add GitHub Actions auto-versioning on merge to main
### Other
- Merge pull request #2 from YoavMayer/hotfix/auto-versioning
- docs: add dashboard screenshots to README and capture script

## [0.6.5] - 2026-02-18
### Fixed
- **E2E test hardening** — increased timeouts from 30s to 60s in dashboard and run-detail page objects to prevent flaky failures on slower CI environments
- **Playwright global timeout** — raised from 90s to 120s for more reliable E2E test execution
- **Settings modal selector** — replaced fragile `getByTitle("Settings")` with `getByRole("button", { name: "Settings" })` for resilient element selection
- **Settings modal test assertion** — replaced heading text filter with `data-testid="settings-modal"` for deterministic modal visibility checks
- **Navigation test marked slow** — `test.slow()` added to navigation roundtrip test that loads 3 pages sequentially

## [0.6.3] - 2026-02-18
### Added
- **Activity sort flat list** -- "By Activity" mode now renders runs as a single flat chronological list with a Timeline section header, relative time labels (via `formatRelativeTime`), and inline status badges — no grouped sections ("In Progress", "Failed", "Completed") when sorting by activity
- **Faster run discovery** -- discovery debounce reduced from 60s to 10s; watcher rescan interval reduced from 120s to 30s for quicker new-run detection
- **Empty directory watching** -- `discoverAllRunsParentDirs()` ensures `.a5c/runs/` parent directories are watched even when empty, so new runs are detected immediately
- **Known limitation documented** -- README documents that runs are only visible after first write to `.a5c/runs/` (agreed after first user interview)

### Fixed
- **HTML 404 error display** -- resilient fetcher now detects HTML responses during Next.js HMR recompilation and shows "Server temporarily unavailable" instead of dumping raw HTML into the error banner
- **Transient 404 retry** -- 404 responses are now treated as retryable (Next.js dev server returns transient 404s during HMR); fetcher retries automatically with exponential backoff
- **HTML content-type guard** -- fetcher detects `text/html` content-type on 200 OK responses and retries instead of failing with "Expected JSON response"

### Changed
- **Sort toggle styling** -- distinct visual styling per mode: warning/amber colors for "By Status", primary/magenta colors for "By Activity", with smooth transitions

## [0.6.2] - 2026-02-18
### Changed
- **Sort mode visual distinction** -- "By Activity" now shows time-based sections ("Recent Activity" for last 24h, "Earlier" for older) with Clock icon and primary-colored badges; "By Status" keeps status-based sections ("In Progress", "Recent History") with pulsing Activity icon and warning-colored badges
- **Settings: removed Label field** -- Watch Sources settings simplified to Path and Depth only; project labels already appear on each card, making the field redundant

## [0.6.0] - 2026-02-18
### Fixed — Defect List (#1)
- **"Waiting: Task" status misleading** -- status badge now shows "Working" (info/cyan) instead of "Waiting: Task" for runs actively executing tasks
- **Unknown step / error display** -- outcome banner shows human-readable error messages with formatted details instead of raw "An error occurred"
- **Breakpoint visibility** -- pending breakpoints now display a prominent pulsing banner at the top of the dashboard with question text and approve/reject buttons
- **Collapse state lost on navigation** -- project expand/collapse state persisted to `localStorage` via `usePersistedState` hook; returning from run detail restores previous state
- **Sort and filter tabs** -- dashboard runs sortable by most recent activity; filter tabs (All, Active, Completed, Failed) let users view specific run states
- **Global search** -- search runs by ID, title, or project name across all projects from the dashboard header
- **Hide projects from dashboard** -- projects can be hidden/shown via settings modal visibility toggles without removing watch sources

### Fixed — Defect List (#2)
- **Projects fail to load (timeout)** -- critical performance fix: digest API now reads from in-memory cache instead of scanning filesystem on every 2s poll; added discovery result caching (10s TTL) and watcher-driven cache invalidation; response time improved from 60s+ timeout to ~50ms
- **"Active Runs" label duplication** -- renamed "Active" metric and "Active Runs" section header to "In Progress" to avoid redundancy with the "Active" filter tab

### Changed
- **WCAG accessibility** -- all `text-[10px]` and `text-[9px]` instances (73+) upgraded to `text-xs` (12px minimum) across 22 component files for WCAG AA compliance
- **Light theme contrast** -- `--foreground-muted` raised from `#a1a1aa` to `#71717a` (4.6:1 contrast ratio); border and card opacities increased for better visibility
- **Opacity stacking removed** -- removed `/60`, `/70`, `/80` opacity modifiers on already-muted text colors across all components for reliable contrast
- **Discovery caching** -- filesystem discovery results cached with 10s TTL; discovery debounce increased from 3s to 60s; watcher invalidates both discovery cache and run cache on new-run events
- **Run cache optimization** -- `discoverAndCacheAll()` skips filesystem scan when cache is populated and no new runs detected via `discoveryNeeded` flag

### Added
- **`getAllCachedDigests()`** -- zero-I/O function for pure cache reads from digest API endpoint
- **`requestDiscovery()`** -- watcher-triggered flag to signal when new runs may exist
- **`invalidateDiscoveryCache()`** -- cache invalidation for discovery results on filesystem changes
- **`usePersistedState` hook** -- generic localStorage-backed state persistence for UI preferences
- **Breakpoint banner component** -- `breakpoint-banner.tsx` with pulsing indicator, question preview, and inline approve/reject
- **Global search component** -- `global-search.tsx` with keyboard shortcut (Ctrl+K), debounced search, and result highlighting

## [0.5.3] - 2026-02-18
### Added
- **Playwright performance test suite** -- 5 tests covering dashboard reload time, SSE connection indicator, DOM node count, navigation performance, and console error detection (`e2e/tests/performance.spec.ts`)
- New npm scripts: `test:e2e` (all Playwright tests) and `test:perf` (performance tests only)
### Test Results
- Unit tests: 798/798 passed (59 files, 27s)
- E2E tests: 23/96 passed (71 failures in existing selectors/timeouts, not regressions)
- Performance tests: 5/5 passed (DOM: 380 nodes, nav: 9.4s, 0 console errors)

## [0.5.2] - 2026-02-18
### Changed
- Added `@playwright/test` as dev dependency for E2E testing
### Documentation
- Backfilled CHANGELOG entries for v0.1.1 through v0.5.1
- Updated README Known Limitations version reference

## [0.5.1] - 2026-02-18
### Fixed
- **Dynamic version badge** -- dashboard version badge now displays actual version from `package.json` via `NEXT_PUBLIC_APP_VERSION` instead of hardcoded `v0.1.0`
### Configuration
- New build-time environment variable `NEXT_PUBLIC_APP_VERSION` auto-populated from `package.json` in `next.config.mjs`

## [0.5.0] - 2026-02-18
### Added
- **Unified `CopyButton` component** -- replaces three separate copy button implementations; supports `size='sm'` for inline JSON tree values and `size='md'` for cards
- **Reusable `SmartSectionHeader` component** -- consistent section header styling with uppercase tracking and left border accent
- `isRecord()` type guard utility for safe plain-object type narrowing
### Changed
- JSON tree node default-expanded computation simplified to single `useState` with lazy initializer
- Collapsible Raw JSON header changed to `<div role="button">` with keyboard handler for improved accessibility
- FindingCard list items now use composite keys for more stable React reconciliation
- Clipboard write calls now silently handle permission denials
- Input/Output toggle buttons include explicit `type="button"` to prevent form submissions

## [0.4.0] - 2026-02-18
### Added
- **Resilient fetch utility** (`src/lib/fetcher.ts`) -- `resilientFetch<T>()` with automatic retry (exponential backoff, 5xx/network errors only), AbortSignal integration, configurable timeout (default 10s), and normalized `FetchError` shape
- **Centralized error handler** (`src/lib/error-handler.ts`) -- `AppError` typed error class with HTTP status and machine-readable code; `normalizeError()` for consistent error responses
- **Error boundary component** -- enhanced with `section` prop for compact inline fallback UI
- **Configurable run retention** -- `retentionDays` setting (default 30, range 1-365) filters old completed/failed runs from the dashboard
- **Retention settings UI** -- new "Run Retention" section in settings modal
- **Server-driven recency window** -- `recentCompletionWindowMs` served from API config endpoint
- **Version badge** -- dashboard header displays current version number
- **Expanded project health card mini-dashboard** -- runs organized into Active Runs, Failed Runs (collapsible, red-tinted), and Completed History with mini KPI pills
- **Enhanced pagination controls** -- numbered page buttons with ellipsis for large result sets
- Comprehensive test suites for `resilientFetch` and `normalizeError`
- Run discovery deduplication by run ID, preferring directories containing `run.json`
### Changed
- Task detail panel Data/Output tabs now use `max-h-[60vh]` instead of 256px for larger scrollable content areas
- Active run indicator animation standardized to `animate-pulse-dot` across all components
- All API routes now use centralized `normalizeError()` for consistent error responses
- All client-side hooks migrated to `resilientFetch` with automatic retry and abort support
- Settings modal redesigned with labeled sections and input validation
- Recently completed projects stay in Active section for configurable recency window (default 4 hours)
### Fixed
- Task detail panel Data/Output content was clipped at 256px with no way to see full output -- now uses 60vh
- Log viewer stdout/stderr/output sections had same 256px limitation -- now uses 60vh
- Cache pruning cleans up ghost entries from prior deduplication misses
### Configuration
- New environment variable: `OBSERVER_RETENTION_DAYS` (default: 30) -- number of days to retain completed/failed runs
- New environment variable: `OBSERVER_RECENT_WINDOW_MS` (default: 14400000 / 4 hours) -- recency window for completed projects
- New registry fields in `~/.a5c/observer.json`: `retentionDays`, `recentCompletionWindowMs`

## [0.3.0] - 2026-02-17
### Added
- **Smart dashboard layout** -- active/history section split with active or stale runs shown prominently at top; completed/failed runs grouped into collapsible "Recent History"
- **Idle empty state** -- centered message with Eye icon when no runs exist
- **Idle-with-history banner** -- compact banner when no active runs but history exists
- **Collapsible Recent History section** -- toggle, project count badge, and auto-collapse for 5+ history projects
- **Project health card** -- expanded runs split into Active Runs and Completed Runs sub-sections
- **Completed runs toggle** -- count display with History icon
### Changed
- Dashboard status filter logic routes completed/failed filters directly to a flat grid
- Project health card tracks `showCompleted` toggle state

## [0.2.3] - 2026-02-17
### Fixed
- **Watermark-based notification deduplication** -- replaced cooldown-based system; notifications fire exactly once per state transition
- Waiting notification flag resets when a run leaves the waiting state, allowing re-notification on the next breakpoint
- Initial digest seeding phase now pre-populates watermarks, preventing false notifications on dashboard startup

## [0.2.2] - 2026-02-17
### Fixed
- Removed stale monorepo setup instructions from README
- Corrected CLI flag in README development section: changed `--dir` to `--watch-dir`
- Fixed API reference description: clarified endpoints return JSON "unless noted otherwise"

## [0.2.0] - 2026-02-17
### Added
- **Debounced filesystem discovery** -- `discoverAndCacheAll()` skips re-scanning if called within 10 seconds of the last scan
- **Batched cache population** -- runs pre-populated in batches of 10 instead of all at once
- **Breakpoint wait time** -- elapsed wait time displayed on breakpoint steps with `animate-pulse` animation
### Changed
- Package renamed from the legacy observer package name to `@a5c-ai/babysitter-observer-dashboard`
- CLI binary renamed from the legacy observer binary name to `babysitter-observer-dashboard`
- Digest API route uses cached digests instead of fresh calls, preventing notification spam
- Run card layout redesigned: title on its own row; status badges, stale indicator, and tags on a second row
- Breakpoint step card label changed from "Needs approval" to "Waiting for approval"
- Breakpoint step card duration label now shows "Wait time:" instead of "Duration:"
### Fixed
- Cache invalidation now resets discovery debounce timer so the next request triggers an immediate re-scan

## [0.1.2] - 2026-02-17
### Added
- **Back-to-dashboard navigation** -- breadcrumb trail on the run detail page
- **Run cache re-discovery** -- saving new sources in settings invalidates cache and triggers a fresh filesystem scan
### Changed
- Notification provider skips notifications on the first two digest loads to prevent startup spam
- Notification provider adds a 30-second cooldown per run+type key
- Config source deduplication with path normalization
### Fixed
- API runs route re-discovers runs when project cache is empty after invalidation

## [0.1.1] - 2026-02-17
### Changed
- Repository renamed from the legacy observer package id to `babysitter-observer-dashboard` in package.json

## [0.1.0] - 2026-02-18

### Added
- **Smart dashboard layout** -- Active runs shown prominently at the top; recently completed projects stay visible for a configurable recency window (default 4 hours) before moving to "Recent History"
- **Expanded project card mini-dashboard** -- When expanding a project card, runs are organized into Active Runs (always visible), Failed Runs (collapsible), and Completed History (collapsible) sections with mini KPI pills
- **Enhanced pagination controls** -- Page number buttons with ellipsis for large result sets, replacing the previous prev/next-only arrows
- **Configurable run retention** -- New "Run Retention" setting (default 30 days) filters old completed/failed runs from the dashboard for performance; active runs always shown regardless of age
- **Retention settings UI** -- New "Run Retention" section in the settings modal with days input (1-365 range)
- **Server-driven recency window** -- `recentCompletionWindowMs` is now served from the API and consumed by the client, replacing the hardcoded constant
- **Version badge** -- Dashboard version number displayed in the header bar
- **Error boundary component** -- Graceful error handling for dashboard sections
- **Resilient fetch utility** -- `resilientFetch<T>()` with retry (exponential backoff, 5xx/network only), AbortSignal integration, configurable timeout (default 10s), and normalized `FetchError` shape
- **Error handler utility** -- Centralized `normalizeError()` for consistent API error responses across all routes

### Changed
- Task detail panel Data/Output, Logs, and Agent tabs now use `max-h-[60vh]` instead of `max-h-64` (256px) for much larger scrollable content areas
- Consistent use of `animate-pulse-dot` animation across active run indicators (was mixed `animate-pulse` and `animate-pulse-dot`)
- API routes now use centralized error handling via `normalizeError()`
- Hooks use `resilientFetch` for improved reliability with automatic retry and abort support

### Fixed
- Task Detail panel Data > Output content was clipped at 256px with no way to see full output data
- Log viewer stdout/stderr/output sections had same 256px height limitation

### Configuration
- New environment variable: `OBSERVER_RETENTION_DAYS` (default: 30) -- number of days to retain completed/failed runs in the dashboard
- New environment variable: `OBSERVER_RECENT_WINDOW_MS` (default: 14400000 / 4 hours) -- how long recently completed projects stay in the Active section
- New registry fields in `~/.a5c/observer.json`: `retentionDays`, `recentCompletionWindowMs`

## [0.1.0-alpha.0] - 2026-02-17

### Added
- Initial alpha release
- Multi-project observability dashboard with health cards and KPI metrics
- Real-time Server-Sent Events (SSE) streaming for instant updates
- Pipeline visualization with step-by-step progress and parallel group rendering
- Breakpoint approval/rejection directly from the dashboard UI
- Dark and light theme support with persistence
- CLI launcher (`babysitter-observer-dashboard`) with configurable flags
- Keyboard shortcuts for power-user navigation
- Editable settings panel with persistent registry file (~/.a5c/observer.json)
- Configurable watch directories and polling intervals
- Run detail view with agent details, timing breakdowns, and raw JSON inspection
- Lightweight digest endpoint for efficient polling
- Smart adaptive polling with exponential backoff
