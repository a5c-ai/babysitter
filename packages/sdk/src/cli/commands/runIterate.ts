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
import type { EffectAction } from "../../runtime/types";
import type { JsonRecord } from "../../storage/types";
import { resolveCompletionSecret } from "../completionSecret";

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
  completionSecret?: string;
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
    const completionSecret = resolveCompletionSecret(metadata);
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
      completionSecret,
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
  const reason = hookDecision.reason ?? "unknown";
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
      hookStatus: hookResult.executedHooks?.length > 0 ? "executed" : "none",
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
