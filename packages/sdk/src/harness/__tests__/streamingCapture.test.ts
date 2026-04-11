import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventEmitter } from "node:events";
import type { ChildProcess } from "node:child_process";

// We'll mock child_process.spawn for unit tests
vi.mock("node:child_process", async (importOriginal) => {
  const original = await importOriginal<typeof import("node:child_process")>();
  return {
    ...original,
    spawn: vi.fn(),
  };
});

// Mock discovery to avoid actual CLI lookups
vi.mock("../discovery", () => ({
  checkCliAvailable: vi.fn().mockResolvedValue({ available: true, path: "/usr/bin/claude" }),
}));

import { spawn } from "node:child_process";
import {
  OutputStreamCollector,
  invokeHarnessStreaming,
} from "../streamingCapture";
import type { StreamingOutputOptions } from "../types";

const mockSpawn = vi.mocked(spawn);

function createMockProcess(): ChildProcess & {
  stdout: EventEmitter;
  stderr: EventEmitter;
  _emit_exit: (code: number) => void;
} {
  const proc = new EventEmitter() as ChildProcess & {
    stdout: EventEmitter;
    stderr: EventEmitter;
    stdin: null;
    _emit_exit: (code: number) => void;
    pid: number;
    killed: boolean;
    kill: () => boolean;
  };
  proc.stdout = new EventEmitter();
  proc.stderr = new EventEmitter();
  proc.stdin = null;
  proc.pid = 12345;
  proc.killed = false;
  proc.kill = vi.fn().mockReturnValue(true);
  proc._emit_exit = (code: number) => {
    proc.emit("close", code);
  };
  return proc;
}

/** Helper: emit events on next tick so spawn handlers are attached first. */
function emitAsync(fn: () => void): void {
  setImmediate(fn);
}

