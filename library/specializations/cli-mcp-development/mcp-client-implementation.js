/**
 * @process specializations/cli-mcp-development/mcp-client-implementation
 * @description MCP Client Implementation - Build MCP client libraries for connecting to MCP servers
 * including transport handling, capability negotiation, and tool invocation.
 * @inputs { projectName: string, language: string, transports?: array, features?: array }
 * @outputs { success: boolean, clientLibrary: object, transports: array, documentation: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/cli-mcp-development/mcp-client-implementation', {
 *   projectName: 'mcp-client-lib',
 *   language: 'typescript',
 *   transports: ['stdio', 'sse', 'websocket'],
 *   features: ['tool-invocation', 'resource-access', 'prompts', 'sampling']
 * });
 *
 * @references
 * - MCP Client SDK: https://modelcontextprotocol.io/docs/sdk/client
 * - MCP Transports: https://modelcontextprotocol.io/docs/concepts/transports
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    language = 'typescript',
    transports = ['stdio', 'sse'],
    features = ['tool-invocation', 'resource-access'],
    outputDir = 'mcp-client-implementation'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting MCP Client Implementation: ${projectName}`);

  const clientArchitecture = await ctx.task(clientArchitectureTask, { projectName, language, features, outputDir });
  artifacts.push(...clientArchitecture.artifacts);

  const transportLayer = await ctx.task(clientTransportLayerTask, { projectName, language, transports, outputDir });
  artifacts.push(...transportLayer.artifacts);

  const capabilityNegotiation = await ctx.task(capabilityNegotiationTask, { projectName, language, outputDir });
  artifacts.push(...capabilityNegotiation.artifacts);

  const toolInvocation = await ctx.task(toolInvocationTask, { projectName, language, outputDir });
  artifacts.push(...toolInvocation.artifacts);

  const resourceAccess = await ctx.task(resourceAccessTask, { projectName, language, outputDir });
  artifacts.push(...resourceAccess.artifacts);

  const promptHandling = await ctx.task(promptHandlingTask, { projectName, language, outputDir });
  artifacts.push(...promptHandling.artifacts);

  const connectionManagement = await ctx.task(connectionManagementTask, { projectName, language, outputDir });
  artifacts.push(...connectionManagement.artifacts);

  const errorHandling = await ctx.task(clientErrorHandlingTask, { projectName, language, outputDir });
  artifacts.push(...errorHandling.artifacts);

  const clientTesting = await ctx.task(clientTestingTask, { projectName, language, transports, outputDir });
  artifacts.push(...clientTesting.artifacts);

  const clientDocumentation = await ctx.task(clientDocumentationTask, { projectName, language, features, outputDir });
  artifacts.push(...clientDocumentation.artifacts);

  await ctx.breakpoint({
    question: `MCP Client Implementation complete with ${transports.length} transports. Review and approve?`,
    title: 'MCP Client Complete',
    context: { runId: ctx.runId, summary: { projectName, transports, features } }
  });

  return {
    success: true,
    projectName,
    clientLibrary: { configPath: clientArchitecture.configPath },
    transports,
    documentation: { path: clientDocumentation.docPath },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/cli-mcp-development/mcp-client-implementation', timestamp: startTime }
  };
}

export const clientArchitectureTask = defineTask('client-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Client Architecture - ${args.projectName}`,
  agent: {
    name: 'mcp-protocol-expert',
    prompt: { role: 'MCP Client Architecture Specialist', task: 'Design client architecture', context: args, instructions: ['1. Define client structure', '2. Plan transport abstraction', '3. Design capability handling', '4. Plan extension points', '5. Generate architecture doc'], outputFormat: 'JSON with client architecture' },
    outputSchema: { type: 'object', required: ['configPath', 'artifacts'], properties: { configPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['mcp', 'client', 'architecture']
}));

export const clientTransportLayerTask = defineTask('client-transport-layer', (args, taskCtx) => ({
  kind: 'agent',
  title: `Transport Layer - ${args.projectName}`,
  agent: {
    name: 'mcp-transport-architect',
    prompt: { role: 'MCP Transport Specialist', task: 'Implement transport layer', context: args, instructions: ['1. Implement stdio transport', '2. Implement SSE transport', '3. Add WebSocket transport', '4. Handle reconnection', '5. Generate transport code'], outputFormat: 'JSON with transport layer' },
    outputSchema: { type: 'object', required: ['transportPaths', 'artifacts'], properties: { transportPaths: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['mcp', 'client', 'transport']
}));

export const capabilityNegotiationTask = defineTask('capability-negotiation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Capability Negotiation - ${args.projectName}`,
  agent: {
    name: 'mcp-transport-architect',
    prompt: { role: 'MCP Capability Specialist', task: 'Implement capability negotiation', context: args, instructions: ['1. Handle initialize request', '2. Negotiate capabilities', '3. Track server capabilities', '4. Handle version differences', '5. Generate negotiation code'], outputFormat: 'JSON with capability negotiation' },
    outputSchema: { type: 'object', required: ['negotiationPath', 'artifacts'], properties: { negotiationPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['mcp', 'client', 'capabilities']
}));

export const toolInvocationTask = defineTask('tool-invocation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Tool Invocation - ${args.projectName}`,
  agent: {
    name: 'mcp-transport-architect',
    prompt: { role: 'MCP Tool Invocation Specialist', task: 'Implement tool invocation', context: args, instructions: ['1. List available tools', '2. Invoke tools with arguments', '3. Handle tool responses', '4. Validate schemas', '5. Generate tool invocation code'], outputFormat: 'JSON with tool invocation' },
    outputSchema: { type: 'object', required: ['toolPath', 'artifacts'], properties: { toolPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['mcp', 'client', 'tools']
}));

export const resourceAccessTask = defineTask('resource-access', (args, taskCtx) => ({
  kind: 'agent',
  title: `Resource Access - ${args.projectName}`,
  agent: {
    name: 'mcp-transport-architect',
    prompt: { role: 'MCP Resource Specialist', task: 'Implement resource access', context: args, instructions: ['1. List resources', '2. Read resources', '3. Handle templates', '4. Subscribe to resources', '5. Generate resource code'], outputFormat: 'JSON with resource access' },
    outputSchema: { type: 'object', required: ['resourcePath', 'artifacts'], properties: { resourcePath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['mcp', 'client', 'resources']
}));

export const promptHandlingTask = defineTask('prompt-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Prompt Handling - ${args.projectName}`,
  agent: {
    name: 'mcp-transport-architect',
    prompt: { role: 'MCP Prompt Specialist', task: 'Implement prompt handling', context: args, instructions: ['1. List prompts', '2. Get prompt templates', '3. Handle prompt arguments', '4. Process prompt results', '5. Generate prompt code'], outputFormat: 'JSON with prompt handling' },
    outputSchema: { type: 'object', required: ['promptPath', 'artifacts'], properties: { promptPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['mcp', 'client', 'prompts']
}));

export const connectionManagementTask = defineTask('connection-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Connection Management - ${args.projectName}`,
  agent: {
    name: 'mcp-transport-architect',
    prompt: { role: 'Connection Management Specialist', task: 'Implement connection management', context: args, instructions: ['1. Handle connection lifecycle', '2. Implement reconnection', '3. Manage multiple connections', '4. Handle timeouts', '5. Generate connection code'], outputFormat: 'JSON with connection management' },
    outputSchema: { type: 'object', required: ['connectionPath', 'artifacts'], properties: { connectionPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['mcp', 'client', 'connection']
}));

export const clientErrorHandlingTask = defineTask('client-error-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Error Handling - ${args.projectName}`,
  agent: {
    name: 'mcp-transport-architect',
    prompt: { role: 'MCP Error Handling Specialist', task: 'Implement client error handling', context: args, instructions: ['1. Handle JSON-RPC errors', '2. Handle transport errors', '3. Create typed errors', '4. Implement retry logic', '5. Generate error handling code'], outputFormat: 'JSON with error handling' },
    outputSchema: { type: 'object', required: ['errorPath', 'artifacts'], properties: { errorPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['mcp', 'client', 'errors']
}));

export const clientTestingTask = defineTask('client-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Client Testing - ${args.projectName}`,
  agent: {
    name: 'mcp-testing-expert',
    prompt: { role: 'MCP Client Testing Specialist', task: 'Create client test suite', context: args, instructions: ['1. Create mock servers', '2. Test all transports', '3. Test tool invocation', '4. Test error scenarios', '5. Generate test suite'], outputFormat: 'JSON with client tests' },
    outputSchema: { type: 'object', required: ['testPath', 'artifacts'], properties: { testPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['mcp', 'client', 'testing']
}));

export const clientDocumentationTask = defineTask('client-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Client Documentation - ${args.projectName}`,
  agent: {
    name: 'mcp-tool-documenter',
    prompt: { role: 'MCP Client Documentation Specialist', task: 'Document MCP client library', context: args, instructions: ['1. Document installation', '2. Document API reference', '3. Add usage examples', '4. Document transports', '5. Generate documentation'], outputFormat: 'JSON with client documentation' },
    outputSchema: { type: 'object', required: ['docPath', 'artifacts'], properties: { docPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['mcp', 'client', 'documentation']
}));
