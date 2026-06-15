import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * #936 phase-2 — guard run:iterate / run:create JSON parsing + propagate
 * delegated effect failures.
 *
 * Two regressions are covered:
 *   A. ROBUST PARSE — when `babysitter run:iterate` emits a non-JSON line
 *      (e.g. `Error: Effect failed`) on stdout, the orchestration loop must
 *      FAIL FAST with a clear error that includes the raw output, instead of
 *      throwing a cryptic `Unexpected token 'E'` SyntaxError and spinning to
 *      the 80-minute orchestration timeout.
 *   B. ROOT CAUSE — when a delegated agent/skill `session.prompt` reports
 *      `success: false`, resolveAndPostEffect must post `--status error` with
 *      the real error, NOT silently post `--status ok` with the error string
 *      as the value (the poisoned value that produced the "Effect failed"
 *      line downstream).
 */

// ---- mocks ---------------------------------------------------------------

const execFileSync = vi.fn();
const execSync = vi.fn(() => "shell ran");
const sessionPrompt = vi.fn();
const sessionDispose = vi.fn();
const createAgentCoreSession = vi.fn(() => ({ prompt: sessionPrompt, dispose: sessionDispose }));

vi.mock("node:child_process", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:child_process")>();
  return {
    ...actual,
    execFileSync: (...args: unknown[]) => execFileSync(...(args as [])),
    execSync: (...args: unknown[]) => execSync(...(args as [])),
  };
});

vi.mock("../../utils", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    createAgentCoreSession: (...args: unknown[]) => createAgentCoreSession(...(args as [])),
  };
});

// tasks-adapter is optional; force the internal-session path so createAgentCoreSession runs.
vi.mock("@a5c-ai/tasks-adapter", () => ({
  routeTask: () => ({ responderType: "internal" }),
}));

import { parseBabysitterCliJson, resolveAndPostEffect, runCliOrchestration } from "../index";
import type { RunOrchestrationPhaseArgs } from "../types";

function baseArgs(overrides: Partial<RunOrchestrationPhaseArgs> = {}): RunOrchestrationPhaseArgs {
  return {
    processPath: "/tmp/proc.js",
    prompt: "do work",
    workspace: tmpdir(),
    runsDir: "/tmp/runs",
    maxIterations: 5,
    json: true,
    verbose: false,
    interactive: false,
    rl: null,
    selectedHarnessName: "agent-core",
    discovered: [],
    compressionConfig: null,
    promptContext: {} as RunOrchestrationPhaseArgs["promptContext"],
    ...overrides,
  };
}

const ENV_KEYS = ["BABYSITTER_EXECUTE_TASKS", "BABYSITTER_CROSS_SUBAGENTS"] as const;

describe("#936 parseBabysitterCliJson", () => {
  it("parses valid JSON (trimmed)", () => {
    expect(parseBabysitterCliJson('  {"status":"none"}\n', { command: "run:iterate" })).toEqual({
      status: "none",
    });
  });

  it("throws a clear, non-cryptic error including raw stdout for a non-JSON line", () => {
    expect(() =>
      parseBabysitterCliJson("Error: Effect failed", {
        command: "run:iterate (iteration 1)",
        stderr: "boom on stderr",
      }),
    ).toThrowError(/did not emit valid JSON[\s\S]*Error: Effect failed[\s\S]*boom on stderr/);
  });

  it("does NOT surface a bare 'Unexpected token' SyntaxError", () => {
    let caught: unknown;
    try {
      parseBabysitterCliJson("Error: Effect failed", { command: "run:iterate" });
    } catch (e) {
      caught = e;
    }
    expect((caught as Error).name).toBe("BabysitterCliNonJsonOutput");
    expect((caught as Error).message).not.toMatch(/^Unexpected token/);
  });
});

