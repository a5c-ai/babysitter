/**
 * @process specializations/cli-mcp-development/cross-platform-cli-compatibility
 * @description Cross-Platform CLI Compatibility - Ensure CLI tools work consistently across
 * Windows, macOS, and Linux with proper path handling and terminal detection.
 * @inputs { projectName: string, language: string, platforms?: array, features?: array }
 * @outputs { success: boolean, compatibilityLayer: object, tests: object, documentation: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/cli-mcp-development/cross-platform-cli-compatibility', {
 *   projectName: 'cross-platform-cli',
 *   language: 'typescript',
 *   platforms: ['windows', 'macos', 'linux'],
 *   features: ['path-handling', 'terminal-detection', 'encoding', 'line-endings']
 * });
 *
 * @references
 * - Node.js path: https://nodejs.org/api/path.html
 * - cross-env: https://github.com/kentcdodds/cross-env
 * - execa: https://github.com/sindresorhus/execa
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    language = 'typescript',
    platforms = ['windows', 'macos', 'linux'],
    features = ['path-handling', 'terminal-detection'],
    outputDir = 'cross-platform-cli-compatibility'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Cross-Platform CLI Compatibility: ${projectName}`);

  const compatibilityAnalysis = await ctx.task(compatibilityAnalysisTask, { projectName, language, platforms, outputDir });
  artifacts.push(...compatibilityAnalysis.artifacts);

  const pathHandling = await ctx.task(pathHandlingTask, { projectName, language, platforms, outputDir });
  artifacts.push(...pathHandling.artifacts);

  const terminalDetection = await ctx.task(terminalDetectionTask, { projectName, language, outputDir });
  artifacts.push(...terminalDetection.artifacts);

  const encodingHandling = await ctx.task(encodingHandlingTask, { projectName, language, outputDir });
  artifacts.push(...encodingHandling.artifacts);

  const lineEndingHandling = await ctx.task(lineEndingHandlingTask, { projectName, language, outputDir });
  artifacts.push(...lineEndingHandling.artifacts);

  const shellSpawning = await ctx.task(shellSpawningTask, { projectName, language, platforms, outputDir });
  artifacts.push(...shellSpawning.artifacts);

  const environmentVariables = await ctx.task(environmentVariablesTask, { projectName, language, platforms, outputDir });
  artifacts.push(...environmentVariables.artifacts);

  const filePermissions = await ctx.task(filePermissionsTask, { projectName, language, platforms, outputDir });
  artifacts.push(...filePermissions.artifacts);

  const crossPlatformTesting = await ctx.task(crossPlatformTestingTask, { projectName, platforms, outputDir });
  artifacts.push(...crossPlatformTesting.artifacts);

  const compatibilityDocumentation = await ctx.task(compatibilityDocumentationTask, { projectName, platforms, features, outputDir });
  artifacts.push(...compatibilityDocumentation.artifacts);

  await ctx.breakpoint({
    question: `Cross-Platform CLI Compatibility complete for ${platforms.length} platforms. Review and approve?`,
    title: 'Cross-Platform Compatibility Complete',
    context: { runId: ctx.runId, summary: { projectName, platforms, features } }
  });

  return {
    success: true,
    projectName,
    compatibilityLayer: { platforms, configPath: compatibilityAnalysis.configPath },
    tests: { path: crossPlatformTesting.testPath },
    documentation: { path: compatibilityDocumentation.docPath },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/cli-mcp-development/cross-platform-cli-compatibility', timestamp: startTime }
  };
}

export const compatibilityAnalysisTask = defineTask('compatibility-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Compatibility Analysis - ${args.projectName}`,
  agent: {
    name: 'cli-ux-architect',
    prompt: { role: 'Cross-Platform Compatibility Specialist', task: 'Analyze compatibility requirements', context: args, instructions: ['1. Identify platform differences', '2. List compatibility concerns', '3. Plan abstraction layers', '4. Define test matrix', '5. Generate analysis report'], outputFormat: 'JSON with compatibility analysis' },
    outputSchema: { type: 'object', required: ['configPath', 'artifacts'], properties: { configPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'cross-platform', 'analysis']
}));

export const pathHandlingTask = defineTask('path-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Path Handling - ${args.projectName}`,
  agent: {
    name: 'cli-packaging-specialist',
    prompt: { role: 'Path Handling Specialist', task: 'Implement cross-platform path handling', context: args, instructions: ['1. Use path module correctly', '2. Handle separators', '3. Normalize paths', '4. Handle home directory', '5. Generate path utilities'], outputFormat: 'JSON with path handling' },
    outputSchema: { type: 'object', required: ['pathUtilsPath', 'artifacts'], properties: { pathUtilsPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'cross-platform', 'paths']
}));

export const terminalDetectionTask = defineTask('terminal-detection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Terminal Detection - ${args.projectName}`,
  agent: {
    name: 'cli-packaging-specialist',
    prompt: { role: 'Terminal Detection Specialist', task: 'Implement terminal detection', context: args, instructions: ['1. Detect terminal type', '2. Check TTY status', '3. Detect color support', '4. Handle CI environments', '5. Generate detection code'], outputFormat: 'JSON with terminal detection' },
    outputSchema: { type: 'object', required: ['detectionPath', 'artifacts'], properties: { detectionPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'cross-platform', 'terminal']
}));

export const encodingHandlingTask = defineTask('encoding-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Encoding Handling - ${args.projectName}`,
  agent: {
    name: 'cli-packaging-specialist',
    prompt: { role: 'Encoding Handling Specialist', task: 'Implement encoding handling', context: args, instructions: ['1. Handle UTF-8 consistently', '2. Detect console encoding', '3. Handle Windows codepages', '4. Convert encodings', '5. Generate encoding code'], outputFormat: 'JSON with encoding handling' },
    outputSchema: { type: 'object', required: ['encodingPath', 'artifacts'], properties: { encodingPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'cross-platform', 'encoding']
}));

export const lineEndingHandlingTask = defineTask('line-ending-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Line Ending Handling - ${args.projectName}`,
  agent: {
    name: 'cli-packaging-specialist',
    prompt: { role: 'Line Ending Specialist', task: 'Implement line ending handling', context: args, instructions: ['1. Detect line endings', '2. Normalize line endings', '3. Handle mixed endings', '4. Configure git attributes', '5. Generate line ending code'], outputFormat: 'JSON with line ending handling' },
    outputSchema: { type: 'object', required: ['lineEndingPath', 'artifacts'], properties: { lineEndingPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'cross-platform', 'line-endings']
}));

export const shellSpawningTask = defineTask('shell-spawning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Shell Spawning - ${args.projectName}`,
  agent: {
    name: 'cli-packaging-specialist',
    prompt: { role: 'Shell Spawning Specialist', task: 'Implement cross-platform shell spawning', context: args, instructions: ['1. Use correct shell', '2. Handle arguments', '3. Manage environment', '4. Handle signals', '5. Generate spawn code'], outputFormat: 'JSON with shell spawning' },
    outputSchema: { type: 'object', required: ['spawnPath', 'artifacts'], properties: { spawnPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'cross-platform', 'shell']
}));

export const environmentVariablesTask = defineTask('environment-variables', (args, taskCtx) => ({
  kind: 'agent',
  title: `Environment Variables - ${args.projectName}`,
  agent: {
    name: 'cli-packaging-specialist',
    prompt: { role: 'Environment Variable Specialist', task: 'Handle cross-platform env vars', context: args, instructions: ['1. Handle case sensitivity', '2. Map common variables', '3. Handle PATH differences', '4. Manage temp directories', '5. Generate env utilities'], outputFormat: 'JSON with env var handling' },
    outputSchema: { type: 'object', required: ['envPath', 'artifacts'], properties: { envPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'cross-platform', 'environment']
}));

export const filePermissionsTask = defineTask('file-permissions', (args, taskCtx) => ({
  kind: 'agent',
  title: `File Permissions - ${args.projectName}`,
  agent: {
    name: 'cli-packaging-specialist',
    prompt: { role: 'File Permissions Specialist', task: 'Handle cross-platform file permissions', context: args, instructions: ['1. Handle Unix permissions', '2. Handle Windows ACLs', '3. Check executability', '4. Handle readonly files', '5. Generate permission code'], outputFormat: 'JSON with file permissions' },
    outputSchema: { type: 'object', required: ['permissionsPath', 'artifacts'], properties: { permissionsPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'cross-platform', 'permissions']
}));

export const crossPlatformTestingTask = defineTask('cross-platform-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Cross-Platform Testing - ${args.projectName}`,
  agent: {
    name: 'cli-testing-architect',
    prompt: { role: 'Cross-Platform Testing Specialist', task: 'Set up cross-platform tests', context: args, instructions: ['1. Configure test matrix', '2. Set up CI for all platforms', '3. Create platform-specific tests', '4. Test compatibility layer', '5. Generate test suite'], outputFormat: 'JSON with cross-platform tests' },
    outputSchema: { type: 'object', required: ['testPath', 'artifacts'], properties: { testPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'cross-platform', 'testing']
}));

export const compatibilityDocumentationTask = defineTask('compatibility-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Compatibility Documentation - ${args.projectName}`,
  agent: {
    name: 'cli-docs-writer',
    prompt: { role: 'Compatibility Documentation Specialist', task: 'Document cross-platform compatibility', context: args, instructions: ['1. Document platform requirements', '2. Document known issues', '3. Add platform-specific notes', '4. Document testing process', '5. Generate documentation'], outputFormat: 'JSON with compatibility documentation' },
    outputSchema: { type: 'object', required: ['docPath', 'artifacts'], properties: { docPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'cross-platform', 'documentation']
}));
