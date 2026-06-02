import * as path from "node:path";
import { invokeHarness } from "../../../invoker";
import {
  GREEN,
  CYAN,
  RESET,
  emitProgress,
  writeVerboseBlock,
  writeVerboseLine,
  type HarnessPromptContext as SessionCreatePromptContext,
  type OutputMode,
  type ProcessDefinitionReport,
  BabysitterRuntimeError,
  ErrorCategory,
} from "../utils";
import {
  assessWorkspaceForExternalAuthoring,
  buildExternalProcessConformancePrompt,
  buildExternalProcessDefinitionPrompt,
} from "./prompts";
import { recoverReportedProcessDefinition } from "./recovery";
import { validateProcessExport } from "./validation";

export async function runExternalProcessDefinitionPhase(args: {
  invocationCommand?: string;
  prompt: string;
  outputDir: string;
  workspace?: string;
  model?: string;
  json: boolean;
  verbose: boolean;
  selectedHarnessName: string;
  promptContext: SessionCreatePromptContext;
  outputMode?: OutputMode;
}): Promise<string> {
  const phaseOutputs: string[] = [];
  const state: { report?: ProcessDefinitionReport } = {};
  const writeVerbose = (message: string): void => {
    writeVerboseLine(args.verbose, args.json, message, args.outputMode);
  };
  const writeVerboseData = (label: string, value: unknown, maxChars?: number): void => {
    writeVerboseBlock(args.verbose, args.json, label, value, maxChars);
  };

  emitProgress(
    { phase: "1", status: "started", harness: `${args.selectedHarnessName} (headless)` },
    args.json,
    args.verbose,
    args.outputMode,
  );

  writeVerbose(
    `[phasePlanProcess setup] workspace=${path.resolve(args.workspace ?? process.cwd())} model=${args.model ?? "(default)"} outputDir=${path.resolve(args.outputDir)} harness=${args.selectedHarnessName}`,
  );

  const workspaceAssessment = await assessWorkspaceForExternalAuthoring(args.workspace);
  writeVerboseData("phasePlanProcess workspace assessment", workspaceAssessment);

  const invokeProcessAuthor = async (label: string, prompt: string, timeout: number): Promise<void> => {
    writeVerboseData(`${label} prompt`, prompt);
    const result = await invokeHarness(args.selectedHarnessName, {
      prompt,
      workspace: args.workspace,
      model: args.model,
      timeout,
    });
    if (!result.success) {
      writeVerboseData(`${label} failure output`, result.output);
      throw new BabysitterRuntimeError(
        "ProcessDefinitionFailed",
        result.output,
        { category: ErrorCategory.External },
      );
    }
    phaseOutputs.push(result.output);
    writeVerboseData(`${label} output`, result.output);
  };

  await invokeProcessAuthor(
    "phasePlanProcess initial",
    buildExternalProcessDefinitionPrompt({
      prompt: args.prompt,
      outputDir: args.outputDir,
      workspace: args.workspace,
      promptContext: args.promptContext,
      workspaceAssessment,
      preferAgentOnlyTasks: args.invocationCommand === "call",
    }),
    900_000,
  );

  if (!state.report?.processPath) {
    await recoverReportedProcessDefinition({
      state,
      outputDir: args.outputDir,
      workspace: args.workspace,
      outputs: phaseOutputs,
      verbose: args.verbose,
      json: args.json,
    });
  }

  if (!state.report?.processPath) {
    await invokeProcessAuthor(
      "phasePlanProcess recovery",
      [
        `Write the full process file now to the output directory ${args.outputDir}.`,
        "Choose a descriptive kebab-case filename (e.g. recovered-process.mjs).",
        "Do not describe the plan only; materialize the file in the workspace.",
        "After writing it, return either a concise summary or the full file in a ```javascript fenced block.",
      ].join("\n"),
      300_000,
    );
    await recoverReportedProcessDefinition({
      state,
      outputDir: args.outputDir,
      workspace: args.workspace,
      outputs: phaseOutputs,
      verbose: args.verbose,
      json: args.json,
    });
  }

  if (!state.report?.processPath) {
    await invokeProcessAuthor(
      "phasePlanProcess final recovery",
      [
        `Final recovery step: write the complete JavaScript process file to the output directory ${args.outputDir}.`,
        "Return the full file in a ```javascript fenced block after it exists on disk.",
        "Do not omit the file write.",
      ].join("\n"),
      300_000,
    );
    await recoverReportedProcessDefinition({
      state,
      outputDir: args.outputDir,
      workspace: args.workspace,
      outputs: phaseOutputs,
      verbose: args.verbose,
      json: args.json,
    });
  }

  if (!state.report?.processPath) {
    writeVerboseData("phasePlanProcess unrecoverable outputs", phaseOutputs);
    throw new BabysitterRuntimeError(
      "ProcessDefinitionReportMissing",
      "The process-definition harness did not produce a valid process file or recoverable JavaScript output.",
      { category: ErrorCategory.Runtime },
    );
  }

  await invokeProcessAuthor(
    "phasePlanProcess sdk conformance",
    buildExternalProcessConformancePrompt({
      outputPath: state.report.processPath,
      prompt: args.prompt,
    }),
    300_000,
  );

  await validateProcessExport(state.report.processPath);
  emitProgress(
    {
      phase: "1",
      status: "completed",
      harness: `${args.selectedHarnessName} (headless)`,
      processPath: state.report.processPath,
    },
    args.json,
    args.verbose,
    args.outputMode,
  );
  if (!args.json && args.outputMode !== "tui") {
    process.stderr.write(`${GREEN}PhasePlanProcess complete:${RESET} process=${CYAN}${state.report.processPath}${RESET}\n`);
  }
  return state.report.processPath;
}
