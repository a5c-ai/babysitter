/**
 * ExecutionProviderImpl — dispatches spawn/attach/list/destroy calls to
 * mode-specific executors registered at construction time.
 *
 * Usage:
 *
 * ```ts
 * const provider = new ExecutionProviderImpl(
 *   new Map([
 *     ["local",      localExecutor],
 *     ["docker",     dockerExecutor],
 *     ["ssh",        sshExecutor],
 *     ["kubernetes", k8sExecutor],
 *   ]),
 * );
 * ```
 */

import type {
  ExecutionConfig,
  ExecutionHandle,
  ExecutionMode,
  ExecutionProvider,
} from "./types";
import type { Executor } from "./modes/local";

// ---------------------------------------------------------------------------
// ExecutionProviderImpl
// ---------------------------------------------------------------------------

export class ExecutionProviderImpl implements ExecutionProvider {
  /** Registered mode executors. */
  private readonly executors: Map<ExecutionMode, Executor<never>>;
  /** Global index: handleId -> mode, so attach/destroy can route correctly. */
  private readonly handleIndex = new Map<string, ExecutionMode>();

  constructor(executors: Map<ExecutionMode, Executor<unknown>>) {
    // Cast once at the boundary — internally we dispatch with the correct
    // config type per mode so this is type-safe in practice.
    this.executors = executors as Map<ExecutionMode, Executor<never>>;
  }

  // ---------- ExecutionProvider interface ------------------------------------

  async spawn(config: ExecutionConfig): Promise<ExecutionHandle> {
    const executor = this._executorFor(config.mode);

    // Each executor.spawn() takes (command, args, config). The provider
    // layer doesn't know the command/args — those are part of the config
    // at a higher level. For the provider's spawn() we pass a default
    // shell invocation and forward the mode-specific config.
    const handle = await executor.spawn("sh", ["-c", "true"], config as never);

    this.handleIndex.set(handle.id, config.mode);
    return handle;
  }

  async attach(id: string): Promise<ExecutionHandle | undefined> {
    const mode = this.handleIndex.get(id);
    if (!mode) {
      // Try all executors — the handle may predate this provider instance.
      for (const executor of this.executors.values()) {
        const handle = await executor.attach(id);
        if (handle) return handle;
      }
      return undefined;
    }

    const executor = this.executors.get(mode);
    return executor?.attach(id);
  }

  async list(): Promise<ExecutionHandle[]> {
    const all: ExecutionHandle[] = [];
    for (const executor of this.executors.values()) {
      const handles = executor.list();
      all.push(...handles);
    }
    return all;
  }

  async destroy(id: string): Promise<void> {
    const mode = this.handleIndex.get(id);
    if (!mode) {
      // Attempt all executors — best effort.
      for (const executor of this.executors.values()) {
        await executor.destroy(id);
      }
      this.handleIndex.delete(id);
      return;
    }

    const executor = this.executors.get(mode);
    await executor?.destroy(id);
    this.handleIndex.delete(id);
  }

  // ---------- Helpers -------------------------------------------------------

  private _executorFor(mode: ExecutionMode): Executor<never> {
    const executor = this.executors.get(mode);
    if (!executor) {
      throw new Error(`No executor registered for execution mode "${mode}"`);
    }
    return executor;
  }
}
