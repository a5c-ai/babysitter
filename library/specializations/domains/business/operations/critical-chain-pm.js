/**
 * @process specializations/domains/business/operations/critical-chain-pm
 * @description Critical Chain Project Management (CCPM) implementation based on Theory of Constraints.
 *              Focuses on resource contention, buffer management, and protecting project completion
 *              through feeding buffers, project buffers, and resource buffers.
 * @inputs {
 *   projectContext: { projectName: string, projectType: string, complexity: string },
 *   projectPlan: { tasks: object[], dependencies: object[], resourceRequirements: object },
 *   resourceData: { resources: object[], availability: object, skillMatrix: object },
 *   bufferPolicy: { projectBufferPercent: number, feedingBufferPercent: number },
 *   constraints: { deadline: string, budget: number, scopeItems: string[] }
 * }
 * @outputs {
 *   criticalChain: { chainTasks: object[], chainLength: number, resourceConflicts: object[] },
 *   bufferPlan: { projectBuffer: object, feedingBuffers: object[], resourceBuffers: object[] },
 *   schedule: { baselineSchedule: object, bufferedSchedule: object, milestones: object[] },
 *   bufferManagement: { monitoringPlan: object, recoveryActions: object[], reportingCadence: object }
 * }
 * @example
 * // Input
 * {
 *   projectContext: { projectName: "ERP-Implementation", projectType: "IT", complexity: "high" },
 *   projectPlan: { tasks: [...], dependencies: [...], resourceRequirements: {...} },
 *   resourceData: { resources: [...], availability: {...}, skillMatrix: {...} },
 *   bufferPolicy: { projectBufferPercent: 50, feedingBufferPercent: 50 },
 *   constraints: { deadline: "2024-12-31", budget: 2000000, scopeItems: [...] }
 * }
 * @references Critical Chain (Goldratt), CCPM Implementation Guide, TOC Project Management
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectContext, projectPlan, resourceData, bufferPolicy, constraints } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  // Phase 1: Task Duration Analysis
  const durationAnalysis = await ctx.task(analyzeTaskDurations, {
    projectPlan,
    projectContext
  });
  artifacts.push({ phase: 'duration-analysis', output: durationAnalysis });

  // Phase 2: Network Diagram Construction
  const networkDiagram = await ctx.task(constructNetworkDiagram, {
    projectPlan,
    durationAnalysis
  });
  artifacts.push({ phase: 'network-diagram', output: networkDiagram });

  // Phase 3: Resource Leveling and Conflict Resolution
  const resourceLeveling = await ctx.task(levelResources, {
    networkDiagram,
    resourceData,
    projectPlan
  });
  artifacts.push({ phase: 'resource-leveling', output: resourceLeveling });

  // Phase 4: Critical Chain Identification
  const criticalChain = await ctx.task(identifyCriticalChain, {
    networkDiagram,
    resourceLeveling,
    durationAnalysis
  });
  artifacts.push({ phase: 'critical-chain', output: criticalChain });

  // Quality Gate: Critical Chain Review
  await ctx.breakpoint('critical-chain-review', {
    title: 'Critical Chain Review',
    description: 'Review and validate the identified critical chain before buffer insertion',
    artifacts: [criticalChain, resourceLeveling]
  });

  // Phase 5: Project Buffer Sizing
  const projectBuffer = await ctx.task(sizeProjectBuffer, {
    criticalChain,
    bufferPolicy,
    constraints
  });
  artifacts.push({ phase: 'project-buffer', output: projectBuffer });

  // Phase 6: Feeding Buffer Insertion
  const feedingBuffers = await ctx.task(insertFeedingBuffers, {
    criticalChain,
    networkDiagram,
    bufferPolicy
  });
  artifacts.push({ phase: 'feeding-buffers', output: feedingBuffers });

  // Phase 7: Resource Buffer Planning
  const resourceBuffers = await ctx.task(planResourceBuffers, {
    criticalChain,
    resourceData,
    resourceLeveling
  });
  artifacts.push({ phase: 'resource-buffers', output: resourceBuffers });

  // Phase 8: Buffered Schedule Creation
  const bufferedSchedule = await ctx.task(createBufferedSchedule, {
    criticalChain,
    projectBuffer,
    feedingBuffers,
    resourceBuffers,
    constraints
  });
  artifacts.push({ phase: 'buffered-schedule', output: bufferedSchedule });

  // Phase 9: Buffer Management System Design
  const bufferManagementSystem = await ctx.task(designBufferManagement, {
    projectBuffer,
    feedingBuffers,
    bufferedSchedule
  });
  artifacts.push({ phase: 'buffer-management-system', output: bufferManagementSystem });

  // Phase 10: Execution Guidelines Development
  const executionGuidelines = await ctx.task(developExecutionGuidelines, {
    criticalChain,
    bufferManagementSystem,
    resourceData
  });
  artifacts.push({ phase: 'execution-guidelines', output: executionGuidelines });

  // Phase 11: Reporting and Dashboard Design
  const reportingDesign = await ctx.task(designReporting, {
    bufferManagementSystem,
    bufferedSchedule,
    projectContext
  });
  artifacts.push({ phase: 'reporting-design', output: reportingDesign });

  // Final Quality Gate: CCPM Plan Approval
  await ctx.breakpoint('ccpm-plan-approval', {
    title: 'CCPM Plan Approval',
    description: 'Final approval of the complete CCPM plan before execution',
    artifacts: [bufferedSchedule, bufferManagementSystem, executionGuidelines]
  });

  return {
    success: true,
    criticalChain: {
      chainTasks: criticalChain.chainTasks,
      chainLength: criticalChain.chainLength,
      resourceConflicts: resourceLeveling.resolvedConflicts
    },
    bufferPlan: {
      projectBuffer,
      feedingBuffers,
      resourceBuffers
    },
    schedule: bufferedSchedule,
    bufferManagement: bufferManagementSystem,
    executionGuidelines,
    reportingDesign,
    artifacts,
    metadata: {
      processId: 'critical-chain-pm',
      startTime,
      endTime: ctx.now(),
      projectContext
    }
  };
}

export const analyzeTaskDurations = defineTask('analyze-task-durations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Task Durations',
  agent: {
    name: 'duration-analyst',
    prompt: {
      role: 'Project scheduling specialist with CCPM expertise',
      task: 'Analyze and adjust task durations removing hidden safety',
      context: {
        projectPlan: args.projectPlan,
        projectContext: args.projectContext
      },
      instructions: [
        'Review original task duration estimates',
        'Identify embedded safety time in estimates',
        'Calculate aggressive (50% probability) durations',
        'Document safety removed from each task',
        'Create duration reduction summary',
        'Note tasks with high uncertainty'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        originalDurations: { type: 'object' },
        aggressiveDurations: { type: 'object' },
        safetyRemoved: { type: 'object' },
        highUncertaintyTasks: { type: 'array' },
        totalReduction: { type: 'number' }
      },
      required: ['originalDurations', 'aggressiveDurations', 'safetyRemoved']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'duration', 'analysis']
}));

export const constructNetworkDiagram = defineTask('construct-network-diagram', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Construct Network Diagram',
  agent: {
    name: 'network-planner',
    prompt: {
      role: 'Project network planning specialist',
      task: 'Construct the project network diagram with dependencies',
      context: {
        projectPlan: args.projectPlan,
        durationAnalysis: args.durationAnalysis
      },
      instructions: [
        'Map all task dependencies',
        'Identify parallel paths',
        'Calculate early start and early finish',
        'Calculate late start and late finish',
        'Determine float for each task',
        'Identify the critical path (before resource leveling)'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        networkNodes: { type: 'array' },
        dependencies: { type: 'array' },
        criticalPath: { type: 'array' },
        parallelPaths: { type: 'array' },
        floatAnalysis: { type: 'object' }
      },
      required: ['networkNodes', 'dependencies', 'criticalPath']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'network', 'planning']
}));

export const levelResources = defineTask('level-resources', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Level Resources',
  agent: {
    name: 'resource-leveler',
    prompt: {
      role: 'Resource management specialist',
      task: 'Level resources and resolve resource conflicts',
      context: {
        networkDiagram: args.networkDiagram,
        resourceData: args.resourceData,
        projectPlan: args.projectPlan
      },
      instructions: [
        'Identify resource contention points',
        'Apply resource leveling heuristics',
        'Resolve conflicts by task prioritization',
        'Document resource-driven dependencies',
        'Recalculate schedule with resource constraints',
        'Identify strategic resources (drum resources)'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        resourceConflicts: { type: 'array' },
        resolvedConflicts: { type: 'array' },
        resourceDependencies: { type: 'array' },
        leveledSchedule: { type: 'object' },
        drumResources: { type: 'array' }
      },
      required: ['resourceConflicts', 'resolvedConflicts', 'leveledSchedule']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'resource', 'leveling']
}));

export const identifyCriticalChain = defineTask('identify-critical-chain', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify Critical Chain',
  agent: {
    name: 'critical-chain-analyst',
    prompt: {
      role: 'Critical Chain specialist',
      task: 'Identify the critical chain considering both dependencies and resources',
      context: {
        networkDiagram: args.networkDiagram,
        resourceLeveling: args.resourceLeveling,
        durationAnalysis: args.durationAnalysis
      },
      instructions: [
        'Analyze leveled schedule for longest chain',
        'Include resource dependencies in chain',
        'Distinguish critical chain from critical path',
        'Identify feeding chains',
        'Document chain characteristics',
        'Calculate total chain length'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        chainTasks: { type: 'array' },
        chainLength: { type: 'number' },
        feedingChains: { type: 'array' },
        chainCharacteristics: { type: 'object' },
        criticalPathComparison: { type: 'object' }
      },
      required: ['chainTasks', 'chainLength', 'feedingChains']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'critical-chain', 'identification']
}));

export const sizeProjectBuffer = defineTask('size-project-buffer', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Size Project Buffer',
  agent: {
    name: 'buffer-sizing-specialist',
    prompt: {
      role: 'CCPM buffer sizing expert',
      task: 'Calculate and size the project buffer',
      context: {
        criticalChain: args.criticalChain,
        bufferPolicy: args.bufferPolicy,
        constraints: args.constraints
      },
      instructions: [
        'Apply buffer sizing method (cut-and-paste or SSQ)',
        'Calculate project buffer from aggregated safety',
        'Consider project risk factors',
        'Validate buffer against deadline constraint',
        'Define buffer consumption thresholds',
        'Document buffer sizing rationale'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        bufferSize: { type: 'number' },
        sizingMethod: { type: 'string' },
        safetyAggregated: { type: 'number' },
        thresholds: { type: 'object' },
        deadlineValidation: { type: 'object' },
        rationale: { type: 'string' }
      },
      required: ['bufferSize', 'sizingMethod', 'thresholds']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'project-buffer', 'sizing']
}));

export const insertFeedingBuffers = defineTask('insert-feeding-buffers', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Insert Feeding Buffers',
  agent: {
    name: 'feeding-buffer-specialist',
    prompt: {
      role: 'CCPM feeding buffer expert',
      task: 'Calculate and insert feeding buffers at chain merge points',
      context: {
        criticalChain: args.criticalChain,
        networkDiagram: args.networkDiagram,
        bufferPolicy: args.bufferPolicy
      },
      instructions: [
        'Identify all feeding chain merge points',
        'Calculate feeding buffer for each chain',
        'Position buffers at merge points',
        'Size buffers based on feeding chain length',
        'Define feeding buffer thresholds',
        'Document buffer placement rationale'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        feedingBuffers: { type: 'array' },
        mergePoints: { type: 'array' },
        bufferSizes: { type: 'object' },
        bufferThresholds: { type: 'object' },
        placementRationale: { type: 'array' }
      },
      required: ['feedingBuffers', 'mergePoints', 'bufferSizes']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'feeding-buffer', 'insertion']
}));

export const planResourceBuffers = defineTask('plan-resource-buffers', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan Resource Buffers',
  agent: {
    name: 'resource-buffer-planner',
    prompt: {
      role: 'Resource buffer planning specialist',
      task: 'Plan resource buffers for critical chain tasks',
      context: {
        criticalChain: args.criticalChain,
        resourceData: args.resourceData,
        resourceLeveling: args.resourceLeveling
      },
      instructions: [
        'Identify critical chain resource handoffs',
        'Calculate resource buffer timing',
        'Design advance notification system',
        'Plan resource readiness protocols',
        'Define backup resource strategies',
        'Document resource buffer procedures'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        resourceBuffers: { type: 'array' },
        handoffPoints: { type: 'array' },
        notificationSchedule: { type: 'object' },
        readinessProtocols: { type: 'object' },
        backupStrategies: { type: 'array' }
      },
      required: ['resourceBuffers', 'handoffPoints', 'notificationSchedule']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'resource-buffer', 'planning']
}));

export const createBufferedSchedule = defineTask('create-buffered-schedule', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Buffered Schedule',
  agent: {
    name: 'schedule-creator',
    prompt: {
      role: 'CCPM schedule specialist',
      task: 'Create the final buffered project schedule',
      context: {
        criticalChain: args.criticalChain,
        projectBuffer: args.projectBuffer,
        feedingBuffers: args.feedingBuffers,
        resourceBuffers: args.resourceBuffers,
        constraints: args.constraints
      },
      instructions: [
        'Integrate all buffers into schedule',
        'Calculate project completion date',
        'Create baseline schedule',
        'Define key milestones',
        'Validate against constraints',
        'Document schedule assumptions'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        baselineSchedule: { type: 'object' },
        bufferedSchedule: { type: 'object' },
        completionDate: { type: 'string' },
        milestones: { type: 'array' },
        constraintValidation: { type: 'object' },
        assumptions: { type: 'array' }
      },
      required: ['baselineSchedule', 'bufferedSchedule', 'completionDate', 'milestones']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'schedule', 'creation']
}));

export const designBufferManagement = defineTask('design-buffer-management', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design Buffer Management System',
  agent: {
    name: 'buffer-management-designer',
    prompt: {
      role: 'Buffer management system designer',
      task: 'Design the buffer management and monitoring system',
      context: {
        projectBuffer: args.projectBuffer,
        feedingBuffers: args.feedingBuffers,
        bufferedSchedule: args.bufferedSchedule
      },
      instructions: [
        'Design buffer status tracking mechanisms',
        'Create buffer penetration monitoring',
        'Define action triggers for each zone',
        'Design recovery action protocols',
        'Establish buffer reporting frequency',
        'Create escalation procedures'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        trackingMechanisms: { type: 'object' },
        penetrationMonitoring: { type: 'object' },
        actionTriggers: { type: 'object' },
        recoveryProtocols: { type: 'array' },
        reportingFrequency: { type: 'object' },
        escalationProcedures: { type: 'array' }
      },
      required: ['trackingMechanisms', 'penetrationMonitoring', 'actionTriggers']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'buffer-management', 'design']
}));

export const developExecutionGuidelines = defineTask('develop-execution-guidelines', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Execution Guidelines',
  agent: {
    name: 'execution-guidelines-developer',
    prompt: {
      role: 'Project execution specialist',
      task: 'Develop CCPM execution guidelines and behaviors',
      context: {
        criticalChain: args.criticalChain,
        bufferManagementSystem: args.bufferManagementSystem,
        resourceData: args.resourceData
      },
      instructions: [
        'Define relay race behavior expectations',
        'Create task handoff protocols',
        'Establish no-multitasking policy',
        'Design roadrunner mentality guidelines',
        'Create full-kit readiness requirements',
        'Document student syndrome prevention'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        relayRaceBehaviors: { type: 'object' },
        handoffProtocols: { type: 'array' },
        multitaskingPolicy: { type: 'object' },
        roadrunnerGuidelines: { type: 'object' },
        fullKitRequirements: { type: 'array' },
        behaviorExpectations: { type: 'array' }
      },
      required: ['relayRaceBehaviors', 'handoffProtocols', 'behaviorExpectations']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'execution', 'guidelines']
}));

export const designReporting = defineTask('design-reporting', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design Reporting and Dashboards',
  agent: {
    name: 'reporting-designer',
    prompt: {
      role: 'Project reporting and dashboard specialist',
      task: 'Design CCPM reporting and dashboard systems',
      context: {
        bufferManagementSystem: args.bufferManagementSystem,
        bufferedSchedule: args.bufferedSchedule,
        projectContext: args.projectContext
      },
      instructions: [
        'Design fever chart for project buffer',
        'Create feeding buffer status displays',
        'Design task status reporting',
        'Create executive dashboard',
        'Define reporting templates',
        'Establish report distribution list'
      ]
    },
    outputSchema: {
      type: 'object',
      properties: {
        feverChart: { type: 'object' },
        bufferDisplays: { type: 'object' },
        taskStatusReporting: { type: 'object' },
        executiveDashboard: { type: 'object' },
        reportTemplates: { type: 'array' },
        distributionList: { type: 'array' }
      },
      required: ['feverChart', 'executiveDashboard', 'reportTemplates']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'reporting', 'dashboard']
}));
