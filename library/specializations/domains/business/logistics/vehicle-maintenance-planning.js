/**
 * @process specializations/domains/business/logistics/vehicle-maintenance-planning
 * @description Predictive maintenance scheduling based on mileage, hours, sensor data, and historical patterns to maximize fleet uptime and minimize costs.
 * @inputs { vehicles: array, maintenanceHistory: array, sensorData?: array, scheduleConstraints?: object }
 * @outputs { success: boolean, maintenanceSchedule: array, predictedFailures: array, costForecast: object, uptimeMetrics: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/logistics/vehicle-maintenance-planning', {
 *   vehicles: [{ id: 'V001', type: 'tractor', mileage: 150000, lastService: '2024-01-01' }],
 *   maintenanceHistory: [{ vehicleId: 'V001', type: 'oil-change', date: '2024-01-01', cost: 150 }],
 *   sensorData: [{ vehicleId: 'V001', engineTemp: 195, oilPressure: 40 }]
 * });
 *
 * @references
 * - ATA: https://www.trucking.org/
 * - TMC Recommended Practices: https://tmc.trucking.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    vehicles = [],
    maintenanceHistory = [],
    sensorData = [],
    scheduleConstraints = {},
    outputDir = 'vehicle-maintenance-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Vehicle Maintenance Planning Process');
  ctx.log('info', `Vehicles: ${vehicles.length}`);

  // PHASE 1: VEHICLE HEALTH ASSESSMENT
  ctx.log('info', 'Phase 1: Assessing vehicle health');
  const healthAssessment = await ctx.task(vehicleHealthAssessmentTask, { vehicles, sensorData, maintenanceHistory, outputDir });
  artifacts.push(...healthAssessment.artifacts);

  // PHASE 2: PREDICTIVE FAILURE ANALYSIS
  ctx.log('info', 'Phase 2: Analyzing predictive failures');
  const predictiveAnalysis = await ctx.task(predictiveFailureTask, { vehicles, sensorData, maintenanceHistory, outputDir });
  artifacts.push(...predictiveAnalysis.artifacts);

  // Quality Gate: Review critical predictions
  if (predictiveAnalysis.criticalPredictions.length > 0) {
    await ctx.breakpoint({
      question: `${predictiveAnalysis.criticalPredictions.length} vehicles with critical failure predictions. Review and prioritize?`,
      title: 'Critical Failure Predictions',
      context: { runId: ctx.runId, criticalPredictions: predictiveAnalysis.criticalPredictions, files: predictiveAnalysis.artifacts.map(a => ({ path: a.path, format: a.format || 'json' })) }
    });
  }

  // PHASE 3: PREVENTIVE MAINTENANCE SCHEDULING
  ctx.log('info', 'Phase 3: Scheduling preventive maintenance');
  const preventiveScheduling = await ctx.task(preventiveMaintenanceTask, { vehicles, maintenanceHistory, scheduleConstraints, outputDir });
  artifacts.push(...preventiveScheduling.artifacts);

  // PHASE 4: PARTS AND INVENTORY PLANNING
  ctx.log('info', 'Phase 4: Planning parts and inventory');
  const partsPlanning = await ctx.task(partsInventoryTask, { maintenanceSchedule: preventiveScheduling.schedule, outputDir });
  artifacts.push(...partsPlanning.artifacts);

  // PHASE 5: SHOP CAPACITY PLANNING
  ctx.log('info', 'Phase 5: Planning shop capacity');
  const capacityPlanning = await ctx.task(shopCapacityTask, { maintenanceSchedule: preventiveScheduling.schedule, scheduleConstraints, outputDir });
  artifacts.push(...capacityPlanning.artifacts);

  // PHASE 6: COST FORECASTING
  ctx.log('info', 'Phase 6: Forecasting maintenance costs');
  const costForecast = await ctx.task(maintenanceCostTask, { maintenanceSchedule: preventiveScheduling.schedule, partsPlanning, outputDir });
  artifacts.push(...costForecast.artifacts);

  // PHASE 7: UPTIME OPTIMIZATION
  ctx.log('info', 'Phase 7: Optimizing fleet uptime');
  const uptimeOptimization = await ctx.task(uptimeOptimizationTask, { maintenanceSchedule: preventiveScheduling.schedule, vehicles, outputDir });
  artifacts.push(...uptimeOptimization.artifacts);

  // PHASE 8: GENERATE MAINTENANCE REPORT
  ctx.log('info', 'Phase 8: Generating maintenance report');
  const maintenanceReport = await ctx.task(maintenanceReportTask, { healthAssessment, predictiveAnalysis, preventiveScheduling, costForecast, uptimeOptimization, outputDir });
  artifacts.push(...maintenanceReport.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Maintenance planning complete. ${preventiveScheduling.schedule.length} maintenance events scheduled. Expected uptime: ${uptimeOptimization.expectedUptime}%. Approve schedule?`,
    title: 'Vehicle Maintenance Planning Complete',
    context: {
      runId: ctx.runId,
      summary: { vehiclesAnalyzed: vehicles.length, maintenanceEvents: preventiveScheduling.schedule.length, forecastedCost: `$${costForecast.totalCost}`, expectedUptime: `${uptimeOptimization.expectedUptime}%` },
      files: [{ path: maintenanceReport.reportPath, format: 'markdown', label: 'Maintenance Report' }]
    }
  });

  const endTime = ctx.now();
  return {
    success: true,
    maintenanceSchedule: preventiveScheduling.schedule,
    predictedFailures: predictiveAnalysis.predictions,
    costForecast: costForecast.forecast,
    uptimeMetrics: uptimeOptimization.metrics,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/domains/business/logistics/vehicle-maintenance-planning', timestamp: startTime, outputDir }
  };
}

// TASK DEFINITIONS
export const vehicleHealthAssessmentTask = defineTask('vehicle-health-assessment', (args, taskCtx) => ({
  kind: 'agent', title: 'Assess vehicle health', agent: { name: 'vehicle-health-specialist', prompt: { role: 'Vehicle Health Assessment Specialist', task: 'Assess current health status of fleet vehicles', context: args, instructions: ['Analyze sensor data', 'Review maintenance history', 'Calculate health scores', 'Identify deterioration', 'Flag critical issues', 'Generate health report'] }, outputSchema: { type: 'object', required: ['healthScores', 'artifacts'], properties: { healthScores: { type: 'array' }, criticalIssues: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'fleet-management', 'health-assessment']
}));

export const predictiveFailureTask = defineTask('predictive-failure', (args, taskCtx) => ({
  kind: 'agent', title: 'Analyze predictive failures', agent: { name: 'predictive-maintenance-specialist', prompt: { role: 'Predictive Maintenance Specialist', task: 'Predict potential vehicle failures', context: args, instructions: ['Apply ML models', 'Analyze failure patterns', 'Calculate failure probabilities', 'Estimate time to failure', 'Prioritize by risk', 'Generate prediction report'] }, outputSchema: { type: 'object', required: ['predictions', 'criticalPredictions', 'artifacts'], properties: { predictions: { type: 'array' }, criticalPredictions: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'fleet-management', 'predictive']
}));

export const preventiveMaintenanceTask = defineTask('preventive-maintenance', (args, taskCtx) => ({
  kind: 'agent', title: 'Schedule preventive maintenance', agent: { name: 'preventive-maintenance-planner', prompt: { role: 'Preventive Maintenance Planner', task: 'Schedule preventive maintenance for fleet', context: args, instructions: ['Apply OEM schedules', 'Consider mileage triggers', 'Factor in hour meters', 'Balance with operations', 'Optimize schedule', 'Generate maintenance calendar'] }, outputSchema: { type: 'object', required: ['schedule', 'artifacts'], properties: { schedule: { type: 'array' }, scheduleSummary: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'fleet-management', 'preventive']
}));

export const partsInventoryTask = defineTask('parts-inventory', (args, taskCtx) => ({
  kind: 'agent', title: 'Plan parts and inventory', agent: { name: 'parts-planning-specialist', prompt: { role: 'Parts Planning Specialist', task: 'Plan parts inventory for maintenance schedule', context: args, instructions: ['Identify required parts', 'Check inventory levels', 'Order requirements', 'Estimate lead times', 'Plan stock levels', 'Generate parts plan'] }, outputSchema: { type: 'object', required: ['partsPlan', 'artifacts'], properties: { partsPlan: { type: 'array' }, orderRequirements: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'fleet-management', 'parts']
}));

export const shopCapacityTask = defineTask('shop-capacity', (args, taskCtx) => ({
  kind: 'agent', title: 'Plan shop capacity', agent: { name: 'shop-capacity-planner', prompt: { role: 'Shop Capacity Planner', task: 'Plan maintenance shop capacity', context: args, instructions: ['Analyze capacity requirements', 'Schedule bay utilization', 'Plan technician assignments', 'Handle conflicts', 'Optimize throughput', 'Generate capacity plan'] }, outputSchema: { type: 'object', required: ['capacityPlan', 'artifacts'], properties: { capacityPlan: { type: 'object' }, utilization: { type: 'number' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'fleet-management', 'capacity']
}));

export const maintenanceCostTask = defineTask('maintenance-cost', (args, taskCtx) => ({
  kind: 'agent', title: 'Forecast maintenance costs', agent: { name: 'maintenance-cost-analyst', prompt: { role: 'Maintenance Cost Analyst', task: 'Forecast maintenance costs', context: args, instructions: ['Calculate parts costs', 'Estimate labor costs', 'Include overhead', 'Project by period', 'Compare to budget', 'Generate cost forecast'] }, outputSchema: { type: 'object', required: ['forecast', 'totalCost', 'artifacts'], properties: { forecast: { type: 'object' }, totalCost: { type: 'number' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'fleet-management', 'cost']
}));

export const uptimeOptimizationTask = defineTask('uptime-optimization', (args, taskCtx) => ({
  kind: 'agent', title: 'Optimize fleet uptime', agent: { name: 'uptime-optimizer', prompt: { role: 'Fleet Uptime Optimizer', task: 'Optimize fleet uptime through maintenance scheduling', context: args, instructions: ['Calculate expected uptime', 'Minimize downtime impact', 'Schedule during low-demand', 'Plan backup capacity', 'Track availability', 'Generate uptime report'] }, outputSchema: { type: 'object', required: ['expectedUptime', 'metrics', 'artifacts'], properties: { expectedUptime: { type: 'number' }, metrics: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'fleet-management', 'uptime']
}));

export const maintenanceReportTask = defineTask('maintenance-report', (args, taskCtx) => ({
  kind: 'agent', title: 'Generate maintenance report', agent: { name: 'maintenance-report-specialist', prompt: { role: 'Maintenance Report Specialist', task: 'Generate comprehensive maintenance planning report', context: args, instructions: ['Summarize health status', 'Present predictions', 'Document schedule', 'Include cost forecast', 'Present uptime metrics', 'Generate executive report'] }, outputSchema: { type: 'object', required: ['reportPath', 'artifacts'], properties: { reportPath: { type: 'string' }, executiveSummary: { type: 'string' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'fleet-management', 'reporting']
}));
