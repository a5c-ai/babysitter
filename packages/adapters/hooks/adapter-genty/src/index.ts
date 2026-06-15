// Adapter capabilities
export { createAdapter } from './adapter';

// Phase mappings
export { GENTY_PHASE_MAPPINGS, findMapping, getSupportedPhases } from './mappings';

// Normalizer
export {
  normalizeGentyEvent,
  normalizeGentyEvent as normalizeForInvoke,
  setAdapterName,
  parseStdin,
  extractSessionId,
  ADAPTER_NAME,
} from './normalizer';
export type {
  GentyEventPayload,
} from './normalizer';

// Renderer
export {
  renderGentyOutput,
  renderGentyOutput as renderForInvoke,
  isFieldSupportedForEvent,
} from './renderer';

// Session resolver
export { resolveSessionId, isValidSessionId } from './session-resolver';
