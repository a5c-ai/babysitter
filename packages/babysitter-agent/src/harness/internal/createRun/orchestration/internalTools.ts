import { Type } from "@sinclair/typebox";
import { createAgentCoreToolDefinitions } from "@a5c-ai/agent-core";
import { buildBreakpointEffectResult } from "./internalToolsHelpers";
import {
  commitEffectResult,
  createPromptContextFromCatalog,
  composeProcessCreatePrompt,
} from "@a5c-ai/babysitter-sdk";
import {
  BabysitterRuntimeError,
  ErrorCategory,
  askUserQuestionViaTool,
  formatToolResult,
  type AskUserQuestionRequest,
  type OrchestrationState,
  type ToolResultShape,
} from "../utils";
import { assessRun } from "../resumeState";
import { runDelegatedHarnessTask } from "../planProcess";
import { orchestrateIterationWithProcessLoadRetry } from "./effects";
import { applyExplicitEffectResult, coerceStatus } from "./taskResult";
import type {
  OrchestrationWriteVerbose,
  OrchestrationWriteVerboseData,
  RunOrchestrationPhaseArgs,
} from "./types";

type ToolExecute = (
  toolCallId: string,
  params: Record<string, unknown>,
) => Promise<ToolResultShape> | ToolResultShape;

export type OrchestrationNamedTool = {
  name: string;
  execute?: ToolExecute;
};

export function createOrchestrationTools(args: {
  phaseArgs: RunOrchestrationPhaseArgs;
  state: OrchestrationState;
  describePendingActions: () => Array<{
    effectId: string;
    kind: string;
    title?: string;
    harness?: string;
  }>;
  writeVerbose: OrchestrationWriteVerbose;
  writeVerboseData: OrchestrationWriteVerboseData;
}): {
  mergedTools: unknown[];
  iterateTool: OrchestrationNamedTool | undefined;
  finishTool: OrchestrationNamedTool | undefined;
  invokeTool: (
    tool: OrchestrationNamedTool | undefined,
    name: string,
    params?: Record<string, unknown>,
  ) => Promise<ToolResultShape>;
} {
  const customTools: unknown[] = [
    createRunIterateTool(args),
    createTaskPostResultTool(args),
    createFinishOrchestrationTool(args),
  ];
  const orchestrationAgenticTools = createAgentCoreToolDefinitions({
    workspace: args.phaseArgs.workspace ?? process.cwd(),
    interactive: args.phaseArgs.interactive ?? false,
    askUserQuestionHandler: async (params: unknown) => {
      const response = await askUserQuestionViaTool(
        params as AskUserQuestionRequest,
        args.phaseArgs.interactive,
        args.phaseArgs.rl,
        undefined,
      );
      args.state.lastAskUserQuestionResponse = response;
      args.writeVerboseData("phaseOrchestration tool AskUserQuestion response", response);
      return response;
    },
    taskHandler: async (params: unknown) => {
      args.writeVerboseData("phaseOrchestration tool task request", params);
      const delegated = await runDelegatedHarnessTask({
        ...(params as Record<string, unknown>),
        task: String((params as Record<string, unknown>).task ?? ""),
        workspace: args.phaseArgs.workspace,
        model: typeof (params as Record<string, unknown>).model === "string"
          ? String((params as Record<string, unknown>).model)
          : args.phaseArgs.model,
        customTools,
      });
      args.writeVerboseData("phaseOrchestration tool task result", delegated);
      return delegated;
    },
    skillHandler: async (params: unknown) => {
      args.writeVerboseData("phaseOrchestration tool skill request", params);
      const delegated = await runDelegatedHarnessTask({
        ...(params as Record<string, unknown>),
        task: String((params as Record<string, unknown>).task ?? ""),
        workspace: args.phaseArgs.workspace,
        model: typeof (params as Record<string, unknown>).model === "string"
          ? String((params as Record<string, unknown>).model)
          : args.phaseArgs.model,
        skills: Array.isArray((params as Record<string, unknown>).skills)
          ? (params as Record<string, unknown>).skills as string[]
          : undefined,
        customTools,
      });
      args.writeVerboseData("phaseOrchestration tool skill result", delegated);
      return delegated;
    },
  });
  const mergedTools = wrapToolExecute(
    [...customTools, ...orchestrationAgenticTools],
    args.writeVerbose,
  );
  const tools = mergedTools as OrchestrationNamedTool[];
  const iterateTool = tools.find((tool) => tool.name === "babysitter_run_iterate");
  const finishTool = tools.find((tool) => tool.name === "babysitter_finish_orchestration");
  return {
    mergedTools,
    iterateTool,
    finishTool,
    invokeTool: async (
      tool: OrchestrationNamedTool | undefined,
      name: string,
      params: Record<string, unknown> = {},
    ) => {
      if (!tool?.execute) {
        throw new BabysitterRuntimeError(
          "MissingSessionCreateTool",
          `Required orchestration tool is unavailable: ${name}`,
          { category: ErrorCategory.Internal },
        );
      }
      args.writeVerboseData(`phaseOrchestration host invoke ${name} request`, params);
      const result = tool.execute(`host-${name}`, params);
      const resolved = await Promise.resolve(result);
      args.writeVerboseData(`phaseOrchestration host invoke ${name} result`, resolved);
      return resolved;
    },
  };
}

