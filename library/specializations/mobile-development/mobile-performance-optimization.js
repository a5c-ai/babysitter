/**
 * @process specializations/mobile-development/mobile-performance-optimization
 * @description Mobile App Performance Optimization - Comprehensive performance analysis and optimization
 * including startup time, memory usage, battery consumption, network efficiency, and UI responsiveness.
 * @inputs { appName: string, platforms: array, performanceTargets?: object, framework?: string }
 * @outputs { success: boolean, performanceReport: object, optimizations: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/mobile-development/mobile-performance-optimization', {
 *   appName: 'MyApp',
 *   platforms: ['ios', 'android'],
 *   performanceTargets: { startupTime: 2000, memoryLimit: 150, fps: 60 },
 *   framework: 'react-native'
 * });
 *
 * @references
 * - iOS Performance: https://developer.apple.com/documentation/xcode/improving-your-app-s-performance
 * - Android Performance: https://developer.android.com/topic/performance
 * - React Native Performance: https://reactnative.dev/docs/performance
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    appName,
    platforms = ['ios', 'android'],
    performanceTargets = { startupTime: 2000, memoryLimit: 150, fps: 60 },
    framework = 'native',
    outputDir = 'performance-optimization'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Performance Optimization: ${appName}`);
  ctx.log('info', `Targets: Startup ${performanceTargets.startupTime}ms, Memory ${performanceTargets.memoryLimit}MB, FPS ${performanceTargets.fps}`);

  const phases = [
    { name: 'baseline-profiling', title: 'Baseline Performance Profiling' },
    { name: 'startup-optimization', title: 'App Startup Optimization' },
    { name: 'memory-optimization', title: 'Memory Usage Optimization' },
    { name: 'cpu-optimization', title: 'CPU Usage Optimization' },
    { name: 'battery-optimization', title: 'Battery Consumption Optimization' },
    { name: 'network-optimization', title: 'Network Efficiency Optimization' },
    { name: 'ui-rendering', title: 'UI Rendering Optimization' },
    { name: 'image-optimization', title: 'Image and Asset Optimization' },
    { name: 'cache-strategy', title: 'Caching Strategy Implementation' },
    { name: 'lazy-loading', title: 'Lazy Loading Implementation' },
    { name: 'code-splitting', title: 'Code Splitting and Bundle Optimization' },
    { name: 'native-modules', title: 'Native Module Optimization' },
    { name: 'testing-validation', title: 'Performance Testing and Validation' },
    { name: 'monitoring-setup', title: 'Performance Monitoring Setup' }
  ];

  for (const phase of phases) {
    ctx.log('info', `Processing: ${phase.title}`);
    const result = await ctx.task(createPerformanceTask(phase.name, phase.title), {
      appName, platforms, performanceTargets, framework, outputDir
    });
    artifacts.push(...result.artifacts);
  }

  await ctx.breakpoint({
    question: `Performance optimization complete for ${appName}. Review optimization results?`,
    title: 'Performance Review',
    context: { runId: ctx.runId, appName, performanceTargets }
  });

  const endTime = ctx.now();
  return {
    success: true,
    appName,
    platforms,
    performanceTargets,
    performanceReport: { status: 'optimized', phases: phases.length },
    optimizations: phases.map(p => p.title),
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/mobile-development/mobile-performance-optimization', timestamp: startTime }
  };
}

function createPerformanceTask(name, title) {
  return (args, taskCtx) => ({
    kind: 'agent',
    title: `${title} - ${args.appName}`,
    skill: { name: 'mobile-perf' },
    agent: {
      name: 'cross-platform-architect',
      prompt: {
        role: 'Mobile Performance Engineer',
        task: `Execute ${title.toLowerCase()} for mobile app`,
        context: args,
        instructions: [
          `1. Profile current ${title.toLowerCase()} metrics`,
          `2. Identify optimization opportunities`,
          `3. Implement optimizations for ${args.platforms.join(' and ')}`,
          `4. Measure improvement against targets`,
          `5. Document optimizations and results`
        ],
        outputFormat: 'JSON with performance details'
      },
      outputSchema: {
        type: 'object',
        required: ['metrics', 'artifacts'],
        properties: { metrics: { type: 'object' }, optimizations: { type: 'array' }, artifacts: { type: 'array' } }
      }
    },
    io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
    labels: ['mobile', 'performance', name]
  });
}

export const baselineProfilingTask = createPerformanceTask('baseline-profiling', 'Baseline Performance Profiling');
export const startupOptimizationTask = createPerformanceTask('startup-optimization', 'App Startup Optimization');
export const memoryOptimizationTask = createPerformanceTask('memory-optimization', 'Memory Usage Optimization');
export const cpuOptimizationTask = createPerformanceTask('cpu-optimization', 'CPU Usage Optimization');
export const batteryOptimizationTask = createPerformanceTask('battery-optimization', 'Battery Consumption Optimization');
export const networkOptimizationTask = createPerformanceTask('network-optimization', 'Network Efficiency Optimization');
export const uiRenderingTask = createPerformanceTask('ui-rendering', 'UI Rendering Optimization');
export const imageOptimizationTask = createPerformanceTask('image-optimization', 'Image and Asset Optimization');
export const cacheStrategyTask = createPerformanceTask('cache-strategy', 'Caching Strategy Implementation');
export const lazyLoadingTask = createPerformanceTask('lazy-loading', 'Lazy Loading Implementation');
export const codeSplittingTask = createPerformanceTask('code-splitting', 'Code Splitting and Bundle Optimization');
export const nativeModulesTask = createPerformanceTask('native-modules', 'Native Module Optimization');
export const testingValidationTask = createPerformanceTask('testing-validation', 'Performance Testing and Validation');
export const monitoringSetupTask = createPerformanceTask('monitoring-setup', 'Performance Monitoring Setup');
