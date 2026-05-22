/**
 * Strategy patterns applied to resolved parallel effect results:
 * all-or-nothing, best-effort, first-success, quorum.
 */

export type ParallelStrategyName =
  | "all-or-nothing"
  | "best-effort"
  | "first-success"
  | "quorum";

export interface ParallelStrategyOptions {
  quorumThreshold?: number;
}

export interface ParallelStrategyResult<T> {
  results: T[];
  errors: Array<{ index: number; error: unknown }>;
  strategy: ParallelStrategyName;
  totalCount: number;
  successCount: number;
}

function allOrNothing<T>(
  results: T[],
  errors: Array<{ index: number; error: unknown }>,
): ParallelStrategyResult<T> {
  if (errors.length > 0) {
    const first = errors[0].error;
    throw first instanceof Error ? first : new Error(String(first));
  }
  return {
    results,
    errors: [],
    strategy: "all-or-nothing",
    totalCount: results.length,
    successCount: results.length,
  };
}

function bestEffort<T>(
  results: T[],
  errors: Array<{ index: number; error: unknown }>,
): ParallelStrategyResult<T> {
  const errorIndices = new Set(errors.map((entry) => entry.index));
  const successCount = results.filter((_, index) => !errorIndices.has(index)).length;

  return {
    results,
    errors,
    strategy: "best-effort",
    totalCount: results.length,
    successCount,
  };
}

function firstSuccess<T>(
  results: T[],
  errors: Array<{ index: number; error: unknown }>,
): ParallelStrategyResult<T> {
  const errorIndices = new Set(errors.map((entry) => entry.index));

  for (let index = 0; index < results.length; index += 1) {
    if (!errorIndices.has(index) && results[index] !== undefined) {
      return {
        results: [results[index]],
        errors,
        strategy: "first-success",
        totalCount: results.length,
        successCount: 1,
      };
    }
  }

  const allErrors = errors.map((entry) =>
    entry.error instanceof Error ? entry.error : new Error(String(entry.error)),
  );
  throw allErrors.length > 0 ? allErrors[0] : new Error("All parallel effects failed");
}

function quorum<T>(
  results: T[],
  errors: Array<{ index: number; error: unknown }>,
  options?: ParallelStrategyOptions,
): ParallelStrategyResult<T> {
  const threshold = options?.quorumThreshold ?? 0.5;
  const errorIndices = new Set(errors.map((entry) => entry.index));
  const successCount = results.filter((_, index) => !errorIndices.has(index)).length;
  const required = results.length === 0 ? 1 : Math.ceil(results.length * threshold);

  if (successCount < required) {
    throw new Error(
      `Quorum not met: ${successCount}/${results.length} succeeded, need ${required} (threshold: ${threshold})`,
    );
  }

  return {
    results,
    errors,
    strategy: "quorum",
    totalCount: results.length,
    successCount,
  };
}

export function applyStrategy<T>(
  strategy: ParallelStrategyName,
  results: T[],
  errors: Array<{ index: number; error: unknown }>,
  options?: ParallelStrategyOptions,
): ParallelStrategyResult<T> {
  switch (strategy) {
    case "all-or-nothing":
      return allOrNothing(results, errors);
    case "best-effort":
      return bestEffort(results, errors);
    case "first-success":
      return firstSuccess(results, errors);
    case "quorum":
      return quorum(results, errors, options);
    default: {
      const exhaustive: never = strategy;
      throw new TypeError(`Unknown parallel strategy: ${String(exhaustive)}`);
    }
  }
}
