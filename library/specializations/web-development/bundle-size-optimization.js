/**
 * @process specializations/web-development/bundle-size-optimization
 * @description Bundle Size Optimization - Process for analyzing and reducing JavaScript bundle sizes through code splitting, tree shaking, and dependency optimization.
 * @inputs { projectName: string, bundler?: string }
 * @outputs { success: boolean, analysis: object, optimizations: array, artifacts: array }
 * @references
 * - Webpack Bundle Analyzer: https://github.com/webpack-contrib/webpack-bundle-analyzer
 * - Vite Optimization: https://vitejs.dev/guide/build.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, bundler = 'vite', outputDir = 'bundle-size-optimization' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Bundle Size Optimization: ${projectName}`);

  const analysisTask = await ctx.task(bundleAnalysisTask, { projectName, bundler, outputDir });
  artifacts.push(...analysisTask.artifacts);

  const codeSplittingTask = await ctx.task(codeSplittingSetupTask, { projectName, bundler, outputDir });
  artifacts.push(...codeSplittingTask.artifacts);

  const treeshakingTask = await ctx.task(treeshakingSetupTask, { projectName, outputDir });
  artifacts.push(...treeshakingTask.artifacts);

  const dependencyTask = await ctx.task(dependencyOptimizationTask, { projectName, analysisTask, outputDir });
  artifacts.push(...dependencyTask.artifacts);

  await ctx.breakpoint({ question: `Bundle optimization complete for ${projectName}. Estimated ${analysisTask.potentialSavings} reduction. Approve?`, title: 'Bundle Optimization Review', context: { runId: ctx.runId, analysis: analysisTask.analysis } });

  const documentation = await ctx.task(documentationTask, { projectName, analysisTask, outputDir });
  artifacts.push(...documentation.artifacts);

  return { success: true, projectName, analysis: analysisTask.analysis, optimizations: [...codeSplittingTask.optimizations, ...treeshakingTask.optimizations, ...dependencyTask.optimizations], artifacts, duration: ctx.now() - startTime, metadata: { processId: 'specializations/web-development/bundle-size-optimization', timestamp: startTime } };
}

export const bundleAnalysisTask = defineTask('bundle-analysis', (args, taskCtx) => ({ kind: 'agent', title: `Bundle Analysis - ${args.projectName}`, agent: { name: 'bundle-analyst', prompt: { role: 'Bundle Analyst', task: 'Analyze bundle composition', context: args, instructions: ['1. Set up bundle analyzer', '2. Analyze entry points', '3. Identify large modules', '4. Check duplicate packages', '5. Analyze code splitting', '6. Check tree shaking', '7. Identify unused exports', '8. Analyze async chunks', '9. Calculate savings potential', '10. Document findings'], outputFormat: 'JSON with analysis' }, outputSchema: { type: 'object', required: ['analysis', 'potentialSavings', 'artifacts'], properties: { analysis: { type: 'object' }, potentialSavings: { type: 'string' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'performance', 'bundle-analysis'] }));

export const codeSplittingSetupTask = defineTask('code-splitting', (args, taskCtx) => ({ kind: 'agent', title: `Code Splitting - ${args.projectName}`, agent: { name: 'code-splitting-specialist', prompt: { role: 'Code Splitting Specialist', task: 'Implement code splitting', context: args, instructions: ['1. Configure route splitting', '2. Set up component lazy loading', '3. Configure vendor splitting', '4. Set up common chunks', '5. Configure dynamic imports', '6. Set up preloading', '7. Configure prefetching', '8. Set up loading states', '9. Configure chunk naming', '10. Document splitting'], outputFormat: 'JSON with code splitting' }, outputSchema: { type: 'object', required: ['optimizations', 'artifacts'], properties: { optimizations: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'performance', 'code-splitting'] }));

export const treeshakingSetupTask = defineTask('tree-shaking', (args, taskCtx) => ({ kind: 'agent', title: `Tree Shaking - ${args.projectName}`, agent: { name: 'tree-shaking-specialist', prompt: { role: 'Tree Shaking Specialist', task: 'Optimize tree shaking', context: args, instructions: ['1. Check sideEffects config', '2. Use named exports', '3. Avoid barrel files', '4. Configure dead code elimination', '5. Check module resolution', '6. Optimize imports', '7. Configure pure annotations', '8. Check production mode', '9. Analyze unused code', '10. Document tree shaking'], outputFormat: 'JSON with tree shaking' }, outputSchema: { type: 'object', required: ['optimizations', 'artifacts'], properties: { optimizations: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'performance', 'tree-shaking'] }));

export const dependencyOptimizationTask = defineTask('dependency-optimization', (args, taskCtx) => ({ kind: 'agent', title: `Dependency Optimization - ${args.projectName}`, agent: { name: 'dependency-optimizer', prompt: { role: 'Dependency Optimization Specialist', task: 'Optimize dependencies', context: args, instructions: ['1. Audit large dependencies', '2. Find smaller alternatives', '3. Remove unused packages', '4. Update to ESM versions', '5. Configure aliasing', '6. Use native APIs', '7. Configure externals', '8. Optimize polyfills', '9. Check for duplicates', '10. Document changes'], outputFormat: 'JSON with dependency optimization' }, outputSchema: { type: 'object', required: ['optimizations', 'artifacts'], properties: { optimizations: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'performance', 'dependencies'] }));

export const documentationTask = defineTask('bundle-documentation', (args, taskCtx) => ({ kind: 'agent', title: `Documentation - ${args.projectName}`, agent: { name: 'technical-writer-agent', prompt: { role: 'Technical Writer', task: 'Generate bundle documentation', context: args, instructions: ['1. Create README', '2. Document analysis', '3. Create optimization guide', '4. Document code splitting', '5. Create budget guide', '6. Document monitoring', '7. Create checklist', '8. Document tools', '9. Create troubleshooting', '10. Generate reports'], outputFormat: 'JSON with documentation' }, outputSchema: { type: 'object', required: ['docs', 'artifacts'], properties: { docs: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'performance', 'documentation'] }));