describe("GAP-SUBOBS-001: Streaming Output Capture", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("OutputStreamCollector", () => {
    it("collects chunks into final string", () => {
      const collector = new OutputStreamCollector();
      collector.write("hello ");
      collector.write("world");
      expect(collector.getOutput()).toBe("hello world");
    });

    it("emits line events for complete lines", () => {
      const lines: string[] = [];
      const collector = new OutputStreamCollector((line) => lines.push(line));
      collector.write("line1\nline2\n");
      expect(lines).toEqual(["line1", "line2"]);
    });

    it("handles partial lines across chunks", () => {
      const lines: string[] = [];
      const collector = new OutputStreamCollector((line) => lines.push(line));
      collector.write("hel");
      collector.write("lo\nwor");
      collector.write("ld\n");
      expect(lines).toEqual(["hello", "world"]);
    });

    it("flushes remaining partial line on end", () => {
      const lines: string[] = [];
      const collector = new OutputStreamCollector((line) => lines.push(line));
      collector.write("partial");
      collector.flush();
      expect(lines).toEqual(["partial"]);
    });

    it("tracks byte count", () => {
      const collector = new OutputStreamCollector();
      collector.write("hello"); // 5 bytes
      collector.write("world"); // 5 bytes
      expect(collector.byteCount).toBe(10);
    });

    it("handles empty writes", () => {
      const collector = new OutputStreamCollector();
      collector.write("");
      expect(collector.getOutput()).toBe("");
      expect(collector.byteCount).toBe(0);
    });

    it("handles windows-style CRLF line endings", () => {
      const lines: string[] = [];
      const collector = new OutputStreamCollector((line) => lines.push(line));
      collector.write("line1\r\nline2\r\n");
      expect(lines).toEqual(["line1", "line2"]);
    });
  });

  describe("invokeHarnessStreaming", () => {
    it("calls onStdout callback with stdout chunks", async () => {
      const chunks: string[] = [];
      const proc = createMockProcess();
      mockSpawn.mockReturnValue(proc as unknown as ChildProcess);

      const promise = invokeHarnessStreaming("claude-code", {
        prompt: "test",
        streaming: {
          onStdout: (chunk) => chunks.push(chunk),
        },
      });

      // Emit after spawn handlers are attached (checkCliAvailable is async)
      emitAsync(() => {
        proc.stdout.emit("data", Buffer.from("hello "));
        proc.stdout.emit("data", Buffer.from("world"));
        proc._emit_exit(0);
      });

      const result = await promise;
      expect(chunks).toEqual(["hello ", "world"]);
      expect(result.success).toBe(true);
      expect(result.output).toContain("hello world");
    });

    it("calls onStderr callback with stderr chunks", async () => {
      const chunks: string[] = [];
      const proc = createMockProcess();
      mockSpawn.mockReturnValue(proc as unknown as ChildProcess);

      const promise = invokeHarnessStreaming("claude-code", {
        prompt: "test",
        streaming: {
          onStderr: (chunk) => chunks.push(chunk),
        },
      });

      emitAsync(() => {
        proc.stderr.emit("data", Buffer.from("warning"));
        proc._emit_exit(0);
      });

      const result = await promise;
      expect(chunks).toEqual(["warning"]);
      expect(result.success).toBe(true);
    });

    it("calls onLine callback with complete lines from both streams", async () => {
      const lines: Array<{ line: string; source: string }> = [];
      const proc = createMockProcess();
      mockSpawn.mockReturnValue(proc as unknown as ChildProcess);

      const promise = invokeHarnessStreaming("claude-code", {
        prompt: "test",
        streaming: {
          onLine: (line, source) => lines.push({ line, source }),
        },
      });

      emitAsync(() => {
        proc.stdout.emit("data", Buffer.from("stdout line\n"));
        proc.stderr.emit("data", Buffer.from("stderr line\n"));
        proc._emit_exit(0);
      });

      await promise;
      expect(lines).toContainEqual({ line: "stdout line", source: "stdout" });
      expect(lines).toContainEqual({ line: "stderr line", source: "stderr" });
    });

    it("returns combined output in HarnessInvokeResult", async () => {
      const proc = createMockProcess();
      mockSpawn.mockReturnValue(proc as unknown as ChildProcess);

      const promise = invokeHarnessStreaming("claude-code", {
        prompt: "test",
      });

      emitAsync(() => {
        proc.stdout.emit("data", Buffer.from("output text"));
        proc.stderr.emit("data", Buffer.from("error text"));
        proc._emit_exit(0);
      });

      const result = await promise;
      expect(result.output).toContain("output text");
      expect(result.exitCode).toBe(0);
      expect(result.harness).toBe("claude-code");
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it("returns correct exit code on failure", async () => {
      const proc = createMockProcess();
      mockSpawn.mockReturnValue(proc as unknown as ChildProcess);

      const promise = invokeHarnessStreaming("claude-code", {
        prompt: "test",
      });

      emitAsync(() => {
        proc._emit_exit(1);
      });

      const result = await promise;
      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
    });

    it("handles spawn error", async () => {
      const proc = createMockProcess();
      mockSpawn.mockReturnValue(proc as unknown as ChildProcess);

      const promise = invokeHarnessStreaming("claude-code", {
        prompt: "test",
      });

      emitAsync(() => {
        proc.emit("error", new Error("spawn ENOENT"));
      });

      const result = await promise;
      expect(result.success).toBe(false);
      expect(result.output).toContain("spawn ENOENT");
    });

    it("works with no streaming options (buffered mode)", async () => {
      const proc = createMockProcess();
      mockSpawn.mockReturnValue(proc as unknown as ChildProcess);

      const promise = invokeHarnessStreaming("claude-code", {
        prompt: "test",
      });

      emitAsync(() => {
        proc.stdout.emit("data", Buffer.from("output"));
        proc._emit_exit(0);
      });

      const result = await promise;
      expect(result.success).toBe(true);
      expect(result.output).toContain("output");
    });

    it("rejects for unknown harness", async () => {
      await expect(
        invokeHarnessStreaming("nonexistent-harness", { prompt: "test" }),
      ).rejects.toThrow();
    });

    it("calls kill on timeout", async () => {
      vi.useFakeTimers();
      const proc = createMockProcess();
      mockSpawn.mockReturnValue(proc as unknown as ChildProcess);

      const promise = invokeHarnessStreaming("claude-code", {
        prompt: "test",
        timeout: 1000,
      });

      // Advance past the timeout
      await vi.advanceTimersByTimeAsync(1100);

      // The timeout should have triggered kill
      expect(proc.kill).toHaveBeenCalledWith("SIGTERM");

      // Simulate the process closing after kill
      proc._emit_exit(143);

      const result = await promise;
      expect(result.success).toBe(false);
      expect(result.output).toContain("timed out");

      vi.useRealTimers();
    });

    it("flushes partial lines on close", async () => {
      const lines: Array<{ line: string; source: string }> = [];
      const proc = createMockProcess();
      mockSpawn.mockReturnValue(proc as unknown as ChildProcess);

      const promise = invokeHarnessStreaming("claude-code", {
        prompt: "test",
        streaming: {
          onLine: (line, source) => lines.push({ line, source }),
        },
      });

      emitAsync(() => {
        proc.stdout.emit("data", Buffer.from("no newline at end"));
        proc._emit_exit(0);
      });

      await promise;
      // The partial line should be flushed on close
      expect(lines).toContainEqual({ line: "no newline at end", source: "stdout" });
    });

    it("passes env variables to spawned process", async () => {
      const proc = createMockProcess();
      mockSpawn.mockReturnValue(proc as unknown as ChildProcess);

      const promise = invokeHarnessStreaming("claude-code", {
        prompt: "test",
        env: { MY_VAR: "my_value" },
      });

      emitAsync(() => proc._emit_exit(0));
      await promise;

      // Verify spawn was called with env containing our variable
      const spawnCall = mockSpawn.mock.calls[0];
      const spawnOpts = spawnCall[2] as { env?: Record<string, string> };
      expect(spawnOpts.env).toHaveProperty("MY_VAR", "my_value");
    });
  });
});
