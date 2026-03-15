/**
 * @process domains/science/industrial-engineering/spc-implementation
 * @description Statistical Process Control Implementation - Design and implement SPC systems to monitor process stability,
 * detect special cause variation, and enable data-driven process improvement.
 * @inputs { processName: string, characteristics?: array, targetCapability?: number }
 * @outputs { success: boolean, controlCharts: array, msaResults: object, capabilityAnalysis: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('domains/science/industrial-engineering/spc-implementation', {
 *   processName: 'CNC Machining - Bore Diameter',
 *   characteristics: ['diameter', 'surface-roughness'],
 *   targetCapability: 1.33
 * });
 *
 * @references
 * - Montgomery, Introduction to Statistical Quality Control
 * - Wheeler, Understanding Statistical Process Control
 * - AIAG SPC Manual
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    processName,
    characteristics = [],
    targetCapability = 1.33,
    outputDir = 'spc-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Statistical Process Control Implementation process');

  // Task 1: Critical Characteristic Identification
  ctx.log('info', 'Phase 1: Identifying critical quality characteristics');
  const characteristicId = await ctx.task(characteristicIdTask, {
    processName,
    characteristics,
    outputDir
  });

  artifacts.push(...characteristicId.artifacts);

  // Task 2: Measurement System Analysis
  ctx.log('info', 'Phase 2: Conducting measurement system analysis');
  const msaResults = await ctx.task(msaTask, {
    characteristicId,
    outputDir
  });

  artifacts.push(...msaResults.artifacts);

  // Breakpoint: Review MSA
  await ctx.breakpoint({
    question: `MSA complete. Gage R&R: ${msaResults.gageRR}%. Acceptable: ${msaResults.acceptable}. Proceed with SPC setup?`,
    title: 'Measurement System Analysis Review',
    context: {
      runId: ctx.runId,
      gageRR: msaResults.gageRR,
      acceptable: msaResults.acceptable,
      ndc: msaResults.ndc,
      files: msaResults.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // Task 3: Baseline Data Collection
  ctx.log('info', 'Phase 3: Collecting baseline process data');
  const baselineData = await ctx.task(baselineDataTask, {
    characteristicId,
    msaResults,
    outputDir
  });

  artifacts.push(...baselineData.artifacts);

  // Task 4: Process Stability Assessment
  ctx.log('info', 'Phase 4: Assessing process stability');
  const stabilityAssessment = await ctx.task(stabilityAssessmentTask, {
    baselineData,
    outputDir
  });

  artifacts.push(...stabilityAssessment.artifacts);

  // Task 5: Control Chart Selection
  ctx.log('info', 'Phase 5: Selecting appropriate control charts');
  const chartSelection = await ctx.task(chartSelectionTask, {
    characteristicId,
    baselineData,
    stabilityAssessment,
    outputDir
  });

  artifacts.push(...chartSelection.artifacts);

  // Task 6: Control Limit Calculation
  ctx.log('info', 'Phase 6: Calculating control limits');
  const controlLimits = await ctx.task(controlLimitsTask, {
    chartSelection,
    baselineData,
    outputDir
  });

  artifacts.push(...controlLimits.artifacts);

  // Task 7: Process Capability Analysis
  ctx.log('info', 'Phase 7: Analyzing process capability');
  const capabilityAnalysis = await ctx.task(capabilityAnalysisTask, {
    baselineData,
    stabilityAssessment,
    targetCapability,
    outputDir
  });

  artifacts.push(...capabilityAnalysis.artifacts);

  // Task 8: SPC System Setup
  ctx.log('info', 'Phase 8: Setting up SPC charting system');
  const spcSetup = await ctx.task(spcSetupTask, {
    chartSelection,
    controlLimits,
    outputDir
  });

  artifacts.push(...spcSetup.artifacts);

  // Task 9: Training Development
  ctx.log('info', 'Phase 9: Developing SPC training materials');
  const trainingDevelopment = await ctx.task(trainingTask, {
    chartSelection,
    controlLimits,
    outputDir
  });

  artifacts.push(...trainingDevelopment.artifacts);

  // Task 10: OCAP Development
  ctx.log('info', 'Phase 10: Developing out-of-control action plans');
  const ocapDevelopment = await ctx.task(ocapTask, {
    chartSelection,
    processName,
    outputDir
  });

  artifacts.push(...ocapDevelopment.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `SPC implementation complete. Cpk: ${capabilityAnalysis.cpk.toFixed(2)}. Target met: ${capabilityAnalysis.cpk >= targetCapability}. Control charts ready. Review implementation?`,
    title: 'SPC Implementation Results',
    context: {
      runId: ctx.runId,
      summary: {
        characteristicsMonitored: characteristicId.characteristics.length,
        gageRRAcceptable: msaResults.acceptable,
        processStable: stabilityAssessment.isStable,
        cpk: capabilityAnalysis.cpk,
        targetMet: capabilityAnalysis.cpk >= targetCapability
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    controlCharts: chartSelection.selectedCharts,
    msaResults: {
      gageRR: msaResults.gageRR,
      acceptable: msaResults.acceptable,
      ndc: msaResults.ndc
    },
    capabilityAnalysis: {
      cpk: capabilityAnalysis.cpk,
      ppk: capabilityAnalysis.ppk,
      targetMet: capabilityAnalysis.cpk >= targetCapability
    },
    controlLimits: controlLimits.limits,
    ocap: ocapDevelopment.ocapDocuments,
    artifacts,
    duration,
    metadata: {
      processId: 'domains/science/industrial-engineering/spc-implementation',
      timestamp: startTime,
      processName,
      targetCapability,
      outputDir
    }
  };
}

// Task 1: Characteristic Identification
export const characteristicIdTask = defineTask('characteristic-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify critical quality characteristics',
  agent: {
    name: 'quality-engineer',
    prompt: {
      role: 'Quality Engineer',
      task: 'Identify and prioritize critical quality characteristics for SPC',
      context: args,
      instructions: [
        '1. Review product/process specifications',
        '2. Identify potential CTQs (Critical to Quality)',
        '3. Review failure modes and effects',
        '4. Assess customer requirements',
        '5. Prioritize characteristics for monitoring',
        '6. Define specifications and tolerances',
        '7. Document measurement methods',
        '8. Create characteristic matrix'
      ],
      outputFormat: 'JSON with critical characteristics and specifications'
    },
    outputSchema: {
      type: 'object',
      required: ['characteristics', 'specifications', 'prioritization', 'artifacts'],
      properties: {
        characteristics: { type: 'array' },
        specifications: { type: 'object' },
        prioritization: { type: 'array' },
        measurementMethods: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'spc', 'characteristic-id']
}));

// Task 2: MSA
export const msaTask = defineTask('measurement-system-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct measurement system analysis',
  agent: {
    name: 'msa-analyst',
    prompt: {
      role: 'Measurement Systems Analyst',
      task: 'Conduct Gage R&R study to validate measurement system',
      context: args,
      instructions: [
        '1. Design Gage R&R study (crossed or nested)',
        '2. Select parts spanning process range',
        '3. Select representative operators',
        '4. Collect measurement data',
        '5. Analyze repeatability and reproducibility',
        '6. Calculate %GR&R and ndc',
        '7. Assess measurement system acceptability',
        '8. Document MSA results'
      ],
      outputFormat: 'JSON with MSA analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['gageRR', 'acceptable', 'ndc', 'artifacts'],
      properties: {
        gageRR: { type: 'number' },
        repeatability: { type: 'number' },
        reproducibility: { type: 'number' },
        ndc: { type: 'number' },
        acceptable: { type: 'boolean' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'spc', 'msa']
}));

// Task 3: Baseline Data Collection
export const baselineDataTask = defineTask('baseline-data-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Collect baseline process data',
  agent: {
    name: 'data-collector',
    prompt: {
      role: 'Process Data Analyst',
      task: 'Collect baseline data for control chart setup',
      context: args,
      instructions: [
        '1. Design data collection plan',
        '2. Determine sample size and frequency',
        '3. Collect minimum 25 subgroups',
        '4. Record process conditions',
        '5. Verify data quality',
        '6. Calculate basic statistics',
        '7. Plot preliminary charts',
        '8. Document data collection'
      ],
      outputFormat: 'JSON with baseline data and statistics'
    },
    outputSchema: {
      type: 'object',
      required: ['data', 'statistics', 'subgroupCount', 'artifacts'],
      properties: {
        data: { type: 'array' },
        statistics: { type: 'object' },
        subgroupCount: { type: 'number' },
        subgroupSize: { type: 'number' },
        processConditions: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'spc', 'data-collection']
}));

// Task 4: Stability Assessment
export const stabilityAssessmentTask = defineTask('stability-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess process stability',
  agent: {
    name: 'stability-analyst',
    prompt: {
      role: 'Statistical Analyst',
      task: 'Assess process stability using control charts',
      context: args,
      instructions: [
        '1. Create preliminary control charts',
        '2. Apply Western Electric rules',
        '3. Identify out-of-control points',
        '4. Investigate assignable causes',
        '5. Remove special cause points if justified',
        '6. Recalculate limits if needed',
        '7. Verify stable baseline',
        '8. Document stability assessment'
      ],
      outputFormat: 'JSON with stability assessment results'
    },
    outputSchema: {
      type: 'object',
      required: ['isStable', 'outOfControlPoints', 'rulesViolated', 'artifacts'],
      properties: {
        isStable: { type: 'boolean' },
        outOfControlPoints: { type: 'array' },
        rulesViolated: { type: 'array' },
        assignableCauses: { type: 'array' },
        revisedData: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'spc', 'stability']
}));

// Task 5: Chart Selection
export const chartSelectionTask = defineTask('chart-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select appropriate control charts',
  agent: {
    name: 'chart-selector',
    prompt: {
      role: 'SPC Specialist',
      task: 'Select appropriate control chart types',
      context: args,
      instructions: [
        '1. Determine data type (variable vs. attribute)',
        '2. Determine subgroup size',
        '3. Select location chart (X-bar, Individual)',
        '4. Select variation chart (R, S, mR)',
        '5. Consider EWMA or CUSUM if needed',
        '6. Select attribute charts if applicable',
        '7. Document selection rationale',
        '8. Define chart parameters'
      ],
      outputFormat: 'JSON with chart selection and rationale'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedCharts', 'chartTypes', 'selectionRationale', 'artifacts'],
      properties: {
        selectedCharts: { type: 'array' },
        chartTypes: { type: 'object' },
        selectionRationale: { type: 'string' },
        chartParameters: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'spc', 'chart-selection']
}));

// Task 6: Control Limits
export const controlLimitsTask = defineTask('control-limits', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate control limits',
  agent: {
    name: 'limits-calculator',
    prompt: {
      role: 'Statistical Process Control Engineer',
      task: 'Calculate control limits for charts',
      context: args,
      instructions: [
        '1. Calculate center line (mean)',
        '2. Calculate UCL and LCL',
        '3. Use appropriate constants (A2, D3, D4, etc.)',
        '4. Calculate warning limits if required',
        '5. Document calculation formulas',
        '6. Create control limit specification',
        '7. Verify limits are reasonable',
        '8. Document control limits'
      ],
      outputFormat: 'JSON with control limits'
    },
    outputSchema: {
      type: 'object',
      required: ['limits', 'calculations', 'artifacts'],
      properties: {
        limits: { type: 'object' },
        calculations: { type: 'object' },
        constants: { type: 'object' },
        warningLimits: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'spc', 'control-limits']
}));

// Task 7: Capability Analysis
export const capabilityAnalysisTask = defineTask('capability-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze process capability',
  agent: {
    name: 'capability-analyst',
    prompt: {
      role: 'Process Capability Analyst',
      task: 'Calculate and analyze process capability',
      context: args,
      instructions: [
        '1. Verify process stability',
        '2. Test for normality',
        '3. Calculate Cp and Cpk',
        '4. Calculate Pp and Ppk',
        '5. Calculate % out of spec (PPM)',
        '6. Analyze capability vs. target',
        '7. Identify improvement needs',
        '8. Generate capability report'
      ],
      outputFormat: 'JSON with capability analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['cpk', 'ppk', 'ppm', 'artifacts'],
      properties: {
        cp: { type: 'number' },
        cpk: { type: 'number' },
        pp: { type: 'number' },
        ppk: { type: 'number' },
        ppm: { type: 'number' },
        normalityTest: { type: 'object' },
        improvementNeeds: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'spc', 'capability']
}));

// Task 8: SPC Setup
export const spcSetupTask = defineTask('spc-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up SPC charting system',
  agent: {
    name: 'spc-setup-engineer',
    prompt: {
      role: 'SPC Implementation Engineer',
      task: 'Set up operational SPC charting system',
      context: args,
      instructions: [
        '1. Design chart format and layout',
        '2. Set up data collection forms',
        '3. Configure charting software/system',
        '4. Define sampling procedures',
        '5. Create chart templates',
        '6. Test system with sample data',
        '7. Document operating procedures',
        '8. Deploy charting system'
      ],
      outputFormat: 'JSON with SPC system setup'
    },
    outputSchema: {
      type: 'object',
      required: ['chartTemplates', 'samplingPlan', 'procedures', 'artifacts'],
      properties: {
        chartTemplates: { type: 'array' },
        samplingPlan: { type: 'object' },
        dataCollectionForms: { type: 'array' },
        procedures: { type: 'array' },
        systemConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'spc', 'setup']
}));

// Task 9: Training
export const trainingTask = defineTask('spc-training', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop SPC training materials',
  agent: {
    name: 'spc-trainer',
    prompt: {
      role: 'SPC Training Developer',
      task: 'Develop SPC training materials for operators',
      context: args,
      instructions: [
        '1. Create SPC basics training',
        '2. Develop chart plotting training',
        '3. Train on rule interpretation',
        '4. Create hands-on exercises',
        '5. Develop assessment questions',
        '6. Create quick reference guides',
        '7. Plan train-the-trainer',
        '8. Document training curriculum'
      ],
      outputFormat: 'JSON with training materials'
    },
    outputSchema: {
      type: 'object',
      required: ['trainingMaterials', 'curriculum', 'artifacts'],
      properties: {
        trainingMaterials: { type: 'array' },
        curriculum: { type: 'object' },
        exercises: { type: 'array' },
        assessments: { type: 'array' },
        quickReferenceGuides: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'spc', 'training']
}));

// Task 10: OCAP
export const ocapTask = defineTask('ocap-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop out-of-control action plans',
  agent: {
    name: 'ocap-developer',
    prompt: {
      role: 'Process Control Engineer',
      task: 'Develop out-of-control action plans (OCAP)',
      context: args,
      instructions: [
        '1. Define out-of-control conditions',
        '2. Map each condition to potential causes',
        '3. Define immediate actions',
        '4. Define investigation steps',
        '5. Define corrective actions',
        '6. Define escalation procedures',
        '7. Create OCAP flowcharts',
        '8. Document reaction plans'
      ],
      outputFormat: 'JSON with OCAP documents'
    },
    outputSchema: {
      type: 'object',
      required: ['ocapDocuments', 'reactionPlans', 'artifacts'],
      properties: {
        ocapDocuments: { type: 'array' },
        outOfControlConditions: { type: 'array' },
        potentialCauses: { type: 'object' },
        reactionPlans: { type: 'array' },
        escalationProcedures: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'spc', 'ocap']
}));
