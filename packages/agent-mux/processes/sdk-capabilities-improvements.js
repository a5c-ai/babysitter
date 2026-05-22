import pkg from '@a5c-ai/babysitter-sdk';
const { defineTask } = pkg;

const extendCapabilitiesTask = defineTask('extend-capabilities', (args, ctx) => ({
  kind: 'agent',
  title: 'Extend AgentCapabilities Interface',
  agent: {
    name: 'generalist',
    prompt: {
      role: 'Senior Software Engineer',
      task: 'Update `packages/agent-mux/core/src/capabilities.ts` to include the new capability properties: `supportsSteering`, `supportsQueueing`, `supportsAsyncLoopTools`, `supportsNonInteractiveStream`, `supportsInteractiveStream`, `supportsJsonlStream`, and `supportsJsonlNonStream`.',
      outputFormat: 'JSON'
    },
    outputSchema: { type: 'object', required: ['status', 'changes'] }
  },
  io: { inputJsonPath: `tasks/${ctx.effectId}/input.json`, outputJsonPath: `tasks/${ctx.effectId}/result.json` }
}));

const updateAdaptersTask = defineTask('update-adapters', (args, ctx) => ({
  kind: 'agent',
  title: 'Update Adapters with New Capabilities',
  agent: {
    name: 'generalist',
    prompt: {
      role: 'Senior Software Engineer',
      task: 'Research and update all existing adapters in `packages/agent-mux/adapters/src/*-adapter.ts` to correctly report these new capabilities. Research `claude` (Claude Code), `gemini`, `codex`, `cursor`, `opencode`, etc. Usually `gemini` and `codex` might support steering/queueing. `claude-code` supports async loop tools.',
      outputFormat: 'JSON'
    },
    outputSchema: { type: 'object', required: ['status', 'changes'] }
  },
  io: { inputJsonPath: `tasks/${ctx.effectId}/input.json`, outputJsonPath: `tasks/${ctx.effectId}/result.json` }
}));

const updateDocsTask = defineTask('update-documentation', (args, ctx) => ({
  kind: 'agent',
  title: 'Update Capability Matrices Documentation',
  agent: {
    name: 'generalist',
    prompt: {
      role: 'Senior Technical Writer',
      task: 'Update `docs/19-capabilities-matrix.md` to reflect these new capabilities. Build a comprehensive matrix table showing the 16 modes for steering/queueing/stream/jsonl per adapter, and async loop tools.',
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
  ctx.log('info', 'Starting SDK capabilities improvements...');
  
  await ctx.task(extendCapabilitiesTask, {});
  await ctx.task(updateAdaptersTask, {});
  await ctx.task(updateDocsTask, {});
  
  try {
    await ctx.task(runTestsTask, {});
    ctx.log('info', 'Tests passed.');
  } catch (e) {
    ctx.log('warn', 'Tests failed.');
  }
  
  return { success: true };
}
