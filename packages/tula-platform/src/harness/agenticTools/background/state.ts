/**
 * Backwards-compatibility shim -- the canonical implementation lives in
 * `@a5c-ai/tula-runtime`. This keeps platform deep imports working.
 */
export {
  getBackgroundRegistry,
  disposeBackgroundRegistry,
} from "@a5c-ai/tula-runtime";
