/**
 * @process specializations/devops-sre-platform/log-aggregation
 * @description Log Aggregation and Analysis Pipeline - Comprehensive log collection, aggregation, parsing,
 * indexing, search, alerting, and retention management for distributed systems. Implements structured logging
 * standards, multi-source log ingestion, real-time analysis, and automated incident detection.
 * @inputs { systemName: string, logSources: array, aggregationPlatform: string, retentionDays?: number, enableAlerts?: boolean }
 * @outputs { success: boolean, logsAggregated: number, alertsConfigured: number, dashboardUrl: string, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/devops-sre-platform/log-aggregation', {
 *   systemName: 'E-commerce Platform',
 *   logSources: ['api-service', 'web-frontend', 'database', 'message-queue'],
 *   aggregationPlatform: 'ELK', // or 'Loki', 'Splunk', 'CloudWatch'
 *   retentionDays: 30,
 *   enableAlerts: true,
 *   logLevel: 'INFO',
 *   structuredFormat: 'JSON',
 *   alertThresholds: {
 *     errorRatePercent: 5.0,
 *     criticalErrorsPerMinute: 10,
 *     warningRatePercent: 15.0
 *   }
 * });
 *
 * @references
 * - ELK Stack: https://www.elastic.co/elastic-stack
 * - Grafana Loki: https://grafana.com/oss/loki/
 * - Fluentd: https://www.fluentd.org/
 * - OpenTelemetry Logs: https://opentelemetry.io/docs/concepts/signals/logs/
 * - Log Management Best Practices: https://www.datadoghq.com/blog/log-management-best-practices/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    systemName,
    logSources = [],
    aggregationPlatform = 'ELK', // ELK, Loki, Splunk, CloudWatch, Datadog
    retentionDays = 30,
    enableAlerts = true,
    logLevel = 'INFO',
    structuredFormat = 'JSON',
    alertThresholds = {
      errorRatePercent: 5.0,
      criticalErrorsPerMinute: 10,
      warningRatePercent: 15.0,
      diskUsagePercent: 85
    },
    enableParsing = true,
    enableIndexing = true,
    enableVisualization = true,
    compressionEnabled = true,
    samplingRate = 1.0, // 1.0 = 100% (no sampling)
    outputDir = 'log-aggregation-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let logsAggregated = 0;
  let alertsConfigured = 0;
  const implementations = [];

  ctx.log('info', `Starting Log Aggregation and Analysis Pipeline for ${systemName}`);
  ctx.log('info', `Platform: ${aggregationPlatform}, Sources: ${logSources.length}, Retention: ${retentionDays} days`);

  // ============================================================================
  // PHASE 1: REQUIREMENTS AND ARCHITECTURE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 1: Log aggregation requirements and architecture design');

  const requirementsResult = await ctx.task(defineLogRequirementsTask, {
    systemName,
    logSources,
    aggregationPlatform,
    retentionDays,
    logLevel,
    structuredFormat,
    outputDir
  });

  artifacts.push(...requirementsResult.artifacts);

  ctx.log('info', `Identified ${requirementsResult.logTypes.length} log types across ${requirementsResult.sourcesAnalyzed} sources`);

  // Quality Gate: Architecture review
  await ctx.breakpoint({
    question: `Log aggregation architecture designed for ${systemName}. Platform: ${aggregationPlatform}. ${requirementsResult.logTypes.length} log types identified. Review and approve architecture?`,
    title: 'Log Aggregation Architecture Review',
    context: {
      runId: ctx.runId,
      architecture: {
        platform: aggregationPlatform,
        sources: logSources.length,
        estimatedVolume: requirementsResult.estimatedVolume,
        storageRequired: requirementsResult.storageRequired,
        components: requirementsResult.components
      },
      files: requirementsResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 2: LOG COLLECTION AND FORWARDING
  // ============================================================================

  ctx.log('info', 'Phase 2: Configuring log collection and forwarding');

  const collectionResult = await ctx.task(configureLogCollectionTask, {
    systemName,
    logSources,
    aggregationPlatform,
    logLevel,
    structuredFormat,
    samplingRate,
    compressionEnabled,
    outputDir
  });

  implementations.push({
    phase: 'Log Collection',
    result: collectionResult
  });

  artifacts.push(...collectionResult.artifacts);

  ctx.log('info', `Configured log collection from ${collectionResult.sourcesConfigured} sources using ${collectionResult.collectorType}`);

  // Quality Gate: Collection configuration review
  await ctx.breakpoint({
    question: `Log collection configured for ${collectionResult.sourcesConfigured} sources. Collector: ${collectionResult.collectorType}. Review configuration?`,
    title: 'Log Collection Configuration Review',
    context: {
      runId: ctx.runId,
      collection: {
        sourcesConfigured: collectionResult.sourcesConfigured,
        collectorType: collectionResult.collectorType,
        bufferingEnabled: collectionResult.bufferingEnabled,
        compressionEnabled: collectionResult.compressionEnabled,
        samplingRate: collectionResult.samplingRate
      },
      files: collectionResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 3: LOG PARSING AND STRUCTURING
  // ============================================================================

  if (enableParsing) {
    ctx.log('info', 'Phase 3: Configuring log parsing and structuring');

    const parsingResult = await ctx.task(configureLogParsingTask, {
      systemName,
      logSources,
      logTypes: requirementsResult.logTypes,
      structuredFormat,
      aggregationPlatform,
      outputDir
    });

    implementations.push({
      phase: 'Log Parsing',
      result: parsingResult
    });

    artifacts.push(...parsingResult.artifacts);

    ctx.log('info', `Configured ${parsingResult.parsersCreated} parsers for ${parsingResult.logTypesHandled} log types`);

    // Quality Gate: Parsing configuration review
    await ctx.breakpoint({
      question: `Log parsing configured. ${parsingResult.parsersCreated} parsers created for ${parsingResult.logTypesHandled} log types. Review parsing rules?`,
      title: 'Log Parsing Configuration Review',
      context: {
        runId: ctx.runId,
        parsing: {
          parsersCreated: parsingResult.parsersCreated,
          logTypesHandled: parsingResult.logTypesHandled,
          extractedFields: parsingResult.extractedFields,
          grokPatterns: parsingResult.grokPatterns || []
        },
        files: parsingResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 4: INDEXING AND STORAGE
  // ============================================================================

  if (enableIndexing) {
    ctx.log('info', 'Phase 4: Configuring log indexing and storage');

    const indexingResult = await ctx.task(configureLogIndexingTask, {
      systemName,
      aggregationPlatform,
      retentionDays,
      logTypes: requirementsResult.logTypes,
      estimatedVolume: requirementsResult.estimatedVolume,
      compressionEnabled,
      outputDir
    });

    implementations.push({
      phase: 'Log Indexing',
      result: indexingResult
    });

    artifacts.push(...indexingResult.artifacts);

    ctx.log('info', `Configured ${indexingResult.indicesCreated} indices with ${retentionDays}-day retention`);

    // Quality Gate: Indexing configuration review
    await ctx.breakpoint({
      question: `Log indexing configured. ${indexingResult.indicesCreated} indices created with retention policy. Review indexing strategy?`,
      title: 'Log Indexing Configuration Review',
      context: {
        runId: ctx.runId,
        indexing: {
          indicesCreated: indexingResult.indicesCreated,
          retentionDays,
          rollingStrategy: indexingResult.rollingStrategy,
          storageOptimized: indexingResult.storageOptimized,
          estimatedStorageGB: indexingResult.estimatedStorageGB
        },
        files: indexingResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 5: SEARCH AND QUERY CAPABILITIES
  // ============================================================================

  ctx.log('info', 'Phase 5: Setting up log search and query capabilities');

  const searchResult = await ctx.task(configureLogSearchTask, {
    systemName,
    aggregationPlatform,
    logTypes: requirementsResult.logTypes,
    commonQueries: requirementsResult.commonQueries || [],
    outputDir
  });

  implementations.push({
    phase: 'Log Search',
    result: searchResult
  });

  artifacts.push(...searchResult.artifacts);

  ctx.log('info', `Configured search with ${searchResult.savedQueriesCreated} saved queries`);

  // ============================================================================
  // PHASE 6: VISUALIZATION AND DASHBOARDS
  // ============================================================================

  if (enableVisualization) {
    ctx.log('info', 'Phase 6: Creating log visualization dashboards');

    const dashboardsResult = await ctx.task(createLogDashboardsTask, {
      systemName,
      aggregationPlatform,
      logSources,
      logTypes: requirementsResult.logTypes,
      outputDir
    });

    implementations.push({
      phase: 'Log Dashboards',
      result: dashboardsResult
    });

    artifacts.push(...dashboardsResult.artifacts);

    ctx.log('info', `Created ${dashboardsResult.dashboards.length} log dashboards`);

    // Quality Gate: Dashboard review
    await ctx.breakpoint({
      question: `Created ${dashboardsResult.dashboards.length} log dashboards. Dashboard URL: ${dashboardsResult.primaryDashboardUrl}. Review dashboards?`,
      title: 'Log Dashboards Review',
      context: {
        runId: ctx.runId,
        dashboards: dashboardsResult.dashboards.map(d => ({
          name: d.name,
          type: d.type,
          visualizations: d.visualizations,
          url: d.url
        })),
        files: dashboardsResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 7: ALERTING AND NOTIFICATIONS
  // ============================================================================

  if (enableAlerts) {
    ctx.log('info', 'Phase 7: Configuring log-based alerts and notifications');

    const alertingResult = await ctx.task(configureLogAlertsTask, {
      systemName,
      aggregationPlatform,
      alertThresholds,
      logTypes: requirementsResult.logTypes,
      outputDir
    });

    implementations.push({
      phase: 'Log Alerts',
      result: alertingResult
    });

    artifacts.push(...alertingResult.artifacts);
    alertsConfigured = alertingResult.alertsCreated;

    ctx.log('info', `Configured ${alertsConfigured} log-based alerts`);

    // Quality Gate: Alert configuration review
    await ctx.breakpoint({
      question: `Configured ${alertsConfigured} log-based alerts. Critical alerts: ${alertingResult.criticalAlerts.length}. Review alert configuration?`,
      title: 'Log Alerts Configuration Review',
      context: {
        runId: ctx.runId,
        alerting: {
          totalAlerts: alertsConfigured,
          criticalAlerts: alertingResult.criticalAlerts.length,
          warningAlerts: alertingResult.warningAlerts.length,
          notificationChannels: alertingResult.notificationChannels
        },
        topAlerts: alertingResult.criticalAlerts.slice(0, 10),
        files: alertingResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 8: LOG ANALYSIS AND PATTERN DETECTION
  // ============================================================================

  ctx.log('info', 'Phase 8: Setting up automated log analysis and pattern detection');

  const analysisResult = await ctx.task(configureLogAnalysisTask, {
    systemName,
    aggregationPlatform,
    logTypes: requirementsResult.logTypes,
    enableAnomalyDetection: true,
    enablePatternRecognition: true,
    outputDir
  });

  implementations.push({
    phase: 'Log Analysis',
    result: analysisResult
  });

  artifacts.push(...analysisResult.artifacts);

  ctx.log('info', `Configured ${analysisResult.analysisRules.length} automated analysis rules`);

  // ============================================================================
  // PHASE 9: TESTING AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Testing log aggregation pipeline');

  const testingResult = await ctx.task(testLogAggregationTask, {
    systemName,
    aggregationPlatform,
    logSources,
    implementations,
    collectionResult,
    indexingResult: enableIndexing ? indexingResult : null,
    outputDir
  });

  artifacts.push(...testingResult.artifacts);
  logsAggregated = testingResult.logsProcessed;

  ctx.log('info', `Pipeline testing complete. Processed ${logsAggregated} test logs. Success rate: ${testingResult.successRate}%`);

  // Quality Gate: Testing validation
  if (testingResult.successRate < 95) {
    await ctx.breakpoint({
      question: `Log aggregation pipeline success rate ${testingResult.successRate}% is below target 95%. Issues: ${testingResult.issues.length}. Review and address issues?`,
      title: 'Pipeline Testing Issues',
      context: {
        runId: ctx.runId,
        testing: {
          logsProcessed: testingResult.logsProcessed,
          successRate: testingResult.successRate,
          issues: testingResult.issues,
          recommendation: 'Address critical issues before proceeding to production'
        },
        files: testingResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 10: OPERATIONAL RUNBOOKS AND DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Creating operational runbooks and documentation');

  const runbooksResult = await ctx.task(createLogRunbooksTask, {
    systemName,
    aggregationPlatform,
    implementations,
    commonIssues: testingResult.commonIssues || [],
    outputDir
  });

  artifacts.push(...runbooksResult.artifacts);

  ctx.log('info', `Created ${runbooksResult.runbooks.length} operational runbooks`);

  // ============================================================================
  // PHASE 11: FINAL ASSESSMENT AND REPORTING
  // ============================================================================

  ctx.log('info', 'Phase 11: Generating final assessment and comprehensive report');

  const assessmentResult = await ctx.task(logAggregationAssessmentTask, {
    systemName,
    aggregationPlatform,
    logSources,
    implementations,
    testingResult,
    logsAggregated,
    alertsConfigured,
    retentionDays,
    outputDir
  });

  artifacts.push(...assessmentResult.artifacts);

  const pipelineScore = assessmentResult.pipelineScore;

  ctx.log('info', `Log Aggregation Pipeline Score: ${pipelineScore}/100`);

  // Final Breakpoint: Pipeline approval
  await ctx.breakpoint({
    question: `Log Aggregation Pipeline Complete for ${systemName}. Score: ${pipelineScore}/100. ${logsAggregated} logs processed. ${alertsConfigured} alerts configured. Approve for production?`,
    title: 'Final Pipeline Approval',
    context: {
      runId: ctx.runId,
      summary: {
        pipelineScore,
        platform: aggregationPlatform,
        sourcesConfigured: collectionResult.sourcesConfigured,
        logsProcessed: logsAggregated,
        alertsConfigured,
        dashboardsCreated: enableVisualization ? dashboardsResult.dashboards.length : 0,
        retentionDays,
        successRate: testingResult.successRate
      },
      components: {
        collection: collectionResult.sourcesConfigured > 0,
        parsing: enableParsing && implementations.find(i => i.phase === 'Log Parsing')?.result.parsersCreated > 0,
        indexing: enableIndexing && indexingResult?.indicesCreated > 0,
        search: searchResult.savedQueriesCreated > 0,
        dashboards: enableVisualization && dashboardsResult.dashboards.length > 0,
        alerts: enableAlerts && alertsConfigured > 0,
        analysis: analysisResult.analysisRules.length > 0
      },
      verdict: assessmentResult.verdict,
      recommendation: assessmentResult.recommendation,
      files: [
        { path: assessmentResult.reportPath, format: 'markdown', label: 'Log Aggregation Report' },
        { path: assessmentResult.summaryPath, format: 'json', label: 'Assessment Summary' },
        { path: enableVisualization ? dashboardsResult.primaryDashboardUrl : 'N/A', format: 'link', label: 'Primary Dashboard' }
      ]
    }
  });

  // ============================================================================
  // PHASE 12: PRODUCTION DEPLOYMENT
  // ============================================================================

  ctx.log('info', 'Phase 12: Production deployment preparation and execution');

  const deploymentResult = await ctx.task(deployLogPipelineTask, {
    systemName,
    aggregationPlatform,
    implementations,
    testingResult,
    assessmentResult,
    outputDir
  });

  artifacts.push(...deploymentResult.artifacts);

  ctx.log('info', `Production deployment ${deploymentResult.success ? 'successful' : 'failed'}`);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    systemName,
    aggregationPlatform,
    pipelineScore,
    logsAggregated,
    alertsConfigured,
    logSources: {
      total: logSources.length,
      configured: collectionResult.sourcesConfigured
    },
    collection: {
      collectorType: collectionResult.collectorType,
      bufferingEnabled: collectionResult.bufferingEnabled,
      compressionEnabled: collectionResult.compressionEnabled,
      samplingRate: collectionResult.samplingRate
    },
    parsing: enableParsing ? {
      enabled: true,
      parsersCreated: implementations.find(i => i.phase === 'Log Parsing')?.result.parsersCreated || 0,
      logTypesHandled: implementations.find(i => i.phase === 'Log Parsing')?.result.logTypesHandled || 0
    } : { enabled: false },
    indexing: enableIndexing ? {
      enabled: true,
      indicesCreated: indexingResult.indicesCreated,
      retentionDays,
      rollingStrategy: indexingResult.rollingStrategy,
      estimatedStorageGB: indexingResult.estimatedStorageGB
    } : { enabled: false },
    search: {
      savedQueriesCreated: searchResult.savedQueriesCreated,
      searchCapabilities: searchResult.capabilities
    },
    dashboards: enableVisualization ? {
      enabled: true,
      count: dashboardsResult.dashboards.length,
      primaryUrl: dashboardsResult.primaryDashboardUrl,
      dashboards: dashboardsResult.dashboards.map(d => ({
        name: d.name,
        type: d.type,
        url: d.url
      }))
    } : { enabled: false },
    alerts: enableAlerts ? {
      enabled: true,
      totalAlerts: alertsConfigured,
      criticalAlerts: alertingResult.criticalAlerts.length,
      warningAlerts: alertingResult.warningAlerts.length,
      notificationChannels: alertingResult.notificationChannels
    } : { enabled: false },
    analysis: {
      rulesConfigured: analysisResult.analysisRules.length,
      anomalyDetection: analysisResult.anomalyDetectionEnabled,
      patternRecognition: analysisResult.patternRecognitionEnabled
    },
    testing: {
      logsProcessed: testingResult.logsProcessed,
      successRate: testingResult.successRate,
      issuesFound: testingResult.issues.length
    },
    runbooks: {
      count: runbooksResult.runbooks.length,
      scenarios: runbooksResult.runbooks.map(r => r.scenario)
    },
    deployment: {
      deployed: deploymentResult.success,
      environment: deploymentResult.environment,
      timestamp: deploymentResult.timestamp
    },
    dashboardUrl: enableVisualization ? dashboardsResult.primaryDashboardUrl : null,
    artifacts,
    documentation: {
      reportPath: assessmentResult.reportPath,
      summaryPath: assessmentResult.summaryPath,
      runbooksPath: runbooksResult.runbooksPath
    },
    duration,
    metadata: {
      processId: 'specializations/devops-sre-platform/log-aggregation',
      processSlug: 'log-aggregation',
      category: 'Monitoring & Observability',
      specializationSlug: 'devops-sre-platform',
      timestamp: startTime,
      completedAt: endTime,
      aggregationPlatform,
      retentionDays,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: Define Log Requirements
export const defineLogRequirementsTask = defineTask('define-log-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Define Log Requirements - ${args.systemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Log Management Architect and SRE',
      task: 'Analyze system and define comprehensive log aggregation requirements',
      context: {
        systemName: args.systemName,
        logSources: args.logSources,
        aggregationPlatform: args.aggregationPlatform,
        retentionDays: args.retentionDays,
        logLevel: args.logLevel,
        structuredFormat: args.structuredFormat,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze each log source and identify log types (application, system, security, audit, access)',
        '2. Estimate log volume for each source (events per second, size per event)',
        '3. Calculate total log volume and storage requirements',
        '4. Identify required log fields and structure for each log type',
        '5. Define common log patterns and use cases (debugging, security, compliance, performance)',
        '6. Design log aggregation architecture for selected platform',
        '7. Identify required components (collectors, forwarders, processors, storage, search)',
        '8. Define log retention policies and archival strategies',
        '9. Identify common search queries and analysis patterns',
        '10. Document requirements with architecture diagrams'
      ],
      outputFormat: 'JSON object with comprehensive log requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'logTypes', 'estimatedVolume', 'storageRequired', 'components', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        sourcesAnalyzed: { type: 'number' },
        logTypes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              category: { type: 'string', enum: ['application', 'system', 'security', 'audit', 'access', 'custom'] },
              source: { type: 'string' },
              format: { type: 'string' },
              fieldsRequired: { type: 'array', items: { type: 'string' } },
              estimatedEventsPerSecond: { type: 'number' },
              avgSizeBytes: { type: 'number' }
            }
          }
        },
        estimatedVolume: {
          type: 'object',
          properties: {
            eventsPerSecond: { type: 'number' },
            eventsPerDay: { type: 'number' },
            bytesPerDay: { type: 'number' },
            mbPerDay: { type: 'number' },
            gbPerDay: { type: 'number' }
          }
        },
        storageRequired: {
          type: 'object',
          properties: {
            dailyGB: { type: 'number' },
            monthlyGB: { type: 'number' },
            retentionGB: { type: 'number' },
            withCompressionGB: { type: 'number' }
          }
        },
        components: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              component: { type: 'string' },
              purpose: { type: 'string' },
              technology: { type: 'string' }
            }
          }
        },
        commonQueries: { type: 'array', items: { type: 'string' } },
        useCases: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'log-aggregation', 'requirements']
}));

// Phase 2: Configure Log Collection
export const configureLogCollectionTask = defineTask('configure-log-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Configure Log Collection - ${args.systemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Log Infrastructure Engineer',
      task: 'Configure log collection and forwarding from all sources',
      context: {
        systemName: args.systemName,
        logSources: args.logSources,
        aggregationPlatform: args.aggregationPlatform,
        logLevel: args.logLevel,
        structuredFormat: args.structuredFormat,
        samplingRate: args.samplingRate,
        compressionEnabled: args.compressionEnabled,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Select appropriate log collector based on platform:',
        '   - ELK: Filebeat, Logstash',
        '   - Loki: Promtail, Fluentd',
        '   - Splunk: Universal Forwarder, Heavy Forwarder',
        '   - CloudWatch: CloudWatch Agent, Fluentd',
        '2. Configure log collection for each source type',
        '3. Set up structured log formatting (JSON preferred)',
        '4. Configure log buffering and batching for performance',
        '5. Enable compression to reduce network transfer',
        '6. Implement log sampling if volume is very high',
        '7. Add correlation IDs and trace context to logs',
        '8. Configure secure transport (TLS/SSL)',
        '9. Set up health checks and monitoring for collectors',
        '10. Document collector configurations',
        '11. Create deployment manifests (Docker, Kubernetes, systemd)'
      ],
      outputFormat: 'JSON object with log collection configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'sourcesConfigured', 'collectorType', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        sourcesConfigured: { type: 'number' },
        collectorType: { type: 'string', description: 'Filebeat, Logstash, Promtail, Fluentd, etc.' },
        collectorVersion: { type: 'string' },
        bufferingEnabled: { type: 'boolean' },
        bufferSizeMB: { type: 'number' },
        compressionEnabled: { type: 'boolean' },
        compressionType: { type: 'string' },
        samplingRate: { type: 'number' },
        tlsEnabled: { type: 'boolean' },
        healthCheckConfigured: { type: 'boolean' },
        sourceConfigurations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              source: { type: 'string' },
              logPath: { type: 'string' },
              logFormat: { type: 'string' },
              multilineEnabled: { type: 'boolean' }
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
  labels: ['agent', 'log-aggregation', 'collection']
}));

// Phase 3: Configure Log Parsing
export const configureLogParsingTask = defineTask('configure-log-parsing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Configure Log Parsing - ${args.systemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Log Parsing Specialist',
      task: 'Configure log parsing rules and field extraction',
      context: {
        systemName: args.systemName,
        logSources: args.logSources,
        logTypes: args.logTypes,
        structuredFormat: args.structuredFormat,
        aggregationPlatform: args.aggregationPlatform,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create parsing rules for each log type',
        '2. For ELK: Configure Grok patterns in Logstash',
        '3. For Loki: Configure LogQL parsing and label extraction',
        '4. For Splunk: Configure field extractions and transforms',
        '5. Extract key fields:',
        '   - timestamp (normalize to standard format)',
        '   - log level (DEBUG, INFO, WARN, ERROR, FATAL)',
        '   - service name',
        '   - host/container',
        '   - trace_id, span_id (for distributed tracing)',
        '   - user_id, session_id (for user tracking)',
        '   - error message and stack trace',
        '   - custom business fields',
        '6. Handle multiline logs (stack traces, JSON objects)',
        '7. Normalize timestamps to UTC',
        '8. Enrich logs with metadata (environment, region, version)',
        '9. Filter out sensitive data (PII, credentials)',
        '10. Test parsing with sample logs',
        '11. Document parsing rules and field mappings'
      ],
      outputFormat: 'JSON object with parsing configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'parsersCreated', 'logTypesHandled', 'extractedFields', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        parsersCreated: { type: 'number' },
        logTypesHandled: { type: 'number' },
        extractedFields: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              field: { type: 'string' },
              type: { type: 'string', enum: ['string', 'number', 'boolean', 'timestamp', 'ip', 'geo'] },
              indexed: { type: 'boolean' }
            }
          }
        },
        grokPatterns: { type: 'array', items: { type: 'string' } },
        multilineHandling: { type: 'boolean' },
        timestampNormalized: { type: 'boolean' },
        sensitiveDataFiltered: { type: 'boolean' },
        enrichmentFields: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'log-aggregation', 'parsing']
}));

// Phase 4: Configure Log Indexing
export const configureLogIndexingTask = defineTask('configure-log-indexing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Configure Log Indexing - ${args.systemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Database and Indexing Specialist',
      task: 'Configure log storage and indexing strategy',
      context: {
        systemName: args.systemName,
        aggregationPlatform: args.aggregationPlatform,
        retentionDays: args.retentionDays,
        logTypes: args.logTypes,
        estimatedVolume: args.estimatedVolume,
        compressionEnabled: args.compressionEnabled,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design index strategy based on platform:',
        '   - ELK: Daily/hourly indices with ILM (Index Lifecycle Management)',
        '   - Loki: Chunk storage with retention policies',
        '   - Splunk: Index time-based rolling',
        '2. Create indices for different log types and sources',
        '3. Configure index templates with field mappings',
        '4. Set up index lifecycle policies:',
        '   - Hot: Recent logs (fast SSD)',
        '   - Warm: Older logs (slower storage)',
        '   - Cold: Archive logs (object storage)',
        '   - Delete: After retention period',
        '5. Configure shard and replica settings for performance',
        '6. Enable compression to save storage',
        '7. Set up index rollover based on size or time',
        '8. Configure backup and restore procedures',
        '9. Optimize field mappings for search performance',
        '10. Document indexing strategy and storage tiers'
      ],
      outputFormat: 'JSON object with indexing configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'indicesCreated', 'rollingStrategy', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        indicesCreated: { type: 'number' },
        rollingStrategy: { type: 'string', enum: ['daily', 'hourly', 'size-based', 'time-based'] },
        retentionPolicy: {
          type: 'object',
          properties: {
            hotDays: { type: 'number' },
            warmDays: { type: 'number' },
            coldDays: { type: 'number' },
            totalRetentionDays: { type: 'number' }
          }
        },
        storageOptimized: { type: 'boolean' },
        compressionEnabled: { type: 'boolean' },
        compressionRatio: { type: 'number' },
        estimatedStorageGB: { type: 'number' },
        backupConfigured: { type: 'boolean' },
        shardConfig: {
          type: 'object',
          properties: {
            primaryShards: { type: 'number' },
            replicaShards: { type: 'number' }
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
  labels: ['agent', 'log-aggregation', 'indexing']
}));

// Phase 5: Configure Log Search
export const configureLogSearchTask = defineTask('configure-log-search', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Configure Log Search - ${args.systemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Search and Query Optimization Specialist',
      task: 'Configure powerful log search and query capabilities',
      context: {
        systemName: args.systemName,
        aggregationPlatform: args.aggregationPlatform,
        logTypes: args.logTypes,
        commonQueries: args.commonQueries,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure search capabilities based on platform:',
        '   - ELK: Kibana with KQL (Kibana Query Language) or Lucene',
        '   - Loki: LogQL queries',
        '   - Splunk: SPL (Search Processing Language)',
        '2. Create saved searches for common queries:',
        '   - All errors in last 24h',
        '   - Errors by service',
        '   - Slow requests (>1s)',
        '   - 4xx/5xx HTTP errors',
        '   - Security events',
        '   - User activity by user_id',
        '3. Create search templates with variables',
        '4. Configure autocomplete and field suggestions',
        '5. Set up saved filters and quick searches',
        '6. Create correlation searches (find related logs)',
        '7. Configure full-text search optimization',
        '8. Set up aggregations and analytics queries',
        '9. Create search macros for complex queries',
        '10. Document search syntax and examples'
      ],
      outputFormat: 'JSON object with search configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'savedQueriesCreated', 'capabilities', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        savedQueriesCreated: { type: 'number' },
        capabilities: {
          type: 'object',
          properties: {
            fullTextSearch: { type: 'boolean' },
            fieldSearch: { type: 'boolean' },
            regexSearch: { type: 'boolean' },
            aggregations: { type: 'boolean' },
            correlationSearch: { type: 'boolean' },
            autocomplete: { type: 'boolean' }
          }
        },
        savedQueries: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              query: { type: 'string' },
              category: { type: 'string' }
            }
          }
        },
        searchTemplates: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'log-aggregation', 'search']
}));

// Phase 6: Create Log Dashboards
export const createLogDashboardsTask = defineTask('create-log-dashboards', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Create Log Dashboards - ${args.systemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Visualization and Dashboard Specialist',
      task: 'Create comprehensive log visualization dashboards',
      context: {
        systemName: args.systemName,
        aggregationPlatform: args.aggregationPlatform,
        logSources: args.logSources,
        logTypes: args.logTypes,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create System Overview Dashboard:',
        '   - Total log volume over time',
        '   - Log level distribution (ERROR, WARN, INFO)',
        '   - Errors by service',
        '   - Top error messages',
        '   - System health indicators',
        '2. Create Service-Specific Dashboards:',
        '   - Logs per service over time',
        '   - Error rate trends',
        '   - Response time from logs',
        '   - Request patterns',
        '3. Create Error Analysis Dashboard:',
        '   - Error frequency over time',
        '   - Error types and categories',
        '   - Stack traces and common errors',
        '   - Error impact (affected users)',
        '4. Create Security Dashboard:',
        '   - Failed login attempts',
        '   - Unauthorized access attempts',
        '   - Security events timeline',
        '   - Anomalous activity',
        '5. Add visualizations: time series, pie charts, tables, heatmaps',
        '6. Configure dashboard variables (time range, service, log level)',
        '7. Set up drill-down capabilities',
        '8. Configure auto-refresh intervals',
        '9. Export dashboard definitions',
        '10. Document dashboard usage guide'
      ],
      outputFormat: 'JSON object with dashboard definitions'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'dashboards', 'primaryDashboardUrl', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        dashboards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['overview', 'service', 'error-analysis', 'security', 'performance', 'custom'] },
              description: { type: 'string' },
              visualizations: { type: 'number' },
              url: { type: 'string' },
              variables: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        primaryDashboardUrl: { type: 'string' },
        autoRefreshEnabled: { type: 'boolean' },
        drillDownEnabled: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'log-aggregation', 'dashboards']
}));

// Phase 7: Configure Log Alerts
export const configureLogAlertsTask = defineTask('configure-log-alerts', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Configure Log Alerts - ${args.systemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Alert Engineering and SRE Specialist',
      task: 'Configure comprehensive log-based alerting',
      context: {
        systemName: args.systemName,
        aggregationPlatform: args.aggregationPlatform,
        alertThresholds: args.alertThresholds,
        logTypes: args.logTypes,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define alert severity levels (Critical, Warning, Info)',
        '2. Create alerts for critical errors:',
        '   - Error rate exceeds threshold (e.g., >5% of requests)',
        '   - Critical errors (FATAL, CRITICAL) appear',
        '   - Exception spike detected',
        '   - Service unavailable errors',
        '3. Create alerts for security events:',
        '   - Failed authentication attempts spike',
        '   - Unauthorized access attempts',
        '   - Security vulnerabilities detected in logs',
        '4. Create alerts for performance issues:',
        '   - Slow query warnings',
        '   - High latency patterns',
        '   - Resource exhaustion warnings',
        '5. Create alerts for operational issues:',
        '   - Log collection failures',
        '   - Disk space warnings',
        '   - Service health check failures',
        '6. Configure alert conditions (count, rate, threshold)',
        '7. Set up alert notification channels (email, Slack, PagerDuty)',
        '8. Configure alert grouping and deduplication',
        '9. Add alert context (dashboard links, runbook links)',
        '10. Test alerts with simulated conditions',
        '11. Document alert response procedures'
      ],
      outputFormat: 'JSON object with alert configurations'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'alertsCreated', 'criticalAlerts', 'warningAlerts', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        alertsCreated: { type: 'number' },
        criticalAlerts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              condition: { type: 'string' },
              threshold: { type: 'string' },
              severity: { type: 'string' },
              notificationChannel: { type: 'string' }
            }
          }
        },
        warningAlerts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              condition: { type: 'string' },
              threshold: { type: 'string' }
            }
          }
        },
        notificationChannels: { type: 'array', items: { type: 'string' } },
        alertGrouping: { type: 'boolean' },
        alertDeduplication: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'log-aggregation', 'alerts']
}));

// Phase 8: Configure Log Analysis
export const configureLogAnalysisTask = defineTask('configure-log-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Configure Log Analysis - ${args.systemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML and Log Analysis Specialist',
      task: 'Configure automated log analysis and pattern detection',
      context: {
        systemName: args.systemName,
        aggregationPlatform: args.aggregationPlatform,
        logTypes: args.logTypes,
        enableAnomalyDetection: args.enableAnomalyDetection,
        enablePatternRecognition: args.enablePatternRecognition,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure anomaly detection for log patterns',
        '2. Set up baseline behavior learning from historical logs',
        '3. Create rules for detecting common issues:',
        '   - Memory leaks (OOM errors increasing)',
        '   - Cascading failures (errors spreading across services)',
        '   - Circular dependencies (request loops)',
        '   - Resource exhaustion patterns',
        '4. Configure log correlation analysis:',
        '   - Group related errors by trace_id',
        '   - Find temporal correlations between events',
        '   - Identify causal relationships',
        '5. Set up automated root cause analysis',
        '6. Create pattern recognition for:',
        '   - Known error patterns',
        '   - Security attack patterns',
        '   - Performance degradation patterns',
        '7. Configure machine learning for:',
        '   - Log clustering',
        '   - Outlier detection',
        '   - Trend forecasting',
        '8. Set up automated incident detection',
        '9. Create analysis reports and summaries',
        '10. Document analysis rules and patterns'
      ],
      outputFormat: 'JSON object with analysis configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'analysisRules', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        analysisRules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              ruleName: { type: 'string' },
              ruleType: { type: 'string', enum: ['anomaly', 'pattern', 'correlation', 'threshold'] },
              description: { type: 'string' },
              action: { type: 'string' }
            }
          }
        },
        anomalyDetectionEnabled: { type: 'boolean' },
        patternRecognitionEnabled: { type: 'boolean' },
        correlationAnalysis: { type: 'boolean' },
        mlModelsDeployed: { type: 'number' },
        knownPatterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string' },
              severity: { type: 'string' },
              commonCause: { type: 'string' }
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
  labels: ['agent', 'log-aggregation', 'analysis']
}));

// Phase 9: Test Log Aggregation
export const testLogAggregationTask = defineTask('test-log-aggregation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Test Log Aggregation Pipeline - ${args.systemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'QA Engineer and Pipeline Testing Specialist',
      task: 'Thoroughly test the log aggregation pipeline end-to-end',
      context: {
        systemName: args.systemName,
        aggregationPlatform: args.aggregationPlatform,
        logSources: args.logSources,
        implementations: args.implementations,
        collectionResult: args.collectionResult,
        indexingResult: args.indexingResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Generate test logs for each source and log type',
        '2. Test log collection from all configured sources',
        '3. Verify logs are parsed correctly and fields extracted',
        '4. Test log indexing and storage',
        '5. Verify log retention and lifecycle policies',
        '6. Test search functionality with various queries',
        '7. Verify dashboards display correct data',
        '8. Test alert firing with simulated error conditions',
        '9. Test log correlation and trace_id propagation',
        '10. Measure pipeline latency (log generation to searchable)',
        '11. Test pipeline under load (high volume)',
        '12. Test failure scenarios (collector down, storage full)',
        '13. Verify data loss prevention (buffering, retry)',
        '14. Calculate success rate and identify issues',
        '15. Document test results and recommendations'
      ],
      outputFormat: 'JSON object with comprehensive test results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'logsProcessed', 'successRate', 'issues', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        logsProcessed: { type: 'number' },
        successRate: { type: 'number', description: 'Percentage of logs successfully aggregated' },
        testResults: {
          type: 'object',
          properties: {
            collectionTests: {
              type: 'object',
              properties: {
                passed: { type: 'number' },
                failed: { type: 'number' },
                issues: { type: 'array', items: { type: 'string' } }
              }
            },
            parsingTests: {
              type: 'object',
              properties: {
                passed: { type: 'number' },
                failed: { type: 'number' },
                issues: { type: 'array', items: { type: 'string' } }
              }
            },
            indexingTests: {
              type: 'object',
              properties: {
                passed: { type: 'number' },
                failed: { type: 'number' },
                issues: { type: 'array', items: { type: 'string' } }
              }
            },
            searchTests: {
              type: 'object',
              properties: {
                passed: { type: 'number' },
                failed: { type: 'number' },
                issues: { type: 'array', items: { type: 'string' } }
              }
            },
            alertTests: {
              type: 'object',
              properties: {
                passed: { type: 'number' },
                failed: { type: 'number' },
                issues: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        },
        performanceMetrics: {
          type: 'object',
          properties: {
            avgLatencyMs: { type: 'number', description: 'Average time from log generation to searchable' },
            throughputLogsPerSecond: { type: 'number' },
            dataLossRate: { type: 'number' }
          }
        },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              severity: { type: 'string' },
              component: { type: 'string' },
              issue: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        commonIssues: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'log-aggregation', 'testing']
}));

// Phase 10: Create Log Runbooks
export const createLogRunbooksTask = defineTask('create-log-runbooks', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Create Operational Runbooks - ${args.systemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SRE and Technical Documentation Specialist',
      task: 'Create operational runbooks for log aggregation pipeline',
      context: {
        systemName: args.systemName,
        aggregationPlatform: args.aggregationPlatform,
        implementations: args.implementations,
        commonIssues: args.commonIssues,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create runbooks for common operational tasks:',
        '   - Troubleshoot log collection failures',
        '   - Handle storage capacity issues',
        '   - Resolve indexing problems',
        '   - Fix alert misfiring',
        '   - Restore from backup',
        '2. Create runbooks for each critical alert',
        '3. Include for each runbook:',
        '   - Problem description',
        '   - Impact assessment',
        '   - Investigation steps (queries to run, dashboards to check)',
        '   - Resolution procedures',
        '   - Prevention measures',
        '   - Escalation path',
        '4. Create incident response runbooks:',
        '   - High error rate investigation',
        '   - Security incident investigation',
        '   - Performance degradation investigation',
        '5. Create maintenance runbooks:',
        '   - Index cleanup and optimization',
        '   - Collector upgrades',
        '   - Storage expansion',
        '6. Include example log queries',
        '7. Add links to relevant dashboards and documentation',
        '8. Format as Markdown for easy access',
        '9. Version control all runbooks'
      ],
      outputFormat: 'JSON object with runbook definitions'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'runbooks', 'runbooksPath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        runbooks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              scenario: { type: 'string' },
              category: { type: 'string', enum: ['operational', 'alert-response', 'incident', 'maintenance'] },
              severity: { type: 'string' },
              path: { type: 'string' }
            }
          }
        },
        runbooksPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'log-aggregation', 'runbooks']
}));

// Phase 11: Log Aggregation Assessment
export const logAggregationAssessmentTask = defineTask('log-aggregation-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Final Assessment - ${args.systemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior SRE and Log Management Architect',
      task: 'Conduct final assessment of log aggregation pipeline',
      context: {
        systemName: args.systemName,
        aggregationPlatform: args.aggregationPlatform,
        logSources: args.logSources,
        implementations: args.implementations,
        testingResult: args.testingResult,
        logsAggregated: args.logsAggregated,
        alertsConfigured: args.alertsConfigured,
        retentionDays: args.retentionDays,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Calculate weighted pipeline score (0-100):',
        '   - Collection reliability (25% weight)',
        '   - Parsing accuracy (20% weight)',
        '   - Search performance (15% weight)',
        '   - Alerting effectiveness (15% weight)',
        '   - Operational maturity (15% weight)',
        '   - Documentation completeness (10% weight)',
        '2. Assess coverage across all log sources',
        '3. Evaluate pipeline performance (latency, throughput)',
        '4. Assess production readiness',
        '5. Evaluate adherence to best practices',
        '6. Assess operational sustainability',
        '7. Identify strengths and areas for improvement',
        '8. Provide overall verdict (excellent/good/acceptable/needs-improvement)',
        '9. Generate actionable recommendations',
        '10. Create comprehensive assessment report',
        '11. Include cost estimates for running the pipeline'
      ],
      outputFormat: 'JSON object with comprehensive assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['pipelineScore', 'verdict', 'recommendation', 'reportPath', 'summaryPath', 'artifacts'],
      properties: {
        pipelineScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            collection: { type: 'number' },
            parsing: { type: 'number' },
            indexing: { type: 'number' },
            search: { type: 'number' },
            alerting: { type: 'number' },
            documentation: { type: 'number' }
          }
        },
        coverageAssessment: {
          type: 'object',
          properties: {
            sourcesConfigured: { type: 'number' },
            totalSources: { type: 'number' },
            coveragePercent: { type: 'number' }
          }
        },
        performanceAssessment: {
          type: 'object',
          properties: {
            avgLatencyMs: { type: 'number' },
            successRate: { type: 'number' },
            throughputLogsPerSecond: { type: 'number' }
          }
        },
        productionReady: { type: 'boolean' },
        verdict: { type: 'string', description: 'Overall verdict' },
        recommendation: { type: 'string', description: 'Recommended next steps' },
        strengths: { type: 'array', items: { type: 'string' } },
        improvements: { type: 'array', items: { type: 'string' } },
        costEstimate: {
          type: 'object',
          properties: {
            storageGBPerMonth: { type: 'number' },
            estimatedMonthlyCost: { type: 'string' },
            costOptimizations: { type: 'array', items: { type: 'string' } }
          }
        },
        reportPath: { type: 'string' },
        summaryPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'log-aggregation', 'assessment']
}));

// Phase 12: Deploy Log Pipeline
export const deployLogPipelineTask = defineTask('deploy-log-pipeline', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Deploy Log Pipeline - ${args.systemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DevOps Engineer and Deployment Specialist',
      task: 'Deploy log aggregation pipeline to production',
      context: {
        systemName: args.systemName,
        aggregationPlatform: args.aggregationPlatform,
        implementations: args.implementations,
        testingResult: args.testingResult,
        assessmentResult: args.assessmentResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Review pre-deployment checklist',
        '2. Prepare deployment plan with rollback procedure',
        '3. Deploy log collection agents to all hosts/containers',
        '4. Deploy log aggregation infrastructure (Elasticsearch, Loki, etc.)',
        '5. Deploy log processing pipelines (Logstash, Fluentd, etc.)',
        '6. Deploy visualization layer (Kibana, Grafana, etc.)',
        '7. Configure monitoring for the log pipeline itself',
        '8. Perform smoke tests in production',
        '9. Enable alerts gradually',
        '10. Monitor pipeline health for initial period',
        '11. Document deployment details',
        '12. Create post-deployment report'
      ],
      outputFormat: 'JSON object with deployment results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'environment', 'timestamp', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        environment: { type: 'string' },
        timestamp: { type: 'string' },
        componentsDeployed: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              component: { type: 'string' },
              version: { type: 'string' },
              status: { type: 'string' }
            }
          }
        },
        smokeTestsPassed: { type: 'boolean' },
        rollbackProcedure: { type: 'string' },
        monitoringEnabled: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'log-aggregation', 'deployment']
}));
