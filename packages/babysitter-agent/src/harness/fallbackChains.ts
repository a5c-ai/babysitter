/**
 * GAP-HADAPT-004: Harness Fallback Chains.
 *
 * Defines ordered fallback sequences for harness resolution.
 * When a primary harness fails or is unavailable, the chain
 * determines the next harness to try.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FallbackChain {
  /** Ordered list of harness names (primary first). */
  harnesses: string[];
  /** Maximum number of retries (fallback attempts). */
  maxRetries: number;
}

export interface FallbackChainOptions {
  /** Maximum retries. Clamped to chain.length - 1. */
  maxRetries?: number;
}

export interface FallbackResolution {
  /** The harness to use, or null if all exhausted. */
  harness: string | null;
  /** 1-based attempt number. */
  attempt: number;
  /** Whether this is a fallback (not the primary). */
  isFallback: boolean;
  /** Whether all harnesses in the chain have been exhausted. */
  exhausted: boolean;
}

// ---------------------------------------------------------------------------
// Core
// ---------------------------------------------------------------------------

/**
 * Create a fallback chain from an ordered list of harness names.
 *
 * Duplicates are removed (first occurrence wins).
 * maxRetries defaults to chain.length - 1 (try every harness once).
 */
export function createFallbackChain(
  harnesses: string[],
  options?: FallbackChainOptions,
): FallbackChain {
  // Deduplicate preserving order
  const unique = [...new Set(harnesses)];
  const maxPossible = Math.max(0, unique.length - 1);
  const maxRetries = options?.maxRetries !== undefined
    ? Math.min(options.maxRetries, maxPossible)
    : maxPossible;

  return {
    harnesses: unique,
    maxRetries,
  };
}

/**
 * Resolve which harness to use given a chain and previously failed harnesses.
 *
 * Returns the first harness in the chain that hasn't failed yet,
 * respecting the maxRetries limit.
 */
export function resolveFallbackHarness(
  chain: FallbackChain,
  failedHarnesses: string[],
): FallbackResolution {
  const failedSet = new Set(failedHarnesses);
  const attempt = failedHarnesses.length + 1;

  // Check retry limit: attempts beyond maxRetries + 1 are exhausted
  if (failedHarnesses.length > chain.maxRetries) {
    return {
      harness: null,
      attempt,
      isFallback: attempt > 1,
      exhausted: true,
    };
  }

  // Find the first non-failed harness in chain order
  for (const harness of chain.harnesses) {
    if (!failedSet.has(harness)) {
      return {
        harness,
        attempt,
        isFallback: harness !== chain.harnesses[0],
        exhausted: false,
      };
    }
  }

  // All harnesses in the chain have failed
  return {
    harness: null,
    attempt,
    isFallback: true,
    exhausted: true,
  };
}
