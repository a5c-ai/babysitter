/**
 * @process civil-engineering/construction-schedule-development
 * @description Development of construction schedules using CPM including activity sequencing, resource loading, and critical path analysis
 * @inputs { projectId: string, projectScope: object, resourceAvailability: object, constraints: object }
 * @outputs { success: boolean, schedule: object, criticalPath: array, ganttCharts: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectId,
    projectScope,
    resourceAvailability,
    constraints,
    workCalendar,
    milestones,
    schedulingMethod = 'CPM',
    outputDir = 'schedule-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Work Breakdown Structure
  ctx.log('info', 'Starting schedule development: Creating WBS');
  const wbsDevelopment = await ctx.task(wbsDevelopmentTask, {
    projectId,
    projectScope,
    outputDir
  });

  if (!wbsDevelopment.success) {
    return {
      success: false,
      error: 'WBS development failed',
      details: wbsDevelopment,
      metadata: { processId: 'civil-engineering/construction-schedule-development', timestamp: startTime }
    };
  }

  artifacts.push(...wbsDevelopment.artifacts);

  // Task 2: Activity Definition
  ctx.log('info', 'Defining schedule activities');
  const activityDefinition = await ctx.task(activityDefinitionTask, {
    projectId,
    wbsDevelopment,
    projectScope,
    outputDir
  });

  artifacts.push(...activityDefinition.artifacts);

  // Task 3: Duration Estimation
  ctx.log('info', 'Estimating activity durations');
  const durationEstimation = await ctx.task(durationEstimationTask, {
    projectId,
    activityDefinition,
    resourceAvailability,
    outputDir
  });

  artifacts.push(...durationEstimation.artifacts);

  // Task 4: Activity Sequencing
  ctx.log('info', 'Sequencing activities');
  const activitySequencing = await ctx.task(activitySequencingTask, {
    projectId,
    activityDefinition,
    durationEstimation,
    constraints,
    outputDir
  });

  artifacts.push(...activitySequencing.artifacts);

  // Task 5: Critical Path Analysis
  ctx.log('info', 'Performing critical path analysis');
  const criticalPathAnalysis = await ctx.task(criticalPathTask, {
    projectId,
    activitySequencing,
    durationEstimation,
    milestones,
    outputDir
  });

  artifacts.push(...criticalPathAnalysis.artifacts);

  // Breakpoint: Review schedule
  await ctx.breakpoint({
    question: `Schedule development complete for ${projectId}. Duration: ${criticalPathAnalysis.projectDuration} days. Review schedule?`,
    title: 'Construction Schedule Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        totalActivities: activityDefinition.activityCount,
        projectDuration: criticalPathAnalysis.projectDuration,
        criticalPathLength: criticalPathAnalysis.criticalPath.length,
        milestoneCount: milestones?.length || 0
      }
    }
  });

  // Task 6: Resource Loading
  ctx.log('info', 'Loading resources');
  const resourceLoading = await ctx.task(resourceLoadingTask, {
    projectId,
    criticalPathAnalysis,
    resourceAvailability,
    outputDir
  });

  artifacts.push(...resourceLoading.artifacts);

  // Task 7: Schedule Optimization
  ctx.log('info', 'Optimizing schedule');
  const scheduleOptimization = await ctx.task(scheduleOptimizationTask, {
    projectId,
    criticalPathAnalysis,
    resourceLoading,
    constraints,
    outputDir
  });

  artifacts.push(...scheduleOptimization.artifacts);

  // Task 8: Schedule Documentation
  ctx.log('info', 'Generating schedule documentation');
  const scheduleDocumentation = await ctx.task(scheduleDocumentationTask, {
    projectId,
    wbsDevelopment,
    criticalPathAnalysis,
    resourceLoading,
    scheduleOptimization,
    milestones,
    outputDir
  });

  artifacts.push(...scheduleDocumentation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    schedule: {
      wbs: wbsDevelopment.wbs,
      activities: activityDefinition.activities,
      durations: durationEstimation.durations,
      sequences: activitySequencing.sequences,
      projectDuration: criticalPathAnalysis.projectDuration,
      startDate: scheduleOptimization.startDate,
      endDate: scheduleOptimization.endDate
    },
    criticalPath: criticalPathAnalysis.criticalPath,
    ganttCharts: scheduleDocumentation.ganttCharts,
    resourceHistograms: resourceLoading.histograms,
    milestoneReport: scheduleDocumentation.milestoneReport,
    artifacts,
    duration,
    metadata: {
      processId: 'civil-engineering/construction-schedule-development',
      timestamp: startTime,
      projectId,
      schedulingMethod,
      outputDir
    }
  };
}

// Task 1: WBS Development
export const wbsDevelopmentTask = defineTask('wbs-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop work breakdown structure',
  agent: {
    name: 'construction-manager',
    prompt: {
      role: 'project scheduler',
      task: 'Develop work breakdown structure',
      context: args,
      instructions: [
        'Define WBS levels (project, phase, deliverable, work package)',
        'Organize by construction phases',
        'Include all scope elements',
        'Assign WBS codes',
        'Define work packages',
        'Identify control accounts',
        'Create WBS dictionary',
        'Generate WBS diagram'
      ],
      outputFormat: 'JSON with WBS structure, dictionary'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'wbs', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        wbs: { type: 'array' },
        wbsDictionary: { type: 'object' },
        phases: { type: 'array' },
        workPackages: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'scheduling', 'wbs']
}));

// Task 2: Activity Definition
export const activityDefinitionTask = defineTask('activity-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define schedule activities',
  agent: {
    name: 'construction-manager',
    prompt: {
      role: 'project scheduler',
      task: 'Define construction activities',
      context: args,
      instructions: [
        'Decompose work packages into activities',
        'Define activity scope and deliverables',
        'Assign activity IDs',
        'Define activity types (task, milestone, summary)',
        'Identify procurement activities',
        'Identify submittal activities',
        'Group activities by area/discipline',
        'Create activity list'
      ],
      outputFormat: 'JSON with activity list, definitions'
    },
    outputSchema: {
      type: 'object',
      required: ['activities', 'activityCount', 'artifacts'],
      properties: {
        activities: { type: 'array' },
        activityCount: { type: 'number' },
        milestones: { type: 'array' },
        summaryActivities: { type: 'array' },
        procurementActivities: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'scheduling', 'activities']
}));

// Task 3: Duration Estimation
export const durationEstimationTask = defineTask('duration-estimation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Estimate activity durations',
  agent: {
    name: 'construction-manager',
    prompt: {
      role: 'project scheduler',
      task: 'Estimate activity durations',
      context: args,
      instructions: [
        'Calculate durations from quantities and productivity',
        'Consider crew sizes and equipment',
        'Account for weather and seasonal factors',
        'Apply learning curve adjustments',
        'Consider access and space constraints',
        'Develop three-point estimates where appropriate',
        'Document estimation basis',
        'Create duration summary'
      ],
      outputFormat: 'JSON with activity durations, basis'
    },
    outputSchema: {
      type: 'object',
      required: ['durations', 'artifacts'],
      properties: {
        durations: { type: 'object' },
        estimationBasis: { type: 'object' },
        productivityRates: { type: 'object' },
        weatherAdjustments: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'scheduling', 'durations']
}));

// Task 4: Activity Sequencing
export const activitySequencingTask = defineTask('activity-sequencing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Sequence activities',
  agent: {
    name: 'construction-manager',
    prompt: {
      role: 'project scheduler',
      task: 'Define activity sequences and dependencies',
      context: args,
      instructions: [
        'Identify mandatory dependencies (hard logic)',
        'Identify discretionary dependencies (soft logic)',
        'Define external dependencies',
        'Establish predecessor/successor relationships',
        'Apply lag and lead times',
        'Define dependency types (FS, SS, FF, SF)',
        'Document sequencing rationale',
        'Create network diagram'
      ],
      outputFormat: 'JSON with sequences, dependencies, network'
    },
    outputSchema: {
      type: 'object',
      required: ['sequences', 'artifacts'],
      properties: {
        sequences: { type: 'array' },
        dependencies: { type: 'array' },
        mandatoryDependencies: { type: 'array' },
        externalDependencies: { type: 'array' },
        lagsLeads: { type: 'object' },
        networkDiagram: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'scheduling', 'sequencing']
}));

// Task 5: Critical Path Analysis
export const criticalPathTask = defineTask('critical-path', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform critical path analysis',
  agent: {
    name: 'construction-manager',
    prompt: {
      role: 'project scheduler',
      task: 'Calculate critical path',
      context: args,
      instructions: [
        'Perform forward pass calculation',
        'Perform backward pass calculation',
        'Calculate total float for each activity',
        'Calculate free float',
        'Identify critical path activities',
        'Identify near-critical paths',
        'Calculate project duration',
        'Document critical path analysis'
      ],
      outputFormat: 'JSON with critical path, float analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['criticalPath', 'projectDuration', 'artifacts'],
      properties: {
        criticalPath: { type: 'array' },
        projectDuration: { type: 'number' },
        floatAnalysis: { type: 'object' },
        nearCriticalPaths: { type: 'array' },
        earlyDates: { type: 'object' },
        lateDates: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'scheduling', 'critical-path']
}));

// Task 6: Resource Loading
export const resourceLoadingTask = defineTask('resource-loading', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Load resources',
  agent: {
    name: 'construction-manager',
    prompt: {
      role: 'project scheduler',
      task: 'Load resources onto schedule',
      context: args,
      instructions: [
        'Assign labor resources to activities',
        'Assign equipment resources',
        'Assign material resources',
        'Check resource availability',
        'Identify resource conflicts',
        'Generate resource histograms',
        'Calculate peak resource requirements',
        'Create resource loading report'
      ],
      outputFormat: 'JSON with resource assignments, histograms'
    },
    outputSchema: {
      type: 'object',
      required: ['assignments', 'histograms', 'artifacts'],
      properties: {
        assignments: { type: 'object' },
        histograms: { type: 'array' },
        laborLoading: { type: 'object' },
        equipmentLoading: { type: 'object' },
        resourceConflicts: { type: 'array' },
        peakRequirements: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'scheduling', 'resources']
}));

// Task 7: Schedule Optimization
export const scheduleOptimizationTask = defineTask('schedule-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Optimize schedule',
  agent: {
    name: 'construction-manager',
    prompt: {
      role: 'project scheduler',
      task: 'Optimize construction schedule',
      context: args,
      instructions: [
        'Level resources to reduce peaks',
        'Compress schedule if needed (crashing)',
        'Apply fast-tracking opportunities',
        'Resolve resource conflicts',
        'Incorporate constraint dates',
        'Verify milestone dates',
        'Finalize baseline schedule',
        'Document optimization decisions'
      ],
      outputFormat: 'JSON with optimized schedule, changes'
    },
    outputSchema: {
      type: 'object',
      required: ['startDate', 'endDate', 'optimizedSchedule', 'artifacts'],
      properties: {
        startDate: { type: 'string' },
        endDate: { type: 'string' },
        optimizedSchedule: { type: 'object' },
        resourceLeveling: { type: 'object' },
        compressionAnalysis: { type: 'object' },
        fastTrackingOpportunities: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'scheduling', 'optimization']
}));

// Task 8: Schedule Documentation
export const scheduleDocumentationTask = defineTask('schedule-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate schedule documentation',
  agent: {
    name: 'technical-report-writer',
    prompt: {
      role: 'project scheduler',
      task: 'Generate schedule reports and documentation',
      context: args,
      instructions: [
        'Generate Gantt chart',
        'Generate milestone schedule',
        'Generate network diagram',
        'Create schedule narrative',
        'Generate resource reports',
        'Create cash flow projection',
        'Document schedule basis',
        'Create schedule submittal package'
      ],
      outputFormat: 'JSON with schedule documents, charts'
    },
    outputSchema: {
      type: 'object',
      required: ['ganttCharts', 'milestoneReport', 'artifacts'],
      properties: {
        ganttCharts: { type: 'array' },
        milestoneReport: { type: 'object' },
        networkDiagram: { type: 'object' },
        scheduleNarrative: { type: 'string' },
        resourceReports: { type: 'array' },
        cashFlowProjection: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'scheduling', 'documentation']
}));
