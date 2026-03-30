/**
 * @process domains/science/industrial-engineering/capacity-planning
 * @description Capacity Planning Analysis - Analyze production capacity against demand forecasts to identify constraints,
 * plan capacity adjustments, and support strategic planning decisions.
 * @inputs { demandForecast: string, resourceData?: object, planningHorizon?: number }
 * @outputs { success: boolean, capacityGaps: array, recommendations: array, capacityPlan: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('domains/science/industrial-engineering/capacity-planning', {
 *   demandForecast: 'Product family demand forecast 12 months',
 *   resourceData: { machines: 10, labor: 50 },
 *   planningHorizon: 12
 * });
 *
 * @references
 * - Vollmann et al., Manufacturing Planning and Control for Supply Chain Management
 * - APICS CPIM Body of Knowledge
 * - Hopp & Spearman, Factory Physics
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    demandForecast,
    resourceData = {},
    planningHorizon = 12,
    planningUnit = 'months',
    outputDir = 'capacity-planning-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Capacity Planning Analysis process');

  // Task 1: Demand Scenario Definition
  ctx.log('info', 'Phase 1: Defining planning horizon and demand scenarios');
  const demandScenarios = await ctx.task(demandScenariosTask, {
    demandForecast,
    planningHorizon,
    planningUnit,
    outputDir
  });

  artifacts.push(...demandScenarios.artifacts);

  // Task 2: Resource Capacity Documentation
  ctx.log('info', 'Phase 2: Documenting available capacity by resource');
  const resourceCapacity = await ctx.task(resourceCapacityTask, {
    resourceData,
    outputDir
  });

  artifacts.push(...resourceCapacity.artifacts);

  // Task 3: Capacity Requirements Calculation
  ctx.log('info', 'Phase 3: Calculating capacity requirements from demand');
  const capacityRequirements = await ctx.task(capacityRequirementsTask, {
    demandScenarios,
    resourceCapacity,
    outputDir
  });

  artifacts.push(...capacityRequirements.artifacts);

  // Breakpoint: Review requirements
  await ctx.breakpoint({
    question: `Capacity requirements calculated. Peak demand period: ${capacityRequirements.peakPeriod}. ${capacityRequirements.gapCount} resource gaps identified. Review gap analysis?`,
    title: 'Capacity Requirements Review',
    context: {
      runId: ctx.runId,
      requirements: capacityRequirements.summary,
      peakPeriod: capacityRequirements.peakPeriod,
      gaps: capacityRequirements.gapCount,
      files: capacityRequirements.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // Task 4: Gap Analysis
  ctx.log('info', 'Phase 4: Analyzing capacity gaps and constraints');
  const gapAnalysis = await ctx.task(gapAnalysisTask, {
    capacityRequirements,
    resourceCapacity,
    outputDir
  });

  artifacts.push(...gapAnalysis.artifacts);

  // Task 5: Capacity Options Evaluation
  ctx.log('info', 'Phase 5: Evaluating capacity options');
  const optionsEvaluation = await ctx.task(optionsEvaluationTask, {
    gapAnalysis,
    outputDir
  });

  artifacts.push(...optionsEvaluation.artifacts);

  // Task 6: Capacity Plan Development
  ctx.log('info', 'Phase 6: Developing capacity plan recommendations');
  const capacityPlan = await ctx.task(capacityPlanTask, {
    gapAnalysis,
    optionsEvaluation,
    demandScenarios,
    outputDir
  });

  artifacts.push(...capacityPlan.artifacts);

  // Task 7: Financial Analysis
  ctx.log('info', 'Phase 7: Analyzing financial implications');
  const financialAnalysis = await ctx.task(financialAnalysisTask, {
    capacityPlan,
    optionsEvaluation,
    outputDir
  });

  artifacts.push(...financialAnalysis.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Capacity plan developed. Investment required: $${financialAnalysis.totalInvestment}. ROI: ${financialAnalysis.roi}%. Service level impact: ${capacityPlan.serviceLevelImpact}. Review capacity plan?`,
    title: 'Capacity Planning Results',
    context: {
      runId: ctx.runId,
      summary: {
        capacityGaps: gapAnalysis.gaps.length,
        recommendedOptions: capacityPlan.recommendations.length,
        totalInvestment: financialAnalysis.totalInvestment,
        roi: financialAnalysis.roi,
        serviceLevelImpact: capacityPlan.serviceLevelImpact
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    capacityGaps: gapAnalysis.gaps,
    recommendations: capacityPlan.recommendations,
    capacityPlan: {
      actions: capacityPlan.actions,
      timeline: capacityPlan.timeline,
      investment: financialAnalysis.totalInvestment
    },
    artifacts,
    duration,
    metadata: {
      processId: 'domains/science/industrial-engineering/capacity-planning',
      timestamp: startTime,
      planningHorizon,
      outputDir
    }
  };
}

// Task definitions
export const demandScenariosTask = defineTask('demand-scenarios', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define demand scenarios',
  agent: {
    name: 'demand-planner',
    prompt: {
      role: 'Demand Planning Analyst',
      task: 'Define planning horizon and demand scenarios',
      context: args,
      instructions: [
        '1. Review demand forecast',
        '2. Define base case scenario',
        '3. Define optimistic scenario',
        '4. Define pessimistic scenario',
        '5. Convert demand to production hours',
        '6. Identify seasonal patterns',
        '7. Define demand by product family',
        '8. Document demand scenarios'
      ],
      outputFormat: 'JSON with demand scenarios'
    },
    outputSchema: {
      type: 'object',
      required: ['scenarios', 'baseCase', 'productionHours', 'artifacts'],
      properties: {
        scenarios: { type: 'array' },
        baseCase: { type: 'object' },
        optimistic: { type: 'object' },
        pessimistic: { type: 'object' },
        productionHours: { type: 'object' },
        seasonality: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'capacity', 'demand']
}));

export const resourceCapacityTask = defineTask('resource-capacity', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document available capacity',
  agent: {
    name: 'capacity-analyst',
    prompt: {
      role: 'Capacity Analyst',
      task: 'Document available capacity by resource',
      context: args,
      instructions: [
        '1. Inventory all production resources',
        '2. Document equipment capacity',
        '3. Document labor capacity',
        '4. Account for planned downtime',
        '5. Calculate effective capacity',
        '6. Document capacity by work center',
        '7. Identify current utilization',
        '8. Create capacity summary'
      ],
      outputFormat: 'JSON with resource capacity'
    },
    outputSchema: {
      type: 'object',
      required: ['resources', 'effectiveCapacity', 'utilization', 'artifacts'],
      properties: {
        resources: { type: 'array' },
        equipmentCapacity: { type: 'object' },
        laborCapacity: { type: 'object' },
        effectiveCapacity: { type: 'object' },
        utilization: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'capacity', 'resources']
}));

export const capacityRequirementsTask = defineTask('capacity-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate capacity requirements',
  agent: {
    name: 'requirements-calculator',
    prompt: {
      role: 'Production Planning Analyst',
      task: 'Calculate capacity requirements from demand',
      context: args,
      instructions: [
        '1. Convert demand to resource requirements',
        '2. Apply routing and time standards',
        '3. Calculate by resource type',
        '4. Calculate by time period',
        '5. Identify peak requirements',
        '6. Compare to available capacity',
        '7. Identify preliminary gaps',
        '8. Document requirements'
      ],
      outputFormat: 'JSON with capacity requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['requirements', 'peakPeriod', 'gapCount', 'summary', 'artifacts'],
      properties: {
        requirements: { type: 'object' },
        byResource: { type: 'object' },
        byPeriod: { type: 'object' },
        peakPeriod: { type: 'string' },
        gapCount: { type: 'number' },
        summary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'capacity', 'requirements']
}));

export const gapAnalysisTask = defineTask('gap-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze capacity gaps',
  agent: {
    name: 'gap-analyst',
    prompt: {
      role: 'Capacity Gap Analyst',
      task: 'Identify and analyze capacity gaps',
      context: args,
      instructions: [
        '1. Calculate gap by resource',
        '2. Calculate gap by period',
        '3. Identify bottleneck resources',
        '4. Quantify gap magnitude',
        '5. Assess impact on service',
        '6. Prioritize gaps',
        '7. Create gap visualization',
        '8. Document gap analysis'
      ],
      outputFormat: 'JSON with gap analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['gaps', 'bottlenecks', 'serviceImpact', 'artifacts'],
      properties: {
        gaps: { type: 'array' },
        gapByResource: { type: 'object' },
        gapByPeriod: { type: 'object' },
        bottlenecks: { type: 'array' },
        serviceImpact: { type: 'object' },
        prioritization: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'capacity', 'gap-analysis']
}));

export const optionsEvaluationTask = defineTask('options-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Evaluate capacity options',
  agent: {
    name: 'options-evaluator',
    prompt: {
      role: 'Capacity Planning Consultant',
      task: 'Evaluate capacity expansion options',
      context: args,
      instructions: [
        '1. Identify capacity options (overtime, shifts, equipment, outsourcing)',
        '2. Estimate cost for each option',
        '3. Estimate lead time for each',
        '4. Assess risk of each option',
        '5. Evaluate flexibility',
        '6. Compare options',
        '7. Rank options',
        '8. Document evaluation'
      ],
      outputFormat: 'JSON with options evaluation'
    },
    outputSchema: {
      type: 'object',
      required: ['options', 'costEstimates', 'ranking', 'artifacts'],
      properties: {
        options: { type: 'array' },
        costEstimates: { type: 'object' },
        leadTimes: { type: 'object' },
        risks: { type: 'object' },
        flexibility: { type: 'object' },
        ranking: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'capacity', 'options']
}));

export const capacityPlanTask = defineTask('capacity-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop capacity plan',
  agent: {
    name: 'capacity-planner',
    prompt: {
      role: 'Capacity Planning Manager',
      task: 'Develop capacity plan recommendations',
      context: args,
      instructions: [
        '1. Select optimal capacity options',
        '2. Create phased implementation plan',
        '3. Define trigger points for actions',
        '4. Create contingency plans',
        '5. Assess service level impact',
        '6. Define monitoring metrics',
        '7. Create capacity plan document',
        '8. Prepare executive summary'
      ],
      outputFormat: 'JSON with capacity plan'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'actions', 'timeline', 'serviceLevelImpact', 'artifacts'],
      properties: {
        recommendations: { type: 'array' },
        actions: { type: 'array' },
        timeline: { type: 'object' },
        triggerPoints: { type: 'array' },
        contingencies: { type: 'array' },
        serviceLevelImpact: { type: 'string' },
        metrics: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'capacity', 'planning']
}));

export const financialAnalysisTask = defineTask('financial-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze financial implications',
  agent: {
    name: 'financial-analyst',
    prompt: {
      role: 'Financial Analyst',
      task: 'Analyze financial impact of capacity plan',
      context: args,
      instructions: [
        '1. Calculate total investment required',
        '2. Calculate operating cost impact',
        '3. Estimate revenue impact',
        '4. Calculate ROI',
        '5. Calculate payback period',
        '6. Perform sensitivity analysis',
        '7. Create financial summary',
        '8. Document analysis'
      ],
      outputFormat: 'JSON with financial analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['totalInvestment', 'roi', 'paybackPeriod', 'artifacts'],
      properties: {
        totalInvestment: { type: 'number' },
        operatingCostImpact: { type: 'number' },
        revenueImpact: { type: 'number' },
        roi: { type: 'number' },
        paybackPeriod: { type: 'number' },
        sensitivityAnalysis: { type: 'object' },
        npv: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'capacity', 'financial']
}));
