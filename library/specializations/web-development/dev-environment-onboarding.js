/**
 * @process specializations/web-development/dev-environment-onboarding
 * @description Developer Environment Onboarding - Process for setting up developer environment with tooling, configurations, and documentation.
 * @inputs { projectName: string, stack?: array }
 * @outputs { success: boolean, devSetup: object, tools: array, artifacts: array }
 * @references - Development Setup: https://code.visualstudio.com/docs
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, stack = ['node', 'react', 'typescript'], outputDir = 'dev-environment-onboarding' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Developer Environment Onboarding: ${projectName}`);

  const toolingSetup = await ctx.task(toolingSetupTask, { projectName, stack, outputDir });
  artifacts.push(...toolingSetup.artifacts);

  const ideSetup = await ctx.task(ideSetupTask, { projectName, outputDir });
  artifacts.push(...ideSetup.artifacts);

  const devContainers = await ctx.task(devContainersTask, { projectName, outputDir });
  artifacts.push(...devContainers.artifacts);

  const scriptsSetup = await ctx.task(scriptsSetupTask, { projectName, outputDir });
  artifacts.push(...scriptsSetup.artifacts);

  await ctx.breakpoint({ question: `Developer environment setup complete for ${projectName}. Approve?`, title: 'Dev Environment Review', context: { runId: ctx.runId, tools: toolingSetup.tools } });

  const documentation = await ctx.task(documentationTask, { projectName, outputDir });
  artifacts.push(...documentation.artifacts);

  return { success: true, projectName, devSetup: toolingSetup.setup, tools: toolingSetup.tools, artifacts, duration: ctx.now() - startTime, metadata: { processId: 'specializations/web-development/dev-environment-onboarding', timestamp: startTime } };
}

export const toolingSetupTask = defineTask('tooling-setup', (args, taskCtx) => ({ kind: 'agent', title: `Tooling Setup - ${args.projectName}`, agent: { name: 'dev-tooling-architect', prompt: { role: 'Dev Tooling Architect', task: 'Configure development tools', context: args, instructions: ['1. Configure Node.js version', '2. Set up package manager', '3. Configure nvm/fnm', '4. Set up corepack', '5. Configure dependencies', '6. Set up global tools', '7. Configure shell setup', '8. Set up environment vars', '9. Configure scripts', '10. Document tooling'], outputFormat: 'JSON with tooling setup' }, outputSchema: { type: 'object', required: ['setup', 'tools', 'artifacts'], properties: { setup: { type: 'object' }, tools: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'dev-environment', 'tooling'] }));

export const ideSetupTask = defineTask('ide-setup', (args, taskCtx) => ({ kind: 'agent', title: `IDE Setup - ${args.projectName}`, agent: { name: 'ide-configuration-specialist', prompt: { role: 'IDE Configuration Specialist', task: 'Configure IDE settings', context: args, instructions: ['1. Configure VS Code settings', '2. Set up extensions', '3. Configure keybindings', '4. Set up snippets', '5. Configure tasks', '6. Set up launch.json', '7. Configure workspace', '8. Set up spell check', '9. Configure themes', '10. Document IDE setup'], outputFormat: 'JSON with IDE setup' }, outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'dev-environment', 'ide'] }));

export const devContainersTask = defineTask('dev-containers', (args, taskCtx) => ({ kind: 'agent', title: `Dev Containers - ${args.projectName}`, agent: { name: 'dev-containers-specialist', prompt: { role: 'Dev Containers Specialist', task: 'Configure dev containers', context: args, instructions: ['1. Create devcontainer.json', '2. Configure Dockerfile', '3. Set up features', '4. Configure extensions', '5. Set up ports', '6. Configure mounts', '7. Set up postCreate', '8. Configure environment', '9. Set up Codespaces', '10. Document containers'], outputFormat: 'JSON with dev containers' }, outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'dev-environment', 'containers'] }));

export const scriptsSetupTask = defineTask('scripts-setup', (args, taskCtx) => ({ kind: 'agent', title: `Scripts Setup - ${args.projectName}`, agent: { name: 'dev-scripts-specialist', prompt: { role: 'Dev Scripts Specialist', task: 'Configure development scripts', context: args, instructions: ['1. Create setup script', '2. Configure dev script', '3. Set up build script', '4. Configure test scripts', '5. Set up lint scripts', '6. Configure format scripts', '7. Set up clean script', '8. Configure check scripts', '9. Set up release scripts', '10. Document scripts'], outputFormat: 'JSON with scripts' }, outputSchema: { type: 'object', required: ['scripts', 'artifacts'], properties: { scripts: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'dev-environment', 'scripts'] }));

export const documentationTask = defineTask('onboarding-documentation', (args, taskCtx) => ({ kind: 'agent', title: `Documentation - ${args.projectName}`, agent: { name: 'technical-writer-agent', prompt: { role: 'Technical Writer', task: 'Generate onboarding documentation', context: args, instructions: ['1. Create CONTRIBUTING.md', '2. Document prerequisites', '3. Create setup guide', '4. Document IDE setup', '5. Create dev containers guide', '6. Document scripts', '7. Create troubleshooting', '8. Document workflows', '9. Create FAQ', '10. Generate checklist'], outputFormat: 'JSON with documentation' }, outputSchema: { type: 'object', required: ['docs', 'artifacts'], properties: { docs: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'dev-environment', 'documentation'] }));
