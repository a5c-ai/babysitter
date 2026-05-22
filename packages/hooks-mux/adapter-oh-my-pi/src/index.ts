// Adapter capabilities
export { createAdapter } from './adapter';

// Phase mappings
export { OH_MY_PI_PHASE_MAPPINGS, findMapping, getSupportedPhases } from './mappings';

// Programmatic integration
export { createConfiguredEngine } from './integration';

// Normalizer
export {
  normalizeOhMyPiEvent,
  parseEventContext,
  setAdapterName,
  ADAPTER_NAME,
} from './normalizer';
export type {
  OhMyPiEventContext,
  OhMyPiSessionStartPayload,
  OhMyPiSessionEndPayload,
  OhMyPiPromptPayload,
  OhMyPiToolCallPayload,
  OhMyPiToolResultPayload,
  OhMyPiErrorPayload,
} from './normalizer';

// Renderer
export { renderOhMyPiOutput, isFieldSupportedForEvent } from './renderer';

// Session resolver
export { resolveSessionId, deriveSessionId, isValidSessionId } from './session-resolver';
export type { SessionResolutionResult } from './session-resolver';
