/**
 * @process specializations/network-programming/load-testing-tool
 * @description Load Testing Tool - Build a high-performance load testing tool with concurrent connections,
 * request generation, metrics collection, and result analysis.
 * @inputs { projectName: string, language: string, protocols?: array, features?: object }
 * @outputs { success: boolean, toolConfig: object, implementation: object, testResults: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/network-programming/load-testing-tool', {
 *   projectName: 'Performance Load Tester',
 *   language: 'Go',
 *   protocols: ['http', 'websocket', 'grpc'],
 *   features: { distributed: true, realtime: true, reporting: true }
 * });
 *
 * @references
 * - wrk: https://github.com/wg/wrk
 * - k6: https://k6.io/docs/
 * - Locust: https://docs.locust.io/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, language = 'Go', protocols = ['http', 'websocket'], features = { distributed: true, realtime: true, reporting: true }, outputDir = 'load-testing-tool' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Load Testing Tool: ${projectName}`);

  const phases = [
    { name: 'architecture', task: architectureTask },
    { name: 'connection-engine', task: connectionEngineTask },
    { name: 'request-generator', task: requestGeneratorTask },
    { name: 'protocol-plugins', task: protocolPluginsTask },
    { name: 'metrics-collector', task: metricsCollectorTask },
    { name: 'distributed-mode', task: distributedModeTask },
    { name: 'realtime-dashboard', task: realtimeDashboardTask },
    { name: 'reporting', task: reportingTask },
    { name: 'testing', task: testSuiteTask }
  ];

  const results = {};
  for (const phase of phases) {
    const result = await ctx.task(phase.task, { projectName, language, protocols, features, outputDir });
    results[phase.name] = result;
    artifacts.push(...result.artifacts);
  }

  const validation = await ctx.task(validationTask, { projectName, protocols, features, results, outputDir });
  artifacts.push(...validation.artifacts);

  return {
    success: validation.overallScore >= 80, projectName,
    toolConfig: { protocols, features, language },
    implementation: results,
    testResults: { totalTests: results.testing.totalTests, passedTests: results.testing.passedTests },
    artifacts, duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/network-programming/load-testing-tool', timestamp: startTime }
  };
}

export const architectureTask = defineTask('architecture', (args, taskCtx) => ({
  kind: 'agent', title: `Architecture - ${args.projectName}`,
  skill: { name: 'network-testing' },
  agent: { name: 'network-testing-expert', prompt: { role: 'Systems Architect', task: 'Design load tester', context: args, instructions: ['1. Worker architecture', '2. Connection pooling', '3. Metrics pipeline', '4. Distributed coordination'] }, outputSchema: { type: 'object', required: ['design', 'artifacts'], properties: { design: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'load-testing', 'architecture']
}));

export const connectionEngineTask = defineTask('connection-engine', (args, taskCtx) => ({
  kind: 'agent', title: `Connection Engine - ${args.projectName}`,
  skill: { name: 'network-simulation' },
  agent: { name: 'network-testing-expert', prompt: { role: 'Connection Engineer', task: 'Build connection engine', context: args, instructions: ['1. High concurrency', '2. Connection reuse', '3. Rate limiting', '4. Ramp-up patterns'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'load-testing', 'connection']
}));

export const requestGeneratorTask = defineTask('request-generator', (args, taskCtx) => ({
  kind: 'agent', title: `Request Generator - ${args.projectName}`,
  skill: { name: 'network-testing' },
  agent: { name: 'network-testing-expert', prompt: { role: 'Generator Engineer', task: 'Build request generator', context: args, instructions: ['1. Request templates', '2. Dynamic payloads', '3. Data providers', '4. Scenario scripting'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'load-testing', 'generator']
}));

export const protocolPluginsTask = defineTask('protocol-plugins', (args, taskCtx) => ({
  kind: 'agent', title: `Protocol Plugins - ${args.projectName}`,
  skill: { name: 'network-testing' },
  agent: { name: 'network-testing-expert', prompt: { role: 'Protocol Engineer', task: 'Build protocol plugins', context: args, instructions: ['1. HTTP/HTTPS plugin', '2. WebSocket plugin', '3. gRPC plugin', '4. Custom protocols'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'load-testing', 'protocols']
}));

export const metricsCollectorTask = defineTask('metrics-collector', (args, taskCtx) => ({
  kind: 'agent', title: `Metrics Collector - ${args.projectName}`,
  skill: { name: 'network-testing' },
  agent: { name: 'network-testing-expert', prompt: { role: 'Metrics Engineer', task: 'Build metrics collector', context: args, instructions: ['1. Latency histograms', '2. Throughput metrics', '3. Error tracking', '4. Percentile calculations'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'load-testing', 'metrics']
}));

export const distributedModeTask = defineTask('distributed-mode', (args, taskCtx) => ({
  kind: 'agent', title: `Distributed Mode - ${args.projectName}`,
  skill: { name: 'network-simulation' },
  agent: { name: 'network-testing-expert', prompt: { role: 'Distributed Engineer', task: 'Implement distributed mode', context: args, instructions: ['1. Worker coordination', '2. Test distribution', '3. Result aggregation', '4. Failure handling'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'load-testing', 'distributed']
}));

export const realtimeDashboardTask = defineTask('realtime-dashboard', (args, taskCtx) => ({
  kind: 'agent', title: `Realtime Dashboard - ${args.projectName}`,
  skill: { name: 'network-testing' },
  agent: { name: 'network-testing-expert', prompt: { role: 'Dashboard Engineer', task: 'Build realtime dashboard', context: args, instructions: ['1. Live metrics', '2. Graphs/charts', '3. Test control', '4. Alert thresholds'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'load-testing', 'dashboard']
}));

export const reportingTask = defineTask('reporting', (args, taskCtx) => ({
  kind: 'agent', title: `Reporting - ${args.projectName}`,
  skill: { name: 'network-testing' },
  agent: { name: 'network-testing-expert', prompt: { role: 'Reporting Engineer', task: 'Build reporting system', context: args, instructions: ['1. HTML reports', '2. JSON export', '3. Comparison reports', '4. CI integration'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'load-testing', 'reporting']
}));

export const testSuiteTask = defineTask('test-suite', (args, taskCtx) => ({
  kind: 'agent', title: `Test Suite - ${args.projectName}`,
  skill: { name: 'network-testing' },
  agent: { name: 'network-testing-expert', prompt: { role: 'Test Engineer', task: 'Create tool tests', context: args, instructions: ['1. Engine tests', '2. Protocol tests', '3. Metrics tests', '4. Distributed tests'] }, outputSchema: { type: 'object', required: ['totalTests', 'passedTests', 'artifacts'], properties: { totalTests: { type: 'number' }, passedTests: { type: 'number' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'load-testing', 'testing']
}));

export const validationTask = defineTask('validation', (args, taskCtx) => ({
  kind: 'agent', title: `Validation - ${args.projectName}`,
  skill: { name: 'network-testing' },
  agent: { name: 'network-testing-expert', prompt: { role: 'QA Engineer', task: 'Validate load tester', context: args, instructions: ['1. Verify protocols', '2. Check metrics', '3. Validate tests', '4. Calculate score'] }, outputSchema: { type: 'object', required: ['overallScore', 'passedChecks', 'artifacts'], properties: { overallScore: { type: 'number' }, passedChecks: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'load-testing', 'validation']
}));
