/**
 * @process data-engineering-analytics/data-quality-framework
 * @description Implement comprehensive data quality framework with dimensions, validation rules, monitoring, alerting, anomaly detection, and data profiling
 * @inputs { dataSources: array, qualityDimensions?: array, validationRules?: object, thresholds?: object, monitoringEnabled?: boolean, alertingConfig?: object, profilingEnabled?: boolean }
 * @outputs { success: boolean, qualityScore: number, dimensionScores: object, validationResults: object, anomaliesDetected: array, profileReport: object, alerts: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('data-engineering-analytics/data-quality-framework', {
 *   dataSources: [
 *     { type: 'database', connection: 'postgres://...', tables: ['users', 'orders'] },
 *     { type: 'file', path: 'data/transactions.parquet' }
 *   ],
 *   qualityDimensions: ['accuracy', 'completeness', 'consistency', 'validity', 'timeliness', 'uniqueness'],
 *   validationRules: {
 *     accuracy: ['no_outliers_beyond_3_std', 'reference_data_match'],
 *     completeness: ['required_fields_present', 'no_null_in_critical_columns'],
 *     consistency: ['cross_table_integrity', 'format_consistency'],
 *     validity: ['email_format', 'positive_amounts', 'valid_date_ranges'],
 *     timeliness: ['data_age_within_24h', 'no_future_dates'],
 *     uniqueness: ['primary_key_unique', 'no_duplicate_records']
 *   },
 *   thresholds: {
 *     critical: 95,
 *     warning: 85,
 *     minimum: 70
 *   },
 *   monitoringEnabled: true,
 *   alertingConfig: {
 *     channels: ['email', 'slack'],
 *     recipients: ['data-team@company.com'],
 *     severityLevels: ['critical', 'high']
 *   },
 *   profilingEnabled: true
 * });
 *
 * @references
 * - Great Expectations: https://greatexpectations.io/
 * - dbt Tests: https://docs.getdbt.com/docs/build/tests
 * - Data Quality Dimensions: https://www.dataversity.net/six-key-dimensions-data-quality/
 * - Anomaly Detection: https://scikit-learn.org/stable/modules/outlier_detection.html
 * - Data Profiling: https://github.com/ydataai/ydata-profiling
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    dataSources = [],
    qualityDimensions = ['accuracy', 'completeness', 'consistency', 'validity', 'timeliness', 'uniqueness'],
    validationRules = {},
    thresholds = { critical: 95, warning: 85, minimum: 70 },
    monitoringEnabled = true,
    alertingConfig = { channels: ['slack'], recipients: [], severityLevels: ['critical', 'high'] },
    profilingEnabled = true,
    outputDir = 'data-quality-output',
    greatExpectationsConfig = null,
    dbtProjectPath = null
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const alerts = [];
  const dimensionScores = {};
  const validationResults = {};

  ctx.log('info', `Starting Data Quality Framework with ${qualityDimensions.length} dimensions`);

  // ============================================================================
  // PHASE 1: DATA SOURCE INITIALIZATION AND DISCOVERY
  // ============================================================================

  ctx.log('info', 'Phase 1: Initializing and discovering data sources');

  const sourceDiscovery = await ctx.task(dataSourceDiscoveryTask, {
    dataSources,
    outputDir
  });

  if (!sourceDiscovery.success || sourceDiscovery.accessibleSources.length === 0) {
    return {
      success: false,
      error: 'No accessible data sources found',
      details: sourceDiscovery,
      metadata: { processId: 'data-engineering-analytics/data-quality-framework', timestamp: startTime }
    };
  }

  artifacts.push(...sourceDiscovery.artifacts);

  // ============================================================================
  // PHASE 2: DATA PROFILING (if enabled)
  // ============================================================================

  let profilingReport = null;
  if (profilingEnabled) {
    ctx.log('info', 'Phase 2: Generating comprehensive data profile');

    profilingReport = await ctx.task(dataProfilingTask, {
      dataSources: sourceDiscovery.accessibleSources,
      outputDir
    });

    artifacts.push(...profilingReport.artifacts);

    // Profile-based anomaly detection
    if (profilingReport.anomaliesDetected && profilingReport.anomaliesDetected.length > 0) {
      ctx.log('warn', `Data profiling detected ${profilingReport.anomaliesDetected.length} anomalies`);
    }
  }

  // ============================================================================
  // PHASE 3: PARALLEL QUALITY DIMENSION VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Running parallel validation for all quality dimensions');

  const dimensionTasks = [];
  const dimensionTaskMap = {};

  // Accuracy validation
  if (qualityDimensions.includes('accuracy')) {
    dimensionTasks.push(() => ctx.task(accuracyValidationTask, {
      dataSources: sourceDiscovery.accessibleSources,
      validationRules: validationRules.accuracy || [],
      profilingReport,
      outputDir
    }));
    dimensionTaskMap.accuracy = dimensionTasks.length - 1;
  }

  // Completeness validation
  if (qualityDimensions.includes('completeness')) {
    dimensionTasks.push(() => ctx.task(completenessValidationTask, {
      dataSources: sourceDiscovery.accessibleSources,
      validationRules: validationRules.completeness || [],
      outputDir
    }));
    dimensionTaskMap.completeness = dimensionTasks.length - 1;
  }

  // Consistency validation
  if (qualityDimensions.includes('consistency')) {
    dimensionTasks.push(() => ctx.task(consistencyValidationTask, {
      dataSources: sourceDiscovery.accessibleSources,
      validationRules: validationRules.consistency || [],
      outputDir
    }));
    dimensionTaskMap.consistency = dimensionTasks.length - 1;
  }

  // Validity validation
  if (qualityDimensions.includes('validity')) {
    dimensionTasks.push(() => ctx.task(validityValidationTask, {
      dataSources: sourceDiscovery.accessibleSources,
      validationRules: validationRules.validity || [],
      outputDir
    }));
    dimensionTaskMap.validity = dimensionTasks.length - 1;
  }

  // Timeliness validation
  if (qualityDimensions.includes('timeliness')) {
    dimensionTasks.push(() => ctx.task(timelinessValidationTask, {
      dataSources: sourceDiscovery.accessibleSources,
      validationRules: validationRules.timeliness || [],
      outputDir
    }));
    dimensionTaskMap.timeliness = dimensionTasks.length - 1;
  }

  // Uniqueness validation
  if (qualityDimensions.includes('uniqueness')) {
    dimensionTasks.push(() => ctx.task(uniquenessValidationTask, {
      dataSources: sourceDiscovery.accessibleSources,
      validationRules: validationRules.uniqueness || [],
      outputDir
    }));
    dimensionTaskMap.uniqueness = dimensionTasks.length - 1;
  }

  const dimensionResults = await ctx.parallel.all(dimensionTasks);

  // Map results back to dimension names
  for (const [dimension, index] of Object.entries(dimensionTaskMap)) {
    validationResults[dimension] = dimensionResults[index];
    dimensionScores[dimension] = dimensionResults[index].score;
    artifacts.push(...dimensionResults[index].artifacts);

    // Generate alerts for failed dimensions
    if (dimensionResults[index].score < thresholds.warning) {
      const severity = dimensionResults[index].score < thresholds.minimum ? 'critical' : 'high';
      alerts.push({
        severity,
        dimension,
        score: dimensionResults[index].score,
        threshold: dimensionResults[index].score < thresholds.minimum ? thresholds.minimum : thresholds.warning,
        issues: dimensionResults[index].criticalIssues || [],
        timestamp: ctx.now()
      });
    }
  }

  // ============================================================================
  // PHASE 4: GREAT EXPECTATIONS INTEGRATION (if configured)
  // ============================================================================

  let greatExpectationsResults = null;
  if (greatExpectationsConfig) {
    ctx.log('info', 'Phase 4: Running Great Expectations validation suites');

    greatExpectationsResults = await ctx.task(greatExpectationsTask, {
      dataSources: sourceDiscovery.accessibleSources,
      config: greatExpectationsConfig,
      outputDir
    });

    artifacts.push(...greatExpectationsResults.artifacts);

    // Integrate GE results into dimension scores
    if (greatExpectationsResults.validationResults) {
      for (const [suite, result] of Object.entries(greatExpectationsResults.validationResults)) {
        if (result.success === false) {
          alerts.push({
            severity: 'high',
            dimension: 'great_expectations',
            suite,
            successRate: result.statistics.successful_expectations / result.statistics.evaluated_expectations,
            failures: result.statistics.unsuccessful_expectations,
            timestamp: ctx.now()
          });
        }
      }
    }
  }

  // ============================================================================
  // PHASE 5: DBT TESTS INTEGRATION (if configured)
  // ============================================================================

  let dbtTestResults = null;
  if (dbtProjectPath) {
    ctx.log('info', 'Phase 5: Running dbt tests');

    dbtTestResults = await ctx.task(dbtTestsTask, {
      projectPath: dbtProjectPath,
      outputDir
    });

    artifacts.push(...dbtTestResults.artifacts);

    // Integrate dbt test failures into alerts
    if (dbtTestResults.failures && dbtTestResults.failures.length > 0) {
      alerts.push({
        severity: 'high',
        dimension: 'dbt_tests',
        failureCount: dbtTestResults.failures.length,
        totalTests: dbtTestResults.totalTests,
        failures: dbtTestResults.failures.slice(0, 10), // Top 10 failures
        timestamp: ctx.now()
      });
    }
  }

  // ============================================================================
  // PHASE 6: ANOMALY DETECTION
  // ============================================================================

  ctx.log('info', 'Phase 6: Running anomaly detection algorithms');

  const anomalyDetection = await ctx.task(anomalyDetectionTask, {
    dataSources: sourceDiscovery.accessibleSources,
    profilingReport,
    validationResults,
    outputDir
  });

  const anomaliesDetected = anomalyDetection.anomalies || [];
  artifacts.push(...anomalyDetection.artifacts);

  // Generate alerts for detected anomalies
  const criticalAnomalies = anomaliesDetected.filter(a => a.severity === 'critical');
  if (criticalAnomalies.length > 0) {
    alerts.push({
      severity: 'critical',
      dimension: 'anomaly_detection',
      anomalyCount: criticalAnomalies.length,
      anomalies: criticalAnomalies.slice(0, 5), // Top 5 critical anomalies
      timestamp: ctx.now()
    });
  }

  // ============================================================================
  // PHASE 7: OVERALL QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Phase 7: Computing overall quality score');

  const qualityScoring = await ctx.task(qualityScoringTask, {
    dimensionScores,
    validationResults,
    greatExpectationsResults,
    dbtTestResults,
    anomalyDetection,
    thresholds,
    outputDir
  });

  const overallQualityScore = qualityScoring.overallScore;
  artifacts.push(...qualityScoring.artifacts);

  // Determine quality status
  const qualityStatus = overallQualityScore >= thresholds.critical ? 'excellent' :
                        overallQualityScore >= thresholds.warning ? 'good' :
                        overallQualityScore >= thresholds.minimum ? 'acceptable' : 'poor';

  // Quality Gate: Check if minimum threshold is met
  if (overallQualityScore < thresholds.minimum) {
    await ctx.breakpoint({
      question: `Overall quality score: ${overallQualityScore}/${thresholds.minimum}. Minimum quality threshold not met. ${alerts.length} alerts generated. Review and approve to continue?`,
      title: 'Quality Threshold Not Met',
      context: {
        runId: ctx.runId,
        overallScore: overallQualityScore,
        status: qualityStatus,
        thresholds,
        dimensionScores,
        criticalAlerts: alerts.filter(a => a.severity === 'critical'),
        files: qualityScoring.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 8: MONITORING DASHBOARD SETUP (if enabled)
  // ============================================================================

  let monitoringSetup = null;
  if (monitoringEnabled) {
    ctx.log('info', 'Phase 8: Setting up quality monitoring and dashboards');

    monitoringSetup = await ctx.task(monitoringSetupTask, {
      dataSources: sourceDiscovery.accessibleSources,
      dimensionScores,
      validationResults,
      thresholds,
      outputDir
    });

    artifacts.push(...monitoringSetup.artifacts);
  }

  // ============================================================================
  // PHASE 9: ALERTING AND NOTIFICATIONS (if configured)
  // ============================================================================

  let notificationResults = null;
  if (alertingConfig && alerts.length > 0) {
    ctx.log('info', 'Phase 9: Sending quality alerts and notifications');

    // Filter alerts by severity levels in config
    const filteredAlerts = alerts.filter(a => alertingConfig.severityLevels.includes(a.severity));

    if (filteredAlerts.length > 0) {
      notificationResults = await ctx.task(alertNotificationTask, {
        alerts: filteredAlerts,
        alertingConfig,
        overallQualityScore,
        qualityStatus,
        outputDir
      });

      artifacts.push(...notificationResults.artifacts);
    }
  }

  // ============================================================================
  // PHASE 10: COMPREHENSIVE QUALITY REPORT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Generating comprehensive quality report');

  const qualityReport = await ctx.task(qualityReportGenerationTask, {
    dataSources,
    sourceDiscovery,
    profilingReport,
    dimensionScores,
    validationResults,
    greatExpectationsResults,
    dbtTestResults,
    anomalyDetection,
    qualityScoring,
    monitoringSetup,
    alerts,
    thresholds,
    outputDir
  });

  artifacts.push(...qualityReport.artifacts);

  // ============================================================================
  // PHASE 11: REMEDIATION RECOMMENDATIONS
  // ============================================================================

  let remediationPlan = null;
  if (overallQualityScore < thresholds.critical || alerts.length > 0) {
    ctx.log('info', 'Phase 11: Generating remediation plan for quality issues');

    remediationPlan = await ctx.task(remediationPlanningTask, {
      dimensionScores,
      validationResults,
      anomaliesDetected,
      alerts,
      thresholds,
      outputDir
    });

    artifacts.push(...remediationPlan.artifacts);
  }

  // ============================================================================
  // FINAL BREAKPOINT: REVIEW AND APPROVAL
  // ============================================================================

  await ctx.breakpoint({
    question: `Data Quality Framework execution complete. Overall Score: ${overallQualityScore}/100 (${qualityStatus}). ${alerts.length} alerts generated. ${anomaliesDetected.length} anomalies detected. Review quality report and approve?`,
    title: 'Data Quality Framework Completion',
    context: {
      runId: ctx.runId,
      overallScore: overallQualityScore,
      qualityStatus,
      thresholds,
      dimensionScores,
      alertCount: alerts.length,
      criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
      anomalyCount: anomaliesDetected.length,
      sourcesAnalyzed: sourceDiscovery.accessibleSources.length,
      files: [
        { path: qualityReport.reportPath, format: 'markdown' },
        { path: `${outputDir}/quality-scorecard.json`, format: 'json' },
        { path: `${outputDir}/quality-dashboard.html`, format: 'html' },
        ...artifacts.slice(0, 5).map(a => ({ path: a.path, format: a.format || 'json' }))
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: overallQualityScore >= thresholds.minimum,
    qualityScore: overallQualityScore,
    qualityStatus,
    dimensionScores,
    validationResults: Object.keys(validationResults).reduce((acc, dim) => {
      acc[dim] = {
        score: validationResults[dim].score,
        passed: validationResults[dim].passed || 0,
        failed: validationResults[dim].failed || 0,
        totalChecks: validationResults[dim].totalChecks || 0,
        criticalIssues: validationResults[dim].criticalIssues || []
      };
      return acc;
    }, {}),
    anomaliesDetected: anomaliesDetected.map(a => ({
      type: a.type,
      severity: a.severity,
      description: a.description,
      affectedRecords: a.affectedRecords
    })),
    profileReport: profilingReport ? {
      totalRecords: profilingReport.totalRecords,
      totalColumns: profilingReport.totalColumns,
      dataTypes: profilingReport.dataTypes,
      qualityInsights: profilingReport.qualityInsights
    } : null,
    alerts: alerts.map(a => ({
      severity: a.severity,
      dimension: a.dimension,
      description: a.description || `${a.dimension} score below threshold`,
      timestamp: a.timestamp
    })),
    greatExpectations: greatExpectationsResults ? {
      suitesRun: greatExpectationsResults.suitesRun,
      totalExpectations: greatExpectationsResults.totalExpectations,
      passed: greatExpectationsResults.passed,
      failed: greatExpectationsResults.failed
    } : null,
    dbtTests: dbtTestResults ? {
      totalTests: dbtTestResults.totalTests,
      passed: dbtTestResults.passed,
      failed: dbtTestResults.failures.length,
      passRate: dbtTestResults.passRate
    } : null,
    monitoring: monitoringSetup ? {
      enabled: true,
      dashboardUrl: monitoringSetup.dashboardUrl,
      metricsEndpoint: monitoringSetup.metricsEndpoint
    } : { enabled: false },
    remediationPlan: remediationPlan ? remediationPlan.actionItems : null,
    artifacts,
    metadata: {
      processId: 'data-engineering-analytics/data-quality-framework',
      timestamp: startTime,
      duration,
      sourcesAnalyzed: sourceDiscovery.accessibleSources.length,
      dimensionsEvaluated: qualityDimensions.length,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

/**
 * Task 1: Data Source Discovery
 */
