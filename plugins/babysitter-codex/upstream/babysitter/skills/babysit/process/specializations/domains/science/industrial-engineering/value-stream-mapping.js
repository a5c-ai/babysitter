/**
 * @process domains/science/industrial-engineering/value-stream-mapping
 * @description Value Stream Mapping and Analysis - Create current and future state value stream maps to identify waste,
 * improve flow, and develop implementation plans for lean transformation.
 * @inputs { productFamily: string, processScope?: object, currentMetrics?: object }
 * @outputs { success: boolean, currentStateMap: object, futureStateMap: object, implementationPlan: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('domains/science/industrial-engineering/value-stream-mapping', {
 *   productFamily: 'Widget Assembly Line',
 *   processScope: { start: 'raw-material', end: 'shipping' },
 *   currentMetrics: { leadTime: 15, valueAddedTime: 2 }
 * });
 *
 * @references
 * - Rother & Shook, Learning to See
 * - Womack & Jones, Lean Thinking
 * - Liker, The Toyota Way
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    productFamily,
    processScope = {},
    currentMetrics = {},
    taktTimeTarget = null,
    outputDir = 'vsm-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Value Stream Mapping and Analysis process');

  // Task 1: Product Family Selection
  ctx.log('info', 'Phase 1: Defining product family and value stream boundaries');
  const productFamilyDefinition = await ctx.task(productFamilyTask, {
    productFamily,
    processScope,
    outputDir
  });

  artifacts.push(...productFamilyDefinition.artifacts);

  // Task 2: Current State Data Collection
  ctx.log('info', 'Phase 2: Walking the process and collecting current state data');
  const currentStateData = await ctx.task(currentStateDataTask, {
    productFamilyDefinition,
    outputDir
  });

  artifacts.push(...currentStateData.artifacts);

  // Task 3: Current State Map Creation
  ctx.log('info', 'Phase 3: Creating current state value stream map');
  const currentStateMap = await ctx.task(currentStateMapTask, {
    currentStateData,
    currentMetrics,
    outputDir
  });

  artifacts.push(...currentStateMap.artifacts);

  // Breakpoint: Review current state
  await ctx.breakpoint({
    question: `Current state map complete. Lead time: ${currentStateMap.totalLeadTime} days, Value-added time: ${currentStateMap.valueAddedTime} hours, PCE: ${currentStateMap.processEfficiency.toFixed(1)}%. Review before future state design?`,
    title: 'Current State VSM Review',
    context: {
      runId: ctx.runId,
      metrics: {
        totalLeadTime: currentStateMap.totalLeadTime,
        valueAddedTime: currentStateMap.valueAddedTime,
        processEfficiency: currentStateMap.processEfficiency,
        inventoryLevels: currentStateMap.inventoryLevels
      },
      files: currentStateMap.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // Task 4: Waste Identification
  ctx.log('info', 'Phase 4: Identifying waste and improvement opportunities');
  const wasteIdentification = await ctx.task(wasteIdentificationTask, {
    currentStateMap,
    outputDir
  });

  artifacts.push(...wasteIdentification.artifacts);

  // Task 5: Future State Design
  ctx.log('info', 'Phase 5: Designing future state value stream');
  const futureStateDesign = await ctx.task(futureStateDesignTask, {
    currentStateMap,
    wasteIdentification,
    taktTimeTarget,
    outputDir
  });

  artifacts.push(...futureStateDesign.artifacts);

  // Task 6: Kaizen Burst Planning
  ctx.log('info', 'Phase 6: Planning kaizen improvement events');
  const kaizenPlanning = await ctx.task(kaizenPlanningTask, {
    currentStateMap,
    futureStateDesign,
    wasteIdentification,
    outputDir
  });

  artifacts.push(...kaizenPlanning.artifacts);

  // Task 7: Implementation Roadmap
  ctx.log('info', 'Phase 7: Creating implementation roadmap');
  const implementationRoadmap = await ctx.task(implementationRoadmapTask, {
    futureStateDesign,
    kaizenPlanning,
    outputDir
  });

  artifacts.push(...implementationRoadmap.artifacts);

  // Task 8: Metrics Dashboard
  ctx.log('info', 'Phase 8: Creating metrics tracking dashboard');
  const metricsDashboard = await ctx.task(metricsDashboardTask, {
    currentStateMap,
    futureStateDesign,
    implementationRoadmap,
    outputDir
  });

  artifacts.push(...metricsDashboard.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `VSM analysis complete. Expected lead time reduction: ${futureStateDesign.expectedLeadTimeReduction}%. ${kaizenPlanning.kaizenEvents.length} kaizen events planned. Review implementation roadmap?`,
    title: 'VSM Analysis Results',
    context: {
      runId: ctx.runId,
      summary: {
        currentLeadTime: currentStateMap.totalLeadTime,
        targetLeadTime: futureStateDesign.targetLeadTime,
        expectedReduction: futureStateDesign.expectedLeadTimeReduction,
        kaizenEventsPlanned: kaizenPlanning.kaizenEvents.length,
        implementationDuration: implementationRoadmap.totalDuration
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    currentStateMap: {
      totalLeadTime: currentStateMap.totalLeadTime,
      valueAddedTime: currentStateMap.valueAddedTime,
      processEfficiency: currentStateMap.processEfficiency,
      processes: currentStateMap.processes,
      inventoryLevels: currentStateMap.inventoryLevels
    },
    futureStateMap: {
      targetLeadTime: futureStateDesign.targetLeadTime,
      expectedImprovement: futureStateDesign.expectedLeadTimeReduction,
      flowConcepts: futureStateDesign.flowConcepts
    },
    wasteIdentified: wasteIdentification.wasteCategories,
    implementationPlan: implementationRoadmap.phases,
    kaizenEvents: kaizenPlanning.kaizenEvents,
    artifacts,
    duration,
    metadata: {
      processId: 'domains/science/industrial-engineering/value-stream-mapping',
      timestamp: startTime,
      productFamily,
      outputDir
    }
  };
}

// Task 1: Product Family Selection
export const productFamilyTask = defineTask('product-family-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define product family and value stream boundaries',
  agent: {
    name: 'lean-analyst',
    prompt: {
      role: 'Lean Manufacturing Specialist',
      task: 'Define product family and value stream boundaries',
      context: args,
      instructions: [
        '1. Analyze product mix and routing similarity',
        '2. Define product family for mapping',
        '3. Identify value stream start and end points',
        '4. Define customer requirements and demand',
        '5. Calculate takt time',
        '6. Identify key stakeholders',
        '7. Document scope and boundaries',
        '8. Create product-process matrix'
      ],
      outputFormat: 'JSON with product family definition and scope'
    },
    outputSchema: {
      type: 'object',
      required: ['productFamily', 'boundaries', 'taktTime', 'artifacts'],
      properties: {
        productFamily: { type: 'object' },
        boundaries: { type: 'object' },
        taktTime: { type: 'number' },
        customerDemand: { type: 'object' },
        productProcessMatrix: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'vsm', 'product-family']
}));

// Task 2: Current State Data Collection
export const currentStateDataTask = defineTask('current-state-data', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Collect current state data',
  agent: {
    name: 'process-observer',
    prompt: {
      role: 'Process Analyst',
      task: 'Walk the process and collect current state data',
      context: args,
      instructions: [
        '1. Walk the process from end to beginning',
        '2. Identify all process steps',
        '3. Collect cycle times for each step',
        '4. Count inventory at each point',
        '5. Document changeover times',
        '6. Record uptime and reliability',
        '7. Identify information flows',
        '8. Document material flows'
      ],
      outputFormat: 'JSON with process data and observations'
    },
    outputSchema: {
      type: 'object',
      required: ['processSteps', 'cycleTimes', 'inventoryLevels', 'artifacts'],
      properties: {
        processSteps: { type: 'array' },
        cycleTimes: { type: 'object' },
        inventoryLevels: { type: 'object' },
        changeoverTimes: { type: 'object' },
        uptimeData: { type: 'object' },
        informationFlows: { type: 'array' },
        materialFlows: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'vsm', 'data-collection']
}));

// Task 3: Current State Map
export const currentStateMapTask = defineTask('current-state-map', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create current state value stream map',
  agent: {
    name: 'vsm-mapper',
    prompt: {
      role: 'Value Stream Mapping Expert',
      task: 'Create current state value stream map with standard icons',
      context: args,
      instructions: [
        '1. Draw process boxes with data boxes',
        '2. Add inventory triangles between processes',
        '3. Draw material flow arrows',
        '4. Draw information flow arrows',
        '5. Add production control scheduling',
        '6. Create timeline at bottom',
        '7. Calculate total lead time',
        '8. Calculate process cycle efficiency'
      ],
      outputFormat: 'JSON with current state map data and metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['processes', 'totalLeadTime', 'valueAddedTime', 'processEfficiency', 'artifacts'],
      properties: {
        processes: { type: 'array' },
        inventoryLevels: { type: 'object' },
        totalLeadTime: { type: 'number' },
        valueAddedTime: { type: 'number' },
        processEfficiency: { type: 'number' },
        timeline: { type: 'object' },
        mapPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'vsm', 'current-state']
}));

// Task 4: Waste Identification
export const wasteIdentificationTask = defineTask('waste-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify waste and improvement opportunities',
  agent: {
    name: 'waste-analyst',
    prompt: {
      role: 'Lean Waste Analyst',
      task: 'Identify all forms of waste in the value stream',
      context: args,
      instructions: [
        '1. Identify overproduction waste',
        '2. Identify waiting/delay waste',
        '3. Identify transportation waste',
        '4. Identify over-processing waste',
        '5. Identify inventory waste',
        '6. Identify motion waste',
        '7. Identify defects/rework waste',
        '8. Quantify waste impact'
      ],
      outputFormat: 'JSON with waste categories and quantification'
    },
    outputSchema: {
      type: 'object',
      required: ['wasteCategories', 'wasteQuantification', 'artifacts'],
      properties: {
        wasteCategories: { type: 'array' },
        wasteQuantification: { type: 'object' },
        improvementOpportunities: { type: 'array' },
        prioritizedWaste: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'vsm', 'waste-identification']
}));

// Task 5: Future State Design
export const futureStateDesignTask = defineTask('future-state-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design future state value stream',
  agent: {
    name: 'future-state-designer',
    prompt: {
      role: 'Lean Transformation Expert',
      task: 'Design ideal future state value stream',
      context: args,
      instructions: [
        '1. Design to takt time',
        '2. Implement continuous flow where possible',
        '3. Use supermarkets for flow interruptions',
        '4. Establish pacemaker process',
        '5. Level the production mix',
        '6. Level the production volume',
        '7. Calculate new lead time target',
        '8. Document flow concepts applied'
      ],
      outputFormat: 'JSON with future state design and expected improvements'
    },
    outputSchema: {
      type: 'object',
      required: ['targetLeadTime', 'expectedLeadTimeReduction', 'flowConcepts', 'artifacts'],
      properties: {
        targetLeadTime: { type: 'number' },
        expectedLeadTimeReduction: { type: 'number' },
        flowConcepts: { type: 'array' },
        pacemakerProcess: { type: 'string' },
        supermarkets: { type: 'array' },
        fifoLanes: { type: 'array' },
        levelingStrategy: { type: 'object' },
        futureStateMapPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'vsm', 'future-state']
}));

// Task 6: Kaizen Planning
export const kaizenPlanningTask = defineTask('kaizen-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan kaizen improvement events',
  agent: {
    name: 'kaizen-planner',
    prompt: {
      role: 'Kaizen Facilitator',
      task: 'Plan kaizen burst events to achieve future state',
      context: args,
      instructions: [
        '1. Identify kaizen bursts on future state map',
        '2. Define scope for each kaizen event',
        '3. Prioritize kaizen events',
        '4. Define success metrics for each',
        '5. Estimate resources required',
        '6. Identify team members needed',
        '7. Sequence kaizen events',
        '8. Create kaizen event charters'
      ],
      outputFormat: 'JSON with kaizen events and charters'
    },
    outputSchema: {
      type: 'object',
      required: ['kaizenEvents', 'prioritization', 'artifacts'],
      properties: {
        kaizenEvents: { type: 'array' },
        prioritization: { type: 'array' },
        eventCharters: { type: 'array' },
        resourceRequirements: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'vsm', 'kaizen-planning']
}));

// Task 7: Implementation Roadmap
export const implementationRoadmapTask = defineTask('implementation-roadmap', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create implementation roadmap',
  agent: {
    name: 'implementation-planner',
    prompt: {
      role: 'Lean Implementation Manager',
      task: 'Create phased implementation roadmap',
      context: args,
      instructions: [
        '1. Define implementation phases',
        '2. Sequence improvements logically',
        '3. Define milestones and checkpoints',
        '4. Assign ownership and accountability',
        '5. Estimate timeline for each phase',
        '6. Identify dependencies',
        '7. Plan change management',
        '8. Create Gantt chart or timeline'
      ],
      outputFormat: 'JSON with implementation roadmap and timeline'
    },
    outputSchema: {
      type: 'object',
      required: ['phases', 'totalDuration', 'milestones', 'artifacts'],
      properties: {
        phases: { type: 'array' },
        totalDuration: { type: 'string' },
        milestones: { type: 'array' },
        dependencies: { type: 'array' },
        ownership: { type: 'object' },
        changeManagementPlan: { type: 'object' },
        roadmapPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'vsm', 'implementation']
}));

// Task 8: Metrics Dashboard
export const metricsDashboardTask = defineTask('metrics-dashboard', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create metrics tracking dashboard',
  agent: {
    name: 'metrics-designer',
    prompt: {
      role: 'Performance Measurement Specialist',
      task: 'Design metrics dashboard for tracking progress',
      context: args,
      instructions: [
        '1. Define key performance indicators',
        '2. Set baseline measurements',
        '3. Set target values',
        '4. Define measurement frequency',
        '5. Design visual dashboard layout',
        '6. Create tracking templates',
        '7. Define review cadence',
        '8. Document measurement procedures'
      ],
      outputFormat: 'JSON with dashboard design and metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['kpis', 'baselines', 'targets', 'artifacts'],
      properties: {
        kpis: { type: 'array' },
        baselines: { type: 'object' },
        targets: { type: 'object' },
        dashboardDesign: { type: 'object' },
        trackingTemplates: { type: 'array' },
        reviewSchedule: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'vsm', 'metrics']
}));
