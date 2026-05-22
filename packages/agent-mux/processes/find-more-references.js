/**
 * @process find-more-references
 * @description Discover additional battle-tested OSS projects wrapping/monitoring agent harnesses, analyze them.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const searchTask = defineTask('search-references', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Search for additional harness reference projects',
  execution: { model: 'claude-opus-4-6' },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'OSS researcher',
      task: 'Find battle-tested projects that monitor, orchestrate, or wrap multiple coding-agent CLIs. Categories: monitors (cctop, ccusage), orchestrators, UI wrappers (vibe-kanban), sandboxing tools.',
      instructions: [
        'Use WebSearch for "claude code monitor", "agent cli wrapper", "codex session reader", "ccusage alternatives".',
        'Return JSON: { projects: [{name, url, category, stars, lastActivity, relevance}] }',
        'Minimum 10 projects, filter by >100 stars or active commits in last 6 months.',
      ],
      outputFormat: 'JSON',
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export default async function findMoreReferences(ctx) {
  const { projects } = await ctx.run(searchTask, {});
  // Hand off to reference-parity-research with this list appended.
  return { ok: true, projects };
}
