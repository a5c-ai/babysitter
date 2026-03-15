/**
 * @process specializations/performance-optimization/continuous-profiling-setup
 * @description Continuous Profiling Setup - Implement continuous profiling in production including low-overhead
 * profiler deployment, flame graph generation, historical comparison, and automated alerting.
 * @inputs { projectName: string, profilingTool: string, targetServices: array }
 * @outputs { success: boolean, profilingConfig: object, services: array, dashboards: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/performance-optimization/continuous-profiling-setup', {
 *   projectName: 'Trading Platform',
 *   profilingTool: 'pyroscope',
 *   targetServices: ['order-service', 'matching-engine', 'risk-service']
 * });
 *
 * @references
 * - Pyroscope: https://pyroscope.io/docs/
 * - Parca: https://www.parca.dev/docs/overview
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    profilingTool = 'pyroscope',
    targetServices = [],
    outputDir = 'continuous-profiling-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Continuous Profiling Setup for ${projectName}`);

  // Phase 1: Select Continuous Profiling Tool
  const toolSelection = await ctx.task(selectContinuousProfilingToolTask, { projectName, profilingTool, outputDir });
  artifacts.push(...toolSelection.artifacts);

  // Phase 2: Deploy Profiling Infrastructure
  const infrastructure = await ctx.task(deployProfilingInfrastructureTask, { projectName, profilingTool, outputDir });
  artifacts.push(...infrastructure.artifacts);

  // Phase 3: Instrument Services
  const instrumentation = await ctx.task(instrumentServicesForProfilingTask, { projectName, targetServices, profilingTool, outputDir });
  artifacts.push(...instrumentation.artifacts);

  await ctx.breakpoint({
    question: `Profiling agents deployed to ${instrumentation.services.length} services. Configure overhead limits?`,
    title: 'Profiling Deployment',
    context: { runId: ctx.runId, instrumentation }
  });

  // Phase 4: Configure Low-Overhead Settings
  const overheadConfig = await ctx.task(configureLowOverheadSettingsTask, { projectName, outputDir });
  artifacts.push(...overheadConfig.artifacts);

  // Phase 5: Set Up Flame Graph Generation
  const flameGraphs = await ctx.task(setupFlameGraphGenerationTask, { projectName, profilingTool, outputDir });
  artifacts.push(...flameGraphs.artifacts);

  // Phase 6: Configure Historical Comparison
  const historicalComparison = await ctx.task(configureHistoricalComparisonTask, { projectName, outputDir });
  artifacts.push(...historicalComparison.artifacts);

  // Phase 7: Create Profiling Dashboards
  const dashboards = await ctx.task(createProfilingDashboardsTask, { projectName, profilingTool, outputDir });
  artifacts.push(...dashboards.artifacts);

  // Phase 8: Set Up Automated Alerting
  const alerting = await ctx.task(setupProfilingAlertingTask, { projectName, outputDir });
  artifacts.push(...alerting.artifacts);

  // Phase 9: Document Setup
  const documentation = await ctx.task(documentContinuousProfilingTask, { projectName, instrumentation, dashboards, alerting, outputDir });
  artifacts.push(...documentation.artifacts);

  await ctx.breakpoint({
    question: `Continuous profiling setup complete. Overhead: ${overheadConfig.overhead}%. ${dashboards.dashboards.length} dashboards created. Accept?`,
    title: 'Continuous Profiling Review',
    context: { runId: ctx.runId, overheadConfig, dashboards }
  });

  return {
    success: true,
    projectName,
    profilingConfig: { tool: profilingTool, overhead: overheadConfig.overhead },
    services: instrumentation.services,
    dashboards: dashboards.dashboards,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/performance-optimization/continuous-profiling-setup', timestamp: startTime, outputDir }
  };
}

export const selectContinuousProfilingToolTask = defineTask('select-continuous-profiling-tool', (args, taskCtx) => ({
  kind: 'agent',
  title: `Select Continuous Profiling Tool - ${args.projectName}`,
  agent: {
    name: 'nodejs-profiling',
    prompt: { role: 'Performance Engineer', task: 'Select continuous profiling tool', context: args,
      instructions: ['1. Evaluate Pyroscope, Parca', '2. Consider overhead', '3. Evaluate features', '4. Select tool', '5. Document selection'],
      outputFormat: 'JSON with tool selection' },
    outputSchema: { type: 'object', required: ['tool', 'artifacts'], properties: { tool: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'continuous-profiling', 'tools']
}));

export const deployProfilingInfrastructureTask = defineTask('deploy-profiling-infrastructure', (args, taskCtx) => ({
  kind: 'agent',
  title: `Deploy Profiling Infrastructure - ${args.projectName}`,
  agent: {
    name: 'nodejs-profiling',
    prompt: { role: 'Performance Engineer', task: 'Deploy profiling infrastructure', context: args,
      instructions: ['1. Deploy profiling server', '2. Configure storage', '3. Set up networking', '4. Configure retention', '5. Document deployment'],
      outputFormat: 'JSON with infrastructure deployment' },
    outputSchema: { type: 'object', required: ['deployed', 'artifacts'], properties: { deployed: { type: 'boolean' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'continuous-profiling', 'infrastructure']
}));

export const instrumentServicesForProfilingTask = defineTask('instrument-services-for-profiling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Instrument Services - ${args.projectName}`,
  agent: {
    name: 'nodejs-profiling',
    prompt: { role: 'Performance Engineer', task: 'Instrument services for profiling', context: args,
      instructions: ['1. Deploy profiling agents', '2. Configure connections', '3. Set sampling rates', '4. Verify profiling', '5. Document instrumentation'],
      outputFormat: 'JSON with instrumentation results' },
    outputSchema: { type: 'object', required: ['services', 'artifacts'], properties: { services: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'continuous-profiling', 'instrumentation']
}));

export const configureLowOverheadSettingsTask = defineTask('configure-low-overhead-settings', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure Low Overhead - ${args.projectName}`,
  agent: {
    name: 'nodejs-profiling',
    prompt: { role: 'Performance Engineer', task: 'Configure low-overhead profiling settings', context: args,
      instructions: ['1. Set sampling frequency', '2. Configure CPU limits', '3. Set memory limits', '4. Measure overhead', '5. Document settings'],
      outputFormat: 'JSON with overhead configuration' },
    outputSchema: { type: 'object', required: ['overhead', 'artifacts'], properties: { overhead: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'continuous-profiling', 'overhead']
}));

export const setupFlameGraphGenerationTask = defineTask('setup-flame-graph-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Flame Graph Generation - ${args.projectName}`,
  agent: {
    name: 'nodejs-profiling',
    prompt: { role: 'Performance Engineer', task: 'Setup flame graph generation', context: args,
      instructions: ['1. Configure flame graph rendering', '2. Set time ranges', '3. Configure filters', '4. Add comparison mode', '5. Document setup'],
      outputFormat: 'JSON with flame graph setup' },
    outputSchema: { type: 'object', required: ['configuration', 'artifacts'], properties: { configuration: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'continuous-profiling', 'flame-graphs']
}));

export const configureHistoricalComparisonTask = defineTask('configure-historical-comparison', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure Historical Comparison - ${args.projectName}`,
  agent: {
    name: 'nodejs-profiling',
    prompt: { role: 'Performance Engineer', task: 'Configure historical comparison', context: args,
      instructions: ['1. Set baseline periods', '2. Configure diff views', '3. Enable regression detection', '4. Set comparison windows', '5. Document configuration'],
      outputFormat: 'JSON with historical comparison config' },
    outputSchema: { type: 'object', required: ['configuration', 'artifacts'], properties: { configuration: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'continuous-profiling', 'historical']
}));

export const createProfilingDashboardsTask = defineTask('create-profiling-dashboards', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create Profiling Dashboards - ${args.projectName}`,
  agent: {
    name: 'nodejs-profiling',
    prompt: { role: 'Performance Engineer', task: 'Create profiling dashboards', context: args,
      instructions: ['1. Create service overview', '2. Add flame graph panels', '3. Add CPU/memory panels', '4. Add comparison views', '5. Document dashboards'],
      outputFormat: 'JSON with dashboard configuration' },
    outputSchema: { type: 'object', required: ['dashboards', 'artifacts'], properties: { dashboards: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'continuous-profiling', 'dashboards']
}));

export const setupProfilingAlertingTask = defineTask('setup-profiling-alerting', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Profiling Alerting - ${args.projectName}`,
  agent: {
    name: 'nodejs-profiling',
    prompt: { role: 'Performance Engineer', task: 'Setup profiling alerting', context: args,
      instructions: ['1. Set CPU usage alerts', '2. Set memory alerts', '3. Configure regression alerts', '4. Set up notifications', '5. Document alerting'],
      outputFormat: 'JSON with alerting configuration' },
    outputSchema: { type: 'object', required: ['alerts', 'artifacts'], properties: { alerts: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'continuous-profiling', 'alerting']
}));

export const documentContinuousProfilingTask = defineTask('document-continuous-profiling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Document Continuous Profiling - ${args.projectName}`,
  agent: {
    name: 'nodejs-profiling',
    prompt: { role: 'Performance Engineer', task: 'Document continuous profiling setup', context: args,
      instructions: ['1. Document architecture', '2. Add usage guide', '3. Include interpretation guide', '4. Add troubleshooting', '5. Generate report'],
      outputFormat: 'JSON with documentation' },
    outputSchema: { type: 'object', required: ['documentation', 'artifacts'], properties: { documentation: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'continuous-profiling', 'documentation']
}));
