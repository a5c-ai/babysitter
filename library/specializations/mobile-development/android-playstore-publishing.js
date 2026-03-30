/**
 * @process specializations/mobile-development/android-playstore-publishing
 * @description Android Play Store Publishing Workflow - Complete guide for preparing and publishing Android apps
 * to Google Play Store including store listing, release management, and policy compliance.
 * @inputs { appName: string, packageName: string, appVersion: string, releaseTrack?: string }
 * @outputs { success: boolean, publishingChecklist: array, storeListing: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/mobile-development/android-playstore-publishing', {
 *   appName: 'MyAndroidApp',
 *   packageName: 'com.example.myapp',
 *   appVersion: '1.0.0',
 *   releaseTrack: 'production'
 * });
 *
 * @references
 * - Google Play Console: https://play.google.com/console
 * - Play Store Policies: https://support.google.com/googleplay/android-developer/topic/9858052
 * - Android App Bundle: https://developer.android.com/guide/app-bundle
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    appName,
    packageName,
    appVersion,
    releaseTrack = 'production',
    outputDir = 'playstore-publishing'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Play Store Publishing: ${appName} v${appVersion}`);

  const phases = [
    { name: 'console-setup', title: 'Play Console Setup' },
    { name: 'store-listing', title: 'Store Listing Creation' },
    { name: 'graphics-assets', title: 'Graphics Assets Preparation' },
    { name: 'content-rating', title: 'Content Rating Questionnaire' },
    { name: 'target-audience', title: 'Target Audience and Content' },
    { name: 'data-safety', title: 'Data Safety Declaration' },
    { name: 'app-signing', title: 'App Signing Configuration' },
    { name: 'aab-generation', title: 'App Bundle Generation' },
    { name: 'internal-testing', title: 'Internal Testing Track' },
    { name: 'closed-testing', title: 'Closed Testing Track' },
    { name: 'open-testing', title: 'Open Testing Track' },
    { name: 'production-release', title: 'Production Release' },
    { name: 'staged-rollout', title: 'Staged Rollout Management' },
    { name: 'post-launch', title: 'Post-Launch Monitoring' }
  ];

  for (const phase of phases) {
    ctx.log('info', `Processing: ${phase.title}`);
    const result = await ctx.task(createPublishingTask(phase.name, phase.title), {
      appName, packageName, appVersion, releaseTrack, outputDir
    });
    artifacts.push(...result.artifacts);
  }

  await ctx.breakpoint({
    question: `Play Store publishing prepared for ${appName} v${appVersion}. Track: ${releaseTrack}. Ready to publish?`,
    title: 'Publishing Review',
    context: { runId: ctx.runId, appName, packageName, appVersion, releaseTrack }
  });

  const endTime = ctx.now();
  return {
    success: true,
    appName,
    packageName,
    appVersion,
    releaseTrack,
    publishingChecklist: phases.map(p => ({ phase: p.title, status: 'complete' })),
    storeListing: { title: appName, packageName },
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/mobile-development/android-playstore-publishing', timestamp: startTime }
  };
}

function createPublishingTask(name, title) {
  return (args, taskCtx) => ({
    kind: 'agent',
    title: `${title} - ${args.appName}`,
    skill: { name: 'play-console' },
    agent: {
      name: 'mobile-devops',
      prompt: {
        role: 'Android Play Store Publishing Specialist',
        task: `Execute ${title.toLowerCase()} for Play Store publishing`,
        context: args,
        instructions: [
          `1. Execute ${title.toLowerCase()} procedures`,
          `2. Validate Play Store requirements`,
          `3. Document completion status`,
          `4. Generate checklist items`,
          `5. Report any policy issues`
        ],
        outputFormat: 'JSON with publishing details'
      },
      outputSchema: {
        type: 'object',
        required: ['status', 'artifacts'],
        properties: { status: { type: 'string' }, checklist: { type: 'array' }, artifacts: { type: 'array' } }
      }
    },
    io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
    labels: ['mobile', 'android', 'playstore', name]
  });
}

export const consoleSetupTask = createPublishingTask('console-setup', 'Play Console Setup');
export const storeListingTask = createPublishingTask('store-listing', 'Store Listing Creation');
export const graphicsTask = createPublishingTask('graphics-assets', 'Graphics Assets Preparation');
export const contentRatingTask = createPublishingTask('content-rating', 'Content Rating Questionnaire');
export const targetAudienceTask = createPublishingTask('target-audience', 'Target Audience and Content');
export const dataSafetyTask = createPublishingTask('data-safety', 'Data Safety Declaration');
export const appSigningTask = createPublishingTask('app-signing', 'App Signing Configuration');
export const aabGenerationTask = createPublishingTask('aab-generation', 'App Bundle Generation');
export const internalTestingTask = createPublishingTask('internal-testing', 'Internal Testing Track');
export const closedTestingTask = createPublishingTask('closed-testing', 'Closed Testing Track');
export const openTestingTask = createPublishingTask('open-testing', 'Open Testing Track');
export const productionReleaseTask = createPublishingTask('production-release', 'Production Release');
export const stagedRolloutTask = createPublishingTask('staged-rollout', 'Staged Rollout Management');
export const postLaunchTask = createPublishingTask('post-launch', 'Post-Launch Monitoring');
