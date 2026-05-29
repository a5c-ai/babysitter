import { AsyncLocalStorage } from "async_hooks";
import { runTaskIntrinsic, TaskIntrinsicContext } from "./intrinsics/task";
import { runBreakpointIntrinsic } from "./intrinsics/breakpoint";
import { runSleepIntrinsic } from "./intrinsics/sleep";
import { runOrchestratorTaskIntrinsic } from "./intrinsics/orchestratorTask";
import { runHookIntrinsic } from "./intrinsics/hook";
import { callHook } from "../hooks/dispatcher";
import { runParallelAll, runParallelMap } from "./intrinsics/parallel";
import { ProcessContext, ParallelHelpers, ForwardFixStrikeBudget, StrikeTracker } from "./types";
import { MissingProcessContextError } from "./exceptions";
import { appendRunLog } from "../logging/runLogger";
import { createStrikeTracker, normalizeStrikeBudget } from "./strikeTracker";
import { promises as fs } from "node:fs";
import * as path from "node:path";

export interface ProcessContextInit extends Omit<TaskIntrinsicContext, "now"> {
  processId: string;
  now?: () => Date;
  /**
   * Set of PROCESS_LOG sequence numbers already recorded in the journal.
   * Built from journal PROCESS_LOG events during replay engine init.
   * Used to deduplicate ctx.log across iterations.
   */
  recordedLogSeqs?: Set<number>;
  /** When true, breakpoints are auto-approved without human interaction. */
  nonInteractive?: boolean;
  /**
   * Forward-fix strike-budget config. When provided, a {@link StrikeTracker}
   * is constructed and threaded into intrinsic contexts to enforce the
   * "two strikes, switch to instrumentation" rule.
   */
  forwardFixStrikeBudget?: ForwardFixStrikeBudget;
  /**
   * Optional pre-built strike tracker. Tests use this to inject a tracker
   * seeded with prior strikes; production code should leave it undefined and
   * let `createProcessContext` build a tracker from `forwardFixStrikeBudget`.
   */
  strikeTracker?: StrikeTracker;
}

export interface InternalProcessContext extends TaskIntrinsicContext {
  processId: string;
  now: () => Date;
  /** Counter for ctx.log calls — incremented on each invocation. */
  logSeq: number;
  /** Log seqs already in journal — skipped during replay. */
  recordedLogSeqs: Set<number>;
  /** When true, breakpoints are auto-approved without human interaction. */
  nonInteractive: boolean;
  /** Effective forward-fix strike budget (after defaults), or undefined when not configured. */
  forwardFixStrikeBudget?: ForwardFixStrikeBudget;
  /** Strike tracker, or undefined when no budget is configured. */
  strikeTracker?: StrikeTracker;
}

const contextStorage = new AsyncLocalStorage<InternalProcessContext>();

export interface CreateProcessContextResult {
  context: ProcessContext;
  internalContext: InternalProcessContext;
}

export function createProcessContext(init: ProcessContextInit): CreateProcessContextResult {
  const safeLogger = typeof init.logger === "function" ? init.logger : undefined;
  // Build (or reuse) the strike tracker when a budget is configured.
  let effectiveBudget: ForwardFixStrikeBudget | undefined;
  let strikeTracker: StrikeTracker | undefined = init.strikeTracker;
  if (init.forwardFixStrikeBudget) {
    effectiveBudget = normalizeStrikeBudget(init.forwardFixStrikeBudget);
    if (!strikeTracker) {
      strikeTracker = createStrikeTracker(effectiveBudget);
    }
  } else if (init.strikeTracker) {
    effectiveBudget = init.strikeTracker.budget;
  }
  const internal: InternalProcessContext = {
    ...init,
    logger: safeLogger,
    now: init.now ?? (() => new Date()),
    logSeq: 0,
    recordedLogSeqs: init.recordedLogSeqs ?? new Set(),
    nonInteractive: init.nonInteractive ?? false,
    forwardFixStrikeBudget: effectiveBudget,
    strikeTracker,
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
    //
    // Replay-aware: each ctx.log call gets a sequential logSeq. If the seq
    // is already in the journal (from a previous iteration), the call is a
    // no-op.  Only NEW log entries write to both the journal and the log
    // file, preventing replay duplicates.
    log: (...args: unknown[]) => {
      // Support ctx.log('label', 'message') and ctx.log('message')
      let label: string | undefined;
      let message: string;
      if (args.length >= 2 && typeof args[0] === "string" && typeof args[1] === "string") {
        label = args[0];
        message = args[1];
      } else if (typeof args[0] === "string") {
        message = args[0];
      } else {
        return;
      }
      if (!message) return;

      // Assign a sequential log number for replay deduplication
      const seq = ++internal.logSeq;

      // Already recorded in a previous iteration — skip
      if (internal.recordedLogSeqs.has(seq)) {
        return;
      }
      // Mark as recorded so same-iteration duplicates are also skipped
      internal.recordedLogSeqs.add(seq);

      // 1. Record log seq to state file for replay deduplication.
      //    Written to a separate file (not journal) to avoid race conditions
      //    with journal sequence numbering from fire-and-forget writes.
      void fs.appendFile(
        path.join(internal.runDir, "state", "logSeqs.txt"),
        `${seq}\n`,
      ).catch(() => {
        // Never let logging break orchestration.
      });

      // 2. Write to structured log file (~/.a5c/logs/<runId>/process.log)
      //    Only written when the journal entry is new (deduped above).
      void appendRunLog({
        timestamp: new Date().toISOString(),
        level: "info",
        type: "process",
        label,
        message,
        runId: internal.runId,
        processId: internal.processId,
        source: "ctx.log",
      }).catch(() => {
        // Never let logging break orchestration.
      });

      // 3. Dispatch babysitter-log hook for extensibility
      const hookPayload = label ? `${label} ${message}` : message;
      void callHook({
        hookType: "babysitter-log",
        payload: hookPayload,
        cwd: internal.runDir,
      }).catch(() => {
        // Never let logging break orchestration.
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
