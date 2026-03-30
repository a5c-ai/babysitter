/**
 * @process social-sciences/quasi-experimental-design
 * @description Implement quasi-experimental approaches including difference-in-differences, regression discontinuity, and instrumental variables for causal inference in observational settings
 * @inputs { researchQuestion: string, availableData: object, policyOrIntervention: object, constraints: object, outputDir: string }
 * @outputs { success: boolean, designSpecification: object, identificationStrategy: object, validityAssessment: object, artifacts: array }
 * @recommendedSkills SK-SS-001 (quantitative-methods), SK-SS-004 (causal-inference-methods)
 * @recommendedAgents AG-SS-001 (quantitative-research-methodologist), AG-SS-005 (causal-inference-analyst)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    researchQuestion,
    availableData = {},
    policyOrIntervention = {},
    constraints = {},
    outputDir = 'quasi-experimental-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Quasi-Experimental Design process');

  // ============================================================================
  // PHASE 1: CAUSAL QUESTION ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing causal question and identification challenges');
  const causalAnalysis = await ctx.task(causalQuestionAnalysisTask, {
    researchQuestion,
    policyOrIntervention,
    availableData,
    outputDir
  });

  artifacts.push(...causalAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: DESIGN SELECTION
  // ============================================================================

  ctx.log('info', 'Phase 2: Selecting appropriate quasi-experimental design');
  const designSelection = await ctx.task(quasiDesignSelectionTask, {
    causalAnalysis,
    availableData,
    policyOrIntervention,
    constraints,
    outputDir
  });

  artifacts.push(...designSelection.artifacts);

  // ============================================================================
  // PHASE 3: IDENTIFICATION STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 3: Developing identification strategy');
  const identificationStrategy = await ctx.task(identificationStrategyTask, {
    designSelection,
    causalAnalysis,
    availableData,
    outputDir
  });

  artifacts.push(...identificationStrategy.artifacts);

  // ============================================================================
  // PHASE 4: VALIDITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Assessing design validity and assumptions');
  const validityAssessment = await ctx.task(quasiValidityAssessmentTask, {
    designSelection,
    identificationStrategy,
    availableData,
    outputDir
  });

  artifacts.push(...validityAssessment.artifacts);

  // ============================================================================
  // PHASE 5: ANALYSIS PLAN
  // ============================================================================

  ctx.log('info', 'Phase 5: Developing analysis plan');
  const analysisPlan = await ctx.task(quasiAnalysisPlanTask, {
    designSelection,
    identificationStrategy,
    validityAssessment,
    outputDir
  });

  artifacts.push(...analysisPlan.artifacts);

  // ============================================================================
  // PHASE 6: ROBUSTNESS CHECKS
  // ============================================================================

  ctx.log('info', 'Phase 6: Planning robustness and sensitivity checks');
  const robustnessChecks = await ctx.task(robustnessChecksTask, {
    designSelection,
    identificationStrategy,
    analysisPlan,
    outputDir
  });

  artifacts.push(...robustnessChecks.artifacts);

  // ============================================================================
  // PHASE 7: QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Phase 7: Scoring quasi-experimental design quality');
  const qualityScore = await ctx.task(quasiDesignQualityScoringTask, {
    causalAnalysis,
    designSelection,
    identificationStrategy,
    validityAssessment,
    analysisPlan,
    robustnessChecks,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const designScore = qualityScore.overallScore;
  const qualityMet = designScore >= 75;

  // Breakpoint: Review quasi-experimental design
  await ctx.breakpoint({
    question: `Quasi-experimental design complete. Quality score: ${designScore}/100. ${qualityMet ? 'Design meets quality standards!' : 'Design may need refinement.'} Review and approve?`,
    title: 'Quasi-Experimental Design Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown'
      })),
      summary: {
        designScore,
        qualityMet,
        selectedDesign: designSelection.selectedDesign,
        identificationAssumptions: identificationStrategy.keyAssumptions,
        validityThreats: validityAssessment.threatsIdentified
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    qualityScore: designScore,
    qualityMet,
    designSpecification: {
      design: designSelection.selectedDesign,
      rationale: designSelection.rationale,
      treatmentDefinition: designSelection.treatmentDefinition,
      comparisonGroup: designSelection.comparisonGroup
    },
    identificationStrategy: {
      approach: identificationStrategy.approach,
      keyAssumptions: identificationStrategy.keyAssumptions,
      estimand: identificationStrategy.estimand
    },
    validityAssessment: {
      threatsIdentified: validityAssessment.threatsIdentified,
      mitigationStrategies: validityAssessment.mitigationStrategies,
      validityScore: validityAssessment.validityScore
    },
    analysisPlan: analysisPlan.planPath,
    robustnessChecks: robustnessChecks.checks,
    artifacts,
    duration,
    metadata: {
      processId: 'social-sciences/quasi-experimental-design',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: Causal Question Analysis
export const causalQuestionAnalysisTask = defineTask('causal-question-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze causal question and identification challenges',
  agent: {
    name: 'causal-inference-specialist',
    prompt: {
      role: 'econometrician specializing in causal inference',
      task: 'Analyze the causal question and identify key identification challenges',
      context: args,
      instructions: [
        'Clarify the causal question using potential outcomes framework',
        'Define treatment and control conditions precisely',
        'Identify the counterfactual of interest',
        'Identify sources of selection bias',
        'Identify potential confounding variables',
        'Assess whether treatment assignment is plausibly exogenous',
        'Identify potential instruments or natural experiments',
        'Document data requirements for causal identification',
        'Generate causal diagram (DAG) for the research question'
      ],
      outputFormat: 'JSON with causalQuestion, treatmentDefinition, selectionBias, confounders, potentialDesigns, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['causalQuestion', 'selectionBias', 'confounders', 'artifacts'],
      properties: {
        causalQuestion: { type: 'string' },
        treatmentDefinition: { type: 'object' },
        controlDefinition: { type: 'object' },
        selectionBias: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              source: { type: 'string' },
              direction: { type: 'string' },
              severity: { type: 'string' }
            }
          }
        },
        confounders: { type: 'array', items: { type: 'string' } },
        potentialDesigns: { type: 'array', items: { type: 'string' } },
        causalDiagram: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'quasi-experimental', 'causal-analysis']
}));

// Task 2: Design Selection
export const quasiDesignSelectionTask = defineTask('quasi-design-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select appropriate quasi-experimental design',
  agent: {
    name: 'quasi-experimental-designer',
    prompt: {
      role: 'applied econometrician',
      task: 'Select the most appropriate quasi-experimental design given data and context',
      context: args,
      instructions: [
        'Evaluate difference-in-differences (DiD) suitability',
        'Evaluate regression discontinuity design (RDD) suitability',
        'Evaluate instrumental variables (IV) approach',
        'Evaluate synthetic control method applicability',
        'Evaluate matching methods (PSM, CEM, etc.)',
        'Evaluate interrupted time series (ITS) design',
        'Consider panel data methods if longitudinal data available',
        'Document data requirements for selected design',
        'Justify design selection based on identification assumptions',
        'Generate design specification document'
      ],
      outputFormat: 'JSON with selectedDesign, rationale, treatmentDefinition, comparisonGroup, dataRequirements, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedDesign', 'rationale', 'artifacts'],
      properties: {
        selectedDesign: { type: 'string' },
        rationale: { type: 'string' },
        treatmentDefinition: { type: 'object' },
        comparisonGroup: { type: 'object' },
        dataRequirements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              variable: { type: 'string' },
              role: { type: 'string' },
              availability: { type: 'string' }
            }
          }
        },
        alternativeDesigns: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'quasi-experimental', 'design-selection']
}));

// Task 3: Identification Strategy
export const identificationStrategyTask = defineTask('identification-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop identification strategy',
  agent: {
    name: 'identification-specialist',
    prompt: {
      role: 'econometrician specializing in identification',
      task: 'Develop detailed identification strategy for causal effect estimation',
      context: args,
      instructions: [
        'State key identifying assumptions explicitly',
        'For DiD: state parallel trends assumption',
        'For RDD: define running variable and cutoff',
        'For IV: state relevance and exclusion restriction',
        'Define the target estimand (ATE, ATT, LATE)',
        'Specify how variation in treatment is exploited',
        'Document testable implications of assumptions',
        'Plan for assumption testing/validation',
        'Identify potential violations and their consequences',
        'Generate identification strategy document'
      ],
      outputFormat: 'JSON with approach, keyAssumptions, estimand, assumptionTests, potentialViolations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['approach', 'keyAssumptions', 'estimand', 'artifacts'],
      properties: {
        approach: { type: 'string' },
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
        estimand: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            population: { type: 'string' },
            interpretation: { type: 'string' }
          }
        },
        assumptionTests: { type: 'array' },
        potentialViolations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'quasi-experimental', 'identification']
}));

// Task 4: Validity Assessment
export const quasiValidityAssessmentTask = defineTask('quasi-validity-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess design validity and assumptions',
  agent: {
    name: 'validity-specialist',
    prompt: {
      role: 'methodologist specializing in quasi-experimental validity',
      task: 'Assess internal and external validity of the quasi-experimental design',
      context: args,
      instructions: [
        'Assess threats to internal validity',
        'Evaluate selection bias concerns',
        'Assess threats from confounding',
        'Evaluate measurement validity',
        'Assess external validity and generalizability',
        'For DiD: assess parallel trends plausibility',
        'For RDD: assess manipulation at cutoff',
        'For IV: assess instrument validity',
        'Develop mitigation strategies for identified threats',
        'Generate validity assessment report'
      ],
      outputFormat: 'JSON with threatsIdentified, validityScore, mitigationStrategies, generalizability, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['threatsIdentified', 'validityScore', 'artifacts'],
      properties: {
        threatsIdentified: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              threat: { type: 'string' },
              type: { type: 'string' },
              severity: { type: 'string' },
              testable: { type: 'boolean' }
            }
          }
        },
        validityScore: { type: 'number' },
        mitigationStrategies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              threat: { type: 'string' },
              strategy: { type: 'string' }
            }
          }
        },
        generalizability: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'quasi-experimental', 'validity']
}));

// Task 5: Analysis Plan
export const quasiAnalysisPlanTask = defineTask('quasi-analysis-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop analysis plan',
  agent: {
    name: 'analysis-planner',
    prompt: {
      role: 'applied econometrician',
      task: 'Develop detailed analysis plan for quasi-experimental study',
      context: args,
      instructions: [
        'Specify main estimation model',
        'For DiD: specify two-way fixed effects or event study',
        'For RDD: specify bandwidth selection and functional form',
        'For IV: specify first stage and reduced form',
        'Plan covariate adjustment strategy',
        'Specify standard error calculation (clustering, etc.)',
        'Plan for heterogeneity analysis',
        'Specify pre-analysis decisions to avoid p-hacking',
        'Document software and packages to be used',
        'Generate pre-analysis plan document'
      ],
      outputFormat: 'JSON with estimationModel, specifications, standardErrors, heterogeneityAnalysis, planPath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['estimationModel', 'specifications', 'artifacts'],
      properties: {
        estimationModel: { type: 'string' },
        specifications: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              spec: { type: 'string' },
              purpose: { type: 'string' },
              primary: { type: 'boolean' }
            }
          }
        },
        standardErrors: { type: 'object' },
        heterogeneityAnalysis: { type: 'array' },
        softwareTools: { type: 'array', items: { type: 'string' } },
        planPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'quasi-experimental', 'analysis-plan']
}));

// Task 6: Robustness Checks
export const robustnessChecksTask = defineTask('robustness-checks', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan robustness and sensitivity checks',
  agent: {
    name: 'robustness-specialist',
    prompt: {
      role: 'econometrician specializing in sensitivity analysis',
      task: 'Plan comprehensive robustness and sensitivity analyses',
      context: args,
      instructions: [
        'Design placebo tests (fake treatments, fake outcomes)',
        'Plan parallel trends tests for DiD',
        'Design manipulation tests for RDD',
        'Plan weak instrument tests for IV',
        'Design falsification tests',
        'Plan sensitivity to functional form',
        'Design bounding exercises for violations',
        'Plan leave-one-out analyses',
        'Design alternative specification tests',
        'Generate robustness check protocol'
      ],
      outputFormat: 'JSON with checks, placeboTests, sensitivityAnalyses, boundingExercises, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['checks', 'artifacts'],
      properties: {
        checks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              check: { type: 'string' },
              type: { type: 'string' },
              purpose: { type: 'string' },
              expectedResult: { type: 'string' }
            }
          }
        },
        placeboTests: { type: 'array' },
        sensitivityAnalyses: { type: 'array' },
        boundingExercises: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'quasi-experimental', 'robustness']
}));

// Task 7: Quality Scoring
export const quasiDesignQualityScoringTask = defineTask('quasi-design-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score quasi-experimental design quality',
  agent: {
    name: 'design-quality-reviewer',
    prompt: {
      role: 'senior methodological reviewer',
      task: 'Assess overall quasi-experimental design quality',
      context: args,
      instructions: [
        'Evaluate causal question clarity (weight: 10%)',
        'Assess design appropriateness (weight: 20%)',
        'Evaluate identification strategy credibility (weight: 25%)',
        'Assess validity protections (weight: 20%)',
        'Evaluate analysis plan rigor (weight: 15%)',
        'Assess robustness check comprehensiveness (weight: 10%)',
        'Calculate weighted overall score (0-100)',
        'Identify critical gaps and weaknesses',
        'Provide specific recommendations for improvement'
      ],
      outputFormat: 'JSON with overallScore, componentScores, gaps, recommendations, strengths, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            causalClarity: { type: 'number' },
            designAppropriateness: { type: 'number' },
            identificationCredibility: { type: 'number' },
            validityProtections: { type: 'number' },
            analysisPlanRigor: { type: 'number' },
            robustnessChecks: { type: 'number' }
          }
        },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        strengths: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'quasi-experimental', 'quality-scoring']
}));
