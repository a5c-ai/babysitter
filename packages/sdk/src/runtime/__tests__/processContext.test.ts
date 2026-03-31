import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import {
  createProcessContext,
  getActiveProcessContext,
  requireProcessContext,
  withProcessContext,
} from "../processContext";
import { ReplayCursor } from "../replay/replayCursor";
import { EffectIndex } from "../replay/effectIndex";
import {
  EffectPendingError,
  EffectRequestedError,
  MissingProcessContextError,
  ParallelPendingError,
} from "../exceptions";
import { EffectAction, TaskDef } from "../types";
import { buildParallelBatch } from "../../tasks/batching";

// Mock log modules and fs for ctx.log tests
vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs")>();
  return {
    ...actual,
    promises: {
      ...actual.promises,
      appendFile: vi.fn().mockResolvedValue(undefined),
    },
  };
});
vi.mock("../../logging/runLogger", () => ({
  appendRunLog: vi.fn().mockResolvedValue("/tmp/test.log"),
}));
vi.mock("../../hooks/dispatcher", () => ({
  callHook: vi.fn().mockResolvedValue(undefined),
}));

function effectIndexStub(): EffectIndex {
  return {} as EffectIndex;
}

const sampleTaskDef: TaskDef = {
  kind: "node",
  title: "demo",
};

function makeAction(id: string): EffectAction {
  return {
    effectId: `01EFF${id}`,
    invocationKey: `proc:S00000${id}:task-${id}`,
    kind: "node",
    label: `task-${id}`,
    labels: [`task-${id}`, "shared"],
    stepId: `S00000${id}`,
    taskId: `task-${id}`,
    taskDefRef: `tasks/01EFF${id}/task.json`,
    inputsRef: `tasks/01EFF${id}/inputs.json`,
    requestedAt: "2026-01-01T00:00:00Z",
    taskDef: sampleTaskDef,
  };
}

const delay = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

describe("ProcessContext ambient helpers", () => {
  test("withProcessContext isolates ALS scopes across concurrent runs", async () => {
    const { internalContext: ctxA } = createProcessContext({
      runId: "run-1",
      runDir: "/tmp/run-1",
      processId: "proc-1",
      effectIndex: effectIndexStub(),
      replayCursor: new ReplayCursor(),
    });
    const { internalContext: ctxB } = createProcessContext({
      runId: "run-2",
      runDir: "/tmp/run-2",
      processId: "proc-2",
      effectIndex: effectIndexStub(),
      replayCursor: new ReplayCursor(),
    });

    await Promise.all([
      withProcessContext(ctxA, async () => {
        expect(requireProcessContext().processId).toBe("proc-1");
        await new Promise((resolve) => setTimeout(resolve, 5));
        expect(requireProcessContext().processId).toBe("proc-1");
      }),
      withProcessContext(ctxB, async () => {
        expect(requireProcessContext().processId).toBe("proc-2");
      }),
    ]);

    expect(getActiveProcessContext()).toBeUndefined();
  });

  test("cleans up ambient context even when the scoped function throws", async () => {
    const { internalContext } = createProcessContext({
      runId: "run-error",
      runDir: "/tmp/run-error",
      processId: "proc-error",
      effectIndex: effectIndexStub(),
      replayCursor: new ReplayCursor(),
    });

    await expect(
      withProcessContext(internalContext, async () => {
        expect(requireProcessContext().processId).toBe("proc-error");
        throw new Error("boom");
      })
    ).rejects.toThrow("boom");

    expect(getActiveProcessContext()).toBeUndefined();
  });

  test("requireProcessContext throws when no scope is active", () => {
    expect(() => requireProcessContext()).toThrow(MissingProcessContextError);
  });

  test("restores the previous context after nested scopes complete", async () => {
    const { internalContext: outer } = createProcessContext({
      runId: "run-outer",
      runDir: "/tmp/run-outer",
      processId: "proc-outer",
      effectIndex: effectIndexStub(),
      replayCursor: new ReplayCursor(),
    });
    const { internalContext: inner } = createProcessContext({
      runId: "run-inner",
      runDir: "/tmp/run-inner",
      processId: "proc-inner",
      effectIndex: effectIndexStub(),
      replayCursor: new ReplayCursor(),
    });

    await withProcessContext(outer, async () => {
      expect(requireProcessContext().processId).toBe("proc-outer");
      await withProcessContext(inner, async () => {
        expect(requireProcessContext().processId).toBe("proc-inner");
      });
      expect(requireProcessContext().processId).toBe("proc-outer");
    });

    expect(getActiveProcessContext()).toBeUndefined();
  });

  test("maintains isolation across awaited microtasks", async () => {
    const { internalContext } = createProcessContext({
      runId: "run-micro",
      runDir: "/tmp/run-micro",
      processId: "proc-micro",
      effectIndex: effectIndexStub(),
      replayCursor: new ReplayCursor(),
    });

    await withProcessContext(internalContext, async () => {
      await Promise.all([
        (async () => {
          await delay(1);
          expect(requireProcessContext().processId).toBe("proc-micro");
        })(),
        (async () => {
          await delay(2);
          expect(requireProcessContext().processId).toBe("proc-micro");
        })(),
      ]);
    });

    expect(getActiveProcessContext()).toBeUndefined();
  });

  test("getActiveProcessContext returns undefined outside ALS scopes", () => {
    expect(getActiveProcessContext()).toBeUndefined();
  });
});

