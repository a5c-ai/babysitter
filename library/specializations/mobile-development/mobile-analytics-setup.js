/**
 * @process specializations/mobile-development/mobile-analytics-setup
 * @description Mobile Analytics and Crash Reporting Setup - Implement comprehensive analytics,
 * user behavior tracking, crash reporting, and performance monitoring with privacy compliance.
 * @inputs { appName: string, platforms: array, analyticsProviders?: array, privacyCompliance?: array }
 * @outputs { success: boolean, analyticsConfig: object, events: array, dashboards: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/mobile-development/mobile-analytics-setup', {
 *   appName: 'MyApp',
 *   platforms: ['ios', 'android'],
 *   analyticsProviders: ['firebase', 'amplitude'],
 *   privacyCompliance: ['GDPR', 'CCPA', 'ATT']
 * });
 *
 * @references
 * - Firebase Analytics: https://firebase.google.com/docs/analytics
 * - Amplitude: https://www.docs.developers.amplitude.com/
 * - Crashlytics: https://firebase.google.com/docs/crashlytics
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    appName,
    platforms = ['ios', 'android'],
    analyticsProviders = ['firebase'],
    privacyCompliance = ['GDPR'],
    outputDir = 'analytics-setup'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Analytics Setup: ${appName}`);
  ctx.log('info', `Providers: ${analyticsProviders.join(', ')}, Compliance: ${privacyCompliance.join(', ')}`);

  const phases = [
    { name: 'analytics-strategy', title: 'Analytics Strategy Planning' },
    { name: 'sdk-integration', title: 'Analytics SDK Integration' },
    { name: 'event-taxonomy', title: 'Event Taxonomy Design' },
    { name: 'user-properties', title: 'User Properties Setup' },
    { name: 'funnel-tracking', title: 'Funnel and Conversion Tracking' },
    { name: 'crash-reporting', title: 'Crash Reporting Setup' },
    { name: 'performance-monitoring', title: 'Performance Monitoring' },
    { name: 'custom-dashboards', title: 'Custom Dashboard Creation' },
    { name: 'alert-configuration', title: 'Alert Configuration' },
    { name: 'privacy-consent', title: 'Privacy Consent Implementation' },
    { name: 'data-retention', title: 'Data Retention Policies' },
    { name: 'ab-testing-integration', title: 'A/B Testing Integration' },
    { name: 'attribution-tracking', title: 'Attribution Tracking' },
    { name: 'documentation', title: 'Analytics Documentation' }
  ];

  for (const phase of phases) {
    ctx.log('info', `Processing: ${phase.title}`);
    const result = await ctx.task(createAnalyticsTask(phase.name, phase.title), {
      appName, platforms, analyticsProviders, privacyCompliance, outputDir
    });
    artifacts.push(...result.artifacts);
  }

  await ctx.breakpoint({
    question: `Analytics setup complete for ${appName}. Ready to verify event tracking?`,
    title: 'Analytics Review',
    context: { runId: ctx.runId, appName, analyticsProviders, privacyCompliance }
  });

  const endTime = ctx.now();
  return {
    success: true,
    appName,
    platforms,
    analyticsProviders,
    privacyCompliance,
    analyticsConfig: { status: 'configured', phases: phases.length },
    events: [],
    dashboards: [],
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/mobile-development/mobile-analytics-setup', timestamp: startTime }
  };
}

function createAnalyticsTask(name, title) {
  return (args, taskCtx) => ({
    kind: 'agent',
    title: `${title} - ${args.appName}`,
    skill: { name: 'firebase-integration' },
    agent: {
      name: 'cross-platform-architect',
      prompt: {
        role: 'Mobile Analytics Engineer',
        task: `Implement ${title.toLowerCase()} for mobile analytics`,
        context: args,
        instructions: [
          `1. Set up ${title.toLowerCase()} infrastructure`,
          `2. Configure for ${args.platforms.join(' and ')}`,
          `3. Integrate with ${args.analyticsProviders.join(', ')}`,
          `4. Ensure ${args.privacyCompliance.join(', ')} compliance`,
          `5. Document implementation`
        ],
        outputFormat: 'JSON with analytics details'
      },
      outputSchema: {
        type: 'object',
        required: ['config', 'artifacts'],
        properties: { config: { type: 'object' }, events: { type: 'array' }, artifacts: { type: 'array' } }
      }
    },
    io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
    labels: ['mobile', 'analytics', name]
  });
}

export const analyticsStrategyTask = createAnalyticsTask('analytics-strategy', 'Analytics Strategy Planning');
export const sdkIntegrationTask = createAnalyticsTask('sdk-integration', 'Analytics SDK Integration');
export const eventTaxonomyTask = createAnalyticsTask('event-taxonomy', 'Event Taxonomy Design');
export const userPropertiesTask = createAnalyticsTask('user-properties', 'User Properties Setup');
export const funnelTrackingTask = createAnalyticsTask('funnel-tracking', 'Funnel and Conversion Tracking');
export const crashReportingTask = createAnalyticsTask('crash-reporting', 'Crash Reporting Setup');
export const performanceMonitoringTask = createAnalyticsTask('performance-monitoring', 'Performance Monitoring');
export const customDashboardsTask = createAnalyticsTask('custom-dashboards', 'Custom Dashboard Creation');
export const alertConfigurationTask = createAnalyticsTask('alert-configuration', 'Alert Configuration');
export const privacyConsentTask = createAnalyticsTask('privacy-consent', 'Privacy Consent Implementation');
export const dataRetentionTask = createAnalyticsTask('data-retention', 'Data Retention Policies');
export const abTestingIntegrationTask = createAnalyticsTask('ab-testing-integration', 'A/B Testing Integration');
export const attributionTrackingTask = createAnalyticsTask('attribution-tracking', 'Attribution Tracking');
export const documentationTask = createAnalyticsTask('documentation', 'Analytics Documentation');
