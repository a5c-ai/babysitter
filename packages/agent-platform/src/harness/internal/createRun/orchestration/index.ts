/**
 * Compatibility surface for PhaseOrchestration helpers.
 *
 * The implementation lives under ./orchestration/ so the command stays
 * split by responsibility instead of accreting more top-level helper files.
 */

export {
  MAX_CONSECUTIVE_PROCESS_ERROR_STALLS,
  MAX_CONSECUTIVE_STALLS,
  MAX_CONSECUTIVE_TIMEOUTS,
  MAX_PROCESS_ERROR_RECOVERIES,
} from "./constants";
export {
  orchestrateIterationWithProcessLoadRetry,
  readProcessFileFingerprint,
  resolveEffect,
  resolveEffectWithRetry,
  resolveHarnessSessionIdForBinding,
} from "./effects";
export { runExternalOrchestrationPhase } from "./externalPhase";
export { runInternalOrchestrationPhase } from "./internalPhase";
export { subscribeVerbosePiEvents } from "./verbose";

import type { RunOrchestrationPhaseArgs } from "./types";
import { runExternalOrchestrationPhase } from "./externalPhase";
import { runInternalOrchestrationPhase } from "./internalPhase";
import {
  resolveAgentCoreBackendForHarness,
} from "../utils";

const importOptionalModule: (specifier: string) => Promise<unknown> = (() => {
  if (process.env.VITEST) {
    return (specifier) => import(specifier);
  }
  return new Function("specifier", "return import(specifier)") as (
    specifier: string,
  ) => Promise<unknown>;
})();

export async function runOrchestrationPhase(
  args: RunOrchestrationPhaseArgs,
): Promise<number> {
  const externalExitCode = await runExternalOrchestrationPhase(args);
  if (externalExitCode !== undefined) {
    return externalExitCode;
  }

  return runInternalOrchestrationPhase(args);
}

