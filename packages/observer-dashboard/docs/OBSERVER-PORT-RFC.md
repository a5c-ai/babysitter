# RFC: Upstreaming a production-proven observer experience

**Status:** Discussion — no code lands until direction is agreed.
**Scope:** `packages/observer-dashboard` only.

## Motivation

A downstream fork of this observer dashboard has been iterated in sustained daily production use, watching hundreds of real runs, and has been independently published to npm. Over that period several capabilities proved their value in day-to-day operation:

- **Fast page loads** on large `.a5c/runs` trees (slimmed run digests + virtualized lists).
- **A working breakpoint experience** — real SDK questions render, answers are recorded correctly, and the UI reflects the true "recorded, awaiting resume" state.
- **Honest liveness** — activity-based freshness derived from journal events, instead of lock files that real runs in practice do not write (which makes lock-based liveness structurally report nothing as active).
- **Counts that match the eye** — reconciled classification so KPIs and column totals equal the rows actually shown, with ghost/incomplete run directories filtered at discovery.
- **A board (kanban) view** for at-a-glance triage of what needs attention.
- **Scheduled-run identification** so cron/forever-style runs read as scheduled rather than as stalled one-shots.
- **Semantic color tokens** — one hue, one meaning; a single action color for the one write the dashboard performs.

This RFC offers those capabilities for upstreaming as a sequence of small, independently reviewable milestones, each re-derived natively in this package's idioms (not cherry-picked from the fork), and asks the maintainers three direction questions before any code is opened.

A hard lesson motivates the shape of this ladder: a correctness-only patch set on the current list shell was fully built and gated green, and still failed a live usability test — the fixes were right, but the experience remained the bottleneck. **Every milestone below therefore ships a user-visible UI slice together with its logic; none is a fixes-only drop.**

## Proposed milestone ladder

Each milestone is independently shippable and reviewable, ships UI + logic together, and respects dependencies (liveness feeds counting; counting feeds the board).

| # | Milestone | User-visible outcome |
|---|---|---|
| 1 | **Perf: slim digest + list virtualization** | First paint and navigation stay fast on large `.a5c/runs` trees (slimmed per-run digest for the list endpoint, virtualized/paginated run list). |
| 2 | **Breakpoint experience + activity-based liveness** | Payload-nested question/options render for real SDK breakpoints; a disk-derived "answer recorded — awaiting resume" state; a double-answer (overwrite) guard. Liveness switches to journal-event freshness (newest event within an activity threshold) instead of lock files, plus a distinct *scheduled* state so sleeping cron/forever runs are not misread as stalled. |
| 3 | **Reconciled counting + ghost-run discovery filter** | KPI totals, health cards, and filters agree with the visible rows; malformed/empty run directories are excluded at discovery so no phantom "working" runs appear. |
| 4 | **Board (kanban) view** | A four-column triage board (needs-attention / working / stalled / done) with keyboard navigation and a view toggle; the list view is retained. Depends on 2 and 3. |
| 5 | **Scheduled-run identifiers/badges** | Scheduled/forever/cron-driven runs get a kind badge and can be grouped or filtered, so they read correctly at a glance. |
| 6 | **Semantic color tokens + UX polish** | One-hue-one-meaning token set in a neutral palette, a single action color for the sole write path, honest read-only copy, and empty/error-state polish. Can fold into 4 if fewer PRs are preferred. |

## Contract every PR would honor

1. **Read-only observation.** The dashboard observes runs; it never mutates, resumes, or executes them.
2. **Package-only.** All changes confined to `packages/observer-dashboard/**` — verifiable from the diff of every PR.
3. **Minimal-posting.** The breakpoint-approval record remains the *sole* write path; no new write surfaces are introduced.
4. **Generic for all users of the package.** No personal-tooling assumptions, no downstream branding or fork-specific styling — neutral tokens, generic copy, behavior driven only by what is on disk.

Each PR would also carry its ported/rewritten tests and an end-to-end check of the milestone's user-visible behavior.

## Direction questions for maintainers

1. **List vs board:** keep the list view as the primary experience and layer these capabilities onto it, or adopt the board view as the default experience (with the list view retained as a toggle)?
2. **Versioning:** a stream of 6.x minors, roughly one per milestone — or a single 7.0 major carrying the board as the headline change?
3. **PR granularity:** one milestone per PR (smaller, faster reviews), or fewer larger PRs that bundle adjacent milestones?

Answers to these determine milestone 4's default-view behavior and the release plan; everything else in the ladder is direction-independent.

## Evidence

A prepared, package-only diff of roughly 1,200 lines already exists as a concrete demonstration of the gap and of contract-safe porting. It contains:

- the breakpoint approve fix — writing `approved: true` plus the SDK-expected `response` key, so approvals actually take effect;
- payload-nested question rendering and the double-answer guard;
- activity-based liveness (journal-event freshness);
- the ghost-run discovery filter.

It applies on top of 6.0.0 with the full test suite green (1074 tests). It is offered here for inspection — it can be attached to this discussion, or opened directly as the first milestone PR once direction is agreed. It is deliberately **not** being shipped unilaterally: the point of this RFC is to agree on the destination before moving code.
