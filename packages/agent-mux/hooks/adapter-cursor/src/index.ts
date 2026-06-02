// Adapter capabilities
export { createAdapter } from './adapter';

// Capability profile
export {
  getActiveProfile,
  setActiveProfile,
  resetProfile,
  isEventReliable,
  isEventKnown,
  getEventDiagnostics,
  DEFAULT_PROFILE,
  CLI_PERMISSIVE_PROFILE,
} from './capability-profile';
export type { CursorCapabilityProfile } from './capability-profile';

// Phase mappings
export { CURSOR_PHASE_MAPPINGS, findMapping, getSupportedPhases } from './mappings';

// Normalizer
export {
  normalizeCursorEvent,
  parseStdin,
  setAdapterName,
  ADAPTER_NAME,
} from './normalizer';
export type {
  CursorStdinBase,
  CursorSessionStartPayload,
  CursorStopPayload,
  CursorPreToolUsePayload,
  CursorPostToolUsePayload,
} from './normalizer';

// Renderer
export { renderCursorOutput, isFieldSupportedForEvent } from './renderer';

// Session resolver
export { resolveSessionId, deriveSessionId, isValidSessionId } from './session-resolver';
export type { SessionResolutionResult } from './session-resolver';
