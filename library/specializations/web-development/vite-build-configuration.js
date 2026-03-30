/**
 * @process specializations/web-development/vite-build-configuration
 * @description Vite Build Configuration - Process for configuring Vite build tool with optimization, plugins, and development server setup.
 * @inputs { projectName: string, framework?: string }
 * @outputs { success: boolean, buildConfig: object, plugins: array, artifacts: array }
 * @references - Vite: https://vitejs.dev/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, framework = 'react', outputDir = 'vite-build-configuration' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Vite Build Configuration: ${projectName}`);

  const viteSetup = await ctx.task(viteSetupTask, { projectName, framework, outputDir });
  artifacts.push(...viteSetup.artifacts);

  const pluginsSetup = await ctx.task(pluginsSetupTask, { projectName, outputDir });
  artifacts.push(...pluginsSetup.artifacts);

  const optimizationSetup = await ctx.task(optimizationSetupTask, { projectName, outputDir });
  artifacts.push(...optimizationSetup.artifacts);

  const devServerSetup = await ctx.task(devServerSetupTask, { projectName, outputDir });
  artifacts.push(...devServerSetup.artifacts);

  await ctx.breakpoint({ question: `Vite configuration complete for ${projectName}. Approve?`, title: 'Vite Review', context: { runId: ctx.runId, config: viteSetup.config } });

  const documentation = await ctx.task(documentationTask, { projectName, outputDir });
  artifacts.push(...documentation.artifacts);

  return { success: true, projectName, buildConfig: viteSetup.config, plugins: pluginsSetup.plugins, artifacts, duration: ctx.now() - startTime, metadata: { processId: 'specializations/web-development/vite-build-configuration', timestamp: startTime } };
}

export const viteSetupTask = defineTask('vite-setup', (args, taskCtx) => ({ kind: 'agent', title: `Vite Setup - ${args.projectName}`, agent: { name: 'vite-architect', prompt: { role: 'Vite Architect', task: 'Configure Vite', context: args, instructions: ['1. Create vite.config', '2. Configure framework plugin', '3. Set up resolve aliases', '4. Configure CSS options', '5. Set up JSON handling', '6. Configure esbuild', '7. Set up worker options', '8. Configure assetsInclude', '9. Set up define', '10. Document setup'], outputFormat: 'JSON with Vite setup' }, outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'vite', 'setup'] }));

export const pluginsSetupTask = defineTask('plugins-setup', (args, taskCtx) => ({ kind: 'agent', title: `Plugins Setup - ${args.projectName}`, agent: { name: 'vite-plugins-specialist', prompt: { role: 'Vite Plugins Specialist', task: 'Configure plugins', context: args, instructions: ['1. Set up PWA plugin', '2. Configure compression', '3. Set up SVG plugin', '4. Configure image optimization', '5. Set up bundle analyzer', '6. Configure legacy', '7. Set up environment', '8. Configure icons', '9. Set up inspect', '10. Document plugins'], outputFormat: 'JSON with plugins' }, outputSchema: { type: 'object', required: ['plugins', 'artifacts'], properties: { plugins: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'vite', 'plugins'] }));

export const optimizationSetupTask = defineTask('optimization-setup', (args, taskCtx) => ({ kind: 'agent', title: `Optimization Setup - ${args.projectName}`, agent: { name: 'build-optimization-specialist', prompt: { role: 'Build Optimization Specialist', task: 'Configure build optimization', context: args, instructions: ['1. Configure code splitting', '2. Set up tree shaking', '3. Configure minification', '4. Set up chunk strategy', '5. Configure rollup options', '6. Set up source maps', '7. Configure preload', '8. Set up CSS code split', '9. Configure asset inlining', '10. Document optimization'], outputFormat: 'JSON with optimization' }, outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'vite', 'optimization'] }));

export const devServerSetupTask = defineTask('dev-server-setup', (args, taskCtx) => ({ kind: 'agent', title: `Dev Server Setup - ${args.projectName}`, agent: { name: 'dev-server-specialist', prompt: { role: 'Dev Server Specialist', task: 'Configure dev server', context: args, instructions: ['1. Configure HMR', '2. Set up proxy', '3. Configure CORS', '4. Set up HTTPS', '5. Configure headers', '6. Set up open', '7. Configure watch', '8. Set up middlewares', '9. Configure host', '10. Document server'], outputFormat: 'JSON with server config' }, outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'vite', 'dev-server'] }));

export const documentationTask = defineTask('vite-documentation', (args, taskCtx) => ({ kind: 'agent', title: `Documentation - ${args.projectName}`, agent: { name: 'technical-writer-agent', prompt: { role: 'Technical Writer', task: 'Generate Vite documentation', context: args, instructions: ['1. Create README', '2. Document configuration', '3. Create plugins guide', '4. Document optimization', '5. Create dev server guide', '6. Document env variables', '7. Create troubleshooting', '8. Document best practices', '9. Create examples', '10. Generate templates'], outputFormat: 'JSON with documentation' }, outputSchema: { type: 'object', required: ['docs', 'artifacts'], properties: { docs: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'vite', 'documentation'] }));
