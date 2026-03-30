/**
 * @process specializations/web-development/micro-frontend-module-federation
 * @description Micro-Frontend with Module Federation - Process for implementing micro-frontend architecture using Webpack Module Federation.
 * @inputs { projectName: string, apps?: array }
 * @outputs { success: boolean, federationConfig: object, remotes: array, artifacts: array }
 * @references - Module Federation: https://webpack.js.org/concepts/module-federation/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, apps = [], outputDir = 'micro-frontend-module-federation' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Micro-Frontend Module Federation: ${projectName}`);

  const federationSetup = await ctx.task(federationSetupTask, { projectName, apps, outputDir });
  artifacts.push(...federationSetup.artifacts);

  const hostSetup = await ctx.task(hostSetupTask, { projectName, outputDir });
  artifacts.push(...hostSetup.artifacts);

  const remotesSetup = await ctx.task(remotesSetupTask, { projectName, apps, outputDir });
  artifacts.push(...remotesSetup.artifacts);

  const sharedSetup = await ctx.task(sharedSetupTask, { projectName, outputDir });
  artifacts.push(...sharedSetup.artifacts);

  await ctx.breakpoint({ question: `Micro-frontend setup complete for ${projectName}. Approve?`, title: 'Module Federation Review', context: { runId: ctx.runId, remotes: remotesSetup.remotes } });

  const documentation = await ctx.task(documentationTask, { projectName, outputDir });
  artifacts.push(...documentation.artifacts);

  return { success: true, projectName, federationConfig: federationSetup.config, remotes: remotesSetup.remotes, artifacts, duration: ctx.now() - startTime, metadata: { processId: 'specializations/web-development/micro-frontend-module-federation', timestamp: startTime } };
}

export const federationSetupTask = defineTask('federation-setup', (args, taskCtx) => ({ kind: 'agent', title: `Federation Setup - ${args.projectName}`, agent: { name: 'module-federation-architect', prompt: { role: 'Module Federation Architect', task: 'Configure Module Federation', context: args, instructions: ['1. Configure webpack.config', '2. Set up ModuleFederationPlugin', '3. Configure container', '4. Set up name', '5. Configure filename', '6. Set up exposes', '7. Configure remotes', '8. Set up shared', '9. Configure runtime', '10. Document setup'], outputFormat: 'JSON with federation setup' }, outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'micro-frontend', 'federation'] }));

export const hostSetupTask = defineTask('host-setup', (args, taskCtx) => ({ kind: 'agent', title: `Host Setup - ${args.projectName}`, agent: { name: 'host-application-specialist', prompt: { role: 'Host Application Specialist', task: 'Configure host application', context: args, instructions: ['1. Create shell application', '2. Configure routing', '3. Set up remote loading', '4. Configure fallbacks', '5. Set up error boundaries', '6. Configure lazy loading', '7. Set up navigation', '8. Configure layout', '9. Set up authentication', '10. Document host'], outputFormat: 'JSON with host setup' }, outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'micro-frontend', 'host'] }));

export const remotesSetupTask = defineTask('remotes-setup', (args, taskCtx) => ({ kind: 'agent', title: `Remotes Setup - ${args.projectName}`, agent: { name: 'remote-applications-specialist', prompt: { role: 'Remote Applications Specialist', task: 'Configure remote applications', context: args, instructions: ['1. Create remote apps', '2. Configure exposes', '3. Set up entry points', '4. Configure standalone mode', '5. Set up versioning', '6. Configure deployment', '7. Set up health checks', '8. Configure caching', '9. Set up fallbacks', '10. Document remotes'], outputFormat: 'JSON with remotes' }, outputSchema: { type: 'object', required: ['remotes', 'artifacts'], properties: { remotes: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'micro-frontend', 'remotes'] }));

export const sharedSetupTask = defineTask('shared-setup', (args, taskCtx) => ({ kind: 'agent', title: `Shared Setup - ${args.projectName}`, agent: { name: 'shared-dependencies-specialist', prompt: { role: 'Shared Dependencies Specialist', task: 'Configure shared dependencies', context: args, instructions: ['1. Configure shared modules', '2. Set up singleton', '3. Configure eager loading', '4. Set up version strategy', '5. Configure requiredVersion', '6. Set up strictVersion', '7. Configure shareScope', '8. Set up shareKey', '9. Configure package name', '10. Document shared'], outputFormat: 'JSON with shared setup' }, outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'micro-frontend', 'shared'] }));

export const documentationTask = defineTask('mf-documentation', (args, taskCtx) => ({ kind: 'agent', title: `Documentation - ${args.projectName}`, agent: { name: 'technical-writer-agent', prompt: { role: 'Technical Writer', task: 'Generate Module Federation documentation', context: args, instructions: ['1. Create README', '2. Document architecture', '3. Create host guide', '4. Document remotes', '5. Create shared guide', '6. Document deployment', '7. Create troubleshooting', '8. Document best practices', '9. Create examples', '10. Generate templates'], outputFormat: 'JSON with documentation' }, outputSchema: { type: 'object', required: ['docs', 'artifacts'], properties: { docs: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'micro-frontend', 'documentation'] }));
