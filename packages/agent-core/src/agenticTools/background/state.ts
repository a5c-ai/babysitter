import { BackgroundProcessRegistry } from "../../backgroundProcessRegistry";
import type { AgenticToolOptions } from "../types";

const scopedRegistries = new WeakMap<AgenticToolOptions, BackgroundProcessRegistry>();

export function getBackgroundRegistry(options: AgenticToolOptions): BackgroundProcessRegistry {
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

export function disposeBackgroundRegistry(options: AgenticToolOptions): void {
  const registry = scopedRegistries.get(options);
  if (!registry) {
    return;
  }
  registry.dispose();
  scopedRegistries.delete(options);
}
