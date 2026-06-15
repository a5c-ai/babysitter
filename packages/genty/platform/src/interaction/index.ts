export * from "./askUserQuestion";
export { resolveInteractionUxHints } from './interactionRouter';
export type { InteractionUxHints } from './interactionRouter';
export { SteeringQueue } from './steering';
export type { SteeringMessage, SteeringMessageType } from './steering';
export {
  createModelSwitchState,
  switchModel,
  cycleFavorite,
  addFavorite,
  removeFavorite,
} from './model-switch';
export type { ModelSwitchState } from './model-switch';

// Command discovery (UX-011)
export {
  CommandRegistry,
  type CommandDefinition,
  type CommandSuggestion,
} from './commandDiscovery';

// Permission approval UI (GAP-UX-001c)
export {
  formatApprovalPrompt,
  parseApprovalResponse,
  getDefaultApprovalForRisk,
  type ApprovalPrompt,
  type RiskLevel,
  type ApprovalAction,
} from './permissionApprovalUi';

// Typed effect interaction patterns (GAP-UX-010)
export {
  BUILT_IN_PATTERNS,
  getPatternForEffect,
  validateEffectInput,
  formatEffectSummary,
  type EffectInteractionPattern,
  type EffectLike,
  type SchemaField,
  type RenderHints,
  type ValidationResult,
  type ValidationError,
} from './typedEffectPatterns';