function createRunIterateTool(args: {
  phaseArgs: RunOrchestrationPhaseArgs;
  state: OrchestrationState;
  writeVerbose: OrchestrationWriteVerbose;
  writeVerboseData: OrchestrationWriteVerboseData;
}): Record<string, unknown> {
  return {
    name: "babysitter_run_iterate",
    label: "Babysitter Run Iterate",
    description: "Run the next orchestration iteration and return pending effects or a terminal result.",
    parameters: Type.Object({}),
    execute: async (): Promise<ToolResultShape> => {
      args.writeVerbose(
        `[phaseOrchestration tool babysitter_run_iterate request] runDir=${args.state.runDir ?? "(missing)"} nextIteration=${args.state.iteration + 1}`,
      );
      if (!args.state.runDir) {
        throw new BabysitterRuntimeError(
          "RunNotCreated",
          "Create the run before iterating it.",
          { category: ErrorCategory.Validation },
        );
      }
      if (args.state.iteration >= args.phaseArgs.maxIterations) {
        args.state.lastIterationResult = {
          status: "failed",
          error: { message: `Max iterations (${args.phaseArgs.maxIterations}) reached without completion` },
        };
        return formatToolResult(args.state.lastIterationResult, "Iteration limit reached.");
      }
      args.state.iteration += 1;
      args.state.pendingActions.clear();
      args.state.pendingEffectResults.clear();
      const result = await orchestrateIterationWithProcessLoadRetry({
        runDir: args.state.runDir,
        writeVerbose: args.writeVerbose,
        writeVerboseData: args.writeVerboseData,
      });
      args.state.lastIterationResult = result;
      if (result.status === "waiting") {
        for (const action of result.nextActions) {
          args.state.pendingActions.set(action.effectId, action);
        }
      }
      let processErrorExtra: Record<string, unknown> = {};
      if (result.status === "process-error") {
        args.state.iteration -= 1;
        processErrorExtra = {
          recoverable: true,
          hint: "The process code has a bug. Read the error and the process-authoring reference below, fix the process file, and call babysitter_run_iterate again.",
          processAuthoringReference: composeProcessCreatePrompt(
            createPromptContextFromCatalog('pi', { interactive: false }),
          ),
        };
      }
      return formatToolResult(
        { iteration: args.state.iteration, ...result, ...processErrorExtra },
        result.status === "process-error"
          ? "Process error — fix the process code and retry iteration."
          : "Iteration completed.",
      );
    },
  };
}

function createTaskPostResultTool(args: {
  phaseArgs: RunOrchestrationPhaseArgs;
  state: OrchestrationState;
  writeVerboseData: OrchestrationWriteVerboseData;
}): Record<string, unknown> {
  return {
    name: "babysitter_task_post_result",
    label: "Babysitter Task Post Result",
    description: "Persist a staged result, or post an explicit effect result payload after you fulfilled the work yourself.",
    parameters: Type.Object({
      effectId: Type.String(),
      status: Type.Optional(Type.Union([Type.Literal("ok"), Type.Literal("error")])),
      valueText: Type.Optional(Type.String()),
      valueJson: Type.Optional(Type.String()),
      error: Type.Optional(Type.String()),
      stdout: Type.Optional(Type.String()),
      stderr: Type.Optional(Type.String()),
    }),
    execute: async (
      _toolCallId: string,
      params: Record<string, unknown>,
    ): Promise<ToolResultShape> => {
      const effectId = String(params.effectId ?? "");
      args.writeVerboseData("phaseOrchestration tool babysitter_task_post_result request", params);
      if (!args.state.runDir) {
        throw new BabysitterRuntimeError(
          "RunNotCreated",
          "Create the run before posting task results.",
          { category: ErrorCategory.Validation },
        );
      }
      const action = args.state.pendingActions.get(effectId);
      if (!action) {
        throw new BabysitterRuntimeError(
          "PendingEffectNotFound",
          `No pending effect found for ${effectId}.`,
          { category: ErrorCategory.Validation },
        );
      }
      const startedAt = new Date().toISOString();
      let effectResult = args.state.pendingEffectResults.get(effectId);
      const status = coerceStatus(params.status);
      if (status) {
        effectResult = applyExplicitEffectResult({
          params,
          effectId,
          status,
          effectResult,
        });
      }
      if (!effectResult && action.kind === "breakpoint") {
        effectResult = buildBreakpointEffectResult(args, action);
      }
      if (!effectResult) {
        throw new BabysitterRuntimeError(
          "EffectResultMissing",
          `No staged effect result exists for ${effectId}.`,
          { category: ErrorCategory.Runtime },
        );
      }
      const finishedAt = new Date().toISOString();
      await commitEffectResult({
        runDir: args.state.runDir,
        effectId: action.effectId,
        invocationKey: action.invocationKey,
        result: {
          status: effectResult.status,
          value: effectResult.value,
          error: effectResult.error,
          stdout: effectResult.stdout,
          stderr: effectResult.stderr,
          startedAt,
          finishedAt,
        },
      });
      args.state.pendingActions.delete(effectId);
      args.state.pendingEffectResults.delete(effectId);
      if (action.kind === "breakpoint") {
        args.state.lastAskUserQuestionResponse = undefined;
      }
      return formatToolResult({ effectId, status: effectResult.status }, "Task result posted.");
    },
  };
}

