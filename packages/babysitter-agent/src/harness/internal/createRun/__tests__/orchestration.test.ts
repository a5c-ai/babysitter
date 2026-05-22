import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AgentCoreSessionEvent } from "../../../types";
import { subscribeVerbosePiEvents } from "../orchestration";

describe("subscribeVerbosePiEvents", () => {
  let stderrSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    stderrSpy = vi.spyOn(process.stderr, "write").mockReturnValue(true);
  });

  afterEach(() => {
    stderrSpy.mockRestore();
  });

  it("prints assistant message text and structured tool activity in verbose mode", () => {
    let listener: ((event: AgentCoreSessionEvent) => void) | undefined;
    const session = {
      subscribe(fn: (event: AgentCoreSessionEvent) => void) {
        listener = fn;
        return () => {
          listener = undefined;
        };
      },
    };

    const unsubscribe = subscribeVerbosePiEvents(
      session as never,
      "orchestrator",
      { verbose: true, json: false, outputMode: "cli" },
    );

    expect(typeof unsubscribe).toBe("function");

    listener?.({
      type: "turn_start",
    });
    listener?.({
      type: "message_start",
      role: "assistant",
    });
    listener?.({
      type: "message_end",
      message: {
        role: "assistant",
        content: [
          { type: "text", text: "Reading the process file before patching it." },
        ],
      },
    });
    listener?.({
      type: "tool_execution_start",
      name: "write",
      input: {
        path: ".a5c/runs/run-1/process/process.mjs",
        content: "patched content",
      },
    });
    listener?.({
      type: "tool_execution_end",
      result: {
        status: "ok",
        output: "updated process file",
      },
    });
    listener?.({
      type: "message_start",
      role: "toolResult",
    });
    listener?.({
      type: "message_end",
      message: {
        role: "toolResult",
        content: [
          { type: "text", text: "Wrote .a5c/runs/run-1/process/process.mjs" },
        ],
      },
    });

    const output = stderrSpy.mock.calls.map((call) => String(call[0])).join("");
    expect(output).toContain("[orchestrator turn:start]");
    expect(output).toContain("[orchestrator message:start] role=assistant");
    expect(output).toContain("Reading the process file before patching it.");
    expect(output).toContain("tool ");
    expect(output).toContain("write");
    expect(output).toContain(".a5c/runs/run-1/process/process.mjs");
    expect(output).toContain("updated process file");
    expect(output).toContain("Wrote .a5c/runs/run-1/process/process.mjs");
  });
});
