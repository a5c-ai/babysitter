/**
 * @process specializations/cli-mcp-development/mcp-server-registry-discovery
 * @description MCP Server Registry and Discovery - Implement server registration, discovery mechanisms,
 * and configuration management for MCP server ecosystems.
 * @inputs { projectName: string, language: string, registryType?: string, features?: array }
 * @outputs { success: boolean, registry: object, discovery: object, documentation: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/cli-mcp-development/mcp-server-registry-discovery', {
 *   projectName: 'mcp-registry',
 *   language: 'typescript',
 *   registryType: 'local',
 *   features: ['auto-discovery', 'health-check', 'versioning', 'tagging']
 * });
 *
 * @references
 * - MCP Server Registry: https://modelcontextprotocol.io/docs/registry
 * - Service Discovery: https://microservices.io/patterns/server-side-discovery.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    language = 'typescript',
    registryType = 'local',
    features = ['auto-discovery', 'health-check'],
    outputDir = 'mcp-server-registry-discovery'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting MCP Server Registry and Discovery: ${projectName}`);

  const registryArchitecture = await ctx.task(registryArchitectureTask, { projectName, language, registryType, outputDir });
  artifacts.push(...registryArchitecture.artifacts);

  const serverRegistration = await ctx.task(serverRegistrationTask, { projectName, language, outputDir });
  artifacts.push(...serverRegistration.artifacts);

  const discoveryMechanism = await ctx.task(discoveryMechanismTask, { projectName, language, outputDir });
  artifacts.push(...discoveryMechanism.artifacts);

  const configurationStorage = await ctx.task(configurationStorageTask, { projectName, language, outputDir });
  artifacts.push(...configurationStorage.artifacts);

  const healthChecking = await ctx.task(healthCheckingTask, { projectName, language, outputDir });
  artifacts.push(...healthChecking.artifacts);

  const versionManagement = await ctx.task(registryVersionManagementTask, { projectName, language, outputDir });
  artifacts.push(...versionManagement.artifacts);

  const taggingCategorization = await ctx.task(taggingCategorizationTask, { projectName, language, outputDir });
  artifacts.push(...taggingCategorization.artifacts);

  const registryApi = await ctx.task(registryApiTask, { projectName, language, outputDir });
  artifacts.push(...registryApi.artifacts);

  const registryTesting = await ctx.task(registryTestingTask, { projectName, language, outputDir });
  artifacts.push(...registryTesting.artifacts);

  const registryDocumentation = await ctx.task(registryDocumentationTask, { projectName, registryType, features, outputDir });
  artifacts.push(...registryDocumentation.artifacts);

  await ctx.breakpoint({
    question: `MCP Server Registry and Discovery complete with ${features.length} features. Review and approve?`,
    title: 'MCP Registry Complete',
    context: { runId: ctx.runId, summary: { projectName, registryType, features } }
  });

  return {
    success: true,
    projectName,
    registry: { type: registryType, configPath: registryArchitecture.configPath },
    discovery: { path: discoveryMechanism.discoveryPath },
    documentation: { path: registryDocumentation.docPath },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/cli-mcp-development/mcp-server-registry-discovery', timestamp: startTime }
  };
}

export const registryArchitectureTask = defineTask('registry-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Registry Architecture - ${args.projectName}`,
  agent: {
    name: 'mcp-protocol-expert',
    prompt: { role: 'MCP Registry Architecture Specialist', task: 'Design registry architecture', context: args, instructions: ['1. Define registry structure', '2. Plan storage strategy', '3. Design discovery protocol', '4. Plan scaling approach', '5. Generate architecture doc'], outputFormat: 'JSON with registry architecture' },
    outputSchema: { type: 'object', required: ['configPath', 'artifacts'], properties: { configPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['mcp', 'registry', 'architecture']
}));

export const serverRegistrationTask = defineTask('server-registration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Server Registration - ${args.projectName}`,
  agent: {
    name: 'mcp-protocol-expert',
    prompt: { role: 'MCP Registration Specialist', task: 'Implement server registration', context: args, instructions: ['1. Define registration schema', '2. Implement registration API', '3. Handle deregistration', '4. Add validation', '5. Generate registration code'], outputFormat: 'JSON with server registration' },
    outputSchema: { type: 'object', required: ['registrationPath', 'artifacts'], properties: { registrationPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['mcp', 'registry', 'registration']
}));

export const discoveryMechanismTask = defineTask('discovery-mechanism', (args, taskCtx) => ({
  kind: 'agent',
  title: `Discovery Mechanism - ${args.projectName}`,
  agent: {
    name: 'mcp-protocol-expert',
    prompt: { role: 'MCP Discovery Specialist', task: 'Implement discovery mechanism', context: args, instructions: ['1. Implement local discovery', '2. Add network discovery', '3. Support filtering', '4. Cache results', '5. Generate discovery code'], outputFormat: 'JSON with discovery mechanism' },
    outputSchema: { type: 'object', required: ['discoveryPath', 'artifacts'], properties: { discoveryPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['mcp', 'registry', 'discovery']
}));

export const configurationStorageTask = defineTask('configuration-storage', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configuration Storage - ${args.projectName}`,
  agent: {
    name: 'mcp-protocol-expert',
    prompt: { role: 'Configuration Storage Specialist', task: 'Implement configuration storage', context: args, instructions: ['1. Design config schema', '2. Implement file storage', '3. Add database backend', '4. Handle migrations', '5. Generate storage code'], outputFormat: 'JSON with configuration storage' },
    outputSchema: { type: 'object', required: ['storagePath', 'artifacts'], properties: { storagePath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['mcp', 'registry', 'storage']
}));

export const healthCheckingTask = defineTask('health-checking', (args, taskCtx) => ({
  kind: 'agent',
  title: `Health Checking - ${args.projectName}`,
  agent: {
    name: 'mcp-protocol-expert',
    prompt: { role: 'Health Check Specialist', task: 'Implement health checking', context: args, instructions: ['1. Define health endpoints', '2. Implement health checks', '3. Track server status', '4. Handle failures', '5. Generate health check code'], outputFormat: 'JSON with health checking' },
    outputSchema: { type: 'object', required: ['healthPath', 'artifacts'], properties: { healthPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['mcp', 'registry', 'health']
}));

export const registryVersionManagementTask = defineTask('registry-version-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Version Management - ${args.projectName}`,
  agent: {
    name: 'mcp-protocol-expert',
    prompt: { role: 'Version Management Specialist', task: 'Implement version management', context: args, instructions: ['1. Track server versions', '2. Support version constraints', '3. Handle version conflicts', '4. Implement version history', '5. Generate versioning code'], outputFormat: 'JSON with version management' },
    outputSchema: { type: 'object', required: ['versionPath', 'artifacts'], properties: { versionPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['mcp', 'registry', 'versioning']
}));

export const taggingCategorizationTask = defineTask('tagging-categorization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Tagging and Categorization - ${args.projectName}`,
  agent: {
    name: 'mcp-protocol-expert',
    prompt: { role: 'Tagging Specialist', task: 'Implement tagging system', context: args, instructions: ['1. Define tag schema', '2. Implement tag assignment', '3. Support categories', '4. Enable tag search', '5. Generate tagging code'], outputFormat: 'JSON with tagging system' },
    outputSchema: { type: 'object', required: ['taggingPath', 'artifacts'], properties: { taggingPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['mcp', 'registry', 'tagging']
}));

export const registryApiTask = defineTask('registry-api', (args, taskCtx) => ({
  kind: 'agent',
  title: `Registry API - ${args.projectName}`,
  agent: {
    name: 'mcp-protocol-expert',
    prompt: { role: 'Registry API Specialist', task: 'Implement registry API', context: args, instructions: ['1. Design RESTful API', '2. Implement CRUD operations', '3. Add search endpoints', '4. Add authentication', '5. Generate API code'], outputFormat: 'JSON with registry API' },
    outputSchema: { type: 'object', required: ['apiPath', 'artifacts'], properties: { apiPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['mcp', 'registry', 'api']
}));

export const registryTestingTask = defineTask('registry-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Registry Testing - ${args.projectName}`,
  agent: {
    name: 'mcp-testing-expert',
    prompt: { role: 'Registry Testing Specialist', task: 'Create registry test suite', context: args, instructions: ['1. Test registration', '2. Test discovery', '3. Test health checks', '4. Test versioning', '5. Generate test suite'], outputFormat: 'JSON with registry tests' },
    outputSchema: { type: 'object', required: ['testPath', 'artifacts'], properties: { testPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['mcp', 'registry', 'testing']
}));

export const registryDocumentationTask = defineTask('registry-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Registry Documentation - ${args.projectName}`,
  agent: {
    name: 'mcp-tool-documenter',
    prompt: { role: 'Registry Documentation Specialist', task: 'Document registry system', context: args, instructions: ['1. Document architecture', '2. Document API reference', '3. Add registration guide', '4. Add discovery examples', '5. Generate documentation'], outputFormat: 'JSON with registry documentation' },
    outputSchema: { type: 'object', required: ['docPath', 'artifacts'], properties: { docPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['mcp', 'registry', 'documentation']
}));
