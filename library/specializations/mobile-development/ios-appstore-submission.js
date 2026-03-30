/**
 * @process specializations/mobile-development/ios-appstore-submission
 * @description iOS App Store Submission Workflow - Complete guide for preparing and submitting iOS apps to the App Store
 * including metadata, screenshots, App Store Connect configuration, and review guidelines compliance.
 * @inputs { appName: string, appVersion: string, bundleId: string, teamId?: string }
 * @outputs { success: boolean, submissionChecklist: array, metadata: object, assets: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/mobile-development/ios-appstore-submission', {
 *   appName: 'MyiOSApp',
 *   appVersion: '1.0.0',
 *   bundleId: 'com.example.myapp',
 *   teamId: 'TEAM123456'
 * });
 *
 * @references
 * - App Store Connect: https://developer.apple.com/app-store-connect/
 * - App Store Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
 * - App Store Optimization: https://developer.apple.com/app-store/product-page/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    appName,
    appVersion,
    bundleId,
    teamId = '',
    outputDir = 'ios-appstore-submission'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting iOS App Store Submission: ${appName} v${appVersion}`);

  const phases = [
    { name: 'prerequisites-check', title: 'Prerequisites Check' },
    { name: 'app-store-connect-setup', title: 'App Store Connect Setup' },
    { name: 'app-metadata', title: 'App Metadata Preparation' },
    { name: 'screenshots-preparation', title: 'Screenshots and Preview' },
    { name: 'app-privacy', title: 'App Privacy Configuration' },
    { name: 'in-app-purchases', title: 'In-App Purchases Setup' },
    { name: 'build-archive', title: 'Build and Archive' },
    { name: 'testflight-beta', title: 'TestFlight Beta Testing' },
    { name: 'review-guidelines', title: 'Review Guidelines Check' },
    { name: 'submission', title: 'App Submission' },
    { name: 'post-submission', title: 'Post-Submission Monitoring' },
    { name: 'release-management', title: 'Release Management' }
  ];

  for (const phase of phases) {
    ctx.log('info', `Processing: ${phase.title}`);
    const result = await ctx.task(createSubmissionTask(phase.name, phase.title), {
      appName, appVersion, bundleId, teamId, outputDir
    });
    artifacts.push(...result.artifacts);
  }

  await ctx.breakpoint({
    question: `App Store submission prepared for ${appName} v${appVersion}. Ready to submit?`,
    title: 'Submission Review',
    context: { runId: ctx.runId, appName, appVersion, bundleId, phases: phases.map(p => p.title) }
  });

  const endTime = ctx.now();
  return {
    success: true,
    appName,
    appVersion,
    bundleId,
    submissionChecklist: phases.map(p => ({ phase: p.title, status: 'complete' })),
    metadata: { title: appName, version: appVersion },
    assets: { screenshots: 'prepared', previews: 'prepared' },
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/mobile-development/ios-appstore-submission', timestamp: startTime }
  };
}

function createSubmissionTask(name, title) {
  return (args, taskCtx) => ({
    kind: 'agent',
    title: `${title} - ${args.appName}`,
    skill: { name: 'appstore-connect' },
    agent: {
      name: 'mobile-devops',
      prompt: {
        role: 'iOS App Store Submission Specialist',
        task: `Execute ${title.toLowerCase()} for App Store submission`,
        context: args,
        instructions: [
          `1. Execute ${title.toLowerCase()} procedures`,
          `2. Validate requirements and compliance`,
          `3. Document completion status`,
          `4. Generate checklist items`,
          `5. Report any issues`
        ],
        outputFormat: 'JSON with submission details'
      },
      outputSchema: {
        type: 'object',
        required: ['status', 'artifacts'],
        properties: { status: { type: 'string' }, checklist: { type: 'array' }, artifacts: { type: 'array' } }
      }
    },
    io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
    labels: ['mobile', 'ios', 'appstore', name]
  });
}

export const prerequisitesTask = createSubmissionTask('prerequisites-check', 'Prerequisites Check');
export const appStoreConnectTask = createSubmissionTask('app-store-connect-setup', 'App Store Connect Setup');
export const metadataTask = createSubmissionTask('app-metadata', 'App Metadata Preparation');
export const screenshotsTask = createSubmissionTask('screenshots-preparation', 'Screenshots and Preview');
export const privacyTask = createSubmissionTask('app-privacy', 'App Privacy Configuration');
export const iapTask = createSubmissionTask('in-app-purchases', 'In-App Purchases Setup');
export const buildArchiveTask = createSubmissionTask('build-archive', 'Build and Archive');
export const testflightTask = createSubmissionTask('testflight-beta', 'TestFlight Beta Testing');
export const guidelinesTask = createSubmissionTask('review-guidelines', 'Review Guidelines Check');
export const submissionTask = createSubmissionTask('submission', 'App Submission');
export const postSubmissionTask = createSubmissionTask('post-submission', 'Post-Submission Monitoring');
export const releaseManagementTask = createSubmissionTask('release-management', 'Release Management');
