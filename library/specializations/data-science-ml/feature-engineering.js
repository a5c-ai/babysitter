/**
 * @process data-science-ml/feature-engineering
 * @description Feature engineering design and implementation with quality gates and validation
 * @inputs { dataPath: string, targetColumn: string, featureEngineering: object, targetQuality: number }
 * @outputs { success: boolean, qualityScore: number, features: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Feature Engineering Design and Implementation Process
 *
 * Demonstrates:
 * - Agent-based feature design planning
 * - Automated feature generation and transformation
 * - Feature validation (leakage detection, skew analysis)
 * - Feature selection and importance ranking
 * - Quality convergence with iterative refinement
 * - Parallel validation checks
 * - Training-serving skew prevention
 * - Breakpoints for human approval
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.dataPath - Path to dataset
 * @param {string} inputs.targetColumn - Target variable column name
 * @param {object} inputs.featureEngineering - Feature engineering specifications
 * @param {number} inputs.targetQuality - Target quality score (0-100)
 * @param {number} inputs.maxIterations - Maximum refinement iterations
 * @param {boolean} inputs.autoFeatureSelection - Enable automatic feature selection
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Process result
 */
export async function process(inputs, ctx) {
  const {
    dataPath,
    targetColumn,
    featureEngineering = {},
    targetQuality = 85,
    maxIterations = 3,
    autoFeatureSelection = true,
    outputDir = 'feature-engineering-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // ============================================================================
  // PHASE 1: FEATURE ENGINEERING DESIGN PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 1: Feature Engineering Design Planning');

  const featureDesignPlan = await ctx.task(featureDesignPlanningTask, {
    dataPath,
    targetColumn,
    featureEngineering,
    outputDir
  });

  artifacts.push(...featureDesignPlan.artifacts);

  // Breakpoint: Review feature engineering plan
  await ctx.breakpoint({
    question: `Review feature engineering plan for target "${targetColumn}". Approve to proceed with implementation?`,
    title: 'Feature Engineering Plan Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: `${outputDir}/feature-plan.md`, format: 'markdown' },
        { path: `${outputDir}/feature-specifications.json`, format: 'code', language: 'json' }
      ],
      summary: {
        totalFeaturesPlanned: featureDesignPlan.totalFeatures,
        featureTypes: featureDesignPlan.featureTypes,
        transformationsMapped: featureDesignPlan.transformationCount
      }
    }
  });

  // ============================================================================
  // PHASE 2: FEATURE IMPLEMENTATION WITH ITERATIVE REFINEMENT
  // ============================================================================

  ctx.log('info', 'Phase 2: Feature Implementation with Quality Convergence');

  let iteration = 0;
  let currentQuality = 0;
  let converged = false;
  const iterationResults = [];

  while (iteration < maxIterations && !converged) {
    iteration++;
    ctx.log('info', `Starting feature engineering iteration ${iteration}`);

    // Step 1: Implement features based on plan
    const featureImplementation = await ctx.task(featureImplementationTask, {
      dataPath,
      targetColumn,
      featureDesignPlan,
      iteration,
      previousFeedback: iteration > 1 ? iterationResults[iteration - 2].feedback : null,
      outputDir
    });

    artifacts.push(...featureImplementation.artifacts);

    // Step 2: Parallel validation checks
    ctx.log('info', `Running validation checks for iteration ${iteration}`);

    const [
      dataLeakageCheck,
      trainingServingSkewCheck,
      featureDistributionCheck,
      missingValueCheck
    ] = await ctx.parallel.all([
      () => ctx.task(dataLeakageDetectionTask, {
        dataPath,
        targetColumn,
        features: featureImplementation.features,
        outputDir
      }),
      () => ctx.task(trainingServingSkewCheckTask, {
        dataPath,
        features: featureImplementation.features,
        outputDir
      }),
      () => ctx.task(featureDistributionAnalysisTask, {
        dataPath,
        features: featureImplementation.features,
        outputDir
      }),
      () => ctx.task(missingValueValidationTask, {
        dataPath,
        features: featureImplementation.features,
        outputDir
      })
    ]);

    artifacts.push(
      ...dataLeakageCheck.artifacts,
      ...trainingServingSkewCheck.artifacts,
      ...featureDistributionCheck.artifacts,
      ...missingValueCheck.artifacts
    );

    // Step 3: Feature importance and selection
    let featureSelectionResult = null;
    if (autoFeatureSelection) {
      ctx.log('info', 'Running feature importance analysis and selection');
      featureSelectionResult = await ctx.task(featureSelectionTask, {
        dataPath,
        targetColumn,
        features: featureImplementation.features,
        outputDir
      });
      artifacts.push(...featureSelectionResult.artifacts);
    }

    // Step 4: Feature quality scoring
    ctx.log('info', 'Scoring feature engineering quality');
    const qualityScore = await ctx.task(featureQualityScoringTask, {
      dataPath,
      targetColumn,
      featureDesignPlan,
      featureImplementation,
      validationChecks: {
        dataLeakage: dataLeakageCheck,
        trainingServingSkew: trainingServingSkewCheck,
        distributions: featureDistributionCheck,
        missingValues: missingValueCheck
      },
      featureSelection: featureSelectionResult,
      iteration,
      targetQuality,
      outputDir
    });

    artifacts.push(...qualityScore.artifacts);
    currentQuality = qualityScore.overallScore;

    // Store iteration results
    iterationResults.push({
      iteration,
      quality: currentQuality,
      featureImplementation,
      validationChecks: {
        dataLeakage: dataLeakageCheck,
        trainingServingSkew: trainingServingSkewCheck,
        distributions: featureDistributionCheck,
        missingValues: missingValueCheck
      },
      featureSelection: featureSelectionResult,
      qualityScore,
      feedback: qualityScore.recommendations
    });

    // Check convergence
    if (currentQuality >= targetQuality) {
      converged = true;
      ctx.log('info', `Quality target achieved: ${currentQuality}/${targetQuality}`);
    } else {
      ctx.log('warn', `Quality below target: ${currentQuality}/${targetQuality}`);

      // Breakpoint: Review iteration results before continuing
      if (iteration < maxIterations) {
        await ctx.breakpoint({
          question: `Iteration ${iteration} complete. Quality: ${currentQuality}/${targetQuality}. Continue to iteration ${iteration + 1} for refinement?`,
          title: `Feature Engineering Iteration ${iteration} Review`,
          context: {
            runId: ctx.runId,
            files: [
              { path: `${outputDir}/iteration-${iteration}-report.md`, format: 'markdown' },
              { path: `${outputDir}/iteration-${iteration}-quality-score.json`, format: 'code', language: 'json' },
              { path: `${outputDir}/iteration-${iteration}-features.csv`, format: 'data' }
            ],
            summary: {
              iteration,
              currentQuality,
              targetQuality,
              converged,
              featuresCreated: featureImplementation.totalFeatures,
              issuesFound: qualityScore.criticalIssues?.length || 0
            }
          }
        });
      }
    }
  }

  // ============================================================================
  // PHASE 3: FINAL VALIDATION AND ARTIFACT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Final Validation and Artifact Generation');

  const finalIteration = iterationResults[iteration - 1];

  // Parallel final validation checks
  const [
    finalFeatureValidation,
    featureDocumentation,
    featureCodeGeneration
  ] = await ctx.parallel.all([
    () => ctx.task(finalFeatureValidationTask, {
      dataPath,
      targetColumn,
      features: finalIteration.featureImplementation.features,
      qualityScore: finalIteration.qualityScore,
      outputDir
    }),
    () => ctx.task(featureDocumentationTask, {
      featureDesignPlan,
      iterations: iterationResults,
      finalQuality: currentQuality,
      targetQuality,
      converged,
      outputDir
    }),
    () => ctx.task(featureCodeGenerationTask, {
      features: finalIteration.featureImplementation.features,
      language: inputs.targetLanguage || 'python',
      framework: inputs.targetFramework || 'pandas',
      outputDir
    })
  ]);

  artifacts.push(
    ...finalFeatureValidation.artifacts,
    ...featureDocumentation.artifacts,
    ...featureCodeGeneration.artifacts
  );

  // Agent-based final review
  const finalReview = await ctx.task(featureFinalReviewTask, {
    dataPath,
    targetColumn,
    featureDesignPlan,
    iterations: iterationResults,
    finalQuality: currentQuality,
    targetQuality,
    converged,
    finalValidation: finalFeatureValidation,
    outputDir
  });

  artifacts.push(...finalReview.artifacts);

  // Final breakpoint for approval
  await ctx.breakpoint({
    question: `Feature engineering complete. Quality: ${currentQuality}/${targetQuality}. ${finalReview.verdict}. Approve for production use?`,
    title: 'Final Feature Engineering Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: `${outputDir}/final-report.md`, format: 'markdown' },
        { path: `${outputDir}/feature-documentation.md`, format: 'markdown' },
        { path: `${outputDir}/feature-code.py`, format: 'code', language: 'python' },
        { path: `${outputDir}/quality-history.json`, format: 'code', language: 'json' }
      ],
      summary: {
        finalQuality: currentQuality,
        targetQuality,
        converged,
        iterations: iteration,
        totalFeatures: finalIteration.featureImplementation.totalFeatures,
        approved: finalReview.approved
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  // Return comprehensive results
  return {
    success: converged,
    qualityScore: currentQuality,
    targetQuality,
    converged,
    iterations: iteration,
    features: {
      total: finalIteration.featureImplementation.totalFeatures,
      selected: finalIteration.featureSelection?.selectedFeatures?.length || null,
      details: finalIteration.featureImplementation.features,
      importance: finalIteration.featureSelection?.importance || null
    },
    validation: {
      dataLeakage: finalIteration.validationChecks.dataLeakage.summary,
      trainingServingSkew: finalIteration.validationChecks.trainingServingSkew.summary,
      distributions: finalIteration.validationChecks.distributions.summary,
      missingValues: finalIteration.validationChecks.missingValues.summary
    },
    artifacts,
    iterationResults,
    finalReview,
    duration,
    metadata: {
      processId: 'data-science-ml/feature-engineering',
      timestamp: startTime,
      dataPath,
      targetColumn,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Feature Design Planning
export const featureDesignPlanningTask = defineTask('feature-design-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design feature engineering plan',
  description: 'Create comprehensive feature engineering strategy',

  agent: {
    name: 'feature-engineer-planner',
    prompt: {
      role: 'senior machine learning engineer and feature engineering specialist',
      task: 'Design comprehensive feature engineering strategy for ML model',
      context: args,
      instructions: [
        'Analyze dataset characteristics and target variable',
        'Identify opportunities for feature transformations (scaling, encoding, binning)',
        'Design derived features (aggregations, interactions, polynomial features)',
        'Plan time-series features if temporal data exists (lags, rolling windows, trends)',
        'Specify encoding strategies (one-hot, target, frequency, embeddings)',
        'Design dimensionality reduction approach if needed (PCA, feature selection)',
        'Plan domain-specific feature engineering based on problem context',
        'Identify data leakage risks and prevention strategies',
        'Design training-serving consistency checks',
        'Define feature validation criteria',
        'Generate feature engineering specification document'
      ],
      outputFormat: 'JSON with approach, featureTypes, transformations, derivations, encodings, validationChecks, totalFeatures, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['approach', 'featureTypes', 'transformations', 'totalFeatures', 'artifacts'],
      properties: {
        approach: { type: 'string' },
        featureTypes: {
          type: 'object',
          properties: {
            numerical: { type: 'array', items: { type: 'string' } },
            categorical: { type: 'array', items: { type: 'string' } },
            temporal: { type: 'array', items: { type: 'string' } },
            text: { type: 'array', items: { type: 'string' } },
            derived: { type: 'array', items: { type: 'string' } }
          }
        },
        transformations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              feature: { type: 'string' },
              transformationType: { type: 'string' },
              reason: { type: 'string' },
              parameters: { type: 'object' }
            }
          }
        },
        derivations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              formula: { type: 'string' },
              sourceFeatures: { type: 'array', items: { type: 'string' } },
              reason: { type: 'string' }
            }
          }
        },
        encodings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              feature: { type: 'string' },
              encodingType: { type: 'string' },
              parameters: { type: 'object' }
            }
          }
        },
        validationChecks: { type: 'array', items: { type: 'string' } },
        leakagePrevention: { type: 'array', items: { type: 'string' } },
        totalFeatures: { type: 'number' },
        transformationCount: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'feature-engineering', 'planning']
}));

