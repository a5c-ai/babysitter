/**
 * @process specializations/mobile-development/beta-testing-setup
 * @description Beta Testing Infrastructure Setup - Configure TestFlight for iOS and Google Play Testing
 * for Android with tester management, feedback collection, and crash reporting integration.
 * @inputs { appName: string, platforms: array, testerGroups?: array, feedbackChannels?: array }
 * @outputs { success: boolean, testflightConfig: object, playTestingConfig: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/mobile-development/beta-testing-setup', {
 *   appName: 'MyApp',
 *   platforms: ['ios', 'android'],
 *   testerGroups: ['internal', 'beta', 'external'],
 *   feedbackChannels: ['in-app', 'email', 'slack']
 * });
 *
 * @references
 * - TestFlight: https://developer.apple.com/testflight/
 * - Google Play Testing: https://support.google.com/googleplay/android-developer/answer/9845334
 * - Firebase App Distribution: https://firebase.google.com/docs/app-distribution
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    appName,
    platforms = ['ios', 'android'],
    testerGroups = ['internal', 'beta'],
    feedbackChannels = ['in-app'],
    outputDir = 'beta-testing'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Beta Testing Setup: ${appName}`);
  ctx.log('info', `Platforms: ${platforms.join(', ')}`);

  const phases = [
    { name: 'testflight-setup', title: 'TestFlight Configuration' },
    { name: 'play-testing-setup', title: 'Google Play Testing Setup' },
    { name: 'tester-group-management', title: 'Tester Group Management' },
    { name: 'build-distribution', title: 'Build Distribution Setup' },
    { name: 'feedback-collection', title: 'Feedback Collection System' },
    { name: 'crash-reporting', title: 'Crash Reporting Integration' },
    { name: 'analytics-integration', title: 'Beta Analytics Integration' },
    { name: 'version-management', title: 'Version Management' },
    { name: 'notification-system', title: 'Tester Notification System' },
    { name: 'compliance-setup', title: 'Compliance and Privacy Setup' },
    { name: 'automation-setup', title: 'Distribution Automation' },
    { name: 'documentation', title: 'Beta Program Documentation' }
  ];

  for (const phase of phases) {
    ctx.log('info', `Processing: ${phase.title}`);
    const result = await ctx.task(createBetaTestingTask(phase.name, phase.title), {
      appName, platforms, testerGroups, feedbackChannels, outputDir
    });
    artifacts.push(...result.artifacts);
  }

  await ctx.breakpoint({
    question: `Beta testing infrastructure ready for ${appName}. Ready to start beta program?`,
    title: 'Beta Testing Review',
    context: { runId: ctx.runId, appName, platforms, testerGroups }
  });

  const endTime = ctx.now();
  return {
    success: true,
    appName,
    platforms,
    testerGroups,
    testflightConfig: platforms.includes('ios') ? { status: 'configured' } : null,
    playTestingConfig: platforms.includes('android') ? { status: 'configured' } : null,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/mobile-development/beta-testing-setup', timestamp: startTime }
  };
}

function createBetaTestingTask(name, title) {
  return (args, taskCtx) => ({
    kind: 'agent',
    title: `${title} - ${args.appName}`,
    skill: { name: 'mobile-testing' },
    agent: {
      name: 'mobile-qa-expert',
      prompt: {
        role: 'Mobile Beta Testing Specialist',
        task: `Configure ${title.toLowerCase()} for beta testing`,
        context: args,
        instructions: [
          `1. Set up ${title.toLowerCase()} infrastructure`,
          `2. Configure for ${args.platforms.join(' and ')}`,
          `3. Integrate with tester management`,
          `4. Document configuration and procedures`,
          `5. Test distribution workflow`
        ],
        outputFormat: 'JSON with beta testing details'
      },
      outputSchema: {
        type: 'object',
        required: ['config', 'artifacts'],
        properties: { config: { type: 'object' }, artifacts: { type: 'array' } }
      }
    },
    io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
    labels: ['mobile', 'beta-testing', name]
  });
}

export const testflightSetupTask = createBetaTestingTask('testflight-setup', 'TestFlight Configuration');
export const playTestingSetupTask = createBetaTestingTask('play-testing-setup', 'Google Play Testing Setup');
export const testerGroupTask = createBetaTestingTask('tester-group-management', 'Tester Group Management');
export const buildDistributionTask = createBetaTestingTask('build-distribution', 'Build Distribution Setup');
export const feedbackCollectionTask = createBetaTestingTask('feedback-collection', 'Feedback Collection System');
export const crashReportingTask = createBetaTestingTask('crash-reporting', 'Crash Reporting Integration');
export const analyticsIntegrationTask = createBetaTestingTask('analytics-integration', 'Beta Analytics Integration');
export const versionManagementTask = createBetaTestingTask('version-management', 'Version Management');
export const notificationSystemTask = createBetaTestingTask('notification-system', 'Tester Notification System');
export const complianceSetupTask = createBetaTestingTask('compliance-setup', 'Compliance and Privacy Setup');
export const automationSetupTask = createBetaTestingTask('automation-setup', 'Distribution Automation');
export const documentationTask = createBetaTestingTask('documentation', 'Beta Program Documentation');
