import { appendEvent } from "../storage/journal";
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

    const resultPayload = buildResultPayload(options);

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
      },
    });
    globalTaskRegistry.resolveEffect(options.effectId, {
      status: options.result.status === "ok" ? "resolved_ok" : "resolved_error",
      resultRef,
      stdoutRef,
      stderrRef,
      resolvedAt: resolvedEvent.recordedAt,
    });

    emitRuntimeMetric(options.logger, "commit.effect", {
      effectId: options.effectId,
      invocationKey: record.invocationKey,
      status: options.result.status,
      runDir: options.runDir,
      hasStdout: Boolean(stdoutRef),
      hasStderr: Boolean(stderrRef),
    });

    return {
      resultRef,
      stdoutRef: stdoutRef ?? undefined,
      stderrRef: stderrRef ?? undefined,
      startedAt: resultPayload.startedAt,
      finishedAt: resultPayload.finishedAt,
    };
  });
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
