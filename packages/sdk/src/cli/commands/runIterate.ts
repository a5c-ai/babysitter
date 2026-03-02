/**
 * run:iterate command - Execute one orchestration iteration
 *
 * This command:
 * 1. Calls on-iteration-start hooks to get orchestration decisions
 * 2. Returns effects to stdout as JSON
 * 3. External orchestrator (skill) performs the effects
 * 4. Calls on-iteration-end hooks for finalization
 *
 * The command does NOT loop - it handles exactly one iteration.
 */

import * as path from "path";
import { readRunMetadata } from "../../storage/runFiles";
import { loadJournal } from "../../storage/journal";
import { readStateCache } from "../../runtime/replay/stateCache";
import { callRuntimeHook } from "../../runtime/hooks/runtime";
import { orchestrateIteration } from "../../runtime/orchestrateIteration";
import type { EffectAction, IterationResult } from "../../runtime/types";
import type { HookResult } from "../../hooks/types";
import type { JsonRecord } from "../../storage/types";
import { resolveCompletionProof } from "../completionProof";

export interface RunIterateOptions {
  runDir: string;
  iteration?: number;
  verbose?: boolean;
  json?: boolean;
}

export interface RunIterateResult {
  iteration: number;
  iterationCount: number;
  status: "executed" | "waiting" | "completed" | "failed" | "none";
  action?: string;
  reason?: string;
  count?: number;
  until?: number;
  nextActions?: EffectAction[];
  completionProof?: string;
  metadata?: {
    runId: string;
    processId: string;
    hookStatus?: string;
  };
}

export async function runIterate(options: RunIterateOptions): Promise<RunIterateResult> {
  const { runDir, verbose } = options;

  // Read run metadata
  const metadata = await readRunMetadata(runDir);
  const runId = metadata.runId;

  // Determine iteration number from state cache or journal
  const iterationCount = await detectIterationCount(runDir);
  const iteration = options.iteration ?? (iterationCount + 1);

  const projectRoot = path.dirname(path.dirname(path.dirname(runDir)));

  if (verbose) {
    console.error(`[run:iterate] Starting iteration ${iteration} for run ${runId}`);
  }

  // First, advance the runtime one step to request pending effects (if any).
  // This is what creates EFFECT_REQUESTED entries that hooks can observe via task:list.
  const iterationResult = await orchestrateIteration({ runDir });

  if (iterationResult.status === "completed") {
    const completionProof = resolveCompletionProof(metadata);
    await callRuntimeHook(
      "on-iteration-end",
      {
        runId,
        iteration,
        action: "none",
        status: "completed",
        reason: "completed",
        timestamp: new Date().toISOString(),
      },
      { cwd: projectRoot, logger: verbose ? ((msg: string) => console.error(msg)) : undefined }
    );
    return {
      iteration,
      iterationCount,
      status: "completed",
      action: "none",
      reason: "completed",
      completionProof,
      metadata: { runId, processId: metadata.processId, hookStatus: "executed" },
    };
  }

  if (iterationResult.status === "failed") {
    await callRuntimeHook(
      "on-iteration-end",
      {
        runId,
        iteration,
        action: "none",
        status: "failed",
        reason: "failed",
        timestamp: new Date().toISOString(),
      },
      { cwd: projectRoot, logger: verbose ? ((msg: string) => console.error(msg)) : undefined }
    );
    return {
      iteration,
      iterationCount,
      status: "failed",
      action: "none",
      reason: "failed",
      metadata: { runId, processId: metadata.processId, hookStatus: "executed" },
    };
  }

  // === Call on-iteration-start hook ===
  // Hook may execute/post effects that were requested by orchestrateIteration().
  const iterationStartPayload: JsonRecord = {
    runId,
    iteration,
    status: iterationResult.status,
    pending: iterationResult.status === "waiting" ? iterationResult.nextActions : [],
    timestamp: new Date().toISOString(),
  };

  const hookResult = await callRuntimeHook("on-iteration-start", iterationStartPayload, {
    cwd: projectRoot,
    logger: verbose ? ((msg: string) => console.error(msg)) : undefined,
  });

  // Parse hook output
  const hookDecision = parseHookDecision(hookResult.output);
  const action = hookDecision.action ?? "none";
  const reason = deriveIterationReason(iterationResult, hookDecision, hookResult.executedHooks?.length > 0);
  const count = hookDecision.count;
  const until = hookDecision.until;

  if (verbose) {
    console.error(`[run:iterate] Hook action: ${action}, reason: ${reason}${count ? `, count: ${count}` : ""}`);
  }

  // Determine result status based on hook action
  let status: RunIterateResult["status"];

  if (action === "executed-tasks") {
    status = "executed";
  } else if (action === "waiting") {
    status = "waiting";
  } else if (iterationResult.status === "waiting") {
    // If the hook didn't execute anything, surface runtime waiting details.
    status = "waiting";
  } else {
    status = "none";
  }

  // === Call on-iteration-end hook ===
  const iterationEndPayload = {
    runId,
    iteration,
    action,
    status,
    reason,
    count,
    timestamp: new Date().toISOString(),
  };

  await callRuntimeHook(
    "on-iteration-end",
    iterationEndPayload,
    {
      cwd: projectRoot,
      logger: verbose ? ((msg: string) => console.error(msg)) : undefined,
    }
  );

  // Return result
  const result: RunIterateResult = {
    iteration,
    iterationCount,
    status,
    action,
    reason,
    count,
    until,
    nextActions: iterationResult.status === "waiting" ? iterationResult.nextActions : undefined,
    metadata: {
      runId,
      processId: metadata.processId,
      hookStatus: deriveHookStatus(hookResult),
    },
  };

  return result;
}

