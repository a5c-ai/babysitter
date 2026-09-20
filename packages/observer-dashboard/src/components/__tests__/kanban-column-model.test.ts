/**
 * FROZEN acceptance tests — SPEC-vibekanban §10, column mapping (AC-1..AC-10).
 *
 * Authored BEFORE any board implementation exists (pending-impl). This file
 * imports the SPEC-declared module path `src/components/kanban/column-model`
 * (SPEC §3.3 / §9). Until Wave 1 lands that module, this file fails to load
 * with a module-resolution error — that is the expected "frozen definition
 * of done" state. Do NOT weaken these assertions to make them pass; implement
 * the module instead.
 *
 * NOTE on file location: the SPEC plans `src/components/kanban/__tests__/`,
 * but the pre-implementation gate requires `src/components/kanban/` to stay
 * absent until implementation starts, so this file temporarily lives one
 * level up. It may be moved into `src/components/kanban/__tests__/` verbatim
 * once the module exists.
 *
 * Contract under test (SPEC §3.3):
 *   export const COLUMN_ORDER: BoardColumnKey[];
 *   export function assignColumn(run: LightRun): BoardColumnKey;
 *   export function partitionRuns(
 *     runs: LightRun[],
 *     hiddenProjects?: Set<string>,   // AC-9 "hidden-set argument"
 *   ): Record<BoardColumnKey, (LightRun & { hiddenProject?: boolean })[]>;
 *   // AC-10 (SPEC §3.4 overflow tooltip calc — export name fixed by this test):
 *   export function orphanedOverflowTooltip(
 *     partition: Record<BoardColumnKey, LightRun[]>,
 *   ): string | null;
 */

import { describe, it, expect } from "vitest";
import type { Run } from "@/types";
import type { LightRun } from "@/lib/services/run-query-service";
// pending-impl: SPEC-declared module path — does not exist until Wave 1.
import {
  COLUMN_ORDER,
  GROUP_HOST,
  GROUP_ORDER,
  assignColumn,
  groupColumns,
  partitionRuns,
  // Amended per owner gate 2026-07-05 run 01KWRR8XAHFCDEGCRBRFHFF44W:
  // 4-column taxonomy — the orphaned/stale tooltips merged into the Stalled
  // host's stalledOverflowTooltip (AC-10 amended text, §13.6).
  stalledOverflowTooltip,
  // UX-R2 §13.5/AC-47: the Working column gets the same absorbed-into
  // mechanism for breakpoint runs the waiting pill counts.
  workingOverflowTooltip,
  type BoardColumnKey,
} from "@/components/kanban/column-model";

// ---------------------------------------------------------------------------
// Helpers (mirroring run-query-service.test.ts conventions)
// ---------------------------------------------------------------------------

const RECENT_DATE = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

function makeLightRun(overrides: Partial<LightRun> = {}): LightRun {
  const base: Omit<Run, "events"> = {
    runId: "01KTESTCOLMODEL000000001",
    processId: "data-pipeline",
    status: "waiting",
    createdAt: RECENT_DATE,
    updatedAt: RECENT_DATE,
    tasks: [],
    totalTasks: 3,
    completedTasks: 1,
    failedTasks: 0,
    projectName: "my-project",
  };
  return {
    ...base,
    events: [] as never[],
    totalEvents: 5,
    ...overrides,
  } as LightRun;
}

// §15.1 (owner gate 2026-07-06b, model A): a first-class "scheduled" bucket for
// sleeping forever-runs is inserted after needsyou (its own idle-healthy column,
// never pooled with Stalled). SUPERSEDES the wave-1 six-bucket order.
const EXPECTED_ORDER: BoardColumnKey[] = [
  "needsyou",
  "scheduled",
  "orphaned",
  "waiting",
  "stale",
  "failed",
  "completed",
];

