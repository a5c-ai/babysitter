/**
 * Posts task results back to the babysitter runtime.
 *
 * After an effect has been executed (by the effect-executor or externally)
 * the result must be committed to the run's journal so the next iteration
 * can replay it.  This module calls `commitEffectResult` from the SDK
 * directly — no CLI subprocess, no JSON scraping, no carrier pigeons.
 *
 * @module result-poster
 */

import {
  commitEffectResult,
  type CommitEffectResultOptions,
  type CommitEffectResultArtifacts,
} from '@a5c-ai/babysitter-sdk';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Options accepted by {@link postResult}. */
export interface PostResultOptions {
  /** Absolute path to the run directory. */
  runDir: string;
  /** The effect identifier to resolve. */
  effectId: string;
  /** Whether the task succeeded or failed. */
  status: 'ok' | 'error';
  /** The task's return value (when status is 'ok'). */
  value?: unknown;
  /** Error payload (when status is 'error'). */
  error?: unknown;
  /** Optional stdout captured during execution. */
  stdout?: string;
  /** Optional stderr captured during execution. */
  stderr?: string;
  /** ISO-8601 timestamp when the task started executing. */
  startedAt?: string;
  /** ISO-8601 timestamp when the task finished executing. */
  finishedAt?: string;
}

/** Artifacts returned after a result has been committed. */
export type PostResultArtifacts = CommitEffectResultArtifacts;

// ---------------------------------------------------------------------------
// postResult
// ---------------------------------------------------------------------------

/**
 * Commit an effect result directly via the SDK.
 *
 * Translates the extension's {@link PostResultOptions} into a
 * {@link CommitEffectResultOptions} and delegates to the SDK's
 * `commitEffectResult`.  The returned artifacts include the persisted
 * `resultRef` and optional `stdoutRef` / `stderrRef` paths.
 */
export async function postResult(
  opts: PostResultOptions,
): Promise<PostResultArtifacts> {
  const sdkOpts: CommitEffectResultOptions = {
    runDir: opts.runDir,
    effectId: opts.effectId,
    result: {
      status: opts.status,
      value: opts.status === 'ok' ? opts.value : undefined,
      error: opts.status === 'error' ? opts.error : undefined,
      stdout: opts.stdout,
      stderr: opts.stderr,
      startedAt: opts.startedAt,
      finishedAt: opts.finishedAt,
    },
  };

  return await commitEffectResult(sdkOpts);
}

// ---------------------------------------------------------------------------
// postOkResult
// ---------------------------------------------------------------------------

/**
 * Convenience wrapper for posting a successful result.
 *
 * @param runDir   - Absolute path to the run directory.
 * @param effectId - The effect identifier to resolve.
 * @param value    - The task's return value.
 */
export async function postOkResult(
  runDir: string,
  effectId: string,
  value: unknown,
): Promise<void> {
  await postResult({ runDir, effectId, status: 'ok', value });
}

// ---------------------------------------------------------------------------
// postErrorResult
// ---------------------------------------------------------------------------

/**
 * Convenience wrapper for posting a failed result.
 *
 * @param runDir   - Absolute path to the run directory.
 * @param effectId - The effect identifier to resolve.
 * @param error    - The error payload describing what went wrong.
 */
export async function postErrorResult(
  runDir: string,
  effectId: string,
  error: unknown,
): Promise<void> {
  await postResult({ runDir, effectId, status: 'error', error });
}
