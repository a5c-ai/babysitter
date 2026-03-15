/**
 * @process specializations/web-development/react-query-server-state
 * @description React Query Server State - Process for implementing TanStack Query for server state management, caching, and synchronization.
 * @inputs { projectName: string }
 * @outputs { success: boolean, queryConfig: object, queries: array, artifacts: array }
 * @references - TanStack Query: https://tanstack.com/query/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, outputDir = 'react-query-server-state' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting React Query Server State: ${projectName}`);

  const querySetup = await ctx.task(querySetupTask, { projectName, outputDir });
  artifacts.push(...querySetup.artifacts);

  const queriesImplementation = await ctx.task(queriesImplementationTask, { projectName, outputDir });
  artifacts.push(...queriesImplementation.artifacts);

  const mutationsSetup = await ctx.task(mutationsSetupTask, { projectName, outputDir });
  artifacts.push(...mutationsSetup.artifacts);

  const cachingStrategy = await ctx.task(cachingStrategyTask, { projectName, outputDir });
  artifacts.push(...cachingStrategy.artifacts);

  await ctx.breakpoint({ question: `React Query setup complete for ${projectName}. Approve?`, title: 'React Query Review', context: { runId: ctx.runId, queries: queriesImplementation.queries } });

  const documentation = await ctx.task(documentationTask, { projectName, outputDir });
  artifacts.push(...documentation.artifacts);

  return { success: true, projectName, queryConfig: querySetup.config, queries: queriesImplementation.queries, artifacts, duration: ctx.now() - startTime, metadata: { processId: 'specializations/web-development/react-query-server-state', timestamp: startTime } };
}

export const querySetupTask = defineTask('query-setup', (args, taskCtx) => ({ kind: 'agent', title: `Query Setup - ${args.projectName}`, agent: { name: 'react-query-architect', prompt: { role: 'React Query Architect', task: 'Configure React Query', context: args, instructions: ['1. Install TanStack Query', '2. Configure QueryClient', '3. Set up QueryClientProvider', '4. Configure defaults', '5. Set up devtools', '6. Configure staleTime', '7. Set up gcTime', '8. Configure retry', '9. Set up refetchOnWindowFocus', '10. Document setup'], outputFormat: 'JSON with query setup' }, outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'react-query', 'setup'] }));

export const queriesImplementationTask = defineTask('queries-implementation', (args, taskCtx) => ({ kind: 'agent', title: `Queries Implementation - ${args.projectName}`, agent: { name: 'react-query-developer', prompt: { role: 'React Query Developer', task: 'Implement queries', context: args, instructions: ['1. Create useQuery hooks', '2. Configure query keys', '3. Set up query functions', '4. Configure placeholderData', '5. Set up initialData', '6. Configure enabled', '7. Set up select', '8. Configure dependent queries', '9. Set up parallel queries', '10. Document queries'], outputFormat: 'JSON with queries' }, outputSchema: { type: 'object', required: ['queries', 'artifacts'], properties: { queries: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'react-query', 'queries'] }));

export const mutationsSetupTask = defineTask('mutations-setup', (args, taskCtx) => ({ kind: 'agent', title: `Mutations Setup - ${args.projectName}`, agent: { name: 'react-query-mutations-specialist', prompt: { role: 'React Query Mutations Specialist', task: 'Implement mutations', context: args, instructions: ['1. Create useMutation hooks', '2. Configure onSuccess', '3. Set up onError', '4. Configure onSettled', '5. Set up optimistic updates', '6. Configure invalidation', '7. Set up retry', '8. Configure mutation scope', '9. Set up mutation cache', '10. Document mutations'], outputFormat: 'JSON with mutations' }, outputSchema: { type: 'object', required: ['mutations', 'artifacts'], properties: { mutations: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'react-query', 'mutations'] }));

export const cachingStrategyTask = defineTask('caching-strategy', (args, taskCtx) => ({ kind: 'agent', title: `Caching Strategy - ${args.projectName}`, agent: { name: 'caching-specialist', prompt: { role: 'Caching Specialist', task: 'Implement caching strategy', context: args, instructions: ['1. Configure stale-while-revalidate', '2. Set up cache invalidation', '3. Configure prefetching', '4. Set up infinite queries', '5. Configure pagination', '6. Set up deduplication', '7. Configure persistence', '8. Set up hydration', '9. Configure structural sharing', '10. Document caching'], outputFormat: 'JSON with caching strategy' }, outputSchema: { type: 'object', required: ['strategy', 'artifacts'], properties: { strategy: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'react-query', 'caching'] }));

export const documentationTask = defineTask('react-query-documentation', (args, taskCtx) => ({ kind: 'agent', title: `Documentation - ${args.projectName}`, agent: { name: 'technical-writer-agent', prompt: { role: 'Technical Writer', task: 'Generate React Query documentation', context: args, instructions: ['1. Create README', '2. Document queries', '3. Create mutations guide', '4. Document caching', '5. Create patterns guide', '6. Document testing', '7. Create SSR guide', '8. Document best practices', '9. Create examples', '10. Generate templates'], outputFormat: 'JSON with documentation' }, outputSchema: { type: 'object', required: ['docs', 'artifacts'], properties: { docs: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'react-query', 'documentation'] }));
