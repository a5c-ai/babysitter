/**
 * @process specializations/domains/business/logistics/shipment-tracking-visibility
 * @description Real-time shipment monitoring, exception detection, and proactive customer communication through integrated visibility platforms.
 * @inputs { shipments: array, trackingProviders?: array, alertThresholds?: object, customerNotificationRules?: array }
 * @outputs { success: boolean, trackingStatus: array, exceptions: array, notifications: array, performanceMetrics: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/logistics/shipment-tracking-visibility', {
 *   shipments: [{ id: 'S001', carrier: 'FedEx', trackingNumber: '123456789', expectedDelivery: '2024-01-15' }],
 *   alertThresholds: { delayMinutes: 60, temperatureRange: { min: 32, max: 40 } }
 * });
 *
 * @references
 * - Project44: https://www.project44.com/
 * - FourKites: https://www.fourkites.com/
 * - Visibility Best Practices: https://www.supplychaindive.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    shipments = [],
    trackingProviders = [],
    alertThresholds = {},
    customerNotificationRules = [],
    monitoringInterval = 15, // minutes
    outputDir = 'shipment-tracking-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Shipment Tracking and Visibility Process');
  ctx.log('info', `Monitoring ${shipments.length} shipments`);

  // ============================================================================
  // PHASE 1: TRACKING DATA COLLECTION
  // ============================================================================

  ctx.log('info', 'Phase 1: Collecting tracking data from providers');

  const trackingCollection = await ctx.task(trackingCollectionTask, {
    shipments,
    trackingProviders,
    outputDir
  });

  artifacts.push(...trackingCollection.artifacts);

  // ============================================================================
  // PHASE 2: STATUS NORMALIZATION AND ENRICHMENT
  // ============================================================================

  ctx.log('info', 'Phase 2: Normalizing and enriching tracking status');

  const statusNormalization = await ctx.task(statusNormalizationTask, {
    rawTrackingData: trackingCollection.rawData,
    shipments,
    outputDir
  });

  artifacts.push(...statusNormalization.artifacts);

  // ============================================================================
  // PHASE 3: ETA CALCULATION AND PREDICTION
  // ============================================================================

  ctx.log('info', 'Phase 3: Calculating and predicting ETAs');

  const etaPrediction = await ctx.task(etaPredictionTask, {
    normalizedStatus: statusNormalization.normalizedStatus,
    historicalData: inputs.historicalData,
    outputDir
  });

  artifacts.push(...etaPrediction.artifacts);

  // ============================================================================
  // PHASE 4: EXCEPTION DETECTION
  // ============================================================================

  ctx.log('info', 'Phase 4: Detecting shipment exceptions');

  const exceptionDetection = await ctx.task(exceptionDetectionTask, {
    normalizedStatus: statusNormalization.normalizedStatus,
    etaPredictions: etaPrediction.predictions,
    alertThresholds,
    outputDir
  });

  artifacts.push(...exceptionDetection.artifacts);

  // Quality Gate: Review critical exceptions
  if (exceptionDetection.criticalExceptions.length > 0) {
    await ctx.breakpoint({
      question: `${exceptionDetection.criticalExceptions.length} critical exceptions detected. Review and take action?`,
      title: 'Critical Shipment Exceptions',
      context: {
        runId: ctx.runId,
        criticalExceptions: exceptionDetection.criticalExceptions,
        totalExceptions: exceptionDetection.allExceptions.length,
        files: exceptionDetection.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 5: ROOT CAUSE ANALYSIS FOR EXCEPTIONS
  // ============================================================================

  ctx.log('info', 'Phase 5: Analyzing exception root causes');

  const rootCauseAnalysis = await ctx.task(exceptionRootCauseTask, {
    exceptions: exceptionDetection.allExceptions,
    trackingHistory: statusNormalization.trackingHistory,
    outputDir
  });

  artifacts.push(...rootCauseAnalysis.artifacts);

  // ============================================================================
  // PHASE 6: CUSTOMER NOTIFICATION GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Generating customer notifications');

  const customerNotifications = await ctx.task(customerNotificationTask, {
    shipmentStatus: statusNormalization.normalizedStatus,
    exceptions: exceptionDetection.allExceptions,
    etaPredictions: etaPrediction.predictions,
    notificationRules: customerNotificationRules,
    outputDir
  });

  artifacts.push(...customerNotifications.artifacts);

  // ============================================================================
  // PHASE 7: CARRIER PERFORMANCE MONITORING
  // ============================================================================

  ctx.log('info', 'Phase 7: Monitoring carrier performance');

  const carrierPerformance = await ctx.task(carrierPerformanceTask, {
    shipmentStatus: statusNormalization.normalizedStatus,
    exceptions: exceptionDetection.allExceptions,
    etaPredictions: etaPrediction.predictions,
    outputDir
  });

  artifacts.push(...carrierPerformance.artifacts);

  // ============================================================================
  // PHASE 8: VISIBILITY DASHBOARD UPDATE
  // ============================================================================

  ctx.log('info', 'Phase 8: Updating visibility dashboard');

  const dashboardUpdate = await ctx.task(dashboardUpdateTask, {
    shipmentStatus: statusNormalization.normalizedStatus,
    exceptions: exceptionDetection.allExceptions,
    etaPredictions: etaPrediction.predictions,
    carrierPerformance: carrierPerformance.metrics,
    outputDir
  });

  artifacts.push(...dashboardUpdate.artifacts);

  // ============================================================================
  // PHASE 9: GENERATE TRACKING REPORT
  // ============================================================================

  ctx.log('info', 'Phase 9: Generating tracking report');

  const trackingReport = await ctx.task(trackingReportTask, {
    shipmentCount: shipments.length,
    statusSummary: statusNormalization.statusSummary,
    exceptions: exceptionDetection.allExceptions,
    carrierPerformance: carrierPerformance.metrics,
    notifications: customerNotifications.sentNotifications,
    outputDir
  });

  artifacts.push(...trackingReport.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Shipment tracking complete. ${shipments.length} shipments monitored, ${exceptionDetection.allExceptions.length} exceptions detected, ${customerNotifications.sentNotifications.length} notifications sent. Review summary?`,
    title: 'Shipment Tracking Summary',
    context: {
      runId: ctx.runId,
      summary: {
        shipmentsMonitored: shipments.length,
        onTimeShipments: statusNormalization.statusSummary.onTime,
        delayedShipments: statusNormalization.statusSummary.delayed,
        exceptionsDetected: exceptionDetection.allExceptions.length,
        notificationsSent: customerNotifications.sentNotifications.length
      },
      files: [
        { path: trackingReport.reportPath, format: 'markdown', label: 'Tracking Report' },
        { path: dashboardUpdate.dashboardPath, format: 'json', label: 'Dashboard Data' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    trackingStatus: statusNormalization.normalizedStatus,
    exceptions: exceptionDetection.allExceptions,
    notifications: customerNotifications.sentNotifications,
    performanceMetrics: {
      onTimePercentage: carrierPerformance.metrics.onTimePercentage,
      averageTransitTime: carrierPerformance.metrics.averageTransitTime,
      exceptionRate: carrierPerformance.metrics.exceptionRate
    },
    etaPredictions: etaPrediction.predictions,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/business/logistics/shipment-tracking-visibility',
      timestamp: startTime,
      shipmentsMonitored: shipments.length,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const trackingCollectionTask = defineTask('tracking-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Collect tracking data from providers',
  agent: {
    name: 'tracking-data-collector',
    prompt: {
      role: 'Tracking Data Collection Specialist',
      task: 'Collect real-time tracking data from multiple providers',
      context: args,
      instructions: [
        'Query tracking APIs for each shipment',
        'Collect GPS location data',
        'Gather milestone events',
        'Collect temperature/condition data if available',
        'Handle API errors gracefully',
        'Record data collection timestamps',
        'Identify missing tracking data',
        'Aggregate all tracking information'
      ],
      outputFormat: 'JSON with raw tracking data'
    },
    outputSchema: {
      type: 'object',
      required: ['rawData', 'artifacts'],
      properties: {
        rawData: { type: 'array' },
        collectionErrors: { type: 'array' },
        missingTracking: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'tracking', 'data-collection']
}));

export const statusNormalizationTask = defineTask('status-normalization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Normalize and enrich tracking status',
  agent: {
    name: 'status-normalization-specialist',
    prompt: {
      role: 'Status Normalization Specialist',
      task: 'Normalize tracking status across carriers and enrich with context',
      context: args,
      instructions: [
        'Map carrier-specific status codes to standard codes',
        'Normalize timestamps to UTC',
        'Enrich with location details',
        'Calculate transit progress percentage',
        'Determine current shipment phase',
        'Build tracking history timeline',
        'Generate status summary',
        'Identify status anomalies'
      ],
      outputFormat: 'JSON with normalized status data'
    },
    outputSchema: {
      type: 'object',
      required: ['normalizedStatus', 'statusSummary', 'artifacts'],
      properties: {
        normalizedStatus: { type: 'array' },
        statusSummary: { type: 'object' },
        trackingHistory: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'tracking', 'normalization']
}));

export const etaPredictionTask = defineTask('eta-prediction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate and predict ETAs',
  agent: {
    name: 'eta-prediction-specialist',
    prompt: {
      role: 'ETA Prediction Specialist',
      task: 'Calculate current ETAs and predict delivery times',
      context: args,
      instructions: [
        'Calculate remaining distance',
        'Analyze current transit speed',
        'Consider historical lane performance',
        'Factor in weather conditions',
        'Account for traffic patterns',
        'Calculate ETA confidence interval',
        'Compare to original commitment',
        'Generate ETA predictions'
      ],
      outputFormat: 'JSON with ETA predictions'
    },
    outputSchema: {
      type: 'object',
      required: ['predictions', 'artifacts'],
      properties: {
        predictions: { type: 'array' },
        etaChanges: { type: 'array' },
        predictionConfidence: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'tracking', 'eta-prediction']
}));

export const exceptionDetectionTask = defineTask('exception-detection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Detect shipment exceptions',
  agent: {
    name: 'exception-detection-specialist',
    prompt: {
      role: 'Exception Detection Specialist',
      task: 'Detect and classify shipment exceptions',
      context: args,
      instructions: [
        'Compare ETA to commitment date',
        'Detect delays exceeding threshold',
        'Identify temperature excursions',
        'Detect route deviations',
        'Identify missed pickups',
        'Detect delivery failures',
        'Classify exception severity',
        'Prioritize critical exceptions'
      ],
      outputFormat: 'JSON with detected exceptions'
    },
    outputSchema: {
      type: 'object',
      required: ['allExceptions', 'criticalExceptions', 'artifacts'],
      properties: {
        allExceptions: { type: 'array' },
        criticalExceptions: { type: 'array' },
        exceptionsByType: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'tracking', 'exception-detection']
}));

export const exceptionRootCauseTask = defineTask('exception-root-cause', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze exception root causes',
  agent: {
    name: 'root-cause-analyst',
    prompt: {
      role: 'Root Cause Analysis Specialist',
      task: 'Analyze root causes of shipment exceptions',
      context: args,
      instructions: [
        'Analyze tracking history for patterns',
        'Identify delay causes (weather, traffic, carrier)',
        'Correlate with external events',
        'Identify systemic issues',
        'Categorize root causes',
        'Assess preventability',
        'Generate root cause report',
        'Recommend preventive actions'
      ],
      outputFormat: 'JSON with root cause analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['rootCauses', 'artifacts'],
      properties: {
        rootCauses: { type: 'array' },
        rootCauseDistribution: { type: 'object' },
        preventableExceptions: { type: 'array' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'tracking', 'root-cause']
}));

export const customerNotificationTask = defineTask('customer-notification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate customer notifications',
  agent: {
    name: 'customer-notification-specialist',
    prompt: {
      role: 'Customer Notification Specialist',
      task: 'Generate and send proactive customer notifications',
      context: args,
      instructions: [
        'Apply notification rules',
        'Generate delay notifications',
        'Create delivery confirmation messages',
        'Generate ETA updates',
        'Create exception alerts',
        'Personalize notifications',
        'Select appropriate channels',
        'Track notification delivery'
      ],
      outputFormat: 'JSON with notification details'
    },
    outputSchema: {
      type: 'object',
      required: ['sentNotifications', 'artifacts'],
      properties: {
        sentNotifications: { type: 'array' },
        pendingNotifications: { type: 'array' },
        notificationsByType: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'tracking', 'notifications']
}));

export const carrierPerformanceTask = defineTask('carrier-performance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Monitor carrier performance',
  agent: {
    name: 'carrier-performance-analyst',
    prompt: {
      role: 'Carrier Performance Analyst',
      task: 'Monitor and analyze carrier performance metrics',
      context: args,
      instructions: [
        'Calculate on-time delivery percentage',
        'Calculate average transit time',
        'Calculate exception rate',
        'Track tender acceptance rate',
        'Monitor tracking data quality',
        'Compare to SLA targets',
        'Rank carriers by performance',
        'Generate performance scorecard'
      ],
      outputFormat: 'JSON with carrier performance metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'artifacts'],
      properties: {
        metrics: { type: 'object' },
        carrierRankings: { type: 'array' },
        slaViolations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'tracking', 'carrier-performance']
}));

export const dashboardUpdateTask = defineTask('dashboard-update', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Update visibility dashboard',
  agent: {
    name: 'dashboard-specialist',
    prompt: {
      role: 'Dashboard Update Specialist',
      task: 'Update real-time visibility dashboard',
      context: args,
      instructions: [
        'Update shipment status map',
        'Refresh exception summary',
        'Update carrier performance charts',
        'Refresh ETA timelines',
        'Update KPI metrics',
        'Generate dashboard data payload',
        'Create visualization data',
        'Export dashboard snapshot'
      ],
      outputFormat: 'JSON with dashboard data'
    },
    outputSchema: {
      type: 'object',
      required: ['dashboardPath', 'artifacts'],
      properties: {
        dashboardPath: { type: 'string' },
        dashboardData: { type: 'object' },
        visualizations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'tracking', 'dashboard']
}));

export const trackingReportTask = defineTask('tracking-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate tracking report',
  agent: {
    name: 'tracking-report-specialist',
    prompt: {
      role: 'Tracking Report Specialist',
      task: 'Generate comprehensive shipment tracking report',
      context: args,
      instructions: [
        'Summarize tracking activity',
        'Report on exceptions',
        'Include carrier performance',
        'Document notifications sent',
        'Highlight critical issues',
        'Provide recommendations',
        'Generate executive summary',
        'Create detailed report'
      ],
      outputFormat: 'JSON with report details'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyMetrics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'tracking', 'reporting']
}));
