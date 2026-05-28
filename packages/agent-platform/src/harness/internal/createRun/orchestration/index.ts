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

export async function runOrchestrationPhase(
  args: RunOrchestrationPhaseArgs,
): Promise<number> {
  const externalExitCode = await runExternalOrchestrationPhase(args);
  if (externalExitCode !== undefined) {
    return externalExitCode;
  }

  // Raw agent-core session (no Pi/amux backend) can't drive the orchestration
  // loop via tool calls. Fall back to CLI-based orchestration.
  const backend = resolveAgentCoreBackendForHarness(args.selectedHarnessName);
  if (!backend) {
    return runCliOrchestration(args);
  }

  return runInternalOrchestrationPhase(args);
}

async function runCliOrchestration(args: RunOrchestrationPhaseArgs): Promise<number> {
  const { execSync } = await import("node:child_process");
  const path = await import("node:path");

  const processPath = args.processPath;
  const workspace = args.workspace ?? process.cwd();
  const runsDir = args.runsDir;
  const prompt = args.prompt ?? "";
  const model = args.model;

  // Create run via CLI
  const createArgs = [
    "run:create",
    "--entry", `${path.resolve(processPath)}#process`,
    "--process-id", path.basename(processPath, path.extname(processPath)),
    "--prompt", prompt,
    "--harness", "claude-code",
    "--json",
  ];
  if (runsDir) createArgs.push("--runs-dir", runsDir);

  let runDir: string;
  try {
    const createResult = execSync(`babysitter ${createArgs.join(" ")}`, {
      cwd: workspace,
      encoding: "utf8",
      timeout: 30_000,
      env: { ...process.env },
    });
    const parsed = JSON.parse(createResult);
    runDir = parsed.runDir;
    if (!args.json) {
      process.stderr.write(`\x1b[32mRun created:\x1b[0m ${runDir}\n`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!args.json) {
      process.stderr.write(`\x1b[31mFailed to create run:\x1b[0m ${msg}\n`);
    }
    return 1;
  }

  // Iterate loop
  const maxIterations = args.maxIterations ?? 20;
  for (let i = 1; i <= maxIterations; i++) {
    try {
      const iterResult = execSync(`babysitter run:iterate "${runDir}" --json --iteration ${i}`, {
        cwd: workspace,
        encoding: "utf8",
        timeout: 60_000,
        env: { ...process.env },
      });
      const parsed = JSON.parse(iterResult);

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
        for (const action of parsed.nextActions) {
          await resolveAndPostEffect(action, runDir, workspace, model);
        }
      } else if (parsed.status === "none") {
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

async function resolveAndPostEffect(
  action: { effectId: string; kind: string; taskDef?: { agent?: { prompt?: { instructions?: string[] } }; shell?: { command?: string }; title?: string } },
  runDir: string,
  workspace: string,
  model?: string,
): Promise<void> {
  const { execSync } = await import("node:child_process");
  const { createAgentCoreSession } = await import("../utils");

  let value: string;

  if (action.kind === "agent" || action.kind === "skill") {
    const prompt = action.taskDef?.agent?.prompt?.instructions?.join("\n")
      ?? action.taskDef?.title
      ?? "Execute this task";

    const session = createAgentCoreSession({
      workspace,
      model,
      ephemeral: true,
    });
    try {
      const result = await session.prompt(prompt);
      value = JSON.stringify({ output: result.output, success: result.success });
    } finally {
      session.dispose();
    }
  } else if (action.kind === "shell") {
    const command = action.taskDef?.shell?.command ?? "echo ok";
    try {
      const output = execSync(command, { cwd: workspace, encoding: "utf8", timeout: 120_000 });
      value = JSON.stringify({ stdout: output, exitCode: 0 });
    } catch (err: unknown) {
      const exitCode = (err as { status?: number }).status ?? 1;
      const stderr = (err as { stderr?: string }).stderr ?? "";
      value = JSON.stringify({ stdout: "", stderr, exitCode });
    }
  } else if (action.kind === "breakpoint") {
    value = JSON.stringify({ approved: true, response: "Auto-approved" });
  } else {
    value = JSON.stringify({ output: "Skipped", success: true });
  }

  // Post result
  try {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const taskDir = path.join(runDir, "tasks", action.effectId);
    await fs.mkdir(taskDir, { recursive: true });
    await fs.writeFile(path.join(taskDir, "output.json"), value);
    execSync(
      `babysitter task:post "${runDir}" ${action.effectId} --status ok --value tasks/${action.effectId}/output.json --json`,
      { cwd: workspace, encoding: "utf8", timeout: 30_000, env: { ...process.env } },
    );
  } catch {
    // Best effort
  }
}
