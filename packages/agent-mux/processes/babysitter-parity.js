/**
 * @process babysitter-parity
 * @description Research a5c-ai/babysitter (staging) SDK for harness-adapter features we may be missing; file gap issues.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const analyzeBabysitterTask = defineTask('analyze-babysitter-sdk', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze babysitter SDK harness adapters (staging branch)',
  execution: { model: 'claude-opus-4-6' },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior engineer doing comparative SDK analysis',
      task: 'Read every harness-adapter source file under github.com/a5c-ai/babysitter (staging branch) and compare to packages/agent-mux/adapters/src/. Identify features, edge-case handling, and error paths we may be missing.',
      instructions: [
        'WebFetch the staging branch tree; enumerate adapter files.',
        'For each file, extract: supported RunOptions, parseEvent branches, error-mapping fallbacks, session resume logic, auth paths, hook/plugin integration.',
        'Cross-reference against our packages/agent-mux/adapters/src/<name>-adapter.ts.',
        'Return JSON: { perAdapter: [{name, theirFeatures, ourCoverage, gaps[]}], genericFeatures: [{name, location, recommendation}] }',
      ],
      outputFormat: 'JSON',
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const filePrTask = defineTask('file-gap-prs', (args, taskCtx) => ({
  kind: 'agent',
  title: 'File gap-closure PRs or issues',
  execution: { model: 'claude-opus-4-6' },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Maintainer',
      task: 'For each gap, either implement it as a small PR (if scoped) or file a GitHub issue with repro + recommendation.',
      context: { gaps: args.gaps },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export default async function babysitterParity(ctx) {
  const report = await ctx.run(analyzeBabysitterTask, {});
  await ctx.run(filePrTask, { gaps: report.perAdapter.flatMap((p) => p.gaps).concat(report.genericFeatures) });
  return { ok: true };
}
