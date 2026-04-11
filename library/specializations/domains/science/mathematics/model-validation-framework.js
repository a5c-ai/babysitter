/**
 * @process specializations/domains/science/mathematics/model-validation-framework
 * @description Validate mathematical models against experimental or observational data.
 * Includes parameter estimation, residual analysis, and goodness-of-fit assessment.
 * @inputs { model: object, observationalData: object, validationCriteria?: object }
 * @outputs { success: boolean, parameterEstimates: object, residualAnalysis: object, goodnessOfFit: object, modelLimitations: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/mathematics/model-validation-framework', {
 *   model: { type: 'ODE', equations: ['dy/dt = k*y'], parameters: ['k'] },
 *   observationalData: { t: [0, 1, 2, 3, 4], y: [1, 2.7, 7.4, 20.1, 54.6] },
 *   validationCriteria: { rSquaredThreshold: 0.95, residualNormality: true }
 * });
 *
 * @references
 * - Aster et al., Parameter Estimation and Inverse Problems
 * - Seber & Wild, Nonlinear Regression
 * - Burnham & Anderson, Model Selection and Multimodel Inference
 * - Oberkampf & Roy, Verification and Validation in Scientific Computing
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    model,
    observationalData,
    validationCriteria = { rSquaredThreshold: 0.9, residualNormality: true }
  } = inputs;

  // Phase 1: Define Validation Metrics
  const metricsDefinition = await ctx.task(metricsDefinitionTask, {
    model,
    observationalData,
    validationCriteria
  });

  // Quality Gate: Metrics must be definable
  if (!metricsDefinition.metrics || metricsDefinition.metrics.length === 0) {
    return {
      success: false,
      error: 'Unable to define validation metrics',
      phase: 'metrics-definition',
      goodnessOfFit: null
    };
  }

  // Breakpoint: Review validation metrics
  await ctx.breakpoint({
    question: `Defined ${metricsDefinition.metrics.length} validation metrics. Review selection?`,
    title: 'Validation Metrics Review',
    context: {
      runId: ctx.runId,
      model: model.type,
      metrics: metricsDefinition.metrics,
      files: [{
        path: `artifacts/phase1-metrics.json`,
        format: 'json',
        content: metricsDefinition
      }]
    }
  });

  // Phase 2: Compare Model Predictions to Data
  const predictionComparison = await ctx.task(predictionComparisonTask, {
    model,
    observationalData,
    metricsDefinition
  });

  // Phase 3: Perform Residual Analysis
  const residualAnalysis = await ctx.task(residualAnalysisTask, {
    predictionComparison,
    observationalData,
    model
  });

  // Phase 4: Assess Predictive Accuracy
  const accuracyAssessment = await ctx.task(accuracyAssessmentTask, {
    predictionComparison,
    residualAnalysis,
    validationCriteria
  });

  // Quality Gate: Check if validation criteria are met
  if (!accuracyAssessment.validationPassed) {
    await ctx.breakpoint({
      question: `Model validation failed. R-squared: ${accuracyAssessment.rSquared}. Review issues and consider model refinement?`,
      title: 'Validation Failed',
      context: {
        runId: ctx.runId,
        issues: accuracyAssessment.issues,
        recommendation: 'Consider model refinement or additional data'
      }
    });
  }

  // Phase 5: Document Model Limitations
  const limitationsDocumentation = await ctx.task(limitationsDocumentationTask, {
    model,
    predictionComparison,
    residualAnalysis,
    accuracyAssessment,
    observationalData
  });

  // Final Breakpoint: Validation Complete
  await ctx.breakpoint({
    question: `Model validation complete. Overall fit: ${accuracyAssessment.overallAssessment}. Accept validation?`,
    title: 'Validation Complete',
    context: {
      runId: ctx.runId,
      overallFit: accuracyAssessment.overallAssessment,
      rSquared: accuracyAssessment.rSquared,
      limitations: limitationsDocumentation.limitations,
      files: [
        { path: `artifacts/validation-results.json`, format: 'json', content: { accuracyAssessment, residualAnalysis } }
      ]
    }
  });

  return {
    success: true,
    model: model.type,
    parameterEstimates: predictionComparison.parameterEstimates,
    residualAnalysis: {
      residuals: residualAnalysis.residuals,
      normalityTest: residualAnalysis.normalityTest,
      autocorrelation: residualAnalysis.autocorrelation,
      heteroscedasticity: residualAnalysis.heteroscedasticity
    },
    goodnessOfFit: {
      rSquared: accuracyAssessment.rSquared,
      adjustedRSquared: accuracyAssessment.adjustedRSquared,
      rmse: accuracyAssessment.rmse,
      mae: accuracyAssessment.mae,
      aic: accuracyAssessment.aic,
      bic: accuracyAssessment.bic
    },
    validationPassed: accuracyAssessment.validationPassed,
    modelLimitations: limitationsDocumentation.limitations,
    recommendations: limitationsDocumentation.recommendations,
    metadata: {
      processId: 'specializations/domains/science/mathematics/model-validation-framework',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const metricsDefinitionTask = defineTask('metrics-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Define Validation Metrics`,
  agent: {
    name: 'mathematical-modeler',
    skills: ['r-statistical-computing', 'benchmark-suite-manager', 'monte-carlo-simulation'],
    prompt: {
      role: 'Model Validation Expert',
      task: 'Define appropriate validation metrics for the model',
      context: {
        model: args.model,
        observationalData: args.observationalData,
        validationCriteria: args.validationCriteria
      },
      instructions: [
        '1. Identify appropriate metrics for the model type',
        '2. Select goodness-of-fit measures (R-squared, RMSE, etc.)',
        '3. Define residual analysis tests',
        '4. Identify information criteria (AIC, BIC)',
        '5. Define cross-validation strategy',
        '6. Set acceptance thresholds for each metric',
        '7. Consider domain-specific metrics',
        '8. Define statistical tests for model adequacy',
        '9. Plan for visual diagnostics',
        '10. Document metric selection rationale'
      ],
      outputFormat: 'JSON object with validation metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'thresholds'],
      properties: {
        metrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              purpose: { type: 'string' },
              formula: { type: 'string' }
            }
          }
        },
        thresholds: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              threshold: { type: 'number' },
              direction: { type: 'string' }
            }
          }
        },
        residualTests: { type: 'array', items: { type: 'string' } },
        crossValidation: {
          type: 'object',
          properties: {
            method: { type: 'string' },
            folds: { type: 'number' }
          }
        },
        visualDiagnostics: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'model-validation', 'metrics']
}));

export const predictionComparisonTask = defineTask('prediction-comparison', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Compare Model Predictions to Data`,
  agent: {
    name: 'mathematical-modeler',
    skills: ['r-statistical-computing', 'sympy-computer-algebra', 'benchmark-suite-manager'],
    prompt: {
      role: 'Model Calibration Expert',
      task: 'Compare model predictions against observational data',
      context: {
        model: args.model,
        observationalData: args.observationalData,
        metricsDefinition: args.metricsDefinition
      },
      instructions: [
        '1. Estimate model parameters from data',
        '2. Generate model predictions at observation points',
        '3. Compute prediction errors',
        '4. Calculate basic comparison statistics',
        '5. Identify systematic deviations',
        '6. Assess prediction uncertainty',
        '7. Compare across different data subsets',
        '8. Identify outliers or anomalous points',
        '9. Assess prediction bias',
        '10. Document comparison methodology'
      ],
      outputFormat: 'JSON object with prediction comparison'
    },
    outputSchema: {
      type: 'object',
      required: ['parameterEstimates', 'predictions', 'errors'],
      properties: {
        parameterEstimates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              parameter: { type: 'string' },
              estimate: { type: 'number' },
              standardError: { type: 'number' },
              confidenceInterval: { type: 'object' }
            }
          }
        },
        predictions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              point: { type: 'string' },
              observed: { type: 'number' },
              predicted: { type: 'number' },
              error: { type: 'number' }
            }
          }
        },
        errors: {
          type: 'object',
          properties: {
            meanError: { type: 'number' },
            meanAbsoluteError: { type: 'number' },
            rootMeanSquareError: { type: 'number' }
          }
        },
        systematicDeviations: { type: 'array', items: { type: 'string' } },
        outliers: { type: 'array', items: { type: 'object' } },
        bias: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'model-validation', 'predictions']
}));

export const residualAnalysisTask = defineTask('residual-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Perform Residual Analysis`,
  agent: {
    name: 'mathematical-modeler',
    skills: ['r-statistical-computing', 'stata-statistical-analysis', 'sympy-computer-algebra'],
    prompt: {
      role: 'Statistical Residual Analysis Expert',
      task: 'Perform comprehensive residual analysis',
      context: {
        predictionComparison: args.predictionComparison,
        observationalData: args.observationalData,
        model: args.model
      },
      instructions: [
        '1. Compute standardized residuals',
        '2. Test residuals for normality',
        '3. Test for autocorrelation in residuals',
        '4. Test for heteroscedasticity',
        '5. Create residual plots (vs predicted, vs time)',
        '6. Check for patterns in residuals',
        '7. Identify influential observations',
        '8. Compute leverage and Cooks distance',
        '9. Test for independence of residuals',
        '10. Document residual analysis findings'
      ],
      outputFormat: 'JSON object with residual analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['residuals', 'normalityTest', 'assumptions'],
      properties: {
        residuals: {
          type: 'object',
          properties: {
            raw: { type: 'array', items: { type: 'number' } },
            standardized: { type: 'array', items: { type: 'number' } },
            studentized: { type: 'array', items: { type: 'number' } }
          }
        },
        normalityTest: {
          type: 'object',
          properties: {
            test: { type: 'string' },
            statistic: { type: 'number' },
            pValue: { type: 'number' },
            normal: { type: 'boolean' }
          }
        },
        autocorrelation: {
          type: 'object',
          properties: {
            test: { type: 'string' },
            statistic: { type: 'number' },
            pValue: { type: 'number' },
            independent: { type: 'boolean' }
          }
        },
        heteroscedasticity: {
          type: 'object',
          properties: {
            test: { type: 'string' },
            statistic: { type: 'number' },
            pValue: { type: 'number' },
            homoscedastic: { type: 'boolean' }
          }
        },
        influentialPoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              index: { type: 'number' },
              leverage: { type: 'number' },
              cooksD: { type: 'number' }
            }
          }
        },
        assumptions: {
          type: 'object',
          properties: {
            normalityMet: { type: 'boolean' },
            independenceMet: { type: 'boolean' },
            homoscedasticityMet: { type: 'boolean' }
          }
        },
        patterns: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'model-validation', 'residuals']
}));

export const accuracyAssessmentTask = defineTask('accuracy-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Assess Predictive Accuracy`,
  agent: {
    name: 'mathematical-modeler',
    skills: ['r-statistical-computing', 'monte-carlo-simulation', 'benchmark-suite-manager'],
    prompt: {
      role: 'Model Accuracy Assessment Expert',
      task: 'Assess overall predictive accuracy and model adequacy',
      context: {
        predictionComparison: args.predictionComparison,
        residualAnalysis: args.residualAnalysis,
        validationCriteria: args.validationCriteria
      },
      instructions: [
        '1. Compute R-squared and adjusted R-squared',
        '2. Compute RMSE and MAE',
        '3. Compute AIC and BIC',
        '4. Perform cross-validation',
        '5. Assess prediction intervals coverage',
        '6. Compare against validation criteria',
        '7. Identify systematic model deficiencies',
        '8. Assess model for overfitting',
        '9. Provide overall assessment',
        '10. List specific issues found'
      ],
      outputFormat: 'JSON object with accuracy assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['rSquared', 'rmse', 'validationPassed', 'overallAssessment'],
      properties: {
        rSquared: { type: 'number' },
        adjustedRSquared: { type: 'number' },
        rmse: { type: 'number' },
        mae: { type: 'number' },
        mape: { type: 'number' },
        aic: { type: 'number' },
        bic: { type: 'number' },
        crossValidation: {
          type: 'object',
          properties: {
            cvScore: { type: 'number' },
            cvStd: { type: 'number' }
          }
        },
        predictionIntervalCoverage: { type: 'number' },
        validationPassed: { type: 'boolean' },
        criteriaResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              met: { type: 'boolean' },
              value: { type: 'number' }
            }
          }
        },
        overallAssessment: { type: 'string', enum: ['excellent', 'good', 'acceptable', 'poor', 'inadequate'] },
        issues: { type: 'array', items: { type: 'string' } },
        overfittingRisk: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'model-validation', 'accuracy']
}));

export const limitationsDocumentationTask = defineTask('limitations-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Document Model Limitations`,
  agent: {
    name: 'mathematical-modeler',
    skills: ['latex-math-formatter', 'r-statistical-computing', 'scientific-literature-search'],
    prompt: {
      role: 'Model Limitations Analyst',
      task: 'Document model limitations and provide recommendations',
      context: {
        model: args.model,
        predictionComparison: args.predictionComparison,
        residualAnalysis: args.residualAnalysis,
        accuracyAssessment: args.accuracyAssessment,
        observationalData: args.observationalData
      },
      instructions: [
        '1. Identify model structural limitations',
        '2. Document regions of poor fit',
        '3. Identify extrapolation risks',
        '4. Document data limitations',
        '5. Identify missing physics/mechanisms',
        '6. Assess prediction uncertainty',
        '7. Document conditions for valid use',
        '8. Suggest model improvements',
        '9. Recommend additional data collection',
        '10. Provide usage guidelines'
      ],
      outputFormat: 'JSON object with limitations documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['limitations', 'recommendations', 'usageGuidelines'],
      properties: {
        limitations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              limitation: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'major', 'minor'] },
              impact: { type: 'string' },
              mitigation: { type: 'string' }
            }
          }
        },
        poorFitRegions: { type: 'array', items: { type: 'string' } },
        extrapolationRisks: { type: 'array', items: { type: 'string' } },
        dataLimitations: { type: 'array', items: { type: 'string' } },
        missingMechanisms: { type: 'array', items: { type: 'string' } },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              priority: { type: 'string' },
              expectedBenefit: { type: 'string' }
            }
          }
        },
        usageGuidelines: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              guideline: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        validityDomain: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'model-validation', 'limitations']
}));