describe("ProcessContext parallel helpers", () => {
  test("ctx.log is always callable (no-op when no logger configured)", () => {
    const { context, internalContext } = createProcessContext({
      runId: "run-log",
      runDir: "/tmp/run-log",
      processId: "proc-log",
      effectIndex: effectIndexStub(),
      replayCursor: new ReplayCursor(),
    });
    expect(typeof context.log).toBe("function");
    expect(() => context.log?.("hello")).not.toThrow();
    expect(internalContext.logger).toBeUndefined();
  });

  test("non-function logger inputs are ignored to avoid runtime TypeError", () => {
    const { context, internalContext } = createProcessContext({
      runId: "run-bad-log",
      runDir: "/tmp/run-bad-log",
      processId: "proc-bad-log",
      effectIndex: effectIndexStub(),
      replayCursor: new ReplayCursor(),
      logger: "not-a-function" as any,
    });
    expect(typeof context.log).toBe("function");
    expect(() => context.log?.("hello")).not.toThrow();
    expect(internalContext.logger).toBeUndefined();
  });

  test("ctx.parallel.all aggregates pending actions into ParallelPendingError", async () => {
    const { context } = createProcessContext({
      runId: "run-parallel",
      runDir: "/tmp/run-parallel",
      processId: "proc-parallel",
      effectIndex: effectIndexStub(),
      replayCursor: new ReplayCursor(),
    });
    const actionA = makeAction("A");
    const actionB = makeAction("B");
    const actionC = makeAction("C");

    await expect(
      context.parallel.all([
        async () => {
          throw new EffectRequestedError(actionA);
        },
        async () => 42,
        async () => {
          throw new EffectPendingError(actionB);
        },
        async () => {
          throw new ParallelPendingError(buildParallelBatch([actionC, actionB]));
        },
      ])
    ).rejects.toSatisfy((error) => {
      expect(error).toBeInstanceOf(ParallelPendingError);
      const parallelError = error as ParallelPendingError;
      expect(parallelError.batch.actions.map((action) => action.effectId)).toEqual([
        actionA.effectId,
        actionB.effectId,
        actionC.effectId,
      ]);
      const groupIds = new Set(
        parallelError.batch.actions.map((action) => action.schedulerHints?.parallelGroupId)
      );
      expect(groupIds.size).toBe(1);
      expect(Array.from(groupIds)[0]).toBeDefined();
      expect(parallelError.batch.summaries[0]).toMatchObject({
        effectId: actionA.effectId,
        labels: actionA.labels,
        taskDefRef: actionA.taskDefRef,
        inputsRef: actionA.inputsRef,
      });
      return true;
    });
  });

  test("ctx.parallel.map aggregates pending actions and deduplicates effects", async () => {
    const { context } = createProcessContext({
      runId: "run-map-pending",
      runDir: "/tmp/run-map-pending",
      processId: "proc-map-pending",
      effectIndex: effectIndexStub(),
      replayCursor: new ReplayCursor(),
    });
    const actionA = makeAction("1");
    const actionB = makeAction("2");

    await expect(
      context.parallel.map(["first", "second", "third"], async (label) => {
        if (label === "first") throw new EffectRequestedError(actionA);
        if (label === "second") throw new EffectPendingError(actionB);
        return label;
      })
    ).rejects.toSatisfy((error) => {
      expect(error).toBeInstanceOf(ParallelPendingError);
      const parallelError = error as ParallelPendingError;
      expect(parallelError.batch.actions.map((action) => action.effectId)).toEqual([
        actionA.effectId,
        actionB.effectId,
      ]);
      const groupIds = new Set(
        parallelError.batch.actions.map((action) => action.schedulerHints?.parallelGroupId)
      );
      expect(groupIds.size).toBe(1);
      expect(Array.from(groupIds)[0]).toBeDefined();
      expect(parallelError.details).toMatchObject({
        payload: { effects: parallelError.batch.summaries },
      });
      return true;
    });
  });

  test("createProcessContext sets nonInteractive from init", () => {
    const { internalContext } = createProcessContext({
      runId: "run-ni-true",
      runDir: "/tmp/run-ni-true",
      processId: "proc-ni-true",
      effectIndex: effectIndexStub(),
      replayCursor: new ReplayCursor(),
      nonInteractive: true,
    });
    expect(internalContext.nonInteractive).toBe(true);
  });

  test("createProcessContext defaults nonInteractive to false", () => {
    const { internalContext } = createProcessContext({
      runId: "run-ni-default",
      runDir: "/tmp/run-ni-default",
      processId: "proc-ni-default",
      effectIndex: effectIndexStub(),
      replayCursor: new ReplayCursor(),
    });
    expect(internalContext.nonInteractive).toBe(false);
  });

  test("ctx.parallel.map resolves values when no pending actions remain", async () => {
    const { context } = createProcessContext({
      runId: "run-map",
      runDir: "/tmp/run-map",
      processId: "proc-map",
      effectIndex: effectIndexStub(),
      replayCursor: new ReplayCursor(),
    });

    const values = await context.parallel.map([1, 2, 3], async (value) => {
      await delay(1);
      return value * 2;
    });

    expect(values).toEqual([2, 4, 6]);
  });
});