// Task 2: Feature Implementation
export const featureImplementationTask = defineTask('feature-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement features (iteration ${args.iteration})`,
  description: 'Generate feature engineering code and apply transformations',

  agent: {
    name: 'feature-implementer',
    prompt: {
      role: 'machine learning engineer',
      task: 'Implement feature engineering transformations based on design plan',
      context: args,
      instructions: [
        'Load dataset from provided path',
        'Implement all transformations specified in feature design plan',
        'Apply scaling/normalization to numerical features',
        'Encode categorical features using specified strategies',
        'Generate derived features (aggregations, interactions, polynomials)',
        'Handle time-series features if applicable',
        'Implement missing value handling strategy',
        'Generate feature statistics and distributions',
        'Save transformed dataset and feature metadata',
        'Document all feature engineering steps taken',
        'If previous feedback provided, refine implementation accordingly'
      ],
      outputFormat: 'JSON with features, transformations, totalFeatures, featureMetadata, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['features', 'totalFeatures', 'featureMetadata', 'artifacts'],
      properties: {
        features: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              transformation: { type: 'string' },
              sourceFeatures: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        totalFeatures: { type: 'number' },
        featureMetadata: {
          type: 'object',
          properties: {
            numericalFeatures: { type: 'number' },
            categoricalFeatures: { type: 'number' },
            derivedFeatures: { type: 'number' },
            encodedFeatures: { type: 'number' }
          }
        },
        transformationsApplied: { type: 'array', items: { type: 'string' } },
        outputPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'feature-engineering', 'implementation', `iteration-${args.iteration}`]
}));

