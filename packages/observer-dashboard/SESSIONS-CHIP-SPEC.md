# SESSIONS-CHIP-SPEC — Idle-session chip for the babysitter observer

Status: FROZEN. This document is the SOLE source of truth for test-authoring and
verification of this change. It states behavior and acceptance criteria only — no
code, no file-internal function signatures. If a later change disagrees with this
file, this file wins until a new frozen spec supersedes it.

Date frozen: 2026-07-09

---

## 1. Context (why this change exists)

The observer board shows "runs". A **bare run** is created automatically by the
Claude Code session-start hook: `processId` is `"bare-run"`, it has 0 tasks, and it
has no process. These bare runs are, in truth, **live Claude Code sessions attached
right now** — a useful signal, not junk.

On the owner's machine, 194 of 298 runs are these bare/0-task runs — roughly 65% of
the board — and they flood the "Working" column. Live count at freeze time: total
298, bare/0-task 194, with-tasks 96.

An org panel unanimously ratified the treatment (Option A plus a reframe): keep the
signal, but stop letting it drown the needs-you/alarm surface. Hide these runs from
the board columns by default, surface a single MUTED, secondary chip that counts
them with a reveal toggle, keep every count reconciled (disclosed, never silently
dropped), and relabel the run label "Bare Run" → "Idle session".

The dashboard has a SINGLE counting source (referred to in the codebase as **§15.4**)
whose invariant guarantees that every surface derives its numbers from one
classifier, so no two surfaces diverge. This spec extends that invariant with one new
addend (`sessionCollapsed`) so idle sessions are disclosed, not dropped.

---

## 2. Definitions

- **Idle session (a.k.a. bare run):** a run that matches the AC1 predicate.
- **Board columns:** the primary status columns of the board (e.g. Needs-you /
  Working / Stalled / Done). "Working" here is the in-progress / waiting column that
  today receives the flood.
- **Chip:** the single muted, secondary UI element that displays the idle-session
  count with a reveal toggle.
- **§15.4 invariant:** the single-counting-source reconciliation guarantee (see AC5).

---

## 3. Acceptance criteria

Each criterion is phrased so a test can check it.

### AC1 — PREDICATE (with alarm-safety)
A run is an **idle session** if and only if ALL of the following hold:
1. `processId` equals `"bare-run"` OR is empty/absent; AND
2. it has 0 tasks; AND
3. it has NO pending breakpoint AND NO recorded breakpoint.

The predicate MUST NEVER match a run that has one or more tasks, OR that has a
pending or recorded breakpoint. This is an alarm-safety guarantee: anything that
could need the owner's attention is excluded from the idle-session set and is never
hidden by this feature.

### AC2 — DEFAULT-HIDDEN
By default, idle-session runs do NOT appear in ANY board column. In particular they
are OUT of the Working / in-progress / waiting column (that column was the flood).
A run that is NOT an idle session is unaffected and continues to appear as before.

### AC3 — CHIP
A single **muted, secondary** chip displays the idle-session count with the label
**"⚡ N sessions"**, where N is the exact idle-session count.
- Muted/secondary means it MUST NOT compete visually with the needs-you / alarm
  surface (it is not styled as an alert, brand-primary, or attention color).
- There is exactly ONE such chip (not per-column, not per-run).
- Public-generic: the chip reads sensibly both at small N (e.g. N=3, a stranger) and
  at large N (e.g. N=194, the owner). No hardcoded assumption about scale.

### AC4 — REVEAL
The chip carries a toggle that REVEALS the idle-session runs (making them visible on
the board) and HIDES them again. State is: hidden by default (AC2) → revealed on
toggle → hidden again on toggle. Independently of the toggle, idle-session runs
remain findable via the board's search UNCONDITIONALLY (search is never suppressed by
the default-hidden state).

### AC5 — RECONCILED (no divergence)
Counts never diverge. The §15.4 invariant is EXTENDED with a new addend
`sessionCollapsed` for the idle-session set, so that idle sessions are DISCLOSED in
the reconciliation rather than silently dropped.

- Prior invariant: `pill === column + underNeedsYou + fromHidden + hiddenCollapsed`.
- New invariant: `pill === column + underNeedsYou + fromHidden + hiddenCollapsed + sessionCollapsed`.
- `sessionCollapsed` equals exactly the idle-session count (the same N shown on the
  chip in AC3).
- The Working / in-progress count DROPS by EXACTLY the idle-session count versus
  today's behavior (the flood moves out of the column and into the disclosed
  `sessionCollapsed` addend).
- The invariant MUST hold in both toggle states (hidden and revealed): the total is
  reconciled either way; toggling only changes visibility, not the accounting.

### AC6 — RELABEL
The run label currently shown as **"Bare Run"** (a titleized `processId`) becomes
**"Idle session"** wherever that run's label is displayed (e.g. when revealed or
found via search).

### AC7 — CONTRACT (LAW)
The change is observer-only and read-only. It introduces:
- NO new write path (nothing is written back to runs, processes, or journals);
- NO new dependency;
- NO push / publish / deploy.
It must be public-generic: it works for a stranger with 3 sessions and for the owner
with ~194 sessions, with no owner-specific hardcoding.

---

## 4. Open decision (RESOLVED)

The chip label / reframe variant is **"⚡ N sessions"** — panel recommendation,
owner-ratified 2026-07-09. The run label is **"Idle session"**. No open variants
remain.
