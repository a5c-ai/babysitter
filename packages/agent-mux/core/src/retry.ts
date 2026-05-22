/**
 * Retry policy defaults for @a5c-ai/agent-mux.
 */

import type { ErrorCode, RetryPolicy } from './types.js';

/** The fully-resolved retry policy with all defaults applied. */
export type ResolvedRetryPolicy = Required<RetryPolicy>;

/**
 * The default retry policy used when no custom policy is specified.
 * Frozen to prevent accidental mutation.
 *
 * @see 01-core-types-and-client.md §5.1.1
 */
export const DEFAULT_RETRY_POLICY: Readonly<ResolvedRetryPolicy> = Object.freeze({
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30_000,
  jitterFactor: 0.1,
  retryOn: Object.freeze(['RATE_LIMITED', 'AGENT_CRASH', 'TIMEOUT']) as ErrorCode[],
});
