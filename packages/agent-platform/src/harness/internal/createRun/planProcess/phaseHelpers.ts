import * as path from "node:path";
import * as readline from "node:readline";
import { promises as fs } from "node:fs";
import { Type } from "@sinclair/typebox";
import { createAgentCoreToolDefinitions } from "@a5c-ai/tula-core";
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
}): unknown[] {
  let mergedCustomTools: unknown[] = [];
  const customTools: unknown[] = [
    {
      name: "babysitter_report_process_definition",
      label: "Report Process Definition",
      description: "Report that the process definition is ready after writing it with the normal file tools. This also creates the run and binds the current session when possible.",
      parameters: Type.Object({
        processPath: Type.String(),
        summary: Type.Optional(Type.String()),
      }),
      execute: async (
        _toolCallId: string,
        params: { processPath: string; summary?: string },
      ): Promise<ToolResultShape> => {
        args.writeVerboseData("phasePlanProcess tool babysitter_report_process_definition", params);
        const normalizedProcessPath = normalizeReportedPath(
          params.processPath,
          args.workspace ?? process.cwd(),
        );
        const resolvedOutputDir = path.resolve(args.outputDir);
        if (!normalizedProcessPath.startsWith(`${resolvedOutputDir}${path.sep}`) && normalizedProcessPath !== resolvedOutputDir) {
          throw new BabysitterRuntimeError(
            "ProcessDefinitionInvalidPath",
            `Reported process path must stay within ${resolvedOutputDir}, got ${normalizedProcessPath}`,
            { category: ErrorCategory.Validation },
          );
        }
        await fs.access(normalizedProcessPath);
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

  const agenticTools = createAgentCoreToolDefinitions({
    workspace: args.workspace ?? process.cwd(),
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
