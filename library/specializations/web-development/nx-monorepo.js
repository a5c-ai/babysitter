/**
 * @process specializations/web-development/nx-monorepo
 * @description Nx Monorepo - Process for setting up and managing monorepo architecture with Nx for advanced build optimization and code generation.
 * @inputs { projectName: string, preset?: string }
 * @outputs { success: boolean, nxConfig: object, projects: array, artifacts: array }
 * @references - Nx: https://nx.dev/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, preset = 'react', outputDir = 'nx-monorepo' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Nx Monorepo: ${projectName}`);

  const nxSetup = await ctx.task(nxSetupTask, { projectName, preset, outputDir });
  artifacts.push(...nxSetup.artifacts);

  const projectsSetup = await ctx.task(projectsSetupTask, { projectName, outputDir });
  artifacts.push(...projectsSetup.artifacts);

  const generatorsSetup = await ctx.task(generatorsSetupTask, { projectName, outputDir });
  artifacts.push(...generatorsSetup.artifacts);

  const pluginsSetup = await ctx.task(pluginsSetupTask, { projectName, outputDir });
  artifacts.push(...pluginsSetup.artifacts);

  await ctx.breakpoint({ question: `Nx monorepo setup complete for ${projectName}. Approve?`, title: 'Nx Review', context: { runId: ctx.runId, config: nxSetup.config } });

  const documentation = await ctx.task(documentationTask, { projectName, outputDir });
  artifacts.push(...documentation.artifacts);

  return { success: true, projectName, nxConfig: nxSetup.config, projects: projectsSetup.projects, artifacts, duration: ctx.now() - startTime, metadata: { processId: 'specializations/web-development/nx-monorepo', timestamp: startTime } };
}

export const nxSetupTask = defineTask('nx-setup', (args, taskCtx) => ({ kind: 'agent', title: `Nx Setup - ${args.projectName}`, agent: { name: 'nx-architect', prompt: { role: 'Nx Architect', task: 'Configure Nx workspace', context: args, instructions: ['1. Create Nx workspace', '2. Configure nx.json', '3. Set up workspace.json', '4. Configure default project', '5. Set up task runners', '6. Configure caching', '7. Set up Nx Cloud', '8. Configure affected', '9. Set up implicit deps', '10. Document setup'], outputFormat: 'JSON with Nx setup' }, outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'nx', 'setup'] }));

export const projectsSetupTask = defineTask('projects-setup', (args, taskCtx) => ({ kind: 'agent', title: `Projects Setup - ${args.projectName}`, agent: { name: 'nx-projects-specialist', prompt: { role: 'Nx Projects Specialist', task: 'Configure projects', context: args, instructions: ['1. Create apps', '2. Create libraries', '3. Configure project.json', '4. Set up targets', '5. Configure executors', '6. Set up dependencies', '7. Configure tags', '8. Set up boundaries', '9. Configure buildable libs', '10. Document projects'], outputFormat: 'JSON with projects' }, outputSchema: { type: 'object', required: ['projects', 'artifacts'], properties: { projects: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'nx', 'projects'] }));

export const generatorsSetupTask = defineTask('generators-setup', (args, taskCtx) => ({ kind: 'agent', title: `Generators Setup - ${args.projectName}`, agent: { name: 'nx-generators-specialist', prompt: { role: 'Nx Generators Specialist', task: 'Configure generators', context: args, instructions: ['1. Create custom generators', '2. Configure templates', '3. Set up schematics', '4. Configure options', '5. Set up prompts', '6. Configure utilities', '7. Set up testing', '8. Configure migrations', '9. Set up presets', '10. Document generators'], outputFormat: 'JSON with generators' }, outputSchema: { type: 'object', required: ['generators', 'artifacts'], properties: { generators: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'nx', 'generators'] }));

export const pluginsSetupTask = defineTask('plugins-setup', (args, taskCtx) => ({ kind: 'agent', title: `Plugins Setup - ${args.projectName}`, agent: { name: 'nx-plugins-specialist', prompt: { role: 'Nx Plugins Specialist', task: 'Configure plugins', context: args, instructions: ['1. Install official plugins', '2. Configure React plugin', '3. Set up Next.js plugin', '4. Configure Jest plugin', '5. Set up Cypress plugin', '6. Configure ESLint plugin', '7. Set up Storybook plugin', '8. Configure custom plugins', '9. Set up executors', '10. Document plugins'], outputFormat: 'JSON with plugins' }, outputSchema: { type: 'object', required: ['plugins', 'artifacts'], properties: { plugins: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'nx', 'plugins'] }));

export const documentationTask = defineTask('nx-documentation', (args, taskCtx) => ({ kind: 'agent', title: `Documentation - ${args.projectName}`, agent: { name: 'technical-writer-agent', prompt: { role: 'Technical Writer', task: 'Generate Nx documentation', context: args, instructions: ['1. Create README', '2. Document configuration', '3. Create projects guide', '4. Document generators', '5. Create plugins guide', '6. Document commands', '7. Create troubleshooting', '8. Document best practices', '9. Create examples', '10. Generate templates'], outputFormat: 'JSON with documentation' }, outputSchema: { type: 'object', required: ['docs', 'artifacts'], properties: { docs: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'nx', 'documentation'] }));
