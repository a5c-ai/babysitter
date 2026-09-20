/**
 * Composer functions that assemble prompt parts into complete prompt documents.
 *
 * @module prompts/compose
 */

import { PromptContext } from './types';
import * as parts from './parts';
import { listPluginTargetDescriptors } from '@a5c-ai/atlas/catalog';

/**
 * Resolve the orchestration step count from catalog metadata.
 * Harnesses that consolidate steps (e.g. claude-code) report a lower count.
 */
function resolveStepCount(ctx: PromptContext): string {
  const target = listPluginTargetDescriptors().find(t => t.targetId === ctx.harness);
  if (target?.defaultStepCount) return String(target.defaultStepCount);
  return '8';
}

function renderOmpDeterministicDriverWorkflow(): string {
  return [
    '## OMP Deterministic Driver Workflow',
    '',
    'After creating or resuming a run, call `babysitter_drive` with its absolute run directory.',
    '',
    '- Before creating a duplicate run, inspect recent candidate runs. Resume a matching run by',
    '  calling `babysitter_drive` with its absolute run directory; never resume it with `run:iterate`.',
    '- For `completed`, `waiting`, or `operator_attention`, report that state accurately.',
    '- For `interaction`, obtain the requested user decision, then call `babysitter_breakpoint_respond`',
    '  with the exact run directory, effect ID, invocation key, and approved boolean. The response tool',
    '  durably commits the decision and continues the run.',
    '  Never fabricate, infer, or synthesize breakpoint approval. Empty or dismissed input is not approval.',
    '- For `agent`, dispatch the exact one-item native `task` payload exactly once.',
    '  Do not rename its owner, change its model, alter its schema, split it, or dispatch another task.',
    '- The OMP extension is the sole writer for execution checkpoints, immutable output,',
    '  `task:post`, and subsequent `run:iterate` calls.',
    '- Never invoke `task:post` or `run:iterate` for a driver-owned effect.',
    '- Do not fall back to manual posting, ordinary named workers, or `hub wait` polling when',
    '  the driver returns an error. Return `operator_attention` and repair the driver or effect contract.',
    '- Shell effects execute inside `babysitter_drive`; never execute or post them separately.',
    '- Shell task definitions are trusted process code. Never interpolate untrusted user or model input',
    '  into `shell.command`; prefer an executable in `command` and an explicit `args` array.',
    '- Shell-language programs require `interpreter: "bash"` as an explicit trust declaration.',
    '- Return the driver-provided `completionProof` exactly inside `<promise>...</promise>` only after',
    '  `babysitter_drive` reports `completed`.',
  ].join('\n');
}

function renderOmpRunCreation(): string {
  return [
    '### 2. Create run and bind OMP session',
    '',
    'Create the run and bind it atomically to the current OMP session:',
    '',
    '```bash',
    '$CLI run:create \\',
    '  --process-id <id> \\',
    '  --entry <absolute-path>#<export> \\',
    '  --inputs <file> \\',
    '  --prompt "$PROMPT" \\',
    '  --harness oh-my-pi \\',
    '  --json',
    '```',
    '',
    '- The authoritative `OMP_SESSION_ID` is supplied by the OMP extension.',
    '- If `BABYSITTER_SESSION_ID` is present, it must exactly match `OMP_SESSION_ID`.',
    '- Never fabricate a session ID or substitute `AGENT_SESSION_ID` or a PID marker.',
    '- Do not pass `--session-id` to `run:create` inside OMP.',
    '- The created run records session ownership; resume it only from that owning session.',
  ].join('\n');
}

/**
 * Full babysit skill prompt -- equivalent to the current SKILL.md content.
 * Used to generate SKILL.md files for each harness plugin.
 */