export const dataSourceDiscoveryTask = defineTask('data-source-discovery', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Discover and validate data sources',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'data engineer specializing in data quality and validation',
      task: 'Discover, validate, and assess data sources for quality framework',
      context: {
        dataSources: args.dataSources,
        outputDir: args.outputDir
      },
      instructions: [
        '1. For each data source, verify accessibility and connectivity',
        '2. Identify data formats, schemas, and structures',
        '3. Estimate data volume and complexity',
        '4. Check for any immediate data quality red flags',
        '5. Categorize sources by type (database, file, API, streaming)',
        '6. Generate source metadata and statistics',
        '7. Create source discovery report',
        '8. Return list of accessible sources for quality validation'
      ],
      outputFormat: 'JSON with success, accessibleSources, inaccessibleSources, sourceMetadata, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'accessibleSources', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        accessibleSources: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              path: { type: 'string' },
              recordCount: { type: 'number' },
              columnCount: { type: 'number' },
              sizeBytes: { type: 'number' }
            }
          }
        },
        inaccessibleSources: { type: 'array' },
        sourceMetadata: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['data-quality', 'discovery', 'validation']
}));

/**
 * Task 2: Data Profiling
 */
export const dataProfilingTask = defineTask('data-profiling', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive data profile',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'data analyst specializing in data profiling and EDA',
      task: 'Generate comprehensive data profile with statistics, distributions, and quality insights',
      context: {
        dataSources: args.dataSources,
        outputDir: args.outputDir
      },
      instructions: [
        '1. For each data source, compute summary statistics (count, mean, std, min, max, percentiles)',
        '2. Analyze data types and infer semantic types (email, phone, date, etc.)',
        '3. Calculate cardinality, uniqueness, and missing value percentages',
        '4. Generate distributions and histograms for numeric columns',
        '5. Create frequency tables for categorical columns',
        '6. Detect correlations between columns',
        '7. Identify potential outliers and anomalies using statistical methods',
        '8. Calculate data quality metrics (completeness, validity, uniqueness)',
        '9. Generate interactive HTML profile report (like ydata-profiling)',
        '10. Save profiling metadata and artifacts'
      ],
      outputFormat: 'JSON with totalRecords, totalColumns, dataTypes, statistics, correlations, anomaliesDetected, qualityInsights, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalRecords', 'totalColumns', 'artifacts'],
      properties: {
        totalRecords: { type: 'number' },
        totalColumns: { type: 'number' },
        dataTypes: { type: 'object' },
        statistics: { type: 'object' },
        correlations: { type: 'array' },
        anomaliesDetected: { type: 'array' },
        qualityInsights: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['data-profiling', 'statistics', 'eda']
}));

