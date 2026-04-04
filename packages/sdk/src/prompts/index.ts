/**
 * Prompt template system for composable, harness-parameterized prompt generation.
 *
 * @module prompts
 */

// Types
export type { PromptContext, PromptPart } from './types';

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
} from './parts';
