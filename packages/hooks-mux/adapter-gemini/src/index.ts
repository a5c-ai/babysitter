export { createAdapter } from './adapter';
export { GEMINI_PHASE_MAPPINGS, getGeminiPhaseMapping, getSupportedPhases } from './mappings';
export { normalizeGemini, parseStdin, buildExecutionContext, buildPayload, setAdapterName } from './normalizer';
export { renderGeminiOutput, emitOutput, logToStderr } from './renderer';
export { resolveSessionId, deriveSessionId } from './session-resolver';

// Re-export payload types for consumers
export type {
  GeminiStdinBase,
  GeminiSessionStartPayload,
  GeminiBeforeToolSelectionPayload,
  GeminiBeforeModelPayload,
  GeminiAfterModelPayload,
  GeminiBeforeAgentPayload,
  GeminiAfterAgentPayload,
  GeminiBeforeToolPayload,
  GeminiAfterToolPayload,
} from './normalizer';

export type {
  GeminiBeforeToolSelectionOutput,
  GeminiBeforeModelOutput,
  GeminiAfterModelOutput,
  GeminiBeforeAgentOutput,
  GeminiAfterAgentOutput,
  GeminiBeforeToolOutput,
  GeminiAfterToolOutput,
  GeminiSessionStartOutput,
} from './renderer';
