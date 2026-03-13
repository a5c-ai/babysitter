/**
 * @process specializations/web-development/zustand-state-management
 * @description Zustand State Management - Process for implementing Zustand for lightweight and flexible state management.
 * @inputs { projectName: string }
 * @outputs { success: boolean, storeConfig: object, stores: array, artifacts: array }
 * @references - Zustand: https://docs.pmnd.rs/zustand/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, outputDir = 'zustand-state-management' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Zustand State Management: ${projectName}`);

  const storeSetup = await ctx.task(storeSetupTask, { projectName, outputDir });
  artifacts.push(...storeSetup.artifacts);

  const storePatterns = await ctx.task(storePatternsTask, { projectName, outputDir });
  artifacts.push(...storePatterns.artifacts);

  const middleware = await ctx.task(middlewareTask, { projectName, outputDir });
  artifacts.push(...middleware.artifacts);

  const persistSetup = await ctx.task(persistSetupTask, { projectName, outputDir });
  artifacts.push(...persistSetup.artifacts);

  await ctx.breakpoint({ question: `Zustand state management complete for ${projectName}. Approve?`, title: 'Zustand Review', context: { runId: ctx.runId, stores: storePatterns.stores } });

  const documentation = await ctx.task(documentationTask, { projectName, outputDir });
  artifacts.push(...documentation.artifacts);

  return { success: true, projectName, storeConfig: storeSetup.config, stores: storePatterns.stores, artifacts, duration: ctx.now() - startTime, metadata: { processId: 'specializations/web-development/zustand-state-management', timestamp: startTime } };
}

export const storeSetupTask = defineTask('store-setup', (args, taskCtx) => ({ kind: 'agent', title: `Store Setup - ${args.projectName}`, agent: { name: 'zustand-architect', prompt: { role: 'Zustand Architect', task: 'Configure Zustand store', context: args, instructions: ['1. Install Zustand', '2. Create base store', '3. Configure TypeScript', '4. Set up devtools', '5. Configure immer', '6. Set up subscriptions', '7. Configure selectors', '8. Set up store isolation', '9. Configure equality fn', '10. Document store'], outputFormat: 'JSON with store setup' }, outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'zustand', 'store'] }));

export const storePatternsTask = defineTask('store-patterns', (args, taskCtx) => ({ kind: 'agent', title: `Store Patterns - ${args.projectName}`, agent: { name: 'zustand-developer', prompt: { role: 'Zustand Developer', task: 'Create store patterns', context: args, instructions: ['1. Create feature stores', '2. Define state shape', '3. Create actions', '4. Add computed values', '5. Configure slices', '6. Set up store composition', '7. Create hooks', '8. Configure selectors', '9. Set up transient updates', '10. Document patterns'], outputFormat: 'JSON with stores' }, outputSchema: { type: 'object', required: ['stores', 'artifacts'], properties: { stores: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'zustand', 'patterns'] }));

export const middlewareTask = defineTask('middleware', (args, taskCtx) => ({ kind: 'agent', title: `Middleware - ${args.projectName}`, agent: { name: 'zustand-middleware-specialist', prompt: { role: 'Zustand Middleware Specialist', task: 'Configure middleware', context: args, instructions: ['1. Configure devtools', '2. Set up logging', '3. Configure immer', '4. Set up subscribeWithSelector', '5. Configure combine', '6. Set up redux middleware', '7. Configure temporal', '8. Set up context', '9. Create custom middleware', '10. Document middleware'], outputFormat: 'JSON with middleware' }, outputSchema: { type: 'object', required: ['middleware', 'artifacts'], properties: { middleware: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'zustand', 'middleware'] }));

export const persistSetupTask = defineTask('persist-setup', (args, taskCtx) => ({ kind: 'agent', title: `Persist Setup - ${args.projectName}`, agent: { name: 'zustand-persist-specialist', prompt: { role: 'Zustand Persist Specialist', task: 'Configure persistence', context: args, instructions: ['1. Configure persist', '2. Set up localStorage', '3. Configure sessionStorage', '4. Set up indexedDB', '5. Configure migrations', '6. Set up versioning', '7. Configure partialize', '8. Set up onRehydrate', '9. Configure skipHydration', '10. Document persistence'], outputFormat: 'JSON with persist setup' }, outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'zustand', 'persist'] }));

export const documentationTask = defineTask('zustand-documentation', (args, taskCtx) => ({ kind: 'agent', title: `Documentation - ${args.projectName}`, agent: { name: 'technical-writer-agent', prompt: { role: 'Technical Writer', task: 'Generate Zustand documentation', context: args, instructions: ['1. Create README', '2. Document stores', '3. Create patterns guide', '4. Document middleware', '5. Create persist guide', '6. Document testing', '7. Create migration guide', '8. Document best practices', '9. Create examples', '10. Generate templates'], outputFormat: 'JSON with documentation' }, outputSchema: { type: 'object', required: ['docs', 'artifacts'], properties: { docs: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'zustand', 'documentation'] }));
