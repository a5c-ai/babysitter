import { EventEmitter } from "node:events";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BackgroundProcessRegistry } from "../backgroundProcessRegistry";

vi.mock("@a5c-ai/babysitter-sdk", () => ({
  nextUlid: (() => {
    let count = 0;
    return () => `01BACKGROUNDTEST${++count}`;
  })(),
}));

function createMockChild() {
  const child = new EventEmitter() as EventEmitter & {
    pid: number;
    killed: boolean;
    exitCode: number | null;
    stdout: EventEmitter;
    stderr: EventEmitter;
    kill: ReturnType<typeof vi.fn>;
  };
  child.pid = 1234;
  child.killed = false;
  child.exitCode = null;
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  child.kill = vi.fn(() => {
    child.killed = true;
    return true;
  });
  return child;
}

describe("BackgroundProcessRegistry execution policy", () => {
  it("does not inherit parent env by default and keeps explicit values", () => {
    const child = createMockChild();
    const spawnFn = vi.fn(() => child);
    const registry = new BackgroundProcessRegistry({ spawnFn: spawnFn as any });

    process.env.BABYSITTER_POLICY_TEST_SECRET = "should-not-leak";

    registry.spawn({
      command: "env",
      cwd: "/tmp",
      env: { DIRECT: "direct" },
      executionPolicy: {
        environment: { values: { SCOPED: "scoped" } },
      },
    } as any);

    const options = spawnFn.mock.calls[0][2] as { env: Record<string, string> };
    expect(options.env).toEqual({
      DIRECT: "direct",
      SCOPED: "scoped",
    });
    expect(options.env.BABYSITTER_POLICY_TEST_SECRET).toBeUndefined();
  });

  it("caps retained output and exposes truncation metadata", () => {
    const child = createMockChild();
    const registry = new BackgroundProcessRegistry({
      spawnFn: vi.fn(() => child) as any,
    });

    const initial = registry.spawn({
      command: "printf",
      cwd: "/tmp",
      executionPolicy: {
        resources: { maxOutputBytes: 5 },
      },
    } as any);

    child.stdout.emit("data", Buffer.from("hello world"));
    child.stderr.emit("data", Buffer.from("error output"));

    const record = registry.get(initial.backgroundTaskId) as any;
    expect(record.stdout).toBe("hello");
    expect(record.stderr).toBe("error");
    expect(record.stdoutTruncated).toBe(true);
    expect(record.stderrTruncated).toBe(true);
  });
});

