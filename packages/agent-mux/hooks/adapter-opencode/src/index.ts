export { createAdapter } from './adapter';
export {
  OPENCODE_PHASE_MAPPINGS,
  SHELL_ENV_NATIVE_HOOK,
  getOpenCodePhaseMapping,
  getSupportedPhases,
} from './mappings';
export { createConfiguredEngine } from './integration';
export {
  normalizeOpenCode,
  parseEventData,
  buildExecutionContext,
  buildPayload,
  setAdapterName,
} from './normalizer';
export { renderOpenCodeOutput } from './renderer';
export { resolveSessionId, deriveSessionId } from './session-resolver';

// Re-export payload types for consumers
export type {
  OpenCodeEventBase,
  OpenCodeSessionCreatedPayload,
  OpenCodeToolExecuteBeforePayload,
  OpenCodeToolExecuteAfterPayload,
  OpenCodeShellEnvPayload,
} from './normalizer';

export type {
  OpenCodeSessionCreatedOutput,
  OpenCodeToolExecuteBeforeOutput,
  OpenCodeToolExecuteAfterOutput,
  OpenCodeShellEnvOutput,
} from './renderer';
