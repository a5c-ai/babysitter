/**
 * SubagentInvoker implementation for the L4 Agent-Core layer.
 *
 * Pure orchestration — dispatches to the caller-injected invoke function
 * and layers mode-specific behaviour (tool-call wrapping, oversight,
 * handoff context transfer) on top.
 */

import type {
  SubagentDescriptor,
  SubagentInvocationOptions,
  SubagentInvoker,
  SubagentResult,
  OversightConfig,
} from "./types";
import { OversightRunner } from "./oversight";
import type { ReviewFn } from "./oversight";

// ---------------------------------------------------------------------------
// InvokeFn type
// ---------------------------------------------------------------------------

/**
 * The underlying execution function injected by the caller.
 * It knows how to actually run a subagent and return its raw output.
 */
export type InvokeFn<TOutput> = (
  descriptor: SubagentDescriptor,
  input: string,
  options?: SubagentInvocationOptions,
) => Promise<TOutput>;

// ---------------------------------------------------------------------------
// SubagentInvokerImpl
// ---------------------------------------------------------------------------

export class SubagentInvokerImpl<TOutput = unknown>
  implements SubagentInvoker<TOutput>
{
  private readonly invokeFn: InvokeFn<TOutput>;
  private readonly reviewFn?: ReviewFn<TOutput>;

  /**
   * @param invokeFn  - Injected function that actually runs the subagent.
   * @param reviewFn  - Optional review function used during delegation
   *                    oversight.  When omitted, delegation behaves like
   *                    a plain invocation (no review loop).
   */
  constructor(invokeFn: InvokeFn<TOutput>, reviewFn?: ReviewFn<TOutput>) {
    this.invokeFn = invokeFn;
    this.reviewFn = reviewFn;
  }

  // -----------------------------------------------------------------------
  // invoke  (as-tool-call)
  // -----------------------------------------------------------------------

  async invoke(
    descriptor: SubagentDescriptor,
    input: string,
    options?: SubagentInvocationOptions,
  ): Promise<SubagentResult<TOutput>> {
    const start = Date.now();

    try {
      const output = await this.invokeWithTimeout(descriptor, input, options);

      return this.buildResult(descriptor, "as-tool-call", output, start, true);
    } catch (err) {
      return this.buildErrorResult(
        descriptor,
        "as-tool-call",
        start,
        err,
      );
    }
  }

  // -----------------------------------------------------------------------
  // delegate  (delegation with oversight)
  // -----------------------------------------------------------------------

  async delegate(
    descriptor: SubagentDescriptor,
    input: string,
    options: SubagentInvocationOptions & {
      readonly oversight: OversightConfig;
    },
  ): Promise<SubagentResult<TOutput>> {
    const start = Date.now();

    try {
      const output = await this.invokeWithTimeout(descriptor, input, options);

      // If oversight requires approval and we have a review function,
      // run the oversight loop.
      if (options.oversight.requireApproval && this.reviewFn) {
        const runner = new OversightRunner<TOutput>(this.reviewFn);
        const oversightResult = await runner.review(
          output,
          options.oversight.maxReviewRetries ?? 0,
        );

        return this.buildResult(
          descriptor,
          "delegation",
          oversightResult.output,
          start,
          oversightResult.accepted,
          oversightResult.accepted
            ? undefined
            : `Oversight rejected: ${oversightResult.lastFeedback ?? "no feedback"}`,
        );
      }

      return this.buildResult(descriptor, "delegation", output, start, true);
    } catch (err) {
      return this.buildErrorResult(descriptor, "delegation", start, err);
    }
  }

  // -----------------------------------------------------------------------
  // handoff  (transfer control)
  // -----------------------------------------------------------------------

  async handoff(
    descriptor: SubagentDescriptor,
    input: string,
    options?: SubagentInvocationOptions,
  ): Promise<SubagentResult<TOutput>> {
    const start = Date.now();

    try {
      const output = await this.invokeWithTimeout(descriptor, input, options);

      return {
        agentId: descriptor.id,
        mode: "handoff",
        output,
        success: true,
        durationMs: Date.now() - start,
        turnsUsed: 0,
        handoffTarget: descriptor.id,
      };
    } catch (err) {
      return this.buildErrorResult(descriptor, "handoff", start, err);
    }
  }

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  private buildResult(
    descriptor: SubagentDescriptor,
    mode: SubagentResult<TOutput>["mode"],
    output: TOutput,
    startMs: number,
    success: boolean,
    error?: string,
  ): SubagentResult<TOutput> {
    return {
      agentId: descriptor.id,
      mode,
      output,
      success,
      ...(error !== undefined ? { error } : {}),
      durationMs: Date.now() - startMs,
      turnsUsed: 0,
    };
  }

  private async invokeWithTimeout(
    descriptor: SubagentDescriptor,
    input: string,
    options?: SubagentInvocationOptions,
  ): Promise<TOutput> {
    const timeoutMs = options?.oversight?.timeoutMs;
    const invocation = this.invokeFn(descriptor, input, options);

    if (timeoutMs === undefined) {
      return invocation;
    }

    return new Promise<TOutput>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(
          new Error(`Subagent ${descriptor.id} timed out after ${timeoutMs}ms`),
        );
      }, timeoutMs);

      invocation
        .then((value) => {
          clearTimeout(timer);
          resolve(value);
        })
        .catch((err) => {
          clearTimeout(timer);
          reject(err);
        });
    });
  }

  private buildErrorResult(
    descriptor: SubagentDescriptor,
    mode: SubagentResult<TOutput>["mode"],
    startMs: number,
    err: unknown,
  ): SubagentResult<TOutput> {
    process.stderr.write(`[agent-core] subagent ${descriptor.id} ${mode} failed: ${err instanceof Error ? err.stack ?? err.message : String(err)}\n`);
    return {
      agentId: descriptor.id,
      mode,
      output: undefined as TOutput,
      success: false,
      error: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - startMs,
      turnsUsed: 0,
    };
  }
}
