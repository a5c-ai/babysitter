/**
 * @process social-sciences/natural-experiment-analysis
 * @description Identify and analyze natural experiments using instrumental variables, regression discontinuity, or difference-in-differences designs for causal identification
 * @inputs { researchQuestion: string, dataPath: string, naturalExperimentContext: object, outputDir: string }
 * @outputs { success: boolean, causalEstimate: object, identificationStrategy: object, robustnessResults: object, qualityScore: number, artifacts: array }
 * @recommendedSkills SK-SS-004 (causal-inference-methods), SK-SS-001 (quantitative-methods)
 * @recommendedAgents AG-SS-005 (causal-inference-analyst), AG-SS-001 (quantitative-research-methodologist)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    researchQuestion,
    dataPath,
    naturalExperimentContext = {},
    outputDir = 'natural-experiment-output',
    designType = 'auto'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Natural Experiment Analysis process');

  // ============================================================================
  // PHASE 1: NATURAL EXPERIMENT IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Identifying natural experiment');
  const experimentIdentification = await ctx.task(naturalExperimentIdentificationTask, {
    researchQuestion,
    naturalExperimentContext,
    dataPath,
    outputDir
  });

  artifacts.push(...experimentIdentification.artifacts);

  // ============================================================================
  // PHASE 2: DESIGN SELECTION
  // ============================================================================

  ctx.log('info', 'Phase 2: Selecting appropriate design');
  const designSelection = await ctx.task(naturalExperimentDesignTask, {
    experimentIdentification,
    designType,
    dataPath,
    outputDir
  });

  artifacts.push(...designSelection.artifacts);

  // ============================================================================
  // PHASE 3: IDENTIFICATION STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 3: Developing identification strategy');
  const identificationStrategy = await ctx.task(neIdentificationStrategyTask, {
    designSelection,
    experimentIdentification,
    outputDir
  });

  artifacts.push(...identificationStrategy.artifacts);

  // ============================================================================
  // PHASE 4: MAIN ESTIMATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Conducting main estimation');
  const mainEstimation = await ctx.task(neMainEstimationTask, {
    dataPath,
    designSelection,
    identificationStrategy,
    outputDir
  });

  artifacts.push(...mainEstimation.artifacts);

  // ============================================================================
  // PHASE 5: ASSUMPTION TESTING
  // ============================================================================

  ctx.log('info', 'Phase 5: Testing identifying assumptions');
  const assumptionTesting = await ctx.task(neAssumptionTestingTask, {
    designSelection,
    mainEstimation,
    dataPath,
    outputDir
  });

  artifacts.push(...assumptionTesting.artifacts);

  // ============================================================================
  // PHASE 6: ROBUSTNESS CHECKS
  // ============================================================================

  ctx.log('info', 'Phase 6: Conducting robustness checks');
  const robustnessChecks = await ctx.task(neRobustnessChecksTask, {
    mainEstimation,
    designSelection,
    dataPath,
    outputDir
  });

  artifacts.push(...robustnessChecks.artifacts);

  // ============================================================================
  // PHASE 7: QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Phase 7: Scoring analysis quality');
  const qualityScore = await ctx.task(neQualityScoringTask, {
    experimentIdentification,
    designSelection,
    identificationStrategy,
    mainEstimation,
    assumptionTesting,
    robustnessChecks,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const neScore = qualityScore.overallScore;
  const qualityMet = neScore >= 75;

  // Breakpoint: Review natural experiment analysis
  await ctx.breakpoint({
    question: `Natural experiment analysis complete. Quality score: ${neScore}/100. ${qualityMet ? 'Analysis meets quality standards!' : 'Analysis may need refinement.'} Review and approve?`,
    title: 'Natural Experiment Analysis Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown'
      })),
      summary: {
        neScore,
        qualityMet,
        design: designSelection.selectedDesign,
        causalEstimate: mainEstimation.estimate,
        robustnessConfirmed: robustnessChecks.confirmed
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    qualityScore: neScore,
    qualityMet,
    causalEstimate: {
      estimate: mainEstimation.estimate,
      standardError: mainEstimation.standardError,
      confidenceInterval: mainEstimation.confidenceInterval,
      estimand: mainEstimation.estimand
    },
    identificationStrategy: {
      design: designSelection.selectedDesign,
      keyAssumptions: identificationStrategy.keyAssumptions,
      sourceOfVariation: experimentIdentification.sourceOfVariation
    },
    robustnessResults: {
      confirmed: robustnessChecks.confirmed,
      placeboTests: robustnessChecks.placeboTests,
      alternativeSpecs: robustnessChecks.alternativeSpecs
    },
    artifacts,
    duration,
    metadata: {
      processId: 'social-sciences/natural-experiment-analysis',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: Natural Experiment Identification
export const naturalExperimentIdentificationTask = defineTask('ne-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify natural experiment',
  agent: {
    name: 'natural-experiment-specialist',
    prompt: {
      role: 'applied econometrician specializing in natural experiments',
      task: 'Identify and characterize the natural experiment',
      context: args,
      instructions: [
        'Identify source of exogenous variation',
        'Document policy change, institutional feature, or natural event',
        'Assess plausibility of as-if random assignment',
        'Identify treatment and comparison groups',
        'Document timing and scope of variation',
        'Assess threats to identification',
        'Review literature for similar natural experiments',
        'Generate natural experiment documentation'
      ],
      outputFormat: 'JSON with sourceOfVariation, treatment, comparison, timing, plausibility, threats, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['sourceOfVariation', 'treatment', 'comparison', 'artifacts'],
      properties: {
        sourceOfVariation: { type: 'string' },
        treatment: { type: 'object' },
        comparison: { type: 'object' },
        timing: { type: 'object' },
        plausibility: { type: 'string' },
        threats: { type: 'array', items: { type: 'string' } },
        precedents: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'natural-experiment', 'identification']
}));

// Task 2: Design Selection
export const naturalExperimentDesignTask = defineTask('ne-design-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select appropriate design',
  agent: {
    name: 'ne-design-specialist',
    prompt: {
      role: 'causal inference design expert',
      task: 'Select most appropriate design for natural experiment',
      context: args,
      instructions: [
        'Evaluate difference-in-differences suitability',
        'Evaluate regression discontinuity suitability',
        'Evaluate instrumental variables suitability',
        'Evaluate event study design suitability',
        'Consider synthetic control method',
        'Match design to source of variation',
        'Document design requirements',
        'Generate design selection report'
      ],
      outputFormat: 'JSON with selectedDesign, rationale, requirements, alternativeDesigns, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedDesign', 'rationale', 'artifacts'],
      properties: {
        selectedDesign: { type: 'string' },
        rationale: { type: 'string' },
        requirements: { type: 'array', items: { type: 'string' } },
        alternativeDesigns: { type: 'array', items: { type: 'string' } },
        designSpecification: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'natural-experiment', 'design']
}));

// Task 3: Identification Strategy
export const neIdentificationStrategyTask = defineTask('ne-identification-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop identification strategy',
  agent: {
    name: 'identification-strategist',
    prompt: {
      role: 'econometric identification specialist',
      task: 'Develop detailed identification strategy',
      context: args,
      instructions: [
        'State key identifying assumptions explicitly',
        'For DiD: parallel trends assumption',
        'For RDD: continuity at cutoff',
        'For IV: relevance and exclusion restriction',
        'Define target estimand (LATE, ATE, ATT)',
        'Document testable implications',
        'Plan assumption validation tests',
        'Generate identification strategy document'
      ],
      outputFormat: 'JSON with keyAssumptions, estimand, testableImplications, validationPlan, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['keyAssumptions', 'estimand', 'artifacts'],
      properties: {
        keyAssumptions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              assumption: { type: 'string' },
              testable: { type: 'boolean' },
              plausibility: { type: 'string' }
            }
          }
        },
        estimand: { type: 'object' },
        testableImplications: { type: 'array', items: { type: 'string' } },
        validationPlan: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'natural-experiment', 'identification-strategy']
}));

// Task 4: Main Estimation
export const neMainEstimationTask = defineTask('ne-main-estimation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct main estimation',
  agent: {
    name: 'causal-estimation-analyst',
    prompt: {
      role: 'applied econometrician',
      task: 'Conduct main causal effect estimation',
      context: args,
      instructions: [
        'Implement appropriate estimator for design',
        'DiD: two-way fixed effects or event study',
        'RDD: local polynomial with optimal bandwidth',
        'IV: 2SLS with first-stage diagnostics',
        'Apply appropriate standard errors (cluster, robust)',
        'Report point estimate and confidence interval',
        'Document estimation choices',
        'Generate main estimation report'
      ],
      outputFormat: 'JSON with estimate, standardError, confidenceInterval, estimand, estimationDetails, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['estimate', 'standardError', 'confidenceInterval', 'artifacts'],
      properties: {
        estimate: { type: 'number' },
        standardError: { type: 'number' },
        confidenceInterval: { type: 'object' },
        pValue: { type: 'number' },
        estimand: { type: 'string' },
        estimationDetails: { type: 'object' },
        firstStage: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'natural-experiment', 'estimation']
}));

// Task 5: Assumption Testing
export const neAssumptionTestingTask = defineTask('ne-assumption-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Test identifying assumptions',
  agent: {
    name: 'assumption-testing-analyst',
    prompt: {
      role: 'econometric assumption testing specialist',
      task: 'Test identifying assumptions for natural experiment',
      context: args,
      instructions: [
        'DiD: test parallel pre-trends with event study',
        'RDD: test continuity with McCrary density test',
        'RDD: test covariate balance at cutoff',
        'IV: test first-stage F-statistic (F > 10)',
        'IV: conduct overidentification tests if possible',
        'Test for manipulation/selection around cutoff or threshold',
        'Document assumption test results',
        'Generate assumption testing report'
      ],
      outputFormat: 'JSON with tests, results, assumptionsMet, violations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['tests', 'assumptionsMet', 'artifacts'],
      properties: {
        tests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              assumption: { type: 'string' },
              test: { type: 'string' },
              result: { type: 'string' },
              passed: { type: 'boolean' }
            }
          }
        },
        assumptionsMet: { type: 'boolean' },
        violations: { type: 'array', items: { type: 'string' } },
        concerns: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'natural-experiment', 'assumption-testing']
}));

// Task 6: Robustness Checks
export const neRobustnessChecksTask = defineTask('ne-robustness-checks', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct robustness checks',
  agent: {
    name: 'robustness-analyst',
    prompt: {
      role: 'econometric robustness specialist',
      task: 'Conduct comprehensive robustness checks',
      context: args,
      instructions: [
        'Conduct placebo tests (fake treatment timing/location)',
        'Test alternative specifications',
        'Test sensitivity to bandwidth (RDD)',
        'Test sensitivity to functional form',
        'Conduct leave-one-out analysis',
        'Test alternative control variables',
        'Conduct subsample analyses',
        'Generate robustness check report'
      ],
      outputFormat: 'JSON with confirmed, placeboTests, alternativeSpecs, sensitivityTests, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['confirmed', 'placeboTests', 'artifacts'],
      properties: {
        confirmed: { type: 'boolean' },
        placeboTests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              test: { type: 'string' },
              result: { type: 'string' },
              passed: { type: 'boolean' }
            }
          }
        },
        alternativeSpecs: { type: 'array' },
        sensitivityTests: { type: 'array' },
        overallRobustness: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'natural-experiment', 'robustness']
}));

// Task 7: Quality Scoring
export const neQualityScoringTask = defineTask('ne-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score analysis quality',
  agent: {
    name: 'ne-quality-reviewer',
    prompt: {
      role: 'senior applied econometrician',
      task: 'Assess natural experiment analysis quality',
      context: args,
      instructions: [
        'Evaluate natural experiment identification (weight: 20%)',
        'Assess design selection appropriateness (weight: 15%)',
        'Evaluate identification strategy credibility (weight: 20%)',
        'Assess main estimation rigor (weight: 15%)',
        'Evaluate assumption testing thoroughness (weight: 15%)',
        'Assess robustness check comprehensiveness (weight: 15%)',
        'Calculate weighted overall score (0-100)',
        'Identify gaps and recommendations'
      ],
      outputFormat: 'JSON with overallScore, componentScores, gaps, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            experimentIdentification: { type: 'number' },
            designSelection: { type: 'number' },
            identificationStrategy: { type: 'number' },
            mainEstimation: { type: 'number' },
            assumptionTesting: { type: 'number' },
            robustnessChecks: { type: 'number' }
          }
        },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'natural-experiment', 'quality-scoring']
}));