describe("#936 runCliOrchestration robust parse / fail fast", () => {
  let saved: Record<string, string | undefined>;

  beforeEach(() => {
    saved = {};
    for (const k of ENV_KEYS) {
      saved[k] = process.env[k];
      process.env[k] = "1";
    }
    execFileSync.mockReset();
    execSync.mockReset();
    sessionPrompt.mockReset();
    sessionDispose.mockReset();
    createAgentCoreSession.mockClear();
  });

  afterEach(() => {
    for (const k of ENV_KEYS) {
      if (saved[k] !== undefined) process.env[k] = saved[k];
      else delete process.env[k];
    }
  });

  it("fails fast (returns 1) without spinning when run:iterate emits non-JSON on stdout", async () => {
    // run:create returns valid JSON; run:iterate emits a bare "Error: Effect failed" line.
    execFileSync.mockImplementation((_cmd: string, args: string[]) => {
      if (args.includes("run:create")) return JSON.stringify({ runDir: "/tmp/runs/run-936" });
      if (args.includes("run:iterate")) return "Error: Effect failed";
      return "{}";
    });

    const code = await runCliOrchestration(baseArgs({ maxIterations: 20 }));

    expect(code).toBe(1);
    // FAIL FAST: run:iterate is invoked exactly once, not 20 times (no spin).
    const iterateCalls = execFileSync.mock.calls.filter((c) => (c[1] as string[]).includes("run:iterate"));
    expect(iterateCalls).toHaveLength(1);
  });

  it("fails fast (returns 1) when run:iterate exits non-zero with the error only on stderr", async () => {
    execFileSync.mockImplementation((_cmd: string, args: string[]) => {
      if (args.includes("run:create")) return JSON.stringify({ runDir: "/tmp/runs/run-936b" });
      if (args.includes("run:iterate")) {
        const err = new Error("Command failed") as Error & { stdout: string; stderr: string };
        err.stdout = "";
        err.stderr = "Error: Effect failed";
        throw err;
      }
      return "{}";
    });

    const code = await runCliOrchestration(baseArgs({ maxIterations: 20 }));

    expect(code).toBe(1);
    const iterateCalls = execFileSync.mock.calls.filter((c) => (c[1] as string[]).includes("run:iterate"));
    expect(iterateCalls).toHaveLength(1);
  });
});

describe("#936 resolveAndPostEffect propagates delegated failure", () => {
  let runDir: string;
  let saved: Record<string, string | undefined>;

  beforeEach(async () => {
    runDir = await mkdtemp(join(tmpdir(), "phase2-guard-"));
    saved = {};
    for (const k of ENV_KEYS) {
      saved[k] = process.env[k];
      process.env[k] = "1";
    }
    execFileSync.mockReset();
    execFileSync.mockReturnValue("{}");
    sessionPrompt.mockReset();
    sessionDispose.mockReset();
    createAgentCoreSession.mockClear();
  });

  afterEach(async () => {
    for (const k of ENV_KEYS) {
      if (saved[k] !== undefined) process.env[k] = saved[k];
      else delete process.env[k];
    }
    await rm(runDir, { recursive: true, force: true }).catch(() => {});
  });

  function agentAction() {
    return {
      effectId: "eff-agent",
      kind: "agent" as const,
      taskDef: { kind: "agent", title: "Dispatch", agent: { prompt: "do it" } },
    };
  }

  it("posts --status error (not ok) when the delegated prompt returns success:false", async () => {
    sessionPrompt.mockResolvedValue({ output: "model exploded", success: false, exitCode: 2, duration: 1 });

    await resolveAndPostEffect(agentAction(), runDir, "/repo");

    expect(execFileSync).toHaveBeenCalledTimes(1);
    const postArgs = execFileSync.mock.calls[0]![1] as string[];
    expect(postArgs).toContain("task:post");
    expect(postArgs).toContain("--status");
    expect(postArgs[postArgs.indexOf("--status") + 1]).toBe("error");
    expect(postArgs).toContain("--error");

    // The error file is valid JSON carrying the real failure message.
    const errorFile = postArgs[postArgs.indexOf("--error") + 1]!;
    const payload = JSON.parse(await readFile(errorFile, "utf8")) as { message: string };
    expect(payload.message).toContain("model exploded");
  });

  it("posts --status ok with the value when the delegated prompt succeeds", async () => {
    sessionPrompt.mockResolvedValue({ output: "all good", success: true, exitCode: 0, duration: 1 });

    await resolveAndPostEffect(agentAction(), runDir, "/repo");

    expect(execFileSync).toHaveBeenCalledTimes(1);
    const postArgs = execFileSync.mock.calls[0]![1] as string[];
    expect(postArgs[postArgs.indexOf("--status") + 1]).toBe("ok");
    expect(postArgs).toContain("--value");
  });
});
