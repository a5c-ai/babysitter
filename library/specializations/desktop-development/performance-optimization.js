/**
 * @process specializations/desktop-development/performance-optimization
 * @description Desktop Application Performance Optimization - Profile and optimize desktop app for memory usage,
 * startup time, UI responsiveness, and resource consumption; implement lazy loading and caching strategies.
 * @inputs { projectName: string, framework: string, performanceTargets: object, targetPlatforms: array, outputDir?: string }
 * @outputs { success: boolean, optimizations: array, metrics: object, recommendations: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/desktop-development/performance-optimization', {
 *   projectName: 'MyDesktopApp',
 *   framework: 'Electron',
 *   performanceTargets: { startupTime: 3000, memoryUsage: 200, frameRate: 60 },
 *   targetPlatforms: ['windows', 'macos', 'linux']
 * });
 *
 * @references
 * - Chrome DevTools Performance: https://developer.chrome.com/docs/devtools/performance/
 * - Electron Performance: https://www.electronjs.org/docs/latest/tutorial/performance
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    framework = 'Electron',
    performanceTargets = { startupTime: 3000, memoryUsage: 200, frameRate: 60 },
    targetPlatforms = ['windows', 'macos', 'linux'],
    outputDir = 'performance-optimization'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Performance Optimization: ${projectName}`);

  // Phase 1: Performance Baseline
  const baseline = await ctx.task(measureBaselineTask, { projectName, framework, performanceTargets, outputDir });
  artifacts.push(...baseline.artifacts);

  // Phase 2: Startup Time Optimization
  const startupOpt = await ctx.task(optimizeStartupTask, { projectName, framework, baseline, outputDir });
  artifacts.push(...startupOpt.artifacts);

  // Phase 3: Memory Optimization
  const memoryOpt = await ctx.task(optimizeMemoryTask, { projectName, framework, baseline, outputDir });
  artifacts.push(...memoryOpt.artifacts);

  // Phase 4: UI Responsiveness
  const uiOpt = await ctx.task(optimizeUiResponsivenessTask, { projectName, framework, baseline, outputDir });
  artifacts.push(...uiOpt.artifacts);

  await ctx.breakpoint({
    question: `Performance optimizations identified. Startup: ${startupOpt.improvement}%, Memory: ${memoryOpt.improvement}%, UI: ${uiOpt.improvement}%. Apply optimizations?`,
    title: 'Performance Optimization Review',
    context: { runId: ctx.runId, baseline: baseline.metrics, improvements: { startup: startupOpt.improvement, memory: memoryOpt.improvement, ui: uiOpt.improvement } }
  });

  // Phase 5: Bundle Optimization
  const bundleOpt = await ctx.task(optimizeBundleTask, { projectName, framework, outputDir });
  artifacts.push(...bundleOpt.artifacts);

  // Phase 6: Caching Strategy
  const cachingStrategy = await ctx.task(implementCachingTask, { projectName, framework, outputDir });
  artifacts.push(...cachingStrategy.artifacts);

  // Phase 7: Lazy Loading
  const lazyLoading = await ctx.task(implementLazyLoadingTask, { projectName, framework, outputDir });
  artifacts.push(...lazyLoading.artifacts);

  // Phase 8: Validation
  const validation = await ctx.task(validatePerformanceTask, { projectName, framework, performanceTargets, baseline, startupOpt, memoryOpt, uiOpt, outputDir });
  artifacts.push(...validation.artifacts);

  const validationPassed = validation.validationScore >= 80;

  await ctx.breakpoint({
    question: `Performance Optimization Complete! Score: ${validation.validationScore}/100. Targets met: ${validation.targetsMet}/${validation.totalTargets}. Approve?`,
    title: 'Performance Optimization Complete',
    context: { runId: ctx.runId, summary: { validationScore: validation.validationScore, targetsMet: validation.targetsMet } }
  });

  return {
    success: validationPassed,
    projectName,
    optimizations: [startupOpt.optimizations, memoryOpt.optimizations, uiOpt.optimizations, bundleOpt.optimizations].flat(),
    metrics: { baseline: baseline.metrics, optimized: validation.finalMetrics },
    caching: cachingStrategy.strategies,
    lazyLoading: lazyLoading.modules,
    validation: { score: validation.validationScore, passed: validationPassed },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/desktop-development/performance-optimization', timestamp: startTime }
  };
}

export const measureBaselineTask = defineTask('measure-baseline', (args, taskCtx) => ({
  kind: 'agent',
  title: `Measure Performance Baseline - ${args.projectName}`,
  agent: {
    name: 'performance-analyst',
    prompt: {
      role: 'Performance Analyst',
      task: 'Measure current performance baseline',
      context: args,
      instructions: ['1. Measure startup time', '2. Profile memory usage', '3. Measure frame rate', '4. Identify bottlenecks', '5. Profile CPU usage', '6. Measure bundle size', '7. Document baseline metrics', '8. Identify optimization areas']
    },
    outputSchema: { type: 'object', required: ['metrics', 'artifacts'], properties: { metrics: { type: 'object' }, bottlenecks: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'performance', 'baseline']
}));

export const optimizeStartupTask = defineTask('optimize-startup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Optimize Startup Time - ${args.projectName}`,
  agent: {
    name: 'startup-optimizer',
    prompt: {
      role: 'Startup Optimization Specialist',
      task: 'Optimize application startup time',
      context: args,
      instructions: ['1. Implement code splitting', '2. Defer non-critical initialization', '3. Optimize module loading', '4. Implement preloading strategies', '5. Reduce synchronous operations', '6. Optimize window creation', '7. Implement splash screen', '8. Measure improvement']
    },
    outputSchema: { type: 'object', required: ['optimizations', 'improvement', 'artifacts'], properties: { optimizations: { type: 'array' }, improvement: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'performance', 'startup']
}));

export const optimizeMemoryTask = defineTask('optimize-memory', (args, taskCtx) => ({
  kind: 'agent',
  title: `Optimize Memory Usage - ${args.projectName}`,
  agent: {
    name: 'memory-optimizer',
    prompt: {
      role: 'Memory Optimization Specialist',
      task: 'Optimize application memory usage',
      context: args,
      instructions: ['1. Identify memory leaks', '2. Implement proper cleanup', '3. Optimize data structures', '4. Implement object pooling', '5. Configure garbage collection hints', '6. Optimize image handling', '7. Implement memory limits', '8. Measure improvement']
    },
    outputSchema: { type: 'object', required: ['optimizations', 'improvement', 'artifacts'], properties: { optimizations: { type: 'array' }, improvement: { type: 'number' }, leaksFixed: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'performance', 'memory']
}));

export const optimizeUiResponsivenessTask = defineTask('optimize-ui-responsiveness', (args, taskCtx) => ({
  kind: 'agent',
  title: `Optimize UI Responsiveness - ${args.projectName}`,
  agent: {
    name: 'ui-performance-optimizer',
    prompt: {
      role: 'UI Performance Specialist',
      task: 'Optimize UI responsiveness and frame rate',
      context: args,
      instructions: ['1. Profile render performance', '2. Optimize heavy components', '3. Implement virtualization', '4. Use requestAnimationFrame', '5. Debounce expensive operations', '6. Optimize animations', '7. Reduce layout thrashing', '8. Measure frame rate improvement']
    },
    outputSchema: { type: 'object', required: ['optimizations', 'improvement', 'artifacts'], properties: { optimizations: { type: 'array' }, improvement: { type: 'number' }, frameRate: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'performance', 'ui']
}));

export const optimizeBundleTask = defineTask('optimize-bundle', (args, taskCtx) => ({
  kind: 'agent',
  title: `Optimize Bundle Size - ${args.projectName}`,
  agent: {
    name: 'bundle-optimizer',
    prompt: {
      role: 'Bundle Optimization Specialist',
      task: 'Optimize application bundle size',
      context: args,
      instructions: ['1. Analyze bundle composition', '2. Remove unused dependencies', '3. Implement tree shaking', '4. Optimize assets', '5. Configure code splitting', '6. Compress resources', '7. Externalize large dependencies', '8. Document size reduction']
    },
    outputSchema: { type: 'object', required: ['optimizations', 'sizeReduction', 'artifacts'], properties: { optimizations: { type: 'array' }, sizeReduction: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'performance', 'bundle']
}));

export const implementCachingTask = defineTask('implement-caching', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Caching Strategy - ${args.projectName}`,
  agent: {
    name: 'caching-specialist',
    prompt: {
      role: 'Caching Specialist',
      task: 'Implement caching strategies',
      context: args,
      instructions: ['1. Implement in-memory caching', '2. Configure disk caching', '3. Implement cache invalidation', '4. Add cache size limits', '5. Implement cache prewarming', '6. Configure HTTP caching', '7. Add cache metrics', '8. Document caching strategy']
    },
    outputSchema: { type: 'object', required: ['strategies', 'artifacts'], properties: { strategies: { type: 'array' }, cacheConfig: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'performance', 'caching']
}));

export const implementLazyLoadingTask = defineTask('implement-lazy-loading', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Lazy Loading - ${args.projectName}`,
  agent: {
    name: 'lazy-loading-specialist',
    prompt: {
      role: 'Lazy Loading Specialist',
      task: 'Implement lazy loading for modules and resources',
      context: args,
      instructions: ['1. Identify lazy-loadable modules', '2. Implement dynamic imports', '3. Add loading states', '4. Configure preloading hints', '5. Implement route-based splitting', '6. Lazy load heavy components', '7. Add loading indicators', '8. Document lazy loading strategy']
    },
    outputSchema: { type: 'object', required: ['modules', 'artifacts'], properties: { modules: { type: 'array' }, loadingStrategies: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'performance', 'lazy-loading']
}));

export const validatePerformanceTask = defineTask('validate-performance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validate Performance - ${args.projectName}`,
  agent: {
    name: 'performance-validator',
    prompt: {
      role: 'Performance Validator',
      task: 'Validate performance improvements',
      context: args,
      instructions: ['1. Measure final metrics', '2. Compare to baseline', '3. Check against targets', '4. Calculate improvement %', '5. Document optimizations applied', '6. Identify remaining issues', '7. Calculate validation score', '8. Generate recommendations']
    },
    outputSchema: { type: 'object', required: ['validationScore', 'targetsMet', 'totalTargets', 'finalMetrics', 'artifacts'], properties: { validationScore: { type: 'number' }, targetsMet: { type: 'number' }, totalTargets: { type: 'number' }, finalMetrics: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'performance', 'validation']
}));
