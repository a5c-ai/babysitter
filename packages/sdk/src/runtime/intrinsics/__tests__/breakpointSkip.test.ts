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
