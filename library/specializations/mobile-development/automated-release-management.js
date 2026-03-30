/**
 * @process specializations/mobile-development/automated-release-management
 * @description Automated Release Management - End-to-end release automation including versioning,
 * changelog generation, staged rollouts, feature flags, and rollback procedures.
 * @inputs { appName: string, platforms: array, releaseStrategy?: string, rolloutPercentage?: number }
 * @outputs { success: boolean, releaseConfig: object, automation: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/mobile-development/automated-release-management', {
 *   appName: 'MyApp',
 *   platforms: ['ios', 'android'],
 *   releaseStrategy: 'staged-rollout',
 *   rolloutPercentage: 10
 * });
 *
 * @references
 * - Semantic Versioning: https://semver.org/
 * - App Store Phased Release: https://developer.apple.com/help/app-store-connect/update-your-app/release-a-version-update-in-phases
 * - Google Play Staged Rollouts: https://support.google.com/googleplay/android-developer/answer/6346149
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    appName,
    platforms = ['ios', 'android'],
    releaseStrategy = 'staged-rollout',
    rolloutPercentage = 10,
    outputDir = 'release-management'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Release Management Setup: ${appName}`);
  ctx.log('info', `Strategy: ${releaseStrategy}, Initial Rollout: ${rolloutPercentage}%`);

  const phases = [
    { name: 'versioning-strategy', title: 'Versioning Strategy Setup' },
    { name: 'changelog-automation', title: 'Changelog Automation' },
    { name: 'release-branch-strategy', title: 'Release Branch Strategy' },
    { name: 'build-number-automation', title: 'Build Number Automation' },
    { name: 'release-candidate-process', title: 'Release Candidate Process' },
    { name: 'staged-rollout-setup', title: 'Staged Rollout Configuration' },
    { name: 'feature-flags', title: 'Feature Flags Integration' },
    { name: 'release-notes-generation', title: 'Release Notes Generation' },
    { name: 'approval-workflow', title: 'Release Approval Workflow' },
    { name: 'monitoring-setup', title: 'Release Monitoring Setup' },
    { name: 'rollback-procedures', title: 'Rollback Procedures' },
    { name: 'hotfix-process', title: 'Hotfix Process Setup' },
    { name: 'release-communication', title: 'Release Communication Automation' },
    { name: 'post-release-validation', title: 'Post-Release Validation' }
  ];

  for (const phase of phases) {
    ctx.log('info', `Processing: ${phase.title}`);
    const result = await ctx.task(createReleaseTask(phase.name, phase.title), {
      appName, platforms, releaseStrategy, rolloutPercentage, outputDir
    });
    artifacts.push(...result.artifacts);
  }

  await ctx.breakpoint({
    question: `Release management configured for ${appName}. Ready to execute first release?`,
    title: 'Release Management Review',
    context: { runId: ctx.runId, appName, releaseStrategy, rolloutPercentage }
  });

  const endTime = ctx.now();
  return {
    success: true,
    appName,
    platforms,
    releaseStrategy,
    rolloutPercentage,
    releaseConfig: { status: 'configured', phases: phases.length },
    automation: phases.map(p => p.title),
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/mobile-development/automated-release-management', timestamp: startTime }
  };
}

function createReleaseTask(name, title) {
  return (args, taskCtx) => ({
    kind: 'agent',
    title: `${title} - ${args.appName}`,
    skill: { name: 'fastlane-cicd' },
    agent: {
      name: 'mobile-devops',
      prompt: {
        role: 'Mobile Release Manager',
        task: `Configure ${title.toLowerCase()} for release automation`,
        context: args,
        instructions: [
          `1. Set up ${title.toLowerCase()} automation`,
          `2. Configure for ${args.platforms.join(' and ')}`,
          `3. Integrate with ${args.releaseStrategy} strategy`,
          `4. Test automation workflow`,
          `5. Document procedures`
        ],
        outputFormat: 'JSON with release details'
      },
      outputSchema: {
        type: 'object',
        required: ['config', 'artifacts'],
        properties: { config: { type: 'object' }, automation: { type: 'array' }, artifacts: { type: 'array' } }
      }
    },
    io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
    labels: ['mobile', 'release', name]
  });
}

export const versioningStrategyTask = createReleaseTask('versioning-strategy', 'Versioning Strategy Setup');
export const changelogAutomationTask = createReleaseTask('changelog-automation', 'Changelog Automation');
export const releaseBranchTask = createReleaseTask('release-branch-strategy', 'Release Branch Strategy');
export const buildNumberTask = createReleaseTask('build-number-automation', 'Build Number Automation');
export const releaseCandidateTask = createReleaseTask('release-candidate-process', 'Release Candidate Process');
export const stagedRolloutTask = createReleaseTask('staged-rollout-setup', 'Staged Rollout Configuration');
export const featureFlagsTask = createReleaseTask('feature-flags', 'Feature Flags Integration');
export const releaseNotesTask = createReleaseTask('release-notes-generation', 'Release Notes Generation');
export const approvalWorkflowTask = createReleaseTask('approval-workflow', 'Release Approval Workflow');
export const monitoringSetupTask = createReleaseTask('monitoring-setup', 'Release Monitoring Setup');
export const rollbackProceduresTask = createReleaseTask('rollback-procedures', 'Rollback Procedures');
export const hotfixProcessTask = createReleaseTask('hotfix-process', 'Hotfix Process Setup');
export const releaseCommunicationTask = createReleaseTask('release-communication', 'Release Communication Automation');
export const postReleaseValidationTask = createReleaseTask('post-release-validation', 'Post-Release Validation');
