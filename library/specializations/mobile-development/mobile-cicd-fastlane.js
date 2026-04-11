/**
 * @process specializations/mobile-development/mobile-cicd-fastlane
 * @description Mobile CI/CD with Fastlane - Automated build, test, and deployment pipeline using
 * Fastlane for iOS and Android with code signing, screenshots automation, and release management.
 * @inputs { appName: string, platforms: array, ciProvider?: string, deployTargets?: array }
 * @outputs { success: boolean, pipelineConfig: object, lanes: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/mobile-development/mobile-cicd-fastlane', {
 *   appName: 'MyApp',
 *   platforms: ['ios', 'android'],
 *   ciProvider: 'github-actions',
 *   deployTargets: ['testflight', 'play-store']
 * });
 *
 * @references
 * - Fastlane: https://fastlane.tools/
 * - Fastlane iOS: https://docs.fastlane.tools/actions/
 * - Fastlane Android: https://docs.fastlane.tools/getting-started/android/setup/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    appName,
    platforms = ['ios', 'android'],
    ciProvider = 'github-actions',
    deployTargets = ['testflight', 'play-store'],
    outputDir = 'cicd-fastlane'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting CI/CD Fastlane Setup: ${appName}`);
  ctx.log('info', `CI Provider: ${ciProvider}, Platforms: ${platforms.join(', ')}`);

  const phases = [
    { name: 'fastlane-init', title: 'Fastlane Initialization' },
    { name: 'ios-lane-setup', title: 'iOS Lane Configuration' },
    { name: 'android-lane-setup', title: 'Android Lane Configuration' },
    { name: 'code-signing', title: 'Code Signing Setup (Match/Keystore)' },
    { name: 'build-lanes', title: 'Build Lanes Configuration' },
    { name: 'test-lanes', title: 'Test Lanes Configuration' },
    { name: 'screenshot-automation', title: 'Screenshot Automation' },
    { name: 'beta-deployment', title: 'Beta Deployment Lanes' },
    { name: 'production-deployment', title: 'Production Deployment Lanes' },
    { name: 'ci-integration', title: 'CI Provider Integration' },
    { name: 'secrets-management', title: 'Secrets and Credentials Management' },
    { name: 'notification-setup', title: 'Build Notification Setup' },
    { name: 'versioning-automation', title: 'Version Automation' },
    { name: 'pipeline-documentation', title: 'Pipeline Documentation' }
  ];

  for (const phase of phases) {
    ctx.log('info', `Processing: ${phase.title}`);
    const result = await ctx.task(createCICDTask(phase.name, phase.title), {
      appName, platforms, ciProvider, deployTargets, outputDir
    });
    artifacts.push(...result.artifacts);
  }

  await ctx.breakpoint({
    question: `CI/CD pipeline ready for ${appName}. Ready to test the pipeline?`,
    title: 'CI/CD Review',
    context: { runId: ctx.runId, appName, ciProvider, deployTargets }
  });

  const endTime = ctx.now();
  return {
    success: true,
    appName,
    platforms,
    ciProvider,
    deployTargets,
    pipelineConfig: { status: 'configured', phases: phases.length },
    lanes: ['build', 'test', 'beta', 'release', 'screenshots'],
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/mobile-development/mobile-cicd-fastlane', timestamp: startTime }
  };
}

function createCICDTask(name, title) {
  return (args, taskCtx) => ({
    kind: 'agent',
    title: `${title} - ${args.appName}`,
    skill: { name: 'fastlane-cicd' },
    agent: {
      name: 'mobile-devops',
      prompt: {
        role: 'Mobile DevOps Engineer',
        task: `Configure ${title.toLowerCase()} for Fastlane CI/CD`,
        context: args,
        instructions: [
          `1. Set up ${title.toLowerCase()} with Fastlane`,
          `2. Configure for ${args.platforms.join(' and ')}`,
          `3. Integrate with ${args.ciProvider}`,
          `4. Test lane execution`,
          `5. Document configuration`
        ],
        outputFormat: 'JSON with CI/CD details'
      },
      outputSchema: {
        type: 'object',
        required: ['laneConfig', 'artifacts'],
        properties: { laneConfig: { type: 'object' }, lanes: { type: 'array' }, artifacts: { type: 'array' } }
      }
    },
    io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
    labels: ['mobile', 'cicd', 'fastlane', name]
  });
}

export const fastlaneInitTask = createCICDTask('fastlane-init', 'Fastlane Initialization');
export const iosLaneTask = createCICDTask('ios-lane-setup', 'iOS Lane Configuration');
export const androidLaneTask = createCICDTask('android-lane-setup', 'Android Lane Configuration');
export const codeSigningTask = createCICDTask('code-signing', 'Code Signing Setup (Match/Keystore)');
export const buildLanesTask = createCICDTask('build-lanes', 'Build Lanes Configuration');
export const testLanesTask = createCICDTask('test-lanes', 'Test Lanes Configuration');
export const screenshotAutomationTask = createCICDTask('screenshot-automation', 'Screenshot Automation');
export const betaDeploymentTask = createCICDTask('beta-deployment', 'Beta Deployment Lanes');
export const productionDeploymentTask = createCICDTask('production-deployment', 'Production Deployment Lanes');
export const ciIntegrationTask = createCICDTask('ci-integration', 'CI Provider Integration');
export const secretsManagementTask = createCICDTask('secrets-management', 'Secrets and Credentials Management');
export const notificationSetupTask = createCICDTask('notification-setup', 'Build Notification Setup');
export const versioningAutomationTask = createCICDTask('versioning-automation', 'Version Automation');
export const pipelineDocumentationTask = createCICDTask('pipeline-documentation', 'Pipeline Documentation');
