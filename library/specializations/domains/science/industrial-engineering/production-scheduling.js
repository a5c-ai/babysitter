/**
 * @process domains/science/industrial-engineering/production-scheduling
 * @description Production Scheduling Optimization - Develop and implement production schedules that optimize due date
 * performance, throughput, and resource utilization using scheduling algorithms and tools.
 * @inputs { productionOrders: string, resources?: array, objectives?: array }
 * @outputs { success: boolean, schedule: object, performance: object, ganttChart: string, artifacts: array }
 *
 * @example
 * const result = await orchestrate('domains/science/industrial-engineering/production-scheduling', {
 *   productionOrders: 'Weekly production orders with due dates',
 *   resources: ['machine-1', 'machine-2', 'assembly'],
 *   objectives: ['minimize-lateness', 'maximize-throughput']
 * });
 *
 * @references
 * - Pinedo, Scheduling: Theory, Algorithms, and Systems
 * - Baker & Trietsch, Principles of Sequencing and Scheduling
 * - Conway et al., Theory of Scheduling
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    productionOrders,
    resources = [],
    objectives = ['minimize-lateness'],
    schedulingHorizon = 'weekly',
    outputDir = 'scheduling-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Production Scheduling Optimization process');

  // Task 1: Scheduling Objectives
  ctx.log('info', 'Phase 1: Defining scheduling objectives and constraints');
  const schedulingObjectives = await ctx.task(schedulingObjectivesTask, {
    objectives,
    schedulingHorizon,
    outputDir
  });

  artifacts.push(...schedulingObjectives.artifacts);

  // Task 2: Production System Modeling
  ctx.log('info', 'Phase 2: Modeling production system structure');
  const systemModeling = await ctx.task(systemModelingTask, {
    resources,
    outputDir
  });

  artifacts.push(...systemModeling.artifacts);

  // Task 3: Job Data Collection
  ctx.log('info', 'Phase 3: Collecting job and resource data');
  const jobDataCollection = await ctx.task(jobDataTask, {
    productionOrders,
    systemModeling,
    outputDir
  });

  artifacts.push(...jobDataCollection.artifacts);

  // Breakpoint: Review data
  await ctx.breakpoint({
    question: `Scheduling data collected. ${jobDataCollection.jobCount} jobs, ${systemModeling.resourceCount} resources. Proceed with schedule generation?`,
    title: 'Scheduling Data Review',
    context: {
      runId: ctx.runId,
      data: {
        jobs: jobDataCollection.jobCount,
        resources: systemModeling.resourceCount,
        objectives: schedulingObjectives.objectives
      },
      files: jobDataCollection.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // Task 4: Scheduling Algorithm Selection
  ctx.log('info', 'Phase 4: Selecting scheduling approach');
  const algorithmSelection = await ctx.task(algorithmSelectionTask, {
    schedulingObjectives,
    systemModeling,
    jobDataCollection,
    outputDir
  });

  artifacts.push(...algorithmSelection.artifacts);

  // Task 5: Schedule Generation
  ctx.log('info', 'Phase 5: Generating feasible schedules');
  const scheduleGeneration = await ctx.task(scheduleGenerationTask, {
    algorithmSelection,
    jobDataCollection,
    systemModeling,
    outputDir
  });

  artifacts.push(...scheduleGeneration.artifacts);

  // Task 6: Performance Analysis
  ctx.log('info', 'Phase 6: Analyzing schedule performance');
  const performanceAnalysis = await ctx.task(performanceAnalysisTask, {
    scheduleGeneration,
    schedulingObjectives,
    outputDir
  });

  artifacts.push(...performanceAnalysis.artifacts);

  // Task 7: Gantt Chart Generation
  ctx.log('info', 'Phase 7: Creating visual schedule displays');
  const ganttGeneration = await ctx.task(ganttGenerationTask, {
    scheduleGeneration,
    outputDir
  });

  artifacts.push(...ganttGeneration.artifacts);

  // Task 8: Schedule Tracking System
  ctx.log('info', 'Phase 8: Setting up schedule tracking');
  const trackingSystem = await ctx.task(trackingSystemTask, {
    scheduleGeneration,
    outputDir
  });

  artifacts.push(...trackingSystem.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Schedule generated. On-time: ${performanceAnalysis.onTimePercentage}%. Utilization: ${performanceAnalysis.utilization}%. Makespan: ${performanceAnalysis.makespan}. Review schedule?`,
    title: 'Production Schedule Results',
    context: {
      runId: ctx.runId,
      summary: {
        jobsScheduled: scheduleGeneration.jobsScheduled,
        onTimePercentage: performanceAnalysis.onTimePercentage,
        utilization: performanceAnalysis.utilization,
        makespan: performanceAnalysis.makespan
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    schedule: scheduleGeneration.schedule,
    performance: {
      onTimePercentage: performanceAnalysis.onTimePercentage,
      utilization: performanceAnalysis.utilization,
      makespan: performanceAnalysis.makespan,
      avgFlowTime: performanceAnalysis.avgFlowTime
    },
    ganttChart: ganttGeneration.ganttPath,
    artifacts,
    duration,
    metadata: {
      processId: 'domains/science/industrial-engineering/production-scheduling',
      timestamp: startTime,
      schedulingHorizon,
      outputDir
    }
  };
}

// Task definitions
export const schedulingObjectivesTask = defineTask('scheduling-objectives', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define scheduling objectives',
  agent: {
    name: 'scheduling-analyst',
    prompt: {
      role: 'Production Scheduling Analyst',
      task: 'Define scheduling objectives and constraints',
      context: args,
      instructions: [
        '1. Define primary scheduling objective',
        '2. Define secondary objectives',
        '3. Identify hard constraints',
        '4. Identify soft constraints',
        '5. Define due date priorities',
        '6. Define scheduling horizon',
        '7. Identify frozen period',
        '8. Document objectives'
      ],
      outputFormat: 'JSON with scheduling objectives'
    },
    outputSchema: {
      type: 'object',
      required: ['objectives', 'constraints', 'horizon', 'artifacts'],
      properties: {
        objectives: { type: 'array' },
        primaryObjective: { type: 'string' },
        constraints: { type: 'object' },
        dueDatePriorities: { type: 'object' },
        horizon: { type: 'object' },
        frozenPeriod: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'scheduling', 'objectives']
}));

export const systemModelingTask = defineTask('system-modeling', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Model production system',
  agent: {
    name: 'system-modeler',
    prompt: {
      role: 'Manufacturing Systems Engineer',
      task: 'Model production system structure and routings',
      context: args,
      instructions: [
        '1. Identify all production resources',
        '2. Define work centers and machines',
        '3. Document resource capacities',
        '4. Define product routings',
        '5. Identify resource constraints',
        '6. Define setup requirements',
        '7. Model material flow',
        '8. Document system model'
      ],
      outputFormat: 'JSON with system model'
    },
    outputSchema: {
      type: 'object',
      required: ['resources', 'resourceCount', 'routings', 'artifacts'],
      properties: {
        resources: { type: 'array' },
        resourceCount: { type: 'number' },
        workCenters: { type: 'array' },
        capacities: { type: 'object' },
        routings: { type: 'object' },
        setupMatrix: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'scheduling', 'modeling']
}));

export const jobDataTask = defineTask('job-data-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Collect job and resource data',
  agent: {
    name: 'job-data-collector',
    prompt: {
      role: 'Production Data Analyst',
      task: 'Collect job release and due date information',
      context: args,
      instructions: [
        '1. Extract job/order information',
        '2. Collect release dates',
        '3. Collect due dates',
        '4. Collect processing times',
        '5. Identify job priorities',
        '6. Collect quantity requirements',
        '7. Link jobs to routings',
        '8. Create job database'
      ],
      outputFormat: 'JSON with job data'
    },
    outputSchema: {
      type: 'object',
      required: ['jobs', 'jobCount', 'jobDetails', 'artifacts'],
      properties: {
        jobs: { type: 'array' },
        jobCount: { type: 'number' },
        jobDetails: { type: 'object' },
        releaseDates: { type: 'object' },
        dueDates: { type: 'object' },
        processingTimes: { type: 'object' },
        priorities: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'scheduling', 'data']
}));

export const algorithmSelectionTask = defineTask('algorithm-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select scheduling approach',
  agent: {
    name: 'algorithm-selector',
    prompt: {
      role: 'Scheduling Algorithm Expert',
      task: 'Select appropriate scheduling rules or algorithms',
      context: args,
      instructions: [
        '1. Analyze problem characteristics',
        '2. Consider dispatching rules (FCFS, EDD, SPT)',
        '3. Consider optimization methods',
        '4. Consider constraint programming',
        '5. Select primary scheduling method',
        '6. Select backup method',
        '7. Define parameters',
        '8. Document selection rationale'
      ],
      outputFormat: 'JSON with algorithm selection'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedMethod', 'parameters', 'rationale', 'artifacts'],
      properties: {
        selectedMethod: { type: 'string' },
        dispatchingRules: { type: 'array' },
        parameters: { type: 'object' },
        backupMethod: { type: 'string' },
        rationale: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'scheduling', 'algorithm']
}));

export const scheduleGenerationTask = defineTask('schedule-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate feasible schedule',
  agent: {
    name: 'schedule-generator',
    prompt: {
      role: 'Production Scheduler',
      task: 'Generate feasible production schedule',
      context: args,
      instructions: [
        '1. Apply selected scheduling method',
        '2. Sequence jobs by resource',
        '3. Assign start and end times',
        '4. Respect all constraints',
        '5. Handle setup times',
        '6. Resolve resource conflicts',
        '7. Validate schedule feasibility',
        '8. Output schedule'
      ],
      outputFormat: 'JSON with generated schedule'
    },
    outputSchema: {
      type: 'object',
      required: ['schedule', 'jobsScheduled', 'feasible', 'artifacts'],
      properties: {
        schedule: { type: 'object' },
        jobsScheduled: { type: 'number' },
        scheduleByResource: { type: 'object' },
        scheduleByJob: { type: 'object' },
        feasible: { type: 'boolean' },
        conflicts: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'scheduling', 'generation']
}));

export const performanceAnalysisTask = defineTask('performance-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze schedule performance',
  agent: {
    name: 'performance-analyst',
    prompt: {
      role: 'Schedule Performance Analyst',
      task: 'Analyze schedule performance metrics',
      context: args,
      instructions: [
        '1. Calculate makespan',
        '2. Calculate average flow time',
        '3. Calculate on-time percentage',
        '4. Calculate total lateness',
        '5. Calculate resource utilization',
        '6. Calculate WIP levels',
        '7. Compare to objectives',
        '8. Document analysis'
      ],
      outputFormat: 'JSON with performance analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['makespan', 'avgFlowTime', 'onTimePercentage', 'utilization', 'artifacts'],
      properties: {
        makespan: { type: 'number' },
        avgFlowTime: { type: 'number' },
        onTimePercentage: { type: 'number' },
        totalLateness: { type: 'number' },
        utilization: { type: 'number' },
        wipLevels: { type: 'object' },
        objectiveComparison: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'scheduling', 'performance']
}));

export const ganttGenerationTask = defineTask('gantt-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create visual schedule displays',
  agent: {
    name: 'gantt-creator',
    prompt: {
      role: 'Schedule Visualization Specialist',
      task: 'Create Gantt charts and visual displays',
      context: args,
      instructions: [
        '1. Create resource Gantt chart',
        '2. Create job Gantt chart',
        '3. Show due dates on chart',
        '4. Highlight late jobs',
        '5. Show setup times',
        '6. Create schedule summary',
        '7. Export in multiple formats',
        '8. Document visualizations'
      ],
      outputFormat: 'JSON with Gantt chart paths'
    },
    outputSchema: {
      type: 'object',
      required: ['ganttPath', 'resourceGantt', 'jobGantt', 'artifacts'],
      properties: {
        ganttPath: { type: 'string' },
        resourceGantt: { type: 'string' },
        jobGantt: { type: 'string' },
        scheduleSummary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'scheduling', 'gantt']
}));

export const trackingSystemTask = defineTask('tracking-system', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up schedule tracking',
  agent: {
    name: 'tracking-setup',
    prompt: {
      role: 'Production Control Specialist',
      task: 'Set up schedule execution and tracking system',
      context: args,
      instructions: [
        '1. Define tracking metrics',
        '2. Create work order release process',
        '3. Define progress reporting',
        '4. Create exception reporting',
        '5. Define rescheduling triggers',
        '6. Set up schedule adherence tracking',
        '7. Create tracking dashboard',
        '8. Document tracking procedures'
      ],
      outputFormat: 'JSON with tracking system'
    },
    outputSchema: {
      type: 'object',
      required: ['trackingMetrics', 'reportingProcess', 'dashboard', 'artifacts'],
      properties: {
        trackingMetrics: { type: 'array' },
        workOrderProcess: { type: 'object' },
        reportingProcess: { type: 'object' },
        exceptionReporting: { type: 'object' },
        reschedulingTriggers: { type: 'array' },
        dashboard: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'scheduling', 'tracking']
}));
