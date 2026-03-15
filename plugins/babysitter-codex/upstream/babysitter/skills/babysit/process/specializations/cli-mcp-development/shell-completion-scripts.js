/**
 * @process specializations/cli-mcp-development/shell-completion-scripts
 * @description Shell Completion Scripts - Implement tab completion for Bash, Zsh, Fish, and PowerShell
 * with dynamic completions and context awareness.
 * @inputs { projectName: string, cliFramework?: string, shells?: array, commands?: array }
 * @outputs { success: boolean, completionScripts: array, installInstructions: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/cli-mcp-development/shell-completion-scripts', {
 *   projectName: 'my-cli',
 *   cliFramework: 'commander',
 *   shells: ['bash', 'zsh', 'fish', 'powershell'],
 *   commands: ['init', 'build', 'deploy', 'config']
 * });
 *
 * @references
 * - Bash Completion: https://github.com/scop/bash-completion
 * - Zsh Completion: https://zsh.sourceforge.io/Doc/Release/Completion-System.html
 * - Fish Completion: https://fishshell.com/docs/current/completions.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    cliFramework = 'commander',
    shells = ['bash', 'zsh', 'fish'],
    commands = [],
    outputDir = 'shell-completion-scripts'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Shell Completion Scripts: ${projectName}`);

  const commandAnalysis = await ctx.task(commandAnalysisTask, { projectName, cliFramework, commands, outputDir });
  artifacts.push(...commandAnalysis.artifacts);

  const bashCompletion = await ctx.task(bashCompletionTask, { projectName, commands, outputDir });
  artifacts.push(...bashCompletion.artifacts);

  const zshCompletion = await ctx.task(zshCompletionTask, { projectName, commands, outputDir });
  artifacts.push(...zshCompletion.artifacts);

  const fishCompletion = await ctx.task(fishCompletionTask, { projectName, commands, outputDir });
  artifacts.push(...fishCompletion.artifacts);

  const powershellCompletion = await ctx.task(powershellCompletionTask, { projectName, commands, outputDir });
  artifacts.push(...powershellCompletion.artifacts);

  const dynamicCompletions = await ctx.task(dynamicCompletionsTask, { projectName, cliFramework, outputDir });
  artifacts.push(...dynamicCompletions.artifacts);

  const completionTesting = await ctx.task(completionTestingTask, { projectName, shells, outputDir });
  artifacts.push(...completionTesting.artifacts);

  const installationGuide = await ctx.task(completionInstallationGuideTask, { projectName, shells, outputDir });
  artifacts.push(...installationGuide.artifacts);

  const completionCi = await ctx.task(completionCiTask, { projectName, shells, outputDir });
  artifacts.push(...completionCi.artifacts);

  const completionDistribution = await ctx.task(completionDistributionTask, { projectName, shells, outputDir });
  artifacts.push(...completionDistribution.artifacts);

  await ctx.breakpoint({
    question: `Shell Completion Scripts complete for ${shells.length} shells. Review and approve?`,
    title: 'Shell Completion Complete',
    context: { runId: ctx.runId, summary: { projectName, shells, commands } }
  });

  return {
    success: true,
    projectName,
    completionScripts: shells.map(shell => ({ shell, path: `completions/${projectName}.${shell}` })),
    installInstructions: { path: installationGuide.guidePath },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/cli-mcp-development/shell-completion-scripts', timestamp: startTime }
  };
}

export const commandAnalysisTask = defineTask('command-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Command Analysis - ${args.projectName}`,
  agent: {
    name: 'shell-scripting-expert',
    prompt: { role: 'Command Analysis Specialist', task: 'Analyze CLI commands for completion', context: args, instructions: ['1. Parse command structure', '2. Identify subcommands', '3. Extract options/flags', '4. Identify completable values', '5. Generate command analysis'], outputFormat: 'JSON with command analysis' },
    outputSchema: { type: 'object', required: ['commandStructure', 'artifacts'], properties: { commandStructure: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['shell', 'completion', 'analysis']
}));

export const bashCompletionTask = defineTask('bash-completion', (args, taskCtx) => ({
  kind: 'agent',
  title: `Bash Completion - ${args.projectName}`,
  agent: {
    name: 'shell-scripting-expert',
    prompt: { role: 'Bash Completion Specialist', task: 'Create Bash completion script', context: args, instructions: ['1. Create completion function', '2. Add subcommand completions', '3. Add option completions', '4. Add file/dir completions', '5. Generate Bash completion'], outputFormat: 'JSON with Bash completion' },
    outputSchema: { type: 'object', required: ['completionPath', 'artifacts'], properties: { completionPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['shell', 'completion', 'bash']
}));

export const zshCompletionTask = defineTask('zsh-completion', (args, taskCtx) => ({
  kind: 'agent',
  title: `Zsh Completion - ${args.projectName}`,
  agent: {
    name: 'shell-scripting-expert',
    prompt: { role: 'Zsh Completion Specialist', task: 'Create Zsh completion script', context: args, instructions: ['1. Create _command function', '2. Add _arguments spec', '3. Add completion descriptions', '4. Add context-aware completions', '5. Generate Zsh completion'], outputFormat: 'JSON with Zsh completion' },
    outputSchema: { type: 'object', required: ['completionPath', 'artifacts'], properties: { completionPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['shell', 'completion', 'zsh']
}));

export const fishCompletionTask = defineTask('fish-completion', (args, taskCtx) => ({
  kind: 'agent',
  title: `Fish Completion - ${args.projectName}`,
  agent: {
    name: 'shell-scripting-expert',
    prompt: { role: 'Fish Completion Specialist', task: 'Create Fish completion script', context: args, instructions: ['1. Add complete commands', '2. Add condition flags', '3. Add description strings', '4. Add exclusive options', '5. Generate Fish completion'], outputFormat: 'JSON with Fish completion' },
    outputSchema: { type: 'object', required: ['completionPath', 'artifacts'], properties: { completionPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['shell', 'completion', 'fish']
}));

export const powershellCompletionTask = defineTask('powershell-completion', (args, taskCtx) => ({
  kind: 'agent',
  title: `PowerShell Completion - ${args.projectName}`,
  agent: {
    name: 'shell-scripting-expert',
    prompt: { role: 'PowerShell Completion Specialist', task: 'Create PowerShell completion script', context: args, instructions: ['1. Create Register-ArgumentCompleter', '2. Add parameter completions', '3. Add dynamic completions', '4. Handle tab expansion', '5. Generate PowerShell completion'], outputFormat: 'JSON with PowerShell completion' },
    outputSchema: { type: 'object', required: ['completionPath', 'artifacts'], properties: { completionPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['shell', 'completion', 'powershell']
}));

export const dynamicCompletionsTask = defineTask('dynamic-completions', (args, taskCtx) => ({
  kind: 'agent',
  title: `Dynamic Completions - ${args.projectName}`,
  agent: {
    name: 'shell-scripting-expert',
    prompt: { role: 'Dynamic Completion Specialist', task: 'Implement dynamic completions', context: args, instructions: ['1. Add runtime value completions', '2. Implement API-based completions', '3. Add file pattern completions', '4. Cache completion results', '5. Generate dynamic completion code'], outputFormat: 'JSON with dynamic completions' },
    outputSchema: { type: 'object', required: ['dynamicConfig', 'artifacts'], properties: { dynamicConfig: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['shell', 'completion', 'dynamic']
}));

export const completionTestingTask = defineTask('completion-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Completion Testing - ${args.projectName}`,
  agent: {
    name: 'cli-testing-architect',
    prompt: { role: 'Completion Testing Specialist', task: 'Test shell completions', context: args, instructions: ['1. Create completion tests', '2. Test each shell', '3. Verify option completions', '4. Test edge cases', '5. Generate test suite'], outputFormat: 'JSON with completion tests' },
    outputSchema: { type: 'object', required: ['testPath', 'artifacts'], properties: { testPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['shell', 'completion', 'testing']
}));

export const completionInstallationGuideTask = defineTask('completion-installation-guide', (args, taskCtx) => ({
  kind: 'agent',
  title: `Installation Guide - ${args.projectName}`,
  agent: {
    name: 'cli-docs-writer',
    prompt: { role: 'Completion Installation Specialist', task: 'Document completion installation', context: args, instructions: ['1. Document Bash install', '2. Document Zsh install', '3. Document Fish install', '4. Document PowerShell install', '5. Generate installation guide'], outputFormat: 'JSON with installation guide' },
    outputSchema: { type: 'object', required: ['guidePath', 'artifacts'], properties: { guidePath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['shell', 'completion', 'documentation']
}));

export const completionCiTask = defineTask('completion-ci', (args, taskCtx) => ({
  kind: 'agent',
  title: `Completion CI - ${args.projectName}`,
  agent: {
    name: 'cli-packaging-specialist',
    prompt: { role: 'Completion CI Specialist', task: 'Set up completion CI', context: args, instructions: ['1. Create lint workflow', '2. Add syntax checks', '3. Test on multiple shells', '4. Automate generation', '5. Generate CI config'], outputFormat: 'JSON with completion CI' },
    outputSchema: { type: 'object', required: ['ciConfig', 'artifacts'], properties: { ciConfig: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['shell', 'completion', 'ci']
}));

export const completionDistributionTask = defineTask('completion-distribution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Completion Distribution - ${args.projectName}`,
  agent: {
    name: 'shell-scripting-expert',
    prompt: { role: 'Completion Distribution Specialist', task: 'Set up completion distribution', context: args, instructions: ['1. Package with CLI', '2. Add to package managers', '3. Create standalone downloads', '4. Automate updates', '5. Generate distribution config'], outputFormat: 'JSON with completion distribution' },
    outputSchema: { type: 'object', required: ['distributionConfig', 'artifacts'], properties: { distributionConfig: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['shell', 'completion', 'distribution']
}));
