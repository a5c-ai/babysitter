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
      const output = await this.invokeFn(descriptor, input, options);

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
      const output = await this.invokeWithTimeout(
        descriptor,
        input,
        options,
        options.oversight.timeoutMs,
      );

      // If oversight requires approval and we have a review function,
      // run the oversight loop.
      if (options.oversight.requireApproval && this.reviewFn) {
        if (options.oversight.retryMode === "reinvoke") {
          return this.delegateWithReinvokeRetry(
            descriptor,
            input,
            options,
            output,
            start,
          );
        }

        const runner = new OversightRunner<TOutput>(this.reviewFn);
        const oversightResult = await runner.review(
          output,
          options.oversight.maxRetries ?? 0,
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
      const output = await this.invokeFn(descriptor, input, options);

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

  private async delegateWithReinvokeRetry(
    descriptor: SubagentDescriptor,
    input: string,
    options: SubagentInvocationOptions & {
      readonly oversight: OversightConfig;
    },
    initialOutput: TOutput,
    start: number,
  ): Promise<SubagentResult<TOutput>> {
    const maxRetries = options.oversight.maxRetries ?? 0;
    let output = initialOutput;
    let lastFeedback: string | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const verdict = await this.reviewFn!(output, {
        attempt: attempt + 1,
        feedback: lastFeedback,
      });

      if (verdict.accepted) {
        return this.buildResult(descriptor, "delegation", output, start, true);
      }

      lastFeedback = verdict.feedback;
      if (attempt >= maxRetries) {
        return this.buildResult(
          descriptor,
          "delegation",
          output,
          start,
          false,
          `Oversight rejected: ${lastFeedback ?? "no feedback"}`,
        );
      }

      output = await this.invokeWithTimeout(
        descriptor,
        input,
        this.withOversightFeedback(options, lastFeedback),
        options.oversight.timeoutMs,
      );
    }

    return this.buildResult(
      descriptor,
      "delegation",
      output,
      start,
      false,
      `Oversight rejected: ${lastFeedback ?? "no feedback"}`,
    );
  }

  private withOversightFeedback(
    options: SubagentInvocationOptions & {
      readonly oversight: OversightConfig;
    },
    feedback: string | undefined,
  ): SubagentInvocationOptions & { readonly oversight: OversightConfig } {
    return {
      ...options,
      sharedContext: [
        ...(options.sharedContext ?? []),
        {
          role: "user",
          content: `Oversight feedback: ${feedback ?? "revise and retry"}`,
        },
      ],
    };
  }

  private async invokeWithTimeout(
    descriptor: SubagentDescriptor,
    input: string,
    options: SubagentInvocationOptions | undefined,
    timeoutMs: number | undefined,
  ): Promise<TOutput> {
    const invocation = this.invokeFn(descriptor, input, options);
    if (timeoutMs === undefined) {
      return invocation;
    }

    return new Promise<TOutput>((resolve, reject) => {
      let settled = false;
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        reject(
          new Error(
            `Subagent ${descriptor.id} timed out after ${timeoutMs}ms`,
          ),
        );
      }, timeoutMs);

      invocation
        .then((value) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          resolve(value);
        })
        .catch((err) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          reject(err);
        });
    });
  }
}