describe("column-model (SPEC-vibekanban §3 / §10)", () => {
  it("COLUMN_ORDER matches SPEC §3.2 table order (precondition for AC-6/AC-12)", () => {
    expect(COLUMN_ORDER).toEqual(EXPECTED_ORDER);
  });

  // -------------------------------------------------------------------------
  // AC-1
  // -------------------------------------------------------------------------
  it("AC-1: assignColumn returns needsyou for status:waiting + pendingBreakpoints:2 regardless of driver or isStale", () => {
    const drivers: LightRun["driver"][] = ["live", "orphaned", "none", undefined];
    const staleValues: (boolean | undefined)[] = [true, false, undefined];
    for (const driver of drivers) {
      for (const isStale of staleValues) {
        const run = makeLightRun({
          status: "waiting",
          pendingBreakpoints: 2,
          driver,
          isStale,
        });
        expect(assignColumn(run), `driver=${driver} isStale=${isStale}`).toBe("needsyou");
      }
    }
  });

  // -------------------------------------------------------------------------
  // AC-2
  // -------------------------------------------------------------------------
  it("AC-2: assignColumn returns needsyou via legacy fallback (pendingBreakpoints undefined, waitingKind breakpoint, non-terminal)", () => {
    for (const status of ["waiting", "pending"] as const) {
      const run = makeLightRun({
        status,
        pendingBreakpoints: undefined,
        waitingKind: "breakpoint",
        driver: "live",
        isStale: false,
      });
      expect(assignColumn(run), `status=${status}`).toBe("needsyou");
    }
  });

  // -------------------------------------------------------------------------
  // AC-3
  // -------------------------------------------------------------------------
  it('AC-3: assignColumn returns orphaned for non-terminal run with driver "none" (and "orphaned") and pendingBreakpoints 0 — DC-3', () => {
    for (const driver of ["none", "orphaned"] as const) {
      const run = makeLightRun({
        status: "waiting",
        driver,
        pendingBreakpoints: 0,
        isStale: false,
      });
      expect(assignColumn(run), `driver=${driver}`).toBe("orphaned");
    }
  });

  // -------------------------------------------------------------------------
  // AC-4
  // -------------------------------------------------------------------------
  it('AC-4: assignColumn returns completed (never orphaned) for a completed run with driver "none"', () => {
    const run = makeLightRun({
      status: "completed",
      driver: "none",
      completedTasks: 3,
    });
    expect(assignColumn(run)).toBe("completed");
  });

  it("AC-4: assignColumn returns completed (never needsyou) for a completed run with residual pendingBreakpoints > 0 — DC-4 non-terminal guard", () => {
    const run = makeLightRun({
      status: "completed",
      pendingBreakpoints: 3,
      completedTasks: 3,
    });
    expect(assignColumn(run)).toBe("completed");
  });

  // -------------------------------------------------------------------------
  // AC-5
  // -------------------------------------------------------------------------
  it("AC-5: assignColumn returns stale for a non-terminal, non-breakpoint, live-driver run with isStale:true — and waiting when isStale:false", () => {
    const base = {
      status: "waiting" as const,
      pendingBreakpoints: 0,
      driver: "live" as const,
    };
    expect(assignColumn(makeLightRun({ ...base, isStale: true }))).toBe("stale");
    expect(assignColumn(makeLightRun({ ...base, isStale: false }))).toBe("waiting");
  });

  // -------------------------------------------------------------------------
  // AC-6
  // -------------------------------------------------------------------------
  it("AC-6: precedence — breakpoint + orphaned + stale maps to needsyou; orphaned + stale (no breakpoint) maps to orphaned", () => {
    const tripleOverlap = makeLightRun({
      status: "waiting",
      pendingBreakpoints: 1,
      driver: "orphaned",
      isStale: true,
    });
    expect(assignColumn(tripleOverlap)).toBe("needsyou");

    const orphanedStale = makeLightRun({
      status: "waiting",
      pendingBreakpoints: 0,
      driver: "orphaned",
      isStale: true,
    });
    expect(assignColumn(orphanedStale)).toBe("orphaned");
  });

  // -------------------------------------------------------------------------
  // AC-7
  // -------------------------------------------------------------------------
  it("AC-7: totality + disjointness over the full status × isStale × driver × pendingBreakpoints × waitingKind matrix", () => {
    const statuses: Run["status"][] = ["pending", "waiting", "completed", "failed"];
    const staleValues: (boolean | undefined)[] = [true, false, undefined];
    const drivers: LightRun["driver"][] = ["live", "orphaned", "none", undefined];
    const pendingValues: (number | undefined)[] = [undefined, 0, 2];
    const waitingKinds: LightRun["waitingKind"][] = [undefined, "breakpoint", "task"];

    const matrix: LightRun[] = [];
    let i = 0;
    for (const status of statuses)
      for (const isStale of staleValues)
        for (const driver of drivers)
          for (const pendingBreakpoints of pendingValues)
            for (const waitingKind of waitingKinds) {
              matrix.push(
                makeLightRun({
                  runId: `01KTESTMATRIX${String(i++).padStart(11, "0")}`,
                  status,
                  isStale,
                  driver,
                  pendingBreakpoints,
                  waitingKind,
                })
              );
            }
    expect(matrix.length).toBe(4 * 3 * 4 * 3 * 3);

    // Totality: assignColumn never throws and always returns a known column.
    for (const run of matrix) {
      const col = assignColumn(run);
      expect(COLUMN_ORDER, `run ${run.runId} got unknown column ${col}`).toContain(col);
    }

    // Disjointness: partitionRuns places every run in exactly one column.
    const partition = partitionRuns(matrix);
    const seen = new Map<string, BoardColumnKey[]>();
    let total = 0;
    for (const key of COLUMN_ORDER) {
      const bucket = partition[key];
      expect(Array.isArray(bucket), `partition missing column ${key}`).toBe(true);
      total += bucket.length;
      for (const run of bucket) {
        seen.set(run.runId, [...(seen.get(run.runId) ?? []), key]);
      }
    }
    expect(total).toBe(matrix.length);
    for (const run of matrix) {
      const columns = seen.get(run.runId) ?? [];
      expect(columns.length, `run ${run.runId} appears in ${columns.join(",")}`).toBe(1);
    }
  });

  // -------------------------------------------------------------------------
  // AC-8
  // -------------------------------------------------------------------------
  it("AC-8: within-column order is updatedAt DESC with runId tiebreaker, stable across repeated partitions", () => {
    const sameTs = new Date(Date.now() - 60_000).toISOString();
    const newerTs = new Date(Date.now() - 30_000).toISOString();
    const runB = makeLightRun({
      runId: "01KTESTTIEBREAKB00000002",
      status: "waiting",
      isStale: false,
      driver: "live",
      pendingBreakpoints: 0,
      updatedAt: sameTs,
    });
    const runA = makeLightRun({
      runId: "01KTESTTIEBREAKA00000001",
      status: "waiting",
      isStale: false,
      driver: "live",
      pendingBreakpoints: 0,
      updatedAt: sameTs,
    });
    const runNewer = makeLightRun({
      runId: "01KTESTTIEBREAKC00000003",
      status: "waiting",
      isStale: false,
      driver: "live",
      pendingBreakpoints: 0,
      updatedAt: newerTs,
    });

    // Feed in different input orders; output order must be identical:
    // newest first, then runId ascending among identical timestamps.
    const expectedIds = [runNewer.runId, runA.runId, runB.runId];
    const inputs = [
      [runB, runA, runNewer],
      [runNewer, runB, runA],
      [runA, runNewer, runB],
    ];
    for (const input of inputs) {
      const partition = partitionRuns(input);
      expect(partition.waiting.map((r) => r.runId)).toEqual(expectedIds);
    }
  });

  // -------------------------------------------------------------------------
  // AC-9
  // -------------------------------------------------------------------------
  it("AC-9 (§15.1 model A, owner gate 2026-07-06b): hidden runs surface into needsyou + Working (live) flagged hiddenProject, collapse elsewhere", () => {
    const hidden = new Set(["secret-project"]);
    const hiddenBreakpoint = makeLightRun({
      runId: "01KTESTHIDDENBP000000001",
      projectName: "secret-project",
      status: "waiting",
      pendingBreakpoints: 1,
      driver: "live",
      isStale: false,
    });
    const hiddenWorking = makeLightRun({
      runId: "01KTESTHIDDENWORK0000002",
      projectName: "secret-project",
      status: "waiting",
      pendingBreakpoints: 0,
      driver: "live",
      isStale: false,
    });
    const hiddenOrphaned = makeLightRun({
      runId: "01KTESTHIDDENORPH0000003",
      projectName: "secret-project",
      status: "pending",
      pendingBreakpoints: 0,
      driver: "none",
    });
    const hiddenStale = makeLightRun({
      runId: "01KTESTHIDDENSTALE000004",
      projectName: "secret-project",
      status: "waiting",
      pendingBreakpoints: 0,
      driver: "live",
      isStale: true,
    });
    const hiddenFailed = makeLightRun({
      runId: "01KTESTHIDDENFAIL0000005",
      projectName: "secret-project",
      status: "failed",
    });
    const hiddenCompleted = makeLightRun({
      runId: "01KTESTHIDDENDONE0000006",
      projectName: "secret-project",
      status: "completed",
    });
    const visibleWorking = makeLightRun({
      runId: "01KTESTVISIBLEWORK000007",
      projectName: "my-project",
      status: "waiting",
      pendingBreakpoints: 0,
      driver: "live",
      isStale: false,
    });

    const partition = partitionRuns(
      [
        hiddenBreakpoint,
        hiddenWorking,
        hiddenOrphaned,
        hiddenStale,
        hiddenFailed,
        hiddenCompleted,
        visibleWorking,
      ],
      hidden
    );

    // Needs-you retains the hidden-project breakpoint run, flagged.
    expect(partition.needsyou.map((r) => r.runId)).toEqual([hiddenBreakpoint.runId]);
    expect(partition.needsyou[0].hiddenProject).toBe(true);

    // §15.1 model A: the hidden LIVE run now SURFACES into Working alongside the
    // visible one (both present; order by updatedAt DESC then runId).
    expect(new Set(partition.waiting.map((r) => r.runId))).toEqual(
      new Set([visibleWorking.runId, hiddenWorking.runId])
    );
    const surfacedWorking = partition.waiting.find((r) => r.runId === hiddenWorking.runId);
    expect(surfacedWorking?.hiddenProject).toBe(true);
    const visibleInWorking = partition.waiting.find((r) => r.runId === visibleWorking.runId);
    expect(visibleInWorking?.hiddenProject).not.toBe(true);

    // The non-surfaced columns still collapse hidden orphaned/stale/done runs.
    expect(partition.scheduled).toEqual([]);
    expect(partition.orphaned).toEqual([]);
    expect(partition.stale).toEqual([]);
    expect(partition.failed).toEqual([]);
    expect(partition.completed).toEqual([]);
  });

  // -------------------------------------------------------------------------
  // AC-10 — amended per owner gate 2026-07-05 run 01KWRR8XAHFCDEGCRBRFHFF44W:
  // 4-column taxonomy + color map (§13.6). Orphaned+stale host under the
  // Stalled column, so the count-honesty tooltip is stalledOverflowTooltip
  // with the amended text "+N more stalled runs are shown under Needs you"
  // (same absorbed-into-Needs-you math; within-Stalled absorption between the
  // orphaned and stale buckets is no longer a column-level discrepancy).
  // -------------------------------------------------------------------------
  it('AC-10 (amended §13.6): overflow tooltip math — 2 orphaned-breakpoint runs + 1 pure orphaned run gives Stalled-host tooltip containing "2 more"', () => {
    const orphanedBp1 = makeLightRun({
      runId: "01KTESTORPHBP10000000001",
      status: "waiting",
      pendingBreakpoints: 1,
      driver: "orphaned",
    });
    const orphanedBp2 = makeLightRun({
      runId: "01KTESTORPHBP20000000002",
      status: "waiting",
      pendingBreakpoints: 1,
      driver: "none",
    });
    const pureOrphaned = makeLightRun({
      runId: "01KTESTORPHPURE000000003",
      status: "waiting",
      pendingBreakpoints: 0,
      driver: "orphaned",
    });

    const partition = partitionRuns([orphanedBp1, orphanedBp2, pureOrphaned]);

    // Disjoint partition: the two breakpoint runs live under Needs you.
    expect(partition.needsyou).toHaveLength(2);
    expect(partition.orphaned).toHaveLength(1);
    expect(partition.orphaned[0].runId).toBe(pureOrphaned.runId);

    // §13.6 amended AC-10 text: '"+N more stalled runs are shown under Needs you"'.
    const tooltip = stalledOverflowTooltip(partition);
    expect(tooltip).toBe("+2 more stalled runs are shown under Needs you");
  });

  it("AC-10 (complement, amended §13.6): no tooltip when no stalled-bucket runs are captured by Needs you", () => {
    const pureOrphaned = makeLightRun({
      runId: "01KTESTORPHONLY000000001",
      status: "waiting",
      pendingBreakpoints: 0,
      driver: "orphaned",
    });
    const liveBp = makeLightRun({
      runId: "01KTESTLIVEBP00000000002",
      status: "waiting",
      pendingBreakpoints: 1,
      driver: "live",
    });
    const partition = partitionRuns([pureOrphaned, liveBp]);
    expect(stalledOverflowTooltip(partition)).toBeNull();
  });

  // Design-QA round 1 (minor) carry, amended per owner gate 2026-07-05 run
  // 01KWRR8XAHFCDEGCRBRFHFF44W: stale runs absorbed into the ORPHANED bucket
  // now land in the same Stalled host column, so they are no longer a
  // column-level discrepancy — only Needs-you absorption is reported.
  it("stalledOverflowTooltip: stale runs absorbed into the orphaned bucket stay inside Stalled — no tooltip", () => {
    const orphanedStale1 = makeLightRun({
      runId: "01KTESTSTALEORPH00000001",
      status: "waiting",
      pendingBreakpoints: 0,
      driver: "orphaned",
      isStale: true,
    });
    const orphanedStale2 = makeLightRun({
      runId: "01KTESTSTALEORPH00000002",
      status: "waiting",
      pendingBreakpoints: 0,
      driver: "none",
      isStale: true,
    });

    const partition = partitionRuns([orphanedStale1, orphanedStale2]);

    // Precedence: orphaned beats stale — both live in the orphaned bucket,
    // which hosts under Stalled anyway. Column-level honesty holds without a
    // tooltip (the Stalled column count includes both runs).
    expect(partition.stale).toHaveLength(0);
    expect(partition.orphaned).toHaveLength(2);
    expect(stalledOverflowTooltip(partition)).toBeNull();
  });

  it("stalledOverflowTooltip: a stale Needs-you run is reported with the singular noun; an orphaned+stale Needs-you run counts once (union math)", () => {
    const staleBp = makeLightRun({
      runId: "01KTESTSTALEBP0000000001",
      status: "waiting",
      pendingBreakpoints: 1,
      driver: "live",
      isStale: true,
    });
    const partition = partitionRuns([staleBp]);
    expect(partition.needsyou).toHaveLength(1);
    expect(stalledOverflowTooltip(partition)).toBe(
      "+1 more stalled run is shown under Needs you"
    );

    // A run that is BOTH orphaned and stale under Needs-you counts once.
    const orphanedStaleBp = makeLightRun({
      runId: "01KTESTSTALEORPH00000003",
      status: "waiting",
      pendingBreakpoints: 1,
      driver: "orphaned",
      isStale: true,
    });
    const both = partitionRuns([staleBp, orphanedStaleBp]);
    expect(both.needsyou).toHaveLength(2);
    expect(stalledOverflowTooltip(both)).toBe(
      "+2 more stalled runs are shown under Needs you"
    );
  });

  it("stalledOverflowTooltip: null when every stalled-bucket run sits in the Stalled column (pill count === column count)", () => {
    const pureStale = makeLightRun({
      runId: "01KTESTSTALEPURE00000001",
      status: "waiting",
      pendingBreakpoints: 0,
      driver: "live",
      isStale: true,
    });
    const partition = partitionRuns([pureStale]);
    expect(partition.stale).toHaveLength(1);
    expect(stalledOverflowTooltip(partition)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// UX-R2 §13.2 option (b) — AC-35: groupColumns display grouping (owner gate
// 2026-07-05 run 01KWRR8XAHFCDEGCRBRFHFF44W: 4-column taxonomy + color map).
// The six-bucket partition is UNCHANGED; these tests cover the pure display
// layer on top of it.
// ---------------------------------------------------------------------------
describe("groupColumns (UX-R2 §13.2b / AC-35)", () => {
  const T0 = "2026-07-01T10:00:00.000Z";
  const T1 = "2026-07-02T10:00:00.000Z";
  const T2 = "2026-07-03T10:00:00.000Z";

  it("GROUP_ORDER is the §13.6/§15.1 order and GROUP_HOST maps every bucket to its host", () => {
    // §15.1: Scheduled is its own display column between Working and Stalled.
    expect(GROUP_ORDER).toEqual(["needsyou", "waiting", "scheduled", "stalled", "done"]);
    expect(GROUP_HOST).toEqual({
      needsyou: "needsyou",
      scheduled: "scheduled",
      orphaned: "stalled",
      waiting: "waiting",
      stale: "stalled",
      failed: "done",
      completed: "done",
    });
  });

  it("AC-35: totals are preserved — Σ grouped sizes === Σ partition sizes", () => {
    const runs = [
      makeLightRun({ runId: "01KTESTGRPBP000000000001", status: "waiting", pendingBreakpoints: 1, driver: "live" }),
      makeLightRun({ runId: "01KTESTGRPWORK0000000002", status: "waiting", pendingBreakpoints: 0, driver: "live", isStale: false }),
      makeLightRun({ runId: "01KTESTGRPORPH0000000003", status: "waiting", pendingBreakpoints: 0, driver: "orphaned" }),
      makeLightRun({ runId: "01KTESTGRPSTALE000000004", status: "waiting", pendingBreakpoints: 0, driver: "live", isStale: true }),
      makeLightRun({ runId: "01KTESTGRPFAIL0000000005", status: "failed" }),
      makeLightRun({ runId: "01KTESTGRPDONE0000000006", status: "completed" }),
    ];
    const partition = partitionRuns(runs);
    const groups = groupColumns(partition);

    const partitionTotal = COLUMN_ORDER.reduce((sum, key) => sum + partition[key].length, 0);
    const groupTotal = GROUP_ORDER.reduce((sum, key) => sum + groups[key].length, 0);
    expect(groupTotal).toBe(partitionTotal);
    expect(groupTotal).toBe(runs.length);

    // Host membership: every partitioned run appears exactly once, in the
    // column GROUP_HOST names for its bucket.
    for (const bucket of COLUMN_ORDER) {
      for (const run of partition[bucket]) {
        const host = GROUP_HOST[bucket];
        expect(
          groups[host].filter((r) => r.runId === run.runId),
          `run ${run.runId} (bucket ${bucket}) in host ${host}`
        ).toHaveLength(1);
      }
    }
  });

  it("AC-35: within-group order is §3.2 precedence concatenation — orphaned before stale in Stalled, failed before completed in Done — with each segment keeping updatedAt DESC", () => {
    const runs = [
      // Stale segment (newer than every orphaned run — concatenation must
      // still put it AFTER the orphaned segment).
      makeLightRun({ runId: "01KTESTGRPSTALEA00000001", status: "waiting", pendingBreakpoints: 0, driver: "live", isStale: true, updatedAt: T2 }),
      // Orphaned segment, two runs (older timestamps).
      makeLightRun({ runId: "01KTESTGRPORPHA000000002", status: "waiting", pendingBreakpoints: 0, driver: "orphaned", updatedAt: T0 }),
      makeLightRun({ runId: "01KTESTGRPORPHB000000003", status: "waiting", pendingBreakpoints: 0, driver: "none", updatedAt: T1 }),
      // Done: completed newer than failed — failed still renders first.
      makeLightRun({ runId: "01KTESTGRPDONEA000000004", status: "completed", updatedAt: T2 }),
      makeLightRun({ runId: "01KTESTGRPFAILA000000005", status: "failed", updatedAt: T0 }),
      makeLightRun({ runId: "01KTESTGRPFAILB000000006", status: "failed", updatedAt: T1 }),
    ];
    const groups = groupColumns(partitionRuns(runs));

    expect(groups.stalled.map((r) => r.runId)).toEqual([
      // Orphaned segment first, updatedAt DESC within it...
      "01KTESTGRPORPHB000000003",
      "01KTESTGRPORPHA000000002",
      // ...then the stale segment.
      "01KTESTGRPSTALEA00000001",
    ]);
    expect(groups.done.map((r) => r.runId)).toEqual([
      // Failed segment first, updatedAt DESC within it...
      "01KTESTGRPFAILB000000006",
      "01KTESTGRPFAILA000000005",
      // ...then the completed segment.
      "01KTESTGRPDONEA000000004",
    ]);
  });

  it("AC-35: needsyou and waiting pass through the display grouping untouched", () => {
    const bp = makeLightRun({ runId: "01KTESTGRPBPX00000000001", status: "waiting", pendingBreakpoints: 1, driver: "orphaned", isStale: true });
    const work = makeLightRun({ runId: "01KTESTGRPWKX00000000002", status: "waiting", pendingBreakpoints: 0, driver: "live", isStale: false });
    const partition = partitionRuns([bp, work]);
    const groups = groupColumns(partition);
    expect(groups.needsyou).toBe(partition.needsyou);
    expect(groups.waiting).toBe(partition.waiting);
    expect(groups.stalled).toEqual([]);
    expect(groups.done).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// UX-R2 §13.5 — AC-47: workingOverflowTooltip (Working column count honesty,
// the same absorbed-into mechanism as the Stalled tooltip).
// ---------------------------------------------------------------------------

describe("workingOverflowTooltip (UX-R2 §13.5 / AC-47)", () => {
  it("AC-47: a non-stale breakpoint run absorbed into Needs-you is disclosed with the exact singular text", () => {
    // The AC-47 fixture shape: waiting pill counts 2 (both non-stale
    // in-progress runs), the Working column renders only the plain run.
    const liveBp = makeLightRun({
      runId: "01KTESTWORKBP00000000001",
      status: "waiting",
      pendingBreakpoints: 1,
      driver: "live",
    });
    const plainWork = makeLightRun({
      runId: "01KTESTWORKPLAIN00000002",
      status: "waiting",
      pendingBreakpoints: 0,
      driver: "live",
    });
    const partition = partitionRuns([liveBp, plainWork]);
    expect(partition.needsyou).toHaveLength(1);
    expect(partition.waiting).toHaveLength(1);
    expect(workingOverflowTooltip(partition)).toBe(
      "+1 more working run is shown under Needs you"
    );
  });

  it("pluralizes for multiple absorbed working runs", () => {
    const bp1 = makeLightRun({
      runId: "01KTESTWORKBPA0000000001",
      status: "waiting",
      pendingBreakpoints: 1,
      driver: "live",
    });
    const bp2 = makeLightRun({
      runId: "01KTESTWORKBPB0000000002",
      status: "pending",
      pendingBreakpoints: 1,
      driver: "live",
    });
    const partition = partitionRuns([bp1, bp2]);
    expect(workingOverflowTooltip(partition)).toBe(
      "+2 more working runs are shown under Needs you"
    );
  });

  it("does NOT double-disclose orphaned/stale Needs-you runs (those belong to the Stalled tooltip)", () => {
    const orphanedBp = makeLightRun({
      runId: "01KTESTWORKORPH000000001",
      status: "waiting",
      pendingBreakpoints: 1,
      driver: "orphaned",
    });
    const staleBp = makeLightRun({
      runId: "01KTESTWORKSTALE00000002",
      status: "waiting",
      pendingBreakpoints: 1,
      driver: "live",
      isStale: true,
    });
    const partition = partitionRuns([orphanedBp, staleBp]);
    expect(partition.needsyou).toHaveLength(2);
    // Both runs are stalled-bucket shaped — the Working tooltip stays silent
    // while the Stalled tooltip owns the disclosure (no run counted twice).
    expect(workingOverflowTooltip(partition)).toBeNull();
    expect(stalledOverflowTooltip(partition)).toBe(
      "+2 more stalled runs are shown under Needs you"
    );
  });

  it("null when no needs-you run is working-shaped (pill count === column count)", () => {
    const plainWork = makeLightRun({
      runId: "01KTESTWORKONLY000000001",
      status: "waiting",
      pendingBreakpoints: 0,
      driver: "live",
    });
    const partition = partitionRuns([plainWork]);
    expect(workingOverflowTooltip(partition)).toBeNull();
  });
});
