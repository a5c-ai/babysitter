/**
 * @process specializations/network-programming/protocol-fuzzer
 * @description Protocol Fuzzer - Build a network protocol fuzzing tool with mutation strategies,
 * crash detection, coverage tracking, and vulnerability reporting.
 * @inputs { projectName: string, language: string, targetProtocol?: string, features?: object }
 * @outputs { success: boolean, fuzzerConfig: object, implementation: object, testResults: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/network-programming/protocol-fuzzer', {
 *   projectName: 'Protocol Security Fuzzer',
 *   language: 'Rust',
 *   targetProtocol: 'custom',
 *   features: { mutation: true, generation: true, coverage: true, crash: true }
 * });
 *
 * @references
 * - AFL++: https://github.com/AFLplusplus/AFLplusplus
 * - boofuzz: https://boofuzz.readthedocs.io/
 * - Peach Fuzzer: https://www.peach.tech/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, language = 'Rust', targetProtocol = 'custom', features = { mutation: true, generation: true, coverage: true, crash: true }, outputDir = 'protocol-fuzzer' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Protocol Fuzzer: ${projectName}`);

  const phases = [
    { name: 'architecture', task: architectureTask },
    { name: 'protocol-model', task: protocolModelTask },
    { name: 'mutation-engine', task: mutationEngineTask },
    { name: 'generation-engine', task: generationEngineTask },
    { name: 'transport-layer', task: transportLayerTask },
    { name: 'crash-detection', task: crashDetectionTask },
    { name: 'coverage-tracking', task: coverageTrackingTask },
    { name: 'reporting', task: reportingTask },
    { name: 'testing', task: testSuiteTask }
  ];

  const results = {};
  for (const phase of phases) {
    const result = await ctx.task(phase.task, { projectName, language, targetProtocol, features, outputDir });
    results[phase.name] = result;
    artifacts.push(...result.artifacts);
  }

  const validation = await ctx.task(validationTask, { projectName, targetProtocol, features, results, outputDir });
  artifacts.push(...validation.artifacts);

  return {
    success: validation.overallScore >= 80, projectName,
    fuzzerConfig: { targetProtocol, features, language },
    implementation: results,
    testResults: { totalTests: results.testing.totalTests, passedTests: results.testing.passedTests },
    artifacts, duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/network-programming/protocol-fuzzer', timestamp: startTime }
  };
}

export const architectureTask = defineTask('architecture', (args, taskCtx) => ({
  kind: 'agent', title: `Architecture - ${args.projectName}`,
  skill: { name: 'protocol-fuzzer' },
  agent: { name: 'security-testing-expert', prompt: { role: 'Systems Architect', task: 'Design protocol fuzzer', context: args, instructions: ['1. Fuzzing loop design', '2. Input queue', '3. Mutation pipeline', '4. Result analysis'] }, outputSchema: { type: 'object', required: ['design', 'artifacts'], properties: { design: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'fuzzer', 'architecture']
}));

export const protocolModelTask = defineTask('protocol-model', (args, taskCtx) => ({
  kind: 'agent', title: `Protocol Model - ${args.projectName}`,
  skill: { name: 'protocol-parser' },
  agent: { name: 'security-testing-expert', prompt: { role: 'Protocol Model Engineer', task: 'Build protocol model', context: args, instructions: ['1. Message structure', '2. Field definitions', '3. State machine', '4. Constraints'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'fuzzer', 'model']
}));

export const mutationEngineTask = defineTask('mutation-engine', (args, taskCtx) => ({
  kind: 'agent', title: `Mutation Engine - ${args.projectName}`,
  skill: { name: 'protocol-fuzzer' },
  agent: { name: 'security-testing-expert', prompt: { role: 'Mutation Engineer', task: 'Build mutation engine', context: args, instructions: ['1. Bit flipping', '2. Byte substitution', '3. Field mutation', '4. Structure mutation'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'fuzzer', 'mutation']
}));

export const generationEngineTask = defineTask('generation-engine', (args, taskCtx) => ({
  kind: 'agent', title: `Generation Engine - ${args.projectName}`,
  skill: { name: 'protocol-fuzzer' },
  agent: { name: 'security-testing-expert', prompt: { role: 'Generation Engineer', task: 'Build generation engine', context: args, instructions: ['1. Grammar-based generation', '2. Random generation', '3. Edge case generation', '4. Sequence generation'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'fuzzer', 'generation']
}));

export const transportLayerTask = defineTask('transport-layer', (args, taskCtx) => ({
  kind: 'agent', title: `Transport Layer - ${args.projectName}`,
  skill: { name: 'socket-programming' },
  agent: { name: 'security-testing-expert', prompt: { role: 'Transport Engineer', task: 'Build transport layer', context: args, instructions: ['1. TCP transport', '2. UDP transport', '3. TLS transport', '4. Raw socket transport'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'fuzzer', 'transport']
}));

export const crashDetectionTask = defineTask('crash-detection', (args, taskCtx) => ({
  kind: 'agent', title: `Crash Detection - ${args.projectName}`,
  skill: { name: 'protocol-fuzzer' },
  agent: { name: 'network-testing-expert', prompt: { role: 'Crash Detection Engineer', task: 'Implement crash detection', context: args, instructions: ['1. Connection monitoring', '2. Response analysis', '3. Process monitoring', '4. Crash reproduction'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'fuzzer', 'crash']
}));

export const coverageTrackingTask = defineTask('coverage-tracking', (args, taskCtx) => ({
  kind: 'agent', title: `Coverage Tracking - ${args.projectName}`,
  skill: { name: 'protocol-fuzzer' },
  agent: { name: 'security-testing-expert', prompt: { role: 'Coverage Engineer', task: 'Implement coverage tracking', context: args, instructions: ['1. Code coverage', '2. State coverage', '3. Path coverage', '4. Coverage-guided mutation'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'fuzzer', 'coverage']
}));

export const reportingTask = defineTask('reporting', (args, taskCtx) => ({
  kind: 'agent', title: `Reporting - ${args.projectName}`,
  skill: { name: 'protocol-fuzzer' },
  agent: { name: 'security-testing-expert', prompt: { role: 'Reporting Engineer', task: 'Build reporting system', context: args, instructions: ['1. Crash reports', '2. Coverage reports', '3. Statistics', '4. Vulnerability classification'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'fuzzer', 'reporting']
}));

export const testSuiteTask = defineTask('test-suite', (args, taskCtx) => ({
  kind: 'agent', title: `Test Suite - ${args.projectName}`,
  skill: { name: 'network-testing' },
  agent: { name: 'network-testing-expert', prompt: { role: 'Test Engineer', task: 'Create fuzzer tests', context: args, instructions: ['1. Mutation tests', '2. Generation tests', '3. Detection tests', '4. Coverage tests'] }, outputSchema: { type: 'object', required: ['totalTests', 'passedTests', 'artifacts'], properties: { totalTests: { type: 'number' }, passedTests: { type: 'number' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'fuzzer', 'testing']
}));

export const validationTask = defineTask('validation', (args, taskCtx) => ({
  kind: 'agent', title: `Validation - ${args.projectName}`,
  skill: { name: 'network-testing' },
  agent: { name: 'network-testing-expert', prompt: { role: 'QA Engineer', task: 'Validate fuzzer', context: args, instructions: ['1. Verify engines', '2. Check detection', '3. Validate tests', '4. Calculate score'] }, outputSchema: { type: 'object', required: ['overallScore', 'passedChecks', 'artifacts'], properties: { overallScore: { type: 'number' }, passedChecks: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'fuzzer', 'validation']
}));
