import * as path from "node:path";
import { buildProcessDefinitionSystemPrompt, buildProcessDefinitionUserPrompt } from "../prompts";
import {
  DIM,
  RESET,
  PI_PARENT_PROMPT_TIMEOUT_MS,
  createAgentCoreSession,
  createReadlineAskUserQuestionUiContext,
  emitProgress,
  resolveAgentCoreBackendForHarness,
  writeVerboseBlock,
  writeVerboseLine,
  type AgentCoreSessionEvent,
  type AgentCoreSessionHandle,
  type AgentCoreSessionOptions,
  type ProcessDefinitionReport,
  BabysitterRuntimeError,
  ErrorCategory,
} from "../utils";
import { waitForProcessFile } from "./paths";
import {
  assessWorkspaceForExternalAuthoring,
  buildInternalProcessConformancePrompt,
} from "./prompts";
import {
  applyRecoveredProcessDefinitionFromOutput,
  buildPhaseConversationSummary,
  recoverReportedProcessDefinition,
  writeVerboseProcessDefinitionRecovery,
} from "./recovery";
import { createPlanProcessTools, promptPhaseSession } from "./phaseHelpers";
import { createRunAndMaybeBindFromProcessDefinition } from "./runState";
import {
  appendIntentHandoffToPlanPrompt,
  buildUnderstandIntentPrompt,
  runUnderstandIntentPhase,
} from "./understandIntent";
import { validateProcessExport } from "./validation";

export type { RunPlanProcessPhaseArgs } from "./phaseTypes";

