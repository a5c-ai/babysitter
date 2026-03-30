/**
 * Babysitter SDK bridge for the oh-my-pi extension.
 *
 * Replaces the former `cli-wrapper` module with direct SDK function calls.
 * No child processes are spawned, no stdout is parsed, and no JSON is
 * scraped from a subprocess pipe.  Instead we import the runtime and
 * storage layers from `@a5c-ai/babysitter-sdk` and call them in-process.
 *
 * Every other module in this extension that needs to talk to babysitter
 * should go through this bridge so there is exactly one place to handle
 * option translation and error mapping.
 *
 * @module sdk-bridge
 */

import {
  createRun,
  orchestrateIteration,
  commitEffectResult,
  type CreateRunOptions,
  type CreateRunResult,
  type OrchestrateOptions,
  type IterationResult,
  type CommitEffectResultOptions,
  type CommitEffectResultArtifacts,
  type EffectAction,
} from '@a5c-ai/babysitter-sdk';

import {
  loadJournal,
  readRunMetadata,
} from '@a5c-ai/babysitter-sdk';

// ---------------------------------------------------------------------------
// Error wrapper
// ---------------------------------------------------------------------------

/** Structured error surfaced by the SDK bridge. */
export class SdkBridgeError extends Error {
  /** The original error thrown by the SDK, if any. */
  readonly cause: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'SdkBridgeError';
    this.cause = cause;
  }
}

// ---------------------------------------------------------------------------
// createNewRun
// ---------------------------------------------------------------------------

/**
 * Create a brand-new babysitter run.
 *
 * Translates the extension's simplified option bag into the shape expected
 * by the SDK's {@link createRun} and returns the result as-is.
 */
export async function createNewRun(opts: {
  runsDir: string;
  processId: string;
  importPath: string;
  exportName?: string;
  inputs?: unknown;
  prompt?: string;
}): Promise<CreateRunResult> {
  try {
    const sdkOpts: CreateRunOptions = {
      runsDir: opts.runsDir,
      process: {
        processId: opts.processId,
        importPath: opts.importPath,
        exportName: opts.exportName,
      },
      inputs: opts.inputs,
      prompt: opts.prompt,
    };
    return await createRun(sdkOpts);
  } catch (error) {
    throw new SdkBridgeError(
      `Failed to create run for process "${opts.processId}"`,
      error,
    );
  }
}

// ---------------------------------------------------------------------------
// iterate
// ---------------------------------------------------------------------------

/**
 * Run a single orchestration iteration against an existing run.
 *
 * The caller hands us the `runDir` (not the run ID) so there is no
 * ambiguity about which run-directory layout to use.
 */
export async function iterate(
  runDir: string,
  opts?: {
    inputs?: unknown;
    context?: Record<string, unknown>;
  },
): Promise<IterationResult> {
  try {
    const sdkOpts: OrchestrateOptions = {
      runDir,
      inputs: opts?.inputs,
      context: opts?.context,
    };
    return await orchestrateIteration(sdkOpts);
  } catch (error) {
    throw new SdkBridgeError(
      `Iteration failed for runDir "${runDir}"`,
      error,
    );
  }
}

// ---------------------------------------------------------------------------
// postResult
// ---------------------------------------------------------------------------

/**
 * Post an effect result (task completion) back into a run's journal.
 *
 * This is the SDK equivalent of `babysitter task:post`.
 */
export async function postResult(opts: {
  runDir: string;
  effectId: string;
  status: 'ok' | 'error';
  value?: unknown;
  error?: unknown;
}): Promise<CommitEffectResultArtifacts> {
  try {
    const sdkOpts: CommitEffectResultOptions = {
      runDir: opts.runDir,
      effectId: opts.effectId,
      result: {
        status: opts.status,
        value: opts.status === 'ok' ? opts.value : undefined,
        error: opts.status === 'error' ? opts.error : undefined,
      },
    };
    return await commitEffectResult(sdkOpts);
  } catch (error) {
    throw new SdkBridgeError(
      `Failed to post result for effect "${opts.effectId}"`,
      error,
    );
  }
}

// ---------------------------------------------------------------------------
// getRunStatus
// ---------------------------------------------------------------------------

/**
 * Retrieve the current status of a run by reading its metadata and journal.
 *
 * Status is derived from the journal's terminal event (if any):
 *   - `RUN_COMPLETED`  -> `"completed"`
 *   - `RUN_FAILED`     -> `"failed"`
 *   - otherwise        -> `"running"`
 *
 * Pending effects are those with an `EFFECT_REQUESTED` event but no
 * corresponding `EFFECT_RESOLVED`.
 */
export async function getRunStatus(runDir: string): Promise<{
  runId: string;
  processId: string;
  status: string;
  pendingEffects: EffectAction[];
}> {
  try {
    const metadata = await readRunMetadata(runDir);
    const journal = await loadJournal(runDir);

    // Derive run status from the last event in the journal.
    let status = 'running';
    for (const entry of journal) {
      if (entry.type === 'RUN_COMPLETED') {
        status = 'completed';
      } else if (entry.type === 'RUN_FAILED') {
        status = 'failed';
      }
    }

    // Build the set of pending effects (requested but not yet resolved).
    const resolvedEffectIds = new Set<string>();
    const requestedEffects = new Map<string, EffectAction>();

    for (const entry of journal) {
      const data = entry.data as Record<string, unknown> | undefined;
      if (!data) continue;

      if (entry.type === 'EFFECT_RESOLVED') {
        resolvedEffectIds.add(data.effectId as string);
      } else if (entry.type === 'EFFECT_REQUESTED') {
        const effectId = data.effectId as string;
        requestedEffects.set(effectId, {
          effectId,
          invocationKey: (data.invocationKey as string) ?? '',
          kind: (data.kind as string) ?? 'unknown',
          label: data.label as string | undefined,
          taskDef: (data.taskDef ?? {}) as EffectAction['taskDef'],
        });
      }
    }

    const pendingEffects: EffectAction[] = [];
    for (const [effectId, action] of requestedEffects) {
      if (!resolvedEffectIds.has(effectId)) {
        pendingEffects.push(action);
      }
    }

    return {
      runId: metadata.runId,
      processId: metadata.processId,
      status,
      pendingEffects,
    };
  } catch (error) {
    throw new SdkBridgeError(
      `Failed to read run status for "${runDir}"`,
      error,
    );
  }
}

// ---------------------------------------------------------------------------
// getPendingEffects
// ---------------------------------------------------------------------------

/**
 * Convenience shorthand — returns only the pending effects for a run.
 */
export async function getPendingEffects(runDir: string): Promise<EffectAction[]> {
  const { pendingEffects } = await getRunStatus(runDir);
  return pendingEffects;
}
