/**
 * @process specializations/performance-optimization/garbage-collection-tuning
 * @description Garbage Collection Tuning - Optimize garbage collection configuration for application workload
 * including GC behavior analysis, heap size tuning, GC algorithm selection, and pause time optimization.
 * @inputs { projectName: string, targetApplication: string, runtime?: string, targetPauseTime?: number }
 * @outputs { success: boolean, gcConfiguration: object, improvementMetrics: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/performance-optimization/garbage-collection-tuning', {
 *   projectName: 'Trading Platform',
 *   targetApplication: 'order-matching-engine',
 *   runtime: 'jvm',
 *   targetPauseTime: 10
 * });
 *
 * @references
 * - Oracle GC Tuning Guide: https://docs.oracle.com/en/java/javase/17/gctuning/
 * - GCEasy: https://gceasy.io/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    targetApplication,
    runtime = 'jvm',
    targetPauseTime = 100,
    outputDir = 'gc-tuning-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Garbage Collection Tuning for ${projectName}`);

  // Phase 1: Analyze Current GC Behavior
  const gcAnalysis = await ctx.task(analyzeCurrentGCBehaviorTask, { projectName, targetApplication, runtime, outputDir });
  artifacts.push(...gcAnalysis.artifacts);

  // Phase 2: Collect GC Logs and Metrics
  const gcLogs = await ctx.task(collectGCLogsTask, { projectName, targetApplication, outputDir });
  artifacts.push(...gcLogs.artifacts);

  await ctx.breakpoint({
    question: `Collected GC logs. Average pause: ${gcLogs.averagePause}ms. Analyze GC issues?`,
    title: 'GC Log Collection',
    context: { runId: ctx.runId, gcLogs }
  });

  // Phase 3: Identify GC Pause Issues
  const pauseIssues = await ctx.task(identifyGCPauseIssuesTask, { projectName, gcLogs, targetPauseTime, outputDir });
  artifacts.push(...pauseIssues.artifacts);

  // Phase 4: Evaluate GC Algorithm Options
  const algorithmEvaluation = await ctx.task(evaluateGCAlgorithmsTask, { projectName, runtime, gcLogs, pauseIssues, outputDir });
  artifacts.push(...algorithmEvaluation.artifacts);

  // Phase 5: Tune Heap Size Parameters
  const heapTuning = await ctx.task(tuneHeapSizeTask, { projectName, gcLogs, outputDir });
  artifacts.push(...heapTuning.artifacts);

  // Phase 6: Configure GC-Specific Settings
  const gcConfig = await ctx.task(configureGCSettingsTask, { projectName, algorithmEvaluation, heapTuning, targetPauseTime, outputDir });
  artifacts.push(...gcConfig.artifacts);

  await ctx.breakpoint({
    question: `GC configuration prepared. Algorithm: ${gcConfig.algorithm}. Apply and test?`,
    title: 'GC Configuration Review',
    context: { runId: ctx.runId, gcConfig }
  });

  // Phase 7: Test Under Production-Like Load
  const loadTest = await ctx.task(testGCUnderLoadTask, { projectName, gcConfig, outputDir });
  artifacts.push(...loadTest.artifacts);

  // Phase 8: Monitor GC Metrics Post-Tuning
  const monitoring = await ctx.task(monitorGCMetricsTask, { projectName, gcConfig, loadTest, outputDir });
  artifacts.push(...monitoring.artifacts);

  // Phase 9: Document Configuration Changes
  const documentation = await ctx.task(documentGCConfigurationTask, { projectName, gcConfig, monitoring, outputDir });
  artifacts.push(...documentation.artifacts);

  await ctx.breakpoint({
    question: `GC tuning complete. Pause reduction: ${monitoring.pauseReduction}%. Accept configuration?`,
    title: 'GC Tuning Results',
    context: { runId: ctx.runId, monitoring }
  });

  return {
    success: true,
    projectName,
    gcConfiguration: gcConfig.configuration,
    improvementMetrics: monitoring.metrics,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/performance-optimization/garbage-collection-tuning', timestamp: startTime, outputDir }
  };
}

export const analyzeCurrentGCBehaviorTask = defineTask('analyze-current-gc-behavior', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze Current GC Behavior - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Analyze current GC behavior', context: args,
      instructions: ['1. Enable GC logging', '2. Analyze GC frequency', '3. Analyze pause times', '4. Identify GC types', '5. Document current behavior'],
      outputFormat: 'JSON with GC analysis' },
    outputSchema: { type: 'object', required: ['analysis', 'artifacts'], properties: { analysis: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'gc-tuning', 'analysis']
}));

export const collectGCLogsTask = defineTask('collect-gc-logs', (args, taskCtx) => ({
  kind: 'agent',
  title: `Collect GC Logs - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Collect GC logs and metrics', context: args,
      instructions: ['1. Configure GC logging', '2. Collect logs over time', '3. Parse GC events', '4. Calculate statistics', '5. Export log data'],
      outputFormat: 'JSON with GC logs' },
    outputSchema: { type: 'object', required: ['averagePause', 'artifacts'], properties: { averagePause: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'gc-tuning', 'logs']
}));

export const identifyGCPauseIssuesTask = defineTask('identify-gc-pause-issues', (args, taskCtx) => ({
  kind: 'agent',
  title: `Identify GC Pause Issues - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Identify GC pause issues', context: args,
      instructions: ['1. Identify long pauses', '2. Analyze pause causes', '3. Find stop-the-world events', '4. Correlate with allocation', '5. Document issues'],
      outputFormat: 'JSON with pause issues' },
    outputSchema: { type: 'object', required: ['issues', 'artifacts'], properties: { issues: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'gc-tuning', 'pause-issues']
}));

export const evaluateGCAlgorithmsTask = defineTask('evaluate-gc-algorithms', (args, taskCtx) => ({
  kind: 'agent',
  title: `Evaluate GC Algorithms - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Evaluate GC algorithm options', context: args,
      instructions: ['1. Review available GC algorithms', '2. Compare throughput vs latency', '3. Evaluate for workload', '4. Recommend algorithm', '5. Document evaluation'],
      outputFormat: 'JSON with algorithm evaluation' },
    outputSchema: { type: 'object', required: ['recommendation', 'artifacts'], properties: { recommendation: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'gc-tuning', 'algorithms']
}));

export const tuneHeapSizeTask = defineTask('tune-heap-size', (args, taskCtx) => ({
  kind: 'agent',
  title: `Tune Heap Size - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Tune heap size parameters', context: args,
      instructions: ['1. Analyze memory usage', '2. Set initial heap size', '3. Set maximum heap size', '4. Configure generations', '5. Document heap settings'],
      outputFormat: 'JSON with heap tuning' },
    outputSchema: { type: 'object', required: ['heapSettings', 'artifacts'], properties: { heapSettings: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'gc-tuning', 'heap']
}));

export const configureGCSettingsTask = defineTask('configure-gc-settings', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure GC Settings - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Configure GC-specific settings', context: args,
      instructions: ['1. Select GC algorithm', '2. Configure pause time goals', '3. Set GC threads', '4. Configure concurrent phases', '5. Document configuration'],
      outputFormat: 'JSON with GC configuration' },
    outputSchema: { type: 'object', required: ['algorithm', 'configuration', 'artifacts'], properties: { algorithm: { type: 'string' }, configuration: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'gc-tuning', 'configuration']
}));

export const testGCUnderLoadTask = defineTask('test-gc-under-load', (args, taskCtx) => ({
  kind: 'agent',
  title: `Test GC Under Load - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Test GC under production-like load', context: args,
      instructions: ['1. Apply new GC configuration', '2. Run load test', '3. Collect GC metrics', '4. Compare with baseline', '5. Document results'],
      outputFormat: 'JSON with load test results' },
    outputSchema: { type: 'object', required: ['results', 'artifacts'], properties: { results: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'gc-tuning', 'load-test']
}));

export const monitorGCMetricsTask = defineTask('monitor-gc-metrics', (args, taskCtx) => ({
  kind: 'agent',
  title: `Monitor GC Metrics - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Monitor GC metrics post-tuning', context: args,
      instructions: ['1. Monitor pause times', '2. Monitor throughput', '3. Calculate improvement', '4. Identify issues', '5. Document metrics'],
      outputFormat: 'JSON with monitoring results' },
    outputSchema: { type: 'object', required: ['pauseReduction', 'metrics', 'artifacts'], properties: { pauseReduction: { type: 'number' }, metrics: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'gc-tuning', 'monitoring']
}));

export const documentGCConfigurationTask = defineTask('document-gc-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Document GC Configuration - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Document GC configuration changes', context: args,
      instructions: ['1. Document new settings', '2. Explain rationale', '3. Include benchmarks', '4. Create runbook', '5. Generate report'],
      outputFormat: 'JSON with documentation' },
    outputSchema: { type: 'object', required: ['documentation', 'artifacts'], properties: { documentation: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'gc-tuning', 'documentation']
}));
