/**
 * @process specializations/domains/business/operations/spc-implementation
 * @description Statistical Process Control Implementation Process - Implement control charts (X-bar R, I-MR, p-charts),
 * establish control limits, monitor process stability, and respond to special cause variation.
 * @inputs { processName: string, measurementType?: string, subgroupSize?: number, specifications?: object }
 * @outputs { success: boolean, controlCharts: array, controlLimits: object, stabilityAnalysis: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/operations/spc-implementation', {
 *   processName: 'CNC Machining Diameter',
 *   measurementType: 'variable',
 *   subgroupSize: 5,
 *   specifications: { lsl: 24.95, usl: 25.05, target: 25.00 }
 * });
 *
 * @references
 * - Montgomery, D.C. (2019). Introduction to Statistical Quality Control
 * - Wheeler, D.J. (1995). Understanding Variation
 * - Western Electric (1956). Statistical Quality Control Handbook
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    processName,
    measurementType = 'variable',
    subgroupSize = 5,
    specifications = null,
    samplingFrequency = null,
    historicalData = null,
    outputDir = 'spc-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting SPC Implementation for: ${processName}`);

  // Phase 1: Process Assessment
  ctx.log('info', 'Phase 1: Process Assessment and Data Type Selection');
  const assessment = await ctx.task(processAssessmentTask, {
    processName,
    measurementType,
    subgroupSize,
    specifications,
    outputDir
  });

  artifacts.push(...assessment.artifacts);

  // Phase 2: Measurement System Analysis
  ctx.log('info', 'Phase 2: Measurement System Analysis');
  const msa = await ctx.task(msaTask, {
    processName,
    assessment,
    outputDir
  });

  artifacts.push(...msa.artifacts);

  // Quality Gate: MSA Results
  await ctx.breakpoint({
    question: `MSA complete. Gage R&R: ${msa.gageRR}%. ${msa.acceptable ? 'ACCEPTABLE' : 'NOT ACCEPTABLE - measurement system needs improvement'}. Proceed with data collection?`,
    title: 'Measurement System Analysis Review',
    context: {
      runId: ctx.runId,
      processName,
      gageRR: msa.gageRR,
      acceptable: msa.acceptable,
      files: msa.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 3: Data Collection
  ctx.log('info', 'Phase 3: Data Collection for Control Chart');
  const dataCollection = await ctx.task(dataCollectionTask, {
    processName,
    assessment,
    subgroupSize,
    samplingFrequency,
    historicalData,
    outputDir
  });

  artifacts.push(...dataCollection.artifacts);

  // Phase 4: Chart Selection
  ctx.log('info', 'Phase 4: Control Chart Selection');
  const chartSelection = await ctx.task(chartSelectionTask, {
    processName,
    measurementType,
    subgroupSize,
    dataCollection,
    outputDir
  });

  artifacts.push(...chartSelection.artifacts);

  // Phase 5: Control Limit Calculation
  ctx.log('info', 'Phase 5: Control Limit Calculation');
  const controlLimits = await ctx.task(controlLimitCalculationTask, {
    processName,
    chartSelection,
    dataCollection,
    outputDir
  });

  artifacts.push(...controlLimits.artifacts);

  // Phase 6: Initial Stability Analysis
  ctx.log('info', 'Phase 6: Initial Stability Analysis');
  const stabilityAnalysis = await ctx.task(stabilityAnalysisTask, {
    processName,
    controlLimits,
    dataCollection,
    outputDir
  });

  artifacts.push(...stabilityAnalysis.artifacts);

  // Quality Gate: Stability Review
  await ctx.breakpoint({
    question: `Initial stability analysis complete. Process ${stabilityAnalysis.isStable ? 'IS STABLE' : 'IS NOT STABLE'}. Out-of-control points: ${stabilityAnalysis.outOfControlPoints}. Special causes: ${stabilityAnalysis.specialCauses.length}. ${stabilityAnalysis.isStable ? 'Proceed with capability study?' : 'Address special causes before proceeding?'}`,
    title: 'Process Stability Review',
    context: {
      runId: ctx.runId,
      processName,
      isStable: stabilityAnalysis.isStable,
      outOfControlPoints: stabilityAnalysis.outOfControlPoints,
      specialCauses: stabilityAnalysis.specialCauses,
      westernElectricRules: stabilityAnalysis.rulesViolated,
      files: stabilityAnalysis.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 7: Process Capability Analysis (if stable)
  let capabilityAnalysis = null;
  if (specifications && stabilityAnalysis.isStable) {
    ctx.log('info', 'Phase 7: Process Capability Analysis');
    capabilityAnalysis = await ctx.task(capabilityAnalysisTask, {
      processName,
      controlLimits,
      dataCollection,
      specifications,
      outputDir
    });

    artifacts.push(...capabilityAnalysis.artifacts);
  }

  // Phase 8: Response Plan Development
  ctx.log('info', 'Phase 8: Response Plan Development');
  const responsePlan = await ctx.task(responsePlanTask, {
    processName,
    chartSelection,
    controlLimits,
    outputDir
  });

  artifacts.push(...responsePlan.artifacts);

  // Phase 9: Training Materials
  ctx.log('info', 'Phase 9: Training Materials Development');
  const training = await ctx.task(trainingTask, {
    processName,
    chartSelection,
    controlLimits,
    responsePlan,
    outputDir
  });

  artifacts.push(...training.artifacts);

  // Phase 10: Implementation Plan
  ctx.log('info', 'Phase 10: Implementation and Rollout Plan');
  const implementation = await ctx.task(implementationPlanTask, {
    processName,
    chartSelection,
    controlLimits,
    responsePlan,
    training,
    outputDir
  });

  artifacts.push(...implementation.artifacts);

  // Phase 11: Report Generation
  ctx.log('info', 'Phase 11: Report Generation');
  const report = await ctx.task(reportTask, {
    processName,
    assessment,
    msa,
    chartSelection,
    controlLimits,
    stabilityAnalysis,
    capabilityAnalysis,
    responsePlan,
    implementation,
    outputDir
  });

  artifacts.push(...report.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    processName,
    controlCharts: [{
      type: chartSelection.primaryChart,
      secondaryChart: chartSelection.secondaryChart,
      subgroupSize: chartSelection.subgroupSize
    }],
    controlLimits: {
      primaryChart: controlLimits.primaryChartLimits,
      secondaryChart: controlLimits.secondaryChartLimits
    },
    stabilityAnalysis: {
      isStable: stabilityAnalysis.isStable,
      outOfControlPoints: stabilityAnalysis.outOfControlPoints,
      specialCauses: stabilityAnalysis.specialCauses,
      rulesViolated: stabilityAnalysis.rulesViolated
    },
    processCapability: capabilityAnalysis ? {
      cp: capabilityAnalysis.cp,
      cpk: capabilityAnalysis.cpk,
      ppk: capabilityAnalysis.ppk,
      sigmaLevel: capabilityAnalysis.sigmaLevel
    } : null,
    msaResults: {
      gageRR: msa.gageRR,
      acceptable: msa.acceptable
    },
    responsePlan: responsePlan.plan,
    artifacts,
    reportPath: report.reportPath,
    duration,
    metadata: {
      processId: 'specializations/domains/business/operations/spc-implementation',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: Process Assessment
export const processAssessmentTask = defineTask('spc-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `SPC Process Assessment - ${args.processName}`,
  agent: {
    name: 'quality-engineer',
    prompt: {
      role: 'Quality Engineer',
      task: 'Assess process for SPC implementation',
      context: args,
      instructions: [
        '1. Identify quality characteristic to monitor',
        '2. Determine measurement type (variable vs attribute)',
        '3. Define measurement units and precision',
        '4. Identify subgrouping strategy (rational subgroups)',
        '5. Determine sampling frequency',
        '6. Review specification limits if available',
        '7. Assess data collection capability',
        '8. Identify potential sources of variation',
        '9. Document process parameters',
        '10. Create assessment report'
      ],
      outputFormat: 'JSON with assessment results'
    },
    outputSchema: {
      type: 'object',
      required: ['characteristic', 'measurementType', 'subgroupStrategy', 'artifacts'],
      properties: {
        characteristic: { type: 'string' },
        measurementType: { type: 'string', enum: ['variable', 'attribute'] },
        measurementUnit: { type: 'string' },
        subgroupStrategy: { type: 'object' },
        samplingPlan: { type: 'object' },
        specifications: { type: 'object' },
        variationSources: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'spc', 'assessment']
}));

// Task 2: Measurement System Analysis
export const msaTask = defineTask('spc-msa', (args, taskCtx) => ({
  kind: 'agent',
  title: `Measurement System Analysis - ${args.processName}`,
  agent: {
    name: 'msa-analyst',
    prompt: {
      role: 'Measurement System Analyst',
      task: 'Conduct Gage R&R study',
      context: args,
      instructions: [
        '1. Design Gage R&R study (crossed or nested)',
        '2. Select parts, operators, and trials',
        '3. Conduct measurement study',
        '4. Calculate repeatability (equipment variation)',
        '5. Calculate reproducibility (appraiser variation)',
        '6. Calculate total Gage R&R %',
        '7. Calculate number of distinct categories',
        '8. Determine measurement system adequacy',
        '9. Recommend improvements if needed',
        '10. Document MSA results'
      ],
      outputFormat: 'JSON with MSA results'
    },
    outputSchema: {
      type: 'object',
      required: ['gageRR', 'acceptable', 'components', 'artifacts'],
      properties: {
        gageRR: { type: 'number', description: 'Total Gage R&R percentage' },
        repeatability: { type: 'number' },
        reproducibility: { type: 'number' },
        partToPartVariation: { type: 'number' },
        ndc: { type: 'number', description: 'Number of distinct categories' },
        acceptable: { type: 'boolean' },
        components: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'spc', 'msa', 'gage-rr']
}));

// Task 3: Data Collection
export const dataCollectionTask = defineTask('spc-data-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: `SPC Data Collection - ${args.processName}`,
  agent: {
    name: 'data-collector',
    prompt: {
      role: 'SPC Data Analyst',
      task: 'Collect data for control chart setup',
      context: args,
      instructions: [
        '1. Create data collection form',
        '2. Collect minimum 25-30 subgroups',
        '3. Record subgroup data with timestamps',
        '4. Note any process changes or events',
        '5. Calculate subgroup statistics (mean, range/std dev)',
        '6. Check for data integrity',
        '7. Identify any obvious outliers',
        '8. Document collection conditions',
        '9. Validate data completeness',
        '10. Prepare data for analysis'
      ],
      outputFormat: 'JSON with collected data'
    },
    outputSchema: {
      type: 'object',
      required: ['subgroups', 'subgroupStatistics', 'artifacts'],
      properties: {
        subgroups: { type: 'array', items: { type: 'object' } },
        subgroupStatistics: {
          type: 'object',
          properties: {
            means: { type: 'array', items: { type: 'number' } },
            ranges: { type: 'array', items: { type: 'number' } },
            stdDevs: { type: 'array', items: { type: 'number' } }
          }
        },
        grandMean: { type: 'number' },
        averageRange: { type: 'number' },
        processEvents: { type: 'array', items: { type: 'object' } },
        dataQuality: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'spc', 'data-collection']
}));

// Task 4: Chart Selection
export const chartSelectionTask = defineTask('spc-chart-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Control Chart Selection - ${args.processName}`,
  agent: {
    name: 'spc-specialist',
    prompt: {
      role: 'SPC Specialist',
      task: 'Select appropriate control chart type',
      context: args,
      instructions: [
        '1. Review data type (variable vs attribute)',
        '2. Consider subgroup size',
        '3. For variables: X-bar R (n<10), X-bar S (n>=10), I-MR (n=1)',
        '4. For attributes: p-chart, np-chart, c-chart, u-chart',
        '5. Consider special charts (EWMA, CUSUM) if needed',
        '6. Validate selection rationale',
        '7. Document chart selection criteria',
        '8. Define chart parameters',
        '9. Specify plotting rules',
        '10. Document selection decision'
      ],
      outputFormat: 'JSON with chart selection'
    },
    outputSchema: {
      type: 'object',
      required: ['primaryChart', 'secondaryChart', 'subgroupSize', 'artifacts'],
      properties: {
        primaryChart: { type: 'string' },
        secondaryChart: { type: 'string' },
        subgroupSize: { type: 'number' },
        selectionRationale: { type: 'string' },
        chartParameters: { type: 'object' },
        specialCharts: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'spc', 'chart-selection']
}));

// Task 5: Control Limit Calculation
export const controlLimitCalculationTask = defineTask('spc-control-limits', (args, taskCtx) => ({
  kind: 'agent',
  title: `Control Limit Calculation - ${args.processName}`,
  agent: {
    name: 'statistician',
    prompt: {
      role: 'Statistical Analyst',
      task: 'Calculate control limits for selected charts',
      context: args,
      instructions: [
        '1. Apply appropriate control limit formulas',
        '2. For X-bar: UCL = X-double-bar + A2*R-bar',
        '3. For R chart: UCL = D4*R-bar, LCL = D3*R-bar',
        '4. For I-MR: Use appropriate constants',
        '5. For attribute charts: Use appropriate formulas',
        '6. Calculate center line',
        '7. Calculate warning limits (optional)',
        '8. Round appropriately for practical use',
        '9. Verify calculations',
        '10. Document control limits'
      ],
      outputFormat: 'JSON with control limits'
    },
    outputSchema: {
      type: 'object',
      required: ['primaryChartLimits', 'secondaryChartLimits', 'artifacts'],
      properties: {
        primaryChartLimits: {
          type: 'object',
          properties: {
            ucl: { type: 'number' },
            cl: { type: 'number' },
            lcl: { type: 'number' },
            uwl: { type: 'number' },
            lwl: { type: 'number' }
          }
        },
        secondaryChartLimits: {
          type: 'object',
          properties: {
            ucl: { type: 'number' },
            cl: { type: 'number' },
            lcl: { type: 'number' }
          }
        },
        controlFactors: { type: 'object' },
        calculations: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'spc', 'control-limits']
}));

// Task 6: Stability Analysis
export const stabilityAnalysisTask = defineTask('spc-stability', (args, taskCtx) => ({
  kind: 'agent',
  title: `Stability Analysis - ${args.processName}`,
  agent: {
    name: 'spc-analyst',
    prompt: {
      role: 'SPC Analyst',
      task: 'Analyze process stability using Western Electric rules',
      context: args,
      instructions: [
        '1. Plot data on control charts',
        '2. Check Rule 1: Point beyond control limits',
        '3. Check Rule 2: 9 points in a row on same side',
        '4. Check Rule 3: 6 points in a row trending',
        '5. Check Rule 4: 14 points alternating up/down',
        '6. Check Rule 5: 2 of 3 points beyond 2 sigma',
        '7. Check Rule 6: 4 of 5 points beyond 1 sigma',
        '8. Check Rule 7: 15 points within 1 sigma (stratification)',
        '9. Check Rule 8: 8 points beyond 1 sigma both sides',
        '10. Document all violations and special causes'
      ],
      outputFormat: 'JSON with stability analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['isStable', 'outOfControlPoints', 'specialCauses', 'rulesViolated', 'artifacts'],
      properties: {
        isStable: { type: 'boolean' },
        outOfControlPoints: { type: 'number' },
        specialCauses: { type: 'array', items: { type: 'object' } },
        rulesViolated: { type: 'array', items: { type: 'object' } },
        controlChartPlot: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'spc', 'stability']
}));

// Task 7: Capability Analysis
export const capabilityAnalysisTask = defineTask('spc-capability', (args, taskCtx) => ({
  kind: 'agent',
  title: `Process Capability Analysis - ${args.processName}`,
  agent: {
    name: 'capability-analyst',
    prompt: {
      role: 'Process Capability Analyst',
      task: 'Calculate process capability indices',
      context: args,
      instructions: [
        '1. Verify process stability first',
        '2. Calculate Cp (potential capability)',
        '3. Calculate Cpk (actual capability)',
        '4. Calculate Pp (process performance)',
        '5. Calculate Ppk (process performance index)',
        '6. Calculate expected defect rate (PPM)',
        '7. Calculate sigma level',
        '8. Assess capability against requirements',
        '9. Identify improvement opportunities',
        '10. Document capability analysis'
      ],
      outputFormat: 'JSON with capability analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['cp', 'cpk', 'ppk', 'sigmaLevel', 'artifacts'],
      properties: {
        cp: { type: 'number' },
        cpk: { type: 'number' },
        pp: { type: 'number' },
        ppk: { type: 'number' },
        sigmaLevel: { type: 'number' },
        expectedPPM: { type: 'number' },
        capabilityAssessment: { type: 'string' },
        improvementOpportunities: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'spc', 'capability']
}));

// Task 8: Response Plan
export const responsePlanTask = defineTask('spc-response-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `SPC Response Plan - ${args.processName}`,
  agent: {
    name: 'response-planner',
    prompt: {
      role: 'Process Control Specialist',
      task: 'Develop out-of-control action plan (OCAP)',
      context: args,
      instructions: [
        '1. Define response for each Western Electric rule',
        '2. Create flowchart for out-of-control response',
        '3. Define immediate containment actions',
        '4. Define investigation procedures',
        '5. Define corrective action process',
        '6. Assign responsibilities',
        '7. Define escalation criteria',
        '8. Create documentation requirements',
        '9. Define chart recalculation criteria',
        '10. Document complete response plan'
      ],
      outputFormat: 'JSON with response plan'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'responseActions', 'escalationCriteria', 'artifacts'],
      properties: {
        plan: { type: 'object' },
        responseActions: { type: 'array', items: { type: 'object' } },
        flowchart: { type: 'object' },
        containmentActions: { type: 'array', items: { type: 'string' } },
        escalationCriteria: { type: 'object' },
        responsibilities: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'spc', 'response-plan']
}));

// Task 9: Training
export const trainingTask = defineTask('spc-training', (args, taskCtx) => ({
  kind: 'agent',
  title: `SPC Training Materials - ${args.processName}`,
  agent: {
    name: 'training-developer',
    prompt: {
      role: 'Training Developer',
      task: 'Develop SPC training materials',
      context: args,
      instructions: [
        '1. Create training curriculum',
        '2. Develop SPC fundamentals module',
        '3. Create chart interpretation training',
        '4. Develop data collection procedures',
        '5. Create response plan training',
        '6. Develop hands-on exercises',
        '7. Create assessment quiz',
        '8. Develop quick reference guide',
        '9. Create operator job aids',
        '10. Document training plan'
      ],
      outputFormat: 'JSON with training materials'
    },
    outputSchema: {
      type: 'object',
      required: ['curriculum', 'materials', 'artifacts'],
      properties: {
        curriculum: { type: 'object' },
        materials: { type: 'array', items: { type: 'object' } },
        exercises: { type: 'array', items: { type: 'object' } },
        assessment: { type: 'object' },
        quickReference: { type: 'object' },
        jobAids: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'spc', 'training']
}));

// Task 10: Implementation Plan
export const implementationPlanTask = defineTask('spc-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `SPC Implementation Plan - ${args.processName}`,
  agent: {
    name: 'implementation-planner',
    prompt: {
      role: 'Implementation Planner',
      task: 'Create SPC implementation plan',
      context: args,
      instructions: [
        '1. Define implementation phases',
        '2. Create rollout timeline',
        '3. Identify resources required',
        '4. Plan chart displays/software',
        '5. Define audit schedule',
        '6. Plan ongoing data review meetings',
        '7. Define success metrics',
        '8. Create communication plan',
        '9. Plan periodic limit recalculation',
        '10. Document implementation plan'
      ],
      outputFormat: 'JSON with implementation plan'
    },
    outputSchema: {
      type: 'object',
      required: ['phases', 'timeline', 'resources', 'artifacts'],
      properties: {
        phases: { type: 'array', items: { type: 'object' } },
        timeline: { type: 'object' },
        resources: { type: 'object' },
        chartDisplayPlan: { type: 'object' },
        auditSchedule: { type: 'object' },
        reviewMeetings: { type: 'object' },
        successMetrics: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'spc', 'implementation']
}));

// Task 11: Report
export const reportTask = defineTask('spc-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `SPC Implementation Report - ${args.processName}`,
  agent: {
    name: 'report-writer',
    prompt: {
      role: 'Technical Report Writer',
      task: 'Generate SPC implementation report',
      context: args,
      instructions: [
        '1. Write executive summary',
        '2. Document process assessment',
        '3. Present MSA results',
        '4. Detail chart selection rationale',
        '5. Present control limits',
        '6. Include stability analysis',
        '7. Present capability analysis if applicable',
        '8. Document response plan',
        '9. Present implementation plan',
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
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'spc', 'reporting']
}));
