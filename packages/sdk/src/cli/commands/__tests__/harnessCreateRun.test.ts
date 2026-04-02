/**
 * Tests for harness:create-run command handler.
 */

import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from "vitest";
import { promises as fs, existsSync } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import type { HarnessDiscoveryResult, HarnessInvokeResult } from "../../../harness/types";
import type { IterationResult } from "../../../runtime/types";
import { RunFailedError } from "../../../runtime/exceptions";

// ── Mocks ─────────────────────────────────────────────────────────────

vi.mock("../../../harness/discovery", () => ({
  discoverHarnesses: vi.fn(),
  detectCallerHarness: vi.fn(() => null),
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

vi.mock("../../../interaction", async () => {
  const actual = await vi.importActual<typeof import("../../../interaction")>("../../../interaction");
  return {
    ...actual,
    promptAskUserQuestionWithReadline: vi.fn(async (_rl, request) => {
      const firstQuestion = request.questions[0];
      const key = firstQuestion?.header?.trim() || "Question 1";
      const answer = firstQuestion?.options?.[0]?.label || "mock answer";
      return actual.createAskUserQuestionResponse(request, {
        [key]: answer,
      });
    }),
  };
});

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
            const writeProcess = getTool("babysitter_write_process_definition");
            if (writeProcess?.execute) {
              await writeProcess.execute("tool-write", {
                source: 'function defineTask(id, build) { return { id, build }; }\nconst t = defineTask("t", () => ({ kind: "agent", agent: { name: "a", prompt: { task: "x" }, outputSchema: { type: "object" } } }));\nexport async function process(inputs, ctx) { return await ctx.task(t, {}); }',
                filename: "generated-process.mjs",
              });
            }
            await reportProcess.execute("tool-process", {
            processPath: "/tmp/.a5c/processes/generated-process.mjs",
            summary: "Generated process",
          });
          return { success: true, output: "phase1", exitCode: 0, duration: 1 };
        }

        const runCreate = getTool("babysitter_run_create");
        const bindSession = getTool("babysitter_bind_session");
        const runIterate = getTool("babysitter_run_iterate");
        const runShellEffect = getTool("babysitter_run_shell_effect");
        const dispatchEffectHarness = getTool("babysitter_dispatch_effect_harness");
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
                } else if (action.kind === "shell") {
                  await runShellEffect?.execute?.("tool-run-shell", { effectId });
                  await taskPost?.execute?.("tool-post-shell", { effectId });
                } else {
                  await dispatchEffectHarness?.execute?.("tool-dispatch-effect", { effectId });
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

import { handleHarnessCreateRun, selectHarness } from "../harnessCreateRun";
import { discoverHarnesses, detectCallerHarness } from "../../../harness/discovery";
import { invokeHarness } from "../../../harness/invoker";
import { createPiSession } from "../../../harness/piWrapper";
import { createRun } from "../../../runtime/createRun";
import { orchestrateIteration } from "../../../runtime/orchestrateIteration";
import { commitEffectResult } from "../../../runtime/commitEffectResult";

const detectCallerHarnessMock = detectCallerHarness as Mock;

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

function buildMinimalAgentProcessSource(args?: {
  preludeLines?: string[];
  processLines?: string[];
  taskId?: string;
  taskVarName?: string;
  taskPrompt?: string;
}): string {
  const taskId = args?.taskId ?? "main-task";
  const taskVarName = args?.taskVarName ?? "mainTask";
  const taskPrompt = args?.taskPrompt ?? "Complete the requested work.";
  return [
    ...(args?.preludeLines ?? []),
    "function defineTask(taskId, build) {",
    "  return { taskId, build };",
    "}",
    "",
    `const ${taskVarName} = defineTask("${taskId}", () => ({`,
    '  kind: "agent",',
    "  agent: {",
    '    name: "general-purpose",',
    "    prompt: {",
    `      task: ${JSON.stringify(taskPrompt)},`,
    "      instructions: [],",
    "    },",
    '    outputSchema: { type: "object" },',
    "  },",
    "}));",
    "",
    "export async function process(inputs, ctx) {",
    ...(args?.processLines ?? [`  return await ctx.task(${taskVarName}, {});`]),
    "}",
    "",
  ].join("\n");
}

// ── Tests ─────────────────────────────────────────────────────────────

describe("selectHarness", () => {
  const originalCodexThreadId = process.env.CODEX_THREAD_ID;
  const originalCodexSessionId = process.env.CODEX_SESSION_ID;
  const harnesses: HarnessDiscoveryResult[] = [
    makeDiscoveryResult({ name: "claude-code" }),
    makeDiscoveryResult({ name: "codex" }),
    makeDiscoveryResult({ name: "gemini-cli" }),
    makeDiscoveryResult({ name: "opencode" }),
    makeDiscoveryResult({ name: "pi" }),
  ];

  beforeEach(() => {
    delete process.env.CODEX_THREAD_ID;
    delete process.env.CODEX_SESSION_ID;
    detectCallerHarnessMock.mockReturnValue(null);
  });

  afterEach(() => {
    if (originalCodexThreadId === undefined) {
      delete process.env.CODEX_THREAD_ID;
    } else {
      process.env.CODEX_THREAD_ID = originalCodexThreadId;
    }
    if (originalCodexSessionId === undefined) {
      delete process.env.CODEX_SESSION_ID;
    } else {
      process.env.CODEX_SESSION_ID = originalCodexSessionId;
    }
  });

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

  it("prefers the active caller harness when no explicit preference is provided", () => {
    detectCallerHarnessMock.mockReturnValue({
      name: "codex",
      matchedEnvVars: ["CODEX_THREAD_ID"],
      capabilities: [],
    });
    const selected = selectHarness(harnesses);
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

describe("handleHarnessCreateRun", () => {
  let tempDirs: string[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
    // vi.clearAllMocks does NOT clear mockImplementationOnce / mockResolvedValueOnce
    // queues, so leftover overrides from one test can leak into the next.
    // mockReset clears the once queue but also the base implementation, so we
    // save the factory default for createPiSession (the only mock with a
    // non-trivial factory impl) and restore it after reset.
    const piDefault = vi.mocked(createPiSession).getMockImplementation();
    vi.mocked(createPiSession).mockReset();
    if (piDefault) vi.mocked(createPiSession).mockImplementation(piDefault);
    // These mocks have no factory implementation (just vi.fn()), so plain
    // mockReset is sufficient to clear once-queues without losing anything.
    vi.mocked(orchestrateIteration).mockReset();
    vi.mocked(createRun).mockReset();
    vi.mocked(commitEffectResult).mockReset();
    vi.mocked(invokeHarness).mockReset();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    detectCallerHarnessMock.mockReturnValue(null);
  });

  afterEach(async () => {
    await Promise.all(
      tempDirs.map(async (dir) => {
        await fs.rm(dir, { recursive: true, force: true });
      }),
    );
    tempDirs = [];
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

      const code = await handleHarnessCreateRun({
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

  describe("Harness policy", () => {
    it("uses the internal pi wrapper for phase 1 and as the default phase 2 harness even when external harnesses are discovered", async () => {
      const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "session-create-internal-default-"));
      tempDirs.push(workspace);
      const generatedPath = path.join(workspace, ".a5c", "processes");
      const generatedFile = path.join(generatedPath, "test-process.mjs");
      let phase1Prompt = "";
      await fs.mkdir(generatedPath, { recursive: true });
      await fs.writeFile(
        generatedFile,
        buildMinimalAgentProcessSource(),
        "utf8",
      );

      (discoverHarnesses as Mock).mockResolvedValue([
        makeDiscoveryResult({ name: "codex" }),
        makeDiscoveryResult({ name: "claude-code" }),
      ]);
      detectCallerHarnessMock.mockReturnValue({
        name: "codex",
        matchedEnvVars: ["CODEX_THREAD_ID"],
        capabilities: [],
      });
      vi.mocked(createPiSession).mockImplementationOnce((options?: { customTools?: Array<Record<string, unknown>> }) => {
        const tools = options?.customTools ?? [];
        const reportProcess = tools.find((tool) => tool.name === "babysitter_report_process_definition") as {
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
            return "mock-session-id-phase1-internal-default";
          },
          get isInitialized() {
            return true;
          },
          prompt: vi.fn(async (prompt: string) => {
            phase1Prompt = prompt;
            await reportProcess?.execute?.("tool-process", {
              processPath: generatedFile,
              summary: "Generated process",
            });
            return { success: true, output: "phase1", exitCode: 0, duration: 1 };
          }),
        };
      });
      (createRun as Mock).mockResolvedValue({
        runId: "run-internal-default",
        runDir: "/tmp/runs/run-internal-default",
        metadata: {},
      });
      (orchestrateIteration as Mock).mockResolvedValue({
        status: "completed",
        output: "done",
      });

      const code = await handleHarnessCreateRun({
        prompt: "create a game",
        workspace,
        runsDir: "/tmp/runs",
        json: false,
        verbose: false,
        interactive: false,
      });

      expect(code).toBe(0);
      expect(createPiSession).toHaveBeenCalled();
      const phase1Options = vi.mocked(createPiSession).mock.calls[0]?.[0] as {
        workspace?: string;
        toolsMode?: string;
        isolated?: boolean;
        ephemeral?: boolean;
        customTools?: Array<{ name?: string }>;
        systemPrompt?: string;
      };
      expect(phase1Options).toMatchObject({
        workspace,
        isolated: true,
        ephemeral: true,
      });
      expect(["default", "coding"]).toContain(phase1Options.toolsMode ?? "");
      expect(phase1Options.customTools?.map((tool) => tool.name)).toEqual(
        expect.arrayContaining([
          "babysitter_write_process_definition",
          "babysitter_resolve_process_library",
          "babysitter_search_process_library",
          "babysitter_read_process_library_file",
          "babysitter_report_process_definition",
        ]),
      );
      expect(invokeHarness).not.toHaveBeenCalled();
      expect(phase1Prompt).toContain("Non-interactive mode. Do not call AskUserQuestion");
      expect(phase1Prompt).toContain("Workspace assessment:");
      expect(phase1Options.systemPrompt).toContain("babysitter_resolve_process_library");
      expect(phase1Options.systemPrompt).toContain("babysitter_search_process_library");
      expect(phase1Prompt).toContain("The generated process must directly execute the user's requested work");
      expect(phase1Prompt).not.toContain("You are a babysitter process generator");
    });

    it("binds an interactive UI context into the internal PI sessions", async () => {
      const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "session-create-interactive-ui-"));
      tempDirs.push(workspace);
      const generatedPath = path.join(workspace, ".a5c", "processes");
      const generatedFile = path.join(generatedPath, "test-process.mjs");

      (discoverHarnesses as Mock).mockResolvedValue([
        makeDiscoveryResult({ name: "pi" }),
      ]);
      (createRun as Mock).mockResolvedValue({
        runId: "run-interactive-ui",
        runDir: "/tmp/runs/run-interactive-ui",
        metadata: {},
      });
      (orchestrateIteration as Mock).mockResolvedValue({
        status: "completed",
        output: "done",
      });
      vi.mocked(createPiSession)
        .mockImplementationOnce((options?: { customTools?: Array<Record<string, unknown>> }) => {
          const tools = options?.customTools ?? [];
          const writeProcess = tools.find((tool) => tool.name === "babysitter_write_process_definition") as {
            execute?: (toolCallId: string, params: Record<string, unknown>) => Promise<{ details?: unknown }>;
          } | undefined;
          const reportProcess = tools.find((tool) => tool.name === "babysitter_report_process_definition") as {
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
              return "mock-session-id-phase1-interactive-ui";
            },
            get isInitialized() {
              return true;
            },
            prompt: vi.fn(async () => {
              await writeProcess?.execute?.("tool-write-process", {
                filename: "test-process.mjs",
                source: buildMinimalAgentProcessSource(),
              });
              await reportProcess?.execute?.("tool-report-process", {
                processPath: generatedFile,
                summary: "Generated process",
              });
              return { success: true, output: "phase1", exitCode: 0, duration: 1 };
            }),
          };
        })
        .mockImplementationOnce((options?: { customTools?: Array<Record<string, unknown>> }) => {
          const tools = options?.customTools ?? [];
          const runCreate = tools.find((tool) => tool.name === "babysitter_run_create") as {
            execute?: (toolCallId: string, params: Record<string, unknown>) => Promise<{ details?: unknown }>;
          } | undefined;
          const bindSession = tools.find((tool) => tool.name === "babysitter_bind_session") as {
            execute?: (toolCallId: string, params: Record<string, unknown>) => Promise<{ details?: unknown }>;
          } | undefined;
          const runIterate = tools.find((tool) => tool.name === "babysitter_run_iterate") as {
            execute?: (toolCallId: string, params: Record<string, unknown>) => Promise<{ details?: unknown }>;
          } | undefined;
          const finish = tools.find((tool) => tool.name === "babysitter_finish_orchestration") as {
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
              return "mock-session-id-phase2-interactive-ui";
            },
            get isInitialized() {
              return true;
            },
            prompt: vi.fn(async () => {
              await runCreate?.execute?.("tool-run-create", {});
              await bindSession?.execute?.("tool-bind-session", {});
              await runIterate?.execute?.("tool-run-iterate", {});
              await finish?.execute?.("tool-finish", { summary: "done" });
              return { success: true, output: "phase2", exitCode: 0, duration: 1 };
            }),
          };
        });

      const code = await handleHarnessCreateRun({
        prompt: "create a game",
        workspace,
        runsDir: "/tmp/runs",
        json: false,
        verbose: false,
        interactive: true,
      });

      expect(code).toBe(0);
      expect(vi.mocked(createPiSession).mock.calls[0]?.[0]).toEqual(
        expect.objectContaining({
          uiContext: expect.any(Object),
        }),
      );
      expect(vi.mocked(createPiSession).mock.calls[1]?.[0]).toEqual(
        expect.objectContaining({
          uiContext: expect.any(Object),
        }),
      );
    });

    it("fails interactive breakpoint posting when AskUserQuestion was skipped", async () => {
      const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "session-create-interactive-breakpoint-"));
      tempDirs.push(workspace);

      (discoverHarnesses as Mock).mockResolvedValue([
        makeDiscoveryResult({ name: "pi" }),
      ]);
      (createRun as Mock).mockResolvedValue({
        runId: "run-breakpoint-ui",
        runDir: "/tmp/runs/run-breakpoint-ui",
        metadata: {},
      });
      (orchestrateIteration as Mock).mockResolvedValueOnce({
        status: "waiting",
        nextActions: [
          {
            effectId: "eff-breakpoint",
            invocationKey: "key-breakpoint",
            kind: "breakpoint",
            taskDef: { kind: "breakpoint", title: "Approve the plan?" },
          },
        ],
      });
      vi.mocked(createPiSession).mockImplementationOnce((options?: { customTools?: Array<Record<string, unknown>> }) => {
        const tools = options?.customTools ?? [];
        const getTool = (name: string) => tools.find((t) => t.name === name) as {
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
            return "mock-session-id-interactive-breakpoint";
          },
          get isInitialized() {
            return true;
          },
          prompt: vi.fn(async () => {
            await getTool("babysitter_run_create")?.execute?.("tool-run-create", {});
            await getTool("babysitter_bind_session")?.execute?.("tool-bind-session", {});
            const iterationResult = await getTool("babysitter_run_iterate")?.execute?.("tool-run-iterate", {});
            const details = iterationResult?.details as { nextActions?: Array<{ effectId?: string }> } | undefined;
            const effectId = details?.nextActions?.[0]?.effectId;
            if (effectId) {
              await getTool("babysitter_task_post_result")?.execute?.("tool-post-breakpoint", { effectId });
            }
            return { success: true, output: "phase2", exitCode: 0, duration: 1 };
          }),
        } as ReturnType<typeof createPiSession>;
      });

      const code = await handleHarnessCreateRun({
        processPath: "/tmp/p.js",
        runsDir: "/tmp/runs",
        json: false,
        verbose: false,
        interactive: true,
      });

      expect(code).toBe(1);
      expect(commitEffectResult).not.toHaveBeenCalled();
    });

    it("preserves staged dispatch result when posting with stdout overrides", async () => {
      const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "session-create-preserve-staged-"));
      tempDirs.push(workspace);

      (discoverHarnesses as Mock).mockResolvedValue([
        makeDiscoveryResult({ name: "pi" }),
      ]);
      (createRun as Mock).mockResolvedValue({
        runId: "run-preserve-staged",
        runDir: "/tmp/runs/run-preserve-staged",
        metadata: {},
      });
      (orchestrateIteration as Mock)
        .mockResolvedValueOnce({
          status: "waiting",
          nextActions: [
            {
              effectId: "eff-agent",
              invocationKey: "key-agent",
              kind: "agent",
              taskDef: { kind: "agent", title: "Do work" },
            },
          ],
        })
        .mockResolvedValueOnce({
          status: "completed",
          output: { ok: true },
        });
      (invokeHarness as Mock).mockResolvedValue(
        makeInvokeResult({
          output: JSON.stringify({ answer: 42 }),
        }),
      );

      vi.mocked(createPiSession).mockImplementationOnce((options?: { customTools?: Array<Record<string, unknown>> }) => {
        const tools = options?.customTools ?? [];
        const getTool = (name: string) => tools.find((t) => t.name === name) as {
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
            return "mock-session-id-preserve-staged";
          },
          get isInitialized() {
            return true;
          },
          prompt: vi.fn(async () => {
            await getTool("babysitter_run_create")?.execute?.("tool-run-create", {});
            await getTool("babysitter_bind_session")?.execute?.("tool-bind", {});
            const iter1 = await getTool("babysitter_run_iterate")?.execute?.("tool-iterate-1", {});
            const details = iter1?.details as { nextActions?: Array<{ effectId?: string }> } | undefined;
            const effectId = details?.nextActions?.[0]?.effectId;
            if (effectId) {
              await getTool("babysitter_dispatch_effect_harness")?.execute?.("tool-dispatch", { effectId });
              await getTool("babysitter_task_post_result")?.execute?.("tool-post", {
                effectId,
                status: "ok",
                stdout: "worker-log",
              });
            }
            await getTool("babysitter_run_iterate")?.execute?.("tool-iterate-2", {});
            await getTool("babysitter_finish_orchestration")?.execute?.("tool-finish", { summary: "done" });
            return { success: true, output: "phase2", exitCode: 0, duration: 1 };
          }),
        } as ReturnType<typeof createPiSession>;
      });

      const code = await handleHarnessCreateRun({
        processPath: "/tmp/p.js",
        prompt: "create a game",
        workspace,
        runsDir: "/tmp/runs",
        json: false,
        verbose: false,
        interactive: false,
      });

      expect(code).toBe(0);
      expect(commitEffectResult).toHaveBeenCalledWith(
        expect.objectContaining({
          effectId: "eff-agent",
          result: expect.objectContaining({
            status: "ok",
            value: expect.anything(),
            stdout: "worker-log",
          }),
        }),
      );
    });

    it("continues phase 2 after a late bootstrap prompt failure and preserves the original user prompt", async () => {
      const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "session-create-phase2-late-failure-"));
      tempDirs.push(workspace);
      const generatedPath = path.join(workspace, ".a5c", "processes");
      const generatedFile = path.join(generatedPath, "test-process.mjs");
      await fs.mkdir(generatedPath, { recursive: true });
      await fs.writeFile(
        generatedFile,
        buildMinimalAgentProcessSource(),
        "utf8",
      );

      (discoverHarnesses as Mock).mockResolvedValue([
        makeDiscoveryResult({ name: "oh-my-pi" }),
      ]);

      let phase2PromptCount = 0;
      vi.mocked(createPiSession)
        .mockImplementationOnce((options?: { customTools?: Array<Record<string, unknown>> }) => {
          const tools = options?.customTools ?? [];
          const reportProcess = tools.find((tool) => tool.name === "babysitter_report_process_definition") as {
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
              return "mock-session-id-phase1";
            },
            get isInitialized() {
              return true;
            },
            prompt: vi.fn(async () => {
              await reportProcess?.execute?.("tool-process", {
                processPath: generatedFile,
                summary: "Generated process",
              });
              return { success: true, output: "phase1", exitCode: 0, duration: 1 };
            }),
          };
        })
        .mockImplementationOnce((options?: { customTools?: Array<Record<string, unknown>> }) => {
          const tools = options?.customTools ?? [];
          const runCreate = tools.find((tool) => tool.name === "babysitter_run_create") as {
            execute?: (toolCallId: string, params: Record<string, unknown>) => Promise<{ details?: unknown }>;
          } | undefined;
          const bindSession = tools.find((tool) => tool.name === "babysitter_bind_session") as {
            execute?: (toolCallId: string, params: Record<string, unknown>) => Promise<{ details?: unknown }>;
          } | undefined;
          const runIterate = tools.find((tool) => tool.name === "babysitter_run_iterate") as {
            execute?: (toolCallId: string, params: Record<string, unknown>) => Promise<{ details?: unknown }>;
          } | undefined;
          const finish = tools.find((tool) => tool.name === "babysitter_finish_orchestration") as {
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
              return "mock-session-id-phase2";
            },
            get isInitialized() {
              return true;
            },
            prompt: vi.fn(async () => {
              phase2PromptCount += 1;
              if (phase2PromptCount === 1) {
                await runCreate?.execute?.("tool-run-create", {
                  prompt: [
                    `Process path: ${generatedFile}`,
                    "User prompt: create a game",
                    "Maximum iterations: 256",
                  ].join("\n"),
                });
                return {
                  success: false,
                  output: "msg.content.filter is not a function",
                  exitCode: 1,
                  duration: 1,
                };
              }
              if (phase2PromptCount === 2) {
                await bindSession?.execute?.("tool-bind-session", {});
                return { success: true, output: "bootstrap recovered", exitCode: 0, duration: 1 };
              }
              if (phase2PromptCount >= 3) {
                await runIterate?.execute?.("tool-run-iterate", {});
                await finish?.execute?.("tool-finish", { summary: "done" });
                return { success: true, output: "iteration complete", exitCode: 0, duration: 1 };
              }
              return { success: true, output: "noop", exitCode: 0, duration: 1 };
            }),
          };
        });

      (createRun as Mock).mockResolvedValue({
        runId: "run-phase2-late-failure",
        runDir: "/tmp/runs/run-phase2-late-failure",
        metadata: {},
      });
      (orchestrateIteration as Mock).mockResolvedValue({
        status: "completed",
        output: "done",
      });

      const code = await handleHarnessCreateRun({
        prompt: "create a game",
        workspace,
        runsDir: "/tmp/runs",
        json: false,
        verbose: false,
        interactive: false,
      });

      expect(code).toBe(0);
      expect(createRun).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: "create a game",
          inputs: { prompt: "create a game" },
        }),
      );
      expect(phase2PromptCount).toBe(3);
    });

    it("fails phase 2 when pi returns the known post-turn failure before any progress", async () => {
      const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "session-create-phase2-host-fallback-"));
      tempDirs.push(workspace);
      const generatedPath = path.join(workspace, ".a5c", "processes");
      const generatedFile = path.join(generatedPath, "test-process.mjs");
      await fs.mkdir(generatedPath, { recursive: true });
      await fs.writeFile(
        generatedFile,
        buildMinimalAgentProcessSource(),
        "utf8",
      );

      (discoverHarnesses as Mock).mockResolvedValue([
        makeDiscoveryResult({ name: "oh-my-pi" }),
      ]);

      vi.mocked(createPiSession)
        .mockImplementationOnce((options?: { customTools?: Array<Record<string, unknown>> }) => {
          const tools = options?.customTools ?? [];
          const reportProcess = tools.find((tool) => tool.name === "babysitter_report_process_definition") as {
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
              return "mock-session-id-phase1";
            },
            get isInitialized() {
              return true;
            },
            prompt: vi.fn(async () => {
              await reportProcess?.execute?.("tool-process", {
                processPath: generatedFile,
                summary: "Generated process",
              });
              return { success: true, output: "phase1", exitCode: 0, duration: 1 };
            }),
          };
        })
        .mockImplementationOnce(() => ({
          initialize: vi.fn().mockResolvedValue(undefined),
          subscribe: vi.fn(() => () => {}),
          dispose: vi.fn(),
          executeBash: vi.fn(async () => ({
            output: "ok",
            exitCode: 0,
            cancelled: false,
          })),
          get sessionId() {
            return "mock-session-id-phase2";
          },
          get isInitialized() {
            return true;
          },
          prompt: vi.fn(async () => ({
            success: false,
            output: "msg.content.filter is not a function",
            exitCode: 1,
            duration: 1,
          })),
        }));

      (createRun as Mock).mockResolvedValue({
        runId: "run-phase2-host-fallback",
        runDir: "/tmp/runs/run-phase2-host-fallback",
        metadata: {},
      });
      (orchestrateIteration as Mock).mockResolvedValue({
        status: "completed",
        output: "done",
      });

      const code = await handleHarnessCreateRun({
        prompt: "create a game",
        workspace,
        runsDir: "/tmp/runs",
        json: false,
        verbose: false,
        interactive: false,
      });

      expect(code).toBe(1);
      expect(createRun).not.toHaveBeenCalled();
      expect(orchestrateIteration).not.toHaveBeenCalled();
    });
  });

  describe("Phase 1: process-definition recovery", () => {
    it("continues when the phase-1 tool report succeeds before pi returns a late prompt failure", async () => {
      const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "session-create-phase1-late-failure-"));
      tempDirs.push(workspace);
      const generatedPath = path.join(workspace, ".a5c", "processes");
      const generatedFile = path.join(generatedPath, "test-process.mjs");
      await fs.mkdir(generatedPath, { recursive: true });
      await fs.writeFile(
        generatedFile,
        buildMinimalAgentProcessSource(),
        "utf8",
      );

      (discoverHarnesses as Mock).mockResolvedValue([
        makeDiscoveryResult({ name: "oh-my-pi" }),
      ]);
      vi.mocked(createPiSession).mockImplementationOnce((options?: { customTools?: Array<Record<string, unknown>> }) => {
        const tools = options?.customTools ?? [];
        const reportProcess = tools.find((tool) => tool.name === "babysitter_report_process_definition") as {
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
            return "mock-session-id-phase1-late-failure";
          },
          get isInitialized() {
            return true;
          },
          prompt: vi.fn(async () => {
            await reportProcess?.execute?.("tool-process", {
              processPath: generatedFile,
              summary: "Generated process before prompt failure",
            });
            return {
              success: false,
              output: "msg.content.filter is not a function",
              exitCode: 1,
              duration: 1,
            };
          }),
        };
      });
      (createRun as Mock).mockResolvedValue({
        runId: "run-phase1-late-failure",
        runDir: "/tmp/runs/run-phase1-late-failure",
        metadata: {},
      });
      (orchestrateIteration as Mock).mockResolvedValue({
        status: "completed",
        output: "done",
      });

      const code = await handleHarnessCreateRun({
        prompt: "create a game",
        workspace,
        runsDir: "/tmp/runs",
        json: false,
        verbose: false,
        interactive: false,
      });

      expect(code).toBe(0);
      expect(existsSync(generatedFile)).toBe(true);
      expect(createRun).toHaveBeenCalled();
    });

    it("retries a transient phase-1 PI service failure before failing the command", async () => {
      const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "session-create-phase1-transient-retry-"));
      tempDirs.push(workspace);
      const generatedPath = path.join(workspace, ".a5c", "processes");
      const generatedFile = path.join(generatedPath, "test-process.mjs");
      let promptCount = 0;

      (discoverHarnesses as Mock).mockResolvedValue([
        makeDiscoveryResult({ name: "pi" }),
      ]);
      (createRun as Mock).mockResolvedValue({
        runId: "run-phase1-transient-retry",
        runDir: "/tmp/runs/run-phase1-transient-retry",
        metadata: {},
      });
      (orchestrateIteration as Mock).mockResolvedValue({
        status: "completed",
        output: "done",
      });

      vi.mocked(createPiSession).mockImplementationOnce((options?: { customTools?: Array<Record<string, unknown>> }) => {
        const tools = options?.customTools ?? [];
        const reportProcess = tools.find((tool) => tool.name === "babysitter_report_process_definition") as {
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
            return "mock-session-id-phase1-transient-retry";
          },
          get isInitialized() {
            return true;
          },
          prompt: vi.fn(async () => {
            promptCount += 1;
            if (promptCount === 1) {
              return {
                success: false,
                output: "The server had an error processing your request. Sorry about that! You can retry your request.",
                exitCode: 1,
                duration: 1,
              };
            }

            await fs.mkdir(generatedPath, { recursive: true });
            await fs.writeFile(generatedFile, buildMinimalAgentProcessSource(), "utf8");
            await reportProcess?.execute?.("tool-report-transient-retry", {
              processPath: generatedFile,
              summary: "Generated process after transient retry",
            });
            return { success: true, output: "phase1-success", exitCode: 0, duration: 1 };
          }),
        };
      });

      const code = await handleHarnessCreateRun({
        prompt: "create a game",
        workspace,
        runsDir: "/tmp/runs",
        json: false,
        verbose: false,
        interactive: false,
      });

      expect(code).toBe(0);
      expect(promptCount).toBe(2);
      expect(existsSync(generatedFile)).toBe(true);
    });

    it("recovers by writing a process code block returned by the phase-1 agent when the tool report is missing", async () => {
      const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "session-create-phase1-"));
      tempDirs.push(workspace);

      const accessMock = vi.mocked((await import("node:fs")).promises.access);
      accessMock.mockImplementation(async (targetPath) => {
        if (!existsSync(String(targetPath))) {
          const error = Object.assign(new Error(`ENOENT: ${String(targetPath)}`), {
            code: "ENOENT",
          });
          throw error;
        }
      });

      (discoverHarnesses as Mock).mockResolvedValue([
        makeDiscoveryResult({ name: "pi" }),
      ]);
      (createRun as Mock).mockResolvedValue({
        runId: "run-fallback",
        runDir: path.join(workspace, ".a5c", "runs", "run-fallback"),
        metadata: {},
      });
      (orchestrateIteration as Mock).mockResolvedValue({
        status: "completed",
        output: "done",
      });

      vi.mocked(createPiSession).mockImplementationOnce(() => ({
        initialize: vi.fn().mockResolvedValue(undefined),
        subscribe: vi.fn(() => () => {}),
        dispose: vi.fn(),
        executeBash: vi.fn(async () => ({
          output: "",
          exitCode: 0,
          cancelled: false,
        })),
        get sessionId() {
          return "mock-session-id-phase1";
        },
        get isInitialized() {
          return true;
        },
        prompt: vi
          .fn()
          .mockResolvedValueOnce({
            success: true,
            output: "I analyzed the request and drafted the process approach in plain text.",
            exitCode: 0,
            duration: 1,
          })
          .mockResolvedValueOnce({
            success: true,
            output: [
              "```javascript",
              'import { defineTask } from "@a5c-ai/babysitter-sdk";',
              "",
              'const buildGameTask = defineTask("build-game", (args, taskCtx) => ({',
              '  kind: "agent",',
              '  title: "Build the requested game",',
              '  agent: {',
              '    name: "general-purpose",',
              '    prompt: {',
              '      role: "Game developer",',
              '      task: "Create the requested game in the repository.",',
              '      context: { request: args.request },',
              '      instructions: ["Inspect the repo", "Implement the game", "Summarize the result"],',
              '      outputFormat: "JSON",',
              '    },',
              '    outputSchema: { type: "object", required: ["summary"] },',
              '  },',
              '  io: {',
              '    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,',
              '    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,',
              '  },',
              "}));",
              "",
              "export async function process(inputs, ctx) {",
              '  return ctx.task(buildGameTask, { request: inputs.userPrompt ?? "create a game" });',
              "}",
              "```",
            ].join("\n"),
            exitCode: 0,
            duration: 1,
          }),
      }));

      const code = await handleHarnessCreateRun({
        prompt: "create a game",
        workspace,
        runsDir: path.join(workspace, ".a5c", "runs"),
        json: false,
        verbose: false,
        interactive: false,
      });

      expect(code).toBe(0);
      const generatedPath = path.join(workspace, ".a5c", "processes");
      expect(existsSync(generatedPath)).toBe(true);
      const entries = await fs.readdir(generatedPath);
      const processFiles = entries.filter((e) => /\.m?js$/.test(e));
      expect(processFiles.length).toBeGreaterThan(0);
      const source = await fs.readFile(path.join(generatedPath, processFiles[0]!), "utf8");
      expect(source).toContain('export async function process');
      expect(source).toContain('defineTask("build-game"');
    });

    it("repairs an invalid reported process export before moving to phase 2", async () => {
      const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "session-create-phase1-conformance-"));
      tempDirs.push(workspace);
      const generatedPath = path.join(workspace, ".a5c", "processes");
      const generatedFile = path.join(generatedPath, "test-process.mjs");
      let promptCount = 0;

      (discoverHarnesses as Mock).mockResolvedValue([
        makeDiscoveryResult({ name: "pi" }),
      ]);
      (createRun as Mock).mockResolvedValue({
        runId: "run-conformance-fix",
        runDir: "/tmp/runs/run-conformance-fix",
        metadata: {},
      });
      (orchestrateIteration as Mock).mockResolvedValue({
        status: "completed",
        output: "done",
      });

      vi.mocked(createPiSession).mockImplementationOnce((options?: { customTools?: Array<Record<string, unknown>> }) => {
        const tools = options?.customTools ?? [];
        const writeProcess = tools.find((tool) => tool.name === "babysitter_write_process_definition") as {
          execute?: (toolCallId: string, params: Record<string, unknown>) => Promise<{ details?: unknown }>;
        } | undefined;
        const reportProcess = tools.find((tool) => tool.name === "babysitter_report_process_definition") as {
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
          abort: vi.fn().mockResolvedValue(undefined),
          get sessionId() {
            return "mock-session-id-phase1-conformance";
          },
          get isInitialized() {
            return true;
          },
          get isStreaming() {
            return false;
          },
          prompt: vi.fn(async (prompt: string) => {
            promptCount += 1;
            if (promptCount === 1) {
              await writeProcess?.execute?.("tool-write-invalid", {
                filename: "test-process.mjs",
                source: 'export default { name: "bad-process", tasks: [] };\n',
              });
              await reportProcess?.execute?.("tool-report-invalid", {
                processPath: generatedFile,
                summary: "Generated process",
              });
              return { success: true, output: "phase1-invalid", exitCode: 0, duration: 1 };
            }

            expect(prompt).toContain("Repair the generated babysitter process file");
            expect(prompt).toContain("named `async function process(inputs, ctx)`");
            expect(prompt).not.toContain("export default async function process");
            await writeProcess?.execute?.("tool-write-valid", {
              filename: "test-process.mjs",
              source: buildMinimalAgentProcessSource(),
            });
            await reportProcess?.execute?.("tool-report-valid", {
              processPath: generatedFile,
              summary: "Repaired process",
            });
            return { success: true, output: "phase1-repaired", exitCode: 0, duration: 1 };
          }),
        };
      });

      const code = await handleHarnessCreateRun({
        prompt: "create a game",
        workspace,
        runsDir: "/tmp/runs",
        json: false,
        verbose: false,
        interactive: false,
      });

      expect(code).toBe(0);
      expect(promptCount).toBe(2);
      const source = await fs.readFile(generatedFile, "utf8");
      expect(source).toContain("export async function process");
    });

    it("rejects a default-exported process and repairs it to a named process export", async () => {
      const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "session-create-phase1-default-export-"));
      tempDirs.push(workspace);
      const generatedPath = path.join(workspace, ".a5c", "processes");
      const generatedFile = path.join(generatedPath, "test-process.mjs");
      let promptCount = 0;

      (discoverHarnesses as Mock).mockResolvedValue([
        makeDiscoveryResult({ name: "pi" }),
      ]);
      (createRun as Mock).mockResolvedValue({
        runId: "run-default-export-fix",
        runDir: "/tmp/runs/run-default-export-fix",
        metadata: {},
      });
      (orchestrateIteration as Mock).mockResolvedValue({
        status: "completed",
        output: "done",
      });

      vi.mocked(createPiSession).mockImplementationOnce((options?: { customTools?: Array<Record<string, unknown>> }) => {
        const tools = options?.customTools ?? [];
        const writeProcess = tools.find((tool) => tool.name === "babysitter_write_process_definition") as {
          execute?: (toolCallId: string, params: Record<string, unknown>) => Promise<{ details?: unknown }>;
        } | undefined;
        const reportProcess = tools.find((tool) => tool.name === "babysitter_report_process_definition") as {
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
          abort: vi.fn().mockResolvedValue(undefined),
          get sessionId() {
            return "mock-session-id-phase1-default-export";
          },
          get isInitialized() {
            return true;
          },
          get isStreaming() {
            return false;
          },
          prompt: vi.fn(async (prompt: string) => {
            promptCount += 1;
            if (promptCount === 1) {
              await writeProcess?.execute?.("tool-write-default-export", {
                filename: "test-process.mjs",
                source: 'export default async function process() { return { success: true }; }\n',
              });
              await reportProcess?.execute?.("tool-report-default-export", {
                processPath: generatedFile,
                summary: "Generated default-exported process",
              });
              return { success: true, output: "phase1-default-export", exitCode: 0, duration: 1 };
            }

            expect(prompt).toContain("does not export a function named 'process'");
            expect(prompt).toContain("named `async function process(inputs, ctx)`");
            await writeProcess?.execute?.("tool-write-named-export", {
              filename: "test-process.mjs",
              source: buildMinimalAgentProcessSource(),
            });
            await reportProcess?.execute?.("tool-report-named-export", {
              processPath: generatedFile,
              summary: "Repaired named process export",
            });
            return { success: true, output: "phase1-repaired", exitCode: 0, duration: 1 };
          }),
        };
      });

      const code = await handleHarnessCreateRun({
        prompt: "create a game",
        workspace,
        runsDir: "/tmp/runs",
        json: false,
        verbose: false,
        interactive: false,
      });

      expect(code).toBe(0);
      expect(promptCount).toBe(2);
      const source = await fs.readFile(generatedFile, "utf8");
      expect(source).toContain("export async function process");
      expect(source).not.toContain("export default async function process");
    });

    it("repairs a named process export that incorrectly references process.cwd()", async () => {
      const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "session-create-phase1-process-shadow-"));
      tempDirs.push(workspace);
      const generatedPath = path.join(workspace, ".a5c", "processes");
      const generatedFile = path.join(generatedPath, "test-process.mjs");
      let promptCount = 0;

      (discoverHarnesses as Mock).mockResolvedValue([
        makeDiscoveryResult({ name: "pi" }),
      ]);
      (createRun as Mock).mockResolvedValue({
        runId: "run-process-shadow-fix",
        runDir: "/tmp/runs/run-process-shadow-fix",
        metadata: {},
      });
      (orchestrateIteration as Mock).mockResolvedValue({
        status: "completed",
        output: "done",
      });

      vi.mocked(createPiSession).mockImplementationOnce((options?: { customTools?: Array<Record<string, unknown>> }) => {
        const tools = options?.customTools ?? [];
        const writeProcess = tools.find((tool) => tool.name === "babysitter_write_process_definition") as {
          execute?: (toolCallId: string, params: Record<string, unknown>) => Promise<{ details?: unknown }>;
        } | undefined;
        const reportProcess = tools.find((tool) => tool.name === "babysitter_report_process_definition") as {
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
          abort: vi.fn().mockResolvedValue(undefined),
          get sessionId() {
            return "mock-session-id-phase1-process-shadow";
          },
          get isInitialized() {
            return true;
          },
          get isStreaming() {
            return false;
          },
          prompt: vi.fn(async (prompt: string) => {
            promptCount += 1;
            if (promptCount === 1) {
              await writeProcess?.execute?.("tool-write-process-shadow", {
                filename: "test-process.mjs",
                source: [
                  'export async function process(inputs, ctx) {',
                  '  const root = process.cwd();',
                  '  return { root };',
                  '}',
                  '',
                ].join("\n"),
              });
              await reportProcess?.execute?.("tool-report-process-shadow", {
                processPath: generatedFile,
                summary: "Generated named process export with process cwd lookup",
              });
              return { success: true, output: "phase1-process-shadow", exitCode: 0, duration: 1 };
            }

            expect(prompt).toContain("references `process.` inside the named 'process' export");
            expect(prompt).toContain("globalThis.process");
            expect(prompt).toContain("nodeProcess");
            await writeProcess?.execute?.("tool-write-process-shadow-fixed", {
              filename: "test-process.mjs",
              source: buildMinimalAgentProcessSource({
                processLines: [
                  '  const root = globalThis.process.cwd();',
                  '  return await ctx.task(mainTask, { root });',
                ],
              }),
            });
            await reportProcess?.execute?.("tool-report-process-shadow-fixed", {
              processPath: generatedFile,
              summary: "Repaired named process export to avoid global process shadowing",
            });
            return { success: true, output: "phase1-repaired", exitCode: 0, duration: 1 };
          }),
        };
      });

      const code = await handleHarnessCreateRun({
        prompt: "create a game",
        workspace,
        runsDir: "/tmp/runs",
        json: false,
        verbose: false,
        interactive: false,
      });

      expect(code).toBe(0);
      expect(promptCount).toBe(2);
      const source = await fs.readFile(generatedFile, "utf8");
      expect(source).toContain("export async function process");
      expect(source).toContain("globalThis.process.cwd()");
      expect(source).not.toContain("const root = process.cwd();");
    });

    it("repairs a process that assumes ctx.workspaceDir or ctx.cwd exists", async () => {
      const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "session-create-phase1-workspace-context-"));
      tempDirs.push(workspace);
      const generatedPath = path.join(workspace, ".a5c", "processes");
      const generatedFile = path.join(generatedPath, "test-process.mjs");
      let promptCount = 0;

      (discoverHarnesses as Mock).mockResolvedValue([
        makeDiscoveryResult({ name: "pi" }),
      ]);
      (createRun as Mock).mockResolvedValue({
        runId: "run-workspace-context-fix",
        runDir: "/tmp/runs/run-workspace-context-fix",
        metadata: {},
      });
      (orchestrateIteration as Mock).mockResolvedValue({
        status: "completed",
        output: "done",
      });

      vi.mocked(createPiSession).mockImplementationOnce((options?: { customTools?: Array<Record<string, unknown>> }) => {
        const tools = options?.customTools ?? [];
        const writeProcess = tools.find((tool) => tool.name === "babysitter_write_process_definition") as {
          execute?: (toolCallId: string, params: Record<string, unknown>) => Promise<{ details?: unknown }>;
        } | undefined;
        const reportProcess = tools.find((tool) => tool.name === "babysitter_report_process_definition") as {
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
          abort: vi.fn().mockResolvedValue(undefined),
          get sessionId() {
            return "mock-session-id-phase1-workspace-context";
          },
          get isInitialized() {
            return true;
          },
          get isStreaming() {
            return false;
          },
          prompt: vi.fn(async (prompt: string) => {
            promptCount += 1;
            if (promptCount === 1) {
              await writeProcess?.execute?.("tool-write-workspace-context", {
                filename: "test-process.mjs",
                source: [
                  'export async function process(inputs, ctx) {',
                  '  const root = ctx.workspaceDir || ctx.cwd;',
                  '  if (!root) throw new Error("missing root");',
                  '  return { root };',
                  '}',
                  '',
                ].join("\n"),
              });
              await reportProcess?.execute?.("tool-report-workspace-context", {
                processPath: generatedFile,
                summary: "Generated process that assumes runtime workspace paths exist",
              });
              return { success: true, output: "phase1-workspace-context", exitCode: 0, duration: 1 };
            }

            expect(prompt).toContain("assumes ctx.workspaceDir or ctx.cwd exists");
            expect(prompt).toContain("import.meta.url");
            expect(prompt).toContain("fileURLToPath");
            await writeProcess?.execute?.("tool-write-workspace-context-fixed", {
              filename: "test-process.mjs",
              source: buildMinimalAgentProcessSource({
                preludeLines: [
                  'import path from "node:path";',
                  'import { fileURLToPath } from "node:url";',
                  '',
                  'const workspaceDir = path.dirname(fileURLToPath(import.meta.url));',
                  '',
                ],
                processLines: [
                  '  return await ctx.task(mainTask, { root: workspaceDir });',
                ],
              }),
            });
            await reportProcess?.execute?.("tool-report-workspace-context-fixed", {
              processPath: generatedFile,
              summary: "Repaired process to derive workspace from import.meta.url",
            });
            return { success: true, output: "phase1-repaired", exitCode: 0, duration: 1 };
          }),
        };
      });

      const code = await handleHarnessCreateRun({
        prompt: "create a game",
        workspace,
        runsDir: "/tmp/runs",
        json: false,
        verbose: false,
        interactive: false,
      });

      expect(code).toBe(0);
      expect(promptCount).toBe(2);
      const source = await fs.readFile(generatedFile, "utf8");
      expect(source).toContain("fileURLToPath(import.meta.url)");
      expect(source).toContain("const workspaceDir = path.dirname");
      expect(source).not.toContain("ctx.workspaceDir || ctx.cwd");
    });

    it("repairs a syntactically invalid process that embeds raw nested template literals", async () => {
      const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "session-create-phase1-syntax-error-"));
      tempDirs.push(workspace);
      const generatedPath = path.join(workspace, ".a5c", "processes");
      const generatedFile = path.join(generatedPath, "test-process.mjs");
      let promptCount = 0;

      (discoverHarnesses as Mock).mockResolvedValue([
        makeDiscoveryResult({ name: "pi" }),
      ]);
      (createRun as Mock).mockResolvedValue({
        runId: "run-syntax-error-fix",
        runDir: "/tmp/runs/run-syntax-error-fix",
        metadata: {},
      });
      (orchestrateIteration as Mock).mockResolvedValue({
        status: "completed",
        output: "done",
      });

      vi.mocked(createPiSession).mockImplementationOnce((options?: { customTools?: Array<Record<string, unknown>> }) => {
        const tools = options?.customTools ?? [];
        const writeProcess = tools.find((tool) => tool.name === "babysitter_write_process_definition") as {
          execute?: (toolCallId: string, params: Record<string, unknown>) => Promise<{ details?: unknown }>;
        } | undefined;
        const reportProcess = tools.find((tool) => tool.name === "babysitter_report_process_definition") as {
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
          abort: vi.fn().mockResolvedValue(undefined),
          get sessionId() {
            return "mock-session-id-phase1-syntax-error";
          },
          get isInitialized() {
            return true;
          },
          get isStreaming() {
            return false;
          },
          prompt: vi.fn(async (prompt: string) => {
            promptCount += 1;
            if (promptCount === 1) {
              await writeProcess?.execute?.("tool-write-syntax-error", {
                filename: "test-process.mjs",
                source: [
                  "export async function process(inputs, ctx) {",
                  "  const embeddedScript = `",
                  "const view = `",
                  "<div class=\"card\">Hello</div>",
                  "`;",
                  "  `;",
                  "  return { embeddedScript };",
                  "}",
                  "",
                ].join("\n"),
              });
              await reportProcess?.execute?.("tool-report-syntax-error", {
                processPath: generatedFile,
                summary: "Generated process with nested template literal syntax bug",
              });
              return { success: true, output: "phase1-syntax-error", exitCode: 0, duration: 1 };
            }

            expect(prompt).toContain("failed `node --check`");
            expect(prompt).toContain("Unexpected token 'class'");
            expect(prompt).toContain("raw nested template literals");
            expect(prompt).toContain("String.raw");
            await writeProcess?.execute?.("tool-write-syntax-error-fixed", {
              filename: "test-process.mjs",
              source: buildMinimalAgentProcessSource({
                processLines: [
                  "  const embeddedScript = [",
                  "    \"const view = `<div class=\\\"card\\\">Hello</div>`;\",",
                  "  ].join(\"\\n\");",
                  "  return await ctx.task(mainTask, { embeddedScript });",
                ],
              }),
            });
            await reportProcess?.execute?.("tool-report-syntax-error-fixed", {
              processPath: generatedFile,
              summary: "Repaired process to avoid nested template literal syntax bugs",
            });
            return { success: true, output: "phase1-repaired", exitCode: 0, duration: 1 };
          }),
        };
      });

      const code = await handleHarnessCreateRun({
        prompt: "create a game",
        workspace,
        runsDir: "/tmp/runs",
        json: false,
        verbose: false,
        interactive: false,
      });

      expect(code).toBe(0);
      expect(promptCount).toBe(2);
      const source = await fs.readFile(generatedFile, "utf8");
      expect(source).toContain('].join("\\n")');
      expect(source).not.toContain("const embeddedScript = `");
    });

    it("repairs a direct process that does not define any babysitter tasks", async () => {
      const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "session-create-phase1-no-tasks-"));
      tempDirs.push(workspace);
      const generatedPath = path.join(workspace, ".a5c", "processes");
      const generatedFile = path.join(generatedPath, "test-process.mjs");
      let promptCount = 0;

      (discoverHarnesses as Mock).mockResolvedValue([
        makeDiscoveryResult({ name: "pi" }),
      ]);
      (createRun as Mock).mockResolvedValue({
        runId: "run-no-tasks-fix",
        runDir: "/tmp/runs/run-no-tasks-fix",
        metadata: {},
      });
      (orchestrateIteration as Mock).mockResolvedValue({
        status: "completed",
        output: "done",
      });

      vi.mocked(createPiSession).mockImplementationOnce((options?: { customTools?: Array<Record<string, unknown>> }) => {
        const tools = options?.customTools ?? [];
        const writeProcess = tools.find((tool) => tool.name === "babysitter_write_process_definition") as {
          execute?: (toolCallId: string, params: Record<string, unknown>) => Promise<{ details?: unknown }>;
        } | undefined;
        const reportProcess = tools.find((tool) => tool.name === "babysitter_report_process_definition") as {
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
          abort: vi.fn().mockResolvedValue(undefined),
          get sessionId() {
            return "mock-session-id-phase1-no-tasks";
          },
          get isInitialized() {
            return true;
          },
          get isStreaming() {
            return false;
          },
          prompt: vi.fn(async (prompt: string) => {
            promptCount += 1;
            if (promptCount === 1) {
              await writeProcess?.execute?.("tool-write-no-tasks", {
                filename: "test-process.mjs",
                source: [
                  "export async function process(inputs, ctx) {",
                  "  return { ok: true };",
                  "}",
                  "",
                ].join("\n"),
              });
              await reportProcess?.execute?.("tool-report-no-tasks", {
                processPath: generatedFile,
                summary: "Generated direct process without babysitter tasks",
              });
              return { success: true, output: "phase1-no-tasks", exitCode: 0, duration: 1 };
            }

            expect(prompt).toContain("does not define any babysitter tasks via defineTask(...)");
            expect(prompt).toContain("orchestrate real work through defined tasks");
            expect(prompt).toContain('Define at least one `agent` task');
            await writeProcess?.execute?.("tool-write-no-tasks-fixed", {
              filename: "test-process.mjs",
              source: buildMinimalAgentProcessSource(),
            });
            await reportProcess?.execute?.("tool-report-no-tasks-fixed", {
              processPath: generatedFile,
              summary: "Repaired direct process into a task-orchestrating process",
            });
            return { success: true, output: "phase1-repaired", exitCode: 0, duration: 1 };
          }),
        };
      });

      const code = await handleHarnessCreateRun({
        prompt: "create a game",
        workspace,
        runsDir: "/tmp/runs",
        json: false,
        verbose: false,
        interactive: false,
      });

      expect(code).toBe(0);
      expect(promptCount).toBe(2);
      const source = await fs.readFile(generatedFile, "utf8");
      expect(source).toContain('defineTask("main-task"');
      expect(source).toContain("await ctx.task(mainTask, {})");
    });

    it("repairs task-orchestrating processes that never define an agent task", async () => {
      const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "session-create-phase1-no-agent-task-"));
      tempDirs.push(workspace);
      const generatedPath = path.join(workspace, ".a5c", "processes");
      const generatedFile = path.join(generatedPath, "test-process.mjs");
      let promptCount = 0;

      (discoverHarnesses as Mock).mockResolvedValue([
        makeDiscoveryResult({ name: "pi" }),
      ]);
      (createRun as Mock).mockResolvedValue({
        runId: "run-no-agent-task-fix",
        runDir: "/tmp/runs/run-no-agent-task-fix",
        metadata: {},
      });
      (orchestrateIteration as Mock).mockResolvedValue({
        status: "completed",
        output: "done",
      });

      vi.mocked(createPiSession).mockImplementationOnce((options?: { customTools?: Array<Record<string, unknown>> }) => {
        const tools = options?.customTools ?? [];
        const writeProcess = tools.find((tool) => tool.name === "babysitter_write_process_definition") as {
          execute?: (toolCallId: string, params: Record<string, unknown>) => Promise<{ details?: unknown }>;
        } | undefined;
        const reportProcess = tools.find((tool) => tool.name === "babysitter_report_process_definition") as {
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
          abort: vi.fn().mockResolvedValue(undefined),
          get sessionId() {
            return "mock-session-id-phase1-no-agent-task";
          },
          get isInitialized() {
            return true;
          },
          get isStreaming() {
            return false;
          },
          prompt: vi.fn(async (prompt: string) => {
            promptCount += 1;
            if (promptCount === 1) {
              await writeProcess?.execute?.("tool-write-no-agent-task", {
                filename: "test-process.mjs",
                source: [
                  'import { defineTask } from "@a5c-ai/babysitter-sdk";',
                  "",
                  'const verifyTask = defineTask("verify-task", () => ({',
                  '  kind: "shell",',
                  '  shell: { command: "echo hi" },',
                  "}));",
                  "",
                  "export async function process(inputs, ctx) {",
                  "  return await ctx.task(verifyTask, {});",
                  "}",
                  "",
                ].join("\n"),
              });
              await reportProcess?.execute?.("tool-report-no-agent-task", {
                processPath: generatedFile,
                summary: "Generated shell-only task process",
              });
              return { success: true, output: "phase1-no-agent-task", exitCode: 0, duration: 1 };
            }

            expect(prompt).toContain("does not define any agent tasks");
            expect(prompt).toContain('kind: "agent"');
            await writeProcess?.execute?.("tool-write-no-agent-task-fixed", {
              filename: "test-process.mjs",
              source: buildMinimalAgentProcessSource(),
            });
            await reportProcess?.execute?.("tool-report-no-agent-task-fixed", {
              processPath: generatedFile,
              summary: "Repaired process to include an agent task",
            });
            return { success: true, output: "phase1-repaired", exitCode: 0, duration: 1 };
          }),
        };
      });

      const code = await handleHarnessCreateRun({
        prompt: "create a game",
        workspace,
        runsDir: "/tmp/runs",
        json: false,
        verbose: false,
        interactive: false,
      });

      expect(code).toBe(0);
      expect(promptCount).toBe(2);
      const source = await fs.readFile(generatedFile, "utf8");
      expect(source).toContain('kind: "agent"');
      expect(source).toContain("await ctx.task(mainTask, {})");
    });

    it("repairs ctx.task calls that pass plain task objects instead of defineTask bindings", async () => {
      const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "session-create-phase1-plain-task-object-"));
      tempDirs.push(workspace);
      const generatedPath = path.join(workspace, ".a5c", "processes");
      const generatedFile = path.join(generatedPath, "test-process.mjs");
      let promptCount = 0;

      (discoverHarnesses as Mock).mockResolvedValue([
        makeDiscoveryResult({ name: "pi" }),
      ]);
      (createRun as Mock).mockResolvedValue({
        runId: "run-plain-task-object-fix",
        runDir: "/tmp/runs/run-plain-task-object-fix",
        metadata: {},
      });
      (orchestrateIteration as Mock).mockResolvedValue({
        status: "completed",
        output: "done",
      });

      vi.mocked(createPiSession).mockImplementationOnce((options?: { customTools?: Array<Record<string, unknown>> }) => {
        const tools = options?.customTools ?? [];
        const writeProcess = tools.find((tool) => tool.name === "babysitter_write_process_definition") as {
          execute?: (toolCallId: string, params: Record<string, unknown>) => Promise<{ details?: unknown }>;
        } | undefined;
        const reportProcess = tools.find((tool) => tool.name === "babysitter_report_process_definition") as {
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
          abort: vi.fn().mockResolvedValue(undefined),
          get sessionId() {
            return "mock-session-id-phase1-plain-task-object";
          },
          get isInitialized() {
            return true;
          },
          get isStreaming() {
            return false;
          },
          prompt: vi.fn(async (prompt: string) => {
            promptCount += 1;
            if (promptCount === 1) {
              await writeProcess?.execute?.("tool-write-plain-task-object", {
                filename: "test-process.mjs",
                source: [
                  "function defineTask(taskId, build) {",
                  "  return { taskId, build };",
                  "}",
                  "",
                  'const helperTask = defineTask("helper-task", () => ({',
                  '  kind: "agent",',
                  '  agent: { name: "general-purpose", prompt: { task: "Help.", instructions: [] }, outputSchema: { type: "object" } },',
                  "}));",
                  "",
                  "export async function process(inputs, ctx) {",
                  '  const verifyTask = { kind: "shell", shell: { command: "echo hi" } };',
                  "  await ctx.task(verifyTask, {});",
                  "  await ctx.task(helperTask, {});",
                  "  return { ok: true };",
                  "}",
                  "",
                ].join("\n"),
              });
              await reportProcess?.execute?.("tool-report-plain-task-object", {
                processPath: generatedFile,
                summary: "Generated process that passes a plain task object to ctx.task",
              });
              return { success: true, output: "phase1-plain-task-object", exitCode: 0, duration: 1 };
            }

            expect(prompt).toContain("calls ctx.task(...) with values that are not DefinedTask bindings");
            expect(prompt).toContain("verifyTask");
            expect(prompt).toContain("do not pass plain object task definitions");
            await writeProcess?.execute?.("tool-write-plain-task-object-fixed", {
              filename: "test-process.mjs",
              source: buildMinimalAgentProcessSource(),
            });
            await reportProcess?.execute?.("tool-report-plain-task-object-fixed", {
              processPath: generatedFile,
              summary: "Repaired process to use defineTask before ctx.task",
            });
            return { success: true, output: "phase1-repaired", exitCode: 0, duration: 1 };
          }),
        };
      });

      const code = await handleHarnessCreateRun({
        prompt: "create a game",
        workspace,
        runsDir: "/tmp/runs",
        json: false,
        verbose: false,
        interactive: false,
      });

      expect(code).toBe(0);
      expect(promptCount).toBe(2);
      const source = await fs.readFile(generatedFile, "utf8");
      expect(source).toContain('const mainTask = defineTask("main-task"');
      expect(source).toContain("await ctx.task(mainTask, {})");
      expect(source).not.toContain('const verifyTask = { kind: "shell"');
    });

    it("repairs defineTask outputs that omit their top-level kind", async () => {
      const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "session-create-phase1-missing-kind-"));
      tempDirs.push(workspace);
      const generatedPath = path.join(workspace, ".a5c", "processes");
      const generatedFile = path.join(generatedPath, "test-process.mjs");
      let promptCount = 0;

      (discoverHarnesses as Mock).mockResolvedValue([
        makeDiscoveryResult({ name: "pi" }),
      ]);
      (createRun as Mock).mockResolvedValue({
        runId: "run-missing-kind-fix",
        runDir: "/tmp/runs/run-missing-kind-fix",
        metadata: {},
      });
      (orchestrateIteration as Mock).mockResolvedValue({
        status: "completed",
        output: "done",
      });

      vi.mocked(createPiSession).mockImplementationOnce((options?: { customTools?: Array<Record<string, unknown>> }) => {
        const tools = options?.customTools ?? [];
        const writeProcess = tools.find((tool) => tool.name === "babysitter_write_process_definition") as {
          execute?: (toolCallId: string, params: Record<string, unknown>) => Promise<{ details?: unknown }>;
        } | undefined;
        const reportProcess = tools.find((tool) => tool.name === "babysitter_report_process_definition") as {
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
          abort: vi.fn().mockResolvedValue(undefined),
          get sessionId() {
            return "mock-session-id-phase1-missing-kind";
          },
          get isInitialized() {
            return true;
          },
          get isStreaming() {
            return false;
          },
          prompt: vi.fn(async (prompt: string) => {
            promptCount += 1;
            if (promptCount === 1) {
              await writeProcess?.execute?.("tool-write-missing-kind", {
                filename: "test-process.mjs",
                source: [
                  'import { defineTask } from "@a5c-ai/babysitter-sdk";',
                  '',
                  'const badAgentTask = defineTask("bad-agent", () => ({',
                  '  agent: {',
                  '    name: "general-purpose",',
                  '    prompt: { task: "Do the work.", instructions: [] },',
                  '    outputSchema: { type: "object" },',
                  '  },',
                  '}));',
                  '',
                  'export async function process(inputs, ctx) {',
                  '  return ctx.task(badAgentTask, {});',
                  '}',
                  '',
                ].join("\n"),
              });
              await reportProcess?.execute?.("tool-report-missing-kind", {
                processPath: generatedFile,
                summary: "Generated task definition without kind",
              });
              return { success: true, output: "phase1-missing-kind", exitCode: 0, duration: 1 };
            }

            expect(prompt).toContain("defines task(s) without a top-level kind");
            expect(prompt).toContain('kind: "agent"');
            expect(prompt).toContain("await ctx.task(definedTask, args)");
            await writeProcess?.execute?.("tool-write-missing-kind-fixed", {
              filename: "test-process.mjs",
              source: [
                'import { defineTask } from "@a5c-ai/babysitter-sdk";',
                '',
                'const goodAgentTask = defineTask("good-agent", () => ({',
                '  kind: "agent",',
                '  agent: {',
                '    name: "general-purpose",',
                '    prompt: { task: "Do the work.", instructions: [] },',
                '    outputSchema: { type: "object" },',
                '  },',
                '}));',
                '',
                'export async function process(inputs, ctx) {',
                '  return await ctx.task(goodAgentTask, {});',
                '}',
                '',
              ].join("\n"),
            });
            await reportProcess?.execute?.("tool-report-missing-kind-fixed", {
              processPath: generatedFile,
              summary: "Repaired task definition to include top-level kind",
            });
            return { success: true, output: "phase1-repaired", exitCode: 0, duration: 1 };
          }),
        };
      });

      const code = await handleHarnessCreateRun({
        prompt: "create a game",
        workspace,
        runsDir: "/tmp/runs",
        json: false,
        verbose: false,
        interactive: false,
      });

      expect(code).toBe(0);
      expect(promptCount).toBe(2);
      const source = await fs.readFile(generatedFile, "utf8");
      expect(source).toContain('kind: "agent"');
      expect(source).toContain("await ctx.task(goodAgentTask, {})");
      expect(source).not.toContain("const badAgentTask");
    });

    it("does not infer a node-kind mismatch from quoted node: specifiers inside task strings", async () => {
      const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "session-create-phase1-node-specifier-"));
      tempDirs.push(workspace);
      const generatedPath = path.join(workspace, ".a5c", "processes");
      const generatedFile = path.join(generatedPath, "test-process.mjs");
      let promptCount = 0;

      (discoverHarnesses as Mock).mockResolvedValue([
        makeDiscoveryResult({ name: "pi" }),
      ]);
      (createRun as Mock).mockResolvedValue({
        runId: "run-node-specifier-fix",
        runDir: "/tmp/runs/run-node-specifier-fix",
        metadata: {},
      });
      (orchestrateIteration as Mock).mockResolvedValue({
        status: "completed",
        output: "done",
      });

      vi.mocked(createPiSession).mockImplementationOnce((options?: { customTools?: Array<Record<string, unknown>> }) => {
        const tools = options?.customTools ?? [];
        const writeProcess = tools.find((tool) => tool.name === "babysitter_write_process_definition") as {
          execute?: (toolCallId: string, params: Record<string, unknown>) => Promise<{ details?: unknown }>;
        } | undefined;
        const reportProcess = tools.find((tool) => tool.name === "babysitter_report_process_definition") as {
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
          abort: vi.fn().mockResolvedValue(undefined),
          get sessionId() {
            return "mock-session-id-phase1-node-specifier";
          },
          get isInitialized() {
            return true;
          },
          get isStreaming() {
            return false;
          },
          prompt: vi.fn(async (prompt: string) => {
            promptCount += 1;
            if (promptCount > 1) {
              throw new Error(`unexpected repair prompt: ${prompt}`);
            }

            await writeProcess?.execute?.("tool-write-node-specifier", {
              filename: "test-process.mjs",
              source: [
                'import { defineTask } from "@a5c-ai/babysitter-sdk";',
                "",
                'const mainTask = defineTask("main-task", () => ({',
                '  kind: "agent",',
                '  agent: {',
                '    name: "general-purpose",',
                '    prompt: {',
                '      task: "Create the game and mention node:fs in the notes.",',
                '      instructions: [],',
                "    },",
                '    outputSchema: { type: "object" },',
                "  },",
                "}));",
                "",
                'const verifyTask = defineTask("verify-task", () => ({',
                '  kind: "shell",',
                '  shell: { command: "node ./verify-game-files.mjs && echo node:fs" },',
                "}));",
                "",
                "export async function process(inputs, ctx) {",
                "  await ctx.task(mainTask, {});",
                "  return await ctx.task(verifyTask, {});",
                "}",
                "",
              ].join("\n"),
            });
            await reportProcess?.execute?.("tool-report-node-specifier", {
              processPath: generatedFile,
              summary: "Generated process with quoted node: specifiers inside task strings",
            });
            return { success: true, output: "phase1-node-specifier", exitCode: 0, duration: 1 };
          }),
        };
      });

      const code = await handleHarnessCreateRun({
        prompt: "create a game",
        workspace,
        runsDir: "/tmp/runs",
        json: false,
        verbose: false,
        interactive: false,
      });

      expect(code).toBe(0);
      expect(promptCount).toBe(1);
      const source = await fs.readFile(generatedFile, "utf8");
      expect(source).toContain('kind: "shell"');
      expect(source).toContain('echo node:fs');
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

      await handleHarnessCreateRun({
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

      const code = await handleHarnessCreateRun({
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

      const code = await handleHarnessCreateRun({
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
          toolsMode: "coding",
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
              shell: {
                command: "npm test",
              },
              metadata: {
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

      const code = await handleHarnessCreateRun({
        processPath: "/tmp/p.js",
        runsDir: "/tmp/runs",
        json: false,
        verbose: false,
        interactive: false,
      });

      expect(code).toBe(0);
      expect(createPiSession).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 1_800_000,
          toolsMode: "coding",
          bashSandbox: "secure",
          isolated: true,
          enableCompaction: true,
          ephemeral: true,
        }),
      );
    });

    it("uses the longer PI worker timeout for default internal agent execution", async () => {
      (discoverHarnesses as Mock).mockResolvedValue([
        makeDiscoveryResult({ name: "pi" }),
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
              effectId: "eff-agent",
              invocationKey: "key-agent",
              kind: "agent",
              taskDef: {
                kind: "agent",
                title: "Implement the requested work",
                agent: {
                  name: "builder",
                  prompt: "Do the work.",
                },
              },
            },
          ],
        })
        .mockResolvedValueOnce({
          status: "completed",
          output: "done",
        });
      (commitEffectResult as Mock).mockResolvedValue({});

      const code = await handleHarnessCreateRun({
        processPath: "/tmp/p.js",
        runsDir: "/tmp/runs",
        json: false,
        verbose: false,
        interactive: false,
      });

      expect(code).toBe(0);
      expect(createPiSession).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 1_800_000,
          toolsMode: "coding",
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

      const code = await handleHarnessCreateRun({
        processPath: "/tmp/p.js",
        runsDir: "/tmp/runs",
        json: false,
        verbose: false,
        interactive: false,
      });

      expect(code).toBe(0);
      // The default mock runs the full iteration loop in each prompt call.
      // Bootstrap prompt runs iterate once, then main loop prompt runs it again.
      expect(orchestrateIteration).toHaveBeenCalled();
    });

    it("retries a transient process-module load failure before failing the run", async () => {
      (discoverHarnesses as Mock).mockResolvedValue([
        makeDiscoveryResult({ name: "pi" }),
      ]);
      (createRun as Mock).mockResolvedValue({
        runId: "run-1",
        runDir: "/tmp/runs/run-1",
        metadata: {},
      });
      (orchestrateIteration as Mock)
        .mockRejectedValueOnce(new RunFailedError("Failed to load process module at /tmp/p.js"))
        .mockResolvedValueOnce({
          status: "completed",
          output: "done",
        })
        .mockResolvedValue({
          status: "completed",
          output: "done",
        });

      const code = await handleHarnessCreateRun({
        processPath: "/tmp/p.js",
        runsDir: "/tmp/runs",
        json: false,
        verbose: false,
        interactive: false,
      });

      expect(code).toBe(0);
      // At least 2 calls: the failed retry + the successful one
      expect((orchestrateIteration as Mock).mock.calls.length).toBeGreaterThanOrEqual(2);
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
        .mockResolvedValueOnce(completedResult)
        .mockResolvedValue(completedResult);
      (commitEffectResult as Mock).mockResolvedValue({});

      const code = await handleHarnessCreateRun({
        processPath: "/tmp/p.js",
        runsDir: "/tmp/runs",
        json: false,
        verbose: false,
        interactive: false,
      });

      expect(code).toBe(0);
      // At least 2 calls: the waiting result + the completed result
      expect((orchestrateIteration as Mock).mock.calls.length).toBeGreaterThanOrEqual(2);
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

    it("invokes an explicit task metadata harness for node-kind effects", async () => {
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
            taskDef: {
              kind: "node",
              title: "do something",
              metadata: {
                harness: "claude-code",
              },
            },
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

      const code = await handleHarnessCreateRun({
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

      const code = await handleHarnessCreateRun({
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

      const code = await handleHarnessCreateRun({
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

      await handleHarnessCreateRun({
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
    it("proceeds with internal programmatic API even when no CLI harness is installed", async () => {
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

      const code = await handleHarnessCreateRun({
        processPath: "/tmp/p.js",
        runsDir: "/tmp/runs",
        json: false,
        verbose: false,
        interactive: false,
      });

      // No CLI harness found, but harness:create-run proceeds using internal
      // programmatic API as the default — does not exit with error
      expect(code).toBe(0);
    });

    it("honors explicit --harness pi and uses CLI invocation (pi is non-programmatic)", async () => {
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
      (invokeHarness as Mock).mockResolvedValue(
        makeInvokeResult({ harness: "pi" }),
      );

      const code = await handleHarnessCreateRun({
        processPath: "/tmp/p.js",
        runsDir: "/tmp/runs",
        harness: "pi",
        json: false,
        verbose: false,
        interactive: false,
      });

      expect(code).toBe(0);
      // pi is now non-programmatic (CLI-only), so it uses invokeHarness
      expect(invokeHarness).toHaveBeenCalled();
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
      const code = await handleHarnessCreateRun({
        runsDir: "/tmp/runs",
        json: false,
        verbose: false,
        interactive: false,
      });

      expect(code).toBe(1);
    });
  });
});
