/**
 * @process specializations/web-development/redux-state-management
 * @description Redux State Management - Process for implementing Redux with Redux Toolkit for scalable global state management.
 * @inputs { projectName: string, features?: array }
 * @outputs { success: boolean, storeConfig: object, slices: array, artifacts: array }
 * @references - Redux Toolkit: https://redux-toolkit.js.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, features = [], outputDir = 'redux-state-management' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Redux State Management: ${projectName}`);

  const storeSetup = await ctx.task(storeSetupTask, { projectName, outputDir });
  artifacts.push(...storeSetup.artifacts);

  const slicesCreation = await ctx.task(slicesCreationTask, { projectName, features, outputDir });
  artifacts.push(...slicesCreation.artifacts);

  const asyncThunks = await ctx.task(asyncThunksTask, { projectName, outputDir });
  artifacts.push(...asyncThunks.artifacts);

  const selectors = await ctx.task(selectorsTask, { projectName, outputDir });
  artifacts.push(...selectors.artifacts);

  await ctx.breakpoint({ question: `Redux state management complete for ${projectName}. Approve?`, title: 'Redux Review', context: { runId: ctx.runId, slices: slicesCreation.slices } });

  const documentation = await ctx.task(documentationTask, { projectName, outputDir });
  artifacts.push(...documentation.artifacts);

  return { success: true, projectName, storeConfig: storeSetup.config, slices: slicesCreation.slices, artifacts, duration: ctx.now() - startTime, metadata: { processId: 'specializations/web-development/redux-state-management', timestamp: startTime } };
}

export const storeSetupTask = defineTask('store-setup', (args, taskCtx) => ({ kind: 'skill', title: `Store Setup - ${args.projectName}`, skill: { name: 'redux-toolkit-skill', prompt: { role: 'Redux Architect', task: 'Configure Redux store', context: args, instructions: ['1. Configure Redux Toolkit', '2. Set up configureStore', '3. Configure middleware', '4. Set up Redux DevTools', '5. Configure persist', '6. Set up enhancers', '7. Configure hot reload', '8. Set up listeners', '9. Configure serialization', '10. Document store'], outputFormat: 'JSON with store setup' }, outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'redux', 'store'] }));

export const slicesCreationTask = defineTask('slices-creation', (args, taskCtx) => ({ kind: 'agent', title: `Slices Creation - ${args.projectName}`, agent: { name: 'redux-developer', prompt: { role: 'Redux Developer', task: 'Create Redux slices', context: args, instructions: ['1. Create feature slices', '2. Define initial state', '3. Create reducers', '4. Add actions', '5. Configure extraReducers', '6. Set up prepare callbacks', '7. Create entity adapters', '8. Configure normalization', '9. Set up slice isolation', '10. Document slices'], outputFormat: 'JSON with slices' }, outputSchema: { type: 'object', required: ['slices', 'artifacts'], properties: { slices: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'redux', 'slices'] }));

export const asyncThunksTask = defineTask('async-thunks', (args, taskCtx) => ({ kind: 'agent', title: `Async Thunks - ${args.projectName}`, agent: { name: 'redux-async-specialist', prompt: { role: 'Redux Async Specialist', task: 'Implement async thunks', context: args, instructions: ['1. Create createAsyncThunk', '2. Handle pending state', '3. Handle fulfilled state', '4. Handle rejected state', '5. Configure cancellation', '6. Set up error handling', '7. Configure retry logic', '8. Set up optimistic updates', '9. Configure loading states', '10. Document thunks'], outputFormat: 'JSON with thunks' }, outputSchema: { type: 'object', required: ['thunks', 'artifacts'], properties: { thunks: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'redux', 'async'] }));

export const selectorsTask = defineTask('selectors', (args, taskCtx) => ({ kind: 'agent', title: `Selectors - ${args.projectName}`, agent: { name: 'redux-selectors-specialist', prompt: { role: 'Redux Selectors Specialist', task: 'Create Redux selectors', context: args, instructions: ['1. Create base selectors', '2. Configure createSelector', '3. Set up memoization', '4. Create derived data', '5. Configure reselect', '6. Set up parameterized', '7. Create composed selectors', '8. Configure performance', '9. Set up type safety', '10. Document selectors'], outputFormat: 'JSON with selectors' }, outputSchema: { type: 'object', required: ['selectors', 'artifacts'], properties: { selectors: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'redux', 'selectors'] }));

export const documentationTask = defineTask('redux-documentation', (args, taskCtx) => ({ kind: 'agent', title: `Documentation - ${args.projectName}`, agent: { name: 'technical-writer-agent', prompt: { role: 'Technical Writer', task: 'Generate Redux documentation', context: args, instructions: ['1. Create README', '2. Document store', '3. Create slices guide', '4. Document thunks', '5. Create selectors guide', '6. Document patterns', '7. Create testing guide', '8. Document best practices', '9. Create examples', '10. Generate templates'], outputFormat: 'JSON with documentation' }, outputSchema: { type: 'object', required: ['docs', 'artifacts'], properties: { docs: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'redux', 'documentation'] }));
