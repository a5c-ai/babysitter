/**
 * @process specializations/domains/business/logistics/returns-processing-disposition
 * @description Streamlined returns receiving, inspection, and disposition workflow to maximize recovery and minimize processing time.
 * @inputs { returns: array, inspectionCriteria?: object, dispositionPolicies?: array, inventorySystem?: object }
 * @outputs { success: boolean, processedReturns: array, dispositionResults: array, qualityMetrics: object, processingTime: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/logistics/returns-processing-disposition', {
 *   returns: [{ rmaNumber: 'RMA001', sku: 'SKU001', returnReason: 'wrong-size', condition: 'unopened' }],
 *   inspectionCriteria: { categories: ['apparel', 'electronics'], standards: {} },
 *   dispositionPolicies: [{ condition: 'new', action: 'restock' }]
 * });
 *
 * @references
 * - Returns Management Best Practices: https://www.reverselogisticstrends.com/
 * - NRF Retail Returns: https://nrf.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    returns = [],
    inspectionCriteria = {},
    dispositionPolicies = [],
    inventorySystem = {},
    outputDir = 'returns-processing-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Returns Processing and Disposition Process');
  ctx.log('info', `Returns to Process: ${returns.length}`);

  // PHASE 1: RECEIVING AND CHECK-IN
  ctx.log('info', 'Phase 1: Receiving returns');
  const receiving = await ctx.task(returnsReceivingTask, { returns, outputDir });
  artifacts.push(...receiving.artifacts);

  // PHASE 2: DOCUMENT VERIFICATION
  ctx.log('info', 'Phase 2: Verifying documentation');
  const documentVerification = await ctx.task(documentVerificationTask, { receivedReturns: receiving.checkedIn, outputDir });
  artifacts.push(...documentVerification.artifacts);

  // PHASE 3: PHYSICAL INSPECTION
  ctx.log('info', 'Phase 3: Performing physical inspection');
  const physicalInspection = await ctx.task(physicalInspectionTask, { verifiedReturns: documentVerification.verified, inspectionCriteria, outputDir });
  artifacts.push(...physicalInspection.artifacts);

  // PHASE 4: CONDITION GRADING
  ctx.log('info', 'Phase 4: Grading condition');
  const conditionGrading = await ctx.task(conditionGradingTask, { inspectedItems: physicalInspection.inspected, outputDir });
  artifacts.push(...conditionGrading.artifacts);

  // Quality Gate: Review inspection results
  await ctx.breakpoint({
    question: `${conditionGrading.gradedItems.length} items graded. ${conditionGrading.gradeA}% Grade A, ${conditionGrading.gradeB}% Grade B, ${conditionGrading.gradeC}% Grade C, ${conditionGrading.scrap}% Scrap. Review grading?`,
    title: 'Returns Inspection Review',
    context: {
      runId: ctx.runId,
      summary: { gradeA: conditionGrading.gradeA, gradeB: conditionGrading.gradeB, gradeC: conditionGrading.gradeC, scrap: conditionGrading.scrap },
      files: conditionGrading.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // PHASE 5: DISPOSITION ASSIGNMENT
  ctx.log('info', 'Phase 5: Assigning disposition');
  const dispositionAssignment = await ctx.task(dispositionAssignmentTask, { gradedItems: conditionGrading.gradedItems, dispositionPolicies, outputDir });
  artifacts.push(...dispositionAssignment.artifacts);

  // PHASE 6: RESTOCKING PROCESSING
  ctx.log('info', 'Phase 6: Processing restocking');
  const restocking = await ctx.task(restockingProcessTask, { restockItems: dispositionAssignment.restockItems, inventorySystem, outputDir });
  artifacts.push(...restocking.artifacts);

  // PHASE 7: REFUND PROCESSING
  ctx.log('info', 'Phase 7: Processing refunds');
  const refundProcessing = await ctx.task(refundProcessingTask, { returns: dispositionAssignment.assignments, outputDir });
  artifacts.push(...refundProcessing.artifacts);

  // PHASE 8: LIQUIDATION ROUTING
  ctx.log('info', 'Phase 8: Routing to liquidation');
  const liquidationRouting = await ctx.task(liquidationRoutingTask, { liquidationItems: dispositionAssignment.liquidationItems, outputDir });
  artifacts.push(...liquidationRouting.artifacts);

  // PHASE 9: SCRAP AND DONATE
  ctx.log('info', 'Phase 9: Processing scrap and donations');
  const scrapDonate = await ctx.task(scrapDonateTask, { scrapItems: dispositionAssignment.scrapItems, donateItems: dispositionAssignment.donateItems, outputDir });
  artifacts.push(...scrapDonate.artifacts);

  // PHASE 10: QUALITY METRICS REPORTING
  ctx.log('info', 'Phase 10: Generating quality metrics');
  const qualityMetrics = await ctx.task(returnsQualityMetricsTask, { conditionGrading, dispositionAssignment, restocking, outputDir });
  artifacts.push(...qualityMetrics.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Returns processing complete. ${returns.length} returns processed. Restock rate: ${dispositionAssignment.restockRate}%. Avg processing time: ${qualityMetrics.avgProcessingTime} minutes. Approve results?`,
    title: 'Returns Processing Complete',
    context: {
      runId: ctx.runId,
      summary: {
        totalReturns: returns.length,
        restockRate: `${dispositionAssignment.restockRate}%`,
        refundsProcessed: refundProcessing.refundsIssued,
        avgProcessingTime: `${qualityMetrics.avgProcessingTime} min`
      },
      files: [{ path: qualityMetrics.reportPath, format: 'markdown', label: 'Quality Metrics Report' }]
    }
  });

  const endTime = ctx.now();
  return {
    success: true,
    processedReturns: receiving.checkedIn,
    dispositionResults: dispositionAssignment.assignments,
    qualityMetrics: qualityMetrics.metrics,
    processingTime: { total: endTime - startTime, average: qualityMetrics.avgProcessingTime },
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/domains/business/logistics/returns-processing-disposition', timestamp: startTime, outputDir }
  };
}

// TASK DEFINITIONS
export const returnsReceivingTask = defineTask('returns-receiving', (args, taskCtx) => ({
  kind: 'agent', title: 'Receive returns', agent: { name: 'returns-receiving-specialist', prompt: { role: 'Returns Receiving Specialist', task: 'Receive and check-in returned items', context: args, instructions: ['Scan RMA numbers', 'Verify shipment contents', 'Log receipt time', 'Assign bin locations', 'Note visible damage', 'Generate receiving log'] }, outputSchema: { type: 'object', required: ['checkedIn', 'artifacts'], properties: { checkedIn: { type: 'array' }, discrepancies: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'returns', 'receiving']
}));

export const documentVerificationTask = defineTask('document-verification', (args, taskCtx) => ({
  kind: 'agent', title: 'Verify documentation', agent: { name: 'document-verification-specialist', prompt: { role: 'Document Verification Specialist', task: 'Verify return documentation and RMA validity', context: args, instructions: ['Validate RMA numbers', 'Check return window', 'Verify customer info', 'Confirm return reason', 'Flag documentation issues', 'Generate verification report'] }, outputSchema: { type: 'object', required: ['verified', 'artifacts'], properties: { verified: { type: 'array' }, rejected: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'returns', 'verification']
}));

export const physicalInspectionTask = defineTask('physical-inspection', (args, taskCtx) => ({
  kind: 'agent', title: 'Perform physical inspection', agent: { name: 'physical-inspection-specialist', prompt: { role: 'Physical Inspection Specialist', task: 'Inspect returned items for condition and completeness', context: args, instructions: ['Visual inspection', 'Check packaging', 'Verify all components', 'Test functionality', 'Document defects', 'Generate inspection report'] }, outputSchema: { type: 'object', required: ['inspected', 'artifacts'], properties: { inspected: { type: 'array' }, defectsFound: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'returns', 'inspection']
}));

export const conditionGradingTask = defineTask('condition-grading', (args, taskCtx) => ({
  kind: 'agent', title: 'Grade condition', agent: { name: 'condition-grading-specialist', prompt: { role: 'Condition Grading Specialist', task: 'Assign condition grades to returned items', context: args, instructions: ['Apply grading criteria', 'Assign grade (A/B/C/Scrap)', 'Document reasoning', 'Calculate grade distribution', 'Flag borderline cases', 'Generate grading report'] }, outputSchema: { type: 'object', required: ['gradedItems', 'gradeA', 'gradeB', 'gradeC', 'scrap', 'artifacts'], properties: { gradedItems: { type: 'array' }, gradeA: { type: 'number' }, gradeB: { type: 'number' }, gradeC: { type: 'number' }, scrap: { type: 'number' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'returns', 'grading']
}));

export const dispositionAssignmentTask = defineTask('disposition-assignment', (args, taskCtx) => ({
  kind: 'agent', title: 'Assign disposition', agent: { name: 'disposition-assignment-specialist', prompt: { role: 'Disposition Assignment Specialist', task: 'Assign disposition path for each returned item', context: args, instructions: ['Apply disposition policies', 'Assign to restock/liquidate/scrap/donate', 'Calculate recovery value', 'Generate disposition instructions', 'Track assignments', 'Generate disposition report'] }, outputSchema: { type: 'object', required: ['assignments', 'restockItems', 'liquidationItems', 'scrapItems', 'donateItems', 'restockRate', 'artifacts'], properties: { assignments: { type: 'array' }, restockItems: { type: 'array' }, liquidationItems: { type: 'array' }, scrapItems: { type: 'array' }, donateItems: { type: 'array' }, restockRate: { type: 'number' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'returns', 'disposition']
}));

export const restockingProcessTask = defineTask('restocking-process', (args, taskCtx) => ({
  kind: 'agent', title: 'Process restocking', agent: { name: 'restocking-specialist', prompt: { role: 'Restocking Specialist', task: 'Process items for restocking to inventory', context: args, instructions: ['Repackage if needed', 'Update inventory system', 'Assign locations', 'Update availability', 'Generate restocking log', 'Track restock rates'] }, outputSchema: { type: 'object', required: ['restocked', 'artifacts'], properties: { restocked: { type: 'array' }, restockValue: { type: 'number' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'returns', 'restocking']
}));

export const refundProcessingTask = defineTask('refund-processing', (args, taskCtx) => ({
  kind: 'agent', title: 'Process refunds', agent: { name: 'refund-processing-specialist', prompt: { role: 'Refund Processing Specialist', task: 'Process customer refunds based on disposition', context: args, instructions: ['Calculate refund amounts', 'Apply restocking fees', 'Process payment refunds', 'Issue store credits', 'Send notifications', 'Generate refund report'] }, outputSchema: { type: 'object', required: ['refundsIssued', 'artifacts'], properties: { refundsIssued: { type: 'number' }, refundTotal: { type: 'number' }, refundDetails: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'returns', 'refund']
}));

export const liquidationRoutingTask = defineTask('liquidation-routing', (args, taskCtx) => ({
  kind: 'agent', title: 'Route to liquidation', agent: { name: 'liquidation-routing-specialist', prompt: { role: 'Liquidation Routing Specialist', task: 'Route items to liquidation channels', context: args, instructions: ['Select liquidation partners', 'Create lot manifests', 'Set reserve prices', 'Schedule pickups', 'Track liquidation', 'Generate liquidation report'] }, outputSchema: { type: 'object', required: ['liquidationLots', 'artifacts'], properties: { liquidationLots: { type: 'array' }, expectedRecovery: { type: 'number' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'returns', 'liquidation']
}));

export const scrapDonateTask = defineTask('scrap-donate', (args, taskCtx) => ({
  kind: 'agent', title: 'Process scrap and donations', agent: { name: 'scrap-donate-specialist', prompt: { role: 'Scrap and Donation Specialist', task: 'Process items for scrap or donation', context: args, instructions: ['Separate scrap from donate', 'Arrange disposal', 'Select donation partners', 'Generate tax documentation', 'Track sustainability metrics', 'Generate disposal report'] }, outputSchema: { type: 'object', required: ['scrapProcessed', 'donationsProcessed', 'artifacts'], properties: { scrapProcessed: { type: 'number' }, donationsProcessed: { type: 'number' }, taxDeductions: { type: 'number' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'returns', 'scrap-donate']
}));

export const returnsQualityMetricsTask = defineTask('returns-quality-metrics', (args, taskCtx) => ({
  kind: 'agent', title: 'Generate quality metrics', agent: { name: 'returns-quality-analyst', prompt: { role: 'Returns Quality Analyst', task: 'Generate returns processing quality metrics', context: args, instructions: ['Calculate processing times', 'Measure accuracy rates', 'Track disposition distribution', 'Calculate recovery rates', 'Identify improvements', 'Generate quality report'] }, outputSchema: { type: 'object', required: ['metrics', 'avgProcessingTime', 'reportPath', 'artifacts'], properties: { metrics: { type: 'object' }, avgProcessingTime: { type: 'number' }, reportPath: { type: 'string' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'returns', 'quality-metrics']
}));
