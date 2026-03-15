/**
 * @process specializations/domains/business/logistics/last-mile-delivery
 * @description Final delivery leg optimization including delivery scheduling, time-window management, and proof of delivery capture.
 * @inputs { deliveries: array, drivers: array, timeWindows?: array, serviceAreas?: object }
 * @outputs { success: boolean, deliverySchedule: array, routeAssignments: array, podRecords: array, performanceMetrics: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/logistics/last-mile-delivery', {
 *   deliveries: [{ id: 'D001', address: '123 Main St', timeWindow: { start: '09:00', end: '12:00' } }],
 *   drivers: [{ id: 'DR001', capacity: 50, shift: { start: '08:00', end: '17:00' } }],
 *   serviceAreas: { zones: ['A', 'B', 'C'] }
 * });
 *
 * @references
 * - MIT Center for Transportation: https://ctl.mit.edu/research
 * - Last Mile Delivery: https://www.supplychaindive.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    deliveries = [],
    drivers = [],
    timeWindows = [],
    serviceAreas = {},
    outputDir = 'last-mile-delivery-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Last-Mile Delivery Optimization Process');
  ctx.log('info', `Deliveries: ${deliveries.length}, Drivers: ${drivers.length}`);

  // PHASE 1: DELIVERY CLUSTERING
  ctx.log('info', 'Phase 1: Clustering deliveries');
  const deliveryClustering = await ctx.task(deliveryClusteringTask, { deliveries, serviceAreas, outputDir });
  artifacts.push(...deliveryClustering.artifacts);

  // PHASE 2: TIME WINDOW OPTIMIZATION
  ctx.log('info', 'Phase 2: Optimizing time windows');
  const timeWindowOptimization = await ctx.task(timeWindowOptimizationTask, { deliveries, timeWindows, outputDir });
  artifacts.push(...timeWindowOptimization.artifacts);

  // PHASE 3: DRIVER ASSIGNMENT
  ctx.log('info', 'Phase 3: Assigning drivers');
  const driverAssignment = await ctx.task(driverAssignmentTask, { clusters: deliveryClustering.clusters, drivers, outputDir });
  artifacts.push(...driverAssignment.artifacts);

  // PHASE 4: ROUTE SEQUENCING
  ctx.log('info', 'Phase 4: Sequencing routes');
  const routeSequencing = await ctx.task(routeSequencingTask, { assignments: driverAssignment.assignments, timeWindowOptimization, outputDir });
  artifacts.push(...routeSequencing.artifacts);

  // Quality Gate: Review delivery plan
  await ctx.breakpoint({
    question: `Delivery plan generated. ${routeSequencing.routes.length} routes, ${routeSequencing.deliveriesScheduled} deliveries scheduled. On-time expectation: ${routeSequencing.onTimeRate}%. Review?`,
    title: 'Delivery Plan Review',
    context: {
      runId: ctx.runId,
      summary: { routes: routeSequencing.routes.length, deliveries: routeSequencing.deliveriesScheduled, onTimeRate: routeSequencing.onTimeRate },
      files: routeSequencing.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // PHASE 5: CUSTOMER NOTIFICATION
  ctx.log('info', 'Phase 5: Sending customer notifications');
  const customerNotification = await ctx.task(deliveryNotificationTask, { deliverySchedule: routeSequencing.routes, outputDir });
  artifacts.push(...customerNotification.artifacts);

  // PHASE 6: REAL-TIME TRACKING SETUP
  ctx.log('info', 'Phase 6: Setting up real-time tracking');
  const trackingSetup = await ctx.task(deliveryTrackingTask, { routes: routeSequencing.routes, drivers, outputDir });
  artifacts.push(...trackingSetup.artifacts);

  // PHASE 7: PROOF OF DELIVERY CONFIGURATION
  ctx.log('info', 'Phase 7: Configuring proof of delivery');
  const podConfiguration = await ctx.task(podConfigurationTask, { deliveries, outputDir });
  artifacts.push(...podConfiguration.artifacts);

  // PHASE 8: EXCEPTION HANDLING SETUP
  ctx.log('info', 'Phase 8: Setting up exception handling');
  const exceptionHandling = await ctx.task(deliveryExceptionTask, { deliverySchedule: routeSequencing.routes, outputDir });
  artifacts.push(...exceptionHandling.artifacts);

  // PHASE 9: PERFORMANCE REPORTING
  ctx.log('info', 'Phase 9: Generating performance report');
  const performanceReport = await ctx.task(lastMilePerformanceTask, { routeSequencing, driverAssignment, outputDir });
  artifacts.push(...performanceReport.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Last-mile delivery planning complete. ${deliveries.length} deliveries scheduled across ${routeSequencing.routes.length} routes. Expected on-time: ${routeSequencing.onTimeRate}%. Approve?`,
    title: 'Last-Mile Delivery Complete',
    context: {
      runId: ctx.runId,
      summary: {
        totalDeliveries: deliveries.length,
        routes: routeSequencing.routes.length,
        driversUtilized: driverAssignment.driversUtilized,
        expectedOnTime: `${routeSequencing.onTimeRate}%`
      },
      files: [{ path: performanceReport.reportPath, format: 'markdown', label: 'Performance Report' }]
    }
  });

  const endTime = ctx.now();
  return {
    success: true,
    deliverySchedule: routeSequencing.routes,
    routeAssignments: driverAssignment.assignments,
    podRecords: podConfiguration.configuration,
    performanceMetrics: performanceReport.metrics,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/domains/business/logistics/last-mile-delivery', timestamp: startTime, outputDir }
  };
}

// TASK DEFINITIONS
export const deliveryClusteringTask = defineTask('delivery-clustering', (args, taskCtx) => ({
  kind: 'agent', title: 'Cluster deliveries', agent: { name: 'delivery-clustering-specialist', prompt: { role: 'Delivery Clustering Specialist', task: 'Cluster deliveries by geography and service area', context: args, instructions: ['Geocode addresses', 'Apply clustering algorithm', 'Respect service areas', 'Balance cluster sizes', 'Optimize for density', 'Generate cluster map'] }, outputSchema: { type: 'object', required: ['clusters', 'artifacts'], properties: { clusters: { type: 'array' }, clusterMap: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'last-mile', 'clustering']
}));

export const timeWindowOptimizationTask = defineTask('time-window-optimization', (args, taskCtx) => ({
  kind: 'agent', title: 'Optimize time windows', agent: { name: 'time-window-optimizer', prompt: { role: 'Time Window Optimization Specialist', task: 'Optimize delivery time windows', context: args, instructions: ['Analyze time window constraints', 'Identify conflicts', 'Optimize windows for routing', 'Balance customer preferences', 'Generate feasible schedule', 'Document window assignments'] }, outputSchema: { type: 'object', required: ['optimizedWindows', 'artifacts'], properties: { optimizedWindows: { type: 'array' }, conflicts: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'last-mile', 'time-windows']
}));

export const driverAssignmentTask = defineTask('driver-assignment', (args, taskCtx) => ({
  kind: 'agent', title: 'Assign drivers', agent: { name: 'driver-assignment-specialist', prompt: { role: 'Driver Assignment Specialist', task: 'Assign drivers to delivery clusters', context: args, instructions: ['Match capacity to clusters', 'Consider driver skills', 'Balance workloads', 'Respect shift constraints', 'Optimize utilization', 'Generate assignments'] }, outputSchema: { type: 'object', required: ['assignments', 'driversUtilized', 'artifacts'], properties: { assignments: { type: 'array' }, driversUtilized: { type: 'number' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'last-mile', 'driver-assignment']
}));

export const routeSequencingTask = defineTask('route-sequencing', (args, taskCtx) => ({
  kind: 'agent', title: 'Sequence routes', agent: { name: 'route-sequencing-specialist', prompt: { role: 'Route Sequencing Specialist', task: 'Sequence delivery stops optimally', context: args, instructions: ['Apply TSP optimization', 'Respect time windows', 'Minimize travel time', 'Calculate ETAs', 'Generate turn-by-turn routes', 'Estimate on-time rate'] }, outputSchema: { type: 'object', required: ['routes', 'deliveriesScheduled', 'onTimeRate', 'artifacts'], properties: { routes: { type: 'array' }, deliveriesScheduled: { type: 'number' }, onTimeRate: { type: 'number' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'last-mile', 'route-sequencing']
}));

export const deliveryNotificationTask = defineTask('delivery-notification', (args, taskCtx) => ({
  kind: 'agent', title: 'Send customer notifications', agent: { name: 'delivery-notification-specialist', prompt: { role: 'Delivery Notification Specialist', task: 'Send delivery notifications to customers', context: args, instructions: ['Generate ETA notifications', 'Send delivery windows', 'Provide tracking links', 'Handle preferences', 'Schedule reminders', 'Generate notification log'] }, outputSchema: { type: 'object', required: ['notifications', 'artifacts'], properties: { notifications: { type: 'array' }, notificationsSent: { type: 'number' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'last-mile', 'notification']
}));

export const deliveryTrackingTask = defineTask('delivery-tracking', (args, taskCtx) => ({
  kind: 'agent', title: 'Set up real-time tracking', agent: { name: 'delivery-tracking-specialist', prompt: { role: 'Delivery Tracking Specialist', task: 'Set up real-time delivery tracking', context: args, instructions: ['Configure GPS tracking', 'Set up ETA updates', 'Enable customer visibility', 'Configure alerts', 'Plan exception triggers', 'Generate tracking configuration'] }, outputSchema: { type: 'object', required: ['trackingConfig', 'artifacts'], properties: { trackingConfig: { type: 'object' }, trackingLinks: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'last-mile', 'tracking']
}));

export const podConfigurationTask = defineTask('pod-configuration', (args, taskCtx) => ({
  kind: 'agent', title: 'Configure proof of delivery', agent: { name: 'pod-configuration-specialist', prompt: { role: 'POD Configuration Specialist', task: 'Configure proof of delivery requirements', context: args, instructions: ['Define POD requirements', 'Configure photo capture', 'Set up signature capture', 'Define delivery instructions', 'Configure safe drop rules', 'Generate POD configuration'] }, outputSchema: { type: 'object', required: ['configuration', 'artifacts'], properties: { configuration: { type: 'object' }, podRequirements: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'last-mile', 'pod']
}));

export const deliveryExceptionTask = defineTask('delivery-exception', (args, taskCtx) => ({
  kind: 'agent', title: 'Set up exception handling', agent: { name: 'delivery-exception-specialist', prompt: { role: 'Delivery Exception Specialist', task: 'Set up delivery exception handling procedures', context: args, instructions: ['Define exception types', 'Set escalation procedures', 'Configure re-delivery rules', 'Plan failed delivery handling', 'Define customer options', 'Generate exception procedures'] }, outputSchema: { type: 'object', required: ['exceptionProcedures', 'artifacts'], properties: { exceptionProcedures: { type: 'object' }, escalationMatrix: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'last-mile', 'exceptions']
}));

export const lastMilePerformanceTask = defineTask('last-mile-performance', (args, taskCtx) => ({
  kind: 'agent', title: 'Generate performance report', agent: { name: 'last-mile-performance-analyst', prompt: { role: 'Last-Mile Performance Analyst', task: 'Generate last-mile delivery performance report', context: args, instructions: ['Calculate on-time rate', 'Measure cost-per-delivery', 'Track driver productivity', 'Analyze route efficiency', 'Identify improvements', 'Generate performance report'] }, outputSchema: { type: 'object', required: ['metrics', 'reportPath', 'artifacts'], properties: { metrics: { type: 'object' }, reportPath: { type: 'string' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'last-mile', 'performance']
}));
