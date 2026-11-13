import { describe, it, expect, vi, beforeEach } from "vitest";
import { ReplayCursor } from "../../replay/replayCursor";
import { TaskIntrinsicContext } from "../task";
import { EffectIndex } from "../../replay/effectIndex";

vi.mock("../task", async (importOriginal) => {
  const orig = await importOriginal<typeof import("../task")>();
  return {
    ...orig,
    runTaskIntrinsic: vi.fn(),
  };
});

vi.mock("../../../storage/journal", () => ({
  appendEvent: vi.fn().mockResolvedValue(undefined),
}));

function buildContext(nonInteractive: boolean): TaskIntrinsicContext & { nonInteractive: boolean } {
  return {
    runId: "run-bp-test",
    runDir: "/tmp/run-bp-test",
    processId: "proc-bp-test",
    effectIndex: {} as EffectIndex,
    replayCursor: new ReplayCursor(),
    now: () => new Date("2026-03-31T00:00:00Z"),
    nonInteractive,
  };
}

function buildInternalContext(nonInteractive: boolean): TaskIntrinsicContext & { nonInteractive: boolean; logSeq: number; recordedLogSeqs: Set<number> } {
  return {
    runId: "run-bp-test",
    runDir: "/tmp/run-bp-test",
    processId: "proc-bp-test",
    effectIndex: {} as EffectIndex,
    replayCursor: new ReplayCursor(),
    now: () => new Date("2026-03-31T00:00:00Z"),
    nonInteractive,
    logSeq: 0,
    recordedLogSeqs: new Set<number>(),
  };
}

describe("runBreakpointIntrinsic non-interactive skip", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns auto-approved result immediately when nonInteractive is true", async () => {
    const { runBreakpointIntrinsic } = await import("../breakpoint");
    const { runTaskIntrinsic } = await import("../task");

    const ctx = buildContext(true);
    const result = await runBreakpointIntrinsic("test payload", ctx);

    expect(result).toEqual({
      approved: true,
      auto: true,
      response: "Auto-approved (non-interactive mode)",
    });
    expect(runTaskIntrinsic).not.toHaveBeenCalled();
  });

  it("logs PROCESS_LOG event when skipping breakpoint", async () => {
    const { runBreakpointIntrinsic } = await import("../breakpoint");
    const { appendEvent } = await import("../../../storage/journal");

    const ctx = buildContext(true);
    await runBreakpointIntrinsic("payload", ctx, { label: "review-gate" });

    expect(appendEvent).toHaveBeenCalled();
    const call = (appendEvent as ReturnType<typeof vi.fn>).mock.calls[0][0] as {
      eventType: string;
      event: { label: string; message: string };
    };
    expect(call.eventType).toBe("PROCESS_LOG");
    expect(call.event.label).toBe("breakpoint:skipped");
    expect(call.event.message).toContain("review-gate");
  });

  it("defers protected gates without opt-in and records their identity", async () => {
    const { runBreakpointIntrinsic } = await import("../breakpoint");
    const { runTaskIntrinsic } = await import("../task");
    const { appendEvent } = await import("../../../storage/journal");
    const ctx = buildContext(true);
    const result = await runBreakpointIntrinsic(
      { title: "Deploy production" }, ctx,
      { breakpointId: "deploy.owner", expert: "owner", tags: ["destructive", "approval-gate"] },
    );
    expect(result).toMatchObject({ approved: false, deferred: true });
    expect(runTaskIntrinsic).not.toHaveBeenCalled();
    expect(appendEvent).toHaveBeenCalledWith(expect.objectContaining({
      event: expect.objectContaining({
        label: "breakpoint:deferred",
        breakpointLabel: "Deploy production",
        breakpointId: "deploy.owner",
        expert: "owner",
        tags: ["destructive", "approval-gate"],
      }),
    }));
  });

  it("refuses protected tags without an expert and permits explicit opt-in", async () => {
    const { runBreakpointIntrinsic } = await import("../breakpoint");
    const ctx = buildContext(true);
    expect(await runBreakpointIntrinsic({ label: "delete" }, ctx, { tags: ["destructive"] }))
      .toMatchObject({ approved: false, deferred: true });
    Object.assign(ctx, { nonInteractiveOwnerGates: "approve" });
    expect(await runBreakpointIntrinsic({ label: "delete" }, ctx, { tags: ["destructive"] }))
      .toMatchObject({ approved: true, auto: true });
  });

  it("uses payload labels and titles for journal identity and interactive keys", async () => {
    const { runBreakpointIntrinsic } = await import("../breakpoint");
    const { appendEvent } = await import("../../../storage/journal");
    const { runTaskIntrinsic } = await import("../task");
    const ctx = buildContext(true);
    await runBreakpointIntrinsic({ label: "Payload label", title: "Ignored title" }, ctx);
    await runBreakpointIntrinsic({ title: "Owner review" }, ctx);
    await runBreakpointIntrinsic({}, ctx, { breakpointId: "explicit.gate" });
    const events = (appendEvent as ReturnType<typeof vi.fn>).mock.calls.map((call) => call[0].event);
    expect(events[0]).toMatchObject({ breakpointLabel: "Payload label", breakpointId: "payload-label" });
    expect(events[1]).toMatchObject({ breakpointLabel: "Owner review", breakpointId: "owner-review" });
    expect(events[2]).toMatchObject({ breakpointLabel: "explicit.gate", breakpointId: "explicit.gate" });
    const interactive = buildContext(false);
    (runTaskIntrinsic as ReturnType<typeof vi.fn>).mockResolvedValue({ approved: true });
    await runBreakpointIntrinsic({ title: "Owner review" }, interactive);
    expect((runTaskIntrinsic as ReturnType<typeof vi.fn>).mock.calls[0][0].invokeOptions.key)
      .toBe("__sdk.breakpoint.owner-review");
  });

  it("uses sequential positive logSeq (not -1) for each auto-approved breakpoint", async () => {
    const { runBreakpointIntrinsic } = await import("../breakpoint");
    const { appendEvent } = await import("../../../storage/journal");

    const ctx = buildInternalContext(true);

    await runBreakpointIntrinsic("payload-1", ctx, { label: "gate-1" });
    await runBreakpointIntrinsic("payload-2", ctx, { label: "gate-2" });

    const calls = (appendEvent as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls.length).toBeGreaterThanOrEqual(2);

    const logSeqs = calls.map((c) => (c[0] as { event: { logSeq: number } }).event.logSeq);

    // Each logSeq must be a positive number, not -1
    for (const seq of logSeqs) {
      expect(seq).toBeGreaterThan(0);
      expect(seq).not.toBe(-1);
    }

    // Each call must have a DIFFERENT logSeq (sequential, not duplicated)
    expect(new Set(logSeqs).size).toBe(logSeqs.length);
  });

  it("calls runTaskIntrinsic normally when nonInteractive is false", async () => {
    const { runBreakpointIntrinsic } = await import("../breakpoint");
    const { runTaskIntrinsic } = await import("../task");

    (runTaskIntrinsic as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("EffectRequestedError simulation")
    );

    const ctx = buildContext(false);
    await expect(runBreakpointIntrinsic("test payload", ctx)).rejects.toThrow(
      "EffectRequestedError simulation"
    );
    expect(runTaskIntrinsic).toHaveBeenCalled();
  });
});

