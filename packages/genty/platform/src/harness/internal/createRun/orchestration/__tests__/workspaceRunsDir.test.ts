import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir, homedir } from "node:os";
import { join, resolve } from "node:path";

/**
 * #936 — genty's autonomous orchestration must materialize its (nested) run in
 * the WORKSPACE runs dir (<workspace>/.a5c/runs), not the GLOBAL ~/.a5c/runs.
 *
 * When the genty CLI is invoked WITHOUT an explicit --runs-dir (and without a
 * BABYSITTER_RUNS_DIR / repo-scope override), `babysitter run:create` would
 * otherwise default to ~/.a5c/runs — so the run + completion proof land outside
 * the workspace where the live-stack validator (and users) look. Both the
 * resolver and the CLI orchestration child commands must anchor to the
 * workspace.
 */

// ---- mocks ---------------------------------------------------------------

const execFileSync = vi.fn();

vi.mock("node:child_process", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:child_process")>();
  return {
    ...actual,
    execFileSync: (...args: unknown[]) => execFileSync(...(args as [])),
  };
});

import { resolveWorkspaceRunsDir, runCliOrchestration } from "../index";
import type { RunOrchestrationPhaseArgs } from "../types";

const RUNS_ENV_KEYS = [
  "BABYSITTER_RUNS_DIR",
  "BABYSITTER_RUNS_SCOPE",
  "BABYSITTER_EXECUTE_TASKS",
  "BABYSITTER_CROSS_SUBAGENTS",
] as const;

function baseArgs(overrides: Partial<RunOrchestrationPhaseArgs> = {}): RunOrchestrationPhaseArgs {
  return {
    processPath: "/tmp/proc.js",
    prompt: "do work",
    workspace: tmpdir(),
    // runsDir intentionally omitted in the default-path tests; callers override.
    runsDir: undefined as unknown as string,
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

describe("#936 resolveWorkspaceRunsDir defaults to the workspace runs dir", () => {
  let saved: Record<string, string | undefined>;

  beforeEach(() => {
    saved = {};
    for (const k of RUNS_ENV_KEYS) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
  });

  afterEach(() => {
    for (const k of RUNS_ENV_KEYS) {
      if (saved[k] !== undefined) process.env[k] = saved[k];
      else delete process.env[k];
    }
  });

  it("resolves <workspace>/.a5c/runs when no explicit runsDir / env / scope is set", async () => {
    // Use a fresh temp dir that has neither .git nor .a5c so the resolver anchors
    // on the workspace itself (the non-git-repo live-stack workspace case).
    const workspace = await mkdtemp(join(tmpdir(), "ws-runsdir-"));
    try {
      const resolved = resolveWorkspaceRunsDir(undefined, workspace);
      expect(resolved).toBe(join(workspace, ".a5c", "runs"));
      // And it must NOT be the global home runs dir.
      expect(resolved).not.toBe(join(homedir(), ".a5c", "runs"));
    } finally {
      await rm(workspace, { recursive: true, force: true }).catch(() => {});
    }
  });

  it("honors an explicit runsDir verbatim", () => {
    expect(resolveWorkspaceRunsDir("/explicit/runs", "/some/workspace")).toBe("/explicit/runs");
  });

  it("honors a BABYSITTER_RUNS_DIR override", () => {
    const override = resolve("/override/runs");
    process.env.BABYSITTER_RUNS_DIR = override;
    expect(resolveWorkspaceRunsDir(undefined, resolve("/some/workspace"))).toBe(override);
  });
});

describe("#936 runCliOrchestration anchors create + iterate to the workspace runs dir", () => {
  let saved: Record<string, string | undefined>;
  let workspace: string;

  beforeEach(async () => {
    workspace = await mkdtemp(join(tmpdir(), "ws-cliorch-"));
    saved = {};
    for (const k of RUNS_ENV_KEYS) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
    process.env.BABYSITTER_EXECUTE_TASKS = "1";
    process.env.BABYSITTER_CROSS_SUBAGENTS = "1";
    execFileSync.mockReset();
  });

  afterEach(async () => {
    for (const k of RUNS_ENV_KEYS) {
      if (saved[k] !== undefined) process.env[k] = saved[k];
      else delete process.env[k];
    }
    await rm(workspace, { recursive: true, force: true }).catch(() => {});
  });

  it("passes --runs-dir <workspace>/.a5c/runs to run:create and run:iterate when no runsDir is given", async () => {
    const expectedRunsDir = join(workspace, ".a5c", "runs");
    execFileSync.mockImplementation((_cmd: string, args: string[]) => {
      if (args.includes("run:create")) {
        return JSON.stringify({ runDir: join(expectedRunsDir, "run-936") });
      }
      if (args.includes("run:iterate")) {
        // Complete immediately so the loop exits after one iterate.
        return JSON.stringify({ status: "completed" });
      }
      return "{}";
    });

    const code = await runCliOrchestration(baseArgs({ workspace, runsDir: undefined as unknown as string }));
    expect(code).toBe(0);

    const createCall = execFileSync.mock.calls.find((c) => (c[1] as string[]).includes("run:create"));
    expect(createCall).toBeDefined();
    const createArgs = createCall![1] as string[];
    expect(createArgs).toContain("--runs-dir");
    expect(createArgs[createArgs.indexOf("--runs-dir") + 1]).toBe(expectedRunsDir);

    const iterateCall = execFileSync.mock.calls.find((c) => (c[1] as string[]).includes("run:iterate"));
    expect(iterateCall).toBeDefined();
    const iterateArgs = iterateCall![1] as string[];
    expect(iterateArgs).toContain("--runs-dir");
    expect(iterateArgs[iterateArgs.indexOf("--runs-dir") + 1]).toBe(expectedRunsDir);
  });
});
