/**
 * @process social-sciences/structural-equation-modeling
 * @description Build and test structural equation models including measurement models, path analysis, confirmatory factor analysis, and model fit evaluation
 * @inputs { dataPath: string, theoreticalModel: object, constructs: array, outputDir: string }
 * @outputs { success: boolean, measurementModel: object, structuralModel: object, modelFit: object, qualityScore: number, artifacts: array }
 * @recommendedSkills SK-SS-001 (quantitative-methods), SK-SS-009 (psychometric-assessment)
 * @recommendedAgents AG-SS-001 (quantitative-research-methodologist), AG-SS-007 (measurement-psychometrics-expert)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    dataPath,
    theoreticalModel = {},
    constructs = [],
    outputDir = 'sem-output',
    software = 'lavaan',
    estimationMethod = 'ML'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Structural Equation Modeling process');

  // ============================================================================
  // PHASE 1: DATA PREPARATION AND SCREENING
  // ============================================================================

  ctx.log('info', 'Phase 1: Preparing and screening data for SEM');
  const dataScreening = await ctx.task(semDataScreeningTask, {
    dataPath,
    constructs,
    outputDir
  });

  artifacts.push(...dataScreening.artifacts);

  // ============================================================================
  // PHASE 2: MEASUREMENT MODEL (CFA)
  // ============================================================================

  ctx.log('info', 'Phase 2: Specifying and testing measurement model');
  const measurementModel = await ctx.task(measurementModelTask, {
    dataPath,
    constructs,
    estimationMethod,
    software,
    outputDir
  });

  artifacts.push(...measurementModel.artifacts);

  // ============================================================================
  // PHASE 3: MEASUREMENT MODEL REFINEMENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Refining measurement model');
  const modelRefinement = await ctx.task(measurementRefinementTask, {
    measurementModel,
    constructs,
    outputDir
  });

  artifacts.push(...modelRefinement.artifacts);

  // ============================================================================
  // PHASE 4: STRUCTURAL MODEL
  // ============================================================================

  ctx.log('info', 'Phase 4: Specifying and testing structural model');
  const structuralModel = await ctx.task(structuralModelTask, {
    theoreticalModel,
    modelRefinement,
    estimationMethod,
    software,
    outputDir
  });

  artifacts.push(...structuralModel.artifacts);

  // ============================================================================
  // PHASE 5: MODEL FIT EVALUATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Evaluating model fit');
  const modelFitEvaluation = await ctx.task(modelFitEvaluationTask, {
    measurementModel: modelRefinement,
    structuralModel,
    outputDir
  });

  artifacts.push(...modelFitEvaluation.artifacts);

  // ============================================================================
  // PHASE 6: ALTERNATIVE MODELS
  // ============================================================================

  ctx.log('info', 'Phase 6: Testing alternative models');
  const alternativeModels = await ctx.task(alternativeModelsTask, {
    structuralModel,
    theoreticalModel,
    outputDir
  });

  artifacts.push(...alternativeModels.artifacts);

  // ============================================================================
  // PHASE 7: QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Phase 7: Scoring SEM analysis quality');
  const qualityScore = await ctx.task(semQualityScoringTask, {
    dataScreening,
    measurementModel: modelRefinement,
    structuralModel,
    modelFitEvaluation,
    alternativeModels,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const semScore = qualityScore.overallScore;
  const qualityMet = semScore >= 80;

  // Breakpoint: Review SEM analysis
  await ctx.breakpoint({
    question: `SEM analysis complete. Quality score: ${semScore}/100. ${qualityMet ? 'Analysis meets quality standards!' : 'Analysis may need refinement.'} Review and approve?`,
    title: 'Structural Equation Modeling Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown'
      })),
      summary: {
        semScore,
        qualityMet,
        measurementModelFit: modelRefinement.fitIndices,
        structuralModelFit: structuralModel.fitIndices
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    qualityScore: semScore,
    qualityMet,
    measurementModel: {
      constructs: modelRefinement.constructs,
      factorLoadings: modelRefinement.factorLoadings,
      reliability: modelRefinement.reliability,
      validity: modelRefinement.validity
    },
    structuralModel: {
      pathCoefficients: structuralModel.pathCoefficients,
      rSquared: structuralModel.rSquared,
      significantPaths: structuralModel.significantPaths
    },
    modelFit: {
      measurementFit: modelRefinement.fitIndices,
      structuralFit: structuralModel.fitIndices,
      fitAcceptable: modelFitEvaluation.acceptable
    },
    artifacts,
    duration,
    metadata: {
      processId: 'social-sciences/structural-equation-modeling',
      timestamp: startTime,
      software,
      estimationMethod,
      outputDir
    }
  };
}

// Task 1: Data Screening
export const semDataScreeningTask = defineTask('sem-data-screening', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Screen data for SEM',
  agent: {
    name: 'sem-data-analyst',
    prompt: {
      role: 'SEM data analyst',
      task: 'Prepare and screen data for structural equation modeling',
      context: args,
      instructions: [
        'Check sample size adequacy for SEM',
        'Assess multivariate normality',
        'Check for multivariate outliers (Mahalanobis distance)',
        'Evaluate missing data patterns',
        'Handle missing data (FIML, multiple imputation)',
        'Check for multicollinearity',
        'Assess linearity assumptions',
        'Create correlation/covariance matrix',
        'Generate data screening report'
      ],
      outputFormat: 'JSON with sampleSize, normalityAssessment, outliers, missingData, correlationMatrix, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['sampleSize', 'normalityAssessment', 'artifacts'],
      properties: {
        sampleSize: { type: 'number' },
        sampleSizeAdequate: { type: 'boolean' },
        normalityAssessment: { type: 'object' },
        outliers: { type: 'object' },
        missingData: { type: 'object' },
        correlationMatrix: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sem', 'data-screening']
}));

// Task 2: Measurement Model (CFA)
export const measurementModelTask = defineTask('measurement-model', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Specify and test measurement model',
  agent: {
    name: 'cfa-analyst',
    prompt: {
      role: 'confirmatory factor analysis specialist',
      task: 'Specify and estimate confirmatory factor analysis model',
      context: args,
      instructions: [
        'Specify CFA model based on theoretical constructs',
        'Set marker variable or standardize latent variables',
        'Estimate model using specified estimation method',
        'Examine factor loadings and their significance',
        'Calculate composite reliability (omega, alpha)',
        'Assess convergent validity (AVE)',
        'Assess discriminant validity (HTMT, Fornell-Larcker)',
        'Generate modification indices',
        'Create measurement model report'
      ],
      outputFormat: 'JSON with constructs, factorLoadings, fitIndices, reliability, validity, modificationIndices, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['constructs', 'factorLoadings', 'fitIndices', 'artifacts'],
      properties: {
        constructs: { type: 'array', items: { type: 'string' } },
        factorLoadings: { type: 'object' },
        fitIndices: {
          type: 'object',
          properties: {
            chiSquare: { type: 'number' },
            df: { type: 'number' },
            pValue: { type: 'number' },
            CFI: { type: 'number' },
            TLI: { type: 'number' },
            RMSEA: { type: 'number' },
            SRMR: { type: 'number' }
          }
        },
        reliability: { type: 'object' },
        validity: { type: 'object' },
        modificationIndices: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sem', 'cfa']
}));

// Task 3: Measurement Model Refinement
export const measurementRefinementTask = defineTask('measurement-refinement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Refine measurement model',
  agent: {
    name: 'cfa-refinement-specialist',
    prompt: {
      role: 'SEM methodologist',
      task: 'Refine measurement model to achieve acceptable fit',
      context: args,
      instructions: [
        'Review modification indices for theoretically justified changes',
        'Consider removing poorly loading items',
        'Consider adding error covariances if justified',
        'Re-estimate refined model',
        'Compare nested models using chi-square difference',
        'Verify reliability and validity in refined model',
        'Document all model modifications with rationale',
        'Achieve target fit indices (CFI>.95, RMSEA<.06, SRMR<.08)',
        'Generate refined measurement model report'
      ],
      outputFormat: 'JSON with constructs, factorLoadings, fitIndices, reliability, validity, modifications, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['constructs', 'factorLoadings', 'fitIndices', 'artifacts'],
      properties: {
        constructs: { type: 'array' },
        factorLoadings: { type: 'object' },
        fitIndices: { type: 'object' },
        reliability: { type: 'object' },
        validity: { type: 'object' },
        modifications: { type: 'array', items: { type: 'string' } },
        modelComparison: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sem', 'cfa-refinement']
}));

// Task 4: Structural Model
export const structuralModelTask = defineTask('structural-model', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Specify and test structural model',
  agent: {
    name: 'structural-model-analyst',
    prompt: {
      role: 'SEM specialist',
      task: 'Specify and estimate structural equation model',
      context: args,
      instructions: [
        'Add structural paths based on theoretical model',
        'Estimate full SEM (measurement + structural)',
        'Examine path coefficients and significance',
        'Calculate R-squared for endogenous variables',
        'Test indirect effects (mediation) if specified',
        'Calculate total, direct, and indirect effects',
        'Bootstrap confidence intervals for indirect effects',
        'Assess structural model fit',
        'Generate structural model report'
      ],
      outputFormat: 'JSON with pathCoefficients, rSquared, fitIndices, indirectEffects, significantPaths, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['pathCoefficients', 'fitIndices', 'artifacts'],
      properties: {
        pathCoefficients: { type: 'object' },
        rSquared: { type: 'object' },
        fitIndices: { type: 'object' },
        indirectEffects: { type: 'object' },
        totalEffects: { type: 'object' },
        significantPaths: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sem', 'structural-model']
}));

// Task 5: Model Fit Evaluation
export const modelFitEvaluationTask = defineTask('model-fit-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Evaluate model fit',
  agent: {
    name: 'fit-evaluation-specialist',
    prompt: {
      role: 'SEM fit evaluation expert',
      task: 'Comprehensively evaluate model fit',
      context: args,
      instructions: [
        'Evaluate absolute fit indices (chi-square, SRMR)',
        'Evaluate incremental fit indices (CFI, TLI)',
        'Evaluate parsimony fit indices (RMSEA, AIC, BIC)',
        'Apply conventional cutoff criteria',
        'Examine residual covariance matrix',
        'Identify localized areas of misfit',
        'Compare fit across models',
        'Determine overall fit acceptability',
        'Generate fit evaluation report'
      ],
      outputFormat: 'JSON with fitIndices, cutoffCriteria, residuals, acceptable, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['fitIndices', 'acceptable', 'artifacts'],
      properties: {
        fitIndices: { type: 'object' },
        cutoffCriteria: { type: 'object' },
        residuals: { type: 'object' },
        areasOfMisfit: { type: 'array', items: { type: 'string' } },
        acceptable: { type: 'boolean' },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sem', 'fit-evaluation']
}));

// Task 6: Alternative Models
export const alternativeModelsTask = defineTask('alternative-models', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Test alternative models',
  agent: {
    name: 'alternative-models-analyst',
    prompt: {
      role: 'SEM model comparison specialist',
      task: 'Test and compare alternative structural models',
      context: args,
      instructions: [
        'Specify theoretically plausible alternative models',
        'Test competing nested models',
        'Use chi-square difference tests for nested comparisons',
        'Use AIC/BIC for non-nested comparisons',
        'Test equivalent models if any',
        'Test rival theoretical models',
        'Compare path coefficients across models',
        'Determine best-fitting model',
        'Generate model comparison report'
      ],
      outputFormat: 'JSON with alternativeModels, comparisons, bestModel, rationale, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['alternativeModels', 'bestModel', 'artifacts'],
      properties: {
        alternativeModels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              model: { type: 'string' },
              fitIndices: { type: 'object' },
              description: { type: 'string' }
            }
          }
        },
        comparisons: { type: 'array' },
        bestModel: { type: 'string' },
        rationale: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sem', 'alternative-models']
}));

// Task 7: Quality Scoring
export const semQualityScoringTask = defineTask('sem-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score SEM analysis quality',
  agent: {
    name: 'sem-quality-reviewer',
    prompt: {
      role: 'senior SEM methodologist',
      task: 'Assess SEM analysis quality and rigor',
      context: args,
      instructions: [
        'Evaluate data screening adequacy (weight: 10%)',
        'Assess measurement model quality (weight: 25%)',
        'Evaluate structural model specification (weight: 25%)',
        'Assess model fit evaluation rigor (weight: 20%)',
        'Evaluate alternative model testing (weight: 10%)',
        'Assess reporting completeness (weight: 10%)',
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
            dataScreening: { type: 'number' },
            measurementModel: { type: 'number' },
            structuralModel: { type: 'number' },
            fitEvaluation: { type: 'number' },
            alternativeModels: { type: 'number' },
            reporting: { type: 'number' }
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
  labels: ['agent', 'sem', 'quality-scoring']
}));
