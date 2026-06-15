import { BackgroundProcessRegistry } from "../backgroundProcessRegistry";

/**
 * Minimal interface matching the fields from `AgentCoreToolOptions` (agent-core)
 * that state.ts actually consumes.  Defined locally to avoid a circular
 * dependency between agent-runtime and agent-core.
 */
export interface BackgroundRegistryOwner {
  backgroundRegistry?: BackgroundProcessRegistry;
  maxBackgroundProcesses?: number;
  /**
   * Stable identifier for the owner.  When provided, the registry is stored
   * in a string-keyed Map in addition to the WeakMap.  This prevents orphaning
   * when the caller recreates the options object (new object identity) but
   * logically refers to the same owner.
   */
  registryId?: string;
}

/**
 * Primary store — keyed by object identity (auto-collected when owner is GC'd).
 */
const scopedRegistries = new WeakMap<BackgroundRegistryOwner, BackgroundProcessRegistry>();

/**
 * Secondary store — keyed by `registryId` string so that a new options object
 * with the same registryId finds the existing registry instead of creating a
 * new one (which would orphan any background processes tracked by the old one).
 */
const namedRegistries = new Map<string, BackgroundProcessRegistry>();

export function getBackgroundRegistry(options: BackgroundRegistryOwner): BackgroundProcessRegistry {
  if (options.backgroundRegistry) {
    return options.backgroundRegistry;
  }

  // Try the WeakMap first (cheapest path for stable object references).
  let registry = scopedRegistries.get(options);
  if (registry) {
    return registry;
  }

  // Try the string-keyed secondary map when a registryId is provided.
  if (options.registryId) {
    registry = namedRegistries.get(options.registryId);
    if (registry) {
      // Re-attach to the WeakMap so subsequent lookups with this object are fast.
      scopedRegistries.set(options, registry);
      return registry;
    }
  }

  // No existing registry found — create a new one.
  registry = new BackgroundProcessRegistry({ maxConcurrent: options.maxBackgroundProcesses });
  scopedRegistries.set(options, registry);

  if (options.registryId) {
    namedRegistries.set(options.registryId, registry);
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

  if (options.registryId) {
    namedRegistries.delete(options.registryId);
  }
}