/**
 * Task 3: Accuracy Validation
 */
export const accuracyValidationTask = defineTask('accuracy-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate data accuracy',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'data quality analyst specializing in accuracy assessment',
      task: 'Validate data accuracy through reference data matching, outlier detection, and business rule validation',
      context: {
        dataSources: args.dataSources,
        validationRules: args.validationRules,
        profilingReport: args.profilingReport,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Compare data against reference datasets or golden sources if available',
        '2. Detect outliers using statistical methods (z-score, IQR, isolation forest)',
        '3. Validate data against expected ranges and business rules',
        '4. Check for logical inconsistencies (e.g., age > 150)',
        '5. Validate calculated fields and derived metrics',
        '6. Assess data precision and rounding errors',
        '7. Calculate accuracy score (0-100) based on conformance to expected values',
        '8. Generate accuracy validation report with specific issues',
        '9. Provide recommendations for improving accuracy'
      ],
      outputFormat: 'JSON with score, passed, failed, totalChecks, outliers, referenceMatches, criticalIssues, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'totalChecks', 'artifacts'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        passed: { type: 'number' },
        failed: { type: 'number' },
        totalChecks: { type: 'number' },
        outliers: { type: 'array' },
        referenceMatches: { type: 'object' },
        criticalIssues: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['data-quality', 'accuracy', 'validation']
}));

