/**
 * @process specializations/performance-optimization/real-user-monitoring-setup
 * @description Real User Monitoring (RUM) Setup - Implement RUM for frontend applications including script
 * injection, metric collection, user journey tracking, and performance correlation with backend.
 * @inputs { projectName: string, rumProvider: string, applicationUrls: array }
 * @outputs { success: boolean, rumConfig: object, metrics: array, dashboards: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/performance-optimization/real-user-monitoring-setup', {
 *   projectName: 'E-commerce Website',
 *   rumProvider: 'datadog',
 *   applicationUrls: ['https://shop.example.com', 'https://checkout.example.com']
 * });
 *
 * @references
 * - Web Vitals: https://web.dev/vitals/
 * - Performance Observer API: https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    rumProvider = 'generic',
    applicationUrls = [],
    outputDir = 'rum-setup-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Real User Monitoring Setup for ${projectName}`);

  // Phase 1: Select RUM Provider
  const providerSelection = await ctx.task(selectRUMProviderTask, { projectName, rumProvider, outputDir });
  artifacts.push(...providerSelection.artifacts);

  // Phase 2: Inject RUM Script
  const scriptInjection = await ctx.task(injectRUMScriptTask, { projectName, rumProvider, applicationUrls, outputDir });
  artifacts.push(...scriptInjection.artifacts);

  // Phase 3: Configure Core Web Vitals Collection
  const webVitals = await ctx.task(configureCoreWebVitalsTask, { projectName, outputDir });
  artifacts.push(...webVitals.artifacts);

  await ctx.breakpoint({
    question: `RUM script injected in ${scriptInjection.injectedCount} pages. Configure user journey tracking?`,
    title: 'RUM Script Injection',
    context: { runId: ctx.runId, scriptInjection }
  });

  // Phase 4: Set Up User Journey Tracking
  const journeyTracking = await ctx.task(setupUserJourneyTrackingTask, { projectName, outputDir });
  artifacts.push(...journeyTracking.artifacts);

  // Phase 5: Configure Error Tracking
  const errorTracking = await ctx.task(configureRUMErrorTrackingTask, { projectName, outputDir });
  artifacts.push(...errorTracking.artifacts);

  // Phase 6: Correlate with Backend Traces
  const backendCorrelation = await ctx.task(correlateWithBackendTracesTask, { projectName, outputDir });
  artifacts.push(...backendCorrelation.artifacts);

  // Phase 7: Create Performance Dashboards
  const dashboards = await ctx.task(createRUMDashboardsTask, { projectName, rumProvider, outputDir });
  artifacts.push(...dashboards.artifacts);

  // Phase 8: Configure Alerts
  const alerts = await ctx.task(configureRUMAlertsTask, { projectName, outputDir });
  artifacts.push(...alerts.artifacts);

  // Phase 9: Document RUM Setup
  const documentation = await ctx.task(documentRUMSetupTask, { projectName, scriptInjection, dashboards, alerts, outputDir });
  artifacts.push(...documentation.artifacts);

  await ctx.breakpoint({
    question: `RUM setup complete. ${dashboards.dashboards.length} dashboards, ${alerts.alerts.length} alerts. Accept?`,
    title: 'RUM Setup Review',
    context: { runId: ctx.runId, dashboards, alerts }
  });

  return {
    success: true,
    projectName,
    rumConfig: { provider: rumProvider, injectedPages: scriptInjection.injectedCount },
    metrics: webVitals.metrics,
    dashboards: dashboards.dashboards,
    alerts: alerts.alerts,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/performance-optimization/real-user-monitoring-setup', timestamp: startTime, outputDir }
  };
}

export const selectRUMProviderTask = defineTask('select-rum-provider', (args, taskCtx) => ({
  kind: 'agent',
  title: `Select RUM Provider - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Select RUM provider', context: args,
      instructions: ['1. Evaluate RUM providers', '2. Consider features', '3. Evaluate pricing', '4. Select provider', '5. Document selection'],
      outputFormat: 'JSON with RUM provider selection' },
    outputSchema: { type: 'object', required: ['provider', 'artifacts'], properties: { provider: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'rum', 'provider']
}));

export const injectRUMScriptTask = defineTask('inject-rum-script', (args, taskCtx) => ({
  kind: 'agent',
  title: `Inject RUM Script - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Inject RUM script', context: args,
      instructions: ['1. Add RUM script to pages', '2. Configure async loading', '3. Set site identifier', '4. Verify injection', '5. Document setup'],
      outputFormat: 'JSON with script injection results' },
    outputSchema: { type: 'object', required: ['injectedCount', 'artifacts'], properties: { injectedCount: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'rum', 'injection']
}));

export const configureCoreWebVitalsTask = defineTask('configure-core-web-vitals', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure Core Web Vitals - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Configure Core Web Vitals collection', context: args,
      instructions: ['1. Configure LCP collection', '2. Configure FID/INP collection', '3. Configure CLS collection', '4. Add custom metrics', '5. Document configuration'],
      outputFormat: 'JSON with Web Vitals configuration' },
    outputSchema: { type: 'object', required: ['metrics', 'artifacts'], properties: { metrics: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'rum', 'web-vitals']
}));

export const setupUserJourneyTrackingTask = defineTask('setup-user-journey-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup User Journey Tracking - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Setup user journey tracking', context: args,
      instructions: ['1. Define user journeys', '2. Add journey markers', '3. Track conversions', '4. Configure session tracking', '5. Document journeys'],
      outputFormat: 'JSON with journey tracking setup' },
    outputSchema: { type: 'object', required: ['journeys', 'artifacts'], properties: { journeys: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'rum', 'journeys']
}));

export const configureRUMErrorTrackingTask = defineTask('configure-rum-error-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure Error Tracking - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Configure RUM error tracking', context: args,
      instructions: ['1. Enable JS error tracking', '2. Configure source maps', '3. Track network errors', '4. Set up error grouping', '5. Document configuration'],
      outputFormat: 'JSON with error tracking configuration' },
    outputSchema: { type: 'object', required: ['configuration', 'artifacts'], properties: { configuration: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'rum', 'errors']
}));

export const correlateWithBackendTracesTask = defineTask('correlate-with-backend-traces', (args, taskCtx) => ({
  kind: 'agent',
  title: `Correlate with Backend - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Correlate RUM with backend traces', context: args,
      instructions: ['1. Enable trace propagation', '2. Link frontend to backend', '3. Configure trace correlation', '4. Verify end-to-end tracing', '5. Document correlation'],
      outputFormat: 'JSON with backend correlation' },
    outputSchema: { type: 'object', required: ['correlation', 'artifacts'], properties: { correlation: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'rum', 'correlation']
}));

export const createRUMDashboardsTask = defineTask('create-rum-dashboards', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create RUM Dashboards - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Create RUM dashboards', context: args,
      instructions: ['1. Create Web Vitals dashboard', '2. Add page performance', '3. Add user journey views', '4. Add error tracking', '5. Document dashboards'],
      outputFormat: 'JSON with dashboard configuration' },
    outputSchema: { type: 'object', required: ['dashboards', 'artifacts'], properties: { dashboards: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'rum', 'dashboards']
}));

export const configureRUMAlertsTask = defineTask('configure-rum-alerts', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure RUM Alerts - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Configure RUM alerts', context: args,
      instructions: ['1. Set Web Vitals alerts', '2. Set error rate alerts', '3. Configure page load alerts', '4. Set up notifications', '5. Document alerts'],
      outputFormat: 'JSON with alert configuration' },
    outputSchema: { type: 'object', required: ['alerts', 'artifacts'], properties: { alerts: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'rum', 'alerts']
}));

export const documentRUMSetupTask = defineTask('document-rum-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Document RUM Setup - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Document RUM setup', context: args,
      instructions: ['1. Document configuration', '2. Add usage guide', '3. Include troubleshooting', '4. Add best practices', '5. Generate report'],
      outputFormat: 'JSON with documentation' },
    outputSchema: { type: 'object', required: ['documentation', 'artifacts'], properties: { documentation: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'rum', 'documentation']
}));
