/**
 * @process specializations/network-programming/health-check-system
 * @description Health Check System - Build a comprehensive health checking framework with multiple probe types,
 * configurable intervals, alerting integration, and dashboard visualization.
 * @inputs { projectName: string, language: string, probeTypes?: array, features?: object }
 * @outputs { success: boolean, systemConfig: object, implementation: object, testResults: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/network-programming/health-check-system', {
 *   projectName: 'Infrastructure Health Monitor',
 *   language: 'Go',
 *   probeTypes: ['tcp', 'http', 'grpc', 'dns'],
 *   features: { alerting: true, dashboard: true, distributed: true }
 * });
 *
 * @references
 * - Consul Health Checks: https://developer.hashicorp.com/consul/docs/services/usage/checks
 * - Kubernetes Probes: https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, language = 'Go', probeTypes = ['tcp', 'http', 'grpc'], features = { alerting: true, dashboard: true }, outputDir = 'health-check-system' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Health Check System: ${projectName}`);

  const phases = [
    { name: 'architecture', task: architectureTask },
    { name: 'probe-framework', task: probeFrameworkTask },
    { name: 'tcp-probe', task: tcpProbeTask },
    { name: 'http-probe', task: httpProbeTask },
    { name: 'grpc-probe', task: grpcProbeTask },
    { name: 'scheduler', task: schedulerTask },
    { name: 'alerting', task: alertingTask },
    { name: 'dashboard', task: dashboardTask },
    { name: 'testing', task: testSuiteTask }
  ];

  const results = {};
  for (const phase of phases) {
    const result = await ctx.task(phase.task, { projectName, language, probeTypes, features, outputDir });
    results[phase.name] = result;
    artifacts.push(...result.artifacts);
  }

  const validation = await ctx.task(validationTask, { projectName, probeTypes, features, results, outputDir });
  artifacts.push(...validation.artifacts);

  return {
    success: validation.overallScore >= 80, projectName,
    systemConfig: { probeTypes, features, language },
    implementation: results,
    testResults: { totalTests: results.testing.totalTests, passedTests: results.testing.passedTests },
    artifacts, duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/network-programming/health-check-system', timestamp: startTime }
  };
}

export const architectureTask = defineTask('architecture', (args, taskCtx) => ({
  kind: 'agent', title: `Architecture - ${args.projectName}`,
  skill: { name: 'load-balancer' },
  agent: { name: 'load-balancer-expert', prompt: { role: 'Systems Architect', task: 'Design health check architecture', context: args, instructions: ['1. Probe architecture', '2. Scheduler design', '3. State management', '4. Distributed coordination'] }, outputSchema: { type: 'object', required: ['design', 'artifacts'], properties: { design: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'health-check', 'architecture']
}));

export const probeFrameworkTask = defineTask('probe-framework', (args, taskCtx) => ({
  kind: 'agent', title: `Probe Framework - ${args.projectName}`,
  skill: { name: 'network-testing' },
  agent: { name: 'load-balancer-expert', prompt: { role: 'Framework Engineer', task: 'Build probe framework', context: args, instructions: ['1. Probe interface', '2. Result handling', '3. Timeout management', '4. Retry logic'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'health-check', 'framework']
}));

export const tcpProbeTask = defineTask('tcp-probe', (args, taskCtx) => ({
  kind: 'agent', title: `TCP Probe - ${args.projectName}`,
  skill: { name: 'network-testing' },
  agent: { name: 'load-balancer-expert', prompt: { role: 'TCP Probe Engineer', task: 'Implement TCP probe', context: args, instructions: ['1. Connection check', '2. Port scanning', '3. Latency measurement', '4. TLS validation'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'health-check', 'tcp']
}));

export const httpProbeTask = defineTask('http-probe', (args, taskCtx) => ({
  kind: 'agent', title: `HTTP Probe - ${args.projectName}`,
  skill: { name: 'network-testing' },
  agent: { name: 'load-balancer-expert', prompt: { role: 'HTTP Probe Engineer', task: 'Implement HTTP probe', context: args, instructions: ['1. GET/POST requests', '2. Status code check', '3. Response body validation', '4. Header checks'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'health-check', 'http']
}));

export const grpcProbeTask = defineTask('grpc-probe', (args, taskCtx) => ({
  kind: 'agent', title: `gRPC Probe - ${args.projectName}`,
  skill: { name: 'network-testing' },
  agent: { name: 'load-balancer-expert', prompt: { role: 'gRPC Probe Engineer', task: 'Implement gRPC probe', context: args, instructions: ['1. Health check RPC', '2. Reflection support', '3. TLS handling', '4. Metadata validation'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'health-check', 'grpc']
}));

export const schedulerTask = defineTask('scheduler', (args, taskCtx) => ({
  kind: 'agent', title: `Scheduler - ${args.projectName}`,
  skill: { name: 'load-balancer' },
  agent: { name: 'load-balancer-expert', prompt: { role: 'Scheduler Engineer', task: 'Build check scheduler', context: args, instructions: ['1. Interval scheduling', '2. Jitter support', '3. Concurrent execution', '4. Priority handling'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'health-check', 'scheduler']
}));

export const alertingTask = defineTask('alerting', (args, taskCtx) => ({
  kind: 'agent', title: `Alerting - ${args.projectName}`,
  skill: { name: 'load-balancer' },
  agent: { name: 'load-balancer-expert', prompt: { role: 'Alerting Engineer', task: 'Implement alerting', context: args, instructions: ['1. Alert rules', '2. Notification channels', '3. Escalation policies', '4. Alert aggregation'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'health-check', 'alerting']
}));

export const dashboardTask = defineTask('dashboard', (args, taskCtx) => ({
  kind: 'agent', title: `Dashboard - ${args.projectName}`,
  skill: { name: 'load-balancer' },
  agent: { name: 'load-balancer-expert', prompt: { role: 'Dashboard Engineer', task: 'Build status dashboard', context: args, instructions: ['1. Service status view', '2. Historical graphs', '3. Incident timeline', '4. API endpoints'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'health-check', 'dashboard']
}));

export const testSuiteTask = defineTask('test-suite', (args, taskCtx) => ({
  kind: 'agent', title: `Test Suite - ${args.projectName}`,
  skill: { name: 'network-testing' },
  agent: { name: 'network-testing-expert', prompt: { role: 'Test Engineer', task: 'Create health check tests', context: args, instructions: ['1. Probe tests', '2. Scheduler tests', '3. Alert tests', '4. Integration tests'] }, outputSchema: { type: 'object', required: ['totalTests', 'passedTests', 'artifacts'], properties: { totalTests: { type: 'number' }, passedTests: { type: 'number' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'health-check', 'testing']
}));

export const validationTask = defineTask('validation', (args, taskCtx) => ({
  kind: 'agent', title: `Validation - ${args.projectName}`,
  skill: { name: 'network-testing' },
  agent: { name: 'network-testing-expert', prompt: { role: 'QA Engineer', task: 'Validate health system', context: args, instructions: ['1. Verify probes', '2. Check alerting', '3. Validate tests', '4. Calculate score'] }, outputSchema: { type: 'object', required: ['overallScore', 'passedChecks', 'artifacts'], properties: { overallScore: { type: 'number' }, passedChecks: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'health-check', 'validation']
}));
