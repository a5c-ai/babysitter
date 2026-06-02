/**
 * Backwards-compatibility shim -- the canonical implementation now lives in
 * `@a5c-ai/tula-runtime`.  This re-export keeps internal agent-core consumers
 * (and any external code that deep-imported this path) working without changes.
 */
export {
  BackgroundProcessRegistry,
  type BackgroundTaskRecord,
  type BackgroundCompletionEvent,
  type SpawnOptions,
} from "@a5c-ai/tula-runtime";
