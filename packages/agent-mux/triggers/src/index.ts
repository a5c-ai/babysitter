export { normalizeEvent } from './backends/index.js';
export { enrichEvent } from './enrich.js';
export { evaluateTrigger, matchesGlob, parseQuery } from './query.js';
export { evaluateActionTrigger, runCommand } from './action.js';
export type { ActionOptions, CommandResult } from './action.js';
export type { EnrichmentOptions, NormalizedTriggerEvent, TriggerBackend, TriggerChange, TriggerEvaluation, TriggerQuery } from './types.js';
