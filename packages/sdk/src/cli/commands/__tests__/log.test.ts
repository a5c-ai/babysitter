/**
 * Tests for the `babysitter log` CLI command (handleLog).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { handleLog } from "../log";
import type { LogCommandArgs } from "../log";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let stderrOutput: string;
let stdoutOutput: string;

beforeEach(() => {
  stderrOutput = "";
  stdoutOutput = "";
  vi.spyOn(process.stderr, "write").mockImplementation((chunk: unknown) => {
    stderrOutput += String(chunk);
    return true;
  });
  vi.spyOn(console, "log").mockImplementation((...args: unknown[]) => {
    stdoutOutput += args.map(String).join(" ") + "\n";
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

function makeArgs(overrides: Partial<LogCommandArgs> = {}): LogCommandArgs {
  return {
    logType: "hook",
    message: "test message",
    json: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

describe("handleLog — validation", () => {
  it("rejects missing --type", async () => {
    const code = await handleLog(makeArgs({ logType: "" }));
    expect(code).toBe(1);
    expect(stderrOutput).toContain("--type is required");
  });

  it("rejects invalid --type", async () => {
    const code = await handleLog(makeArgs({ logType: "banana" }));
    expect(code).toBe(1);
    expect(stderrOutput).toContain('Invalid log type: "banana"');
  });

  it("rejects missing --message", async () => {
    const code = await handleLog(makeArgs({ message: "" }));
    expect(code).toBe(1);
    expect(stderrOutput).toContain("--message is required");
  });

  it("rejects invalid --level", async () => {
    const code = await handleLog(makeArgs({ level: "critical" }));
    expect(code).toBe(1);
    expect(stderrOutput).toContain('Invalid log level: "critical"');
  });

  it("returns structured JSON errors when --json is set", async () => {
    const code = await handleLog(makeArgs({ logType: "", json: true }));
    expect(code).toBe(1);
    const parsed = JSON.parse(stderrOutput);
    expect(parsed.error).toBe("MISSING_LOG_TYPE");
  });

  it("returns structured JSON for invalid type in --json mode", async () => {
    const code = await handleLog(makeArgs({ logType: "xyz", json: true }));
    expect(code).toBe(1);
    const parsed = JSON.parse(stderrOutput);
    expect(parsed.error).toBe("INVALID_LOG_TYPE");
  });
});

// ---------------------------------------------------------------------------
// Successful writes
// ---------------------------------------------------------------------------

describe("handleLog — writes", () => {
  let tmpDir: string;
  const origEnv = process.env.BABYSITTER_LOG_DIR;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "log-cmd-test-"));
    process.env.BABYSITTER_LOG_DIR = tmpDir;
  });

  afterEach(async () => {
    if (origEnv !== undefined) {
      process.env.BABYSITTER_LOG_DIR = origEnv;
    } else {
      delete process.env.BABYSITTER_LOG_DIR;
    }
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch {
      // cleanup best-effort
    }
  });

  it("writes a hook log entry and returns 0", async () => {
    const code = await handleLog(makeArgs({ logType: "hook", message: "hook fired" }));
    expect(code).toBe(0);

    const logPath = path.join(tmpDir, "hooks.log");
    const content = await fs.readFile(logPath, "utf8");
    const parsed = JSON.parse(content.trim());
    expect(parsed.msg).toBe("hook fired");
    expect(parsed.type).toBe("hook");
  });

  it("writes a process log entry with runId", async () => {
    const code = await handleLog(
      makeArgs({ logType: "process", message: "step done", runId: "run-42" }),
    );
    expect(code).toBe(0);

    const logPath = path.join(tmpDir, "run-42", "process.log");
    const content = await fs.readFile(logPath, "utf8");
    const parsed = JSON.parse(content.trim());
    expect(parsed.msg).toBe("step done");
    expect(parsed.runId).toBe("run-42");
  });

  it("writes a cli log entry", async () => {
    const code = await handleLog(makeArgs({ logType: "cli", message: "cli event" }));
    expect(code).toBe(0);

    const logPath = path.join(tmpDir, "cli.log");
    const content = await fs.readFile(logPath, "utf8");
    const parsed = JSON.parse(content.trim());
    expect(parsed.msg).toBe("cli event");
  });

  it("includes label and source when provided", async () => {
    const code = await handleLog(
      makeArgs({
        logType: "hook",
        message: "labeled",
        label: "hook:stop",
        source: "shell-hook",
      }),
    );
    expect(code).toBe(0);

    const logPath = path.join(tmpDir, "hooks.log");
    const content = await fs.readFile(logPath, "utf8");
    const parsed = JSON.parse(content.trim());
    expect(parsed.label).toBe("hook:stop");
    expect(parsed.source).toBe("shell-hook");
  });

  it("defaults level to info", async () => {
    await handleLog(makeArgs({ logType: "hook", message: "default level" }));

    const logPath = path.join(tmpDir, "hooks.log");
    const content = await fs.readFile(logPath, "utf8");
    const parsed = JSON.parse(content.trim());
    expect(parsed.level).toBe("info");
  });

  it("respects explicit level", async () => {
    await handleLog(makeArgs({ logType: "hook", message: "warning", level: "warn" }));

    const logPath = path.join(tmpDir, "hooks.log");
    const content = await fs.readFile(logPath, "utf8");
    const parsed = JSON.parse(content.trim());
    expect(parsed.level).toBe("warn");
  });

  it("returns JSON output when --json is set", async () => {
    const code = await handleLog(
      makeArgs({ logType: "hook", message: "json mode", json: true }),
    );
    expect(code).toBe(0);
    const parsed = JSON.parse(stdoutOutput.trim());
    expect(parsed.ok).toBe(true);
    expect(parsed.logPath).toContain("hooks.log");
  });
});
