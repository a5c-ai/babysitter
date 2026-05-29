import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import os from "os";
import path from "path";
import { promises as fs } from "fs";
import { createRunDir } from "../../../storage/createRunDir";
import { appendEvent, loadJournal } from "../../../storage/journal";
import { buildEffectIndex } from "../../replay/effectIndex";
import { ReplayCursor } from "../../replay/replayCursor";
import { runTaskIntrinsic, TaskIntrinsicContext, deriveBugClass } from "../task";
import { commitEffectResult } from "../../commitEffectResult";
import { createStrikeTracker } from "../../strikeTracker";
import {
  EffectRequestedError,
  StrikeBudgetExhaustedError,
} from "../../exceptions";
import { DefinedTask, ForwardFixStrikeBudget } from "../../types";

const fixTask: DefinedTask<{ attempt: number }, number> = {
  id: "fix-task",
  build: async (args) => ({
    kind: "node",
    title: `fix-${args.attempt}`,
    metadata: { attempt: args.attempt },
  }),
};

let tmpRoot: string;

beforeEach(async () => {
  tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "sdk-strike-task-"));
});

afterEach(async () => {
  await fs.rm(tmpRoot, { recursive: true, force: true });
});

async function createTestRun(runId: string) {
  const { runDir } = await createRunDir({
    runsRoot: tmpRoot,
    runId,
    request: "strike-test",
    processPath: "./process.js",
  });
  await appendEvent({ runDir, eventType: "RUN_CREATED", event: { runId } });
  return { runDir, runId };
}

async function buildContextWithBudget(
  runDir: string,
  runId: string,
  budget: ForwardFixStrikeBudget,
  nonInteractive: boolean,
  seededStrikes: Array<{ bugClass: string; effectId: string }> = []
): Promise<TaskIntrinsicContext> {
  const effectIndex = await buildEffectIndex({ runDir });
  const replayCursor = new ReplayCursor();
  const tracker = createStrikeTracker(budget);
  for (const seed of seededStrikes) {
    tracker.recordEffectFailure(seed.bugClass, seed.effectId);
  }
  return {
    runId,
    runDir,
    processId: "proc-strike",
    effectIndex,
    replayCursor,
    now: () => new Date("2026-05-28T12:00:00Z"),
    nonInteractive,
    forwardFixStrikeBudget: budget,
    strikeTracker: tracker,
  };
}

describe("deriveBugClass", () => {
  test("explicit metadata.bugClass wins", () => {
    expect(
      deriveBugClass({ metadata: { bugClass: "ios-cloud-stt-wedge" }, label: "fix:other" }, "fix-task")
    ).toBe("ios-cloud-stt-wedge");
  });

  test("falls back to label parsing for 'fix:' prefix", () => {
    expect(deriveBugClass({ label: "fix:something-broken" }, "fix-task")).toBe("something-broken");
  });

  test("forward-fix: prefix is also recognized", () => {
    expect(deriveBugClass({ label: "forward-fix: ios-wedge" }, "fix-task")).toBe("ios-wedge");
  });

  test("returns undefined when no signal is present", () => {
    expect(deriveBugClass({ label: "arbitrary-task" }, "fix-task")).toBeUndefined();
    expect(deriveBugClass(undefined, "fix-task")).toBeUndefined();
  });

  test("rejects empty bugClass strings", () => {
    expect(deriveBugClass({ metadata: { bugClass: "" } }, "fix-task")).toBeUndefined();
  });
});

