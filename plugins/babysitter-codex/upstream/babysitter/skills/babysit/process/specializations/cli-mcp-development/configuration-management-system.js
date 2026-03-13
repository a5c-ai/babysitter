/**
 * @process specializations/cli-mcp-development/configuration-management-system
 * @description Configuration Management System - Implement hierarchical configuration loading
 * from files, environment variables, and command-line arguments with validation.
 * @inputs { projectName: string, language: string, configFormats?: array, features?: array }
 * @outputs { success: boolean, configSystem: object, validation: object, documentation: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/cli-mcp-development/configuration-management-system', {
 *   projectName: 'my-cli-app',
 *   language: 'typescript',
 *   configFormats: ['json', 'yaml', 'toml', 'env'],
 *   features: ['hierarchical', 'validation', 'secrets', 'watch']
 * });
 *
 * @references
 * - node-config: https://github.com/node-config/node-config
 * - Viper (Go): https://github.com/spf13/viper
 * - python-decouple: https://github.com/HBNetwork/python-decouple
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    language = 'typescript',
    configFormats = ['json', 'yaml', 'env'],
    features = ['hierarchical', 'validation'],
    outputDir = 'configuration-management-system'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Configuration Management System: ${projectName}`);

  const configArchitecture = await ctx.task(configArchitectureTask, { projectName, language, configFormats, outputDir });
  artifacts.push(...configArchitecture.artifacts);

  const fileLoading = await ctx.task(fileLoadingTask, { projectName, language, configFormats, outputDir });
  artifacts.push(...fileLoading.artifacts);

  const envVarIntegration = await ctx.task(envVarIntegrationTask, { projectName, language, outputDir });
  artifacts.push(...envVarIntegration.artifacts);

  const hierarchicalMerging = await ctx.task(hierarchicalMergingTask, { projectName, language, outputDir });
  artifacts.push(...hierarchicalMerging.artifacts);

  const schemaValidation = await ctx.task(schemaValidationTask, { projectName, language, outputDir });
  artifacts.push(...schemaValidation.artifacts);

  const secretsManagement = await ctx.task(configSecretsManagementTask, { projectName, language, outputDir });
  artifacts.push(...secretsManagement.artifacts);

  const configWatching = await ctx.task(configWatchingTask, { projectName, language, outputDir });
  artifacts.push(...configWatching.artifacts);

  const defaultsGeneration = await ctx.task(defaultsGenerationTask, { projectName, language, outputDir });
  artifacts.push(...defaultsGeneration.artifacts);

  const configTesting = await ctx.task(configTestingTask, { projectName, language, outputDir });
  artifacts.push(...configTesting.artifacts);

  const configDocumentation = await ctx.task(configDocumentationTask, { projectName, configFormats, outputDir });
  artifacts.push(...configDocumentation.artifacts);

  await ctx.breakpoint({
    question: `Configuration Management System complete with ${configFormats.length} formats. Review and approve?`,
    title: 'Configuration System Complete',
    context: { runId: ctx.runId, summary: { projectName, configFormats, features } }
  });

  return {
    success: true,
    projectName,
    configSystem: { formats: configFormats, features, configPath: configArchitecture.configPath },
    validation: { schemaPath: schemaValidation.schemaPath },
    documentation: { path: configDocumentation.docPath },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/cli-mcp-development/configuration-management-system', timestamp: startTime }
  };
}

export const configArchitectureTask = defineTask('config-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Config Architecture - ${args.projectName}`,
  agent: {
    name: 'cli-ux-architect',
    prompt: { role: 'Configuration Architecture Specialist', task: 'Design config architecture', context: args, instructions: ['1. Define config structure', '2. Plan loading order', '3. Design merge strategy', '4. Plan extension points', '5. Generate architecture doc'], outputFormat: 'JSON with config architecture' },
    outputSchema: { type: 'object', required: ['configPath', 'artifacts'], properties: { configPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'config', 'architecture']
}));

export const fileLoadingTask = defineTask('file-loading', (args, taskCtx) => ({
  kind: 'agent',
  title: `File Loading - ${args.projectName}`,
  agent: {
    name: 'cli-ux-architect',
    prompt: { role: 'Config File Loading Specialist', task: 'Implement config file loading', context: args, instructions: ['1. Add JSON loader', '2. Add YAML loader', '3. Add TOML loader', '4. Add INI loader', '5. Generate file loaders'], outputFormat: 'JSON with file loading' },
    outputSchema: { type: 'object', required: ['loaderPaths', 'artifacts'], properties: { loaderPaths: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'config', 'file-loading']
}));

export const envVarIntegrationTask = defineTask('env-var-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Env Var Integration - ${args.projectName}`,
  agent: {
    name: 'cli-ux-architect',
    prompt: { role: 'Environment Variable Specialist', task: 'Implement env var integration', context: args, instructions: ['1. Define env var prefix', '2. Map nested config to env', '3. Handle type conversion', '4. Support .env files', '5. Generate env integration'], outputFormat: 'JSON with env var integration' },
    outputSchema: { type: 'object', required: ['envConfig', 'artifacts'], properties: { envConfig: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'config', 'env-vars']
}));

export const hierarchicalMergingTask = defineTask('hierarchical-merging', (args, taskCtx) => ({
  kind: 'agent',
  title: `Hierarchical Merging - ${args.projectName}`,
  agent: {
    name: 'cli-ux-architect',
    prompt: { role: 'Config Merging Specialist', task: 'Implement hierarchical config merging', context: args, instructions: ['1. Define merge priorities', '2. Implement deep merge', '3. Handle array merging', '4. Support overrides', '5. Generate merge logic'], outputFormat: 'JSON with hierarchical merging' },
    outputSchema: { type: 'object', required: ['mergePath', 'artifacts'], properties: { mergePath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'config', 'merging']
}));

export const schemaValidationTask = defineTask('schema-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Schema Validation - ${args.projectName}`,
  agent: {
    name: 'cli-ux-architect',
    prompt: { role: 'Config Validation Specialist', task: 'Implement config schema validation', context: args, instructions: ['1. Define config schema', '2. Add type validation', '3. Add constraint validation', '4. Generate helpful errors', '5. Generate validation code'], outputFormat: 'JSON with schema validation' },
    outputSchema: { type: 'object', required: ['schemaPath', 'artifacts'], properties: { schemaPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'config', 'validation']
}));

export const configSecretsManagementTask = defineTask('config-secrets-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Secrets Management - ${args.projectName}`,
  agent: {
    name: 'cli-ux-architect',
    prompt: { role: 'Config Secrets Specialist', task: 'Implement secrets management', context: args, instructions: ['1. Encrypt sensitive values', '2. Support secret stores', '3. Mask in logs', '4. Handle rotation', '5. Generate secrets config'], outputFormat: 'JSON with secrets management' },
    outputSchema: { type: 'object', required: ['secretsConfig', 'artifacts'], properties: { secretsConfig: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'config', 'secrets']
}));

export const configWatchingTask = defineTask('config-watching', (args, taskCtx) => ({
  kind: 'agent',
  title: `Config Watching - ${args.projectName}`,
  agent: {
    name: 'cli-ux-architect',
    prompt: { role: 'Config Watching Specialist', task: 'Implement config file watching', context: args, instructions: ['1. Watch config files', '2. Debounce changes', '3. Validate on change', '4. Emit change events', '5. Generate watch code'], outputFormat: 'JSON with config watching' },
    outputSchema: { type: 'object', required: ['watchConfig', 'artifacts'], properties: { watchConfig: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'config', 'watching']
}));

export const defaultsGenerationTask = defineTask('defaults-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Defaults Generation - ${args.projectName}`,
  agent: {
    name: 'cli-ux-architect',
    prompt: { role: 'Config Defaults Specialist', task: 'Implement config defaults generation', context: args, instructions: ['1. Define default values', '2. Generate example configs', '3. Create init command', '4. Document all options', '5. Generate defaults code'], outputFormat: 'JSON with defaults generation' },
    outputSchema: { type: 'object', required: ['defaultsPath', 'artifacts'], properties: { defaultsPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'config', 'defaults']
}));

export const configTestingTask = defineTask('config-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Config Testing - ${args.projectName}`,
  agent: {
    name: 'cli-testing-architect',
    prompt: { role: 'Config Testing Specialist', task: 'Create config system tests', context: args, instructions: ['1. Test file loading', '2. Test env vars', '3. Test merging', '4. Test validation', '5. Generate test suite'], outputFormat: 'JSON with config tests' },
    outputSchema: { type: 'object', required: ['testPath', 'artifacts'], properties: { testPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'config', 'testing']
}));

export const configDocumentationTask = defineTask('config-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Config Documentation - ${args.projectName}`,
  agent: {
    name: 'cli-docs-writer',
    prompt: { role: 'Config Documentation Specialist', task: 'Document configuration system', context: args, instructions: ['1. Document all options', '2. Document file formats', '3. Document env vars', '4. Add examples', '5. Generate documentation'], outputFormat: 'JSON with config documentation' },
    outputSchema: { type: 'object', required: ['docPath', 'artifacts'], properties: { docPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'config', 'documentation']
}));
