/**
 * @process specializations/performance-optimization/capacity-planning-analysis
 * @description Capacity Planning Analysis - Analyze capacity requirements and plan for growth including resource
 * utilization analysis, growth modeling, scaling recommendations, and cost optimization.
 * @inputs { projectName: string, currentMetrics: object, growthForecast?: number }
 * @outputs { success: boolean, capacityPlan: object, scalingRecommendations: array, costProjections: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/performance-optimization/capacity-planning-analysis', {
 *   projectName: 'SaaS Platform',
 *   currentMetrics: { users: 50000, requests: 1000000, storage: '500GB' },
 *   growthForecast: 50
 * });
 *
 * @references
 * - Google SRE - Capacity Planning: https://sre.google/sre-book/software-engineering-in-sre/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    currentMetrics = {},
    growthForecast = 20,
    outputDir = 'capacity-planning-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Capacity Planning Analysis for ${projectName}`);

  // Phase 1: Collect Current Resource Utilization
  const resourceUtilization = await ctx.task(collectResourceUtilizationTask, { projectName, currentMetrics, outputDir });
  artifacts.push(...resourceUtilization.artifacts);

  // Phase 2: Analyze Traffic Patterns
  const trafficPatterns = await ctx.task(analyzeTrafficPatternsTask, { projectName, outputDir });
  artifacts.push(...trafficPatterns.artifacts);

  // Phase 3: Model Growth Scenarios
  const growthModels = await ctx.task(modelGrowthScenariosTask, { projectName, currentMetrics, growthForecast, outputDir });
  artifacts.push(...growthModels.artifacts);

  await ctx.breakpoint({
    question: `Growth models created for ${growthForecast}% forecast. Baseline: ${resourceUtilization.cpuUtilization}% CPU. Calculate requirements?`,
    title: 'Growth Modeling Review',
    context: { runId: ctx.runId, resourceUtilization, growthModels }
  });

  // Phase 4: Calculate Resource Requirements
  const requirements = await ctx.task(calculateResourceRequirementsTask, { projectName, growthModels, outputDir });
  artifacts.push(...requirements.artifacts);

  // Phase 5: Identify Scaling Strategies
  const scalingStrategies = await ctx.task(identifyScalingStrategiesTask, { projectName, requirements, outputDir });
  artifacts.push(...scalingStrategies.artifacts);

  // Phase 6: Project Costs
  const costProjections = await ctx.task(projectCapacityCostsTask, { projectName, requirements, scalingStrategies, outputDir });
  artifacts.push(...costProjections.artifacts);

  // Phase 7: Define Scaling Triggers
  const scalingTriggers = await ctx.task(defineScalingTriggersTask, { projectName, requirements, outputDir });
  artifacts.push(...scalingTriggers.artifacts);

  // Phase 8: Create Capacity Dashboard
  const dashboard = await ctx.task(createCapacityDashboardTask, { projectName, resourceUtilization, requirements, outputDir });
  artifacts.push(...dashboard.artifacts);

  // Phase 9: Document Capacity Plan
  const documentation = await ctx.task(documentCapacityPlanTask, { projectName, requirements, scalingStrategies, costProjections, outputDir });
  artifacts.push(...documentation.artifacts);

  await ctx.breakpoint({
    question: `Capacity plan complete. Projected cost: $${costProjections.totalCost}/month. Scaling: ${scalingStrategies.recommendations.length} recommendations. Accept?`,
    title: 'Capacity Planning Review',
    context: { runId: ctx.runId, requirements, costProjections }
  });

  return {
    success: true,
    projectName,
    capacityPlan: { currentUtilization: resourceUtilization, projectedRequirements: requirements.requirements },
    scalingRecommendations: scalingStrategies.recommendations,
    costProjections: costProjections,
    scalingTriggers: scalingTriggers.triggers,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/performance-optimization/capacity-planning-analysis', timestamp: startTime, outputDir }
  };
}

export const collectResourceUtilizationTask = defineTask('collect-resource-utilization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Collect Resource Utilization - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Collect current resource utilization', context: args,
      instructions: ['1. Collect CPU utilization', '2. Collect memory utilization', '3. Collect storage usage', '4. Collect network usage', '5. Document utilization'],
      outputFormat: 'JSON with resource utilization' },
    outputSchema: { type: 'object', required: ['cpuUtilization', 'artifacts'], properties: { cpuUtilization: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'capacity-planning', 'utilization']
}));

export const analyzeTrafficPatternsTask = defineTask('analyze-traffic-patterns', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze Traffic Patterns - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Analyze traffic patterns', context: args,
      instructions: ['1. Analyze daily patterns', '2. Analyze weekly patterns', '3. Identify peak times', '4. Analyze growth trends', '5. Document patterns'],
      outputFormat: 'JSON with traffic patterns' },
    outputSchema: { type: 'object', required: ['patterns', 'artifacts'], properties: { patterns: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'capacity-planning', 'traffic']
}));

export const modelGrowthScenariosTask = defineTask('model-growth-scenarios', (args, taskCtx) => ({
  kind: 'agent',
  title: `Model Growth Scenarios - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Model growth scenarios', context: args,
      instructions: ['1. Create conservative model', '2. Create moderate model', '3. Create aggressive model', '4. Project 3/6/12 months', '5. Document models'],
      outputFormat: 'JSON with growth models' },
    outputSchema: { type: 'object', required: ['models', 'artifacts'], properties: { models: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'capacity-planning', 'growth']
}));

export const calculateResourceRequirementsTask = defineTask('calculate-resource-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Calculate Resource Requirements - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Calculate resource requirements', context: args,
      instructions: ['1. Calculate CPU requirements', '2. Calculate memory requirements', '3. Calculate storage requirements', '4. Calculate network requirements', '5. Document requirements'],
      outputFormat: 'JSON with resource requirements' },
    outputSchema: { type: 'object', required: ['requirements', 'artifacts'], properties: { requirements: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'capacity-planning', 'requirements']
}));

export const identifyScalingStrategiesTask = defineTask('identify-scaling-strategies', (args, taskCtx) => ({
  kind: 'agent',
  title: `Identify Scaling Strategies - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Identify scaling strategies', context: args,
      instructions: ['1. Evaluate vertical scaling', '2. Evaluate horizontal scaling', '3. Consider auto-scaling', '4. Evaluate caching strategies', '5. Document strategies'],
      outputFormat: 'JSON with scaling strategies' },
    outputSchema: { type: 'object', required: ['recommendations', 'artifacts'], properties: { recommendations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'capacity-planning', 'scaling']
}));

export const projectCapacityCostsTask = defineTask('project-capacity-costs', (args, taskCtx) => ({
  kind: 'agent',
  title: `Project Capacity Costs - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Project capacity costs', context: args,
      instructions: ['1. Calculate compute costs', '2. Calculate storage costs', '3. Calculate network costs', '4. Compare scenarios', '5. Document projections'],
      outputFormat: 'JSON with cost projections' },
    outputSchema: { type: 'object', required: ['totalCost', 'artifacts'], properties: { totalCost: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'capacity-planning', 'costs']
}));

export const defineScalingTriggersTask = defineTask('define-scaling-triggers', (args, taskCtx) => ({
  kind: 'agent',
  title: `Define Scaling Triggers - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Define scaling triggers', context: args,
      instructions: ['1. Define CPU thresholds', '2. Define memory thresholds', '3. Define latency thresholds', '4. Configure auto-scaling', '5. Document triggers'],
      outputFormat: 'JSON with scaling triggers' },
    outputSchema: { type: 'object', required: ['triggers', 'artifacts'], properties: { triggers: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'capacity-planning', 'triggers']
}));

export const createCapacityDashboardTask = defineTask('create-capacity-dashboard', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create Capacity Dashboard - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Create capacity dashboard', context: args,
      instructions: ['1. Add utilization panels', '2. Add trend charts', '3. Add capacity headroom', '4. Add projections', '5. Document dashboard'],
      outputFormat: 'JSON with dashboard configuration' },
    outputSchema: { type: 'object', required: ['dashboard', 'artifacts'], properties: { dashboard: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'capacity-planning', 'dashboard']
}));

export const documentCapacityPlanTask = defineTask('document-capacity-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Document Capacity Plan - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Document capacity plan', context: args,
      instructions: ['1. Document current state', '2. Document projections', '3. Document scaling plan', '4. Include cost analysis', '5. Generate report'],
      outputFormat: 'JSON with capacity plan documentation' },
    outputSchema: { type: 'object', required: ['documentation', 'artifacts'], properties: { documentation: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'capacity-planning', 'documentation']
}));
