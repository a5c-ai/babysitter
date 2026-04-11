/**
 * @process specializations/domains/science/mathematics/statistical-model-selection
 * @description Guide selection of appropriate statistical models based on data characteristics, assumptions,
 * and research questions. Includes model comparison using information criteria and cross-validation.
 * @inputs { dataDescription: string, researchQuestion: string, dataCharacteristics?: object, candidateModels?: array }
 * @outputs { success: boolean, recommendedModel: object, modelComparisons: array, diagnostics: object, selectionRationale: string }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/mathematics/statistical-model-selection', {
 *   dataDescription: 'Longitudinal data with repeated measurements per subject over 12 time points',
 *   researchQuestion: 'How does treatment affect outcome trajectory over time?',
 *   dataCharacteristics: { sampleSize: 200, responseType: 'continuous', missingData: 0.15, nested: true },
 *   candidateModels: ['linear-mixed-model', 'generalized-estimating-equations', 'growth-curve-model']
 * });
 *
 * @references
 * - Burnham & Anderson, Model Selection and Multimodel Inference
 * - Gelman et al., Bayesian Data Analysis
 * - Hastie et al., The Elements of Statistical Learning
 * - Agresti, Categorical Data Analysis
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    dataDescription,
    researchQuestion,
    dataCharacteristics = {},
    candidateModels = []
  } = inputs;

  // Phase 1: Assess Data Distribution and Structure
  const dataAssessment = await ctx.task(dataAssessmentTask, {
    dataDescription,
    dataCharacteristics,
    researchQuestion
  });

  // Quality Gate: Data must be assessable
  if (!dataAssessment.dataStructure) {
    return {
      success: false,
      error: 'Unable to assess data structure',
      phase: 'data-assessment',
      recommendedModel: null
    };
  }

  // Breakpoint: Review data assessment
  await ctx.breakpoint({
    question: `Data assessment complete. Structure: ${dataAssessment.dataStructure}, Response type: ${dataAssessment.responseType}. Correct?`,
    title: 'Data Assessment Review',
    context: {
      runId: ctx.runId,
      dataDescription,
      assessment: dataAssessment,
      files: [{
        path: `artifacts/phase1-data-assessment.json`,
        format: 'json',
        content: dataAssessment
      }]
    }
  });

  // Phase 2: Check Model Assumptions
  const assumptionChecking = await ctx.task(assumptionCheckingTask, {
    dataAssessment,
    candidateModels,
    dataCharacteristics
  });

  // Phase 3: Compare Candidate Models
  const modelComparison = await ctx.task(modelComparisonTask, {
    dataAssessment,
    assumptionChecking,
    candidateModels,
    researchQuestion
  });

  // Phase 4: Validate Model Diagnostics
  const modelDiagnostics = await ctx.task(modelDiagnosticsTask, {
    modelComparison,
    dataAssessment,
    topModels: modelComparison.rankedModels.slice(0, 3)
  });

  // Quality Gate: Check for critical diagnostic issues
  const criticalIssues = modelDiagnostics.diagnosticResults.filter(d => d.severity === 'critical');
  if (criticalIssues.length > 0) {
    await ctx.breakpoint({
      question: `Found ${criticalIssues.length} critical diagnostic issues with top models. Review alternatives?`,
      title: 'Model Diagnostic Issues',
      context: {
        runId: ctx.runId,
        criticalIssues,
        recommendation: 'Consider alternative models or data transformations'
      }
    });
  }

  // Phase 5: Document Selection Rationale
  const selectionDocumentation = await ctx.task(selectionDocumentationTask, {
    dataAssessment,
    assumptionChecking,
    modelComparison,
    modelDiagnostics,
    researchQuestion
  });

  // Final Breakpoint: Selection Complete
  await ctx.breakpoint({
    question: `Model selection complete. Recommended: ${modelComparison.recommendedModel}. Approve selection?`,
    title: 'Model Selection Complete',
    context: {
      runId: ctx.runId,
      researchQuestion,
      recommendedModel: modelComparison.recommendedModel,
      rationale: selectionDocumentation.rationale,
      files: [
        { path: `artifacts/model-selection.json`, format: 'json', content: { modelComparison, modelDiagnostics } }
      ]
    }
  });

  return {
    success: true,
    dataDescription,
    researchQuestion,
    recommendedModel: {
      name: modelComparison.recommendedModel,
      type: modelComparison.recommendedModelType,
      specifications: modelComparison.modelSpecifications,
      confidence: modelComparison.selectionConfidence
    },
    modelComparisons: modelComparison.rankedModels,
    informationCriteria: modelComparison.informationCriteria,
    crossValidation: modelComparison.crossValidationResults,
    diagnostics: {
      assumptionsSatisfied: modelDiagnostics.assumptionsSatisfied,
      diagnosticResults: modelDiagnostics.diagnosticResults,
      warnings: modelDiagnostics.warnings
    },
    selectionRationale: selectionDocumentation.rationale,
    alternativeModels: modelComparison.alternatives,
    metadata: {
      processId: 'specializations/domains/science/mathematics/statistical-model-selection',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const dataAssessmentTask = defineTask('data-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Assess Data Distribution and Structure`,
  agent: {
    name: 'statistician',
    skills: ['r-statistical-computing', 'stata-statistical-analysis', 'monte-carlo-simulation'],
    prompt: {
      role: 'Statistical Data Analyst specializing in exploratory data analysis',
      task: 'Assess data characteristics to guide model selection',
      context: {
        dataDescription: args.dataDescription,
        dataCharacteristics: args.dataCharacteristics,
        researchQuestion: args.researchQuestion
      },
      instructions: [
        '1. Identify the data structure (cross-sectional, longitudinal, hierarchical)',
        '2. Determine the response variable type (continuous, binary, count, ordinal)',
        '3. Assess the distribution of the response variable',
        '4. Identify predictor variable types',
        '5. Check for missing data patterns',
        '6. Assess sample size adequacy',
        '7. Identify potential clustering or nesting',
        '8. Check for outliers and influential points',
        '9. Assess multicollinearity among predictors',
        '10. Identify any special data features'
      ],
      outputFormat: 'JSON object with data assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['dataStructure', 'responseType', 'sampleSize'],
      properties: {
        dataStructure: { type: 'string', enum: ['cross-sectional', 'longitudinal', 'hierarchical', 'time-series', 'spatial'] },
        responseType: { type: 'string', enum: ['continuous', 'binary', 'count', 'ordinal', 'nominal', 'survival'] },
        responseDistribution: {
          type: 'object',
          properties: {
            family: { type: 'string' },
            shape: { type: 'string' },
            skewness: { type: 'string' }
          }
        },
        predictors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              distribution: { type: 'string' }
            }
          }
        },
        sampleSize: { type: 'number' },
        missingDataPattern: {
          type: 'object',
          properties: {
            proportion: { type: 'number' },
            mechanism: { type: 'string', enum: ['MCAR', 'MAR', 'MNAR', 'unknown'] }
          }
        },
        nestingStructure: {
          type: 'object',
          properties: {
            nested: { type: 'boolean' },
            levels: { type: 'number' },
            clusterSizes: { type: 'string' }
          }
        },
        specialFeatures: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'model-selection', 'data-assessment']
}));

export const assumptionCheckingTask = defineTask('assumption-checking', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Check Model Assumptions`,
  agent: {
    name: 'statistician',
    skills: ['r-statistical-computing', 'stata-statistical-analysis', 'monte-carlo-simulation'],
    prompt: {
      role: 'Statistical Modeling Expert',
      task: 'Check assumptions for candidate statistical models',
      context: {
        dataAssessment: args.dataAssessment,
        candidateModels: args.candidateModels,
        dataCharacteristics: args.dataCharacteristics
      },
      instructions: [
        '1. List key assumptions for each candidate model',
        '2. Assess normality assumptions where applicable',
        '3. Check homoscedasticity/homogeneity of variance',
        '4. Assess independence assumptions',
        '5. Check linearity assumptions',
        '6. Evaluate distributional assumptions',
        '7. Check for specification errors',
        '8. Assess random effects assumptions if applicable',
        '9. Rate assumption satisfaction for each model',
        '10. Recommend transformations or alternatives if needed'
      ],
      outputFormat: 'JSON object with assumption checking results'
    },
    outputSchema: {
      type: 'object',
      required: ['assumptionsByModel', 'overallAssessment'],
      properties: {
        assumptionsByModel: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              model: { type: 'string' },
              assumptions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    assumption: { type: 'string' },
                    satisfied: { type: 'string', enum: ['yes', 'partially', 'no', 'unknown'] },
                    evidence: { type: 'string' },
                    consequence: { type: 'string' }
                  }
                }
              },
              overallSuitability: { type: 'string', enum: ['excellent', 'good', 'fair', 'poor'] }
            }
          }
        },
        overallAssessment: { type: 'string' },
        recommendedTransformations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              variable: { type: 'string' },
              transformation: { type: 'string' },
              reason: { type: 'string' }
            }
          }
        },
        robustAlternatives: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'model-selection', 'assumptions']
}));

export const modelComparisonTask = defineTask('model-comparison', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Compare Candidate Models`,
  agent: {
    name: 'statistician',
    skills: ['r-statistical-computing', 'stata-statistical-analysis', 'stan-bayesian-modeling'],
    prompt: {
      role: 'Model Selection Specialist',
      task: 'Compare candidate models using statistical criteria',
      context: {
        dataAssessment: args.dataAssessment,
        assumptionChecking: args.assumptionChecking,
        candidateModels: args.candidateModels,
        researchQuestion: args.researchQuestion
      },
      instructions: [
        '1. Identify appropriate candidate models for the data structure',
        '2. Calculate AIC for each candidate model',
        '3. Calculate BIC for each candidate model',
        '4. Perform cross-validation comparison',
        '5. Calculate likelihood ratio tests where applicable',
        '6. Compare predictive performance',
        '7. Assess model parsimony',
        '8. Consider interpretability requirements',
        '9. Rank models by overall suitability',
        '10. Provide selection recommendation with confidence'
      ],
      outputFormat: 'JSON object with model comparison results'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendedModel', 'rankedModels', 'informationCriteria'],
      properties: {
        recommendedModel: { type: 'string' },
        recommendedModelType: { type: 'string' },
        modelSpecifications: {
          type: 'object',
          properties: {
            formula: { type: 'string' },
            family: { type: 'string' },
            link: { type: 'string' },
            randomEffects: { type: 'string' }
          }
        },
        selectionConfidence: { type: 'string', enum: ['high', 'medium', 'low'] },
        rankedModels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rank: { type: 'number' },
              model: { type: 'string' },
              aic: { type: 'number' },
              bic: { type: 'number' },
              deltaAIC: { type: 'number' },
              weight: { type: 'number' }
            }
          }
        },
        informationCriteria: {
          type: 'object',
          properties: {
            criterion: { type: 'string' },
            values: { type: 'object' },
            interpretation: { type: 'string' }
          }
        },
        crossValidationResults: {
          type: 'object',
          properties: {
            method: { type: 'string' },
            folds: { type: 'number' },
            results: { type: 'object' }
          }
        },
        likelihoodRatioTests: { type: 'array', items: { type: 'object' } },
        alternatives: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'model-selection', 'comparison']
}));

export const modelDiagnosticsTask = defineTask('model-diagnostics', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Validate Model Diagnostics`,
  agent: {
    name: 'statistician',
    skills: ['r-statistical-computing', 'stata-statistical-analysis', 'monte-carlo-simulation'],
    prompt: {
      role: 'Statistical Model Diagnostics Expert',
      task: 'Perform comprehensive diagnostics on top candidate models',
      context: {
        modelComparison: args.modelComparison,
        dataAssessment: args.dataAssessment,
        topModels: args.topModels
      },
      instructions: [
        '1. Check residual plots for patterns',
        '2. Assess residual normality',
        '3. Check for heteroscedasticity',
        '4. Identify influential observations (Cooks D, leverage)',
        '5. Check for multicollinearity (VIF)',
        '6. Assess goodness of fit statistics',
        '7. Perform specification tests',
        '8. Check random effects diagnostics if applicable',
        '9. Assess model stability',
        '10. Document any diagnostic concerns'
      ],
      outputFormat: 'JSON object with diagnostic results'
    },
    outputSchema: {
      type: 'object',
      required: ['diagnosticResults', 'assumptionsSatisfied', 'warnings'],
      properties: {
        diagnosticResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              model: { type: 'string' },
              diagnostic: { type: 'string' },
              result: { type: 'string' },
              severity: { type: 'string', enum: ['ok', 'warning', 'critical'] },
              recommendation: { type: 'string' }
            }
          }
        },
        assumptionsSatisfied: { type: 'boolean' },
        residualAnalysis: {
          type: 'object',
          properties: {
            normalityTest: { type: 'object' },
            homoscedasticityTest: { type: 'object' },
            independenceTest: { type: 'object' }
          }
        },
        influentialObservations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              observation: { type: 'string' },
              cooksD: { type: 'number' },
              leverage: { type: 'number' },
              recommendation: { type: 'string' }
            }
          }
        },
        goodnessOfFit: {
          type: 'object',
          properties: {
            rSquared: { type: 'number' },
            adjustedRSquared: { type: 'number' },
            rmse: { type: 'number' }
          }
        },
        warnings: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'model-selection', 'diagnostics']
}));

export const selectionDocumentationTask = defineTask('selection-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Document Selection Rationale`,
  agent: {
    name: 'statistician',
    skills: ['r-statistical-computing', 'latex-math-formatter', 'stata-statistical-analysis'],
    prompt: {
      role: 'Statistical Reporting Specialist',
      task: 'Document the model selection process and rationale',
      context: {
        dataAssessment: args.dataAssessment,
        assumptionChecking: args.assumptionChecking,
        modelComparison: args.modelComparison,
        modelDiagnostics: args.modelDiagnostics,
        researchQuestion: args.researchQuestion
      },
      instructions: [
        '1. Summarize the model selection process',
        '2. Document data characteristics influencing selection',
        '3. Explain why each alternative was considered/rejected',
        '4. Justify the final model choice',
        '5. Document any assumption violations and their handling',
        '6. Describe model specifications',
        '7. Note limitations and caveats',
        '8. Provide guidance for result interpretation',
        '9. Suggest sensitivity analyses',
        '10. Generate comprehensive selection rationale'
      ],
      outputFormat: 'JSON object with selection documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['rationale', 'selectionSummary'],
      properties: {
        rationale: { type: 'string' },
        selectionSummary: {
          type: 'object',
          properties: {
            dataCharacteristics: { type: 'array', items: { type: 'string' } },
            modelsConsidered: { type: 'array', items: { type: 'string' } },
            selectionCriteria: { type: 'array', items: { type: 'string' } },
            finalChoice: { type: 'string' },
            alternativesRejected: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  model: { type: 'string' },
                  reason: { type: 'string' }
                }
              }
            }
          }
        },
        limitations: { type: 'array', items: { type: 'string' } },
        interpretationGuidance: { type: 'array', items: { type: 'string' } },
        sensitivityAnalyses: { type: 'array', items: { type: 'string' } },
        reportingChecklist: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'model-selection', 'documentation']
}));
