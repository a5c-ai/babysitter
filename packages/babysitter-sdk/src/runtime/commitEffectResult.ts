import { appendEvent } from "../storage/journal";
import path from "node:path";
import { withRunLock } from "../storage/lock";
import { buildEffectIndex } from "./replay/effectIndex";
import {
  CommitEffectResultArtifacts,
  CommitEffectResultOptions,
  EffectRecord,
  SerializedEffectError,
} from "./types";
import { RunFailedError } from "./exceptions";
import { toSerializedEffectError } from "./errorUtils";
import { emitRuntimeMetric } from "./instrumentation";
import { globalTaskRegistry } from "../tasks/registry";
import { serializeAndWriteTaskResult } from "../tasks/serializer";
import { readTaskDefinition } from "../storage/tasks";
import { rebuildStateCache } from "./replay/stateCache";
import { checkRunWorkDirLeak } from "./workDirLeak";
import { assertRuntimeHookAllowed, callRuntimeHook } from "./hooks/runtime";
import { validateAgainstSchema } from "./schemaValidator";
import { enforceSignedBreakpointAnswer } from "../breakpoints/enforce-signed-breakpoint";
import { loadTrustedBreakpointPolicy } from "../breakpoints/trusted-breakpoint-policy";

export async function commitEffectResult(options: CommitEffectResultOptions): Promise<CommitEffectResultArtifacts> {
  return await withRunLock(options.runDir, "runtime:commitEffectResult", async () => {
    guardResultPayload(options);
    const effectIndex = await buildEffectIndex({ runDir: options.runDir });
    const record = effectIndex.getByEffectId(options.effectId);

    if (!record) {
      logCommitFailure(options, "unknown_effect");
      throw new RunFailedError(`Unknown effectId ${options.effectId}`);
    }

    if (record.status !== "requested") {
      logCommitFailure(options, "already_resolved", { currentStatus: record.status });
      throw new RunFailedError(`Effect ${options.effectId} is already resolved`);
    }

    ensureInvocationKeyMatches(options, record);
    await validateTaskResultOutputSchema(options, record);
    await enforceSignedBreakpointGate(options, record);

    const resultPayload = buildResultPayload(options);
    const taskCompletedHookResult = await callRuntimeHook(
      "task.completed",
      {
        runId: path.basename(options.runDir),
        task_id: options.effectId,
        task_kind: record.kind,
        task_status: options.result.status,
        task_result: options.result.status === "ok" ? options.result.value : options.result.error,
        taskId: record.taskId,
        effectId: options.effectId,
        kind: record.kind,
        status: options.result.status,
        result: options.result.status === "ok" ? options.result.value : options.result.error,
      },
      { cwd: options.runDir, logger: options.logger },
    );
    assertRuntimeHookAllowed(taskCompletedHookResult, "task.completed");

    const { resultRef, stdoutRef: writtenStdoutRef, stderrRef: writtenStderrRef } = await serializeAndWriteTaskResult({
      runDir: options.runDir,
      effectId: options.effectId,
      taskId: requireTaskId(record),
      invocationKey: record.invocationKey,
      payload: resultPayload,
    });
    const stdoutRef = resultPayload.stdoutRef ?? writtenStdoutRef;
    const stderrRef = resultPayload.stderrRef ?? writtenStderrRef;
    const eventError = resultPayload.status === "error" ? resultPayload.error : undefined;

    // Enrich breakpoint EFFECT_RESOLVED events with breakpointId from task metadata
    let breakpointId: string | undefined;
    if (record.kind === "breakpoint" || record.taskId === "__sdk.breakpoint") {
      try {
        const taskDef = await readTaskDefinition(options.runDir, options.effectId);
        breakpointId = (taskDef?.metadata as Record<string, unknown> | undefined)?.breakpointId as string | undefined;
      } catch {
        // Non-critical: skip enrichment if task.json is unreadable
      }
    }

    const resolvedEvent = await appendEvent({
      runDir: options.runDir,
      eventType: "EFFECT_RESOLVED",
      event: {
        effectId: options.effectId,
        status: options.result.status,
        resultRef,
        error: eventError,
        stdoutRef,
        stderrRef,
        startedAt: resultPayload.startedAt,
        finishedAt: resultPayload.finishedAt,
        ...(breakpointId ? { breakpointId } : {}),
      },
    });
    globalTaskRegistry.resolveEffect(options.effectId, {
      status: options.result.status === "ok" ? "resolved_ok" : "resolved_error",
      resultRef,
      stdoutRef,
      stderrRef,
      resolvedAt: resolvedEvent.recordedAt,
    });
    await rebuildStateCache(options.runDir, { reason: "post_effect_resolution" });

    emitRuntimeMetric(options.logger, "commit.effect", {
      effectId: options.effectId,
      invocationKey: record.invocationKey,
      status: options.result.status,
      runDir: options.runDir,
      hasStdout: Boolean(stdoutRef),
      hasStderr: Boolean(stderrRef),
    });
    await checkRunWorkDirLeak(options.runDir, options.logger, "effect-resolved");

    return {
      resultRef,
      stdoutRef: stdoutRef ?? undefined,
      stderrRef: stderrRef ?? undefined,
      startedAt: resultPayload.startedAt,
      finishedAt: resultPayload.finishedAt,
    };
  });
}

