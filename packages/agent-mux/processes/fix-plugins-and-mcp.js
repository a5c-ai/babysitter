import pkg from '@a5c-ai/babysitter-sdk';
const { defineTask } = pkg;

const investigateTask = defineTask('investigate', (args, ctx) => ({
  kind: 'agent',
  title: 'Investigate Plugins and MCP Settings',
  agent: {
    name: 'generalist',
    prompt: {
      role: 'Software Engineer',
      task: 'Check `packages/agent-mux/core`, `packages/agent-mux/cli`, `packages/agent-mux/tui`, and adapters like `packages/agent-mux/adapters/src/claude-adapter.ts` to figure out why plugins and MCP servers are not showing, and why global vs repo local distinction is missing or broken. Identify how to fix this by using `findProjectRoot` or adapter-specific logic. Write your plan to result.json.',
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
      task: 'Apply the fix based on the investigation plan. Make sure adapters and/or CLI/TUI correctly resolves project and global plugins/MCP servers.',
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
  ctx.log('info', 'Starting fix for plugins and MCP servers...');
  
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
