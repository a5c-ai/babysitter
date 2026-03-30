/**
 * @process specializations/web-development/turborepo-monorepo
 * @description Turborepo Monorepo - Process for setting up and managing monorepo architecture with Turborepo for build caching and task orchestration.
 * @inputs { projectName: string, packages?: array }
 * @outputs { success: boolean, turboConfig: object, workspaces: array, artifacts: array }
 * @references - Turborepo: https://turbo.build/repo
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, packages = [], outputDir = 'turborepo-monorepo' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Turborepo Monorepo: ${projectName}`);

  const turboSetup = await ctx.task(turboSetupTask, { projectName, packages, outputDir });
  artifacts.push(...turboSetup.artifacts);

  const workspacesSetup = await ctx.task(workspacesSetupTask, { projectName, outputDir });
  artifacts.push(...workspacesSetup.artifacts);

  const pipelineSetup = await ctx.task(pipelineSetupTask, { projectName, outputDir });
  artifacts.push(...pipelineSetup.artifacts);

  const cachingSetup = await ctx.task(cachingSetupTask, { projectName, outputDir });
  artifacts.push(...cachingSetup.artifacts);

  await ctx.breakpoint({ question: `Turborepo setup complete for ${projectName}. Approve?`, title: 'Turborepo Review', context: { runId: ctx.runId, config: turboSetup.config } });

  const documentation = await ctx.task(documentationTask, { projectName, outputDir });
  artifacts.push(...documentation.artifacts);

  return { success: true, projectName, turboConfig: turboSetup.config, workspaces: workspacesSetup.workspaces, artifacts, duration: ctx.now() - startTime, metadata: { processId: 'specializations/web-development/turborepo-monorepo', timestamp: startTime } };
}

export const turboSetupTask = defineTask('turbo-setup', (args, taskCtx) => ({ kind: 'agent', title: `Turbo Setup - ${args.projectName}`, agent: { name: 'turborepo-architect', prompt: { role: 'Turborepo Architect', task: 'Configure Turborepo', context: args, instructions: ['1. Initialize Turborepo', '2. Create turbo.json', '3. Configure root package.json', '4. Set up .turbo', '5. Configure globalDependencies', '6. Set up globalEnv', '7. Configure globalPassThroughEnv', '8. Set up remote cache', '9. Configure daemon', '10. Document setup'], outputFormat: 'JSON with Turbo setup' }, outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'turborepo', 'setup'] }));

export const workspacesSetupTask = defineTask('workspaces-setup', (args, taskCtx) => ({ kind: 'agent', title: `Workspaces Setup - ${args.projectName}`, agent: { name: 'workspaces-specialist', prompt: { role: 'Workspaces Specialist', task: 'Configure workspaces', context: args, instructions: ['1. Configure pnpm workspaces', '2. Set up apps directory', '3. Configure packages directory', '4. Set up shared configs', '5. Configure UI library', '6. Set up utilities', '7. Configure types', '8. Set up tsconfig', '9. Configure eslint', '10. Document workspaces'], outputFormat: 'JSON with workspaces' }, outputSchema: { type: 'object', required: ['workspaces', 'artifacts'], properties: { workspaces: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'turborepo', 'workspaces'] }));

export const pipelineSetupTask = defineTask('pipeline-setup', (args, taskCtx) => ({ kind: 'agent', title: `Pipeline Setup - ${args.projectName}`, agent: { name: 'turbo-pipeline-specialist', prompt: { role: 'Turbo Pipeline Specialist', task: 'Configure pipelines', context: args, instructions: ['1. Configure build pipeline', '2. Set up test pipeline', '3. Configure lint pipeline', '4. Set up type-check', '5. Configure dev task', '6. Set up dependsOn', '7. Configure outputs', '8. Set up inputs', '9. Configure persistent', '10. Document pipelines'], outputFormat: 'JSON with pipelines' }, outputSchema: { type: 'object', required: ['pipelines', 'artifacts'], properties: { pipelines: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'turborepo', 'pipeline'] }));

export const cachingSetupTask = defineTask('caching-setup', (args, taskCtx) => ({ kind: 'agent', title: `Caching Setup - ${args.projectName}`, agent: { name: 'turbo-caching-specialist', prompt: { role: 'Turbo Caching Specialist', task: 'Configure caching', context: args, instructions: ['1. Configure local cache', '2. Set up remote cache', '3. Configure Vercel Remote Cache', '4. Set up cache artifacts', '5. Configure cache inputs', '6. Set up cache outputs', '7. Configure CI caching', '8. Set up debug', '9. Configure cache signature', '10. Document caching'], outputFormat: 'JSON with caching' }, outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'turborepo', 'caching'] }));

export const documentationTask = defineTask('turborepo-documentation', (args, taskCtx) => ({ kind: 'agent', title: `Documentation - ${args.projectName}`, agent: { name: 'technical-writer-agent', prompt: { role: 'Technical Writer', task: 'Generate Turborepo documentation', context: args, instructions: ['1. Create README', '2. Document configuration', '3. Create workspaces guide', '4. Document pipelines', '5. Create caching guide', '6. Document scripts', '7. Create troubleshooting', '8. Document best practices', '9. Create examples', '10. Generate templates'], outputFormat: 'JSON with documentation' }, outputSchema: { type: 'object', required: ['docs', 'artifacts'], properties: { docs: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'turborepo', 'documentation'] }));
