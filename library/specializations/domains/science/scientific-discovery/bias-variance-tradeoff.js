/**
 * @process scientific-discovery/bias-variance-tradeoff
 * @description Balance model simplicity and flexibility through systematic analysis of bias-variance tradeoff in prediction and estimation
 * @inputs { model: object, data: object, alternatives: array, validationStrategy: string, outputDir: string }
 * @outputs { success: boolean, tradeoffAnalysis: object, optimalComplexity: object, recommendations: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    model = {},
    data = {},
    alternatives = [],
    validationStrategy = 'cross-validation',
    outputDir = 'bias-variance-output',
    targetBalance = 80
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Bias-Variance Tradeoff Process');

  // ============================================================================
  // PHASE 1: ERROR DECOMPOSITION
  // ============================================================================

  ctx.log('info', 'Phase 1: Decomposing prediction error');
  const errorDecomposition = await ctx.task(errorDecompositionTask, {
    model,
    data,
    outputDir
  });

  artifacts.push(...errorDecomposition.artifacts);

  // ============================================================================
  // PHASE 2: BIAS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing model bias');
  const biasAnalysis = await ctx.task(biasAnalysisTask, {
    model,
    data,
    errorDecomposition,
    outputDir
  });

  artifacts.push(...biasAnalysis.artifacts);

  // ============================================================================
  // PHASE 3: VARIANCE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Analyzing model variance');
  const varianceAnalysis = await ctx.task(varianceAnalysisTask, {
    model,
    data,
    errorDecomposition,
    validationStrategy,
    outputDir
  });

  artifacts.push(...varianceAnalysis.artifacts);

  // ============================================================================
  // PHASE 4: COMPLEXITY-ERROR RELATIONSHIP
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing complexity-error relationship');
  const complexityAnalysis = await ctx.task(complexityErrorRelationshipTask, {
    model,
    alternatives,
    data,
    validationStrategy,
    outputDir
  });

  artifacts.push(...complexityAnalysis.artifacts);

  // ============================================================================
  // PHASE 5: LEARNING CURVE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Analyzing learning curves');
  const learningCurves = await ctx.task(learningCurveAnalysisTask, {
    model,
    data,
    biasAnalysis,
    varianceAnalysis,
    outputDir
  });

  artifacts.push(...learningCurves.artifacts);

  // ============================================================================
  // PHASE 6: REGULARIZATION ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Analyzing regularization effects');
  const regularizationAnalysis = await ctx.task(regularizationAnalysisTask, {
    model,
    data,
    biasAnalysis,
    varianceAnalysis,
    outputDir
  });

  artifacts.push(...regularizationAnalysis.artifacts);

  // ============================================================================
  // PHASE 7: OPTIMAL COMPLEXITY DETERMINATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Determining optimal complexity');
  const optimalComplexity = await ctx.task(optimalComplexityDeterminationTask, {
    complexityAnalysis,
    learningCurves,
    regularizationAnalysis,
    validationStrategy,
    outputDir
  });

  artifacts.push(...optimalComplexity.artifacts);

  // ============================================================================
  // PHASE 8: SYNTHESIS AND RECOMMENDATIONS
  // ============================================================================

  ctx.log('info', 'Phase 8: Synthesizing tradeoff analysis');
  const synthesis = await ctx.task(biasVarianceSynthesisTask, {
    errorDecomposition,
    biasAnalysis,
    varianceAnalysis,
    complexityAnalysis,
    learningCurves,
    regularizationAnalysis,
    optimalComplexity,
    targetBalance,
    outputDir
  });

  artifacts.push(...synthesis.artifacts);

  const balanceMet = synthesis.balanceScore >= targetBalance;

  // Breakpoint: Review bias-variance analysis
  await ctx.breakpoint({
    question: `Bias-variance analysis complete. Balance: ${synthesis.balanceScore}/${targetBalance}. ${balanceMet ? 'Balance target met!' : 'Further tuning may be needed.'} Review analysis?`,
    title: 'Bias-Variance Tradeoff Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        biasEstimate: biasAnalysis.biasEstimate,
        varianceEstimate: varianceAnalysis.varianceEstimate,
        optimalComplexity: optimalComplexity.optimal.complexityLevel,
        currentStatus: synthesis.currentStatus,
        balanceScore: synthesis.balanceScore,
        balanceMet
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    tradeoffAnalysis: {
      bias: biasAnalysis.biasEstimate,
      variance: varianceAnalysis.varianceEstimate,
      totalError: errorDecomposition.totalError,
      currentStatus: synthesis.currentStatus
    },
    optimalComplexity: optimalComplexity.optimal,
    learningCurves: learningCurves.curves,
    regularization: regularizationAnalysis.recommendations,
    recommendations: synthesis.recommendations,
    balanceScore: synthesis.balanceScore,
    balanceMet,
    artifacts,
    duration,
    metadata: {
      processId: 'scientific-discovery/bias-variance-tradeoff',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Error Decomposition
export const errorDecompositionTask = defineTask('error-decomposition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Decompose prediction error',
  agent: {
    name: 'error-analyst',
    prompt: {
      role: 'statistical learning theorist',
      task: 'Decompose the expected prediction error into components',
      context: args,
      instructions: [
        'Apply bias-variance decomposition:',
        '  Expected Error = Bias² + Variance + Irreducible Noise',
        'Estimate each component:',
        '  - Bias²: (E[f̂] - f)² - systematic error',
        '  - Variance: E[(f̂ - E[f̂])²] - estimation variability',
        '  - Noise: σ² - inherent randomness',
        'Use appropriate estimation methods:',
        '  - Bootstrap for variance estimation',
        '  - Residual variance for noise',
        '  - Multiple fits for bias assessment',
        'Report decomposition results',
        'Visualize error components',
        'Save error decomposition to output directory'
      ],
      outputFormat: 'JSON with totalError, bias, variance, noise, decomposition, visualization, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalError', 'decomposition', 'artifacts'],
      properties: {
        totalError: { type: 'number' },
        decomposition: {
          type: 'object',
          properties: {
            biasSquared: { type: 'number' },
            variance: { type: 'number' },
            noise: { type: 'number' }
          }
        },
        estimationMethod: { type: 'string' },
        visualization: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'bias-variance', 'error-decomposition']
}));

// Task 2: Bias Analysis
export const biasAnalysisTask = defineTask('bias-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze model bias',
  agent: {
    name: 'bias-analyst',
    prompt: {
      role: 'model diagnostician',
      task: 'Analyze sources and magnitude of model bias',
      context: args,
      instructions: [
        'Identify sources of bias:',
        '  - Underfitting (model too simple)',
        '  - Missing features',
        '  - Wrong functional form',
        '  - Misspecified relationships',
        'Quantify bias:',
        '  - Compare predictions to true values',
        '  - Analyze systematic patterns in residuals',
        '  - Assess bias across input space',
        'Identify high-bias indicators:',
        '  - High training error',
        '  - Training ≈ test error (both high)',
        '  - Learning curve plateau early',
        'Assess impact of bias on conclusions',
        'Save bias analysis to output directory'
      ],
      outputFormat: 'JSON with biasEstimate, sources, patterns, indicators, impact, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['biasEstimate', 'sources', 'artifacts'],
      properties: {
        biasEstimate: { type: 'number' },
        sources: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              source: { type: 'string' },
              contribution: { type: 'string' },
              addressable: { type: 'boolean' }
            }
          }
        },
        patterns: { type: 'array', items: { type: 'string' } },
        indicators: {
          type: 'object',
          properties: {
            trainingError: { type: 'number' },
            residualPatterns: { type: 'string' }
          }
        },
        impact: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'bias-variance', 'bias-analysis']
}));

// Task 3: Variance Analysis
export const varianceAnalysisTask = defineTask('variance-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze model variance',
  agent: {
    name: 'variance-analyst',
    prompt: {
      role: 'statistical learning specialist',
      task: 'Analyze sources and magnitude of model variance',
      context: args,
      instructions: [
        'Identify sources of variance:',
        '  - Overfitting (model too complex)',
        '  - Small sample size',
        '  - High-dimensional features',
        '  - Unstable algorithms',
        'Quantify variance:',
        '  - Bootstrap variance of predictions',
        '  - Cross-validation variance',
        '  - Prediction interval widths',
        'Identify high-variance indicators:',
        '  - Large gap: training << test error',
        '  - Predictions sensitive to data changes',
        '  - Unstable feature importance',
        'Assess variance across input space',
        'Save variance analysis to output directory'
      ],
      outputFormat: 'JSON with varianceEstimate, sources, indicators, spatialVariation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['varianceEstimate', 'sources', 'artifacts'],
      properties: {
        varianceEstimate: { type: 'number' },
        sources: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              source: { type: 'string' },
              contribution: { type: 'string' },
              addressable: { type: 'boolean' }
            }
          }
        },
        indicators: {
          type: 'object',
          properties: {
            trainingTestGap: { type: 'number' },
            predictionInstability: { type: 'number' }
          }
        },
        spatialVariation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'bias-variance', 'variance-analysis']
}));

// Task 4: Complexity-Error Relationship
export const complexityErrorRelationshipTask = defineTask('complexity-error-relationship', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze complexity-error relationship',
  agent: {
    name: 'complexity-analyst',
    prompt: {
      role: 'model selection specialist',
      task: 'Analyze how model complexity affects error',
      context: args,
      instructions: [
        'Define complexity measures:',
        '  - Number of parameters',
        '  - VC dimension',
        '  - Degrees of freedom',
        '  - Regularization strength (inverse)',
        'Fit models at different complexity levels',
        'Track error components vs. complexity:',
        '  - Training error (decreases with complexity)',
        '  - Test error (U-shaped)',
        '  - Bias (decreases)',
        '  - Variance (increases)',
        'Plot complexity vs. error curves',
        'Identify the U-curve minimum',
        'Save complexity analysis to output directory'
      ],
      outputFormat: 'JSON with complexityMeasure, errorCurve, uCurve, minimum, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['complexityMeasure', 'errorCurve', 'artifacts'],
      properties: {
        complexityMeasure: { type: 'string' },
        errorCurve: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              complexity: { type: 'number' },
              trainingError: { type: 'number' },
              testError: { type: 'number' },
              bias: { type: 'number' },
              variance: { type: 'number' }
            }
          }
        },
        uCurve: { type: 'object' },
        minimum: {
          type: 'object',
          properties: {
            complexity: { type: 'number' },
            testError: { type: 'number' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'bias-variance', 'complexity']
}));

// Task 5: Learning Curve Analysis
export const learningCurveAnalysisTask = defineTask('learning-curve-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze learning curves',
  agent: {
    name: 'learning-curve-analyst',
    prompt: {
      role: 'machine learning diagnostician',
      task: 'Analyze learning curves to diagnose bias-variance',
      context: args,
      instructions: [
        'Generate learning curves:',
        '  - Plot error vs. training set size',
        '  - Track both training and validation error',
        'Interpret learning curve patterns:',
        '  - High bias: both curves plateau high, converge',
        '  - High variance: large gap, curves don\'t converge',
        '  - Balanced: curves converge at low error',
        'Assess data requirements:',
        '  - Will more data help? (variance case)',
        '  - Is model improvement needed? (bias case)',
        'Project performance with more data',
        'Save learning curve analysis to output directory'
      ],
      outputFormat: 'JSON with curves (trainSize, trainError, validError), pattern, diagnosis, dataRecommendation, projection, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['curves', 'pattern', 'diagnosis', 'artifacts'],
      properties: {
        curves: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              trainSize: { type: 'number' },
              trainError: { type: 'number' },
              validError: { type: 'number' }
            }
          }
        },
        pattern: { type: 'string', enum: ['high-bias', 'high-variance', 'balanced', 'mixed'] },
        diagnosis: { type: 'string' },
        dataRecommendation: { type: 'string' },
        projection: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'bias-variance', 'learning-curves']
}));

// Task 6: Regularization Analysis
export const regularizationAnalysisTask = defineTask('regularization-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze regularization effects',
  agent: {
    name: 'regularization-analyst',
    prompt: {
      role: 'regularization specialist',
      task: 'Analyze how regularization affects bias-variance tradeoff',
      context: args,
      instructions: [
        'Identify regularization mechanisms:',
        '  - L1 regularization (Lasso)',
        '  - L2 regularization (Ridge)',
        '  - Elastic net',
        '  - Dropout, early stopping',
        '  - Data augmentation',
        'Analyze regularization effect:',
        '  - λ → 0: Low bias, high variance',
        '  - λ → ∞: High bias, low variance',
        'Tune regularization parameter:',
        '  - Cross-validation',
        '  - Information criteria',
        'Find optimal regularization strength',
        'Visualize regularization path',
        'Save regularization analysis to output directory'
      ],
      outputFormat: 'JSON with mechanisms, effectAnalysis, optimalLambda, regularizationPath, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['mechanisms', 'optimalLambda', 'recommendations', 'artifacts'],
      properties: {
        mechanisms: { type: 'array', items: { type: 'string' } },
        effectAnalysis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              lambda: { type: 'number' },
              bias: { type: 'number' },
              variance: { type: 'number' },
              testError: { type: 'number' }
            }
          }
        },
        optimalLambda: { type: 'number' },
        regularizationPath: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'bias-variance', 'regularization']
}));

// Task 7: Optimal Complexity Determination
export const optimalComplexityDeterminationTask = defineTask('optimal-complexity-determination', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Determine optimal complexity',
  agent: {
    name: 'optimization-specialist',
    prompt: {
      role: 'model selection expert',
      task: 'Determine the optimal model complexity',
      context: args,
      instructions: [
        'Integrate evidence from:',
        '  - Complexity-error curves',
        '  - Learning curves',
        '  - Regularization analysis',
        'Identify optimal complexity:',
        '  - Minimum of test error curve',
        '  - Cross-validation optimum',
        '  - Information criterion optimum (AIC, BIC)',
        'Consider practical constraints:',
        '  - Interpretability requirements',
        '  - Computational limits',
        '  - Sample size limitations',
        'Provide confidence interval for optimal',
        'Compare to current model complexity',
        'Save optimal complexity to output directory'
      ],
      outputFormat: 'JSON with optimal (complexityLevel, testError, confidence), currentComparison, constraints, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['optimal', 'currentComparison', 'artifacts'],
      properties: {
        optimal: {
          type: 'object',
          properties: {
            complexityLevel: { type: 'number' },
            testError: { type: 'number' },
            confidence: { type: 'object' },
            method: { type: 'string' }
          }
        },
        currentComparison: {
          type: 'object',
          properties: {
            currentComplexity: { type: 'number' },
            distanceFromOptimal: { type: 'number' },
            direction: { type: 'string', enum: ['increase', 'decrease', 'maintain'] }
          }
        },
        constraints: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'bias-variance', 'optimal-complexity']
}));

// Task 8: Bias-Variance Synthesis
export const biasVarianceSynthesisTask = defineTask('bias-variance-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize tradeoff analysis',
  agent: {
    name: 'synthesis-specialist',
    prompt: {
      role: 'senior data scientist',
      task: 'Synthesize bias-variance tradeoff analysis',
      context: args,
      instructions: [
        'Summarize bias-variance analysis:',
        '  - Current bias and variance levels',
        '  - Error decomposition',
        '  - Optimal complexity',
        'Assess balance score (0-100):',
        '  - Is current model at optimal complexity?',
        '  - Are bias and variance appropriately balanced?',
        '  - Is the right tradeoff being made?',
        'Determine current status:',
        '  - Underfitting (high bias)',
        '  - Overfitting (high variance)',
        '  - Well-balanced',
        'Provide actionable recommendations',
        'Save synthesis to output directory'
      ],
      outputFormat: 'JSON with summary, balanceScore, currentStatus, recommendations, nextSteps, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'balanceScore', 'currentStatus', 'artifacts'],
      properties: {
        summary: {
          type: 'object',
          properties: {
            bias: { type: 'number' },
            variance: { type: 'number' },
            totalError: { type: 'number' },
            optimalComplexity: { type: 'number' }
          }
        },
        balanceScore: { type: 'number', minimum: 0, maximum: 100 },
        currentStatus: { type: 'string', enum: ['underfitting', 'overfitting', 'balanced', 'uncertain'] },
        recommendations: { type: 'array', items: { type: 'string' } },
        nextSteps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'bias-variance', 'synthesis']
}));
