import pkg from '@a5c-ai/babysitter-sdk';
const { defineTask } = pkg;

const analyzeTask = defineTask('analyze-cli', (args, ctx) => ({
  kind: 'agent',
  title: 'Analyze CLI and Core',
  agent: {
    name: 'generalist',
    prompt: {
      role: 'Senior Software Engineer',
      task: 'Check `packages/agent-mux/cli` to ensure `amux run` properly parses `--prompt` and `--non-interactive` flags and passes `nonInteractive: true` to `RunOptions` ONLY when appropriate. Fix if necessary.',
      outputFormat: 'JSON'
    },
    outputSchema: { type: 'object', required: ['status', 'changes'] }
  },
  io: { inputJsonPath: `tasks/${ctx.effectId}/input.json`, outputJsonPath: `tasks/${ctx.effectId}/result.json` }
}));

const fixAdaptersTask = defineTask('fix-adapters', (args, ctx) => ({
  kind: 'agent',
  title: 'Fix Adapters',
  agent: {
    name: 'generalist',
    prompt: {
      role: 'Senior Software Engineer',
      task: 'Modify all adapters in `packages/agent-mux/adapters/src/*-adapter.ts` to only append `-p` or `--prompt` to `buildSpawnArgs` when `options.nonInteractive` is true. If false, rely on stdin/stdout handling. Make sure not to break existing adapters.',
      outputFormat: 'JSON'
    },
    outputSchema: { type: 'object', required: ['status', 'changes'] }
  },
  io: { inputJsonPath: `tasks/${ctx.effectId}/input.json`, outputJsonPath: `tasks/${ctx.effectId}/result.json` }
}));

const runTestsTask = defineTask('run-tests', (args, ctx) => ({
  kind: 'shell',
  title: 'Run CI and Tests',
  shell: {
    command: `npm run test`,
    expectedExitCode: 0,
    timeout: 300000,
  },
  io: { inputJsonPath: `tasks/${ctx.effectId}/input.json`, outputJsonPath: `tasks/${ctx.effectId}/output.json` }
}));

export async function process(inputs, ctx) {
  ctx.log('info', 'Starting process to fix nonInteractive flag usage in adapters...');
  
  await ctx.task(analyzeTask, {});
  await ctx.task(fixAdaptersTask, {});
  
  try {
    await ctx.task(runTestsTask, {});
    ctx.log('info', 'Tests passed successfully.');
  } catch (e) {
    ctx.log('warn', 'Tests failed after changes.');
  }

  return { success: true };
}