/**
 * Detect the current iteration count from state cache or journal.
 *
 * The iteration count represents how many iterations have been completed so far.
 * This is used to determine the next iteration number when --iteration is not specified.
 *
 * Strategy:
 * 1. Read from state.json (stateCache snapshot) if available - uses stateVersion
 *    which tracks the journal sequence number
 * 2. Fall back to counting RUN_ITERATION events in the journal
 * 3. Return 0 if neither is available (fresh run)
 */
async function detectIterationCount(runDir: string): Promise<number> {
  // Strategy 1: Read from state cache
  try {
    const stateCache = await readStateCache(runDir);
    if (stateCache && typeof stateCache.stateVersion === "number" && stateCache.stateVersion > 0) {
      // stateVersion tracks journal sequence, which correlates to iteration progress
      // We derive iteration count from the number of completed iteration cycles
      // Each iteration typically produces multiple journal events, so we use
      // RUN_ITERATION event count as the more accurate measure
      const iterationCountFromJournal = await countIterationsFromJournal(runDir);
      if (iterationCountFromJournal > 0) {
        return iterationCountFromJournal;
      }
      // If no RUN_ITERATION events but we have state, estimate from stateVersion
      // This provides backward compatibility for runs that don't log RUN_ITERATION
      return Math.max(0, Math.floor(stateCache.stateVersion / 2));
    }
  } catch {
    // State cache not available, fall through to journal
  }

  // Strategy 2: Count RUN_ITERATION events in journal
  try {
    return await countIterationsFromJournal(runDir);
  } catch {
    // Journal not available
  }

  // Strategy 3: Default to 0 for fresh runs
  return 0;
}

/**
 * Count the number of RUN_ITERATION events in the journal.
 * Each RUN_ITERATION event represents one completed iteration.
 */
async function countIterationsFromJournal(runDir: string): Promise<number> {
  const events = await loadJournal(runDir);
  return events.filter((event) => event.type === "RUN_ITERATION").length;
}

/**
 * Derive a descriptive reason string from the iteration result and hook decision.
 *
 * When the hook provides an explicit reason, that takes priority. Otherwise,
 * the reason is inferred from the iteration state: the status of the run and
 * the kinds of any pending effects.
 */
