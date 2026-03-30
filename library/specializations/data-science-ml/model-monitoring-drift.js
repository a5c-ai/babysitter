/**
 * @process specializations/data-science-ml/model-monitoring-drift
 * @description Model Performance Monitoring and Drift Detection - Continuously monitor prediction accuracy,
 * detect data drift and concept drift, track feature distributions, alert on performance degradation, and
 * trigger automated retraining workflows with comprehensive quality gates.
 * @inputs { modelId: string, monitoringWindowDays: number, driftThresholds: object, performanceThresholds: object, alertChannels: array }
 * @outputs { success: boolean, driftDetected: boolean, performanceDegraded: boolean, retrainingTriggered: boolean, monitoringReport: object, alerts: array }
 *
 * @example
 * const result = await orchestrate('specializations/data-science-ml/model-monitoring-drift', {
 *   modelId: 'fraud-detection-v3',
 *   monitoringWindowDays: 7,
 *   driftThresholds: {
 *     dataDrift: 0.15,
 *     conceptDrift: 0.10,
 *     featureDrift: 0.20
 *   },
 *   performanceThresholds: {
 *     accuracyDrop: 0.05,
 *     precisionDrop: 0.03,
 *     latencyIncrease: 1.5,
 *     errorRateIncrease: 0.02
 *   },
 *   alertChannels: ['slack', 'pagerduty', 'email']
 * });
 *
 * @references
 * - Evidently AI Model Monitoring: https://www.evidentlyai.com/
 * - Arize AI ML Observability: https://arize.com/
 * - WhyLabs AI Observability: https://whylabs.ai/
 * - MLOps Continuous Monitoring: https://cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning
 * - Concept Drift Detection: https://arxiv.org/abs/1010.4784
 * - Data Drift in ML: https://towardsdatascience.com/understanding-dataset-shift-f2a5a262a766
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    modelId,
    monitoringWindowDays = 7,
    driftThresholds = {
      dataDrift: 0.15,
      conceptDrift: 0.10,
      featureDrift: 0.20,
      predictionDrift: 0.15
    },
    performanceThresholds = {
      accuracyDrop: 0.05,
      precisionDrop: 0.03,
      recallDrop: 0.03,
      f1Drop: 0.04,
      latencyIncrease: 1.5,
      errorRateIncrease: 0.02
    },
    alertChannels = ['slack', 'email'],
    retrainingConfig = {
      autoTrigger: true,
      requireApproval: true,
      minimumDriftSeverity: 'high'
    },
    comparisonBaseline = 'training',
    monitoringFrequency = 'hourly'
  } = inputs;

  const startTime = ctx.now();
  const alerts = [];
  let driftDetected = false;
  let performanceDegraded = false;
  let retrainingTriggered = false;

  ctx.log('info', `Starting monitoring and drift detection for model: ${modelId}`);
  ctx.log('info', `Monitoring window: ${monitoringWindowDays} days, Frequency: ${monitoringFrequency}`);

  // ============================================================================
  // PHASE 1: BASELINE AND CONTEXT COLLECTION
  // ============================================================================

  ctx.log('info', 'Phase 1: Collecting baseline and model context');

  // Task 1.1: Retrieve Model Metadata and Baseline
  const modelContext = await ctx.task(retrieveModelContextTask, {
    modelId,
    comparisonBaseline
  });

  if (!modelContext.success) {
    return {
      success: false,
      error: 'Failed to retrieve model context and baseline',
      details: modelContext,
      metadata: { processId: 'specializations/data-science-ml/model-monitoring-drift', timestamp: startTime }
    };
  }

  // Task 1.2: Retrieve Training Data Statistics
  const trainingStats = await ctx.task(retrieveTrainingStatisticsTask, {
    modelId,
    modelVersion: modelContext.modelVersion,
    trainingDataReference: modelContext.trainingDataReference
  });

  // Task 1.3: Setup Monitoring Infrastructure
  const monitoringSetup = await ctx.task(setupMonitoringInfrastructureTask, {
    modelId,
    modelVersion: modelContext.modelVersion,
    monitoringFrequency,
    alertChannels,
    driftThresholds,
    performanceThresholds
  });

  if (!monitoringSetup.success) {
    return {
      success: false,
      error: 'Failed to setup monitoring infrastructure',
      details: monitoringSetup,
      metadata: { processId: 'specializations/data-science-ml/model-monitoring-drift', timestamp: startTime }
    };
  }

  // ============================================================================
  // PHASE 2: PRODUCTION DATA COLLECTION AND ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Collecting and analyzing production data');

  // Task 2.1: Collect Production Predictions and Features
  const productionData = await ctx.task(collectProductionDataTask, {
    modelId,
    modelVersion: modelContext.modelVersion,
    monitoringWindowDays,
    includeFeatures: true,
    includePredictions: true,
    includeLabels: true,
    includeMetadata: true
  });

  if (!productionData.dataAvailable) {
    ctx.log('warn', 'Insufficient production data collected for analysis');
    return {
      success: false,
      error: 'Insufficient production data for monitoring analysis',
      details: productionData,
      metadata: { processId: 'specializations/data-science-ml/model-monitoring-drift', timestamp: startTime }
    };
  }

  // Task 2.2: Calculate Production Data Statistics
  const productionStats = await ctx.task(calculateProductionStatisticsTask, {
    modelId,
    productionData: productionData.data,
    sampleSize: productionData.sampleSize,
    timeWindow: monitoringWindowDays
  });

  // ============================================================================
  // PHASE 3: DATA DRIFT DETECTION
  // ============================================================================

  ctx.log('info', 'Phase 3: Detecting data drift in features and inputs');

  // Task 3.1: Feature Distribution Drift Analysis
  const featureDriftAnalysis = await ctx.task(featureDriftDetectionTask, {
    modelId,
    trainingStats: trainingStats.featureStatistics,
    productionStats: productionStats.featureStatistics,
    driftThreshold: driftThresholds.featureDrift,
    statisticalTests: ['kolmogorov-smirnov', 'chi-squared', 'jensen-shannon'],
    confidenceLevel: 0.95
  });

  // Task 3.2: Data Quality Drift Analysis
  const dataQualityDrift = await ctx.task(dataQualityDriftTask, {
    modelId,
    trainingStats: trainingStats.dataQuality,
    productionStats: productionStats.dataQuality,
    checkMissingValues: true,
    checkOutliers: true,
    checkDataTypes: true,
    checkRanges: true
  });

  // Task 3.3: Covariate Shift Detection
  const covariateShift = await ctx.task(covariateShiftDetectionTask, {
    modelId,
    trainingData: trainingStats.covariateStatistics,
    productionData: productionStats.covariateStatistics,
    driftThreshold: driftThresholds.dataDrift,
    method: 'adversarial-validation'
  });

  // Aggregate data drift results
  const dataDriftDetected = featureDriftAnalysis.driftDetected ||
                            dataQualityDrift.driftDetected ||
                            covariateShift.shiftDetected;

  if (dataDriftDetected) {
    driftDetected = true;
    ctx.log('warn', 'Data drift detected in production data');
    alerts.push({
      severity: featureDriftAnalysis.severity || 'medium',
      type: 'data-drift',
      message: 'Feature distribution or data quality drift detected',
      details: {
        featureDrift: featureDriftAnalysis.driftedFeatures,
        dataQualityIssues: dataQualityDrift.issues,
        covariateShift: covariateShift.shiftMagnitude
      },
      timestamp: ctx.now()
    });
  }

  // ============================================================================
  // PHASE 4: PREDICTION DRIFT ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing prediction drift and distribution changes');

  // Task 4.1: Prediction Distribution Drift
  const predictionDrift = await ctx.task(predictionDriftAnalysisTask, {
    modelId,
    trainingPredictions: trainingStats.predictionStatistics,
    productionPredictions: productionStats.predictionStatistics,
    driftThreshold: driftThresholds.predictionDrift,
    classificationThresholds: modelContext.classificationThresholds
  });

  // Task 4.2: Prediction Confidence Drift
  const confidenceDrift = await ctx.task(confidenceDriftAnalysisTask, {
    modelId,
    trainingConfidence: trainingStats.confidenceStatistics,
    productionConfidence: productionStats.confidenceStatistics,
    lowConfidenceThreshold: 0.6
  });

  if (predictionDrift.driftDetected || confidenceDrift.driftDetected) {
    driftDetected = true;
    ctx.log('warn', 'Prediction distribution drift detected');
    alerts.push({
      severity: predictionDrift.severity || 'medium',
      type: 'prediction-drift',
      message: 'Model prediction distribution has shifted',
      details: {
        predictionDrift: predictionDrift.driftMagnitude,
        confidenceDrift: confidenceDrift.driftMagnitude,
        lowConfidencePredictions: confidenceDrift.lowConfidenceRate
      },
      timestamp: ctx.now()
    });
  }

  // ============================================================================
  // PHASE 5: PERFORMANCE MONITORING
  // ============================================================================

  ctx.log('info', 'Phase 5: Monitoring model performance metrics');

  // Task 5.1: Calculate Performance Metrics (if ground truth available)
  const performanceMetrics = await ctx.task(calculatePerformanceMetricsTask, {
    modelId,
    productionPredictions: productionData.predictions,
    groundTruth: productionData.labels,
    labelAvailabilityRate: productionData.labelAvailabilityRate,
    modelType: modelContext.modelType
  });

  // Task 5.2: Performance Comparison and Degradation Detection
  const performanceComparison = await ctx.task(performanceDegradationDetectionTask, {
    modelId,
    baselineMetrics: trainingStats.performanceMetrics,
    currentMetrics: performanceMetrics.metrics,
    thresholds: performanceThresholds,
    labelAvailable: performanceMetrics.labelAvailable
  });

  // Task 5.3: Operational Metrics Monitoring
  const operationalMetrics = await ctx.task(operationalMetricsMonitoringTask, {
    modelId,
    monitoringWindowDays,
    latencyThreshold: modelContext.slaLatencyMs,
    errorRateThreshold: performanceThresholds.errorRateIncrease,
    throughputBaseline: modelContext.baselineThroughput
  });

  if (performanceComparison.degradationDetected || operationalMetrics.degradationDetected) {
    performanceDegraded = true;
    ctx.log('error', 'Model performance degradation detected');
    alerts.push({
      severity: performanceComparison.severity || 'high',
      type: 'performance-degradation',
      message: 'Model performance has degraded below acceptable thresholds',
      details: {
        metricChanges: performanceComparison.metricChanges,
        operationalIssues: operationalMetrics.issues,
        degradedMetrics: performanceComparison.degradedMetrics
      },
      timestamp: ctx.now()
    });
  }

  // ============================================================================
  // PHASE 6: CONCEPT DRIFT DETECTION
  // ============================================================================

  ctx.log('info', 'Phase 6: Detecting concept drift');

  // Task 6.1: Concept Drift Analysis (requires labeled data)
  const conceptDriftAnalysis = await ctx.task(conceptDriftDetectionTask, {
    modelId,
    productionData: productionData.data,
    productionLabels: productionData.labels,
    labelAvailabilityRate: productionData.labelAvailabilityRate,
    driftThreshold: driftThresholds.conceptDrift,
    windowSize: Math.floor(monitoringWindowDays / 2),
    detectionMethods: ['drift-detection-method', 'adwin', 'page-hinkley']
  });

  if (conceptDriftAnalysis.driftDetected) {
    driftDetected = true;
    ctx.log('error', 'Concept drift detected - model assumptions may be violated');
    alerts.push({
      severity: 'high',
      type: 'concept-drift',
      message: 'Concept drift detected - relationship between features and target has changed',
      details: {
        driftMagnitude: conceptDriftAnalysis.driftMagnitude,
        detectionMethod: conceptDriftAnalysis.primaryDetectionMethod,
        driftPoint: conceptDriftAnalysis.driftPoint,
        confidence: conceptDriftAnalysis.confidence
      },
      timestamp: ctx.now()
    });
  }

  // ============================================================================
  // PHASE 7: SEGMENT ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 7: Analyzing drift and performance across data segments');

  // Task 7.1: Segment-Level Drift and Performance Analysis
  const segmentAnalysis = await ctx.task(segmentAnalysisTask, {
    modelId,
    productionData: productionData.data,
    trainingStats,
    performanceMetrics: performanceMetrics.metrics,
    segmentationStrategy: modelContext.segmentationStrategy || 'auto',
    segmentDimensions: modelContext.monitoredSegments || []
  });

  if (segmentAnalysis.segmentDriftDetected || segmentAnalysis.segmentPerformanceIssues) {
    driftDetected = true;
    ctx.log('warn', 'Drift or performance issues detected in specific data segments');
    alerts.push({
      severity: segmentAnalysis.maxSeverity || 'medium',
      type: 'segment-drift',
      message: 'Drift or performance degradation in specific data segments',
      details: {
        affectedSegments: segmentAnalysis.affectedSegments,
        segmentMetrics: segmentAnalysis.segmentMetrics
      },
      timestamp: ctx.now()
    });
  }

  // ============================================================================
  // PHASE 8: ROOT CAUSE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 8: Performing root cause analysis for detected issues');

  // Task 8.1: Root Cause Analysis with Agent
  const rootCauseAnalysis = await ctx.task(rootCauseAnalysisTask, {
    modelId,
    alerts,
    driftDetected,
    performanceDegraded,
    featureDriftAnalysis,
    predictionDrift,
    conceptDriftAnalysis,
    performanceComparison,
    operationalMetrics,
    segmentAnalysis,
    productionStats,
    trainingStats
  });

  // ============================================================================
  // PHASE 9: ALERT GENERATION AND NOTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Generating alerts and notifications');

  // Task 9.1: Generate Comprehensive Alerts
  const alertGeneration = await ctx.task(generateAlertsTask, {
    modelId,
    alerts,
    rootCauseAnalysis,
    alertChannels,
    severityPrioritization: true
  });

  // Task 9.2: Send Notifications
  if (alerts.length > 0) {
    const notificationResult = await ctx.task(sendNotificationsTask, {
      modelId,
      alerts: alertGeneration.alerts,
      alertChannels,
      includeRecommendations: true,
      includeDashboardLinks: true,
      monitoringDashboard: monitoringSetup.dashboardUrl
    });

    ctx.log('info', `Sent ${notificationResult.notificationsSent} notifications to ${alertChannels.length} channels`);
  }

  // ============================================================================
  // PHASE 10: RETRAINING DECISION AND TRIGGER
  // ============================================================================

  ctx.log('info', 'Phase 10: Evaluating retraining necessity');

  // Task 10.1: Retraining Recommendation Decision
  const retrainingRecommendation = await ctx.task(retrainingRecommendationTask, {
    modelId,
    driftDetected,
    performanceDegraded,
    alerts,
    rootCauseAnalysis,
    driftSeverity: {
      dataDrift: featureDriftAnalysis.severity,
      predictionDrift: predictionDrift.severity,
      conceptDrift: conceptDriftAnalysis.driftDetected ? 'high' : 'none',
      performanceDegradation: performanceComparison.severity
    },
    retrainingConfig,
    lastRetrainingDate: modelContext.lastRetrainingDate,
    modelAge: modelContext.modelAge
  });

  // Breakpoint: Review monitoring results and retraining recommendation
  if (driftDetected || performanceDegraded) {
    await ctx.breakpoint({
      question: `Monitoring analysis complete for ${modelId}. Drift detected: ${driftDetected}. Performance degraded: ${performanceDegraded}. ${alerts.length} alert(s) generated. Retraining recommended: ${retrainingRecommendation.recommended}. Review results and approve retraining?`,
      title: 'Model Monitoring - Drift and Degradation Detected',
      context: {
        runId: ctx.runId,
        modelId,
        driftDetected,
        performanceDegraded,
        alertCount: alerts.length,
        retrainingRecommended: retrainingRecommendation.recommended,
        severity: retrainingRecommendation.maxSeverity,
        files: [
          { path: `artifacts/monitoring-report.md`, format: 'markdown', label: 'Monitoring Report' },
          { path: `artifacts/drift-analysis.json`, format: 'json', label: 'Drift Analysis' },
          { path: `artifacts/performance-analysis.json`, format: 'json', label: 'Performance Analysis' },
          { path: `artifacts/root-cause-analysis.md`, format: 'markdown', label: 'Root Cause Analysis' },
          { path: monitoringSetup.dashboardUrl, format: 'link', label: 'Monitoring Dashboard' }
        ]
      }
    });
  } else {
    ctx.log('info', 'No significant drift or performance issues detected');
  }

  // Task 10.2: Trigger Retraining if Approved
  if (retrainingRecommendation.recommended &&
      retrainingRecommendation.approved &&
      retrainingConfig.autoTrigger) {

    ctx.log('info', 'Triggering automated model retraining workflow');

    const retrainingTrigger = await ctx.task(triggerRetrainingWorkflowTask, {
      modelId,
      triggerReason: retrainingRecommendation.reason,
      driftAnalysis: {
        featureDrift: featureDriftAnalysis,
        predictionDrift,
        conceptDrift: conceptDriftAnalysis
      },
      performanceDegradation: performanceComparison,
      rootCauseAnalysis,
      urgency: retrainingRecommendation.urgency,
      dataSource: productionData.dataSource
    });

    if (retrainingTrigger.success) {
      retrainingTriggered = true;
      ctx.log('info', `Retraining workflow triggered: ${retrainingTrigger.workflowId}`);
    } else {
      ctx.log('error', 'Failed to trigger retraining workflow');
    }
  } else if (retrainingRecommendation.recommended) {
    ctx.log('warn', 'Retraining recommended but requires manual approval or auto-trigger disabled');
  }

  // ============================================================================
  // PHASE 11: REPORTING AND DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 11: Generating comprehensive monitoring report');

  // Task 11.1: Generate Monitoring Report
  const monitoringReport = await ctx.task(generateMonitoringReportTask, {
    modelId,
    modelVersion: modelContext.modelVersion,
    monitoringPeriod: {
      startDate: new Date(Date.now() - monitoringWindowDays * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString(),
      durationDays: monitoringWindowDays
    },
    driftAnalysis: {
      featureDrift: featureDriftAnalysis,
      predictionDrift,
      conceptDrift: conceptDriftAnalysis,
      segmentDrift: segmentAnalysis
    },
    performanceAnalysis: {
      metrics: performanceMetrics,
      comparison: performanceComparison,
      operational: operationalMetrics
    },
    alerts,
    rootCauseAnalysis,
    retrainingRecommendation,
    retrainingTriggered,
    productionStats,
    trainingStats
  });

  // Task 11.2: Update Model Registry
  const registryUpdate = await ctx.task(updateModelRegistryTask, {
    modelId,
    modelVersion: modelContext.modelVersion,
    monitoringResults: {
      timestamp: startTime,
      driftDetected,
      performanceDegraded,
      alertCount: alerts.length,
      retrainingTriggered
    },
    nextMonitoringSchedule: monitoringReport.nextMonitoringDate
  });

  // Final Breakpoint: Review complete monitoring analysis
  await ctx.breakpoint({
    question: `Model monitoring and drift detection complete for ${modelId}. Drift: ${driftDetected}. Degradation: ${performanceDegraded}. Retraining triggered: ${retrainingTriggered}. Review comprehensive report?`,
    title: 'Model Monitoring Complete',
    context: {
      runId: ctx.runId,
      modelId,
      summary: monitoringReport.executiveSummary,
      driftDetected,
      performanceDegraded,
      retrainingTriggered,
      files: [
        { path: monitoringReport.reportPath, format: 'markdown', label: 'Full Monitoring Report' },
        { path: monitoringReport.visualizationsPath, format: 'html', label: 'Visualizations' },
        { path: `artifacts/alerts-summary.json`, format: 'json', label: 'Alerts Summary' },
        { path: monitoringSetup.dashboardUrl, format: 'link', label: 'Live Dashboard' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    modelId,
    modelVersion: modelContext.modelVersion,
    monitoringPeriod: {
      startDate: new Date(Date.now() - monitoringWindowDays * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString(),
      durationDays: monitoringWindowDays
    },
    driftDetected,
    performanceDegraded,
    retrainingTriggered,
    driftSummary: {
      featureDrift: featureDriftAnalysis.driftDetected,
      featureDriftScore: featureDriftAnalysis.overallDriftScore,
      predictionDrift: predictionDrift.driftDetected,
      predictionDriftScore: predictionDrift.driftMagnitude,
      conceptDrift: conceptDriftAnalysis.driftDetected,
      conceptDriftScore: conceptDriftAnalysis.driftMagnitude,
      segmentDrift: segmentAnalysis.segmentDriftDetected,
      affectedSegments: segmentAnalysis.affectedSegments
    },
    performanceSummary: {
      degradationDetected: performanceComparison.degradationDetected,
      metricChanges: performanceComparison.metricChanges,
      operationalIssues: operationalMetrics.degradationDetected,
      labelAvailability: performanceMetrics.labelAvailabilityRate
    },
    alerts: alerts.map(a => ({
      severity: a.severity,
      type: a.type,
      message: a.message,
      timestamp: a.timestamp
    })),
    rootCause: rootCauseAnalysis.primaryCauses,
    retrainingRecommendation: {
      recommended: retrainingRecommendation.recommended,
      urgency: retrainingRecommendation.urgency,
      reason: retrainingRecommendation.reason,
      triggered: retrainingTriggered,
      workflowId: retrainingTriggered ? retrainingTrigger.workflowId : null
    },
    monitoringReport: {
      reportPath: monitoringReport.reportPath,
      visualizationsPath: monitoringReport.visualizationsPath,
      dashboardUrl: monitoringSetup.dashboardUrl
    },
    registryUpdated: registryUpdate.success,
    duration,
    metadata: {
      processId: 'specializations/data-science-ml/model-monitoring-drift',
      timestamp: startTime,
      completedAt: endTime
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1.1: Retrieve Model Context
export const retrieveModelContextTask = defineTask('retrieve-model-context', (args, taskCtx) => ({
  kind: 'agent',
  title: `Retrieve model context - ${args.modelId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'MLOps Engineer with expertise in model management',
      task: 'Retrieve comprehensive model metadata, baseline metrics, and context',
      context: {
        modelId: args.modelId,
        comparisonBaseline: args.comparisonBaseline
      },
      instructions: [
        '1. Query model registry for model metadata',
        '2. Retrieve model version and deployment information',
        '3. Fetch baseline performance metrics from training',
        '4. Get training data reference and statistics location',
        '5. Retrieve model type and architecture details',
        '6. Get SLA requirements (latency, throughput)',
        '7. Identify segmentation strategy and monitored segments',
        '8. Retrieve last retraining date and model age',
        '9. Get classification thresholds if applicable',
        '10. Compile comprehensive model context'
      ],
      outputFormat: 'JSON object with model context, baseline metrics, and metadata'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'modelId', 'modelVersion', 'modelType'],
      properties: {
        success: { type: 'boolean' },
        modelId: { type: 'string' },
        modelVersion: { type: 'string' },
        modelType: { type: 'string', enum: ['classification', 'regression', 'ranking', 'clustering'] },
        trainingDataReference: { type: 'string' },
        baselineMetrics: {
          type: 'object',
          properties: {
            accuracy: { type: 'number' },
            precision: { type: 'number' },
            recall: { type: 'number' },
            f1Score: { type: 'number' }
          }
        },
        slaLatencyMs: { type: 'number' },
        baselineThroughput: { type: 'number' },
        segmentationStrategy: { type: 'string' },
        monitoredSegments: { type: 'array', items: { type: 'string' } },
        classificationThresholds: { type: 'object' },
        lastRetrainingDate: { type: 'string' },
        modelAge: { type: 'number' },
        errors: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-monitoring', 'drift-detection', 'context']
}));

// Task 1.2: Retrieve Training Statistics
export const retrieveTrainingStatisticsTask = defineTask('retrieve-training-statistics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Retrieve training data statistics',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Analyst with ML expertise',
      task: 'Retrieve comprehensive training data statistics for drift comparison',
      context: {
        modelId: args.modelId,
        modelVersion: args.modelVersion,
        trainingDataReference: args.trainingDataReference
      },
      instructions: [
        '1. Load training data statistics from model artifacts',
        '2. Extract feature statistics (mean, std, min, max, percentiles)',
        '3. Get feature distributions and histograms',
        '4. Retrieve data quality metrics (missing values, outliers)',
        '5. Get prediction distribution statistics',
        '6. Retrieve confidence/probability statistics',
        '7. Get covariate statistics for shift detection',
        '8. Compile performance metrics from training',
        '9. Document statistical test parameters used',
        '10. Generate complete baseline statistics package'
      ],
      outputFormat: 'JSON with comprehensive training statistics'
    },
    outputSchema: {
      type: 'object',
      required: ['featureStatistics', 'predictionStatistics', 'performanceMetrics'],
      properties: {
        featureStatistics: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              mean: { type: 'number' },
              std: { type: 'number' },
              min: { type: 'number' },
              max: { type: 'number' },
              percentiles: { type: 'object' },
              distribution: { type: 'object' }
            }
          }
        },
        predictionStatistics: {
          type: 'object',
          properties: {
            distribution: { type: 'object' },
            mean: { type: 'number' },
            classBalance: { type: 'object' }
          }
        },
        confidenceStatistics: {
          type: 'object',
          properties: {
            meanConfidence: { type: 'number' },
            lowConfidenceRate: { type: 'number' }
          }
        },
        dataQuality: {
          type: 'object',
          properties: {
            missingValueRate: { type: 'number' },
            outlierRate: { type: 'number' }
          }
        },
        covariateStatistics: { type: 'object' },
        performanceMetrics: {
          type: 'object',
          properties: {
            accuracy: { type: 'number' },
            precision: { type: 'number' },
            recall: { type: 'number' },
            f1Score: { type: 'number' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-monitoring', 'baseline', 'statistics']
}));

// Task 1.3: Setup Monitoring Infrastructure
export const setupMonitoringInfrastructureTask = defineTask('setup-monitoring-infrastructure', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Setup monitoring infrastructure',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SRE and ML Infrastructure Engineer',
      task: 'Configure monitoring infrastructure and dashboards',
      context: {
        modelId: args.modelId,
        modelVersion: args.modelVersion,
        monitoringFrequency: args.monitoringFrequency,
        alertChannels: args.alertChannels,
        driftThresholds: args.driftThresholds,
        performanceThresholds: args.performanceThresholds
      },
      instructions: [
        '1. Setup metrics collection pipeline for production predictions',
        '2. Configure drift detection algorithms and thresholds',
        '3. Create monitoring dashboard with key metrics',
        '4. Setup alert rules for drift and degradation',
        '5. Configure notification channels',
        '6. Enable data logging for analysis',
        '7. Setup statistical test infrastructure',
        '8. Configure automated reporting',
        '9. Verify monitoring pipeline is operational',
        '10. Generate dashboard URL and access credentials'
      ],
      outputFormat: 'JSON with monitoring setup results and dashboard access'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'dashboardUrl'],
      properties: {
        success: { type: 'boolean' },
        dashboardUrl: { type: 'string' },
        metricsCollectionEnabled: { type: 'boolean' },
        driftDetectionEnabled: { type: 'boolean' },
        alertingConfigured: { type: 'boolean' },
        monitoringFrequency: { type: 'string' },
        configuredChannels: { type: 'array', items: { type: 'string' } },
        dataRetentionDays: { type: 'number' },
        errors: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-monitoring', 'infrastructure', 'setup']
}));

// Task 2.1: Collect Production Data
export const collectProductionDataTask = defineTask('collect-production-data', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Collect production data',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Engineer with ML operations expertise',
      task: 'Collect production predictions, features, and labels for monitoring analysis',
      context: {
        modelId: args.modelId,
        modelVersion: args.modelVersion,
        monitoringWindowDays: args.monitoringWindowDays,
        includeFeatures: args.includeFeatures,
        includePredictions: args.includePredictions,
        includeLabels: args.includeLabels,
        includeMetadata: args.includeMetadata
      },
      instructions: [
        '1. Query production logs for prediction data',
        '2. Extract features used for predictions',
        '3. Collect model predictions and confidence scores',
        '4. Retrieve ground truth labels if available',
        '5. Collect prediction metadata (timestamps, request IDs)',
        '6. Check data completeness and quality',
        '7. Calculate label availability rate',
        '8. Sample data if volume is too large',
        '9. Verify sufficient sample size for statistical tests',
        '10. Package data for analysis'
      ],
      outputFormat: 'JSON with production data and metadata'
    },
    outputSchema: {
      type: 'object',
      required: ['dataAvailable', 'sampleSize'],
      properties: {
        dataAvailable: { type: 'boolean' },
        sampleSize: { type: 'number' },
        data: {
          type: 'object',
          properties: {
            features: { type: 'array' },
            predictions: { type: 'array' },
            confidences: { type: 'array' },
            timestamps: { type: 'array' }
          }
        },
        predictions: { type: 'array' },
        labels: { type: 'array' },
        labelAvailabilityRate: { type: 'number' },
        dataSource: { type: 'string' },
        collectionPeriod: {
          type: 'object',
          properties: {
            startDate: { type: 'string' },
            endDate: { type: 'string' }
          }
        },
        samplingApplied: { type: 'boolean' },
        samplingRate: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-monitoring', 'data-collection', 'production']
}));

// Task 2.2: Calculate Production Statistics
export const calculateProductionStatisticsTask = defineTask('calculate-production-statistics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate production statistics',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Statistical Analyst with ML expertise',
      task: 'Calculate comprehensive statistics for production data',
      context: {
        modelId: args.modelId,
        productionData: args.productionData,
        sampleSize: args.sampleSize,
        timeWindow: args.timeWindow
      },
      instructions: [
        '1. Calculate feature statistics (mean, std, percentiles)',
        '2. Generate feature distributions',
        '3. Calculate prediction distribution statistics',
        '4. Analyze confidence score distributions',
        '5. Check data quality (missing values, outliers)',
        '6. Calculate covariate statistics',
        '7. Detect temporal patterns and trends',
        '8. Generate correlation matrices',
        '9. Calculate statistical test prerequisites',
        '10. Compile comprehensive statistics package'
      ],
      outputFormat: 'JSON with production data statistics'
    },
    outputSchema: {
      type: 'object',
      required: ['featureStatistics', 'predictionStatistics'],
      properties: {
        featureStatistics: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              mean: { type: 'number' },
              std: { type: 'number' },
              min: { type: 'number' },
              max: { type: 'number' },
              percentiles: { type: 'object' },
              distribution: { type: 'object' }
            }
          }
        },
        predictionStatistics: {
          type: 'object',
          properties: {
            distribution: { type: 'object' },
            mean: { type: 'number' },
            classBalance: { type: 'object' }
          }
        },
        confidenceStatistics: {
          type: 'object',
          properties: {
            meanConfidence: { type: 'number' },
            lowConfidenceRate: { type: 'number' }
          }
        },
        dataQuality: {
          type: 'object',
          properties: {
            missingValueRate: { type: 'number' },
            outlierRate: { type: 'number' }
          }
        },
        covariateStatistics: { type: 'object' },
        temporalPatterns: {
          type: 'object',
          properties: {
            trends: { type: 'array', items: { type: 'string' } },
            seasonality: { type: 'boolean' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-monitoring', 'statistics', 'analysis']
}));

// Task 3.1: Feature Drift Detection
export const featureDriftDetectionTask = defineTask('feature-drift-detection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Detect feature drift',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Monitoring Specialist',
      task: 'Detect statistical drift in feature distributions',
      context: {
        modelId: args.modelId,
        trainingStats: args.trainingStats,
        productionStats: args.productionStats,
        driftThreshold: args.driftThreshold,
        statisticalTests: args.statisticalTests,
        confidenceLevel: args.confidenceLevel
      },
      instructions: [
        '1. For each feature, compare training vs production distributions',
        '2. Apply Kolmogorov-Smirnov test for continuous features',
        '3. Apply Chi-squared test for categorical features',
        '4. Calculate Jensen-Shannon divergence',
        '5. Calculate Population Stability Index (PSI)',
        '6. Identify features with significant drift',
        '7. Calculate drift magnitude and severity',
        '8. Rank features by drift severity',
        '9. Determine overall drift score',
        '10. Generate drift detection report with visualizations'
      ],
      outputFormat: 'JSON with feature drift analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['driftDetected', 'overallDriftScore'],
      properties: {
        driftDetected: { type: 'boolean' },
        overallDriftScore: { type: 'number' },
        driftedFeatures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              feature: { type: 'string' },
              driftScore: { type: 'number' },
              pValue: { type: 'number' },
              testUsed: { type: 'string' },
              severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] }
            }
          }
        },
        severity: { type: 'string', enum: ['none', 'low', 'medium', 'high', 'critical'] },
        featureRankings: { type: 'array', items: { type: 'string' } },
        visualizations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-monitoring', 'drift-detection', 'feature-drift']
}));

// Task 3.2: Data Quality Drift
export const dataQualityDriftTask = defineTask('data-quality-drift', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Detect data quality drift',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Quality Engineer',
      task: 'Detect changes in data quality metrics',
      context: {
        modelId: args.modelId,
        trainingStats: args.trainingStats,
        productionStats: args.productionStats,
        checkMissingValues: args.checkMissingValues,
        checkOutliers: args.checkOutliers,
        checkDataTypes: args.checkDataTypes,
        checkRanges: args.checkRanges
      },
      instructions: [
        '1. Compare missing value rates (training vs production)',
        '2. Compare outlier rates',
        '3. Check for data type mismatches',
        '4. Verify value ranges are consistent',
        '5. Detect new categorical values',
        '6. Check for data completeness changes',
        '7. Identify quality degradation patterns',
        '8. Calculate overall data quality score',
        '9. Flag critical quality issues',
        '10. Generate data quality drift report'
      ],
      outputFormat: 'JSON with data quality drift analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['driftDetected', 'qualityScore'],
      properties: {
        driftDetected: { type: 'boolean' },
        qualityScore: { type: 'number' },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              feature: { type: 'string' },
              issueType: { type: 'string' },
              severity: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        missingValueDrift: { type: 'boolean' },
        outlierDrift: { type: 'boolean' },
        dataTypeMismatch: { type: 'boolean' },
        rangeViolations: { type: 'boolean' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-monitoring', 'data-quality', 'drift-detection']
}));

// Task 3.3: Covariate Shift Detection
export const covariateShiftDetectionTask = defineTask('covariate-shift-detection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Detect covariate shift',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Research Scientist',
      task: 'Detect covariate shift using adversarial validation',
      context: {
        modelId: args.modelId,
        trainingData: args.trainingData,
        productionData: args.productionData,
        driftThreshold: args.driftThreshold,
        method: args.method
      },
      instructions: [
        '1. Combine training and production data with labels (0=train, 1=prod)',
        '2. Train classifier to distinguish between datasets',
        '3. Calculate AUC score of the classifier',
        '4. If AUC > 0.5 + threshold, shift is detected',
        '5. Identify most important features for discrimination',
        '6. Calculate shift magnitude',
        '7. Compare with alternative methods (Maximum Mean Discrepancy)',
        '8. Assess severity of shift',
        '9. Determine impact on model performance',
        '10. Generate covariate shift report'
      ],
      outputFormat: 'JSON with covariate shift detection results'
    },
    outputSchema: {
      type: 'object',
      required: ['shiftDetected', 'shiftMagnitude'],
      properties: {
        shiftDetected: { type: 'boolean' },
        shiftMagnitude: { type: 'number' },
        discriminatorAUC: { type: 'number' },
        importantFeatures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              feature: { type: 'string' },
              importance: { type: 'number' }
            }
          }
        },
        severity: { type: 'string', enum: ['low', 'medium', 'high'] },
        methodology: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-monitoring', 'covariate-shift', 'drift-detection']
}));

// Task 4.1: Prediction Drift Analysis
export const predictionDriftAnalysisTask = defineTask('prediction-drift-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze prediction drift',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Performance Analyst',
      task: 'Detect drift in model prediction distributions',
      context: {
        modelId: args.modelId,
        trainingPredictions: args.trainingPredictions,
        productionPredictions: args.productionPredictions,
        driftThreshold: args.driftThreshold,
        classificationThresholds: args.classificationThresholds
      },
      instructions: [
        '1. Compare prediction distributions (training vs production)',
        '2. For classification: compare class balance',
        '3. For regression: compare prediction ranges and distributions',
        '4. Calculate prediction shift using statistical tests',
        '5. Check if predictions are trending in one direction',
        '6. Analyze prediction stability over time',
        '7. Calculate drift magnitude',
        '8. Assess severity of prediction drift',
        '9. Identify potential causes',
        '10. Generate prediction drift report with visualizations'
      ],
      outputFormat: 'JSON with prediction drift analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['driftDetected', 'driftMagnitude'],
      properties: {
        driftDetected: { type: 'boolean' },
        driftMagnitude: { type: 'number' },
        classBalanceShift: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        distributionShift: {
          type: 'object',
          properties: {
            ksStatistic: { type: 'number' },
            pValue: { type: 'number' }
          }
        },
        trendDetected: { type: 'boolean' },
        severity: { type: 'string', enum: ['low', 'medium', 'high'] },
        visualizations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-monitoring', 'prediction-drift', 'drift-detection']
}));

// Task 4.2: Confidence Drift Analysis
export const confidenceDriftAnalysisTask = defineTask('confidence-drift-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze confidence drift',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Performance Analyst',
      task: 'Detect drift in model prediction confidence',
      context: {
        modelId: args.modelId,
        trainingConfidence: args.trainingConfidence,
        productionConfidence: args.productionConfidence,
        lowConfidenceThreshold: args.lowConfidenceThreshold
      },
      instructions: [
        '1. Compare confidence distributions (training vs production)',
        '2. Calculate mean confidence shift',
        '3. Identify rate of low-confidence predictions',
        '4. Check for confidence calibration drift',
        '5. Analyze confidence by prediction class',
        '6. Detect if model is becoming more/less confident',
        '7. Calculate confidence drift magnitude',
        '8. Assess impact on prediction reliability',
        '9. Flag concerning confidence patterns',
        '10. Generate confidence drift report'
      ],
      outputFormat: 'JSON with confidence drift analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['driftDetected', 'driftMagnitude'],
      properties: {
        driftDetected: { type: 'boolean' },
        driftMagnitude: { type: 'number' },
        meanConfidenceShift: { type: 'number' },
        lowConfidenceRate: { type: 'number' },
        lowConfidenceIncrease: { type: 'number' },
        calibrationDrift: { type: 'boolean' },
        severity: { type: 'string', enum: ['low', 'medium', 'high'] }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-monitoring', 'confidence-drift', 'drift-detection']
}));

// Task 5.1: Calculate Performance Metrics
export const calculatePerformanceMetricsTask = defineTask('calculate-performance-metrics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate performance metrics',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Evaluation Engineer',
      task: 'Calculate comprehensive performance metrics from production data',
      context: {
        modelId: args.modelId,
        productionPredictions: args.productionPredictions,
        groundTruth: args.groundTruth,
        labelAvailabilityRate: args.labelAvailabilityRate,
        modelType: args.modelType
      },
      instructions: [
        '1. Check if ground truth labels are available',
        '2. For labeled data: calculate accuracy, precision, recall, F1',
        '3. For classification: generate confusion matrix',
        '4. For regression: calculate MSE, MAE, R-squared',
        '5. Calculate AUC-ROC if applicable',
        '6. Analyze error distribution',
        '7. Calculate per-class metrics',
        '8. Handle partial label availability',
        '9. Estimate metrics with confidence intervals',
        '10. Generate performance metrics report'
      ],
      outputFormat: 'JSON with performance metrics and analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['labelAvailable', 'metrics'],
      properties: {
        labelAvailable: { type: 'boolean' },
        labelAvailabilityRate: { type: 'number' },
        metrics: {
          type: 'object',
          properties: {
            accuracy: { type: 'number' },
            precision: { type: 'number' },
            recall: { type: 'number' },
            f1Score: { type: 'number' },
            auc: { type: 'number' },
            confusionMatrix: { type: 'array' }
          }
        },
        perClassMetrics: { type: 'object' },
        errorAnalysis: {
          type: 'object',
          properties: {
            totalErrors: { type: 'number' },
            errorRate: { type: 'number' },
            errorPatterns: { type: 'array', items: { type: 'string' } }
          }
        },
        confidenceIntervals: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-monitoring', 'performance', 'metrics']
}));

// Task 5.2: Performance Degradation Detection
export const performanceDegradationDetectionTask = defineTask('performance-degradation-detection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Detect performance degradation',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Performance Monitor',
      task: 'Compare current performance against baseline and detect degradation',
      context: {
        modelId: args.modelId,
        baselineMetrics: args.baselineMetrics,
        currentMetrics: args.currentMetrics,
        thresholds: args.thresholds,
        labelAvailable: args.labelAvailable
      },
      instructions: [
        '1. Compare each metric against baseline',
        '2. Calculate percentage change for each metric',
        '3. Check if changes exceed defined thresholds',
        '4. Identify metrics showing degradation',
        '5. Assess statistical significance of changes',
        '6. Calculate overall degradation severity',
        '7. Rank metrics by degradation magnitude',
        '8. Determine if degradation is actionable',
        '9. If labels unavailable, use proxy metrics',
        '10. Generate degradation detection report'
      ],
      outputFormat: 'JSON with performance degradation analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['degradationDetected', 'metricChanges'],
      properties: {
        degradationDetected: { type: 'boolean' },
        metricChanges: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              baseline: { type: 'number' },
              current: { type: 'number' },
              change: { type: 'number' },
              percentChange: { type: 'number' },
              thresholdExceeded: { type: 'boolean' }
            }
          }
        },
        degradedMetrics: { type: 'array', items: { type: 'string' } },
        severity: { type: 'string', enum: ['none', 'low', 'medium', 'high', 'critical'] },
        statisticallySignificant: { type: 'boolean' },
        actionable: { type: 'boolean' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-monitoring', 'performance', 'degradation']
}));

// Task 5.3: Operational Metrics Monitoring
export const operationalMetricsMonitoringTask = defineTask('operational-metrics-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Monitor operational metrics',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SRE with ML systems expertise',
      task: 'Monitor operational metrics (latency, errors, throughput)',
      context: {
        modelId: args.modelId,
        monitoringWindowDays: args.monitoringWindowDays,
        latencyThreshold: args.latencyThreshold,
        errorRateThreshold: args.errorRateThreshold,
        throughputBaseline: args.throughputBaseline
      },
      instructions: [
        '1. Query operational metrics from production logs',
        '2. Calculate latency percentiles (p50, p90, p95, p99)',
        '3. Calculate error rate and error types',
        '4. Measure throughput (requests per second)',
        '5. Compare against SLA thresholds',
        '6. Detect anomalies in operational metrics',
        '7. Check for resource saturation',
        '8. Identify performance bottlenecks',
        '9. Assess overall operational health',
        '10. Generate operational metrics report'
      ],
      outputFormat: 'JSON with operational metrics analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['degradationDetected', 'metrics'],
      properties: {
        degradationDetected: { type: 'boolean' },
        metrics: {
          type: 'object',
          properties: {
            latencyP95: { type: 'number' },
            latencyP99: { type: 'number' },
            errorRate: { type: 'number' },
            throughput: { type: 'number' }
          }
        },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              issue: { type: 'string' },
              severity: { type: 'string' }
            }
          }
        },
        slaViolations: { type: 'boolean' },
        anomaliesDetected: { type: 'boolean' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-monitoring', 'operational', 'sre']
}));

// Task 6.1: Concept Drift Detection
export const conceptDriftDetectionTask = defineTask('concept-drift-detection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Detect concept drift',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Research Scientist specializing in drift detection',
      task: 'Detect concept drift in the relationship between features and target',
      context: {
        modelId: args.modelId,
        productionData: args.productionData,
        productionLabels: args.productionLabels,
        labelAvailabilityRate: args.labelAvailabilityRate,
        driftThreshold: args.driftThreshold,
        windowSize: args.windowSize,
        detectionMethods: args.detectionMethods
      },
      instructions: [
        '1. Check if sufficient labeled data is available',
        '2. Apply Drift Detection Method (DDM) algorithm',
        '3. Apply ADWIN (Adaptive Windowing) algorithm',
        '4. Apply Page-Hinkley test',
        '5. Monitor error rate over sliding windows',
        '6. Detect abrupt vs gradual drift',
        '7. Identify drift point timestamp',
        '8. Calculate drift magnitude and confidence',
        '9. Determine drift severity',
        '10. Generate concept drift report'
      ],
      outputFormat: 'JSON with concept drift detection results'
    },
    outputSchema: {
      type: 'object',
      required: ['driftDetected', 'labelSufficient'],
      properties: {
        driftDetected: { type: 'boolean' },
        labelSufficient: { type: 'boolean' },
        driftMagnitude: { type: 'number' },
        driftPoint: { type: 'string' },
        driftType: { type: 'string', enum: ['abrupt', 'gradual', 'incremental', 'recurring'] },
        primaryDetectionMethod: { type: 'string' },
        confidence: { type: 'number' },
        severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
        visualizations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-monitoring', 'concept-drift', 'drift-detection']
}));

// Task 7.1: Segment Analysis
export const segmentAnalysisTask = defineTask('segment-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze drift and performance by segment',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Fairness and Segment Analysis Expert',
      task: 'Analyze drift and performance across different data segments',
      context: {
        modelId: args.modelId,
        productionData: args.productionData,
        trainingStats: args.trainingStats,
        performanceMetrics: args.performanceMetrics,
        segmentationStrategy: args.segmentationStrategy,
        segmentDimensions: args.segmentDimensions
      },
      instructions: [
        '1. Identify segmentation dimensions (demographics, features, etc.)',
        '2. Segment production data by defined dimensions',
        '3. Calculate drift scores per segment',
        '4. Calculate performance metrics per segment',
        '5. Compare segments against overall metrics',
        '6. Identify segments with disproportionate drift',
        '7. Detect segments with performance degradation',
        '8. Check for fairness issues across segments',
        '9. Rank segments by severity of issues',
        '10. Generate segment analysis report'
      ],
      outputFormat: 'JSON with segment-level analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['segmentDriftDetected', 'affectedSegments'],
      properties: {
        segmentDriftDetected: { type: 'boolean' },
        segmentPerformanceIssues: { type: 'boolean' },
        affectedSegments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              segment: { type: 'string' },
              driftScore: { type: 'number' },
              performanceScore: { type: 'number' },
              severity: { type: 'string' },
              issue: { type: 'string' }
            }
          }
        },
        segmentMetrics: { type: 'object' },
        maxSeverity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
        fairnessIssues: { type: 'boolean' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-monitoring', 'segment-analysis', 'fairness']
}));

// Task 8.1: Root Cause Analysis
export const rootCauseAnalysisTask = defineTask('root-cause-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform root cause analysis',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior ML Engineer and Data Scientist',
      task: 'Analyze detected issues and identify root causes',
      context: {
        modelId: args.modelId,
        alerts: args.alerts,
        driftDetected: args.driftDetected,
        performanceDegraded: args.performanceDegraded,
        featureDriftAnalysis: args.featureDriftAnalysis,
        predictionDrift: args.predictionDrift,
        conceptDriftAnalysis: args.conceptDriftAnalysis,
        performanceComparison: args.performanceComparison,
        operationalMetrics: args.operationalMetrics,
        segmentAnalysis: args.segmentAnalysis,
        productionStats: args.productionStats,
        trainingStats: args.trainingStats
      },
      instructions: [
        '1. Analyze correlation between different types of drift',
        '2. Identify most impactful drifted features',
        '3. Determine if drift is causing performance issues',
        '4. Check for data quality issues as root cause',
        '5. Analyze temporal patterns (seasonal, trend)',
        '6. Check for upstream data pipeline issues',
        '7. Assess if model assumptions are violated',
        '8. Identify external factors (market changes, policy changes)',
        '9. Prioritize root causes by impact',
        '10. Generate comprehensive root cause analysis report with recommendations'
      ],
      outputFormat: 'JSON with root cause analysis and recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['primaryCauses', 'recommendations'],
      properties: {
        primaryCauses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              cause: { type: 'string' },
              confidence: { type: 'number' },
              evidence: { type: 'array', items: { type: 'string' } },
              impact: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] }
            }
          }
        },
        contributingFactors: { type: 'array', items: { type: 'string' } },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
              expectedImpact: { type: 'string' }
            }
          }
        },
        upstreamIssues: { type: 'boolean' },
        modelIssues: { type: 'boolean' },
        dataIssues: { type: 'boolean' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-monitoring', 'root-cause', 'analysis']
}));

// Task 9.1: Generate Alerts
export const generateAlertsTask = defineTask('generate-alerts', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate monitoring alerts',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SRE and Incident Management Specialist',
      task: 'Generate structured alerts for detected issues',
      context: {
        modelId: args.modelId,
        alerts: args.alerts,
        rootCauseAnalysis: args.rootCauseAnalysis,
        alertChannels: args.alertChannels,
        severityPrioritization: args.severityPrioritization
      },
      instructions: [
        '1. Review all detected issues and alerts',
        '2. Consolidate related alerts to avoid noise',
        '3. Add root cause analysis to alerts',
        '4. Include actionable recommendations',
        '5. Prioritize alerts by severity',
        '6. Format alerts for different channels',
        '7. Include relevant dashboards and reports',
        '8. Add escalation paths for critical alerts',
        '9. Generate alert summary',
        '10. Prepare alerts for notification system'
      ],
      outputFormat: 'JSON with formatted alerts ready for notification'
    },
    outputSchema: {
      type: 'object',
      required: ['alerts', 'alertCount'],
      properties: {
        alerts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
              type: { type: 'string' },
              title: { type: 'string' },
              message: { type: 'string' },
              details: { type: 'object' },
              rootCause: { type: 'string' },
              recommendations: { type: 'array', items: { type: 'string' } },
              dashboardLinks: { type: 'array', items: { type: 'string' } },
              escalationPath: { type: 'string' },
              timestamp: { type: 'string' }
            }
          }
        },
        alertCount: { type: 'number' },
        criticalAlerts: { type: 'number' },
        alertSummary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-monitoring', 'alerts', 'notification']
}));

// Task 9.2: Send Notifications
export const sendNotificationsTask = defineTask('send-notifications', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Send alert notifications',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DevOps Engineer',
      task: 'Send alerts to configured notification channels',
      context: {
        modelId: args.modelId,
        alerts: args.alerts,
        alertChannels: args.alertChannels,
        includeRecommendations: args.includeRecommendations,
        includeDashboardLinks: args.includeDashboardLinks,
        monitoringDashboard: args.monitoringDashboard
      },
      instructions: [
        '1. Format alerts for each channel (Slack, email, PagerDuty)',
        '2. Include severity-appropriate formatting',
        '3. Add action buttons/links where supported',
        '4. Include dashboard links',
        '5. Send notifications to each channel',
        '6. Handle notification failures gracefully',
        '7. Track notification delivery status',
        '8. Escalate critical alerts if needed',
        '9. Log all notification attempts',
        '10. Generate notification delivery report'
      ],
      outputFormat: 'JSON with notification delivery results'
    },
    outputSchema: {
      type: 'object',
      required: ['notificationsSent', 'deliveryStatus'],
      properties: {
        notificationsSent: { type: 'number' },
        deliveryStatus: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              channel: { type: 'string' },
              status: { type: 'string', enum: ['sent', 'failed', 'pending'] },
              alertId: { type: 'string' },
              timestamp: { type: 'string' }
            }
          }
        },
        failedNotifications: { type: 'number' },
        escalated: { type: 'boolean' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-monitoring', 'notifications', 'alerting']
}));

// Task 10.1: Retraining Recommendation
export const retrainingRecommendationTask = defineTask('retraining-recommendation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate retraining recommendation',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Platform Engineer and Decision Analyst',
      task: 'Evaluate whether model retraining is necessary and recommended',
      context: {
        modelId: args.modelId,
        driftDetected: args.driftDetected,
        performanceDegraded: args.performanceDegraded,
        alerts: args.alerts,
        rootCauseAnalysis: args.rootCauseAnalysis,
        driftSeverity: args.driftSeverity,
        retrainingConfig: args.retrainingConfig,
        lastRetrainingDate: args.lastRetrainingDate,
        modelAge: args.modelAge
      },
      instructions: [
        '1. Assess overall severity of drift and degradation',
        '2. Evaluate if retraining would address root causes',
        '3. Consider model age and last retraining date',
        '4. Check if sufficient new data is available',
        '5. Assess business impact of current performance',
        '6. Consider cost-benefit of retraining',
        '7. Evaluate urgency (immediate, scheduled, optional)',
        '8. Check retraining prerequisites are met',
        '9. Generate clear recommendation with rationale',
        '10. Provide estimated timeline and resources needed'
      ],
      outputFormat: 'JSON with retraining recommendation and decision rationale'
    },
    outputSchema: {
      type: 'object',
      required: ['recommended', 'urgency', 'reason'],
      properties: {
        recommended: { type: 'boolean' },
        approved: { type: 'boolean' },
        urgency: { type: 'string', enum: ['immediate', 'high', 'medium', 'low', 'optional'] },
        reason: { type: 'string' },
        rationale: { type: 'array', items: { type: 'string' } },
        maxSeverity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
        expectedImpact: { type: 'string' },
        estimatedTimeline: { type: 'string' },
        resourceRequirements: { type: 'object' },
        blockers: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-monitoring', 'retraining', 'recommendation']
}));

// Task 10.2: Trigger Retraining Workflow
export const triggerRetrainingWorkflowTask = defineTask('trigger-retraining-workflow', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Trigger model retraining workflow',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'MLOps Automation Engineer',
      task: 'Trigger automated model retraining workflow',
      context: {
        modelId: args.modelId,
        triggerReason: args.triggerReason,
        driftAnalysis: args.driftAnalysis,
        performanceDegradation: args.performanceDegradation,
        rootCauseAnalysis: args.rootCauseAnalysis,
        urgency: args.urgency,
        dataSource: args.dataSource
      },
      instructions: [
        '1. Prepare retraining configuration',
        '2. Identify data source for retraining',
        '3. Set retraining priority based on urgency',
        '4. Package drift and performance analysis',
        '5. Trigger retraining pipeline/workflow',
        '6. Pass context and analysis to retraining process',
        '7. Record trigger event in model registry',
        '8. Setup monitoring for retraining workflow',
        '9. Generate workflow ID for tracking',
        '10. Confirm workflow started successfully'
      ],
      outputFormat: 'JSON with workflow trigger confirmation'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'workflowId'],
      properties: {
        success: { type: 'boolean' },
        workflowId: { type: 'string' },
        workflowUrl: { type: 'string' },
        triggerTimestamp: { type: 'string' },
        priority: { type: 'string' },
        estimatedCompletionTime: { type: 'string' },
        configuration: { type: 'object' },
        errors: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-monitoring', 'retraining', 'automation']
}));

// Task 11.1: Generate Monitoring Report
export const generateMonitoringReportTask = defineTask('generate-monitoring-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive monitoring report',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Technical Writer and Data Analyst',
      task: 'Generate comprehensive monitoring and drift detection report',
      context: {
        modelId: args.modelId,
        modelVersion: args.modelVersion,
        monitoringPeriod: args.monitoringPeriod,
        driftAnalysis: args.driftAnalysis,
        performanceAnalysis: args.performanceAnalysis,
        alerts: args.alerts,
        rootCauseAnalysis: args.rootCauseAnalysis,
        retrainingRecommendation: args.retrainingRecommendation,
        retrainingTriggered: args.retrainingTriggered,
        productionStats: args.productionStats,
        trainingStats: args.trainingStats
      },
      instructions: [
        '1. Create executive summary with key findings',
        '2. Document monitoring period and data coverage',
        '3. Present drift analysis results with visualizations',
        '4. Present performance analysis and comparisons',
        '5. Detail all alerts and their severity',
        '6. Include root cause analysis findings',
        '7. Present retraining recommendation and decision',
        '8. Generate trend charts and distribution plots',
        '9. Include actionable recommendations',
        '10. Format as comprehensive markdown and HTML report',
        '11. Schedule next monitoring date',
        '12. Archive report for audit trail'
      ],
      outputFormat: 'JSON with report paths and summary'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummary'],
      properties: {
        reportPath: { type: 'string' },
        visualizationsPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        driftSummary: {
          type: 'object',
          properties: {
            featureDriftDetected: { type: 'boolean' },
            predictionDriftDetected: { type: 'boolean' },
            conceptDriftDetected: { type: 'boolean' },
            overallSeverity: { type: 'string' }
          }
        },
        performanceSummary: {
          type: 'object',
          properties: {
            degradationDetected: { type: 'boolean' },
            metricsAffected: { type: 'array', items: { type: 'string' } },
            overallHealth: { type: 'string' }
          }
        },
        nextMonitoringDate: { type: 'string' },
        reportFormat: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-monitoring', 'reporting', 'documentation']
}));

// Task 11.2: Update Model Registry
export const updateModelRegistryTask = defineTask('update-model-registry', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Update model registry with monitoring results',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'MLOps Engineer',
      task: 'Update model registry with latest monitoring results',
      context: {
        modelId: args.modelId,
        modelVersion: args.modelVersion,
        monitoringResults: args.monitoringResults,
        nextMonitoringSchedule: args.nextMonitoringSchedule
      },
      instructions: [
        '1. Connect to model registry',
        '2. Update model metadata with monitoring timestamp',
        '3. Record drift detection status',
        '4. Record performance degradation status',
        '5. Update alert history',
        '6. Set monitoring health status',
        '7. Update retraining status if triggered',
        '8. Schedule next monitoring run',
        '9. Archive monitoring report reference',
        '10. Confirm registry update successful'
      ],
      outputFormat: 'JSON with registry update confirmation'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'registryUrl'],
      properties: {
        success: { type: 'boolean' },
        registryUrl: { type: 'string' },
        updatedFields: { type: 'array', items: { type: 'string' } },
        monitoringStatus: { type: 'string', enum: ['healthy', 'warning', 'critical'] },
        nextMonitoringDate: { type: 'string' },
        errors: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ml-monitoring', 'registry', 'metadata']
}));