// Task 3: Data Leakage Detection
export const dataLeakageDetectionTask = defineTask('data-leakage-detection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Detect data leakage',
  description: 'Analyze features for potential data leakage',

  agent: {
    name: 'leakage-detector',
    prompt: {
      role: 'machine learning engineer specializing in model validation',
      task: 'Detect potential data leakage in engineered features',
      context: args,
      instructions: [
        'Analyze each feature for correlation with target variable',
        'Identify suspiciously high correlations (>0.95) indicating potential leakage',
        'Check for features that contain future information',
        'Validate temporal consistency for time-series features',
        'Check for target encoding that leaks information',
        'Identify features derived from target variable',
        'Flag features with perfect or near-perfect predictive power',
        'Recommend removal or modification of leaky features',
        'Generate leakage detection report'
      ],
      outputFormat: 'JSON with leakageSuspected, suspiciousFeatures, recommendations, summary, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['leakageSuspected', 'suspiciousFeatures', 'summary', 'artifacts'],
      properties: {
        leakageSuspected: { type: 'boolean' },
        suspiciousFeatures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              feature: { type: 'string' },
              reason: { type: 'string' },
              correlation: { type: 'number' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
            }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'feature-engineering', 'validation', 'leakage-detection']
}));

// Task 4: Training-Serving Skew Check
export const trainingServingSkewCheckTask = defineTask('training-serving-skew', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Check training-serving skew',
  description: 'Validate feature consistency between training and serving',

  agent: {
    name: 'skew-validator',
    prompt: {
      role: 'MLOps engineer',
      task: 'Validate features for training-serving consistency',
      context: args,
      instructions: [
        'Analyze feature computation logic for dependencies on training data',
        'Identify features that require global statistics (mean, std) from training set',
        'Check for features that depend on batch statistics',
        'Validate that all transformations can be computed at serving time',
        'Flag features requiring feature store or caching infrastructure',
        'Identify potential timestamp alignment issues',
        'Recommend strategies to prevent training-serving skew',
        'Generate skew prevention checklist'
      ],
      outputFormat: 'JSON with skewRisk, riskyFeatures, recommendations, summary, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['skewRisk', 'riskyFeatures', 'summary', 'artifacts'],
      properties: {
        skewRisk: { type: 'string', enum: ['none', 'low', 'medium', 'high'] },
        riskyFeatures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              feature: { type: 'string' },
              riskType: { type: 'string' },
              reason: { type: 'string' },
              mitigation: { type: 'string' }
            }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'feature-engineering', 'validation', 'skew-detection']
}));

