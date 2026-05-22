/**
 * Tests for create-run command handler.
 */

import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from "vitest";
import { promises as fs, existsSync } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import type { HarnessDiscoveryResult, HarnessInvokeResult } from "../../../types";
import {
  type IterationResult,
  RunFailedError,
  __resetCacheForTests,
  __setAncestorResolverForTests,
  getSessionMarkerPath,
} from "@a5c-ai/babysitter-sdk";
import * as taskStore from "../../../../tasks";
import * as resumeState from "../resumeState";

// ── Mocks ─────────────────────────────────────────────────────────────

vi.mock("@a5c-ai/babysitter-sdk", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@a5c-ai/babysitter-sdk")>();
  return {
    ...actual,
    discoverHarnesses: vi.fn(),
    detectCallerHarness: vi.fn(() => null),
    createRun: vi.fn(),
    orchestrateIteration: vi.fn(),
    commitEffectResult: vi.fn(),
  };
});

vi.mock("../../../invoker", () => ({
  invokeHarness: vi.fn(),
}));

vi.mock("../../../../interaction", async () => {
  const actual = await vi.importActual<typeof import("../../../../interaction")>("../../../../interaction");
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

vi.mock("@a5c-ai/agent-mux-core", () => {
  const workspaces: Array<{
    workspaceDefaultCwd: string;
    workspaceRootPath: string;
    workspaceMode: string;
    repo: {
      sourcePath: string;
      targetPath: string;
      mode: string;
      alias: string;
      branch: null;
    };
  }> = [];

  class MockWorkspaceService {
    async createWorkspace(args: { name: string; repos: Array<{ path: string }>; mode: string }) {
      const repoPath = args.repos[0]?.path ?? process.cwd();
      const workspace = {
        id: "workspace-1",
        name: args.name,
        mode: args.mode,
        cwd: path.join(repoPath, ".amux-workspace"),
        workspaceDefaultCwd: path.join(repoPath, ".amux-workspace"),
        workspaceRootPath: path.join(repoPath, ".amux-workspace"),
        repos: args.repos,
        repo: {
          sourcePath: repoPath,
          targetPath: path.join(repoPath, ".amux-workspace"),
          mode: args.mode,
          alias: path.basename(repoPath),
          branch: null,
        },
      };
      workspaces.push({
        workspaceDefaultCwd: workspace.workspaceDefaultCwd,
        workspaceRootPath: workspace.workspaceRootPath,
        workspaceMode: args.mode,
        repo: workspace.repo,
      });
      return workspace;
    }

    async resolveSessionContext(args: { cwd: string }) {
      const currentPath = path.resolve(args.cwd);
      const match = workspaces.find((workspace) =>
        currentPath === workspace.workspaceDefaultCwd ||
        currentPath.startsWith(`${workspace.workspaceDefaultCwd}${path.sep}`),
      );
      if (!match) {
        return null;
      }
      return {
        currentPath,
        workspaceDefaultCwd: match.workspaceDefaultCwd,
        workspaceRootPath: match.workspaceRootPath,
        workspaceMode: match.workspaceMode,
        repo: match.repo,
      };
    }
  }

  return {
    WorkspaceService: MockWorkspaceService,
    resolveWorkspaceDefaultCwd: (workspace: { cwd?: string }) =>
      workspace.cwd ?? process.cwd(),
  };
});

vi.mock("@a5c-ai/agent-core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@a5c-ai/agent-core")>();
  let sessionCounter = 0;
  const createAgentCoreSession = vi.fn((options?: { customTools?: Array<Record<string, unknown>>; workspace?: string }) => {
    sessionCounter += 1;
    const sessionId = `mock-session-id-${sessionCounter}`;
    const tools = options?.customTools ?? [];
    let promptCount = 0;
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
          promptCount += 1;
          const reportProcess = getTool("babysitter_report_process_definition");
          if (reportProcess?.execute) {
            if (promptCount === 1) {
              return { success: true, output: "phaseUnderstandIntent", exitCode: 0, duration: 1 };
            }
            const writeProcess = getTool("write");
            if (writeProcess?.execute) {
              await writeProcess.execute("tool-write", {
                path: ".a5c/processes/generated-process.mjs",
                content: 'function defineTask(id, build) { return { id, build }; }\nconst t = defineTask("t", () => ({ kind: "agent", agent: { name: "a", prompt: { task: "x" }, outputSchema: { type: "object" } } }));\nexport async function process(inputs, ctx) { return await ctx.task(t, {}); }',
              });
            }
            const resolvedProcessPath = path.resolve(options?.workspace ?? process.cwd(), ".a5c/processes/generated-process.mjs");
            await reportProcess.execute("tool-process", {
              processPath: resolvedProcessPath,
              summary: "Generated process",
            });
            return { success: true, output: "phasePlanProcess", exitCode: 0, duration: 1 };
          }

        const runIterate = getTool("babysitter_run_iterate");
        const taskPost = getTool("babysitter_task_post_result");
        const taskTool = getTool("task");
        const askTool = getTool("AskUserQuestion");
        const finish = getTool("babysitter_finish_orchestration");

        if (runIterate?.execute) {
          while (true) {
            const iterationResult = await runIterate?.execute?.("tool-iterate", {});
            const details = iterationResult?.details as Record<string, unknown> | undefined;
            const status = details?.status as string | undefined;
            if (status === "waiting") {
              const nextActions = (details?.nextActions as Array<Record<string, unknown>> | undefined) ?? [];
              for (const action of nextActions) {
                const effectId = String(action.effectId);
                if (action.kind === "breakpoint") {
                  await askTool?.execute?.("tool-ask-breakpoint", {
                    mode: "structured",
                    questions: [{
                      id: "decision",
                      question: "Approve?",
                      options: [{ label: "Approve" }, { label: "Reject" }],
                      recommended: 0,
                    }],
                  });
                  await taskPost?.execute?.("tool-post-breakpoint", { effectId });
                } else if (action.kind === "shell" || action.kind === "sleep") {
                  await taskPost?.execute?.("tool-post-shell", {
                    effectId,
                    status: "ok",
                    valueText: "ok",
                    stdout: "ok",
                  });
                } else {
                  const taskResult = await taskTool?.execute?.("tool-task-effect", {
                    task: String(action.taskDef?.title ?? action.taskId ?? effectId),
                    harness: action.taskDef?.metadata?.harness,
                  });
                  const taskDetails = taskResult?.details as Record<string, unknown> | undefined;
                  await taskPost?.execute?.("tool-post-effect", {
                    effectId,
                    status: taskDetails?.success === false ? "error" : "ok",
                    valueText: typeof taskDetails?.output === "string" ? taskDetails.output : "done",
                    error: taskDetails?.success === false ? String(taskDetails.output ?? "failed") : undefined,
                    stdout: typeof taskDetails?.output === "string" ? taskDetails.output : undefined,
                  });
                }
              }
              continue;
            }
            break;
          }

          await finish?.execute?.("tool-finish", { summary: "done" });
        }

        return { success: true, output: "orchestration", exitCode: 0, duration: 1 };
      }),
    };
  });

  return {
    ...actual,
    createAgentCoreSession,
    AgentCoreSessionHandle: class {},
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

import { handleHarnessCreateRun, selectHarness } from "..";
import { ensureRunAndMaybeBindFromProcessDefinition } from "../planProcess/runState";
import {
  discoverHarnesses,
  detectCallerHarness,
  createRun,
  orchestrateIteration,
  commitEffectResult,
} from "@a5c-ai/babysitter-sdk";
import { WorkspaceService, resolveWorkspaceDefaultCwd } from "@a5c-ai/agent-mux-core";
import { invokeHarness } from "../../../invoker";
import { createAgentCoreSession } from "@a5c-ai/agent-core";
import { getSessionContext } from "../../../../session/context";

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

function getCompatTool(
  tools: Array<Record<string, unknown>>,
  name: string,
): {
  execute?: (toolCallId: string, params: Record<string, unknown>) => Promise<{ details?: unknown }>;
} | undefined {
  const direct = tools.find((tool) => tool.name === name) as {
    execute?: (toolCallId: string, params: Record<string, unknown>) => Promise<{ details?: unknown }>;
  } | undefined;
  if (direct) {
    return direct;
  }
  return undefined;
}

function getProcessWriteTool(
  tools: Array<Record<string, unknown>>,
): {
  execute?: (toolCallId: string, params: Record<string, unknown>) => Promise<{ details?: unknown }>;
} | undefined {
  const writeTool = tools.find((tool) => tool.name === "write") as {
    execute?: (toolCallId: string, params: Record<string, unknown>) => Promise<{ details?: unknown }>;
  } | undefined;
  if (!writeTool?.execute) {
    return undefined;
  }
  return {
    execute: async (toolCallId: string, params: Record<string, unknown>) => {
      const filename = String(params.filename ?? "generated-process.mjs");
      return writeTool.execute?.(toolCallId, {
        path: path.join(".a5c", "processes", filename).replace(/\\/g, "/"),
        content: params.source,
      });
    },
  };
}

// ── Tests ─────────────────────────────────────────────────────────────

describe("selectHarness", () => {
  const harnesses: HarnessDiscoveryResult[] = [
    makeDiscoveryResult({ name: "agent-core" }),
    makeDiscoveryResult({ name: "oh-my-pi" }),
    makeDiscoveryResult({ name: "pi" }),
  ];

  beforeEach(() => {
    detectCallerHarnessMock.mockReturnValue(null);
  });

  it("selects agent-core as highest priority when all are available", () => {
    const selected = selectHarness(harnesses);
    expect(selected?.name).toBe("agent-core");
  });

  it("respects priority order: agent-core > oh-my-pi > pi", () => {
    // Remove agent-core
    const withoutInternal = harnesses.filter((h) => h.name !== "agent-core");
    expect(selectHarness(withoutInternal)?.name).toBe("oh-my-pi");

    // Remove agent-core + oh-my-pi
    const onlyPi = withoutInternal.filter((h) => h.name !== "oh-my-pi");
    expect(selectHarness(onlyPi)?.name).toBe("pi");
  });

  it("selects preferred harness when specified and installed", () => {
    const selected = selectHarness(harnesses, "pi");
    expect(selected?.name).toBe("pi");
  });

  it("prefers the active caller harness when no explicit preference is provided", () => {
    detectCallerHarnessMock.mockReturnValue({
      name: "pi",
      matchedEnvVars: ["PI_SESSION_ID"],
      capabilities: [],
    });
    const selected = selectHarness(harnesses);
    expect(selected?.name).toBe("pi");
  });

  it("falls back to priority when preferred harness is not installed", () => {
    const selected = selectHarness(harnesses, "cursor");
    expect(selected?.name).toBe("agent-core");
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
    const internalUninstalled = harnesses.map((h) =>
      h.name === "agent-core" ? { ...h, installed: false } : h,
    );
    const selected = selectHarness(internalUninstalled);
    expect(selected?.name).toBe("oh-my-pi");
  });
});

describe("handleHarnessCreateRun", () => {
  let tempDirs: string[] = [];
  let savedGlobalStateDir: string | undefined;
  let savedStateDir: string | undefined;
  let savedBabysitterSessionId: string | undefined;
  let savedHarnessPid: string | undefined;
  let savedTrustEnvSession: string | undefined;
  let savedPidMarkerFlag: string | undefined;
  let savedPiSessionId: string | undefined;
  let savedOmpSessionId: string | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    // vi.clearAllMocks does NOT clear mockImplementationOnce / mockResolvedValueOnce
    // queues, so leftover overrides from one test can leak into the next.
    // mockReset clears the once queue but also the base implementation, so we
    // save the factory default for createAgentCoreSession (the only mock with a
    // non-trivial factory impl) and restore it after reset.
    const piDefault = vi.mocked(createAgentCoreSession).getMockImplementation();
    vi.mocked(createAgentCoreSession).mockReset();
    if (piDefault) vi.mocked(createAgentCoreSession).mockImplementation(piDefault);
    // These mocks have no factory implementation (just vi.fn()), so plain
    // mockReset is sufficient to clear once-queues without losing anything.
    vi.mocked(orchestrateIteration).mockReset();
    vi.mocked(createRun).mockReset();
    vi.mocked(commitEffectResult).mockReset();
    vi.mocked(invokeHarness).mockReset();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    detectCallerHarnessMock.mockReturnValue(null);
    savedGlobalStateDir = process.env.BABYSITTER_GLOBAL_STATE_DIR;
    savedStateDir = process.env.BABYSITTER_STATE_DIR;
    savedBabysitterSessionId = process.env.AGENT_SESSION_ID;
    savedHarnessPid = process.env.BABYSITTER_HARNESS_PID;
    savedTrustEnvSession = process.env.BABYSITTER_TRUST_ENV_SESSION;
    savedPidMarkerFlag = process.env.BABYSITTER_ENABLE_SESSION_PID_MARKERS;
    savedPiSessionId = process.env.PI_SESSION_ID;
    savedOmpSessionId = process.env.OMP_SESSION_ID;
    const isolatedGlobalStateDir = path.join(
      os.tmpdir(),
      `harness-create-run-global-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    );
    tempDirs.push(isolatedGlobalStateDir);
    process.env.BABYSITTER_GLOBAL_STATE_DIR = isolatedGlobalStateDir;
    process.env.BABYSITTER_STATE_DIR = isolatedGlobalStateDir;
    delete process.env.AGENT_SESSION_ID;
    delete process.env.BABYSITTER_HARNESS_PID;
    delete process.env.BABYSITTER_TRUST_ENV_SESSION;
    delete process.env.BABYSITTER_ENABLE_SESSION_PID_MARKERS;
    delete process.env.PI_SESSION_ID;
    delete process.env.OMP_SESSION_ID;
    __resetCacheForTests();
    __setAncestorResolverForTests(undefined);
  });

  afterEach(async () => {
    await Promise.all(
      tempDirs.map(async (dir) => {
        await fs.rm(dir, { recursive: true, force: true });
      }),
    );
    tempDirs = [];
    if (savedGlobalStateDir === undefined) {
      delete process.env.BABYSITTER_GLOBAL_STATE_DIR;
    } else {
      process.env.BABYSITTER_GLOBAL_STATE_DIR = savedGlobalStateDir;
    }
    if (savedStateDir === undefined) {
      delete process.env.BABYSITTER_STATE_DIR;
    } else {
      process.env.BABYSITTER_STATE_DIR = savedStateDir;
    }
    if (savedBabysitterSessionId === undefined) {
      delete process.env.AGENT_SESSION_ID;
    } else {
      process.env.AGENT_SESSION_ID = savedBabysitterSessionId;
    }
    if (savedHarnessPid === undefined) {
      delete process.env.BABYSITTER_HARNESS_PID;
    } else {
      process.env.BABYSITTER_HARNESS_PID = savedHarnessPid;
    }
    if (savedTrustEnvSession === undefined) {
      delete process.env.BABYSITTER_TRUST_ENV_SESSION;
    } else {
      process.env.BABYSITTER_TRUST_ENV_SESSION = savedTrustEnvSession;
    }
    if (savedPidMarkerFlag === undefined) {
      delete process.env.BABYSITTER_ENABLE_SESSION_PID_MARKERS;
    } else {
      process.env.BABYSITTER_ENABLE_SESSION_PID_MARKERS = savedPidMarkerFlag;
    }
    if (savedPiSessionId === undefined) {
      delete process.env.PI_SESSION_ID;
    } else {
      process.env.PI_SESSION_ID = savedPiSessionId;
    }
    if (savedOmpSessionId === undefined) {
      delete process.env.OMP_SESSION_ID;
    } else {
      process.env.OMP_SESSION_ID = savedOmpSessionId;
    }
    __resetCacheForTests();
    __setAncestorResolverForTests(undefined);
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
    it("uses the agent-core pi wrapper for plan-process and as the default orchestration harness even when external harnesses are discovered", async () => {
      const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "session-create-agent-core-default-"));
      tempDirs.push(workspace);
      const generatedPath = path.join(workspace, ".a5c", "processes");
      const generatedFile = path.join(generatedPath, "test-process.mjs");
      let planProcessPrompt = "";
      await fs.mkdir(generatedPath, { recursive: true });
      await fs.writeFile(
        generatedFile,
        buildMinimalAgentProcessSource(),
        "utf8",
      );

      (discoverHarnesses as Mock).mockResolvedValue([
        makeDiscoveryResult({ name: "pi" }),
        makeDiscoveryResult({ name: "oh-my-pi" }),
      ]);
      detectCallerHarnessMock.mockReturnValue({
        name: "pi",
        matchedEnvVars: ["PI_SESSION_ID"],
        capabilities: [],
      });
      vi.mocked(createAgentCoreSession).mockImplementationOnce((options?: { customTools?: Array<Record<string, unknown>> }) => {
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
            return "mock-session-id-planProcess-agent-core-default";
          },
          get isInitialized() {
            return true;
          },
          prompt: vi.fn(async (prompt: string) => {
            planProcessPrompt = prompt;
            await reportProcess?.execute?.("tool-process", {
              processPath: generatedFile,
              summary: "Generated process",
            });
            return { success: true, output: "planProcess", exitCode: 0, duration: 1 };
          }),
        };
      });
      (createRun as Mock).mockResolvedValue({
        runId: "run-agent-core-default",
        runDir: "/tmp/runs/run-agent-core-default",
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
      expect(createAgentCoreSession).toHaveBeenCalled();
      const planProcessOptions = vi.mocked(createAgentCoreSession).mock.calls[0]?.[0] as {
        workspace?: string;
        toolsMode?: string;
        isolated?: boolean;
        ephemeral?: boolean;
        customTools?: Array<{ name?: string }>;
        systemPrompt?: string;
      };
      expect(planProcessOptions).toMatchObject({
        workspace,
        isolated: true,
        ephemeral: true,
      });
      expect(["default", "coding"]).toContain(planProcessOptions.toolsMode ?? "");
      expect(planProcessOptions.customTools?.map((tool) => tool.name)).toEqual(
        expect.arrayContaining([
          "write",
          "read",
          "grep",
          "AskUserQuestion",
          "task",
          "skill",
          "babysitter_report_process_definition",
        ]),
      );
      expect(invokeHarness).not.toHaveBeenCalled();
      expect(planProcessPrompt).toContain("Non-interactive mode. Do not call AskUserQuestion");
      expect(planProcessPrompt).toContain("Workspace assessment:");
      expect(planProcessOptions.systemPrompt).toContain("normal file/search tools");
      expect(planProcessPrompt).toContain("The generated process must directly execute the user's requested work");
      expect(planProcessPrompt).not.toContain("You are a babysitter process generator");
      const planProcessSession = vi.mocked(createAgentCoreSession).mock.results[0]?.value as { prompt: Mock };
      const orchestrationSession = vi.mocked(createAgentCoreSession).mock.results[1]?.value as { prompt: Mock };
      expect(planProcessSession.prompt).toHaveBeenCalled();
      expect(orchestrationSession.prompt).toHaveBeenCalled();
    });

    it("normalizes the internal harness alias to agent-core for orchestration", async () => {
      const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "session-create-internal-alias-"));
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
        makeDiscoveryResult({ name: "pi" }),
      ]);
      (createRun as Mock).mockResolvedValue({
        runId: "run-internal-alias",
        runDir: "/tmp/runs/run-internal-alias",
        metadata: {},
      });
      (orchestrateIteration as Mock).mockResolvedValue({
        status: "completed",
        output: "done",
      });

      const code = await handleHarnessCreateRun({
        prompt: "create a game",
        harness: "internal",
        workspace,
        runsDir: "/tmp/runs",
        json: false,
        verbose: false,
        interactive: false,
      });

      expect(code).toBe(0);
      expect(createRun).toHaveBeenCalledWith(expect.objectContaining({
        harness: "agent-core",
      }));
      expect(invokeHarness).not.toHaveBeenCalled();
    });

    it("binds an interactive UI context into the agent-core PI sessions", async () => {
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
      vi.mocked(createAgentCoreSession)
        .mockImplementationOnce((options?: { customTools?: Array<Record<string, unknown>> }) => {
          const tools = options?.customTools ?? [];
          const writeProcess = getProcessWriteTool(tools) as {
            execute?: (toolCallId: string, params: Record<string, unknown>) => Promise<{ details?: unknown }>;
          } | undefined;
          const reportProcess = getCompatTool(tools, "babysitter_report_process_definition") as {
            execute?: (toolCallId: string, params: Record<string, unknown>) => Promise<{ details?: unknown }>;
          } | undefined;
          let promptCount = 0;

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
              return "mock-session-id-planProcess-interactive-ui";
            },
            get isInitialized() {
              return true;
            },
            prompt: vi.fn(async () => {
              promptCount += 1;
              if (promptCount === 1) {
                return { success: true, output: "intent", exitCode: 0, duration: 1 };
              }
              await writeProcess?.execute?.("tool-write-process", {
                filename: "test-process.mjs",
                source: buildMinimalAgentProcessSource(),
              });
              await reportProcess?.execute?.("tool-report-process", {
                processPath: generatedFile,
                summary: "Generated process",
              });
              return { success: true, output: "planProcess", exitCode: 0, duration: 1 };
            }),
          };
        })
        .mockImplementationOnce((options?: { customTools?: Array<Record<string, unknown>> }) => {
          const tools = options?.customTools ?? [];
          const runIterate = getCompatTool(tools, "babysitter_run_iterate") as {
            execute?: (toolCallId: string, params: Record<string, unknown>) => Promise<{ details?: unknown }>;
          } | undefined;
          const finish = getCompatTool(tools, "babysitter_finish_orchestration") as {
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
              return "mock-session-id-orchestration-interactive-ui";
            },
            get isInitialized() {
              return true;
            },
            prompt: vi.fn(async () => {
              await runIterate?.execute?.("tool-run-iterate", {});
              await finish?.execute?.("tool-finish", { summary: "done" });
              return { success: true, output: "orchestration", exitCode: 0, duration: 1 };
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
      expect(vi.mocked(createAgentCoreSession).mock.calls[0]?.[0]).toEqual(
        expect.objectContaining({
          uiContext: expect.any(Object),
        }),
      );
      expect(vi.mocked(createAgentCoreSession).mock.calls[1]?.[0]).toEqual(
        expect.objectContaining({
          uiContext: expect.any(Object),
        }),
      );
    });

    it("fails interactive breakpoint posting when AskUserQuestion was skipped", async () => {
      const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "session-create-interactive-breakpoint-"));
      tempDirs.push(workspace);
      const runDir = "/tmp/runs/run-breakpoint-ui";
      const assessRunSpy = vi.spyOn(resumeState, "assessRun");
      const listTasksSpy = vi.spyOn(taskStore, "listTasks");
      const readTaskSpy = vi.spyOn(taskStore, "readTask");
      try {
        (discoverHarnesses as Mock).mockResolvedValue([
          makeDiscoveryResult({ name: "pi" }),
        ]);
        (createRun as Mock).mockResolvedValue({
          runId: "run-breakpoint-ui",
          runDir,
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

        const makeWaitingAssessment = () => ({
          run: {
            runId: "run-breakpoint-ui",
            runDir,
            processId: "proc-1",
            createdAt: "2026-05-01T00:00:00.000Z",
            status: "waiting" as const,
            pendingEffects: { breakpoint: 1 },
            totalEffects: 1,
            resolvedEffects: 0,
            entrypoint: { importPath: "/tmp/process.mjs" },
          },
          journalLength: 2,
          lastEvent: { type: "EFFECT_REQUESTED", recordedAt: "2026-05-01T00:00:01.000Z" },
        });

        assessRunSpy
          .mockResolvedValueOnce({
            run: {
              runId: "run-breakpoint-ui",
              runDir,
              processId: "proc-1",
              createdAt: "2026-05-01T00:00:00.000Z",
              status: "created" as const,
              pendingEffects: {},
              totalEffects: 0,
              resolvedEffects: 0,
              entrypoint: { importPath: "/tmp/process.mjs" },
            },
            journalLength: 1,
            lastEvent: { type: "RUN_CREATED", recordedAt: "2026-05-01T00:00:00.000Z" },
          })
          .mockResolvedValue(makeWaitingAssessment());

        listTasksSpy.mockResolvedValueOnce([]).mockResolvedValue([
          {
            effectId: "eff-breakpoint",
            taskId: "task-breakpoint",
            kind: "breakpoint",
            title: "Approve the plan?",
            status: "requested" as const,
            labels: [],
            requestedAt: "2026-05-01T00:00:01.000Z",
          },
        ]);
        readTaskSpy.mockResolvedValue({
          effectId: "eff-breakpoint",
          taskId: "task-breakpoint",
          runId: "run-breakpoint-ui",
          kind: "breakpoint",
          title: "Approve the plan?",
          status: "requested" as const,
          labels: [],
          requestedAt: "2026-05-01T00:00:01.000Z",
          definition: {
            kind: "breakpoint",
            title: "Approve the plan?",
            invocationKey: "key-breakpoint",
          },
        } as Awaited<ReturnType<typeof taskStore.readTask>>);

        vi.mocked(createAgentCoreSession).mockImplementationOnce((options?: { customTools?: Array<Record<string, unknown>> }) => {
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
              // The agent skips AskUserQuestion and directly tries to post the breakpoint result.
              // This should fail because interactive breakpoints require AskUserQuestion first.
              await getTool("babysitter_task_post_result")?.execute?.("tool-post-breakpoint", { effectId: "eff-breakpoint" });
              return { success: true, output: "orchestration", exitCode: 0, duration: 1 };
            }),
          } as ReturnType<typeof createAgentCoreSession>;
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
      } finally {
        assessRunSpy.mockRestore();
        listTasksSpy.mockRestore();
        readTaskSpy.mockRestore();
      }
    });

    it("does not commit a delegated result when only stdout is posted without an explicit value payload", async () => {
      const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "session-create-preserve-staged-"));
      tempDirs.push(workspace);
      const runDir = "/tmp/runs/run-preserve-staged";
      const assessRunSpy = vi.spyOn(resumeState, "assessRun");
      const listTasksSpy = vi.spyOn(taskStore, "listTasks");
      const readTaskSpy = vi.spyOn(taskStore, "readTask");
      try {
        (discoverHarnesses as Mock).mockResolvedValue([
          makeDiscoveryResult({ name: "pi" }),
        ]);
        (createRun as Mock).mockResolvedValue({
          runId: "run-preserve-staged",
          runDir,
          metadata: {},
        });
        (orchestrateIteration as Mock).mockResolvedValueOnce({
          status: "waiting",
          nextActions: [
            {
              effectId: "eff-agent",
              invocationKey: "key-agent",
              kind: "agent",
              taskDef: { kind: "agent", title: "Do work" },
            },
          ],
        });

        const makeWaitingAssessment = () => ({
          run: {
            runId: "run-preserve-staged",
            runDir,
            processId: "proc-1",
            createdAt: "2026-05-01T00:00:00.000Z",
            status: "waiting" as const,
            pendingEffects: { agent: 1 },
            totalEffects: 1,
            resolvedEffects: 0,
            entrypoint: { importPath: "/tmp/process.mjs" },
          },
          journalLength: 2,
          lastEvent: { type: "EFFECT_REQUESTED", recordedAt: "2026-05-01T00:00:01.000Z" },
        });

        assessRunSpy
          .mockResolvedValueOnce({
            run: {
              runId: "run-preserve-staged",
              runDir,
              processId: "proc-1",
              createdAt: "2026-05-01T00:00:00.000Z",
              status: "created" as const,
              pendingEffects: {},
              totalEffects: 0,
              resolvedEffects: 0,
              entrypoint: { importPath: "/tmp/process.mjs" },
            },
            journalLength: 1,
            lastEvent: { type: "RUN_CREATED", recordedAt: "2026-05-01T00:00:00.000Z" },
          })
          .mockResolvedValue(makeWaitingAssessment());

        listTasksSpy.mockResolvedValueOnce([]).mockResolvedValue([
          {
            effectId: "eff-agent",
            taskId: "task-agent",
            kind: "agent",
            title: "Do work",
            status: "requested" as const,
            labels: [],
            requestedAt: "2026-05-01T00:00:01.000Z",
          },
        ]);
        readTaskSpy.mockResolvedValue({
          effectId: "eff-agent",
          taskId: "task-agent",
          runId: "run-preserve-staged",
          kind: "agent",
          title: "Do work",
          status: "requested" as const,
          labels: [],
          requestedAt: "2026-05-01T00:00:01.000Z",
          definition: {
            kind: "agent",
            title: "Do work",
            invocationKey: "key-agent",
          },
        } as Awaited<ReturnType<typeof taskStore.readTask>>);

        vi.mocked(createAgentCoreSession).mockImplementationOnce((options?: { customTools?: Array<Record<string, unknown>> }) => {
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
              // The agent posts only stdout without a status or value payload.
              // This should fail because no effect result can be constructed without
              // an explicit status/value or a prior staged result.
              await getTool("babysitter_task_post_result")?.execute?.("tool-post", {
                effectId: "eff-agent",
                stdout: "worker-log",
              });
              return { success: true, output: "orchestration", exitCode: 0, duration: 1 };
            }),
          } as ReturnType<typeof createAgentCoreSession>;
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

        expect(code).toBe(1);
        expect(commitEffectResult).not.toHaveBeenCalled();
      } finally {
        assessRunSpy.mockRestore();
        listTasksSpy.mockRestore();
        readTaskSpy.mockRestore();
      }
    });

    it("continues orchestration after a late bootstrap prompt failure and preserves the original user prompt", async () => {
      const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "session-create-orchestration-late-failure-"));
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

      let orchestrationPromptCount = 0;
      vi.mocked(createAgentCoreSession)
        .mockImplementationOnce((options?: { customTools?: Array<Record<string, unknown>> }) => {
          const tools = options?.customTools ?? [];
          const reportProcess = getCompatTool(tools, "babysitter_report_process_definition") as {
            execute?: (toolCallId: string, params: Record<string, unknown>) => Promise<{ details?: unknown }>;
          } | undefined;
          let planProcessPromptCount = 0;

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
              return "mock-session-id-planProcess";
            },
            get isInitialized() {
              return true;
            },
            prompt: vi.fn(async () => {
              planProcessPromptCount += 1;
              if (planProcessPromptCount === 1) {
                return { success: true, output: "intent", exitCode: 0, duration: 1 };
              }
              await reportProcess?.execute?.("tool-process", {
                processPath: generatedFile,
                summary: "Generated process",
              });
              return { success: true, output: "planProcess", exitCode: 0, duration: 1 };
            }),
          };
        })
        .mockImplementationOnce((options?: { customTools?: Array<Record<string, unknown>> }) => {
          const tools = options?.customTools ?? [];
          const runIterate = getCompatTool(tools, "babysitter_run_iterate") as {
            execute?: (toolCallId: string, params: Record<string, unknown>) => Promise<{ details?: unknown }>;
          } | undefined;
          const finish = getCompatTool(tools, "babysitter_finish_orchestration") as {
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
              return "mock-session-id-orchestration";
            },
            get isInitialized() {
              return true;
            },
            prompt: vi.fn(async () => {
              orchestrationPromptCount += 1;
              if (orchestrationPromptCount === 1) {
                await runIterate?.execute?.("tool-run-iterate-1", {});
                return {
                  success: false,
                  output: "msg.content.filter is not a function",
                  exitCode: 1,
                  duration: 1,
                };
              }
              if (orchestrationPromptCount === 2) {
                await runIterate?.execute?.("tool-run-iterate-2", {});
                await finish?.execute?.("tool-finish", { summary: "done" });
                return { success: true, output: "iteration complete", exitCode: 0, duration: 1 };
              }
              return { success: true, output: "noop", exitCode: 0, duration: 1 };
            }),
          };
        });

      (createRun as Mock).mockResolvedValue({
        runId: "run-orchestration-late-failure",
        runDir: "/tmp/runs/run-orchestration-late-failure",
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
      expect(orchestrationPromptCount).toBe(1);
    });

    it("fails orchestration when pi returns the known post-turn failure before any progress", async () => {
      const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "session-create-orchestration-host-fallback-"));
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

      vi.mocked(createAgentCoreSession)
        .mockImplementationOnce((options?: { customTools?: Array<Record<string, unknown>> }) => {
          const tools = options?.customTools ?? [];
          const reportProcess = getCompatTool(tools, "babysitter_report_process_definition") as {
            execute?: (toolCallId: string, params: Record<string, unknown>) => Promise<{ details?: unknown }>;
          } | undefined;
          let planProcessPromptCount = 0;

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
              return "mock-session-id-planProcess";
            },
            get isInitialized() {
              return true;
            },
            prompt: vi.fn(async () => {
              planProcessPromptCount += 1;
              if (planProcessPromptCount === 1) {
                return { success: true, output: "intent", exitCode: 0, duration: 1 };
              }
              await reportProcess?.execute?.("tool-process", {
                processPath: generatedFile,
                summary: "Generated process",
              });
              return { success: true, output: "planProcess", exitCode: 0, duration: 1 };
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
            return "mock-session-id-orchestration";
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
        runId: "run-orchestration-host-fallback",
        runDir: "/tmp/runs/run-orchestration-host-fallback",
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
      expect(createRun).toHaveBeenCalledTimes(1);
      expect(orchestrateIteration).not.toHaveBeenCalled();
    });
  });

  describe("PhasePlanProcess: process-definition recovery", () => {
    it("continues when the plan-process tool report succeeds before pi returns a late prompt failure", async () => {
      const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "session-create-planProcess-late-failure-"));
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
      vi.mocked(createAgentCoreSession).mockImplementationOnce((options?: { customTools?: Array<Record<string, unknown>> }) => {
        const tools = options?.customTools ?? [];
        const reportProcess = getCompatTool(tools, "babysitter_report_process_definition") as {
          execute?: (toolCallId: string, params: Record<string, unknown>) => Promise<{ details?: unknown }>;
        } | undefined;
        let promptCount = 0;

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
            return "mock-session-id-planProcess-late-failure";
          },
          get isInitialized() {
            return true;
          },
          prompt: vi.fn(async () => {
            promptCount += 1;
            if (promptCount === 1) {
              return { success: true, output: "intent", exitCode: 0, duration: 1 };
            }
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
        runId: "run-planProcess-late-failure",
        runDir: "/tmp/runs/run-planProcess-late-failure",
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

    it("retries a transient plan-process PI service failure before failing the command", async () => {
      const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "session-create-planProcess-transient-retry-"));
      tempDirs.push(workspace);
      const generatedPath = path.join(workspace, ".a5c", "processes");
      const generatedFile = path.join(generatedPath, "test-process.mjs");
      let promptCount = 0;

      (discoverHarnesses as Mock).mockResolvedValue([
        makeDiscoveryResult({ name: "pi" }),
      ]);
      (createRun as Mock).mockResolvedValue({
        runId: "run-planProcess-transient-retry",
        runDir: "/tmp/runs/run-planProcess-transient-retry",
        metadata: {},
      });
      (orchestrateIteration as Mock).mockResolvedValue({
        status: "completed",
        output: "done",
      });

      vi.mocked(createAgentCoreSession).mockImplementationOnce((options?: { customTools?: Array<Record<string, unknown>> }) => {
        const tools = options?.customTools ?? [];
        const reportProcess = getCompatTool(tools, "babysitter_report_process_definition") as {
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
            return "mock-session-id-planProcess-transient-retry";
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

            if (promptCount === 2) {
              return { success: true, output: "planProcess-intent", exitCode: 0, duration: 1 };
            }

            await fs.mkdir(generatedPath, { recursive: true });
            await fs.writeFile(generatedFile, buildMinimalAgentProcessSource(), "utf8");
            await reportProcess?.execute?.("tool-report-transient-retry", {
              processPath: generatedFile,
              summary: "Generated process after transient retry",
            });
            return { success: true, output: "planProcess-success", exitCode: 0, duration: 1 };
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
      expect(promptCount).toBe(3);
      expect(existsSync(generatedFile)).toBe(true);
    });

    it("keeps agent-core plan-process parent prompts unbounded while recovery waits for the agent", async () => {
      const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "session-create-planProcess-unbounded-timeout-"));
      tempDirs.push(workspace);
      const generatedPath = path.join(workspace, ".a5c", "processes");
      const generatedFile = path.join(generatedPath, "test-process.mjs");
      const promptTimeouts: number[] = [];
      let promptCount = 0;

      (discoverHarnesses as Mock).mockResolvedValue([
        makeDiscoveryResult({ name: "pi" }),
      ]);
      (createRun as Mock).mockResolvedValue({
        runId: "run-planProcess-unbounded-timeout",
        runDir: "/tmp/runs/run-planProcess-unbounded-timeout",
        metadata: {},
      });
      (orchestrateIteration as Mock).mockResolvedValue({
        status: "completed",
        output: "done",
      });

      vi.mocked(createAgentCoreSession).mockImplementationOnce((options?: { customTools?: Array<Record<string, unknown>> }) => {
        const tools = options?.customTools ?? [];
        const writeProcess = getProcessWriteTool(tools) as {
          execute?: (toolCallId: string, params: Record<string, unknown>) => Promise<{ details?: unknown }>;
        } | undefined;
        const reportProcess = getCompatTool(tools, "babysitter_report_process_definition") as {
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
            return "mock-session-id-planProcess-unbounded-timeout";
          },
          get isInitialized() {
            return true;
          },
          prompt: vi.fn(async (_prompt: string, timeout?: number) => {
            promptTimeouts.push(timeout ?? -1);
            promptCount += 1;
            if (promptCount === 1) {
              return { success: true, output: "planProcess-intent", exitCode: 0, duration: 1 };
            }

            if (promptCount === 2) {
              return { success: true, output: "planProcess-without-report", exitCode: 0, duration: 1 };
            }

            await fs.mkdir(generatedPath, { recursive: true });
            await writeProcess?.execute?.("tool-write-process", {
              filename: "test-process.mjs",
              source: buildMinimalAgentProcessSource(),
            });
            await reportProcess?.execute?.("tool-report-process", {
              processPath: generatedFile,
              summary: "Generated process after recovery",
            });
            return { success: true, output: "planProcess-recovery-success", exitCode: 0, duration: 1 };
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
      expect(promptTimeouts).toEqual([0, 0, 0]);
      expect(existsSync(generatedFile)).toBe(true);
    });

    it("recovers by writing a process code block returned by the plan-process agent when the tool report is missing", async () => {
      const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "session-create-planProcess-"));
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

      vi.mocked(createAgentCoreSession).mockImplementationOnce(() => ({
        initialize: vi.fn().mockResolvedValue(undefined),
        subscribe: vi.fn(() => () => {}),
        dispose: vi.fn(),
        executeBash: vi.fn(async () => ({
          output: "",
          exitCode: 0,
          cancelled: false,
        })),
        get sessionId() {
          return "mock-session-id-planProcess";
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
          })
          .mockResolvedValueOnce({
            success: true,
            output: "Recovery already covered by the prior code block.",
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

    it("repairs an invalid reported process export before moving to orchestration", async () => {
      const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "session-create-planProcess-conformance-"));
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

      vi.mocked(createAgentCoreSession).mockImplementationOnce((options?: { customTools?: Array<Record<string, unknown>> }) => {
        const tools = options?.customTools ?? [];
        const writeProcess = getProcessWriteTool(tools) as {
          execute?: (toolCallId: string, params: Record<string, unknown>) => Promise<{ details?: unknown }>;
        } | undefined;
        const reportProcess = getCompatTool(tools, "babysitter_report_process_definition") as {
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
            return "mock-session-id-planProcess-conformance";
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
              return { success: true, output: "planProcess-intent", exitCode: 0, duration: 1 };
            }

            if (promptCount === 2) {
              await writeProcess?.execute?.("tool-write-invalid", {
                filename: "test-process.mjs",
                source: 'export default { name: "bad-process", tasks: [] };\n',
              });
              await reportProcess?.execute?.("tool-report-invalid", {
                processPath: generatedFile,
                summary: "Generated process",
              });
              return { success: true, output: "planProcess-invalid", exitCode: 0, duration: 1 };
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
            return { success: true, output: "planProcess-repaired", exitCode: 0, duration: 1 };
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
      expect(promptCount).toBe(3);
      const source = await fs.readFile(generatedFile, "utf8");
      expect(source).toContain("export async function process");
    });

    it("applies a fenced repaired process module onto the reported file when the agent does not actually rewrite it", async () => {
      const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "session-create-planProcess-conformance-code-block-"));
      tempDirs.push(workspace);
      const generatedPath = path.join(workspace, ".a5c", "processes");
      const generatedFile = path.join(generatedPath, "test-process.mjs");
      let promptCount = 0;

      (discoverHarnesses as Mock).mockResolvedValue([
        makeDiscoveryResult({ name: "pi" }),
      ]);
      (createRun as Mock).mockResolvedValue({
        runId: "run-conformance-code-block-fix",
        runDir: "/tmp/runs/run-conformance-code-block-fix",
        metadata: {},
      });
      (orchestrateIteration as Mock).mockResolvedValue({
        status: "completed",
        output: "done",
      });

      vi.mocked(createAgentCoreSession).mockImplementationOnce((options?: { customTools?: Array<Record<string, unknown>> }) => {
        const tools = options?.customTools ?? [];
        const writeProcess = getProcessWriteTool(tools) as {
          execute?: (toolCallId: string, params: Record<string, unknown>) => Promise<{ details?: unknown }>;
        } | undefined;
        const reportProcess = getCompatTool(tools, "babysitter_report_process_definition") as {
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
            return "mock-session-id-planProcess-conformance-code-block";
          },
          get isInitialized() {
            return true;
          },
          get isStreaming() {
            return false;
          },
          prompt: vi.fn(async () => {
            promptCount += 1;
            if (promptCount === 1) {
              return { success: true, output: "planProcess-intent", exitCode: 0, duration: 1 };
            }

            if (promptCount === 2) {
              await writeProcess?.execute?.("tool-write-invalid", {
                filename: "test-process.mjs",
                source: [
                  'import { defineTask } from "@babysitter/sdk";',
                  "",
                  'const buildGameTask = defineTask("build-game", () => ({',
                  '  kind: "agent",',
                  "  agent: {",
                  '    name: "general-purpose",',
                  '    prompt: { task: "Create the requested game.", instructions: [] },',
                  '    outputSchema: { type: "object" },',
                  "  },",
                  "}));",
                  "",
                  "export async function process(inputs, ctx) {",
                  "  return ctx.task(buildGameTask, {});",
                  "}",
                  "",
                ].join("\n"),
              });
              await reportProcess?.execute?.("tool-report-invalid", {
                processPath: generatedFile,
                summary: "Generated process",
              });
              return { success: true, output: "planProcess-invalid-import", exitCode: 0, duration: 1 };
            }

            return {
              success: true,
              output: [
                "I repaired the module and the corrected source is below.",
                "```javascript",
                buildMinimalAgentProcessSource(),
                "```",
              ].join("\n"),
              exitCode: 0,
              duration: 1,
            };
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
      expect(promptCount).toBe(3);
      const source = await fs.readFile(generatedFile, "utf8");
      expect(source).toContain("export async function process");
      expect(source).toContain('defineTask("main-task"');
      expect(source).not.toContain('@babysitter/sdk');
    });

    it("recovers a valid process module from a heredoc-heavy agent transcript instead of writing the raw transcript", async () => {
      const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "session-create-planProcess-heredoc-transcript-"));
      tempDirs.push(workspace);

      (discoverHarnesses as Mock).mockResolvedValue([
        makeDiscoveryResult({ name: "pi" }),
      ]);
      (createRun as Mock).mockResolvedValue({
        runId: "run-heredoc-transcript-recovery",
        runDir: path.join(workspace, ".a5c", "runs", "run-heredoc-transcript-recovery"),
        metadata: {},
      });
      (orchestrateIteration as Mock).mockResolvedValue({
        status: "completed",
        output: "done",
      });

      let promptCount = 0;
      vi.mocked(createAgentCoreSession).mockImplementationOnce(() => ({
        initialize: vi.fn().mockResolvedValue(undefined),
        subscribe: vi.fn(() => () => {}),
        dispose: vi.fn(),
        executeBash: vi.fn(async () => ({
          output: "",
          exitCode: 0,
          cancelled: false,
        })),
        abort: vi.fn().mockResolvedValue(undefined),
        get sessionId() {
          return "mock-session-id-planProcess-heredoc-transcript";
        },
        get isInitialized() {
          return true;
        },
        get isStreaming() {
          return false;
        },
        prompt: vi.fn(async () => {
          promptCount += 1;
          if (promptCount === 1) {
            return {
              success: true,
              output: "Intent analyzed.",
              exitCode: 0,
              duration: 1,
            };
          }

          if (promptCount === 2) {
            return {
              success: true,
              output: [
                "I inspected the workspace and I'm writing the process now. to=bash code",
                `"command":"cd ${workspace} && mkdir -p .a5c/processes && cat > .a5c/processes/minimal-browser-game.mjs <<'EOF'`,
                buildMinimalAgentProcessSource(),
                "EOF\"",
              ].join("\n"),
              exitCode: 0,
              duration: 1,
            };
          }

          return {
            success: true,
            output: "The process file was already written in the previous step.",
            exitCode: 0,
            duration: 1,
          };
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
      expect(promptCount).toBe(3);
      const generatedPath = path.join(workspace, ".a5c", "processes");
      const processFiles = (await fs.readdir(generatedPath)).filter((entry) => /\.m?js$/.test(entry));
      expect(processFiles.length).toBeGreaterThan(0);
      const source = await fs.readFile(path.join(generatedPath, processFiles[0]!), "utf8");
      expect(source).toContain("export async function process");
      expect(source).not.toContain("to=bash");
      expect(source).not.toContain("\"stdout\":");
    });

    it("rejects a default-exported process and repairs it to a named process export", async () => {
      const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "session-create-planProcess-default-export-"));
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

      vi.mocked(createAgentCoreSession).mockImplementationOnce((options?: { customTools?: Array<Record<string, unknown>> }) => {
        const tools = options?.customTools ?? [];
        const writeProcess = getProcessWriteTool(tools) as {
          execute?: (toolCallId: string, params: Record<string, unknown>) => Promise<{ details?: unknown }>;
        } | undefined;
        const reportProcess = getCompatTool(tools, "babysitter_report_process_definition") as {
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
            return "mock-session-id-planProcess-default-export";
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
              return { success: true, output: "planProcess-intent", exitCode: 0, duration: 1 };
            }

            if (promptCount === 2) {
              await writeProcess?.execute?.("tool-write-default-export", {
                filename: "test-process.mjs",
                source: 'export default async function process() { return { success: true }; }\n',
              });
              await reportProcess?.execute?.("tool-report-default-export", {
                processPath: generatedFile,
                summary: "Generated default-exported process",
              });
              return { success: true, output: "planProcess-default-export", exitCode: 0, duration: 1 };
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
            return { success: true, output: "planProcess-repaired", exitCode: 0, duration: 1 };
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
      expect(promptCount).toBe(3);
      const source = await fs.readFile(generatedFile, "utf8");
      expect(source).toContain("export async function process");
      expect(source).not.toContain("export default async function process");
    });

    it("repairs a named process export that incorrectly references process.cwd()", async () => {
      const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "session-create-planProcess-process-shadow-"));
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

      vi.mocked(createAgentCoreSession).mockImplementationOnce((options?: { customTools?: Array<Record<string, unknown>> }) => {
        const tools = options?.customTools ?? [];
        const writeProcess = getProcessWriteTool(tools) as {
          execute?: (toolCallId: string, params: Record<string, unknown>) => Promise<{ details?: unknown }>;
        } | undefined;
        const reportProcess = getCompatTool(tools, "babysitter_report_process_definition") as {
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
            return "mock-session-id-planProcess-process-shadow";
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
              return { success: true, output: "planProcess-intent", exitCode: 0, duration: 1 };
            }

            if (promptCount === 2) {
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
              return { success: true, output: "planProcess-process-shadow", exitCode: 0, duration: 1 };
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
            return { success: true, output: "planProcess-repaired", exitCode: 0, duration: 1 };
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
      expect(promptCount).toBe(3);
      const source = await fs.readFile(generatedFile, "utf8");
      expect(source).toContain("export async function process");
      expect(source).toContain("globalThis.process.cwd()");
      expect(source).not.toContain("const root = process.cwd();");
    });

    it("repairs a process that assumes ctx.workspaceDir or ctx.cwd exists", async () => {
      const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "session-create-planProcess-workspace-context-"));
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

      vi.mocked(createAgentCoreSession).mockImplementationOnce((options?: { customTools?: Array<Record<string, unknown>> }) => {
        const tools = options?.customTools ?? [];
        const writeProcess = getProcessWriteTool(tools) as {
          execute?: (toolCallId: string, params: Record<string, unknown>) => Promise<{ details?: unknown }>;
        } | undefined;
        const reportProcess = getCompatTool(tools, "babysitter_report_process_definition") as {
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
            return "mock-session-id-planProcess-workspace-context";
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
              return { success: true, output: "planProcess-intent", exitCode: 0, duration: 1 };
            }

            if (promptCount === 2) {
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
              return { success: true, output: "planProcess-workspace-context", exitCode: 0, duration: 1 };
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
            return { success: true, output: "planProcess-repaired", exitCode: 0, duration: 1 };
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
      expect(promptCount).toBe(3);
      const source = await fs.readFile(generatedFile, "utf8");
      expect(source).toContain("fileURLToPath(import.meta.url)");
      expect(source).toContain("const workspaceDir = path.dirname");
      expect(source).not.toContain("ctx.workspaceDir || ctx.cwd");
    });

    it("repairs a syntactically invalid process that embeds raw nested template literals", async () => {
      const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "session-create-planProcess-syntax-error-"));
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

      vi.mocked(createAgentCoreSession).mockImplementationOnce((options?: { customTools?: Array<Record<string, unknown>> }) => {
        const tools = options?.customTools ?? [];
        const writeProcess = getProcessWriteTool(tools) as {
          execute?: (toolCallId: string, params: Record<string, unknown>) => Promise<{ details?: unknown }>;
        } | undefined;
        const reportProcess = getCompatTool(tools, "babysitter_report_process_definition") as {
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
            return "mock-session-id-planProcess-syntax-error";
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
              return { success: true, output: "planProcess-intent", exitCode: 0, duration: 1 };
            }

            if (promptCount === 2) {
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
              return { success: true, output: "planProcess-syntax-error", exitCode: 0, duration: 1 };
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
            return { success: true, output: "planProcess-repaired", exitCode: 0, duration: 1 };
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
      expect(promptCount).toBe(3);
      const source = await fs.readFile(generatedFile, "utf8");
      expect(source).toContain('].join("\\n")');
      expect(source).not.toContain("const embeddedScript = `");
    });

    it("repairs a direct process that does not define any babysitter tasks", async () => {
      const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "session-create-planProcess-no-tasks-"));
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

      vi.mocked(createAgentCoreSession).mockImplementationOnce((options?: { customTools?: Array<Record<string, unknown>> }) => {
        const tools = options?.customTools ?? [];
        const writeProcess = getProcessWriteTool(tools) as {
          execute?: (toolCallId: string, params: Record<string, unknown>) => Promise<{ details?: unknown }>;
        } | undefined;
        const reportProcess = getCompatTool(tools, "babysitter_report_process_definition") as {
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
            return "mock-session-id-planProcess-no-tasks";
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
              return { success: true, output: "planProcess-intent", exitCode: 0, duration: 1 };
            }

            if (promptCount === 2) {
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
              return { success: true, output: "planProcess-no-tasks", exitCode: 0, duration: 1 };
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
            return { success: true, output: "planProcess-repaired", exitCode: 0, duration: 1 };
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
      expect(promptCount).toBe(3);
      const source = await fs.readFile(generatedFile, "utf8");
      expect(source).toContain('defineTask("main-task"');
      expect(source).toContain("await ctx.task(mainTask, {})");
    });

    it("repairs task-orchestrating processes that never define an agent task", async () => {
      const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "session-create-planProcess-no-agent-task-"));
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

      vi.mocked(createAgentCoreSession).mockImplementationOnce((options?: { customTools?: Array<Record<string, unknown>> }) => {
        const tools = options?.customTools ?? [];
        const writeProcess = getProcessWriteTool(tools) as {
          execute?: (toolCallId: string, params: Record<string, unknown>) => Promise<{ details?: unknown }>;
        } | undefined;
        const reportProcess = getCompatTool(tools, "babysitter_report_process_definition") as {
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
            return "mock-session-id-planProcess-no-agent-task";
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
              return { success: true, output: "planProcess-intent", exitCode: 0, duration: 1 };
            }

            if (promptCount === 2) {
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
              return { success: true, output: "planProcess-no-agent-task", exitCode: 0, duration: 1 };
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
            return { success: true, output: "planProcess-repaired", exitCode: 0, duration: 1 };
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
      expect(promptCount).toBe(3);
      const source = await fs.readFile(generatedFile, "utf8");
      expect(source).toContain('kind: "agent"');
      expect(source).toContain("await ctx.task(mainTask, {})");
    });

    it("repairs ctx.task calls that pass plain task objects instead of defineTask bindings", async () => {
      const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "session-create-planProcess-plain-task-object-"));
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

      vi.mocked(createAgentCoreSession).mockImplementationOnce((options?: { customTools?: Array<Record<string, unknown>> }) => {
        const tools = options?.customTools ?? [];
        const writeProcess = getProcessWriteTool(tools) as {
          execute?: (toolCallId: string, params: Record<string, unknown>) => Promise<{ details?: unknown }>;
        } | undefined;
        const reportProcess = getCompatTool(tools, "babysitter_report_process_definition") as {
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
            return "mock-session-id-planProcess-plain-task-object";
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
              return { success: true, output: "planProcess-intent", exitCode: 0, duration: 1 };
            }

            if (promptCount === 2) {
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
              return { success: true, output: "planProcess-plain-task-object", exitCode: 0, duration: 1 };
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
            return { success: true, output: "planProcess-repaired", exitCode: 0, duration: 1 };
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
      expect(promptCount).toBe(3);
      const source = await fs.readFile(generatedFile, "utf8");
      expect(source).toContain('const mainTask = defineTask("main-task"');
      expect(source).toContain("await ctx.task(mainTask, {})");
      expect(source).not.toContain('const verifyTask = { kind: "shell"');
    });

    it("repairs defineTask outputs that omit their top-level kind", async () => {
      const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "session-create-planProcess-missing-kind-"));
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

      vi.mocked(createAgentCoreSession).mockImplementationOnce((options?: { customTools?: Array<Record<string, unknown>> }) => {
        const tools = options?.customTools ?? [];
        const writeProcess = getProcessWriteTool(tools) as {
          execute?: (toolCallId: string, params: Record<string, unknown>) => Promise<{ details?: unknown }>;
        } | undefined;
        const reportProcess = getCompatTool(tools, "babysitter_report_process_definition") as {
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
            return "mock-session-id-planProcess-missing-kind";
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
              return { success: true, output: "planProcess-intent", exitCode: 0, duration: 1 };
            }

            if (promptCount === 2) {
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
              return { success: true, output: "planProcess-missing-kind", exitCode: 0, duration: 1 };
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
            return { success: true, output: "planProcess-repaired", exitCode: 0, duration: 1 };
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
      expect(promptCount).toBe(3);
      const source = await fs.readFile(generatedFile, "utf8");
      expect(source).toContain('kind: "agent"');
      expect(source).toContain("await ctx.task(goodAgentTask, {})");
      expect(source).not.toContain("const badAgentTask");
    });

    it("does not infer a node-kind mismatch from quoted node: specifiers inside task strings", async () => {
      const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "session-create-planProcess-node-specifier-"));
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

      vi.mocked(createAgentCoreSession).mockImplementationOnce((options?: { customTools?: Array<Record<string, unknown>> }) => {
        const tools = options?.customTools ?? [];
        const writeProcess = getProcessWriteTool(tools) as {
          execute?: (toolCallId: string, params: Record<string, unknown>) => Promise<{ details?: unknown }>;
        } | undefined;
        const reportProcess = getCompatTool(tools, "babysitter_report_process_definition") as {
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
            return "mock-session-id-planProcess-node-specifier";
          },
          get isInitialized() {
            return true;
          },
          get isStreaming() {
            return false;
          },
          prompt: vi.fn(async (prompt: string) => {
            promptCount += 1;
            if (promptCount > 2) {
              throw new Error(`unexpected repair prompt: ${prompt}`);
            }

            if (promptCount === 1) {
              return { success: true, output: "planProcess-intent", exitCode: 0, duration: 1 };
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
            return { success: true, output: "planProcess-node-specifier", exitCode: 0, duration: 1 };
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

    it("binds claude-code orchestration to AGENT_SESSION_ID when pid markers are disabled", async () => {
      const globalStateRoot = await fs.mkdtemp(path.join(os.tmpdir(), "harness-create-run-claude-state-"));
      tempDirs.push(globalStateRoot);
      process.env.BABYSITTER_GLOBAL_STATE_DIR = globalStateRoot;
      process.env.BABYSITTER_STATE_DIR = globalStateRoot;
      process.env.BABYSITTER_HARNESS_PID = String(process.pid);
      process.env.AGENT_SESSION_ID = "leaked-session-from-old-shell";
      __resetCacheForTests();
      __setAncestorResolverForTests(() => ({ pid: process.pid }));

      const currentSessionId = "current-claude-session";
      const leakedSessionId = "leaked-session-from-old-shell";
      const markerPath = getSessionMarkerPath("claude-code", process.pid);
      await fs.mkdir(path.dirname(markerPath), { recursive: true });
      await fs.writeFile(markerPath, `${currentSessionId}\n`);

      (discoverHarnesses as Mock).mockResolvedValue([
        makeDiscoveryResult({ name: "claude-code" }),
      ]);
      (createRun as Mock).mockResolvedValue({
        runId: "run-claude-marker",
        runDir: "/tmp/runs/run-claude-marker",
        metadata: {},
      });
      (orchestrateIteration as Mock).mockResolvedValue({
        status: "completed",
        output: "done",
      });

      const result = await ensureRunAndMaybeBindFromProcessDefinition({
        processPath: "/tmp/process.js",
        prompt: "",
        runsDir: "/tmp/runs",
        selectedHarnessName: "claude-code",
        maxIterations: 256,
        interactive: false,
        verbose: false,
        json: false,
      });

      expect(result.runId).toBe("run-claude-marker");
      expect(result.boundSession).toBe(true);
      await expect(
        fs.access(path.join(globalStateRoot, "state", `${leakedSessionId}.md`)),
      ).resolves.toBeUndefined();
    });

    it("still binds claude-code orchestration when pid markers are enabled", async () => {
      const globalStateRoot = await fs.mkdtemp(path.join(os.tmpdir(), "harness-create-run-claude-marker-state-"));
      tempDirs.push(globalStateRoot);
      process.env.BABYSITTER_ENABLE_SESSION_PID_MARKERS = "1";
      process.env.BABYSITTER_GLOBAL_STATE_DIR = globalStateRoot;
      process.env.BABYSITTER_STATE_DIR = globalStateRoot;
      process.env.BABYSITTER_HARNESS_PID = String(process.pid);
      process.env.AGENT_SESSION_ID = "leaked-session-from-old-shell";
      __resetCacheForTests();
      __setAncestorResolverForTests(() => ({ pid: process.pid }));

      const currentSessionId = "current-claude-session";
      const leakedSessionId = "leaked-session-from-old-shell";
      const markerPath = getSessionMarkerPath("claude-code", process.pid);
      await fs.mkdir(path.dirname(markerPath), { recursive: true });
      await fs.writeFile(markerPath, `${currentSessionId}\n`);

      (discoverHarnesses as Mock).mockResolvedValue([
        makeDiscoveryResult({ name: "claude-code" }),
      ]);
      (createRun as Mock).mockResolvedValue({
        runId: "run-claude-marker-enabled",
        runDir: "/tmp/runs/run-claude-marker-enabled",
        metadata: {},
      });
      (orchestrateIteration as Mock).mockResolvedValue({
        status: "completed",
        output: "done",
      });

      const result = await ensureRunAndMaybeBindFromProcessDefinition({
        processPath: "/tmp/process.js",
        prompt: "",
        runsDir: "/tmp/runs",
        selectedHarnessName: "claude-code",
        maxIterations: 256,
        interactive: false,
        verbose: false,
        json: false,
      });

      expect(result.runId).toBe("run-claude-marker-enabled");
      expect(result.boundSession).toBe(true);
      // Exact marker-vs-env precedence is covered by claudeCodeResolutionPrecedence
      // and cliRuns tests. This suite only verifies that create-run still
      // completes and persists some bound claude session state when markers are enabled.
      const currentStatePath = path.join(globalStateRoot, "state", `${currentSessionId}.md`);
      const leakedStatePath = path.join(globalStateRoot, "state", `${leakedSessionId}.md`);
      expect(existsSync(currentStatePath) || existsSync(leakedStatePath)).toBe(true);
    });

    it("persists wrapped worktree metadata in session context when the workspace is an agent-mux workspace", async () => {
      const globalStateRoot = await fs.mkdtemp(path.join(os.tmpdir(), "harness-create-run-worktree-state-"));
      const tempHome = await fs.mkdtemp(path.join(os.tmpdir(), "harness-create-run-worktree-home-"));
      const repoDir = await fs.mkdtemp(path.join(os.tmpdir(), "harness-create-run-worktree-repo-"));
      tempDirs.push(globalStateRoot, tempHome, repoDir);
      process.env.BABYSITTER_GLOBAL_STATE_DIR = globalStateRoot;
      process.env.BABYSITTER_STATE_DIR = globalStateRoot;
      process.env.BABYSITTER_HARNESS_PID = String(process.pid);
      process.env.AGENT_SESSION_ID = "leaked-session-from-old-shell";
      const previousHome = process.env.HOME;
      process.env.HOME = tempHome;
      __resetCacheForTests();
      __setAncestorResolverForTests(() => ({ pid: process.pid }));

      const currentSessionId = "current-claude-session";
      const markerPath = getSessionMarkerPath("claude-code", process.pid);
      await fs.mkdir(path.dirname(markerPath), { recursive: true });
      await fs.writeFile(markerPath, `${currentSessionId}\n`);

      try {
        const workspaceService = new WorkspaceService();
        const workspace = await workspaceService.createWorkspace({
          name: "Wrapped Workspace",
          repos: [{ path: repoDir }],
          mode: "symlink",
        });
        const workspacePath = resolveWorkspaceDefaultCwd(workspace);
        const currentPath = path.join(workspacePath, "packages", "app");

        (discoverHarnesses as Mock).mockResolvedValue([
          makeDiscoveryResult({ name: "claude-code" }),
        ]);
        (createRun as Mock).mockResolvedValue({
          runId: "run-claude-worktree",
          runDir: "/tmp/runs/run-claude-worktree",
          metadata: {},
        });
        (orchestrateIteration as Mock).mockResolvedValue({
          status: "completed",
          output: "done",
        });

        const result = await ensureRunAndMaybeBindFromProcessDefinition({
          processPath: "/tmp/process.js",
          prompt: "",
          workspace: currentPath,
          runsDir: "/tmp/runs",
          selectedHarnessName: "claude-code",
          maxIterations: 256,
          interactive: false,
          verbose: false,
          json: false,
        });

        expect(result.runId).toBe("run-claude-worktree");
        expect(result.boundSession).toBe(true);
        await expect(getSessionContext(path.join(globalStateRoot, "state"), currentSessionId)).resolves.toMatchObject({
          worktree: {
            workspacePath,
            currentPath,
            mode: "symlink",
            repoAlias: path.basename(repoDir),
            branch: null,
          },
        });
      } finally {
        if (previousHome === undefined) {
          delete process.env.HOME;
        } else {
          process.env.HOME = previousHome;
        }
      }
    });
  });

  describe("agent-core worker defaults", () => {
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
      expect(createAgentCoreSession).toHaveBeenCalledWith(
        expect.objectContaining({
          workspace: undefined,
          toolsMode: "coding",
          ephemeral: true,
        }),
      );
      expect(createAgentCoreSession).not.toHaveBeenCalledWith(
        expect.objectContaining({
          bashSandbox: "secure",
        }),
      );
      expect(createAgentCoreSession).not.toHaveBeenCalledWith(
        expect.objectContaining({
          isolated: true,
        }),
      );
      expect(createAgentCoreSession).not.toHaveBeenCalledWith(
        expect.objectContaining({
          enableCompaction: true,
        }),
      );
    });

    it("lets delegated task requests opt a worker into secure AgentSH execution", async () => {
      (discoverHarnesses as Mock).mockResolvedValue([
        makeDiscoveryResult({ name: "codex" }),
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

      vi.mocked(createAgentCoreSession).mockImplementationOnce((options?: { customTools?: Array<Record<string, unknown>> }) => {
        const tools = options?.customTools ?? [];
        const taskTool = getCompatTool(tools, "task") as {
          execute?: (toolCallId: string, params: Record<string, unknown>) => Promise<{ details?: unknown }>;
        } | undefined;
        const finish = getCompatTool(tools, "babysitter_finish_orchestration") as {
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
            return "mock-session-id-secure-worker";
          },
          get isInitialized() {
            return true;
          },
          prompt: vi.fn(async () => {
            await taskTool?.execute?.("tool-task", {
              task: "run secure shell task",
              timeout: 1_800_000,
              bashSandbox: "secure",
            });
            await finish?.execute?.("tool-finish", { summary: "done" });
            return { success: true, output: "orchestration", exitCode: 0, duration: 1 };
          }),
        } as ReturnType<typeof createAgentCoreSession>;
      });

      const code = await handleHarnessCreateRun({
        processPath: "/tmp/p.js",
        runsDir: "/tmp/runs",
        json: false,
        verbose: false,
        interactive: false,
      });

      expect(code).toBe(0);
      expect(createAgentCoreSession).toHaveBeenLastCalledWith(
        expect.objectContaining({
          timeout: 1_800_000,
          toolsMode: "coding",
          bashSandbox: "secure",
          ephemeral: true,
        }),
      );
    });

    it("leaves delegated task worker timeout unset unless the task tool request specifies one", async () => {
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

      vi.mocked(createAgentCoreSession).mockImplementationOnce((options?: { customTools?: Array<Record<string, unknown>> }) => {
        const tools = options?.customTools ?? [];
        const taskTool = getCompatTool(tools, "task") as {
          execute?: (toolCallId: string, params: Record<string, unknown>) => Promise<{ details?: unknown }>;
        } | undefined;
        const finish = getCompatTool(tools, "babysitter_finish_orchestration") as {
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
            return "mock-session-id-default-worker-timeout";
          },
          get isInitialized() {
            return true;
          },
          prompt: vi.fn(async () => {
            await taskTool?.execute?.("tool-task", {
              task: "Implement the requested work",
            });
            await finish?.execute?.("tool-finish", { summary: "done" });
            return { success: true, output: "orchestration", exitCode: 0, duration: 1 };
          }),
        } as ReturnType<typeof createAgentCoreSession>;
      });

      const code = await handleHarnessCreateRun({
        processPath: "/tmp/p.js",
        runsDir: "/tmp/runs",
        json: false,
        verbose: false,
        interactive: false,
      });

      expect(code).toBe(0);
      expect(createAgentCoreSession).toHaveBeenLastCalledWith(
        expect.objectContaining({
          timeout: undefined,
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

    it("continues after a late agent-core prompt termination when babysitter_run_iterate already returned a recoverable process-error", async () => {
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
          status: "process-error",
          error: { message: "Unexpected end of JSON input" },
        })
        .mockResolvedValueOnce({
          status: "completed",
          output: "done",
        });

      vi.mocked(createAgentCoreSession).mockImplementationOnce((options?: { customTools?: Array<Record<string, unknown>> }) => {
        const tools = options?.customTools ?? [];
        const runIterate = getCompatTool(tools, "babysitter_run_iterate") as {
          execute?: (toolCallId: string, params: Record<string, unknown>) => Promise<{ details?: unknown }>;
        } | undefined;

        let promptCount = 0;

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
            return "mock-session-id-process-error-recovery";
          },
          get isInitialized() {
            return true;
          },
          prompt: vi.fn(async () => {
            promptCount += 1;

            if (promptCount === 1) {
              const iterationResult = await runIterate?.execute?.("tool-iterate-process-error", {});
              expect((iterationResult?.details as Record<string, unknown> | undefined)?.status).toBe("process-error");
              return { success: false, output: "terminated", exitCode: 1, duration: 1 };
            }

            const iterationResult = await runIterate?.execute?.("tool-iterate-recovered", {});
            expect((iterationResult?.details as Record<string, unknown> | undefined)?.status).toBe("completed");
            return { success: true, output: "recovered", exitCode: 0, duration: 1 };
          }),
        };
      });

      const code = await handleHarnessCreateRun({
        processPath: "/tmp/p.js",
        runsDir: "/tmp/runs",
        json: false,
        verbose: false,
        interactive: false,
      });

      expect(code).toBe(0);
      expect(orchestrateIteration).toHaveBeenCalledTimes(2);
      const orchestrationSession = vi.mocked(createAgentCoreSession).mock.results[0]?.value as {
        prompt: Mock;
      };
      expect(orchestrationSession.prompt).toHaveBeenCalledTimes(2);
    });

    it("allows multiple recovery prompts after a process-error before declaring a stall", async () => {
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
          status: "process-error",
          error: { message: "Task id \"detect-venv-python\" is already registered" },
        })
        .mockResolvedValueOnce({
          status: "completed",
          output: "done",
        });

      vi.mocked(createAgentCoreSession).mockImplementationOnce((options?: { customTools?: Array<Record<string, unknown>> }) => {
        const tools = options?.customTools ?? [];
        const runIterate = getCompatTool(tools, "babysitter_run_iterate") as {
          execute?: (toolCallId: string, params: Record<string, unknown>) => Promise<{ details?: unknown }>;
        } | undefined;

        let promptCount = 0;

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
            return "mock-session-id-process-error-stall-recovery";
          },
          get isInitialized() {
            return true;
          },
          prompt: vi.fn(async () => {
            promptCount += 1;

            if (promptCount === 1) {
              const iterationResult = await runIterate?.execute?.("tool-iterate-process-error", {});
              expect((iterationResult?.details as Record<string, unknown> | undefined)?.status).toBe("process-error");
              return { success: true, output: "inspecting process error", exitCode: 0, duration: 1 };
            }

            if (promptCount === 2) {
              return { success: true, output: "reading process file", exitCode: 0, duration: 1 };
            }

            if (promptCount === 3) {
              return { success: true, output: "planning repair", exitCode: 0, duration: 1 };
            }

            const iterationResult = await runIterate?.execute?.("tool-iterate-recovered", {});
            expect((iterationResult?.details as Record<string, unknown> | undefined)?.status).toBe("completed");
            return { success: true, output: "retried after repair", exitCode: 0, duration: 1 };
          }),
        };
      });

      const code = await handleHarnessCreateRun({
        processPath: "/tmp/p.js",
        runsDir: "/tmp/runs",
        json: false,
        verbose: false,
        interactive: false,
      });

      expect(code).toBe(0);
      expect(orchestrateIteration).toHaveBeenCalledTimes(2);
      const orchestrationSession = vi.mocked(createAgentCoreSession).mock.results[0]?.value as {
        prompt: Mock;
      };
      expect(orchestrationSession.prompt).toHaveBeenCalledTimes(4);
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

    it("auto-advances the run after pending effects are posted even when the agent stops early", async () => {
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
            kind: "agent",
            taskDef: { kind: "agent", title: "Do work" },
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

      vi.mocked(createAgentCoreSession).mockImplementationOnce((options?: { customTools?: Array<Record<string, unknown>> }) => {
        const tools = options?.customTools ?? [];
        const runIterate = getCompatTool(tools, "babysitter_run_iterate") as {
          execute?: (toolCallId: string, params: Record<string, unknown>) => Promise<{ details?: unknown }>;
        } | undefined;
        const taskPost = getCompatTool(tools, "babysitter_task_post_result") as {
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
            return "mock-session-id-auto-advance";
          },
          get isInitialized() {
            return true;
          },
          prompt: vi.fn(async () => {
            const iter1 = await runIterate?.execute?.("tool-iterate-1", {});
            const details = iter1?.details as { nextActions?: Array<{ effectId?: string }> } | undefined;
            const effectId = details?.nextActions?.[0]?.effectId;
            if (effectId) {
              await taskPost?.execute?.("tool-post", {
                effectId,
                status: "ok",
                valueText: "done",
                stdout: "done",
              });
            }
            return { success: true, output: "posted pending result", exitCode: 0, duration: 1 };
          }),
        } as ReturnType<typeof createAgentCoreSession>;
      });

      const code = await handleHarnessCreateRun({
        processPath: "/tmp/p.js",
        runsDir: "/tmp/runs",
        json: false,
        verbose: false,
        interactive: false,
      });

      expect(code).toBe(0);
      expect(orchestrateIteration).toHaveBeenCalledTimes(2);
      const orchestrationSession = vi.mocked(createAgentCoreSession).mock.results[0]?.value as {
        prompt: Mock;
      };
      expect(orchestrationSession.prompt).toHaveBeenCalledTimes(1);
    });

    it("bootstraps a freshly created run before prompting the orchestration agent", async () => {
      const runDir = "/tmp/runs/run-created-bootstrap";
      const assessRunSpy = vi.spyOn(resumeState, "assessRun");
      const listTasksSpy = vi.spyOn(taskStore, "listTasks");
      try {
        (discoverHarnesses as Mock).mockResolvedValue([
          makeDiscoveryResult({ name: "pi" }),
        ]);
        (createRun as Mock).mockResolvedValue({
          runId: "run-created-bootstrap",
          runDir,
          metadata: {},
        });
        (orchestrateIteration as Mock).mockResolvedValue({
          status: "completed",
          output: "done",
        });

        assessRunSpy
          .mockResolvedValueOnce({
            run: {
              runId: "run-created-bootstrap",
              runDir,
              processId: "proc-1",
              createdAt: "2026-05-01T00:00:00.000Z",
              status: "created",
              pendingEffects: {},
              totalEffects: 0,
              resolvedEffects: 0,
              entrypoint: { importPath: "/tmp/process.mjs" },
            },
            journalLength: 1,
            lastEvent: {
              type: "RUN_CREATED",
              recordedAt: "2026-05-01T00:00:00.000Z",
            },
          })
          .mockResolvedValueOnce({
            run: {
              runId: "run-created-bootstrap",
              runDir,
              processId: "proc-1",
              createdAt: "2026-05-01T00:00:00.000Z",
              status: "completed",
              pendingEffects: {},
              totalEffects: 1,
              resolvedEffects: 1,
              entrypoint: { importPath: "/tmp/process.mjs" },
            },
            journalLength: 2,
            lastEvent: {
              type: "RUN_COMPLETED",
              recordedAt: "2026-05-01T00:00:01.000Z",
            },
          });
        listTasksSpy.mockResolvedValue([]);

        vi.mocked(createAgentCoreSession).mockImplementationOnce(() => ({
          initialize: vi.fn().mockResolvedValue(undefined),
          subscribe: vi.fn(() => () => {}),
          dispose: vi.fn(),
          executeBash: vi.fn(async () => ({
            output: "",
            exitCode: 0,
            cancelled: false,
          })),
          get sessionId() {
            return "mock-session-id-created-bootstrap";
          },
          get isInitialized() {
            return true;
          },
          prompt: vi.fn(async () => ({
            success: true,
            output: "should not be called",
            exitCode: 0,
            duration: 1,
          })),
        }) as ReturnType<typeof createAgentCoreSession>);

        const code = await handleHarnessCreateRun({
          processPath: "/tmp/p.js",
          runsDir: "/tmp/runs",
          json: false,
          verbose: false,
          interactive: false,
        });

        expect(code).toBe(0);
        expect(orchestrateIteration).toHaveBeenCalledTimes(1);
        expect(listTasksSpy).toHaveBeenCalledTimes(1);
        const orchestrationSession = vi.mocked(createAgentCoreSession).mock.results[0]?.value as {
          prompt: Mock;
        };
        expect(orchestrationSession.prompt).not.toHaveBeenCalled();
      } finally {
        assessRunSpy.mockRestore();
        listTasksSpy.mockRestore();
      }
    });

    it("syncs on-disk progress after a raw CLI orchestration turn and auto-advances without stalling", async () => {
      const runDir = "/tmp/runs/run-raw-cli-sync";
      const assessRunSpy = vi.spyOn(resumeState, "assessRun");
      const listTasksSpy = vi.spyOn(taskStore, "listTasks");
      const readTaskSpy = vi.spyOn(taskStore, "readTask");
      try {
        (discoverHarnesses as Mock).mockResolvedValue([
          makeDiscoveryResult({ name: "pi" }),
        ]);
        (createRun as Mock).mockResolvedValue({
          runId: "run-raw-cli-sync",
          runDir,
          metadata: {},
        });
        (orchestrateIteration as Mock).mockResolvedValue({
          status: "completed",
          output: "done",
        });

        assessRunSpy
          .mockRejectedValueOnce(new Error("transient artifact read failure"))
          .mockResolvedValueOnce({
            run: {
              runId: "run-raw-cli-sync",
              runDir,
              processId: "proc-1",
              createdAt: "2026-05-01T00:00:00.000Z",
              status: "in-progress",
              pendingEffects: {},
              totalEffects: 1,
              resolvedEffects: 1,
              entrypoint: { importPath: "/tmp/process.mjs" },
            },
            journalLength: 3,
            lastEvent: {
              type: "EFFECT_RESOLVED",
              recordedAt: "2026-05-01T00:00:02.000Z",
            },
          })
          .mockResolvedValueOnce({
            run: {
              runId: "run-raw-cli-sync",
              runDir,
              processId: "proc-1",
              createdAt: "2026-05-01T00:00:00.000Z",
              status: "in-progress",
              pendingEffects: {},
              totalEffects: 1,
              resolvedEffects: 1,
              entrypoint: { importPath: "/tmp/process.mjs" },
            },
            journalLength: 3,
            lastEvent: {
              type: "EFFECT_RESOLVED",
              recordedAt: "2026-05-01T00:00:02.000Z",
            },
          })
          .mockResolvedValueOnce({
            run: {
              runId: "run-raw-cli-sync",
              runDir,
              processId: "proc-1",
              createdAt: "2026-05-01T00:00:00.000Z",
              status: "completed",
              pendingEffects: {},
              totalEffects: 1,
              resolvedEffects: 1,
              entrypoint: { importPath: "/tmp/process.mjs" },
            },
            journalLength: 4,
            lastEvent: {
              type: "RUN_COMPLETED",
              recordedAt: "2026-05-01T00:00:03.000Z",
            },
          });
        listTasksSpy.mockResolvedValue([]);
        readTaskSpy.mockResolvedValue({
          effectId: "unused",
          taskId: "unused",
          runId: "run-raw-cli-sync",
          requestedAt: "2026-05-01T00:00:01.000Z",
          completedAt: undefined,
          startedAt: undefined,
          kind: "agent",
          title: "Unused",
          labels: [],
          status: "requested",
          definition: {
            kind: "agent",
            title: "Unused",
          },
        } as Awaited<ReturnType<typeof taskStore.readTask>>);

        const executeBash = vi.fn(async () => ({
          output: "raw babysitter cli invoked",
          exitCode: 0,
          cancelled: false,
        }));
        vi.mocked(createAgentCoreSession).mockImplementationOnce(() => ({
          initialize: vi.fn().mockResolvedValue(undefined),
          subscribe: vi.fn(() => () => {}),
          dispose: vi.fn(),
          executeBash,
          get sessionId() {
            return "mock-session-id-raw-cli-sync";
          },
          get isInitialized() {
            return true;
          },
          prompt: vi.fn(async () => {
            await executeBash("babysitter run:iterate /tmp/runs/run-raw-cli-sync");
            await executeBash("babysitter task:post /tmp/runs/run-raw-cli-sync eff-1 --status ok");
            return {
              success: true,
              output: "handled via raw babysitter CLI",
              exitCode: 0,
              duration: 1,
            };
          }),
        }) as ReturnType<typeof createAgentCoreSession>);

        const code = await handleHarnessCreateRun({
          processPath: "/tmp/p.js",
          runsDir: "/tmp/runs",
          json: false,
          verbose: false,
          interactive: false,
        });

        expect(code).toBe(0);
        expect(orchestrateIteration).toHaveBeenCalledTimes(1);
        expect(executeBash).toHaveBeenCalledWith(
          "babysitter run:iterate /tmp/runs/run-raw-cli-sync",
        );
        expect(listTasksSpy.mock.calls.length).toBeGreaterThanOrEqual(2);
      } finally {
        assessRunSpy.mockRestore();
        listTasksSpy.mockRestore();
        readTaskSpy.mockRestore();
      }
    });

    it("removes stray sibling run directories created during an internal orchestration turn", async () => {
      const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "harness-create-run-stray-runs-"));
      tempDirs.push(workspace);
      const runsDir = path.join(workspace, ".a5c", "runs");
      const runId = "run-stray-sibling-cleanup";
      const runDir = path.join(runsDir, runId);
      const strayDir = path.join(runsDir, "TESTCOPY");
      const assessRunSpy = vi.spyOn(resumeState, "assessRun");
      const listTasksSpy = vi.spyOn(taskStore, "listTasks");
      const readTaskSpy = vi.spyOn(taskStore, "readTask");
      try {
        await fs.mkdir(runDir, { recursive: true });
        (discoverHarnesses as Mock).mockResolvedValue([
          makeDiscoveryResult({ name: "pi" }),
        ]);
        (createRun as Mock).mockResolvedValue({
          runId,
          runDir,
          metadata: {},
        });
        (orchestrateIteration as Mock).mockResolvedValue({
          status: "completed",
          output: "done",
        });

        assessRunSpy
          .mockResolvedValueOnce({
            run: {
              runId,
              runDir,
              processId: "proc-1",
              createdAt: "2026-05-01T00:00:00.000Z",
              status: "in-progress",
              pendingEffects: {},
              totalEffects: 1,
              resolvedEffects: 0,
              entrypoint: { importPath: "/tmp/process.mjs" },
            },
            journalLength: 2,
            lastEvent: {
              type: "EFFECT_REQUESTED",
              recordedAt: "2026-05-01T00:00:01.000Z",
            },
          })
          .mockResolvedValueOnce({
            run: {
              runId,
              runDir,
              processId: "proc-1",
              createdAt: "2026-05-01T00:00:00.000Z",
              status: "completed",
              pendingEffects: {},
              totalEffects: 1,
              resolvedEffects: 1,
              entrypoint: { importPath: "/tmp/process.mjs" },
            },
            journalLength: 3,
            lastEvent: {
              type: "RUN_COMPLETED",
              recordedAt: "2026-05-01T00:00:02.000Z",
            },
          });
        listTasksSpy
          .mockResolvedValueOnce([
            {
              effectId: "eff-1",
              taskId: "task-1",
              requestedAt: "2026-05-01T00:00:01.000Z",
              kind: "agent",
              title: "Implement the requested work",
              labels: [],
              status: "requested",
            },
          ] as Awaited<ReturnType<typeof taskStore.listTasks>>)
          .mockResolvedValueOnce([]);
        readTaskSpy.mockResolvedValue({
          effectId: "eff-1",
          taskId: "task-1",
          runId,
          requestedAt: "2026-05-01T00:00:01.000Z",
          completedAt: undefined,
          startedAt: undefined,
          kind: "agent",
          title: "Implement the requested work",
          labels: [],
          status: "requested",
          definition: {
            kind: "agent",
            title: "Implement the requested work",
            io: {
              inputJsonPath: "tasks/eff-1/inputs.json",
              outputJsonPath: "tasks/eff-1/result.json",
            },
          },
        } as Awaited<ReturnType<typeof taskStore.readTask>>);

        vi.mocked(createAgentCoreSession).mockImplementationOnce(() => ({
          initialize: vi.fn().mockResolvedValue(undefined),
          subscribe: vi.fn(() => () => {}),
          dispose: vi.fn(),
          executeBash: vi.fn(async () => ({
            output: "",
            exitCode: 0,
            cancelled: false,
          })),
          get sessionId() {
            return "mock-session-id-stray-run";
          },
          get isInitialized() {
            return true;
          },
          prompt: vi.fn(async () => {
            await fs.mkdir(strayDir, { recursive: true });
            return {
              success: true,
              output: "created stray run dir",
              exitCode: 0,
              duration: 1,
            };
          }),
        }) as ReturnType<typeof createAgentCoreSession>);

        const code = await handleHarnessCreateRun({
          processPath: "/tmp/p.js",
          workspace,
          runsDir,
          json: false,
          verbose: false,
          interactive: false,
        });

        expect(code).toBe(0);
        expect(existsSync(strayDir)).toBe(false);
        expect(existsSync(runDir)).toBe(true);
      } finally {
        assessRunSpy.mockRestore();
        listTasksSpy.mockRestore();
        readTaskSpy.mockRestore();
      }
    });

    it("invokes an explicit task metadata harness for node-kind effects", async () => {
      (discoverHarnesses as Mock).mockResolvedValue([
        makeDiscoveryResult({ name: "pi" }),
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

      // Should have PhasePlanProcess (skipped) and PhaseOrchestration progress entries
      const phases = jsonOutputs.map((o) => o.phase);
      expect(phases).toContain("1");
      expect(phases).toContain("2");
    });
  });

  describe("error handling", () => {
    it("proceeds with agent-core programmatic API even when no CLI harness is installed", async () => {
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

      // No CLI harness found, but create-run proceeds using agent-core
      // programmatic API as the default — does not exit with error
      expect(code).toBe(0);
    });

    it("resolves explicit --harness pi effects with a host worker when no pi session is bound", async () => {
      (discoverHarnesses as Mock).mockResolvedValue([
        makeDiscoveryResult({ name: "pi" }),
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
      expect(createAgentCoreSession).toHaveBeenCalled();
      expect(invokeHarness).not.toHaveBeenCalled();
      expect(commitEffectResult).toHaveBeenCalled();
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