export interface CommitEffectCancellationOptions {
  runDir: string;
  effectId: string;
  reason?: string;
  logger?: import("./types").ProcessLogger;
}

export async function commitEffectCancellation(
  options: CommitEffectCancellationOptions,
): Promise<{ resultRef: string }> {
  return await withRunLock(options.runDir, "runtime:commitEffectCancellation", async () => {
    const effectIndex = await buildEffectIndex({ runDir: options.runDir });
    const record = effectIndex.getByEffectId(options.effectId);

    if (!record) {
      throw new RunFailedError(`Unknown effectId ${options.effectId}`);
    }

    if (record.status !== "requested") {
      throw new RunFailedError(`Effect ${options.effectId} is not requested (status=${record.status})`);
    }

    const { resultRef } = await serializeAndWriteTaskResult({
      runDir: options.runDir,
      effectId: options.effectId,
      taskId: requireTaskId(record),
      invocationKey: record.invocationKey,
      payload: {
        status: "cancelled",
        reason: options.reason,
        error: { name: "EffectCancelledError", message: options.reason ?? "Effect cancelled" },
        metadata: { cancelled: true, reason: options.reason },
      },
    });

    const cancelledEvent = await appendEvent({
      runDir: options.runDir,
      eventType: "EFFECT_CANCELLED",
      event: {
        effectId: options.effectId,
        reason: options.reason,
      },
    });
    await rebuildStateCache(options.runDir, { reason: "post_effect_cancellation" });

    globalTaskRegistry.resolveEffect(options.effectId, {
      status: "cancelled",
      resultRef,
      resolvedAt: cancelledEvent.recordedAt,
    });

    emitRuntimeMetric(options.logger, "commit.effect.cancel", {
      effectId: options.effectId,
      invocationKey: record.invocationKey,
      status: "cancelled",
      runDir: options.runDir,
      reason: options.reason,
    });
    await checkRunWorkDirLeak(options.runDir, options.logger, "effect-cancelled");

    return { resultRef };
  });
}

/**
 * Milestone C (AC-4 / AC-7 / AC-28 / AC-35 / AC-36 / AC-48) — enforced signed human
 * breakpoints, anchored to the INTEGRITY-PROTECTED trust config (never task.json).
 *
 * TRUST SOURCE. The signature REQUIREMENT and the set of trusted `human` keys are
 * sourced ONLY from the out-of-agent trust anchor the design §10 defines — the pinned
 * config root (`POLICY_CONFIG_ROOT_FP`, off-workspace) → the signed
 * `.policy/config-manifest.json` (monotonic-epoch, AC-46) → `.policy/trust-roots.json`
 * + `.policy/breakpoint-policy.json` — via `loadTrustedBreakpointPolicy`
 * (breakpoints/trusted-breakpoint-policy.ts). The per-effect `tasks/<id>/task.json` —
 * which the workspace-writable agent can delete/corrupt/rewrite — is NEVER the source
 * of the requirement or the trusted keys. The breakpoint IDENTITY is taken from the
 * append-only JOURNAL (the effect's `invocationKey`, recorded at breakpoint-creation),
 * not task.json.
 *
 * FAIL CLOSED (defect 1). When the config anchor is pinned but cannot be trustworthily
 * established (missing/edited/corrupt/untrusted manifest or config, below-floor epoch),
 * a breakpoint the trusted policy marks as requiring a signature is REJECTED — never
 * skipped. When NO anchor is pinned (pre-Milestone-C default), enforcement is inactive
 * and unsigned answers are unaffected (back-compat).
 *
 * DEFECT 2. The trusted human root set is passed to the enforcement decision, which
 * additionally requires the raw-verified signer fingerprint to be a member — so a key
 * the attacker drops into a run-dir directory is not trusted even if proven's raw
 * verify succeeds.
 *
 * This runs BEFORE the result is written / EFFECT_RESOLVED is emitted, so a rejected
 * answer leaves the effect PENDING. Non-breakpoint effects / non-`ok` statuses are
 * unaffected.
 */