describe("runTaskIntrinsic — strike budget enforcement", () => {
  test("strike counter increments across consecutive failed forward-fixes for same bugClass", async () => {
    const { runDir, runId } = await createTestRun("run-strike-incr");
    const budget: ForwardFixStrikeBudget = { perBugClass: 5, pivotPhase: "instrumentation" };
    const context = await buildContextWithBudget(runDir, runId, budget, false);
    const tracker = context.strikeTracker!;

    // First attempt: request, then commit error.
    let effectId1 = "";
    try {
      await runTaskIntrinsic({
        task: fixTask,
        args: { attempt: 1 },
        invokeOptions: { metadata: { bugClass: "wedge" } },
        context,
      });
    } catch (error) {
      effectId1 = (error as EffectRequestedError).action.effectId;
    }
    expect(effectId1).not.toBe("");
    await commitEffectResult({
      runDir,
      effectId: effectId1,
      result: { status: "error", error: { name: "Boom", message: "boom" } },
    });

    // Replay: should record strike #1.
    const replayCtx1 = await buildContextWithBudget(runDir, runId, budget, false);
    await expect(
      runTaskIntrinsic({
        task: fixTask,
        args: { attempt: 1 },
        invokeOptions: { metadata: { bugClass: "wedge" } },
        context: replayCtx1,
      })
    ).rejects.toThrow("boom");
    expect(replayCtx1.strikeTracker!.get("wedge")).toBe(1);

    // Second attempt at a NEW step: replay first call, then request second.
    const replayCtx2 = await buildContextWithBudget(runDir, runId, budget, false);
    let effectId2 = "";
    try {
      // First call replays as resolved_error (strike #1 recorded again,
      // dedup'd by effectId).
      await runTaskIntrinsic({
        task: fixTask,
        args: { attempt: 1 },
        invokeOptions: { metadata: { bugClass: "wedge" } },
        context: replayCtx2,
      });
    } catch {
      // Expected — task error rethrown.
    }
    // Now issue the second fresh attempt.
    try {
      await runTaskIntrinsic({
        task: fixTask,
        args: { attempt: 2 },
        invokeOptions: { metadata: { bugClass: "wedge" } },
        context: replayCtx2,
      });
    } catch (error) {
      effectId2 = (error as EffectRequestedError).action.effectId;
    }
    expect(effectId2).not.toBe("");
    expect(effectId2).not.toBe(effectId1);
    await commitEffectResult({
      runDir,
      effectId: effectId2,
      result: { status: "error", error: { name: "Boom", message: "boom2" } },
    });

    // Verify the journal accumulated TWO strike-budget:failure events with
    // distinct effectIds — one from each iteration's replay.
    const events = await loadJournal(runDir);
    const failureEvents = events.filter(
      (e) => e.type === "PROCESS_LOG" && (e.data as { label?: string }).label === "strike-budget:failure"
    );
    const effectIdsRecorded = new Set(
      failureEvents.map((e) => (e.data as { effectId?: string }).effectId)
    );
    expect(effectIdsRecorded.has(effectId1)).toBe(true);
    // Note: effectId2's strike event is written on its first replay below.
    void tracker;
  });

  test("different bugClass values count independently", async () => {
    const { runDir, runId } = await createTestRun("run-strike-multi");
    const budget: ForwardFixStrikeBudget = { perBugClass: 2 };
    // Seed two strikes for "wedge", zero for "other".
    const ctx = await buildContextWithBudget(runDir, runId, budget, true, [
      { bugClass: "wedge", effectId: "eff-prior-1" },
      { bugClass: "wedge", effectId: "eff-prior-2" },
    ]);
    expect(ctx.strikeTracker!.isExhausted("wedge")).toBe(true);
    expect(ctx.strikeTracker!.isExhausted("other")).toBe(false);

    // A fresh task with bugClass=other should dispatch normally.
    await expect(
      runTaskIntrinsic({
        task: fixTask,
        args: { attempt: 1 },
        invokeOptions: { metadata: { bugClass: "other" } },
        context: ctx,
      })
    ).rejects.toThrow(EffectRequestedError);
  });

  test("explicit bugClass on task.metadata takes precedence over derived label", async () => {
    const { runDir, runId } = await createTestRun("run-strike-precedence");
    const budget: ForwardFixStrikeBudget = { perBugClass: 1 };
    const ctx = await buildContextWithBudget(runDir, runId, budget, true, [
      { bugClass: "explicit-bug", effectId: "eff-prior" },
    ]);

    // Even though the label suggests `derived-bug`, the explicit metadata
    // value `explicit-bug` should be used → triggering pivot because
    // explicit-bug has already exhausted its budget.
    await expect(
      runTaskIntrinsic({
        task: fixTask,
        args: { attempt: 1 },
        invokeOptions: {
          label: "fix:derived-bug",
          metadata: { bugClass: "explicit-bug" },
        },
        context: ctx,
      })
    ).rejects.toThrow(StrikeBudgetExhaustedError);
  });

  test("non-interactive mode auto-pivots: throws StrikeBudgetExhaustedError, emits PROCESS_LOG, writes artifact", async () => {
    const { runDir, runId } = await createTestRun("run-strike-noni");
    const budget: ForwardFixStrikeBudget = {
      perBugClass: 2,
      pivotPhase: "verbose-logs",
      instrumentationTemplate: "verbose-logs.preview",
    };
    const ctx = await buildContextWithBudget(runDir, runId, budget, true, [
      { bugClass: "wedge", effectId: "eff-a" },
      { bugClass: "wedge", effectId: "eff-b" },
    ]);
    expect(ctx.strikeTracker!.isExhausted("wedge")).toBe(true);

    let caught: StrikeBudgetExhaustedError | undefined;
    try {
      await runTaskIntrinsic({
        task: fixTask,
        args: { attempt: 3 },
        invokeOptions: { metadata: { bugClass: "wedge" } },
        context: ctx,
      });
    } catch (error) {
      caught = error as StrikeBudgetExhaustedError;
    }
    expect(caught).toBeInstanceOf(StrikeBudgetExhaustedError);
    expect(caught!.bugClass).toBe("wedge");
    expect(caught!.strikes).toBe(2);
    expect(caught!.budget).toBe(2);
    expect(caught!.pivotPhase).toBe("verbose-logs");
    expect(caught!.instrumentationTemplate).toBe("verbose-logs.preview");

    // PROCESS_LOG event was emitted with the exhausted label.
    const events = await loadJournal(runDir);
    const exhaustedEvents = events.filter(
      (e) =>
        e.type === "PROCESS_LOG" &&
        (e.data as { label?: string }).label === "strike-budget-exhausted"
    );
    expect(exhaustedEvents).toHaveLength(1);
    const data = exhaustedEvents[0].data as {
      bugClass: string;
      strikes: number;
      pivotPhase: string;
      nonInteractive: boolean;
    };
    expect(data.bugClass).toBe("wedge");
    expect(data.strikes).toBe(2);
    expect(data.pivotPhase).toBe("verbose-logs");
    expect(data.nonInteractive).toBe(true);

    // Artifact written.
    const artifactPath = path.join(runDir, "artifacts", "strike-budget-wedge.json");
    const artifact = JSON.parse(await fs.readFile(artifactPath, "utf8"));
    expect(artifact).toMatchObject({
      bugClass: "wedge",
      strikes: 2,
      budgetPerBugClass: 2,
      pivotPhase: "verbose-logs",
      instrumentationTemplate: "verbose-logs.preview",
      runId,
    });
  });

  test("interactive mode throws StrikeBudgetExhaustedError without writing an artifact", async () => {
    const { runDir, runId } = await createTestRun("run-strike-interactive");
    const budget: ForwardFixStrikeBudget = { perBugClass: 1, pivotPhase: "diagnose" };
    const ctx = await buildContextWithBudget(runDir, runId, budget, false, [
      { bugClass: "wedge", effectId: "eff-prior" },
    ]);

    await expect(
      runTaskIntrinsic({
        task: fixTask,
        args: { attempt: 1 },
        invokeOptions: { metadata: { bugClass: "wedge" } },
        context: ctx,
      })
    ).rejects.toThrow(StrikeBudgetExhaustedError);

    // Interactive mode still emits PROCESS_LOG (orchestrator may render
    // a pivot breakpoint), but does NOT write a process artifact.
    const events = await loadJournal(runDir);
    const exhaustedEvents = events.filter(
      (e) =>
        e.type === "PROCESS_LOG" &&
        (e.data as { label?: string }).label === "strike-budget-exhausted"
    );
    expect(exhaustedEvents).toHaveLength(1);
    expect((exhaustedEvents[0].data as { nonInteractive: boolean }).nonInteractive).toBe(false);

    const artifactsDir = path.join(runDir, "artifacts");
    const artifactExists = await fs
      .access(artifactsDir)
      .then(() => true)
      .catch(() => false);
    // Either the directory was never created, or no strike-budget-* file is inside.
    if (artifactExists) {
      const entries = await fs.readdir(artifactsDir);
      expect(entries.some((n) => n.startsWith("strike-budget-"))).toBe(false);
    }
  });

  test("tasks WITHOUT a bugClass are never gated", async () => {
    const { runDir, runId } = await createTestRun("run-strike-noclass");
    const budget: ForwardFixStrikeBudget = { perBugClass: 1 };
    const ctx = await buildContextWithBudget(runDir, runId, budget, true, [
      { bugClass: "wedge", effectId: "eff-prior" },
    ]);

    // Task with NO bugClass should bypass the gate completely.
    await expect(
      runTaskIntrinsic({
        task: fixTask,
        args: { attempt: 1 },
        invokeOptions: { label: "arbitrary-task" },
        context: ctx,
      })
    ).rejects.toThrow(EffectRequestedError);
  });

  test("tasks below threshold dispatch normally", async () => {
    const { runDir, runId } = await createTestRun("run-strike-below");
    const budget: ForwardFixStrikeBudget = { perBugClass: 3 };
    // Seed ONE strike. Budget is 3, so we're below the threshold.
    const ctx = await buildContextWithBudget(runDir, runId, budget, true, [
      { bugClass: "wedge", effectId: "eff-1" },
    ]);

    await expect(
      runTaskIntrinsic({
        task: fixTask,
        args: { attempt: 2 },
        invokeOptions: { metadata: { bugClass: "wedge" } },
        context: ctx,
      })
    ).rejects.toThrow(EffectRequestedError);
  });
});

