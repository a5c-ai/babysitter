/**
 * @process specializations/domains/business/logistics/driver-scheduling-compliance
 * @description Automated driver assignment, hours of service compliance monitoring, and schedule optimization to ensure regulatory compliance and efficiency.
 * @inputs { drivers: array, routes: array, hosRules?: object, scheduleConstraints?: object }
 * @outputs { success: boolean, driverSchedule: array, complianceStatus: object, violations: array, optimizationMetrics: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/logistics/driver-scheduling-compliance', {
 *   drivers: [{ id: 'D001', hoursAvailable: 10, currentCycle: 55 }],
 *   routes: [{ id: 'R001', estimatedHours: 8, startLocation: 'Chicago' }],
 *   hosRules: { maxDrivingHours: 11, maxDutyHours: 14, requiredBreak: 30 }
 * });
 *
 * @references
 * - FMCSA Regulations: https://www.fmcsa.dot.gov/regulations
 * - ELD Compliance: https://www.fmcsa.dot.gov/hours-service/elds
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    drivers = [],
    routes = [],
    hosRules = {},
    scheduleConstraints = {},
    outputDir = 'driver-scheduling-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Driver Scheduling and Compliance Process');
  ctx.log('info', `Drivers: ${drivers.length}, Routes: ${routes.length}`);

  // PHASE 1: DRIVER AVAILABILITY ANALYSIS
  ctx.log('info', 'Phase 1: Analyzing driver availability');
  const availabilityAnalysis = await ctx.task(driverAvailabilityTask, { drivers, hosRules, outputDir });
  artifacts.push(...availabilityAnalysis.artifacts);

  // PHASE 2: HOS STATUS CALCULATION
  ctx.log('info', 'Phase 2: Calculating HOS status');
  const hosCalculation = await ctx.task(hosStatusTask, { drivers, hosRules, outputDir });
  artifacts.push(...hosCalculation.artifacts);

  // PHASE 3: ROUTE-DRIVER MATCHING
  ctx.log('info', 'Phase 3: Matching routes to drivers');
  const routeMatching = await ctx.task(routeDriverMatchingTask, { drivers, routes, availabilityAnalysis, hosCalculation, outputDir });
  artifacts.push(...routeMatching.artifacts);

  // PHASE 4: COMPLIANCE VALIDATION
  ctx.log('info', 'Phase 4: Validating compliance');
  const complianceValidation = await ctx.task(complianceValidationTask, { schedule: routeMatching.schedule, hosRules, outputDir });
  artifacts.push(...complianceValidation.artifacts);

  // Quality Gate: Review compliance issues
  if (complianceValidation.violations.length > 0) {
    await ctx.breakpoint({
      question: `${complianceValidation.violations.length} potential HOS violations detected. Review and adjust schedule?`,
      title: 'HOS Compliance Review',
      context: { runId: ctx.runId, violations: complianceValidation.violations, files: complianceValidation.artifacts.map(a => ({ path: a.path, format: a.format || 'json' })) }
    });
  }

  // PHASE 5: BREAK AND REST PLANNING
  ctx.log('info', 'Phase 5: Planning breaks and rest periods');
  const breakPlanning = await ctx.task(breakRestPlanningTask, { schedule: routeMatching.schedule, hosRules, outputDir });
  artifacts.push(...breakPlanning.artifacts);

  // PHASE 6: SCHEDULE OPTIMIZATION
  ctx.log('info', 'Phase 6: Optimizing schedule');
  const scheduleOptimization = await ctx.task(scheduleOptimizationTask, { schedule: breakPlanning.scheduledWithBreaks, drivers, routes, outputDir });
  artifacts.push(...scheduleOptimization.artifacts);

  // PHASE 7: ELD INTEGRATION PREPARATION
  ctx.log('info', 'Phase 7: Preparing ELD integration');
  const eldIntegration = await ctx.task(eldIntegrationTask, { optimizedSchedule: scheduleOptimization.optimizedSchedule, drivers, outputDir });
  artifacts.push(...eldIntegration.artifacts);

  // PHASE 8: COMPLIANCE REPORTING
  ctx.log('info', 'Phase 8: Generating compliance report');
  const complianceReport = await ctx.task(complianceReportTask, { scheduleOptimization, complianceValidation, hosCalculation, outputDir });
  artifacts.push(...complianceReport.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Driver scheduling complete. ${scheduleOptimization.optimizedSchedule.length} assignments made. Compliance rate: ${complianceValidation.complianceRate}%. Approve schedule?`,
    title: 'Driver Scheduling Complete',
    context: {
      runId: ctx.runId,
      summary: { driversScheduled: scheduleOptimization.driversAssigned, routesCovered: scheduleOptimization.routesCovered, complianceRate: `${complianceValidation.complianceRate}%`, utilizationRate: `${scheduleOptimization.utilizationRate}%` },
      files: [{ path: complianceReport.reportPath, format: 'markdown', label: 'Compliance Report' }]
    }
  });

  const endTime = ctx.now();
  return {
    success: true,
    driverSchedule: scheduleOptimization.optimizedSchedule,
    complianceStatus: complianceValidation.status,
    violations: complianceValidation.violations,
    optimizationMetrics: scheduleOptimization.metrics,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/domains/business/logistics/driver-scheduling-compliance', timestamp: startTime, outputDir }
  };
}

// TASK DEFINITIONS
export const driverAvailabilityTask = defineTask('driver-availability', (args, taskCtx) => ({
  kind: 'agent', title: 'Analyze driver availability', agent: { name: 'driver-availability-analyst', prompt: { role: 'Driver Availability Analyst', task: 'Analyze driver availability and constraints', context: args, instructions: ['Check driver status', 'Review home time requirements', 'Check certifications', 'Identify restrictions', 'Calculate available hours', 'Generate availability report'] }, outputSchema: { type: 'object', required: ['availability', 'artifacts'], properties: { availability: { type: 'array' }, restrictions: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'driver-scheduling', 'availability']
}));

export const hosStatusTask = defineTask('hos-status', (args, taskCtx) => ({
  kind: 'agent', title: 'Calculate HOS status', agent: { name: 'hos-status-specialist', prompt: { role: 'HOS Status Specialist', task: 'Calculate current HOS status for all drivers', context: args, instructions: ['Calculate driving hours remaining', 'Calculate duty hours remaining', 'Check 70-hour/8-day cycle', 'Calculate reset requirements', 'Identify clock warnings', 'Generate HOS status report'] }, outputSchema: { type: 'object', required: ['hosStatus', 'artifacts'], properties: { hosStatus: { type: 'array' }, warnings: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'driver-scheduling', 'hos']
}));

export const routeDriverMatchingTask = defineTask('route-driver-matching', (args, taskCtx) => ({
  kind: 'agent', title: 'Match routes to drivers', agent: { name: 'route-matching-specialist', prompt: { role: 'Route-Driver Matching Specialist', task: 'Match routes to available drivers', context: args, instructions: ['Match skills and equipment', 'Consider domicile locations', 'Respect HOS constraints', 'Balance workloads', 'Optimize assignments', 'Generate assignment schedule'] }, outputSchema: { type: 'object', required: ['schedule', 'artifacts'], properties: { schedule: { type: 'array' }, unassignedRoutes: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'driver-scheduling', 'matching']
}));

export const complianceValidationTask = defineTask('compliance-validation', (args, taskCtx) => ({
  kind: 'agent', title: 'Validate compliance', agent: { name: 'compliance-validator', prompt: { role: 'HOS Compliance Validator', task: 'Validate schedule compliance with HOS rules', context: args, instructions: ['Check 11-hour driving rule', 'Check 14-hour duty rule', 'Verify 30-minute break', 'Check weekly limits', 'Identify violations', 'Calculate compliance rate'] }, outputSchema: { type: 'object', required: ['status', 'violations', 'complianceRate', 'artifacts'], properties: { status: { type: 'object' }, violations: { type: 'array' }, complianceRate: { type: 'number' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'driver-scheduling', 'compliance']
}));

export const breakRestPlanningTask = defineTask('break-rest-planning', (args, taskCtx) => ({
  kind: 'agent', title: 'Plan breaks and rest periods', agent: { name: 'break-rest-planner', prompt: { role: 'Break and Rest Planner', task: 'Plan required breaks and rest periods', context: args, instructions: ['Schedule 30-minute breaks', 'Plan 10-hour rest periods', 'Identify rest locations', 'Optimize break timing', 'Respect sleeper berth rules', 'Generate break schedule'] }, outputSchema: { type: 'object', required: ['scheduledWithBreaks', 'artifacts'], properties: { scheduledWithBreaks: { type: 'array' }, breakLocations: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'driver-scheduling', 'breaks']
}));

export const scheduleOptimizationTask = defineTask('schedule-optimization', (args, taskCtx) => ({
  kind: 'agent', title: 'Optimize schedule', agent: { name: 'schedule-optimizer', prompt: { role: 'Schedule Optimization Specialist', task: 'Optimize driver schedule for efficiency', context: args, instructions: ['Minimize deadhead miles', 'Maximize utilization', 'Balance driver workloads', 'Optimize relay points', 'Calculate efficiency metrics', 'Generate optimized schedule'] }, outputSchema: { type: 'object', required: ['optimizedSchedule', 'driversAssigned', 'routesCovered', 'utilizationRate', 'metrics', 'artifacts'], properties: { optimizedSchedule: { type: 'array' }, driversAssigned: { type: 'number' }, routesCovered: { type: 'number' }, utilizationRate: { type: 'number' }, metrics: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'driver-scheduling', 'optimization']
}));

export const eldIntegrationTask = defineTask('eld-integration', (args, taskCtx) => ({
  kind: 'agent', title: 'Prepare ELD integration', agent: { name: 'eld-integration-specialist', prompt: { role: 'ELD Integration Specialist', task: 'Prepare schedule data for ELD systems', context: args, instructions: ['Format for ELD transfer', 'Set up duty status', 'Configure notifications', 'Plan log submissions', 'Prepare compliance alerts', 'Generate ELD data files'] }, outputSchema: { type: 'object', required: ['eldData', 'artifacts'], properties: { eldData: { type: 'object' }, integrationFiles: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'driver-scheduling', 'eld']
}));

export const complianceReportTask = defineTask('compliance-report', (args, taskCtx) => ({
  kind: 'agent', title: 'Generate compliance report', agent: { name: 'compliance-report-specialist', prompt: { role: 'Compliance Report Specialist', task: 'Generate driver scheduling compliance report', context: args, instructions: ['Summarize schedule', 'Document compliance status', 'List violations', 'Present metrics', 'Include recommendations', 'Generate executive report'] }, outputSchema: { type: 'object', required: ['reportPath', 'artifacts'], properties: { reportPath: { type: 'string' }, executiveSummary: { type: 'string' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'driver-scheduling', 'reporting']
}));
