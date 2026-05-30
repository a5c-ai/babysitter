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

import { readRunMetadata, writeRunMetadata } from "../../storage/runFiles";
import { appendEvent } from "../../storage/journal";
import { callRuntimeHook } from "../../runtime/hooks/runtime";
import { orchestrateIteration } from "../../runtime/orchestrateIteration";
import type { EffectAction, SubprocessSupportMode } from "../../runtime/types";
import type { JsonRecord } from "../../storage/types";
import { resolveCompletionProof } from "../completionProof";
import { groupActionsByParallelGroup } from "../../tasks/grouping";
import { classifyWaitingActions } from "../../runtime/asyncEffects";
import { resolveProjectRootForRun } from "../../config";
import { hashProcessCodeFile } from "../../runtime/processCodeHash";
import {
  detectIterationCount,
  deriveIterationReason,
  deriveHookStatus,
  parseHookDecision,
} from "./runIterateHelpers";

export interface RunIterateOptions {
  runDir: string;
  iteration?: number;
  verbose?: boolean;
  json?: boolean;
  /**
   * Capabilities declared by the active harness adapter.
   * Used to gate parallel-group and background-classification enrichment.
   * When absent, no enrichment is applied (backward-compatible).
   */
  harnessCapabilities?: string[];
}

export interface RunIterateResult {
  iteration: number;
  iterationCount: number;
  status: "executed" | "waiting" | "completed" | "halted" | "failed" | "none";
  action?: string;
  reason?: string;
  count?: number;
  until?: number;
  nextActions?: EffectAction[];
  completionProof?: string;
  payload?: Record<string, unknown>;
  /** Parallel groups keyed by parallelGroupId. Only when harness declares concurrent-effects. */
  parallelGroups?: Record<string, EffectAction[]>;
  /** Background vs foreground classification. Only when harness declares background-effects. */
  backgroundClassification?: {
    blocking: EffectAction[];
    background: EffectAction[];
  };
  warnings?: string[];
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

  const projectRoot = resolveProjectRootForRun(runDir, metadata.entrypoint?.importPath);
  const warnings: string[] = [];
  const currentProcessCodeHash = await hashProcessCodeFile(metadata.entrypoint?.importPath, runDir);
  if (metadata.processCodeHash && currentProcessCodeHash && metadata.processCodeHash !== currentProcessCodeHash) {
    warnings.push("Process code changed since last recorded process hash; replay may need journal reconstruction.");
    const previousProcessCodeHash = metadata.processCodeHash;
    metadata.processCodeHash = currentProcessCodeHash;
    await writeRunMetadata(runDir, metadata);
    await appendEvent({
      runDir,
      eventType: "PROCESS_CODE_HASH_CHANGED",
      event: {
        runId,
        processId: metadata.processId,
        previousProcessCodeHash,
        processCodeHash: currentProcessCodeHash,
      },
    });
  }

  if (verbose) {
    console.error(`[run:iterate] Starting iteration ${iteration} for run ${runId}`);
    for (const warning of warnings) console.error(`[run:iterate] Warning: ${warning}`);
  }

  const subprocessSupport = detectPluginModeSubprocessSupport();
  const iterationResult = await orchestrateIteration({
    runDir,
    ...(subprocessSupport ? { subprocessSupport } : {}),
  });

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
      warnings: warnings.length ? warnings : undefined,
      metadata: { runId, processId: metadata.processId, hookStatus: "executed" },
    };
  }

  if (iterationResult.status === "halted") {
    await callRuntimeHook(
      "on-iteration-end",
      {
        runId,
        iteration,
        action: "none",
        status: "halted",
        reason: iterationResult.reason,
        payload: iterationResult.payload,
        timestamp: new Date().toISOString(),
      },
      { cwd: projectRoot, logger: verbose ? ((msg: string) => console.error(msg)) : undefined }
    );
    return {
      iteration,
      iterationCount,
      status: "halted",
      action: "none",
      reason: iterationResult.reason,
      payload: iterationResult.payload,
      warnings: warnings.length ? warnings : undefined,
      metadata: { runId, processId: metadata.processId, hookStatus: "executed" },
    };
  }

  if (iterationResult.status === "process-error") {
    const processError = (iterationResult as { error?: { message?: string } }).error;
    process.stderr.write(`[run:iterate] process-error: ${processError?.message ?? 'unknown'}\n`);
    return {
      iteration,
      iterationCount,
      status: "failed",
      action: "none",
      reason: `process-error: ${processError?.message ?? 'unknown'}`,
      warnings: warnings.length ? warnings : undefined,
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
      warnings: warnings.length ? warnings : undefined,
      metadata: { runId, processId: metadata.processId, hookStatus: "executed" },
    };
  }

  // === Call on-iteration-start hook ===
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

  const hookDecision = parseHookDecision(hookResult.output);
  const action = hookDecision.action ?? "none";
  const reason = deriveIterationReason(iterationResult, hookDecision, hookResult.executedHooks?.length > 0);
  const count = hookDecision.count;
  const until = hookDecision.until;

  if (verbose) {
    console.error(`[run:iterate] Hook action: ${action}, reason: ${reason}${count ? `, count: ${count}` : ""}`);
  }

  let status: RunIterateResult["status"];

  if (action === "executed-tasks") {
    status = "executed";
  } else if (action === "waiting") {
    status = "waiting";
  } else if (iterationResult.status === "waiting") {
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

  const result: RunIterateResult = {
    iteration,
    iterationCount,
    status,
    action,
    reason,
    count,
    until,
    nextActions: iterationResult.status === "waiting" ? iterationResult.nextActions : undefined,
    warnings: warnings.length ? warnings : undefined,
    metadata: {
      runId,
      processId: metadata.processId,
      hookStatus: deriveHookStatus(hookResult),
    },
  };

  // GAP-PAR enrichment (capability-gated, zero impact on external harnesses)
  if (result.status === "waiting" && result.nextActions && options.harnessCapabilities) {
    const caps = options.harnessCapabilities;
    if (caps.includes("concurrent-effects")) {
      const groupMap = groupActionsByParallelGroup(result.nextActions);
      const serializable: Record<string, EffectAction[]> = {};
      for (const [k, v] of groupMap.entries()) {
        serializable[k] = v;
      }
      result.parallelGroups = serializable;
    }
    if (caps.includes("background-effects")) {
      const classified = classifyWaitingActions(result.nextActions);
      result.backgroundClassification = {
        blocking: classified.blocking,
        background: classified.background,
      };
    }
  }

  return result;
}

function detectPluginModeSubprocessSupport(): SubprocessSupportMode | undefined {
  const hasSession = Boolean(process.env.AGENT_SESSION_ID);
  const hasPluginRoot = Boolean(process.env.AGENT_PLUGIN_ROOT || process.env.CODEX_PLUGIN_ROOT);
  const hasPluginCapabilities = Boolean(process.env.AGENT_CAPABILITIES_JSON);
  if (hasSession && (hasPluginRoot || hasPluginCapabilities)) {
    return "plugin-local";
  }
  return undefined;
}
