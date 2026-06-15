export { createAdapter } from './adapter';
export { ANTIGRAVITY_PHASE_MAPPINGS, getAntigravityPhaseMapping, getSupportedPhases } from './mappings';
export { normalizeAntigravity, parseStdin, buildExecutionContext, buildPayload, setAdapterName } from './normalizer';
export { normalizeAntigravity as normalizeForInvoke } from './normalizer';
export { renderAntigravityOutput } from './renderer';
export { renderAntigravityOutput as renderForInvoke } from './renderer';
export { resolveSessionId, deriveSessionId } from './session-resolver';

// Re-export payload types for consumers
export type {
  AntigravityStdinBase,
  AntigravitySessionStartPayload,
  AntigravityBeforeToolSelectionPayload,
  AntigravityBeforeModelPayload,
  AntigravityAfterModelPayload,
  AntigravityBeforeAgentPayload,
  AntigravityAfterAgentPayload,
  AntigravityBeforeToolPayload,
  AntigravityAfterToolPayload,
} from './normalizer';

export type {
  AntigravityBeforeToolSelectionOutput,
  AntigravityBeforeModelOutput,
  AntigravityAfterModelOutput,
  AntigravityBeforeAgentOutput,
  AntigravityAfterAgentOutput,
  AntigravityBeforeToolOutput,
  AntigravityAfterToolOutput,
  AntigravitySessionStartOutput,
} from './renderer';
