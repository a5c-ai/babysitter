/**
 * @process specializations/web-development/web-performance-optimization
 * @description Web Performance Optimization - Process for optimizing Core Web Vitals (LCP, FID, CLS), implementing performance monitoring, and improving page load times.
 * @inputs { projectName: string, framework?: string, features?: object }
 * @outputs { success: boolean, optimizations: array, metrics: object, artifacts: array }
 * @references
 * - Web Vitals: https://web.dev/vitals/
 * - Lighthouse: https://developers.google.com/web/tools/lighthouse
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, framework = 'react', features = { monitoring: true }, outputDir = 'web-performance-optimization' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Web Performance Optimization: ${projectName}`);

  const auditTask = await ctx.task(performanceAuditTask, { projectName, framework, outputDir });
  artifacts.push(...auditTask.artifacts);

  const lcpOptimization = await ctx.task(lcpOptimizationTask, { projectName, outputDir });
  artifacts.push(...lcpOptimization.artifacts);

  const fidOptimization = await ctx.task(fidOptimizationTask, { projectName, outputDir });
  artifacts.push(...fidOptimization.artifacts);

  const clsOptimization = await ctx.task(clsOptimizationTask, { projectName, outputDir });
  artifacts.push(...clsOptimization.artifacts);

  const monitoringSetup = await ctx.task(monitoringSetupTask, { projectName, features, outputDir });
  artifacts.push(...monitoringSetup.artifacts);

  await ctx.breakpoint({ question: `Performance optimization complete for ${projectName}. ${auditTask.recommendations.length} optimizations identified. Approve?`, title: 'Performance Review', context: { runId: ctx.runId, metrics: auditTask.metrics } });

  const documentation = await ctx.task(documentationTask, { projectName, auditTask, outputDir });
  artifacts.push(...documentation.artifacts);

  return { success: true, projectName, optimizations: [...lcpOptimization.optimizations, ...fidOptimization.optimizations, ...clsOptimization.optimizations], metrics: auditTask.metrics, artifacts, duration: ctx.now() - startTime, metadata: { processId: 'specializations/web-development/web-performance-optimization', timestamp: startTime } };
}

export const performanceAuditTask = defineTask('performance-audit', (args, taskCtx) => ({ kind: 'agent', title: `Performance Audit - ${args.projectName}`, agent: { name: 'performance-auditor-agent', prompt: { role: 'Performance Auditor', task: 'Audit web performance', context: args, instructions: ['1. Run Lighthouse audit', '2. Analyze Core Web Vitals', '3. Check bundle size', '4. Analyze render path', '5. Check resource loading', '6. Analyze JavaScript execution', '7. Check network waterfall', '8. Analyze cache usage', '9. Identify bottlenecks', '10. Document findings'], outputFormat: 'JSON with audit results' }, outputSchema: { type: 'object', required: ['metrics', 'recommendations', 'artifacts'], properties: { metrics: { type: 'object' }, recommendations: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'performance', 'audit'] }));

export const lcpOptimizationTask = defineTask('lcp-optimization', (args, taskCtx) => ({ kind: 'agent', title: `LCP Optimization - ${args.projectName}`, agent: { name: 'lcp-specialist', prompt: { role: 'LCP Optimization Specialist', task: 'Optimize Largest Contentful Paint', context: args, instructions: ['1. Optimize critical path', '2. Preload LCP resource', '3. Optimize server response', '4. Use CDN effectively', '5. Optimize images', '6. Implement lazy loading', '7. Reduce render-blocking', '8. Optimize fonts', '9. Implement prefetch', '10. Document LCP fixes'], outputFormat: 'JSON with LCP optimizations' }, outputSchema: { type: 'object', required: ['optimizations', 'artifacts'], properties: { optimizations: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'performance', 'lcp'] }));

export const fidOptimizationTask = defineTask('fid-optimization', (args, taskCtx) => ({ kind: 'agent', title: `FID Optimization - ${args.projectName}`, agent: { name: 'fid-specialist', prompt: { role: 'FID Optimization Specialist', task: 'Optimize First Input Delay', context: args, instructions: ['1. Reduce JavaScript', '2. Break up long tasks', '3. Implement code splitting', '4. Use web workers', '5. Optimize event handlers', '6. Implement priority hints', '7. Defer non-critical JS', '8. Optimize third-party', '9. Use requestIdleCallback', '10. Document FID fixes'], outputFormat: 'JSON with FID optimizations' }, outputSchema: { type: 'object', required: ['optimizations', 'artifacts'], properties: { optimizations: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'performance', 'fid'] }));

export const clsOptimizationTask = defineTask('cls-optimization', (args, taskCtx) => ({ kind: 'agent', title: `CLS Optimization - ${args.projectName}`, agent: { name: 'cls-specialist', prompt: { role: 'CLS Optimization Specialist', task: 'Optimize Cumulative Layout Shift', context: args, instructions: ['1. Set image dimensions', '2. Reserve ad space', '3. Avoid inserting content', '4. Use transform animations', '5. Precompute heights', '6. Use content-visibility', '7. Handle fonts properly', '8. Optimize embeds', '9. Use skeleton screens', '10. Document CLS fixes'], outputFormat: 'JSON with CLS optimizations' }, outputSchema: { type: 'object', required: ['optimizations', 'artifacts'], properties: { optimizations: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'performance', 'cls'] }));

export const monitoringSetupTask = defineTask('performance-monitoring', (args, taskCtx) => ({ kind: 'agent', title: `Performance Monitoring - ${args.projectName}`, agent: { name: 'performance-monitoring-specialist', prompt: { role: 'Performance Monitoring Specialist', task: 'Set up performance monitoring', context: args, instructions: ['1. Set up web-vitals', '2. Configure RUM', '3. Set up synthetic monitoring', '4. Configure alerts', '5. Set up dashboards', '6. Configure budgets', '7. Set up CI integration', '8. Configure reporting', '9. Set up regression detection', '10. Document monitoring'], outputFormat: 'JSON with monitoring setup' }, outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'performance', 'monitoring'] }));

export const documentationTask = defineTask('performance-documentation', (args, taskCtx) => ({ kind: 'agent', title: `Documentation - ${args.projectName}`, agent: { name: 'technical-writer-agent', prompt: { role: 'Technical Writer', task: 'Generate performance documentation', context: args, instructions: ['1. Create README', '2. Document metrics', '3. Create optimization guide', '4. Document monitoring', '5. Create budget guide', '6. Document testing', '7. Create checklist', '8. Document tools', '9. Create troubleshooting', '10. Generate reports'], outputFormat: 'JSON with documentation' }, outputSchema: { type: 'object', required: ['docs', 'artifacts'], properties: { docs: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'performance', 'documentation'] }));
