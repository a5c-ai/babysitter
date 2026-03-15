/**
 * @process specializations/performance-optimization/apm-instrumentation
 * @description APM Instrumentation Setup - Implement Application Performance Monitoring instrumentation including
 * agent deployment, custom metrics, distributed tracing, and dashboard configuration.
 * @inputs { projectName: string, apmTool: string, targetServices: array }
 * @outputs { success: boolean, instrumentation: object, dashboards: array, alerts: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/performance-optimization/apm-instrumentation', {
 *   projectName: 'Microservices Platform',
 *   apmTool: 'datadog',
 *   targetServices: ['api-gateway', 'user-service', 'order-service']
 * });
 *
 * @references
 * - Datadog APM: https://docs.datadoghq.com/tracing/
 * - New Relic APM: https://docs.newrelic.com/docs/apm/
 * - Dynatrace: https://www.dynatrace.com/support/help/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    apmTool = 'generic',
    targetServices = [],
    outputDir = 'apm-instrumentation-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting APM Instrumentation Setup for ${projectName}`);

  // Phase 1: Select APM Solution
  const apmSelection = await ctx.task(selectAPMSolutionTask, { projectName, apmTool, outputDir });
  artifacts.push(...apmSelection.artifacts);

  // Phase 2: Deploy APM Agents
  const agentDeployment = await ctx.task(deployAPMAgentsTask, { projectName, apmTool, targetServices, outputDir });
  artifacts.push(...agentDeployment.artifacts);

  // Phase 3: Configure Auto-Instrumentation
  const autoInstrumentation = await ctx.task(configureAutoInstrumentationTask, { projectName, apmTool, targetServices, outputDir });
  artifacts.push(...autoInstrumentation.artifacts);

  await ctx.breakpoint({
    question: `APM agents deployed to ${agentDeployment.deployedServices.length} services. Configure custom instrumentation?`,
    title: 'APM Agent Deployment',
    context: { runId: ctx.runId, agentDeployment }
  });

  // Phase 4: Add Custom Instrumentation
  const customInstrumentation = await ctx.task(addCustomInstrumentationTask, { projectName, targetServices, outputDir });
  artifacts.push(...customInstrumentation.artifacts);

  // Phase 5: Configure Distributed Tracing
  const distributedTracing = await ctx.task(configureDistributedTracingTask, { projectName, apmTool, targetServices, outputDir });
  artifacts.push(...distributedTracing.artifacts);

  // Phase 6: Set Up Performance Dashboards
  const dashboards = await ctx.task(setupAPMDashboardsTask, { projectName, apmTool, targetServices, outputDir });
  artifacts.push(...dashboards.artifacts);

  // Phase 7: Configure Performance Alerts
  const alerts = await ctx.task(configureAPMAlertsTask, { projectName, apmTool, outputDir });
  artifacts.push(...alerts.artifacts);

  // Phase 8: Validate Instrumentation
  const validation = await ctx.task(validateAPMInstrumentationTask, { projectName, targetServices, outputDir });
  artifacts.push(...validation.artifacts);

  // Phase 9: Document Setup
  const documentation = await ctx.task(documentAPMSetupTask, { projectName, apmTool, agentDeployment, dashboards, alerts, outputDir });
  artifacts.push(...documentation.artifacts);

  await ctx.breakpoint({
    question: `APM setup complete. ${dashboards.dashboards.length} dashboards, ${alerts.alerts.length} alerts configured. Accept?`,
    title: 'APM Instrumentation Review',
    context: { runId: ctx.runId, dashboards, alerts }
  });

  return {
    success: true,
    projectName,
    instrumentation: { apmTool, servicesInstrumented: agentDeployment.deployedServices.length, customMetrics: customInstrumentation.metrics.length },
    dashboards: dashboards.dashboards,
    alerts: alerts.alerts,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/performance-optimization/apm-instrumentation', timestamp: startTime, outputDir }
  };
}

export const selectAPMSolutionTask = defineTask('select-apm-solution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Select APM Solution - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Select APM solution', context: args,
      instructions: ['1. Evaluate APM tools', '2. Consider features', '3. Evaluate cost', '4. Select solution', '5. Document selection'],
      outputFormat: 'JSON with APM selection' },
    outputSchema: { type: 'object', required: ['selectedTool', 'artifacts'], properties: { selectedTool: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'apm', 'selection']
}));

export const deployAPMAgentsTask = defineTask('deploy-apm-agents', (args, taskCtx) => ({
  kind: 'agent',
  title: `Deploy APM Agents - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Deploy APM agents', context: args,
      instructions: ['1. Install agents', '2. Configure connections', '3. Set environment variables', '4. Verify deployment', '5. Document deployment'],
      outputFormat: 'JSON with agent deployment' },
    outputSchema: { type: 'object', required: ['deployedServices', 'artifacts'], properties: { deployedServices: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'apm', 'deployment']
}));

export const configureAutoInstrumentationTask = defineTask('configure-auto-instrumentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure Auto-Instrumentation - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Configure auto-instrumentation', context: args,
      instructions: ['1. Enable auto-instrumentation', '2. Configure libraries', '3. Set sampling rates', '4. Configure exclusions', '5. Document configuration'],
      outputFormat: 'JSON with auto-instrumentation config' },
    outputSchema: { type: 'object', required: ['configuration', 'artifacts'], properties: { configuration: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'apm', 'auto-instrumentation']
}));

export const addCustomInstrumentationTask = defineTask('add-custom-instrumentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Add Custom Instrumentation - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Add custom instrumentation', context: args,
      instructions: ['1. Identify custom spans', '2. Add custom metrics', '3. Add business metrics', '4. Configure tags', '5. Document instrumentation'],
      outputFormat: 'JSON with custom instrumentation' },
    outputSchema: { type: 'object', required: ['metrics', 'artifacts'], properties: { metrics: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'apm', 'custom']
}));

export const configureDistributedTracingTask = defineTask('configure-distributed-tracing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure Distributed Tracing - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Configure distributed tracing', context: args,
      instructions: ['1. Configure trace propagation', '2. Set up context propagation', '3. Configure trace sampling', '4. Verify trace correlation', '5. Document tracing'],
      outputFormat: 'JSON with tracing configuration' },
    outputSchema: { type: 'object', required: ['configuration', 'artifacts'], properties: { configuration: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'apm', 'tracing']
}));

export const setupAPMDashboardsTask = defineTask('setup-apm-dashboards', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup APM Dashboards - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Setup APM dashboards', context: args,
      instructions: ['1. Create service overview', '2. Add latency panels', '3. Add error panels', '4. Add throughput panels', '5. Document dashboards'],
      outputFormat: 'JSON with dashboard configuration' },
    outputSchema: { type: 'object', required: ['dashboards', 'artifacts'], properties: { dashboards: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'apm', 'dashboards']
}));

export const configureAPMAlertsTask = defineTask('configure-apm-alerts', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure APM Alerts - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Configure APM alerts', context: args,
      instructions: ['1. Set latency alerts', '2. Set error rate alerts', '3. Set anomaly alerts', '4. Configure notifications', '5. Document alerts'],
      outputFormat: 'JSON with alert configuration' },
    outputSchema: { type: 'object', required: ['alerts', 'artifacts'], properties: { alerts: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'apm', 'alerts']
}));

export const validateAPMInstrumentationTask = defineTask('validate-apm-instrumentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validate APM Instrumentation - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Validate APM instrumentation', context: args,
      instructions: ['1. Verify data collection', '2. Check trace completeness', '3. Validate metrics', '4. Check dashboards', '5. Document validation'],
      outputFormat: 'JSON with validation results' },
    outputSchema: { type: 'object', required: ['validated', 'artifacts'], properties: { validated: { type: 'boolean' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'apm', 'validation']
}));

export const documentAPMSetupTask = defineTask('document-apm-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Document APM Setup - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Document APM setup', context: args,
      instructions: ['1. Document architecture', '2. Document configuration', '3. Add troubleshooting guide', '4. Include dashboard usage', '5. Generate report'],
      outputFormat: 'JSON with documentation' },
    outputSchema: { type: 'object', required: ['documentation', 'artifacts'], properties: { documentation: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'apm', 'documentation']
}));
