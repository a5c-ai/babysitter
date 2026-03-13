/**
 * @process specializations/desktop-development/auto-update-system
 * @description Auto-Update System Implementation - Implement automatic application updates using electron-updater
 * or platform-native mechanisms (Squirrel, Sparkle); configure update servers and delta updates.
 * @inputs { projectName: string, framework: string, updateStrategy: string, targetPlatforms: array, outputDir?: string }
 * @outputs { success: boolean, updateConfig: object, serverConfig: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/desktop-development/auto-update-system', {
 *   projectName: 'MyDesktopApp',
 *   framework: 'Electron',
 *   updateStrategy: 'electron-updater',
 *   targetPlatforms: ['windows', 'macos', 'linux']
 * });
 *
 * @references
 * - electron-updater: https://www.electron.build/auto-update
 * - Squirrel.Windows: https://github.com/Squirrel/Squirrel.Windows
 * - Sparkle: https://sparkle-project.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    framework = 'Electron',
    updateStrategy = 'electron-updater',
    targetPlatforms = ['windows', 'macos', 'linux'],
    updateServer = 'GitHub Releases',
    deltaUpdates = true,
    outputDir = 'auto-update-system'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Auto-Update System Implementation: ${projectName}`);

  // Phase 1: Update Requirements
  const requirements = await ctx.task(updateRequirementsTask, { projectName, framework, updateStrategy, targetPlatforms, deltaUpdates, outputDir });
  artifacts.push(...requirements.artifacts);

  // Phase 2: Core Update Module
  const coreModule = await ctx.task(implementCoreUpdateTask, { projectName, framework, updateStrategy, outputDir });
  artifacts.push(...coreModule.artifacts);

  // Phase 3: Update Server Configuration
  const serverConfig = await ctx.task(configureUpdateServerTask, { projectName, updateServer, targetPlatforms, outputDir });
  artifacts.push(...serverConfig.artifacts);

  // Phase 4: Platform-specific Update Handlers
  const platformTasks = targetPlatforms.map(platform =>
    () => ctx.task(implementPlatformUpdateTask, { projectName, framework, updateStrategy, platform, outputDir })
  );
  const platformConfigs = await ctx.parallel.all(platformTasks);
  artifacts.push(...platformConfigs.flatMap(c => c.artifacts));

  await ctx.breakpoint({
    question: `Update system configured. Server: ${updateServer}. Delta updates: ${deltaUpdates}. Review configuration?`,
    title: 'Update System Review',
    context: { runId: ctx.runId, updateServer, deltaUpdates, platforms: targetPlatforms }
  });

  // Phase 5: Delta Updates (if enabled)
  let deltaConfig = null;
  if (deltaUpdates) {
    deltaConfig = await ctx.task(configureDeltaUpdatesTask, { projectName, framework, updateStrategy, outputDir });
    artifacts.push(...deltaConfig.artifacts);
  }

  // Phase 6: Update UI Components
  const updateUi = await ctx.task(implementUpdateUiTask, { projectName, framework, outputDir });
  artifacts.push(...updateUi.artifacts);

  // Phase 7: Rollback Mechanism
  const rollback = await ctx.task(implementRollbackTask, { projectName, framework, targetPlatforms, outputDir });
  artifacts.push(...rollback.artifacts);

  // Phase 8: Validation
  const validation = await ctx.task(validateUpdateSystemTask, { projectName, framework, updateStrategy, coreModule, serverConfig, platformConfigs, outputDir });
  artifacts.push(...validation.artifacts);

  const validationPassed = validation.validationScore >= 80;

  return {
    success: validationPassed,
    projectName,
    updateConfig: { strategy: updateStrategy, module: coreModule.modulePath, deltaEnabled: deltaUpdates },
    serverConfig: { server: updateServer, url: serverConfig.updateUrl },
    platforms: Object.fromEntries(platformConfigs.map(c => [c.platform, c.configured])),
    uiComponents: updateUi.components,
    rollbackEnabled: rollback.enabled,
    validation: { score: validation.validationScore, passed: validationPassed },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/desktop-development/auto-update-system', timestamp: startTime }
  };
}

export const updateRequirementsTask = defineTask('update-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Update Requirements - ${args.projectName}`,
  agent: {
    name: 'update-analyst',
    prompt: { role: 'Auto-Update Analyst', task: 'Analyze auto-update requirements', context: args, instructions: ['1. Analyze update strategy needs', '2. Document platform requirements', '3. Assess delta update feasibility', '4. Document server requirements', '5. Assess signing requirements', '6. Plan update channels', '7. Document rollback needs', '8. Generate requirements document'] },
    outputSchema: { type: 'object', required: ['requirements', 'artifacts'], properties: { requirements: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'auto-update', 'requirements']
}));

export const implementCoreUpdateTask = defineTask('implement-core-update', (args, taskCtx) => ({
  kind: 'agent',
  title: `Core Update Module - ${args.projectName}`,
  skill: {
    name: 'electron-auto-updater-setup',
  },
  agent: {
    name: 'release-manager',
    prompt: { role: 'Auto-Update Developer', task: 'Implement core update module', context: args, instructions: ['1. Configure autoUpdater', '2. Implement update checking', '3. Handle update events', '4. Implement download progress', '5. Handle update ready', '6. Implement quit and install', '7. Configure logging', '8. Generate update module'] },
    outputSchema: { type: 'object', required: ['modulePath', 'events', 'artifacts'], properties: { modulePath: { type: 'string' }, events: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'auto-update', 'core']
}));

export const configureUpdateServerTask = defineTask('configure-update-server', (args, taskCtx) => ({
  kind: 'agent',
  title: `Update Server Configuration - ${args.projectName}`,
  agent: {
    name: 'artifact-distribution-specialist',
    prompt: { role: 'Update Server Configurator', task: 'Configure update server', context: args, instructions: ['1. Configure GitHub Releases', '2. Set up release channels', '3. Configure update manifest', '4. Set up CDN if needed', '5. Configure authentication', '6. Set up proxy support', '7. Configure caching', '8. Generate server configuration'] },
    outputSchema: { type: 'object', required: ['updateUrl', 'artifacts'], properties: { updateUrl: { type: 'string' }, channels: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'auto-update', 'server']
}));

export const implementPlatformUpdateTask = defineTask('implement-platform-update', (args, taskCtx) => ({
  kind: 'agent',
  title: `${args.platform} Update Handler - ${args.projectName}`,
  agent: {
    name: 'platform-update-developer',
    prompt: { role: 'Platform Update Developer', task: `Implement ${args.platform} update handler`, context: args, instructions: [`1. Configure ${args.platform} updater`, '2. Handle platform-specific events', '3. Configure signing verification', '4. Handle installation', '5. Configure restart behavior', '6. Handle errors', '7. Test update flow', '8. Generate platform module'] },
    outputSchema: { type: 'object', required: ['platform', 'configured', 'artifacts'], properties: { platform: { type: 'string' }, configured: { type: 'boolean' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'auto-update', args.platform]
}));

export const configureDeltaUpdatesTask = defineTask('configure-delta-updates', (args, taskCtx) => ({
  kind: 'agent',
  title: `Delta Updates - ${args.projectName}`,
  agent: {
    name: 'delta-developer',
    prompt: { role: 'Delta Update Developer', task: 'Configure delta updates', context: args, instructions: ['1. Enable differential downloads', '2. Configure block maps', '3. Set up delta generation', '4. Configure fallback to full', '5. Optimize block size', '6. Handle delta failures', '7. Monitor delta efficiency', '8. Generate delta configuration'] },
    outputSchema: { type: 'object', required: ['enabled', 'artifacts'], properties: { enabled: { type: 'boolean' }, expectedSavings: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'auto-update', 'delta']
}));

export const implementUpdateUiTask = defineTask('implement-update-ui', (args, taskCtx) => ({
  kind: 'agent',
  title: `Update UI - ${args.projectName}`,
  agent: {
    name: 'ui-developer',
    prompt: { role: 'Update UI Developer', task: 'Implement update UI components', context: args, instructions: ['1. Create update available dialog', '2. Create download progress UI', '3. Create restart prompt', '4. Add update preferences', '5. Create release notes view', '6. Handle background updates', '7. Create error dialogs', '8. Generate UI components'] },
    outputSchema: { type: 'object', required: ['components', 'artifacts'], properties: { components: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'auto-update', 'ui']
}));

export const implementRollbackTask = defineTask('implement-rollback', (args, taskCtx) => ({
  kind: 'agent',
  title: `Rollback Mechanism - ${args.projectName}`,
  agent: {
    name: 'rollback-developer',
    prompt: { role: 'Rollback Developer', task: 'Implement update rollback mechanism', context: args, instructions: ['1. Backup current version', '2. Implement rollback trigger', '3. Configure auto-rollback on failure', '4. Preserve user data', '5. Handle platform differences', '6. Implement version history', '7. Create rollback UI', '8. Generate rollback module'] },
    outputSchema: { type: 'object', required: ['enabled', 'artifacts'], properties: { enabled: { type: 'boolean' }, triggers: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'auto-update', 'rollback']
}));

export const validateUpdateSystemTask = defineTask('validate-update-system', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validate Update System - ${args.projectName}`,
  agent: {
    name: 'update-security-analyst',
    prompt: { role: 'Update System Validator', task: 'Validate auto-update implementation', context: args, instructions: ['1. Test update checking', '2. Verify download flow', '3. Test installation', '4. Verify rollback', '5. Test platform handlers', '6. Calculate validation score', '7. Identify issues', '8. Generate recommendations'] },
    outputSchema: { type: 'object', required: ['validationScore', 'artifacts'], properties: { validationScore: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'auto-update', 'validation']
}));
