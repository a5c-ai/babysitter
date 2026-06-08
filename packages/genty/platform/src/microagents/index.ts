/**
 * Platform microagent subsystem — barrel exports + factory.
 *
 * Wires the core microagent types, registry, and runner into a
 * platform-level dispatch layer with subprocess enhancements
 * and filesystem-based discovery.
 */

export { MicroagentDispatcher, type MicroagentRunnable } from "./dispatch";
export {
  SubprocessMicroagentRunner,
  type SubprocessRunnerOptions,
  type SubprocessObserver,
} from "./subprocess";
export {
  discoverMicroagents,
  registerBuiltInMicroagents,
  registerDiscoveredMicroagents,
} from "./discovery";

import { MicroagentRegistry } from "@a5c-ai/genty-core";
import { MicroagentDispatcher } from "./dispatch";
import { SubprocessMicroagentRunner } from "./subprocess";
import {
  registerBuiltInMicroagents,
  registerDiscoveredMicroagents,
} from "./discovery";

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export interface MicroagentSystemOptions {
  /** Additional directories to scan for `microagent.json` manifests. */
  discoveryDirs?: string[];

  /** Working directory for subprocess spawns. */
  cwd?: string;

  /** Max concurrent subprocess microagents. */
  maxConcurrent?: number;
}

/**
 * Bootstrap a complete microagent system:
 *
 * 1. Creates a fresh registry
 * 2. Seeds it with built-in manifests from genty-core
 * 3. Optionally discovers additional manifests from disk
 * 4. Constructs the subprocess runner and dispatcher
 */
export function createMicroagentSystem(options?: MicroagentSystemOptions) {
  const registry = new MicroagentRegistry();
  registerBuiltInMicroagents(registry);

  if (options?.discoveryDirs) {
    registerDiscoveredMicroagents(registry, options.discoveryDirs);
  }

  const runner = new SubprocessMicroagentRunner(registry, {
    cwd: options?.cwd,
    maxConcurrent: options?.maxConcurrent,
  });
  const dispatcher = new MicroagentDispatcher(runner);

  return { registry, runner, dispatcher };
}