async function enforceSignedBreakpointGate(options: CommitEffectResultOptions, record: EffectRecord) {
  if (record.kind !== "breakpoint" && record.taskId !== "__sdk.breakpoint") return;
  if (options.result.status !== "ok") return;

  // Load the trust-anchored policy. projectRoot is the base for the default `.policy`
  // location; the real off-workspace pin is POLICY_CONFIG_DIR / the env pins. This is
  // NOT the per-effect task dir.
  const policy = await loadTrustedBreakpointPolicy(process.cwd());

  // No anchor pinned → enforcement inactive → back-compat pass-through.
  if (!policy.enforcementActive) return;

  // The breakpoint id comes from the append-only journal (the effect's invocationKey),
  // NOT task.json — so the adversary cannot erase the requirement by editing task.json.
  const breakpointId = deriveBreakpointIdFromRecord(record);

  const requiresSignature = policy.requiresSignature(breakpointId);
  if (!requiresSignature) return;

  // A signature IS required for this breakpoint. If the trust anchor could not be
  // established, we fail CLOSED (deny) — the requirement cannot be trustworthily
  // determined, so the post is rejected and the effect stays pending.
  if (policy.configError) {
    logCommitFailure(options, "signed_breakpoint_rejected", {
      taskId: record.taskId,
      kind: record.kind,
      reason: `trusted config unavailable: ${policy.configError}`,
    });
    throw new RunFailedError(
      `Signed-breakpoint enforcement could not establish trust for effect ${options.effectId}: ${policy.configError}`,
      {
        details: {
          reason: "signed_breakpoint_rejected",
          effectId: options.effectId,
          taskId: record.taskId,
          kind: record.kind,
        },
      },
    );
  }

  // Extract the answer object from the committed value and enforce, anchoring WHICH
  // keys are trusted to the manifest-verified trust-roots (defect 2).
  const answer = extractBreakpointAnswer(options.result.value);
  const decision = await enforceSignedBreakpointAnswer(answer, {
    signatureRequired: true,
    trustedKeysDir: policy.trustedKeysBaseDir,
    trustedHumanFingerprints: policy.trustedHumanFingerprints,
  });

  if (!decision.accepted) {
    logCommitFailure(options, "signed_breakpoint_rejected", {
      taskId: record.taskId,
      kind: record.kind,
      reason: decision.reason,
    });
    throw new RunFailedError(
      `Signed-breakpoint enforcement rejected the answer for effect ${options.effectId}: ${decision.reason ?? "unsigned or invalid"}`,
      {
        details: {
          reason: "signed_breakpoint_rejected",
          effectId: options.effectId,
          taskId: record.taskId,
          kind: record.kind,
        },
      },
    );
  }
}

/**
 * Derive the breakpointId from the effect's JOURNAL-recorded invocation key (never
 * task.json). Breakpoint effects use `__sdk.breakpoint.<breakpointId>` (with an optional
 * `.<n>` occurrence suffix for repeated breakpoints, see intrinsics/breakpoint.ts).
 * Returns undefined when the shape does not match — the trusted policy then applies its
 * fail-closed default (an unidentifiable breakpoint under an active anchor requires a
 * signature).
 */
function deriveBreakpointIdFromRecord(record: EffectRecord): string | undefined {
  const key = record.invocationKey;
  const prefix = "__sdk.breakpoint.";
  if (typeof key !== "string" || !key.startsWith(prefix)) return undefined;
  let rest = key.slice(prefix.length);
  // Strip a trailing numeric occurrence suffix (".1", ".2", …) added for repeats.
  const suffixMatch = rest.match(/\.(\d+)$/);
  if (suffixMatch) rest = rest.slice(0, rest.length - suffixMatch[0].length);
  return rest.length > 0 ? rest : undefined;
}

/**
 * Extract the breakpoint answer record from a committed effect value. The value may
 * BE the answer, or wrap it under `answer` / `result`.
 */
function extractBreakpointAnswer(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const v = value as Record<string, unknown>;
    if (v.answer && typeof v.answer === "object" && !Array.isArray(v.answer)) {
      return v.answer as Record<string, unknown>;
    }
    if (v.result && typeof v.result === "object" && !Array.isArray(v.result) && ("approved" in (v.result as object) || "signature" in (v.result as object))) {
      return v.result as Record<string, unknown>;
    }
    return v;
  }
  return {};
}