export async function runPlanProcessPhase(args: import("./phaseTypes").RunPlanProcessPhaseArgs): Promise<ProcessDefinitionReport> {
  const state: { report?: ProcessDefinitionReport } = {};
  const phaseOutputs: string[] = [];
  const sessionRef: { current: AgentCoreSessionHandle | null } = { current: null };
  const interactiveUiContext = args.interactive && args.rl
    ? createReadlineAskUserQuestionUiContext(args.rl)
    : undefined;
  const writeVerbose = (message: string): void => writeVerboseLine(args.verbose, args.json, message, args.outputMode);
  const writeVerboseData = (label: string, value: unknown, maxChars?: number): void => writeVerboseBlock(args.verbose, args.json, label, value, maxChars, args.outputMode);
  const mergedCustomTools = createPlanProcessTools({
    ...args, state, phaseOutputs, sessionRef, writeVerboseData,
  });
  emitProgress(
    { phase: "1", status: "started", harness: "agent-core" },
    args.json,
    args.verbose,
    args.outputMode,
  );
  writeVerbose(
    `[phasePlanProcess setup] workspace=${path.resolve(args.workspace ?? process.cwd())} model=${args.model ?? "(default)"} outputDir=${path.resolve(args.outputDir)}`,
  );
  writeVerboseData(
    "phasePlanProcess tools",
    (mergedCustomTools as Array<{ name?: string; label?: string }>).map((tool) => ({
      name: tool.name,
      label: tool.label,
    })),
  );
  const workspaceAssessment = await assessWorkspaceForExternalAuthoring(args.workspace);
  writeVerboseData("phasePlanProcess workspace assessment", workspaceAssessment);
  const processDefinitionSystemPrompt = await buildProcessDefinitionSystemPrompt(
    args.outputDir,
    args.promptContext,
    args.interactive,
  );
  const intentPrompt = buildUnderstandIntentPrompt({
    prompt: args.prompt,
    interactive: args.interactive,
    workspaceAssessment,
  });
  const basePlanProcessPrompt = buildProcessDefinitionUserPrompt(
    args.prompt,
    args.outputDir,
    {
      interactive: args.interactive,
      workspaceAssessment: workspaceAssessment.kind,
      workspaceEntries: workspaceAssessment.entries,
      preferAgentOnlyTasks: args.invocationCommand === "call",
    },
  );
  writeVerboseData("phasePlanProcess system prompt", processDefinitionSystemPrompt);
  writeVerboseData("phaseUnderstandIntent prompt", intentPrompt);
  const planProcessToolsMode: AgentCoreSessionOptions["toolsMode"] =
    workspaceAssessment.kind === "empty"
      ? "default"
      : "coding";
  sessionRef.current = createAgentCoreSession({
    workspace: args.workspace,
    model: args.model,
    backend: resolveAgentCoreBackendForHarness(args.selectedHarnessName),
    thinkingLevel: "low",
    toolsMode: planProcessToolsMode,
    customTools: mergedCustomTools,
    uiContext: interactiveUiContext,
    systemPrompt: processDefinitionSystemPrompt,
    isolated: true,
    ephemeral: true,
  });
  try {
    await sessionRef.current.initialize();
    let unsubscribe: (() => void) | null = null;
    if (!args.json && args.outputMode !== "tui") {
      process.stderr.write(`${DIM}PhaseUnderstandIntent agent is analyzing the request...${RESET}\n`);
      unsubscribe = sessionRef.current.subscribe((event: AgentCoreSessionEvent) => {
        if (event.type === "text_delta") {
          const text = (event as { text?: string }).text;
          if (text) {
            process.stderr.write(text);
          }
        }
      });
    }
    emitProgress(
      { phase: "1", status: "intent", answer: "Analyzing the user request and relevant workspace context." },
      args.json,
      args.verbose,
      args.outputMode,
    );
    const intentResult = await runUnderstandIntentPhase({
      session: sessionRef.current,
      promptMessage: intentPrompt,
      timeout: PI_PARENT_PROMPT_TIMEOUT_MS,
      writeVerbose,
      writeVerboseData,
    });
    phaseOutputs.push(intentResult.output);
    writeVerboseData("phaseUnderstandIntent output", intentResult.output);
    writeVerboseData("phaseUnderstandIntent handoff", intentResult.handoffSummary);
    const planProcessPrompt = appendIntentHandoffToPlanPrompt(
      basePlanProcessPrompt,
      intentResult.output,
    );
    writeVerboseData("phasePlanProcess prompt", planProcessPrompt);
    emitProgress(
      { phase: "1", status: "planning", answer: "Authoring the process definition and preparing the run." },
      args.json,
      args.verbose,
      args.outputMode,
    );
    if (!args.json && args.outputMode !== "tui") {
      process.stderr.write(`${DIM}PhasePlanProcess agent is authoring the process...${RESET}\n`);
    }
    const result = await promptPhaseSession({
      session: sessionRef.current,
      message: planProcessPrompt,
      timeout: PI_PARENT_PROMPT_TIMEOUT_MS,
      label: "phasePlanProcess",
      writeVerbose,
      writeVerboseData,
    });
    phaseOutputs.push(result.output);
    if (unsubscribe) {
      unsubscribe();
    }
    if (!args.json && args.outputMode !== "tui") {
      process.stderr.write("\n");
    }
    if (!result.success) {
      writeVerboseData("phasePlanProcess agent failure output", result.output);
      const recovered = await recoverReportedProcessDefinition({
        state,
        outputDir: args.outputDir,
        workspace: args.workspace,
        outputs: phaseOutputs,
        verbose: args.verbose,
        json: args.json,
      });
      if (!recovered?.processPath) {
        throw new BabysitterRuntimeError(
          "ProcessDefinitionFailed",
          result.output,
          { category: ErrorCategory.External },
        );
      }
      writeVerbose("[phasePlanProcess recovery] proceeding with the reported process file after a late PI prompt failure");
    } else {
      writeVerboseData("phasePlanProcess agent output", result.output);
    }
    if (!state.report?.processPath) {
      writeVerboseProcessDefinitionRecovery(args.json);
      const recoveryPrompt = [
        "Recovery step:",
        `- Write the process file now to the output directory ${args.outputDir} using the normal file tools with a descriptive filename.`,
        "- Then call babysitter_report_process_definition exactly once.",
        "- Do not just describe the process in plain text.",
      ].join("\n");
      writeVerboseData("phasePlanProcess recovery prompt", recoveryPrompt);
      const recovery = await promptPhaseSession({
        session: sessionRef.current,
        message: recoveryPrompt,
        timeout: PI_PARENT_PROMPT_TIMEOUT_MS,
        label: "phasePlanProcess recovery",
        writeVerbose,
        writeVerboseData,
      });
      phaseOutputs.push(recovery.output);
      if (!recovery.success) {
        writeVerboseData("phasePlanProcess recovery failure output", recovery.output);
        const recovered = await recoverReportedProcessDefinition({
          state,
          outputDir: args.outputDir,
          workspace: args.workspace,
          outputs: phaseOutputs,
          verbose: args.verbose,
          json: args.json,
        });
        if (!recovered?.processPath) {
          throw new BabysitterRuntimeError(
            "ProcessDefinitionFailed",
            recovery.output,
            { category: ErrorCategory.External },
          );
        }
        writeVerbose("[phasePlanProcess recovery] using the reported process file after the recovery prompt failed late");
      } else {
        writeVerboseData("phasePlanProcess recovery output", recovery.output);
      }
    }
    if (!state.report?.processPath) {
      writeVerbose("[phasePlanProcess recovery] attempting host-side recovery from agent outputs");
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
      const finalRecoveryPrompt = [
        "Final recovery step:",
        `- Write the process file to the output directory ${args.outputDir} using the normal file tools with a descriptive filename.`,
        "- If you already wrote it, do not rewrite unnecessarily.",
        "- Call babysitter_report_process_definition exactly once after the file exists.",
        "- Do not answer with plain text only.",
        "- If helpful, return the full JavaScript in a ```javascript fenced block, but the file must still be written and reported.",
      ].join("\n");
      writeVerboseData("phasePlanProcess final recovery prompt", finalRecoveryPrompt);
      const finalRecovery = await promptPhaseSession({
        session: sessionRef.current,
        message: finalRecoveryPrompt,
        timeout: PI_PARENT_PROMPT_TIMEOUT_MS,
        label: "phasePlanProcess final recovery",
        writeVerbose,
        writeVerboseData,
      });
      phaseOutputs.push(finalRecovery.output);
      if (!finalRecovery.success) {
        writeVerboseData("phasePlanProcess final recovery failure output", finalRecovery.output);
        const recovered = await recoverReportedProcessDefinition({
          state,
          outputDir: args.outputDir,
          workspace: args.workspace,
          outputs: phaseOutputs,
          verbose: args.verbose,
          json: args.json,
        });
        if (!recovered?.processPath) {
          throw new BabysitterRuntimeError(
            "ProcessDefinitionFailed",
            finalRecovery.output,
            { category: ErrorCategory.External },
          );
        }
        writeVerbose("[phasePlanProcess recovery] using the reported process file after the final recovery prompt failed late");
      } else {
        writeVerboseData("phasePlanProcess final recovery output", finalRecovery.output);
      }
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
        "The process-definition agent finished without calling babysitter_report_process_definition, and no recoverable process file or code output was produced.",
        { category: ErrorCategory.Runtime },
      );
    }
    await waitForProcessFile(state.report.processPath);
    writeVerbose(`[phasePlanProcess validate] validating process export from ${path.resolve(state.report.processPath)}`);
    for (let repairAttempt = 0; repairAttempt < 3; repairAttempt += 1) {
      try {
        await validateProcessExport(state.report.processPath);
        break;
      } catch (validationError: unknown) {
        if (repairAttempt === 2) {
          throw validationError;
        }
        const validationMessage = validationError instanceof Error
          ? validationError.message
          : String(validationError);
        writeVerboseData("phasePlanProcess validate error", {
          attempt: repairAttempt + 1,
          message: validationMessage,
        });
        const conformancePrompt = buildInternalProcessConformancePrompt({
          outputPath: state.report.processPath,
          prompt: args.prompt,
          validationError: validationMessage,
        });
        writeVerboseData("phasePlanProcess conformance repair prompt", conformancePrompt);
        const repair = await promptPhaseSession({
          session: sessionRef.current,
          message: conformancePrompt,
          timeout: PI_PARENT_PROMPT_TIMEOUT_MS,
          label: "phasePlanProcess conformance repair",
          writeVerbose,
          writeVerboseData,
        });
        phaseOutputs.push(repair.output);
        if (!repair.success) {
          writeVerboseData("phasePlanProcess conformance repair failure output", repair.output);
        } else {
          writeVerboseData("phasePlanProcess conformance repair output", repair.output);
        }
        if (await applyRecoveredProcessDefinitionFromOutput({
          processPath: state.report.processPath,
          output: repair.output,
        })) {
          writeVerbose(
            `[phasePlanProcess conformance repair] recovered rewritten process source from agent output into ${path.resolve(state.report.processPath)}`,
          );
        }
        await waitForProcessFile(state.report.processPath);
      }
    }
    if (args.createRunOnReport !== false && (!state.report.runId || !state.report.runDir)) {
      const runState = await createRunAndMaybeBindFromProcessDefinition({
        processPath: state.report.processPath,
        prompt: args.prompt,
        workspace: args.workspace,
        runsDir: args.runsDir,
        selectedHarnessName: args.selectedHarnessName,
        maxIterations: args.maxIterations,
        interactive: args.interactive,
        verbose: args.verbose,
        json: args.json,
        phaseSession: sessionRef.current,
      });
      state.report = {
        ...state.report,
        ...runState,
        conversationSummary: buildPhaseConversationSummary(phaseOutputs),
      };
    }
    if (state.report) {
      state.report = {
        ...state.report,
        conversationSummary: buildPhaseConversationSummary(phaseOutputs),
      };
    }
    emitProgress(
      {
        phase: "1",
        status: "completed",
        processPath: state.report.processPath,
        harness: "agent-core",
      },
      args.json,
      args.verbose,
      args.outputMode,
    );
    return state.report;
  } catch (error: unknown) {
    writeVerboseData(
      "phasePlanProcess error",
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : error,
    );
    emitProgress(
      {
        phase: "1",
        status: "failed",
        harness: "agent-core",
        error: error instanceof Error ? error.message : String(error),
      },
      args.json,
      args.verbose,
      args.outputMode,
    );
    throw error;
  } finally {
    sessionRef.current?.dispose();
  }
}

/** @deprecated Use runPlanProcessPhase instead */
export const runProcessDefinitionPhase = runPlanProcessPhase;