describe("runBreakpointIntrinsic invocation-key disambiguation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function keysFromCalls(runTaskIntrinsic: ReturnType<typeof vi.fn>): string[] {
    return runTaskIntrinsic.mock.calls.map(
      (c) => (c[0] as { invokeOptions?: { key?: string } }).invokeOptions?.key as string
    );
  }

  it("gives repeated default breakpoints DISTINCT keys (no collision / inherited approval)", async () => {
    const { runBreakpointIntrinsic } = await import("../breakpoint");
    const { runTaskIntrinsic } = await import("../task");
    const mock = runTaskIntrinsic as ReturnType<typeof vi.fn>;
    mock.mockResolvedValue({ approved: true });

    // Interactive context shared across two breakpoints with no explicit
    // label/breakpointId — the exact shape that used to collide on
    // "__sdk.breakpoint.breakpoint".
    const ctx = buildContext(false);
    await runBreakpointIntrinsic({ question: "Approve step 1?" }, ctx);
    await runBreakpointIntrinsic({ question: "Final sign-off?" }, ctx);

    const keys = keysFromCalls(mock);
    expect(keys).toEqual(["__sdk.breakpoint.breakpoint", "__sdk.breakpoint.breakpoint.1"]);
    expect(new Set(keys).size).toBe(2); // distinct => second cannot inherit the first's result
  });

  it("keeps the first occurrence's bare key (backward-compat) and suffixes later ones", async () => {
    const { runBreakpointIntrinsic } = await import("../breakpoint");
    const { runTaskIntrinsic } = await import("../task");
    const mock = runTaskIntrinsic as ReturnType<typeof vi.fn>;
    mock.mockResolvedValue({ approved: true });

    const ctx = buildContext(false);
    await runBreakpointIntrinsic({ question: "a" }, ctx, { breakpointId: "gate" });
    await runBreakpointIntrinsic({ question: "b" }, ctx, { breakpointId: "gate" });
    await runBreakpointIntrinsic({ question: "c" }, ctx, { breakpointId: "other" });

    expect(keysFromCalls(mock)).toEqual([
      "__sdk.breakpoint.gate",
      "__sdk.breakpoint.gate.1",
      "__sdk.breakpoint.other",
    ]);
  });
});
