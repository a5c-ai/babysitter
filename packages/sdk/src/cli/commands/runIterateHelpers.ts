/**
 * Helper functions for run:iterate command.
 * Extracted from runIterate.ts for max-lines compliance.
 */

import { loadJournal } from "../../storage/journal";
import { readStateCache } from "../../runtime/replay/stateCache";
import type { IterationResult } from "../../runtime/types";
import type { HookResult } from "../../hooks/types";
import type { JsonRecord } from "../../storage/types";

/**
 * Detect the current iteration count from state cache or journal.
 */
export async function detectIterationCount(runDir: string): Promise<number> {
  // Strategy 1: Read from state cache
  try {
    const stateCache = await readStateCache(runDir);
    if (stateCache && typeof stateCache.stateVersion === "number" && stateCache.stateVersion > 0) {
      const iterationCountFromJournal = await countIterationsFromJournal(runDir);
      if (iterationCountFromJournal > 0) {
        return iterationCountFromJournal;
      }
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

async function countIterationsFromJournal(runDir: string): Promise<number> {
  const events = await loadJournal(runDir);
  return events.filter((event) => event.type === "RUN_ITERATION").length;
}

/**
 * Derive a descriptive reason string from the iteration result and hook decision.
 */
export function deriveIterationReason(
  iterationResult: IterationResult,
  hookDecision: { action?: string; reason?: string },
  hooksExecuted: boolean
): string {
  if (hookDecision.reason) {
    return hookDecision.reason;
  }

  if (iterationResult.status === "completed") {
    return "terminal-state";
  }
  if (iterationResult.status === "failed") {
    return "terminal-state";
  }

  if (iterationResult.status === "waiting") {
    const pendingActions = iterationResult.nextActions;

    if (!pendingActions || pendingActions.length === 0) {
      return "no-pending-effects";
    }

    const kinds = new Set(pendingActions.map((a) => a.kind));

    if (kinds.size === 1) {
      const kind = kinds.values().next().value as string;
      if (kind === "breakpoint") return "breakpoint-waiting";
      if (kind === "sleep") return "sleep-waiting";
      if (kind === "node" || kind === "orchestrator_task") {
        if (hookDecision.action === "executed-tasks") {
          return "auto-runnable-tasks";
        }
        return `${kind}-pending`;
      }
      return `${kind}-pending`;
    }

    const sortedKinds = [...kinds].sort();
    return `mixed-pending:${sortedKinds.join(",")}`;
  }

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
 */
export function deriveHookStatus(hookResult: HookResult): string {
  if (hookResult.executedHooks?.length > 0) {
    const hasFailure = hookResult.executedHooks.some(h => h.status === "failed");
    return hasFailure ? "error" : "executed";
  }

  if (hookResult.error) {
    if (hookResult.error.includes("not found")) {
      return "no-hooks-configured";
    }
    return "error";
  }

  if (hookResult.success) {
    return "no-hooks-configured";
  }

  return "skipped";
}

export function parseHookDecision(output: unknown): {
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
