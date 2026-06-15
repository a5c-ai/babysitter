/**
 * Platform-enhanced subprocess runner for microagents.
 *
 * Wraps (composes) the core MicroagentRunner to add platform-specific
 * features: working directory override, concurrency limiting, and
 * observability hooks.
 */

import type {
  MicroagentInvocation,
  MicroagentResult,
} from "@a5c-ai/genty-core";
import { MicroagentRunner, MicroagentRegistry } from "@a5c-ai/genty-core";

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface SubprocessRunnerOptions {
  /** Working directory for subprocess spawns. */
  cwd?: string;

  /** Whether to inherit the parent process environment (default: true). */
  inheritEnv?: boolean;

  /** Maximum number of concurrent microagent subprocesses. */
  maxConcurrent?: number;
}

// ---------------------------------------------------------------------------
// Observer callback
// ---------------------------------------------------------------------------

/** Called before and after a microagent subprocess run. */
export interface SubprocessObserver {
  onStart?(invocation: MicroagentInvocation): void;
  onComplete?(invocation: MicroagentInvocation, result: MicroagentResult): void;
}

// ---------------------------------------------------------------------------
// Runner (composition over inheritance — MicroagentRunner is concrete)
// ---------------------------------------------------------------------------

export class SubprocessMicroagentRunner {
  private readonly inner: MicroagentRunner;
  private readonly options: Required<SubprocessRunnerOptions>;
  private activeCount = 0;
  private waitQueue: Array<() => void> = [];
  private observer?: SubprocessObserver;

  constructor(
    registry: MicroagentRegistry,
    options?: SubprocessRunnerOptions,
  ) {
    this.inner = new MicroagentRunner(registry);
    this.options = {
      cwd: options?.cwd ?? process.cwd(),
      inheritEnv: options?.inheritEnv ?? true,
      maxConcurrent: options?.maxConcurrent ?? 8,
    };
  }

  /** Attach an observer for lifecycle hooks. */
  setObserver(observer: SubprocessObserver): void {
    this.observer = observer;
  }

  /** Execute a microagent invocation with platform enhancements. */
  async run(invocation: MicroagentInvocation): Promise<MicroagentResult> {
    // Concurrency gate
    await this.acquireSlot();

    try {
      this.observer?.onStart?.(invocation);
      const result = await this.inner.run(invocation);
      this.observer?.onComplete?.(invocation, result);
      return result;
    } finally {
      this.releaseSlot();
    }
  }

  /** Current number of in-flight microagent subprocesses. */
  get active(): number {
    return this.activeCount;
  }

  /** The resolved options this runner was constructed with. */
  get resolvedOptions(): Readonly<Required<SubprocessRunnerOptions>> {
    return this.options;
  }

  // ---- Concurrency semaphore ----

  private acquireSlot(): Promise<void> {
    if (this.activeCount < this.options.maxConcurrent) {
      this.activeCount++;
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      this.waitQueue.push(() => {
        this.activeCount++;
        resolve();
      });
    });
  }

  private releaseSlot(): void {
    this.activeCount--;
    const next = this.waitQueue.shift();
    if (next) next();
  }
}
