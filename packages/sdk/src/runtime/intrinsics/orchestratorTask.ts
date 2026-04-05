import { DefinedTask, TaskInvokeOptions } from "../types";
import { runTaskIntrinsic, TaskIntrinsicContext } from "./task";

interface OrchestratorTaskArgs<T = unknown> {
  payload: T;
  label: string;
  executionMode?: "local" | "subagent" | "cloud";
  modelPhase?: "plan" | "interactive" | "execute" | "review" | "fix";
  parallelism?: number;
  subtasks?: Record<string, unknown>[];
}

const ORCHESTRATOR_TASK_ID = "__sdk.orchestratorTask";

const orchestratorTask: DefinedTask<OrchestratorTaskArgs, unknown> = {
  id: ORCHESTRATOR_TASK_ID,
  build(args) {
    return {
      kind: "orchestrator_task",
      title: args.label,
      metadata: {
        payload: args?.payload,
        orchestratorTask: true,
        executionMode: args.executionMode,
        modelPhase: args.modelPhase,
        parallelism: args.parallelism,
        subtaskCount: args.subtasks?.length,
      },
      orchestratorTask: {
        payload: typeof args?.payload === "object" && args.payload !== null && !Array.isArray(args.payload)
          ? (args.payload as Record<string, unknown>)
          : undefined,
        executionMode: args.executionMode,
        modelPhase: args.modelPhase,
        parallelism: args.parallelism,
        subtasks: args.subtasks,
      },
    };
  },
};

export function runOrchestratorTaskIntrinsic<TPayload, TResult>(
  payload: TPayload,
  context: TaskIntrinsicContext,
  options?: TaskInvokeOptions & {
    executionMode?: "local" | "subagent" | "cloud";
    modelPhase?: "plan" | "interactive" | "execute" | "review" | "fix";
    parallelism?: number;
    subtasks?: Record<string, unknown>[];
  }
): Promise<TResult> {
  const label = options?.label ?? "orchestrator-task";
  const invokeOptions = { ...options, label };
  return runTaskIntrinsic({
    task: orchestratorTask as DefinedTask<OrchestratorTaskArgs<TPayload>, TResult>,
    args: {
      payload,
      label,
      executionMode: options?.executionMode,
      modelPhase: options?.modelPhase,
      parallelism: options?.parallelism,
      subtasks: options?.subtasks,
    },
    invokeOptions,
    context,
  });
}
