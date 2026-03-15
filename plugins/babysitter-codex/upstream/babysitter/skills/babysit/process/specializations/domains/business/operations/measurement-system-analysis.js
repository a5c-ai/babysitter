/**
 * @process specializations/domains/business/operations/measurement-system-analysis
 * @description Measurement System Analysis Process - Conduct Gage R&R studies, assess measurement system adequacy,
 * and identify and correct measurement variation sources for quality assurance.
 * @inputs { measurementSystem: string, studyType?: string, parts?: number, operators?: number, trials?: number }
 * @outputs { success: boolean, gageRR: object, adequacy: object, recommendations: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/operations/measurement-system-analysis', {
 *   measurementSystem: 'Digital Caliper #123',
 *   studyType: 'crossed',
 *   parts: 10,
 *   operators: 3,
 *   trials: 3
 * });
 *
 * @references
 * - AIAG MSA Manual (4th Edition)
 * - Montgomery, D.C. (2019). Introduction to Statistical Quality Control
 * - Wheeler, D.J. & Lyday, R.W. (1989). Evaluating the Measurement Process
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    measurementSystem,
    studyType = 'crossed',
    parts = 10,
    operators = 3,
    trials = 3,
    tolerance = null,
    outputDir = 'msa-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Measurement System Analysis for: ${measurementSystem}`);

  // Phase 1: Study Planning
  ctx.log('info', 'Phase 1: MSA Study Planning');
  const planning = await ctx.task(msaPlanningTask, {
    measurementSystem,
    studyType,
    parts,
    operators,
    trials,
    tolerance,
    outputDir
  });

  artifacts.push(...planning.artifacts);

  // Phase 2: Data Collection
  ctx.log('info', 'Phase 2: Data Collection');
  const dataCollection = await ctx.task(dataCollectionTask, {
    measurementSystem,
    planning,
    outputDir
  });

  artifacts.push(...dataCollection.artifacts);

  // Quality Gate: Data Collection Review
  await ctx.breakpoint({
    question: `MSA data collected. Parts: ${dataCollection.partsCount}, Operators: ${dataCollection.operatorsCount}, Trials: ${dataCollection.trialsCount}. Total measurements: ${dataCollection.totalMeasurements}. Proceed with analysis?`,
    title: 'MSA Data Collection Review',
    context: {
      runId: ctx.runId,
      measurementSystem,
      dataCollection: dataCollection.summary,
      files: dataCollection.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 3: Repeatability Analysis
  ctx.log('info', 'Phase 3: Repeatability Analysis (Equipment Variation)');
  const repeatability = await ctx.task(repeatabilityTask, {
    measurementSystem,
    dataCollection,
    outputDir
  });

  artifacts.push(...repeatability.artifacts);

  // Phase 4: Reproducibility Analysis
  ctx.log('info', 'Phase 4: Reproducibility Analysis (Appraiser Variation)');
  const reproducibility = await ctx.task(reproducibilityTask, {
    measurementSystem,
    dataCollection,
    outputDir
  });

  artifacts.push(...reproducibility.artifacts);

  // Phase 5: Gage R&R Calculation
  ctx.log('info', 'Phase 5: Gage R&R Calculation');
  const gageRR = await ctx.task(gageRRCalculationTask, {
    measurementSystem,
    repeatability,
    reproducibility,
    tolerance,
    outputDir
  });

  artifacts.push(...gageRR.artifacts);

  // Phase 6: Part Variation Analysis
  ctx.log('info', 'Phase 6: Part Variation Analysis');
  const partVariation = await ctx.task(partVariationTask, {
    measurementSystem,
    dataCollection,
    gageRR,
    outputDir
  });

  artifacts.push(...partVariation.artifacts);

  // Phase 7: Number of Distinct Categories
  ctx.log('info', 'Phase 7: Number of Distinct Categories (ndc) Calculation');
  const ndcCalculation = await ctx.task(ndcCalculationTask, {
    measurementSystem,
    gageRR,
    partVariation,
    outputDir
  });

  artifacts.push(...ndcCalculation.artifacts);

  // Phase 8: Adequacy Assessment
  ctx.log('info', 'Phase 8: Measurement System Adequacy Assessment');
  const adequacy = await ctx.task(adequacyAssessmentTask, {
    measurementSystem,
    gageRR,
    ndcCalculation,
    tolerance,
    outputDir
  });

  artifacts.push(...adequacy.artifacts);

  // Quality Gate: Adequacy Review
  await ctx.breakpoint({
    question: `Gage R&R complete. Total GRR: ${gageRR.totalGRRPercent}%. NDC: ${ndcCalculation.ndc}. Assessment: ${adequacy.assessment}. ${adequacy.acceptable ? 'Measurement system is ACCEPTABLE.' : 'Measurement system NEEDS IMPROVEMENT.'} Review findings?`,
    title: 'MSA Adequacy Review',
    context: {
      runId: ctx.runId,
      measurementSystem,
      gageRR: gageRR.summary,
      ndc: ndcCalculation.ndc,
      adequacy: adequacy,
      files: [...gageRR.artifacts, ...adequacy.artifacts].map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 9: Improvement Recommendations
  ctx.log('info', 'Phase 9: Improvement Recommendations');
  const recommendations = await ctx.task(improvementRecommendationsTask, {
    measurementSystem,
    repeatability,
    reproducibility,
    gageRR,
    adequacy,
    outputDir
  });

  artifacts.push(...recommendations.artifacts);

  // Phase 10: MSA Report
  ctx.log('info', 'Phase 10: MSA Report Generation');
  const report = await ctx.task(msaReportTask, {
    measurementSystem,
    planning,
    dataCollection,
    repeatability,
    reproducibility,
    gageRR,
    partVariation,
    ndcCalculation,
    adequacy,
    recommendations,
    outputDir
  });

  artifacts.push(...report.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    measurementSystem,
    studyType,
    gageRR: {
      totalGRRPercent: gageRR.totalGRRPercent,
      totalGRRStudyVar: gageRR.totalGRRStudyVar,
      repeatability: repeatability.evPercent,
      reproducibility: reproducibility.avPercent,
      partToPartVariation: partVariation.pvPercent
    },
    components: {
      equipmentVariation: repeatability.ev,
      appraiserVariation: reproducibility.av,
      appraiserByPart: reproducibility.interaction,
      partVariation: partVariation.pv
    },
    ndc: ndcCalculation.ndc,
    adequacy: {
      assessment: adequacy.assessment,
      acceptable: adequacy.acceptable,
      criteria: adequacy.criteria
    },
    recommendations: recommendations.recommendations,
    artifacts,
    reportPath: report.reportPath,
    duration,
    metadata: {
      processId: 'specializations/domains/business/operations/measurement-system-analysis',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: MSA Planning
export const msaPlanningTask = defineTask('msa-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `MSA Planning - ${args.measurementSystem}`,
  agent: {
    name: 'msa-planner',
    prompt: {
      role: 'MSA Study Planner',
      task: 'Plan Gage R&R study',
      context: args,
      instructions: [
        '1. Select study type (crossed/nested)',
        '2. Determine number of parts (min 10)',
        '3. Select number of operators (min 2-3)',
        '4. Determine number of trials (min 2-3)',
        '5. Define part selection criteria',
        '6. Create randomization plan',
        '7. Define measurement procedure',
        '8. Identify tolerance for %Tolerance method',
        '9. Create data collection form',
        '10. Document study plan'
      ],
      outputFormat: 'JSON with MSA plan'
    },
    outputSchema: {
      type: 'object',
      required: ['studyType', 'samplePlan', 'randomization', 'artifacts'],
      properties: {
        studyType: { type: 'string' },
        samplePlan: {
          type: 'object',
          properties: {
            parts: { type: 'number' },
            operators: { type: 'number' },
            trials: { type: 'number' }
          }
        },
        randomization: { type: 'object' },
        measurementProcedure: { type: 'string' },
        dataForm: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'msa', 'planning']
}));

// Task 2: Data Collection
export const dataCollectionTask = defineTask('msa-data-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: `MSA Data Collection - ${args.measurementSystem}`,
  agent: {
    name: 'data-collector',
    prompt: {
      role: 'MSA Data Collector',
      task: 'Collect Gage R&R measurement data',
      context: args,
      instructions: [
        '1. Execute randomized measurement plan',
        '2. Ensure blind measurements',
        '3. Record all measurements',
        '4. Verify data completeness',
        '5. Check for transcription errors',
        '6. Validate measurement conditions',
        '7. Record any anomalies',
        '8. Organize data matrix',
        '9. Calculate basic statistics',
        '10. Prepare data for analysis'
      ],
      outputFormat: 'JSON with collected data'
    },
    outputSchema: {
      type: 'object',
      required: ['measurements', 'partsCount', 'operatorsCount', 'trialsCount', 'totalMeasurements', 'summary', 'artifacts'],
      properties: {
        measurements: { type: 'array', items: { type: 'object' } },
        partsCount: { type: 'number' },
        operatorsCount: { type: 'number' },
        trialsCount: { type: 'number' },
        totalMeasurements: { type: 'number' },
        summary: { type: 'object' },
        anomalies: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'msa', 'data-collection']
}));

// Task 3: Repeatability Analysis
export const repeatabilityTask = defineTask('msa-repeatability', (args, taskCtx) => ({
  kind: 'agent',
  title: `Repeatability Analysis - ${args.measurementSystem}`,
  agent: {
    name: 'repeatability-analyst',
    prompt: {
      role: 'Repeatability Analyst',
      task: 'Calculate equipment variation (repeatability)',
      context: args,
      instructions: [
        '1. Calculate range for each operator/part',
        '2. Calculate average range (R-bar)',
        '3. Apply appropriate d2 factor',
        '4. Calculate repeatability (EV)',
        '5. Calculate EV contribution to total',
        '6. Calculate %EV to study variation',
        '7. Calculate %EV to tolerance',
        '8. Identify high-range cases',
        '9. Create range chart',
        '10. Document repeatability results'
      ],
      outputFormat: 'JSON with repeatability analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['ev', 'evPercent', 'averageRange', 'artifacts'],
      properties: {
        ev: { type: 'number' },
        evPercent: { type: 'number' },
        evTolerance: { type: 'number' },
        averageRange: { type: 'number' },
        d2Factor: { type: 'number' },
        rangeByOperatorPart: { type: 'array', items: { type: 'object' } },
        rangeChart: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'msa', 'repeatability']
}));

// Task 4: Reproducibility Analysis
export const reproducibilityTask = defineTask('msa-reproducibility', (args, taskCtx) => ({
  kind: 'agent',
  title: `Reproducibility Analysis - ${args.measurementSystem}`,
  agent: {
    name: 'reproducibility-analyst',
    prompt: {
      role: 'Reproducibility Analyst',
      task: 'Calculate appraiser variation (reproducibility)',
      context: args,
      instructions: [
        '1. Calculate operator averages',
        '2. Calculate range of operator averages',
        '3. Apply appropriate d2 factor',
        '4. Calculate reproducibility (AV)',
        '5. Adjust for operator x part interaction',
        '6. Calculate %AV to study variation',
        '7. Calculate %AV to tolerance',
        '8. Identify operator differences',
        '9. Create X-bar chart by operator',
        '10. Document reproducibility results'
      ],
      outputFormat: 'JSON with reproducibility analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['av', 'avPercent', 'operatorAverages', 'artifacts'],
      properties: {
        av: { type: 'number' },
        avPercent: { type: 'number' },
        avTolerance: { type: 'number' },
        operatorAverages: { type: 'object' },
        operatorRange: { type: 'number' },
        interaction: { type: 'number' },
        interactionSignificant: { type: 'boolean' },
        xbarChart: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'msa', 'reproducibility']
}));

// Task 5: Gage R&R Calculation
export const gageRRCalculationTask = defineTask('msa-grr', (args, taskCtx) => ({
  kind: 'agent',
  title: `Gage R&R Calculation - ${args.measurementSystem}`,
  agent: {
    name: 'grr-analyst',
    prompt: {
      role: 'Gage R&R Analyst',
      task: 'Calculate total Gage R&R',
      context: args,
      instructions: [
        '1. Calculate GRR = sqrt(EV^2 + AV^2)',
        '2. Calculate %GRR to study variation',
        '3. Calculate %GRR to tolerance',
        '4. Create variance component breakdown',
        '5. Calculate contribution percentages',
        '6. Create Gage R&R summary table',
        '7. Apply ANOVA method if appropriate',
        '8. Compare ANOVA vs Range method',
        '9. Create visualization',
        '10. Document Gage R&R results'
      ],
      outputFormat: 'JSON with Gage R&R results'
    },
    outputSchema: {
      type: 'object',
      required: ['totalGRR', 'totalGRRPercent', 'totalGRRStudyVar', 'summary', 'artifacts'],
      properties: {
        totalGRR: { type: 'number' },
        totalGRRPercent: { type: 'number' },
        totalGRRStudyVar: { type: 'number' },
        totalGRRTolerance: { type: 'number' },
        varianceComponents: { type: 'object' },
        contributionPercents: { type: 'object' },
        anovaResults: { type: 'object' },
        summary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'msa', 'grr']
}));

// Task 6: Part Variation
export const partVariationTask = defineTask('msa-part-variation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Part Variation Analysis - ${args.measurementSystem}`,
  agent: {
    name: 'pv-analyst',
    prompt: {
      role: 'Part Variation Analyst',
      task: 'Calculate part-to-part variation',
      context: args,
      instructions: [
        '1. Calculate part averages',
        '2. Calculate range of part averages',
        '3. Apply appropriate d2 factor',
        '4. Calculate part variation (PV)',
        '5. Calculate %PV to study variation',
        '6. Calculate total variation (TV)',
        '7. Verify PV > GRR for good system',
        '8. Create part variation chart',
        '9. Assess part selection adequacy',
        '10. Document part variation'
      ],
      outputFormat: 'JSON with part variation'
    },
    outputSchema: {
      type: 'object',
      required: ['pv', 'pvPercent', 'totalVariation', 'artifacts'],
      properties: {
        pv: { type: 'number' },
        pvPercent: { type: 'number' },
        partAverages: { type: 'object' },
        partRange: { type: 'number' },
        totalVariation: { type: 'number' },
        partVariationChart: { type: 'object' },
        partSelectionAdequate: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'msa', 'part-variation']
}));

// Task 7: NDC Calculation
export const ndcCalculationTask = defineTask('msa-ndc', (args, taskCtx) => ({
  kind: 'agent',
  title: `NDC Calculation - ${args.measurementSystem}`,
  agent: {
    name: 'ndc-analyst',
    prompt: {
      role: 'NDC Analyst',
      task: 'Calculate number of distinct categories',
      context: args,
      instructions: [
        '1. Calculate ndc = 1.41 * (PV / GRR)',
        '2. Round down to whole number',
        '3. Minimum acceptable is 5',
        '4. Interpret ndc result',
        '5. Assess discrimination capability',
        '6. Compare to requirements',
        '7. Document calculation',
        '8. Visualize discrimination',
        '9. Note implications',
        '10. Document ndc results'
      ],
      outputFormat: 'JSON with ndc calculation'
    },
    outputSchema: {
      type: 'object',
      required: ['ndc', 'acceptable', 'interpretation', 'artifacts'],
      properties: {
        ndc: { type: 'number' },
        rawNdc: { type: 'number' },
        acceptable: { type: 'boolean' },
        interpretation: { type: 'string' },
        discriminationCapability: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'msa', 'ndc']
}));

// Task 8: Adequacy Assessment
export const adequacyAssessmentTask = defineTask('msa-adequacy', (args, taskCtx) => ({
  kind: 'agent',
  title: `MSA Adequacy Assessment - ${args.measurementSystem}`,
  agent: {
    name: 'adequacy-assessor',
    prompt: {
      role: 'MSA Adequacy Assessor',
      task: 'Assess measurement system adequacy',
      context: args,
      instructions: [
        '1. Apply AIAG criteria (%GRR < 10% excellent)',
        '2. Evaluate %GRR 10-30% (marginal)',
        '3. Evaluate %GRR > 30% (unacceptable)',
        '4. Verify ndc >= 5',
        '5. Assess for specific application',
        '6. Determine if system meets requirements',
        '7. Identify primary variation source',
        '8. Classify overall adequacy',
        '9. Document assessment criteria used',
        '10. Provide final recommendation'
      ],
      outputFormat: 'JSON with adequacy assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['assessment', 'acceptable', 'criteria', 'artifacts'],
      properties: {
        assessment: { type: 'string', enum: ['excellent', 'acceptable', 'marginal', 'unacceptable'] },
        acceptable: { type: 'boolean' },
        criteria: { type: 'object' },
        primaryVariationSource: { type: 'string' },
        recommendation: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'msa', 'adequacy']
}));

// Task 9: Improvement Recommendations
export const improvementRecommendationsTask = defineTask('msa-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: `MSA Improvement Recommendations - ${args.measurementSystem}`,
  agent: {
    name: 'improvement-advisor',
    prompt: {
      role: 'MSA Improvement Advisor',
      task: 'Recommend measurement system improvements',
      context: args,
      instructions: [
        '1. Analyze repeatability issues',
        '2. Analyze reproducibility issues',
        '3. Recommend gage improvements',
        '4. Recommend training needs',
        '5. Suggest procedure improvements',
        '6. Recommend environmental controls',
        '7. Suggest gage replacement if needed',
        '8. Prioritize recommendations',
        '9. Estimate improvement impact',
        '10. Document recommendations'
      ],
      outputFormat: 'JSON with recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'prioritized', 'artifacts'],
      properties: {
        recommendations: { type: 'array', items: { type: 'object' } },
        repeatabilityActions: { type: 'array', items: { type: 'string' } },
        reproducibilityActions: { type: 'array', items: { type: 'string' } },
        prioritized: { type: 'array', items: { type: 'object' } },
        expectedImprovement: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'msa', 'recommendations']
}));

// Task 10: MSA Report
export const msaReportTask = defineTask('msa-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `MSA Report - ${args.measurementSystem}`,
  agent: {
    name: 'report-writer',
    prompt: {
      role: 'Technical Report Writer',
      task: 'Generate comprehensive MSA report',
      context: args,
      instructions: [
        '1. Write executive summary',
        '2. Document measurement system',
        '3. Present study methodology',
        '4. Present Gage R&R results',
        '5. Include variance components',
        '6. Present ndc analysis',
        '7. Document adequacy assessment',
        '8. Include visualizations',
        '9. Present recommendations',
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
  labels: ['agent', 'msa', 'reporting']
}));
