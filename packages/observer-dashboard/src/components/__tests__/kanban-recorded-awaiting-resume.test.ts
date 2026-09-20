/**
 * UX-R3 §14.5 (AC-59) — answered-but-unapplied ("recorded, awaiting resume")
 * column derivation. When the observer records an answer on a no-live-driver
 * run, pendingBreakpoints drops to 0 on disk (the observer appends its own
 * EFFECT_RESOLVED), which would otherwise slide the card into Orphaned/Stalled.
 * The `recordedAwaitingResume` flag (derived from disk in the parser) keeps the
 * card in Needs-you instead. These are the pure-logic guards for that flag,
 * covering both the six-bucket partition (assignColumn) and the pill filter
 * (filterByStatus).
 */

import { describe, it, expect } from "vitest";
import type { Run } from "@/types";
import { assignColumn } from "@/components/kanban/column-model";
import type { LightRun } from "@/lib/services/run-query-service";
import { filterByStatus } from "@/lib/services/run-query-service";

function makeLightRun(overrides: Partial<LightRun> = {}): LightRun {
  const base: Omit<Run, "events"> = {
    runId: "01KTESTRECORDEDAWAIT0001",
    processId: "data-pipeline",
    status: "pending", // observer wrote EFFECT_RESOLVED → no requested task left
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tasks: [],
    totalTasks: 3,
    completedTasks: 1,
    failedTasks: 0,
    projectName: "my-project",
    pendingBreakpoints: 0,
    driver: "none",
  };
  return { ...base, events: [] as never[], totalEvents: 5, ...overrides } as LightRun;
}

describe("recorded-awaiting-resume column derivation (UX-R3 §14.5 AC-59)", () => {
  it("assignColumn keeps a recorded-but-unapplied run in needsyou (pendingBreakpoints 0, driver none)", () => {
    const run = makeLightRun({ recordedAwaitingResume: true });
    // Without the flag this run (pending + driver none + 0 pending) is orphaned.
    expect(assignColumn(makeLightRun())).toBe("orphaned");
    // With the flag it stays in Needs-you.
    expect(assignColumn(run)).toBe("needsyou");
  });

  it("assignColumn: recorded state takes precedence over orphaned even when stale", () => {
    const run = makeLightRun({ recordedAwaitingResume: true, isStale: true });
    expect(assignColumn(run)).toBe("needsyou");
  });

  it("assignColumn: a TERMINAL run is never held in needsyou by the flag (resume consumed → done)", () => {
    // Once the run is resumed it terminates; the parser would clear the flag,
    // but even if it lingered, the non-terminal guard keeps a completed run out.
    const done = makeLightRun({
      status: "completed",
      recordedAwaitingResume: true,
    });
    expect(assignColumn(done)).toBe("completed");
  });

  it("filterByStatus needsyou includes a recorded-awaiting-resume run", () => {
    const run = makeLightRun({ recordedAwaitingResume: true }) as unknown as Run;
    expect(filterByStatus([run], "needsyou")).toHaveLength(1);
    // A plain orphaned run (no flag) is NOT in needsyou.
    const plain = makeLightRun() as unknown as Run;
    expect(filterByStatus([plain], "needsyou")).toHaveLength(0);
  });
});
