/**
 * Prompt template system for composable, harness-parameterized prompt generation.
 *
 * @module prompts
 */

// Types
export type { PromptContext, PromptPart, PromptStratum, StratumTaggedPart, ComposeByStrataOptions } from './types';

// Context factories
export {
  createClaudeCodeContext,
  createCodexContext,
  createGeminiCliContext,
  createPiContext,
} from './context';

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

// Strata model (GAP-PROMPT-001)
export {
  tagPart,
  PART_STRATA_MAP,
  STRATUM_ORDER,
  getPartsForStratum,
  composeByStrata,
} from './strata';

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
} from './parts';
