/**
 * @process specializations/desktop-development/windows-features
 * @description Windows-Specific Feature Implementation - Implement Windows-specific features including jump lists,
 * thumbnail toolbars, taskbar progress, Windows Store integration, and registry operations.
 * @inputs { projectName: string, framework: string, windowsFeatures: array, outputDir?: string }
 * @outputs { success: boolean, features: object, storeConfig?: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/desktop-development/windows-features', {
 *   projectName: 'MyDesktopApp',
 *   framework: 'Electron',
 *   windowsFeatures: ['jump-lists', 'thumbnail-toolbar', 'taskbar-progress', 'toast-notifications', 'store-integration']
 * });
 *
 * @references
 * - Electron Windows Integration: https://www.electronjs.org/docs/latest/tutorial/windows-taskbar
 * - Windows App Features: https://docs.microsoft.com/en-us/windows/apps/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    framework = 'Electron',
    windowsFeatures = ['jump-lists', 'thumbnail-toolbar', 'taskbar-progress', 'toast-notifications'],
    outputDir = 'windows-features'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Windows-Specific Feature Implementation: ${projectName}`);

  // Phase 1: Requirements Analysis
  const requirements = await ctx.task(windowsRequirementsTask, { projectName, framework, windowsFeatures, outputDir });
  artifacts.push(...requirements.artifacts);

  const featureModules = {};

  // Implement each Windows feature
  if (windowsFeatures.includes('jump-lists')) {
    const jumpLists = await ctx.task(implementJumpListsTask, { projectName, framework, outputDir });
    artifacts.push(...jumpLists.artifacts);
    featureModules.jumpLists = jumpLists;
  }

  if (windowsFeatures.includes('thumbnail-toolbar')) {
    const thumbnailToolbar = await ctx.task(implementThumbnailToolbarTask, { projectName, framework, outputDir });
    artifacts.push(...thumbnailToolbar.artifacts);
    featureModules.thumbnailToolbar = thumbnailToolbar;
  }

  if (windowsFeatures.includes('taskbar-progress')) {
    const taskbarProgress = await ctx.task(implementTaskbarProgressTask, { projectName, framework, outputDir });
    artifacts.push(...taskbarProgress.artifacts);
    featureModules.taskbarProgress = taskbarProgress;
  }

  if (windowsFeatures.includes('toast-notifications')) {
    const toastNotifications = await ctx.task(implementWindowsToastTask, { projectName, framework, outputDir });
    artifacts.push(...toastNotifications.artifacts);
    featureModules.toastNotifications = toastNotifications;
  }

  if (windowsFeatures.includes('overlay-icon')) {
    const overlayIcon = await ctx.task(implementOverlayIconTask, { projectName, framework, outputDir });
    artifacts.push(...overlayIcon.artifacts);
    featureModules.overlayIcon = overlayIcon;
  }

  await ctx.breakpoint({
    question: `Windows features implemented: ${Object.keys(featureModules).join(', ')}. Review implementation?`,
    title: 'Windows Features Review',
    context: { runId: ctx.runId, features: Object.keys(featureModules) }
  });

  // Phase 7: Store Integration (if requested)
  let storeConfig = null;
  if (windowsFeatures.includes('store-integration')) {
    storeConfig = await ctx.task(implementStoreIntegrationTask, { projectName, framework, outputDir });
    artifacts.push(...storeConfig.artifacts);
  }

  // Phase 8: Validation
  const validation = await ctx.task(validateWindowsFeaturesTask, { projectName, framework, windowsFeatures, featureModules, outputDir });
  artifacts.push(...validation.artifacts);

  const validationPassed = validation.validationScore >= 80;

  return {
    success: validationPassed,
    projectName,
    features: Object.fromEntries(Object.entries(featureModules).map(([k, v]) => [k, { enabled: true, modulePath: v.modulePath }])),
    storeConfig: storeConfig ? { configured: true, appId: storeConfig.appId } : null,
    validation: { score: validation.validationScore, passed: validationPassed },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/desktop-development/windows-features', timestamp: startTime }
  };
}

export const windowsRequirementsTask = defineTask('windows-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Windows Requirements - ${args.projectName}`,
  agent: {
    name: 'windows-platform-expert',
    prompt: { role: 'Windows Features Analyst', task: 'Analyze Windows feature requirements', context: args, instructions: ['1. Analyze feature needs', '2. Check Windows version requirements', '3. Document API availability', '4. Assess manifest requirements', '5. Document dependencies', '6. Plan feature interactions', '7. Document testing needs', '8. Generate requirements document'] },
    outputSchema: { type: 'object', required: ['requirements', 'artifacts'], properties: { requirements: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'windows', 'requirements']
}));

export const implementJumpListsTask = defineTask('implement-jump-lists', (args, taskCtx) => ({
  kind: 'agent',
  title: `Jump Lists - ${args.projectName}`,
  skill: {
    name: 'windows-jumplist-builder',
  },
  agent: {
    name: 'windows-platform-expert',
    prompt: { role: 'Jump List Developer', task: 'Implement Windows Jump Lists', context: args, instructions: ['1. Create Jump List categories', '2. Add recent items', '3. Add frequent items', '4. Add custom tasks', '5. Handle item clicks', '6. Update Jump List dynamically', '7. Clear Jump List', '8. Generate Jump List module'] },
    outputSchema: { type: 'object', required: ['modulePath', 'artifacts'], properties: { modulePath: { type: 'string' }, categories: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'windows', 'jump-lists']
}));

export const implementThumbnailToolbarTask = defineTask('implement-thumbnail-toolbar', (args, taskCtx) => ({
  kind: 'agent',
  title: `Thumbnail Toolbar - ${args.projectName}`,
  agent: {
    name: 'toolbar-developer',
    prompt: { role: 'Thumbnail Toolbar Developer', task: 'Implement Windows thumbnail toolbar', context: args, instructions: ['1. Create toolbar buttons', '2. Configure button icons', '3. Handle button clicks', '4. Update button states', '5. Configure tooltips', '6. Handle media controls', '7. Clear toolbar', '8. Generate toolbar module'] },
    outputSchema: { type: 'object', required: ['modulePath', 'artifacts'], properties: { modulePath: { type: 'string' }, buttons: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'windows', 'thumbnail-toolbar']
}));

export const implementTaskbarProgressTask = defineTask('implement-taskbar-progress', (args, taskCtx) => ({
  kind: 'agent',
  title: `Taskbar Progress - ${args.projectName}`,
  agent: {
    name: 'progress-developer',
    prompt: { role: 'Taskbar Progress Developer', task: 'Implement taskbar progress indicator', context: args, instructions: ['1. Implement progress states', '2. Handle normal progress', '3. Handle indeterminate', '4. Handle paused state', '5. Handle error state', '6. Clear progress', '7. Sync with UI progress', '8. Generate progress module'] },
    outputSchema: { type: 'object', required: ['modulePath', 'artifacts'], properties: { modulePath: { type: 'string' }, states: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'windows', 'taskbar-progress']
}));

export const implementWindowsToastTask = defineTask('implement-windows-toast', (args, taskCtx) => ({
  kind: 'agent',
  title: `Windows Toast Notifications - ${args.projectName}`,
  agent: {
    name: 'toast-developer',
    prompt: { role: 'Toast Notification Developer', task: 'Implement Windows toast notifications', context: args, instructions: ['1. Configure app user model ID', '2. Create toast templates', '3. Handle toast actions', '4. Implement scheduled toasts', '5. Handle toast history', '6. Configure toast settings', '7. Handle Action Center', '8. Generate toast module'] },
    outputSchema: { type: 'object', required: ['modulePath', 'artifacts'], properties: { modulePath: { type: 'string' }, templates: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'windows', 'toast']
}));

export const implementOverlayIconTask = defineTask('implement-overlay-icon', (args, taskCtx) => ({
  kind: 'agent',
  title: `Overlay Icon - ${args.projectName}`,
  agent: {
    name: 'overlay-developer',
    prompt: { role: 'Overlay Icon Developer', task: 'Implement taskbar overlay icon', context: args, instructions: ['1. Create overlay icons', '2. Set overlay based on state', '3. Handle badge counts', '4. Clear overlay', '5. Configure accessibility', '6. Handle high DPI', '7. Sync with app state', '8. Generate overlay module'] },
    outputSchema: { type: 'object', required: ['modulePath', 'artifacts'], properties: { modulePath: { type: 'string' }, icons: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'windows', 'overlay-icon']
}));

export const implementStoreIntegrationTask = defineTask('implement-store-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Windows Store Integration - ${args.projectName}`,
  skill: {
    name: 'msix-packaging',
  },
  agent: {
    name: 'windows-platform-expert',
    prompt: { role: 'Windows Store Developer', task: 'Implement Windows Store integration', context: args, instructions: ['1. Configure app identity', '2. Create MSIX package', '3. Configure capabilities', '4. Handle licensing', '5. Implement in-app purchases', '6. Configure auto-updates', '7. Handle store ratings', '8. Generate store configuration'] },
    outputSchema: { type: 'object', required: ['appId', 'artifacts'], properties: { appId: { type: 'string' }, packageConfig: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'windows', 'store']
}));

export const validateWindowsFeaturesTask = defineTask('validate-windows-features', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validate Windows Features - ${args.projectName}`,
  agent: {
    name: 'windows-validator',
    prompt: { role: 'Windows Features Validator', task: 'Validate Windows feature implementation', context: args, instructions: ['1. Test each feature', '2. Verify on Windows 10/11', '3. Test taskbar integration', '4. Verify notifications', '5. Test store features', '6. Calculate validation score', '7. Identify issues', '8. Generate recommendations'] },
    outputSchema: { type: 'object', required: ['validationScore', 'artifacts'], properties: { validationScore: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'windows', 'validation']
}));
