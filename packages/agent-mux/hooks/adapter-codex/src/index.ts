// Adapter capabilities
export { createAdapter } from './adapter';

// Phase mappings
export { CODEX_PHASE_MAPPINGS, findMapping } from './mappings';

// Normalizer
export {
  normalizeCodexEvent,
  normalizeCodexEvent as normalizeForInvoke,
  setAdapterName,
  parseStdin,
  extractSessionId,
  ADAPTER_NAME,
} from './normalizer';
export type {
  CodexSessionStartPayload,
  CodexUserPromptPayload,
  CodexStopPayload,
  CodexToolPayload,
} from './normalizer';

// Renderer
export {
  renderCodexOutput,
  renderCodexOutput as renderForInvoke,
  isFieldSupportedForEvent,
} from './renderer';

// Session resolver
export { resolveSessionId, isValidSessionId } from './session-resolver';