/**
 * Task 4: Completeness Validation
 */
export const completenessValidationTask = defineTask('completeness-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate data completeness',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'data quality analyst specializing in completeness assessment',
      task: 'Assess data completeness by detecting missing values, null patterns, and incomplete records',
      context: {
        dataSources: args.dataSources,
        validationRules: args.validationRules,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Count and analyze missing values (NULL, empty string, NA, etc.) per column',
        '2. Calculate missing value percentage for each column',
        '3. Identify required fields with missing values (critical)',
        '4. Detect missing value patterns (MCAR, MAR, MNAR)',
        '5. Check for incomplete records (partially filled rows)',
        '6. Validate presence of mandatory fields from validation rules',
        '7. Assess impact of missing data on downstream analytics',
        '8. Calculate completeness score (0-100) based on data availability',
        '9. Generate completeness report with heatmap of missing values',
        '10. Recommend imputation strategies for missing data'
      ],
      outputFormat: 'JSON with score, passed, failed, totalChecks, missingValueStats, criticalColumns, patterns, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'totalChecks', 'artifacts'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        passed: { type: 'number' },
        failed: { type: 'number' },
        totalChecks: { type: 'number' },
        missingValueStats: { type: 'object' },
        criticalColumns: { type: 'array', items: { type: 'string' } },
        patterns: { type: 'object' },
        criticalIssues: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['data-quality', 'completeness', 'validation']
}));