async function validateTaskResultOutputSchema(options: CommitEffectResultOptions, record: EffectRecord) {
  if (record.kind !== "shell" || options.result.status !== "ok") {
    return;
  }

  const taskDef = await readTaskDefinition(options.runDir, options.effectId);
  const outputSchema = taskDef?.outputSchema;
  if (!isJsonSchemaRecord(outputSchema)) {
    return;
  }

  const validation = validateAgainstSchema(options.result.value, outputSchema);
  if (validation.valid) {
    return;
  }

  logCommitFailure(options, "validation_error", {
    taskId: record.taskId,
    kind: record.kind,
    errors: validation.errors,
  });
  throw new RunFailedError(`Shell task result failed outputSchema validation for effect ${options.effectId}`, {
    details: {
      reason: "validation_error",
      effectId: options.effectId,
      taskId: record.taskId,
      kind: record.kind,
      errors: validation.errors,
    },
  });
}

function isJsonSchemaRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function ensureInvocationKeyMatches(options: CommitEffectResultOptions, record: EffectRecord) {
  if (!options.invocationKey) return;
  if (options.invocationKey === record.invocationKey) {
    return;
  }
  logCommitFailure(options, "invocation_mismatch", {
    expectedInvocationKey: record.invocationKey,
    providedInvocationKey: options.invocationKey,
  });
  throw new RunFailedError(`Invocation key mismatch for effect ${options.effectId}`, {
    effectId: options.effectId,
    expectedInvocationKey: record.invocationKey,
    providedInvocationKey: options.invocationKey,
  });
}

function serializeEffectError(error: unknown): SerializedEffectError {
  return toSerializedEffectError(error);
}

function guardResultPayload(options: CommitEffectResultOptions) {
  try {
    validateResultPayload(options);
  } catch (error) {
    logCommitFailure(options, "invalid_payload", {
      message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

function validateResultPayload(options: CommitEffectResultOptions) {
  if (options.result.status === "ok" && options.result.error !== undefined) {
    throw new RunFailedError("Cannot provide an error payload when result status is 'ok'");
  }
  if (options.result.status === "ok" && options.result.value === undefined) {
    throw new RunFailedError("Missing result payload for result status 'ok'");
  }
  if (options.result.status === "error" && options.result.error === undefined) {
    throw new RunFailedError("Missing error payload for result status 'error'");
  }
  if (options.result.stdout !== undefined && typeof options.result.stdout !== "string") {
    throw new RunFailedError("stdout must be a string when provided");
  }
  if (options.result.stderr !== undefined && typeof options.result.stderr !== "string") {
    throw new RunFailedError("stderr must be a string when provided");
  }
  if (options.result.stdoutRef !== undefined && typeof options.result.stdoutRef !== "string") {
    throw new RunFailedError("stdoutRef must be a string when provided");
  }
  if (options.result.stderrRef !== undefined && typeof options.result.stderrRef !== "string") {
    throw new RunFailedError("stderrRef must be a string when provided");
  }
  if (options.result.startedAt !== undefined && typeof options.result.startedAt !== "string") {
    throw new RunFailedError("startedAt must be an ISO timestamp string when provided");
  }
  if (options.result.finishedAt !== undefined && typeof options.result.finishedAt !== "string") {
    throw new RunFailedError("finishedAt must be an ISO timestamp string when provided");
  }
  if (
    options.result.metadata !== undefined &&
    (options.result.metadata === null || typeof options.result.metadata !== "object" || Array.isArray(options.result.metadata))
  ) {
    throw new RunFailedError("metadata must be a JsonRecord when provided");
  }
}

function logCommitFailure(options: CommitEffectResultOptions, reason: string, extra: Record<string, unknown> = {}) {
  emitRuntimeMetric(options.logger, "commit.effect", {
    effectId: options.effectId,
    status: "rejected",
    reason,
    runDir: options.runDir,
    invocationKey: options.invocationKey,
    ...extra,
  });
}

function buildResultPayload(options: CommitEffectResultOptions) {
  const base = {
    stdout: options.result.stdout,
    stderr: options.result.stderr,
    stdoutRef: options.result.stdoutRef,
    stderrRef: options.result.stderrRef,
    startedAt: options.result.startedAt,
    finishedAt: options.result.finishedAt,
    metadata: options.result.metadata,
  };
  if (options.result.status === "ok") {
    return {
      status: "ok" as const,
      result: options.result.value,
      ...base,
    };
  }
  return {
    status: "error" as const,
    error: serializeEffectError(options.result.error),
    ...base,
  };
}

function requireTaskId(record: EffectRecord): string {
  if (record.taskId) {
    return record.taskId;
  }
  throw new RunFailedError(`Effect ${record.effectId} is missing task id metadata`, {
    effectId: record.effectId,
  });
}