// Task 5: Feature Distribution Analysis
export const featureDistributionAnalysisTask = defineTask('feature-distribution-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze feature distributions',
  description: 'Validate feature distributions and quality',

  agent: {
    name: 'distribution-analyst',
    prompt: {
      role: 'data scientist',
      task: 'Analyze distributions of engineered features',
      context: args,
      instructions: [
        'Compute distribution statistics for all features',
        'Check for features with zero or near-zero variance',
        'Identify highly skewed features (|skewness| > 2)',
        'Detect features with heavy tails (high kurtosis)',
        'Identify features with unusual distributions',
        'Flag features dominated by single value (>95%)',
        'Validate normalization and scaling effectiveness',
        'Generate distribution visualizations',
        'Recommend distribution transformations if needed'
      ],
      outputFormat: 'JSON with distributions, issuesFound, recommendations, summary, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['distributions', 'issuesFound', 'summary', 'artifacts'],
      properties: {
        distributions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              feature: { type: 'string' },
              mean: { type: 'number' },
              std: { type: 'number' },
              skewness: { type: 'number' },
              kurtosis: { type: 'number' },
              uniqueValues: { type: 'number' }
            }
          }
        },
        issuesFound: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              feature: { type: 'string' },
              issue: { type: 'string' },
              severity: { type: 'string' }
            }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'feature-engineering', 'validation', 'distributions']
}));

