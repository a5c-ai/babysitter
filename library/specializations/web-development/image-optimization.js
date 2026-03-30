/**
 * @process specializations/web-development/image-optimization
 * @description Image Optimization - Process for optimizing images with modern formats (WebP, AVIF), responsive images, lazy loading, and CDN integration.
 * @inputs { projectName: string, framework?: string }
 * @outputs { success: boolean, optimizations: array, config: object, artifacts: array }
 * @references - Image Optimization: https://web.dev/fast/#optimize-your-images
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, framework = 'nextjs', outputDir = 'image-optimization' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Image Optimization: ${projectName}`);

  const auditTask = await ctx.task(imageAuditTask, { projectName, outputDir });
  artifacts.push(...auditTask.artifacts);

  const formatTask = await ctx.task(formatOptimizationTask, { projectName, outputDir });
  artifacts.push(...formatTask.artifacts);

  const responsiveTask = await ctx.task(responsiveImagesTask, { projectName, framework, outputDir });
  artifacts.push(...responsiveTask.artifacts);

  const lazyLoadingTask = await ctx.task(lazyLoadingSetupTask, { projectName, outputDir });
  artifacts.push(...lazyLoadingTask.artifacts);

  await ctx.breakpoint({ question: `Image optimization complete for ${projectName}. Approve?`, title: 'Image Optimization Review', context: { runId: ctx.runId } });

  const documentation = await ctx.task(documentationTask, { projectName, outputDir });
  artifacts.push(...documentation.artifacts);

  return { success: true, projectName, optimizations: [...formatTask.optimizations, ...responsiveTask.optimizations], config: lazyLoadingTask.config, artifacts, duration: ctx.now() - startTime, metadata: { processId: 'specializations/web-development/image-optimization', timestamp: startTime } };
}

export const imageAuditTask = defineTask('image-audit', (args, taskCtx) => ({ kind: 'agent', title: `Image Audit - ${args.projectName}`, agent: { name: 'image-auditor', prompt: { role: 'Image Optimization Auditor', task: 'Audit image usage', context: args, instructions: ['1. Analyze image formats', '2. Check image sizes', '3. Identify unoptimized images', '4. Check responsive usage', '5. Analyze lazy loading', '6. Check CDN usage', '7. Identify LCP images', '8. Calculate potential savings', '9. Prioritize optimizations', '10. Document findings'], outputFormat: 'JSON with audit' }, outputSchema: { type: 'object', required: ['findings', 'artifacts'], properties: { findings: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'performance', 'images'] }));

export const formatOptimizationTask = defineTask('format-optimization', (args, taskCtx) => ({ kind: 'agent', title: `Format Optimization - ${args.projectName}`, agent: { name: 'format-optimizer', prompt: { role: 'Image Format Specialist', task: 'Optimize image formats', context: args, instructions: ['1. Configure WebP generation', '2. Set up AVIF support', '3. Configure fallbacks', '4. Set up compression', '5. Configure quality settings', '6. Set up build integration', '7. Configure caching', '8. Set up CDN transformation', '9. Configure responsive formats', '10. Document formats'], outputFormat: 'JSON with format optimization' }, outputSchema: { type: 'object', required: ['optimizations', 'artifacts'], properties: { optimizations: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'performance', 'image-formats'] }));

export const responsiveImagesTask = defineTask('responsive-images', (args, taskCtx) => ({ kind: 'agent', title: `Responsive Images - ${args.projectName}`, agent: { name: 'responsive-images-specialist', prompt: { role: 'Responsive Images Specialist', task: 'Implement responsive images', context: args, instructions: ['1. Configure srcset', '2. Set up sizes attribute', '3. Configure art direction', '4. Set up image component', '5. Configure breakpoints', '6. Set up density switching', '7. Configure placeholders', '8. Set up blur-up', '9. Configure priority loading', '10. Document responsive setup'], outputFormat: 'JSON with responsive images' }, outputSchema: { type: 'object', required: ['optimizations', 'artifacts'], properties: { optimizations: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'performance', 'responsive-images'] }));

export const lazyLoadingSetupTask = defineTask('lazy-loading', (args, taskCtx) => ({ kind: 'agent', title: `Lazy Loading - ${args.projectName}`, agent: { name: 'lazy-loading-specialist', prompt: { role: 'Lazy Loading Specialist', task: 'Implement lazy loading', context: args, instructions: ['1. Configure native lazy loading', '2. Set up intersection observer', '3. Configure loading priority', '4. Set up placeholder images', '5. Configure progressive loading', '6. Set up error handling', '7. Configure above-fold images', '8. Set up preloading', '9. Configure skeleton screens', '10. Document lazy loading'], outputFormat: 'JSON with lazy loading' }, outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'performance', 'lazy-loading'] }));

export const documentationTask = defineTask('image-documentation', (args, taskCtx) => ({ kind: 'agent', title: `Documentation - ${args.projectName}`, agent: { name: 'technical-writer-agent', prompt: { role: 'Technical Writer', task: 'Generate image documentation', context: args, instructions: ['1. Create README', '2. Document formats', '3. Create responsive guide', '4. Document lazy loading', '5. Create optimization checklist', '6. Document CDN setup', '7. Create troubleshooting', '8. Document tools', '9. Create examples', '10. Generate reports'], outputFormat: 'JSON with documentation' }, outputSchema: { type: 'object', required: ['docs', 'artifacts'], properties: { docs: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'performance', 'documentation'] }));
