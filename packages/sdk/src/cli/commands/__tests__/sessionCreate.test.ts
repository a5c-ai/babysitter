/**
 * Tests for session:create command handler.
 */

import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import type { HarnessDiscoveryResult, HarnessInvokeResult } from "../../../harness/types";
import type { IterationResult } from "../../../runtime/types";

// ── Mocks ─────────────────────────────────────────────────────────────

vi.mock("../../../harness/discovery", () => ({
  discoverHarnesses: vi.fn(),
}));

vi.mock("../../../harness/invoker", () => ({
  invokeHarness: vi.fn(),
}));

vi.mock("../../../runtime/createRun", () => ({
  createRun: vi.fn(),
}));

vi.mock("../../../runtime/orchestrateIteration", () => ({
  orchestrateIteration: vi.fn(),
}));

vi.mock("../../../runtime/commitEffectResult", () => ({
  commitEffectResult: vi.fn(),
}));

vi.mock("../../../harness/piWrapper", () => {
  let sessionCounter = 0;
  const createPiSession = vi.fn((options?: { customTools?: Array<Record<string, unknown>> }) => {
    sessionCounter += 1;
    const sessionId = `mock-session-id-${sessionCounter}`;
    const tools = options?.customTools ?? [];
    const getTool = (name: string) => tools.find((tool) => tool.name === name) as {
      execute?: (toolCallId: string, params: Record<string, unknown>) => Promise<{ details?: unknown }>;
    } | undefined;

    return {
      initialize: vi.fn().mockResolvedValue(undefined),
      subscribe: vi.fn(() => () => {}),
      dispose: vi.fn(),
      executeBash: vi.fn(async () => ({
        output: "ok",
        exitCode: 0,
        cancelled: false,
      })),
      get sessionId() {
        return sessionId;
      },
      get isInitialized() {
        return true;
      },
      prompt: vi.fn(async () => {
        const reportProcess = getTool("babysitter_report_process_definition");
        if (reportProcess?.execute) {
          await reportProcess.execute("tool-process", {
            processPath: "/tmp/generated-process.js",
            summary: "Generated process",
          });
          return { success: true, output: "phase1", exitCode: 0, duration: 1 };
        }

        const runCreate = getTool("babysitter_run_create");
        const bindSession = getTool("babysitter_bind_session");
        const runIterate = getTool("babysitter_run_iterate");
        const executeEffect = getTool("babysitter_execute_effect");
        const taskPost = getTool("babysitter_task_post_result");
        const finish = getTool("babysitter_finish_orchestration");

        if (runCreate?.execute) {
          await runCreate.execute("tool-run-create", {});
          await bindSession?.execute?.("tool-bind", {});

          while (true) {
            const iterationResult = await runIterate?.execute?.("tool-iterate", {});
            const details = iterationResult?.details as Record<string, unknown> | undefined;
            const status = details?.status as string | undefined;
            if (status === "waiting") {
              const nextActions = (details?.nextActions as Array<Record<string, unknown>> | undefined) ?? [];
              for (const action of nextActions) {
                const effectId = String(action.effectId);
                if (action.kind === "breakpoint") {
                  await taskPost?.execute?.("tool-post-breakpoint", { effectId });
                } else {
                  await executeEffect?.execute?.("tool-execute-effect", { effectId });
                  await taskPost?.execute?.("tool-post-effect", { effectId });
                }
              }
              continue;
            }
            break;
          }

          await finish?.execute?.("tool-finish", { summary: "done" });
        }

        return { success: true, output: "phase2", exitCode: 0, duration: 1 };
      }),
    };
  });

  return {
    createPiSession,
    PiSessionHandle: class {},
  };
});

// Dynamic import validation is hard to mock; stub the fs.access call used by waitForProcessFile
vi.mock("node:fs", async () => {
  const actual = await vi.importActual<typeof import("node:fs")>("node:fs");
  return {
    ...actual,
    promises: {
      ...actual.promises,
      access: vi.fn().mockResolvedValue(undefined),
    },
  };
});

import { handleSessionCreate, selectHarness } from "../sessionCreate";
import { discoverHarnesses } from "../../../harness/discovery";
import { invokeHarness } from "../../../harness/invoker";
import { createPiSession } from "../../../harness/piWrapper";
import { createRun } from "../../../runtime/createRun";
import { orchestrateIteration } from "../../../runtime/orchestrateIteration";
import { commitEffectResult } from "../../../runtime/commitEffectResult";

