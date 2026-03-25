/**
 * @process specializations/network-programming/rest-api-client-generator
 * @description REST API Client Generator - Build a code generator that creates type-safe API clients from OpenAPI/Swagger
 * specifications with proper error handling, serialization, and authentication support.
 * @inputs { projectName: string, targetLanguage: string, specFormat?: string, features?: object }
 * @outputs { success: boolean, generatorConfig: object, implementation: object, testResults: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/network-programming/rest-api-client-generator', {
 *   projectName: 'TypeScript API Client Generator',
 *   targetLanguage: 'TypeScript',
 *   specFormat: 'openapi3',
 *   features: { typeSafety: true, asyncAwait: true, validation: true }
 * });
 *
 * @references
 * - OpenAPI Specification: https://swagger.io/specification/
 * - OpenAPI Generator: https://openapi-generator.tech/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName, targetLanguage = 'TypeScript', specFormat = 'openapi3',
    features = { typeSafety: true, asyncAwait: true, validation: true, documentation: true },
    outputDir = 'rest-api-client-generator'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting REST API Client Generator: ${projectName}`);

  const phases = [
    { name: 'spec-parser', task: specParserTask },
    { name: 'type-generator', task: typeGeneratorTask },
    { name: 'client-generator', task: clientGeneratorTask },
    { name: 'serialization', task: serializationTask },
    { name: 'error-handling', task: errorHandlingTask },
    { name: 'authentication', task: authenticationTask },
    { name: 'validation', task: requestValidationTask },
    { name: 'documentation', task: documentationTask },
    { name: 'testing', task: testSuiteTask }
  ];

  const results = {};
  for (const phase of phases) {
    const result = await ctx.task(phase.task, { projectName, targetLanguage, specFormat, features, outputDir });
    results[phase.name] = result;
    artifacts.push(...result.artifacts);
  }

  const validation = await ctx.task(validationTask, { projectName, features, results, outputDir });
  artifacts.push(...validation.artifacts);

  await ctx.breakpoint({
    question: `REST API Client Generator Complete for ${projectName}! Validation: ${validation.overallScore}/100. Review?`,
    title: 'Client Generator Complete',
    context: { runId: ctx.runId, validationScore: validation.overallScore }
  });

  return {
    success: validation.overallScore >= 80,
    projectName,
    generatorConfig: { targetLanguage, specFormat, features },
    implementation: results,
    testResults: { totalTests: results.testing.totalTests, passedTests: results.testing.passedTests },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/network-programming/rest-api-client-generator', timestamp: startTime }
  };
}

export const specParserTask = defineTask('spec-parser', (args, taskCtx) => ({
  kind: 'agent', title: `Spec Parser - ${args.projectName}`,
  skill: { name: 'http-protocol' },
  agent: { name: 'network-architect', prompt: { role: 'OpenAPI Parser Engineer', task: 'Implement spec parser', context: args, instructions: ['1. Parse OpenAPI spec', '2. Extract endpoints', '3. Extract schemas', '4. Handle references'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'api-generator', 'parser']
}));

export const typeGeneratorTask = defineTask('type-generator', (args, taskCtx) => ({
  kind: 'agent', title: `Type Generator - ${args.projectName}`,
  skill: { name: 'http-protocol' },
  agent: { name: 'network-architect', prompt: { role: 'Type Generation Engineer', task: 'Generate type definitions', context: args, instructions: ['1. Generate types from schemas', '2. Handle complex types', '3. Generate enums', '4. Handle nullable types'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'api-generator', 'types']
}));

export const clientGeneratorTask = defineTask('client-generator', (args, taskCtx) => ({
  kind: 'agent', title: `Client Generator - ${args.projectName}`,
  skill: { name: 'grpc-protocol' },
  agent: { name: 'network-architect', prompt: { role: 'Client Code Generator', task: 'Generate API client', context: args, instructions: ['1. Generate client class', '2. Generate endpoint methods', '3. Handle parameters', '4. Generate async methods'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'api-generator', 'client']
}));

export const serializationTask = defineTask('serialization', (args, taskCtx) => ({
  kind: 'agent', title: `Serialization - ${args.projectName}`,
  skill: { name: 'http-protocol' },
  agent: { name: 'network-architect', prompt: { role: 'Serialization Engineer', task: 'Implement serialization', context: args, instructions: ['1. JSON serialization', '2. Form data handling', '3. Multipart support', '4. Custom serializers'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'api-generator', 'serialization']
}));

export const errorHandlingTask = defineTask('error-handling', (args, taskCtx) => ({
  kind: 'agent', title: `Error Handling - ${args.projectName}`,
  skill: { name: 'http-protocol' },
  agent: { name: 'network-architect', prompt: { role: 'Error Handling Engineer', task: 'Implement error handling', context: args, instructions: ['1. Define error types', '2. Parse error responses', '3. Type-safe errors', '4. Error recovery'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'api-generator', 'errors']
}));

export const authenticationTask = defineTask('authentication', (args, taskCtx) => ({
  kind: 'agent', title: `Authentication - ${args.projectName}`,
  skill: { name: 'http-protocol' },
  agent: { name: 'network-architect', prompt: { role: 'Auth Generator Engineer', task: 'Generate auth support', context: args, instructions: ['1. API key auth', '2. Bearer auth', '3. OAuth2 flows', '4. Custom auth'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'api-generator', 'auth']
}));

export const requestValidationTask = defineTask('request-validation', (args, taskCtx) => ({
  kind: 'agent', title: `Request Validation - ${args.projectName}`,
  skill: { name: 'http-protocol' },
  agent: { name: 'network-architect', prompt: { role: 'Validation Engineer', task: 'Generate request validation', context: args, instructions: ['1. Required field validation', '2. Type validation', '3. Format validation', '4. Custom validators'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'api-generator', 'validation']
}));

export const documentationTask = defineTask('documentation', (args, taskCtx) => ({
  kind: 'agent', title: `Documentation - ${args.projectName}`,
  skill: { name: 'http-protocol' },
  agent: { name: 'network-architect', prompt: { role: 'Documentation Engineer', task: 'Generate client documentation', context: args, instructions: ['1. Generate README', '2. Generate API docs', '3. Generate examples', '4. Generate changelog'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'api-generator', 'documentation']
}));

export const testSuiteTask = defineTask('test-suite', (args, taskCtx) => ({
  kind: 'agent', title: `Test Suite - ${args.projectName}`,
  skill: { name: 'http-protocol' },
  agent: { name: 'network-architect', prompt: { role: 'Test Engineer', task: 'Create generator tests', context: args, instructions: ['1. Test spec parsing', '2. Test code generation', '3. Test generated client', '4. Integration tests'] }, outputSchema: { type: 'object', required: ['totalTests', 'passedTests', 'artifacts'], properties: { totalTests: { type: 'number' }, passedTests: { type: 'number' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'api-generator', 'testing']
}));

export const validationTask = defineTask('validation', (args, taskCtx) => ({
  kind: 'agent', title: `Validation - ${args.projectName}`,
  skill: { name: 'http-protocol' },
  agent: { name: 'network-architect', prompt: { role: 'QA Engineer', task: 'Validate generator', context: args, instructions: ['1. Verify spec compliance', '2. Check generated code', '3. Validate tests', '4. Calculate score'] }, outputSchema: { type: 'object', required: ['overallScore', 'passedChecks', 'artifacts'], properties: { overallScore: { type: 'number' }, passedChecks: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'api-generator', 'validation']
}));
