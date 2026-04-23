import { BackgroundProcessRegistry } from "../../backgroundProcessRegistry";

let backgroundRegistry: BackgroundProcessRegistry | null = null;

export function getBackgroundRegistry(maxConcurrent?: number): BackgroundProcessRegistry {
  if (!backgroundRegistry) {
    backgroundRegistry = new BackgroundProcessRegistry({ maxConcurrent });
  }
  return backgroundRegistry;
}
