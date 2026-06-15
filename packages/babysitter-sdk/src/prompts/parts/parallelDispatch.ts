/**
 * Prompt part: Parallel & Async Effect Dispatch instructions.
 *
 * Only rendered when the harness declares at least one GAP-PAR capability
 * (concurrent-effects | background-effects | multi-harness-dispatch).
 * All external harnesses lack these capabilities and receive an empty string.
 *
 * @module prompts/parts/parallelDispatch
 */

import type { PromptContext } from '../types';

const PAR_CAPABILITIES = [
  'concurrent-effects',
  'background-effects',
  'multi-harness-dispatch',
] as const;

function hasParallelCapability(ctx: PromptContext): boolean {
  return PAR_CAPABILITIES.some(cap => ctx.capabilities.includes(cap));
}

/**
 * Renders parallel/async dispatch instructions for harnesses that support them.
 */
export function renderParallelDispatch(ctx: PromptContext): string {
  if (!hasParallelCapability(ctx)) return '';

  const hasConcurrent = ctx.capabilities.includes('concurrent-effects');
  const hasBackground = ctx.capabilities.includes('background-effects');
  const hasMultiHarness = ctx.capabilities.includes('multi-harness-dispatch');

  const sections: string[] = [
    '## Parallel & Async Effect Dispatch',
    '',
    'This harness supports advanced effect scheduling. The `run:iterate` output',
    'enriches `nextActions` with `schedulerHints` fields that control dispatch.',
  ];

  if (hasConcurrent) {
    sections.push(
      '',
      '### Concurrent Effect Groups (GAP-PAR-001)',
      '',
      'Effects that share a `schedulerHints.parallelGroupId` must be dispatched',
      'concurrently. The `schedulerHints.maxConcurrency` field (if present) caps',
      'the number of in-flight effects within that group.',
      '',
      '```',
      'nextActions[n].schedulerHints.parallelGroupId  // group key',
      'nextActions[n].schedulerHints.maxConcurrency   // optional cap',
      'nextActions[n].schedulerHints.executionStrategy // sequential|concurrent|adaptive',
      '```',
      '',
      '**Rule:** Dispatch all actions in the same `parallelGroupId` before waiting',
      'for any single one to complete, unless `maxConcurrency` forces batching.',
    );
  }

  if (hasBackground) {
    sections.push(
      '',
      '### Background (Async) Effects (GAP-PAR-002)',
      '',
      '`schedulerHints.background === true` marks an effect as non-blocking.',
      'Background effects must be dispatched fire-and-forget; do not block',
      'iteration on their completion.',
      '',
      '```',
      'nextActions[n].schedulerHints.background       // true = async/non-blocking',
      'nextActions[n].schedulerHints.pollIntervalMs   // how often to poll (default 5000)',
      'nextActions[n].schedulerHints.timeoutMs        // optional wall-clock deadline',
      '```',
      '',
      '**Rule:** After dispatching background effects, immediately continue to',
      'the next iteration. Post results via `task:post` asynchronously when',
      'they complete. Background effects with a shared `parallelGroupId` with',
      'foreground effects will have `:bg` appended to their group ID.',
    );
  }

  if (hasMultiHarness) {
    sections.push(
      '',
      '### Multi-Harness Parallel Dispatch (GAP-PAR-003)',
      '',
      '`schedulerHints.preferredHarness` names the harness CLI that should',
      'execute a given effect. When present, route the task to that harness',
      'instead of executing it locally.',
      '',
      '```',
      'nextActions[n].schedulerHints.preferredHarness // e.g. "claude-code", "codex"',
      'nextActions[n].schedulerHints.groupRole        // coordinator|worker',
      'nextActions[n].schedulerHints.effectGroupId    // cross-harness group key',
      '```',
      '',
      '**Rule:** Coordinator-role effects orchestrate workers. Workers execute the',
      'leaf tasks. Never re-route a worker effect to a third harness.',
    );
  }

  return sections.join('\n');
}
