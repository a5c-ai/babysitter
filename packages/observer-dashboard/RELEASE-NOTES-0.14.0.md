# Observer Dashboard 0.14.0 — The kanban board, and counts you can trust

0.14.0 opens the dashboard on a kanban triage board: four honest, disjoint columns that answer "does any run need me right now?" at a glance — plus the same honest-counts, honest-breakpoints, and honest-liveness work that make every badge, count, and label agree with the list behind it.

## Highlights

- **Kanban triage board (default view).** The dashboard now opens on a board with one column per bucket — Needs you / Working / Stalled / Done — plus a first-class **Scheduled** column for runs waiting on a wake/schedule. Cards are compact and chip-gated, columns virtualize, keyboard navigation and a live region for screen readers are built in, and you can toggle back to the flat list per browser.
- **Idle sessions no longer flood Working.** Bare session-start runs (no tasks, no breakpoints) are classified as idle sessions and collapsed by default behind a single muted **"⚡ N sessions"** chip with a reveal toggle — a run with real tasks or a pending/recorded breakpoint is never treated as idle.
- **One source of truth for every count.** Tiles, the counts banner, and filter pills all route through a single `classifyRun` / reconciled-counts source, so a badge and the list it opens can never disagree.
- **Genuinely live work shows as Working.** Liveness is now activity-based (freshness of the newest journal event) instead of relying on a `run.lock` that agent-started runs never write — live work no longer reads as idle or orphaned.
- **Honest breakpoint cards — write-path truth.** Answering a breakpoint from the dashboard only records the answer to disk (`result.json` + one `EFFECT_RESOLVED`); it never runs the orchestrator. Cards show a recorded state, keep an answered-but-unapplied run in "Needs you" until a driver actually applies it, and carry the full breakpoint question.
- **The redundant top "needs you" list is gone.** The counts banner and the kanban Needs-you column are now the only needs-you surfaces — per owner feedback that a separate top list just duplicated them.
- **Lighter API payloads.** `/api/runs` now returns lightweight digests by default instead of full parsed runs, cutting the board/flat-list response for 500 runs from ~35MB to under 1MB.
- **`--watch-dir` merges, not replaces; `~/.a5c/runs` always watched.** An explicit `--watch-dir` now merges with the sources saved via Settings (`~/.a5c/observer.json`) instead of dropping them on restart.
- **Real version in the footer.** `/api/version` re-detects the babysitter CLI version (5-minute TTL + idle refresh), so long-lived dashboards reflect CLI upgrades.
- **No ghost runs.** Stray folders under a runs dir no longer render as fake "Unknown / 0 tasks" runs, human-named run ids stay readable, and ages over 48h display in days ("16d 4h").
- **UX-R3 color discipline.** Magenta is brand-only; a distinct indigo-violet `--action` hue carries the single interactive submit; status tokens are one-hue-one-meaning across the board.
- **Accessibility.** Proper list/board semantics, ARIA roles and labels, screen-reader announcements for copy and loading, decorative icons hidden from assistive tech.

## Upgrade

```bash
npx -y @a5c-ai/babysitter-observer-dashboard@latest --port 4800
```

Note: after upgrading, an explicit `--watch-dir` also loads your persisted `~/.a5c/observer.json` sources (merge semantics) — you may see more projects and runs than before. That is the fix, not a bug.

Full details in [CHANGELOG.md](./CHANGELOG.md#0140---2026-07-10).
