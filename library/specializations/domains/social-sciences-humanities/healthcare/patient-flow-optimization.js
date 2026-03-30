/**
 * @process specializations/domains/social-sciences-humanities/healthcare/patient-flow-optimization
 * @description Patient Flow Optimization Process - Systematic approach to managing patient movement through
 * healthcare facilities using Lean principles to reduce wait times, improve throughput, and enhance patient experience.
 * @inputs { facilityName: string, targetArea?: string, currentMetrics?: object, constraints?: array }
 * @outputs { success: boolean, flowAnalysis: object, improvements: array, implementationPlan: object, artifacts: array }
 *
 * @recommendedSkills SK-HC-001 (clinical-workflow-analysis), SK-HC-012 (workforce-demand-forecasting)
 * @recommendedAgents AG-HC-007 (operations-excellence-director), AG-HC-006 (care-management-coordinator)
 *
 * @example
 * const result = await orchestrate('specializations/domains/social-sciences-humanities/healthcare/patient-flow-optimization', {
 *   facilityName: 'General Hospital Emergency Department',
 *   targetArea: 'ED to Inpatient Admission',
 *   currentMetrics: { avgWaitTime: 180, throughput: 50, bedTurnaround: 45 },
 *   constraints: ['staffing levels', 'bed capacity']
 * });
 *
 * @references
 * - IHI (2003). Optimizing Patient Flow
 * - Litvak, E. (2010). Managing Patient Flow in Hospitals
 * - Womack, J. & Jones, D. (2003). Lean Thinking
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    facilityName,
    targetArea = 'entire facility',
    currentMetrics = {},
    constraints = [],
    stakeholders = [],
    timeline = null,
    outputDir = 'patient-flow-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Patient Flow Optimization for: ${facilityName}`);

  // Phase 1: Current State Assessment
  ctx.log('info', 'Phase 1: Current State Assessment');
  const currentState = await ctx.task(currentStateAssessmentTask, {
    facilityName,
    targetArea,
    currentMetrics,
    outputDir
  });

  artifacts.push(...currentState.artifacts);

  await ctx.breakpoint({
    question: `Current state mapped. Avg door-to-door time: ${currentState.doorToDoorTime} min. Key bottlenecks identified: ${currentState.bottlenecks.length}. Proceed with demand analysis?`,
    title: 'Current State Assessment Review',
    context: {
      runId: ctx.runId,
      facilityName,
      flowMap: currentState.flowMap,
      bottlenecks: currentState.bottlenecks,
      files: currentState.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 2: Demand and Capacity Analysis
  ctx.log('info', 'Phase 2: Demand and Capacity Analysis');
  const demandAnalysis = await ctx.task(demandCapacityAnalysisTask, {
    currentState,
    constraints,
    outputDir
  });

  artifacts.push(...demandAnalysis.artifacts);

  // Phase 3: Value Stream Mapping
  ctx.log('info', 'Phase 3: Value Stream Mapping');
  const valueStream = await ctx.task(valueStreamMappingTask, {
    currentState,
    demandAnalysis,
    outputDir
  });

  artifacts.push(...valueStream.artifacts);

  await ctx.breakpoint({
    question: `Value stream mapped. Value-add ratio: ${valueStream.valueAddRatio}%. ${valueStream.wasteAreas.length} waste areas identified. Proceed with improvement design?`,
    title: 'Value Stream Analysis Review',
    context: {
      runId: ctx.runId,
      valueStreamMap: valueStream.vsm,
      wasteAreas: valueStream.wasteAreas,
      files: valueStream.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 4: Bottleneck Analysis
  ctx.log('info', 'Phase 4: Bottleneck Analysis');
  const bottleneckAnalysis = await ctx.task(bottleneckAnalysisTask, {
    currentState,
    valueStream,
    demandAnalysis,
    outputDir
  });

  artifacts.push(...bottleneckAnalysis.artifacts);

  // Phase 5: Future State Design
  ctx.log('info', 'Phase 5: Future State Design');
  const futureState = await ctx.task(futureStateDesignTask, {
    currentState,
    valueStream,
    bottleneckAnalysis,
    constraints,
    outputDir
  });

  artifacts.push(...futureState.artifacts);

  await ctx.breakpoint({
    question: `Future state designed. Projected wait time reduction: ${futureState.projectedImprovement}%. ${futureState.interventions.length} interventions proposed. Approve implementation planning?`,
    title: 'Future State Design Review',
    context: {
      runId: ctx.runId,
      futureStateMap: futureState.futureStateMap,
      interventions: futureState.interventions,
      projectedMetrics: futureState.projectedMetrics,
      files: futureState.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 6: Implementation Planning
  ctx.log('info', 'Phase 6: Implementation Planning');
  const implementationPlan = await ctx.task(implementationPlanningTask, {
    futureState,
    stakeholders,
    timeline,
    outputDir
  });

  artifacts.push(...implementationPlan.artifacts);

  // Phase 7: Metrics and Monitoring Design
  ctx.log('info', 'Phase 7: Metrics and Monitoring Design');
  const monitoring = await ctx.task(monitoringDesignTask, {
    currentState,
    futureState,
    outputDir
  });

  artifacts.push(...monitoring.artifacts);

  // Phase 8: Report Generation
  ctx.log('info', 'Phase 8: Final Report Generation');
  const report = await ctx.task(patientFlowReportTask, {
    facilityName,
    currentState,
    demandAnalysis,
    valueStream,
    bottleneckAnalysis,
    futureState,
    implementationPlan,
    monitoring,
    outputDir
  });

  artifacts.push(...report.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    facilityName,
    targetArea,
    flowAnalysis: {
      currentState: currentState.flowMap,
      futureState: futureState.futureStateMap,
      valueStreamMap: valueStream.vsm,
      bottlenecks: bottleneckAnalysis.rankedBottlenecks
    },
    metrics: {
      current: currentState.metrics,
      projected: futureState.projectedMetrics,
      improvement: futureState.projectedImprovement
    },
    improvements: futureState.interventions,
    implementationPlan: implementationPlan.plan,
    monitoringPlan: monitoring.monitoringPlan,
    artifacts,
    reportPath: report.reportPath,
    duration,
    metadata: {
      processId: 'specializations/domains/social-sciences-humanities/healthcare/patient-flow-optimization',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: Current State Assessment
// Uses: SK-HC-001 (clinical-workflow-analysis)
export const currentStateAssessmentTask = defineTask('pfo-current-state', (args, taskCtx) => ({
  kind: 'agent',
  title: `Patient Flow Current State - ${args.facilityName}`,
  agent: {
    name: 'operations-excellence-director', // AG-HC-007
    prompt: {
      role: 'Lean Healthcare Specialist',
      task: 'Assess current state of patient flow',
      context: args,
      instructions: [
        '1. Map current patient flow from arrival to discharge',
        '2. Document all process steps and handoffs',
        '3. Measure cycle times for each step',
        '4. Identify wait times between steps',
        '5. Calculate door-to-door time',
        '6. Identify visible bottlenecks',
        '7. Document current staffing patterns',
        '8. Review existing metrics and KPIs',
        '9. Interview staff about pain points',
        '10. Create current state flow diagram'
      ],
      outputFormat: 'JSON with current state analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['flowMap', 'metrics', 'bottlenecks', 'doorToDoorTime', 'artifacts'],
      properties: {
        flowMap: { type: 'object' },
        metrics: { type: 'object' },
        bottlenecks: { type: 'array', items: { type: 'object' } },
        doorToDoorTime: { type: 'number' },
        cycleTimes: { type: 'object' },
        waitTimes: { type: 'object' },
        staffingPatterns: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'patient-flow', 'current-state', 'healthcare']
}));

// Task 2: Demand and Capacity Analysis
// Uses: SK-HC-012 (workforce-demand-forecasting)
export const demandCapacityAnalysisTask = defineTask('pfo-demand-capacity', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Patient Flow Demand-Capacity Analysis',
  agent: {
    name: 'operations-excellence-director', // AG-HC-007
    prompt: {
      role: 'Healthcare Operations Analyst',
      task: 'Analyze demand patterns and capacity',
      context: args,
      instructions: [
        '1. Analyze patient arrival patterns by hour/day',
        '2. Identify peak demand periods',
        '3. Calculate capacity at each process step',
        '4. Identify demand-capacity mismatches',
        '5. Analyze variability in demand',
        '6. Assess resource utilization rates',
        '7. Model queuing dynamics',
        '8. Identify artificial variability sources',
        '9. Calculate optimal capacity levels',
        '10. Document demand-capacity gaps'
      ],
      outputFormat: 'JSON with demand-capacity analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['demandPatterns', 'capacityAnalysis', 'gaps', 'artifacts'],
      properties: {
        demandPatterns: { type: 'object' },
        peakPeriods: { type: 'array', items: { type: 'object' } },
        capacityAnalysis: { type: 'object' },
        utilizationRates: { type: 'object' },
        gaps: { type: 'array', items: { type: 'object' } },
        variabilitySources: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'patient-flow', 'demand-capacity', 'healthcare']
}));

// Task 3: Value Stream Mapping
// Uses: SK-HC-001 (clinical-workflow-analysis)
export const valueStreamMappingTask = defineTask('pfo-value-stream', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Patient Flow Value Stream Mapping',
  agent: {
    name: 'operations-excellence-director', // AG-HC-007
    prompt: {
      role: 'Lean Value Stream Facilitator',
      task: 'Create value stream map for patient flow',
      context: args,
      instructions: [
        '1. Identify value-adding vs non-value-adding steps',
        '2. Calculate value-add ratio',
        '3. Document information flows',
        '4. Map material/supply flows',
        '5. Identify the 8 wastes (DOWNTIME)',
        '6. Calculate takt time',
        '7. Identify flow interruptions',
        '8. Document push vs pull points',
        '9. Create visual value stream map',
        '10. Prioritize waste elimination opportunities'
      ],
      outputFormat: 'JSON with value stream analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['vsm', 'valueAddRatio', 'wasteAreas', 'artifacts'],
      properties: {
        vsm: { type: 'object' },
        valueAddRatio: { type: 'number' },
        valueAddSteps: { type: 'array', items: { type: 'object' } },
        nonValueAddSteps: { type: 'array', items: { type: 'object' } },
        wasteAreas: { type: 'array', items: { type: 'object' } },
        taktTime: { type: 'number' },
        informationFlows: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'patient-flow', 'value-stream', 'lean']
}));

// Task 4: Bottleneck Analysis
// Uses: SK-HC-001 (clinical-workflow-analysis)
export const bottleneckAnalysisTask = defineTask('pfo-bottleneck', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Patient Flow Bottleneck Analysis',
  agent: {
    name: 'operations-excellence-director', // AG-HC-007
    prompt: {
      role: 'Theory of Constraints Analyst',
      task: 'Identify and analyze flow bottlenecks',
      context: args,
      instructions: [
        '1. Identify system constraint (bottleneck)',
        '2. Analyze root causes of bottleneck',
        '3. Quantify bottleneck impact',
        '4. Map upstream and downstream effects',
        '5. Apply Theory of Constraints principles',
        '6. Identify secondary bottlenecks',
        '7. Analyze bottleneck variability',
        '8. Calculate throughput impact',
        '9. Prioritize bottlenecks by impact',
        '10. Document bottleneck mitigation options'
      ],
      outputFormat: 'JSON with bottleneck analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['primaryBottleneck', 'rankedBottlenecks', 'mitigationOptions', 'artifacts'],
      properties: {
        primaryBottleneck: { type: 'object' },
        rankedBottlenecks: { type: 'array', items: { type: 'object' } },
        rootCauses: { type: 'object' },
        throughputImpact: { type: 'object' },
        mitigationOptions: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'patient-flow', 'bottleneck', 'toc']
}));

// Task 5: Future State Design
// Uses: SK-HC-001 (clinical-workflow-analysis)
export const futureStateDesignTask = defineTask('pfo-future-state', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Patient Flow Future State Design',
  agent: {
    name: 'operations-excellence-director', // AG-HC-007
    prompt: {
      role: 'Healthcare Process Designer',
      task: 'Design optimized future state patient flow',
      context: args,
      instructions: [
        '1. Design ideal patient flow pathway',
        '2. Apply lean principles (flow, pull, perfection)',
        '3. Design interventions for each bottleneck',
        '4. Create parallel processing where possible',
        '5. Design visual management systems',
        '6. Plan capacity smoothing strategies',
        '7. Design standardized work processes',
        '8. Project improved metrics',
        '9. Calculate ROI for interventions',
        '10. Create future state flow diagram'
      ],
      outputFormat: 'JSON with future state design'
    },
    outputSchema: {
      type: 'object',
      required: ['futureStateMap', 'interventions', 'projectedMetrics', 'projectedImprovement', 'artifacts'],
      properties: {
        futureStateMap: { type: 'object' },
        interventions: { type: 'array', items: { type: 'object' } },
        projectedMetrics: { type: 'object' },
        projectedImprovement: { type: 'number' },
        roi: { type: 'object' },
        standardWork: { type: 'array', items: { type: 'object' } },
        visualManagement: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'patient-flow', 'future-state', 'design']
}));

// Task 6: Implementation Planning
// Uses: SK-HC-001 (clinical-workflow-analysis)
export const implementationPlanningTask = defineTask('pfo-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Patient Flow Implementation Planning',
  agent: {
    name: 'care-management-coordinator', // AG-HC-006
    prompt: {
      role: 'Healthcare Implementation Planner',
      task: 'Develop implementation plan for flow improvements',
      context: args,
      instructions: [
        '1. Sequence interventions by priority and dependencies',
        '2. Create detailed project timeline',
        '3. Identify resource requirements',
        '4. Plan change management approach',
        '5. Design pilot testing strategy',
        '6. Identify risks and mitigation plans',
        '7. Plan stakeholder communication',
        '8. Define success criteria for each phase',
        '9. Create RACI matrix',
        '10. Develop sustainability plan'
      ],
      outputFormat: 'JSON with implementation plan'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'timeline', 'resources', 'artifacts'],
      properties: {
        plan: { type: 'object' },
        timeline: { type: 'object' },
        resources: { type: 'object' },
        changeManagement: { type: 'object' },
        pilotStrategy: { type: 'object' },
        risks: { type: 'array', items: { type: 'object' } },
        raci: { type: 'object' },
        sustainabilityPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'patient-flow', 'implementation', 'planning']
}));

// Task 7: Monitoring Design
// Uses: SK-HC-002 (quality-metrics-measurement)
export const monitoringDesignTask = defineTask('pfo-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Patient Flow Monitoring Design',
  agent: {
    name: 'operations-excellence-director', // AG-HC-007
    prompt: {
      role: 'Healthcare Performance Analyst',
      task: 'Design monitoring system for patient flow',
      context: args,
      instructions: [
        '1. Define key performance indicators (KPIs)',
        '2. Set targets for each metric',
        '3. Design real-time monitoring dashboard',
        '4. Create escalation protocols',
        '5. Design daily management system',
        '6. Plan data collection methods',
        '7. Design control charts for key metrics',
        '8. Create standard response protocols',
        '9. Plan regular review cadence',
        '10. Design continuous improvement process'
      ],
      outputFormat: 'JSON with monitoring design'
    },
    outputSchema: {
      type: 'object',
      required: ['monitoringPlan', 'kpis', 'dashboard', 'artifacts'],
      properties: {
        monitoringPlan: { type: 'object' },
        kpis: { type: 'array', items: { type: 'object' } },
        targets: { type: 'object' },
        dashboard: { type: 'object' },
        escalationProtocols: { type: 'object' },
        dailyManagement: { type: 'object' },
        controlCharts: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'patient-flow', 'monitoring', 'kpi']
}));

// Task 8: Report Generation
// Uses: SK-HC-001 (clinical-workflow-analysis)
export const patientFlowReportTask = defineTask('pfo-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Patient Flow Optimization Report',
  agent: {
    name: 'operations-excellence-director', // AG-HC-007
    prompt: {
      role: 'Healthcare Report Writer',
      task: 'Generate comprehensive patient flow optimization report',
      context: args,
      instructions: [
        '1. Write executive summary',
        '2. Document current state findings',
        '3. Present value stream analysis',
        '4. Detail bottleneck analysis',
        '5. Describe future state design',
        '6. Present implementation roadmap',
        '7. Include projected ROI',
        '8. Document monitoring plan',
        '9. Add appendices with detailed data',
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
        keyFindings: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'patient-flow', 'report', 'healthcare']
}));
