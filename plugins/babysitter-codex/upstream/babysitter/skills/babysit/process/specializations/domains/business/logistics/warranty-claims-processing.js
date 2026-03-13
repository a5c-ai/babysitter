/**
 * @process specializations/domains/business/logistics/warranty-claims-processing
 * @description End-to-end warranty claim management including validation, repair/replacement decisions, and supplier recovery.
 * @inputs { claims: array, products: array, warrantyPolicies?: array, suppliers?: array }
 * @outputs { success: boolean, processedClaims: array, resolutionDecisions: array, supplierRecovery: object, claimMetrics: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/logistics/warranty-claims-processing', {
 *   claims: [{ id: 'WC001', product: 'SKU001', defectType: 'malfunction', purchaseDate: '2024-01-01' }],
 *   products: [{ sku: 'SKU001', warrantyMonths: 12, supplier: 'SUP001' }],
 *   warrantyPolicies: [{ category: 'electronics', coveragePeriod: 12 }]
 * });
 *
 * @references
 * - Warranty Management Best Practices: https://warrantyweek.com/
 * - Consumer Protection Laws: https://www.ftc.gov/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    claims = [],
    products = [],
    warrantyPolicies = [],
    suppliers = [],
    outputDir = 'warranty-claims-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Warranty Claims Processing');
  ctx.log('info', `Claims to Process: ${claims.length}`);

  // PHASE 1: CLAIM INTAKE
  ctx.log('info', 'Phase 1: Processing claim intake');
  const claimIntake = await ctx.task(claimIntakeTask, { claims, products, outputDir });
  artifacts.push(...claimIntake.artifacts);

  // PHASE 2: WARRANTY VALIDATION
  ctx.log('info', 'Phase 2: Validating warranty coverage');
  const warrantyValidation = await ctx.task(warrantyValidationTask, { claims: claimIntake.registeredClaims, products, warrantyPolicies, outputDir });
  artifacts.push(...warrantyValidation.artifacts);

  // PHASE 3: DEFECT ANALYSIS
  ctx.log('info', 'Phase 3: Analyzing defects');
  const defectAnalysis = await ctx.task(defectAnalysisTask, { validClaims: warrantyValidation.validClaims, outputDir });
  artifacts.push(...defectAnalysis.artifacts);

  // Quality Gate: Review claim validity
  await ctx.breakpoint({
    question: `${warrantyValidation.validClaims.length} valid claims of ${claims.length} total. ${warrantyValidation.deniedClaims.length} denied. Top defect: ${defectAnalysis.topDefect}. Review findings?`,
    title: 'Warranty Claims Review',
    context: {
      runId: ctx.runId,
      summary: { validClaims: warrantyValidation.validClaims.length, deniedClaims: warrantyValidation.deniedClaims.length, topDefect: defectAnalysis.topDefect },
      files: warrantyValidation.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // PHASE 4: RESOLUTION DECISION
  ctx.log('info', 'Phase 4: Making resolution decisions');
  const resolutionDecision = await ctx.task(resolutionDecisionTask, { validClaims: warrantyValidation.validClaims, defectAnalysis, outputDir });
  artifacts.push(...resolutionDecision.artifacts);

  // PHASE 5: REPAIR PROCESSING
  ctx.log('info', 'Phase 5: Processing repairs');
  const repairProcessing = await ctx.task(repairProcessingTask, { repairClaims: resolutionDecision.repairClaims, outputDir });
  artifacts.push(...repairProcessing.artifacts);

  // PHASE 6: REPLACEMENT FULFILLMENT
  ctx.log('info', 'Phase 6: Fulfilling replacements');
  const replacementFulfillment = await ctx.task(replacementFulfillmentTask, { replacementClaims: resolutionDecision.replacementClaims, products, outputDir });
  artifacts.push(...replacementFulfillment.artifacts);

  // PHASE 7: REFUND PROCESSING
  ctx.log('info', 'Phase 7: Processing refunds');
  const refundProcessing = await ctx.task(warrantyRefundTask, { refundClaims: resolutionDecision.refundClaims, outputDir });
  artifacts.push(...refundProcessing.artifacts);

  // PHASE 8: SUPPLIER RECOVERY
  ctx.log('info', 'Phase 8: Processing supplier recovery');
  const supplierRecovery = await ctx.task(supplierRecoveryTask, { processedClaims: resolutionDecision.decisions, suppliers, outputDir });
  artifacts.push(...supplierRecovery.artifacts);

  // PHASE 9: ROOT CAUSE ANALYSIS
  ctx.log('info', 'Phase 9: Performing root cause analysis');
  const rootCauseAnalysis = await ctx.task(warrantyRootCauseTask, { defectAnalysis, processedClaims: resolutionDecision.decisions, outputDir });
  artifacts.push(...rootCauseAnalysis.artifacts);

  // PHASE 10: CLAIM METRICS REPORTING
  ctx.log('info', 'Phase 10: Generating claim metrics');
  const claimMetrics = await ctx.task(warrantyMetricsTask, { resolutionDecision, supplierRecovery, rootCauseAnalysis, outputDir });
  artifacts.push(...claimMetrics.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Warranty claims processing complete. ${claims.length} claims processed. Resolution: ${resolutionDecision.repairRate}% repair, ${resolutionDecision.replacementRate}% replace, ${resolutionDecision.refundRate}% refund. Supplier recovery: $${supplierRecovery.totalRecovery}. Approve results?`,
    title: 'Warranty Claims Processing Complete',
    context: {
      runId: ctx.runId,
      summary: {
        totalClaims: claims.length,
        validClaims: warrantyValidation.validClaims.length,
        repairRate: `${resolutionDecision.repairRate}%`,
        replacementRate: `${resolutionDecision.replacementRate}%`,
        supplierRecovery: `$${supplierRecovery.totalRecovery}`
      },
      files: [{ path: claimMetrics.reportPath, format: 'markdown', label: 'Warranty Metrics Report' }]
    }
  });

  const endTime = ctx.now();
  return {
    success: true,
    processedClaims: resolutionDecision.decisions,
    resolutionDecisions: resolutionDecision.decisions,
    supplierRecovery: supplierRecovery.summary,
    claimMetrics: claimMetrics.metrics,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/domains/business/logistics/warranty-claims-processing', timestamp: startTime, outputDir }
  };
}

// TASK DEFINITIONS
export const claimIntakeTask = defineTask('claim-intake', (args, taskCtx) => ({
  kind: 'agent', title: 'Process claim intake', agent: { name: 'claim-intake-specialist', prompt: { role: 'Claim Intake Specialist', task: 'Register and process warranty claim intake', context: args, instructions: ['Register claims', 'Validate customer info', 'Verify purchase proof', 'Assign claim numbers', 'Collect defect details', 'Generate intake report'] }, outputSchema: { type: 'object', required: ['registeredClaims', 'artifacts'], properties: { registeredClaims: { type: 'array' }, incompleteSubmissions: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'warranty', 'intake']
}));

export const warrantyValidationTask = defineTask('warranty-validation', (args, taskCtx) => ({
  kind: 'agent', title: 'Validate warranty coverage', agent: { name: 'warranty-validation-specialist', prompt: { role: 'Warranty Validation Specialist', task: 'Validate warranty coverage for claims', context: args, instructions: ['Check warranty period', 'Verify product registration', 'Apply coverage rules', 'Check exclusions', 'Document denial reasons', 'Generate validation report'] }, outputSchema: { type: 'object', required: ['validClaims', 'deniedClaims', 'artifacts'], properties: { validClaims: { type: 'array' }, deniedClaims: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'warranty', 'validation']
}));

export const defectAnalysisTask = defineTask('defect-analysis', (args, taskCtx) => ({
  kind: 'agent', title: 'Analyze defects', agent: { name: 'defect-analysis-specialist', prompt: { role: 'Defect Analysis Specialist', task: 'Analyze defect types and patterns', context: args, instructions: ['Categorize defect types', 'Identify patterns', 'Calculate defect rates', 'Link to products/batches', 'Identify top defects', 'Generate defect report'] }, outputSchema: { type: 'object', required: ['defectBreakdown', 'topDefect', 'artifacts'], properties: { defectBreakdown: { type: 'object' }, topDefect: { type: 'string' }, patterns: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'warranty', 'defect-analysis']
}));

export const resolutionDecisionTask = defineTask('resolution-decision', (args, taskCtx) => ({
  kind: 'agent', title: 'Make resolution decisions', agent: { name: 'resolution-decision-specialist', prompt: { role: 'Resolution Decision Specialist', task: 'Determine repair, replace, or refund for each claim', context: args, instructions: ['Evaluate repair feasibility', 'Check replacement inventory', 'Calculate cost options', 'Assign resolution type', 'Set customer expectations', 'Generate resolution report'] }, outputSchema: { type: 'object', required: ['decisions', 'repairClaims', 'replacementClaims', 'refundClaims', 'repairRate', 'replacementRate', 'refundRate', 'artifacts'], properties: { decisions: { type: 'array' }, repairClaims: { type: 'array' }, replacementClaims: { type: 'array' }, refundClaims: { type: 'array' }, repairRate: { type: 'number' }, replacementRate: { type: 'number' }, refundRate: { type: 'number' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'warranty', 'resolution']
}));

export const repairProcessingTask = defineTask('repair-processing', (args, taskCtx) => ({
  kind: 'agent', title: 'Process repairs', agent: { name: 'repair-processing-specialist', prompt: { role: 'Repair Processing Specialist', task: 'Process warranty repair claims', context: args, instructions: ['Schedule repairs', 'Order parts', 'Assign technicians', 'Track repair status', 'Quality check repairs', 'Generate repair report'] }, outputSchema: { type: 'object', required: ['repairsProcessed', 'artifacts'], properties: { repairsProcessed: { type: 'array' }, repairCosts: { type: 'number' }, avgRepairTime: { type: 'number' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'warranty', 'repair']
}));

export const replacementFulfillmentTask = defineTask('replacement-fulfillment', (args, taskCtx) => ({
  kind: 'agent', title: 'Fulfill replacements', agent: { name: 'replacement-fulfillment-specialist', prompt: { role: 'Replacement Fulfillment Specialist', task: 'Fulfill warranty replacement orders', context: args, instructions: ['Check inventory', 'Allocate replacements', 'Process shipments', 'Arrange returns', 'Track fulfillment', 'Generate fulfillment report'] }, outputSchema: { type: 'object', required: ['replacementsFulfilled', 'artifacts'], properties: { replacementsFulfilled: { type: 'array' }, replacementCosts: { type: 'number' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'warranty', 'replacement']
}));

export const warrantyRefundTask = defineTask('warranty-refund', (args, taskCtx) => ({
  kind: 'agent', title: 'Process refunds', agent: { name: 'warranty-refund-specialist', prompt: { role: 'Warranty Refund Specialist', task: 'Process warranty refund claims', context: args, instructions: ['Calculate refund amounts', 'Apply depreciation', 'Process payments', 'Send confirmations', 'Track refund status', 'Generate refund report'] }, outputSchema: { type: 'object', required: ['refundsProcessed', 'artifacts'], properties: { refundsProcessed: { type: 'array' }, totalRefunded: { type: 'number' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'warranty', 'refund']
}));

export const supplierRecoveryTask = defineTask('supplier-recovery', (args, taskCtx) => ({
  kind: 'agent', title: 'Process supplier recovery', agent: { name: 'supplier-recovery-specialist', prompt: { role: 'Supplier Recovery Specialist', task: 'Recover costs from suppliers for warranty claims', context: args, instructions: ['Identify recoverable claims', 'Calculate recovery amounts', 'Generate supplier claims', 'Track recovery status', 'Manage disputes', 'Generate recovery report'] }, outputSchema: { type: 'object', required: ['summary', 'totalRecovery', 'artifacts'], properties: { summary: { type: 'object' }, totalRecovery: { type: 'number' }, supplierClaims: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'warranty', 'supplier-recovery']
}));

export const warrantyRootCauseTask = defineTask('warranty-root-cause', (args, taskCtx) => ({
  kind: 'agent', title: 'Perform root cause analysis', agent: { name: 'warranty-root-cause-analyst', prompt: { role: 'Warranty Root Cause Analyst', task: 'Analyze root causes of warranty claims', context: args, instructions: ['Identify failure modes', 'Analyze by product/supplier', 'Find systemic issues', 'Recommend improvements', 'Track corrective actions', 'Generate RCA report'] }, outputSchema: { type: 'object', required: ['rootCauses', 'artifacts'], properties: { rootCauses: { type: 'array' }, recommendations: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'warranty', 'root-cause']
}));

export const warrantyMetricsTask = defineTask('warranty-metrics', (args, taskCtx) => ({
  kind: 'agent', title: 'Generate claim metrics', agent: { name: 'warranty-metrics-specialist', prompt: { role: 'Warranty Metrics Specialist', task: 'Generate warranty claim performance metrics', context: args, instructions: ['Calculate claim rates', 'Measure resolution times', 'Track cost metrics', 'Calculate recovery rates', 'Benchmark performance', 'Generate metrics report'] }, outputSchema: { type: 'object', required: ['metrics', 'reportPath', 'artifacts'], properties: { metrics: { type: 'object' }, reportPath: { type: 'string' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'warranty', 'metrics']
}));
