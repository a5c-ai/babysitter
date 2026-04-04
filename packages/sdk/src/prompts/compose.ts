/**
 * Composer functions that assemble prompt parts into complete prompt documents.
 *
 * @module prompts/compose
 */

import { PromptContext } from './types';
import * as parts from './parts';

/**
 * Full babysit skill prompt -- equivalent to the current SKILL.md content.
 * Used to generate SKILL.md files for each harness plugin.
 */
export function composeBabysitSkillPrompt(ctx: PromptContext): string {
  // Determine step count based on harness
  const stepCount = ctx.harness === 'claude-code' ? '4' : '8';

  // Determine loop step description
  const loopStepDesc = ctx.loopControlTerm === 'stop-hook'
    ? `**Stop and yield** - the ${ctx.harnessLabel} ${ctx.loopControlTerm} decides whether to continue`
    : `**Return control to the ${ctx.loopControlTerm}** - the PI ${ctx.loopControlTerm} (agent_end event)\n   decides whether to continue the loop`;

  const nonHookNote = !ctx.hookDriven && ctx.loopControlTerm === 'stop-hook'
    ? ` (when hooks are unavailable,\n   stay in-turn and continue the loop yourself instead)`
    : '';

  const header = [
    '# babysit',
    '',
    'Orchestrate `.a5c/runs/<runId>/` through iterative execution.',
    'Use the SDK CLI to drive the orchestration loop.',
  ].join('\n');

  const nonHookCaveatIntro = !ctx.hookDriven && ctx.loopControlTerm === 'stop-hook'
    ? [
        '',
        `Non-hook-driven continuation: when the orchestration environment does not support hooks,`,
        'do not yield the turn and wait for the Stop hook.',
        'Keep driving the Babysitter loop in the current turn until the run completes or',
        'you hit a real user breakpoint that requires chat input.',
      ].join('\n')
    : '';

  const coreWorkflowIntro = [
    '## Core Iteration Workflow',
    '',
    `The Babysitter workflow has ${stepCount} steps:`,
    '',
    '1. **Create or find the process** - interview the user or parse the prompt,',
    '   research the repo and process library, and build a process definition',
    `2. **Create run and bind session** - create the run via the Babysitter CLI and`,
    `   bind it to the current ${ctx.harnessLabel} session`,
    '3. **Run iteration** - execute one orchestration step',
    '4. **Get effects** - inspect pending effects',
    '5. **Perform effects** - execute the requested tasks through skills, agents, or',
    '   shell work',
    '6. **Post results** - commit results back through `task:post`',
    `7. ${loopStepDesc}${nonHookNote}`,
    '8. **Completion proof** - finish only when the emitted proof is returned',
    '',
    '### 1. Create or find the process for the run',
  ].join('\n');

  return joinNonEmpty([
    header + nonHookCaveatIntro,
    parts.renderNonNegotiables(ctx),
    parts.renderDependencies(ctx),
    coreWorkflowIntro,
    parts.renderInterview(ctx),
    parts.renderUserProfile(ctx),
    parts.renderProcessCreation(ctx),
    parts.renderIntentFidelityChecks(ctx),
    parts.renderRunOverlapDetection(ctx),
    parts.renderRunCreation(ctx),
    parts.renderIteration(ctx),
    parts.renderEffects(ctx),
    parts.renderBreakpointHandling(ctx),
    parts.renderResultsPosting(ctx),
    parts.renderLoopControl(ctx),
    parts.renderCompletionProof(ctx),
    parts.renderTaskKinds(ctx),
    parts.renderTaskExamples(ctx),
    parts.renderQuickReference(ctx),
    parts.renderRecovery(ctx),
    parts.renderProcessGuidelines(ctx),
    parts.renderCriticalRules(ctx),
    parts.renderSeeAlso(ctx),
  ]);
}

/**
 * Process creation instructions only -- for phase 1 agents.
 */
export function composeProcessCreatePrompt(ctx: PromptContext): string {
  return joinNonEmpty([
    parts.renderInterview(ctx),
    parts.renderUserProfile(ctx),
    parts.renderProcessCreation(ctx),
    parts.renderIntentFidelityChecks(ctx),
    parts.renderProcessGuidelines(ctx),
    parts.renderParallelPhaseDetection(ctx),
    parts.renderTaskKinds(ctx),
    parts.renderTaskExamples(ctx),
  ]);
}

/**
 * Orchestration loop instructions -- for phase 2 agents.
 */
export function composeOrchestrationPrompt(ctx: PromptContext): string {
  return joinNonEmpty([
    parts.renderRunOverlapDetection(ctx),
    parts.renderRunCreation(ctx),
    parts.renderIteration(ctx),
    parts.renderEffects(ctx),
    parts.renderBreakpointHandling(ctx),
    parts.renderResultsPosting(ctx),
    parts.renderLoopControl(ctx),
    parts.renderCompletionProof(ctx),
    parts.renderQuickReference(ctx),
    parts.renderRecovery(ctx),
    parts.renderCriticalRules(ctx),
  ]);
}

/**
 * Breakpoint handling instructions -- for breakpoint-specific contexts.
 */
export function composeBreakpointPrompt(ctx: PromptContext): string {
  return joinNonEmpty([
    parts.renderBreakpointHandling(ctx),
    parts.renderResultsPosting(ctx),
  ]);
}

/**
 * Join non-empty sections with separator.
 */
export function joinNonEmpty(sections: string[]): string {
  return sections.filter(s => s.length > 0).join('\n\n---\n\n');
}
