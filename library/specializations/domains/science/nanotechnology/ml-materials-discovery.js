/**
 * @process specializations/domains/science/nanotechnology/ml-materials-discovery
 * @description Machine Learning Materials Discovery Pipeline - Implement ML-accelerated materials
 * discovery workflows including training data curation, feature engineering for materials, model
 * training with cross-validation, high-throughput virtual screening, and experimental validation
 * prioritization with iterative active learning loops.
 * @inputs { discoveryGoal: object, candidateSpace: object, existingData?: object, targetProperty: string }
 * @outputs { success: boolean, predictiveModel: object, candidateRankings: array, validationPlan: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/nanotechnology/ml-materials-discovery', {
 *   discoveryGoal: { target: 'high-efficiency-photocatalyst', property: 'bandgap', optimalRange: [1.5, 2.5] },
 *   candidateSpace: { elements: ['Ti', 'Zn', 'Sn'], compositions: 'ternary-oxides', sizeRange: [2, 10] },
 *   existingData: { source: 'materials-project', entries: 5000 },
 *   targetProperty: 'photocatalytic-efficiency'
 * });
 *
 * @references
 * - Materials Project: https://materialsproject.org/
 * - NanoHUB Simulation Tools: https://nanohub.org/resources/tools
 * - ASE (Atomic Simulation Environment): https://wiki.fysik.dtu.dk/ase/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    discoveryGoal,
    candidateSpace,
    existingData = null,
    targetProperty,
    activeLearningCycles = 3,
    validationBudget = 10
  } = inputs;

  // Phase 1: Data Curation
  const dataCuration = await ctx.task(dataCurationTask, {
    discoveryGoal,
    candidateSpace,
    existingData,
    targetProperty
  });

  // Quality Gate: Must have sufficient data
  if (!dataCuration.sufficient) {
    return {
      success: false,
      error: 'Insufficient training data for ML model',
      phase: 'data-curation',
      recommendations: dataCuration.recommendations
    };
  }

  // Breakpoint: Review curated data
  await ctx.breakpoint({
    question: `Data curation complete. ${dataCuration.dataPoints} data points from ${dataCuration.sources.length} sources. ${dataCuration.propertyCompleteness}% property completeness. Proceed?`,
    title: 'Training Data Review',
    context: {
      runId: ctx.runId,
      dataCuration,
      files: [{
        path: 'artifacts/curated-data.json',
        format: 'json',
        content: dataCuration.summary
      }]
    }
  });

  // Phase 2: Feature Engineering
  const featureEngineering = await ctx.task(featureEngineeringTask, {
    dataCuration,
    candidateSpace,
    targetProperty
  });

  // Phase 3: Model Selection and Training
  const modelTraining = await ctx.task(modelTrainingTask, {
    featureEngineering,
    dataCuration,
    targetProperty
  });

  // Breakpoint: Review model performance
  await ctx.breakpoint({
    question: `Model training complete. Best model: ${modelTraining.bestModel.type}. CV Score: ${modelTraining.bestModel.cvScore.toFixed(3)}. Test R2: ${modelTraining.bestModel.testScore.toFixed(3)}. Approve?`,
    title: 'Model Performance Review',
    context: {
      runId: ctx.runId,
      modelComparison: modelTraining.modelComparison,
      featureImportance: modelTraining.featureImportance
    }
  });

  // Phase 4: Model Validation
  const modelValidation = await ctx.task(modelValidationTask, {
    modelTraining,
    featureEngineering,
    dataCuration
  });

  // Quality Gate: Model must pass validation
  if (!modelValidation.passed) {
    await ctx.breakpoint({
      question: `Model validation concerns: ${modelValidation.concerns.join(', ')}. Proceed with caution?`,
      title: 'Model Validation Warning',
      context: {
        runId: ctx.runId,
        modelValidation,
        recommendations: modelValidation.recommendations
      }
    });
  }

  // Phase 5: Virtual Screening
  const virtualScreening = await ctx.task(virtualScreeningTask, {
    modelTraining,
    featureEngineering,
    candidateSpace,
    discoveryGoal
  });

  // Phase 6: Active Learning Loop
  let activeLearningCycle = 0;
  const activeLearningHistory = [];
  let currentModel = modelTraining.bestModel;
  let currentRankings = virtualScreening.candidateRankings;

  while (activeLearningCycle < activeLearningCycles) {
    activeLearningCycle++;

    // Select candidates for validation
    const candidateSelection = await ctx.task(candidateSelectionTask, {
      currentRankings,
      currentModel,
      discoveryGoal,
      validationBudget: Math.floor(validationBudget / activeLearningCycles),
      cycle: activeLearningCycle
    });

    // Breakpoint: Review selected candidates
    await ctx.breakpoint({
      question: `Active learning cycle ${activeLearningCycle}: ${candidateSelection.selectedCandidates.length} candidates selected for validation. Approve selections?`,
      title: 'Candidate Selection Review',
      context: {
        runId: ctx.runId,
        selectedCandidates: candidateSelection.selectedCandidates,
        selectionRationale: candidateSelection.rationale
      }
    });

    // Simulate validation (in practice, this triggers experiments)
    const validationResults = await ctx.task(validationSimulationTask, {
      selectedCandidates: candidateSelection.selectedCandidates,
      discoveryGoal,
      targetProperty
    });

    // Model Update
    const modelUpdate = await ctx.task(modelUpdateTask, {
      currentModel,
      validationResults,
      featureEngineering,
      cycle: activeLearningCycle
    });

    currentModel = modelUpdate.updatedModel;

    // Re-rank candidates
    const reranking = await ctx.task(rerankingTask, {
      updatedModel: currentModel,
      candidateSpace,
      featureEngineering,
      discoveryGoal
    });

    currentRankings = reranking.updatedRankings;

    activeLearningHistory.push({
      cycle: activeLearningCycle,
      selectedCandidates: candidateSelection.selectedCandidates,
      validationResults,
      modelUpdate,
      topCandidates: currentRankings.slice(0, 10)
    });
  }

  // Phase 7: Final Candidate Analysis
  const finalAnalysis = await ctx.task(finalAnalysisTask, {
    currentRankings,
    activeLearningHistory,
    discoveryGoal,
    targetProperty
  });

  // Phase 8: Validation Plan
  const validationPlan = await ctx.task(validationPlanTask, {
    finalAnalysis,
    discoveryGoal,
    targetProperty,
    validationBudget
  });

  // Phase 9: Uncertainty Quantification
  const uncertaintyAnalysis = await ctx.task(uncertaintyAnalysisTask, {
    currentModel,
    currentRankings,
    featureEngineering
  });

  // Phase 10: Report Generation
  const discoveryReport = await ctx.task(reportGenerationTask, {
    dataCuration,
    modelTraining,
    modelValidation,
    virtualScreening,
    activeLearningHistory,
    finalAnalysis,
    validationPlan,
    uncertaintyAnalysis,
    discoveryGoal
  });

  // Final Breakpoint: Results approval
  await ctx.breakpoint({
    question: `ML materials discovery complete. ${finalAnalysis.topCandidates.length} top candidates identified. Best predicted ${targetProperty}: ${finalAnalysis.bestPrediction}. Approve results?`,
    title: 'ML Discovery Results Approval',
    context: {
      runId: ctx.runId,
      topCandidates: finalAnalysis.topCandidates.slice(0, 5),
      validationPlan,
      files: [
        { path: 'artifacts/discovery-report.md', format: 'markdown', content: discoveryReport.markdown },
        { path: 'artifacts/candidates.json', format: 'json', content: currentRankings }
      ]
    }
  });

  return {
    success: true,
    predictiveModel: {
      type: currentModel.type,
      performance: currentModel.testScore,
      featureImportance: modelTraining.featureImportance
    },
    candidateRankings: currentRankings,
    validationPlan,
    uncertaintyAnalysis,
    activeLearningHistory,
    report: discoveryReport,
    metadata: {
      processId: 'specializations/domains/science/nanotechnology/ml-materials-discovery',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const dataCurationTask = defineTask('data-curation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Curate training data',
  agent: {
    name: 'data-curator',
    prompt: {
      role: 'Materials Data Curation Specialist',
      task: 'Curate and clean training data for ML model',
      context: args,
      instructions: [
        '1. Identify relevant data sources (databases, literature)',
        '2. Extract data for target property',
        '3. Clean and standardize data format',
        '4. Handle missing values appropriately',
        '5. Remove duplicates and outliers',
        '6. Verify data quality and reliability',
        '7. Document data provenance',
        '8. Assess data coverage of candidate space',
        '9. Calculate property statistics',
        '10. Prepare train/validation/test splits'
      ],
      outputFormat: 'JSON object with curated data'
    },
    outputSchema: {
      type: 'object',
      required: ['sufficient', 'dataPoints', 'propertyCompleteness'],
      properties: {
        sufficient: { type: 'boolean' },
        dataPoints: { type: 'number' },
        sources: { type: 'array' },
        propertyCompleteness: { type: 'number' },
        propertyStatistics: { type: 'object' },
        coverage: { type: 'object' },
        dataSplits: { type: 'object' },
        summary: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'ml', 'data-curation']
}));

export const featureEngineeringTask = defineTask('feature-engineering', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Engineer features for materials',
  agent: {
    name: 'feature-engineer',
    prompt: {
      role: 'Materials Feature Engineering Specialist',
      task: 'Engineer descriptors and features for nanomaterials',
      context: args,
      instructions: [
        '1. Generate compositional features (elemental fractions)',
        '2. Calculate structural descriptors',
        '3. Generate electronic structure features (if available)',
        '4. Create size-dependent features for nanomaterials',
        '5. Generate surface/bulk ratio features',
        '6. Create physics-informed features',
        '7. Apply feature normalization and scaling',
        '8. Perform feature selection if needed',
        '9. Handle categorical features (crystal system, etc.)',
        '10. Document all feature transformations'
      ],
      outputFormat: 'JSON object with engineered features'
    },
    outputSchema: {
      type: 'object',
      required: ['featureMatrix', 'featureNames', 'transformations'],
      properties: {
        featureMatrix: { type: 'object' },
        featureNames: { type: 'array', items: { type: 'string' } },
        featureCount: { type: 'number' },
        compositionalFeatures: { type: 'array' },
        structuralFeatures: { type: 'array' },
        sizeFeatures: { type: 'array' },
        transformations: { type: 'array' },
        featureSelection: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'ml', 'features']
}));

export const modelTrainingTask = defineTask('model-training', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Train ML models',
  agent: {
    name: 'ml-trainer',
    prompt: {
      role: 'Machine Learning Model Training Specialist',
      task: 'Train and compare ML models for property prediction',
      context: args,
      instructions: [
        '1. Select candidate model architectures',
        '2. Train linear baseline model',
        '3. Train ensemble models (Random Forest, Gradient Boosting)',
        '4. Train neural network models if data sufficient',
        '5. Train Gaussian Process for uncertainty',
        '6. Perform hyperparameter optimization',
        '7. Execute cross-validation',
        '8. Compare model performance',
        '9. Extract feature importance',
        '10. Select best model'
      ],
      outputFormat: 'JSON object with trained models'
    },
    outputSchema: {
      type: 'object',
      required: ['bestModel', 'modelComparison', 'featureImportance'],
      properties: {
        bestModel: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            cvScore: { type: 'number' },
            testScore: { type: 'number' }
          }
        },
        modelComparison: { type: 'array' },
        hyperparameters: { type: 'object' },
        featureImportance: { type: 'object' },
        crossValidationResults: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'ml', 'training']
}));

export const modelValidationTask = defineTask('model-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate ML model',
  agent: {
    name: 'model-validator',
    prompt: {
      role: 'ML Model Validation Specialist',
      task: 'Rigorously validate ML model for materials discovery',
      context: args,
      instructions: [
        '1. Evaluate on held-out test set',
        '2. Perform residual analysis',
        '3. Check for overfitting',
        '4. Assess extrapolation capability',
        '5. Validate on chemically distinct materials',
        '6. Check physical reasonableness of predictions',
        '7. Assess prediction uncertainty calibration',
        '8. Test sensitivity to input perturbations',
        '9. Document validation results',
        '10. Identify model limitations'
      ],
      outputFormat: 'JSON object with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'testPerformance', 'concerns'],
      properties: {
        passed: { type: 'boolean' },
        testPerformance: { type: 'object' },
        residualAnalysis: { type: 'object' },
        overfittingAssessment: { type: 'object' },
        extrapolationTest: { type: 'object' },
        uncertaintyCalibration: { type: 'object' },
        concerns: { type: 'array', items: { type: 'string' } },
        limitations: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'ml', 'validation']
}));

export const virtualScreeningTask = defineTask('virtual-screening', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Screen candidate materials',
  agent: {
    name: 'screening-specialist',
    prompt: {
      role: 'High-Throughput Virtual Screening Specialist',
      task: 'Screen candidate space for promising materials',
      context: args,
      instructions: [
        '1. Generate candidate material representations',
        '2. Calculate features for all candidates',
        '3. Apply trained model for predictions',
        '4. Calculate prediction uncertainties',
        '5. Rank candidates by predicted property',
        '6. Apply physics-based filters',
        '7. Check for synthesizability constraints',
        '8. Filter for stability constraints',
        '9. Generate ranked candidate list',
        '10. Document screening results'
      ],
      outputFormat: 'JSON object with screening results'
    },
    outputSchema: {
      type: 'object',
      required: ['candidateRankings', 'screenedCount', 'topCandidates'],
      properties: {
        candidateRankings: { type: 'array' },
        screenedCount: { type: 'number' },
        topCandidates: { type: 'array' },
        predictionDistribution: { type: 'object' },
        filteredOut: { type: 'object' },
        synthesizabilityFilter: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'ml', 'screening']
}));

export const candidateSelectionTask = defineTask('candidate-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Select candidates for validation (cycle ${args.cycle})`,
  agent: {
    name: 'active-learning-specialist',
    prompt: {
      role: 'Active Learning Candidate Selection Specialist',
      task: 'Select optimal candidates for experimental validation',
      context: args,
      instructions: [
        '1. Balance exploitation (high predicted value) vs exploration (high uncertainty)',
        '2. Apply acquisition function (Expected Improvement, UCB)',
        '3. Ensure diversity in selected candidates',
        '4. Consider synthesis feasibility',
        '5. Prioritize candidates that maximize information gain',
        '6. Avoid redundant selections',
        '7. Consider cost constraints',
        '8. Document selection rationale',
        '9. Generate validation priority list',
        '10. Recommend validation protocols'
      ],
      outputFormat: 'JSON object with selected candidates'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedCandidates', 'acquisitionScores', 'rationale'],
      properties: {
        selectedCandidates: { type: 'array' },
        acquisitionScores: { type: 'object' },
        exploitationVsExploration: { type: 'object' },
        diversityMetrics: { type: 'object' },
        rationale: { type: 'string' },
        validationProtocols: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'ml', 'active-learning', `cycle-${args.cycle}`]
}));

export const validationSimulationTask = defineTask('validation-simulation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Simulate validation results',
  agent: {
    name: 'validation-simulator',
    prompt: {
      role: 'Experimental Validation Simulation Specialist',
      task: 'Simulate experimental validation of candidates',
      context: args,
      instructions: [
        '1. Generate realistic validation outcomes',
        '2. Add appropriate measurement uncertainty',
        '3. Account for synthesis success/failure',
        '4. Generate measurement conditions',
        '5. Simulate characterization results',
        '6. Generate property measurements',
        '7. Document any anomalous results',
        '8. Compile validation data package',
        '9. Assess result quality',
        '10. Flag any surprising outcomes'
      ],
      outputFormat: 'JSON object with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['validatedCandidates', 'measuredProperties', 'synthesisSuccess'],
      properties: {
        validatedCandidates: { type: 'array' },
        measuredProperties: { type: 'object' },
        synthesisSuccess: { type: 'object' },
        measurementUncertainty: { type: 'object' },
        anomalies: { type: 'array' },
        dataPackage: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'ml', 'validation']
}));

export const modelUpdateTask = defineTask('model-update', (args, taskCtx) => ({
  kind: 'agent',
  title: `Update model with new data (cycle ${args.cycle})`,
  agent: {
    name: 'model-updater',
    prompt: {
      role: 'Model Update Specialist',
      task: 'Update ML model with new validation data',
      context: args,
      instructions: [
        '1. Add new validation data to training set',
        '2. Retrain model with augmented data',
        '3. Re-optimize hyperparameters if needed',
        '4. Evaluate updated model performance',
        '5. Compare with previous model',
        '6. Update feature importance analysis',
        '7. Check for model drift',
        '8. Validate improvement in predictions',
        '9. Document model update',
        '10. Assess data efficiency'
      ],
      outputFormat: 'JSON object with updated model'
    },
    outputSchema: {
      type: 'object',
      required: ['updatedModel', 'performanceChange', 'newDataPoints'],
      properties: {
        updatedModel: { type: 'object' },
        performanceChange: { type: 'object' },
        newDataPoints: { type: 'number' },
        featureImportanceChange: { type: 'object' },
        modelComparison: { type: 'object' },
        dataEfficiency: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'ml', 'update', `cycle-${args.cycle}`]
}));

export const rerankingTask = defineTask('reranking', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Rerank candidates with updated model',
  agent: {
    name: 'reranking-specialist',
    prompt: {
      role: 'Candidate Reranking Specialist',
      task: 'Rerank candidates using updated model',
      context: args,
      instructions: [
        '1. Apply updated model to candidate space',
        '2. Update predictions and uncertainties',
        '3. Rerank candidates',
        '4. Identify rank changes',
        '5. Analyze impact of new data',
        '6. Update top candidate list',
        '7. Recalculate diversity metrics',
        '8. Update synthesizability assessment',
        '9. Document reranking results',
        '10. Identify emerging candidates'
      ],
      outputFormat: 'JSON object with updated rankings'
    },
    outputSchema: {
      type: 'object',
      required: ['updatedRankings', 'rankChanges', 'newTopCandidates'],
      properties: {
        updatedRankings: { type: 'array' },
        rankChanges: { type: 'object' },
        newTopCandidates: { type: 'array' },
        predictionChanges: { type: 'object' },
        emergingCandidates: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'ml', 'reranking']
}));

export const finalAnalysisTask = defineTask('final-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze final candidate rankings',
  agent: {
    name: 'analysis-specialist',
    prompt: {
      role: 'Materials Discovery Analysis Specialist',
      task: 'Analyze final candidate rankings and identify best materials',
      context: args,
      instructions: [
        '1. Analyze top candidates in detail',
        '2. Identify common features of best candidates',
        '3. Assess diversity of top candidates',
        '4. Analyze prediction confidence',
        '5. Compare with known materials',
        '6. Identify structure-property trends',
        '7. Assess novelty of candidates',
        '8. Document discovery insights',
        '9. Prioritize for experimental validation',
        '10. Summarize key findings'
      ],
      outputFormat: 'JSON object with final analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['topCandidates', 'bestPrediction', 'discoveryInsights'],
      properties: {
        topCandidates: { type: 'array' },
        bestPrediction: { type: 'number' },
        commonFeatures: { type: 'object' },
        diversity: { type: 'object' },
        noveltyAssessment: { type: 'object' },
        structurePropertyTrends: { type: 'array' },
        discoveryInsights: { type: 'array', items: { type: 'string' } },
        validationPriority: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'ml', 'analysis']
}));

export const validationPlanTask = defineTask('validation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create experimental validation plan',
  agent: {
    name: 'validation-planner',
    prompt: {
      role: 'Experimental Validation Planning Specialist',
      task: 'Create plan for experimental validation of candidates',
      context: args,
      instructions: [
        '1. Prioritize candidates for synthesis',
        '2. Define synthesis approaches for each candidate',
        '3. Plan characterization protocols',
        '4. Define property measurement methods',
        '5. Estimate validation timeline and resources',
        '6. Plan contingencies for synthesis failures',
        '7. Define success criteria',
        '8. Plan data collection for model improvement',
        '9. Consider scale-up potential',
        '10. Document validation plan'
      ],
      outputFormat: 'JSON object with validation plan'
    },
    outputSchema: {
      type: 'object',
      required: ['validationQueue', 'synthesisProtocols', 'characterizationPlan'],
      properties: {
        validationQueue: { type: 'array' },
        synthesisProtocols: { type: 'object' },
        characterizationPlan: { type: 'object' },
        timeline: { type: 'object' },
        resourceRequirements: { type: 'object' },
        successCriteria: { type: 'object' },
        contingencies: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'ml', 'validation-plan']
}));

export const uncertaintyAnalysisTask = defineTask('uncertainty-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Quantify prediction uncertainty',
  agent: {
    name: 'uncertainty-analyst',
    prompt: {
      role: 'Uncertainty Quantification Specialist',
      task: 'Quantify and analyze prediction uncertainties',
      context: args,
      instructions: [
        '1. Extract prediction uncertainties from model',
        '2. Analyze uncertainty distribution across candidates',
        '3. Identify high-uncertainty regions',
        '4. Correlate uncertainty with feature space',
        '5. Assess uncertainty calibration',
        '6. Calculate confidence intervals for top candidates',
        '7. Identify epistemic vs aleatoric uncertainty',
        '8. Recommend uncertainty reduction strategies',
        '9. Document uncertainty analysis',
        '10. Provide risk assessment for validation'
      ],
      outputFormat: 'JSON object with uncertainty analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['uncertaintyDistribution', 'highUncertaintyRegions', 'calibration'],
      properties: {
        uncertaintyDistribution: { type: 'object' },
        highUncertaintyRegions: { type: 'array' },
        calibration: { type: 'object' },
        confidenceIntervals: { type: 'object' },
        uncertaintyDecomposition: { type: 'object' },
        reductionStrategies: { type: 'array' },
        riskAssessment: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'ml', 'uncertainty']
}));

export const reportGenerationTask = defineTask('report-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate ML discovery report',
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'ML Materials Discovery Report Writer',
      task: 'Generate comprehensive ML discovery report',
      context: args,
      instructions: [
        '1. Create executive summary of discovery campaign',
        '2. Document data curation and sources',
        '3. Describe feature engineering approach',
        '4. Present model performance and validation',
        '5. Summarize active learning results',
        '6. Present top candidate materials',
        '7. Include uncertainty analysis',
        '8. Document validation plan',
        '9. Discuss implications and next steps',
        '10. Provide recommendations'
      ],
      outputFormat: 'JSON object with report'
    },
    outputSchema: {
      type: 'object',
      required: ['markdown', 'executiveSummary'],
      properties: {
        markdown: { type: 'string' },
        executiveSummary: { type: 'string' },
        methodology: { type: 'object' },
        results: { type: 'object' },
        candidateSummary: { type: 'object' },
        conclusions: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'ml', 'reporting']
}));