/**
 * Task 5: Consistency Validation
 */
export const consistencyValidationTask = defineTask('consistency-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate data consistency',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'data quality analyst specializing in consistency validation',
      task: 'Validate data consistency across sources, tables, and within datasets',
      context: {
        dataSources: args.dataSources,
        validationRules: args.validationRules,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Check referential integrity across related tables (foreign key constraints)',
        '2. Validate cross-table consistency (e.g., sum of parts equals whole)',
        '3. Check format consistency (dates, phone numbers, addresses)',
        '4. Validate data type consistency within columns',
        '5. Check for contradictory values across columns',
        '6. Validate temporal consistency (start_date < end_date)',
        '7. Check for duplicate records with conflicting values',
        '8. Assess naming convention consistency',
        '9. Calculate consistency score (0-100) based on violations',
        '10. Generate consistency violation report with examples'
      ],
      outputFormat: 'JSON with score, passed, failed, totalChecks, violations, integrityIssues, criticalIssues, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'totalChecks', 'artifacts'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        passed: { type: 'number' },
        failed: { type: 'number' },
        totalChecks: { type: 'number' },
        violations: { type: 'array' },
        integrityIssues: { type: 'object' },
        criticalIssues: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['data-quality', 'consistency', 'validation']
}));

/**
 * Task 6: Validity Validation
 */
