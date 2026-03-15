/**
 * @process social-sciences/propensity-score-analysis
 * @description Implement propensity score matching, weighting, and stratification methods to estimate treatment effects from observational data while addressing selection bias
 * @inputs { dataPath: string, treatment: string, outcome: string, covariates: array, outputDir: string }
 * @outputs { success: boolean, treatmentEffect: object, balanceAssessment: object, sensitivityAnalysis: object, qualityScore: number, artifacts: array }
 * @recommendedSkills SK-SS-004 (causal-inference-methods), SK-SS-001 (quantitative-methods)
 * @recommendedAgents AG-SS-005 (causal-inference-analyst), AG-SS-001 (quantitative-research-methodologist)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    dataPath,
    treatment,
    outcome,
    covariates = [],
    outputDir = 'propensity-score-output',
    method = 'matching'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Propensity Score Analysis process');

  // ============================================================================
  // PHASE 1: COVARIATE ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 1: Assessing covariates');
  const covariateAssessment = await ctx.task(covariateAssessmentTask, {
    dataPath,
    treatment,
    covariates,
    outputDir
  });

  artifacts.push(...covariateAssessment.artifacts);

  // ============================================================================
  // PHASE 2: PROPENSITY SCORE ESTIMATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Estimating propensity scores');
  const psEstimation = await ctx.task(propensityScoreEstimationTask, {
    dataPath,
    treatment,
    covariates,
    covariateAssessment,
    outputDir
  });

  artifacts.push(...psEstimation.artifacts);

  // ============================================================================
  // PHASE 3: PS METHOD APPLICATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Applying propensity score method');
  const psApplication = await ctx.task(psMethodApplicationTask, {
    dataPath,
    treatment,
    psEstimation,
    method,
    outputDir
  });

  artifacts.push(...psApplication.artifacts);

  // ============================================================================
  // PHASE 4: BALANCE ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Assessing covariate balance');
  const balanceAssessment = await ctx.task(balanceAssessmentTask, {
    dataPath,
    covariates,
    psApplication,
    outputDir
  });

  artifacts.push(...balanceAssessment.artifacts);

  // ============================================================================
  // PHASE 5: TREATMENT EFFECT ESTIMATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Estimating treatment effects');
  const treatmentEffect = await ctx.task(treatmentEffectEstimationTask, {
    dataPath,
    treatment,
    outcome,
    psApplication,
    balanceAssessment,
    outputDir
  });

  artifacts.push(...treatmentEffect.artifacts);

  // ============================================================================
  // PHASE 6: SENSITIVITY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Conducting sensitivity analysis');
  const sensitivityAnalysis = await ctx.task(psSensitivityAnalysisTask, {
    treatmentEffect,
    psApplication,
    outputDir
  });

  artifacts.push(...sensitivityAnalysis.artifacts);

  // ============================================================================
  // PHASE 7: QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Phase 7: Scoring analysis quality');
  const qualityScore = await ctx.task(psaQualityScoringTask, {
    covariateAssessment,
    psEstimation,
    psApplication,
    balanceAssessment,
    treatmentEffect,
    sensitivityAnalysis,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const psaScore = qualityScore.overallScore;
  const qualityMet = psaScore >= 80;

  // Breakpoint: Review propensity score analysis
  await ctx.breakpoint({
    question: `Propensity score analysis complete. Quality score: ${psaScore}/100. ${qualityMet ? 'Analysis meets quality standards!' : 'Analysis may need refinement.'} Review and approve?`,
    title: 'Propensity Score Analysis Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown'
      })),
      summary: {
        psaScore,
        qualityMet,
        method,
        treatmentEffectEstimate: treatmentEffect.estimate,
        balanceAchieved: balanceAssessment.achieved
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    qualityScore: psaScore,
    qualityMet,
    treatmentEffect: {
      estimate: treatmentEffect.estimate,
      standardError: treatmentEffect.standardError,
      confidenceInterval: treatmentEffect.confidenceInterval,
      pValue: treatmentEffect.pValue
    },
    balanceAssessment: {
      achieved: balanceAssessment.achieved,
      standardizedDifferences: balanceAssessment.standardizedDifferences,
      varianceRatios: balanceAssessment.varianceRatios
    },
    sensitivityAnalysis: {
      gamma: sensitivityAnalysis.gamma,
      robustness: sensitivityAnalysis.robustness
    },
    artifacts,
    duration,
    metadata: {
      processId: 'social-sciences/propensity-score-analysis',
      timestamp: startTime,
      method,
      outputDir
    }
  };
}

// Task 1: Covariate Assessment
export const covariateAssessmentTask = defineTask('covariate-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess covariates',
  agent: {
    name: 'covariate-analyst',
    prompt: {
      role: 'causal inference methodologist',
      task: 'Assess covariates for propensity score analysis',
      context: args,
      instructions: [
        'Review covariate selection based on causal diagram',
        'Identify confounders vs colliders vs mediators',
        'Check for variables affected by treatment (post-treatment)',
        'Assess covariate overlap between groups',
        'Examine baseline imbalance between treatment groups',
        'Identify missing data patterns in covariates',
        'Recommend covariate specification for PS model',
        'Generate covariate assessment report'
      ],
      outputFormat: 'JSON with confounders, baselineImbalance, overlap, missingData, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['confounders', 'baselineImbalance', 'artifacts'],
      properties: {
        confounders: { type: 'array', items: { type: 'string' } },
        baselineImbalance: { type: 'object' },
        overlap: { type: 'object' },
        missingData: { type: 'object' },
        postTreatmentVariables: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'propensity-score', 'covariate-assessment']
}));

// Task 2: Propensity Score Estimation
export const propensityScoreEstimationTask = defineTask('ps-estimation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Estimate propensity scores',
  agent: {
    name: 'ps-estimation-analyst',
    prompt: {
      role: 'propensity score specialist',
      task: 'Estimate propensity scores using appropriate model',
      context: args,
      instructions: [
        'Specify logistic regression model for propensity score',
        'Consider interactions and non-linearities',
        'Estimate propensity scores',
        'Examine propensity score distribution',
        'Check for common support/overlap',
        'Identify and handle extreme propensity scores',
        'Consider alternative estimation methods (GBM, ML)',
        'Generate propensity score estimation report'
      ],
      outputFormat: 'JSON with propensityScores, modelSpecification, distribution, overlap, extremeValues, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['propensityScores', 'distribution', 'overlap', 'artifacts'],
      properties: {
        propensityScores: { type: 'string' },
        modelSpecification: { type: 'object' },
        distribution: { type: 'object' },
        overlap: { type: 'object' },
        extremeValues: { type: 'object' },
        commonSupport: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'propensity-score', 'estimation']
}));

// Task 3: PS Method Application
export const psMethodApplicationTask = defineTask('ps-method-application', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Apply propensity score method',
  agent: {
    name: 'ps-method-analyst',
    prompt: {
      role: 'propensity score methods specialist',
      task: 'Apply selected propensity score adjustment method',
      context: args,
      instructions: [
        'For matching: select matching algorithm (nearest neighbor, caliper, optimal)',
        'For matching: specify with/without replacement, matching ratio',
        'For weighting: calculate IPTW or ATT weights',
        'For weighting: trim or stabilize extreme weights',
        'For stratification: create propensity score strata',
        'Create analytic dataset with PS adjustment',
        'Document method choices and parameters',
        'Generate PS application report'
      ],
      outputFormat: 'JSON with method, parameters, matchedSample, weights, effectiveSampleSize, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['method', 'parameters', 'artifacts'],
      properties: {
        method: { type: 'string' },
        parameters: { type: 'object' },
        matchedSample: { type: 'object' },
        weights: { type: 'object' },
        effectiveSampleSize: { type: 'number' },
        droppedObservations: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'propensity-score', 'method-application']
}));

// Task 4: Balance Assessment
export const balanceAssessmentTask = defineTask('balance-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess covariate balance',
  agent: {
    name: 'balance-assessment-analyst',
    prompt: {
      role: 'propensity score balance expert',
      task: 'Assess covariate balance after PS adjustment',
      context: args,
      instructions: [
        'Calculate standardized mean differences (SMD)',
        'Compare SMD before and after adjustment',
        'Calculate variance ratios',
        'Apply conventional thresholds (SMD < 0.1 or 0.25)',
        'Create balance tables',
        'Generate Love plot for balance visualization',
        'Assess balance on interactions if included',
        'Determine if balance is sufficient',
        'Generate balance assessment report'
      ],
      outputFormat: 'JSON with achieved, standardizedDifferences, varianceRatios, balanceTable, lovePlot, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['achieved', 'standardizedDifferences', 'artifacts'],
      properties: {
        achieved: { type: 'boolean' },
        standardizedDifferences: { type: 'object' },
        varianceRatios: { type: 'object' },
        balanceTable: { type: 'string' },
        lovePlot: { type: 'string' },
        imbalancedCovariates: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'propensity-score', 'balance']
}));

// Task 5: Treatment Effect Estimation
export const treatmentEffectEstimationTask = defineTask('treatment-effect-estimation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Estimate treatment effects',
  agent: {
    name: 'treatment-effect-analyst',
    prompt: {
      role: 'causal inference analyst',
      task: 'Estimate treatment effects from PS-adjusted data',
      context: args,
      instructions: [
        'Specify outcome model on PS-adjusted sample',
        'Estimate ATE or ATT as appropriate',
        'Calculate appropriate standard errors (robust, cluster)',
        'Compute confidence intervals',
        'Apply doubly-robust estimation if appropriate',
        'Interpret treatment effect in context',
        'Report effect size and practical significance',
        'Generate treatment effect report'
      ],
      outputFormat: 'JSON with estimate, standardError, confidenceInterval, pValue, effectSize, interpretation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['estimate', 'standardError', 'confidenceInterval', 'artifacts'],
      properties: {
        estimate: { type: 'number' },
        standardError: { type: 'number' },
        confidenceInterval: {
          type: 'object',
          properties: {
            lower: { type: 'number' },
            upper: { type: 'number' }
          }
        },
        pValue: { type: 'number' },
        effectSize: { type: 'number' },
        estimand: { type: 'string' },
        interpretation: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'propensity-score', 'treatment-effect']
}));

// Task 6: Sensitivity Analysis
export const psSensitivityAnalysisTask = defineTask('ps-sensitivity-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct sensitivity analysis',
  agent: {
    name: 'sensitivity-analyst',
    prompt: {
      role: 'causal inference methodologist',
      task: 'Conduct sensitivity analysis for unmeasured confounding',
      context: args,
      instructions: [
        'Apply Rosenbaum bounds sensitivity analysis',
        'Calculate gamma (sensitivity parameter)',
        'Determine robustness to hidden bias',
        'Apply E-value analysis for unmeasured confounding',
        'Conduct calibration with observed confounders',
        'Interpret sensitivity analysis results',
        'Assess overall robustness of findings',
        'Generate sensitivity analysis report'
      ],
      outputFormat: 'JSON with gamma, eValue, robustness, bounds, interpretation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['gamma', 'robustness', 'artifacts'],
      properties: {
        gamma: { type: 'number' },
        eValue: { type: 'object' },
        bounds: { type: 'object' },
        robustness: { type: 'string' },
        interpretation: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'propensity-score', 'sensitivity']
}));

// Task 7: Quality Scoring
export const psaQualityScoringTask = defineTask('psa-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score analysis quality',
  agent: {
    name: 'psa-quality-reviewer',
    prompt: {
      role: 'senior causal inference methodologist',
      task: 'Assess propensity score analysis quality',
      context: args,
      instructions: [
        'Evaluate covariate assessment thoroughness (weight: 15%)',
        'Assess PS estimation quality (weight: 20%)',
        'Evaluate PS method application appropriateness (weight: 15%)',
        'Assess balance achievement (weight: 20%)',
        'Evaluate treatment effect estimation rigor (weight: 15%)',
        'Assess sensitivity analysis comprehensiveness (weight: 15%)',
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
            covariateAssessment: { type: 'number' },
            psEstimation: { type: 'number' },
            psMethodApplication: { type: 'number' },
            balanceAssessment: { type: 'number' },
            treatmentEffect: { type: 'number' },
            sensitivityAnalysis: { type: 'number' }
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
  labels: ['agent', 'propensity-score', 'quality-scoring']
}));
