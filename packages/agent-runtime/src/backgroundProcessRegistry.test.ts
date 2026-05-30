import { EventEmitter } from "node:events";
import { describe, expect, it, vi } from "vitest";
import { BackgroundProcessRegistry } from "./backgroundProcessRegistry";

function createMockChild() {
  const child = new EventEmitter() as EventEmitter & {
    pid: number;
    stdout: EventEmitter;
    stderr: EventEmitter;
    kill: ReturnType<typeof vi.fn>;
  };
  child.pid = 1234;
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  child.kill = vi.fn();
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
