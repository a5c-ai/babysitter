/**
 * @process specializations/domains/business/logistics/reverse-logistics-management
 * @description End-to-end reverse supply chain orchestration for returns, repairs, recycling, and disposal with value recovery optimization.
 * @inputs { returnRequests: array, products: array, dispositionRules?: array, partners?: array }
 * @outputs { success: boolean, reverseLogisticsPlan: array, dispositionDecisions: array, valueRecovery: object, sustainabilityMetrics: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/logistics/reverse-logistics-management', {
 *   returnRequests: [{ id: 'RET001', product: 'SKU001', reason: 'defective', quantity: 1 }],
 *   products: [{ sku: 'SKU001', category: 'electronics', value: 299 }],
 *   dispositionRules: [{ condition: 'new', action: 'restock' }]
 * });
 *
 * @references
 * - Reverse Logistics Association: https://www.reverselogisticstrends.com/
 * - CSCMP: https://cscmp.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    returnRequests = [],
    products = [],
    dispositionRules = [],
    partners = [],
    outputDir = 'reverse-logistics-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Reverse Logistics Management Process');
  ctx.log('info', `Return Requests: ${returnRequests.length}`);

  // PHASE 1: RETURN REQUEST ANALYSIS
  ctx.log('info', 'Phase 1: Analyzing return requests');
  const returnAnalysis = await ctx.task(returnRequestAnalysisTask, { returnRequests, products, outputDir });
  artifacts.push(...returnAnalysis.artifacts);

  // PHASE 2: RETURN AUTHORIZATION
  ctx.log('info', 'Phase 2: Processing return authorizations');
  const returnAuthorization = await ctx.task(returnAuthorizationTask, { returnRequests: returnAnalysis.validatedRequests, outputDir });
  artifacts.push(...returnAuthorization.artifacts);

  // PHASE 3: COLLECTION LOGISTICS
  ctx.log('info', 'Phase 3: Planning collection logistics');
  const collectionLogistics = await ctx.task(collectionLogisticsTask, { authorizedReturns: returnAuthorization.authorizedReturns, partners, outputDir });
  artifacts.push(...collectionLogistics.artifacts);

  // PHASE 4: INSPECTION AND GRADING
  ctx.log('info', 'Phase 4: Planning inspection and grading');
  const inspectionPlanning = await ctx.task(inspectionGradingTask, { returnItems: collectionLogistics.scheduledPickups, outputDir });
  artifacts.push(...inspectionPlanning.artifacts);

  // Quality Gate: Review return volume
  await ctx.breakpoint({
    question: `${returnAuthorization.authorizedReturns.length} returns authorized. Estimated value: $${returnAnalysis.totalValue}. ${returnAnalysis.defectiveRate}% defective. Review return plan?`,
    title: 'Reverse Logistics Review',
    context: {
      runId: ctx.runId,
      summary: { authorizedReturns: returnAuthorization.authorizedReturns.length, totalValue: returnAnalysis.totalValue, defectiveRate: returnAnalysis.defectiveRate },
      files: returnAnalysis.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // PHASE 5: DISPOSITION DECISION
  ctx.log('info', 'Phase 5: Making disposition decisions');
  const dispositionDecision = await ctx.task(dispositionDecisionTask, { inspectedItems: inspectionPlanning.inspectionPlan, dispositionRules, outputDir });
  artifacts.push(...dispositionDecision.artifacts);

  // PHASE 6: REFURBISHMENT PLANNING
  ctx.log('info', 'Phase 6: Planning refurbishment');
  const refurbishmentPlanning = await ctx.task(refurbishmentPlanningTask, { refurbishItems: dispositionDecision.refurbishItems, outputDir });
  artifacts.push(...refurbishmentPlanning.artifacts);

  // PHASE 7: SECONDARY MARKET PLACEMENT
  ctx.log('info', 'Phase 7: Planning secondary market placement');
  const secondaryMarket = await ctx.task(secondaryMarketTask, { resellItems: dispositionDecision.resellItems, refurbishedItems: refurbishmentPlanning.refurbishedItems, outputDir });
  artifacts.push(...secondaryMarket.artifacts);

  // PHASE 8: RECYCLING AND DISPOSAL
  ctx.log('info', 'Phase 8: Planning recycling and disposal');
  const recyclingDisposal = await ctx.task(recyclingDisposalTask, { recycleItems: dispositionDecision.recycleItems, disposeItems: dispositionDecision.disposeItems, outputDir });
  artifacts.push(...recyclingDisposal.artifacts);

  // PHASE 9: VALUE RECOVERY ANALYSIS
  ctx.log('info', 'Phase 9: Analyzing value recovery');
  const valueRecovery = await ctx.task(valueRecoveryTask, { dispositionDecision, secondaryMarket, recyclingDisposal, outputDir });
  artifacts.push(...valueRecovery.artifacts);

  // PHASE 10: SUSTAINABILITY REPORTING
  ctx.log('info', 'Phase 10: Generating sustainability report');
  const sustainabilityReport = await ctx.task(reverseSustainabilityTask, { recyclingDisposal, valueRecovery, outputDir });
  artifacts.push(...sustainabilityReport.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Reverse logistics planning complete. Value recovery: ${valueRecovery.recoveryRate}%. Diversion rate: ${sustainabilityReport.diversionRate}%. Approve plan?`,
    title: 'Reverse Logistics Management Complete',
    context: {
      runId: ctx.runId,
      summary: {
        returnsProcessed: returnRequests.length,
        valueRecoveryRate: `${valueRecovery.recoveryRate}%`,
        diversionRate: `${sustainabilityReport.diversionRate}%`,
        netRecoveredValue: `$${valueRecovery.netValue}`
      },
      files: [{ path: sustainabilityReport.reportPath, format: 'markdown', label: 'Sustainability Report' }]
    }
  });

  const endTime = ctx.now();
  return {
    success: true,
    reverseLogisticsPlan: collectionLogistics.plan,
    dispositionDecisions: dispositionDecision.decisions,
    valueRecovery: valueRecovery.summary,
    sustainabilityMetrics: sustainabilityReport.metrics,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/domains/business/logistics/reverse-logistics-management', timestamp: startTime, outputDir }
  };
}

// TASK DEFINITIONS
export const returnRequestAnalysisTask = defineTask('return-request-analysis', (args, taskCtx) => ({
  kind: 'agent', title: 'Analyze return requests', agent: { name: 'return-request-analyst', prompt: { role: 'Return Request Analyst', task: 'Analyze and validate return requests', context: args, instructions: ['Validate return requests', 'Categorize by reason', 'Calculate return value', 'Identify patterns', 'Flag fraud indicators', 'Generate return analysis'] }, outputSchema: { type: 'object', required: ['validatedRequests', 'totalValue', 'defectiveRate', 'artifacts'], properties: { validatedRequests: { type: 'array' }, totalValue: { type: 'number' }, defectiveRate: { type: 'number' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'reverse-logistics', 'return-analysis']
}));

export const returnAuthorizationTask = defineTask('return-authorization', (args, taskCtx) => ({
  kind: 'agent', title: 'Process return authorizations', agent: { name: 'return-authorization-specialist', prompt: { role: 'Return Authorization Specialist', task: 'Process and authorize returns', context: args, instructions: ['Apply return policies', 'Generate RMA numbers', 'Set return windows', 'Calculate refund amounts', 'Send customer notifications', 'Generate authorization records'] }, outputSchema: { type: 'object', required: ['authorizedReturns', 'artifacts'], properties: { authorizedReturns: { type: 'array' }, deniedReturns: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'reverse-logistics', 'authorization']
}));

export const collectionLogisticsTask = defineTask('collection-logistics', (args, taskCtx) => ({
  kind: 'agent', title: 'Plan collection logistics', agent: { name: 'collection-logistics-planner', prompt: { role: 'Collection Logistics Planner', task: 'Plan collection and pickup logistics', context: args, instructions: ['Determine collection method', 'Schedule pickups', 'Assign carriers', 'Generate shipping labels', 'Coordinate drop-off locations', 'Generate collection plan'] }, outputSchema: { type: 'object', required: ['plan', 'scheduledPickups', 'artifacts'], properties: { plan: { type: 'array' }, scheduledPickups: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'reverse-logistics', 'collection']
}));

export const inspectionGradingTask = defineTask('inspection-grading', (args, taskCtx) => ({
  kind: 'agent', title: 'Plan inspection and grading', agent: { name: 'inspection-grading-specialist', prompt: { role: 'Inspection and Grading Specialist', task: 'Plan product inspection and grading process', context: args, instructions: ['Define inspection criteria', 'Create grading standards', 'Assign inspection resources', 'Plan testing procedures', 'Set quality thresholds', 'Generate inspection plan'] }, outputSchema: { type: 'object', required: ['inspectionPlan', 'artifacts'], properties: { inspectionPlan: { type: 'array' }, gradingCriteria: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'reverse-logistics', 'inspection']
}));

export const dispositionDecisionTask = defineTask('disposition-decision', (args, taskCtx) => ({
  kind: 'agent', title: 'Make disposition decisions', agent: { name: 'disposition-decision-specialist', prompt: { role: 'Disposition Decision Specialist', task: 'Determine optimal disposition for returned items', context: args, instructions: ['Apply disposition rules', 'Evaluate condition grades', 'Calculate recovery value', 'Assign disposition paths', 'Optimize value recovery', 'Generate disposition decisions'] }, outputSchema: { type: 'object', required: ['decisions', 'refurbishItems', 'resellItems', 'recycleItems', 'disposeItems', 'artifacts'], properties: { decisions: { type: 'array' }, refurbishItems: { type: 'array' }, resellItems: { type: 'array' }, recycleItems: { type: 'array' }, disposeItems: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'reverse-logistics', 'disposition']
}));

export const refurbishmentPlanningTask = defineTask('refurbishment-planning', (args, taskCtx) => ({
  kind: 'agent', title: 'Plan refurbishment', agent: { name: 'refurbishment-planner', prompt: { role: 'Refurbishment Planning Specialist', task: 'Plan product refurbishment operations', context: args, instructions: ['Assess refurbishment needs', 'Plan repair operations', 'Schedule technicians', 'Order replacement parts', 'Set quality standards', 'Generate refurbishment plan'] }, outputSchema: { type: 'object', required: ['refurbishedItems', 'artifacts'], properties: { refurbishedItems: { type: 'array' }, refurbishmentSchedule: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'reverse-logistics', 'refurbishment']
}));

export const secondaryMarketTask = defineTask('secondary-market', (args, taskCtx) => ({
  kind: 'agent', title: 'Plan secondary market placement', agent: { name: 'secondary-market-specialist', prompt: { role: 'Secondary Market Specialist', task: 'Plan secondary market sales channels', context: args, instructions: ['Identify sales channels', 'Set pricing strategy', 'Create product listings', 'Assign to marketplaces', 'Plan fulfillment', 'Generate sales plan'] }, outputSchema: { type: 'object', required: ['salesPlan', 'artifacts'], properties: { salesPlan: { type: 'array' }, expectedRevenue: { type: 'number' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'reverse-logistics', 'secondary-market']
}));

export const recyclingDisposalTask = defineTask('recycling-disposal', (args, taskCtx) => ({
  kind: 'agent', title: 'Plan recycling and disposal', agent: { name: 'recycling-disposal-specialist', prompt: { role: 'Recycling and Disposal Specialist', task: 'Plan environmentally responsible recycling and disposal', context: args, instructions: ['Identify recyclable materials', 'Select recycling partners', 'Ensure compliance', 'Document disposal', 'Track certifications', 'Generate recycling plan'] }, outputSchema: { type: 'object', required: ['recyclingPlan', 'artifacts'], properties: { recyclingPlan: { type: 'array' }, disposalPlan: { type: 'array' }, complianceRecords: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'reverse-logistics', 'recycling']
}));

export const valueRecoveryTask = defineTask('value-recovery', (args, taskCtx) => ({
  kind: 'agent', title: 'Analyze value recovery', agent: { name: 'value-recovery-analyst', prompt: { role: 'Value Recovery Analyst', task: 'Analyze value recovery from reverse logistics', context: args, instructions: ['Calculate recovered value', 'Analyze by disposition', 'Calculate recovery rate', 'Identify improvements', 'Benchmark performance', 'Generate value recovery report'] }, outputSchema: { type: 'object', required: ['summary', 'recoveryRate', 'netValue', 'artifacts'], properties: { summary: { type: 'object' }, recoveryRate: { type: 'number' }, netValue: { type: 'number' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'reverse-logistics', 'value-recovery']
}));

export const reverseSustainabilityTask = defineTask('reverse-sustainability', (args, taskCtx) => ({
  kind: 'agent', title: 'Generate sustainability report', agent: { name: 'reverse-sustainability-specialist', prompt: { role: 'Reverse Logistics Sustainability Specialist', task: 'Generate sustainability metrics and report', context: args, instructions: ['Calculate diversion rate', 'Track carbon savings', 'Document circular economy', 'Generate ESG metrics', 'Create sustainability report', 'Identify green improvements'] }, outputSchema: { type: 'object', required: ['metrics', 'diversionRate', 'reportPath', 'artifacts'], properties: { metrics: { type: 'object' }, diversionRate: { type: 'number' }, reportPath: { type: 'string' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'reverse-logistics', 'sustainability']
}));
