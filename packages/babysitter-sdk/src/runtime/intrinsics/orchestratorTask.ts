import { DefinedTask, TaskInvokeOptions } from "../types";
import { runTaskIntrinsic, TaskIntrinsicContext } from "./task";

interface OrchestratorTaskArgs<T = unknown> {
  payload: T;
  label: string;
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
      },
    };
  },
};

export function runOrchestratorTaskIntrinsic<TPayload, TResult>(
  payload: TPayload,
  context: TaskIntrinsicContext,
  options?: TaskInvokeOptions
): Promise<TResult> {
  const label = options?.label ?? "orchestrator-task";
  const invokeOptions = { ...options, label };
  return runTaskIntrinsic({
    task: orchestratorTask as DefinedTask<OrchestratorTaskArgs<TPayload>, TResult>,
    args: { payload, label },
    invokeOptions,
    context,
  });
}
