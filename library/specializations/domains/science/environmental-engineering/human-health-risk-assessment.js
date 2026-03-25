/**
 * @process environmental-engineering/human-health-risk-assessment
 * @description Human Health Risk Assessment - Quantitative evaluation of potential health risks from site contamination
 * including exposure pathway analysis, toxicity assessment, and risk characterization.
 * @inputs { siteName: string, contaminantsOfConcern: array, receptorPopulations: array, exposureScenarios: array }
 * @outputs { success: boolean, riskAssessment: object, riskCharacterization: object, remedialGoals: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('environmental-engineering/human-health-risk-assessment', {
 *   siteName: 'Former Manufacturing Site',
 *   contaminantsOfConcern: ['benzene', 'lead', 'TCE'],
 *   receptorPopulations: ['residential-adult', 'residential-child', 'construction-worker'],
 *   exposureScenarios: ['soil-ingestion', 'groundwater-ingestion', 'vapor-intrusion']
 * });
 *
 * @references
 * - EPA Risk Assessment Guidance for Superfund (RAGS)
 * - EPA Regional Screening Levels
 * - ASTM RBCA Standard Guide
 * - EPA Exposure Factors Handbook
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    siteName,
    contaminantsOfConcern = [],
    receptorPopulations = [],
    exposureScenarios = [],
    siteData = {},
    outputDir = 'risk-assessment-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Human Health Risk Assessment: ${siteName}`);
  ctx.log('info', `COCs: ${contaminantsOfConcern.length}, Receptors: ${receptorPopulations.length}`);

  // ============================================================================
  // PHASE 1: HAZARD IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Hazard Identification');

  const hazardIdentification = await ctx.task(hazardIdentificationTask, {
    siteName,
    contaminantsOfConcern,
    siteData,
    outputDir
  });

  artifacts.push(...hazardIdentification.artifacts);

  // ============================================================================
  // PHASE 2: EXPOSURE ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 2: Exposure Assessment');

  const exposureAssessment = await ctx.task(exposureAssessmentTask, {
    siteName,
    contaminantsOfConcern,
    receptorPopulations,
    exposureScenarios,
    siteData,
    outputDir
  });

  artifacts.push(...exposureAssessment.artifacts);

  // ============================================================================
  // PHASE 3: TOXICITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Toxicity Assessment');

  const toxicityAssessment = await ctx.task(toxicityAssessmentTask, {
    siteName,
    contaminantsOfConcern,
    exposureAssessment,
    outputDir
  });

  artifacts.push(...toxicityAssessment.artifacts);

  // ============================================================================
  // PHASE 4: RISK CHARACTERIZATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Risk Characterization');

  const riskCharacterization = await ctx.task(riskCharacterizationTask, {
    siteName,
    hazardIdentification,
    exposureAssessment,
    toxicityAssessment,
    outputDir
  });

  artifacts.push(...riskCharacterization.artifacts);

  // Breakpoint: Risk Characterization Review
  await ctx.breakpoint({
    question: `Risk characterization complete for ${siteName}. Cancer risk: ${riskCharacterization.totalCancerRisk}, HI: ${riskCharacterization.hazardIndex}. Review results?`,
    title: 'Risk Characterization Review',
    context: {
      runId: ctx.runId,
      cancerRisk: riskCharacterization.totalCancerRisk,
      hazardIndex: riskCharacterization.hazardIndex,
      riskDrivers: riskCharacterization.riskDrivers,
      files: riskCharacterization.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // PHASE 5: UNCERTAINTY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Uncertainty Analysis');

  const uncertaintyAnalysis = await ctx.task(uncertaintyAnalysisTask, {
    siteName,
    riskCharacterization,
    exposureAssessment,
    toxicityAssessment,
    outputDir
  });

  artifacts.push(...uncertaintyAnalysis.artifacts);

  // ============================================================================
  // PHASE 6: REMEDIAL GOALS
  // ============================================================================

  ctx.log('info', 'Phase 6: Risk-Based Remedial Goals');

  const remedialGoals = await ctx.task(remedialGoalsTask, {
    siteName,
    contaminantsOfConcern,
    riskCharacterization,
    exposureAssessment,
    toxicityAssessment,
    outputDir
  });

  artifacts.push(...remedialGoals.artifacts);

  // ============================================================================
  // PHASE 7: RISK ASSESSMENT REPORT
  // ============================================================================

  ctx.log('info', 'Phase 7: Risk Assessment Report');

  const riskReport = await ctx.task(riskReportTask, {
    siteName,
    hazardIdentification,
    exposureAssessment,
    toxicityAssessment,
    riskCharacterization,
    uncertaintyAnalysis,
    remedialGoals,
    outputDir
  });

  artifacts.push(...riskReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    siteName,
    riskAssessment: {
      contaminantsOfConcern: hazardIdentification.finalCOCs,
      exposurePathways: exposureAssessment.completePathways,
      receptors: receptorPopulations
    },
    riskCharacterization: {
      totalCancerRisk: riskCharacterization.totalCancerRisk,
      hazardIndex: riskCharacterization.hazardIndex,
      riskDrivers: riskCharacterization.riskDrivers,
      exceedsAcceptableRisk: riskCharacterization.exceedsAcceptableRisk
    },
    remedialGoals: {
      riskBasedConcentrations: remedialGoals.riskBasedConcentrations,
      protectiveConcentrations: remedialGoals.protectiveConcentrations
    },
    uncertaintyFactors: uncertaintyAnalysis.keyUncertainties,
    artifacts,
    duration,
    metadata: {
      processId: 'environmental-engineering/human-health-risk-assessment',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const hazardIdentificationTask = defineTask('hazard-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Hazard Identification',
  agent: {
    name: 'risk-assessment-specialist',
    prompt: {
      role: 'Risk Assessment Toxicologist',
      task: 'Identify hazards and select contaminants of concern',
      context: args,
      instructions: [
        '1. Review site characterization data',
        '2. Screen detected chemicals against background',
        '3. Screen against risk-based screening levels',
        '4. Evaluate detection frequency',
        '5. Consider essential nutrients exclusion',
        '6. Identify contaminants of potential concern (COPCs)',
        '7. Finalize contaminants of concern (COCs)',
        '8. Document chemical properties',
        '9. Identify indicator chemicals',
        '10. Document hazard identification'
      ],
      outputFormat: 'JSON with COCs, screening results, rationale'
    },
    outputSchema: {
      type: 'object',
      required: ['finalCOCs', 'screeningResults', 'rationale', 'artifacts'],
      properties: {
        finalCOCs: { type: 'array' },
        copcs: { type: 'array' },
        screeningResults: { type: 'object' },
        eliminatedChemicals: { type: 'array' },
        rationale: { type: 'object' },
        chemicalProperties: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'risk-assessment', 'hazard-identification']
}));

export const exposureAssessmentTask = defineTask('exposure-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Exposure Assessment',
  agent: {
    name: 'risk-assessment-specialist',
    prompt: {
      role: 'Exposure Assessment Specialist',
      task: 'Assess exposure pathways and calculate exposure doses',
      context: args,
      instructions: [
        '1. Develop conceptual site model',
        '2. Identify potential exposure pathways',
        '3. Evaluate pathway completeness',
        '4. Define receptor populations',
        '5. Select exposure parameters',
        '6. Calculate exposure point concentrations',
        '7. Calculate chronic daily intake',
        '8. Calculate average daily dose',
        '9. Document exposure assumptions',
        '10. Prepare exposure assessment tables'
      ],
      outputFormat: 'JSON with complete pathways, exposure doses, EPCs'
    },
    outputSchema: {
      type: 'object',
      required: ['completePathways', 'exposureDoses', 'epcs', 'artifacts'],
      properties: {
        conceptualSiteModel: { type: 'object' },
        completePathways: { type: 'array' },
        incompletePathways: { type: 'array' },
        exposureParameters: { type: 'object' },
        epcs: { type: 'object' },
        exposureDoses: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'risk-assessment', 'exposure']
}));

export const toxicityAssessmentTask = defineTask('toxicity-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Toxicity Assessment',
  agent: {
    name: 'risk-assessment-specialist',
    prompt: {
      role: 'Toxicologist',
      task: 'Compile toxicity values for risk characterization',
      context: args,
      instructions: [
        '1. Identify cancer slope factors (oral, inhalation)',
        '2. Identify reference doses (RfD)',
        '3. Identify reference concentrations (RfC)',
        '4. Follow EPA toxicity hierarchy (IRIS, PPRTV, etc.)',
        '5. Document toxicity value sources',
        '6. Identify weight-of-evidence classifications',
        '7. Evaluate route-to-route extrapolation needs',
        '8. Document target organs and critical effects',
        '9. Compile dermal absorption factors',
        '10. Prepare toxicity summary tables'
      ],
      outputFormat: 'JSON with toxicity values, sources, classifications'
    },
    outputSchema: {
      type: 'object',
      required: ['toxicityValues', 'sources', 'classifications', 'artifacts'],
      properties: {
        toxicityValues: { type: 'object' },
        cancerSlopeFactors: { type: 'object' },
        referenceDoses: { type: 'object' },
        sources: { type: 'object' },
        classifications: { type: 'object' },
        targetOrgans: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'risk-assessment', 'toxicity']
}));

export const riskCharacterizationTask = defineTask('risk-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Risk Characterization',
  agent: {
    name: 'risk-assessment-specialist',
    prompt: {
      role: 'Risk Characterization Specialist',
      task: 'Characterize cancer and non-cancer risks',
      context: args,
      instructions: [
        '1. Calculate individual excess lifetime cancer risk (IELCR)',
        '2. Calculate cumulative cancer risk',
        '3. Calculate hazard quotients',
        '4. Calculate hazard index',
        '5. Evaluate additive effects',
        '6. Compare to acceptable risk levels',
        '7. Identify risk drivers',
        '8. Identify pathway drivers',
        '9. Evaluate cumulative risks across pathways',
        '10. Document risk characterization'
      ],
      outputFormat: 'JSON with cancer risk, hazard index, risk drivers'
    },
    outputSchema: {
      type: 'object',
      required: ['totalCancerRisk', 'hazardIndex', 'riskDrivers', 'exceedsAcceptableRisk', 'artifacts'],
      properties: {
        totalCancerRisk: { type: 'string' },
        cancerRiskByChemical: { type: 'object' },
        cancerRiskByPathway: { type: 'object' },
        hazardIndex: { type: 'number' },
        hazardQuotients: { type: 'object' },
        riskDrivers: { type: 'array' },
        pathwayDrivers: { type: 'array' },
        exceedsAcceptableRisk: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'risk-assessment', 'characterization']
}));

export const uncertaintyAnalysisTask = defineTask('uncertainty-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Uncertainty Analysis',
  agent: {
    name: 'risk-assessment-specialist',
    prompt: {
      role: 'Risk Assessment Analyst',
      task: 'Analyze uncertainties in risk assessment',
      context: args,
      instructions: [
        '1. Identify exposure parameter uncertainties',
        '2. Identify toxicity value uncertainties',
        '3. Identify data quality uncertainties',
        '4. Identify model uncertainties',
        '5. Assess conservative assumptions',
        '6. Evaluate sensitivity to key parameters',
        '7. Discuss upper-bound vs. central tendency',
        '8. Assess overall confidence in results',
        '9. Identify key data gaps',
        '10. Document uncertainty analysis'
      ],
      outputFormat: 'JSON with key uncertainties, sensitivity, confidence'
    },
    outputSchema: {
      type: 'object',
      required: ['keyUncertainties', 'sensitivityAnalysis', 'overallConfidence', 'artifacts'],
      properties: {
        keyUncertainties: { type: 'array' },
        exposureUncertainties: { type: 'array' },
        toxicityUncertainties: { type: 'array' },
        sensitivityAnalysis: { type: 'object' },
        conservativeAssumptions: { type: 'array' },
        overallConfidence: { type: 'string' },
        dataGaps: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'risk-assessment', 'uncertainty']
}));

export const remedialGoalsTask = defineTask('remedial-goals', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Risk-Based Remedial Goals',
  agent: {
    name: 'risk-assessment-specialist',
    prompt: {
      role: 'Remedial Goal Calculator',
      task: 'Calculate risk-based remedial goals',
      context: args,
      instructions: [
        '1. Back-calculate soil cleanup levels',
        '2. Back-calculate groundwater cleanup levels',
        '3. Apply target risk levels (1E-6, HQ=1)',
        '4. Consider cumulative risk',
        '5. Compare to regulatory standards',
        '6. Compare to background levels',
        '7. Consider technical feasibility',
        '8. Establish protective concentrations',
        '9. Document calculation methodology',
        '10. Prepare remedial goals table'
      ],
      outputFormat: 'JSON with risk-based concentrations, protective levels'
    },
    outputSchema: {
      type: 'object',
      required: ['riskBasedConcentrations', 'protectiveConcentrations', 'artifacts'],
      properties: {
        riskBasedConcentrations: { type: 'object' },
        soilCleanupLevels: { type: 'object' },
        groundwaterCleanupLevels: { type: 'object' },
        protectiveConcentrations: { type: 'object' },
        comparisonToStandards: { type: 'object' },
        calculationMethodology: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'risk-assessment', 'remedial-goals']
}));

export const riskReportTask = defineTask('risk-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Risk Assessment Report',
  agent: {
    name: 'risk-assessment-specialist',
    prompt: {
      role: 'Risk Assessment Report Writer',
      task: 'Prepare comprehensive risk assessment report',
      context: args,
      instructions: [
        '1. Prepare executive summary',
        '2. Document site background',
        '3. Present hazard identification',
        '4. Present exposure assessment',
        '5. Present toxicity assessment',
        '6. Present risk characterization',
        '7. Present uncertainty analysis',
        '8. Present remedial goals',
        '9. Provide conclusions and recommendations',
        '10. Compile appendices'
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
        limitations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'risk-assessment', 'reporting']
}));
