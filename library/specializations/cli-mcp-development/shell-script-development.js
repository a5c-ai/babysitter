/**
 * @process specializations/cli-mcp-development/shell-script-development
 * @description Shell Script Development - Build robust shell scripts with proper error handling,
 * portability considerations, and testing strategies.
 * @inputs { projectName: string, shellType?: string, targetPlatforms?: array, scriptType?: string }
 * @outputs { success: boolean, scripts: array, testSuite: object, documentation: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/cli-mcp-development/shell-script-development', {
 *   projectName: 'deploy-scripts',
 *   shellType: 'bash',
 *   targetPlatforms: ['linux', 'macos'],
 *   scriptType: 'automation'
 * });
 *
 * @references
 * - Bash Guide: https://mywiki.wooledge.org/BashGuide
 * - ShellCheck: https://www.shellcheck.net/
 * - BATS testing: https://github.com/bats-core/bats-core
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    shellType = 'bash',
    targetPlatforms = ['linux', 'macos'],
    scriptType = 'automation',
    outputDir = 'shell-script-development'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Shell Script Development: ${projectName}`);

  const scriptStructure = await ctx.task(scriptStructureTask, { projectName, shellType, scriptType, outputDir });
  artifacts.push(...scriptStructure.artifacts);

  const errorHandling = await ctx.task(errorHandlingTask, { projectName, shellType, outputDir });
  artifacts.push(...errorHandling.artifacts);

  const inputValidation = await ctx.task(inputValidationTask, { projectName, shellType, outputDir });
  artifacts.push(...inputValidation.artifacts);

  const portabilityChecks = await ctx.task(portabilityChecksTask, { projectName, shellType, targetPlatforms, outputDir });
  artifacts.push(...portabilityChecks.artifacts);

  const loggingDebugging = await ctx.task(loggingDebuggingTask, { projectName, shellType, outputDir });
  artifacts.push(...loggingDebugging.artifacts);

  const shellcheckIntegration = await ctx.task(shellcheckIntegrationTask, { projectName, outputDir });
  artifacts.push(...shellcheckIntegration.artifacts);

  const batsTestSuite = await ctx.task(batsTestSuiteTask, { projectName, outputDir });
  artifacts.push(...batsTestSuite.artifacts);

  const ciIntegration = await ctx.task(shellCiIntegrationTask, { projectName, outputDir });
  artifacts.push(...ciIntegration.artifacts);

  const scriptDocumentation = await ctx.task(scriptDocumentationTask, { projectName, shellType, outputDir });
  artifacts.push(...scriptDocumentation.artifacts);

  const installationScripts = await ctx.task(installationScriptsTask, { projectName, targetPlatforms, outputDir });
  artifacts.push(...installationScripts.artifacts);

  await ctx.breakpoint({
    question: `Shell Script Development complete for ${targetPlatforms.length} platforms. Review and approve?`,
    title: 'Shell Script Development Complete',
    context: { runId: ctx.runId, summary: { projectName, shellType, targetPlatforms } }
  });

  return {
    success: true,
    projectName,
    scripts: scriptStructure.scripts,
    testSuite: { framework: 'bats', path: batsTestSuite.testPath },
    documentation: { path: scriptDocumentation.docPath },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/cli-mcp-development/shell-script-development', timestamp: startTime }
  };
}

export const scriptStructureTask = defineTask('script-structure', (args, taskCtx) => ({
  kind: 'agent',
  title: `Script Structure - ${args.projectName}`,
  agent: {
    name: 'shell-scripting-expert',
    prompt: { role: 'Shell Script Structure Specialist', task: 'Create script structure', context: args, instructions: ['1. Create script template', '2. Add shebang and options', '3. Set up function structure', '4. Add main entry point', '5. Generate script structure'], outputFormat: 'JSON with script structure' },
    outputSchema: { type: 'object', required: ['scripts', 'artifacts'], properties: { scripts: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['shell', 'development', 'structure']
}));

export const errorHandlingTask = defineTask('error-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Error Handling - ${args.projectName}`,
  agent: {
    name: 'shell-scripting-expert',
    prompt: { role: 'Shell Error Handling Specialist', task: 'Implement error handling', context: args, instructions: ['1. Add set -euo pipefail', '2. Create error handler', '3. Add trap for cleanup', '4. Implement exit codes', '5. Generate error handling code'], outputFormat: 'JSON with error handling' },
    outputSchema: { type: 'object', required: ['errorHandlerPath', 'artifacts'], properties: { errorHandlerPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['shell', 'development', 'error-handling']
}));

export const inputValidationTask = defineTask('input-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Input Validation - ${args.projectName}`,
  agent: {
    name: 'shell-scripting-expert',
    prompt: { role: 'Shell Input Validation Specialist', task: 'Implement input validation', context: args, instructions: ['1. Parse command-line args', '2. Validate required args', '3. Check file existence', '4. Validate permissions', '5. Generate validation code'], outputFormat: 'JSON with input validation' },
    outputSchema: { type: 'object', required: ['validationPath', 'artifacts'], properties: { validationPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['shell', 'development', 'validation']
}));

export const portabilityChecksTask = defineTask('portability-checks', (args, taskCtx) => ({
  kind: 'agent',
  title: `Portability Checks - ${args.projectName}`,
  agent: {
    name: 'shell-scripting-expert',
    prompt: { role: 'Shell Portability Specialist', task: 'Ensure cross-platform compatibility', context: args, instructions: ['1. Check POSIX compliance', '2. Handle BSD vs GNU tools', '3. Check shell availability', '4. Test on target platforms', '5. Generate portability guide'], outputFormat: 'JSON with portability checks' },
    outputSchema: { type: 'object', required: ['portabilityReport', 'artifacts'], properties: { portabilityReport: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['shell', 'development', 'portability']
}));

export const loggingDebuggingTask = defineTask('logging-debugging', (args, taskCtx) => ({
  kind: 'agent',
  title: `Logging and Debugging - ${args.projectName}`,
  agent: {
    name: 'shell-scripting-expert',
    prompt: { role: 'Shell Logging Specialist', task: 'Implement logging and debugging', context: args, instructions: ['1. Create logging functions', '2. Add verbosity levels', '3. Implement debug mode', '4. Add timestamp formatting', '5. Generate logging code'], outputFormat: 'JSON with logging implementation' },
    outputSchema: { type: 'object', required: ['loggingPath', 'artifacts'], properties: { loggingPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['shell', 'development', 'logging']
}));

export const shellcheckIntegrationTask = defineTask('shellcheck-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `ShellCheck Integration - ${args.projectName}`,
  agent: {
    name: 'shell-scripting-expert',
    prompt: { role: 'ShellCheck Integration Specialist', task: 'Set up ShellCheck linting', context: args, instructions: ['1. Configure ShellCheck', '2. Add .shellcheckrc', '3. Set up pre-commit hook', '4. Configure CI integration', '5. Generate ShellCheck config'], outputFormat: 'JSON with ShellCheck setup' },
    outputSchema: { type: 'object', required: ['shellcheckConfig', 'artifacts'], properties: { shellcheckConfig: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['shell', 'development', 'linting']
}));

export const batsTestSuiteTask = defineTask('bats-test-suite', (args, taskCtx) => ({
  kind: 'agent',
  title: `BATS Test Suite - ${args.projectName}`,
  agent: {
    name: 'cli-testing-architect',
    prompt: { role: 'BATS Testing Specialist', task: 'Create BATS test suite', context: args, instructions: ['1. Set up BATS framework', '2. Create test structure', '3. Add test helpers', '4. Create test fixtures', '5. Generate BATS tests'], outputFormat: 'JSON with BATS test suite' },
    outputSchema: { type: 'object', required: ['testPath', 'artifacts'], properties: { testPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['shell', 'development', 'testing']
}));

export const shellCiIntegrationTask = defineTask('shell-ci-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `CI Integration - ${args.projectName}`,
  agent: {
    name: 'cli-packaging-specialist',
    prompt: { role: 'Shell CI Integration Specialist', task: 'Set up CI for shell scripts', context: args, instructions: ['1. Create CI workflow', '2. Add ShellCheck step', '3. Add BATS tests step', '4. Configure matrix builds', '5. Generate CI config'], outputFormat: 'JSON with CI integration' },
    outputSchema: { type: 'object', required: ['ciConfig', 'artifacts'], properties: { ciConfig: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['shell', 'development', 'ci']
}));

export const scriptDocumentationTask = defineTask('script-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Script Documentation - ${args.projectName}`,
  agent: {
    name: 'cli-docs-writer',
    prompt: { role: 'Shell Documentation Specialist', task: 'Document shell scripts', context: args, instructions: ['1. Create usage documentation', '2. Document functions', '3. Add examples', '4. Document environment variables', '5. Generate documentation'], outputFormat: 'JSON with script documentation' },
    outputSchema: { type: 'object', required: ['docPath', 'artifacts'], properties: { docPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['shell', 'development', 'documentation']
}));

export const installationScriptsTask = defineTask('installation-scripts', (args, taskCtx) => ({
  kind: 'agent',
  title: `Installation Scripts - ${args.projectName}`,
  agent: {
    name: 'shell-scripting-expert',
    prompt: { role: 'Installation Script Specialist', task: 'Create installation scripts', context: args, instructions: ['1. Create install script', '2. Add uninstall script', '3. Handle dependencies', '4. Add update mechanism', '5. Generate installation scripts'], outputFormat: 'JSON with installation scripts' },
    outputSchema: { type: 'object', required: ['installScripts', 'artifacts'], properties: { installScripts: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['shell', 'development', 'installation']
}));