// ── Helpers ───────────────────────────────────────────────────────────

function makeDiscoveryResult(
  overrides: Partial<HarnessDiscoveryResult> & { name: string },
): HarnessDiscoveryResult {
  return {
    installed: true,
    cliCommand: overrides.name,
    configFound: false,
    capabilities: [],
    platform: "linux",
    ...overrides,
  };
}

function makeInvokeResult(
  overrides?: Partial<HarnessInvokeResult>,
): HarnessInvokeResult {
  return {
    success: true,
    output: "done",
    exitCode: 0,
    duration: 100,
    harness: "pi",
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────

describe("selectHarness", () => {
  const harnesses: HarnessDiscoveryResult[] = [
    makeDiscoveryResult({ name: "claude-code" }),
    makeDiscoveryResult({ name: "codex" }),
    makeDiscoveryResult({ name: "gemini-cli" }),
    makeDiscoveryResult({ name: "opencode" }),
    makeDiscoveryResult({ name: "pi" }),
  ];

  it("selects pi as highest priority when all are available", () => {
    const selected = selectHarness(harnesses);
    expect(selected?.name).toBe("pi");
  });

  it("respects priority order: pi > claude-code > codex > gemini-cli > opencode", () => {
    // Remove pi
    const withoutPi = harnesses.filter((h) => h.name !== "pi");
    expect(selectHarness(withoutPi)?.name).toBe("claude-code");

    // Remove pi + claude-code
    const withoutPiClaude = withoutPi.filter((h) => h.name !== "claude-code");
    expect(selectHarness(withoutPiClaude)?.name).toBe("codex");

    // Remove pi + claude-code + codex
    const withoutPiClaudeCodex = withoutPiClaude.filter(
      (h) => h.name !== "codex",
    );
    expect(selectHarness(withoutPiClaudeCodex)?.name).toBe("gemini-cli");

    // Only opencode left
    const onlyOpencode = withoutPiClaudeCodex.filter(
      (h) => h.name !== "gemini-cli",
    );
    expect(selectHarness(onlyOpencode)?.name).toBe("opencode");
  });

  it("selects preferred harness when specified and installed", () => {
    const selected = selectHarness(harnesses, "codex");
    expect(selected?.name).toBe("codex");
  });

  it("falls back to priority when preferred harness is not installed", () => {
    const selected = selectHarness(harnesses, "cursor");
    expect(selected?.name).toBe("pi");
  });

  it("returns undefined when no harness is installed", () => {
    const noneInstalled = harnesses.map((h) => ({
      ...h,
      installed: false,
    }));
    const selected = selectHarness(noneInstalled);
    expect(selected).toBeUndefined();
  });

  it("skips uninstalled harnesses even if they are high priority", () => {
    const piUninstalled = harnesses.map((h) =>
      h.name === "pi" ? { ...h, installed: false } : h,
    );
    const selected = selectHarness(piUninstalled);
    expect(selected?.name).toBe("claude-code");
  });
});

describe("handleSessionCreate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  describe("Phase A: --process flag skips generation", () => {
    it("skips Phase A when --process is provided", async () => {
      (discoverHarnesses as Mock).mockResolvedValue([
        makeDiscoveryResult({ name: "pi" }),
      ]);
      (createRun as Mock).mockResolvedValue({
        runId: "run-1",
        runDir: "/tmp/runs/run-1",
        metadata: {},
      });
      const completedResult: IterationResult = {
        status: "completed",
        output: { result: "done" },
      };
      (orchestrateIteration as Mock).mockResolvedValue(completedResult);

      const code = await handleSessionCreate({
        processPath: "/tmp/my-process.js",
        runsDir: "/tmp/runs",
        json: false,
        verbose: false,
        interactive: false,
      });

      expect(code).toBe(0);
      // invokeHarness should NOT have been called for Phase A meta-prompt
      // It may be called for Phase C effects, but not for process generation
      expect(invokeHarness).not.toHaveBeenCalled();
    });
  });

  describe("Phase B: run creation", () => {
    it("creates a run with correct parameters", async () => {
      (discoverHarnesses as Mock).mockResolvedValue([
        makeDiscoveryResult({ name: "claude-code" }),
      ]);
      (createRun as Mock).mockResolvedValue({
        runId: "run-abc",
        runDir: "/tmp/runs/run-abc",
        metadata: {},
      });
      const completedResult: IterationResult = {
        status: "completed",
        output: "success",
      };
      (orchestrateIteration as Mock).mockResolvedValue(completedResult);

      await handleSessionCreate({
        processPath: "/tmp/process.js",
        prompt: "build a thing",
        runsDir: "/tmp/runs",
        json: false,
        verbose: false,
        interactive: false,
      });

      expect(createRun).toHaveBeenCalledWith(
        expect.objectContaining({
          runsDir: "/tmp/runs",
          prompt: "build a thing",
          process: expect.objectContaining({
            processId: "process",
          }),
        }),
      );
    });

    it("returns 1 when run creation fails", async () => {
      (discoverHarnesses as Mock).mockResolvedValue([
        makeDiscoveryResult({ name: "pi" }),
      ]);
      (createRun as Mock).mockRejectedValue(new Error("disk full"));

      const code = await handleSessionCreate({
        processPath: "/tmp/process.js",
        runsDir: "/tmp/runs",
        json: false,
        verbose: false,
        interactive: false,
      });

      expect(code).toBe(1);
    });
  });

  describe("PI worker defaults", () => {
    it("uses native local PI defaults for phase sessions instead of forced secure isolation", async () => {
      (discoverHarnesses as Mock).mockResolvedValue([
        makeDiscoveryResult({ name: "pi" }),
      ]);
      (createRun as Mock).mockResolvedValue({
        runId: "run-1",
        runDir: "/tmp/runs/run-1",
        metadata: {},
      });
      (orchestrateIteration as Mock).mockResolvedValue({
        status: "completed",
        output: "done",
      });

      const code = await handleSessionCreate({
        processPath: "/tmp/p.js",
        runsDir: "/tmp/runs",
        json: false,
        verbose: false,
        interactive: false,
      });

      expect(code).toBe(0);
      expect(createPiSession).toHaveBeenCalledWith(
        expect.objectContaining({
          workspace: undefined,
          toolsMode: "readonly",
          ephemeral: true,
        }),
      );
      expect(createPiSession).not.toHaveBeenCalledWith(
        expect.objectContaining({
          bashSandbox: "secure",
        }),
      );
      expect(createPiSession).not.toHaveBeenCalledWith(
        expect.objectContaining({
          isolated: true,
        }),
      );
      expect(createPiSession).not.toHaveBeenCalledWith(
        expect.objectContaining({
          enableCompaction: true,
        }),
      );
    });

    it("lets effect metadata opt a shell worker into secure AgentSH execution", async () => {
      (discoverHarnesses as Mock).mockResolvedValue([
        makeDiscoveryResult({ name: "codex" }),
        makeDiscoveryResult({ name: "pi" }),
      ]);
      (createRun as Mock).mockResolvedValue({
        runId: "run-1",
        runDir: "/tmp/runs/run-1",
        metadata: {},
      });

      const waitingResult: IterationResult = {
        status: "waiting",
        nextActions: [
          {
            effectId: "eff-shell",
            invocationKey: "key-shell",
            kind: "shell",
            taskDef: {
              kind: "shell",
              title: "run secure shell task",
              metadata: {
                command: "npm",
                args: ["test"],
                bashSandbox: "secure",
                isolated: true,
                enableCompaction: true,
              },
            },
          },
        ],
      };
      (orchestrateIteration as Mock)
        .mockResolvedValueOnce(waitingResult)
        .mockResolvedValueOnce({
          status: "completed",
          output: "done",
        });
      (commitEffectResult as Mock).mockResolvedValue({});

      const code = await handleSessionCreate({
        processPath: "/tmp/p.js",
        runsDir: "/tmp/runs",
        json: false,
        verbose: false,
        interactive: false,
      });

      expect(code).toBe(0);
      expect(createPiSession).toHaveBeenCalledWith(
        expect.objectContaining({
          toolsMode: "coding",
          bashSandbox: "secure",
          isolated: true,
          enableCompaction: true,
          ephemeral: true,
        }),
      );
    });
  });

  describe("Phase C: orchestration loop", () => {
    it("returns 0 when run completes on first iteration", async () => {
      (discoverHarnesses as Mock).mockResolvedValue([
        makeDiscoveryResult({ name: "pi" }),
      ]);
      (createRun as Mock).mockResolvedValue({
        runId: "run-1",
        runDir: "/tmp/runs/run-1",
        metadata: {},
      });
      const completedResult: IterationResult = {
        status: "completed",
        output: "all done",
      };
      (orchestrateIteration as Mock).mockResolvedValue(completedResult);

      const code = await handleSessionCreate({
        processPath: "/tmp/p.js",
        runsDir: "/tmp/runs",
        json: false,
        verbose: false,
        interactive: false,
      });

      expect(code).toBe(0);
      expect(orchestrateIteration).toHaveBeenCalledTimes(1);
    });

    it("resolves pending effects and re-iterates", async () => {
      (discoverHarnesses as Mock).mockResolvedValue([
        makeDiscoveryResult({ name: "pi" }),
      ]);
      (createRun as Mock).mockResolvedValue({
        runId: "run-1",
        runDir: "/tmp/runs/run-1",
        metadata: {},
      });

      const waitingResult: IterationResult = {
        status: "waiting",
        nextActions: [
          {
            effectId: "eff-1",
            invocationKey: "key-1",
            kind: "breakpoint",
            taskDef: { kind: "breakpoint" },
          },
        ],
      };
      const completedResult: IterationResult = {
        status: "completed",
        output: "done",
      };
      (orchestrateIteration as Mock)
        .mockResolvedValueOnce(waitingResult)
        .mockResolvedValueOnce(completedResult);
      (commitEffectResult as Mock).mockResolvedValue({});

      const code = await handleSessionCreate({
        processPath: "/tmp/p.js",
        runsDir: "/tmp/runs",
        json: false,
        verbose: false,
        interactive: false,
      });

      expect(code).toBe(0);
      expect(orchestrateIteration).toHaveBeenCalledTimes(2);
      expect(commitEffectResult).toHaveBeenCalledWith(
        expect.objectContaining({
          runDir: "/tmp/runs/run-1",
          effectId: "eff-1",
          invocationKey: "key-1",
          result: expect.objectContaining({
            status: "ok",
            value: expect.objectContaining({
              approved: true,
              option: "Approve",
              askUserQuestion: {
                answers: {
                  Decision: "Approve",
                },
              },
            }),
          }),
        }),
      );
    });

    it("invokes harness for node-kind effects", async () => {
      (discoverHarnesses as Mock).mockResolvedValue([
        makeDiscoveryResult({ name: "claude-code" }),
      ]);
      (createRun as Mock).mockResolvedValue({
        runId: "run-1",
        runDir: "/tmp/runs/run-1",
        metadata: {},
      });

      const waitingResult: IterationResult = {
        status: "waiting",
        nextActions: [
          {
            effectId: "eff-2",
            invocationKey: "key-2",
            kind: "node",
            taskDef: { kind: "node", title: "do something" },
          },
        ],
      };
      const completedResult: IterationResult = {
        status: "completed",
        output: "done",
      };
      (orchestrateIteration as Mock)
        .mockResolvedValueOnce(waitingResult)
        .mockResolvedValueOnce(completedResult);
      (invokeHarness as Mock).mockResolvedValue(
        makeInvokeResult({ harness: "claude-code" }),
      );
      (commitEffectResult as Mock).mockResolvedValue({});

      const code = await handleSessionCreate({
        processPath: "/tmp/p.js",
        runsDir: "/tmp/runs",
        json: false,
        verbose: false,
        interactive: false,
      });

      expect(code).toBe(0);
      expect(invokeHarness).toHaveBeenCalledWith(
        "claude-code",
        expect.objectContaining({ prompt: "do something" }),
      );
    });

    it("returns 1 when run fails", async () => {
      (discoverHarnesses as Mock).mockResolvedValue([
        makeDiscoveryResult({ name: "pi" }),
      ]);
      (createRun as Mock).mockResolvedValue({
        runId: "run-1",
        runDir: "/tmp/runs/run-1",
        metadata: {},
      });
      const failedResult: IterationResult = {
        status: "failed",
        error: { message: "process exploded" },
      };
      (orchestrateIteration as Mock).mockResolvedValue(failedResult);

      const code = await handleSessionCreate({
        processPath: "/tmp/p.js",
        runsDir: "/tmp/runs",
        json: false,
        verbose: false,
        interactive: false,
      });

      expect(code).toBe(1);
    });

    it("returns 1 when max iterations exhausted", async () => {
      (discoverHarnesses as Mock).mockResolvedValue([
        makeDiscoveryResult({ name: "pi" }),
      ]);
      (createRun as Mock).mockResolvedValue({
        runId: "run-1",
        runDir: "/tmp/runs/run-1",
        metadata: {},
      });

      const waitingResult: IterationResult = {
        status: "waiting",
        nextActions: [
          {
            effectId: "eff-1",
            invocationKey: "key-1",
            kind: "breakpoint",
            taskDef: { kind: "breakpoint" },
          },
        ],
      };
      (orchestrateIteration as Mock).mockResolvedValue(waitingResult);
      (commitEffectResult as Mock).mockResolvedValue({});

      const code = await handleSessionCreate({
        processPath: "/tmp/p.js",
        runsDir: "/tmp/runs",
        maxIterations: 3,
        json: false,
        verbose: false,
        interactive: false,
      });

      expect(code).toBe(1);
      expect(orchestrateIteration).toHaveBeenCalledTimes(3);
    });
  });

  describe("JSON output", () => {
    it("emits structured JSON for each phase", async () => {
      (discoverHarnesses as Mock).mockResolvedValue([
        makeDiscoveryResult({ name: "pi" }),
      ]);
      (createRun as Mock).mockResolvedValue({
        runId: "run-json",
        runDir: "/tmp/runs/run-json",
        metadata: {},
      });
      const completedResult: IterationResult = {
        status: "completed",
        output: "result",
      };
      (orchestrateIteration as Mock).mockResolvedValue(completedResult);

      const logSpy = console.log as Mock;

      await handleSessionCreate({
        processPath: "/tmp/p.js",
        runsDir: "/tmp/runs",
        json: true,
        verbose: false,
      });

      // Gather all JSON output
      const jsonOutputs = logSpy.mock.calls
        .map((call: unknown[]) => {
          try {
            return JSON.parse(call[0] as string) as Record<string, unknown>;
          } catch {
            return null;
          }
        })
        .filter(Boolean) as Record<string, unknown>[];

      // Should have Phase 1 (skipped) and Phase 2 progress entries
      const phases = jsonOutputs.map((o) => o.phase);
      expect(phases).toContain("1");
      expect(phases).toContain("2");
    });
  });

  describe("error handling", () => {
    it("proceeds with pi programmatic API even when no CLI harness is installed", async () => {
      (discoverHarnesses as Mock).mockResolvedValue([
        makeDiscoveryResult({ name: "pi", installed: false }),
      ]);
      (createRun as Mock).mockResolvedValue({
        runId: "run-1",
        runDir: "/tmp/runs/run-1",
        metadata: {},
      });
      (orchestrateIteration as Mock).mockResolvedValue({
        status: "completed",
        output: "done",
      });

      const code = await handleSessionCreate({
        processPath: "/tmp/p.js",
        runsDir: "/tmp/runs",
        json: false,
        verbose: false,
        interactive: false,
      });

      // No CLI harness found, but session:create proceeds using pi
      // programmatic API as the default — does not exit with error
      expect(code).toBe(0);
    });

    it("honors explicit --harness pi even when another installed harness is discovered", async () => {
      (discoverHarnesses as Mock).mockResolvedValue([
        makeDiscoveryResult({ name: "claude-code" }),
      ]);
      (createRun as Mock).mockResolvedValue({
        runId: "run-1",
        runDir: "/tmp/runs/run-1",
        metadata: {},
      });
      (orchestrateIteration as Mock)
        .mockResolvedValueOnce({
          status: "waiting",
          nextActions: [
            {
              effectId: "eff-1",
              invocationKey: "key-1",
              kind: "agent",
              taskDef: {
                kind: "agent",
                title: "Implement the requested work",
              },
            },
          ],
        })
        .mockResolvedValueOnce({
          status: "completed",
          output: "done",
        });
      (commitEffectResult as Mock).mockResolvedValue({});

      const code = await handleSessionCreate({
        processPath: "/tmp/p.js",
        runsDir: "/tmp/runs",
        harness: "pi",
        json: false,
        verbose: false,
        interactive: false,
      });

      expect(code).toBe(0);
      expect(createPiSession).toHaveBeenCalled();
      expect(invokeHarness).not.toHaveBeenCalled();
      expect(commitEffectResult).toHaveBeenCalledWith(
        expect.objectContaining({
          runDir: "/tmp/runs/run-1",
          effectId: "eff-1",
          invocationKey: "key-1",
          result: expect.objectContaining({
            status: "ok",
          }),
        }),
      );
    });

    it("returns 1 when neither --prompt nor --process is provided", async () => {
      const code = await handleSessionCreate({
        runsDir: "/tmp/runs",
        json: false,
        verbose: false,
        interactive: false,
      });

      expect(code).toBe(1);
    });
  });
});
