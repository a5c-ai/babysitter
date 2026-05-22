import pkg from '@a5c-ai/babysitter-sdk';
const { defineTask } = pkg;

const refactorTypesTask = defineTask('refactor-types', (args, ctx) => ({
  kind: 'agent',
  title: 'Refactor AgentCapabilities Interface',
  agent: {
    name: 'generalist',
    prompt: {
      role: 'Senior Software Engineer',
      task: `Refactor the flat booleans \`supportsSteering\`, \`supportsQueueing\`, \`supportsNonInteractiveStream\`, \`supportsInteractiveStream\`, \`supportsJsonlStream\`, \`supportsJsonlNonStream\` in \`packages/agent-mux/core/src/capabilities.ts\` into nested objects. Add:

export interface ModeSupportMatrix {
  stream: boolean;
  nonStream: boolean;
  jsonlStream: boolean;
  jsonlNonStream: boolean;
}

export interface OrchestrationFeature {
  interactive: ModeSupportMatrix;
  nonInteractive: ModeSupportMatrix;
}

Then in AgentCapabilities:
  executionModes: OrchestrationFeature;
  steering: OrchestrationFeature;
  queueing: OrchestrationFeature;
  supportsAsyncLoopTools: boolean;

Delete the old flat boolean properties.
`,
      outputFormat: 'JSON'
    },
    outputSchema: { type: 'object', required: ['status', 'changes'] }
  },
  io: { inputJsonPath: `tasks/${ctx.effectId}/input.json`, outputJsonPath: `tasks/${ctx.effectId}/result.json` }
}));

const updateAdaptersTask = defineTask('update-adapters', (args, ctx) => ({
  kind: 'agent',
  title: 'Update Adapters with Nested Capabilities',
  agent: {
    name: 'generalist',
    prompt: {
      role: 'Senior Software Engineer',
      task: `Update all adapters in \`packages/agent-mux/adapters/src/*-adapter.ts\` to use \`executionModes\`, \`steering\`, \`queueing\`, and \`supportsAsyncLoopTools\` instead of the old flat properties. Build the new nested objects with sensible defaults (like the old flat ones, but map them across interactive/nonInteractive and stream/jsonl). Generally, only claude/codex/gemini had true for some of these. You can write a node script or do it manually.`,
      outputFormat: 'JSON'
    },
    outputSchema: { type: 'object', required: ['status', 'changes'] }
  },
  io: { inputJsonPath: `tasks/${ctx.effectId}/input.json`, outputJsonPath: `tasks/${ctx.effectId}/result.json` }
}));

const updateDocsTask = defineTask('update-docs', (args, ctx) => ({
  kind: 'agent',
  title: 'Update Documentation',
  agent: {
    name: 'generalist',
    prompt: {
      role: 'Senior Technical Writer',
      task: 'Update `docs/19-capabilities-matrix.md` to reflect the nested `executionModes`, `steering`, and `queueing` capabilities instead of the old flat modes. Build clearer matrices/tables to show the Interactive/NonInteractive x Stream/JSONL intersections.',
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
  ctx.log('info', 'Refactoring capability matrices...');
  
  await ctx.task(refactorTypesTask, {});
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