export const validityValidationTask = defineTask('validity-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate data validity',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'data quality analyst specializing in validity rules',
      task: 'Validate data values against domain rules, constraints, and format specifications',
      context: {
        dataSources: args.dataSources,
        validationRules: args.validationRules,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Validate data against schema constraints (NOT NULL, CHECK, UNIQUE)',
        '2. Check domain validity (values within allowed ranges)',
        '3. Validate format rules (email regex, phone format, zip code format)',
        '4. Check enum/categorical values against allowed sets',
        '5. Validate date ranges and temporal constraints',
        '6. Check numeric constraints (positive amounts, valid percentages)',
        '7. Validate business rules from validationRules parameter',
        '8. Assess data type validity (numeric values in numeric columns)',
        '9. Calculate validity score (0-100) based on rule compliance',
        '10. Generate validity violation report with rule breaches'
      ],
      outputFormat: 'JSON with score, passed, failed, totalChecks, violationsByRule, invalidRecords, criticalIssues, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'totalChecks', 'artifacts'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        passed: { type: 'number' },
        failed: { type: 'number' },
        totalChecks: { type: 'number' },
        violationsByRule: { type: 'array' },
        invalidRecords: { type: 'number' },
        criticalIssues: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['data-quality', 'validity', 'validation']
}));

/**
 * Task 7: Timeliness Validation
 */
export const timelinessValidationTask = defineTask('timeliness-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate data timeliness',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'data quality analyst specializing in temporal data assessment',
      task: 'Assess data timeliness, freshness, and currency',
      context: {
        dataSources: args.dataSources,
        validationRules: args.validationRules,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Check data source last modified/updated timestamps',
        '2. Analyze timestamp columns for data recency',
        '3. Identify stale data based on validation rules',
        '4. Detect future dates (data quality issue)',
        '5. Check for gaps in time-series data',
        '6. Validate SLA compliance for data delivery',
        '7. Assess if data is current enough for business needs',
        '8. Calculate data lag (time between event and availability)',
        '9. Calculate timeliness score (0-100) based on freshness',
        '10. Generate timeliness report with freshness metrics'
      ],
      outputFormat: 'JSON with score, passed, failed, totalChecks, freshnessStatus, dataLag, staleRecords, criticalIssues, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'totalChecks', 'artifacts'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        passed: { type: 'number' },
        failed: { type: 'number' },
        totalChecks: { type: 'number' },
        freshnessStatus: { type: 'string' },
        dataLag: { type: 'string' },
        staleRecords: { type: 'number' },
        criticalIssues: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['data-quality', 'timeliness', 'validation']
}));

/**
 * Task 8: Uniqueness Validation
 */
export const uniquenessValidationTask = defineTask('uniqueness-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate data uniqueness',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'data quality analyst specializing in duplicate detection',
      task: 'Detect duplicate records and validate uniqueness constraints',
      context: {
        dataSources: args.dataSources,
        validationRules: args.validationRules,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify primary key columns and check for duplicates',
        '2. Detect exact duplicate rows (all columns identical)',
        '3. Find fuzzy duplicates using similarity algorithms',
        '4. Check uniqueness constraints from validation rules',
        '5. Analyze duplicate patterns (which fields cause duplicates)',
        '6. Detect near-duplicates with minor variations',
        '7. Count duplicate records per source',
        '8. Assess impact of duplicates on data integrity',
        '9. Calculate uniqueness score (0-100) based on duplicate percentage',
        '10. Generate deduplication recommendations and strategies'
      ],
      outputFormat: 'JSON with score, passed, failed, totalChecks, duplicates, duplicatePatterns, criticalIssues, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'totalChecks', 'artifacts'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        passed: { type: 'number' },
        failed: { type: 'number' },
        totalChecks: { type: 'number' },
        duplicates: { type: 'object' },
        duplicatePatterns: { type: 'array' },
        criticalIssues: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['data-quality', 'uniqueness', 'deduplication']
}));

/**
 * Task 9: Great Expectations Integration
 */
export const greatExpectationsTask = defineTask('great-expectations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run Great Expectations validation suites',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'data engineer specializing in Great Expectations framework',
      task: 'Execute Great Expectations validation suites and generate data docs',
      context: {
        dataSources: args.dataSources,
        config: args.config,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Initialize or load Great Expectations context',
        '2. Configure data sources and datasources',
        '3. Load or create expectation suites from config',
        '4. Run validation for each suite against data sources',
        '5. Collect validation results and statistics',
        '6. Generate Data Docs (HTML documentation)',
        '7. Parse validation results for failures and warnings',
        '8. Calculate suite-level success rates',
        '9. Extract failed expectations with details',
        '10. Save validation results and data docs artifacts'
      ],
      outputFormat: 'JSON with success, suitesRun, totalExpectations, passed, failed, validationResults, dataDocsPath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'suitesRun', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        suitesRun: { type: 'number' },
        totalExpectations: { type: 'number' },
        passed: { type: 'number' },
        failed: { type: 'number' },
        validationResults: { type: 'object' },
        dataDocsPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['data-quality', 'great-expectations', 'validation']
}));

/**
 * Task 10: dbt Tests Integration
 */
