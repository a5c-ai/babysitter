/**
 * GAP-PAR-010: Fork-Join Process Pattern.
 *
 * Defines the fork-join primitive for spawning multiple process branches
 * and merging their results according to a join strategy.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ForkBranch {
  /** Unique identifier for this branch within the fork. */
  id: string;
  /** Process to execute in this branch. */
  processId: string;
  /** Optional inputs passed to the branch process. */
  inputs?: Record<string, unknown>;
}

export type JoinStrategy = 'all' | 'race' | 'allSettled';

export interface ForkSpec {
  /** The branches to execute in parallel. */
  branches: ForkBranch[];
  /** How to join the branch results. */
  joinStrategy: JoinStrategy;
}

export interface BranchResult {
  /** Status of this branch. */
  status: 'fulfilled' | 'rejected';
  /** Result value if fulfilled. */
  value?: unknown;
  /** Error message if rejected. */
  reason?: string;
}

export interface ForkJoinResult {
  /** Results keyed by branch ID. */
  branchResults: Map<string, BranchResult>;
  /** ISO timestamp when the join completed. */
  joinedAt: string;
  /** Strategy that was used. */
  strategy: JoinStrategy;
}

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * Create and validate a ForkSpec from branches and a join strategy.
 * Throws if branches are empty or contain duplicate IDs.
 */
export function createForkSpec(
  branches: ForkBranch[],
  strategy: JoinStrategy,
): ForkSpec {
  if (branches.length === 0) {
    throw new Error('Fork spec must have at least one branch');
  }

  const ids = new Set<string>();
  for (const branch of branches) {
    if (!branch.id) {
      throw new Error('Each branch must have a non-empty id');
    }
    if (ids.has(branch.id)) {
      throw new Error(`Duplicate branch id: "${branch.id}"`);
    }
    ids.add(branch.id);
  }

  return { branches, joinStrategy: strategy };
}

/**
 * Merge branch results according to the specified strategy.
 *
 * - 'all': All branches must be fulfilled; throws if any rejected.
 * - 'race': Returns the first fulfilled result only.
 * - 'allSettled': Returns all results regardless of status.
 */
export function mergeBranchResults(
  results: Map<string, BranchResult>,
  strategy: JoinStrategy,
): ForkJoinResult {
  const now = new Date().toISOString();

  if (strategy === 'all') {
    for (const [id, result] of results) {
      if (result.status === 'rejected') {
        throw new Error(
          `Branch "${id}" rejected in 'all' strategy: ${result.reason ?? 'unknown error'}`,
        );
      }
    }
  }

  if (strategy === 'race') {
    const raceResults = new Map<string, BranchResult>();
    for (const [id, result] of results) {
      if (result.status === 'fulfilled') {
        raceResults.set(id, result);
        return { branchResults: raceResults, joinedAt: now, strategy };
      }
    }
    // None fulfilled — return all (all are rejected)
    return { branchResults: new Map(results), joinedAt: now, strategy };
  }

  // 'allSettled' or 'all' (after validation)
  return { branchResults: new Map(results), joinedAt: now, strategy };
}
