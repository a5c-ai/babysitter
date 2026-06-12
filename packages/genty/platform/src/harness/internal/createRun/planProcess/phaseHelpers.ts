import * as path from "node:path";
import * as readline from "node:readline";
import { promises as fs } from "node:fs";
import { Type } from "@sinclair/typebox";
import { createProcessAuthoringToolDefinitions, type CustomToolDefinition } from "@a5c-ai/genty-core";
import {
  askUserQuestionViaTool,
  emitProgress,
  formatToolResult,
  promptPiWithRetry,
  type AskUserQuestionRequest,
  type OutputMode,
  type AgentCoreSessionHandle,
  type ProcessDefinitionReport,
  type ToolResultShape,
  BabysitterRuntimeError,
  ErrorCategory,
} from "../utils";
import { runDelegatedHarnessTask } from "./delegation";
import { normalizeReportedPath } from "./paths";
import { buildPhaseConversationSummary } from "./recovery";
import { createRunAndMaybeBindFromProcessDefinition } from "./runState";

export async function promptPhaseSession(args: {
  session: AgentCoreSessionHandle;
  message: string;
  label: string;
  timeout: number;
  writeVerbose: (message: string) => void;
  writeVerboseData: (label: string, value: unknown, maxChars?: number) => void;
}): Promise<{ success: boolean; output: string }> {
  return promptPiWithRetry({
    session: args.session,
    message: args.message,
    timeout: args.timeout,
    label: args.label,
    writeVerbose: args.writeVerbose,
    writeVerboseData: args.writeVerboseData,
  }).catch((error: unknown) => {
    const isTimeout =
      error instanceof BabysitterRuntimeError &&
      (error.name === "PiTimeoutError" || (error.message ?? "").includes("timed out"));
    if (isTimeout) {
      args.writeVerbose(`[${args.label}] Pi prompt timed out, converting to failure result`);
      return {
        success: false as const,
        output: `Pi prompt timed out: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
    throw error;
  });
}

export function createPlanProcessTools(args: {
  prompt: string;
  outputDir: string;
  workspace?: string;
  model?: string;
  runsDir: string;
  maxIterations: number;
  createRunOnReport?: boolean;
  interactive: boolean;
  rl: readline.Interface | null;
  json: boolean;
  verbose: boolean;
  outputMode?: OutputMode;
  selectedHarnessName: string;
  state: { report?: ProcessDefinitionReport };
  phaseOutputs: string[];
  sessionRef: { current: AgentCoreSessionHandle | null };
  writeVerboseData: (label: string, value: unknown, maxChars?: number) => void;
  /**
   * Absolute reference roots (process-library/reference dirs) the planning
   * prompt tells the agent to search. Granted read-only to the file tools so
   * the agent cannot get trapped retrying an out-of-workspace path.
   */
  readOnlyRoots?: string[];
}): CustomToolDefinition[] {
  let mergedCustomTools: CustomToolDefinition[] = [];
  const customTools: CustomToolDefinition[] = [
    {
      name: "babysitter_report_process_definition",
      label: "Report Process Definition",
      description: "Report that the babysitter PROCESS DEFINITION file (a .mjs module that orchestrates the work) is ready, after writing it with the write tool. processPath MUST be that .mjs process file inside the process directory — NOT the user's requested output/deliverable file. The process you author is what later runs to produce the user's deliverable. This also creates the run and binds the current session when possible.",
      parameters: Type.Object({
        processPath: Type.String(),
        summary: Type.Optional(Type.String()),
      }),
      execute: async (
        _toolCallId: string,
        rawParams: Record<string, unknown>,
      ): Promise<ToolResultShape> => {
        const params = rawParams as { processPath: string; summary?: string };
        args.writeVerboseData("phasePlanProcess tool babysitter_report_process_definition", params);
        const normalizedProcessPath = normalizeReportedPath(
          params.processPath,
          args.workspace ?? process.cwd(),
        );
        const resolvedOutputDir = path.resolve(args.outputDir);
        if (!normalizedProcessPath.startsWith(`${resolvedOutputDir}${path.sep}`) && normalizedProcessPath !== resolvedOutputDir) {
          // Recoverable: weaker models sometimes report the user's OUTPUT file
          // (e.g. the requested .a5c-live-test/*.md) as the process path. Feed a
          // corrective error back so the agent re-authors a real process file in
          // the process directory instead of aborting the whole phase.
          return formatToolResult(
            { reportedPath: normalizedProcessPath, requiredDir: resolvedOutputDir },
            `Invalid processPath. The process definition file MUST be written inside ${resolvedOutputDir} (e.g. ${path.join(resolvedOutputDir, "process.mjs")}). You reported ${normalizedProcessPath}, which is NOT a babysitter process file. Do NOT report the user's output/deliverable file here — author a .mjs process whose task writes that deliverable, save it under ${resolvedOutputDir}, then call this tool again with that .mjs path.`,
          );
        }
        try {
          await fs.access(normalizedProcessPath);
        } catch {
          return formatToolResult(
            { reportedPath: normalizedProcessPath },
            `Process file not found at ${normalizedProcessPath}. Write the process definition with the write tool first, then call babysitter_report_process_definition with that exact path.`,
          );
        }
        const runState = args.createRunOnReport === false
          ? undefined
          : await createRunAndMaybeBindFromProcessDefinition({
            processPath: normalizedProcessPath,
            prompt: args.prompt,
            workspace: args.workspace,
            runsDir: args.runsDir,
            selectedHarnessName: args.selectedHarnessName,
            maxIterations: args.maxIterations,
            interactive: args.interactive,
            verbose: args.verbose,
            json: args.json,
            phaseSession: args.sessionRef.current,
          });
        args.state.report = {
          processPath: normalizedProcessPath,
          summary: params.summary,
          ...runState,
          conversationSummary: buildPhaseConversationSummary(args.phaseOutputs),
        };
        setTimeout(() => {
          if (args.sessionRef.current?.isStreaming) {
            void args.sessionRef.current.abort().catch(() => {});
          }
        }, 0);
        return formatToolResult(args.state.report, "Process definition reported.");
      },
    },
  ];

  // Authoring is intentionally scoped to file + delegation tools only. The
  // phase-1 agent must AUTHOR a process definition, not perform the user's work
  // directly. Granting it the full surface (bash/python/ssh/browser/web/code)
  // lets weak models sidestep authoring and "just do the task", which then
  // fails the phase (#956). createProcessAuthoringToolDefinitions exposes
  // read/write/edit/grep/find + AskUserQuestion/task/skill and nothing else.
  const agenticTools = createProcessAuthoringToolDefinitions({
    workspace: args.workspace ?? process.cwd(),
    ...(args.readOnlyRoots?.length ? { readOnlyRoots: args.readOnlyRoots } : {}),
    interactive: args.interactive ?? false,
    askUserQuestionHandler: async (params: unknown) => {
      const response = await askUserQuestionViaTool(
        params as AskUserQuestionRequest,
        args.interactive,
        args.rl,
        undefined,
      );
      args.writeVerboseData("phasePlanProcess tool AskUserQuestion response", response);
      emitProgress(
        {
          phase: "1",
          status: "interview",
          answer: JSON.stringify(response.answers),
        },
        args.json,
        args.verbose,
        args.outputMode,
      );
      return response;
    },
    taskHandler: async (params: unknown) => {
      args.writeVerboseData("phasePlanProcess tool task request", params);
      return runDelegatedHarnessTask({
        ...(params as Record<string, unknown>),
        task: String((params as Record<string, unknown>).task ?? ""),
        workspace: args.workspace,
        model: typeof (params as Record<string, unknown>).model === "string"
          ? String((params as Record<string, unknown>).model)
          : args.model,
        customTools: mergedCustomTools,
      });
    },
    skillHandler: async (params: unknown) => {
      args.writeVerboseData("phasePlanProcess tool skill request", params);
      return runDelegatedHarnessTask({
        ...(params as Record<string, unknown>),
        task: String((params as Record<string, unknown>).task ?? ""),
        workspace: args.workspace,
        model: typeof (params as Record<string, unknown>).model === "string"
          ? String((params as Record<string, unknown>).model)
          : args.model,
        skills: Array.isArray((params as Record<string, unknown>).skills)
          ? (params as Record<string, unknown>).skills as string[]
          : undefined,
        customTools: mergedCustomTools,
      });
    },
  });

  mergedCustomTools = [...customTools, ...agenticTools];
  return mergedCustomTools;
}
