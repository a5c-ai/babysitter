/**
 * @process specializations/web-development/keyboard-navigation-focus
 * @description Keyboard Navigation and Focus Management - Process for implementing comprehensive keyboard navigation and focus management.
 * @inputs { projectName: string }
 * @outputs { success: boolean, navigationConfig: object, focusPatterns: array, artifacts: array }
 * @references - Focus Management: https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, outputDir = 'keyboard-navigation-focus' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Keyboard Navigation Setup: ${projectName}`);

  const navigationSetup = await ctx.task(navigationSetupTask, { projectName, outputDir });
  artifacts.push(...navigationSetup.artifacts);

  const focusManagement = await ctx.task(focusManagementTask, { projectName, outputDir });
  artifacts.push(...focusManagement.artifacts);

  const trapImplementation = await ctx.task(focusTrapTask, { projectName, outputDir });
  artifacts.push(...trapImplementation.artifacts);

  const skipLinks = await ctx.task(skipLinksTask, { projectName, outputDir });
  artifacts.push(...skipLinks.artifacts);

  await ctx.breakpoint({ question: `Keyboard navigation setup complete for ${projectName}. Approve?`, title: 'Navigation Review', context: { runId: ctx.runId, patterns: focusManagement.patterns } });

  const documentation = await ctx.task(documentationTask, { projectName, outputDir });
  artifacts.push(...documentation.artifacts);

  return { success: true, projectName, navigationConfig: navigationSetup.config, focusPatterns: focusManagement.patterns, artifacts, duration: ctx.now() - startTime, metadata: { processId: 'specializations/web-development/keyboard-navigation-focus', timestamp: startTime } };
}

export const navigationSetupTask = defineTask('navigation-setup', (args, taskCtx) => ({ kind: 'agent', title: `Navigation Setup - ${args.projectName}`, agent: { name: 'keyboard-nav-specialist', prompt: { role: 'Keyboard Navigation Specialist', task: 'Set up keyboard navigation', context: args, instructions: ['1. Configure tab order', '2. Implement arrow keys', '3. Set up shortcuts', '4. Configure escape handling', '5. Implement enter/space', '6. Set up roving tabindex', '7. Configure page keys', '8. Implement home/end', '9. Set up type-ahead', '10. Document navigation'], outputFormat: 'JSON with navigation setup' }, outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'accessibility', 'keyboard', 'navigation'] }));

export const focusManagementTask = defineTask('focus-management', (args, taskCtx) => ({ kind: 'agent', title: `Focus Management - ${args.projectName}`, agent: { name: 'focus-management-specialist', prompt: { role: 'Focus Management Specialist', task: 'Implement focus management', context: args, instructions: ['1. Create focus styles', '2. Implement focus visible', '3. Set up focus ring', '4. Configure focus indicators', '5. Implement focus restoration', '6. Set up programmatic focus', '7. Configure focus order', '8. Implement focus history', '9. Set up focus debugging', '10. Document focus'], outputFormat: 'JSON with focus management' }, outputSchema: { type: 'object', required: ['patterns', 'artifacts'], properties: { patterns: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'accessibility', 'focus', 'management'] }));

export const focusTrapTask = defineTask('focus-trap', (args, taskCtx) => ({ kind: 'agent', title: `Focus Trap - ${args.projectName}`, agent: { name: 'focus-trap-specialist', prompt: { role: 'Focus Trap Specialist', task: 'Implement focus trapping', context: args, instructions: ['1. Create focus trap hook', '2. Implement modal trapping', '3. Set up initial focus', '4. Configure return focus', '5. Implement tab wrapping', '6. Set up scroll lock', '7. Configure nested traps', '8. Implement deactivation', '9. Set up portal traps', '10. Document traps'], outputFormat: 'JSON with focus traps' }, outputSchema: { type: 'object', required: ['traps', 'artifacts'], properties: { traps: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'accessibility', 'focus', 'trap'] }));

export const skipLinksTask = defineTask('skip-links', (args, taskCtx) => ({ kind: 'agent', title: `Skip Links - ${args.projectName}`, agent: { name: 'skip-links-specialist', prompt: { role: 'Skip Links Specialist', task: 'Implement skip links', context: args, instructions: ['1. Create skip to content', '2. Add skip to navigation', '3. Implement skip to footer', '4. Configure visibility', '5. Set up anchor targets', '6. Implement smooth scroll', '7. Configure focus on skip', '8. Add landmark links', '9. Set up page sections', '10. Document skip links'], outputFormat: 'JSON with skip links' }, outputSchema: { type: 'object', required: ['links', 'artifacts'], properties: { links: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'accessibility', 'skip-links'] }));

export const documentationTask = defineTask('keyboard-documentation', (args, taskCtx) => ({ kind: 'agent', title: `Documentation - ${args.projectName}`, agent: { name: 'technical-writer-agent', prompt: { role: 'Technical Writer', task: 'Generate keyboard documentation', context: args, instructions: ['1. Create README', '2. Document navigation', '3. Create focus guide', '4. Document traps', '5. Create skip links guide', '6. Document shortcuts', '7. Create testing guide', '8. Document best practices', '9. Create examples', '10. Generate templates'], outputFormat: 'JSON with documentation' }, outputSchema: { type: 'object', required: ['docs', 'artifacts'], properties: { docs: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'accessibility', 'documentation'] }));
