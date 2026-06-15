import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { MicroagentRunner } from "../runner";
import { MicroagentRegistry } from "../registry";
import type { MicroagentManifest } from "../types";
import type { ChildProcess } from "node:child_process";
import { EventEmitter, Readable, Writable } from "node:stream";

// ---------------------------------------------------------------------------
// Mock child_process.spawn
// ---------------------------------------------------------------------------

vi.mock("node:child_process", () => ({
  spawn: vi.fn(),
}));

import { spawn } from "node:child_process";
const mockSpawn = vi.mocked(spawn);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeManifest(overrides?: Partial<MicroagentManifest>): MicroagentManifest {
  return {
    name: "test-agent",
    version: "1.0.0",
    description: "test",
    inputSchema: {
      type: "object",
      properties: { x: { type: "string" } },
      required: ["x"],
    },
    outputSchema: {
      type: "object",
      properties: { y: { type: "string" } },
      required: ["y"],
    },
    isolation: "subprocess",
    runtime: { entrypoint: "test.js", timeout: 5000 },
    tags: ["test"],
    builtIn: false,
    ...overrides,
  };
}

interface MockChild extends EventEmitter {
  stdin: Writable;
  stdout: Readable;
  stderr: Readable;
  kill: ReturnType<typeof vi.fn>;
}

function createMockChild(): MockChild {
  const child = new EventEmitter() as MockChild;
  child.stdin = new Writable({
    write(_chunk, _encoding, callback) {
      callback();
    },
  });
  child.stdout = new Readable({ read() {} });
  child.stderr = new Readable({ read() {} });
  child.kill = vi.fn();
  return child;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("MicroagentRunner", () => {
  let registry: MicroagentRegistry;
  let runner: MicroagentRunner;

  beforeEach(() => {
    registry = new MicroagentRegistry();
    runner = new MicroagentRunner(registry);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("throws when the microagent is not registered", async () => {
    await expect(
      runner.run({ microagentName: "nonexistent", input: {} }),
    ).rejects.toThrow("Microagent not found: nonexistent");
  });

  it("returns INVALID_INPUT when input fails schema validation", async () => {
    registry.register(makeManifest());

    const result = await runner.run({
      microagentName: "test-agent",
      input: { x: 42 }, // x should be string
    });

    expect(result.exitCode).toBe(1);
    expect(result.error?.code).toBe("INVALID_INPUT");
    expect(result.durationMs).toBe(0);
  });

  it("returns structured output on successful execution", async () => {
    registry.register(makeManifest());

    const child = createMockChild();
    mockSpawn.mockReturnValue(child as unknown as ChildProcess);

    const runPromise = runner.run({
      microagentName: "test-agent",
      input: { x: "hello" },
    });

    // Simulate subprocess writing JSON output and exiting
    child.stdout.push(Buffer.from(JSON.stringify({ y: "world" })));
    child.stdout.push(null);
    child.stderr.push(Buffer.from("log line 1\nlog line 2\n"));
    child.stderr.push(null);

    // Need to advance timers slightly then emit close
    // Use setImmediate to allow stream events to process
    await vi.advanceTimersByTimeAsync(1);
    child.emit("close", 0);

    const result = await runPromise;

    expect(result.exitCode).toBe(0);
    expect(result.output).toEqual({ y: "world" });
    expect(result.logs).toEqual(["log line 1", "log line 2"]);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    expect(result.error).toBeUndefined();
  });

  it("returns EXIT_NONZERO when the subprocess exits with a non-zero code", async () => {
    registry.register(makeManifest());

    const child = createMockChild();
    mockSpawn.mockReturnValue(child as unknown as ChildProcess);

    const runPromise = runner.run({
      microagentName: "test-agent",
      input: { x: "hello" },
    });

    child.stdout.push(null);
    child.stderr.push(Buffer.from("fatal error\n"));
    child.stderr.push(null);

    await vi.advanceTimersByTimeAsync(1);
    child.emit("close", 2);

    const result = await runPromise;

    expect(result.exitCode).toBe(2);
    expect(result.error?.code).toBe("EXIT_NONZERO");
    expect(result.logs).toEqual(["fatal error"]);
  });

  it("returns INVALID_OUTPUT when stdout is not valid JSON", async () => {
    registry.register(makeManifest());

    const child = createMockChild();
    mockSpawn.mockReturnValue(child as unknown as ChildProcess);

    const runPromise = runner.run({
      microagentName: "test-agent",
      input: { x: "hello" },
    });

    child.stdout.push(Buffer.from("not json at all"));
    child.stdout.push(null);
    child.stderr.push(null);

    await vi.advanceTimersByTimeAsync(1);
    child.emit("close", 0);

    const result = await runPromise;

    expect(result.exitCode).toBe(1);
    expect(result.error?.code).toBe("INVALID_OUTPUT");
  });

  it("returns SCHEMA_MISMATCH when output does not match outputSchema", async () => {
    registry.register(makeManifest());

    const child = createMockChild();
    mockSpawn.mockReturnValue(child as unknown as ChildProcess);

    const runPromise = runner.run({
      microagentName: "test-agent",
      input: { x: "hello" },
    });

    // Output missing required field "y"
    child.stdout.push(Buffer.from(JSON.stringify({ wrong: "field" })));
    child.stdout.push(null);
    child.stderr.push(null);

    await vi.advanceTimersByTimeAsync(1);
    child.emit("close", 0);

    const result = await runPromise;

    expect(result.exitCode).toBe(1);
    expect(result.error?.code).toBe("SCHEMA_MISMATCH");
  });

  it("handles timeout by killing the subprocess and returning TIMEOUT error", async () => {
    registry.register(makeManifest({ runtime: { entrypoint: "test.js", timeout: 100 } }));

    const child = createMockChild();
    mockSpawn.mockReturnValue(child as unknown as ChildProcess);

    const runPromise = runner.run({
      microagentName: "test-agent",
      input: { x: "hello" },
    });

    child.stdout.push(null);
    child.stderr.push(null);

    // Advance past the timeout
    await vi.advanceTimersByTimeAsync(200);

    const result = await runPromise;

    expect(result.exitCode).toBe(1);
    expect(result.error?.code).toBe("TIMEOUT");
    expect(result.error?.message).toContain("timed out");
    expect(child.kill).toHaveBeenCalledWith("SIGTERM");
  });

  it("passes env vars and metadata to the spawned subprocess", async () => {
    registry.register(
      makeManifest({
        runtime: {
          entrypoint: "agent.js",
          env: { CUSTOM_VAR: "custom_value" },
        },
      }),
    );

    const child = createMockChild();
    mockSpawn.mockReturnValue(child as unknown as ChildProcess);

    const runPromise = runner.run({
      microagentName: "test-agent",
      input: { x: "hello" },
      correlationId: "corr-123",
      parentAgentId: "parent-abc",
    });

    child.stdout.push(Buffer.from(JSON.stringify({ y: "ok" })));
    child.stdout.push(null);
    child.stderr.push(null);
    await vi.advanceTimersByTimeAsync(1);
    child.emit("close", 0);

    await runPromise;

    expect(mockSpawn).toHaveBeenCalledWith(
      "node",
      ["agent.js"],
      expect.objectContaining({
        env: expect.objectContaining({
          MICROAGENT_NAME: "test-agent",
          MICROAGENT_CORRELATION_ID: "corr-123",
          MICROAGENT_PARENT_AGENT_ID: "parent-abc",
          CUSTOM_VAR: "custom_value",
        }),
      }),
    );
  });
});
