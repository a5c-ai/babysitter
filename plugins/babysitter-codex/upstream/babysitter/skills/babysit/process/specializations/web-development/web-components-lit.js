/**
 * @process specializations/web-development/web-components-lit
 * @description Web Components with Lit - Process for building web components using Lit framework with shadow DOM and custom elements.
 * @inputs { projectName: string }
 * @outputs { success: boolean, componentLibrary: object, components: array, artifacts: array }
 * @references - Lit: https://lit.dev/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, outputDir = 'web-components-lit' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Web Components with Lit: ${projectName}`);

  const litSetup = await ctx.task(litSetupTask, { projectName, outputDir });
  artifacts.push(...litSetup.artifacts);

  const componentsCreation = await ctx.task(componentsCreationTask, { projectName, outputDir });
  artifacts.push(...componentsCreation.artifacts);

  const stylingSetup = await ctx.task(stylingSetupTask, { projectName, outputDir });
  artifacts.push(...stylingSetup.artifacts);

  const publishingSetup = await ctx.task(publishingSetupTask, { projectName, outputDir });
  artifacts.push(...publishingSetup.artifacts);

  await ctx.breakpoint({ question: `Web Components complete for ${projectName}. Approve?`, title: 'Lit Review', context: { runId: ctx.runId, components: componentsCreation.components } });

  const documentation = await ctx.task(documentationTask, { projectName, outputDir });
  artifacts.push(...documentation.artifacts);

  return { success: true, projectName, componentLibrary: litSetup.config, components: componentsCreation.components, artifacts, duration: ctx.now() - startTime, metadata: { processId: 'specializations/web-development/web-components-lit', timestamp: startTime } };
}

export const litSetupTask = defineTask('lit-setup', (args, taskCtx) => ({ kind: 'agent', title: `Lit Setup - ${args.projectName}`, agent: { name: 'lit-architect', prompt: { role: 'Lit Architect', task: 'Configure Lit project', context: args, instructions: ['1. Initialize Lit project', '2. Configure TypeScript', '3. Set up decorators', '4. Configure build tools', '5. Set up dev server', '6. Configure testing', '7. Set up Storybook', '8. Configure linting', '9. Set up CI/CD', '10. Document setup'], outputFormat: 'JSON with Lit setup' }, outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'lit', 'setup'] }));

export const componentsCreationTask = defineTask('components-creation', (args, taskCtx) => ({ kind: 'agent', title: `Components Creation - ${args.projectName}`, agent: { name: 'lit-component-developer', prompt: { role: 'Lit Component Developer', task: 'Create Lit components', context: args, instructions: ['1. Create base component', '2. Configure properties', '3. Set up reactive state', '4. Configure lifecycle', '5. Set up events', '6. Configure slots', '7. Set up controllers', '8. Configure directives', '9. Set up templates', '10. Document components'], outputFormat: 'JSON with components' }, outputSchema: { type: 'object', required: ['components', 'artifacts'], properties: { components: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'lit', 'components'] }));

export const stylingSetupTask = defineTask('styling-setup', (args, taskCtx) => ({ kind: 'agent', title: `Styling Setup - ${args.projectName}`, agent: { name: 'lit-styling-specialist', prompt: { role: 'Lit Styling Specialist', task: 'Configure component styling', context: args, instructions: ['1. Set up CSS in template', '2. Configure shared styles', '3. Set up CSS properties', '4. Configure theming', '5. Set up adoptedStyleSheets', '6. Configure shadow parts', '7. Set up CSS custom properties', '8. Configure animations', '9. Set up responsive styles', '10. Document styling'], outputFormat: 'JSON with styling' }, outputSchema: { type: 'object', required: ['styles', 'artifacts'], properties: { styles: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'lit', 'styling'] }));

export const publishingSetupTask = defineTask('publishing-setup', (args, taskCtx) => ({ kind: 'agent', title: `Publishing Setup - ${args.projectName}`, agent: { name: 'npm-publishing-specialist', prompt: { role: 'NPM Publishing Specialist', task: 'Configure publishing', context: args, instructions: ['1. Configure package.json', '2. Set up exports', '3. Configure types', '4. Set up bundling', '5. Configure tree shaking', '6. Set up CDN', '7. Configure versioning', '8. Set up changelog', '9. Configure publishing', '10. Document publishing'], outputFormat: 'JSON with publishing' }, outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'lit', 'publishing'] }));

export const documentationTask = defineTask('lit-documentation', (args, taskCtx) => ({ kind: 'agent', title: `Documentation - ${args.projectName}`, agent: { name: 'technical-writer-agent', prompt: { role: 'Technical Writer', task: 'Generate Lit documentation', context: args, instructions: ['1. Create README', '2. Document components', '3. Create styling guide', '4. Document properties', '5. Create events guide', '6. Document testing', '7. Create usage guide', '8. Document best practices', '9. Create examples', '10. Generate API docs'], outputFormat: 'JSON with documentation' }, outputSchema: { type: 'object', required: ['docs', 'artifacts'], properties: { docs: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'lit', 'documentation'] }));
