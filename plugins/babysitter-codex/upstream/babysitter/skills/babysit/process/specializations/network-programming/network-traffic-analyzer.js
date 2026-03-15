/**
 * @process specializations/network-programming/network-traffic-analyzer
 * @description Network Traffic Analyzer - Build a comprehensive traffic analysis tool with flow tracking,
 * protocol identification, bandwidth monitoring, anomaly detection, and reporting.
 * @inputs { projectName: string, language: string, features?: object }
 * @outputs { success: boolean, analyzerConfig: object, implementation: object, testResults: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/network-programming/network-traffic-analyzer', {
 *   projectName: 'Enterprise Traffic Analyzer',
 *   language: 'Go',
 *   features: { flowTracking: true, dpi: true, anomalyDetection: true, reporting: true }
 * });
 *
 * @references
 * - ntopng: https://www.ntop.org/products/traffic-analysis/ntop/
 * - Zeek: https://zeek.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, language = 'Go', features = { flowTracking: true, dpi: true, anomalyDetection: true }, outputDir = 'network-traffic-analyzer' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Network Traffic Analyzer: ${projectName}`);

  const phases = [
    { name: 'capture-engine', task: captureEngineTask },
    { name: 'flow-tracking', task: flowTrackingTask },
    { name: 'protocol-identification', task: protocolIdTask },
    { name: 'bandwidth-monitoring', task: bandwidthTask },
    { name: 'anomaly-detection', task: anomalyDetectionTask },
    { name: 'statistics', task: statisticsTask },
    { name: 'reporting', task: reportingTask },
    { name: 'testing', task: testSuiteTask }
  ];

  const results = {};
  for (const phase of phases) {
    const result = await ctx.task(phase.task, { projectName, language, features, outputDir });
    results[phase.name] = result;
    artifacts.push(...result.artifacts);
  }

  const validation = await ctx.task(validationTask, { projectName, features, results, outputDir });
  artifacts.push(...validation.artifacts);

  return {
    success: validation.overallScore >= 80, projectName,
    analyzerConfig: { features, language },
    implementation: results,
    testResults: { totalTests: results.testing.totalTests, passedTests: results.testing.passedTests },
    artifacts, duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/network-programming/network-traffic-analyzer', timestamp: startTime }
  };
}

export const captureEngineTask = defineTask('capture-engine', (args, taskCtx) => ({
  kind: 'agent', title: `Capture Engine - ${args.projectName}`,
  skill: { name: 'packet-capture' },
  agent: { name: 'network-analysis-expert', prompt: { role: 'Capture Engineer', task: 'Build capture engine', context: args, instructions: ['1. High-speed capture', '2. Zero-copy handling', '3. Multi-interface', '4. Performance tuning'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'traffic-analyzer', 'capture']
}));

export const flowTrackingTask = defineTask('flow-tracking', (args, taskCtx) => ({
  kind: 'agent', title: `Flow Tracking - ${args.projectName}`,
  skill: { name: 'network-testing' },
  agent: { name: 'network-analysis-expert', prompt: { role: 'Flow Tracking Engineer', task: 'Implement flow tracking', context: args, instructions: ['1. 5-tuple tracking', '2. Flow state machine', '3. Flow timeout', '4. Flow export'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'traffic-analyzer', 'flow']
}));

export const protocolIdTask = defineTask('protocol-id', (args, taskCtx) => ({
  kind: 'agent', title: `Protocol Identification - ${args.projectName}`,
  skill: { name: 'packet-capture' },
  agent: { name: 'network-analysis-expert', prompt: { role: 'DPI Engineer', task: 'Implement protocol identification', context: args, instructions: ['1. Port-based detection', '2. Pattern matching', '3. Heuristic detection', '4. ML-based detection'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'traffic-analyzer', 'dpi']
}));

export const bandwidthTask = defineTask('bandwidth', (args, taskCtx) => ({
  kind: 'agent', title: `Bandwidth Monitoring - ${args.projectName}`,
  skill: { name: 'network-testing' },
  agent: { name: 'network-analysis-expert', prompt: { role: 'Bandwidth Engineer', task: 'Monitor bandwidth', context: args, instructions: ['1. Per-flow bandwidth', '2. Per-host bandwidth', '3. Rate calculations', '4. Threshold alerts'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'traffic-analyzer', 'bandwidth']
}));

export const anomalyDetectionTask = defineTask('anomaly-detection', (args, taskCtx) => ({
  kind: 'agent', title: `Anomaly Detection - ${args.projectName}`,
  skill: { name: 'network-testing' },
  agent: { name: 'network-analysis-expert', prompt: { role: 'Anomaly Detection Engineer', task: 'Detect anomalies', context: args, instructions: ['1. Baseline learning', '2. Statistical detection', '3. Pattern anomalies', '4. Alert generation'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'traffic-analyzer', 'anomaly']
}));

export const statisticsTask = defineTask('statistics', (args, taskCtx) => ({
  kind: 'agent', title: `Statistics - ${args.projectName}`,
  skill: { name: 'packet-capture' },
  agent: { name: 'network-analysis-expert', prompt: { role: 'Statistics Engineer', task: 'Collect statistics', context: args, instructions: ['1. Traffic statistics', '2. Protocol statistics', '3. Top talkers', '4. Historical data'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'traffic-analyzer', 'statistics']
}));

export const reportingTask = defineTask('reporting', (args, taskCtx) => ({
  kind: 'agent', title: `Reporting - ${args.projectName}`,
  skill: { name: 'network-testing' },
  agent: { name: 'network-analysis-expert', prompt: { role: 'Reporting Engineer', task: 'Generate reports', context: args, instructions: ['1. Report templates', '2. Scheduled reports', '3. Custom queries', '4. Export formats'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'traffic-analyzer', 'reporting']
}));

export const testSuiteTask = defineTask('test-suite', (args, taskCtx) => ({
  kind: 'agent', title: `Test Suite - ${args.projectName}`,
  skill: { name: 'network-testing' },
  agent: { name: 'network-testing-expert', prompt: { role: 'Test Engineer', task: 'Create analyzer tests', context: args, instructions: ['1. Flow tests', '2. Detection tests', '3. Performance tests', '4. Integration tests'] }, outputSchema: { type: 'object', required: ['totalTests', 'passedTests', 'artifacts'], properties: { totalTests: { type: 'number' }, passedTests: { type: 'number' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'traffic-analyzer', 'testing']
}));

export const validationTask = defineTask('validation', (args, taskCtx) => ({
  kind: 'agent', title: `Validation - ${args.projectName}`,
  skill: { name: 'network-testing' },
  agent: { name: 'network-testing-expert', prompt: { role: 'QA Engineer', task: 'Validate analyzer', context: args, instructions: ['1. Verify features', '2. Check accuracy', '3. Validate tests', '4. Calculate score'] }, outputSchema: { type: 'object', required: ['overallScore', 'passedChecks', 'artifacts'], properties: { overallScore: { type: 'number' }, passedChecks: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'traffic-analyzer', 'validation']
}));
