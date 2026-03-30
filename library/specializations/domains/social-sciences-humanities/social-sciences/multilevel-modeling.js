/**
 * @process social-sciences/multilevel-modeling
 * @description Analyze nested data structures using hierarchical linear models for individuals within groups, repeated measures, or cross-classified designs
 * @inputs { dataPath: string, nestedStructure: object, researchQuestions: array, outputDir: string }
 * @outputs { success: boolean, modelResults: object, varianceComponents: object, modelComparison: object, qualityScore: number, artifacts: array }
 * @recommendedSkills SK-SS-001 (quantitative-methods)
 * @recommendedAgents AG-SS-001 (quantitative-research-methodologist)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    dataPath,
    nestedStructure = {},
    researchQuestions = [],
    outputDir = 'multilevel-output',
    software = 'lme4',
    estimationMethod = 'REML'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Multilevel/Hierarchical Modeling process');

  // ============================================================================
  // PHASE 1: DATA STRUCTURE ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 1: Assessing nested data structure');
  const structureAssessment = await ctx.task(dataStructureAssessmentTask, {
    dataPath,
    nestedStructure,
    outputDir
  });

  artifacts.push(...structureAssessment.artifacts);

  // ============================================================================
  // PHASE 2: NULL MODEL (UNCONDITIONAL)
  // ============================================================================

  ctx.log('info', 'Phase 2: Fitting null model');
  const nullModel = await ctx.task(nullModelTask, {
    dataPath,
    nestedStructure,
    estimationMethod,
    software,
    outputDir
  });

  artifacts.push(...nullModel.artifacts);

  // ============================================================================
  // PHASE 3: RANDOM INTERCEPT MODEL
  // ============================================================================

  ctx.log('info', 'Phase 3: Building random intercept models');
  const randomInterceptModel = await ctx.task(randomInterceptModelTask, {
    dataPath,
    nestedStructure,
    nullModel,
    estimationMethod,
    software,
    outputDir
  });

  artifacts.push(...randomInterceptModel.artifacts);

  // ============================================================================
  // PHASE 4: RANDOM SLOPE MODEL
  // ============================================================================

  ctx.log('info', 'Phase 4: Building random slope models');
  const randomSlopeModel = await ctx.task(randomSlopeModelTask, {
    dataPath,
    nestedStructure,
    randomInterceptModel,
    estimationMethod,
    software,
    outputDir
  });

  artifacts.push(...randomSlopeModel.artifacts);

  // ============================================================================
  // PHASE 5: MODEL COMPARISON
  // ============================================================================

  ctx.log('info', 'Phase 5: Comparing models');
  const modelComparison = await ctx.task(multilevelModelComparisonTask, {
    nullModel,
    randomInterceptModel,
    randomSlopeModel,
    outputDir
  });

  artifacts.push(...modelComparison.artifacts);

  // ============================================================================
  // PHASE 6: DIAGNOSTICS
  // ============================================================================

  ctx.log('info', 'Phase 6: Running diagnostics');
  const diagnostics = await ctx.task(multilevelDiagnosticsTask, {
    finalModel: modelComparison.bestModel,
    outputDir
  });

  artifacts.push(...diagnostics.artifacts);

  // ============================================================================
  // PHASE 7: QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Phase 7: Scoring analysis quality');
  const qualityScore = await ctx.task(multilevelQualityScoringTask, {
    structureAssessment,
    nullModel,
    randomInterceptModel,
    randomSlopeModel,
    modelComparison,
    diagnostics,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const mlmScore = qualityScore.overallScore;
  const qualityMet = mlmScore >= 80;

  // Breakpoint: Review multilevel analysis
  await ctx.breakpoint({
    question: `Multilevel analysis complete. Quality score: ${mlmScore}/100. ${qualityMet ? 'Analysis meets quality standards!' : 'Analysis may need refinement.'} Review and approve?`,
    title: 'Multilevel Modeling Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown'
      })),
      summary: {
        mlmScore,
        qualityMet,
        icc: nullModel.icc,
        bestModel: modelComparison.bestModelName,
        varianceExplained: modelComparison.varianceExplained
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    qualityScore: mlmScore,
    qualityMet,
    modelResults: {
      nullModel: nullModel.results,
      randomIntercept: randomInterceptModel.results,
      randomSlope: randomSlopeModel.results,
      bestModel: modelComparison.bestModel
    },
    varianceComponents: {
      icc: nullModel.icc,
      level1Variance: modelComparison.bestModel.level1Variance,
      level2Variance: modelComparison.bestModel.level2Variance
    },
    modelComparison: {
      comparison: modelComparison.comparison,
      bestModelName: modelComparison.bestModelName,
      varianceExplained: modelComparison.varianceExplained
    },
    diagnostics: diagnostics.summary,
    artifacts,
    duration,
    metadata: {
      processId: 'social-sciences/multilevel-modeling',
      timestamp: startTime,
      software,
      estimationMethod,
      outputDir
    }
  };
}

// Task 1: Data Structure Assessment
export const dataStructureAssessmentTask = defineTask('data-structure-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess nested data structure',
  agent: {
    name: 'mlm-data-analyst',
    prompt: {
      role: 'multilevel modeling specialist',
      task: 'Assess data structure for multilevel analysis',
      context: args,
      instructions: [
        'Identify nesting structure (2-level, 3-level, cross-classified)',
        'Count units at each level',
        'Assess sample size adequacy at each level',
        'Check for balanced vs unbalanced design',
        'Identify clustering variables',
        'Assess within-cluster sample sizes',
        'Check for singleton clusters',
        'Examine level-1 and level-2 variables',
        'Generate data structure report'
      ],
      outputFormat: 'JSON with levels, unitsPerLevel, clusteringSummary, sampleAdequacy, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['levels', 'unitsPerLevel', 'artifacts'],
      properties: {
        levels: { type: 'number' },
        unitsPerLevel: { type: 'object' },
        clusteringVariables: { type: 'array', items: { type: 'string' } },
        clusteringSummary: { type: 'object' },
        sampleAdequacy: { type: 'object' },
        balanced: { type: 'boolean' },
        singletonClusters: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'multilevel', 'data-structure']
}));

// Task 2: Null Model
export const nullModelTask = defineTask('null-model', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Fit null model',
  agent: {
    name: 'null-model-analyst',
    prompt: {
      role: 'multilevel modeling analyst',
      task: 'Fit unconditional (null) model to partition variance',
      context: args,
      instructions: [
        'Specify null model with random intercept only',
        'Estimate variance components',
        'Calculate intraclass correlation coefficient (ICC)',
        'Interpret ICC in context',
        'Determine if multilevel modeling is warranted',
        'Calculate design effect',
        'Report -2 log likelihood for model comparison',
        'Generate null model report'
      ],
      outputFormat: 'JSON with results, icc, varianceComponents, designEffect, modelFit, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'icc', 'varianceComponents', 'artifacts'],
      properties: {
        results: { type: 'object' },
        icc: { type: 'number' },
        varianceComponents: {
          type: 'object',
          properties: {
            level1: { type: 'number' },
            level2: { type: 'number' }
          }
        },
        designEffect: { type: 'number' },
        mlmWarranted: { type: 'boolean' },
        modelFit: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'multilevel', 'null-model']
}));

// Task 3: Random Intercept Model
export const randomInterceptModelTask = defineTask('random-intercept-model', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Build random intercept models',
  agent: {
    name: 'random-intercept-analyst',
    prompt: {
      role: 'multilevel modeling specialist',
      task: 'Build and estimate random intercept models with predictors',
      context: args,
      instructions: [
        'Add level-1 predictors (group-mean centered if appropriate)',
        'Add level-2 predictors',
        'Consider grand-mean vs group-mean centering',
        'Estimate fixed effects and random intercept variance',
        'Test significance of fixed effects',
        'Calculate variance explained at each level',
        'Compare to null model using likelihood ratio test',
        'Generate random intercept model report'
      ],
      outputFormat: 'JSON with results, fixedEffects, varianceComponents, varianceExplained, modelComparison, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'fixedEffects', 'artifacts'],
      properties: {
        results: { type: 'object' },
        fixedEffects: { type: 'object' },
        varianceComponents: { type: 'object' },
        varianceExplained: { type: 'object' },
        centeringApproach: { type: 'string' },
        modelComparison: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'multilevel', 'random-intercept']
}));

// Task 4: Random Slope Model
export const randomSlopeModelTask = defineTask('random-slope-model', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Build random slope models',
  agent: {
    name: 'random-slope-analyst',
    prompt: {
      role: 'multilevel modeling specialist',
      task: 'Build and estimate random slope models',
      context: args,
      instructions: [
        'Add random slopes for level-1 predictors',
        'Estimate slope variance and intercept-slope covariance',
        'Test significance of random slopes',
        'Add cross-level interactions if appropriate',
        'Handle convergence issues if they arise',
        'Compare to random intercept model',
        'Interpret cross-level interactions',
        'Generate random slope model report'
      ],
      outputFormat: 'JSON with results, fixedEffects, randomEffects, crossLevelInteractions, modelComparison, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'fixedEffects', 'randomEffects', 'artifacts'],
      properties: {
        results: { type: 'object' },
        fixedEffects: { type: 'object' },
        randomEffects: {
          type: 'object',
          properties: {
            interceptVariance: { type: 'number' },
            slopeVariance: { type: 'number' },
            covariance: { type: 'number' }
          }
        },
        crossLevelInteractions: { type: 'object' },
        modelComparison: { type: 'object' },
        convergence: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'multilevel', 'random-slope']
}));

// Task 5: Model Comparison
export const multilevelModelComparisonTask = defineTask('multilevel-model-comparison', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compare models',
  agent: {
    name: 'model-comparison-analyst',
    prompt: {
      role: 'multilevel modeling methodologist',
      task: 'Compare multilevel models and select best model',
      context: args,
      instructions: [
        'Conduct likelihood ratio tests for nested models',
        'Compare AIC and BIC across models',
        'Assess improvement in variance explained',
        'Consider model parsimony',
        'Evaluate practical significance of random effects',
        'Select best-fitting model',
        'Justify model selection',
        'Generate model comparison report'
      ],
      outputFormat: 'JSON with comparison, lrtTests, fitIndices, bestModel, bestModelName, varianceExplained, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['comparison', 'bestModel', 'bestModelName', 'artifacts'],
      properties: {
        comparison: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              model: { type: 'string' },
              logLik: { type: 'number' },
              aic: { type: 'number' },
              bic: { type: 'number' }
            }
          }
        },
        lrtTests: { type: 'array' },
        bestModel: { type: 'object' },
        bestModelName: { type: 'string' },
        varianceExplained: { type: 'object' },
        selectionRationale: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'multilevel', 'model-comparison']
}));

// Task 6: Diagnostics
export const multilevelDiagnosticsTask = defineTask('multilevel-diagnostics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run diagnostics',
  agent: {
    name: 'diagnostics-analyst',
    prompt: {
      role: 'multilevel modeling diagnostician',
      task: 'Conduct diagnostic checks for multilevel model',
      context: args,
      instructions: [
        'Check normality of level-1 residuals',
        'Check normality of random effects',
        'Assess homoscedasticity of residuals',
        'Check for influential observations/clusters',
        'Examine residual vs fitted plots',
        'Check for multicollinearity',
        'Assess linearity assumptions',
        'Identify potential model misspecification',
        'Generate diagnostic report'
      ],
      outputFormat: 'JSON with summary, residualChecks, randomEffectChecks, influentialCases, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'artifacts'],
      properties: {
        summary: { type: 'object' },
        residualChecks: { type: 'object' },
        randomEffectChecks: { type: 'object' },
        influentialCases: { type: 'array' },
        assumptionsMet: { type: 'boolean' },
        recommendations: { type: 'array', items: { type: 'string' } },
        diagnosticPlots: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'multilevel', 'diagnostics']
}));

// Task 7: Quality Scoring
export const multilevelQualityScoringTask = defineTask('multilevel-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score analysis quality',
  agent: {
    name: 'mlm-quality-reviewer',
    prompt: {
      role: 'senior multilevel modeling methodologist',
      task: 'Assess multilevel analysis quality and rigor',
      context: args,
      instructions: [
        'Evaluate data structure assessment (weight: 10%)',
        'Assess null model analysis (weight: 15%)',
        'Evaluate random intercept model building (weight: 20%)',
        'Assess random slope model building (weight: 20%)',
        'Evaluate model comparison rigor (weight: 20%)',
        'Assess diagnostic completeness (weight: 15%)',
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
            dataStructure: { type: 'number' },
            nullModel: { type: 'number' },
            randomIntercept: { type: 'number' },
            randomSlope: { type: 'number' },
            modelComparison: { type: 'number' },
            diagnostics: { type: 'number' }
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
  labels: ['agent', 'multilevel', 'quality-scoring']
}));
