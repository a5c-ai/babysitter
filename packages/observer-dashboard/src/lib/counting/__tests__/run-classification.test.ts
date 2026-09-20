/**
 * SINGLE counting source — invariant tests (SPEC-vibekanban §15.6 AC-69..AC-77,
 * owner gate 2026-07-06b hidden model A). Proves that every pill reconciles
 * with its board column plus disclosed deltas:
 *
 *     pill(S) === column(S) + underNeedsYou(S) + fromHidden(S) + hiddenCollapsed(S)
 *
 * across fixture sets that include hidden projects, an overlapping
 * (orphaned === stale) set, absorbed needs-you runs, and a
 * recordedAwaitingResume run whose pendingBreakpoints has dropped to 0.
 */

import { describe, it, expect } from "vitest";
import type { Run } from "@/types";
import type { LightRun } from "@/lib/services/run-query-service";
import {
  classifyRun,
  computeReconciledCounts,
  metricsFromReconciled,
  // SESSIONS-CHIP-SPEC (frozen 2026-07-09) AC1/AC5: idle-session predicate +
  // the §15.4 reconciliation extension. These exports do NOT exist until the
  // sessions-chip wave lands — importing them now is the intended red step.
  isIdleSession,
  type PillStatus,
} from "@/lib/counting/run-classification";

const RECENT = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

let seq = 0;
function makeRun(overrides: Partial<LightRun> = {}): LightRun {
  seq += 1;
  const base: Omit<Run, "events"> = {
    runId: `01RUN${String(seq).padStart(19, "0")}`,
    processId: "proc",
    status: "waiting",
    createdAt: RECENT,
    updatedAt: RECENT,
    tasks: [],
    totalTasks: 1,
    completedTasks: 0,
    failedTasks: 0,
    projectName: "visible",
  };
  return { ...base, events: [] as never[], totalEvents: 0, ...overrides } as LightRun;
}

const ALL_STATUSES: PillStatus[] = [
  "all",
  "waiting",
  "needsyou",
  "orphaned",
  "stale",
  "completed",
  "failed",
];

/**
 * The invariant every reconciled count must satisfy, by construction.
 *
 * SESSIONS-CHIP-SPEC AC5: the §15.4 invariant is EXTENDED with a new addend
 * `sessionCollapsed` so idle sessions are DISCLOSED in the reconciliation
 * rather than silently dropped. Prior addends unchanged; this is the sanctioned
 * extension. `sessionCollapsed` is 0 on every count that has no idle sessions,
 * so the existing (non-session) fixtures still reconcile once the field lands.
 */
function assertInvariant(runs: LightRun[], hiddenProjects?: Set<string>) {
  const counts = computeReconciledCounts(runs, { hiddenProjects });
  for (const s of ALL_STATUSES) {
    const c = counts[s];
    expect(
      c.column + c.underNeedsYou + c.fromHidden + c.hiddenCollapsed + c.sessionCollapsed,
      `pill(${s}) must equal column+underNeedsYou+fromHidden+hiddenCollapsed+sessionCollapsed`
    ).toBe(c.pill);
  }
  return counts;
}

describe("classifyRun — single producer (AC-69)", () => {
  it("classifies recordedAwaitingResume (pendingBreakpoints=0) as needsYou for BOTH pill and column", () => {
    const run = makeRun({
      status: "waiting",
      pendingBreakpoints: 0,
      recordedAwaitingResume: true,
      driver: "none",
    });
    const c = classifyRun(run);
    expect(c.needsYou).toBe(true);
    expect(c.column).toBe("needsyou");
    const counts = computeReconciledCounts([run]);
    expect(counts.needsyou.pill).toBe(1);
  });

  it("a stale run with no lock is BOTH orphaned and stale (overlap), column=orphaned", () => {
    const run = makeRun({ status: "waiting", isStale: true, driver: "none" });
    const c = classifyRun(run);
    // Raw overlapping flags: orphaned wins precedence, so stale flag is false
    // here but the stale PILL predicate still counts it (isStale===true).
    expect(c.orphaned).toBe(true);
    expect(c.column).toBe("orphaned");
  });

  it("terminal runs are never needsYou/orphaned even with residual pendingBreakpoints", () => {
    const run = makeRun({ status: "completed", pendingBreakpoints: 2 });
    const c = classifyRun(run);
    expect(c.needsYou).toBe(false);
    expect(c.orphaned).toBe(false);
    expect(c.terminal).toBe(true);
    expect(c.column).toBe("completed");
  });
});

