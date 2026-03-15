/**
 * @process specializations/domains/business/logistics/warehouse-labor-management
 * @description AI-powered workforce planning, task assignment, and productivity optimization to maximize labor efficiency and meet service levels.
 * @inputs { workOrders: array, workforce: array, laborStandards?: object, shiftSchedule?: object }
 * @outputs { success: boolean, taskAssignments: array, productivityMetrics: object, staffingRecommendations: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/logistics/warehouse-labor-management', {
 *   workOrders: [{ type: 'picking', volume: 500, priority: 'high' }],
 *   workforce: [{ id: 'W001', name: 'John', skills: ['picking', 'packing'], shift: 'day' }],
 *   laborStandards: { picking: { unitsPerHour: 60 } }
 * });
 *
 * @references
 * - DC Velocity: https://www.dcvelocity.com/
 * - WERC Labor Standards: https://www.werc.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    workOrders = [],
    workforce = [],
    laborStandards = {},
    shiftSchedule = {},
    outputDir = 'warehouse-labor-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Warehouse Labor Management Process');
  ctx.log('info', `Work orders: ${workOrders.length}, Workers: ${workforce.length}`);

  // PHASE 1: WORKLOAD FORECASTING
  ctx.log('info', 'Phase 1: Forecasting workload');
  const workloadForecast = await ctx.task(workloadForecastTask, { workOrders, laborStandards, outputDir });
  artifacts.push(...workloadForecast.artifacts);

  // PHASE 2: STAFFING REQUIREMENTS CALCULATION
  ctx.log('info', 'Phase 2: Calculating staffing requirements');
  const staffingCalc = await ctx.task(staffingCalculationTask, {
    forecast: workloadForecast.forecast,
    laborStandards,
    outputDir
  });
  artifacts.push(...staffingCalc.artifacts);

  // PHASE 3: SKILL-BASED TASK ASSIGNMENT
  ctx.log('info', 'Phase 3: Assigning tasks based on skills');
  const taskAssignment = await ctx.task(skillBasedAssignmentTask, {
    staffingRequirements: staffingCalc.requirements,
    workforce,
    workOrders,
    outputDir
  });
  artifacts.push(...taskAssignment.artifacts);

  // Quality Gate: Review staffing gaps
  if (staffingCalc.gaps.length > 0) {
    await ctx.breakpoint({
      question: `Staffing gaps identified: ${staffingCalc.gaps.length} areas. Review and adjust?`,
      title: 'Staffing Gap Review',
      context: {
        runId: ctx.runId,
        gaps: staffingCalc.gaps,
        files: staffingCalc.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // PHASE 4: WORKLOAD BALANCING
  ctx.log('info', 'Phase 4: Balancing workloads');
  const workloadBalancing = await ctx.task(workloadBalancingTask, {
    assignments: taskAssignment.assignments,
    workforce,
    outputDir
  });
  artifacts.push(...workloadBalancing.artifacts);

  // PHASE 5: REAL-TIME PRODUCTIVITY MONITORING
  ctx.log('info', 'Phase 5: Monitoring productivity');
  const productivityMonitoring = await ctx.task(productivityMonitoringTask, {
    assignments: workloadBalancing.balancedAssignments,
    laborStandards,
    outputDir
  });
  artifacts.push(...productivityMonitoring.artifacts);

  // PHASE 6: INCENTIVE CALCULATION
  ctx.log('info', 'Phase 6: Calculating incentives');
  const incentiveCalc = await ctx.task(incentiveCalculationTask, {
    productivityData: productivityMonitoring.metrics,
    laborStandards,
    outputDir
  });
  artifacts.push(...incentiveCalc.artifacts);

  // PHASE 7: PERFORMANCE REPORTING
  ctx.log('info', 'Phase 7: Generating performance reports');
  const performanceReport = await ctx.task(laborPerformanceTask, {
    assignments: workloadBalancing.balancedAssignments,
    productivity: productivityMonitoring.metrics,
    incentives: incentiveCalc.incentives,
    outputDir
  });
  artifacts.push(...performanceReport.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Labor management complete. ${taskAssignment.assignments.length} tasks assigned, average productivity: ${productivityMonitoring.metrics.averageProductivity}%. Finalize?`,
    title: 'Labor Management Complete',
    context: {
      runId: ctx.runId,
      summary: {
        tasksAssigned: taskAssignment.assignments.length,
        workersUtilized: workforce.length,
        averageProductivity: `${productivityMonitoring.metrics.averageProductivity}%`,
        staffingEfficiency: `${staffingCalc.efficiency}%`
      },
      files: [{ path: performanceReport.reportPath, format: 'markdown', label: 'Performance Report' }]
    }
  });

  const endTime = ctx.now();
  return {
    success: true,
    taskAssignments: workloadBalancing.balancedAssignments,
    productivityMetrics: productivityMonitoring.metrics,
    staffingRecommendations: staffingCalc.recommendations,
    incentives: incentiveCalc.incentives,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/domains/business/logistics/warehouse-labor-management', timestamp: startTime, outputDir }
  };
}

// TASK DEFINITIONS
export const workloadForecastTask = defineTask('workload-forecast', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Forecast workload',
  agent: {
    name: 'workload-forecaster',
    prompt: {
      role: 'Workload Forecasting Specialist',
      task: 'Forecast warehouse workload requirements',
      context: args,
      instructions: ['Analyze work order volumes', 'Calculate labor hours needed', 'Forecast by activity type', 'Consider historical patterns', 'Account for productivity rates', 'Generate workload forecast']
    },
    outputSchema: { type: 'object', required: ['forecast', 'artifacts'], properties: { forecast: { type: 'object' }, laborHoursNeeded: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'logistics', 'labor-management', 'forecasting']
}));

export const staffingCalculationTask = defineTask('staffing-calculation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate staffing requirements',
  agent: {
    name: 'staffing-calculator',
    prompt: {
      role: 'Staffing Calculation Specialist',
      task: 'Calculate optimal staffing levels',
      context: args,
      instructions: ['Calculate headcount by function', 'Identify staffing gaps', 'Recommend overtime needs', 'Plan for absenteeism', 'Optimize labor costs', 'Generate staffing plan']
    },
    outputSchema: { type: 'object', required: ['requirements', 'gaps', 'efficiency', 'artifacts'], properties: { requirements: { type: 'object' }, gaps: { type: 'array' }, efficiency: { type: 'number' }, recommendations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'logistics', 'labor-management', 'staffing']
}));

export const skillBasedAssignmentTask = defineTask('skill-based-assignment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assign tasks based on skills',
  agent: {
    name: 'task-assigner',
    prompt: {
      role: 'Task Assignment Specialist',
      task: 'Assign tasks to workers based on skills and availability',
      context: args,
      instructions: ['Match skills to task requirements', 'Consider certifications', 'Balance experience levels', 'Optimize for productivity', 'Handle special requirements', 'Generate assignments']
    },
    outputSchema: { type: 'object', required: ['assignments', 'artifacts'], properties: { assignments: { type: 'array' }, unassignedTasks: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'logistics', 'labor-management', 'assignment']
}));

export const workloadBalancingTask = defineTask('workload-balancing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Balance workloads',
  agent: {
    name: 'workload-balancer',
    prompt: {
      role: 'Workload Balancing Specialist',
      task: 'Balance workloads across workforce',
      context: args,
      instructions: ['Analyze workload distribution', 'Identify imbalances', 'Redistribute tasks', 'Consider fatigue factors', 'Optimize for efficiency', 'Generate balanced schedule']
    },
    outputSchema: { type: 'object', required: ['balancedAssignments', 'artifacts'], properties: { balancedAssignments: { type: 'array' }, workloadVariance: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'logistics', 'labor-management', 'balancing']
}));

export const productivityMonitoringTask = defineTask('productivity-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Monitor productivity',
  agent: {
    name: 'productivity-monitor',
    prompt: {
      role: 'Productivity Monitoring Specialist',
      task: 'Monitor and analyze worker productivity',
      context: args,
      instructions: ['Track units per hour', 'Compare to labor standards', 'Identify top performers', 'Flag productivity issues', 'Calculate efficiency rates', 'Generate productivity report']
    },
    outputSchema: { type: 'object', required: ['metrics', 'artifacts'], properties: { metrics: { type: 'object' }, topPerformers: { type: 'array' }, needsImprovement: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'logistics', 'labor-management', 'productivity']
}));

export const incentiveCalculationTask = defineTask('incentive-calculation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate incentives',
  agent: {
    name: 'incentive-calculator',
    prompt: {
      role: 'Incentive Calculation Specialist',
      task: 'Calculate performance-based incentives',
      context: args,
      instructions: ['Apply incentive formulas', 'Calculate bonus amounts', 'Consider quality factors', 'Apply safety deductions', 'Calculate team incentives', 'Generate incentive report']
    },
    outputSchema: { type: 'object', required: ['incentives', 'artifacts'], properties: { incentives: { type: 'array' }, totalIncentives: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'logistics', 'labor-management', 'incentives']
}));

export const laborPerformanceTask = defineTask('labor-performance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate performance reports',
  agent: {
    name: 'labor-performance-analyst',
    prompt: {
      role: 'Labor Performance Analyst',
      task: 'Generate comprehensive labor performance reports',
      context: args,
      instructions: ['Summarize productivity metrics', 'Report on labor efficiency', 'Include incentive summary', 'Identify improvement areas', 'Provide recommendations', 'Generate detailed report']
    },
    outputSchema: { type: 'object', required: ['reportPath', 'artifacts'], properties: { reportPath: { type: 'string' }, metrics: { type: 'object' }, recommendations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'logistics', 'labor-management', 'reporting']
}));
