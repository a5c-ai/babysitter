/**
 * @process specializations/data-science-ml/model-interpretability
 * @description Model Interpretability and Explainability Analysis - Comprehensive model interpretation pipeline with
 * global and local explanations, feature importance analysis, SHAP/LIME integration, decision path analysis,
 * counterfactual explanations, and bias detection with quality convergence gates.
 * @inputs { modelPath: string, modelType: string, dataPath: string, targetColumn: string, explainabilityMethods?: array, targetQuality?: number }
 * @outputs { success: boolean, interpretabilityScore: number, globalExplanations: object, localExplanations: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/data-science-ml/model-interpretability', {
 *   modelPath: 'models/churn-prediction-model.pkl',
 *   modelType: 'classification',
 *   dataPath: 'data/test-samples.csv',
 *   targetColumn: 'churn',
 *   explainabilityMethods: ['shap', 'lime', 'partial-dependence', 'counterfactual'],
 *   targetQuality: 85,
 *   maxIterations: 3
 * });
 *
 * @references
 * - SHAP (SHapley Additive exPlanations): https://shap.readthedocs.io/
 * - LIME (Local Interpretable Model-agnostic Explanations): https://github.com/marcotcr/lime
 * - InterpretML: https://interpret.ml/
 * - Alibi Explain: https://docs.seldon.io/projects/alibi/
 * - DALEX: https://dalex.drwhy.ai/
 * - What-If Tool: https://pair-code.github.io/what-if-tool/
 * - Captum (PyTorch): https://captum.ai/
 * - TensorFlow Model Analysis: https://www.tensorflow.org/tfx/guide/tfma
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    modelPath,
    modelType = 'classification',
    dataPath,
    targetColumn,
    explainabilityMethods = ['shap', 'lime', 'feature-importance', 'partial-dependence'],
    targetQuality = 85,
    maxIterations = 3,
    sampleSize = 100,
    backgroundSampleSize = 100,
    outputDir = 'model-interpretability-output',
    generateVisualizations = true,
    biasAnalysis = true,
    counterfactualAnalysis = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const globalExplanations = {};
  const localExplanations = {};

  ctx.log('info', `Starting Model Interpretability Analysis for model: ${modelPath}`);
  ctx.log('info', `Explainability methods: ${explainabilityMethods.join(', ')}`);

  // ============================================================================
  // PHASE 1: MODEL AND DATA VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Model and Data Validation');

  const validationResult = await ctx.task(modelDataValidationTask, {
    modelPath,
    modelType,
    dataPath,
    targetColumn,
    outputDir
  });

  if (!validationResult.success) {
    return {
      success: false,
      error: 'Model or data validation failed',
      details: validationResult,
      metadata: { processId: 'specializations/data-science-ml/model-interpretability', timestamp: startTime }
    };
  }

  artifacts.push(...validationResult.artifacts);

  // Breakpoint: Review validation results
  await ctx.breakpoint({
    question: `Model and data validated. Model type: ${validationResult.detectedModelType}, Features: ${validationResult.featureCount}, Samples: ${validationResult.sampleCount}. Proceed with interpretability analysis?`,
    title: 'Model/Data Validation Review',
    context: {
      runId: ctx.runId,
      validation: validationResult.summary,
      files: validationResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // PHASE 2: GLOBAL INTERPRETABILITY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Global Interpretability Analysis');

  // Task 2.1: Feature Importance Analysis
  const featureImportanceResult = await ctx.task(featureImportanceTask, {
    modelPath,
    modelType,
    dataPath,
    targetColumn,
    validationResult,
    outputDir
  });

  globalExplanations.featureImportance = featureImportanceResult.importance;
  artifacts.push(...featureImportanceResult.artifacts);

  // Task 2.2: Partial Dependence and ICE Plots (if requested)
  let partialDependenceResult = null;
  if (explainabilityMethods.includes('partial-dependence')) {
    ctx.log('info', 'Computing Partial Dependence and ICE plots');
    partialDependenceResult = await ctx.task(partialDependenceTask, {
      modelPath,
      modelType,
      dataPath,
      targetColumn,
      topFeatures: featureImportanceResult.topFeatures,
      validationResult,
      generateVisualizations,
      outputDir
    });

    globalExplanations.partialDependence = partialDependenceResult.partialDependence;
    artifacts.push(...partialDependenceResult.artifacts);
  }

  // Task 2.3: Global SHAP Analysis (if requested)
  let globalShapResult = null;
  if (explainabilityMethods.includes('shap')) {
    ctx.log('info', 'Computing global SHAP values');
    globalShapResult = await ctx.task(globalShapAnalysisTask, {
      modelPath,
      modelType,
      dataPath,
      targetColumn,
      validationResult,
      backgroundSampleSize,
      generateVisualizations,
      outputDir
    });

    globalExplanations.shap = globalShapResult.globalExplanations;
    artifacts.push(...globalShapResult.artifacts);
  }

  // Task 2.4: Model Behavior Summary
  const modelBehaviorResult = await ctx.task(modelBehaviorSummaryTask, {
    modelPath,
    modelType,
    dataPath,
    targetColumn,
    featureImportance: featureImportanceResult,
    partialDependence: partialDependenceResult,
    globalShap: globalShapResult,
    validationResult,
    outputDir
  });

  globalExplanations.behaviorSummary = modelBehaviorResult.summary;
  artifacts.push(...modelBehaviorResult.artifacts);

  // Breakpoint: Review global interpretability results
  await ctx.breakpoint({
    question: `Global interpretability analysis complete. Top features identified: ${featureImportanceResult.topFeatures.slice(0, 5).join(', ')}. Review results and approve to continue with local explanations?`,
    title: 'Global Interpretability Review',
    context: {
      runId: ctx.runId,
      globalExplanations,
      files: [
        { path: `${outputDir}/feature-importance.json`, format: 'json' },
        { path: `${outputDir}/global-explanations-report.md`, format: 'markdown' }
      ]
    }
  });

  // ============================================================================
  // PHASE 3: LOCAL INTERPRETABILITY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Local Interpretability Analysis');

  // Task 3.1: Sample Selection for Local Analysis
  const sampleSelectionResult = await ctx.task(sampleSelectionTask, {
    dataPath,
    modelPath,
    targetColumn,
    sampleSize,
    modelType,
    selectionStrategy: 'diverse', // diverse, representative, extreme, custom
    outputDir
  });

  artifacts.push(...sampleSelectionResult.artifacts);

  // Task 3.2: LIME Analysis (if requested)
  let limeResult = null;
  if (explainabilityMethods.includes('lime')) {
    ctx.log('info', 'Computing LIME explanations for sample instances');
    limeResult = await ctx.task(limeAnalysisTask, {
      modelPath,
      modelType,
      dataPath,
      targetColumn,
      samples: sampleSelectionResult.selectedSamples,
      validationResult,
      generateVisualizations,
      outputDir
    });

    localExplanations.lime = limeResult.explanations;
    artifacts.push(...limeResult.artifacts);
  }

  // Task 3.3: Local SHAP Analysis (if requested)
  let localShapResult = null;
  if (explainabilityMethods.includes('shap')) {
    ctx.log('info', 'Computing local SHAP values for sample instances');
    localShapResult = await ctx.task(localShapAnalysisTask, {
      modelPath,
      modelType,
      dataPath,
      targetColumn,
      samples: sampleSelectionResult.selectedSamples,
      validationResult,
      generateVisualizations,
      outputDir
    });

    localExplanations.shap = localShapResult.explanations;
    artifacts.push(...localShapResult.artifacts);
  }

  // Task 3.4: Decision Path Analysis
  const decisionPathResult = await ctx.task(decisionPathAnalysisTask, {
    modelPath,
    modelType,
    samples: sampleSelectionResult.selectedSamples,
    validationResult,
    generateVisualizations,
    outputDir
  });

  localExplanations.decisionPaths = decisionPathResult.decisionPaths;
  artifacts.push(...decisionPathResult.artifacts);

  // ============================================================================
  // PHASE 4: COUNTERFACTUAL EXPLANATIONS (if requested)
  // ============================================================================

  let counterfactualResult = null;
  if (counterfactualAnalysis) {
    ctx.log('info', 'Phase 4: Counterfactual Explanations Analysis');

    counterfactualResult = await ctx.task(counterfactualAnalysisTask, {
      modelPath,
      modelType,
      dataPath,
      targetColumn,
      samples: sampleSelectionResult.selectedSamples,
      validationResult,
      maxCounterfactuals: 5,
      generateVisualizations,
      outputDir
    });

    localExplanations.counterfactuals = counterfactualResult.counterfactuals;
    artifacts.push(...counterfactualResult.artifacts);
  }

  // ============================================================================
  // PHASE 5: BIAS AND FAIRNESS ANALYSIS (if requested)
  // ============================================================================

  let biasAnalysisResult = null;
  if (biasAnalysis) {
    ctx.log('info', 'Phase 5: Bias and Fairness Analysis');

    biasAnalysisResult = await ctx.task(biasAnalysisTask, {
      modelPath,
      modelType,
      dataPath,
      targetColumn,
      validationResult,
      featureImportance: featureImportanceResult,
      outputDir
    });

    globalExplanations.biasAnalysis = biasAnalysisResult.biasMetrics;
    artifacts.push(...biasAnalysisResult.artifacts);

    // Quality Gate: Check for bias concerns
    if (biasAnalysisResult.hasCriticalBias) {
      await ctx.breakpoint({
        question: `Critical bias detected: ${biasAnalysisResult.criticalBiases.join(', ')}. Review bias analysis and decide whether to proceed or address bias issues?`,
        title: 'Bias Detection Alert',
        context: {
          runId: ctx.runId,
          biasMetrics: biasAnalysisResult.biasMetrics,
          criticalBiases: biasAnalysisResult.criticalBiases,
          recommendations: biasAnalysisResult.recommendations,
          files: biasAnalysisResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
        }
      });
    }
  }

  // ============================================================================
  // PHASE 6: INTERPRETABILITY QUALITY ASSESSMENT WITH CONVERGENCE
  // ============================================================================

  ctx.log('info', 'Phase 6: Interpretability Quality Assessment');

  let iteration = 0;
  let currentQuality = 0;
  let converged = false;
  const iterationResults = [];

  while (iteration < maxIterations && !converged) {
    iteration++;
    ctx.log('info', `Quality assessment iteration ${iteration}/${maxIterations}`);

    // Task 6.1: Interpretability Quality Scoring
    const qualityAssessment = await ctx.task(interpretabilityQualityScoringTask, {
      modelPath,
      modelType,
      globalExplanations,
      localExplanations,
      featureImportance: featureImportanceResult,
      globalShap: globalShapResult,
      lime: limeResult,
      localShap: localShapResult,
      decisionPaths: decisionPathResult,
      counterfactuals: counterfactualResult,
      biasAnalysis: biasAnalysisResult,
      targetQuality,
      iteration,
      outputDir
    });

    currentQuality = qualityAssessment.overallScore;
    artifacts.push(...qualityAssessment.artifacts);

    // Store iteration results
    iterationResults.push({
      iteration,
      quality: currentQuality,
      assessment: qualityAssessment,
      feedback: qualityAssessment.recommendations
    });

    ctx.log('info', `Interpretability quality score: ${currentQuality}/${targetQuality}`);

    // Check convergence
    if (currentQuality >= targetQuality) {
      converged = true;
      ctx.log('info', `Quality target achieved: ${currentQuality}/${targetQuality}`);
    } else if (iteration < maxIterations) {
      ctx.log('warn', `Quality below target: ${currentQuality}/${targetQuality}`);

      // Task 6.2: Generate improvement recommendations
      const improvementPlan = await ctx.task(interpretabilityImprovementTask, {
        modelPath,
        modelType,
        currentQuality,
        targetQuality,
        qualityAssessment,
        globalExplanations,
        localExplanations,
        iteration,
        outputDir
      });

      artifacts.push(...improvementPlan.artifacts);

      // Breakpoint: Review quality assessment and improvement plan
      await ctx.breakpoint({
        question: `Iteration ${iteration} complete. Quality: ${currentQuality}/${targetQuality}. ${improvementPlan.summary}. Continue to iteration ${iteration + 1} for refinement?`,
        title: `Interpretability Quality Review - Iteration ${iteration}`,
        context: {
          runId: ctx.runId,
          currentQuality,
          targetQuality,
          converged,
          improvements: improvementPlan.recommendations,
          files: [
            { path: `${outputDir}/iteration-${iteration}-quality-assessment.json`, format: 'json' },
            { path: `${outputDir}/iteration-${iteration}-improvement-plan.md`, format: 'markdown' }
          ]
        }
      });

      // Apply improvements based on recommendations
      // This could involve re-running analyses with different parameters
      // For now, we'll continue to next iteration
    }
  }

  // ============================================================================
  // PHASE 7: COMPREHENSIVE INTERPRETABILITY REPORT
  // ============================================================================

  ctx.log('info', 'Phase 7: Generating Comprehensive Interpretability Report');

  const comprehensiveReport = await ctx.task(comprehensiveReportTask, {
    modelPath,
    modelType,
    dataPath,
    targetColumn,
    globalExplanations,
    localExplanations,
    featureImportance: featureImportanceResult,
    partialDependence: partialDependenceResult,
    globalShap: globalShapResult,
    lime: limeResult,
    localShap: localShapResult,
    decisionPaths: decisionPathResult,
    counterfactuals: counterfactualResult,
    biasAnalysis: biasAnalysisResult,
    qualityIterations: iterationResults,
    finalQuality: currentQuality,
    targetQuality,
    converged,
    outputDir
  });

  artifacts.push(...comprehensiveReport.artifacts);

  // ============================================================================
  // PHASE 8: STAKEHOLDER-SPECIFIC EXPLANATIONS
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating Stakeholder-Specific Explanations');

  const stakeholderReports = await ctx.task(stakeholderReportGenerationTask, {
    modelPath,
    modelType,
    globalExplanations,
    localExplanations,
    comprehensiveReport,
    stakeholders: ['executives', 'data-scientists', 'domain-experts', 'end-users', 'regulators'],
    outputDir
  });

  artifacts.push(...stakeholderReports.artifacts);

  // ============================================================================
  // PHASE 9: INTERACTIVE DASHBOARD GENERATION (if requested)
  // ============================================================================

  let dashboardResult = null;
  if (generateVisualizations) {
    ctx.log('info', 'Phase 9: Generating Interactive Interpretability Dashboard');

    dashboardResult = await ctx.task(interactiveDashboardTask, {
      modelPath,
      modelType,
      globalExplanations,
      localExplanations,
      featureImportance: featureImportanceResult,
      comprehensiveReport,
      outputDir
    });

    artifacts.push(...dashboardResult.artifacts);
  }

  // ============================================================================
  // PHASE 10: FINAL REVIEW AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Final Review and Validation');

  const finalReview = await ctx.task(finalInterpretabilityReviewTask, {
    modelPath,
    modelType,
    globalExplanations,
    localExplanations,
    comprehensiveReport,
    stakeholderReports,
    dashboard: dashboardResult,
    qualityIterations: iterationResults,
    finalQuality: currentQuality,
    targetQuality,
    converged,
    outputDir
  });

  artifacts.push(...finalReview.artifacts);

  // Final Breakpoint: Approval for interpretability analysis
  await ctx.breakpoint({
    question: `Model interpretability analysis complete. Quality: ${currentQuality}/${targetQuality}. ${finalReview.verdict}. Approve interpretability analysis results?`,
    title: 'Final Interpretability Analysis Approval',
    context: {
      runId: ctx.runId,
      summary: {
        modelPath,
        modelType,
        finalQuality: currentQuality,
        targetQuality,
        converged,
        iterations: iteration,
        methodsUsed: explainabilityMethods,
        biasDetected: biasAnalysisResult?.hasCriticalBias || false
      },
      verdict: finalReview.verdict,
      recommendation: finalReview.recommendation,
      files: [
        { path: comprehensiveReport.reportPath, format: 'markdown', label: 'Comprehensive Report' },
        { path: `${outputDir}/executive-summary.md`, format: 'markdown', label: 'Executive Summary' },
        { path: `${outputDir}/technical-report.md`, format: 'markdown', label: 'Technical Report' },
        ...(dashboardResult ? [{ path: dashboardResult.dashboardPath, format: 'html', label: 'Interactive Dashboard' }] : [])
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: converged,
    modelPath,
    modelType,
    interpretabilityScore: currentQuality,
    targetQuality,
    converged,
    iterations: iteration,
    globalExplanations,
    localExplanations,
    biasAnalysis: biasAnalysisResult ? {
      hasCriticalBias: biasAnalysisResult.hasCriticalBias,
      criticalBiases: biasAnalysisResult.criticalBiases,
      biasMetrics: biasAnalysisResult.biasMetrics
    } : null,
    qualityIterations: iterationResults,
    comprehensiveReport: {
      reportPath: comprehensiveReport.reportPath,
      executiveSummary: comprehensiveReport.executiveSummary,
      keyFindings: comprehensiveReport.keyFindings
    },
    stakeholderReports: stakeholderReports.reports,
    dashboard: dashboardResult ? {
      dashboardPath: dashboardResult.dashboardPath,
      interactiveUrl: dashboardResult.interactiveUrl
    } : null,
    finalReview: {
      verdict: finalReview.verdict,
      approved: finalReview.approved,
      recommendation: finalReview.recommendation,
      concerns: finalReview.concerns
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/data-science-ml/model-interpretability',
      timestamp: startTime,
      explainabilityMethods,
      sampleSize,
      backgroundSampleSize
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: Model and Data Validation
export const modelDataValidationTask = defineTask('model-data-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1: Model and Data Validation',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Engineer specializing in model validation and analysis',
      task: 'Validate model and data compatibility for interpretability analysis',
      context: {
        modelPath: args.modelPath,
        modelType: args.modelType,
        dataPath: args.dataPath,
        targetColumn: args.targetColumn,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Load the trained model from specified path',
        '2. Verify model type (classification, regression, multi-class, etc.)',
        '3. Load validation/test data from specified path',
        '4. Check data schema compatibility with model expectations',
        '5. Verify target column exists and has correct format',
        '6. Extract model metadata (framework, algorithm, version)',
        '7. Count features and samples in dataset',
        '8. Check for missing values or data quality issues',
        '9. Verify model can generate predictions on the data',
        '10. Test model prediction interface compatibility',
        '11. Extract feature names and types',
        '12. Generate validation report'
      ],
      outputFormat: 'JSON object with validation status and model/data metadata'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'detectedModelType', 'featureCount', 'sampleCount', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        detectedModelType: { type: 'string', description: 'Actual detected model type' },
        modelFramework: { type: 'string', description: 'ML framework (scikit-learn, TensorFlow, PyTorch, etc.)' },
        modelAlgorithm: { type: 'string', description: 'Model algorithm (RandomForest, XGBoost, Neural Network, etc.)' },
        featureCount: { type: 'number', description: 'Number of features' },
        featureNames: { type: 'array', items: { type: 'string' }, description: 'List of feature names' },
        featureTypes: { type: 'object', description: 'Feature types (numerical, categorical, etc.)' },
        sampleCount: { type: 'number', description: 'Number of samples in dataset' },
        targetClasses: { type: 'array', description: 'Target classes for classification' },
        modelMetadata: { type: 'object', description: 'Additional model metadata' },
        dataQuality: {
          type: 'object',
          properties: {
            missingValues: { type: 'number' },
            duplicates: { type: 'number' },
            qualityScore: { type: 'number' }
          }
        },
        compatibilityChecks: {
          type: 'object',
          properties: {
            dataSchemaMatch: { type: 'boolean' },
            predictionWorks: { type: 'boolean' },
            allFeaturesPresent: { type: 'boolean' }
          }
        },
        summary: { type: 'string', description: 'Validation summary' },
        artifacts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              type: { type: 'string' },
              format: { type: 'string' }
            }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'interpretability', 'validation']
}));

// Phase 2.1: Feature Importance Analysis
export const featureImportanceTask = defineTask('feature-importance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2.1: Feature Importance Analysis',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Scientist specializing in feature analysis',
      task: 'Compute feature importance using multiple methods',
      context: {
        modelPath: args.modelPath,
        modelType: args.modelType,
        dataPath: args.dataPath,
        targetColumn: args.targetColumn,
        validationResult: args.validationResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Load model and data',
        '2. Extract model-intrinsic feature importance (if available, e.g., tree-based models)',
        '3. Compute permutation feature importance',
        '4. Compute drop-column importance',
        '5. Rank features by importance across methods',
        '6. Identify top 10-20 most important features',
        '7. Identify low-importance or redundant features',
        '8. Generate feature importance visualizations (bar plots, sorted)',
        '9. Compute feature importance stability (variance across methods)',
        '10. Generate feature importance report with interpretations',
        '11. Save feature importance scores to JSON',
        '12. Return feature importance analysis'
      ],
      outputFormat: 'JSON object with feature importance rankings and analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['importance', 'topFeatures', 'artifacts'],
      properties: {
        importance: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              feature: { type: 'string' },
              intrinsicImportance: { type: 'number' },
              permutationImportance: { type: 'number' },
              dropColumnImportance: { type: 'number' },
              averageImportance: { type: 'number' },
              rank: { type: 'number' },
              interpretation: { type: 'string' }
            }
          }
        },
        topFeatures: { type: 'array', items: { type: 'string' }, description: 'Top 10-20 features' },
        lowImportanceFeatures: { type: 'array', items: { type: 'string' } },
        importanceStability: {
          type: 'object',
          properties: {
            averageVariance: { type: 'number' },
            stable: { type: 'boolean' }
          }
        },
        summary: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'interpretability', 'feature-importance']
}));

// Phase 2.2: Partial Dependence Analysis
export const partialDependenceTask = defineTask('partial-dependence', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2.2: Partial Dependence and ICE Analysis',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Interpretability Engineer',
      task: 'Compute Partial Dependence Plots (PDP) and Individual Conditional Expectation (ICE) plots',
      context: {
        modelPath: args.modelPath,
        modelType: args.modelType,
        dataPath: args.dataPath,
        targetColumn: args.targetColumn,
        topFeatures: args.topFeatures,
        validationResult: args.validationResult,
        generateVisualizations: args.generateVisualizations,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Load model and data',
        '2. For top important features (typically top 10-15):',
        '3.   - Compute 1D Partial Dependence Plot',
        '4.   - Compute Individual Conditional Expectation (ICE) plots',
        '5.   - Analyze marginal effect of feature on prediction',
        '6. For top feature pairs (2-3 pairs):',
        '7.   - Compute 2D Partial Dependence Plot',
        '8.   - Analyze interaction effects',
        '9. Generate PDP and ICE visualizations',
        '10. Identify monotonic relationships, thresholds, interactions',
        '11. Interpret each PDP in business context',
        '12. Generate partial dependence analysis report',
        '13. Save plots and analysis results'
      ],
      outputFormat: 'JSON object with partial dependence analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['partialDependence', 'artifacts'],
      properties: {
        partialDependence: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              feature: { type: 'string' },
              pdValues: { type: 'array' },
              iceValues: { type: 'array' },
              relationship: { type: 'string', enum: ['monotonic-increasing', 'monotonic-decreasing', 'non-monotonic', 'threshold', 'complex'] },
              interpretation: { type: 'string' },
              interactionsWith: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        interactionEffects: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              featurePair: { type: 'array', items: { type: 'string' } },
              interactionStrength: { type: 'number' },
              interpretation: { type: 'string' }
            }
          }
        },
        keyInsights: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'interpretability', 'partial-dependence']
}));

// Phase 2.3: Global SHAP Analysis
export const globalShapAnalysisTask = defineTask('global-shap-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2.3: Global SHAP Analysis',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Interpretability Specialist with SHAP expertise',
      task: 'Compute global SHAP values and generate summary visualizations',
      context: {
        modelPath: args.modelPath,
        modelType: args.modelType,
        dataPath: args.dataPath,
        targetColumn: args.targetColumn,
        validationResult: args.validationResult,
        backgroundSampleSize: args.backgroundSampleSize,
        generateVisualizations: args.generateVisualizations,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Load model and data',
        '2. Select appropriate SHAP explainer based on model type:',
        '   - TreeExplainer for tree-based models',
        '   - KernelExplainer for model-agnostic explanation',
        '   - DeepExplainer for neural networks',
        '   - LinearExplainer for linear models',
        '3. Sample background dataset for SHAP computation',
        '4. Compute SHAP values for all samples',
        '5. Generate SHAP summary plot (beeswarm/violin)',
        '6. Generate SHAP feature importance plot (mean absolute SHAP values)',
        '7. Generate SHAP dependence plots for top features',
        '8. Analyze feature interactions using SHAP interaction values',
        '9. Compute global SHAP statistics (mean, std, distribution)',
        '10. Identify features with highest SHAP importance',
        '11. Generate global SHAP interpretation report',
        '12. Save SHAP values and visualizations'
      ],
      outputFormat: 'JSON object with global SHAP analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['globalExplanations', 'artifacts'],
      properties: {
        globalExplanations: {
          type: 'object',
          properties: {
            featureImportance: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  feature: { type: 'string' },
                  meanAbsShap: { type: 'number' },
                  shapStd: { type: 'number' },
                  rank: { type: 'number' }
                }
              }
            },
            interactions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  feature1: { type: 'string' },
                  feature2: { type: 'string' },
                  interactionStrength: { type: 'number' }
                }
              }
            },
            explainerType: { type: 'string' },
            backgroundSize: { type: 'number' }
          }
        },
        keyInsights: { type: 'array', items: { type: 'string' } },
        interpretation: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'interpretability', 'shap', 'global']
}));

// Phase 2.4: Model Behavior Summary
export const modelBehaviorSummaryTask = defineTask('model-behavior-summary', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2.4: Model Behavior Summary',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Principal ML Engineer and Model Analyst',
      task: 'Synthesize global interpretability results into comprehensive model behavior summary',
      context: {
        modelPath: args.modelPath,
        modelType: args.modelType,
        dataPath: args.dataPath,
        targetColumn: args.targetColumn,
        featureImportance: args.featureImportance,
        partialDependence: args.partialDependence,
        globalShap: args.globalShap,
        validationResult: args.validationResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Synthesize feature importance across all methods',
        '2. Identify top 3-5 most critical features driving predictions',
        '3. Describe the nature of each feature\'s relationship with target (linear, non-linear, threshold)',
        '4. Identify and explain key feature interactions',
        '5. Summarize model decision-making patterns',
        '6. Highlight any surprising or counterintuitive behaviors',
        '7. Assess model complexity and interpretability',
        '8. Identify potential blind spots or weaknesses',
        '9. Compare results across different explanation methods for consistency',
        '10. Generate executive-level model behavior summary',
        '11. Provide actionable insights for stakeholders'
      ],
      outputFormat: 'JSON object with comprehensive model behavior summary'
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'criticalFeatures', 'decisionPatterns', 'artifacts'],
      properties: {
        summary: { type: 'string', description: 'High-level model behavior summary' },
        criticalFeatures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              feature: { type: 'string' },
              importance: { type: 'number' },
              relationship: { type: 'string' },
              businessInterpretation: { type: 'string' }
            }
          }
        },
        decisionPatterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string' },
              description: { type: 'string' },
              examples: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        featureInteractions: { type: 'array', items: { type: 'string' } },
        modelComplexity: { type: 'string', enum: ['simple', 'moderate', 'complex', 'very-complex'] },
        surprisingBehaviors: { type: 'array', items: { type: 'string' } },
        potentialWeaknesses: { type: 'array', items: { type: 'string' } },
        consistencyAcrossMethods: { type: 'boolean' },
        actionableInsights: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'interpretability', 'summary']
}));

// Phase 3.1: Sample Selection for Local Analysis
export const sampleSelectionTask = defineTask('sample-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3.1: Sample Selection for Local Analysis',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Scientist specializing in sampling strategies',
      task: 'Select representative samples for local interpretability analysis',
      context: {
        dataPath: args.dataPath,
        modelPath: args.modelPath,
        targetColumn: args.targetColumn,
        sampleSize: args.sampleSize,
        modelType: args.modelType,
        selectionStrategy: args.selectionStrategy,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Load data and model',
        '2. Generate predictions for all samples',
        '3. Apply sample selection strategy:',
        '   - diverse: Select samples covering full prediction space and feature space',
        '   - representative: Select typical samples from each class/prediction range',
        '   - extreme: Select edge cases (highest/lowest predictions, outliers)',
        '   - custom: Use user-specified criteria',
        '4. For classification: ensure balanced representation of classes',
        '5. For regression: cover full prediction range',
        '6. Include correct and incorrect predictions',
        '7. Include high-confidence and low-confidence predictions',
        '8. Ensure samples cover diverse feature value combinations',
        '9. Label each sample with its characteristics (e.g., "high-confidence correct", "edge case")',
        '10. Save selected samples with metadata',
        '11. Generate sample selection report'
      ],
      outputFormat: 'JSON object with selected samples and metadata'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedSamples', 'artifacts'],
      properties: {
        selectedSamples: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sampleId: { type: 'string' },
              features: { type: 'object' },
              trueLabel: {},
              predictedLabel: {},
              predictionProbability: { type: 'number' },
              sampleType: { type: 'string', enum: ['typical', 'edge-case', 'correct', 'incorrect', 'high-confidence', 'low-confidence'] },
              characteristics: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        selectionStrategy: { type: 'string' },
        sampleDistribution: {
          type: 'object',
          description: 'Distribution of sample types'
        },
        coverageMetrics: {
          type: 'object',
          properties: {
            predictionRangeCoverage: { type: 'number' },
            featureSpaceCoverage: { type: 'number' },
            classCoverage: { type: 'object' }
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
  labels: ['agent', 'interpretability', 'sampling']
}));

// Phase 3.2: LIME Analysis
export const limeAnalysisTask = defineTask('lime-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3.2: LIME Local Explanations',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Interpretability Engineer with LIME expertise',
      task: 'Generate LIME explanations for selected sample instances',
      context: {
        modelPath: args.modelPath,
        modelType: args.modelType,
        dataPath: args.dataPath,
        targetColumn: args.targetColumn,
        samples: args.samples,
        validationResult: args.validationResult,
        generateVisualizations: args.generateVisualizations,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Load model and configure LIME explainer',
        '2. For each selected sample:',
        '3.   - Generate LIME explanation',
        '4.   - Extract top contributing features (positive and negative)',
        '5.   - Visualize explanation (bar chart showing feature contributions)',
        '6.   - Interpret explanation in business context',
        '7. Aggregate LIME explanations to identify patterns:',
        '8.   - Most frequently important features across samples',
        '9.   - Consistency of feature importance direction',
        '10. Compare LIME explanations with global feature importance',
        '11. Assess explanation fidelity (local model R²)',
        '12. Generate LIME analysis report',
        '13. Save explanations and visualizations'
      ],
      outputFormat: 'JSON object with LIME explanations for all samples'
    },
    outputSchema: {
      type: 'object',
      required: ['explanations', 'artifacts'],
      properties: {
        explanations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sampleId: { type: 'string' },
              prediction: {},
              topContributions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    feature: { type: 'string' },
                    value: {},
                    contribution: { type: 'number' },
                    direction: { type: 'string', enum: ['positive', 'negative'] }
                  }
                }
              },
              localFidelity: { type: 'number', description: 'R² of local surrogate model' },
              interpretation: { type: 'string' }
            }
          }
        },
        aggregatePatterns: {
          type: 'object',
          properties: {
            frequentFeatures: { type: 'array', items: { type: 'string' } },
            consistencyScore: { type: 'number' }
          }
        },
        comparisonWithGlobal: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'interpretability', 'lime', 'local']
}));

// Phase 3.3: Local SHAP Analysis
export const localShapAnalysisTask = defineTask('local-shap-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3.3: Local SHAP Explanations',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Interpretability Specialist with SHAP expertise',
      task: 'Generate local SHAP explanations for selected sample instances',
      context: {
        modelPath: args.modelPath,
        modelType: args.modelType,
        dataPath: args.dataPath,
        targetColumn: args.targetColumn,
        samples: args.samples,
        validationResult: args.validationResult,
        generateVisualizations: args.generateVisualizations,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Load model and configure SHAP explainer',
        '2. For each selected sample:',
        '3.   - Compute SHAP values for the sample',
        '4.   - Generate force plot showing contribution of each feature',
        '5.   - Generate waterfall plot showing cumulative contribution',
        '6.   - Identify top positive and negative contributors',
        '7.   - Interpret explanation in business context',
        '8. Aggregate local SHAP values across samples:',
        '9.   - Compute consistency of feature importance',
        '10.  - Identify samples with similar explanation patterns',
        '11.  - Compare local SHAP with global SHAP',
        '12. Analyze prediction decomposition (base value + SHAP contributions)',
        '13. Generate local SHAP analysis report',
        '14. Save SHAP values and visualizations'
      ],
      outputFormat: 'JSON object with local SHAP explanations'
    },
    outputSchema: {
      type: 'object',
      required: ['explanations', 'artifacts'],
      properties: {
        explanations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sampleId: { type: 'string' },
              prediction: {},
              baseValue: { type: 'number', description: 'Average model output' },
              shapValues: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    feature: { type: 'string' },
                    featureValue: {},
                    shapValue: { type: 'number' },
                    rank: { type: 'number' }
                  }
                }
              },
              topContributors: {
                type: 'object',
                properties: {
                  positive: { type: 'array' },
                  negative: { type: 'array' }
                }
              },
              interpretation: { type: 'string' }
            }
          }
        },
        aggregateAnalysis: {
          type: 'object',
          properties: {
            consistentFeatures: { type: 'array', items: { type: 'string' } },
            variableFeatures: { type: 'array', items: { type: 'string' } },
            similarExplanationClusters: { type: 'array' }
          }
        },
        comparisonWithGlobalShap: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'interpretability', 'shap', 'local']
}));

// Phase 3.4: Decision Path Analysis
export const decisionPathAnalysisTask = defineTask('decision-path-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3.4: Decision Path Analysis',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Engineer specializing in tree-based model interpretation',
      task: 'Analyze decision paths for tree-based models',
      context: {
        modelPath: args.modelPath,
        modelType: args.modelType,
        samples: args.samples,
        validationResult: args.validationResult,
        generateVisualizations: args.generateVisualizations,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Check if model is tree-based (RandomForest, XGBoost, DecisionTree, etc.)',
        '2. If tree-based, for each selected sample:',
        '3.   - Extract decision path through tree(s)',
        '4.   - Identify decision nodes and split conditions',
        '5.   - Visualize decision path',
        '6.   - Generate human-readable decision rule',
        '7. For ensemble models (RandomForest, XGBoost):',
        '8.   - Aggregate decision paths across trees',
        '9.   - Identify most common decision rules',
        '10. For non-tree models:',
        '11.  - Extract linear coefficients (for linear models)',
        '12.  - Or indicate decision path not applicable',
        '13. Generate decision path report',
        '14. Save decision paths and visualizations'
      ],
      outputFormat: 'JSON object with decision path analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['decisionPaths', 'applicability', 'artifacts'],
      properties: {
        applicability: { type: 'boolean', description: 'Whether decision path analysis is applicable' },
        modelSupportsDecisionPaths: { type: 'boolean' },
        decisionPaths: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sampleId: { type: 'string' },
              prediction: {},
              decisionRule: { type: 'string', description: 'Human-readable decision rule' },
              pathNodes: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    feature: { type: 'string' },
                    threshold: { type: 'number' },
                    condition: { type: 'string' },
                    sampleValue: {}
                  }
                }
              },
              treeCount: { type: 'number', description: 'Number of trees contributing (for ensembles)' }
            }
          }
        },
        commonDecisionRules: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'interpretability', 'decision-path']
}));

// Phase 4: Counterfactual Analysis
export const counterfactualAnalysisTask = defineTask('counterfactual-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4: Counterfactual Explanations',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Interpretability Engineer specializing in counterfactual explanations',
      task: 'Generate counterfactual explanations showing minimal changes needed for different predictions',
      context: {
        modelPath: args.modelPath,
        modelType: args.modelType,
        dataPath: args.dataPath,
        targetColumn: args.targetColumn,
        samples: args.samples,
        validationResult: args.validationResult,
        maxCounterfactuals: args.maxCounterfactuals,
        generateVisualizations: args.generateVisualizations,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Load model and data',
        '2. For each selected sample (especially incorrectly predicted or interesting cases):',
        '3.   - Generate counterfactual examples (what-if scenarios)',
        '4.   - Find minimal feature changes needed to flip prediction',
        '5.   - For classification: find changes to predict different class',
        '6.   - For regression: find changes to reach target prediction value',
        '7.   - Generate multiple diverse counterfactuals (up to maxCounterfactuals)',
        '8.   - Ensure counterfactuals are realistic and actionable',
        '9.   - Compute distance/cost of each counterfactual',
        '10.  - Rank counterfactuals by feasibility and distance',
        '11.  - Visualize counterfactual changes (feature comparison)',
        '12.  - Interpret counterfactuals in business context',
        '13. Generate counterfactual analysis report',
        '14. Provide actionable insights (e.g., "To qualify for loan approval, increase income by X or decrease debt by Y")'
      ],
      outputFormat: 'JSON object with counterfactual explanations'
    },
    outputSchema: {
      type: 'object',
      required: ['counterfactuals', 'artifacts'],
      properties: {
        counterfactuals: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sampleId: { type: 'string' },
              originalPrediction: {},
              originalFeatures: { type: 'object' },
              counterfactualExamples: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    counterfactualPrediction: {},
                    modifiedFeatures: { type: 'object' },
                    featureChanges: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          feature: { type: 'string' },
                          originalValue: {},
                          newValue: {},
                          changeDescription: { type: 'string' }
                        }
                      }
                    },
                    distance: { type: 'number' },
                    feasibility: { type: 'string', enum: ['high', 'medium', 'low'] },
                    actionability: { type: 'string' }
                  }
                }
              },
              interpretation: { type: 'string' },
              actionableInsights: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        keyPatterns: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'interpretability', 'counterfactual']
}));

// Phase 5: Bias and Fairness Analysis
export const biasAnalysisTask = defineTask('bias-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5: Bias and Fairness Analysis',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Fairness Engineer and Bias Detection Specialist',
      task: 'Analyze model for bias and fairness issues across sensitive attributes',
      context: {
        modelPath: args.modelPath,
        modelType: args.modelType,
        dataPath: args.dataPath,
        targetColumn: args.targetColumn,
        validationResult: args.validationResult,
        featureImportance: args.featureImportance,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify potential sensitive/protected attributes (age, gender, race, etc.)',
        '2. For each sensitive attribute:',
        '3.   - Compute statistical parity difference',
        '4.   - Compute equal opportunity difference',
        '5.   - Compute predictive parity',
        '6.   - Compute disparate impact ratio',
        '7. Analyze feature importance for sensitive attributes',
        '8. Check for proxy features correlated with sensitive attributes',
        '9. Compute fairness metrics across subgroups',
        '10. Identify significant disparities (thresholds: SPD > 0.1, DI < 0.8)',
        '11. Flag critical bias concerns requiring immediate attention',
        '12. Analyze prediction distribution across demographic groups',
        '13. Generate bias mitigation recommendations',
        '14. Generate bias analysis report with visualizations',
        '15. Assess overall fairness score'
      ],
      outputFormat: 'JSON object with bias analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['hasCriticalBias', 'biasMetrics', 'artifacts'],
      properties: {
        hasCriticalBias: { type: 'boolean' },
        criticalBiases: { type: 'array', items: { type: 'string' } },
        biasMetrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sensitiveAttribute: { type: 'string' },
              statisticalParityDifference: { type: 'number' },
              equalOpportunityDifference: { type: 'number' },
              predictiveParity: { type: 'number' },
              disparateImpactRatio: { type: 'number' },
              fairnessViolation: { type: 'boolean' },
              severity: { type: 'string', enum: ['none', 'low', 'medium', 'high', 'critical'] }
            }
          }
        },
        proxyFeatures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              feature: { type: 'string' },
              correlationWithSensitive: { type: 'number' },
              concern: { type: 'string' }
            }
          }
        },
        groupPerformance: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              group: { type: 'string' },
              accuracy: { type: 'number' },
              precision: { type: 'number' },
              recall: { type: 'number' },
              predictionRate: { type: 'number' }
            }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        overallFairnessScore: { type: 'number', minimum: 0, maximum: 100 },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'interpretability', 'bias', 'fairness']
}));

// Phase 6.1: Interpretability Quality Scoring
export const interpretabilityQualityScoringTask = defineTask('interpretability-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6.1: Interpretability Quality Scoring (Iteration ${args.iteration})`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior ML Interpretability Expert and Quality Assessor',
      task: 'Assess interpretability analysis quality across multiple dimensions',
      context: {
        modelPath: args.modelPath,
        modelType: args.modelType,
        globalExplanations: args.globalExplanations,
        localExplanations: args.localExplanations,
        featureImportance: args.featureImportance,
        globalShap: args.globalShap,
        lime: args.lime,
        localShap: args.localShap,
        decisionPaths: args.decisionPaths,
        counterfactuals: args.counterfactuals,
        biasAnalysis: args.biasAnalysis,
        targetQuality: args.targetQuality,
        iteration: args.iteration,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Evaluate explanation completeness (weight: 25%):',
        '   - Are all major aspects covered (global, local, counterfactual)?',
        '   - Are multiple explanation methods used?',
        '   - Are explanations consistent across methods?',
        '2. Evaluate explanation quality (weight: 25%):',
        '   - Are explanations clear and understandable?',
        '   - Do visualizations effectively communicate insights?',
        '   - Are business interpretations provided?',
        '3. Evaluate technical rigor (weight: 20%):',
        '   - Are appropriate methods used for model type?',
        '   - Is sample selection representative?',
        '   - Are SHAP/LIME fidelity scores high?',
        '4. Evaluate actionability (weight: 15%):',
        '   - Can stakeholders act on the insights?',
        '   - Are counterfactuals realistic and feasible?',
        '   - Are recommendations specific and practical?',
        '5. Evaluate fairness assessment (weight: 15%):',
        '   - Is bias analysis comprehensive?',
        '   - Are fairness metrics computed correctly?',
        '   - Are mitigation strategies provided?',
        '6. Calculate weighted overall score (0-100)',
        '7. Identify gaps and areas for improvement',
        '8. Provide specific recommendations for next iteration',
        '9. Assess progress towards target quality'
      ],
      outputFormat: 'JSON object with quality assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'recommendations', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            completeness: { type: 'number' },
            quality: { type: 'number' },
            technicalRigor: { type: 'number' },
            actionability: { type: 'number' },
            fairness: { type: 'number' }
          }
        },
        strengths: { type: 'array', items: { type: 'string' } },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        consistencyCheck: {
          type: 'object',
          properties: {
            methodsConsistent: { type: 'boolean' },
            inconsistencies: { type: 'array', items: { type: 'string' } }
          }
        },
        progress: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'interpretability', 'quality-scoring', `iteration-${args.iteration}`]
}));

// Phase 6.2: Interpretability Improvement Task
export const interpretabilityImprovementTask = defineTask('interpretability-improvement', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6.2: Interpretability Improvement Plan (Iteration ${args.iteration})`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Interpretability Consultant',
      task: 'Generate specific improvement plan to address quality gaps',
      context: {
        modelPath: args.modelPath,
        modelType: args.modelType,
        currentQuality: args.currentQuality,
        targetQuality: args.targetQuality,
        qualityAssessment: args.qualityAssessment,
        globalExplanations: args.globalExplanations,
        localExplanations: args.localExplanations,
        iteration: args.iteration,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze quality gaps from assessment',
        '2. Prioritize gaps by impact on overall score',
        '3. For each gap, propose specific improvement actions:',
        '   - Add missing explanation methods',
        '   - Improve sample selection',
        '   - Enhance visualizations',
        '   - Add business context to interpretations',
        '   - Deepen technical analysis',
        '4. Estimate effort and impact of each improvement',
        '5. Recommend optimal improvement path for next iteration',
        '6. Generate actionable improvement plan',
        '7. Set specific targets for next iteration'
      ],
      outputFormat: 'JSON object with improvement plan'
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'recommendations', 'nextIterationTargets', 'artifacts'],
      properties: {
        summary: { type: 'string' },
        prioritizedGaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gap: { type: 'string' },
              currentScore: { type: 'number' },
              impact: { type: 'string', enum: ['high', 'medium', 'low'] },
              effort: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              rationale: { type: 'string' },
              expectedImprovement: { type: 'number' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        nextIterationTargets: {
          type: 'object',
          properties: {
            completeness: { type: 'number' },
            quality: { type: 'number' },
            technicalRigor: { type: 'number' },
            actionability: { type: 'number' },
            fairness: { type: 'number' },
            overall: { type: 'number' }
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
  labels: ['agent', 'interpretability', 'improvement', `iteration-${args.iteration}`]
}));

// Phase 7: Comprehensive Interpretability Report
export const comprehensiveReportTask = defineTask('comprehensive-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7: Comprehensive Interpretability Report',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Writer and ML Interpretability Expert',
      task: 'Generate comprehensive interpretability report synthesizing all analysis results',
      context: {
        modelPath: args.modelPath,
        modelType: args.modelType,
        dataPath: args.dataPath,
        targetColumn: args.targetColumn,
        globalExplanations: args.globalExplanations,
        localExplanations: args.localExplanations,
        featureImportance: args.featureImportance,
        partialDependence: args.partialDependence,
        globalShap: args.globalShap,
        lime: args.lime,
        localShap: args.localShap,
        decisionPaths: args.decisionPaths,
        counterfactuals: args.counterfactuals,
        biasAnalysis: args.biasAnalysis,
        qualityIterations: args.qualityIterations,
        finalQuality: args.finalQuality,
        targetQuality: args.targetQuality,
        converged: args.converged,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create comprehensive report with following sections:',
        '   - Executive Summary (1-2 pages)',
        '   - Model Overview (type, purpose, performance)',
        '   - Global Interpretability (feature importance, model behavior)',
        '   - Local Interpretability (sample explanations, patterns)',
        '   - Counterfactual Analysis (what-if scenarios)',
        '   - Bias and Fairness Assessment',
        '   - Quality Assessment (convergence, iterations)',
        '   - Key Findings and Insights',
        '   - Recommendations (model usage, improvements, monitoring)',
        '   - Limitations and Caveats',
        '   - Appendices (technical details, methodology)',
        '2. Use clear, professional language',
        '3. Include visualizations and examples',
        '4. Provide business context and interpretations',
        '5. Highlight actionable insights',
        '6. Format as professional Markdown document',
        '7. Generate executive summary (non-technical)',
        '8. Generate technical appendix (detailed methodology)'
      ],
      outputFormat: 'JSON object with report paths and key findings'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummary', 'keyFindings', 'artifacts'],
      properties: {
        reportPath: { type: 'string', description: 'Path to comprehensive report' },
        executiveSummary: { type: 'string', description: 'High-level executive summary' },
        keyFindings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              finding: { type: 'string' },
              importance: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              actionable: { type: 'boolean' }
            }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        limitations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'interpretability', 'reporting']
}));

// Phase 8: Stakeholder-Specific Report Generation
export const stakeholderReportGenerationTask = defineTask('stakeholder-reports', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 8: Stakeholder-Specific Explanations',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Communications Specialist',
      task: 'Generate tailored reports for different stakeholder groups',
      context: {
        modelPath: args.modelPath,
        modelType: args.modelType,
        globalExplanations: args.globalExplanations,
        localExplanations: args.localExplanations,
        comprehensiveReport: args.comprehensiveReport,
        stakeholders: args.stakeholders,
        outputDir: args.outputDir
      },
      instructions: [
        '1. For each stakeholder group, generate tailored report:',
        '2. Executives:',
        '   - High-level summary (1 page)',
        '   - Key business insights and risks',
        '   - ROI and impact assessment',
        '   - Strategic recommendations',
        '3. Data Scientists:',
        '   - Technical details and methodology',
        '   - Model architecture and parameters',
        '   - Detailed explanation analysis',
        '   - Areas for further investigation',
        '4. Domain Experts:',
        '   - Feature interpretations in domain context',
        '   - Model behavior patterns',
        '   - Validation against domain knowledge',
        '   - Edge cases and limitations',
        '5. End Users:',
        '   - Simple, non-technical explanations',
        '   - How model makes decisions',
        '   - What factors matter most',
        '   - When to trust/question predictions',
        '6. Regulators:',
        '   - Compliance and fairness documentation',
        '   - Bias analysis results',
        '   - Model governance and monitoring',
        '   - Audit trail and reproducibility',
        '7. Use appropriate language and depth for each audience',
        '8. Include relevant visualizations and examples'
      ],
      outputFormat: 'JSON object with stakeholder reports'
    },
    outputSchema: {
      type: 'object',
      required: ['reports', 'artifacts'],
      properties: {
        reports: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stakeholder: { type: 'string' },
              reportPath: { type: 'string' },
              summary: { type: 'string' },
              keyMessages: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'interpretability', 'stakeholder-reports']
}));

// Phase 9: Interactive Dashboard Generation
export const interactiveDashboardTask = defineTask('interactive-dashboard', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 9: Interactive Interpretability Dashboard',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Full Stack Developer with ML Visualization expertise',
      task: 'Generate interactive dashboard for exploring model interpretability',
      context: {
        modelPath: args.modelPath,
        modelType: args.modelType,
        globalExplanations: args.globalExplanations,
        localExplanations: args.localExplanations,
        featureImportance: args.featureImportance,
        comprehensiveReport: args.comprehensiveReport,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create interactive HTML dashboard with multiple sections:',
        '   - Overview page with key metrics and findings',
        '   - Global interpretability explorer (feature importance, PDP, SHAP)',
        '   - Local explanation browser (sample selector, LIME/SHAP viewer)',
        '   - Counterfactual explorer (interactive what-if tool)',
        '   - Bias analysis dashboard (fairness metrics by group)',
        '2. Use visualization libraries (Plotly, D3.js, or similar)',
        '3. Enable interactivity:',
        '   - Filter by feature, sample, prediction',
        '   - Drill-down from global to local',
        '   - Compare explanations side-by-side',
        '   - Export individual visualizations',
        '4. Ensure responsive design (works on desktop/tablet)',
        '5. Include tooltips and help text',
        '6. Generate standalone HTML file (embeds all data and scripts)',
        '7. Optionally host dashboard on local server',
        '8. Provide usage instructions'
      ],
      outputFormat: 'JSON object with dashboard details'
    },
    outputSchema: {
      type: 'object',
      required: ['dashboardPath', 'artifacts'],
      properties: {
        dashboardPath: { type: 'string', description: 'Path to dashboard HTML file' },
        interactiveUrl: { type: 'string', description: 'URL if hosted locally' },
        features: { type: 'array', items: { type: 'string' }, description: 'Dashboard features' },
        usageInstructions: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'interpretability', 'dashboard', 'visualization']
}));

// Phase 10: Final Interpretability Review
export const finalInterpretabilityReviewTask = defineTask('final-interpretability-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 10: Final Interpretability Review',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Principal ML Engineer and Model Governance Lead',
      task: 'Conduct final comprehensive review of interpretability analysis',
      context: {
        modelPath: args.modelPath,
        modelType: args.modelType,
        globalExplanations: args.globalExplanations,
        localExplanations: args.localExplanations,
        comprehensiveReport: args.comprehensiveReport,
        stakeholderReports: args.stakeholderReports,
        dashboard: args.dashboard,
        qualityIterations: args.qualityIterations,
        finalQuality: args.finalQuality,
        targetQuality: args.targetQuality,
        converged: args.converged,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Review quality convergence trajectory',
        '2. Assess whether target quality was achieved',
        '3. Evaluate completeness of interpretability analysis',
        '4. Review all generated artifacts (reports, dashboards, visualizations)',
        '5. Assess actionability of insights for stakeholders',
        '6. Check consistency of explanations across methods',
        '7. Evaluate bias and fairness assessment completeness',
        '8. Identify any remaining gaps or concerns',
        '9. Assess production readiness for interpretability artifacts',
        '10. Provide clear verdict (approved/needs-work/rejected)',
        '11. List strengths and concerns',
        '12. Recommend next steps (approval, refinement, re-analysis)',
        '13. Suggest ongoing monitoring and maintenance plan',
        '14. Generate final review report'
      ],
      outputFormat: 'JSON object with final review verdict'
    },
    outputSchema: {
      type: 'object',
      required: ['verdict', 'approved', 'confidence', 'recommendation', 'artifacts'],
      properties: {
        verdict: { type: 'string', description: 'Overall verdict on interpretability analysis' },
        approved: { type: 'boolean', description: 'Approved for production use' },
        confidence: { type: 'number', minimum: 0, maximum: 100 },
        strengths: { type: 'array', items: { type: 'string' } },
        concerns: { type: 'array', items: { type: 'string' } },
        gaps: { type: 'array', items: { type: 'string' } },
        blockingIssues: { type: 'array', items: { type: 'string' } },
        recommendation: { type: 'string' },
        nextSteps: { type: 'array', items: { type: 'string' } },
        monitoringPlan: {
          type: 'object',
          properties: {
            frequency: { type: 'string' },
            metrics: { type: 'array', items: { type: 'string' } },
            triggers: { type: 'array', items: { type: 'string' } }
          }
        },
        productionReadiness: { type: 'string', enum: ['ready', 'needs-work', 'not-ready'] },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'interpretability', 'final-review']
}));