function deriveIterationReason(
  iterationResult: IterationResult,
  hookDecision: { action?: string; reason?: string },
  hooksExecuted: boolean
): string {
  // If the hook explicitly provided a reason, use it.
  if (hookDecision.reason) {
    return hookDecision.reason;
  }

  // Terminal states
  if (iterationResult.status === "completed") {
    return "terminal-state";
  }
  if (iterationResult.status === "failed") {
    return "terminal-state";
  }

  // Waiting state — inspect pending effect kinds
  if (iterationResult.status === "waiting") {
    const pendingActions = iterationResult.nextActions;

    if (!pendingActions || pendingActions.length === 0) {
      return "no-pending-effects";
    }

    // Collect the unique kinds of pending effects
    const kinds = new Set(pendingActions.map((a) => a.kind));

    // Map known effect kinds to descriptive reasons
    if (kinds.size === 1) {
      const kind = kinds.values().next().value as string;
      if (kind === "breakpoint") return "breakpoint-waiting";
      if (kind === "sleep") return "sleep-waiting";
      if (kind === "node" || kind === "orchestrator_task") {
        // Hook ran tasks automatically
        if (hookDecision.action === "executed-tasks") {
          return "auto-runnable-tasks";
        }
        return `${kind}-pending`;
      }
      // Unknown/custom effect kind
      return `${kind}-pending`;
    }

    // Multiple different kinds — list them
    const sortedKinds = [...kinds].sort();
    return `mixed-pending:${sortedKinds.join(",")}`;
  }

  // Hook was configured but gave no reason
  if (hooksExecuted && !hookDecision.reason) {
    if (hookDecision.action === "executed-tasks") {
      return "auto-runnable-tasks";
    }
    return "no-reason-provided";
  }

  return "no-pending-effects";
}

/**
 * Derive a descriptive hookStatus string from the hook result.
 *
 * - "executed" — hooks were found and executed successfully
 * - "no-hooks-configured" — no hook directories or hooks found (dispatcher missing or no hooks matched)
 * - "error" — hooks were found but failed during execution
 * - "skipped" — hook execution was not attempted (e.g., callRuntimeHook caught an exception)
 */
function deriveHookStatus(hookResult: HookResult): string {
  if (hookResult.executedHooks?.length > 0) {
    // At least one hook was found and executed
    const hasFailure = hookResult.executedHooks.some(h => h.status === "failed");
    return hasFailure ? "error" : "executed";
  }

  // No hooks executed — determine why
  if (hookResult.error) {
    // Check if the error indicates the dispatcher was not found,
    // which means no hook directories are configured at all
    if (hookResult.error.includes("not found")) {
      return "no-hooks-configured";
    }
    // Some other error occurred (timeout, spawn failure, etc.)
    return "error";
  }

  // Dispatcher ran successfully but no hooks matched the hook type
  if (hookResult.success) {
    return "no-hooks-configured";
  }

  // Fallback: hook execution was not attempted or result is ambiguous
  return "skipped";
}

function parseHookDecision(output: unknown): {
  action?: string;
  reason?: string;
  count?: number;
  until?: number;
  status?: string;
} {
  const record = parseMaybeJsonRecord(output);
  if (!record) return {};
  const action = typeof record.action === "string" ? record.action : undefined;
  const reason = typeof record.reason === "string" ? record.reason : undefined;
  const status = typeof record.status === "string" ? record.status : undefined;
  const count = typeof record.count === "number" ? record.count : undefined;
  const until = typeof record.until === "number" ? record.until : undefined;
  return { action, reason, status, count, until };
}

function parseMaybeJsonRecord(output: unknown): JsonRecord | undefined {
  if (!output) return undefined;
  if (typeof output === "object" && !Array.isArray(output)) {
    return output as JsonRecord;
  }
  if (typeof output !== "string") return undefined;
  try {
    const parsed = JSON.parse(output) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as JsonRecord) : undefined;
  } catch {
    return undefined;
  }
}
