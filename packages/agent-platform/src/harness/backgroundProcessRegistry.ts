/**
 * Backwards-compatibility shim -- the canonical implementation lives in
 * `@a5c-ai/tula-runtime`. This keeps platform deep imports working.
 */
export {
  BackgroundProcessRegistry,
  type BackgroundTaskRecord,
  type BackgroundCompletionEvent,
  type SpawnOptions,
} from "@a5c-ai/tula-runtime";
