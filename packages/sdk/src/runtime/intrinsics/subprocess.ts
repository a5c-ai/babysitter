import { DefinedTask, SubprocessTaskOptions, TaskInvokeOptions } from "../../tasks/types";
import { SubprocessInvocation, SubprocessResult } from "../types";
import { RunFailedError } from "../exceptions";
import { runTaskIntrinsic, TaskIntrinsicContext } from "./task";

interface SubprocessTaskArgs {
  invocation: SubprocessInvocation;
  label: string;
}

const SUBPROCESS_TASK_ID = "__sdk.subprocess";

const subprocessTask: DefinedTask<SubprocessTaskArgs, SubprocessResult> = {
  id: SUBPROCESS_TASK_ID,
  build(args) {
    const invocation = args.invocation;
    const subprocess: SubprocessTaskOptions = {
      processPath: invocation.processPath,
      exportName: invocation.exportName,
      processId: invocation.processId,
      prompt: invocation.prompt,
      inputs: invocation.inputs,
      inputSchema: invocation.inputSchema,
      outputSchema: invocation.outputSchema,
      harness: invocation.harness,
      model: invocation.model,
      maxIterations: invocation.maxIterations,
      shareSession: invocation.shareSession !== false,
      metadata: invocation.metadata,
    };

    return {
      kind: "subprocess",
      title: args.label,
      metadata: {
        subprocess: true,
        processPath: invocation.processPath,
        processId: invocation.processId,
        harness: invocation.harness,
        model: invocation.model,
        maxIterations: invocation.maxIterations,
        shareSession: invocation.shareSession !== false,
      },
      subprocess,
    };
  },
};

export function runSubprocessIntrinsic(
  invocation: SubprocessInvocation,
  context: TaskIntrinsicContext,
  options?: TaskInvokeOptions,
): Promise<SubprocessResult> {
  if (context.subprocessSupport !== "babysitter-agent") {
    throw new RunFailedError(
      "Subprocess effects are only supported when the run is iterated by babysitter-agent.",
      {
        runId: context.runId,
        processId: context.processId,
        subprocessSupport: context.subprocessSupport ?? "disabled",
      },
    );
  }
  const label = options?.label ?? invocation.processId ?? invocation.processPath;
  return runTaskIntrinsic({
    task: subprocessTask,
    args: { invocation, label },
    invokeOptions: { ...options, label },
    context,
  });
}
