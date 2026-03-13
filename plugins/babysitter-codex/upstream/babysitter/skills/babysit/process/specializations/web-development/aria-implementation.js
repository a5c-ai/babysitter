/**
 * @process specializations/web-development/aria-implementation
 * @description ARIA Implementation - Process for implementing ARIA attributes, roles, and patterns for complex interactive components.
 * @inputs { projectName: string, components?: array }
 * @outputs { success: boolean, ariaPatterns: array, components: array, artifacts: array }
 * @references - WAI-ARIA: https://www.w3.org/WAI/ARIA/apg/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, components = [], outputDir = 'aria-implementation' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting ARIA Implementation: ${projectName}`);

  const ariaAnalysis = await ctx.task(ariaAnalysisTask, { projectName, components, outputDir });
  artifacts.push(...ariaAnalysis.artifacts);

  const rolesImplementation = await ctx.task(rolesImplementationTask, { projectName, outputDir });
  artifacts.push(...rolesImplementation.artifacts);

  const patternsImplementation = await ctx.task(patternsImplementationTask, { projectName, outputDir });
  artifacts.push(...patternsImplementation.artifacts);

  const liveRegions = await ctx.task(liveRegionsTask, { projectName, outputDir });
  artifacts.push(...liveRegions.artifacts);

  await ctx.breakpoint({ question: `ARIA implementation complete for ${projectName}. Approve?`, title: 'ARIA Review', context: { runId: ctx.runId, patterns: patternsImplementation.patterns } });

  const documentation = await ctx.task(documentationTask, { projectName, outputDir });
  artifacts.push(...documentation.artifacts);

  return { success: true, projectName, ariaPatterns: patternsImplementation.patterns, components: rolesImplementation.components, artifacts, duration: ctx.now() - startTime, metadata: { processId: 'specializations/web-development/aria-implementation', timestamp: startTime } };
}

export const ariaAnalysisTask = defineTask('aria-analysis', (args, taskCtx) => ({ kind: 'agent', title: `ARIA Analysis - ${args.projectName}`, agent: { name: 'aria-analyst', prompt: { role: 'ARIA Analyst', task: 'Analyze ARIA requirements', context: args, instructions: ['1. Identify interactive components', '2. Analyze current ARIA usage', '3. Identify missing attributes', '4. Check role appropriateness', '5. Analyze state management', '6. Check property usage', '7. Identify anti-patterns', '8. Check screen reader compatibility', '9. Prioritize improvements', '10. Document analysis'], outputFormat: 'JSON with analysis' }, outputSchema: { type: 'object', required: ['analysis', 'artifacts'], properties: { analysis: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'accessibility', 'aria', 'analysis'] }));

export const rolesImplementationTask = defineTask('roles-implementation', (args, taskCtx) => ({ kind: 'agent', title: `Roles Implementation - ${args.projectName}`, agent: { name: 'aria-roles-specialist', prompt: { role: 'ARIA Roles Specialist', task: 'Implement ARIA roles', context: args, instructions: ['1. Implement widget roles', '2. Add document roles', '3. Implement landmark roles', '4. Add composite roles', '5. Configure abstract roles', '6. Set up role hierarchies', '7. Configure role states', '8. Add role properties', '9. Validate role usage', '10. Document roles'], outputFormat: 'JSON with roles' }, outputSchema: { type: 'object', required: ['components', 'artifacts'], properties: { components: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'accessibility', 'aria', 'roles'] }));

export const patternsImplementationTask = defineTask('patterns-implementation', (args, taskCtx) => ({ kind: 'agent', title: `Patterns Implementation - ${args.projectName}`, agent: { name: 'aria-patterns-specialist', prompt: { role: 'ARIA Patterns Specialist', task: 'Implement ARIA patterns', context: args, instructions: ['1. Implement accordion pattern', '2. Add dialog pattern', '3. Implement menu pattern', '4. Add tabs pattern', '5. Implement combobox', '6. Add tree view', '7. Implement carousel', '8. Add toolbar', '9. Implement listbox', '10. Document patterns'], outputFormat: 'JSON with patterns' }, outputSchema: { type: 'object', required: ['patterns', 'artifacts'], properties: { patterns: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'accessibility', 'aria', 'patterns'] }));

export const liveRegionsTask = defineTask('live-regions', (args, taskCtx) => ({ kind: 'agent', title: `Live Regions - ${args.projectName}`, agent: { name: 'live-regions-specialist', prompt: { role: 'Live Regions Specialist', task: 'Implement live regions', context: args, instructions: ['1. Configure aria-live', '2. Set up assertive regions', '3. Configure polite regions', '4. Implement status messages', '5. Add alert regions', '6. Configure aria-atomic', '7. Set up aria-relevant', '8. Implement progress', '9. Add notifications', '10. Document live regions'], outputFormat: 'JSON with live regions' }, outputSchema: { type: 'object', required: ['regions', 'artifacts'], properties: { regions: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'accessibility', 'aria', 'live-regions'] }));

export const documentationTask = defineTask('aria-documentation', (args, taskCtx) => ({ kind: 'agent', title: `Documentation - ${args.projectName}`, agent: { name: 'technical-writer-agent', prompt: { role: 'Technical Writer', task: 'Generate ARIA documentation', context: args, instructions: ['1. Create README', '2. Document roles', '3. Create patterns guide', '4. Document live regions', '5. Create testing guide', '6. Document best practices', '7. Create cheatsheet', '8. Document anti-patterns', '9. Create examples', '10. Generate templates'], outputFormat: 'JSON with documentation' }, outputSchema: { type: 'object', required: ['docs', 'artifacts'], properties: { docs: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'accessibility', 'documentation'] }));
