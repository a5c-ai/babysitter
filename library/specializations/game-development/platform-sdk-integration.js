/**
 * @process specializations/game-development/platform-sdk-integration
 * @description Platform SDK Integration Process - Integrate platform-specific features including achievements,
 * cloud saves, social features, controller support, and platform certification requirements.
 * @inputs { projectName: string, platforms?: array, features?: array, outputDir?: string }
 * @outputs { success: boolean, integrations: array, certificationStatus: object, documentation: string, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    platforms = ['steam', 'playstation', 'xbox'],
    features = ['achievements', 'cloud-saves', 'leaderboards', 'social'],
    controllerSupport = true,
    outputDir = 'platform-sdk-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Platform SDK Integration: ${projectName}`);

  // Phase 1: Platform Requirements Analysis
  const requirements = await ctx.task(platformRequirementsTask, { projectName, platforms, features, outputDir });
  artifacts.push(...requirements.artifacts);

  // Phase 2: SDK Setup per Platform
  const sdkSetups = await ctx.parallel.all(
    platforms.map(platform =>
      ctx.task(sdkSetupTask, { projectName, platform, features, outputDir })
    )
  );
  sdkSetups.forEach(setup => artifacts.push(...setup.artifacts));

  // Phase 3: Achievements and Trophies System
  const achievements = await ctx.task(achievementsSystemTask, { projectName, platforms, outputDir });
  artifacts.push(...achievements.artifacts);

  // Phase 4: Cloud Save Integration
  const cloudSaves = await ctx.task(cloudSaveIntegrationTask, { projectName, platforms, outputDir });
  artifacts.push(...cloudSaves.artifacts);

  // Phase 5: Social Features
  const social = await ctx.task(socialFeaturesTask, { projectName, platforms, outputDir });
  artifacts.push(...social.artifacts);

  // Phase 6: Controller and Input Integration
  if (controllerSupport) {
    const controller = await ctx.task(controllerIntegrationTask, { projectName, platforms, outputDir });
    artifacts.push(...controller.artifacts);
  }

  // Phase 7: Platform Compliance Testing
  const compliance = await ctx.task(platformComplianceTask, { projectName, platforms, outputDir });
  artifacts.push(...compliance.artifacts);

  // Phase 8: Integration Testing
  const testing = await ctx.task(integrationTestingTask, { projectName, sdkSetups, outputDir });
  artifacts.push(...testing.artifacts);

  await ctx.breakpoint({
    question: `Platform SDK integration complete for ${projectName}. ${platforms.length} platforms. ${achievements.achievementCount} achievements. Compliance: ${compliance.passRate}%. Review?`,
    title: 'Platform SDK Integration Review',
    context: { runId: ctx.runId, sdkSetups, achievements, compliance, testing }
  });

  return {
    success: true,
    projectName,
    integrations: sdkSetups.map(s => ({ platform: s.platform, status: s.status })),
    certificationStatus: { platforms: compliance.platformStatuses, passRate: compliance.passRate },
    documentation: requirements.docPath,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/game-development/platform-sdk-integration', timestamp: startTime, outputDir }
  };
}

export const platformRequirementsTask = defineTask('platform-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Platform Requirements - ${args.projectName}`,
  agent: {
    name: 'gameplay-programmer-agent',
    prompt: { role: 'Platform Engineer', task: 'Analyze platform requirements', context: args, instructions: ['1. Review platform TRCs', '2. Identify feature requirements', '3. Map platform APIs', '4. Document requirements'] },
    outputSchema: { type: 'object', required: ['docPath', 'requirements', 'artifacts'], properties: { docPath: { type: 'string' }, requirements: { type: 'array' }, platformAPIs: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'platform', 'requirements']
}));

export const sdkSetupTask = defineTask('sdk-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `SDK Setup - ${args.platform}`,
  agent: {
    name: 'gameplay-programmer-agent',
    prompt: { role: 'Platform Engineer', task: 'Set up platform SDK', context: args, instructions: ['1. Download and install SDK', '2. Configure project settings', '3. Initialize SDK in code', '4. Test basic functionality'] },
    outputSchema: { type: 'object', required: ['platform', 'status', 'artifacts'], properties: { platform: { type: 'string' }, status: { type: 'string' }, configuration: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'platform', 'sdk']
}));

export const achievementsSystemTask = defineTask('achievements-system', (args, taskCtx) => ({
  kind: 'agent',
  title: `Achievements System - ${args.projectName}`,
  agent: {
    name: 'gameplay-programmer-agent',
    prompt: { role: 'Gameplay Programmer', task: 'Implement achievements system', context: args, instructions: ['1. Define achievement list', '2. Create unlock conditions', '3. Implement tracking system', '4. Test achievement unlocks'] },
    outputSchema: { type: 'object', required: ['achievementCount', 'achievements', 'artifacts'], properties: { achievementCount: { type: 'number' }, achievements: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'platform', 'achievements']
}));

export const cloudSaveIntegrationTask = defineTask('cloud-save-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Cloud Save Integration - ${args.projectName}`,
  agent: {
    name: 'backend-engineer-agent',
    prompt: { role: 'Backend Engineer', task: 'Integrate cloud saves', context: args, instructions: ['1. Implement save serialization', '2. Add cloud sync logic', '3. Handle conflict resolution', '4. Test cross-device saves'] },
    outputSchema: { type: 'object', required: ['integrated', 'platforms', 'artifacts'], properties: { integrated: { type: 'boolean' }, platforms: { type: 'array' }, conflictStrategy: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'platform', 'cloud-save']
}));

export const socialFeaturesTask = defineTask('social-features', (args, taskCtx) => ({
  kind: 'agent',
  title: `Social Features - ${args.projectName}`,
  agent: {
    name: 'gameplay-programmer-agent',
    prompt: { role: 'Platform Engineer', task: 'Implement social features', context: args, instructions: ['1. Implement friends list', '2. Add leaderboards', '3. Create activity feed', '4. Test social interactions'] },
    outputSchema: { type: 'object', required: ['features', 'artifacts'], properties: { features: { type: 'array' }, leaderboards: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'platform', 'social']
}));

export const controllerIntegrationTask = defineTask('controller-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Controller Integration - ${args.projectName}`,
  agent: {
    name: 'input-programmer-agent',
    prompt: { role: 'Input Programmer', task: 'Integrate controller support', context: args, instructions: ['1. Map controller inputs', '2. Add rumble/haptics', '3. Support platform controllers', '4. Test all input methods'] },
    outputSchema: { type: 'object', required: ['controllers', 'artifacts'], properties: { controllers: { type: 'array' }, hapticSupport: { type: 'boolean' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'platform', 'controller']
}));

export const platformComplianceTask = defineTask('platform-compliance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Platform Compliance - ${args.projectName}`,
  agent: {
    name: 'game-qa-agent',
    prompt: { role: 'QA Engineer', task: 'Test platform compliance', context: args, instructions: ['1. Run TRC checklist', '2. Test required features', '3. Document failures', '4. Create compliance report'] },
    outputSchema: { type: 'object', required: ['passRate', 'platformStatuses', 'artifacts'], properties: { passRate: { type: 'number' }, platformStatuses: { type: 'object' }, failures: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'platform', 'compliance']
}));

export const integrationTestingTask = defineTask('integration-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Integration Testing - ${args.projectName}`,
  agent: {
    name: 'game-qa-agent',
    prompt: { role: 'QA Engineer', task: 'Test SDK integrations', context: args, instructions: ['1. Test each platform SDK', '2. Verify feature functionality', '3. Test edge cases', '4. Create test report'] },
    outputSchema: { type: 'object', required: ['passRate', 'issues', 'artifacts'], properties: { passRate: { type: 'number' }, issues: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'platform', 'testing']
}));
