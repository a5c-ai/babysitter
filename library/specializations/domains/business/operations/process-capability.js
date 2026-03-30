/**
 * @process specializations/domains/business/operations/process-capability
 * @description Process Capability Analysis Process - Calculate and interpret Cp, Cpk, Pp, Ppk indices, assess process
 * performance against specifications, and recommend improvements for quality management.
 * @inputs { processName: string, specifications: object, data?: array, sampleSize?: number }
 * @outputs { success: boolean, capabilityIndices: object, assessment: object, recommendations: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/operations/process-capability', {
 *   processName: 'CNC Machining Process',
 *   specifications: { lsl: 24.95, usl: 25.05, target: 25.00 },
 *   sampleSize: 100
 * });
 *
 * @references
 * - Montgomery, D.C. (2019). Introduction to Statistical Quality Control
 * - AIAG SPC Manual
 * - Wheeler, D.J. (1995). Advanced Topics in Statistical Process Control
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    processName,
    specifications,
    data = null,
    sampleSize = 50,
    targetCpk = 1.33,
    outputDir = 'capability-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Process Capability Analysis for: ${processName}`);

  // Phase 1: Data Collection/Validation
  ctx.log('info', 'Phase 1: Data Collection and Validation');
  const dataValidation = await ctx.task(dataValidationTask, {
    processName,
    specifications,
    data,
    sampleSize,
    outputDir
  });

  artifacts.push(...dataValidation.artifacts);

  // Phase 2: Normality Assessment
  ctx.log('info', 'Phase 2: Normality Assessment');
  const normalityAssessment = await ctx.task(normalityAssessmentTask, {
    processName,
    dataValidation,
    outputDir
  });

  artifacts.push(...normalityAssessment.artifacts);

  // Phase 3: Process Stability Check
  ctx.log('info', 'Phase 3: Process Stability Verification');
  const stabilityCheck = await ctx.task(stabilityCheckTask, {
    processName,
    dataValidation,
    outputDir
  });

  artifacts.push(...stabilityCheck.artifacts);

  // Quality Gate: Stability and Normality Review
  await ctx.breakpoint({
    question: `Data validation complete. Sample size: ${dataValidation.sampleSize}. Process stable: ${stabilityCheck.isStable}. Data normal: ${normalityAssessment.isNormal}. Proceed with capability analysis?`,
    title: 'Process Stability Review',
    context: {
      runId: ctx.runId,
      processName,
      dataStats: dataValidation.statistics,
      stability: stabilityCheck,
      normality: normalityAssessment,
      files: [...dataValidation.artifacts, ...stabilityCheck.artifacts].map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 4: Capability Index Calculation
  ctx.log('info', 'Phase 4: Capability Index Calculation');
  const capabilityCalculation = await ctx.task(capabilityCalculationTask, {
    processName,
    dataValidation,
    specifications,
    normalityAssessment,
    outputDir
  });

  artifacts.push(...capabilityCalculation.artifacts);

  // Phase 5: Performance Index Calculation
  ctx.log('info', 'Phase 5: Performance Index Calculation');
  const performanceCalculation = await ctx.task(performanceCalculationTask, {
    processName,
    dataValidation,
    specifications,
    outputDir
  });

  artifacts.push(...performanceCalculation.artifacts);

  // Phase 6: Sigma Level Calculation
  ctx.log('info', 'Phase 6: Sigma Level and PPM Calculation');
  const sigmaCalculation = await ctx.task(sigmaCalculationTask, {
    processName,
    capabilityCalculation,
    specifications,
    outputDir
  });

  artifacts.push(...sigmaCalculation.artifacts);

  // Phase 7: Capability Assessment
  ctx.log('info', 'Phase 7: Capability Assessment');
  const assessment = await ctx.task(capabilityAssessmentTask, {
    processName,
    capabilityCalculation,
    performanceCalculation,
    sigmaCalculation,
    targetCpk,
    specifications,
    outputDir
  });

  artifacts.push(...assessment.artifacts);

  // Phase 8: Improvement Recommendations
  ctx.log('info', 'Phase 8: Improvement Recommendations');
  const recommendations = await ctx.task(improvementRecommendationsTask, {
    processName,
    assessment,
    capabilityCalculation,
    specifications,
    outputDir
  });

  artifacts.push(...recommendations.artifacts);

  // Phase 9: Report Generation
  ctx.log('info', 'Phase 9: Capability Report Generation');
  const report = await ctx.task(capabilityReportTask, {
    processName,
    specifications,
    dataValidation,
    normalityAssessment,
    stabilityCheck,
    capabilityCalculation,
    performanceCalculation,
    sigmaCalculation,
    assessment,
    recommendations,
    outputDir
  });

  artifacts.push(...report.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    processName,
    specifications,
    capabilityIndices: {
      cp: capabilityCalculation.cp,
      cpk: capabilityCalculation.cpk,
      cpl: capabilityCalculation.cpl,
      cpu: capabilityCalculation.cpu
    },
    performanceIndices: {
      pp: performanceCalculation.pp,
      ppk: performanceCalculation.ppk,
      ppl: performanceCalculation.ppl,
      ppu: performanceCalculation.ppu
    },
    sigmaMetrics: {
      sigmaLevel: sigmaCalculation.sigmaLevel,
      expectedPPM: sigmaCalculation.expectedPPM,
      yieldPercent: sigmaCalculation.yieldPercent
    },
    assessment: {
      overallAssessment: assessment.overallAssessment,
      meetsTarget: assessment.meetsTarget,
      processCenter: assessment.processCenter,
      processSpread: assessment.processSpread
    },
    recommendations: recommendations.recommendations,
    artifacts,
    reportPath: report.reportPath,
    duration,
    metadata: {
      processId: 'specializations/domains/business/operations/process-capability',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: Data Validation
export const dataValidationTask = defineTask('capability-data', (args, taskCtx) => ({
  kind: 'agent',
  title: `Process Capability Data Validation - ${args.processName}`,
  agent: {
    name: 'data-analyst',
    prompt: {
      role: 'Statistical Data Analyst',
      task: 'Validate and prepare data for capability analysis',
      context: args,
      instructions: [
        '1. Collect/validate measurement data',
        '2. Verify sample size adequacy (min 30-50)',
        '3. Check for data integrity',
        '4. Identify and handle outliers',
        '5. Calculate descriptive statistics',
        '6. Verify measurement units',
        '7. Check specification validity',
        '8. Create data visualization',
        '9. Document data collection conditions',
        '10. Prepare data for analysis'
      ],
      outputFormat: 'JSON with data validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['sampleSize', 'statistics', 'dataValid', 'artifacts'],
      properties: {
        sampleSize: { type: 'number' },
        statistics: {
          type: 'object',
          properties: {
            mean: { type: 'number' },
            stdDev: { type: 'number' },
            min: { type: 'number' },
            max: { type: 'number' },
            range: { type: 'number' }
          }
        },
        dataValid: { type: 'boolean' },
        outliers: { type: 'array', items: { type: 'number' } },
        histogram: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'capability', 'data-validation']
}));

// Task 2: Normality Assessment
export const normalityAssessmentTask = defineTask('capability-normality', (args, taskCtx) => ({
  kind: 'agent',
  title: `Normality Assessment - ${args.processName}`,
  agent: {
    name: 'statistician',
    prompt: {
      role: 'Statistician',
      task: 'Assess normality of process data',
      context: args,
      instructions: [
        '1. Create normal probability plot',
        '2. Perform Anderson-Darling test',
        '3. Perform Shapiro-Wilk test',
        '4. Calculate skewness and kurtosis',
        '5. Assess visual normality',
        '6. Determine if transformation needed',
        '7. Recommend appropriate analysis method',
        '8. Document normality assessment',
        '9. Note any deviations from normality',
        '10. Provide confidence in normality assumption'
      ],
      outputFormat: 'JSON with normality assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['isNormal', 'pValue', 'testResults', 'artifacts'],
      properties: {
        isNormal: { type: 'boolean' },
        pValue: { type: 'number' },
        testResults: { type: 'object' },
        skewness: { type: 'number' },
        kurtosis: { type: 'number' },
        normalityPlot: { type: 'object' },
        transformationNeeded: { type: 'boolean' },
        recommendedMethod: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'capability', 'normality']
}));

// Task 3: Stability Check
export const stabilityCheckTask = defineTask('capability-stability', (args, taskCtx) => ({
  kind: 'agent',
  title: `Process Stability Check - ${args.processName}`,
  agent: {
    name: 'spc-analyst',
    prompt: {
      role: 'SPC Analyst',
      task: 'Verify process stability before capability analysis',
      context: args,
      instructions: [
        '1. Create I-MR or X-bar R control chart',
        '2. Check for points outside control limits',
        '3. Check for trends and patterns',
        '4. Apply Western Electric rules',
        '5. Identify special cause variation',
        '6. Assess common cause variation',
        '7. Determine if process is stable',
        '8. Document any instability',
        '9. Recommend remediation if unstable',
        '10. Provide stability assessment'
      ],
      outputFormat: 'JSON with stability assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['isStable', 'controlChartResults', 'artifacts'],
      properties: {
        isStable: { type: 'boolean' },
        controlChartResults: { type: 'object' },
        outOfControlPoints: { type: 'number' },
        rulesViolated: { type: 'array', items: { type: 'object' } },
        specialCauses: { type: 'array', items: { type: 'object' } },
        remediation: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'capability', 'stability']
}));

// Task 4: Capability Index Calculation
export const capabilityCalculationTask = defineTask('capability-indices', (args, taskCtx) => ({
  kind: 'agent',
  title: `Capability Index Calculation - ${args.processName}`,
  agent: {
    name: 'capability-analyst',
    prompt: {
      role: 'Process Capability Analyst',
      task: 'Calculate capability indices (Cp, Cpk)',
      context: args,
      instructions: [
        '1. Calculate Cp = (USL - LSL) / (6 * sigma_within)',
        '2. Calculate Cpl = (Mean - LSL) / (3 * sigma_within)',
        '3. Calculate Cpu = (USL - Mean) / (3 * sigma_within)',
        '4. Calculate Cpk = min(Cpl, Cpu)',
        '5. Use within-subgroup standard deviation',
        '6. Calculate confidence intervals',
        '7. Assess potential vs actual capability',
        '8. Document calculation methodology',
        '9. Visualize capability',
        '10. Interpret results'
      ],
      outputFormat: 'JSON with capability indices'
    },
    outputSchema: {
      type: 'object',
      required: ['cp', 'cpk', 'cpl', 'cpu', 'artifacts'],
      properties: {
        cp: { type: 'number' },
        cpk: { type: 'number' },
        cpl: { type: 'number' },
        cpu: { type: 'number' },
        sigmaWithin: { type: 'number' },
        confidenceIntervals: { type: 'object' },
        capabilityHistogram: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'capability', 'cp-cpk']
}));

// Task 5: Performance Index Calculation
export const performanceCalculationTask = defineTask('performance-indices', (args, taskCtx) => ({
  kind: 'agent',
  title: `Performance Index Calculation - ${args.processName}`,
  agent: {
    name: 'performance-analyst',
    prompt: {
      role: 'Process Performance Analyst',
      task: 'Calculate performance indices (Pp, Ppk)',
      context: args,
      instructions: [
        '1. Calculate overall standard deviation',
        '2. Calculate Pp = (USL - LSL) / (6 * sigma_overall)',
        '3. Calculate Ppl = (Mean - LSL) / (3 * sigma_overall)',
        '4. Calculate Ppu = (USL - Mean) / (3 * sigma_overall)',
        '5. Calculate Ppk = min(Ppl, Ppu)',
        '6. Compare Cp/Cpk vs Pp/Ppk',
        '7. Calculate Ppk/Cpk ratio',
        '8. Assess between vs within variation',
        '9. Document methodology',
        '10. Interpret Pp/Ppk results'
      ],
      outputFormat: 'JSON with performance indices'
    },
    outputSchema: {
      type: 'object',
      required: ['pp', 'ppk', 'ppl', 'ppu', 'artifacts'],
      properties: {
        pp: { type: 'number' },
        ppk: { type: 'number' },
        ppl: { type: 'number' },
        ppu: { type: 'number' },
        sigmaOverall: { type: 'number' },
        ppkCpkRatio: { type: 'number' },
        variationBreakdown: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'capability', 'pp-ppk']
}));

// Task 6: Sigma Level Calculation
export const sigmaCalculationTask = defineTask('sigma-level', (args, taskCtx) => ({
  kind: 'agent',
  title: `Sigma Level Calculation - ${args.processName}`,
  agent: {
    name: 'sigma-analyst',
    prompt: {
      role: 'Six Sigma Analyst',
      task: 'Calculate sigma level and expected defect rate',
      context: args,
      instructions: [
        '1. Calculate Z-score for LSL',
        '2. Calculate Z-score for USL',
        '3. Calculate expected PPM below LSL',
        '4. Calculate expected PPM above USL',
        '5. Calculate total expected PPM',
        '6. Convert PPM to sigma level',
        '7. Apply 1.5 sigma shift if long-term',
        '8. Calculate process yield',
        '9. Compare to benchmark',
        '10. Document sigma calculation'
      ],
      outputFormat: 'JSON with sigma metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['sigmaLevel', 'expectedPPM', 'yieldPercent', 'artifacts'],
      properties: {
        sigmaLevel: { type: 'number' },
        zScoreLsl: { type: 'number' },
        zScoreUsl: { type: 'number' },
        expectedPPM: { type: 'number' },
        ppmBelowLsl: { type: 'number' },
        ppmAboveUsl: { type: 'number' },
        yieldPercent: { type: 'number' },
        benchmarkComparison: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'capability', 'sigma-level']
}));

// Task 7: Capability Assessment
export const capabilityAssessmentTask = defineTask('capability-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Capability Assessment - ${args.processName}`,
  agent: {
    name: 'assessment-analyst',
    prompt: {
      role: 'Capability Assessment Analyst',
      task: 'Assess overall process capability',
      context: args,
      instructions: [
        '1. Compare Cpk to target (typically 1.33)',
        '2. Assess process centering',
        '3. Assess process spread/variation',
        '4. Evaluate Cp vs Cpk gap',
        '5. Evaluate Cpk vs Ppk gap',
        '6. Classify capability level',
        '7. Identify primary issues',
        '8. Assess risk level',
        '9. Determine if acceptable',
        '10. Document overall assessment'
      ],
      outputFormat: 'JSON with capability assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['overallAssessment', 'meetsTarget', 'processCenter', 'processSpread', 'artifacts'],
      properties: {
        overallAssessment: { type: 'string' },
        meetsTarget: { type: 'boolean' },
        processCenter: { type: 'string' },
        processSpread: { type: 'string' },
        capabilityLevel: { type: 'string' },
        primaryIssues: { type: 'array', items: { type: 'string' } },
        riskLevel: { type: 'string' },
        acceptable: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'capability', 'assessment']
}));

// Task 8: Improvement Recommendations
export const improvementRecommendationsTask = defineTask('capability-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: `Improvement Recommendations - ${args.processName}`,
  agent: {
    name: 'improvement-advisor',
    prompt: {
      role: 'Process Improvement Advisor',
      task: 'Recommend improvements for capability',
      context: args,
      instructions: [
        '1. Identify root causes of low capability',
        '2. Recommend centering adjustments',
        '3. Recommend variation reduction',
        '4. Suggest specification review if appropriate',
        '5. Prioritize recommendations',
        '6. Estimate impact of improvements',
        '7. Recommend DOE for optimization',
        '8. Suggest monitoring approach',
        '9. Calculate expected Cpk after improvements',
        '10. Document recommendations'
      ],
      outputFormat: 'JSON with recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'prioritizedActions', 'expectedCpk', 'artifacts'],
      properties: {
        recommendations: { type: 'array', items: { type: 'object' } },
        centeringActions: { type: 'array', items: { type: 'string' } },
        variationReduction: { type: 'array', items: { type: 'string' } },
        prioritizedActions: { type: 'array', items: { type: 'object' } },
        expectedCpk: { type: 'number' },
        doeRecommendation: { type: 'object' },
        monitoringPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'capability', 'recommendations']
}));

// Task 9: Capability Report
export const capabilityReportTask = defineTask('capability-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Process Capability Report - ${args.processName}`,
  agent: {
    name: 'report-writer',
    prompt: {
      role: 'Technical Report Writer',
      task: 'Generate process capability report',
      context: args,
      instructions: [
        '1. Write executive summary',
        '2. Document process and specifications',
        '3. Present data validation results',
        '4. Present stability analysis',
        '5. Present normality assessment',
        '6. Present capability indices',
        '7. Present performance indices',
        '8. Include sigma level analysis',
        '9. Document assessment and recommendations',
        '10. Include visualizations'
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
        visualizations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'capability', 'reporting']
}));