export const dbtTestsTask = defineTask('dbt-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run dbt tests',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'analytics engineer specializing in dbt',
      task: 'Execute dbt tests and collect results for data quality validation',
      context: {
        projectPath: args.projectPath,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Navigate to dbt project directory',
        '2. Run dbt test command to execute all tests',
        '3. Parse test results from output',
        '4. Categorize tests by type (schema tests, data tests, custom tests)',
        '5. Collect failed tests with error messages',
        '6. Calculate test pass rate',
        '7. Generate test results summary',
        '8. Extract test coverage metrics',
        '9. Save test results and logs',
        '10. Return structured test results for integration'
      ],
      outputFormat: 'JSON with success, totalTests, passed, failures, passRate, testsByType, testCoverage, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'totalTests', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        totalTests: { type: 'number' },
        passed: { type: 'number' },
        failures: { type: 'array' },
        passRate: { type: 'number' },
        testsByType: { type: 'object' },
        testCoverage: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['data-quality', 'dbt', 'testing']
}));

/**
 * Task 11: Anomaly Detection
 */
export const anomalyDetectionTask = defineTask('anomaly-detection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Detect data anomalies',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'data scientist specializing in anomaly detection',
      task: 'Detect anomalies in data using statistical and machine learning methods',
      context: {
        dataSources: args.dataSources,
        profilingReport: args.profilingReport,
        validationResults: args.validationResults,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Apply statistical anomaly detection (Z-score, IQR method)',
        '2. Use machine learning algorithms (Isolation Forest, LOF, One-Class SVM)',
        '3. Detect temporal anomalies in time-series data',
        '4. Identify multivariate anomalies across columns',
        '5. Find distribution shifts and data drift',
        '6. Detect sudden spikes or drops in metrics',
        '7. Classify anomalies by severity (critical, high, medium, low)',
        '8. Calculate anomaly scores and confidence levels',
        '9. Generate anomaly report with visualizations',
        '10. Provide recommendations for addressing anomalies'
      ],
      outputFormat: 'JSON with anomalies, anomalyCount, severityBreakdown, methods, confidence, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['anomalies', 'anomalyCount', 'artifacts'],
      properties: {
        anomalies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              severity: { type: 'string' },
              description: { type: 'string' },
              affectedRecords: { type: 'number' },
              confidence: { type: 'number' },
              method: { type: 'string' }
            }
          }
        },
        anomalyCount: { type: 'number' },
        severityBreakdown: { type: 'object' },
        methods: { type: 'array', items: { type: 'string' } },
        confidence: { type: 'number' },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['data-quality', 'anomaly-detection', 'ml']
}));

/**
 * Task 12: Quality Scoring
 */
export const qualityScoringTask = defineTask('quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compute overall quality score',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior data quality engineer',
      task: 'Compute weighted overall data quality score from all validation dimensions',
      context: {
        dimensionScores: args.dimensionScores,
        validationResults: args.validationResults,
        greatExpectationsResults: args.greatExpectationsResults,
        dbtTestResults: args.dbtTestResults,
        anomalyDetection: args.anomalyDetection,
        thresholds: args.thresholds,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Aggregate scores from quality dimensions',
        '2. Apply weighted scoring: Accuracy (20%), Completeness (20%), Consistency (20%), Validity (20%), Timeliness (10%), Uniqueness (10%)',
        '3. Incorporate Great Expectations results (bonus/penalty)',
        '4. Factor in dbt test results (bonus/penalty)',
        '5. Apply anomaly detection penalties for critical anomalies',
        '6. Compute overall quality score (0-100)',
        '7. Compare against thresholds (critical, warning, minimum)',
        '8. Generate quality scorecard with dimension breakdown',
        '9. Identify areas needing improvement',
        '10. Save comprehensive quality assessment'
      ],
      outputFormat: 'JSON with overallScore, dimensionContributions, adjustments, qualityStatus, improvementAreas, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'qualityStatus', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        dimensionContributions: { type: 'object' },
        adjustments: { type: 'object' },
        qualityStatus: { type: 'string' },
        improvementAreas: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['data-quality', 'scoring', 'assessment']
}));

/**
 * Task 13: Monitoring Setup
 */
export const monitoringSetupTask = defineTask('monitoring-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Setup quality monitoring and dashboards',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'data platform engineer specializing in monitoring and observability',
      task: 'Setup continuous data quality monitoring, dashboards, and metrics tracking',
      context: {
        dataSources: args.dataSources,
        dimensionScores: args.dimensionScores,
        validationResults: args.validationResults,
        thresholds: args.thresholds,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design data quality monitoring architecture',
        '2. Setup metrics collection for quality dimensions',
        '3. Create real-time quality dashboard (HTML/JS or integrate with Grafana/Tableau)',
        '4. Configure trend tracking for quality scores over time',
        '5. Setup data lineage tracking',
        '6. Create quality SLA monitoring',
        '7. Configure automated quality checks schedule',
        '8. Setup metrics export (Prometheus, InfluxDB, etc.)',
        '9. Generate dashboard HTML and configuration files',
        '10. Document monitoring setup and access instructions'
      ],
      outputFormat: 'JSON with success, dashboardUrl, dashboardPath, metricsEndpoint, monitoringConfig, setupInstructions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        dashboardUrl: { type: 'string' },
        dashboardPath: { type: 'string' },
        metricsEndpoint: { type: 'string' },
        monitoringConfig: { type: 'object' },
        setupInstructions: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['monitoring', 'dashboard', 'observability']
}));

