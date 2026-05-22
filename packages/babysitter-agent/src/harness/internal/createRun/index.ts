/**
 * create-run command handler.
 *
 * Drives a full babysitter session lifecycle through three conceptual phases:
 *   PhaseUnderstandIntent - clarify intent and inspect the workspace
 *   PhasePlanProcess - author the process and establish the run
 *   PhaseOrchestration - drive the bound orchestration loop
 *
 * Both phases are driven through a Pi agent session and LLM-callable tools.
 * Interactive user input is exposed through an AskUserQuestion tool instead of
 * direct imperative prompts inside the host loop.
 *
 * This module is a thin coordinator that imports the phase implementations
 * from separate modules and exports the public API.
 */

import {
  type HarnessCreateRunArgs,
  type OutputMode,
  resolveOutputMode,
  RED,
  RESET,
  GREEN,
  BOLD,
  DIM,
  createReadlineInterface,
  readInteractivePrompt,
  buildPromptContext,
  loadSessionCompressionConfig,
  emitProgress,
  discoverHarnesses,
} from "./utils";
import { DEFAULTS, resolveRunsDir } from "@a5c-ai/babysitter-sdk";
import { getProcessOutputDir, runPlanProcessPhase } from "./planProcess";
import { runOrchestrationPhase } from "./orchestration";
import { normalizeBuiltInHarnessName } from "../../builtInHarness";

// ── Re-exports for backward compatibility ────────────────────────────

export type { HarnessCreateRunArgs } from "./utils";
/** @deprecated Use HarnessCreateRunArgs instead */
export type { HarnessCreateRunArgs as SessionCreateArgs } from "./utils";
export { selectHarness } from "./utils";
export { runOrchestrationPhase } from "./orchestration";

// ── Main Entry Point ─────────────────────────────────────────────────

export async function handleHarnessCreateRun(
  parsed: HarnessCreateRunArgs,
): Promise<number> {
  const {
    prompt: initialPrompt,
    harness: preferredHarness,
    processPath: providedProcessPath,
    workspace,
    model,
    maxIterations = DEFAULTS.maxIterations,
    runsDir: requestedRunsDir,
    json,
    verbose,
  } = parsed;
  const runsDir = requestedRunsDir ?? resolveRunsDir({ cwd: workspace ?? process.cwd() });

  const mode: OutputMode = resolveOutputMode(json, parsed.outputMode);
  const interactive = parsed.interactive ?? (mode === "cli" && process.stdin.isTTY === true);
  // TUI and amux-events modes: never create a readline interface
  const rl = (interactive && mode !== "tui" && mode !== "amux-events") ? createReadlineInterface() : null;

  try {
    let prompt = initialPrompt;
    if (!prompt && !providedProcessPath) {
      if (interactive && rl) {
        const userPrompt = await readInteractivePrompt(rl, mode);
        if (!userPrompt) {
          return 0; // User cancelled
        }
        prompt = userPrompt;
      } else {
        const error = "Either --prompt or --process must be provided";
        if (mode === "json") {
          console.error(
            JSON.stringify({ error: "MISSING_PROMPT", message: error }, null, 2),
          );
        } else if (mode === "cli") {
          process.stderr.write(`${RED}Error:${RESET} ${error}\n`);
        }
        return 1;
      }
    }

    const discovered = await discoverHarnesses();
    const selectedHarnessName = normalizeBuiltInHarnessName(preferredHarness ?? "agent-core");
    const compressionConfig = loadSessionCompressionConfig(workspace);
    const promptContext = buildPromptContext({
      workspace,
      selectedHarnessName,
      discovered,
      compressionConfig,
    });

    let processPath = providedProcessPath;
    let planningConversationSummary: string | undefined;
    if (processPath) {
      emitProgress({ phase: "1", status: "skipped", processPath }, json, verbose, mode);
    } else {
      const workDir = workspace ?? process.cwd();
      const planReport = await runPlanProcessPhase({
        invocationCommand: parsed.invocationCommand,
        prompt: prompt!,
        outputDir: getProcessOutputDir(workDir),
        workspace: workDir,
        model,
        runsDir,
        maxIterations,
        createRunOnReport: !parsed.planOnly,
        interactive,
        rl,
        json,
        verbose,
        compressionConfig,
        promptContext,
        selectedHarnessName,
        outputMode: mode,
      });
      processPath = planReport.processPath;
      planningConversationSummary = planReport.conversationSummary;
      parsed.existingRunId ??= planReport.runId;
      parsed.existingRunDir ??= planReport.runDir;
      parsed.existingSessionBound ??= planReport.sessionBound;
    }

    if (parsed.planOnly) {
      emitProgress({ phase: "2", status: "skipped-plan-only", processPath }, json, verbose, mode);
      if (mode === "json") {
        process.stdout.write(JSON.stringify({ ok: true, planOnly: true, processPath }) + "\n");
      } else if (mode === "cli") {
        process.stderr.write(`${GREEN}Process definition created: ${BOLD}${processPath}${RESET}\n`);
        process.stderr.write(`${DIM}Run /babysitter:call or babysitter-agent create-run --process ${processPath} to execute.${RESET}\n`);
      }
      return 0;
    }

    return await runOrchestrationPhase({
      invocationCommand: parsed.invocationCommand,
      processPath,
      prompt,
      workspace,
      model,
      runsDir,
      maxIterations,
      json,
      verbose,
      interactive,
      rl,
      selectedHarnessName,
      discovered,
      compressionConfig,
      promptContext,
      existingRunId: parsed.existingRunId,
      existingRunDir: parsed.existingRunDir,
      existingSessionBound: parsed.existingSessionBound,
      planningConversationSummary,
      outputMode: mode,
    });
  } finally {
    rl?.close();
  }
}

/** @deprecated Use handleHarnessCreateRun instead */
export const handleSessionCreate = handleHarnessCreateRun;
