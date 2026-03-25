/**
 * @process specializations/desktop-development/desktop-analytics
 * @description Desktop Analytics and Telemetry Integration - Implement privacy-respecting analytics and crash
 * reporting; integrate with services like Sentry, Amplitude, or custom telemetry solutions.
 * @inputs { projectName: string, framework: string, analyticsProviders: array, privacyMode: string, outputDir?: string }
 * @outputs { success: boolean, analyticsConfig: object, crashReporting: object, privacyConfig: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/desktop-development/desktop-analytics', {
 *   projectName: 'MyDesktopApp',
 *   framework: 'Electron',
 *   analyticsProviders: ['sentry', 'amplitude'],
 *   privacyMode: 'opt-in'
 * });
 *
 * @references
 * - Sentry Electron: https://docs.sentry.io/platforms/javascript/guides/electron/
 * - Amplitude: https://www.amplitude.com/docs
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    framework = 'Electron',
    analyticsProviders = ['sentry'],
    privacyMode = 'opt-in',
    outputDir = 'desktop-analytics'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Desktop Analytics Integration: ${projectName}`);

  const requirements = await ctx.task(analyticsRequirementsTask, { projectName, framework, analyticsProviders, privacyMode, outputDir });
  artifacts.push(...requirements.artifacts);

  const privacyConfig = await ctx.task(configurePrivacyTask, { projectName, framework, privacyMode, outputDir });
  artifacts.push(...privacyConfig.artifacts);

  const crashReporting = await ctx.task(setupCrashReportingTask, { projectName, framework, analyticsProviders, outputDir });
  artifacts.push(...crashReporting.artifacts);

  const usageAnalytics = await ctx.task(setupUsageAnalyticsTask, { projectName, framework, analyticsProviders, privacyConfig, outputDir });
  artifacts.push(...usageAnalytics.artifacts);

  await ctx.breakpoint({
    question: `Analytics configured. Providers: ${analyticsProviders.join(', ')}. Privacy mode: ${privacyMode}. Review?`,
    title: 'Analytics Setup Review',
    context: { runId: ctx.runId, analyticsProviders, privacyMode }
  });

  const eventTracking = await ctx.task(implementEventTrackingTask, { projectName, framework, outputDir });
  artifacts.push(...eventTracking.artifacts);

  const userConsent = await ctx.task(implementConsentManagementTask, { projectName, framework, privacyMode, outputDir });
  artifacts.push(...userConsent.artifacts);

  const dataExport = await ctx.task(implementDataExportTask, { projectName, framework, outputDir });
  artifacts.push(...dataExport.artifacts);

  const validation = await ctx.task(validateAnalyticsTask, { projectName, framework, analyticsProviders, privacyConfig, crashReporting, usageAnalytics, outputDir });
  artifacts.push(...validation.artifacts);

  const validationPassed = validation.validationScore >= 80;

  return {
    success: validationPassed,
    projectName,
    analyticsConfig: { providers: analyticsProviders, configPath: usageAnalytics.configPath },
    crashReporting: { enabled: crashReporting.enabled, provider: crashReporting.provider },
    privacyConfig: { mode: privacyMode, consentRequired: privacyConfig.consentRequired },
    eventTracking: eventTracking.events,
    validation: { score: validation.validationScore, passed: validationPassed },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/desktop-development/desktop-analytics', timestamp: startTime }
  };
}

export const analyticsRequirementsTask = defineTask('analytics-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analytics Requirements - ${args.projectName}`,
  agent: {
    name: 'analytics-analyst',
    prompt: { role: 'Analytics Requirements Analyst', task: 'Analyze analytics requirements', context: args, instructions: ['1. Analyze tracking needs', '2. Define key metrics', '3. Plan event schema', '4. Assess privacy requirements', '5. Plan crash reporting', '6. Define retention policy', '7. Plan data export', '8. Generate requirements document'] },
    outputSchema: { type: 'object', required: ['requirements', 'artifacts'], properties: { requirements: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'analytics', 'requirements']
}));

export const configurePrivacyTask = defineTask('configure-privacy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Privacy Configuration - ${args.projectName}`,
  agent: {
    name: 'privacy-developer',
    prompt: { role: 'Privacy Developer', task: 'Configure privacy settings', context: args, instructions: ['1. Define data collection policy', '2. Configure anonymization', '3. Set up IP masking', '4. Define retention periods', '5. Configure data minimization', '6. Set up GDPR compliance', '7. Configure CCPA compliance', '8. Generate privacy configuration'] },
    outputSchema: { type: 'object', required: ['consentRequired', 'artifacts'], properties: { consentRequired: { type: 'boolean' }, anonymization: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'analytics', 'privacy']
}));

export const setupCrashReportingTask = defineTask('setup-crash-reporting', (args, taskCtx) => ({
  kind: 'agent',
  title: `Crash Reporting - ${args.projectName}`,
  skill: {
    name: 'sentry-electron-setup',
  },
  agent: {
    name: 'desktop-telemetry-engineer',
    prompt: { role: 'Crash Reporting Developer', task: 'Set up crash reporting', context: args, instructions: ['1. Install Sentry/crash reporter', '2. Configure DSN/keys', '3. Set up breadcrumbs', '4. Configure error boundaries', '5. Add context data', '6. Configure source maps', '7. Set up alerts', '8. Generate crash reporting configuration'] },
    outputSchema: { type: 'object', required: ['enabled', 'provider', 'artifacts'], properties: { enabled: { type: 'boolean' }, provider: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'analytics', 'crash-reporting']
}));

export const setupUsageAnalyticsTask = defineTask('setup-usage-analytics', (args, taskCtx) => ({
  kind: 'agent',
  title: `Usage Analytics - ${args.projectName}`,
  skill: {
    name: 'amplitude-electron-integration',
  },
  agent: {
    name: 'desktop-telemetry-engineer',
    prompt: { role: 'Usage Analytics Developer', task: 'Set up usage analytics', context: args, instructions: ['1. Install analytics SDK', '2. Configure initialization', '3. Set up user identification', '4. Configure session tracking', '5. Define custom properties', '6. Set up funnel tracking', '7. Configure retention tracking', '8. Generate analytics configuration'] },
    outputSchema: { type: 'object', required: ['configPath', 'artifacts'], properties: { configPath: { type: 'string' }, trackingEvents: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'analytics', 'usage']
}));

export const implementEventTrackingTask = defineTask('implement-event-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: `Event Tracking - ${args.projectName}`,
  agent: {
    name: 'event-tracking-developer',
    prompt: { role: 'Event Tracking Developer', task: 'Implement event tracking', context: args, instructions: ['1. Define event schema', '2. Create tracking service', '3. Implement page views', '4. Track user actions', '5. Track feature usage', '6. Implement timing events', '7. Add event validation', '8. Generate event tracking module'] },
    outputSchema: { type: 'object', required: ['events', 'artifacts'], properties: { events: { type: 'array' }, servicePath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'analytics', 'events']
}));

export const implementConsentManagementTask = defineTask('implement-consent-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Consent Management - ${args.projectName}`,
  skill: {
    name: 'gdpr-consent-dialog',
  },
  agent: {
    name: 'privacy-compliance-specialist',
    prompt: { role: 'Consent Management Developer', task: 'Implement consent management', context: args, instructions: ['1. Create consent UI', '2. Implement opt-in flow', '3. Implement opt-out flow', '4. Store consent preferences', '5. Respect system DNT', '6. Handle consent changes', '7. Add consent API', '8. Generate consent management module'] },
    outputSchema: { type: 'object', required: ['consentUI', 'artifacts'], properties: { consentUI: { type: 'string' }, storageMethod: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'analytics', 'consent']
}));

export const implementDataExportTask = defineTask('implement-data-export', (args, taskCtx) => ({
  kind: 'agent',
  title: `Data Export - ${args.projectName}`,
  agent: {
    name: 'data-export-developer',
    prompt: { role: 'Data Export Developer', task: 'Implement user data export', context: args, instructions: ['1. Implement data collection', '2. Create export format', '3. Add export UI', '4. Implement data deletion', '5. Handle right to erasure', '6. Create audit log', '7. Add data access API', '8. Generate data export module'] },
    outputSchema: { type: 'object', required: ['exportFormat', 'artifacts'], properties: { exportFormat: { type: 'string' }, deletionSupport: { type: 'boolean' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'analytics', 'data-export']
}));

export const validateAnalyticsTask = defineTask('validate-analytics', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validate Analytics - ${args.projectName}`,
  agent: {
    name: 'analytics-validator',
    prompt: { role: 'Analytics Validator', task: 'Validate analytics implementation', context: args, instructions: ['1. Test crash reporting', '2. Test event tracking', '3. Verify privacy compliance', '4. Test consent flow', '5. Verify data export', '6. Calculate validation score', '7. Identify issues', '8. Generate recommendations'] },
    outputSchema: { type: 'object', required: ['validationScore', 'artifacts'], properties: { validationScore: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'analytics', 'validation']
}));
