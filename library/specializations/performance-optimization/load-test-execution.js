/**
 * @process specializations/performance-optimization/load-test-execution
 * @description Load Test Execution and Analysis - Execute load tests and analyze results including baseline
 * establishment, scenario execution, result analysis, bottleneck identification, and report generation.
 * @inputs { projectName: string, testScripts: array, loadProfile: string, duration?: number }
 * @outputs { success: boolean, testResults: object, bottlenecks: array, recommendations: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/performance-optimization/load-test-execution', {
 *   projectName: 'E-commerce API',
 *   testScripts: ['checkout-flow', 'search-flow'],
 *   loadProfile: 'peak-load',
 *   duration: 3600
 * });
 *
 * @references
 * - k6 Cloud: https://k6.io/cloud/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    testScripts = [],
    loadProfile = 'normal',
    duration = 1800,
    outputDir = 'load-test-results'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Load Test Execution for ${projectName}`);

  // Phase 1: Prepare Test Environment
  const envPrep = await ctx.task(prepareTestEnvironmentTask, { projectName, testScripts, outputDir });
  artifacts.push(...envPrep.artifacts);

  // Phase 2: Run Baseline Tests
  const baseline = await ctx.task(runBaselineTestsTask, { projectName, testScripts, outputDir });
  artifacts.push(...baseline.artifacts);

  // Phase 3: Execute Load Scenarios
  const loadExecution = await ctx.task(executeLoadScenariosTask, { projectName, testScripts, loadProfile, duration, outputDir });
  artifacts.push(...loadExecution.artifacts);

  await ctx.breakpoint({
    question: `Load test completed. Avg response: ${loadExecution.avgResponseTime}ms. Error rate: ${loadExecution.errorRate}%. Analyze results?`,
    title: 'Load Test Execution Complete',
    context: { runId: ctx.runId, loadExecution }
  });

  // Phase 4: Collect Performance Metrics
  const metrics = await ctx.task(collectPerformanceMetricsTask, { projectName, loadExecution, outputDir });
  artifacts.push(...metrics.artifacts);

  // Phase 5: Analyze Response Time Distribution
  const responseAnalysis = await ctx.task(analyzeResponseTimeDistributionTask, { projectName, metrics, outputDir });
  artifacts.push(...responseAnalysis.artifacts);

  // Phase 6: Identify Bottlenecks
  const bottlenecks = await ctx.task(identifyLoadTestBottlenecksTask, { projectName, metrics, responseAnalysis, outputDir });
  artifacts.push(...bottlenecks.artifacts);

  // Phase 7: Compare with Baseline
  const comparison = await ctx.task(compareWithBaselineTask, { projectName, baseline, loadExecution, outputDir });
  artifacts.push(...comparison.artifacts);

  // Phase 8: Generate Test Report
  const report = await ctx.task(generateLoadTestReportTask, { projectName, baseline, loadExecution, metrics, bottlenecks, comparison, outputDir });
  artifacts.push(...report.artifacts);

  await ctx.breakpoint({
    question: `Analysis complete. Found ${bottlenecks.bottlenecks.length} bottlenecks. Review report?`,
    title: 'Load Test Analysis',
    context: { runId: ctx.runId, bottlenecks, report }
  });

  return {
    success: true,
    projectName,
    testResults: { avgResponseTime: loadExecution.avgResponseTime, errorRate: loadExecution.errorRate, throughput: loadExecution.throughput, p95: metrics.p95, p99: metrics.p99 },
    bottlenecks: bottlenecks.bottlenecks,
    recommendations: bottlenecks.recommendations,
    reportPath: report.reportPath,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/performance-optimization/load-test-execution', timestamp: startTime, outputDir }
  };
}

export const prepareTestEnvironmentTask = defineTask('prepare-test-environment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Prepare Test Environment - ${args.projectName}`,
  agent: {
    name: 'gatling-load-testing',
    prompt: { role: 'Performance Engineer', task: 'Prepare load test environment', context: args,
      instructions: ['1. Validate test scripts', '2. Check test data', '3. Verify connectivity', '4. Configure monitoring', '5. Document setup'],
      outputFormat: 'JSON with environment preparation' },
    outputSchema: { type: 'object', required: ['ready', 'artifacts'], properties: { ready: { type: 'boolean' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'load-test', 'preparation']
}));

export const runBaselineTestsTask = defineTask('run-baseline-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Run Baseline Tests - ${args.projectName}`,
  agent: {
    name: 'gatling-load-testing',
    prompt: { role: 'Performance Engineer', task: 'Run baseline performance tests', context: args,
      instructions: ['1. Run single user tests', '2. Capture baseline metrics', '3. Verify functionality', '4. Document baseline', '5. Save results'],
      outputFormat: 'JSON with baseline results' },
    outputSchema: { type: 'object', required: ['baselineMetrics', 'artifacts'], properties: { baselineMetrics: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'load-test', 'baseline']
}));

export const executeLoadScenariosTask = defineTask('execute-load-scenarios', (args, taskCtx) => ({
  kind: 'agent',
  title: `Execute Load Scenarios - ${args.projectName}`,
  agent: {
    name: 'gatling-load-testing',
    prompt: { role: 'Performance Engineer', task: 'Execute load test scenarios', context: args,
      instructions: ['1. Start load generators', '2. Ramp up load', '3. Execute scenarios', '4. Monitor execution', '5. Collect results'],
      outputFormat: 'JSON with load test results' },
    outputSchema: { type: 'object', required: ['avgResponseTime', 'errorRate', 'throughput', 'artifacts'], properties: { avgResponseTime: { type: 'number' }, errorRate: { type: 'number' }, throughput: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'load-test', 'execution']
}));

export const collectPerformanceMetricsTask = defineTask('collect-performance-metrics', (args, taskCtx) => ({
  kind: 'agent',
  title: `Collect Performance Metrics - ${args.projectName}`,
  agent: {
    name: 'gatling-load-testing',
    prompt: { role: 'Performance Engineer', task: 'Collect performance metrics', context: args,
      instructions: ['1. Gather response times', '2. Calculate percentiles', '3. Collect throughput', '4. Gather error data', '5. Export metrics'],
      outputFormat: 'JSON with performance metrics' },
    outputSchema: { type: 'object', required: ['p95', 'p99', 'artifacts'], properties: { p95: { type: 'number' }, p99: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'load-test', 'metrics']
}));

export const analyzeResponseTimeDistributionTask = defineTask('analyze-response-time-distribution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze Response Time Distribution - ${args.projectName}`,
  agent: {
    name: 'gatling-load-testing',
    prompt: { role: 'Performance Engineer', task: 'Analyze response time distribution', context: args,
      instructions: ['1. Build histogram', '2. Identify outliers', '3. Analyze patterns', '4. Find anomalies', '5. Document distribution'],
      outputFormat: 'JSON with response time analysis' },
    outputSchema: { type: 'object', required: ['distribution', 'artifacts'], properties: { distribution: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'load-test', 'response-time']
}));

export const identifyLoadTestBottlenecksTask = defineTask('identify-load-test-bottlenecks', (args, taskCtx) => ({
  kind: 'agent',
  title: `Identify Bottlenecks - ${args.projectName}`,
  agent: {
    name: 'gatling-load-testing',
    prompt: { role: 'Performance Engineer', task: 'Identify performance bottlenecks', context: args,
      instructions: ['1. Analyze slow endpoints', '2. Correlate with resources', '3. Find saturation points', '4. Identify root causes', '5. Document bottlenecks'],
      outputFormat: 'JSON with bottleneck analysis' },
    outputSchema: { type: 'object', required: ['bottlenecks', 'recommendations', 'artifacts'], properties: { bottlenecks: { type: 'array' }, recommendations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'load-test', 'bottlenecks']
}));

export const compareWithBaselineTask = defineTask('compare-with-baseline', (args, taskCtx) => ({
  kind: 'agent',
  title: `Compare with Baseline - ${args.projectName}`,
  agent: {
    name: 'gatling-load-testing',
    prompt: { role: 'Performance Engineer', task: 'Compare results with baseline', context: args,
      instructions: ['1. Compare response times', '2. Compare throughput', '3. Compare errors', '4. Calculate degradation', '5. Document comparison'],
      outputFormat: 'JSON with comparison' },
    outputSchema: { type: 'object', required: ['comparison', 'artifacts'], properties: { comparison: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'load-test', 'comparison']
}));

export const generateLoadTestReportTask = defineTask('generate-load-test-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Load Test Report - ${args.projectName}`,
  agent: {
    name: 'gatling-load-testing',
    prompt: { role: 'Performance Engineer', task: 'Generate load test report', context: args,
      instructions: ['1. Compile results', '2. Add visualizations', '3. Include analysis', '4. Add recommendations', '5. Generate report'],
      outputFormat: 'JSON with report details' },
    outputSchema: { type: 'object', required: ['reportPath', 'artifacts'], properties: { reportPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'load-test', 'report']
}));