/**
 * Task 14: Alert Notification
 */
export const alertNotificationTask = defineTask('alert-notification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Send quality alerts and notifications',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DevOps engineer specializing in alerting and notifications',
      task: 'Send data quality alerts through configured channels',
      context: {
        alerts: args.alerts,
        alertingConfig: args.alertingConfig,
        overallQualityScore: args.overallQualityScore,
        qualityStatus: args.qualityStatus,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Format alerts based on severity and type',
        '2. Create alert messages with actionable information',
        '3. Send alerts through configured channels (email, Slack, PagerDuty, etc.)',
        '4. Include links to quality reports and dashboards',
        '5. Add context and recommended actions',
        '6. Track alert delivery status',
        '7. Generate alert summary report',
        '8. Log all notifications for audit trail',
        '9. Handle notification failures gracefully',
        '10. Return notification status and results'
      ],
      outputFormat: 'JSON with success, sentCount, failedCount, deliveryStatus, alertSummary, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'sentCount', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        sentCount: { type: 'number' },
        failedCount: { type: 'number' },
        deliveryStatus: { type: 'array' },
        alertSummary: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['alerting', 'notifications', 'monitoring']
}));

/**
 * Task 15: Quality Report Generation
 */
export const qualityReportGenerationTask = defineTask('quality-report-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive quality report',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'technical writer and data quality specialist',
      task: 'Generate comprehensive, executive-ready data quality framework report',
      context: {
        dataSources: args.dataSources,
        sourceDiscovery: args.sourceDiscovery,
        profilingReport: args.profilingReport,
        dimensionScores: args.dimensionScores,
        validationResults: args.validationResults,
        greatExpectationsResults: args.greatExpectationsResults,
        dbtTestResults: args.dbtTestResults,
        anomalyDetection: args.anomalyDetection,
        qualityScoring: args.qualityScoring,
        monitoringSetup: args.monitoringSetup,
        alerts: args.alerts,
        thresholds: args.thresholds,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create executive summary with overall quality score and status',
        '2. Document data sources analyzed',
        '3. Present quality dimension scores with visualizations',
        '4. Summarize validation results across all dimensions',
        '5. Include Great Expectations and dbt test results',
        '6. Present anomaly detection findings',
        '7. List critical alerts and issues',
        '8. Show quality trends and historical comparison if available',
        '9. Include data profiling insights',
        '10. Document monitoring setup and dashboard access',
        '11. Provide prioritized recommendations',
        '12. Format as professional Markdown report with charts',
        '13. Generate PDF version for stakeholders',
        '14. Save report and all supporting artifacts'
      ],
      outputFormat: 'JSON with reportPath, pdfPath, executiveSummary, keyFindings, criticalIssues, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'keyFindings', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        pdfPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        criticalIssues: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['reporting', 'documentation', 'quality']
}));

/**
 * Task 16: Remediation Planning
 */
export const remediationPlanningTask = defineTask('remediation-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate quality remediation plan',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior data engineer specializing in data quality improvement',
      task: 'Generate prioritized remediation plan to address quality issues',
      context: {
        dimensionScores: args.dimensionScores,
        validationResults: args.validationResults,
        anomaliesDetected: args.anomaliesDetected,
        alerts: args.alerts,
        thresholds: args.thresholds,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze all quality issues, violations, and anomalies',
        '2. Prioritize issues by severity, impact, and business criticality',
        '3. Group related issues for efficient remediation',
        '4. Generate specific, actionable remediation steps',
        '5. Estimate effort, complexity, and resources needed',
        '6. Recommend data cleaning and correction strategies',
        '7. Suggest pipeline improvements and preventive measures',
        '8. Provide code examples and tool recommendations',
        '9. Create timeline for remediation phases',
        '10. Estimate expected quality improvement per action',
        '11. Generate comprehensive remediation roadmap',
        '12. Include success metrics and validation criteria'
      ],
      outputFormat: 'JSON with actionItems, phases, estimatedTimeline, expectedImpact, preventiveMeasures, toolRecommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['actionItems', 'artifacts'],
      properties: {
        actionItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              priority: { type: 'string' },
              issue: { type: 'string' },
              dimension: { type: 'string' },
              remediation: { type: 'string' },
              estimatedEffort: { type: 'string' },
              expectedImprovement: { type: 'number' },
              codeExample: { type: 'string' },
              tools: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        phases: { type: 'array' },
        estimatedTimeline: { type: 'string' },
        expectedImpact: { type: 'object' },
        preventiveMeasures: { type: 'array', items: { type: 'string' } },
        toolRecommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['remediation', 'planning', 'quality-improvement']
}));
