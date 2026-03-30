/**
 * @process specializations/domains/business/logistics/distribution-network-optimization
 * @description Strategic network modeling and analysis to optimize facility locations, capacity allocation, and inventory positioning across the distribution network.
 * @inputs { facilities: array, demandPoints: array, products: array, costData: object, constraints?: object }
 * @outputs { success: boolean, networkDesign: object, facilityRecommendations: array, costAnalysis: object, implementationPlan: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/logistics/distribution-network-optimization', {
 *   facilities: [{ id: 'DC1', location: 'Chicago', capacity: 100000 }],
 *   demandPoints: [{ region: 'Midwest', annualDemand: 50000 }],
 *   products: [{ sku: 'SKU001', unitWeight: 5 }],
 *   costData: { transportation: 0.05, warehousing: 2.50 }
 * });
 *
 * @references
 * - Supply Chain Strategy: https://www.pearson.com/en-us/subject-catalog/p/supply-chain-management-strategy-planning-and-operation/P200000003281
 * - Network Design: https://www.ascm.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    facilities = [],
    demandPoints = [],
    products = [],
    costData = {},
    constraints = {},
    outputDir = 'network-optimization-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Distribution Network Optimization Process');
  ctx.log('info', `Facilities: ${facilities.length}, Demand points: ${demandPoints.length}`);

  // PHASE 1: DEMAND ANALYSIS AND MAPPING
  ctx.log('info', 'Phase 1: Analyzing and mapping demand');
  const demandAnalysis = await ctx.task(networkDemandAnalysisTask, { demandPoints, products, outputDir });
  artifacts.push(...demandAnalysis.artifacts);

  // PHASE 2: CURRENT NETWORK ASSESSMENT
  ctx.log('info', 'Phase 2: Assessing current network');
  const networkAssessment = await ctx.task(currentNetworkAssessmentTask, { facilities, demandPoints, costData, outputDir });
  artifacts.push(...networkAssessment.artifacts);

  // PHASE 3: FACILITY LOCATION ANALYSIS
  ctx.log('info', 'Phase 3: Analyzing facility locations');
  const facilityAnalysis = await ctx.task(facilityLocationAnalysisTask, { demandAnalysis, constraints, outputDir });
  artifacts.push(...facilityAnalysis.artifacts);

  // PHASE 4: NETWORK OPTIMIZATION MODEL
  ctx.log('info', 'Phase 4: Running network optimization model');
  const optimizationModel = await ctx.task(networkOptimizationTask, {
    demandAnalysis,
    facilityAnalysis,
    costData,
    constraints,
    outputDir
  });
  artifacts.push(...optimizationModel.artifacts);

  // Quality Gate: Review optimization results
  await ctx.breakpoint({
    question: `Network optimization complete. Recommended facilities: ${optimizationModel.recommendedFacilities.length}. Estimated cost savings: ${optimizationModel.costSavings}%. Review design?`,
    title: 'Network Optimization Review',
    context: {
      runId: ctx.runId,
      summary: { recommendedFacilities: optimizationModel.recommendedFacilities.length, costSavings: optimizationModel.costSavings },
      files: optimizationModel.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // PHASE 5: INVENTORY POSITIONING
  ctx.log('info', 'Phase 5: Optimizing inventory positioning');
  const inventoryPositioning = await ctx.task(inventoryPositioningTask, { networkDesign: optimizationModel.design, products, outputDir });
  artifacts.push(...inventoryPositioning.artifacts);

  // PHASE 6: SERVICE LEVEL ANALYSIS
  ctx.log('info', 'Phase 6: Analyzing service levels');
  const serviceLevelAnalysis = await ctx.task(serviceLevelAnalysisTask, { networkDesign: optimizationModel.design, demandPoints, outputDir });
  artifacts.push(...serviceLevelAnalysis.artifacts);

  // PHASE 7: COST-BENEFIT ANALYSIS
  ctx.log('info', 'Phase 7: Conducting cost-benefit analysis');
  const costBenefitAnalysis = await ctx.task(networkCostBenefitTask, { currentNetwork: networkAssessment, proposedNetwork: optimizationModel.design, outputDir });
  artifacts.push(...costBenefitAnalysis.artifacts);

  // PHASE 8: IMPLEMENTATION ROADMAP
  ctx.log('info', 'Phase 8: Creating implementation roadmap');
  const implementationRoadmap = await ctx.task(implementationRoadmapTask, { networkChanges: optimizationModel.changes, constraints, outputDir });
  artifacts.push(...implementationRoadmap.artifacts);

  // PHASE 9: GENERATE EXECUTIVE REPORT
  ctx.log('info', 'Phase 9: Generating executive report');
  const executiveReport = await ctx.task(networkExecutiveReportTask, { optimizationModel, costBenefitAnalysis, serviceLevelAnalysis, implementationRoadmap, outputDir });
  artifacts.push(...executiveReport.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Network optimization complete. Total cost savings: $${costBenefitAnalysis.annualSavings}. Service level improvement: ${serviceLevelAnalysis.improvement}%. Approve implementation plan?`,
    title: 'Network Optimization Complete',
    context: {
      runId: ctx.runId,
      summary: {
        currentFacilities: facilities.length,
        recommendedFacilities: optimizationModel.recommendedFacilities.length,
        annualSavings: `$${costBenefitAnalysis.annualSavings}`,
        serviceLevelImprovement: `${serviceLevelAnalysis.improvement}%`
      },
      files: [{ path: executiveReport.reportPath, format: 'markdown', label: 'Executive Report' }]
    }
  });

  const endTime = ctx.now();
  return {
    success: true,
    networkDesign: optimizationModel.design,
    facilityRecommendations: optimizationModel.recommendedFacilities,
    costAnalysis: costBenefitAnalysis.analysis,
    implementationPlan: implementationRoadmap.plan,
    inventoryPositioning: inventoryPositioning.strategy,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/domains/business/logistics/distribution-network-optimization', timestamp: startTime, outputDir }
  };
}

// TASK DEFINITIONS
export const networkDemandAnalysisTask = defineTask('network-demand-analysis', (args, taskCtx) => ({
  kind: 'agent', title: 'Analyze and map demand', agent: { name: 'network-demand-analyst', prompt: { role: 'Network Demand Analyst', task: 'Analyze and map demand for network design', context: args, instructions: ['Aggregate demand by region', 'Identify demand patterns', 'Project future demand', 'Map geographic distribution', 'Calculate demand density', 'Generate demand heat map'] }, outputSchema: { type: 'object', required: ['demandMap', 'artifacts'], properties: { demandMap: { type: 'object' }, demandProjections: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'network-optimization', 'demand']
}));

export const currentNetworkAssessmentTask = defineTask('current-network-assessment', (args, taskCtx) => ({
  kind: 'agent', title: 'Assess current network', agent: { name: 'network-assessment-specialist', prompt: { role: 'Network Assessment Specialist', task: 'Assess current distribution network performance', context: args, instructions: ['Document current facilities', 'Calculate current costs', 'Measure service levels', 'Identify inefficiencies', 'Benchmark against industry', 'Generate assessment report'] }, outputSchema: { type: 'object', required: ['assessment', 'artifacts'], properties: { assessment: { type: 'object' }, currentCosts: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'network-optimization', 'assessment']
}));

export const facilityLocationAnalysisTask = defineTask('facility-location-analysis', (args, taskCtx) => ({
  kind: 'agent', title: 'Analyze facility locations', agent: { name: 'facility-location-analyst', prompt: { role: 'Facility Location Analyst', task: 'Analyze potential facility locations', context: args, instructions: ['Identify candidate locations', 'Evaluate location factors', 'Calculate proximity to demand', 'Assess infrastructure', 'Evaluate labor availability', 'Generate location scorecard'] }, outputSchema: { type: 'object', required: ['candidates', 'artifacts'], properties: { candidates: { type: 'array' }, locationScores: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'network-optimization', 'location']
}));

export const networkOptimizationTask = defineTask('network-optimization', (args, taskCtx) => ({
  kind: 'agent', title: 'Run network optimization model', agent: { name: 'network-optimizer', prompt: { role: 'Network Optimization Specialist', task: 'Run optimization model for network design', context: args, instructions: ['Formulate optimization model', 'Define objective function', 'Apply constraints', 'Solve for optimal network', 'Calculate cost savings', 'Generate optimal design'] }, outputSchema: { type: 'object', required: ['design', 'recommendedFacilities', 'costSavings', 'changes', 'artifacts'], properties: { design: { type: 'object' }, recommendedFacilities: { type: 'array' }, costSavings: { type: 'number' }, changes: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'network-optimization', 'optimization']
}));

export const inventoryPositioningTask = defineTask('inventory-positioning', (args, taskCtx) => ({
  kind: 'agent', title: 'Optimize inventory positioning', agent: { name: 'inventory-positioning-specialist', prompt: { role: 'Inventory Positioning Specialist', task: 'Optimize inventory positioning across network', context: args, instructions: ['Determine stocking locations', 'Calculate safety stock by location', 'Optimize forward positioning', 'Balance inventory investment', 'Plan replenishment flows', 'Generate positioning strategy'] }, outputSchema: { type: 'object', required: ['strategy', 'artifacts'], properties: { strategy: { type: 'object' }, stockingPlan: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'network-optimization', 'inventory']
}));

export const serviceLevelAnalysisTask = defineTask('service-level-analysis', (args, taskCtx) => ({
  kind: 'agent', title: 'Analyze service levels', agent: { name: 'service-level-analyst', prompt: { role: 'Service Level Analyst', task: 'Analyze service levels for network design', context: args, instructions: ['Calculate delivery coverage', 'Determine transit times', 'Map service zones', 'Compare to targets', 'Identify gaps', 'Generate service analysis'] }, outputSchema: { type: 'object', required: ['serviceLevels', 'improvement', 'artifacts'], properties: { serviceLevels: { type: 'object' }, improvement: { type: 'number' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'network-optimization', 'service-level']
}));

export const networkCostBenefitTask = defineTask('network-cost-benefit', (args, taskCtx) => ({
  kind: 'agent', title: 'Conduct cost-benefit analysis', agent: { name: 'cost-benefit-analyst', prompt: { role: 'Network Cost-Benefit Analyst', task: 'Conduct cost-benefit analysis for network changes', context: args, instructions: ['Calculate implementation costs', 'Project operating savings', 'Calculate NPV', 'Determine payback period', 'Assess risk factors', 'Generate financial analysis'] }, outputSchema: { type: 'object', required: ['analysis', 'annualSavings', 'artifacts'], properties: { analysis: { type: 'object' }, annualSavings: { type: 'number' }, paybackPeriod: { type: 'number' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'network-optimization', 'cost-benefit']
}));

export const implementationRoadmapTask = defineTask('implementation-roadmap', (args, taskCtx) => ({
  kind: 'agent', title: 'Create implementation roadmap', agent: { name: 'implementation-planner', prompt: { role: 'Implementation Planning Specialist', task: 'Create network implementation roadmap', context: args, instructions: ['Sequence network changes', 'Define milestones', 'Identify dependencies', 'Allocate resources', 'Plan transition', 'Generate roadmap'] }, outputSchema: { type: 'object', required: ['plan', 'artifacts'], properties: { plan: { type: 'array' }, timeline: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'network-optimization', 'implementation']
}));

export const networkExecutiveReportTask = defineTask('network-executive-report', (args, taskCtx) => ({
  kind: 'agent', title: 'Generate executive report', agent: { name: 'network-report-specialist', prompt: { role: 'Network Report Specialist', task: 'Generate executive network optimization report', context: args, instructions: ['Summarize recommendations', 'Present cost-benefit', 'Document service improvements', 'Include implementation timeline', 'Add visualizations', 'Generate executive report'] }, outputSchema: { type: 'object', required: ['reportPath', 'artifacts'], properties: { reportPath: { type: 'string' }, executiveSummary: { type: 'string' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'network-optimization', 'reporting']
}));