describe("computeReconciledCounts — the invariant holds by construction", () => {
  it("empty input yields all-zero counts satisfying the invariant", () => {
    const counts = assertInvariant([]);
    for (const s of ALL_STATUSES) expect(counts[s].pill).toBe(0);
  });

  it("overlapping orphaned===stale set: stale pill reconciles via underNeedsYou (AC-72/73)", () => {
    // 5 stale + no-lock runs (each is BOTH orphaned-pred and stale-pred).
    const stalledOrphans = Array.from({ length: 5 }, () =>
      makeRun({ status: "waiting", isStale: true, driver: "none" })
    );
    // 2 of them also carry a pending breakpoint → absorbed UP into Needs-you.
    stalledOrphans[0].pendingBreakpoints = 1;
    stalledOrphans[1].recordedAwaitingResume = true;

    const counts = assertInvariant(stalledOrphans);

    // orphaned pill = 5 (all match), 2 absorbed to needsyou, 3 render in Stalled.
    expect(counts.orphaned.pill).toBe(5);
    expect(counts.orphaned.underNeedsYou).toBe(2);
    expect(counts.orphaned.column).toBe(3);
    // stale pill = 5 (identical overlapping set), same 2 absorbed.
    expect(counts.stale.pill).toBe(5);
    expect(counts.stale.underNeedsYou).toBe(2);
    expect(counts.stale.column).toBe(3);
    // needs-you column = the 2 absorbed.
    expect(counts.needsyou.pill).toBe(2);
    expect(counts.needsyou.column).toBe(2);
  });

  it("hidden needs-you surfaces via fromHidden; hidden non-needsyou stays collapsed (AC-71/76)", () => {
    const hidden = new Set(["home"]);
    const runs = [
      // Visible needs-you.
      makeRun({ projectName: "visible", pendingBreakpoints: 1 }),
      // Hidden needs-you → surfaced (fromHidden).
      makeRun({ projectName: "home", pendingBreakpoints: 1 }),
      makeRun({ projectName: "home", recordedAwaitingResume: true, pendingBreakpoints: 0 }),
      // §15.1 model A: a hidden live working run now SURFACES into Working
      // (fromHidden), disclosed via "(N from hidden)" (AC-75). SUPERSEDES the
      // wave-1 "hidden live run excluded from the visible Working pill".
      makeRun({ projectName: "home", status: "waiting", driver: "live" }),
      // Visible completed.
      makeRun({ projectName: "visible", status: "completed" }),
    ];

    const counts = assertInvariant(runs, hidden);

    // needs-you (all-scope): 1 visible + 2 hidden surfaced = 3, with 2 from hidden.
    expect(counts.needsyou.pill).toBe(3);
    expect(counts.needsyou.column).toBe(1);
    expect(counts.needsyou.fromHidden).toBe(2);
    // waiting: the visible needs-you run is absorbed UP into Needs-you
    // (underNeedsYou 1); the hidden live run surfaces into Working (fromHidden
    // 1). pill = 0 column + 1 underNeedsYou + 1 fromHidden = 2.
    expect(counts.waiting.pill).toBe(2);
    expect(counts.waiting.column).toBe(0);
    expect(counts.waiting.underNeedsYou).toBe(1);
    expect(counts.waiting.fromHidden).toBe(1);
    // total (visible-scope): visible needs-you + visible completed = 2.
    expect(counts.all.pill).toBe(2);
    // completed (visible-scope): 1.
    expect(counts.completed.pill).toBe(1);
  });

  it("tiles/banner metrics derive from the same reconciled source", () => {
    const runs = [
      makeRun({ status: "completed" }),
      makeRun({ status: "completed" }),
      makeRun({ status: "failed" }),
      makeRun({ status: "waiting", isStale: true, driver: "none" }),
      makeRun({ status: "waiting", pendingBreakpoints: 1 }),
    ];
    const counts = assertInvariant(runs);
    const m = metricsFromReconciled(counts);
    expect(m.completedRuns).toBe(counts.completed.pill);
    expect(m.failedRuns).toBe(counts.failed.pill);
    expect(m.staleRuns).toBe(counts.stale.pill);
    expect(m.pendingBreakpoints).toBe(counts.needsyou.pill);
    // Every tile equals its pill → tiles and pills cannot diverge.
    expect(m.totalRuns).toBe(counts.all.pill);
  });

  it("§15 live snapshot shape: needs-you pill === column (11), not the digest 6", () => {
    const hidden = new Set(["home", "demo-client-project", "ai-career-research"]);
    const runs: LightRun[] = [];
    // 6 pending-breakpoint needs-you runs: 1 visible + 5 hidden (matches §15.3).
    runs.push(makeRun({ projectName: "visible", pendingBreakpoints: 1 }));
    for (let i = 0; i < 3; i++)
      runs.push(makeRun({ projectName: "demo-client-project", pendingBreakpoints: 1 }));
    for (let i = 0; i < 2; i++)
      runs.push(makeRun({ projectName: "ai-career-research", pendingBreakpoints: 1 }));
    // 5 recordedAwaitingResume runs (pendingBreakpoints already 0): the +5 the
    // digest pill could not see (§15.3 GAP-1). 3 visible + 2 hidden.
    for (let i = 0; i < 3; i++)
      runs.push(
        makeRun({ projectName: "visible", recordedAwaitingResume: true, pendingBreakpoints: 0 })
      );
    for (let i = 0; i < 2; i++)
      runs.push(
        makeRun({ projectName: "home", recordedAwaitingResume: true, pendingBreakpoints: 0 })
      );

    const counts = assertInvariant(runs, hidden);
    // Full-run predicate: 6 pendingBp + 5 recorded = 11, pill === column-total.
    expect(counts.needsyou.pill).toBe(11);
    // 7 of the 11 are hidden (5 hidden pendingBp + 2 hidden recorded).
    expect(counts.needsyou.fromHidden).toBe(7);
    // 4 visible surface in the needs-you column.
    expect(counts.needsyou.column).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// §15.1 (owner gate 2026-07-06b, model A) — scheduled (sleeping forever-run)
// classification (AC-84/85/86) + reconciliation with hidden-live surfaced.
// A run whose newest journal event is an unresolved sleep effect is parsed with
// driver "scheduled" (see parser/liveness); the classifier here consumes that.
// ---------------------------------------------------------------------------

describe("classifyRun — scheduled (sleeping forever-run) §15.1", () => {
  it("AC-86: wc26-nightly-finalize (driver scheduled, no lock) classifies scheduled, absent from Working and dead-orphaned", () => {
    const c = classifyRun(
      makeRun({
        runId: "01KW7VKP20HJ6AJXFBWDR75PN2",
        projectName: "wc26-pool",
        status: "waiting",
        driver: "scheduled",
      })
    );
    expect(c.scheduled).toBe(true);
    expect(c.column).toBe("scheduled");
    // Its own treatment — NEITHER Working NOR dead-orphaned NOR stale.
    expect(c.working).toBe(false);
    expect(c.orphaned).toBe(false);
    expect(c.stale).toBe(false);
    expect(c.needsYou).toBe(false);
  });

  it("AC-84: a scheduled run does NOT inflate orphaned/stale/waiting counts", () => {
    const runs = [
      makeRun({ projectName: "wc26-pool", status: "waiting", driver: "scheduled" }),
      // A genuinely stalled run (stale + no lock) — the ONLY thing that should
      // register on the orphaned/stale pills.
      makeRun({ projectName: "vis", status: "waiting", driver: "none", isStale: true }),
    ];
    const counts = assertInvariant(runs);
    expect(counts.orphaned.pill).toBe(1); // only the genuine stalled run
    expect(counts.stale.pill).toBe(1);
    expect(counts.waiting.pill).toBe(0); // scheduled run is NOT "working"
    // And the scheduled run is not needs-you either.
    expect(counts.needsyou.pill).toBe(0);
  });

  it("AC-85: an overdue scheduled run (isStale flagged upstream would still) stays scheduled, never stale", () => {
    // Even if a stale flag leaked in, scheduled precedence keeps it off Stalled.
    const c = classifyRun(
      makeRun({ status: "waiting", driver: "scheduled", isStale: true })
    );
    expect(c.column).toBe("scheduled");
    expect(c.stale).toBe(false);
    expect(c.scheduled).toBe(true);
  });
});

describe("computeReconciledCounts — hidden-live surfaced into Working + scheduled (§15.1 model A)", () => {
  it("AC-75: hidden live runs surface into the Working pill via fromHidden; the invariant holds", () => {
    const hidden = new Set(["home"]);
    const runs = [
      // 1 visible working (column) + 2 hidden live working (fromHidden).
      makeRun({ projectName: "vis", status: "waiting", driver: "live" }),
      makeRun({ projectName: "home", status: "waiting", driver: "live" }),
      makeRun({ projectName: "home", status: "waiting", driver: "live" }),
      // A hidden scheduled run stays OUT of the Working pill (its own column).
      makeRun({ projectName: "home", status: "waiting", driver: "scheduled" }),
    ];
    const counts = assertInvariant(runs, hidden);
    // Working pill = 1 visible + 2 surfaced hidden = 3, with 2 disclosed as from-hidden.
    expect(counts.waiting.pill).toBe(3);
    expect(counts.waiting.column).toBe(1);
    expect(counts.waiting.fromHidden).toBe(2);
    // The hidden scheduled run never inflates the Working pill.
    expect(counts.waiting.underNeedsYou).toBe(0);
  });

  it("AC-76: Total tile stays visible-scope — hidden surfaced runs do NOT inflate it", () => {
    const hidden = new Set(["home"]);
    const runs = [
      makeRun({ projectName: "vis", status: "completed" }),
      makeRun({ projectName: "home", status: "waiting", driver: "live" }), // surfaced, not in Total
      makeRun({ projectName: "home", pendingBreakpoints: 1 }), // surfaced needs-you, not in Total
    ];
    const counts = assertInvariant(runs, hidden);
    expect(counts.all.pill).toBe(1); // only the visible completed run
  });
});

// ---------------------------------------------------------------------------
// SESSIONS-CHIP-SPEC (frozen 2026-07-09) — idle-session detection + the §15.4
// reconciliation extension (AC1..AC7). Authored BEFORE implementation: the
// `isIdleSession` export, the `sessionCollapsed` field on ReconciledCount, the
// top-level `sessions` count, and the `detectIdleSessions` option do NOT exist
// yet — these tests are the frozen definition of done (red step).
// ---------------------------------------------------------------------------

/**
 * An idle session (a.k.a. bare run): processId "bare-run" (or empty/absent),
 * 0 tasks, NO pending breakpoint and NO recorded breakpoint. driver:"live" so
 * that with idle-detection OFF it would flood the Working/waiting column
 * (SESSIONS-CHIP-SPEC §1), which is exactly the flood this feature removes.
 */
function makeIdleSession(overrides: Partial<LightRun> = {}): LightRun {
  return makeRun({
    processId: "bare-run",
    status: "waiting",
    driver: "live",
    isStale: false,
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    pendingBreakpoints: 0,
    ...overrides,
  });
}

describe("idle sessions — SESSIONS-CHIP-SPEC AC1 predicate (alarm-safety)", () => {
  it("AC1: a bare-run/0-task run with no pending/recorded breakpoint IS an idle session", () => {
    expect(isIdleSession(makeIdleSession())).toBe(true);
    // AC1.1: processId empty OR absent also qualifies.
    expect(isIdleSession(makeIdleSession({ processId: "" }))).toBe(true);
    expect(isIdleSession(makeIdleSession({ processId: undefined }))).toBe(true);
  });

  it("AC1 (alarm-safety): a run with tasks OR a pending/recorded breakpoint is NEVER idle", () => {
    // >0 tasks → never idle (even with a bare-run processId).
    expect(isIdleSession(makeIdleSession({ totalTasks: 1 }))).toBe(false);
    expect(isIdleSession(makeIdleSession({ totalTasks: 5 }))).toBe(false);
    // pending breakpoint → never idle.
    expect(isIdleSession(makeIdleSession({ pendingBreakpoints: 1 }))).toBe(false);
    // recorded-awaiting-resume breakpoint (pendingBreakpoints already 0) → never idle.
    expect(
      isIdleSession(makeIdleSession({ recordedAwaitingResume: true, pendingBreakpoints: 0 }))
    ).toBe(false);
    // A real run (non-bare processId, tasks present) → never idle.
    expect(isIdleSession(makeRun())).toBe(false);
  });
});

describe("idle sessions — SESSIONS-CHIP-SPEC AC3/AC5 reconciliation (§15.4 + sessionCollapsed)", () => {
  it("AC1/AC2/AC5: idle sessions are excluded from the waiting pill and from EVERY column, disclosed only via sessions + sessionCollapsed", () => {
    const idle = Array.from({ length: 3 }, () => makeIdleSession());
    const counts = assertInvariant(idle); // invariant now includes + sessionCollapsed

    // AC2: out of the Working/waiting pill and out of every board column.
    expect(counts.waiting.pill).toBe(0);
    for (const s of ALL_STATUSES) {
      expect(counts[s].column, `column(${s}) must contain no idle session`).toBe(0);
    }

    // AC3: the chip number equals the idle-session count.
    expect(counts.sessions).toBe(3);

    // AC5: disclosed (never silently dropped) — they remain in the grand total
    // pill and are reconciled by the new sessionCollapsed addend.
    expect(counts.all.pill).toBe(3);
    expect(counts.all.column).toBe(0);
    expect(counts.all.sessionCollapsed).toBe(3);
  });

  it("AC5: the Working/waiting count DROPS by EXACTLY the idle-session count vs idle-detection OFF; invariant holds either way", () => {
    const working = Array.from({ length: 2 }, () =>
      makeRun({ status: "waiting", driver: "live", isStale: false, pendingBreakpoints: 0 })
    );
    const idle = Array.from({ length: 4 }, () => makeIdleSession());
    const runs = [...working, ...idle];

    // Idle-detection OFF: the bare/0-task runs flood Working alongside the real
    // in-progress runs (today's behavior — §1).
    const off = computeReconciledCounts(runs, { detectIdleSessions: false });
    expect(off.waiting.pill).toBe(6);
    expect(off.sessions).toBe(0);

    // Idle-detection ON (default): the flood moves out — Working drops by
    // EXACTLY the idle count, disclosed as sessions + sessionCollapsed.
    const on = computeReconciledCounts(runs, { detectIdleSessions: true });
    expect(on.waiting.pill).toBe(off.waiting.pill - idle.length);
    expect(on.waiting.pill).toBe(2);
    expect(on.sessions).toBe(4);
    expect(on.all.sessionCollapsed).toBe(4);

    // AC5: the extended invariant holds in the default (ON) state.
    assertInvariant(runs);
  });

  it("AC1 (alarm-safety) + AC5: an alarm-carrying bare run stays in Needs-you, never collapsed into sessions", () => {
    const idle = Array.from({ length: 2 }, () => makeIdleSession());
    // Same bare-run/0-task shape but WITH a pending breakpoint → not idle.
    const alarming = makeIdleSession({ pendingBreakpoints: 1 });
    const counts = assertInvariant([...idle, alarming]);

    // Only the two true idle sessions collapse; the alarm run is untouched.
    expect(counts.sessions).toBe(2);
    expect(counts.all.sessionCollapsed).toBe(2);
    // The alarm-carrying run surfaces on the needs-you pill (never hidden).
    expect(counts.needsyou.pill).toBe(1);
  });
});
