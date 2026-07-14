# RFC: Concrete deltas vs the current observer-dashboard package

**Status:** Discussion — no code lands until direction is agreed.
**Scope:** `packages/observer-dashboard` only.

## Motivation

A downstream fork of this dashboard has been iterated in sustained daily production use watching hundreds of real runs, and has been independently published to npm. This RFC offers the capabilities that proved themselves there for upstreaming. The whole document is organized around one thing: **exactly what would change versus this package as it is today**, stated per capability.

## What changes vs the current package

Each row states the current behavior of this package (verified against the source in this repo), the proposed behavior, and why the delta matters in operation.

| Capability | Current behavior (this package today) | Proposed behavior | Why it matters |
|---|---|---|---|
| **Breakpoint approval** (the dashboard's one write path) | The approve action (`src/app/actions/approve-breakpoint.ts`) writes `tasks/<effectId>/result.json` containing `{ answer, approvedAt, approvedBy }` — no `approved: true` flag, and the answer sits under a key the SDK runtime does not read. Nothing prevents a second submit from silently overwriting a recorded answer. | Write `approved: true` plus the SDK-expected `response` key (keeping the existing fields for display), and add a double-answer/overwrite guard so a recorded answer cannot be silently clobbered. | Today the runtime reads an approval as **not approved** and drops the answer — the dashboard's single write path does not actually take effect. This closes the loop: approve in the UI, the run resumes with the answer. |
| **Breakpoint question rendering** | The parser (`src/lib/parser.ts`) reads top-level `inputs.question`. Real SDK breakpoints nest their data under `inputs.payload.*`, so real runs fall through to the generic `"Approval required"` fallback with no question text and no options. | Read `inputs.payload.*` with a top-level fallback, so real questions and options render. After an answer is recorded, show a disk-derived **"answer recorded — awaiting resume"** state instead of leaving the breakpoint looking pending. | Operators can see *what* they are approving, choose among the actual options, and — after answering — see the true state (recorded, not yet resumed) rather than a breakpoint that appears stuck. |
| **Liveness** | Status is derived purely from journal events (`pending` / `waiting` / `completed` / `failed`), with a single staleness timestamp (default 1 h `staleThresholdMs`) as the only freshness signal. There is no "actively working" state: an in-flight run is indistinguishable from an abandoned one until the stale threshold trips, and sleeping cron/forever-style runs read as stalled one-shots. | Activity-based liveness derived from newest-journal-event freshness within a configurable threshold (`activeThresholdMs`), plus a distinct **scheduled** state for sleeping cron/forever runs. Deliberately journal-derived rather than lock-file-derived: downstream production experience shows real runs do not reliably write lock files, so any lock-based liveness structurally reports zero working runs. | "What is working *right now*" becomes answerable at a glance; scheduled runs stop polluting the stalled bucket; working counts reflect reality instead of conflating executing and abandoned runs. |
| **Run discovery** | Every subdirectory of a `.a5c/runs` source is treated as a run (`src/lib/source-discovery.ts`). A `run.json` check exists only as a tie-breaker when the same run id appears under multiple sources — a ghost/never-started directory still surfaces as a run. | Keep a candidate directory only if it has a `run.json` **or** a `journal/` directory. | No phantom rows, no phantom counts: everything the dashboard shows corresponds to a run that actually started (or was at least materialized by the SDK). |
| **Counting** | KPI totals (project summaries, digest counters) are computed on a separate path from the visible list rows, so pills, tiles, and column counts can disagree with the rows actually shown. | One reconciled classification source consumed by all surfaces — pills, tiles, and columns always equal what is visibly listed. | Trust. A dashboard whose numbers do not match its rows trains operators to stop believing it; reconciled counts make every number auditable by eye. |
| **Performance** | The list endpoint strips journal events but still ships full task payloads per run, so responses grow with the runs tree and first paint slows on large `.a5c/runs` trees. | Slimmed per-run digests for list surfaces, plus pagination/virtualization of the run list. | First paint and navigation stay fast at hundreds of runs — the scale at which an observer dashboard is most needed. |
| **Triage UX** | List-only. | An **optional** board (kanban) view for at-a-glance triage — the list view is retained — plus scheduled-run badges and semantic color tokens (one hue = one meaning; a single action color for the sole write path). | Attention routing: what needs a human, what is working, what is stalled, and what is done are separable at a glance instead of by reading rows. |

The first three rows are correctness deltas (the current behavior is wrong against the SDK's on-disk contract); the next three are honesty/scale deltas; the last is an additive UX option.

## Delivery

- **Small, independently reviewable milestone PRs**, roughly one delta row (or one pair of tightly coupled rows) each, in dependency order: approval + question rendering first, then liveness, then discovery + counting, then performance, then triage UX.
- **Every milestone ships UI and logic together.** A hard downstream lesson motivates this: a correctness-only patch set was fully built and gated green, and still failed a live usability test — the fixes were right, but the experience remained the bottleneck. No milestone here is a fixes-only drop.
- **Fresh re-derivation, not cherry-picks.** Each change is re-implemented natively in this package's idioms (parser, cache, services, component conventions), with tests written against this package — not transplanted fork commits.
- **Contract on every PR:**
  1. **Read-only observation** — the dashboard never mutates, resumes, or executes runs.
  2. **Package-only** — all changes confined to `packages/observer-dashboard/**`, verifiable from each diff.
  3. **Minimal-posting** — the breakpoint-approval record remains the *sole* write path; no new write surfaces.
  4. **Generic for all users** — no downstream branding or fork-specific assumptions; neutral tokens, generic copy, behavior driven only by what is on disk.

## Evidence

A prepared, package-only diff of roughly 1,200 lines already exists covering the first three delta rows (breakpoint approval, question rendering + the double-answer guard, activity-based liveness, plus the ghost-run discovery filter). It applies on top of 6.0.0 with the full test suite green (1,074 tests). It can be attached to this discussion for inspection, or opened directly as the first milestone PR once direction is agreed. It is deliberately not being shipped unilaterally — the point of this RFC is to agree on the destination before moving code.

## Open questions (input welcome)

1. **Versioning:** a stream of 6.x minors (roughly one per milestone), or a single 7.0 major?
2. **PR granularity:** one delta row per PR (smaller, faster reviews), or fewer larger PRs bundling adjacent rows?
3. **Board default:** should the board view eventually become the default experience (with the list retained as a toggle), or stay an opt-in view? This only affects the final milestone — everything above it is view-independent.
