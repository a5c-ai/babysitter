/**
 * @process domains/science/scientific-discovery/preregistration-registered-reports
 * @description Pre-register hypotheses and analysis plans - Guides researchers through creating comprehensive
 * preregistration documents that specify hypotheses, methods, and analysis plans before data collection,
 * following Open Science Framework (OSF) and Registered Reports guidelines.
 * @inputs { studyTitle: string, hypotheses: array, methods: object, analysisPlans: array, registryTarget?: string }
 * @outputs { success: boolean, preregistration: object, registeredReport: object, qualityScore: number, artifacts: array }
 *
 * @example
 * const result = await orchestrate('domains/science/scientific-discovery/preregistration-registered-reports', {
 *   studyTitle: 'Effect of Sleep Duration on Cognitive Performance',
 *   hypotheses: [{ statement: 'Reduced sleep impairs working memory', direction: 'negative' }],
 *   methods: { design: 'within-subjects', n: 60 },
 *   registryTarget: 'OSF'
 * });
 *
 * @references
 * - Nosek, B.A. et al. (2018). The preregistration revolution
 * - Chambers, C.D. (2013). Registered Reports: A new publishing initiative
 * - OSF Preregistration Templates: https://osf.io/prereg/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    studyTitle,
    hypotheses = [],
    methods = {},
    analysisPlans = [],
    registryTarget = 'OSF',
    outputDir = 'preregistration-output',
    minimumCompletenessScore = 85
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Preregistration for: ${studyTitle}`);

  // ============================================================================
  // PHASE 1: STUDY INFORMATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Documenting study information');
  const studyInfo = await ctx.task(studyInformationTask, {
    studyTitle,
    hypotheses,
    methods,
    registryTarget,
    outputDir
  });

  artifacts.push(...studyInfo.artifacts);

  // ============================================================================
  // PHASE 2: HYPOTHESES SPECIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Specifying hypotheses in detail');
  const hypothesesSpec = await ctx.task(hypothesesSpecificationTask, {
    studyTitle,
    hypotheses,
    methods,
    outputDir
  });

  artifacts.push(...hypothesesSpec.artifacts);

  // ============================================================================
  // PHASE 3: DESIGN PLAN
  // ============================================================================

  ctx.log('info', 'Phase 3: Documenting design plan');
  const designPlan = await ctx.task(designPlanTask, {
    studyTitle,
    methods,
    hypothesesSpec,
    outputDir
  });

  artifacts.push(...designPlan.artifacts);

  // ============================================================================
  // PHASE 4: SAMPLING PLAN
  // ============================================================================

  ctx.log('info', 'Phase 4: Specifying sampling plan');
  const samplingPlan = await ctx.task(samplingPlanTask, {
    studyTitle,
    methods,
    designPlan,
    outputDir
  });

  artifacts.push(...samplingPlan.artifacts);

  // Breakpoint: Review core preregistration elements
  await ctx.breakpoint({
    question: `Core preregistration elements complete. ${hypothesesSpec.hypothesesCount} hypotheses specified. Sample size: ${samplingPlan.targetN}. Review before analysis plan?`,
    title: 'Preregistration Core Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        studyTitle,
        hypothesesCount: hypothesesSpec.hypothesesCount,
        targetN: samplingPlan.targetN,
        designType: designPlan.designType
      }
    }
  });

  // ============================================================================
  // PHASE 5: VARIABLES SPECIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Specifying variables');
  const variablesSpec = await ctx.task(variablesSpecificationTask, {
    studyTitle,
    hypothesesSpec,
    methods,
    designPlan,
    outputDir
  });

  artifacts.push(...variablesSpec.artifacts);

  // ============================================================================
  // PHASE 6: ANALYSIS PLAN
  // ============================================================================

  ctx.log('info', 'Phase 6: Developing detailed analysis plan');
  const analysisPlanDoc = await ctx.task(analysisPlanTask, {
    studyTitle,
    hypothesesSpec,
    variablesSpec,
    samplingPlan,
    analysisPlans,
    outputDir
  });

  artifacts.push(...analysisPlanDoc.artifacts);

  // ============================================================================
  // PHASE 7: INFERENCE CRITERIA
  // ============================================================================

  ctx.log('info', 'Phase 7: Specifying inference criteria');
  const inferenceCriteria = await ctx.task(inferenceCriteriaTask, {
    studyTitle,
    hypothesesSpec,
    analysisPlanDoc,
    outputDir
  });

  artifacts.push(...inferenceCriteria.artifacts);

  // ============================================================================
  // PHASE 8: DATA EXCLUSION CRITERIA
  // ============================================================================

  ctx.log('info', 'Phase 8: Defining data exclusion criteria');
  const exclusionCriteria = await ctx.task(exclusionCriteriaTask, {
    studyTitle,
    designPlan,
    samplingPlan,
    analysisPlanDoc,
    outputDir
  });

  artifacts.push(...exclusionCriteria.artifacts);

  // ============================================================================
  // PHASE 9: PREREGISTRATION DOCUMENT ASSEMBLY
  // ============================================================================

  ctx.log('info', 'Phase 9: Assembling preregistration document');
  const preregistrationDoc = await ctx.task(preregistrationAssemblyTask, {
    studyTitle,
    studyInfo,
    hypothesesSpec,
    designPlan,
    samplingPlan,
    variablesSpec,
    analysisPlanDoc,
    inferenceCriteria,
    exclusionCriteria,
    registryTarget,
    outputDir
  });

  artifacts.push(...preregistrationDoc.artifacts);

  // ============================================================================
  // PHASE 10: COMPLETENESS SCORING
  // ============================================================================

  ctx.log('info', 'Phase 10: Scoring preregistration completeness');
  const completenessScore = await ctx.task(completenessScoringTask, {
    studyTitle,
    preregistrationDoc,
    registryTarget,
    minimumCompletenessScore,
    outputDir
  });

  artifacts.push(...completenessScore.artifacts);

  const completenessMet = completenessScore.overallScore >= minimumCompletenessScore;

  // Final breakpoint
  await ctx.breakpoint({
    question: `Preregistration complete for "${studyTitle}". Completeness score: ${completenessScore.overallScore}/100. ${completenessMet ? 'Ready for submission!' : 'May need additional detail.'} Approve for registration?`,
    title: 'Preregistration Approval',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        studyTitle,
        completenessScore: completenessScore.overallScore,
        completenessMet,
        registryTarget,
        hypothesesCount: hypothesesSpec.hypothesesCount
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    studyTitle,
    preregistration: {
      studyInfo: studyInfo.summary,
      hypotheses: hypothesesSpec.formattedHypotheses,
      designPlan: designPlan.summary,
      samplingPlan: samplingPlan.summary,
      variables: variablesSpec.summary,
      analysisPlan: analysisPlanDoc.summary,
      inferenceCriteria: inferenceCriteria.summary,
      exclusionCriteria: exclusionCriteria.summary,
      documentPath: preregistrationDoc.documentPath
    },
    registeredReport: {
      format: registryTarget,
      submissionReady: completenessMet,
      requiredSections: preregistrationDoc.requiredSections,
      optionalSections: preregistrationDoc.optionalSections
    },
    qualityScore: {
      overall: completenessScore.overallScore,
      completenessMet,
      componentScores: completenessScore.componentScores,
      missingElements: completenessScore.missingElements
    },
    artifacts,
    duration,
    metadata: {
      processId: 'domains/science/scientific-discovery/preregistration-registered-reports',
      timestamp: startTime,
      registryTarget,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const studyInformationTask = defineTask('study-information', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document study information',
  skill: { name: 'statistical-test-selector' },
  agent: {
    name: 'research-methodologist',
    skills: ['statistical-test-selector', 'hypothesis-generator'],
    prompt: {
      role: 'Research documentation specialist',
      task: 'Document comprehensive study information for preregistration',
      context: args,
      instructions: [
        'Create descriptive study title',
        'List all authors and affiliations',
        'Write study description and rationale',
        'Document research questions',
        'Describe theoretical background',
        'Identify funding sources and conflicts of interest',
        'Specify target registry (OSF, AsPredicted, etc.)',
        'Note any related prior work or pilot studies',
        'Document ethical approvals obtained or planned',
        'Specify planned data availability'
      ],
      outputFormat: 'JSON with summary, title, authors, description, rationale, ethicalApprovals, dataAvailability, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'title', 'description', 'artifacts'],
      properties: {
        summary: { type: 'object' },
        title: { type: 'string' },
        authors: { type: 'array', items: { type: 'string' } },
        description: { type: 'string' },
        rationale: { type: 'string' },
        researchQuestions: { type: 'array', items: { type: 'string' } },
        ethicalApprovals: { type: 'string' },
        fundingSources: { type: 'array', items: { type: 'string' } },
        conflictsOfInterest: { type: 'string' },
        dataAvailability: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'preregistration', 'study-info']
}));

export const hypothesesSpecificationTask = defineTask('hypotheses-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Specify hypotheses in detail',
  skill: { name: 'statistical-test-selector' },
  agent: {
    name: 'research-methodologist',
    skills: ['statistical-test-selector', 'hypothesis-generator'],
    prompt: {
      role: 'Research hypothesis specialist',
      task: 'Specify all hypotheses in precise, testable format for preregistration',
      context: args,
      instructions: [
        'Number each hypothesis clearly',
        'State each hypothesis precisely and unambiguously',
        'Distinguish confirmatory from exploratory hypotheses',
        'Specify direction of predicted effects',
        'State null and alternative hypotheses formally',
        'Link each hypothesis to specific variables',
        'Prioritize hypotheses (primary vs secondary)',
        'Distinguish between directional and non-directional tests',
        'Document theoretical basis for each prediction',
        'Specify what would constitute support/disconfirmation'
      ],
      outputFormat: 'JSON with formattedHypotheses, hypothesesCount, primaryHypotheses, secondaryHypotheses, exploratoryHypotheses, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['formattedHypotheses', 'hypothesesCount', 'artifacts'],
      properties: {
        formattedHypotheses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              number: { type: 'number' },
              statement: { type: 'string' },
              type: { type: 'string', enum: ['confirmatory', 'exploratory'] },
              priority: { type: 'string', enum: ['primary', 'secondary'] },
              direction: { type: 'string' },
              nullHypothesis: { type: 'string' },
              alternativeHypothesis: { type: 'string' },
              variables: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        hypothesesCount: { type: 'number' },
        primaryHypotheses: { type: 'number' },
        secondaryHypotheses: { type: 'number' },
        exploratoryHypotheses: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'preregistration', 'hypotheses']
}));

export const designPlanTask = defineTask('design-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document design plan',
  skill: { name: 'statistical-test-selector' },
  agent: {
    name: 'research-methodologist',
    skills: ['statistical-test-selector', 'hypothesis-generator'],
    prompt: {
      role: 'Research design methodologist',
      task: 'Document the complete study design plan for preregistration',
      context: args,
      instructions: [
        'Specify study type (experiment, observational, survey, etc.)',
        'Describe study design (between-subjects, within-subjects, factorial)',
        'Detail randomization procedures',
        'Describe blinding procedures',
        'Specify number and nature of conditions/groups',
        'Document timing and duration of procedures',
        'Describe materials and equipment',
        'Specify setting and context',
        'Document any deception and debriefing',
        'Address potential confounds and their control'
      ],
      outputFormat: 'JSON with summary, designType, studyDesign, randomization, blinding, conditions, procedures, materials, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'designType', 'studyDesign', 'artifacts'],
      properties: {
        summary: { type: 'object' },
        designType: { type: 'string' },
        studyDesign: { type: 'string' },
        randomization: { type: 'string' },
        blinding: { type: 'string' },
        conditions: { type: 'array', items: { type: 'string' } },
        numberOfConditions: { type: 'number' },
        procedures: { type: 'string' },
        materials: { type: 'array', items: { type: 'string' } },
        setting: { type: 'string' },
        duration: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'preregistration', 'design-plan']
}));

export const samplingPlanTask = defineTask('sampling-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Specify sampling plan',
  skill: { name: 'statistical-test-selector' },
  agent: {
    name: 'research-methodologist',
    skills: ['statistical-test-selector', 'hypothesis-generator'],
    prompt: {
      role: 'Sampling and power analysis specialist',
      task: 'Document the complete sampling plan including sample size justification',
      context: args,
      instructions: [
        'Describe target population',
        'Specify inclusion and exclusion criteria for participants',
        'Describe sampling method (random, convenience, stratified, etc.)',
        'Provide sample size and how it was determined',
        'Document power analysis with all parameters',
        'Specify effect size estimate source',
        'Describe recruitment procedures',
        'Specify compensation if any',
        'Document data collection stopping rule',
        'Address potential attrition and mitigation'
      ],
      outputFormat: 'JSON with summary, targetN, targetPopulation, inclusionCriteria, exclusionCriteria, samplingMethod, powerAnalysis, recruitmentProcedures, stoppingRule, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'targetN', 'powerAnalysis', 'artifacts'],
      properties: {
        summary: { type: 'object' },
        targetN: { type: 'number' },
        nPerCondition: { type: 'number' },
        targetPopulation: { type: 'string' },
        inclusionCriteria: { type: 'array', items: { type: 'string' } },
        exclusionCriteria: { type: 'array', items: { type: 'string' } },
        samplingMethod: { type: 'string' },
        powerAnalysis: {
          type: 'object',
          properties: {
            alpha: { type: 'number' },
            power: { type: 'number' },
            effectSize: { type: 'string' },
            effectSizeSource: { type: 'string' }
          }
        },
        recruitmentProcedures: { type: 'string' },
        stoppingRule: { type: 'string' },
        attritionMitigation: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'preregistration', 'sampling-plan']
}));

export const variablesSpecificationTask = defineTask('variables-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Specify variables',
  skill: { name: 'statistical-test-selector' },
  agent: {
    name: 'research-methodologist',
    skills: ['statistical-test-selector', 'hypothesis-generator'],
    prompt: {
      role: 'Measurement and operationalization specialist',
      task: 'Document all variables with their operationalizations',
      context: args,
      instructions: [
        'List all independent/predictor variables',
        'List all dependent/outcome variables',
        'List all covariates and control variables',
        'Provide operational definitions for each variable',
        'Specify measurement instruments/scales for each',
        'Document reliability and validity of measures',
        'Specify data types (continuous, categorical, ordinal)',
        'Document how variables will be scored/computed',
        'Specify any variable transformations planned',
        'Link variables to specific hypotheses'
      ],
      outputFormat: 'JSON with summary, independentVariables, dependentVariables, covariates, operationalDefinitions, measures, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'independentVariables', 'dependentVariables', 'artifacts'],
      properties: {
        summary: { type: 'object' },
        independentVariables: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              operationalDefinition: { type: 'string' },
              levels: { type: 'array', items: { type: 'string' } },
              measurement: { type: 'string' }
            }
          }
        },
        dependentVariables: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              operationalDefinition: { type: 'string' },
              dataType: { type: 'string' },
              measurement: { type: 'string' },
              reliability: { type: 'string' }
            }
          }
        },
        covariates: { type: 'array' },
        operationalDefinitions: { type: 'object' },
        measures: { type: 'array' },
        transformations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'preregistration', 'variables']
}));

export const analysisPlanTask = defineTask('analysis-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop detailed analysis plan',
  skill: { name: 'statistical-test-selector' },
  agent: {
    name: 'research-methodologist',
    skills: ['statistical-test-selector', 'hypothesis-generator'],
    prompt: {
      role: 'Statistical analysis planner',
      task: 'Document the complete statistical analysis plan',
      context: args,
      instructions: [
        'Specify statistical models for each hypothesis',
        'Specify exact statistical tests to be used',
        'Document model specifications (predictors, interactions)',
        'Specify how assumptions will be checked',
        'Document planned corrections (multiple comparisons, etc.)',
        'Specify any planned contrasts or follow-up tests',
        'Document effect size measures to be reported',
        'Specify software and packages to be used',
        'Distinguish confirmatory from exploratory analyses',
        'Provide analysis script/code template if possible'
      ],
      outputFormat: 'JSON with summary, statisticalTests, modelSpecifications, assumptionChecks, corrections, effectSizeMeasures, software, analysisCode, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'statisticalTests', 'artifacts'],
      properties: {
        summary: { type: 'object' },
        statisticalTests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              hypothesis: { type: 'string' },
              test: { type: 'string' },
              variables: { type: 'object' },
              assumptions: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        modelSpecifications: { type: 'array' },
        assumptionChecks: { type: 'array', items: { type: 'string' } },
        corrections: { type: 'string' },
        effectSizeMeasures: { type: 'array', items: { type: 'string' } },
        software: { type: 'string' },
        packages: { type: 'array', items: { type: 'string' } },
        analysisCode: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'preregistration', 'analysis-plan']
}));

export const inferenceCriteriaTask = defineTask('inference-criteria', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Specify inference criteria',
  skill: { name: 'statistical-test-selector' },
  agent: {
    name: 'research-methodologist',
    skills: ['statistical-test-selector', 'hypothesis-generator'],
    prompt: {
      role: 'Statistical inference specialist',
      task: 'Document the criteria for making inferences from the data',
      context: args,
      instructions: [
        'Specify significance threshold (alpha level)',
        'Justify choice of alpha level',
        'Specify whether one-tailed or two-tailed tests',
        'Define what constitutes support for hypothesis',
        'Define what constitutes disconfirmation',
        'Specify criteria for inconclusive results',
        'Document how effect sizes will be interpreted',
        'Specify Bayesian inference criteria if used',
        'Document how null results will be interpreted',
        'Specify any equivalence testing criteria'
      ],
      outputFormat: 'JSON with summary, alphaLevel, alphaJustification, testTails, supportCriteria, disconfirmationCriteria, effectSizeInterpretation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'alphaLevel', 'supportCriteria', 'artifacts'],
      properties: {
        summary: { type: 'object' },
        alphaLevel: { type: 'number' },
        alphaJustification: { type: 'string' },
        testTails: { type: 'string' },
        supportCriteria: { type: 'string' },
        disconfirmationCriteria: { type: 'string' },
        inconclusiveCriteria: { type: 'string' },
        effectSizeInterpretation: { type: 'object' },
        bayesianCriteria: { type: 'object' },
        equivalenceBounds: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'preregistration', 'inference-criteria']
}));

export const exclusionCriteriaTask = defineTask('exclusion-criteria', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define data exclusion criteria',
  skill: { name: 'statistical-test-selector' },
  agent: {
    name: 'research-methodologist',
    skills: ['statistical-test-selector', 'hypothesis-generator'],
    prompt: {
      role: 'Data quality specialist',
      task: 'Document all criteria for excluding data from analysis',
      context: args,
      instructions: [
        'Specify participant exclusion criteria',
        'Specify trial/observation exclusion criteria',
        'Define outlier detection and handling procedures',
        'Specify missing data handling procedures',
        'Document attention check criteria if applicable',
        'Specify data quality checks',
        'Document any manipulation checks',
        'Specify criteria applied before vs after analysis',
        'Document how exclusions will be reported',
        'Specify sensitivity analyses for exclusions'
      ],
      outputFormat: 'JSON with summary, participantExclusions, trialExclusions, outlierHandling, missingDataHandling, attentionChecks, dataQualityChecks, sensitivityAnalyses, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'participantExclusions', 'artifacts'],
      properties: {
        summary: { type: 'object' },
        participantExclusions: { type: 'array', items: { type: 'string' } },
        trialExclusions: { type: 'array', items: { type: 'string' } },
        outlierHandling: {
          type: 'object',
          properties: {
            definition: { type: 'string' },
            procedure: { type: 'string' }
          }
        },
        missingDataHandling: { type: 'string' },
        attentionChecks: { type: 'string' },
        dataQualityChecks: { type: 'array', items: { type: 'string' } },
        manipulationChecks: { type: 'string' },
        sensitivityAnalyses: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'preregistration', 'exclusion-criteria']
}));

export const preregistrationAssemblyTask = defineTask('preregistration-assembly', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assemble preregistration document',
  skill: { name: 'statistical-test-selector' },
  agent: {
    name: 'research-methodologist',
    skills: ['statistical-test-selector', 'hypothesis-generator'],
    prompt: {
      role: 'Preregistration document specialist',
      task: 'Assemble all components into a complete preregistration document',
      context: args,
      instructions: [
        'Compile all sections into registry-specific format',
        'Ensure all required fields are completed',
        'Format document according to registry requirements',
        'Create table of contents if needed',
        'Add timestamps and version information',
        'Generate summary/abstract',
        'Compile supplementary materials',
        'Create submission checklist',
        'Generate both full and abbreviated versions',
        'Prepare for embargo settings if needed'
      ],
      outputFormat: 'JSON with documentPath, requiredSections, optionalSections, completedSections, submissionChecklist, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentPath', 'requiredSections', 'artifacts'],
      properties: {
        documentPath: { type: 'string' },
        requiredSections: { type: 'array', items: { type: 'string' } },
        optionalSections: { type: 'array', items: { type: 'string' } },
        completedSections: { type: 'array', items: { type: 'string' } },
        missingSections: { type: 'array', items: { type: 'string' } },
        submissionChecklist: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'preregistration', 'document-assembly']
}));

export const completenessScoringTask = defineTask('completeness-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score preregistration completeness',
  skill: { name: 'statistical-test-selector' },
  agent: {
    name: 'research-methodologist',
    skills: ['statistical-test-selector', 'hypothesis-generator'],
    prompt: {
      role: 'Preregistration quality auditor',
      task: 'Score the completeness and quality of the preregistration',
      context: args,
      instructions: [
        'Score hypothesis specificity (0-100)',
        'Score design documentation (0-100)',
        'Score sampling plan completeness (0-100)',
        'Score analysis plan detail (0-100)',
        'Score inference criteria clarity (0-100)',
        'Score exclusion criteria specificity (0-100)',
        'Calculate overall completeness score',
        'Identify missing or underspecified elements',
        'Compare against best practices templates',
        'Provide specific recommendations for improvement'
      ],
      outputFormat: 'JSON with overallScore, componentScores, missingElements, recommendations, comparisonToTemplate, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            hypotheses: { type: 'number' },
            design: { type: 'number' },
            sampling: { type: 'number' },
            variables: { type: 'number' },
            analysis: { type: 'number' },
            inference: { type: 'number' },
            exclusions: { type: 'number' }
          }
        },
        missingElements: { type: 'array', items: { type: 'string' } },
        underspecifiedElements: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        comparisonToTemplate: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'preregistration', 'completeness-scoring']
}));
