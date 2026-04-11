/**
 * harness:create-run command handler.
 *
 * Drives a full babysitter session lifecycle through two agentic phases:
 *   Phase 1 - Unbound interview / intent / process-definition
 *   Phase 2 - Bound orchestration loop with hook-style continuation semantics
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
} from "./harnessUtils";
import { getProcessOutputDir, runProcessDefinitionPhase } from "./harnessPhase1";
import { runOrchestrationPhase } from "./harnessPhase2";

// ── Re-exports for backward compatibility ────────────────────────────

export type { HarnessCreateRunArgs } from "./harnessUtils";
/** @deprecated Use HarnessCreateRunArgs instead */
export type { HarnessCreateRunArgs as SessionCreateArgs } from "./harnessUtils";
export { selectHarness } from "./harnessUtils";
export { runOrchestrationPhase } from "./harnessPhase2";

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
    maxIterations = 256,
    runsDir,
    json,
    verbose,
  } = parsed;

  const mode: OutputMode = resolveOutputMode(json, parsed.outputMode);
  const interactive = parsed.interactive ?? (mode === "cli" && process.stdin.isTTY === true);
  // TUI mode: never create a readline interface — TUI owns the terminal
  const rl = (interactive && mode !== "tui") ? createReadlineInterface() : null;

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
    const selectedHarnessName = preferredHarness ?? "internal";
    const compressionConfig = loadSessionCompressionConfig(workspace);
    const promptContext = buildPromptContext({
      workspace,
      selectedHarnessName,
      discovered,
      compressionConfig,
    });

    let processPath = providedProcessPath;
    if (processPath) {
      emitProgress({ phase: "1", status: "skipped", processPath }, json, verbose, mode);
    } else {
      const workDir = workspace ?? process.cwd();
      processPath = await runProcessDefinitionPhase({
        prompt: prompt!,
        outputDir: getProcessOutputDir(workDir),
        workspace: workDir,
        model,
        interactive,
        rl,
        json,
        verbose,
        compressionConfig,
        promptContext,
        selectedHarnessName,
        outputMode: mode,
      });
    }

    if (parsed.planOnly) {
      emitProgress({ phase: "2", status: "skipped-plan-only", processPath }, json, verbose, mode);
      if (mode === "json") {
        process.stdout.write(JSON.stringify({ ok: true, planOnly: true, processPath }) + "\n");
      } else if (mode === "cli") {
        process.stderr.write(`${GREEN}Process definition created: ${BOLD}${processPath}${RESET}\n`);
        process.stderr.write(`${DIM}Run /babysitter:call or harness:create-run --process ${processPath} to execute.${RESET}\n`);
      }
      return 0;
    }

    return await runOrchestrationPhase({
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
      outputMode: mode,
    });
  } finally {
    rl?.close();
  }
}

/** @deprecated Use handleHarnessCreateRun instead */
export const handleSessionCreate = handleHarnessCreateRun;
