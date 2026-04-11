/**
 * Tests for the harness invoker module.
 *
 * Covers:
 *   - buildHarnessArgs: per-harness flag mapping for all 6 harnesses
 *   - buildHarnessArgs: model and workspace options
 *   - buildHarnessArgs: unknown harness throws
 *   - invokeHarness: happy path (mock execFile)
 *   - invokeHarness: non-zero exit code
 *   - invokeHarness: timeout (killed process)
 *   - invokeHarness: CLI not installed
 *   - invokeHarness: unknown harness name
 *   - HARNESS_CLI_MAP: has all 6 entries
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildHarnessArgs, invokeHarness, HARNESS_CLI_MAP } from "../invoker";
import type { HarnessInvokeOptions } from "../../harness/types";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("node:child_process", () => ({
  execFile: vi.fn(),
}));

vi.mock("../discovery", () => ({
  checkCliAvailable: vi.fn(),
}));

vi.mock("../piWrapper", () => ({
  createPiSession: vi.fn(),
}));

import { execFile } from "node:child_process";
import { checkCliAvailable } from "../discovery";
import { createPiSession } from "../piWrapper";

const mockExecFile = vi.mocked(execFile);
const mockCheckCliAvailable = vi.mocked(checkCliAvailable);
const mockCreatePiSession = vi.mocked(createPiSession);

beforeEach(() => {
  vi.clearAllMocks();
  mockCreatePiSession.mockReset();
});

// ---------------------------------------------------------------------------
// HARNESS_CLI_MAP
// ---------------------------------------------------------------------------

describe("HARNESS_CLI_MAP", () => {
  it("has entries for all 9 supported harnesses", () => {
    const expectedNames = ["claude-code", "codex", "pi", "oh-my-pi", "gemini-cli", "cursor", "opencode", "github-copilot", "openclaw"];
    for (const name of expectedNames) {
      expect(HARNESS_CLI_MAP[name]).toBeDefined();
    }
    expect(Object.keys(HARNESS_CLI_MAP)).toHaveLength(9);
  });
});

// ---------------------------------------------------------------------------
// buildHarnessArgs
// ---------------------------------------------------------------------------

describe("buildHarnessArgs", () => {
  const baseOptions: HarnessInvokeOptions = {
    prompt: "Hello world",
  };

  it("builds args for claude-code (--prompt only, no workspace flag)", () => {
    const args = buildHarnessArgs("claude-code", baseOptions);
    expect(args).toEqual(["--prompt", "Hello world"]);
  });

  it("builds args for codex exec mode with positional prompt and working dir", () => {
    const args = buildHarnessArgs("codex", { ...baseOptions, workspace: "/tmp/project" });
    expect(args).toEqual([
      "exec",
      "--dangerously-bypass-approvals-and-sandbox",
      "--skip-git-repo-check",
      "-",
      "-C",
      "/tmp/project",
    ]);
  });

  it("builds args for pi (--prompt, --workspace for workspace)", () => {
    const args = buildHarnessArgs("pi", { ...baseOptions, workspace: "/tmp/project" });
    expect(args).toEqual(["--prompt", "Hello world", "--workspace", "/tmp/project"]);
  });

  it("builds args for gemini-cli (--prompt only, no workspace flag)", () => {
    const args = buildHarnessArgs("gemini-cli", baseOptions);
    expect(args).toEqual(["--prompt", "Hello world"]);
  });

  it("builds args for cursor (agent base args + positional prompt)", () => {
    const args = buildHarnessArgs("cursor", baseOptions);
    expect(args).toEqual(["agent", "Hello world"]);
  });

  it("builds args for opencode (run subcommand + positional prompt)", () => {
    const args = buildHarnessArgs("opencode", baseOptions);
    expect(args).toEqual(["run", "Hello world"]);
  });

  it("includes --model when harness supports it", () => {
    const args = buildHarnessArgs("claude-code", { ...baseOptions, model: "claude-opus-4-5" });
    expect(args).toEqual(["--prompt", "Hello world", "--model", "claude-opus-4-5"]);
  });

  it("includes --model for codex with workspace", () => {
    const args = buildHarnessArgs("codex", {
      ...baseOptions,
      model: "gpt-4",
      workspace: "/work",
    });
    expect(args).toEqual([
      "exec",
      "--dangerously-bypass-approvals-and-sandbox",
      "--skip-git-repo-check",
      "-",
      "--model",
      "gpt-4",
      "-C",
      "/work",
    ]);
  });

  it("includes --model for cursor (now supported)", () => {
    const args = buildHarnessArgs("cursor", { ...baseOptions, model: "some-model" });
    expect(args).toEqual(["agent", "Hello world", "--model", "some-model"]);
  });

  it("includes --model for opencode", () => {
    const args = buildHarnessArgs("opencode", { ...baseOptions, model: "some-model" });
    expect(args).toEqual(["run", "Hello world", "--model", "some-model"]);
  });

  it("keeps claude-code args stable when workspace is provided", () => {
    const args = buildHarnessArgs("claude-code", { ...baseOptions, workspace: "/tmp" });
    expect(args).toEqual(["--prompt", "Hello world"]);
  });

  it("ignores workspace for gemini-cli (no workspace flag)", () => {
    const args = buildHarnessArgs("gemini-cli", { ...baseOptions, workspace: "/tmp" });
    expect(args).toEqual(["--prompt", "Hello world"]);
  });

  it("throws BabysitterRuntimeError for unknown harness", () => {
    expect(() => buildHarnessArgs("unknown-harness", baseOptions)).toThrow(
      /Unknown harness: "unknown-harness"/,
    );
  });

  it("includes programmatic-only harnesses in the supported-name error", () => {
    expect(() => buildHarnessArgs("unknown-harness", baseOptions)).toThrow(
      /Supported harnesses: internal, claude-code, codex, pi, oh-my-pi, gemini-cli, github-copilot, cursor, openclaw, opencode/,
    );
  });
});

// ---------------------------------------------------------------------------
// invokeHarness
// ---------------------------------------------------------------------------

describe("invokeHarness", () => {
  it("invokes the internal harness through the programmatic PI wrapper", async () => {
    const prompt = vi.fn(async () => ({
      success: true,
      output: "hello back",
      exitCode: 0,
      duration: 12,
    }));
    const dispose = vi.fn();
    mockCreatePiSession.mockReturnValue({
      prompt,
      dispose,
    } as unknown as ReturnType<typeof createPiSession>);

    const result = await invokeHarness("internal", {
      prompt: "hello",
      workspace: "/tmp/project",
      model: "gpt-5.4",
      timeout: 1234,
    });

    expect(mockCreatePiSession).toHaveBeenCalledWith({
      workspace: "/tmp/project",
      model: "gpt-5.4",
      timeout: 1234,
      ephemeral: true,
    });
    expect(prompt).toHaveBeenCalledWith("hello", 1234);
    expect(dispose).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      success: true,
      output: "hello back",
      exitCode: 0,
      duration: 12,
      harness: "internal",
    });
    expect(mockCheckCliAvailable).not.toHaveBeenCalled();
  });

  it("returns success result on happy path", async () => {
    mockCheckCliAvailable.mockResolvedValue({ available: true, path: "/usr/bin/claude" });
    mockExecFile.mockImplementation((_cmd, _args, _opts, callback) => {
      (callback as (err: Error | null, stdout: string, stderr: string) => void)(null, "Task completed successfully", "");
      return {} as ReturnType<typeof execFile>;
    });

    const result = await invokeHarness("claude-code", { prompt: "Do something" });

    expect(result.success).toBe(true);
    expect(result.output).toBe("Task completed successfully");
    expect(result.exitCode).toBe(0);
    expect(result.harness).toBe("claude-code");
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });

  it("returns failure result on non-zero exit code", async () => {
    mockCheckCliAvailable.mockResolvedValue({ available: true, path: "/usr/bin/codex" });

    const exitError = Object.assign(new Error("Command failed"), {
      code: 1,
      killed: false,
    });

    mockExecFile.mockImplementation((_cmd, _args, _opts, callback) => {
      (callback as (err: Error | null, stdout: string, stderr: string) => void)(exitError, "", "Something went wrong");
      return {} as ReturnType<typeof execFile>;
    });

    const result = await invokeHarness("codex", { prompt: "Fail" });

    expect(result.success).toBe(false);
    expect(result.exitCode).toBe(1);
    expect(result.output).toContain("Something went wrong");
    expect(result.harness).toBe("codex");
  });

  it("reports timeout when process is killed", async () => {
    mockCheckCliAvailable.mockResolvedValue({ available: true, path: "/usr/bin/pi" });

    const timeoutError = Object.assign(new Error("Process timed out"), {
      killed: true,
      code: "SIGTERM" as string | number,
    });

    mockExecFile.mockImplementation((_cmd, _args, _opts, callback) => {
      (callback as (err: Error | null, stdout: string, stderr: string) => void)(timeoutError, "", "");
      return {} as ReturnType<typeof execFile>;
    });

    const result = await invokeHarness("pi", { prompt: "Slow task", timeout: 5000 });

    expect(result.success).toBe(false);
    expect(result.output).toContain("Process timed out");
    expect(result.harness).toBe("pi");
  });

  it("throws when CLI is not installed", async () => {
    mockCheckCliAvailable.mockResolvedValue({ available: false });

    await expect(
      invokeHarness("claude-code", { prompt: "Hello" }),
    ).rejects.toThrow(/not installed or not found on PATH/);
  });

  it("throws for unknown harness name", async () => {
    await expect(
      invokeHarness("nonexistent", { prompt: "Hello" }),
    ).rejects.toThrow(/Unknown harness: "nonexistent"/);
  });

  it("passes env vars to the child process", async () => {
    mockCheckCliAvailable.mockResolvedValue({ available: true, path: "/usr/bin/claude" });

    let capturedOpts: Record<string, unknown> | undefined;
    mockExecFile.mockImplementation((_cmd, _args, opts, callback) => {
      capturedOpts = opts as Record<string, unknown>;
      (callback as (err: Error | null, stdout: string, stderr: string) => void)(null, "ok", "");
      return {} as ReturnType<typeof execFile>;
    });

    await invokeHarness("claude-code", {
      prompt: "test",
      env: { MY_VAR: "my_value" },
    });

    const env = capturedOpts?.env as Record<string, string>;
    expect(env.MY_VAR).toBe("my_value");
  });

  it("passes workspace as cwd to the child process", async () => {
    mockCheckCliAvailable.mockResolvedValue({ available: true, path: "/usr/bin/claude" });

    let capturedOpts: Record<string, unknown> | undefined;
    mockExecFile.mockImplementation((_cmd, _args, opts, callback) => {
      capturedOpts = opts as Record<string, unknown>;
      (callback as (err: Error | null, stdout: string, stderr: string) => void)(null, "ok", "");
      return {} as ReturnType<typeof execFile>;
    });

    await invokeHarness("claude-code", {
      prompt: "test",
      workspace: "/tmp/project",
    });

    expect(capturedOpts?.cwd).toBe("/tmp/project");
  });

  it("wraps codex through PowerShell on Windows so stdin piping matches direct CLI behavior", async () => {
    const resolvedCodexPath = "C:/Users/test/AppData/Roaming/npm/codex.cmd";
    mockCheckCliAvailable.mockResolvedValue({ available: true, path: resolvedCodexPath });

    let capturedCmd: string | undefined;
    let capturedOpts: Record<string, unknown> | undefined;
    let capturedArgs: string[] | undefined;
    mockExecFile.mockImplementation((cmd, args, opts, callback) => {
      capturedCmd = cmd as string;
      capturedArgs = args as string[];
      capturedOpts = opts as Record<string, unknown>;
      (callback as (err: Error | null, stdout: string, stderr: string) => void)(null, "ok", "");
      return {} as ReturnType<typeof execFile>;
    });

    await invokeHarness("codex", {
      prompt: "test",
      workspace: "/tmp/project",
    });

    if (process.platform === "win32") {
      expect(capturedCmd).toBe("powershell.exe");
      expect(capturedArgs?.slice(0, 2)).toEqual(["-NoProfile", "-Command"]);
      expect(String(capturedArgs?.[2])).toContain("Get-Content -Raw");
      expect(capturedOpts?.shell).toBe(false);
      expect(capturedOpts?.cwd).toBe(process.cwd());
    } else {
      expect(capturedCmd).toBe(resolvedCodexPath);
      expect(capturedOpts?.shell).toBe(false);
      expect(capturedOpts?.cwd).toBe(process.cwd());
    }
  });

  it("cancelRunningProcess function exists", async () => {
    // This import will fail in the red phase — the function doesn't exist yet
    const { cancelRunningProcess } = await import("../invoker");
    expect(cancelRunningProcess).toBeDefined();
    expect(typeof cancelRunningProcess).toBe("function");
  });

  it("cancelRunningProcess sends SIGTERM to the child process", async () => {
    const { cancelRunningProcess } = await import("../invoker");
    mockCheckCliAvailable.mockResolvedValue({ available: true, path: "/usr/bin/claude" });

    let childProcess: { kill: ReturnType<typeof vi.fn>; pid: number; exitCode: number | null };
    mockExecFile.mockImplementation((_cmd, _args, _opts, _callback) => {
      childProcess = {
        kill: vi.fn().mockReturnValue(true),
        pid: 12345,
        exitCode: null,
      };
      // Don't call callback — simulate long-running process
      return childProcess as unknown as ReturnType<typeof execFile>;
    });

    const handle = invokeHarness("claude-code", { prompt: "long running task" });

    // Give it a tick to start
    await new Promise((r) => setTimeout(r, 10));

    await cancelRunningProcess(12345);
    expect(childProcess!.kill).toHaveBeenCalledWith("SIGTERM");
  });

  it("cancelRunningProcess sends SIGKILL after grace period", async () => {
    const { cancelRunningProcess } = await import("../invoker");

    const killFn = vi.fn().mockReturnValue(true);
    mockCheckCliAvailable.mockResolvedValue({ available: true, path: "/usr/bin/claude" });
    mockExecFile.mockImplementation((_cmd, _args, _opts, _callback) => {
      return {
        kill: killFn,
        pid: 99999,
        exitCode: null,
      } as unknown as ReturnType<typeof execFile>;
    });

    // Start a process
    const _handle = invokeHarness("claude-code", { prompt: "stubborn task" });
    await new Promise((r) => setTimeout(r, 10));

    await cancelRunningProcess(99999, { gracePeriodMs: 50 });

    // First call should be SIGTERM
    expect(killFn).toHaveBeenCalledWith("SIGTERM");
    // After grace period, should escalate to SIGKILL
    await new Promise((r) => setTimeout(r, 100));
    expect(killFn).toHaveBeenCalledWith("SIGKILL");
  });

  it("cancelRunningProcess handles already-exited process gracefully", async () => {
    const { cancelRunningProcess } = await import("../invoker");

    // Process that has already exited — kill returns false
    const killFn = vi.fn().mockReturnValue(false);
    mockCheckCliAvailable.mockResolvedValue({ available: true, path: "/usr/bin/claude" });
    mockExecFile.mockImplementation((_cmd, _args, _opts, callback) => {
      (callback as (err: Error | null, stdout: string, stderr: string) => void)(null, "done", "");
      return {
        kill: killFn,
        pid: 77777,
        exitCode: 0,
      } as unknown as ReturnType<typeof execFile>;
    });

    // Should not throw when process is already gone
    await expect(cancelRunningProcess(77777)).resolves.not.toThrow();
  });

  it("uses correct CLI command from HARNESS_CLI_MAP", async () => {
    const resolvedGeminiPath = "/usr/bin/gemini";
    mockCheckCliAvailable.mockResolvedValue({ available: true, path: resolvedGeminiPath });

    let capturedCmd: string | undefined;
    mockExecFile.mockImplementation((cmd, _args, _opts, callback) => {
      capturedCmd = cmd as string;
      (callback as (err: Error | null, stdout: string, stderr: string) => void)(null, "done", "");
      return {} as ReturnType<typeof execFile>;
    });

    await invokeHarness("gemini-cli", { prompt: "test" });

    expect(capturedCmd).toBe(process.platform === "win32" ? "gemini" : resolvedGeminiPath);
  });
});
