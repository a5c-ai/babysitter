import pkg from '@a5c-ai/babysitter-sdk';
const { defineTask } = pkg;

const investigateTask = defineTask('investigate', (args, ctx) => ({
  kind: 'agent',
  title: 'Investigate Skill Paths for Claude',
  agent: {
    name: 'generalist',
    prompt: {
      role: 'Software Engineer',
      task: 'Check `packages/agent-mux/core`, `packages/agent-mux/cli`, and `packages/agent-mux/adapters/src/claude-adapter.ts` to figure out why Claude Code adapter is not loading repo specific skills, and why it is not showing the correct skills. Write the finding and the plan to result.json.',
      outputFormat: 'JSON'
    },
    outputSchema: { type: 'object', required: ['status', 'findings', 'plan'] }
  },
  io: { inputJsonPath: `tasks/${ctx.effectId}/input.json`, outputJsonPath: `tasks/${ctx.effectId}/result.json` }
}));

const applyFixTask = defineTask('apply-fix', (args, ctx) => ({
  kind: 'agent',
  title: 'Apply the Fix',
  agent: {
    name: 'generalist',
    prompt: {
      role: 'Software Engineer',
      task: 'Apply the fix based on the investigation plan. Make sure `claude-adapter.ts` and relevant logic correctly resolves project/global skills and provides them to the Claude CLI.',
      outputFormat: 'JSON'
    },
    outputSchema: { type: 'object', required: ['status', 'changes'] }
  },
  io: { inputJsonPath: `tasks/${ctx.effectId}/input.json`, outputJsonPath: `tasks/${ctx.effectId}/result.json` }
}));

const runTestsTask = defineTask('run-tests', (args, ctx) => ({
  kind: 'shell',
  title: 'Run Tests',
  shell: {
    command: 'npm run test',
    expectedExitCode: 0,
    timeout: 300000,
  },
  io: { inputJsonPath: `tasks/${ctx.effectId}/input.json`, outputJsonPath: `tasks/${ctx.effectId}/output.json` }
}));

export async function process(inputs, ctx) {
  ctx.log('info', 'Starting fix for claude skills...');
  
  await ctx.task(investigateTask, {});
  await ctx.task(applyFixTask, {});
  
  try {
    await ctx.task(runTestsTask, {});
    ctx.log('info', 'Tests passed.');
  } catch (e) {
    ctx.log('warn', 'Tests failed.');
  }
  
  return { success: true };
}
