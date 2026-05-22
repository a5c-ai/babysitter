/**
 * Prompt template system for composable, harness-parameterized prompt generation.
 *
 * @module prompts
 */

// Types
export type {
  PromptContext,
  PromptPart,
  PromptStratum,
  StratumTaggedPart,
  ComposeByStrataOptions,
  StratumChecksums,
  ComposeByStrataWithMetaResult,
  ContinuityContext,
  ContinuityEffectSummary,
} from './types';

// Context factories
export {
  createPromptContextFromCatalog,
  createInternalContext,
} from './context';

// Execution-context autodetection for prompt gating
export {
  detectExecutionContext,
  deriveCapabilityFlags,
} from './contextDetect';
export type {
  ExecutionContext,
  ContextCapabilityFlags,
  CiKind,
  TriggerKind,
  DetectOptions,
} from './contextDetect';

// Capability → library process mapping (consumer side of the capability loop)
export {
  CAPABILITY_PROCESS_MAP,
  processPathsForCapabilities,
  renderCapabilityProcessGuide,
} from './capabilityProcessMap';
export type { CapabilityProcessMap } from './capabilityProcessMap';

// Template renderer
export {
  renderTemplate,
  renderTemplateString,
  resolveTemplatePath,
} from './templateRenderer';

export {
  renderCommandTemplate,
  resolveCommandTemplatePath,
} from './commandTemplates';

// Composers
export {
  composeBabysitSkillPrompt,
  composeProcessCreatePrompt,
  composeOrchestrationPrompt,
  composeBreakpointPrompt,
  joinNonEmpty,
} from './compose';

// Strata model (GAP-PROMPT-001, GAP-PERF-005)
export {
  tagPart,
  PART_STRATA_MAP,
  STRATUM_ORDER,
  getPartsForStratum,
  composeByStrata,
  composeByStrataWithMeta,
  detectStratumChanges,
} from './strata';

// GAP-PROMPT-002: Capability collection
export {
  collectCapabilities,
  mergeCapabilities,
} from './capabilityCollector';
export type {
  CollectedCapabilities,
  CapabilityCollectionOptions,
} from './capabilityCollector';

// GAP-PROMPT-002: Runtime context
export {
  createRuntimePromptContext,
} from './runtimeContext';
export type {
  RuntimeContextOptions,
} from './runtimeContext';

// GAP-PROMPT-005: Continuity overlay
export {
  buildContinuityContext,
  renderContinuityOverlay,
} from './continuityOverlay';
export type {
  BuildContinuityContextOptions,
} from './continuityOverlay';

// Parts (individual render functions)
export {
  renderDependencies,
  renderInterview,
  renderUserProfile,
  renderProcessCreation,
  renderIntentFidelityChecks,
  renderRunCreation,
  renderIteration,
  renderEffects,
  renderBreakpointHandling,
  renderResultsPosting,
  renderLoopControl,
  renderCompletionProof,
  renderTaskKinds,
  renderTaskExamples,
  renderQuickReference,
  renderRecovery,
  renderProcessGuidelines,
  renderCriticalRules,
  renderSeeAlso,
  renderNonNegotiables,
  renderProjectInstructions,
  renderRunOverlapDetection,
  renderParallelPhaseDetection,
  renderCodingPhilosophy,
  renderToolPreferences,
  renderOutputEfficiency,
  renderGitSafety,
  renderPriorityLadder,
  renderRootCauseGuardrail,
} from './parts';
