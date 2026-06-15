// Adapter capabilities
export { createAdapter } from './adapter';

// Phase mappings
export { HERMES_PHASE_MAPPINGS, findMapping } from './mappings';

// Normalizer
export {
  normalizeHermesEvent,
  normalizeHermesEvent as normalizeForInvoke,
  setAdapterName,
  parseStdin,
  extractSessionId,
  extractInnerPayload,
  ADAPTER_NAME,
} from './normalizer';
export type {
  HermesEventPayload,
} from './normalizer';

// Renderer
export {
  renderHermesOutput,
  renderHermesOutput as renderForInvoke,
  isFieldSupportedForEvent,
} from './renderer';

// Session resolver
export { resolveSessionId, isValidSessionId } from './session-resolver';
