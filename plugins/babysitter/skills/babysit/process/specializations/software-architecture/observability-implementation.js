/**
 * @process specializations/software-architecture/observability-implementation
 * @description Observability Implementation - Comprehensive process for implementing observability through structured
 * logging, metrics collection, distributed tracing, dashboard creation, alerting, and incident response runbooks.
 * Covers the three pillars of observability with quality gates and validation.
 * @inputs { systemName: string, observabilityScope: string, platforms?: array, targetCoverage?: number }
 * @outputs { success: boolean, observabilityScore: number, implementations: array, dashboards: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/software-architecture/observability-implementation', {
 *   systemName: 'E-commerce Microservices',
 *   observabilityScope: 'full-stack',
 *   platforms: ['Prometheus', 'Grafana', 'Jaeger', 'ELK'],
 *   targetCoverage: 90,
 *   slos: {
 *     availability: 99.9,
 *     latencyP95: 200,
 *     errorRate: 0.1
 *   }
 * });
 *
 * @references
 * - Observability Engineering: https://www.oreilly.com/library/view/observability-engineering/9781492076438/
 * - The Three Pillars: https://www.oreilly.com/library/view/distributed-systems-observability/9781492033431/
 * - OpenTelemetry: https://opentelemetry.io/docs/
 * - SRE Book: https://sre.google/sre-book/table-of-contents/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    systemName,
    observabilityScope = 'full-stack', // 'application', 'infrastructure', 'full-stack'
    platforms = ['Prometheus', 'Grafana', 'OpenTelemetry'],
    targetCoverage = 85, // percentage of system covered by observability
    slos = {
      availability: 99.9,
      latencyP95: 500,
      errorRate: 1.0
    },
    outputDir = 'observability-output',
    enableDistributedTracing = true,
    enableLogAggregation = true,
    enableMetricsCollection = true,
    alertingChannels = ['email', 'slack'],
    retentionDays = 30
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let observabilityScore = 0;
  const implementations = [];

  ctx.log('info', `Starting Observability Implementation for ${systemName}`);
  ctx.log('info', `Scope: ${observabilityScope}, Target Coverage: ${targetCoverage}%`);
  ctx.log('info', `Platforms: ${platforms.join(', ')}`);

  // ============================================================================
  // PHASE 1: DEFINE OBSERVABILITY REQUIREMENTS
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining observability requirements');

  const requirementsResult = await ctx.task(defineRequirementsTask, {
    systemName,
    observabilityScope,
    slos,
    platforms,
    outputDir
  });

  artifacts.push(...requirementsResult.artifacts);

  ctx.log('info', `Defined ${requirementsResult.metrics.length} metrics, ${requirementsResult.logEvents.length} log events, ${requirementsResult.traces.length} trace points`);

  // Quality Gate: Requirements review
  await ctx.breakpoint({
    question: `Observability requirements defined for ${systemName}. Identified ${requirementsResult.metrics.length} metrics, ${requirementsResult.logEvents.length} log events. Review and approve?`,
    title: 'Observability Requirements Review',
    context: {
      runId: ctx.runId,
      requirements: {
        metrics: requirementsResult.metrics.slice(0, 10),
        logEvents: requirementsResult.logEvents.slice(0, 10),
        traces: requirementsResult.traces.slice(0, 10)
      },
      slis: requirementsResult.slis,
      coverage: requirementsResult.estimatedCoverage,
      files: requirementsResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 2: IMPLEMENT STRUCTURED LOGGING
  // ============================================================================

  if (enableLogAggregation) {
    ctx.log('info', 'Phase 2: Implementing structured logging');

    const loggingResult = await ctx.task(structuredLoggingTask, {
      systemName,
      observabilityScope,
      logEvents: requirementsResult.logEvents,
      loggingStandard: 'JSON',
      logLevels: ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'],
      platforms,
      outputDir
    });

    implementations.push({
      phase: 'Structured Logging',
      result: loggingResult
    });

    artifacts.push(...loggingResult.artifacts);

    ctx.log('info', `Implemented structured logging in ${loggingResult.componentsInstrumented} components`);

    // Quality Gate: Logging implementation review
    await ctx.breakpoint({
      question: `Structured logging implemented in ${loggingResult.componentsInstrumented} components. Log format standardized. Review implementation?`,
      title: 'Structured Logging Review',
      context: {
        runId: ctx.runId,
        loggingImplementation: {
          componentsInstrumented: loggingResult.componentsInstrumented,
          logFormat: loggingResult.logFormat,
          contextFields: loggingResult.contextFields,
          coverage: loggingResult.coveragePercentage
        },
        files: loggingResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 3: DEFINE METRICS AND SLIs
  // ============================================================================

  if (enableMetricsCollection) {
    ctx.log('info', 'Phase 3: Defining metrics and Service Level Indicators (SLIs)');

    const metricsResult = await ctx.task(defineMetricsTask, {
      systemName,
      observabilityScope,
      metrics: requirementsResult.metrics,
      slos,
      platforms,
      outputDir
    });

    implementations.push({
      phase: 'Metrics Definition',
      result: metricsResult
    });

    artifacts.push(...metricsResult.artifacts);

    ctx.log('info', `Defined ${metricsResult.metricsConfigured} metrics across ${metricsResult.metricTypes.length} types`);

    // Quality Gate: Metrics definition review
    await ctx.breakpoint({
      question: `Metrics and SLIs defined. ${metricsResult.metricsConfigured} metrics configured including ${metricsResult.goldenSignals.length} golden signals. Review and approve?`,
      title: 'Metrics Definition Review',
      context: {
        runId: ctx.runId,
        metricsDefinition: {
          metricsConfigured: metricsResult.metricsConfigured,
          goldenSignals: metricsResult.goldenSignals,
          slis: metricsResult.slis,
          metricTypes: metricsResult.metricTypes
        },
        files: metricsResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 4: IMPLEMENT DISTRIBUTED TRACING
  // ============================================================================

  if (enableDistributedTracing) {
    ctx.log('info', 'Phase 4: Implementing distributed tracing');

    const tracingResult = await ctx.task(distributedTracingTask, {
      systemName,
      observabilityScope,
      traces: requirementsResult.traces,
      tracingStandard: 'OpenTelemetry',
      samplingRate: 0.1, // 10% sampling
      platforms,
      outputDir
    });

    implementations.push({
      phase: 'Distributed Tracing',
      result: tracingResult
    });

    artifacts.push(...tracingResult.artifacts);

    ctx.log('info', `Implemented distributed tracing across ${tracingResult.servicesInstrumented} services`);

    // Quality Gate: Tracing implementation review
    await ctx.breakpoint({
      question: `Distributed tracing implemented across ${tracingResult.servicesInstrumented} services using ${tracingResult.tracingStandard}. Review implementation?`,
      title: 'Distributed Tracing Review',
      context: {
        runId: ctx.runId,
        tracingImplementation: {
          servicesInstrumented: tracingResult.servicesInstrumented,
          tracingStandard: tracingResult.tracingStandard,
          samplingRate: tracingResult.samplingRate,
          spanTypes: tracingResult.spanTypes,
          coverage: tracingResult.coveragePercentage
        },
        files: tracingResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 5: CREATE DASHBOARDS
  // ============================================================================

  ctx.log('info', 'Phase 5: Creating observability dashboards');

  const dashboardsResult = await ctx.task(createDashboardsTask, {
    systemName,
    observabilityScope,
    metrics: metricsResult?.metricsConfigured || requirementsResult.metrics.length,
    slis: requirementsResult.slis,
    platforms,
    outputDir
  });

  artifacts.push(...dashboardsResult.artifacts);

  ctx.log('info', `Created ${dashboardsResult.dashboards.length} dashboards`);

  // Quality Gate: Dashboard review
  await ctx.breakpoint({
    question: `Created ${dashboardsResult.dashboards.length} observability dashboards. Dashboards include: ${dashboardsResult.dashboards.map(d => d.name).join(', ')}. Review dashboards?`,
    title: 'Dashboards Review',
    context: {
      runId: ctx.runId,
      dashboards: dashboardsResult.dashboards.map(d => ({
        name: d.name,
        type: d.type,
        panelCount: d.panelCount,
        url: d.url
      })),
      files: dashboardsResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 6: SET UP ALERTS
  // ============================================================================

  ctx.log('info', 'Phase 6: Setting up alerts and notifications');

  const alertingResult = await ctx.task(setupAlertsTask, {
    systemName,
    slos,
    slis: requirementsResult.slis,
    metrics: metricsResult?.metricsConfigured || requirementsResult.metrics.length,
    alertingChannels,
    platforms,
    outputDir
  });

  artifacts.push(...alertingResult.artifacts);

  ctx.log('info', `Configured ${alertingResult.alerts.length} alerts across ${alertingResult.severity.length} severity levels`);

  // Quality Gate: Alert configuration review
  await ctx.breakpoint({
    question: `Configured ${alertingResult.alerts.length} alerts. Critical alerts: ${alertingResult.criticalAlerts.length}. Review alert configuration?`,
    title: 'Alert Configuration Review',
    context: {
      runId: ctx.runId,
      alerting: {
        totalAlerts: alertingResult.alerts.length,
        criticalAlerts: alertingResult.criticalAlerts.length,
        channels: alertingResult.channels,
        errorBudget: alertingResult.errorBudgetAlerts
      },
      topAlerts: alertingResult.alerts.slice(0, 10),
      files: alertingResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 7: TEST OBSERVABILITY
  // ============================================================================

  ctx.log('info', 'Phase 7: Testing observability implementation');

  const testingResult = await ctx.task(testObservabilityTask, {
    systemName,
    implementations,
    requirementsResult,
    targetCoverage,
    platforms,
    outputDir
  });

  artifacts.push(...testingResult.artifacts);

  ctx.log('info', `Observability testing complete - Coverage: ${testingResult.actualCoverage}%`);

  // Quality Gate: Testing results validation
  if (testingResult.actualCoverage < targetCoverage) {
    await ctx.breakpoint({
      question: `Observability coverage ${testingResult.actualCoverage}% is below target ${targetCoverage}%. Gaps identified: ${testingResult.gaps.length}. Review and address gaps?`,
      title: 'Coverage Gap Review',
      context: {
        runId: ctx.runId,
        testing: {
          actualCoverage: testingResult.actualCoverage,
          targetCoverage,
          gaps: testingResult.gaps,
          recommendation: 'Address critical gaps before proceeding'
        },
        files: testingResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 8: CREATE RUNBOOKS
  // ============================================================================

  ctx.log('info', 'Phase 8: Creating incident response runbooks');

  const runbooksResult = await ctx.task(createRunbooksTask, {
    systemName,
    alerts: alertingResult.alerts,
    commonScenarios: testingResult.commonIssues || [],
    slos,
    outputDir
  });

  artifacts.push(...runbooksResult.artifacts);

  ctx.log('info', `Created ${runbooksResult.runbooks.length} runbooks for incident response`);

  // ============================================================================
  // PHASE 9: COMPREHENSIVE OBSERVABILITY REPORT
  // ============================================================================

  ctx.log('info', 'Phase 9: Generating comprehensive observability report');

  const reportResult = await ctx.task(reportGenerationTask, {
    systemName,
    observabilityScope,
    requirementsResult,
    implementations,
    dashboardsResult,
    alertingResult,
    testingResult,
    runbooksResult,
    targetCoverage,
    platforms,
    outputDir
  });

  artifacts.push(...reportResult.artifacts);

  // ============================================================================
  // PHASE 10: OBSERVABILITY SCORING AND ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 10: Computing observability score and final assessment');

  const assessmentResult = await ctx.task(observabilityAssessmentTask, {
    systemName,
    observabilityScope,
    targetCoverage,
    actualCoverage: testingResult.actualCoverage,
    implementations,
    dashboardsCount: dashboardsResult.dashboards.length,
    alertsCount: alertingResult.alerts.length,
    runbooksCount: runbooksResult.runbooks.length,
    testingResult,
    outputDir
  });

  observabilityScore = assessmentResult.observabilityScore;
  artifacts.push(...assessmentResult.artifacts);

  ctx.log('info', `Observability Score: ${observabilityScore}/100`);

  // Final Breakpoint: Observability Implementation Review
  await ctx.breakpoint({
    question: `Observability Implementation Complete for ${systemName}. Score: ${observabilityScore}/100. Coverage: ${testingResult.actualCoverage}% (Target: ${targetCoverage}%). Approve implementation?`,
    title: 'Final Observability Review',
    context: {
      runId: ctx.runId,
      summary: {
        observabilityScore,
        actualCoverage: testingResult.actualCoverage,
        targetCoverage,
        metricsConfigured: metricsResult?.metricsConfigured || 0,
        dashboardsCreated: dashboardsResult.dashboards.length,
        alertsConfigured: alertingResult.alerts.length,
        runbooksCreated: runbooksResult.runbooks.length
      },
      pillars: {
        logging: implementations.find(i => i.phase === 'Structured Logging')?.result.coveragePercentage || 0,
        metrics: metricsResult?.metricsConfigured || 0,
        tracing: implementations.find(i => i.phase === 'Distributed Tracing')?.result.coveragePercentage || 0
      },
      verdict: assessmentResult.verdict,
      recommendation: assessmentResult.recommendation,
      files: [
        { path: reportResult.reportPath, format: 'markdown', label: 'Observability Implementation Report' },
        { path: assessmentResult.summaryPath, format: 'json', label: 'Assessment Summary' },
        { path: dashboardsResult.dashboardsConfigPath, format: 'json', label: 'Dashboards Configuration' }
      ]
    }
  });

  // ============================================================================
  // PHASE 11: DOCUMENTATION AND MAINTENANCE PLAN
  // ============================================================================

  ctx.log('info', 'Phase 11: Creating documentation and maintenance plan');

  const documentationResult = await ctx.task(documentationTask, {
    systemName,
    implementations,
    dashboardsResult,
    alertingResult,
    runbooksResult,
    platforms,
    retentionDays,
    outputDir
  });

  artifacts.push(...documentationResult.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    systemName,
    observabilityScope,
    observabilityScore,
    actualCoverage: testingResult.actualCoverage,
    targetCoverage,
    platforms,
    threePillars: {
      logging: {
        enabled: enableLogAggregation,
        componentsInstrumented: implementations.find(i => i.phase === 'Structured Logging')?.result.componentsInstrumented || 0,
        coverage: implementations.find(i => i.phase === 'Structured Logging')?.result.coveragePercentage || 0
      },
      metrics: {
        enabled: enableMetricsCollection,
        metricsConfigured: metricsResult?.metricsConfigured || 0,
        slis: requirementsResult.slis.length,
        goldenSignals: metricsResult?.goldenSignals || []
      },
      tracing: {
        enabled: enableDistributedTracing,
        servicesInstrumented: implementations.find(i => i.phase === 'Distributed Tracing')?.result.servicesInstrumented || 0,
        coverage: implementations.find(i => i.phase === 'Distributed Tracing')?.result.coveragePercentage || 0
      }
    },
    implementations: implementations.map(impl => ({
      phase: impl.phase,
      componentsInstrumented: impl.result.componentsInstrumented || impl.result.servicesInstrumented || 0,
      coverage: impl.result.coveragePercentage || 0
    })),
    dashboards: dashboardsResult.dashboards.map(d => ({
      name: d.name,
      type: d.type,
      url: d.url,
      panelCount: d.panelCount
    })),
    alerts: {
      totalAlerts: alertingResult.alerts.length,
      criticalAlerts: alertingResult.criticalAlerts.length,
      channels: alertingResult.channels,
      errorBudgetMonitoring: alertingResult.errorBudgetAlerts
    },
    runbooks: {
      count: runbooksResult.runbooks.length,
      scenarios: runbooksResult.runbooks.map(r => r.scenario)
    },
    testing: {
      actualCoverage: testingResult.actualCoverage,
      gaps: testingResult.gaps,
      testsPassed: testingResult.testsPassed,
      testsTotal: testingResult.testsTotal
    },
    artifacts,
    documentation: {
      reportPath: reportResult.reportPath,
      summaryPath: assessmentResult.summaryPath,
      dashboardsConfigPath: dashboardsResult.dashboardsConfigPath,
      maintenancePlanPath: documentationResult.maintenancePlanPath
    },
    duration,
    metadata: {
      processId: 'specializations/software-architecture/observability-implementation',
      processSlug: 'observability-implementation',
      category: 'software-architecture',
      specializationSlug: 'software-architecture',
      timestamp: startTime,
      observabilityScope,
      platforms,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: Define Observability Requirements
export const defineRequirementsTask = defineTask('define-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Define Observability Requirements - ${args.systemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Observability Architect',
      task: 'Define comprehensive observability requirements for the system',
      context: {
        systemName: args.systemName,
        observabilityScope: args.observabilityScope,
        slos: args.slos,
        platforms: args.platforms,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze system architecture and identify observability needs',
        '2. Define key metrics to track (RED/USE metrics, business metrics)',
        '   - RED: Rate, Errors, Duration',
        '   - USE: Utilization, Saturation, Errors',
        '3. Identify critical log events (errors, warnings, security events, business events)',
        '4. Define trace points for distributed tracing (service calls, database queries, external APIs)',
        '5. Create Service Level Indicators (SLIs) based on SLOs',
        '6. Define the Four Golden Signals: Latency, Traffic, Errors, Saturation',
        '7. Identify custom business metrics (orders, revenue, user actions)',
        '8. Plan observability coverage for all system components',
        '9. Document observability requirements with justifications',
        '10. Estimate coverage percentage for proposed implementation'
      ],
      outputFormat: 'JSON object with observability requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'metrics', 'logEvents', 'traces', 'slis', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        metrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['counter', 'gauge', 'histogram', 'summary'] },
              category: { type: 'string', enum: ['RED', 'USE', 'golden-signal', 'business', 'custom'] },
              description: { type: 'string' },
              unit: { type: 'string' },
              labels: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        logEvents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              event: { type: 'string' },
              level: { type: 'string', enum: ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'] },
              component: { type: 'string' },
              description: { type: 'string' },
              structuredFields: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        traces: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              operation: { type: 'string' },
              service: { type: 'string' },
              type: { type: 'string', enum: ['http', 'grpc', 'database', 'cache', 'queue', 'external'] },
              description: { type: 'string' }
            }
          }
        },
        slis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              metric: { type: 'string' },
              target: { type: 'number' },
              unit: { type: 'string' }
            }
          }
        },
        goldenSignals: {
          type: 'array',
          items: { type: 'string' },
          description: 'Latency, Traffic, Errors, Saturation'
        },
        estimatedCoverage: { type: 'number', description: 'Estimated coverage percentage' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'observability-implementation', 'requirements']
}));

// Phase 2: Implement Structured Logging
export const structuredLoggingTask = defineTask('structured-logging', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Implement Structured Logging - ${args.systemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Logging Infrastructure Specialist',
      task: 'Implement structured logging across the system',
      context: {
        systemName: args.systemName,
        observabilityScope: args.observabilityScope,
        logEvents: args.logEvents,
        loggingStandard: args.loggingStandard,
        logLevels: args.logLevels,
        platforms: args.platforms,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Standardize log format (JSON structured logging)',
        '2. Define consistent log schema with required fields:',
        '   - timestamp, level, service, correlation_id, message, context',
        '3. Implement correlation IDs for request tracing',
        '4. Add contextual fields (user_id, session_id, trace_id, span_id)',
        '5. Instrument application code with structured logging',
        '6. Configure log levels per environment (debug in dev, info+ in prod)',
        '7. Set up log aggregation (ELK, Splunk, CloudWatch, etc.)',
        '8. Implement log sampling for high-volume logs',
        '9. Add log retention policies',
        '10. Document logging standards and examples',
        '11. Create log parsing and search patterns'
      ],
      outputFormat: 'JSON object with structured logging implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'componentsInstrumented', 'logFormat', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        componentsInstrumented: { type: 'number', description: 'Number of components instrumented' },
        logFormat: {
          type: 'object',
          properties: {
            standard: { type: 'string' },
            requiredFields: { type: 'array', items: { type: 'string' } },
            optionalFields: { type: 'array', items: { type: 'string' } }
          }
        },
        contextFields: {
          type: 'array',
          items: { type: 'string' },
          description: 'Correlation and context fields'
        },
        logAggregation: {
          type: 'object',
          properties: {
            platform: { type: 'string' },
            configured: { type: 'boolean' },
            retentionDays: { type: 'number' }
          }
        },
        coveragePercentage: { type: 'number', description: 'Percentage of system with structured logging' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'observability-implementation', 'logging']
}));

// Phase 3: Define Metrics and SLIs
export const defineMetricsTask = defineTask('define-metrics', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Define Metrics and SLIs - ${args.systemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Site Reliability Engineer (SRE)',
      task: 'Define and configure comprehensive metrics and SLIs',
      context: {
        systemName: args.systemName,
        observabilityScope: args.observabilityScope,
        metrics: args.metrics,
        slos: args.slos,
        platforms: args.platforms,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure the Four Golden Signals:',
        '   - Latency: Request/response duration (histogram)',
        '   - Traffic: Requests per second (counter)',
        '   - Errors: Error rate and count (counter)',
        '   - Saturation: Resource utilization (gauge)',
        '2. Implement RED metrics for request-driven services:',
        '   - Rate: Requests per second',
        '   - Errors: Error rate',
        '   - Duration: Latency percentiles (p50, p95, p99)',
        '3. Implement USE metrics for resource-driven services:',
        '   - Utilization: CPU, Memory, Disk, Network usage',
        '   - Saturation: Queue depth, thread pool usage',
        '   - Errors: Resource errors',
        '4. Define custom business metrics (orders, signups, revenue)',
        '5. Create Service Level Indicators (SLIs) aligned with SLOs',
        '6. Configure metric labels/tags for multi-dimensional analysis',
        '7. Set up metric collection (Prometheus, StatsD, CloudWatch)',
        '8. Define metric cardinality limits to prevent explosion',
        '9. Implement metric aggregation and rollup policies',
        '10. Document metrics catalog with descriptions and usage'
      ],
      outputFormat: 'JSON object with metrics configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'metricsConfigured', 'goldenSignals', 'slis', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        metricsConfigured: { type: 'number', description: 'Total metrics configured' },
        goldenSignals: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              signal: { type: 'string', enum: ['latency', 'traffic', 'errors', 'saturation'] },
              metrics: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        redMetrics: {
          type: 'object',
          properties: {
            rate: { type: 'array', items: { type: 'string' } },
            errors: { type: 'array', items: { type: 'string' } },
            duration: { type: 'array', items: { type: 'string' } }
          }
        },
        useMetrics: {
          type: 'object',
          properties: {
            utilization: { type: 'array', items: { type: 'string' } },
            saturation: { type: 'array', items: { type: 'string' } },
            errors: { type: 'array', items: { type: 'string' } }
          }
        },
        slis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              metric: { type: 'string' },
              target: { type: 'number' },
              errorBudget: { type: 'number' }
            }
          }
        },
        metricTypes: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'observability-implementation', 'metrics']
}));

// Phase 4: Implement Distributed Tracing
export const distributedTracingTask = defineTask('distributed-tracing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Implement Distributed Tracing - ${args.systemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Distributed Systems Engineer',
      task: 'Implement distributed tracing across microservices',
      context: {
        systemName: args.systemName,
        observabilityScope: args.observabilityScope,
        traces: args.traces,
        tracingStandard: args.tracingStandard,
        samplingRate: args.samplingRate,
        platforms: args.platforms,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Implement tracing standard (OpenTelemetry, Jaeger, Zipkin)',
        '2. Instrument service-to-service calls with trace context propagation',
        '3. Create spans for:',
        '   - HTTP/gRPC requests',
        '   - Database queries',
        '   - Cache operations',
        '   - External API calls',
        '   - Message queue operations',
        '4. Add span attributes (service.name, http.method, db.statement, etc.)',
        '5. Implement context propagation (W3C Trace Context)',
        '6. Configure sampling strategy (head-based, tail-based, adaptive)',
        '7. Set up trace collection backend (Jaeger, Zipkin, X-Ray)',
        '8. Add custom spans for critical business operations',
        '9. Implement trace-log correlation (include trace_id in logs)',
        '10. Configure trace retention and sampling rates',
        '11. Document tracing implementation and best practices'
      ],
      outputFormat: 'JSON object with distributed tracing implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'servicesInstrumented', 'tracingStandard', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        servicesInstrumented: { type: 'number', description: 'Number of services instrumented' },
        tracingStandard: { type: 'string', description: 'OpenTelemetry, Jaeger, Zipkin, etc.' },
        contextPropagation: {
          type: 'object',
          properties: {
            standard: { type: 'string', description: 'W3C Trace Context, B3, etc.' },
            headers: { type: 'array', items: { type: 'string' } }
          }
        },
        spanTypes: {
          type: 'array',
          items: { type: 'string' },
          description: 'HTTP, gRPC, database, cache, queue, etc.'
        },
        samplingRate: { type: 'number', description: 'Sampling rate (0.0-1.0)' },
        samplingStrategy: { type: 'string', description: 'head-based, tail-based, adaptive' },
        traceBackend: {
          type: 'object',
          properties: {
            platform: { type: 'string' },
            configured: { type: 'boolean' }
          }
        },
        coveragePercentage: { type: 'number', description: 'Percentage of services with tracing' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'observability-implementation', 'tracing']
}));

// Phase 5: Create Dashboards
export const createDashboardsTask = defineTask('create-dashboards', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Create Observability Dashboards - ${args.systemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Observability Visualization Specialist',
      task: 'Create comprehensive observability dashboards',
      context: {
        systemName: args.systemName,
        observabilityScope: args.observabilityScope,
        metrics: args.metrics,
        slis: args.slis,
        platforms: args.platforms,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create System Overview Dashboard:',
        '   - Golden Signals (Latency, Traffic, Errors, Saturation)',
        '   - SLI/SLO compliance',
        '   - System health status',
        '2. Create Service-Level Dashboards per microservice:',
        '   - RED metrics (Rate, Errors, Duration)',
        '   - Resource utilization',
        '   - Dependencies health',
        '3. Create Infrastructure Dashboard:',
        '   - USE metrics (Utilization, Saturation, Errors)',
        '   - Host metrics (CPU, Memory, Disk, Network)',
        '   - Container/pod metrics',
        '4. Create Business Metrics Dashboard:',
        '   - Key business KPIs',
        '   - User journey metrics',
        '   - Revenue/conversion metrics',
        '5. Add time-series graphs, heatmaps, histograms, gauges',
        '6. Configure dashboard variables (service, environment, time range)',
        '7. Set appropriate time ranges and refresh rates',
        '8. Create alerting panels for critical metrics',
        '9. Document dashboard usage and interpretation',
        '10. Export dashboard definitions as code (JSON/YAML)'
      ],
      outputFormat: 'JSON object with dashboard definitions'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'dashboards', 'dashboardsConfigPath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        dashboards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['system-overview', 'service', 'infrastructure', 'business', 'custom'] },
              description: { type: 'string' },
              panelCount: { type: 'number' },
              url: { type: 'string' },
              variables: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        dashboardsConfigPath: { type: 'string', description: 'Path to dashboards configuration' },
        platform: { type: 'string', description: 'Grafana, CloudWatch, Datadog, etc.' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'observability-implementation', 'dashboards']
}));

// Phase 6: Set Up Alerts
export const setupAlertsTask = defineTask('setup-alerts', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Setup Alerts and Notifications - ${args.systemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Alert Engineering Specialist',
      task: 'Configure comprehensive alerting and notification system',
      context: {
        systemName: args.systemName,
        slos: args.slos,
        slis: args.slis,
        metrics: args.metrics,
        alertingChannels: args.alertingChannels,
        platforms: args.platforms,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define alert severity levels (Critical, High, Medium, Low)',
        '2. Create SLO-based alerts with error budget monitoring',
        '3. Configure Golden Signal alerts:',
        '   - Latency: p95/p99 latency exceeds threshold',
        '   - Traffic: Unusual traffic patterns (spike/drop)',
        '   - Errors: Error rate exceeds threshold',
        '   - Saturation: Resource usage exceeds capacity',
        '4. Create symptom-based alerts (not cause-based)',
        '5. Implement multi-window alerting (5min, 15min, 1hour)',
        '6. Add alert context (runbook links, dashboard links, recent events)',
        '7. Configure notification channels (email, Slack, PagerDuty, OpsGenie)',
        '8. Set up alert routing based on severity and service',
        '9. Implement alert suppression and deduplication',
        '10. Configure on-call schedules and escalation policies',
        '11. Add alerting for monitoring system health (meta-monitoring)',
        '12. Document alert definitions and response expectations'
      ],
      outputFormat: 'JSON object with alert configurations'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'alerts', 'severity', 'channels', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        alerts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['slo', 'golden-signal', 'symptom', 'custom'] },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              condition: { type: 'string' },
              threshold: { type: 'string' },
              duration: { type: 'string' },
              channel: { type: 'string' },
              runbookUrl: { type: 'string' }
            }
          }
        },
        criticalAlerts: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of critical alert names'
        },
        severity: {
          type: 'array',
          items: { type: 'string' },
          description: 'Severity levels configured'
        },
        channels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              configured: { type: 'boolean' }
            }
          }
        },
        errorBudgetAlerts: { type: 'number', description: 'Number of error budget alerts' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'observability-implementation', 'alerting']
}));

// Phase 7: Test Observability
export const testObservabilityTask = defineTask('test-observability', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Test Observability Implementation - ${args.systemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Observability Testing Engineer',
      task: 'Validate observability implementation and coverage',
      context: {
        systemName: args.systemName,
        implementations: args.implementations,
        requirementsResult: args.requirementsResult,
        targetCoverage: args.targetCoverage,
        platforms: args.platforms,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Verify structured logs are being emitted correctly',
        '2. Validate log format consistency and required fields',
        '3. Test correlation ID propagation across services',
        '4. Verify all defined metrics are being collected',
        '5. Check metric cardinality is within limits',
        '6. Validate distributed traces are capturing all spans',
        '7. Test trace context propagation across service boundaries',
        '8. Verify dashboards are displaying correct data',
        '9. Test alert firing with synthetic failures',
        '10. Validate alert routing to correct channels',
        '11. Calculate actual observability coverage percentage',
        '12. Identify gaps in observability coverage',
        '13. Test observability under load (stress test)',
        '14. Verify data retention policies are working',
        '15. Generate observability testing report'
      ],
      outputFormat: 'JSON object with testing results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'actualCoverage', 'testsPassed', 'testsTotal', 'gaps', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        actualCoverage: { type: 'number', description: 'Actual observability coverage %' },
        testsPassed: { type: 'number' },
        testsTotal: { type: 'number' },
        testResults: {
          type: 'object',
          properties: {
            loggingTests: {
              type: 'object',
              properties: {
                passed: { type: 'number' },
                failed: { type: 'number' },
                issues: { type: 'array', items: { type: 'string' } }
              }
            },
            metricsTests: {
              type: 'object',
              properties: {
                passed: { type: 'number' },
                failed: { type: 'number' },
                issues: { type: 'array', items: { type: 'string' } }
              }
            },
            tracingTests: {
              type: 'object',
              properties: {
                passed: { type: 'number' },
                failed: { type: 'number' },
                issues: { type: 'array', items: { type: 'string' } }
              }
            },
            dashboardTests: {
              type: 'object',
              properties: {
                passed: { type: 'number' },
                failed: { type: 'number' },
                issues: { type: 'array', items: { type: 'string' } }
              }
            },
            alertingTests: {
              type: 'object',
              properties: {
                passed: { type: 'number' },
                failed: { type: 'number' },
                issues: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              component: { type: 'string' },
              gap: { type: 'string' },
              severity: { type: 'string' },
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
  labels: ['agent', 'observability-implementation', 'testing']
}));

// Phase 8: Create Runbooks
export const createRunbooksTask = defineTask('create-runbooks', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Create Incident Response Runbooks - ${args.systemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SRE Runbook Specialist',
      task: 'Create incident response runbooks for common scenarios',
      context: {
        systemName: args.systemName,
        alerts: args.alerts,
        commonScenarios: args.commonScenarios,
        slos: args.slos,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create runbooks for each critical alert',
        '2. Include for each runbook:',
        '   - Symptom description',
        '   - Impact assessment',
        '   - Investigation steps (logs, metrics, traces to check)',
        '   - Common root causes',
        '   - Resolution steps',
        '   - Escalation path',
        '   - Links to relevant dashboards and documentation',
        '3. Create runbooks for common scenarios:',
        '   - High latency',
        '   - High error rate',
        '   - Service unavailability',
        '   - Database connection issues',
        '   - Memory leaks',
        '   - Disk space issues',
        '   - Traffic spikes',
        '4. Add decision trees for troubleshooting',
        '5. Include example queries (logs, metrics, traces)',
        '6. Document rollback procedures',
        '7. Add contact information for escalation',
        '8. Format runbooks in Markdown for easy access',
        '9. Link runbooks to alerts and dashboards'
      ],
      outputFormat: 'JSON object with runbook definitions'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'runbooks', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        runbooks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              scenario: { type: 'string' },
              associatedAlerts: { type: 'array', items: { type: 'string' } },
              severity: { type: 'string' },
              path: { type: 'string' }
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
  labels: ['agent', 'observability-implementation', 'runbooks']
}));

// Phase 9: Report Generation
export const reportGenerationTask = defineTask('report-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Generate Observability Report - ${args.systemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Observability Documentation Specialist',
      task: 'Generate comprehensive observability implementation report',
      context: {
        systemName: args.systemName,
        observabilityScope: args.observabilityScope,
        requirementsResult: args.requirementsResult,
        implementations: args.implementations,
        dashboardsResult: args.dashboardsResult,
        alertingResult: args.alertingResult,
        testingResult: args.testingResult,
        runbooksResult: args.runbooksResult,
        targetCoverage: args.targetCoverage,
        platforms: args.platforms,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create executive summary of observability implementation',
        '2. Document the three pillars implementation:',
        '   - Logging: Coverage, format, aggregation',
        '   - Metrics: Golden Signals, RED/USE, SLIs',
        '   - Tracing: Services instrumented, sampling strategy',
        '3. List all dashboards created with screenshots',
        '4. Document all alerts configured with severity breakdown',
        '5. Present observability coverage analysis',
        '6. Show testing results and validation',
        '7. List all runbooks created',
        '8. Include architecture diagrams showing observability flow',
        '9. Document platforms and tools used',
        '10. Provide maintenance and operational guidelines',
        '11. Add troubleshooting tips and common issues',
        '12. Include getting started guide for on-call engineers',
        '13. Format as professional Markdown document'
      ],
      outputFormat: 'JSON object with report paths'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'reportPath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        reportPath: { type: 'string', description: 'Observability implementation report path' },
        executiveSummary: { type: 'string' },
        keyAchievements: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'observability-implementation', 'reporting']
}));

// Phase 10: Observability Assessment
export const observabilityAssessmentTask = defineTask('observability-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Final Observability Assessment - ${args.systemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Observability Architect',
      task: 'Conduct final observability assessment and scoring',
      context: {
        systemName: args.systemName,
        observabilityScope: args.observabilityScope,
        targetCoverage: args.targetCoverage,
        actualCoverage: args.actualCoverage,
        implementations: args.implementations,
        dashboardsCount: args.dashboardsCount,
        alertsCount: args.alertsCount,
        runbooksCount: args.runbooksCount,
        testingResult: args.testingResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Calculate weighted observability score (0-100):',
        '   - Logging implementation (25% weight)',
        '   - Metrics implementation (30% weight)',
        '   - Tracing implementation (25% weight)',
        '   - Dashboards and visualization (10% weight)',
        '   - Alerting and runbooks (10% weight)',
        '2. Assess coverage against target',
        '3. Evaluate completeness of three pillars',
        '4. Assess production readiness from observability perspective',
        '5. Evaluate adherence to best practices',
        '6. Assess observability maturity level (basic, intermediate, advanced, expert)',
        '7. Identify strengths and areas for improvement',
        '8. Provide overall verdict (excellent/good/acceptable/needs-improvement)',
        '9. Generate actionable recommendations',
        '10. Create final assessment summary document'
      ],
      outputFormat: 'JSON object with observability assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['observabilityScore', 'verdict', 'recommendation', 'summaryPath', 'artifacts'],
      properties: {
        observabilityScore: { type: 'number', minimum: 0, maximum: 100 },
        pillarScores: {
          type: 'object',
          properties: {
            logging: { type: 'number' },
            metrics: { type: 'number' },
            tracing: { type: 'number' },
            dashboards: { type: 'number' },
            alerting: { type: 'number' }
          }
        },
        coverageAssessment: {
          type: 'object',
          properties: {
            actualCoverage: { type: 'number' },
            targetCoverage: { type: 'number' },
            coverageGap: { type: 'number' }
          }
        },
        maturityLevel: { type: 'string', enum: ['basic', 'intermediate', 'advanced', 'expert'] },
        productionReady: { type: 'boolean', description: 'Observability ready for production' },
        verdict: { type: 'string', description: 'Overall verdict' },
        recommendation: { type: 'string', description: 'Recommended next steps' },
        strengths: { type: 'array', items: { type: 'string' } },
        improvements: { type: 'array', items: { type: 'string' } },
        summaryPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'observability-implementation', 'assessment']
}));

// Phase 11: Documentation and Maintenance Plan
export const documentationTask = defineTask('documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Documentation and Maintenance Plan - ${args.systemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Documentation Specialist',
      task: 'Create comprehensive documentation and maintenance plan',
      context: {
        systemName: args.systemName,
        implementations: args.implementations,
        dashboardsResult: args.dashboardsResult,
        alertingResult: args.alertingResult,
        runbooksResult: args.runbooksResult,
        platforms: args.platforms,
        retentionDays: args.retentionDays,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create observability onboarding guide for new team members',
        '2. Document how to access logs, metrics, and traces',
        '3. Provide dashboard usage guide',
        '4. Document alert response procedures',
        '5. Create troubleshooting guide with common scenarios',
        '6. Document observability architecture and data flow',
        '7. Create maintenance plan:',
        '   - Regular dashboard review schedule',
        '   - Alert tuning process',
        '   - Metric and log cleanup',
        '   - Runbook update process',
        '8. Document retention policies and data lifecycle',
        '9. Create cost optimization guidelines',
        '10. Document disaster recovery for observability platform',
        '11. Provide contribution guidelines for adding new observability',
        '12. Include references and further reading'
      ],
      outputFormat: 'JSON object with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'onboardingGuidePath', 'maintenancePlanPath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        onboardingGuidePath: { type: 'string' },
        maintenancePlanPath: { type: 'string' },
        troubleshootingGuidePath: { type: 'string' },
        architectureDiagramPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'observability-implementation', 'documentation']
}));
