/**
 * @process specializations/domains/business/logistics/carrier-selection
 * @description Automated carrier evaluation, rate comparison, and selection based on cost, service levels, capacity, and performance history to optimize freight spend.
 * @inputs { shipmentDetails: object, carriers: array, requirements?: object, historicalData?: object, budgetConstraints?: object }
 * @outputs { success: boolean, selectedCarrier: object, alternativeCarriers: array, costAnalysis: object, performanceMetrics: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/logistics/carrier-selection', {
 *   shipmentDetails: { origin: 'Los Angeles', destination: 'Chicago', weight: 5000, mode: 'FTL' },
 *   carriers: [{ id: 'C001', name: 'FastFreight', baseRate: 2.50 }],
 *   requirements: { deliveryDate: '2024-01-15', insurance: true },
 *   budgetConstraints: { maxCost: 5000 }
 * });
 *
 * @references
 * - CLTD Certification: https://www.ascm.org/learning-development/certifications-credentials/cltd/
 * - Carrier Selection Best Practices: https://www.logisticsmgmt.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    shipmentDetails,
    carriers = [],
    requirements = {},
    historicalData = null,
    budgetConstraints = {},
    weightFactors = { cost: 0.4, service: 0.3, reliability: 0.2, capacity: 0.1 },
    outputDir = 'carrier-selection-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Carrier Selection and Procurement Process');
  ctx.log('info', `Shipment: ${shipmentDetails.origin} to ${shipmentDetails.destination}, ${carriers.length} carriers to evaluate`);

  // ============================================================================
  // PHASE 1: SHIPMENT REQUIREMENTS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing shipment requirements');

  const requirementsAnalysis = await ctx.task(requirementsAnalysisTask, {
    shipmentDetails,
    requirements,
    outputDir
  });

  artifacts.push(...requirementsAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: CARRIER QUALIFICATION SCREENING
  // ============================================================================

  ctx.log('info', 'Phase 2: Screening carrier qualifications');

  const carrierScreening = await ctx.task(carrierScreeningTask, {
    carriers,
    shipmentRequirements: requirementsAnalysis.requirements,
    outputDir
  });

  artifacts.push(...carrierScreening.artifacts);

  const qualifiedCarriers = carrierScreening.qualifiedCarriers;

  if (qualifiedCarriers.length === 0) {
    return {
      success: false,
      error: 'No carriers meet minimum qualification requirements',
      disqualifiedReasons: carrierScreening.disqualificationReasons,
      artifacts,
      metadata: { processId: 'specializations/domains/business/logistics/carrier-selection', timestamp: startTime }
    };
  }

  // ============================================================================
  // PHASE 3: RATE COLLECTION AND COMPARISON
  // ============================================================================

  ctx.log('info', 'Phase 3: Collecting and comparing carrier rates');

  const rateComparison = await ctx.task(rateComparisonTask, {
    qualifiedCarriers,
    shipmentDetails,
    requirements,
    budgetConstraints,
    outputDir
  });

  artifacts.push(...rateComparison.artifacts);

  // ============================================================================
  // PHASE 4: PERFORMANCE HISTORY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing carrier performance history');

  const performanceAnalysis = await ctx.task(performanceAnalysisTask, {
    qualifiedCarriers,
    historicalData,
    outputDir
  });

  artifacts.push(...performanceAnalysis.artifacts);

  // ============================================================================
  // PHASE 5: SERVICE LEVEL EVALUATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Evaluating service levels');

  const serviceLevelEval = await ctx.task(serviceLevelEvaluationTask, {
    qualifiedCarriers,
    requirements,
    shipmentDetails,
    outputDir
  });

  artifacts.push(...serviceLevelEval.artifacts);

  // ============================================================================
  // PHASE 6: CAPACITY AND AVAILABILITY CHECK
  // ============================================================================

  ctx.log('info', 'Phase 6: Checking capacity and availability');

  const capacityCheck = await ctx.task(capacityAvailabilityTask, {
    qualifiedCarriers,
    shipmentDetails,
    requirements,
    outputDir
  });

  artifacts.push(...capacityCheck.artifacts);

  // ============================================================================
  // PHASE 7: MULTI-CRITERIA SCORING AND RANKING
  // ============================================================================

  ctx.log('info', 'Phase 7: Scoring and ranking carriers');

  const carrierRanking = await ctx.task(carrierRankingTask, {
    qualifiedCarriers,
    rateComparison,
    performanceAnalysis,
    serviceLevelEval,
    capacityCheck,
    weightFactors,
    outputDir
  });

  artifacts.push(...carrierRanking.artifacts);

  // Quality Gate: Review carrier rankings
  await ctx.breakpoint({
    question: `Carrier ranking complete. Top carrier: ${carrierRanking.rankedCarriers[0]?.name} (Score: ${carrierRanking.rankedCarriers[0]?.totalScore}). Review rankings before final selection?`,
    title: 'Carrier Ranking Review',
    context: {
      runId: ctx.runId,
      rankedCarriers: carrierRanking.rankedCarriers.slice(0, 5),
      weightFactors,
      files: carrierRanking.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // PHASE 8: FINAL SELECTION AND RECOMMENDATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Making final carrier selection');

  const finalSelection = await ctx.task(finalSelectionTask, {
    rankedCarriers: carrierRanking.rankedCarriers,
    shipmentDetails,
    requirements,
    budgetConstraints,
    outputDir
  });

  artifacts.push(...finalSelection.artifacts);

  // ============================================================================
  // PHASE 9: CONTRACT AND RATE CONFIRMATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Preparing contract and rate confirmation');

  const contractPreparation = await ctx.task(contractPreparationTask, {
    selectedCarrier: finalSelection.selectedCarrier,
    shipmentDetails,
    requirements,
    negotiatedRate: finalSelection.negotiatedRate,
    outputDir
  });

  artifacts.push(...contractPreparation.artifacts);

  // Final Breakpoint: Confirm selection
  await ctx.breakpoint({
    question: `Carrier selection complete. Selected: ${finalSelection.selectedCarrier.name}. Rate: $${finalSelection.negotiatedRate}. Confirm selection and proceed with booking?`,
    title: 'Final Carrier Selection Confirmation',
    context: {
      runId: ctx.runId,
      selectedCarrier: finalSelection.selectedCarrier,
      negotiatedRate: finalSelection.negotiatedRate,
      estimatedDelivery: finalSelection.estimatedDelivery,
      alternativeCarriers: finalSelection.alternativeCarriers.slice(0, 3),
      files: [
        { path: contractPreparation.contractPath, format: 'json', label: 'Contract Details' },
        { path: carrierRanking.reportPath, format: 'markdown', label: 'Carrier Comparison Report' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    selectedCarrier: finalSelection.selectedCarrier,
    alternativeCarriers: finalSelection.alternativeCarriers,
    costAnalysis: {
      selectedRate: finalSelection.negotiatedRate,
      savingsVsAverage: rateComparison.savingsVsAverage,
      totalCost: finalSelection.totalCost
    },
    performanceMetrics: {
      onTimeDelivery: performanceAnalysis.carrierMetrics[finalSelection.selectedCarrier.id]?.onTimeDelivery,
      damageRate: performanceAnalysis.carrierMetrics[finalSelection.selectedCarrier.id]?.damageRate,
      claimRatio: performanceAnalysis.carrierMetrics[finalSelection.selectedCarrier.id]?.claimRatio
    },
    serviceLevel: serviceLevelEval.carrierServiceLevels[finalSelection.selectedCarrier.id],
    estimatedDelivery: finalSelection.estimatedDelivery,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/business/logistics/carrier-selection',
      timestamp: startTime,
      carriersEvaluated: carriers.length,
      carriersQualified: qualifiedCarriers.length,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const requirementsAnalysisTask = defineTask('requirements-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze shipment requirements',
  agent: {
    name: 'logistics-requirements-analyst',
    prompt: {
      role: 'Logistics Requirements Analyst',
      task: 'Analyze shipment details and requirements',
      context: args,
      instructions: [
        'Analyze origin and destination details',
        'Determine freight class and commodity type',
        'Identify special handling requirements',
        'Calculate dimensional weight',
        'Determine required equipment type',
        'Identify regulatory requirements',
        'Define minimum service requirements',
        'Document all requirements'
      ],
      outputFormat: 'JSON with detailed requirements analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['requirements', 'artifacts'],
      properties: {
        requirements: { type: 'object' },
        freightClass: { type: 'string' },
        equipmentType: { type: 'string' },
        specialHandling: { type: 'array' },
        regulatoryRequirements: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'carrier-selection', 'requirements']
}));

export const carrierScreeningTask = defineTask('carrier-screening', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Screen carrier qualifications',
  agent: {
    name: 'carrier-qualification-specialist',
    prompt: {
      role: 'Carrier Qualification Specialist',
      task: 'Screen carriers against minimum qualification criteria',
      context: args,
      instructions: [
        'Verify carrier authority and licensing',
        'Check insurance coverage adequacy',
        'Verify safety ratings (CSA scores)',
        'Check equipment compatibility',
        'Verify lane coverage',
        'Review certification requirements',
        'Flag disqualified carriers with reasons',
        'Generate qualification report'
      ],
      outputFormat: 'JSON with qualified carriers and disqualification reasons'
    },
    outputSchema: {
      type: 'object',
      required: ['qualifiedCarriers', 'artifacts'],
      properties: {
        qualifiedCarriers: { type: 'array' },
        disqualifiedCarriers: { type: 'array' },
        disqualificationReasons: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'carrier-selection', 'qualification']
}));

export const rateComparisonTask = defineTask('rate-comparison', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compare carrier rates',
  agent: {
    name: 'freight-rate-analyst',
    prompt: {
      role: 'Freight Rate Analyst',
      task: 'Collect and compare carrier rates',
      context: args,
      instructions: [
        'Collect rate quotes from all carriers',
        'Normalize rates for comparison',
        'Include accessorial charges',
        'Calculate total landed cost',
        'Identify rate anomalies',
        'Compare to market benchmarks',
        'Identify negotiation opportunities',
        'Generate rate comparison matrix'
      ],
      outputFormat: 'JSON with rate comparison data'
    },
    outputSchema: {
      type: 'object',
      required: ['rates', 'savingsVsAverage', 'artifacts'],
      properties: {
        rates: { type: 'object' },
        lowestRate: { type: 'number' },
        averageRate: { type: 'number' },
        savingsVsAverage: { type: 'number' },
        rateMatrix: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'carrier-selection', 'rates']
}));

export const performanceAnalysisTask = defineTask('performance-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze carrier performance',
  agent: {
    name: 'carrier-performance-analyst',
    prompt: {
      role: 'Carrier Performance Analyst',
      task: 'Analyze historical carrier performance',
      context: args,
      instructions: [
        'Calculate on-time delivery percentage',
        'Analyze damage and loss rates',
        'Review claims history',
        'Calculate tender acceptance rate',
        'Analyze billing accuracy',
        'Review customer complaints',
        'Compare to SLA targets',
        'Generate performance scorecard'
      ],
      outputFormat: 'JSON with performance metrics by carrier'
    },
    outputSchema: {
      type: 'object',
      required: ['carrierMetrics', 'artifacts'],
      properties: {
        carrierMetrics: { type: 'object' },
        topPerformers: { type: 'array' },
        concernCarriers: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'carrier-selection', 'performance']
}));

export const serviceLevelEvaluationTask = defineTask('service-level-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Evaluate service levels',
  agent: {
    name: 'service-level-analyst',
    prompt: {
      role: 'Service Level Analyst',
      task: 'Evaluate carrier service levels',
      context: args,
      instructions: [
        'Review transit time commitments',
        'Evaluate tracking capabilities',
        'Assess customer service quality',
        'Review communication protocols',
        'Evaluate EDI capabilities',
        'Assess value-added services',
        'Review SLA terms',
        'Generate service level comparison'
      ],
      outputFormat: 'JSON with service level evaluation by carrier'
    },
    outputSchema: {
      type: 'object',
      required: ['carrierServiceLevels', 'artifacts'],
      properties: {
        carrierServiceLevels: { type: 'object' },
        bestServiceCarrier: { type: 'string' },
        serviceLevelMatrix: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'carrier-selection', 'service-levels']
}));

export const capacityAvailabilityTask = defineTask('capacity-availability', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Check capacity and availability',
  agent: {
    name: 'capacity-planner',
    prompt: {
      role: 'Capacity Planning Specialist',
      task: 'Verify carrier capacity and equipment availability',
      context: args,
      instructions: [
        'Check equipment availability for dates',
        'Verify lane capacity',
        'Assess surge capacity',
        'Check seasonal constraints',
        'Verify driver availability',
        'Assess commitment reliability',
        'Identify capacity risks',
        'Generate availability report'
      ],
      outputFormat: 'JSON with capacity and availability data'
    },
    outputSchema: {
      type: 'object',
      required: ['availabilityByCarrier', 'artifacts'],
      properties: {
        availabilityByCarrier: { type: 'object' },
        capacityConfirmed: { type: 'array' },
        capacityRisks: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'carrier-selection', 'capacity']
}));

export const carrierRankingTask = defineTask('carrier-ranking', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score and rank carriers',
  agent: {
    name: 'carrier-ranking-specialist',
    prompt: {
      role: 'Carrier Ranking Specialist',
      task: 'Apply multi-criteria scoring to rank carriers',
      context: args,
      instructions: [
        'Apply weighted scoring model',
        'Calculate cost score',
        'Calculate service score',
        'Calculate reliability score',
        'Calculate capacity score',
        'Compute total weighted score',
        'Rank carriers by total score',
        'Generate ranking report'
      ],
      outputFormat: 'JSON with ranked carriers and scores'
    },
    outputSchema: {
      type: 'object',
      required: ['rankedCarriers', 'reportPath', 'artifacts'],
      properties: {
        rankedCarriers: { type: 'array' },
        scoreBreakdown: { type: 'object' },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'carrier-selection', 'ranking']
}));

export const finalSelectionTask = defineTask('final-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Make final carrier selection',
  agent: {
    name: 'procurement-specialist',
    prompt: {
      role: 'Freight Procurement Specialist',
      task: 'Make final carrier selection and negotiate terms',
      context: args,
      instructions: [
        'Select optimal carrier based on rankings',
        'Identify backup carriers',
        'Negotiate final rate',
        'Confirm service commitments',
        'Verify all requirements met',
        'Calculate total cost',
        'Document selection rationale',
        'Prepare recommendation'
      ],
      outputFormat: 'JSON with selected carrier and negotiated terms'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedCarrier', 'negotiatedRate', 'artifacts'],
      properties: {
        selectedCarrier: { type: 'object' },
        alternativeCarriers: { type: 'array' },
        negotiatedRate: { type: 'number' },
        totalCost: { type: 'number' },
        estimatedDelivery: { type: 'string' },
        selectionRationale: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'carrier-selection', 'procurement']
}));

export const contractPreparationTask = defineTask('contract-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare contract and rate confirmation',
  agent: {
    name: 'contract-specialist',
    prompt: {
      role: 'Contract Specialist',
      task: 'Prepare carrier contract and rate confirmation',
      context: args,
      instructions: [
        'Prepare rate confirmation document',
        'Include all terms and conditions',
        'Specify service requirements',
        'Include accessorial charges',
        'Define liability terms',
        'Include insurance requirements',
        'Prepare for carrier signature',
        'Generate contract documents'
      ],
      outputFormat: 'JSON with contract details and document paths'
    },
    outputSchema: {
      type: 'object',
      required: ['contractPath', 'artifacts'],
      properties: {
        contractPath: { type: 'string' },
        rateConfirmationPath: { type: 'string' },
        termsAccepted: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'carrier-selection', 'contract']
}));
