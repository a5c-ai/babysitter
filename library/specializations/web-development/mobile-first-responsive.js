/**
 * @process specializations/web-development/mobile-first-responsive
 * @description Mobile-First Responsive Design - Process for implementing mobile-first responsive design with breakpoints, fluid layouts, and responsive components.
 * @inputs { projectName: string, framework?: string }
 * @outputs { success: boolean, breakpoints: array, responsiveComponents: array, artifacts: array }
 * @references - Responsive Design: https://web.dev/responsive-web-design-basics/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, framework = 'react', outputDir = 'mobile-first-responsive' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Mobile-First Responsive Design: ${projectName}`);

  const breakpointsSetup = await ctx.task(breakpointsSetupTask, { projectName, outputDir });
  artifacts.push(...breakpointsSetup.artifacts);

  const fluidLayoutsSetup = await ctx.task(fluidLayoutsTask, { projectName, outputDir });
  artifacts.push(...fluidLayoutsSetup.artifacts);

  const responsiveComponents = await ctx.task(responsiveComponentsTask, { projectName, framework, outputDir });
  artifacts.push(...responsiveComponents.artifacts);

  const touchOptimization = await ctx.task(touchOptimizationTask, { projectName, outputDir });
  artifacts.push(...touchOptimization.artifacts);

  await ctx.breakpoint({ question: `Mobile-first design complete for ${projectName}. Approve?`, title: 'Responsive Design Review', context: { runId: ctx.runId, breakpoints: breakpointsSetup.breakpoints } });

  const documentation = await ctx.task(documentationTask, { projectName, outputDir });
  artifacts.push(...documentation.artifacts);

  return { success: true, projectName, breakpoints: breakpointsSetup.breakpoints, responsiveComponents: responsiveComponents.components, artifacts, duration: ctx.now() - startTime, metadata: { processId: 'specializations/web-development/mobile-first-responsive', timestamp: startTime } };
}

export const breakpointsSetupTask = defineTask('breakpoints-setup', (args, taskCtx) => ({ kind: 'agent', title: `Breakpoints Setup - ${args.projectName}`, agent: { name: 'responsive-designer', prompt: { role: 'Responsive Designer', task: 'Set up breakpoints', context: args, instructions: ['1. Define breakpoints', '2. Configure media queries', '3. Set up container queries', '4. Configure CSS variables', '5. Set up responsive utilities', '6. Configure hooks', '7. Set up testing viewports', '8. Configure debug tools', '9. Set up documentation', '10. Document breakpoints'], outputFormat: 'JSON with breakpoints' }, outputSchema: { type: 'object', required: ['breakpoints', 'artifacts'], properties: { breakpoints: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'responsive', 'breakpoints'] }));

export const fluidLayoutsTask = defineTask('fluid-layouts', (args, taskCtx) => ({ kind: 'agent', title: `Fluid Layouts - ${args.projectName}`, agent: { name: 'layout-specialist', prompt: { role: 'Layout Specialist', task: 'Create fluid layouts', context: args, instructions: ['1. Implement fluid typography', '2. Set up fluid spacing', '3. Configure CSS Grid', '4. Set up Flexbox layouts', '5. Implement fluid containers', '6. Configure aspect ratios', '7. Set up clamp functions', '8. Configure min/max', '9. Implement scroll behavior', '10. Document layouts'], outputFormat: 'JSON with layouts' }, outputSchema: { type: 'object', required: ['layouts', 'artifacts'], properties: { layouts: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'responsive', 'layouts'] }));

export const responsiveComponentsTask = defineTask('responsive-components', (args, taskCtx) => ({ kind: 'agent', title: `Responsive Components - ${args.projectName}`, agent: { name: 'component-developer', prompt: { role: 'Component Developer', task: 'Create responsive components', context: args, instructions: ['1. Create responsive nav', '2. Build responsive grid', '3. Create responsive cards', '4. Build responsive tables', '5. Create responsive images', '6. Build responsive forms', '7. Create responsive modals', '8. Build responsive menus', '9. Create responsive sidebars', '10. Document components'], outputFormat: 'JSON with components' }, outputSchema: { type: 'object', required: ['components', 'artifacts'], properties: { components: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'responsive', 'components'] }));

export const touchOptimizationTask = defineTask('touch-optimization', (args, taskCtx) => ({ kind: 'agent', title: `Touch Optimization - ${args.projectName}`, agent: { name: 'touch-specialist', prompt: { role: 'Touch Optimization Specialist', task: 'Optimize for touch', context: args, instructions: ['1. Set up touch targets', '2. Configure gestures', '3. Set up swipe actions', '4. Configure pull-to-refresh', '5. Set up touch feedback', '6. Configure scrolling', '7. Set up pinch-zoom', '8. Configure haptics', '9. Set up orientation', '10. Document touch'], outputFormat: 'JSON with touch optimization' }, outputSchema: { type: 'object', required: ['optimizations', 'artifacts'], properties: { optimizations: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'responsive', 'touch'] }));

export const documentationTask = defineTask('responsive-documentation', (args, taskCtx) => ({ kind: 'agent', title: `Documentation - ${args.projectName}`, agent: { name: 'technical-writer-agent', prompt: { role: 'Technical Writer', task: 'Generate responsive documentation', context: args, instructions: ['1. Create README', '2. Document breakpoints', '3. Create layouts guide', '4. Document components', '5. Create touch guide', '6. Document testing', '7. Create checklist', '8. Document best practices', '9. Create examples', '10. Generate templates'], outputFormat: 'JSON with documentation' }, outputSchema: { type: 'object', required: ['docs', 'artifacts'], properties: { docs: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'responsive', 'documentation'] }));
