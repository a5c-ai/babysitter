/**
 * @process specializations/cli-mcp-development/mcp-server-testing-suite
 * @description MCP Server Testing Suite - Create testing infrastructure for MCP servers including unit tests,
 * integration tests, mock clients, and security tests.
 * @inputs { projectName: string, language: string, testFramework?: string, capabilities?: array }
 * @outputs { success: boolean, testConfig: object, mockClient: object, testSuites: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/cli-mcp-development/mcp-server-testing-suite', {
 *   projectName: 'file-mcp-server',
 *   language: 'typescript',
 *   testFramework: 'jest',
 *   capabilities: ['tools', 'resources']
 * });
 *
 * @references
 * - MCP Testing: https://modelcontextprotocol.io/docs/testing
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    language = 'typescript',
    testFramework = 'jest',
    capabilities = ['tools', 'resources'],
    outputDir = 'mcp-server-testing-suite'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting MCP Server Testing Suite: ${projectName}`);

  const testUtilities = await ctx.task(testUtilitiesTask, { projectName, language, testFramework, outputDir });
  artifacts.push(...testUtilities.artifacts);

  const mockMcpClient = await ctx.task(mockMcpClientTask, { projectName, language, outputDir });
  artifacts.push(...mockMcpClient.artifacts);

  const toolExecutionTests = await ctx.task(toolExecutionTestsTask, { projectName, language, testFramework, capabilities, outputDir });
  artifacts.push(...toolExecutionTests.artifacts);

  const resourceAccessTests = await ctx.task(resourceAccessTestsTask, { projectName, language, testFramework, capabilities, outputDir });
  artifacts.push(...resourceAccessTests.artifacts);

  const transportLayerTests = await ctx.task(transportLayerTestsTask, { projectName, language, testFramework, outputDir });
  artifacts.push(...transportLayerTests.artifacts);

  const errorScenarioTests = await ctx.task(errorScenarioTestsTask, { projectName, language, testFramework, outputDir });
  artifacts.push(...errorScenarioTests.artifacts);

  const schemaValidationTests = await ctx.task(schemaValidationTestsTask, { projectName, language, testFramework, outputDir });
  artifacts.push(...schemaValidationTests.artifacts);

  const performanceTests = await ctx.task(mcpPerformanceTestsTask, { projectName, language, outputDir });
  artifacts.push(...performanceTests.artifacts);

  const securityTests = await ctx.task(mcpSecurityTestsTask, { projectName, language, outputDir });
  artifacts.push(...securityTests.artifacts);

  const integrationTestEnv = await ctx.task(integrationTestEnvTask, { projectName, language, outputDir });
  artifacts.push(...integrationTestEnv.artifacts);

  const documentation = await ctx.task(mcpTestDocumentationTask, { projectName, testFramework, capabilities, outputDir });
  artifacts.push(...documentation.artifacts);

  await ctx.breakpoint({
    question: `MCP Server Testing Suite complete with mock client and ${capabilities.length} capability tests. Review and approve?`,
    title: 'MCP Testing Suite Complete',
    context: { runId: ctx.runId, summary: { projectName, testFramework, capabilities } }
  });

  return {
    success: true,
    projectName,
    testConfig: { framework: testFramework, configPath: testUtilities.configPath },
    mockClient: { path: mockMcpClient.clientPath },
    testSuites: ['tools', 'resources', 'transport', 'error', 'schema', 'performance', 'security'],
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/cli-mcp-development/mcp-server-testing-suite', timestamp: startTime }
  };
}

export const testUtilitiesTask = defineTask('test-utilities', (args, taskCtx) => ({
  kind: 'agent',
  title: `Test Utilities - ${args.projectName}`,
  agent: {
    name: 'mcp-testing-expert',
    prompt: { role: 'MCP Testing Specialist', task: 'Set up MCP testing utilities', context: args, instructions: ['1. Configure test framework', '2. Create MCP test helpers', '3. Set up test fixtures', '4. Configure coverage', '5. Generate test utilities'], outputFormat: 'JSON with test utilities' },
    outputSchema: { type: 'object', required: ['configPath', 'artifacts'], properties: { configPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['mcp', 'testing', 'utilities']
}));

export const mockMcpClientTask = defineTask('mock-mcp-client', (args, taskCtx) => ({
  kind: 'agent',
  title: `Mock MCP Client - ${args.projectName}`,
  agent: {
    name: 'mcp-testing-expert',
    prompt: { role: 'MCP Mock Client Developer', task: 'Create mock MCP client', context: args, instructions: ['1. Create MockClient class', '2. Implement tool invocation', '3. Implement resource fetching', '4. Add response capture', '5. Generate mock client'], outputFormat: 'JSON with mock client' },
    outputSchema: { type: 'object', required: ['clientPath', 'artifacts'], properties: { clientPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['mcp', 'testing', 'mock-client']
}));

export const toolExecutionTestsTask = defineTask('tool-execution-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Tool Execution Tests - ${args.projectName}`,
  agent: {
    name: 'mcp-testing-expert',
    prompt: { role: 'MCP Tool Testing Specialist', task: 'Implement tool execution tests', context: args, instructions: ['1. Test tool listing', '2. Test tool invocation', '3. Test parameter validation', '4. Test tool responses', '5. Generate tool tests'], outputFormat: 'JSON with tool tests' },
    outputSchema: { type: 'object', required: ['testFilePath', 'artifacts'], properties: { testFilePath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['mcp', 'testing', 'tools']
}));

export const resourceAccessTestsTask = defineTask('resource-access-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Resource Access Tests - ${args.projectName}`,
  agent: {
    name: 'mcp-testing-expert',
    prompt: { role: 'MCP Resource Testing Specialist', task: 'Add resource access tests', context: args, instructions: ['1. Test resource listing', '2. Test resource reading', '3. Test URI parsing', '4. Test MIME types', '5. Generate resource tests'], outputFormat: 'JSON with resource tests' },
    outputSchema: { type: 'object', required: ['testFilePath', 'artifacts'], properties: { testFilePath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['mcp', 'testing', 'resources']
}));

export const transportLayerTestsTask = defineTask('transport-layer-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Transport Layer Tests - ${args.projectName}`,
  agent: {
    name: 'mcp-testing-expert',
    prompt: { role: 'MCP Transport Testing Specialist', task: 'Create transport layer tests', context: args, instructions: ['1. Test stdio transport', '2. Test message serialization', '3. Test connection lifecycle', '4. Test error propagation', '5. Generate transport tests'], outputFormat: 'JSON with transport tests' },
    outputSchema: { type: 'object', required: ['testFilePath', 'artifacts'], properties: { testFilePath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['mcp', 'testing', 'transport']
}));

export const errorScenarioTestsTask = defineTask('error-scenario-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Error Scenario Tests - ${args.projectName}`,
  agent: {
    name: 'mcp-testing-expert',
    prompt: { role: 'MCP Error Testing Specialist', task: 'Implement error scenario tests', context: args, instructions: ['1. Test invalid requests', '2. Test unknown tools', '3. Test missing resources', '4. Test error codes', '5. Generate error tests'], outputFormat: 'JSON with error tests' },
    outputSchema: { type: 'object', required: ['testFilePath', 'artifacts'], properties: { testFilePath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['mcp', 'testing', 'errors']
}));

export const schemaValidationTestsTask = defineTask('schema-validation-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Schema Validation Tests - ${args.projectName}`,
  agent: {
    name: 'mcp-testing-expert',
    prompt: { role: 'MCP Schema Testing Specialist', task: 'Add schema validation tests', context: args, instructions: ['1. Test tool schemas', '2. Test resource schemas', '3. Test request validation', '4. Test response schemas', '5. Generate schema tests'], outputFormat: 'JSON with schema tests' },
    outputSchema: { type: 'object', required: ['testFilePath', 'artifacts'], properties: { testFilePath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['mcp', 'testing', 'schema']
}));

export const mcpPerformanceTestsTask = defineTask('mcp-performance-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Performance Tests - ${args.projectName}`,
  agent: {
    name: 'mcp-testing-expert',
    prompt: { role: 'MCP Performance Testing Specialist', task: 'Create performance tests', context: args, instructions: ['1. Benchmark tool execution', '2. Benchmark resource access', '3. Test concurrent requests', '4. Measure memory usage', '5. Generate performance tests'], outputFormat: 'JSON with performance tests' },
    outputSchema: { type: 'object', required: ['testFilePath', 'artifacts'], properties: { testFilePath: { type: 'string' }, benchmarks: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['mcp', 'testing', 'performance']
}));

export const mcpSecurityTestsTask = defineTask('mcp-security-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Security Tests - ${args.projectName}`,
  agent: {
    name: 'mcp-security-auditor',
    prompt: { role: 'MCP Security Testing Specialist', task: 'Implement security tests', context: args, instructions: ['1. Test path traversal prevention', '2. Test injection prevention', '3. Test rate limiting', '4. Test permission enforcement', '5. Generate security tests'], outputFormat: 'JSON with security tests' },
    outputSchema: { type: 'object', required: ['testFilePath', 'artifacts'], properties: { testFilePath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['mcp', 'testing', 'security']
}));

export const integrationTestEnvTask = defineTask('integration-test-env', (args, taskCtx) => ({
  kind: 'agent',
  title: `Integration Test Environment - ${args.projectName}`,
  agent: {
    name: 'mcp-testing-expert',
    prompt: { role: 'Integration Test Environment Specialist', task: 'Set up integration test environment', context: args, instructions: ['1. Create test server setup', '2. Configure test data', '3. Set up cleanup procedures', '4. Create helper scripts', '5. Generate integration environment'], outputFormat: 'JSON with integration environment' },
    outputSchema: { type: 'object', required: ['envPath', 'artifacts'], properties: { envPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['mcp', 'testing', 'integration']
}));

export const mcpTestDocumentationTask = defineTask('mcp-test-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Test Documentation - ${args.projectName}`,
  agent: {
    name: 'mcp-tool-documenter',
    prompt: { role: 'MCP Testing Documentation Specialist', task: 'Document testing approach', context: args, instructions: ['1. Document test organization', '2. Document mock client usage', '3. Document test patterns', '4. Add testing best practices', '5. Generate documentation'], outputFormat: 'JSON with documentation' },
    outputSchema: { type: 'object', required: ['testDocPath', 'artifacts'], properties: { testDocPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['mcp', 'testing', 'documentation']
}));
