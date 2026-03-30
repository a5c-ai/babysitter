/**
 * @process specializations/desktop-development/macos-features
 * @description macOS-Specific Feature Implementation - Implement macOS-specific features including Touch Bar,
 * dock integration, Handoff/Continuity, Spotlight integration, and Mac App Store preparation.
 * @inputs { projectName: string, framework: string, macosFeatures: array, outputDir?: string }
 * @outputs { success: boolean, features: object, appStoreConfig?: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/desktop-development/macos-features', {
 *   projectName: 'MyDesktopApp',
 *   framework: 'Electron',
 *   macosFeatures: ['touch-bar', 'dock-menu', 'handoff', 'spotlight', 'app-store']
 * });
 *
 * @references
 * - Electron macOS: https://www.electronjs.org/docs/latest/tutorial/macos-dock
 * - Apple Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/macos
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    framework = 'Electron',
    macosFeatures = ['touch-bar', 'dock-menu', 'handoff', 'spotlight'],
    outputDir = 'macos-features'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting macOS-Specific Feature Implementation: ${projectName}`);

  const requirements = await ctx.task(macosRequirementsTask, { projectName, framework, macosFeatures, outputDir });
  artifacts.push(...requirements.artifacts);

  const featureModules = {};

  if (macosFeatures.includes('touch-bar')) {
    const touchBar = await ctx.task(implementTouchBarTask, { projectName, framework, outputDir });
    artifacts.push(...touchBar.artifacts);
    featureModules.touchBar = touchBar;
  }

  if (macosFeatures.includes('dock-menu')) {
    const dockMenu = await ctx.task(implementDockMenuTask, { projectName, framework, outputDir });
    artifacts.push(...dockMenu.artifacts);
    featureModules.dockMenu = dockMenu;
  }

  if (macosFeatures.includes('handoff')) {
    const handoff = await ctx.task(implementHandoffTask, { projectName, framework, outputDir });
    artifacts.push(...handoff.artifacts);
    featureModules.handoff = handoff;
  }

  if (macosFeatures.includes('spotlight')) {
    const spotlight = await ctx.task(implementSpotlightTask, { projectName, framework, outputDir });
    artifacts.push(...spotlight.artifacts);
    featureModules.spotlight = spotlight;
  }

  if (macosFeatures.includes('native-tabs')) {
    const nativeTabs = await ctx.task(implementNativeTabsTask, { projectName, framework, outputDir });
    artifacts.push(...nativeTabs.artifacts);
    featureModules.nativeTabs = nativeTabs;
  }

  await ctx.breakpoint({
    question: `macOS features implemented: ${Object.keys(featureModules).join(', ')}. Review implementation?`,
    title: 'macOS Features Review',
    context: { runId: ctx.runId, features: Object.keys(featureModules) }
  });

  let appStoreConfig = null;
  if (macosFeatures.includes('app-store')) {
    appStoreConfig = await ctx.task(implementAppStoreTask, { projectName, framework, outputDir });
    artifacts.push(...appStoreConfig.artifacts);
  }

  const validation = await ctx.task(validateMacosFeaturesTask, { projectName, framework, macosFeatures, featureModules, outputDir });
  artifacts.push(...validation.artifacts);

  const validationPassed = validation.validationScore >= 80;

  return {
    success: validationPassed,
    projectName,
    features: Object.fromEntries(Object.entries(featureModules).map(([k, v]) => [k, { enabled: true, modulePath: v.modulePath }])),
    appStoreConfig: appStoreConfig ? { configured: true, bundleId: appStoreConfig.bundleId } : null,
    validation: { score: validation.validationScore, passed: validationPassed },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/desktop-development/macos-features', timestamp: startTime }
  };
}

export const macosRequirementsTask = defineTask('macos-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `macOS Requirements - ${args.projectName}`,
  agent: {
    name: 'macos-platform-expert',
    prompt: { role: 'macOS Features Analyst', task: 'Analyze macOS feature requirements', context: args, instructions: ['1. Analyze feature needs', '2. Check macOS version requirements', '3. Document API availability', '4. Assess entitlements needed', '5. Document dependencies', '6. Plan Catalyst support', '7. Document testing needs', '8. Generate requirements document'] },
    outputSchema: { type: 'object', required: ['requirements', 'artifacts'], properties: { requirements: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'macos', 'requirements']
}));

export const implementTouchBarTask = defineTask('implement-touch-bar', (args, taskCtx) => ({
  kind: 'agent',
  title: `Touch Bar - ${args.projectName}`,
  skill: {
    name: 'touchbar-nstouchbar-builder',
  },
  agent: {
    name: 'macos-appkit-catalyst-specialist',
    prompt: { role: 'Touch Bar Developer', task: 'Implement Touch Bar support', context: args, instructions: ['1. Create TouchBar items', '2. Add buttons and labels', '3. Add sliders and scrubbers', '4. Handle item interactions', '5. Update Touch Bar dynamically', '6. Handle escape key', '7. Configure per-window Touch Bar', '8. Generate Touch Bar module'] },
    outputSchema: { type: 'object', required: ['modulePath', 'artifacts'], properties: { modulePath: { type: 'string' }, items: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'macos', 'touch-bar']
}));

export const implementDockMenuTask = defineTask('implement-dock-menu', (args, taskCtx) => ({
  kind: 'agent',
  title: `Dock Menu - ${args.projectName}`,
  skill: {
    name: 'macos-dock-badge-manager',
  },
  agent: {
    name: 'macos-appkit-catalyst-specialist',
    prompt: { role: 'Dock Developer', task: 'Implement Dock integration', context: args, instructions: ['1. Create Dock menu', '2. Add recent documents', '3. Handle dock bounce', '4. Set dock badge', '5. Handle dock icon', '6. Implement hide/show', '7. Configure dock preferences', '8. Generate Dock module'] },
    outputSchema: { type: 'object', required: ['modulePath', 'artifacts'], properties: { modulePath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'macos', 'dock']
}));

export const implementHandoffTask = defineTask('implement-handoff', (args, taskCtx) => ({
  kind: 'agent',
  title: `Handoff/Continuity - ${args.projectName}`,
  agent: {
    name: 'handoff-developer',
    prompt: { role: 'Handoff Developer', task: 'Implement Handoff and Continuity', context: args, instructions: ['1. Configure NSUserActivity', '2. Define activity types', '3. Handle activity resumption', '4. Implement Universal Links', '5. Configure entitlements', '6. Handle activity updates', '7. Test cross-device', '8. Generate Handoff module'] },
    outputSchema: { type: 'object', required: ['modulePath', 'artifacts'], properties: { modulePath: { type: 'string' }, activityTypes: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'macos', 'handoff']
}));

export const implementSpotlightTask = defineTask('implement-spotlight', (args, taskCtx) => ({
  kind: 'agent',
  title: `Spotlight Integration - ${args.projectName}`,
  agent: {
    name: 'spotlight-developer',
    prompt: { role: 'Spotlight Developer', task: 'Implement Spotlight integration', context: args, instructions: ['1. Index content with Core Spotlight', '2. Define searchable attributes', '3. Handle search result clicks', '4. Update index dynamically', '5. Remove indexed items', '6. Configure content types', '7. Optimize for performance', '8. Generate Spotlight module'] },
    outputSchema: { type: 'object', required: ['modulePath', 'artifacts'], properties: { modulePath: { type: 'string' }, contentTypes: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'macos', 'spotlight']
}));

export const implementNativeTabsTask = defineTask('implement-native-tabs', (args, taskCtx) => ({
  kind: 'agent',
  title: `Native Tabs - ${args.projectName}`,
  agent: {
    name: 'tabs-developer',
    prompt: { role: 'Native Tabs Developer', task: 'Implement macOS native tabs', context: args, instructions: ['1. Enable tabbingIdentifier', '2. Merge windows into tabs', '3. Handle tab switching', '4. Configure tab bar visibility', '5. Handle tab dragging', '6. Sync tab state', '7. Configure tab menu', '8. Generate tabs module'] },
    outputSchema: { type: 'object', required: ['modulePath', 'artifacts'], properties: { modulePath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'macos', 'native-tabs']
}));

export const implementAppStoreTask = defineTask('implement-app-store', (args, taskCtx) => ({
  kind: 'agent',
  title: `Mac App Store - ${args.projectName}`,
  skill: {
    name: 'mas-entitlements-generator',
  },
  agent: {
    name: 'macos-appkit-catalyst-specialist',
    prompt: { role: 'App Store Developer', task: 'Prepare for Mac App Store', context: args, instructions: ['1. Configure sandbox entitlements', '2. Handle app receipt validation', '3. Implement in-app purchases', '4. Configure App Store Connect', '5. Handle reviews and ratings', '6. Configure provisioning', '7. Create screenshots', '8. Generate App Store configuration'] },
    outputSchema: { type: 'object', required: ['bundleId', 'artifacts'], properties: { bundleId: { type: 'string' }, entitlements: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'macos', 'app-store']
}));

export const validateMacosFeaturesTask = defineTask('validate-macos-features', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validate macOS Features - ${args.projectName}`,
  agent: {
    name: 'macos-validator',
    prompt: { role: 'macOS Features Validator', task: 'Validate macOS feature implementation', context: args, instructions: ['1. Test each feature', '2. Verify on macOS versions', '3. Test Touch Bar', '4. Verify Dock integration', '5. Test Handoff', '6. Calculate validation score', '7. Identify issues', '8. Generate recommendations'] },
    outputSchema: { type: 'object', required: ['validationScore', 'artifacts'], properties: { validationScore: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'macos', 'validation']
}));
