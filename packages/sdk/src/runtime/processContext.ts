import { AsyncLocalStorage } from "async_hooks";
import { runTaskIntrinsic, TaskIntrinsicContext } from "./intrinsics/task";
import { runBreakpointIntrinsic } from "./intrinsics/breakpoint";
import { runSleepIntrinsic } from "./intrinsics/sleep";
import { runOrchestratorTaskIntrinsic } from "./intrinsics/orchestratorTask";
import { runHookIntrinsic } from "./intrinsics/hook";
import { callHook } from "../hooks/dispatcher";
import { runParallelAll, runParallelMap } from "./intrinsics/parallel";
import { ProcessContext, ParallelHelpers } from "./types";
import { MissingProcessContextError } from "./exceptions";

export interface ProcessContextInit extends Omit<TaskIntrinsicContext, "now"> {
  processId: string;
  now?: () => Date;
}

export interface InternalProcessContext extends TaskIntrinsicContext {
  processId: string;
  now: () => Date;
}

const contextStorage = new AsyncLocalStorage<InternalProcessContext>();

export interface CreateProcessContextResult {
  context: ProcessContext;
  internalContext: InternalProcessContext;
}

export function createProcessContext(init: ProcessContextInit): CreateProcessContextResult {
  const safeLogger = typeof (init as any).logger === "function" ? (init as any).logger : undefined;
  const internal: InternalProcessContext = {
    ...init,
    logger: safeLogger,
    now: init.now ?? (() => new Date()),
  };

  const parallelHelpers: ParallelHelpers = {
    all: (thunks) => runParallelAll(thunks),
    map: (items, fn) => runParallelMap(items, fn),
  };

  const processContext: ProcessContext = {
    now: () => internal.now(),
    task: (task, args, options) =>
      runTaskIntrinsic({
        task,
        args,
        invokeOptions: options,
        context: internal,
      }),
    breakpoint: (payload, options) => runBreakpointIntrinsic(payload, internal, options),
    sleepUntil: (target, options) => runSleepIntrinsic(target, internal, options),
    orchestratorTask: (payload, options) => runOrchestratorTaskIntrinsic(payload, internal, options),
    hook: (hookType, payload, options) => runHookIntrinsic(hookType, payload, internal, options),
    parallel: parallelHelpers,
    // Always provide a callable logger to processes so `ctx.log(...)` never throws.
    // Dispatches the babysitter-log hook with a single string payload.
    log: (message: unknown) => {
      if (typeof message !== "string" || !message) return;
      void callHook({
        hookType: "babysitter-log",
        payload: message,
        cwd: internal.runDir,
      }).catch(() => {
        // Never let logging break an orchestration.
      });
    },
  };

  return {
    context: processContext,
    internalContext: internal,
  };
}

export function withProcessContext<T>(internal: InternalProcessContext, fn: () => Promise<T> | T): Promise<T> {
  return contextStorage.run(internal, () => Promise.resolve().then(fn));
}

export function getActiveProcessContext(): InternalProcessContext | undefined {
  return contextStorage.getStore();
}

export function requireProcessContext(): InternalProcessContext {
  const ctx = getActiveProcessContext();
  if (!ctx) {
    throw new MissingProcessContextError();
  }
  return ctx;
}
