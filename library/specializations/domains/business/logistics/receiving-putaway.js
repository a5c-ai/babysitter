/**
 * @process specializations/domains/business/logistics/receiving-putaway
 * @description Streamlined inbound operations with dock scheduling, receipt validation, and optimized putaway location assignment.
 * @inputs { inboundShipments: array, dockSchedule?: object, warehouseLayout: object, putawayRules?: array }
 * @outputs { success: boolean, receipts: array, putawayTasks: array, dockUtilization: object, performanceMetrics: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/logistics/receiving-putaway', {
 *   inboundShipments: [{ asnId: 'ASN001', carrier: 'Carrier1', expectedItems: 100, appointmentTime: '09:00' }],
 *   warehouseLayout: { zones: ['A', 'B', 'C'], docks: 10 }
 * });
 *
 * @references
 * - Warehouse Management: https://www.koganpage.com/logistics-operations-management/warehouse-management-9781398614697
 * - WERC: https://www.werc.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    inboundShipments = [],
    dockSchedule = {},
    warehouseLayout,
    putawayRules = [],
    outputDir = 'receiving-putaway-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Receiving and Putaway Optimization Process');
  ctx.log('info', `Inbound shipments: ${inboundShipments.length}`);

  // PHASE 1: ASN PROCESSING AND VALIDATION
  ctx.log('info', 'Phase 1: Processing ASN data');
  const asnProcessing = await ctx.task(asnProcessingTask, { inboundShipments, outputDir });
  artifacts.push(...asnProcessing.artifacts);

  // PHASE 2: DOCK DOOR SCHEDULING
  ctx.log('info', 'Phase 2: Scheduling dock doors');
  const dockScheduling = await ctx.task(dockSchedulingTask, {
    validatedASNs: asnProcessing.validatedASNs,
    dockSchedule,
    warehouseLayout,
    outputDir
  });
  artifacts.push(...dockScheduling.artifacts);

  // PHASE 3: RECEIVING PREPARATION
  ctx.log('info', 'Phase 3: Preparing receiving');
  const receivingPrep = await ctx.task(receivingPrepTask, {
    scheduledShipments: dockScheduling.scheduledShipments,
    outputDir
  });
  artifacts.push(...receivingPrep.artifacts);

  // PHASE 4: RECEIPT VALIDATION AND INSPECTION
  ctx.log('info', 'Phase 4: Validating receipts');
  const receiptValidation = await ctx.task(receiptValidationTask, {
    receivingTasks: receivingPrep.tasks,
    inboundShipments,
    outputDir
  });
  artifacts.push(...receiptValidation.artifacts);

  // Quality Gate: Review discrepancies
  if (receiptValidation.discrepancies.length > 0) {
    await ctx.breakpoint({
      question: `${receiptValidation.discrepancies.length} receiving discrepancies found. Review before putaway?`,
      title: 'Receiving Discrepancy Review',
      context: {
        runId: ctx.runId,
        discrepancies: receiptValidation.discrepancies,
        files: receiptValidation.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // PHASE 5: PUTAWAY LOCATION OPTIMIZATION
  ctx.log('info', 'Phase 5: Optimizing putaway locations');
  const putawayOptimization = await ctx.task(putawayOptimizationTask, {
    receivedItems: receiptValidation.receivedItems,
    warehouseLayout,
    putawayRules,
    outputDir
  });
  artifacts.push(...putawayOptimization.artifacts);

  // PHASE 6: PUTAWAY TASK GENERATION
  ctx.log('info', 'Phase 6: Generating putaway tasks');
  const putawayTaskGeneration = await ctx.task(putawayTaskGenerationTask, {
    optimizedLocations: putawayOptimization.locations,
    outputDir
  });
  artifacts.push(...putawayTaskGeneration.artifacts);

  // PHASE 7: PUTAWAY EXECUTION
  ctx.log('info', 'Phase 7: Executing putaway');
  const putawayExecution = await ctx.task(putawayExecutionTask, {
    putawayTasks: putawayTaskGeneration.tasks,
    outputDir
  });
  artifacts.push(...putawayExecution.artifacts);

  // PHASE 8: PERFORMANCE REPORTING
  ctx.log('info', 'Phase 8: Generating performance report');
  const performanceReport = await ctx.task(receivingPerformanceTask, {
    receipts: receiptValidation.receipts,
    putawayResults: putawayExecution.results,
    dockUtilization: dockScheduling.utilization,
    outputDir
  });
  artifacts.push(...performanceReport.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Receiving complete. ${receiptValidation.receipts.length} receipts processed, ${putawayExecution.completedTasks} putaway tasks completed. Finalize?`,
    title: 'Receiving and Putaway Complete',
    context: {
      runId: ctx.runId,
      summary: {
        shipmentsReceived: receiptValidation.receipts.length,
        itemsReceived: receiptValidation.totalItems,
        putawayTasksCompleted: putawayExecution.completedTasks,
        dockUtilization: `${dockScheduling.utilization.average}%`
      },
      files: [{ path: performanceReport.reportPath, format: 'markdown', label: 'Performance Report' }]
    }
  });

  const endTime = ctx.now();
  return {
    success: true,
    receipts: receiptValidation.receipts,
    putawayTasks: putawayTaskGeneration.tasks,
    dockUtilization: dockScheduling.utilization,
    performanceMetrics: performanceReport.metrics,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/domains/business/logistics/receiving-putaway', timestamp: startTime, outputDir }
  };
}

// TASK DEFINITIONS
export const asnProcessingTask = defineTask('asn-processing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Process ASN data',
  agent: {
    name: 'asn-processor',
    prompt: {
      role: 'ASN Processing Specialist',
      task: 'Validate and process Advance Ship Notices',
      context: args,
      instructions: ['Parse ASN data', 'Validate expected quantities', 'Check PO references', 'Identify missing ASNs', 'Flag compliance issues', 'Generate ASN summary']
    },
    outputSchema: { type: 'object', required: ['validatedASNs', 'artifacts'], properties: { validatedASNs: { type: 'array' }, asnIssues: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'logistics', 'receiving', 'asn']
}));

export const dockSchedulingTask = defineTask('dock-scheduling', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Schedule dock doors',
  agent: {
    name: 'dock-scheduler',
    prompt: {
      role: 'Dock Scheduling Specialist',
      task: 'Optimize dock door assignments and schedules',
      context: args,
      instructions: ['Assign dock doors to shipments', 'Balance dock utilization', 'Consider trailer types', 'Minimize wait times', 'Handle conflicts', 'Generate dock schedule']
    },
    outputSchema: { type: 'object', required: ['scheduledShipments', 'utilization', 'artifacts'], properties: { scheduledShipments: { type: 'array' }, utilization: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'logistics', 'receiving', 'dock-scheduling']
}));

export const receivingPrepTask = defineTask('receiving-prep', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare receiving',
  agent: {
    name: 'receiving-prep-specialist',
    prompt: {
      role: 'Receiving Preparation Specialist',
      task: 'Prepare equipment and personnel for receiving',
      context: args,
      instructions: ['Assign receiving personnel', 'Prepare equipment', 'Print receiving documents', 'Set up staging areas', 'Coordinate with QC', 'Generate prep checklist']
    },
    outputSchema: { type: 'object', required: ['tasks', 'artifacts'], properties: { tasks: { type: 'array' }, equipmentNeeded: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'logistics', 'receiving', 'preparation']
}));

export const receiptValidationTask = defineTask('receipt-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate receipts',
  agent: {
    name: 'receipt-validator',
    prompt: {
      role: 'Receipt Validation Specialist',
      task: 'Validate received goods against ASN and PO',
      context: args,
      instructions: ['Count received items', 'Verify SKUs and quantities', 'Inspect for damage', 'Record variances', 'Handle overages/shortages', 'Generate receipt documents']
    },
    outputSchema: { type: 'object', required: ['receipts', 'receivedItems', 'discrepancies', 'artifacts'], properties: { receipts: { type: 'array' }, receivedItems: { type: 'array' }, discrepancies: { type: 'array' }, totalItems: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'logistics', 'receiving', 'validation']
}));

export const putawayOptimizationTask = defineTask('putaway-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Optimize putaway locations',
  agent: {
    name: 'putaway-optimizer',
    prompt: {
      role: 'Putaway Optimization Specialist',
      task: 'Determine optimal putaway locations',
      context: args,
      instructions: ['Apply slotting rules', 'Check location availability', 'Consider product velocity', 'Optimize travel distance', 'Respect storage constraints', 'Generate location assignments']
    },
    outputSchema: { type: 'object', required: ['locations', 'artifacts'], properties: { locations: { type: 'array' }, travelDistanceOptimized: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'logistics', 'receiving', 'putaway-optimization']
}));

export const putawayTaskGenerationTask = defineTask('putaway-task-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate putaway tasks',
  agent: {
    name: 'putaway-task-generator',
    prompt: {
      role: 'Putaway Task Generation Specialist',
      task: 'Generate putaway tasks for warehouse personnel',
      context: args,
      instructions: ['Create putaway tasks', 'Assign to operators', 'Sequence for efficiency', 'Include handling instructions', 'Generate task lists', 'Track task status']
    },
    outputSchema: { type: 'object', required: ['tasks', 'artifacts'], properties: { tasks: { type: 'array' }, taskSummary: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'logistics', 'receiving', 'putaway-tasks']
}));

export const putawayExecutionTask = defineTask('putaway-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Execute putaway',
  agent: {
    name: 'putaway-executor',
    prompt: {
      role: 'Putaway Execution Specialist',
      task: 'Execute and confirm putaway tasks',
      context: args,
      instructions: ['Track putaway progress', 'Confirm location placement', 'Handle exceptions', 'Update inventory', 'Record completion times', 'Generate completion report']
    },
    outputSchema: { type: 'object', required: ['results', 'completedTasks', 'artifacts'], properties: { results: { type: 'array' }, completedTasks: { type: 'number' }, exceptions: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'logistics', 'receiving', 'putaway-execution']
}));

export const receivingPerformanceTask = defineTask('receiving-performance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate performance report',
  agent: {
    name: 'performance-analyst',
    prompt: {
      role: 'Receiving Performance Analyst',
      task: 'Calculate receiving and putaway performance metrics',
      context: args,
      instructions: ['Calculate dock-to-stock time', 'Measure receipt accuracy', 'Calculate putaway productivity', 'Analyze dock utilization', 'Compare to benchmarks', 'Generate performance report']
    },
    outputSchema: { type: 'object', required: ['metrics', 'reportPath', 'artifacts'], properties: { metrics: { type: 'object' }, reportPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'logistics', 'receiving', 'performance']
}));
