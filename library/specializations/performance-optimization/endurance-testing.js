/**
 * @process specializations/performance-optimization/endurance-testing
 * @description Endurance Testing - Execute long-running tests to detect performance degradation over time including
 * sustained load scenarios, memory leak detection, resource trend analysis, and degradation identification.
 * @inputs { projectName: string, testDuration: string, loadProfile: object }
 * @outputs { success: boolean, testResults: object, degradationReport: object, recommendations: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/performance-optimization/endurance-testing', {
 *   projectName: 'Payment Gateway',
 *   testDuration: '8h',
 *   loadProfile: { targetRPS: 500, rampUpMinutes: 10 }
 * });
 *
 * @references
 * - JMeter: https://jmeter.apache.org/
 * - Gatling Endurance Testing: https://gatling.io/docs/gatling/reference/current/http/check/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    testDuration = '4h',
    loadProfile = {},
    outputDir = 'endurance-testing-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Endurance Testing for ${projectName}`);

  // Phase 1: Define Endurance Test Objectives
  const objectives = await ctx.task(defineEnduranceObjectivesTask, { projectName, testDuration, outputDir });
  artifacts.push(...objectives.artifacts);

  // Phase 2: Design Sustained Load Scenario
  const loadScenario = await ctx.task(designSustainedLoadScenarioTask, { projectName, loadProfile, testDuration, outputDir });
  artifacts.push(...loadScenario.artifacts);

  // Phase 3: Configure Extended Monitoring
  const monitoring = await ctx.task(configureExtendedMonitoringTask, { projectName, testDuration, outputDir });
  artifacts.push(...monitoring.artifacts);

  await ctx.breakpoint({
    question: `Endurance test configured for ${testDuration}. Sustained load: ${loadScenario.targetLoad} RPS. Begin execution?`,
    title: 'Endurance Test Configuration',
    context: { runId: ctx.runId, objectives, loadScenario, monitoring }
  });

  // Phase 4: Execute Endurance Test
  const testExecution = await ctx.task(executeEnduranceTestTask, { projectName, loadScenario, testDuration, outputDir });
  artifacts.push(...testExecution.artifacts);

  // Phase 5: Monitor for Memory Leaks
  const memoryAnalysis = await ctx.task(monitorForMemoryLeaksTask, { projectName, testExecution, outputDir });
  artifacts.push(...memoryAnalysis.artifacts);

  // Phase 6: Detect Performance Degradation
  const degradationAnalysis = await ctx.task(detectPerformanceDegradationTask, { projectName, testExecution, outputDir });
  artifacts.push(...degradationAnalysis.artifacts);

  // Phase 7: Analyze Resource Trends
  const resourceTrends = await ctx.task(analyzeResourceTrendsTask, { projectName, testExecution, outputDir });
  artifacts.push(...resourceTrends.artifacts);

  // Phase 8: Generate Findings Report
  const findings = await ctx.task(generateEnduranceFindingsTask, { projectName, memoryAnalysis, degradationAnalysis, resourceTrends, outputDir });
  artifacts.push(...findings.artifacts);

  // Phase 9: Document Recommendations
  const documentation = await ctx.task(documentEnduranceRecommendationsTask, { projectName, findings, outputDir });
  artifacts.push(...documentation.artifacts);

  await ctx.breakpoint({
    question: `Endurance test complete. Duration: ${testDuration}. Memory issues: ${memoryAnalysis.issuesFound}. Degradation detected: ${degradationAnalysis.degradationDetected}. Accept findings?`,
    title: 'Endurance Test Results',
    context: { runId: ctx.runId, findings, memoryAnalysis, degradationAnalysis }
  });

  return {
    success: true,
    projectName,
    testResults: { duration: testDuration, executionData: testExecution.results },
    degradationReport: degradationAnalysis.report,
    memoryAnalysis: memoryAnalysis.analysis,
    resourceTrends: resourceTrends.trends,
    recommendations: findings.recommendations,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/performance-optimization/endurance-testing', timestamp: startTime, outputDir }
  };
}

export const defineEnduranceObjectivesTask = defineTask('define-endurance-objectives', (args, taskCtx) => ({
  kind: 'agent',
  title: `Define Endurance Test Objectives - ${args.projectName}`,
  agent: {
    name: 'gatling-load-testing',
    prompt: { role: 'Performance Engineer', task: 'Define endurance test objectives', context: args,
      instructions: ['1. Define stability objectives', '2. Define degradation thresholds', '3. Define memory limits', '4. Define resource boundaries', '5. Document objectives'],
      outputFormat: 'JSON with endurance test objectives' },
    outputSchema: { type: 'object', required: ['objectives', 'artifacts'], properties: { objectives: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'endurance-testing', 'objectives']
}));

export const designSustainedLoadScenarioTask = defineTask('design-sustained-load-scenario', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design Sustained Load Scenario - ${args.projectName}`,
  agent: {
    name: 'gatling-load-testing',
    prompt: { role: 'Performance Engineer', task: 'Design sustained load scenario', context: args,
      instructions: ['1. Define load pattern', '2. Set target RPS', '3. Configure ramp-up', '4. Define steady-state', '5. Document scenario'],
      outputFormat: 'JSON with load scenario' },
    outputSchema: { type: 'object', required: ['targetLoad', 'artifacts'], properties: { targetLoad: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'endurance-testing', 'load-scenario']
}));

export const configureExtendedMonitoringTask = defineTask('configure-extended-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure Extended Monitoring - ${args.projectName}`,
  agent: {
    name: 'gatling-load-testing',
    prompt: { role: 'Performance Engineer', task: 'Configure extended monitoring for endurance test', context: args,
      instructions: ['1. Configure memory monitoring', '2. Configure CPU monitoring', '3. Configure response time tracking', '4. Set up trend logging', '5. Document monitoring'],
      outputFormat: 'JSON with monitoring configuration' },
    outputSchema: { type: 'object', required: ['configuration', 'artifacts'], properties: { configuration: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'endurance-testing', 'monitoring']
}));

export const executeEnduranceTestTask = defineTask('execute-endurance-test', (args, taskCtx) => ({
  kind: 'agent',
  title: `Execute Endurance Test - ${args.projectName}`,
  agent: {
    name: 'gatling-load-testing',
    prompt: { role: 'Performance Engineer', task: 'Execute endurance test', context: args,
      instructions: ['1. Start load generation', '2. Monitor throughout duration', '3. Collect metrics continuously', '4. Track anomalies', '5. Compile results'],
      outputFormat: 'JSON with test execution results' },
    outputSchema: { type: 'object', required: ['results', 'artifacts'], properties: { results: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'endurance-testing', 'execution']
}));

export const monitorForMemoryLeaksTask = defineTask('monitor-for-memory-leaks', (args, taskCtx) => ({
  kind: 'agent',
  title: `Monitor for Memory Leaks - ${args.projectName}`,
  agent: {
    name: 'gatling-load-testing',
    prompt: { role: 'Performance Engineer', task: 'Monitor for memory leaks during endurance test', context: args,
      instructions: ['1. Track heap usage over time', '2. Identify growing patterns', '3. Analyze GC behavior', '4. Detect unreleased memory', '5. Document findings'],
      outputFormat: 'JSON with memory leak analysis' },
    outputSchema: { type: 'object', required: ['issuesFound', 'analysis', 'artifacts'], properties: { issuesFound: { type: 'number' }, analysis: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'endurance-testing', 'memory-leaks']
}));

export const detectPerformanceDegradationTask = defineTask('detect-performance-degradation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Detect Performance Degradation - ${args.projectName}`,
  agent: {
    name: 'gatling-load-testing',
    prompt: { role: 'Performance Engineer', task: 'Detect performance degradation over time', context: args,
      instructions: ['1. Analyze latency trends', '2. Compare start vs end metrics', '3. Identify degradation patterns', '4. Calculate degradation rate', '5. Document findings'],
      outputFormat: 'JSON with degradation detection results' },
    outputSchema: { type: 'object', required: ['degradationDetected', 'report', 'artifacts'], properties: { degradationDetected: { type: 'boolean' }, report: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'endurance-testing', 'degradation']
}));

export const analyzeResourceTrendsTask = defineTask('analyze-resource-trends', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze Resource Trends - ${args.projectName}`,
  agent: {
    name: 'gatling-load-testing',
    prompt: { role: 'Performance Engineer', task: 'Analyze resource utilization trends', context: args,
      instructions: ['1. Analyze CPU trends', '2. Analyze memory trends', '3. Analyze I/O trends', '4. Identify concerning patterns', '5. Document trends'],
      outputFormat: 'JSON with resource trend analysis' },
    outputSchema: { type: 'object', required: ['trends', 'artifacts'], properties: { trends: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'endurance-testing', 'resource-trends']
}));

export const generateEnduranceFindingsTask = defineTask('generate-endurance-findings', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Endurance Findings - ${args.projectName}`,
  agent: {
    name: 'gatling-load-testing',
    prompt: { role: 'Performance Engineer', task: 'Generate endurance test findings', context: args,
      instructions: ['1. Summarize memory findings', '2. Summarize degradation findings', '3. Summarize resource findings', '4. Generate recommendations', '5. Document findings'],
      outputFormat: 'JSON with endurance test findings' },
    outputSchema: { type: 'object', required: ['findings', 'recommendations', 'artifacts'], properties: { findings: { type: 'object' }, recommendations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'endurance-testing', 'findings']
}));

export const documentEnduranceRecommendationsTask = defineTask('document-endurance-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: `Document Endurance Recommendations - ${args.projectName}`,
  agent: {
    name: 'gatling-load-testing',
    prompt: { role: 'Performance Engineer', task: 'Document endurance test recommendations', context: args,
      instructions: ['1. Prioritize recommendations', '2. Detail memory fixes', '3. Detail performance fixes', '4. Provide implementation guidance', '5. Generate report'],
      outputFormat: 'JSON with recommendations documentation' },
    outputSchema: { type: 'object', required: ['documentation', 'artifacts'], properties: { documentation: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'endurance-testing', 'documentation']
}));
