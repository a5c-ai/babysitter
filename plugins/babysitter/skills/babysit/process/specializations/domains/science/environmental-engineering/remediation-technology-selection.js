/**
 * @process environmental-engineering/remediation-technology-selection
 * @description Remediation Technology Selection - Systematic evaluation and selection of remediation technologies
 * based on site conditions, contaminant characteristics, and remediation objectives.
 * @inputs { siteName: string, contaminants: array, affectedMedia: array, siteConditions: object }
 * @outputs { success: boolean, selectedTechnologies: array, evaluationMatrix: object, implementationPlan: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('environmental-engineering/remediation-technology-selection', {
 *   siteName: 'Former Gas Station',
 *   contaminants: ['benzene', 'MTBE', 'TPH'],
 *   affectedMedia: ['soil', 'groundwater'],
 *   siteConditions: { soilType: 'sandy', depthToGroundwater: 15 }
 * });
 *
 * @references
 * - EPA Remediation Technology Screening Matrix
 * - FRTR Remediation Technologies Screening Matrix
 * - ITRC Technology Decision Tools
 * - EPA CLU-IN Technology Information
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    siteName,
    contaminants = [],
    affectedMedia = [],
    siteConditions = {},
    remediationObjectives = {},
    constraints = {},
    outputDir = 'remediation-selection-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Remediation Technology Selection: ${siteName}`);
  ctx.log('info', `Contaminants: ${contaminants.join(', ')}, Media: ${affectedMedia.join(', ')}`);

  // ============================================================================
  // PHASE 1: SITE CONDITIONS EVALUATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Site Conditions Evaluation');

  const siteEvaluation = await ctx.task(siteEvaluationTask, {
    siteName,
    siteConditions,
    contaminants,
    affectedMedia,
    outputDir
  });

  artifacts.push(...siteEvaluation.artifacts);

  // ============================================================================
  // PHASE 2: TECHNOLOGY SCREENING
  // ============================================================================

  ctx.log('info', 'Phase 2: Technology Screening');

  const techScreening = await ctx.task(techScreeningTask, {
    siteName,
    siteEvaluation,
    contaminants,
    affectedMedia,
    outputDir
  });

  artifacts.push(...techScreening.artifacts);

  // ============================================================================
  // PHASE 3: DETAILED EVALUATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Detailed Technology Evaluation');

  const detailedEvaluation = await ctx.task(detailedEvaluationTask, {
    siteName,
    techScreening,
    siteEvaluation,
    remediationObjectives,
    constraints,
    outputDir
  });

  artifacts.push(...detailedEvaluation.artifacts);

  // Breakpoint: Evaluation Review
  await ctx.breakpoint({
    question: `Technology evaluation complete for ${siteName}. ${detailedEvaluation.rankedTechnologies.length} technologies evaluated. Review ranking?`,
    title: 'Technology Evaluation Review',
    context: {
      runId: ctx.runId,
      rankedTechnologies: detailedEvaluation.rankedTechnologies,
      evaluationCriteria: detailedEvaluation.evaluationCriteria,
      files: detailedEvaluation.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // PHASE 4: TREATABILITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Treatability Assessment');

  const treatabilityAssessment = await ctx.task(treatabilityTask, {
    siteName,
    detailedEvaluation,
    siteConditions,
    contaminants,
    outputDir
  });

  artifacts.push(...treatabilityAssessment.artifacts);

  // ============================================================================
  // PHASE 5: COST-BENEFIT ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Cost-Benefit Analysis');

  const costBenefitAnalysis = await ctx.task(costBenefitTask, {
    siteName,
    detailedEvaluation,
    treatabilityAssessment,
    remediationObjectives,
    outputDir
  });

  artifacts.push(...costBenefitAnalysis.artifacts);

  // ============================================================================
  // PHASE 6: TECHNOLOGY SELECTION
  // ============================================================================

  ctx.log('info', 'Phase 6: Technology Selection');

  const technologySelection = await ctx.task(selectionTask, {
    siteName,
    detailedEvaluation,
    treatabilityAssessment,
    costBenefitAnalysis,
    constraints,
    outputDir
  });

  artifacts.push(...technologySelection.artifacts);

  // ============================================================================
  // PHASE 7: IMPLEMENTATION PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 7: Implementation Planning');

  const implementationPlan = await ctx.task(implementationPlanTask, {
    siteName,
    technologySelection,
    siteConditions,
    remediationObjectives,
    outputDir
  });

  artifacts.push(...implementationPlan.artifacts);

  // ============================================================================
  // PHASE 8: SELECTION REPORT
  // ============================================================================

  ctx.log('info', 'Phase 8: Selection Report');

  const selectionReport = await ctx.task(selectionReportTask, {
    siteName,
    siteEvaluation,
    techScreening,
    detailedEvaluation,
    treatabilityAssessment,
    costBenefitAnalysis,
    technologySelection,
    implementationPlan,
    outputDir
  });

  artifacts.push(...selectionReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    siteName,
    selectedTechnologies: technologySelection.selectedTechnologies,
    evaluationMatrix: detailedEvaluation.evaluationMatrix,
    implementationPlan: {
      phases: implementationPlan.phases,
      timeline: implementationPlan.timeline,
      costEstimate: implementationPlan.costEstimate
    },
    costBenefitSummary: costBenefitAnalysis.summary,
    artifacts,
    duration,
    metadata: {
      processId: 'environmental-engineering/remediation-technology-selection',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const siteEvaluationTask = defineTask('site-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Site Conditions Evaluation',
  agent: {
    name: 'remediation-specialist',
    prompt: {
      role: 'Remediation Site Specialist',
      task: 'Evaluate site conditions for technology screening',
      context: args,
      instructions: [
        '1. Characterize subsurface geology',
        '2. Evaluate hydrogeologic conditions',
        '3. Assess contaminant distribution',
        '4. Evaluate contaminant properties',
        '5. Assess site accessibility',
        '6. Identify infrastructure constraints',
        '7. Evaluate receptor pathways',
        '8. Assess natural attenuation potential',
        '9. Identify geochemical conditions',
        '10. Document site conditions summary'
      ],
      outputFormat: 'JSON with site summary, constraints, favorable conditions'
    },
    outputSchema: {
      type: 'object',
      required: ['siteSummary', 'constraints', 'favorableConditions', 'artifacts'],
      properties: {
        siteSummary: { type: 'object' },
        geology: { type: 'object' },
        hydrogeology: { type: 'object' },
        contaminantDistribution: { type: 'object' },
        constraints: { type: 'array' },
        favorableConditions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'remediation', 'site-evaluation']
}));

export const techScreeningTask = defineTask('tech-screening', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Technology Screening',
  agent: {
    name: 'remediation-specialist',
    prompt: {
      role: 'Remediation Technology Specialist',
      task: 'Screen remediation technologies for applicability',
      context: args,
      instructions: [
        '1. Identify potentially applicable technologies',
        '2. Screen against contaminant types',
        '3. Screen against affected media',
        '4. Screen against site conditions',
        '5. Evaluate physical treatment technologies',
        '6. Evaluate chemical treatment technologies',
        '7. Evaluate biological treatment technologies',
        '8. Evaluate thermal treatment technologies',
        '9. Evaluate containment technologies',
        '10. Document screening results'
      ],
      outputFormat: 'JSON with applicable technologies, screening results'
    },
    outputSchema: {
      type: 'object',
      required: ['applicableTechnologies', 'screeningResults', 'eliminatedTechnologies', 'artifacts'],
      properties: {
        applicableTechnologies: { type: 'array' },
        screeningResults: { type: 'object' },
        physicalTreatment: { type: 'array' },
        chemicalTreatment: { type: 'array' },
        biologicalTreatment: { type: 'array' },
        eliminatedTechnologies: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'remediation', 'screening']
}));

export const detailedEvaluationTask = defineTask('detailed-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Detailed Technology Evaluation',
  agent: {
    name: 'remediation-specialist',
    prompt: {
      role: 'Remediation Evaluation Engineer',
      task: 'Conduct detailed evaluation of screened technologies',
      context: args,
      instructions: [
        '1. Define evaluation criteria',
        '2. Evaluate technical effectiveness',
        '3. Evaluate implementability',
        '4. Evaluate cost',
        '5. Evaluate time to achieve objectives',
        '6. Evaluate regulatory acceptability',
        '7. Evaluate community acceptance',
        '8. Evaluate long-term reliability',
        '9. Score and rank technologies',
        '10. Document evaluation matrix'
      ],
      outputFormat: 'JSON with evaluation matrix, ranked technologies, criteria'
    },
    outputSchema: {
      type: 'object',
      required: ['evaluationMatrix', 'rankedTechnologies', 'evaluationCriteria', 'artifacts'],
      properties: {
        evaluationCriteria: { type: 'array' },
        evaluationMatrix: { type: 'object' },
        rankedTechnologies: { type: 'array' },
        scores: { type: 'object' },
        strengths: { type: 'object' },
        weaknesses: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'remediation', 'evaluation']
}));

export const treatabilityTask = defineTask('treatability', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Treatability Assessment',
  agent: {
    name: 'remediation-specialist',
    prompt: {
      role: 'Treatability Testing Specialist',
      task: 'Assess treatability and pilot testing needs',
      context: args,
      instructions: [
        '1. Identify treatability data needs',
        '2. Design bench-scale testing',
        '3. Design pilot-scale testing',
        '4. Evaluate existing treatability data',
        '5. Assess performance uncertainty',
        '6. Identify scale-up factors',
        '7. Estimate achievable treatment levels',
        '8. Evaluate technology maturity',
        '9. Assess site-specific factors',
        '10. Document treatability assessment'
      ],
      outputFormat: 'JSON with treatability results, testing needs, uncertainty'
    },
    outputSchema: {
      type: 'object',
      required: ['treatabilityResults', 'testingNeeds', 'performanceEstimates', 'artifacts'],
      properties: {
        treatabilityResults: { type: 'object' },
        testingNeeds: { type: 'array' },
        benchScalePlan: { type: 'object' },
        pilotScalePlan: { type: 'object' },
        performanceEstimates: { type: 'object' },
        uncertainty: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'remediation', 'treatability']
}));

export const costBenefitTask = defineTask('cost-benefit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Cost-Benefit Analysis',
  agent: {
    name: 'remediation-specialist',
    prompt: {
      role: 'Remediation Cost Analyst',
      task: 'Conduct cost-benefit analysis of technologies',
      context: args,
      instructions: [
        '1. Estimate capital costs',
        '2. Estimate O&M costs',
        '3. Calculate net present value',
        '4. Estimate remediation timeframe',
        '5. Calculate cost per unit of contaminant removed',
        '6. Evaluate cost uncertainty',
        '7. Compare lifecycle costs',
        '8. Evaluate co-benefits',
        '9. Assess risk reduction value',
        '10. Document cost-benefit analysis'
      ],
      outputFormat: 'JSON with cost analysis, NPV, cost-effectiveness'
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'costAnalysis', 'costEffectiveness', 'artifacts'],
      properties: {
        summary: { type: 'object' },
        costAnalysis: { type: 'object' },
        capitalCosts: { type: 'object' },
        omCosts: { type: 'object' },
        netPresentValue: { type: 'object' },
        costEffectiveness: { type: 'object' },
        coBenefits: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'remediation', 'cost-benefit']
}));

export const selectionTask = defineTask('selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Technology Selection',
  agent: {
    name: 'remediation-specialist',
    prompt: {
      role: 'Remediation Selection Lead',
      task: 'Select preferred remediation technologies',
      context: args,
      instructions: [
        '1. Review evaluation results',
        '2. Apply selection criteria',
        '3. Consider technology combinations',
        '4. Evaluate treatment trains',
        '5. Select primary technology',
        '6. Select contingency technologies',
        '7. Document selection rationale',
        '8. Address stakeholder preferences',
        '9. Verify regulatory acceptability',
        '10. Finalize technology selection'
      ],
      outputFormat: 'JSON with selected technologies, rationale'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedTechnologies', 'selectionRationale', 'treatmentTrain', 'artifacts'],
      properties: {
        selectedTechnologies: { type: 'array' },
        primaryTechnology: { type: 'object' },
        contingencyTechnology: { type: 'object' },
        treatmentTrain: { type: 'array' },
        selectionRationale: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'remediation', 'selection']
}));

export const implementationPlanTask = defineTask('implementation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implementation Planning',
  agent: {
    name: 'remediation-specialist',
    prompt: {
      role: 'Remediation Implementation Planner',
      task: 'Develop implementation plan for selected technologies',
      context: args,
      instructions: [
        '1. Develop phased implementation approach',
        '2. Identify design requirements',
        '3. Develop implementation schedule',
        '4. Identify permitting requirements',
        '5. Develop monitoring plan',
        '6. Establish performance metrics',
        '7. Develop contingency triggers',
        '8. Estimate implementation costs',
        '9. Identify resource requirements',
        '10. Document implementation plan'
      ],
      outputFormat: 'JSON with phases, timeline, cost estimate'
    },
    outputSchema: {
      type: 'object',
      required: ['phases', 'timeline', 'costEstimate', 'artifacts'],
      properties: {
        phases: { type: 'array' },
        timeline: { type: 'object' },
        designRequirements: { type: 'object' },
        permitting: { type: 'object' },
        monitoringPlan: { type: 'object' },
        performanceMetrics: { type: 'array' },
        costEstimate: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'remediation', 'implementation']
}));

export const selectionReportTask = defineTask('selection-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Selection Report',
  agent: {
    name: 'remediation-specialist',
    prompt: {
      role: 'Remediation Report Writer',
      task: 'Prepare technology selection report',
      context: args,
      instructions: [
        '1. Prepare executive summary',
        '2. Document site conditions',
        '3. Present screening results',
        '4. Present detailed evaluation',
        '5. Present treatability assessment',
        '6. Present cost-benefit analysis',
        '7. Present technology selection',
        '8. Present implementation plan',
        '9. Document conclusions',
        '10. Compile supporting documentation'
      ],
      outputFormat: 'JSON with report path, conclusions, recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'conclusions', 'recommendations', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        conclusions: { type: 'array' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'remediation', 'reporting']
}));
