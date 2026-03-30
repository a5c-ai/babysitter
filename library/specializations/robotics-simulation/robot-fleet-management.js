/**
 * @process specializations/robotics-simulation/robot-fleet-management
 * @description Robot Fleet Management System - Develop comprehensive fleet management for multiple robots
 * including monitoring dashboards, task scheduling, maintenance tracking, analytics, and remote operations.
 * @inputs { fleetName: string, fleetSize?: number, deploymentType?: string, outputDir?: string }
 * @outputs { success: boolean, fleetConfig: object, operationalMetrics: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/robotics-simulation/robot-fleet-management', {
 *   fleetName: 'warehouse_amr_fleet',
 *   fleetSize: 50,
 *   deploymentType: 'warehouse'
 * });
 *
 * @references
 * - Fleet Management: https://www.therobotreport.com/fleet-management-software-for-mobile-robots/
 * - VDA 5050: https://www.vda.de/en/topics/innovation-and-standardisation/interface-for-automated-guided-vehicles
 * - Open-RMF: https://www.open-rmf.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    fleetName,
    fleetSize = 20,
    deploymentType = 'warehouse',
    outputDir = 'fleet-management-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Fleet Management System for ${fleetName}`);

  const fleetArchitecture = await ctx.task(fleetArchitectureDesignTask, { fleetName, fleetSize, deploymentType, outputDir });
  artifacts.push(...fleetArchitecture.artifacts);

  const monitoringDashboard = await ctx.task(monitoringDashboardTask, { fleetName, fleetSize, outputDir });
  artifacts.push(...monitoringDashboard.artifacts);

  const taskScheduler = await ctx.task(taskSchedulerSystemTask, { fleetName, fleetSize, deploymentType, outputDir });
  artifacts.push(...taskScheduler.artifacts);

  const robotRegistry = await ctx.task(robotRegistryTask, { fleetName, fleetSize, outputDir });
  artifacts.push(...robotRegistry.artifacts);

  const maintenanceTracking = await ctx.task(maintenanceTrackingTask, { fleetName, robotRegistry, outputDir });
  artifacts.push(...maintenanceTracking.artifacts);

  const analyticsReporting = await ctx.task(analyticsReportingTask, { fleetName, taskScheduler, outputDir });
  artifacts.push(...analyticsReporting.artifacts);

  const remoteOperations = await ctx.task(remoteOperationsTask, { fleetName, monitoringDashboard, outputDir });
  artifacts.push(...remoteOperations.artifacts);

  const alertingSystem = await ctx.task(alertingSystemTask, { fleetName, monitoringDashboard, outputDir });
  artifacts.push(...alertingSystem.artifacts);

  const systemTesting = await ctx.task(fleetSystemTestingTask, { fleetName, fleetSize, outputDir });
  artifacts.push(...systemTesting.artifacts);

  await ctx.breakpoint({
    question: `Fleet Management System Complete for ${fleetName}. Fleet utilization: ${analyticsReporting.utilization}%, System uptime: ${systemTesting.uptime}%. Review?`,
    title: 'Fleet Management Complete',
    context: { runId: ctx.runId, utilization: analyticsReporting.utilization, uptime: systemTesting.uptime }
  });

  return {
    success: systemTesting.uptime >= 99 && analyticsReporting.utilization >= 70,
    fleetName,
    fleetConfig: { size: fleetSize, deploymentType, architecturePath: fleetArchitecture.configPath },
    operationalMetrics: { utilization: analyticsReporting.utilization, uptime: systemTesting.uptime, avgTaskTime: taskScheduler.avgTaskTime },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/robotics-simulation/robot-fleet-management', timestamp: startTime, outputDir }
  };
}

export const fleetArchitectureDesignTask = defineTask('fleet-architecture-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Fleet Architecture - ${args.fleetName}`,
  agent: {
    name: 'ros-expert',  // AG-015: ROS/ROS2 Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Design fleet management architecture', context: args, instructions: ['1. Design system architecture', '2. Define communication protocols', '3. Plan data flow', '4. Design scalability', '5. Document architecture'] },
    outputSchema: { type: 'object', required: ['configPath', 'architecture', 'artifacts'], properties: { configPath: { type: 'string' }, architecture: { type: 'object' }, scalability: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'fleet', 'architecture']
}));

export const monitoringDashboardTask = defineTask('monitoring-dashboard', (args, taskCtx) => ({
  kind: 'agent',
  title: `Monitoring Dashboard - ${args.fleetName}`,
  agent: {
    name: 'full-stack-engineer',
    prompt: { role: 'Full Stack Engineer', task: 'Build fleet monitoring dashboard', context: args, instructions: ['1. Design dashboard UI', '2. Create real-time views', '3. Add robot status panels', '4. Implement map view', '5. Add historical data'] },
    outputSchema: { type: 'object', required: ['dashboardUrl', 'features', 'artifacts'], properties: { dashboardUrl: { type: 'string' }, features: { type: 'array' }, refreshRate: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'fleet', 'dashboard']
}));

export const taskSchedulerSystemTask = defineTask('task-scheduler-system', (args, taskCtx) => ({
  kind: 'agent',
  title: `Task Scheduler - ${args.fleetName}`,
  agent: {
    name: 'ros-expert',  // AG-015: ROS/ROS2 Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Build task scheduling system', context: args, instructions: ['1. Design scheduling algorithm', '2. Implement task queue', '3. Add priority handling', '4. Configure load balancing', '5. Test scheduling'] },
    outputSchema: { type: 'object', required: ['schedulerConfig', 'avgTaskTime', 'artifacts'], properties: { schedulerConfig: { type: 'object' }, avgTaskTime: { type: 'number' }, throughput: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'fleet', 'scheduler']
}));

export const robotRegistryTask = defineTask('robot-registry', (args, taskCtx) => ({
  kind: 'agent',
  title: `Robot Registry - ${args.fleetName}`,
  agent: {
    name: 'ros-expert',  // AG-015: ROS/ROS2 Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Build robot registry system', context: args, instructions: ['1. Design data model', '2. Implement registration', '3. Add status tracking', '4. Implement discovery', '5. Test registry'] },
    outputSchema: { type: 'object', required: ['registryConfig', 'robotCount', 'artifacts'], properties: { registryConfig: { type: 'object' }, robotCount: { type: 'number' }, dataModel: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'fleet', 'registry']
}));

export const maintenanceTrackingTask = defineTask('maintenance-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: `Maintenance Tracking - ${args.fleetName}`,
  agent: {
    name: 'ros-expert',  // AG-015: ROS/ROS2 Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Build maintenance tracking system', context: args, instructions: ['1. Track runtime hours', '2. Monitor wear indicators', '3. Schedule maintenance', '4. Track spare parts', '5. Generate reports'] },
    outputSchema: { type: 'object', required: ['maintenanceConfig', 'schedules', 'artifacts'], properties: { maintenanceConfig: { type: 'object' }, schedules: { type: 'array' }, predictions: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'fleet', 'maintenance']
}));

export const analyticsReportingTask = defineTask('analytics-reporting', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analytics & Reporting - ${args.fleetName}`,
  agent: {
    name: 'data-engineer',
    prompt: { role: 'Data Engineer', task: 'Build analytics and reporting', context: args, instructions: ['1. Define KPIs', '2. Build data pipeline', '3. Create reports', '4. Add visualizations', '5. Calculate utilization'] },
    outputSchema: { type: 'object', required: ['utilization', 'kpis', 'artifacts'], properties: { utilization: { type: 'number' }, kpis: { type: 'object' }, reports: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'fleet', 'analytics']
}));

export const remoteOperationsTask = defineTask('remote-operations', (args, taskCtx) => ({
  kind: 'agent',
  title: `Remote Operations - ${args.fleetName}`,
  agent: {
    name: 'ros-expert',  // AG-015: ROS/ROS2 Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Build remote operations capability', context: args, instructions: ['1. Implement teleoperation', '2. Add video streaming', '3. Configure remote commands', '4. Add safety interlocks', '5. Test remote ops'] },
    outputSchema: { type: 'object', required: ['remoteOpsConfig', 'latency', 'artifacts'], properties: { remoteOpsConfig: { type: 'object' }, latency: { type: 'number' }, capabilities: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'fleet', 'remote-ops']
}));

export const alertingSystemTask = defineTask('alerting-system', (args, taskCtx) => ({
  kind: 'agent',
  title: `Alerting System - ${args.fleetName}`,
  agent: {
    name: 'ros-expert',  // AG-015: ROS/ROS2 Expert Agent
    prompt: { role: 'Robotics Engineer', task: 'Build alerting system', context: args, instructions: ['1. Define alert rules', '2. Configure thresholds', '3. Set up notifications', '4. Add escalation', '5. Test alerting'] },
    outputSchema: { type: 'object', required: ['alertConfig', 'rules', 'artifacts'], properties: { alertConfig: { type: 'object' }, rules: { type: 'array' }, channels: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'fleet', 'alerting']
}));

export const fleetSystemTestingTask = defineTask('fleet-system-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `System Testing - ${args.fleetName}`,
  agent: {
    name: 'simulation-test-engineer',  // AG-012: Simulation Test Engineer Agent
    prompt: { role: 'Test Engineer', task: 'Test fleet management system', context: args, instructions: ['1. Test all components', '2. Run load tests', '3. Measure uptime', '4. Test failover', '5. Generate test report'] },
    outputSchema: { type: 'object', required: ['uptime', 'testResults', 'artifacts'], properties: { uptime: { type: 'number' }, testResults: { type: 'array' }, loadTestResults: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'fleet', 'testing']
}));
