/**
 * @process specializations/domains/business/logistics/freight-audit-payment
 * @description Automated freight bill validation, discrepancy identification, and payment processing to ensure billing accuracy and recover overcharges.
 * @inputs { freightBills: array, contracts: array, shipmentRecords: array, auditRules?: array, toleranceThresholds?: object }
 * @outputs { success: boolean, auditResults: object, discrepancies: array, recoveredAmount: number, paymentsApproved: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/logistics/freight-audit-payment', {
 *   freightBills: [{ billId: 'FB001', carrierId: 'C001', amount: 1500 }],
 *   contracts: [{ carrierId: 'C001', rates: { perMile: 2.50 } }],
 *   shipmentRecords: [{ shipmentId: 'S001', billId: 'FB001', miles: 500 }]
 * });
 *
 * @references
 * - Logistics Management: https://www.logisticsmgmt.com/
 * - Freight Audit Best Practices: https://www.supplychaindive.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    freightBills = [],
    contracts = [],
    shipmentRecords = [],
    auditRules = [],
    toleranceThresholds = { amount: 0.01, weight: 0.02 },
    autoApproveThreshold = 50,
    outputDir = 'freight-audit-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Freight Audit and Payment Process');
  ctx.log('info', `Bills to audit: ${freightBills.length}`);

  // ============================================================================
  // PHASE 1: DATA INGESTION AND NORMALIZATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Ingesting and normalizing data');

  const dataIngestion = await ctx.task(dataIngestionTask, {
    freightBills,
    contracts,
    shipmentRecords,
    outputDir
  });

  artifacts.push(...dataIngestion.artifacts);

  // ============================================================================
  // PHASE 2: CONTRACT RATE VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Validating against contract rates');

  const rateValidation = await ctx.task(rateValidationTask, {
    normalizedBills: dataIngestion.normalizedBills,
    contracts,
    toleranceThresholds,
    outputDir
  });

  artifacts.push(...rateValidation.artifacts);

  // ============================================================================
  // PHASE 3: WEIGHT AND DIMENSION VERIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Verifying weights and dimensions');

  const weightVerification = await ctx.task(weightVerificationTask, {
    normalizedBills: dataIngestion.normalizedBills,
    shipmentRecords,
    toleranceThresholds,
    outputDir
  });

  artifacts.push(...weightVerification.artifacts);

  // ============================================================================
  // PHASE 4: ACCESSORIAL CHARGE AUDIT
  // ============================================================================

  ctx.log('info', 'Phase 4: Auditing accessorial charges');

  const accessorialAudit = await ctx.task(accessorialAuditTask, {
    normalizedBills: dataIngestion.normalizedBills,
    contracts,
    shipmentRecords,
    outputDir
  });

  artifacts.push(...accessorialAudit.artifacts);

  // ============================================================================
  // PHASE 5: DUPLICATE DETECTION
  // ============================================================================

  ctx.log('info', 'Phase 5: Detecting duplicate invoices');

  const duplicateDetection = await ctx.task(duplicateDetectionTask, {
    normalizedBills: dataIngestion.normalizedBills,
    historicalBills: inputs.historicalBills || [],
    outputDir
  });

  artifacts.push(...duplicateDetection.artifacts);

  // ============================================================================
  // PHASE 6: DISCREPANCY AGGREGATION AND CLASSIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Aggregating and classifying discrepancies');

  const discrepancyAggregation = await ctx.task(discrepancyAggregationTask, {
    rateDiscrepancies: rateValidation.discrepancies,
    weightDiscrepancies: weightVerification.discrepancies,
    accessorialDiscrepancies: accessorialAudit.discrepancies,
    duplicates: duplicateDetection.duplicates,
    outputDir
  });

  artifacts.push(...discrepancyAggregation.artifacts);

  // Quality Gate: Review major discrepancies
  if (discrepancyAggregation.majorDiscrepancies.length > 0) {
    await ctx.breakpoint({
      question: `Found ${discrepancyAggregation.majorDiscrepancies.length} major discrepancies totaling $${discrepancyAggregation.totalDiscrepancyAmount}. Review before proceeding?`,
      title: 'Major Discrepancy Review',
      context: {
        runId: ctx.runId,
        majorDiscrepancies: discrepancyAggregation.majorDiscrepancies,
        totalDiscrepancyAmount: discrepancyAggregation.totalDiscrepancyAmount,
        files: discrepancyAggregation.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 7: CLAIM GENERATION FOR OVERCHARGES
  // ============================================================================

  ctx.log('info', 'Phase 7: Generating claims for overcharges');

  const claimGeneration = await ctx.task(claimGenerationTask, {
    discrepancies: discrepancyAggregation.allDiscrepancies,
    contracts,
    outputDir
  });

  artifacts.push(...claimGeneration.artifacts);

  // ============================================================================
  // PHASE 8: PAYMENT APPROVAL WORKFLOW
  // ============================================================================

  ctx.log('info', 'Phase 8: Processing payment approvals');

  const paymentApproval = await ctx.task(paymentApprovalTask, {
    normalizedBills: dataIngestion.normalizedBills,
    discrepancies: discrepancyAggregation.allDiscrepancies,
    autoApproveThreshold,
    outputDir
  });

  artifacts.push(...paymentApproval.artifacts);

  // Quality Gate: Manual approval for high-value bills
  if (paymentApproval.pendingManualApproval.length > 0) {
    await ctx.breakpoint({
      question: `${paymentApproval.pendingManualApproval.length} bills require manual approval (total: $${paymentApproval.pendingApprovalTotal}). Review and approve?`,
      title: 'Manual Payment Approval Required',
      context: {
        runId: ctx.runId,
        pendingBills: paymentApproval.pendingManualApproval,
        pendingTotal: paymentApproval.pendingApprovalTotal,
        files: paymentApproval.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 9: PAYMENT PROCESSING
  // ============================================================================

  ctx.log('info', 'Phase 9: Processing payments');

  const paymentProcessing = await ctx.task(paymentProcessingTask, {
    approvedBills: paymentApproval.approvedBills,
    adjustedAmounts: discrepancyAggregation.adjustedAmounts,
    outputDir
  });

  artifacts.push(...paymentProcessing.artifacts);

  // ============================================================================
  // PHASE 10: AUDIT REPORTING AND ANALYTICS
  // ============================================================================

  ctx.log('info', 'Phase 10: Generating audit report and analytics');

  const auditReporting = await ctx.task(auditReportingTask, {
    auditSummary: {
      totalBills: freightBills.length,
      discrepancies: discrepancyAggregation.allDiscrepancies,
      recoveredAmount: claimGeneration.totalRecoveryAmount,
      paymentsProcessed: paymentProcessing.paymentsProcessed
    },
    outputDir
  });

  artifacts.push(...auditReporting.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Freight audit complete. ${freightBills.length} bills audited, ${discrepancyAggregation.allDiscrepancies.length} discrepancies found, $${claimGeneration.totalRecoveryAmount} recovered. Finalize audit?`,
    title: 'Freight Audit Complete',
    context: {
      runId: ctx.runId,
      summary: {
        billsAudited: freightBills.length,
        discrepanciesFound: discrepancyAggregation.allDiscrepancies.length,
        totalRecovered: claimGeneration.totalRecoveryAmount,
        paymentsProcessed: paymentProcessing.paymentsProcessed.length,
        totalPaid: paymentProcessing.totalPaidAmount
      },
      files: [
        { path: auditReporting.reportPath, format: 'markdown', label: 'Audit Report' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    auditResults: {
      totalBillsAudited: freightBills.length,
      billsWithDiscrepancies: discrepancyAggregation.billsWithDiscrepancies,
      discrepancyRate: (discrepancyAggregation.billsWithDiscrepancies / freightBills.length * 100).toFixed(2)
    },
    discrepancies: discrepancyAggregation.allDiscrepancies,
    recoveredAmount: claimGeneration.totalRecoveryAmount,
    paymentsApproved: paymentApproval.approvedBills,
    paymentsProcessed: paymentProcessing.paymentsProcessed,
    claims: claimGeneration.claims,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/business/logistics/freight-audit-payment',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const dataIngestionTask = defineTask('data-ingestion', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Ingest and normalize freight data',
  agent: {
    name: 'data-normalization-specialist',
    prompt: {
      role: 'Data Normalization Specialist',
      task: 'Ingest and normalize freight bills, contracts, and shipment records',
      context: args,
      instructions: [
        'Parse all freight bill formats (EDI, PDF, CSV)',
        'Normalize carrier codes and names',
        'Standardize charge codes',
        'Match bills to contracts',
        'Match bills to shipment records',
        'Identify missing data elements',
        'Flag data quality issues',
        'Generate normalized dataset'
      ],
      outputFormat: 'JSON with normalized data'
    },
    outputSchema: {
      type: 'object',
      required: ['normalizedBills', 'artifacts'],
      properties: {
        normalizedBills: { type: 'array' },
        dataQualityIssues: { type: 'array' },
        unmatchedBills: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'freight-audit', 'data-ingestion']
}));

export const rateValidationTask = defineTask('rate-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate against contract rates',
  agent: {
    name: 'rate-validation-specialist',
    prompt: {
      role: 'Rate Validation Specialist',
      task: 'Validate freight charges against contracted rates',
      context: args,
      instructions: [
        'Look up applicable contract rates',
        'Calculate expected charges',
        'Compare billed vs expected amounts',
        'Apply tolerance thresholds',
        'Identify rate discrepancies',
        'Check rate effective dates',
        'Validate fuel surcharges',
        'Document all variances'
      ],
      outputFormat: 'JSON with rate validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['validatedBills', 'discrepancies', 'artifacts'],
      properties: {
        validatedBills: { type: 'array' },
        discrepancies: { type: 'array' },
        totalOvercharge: { type: 'number' },
        totalUndercharge: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'freight-audit', 'rate-validation']
}));

export const weightVerificationTask = defineTask('weight-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify weights and dimensions',
  agent: {
    name: 'weight-verification-specialist',
    prompt: {
      role: 'Weight Verification Specialist',
      task: 'Verify billed weights against actual shipment weights',
      context: args,
      instructions: [
        'Compare billed weight to shipment weight',
        'Verify dimensional weight calculations',
        'Check freight class accuracy',
        'Apply weight tolerance thresholds',
        'Identify weight discrepancies',
        'Calculate overcharge amounts',
        'Flag reweigh candidates',
        'Document all variances'
      ],
      outputFormat: 'JSON with weight verification results'
    },
    outputSchema: {
      type: 'object',
      required: ['verifiedBills', 'discrepancies', 'artifacts'],
      properties: {
        verifiedBills: { type: 'array' },
        discrepancies: { type: 'array' },
        reweighCandidates: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'freight-audit', 'weight-verification']
}));

export const accessorialAuditTask = defineTask('accessorial-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Audit accessorial charges',
  agent: {
    name: 'accessorial-audit-specialist',
    prompt: {
      role: 'Accessorial Audit Specialist',
      task: 'Audit accessorial charges for validity and accuracy',
      context: args,
      instructions: [
        'Identify all accessorial charges',
        'Validate charge codes and descriptions',
        'Verify services were actually provided',
        'Check rates against contract',
        'Identify unauthorized charges',
        'Validate detention/demurrage charges',
        'Check liftgate and special handling',
        'Document all discrepancies'
      ],
      outputFormat: 'JSON with accessorial audit results'
    },
    outputSchema: {
      type: 'object',
      required: ['auditedCharges', 'discrepancies', 'artifacts'],
      properties: {
        auditedCharges: { type: 'array' },
        discrepancies: { type: 'array' },
        unauthorizedCharges: { type: 'array' },
        totalAccessorialOvercharge: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'freight-audit', 'accessorials']
}));

export const duplicateDetectionTask = defineTask('duplicate-detection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Detect duplicate invoices',
  agent: {
    name: 'duplicate-detection-specialist',
    prompt: {
      role: 'Duplicate Detection Specialist',
      task: 'Identify duplicate freight invoices',
      context: args,
      instructions: [
        'Check for exact duplicate invoice numbers',
        'Identify potential duplicates by shipment',
        'Check for re-bills and corrections',
        'Verify against historical payments',
        'Flag potential duplicate payments',
        'Calculate duplicate exposure amount',
        'Generate duplicate report'
      ],
      outputFormat: 'JSON with duplicate detection results'
    },
    outputSchema: {
      type: 'object',
      required: ['duplicates', 'artifacts'],
      properties: {
        duplicates: { type: 'array' },
        potentialDuplicates: { type: 'array' },
        duplicateExposure: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'freight-audit', 'duplicates']
}));

export const discrepancyAggregationTask = defineTask('discrepancy-aggregation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Aggregate and classify discrepancies',
  agent: {
    name: 'discrepancy-analyst',
    prompt: {
      role: 'Discrepancy Analyst',
      task: 'Aggregate and classify all audit discrepancies',
      context: args,
      instructions: [
        'Consolidate all discrepancy types',
        'Classify by severity and type',
        'Calculate total discrepancy amount',
        'Identify major discrepancies',
        'Calculate adjusted bill amounts',
        'Prioritize for recovery',
        'Generate discrepancy summary'
      ],
      outputFormat: 'JSON with aggregated discrepancies'
    },
    outputSchema: {
      type: 'object',
      required: ['allDiscrepancies', 'totalDiscrepancyAmount', 'artifacts'],
      properties: {
        allDiscrepancies: { type: 'array' },
        majorDiscrepancies: { type: 'array' },
        totalDiscrepancyAmount: { type: 'number' },
        billsWithDiscrepancies: { type: 'number' },
        adjustedAmounts: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'freight-audit', 'discrepancies']
}));

export const claimGenerationTask = defineTask('claim-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate claims for overcharges',
  agent: {
    name: 'claims-specialist',
    prompt: {
      role: 'Claims Specialist',
      task: 'Generate claims for freight overcharges',
      context: args,
      instructions: [
        'Create claim for each recoverable discrepancy',
        'Include supporting documentation',
        'Reference contract terms',
        'Calculate claim amounts',
        'Prioritize claims by amount',
        'Generate claim submission package',
        'Track expected recovery'
      ],
      outputFormat: 'JSON with generated claims'
    },
    outputSchema: {
      type: 'object',
      required: ['claims', 'totalRecoveryAmount', 'artifacts'],
      properties: {
        claims: { type: 'array' },
        totalRecoveryAmount: { type: 'number' },
        claimsByCarrier: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'freight-audit', 'claims']
}));

export const paymentApprovalTask = defineTask('payment-approval', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Process payment approvals',
  agent: {
    name: 'payment-approval-specialist',
    prompt: {
      role: 'Payment Approval Specialist',
      task: 'Approve freight payments based on audit results',
      context: args,
      instructions: [
        'Apply auto-approval rules',
        'Route exceptions for manual approval',
        'Apply discrepancy adjustments',
        'Calculate approved amounts',
        'Flag bills needing hold',
        'Generate approval summary',
        'Prepare payment batch'
      ],
      outputFormat: 'JSON with payment approval results'
    },
    outputSchema: {
      type: 'object',
      required: ['approvedBills', 'pendingManualApproval', 'artifacts'],
      properties: {
        approvedBills: { type: 'array' },
        pendingManualApproval: { type: 'array' },
        pendingApprovalTotal: { type: 'number' },
        heldBills: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'freight-audit', 'payment-approval']
}));

export const paymentProcessingTask = defineTask('payment-processing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Process payments',
  agent: {
    name: 'payment-processing-specialist',
    prompt: {
      role: 'Payment Processing Specialist',
      task: 'Process approved freight payments',
      context: args,
      instructions: [
        'Create payment records',
        'Apply payment terms',
        'Generate payment files (EDI 820)',
        'Update payment status',
        'Record payment details',
        'Generate remittance advice',
        'Update accounts payable'
      ],
      outputFormat: 'JSON with payment processing results'
    },
    outputSchema: {
      type: 'object',
      required: ['paymentsProcessed', 'totalPaidAmount', 'artifacts'],
      properties: {
        paymentsProcessed: { type: 'array' },
        totalPaidAmount: { type: 'number' },
        paymentFiles: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'freight-audit', 'payment-processing']
}));

export const auditReportingTask = defineTask('audit-reporting', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate audit report',
  agent: {
    name: 'audit-reporting-specialist',
    prompt: {
      role: 'Audit Reporting Specialist',
      task: 'Generate comprehensive freight audit report',
      context: args,
      instructions: [
        'Summarize audit results',
        'Calculate key metrics (discrepancy rate, recovery rate)',
        'Analyze discrepancies by carrier',
        'Analyze discrepancies by type',
        'Generate trend analysis',
        'Provide recommendations',
        'Create executive summary',
        'Generate detailed report'
      ],
      outputFormat: 'JSON with audit report details'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        metrics: { type: 'object' },
        carrierAnalysis: { type: 'object' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'freight-audit', 'reporting']
}));
