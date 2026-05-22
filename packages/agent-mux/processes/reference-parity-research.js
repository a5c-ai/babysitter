/**
 * @process reference-parity-research
 * @description Research external adapter references and produce parity/gap analysis vs agent-mux.
 *
 * Status: INITIAL PASS COMPLETE — see docs/16-reference-comparison.md.
 * This process re-runs the analysis deeply, file-by-file, for each reference.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const analyzeRefTask = defineTask('analyze-reference', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze reference: ${args.name}`,
  execution: { model: 'claude-opus-4-6' },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior engineer performing comparative code analysis',
      task: `Read every source file under ${args.url}. Extract formats, syntaxes, patterns, performance/security considerations, error handling, edge cases. Compare against our adapters in packages/agent-mux/adapters/src/. Return gap list.`,
      context: { name: args.name, url: args.url, ourAdapters: args.ourAdapters },
      instructions: [
        'WebFetch each file individually — do not stop at directory tree.',
        'Produce structured JSON: { patterns[], perfSecurityNotes[], errorHandling[], edgeCases[], gapsVsOurs[{area, ref, ours, recommendation}] }',
      ],
      outputFormat: 'JSON',
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const synthesizeTask = defineTask('synthesize-parity', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize parity report',
  execution: { model: 'claude-opus-4-6' },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Author',
      task: 'Merge per-reference gap lists into docs/16-reference-comparison.md appendix and open followup issues for each recommendation.',
      context: { perRef: args.perRef },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const REFS = [
  { name: 'paperclip', url: 'https://github.com/paperclipai/paperclip/tree/master/packages/adapters' },
  { name: 'vibe-kanban', url: 'https://github.com/BloopAI/vibe-kanban/tree/main/crates/executors/src/executors' },
  { name: 'sandboxed.sh', url: 'https://github.com/Th0rgal/sandboxed.sh/tree/master/src/backend' },
  { name: 'matop', url: 'https://github.com/hiyenwong/matop/tree/main/crates/agentmon-adapters/src' },
  { name: 'ai-usage', url: 'https://github.com/SihaoLiu/ai-usage/tree/main/src/data' },
  { name: 'gru-claude-runner', url: 'https://github.com/fotoetienne/gru/blob/main/src/claude_runner.rs' },
  { name: 'gru-claude-backend', url: 'https://github.com/fotoetienne/gru/blob/main/src/claude_backend.rs' },
  { name: 'gru-codex-backend', url: 'https://github.com/fotoetienne/gru/blob/main/src/codex_backend.rs' },
];

export default async function referenceParity(ctx) {
  const perRef = [];
  for (const ref of REFS) {
    perRef.push(await ctx.run(analyzeRefTask, { ...ref, ourAdapters: 'packages/agent-mux/adapters/src/' }));
  }
  await ctx.run(synthesizeTask, { perRef });
  return { ok: true, refsAnalyzed: REFS.length };
}