describe("BackgroundProcessRegistry lifecycle hardening", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("reports retained and dropped stream bytes in snapshots and completion events", () => {
    const child = createMockChild();
    const onComplete = vi.fn();
    const registry = new BackgroundProcessRegistry({
      spawnFn: vi.fn(() => child) as any,
    });

    const initial = registry.spawn({
      command: "printf",
      cwd: "/tmp",
      executionPolicy: {
        resources: { maxOutputBytes: 5 },
      },
      onComplete,
    } as any);

    child.stdout.emit("data", Buffer.from("hello world"));
    child.stderr.emit("data", Buffer.from("error output"));

    const record = registry.get(initial.backgroundTaskId) as any;
    expect(record.stdout).toBe("hello");
    expect(record.stderr).toBe("error");
    expect(record.stdoutRetainedBytes).toBe(5);
    expect(record.stderrRetainedBytes).toBe(5);
    expect(record.stdoutDroppedBytes).toBe(6);
    expect(record.stderrDroppedBytes).toBe(7);
    expect(record.stdoutTruncated).toBe(true);
    expect(record.stderrTruncated).toBe(true);

    child.emit("close", 0);

    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({
      stdoutRetainedBytes: 5,
      stderrRetainedBytes: 5,
      stdoutDroppedBytes: 6,
      stderrDroppedBytes: 7,
      stdoutTruncated: true,
      stderrTruncated: true,
    }));
  });

  it("caps retained output by default", () => {
    const child = createMockChild();
    const onComplete = vi.fn();
    const registry = new BackgroundProcessRegistry({
      spawnFn: vi.fn(() => child) as any,
    });

    const initial = registry.spawn({
      command: "yes",
      cwd: "/tmp",
      onComplete,
    } as any);

    child.stdout.emit("data", Buffer.alloc(1_048_580, "a"));
    child.stderr.emit("data", Buffer.alloc(1_048_581, "b"));

    const record = registry.get(initial.backgroundTaskId) as any;
    expect(record.stdoutRetainedBytes).toBe(1_048_576);
    expect(record.stderrRetainedBytes).toBe(1_048_576);
    expect(record.stdoutDroppedBytes).toBe(4);
    expect(record.stderrDroppedBytes).toBe(5);
    expect(record.stdoutTruncated).toBe(true);
    expect(record.stderrTruncated).toBe(true);

    child.emit("close", 0);

    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({
      stdoutRetainedBytes: 1_048_576,
      stderrRetainedBytes: 1_048_576,
      stdoutDroppedBytes: 4,
      stderrDroppedBytes: 5,
      stdoutTruncated: true,
      stderrTruncated: true,
    }));
  });

  it("cancels with a process-group signal target, grace escalation, and idempotency", () => {
    const child = createMockChild();
    const processKillFn = vi.fn();
    const registry = new BackgroundProcessRegistry({
      spawnFn: vi.fn(() => child) as any,
      processKillFn,
      platform: "linux",
    } as any);

    const initial = registry.spawn({
      command: "sleep 60",
      cwd: "/tmp",
      terminationGraceMs: 25,
      terminateProcessGroup: true,
    } as any);

    expect(registry.cancel(initial.backgroundTaskId)).toBe(true);
    expect(registry.cancel(initial.backgroundTaskId)).toBe(true);
    expect(processKillFn).toHaveBeenCalledTimes(1);
    expect(processKillFn).toHaveBeenCalledWith(-1234, "SIGTERM");

    vi.advanceTimersByTime(25);

    expect(processKillFn).toHaveBeenCalledTimes(2);
    expect(processKillFn).toHaveBeenLastCalledWith(-1234, "SIGKILL");
    expect(registry.get(initial.backgroundTaskId)?.status).toBe("cancelled");
  });

  it("records timed_out status and runs timeout hooks before escalation", () => {
    const child = createMockChild();
    const processKillFn = vi.fn();
    const onTimeout = vi.fn();
    const registry = new BackgroundProcessRegistry({
      spawnFn: vi.fn(() => child) as any,
      processKillFn,
      platform: "linux",
    } as any);

    const initial = registry.spawn({
      command: "sleep 60",
      cwd: "/tmp",
      executionPolicy: {
        resources: { timeoutMs: 10 },
      },
      terminationGraceMs: 25,
      hooks: { onTimeout },
    } as any);

    vi.advanceTimersByTime(10);

    expect(registry.get(initial.backgroundTaskId)?.status).toBe("timed_out");
    expect(onTimeout).toHaveBeenCalledWith(expect.objectContaining({
      backgroundTaskId: initial.backgroundTaskId,
      status: "timed_out",
    }));
    expect(processKillFn).toHaveBeenCalledWith(1234, "SIGTERM");

    vi.advanceTimersByTime(25);

    expect(processKillFn).toHaveBeenLastCalledWith(1234, "SIGKILL");
  });

  it("supports platform-gated pause and resume without daemon pause semantics", () => {
    const child = createMockChild();
    const processKillFn = vi.fn();
    const registry = new BackgroundProcessRegistry({
      spawnFn: vi.fn(() => child) as any,
      processKillFn,
      platform: "linux",
    } as any);

    const initial = registry.spawn({
      command: "sleep 60",
      cwd: "/tmp",
      terminateProcessGroup: true,
    } as any);

    expect(registry.pause(initial.backgroundTaskId)).toBe(true);
    expect(registry.get(initial.backgroundTaskId)?.status).toBe("paused");
    expect(processKillFn).toHaveBeenCalledWith(-1234, "SIGSTOP");

    expect(registry.resume(initial.backgroundTaskId)).toBe(true);
    expect(registry.get(initial.backgroundTaskId)?.status).toBe("running");
    expect(processKillFn).toHaveBeenCalledWith(-1234, "SIGCONT");

    const windowsRegistry = new BackgroundProcessRegistry({
      spawnFn: vi.fn(() => createMockChild()) as any,
      processKillFn,
      platform: "win32",
    } as any);
    const windowsTask = windowsRegistry.spawn({
      command: "sleep 60",
      cwd: "/tmp",
    } as any);

    expect(windowsRegistry.pause(windowsTask.backgroundTaskId)).toBe(false);
    expect(windowsRegistry.get(windowsTask.backgroundTaskId)?.status).toBe("running");
  });

  it("queues dependent tasks, skips them on dependency failure, and rejects cycles", () => {
    const firstChild = createMockChild();
    const secondChild = createMockChild();
    const spawnFn = vi
      .fn()
      .mockReturnValueOnce(firstChild)
      .mockReturnValueOnce(secondChild);
    const registry = new BackgroundProcessRegistry({ spawnFn: spawnFn as any });

    const first = registry.spawn({ command: "first", cwd: "/tmp" } as any);
    const second = registry.spawn({
      command: "second",
      cwd: "/tmp",
      dependsOn: [first.backgroundTaskId],
    } as any);

    expect(spawnFn).toHaveBeenCalledTimes(1);
    expect(registry.get(second.backgroundTaskId)?.status).toBe("queued");

    firstChild.emit("close", 0);

    expect(spawnFn).toHaveBeenCalledTimes(2);
    expect(registry.get(second.backgroundTaskId)?.status).toBe("running");

    expect(() => registry.spawn({
      command: "cycle",
      cwd: "/tmp",
      dependsOn: [second.backgroundTaskId, second.backgroundTaskId],
    } as any)).toThrow(/cycle|duplicate/i);

    expect(() => registry.spawn({
      command: "missing",
      cwd: "/tmp",
      dependsOn: ["missing-task"],
    } as any)).toThrow(/unknown background process dependency/i);
  });

  it("marks tracked children stale when they exit without a close or error event", () => {
    const child = createMockChild();
    const onComplete = vi.fn();
    const registry = new BackgroundProcessRegistry({
      spawnFn: vi.fn(() => child) as any,
    });

    const initial = registry.spawn({
      command: "stale",
      cwd: "/tmp",
      onComplete,
    } as any);

    child.exitCode = 2;

    const record = registry.get(initial.backgroundTaskId);
    expect(record?.status).toBe("stale");
    expect(record?.exitCode).toBe(2);
    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({
      status: "stale",
      exitCode: 2,
    }));
  });

  it("reports child errors through completion callbacks", () => {
    const child = createMockChild();
    const onComplete = vi.fn();
    const registry = new BackgroundProcessRegistry({
      spawnFn: vi.fn(() => child) as any,
    });

    const initial = registry.spawn({
      command: "error",
      cwd: "/tmp",
      onComplete,
    } as any);

    child.emit("error", new Error("spawn failed"));

    expect(registry.get(initial.backgroundTaskId)?.status).toBe("exited");
    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({
      status: "exited",
      exitCode: 1,
    }));
  });

  it("runs lifecycle hooks and records hook failures without crashing the registry", () => {
    const child = createMockChild();
    const preSpawn = vi.fn();
    const postSpawn = vi.fn(() => {
      throw new Error("post spawn failed");
    });
    const preDestroy = vi.fn();
    const postDestroy = vi.fn();
    const registry = new BackgroundProcessRegistry({
      spawnFn: vi.fn(() => child) as any,
    });

    const initial = registry.spawn({
      command: "hooked",
      cwd: "/tmp",
      hooks: {
        preSpawn,
        postSpawn,
        preDestroy,
        postDestroy,
      },
    } as any);

    expect(preSpawn).toHaveBeenCalledWith(expect.objectContaining({
      command: "hooked",
    }));
    expect(postSpawn).toHaveBeenCalledWith(expect.objectContaining({
      backgroundTaskId: initial.backgroundTaskId,
    }));
    expect((registry.get(initial.backgroundTaskId) as any)?.hookErrors).toEqual([
      expect.objectContaining({ hook: "postSpawn", message: "post spawn failed" }),
    ]);

    registry.cancel(initial.backgroundTaskId);
    expect(preDestroy).toHaveBeenCalledWith(expect.objectContaining({
      status: "cancelled",
    }));

    child.emit("close", null);

    expect(postDestroy).toHaveBeenCalledWith(expect.objectContaining({
      status: "cancelled",
    }));
  });

  it("records async lifecycle hook timeout diagnostics", async () => {
    const child = createMockChild();
    const registry = new BackgroundProcessRegistry({
      spawnFn: vi.fn(() => child) as any,
    });

    const initial = registry.spawn({
      command: "async-hook",
      cwd: "/tmp",
      hookTimeoutMs: 10,
      hooks: {
        postSpawn: () => new Promise<void>(() => {}),
      },
    } as any);

    vi.advanceTimersByTime(10);

    expect(registry.get(initial.backgroundTaskId)?.hookErrors).toEqual([
      expect.objectContaining({
        hook: "postSpawn",
        message: "Lifecycle hook timed out after 10ms",
      }),
    ]);
  });
});