// Task 6: Missing Value Validation
export const missingValueValidationTask = defineTask('missing-value-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate missing value handling',
  description: 'Check missing values in engineered features',

  agent: {
    name: 'missing-value-validator',
    prompt: {
      role: 'data quality engineer',
      task: 'Validate missing value patterns in engineered features',
      context: args,
      instructions: [
        'Count missing values per engineered feature',
        'Compare missing rates before and after feature engineering',
        'Identify features that introduced new missing values',
        'Check if missing value imputation was applied correctly',
        'Validate missing value handling strategy consistency',
        'Flag features with unexpectedly high missing rates (>20%)',
        'Recommend missing value handling improvements',
        'Generate missing value report'
      ],
      outputFormat: 'JSON with missingValueSummary, problematicFeatures, recommendations, summary, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['missingValueSummary', 'problematicFeatures', 'summary', 'artifacts'],
      properties: {
        missingValueSummary: {
          type: 'object',
          properties: {
            totalFeatures: { type: 'number' },
            featuresWithMissing: { type: 'number' },
            averageMissingRate: { type: 'number' }
          }
        },
        problematicFeatures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              feature: { type: 'string' },
              missingCount: { type: 'number' },
              missingPercentage: { type: 'number' },
              concern: { type: 'string' }
            }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'feature-engineering', 'validation', 'missing-values']
}));

