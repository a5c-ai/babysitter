import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  emitProgress,
  formatElapsed,
  createStreamingProgressCallbacks,
} from "../utils";

describe("Terminal progress output", () => {
  let stderrSpy: ReturnType<typeof vi.spyOn>;
  let stdoutSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    stderrSpy = vi.spyOn(process.stderr, "write").mockReturnValue(true);
    stdoutSpy = vi.spyOn(process.stdout, "write").mockReturnValue(true);
  });

  afterEach(() => {
    stderrSpy.mockRestore();
    stdoutSpy.mockRestore();
  });

  describe("formatElapsed", () => {
    it("formats sub-second durations", () => {
      expect(formatElapsed(0)).toBe("<1s");
      expect(formatElapsed(500)).toBe("<1s");
      expect(formatElapsed(999)).toBe("<1s");
    });

    it("formats seconds", () => {
      expect(formatElapsed(1000)).toBe("1s");
      expect(formatElapsed(1500)).toBe("1s");
      expect(formatElapsed(5000)).toBe("5s");
      expect(formatElapsed(59000)).toBe("59s");
    });

    it("formats minutes and seconds", () => {
      expect(formatElapsed(60000)).toBe("1m 0s");
      expect(formatElapsed(90000)).toBe("1m 30s");
      expect(formatElapsed(125000)).toBe("2m 5s");
      expect(formatElapsed(600000)).toBe("10m 0s");
    });

    it("handles negative values", () => {
      expect(formatElapsed(-100)).toBe("<1s");
    });
  });

  describe("emitProgress — iteration-start", () => {
    it("writes iteration number to stderr in cli mode", () => {
      emitProgress(
        { phase: "2", status: "iteration-start", iteration: 3, elapsedMs: 5000 },
        false,
        false,
        "cli",
      );
      expect(stderrSpy).toHaveBeenCalled();
      const output = stderrSpy.mock.calls.map((c) => c[0]).join("");
      expect(output).toContain("iteration 3");
      expect(output).toContain("5s");
    });

    it("outputs JSON in json mode", () => {
      const consoleSpy = vi.spyOn(console, "log").mockReturnValue();
      emitProgress(
        { phase: "2", status: "iteration-start", iteration: 1, elapsedMs: 0 },
        true,
        false,
        "json",
      );
      expect(consoleSpy).toHaveBeenCalled();
      const parsed = JSON.parse(consoleSpy.mock.calls[0][0] as string);
      expect(parsed.status).toBe("iteration-start");
      expect(parsed.iteration).toBe(1);
      consoleSpy.mockRestore();
    });

    it("is silent in tui mode", () => {
      emitProgress(
        { phase: "2", status: "iteration-start", iteration: 1 },
        false,
        false,
        "tui",
      );
      expect(stderrSpy).not.toHaveBeenCalled();
    });
  });

  describe("emitProgress — effect-start", () => {
    it("writes effect kind and title to stderr", () => {
      emitProgress(
        {
          phase: "2",
          status: "effect-start",
          effectKind: "agent",
          effectTitle: "Write tests",
          effectHarness: "claude-code",
        },
        false,
        false,
        "cli",
      );
      expect(stderrSpy).toHaveBeenCalled();
      const output = stderrSpy.mock.calls.map((c) => c[0]).join("");
      expect(output).toContain("agent");
      expect(output).toContain("Write tests");
      expect(output).toContain("claude-code");
    });

    it("falls back to effectId when no title", () => {
      emitProgress(
        {
          phase: "2",
          status: "effect-start",
          effectKind: "shell",
          effectId: "eff-123",
        },
        false,
        false,
        "cli",
      );
      const output = stderrSpy.mock.calls.map((c) => c[0]).join("");
      expect(output).toContain("eff-123");
    });
  });

  describe("emitProgress — effect (completion)", () => {
    it("shows elapsed time when available", () => {
      emitProgress(
        {
          phase: "2",
          status: "effect",
          effectKind: "agent",
          effectTitle: "Design system",
          effectStatus: "ok",
          elapsedMs: 45000,
        },
        false,
        false,
        "cli",
      );
      const output = stderrSpy.mock.calls.map((c) => c[0]).join("");
      expect(output).toContain("45s");
      expect(output).toContain("Design system");
    });

    it("shows stdout tail for shell effects", () => {
      emitProgress(
        {
          phase: "2",
          status: "effect",
          effectKind: "shell",
          effectTitle: "Run tests",
          effectStatus: "ok",
          elapsedMs: 3000,
          output: "line 1\nline 2\nline 3\nline 4\nline 5\nline 6\nline 7",
        },
        false,
        false,
        "cli",
      );
      const output = stderrSpy.mock.calls.map((c) => c[0]).join("");
      // Should show last 5 lines
      expect(output).toContain("line 3");
      expect(output).toContain("line 7");
      // Should NOT show line 1 (it's outside the tail)
      expect(output).not.toContain("line 1");
    });

    it("shows condensed output for agent effects", () => {
      emitProgress(
        {
          phase: "2",
          status: "effect",
          effectKind: "agent",
          effectTitle: "Score results",
          effectStatus: "ok",
          output: "Quality score: 92/100. All checks passed.",
        },
        false,
        false,
        "cli",
      );
      const output = stderrSpy.mock.calls.map((c) => c[0]).join("");
      expect(output).toContain("Quality score: 92/100");
    });

    it("shows error message on failure", () => {
      emitProgress(
        {
          phase: "2",
          status: "effect",
          effectKind: "shell",
          effectTitle: "Compile",
          effectStatus: "error",
          elapsedMs: 1000,
          error: "tsc exited with code 1",
        },
        false,
        false,
        "cli",
      );
      const output = stderrSpy.mock.calls.map((c) => c[0]).join("");
      expect(output).toContain("tsc exited with code 1");
      expect(output).toContain("1s");
    });

    it("omits elapsed time when not provided", () => {
      emitProgress(
        {
          phase: "2",
          status: "effect",
          effectKind: "agent",
          effectTitle: "Plan",
          effectStatus: "ok",
        },
        false,
        false,
        "cli",
      );
      const output = stderrSpy.mock.calls.map((c) => c[0]).join("");
      expect(output).toContain("Plan");
      // No time should appear since elapsedMs is undefined
      expect(output).not.toMatch(/\d+s/);
    });
  });

  describe("emitProgress — iteration-summary", () => {
    it("writes elapsed time and effect count to stderr", () => {
      emitProgress(
        {
          phase: "2",
          status: "iteration-summary",
          iteration: 2,
          effectsResolved: 3,
          elapsedMs: 15000,
        },
        false,
        false,
        "cli",
      );
      expect(stderrSpy).toHaveBeenCalled();
      const output = stderrSpy.mock.calls.map((c) => c[0]).join("");
      expect(output).toContain("3");
      expect(output).toContain("15s");
    });

    it("includes token estimate when present", () => {
      emitProgress(
        {
          phase: "2",
          status: "iteration-summary",
          iteration: 1,
          effectsResolved: 1,
          elapsedMs: 2000,
          tokenEstimate: 4500,
        },
        false,
        false,
        "cli",
      );
      const output = stderrSpy.mock.calls.map((c) => c[0]).join("");
      expect(output).toContain("4500");
    });
  });

  describe("createStreamingProgressCallbacks", () => {
    it("returns StreamingOutputOptions for cli mode", () => {
      const callbacks = createStreamingProgressCallbacks("cli", "claude-code");
      expect(callbacks).toBeDefined();
      expect(callbacks!.onLine).toBeTypeOf("function");
    });

    it("onLine writes to stderr with prefix", () => {
      const callbacks = createStreamingProgressCallbacks("cli", "claude-code");
      callbacks!.onLine!("hello world", "stdout");
      expect(stderrSpy).toHaveBeenCalled();
      const output = stderrSpy.mock.calls[0][0] as string;
      expect(output).toContain("hello world");
    });

    it("truncates long lines", () => {
      const callbacks = createStreamingProgressCallbacks("cli", "test-harness");
      const longLine = "x".repeat(300);
      callbacks!.onLine!(longLine, "stdout");
      const output = stderrSpy.mock.calls[0][0] as string;
      // Should be truncated — not contain the full 300 chars
      expect(output.length).toBeLessThan(350);
    });

    it("returns undefined for json mode", () => {
      const callbacks = createStreamingProgressCallbacks("json", "claude-code");
      expect(callbacks).toBeUndefined();
    });

    it("returns undefined for tui mode", () => {
      const callbacks = createStreamingProgressCallbacks("tui", "claude-code");
      expect(callbacks).toBeUndefined();
    });
  });
});
