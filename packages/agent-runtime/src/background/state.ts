import { BackgroundProcessRegistry } from "../backgroundProcessRegistry";

/**
 * Minimal interface matching the fields from `AgentCoreToolOptions` (agent-core)
 * that state.ts actually consumes.  Defined locally to avoid a circular
 * dependency between agent-runtime and agent-core.
 */
interface BackgroundRegistryOwner {
  backgroundRegistry?: BackgroundProcessRegistry;
  maxBackgroundProcesses?: number;
}

const scopedRegistries = new WeakMap<BackgroundRegistryOwner, BackgroundProcessRegistry>();

export function getBackgroundRegistry(options: BackgroundRegistryOwner): BackgroundProcessRegistry {
  if (options.backgroundRegistry) {
    return options.backgroundRegistry;
  }

  let registry = scopedRegistries.get(options);
  if (!registry) {
    registry = new BackgroundProcessRegistry({ maxConcurrent: options.maxBackgroundProcesses });
    scopedRegistries.set(options, registry);
  }
  return registry;
}

export function disposeBackgroundRegistry(options: BackgroundRegistryOwner): void {
  const registry = scopedRegistries.get(options) ?? options.backgroundRegistry;
  if (!registry) {
    return;
  }
  registry.dispose();
  scopedRegistries.delete(options);
}
