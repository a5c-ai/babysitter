/**
 * @process specializations/performance-optimization/stress-testing-analysis
 * @description Stress Testing and Breaking Point Analysis - Conduct stress tests to find system limits including
 * incremental load testing, breaking point identification, degradation pattern analysis, and recovery testing.
 * @inputs { projectName: string, targetApplication: string, maxLoad?: number }
 * @outputs { success: boolean, breakingPoint: object, degradationCurve: array, recoveryTime: number, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/performance-optimization/stress-testing-analysis', {
 *   projectName: 'Payment Gateway',
 *   targetApplication: 'payment-api',
 *   maxLoad: 10000
 * });
 *
 * @references
 * - Chaos Engineering: https://principlesofchaos.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    targetApplication,
    maxLoad = 5000,
    outputDir = 'stress-testing-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Stress Testing Analysis for ${projectName}`);

  // Phase 1: Design Stress Test Plan
  const testPlan = await ctx.task(designStressTestPlanTask, { projectName, targetApplication, maxLoad, outputDir });
  artifacts.push(...testPlan.artifacts);

  // Phase 2: Configure Monitoring for Extremes
  const monitoring = await ctx.task(configureExtremeMonitoringTask, { projectName, outputDir });
  artifacts.push(...monitoring.artifacts);

  // Phase 3: Run Incremental Load Tests
  const incrementalTests = await ctx.task(runIncrementalLoadTestsTask, { projectName, maxLoad, outputDir });
  artifacts.push(...incrementalTests.artifacts);

  await ctx.breakpoint({
    question: `Incremental tests complete. Max sustained: ${incrementalTests.maxSustainedLoad} users. Continue to breaking point?`,
    title: 'Incremental Load Testing',
    context: { runId: ctx.runId, incrementalTests }
  });

  // Phase 4: Identify System Breaking Point
  const breakingPoint = await ctx.task(identifyBreakingPointTask, { projectName, incrementalTests, outputDir });
  artifacts.push(...breakingPoint.artifacts);

  // Phase 5: Analyze Degradation Patterns
  const degradation = await ctx.task(analyzeDegradationPatternsTask, { projectName, incrementalTests, breakingPoint, outputDir });
  artifacts.push(...degradation.artifacts);

  // Phase 6: Test System Recovery
  const recovery = await ctx.task(testSystemRecoveryTask, { projectName, breakingPoint, outputDir });
  artifacts.push(...recovery.artifacts);

  // Phase 7: Document Resource Limits
  const resourceLimits = await ctx.task(documentResourceLimitsTask, { projectName, breakingPoint, degradation, outputDir });
  artifacts.push(...resourceLimits.artifacts);

  // Phase 8: Provide Capacity Recommendations
  const recommendations = await ctx.task(provideCapacityRecommendationsTask, { projectName, breakingPoint, degradation, resourceLimits, outputDir });
  artifacts.push(...recommendations.artifacts);

  await ctx.breakpoint({
    question: `Stress testing complete. Breaking point: ${breakingPoint.load} users. Recovery time: ${recovery.recoveryTime}s. Accept results?`,
    title: 'Stress Testing Results',
    context: { runId: ctx.runId, breakingPoint, recovery }
  });

  return {
    success: true,
    projectName,
    breakingPoint: breakingPoint.details,
    degradationCurve: degradation.curve,
    recoveryTime: recovery.recoveryTime,
    resourceLimits: resourceLimits.limits,
    recommendations: recommendations.recommendations,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/performance-optimization/stress-testing-analysis', timestamp: startTime, outputDir }
  };
}

export const designStressTestPlanTask = defineTask('design-stress-test-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design Stress Test Plan - ${args.projectName}`,
  agent: {
    name: 'gatling-load-testing',
    prompt: { role: 'Performance Engineer', task: 'Design stress test plan', context: args,
      instructions: ['1. Define load increments', '2. Set duration per level', '3. Define success criteria', '4. Plan monitoring', '5. Document plan'],
      outputFormat: 'JSON with stress test plan' },
    outputSchema: { type: 'object', required: ['plan', 'artifacts'], properties: { plan: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'stress-testing', 'planning']
}));

export const configureExtremeMonitoringTask = defineTask('configure-extreme-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure Extreme Monitoring - ${args.projectName}`,
  agent: {
    name: 'gatling-load-testing',
    prompt: { role: 'Performance Engineer', task: 'Configure monitoring for extreme conditions', context: args,
      instructions: ['1. Add detailed metrics', '2. Configure high frequency sampling', '3. Set up alerts', '4. Enable resource tracking', '5. Document configuration'],
      outputFormat: 'JSON with monitoring configuration' },
    outputSchema: { type: 'object', required: ['configured', 'artifacts'], properties: { configured: { type: 'boolean' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'stress-testing', 'monitoring']
}));

export const runIncrementalLoadTestsTask = defineTask('run-incremental-load-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Run Incremental Load Tests - ${args.projectName}`,
  agent: {
    name: 'gatling-load-testing',
    prompt: { role: 'Performance Engineer', task: 'Run incremental load tests', context: args,
      instructions: ['1. Start with low load', '2. Increment gradually', '3. Monitor at each level', '4. Record metrics', '5. Find degradation point'],
      outputFormat: 'JSON with incremental test results' },
    outputSchema: { type: 'object', required: ['maxSustainedLoad', 'results', 'artifacts'], properties: { maxSustainedLoad: { type: 'number' }, results: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'stress-testing', 'incremental']
}));

export const identifyBreakingPointTask = defineTask('identify-breaking-point', (args, taskCtx) => ({
  kind: 'agent',
  title: `Identify Breaking Point - ${args.projectName}`,
  agent: {
    name: 'gatling-load-testing',
    prompt: { role: 'Performance Engineer', task: 'Identify system breaking point', context: args,
      instructions: ['1. Push beyond sustainable', '2. Monitor for failures', '3. Identify failure mode', '4. Document breaking point', '5. Record symptoms'],
      outputFormat: 'JSON with breaking point analysis' },
    outputSchema: { type: 'object', required: ['load', 'details', 'artifacts'], properties: { load: { type: 'number' }, details: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'stress-testing', 'breaking-point']
}));

export const analyzeDegradationPatternsTask = defineTask('analyze-degradation-patterns', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze Degradation Patterns - ${args.projectName}`,
  agent: {
    name: 'gatling-load-testing',
    prompt: { role: 'Performance Engineer', task: 'Analyze degradation patterns', context: args,
      instructions: ['1. Plot degradation curve', '2. Identify inflection points', '3. Correlate with resources', '4. Document patterns', '5. Find root causes'],
      outputFormat: 'JSON with degradation analysis' },
    outputSchema: { type: 'object', required: ['curve', 'artifacts'], properties: { curve: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'stress-testing', 'degradation']
}));

export const testSystemRecoveryTask = defineTask('test-system-recovery', (args, taskCtx) => ({
  kind: 'agent',
  title: `Test System Recovery - ${args.projectName}`,
  agent: {
    name: 'gatling-load-testing',
    prompt: { role: 'Performance Engineer', task: 'Test system recovery', context: args,
      instructions: ['1. Remove load', '2. Monitor recovery', '3. Measure recovery time', '4. Verify full recovery', '5. Document recovery'],
      outputFormat: 'JSON with recovery test results' },
    outputSchema: { type: 'object', required: ['recoveryTime', 'artifacts'], properties: { recoveryTime: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'stress-testing', 'recovery']
}));

export const documentResourceLimitsTask = defineTask('document-resource-limits', (args, taskCtx) => ({
  kind: 'agent',
  title: `Document Resource Limits - ${args.projectName}`,
  agent: {
    name: 'gatling-load-testing',
    prompt: { role: 'Performance Engineer', task: 'Document resource limits', context: args,
      instructions: ['1. Document CPU limits', '2. Document memory limits', '3. Document I/O limits', '4. Document network limits', '5. Create limits report'],
      outputFormat: 'JSON with resource limits' },
    outputSchema: { type: 'object', required: ['limits', 'artifacts'], properties: { limits: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'stress-testing', 'resource-limits']
}));

export const provideCapacityRecommendationsTask = defineTask('provide-capacity-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: `Provide Capacity Recommendations - ${args.projectName}`,
  agent: {
    name: 'gatling-load-testing',
    prompt: { role: 'Performance Engineer', task: 'Provide capacity recommendations', context: args,
      instructions: ['1. Calculate headroom', '2. Recommend scaling', '3. Suggest optimizations', '4. Define alerting thresholds', '5. Document recommendations'],
      outputFormat: 'JSON with capacity recommendations' },
    outputSchema: { type: 'object', required: ['recommendations', 'artifacts'], properties: { recommendations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'stress-testing', 'recommendations']
}));
