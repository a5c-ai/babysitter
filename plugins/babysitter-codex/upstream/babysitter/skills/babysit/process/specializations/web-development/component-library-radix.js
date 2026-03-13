/**
 * @process specializations/web-development/component-library-radix
 * @description Component Library with Radix - Process for building accessible component libraries using Radix UI primitives.
 * @inputs { projectName: string, styling?: string }
 * @outputs { success: boolean, primitives: array, components: array, artifacts: array }
 * @references - Radix UI: https://www.radix-ui.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, styling = 'tailwind', outputDir = 'component-library-radix' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Radix Component Library: ${projectName}`);

  const radixSetup = await ctx.task(radixSetupTask, { projectName, styling, outputDir });
  artifacts.push(...radixSetup.artifacts);

  const primitivesSetup = await ctx.task(primitivesSetupTask, { projectName, outputDir });
  artifacts.push(...primitivesSetup.artifacts);

  const componentComposition = await ctx.task(componentCompositionTask, { projectName, outputDir });
  artifacts.push(...componentComposition.artifacts);

  const accessibilityValidation = await ctx.task(accessibilityValidationTask, { projectName, outputDir });
  artifacts.push(...accessibilityValidation.artifacts);

  await ctx.breakpoint({ question: `Radix component library complete for ${projectName}. Approve?`, title: 'Radix Review', context: { runId: ctx.runId, components: componentComposition.components } });

  const documentation = await ctx.task(documentationTask, { projectName, outputDir });
  artifacts.push(...documentation.artifacts);

  return { success: true, projectName, primitives: primitivesSetup.primitives, components: componentComposition.components, artifacts, duration: ctx.now() - startTime, metadata: { processId: 'specializations/web-development/component-library-radix', timestamp: startTime } };
}

export const radixSetupTask = defineTask('radix-setup', (args, taskCtx) => ({ kind: 'agent', title: `Radix Setup - ${args.projectName}`, agent: { name: 'radix-architect', prompt: { role: 'Radix Architect', task: 'Configure Radix UI', context: args, instructions: ['1. Install Radix packages', '2. Configure TypeScript', '3. Set up styling', '4. Configure animations', '5. Set up themes', '6. Configure CSS variables', '7. Set up color system', '8. Configure dark mode', '9. Set up portal root', '10. Document setup'], outputFormat: 'JSON with Radix setup' }, outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'radix', 'setup'] }));

export const primitivesSetupTask = defineTask('primitives-setup', (args, taskCtx) => ({ kind: 'agent', title: `Primitives Setup - ${args.projectName}`, agent: { name: 'radix-primitives-specialist', prompt: { role: 'Radix Primitives Specialist', task: 'Configure primitives', context: args, instructions: ['1. Set up Dialog', '2. Configure Dropdown', '3. Set up Popover', '4. Configure Tabs', '5. Set up Accordion', '6. Configure Select', '7. Set up Checkbox', '8. Configure Radio', '9. Set up Slider', '10. Document primitives'], outputFormat: 'JSON with primitives' }, outputSchema: { type: 'object', required: ['primitives', 'artifacts'], properties: { primitives: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'radix', 'primitives'] }));

export const componentCompositionTask = defineTask('component-composition', (args, taskCtx) => ({ kind: 'agent', title: `Component Composition - ${args.projectName}`, agent: { name: 'radix-component-developer', prompt: { role: 'Radix Component Developer', task: 'Compose components', context: args, instructions: ['1. Create styled primitives', '2. Add custom behaviors', '3. Compose compound', '4. Create variants', '5. Set up animations', '6. Configure keyboard', '7. Add custom hooks', '8. Create utilities', '9. Set up stories', '10. Document components'], outputFormat: 'JSON with components' }, outputSchema: { type: 'object', required: ['components', 'artifacts'], properties: { components: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'radix', 'components'] }));

export const accessibilityValidationTask = defineTask('a11y-validation', (args, taskCtx) => ({ kind: 'agent', title: `Accessibility Validation - ${args.projectName}`, agent: { name: 'a11y-specialist', prompt: { role: 'Accessibility Specialist', task: 'Validate accessibility', context: args, instructions: ['1. Test keyboard navigation', '2. Validate ARIA', '3. Test screen readers', '4. Check focus management', '5. Validate announcements', '6. Test color contrast', '7. Validate roles', '8. Test dismiss behavior', '9. Check motion preferences', '10. Document a11y'], outputFormat: 'JSON with validation' }, outputSchema: { type: 'object', required: ['results', 'artifacts'], properties: { results: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'radix', 'accessibility'] }));

export const documentationTask = defineTask('radix-documentation', (args, taskCtx) => ({ kind: 'agent', title: `Documentation - ${args.projectName}`, agent: { name: 'technical-writer-agent', prompt: { role: 'Technical Writer', task: 'Generate Radix documentation', context: args, instructions: ['1. Create README', '2. Document primitives', '3. Create component guide', '4. Document accessibility', '5. Create styling guide', '6. Document patterns', '7. Create Storybook', '8. Document best practices', '9. Create examples', '10. Generate templates'], outputFormat: 'JSON with documentation' }, outputSchema: { type: 'object', required: ['docs', 'artifacts'], properties: { docs: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'radix', 'documentation'] }));
