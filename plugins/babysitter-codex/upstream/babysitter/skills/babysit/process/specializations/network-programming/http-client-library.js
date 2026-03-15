/**
 * @process specializations/network-programming/http-client-library
 * @description HTTP Client Library Development - Build a reusable HTTP client library with connection pooling,
 * retry logic, timeout handling, authentication, request/response interceptors, and comprehensive testing.
 * @inputs { projectName: string, language: string, features?: object }
 * @outputs { success: boolean, libraryConfig: object, implementation: object, testResults: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/network-programming/http-client-library', {
 *   projectName: 'Enterprise HTTP Client',
 *   language: 'Python',
 *   features: { connectionPooling: true, retryLogic: true, interceptors: true, http2Support: true }
 * });
 *
 * @references
 * - Python requests: https://requests.readthedocs.io/
 * - Go net/http: https://pkg.go.dev/net/http
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName, language = 'Python', features = { connectionPooling: true, retryLogic: true, interceptors: true, http2Support: false },
    outputDir = 'http-client-library'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting HTTP Client Library: ${projectName}`);

  // Phase 1-9: Implementation phases
  const phases = [
    { name: 'api-design', task: apiDesignTask },
    { name: 'request-builder', task: requestBuilderTask },
    { name: 'response-handler', task: responseHandlerTask },
    { name: 'connection-pooling', task: connectionPoolingTask },
    { name: 'retry-logic', task: retryLogicTask },
    { name: 'timeout-handling', task: timeoutHandlingTask },
    { name: 'authentication', task: authenticationTask },
    { name: 'interceptors', task: interceptorsTask },
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

  await ctx.breakpoint({
    question: `HTTP Client Library Complete for ${projectName}! Validation: ${validation.overallScore}/100. Review?`,
    title: 'HTTP Client Library Complete',
    context: { runId: ctx.runId, validationScore: validation.overallScore }
  });

  return {
    success: validation.overallScore >= 80,
    projectName,
    libraryConfig: { features, language },
    implementation: results,
    testResults: { totalTests: results.testing.totalTests, passedTests: results.testing.passedTests },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/network-programming/http-client-library', timestamp: startTime }
  };
}

export const apiDesignTask = defineTask('api-design', (args, taskCtx) => ({
  kind: 'agent', title: `API Design - ${args.projectName}`,
  skill: { name: 'http-protocol' },
  agent: { name: 'network-architect', prompt: { role: 'API Designer', task: 'Design client library API', context: args, instructions: ['1. Design fluent API', '2. Define request methods', '3. Design response interface', '4. Plan extensibility'] }, outputSchema: { type: 'object', required: ['design', 'artifacts'], properties: { design: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'http-client', 'api']
}));

export const requestBuilderTask = defineTask('request-builder', (args, taskCtx) => ({
  kind: 'agent', title: `Request Builder - ${args.projectName}`,
  skill: { name: 'http-protocol' },
  agent: { name: 'network-architect', prompt: { role: 'Request Engineer', task: 'Implement request builder', context: args, instructions: ['1. Build request objects', '2. Handle headers', '3. Handle body types', '4. Support query params'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'http-client', 'request']
}));

export const responseHandlerTask = defineTask('response-handler', (args, taskCtx) => ({
  kind: 'agent', title: `Response Handler - ${args.projectName}`,
  skill: { name: 'http-protocol' },
  agent: { name: 'network-architect', prompt: { role: 'Response Engineer', task: 'Implement response handling', context: args, instructions: ['1. Parse responses', '2. Handle status codes', '3. Deserialize bodies', '4. Handle errors'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'http-client', 'response']
}));

export const connectionPoolingTask = defineTask('connection-pooling', (args, taskCtx) => ({
  kind: 'agent', title: `Connection Pooling - ${args.projectName}`,
  skill: { name: 'http-protocol' },
  agent: { name: 'network-architect', prompt: { role: 'Connection Pool Engineer', task: 'Implement connection pooling', context: args, instructions: ['1. Pool connections per host', '2. Manage pool sizes', '3. Handle keepalive', '4. Clean stale connections'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'http-client', 'pooling']
}));

export const retryLogicTask = defineTask('retry-logic', (args, taskCtx) => ({
  kind: 'agent', title: `Retry Logic - ${args.projectName}`,
  skill: { name: 'http-protocol' },
  agent: { name: 'network-architect', prompt: { role: 'Retry Logic Engineer', task: 'Implement retry mechanism', context: args, instructions: ['1. Implement retry policies', '2. Add exponential backoff', '3. Handle retryable errors', '4. Configure retry limits'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'http-client', 'retry']
}));

export const timeoutHandlingTask = defineTask('timeout-handling', (args, taskCtx) => ({
  kind: 'agent', title: `Timeout Handling - ${args.projectName}`,
  skill: { name: 'http-protocol' },
  agent: { name: 'network-architect', prompt: { role: 'Timeout Engineer', task: 'Implement timeout handling', context: args, instructions: ['1. Connection timeout', '2. Read timeout', '3. Write timeout', '4. Total request timeout'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'http-client', 'timeout']
}));

export const authenticationTask = defineTask('authentication', (args, taskCtx) => ({
  kind: 'agent', title: `Authentication - ${args.projectName}`,
  skill: { name: 'http-protocol' },
  agent: { name: 'network-architect', prompt: { role: 'Authentication Engineer', task: 'Implement authentication', context: args, instructions: ['1. Basic auth', '2. Bearer token', '3. OAuth support', '4. Custom auth handlers'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'http-client', 'auth']
}));

export const interceptorsTask = defineTask('interceptors', (args, taskCtx) => ({
  kind: 'agent', title: `Interceptors - ${args.projectName}`,
  skill: { name: 'http-protocol' },
  agent: { name: 'network-architect', prompt: { role: 'Interceptor Engineer', task: 'Implement interceptors', context: args, instructions: ['1. Request interceptors', '2. Response interceptors', '3. Error interceptors', '4. Middleware chain'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'http-client', 'interceptors']
}));

export const testSuiteTask = defineTask('test-suite', (args, taskCtx) => ({
  kind: 'agent', title: `Test Suite - ${args.projectName}`,
  skill: { name: 'http-protocol' },
  agent: { name: 'network-architect', prompt: { role: 'Test Engineer', task: 'Create comprehensive tests', context: args, instructions: ['1. Unit tests', '2. Integration tests', '3. Mock server tests', '4. Performance tests'] }, outputSchema: { type: 'object', required: ['totalTests', 'passedTests', 'artifacts'], properties: { totalTests: { type: 'number' }, passedTests: { type: 'number' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'http-client', 'testing']
}));

export const validationTask = defineTask('validation', (args, taskCtx) => ({
  kind: 'agent', title: `Validation - ${args.projectName}`,
  skill: { name: 'http-protocol' },
  agent: { name: 'network-architect', prompt: { role: 'QA Engineer', task: 'Validate library', context: args, instructions: ['1. Verify features', '2. Check test coverage', '3. Validate API design', '4. Calculate score'] }, outputSchema: { type: 'object', required: ['overallScore', 'passedChecks', 'artifacts'], properties: { overallScore: { type: 'number' }, passedChecks: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'http-client', 'validation']
}));
