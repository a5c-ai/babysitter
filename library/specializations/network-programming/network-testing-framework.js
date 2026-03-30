/**
 * @process specializations/network-programming/network-testing-framework
 * @description Network Testing Framework - Build a comprehensive network testing library with mock servers,
 * network simulation, latency injection, and packet manipulation capabilities.
 * @inputs { projectName: string, language: string, features?: object }
 * @outputs { success: boolean, frameworkConfig: object, implementation: object, testResults: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/network-programming/network-testing-framework', {
 *   projectName: 'Network Test Suite',
 *   language: 'Go',
 *   features: { mockServers: true, simulation: true, latencyInjection: true, capture: true }
 * });
 *
 * @references
 * - tc (traffic control): https://man7.org/linux/man-pages/man8/tc.8.html
 * - toxiproxy: https://github.com/Shopify/toxiproxy
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, language = 'Go', features = { mockServers: true, simulation: true, latencyInjection: true }, outputDir = 'network-testing-framework' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Network Testing Framework: ${projectName}`);

  const phases = [
    { name: 'architecture', task: architectureTask },
    { name: 'mock-servers', task: mockServersTask },
    { name: 'network-simulation', task: networkSimulationTask },
    { name: 'latency-injection', task: latencyInjectionTask },
    { name: 'packet-loss', task: packetLossTask },
    { name: 'bandwidth-limiting', task: bandwidthLimitingTask },
    { name: 'traffic-capture', task: trafficCaptureTask },
    { name: 'assertions', task: assertionsTask },
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
    frameworkConfig: { features, language },
    implementation: results,
    testResults: { totalTests: results.testing.totalTests, passedTests: results.testing.passedTests },
    artifacts, duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/network-programming/network-testing-framework', timestamp: startTime }
  };
}

export const architectureTask = defineTask('architecture', (args, taskCtx) => ({
  kind: 'agent', title: `Architecture - ${args.projectName}`,
  skill: { name: 'network-testing' },
  agent: { name: 'network-testing-expert', prompt: { role: 'Systems Architect', task: 'Design testing framework', context: args, instructions: ['1. Component design', '2. Plugin system', '3. Configuration DSL', '4. Integration points'] }, outputSchema: { type: 'object', required: ['design', 'artifacts'], properties: { design: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'testing-framework', 'architecture']
}));

export const mockServersTask = defineTask('mock-servers', (args, taskCtx) => ({
  kind: 'agent', title: `Mock Servers - ${args.projectName}`,
  skill: { name: 'network-testing' },
  agent: { name: 'network-testing-expert', prompt: { role: 'Mock Server Engineer', task: 'Build mock servers', context: args, instructions: ['1. TCP mock server', '2. HTTP mock server', '3. Response configuration', '4. Recording/playback'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'testing-framework', 'mocks']
}));

export const networkSimulationTask = defineTask('network-simulation', (args, taskCtx) => ({
  kind: 'agent', title: `Network Simulation - ${args.projectName}`,
  skill: { name: 'network-simulation' },
  agent: { name: 'network-testing-expert', prompt: { role: 'Simulation Engineer', task: 'Implement network simulation', context: args, instructions: ['1. Network conditions', '2. Route simulation', '3. DNS simulation', '4. Topology modeling'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'testing-framework', 'simulation']
}));

export const latencyInjectionTask = defineTask('latency-injection', (args, taskCtx) => ({
  kind: 'agent', title: `Latency Injection - ${args.projectName}`,
  skill: { name: 'network-simulation' },
  agent: { name: 'network-testing-expert', prompt: { role: 'Latency Engineer', task: 'Implement latency injection', context: args, instructions: ['1. Fixed latency', '2. Random latency', '3. Jitter simulation', '4. Conditional delays'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'testing-framework', 'latency']
}));

export const packetLossTask = defineTask('packet-loss', (args, taskCtx) => ({
  kind: 'agent', title: `Packet Loss - ${args.projectName}`,
  skill: { name: 'network-simulation' },
  agent: { name: 'network-testing-expert', prompt: { role: 'Packet Loss Engineer', task: 'Implement packet loss', context: args, instructions: ['1. Random loss', '2. Burst loss', '3. Selective loss', '4. Corruption simulation'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'testing-framework', 'loss']
}));

export const bandwidthLimitingTask = defineTask('bandwidth-limiting', (args, taskCtx) => ({
  kind: 'agent', title: `Bandwidth Limiting - ${args.projectName}`,
  skill: { name: 'network-simulation' },
  agent: { name: 'network-testing-expert', prompt: { role: 'Bandwidth Engineer', task: 'Implement bandwidth limiting', context: args, instructions: ['1. Rate limiting', '2. Token bucket', '3. Burst control', '4. Per-connection limits'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'testing-framework', 'bandwidth']
}));

export const trafficCaptureTask = defineTask('traffic-capture', (args, taskCtx) => ({
  kind: 'agent', title: `Traffic Capture - ${args.projectName}`,
  skill: { name: 'network-testing' },
  agent: { name: 'network-testing-expert', prompt: { role: 'Capture Engineer', task: 'Implement traffic capture', context: args, instructions: ['1. Packet capture', '2. Protocol parsing', '3. Flow tracking', '4. Export formats'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'testing-framework', 'capture']
}));

export const assertionsTask = defineTask('assertions', (args, taskCtx) => ({
  kind: 'agent', title: `Assertions - ${args.projectName}`,
  skill: { name: 'network-testing' },
  agent: { name: 'network-testing-expert', prompt: { role: 'Assertion Engineer', task: 'Build assertion library', context: args, instructions: ['1. Connection assertions', '2. Timing assertions', '3. Content assertions', '4. Protocol assertions'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'testing-framework', 'assertions']
}));

export const testSuiteTask = defineTask('test-suite', (args, taskCtx) => ({
  kind: 'agent', title: `Test Suite - ${args.projectName}`,
  skill: { name: 'network-testing' },
  agent: { name: 'network-testing-expert', prompt: { role: 'Test Engineer', task: 'Create framework tests', context: args, instructions: ['1. Mock tests', '2. Simulation tests', '3. Injection tests', '4. Integration tests'] }, outputSchema: { type: 'object', required: ['totalTests', 'passedTests', 'artifacts'], properties: { totalTests: { type: 'number' }, passedTests: { type: 'number' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'testing-framework', 'testing']
}));

export const validationTask = defineTask('validation', (args, taskCtx) => ({
  kind: 'agent', title: `Validation - ${args.projectName}`,
  skill: { name: 'network-testing' },
  agent: { name: 'network-testing-expert', prompt: { role: 'QA Engineer', task: 'Validate framework', context: args, instructions: ['1. Verify features', '2. Check simulation', '3. Validate tests', '4. Calculate score'] }, outputSchema: { type: 'object', required: ['overallScore', 'passedChecks', 'artifacts'], properties: { overallScore: { type: 'number' }, passedChecks: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'testing-framework', 'validation']
}));
