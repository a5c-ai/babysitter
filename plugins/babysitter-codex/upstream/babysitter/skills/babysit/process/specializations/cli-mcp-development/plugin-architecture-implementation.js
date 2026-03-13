/**
 * @process specializations/cli-mcp-development/plugin-architecture-implementation
 * @description Plugin Architecture Implementation - Design and implement extensible plugin systems
 * for CLI applications with lifecycle hooks, dependency injection, and sandboxing.
 * @inputs { projectName: string, language: string, pluginType?: string, features?: array }
 * @outputs { success: boolean, pluginSystem: object, hooks: array, documentation: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/cli-mcp-development/plugin-architecture-implementation', {
 *   projectName: 'extensible-cli',
 *   language: 'typescript',
 *   pluginType: 'modular',
 *   features: ['lifecycle-hooks', 'dependency-injection', 'sandboxing', 'hot-reload']
 * });
 *
 * @references
 * - oclif plugins: https://oclif.io/docs/plugins
 * - Yeoman generators: https://yeoman.io/authoring/
 * - Pluggy (Python): https://pluggy.readthedocs.io/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    language = 'typescript',
    pluginType = 'modular',
    features = ['lifecycle-hooks', 'dependency-injection'],
    outputDir = 'plugin-architecture-implementation'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Plugin Architecture Implementation: ${projectName}`);

  const pluginArchitecture = await ctx.task(pluginArchitectureTask, { projectName, language, pluginType, outputDir });
  artifacts.push(...pluginArchitecture.artifacts);

  const pluginLoader = await ctx.task(pluginLoaderTask, { projectName, language, outputDir });
  artifacts.push(...pluginLoader.artifacts);

  const pluginRegistry = await ctx.task(pluginRegistryTask, { projectName, language, outputDir });
  artifacts.push(...pluginRegistry.artifacts);

  const lifecycleHooks = await ctx.task(lifecycleHooksTask, { projectName, language, outputDir });
  artifacts.push(...lifecycleHooks.artifacts);

  const dependencyInjection = await ctx.task(dependencyInjectionTask, { projectName, language, outputDir });
  artifacts.push(...dependencyInjection.artifacts);

  const pluginSandboxing = await ctx.task(pluginSandboxingTask, { projectName, language, outputDir });
  artifacts.push(...pluginSandboxing.artifacts);

  const pluginApi = await ctx.task(pluginApiTask, { projectName, language, outputDir });
  artifacts.push(...pluginApi.artifacts);

  const pluginTemplate = await ctx.task(pluginTemplateTask, { projectName, language, outputDir });
  artifacts.push(...pluginTemplate.artifacts);

  const pluginTesting = await ctx.task(pluginTestingTask, { projectName, language, outputDir });
  artifacts.push(...pluginTesting.artifacts);

  const pluginDocumentation = await ctx.task(pluginDocumentationTask, { projectName, language, features, outputDir });
  artifacts.push(...pluginDocumentation.artifacts);

  await ctx.breakpoint({
    question: `Plugin Architecture Implementation complete with ${features.length} features. Review and approve?`,
    title: 'Plugin Architecture Complete',
    context: { runId: ctx.runId, summary: { projectName, pluginType, features } }
  });

  return {
    success: true,
    projectName,
    pluginSystem: { type: pluginType, configPath: pluginArchitecture.configPath },
    hooks: lifecycleHooks.hooks,
    documentation: { path: pluginDocumentation.docPath },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/cli-mcp-development/plugin-architecture-implementation', timestamp: startTime }
  };
}

export const pluginArchitectureTask = defineTask('plugin-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Plugin Architecture - ${args.projectName}`,
  agent: {
    name: 'cli-ux-architect',
    prompt: { role: 'Plugin Architecture Specialist', task: 'Design plugin architecture', context: args, instructions: ['1. Define plugin contract', '2. Design extension points', '3. Plan plugin discovery', '4. Define versioning strategy', '5. Generate architecture doc'], outputFormat: 'JSON with plugin architecture' },
    outputSchema: { type: 'object', required: ['configPath', 'artifacts'], properties: { configPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'plugin', 'architecture']
}));

export const pluginLoaderTask = defineTask('plugin-loader', (args, taskCtx) => ({
  kind: 'agent',
  title: `Plugin Loader - ${args.projectName}`,
  agent: {
    name: 'cli-ux-architect',
    prompt: { role: 'Plugin Loading Specialist', task: 'Implement plugin loader', context: args, instructions: ['1. Create plugin loader', '2. Handle dynamic imports', '3. Support multiple formats', '4. Add error handling', '5. Generate loader code'], outputFormat: 'JSON with plugin loader' },
    outputSchema: { type: 'object', required: ['loaderPath', 'artifacts'], properties: { loaderPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'plugin', 'loader']
}));

export const pluginRegistryTask = defineTask('plugin-registry', (args, taskCtx) => ({
  kind: 'agent',
  title: `Plugin Registry - ${args.projectName}`,
  agent: {
    name: 'cli-ux-architect',
    prompt: { role: 'Plugin Registry Specialist', task: 'Implement plugin registry', context: args, instructions: ['1. Create plugin registry', '2. Track loaded plugins', '3. Handle dependencies', '4. Support unloading', '5. Generate registry code'], outputFormat: 'JSON with plugin registry' },
    outputSchema: { type: 'object', required: ['registryPath', 'artifacts'], properties: { registryPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'plugin', 'registry']
}));

export const lifecycleHooksTask = defineTask('lifecycle-hooks', (args, taskCtx) => ({
  kind: 'agent',
  title: `Lifecycle Hooks - ${args.projectName}`,
  agent: {
    name: 'cli-ux-architect',
    prompt: { role: 'Plugin Lifecycle Specialist', task: 'Implement lifecycle hooks', context: args, instructions: ['1. Define hook points', '2. Implement init hook', '3. Implement command hooks', '4. Implement cleanup hooks', '5. Generate hook system'], outputFormat: 'JSON with lifecycle hooks' },
    outputSchema: { type: 'object', required: ['hooks', 'artifacts'], properties: { hooks: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'plugin', 'lifecycle']
}));

export const dependencyInjectionTask = defineTask('dependency-injection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Dependency Injection - ${args.projectName}`,
  agent: {
    name: 'cli-ux-architect',
    prompt: { role: 'DI Specialist', task: 'Implement dependency injection', context: args, instructions: ['1. Create DI container', '2. Register services', '3. Resolve dependencies', '4. Support scopes', '5. Generate DI system'], outputFormat: 'JSON with dependency injection' },
    outputSchema: { type: 'object', required: ['diPath', 'artifacts'], properties: { diPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'plugin', 'di']
}));

export const pluginSandboxingTask = defineTask('plugin-sandboxing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Plugin Sandboxing - ${args.projectName}`,
  agent: {
    name: 'cli-ux-architect',
    prompt: { role: 'Plugin Security Specialist', task: 'Implement plugin sandboxing', context: args, instructions: ['1. Create sandbox environment', '2. Limit file access', '3. Restrict network', '4. Control resources', '5. Generate sandbox code'], outputFormat: 'JSON with plugin sandboxing' },
    outputSchema: { type: 'object', required: ['sandboxConfig', 'artifacts'], properties: { sandboxConfig: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'plugin', 'security']
}));

export const pluginApiTask = defineTask('plugin-api', (args, taskCtx) => ({
  kind: 'agent',
  title: `Plugin API - ${args.projectName}`,
  agent: {
    name: 'cli-ux-architect',
    prompt: { role: 'Plugin API Specialist', task: 'Design and implement plugin API', context: args, instructions: ['1. Define public API', '2. Create type definitions', '3. Version the API', '4. Add deprecation support', '5. Generate API code'], outputFormat: 'JSON with plugin API' },
    outputSchema: { type: 'object', required: ['apiPath', 'artifacts'], properties: { apiPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'plugin', 'api']
}));

export const pluginTemplateTask = defineTask('plugin-template', (args, taskCtx) => ({
  kind: 'agent',
  title: `Plugin Template - ${args.projectName}`,
  agent: {
    name: 'cli-ux-architect',
    prompt: { role: 'Plugin Template Specialist', task: 'Create plugin template', context: args, instructions: ['1. Create starter template', '2. Add example plugin', '3. Include build setup', '4. Add testing setup', '5. Generate template'], outputFormat: 'JSON with plugin template' },
    outputSchema: { type: 'object', required: ['templatePath', 'artifacts'], properties: { templatePath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'plugin', 'template']
}));

export const pluginTestingTask = defineTask('plugin-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Plugin Testing - ${args.projectName}`,
  agent: {
    name: 'cli-testing-architect',
    prompt: { role: 'Plugin Testing Specialist', task: 'Create plugin testing infrastructure', context: args, instructions: ['1. Create test utilities', '2. Add mock plugins', '3. Test lifecycle', '4. Test isolation', '5. Generate test suite'], outputFormat: 'JSON with plugin tests' },
    outputSchema: { type: 'object', required: ['testPath', 'artifacts'], properties: { testPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'plugin', 'testing']
}));

export const pluginDocumentationTask = defineTask('plugin-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Plugin Documentation - ${args.projectName}`,
  agent: {
    name: 'cli-docs-writer',
    prompt: { role: 'Plugin Documentation Specialist', task: 'Document plugin system', context: args, instructions: ['1. Document architecture', '2. Create plugin guide', '3. Document API reference', '4. Add examples', '5. Generate documentation'], outputFormat: 'JSON with plugin documentation' },
    outputSchema: { type: 'object', required: ['docPath', 'artifacts'], properties: { docPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'plugin', 'documentation']
}));