// Task 7: Feature Selection
export const featureSelectionTask = defineTask('feature-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Feature importance and selection',
  description: 'Rank and select most important features',

  agent: {
    name: 'feature-selector',
    prompt: {
      role: 'machine learning engineer',
      task: 'Perform feature importance analysis and selection',
      context: args,
      instructions: [
        'Train baseline model with all features',
        'Compute feature importance using multiple methods (permutation, SHAP, tree-based)',
        'Rank features by importance',
        'Identify redundant features (high correlation, low importance)',
        'Apply feature selection methods (recursive elimination, L1 regularization)',
        'Select optimal feature subset balancing performance and complexity',
        'Validate selected features on hold-out set',
        'Compare performance: all features vs selected features',
        'Generate feature importance visualizations',
        'Document feature selection rationale'
      ],
      outputFormat: 'JSON with importance, selectedFeatures, performanceComparison, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['importance', 'selectedFeatures', 'performanceComparison', 'artifacts'],
      properties: {
        importance: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              feature: { type: 'string' },
              importanceScore: { type: 'number' },
              rank: { type: 'number' }
            }
          }
        },
        selectedFeatures: { type: 'array', items: { type: 'string' } },
        removedFeatures: { type: 'array', items: { type: 'string' } },
        performanceComparison: {
          type: 'object',
          properties: {
            allFeatures: { type: 'object' },
            selectedFeatures: { type: 'object' },
            performanceDelta: { type: 'number' }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'feature-engineering', 'feature-selection', 'importance']
}));

// Task 8: Feature Quality Scoring
export const featureQualityScoringTask = defineTask('feature-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Score feature quality (iteration ${args.iteration})`,
  description: 'Comprehensive quality assessment of engineered features',

  agent: {
    name: 'feature-quality-scorer',
    prompt: {
      role: 'senior machine learning engineer and quality assurance specialist',
      task: 'Assess feature engineering quality across multiple dimensions',
      context: args,
      instructions: [
        'Evaluate feature validity: no leakage, proper handling (weight: 30%)',
        'Evaluate feature robustness: training-serving consistency (weight: 25%)',
        'Evaluate feature quality: distributions, missing values (weight: 20%)',
        'Evaluate feature utility: importance, predictive power (weight: 15%)',
        'Evaluate implementation quality: code quality, documentation (weight: 10%)',
        'Calculate weighted overall quality score (0-100)',
        'Identify critical issues requiring immediate attention',
        'Provide specific recommendations for improvement',
        'Assess progress towards target quality',
        'Generate quality scorecard'
      ],
      outputFormat: 'JSON with overallScore, componentScores, criticalIssues, recommendations, progress, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'recommendations', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            validity: { type: 'number' },
            robustness: { type: 'number' },
            quality: { type: 'number' },
            utility: { type: 'number' },
            implementation: { type: 'number' }
          }
        },
        criticalIssues: { type: 'array', items: { type: 'string' } },
        warnings: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        progress: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'feature-engineering', 'quality-scoring', `iteration-${args.iteration}`]
}));

// Task 9: Final Feature Validation
export const finalFeatureValidationTask = defineTask('final-feature-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final feature validation',
  description: 'Comprehensive validation of final feature set',

  agent: {
    name: 'feature-validator',
    prompt: {
      role: 'machine learning engineer',
      task: 'Perform final comprehensive validation of feature engineering',
      context: args,
      instructions: [
        'Validate all features meet quality criteria',
        'Verify no data leakage exists',
        'Confirm training-serving consistency',
        'Validate feature distributions are appropriate',
        'Check feature documentation completeness',
        'Verify reproducibility of feature generation',
        'Validate backward compatibility if versioning features',
        'Run end-to-end feature pipeline test',
        'Generate validation certificate',
        'Document any remaining limitations or warnings'
      ],
      outputFormat: 'JSON with validated, issues, limitations, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['validated', 'issues', 'artifacts'],
      properties: {
        validated: { type: 'boolean' },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              issue: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        limitations: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'feature-engineering', 'validation', 'final']
}));

