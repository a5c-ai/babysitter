/**
 * @process specializations/domains/business/logistics/cross-docking-operations
 * @description Flow-through logistics process design and execution to minimize storage time and accelerate product movement from inbound to outbound.
 * @inputs { inboundShipments: array, outboundOrders: array, dockConfig: object, timeConstraints?: object }
 * @outputs { success: boolean, crossDockPlan: array, dockSchedule: object, throughputMetrics: object, exceptions: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/logistics/cross-docking-operations', {
 *   inboundShipments: [{ id: 'IN001', arrivalTime: '08:00', pallets: 10 }],
 *   outboundOrders: [{ id: 'OUT001', shipTime: '14:00', pallets: 5 }],
 *   dockConfig: { inboundDocks: 5, outboundDocks: 10 }
 * });
 *
 * @references
 * - Logistics Handbook: https://www.koganpage.com/logistics-operations-management/the-handbook-of-logistics-and-distribution-management-9781398600744
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    inboundShipments = [],
    outboundOrders = [],
    dockConfig,
    timeConstraints = {},
    outputDir = 'cross-docking-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Cross-Docking Operations Process');
  ctx.log('info', `Inbound: ${inboundShipments.length}, Outbound: ${outboundOrders.length}`);

  // PHASE 1: INBOUND SHIPMENT ANALYSIS
  ctx.log('info', 'Phase 1: Analyzing inbound shipments');
  const inboundAnalysis = await ctx.task(inboundAnalysisTask, { inboundShipments, outputDir });
  artifacts.push(...inboundAnalysis.artifacts);

  // PHASE 2: OUTBOUND ORDER MATCHING
  ctx.log('info', 'Phase 2: Matching outbound orders');
  const orderMatching = await ctx.task(orderMatchingTask, { inboundAnalysis, outboundOrders, outputDir });
  artifacts.push(...orderMatching.artifacts);

  // PHASE 3: DOCK DOOR SCHEDULING
  ctx.log('info', 'Phase 3: Scheduling dock doors');
  const dockScheduling = await ctx.task(crossDockSchedulingTask, { inboundShipments, outboundOrders, dockConfig, timeConstraints, outputDir });
  artifacts.push(...dockScheduling.artifacts);

  // PHASE 4: FLOW-THROUGH OPTIMIZATION
  ctx.log('info', 'Phase 4: Optimizing flow-through');
  const flowOptimization = await ctx.task(flowThroughOptimizationTask, { dockSchedule: dockScheduling.schedule, orderMatching, outputDir });
  artifacts.push(...flowOptimization.artifacts);

  // Quality Gate: Review cross-dock plan
  await ctx.breakpoint({
    question: `Cross-dock plan generated. ${flowOptimization.flowThroughRate}% flow-through rate. Dock utilization: ${dockScheduling.utilization}%. Review plan?`,
    title: 'Cross-Dock Plan Review',
    context: {
      runId: ctx.runId,
      summary: { flowThroughRate: flowOptimization.flowThroughRate, dockUtilization: dockScheduling.utilization },
      files: flowOptimization.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // PHASE 5: STAGING AND SORTING PLAN
  ctx.log('info', 'Phase 5: Creating staging and sorting plan');
  const stagingPlan = await ctx.task(stagingSortingTask, { flowPlan: flowOptimization.plan, dockConfig, outputDir });
  artifacts.push(...stagingPlan.artifacts);

  // PHASE 6: LABOR ASSIGNMENT
  ctx.log('info', 'Phase 6: Assigning labor');
  const laborAssignment = await ctx.task(crossDockLaborTask, { stagingPlan, dockSchedule: dockScheduling.schedule, outputDir });
  artifacts.push(...laborAssignment.artifacts);

  // PHASE 7: EXECUTION MONITORING
  ctx.log('info', 'Phase 7: Setting up execution monitoring');
  const executionMonitoring = await ctx.task(crossDockMonitoringTask, { crossDockPlan: flowOptimization.plan, outputDir });
  artifacts.push(...executionMonitoring.artifacts);

  // PHASE 8: PERFORMANCE REPORTING
  ctx.log('info', 'Phase 8: Generating performance report');
  const performanceReport = await ctx.task(crossDockPerformanceTask, { flowOptimization, dockScheduling, laborAssignment, outputDir });
  artifacts.push(...performanceReport.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Cross-docking operations planned. Throughput: ${flowOptimization.throughput} pallets/hour. Flow-through: ${flowOptimization.flowThroughRate}%. Approve plan?`,
    title: 'Cross-Docking Operations Complete',
    context: {
      runId: ctx.runId,
      summary: {
        inboundShipments: inboundShipments.length,
        outboundOrders: outboundOrders.length,
        flowThroughRate: `${flowOptimization.flowThroughRate}%`,
        throughput: `${flowOptimization.throughput} pallets/hour`
      },
      files: [{ path: performanceReport.reportPath, format: 'markdown', label: 'Performance Report' }]
    }
  });

  const endTime = ctx.now();
  return {
    success: true,
    crossDockPlan: flowOptimization.plan,
    dockSchedule: dockScheduling.schedule,
    throughputMetrics: performanceReport.metrics,
    exceptions: orderMatching.exceptions,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/domains/business/logistics/cross-docking-operations', timestamp: startTime, outputDir }
  };
}

// TASK DEFINITIONS
export const inboundAnalysisTask = defineTask('inbound-analysis', (args, taskCtx) => ({
  kind: 'agent', title: 'Analyze inbound shipments', agent: { name: 'inbound-analyst', prompt: { role: 'Inbound Analysis Specialist', task: 'Analyze inbound shipments for cross-docking', context: args, instructions: ['Parse shipment details', 'Identify cross-dock eligible items', 'Calculate arrival windows', 'Assess handling requirements', 'Flag pre-sorted shipments', 'Generate inbound analysis'] }, outputSchema: { type: 'object', required: ['analysis', 'artifacts'], properties: { analysis: { type: 'array' }, crossDockEligible: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'cross-docking', 'inbound']
}));

export const orderMatchingTask = defineTask('order-matching', (args, taskCtx) => ({
  kind: 'agent', title: 'Match outbound orders', agent: { name: 'order-matching-specialist', prompt: { role: 'Order Matching Specialist', task: 'Match inbound products to outbound orders', context: args, instructions: ['Match SKUs to orders', 'Validate quantities', 'Identify shortages', 'Plan consolidation', 'Flag exceptions', 'Generate matching report'] }, outputSchema: { type: 'object', required: ['matches', 'exceptions', 'artifacts'], properties: { matches: { type: 'array' }, exceptions: { type: 'array' }, shortages: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'cross-docking', 'matching']
}));

export const crossDockSchedulingTask = defineTask('cross-dock-scheduling', (args, taskCtx) => ({
  kind: 'agent', title: 'Schedule dock doors', agent: { name: 'cross-dock-scheduler', prompt: { role: 'Cross-Dock Scheduling Specialist', task: 'Schedule dock doors for cross-docking operations', context: args, instructions: ['Assign inbound docks', 'Assign outbound docks', 'Minimize dwell time', 'Balance dock loads', 'Respect time windows', 'Generate dock schedule'] }, outputSchema: { type: 'object', required: ['schedule', 'utilization', 'artifacts'], properties: { schedule: { type: 'object' }, utilization: { type: 'number' }, conflicts: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'cross-docking', 'scheduling']
}));

export const flowThroughOptimizationTask = defineTask('flow-through-optimization', (args, taskCtx) => ({
  kind: 'agent', title: 'Optimize flow-through', agent: { name: 'flow-through-optimizer', prompt: { role: 'Flow-Through Optimization Specialist', task: 'Optimize product flow through cross-dock', context: args, instructions: ['Design flow paths', 'Minimize handling touches', 'Optimize staging positions', 'Calculate throughput', 'Identify bottlenecks', 'Generate flow plan'] }, outputSchema: { type: 'object', required: ['plan', 'flowThroughRate', 'throughput', 'artifacts'], properties: { plan: { type: 'array' }, flowThroughRate: { type: 'number' }, throughput: { type: 'number' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'cross-docking', 'flow-through']
}));

export const stagingSortingTask = defineTask('staging-sorting', (args, taskCtx) => ({
  kind: 'agent', title: 'Create staging and sorting plan', agent: { name: 'staging-specialist', prompt: { role: 'Staging and Sorting Specialist', task: 'Plan staging areas and sorting operations', context: args, instructions: ['Assign staging lanes', 'Plan sorting sequences', 'Allocate floor space', 'Optimize consolidation', 'Generate staging plan', 'Create sorting instructions'] }, outputSchema: { type: 'object', required: ['stagingPlan', 'artifacts'], properties: { stagingPlan: { type: 'array' }, sortingInstructions: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'cross-docking', 'staging']
}));

export const crossDockLaborTask = defineTask('cross-dock-labor', (args, taskCtx) => ({
  kind: 'agent', title: 'Assign labor', agent: { name: 'cross-dock-labor-planner', prompt: { role: 'Cross-Dock Labor Planner', task: 'Assign labor for cross-docking operations', context: args, instructions: ['Calculate labor requirements', 'Assign to tasks', 'Balance workloads', 'Plan breaks', 'Handle peak periods', 'Generate labor schedule'] }, outputSchema: { type: 'object', required: ['assignments', 'artifacts'], properties: { assignments: { type: 'array' }, laborHours: { type: 'number' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'cross-docking', 'labor']
}));

export const crossDockMonitoringTask = defineTask('cross-dock-monitoring', (args, taskCtx) => ({
  kind: 'agent', title: 'Set up execution monitoring', agent: { name: 'cross-dock-monitor', prompt: { role: 'Cross-Dock Monitoring Specialist', task: 'Set up real-time execution monitoring', context: args, instructions: ['Define KPIs', 'Set alert thresholds', 'Create dashboard', 'Plan exception handling', 'Generate monitoring plan', 'Document procedures'] }, outputSchema: { type: 'object', required: ['monitoringPlan', 'artifacts'], properties: { monitoringPlan: { type: 'object' }, kpis: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'cross-docking', 'monitoring']
}));

export const crossDockPerformanceTask = defineTask('cross-dock-performance', (args, taskCtx) => ({
  kind: 'agent', title: 'Generate performance report', agent: { name: 'cross-dock-performance-analyst', prompt: { role: 'Cross-Dock Performance Analyst', task: 'Generate cross-docking performance report', context: args, instructions: ['Calculate throughput metrics', 'Measure flow-through rate', 'Analyze dock utilization', 'Report labor productivity', 'Identify improvements', 'Generate performance report'] }, outputSchema: { type: 'object', required: ['metrics', 'reportPath', 'artifacts'], properties: { metrics: { type: 'object' }, reportPath: { type: 'string' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'cross-docking', 'performance']
}));