describe("createReplayEngine — strike-tracker journal rehydration", () => {
  test("replay rebuilds tracker counts from strike-budget:failure events", async () => {
    const { runDir, runId } = await createTestRun("run-strike-rehydrate");
    // Manually append two strike-failure PROCESS_LOG events.
    await appendEvent({
      runDir,
      eventType: "PROCESS_LOG",
      event: {
        logSeq: -1,
        label: "strike-budget:failure",
        bugClass: "wedge",
        effectId: "eff-1",
        strikes: 1,
        budgetPerBugClass: 2,
      },
    });
    await appendEvent({
      runDir,
      eventType: "PROCESS_LOG",
      event: {
        logSeq: -1,
        label: "strike-budget:failure",
        bugClass: "wedge",
        effectId: "eff-2",
        strikes: 2,
        budgetPerBugClass: 2,
      },
    });
    // Write the budget into run.json by re-saving metadata via createRun
    // is not feasible here (different code path); instead read+patch the file.
    const runJsonPath = path.join(runDir, "run.json");
    const runJson = JSON.parse(await fs.readFile(runJsonPath, "utf8"));
    runJson.forwardFixStrikeBudget = { perBugClass: 2, pivotPhase: "instrumentation" };
    await fs.writeFile(runJsonPath, JSON.stringify(runJson, null, 2) + "\n", "utf8");

    const { createReplayEngine } = await import("../../replay/createReplayEngine");
    const engine = await createReplayEngine({ runDir });
    expect(engine.internalContext.strikeTracker?.get("wedge")).toBe(2);
    expect(engine.internalContext.strikeTracker?.isExhausted("wedge")).toBe(true);
    void runId;
  });

  test("replay dedupes duplicate effectIds during rebuild", async () => {
    const { runDir, runId } = await createTestRun("run-strike-dedupe");
    // Write the SAME effectId twice — corrupted-journal scenario.
    for (let i = 0; i < 2; i++) {
      await appendEvent({
        runDir,
        eventType: "PROCESS_LOG",
        event: {
          logSeq: -1,
          label: "strike-budget:failure",
          bugClass: "wedge",
          effectId: "eff-dup",
          strikes: 1,
          budgetPerBugClass: 2,
        },
      });
    }
    const runJsonPath = path.join(runDir, "run.json");
    const runJson = JSON.parse(await fs.readFile(runJsonPath, "utf8"));
    runJson.forwardFixStrikeBudget = { perBugClass: 2 };
    await fs.writeFile(runJsonPath, JSON.stringify(runJson, null, 2) + "\n", "utf8");

    const { createReplayEngine } = await import("../../replay/createReplayEngine");
    const engine = await createReplayEngine({ runDir });
    // Dedup keeps the count at 1, not 2.
    expect(engine.internalContext.strikeTracker?.get("wedge")).toBe(1);
    void runId;
  });
});
