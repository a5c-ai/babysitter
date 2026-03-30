/**
 * @process specializations/web-development/api-integration-testing
 * @description API Integration Testing - Process for testing API integrations with mock servers, contract testing, and integration test patterns.
 * @inputs { projectName: string, apiType?: string }
 * @outputs { success: boolean, testConfig: object, testSuites: array, artifacts: array }
 * @references - MSW: https://mswjs.io/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, apiType = 'rest', outputDir = 'api-integration-testing' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting API Integration Testing: ${projectName}`);

  const mockServerSetup = await ctx.task(mockServerSetupTask, { projectName, apiType, outputDir });
  artifacts.push(...mockServerSetup.artifacts);

  const integrationTests = await ctx.task(integrationTestsTask, { projectName, apiType, outputDir });
  artifacts.push(...integrationTests.artifacts);

  const contractTests = await ctx.task(contractTestsTask, { projectName, outputDir });
  artifacts.push(...contractTests.artifacts);

  const errorHandlingTests = await ctx.task(errorHandlingTestsTask, { projectName, outputDir });
  artifacts.push(...errorHandlingTests.artifacts);

  await ctx.breakpoint({ question: `API integration testing setup complete for ${projectName}. Approve?`, title: 'API Testing Review', context: { runId: ctx.runId, suites: integrationTests.suites } });

  const documentation = await ctx.task(documentationTask, { projectName, outputDir });
  artifacts.push(...documentation.artifacts);

  return { success: true, projectName, testConfig: mockServerSetup.config, testSuites: integrationTests.suites, artifacts, duration: ctx.now() - startTime, metadata: { processId: 'specializations/web-development/api-integration-testing', timestamp: startTime } };
}

export const mockServerSetupTask = defineTask('mock-server-setup', (args, taskCtx) => ({ kind: 'agent', title: `Mock Server Setup - ${args.projectName}`, agent: { name: 'msw-developer', prompt: { role: 'MSW Developer', task: 'Set up mock server', context: args, instructions: ['1. Install MSW', '2. Configure handlers', '3. Set up request matching', '4. Configure responses', '5. Set up scenarios', '6. Configure delays', '7. Set up errors', '8. Configure persistence', '9. Set up browser/node', '10. Document setup'], outputFormat: 'JSON with mock server setup' }, outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'testing', 'api', 'msw'] }));

export const integrationTestsTask = defineTask('integration-tests', (args, taskCtx) => ({ kind: 'agent', title: `Integration Tests - ${args.projectName}`, agent: { name: 'api-testing-specialist', prompt: { role: 'API Testing Specialist', task: 'Create integration tests', context: args, instructions: ['1. Create CRUD tests', '2. Test authentication', '3. Test pagination', '4. Test filtering', '5. Test error responses', '6. Test timeouts', '7. Test retries', '8. Test caching', '9. Create test utilities', '10. Document tests'], outputFormat: 'JSON with integration tests' }, outputSchema: { type: 'object', required: ['suites', 'artifacts'], properties: { suites: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'testing', 'api', 'integration'] }));

export const contractTestsTask = defineTask('contract-tests', (args, taskCtx) => ({ kind: 'agent', title: `Contract Tests - ${args.projectName}`, agent: { name: 'contract-testing-specialist', prompt: { role: 'Contract Testing Specialist', task: 'Create contract tests', context: args, instructions: ['1. Set up contract testing', '2. Define API contracts', '3. Create consumer tests', '4. Create provider tests', '5. Configure verification', '6. Set up CI integration', '7. Configure versioning', '8. Set up breaking change detection', '9. Create contract utilities', '10. Document contracts'], outputFormat: 'JSON with contract tests' }, outputSchema: { type: 'object', required: ['contracts', 'artifacts'], properties: { contracts: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'testing', 'api', 'contracts'] }));

export const errorHandlingTestsTask = defineTask('error-handling-tests', (args, taskCtx) => ({ kind: 'agent', title: `Error Handling Tests - ${args.projectName}`, agent: { name: 'error-testing-specialist', prompt: { role: 'Error Testing Specialist', task: 'Create error handling tests', context: args, instructions: ['1. Test network errors', '2. Test HTTP errors', '3. Test validation errors', '4. Test timeout handling', '5. Test retry logic', '6. Test error boundaries', '7. Test error logging', '8. Test user feedback', '9. Create error scenarios', '10. Document error tests'], outputFormat: 'JSON with error tests' }, outputSchema: { type: 'object', required: ['tests', 'artifacts'], properties: { tests: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'testing', 'api', 'errors'] }));

export const documentationTask = defineTask('api-testing-documentation', (args, taskCtx) => ({ kind: 'agent', title: `Documentation - ${args.projectName}`, agent: { name: 'technical-writer-agent', prompt: { role: 'Technical Writer', task: 'Generate API testing documentation', context: args, instructions: ['1. Create README', '2. Document mock server', '3. Create test guide', '4. Document contracts', '5. Create error guide', '6. Document CI setup', '7. Create troubleshooting', '8. Document best practices', '9. Create examples', '10. Generate templates'], outputFormat: 'JSON with documentation' }, outputSchema: { type: 'object', required: ['docs', 'artifacts'], properties: { docs: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'testing', 'documentation'] }));