function createFinishOrchestrationTool(args: {
  state: OrchestrationState;
  describePendingActions: () => Array<{
    effectId: string;
    kind: string;
    title?: string;
    harness?: string;
  }>;
  writeVerboseData: OrchestrationWriteVerboseData;
}): Record<string, unknown> {
  return {
    name: "babysitter_finish_orchestration",
    label: "Finish Orchestration",
    description: "Report that the orchestration phase has reached a terminal state.",
    parameters: Type.Object({
      summary: Type.Optional(Type.String()),
    }),
    execute: async (
      _toolCallId: string,
      params: Record<string, unknown>,
    ): Promise<ToolResultShape> => {
      args.writeVerboseData("phaseOrchestration tool babysitter_finish_orchestration", params);
      if (args.state.pendingActions.size > 0) {
        return formatToolResult(
          {
            complete: false,
            nextStep: "Resolve and post all pending effects before finishing orchestration.",
            pendingEffects: args.describePendingActions(),
          },
          "The run is not complete yet. Resolve the pending effects first.",
        );
      }
      if (!args.state.runDir) {
        return formatToolResult(
          {
            complete: false,
            nextStep: "Establish the run context before attempting to finish orchestration.",
          },
          "The run has not been created yet.",
        );
      }
      const assessed = await assessRun(args.state.runDir);
      if (assessed.run.status !== "completed" && assessed.run.status !== "failed") {
        const lastStatus = args.state.lastIterationResult?.status;
        const nextStep = lastStatus === "process-error"
          ? "Fix the process code, save it, and call babysitter_run_iterate again."
          : assessed.run.status === "waiting"
            ? "Keep iterating and resolve the pending effects reported by the run."
            : "Keep iterating the run until the journal records RUN_COMPLETED or RUN_FAILED.";
        return formatToolResult(
          {
            complete: false,
            nextStep,
            runStatus: assessed.run.status,
            journalLength: assessed.journalLength,
            lastEvent: assessed.lastEvent,
            pendingEffects: assessed.run.pendingEffects,
            lastIterationResult: args.state.lastIterationResult,
          },
          "The active run is not terminal yet.",
        );
      }
      args.state.finished = {
        summary: typeof params.summary === "string" ? params.summary : undefined,
      };
      return formatToolResult(args.state.finished, "Orchestration finish recorded.");
    },
  };
}

function wrapToolExecute(
  rawTools: unknown[],
  writeVerbose: OrchestrationWriteVerbose,
): unknown[] {
  return rawTools.map((tool) => {
    const typedTool = tool as Record<string, unknown>;
    const originalExecute = typedTool.execute;
    if (typeof originalExecute !== "function") {
      return tool;
    }
    return {
      ...typedTool,
      execute: async (...params: unknown[]) => {
        try {
          return await (originalExecute as (...args: unknown[]) => Promise<unknown>)(...params);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          writeVerbose(`[phaseOrchestration tool ${String(typedTool.name)}] caught error: ${message}`);
          return formatToolResult(
            { error: message, toolName: String(typedTool.name) },
            `Tool error: ${message}`,
          );
        }
      },
    };
  });
}

// buildBreakpointEffectResult extracted to internalToolsHelpers.ts