export function composeBabysitSkillPrompt(ctx: PromptContext): string {
  const isOmp = ctx.harness === 'oh-my-pi';
  // Determine step count from catalog-derived context or fallback
  const stepCount = resolveStepCount(ctx);

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
    'Orchestrate the resolved run directory (`~/.a5c/runs/<runId>/` by default, with repo-local fallback compatibility) through iterative execution.',
    isOmp
      ? 'Use the OMP deterministic driver to execute process effects.'
      : 'Use the SDK CLI to drive the orchestration loop.',
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

  const coreWorkflowIntro = isOmp ? [
    '## Core Iteration Workflow',
    '',
    'The OMP Babysitter workflow has five steps:',
    '',
    '1. **Create or find the process** - research and author the process definition',
    '2. **Create run and bind session** - create the run with the authoritative OMP session ID',
    '3. **Drive deterministically** - call `babysitter_drive` with the absolute run directory',
    '4. **Dispatch exact agent payloads** - use the returned native task payload once',
    '5. **Completion proof** - finish only when the driver returns the emitted proof',
    '',
    '### 1. Create or find the process for the run',
  ].join('\n') : [
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
    parts.renderHostTools(ctx),
    parts.renderIntentFidelityChecks(ctx),
    isOmp ? '' : parts.renderRunOverlapDetection(ctx),
    isOmp ? renderOmpRunCreation() : parts.renderRunCreation(ctx),
    isOmp ? renderOmpDeterministicDriverWorkflow() : parts.renderIteration(ctx),
    isOmp ? '' : parts.renderEffects(ctx),
    isOmp ? '' : parts.renderParallelDispatch(ctx),
    isOmp ? '' : parts.renderBreakpointHandling(ctx),
    isOmp ? '' : parts.renderResultsPosting(ctx),
    isOmp ? '' : parts.renderLoopControl(ctx),
    isOmp ? '' : parts.renderCompletionProof(ctx),
    isOmp ? '' : parts.renderTaskKinds(ctx),
    isOmp ? '' : parts.renderTaskExamples(ctx),
    isOmp ? '' : parts.renderQuickReference(ctx),
    isOmp ? '' : parts.renderRecovery(ctx),
    parts.renderProcessGuidelines(ctx),
    isOmp ? '' : parts.renderCriticalRules(ctx),
    parts.renderPriorityLadder(ctx),
    parts.renderCodingPhilosophy(ctx),
    parts.renderRootCauseGuardrail(ctx),
    parts.renderToolPreferences(ctx),
    parts.renderOutputEfficiency(ctx),
    parts.renderGitSafety(ctx),
    parts.renderSeeAlso(ctx),
    parts.renderProjectInstructions(ctx),
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
    parts.renderHostTools(ctx),
    parts.renderIntentFidelityChecks(ctx),
    parts.renderProcessGuidelines(ctx),
    parts.renderParallelPhaseDetection(ctx),
    parts.renderTaskKinds(ctx),
    parts.renderTaskExamples(ctx),
    parts.renderPriorityLadder(ctx),
    parts.renderCodingPhilosophy(ctx),
    parts.renderRootCauseGuardrail(ctx),
    parts.renderToolPreferences(ctx),
    parts.renderGitSafety(ctx),
    parts.renderProjectInstructions(ctx),
  ]);
}

/**
 * Orchestration loop instructions -- for phase 2 agents.
 */
export function composeOrchestrationPrompt(ctx: PromptContext): string {
  const isOmp = ctx.harness === 'oh-my-pi';
  return joinNonEmpty([
    isOmp ? '' : parts.renderRunOverlapDetection(ctx),
    isOmp ? renderOmpRunCreation() : parts.renderRunCreation(ctx),
    isOmp ? renderOmpDeterministicDriverWorkflow() : parts.renderIteration(ctx),
    isOmp ? '' : parts.renderEffects(ctx),
    isOmp ? '' : parts.renderParallelDispatch(ctx),
    isOmp ? '' : parts.renderBreakpointHandling(ctx),
    isOmp ? '' : parts.renderResultsPosting(ctx),
    isOmp ? '' : parts.renderLoopControl(ctx),
    isOmp ? '' : parts.renderCompletionProof(ctx),
    isOmp ? '' : parts.renderQuickReference(ctx),
    isOmp ? '' : parts.renderRecovery(ctx),
    isOmp ? '' : parts.renderCriticalRules(ctx),
    parts.renderPriorityLadder(ctx),
    parts.renderRootCauseGuardrail(ctx),
    parts.renderOutputEfficiency(ctx),
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