describe("ctx.log replay-aware deduplication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("ctx.log writes to logSeqs file and log file on first call", async () => {
    const { promises: mockFs } = await import("node:fs");
    const { appendRunLog } = await import("../../logging/runLogger");

    const { context } = createProcessContext({
      runId: "run-log-new",
      runDir: "/tmp/run-log-new",
      processId: "proc-log-new",
      effectIndex: effectIndexStub(),
      replayCursor: new ReplayCursor(),
    });

    context.log?.("phase:test", "first log");
    await delay(10);

    expect(mockFs.appendFile).toHaveBeenCalledTimes(1);
    expect(mockFs.appendFile).toHaveBeenCalledWith(
      expect.stringContaining("logSeqs.txt"),
      "1\n",
    );

    expect(appendRunLog).toHaveBeenCalledTimes(1);
    expect(appendRunLog).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "process",
        label: "phase:test",
        message: "first log",
        runId: "run-log-new",
        source: "ctx.log",
      }),
    );
  });

  test("ctx.log skips already-recorded seqs from previous iterations", async () => {
    const { promises: mockFs } = await import("node:fs");
    const { appendRunLog } = await import("../../logging/runLogger");

    // Simulate replay: seqs 1 and 2 already recorded
    const { context } = createProcessContext({
      runId: "run-log-replay",
      runDir: "/tmp/run-log-replay",
      processId: "proc-log-replay",
      effectIndex: effectIndexStub(),
      replayCursor: new ReplayCursor(),
      recordedLogSeqs: new Set([1, 2]),
    });

    // These should be skipped (seqs 1 and 2 already recorded)
    context.log?.("label1", "replayed log 1");
    context.log?.("label2", "replayed log 2");

    // This should be written (seq 3 is new)
    context.log?.("label3", "new log 3");
    await delay(10);

    expect(mockFs.appendFile).toHaveBeenCalledTimes(1);
    expect(mockFs.appendFile).toHaveBeenCalledWith(
      expect.stringContaining("logSeqs.txt"),
      "3\n",
    );

    expect(appendRunLog).toHaveBeenCalledTimes(1);
    expect(appendRunLog).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "new log 3",
      }),
    );
  });

  test("ctx.log assigns sequential logSeq numbers", async () => {
    const { promises: mockFs } = await import("node:fs");

    const { context } = createProcessContext({
      runId: "run-log-seq",
      runDir: "/tmp/run-log-seq",
      processId: "proc-log-seq",
      effectIndex: effectIndexStub(),
      replayCursor: new ReplayCursor(),
    });

    context.log?.("msg1");
    context.log?.("msg2");
    context.log?.("msg3");
    await delay(10);

    expect(mockFs.appendFile).toHaveBeenCalledTimes(3);
    const seqs = (mockFs.appendFile as ReturnType<typeof vi.fn>).mock.calls.map(
      (call: unknown[]) => (call[1] as string).trim(),
    );
    expect(seqs).toEqual(["1", "2", "3"]);
  });

  test("ctx.log prevents same-iteration duplicate via recordedLogSeqs set", async () => {
    const { promises: mockFs } = await import("node:fs");

    const { context, internalContext } = createProcessContext({
      runId: "run-log-dup",
      runDir: "/tmp/run-log-dup",
      processId: "proc-log-dup",
      effectIndex: effectIndexStub(),
      replayCursor: new ReplayCursor(),
    });

    context.log?.("first");
    await delay(5);

    // Verify seq 1 was added to recordedLogSeqs
    expect(internalContext.recordedLogSeqs.has(1)).toBe(true);
    expect(mockFs.appendFile).toHaveBeenCalledTimes(1);
  });

  test("ctx.log handles single-arg form (message only, no label)", async () => {
    const { promises: mockFs } = await import("node:fs");

    const { context } = createProcessContext({
      runId: "run-log-nolabel",
      runDir: "/tmp/run-log-nolabel",
      processId: "proc-log-nolabel",
      effectIndex: effectIndexStub(),
      replayCursor: new ReplayCursor(),
    });

    context.log?.("just a message");
    await delay(10);

    expect(mockFs.appendFile).toHaveBeenCalledWith(
      expect.stringContaining("logSeqs.txt"),
      "1\n",
    );
  });

  test("ctx.log ignores non-string arguments", async () => {
    const { promises: mockFs } = await import("node:fs");

    const { context } = createProcessContext({
      runId: "run-log-bad",
      runDir: "/tmp/run-log-bad",
      processId: "proc-log-bad",
      effectIndex: effectIndexStub(),
      replayCursor: new ReplayCursor(),
    });

    context.log?.(42 as unknown as string);
    context.log?.({} as unknown as string);
    await delay(10);

    expect(mockFs.appendFile).not.toHaveBeenCalled();
  });

  test("ctx.log ignores empty message", async () => {
    const { promises: mockFs } = await import("node:fs");

    const { context } = createProcessContext({
      runId: "run-log-empty",
      runDir: "/tmp/run-log-empty",
      processId: "proc-log-empty",
      effectIndex: effectIndexStub(),
      replayCursor: new ReplayCursor(),
    });

    context.log?.("");
    await delay(10);

    expect(mockFs.appendFile).not.toHaveBeenCalled();
  });

  test("ctx.log never throws even when fs.appendFile fails", async () => {
    const { promises: mockFs } = await import("node:fs");
    (mockFs.appendFile as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("disk full"));

    const { context } = createProcessContext({
      runId: "run-log-fail",
      runDir: "/tmp/run-log-fail",
      processId: "proc-log-fail",
      effectIndex: effectIndexStub(),
      replayCursor: new ReplayCursor(),
    });

    expect(() => context.log?.("should not throw")).not.toThrow();
    await delay(10);
  });
});