async function runCliOrchestration(args: RunOrchestrationPhaseArgs): Promise<number> {
  const { execFileSync } = await import("node:child_process");
  const path = await import("node:path");

  const processPath = args.processPath;
  const workspace = args.workspace ?? process.cwd();
  const runsDir = args.runsDir;
  const prompt = args.prompt ?? "";
  const model = args.model;

  // Resolve babysitter CLI: prefer the SDK's dist/cli/main.js over global binary
  let babysitterBin = "babysitter";
  try {
    const sdkCliPath = require.resolve("@a5c-ai/babysitter-sdk/dist/cli/main.js");
    babysitterBin = `${process.execPath} ${sdkCliPath}`;
  } catch {
    // Fall back to global babysitter binary
  }

  // Create run via CLI — pass prompt both as metadata and as process inputs
  const fsPromises = await import("node:fs/promises");
  const inputsFile = path.join(workspace, `.a5c-omni-inputs-${Date.now()}.json`);
  await fsPromises.writeFile(inputsFile, JSON.stringify({ prompt, request: prompt }));
  const createArgs = [
    "run:create",
    "--entry", `${path.resolve(processPath)}#process`,
    "--process-id", path.basename(processPath, path.extname(processPath)),
    "--prompt", prompt,
    "--inputs", inputsFile,
    "--harness", "agent-core",
    "--json",
  ];
  if (runsDir) createArgs.push("--runs-dir", runsDir);

  let runDir: string;
  const babysitterBinParts = babysitterBin.split(" ");
  const babysitterCmd = babysitterBinParts[0]!;
  const babysitterPrefix = babysitterBinParts.slice(1);
  try {
    const createResult = execFileSync(babysitterCmd, [...babysitterPrefix, ...createArgs], {
      cwd: workspace,
      encoding: "utf8",
      timeout: 30_000,
      env: { ...process.env },
    });
    const parsed = JSON.parse(createResult);
    runDir = parsed.runDir;
    await fsPromises.unlink(inputsFile).catch(() => {});
    if (!args.json) {
      process.stderr.write(`\x1b[32mRun created:\x1b[0m ${runDir}\n`);
    }
  } catch (err) {
    await fsPromises.unlink(inputsFile).catch(() => {});
    const msg = err instanceof Error ? err.message : String(err);
    if (!args.json) {
      process.stderr.write(`\x1b[31mFailed to create run:\x1b[0m ${msg}\n`);
    }
    return 1;
  }

  // Iterate loop — cap at 20 for CLI orchestration regardless of caller
  const maxIterations = Math.min(args.maxIterations ?? 20, 20);
  let consecutiveNoEffects = 0;
  for (let i = 1; i <= maxIterations; i++) {
    process.stderr.write(`[omni-orchestration] iteration ${i}/${maxIterations} starting\n`);
    try {
      const iterArgs = [...babysitterPrefix, "run:iterate", runDir, "--json", "--iteration", String(i)];
      process.stderr.write(`[omni-orchestration] exec: ${babysitterCmd} ${iterArgs.join(" ")}\n`);
      const iterResult = execFileSync(babysitterCmd, iterArgs, {
        cwd: workspace,
        encoding: "utf8",
        timeout: 120_000,
        env: { ...process.env },
      });
      const parsed = JSON.parse(iterResult);
      process.stderr.write(`[omni-orchestration] iterate result: status=${parsed.status} actions=${parsed.nextActions?.length ?? 0} reason=${parsed.reason ?? 'n/a'}\n`);

      if (parsed.status === "completed") {
        if (!args.json) {
          process.stderr.write(`\x1b[32mRun completed.\x1b[0m\n`);
        }
        return 0;
      }
      if (parsed.status === "failed") {
        if (!args.json) {
          process.stderr.write(`\x1b[31mRun failed:\x1b[0m ${parsed.reason ?? "unknown"}\n`);
        }
        return 1;
      }

      // Handle pending effects
      if (parsed.nextActions?.length) {
        consecutiveNoEffects = 0;
        process.stderr.write(`[omni-orchestration] iteration ${i}: ${parsed.nextActions.length} pending effects to resolve\n`);
        for (const action of parsed.nextActions) {
          process.stderr.write(`[omni-orchestration] resolving effect ${action.effectId} (${action.kind})\n`);
          await resolveAndPostEffect(action, runDir, workspace, model, babysitterBin);
          process.stderr.write(`[omni-orchestration] effect ${action.effectId} resolved\n`);
        }
      } else if (parsed.status === "none") {
        consecutiveNoEffects++;
        if (consecutiveNoEffects >= 3) {
          if (!args.json) {
            process.stderr.write(`\x1b[31mNo pending effects for ${consecutiveNoEffects} consecutive iterations — process may not be dispatching tasks.\x1b[0m\n`);
          }
          return 1;
        }
        if (!args.json) {
          process.stderr.write(`\x1b[33mNo pending effects at iteration ${i}\x1b[0m\n`);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!args.json) {
        process.stderr.write(`\x1b[31mIteration ${i} error:\x1b[0m ${msg}\n`);
      }
      return 1;
    }
  }

  if (!args.json) {
    process.stderr.write(`\x1b[31mMax iterations (${maxIterations}) reached.\x1b[0m\n`);
  }
  return 1;
}

export async function resolveAndPostEffect(
  action: { effectId: string; kind: string; taskDef?: { agent?: { prompt?: string | { instructions?: string[] } } & Record<string, unknown>; shell?: { command?: string }; title?: string } & Record<string, unknown> },
  runDir: string,
  workspace: string,
  model?: string,
  babysitterBin = "babysitter",
): Promise<void> {
  const { execFileSync, execSync } = await import("node:child_process");
  const { createAgentCoreSession } = await import("../utils");
  const babysitterParts = babysitterBin.split(" ");
  const bCmd = babysitterParts[0]!;
  const bPrefix = babysitterParts.slice(1);

  let value: string;

  const tasksMuxValue = await resolveViaTasksMuxForCli(action, workspace, model);
  if (tasksMuxValue !== undefined) {
    value = tasksMuxValue;
  } else if (action.kind === "agent" || action.kind === "skill") {
    const agentPrompt = action.taskDef?.agent?.prompt;
    const prompt = typeof agentPrompt === "string"
      ? agentPrompt
      : agentPrompt?.instructions?.join("\n")
        ?? action.taskDef?.title
        ?? "Execute this task";

    const session = createAgentCoreSession({
      workspace,
      model,
      ephemeral: true,
    });
    try {
      const result = await session.prompt(prompt);
      value = JSON.stringify(result.output ?? "");
    } finally {
      session.dispose();
    }
  } else if (action.kind === "shell") {
    const command = action.taskDef?.shell?.command ?? "echo ok";
    try {
      const output = execSync(command, { cwd: workspace, encoding: "utf8", timeout: 120_000 });
      value = JSON.stringify(output);
    } catch (err: unknown) {
      const stderr = (err as { stderr?: string }).stderr ?? "";
      value = JSON.stringify(stderr || "shell command failed");
    }
  } else if (action.kind === "breakpoint") {
    value = JSON.stringify("approved");
  } else {
    value = JSON.stringify("ok");
  }

  // Post result
  try {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const taskDir = path.join(runDir, "tasks", action.effectId);
    await fs.mkdir(taskDir, { recursive: true });
    await fs.writeFile(path.join(taskDir, "output.json"), value);
    execFileSync(bCmd, [...bPrefix, "task:post", runDir, action.effectId, "--status", "ok", "--value", `tasks/${action.effectId}/output.json`, "--json"], {
      cwd: workspace, encoding: "utf8", timeout: 30_000, env: { ...process.env },
    });
  } catch {
    // Best effort
  }
}

async function resolveViaTasksMuxForCli(
  action: { kind: string; taskDef?: { agent?: { prompt?: string | { instructions?: string[] } } & Record<string, unknown>; title?: string } & Record<string, unknown>; taskId?: string; effectId: string; labels?: string[] },
  workspace: string,
  model?: string,
): Promise<string | undefined> {
  if (action.kind !== "agent" && action.kind !== "breakpoint") {
    return undefined;
  }

  let mux: {
    routeTask?: (task: unknown, context?: unknown) => {
      responderType: string;
      responder?: { adapter?: string; model?: string; id?: string };
      unavailable?: boolean;
      reason?: string;
    };
    AgentMuxResponderBackend?: new (config?: Record<string, unknown>) => {
      submitBreakpoint(params: unknown): Promise<{
        answers: Array<{ text: string; responderId: string; responderName: string }>;
      }>;
    };
  };
  try {
    mux = await importOptionalModule("@a5c-ai/tasks-mux") as typeof mux;
  } catch {
    return undefined;
  }

  if (typeof mux.routeTask !== "function") {
    return undefined;
  }

  const decision = mux.routeTask(action.taskDef);
  if (decision.responderType === "internal" || decision.responderType === "human") {
    return undefined;
  }
  if (decision.responderType === "tracker") {
    if (!decision.unavailable) return undefined;
    return JSON.stringify({
      success: false,
      routedThrough: "tasks-mux",
      responderType: "tracker",
      error: decision.reason ?? "ExternalTrackerBackend unavailable",
    });
  }
  if (decision.responderType !== "agent") {
    return undefined;
  }
  if (typeof mux.AgentMuxResponderBackend !== "function") {
    throw new Error("tasks-mux AgentMuxResponderBackend is unavailable");
  }

  const prompt = buildCliAgentPrompt(action.taskDef);
  const backend = new mux.AgentMuxResponderBackend({
    adapter: decision.responder?.adapter ?? decision.responder?.id,
    model: decision.responder?.model ?? model,
    cwd: workspace,
  });
  const breakpoint = await backend.submitBreakpoint({
    text: prompt,
    context: {
      description: action.taskDef?.title ?? action.taskId ?? action.effectId,
      codeSnippets: [],
      fileReferences: [],
      tags: action.labels ?? [],
    },
    routing: {
      strategy: "single",
      targetResponders: decision.responder?.id ? [decision.responder.id] : [],
      timeoutMs: 300_000,
      presentToUser: false,
      responderType: "agent",
      adapter: decision.responder?.adapter ?? decision.responder?.id,
      model: decision.responder?.model ?? model,
    },
  });
  return JSON.stringify(breakpoint.answers[0]?.text ?? "");
}

function buildCliAgentPrompt(taskDef: { agent?: { prompt?: string | { instructions?: string[] } }; title?: string } | undefined): string {
  const agentPrompt = taskDef?.agent?.prompt;
  return typeof agentPrompt === "string"
    ? agentPrompt
    : agentPrompt?.instructions?.join("\n")
      ?? taskDef?.title
      ?? "Execute this task";
}
