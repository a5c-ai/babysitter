/**
 * @process specializations/devops-sre-platform/monitoring-setup
 * @description Monitoring and Observability Setup - Comprehensive process for implementing production-grade
 * monitoring and observability infrastructure including metrics collection (Prometheus), visualization (Grafana),
 * log aggregation (Loki/ELK), distributed tracing (Jaeger/Tempo), alerting, dashboards, and incident response.
 * Covers the three pillars of observability with SLO-based monitoring and operational runbooks.
 * @inputs { projectName: string, monitoringScope: string, platforms?: array, targetCoverage?: number }
 * @outputs { success: boolean, observabilityScore: number, dashboards: array, alerts: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/devops-sre-platform/monitoring-setup', {
 *   projectName: 'E-commerce Platform',
 *   monitoringScope: 'full-stack', // 'application', 'infrastructure', 'full-stack'
 *   platforms: ['Prometheus', 'Grafana', 'Loki', 'Jaeger'],
 *   targetCoverage: 90,
 *   environment: 'production',
 *   services: ['api-gateway', 'payment-service', 'order-service', 'inventory-service'],
 *   slos: {
 *     availability: 99.9,
 *     latencyP95: 200,
 *     errorRate: 0.1
 *   }
 * });
 *
 * @references
 * - Google SRE Book - Monitoring: https://sre.google/sre-book/monitoring-distributed-systems/
 * - Prometheus Best Practices: https://prometheus.io/docs/practices/
 * - Grafana Documentation: https://grafana.com/docs/
 * - OpenTelemetry: https://opentelemetry.io/docs/
 * - The Three Pillars of Observability: https://www.oreilly.com/library/view/distributed-systems-observability/9781492033431/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    monitoringScope = 'full-stack', // 'application', 'infrastructure', 'full-stack'
    platforms = ['Prometheus', 'Grafana', 'Loki', 'Jaeger'],
    targetCoverage = 85, // percentage of system covered by monitoring
    environment = 'production',
    services = [],
    slos = {
      availability: 99.9,
      latencyP95: 500,
      errorRate: 1.0
    },
    outputDir = 'monitoring-output',
    enableDistributedTracing = true,
    enableLogAggregation = true,
    enableMetricsCollection = true,
    alertingChannels = ['email', 'slack', 'pagerduty'],
    retentionDays = 30,
    infrastructureType = 'kubernetes' // 'kubernetes', 'vm', 'serverless', 'hybrid'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let observabilityScore = 0;
  const implementations = [];
  const dashboards = [];
  const alerts = [];

  ctx.log('info', `Starting Monitoring and Observability Setup for ${projectName}`);
  ctx.log('info', `Scope: ${monitoringScope}, Environment: ${environment}, Target Coverage: ${targetCoverage}%`);
  ctx.log('info', `Platforms: ${platforms.join(', ')}`);

  // ============================================================================
  // PHASE 1: ASSESS MONITORING REQUIREMENTS
  // ============================================================================

  ctx.log('info', 'Phase 1: Assessing monitoring requirements and current state');

  const assessmentResult = await ctx.task(assessMonitoringRequirementsTask, {
    projectName,
    monitoringScope,
    environment,
    services,
    infrastructureType,
    slos,
    platforms,
    outputDir
  });

  artifacts.push(...assessmentResult.artifacts);

  ctx.log('info', `Assessment complete - Identified ${assessmentResult.services.length} services, ${assessmentResult.components.length} components to monitor`);

  // Quality Gate: Requirements review
  await ctx.breakpoint({
    question: `Monitoring requirements assessed for ${projectName}. Identified ${assessmentResult.services.length} services and ${assessmentResult.components.length} components. Review and approve monitoring scope?`,
    title: 'Monitoring Requirements Review',
    context: {
      runId: ctx.runId,
      assessment: {
        services: assessmentResult.services.slice(0, 10),
        components: assessmentResult.components.slice(0, 10),
        goldenSignals: assessmentResult.goldenSignals,
        estimatedCoverage: assessmentResult.estimatedCoverage
      },
      files: assessmentResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 2: DEPLOY PROMETHEUS FOR METRICS COLLECTION
  // ============================================================================

  if (enableMetricsCollection) {
    ctx.log('info', 'Phase 2: Deploying Prometheus for metrics collection');

    const prometheusResult = await ctx.task(deployPrometheusTask, {
      projectName,
      monitoringScope,
      environment,
      infrastructureType,
      services: assessmentResult.services,
      retentionDays,
      platforms,
      outputDir
    });

    implementations.push({
      phase: 'Prometheus Metrics Collection',
      result: prometheusResult
    });

    artifacts.push(...prometheusResult.artifacts);

    ctx.log('info', `Prometheus deployed - Monitoring ${prometheusResult.targets.length} targets with ${prometheusResult.metricsEndpoints} endpoints`);

    // Quality Gate: Prometheus deployment review
    await ctx.breakpoint({
      question: `Prometheus deployed and configured. ${prometheusResult.targets.length} targets configured, ${prometheusResult.metricsEndpoints} metrics endpoints. Verify Prometheus is collecting metrics?`,
      title: 'Prometheus Deployment Review',
      context: {
        runId: ctx.runId,
        prometheus: {
          deployed: prometheusResult.deployed,
          targets: prometheusResult.targets.length,
          metricsEndpoints: prometheusResult.metricsEndpoints,
          scrapeInterval: prometheusResult.scrapeInterval,
          storageRetention: prometheusResult.storageRetention
        },
        files: prometheusResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 3: SET UP GRAFANA DASHBOARDS
  // ============================================================================

  ctx.log('info', 'Phase 3: Setting up Grafana for visualization');

  const grafanaResult = await ctx.task(setupGrafanaTask, {
    projectName,
    monitoringScope,
    environment,
    services: assessmentResult.services,
    goldenSignals: assessmentResult.goldenSignals,
    slos,
    platforms,
    outputDir
  });

  implementations.push({
    phase: 'Grafana Dashboards',
    result: grafanaResult
  });

  artifacts.push(...grafanaResult.artifacts);
  dashboards.push(...grafanaResult.dashboards);

  ctx.log('info', `Grafana deployed - Created ${grafanaResult.dashboards.length} dashboards`);

  // Quality Gate: Grafana dashboard review
  await ctx.breakpoint({
    question: `Grafana deployed with ${grafanaResult.dashboards.length} dashboards created. Review dashboards: ${grafanaResult.dashboards.map(d => d.name).join(', ')}`,
    title: 'Grafana Dashboard Review',
    context: {
      runId: ctx.runId,
      grafana: {
        deployed: grafanaResult.deployed,
        dashboardsCreated: grafanaResult.dashboards.length,
        datasourcesConfigured: grafanaResult.datasources.length
      },
      dashboards: grafanaResult.dashboards.map(d => ({
        name: d.name,
        type: d.type,
        panelCount: d.panelCount,
        url: d.url
      })),
      files: grafanaResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 4: IMPLEMENT LOG AGGREGATION
  // ============================================================================

  if (enableLogAggregation) {
    ctx.log('info', 'Phase 4: Implementing log aggregation');

    const logAggregationResult = await ctx.task(setupLogAggregationTask, {
      projectName,
      monitoringScope,
      environment,
      services: assessmentResult.services,
      logPlatform: platforms.includes('Loki') ? 'Loki' : 'ELK',
      retentionDays,
      infrastructureType,
      platforms,
      outputDir
    });

    implementations.push({
      phase: 'Log Aggregation',
      result: logAggregationResult
    });

    artifacts.push(...logAggregationResult.artifacts);

    ctx.log('info', `Log aggregation configured - Platform: ${logAggregationResult.platform}, Sources: ${logAggregationResult.logSources.length}`);

    // Quality Gate: Log aggregation review
    await ctx.breakpoint({
      question: `Log aggregation configured using ${logAggregationResult.platform}. ${logAggregationResult.logSources.length} log sources configured. Verify logs are being collected?`,
      title: 'Log Aggregation Review',
      context: {
        runId: ctx.runId,
        logAggregation: {
          platform: logAggregationResult.platform,
          deployed: logAggregationResult.deployed,
          logSources: logAggregationResult.logSources.length,
          retention: logAggregationResult.retentionDays,
          structuredLogging: logAggregationResult.structuredLoggingEnabled
        },
        files: logAggregationResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 5: DEPLOY DISTRIBUTED TRACING
  // ============================================================================

  if (enableDistributedTracing) {
    ctx.log('info', 'Phase 5: Deploying distributed tracing');

    const tracingResult = await ctx.task(setupDistributedTracingTask, {
      projectName,
      monitoringScope,
      environment,
      services: assessmentResult.services,
      tracingPlatform: platforms.includes('Jaeger') ? 'Jaeger' : 'Tempo',
      samplingRate: 0.1, // 10% sampling
      infrastructureType,
      platforms,
      outputDir
    });

    implementations.push({
      phase: 'Distributed Tracing',
      result: tracingResult
    });

    artifacts.push(...tracingResult.artifacts);

    ctx.log('info', `Distributed tracing deployed - Platform: ${tracingResult.platform}, Services instrumented: ${tracingResult.servicesInstrumented}`);

    // Quality Gate: Distributed tracing review
    await ctx.breakpoint({
      question: `Distributed tracing deployed using ${tracingResult.platform}. ${tracingResult.servicesInstrumented} services instrumented. Verify traces are being collected?`,
      title: 'Distributed Tracing Review',
      context: {
        runId: ctx.runId,
        tracing: {
          platform: tracingResult.platform,
          deployed: tracingResult.deployed,
          servicesInstrumented: tracingResult.servicesInstrumented,
          samplingRate: tracingResult.samplingRate,
          tracingStandard: tracingResult.tracingStandard
        },
        files: tracingResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 6: CONFIGURE SERVICE INSTRUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Configuring service instrumentation');

  const instrumentationResult = await ctx.task(configureServiceInstrumentationTask, {
    projectName,
    services: assessmentResult.services,
    goldenSignals: assessmentResult.goldenSignals,
    enableMetrics: enableMetricsCollection,
    enableLogs: enableLogAggregation,
    enableTraces: enableDistributedTracing,
    infrastructureType,
    platforms,
    outputDir
  });

  implementations.push({
    phase: 'Service Instrumentation',
    result: instrumentationResult
  });

  artifacts.push(...instrumentationResult.artifacts);

  ctx.log('info', `Service instrumentation configured - ${instrumentationResult.servicesInstrumented} services instrumented`);

  // ============================================================================
  // PHASE 7: IMPLEMENT ALERTING RULES
  // ============================================================================

  ctx.log('info', 'Phase 7: Implementing alerting rules');

  const alertingResult = await ctx.task(setupAlertingTask, {
    projectName,
    environment,
    services: assessmentResult.services,
    slos,
    goldenSignals: assessmentResult.goldenSignals,
    alertingChannels,
    platforms,
    outputDir
  });

  implementations.push({
    phase: 'Alerting Rules',
    result: alertingResult
  });

  artifacts.push(...alertingResult.artifacts);
  alerts.push(...alertingResult.alerts);

  ctx.log('info', `Alerting configured - ${alertingResult.alerts.length} alert rules created across ${alertingResult.severity.length} severity levels`);

  // Quality Gate: Alerting configuration review
  await ctx.breakpoint({
    question: `Alerting configured with ${alertingResult.alerts.length} alert rules. Critical alerts: ${alertingResult.criticalAlerts.length}. Review and test alerts?`,
    title: 'Alerting Configuration Review',
    context: {
      runId: ctx.runId,
      alerting: {
        totalAlerts: alertingResult.alerts.length,
        criticalAlerts: alertingResult.criticalAlerts.length,
        channels: alertingResult.channels,
        sloBasedAlerts: alertingResult.sloBasedAlerts
      },
      topAlerts: alertingResult.alerts.slice(0, 10),
      files: alertingResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 8: CREATE INCIDENT RESPONSE RUNBOOKS
  // ============================================================================

  ctx.log('info', 'Phase 8: Creating incident response runbooks');

  const runbooksResult = await ctx.task(createRunbooksTask, {
    projectName,
    environment,
    services: assessmentResult.services,
    alerts: alertingResult.alerts,
    slos,
    platforms,
    outputDir
  });

  implementations.push({
    phase: 'Incident Runbooks',
    result: runbooksResult
  });

  artifacts.push(...runbooksResult.artifacts);

  ctx.log('info', `Runbooks created - ${runbooksResult.runbooks.length} incident response runbooks`);

  // ============================================================================
  // PHASE 9: VALIDATE MONITORING COVERAGE
  // ============================================================================

  ctx.log('info', 'Phase 9: Validating monitoring coverage');

  const validationResult = await ctx.task(validateMonitoringCoverageTask, {
    projectName,
    assessmentResult,
    implementations,
    targetCoverage,
    platforms,
    outputDir
  });

  artifacts.push(...validationResult.artifacts);

  ctx.log('info', `Monitoring coverage validation complete - Coverage: ${validationResult.actualCoverage}%`);

  // Quality Gate: Coverage validation
  if (validationResult.actualCoverage < targetCoverage) {
    await ctx.breakpoint({
      question: `Monitoring coverage ${validationResult.actualCoverage}% is below target ${targetCoverage}%. Gaps identified: ${validationResult.gaps.length}. Address gaps before proceeding?`,
      title: 'Coverage Gap Review',
      context: {
        runId: ctx.runId,
        validation: {
          actualCoverage: validationResult.actualCoverage,
          targetCoverage,
          gaps: validationResult.gaps,
          recommendation: 'Address critical gaps before production deployment'
        },
        files: validationResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 10: CONDUCT END-TO-END TESTING
  // ============================================================================

  ctx.log('info', 'Phase 10: Conducting end-to-end monitoring testing');

  const testingResult = await ctx.task(testMonitoringStackTask, {
    projectName,
    environment,
    implementations,
    dashboards: grafanaResult.dashboards,
    alerts: alertingResult.alerts,
    platforms,
    outputDir
  });

  artifacts.push(...testingResult.artifacts);

  ctx.log('info', `End-to-end testing complete - ${testingResult.testsPassed}/${testingResult.testsTotal} tests passed`);

  // Quality Gate: Testing validation
  if (testingResult.testsFailed > 0) {
    await ctx.breakpoint({
      question: `Monitoring testing complete - ${testingResult.testsFailed} tests failed. Issues: ${testingResult.issues.length}. Review and fix issues?`,
      title: 'Monitoring Testing Review',
      context: {
        runId: ctx.runId,
        testing: {
          testsPassed: testingResult.testsPassed,
          testsFailed: testingResult.testsFailed,
          testsTotal: testingResult.testsTotal,
          issues: testingResult.issues
        },
        files: testingResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 11: GENERATE MONITORING DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 11: Generating monitoring documentation');

  const documentationResult = await ctx.task(generateMonitoringDocumentationTask, {
    projectName,
    environment,
    monitoringScope,
    assessmentResult,
    implementations,
    dashboards: grafanaResult.dashboards,
    alerts: alertingResult.alerts,
    runbooks: runbooksResult.runbooks,
    validationResult,
    testingResult,
    platforms,
    outputDir
  });

  artifacts.push(...documentationResult.artifacts);

  ctx.log('info', `Documentation generated - Report: ${documentationResult.reportPath}`);

  // ============================================================================
  // PHASE 12: CALCULATE OBSERVABILITY SCORE
  // ============================================================================

  ctx.log('info', 'Phase 12: Calculating observability score and final assessment');

  const scoringResult = await ctx.task(calculateObservabilityScoreTask, {
    projectName,
    monitoringScope,
    targetCoverage,
    actualCoverage: validationResult.actualCoverage,
    implementations,
    dashboardsCount: grafanaResult.dashboards.length,
    alertsCount: alertingResult.alerts.length,
    runbooksCount: runbooksResult.runbooks.length,
    testingResult,
    platforms,
    outputDir
  });

  observabilityScore = scoringResult.observabilityScore;
  artifacts.push(...scoringResult.artifacts);

  ctx.log('info', `Observability Score: ${observabilityScore}/100`);

  // Final Breakpoint: Monitoring setup complete
  await ctx.breakpoint({
    question: `Monitoring and Observability Setup Complete for ${projectName}. Score: ${observabilityScore}/100. Coverage: ${validationResult.actualCoverage}% (Target: ${targetCoverage}%). Approve for production deployment?`,
    title: 'Final Monitoring Setup Review',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        environment,
        observabilityScore,
        actualCoverage: validationResult.actualCoverage,
        targetCoverage,
        dashboardsCreated: grafanaResult.dashboards.length,
        alertsConfigured: alertingResult.alerts.length,
        runbooksCreated: runbooksResult.runbooks.length,
        platforms: platforms.join(', ')
      },
      threePillars: {
        metrics: {
          enabled: enableMetricsCollection,
          platform: 'Prometheus',
          targets: implementations.find(i => i.phase === 'Prometheus Metrics Collection')?.result.targets.length || 0
        },
        logs: {
          enabled: enableLogAggregation,
          platform: implementations.find(i => i.phase === 'Log Aggregation')?.result.platform || 'N/A',
          sources: implementations.find(i => i.phase === 'Log Aggregation')?.result.logSources.length || 0
        },
        traces: {
          enabled: enableDistributedTracing,
          platform: implementations.find(i => i.phase === 'Distributed Tracing')?.result.platform || 'N/A',
          servicesInstrumented: implementations.find(i => i.phase === 'Distributed Tracing')?.result.servicesInstrumented || 0
        }
      },
      verdict: scoringResult.verdict,
      recommendation: scoringResult.recommendation,
      files: [
        { path: documentationResult.reportPath, format: 'markdown', label: 'Monitoring Setup Report' },
        { path: scoringResult.summaryPath, format: 'json', label: 'Observability Score Summary' },
        { path: grafanaResult.dashboardsConfigPath, format: 'json', label: 'Grafana Dashboards Configuration' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    environment,
    monitoringScope,
    observabilityScore,
    actualCoverage: validationResult.actualCoverage,
    targetCoverage,
    platforms,
    threePillars: {
      metrics: {
        enabled: enableMetricsCollection,
        platform: 'Prometheus',
        targets: implementations.find(i => i.phase === 'Prometheus Metrics Collection')?.result.targets.length || 0,
        metricsEndpoints: implementations.find(i => i.phase === 'Prometheus Metrics Collection')?.result.metricsEndpoints || 0
      },
      logs: {
        enabled: enableLogAggregation,
        platform: implementations.find(i => i.phase === 'Log Aggregation')?.result.platform || 'N/A',
        logSources: implementations.find(i => i.phase === 'Log Aggregation')?.result.logSources.length || 0,
        structuredLogging: implementations.find(i => i.phase === 'Log Aggregation')?.result.structuredLoggingEnabled || false
      },
      traces: {
        enabled: enableDistributedTracing,
        platform: implementations.find(i => i.phase === 'Distributed Tracing')?.result.platform || 'N/A',
        servicesInstrumented: implementations.find(i => i.phase === 'Distributed Tracing')?.result.servicesInstrumented || 0,
        tracingStandard: implementations.find(i => i.phase === 'Distributed Tracing')?.result.tracingStandard || 'N/A'
      }
    },
    implementations: implementations.map(impl => ({
      phase: impl.phase,
      deployed: impl.result.deployed,
      coverage: impl.result.coverage || impl.result.actualCoverage || 0
    })),
    dashboards: dashboards.map(d => ({
      name: d.name,
      type: d.type,
      url: d.url,
      panelCount: d.panelCount
    })),
    alerts: {
      totalAlerts: alertingResult.alerts.length,
      criticalAlerts: alertingResult.criticalAlerts.length,
      channels: alertingResult.channels,
      sloBasedAlerts: alertingResult.sloBasedAlerts
    },
    runbooks: {
      count: runbooksResult.runbooks.length,
      scenarios: runbooksResult.runbooks.map(r => r.scenario)
    },
    validation: {
      actualCoverage: validationResult.actualCoverage,
      gaps: validationResult.gaps,
      passed: validationResult.actualCoverage >= targetCoverage
    },
    testing: {
      testsPassed: testingResult.testsPassed,
      testsFailed: testingResult.testsFailed,
      testsTotal: testingResult.testsTotal,
      issues: testingResult.issues
    },
    artifacts,
    documentation: {
      reportPath: documentationResult.reportPath,
      summaryPath: scoringResult.summaryPath,
      dashboardsConfigPath: grafanaResult.dashboardsConfigPath
    },
    duration,
    metadata: {
      processId: 'specializations/devops-sre-platform/monitoring-setup',
      processSlug: 'monitoring-setup',
      category: 'devops-sre-platform',
      specializationSlug: 'devops-sre-platform',
      timestamp: startTime,
      monitoringScope,
      platforms,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: Assess Monitoring Requirements
export const assessMonitoringRequirementsTask = defineTask('assess-monitoring-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Assess Monitoring Requirements - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SRE and Monitoring Architect',
      task: 'Assess monitoring requirements and identify what needs to be monitored',
      context: {
        projectName: args.projectName,
        monitoringScope: args.monitoringScope,
        environment: args.environment,
        services: args.services,
        infrastructureType: args.infrastructureType,
        slos: args.slos,
        platforms: args.platforms,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze the project architecture and identify all services/components to monitor',
        '2. For each service, identify:',
        '   - Service endpoints and APIs',
        '   - Dependencies (databases, caches, message queues, external APIs)',
        '   - Critical business flows',
        '3. Define the Four Golden Signals for each service:',
        '   - Latency: Request/response duration',
        '   - Traffic: Requests per second',
        '   - Errors: Error rate and types',
        '   - Saturation: Resource utilization (CPU, memory, disk, network)',
        '4. Identify RED metrics (Rate, Errors, Duration) for request-driven services',
        '5. Identify USE metrics (Utilization, Saturation, Errors) for resource-driven components',
        '6. Define Service Level Indicators (SLIs) based on provided SLOs',
        '7. Identify infrastructure components to monitor (nodes, pods, containers, VMs)',
        '8. Identify log sources and critical log events',
        '9. Identify trace points for distributed tracing',
        '10. Estimate monitoring coverage for proposed implementation',
        '11. Create monitoring requirements document'
      ],
      outputFormat: 'JSON object with monitoring assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'services', 'components', 'goldenSignals', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        services: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['api', 'web', 'worker', 'database', 'cache', 'queue', 'gateway'] },
              endpoints: { type: 'array', items: { type: 'string' } },
              dependencies: { type: 'array', items: { type: 'string' } },
              criticalFlows: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        components: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              monitoringNeeds: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        goldenSignals: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              service: { type: 'string' },
              latency: { type: 'object' },
              traffic: { type: 'object' },
              errors: { type: 'object' },
              saturation: { type: 'object' }
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
        estimatedCoverage: { type: 'number', description: 'Estimated monitoring coverage percentage' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'monitoring-setup', 'assessment']
}));

// Phase 2: Deploy Prometheus
export const deployPrometheusTask = defineTask('deploy-prometheus', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Deploy Prometheus - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DevOps Engineer specializing in Prometheus',
      task: 'Deploy and configure Prometheus for metrics collection',
      context: {
        projectName: args.projectName,
        monitoringScope: args.monitoringScope,
        environment: args.environment,
        infrastructureType: args.infrastructureType,
        services: args.services,
        retentionDays: args.retentionDays,
        platforms: args.platforms,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Deploy Prometheus based on infrastructure type:',
        '   - Kubernetes: Use Prometheus Operator or Helm chart',
        '   - VM: Install Prometheus binary or use Docker',
        '   - Serverless: Use managed Prometheus (Amazon Managed Service for Prometheus, etc.)',
        '2. Configure Prometheus with:',
        '   - Scrape interval (15s recommended)',
        '   - Evaluation interval (15s recommended)',
        '   - Storage retention (based on retentionDays)',
        '   - Resource limits (CPU, memory)',
        '3. Configure service discovery:',
        '   - Kubernetes: Use kubernetes_sd_configs',
        '   - VM: Use file_sd_configs or consul_sd_configs',
        '   - Static targets for external services',
        '4. Add scrape configs for each service/component',
        '5. Configure relabeling rules for consistent labels',
        '6. Set up remote write (if needed for long-term storage)',
        '7. Enable Prometheus metrics endpoint (/metrics)',
        '8. Configure alert manager endpoint',
        '9. Test Prometheus is scraping targets successfully',
        '10. Create Prometheus configuration files',
        '11. Document Prometheus setup and access'
      ],
      outputFormat: 'JSON object with Prometheus deployment details'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'deployed', 'targets', 'metricsEndpoints', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        deployed: { type: 'boolean' },
        targets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              job: { type: 'string' },
              targets: { type: 'array', items: { type: 'string' } },
              labels: { type: 'object' }
            }
          }
        },
        metricsEndpoints: { type: 'number', description: 'Total metrics endpoints configured' },
        scrapeInterval: { type: 'string', description: 'Scrape interval (e.g., 15s)' },
        storageRetention: { type: 'string', description: 'Storage retention period' },
        serviceDiscovery: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            configured: { type: 'boolean' }
          }
        },
        prometheusUrl: { type: 'string', description: 'Prometheus UI URL' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'monitoring-setup', 'prometheus']
}));

// Phase 3: Setup Grafana
export const setupGrafanaTask = defineTask('setup-grafana', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Setup Grafana Dashboards - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Grafana Dashboard Specialist',
      task: 'Deploy Grafana and create monitoring dashboards',
      context: {
        projectName: args.projectName,
        monitoringScope: args.monitoringScope,
        environment: args.environment,
        services: args.services,
        goldenSignals: args.goldenSignals,
        slos: args.slos,
        platforms: args.platforms,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Deploy Grafana (Kubernetes, VM, or managed service)',
        '2. Configure Prometheus as datasource',
        '3. Create System Overview Dashboard:',
        '   - Golden Signals across all services',
        '   - SLO compliance indicators',
        '   - Overall system health',
        '   - Resource utilization summary',
        '4. Create Service-Level Dashboards (one per service):',
        '   - RED metrics (Rate, Errors, Duration)',
        '   - Service-specific metrics',
        '   - Dependencies health',
        '   - Resource usage (CPU, memory, network)',
        '5. Create Infrastructure Dashboard:',
        '   - Node/pod metrics',
        '   - Cluster metrics (for Kubernetes)',
        '   - Storage metrics',
        '   - Network metrics',
        '6. Add dashboard features:',
        '   - Time range selectors',
        '   - Template variables (service, environment)',
        '   - Panel links to related dashboards',
        '   - Threshold markers for SLOs',
        '7. Configure dashboard refresh rates',
        '8. Set up dashboard folders and organization',
        '9. Export dashboards as JSON',
        '10. Document dashboard usage and interpretation'
      ],
      outputFormat: 'JSON object with Grafana deployment and dashboards'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'deployed', 'dashboards', 'dashboardsConfigPath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        deployed: { type: 'boolean' },
        dashboards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['system-overview', 'service', 'infrastructure', 'slo', 'custom'] },
              description: { type: 'string' },
              panelCount: { type: 'number' },
              url: { type: 'string' },
              variables: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        dashboardsConfigPath: { type: 'string', description: 'Path to dashboards JSON configuration' },
        datasources: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              url: { type: 'string' }
            }
          }
        },
        grafanaUrl: { type: 'string', description: 'Grafana UI URL' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'monitoring-setup', 'grafana']
}));

// Phase 4: Setup Log Aggregation
export const setupLogAggregationTask = defineTask('setup-log-aggregation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Setup Log Aggregation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Logging Infrastructure Engineer',
      task: 'Deploy and configure log aggregation system',
      context: {
        projectName: args.projectName,
        monitoringScope: args.monitoringScope,
        environment: args.environment,
        services: args.services,
        logPlatform: args.logPlatform,
        retentionDays: args.retentionDays,
        infrastructureType: args.infrastructureType,
        platforms: args.platforms,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Deploy log aggregation platform:',
        '   - Loki: Deploy Loki + Promtail (recommended for Kubernetes)',
        '   - ELK: Deploy Elasticsearch + Logstash + Kibana (alternative)',
        '2. Configure log collection agents:',
        '   - Promtail: Configure scrape configs for pods/containers',
        '   - Filebeat: Configure log file inputs and outputs',
        '   - Fluentd: Configure input and output plugins',
        '3. Standardize log format (JSON structured logging):',
        '   - timestamp, level, service, message, context fields',
        '   - Correlation IDs (trace_id, span_id, request_id)',
        '4. Configure log parsing and extraction',
        '5. Set up log retention policies',
        '6. Configure log sampling (if needed for high-volume logs)',
        '7. Create log queries and saved searches for common patterns',
        '8. Set up log-based metrics (error counts, latency from logs)',
        '9. Test log collection from all services',
        '10. Document logging standards and access'
      ],
      outputFormat: 'JSON object with log aggregation setup'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'deployed', 'platform', 'logSources', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        deployed: { type: 'boolean' },
        platform: { type: 'string', description: 'Loki, ELK, or other platform' },
        logSources: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              source: { type: 'string' },
              service: { type: 'string' },
              logType: { type: 'string' },
              format: { type: 'string' }
            }
          }
        },
        collectionAgent: { type: 'string', description: 'Promtail, Filebeat, Fluentd, etc.' },
        structuredLoggingEnabled: { type: 'boolean' },
        retentionDays: { type: 'number' },
        logAggregationUrl: { type: 'string', description: 'Log aggregation UI URL' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'monitoring-setup', 'logging']
}));

// Phase 5: Setup Distributed Tracing
export const setupDistributedTracingTask = defineTask('setup-distributed-tracing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Setup Distributed Tracing - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Distributed Tracing Specialist',
      task: 'Deploy and configure distributed tracing system',
      context: {
        projectName: args.projectName,
        monitoringScope: args.monitoringScope,
        environment: args.environment,
        services: args.services,
        tracingPlatform: args.tracingPlatform,
        samplingRate: args.samplingRate,
        infrastructureType: args.infrastructureType,
        platforms: args.platforms,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Deploy distributed tracing platform:',
        '   - Jaeger: All-in-one or production deployment',
        '   - Tempo: Grafana Tempo with object storage',
        '   - Zipkin: Alternative tracing backend',
        '2. Configure tracing standard (OpenTelemetry recommended)',
        '3. Instrument services for tracing:',
        '   - HTTP/REST service calls',
        '   - gRPC calls',
        '   - Database queries',
        '   - Cache operations',
        '   - Message queue operations',
        '4. Implement context propagation (W3C Trace Context)',
        '5. Configure sampling strategy:',
        '   - Head-based sampling (sample at trace creation)',
        '   - Tail-based sampling (sample after trace completion)',
        '   - Adaptive sampling (adjust based on load)',
        '6. Add span attributes and tags',
        '7. Configure trace storage and retention',
        '8. Integrate with Grafana for visualization',
        '9. Test trace collection and propagation',
        '10. Document tracing setup and usage'
      ],
      outputFormat: 'JSON object with distributed tracing setup'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'deployed', 'platform', 'servicesInstrumented', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        deployed: { type: 'boolean' },
        platform: { type: 'string', description: 'Jaeger, Tempo, Zipkin, etc.' },
        tracingStandard: { type: 'string', description: 'OpenTelemetry, Jaeger, Zipkin' },
        servicesInstrumented: { type: 'number', description: 'Number of services with tracing' },
        contextPropagation: {
          type: 'object',
          properties: {
            standard: { type: 'string', description: 'W3C Trace Context, B3, etc.' },
            headers: { type: 'array', items: { type: 'string' } }
          }
        },
        samplingRate: { type: 'number', description: 'Sampling rate (0.0-1.0)' },
        samplingStrategy: { type: 'string', description: 'head-based, tail-based, adaptive' },
        tracingUrl: { type: 'string', description: 'Tracing UI URL' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'monitoring-setup', 'tracing']
}));

// Phase 6: Configure Service Instrumentation
export const configureServiceInstrumentationTask = defineTask('configure-service-instrumentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Configure Service Instrumentation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Application Observability Engineer',
      task: 'Instrument services with metrics, logs, and traces',
      context: {
        projectName: args.projectName,
        services: args.services,
        goldenSignals: args.goldenSignals,
        enableMetrics: args.enableMetrics,
        enableLogs: args.enableLogs,
        enableTraces: args.enableTraces,
        infrastructureType: args.infrastructureType,
        platforms: args.platforms,
        outputDir: args.outputDir
      },
      instructions: [
        '1. For each service, add instrumentation libraries:',
        '   - Prometheus client libraries (for metrics)',
        '   - Structured logging libraries (for logs)',
        '   - OpenTelemetry SDK (for traces)',
        '2. Instrument metrics collection:',
        '   - Expose /metrics endpoint',
        '   - Add RED metrics (request rate, error rate, duration)',
        '   - Add USE metrics (utilization, saturation, errors)',
        '   - Add custom business metrics',
        '   - Add labels/tags for multi-dimensional analysis',
        '3. Implement structured logging:',
        '   - JSON log format',
        '   - Standard fields (timestamp, level, service, message)',
        '   - Correlation fields (trace_id, span_id, request_id)',
        '   - Contextual fields (user_id, session_id)',
        '4. Add distributed tracing:',
        '   - Create spans for operations',
        '   - Propagate trace context',
        '   - Add span attributes',
        '   - Link traces with logs',
        '5. Implement health check endpoints (/health, /ready)',
        '6. Add service metadata and version info',
        '7. Test instrumentation is working',
        '8. Create instrumentation guide for developers'
      ],
      outputFormat: 'JSON object with service instrumentation details'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'servicesInstrumented', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        servicesInstrumented: { type: 'number' },
        instrumentationDetails: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              service: { type: 'string' },
              metricsEnabled: { type: 'boolean' },
              logsEnabled: { type: 'boolean' },
              tracesEnabled: { type: 'boolean' },
              metricsEndpoint: { type: 'string' },
              healthCheckEndpoint: { type: 'string' }
            }
          }
        },
        libraries: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              language: { type: 'string' },
              metricsLibrary: { type: 'string' },
              loggingLibrary: { type: 'string' },
              tracingLibrary: { type: 'string' }
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
  labels: ['agent', 'monitoring-setup', 'instrumentation']
}));

// Phase 7: Setup Alerting
export const setupAlertingTask = defineTask('setup-alerting', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Setup Alerting Rules - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SRE Alert Engineering Specialist',
      task: 'Configure comprehensive alerting rules and notifications',
      context: {
        projectName: args.projectName,
        environment: args.environment,
        services: args.services,
        slos: args.slos,
        goldenSignals: args.goldenSignals,
        alertingChannels: args.alertingChannels,
        platforms: args.platforms,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Deploy Alertmanager (if using Prometheus)',
        '2. Define alert severity levels: Critical, High, Medium, Low',
        '3. Create SLO-based alerts:',
        '   - Availability SLO violations',
        '   - Latency SLO violations (p95, p99)',
        '   - Error budget burn rate alerts',
        '4. Create Golden Signal alerts:',
        '   - Latency: High p95/p99 latency',
        '   - Traffic: Unusual traffic patterns (spike/drop)',
        '   - Errors: High error rate',
        '   - Saturation: High resource utilization',
        '5. Create symptom-based alerts (what users experience):',
        '   - Service unavailable',
        '   - Slow response times',
        '   - Failed requests',
        '6. Use multi-window alerting (5min, 15min, 1hour)',
        '7. Add alert metadata:',
        '   - Description and impact',
        '   - Runbook link',
        '   - Dashboard link',
        '   - Severity',
        '8. Configure notification channels:',
        '   - Email for all alerts',
        '   - Slack for medium+ alerts',
        '   - PagerDuty for critical alerts',
        '9. Set up alert routing and grouping',
        '10. Configure alert inhibition and silencing',
        '11. Test alerts with synthetic failures',
        '12. Document alert definitions and response expectations'
      ],
      outputFormat: 'JSON object with alerting configuration'
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
              type: { type: 'string', enum: ['slo', 'golden-signal', 'symptom', 'resource', 'custom'] },
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
        sloBasedAlerts: { type: 'number', description: 'Number of SLO-based alerts' },
        alertmanagerUrl: { type: 'string', description: 'Alertmanager UI URL' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'monitoring-setup', 'alerting']
}));

// Phase 8: Create Runbooks
export const createRunbooksTask = defineTask('create-runbooks', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Create Incident Response Runbooks - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SRE Runbook Specialist',
      task: 'Create incident response runbooks for alerts and common scenarios',
      context: {
        projectName: args.projectName,
        environment: args.environment,
        services: args.services,
        alerts: args.alerts,
        slos: args.slos,
        platforms: args.platforms,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create a runbook for each critical and high severity alert',
        '2. For each runbook, include:',
        '   - Alert name and description',
        '   - Impact on users and business',
        '   - Investigation steps:',
        '     * Prometheus queries to run',
        '     * Grafana dashboards to check',
        '     * Log queries to execute',
        '     * Traces to examine',
        '   - Common root causes',
        '   - Resolution steps with commands',
        '   - Mitigation options',
        '   - Escalation path and contacts',
        '3. Create runbooks for common scenarios:',
        '   - High latency / slow response times',
        '   - High error rate',
        '   - Service unavailability / downtime',
        '   - Database connection issues',
        '   - Memory leaks',
        '   - Disk space full',
        '   - CPU saturation',
        '   - Network connectivity issues',
        '   - Traffic spikes',
        '   - Deployment rollback',
        '4. Add troubleshooting decision trees',
        '5. Include example queries and commands',
        '6. Link to relevant dashboards and documentation',
        '7. Format runbooks in Markdown',
        '8. Create runbook index for easy navigation'
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
              path: { type: 'string' },
              tags: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        runbookIndexPath: { type: 'string', description: 'Path to runbook index' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'monitoring-setup', 'runbooks']
}));

// Phase 9: Validate Monitoring Coverage
export const validateMonitoringCoverageTask = defineTask('validate-monitoring-coverage', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Validate Monitoring Coverage - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Monitoring Quality Assurance Engineer',
      task: 'Validate monitoring coverage and identify gaps',
      context: {
        projectName: args.projectName,
        assessmentResult: args.assessmentResult,
        implementations: args.implementations,
        targetCoverage: args.targetCoverage,
        platforms: args.platforms,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Verify all identified services are being monitored',
        '2. Check metrics collection:',
        '   - Verify all services expose /metrics endpoint',
        '   - Confirm Prometheus is scraping all targets successfully',
        '   - Validate Golden Signals metrics are available',
        '3. Check log collection:',
        '   - Verify logs are being sent to log aggregation system',
        '   - Confirm log format is consistent',
        '   - Validate correlation IDs are present',
        '4. Check distributed tracing:',
        '   - Verify traces are being collected',
        '   - Confirm trace context propagation works',
        '   - Validate spans are complete',
        '5. Calculate actual monitoring coverage:',
        '   - (Monitored components / Total components) * 100',
        '6. Identify coverage gaps:',
        '   - Services without metrics',
        '   - Services without logs',
        '   - Services without tracing',
        '   - Missing critical metrics',
        '   - Missing dashboards',
        '   - Missing alerts',
        '7. Assess severity of each gap (critical, high, medium, low)',
        '8. Provide recommendations to address gaps',
        '9. Generate coverage validation report'
      ],
      outputFormat: 'JSON object with coverage validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'actualCoverage', 'gaps', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        actualCoverage: { type: 'number', description: 'Actual monitoring coverage percentage' },
        targetCoverage: { type: 'number' },
        coverageBreakdown: {
          type: 'object',
          properties: {
            metrics: { type: 'number', description: 'Metrics coverage %' },
            logs: { type: 'number', description: 'Logs coverage %' },
            traces: { type: 'number', description: 'Traces coverage %' },
            dashboards: { type: 'number', description: 'Dashboard coverage %' },
            alerts: { type: 'number', description: 'Alert coverage %' }
          }
        },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              component: { type: 'string' },
              gap: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              recommendation: { type: 'string' }
            }
          }
        },
        coveragePassed: { type: 'boolean', description: 'Coverage meets target' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'monitoring-setup', 'validation']
}));

// Phase 10: Test Monitoring Stack
export const testMonitoringStackTask = defineTask('test-monitoring-stack', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Test Monitoring Stack - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Monitoring Testing Engineer',
      task: 'Conduct end-to-end testing of monitoring stack',
      context: {
        projectName: args.projectName,
        environment: args.environment,
        implementations: args.implementations,
        dashboards: args.dashboards,
        alerts: args.alerts,
        platforms: args.platforms,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Test Prometheus:',
        '   - Verify all targets are UP',
        '   - Check metrics are being scraped',
        '   - Test PromQL queries',
        '   - Verify metric retention',
        '2. Test Grafana:',
        '   - Verify all dashboards load correctly',
        '   - Check datasource connections',
        '   - Test dashboard variables work',
        '   - Verify panels display data',
        '3. Test log aggregation:',
        '   - Verify logs are being collected',
        '   - Test log queries',
        '   - Check log parsing and extraction',
        '   - Verify log retention',
        '4. Test distributed tracing:',
        '   - Verify traces are being collected',
        '   - Test trace queries',
        '   - Check trace context propagation',
        '   - Verify sampling is working',
        '5. Test alerting:',
        '   - Trigger test alerts',
        '   - Verify alerts fire correctly',
        '   - Check alert routing to channels',
        '   - Test alert inhibition and silencing',
        '6. Test integration between components:',
        '   - Metrics → Grafana dashboards',
        '   - Logs → Grafana Loki',
        '   - Traces → Grafana Tempo/Jaeger',
        '   - Alerts → Alertmanager → channels',
        '7. Identify any issues or failures',
        '8. Generate testing report with pass/fail status'
      ],
      outputFormat: 'JSON object with testing results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'testsPassed', 'testsFailed', 'testsTotal', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        testsPassed: { type: 'number' },
        testsFailed: { type: 'number' },
        testsTotal: { type: 'number' },
        testResults: {
          type: 'object',
          properties: {
            prometheusTests: {
              type: 'object',
              properties: {
                passed: { type: 'number' },
                failed: { type: 'number' },
                issues: { type: 'array', items: { type: 'string' } }
              }
            },
            grafanaTests: {
              type: 'object',
              properties: {
                passed: { type: 'number' },
                failed: { type: 'number' },
                issues: { type: 'array', items: { type: 'string' } }
              }
            },
            loggingTests: {
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
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              component: { type: 'string' },
              issue: { type: 'string' },
              severity: { type: 'string' }
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
  labels: ['agent', 'monitoring-setup', 'testing']
}));

// Phase 11: Generate Monitoring Documentation
export const generateMonitoringDocumentationTask = defineTask('generate-monitoring-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Generate Monitoring Documentation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Documentation Specialist for Monitoring',
      task: 'Generate comprehensive monitoring documentation',
      context: {
        projectName: args.projectName,
        environment: args.environment,
        monitoringScope: args.monitoringScope,
        assessmentResult: args.assessmentResult,
        implementations: args.implementations,
        dashboards: args.dashboards,
        alerts: args.alerts,
        runbooks: args.runbooks,
        validationResult: args.validationResult,
        testingResult: args.testingResult,
        platforms: args.platforms,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create executive summary of monitoring setup',
        '2. Document monitoring architecture:',
        '   - Architecture diagram',
        '   - Components and their roles',
        '   - Data flow diagram',
        '3. Document the three pillars implementation:',
        '   - Metrics: Prometheus setup, targets, metrics available',
        '   - Logs: Log aggregation platform, sources, format',
        '   - Traces: Tracing platform, instrumented services, sampling',
        '4. Document Grafana dashboards:',
        '   - List of dashboards with descriptions',
        '   - Dashboard access URLs',
        '   - How to interpret dashboards',
        '5. Document alerting:',
        '   - Alert rules and severity levels',
        '   - Notification channels',
        '   - Alert response process',
        '6. Document runbooks:',
        '   - Runbook index with links',
        '   - How to use runbooks',
        '7. Document access and authentication',
        '8. Create getting started guide for on-call engineers',
        '9. Document monitoring coverage and gaps',
        '10. Include troubleshooting tips',
        '11. Add maintenance procedures',
        '12. Format as professional Markdown document'
      ],
      outputFormat: 'JSON object with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'reportPath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        reportPath: { type: 'string', description: 'Main monitoring setup report path' },
        gettingStartedPath: { type: 'string', description: 'Getting started guide path' },
        architectureDiagramPath: { type: 'string', description: 'Architecture diagram path' },
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
  labels: ['agent', 'monitoring-setup', 'documentation']
}));

// Phase 12: Calculate Observability Score
export const calculateObservabilityScoreTask = defineTask('calculate-observability-score', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Calculate Observability Score - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Observability Assessment Specialist',
      task: 'Calculate observability score and provide final assessment',
      context: {
        projectName: args.projectName,
        monitoringScope: args.monitoringScope,
        targetCoverage: args.targetCoverage,
        actualCoverage: args.actualCoverage,
        implementations: args.implementations,
        dashboardsCount: args.dashboardsCount,
        alertsCount: args.alertsCount,
        runbooksCount: args.runbooksCount,
        testingResult: args.testingResult,
        platforms: args.platforms,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Calculate weighted observability score (0-100):',
        '   - Metrics collection and coverage (30% weight)',
        '     * Prometheus deployed and working',
        '     * Golden Signals metrics available',
        '     * Service discovery configured',
        '     * Metrics coverage percentage',
        '   - Visualization and dashboards (20% weight)',
        '     * Grafana deployed and accessible',
        '     * System overview dashboard',
        '     * Service-level dashboards',
        '     * Infrastructure dashboard',
        '   - Log aggregation (20% weight)',
        '     * Log platform deployed',
        '     * Structured logging implemented',
        '     * Log sources configured',
        '     * Log coverage percentage',
        '   - Distributed tracing (15% weight)',
        '     * Tracing platform deployed',
        '     * Services instrumented',
        '     * Context propagation working',
        '   - Alerting and runbooks (15% weight)',
        '     * SLO-based alerts configured',
        '     * Golden Signal alerts',
        '     * Notification channels working',
        '     * Runbooks created',
        '2. Assess monitoring coverage against target',
        '3. Evaluate completeness of three pillars',
        '4. Assess production readiness',
        '5. Evaluate adherence to SRE best practices',
        '6. Assess monitoring maturity level (basic, intermediate, advanced, expert)',
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
        componentScores: {
          type: 'object',
          properties: {
            metrics: { type: 'number' },
            dashboards: { type: 'number' },
            logging: { type: 'number' },
            tracing: { type: 'number' },
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
        productionReady: { type: 'boolean', description: 'Ready for production deployment' },
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
  labels: ['agent', 'monitoring-setup', 'scoring']
}));
