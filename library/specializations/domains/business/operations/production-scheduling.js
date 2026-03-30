/**
 * @process specializations/domains/business/operations/production-scheduling
 * @description Production Scheduling Optimization Process - Develop and optimize production schedules considering
 * constraints, changeovers, due dates, and resource availability for efficient manufacturing operations.
 * @inputs { planningPeriod: string, orders?: array, resources?: array, objectives?: array }
 * @outputs { success: boolean, schedule: object, kpis: object, optimizationResults: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/operations/production-scheduling', {
 *   planningPeriod: 'weekly',
 *   orders: [{ id: 'ORD-001', product: 'A', quantity: 100, dueDate: '2024-01-15' }],
 *   resources: ['Line-1', 'Line-2'],
 *   objectives: ['on-time-delivery', 'minimize-changeovers']
 * });
 *
 * @references
 * - Pinedo, M.L. (2016). Scheduling: Theory, Algorithms, and Systems
 * - Hopp, W.J. & Spearman, M.L. (2011). Factory Physics
 * - APICS CPIM Body of Knowledge
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    planningPeriod = 'weekly',
    orders = [],
    resources = [],
    objectives = ['on-time-delivery'],
    constraints = [],
    schedulingMethod = 'finite',
    outputDir = 'scheduling-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Production Scheduling for period: ${planningPeriod}`);

  // Phase 1: Order Analysis
  ctx.log('info', 'Phase 1: Order Analysis and Prioritization');
  const orderAnalysis = await ctx.task(orderAnalysisTask, {
    orders,
    planningPeriod,
    outputDir
  });

  artifacts.push(...orderAnalysis.artifacts);

  // Phase 2: Resource Assessment
  ctx.log('info', 'Phase 2: Resource Availability Assessment');
  const resourceAssessment = await ctx.task(resourceAssessmentTask, {
    resources,
    planningPeriod,
    outputDir
  });

  artifacts.push(...resourceAssessment.artifacts);

  // Phase 3: Constraint Analysis
  ctx.log('info', 'Phase 3: Constraint Analysis');
  const constraintAnalysis = await ctx.task(constraintAnalysisTask, {
    orderAnalysis,
    resourceAssessment,
    constraints,
    outputDir
  });

  artifacts.push(...constraintAnalysis.artifacts);

  // Quality Gate: Scheduling Inputs Review
  await ctx.breakpoint({
    question: `Scheduling inputs: ${orderAnalysis.totalOrders} orders, ${resourceAssessment.totalResources} resources. Total load: ${orderAnalysis.totalHours}h, Available capacity: ${resourceAssessment.totalAvailableHours}h. ${constraintAnalysis.constraints.length} constraints identified. Proceed with scheduling?`,
    title: 'Scheduling Inputs Review',
    context: {
      runId: ctx.runId,
      orderSummary: orderAnalysis.summary,
      resourceSummary: resourceAssessment.summary,
      constraints: constraintAnalysis.constraints,
      files: [...orderAnalysis.artifacts, ...resourceAssessment.artifacts].map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 4: Changeover Analysis
  ctx.log('info', 'Phase 4: Changeover/Setup Analysis');
  const changeoverAnalysis = await ctx.task(changeoverAnalysisTask, {
    orderAnalysis,
    resources,
    outputDir
  });

  artifacts.push(...changeoverAnalysis.artifacts);

  // Phase 5: Initial Schedule Generation
  ctx.log('info', 'Phase 5: Initial Schedule Generation');
  const initialSchedule = await ctx.task(initialScheduleTask, {
    orderAnalysis,
    resourceAssessment,
    constraintAnalysis,
    changeoverAnalysis,
    schedulingMethod,
    outputDir
  });

  artifacts.push(...initialSchedule.artifacts);

  // Phase 6: Schedule Optimization
  ctx.log('info', 'Phase 6: Schedule Optimization');
  const optimization = await ctx.task(scheduleOptimizationTask, {
    initialSchedule,
    objectives,
    constraintAnalysis,
    outputDir
  });

  artifacts.push(...optimization.artifacts);

  // Quality Gate: Optimized Schedule Review
  await ctx.breakpoint({
    question: `Schedule optimized. On-time delivery: ${optimization.kpis.onTimeDelivery}%. Utilization: ${optimization.kpis.utilization}%. Changeovers: ${optimization.kpis.totalChangeovers}. Review before finalization?`,
    title: 'Optimized Schedule Review',
    context: {
      runId: ctx.runId,
      kpis: optimization.kpis,
      improvements: optimization.improvements,
      files: optimization.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 7: Bottleneck Analysis
  ctx.log('info', 'Phase 7: Bottleneck Analysis');
  const bottleneckAnalysis = await ctx.task(bottleneckAnalysisTask, {
    optimization,
    resourceAssessment,
    outputDir
  });

  artifacts.push(...bottleneckAnalysis.artifacts);

  // Phase 8: What-If Scenarios
  ctx.log('info', 'Phase 8: What-If Scenario Analysis');
  const scenarioAnalysis = await ctx.task(scenarioAnalysisTask, {
    optimization,
    orderAnalysis,
    resourceAssessment,
    outputDir
  });

  artifacts.push(...scenarioAnalysis.artifacts);

  // Phase 9: Schedule Finalization
  ctx.log('info', 'Phase 9: Schedule Finalization');
  const finalSchedule = await ctx.task(finalScheduleTask, {
    optimization,
    bottleneckAnalysis,
    scenarioAnalysis,
    planningPeriod,
    outputDir
  });

  artifacts.push(...finalSchedule.artifacts);

  // Phase 10: Dispatch List Generation
  ctx.log('info', 'Phase 10: Dispatch List Generation');
  const dispatchList = await ctx.task(dispatchListTask, {
    finalSchedule,
    resources,
    outputDir
  });

  artifacts.push(...dispatchList.artifacts);

  // Phase 11: Report Generation
  ctx.log('info', 'Phase 11: Report Generation');
  const report = await ctx.task(reportTask, {
    orderAnalysis,
    resourceAssessment,
    constraintAnalysis,
    optimization,
    bottleneckAnalysis,
    scenarioAnalysis,
    finalSchedule,
    dispatchList,
    outputDir
  });

  artifacts.push(...report.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    planningPeriod,
    schedule: {
      scheduledOrders: finalSchedule.scheduledOrders,
      byResource: finalSchedule.scheduleByResource,
      timeline: finalSchedule.timeline
    },
    kpis: {
      onTimeDelivery: optimization.kpis.onTimeDelivery,
      utilization: optimization.kpis.utilization,
      totalChangeovers: optimization.kpis.totalChangeovers,
      makespan: optimization.kpis.makespan,
      averageFlowTime: optimization.kpis.averageFlowTime
    },
    optimizationResults: {
      improvementsAchieved: optimization.improvements,
      objectiveValues: optimization.objectiveValues
    },
    bottlenecks: bottleneckAnalysis.bottlenecks,
    dispatchList: dispatchList.list,
    artifacts,
    reportPath: report.reportPath,
    duration,
    metadata: {
      processId: 'specializations/domains/business/operations/production-scheduling',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: Order Analysis
export const orderAnalysisTask = defineTask('scheduling-orders', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Production Scheduling - Order Analysis',
  agent: {
    name: 'order-analyst',
    prompt: {
      role: 'Production Order Analyst',
      task: 'Analyze orders for scheduling',
      context: args,
      instructions: [
        '1. List all orders to be scheduled',
        '2. Calculate required production hours per order',
        '3. Apply routing/standard times',
        '4. Calculate due date slack',
        '5. Prioritize orders (customer priority, margin, due date)',
        '6. Identify rush/expedite orders',
        '7. Group orders by product family',
        '8. Calculate total load (hours)',
        '9. Identify order dependencies',
        '10. Document order analysis'
      ],
      outputFormat: 'JSON with order analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['orders', 'totalOrders', 'totalHours', 'summary', 'artifacts'],
      properties: {
        orders: { type: 'array', items: { type: 'object' } },
        totalOrders: { type: 'number' },
        totalHours: { type: 'number' },
        prioritizedOrders: { type: 'array', items: { type: 'object' } },
        ordersByFamily: { type: 'object' },
        rushOrders: { type: 'array', items: { type: 'object' } },
        summary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scheduling', 'orders']
}));

// Task 2: Resource Assessment
export const resourceAssessmentTask = defineTask('scheduling-resources', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Production Scheduling - Resource Assessment',
  agent: {
    name: 'resource-analyst',
    prompt: {
      role: 'Resource Planning Analyst',
      task: 'Assess resource availability for scheduling',
      context: args,
      instructions: [
        '1. List all available resources (machines, lines, cells)',
        '2. Calculate available hours per resource',
        '3. Account for planned maintenance',
        '4. Account for shifts and breaks',
        '5. Identify resource capabilities',
        '6. Calculate efficiency factors',
        '7. Identify shared resources',
        '8. Map resource to product capabilities',
        '9. Calculate total available capacity',
        '10. Document resource assessment'
      ],
      outputFormat: 'JSON with resource assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['resources', 'totalResources', 'totalAvailableHours', 'summary', 'artifacts'],
      properties: {
        resources: { type: 'array', items: { type: 'object' } },
        totalResources: { type: 'number' },
        totalAvailableHours: { type: 'number' },
        resourceCapabilities: { type: 'object' },
        plannedMaintenance: { type: 'array', items: { type: 'object' } },
        efficiencyFactors: { type: 'object' },
        summary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scheduling', 'resources']
}));

// Task 3: Constraint Analysis
export const constraintAnalysisTask = defineTask('scheduling-constraints', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Production Scheduling - Constraint Analysis',
  agent: {
    name: 'constraint-analyst',
    prompt: {
      role: 'Scheduling Constraint Analyst',
      task: 'Identify and analyze scheduling constraints',
      context: args,
      instructions: [
        '1. Identify hard constraints (must be satisfied)',
        '2. Identify soft constraints (preferences)',
        '3. Analyze resource capacity constraints',
        '4. Identify sequence-dependent constraints',
        '5. Identify material availability constraints',
        '6. Identify labor/skill constraints',
        '7. Identify tool/fixture constraints',
        '8. Analyze customer/due date constraints',
        '9. Prioritize constraints',
        '10. Document constraint analysis'
      ],
      outputFormat: 'JSON with constraint analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['constraints', 'hardConstraints', 'softConstraints', 'artifacts'],
      properties: {
        constraints: { type: 'array', items: { type: 'object' } },
        hardConstraints: { type: 'array', items: { type: 'object' } },
        softConstraints: { type: 'array', items: { type: 'object' } },
        capacityConstraints: { type: 'array', items: { type: 'object' } },
        sequenceConstraints: { type: 'array', items: { type: 'object' } },
        constraintPriorities: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scheduling', 'constraints']
}));

// Task 4: Changeover Analysis
export const changeoverAnalysisTask = defineTask('scheduling-changeovers', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Production Scheduling - Changeover Analysis',
  agent: {
    name: 'changeover-analyst',
    prompt: {
      role: 'Changeover Analysis Specialist',
      task: 'Analyze setup/changeover times and sequences',
      context: args,
      instructions: [
        '1. Create changeover matrix (product to product)',
        '2. Identify sequence-dependent changeovers',
        '3. Calculate changeover times',
        '4. Identify changeover reduction opportunities',
        '5. Create product families for grouping',
        '6. Calculate total potential changeover time',
        '7. Identify optimal sequencing patterns',
        '8. Calculate changeover costs',
        '9. Identify SMED opportunities',
        '10. Document changeover analysis'
      ],
      outputFormat: 'JSON with changeover analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['changeoverMatrix', 'averageChangeover', 'sequenceRecommendations', 'artifacts'],
      properties: {
        changeoverMatrix: { type: 'object' },
        averageChangeover: { type: 'number' },
        sequenceRecommendations: { type: 'array', items: { type: 'object' } },
        productFamilies: { type: 'object' },
        totalChangeoverTime: { type: 'number' },
        smedOpportunities: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scheduling', 'changeovers']
}));

// Task 5: Initial Schedule
export const initialScheduleTask = defineTask('scheduling-initial', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Production Scheduling - Initial Schedule',
  agent: {
    name: 'scheduler',
    prompt: {
      role: 'Production Scheduler',
      task: 'Generate initial production schedule',
      context: args,
      instructions: [
        '1. Apply scheduling algorithm (earliest due date, priority)',
        '2. Load orders onto resources',
        '3. Apply forward or backward scheduling',
        '4. Account for setup/changeover times',
        '5. Respect hard constraints',
        '6. Calculate start/end times for each order',
        '7. Identify schedule conflicts',
        '8. Calculate initial KPIs',
        '9. Create Gantt chart representation',
        '10. Document initial schedule'
      ],
      outputFormat: 'JSON with initial schedule'
    },
    outputSchema: {
      type: 'object',
      required: ['schedule', 'scheduledOrders', 'conflicts', 'initialKpis', 'artifacts'],
      properties: {
        schedule: { type: 'object' },
        scheduledOrders: { type: 'array', items: { type: 'object' } },
        conflicts: { type: 'array', items: { type: 'object' } },
        lateOrders: { type: 'array', items: { type: 'object' } },
        initialKpis: { type: 'object' },
        ganttChart: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scheduling', 'initial']
}));

// Task 6: Schedule Optimization
export const scheduleOptimizationTask = defineTask('scheduling-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Production Scheduling - Optimization',
  agent: {
    name: 'optimizer',
    prompt: {
      role: 'Schedule Optimization Specialist',
      task: 'Optimize production schedule',
      context: args,
      instructions: [
        '1. Apply optimization algorithm',
        '2. Minimize changeovers through sequencing',
        '3. Maximize on-time delivery',
        '4. Balance resource utilization',
        '5. Minimize makespan where applicable',
        '6. Apply heuristics for improvement',
        '7. Evaluate multiple objective trade-offs',
        '8. Calculate optimized KPIs',
        '9. Document improvements achieved',
        '10. Generate optimized schedule'
      ],
      outputFormat: 'JSON with optimized schedule'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizedSchedule', 'kpis', 'improvements', 'objectiveValues', 'artifacts'],
      properties: {
        optimizedSchedule: { type: 'object' },
        kpis: {
          type: 'object',
          properties: {
            onTimeDelivery: { type: 'number' },
            utilization: { type: 'number' },
            totalChangeovers: { type: 'number' },
            makespan: { type: 'number' },
            averageFlowTime: { type: 'number' }
          }
        },
        improvements: { type: 'array', items: { type: 'object' } },
        objectiveValues: { type: 'object' },
        tradeOffs: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scheduling', 'optimization']
}));

// Task 7: Bottleneck Analysis
export const bottleneckAnalysisTask = defineTask('scheduling-bottleneck', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Production Scheduling - Bottleneck Analysis',
  agent: {
    name: 'bottleneck-analyst',
    prompt: {
      role: 'Bottleneck Analyst',
      task: 'Identify bottlenecks in schedule',
      context: args,
      instructions: [
        '1. Analyze resource utilization',
        '2. Identify overloaded resources',
        '3. Identify constraint resources',
        '4. Calculate queue times at bottleneck',
        '5. Analyze bottleneck impact on delivery',
        '6. Identify bottleneck relief options',
        '7. Calculate cost of bottleneck',
        '8. Recommend capacity additions if needed',
        '9. Suggest schedule adjustments',
        '10. Document bottleneck analysis'
      ],
      outputFormat: 'JSON with bottleneck analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['bottlenecks', 'utilizationByResource', 'recommendations', 'artifacts'],
      properties: {
        bottlenecks: { type: 'array', items: { type: 'object' } },
        utilizationByResource: { type: 'object' },
        queueTimes: { type: 'object' },
        bottleneckImpact: { type: 'object' },
        reliefOptions: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scheduling', 'bottleneck']
}));

// Task 8: Scenario Analysis
export const scenarioAnalysisTask = defineTask('scheduling-scenarios', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Production Scheduling - Scenario Analysis',
  agent: {
    name: 'scenario-analyst',
    prompt: {
      role: 'What-If Scenario Analyst',
      task: 'Analyze schedule under different scenarios',
      context: args,
      instructions: [
        '1. Define what-if scenarios',
        '2. Analyze rush order insertion',
        '3. Analyze machine breakdown impact',
        '4. Analyze demand increase scenario',
        '5. Analyze resource addition scenario',
        '6. Calculate schedule robustness',
        '7. Identify schedule vulnerabilities',
        '8. Develop contingency recommendations',
        '9. Quantify scenario impacts',
        '10. Document scenario analysis'
      ],
      outputFormat: 'JSON with scenario analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['scenarios', 'robustnessScore', 'contingencies', 'artifacts'],
      properties: {
        scenarios: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenario: { type: 'string' },
              impact: { type: 'object' },
              mitigation: { type: 'string' }
            }
          }
        },
        robustnessScore: { type: 'number' },
        vulnerabilities: { type: 'array', items: { type: 'object' } },
        contingencies: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scheduling', 'scenarios']
}));

// Task 9: Final Schedule
export const finalScheduleTask = defineTask('scheduling-final', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Production Scheduling - Final Schedule',
  agent: {
    name: 'schedule-finalizer',
    prompt: {
      role: 'Schedule Finalizer',
      task: 'Finalize production schedule',
      context: args,
      instructions: [
        '1. Incorporate optimization results',
        '2. Add schedule buffers where needed',
        '3. Lock critical orders',
        '4. Generate final timeline',
        '5. Create schedule by resource',
        '6. Create schedule by date',
        '7. Generate Gantt chart',
        '8. Calculate final KPIs',
        '9. Prepare for release',
        '10. Document final schedule'
      ],
      outputFormat: 'JSON with final schedule'
    },
    outputSchema: {
      type: 'object',
      required: ['scheduledOrders', 'scheduleByResource', 'timeline', 'finalKpis', 'artifacts'],
      properties: {
        scheduledOrders: { type: 'array', items: { type: 'object' } },
        scheduleByResource: { type: 'object' },
        scheduleByDate: { type: 'object' },
        timeline: { type: 'array', items: { type: 'object' } },
        ganttChart: { type: 'object' },
        finalKpis: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scheduling', 'final']
}));

// Task 10: Dispatch List
export const dispatchListTask = defineTask('scheduling-dispatch', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Production Scheduling - Dispatch List',
  agent: {
    name: 'dispatch-generator',
    prompt: {
      role: 'Dispatch List Generator',
      task: 'Generate dispatch lists for shop floor',
      context: args,
      instructions: [
        '1. Create dispatch list per resource',
        '2. Sequence jobs by start time',
        '3. Include all relevant details',
        '4. Add setup requirements',
        '5. Add material requirements',
        '6. Add tooling requirements',
        '7. Format for shop floor use',
        '8. Include priority indicators',
        '9. Add notes and special instructions',
        '10. Generate printable format'
      ],
      outputFormat: 'JSON with dispatch lists'
    },
    outputSchema: {
      type: 'object',
      required: ['list', 'byResource', 'artifacts'],
      properties: {
        list: { type: 'array', items: { type: 'object' } },
        byResource: { type: 'object' },
        priorityJobs: { type: 'array', items: { type: 'object' } },
        setupRequirements: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scheduling', 'dispatch']
}));

// Task 11: Report
export const reportTask = defineTask('scheduling-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Production Scheduling - Report',
  agent: {
    name: 'report-writer',
    prompt: {
      role: 'Technical Report Writer',
      task: 'Generate production scheduling report',
      context: args,
      instructions: [
        '1. Write executive summary',
        '2. Present order analysis',
        '3. Document resource utilization',
        '4. Present schedule KPIs',
        '5. Include Gantt chart',
        '6. Document bottleneck analysis',
        '7. Present scenario analysis',
        '8. Include dispatch lists',
        '9. Add recommendations',
        '10. Format professionally'
      ],
      outputFormat: 'JSON with report details'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummary', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyMetrics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scheduling', 'reporting']
}));
