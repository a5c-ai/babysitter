/**
 * @process specializations/performance-optimization/performance-regression-detection
 * @description Performance Regression Detection - Implement automated performance regression detection including
 * baseline comparison, statistical analysis, alert configuration, and trend analysis.
 * @inputs { projectName: string, baselineData: object, regressionThreshold?: number }
 * @outputs { success: boolean, regressionDetection: object, alerts: array, trends: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/performance-optimization/performance-regression-detection', {
 *   projectName: 'Core API',
 *   baselineData: baselineMetrics,
 *   regressionThreshold: 10
 * });
 *
 * @references
 * - Performance Budgets: https://web.dev/performance-budgets-101/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    baselineData = {},
    regressionThreshold = 10,
    outputDir = 'regression-detection-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Performance Regression Detection for ${projectName}`);

  // Phase 1: Define Regression Criteria
  const criteria = await ctx.task(defineRegressionCriteriaTask, { projectName, regressionThreshold, outputDir });
  artifacts.push(...criteria.artifacts);

  // Phase 2: Implement Baseline Comparison
  const comparison = await ctx.task(implementBaselineComparisonTask, { projectName, baselineData, criteria, outputDir });
  artifacts.push(...comparison.artifacts);

  // Phase 3: Configure Statistical Analysis
  const statisticalConfig = await ctx.task(configureStatisticalAnalysisTask, { projectName, outputDir });
  artifacts.push(...statisticalConfig.artifacts);

  await ctx.breakpoint({
    question: `Regression detection configured. Threshold: ${regressionThreshold}%. Implement monitoring?`,
    title: 'Regression Detection Configuration',
    context: { runId: ctx.runId, criteria, comparison }
  });

  // Phase 4: Set Up Automated Monitoring
  const monitoring = await ctx.task(setupAutomatedMonitoringTask, { projectName, comparison, outputDir });
  artifacts.push(...monitoring.artifacts);

  // Phase 5: Configure Alerting
  const alerting = await ctx.task(configureRegressionAlertingTask, { projectName, regressionThreshold, outputDir });
  artifacts.push(...alerting.artifacts);

  // Phase 6: Implement Trend Analysis
  const trendAnalysis = await ctx.task(implementTrendAnalysisTask, { projectName, outputDir });
  artifacts.push(...trendAnalysis.artifacts);

  // Phase 7: Integrate with CI Pipeline
  const ciIntegration = await ctx.task(integrateCIRegressionChecksTask, { projectName, comparison, outputDir });
  artifacts.push(...ciIntegration.artifacts);

  // Phase 8: Document Detection Strategy
  const documentation = await ctx.task(documentRegressionDetectionTask, { projectName, criteria, comparison, alerting, outputDir });
  artifacts.push(...documentation.artifacts);

  await ctx.breakpoint({
    question: `Regression detection setup complete. ${alerting.alertRules.length} alert rules configured. CI integrated: ${ciIntegration.integrated}. Accept?`,
    title: 'Regression Detection Review',
    context: { runId: ctx.runId, alerting, ciIntegration }
  });

  return {
    success: true,
    projectName,
    regressionDetection: { criteria: criteria.criteria, threshold: regressionThreshold, comparison: comparison.method },
    alerts: alerting.alertRules,
    trends: trendAnalysis.metrics,
    ciIntegrated: ciIntegration.integrated,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/performance-optimization/performance-regression-detection', timestamp: startTime, outputDir }
  };
}

export const defineRegressionCriteriaTask = defineTask('define-regression-criteria', (args, taskCtx) => ({
  kind: 'agent',
  title: `Define Regression Criteria - ${args.projectName}`,
  agent: {
    name: 'benchmarking-expert',
    prompt: { role: 'Performance Engineer', task: 'Define regression criteria', context: args,
      instructions: ['1. Define latency thresholds', '2. Define throughput thresholds', '3. Define error rate thresholds', '4. Set significance levels', '5. Document criteria'],
      outputFormat: 'JSON with regression criteria' },
    outputSchema: { type: 'object', required: ['criteria', 'artifacts'], properties: { criteria: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'regression', 'criteria']
}));

export const implementBaselineComparisonTask = defineTask('implement-baseline-comparison', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Baseline Comparison - ${args.projectName}`,
  agent: {
    name: 'benchmarking-expert',
    prompt: { role: 'Performance Engineer', task: 'Implement baseline comparison', context: args,
      instructions: ['1. Load baseline data', '2. Compare current metrics', '3. Calculate differences', '4. Apply thresholds', '5. Document method'],
      outputFormat: 'JSON with comparison implementation' },
    outputSchema: { type: 'object', required: ['method', 'artifacts'], properties: { method: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'regression', 'comparison']
}));

export const configureStatisticalAnalysisTask = defineTask('configure-statistical-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure Statistical Analysis - ${args.projectName}`,
  agent: {
    name: 'benchmarking-expert',
    prompt: { role: 'Performance Engineer', task: 'Configure statistical analysis', context: args,
      instructions: ['1. Select statistical tests', '2. Configure confidence levels', '3. Handle variance', '4. Set sample requirements', '5. Document configuration'],
      outputFormat: 'JSON with statistical configuration' },
    outputSchema: { type: 'object', required: ['configuration', 'artifacts'], properties: { configuration: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'regression', 'statistics']
}));

export const setupAutomatedMonitoringTask = defineTask('setup-automated-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Automated Monitoring - ${args.projectName}`,
  agent: {
    name: 'benchmarking-expert',
    prompt: { role: 'Performance Engineer', task: 'Setup automated regression monitoring', context: args,
      instructions: ['1. Configure metric collection', '2. Set up scheduled comparisons', '3. Configure dashboards', '4. Enable historical tracking', '5. Document setup'],
      outputFormat: 'JSON with monitoring setup' },
    outputSchema: { type: 'object', required: ['monitoring', 'artifacts'], properties: { monitoring: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'regression', 'monitoring']
}));

export const configureRegressionAlertingTask = defineTask('configure-regression-alerting', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure Alerting - ${args.projectName}`,
  agent: {
    name: 'benchmarking-expert',
    prompt: { role: 'Performance Engineer', task: 'Configure regression alerting', context: args,
      instructions: ['1. Create alert rules', '2. Set severity levels', '3. Configure notifications', '4. Add context to alerts', '5. Document alerting'],
      outputFormat: 'JSON with alerting configuration' },
    outputSchema: { type: 'object', required: ['alertRules', 'artifacts'], properties: { alertRules: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'regression', 'alerting']
}));

export const implementTrendAnalysisTask = defineTask('implement-trend-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Trend Analysis - ${args.projectName}`,
  agent: {
    name: 'benchmarking-expert',
    prompt: { role: 'Performance Engineer', task: 'Implement trend analysis', context: args,
      instructions: ['1. Track metrics over time', '2. Detect gradual degradation', '3. Identify trends', '4. Create visualizations', '5. Document analysis'],
      outputFormat: 'JSON with trend analysis' },
    outputSchema: { type: 'object', required: ['metrics', 'artifacts'], properties: { metrics: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'regression', 'trends']
}));

export const integrateCIRegressionChecksTask = defineTask('integrate-ci-regression-checks', (args, taskCtx) => ({
  kind: 'agent',
  title: `Integrate CI Regression Checks - ${args.projectName}`,
  agent: {
    name: 'benchmarking-expert',
    prompt: { role: 'Performance Engineer', task: 'Integrate regression checks with CI', context: args,
      instructions: ['1. Add CI stage', '2. Run regression checks', '3. Fail on regression', '4. Report results', '5. Document integration'],
      outputFormat: 'JSON with CI integration' },
    outputSchema: { type: 'object', required: ['integrated', 'artifacts'], properties: { integrated: { type: 'boolean' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'regression', 'ci']
}));

export const documentRegressionDetectionTask = defineTask('document-regression-detection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Document Regression Detection - ${args.projectName}`,
  agent: {
    name: 'benchmarking-expert',
    prompt: { role: 'Performance Engineer', task: 'Document regression detection strategy', context: args,
      instructions: ['1. Document criteria', '2. Document methodology', '3. Add response procedures', '4. Include examples', '5. Generate report'],
      outputFormat: 'JSON with documentation' },
    outputSchema: { type: 'object', required: ['documentation', 'artifacts'], properties: { documentation: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'regression', 'documentation']
}));