// Task 10: Feature Documentation
export const featureDocumentationTask = defineTask('feature-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate feature documentation',
  description: 'Create comprehensive feature engineering documentation',

  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'technical writer and machine learning engineer',
      task: 'Generate comprehensive feature engineering documentation',
      context: args,
      instructions: [
        'Create feature catalog with descriptions, types, sources',
        'Document transformation logic for each feature',
        'Explain derived feature formulas and rationale',
        'Document encoding strategies and parameters',
        'Include feature importance rankings',
        'Document validation checks performed',
        'Explain quality improvement iterations',
        'Include usage examples and code snippets',
        'Document known limitations and edge cases',
        'Generate model card section for features',
        'Format as professional Markdown documentation'
      ],
      outputFormat: 'JSON with documentationPath, featureCatalog, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentationPath', 'featureCatalog', 'artifacts'],
      properties: {
        documentationPath: { type: 'string' },
        featureCatalog: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              type: { type: 'string' },
              transformation: { type: 'string' },
              importance: { type: 'number' }
            }
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

  labels: ['agent', 'feature-engineering', 'documentation']
}));

// Task 11: Feature Code Generation
export const featureCodeGenerationTask = defineTask('feature-code-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate production feature code',
  description: 'Generate production-ready feature engineering code',

  agent: {
    name: 'code-generator',
    prompt: {
      role: 'software engineer',
      task: 'Generate production-ready feature engineering code',
      context: args,
      instructions: [
        'Generate clean, documented code for all feature transformations',
        'Support both training and serving modes',
        'Include proper error handling and validation',
        'Generate unit tests for feature transformations',
        'Include type hints and documentation strings',
        'Ensure code is modular and reusable',
        'Generate pipeline configuration files',
        'Include example usage code',
        'Follow best practices for target language/framework',
        'Optimize for performance where applicable'
      ],
      outputFormat: 'JSON with codeFiles, testFiles, configFiles, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['codeFiles', 'artifacts'],
      properties: {
        codeFiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              language: { type: 'string' },
              purpose: { type: 'string' }
            }
          }
        },
        testFiles: { type: 'array', items: { type: 'string' } },
        configFiles: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'feature-engineering', 'code-generation']
}));

// Task 12: Feature Final Review
export const featureFinalReviewTask = defineTask('feature-final-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final feature engineering review',
  description: 'Comprehensive final review with production readiness assessment',

  agent: {
    name: 'feature-reviewer',
    prompt: {
      role: 'principal machine learning engineer',
      task: 'Conduct final comprehensive review of feature engineering',
      context: args,
      instructions: [
        'Review quality convergence trajectory across iterations',
        'Assess final quality against target',
        'Evaluate feature engineering completeness',
        'Review all validation results',
        'Assess production readiness',
        'Identify any blocking issues',
        'Evaluate documentation quality',
        'Assess maintainability and reproducibility',
        'Provide production deployment recommendation',
        'Suggest follow-up tasks or improvements'
      ],
      outputFormat: 'JSON with verdict, approved, confidence, strengths, concerns, blockingIssues, followUpTasks, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['verdict', 'approved', 'confidence', 'artifacts'],
      properties: {
        verdict: { type: 'string' },
        approved: { type: 'boolean' },
        confidence: { type: 'number', minimum: 0, maximum: 100 },
        strengths: { type: 'array', items: { type: 'string' } },
        concerns: { type: 'array', items: { type: 'string' } },
        blockingIssues: { type: 'array', items: { type: 'string' } },
        followUpTasks: { type: 'array', items: { type: 'string' } },
        productionReadiness: { type: 'string', enum: ['ready', 'needs-work', 'not-ready'] },
        artifacts: { type: 'array' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'feature-engineering', 'final-review']
}));
