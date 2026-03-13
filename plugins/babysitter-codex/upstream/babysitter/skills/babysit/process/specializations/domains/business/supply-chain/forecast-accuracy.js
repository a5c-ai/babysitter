/**
 * @process specializations/domains/business/supply-chain/forecast-accuracy
 * @description Forecast Accuracy Analysis and Improvement - Measure forecast accuracy metrics (MAPE, bias, WMAPE),
 * analyze forecast error drivers, and recommend model and process improvements.
 * @inputs { forecastData?: object, actualData?: object, analysisHorizon?: string, productSegments?: array }
 * @outputs { success: boolean, accuracyMetrics: object, errorAnalysis: object, recommendations: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/supply-chain/forecast-accuracy', {
 *   forecastData: { forecasts: [...] },
 *   actualData: { actuals: [...] },
 *   analysisHorizon: '12-months',
 *   productSegments: ['Category A', 'Category B']
 * });
 *
 * @references
 * - o9 Solutions Demand Planning: https://o9solutions.com/
 * - ASCM Forecast Best Practices: https://www.ascm.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    forecastData = {},
    actualData = {},
    analysisHorizon = '12-months',
    productSegments = [],
    accuracyTargets = {},
    outputDir = 'forecast-accuracy-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Forecast Accuracy Analysis and Improvement Process');

  // ============================================================================
  // PHASE 1: DATA PREPARATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Preparing forecast and actual data');

  const dataPreparation = await ctx.task(forecastDataPreparationTask, {
    forecastData,
    actualData,
    analysisHorizon,
    outputDir
  });

  artifacts.push(...dataPreparation.artifacts);

  // ============================================================================
  // PHASE 2: ACCURACY METRIC CALCULATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Calculating accuracy metrics');

  const accuracyCalculation = await ctx.task(accuracyMetricTask, {
    dataPreparation,
    productSegments,
    outputDir
  });

  artifacts.push(...accuracyCalculation.artifacts);

  // ============================================================================
  // PHASE 3: BIAS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Analyzing forecast bias');

  const biasAnalysis = await ctx.task(biasAnalysisTask, {
    dataPreparation,
    accuracyCalculation,
    outputDir
  });

  artifacts.push(...biasAnalysis.artifacts);

  // ============================================================================
  // PHASE 4: ERROR PATTERN ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing error patterns');

  const errorPatternAnalysis = await ctx.task(errorPatternTask, {
    dataPreparation,
    accuracyCalculation,
    biasAnalysis,
    productSegments,
    outputDir
  });

  artifacts.push(...errorPatternAnalysis.artifacts);

  // Breakpoint: Review accuracy analysis
  await ctx.breakpoint({
    question: `Forecast accuracy analysis complete. Overall MAPE: ${accuracyCalculation.overallMape}%. Bias: ${biasAnalysis.overallBias}%. Review analysis before recommendations?`,
    title: 'Forecast Accuracy Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'json' })),
      summary: {
        overallMape: accuracyCalculation.overallMape,
        overallBias: biasAnalysis.overallBias,
        targetMet: accuracyCalculation.targetMet
      }
    }
  });

  // ============================================================================
  // PHASE 5: ROOT CAUSE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Analyzing error root causes');

  const rootCauseAnalysis = await ctx.task(errorRootCauseTask, {
    errorPatternAnalysis,
    biasAnalysis,
    outputDir
  });

  artifacts.push(...rootCauseAnalysis.artifacts);

  // ============================================================================
  // PHASE 6: MODEL IMPROVEMENT RECOMMENDATIONS
  // ============================================================================

  ctx.log('info', 'Phase 6: Generating model improvement recommendations');

  const modelRecommendations = await ctx.task(modelImprovementTask, {
    accuracyCalculation,
    errorPatternAnalysis,
    rootCauseAnalysis,
    outputDir
  });

  artifacts.push(...modelRecommendations.artifacts);

  // ============================================================================
  // PHASE 7: PROCESS IMPROVEMENT RECOMMENDATIONS
  // ============================================================================

  ctx.log('info', 'Phase 7: Generating process improvement recommendations');

  const processRecommendations = await ctx.task(processImprovementTask, {
    rootCauseAnalysis,
    errorPatternAnalysis,
    outputDir
  });

  artifacts.push(...processRecommendations.artifacts);

  // ============================================================================
  // PHASE 8: IMPROVEMENT ACTION PLAN
  // ============================================================================

  ctx.log('info', 'Phase 8: Creating improvement action plan');

  const actionPlan = await ctx.task(improvementActionPlanTask, {
    modelRecommendations,
    processRecommendations,
    accuracyTargets,
    outputDir
  });

  artifacts.push(...actionPlan.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    accuracyMetrics: {
      overallMape: accuracyCalculation.overallMape,
      wmape: accuracyCalculation.wmape,
      mapeBySegment: accuracyCalculation.mapeBySegment,
      targetMet: accuracyCalculation.targetMet
    },
    biasMetrics: {
      overallBias: biasAnalysis.overallBias,
      biasBySegment: biasAnalysis.biasBySegment,
      biasDirection: biasAnalysis.biasDirection
    },
    errorAnalysis: {
      patterns: errorPatternAnalysis.patterns,
      rootCauses: rootCauseAnalysis.rootCauses,
      problemAreas: errorPatternAnalysis.problemAreas
    },
    recommendations: {
      model: modelRecommendations.recommendations,
      process: processRecommendations.recommendations,
      expectedImprovement: actionPlan.expectedImprovement
    },
    actionPlan: actionPlan.actions,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/business/supply-chain/forecast-accuracy',
      timestamp: startTime,
      analysisHorizon,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const forecastDataPreparationTask = defineTask('forecast-data-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1: Data Preparation',
  agent: {
    name: 'data-preparer',
    prompt: {
      role: 'Forecast Data Analyst',
      task: 'Prepare forecast and actual data for analysis',
      context: args,
      instructions: [
        '1. Load forecast data by period',
        '2. Load actual demand data',
        '3. Align time periods',
        '4. Handle missing values',
        '5. Validate data consistency',
        '6. Calculate forecast errors',
        '7. Segment data for analysis',
        '8. Document data preparation'
      ],
      outputFormat: 'JSON with prepared data'
    },
    outputSchema: {
      type: 'object',
      required: ['recordCount', 'periodsAnalyzed', 'artifacts'],
      properties: {
        recordCount: { type: 'number' },
        periodsAnalyzed: { type: 'number' },
        forecastErrors: { type: 'object' },
        dataQuality: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'forecast-accuracy', 'data-prep']
}));

export const accuracyMetricTask = defineTask('accuracy-metric', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2: Accuracy Metric Calculation',
  agent: {
    name: 'accuracy-calculator',
    prompt: {
      role: 'Forecast Accuracy Analyst',
      task: 'Calculate forecast accuracy metrics',
      context: args,
      instructions: [
        '1. Calculate MAPE (Mean Absolute Percentage Error)',
        '2. Calculate WMAPE (Weighted MAPE)',
        '3. Calculate MAE (Mean Absolute Error)',
        '4. Calculate accuracy by segment',
        '5. Compare to targets',
        '6. Analyze accuracy trends',
        '7. Rank segments by accuracy',
        '8. Document accuracy metrics'
      ],
      outputFormat: 'JSON with accuracy metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['overallMape', 'wmape', 'mapeBySegment', 'targetMet', 'artifacts'],
      properties: {
        overallMape: { type: 'number' },
        wmape: { type: 'number' },
        mae: { type: 'number' },
        mapeBySegment: { type: 'object' },
        targetMet: { type: 'boolean' },
        accuracyTrends: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'forecast-accuracy', 'metrics']
}));

export const biasAnalysisTask = defineTask('bias-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3: Bias Analysis',
  agent: {
    name: 'bias-analyst',
    prompt: {
      role: 'Forecast Bias Analyst',
      task: 'Analyze forecast bias patterns',
      context: args,
      instructions: [
        '1. Calculate mean bias percentage',
        '2. Analyze bias direction (over/under)',
        '3. Calculate bias by segment',
        '4. Analyze bias trends over time',
        '5. Identify systematic bias',
        '6. Calculate tracking signal',
        '7. Identify bias sources',
        '8. Document bias analysis'
      ],
      outputFormat: 'JSON with bias analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['overallBias', 'biasDirection', 'biasBySegment', 'artifacts'],
      properties: {
        overallBias: { type: 'number' },
        biasDirection: { type: 'string' },
        biasBySegment: { type: 'object' },
        biasTrends: { type: 'object' },
        trackingSignal: { type: 'number' },
        systematicBias: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'forecast-accuracy', 'bias']
}));

export const errorPatternTask = defineTask('error-pattern', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4: Error Pattern Analysis',
  agent: {
    name: 'pattern-analyst',
    prompt: {
      role: 'Error Pattern Analyst',
      task: 'Analyze forecast error patterns',
      context: args,
      instructions: [
        '1. Identify seasonal error patterns',
        '2. Analyze errors by product lifecycle',
        '3. Identify error correlation with events',
        '4. Analyze horizon effect on accuracy',
        '5. Identify worst performing items',
        '6. Cluster error patterns',
        '7. Identify problem areas',
        '8. Document error patterns'
      ],
      outputFormat: 'JSON with error pattern analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['patterns', 'problemAreas', 'artifacts'],
      properties: {
        patterns: { type: 'array' },
        seasonalPatterns: { type: 'object' },
        lifecyclePatterns: { type: 'object' },
        horizonEffect: { type: 'object' },
        worstPerformers: { type: 'array' },
        problemAreas: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'forecast-accuracy', 'patterns']
}));

export const errorRootCauseTask = defineTask('error-root-cause', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5: Root Cause Analysis',
  agent: {
    name: 'root-cause-analyst',
    prompt: {
      role: 'Forecast Error Root Cause Analyst',
      task: 'Identify root causes of forecast errors',
      context: args,
      instructions: [
        '1. Analyze data quality issues',
        '2. Assess model limitations',
        '3. Evaluate process gaps',
        '4. Identify input data issues',
        '5. Assess human override impact',
        '6. Analyze external factor impact',
        '7. Prioritize root causes',
        '8. Document root cause analysis'
      ],
      outputFormat: 'JSON with root cause analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['rootCauses', 'priorities', 'artifacts'],
      properties: {
        rootCauses: { type: 'array' },
        dataQualityIssues: { type: 'array' },
        modelLimitations: { type: 'array' },
        processGaps: { type: 'array' },
        priorities: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'forecast-accuracy', 'root-cause']
}));

export const modelImprovementTask = defineTask('model-improvement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6: Model Improvement Recommendations',
  agent: {
    name: 'model-improvement-advisor',
    prompt: {
      role: 'Forecast Model Improvement Specialist',
      task: 'Recommend forecast model improvements',
      context: args,
      instructions: [
        '1. Recommend model algorithm changes',
        '2. Suggest parameter tuning',
        '3. Recommend data enrichment',
        '4. Suggest segmentation changes',
        '5. Recommend ensemble approaches',
        '6. Suggest horizon-specific models',
        '7. Estimate improvement potential',
        '8. Document model recommendations'
      ],
      outputFormat: 'JSON with model improvement recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'expectedImprovement', 'artifacts'],
      properties: {
        recommendations: { type: 'array' },
        algorithmChanges: { type: 'array' },
        parameterTuning: { type: 'array' },
        dataEnrichment: { type: 'array' },
        expectedImprovement: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'forecast-accuracy', 'model']
}));

export const processImprovementTask = defineTask('process-improvement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7: Process Improvement Recommendations',
  agent: {
    name: 'process-improvement-advisor',
    prompt: {
      role: 'Forecast Process Improvement Specialist',
      task: 'Recommend forecast process improvements',
      context: args,
      instructions: [
        '1. Recommend consensus process changes',
        '2. Suggest collaboration improvements',
        '3. Recommend exception management',
        '4. Suggest review frequency changes',
        '5. Recommend accountability improvements',
        '6. Suggest training needs',
        '7. Recommend system improvements',
        '8. Document process recommendations'
      ],
      outputFormat: 'JSON with process improvement recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'processChanges', 'artifacts'],
      properties: {
        recommendations: { type: 'array' },
        processChanges: { type: 'array' },
        collaborationImprovements: { type: 'array' },
        trainingNeeds: { type: 'array' },
        systemImprovements: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'forecast-accuracy', 'process']
}));

export const improvementActionPlanTask = defineTask('improvement-action-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 8: Improvement Action Plan',
  agent: {
    name: 'action-planner',
    prompt: {
      role: 'Forecast Improvement Action Planner',
      task: 'Create comprehensive improvement action plan',
      context: args,
      instructions: [
        '1. Prioritize improvement actions',
        '2. Define implementation timeline',
        '3. Assign action owners',
        '4. Set improvement targets',
        '5. Define success metrics',
        '6. Identify resource requirements',
        '7. Calculate expected improvement',
        '8. Create implementation roadmap'
      ],
      outputFormat: 'JSON with improvement action plan'
    },
    outputSchema: {
      type: 'object',
      required: ['actions', 'expectedImprovement', 'artifacts'],
      properties: {
        actions: { type: 'array' },
        timeline: { type: 'object' },
        owners: { type: 'object' },
        improvementTargets: { type: 'object' },
        successMetrics: { type: 'array' },
        resourceRequirements: { type: 'object' },
        expectedImprovement: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'forecast-accuracy', 'action-plan']
}));
