/**
 * Backwards-compatibility shim -- the canonical implementation now lives in
 * `@a5c-ai/agent-runtime`.  This re-export keeps internal agent-core consumers
 * working without changes.
 */
export {
  getBackgroundRegistry,
  disposeBackgroundRegistry,
} from "@a5c-ai/agent-runtime";
