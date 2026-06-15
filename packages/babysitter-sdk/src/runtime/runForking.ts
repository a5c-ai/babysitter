/**
 * GAP-RUN-003: Run Forking and Branching.
 *
 * Provides primitives for forking a run at a specific effect point,
 * creating a new branch of execution from an existing run.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ForkOptions {
  /** Source run to fork from. */
  sourceRunId: string;
  /** Effect ID at which to fork, or 'latest' for the current head. */
  forkPoint: string | 'latest';
  /** Optional label for the forked branch. */
  label?: string;
}

export interface ForkResult {
  /** ID of the newly forked run. */
  forkedRunId: string;
  /** The resolved fork point (effect ID). */
  forkPoint: string;
  /** Branch label for the fork. */
  branchLabel: string;
  /** ID of the parent run. */
  parentRunId: string;
}

export interface RunForkMetadata {
  /** Run ID. */
  runId: string;
  /** ISO timestamp when the run was created. */
  createdAt: string;
  /** All effect IDs in order. */
  effectIds: string[];
  /** Current status. */
  status: string;
}

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * Validate fork options against the source run and produce fork metadata.
 * Throws if the fork point does not exist in the source run.
 */
export function prepareFork(
  sourceRun: RunForkMetadata,
  options: ForkOptions,
): ForkResult {
  if (options.sourceRunId !== sourceRun.runId) {
    throw new Error(
      `Source run ID mismatch: options specify "${options.sourceRunId}" but source run is "${sourceRun.runId}"`,
    );
  }

  let resolvedForkPoint: string;

  if (options.forkPoint === 'latest') {
    if (sourceRun.effectIds.length === 0) {
      throw new Error(`Cannot fork run "${sourceRun.runId}": no effects recorded yet`);
    }
    resolvedForkPoint = sourceRun.effectIds[sourceRun.effectIds.length - 1];
  } else {
    if (!sourceRun.effectIds.includes(options.forkPoint)) {
      throw new Error(
        `Fork point "${options.forkPoint}" not found in run "${sourceRun.runId}"`,
      );
    }
    resolvedForkPoint = options.forkPoint;
  }

  const branchLabel = options.label ?? `fork-${sourceRun.runId.slice(0, 8)}-${Date.now()}`;
  const forkedRunId = `${sourceRun.runId}-fork-${Date.now()}`;

  return {
    forkedRunId,
    forkPoint: resolvedForkPoint,
    branchLabel,
    parentRunId: sourceRun.runId,
  };
}

/**
 * Produce a human-readable description of a fork result.
 */
export function describeFork(result: ForkResult): string {
  return (
    `Forked run "${result.parentRunId}" at effect "${result.forkPoint}" → ` +
    `new run "${result.forkedRunId}" (branch: "${result.branchLabel}")`
  );
}
