/**
 * Microagent Dispatcher.
 *
 * Wraps a MicroagentRegistry and MicroagentRunner from genty-core
 * to provide a high-level dispatch API suitable for platform-level
 * subprocess orchestration.
 */

import type {
  MicroagentInvocation,
  MicroagentResult,
} from "@a5c-ai/genty-core";

// ---------------------------------------------------------------------------
// Runner interface (duck-typed to accept both core Runner and Subprocess)
// ---------------------------------------------------------------------------

/** Any object that can execute a microagent invocation. */
export interface MicroagentRunnable {
  run(invocation: MicroagentInvocation): Promise<MicroagentResult>;
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

export class MicroagentDispatcher {
  constructor(
    private readonly runner: MicroagentRunnable,
  ) {}

  /**
   * Dispatch a single microagent invocation by name.
   *
   * Builds a {@link MicroagentInvocation} from the provided arguments
   * and delegates to the runner.
   */
  async dispatch(
    name: string,
    input: unknown,
    opts?: {
      timeout?: number;
      correlationId?: string;
      parentAgentId?: string;
    },
  ): Promise<MicroagentResult> {
    const invocation: MicroagentInvocation = {
      microagentName: name,
      input,
      correlationId: opts?.correlationId,
      parentAgentId: opts?.parentAgentId,
      timeout: opts?.timeout,
    };
    return this.runner.run(invocation);
  }

  /**
   * Dispatch multiple invocations with a concurrency limit.
   *
   * Results are returned in the order invocations complete
   * (not necessarily the input order). Uses a simple semaphore
   * pattern to cap concurrent subprocess spawns.
   */
  async dispatchBatch(
    invocations: readonly MicroagentInvocation[],
    concurrency = 4,
  ): Promise<MicroagentResult[]> {
    const results: MicroagentResult[] = [];
    const executing = new Set<Promise<void>>();

    for (const invocation of invocations) {
      const p = this.runner.run(invocation).then((r) => {
        results.push(r);
      });
      executing.add(p);
      p.finally(() => executing.delete(p));
      if (executing.size >= concurrency) {
        await Promise.race(executing);
      }
    }
    await Promise.all(executing);
    return results;
  }
}
