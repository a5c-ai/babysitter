/**
 * @process specializations/cli-mcp-development/mcp-tool-documentation
 * @description MCP Tool Documentation - Generate comprehensive documentation for MCP tools including
 * schemas, examples, and integration guides for LLM consumers.
 * @inputs { projectName: string, language: string, tools?: array, outputFormats?: array }
 * @outputs { success: boolean, toolDocs: array, schemaRefs: array, integrationGuide: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/cli-mcp-development/mcp-tool-documentation', {
 *   projectName: 'database-mcp-server',
 *   language: 'typescript',
 *   tools: ['query', 'insert', 'update', 'delete'],
 *   outputFormats: ['markdown', 'json-schema', 'openapi']
 * });
 *
 * @references
 * - MCP Tool Schemas: https://modelcontextprotocol.io/docs/concepts/tools
 * - JSON Schema: https://json-schema.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    language = 'typescript',
    tools = [],
    outputFormats = ['markdown', 'json-schema'],
    outputDir = 'mcp-tool-documentation'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting MCP Tool Documentation: ${projectName}`);

  const toolInventory = await ctx.task(toolInventoryTask, { projectName, tools, outputDir });
  artifacts.push(...toolInventory.artifacts);

  const schemaDocumentation = await ctx.task(schemaDocumentationTask, { projectName, tools, outputDir });
  artifacts.push(...schemaDocumentation.artifacts);

  const exampleGeneration = await ctx.task(exampleGenerationTask, { projectName, tools, language, outputDir });
  artifacts.push(...exampleGeneration.artifacts);

  const errorDocumentation = await ctx.task(errorDocumentationTask, { projectName, tools, outputDir });
  artifacts.push(...errorDocumentation.artifacts);

  const integrationGuide = await ctx.task(integrationGuideTask, { projectName, tools, outputDir });
  artifacts.push(...integrationGuide.artifacts);

  const llmPromptGuide = await ctx.task(llmPromptGuideTask, { projectName, tools, outputDir });
  artifacts.push(...llmPromptGuide.artifacts);

  const versioningStrategy = await ctx.task(versioningStrategyTask, { projectName, outputDir });
  artifacts.push(...versioningStrategy.artifacts);

  const apiReference = await ctx.task(apiReferenceTask, { projectName, tools, outputFormats, outputDir });
  artifacts.push(...apiReference.artifacts);

  const changelogDocs = await ctx.task(changelogDocsTask, { projectName, outputDir });
  artifacts.push(...changelogDocs.artifacts);

  const publishingSetup = await ctx.task(publishingSetupTask, { projectName, outputFormats, outputDir });
  artifacts.push(...publishingSetup.artifacts);

  await ctx.breakpoint({
    question: `MCP Tool Documentation complete for ${tools.length || 'all'} tools. Review and approve?`,
    title: 'MCP Tool Documentation Complete',
    context: { runId: ctx.runId, summary: { projectName, tools, outputFormats } }
  });

  return {
    success: true,
    projectName,
    toolDocs: toolInventory.tools,
    schemaRefs: schemaDocumentation.schemas,
    integrationGuide: { path: integrationGuide.guidePath },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/cli-mcp-development/mcp-tool-documentation', timestamp: startTime }
  };
}

export const toolInventoryTask = defineTask('tool-inventory', (args, taskCtx) => ({
  kind: 'agent',
  title: `Tool Inventory - ${args.projectName}`,
  agent: {
    name: 'mcp-tool-documenter',
    prompt: { role: 'MCP Tool Documentation Specialist', task: 'Create tool inventory', context: args, instructions: ['1. List all tools', '2. Categorize by function', '3. Document capabilities', '4. Identify dependencies', '5. Generate inventory'], outputFormat: 'JSON with tool inventory' },
    outputSchema: { type: 'object', required: ['tools', 'artifacts'], properties: { tools: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['mcp', 'documentation', 'inventory']
}));

export const schemaDocumentationTask = defineTask('schema-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Schema Documentation - ${args.projectName}`,
  agent: {
    name: 'mcp-tool-documenter',
    prompt: { role: 'MCP Schema Documentation Specialist', task: 'Document tool schemas', context: args, instructions: ['1. Document input schemas', '2. Document output schemas', '3. Add validation rules', '4. Create schema examples', '5. Generate schema docs'], outputFormat: 'JSON with schema documentation' },
    outputSchema: { type: 'object', required: ['schemas', 'artifacts'], properties: { schemas: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['mcp', 'documentation', 'schema']
}));

export const exampleGenerationTask = defineTask('example-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Example Generation - ${args.projectName}`,
  agent: {
    name: 'mcp-tool-documenter',
    prompt: { role: 'MCP Example Generator', task: 'Create tool usage examples', context: args, instructions: ['1. Create basic examples', '2. Create advanced examples', '3. Show error handling', '4. Document edge cases', '5. Generate example suite'], outputFormat: 'JSON with examples' },
    outputSchema: { type: 'object', required: ['examples', 'artifacts'], properties: { examples: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['mcp', 'documentation', 'examples']
}));

export const errorDocumentationTask = defineTask('error-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Error Documentation - ${args.projectName}`,
  agent: {
    name: 'mcp-tool-documenter',
    prompt: { role: 'MCP Error Documentation Specialist', task: 'Document error scenarios', context: args, instructions: ['1. Document error codes', '2. Document error messages', '3. Add troubleshooting', '4. Document recovery steps', '5. Generate error docs'], outputFormat: 'JSON with error documentation' },
    outputSchema: { type: 'object', required: ['errorDocs', 'artifacts'], properties: { errorDocs: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['mcp', 'documentation', 'errors']
}));

export const integrationGuideTask = defineTask('integration-guide', (args, taskCtx) => ({
  kind: 'agent',
  title: `Integration Guide - ${args.projectName}`,
  agent: {
    name: 'mcp-tool-documenter',
    prompt: { role: 'MCP Integration Guide Author', task: 'Create integration guide', context: args, instructions: ['1. Document setup steps', '2. Document configuration', '3. Add client examples', '4. Document authentication', '5. Generate integration guide'], outputFormat: 'JSON with integration guide' },
    outputSchema: { type: 'object', required: ['guidePath', 'artifacts'], properties: { guidePath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['mcp', 'documentation', 'integration']
}));

export const llmPromptGuideTask = defineTask('llm-prompt-guide', (args, taskCtx) => ({
  kind: 'agent',
  title: `LLM Prompt Guide - ${args.projectName}`,
  agent: {
    name: 'mcp-tool-documenter',
    prompt: { role: 'LLM Integration Specialist', task: 'Create LLM prompt guide', context: args, instructions: ['1. Document tool descriptions', '2. Create prompt examples', '3. Document best practices', '4. Add context patterns', '5. Generate LLM guide'], outputFormat: 'JSON with LLM guide' },
    outputSchema: { type: 'object', required: ['llmGuidePath', 'artifacts'], properties: { llmGuidePath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['mcp', 'documentation', 'llm']
}));

export const versioningStrategyTask = defineTask('versioning-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Versioning Strategy - ${args.projectName}`,
  agent: {
    name: 'mcp-tool-documenter',
    prompt: { role: 'API Versioning Specialist', task: 'Define versioning strategy', context: args, instructions: ['1. Define version scheme', '2. Document deprecation', '3. Plan migrations', '4. Document compatibility', '5. Generate versioning docs'], outputFormat: 'JSON with versioning strategy' },
    outputSchema: { type: 'object', required: ['versioningConfig', 'artifacts'], properties: { versioningConfig: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['mcp', 'documentation', 'versioning']
}));

export const apiReferenceTask = defineTask('api-reference', (args, taskCtx) => ({
  kind: 'agent',
  title: `API Reference - ${args.projectName}`,
  agent: {
    name: 'mcp-tool-documenter',
    prompt: { role: 'API Reference Author', task: 'Create API reference', context: args, instructions: ['1. Document all endpoints', '2. Document parameters', '3. Document responses', '4. Add code samples', '5. Generate API reference'], outputFormat: 'JSON with API reference' },
    outputSchema: { type: 'object', required: ['apiRefPath', 'artifacts'], properties: { apiRefPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['mcp', 'documentation', 'api-reference']
}));

export const changelogDocsTask = defineTask('changelog-docs', (args, taskCtx) => ({
  kind: 'agent',
  title: `Changelog Documentation - ${args.projectName}`,
  agent: {
    name: 'mcp-tool-documenter',
    prompt: { role: 'Changelog Documentation Specialist', task: 'Set up changelog documentation', context: args, instructions: ['1. Create changelog template', '2. Document change types', '3. Set up automation', '4. Add release notes template', '5. Generate changelog docs'], outputFormat: 'JSON with changelog setup' },
    outputSchema: { type: 'object', required: ['changelogPath', 'artifacts'], properties: { changelogPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['mcp', 'documentation', 'changelog']
}));

export const publishingSetupTask = defineTask('publishing-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Publishing Setup - ${args.projectName}`,
  agent: {
    name: 'mcp-protocol-expert',
    prompt: { role: 'Documentation Publishing Specialist', task: 'Set up documentation publishing', context: args, instructions: ['1. Configure doc site', '2. Set up CI/CD', '3. Configure search', '4. Add versioning', '5. Generate publishing config'], outputFormat: 'JSON with publishing setup' },
    outputSchema: { type: 'object', required: ['publishingConfig', 'artifacts'], properties: { publishingConfig: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['mcp', 'documentation', 'publishing']
}));
