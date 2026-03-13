/**
 * @process specializations/cli-mcp-development/cli-update-mechanism
 * @description CLI Update Mechanism - Implement self-update functionality for CLI tools
 * including version checking, downloads, and rollback capabilities.
 * @inputs { projectName: string, language: string, updateStrategy?: string, distributionChannels?: array }
 * @outputs { success: boolean, updateSystem: object, versionCheck: object, rollback: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/cli-mcp-development/cli-update-mechanism', {
 *   projectName: 'my-cli',
 *   language: 'go',
 *   updateStrategy: 'self-update',
 *   distributionChannels: ['github-releases', 'homebrew']
 * });
 *
 * @references
 * - go-selfupdate: https://github.com/rhysd/go-self-update
 * - update-notifier (Node.js): https://github.com/yeoman/update-notifier
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    language = 'go',
    updateStrategy = 'self-update',
    distributionChannels = ['github-releases'],
    outputDir = 'cli-update-mechanism'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting CLI Update Mechanism: ${projectName}`);

  const updateArchitecture = await ctx.task(updateArchitectureTask, { projectName, language, updateStrategy, outputDir });
  artifacts.push(...updateArchitecture.artifacts);

  const versionChecking = await ctx.task(versionCheckingTask, { projectName, language, distributionChannels, outputDir });
  artifacts.push(...versionChecking.artifacts);

  const downloadManager = await ctx.task(downloadManagerTask, { projectName, language, outputDir });
  artifacts.push(...downloadManager.artifacts);

  const checksumVerification = await ctx.task(checksumVerificationTask, { projectName, language, outputDir });
  artifacts.push(...checksumVerification.artifacts);

  const binaryReplacement = await ctx.task(binaryReplacementTask, { projectName, language, outputDir });
  artifacts.push(...binaryReplacement.artifacts);

  const rollbackSystem = await ctx.task(rollbackSystemTask, { projectName, language, outputDir });
  artifacts.push(...rollbackSystem.artifacts);

  const updateNotifications = await ctx.task(updateNotificationsTask, { projectName, language, outputDir });
  artifacts.push(...updateNotifications.artifacts);

  const channelManagement = await ctx.task(channelManagementTask, { projectName, distributionChannels, outputDir });
  artifacts.push(...channelManagement.artifacts);

  const updateTesting = await ctx.task(updateTestingTask, { projectName, language, outputDir });
  artifacts.push(...updateTesting.artifacts);

  const updateDocumentation = await ctx.task(updateDocumentationTask, { projectName, updateStrategy, outputDir });
  artifacts.push(...updateDocumentation.artifacts);

  await ctx.breakpoint({
    question: `CLI Update Mechanism complete with ${updateStrategy} strategy. Review and approve?`,
    title: 'Update Mechanism Complete',
    context: { runId: ctx.runId, summary: { projectName, updateStrategy, distributionChannels } }
  });

  return {
    success: true,
    projectName,
    updateSystem: { strategy: updateStrategy, configPath: updateArchitecture.configPath },
    versionCheck: { path: versionChecking.checkPath },
    rollback: { path: rollbackSystem.rollbackPath },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/cli-mcp-development/cli-update-mechanism', timestamp: startTime }
  };
}

export const updateArchitectureTask = defineTask('update-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Update Architecture - ${args.projectName}`,
  agent: {
    name: 'cli-ux-architect',
    prompt: { role: 'Update Architecture Specialist', task: 'Design update architecture', context: args, instructions: ['1. Define update flow', '2. Plan version sources', '3. Design download strategy', '4. Plan rollback mechanism', '5. Generate architecture doc'], outputFormat: 'JSON with update architecture' },
    outputSchema: { type: 'object', required: ['configPath', 'artifacts'], properties: { configPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'update', 'architecture']
}));

export const versionCheckingTask = defineTask('version-checking', (args, taskCtx) => ({
  kind: 'agent',
  title: `Version Checking - ${args.projectName}`,
  agent: {
    name: 'cli-packaging-specialist',
    prompt: { role: 'Version Checking Specialist', task: 'Implement version checking', context: args, instructions: ['1. Query GitHub releases', '2. Parse version tags', '3. Compare semver', '4. Cache results', '5. Generate version check code'], outputFormat: 'JSON with version checking' },
    outputSchema: { type: 'object', required: ['checkPath', 'artifacts'], properties: { checkPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'update', 'version']
}));

export const downloadManagerTask = defineTask('download-manager', (args, taskCtx) => ({
  kind: 'agent',
  title: `Download Manager - ${args.projectName}`,
  agent: {
    name: 'cli-packaging-specialist',
    prompt: { role: 'Download Manager Specialist', task: 'Implement download manager', context: args, instructions: ['1. Create download client', '2. Add progress display', '3. Handle interruptions', '4. Resume downloads', '5. Generate download code'], outputFormat: 'JSON with download manager' },
    outputSchema: { type: 'object', required: ['downloadPath', 'artifacts'], properties: { downloadPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'update', 'download']
}));

export const checksumVerificationTask = defineTask('checksum-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Checksum Verification - ${args.projectName}`,
  agent: {
    name: 'cli-packaging-specialist',
    prompt: { role: 'Checksum Verification Specialist', task: 'Implement checksum verification', context: args, instructions: ['1. Download checksum file', '2. Verify SHA256', '3. Verify GPG signature', '4. Report mismatches', '5. Generate verification code'], outputFormat: 'JSON with checksum verification' },
    outputSchema: { type: 'object', required: ['verificationPath', 'artifacts'], properties: { verificationPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'update', 'security']
}));

export const binaryReplacementTask = defineTask('binary-replacement', (args, taskCtx) => ({
  kind: 'agent',
  title: `Binary Replacement - ${args.projectName}`,
  agent: {
    name: 'cli-packaging-specialist',
    prompt: { role: 'Binary Replacement Specialist', task: 'Implement binary replacement', context: args, instructions: ['1. Backup current binary', '2. Handle running process', '3. Replace atomically', '4. Handle permissions', '5. Generate replacement code'], outputFormat: 'JSON with binary replacement' },
    outputSchema: { type: 'object', required: ['replacementPath', 'artifacts'], properties: { replacementPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'update', 'replacement']
}));

export const rollbackSystemTask = defineTask('rollback-system', (args, taskCtx) => ({
  kind: 'agent',
  title: `Rollback System - ${args.projectName}`,
  agent: {
    name: 'cli-packaging-specialist',
    prompt: { role: 'Rollback System Specialist', task: 'Implement rollback system', context: args, instructions: ['1. Store previous versions', '2. Create rollback command', '3. Validate rollback', '4. Clean old versions', '5. Generate rollback code'], outputFormat: 'JSON with rollback system' },
    outputSchema: { type: 'object', required: ['rollbackPath', 'artifacts'], properties: { rollbackPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'update', 'rollback']
}));

export const updateNotificationsTask = defineTask('update-notifications', (args, taskCtx) => ({
  kind: 'agent',
  title: `Update Notifications - ${args.projectName}`,
  agent: {
    name: 'cli-packaging-specialist',
    prompt: { role: 'Update Notification Specialist', task: 'Implement update notifications', context: args, instructions: ['1. Check on startup', '2. Display notification', '3. Allow dismissal', '4. Configure frequency', '5. Generate notification code'], outputFormat: 'JSON with update notifications' },
    outputSchema: { type: 'object', required: ['notificationPath', 'artifacts'], properties: { notificationPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'update', 'notifications']
}));

export const channelManagementTask = defineTask('channel-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Channel Management - ${args.projectName}`,
  agent: {
    name: 'cli-packaging-specialist',
    prompt: { role: 'Update Channel Specialist', task: 'Implement channel management', context: args, instructions: ['1. Define stable channel', '2. Add beta channel', '3. Add nightly channel', '4. Allow channel switching', '5. Generate channel code'], outputFormat: 'JSON with channel management' },
    outputSchema: { type: 'object', required: ['channelConfig', 'artifacts'], properties: { channelConfig: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'update', 'channels']
}));

export const updateTestingTask = defineTask('update-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Update Testing - ${args.projectName}`,
  agent: {
    name: 'cli-testing-architect',
    prompt: { role: 'Update Testing Specialist', task: 'Create update system tests', context: args, instructions: ['1. Mock release server', '2. Test version checks', '3. Test downloads', '4. Test rollback', '5. Generate test suite'], outputFormat: 'JSON with update tests' },
    outputSchema: { type: 'object', required: ['testPath', 'artifacts'], properties: { testPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'update', 'testing']
}));

export const updateDocumentationTask = defineTask('update-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Update Documentation - ${args.projectName}`,
  agent: {
    name: 'cli-docs-writer',
    prompt: { role: 'Update Documentation Specialist', task: 'Document update system', context: args, instructions: ['1. Document update command', '2. Document channels', '3. Document rollback', '4. Add troubleshooting', '5. Generate documentation'], outputFormat: 'JSON with update documentation' },
    outputSchema: { type: 'object', required: ['docPath', 'artifacts'], properties: { docPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['cli', 'update', 'documentation']
}));
