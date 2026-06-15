/**
 * Oversight runner for the L4 Agent-Core subagent layer.
 *
 * Implements a review loop where a parent-provided review function
 * inspects a subagent's output and either accepts it or requests
 * a retry.  The runner is pure orchestration — it knows nothing
 * about LLMs or the shape of the output.
 */

// ---------------------------------------------------------------------------
// ReviewFn type
// ---------------------------------------------------------------------------

/**
 * A review function injected by the caller.  Returns whether the
 * result is accepted and optional feedback for the next attempt.
 */
export type ReviewFn<TOutput> = (
  result: TOutput,
) => Promise<{ accepted: boolean; feedback?: string }>;

// ---------------------------------------------------------------------------
// OversightResult
// ---------------------------------------------------------------------------

/** The outcome of an oversight review cycle. */
export interface OversightResult<TOutput> {
  /** The final output (either the accepted result or the last attempt). */
  readonly output: TOutput;

  /** Whether the result was accepted by the reviewer. */
  readonly accepted: boolean;

  /** Number of review rounds that were executed. */
  readonly attempts: number;

  /** Feedback from the last rejection, if the result was not accepted. */
  readonly lastFeedback?: string;
}

// ---------------------------------------------------------------------------
// OversightRunner
// ---------------------------------------------------------------------------

export class OversightRunner<TOutput = unknown> {
  private readonly reviewFn: ReviewFn<TOutput>;

  constructor(reviewFn: ReviewFn<TOutput>) {
    this.reviewFn = reviewFn;
  }

  /**
   * Review `result` up to `maxRetries` times.  On each rejection the
   * caller-supplied review function is invoked again with the same result
   * (the runner itself doesn't mutate the output — the caller is expected
   * to re-invoke the subagent externally if needed and call `review`
   * again, or use a single pass with `maxRetries` = 0).
   *
   * Returns the accepted result, or the last attempt after exhausting
   * retries.
   */
  async review(
    result: TOutput,
    maxRetries: number = 0,
  ): Promise<OversightResult<TOutput>> {
    let current = result;
    let attempts = 0;
    let lastFeedback: string | undefined;

    for (let i = 0; i <= maxRetries; i++) {
      attempts++;
      const verdict = await this.reviewFn(current);

      if (verdict.accepted) {
        return {
          output: current,
          accepted: true,
          attempts,
        };
      }

      lastFeedback = verdict.feedback;

      // On the last iteration we don't retry — just return the rejection.
      if (i < maxRetries) {
        // The current output stays the same.  In a full implementation
        // the caller would re-invoke the subagent with feedback and pass
        // the new result.  For this pure-orchestration layer we simply
        // re-review the same output, allowing the review function to be
        // stateful if desired.
        current = result;
      }
    }

    return {
      output: current,
      accepted: false,
      attempts,
      lastFeedback,
    };
  }
}
