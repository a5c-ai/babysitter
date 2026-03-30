/**
 * @process specializations/domains/business/logistics/cycle-counting
 * @description Systematic inventory counting process with AI-driven count scheduling, variance analysis, and root cause identification to maintain inventory accuracy.
 * @inputs { inventory: array, countingRules?: object, targetAccuracy?: number, historicalCounts?: array }
 * @outputs { success: boolean, countSchedule: array, variances: array, rootCauses: array, accuracyMetrics: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/logistics/cycle-counting', {
 *   inventory: [{ sku: 'SKU001', location: 'A-01-01', systemQty: 100, abcClass: 'A' }],
 *   countingRules: { aItemsPerMonth: 12, bItemsPerMonth: 4, cItemsPerMonth: 1 },
 *   targetAccuracy: 99.5
 * });
 *
 * @references
 * - Inventory Ops: https://www.inventoryops.com/books.htm
 * - APICS Inventory Management: https://www.ascm.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    inventory = [],
    countingRules = {},
    targetAccuracy = 99.0,
    historicalCounts = [],
    countingMethod = 'abc-based', // 'abc-based', 'random', 'control-group', 'location-based'
    outputDir = 'cycle-counting-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Cycle Counting Program Process');
  ctx.log('info', `Inventory items: ${inventory.length}, Method: ${countingMethod}`);

  // ============================================================================
  // PHASE 1: INVENTORY STRATIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Stratifying inventory');

  const stratification = await ctx.task(inventoryStratificationTask, {
    inventory,
    outputDir
  });

  artifacts.push(...stratification.artifacts);

  // ============================================================================
  // PHASE 2: COUNT SCHEDULE GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Generating count schedule');

  const scheduleGeneration = await ctx.task(scheduleGenerationTask, {
    stratifiedInventory: stratification.stratifiedInventory,
    countingRules,
    countingMethod,
    historicalCounts,
    outputDir
  });

  artifacts.push(...scheduleGeneration.artifacts);

  // ============================================================================
  // PHASE 3: COUNT ASSIGNMENT AND WORKLOAD BALANCING
  // ============================================================================

  ctx.log('info', 'Phase 3: Assigning counts and balancing workload');

  const countAssignment = await ctx.task(countAssignmentTask, {
    countSchedule: scheduleGeneration.schedule,
    availableCounters: inputs.availableCounters || [],
    outputDir
  });

  artifacts.push(...countAssignment.artifacts);

  // Quality Gate: Review count schedule
  await ctx.breakpoint({
    question: `Count schedule generated. ${scheduleGeneration.schedule.length} counts planned. Average daily counts: ${countAssignment.averageDailyCounts}. Review schedule?`,
    title: 'Count Schedule Review',
    context: {
      runId: ctx.runId,
      totalCounts: scheduleGeneration.schedule.length,
      countsByClass: scheduleGeneration.countsByClass,
      averageDailyCounts: countAssignment.averageDailyCounts,
      files: scheduleGeneration.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // PHASE 4: COUNT EXECUTION GUIDANCE
  // ============================================================================

  ctx.log('info', 'Phase 4: Providing count execution guidance');

  const countGuidance = await ctx.task(countGuidanceTask, {
    assignedCounts: countAssignment.assignments,
    inventory,
    outputDir
  });

  artifacts.push(...countGuidance.artifacts);

  // ============================================================================
  // PHASE 5: COUNT DATA COLLECTION
  // ============================================================================

  ctx.log('info', 'Phase 5: Collecting count data');

  const countCollection = await ctx.task(countCollectionTask, {
    countInstructions: countGuidance.instructions,
    inventory,
    outputDir
  });

  artifacts.push(...countCollection.artifacts);

  // ============================================================================
  // PHASE 6: VARIANCE CALCULATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Calculating variances');

  const varianceCalculation = await ctx.task(varianceCalculationTask, {
    countResults: countCollection.results,
    inventory,
    outputDir
  });

  artifacts.push(...varianceCalculation.artifacts);

  // ============================================================================
  // PHASE 7: RECOUNT DETERMINATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Determining recounts needed');

  const recountDetermination = await ctx.task(recountDeterminationTask, {
    variances: varianceCalculation.variances,
    countingRules,
    outputDir
  });

  artifacts.push(...recountDetermination.artifacts);

  if (recountDetermination.recountsNeeded.length > 0) {
    ctx.log('info', `${recountDetermination.recountsNeeded.length} items require recount`);
  }

  // ============================================================================
  // PHASE 8: ROOT CAUSE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 8: Analyzing variance root causes');

  const rootCauseAnalysis = await ctx.task(rootCauseAnalysisTask, {
    variances: varianceCalculation.variances,
    historicalCounts,
    inventory,
    outputDir
  });

  artifacts.push(...rootCauseAnalysis.artifacts);

  // Quality Gate: Review significant variances
  if (varianceCalculation.significantVariances.length > 0) {
    await ctx.breakpoint({
      question: `${varianceCalculation.significantVariances.length} significant variances found totaling $${varianceCalculation.totalVarianceValue}. Review root causes?`,
      title: 'Significant Variance Review',
      context: {
        runId: ctx.runId,
        significantVariances: varianceCalculation.significantVariances,
        totalVarianceValue: varianceCalculation.totalVarianceValue,
        rootCauses: rootCauseAnalysis.topRootCauses,
        files: rootCauseAnalysis.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 9: INVENTORY ADJUSTMENT PROCESSING
  // ============================================================================

  ctx.log('info', 'Phase 9: Processing inventory adjustments');

  const adjustmentProcessing = await ctx.task(adjustmentProcessingTask, {
    verifiedVariances: recountDetermination.verifiedVariances,
    rootCauseAnalysis,
    outputDir
  });

  artifacts.push(...adjustmentProcessing.artifacts);

  // ============================================================================
  // PHASE 10: ACCURACY METRICS CALCULATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Calculating accuracy metrics');

  const accuracyMetrics = await ctx.task(accuracyMetricsTask, {
    countResults: countCollection.results,
    variances: varianceCalculation.variances,
    adjustments: adjustmentProcessing.adjustments,
    targetAccuracy,
    outputDir
  });

  artifacts.push(...accuracyMetrics.artifacts);

  // ============================================================================
  // PHASE 11: CORRECTIVE ACTION RECOMMENDATIONS
  // ============================================================================

  ctx.log('info', 'Phase 11: Generating corrective action recommendations');

  const correctiveActions = await ctx.task(correctiveActionsTask, {
    rootCauseAnalysis,
    accuracyMetrics: accuracyMetrics.metrics,
    targetAccuracy,
    outputDir
  });

  artifacts.push(...correctiveActions.artifacts);

  // ============================================================================
  // PHASE 12: CYCLE COUNT REPORTING
  // ============================================================================

  ctx.log('info', 'Phase 12: Generating cycle count report');

  const cycleCountReport = await ctx.task(cycleCountReportTask, {
    countResults: countCollection.results,
    variances: varianceCalculation.variances,
    rootCauseAnalysis,
    accuracyMetrics: accuracyMetrics.metrics,
    correctiveActions: correctiveActions.recommendations,
    outputDir
  });

  artifacts.push(...cycleCountReport.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Cycle counting complete. Accuracy: ${accuracyMetrics.metrics.overallAccuracy}% (Target: ${targetAccuracy}%). ${adjustmentProcessing.adjustments.length} adjustments made. Finalize?`,
    title: 'Cycle Counting Complete',
    context: {
      runId: ctx.runId,
      summary: {
        itemsCounted: countCollection.results.length,
        variancesFound: varianceCalculation.variances.length,
        adjustmentsMade: adjustmentProcessing.adjustments.length,
        overallAccuracy: `${accuracyMetrics.metrics.overallAccuracy}%`,
        targetAccuracy: `${targetAccuracy}%`,
        accuracyMet: accuracyMetrics.metrics.overallAccuracy >= targetAccuracy
      },
      files: [
        { path: cycleCountReport.reportPath, format: 'markdown', label: 'Cycle Count Report' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    countSchedule: scheduleGeneration.schedule,
    variances: varianceCalculation.variances,
    rootCauses: rootCauseAnalysis.rootCauses,
    accuracyMetrics: {
      overallAccuracy: accuracyMetrics.metrics.overallAccuracy,
      unitAccuracy: accuracyMetrics.metrics.unitAccuracy,
      dollarAccuracy: accuracyMetrics.metrics.dollarAccuracy,
      locationAccuracy: accuracyMetrics.metrics.locationAccuracy
    },
    adjustments: adjustmentProcessing.adjustments,
    correctiveActions: correctiveActions.recommendations,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/business/logistics/cycle-counting',
      timestamp: startTime,
      itemsCounted: countCollection.results.length,
      countingMethod,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const inventoryStratificationTask = defineTask('inventory-stratification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Stratify inventory',
  agent: {
    name: 'inventory-stratification-specialist',
    prompt: {
      role: 'Inventory Stratification Specialist',
      task: 'Stratify inventory by value, velocity, and criticality',
      context: args,
      instructions: [
        'Classify inventory by ABC (value)',
        'Classify by XYZ (velocity)',
        'Identify critical items',
        'Flag high-variance items',
        'Identify items with count history issues',
        'Group by storage type',
        'Calculate stratification statistics',
        'Generate stratification report'
      ],
      outputFormat: 'JSON with stratified inventory'
    },
    outputSchema: {
      type: 'object',
      required: ['stratifiedInventory', 'artifacts'],
      properties: {
        stratifiedInventory: { type: 'array' },
        stratificationSummary: { type: 'object' },
        highRiskItems: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'cycle-counting', 'stratification']
}));

export const scheduleGenerationTask = defineTask('schedule-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate count schedule',
  agent: {
    name: 'count-scheduler',
    prompt: {
      role: 'Cycle Count Scheduler',
      task: 'Generate optimal counting schedule',
      context: args,
      instructions: [
        'Apply counting frequency rules by class',
        'Schedule A items more frequently',
        'Distribute counts evenly across period',
        'Consider operational constraints',
        'Avoid peak activity times',
        'Include random samples for control',
        'Generate calendar-based schedule',
        'Balance daily workloads'
      ],
      outputFormat: 'JSON with count schedule'
    },
    outputSchema: {
      type: 'object',
      required: ['schedule', 'countsByClass', 'artifacts'],
      properties: {
        schedule: { type: 'array' },
        countsByClass: { type: 'object' },
        dailyDistribution: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'cycle-counting', 'scheduling']
}));

export const countAssignmentTask = defineTask('count-assignment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assign counts and balance workload',
  agent: {
    name: 'count-assignment-specialist',
    prompt: {
      role: 'Count Assignment Specialist',
      task: 'Assign counts to counters and balance workload',
      context: args,
      instructions: [
        'Assign counts to available personnel',
        'Balance workload across counters',
        'Consider counter skills and certifications',
        'Group counts by location for efficiency',
        'Avoid counter counting own work areas',
        'Schedule blind counts for high-value items',
        'Generate assignment sheets',
        'Calculate expected count times'
      ],
      outputFormat: 'JSON with count assignments'
    },
    outputSchema: {
      type: 'object',
      required: ['assignments', 'averageDailyCounts', 'artifacts'],
      properties: {
        assignments: { type: 'array' },
        averageDailyCounts: { type: 'number' },
        workloadByCounter: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'cycle-counting', 'assignment']
}));

export const countGuidanceTask = defineTask('count-guidance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Provide count execution guidance',
  agent: {
    name: 'count-guidance-specialist',
    prompt: {
      role: 'Count Guidance Specialist',
      task: 'Provide detailed counting instructions',
      context: args,
      instructions: [
        'Generate location-specific instructions',
        'Include unit of measure guidance',
        'Add product identification tips',
        'Include counting best practices',
        'Note special handling requirements',
        'Provide equipment requirements',
        'Include safety guidelines',
        'Generate count sheets'
      ],
      outputFormat: 'JSON with count instructions'
    },
    outputSchema: {
      type: 'object',
      required: ['instructions', 'artifacts'],
      properties: {
        instructions: { type: 'array' },
        countSheets: { type: 'array' },
        equipmentNeeded: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'cycle-counting', 'guidance']
}));

export const countCollectionTask = defineTask('count-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Collect count data',
  agent: {
    name: 'count-collection-specialist',
    prompt: {
      role: 'Count Data Collection Specialist',
      task: 'Collect and validate count data',
      context: args,
      instructions: [
        'Record physical counts',
        'Validate count completeness',
        'Check for obvious errors',
        'Record count timestamps',
        'Document count conditions',
        'Flag items not found',
        'Record counter observations',
        'Compile count results'
      ],
      outputFormat: 'JSON with count results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'artifacts'],
      properties: {
        results: { type: 'array' },
        itemsNotFound: { type: 'array' },
        countObservations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'cycle-counting', 'data-collection']
}));

export const varianceCalculationTask = defineTask('variance-calculation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate variances',
  agent: {
    name: 'variance-calculation-specialist',
    prompt: {
      role: 'Variance Calculation Specialist',
      task: 'Calculate inventory variances',
      context: args,
      instructions: [
        'Compare physical to system quantities',
        'Calculate unit variances',
        'Calculate dollar variances',
        'Identify positive vs negative variances',
        'Flag significant variances',
        'Calculate variance percentages',
        'Summarize by category',
        'Generate variance report'
      ],
      outputFormat: 'JSON with variance calculations'
    },
    outputSchema: {
      type: 'object',
      required: ['variances', 'significantVariances', 'artifacts'],
      properties: {
        variances: { type: 'array' },
        significantVariances: { type: 'array' },
        totalVarianceValue: { type: 'number' },
        varianceSummary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'cycle-counting', 'variance']
}));

export const recountDeterminationTask = defineTask('recount-determination', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Determine recounts needed',
  agent: {
    name: 'recount-specialist',
    prompt: {
      role: 'Recount Determination Specialist',
      task: 'Determine which items need recounting',
      context: args,
      instructions: [
        'Apply recount threshold rules',
        'Flag large variances for recount',
        'Schedule blind recounts',
        'Prioritize high-value recounts',
        'Track recount results',
        'Verify confirmed variances',
        'Document recount decisions',
        'Update variance status'
      ],
      outputFormat: 'JSON with recount determinations'
    },
    outputSchema: {
      type: 'object',
      required: ['recountsNeeded', 'verifiedVariances', 'artifacts'],
      properties: {
        recountsNeeded: { type: 'array' },
        verifiedVariances: { type: 'array' },
        recountResults: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'cycle-counting', 'recount']
}));

export const rootCauseAnalysisTask = defineTask('root-cause-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze variance root causes',
  agent: {
    name: 'root-cause-analyst',
    prompt: {
      role: 'Root Cause Analysis Specialist',
      task: 'Identify root causes of inventory variances',
      context: args,
      instructions: [
        'Analyze variance patterns',
        'Check transaction history',
        'Identify process failures',
        'Look for receiving errors',
        'Check for shipping errors',
        'Identify counting errors',
        'Look for theft indicators',
        'Categorize root causes'
      ],
      outputFormat: 'JSON with root cause analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['rootCauses', 'topRootCauses', 'artifacts'],
      properties: {
        rootCauses: { type: 'array' },
        topRootCauses: { type: 'array' },
        rootCauseDistribution: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'cycle-counting', 'root-cause']
}));

export const adjustmentProcessingTask = defineTask('adjustment-processing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Process inventory adjustments',
  agent: {
    name: 'adjustment-processor',
    prompt: {
      role: 'Inventory Adjustment Specialist',
      task: 'Process inventory adjustments',
      context: args,
      instructions: [
        'Create adjustment transactions',
        'Apply approval workflows',
        'Document adjustment reasons',
        'Update inventory records',
        'Record financial impact',
        'Maintain audit trail',
        'Generate adjustment report',
        'Notify stakeholders'
      ],
      outputFormat: 'JSON with adjustment processing results'
    },
    outputSchema: {
      type: 'object',
      required: ['adjustments', 'artifacts'],
      properties: {
        adjustments: { type: 'array' },
        totalAdjustmentValue: { type: 'number' },
        pendingApprovals: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'cycle-counting', 'adjustments']
}));

export const accuracyMetricsTask = defineTask('accuracy-metrics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate accuracy metrics',
  agent: {
    name: 'accuracy-metrics-specialist',
    prompt: {
      role: 'Accuracy Metrics Specialist',
      task: 'Calculate inventory accuracy metrics',
      context: args,
      instructions: [
        'Calculate SKU accuracy percentage',
        'Calculate unit accuracy',
        'Calculate dollar accuracy',
        'Calculate location accuracy',
        'Compare to target accuracy',
        'Track accuracy trends',
        'Calculate by ABC class',
        'Generate accuracy scorecard'
      ],
      outputFormat: 'JSON with accuracy metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'artifacts'],
      properties: {
        metrics: { type: 'object' },
        accuracyByClass: { type: 'object' },
        accuracyTrend: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'cycle-counting', 'accuracy']
}));

export const correctiveActionsTask = defineTask('corrective-actions', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate corrective actions',
  agent: {
    name: 'corrective-actions-specialist',
    prompt: {
      role: 'Corrective Actions Specialist',
      task: 'Generate corrective action recommendations',
      context: args,
      instructions: [
        'Recommend process improvements',
        'Suggest training needs',
        'Recommend system enhancements',
        'Prioritize by impact',
        'Assign action owners',
        'Set target dates',
        'Define success metrics',
        'Create action plan'
      ],
      outputFormat: 'JSON with corrective action recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'artifacts'],
      properties: {
        recommendations: { type: 'array' },
        priorityActions: { type: 'array' },
        trainingNeeds: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'cycle-counting', 'corrective-actions']
}));

export const cycleCountReportTask = defineTask('cycle-count-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate cycle count report',
  agent: {
    name: 'cycle-count-report-specialist',
    prompt: {
      role: 'Cycle Count Report Specialist',
      task: 'Generate comprehensive cycle count report',
      context: args,
      instructions: [
        'Summarize counting activity',
        'Report on variances',
        'Document root causes',
        'Present accuracy metrics',
        'List corrective actions',
        'Include trend analysis',
        'Provide executive summary',
        'Generate detailed report'
      ],
      outputFormat: 'JSON with report details'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyMetrics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'cycle-counting', 'reporting']
}));
