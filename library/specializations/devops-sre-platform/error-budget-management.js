/**
 * @process specializations/devops-sre-platform/error-budget-management
 * @description Error Budget Management Process - Comprehensive SLO-based reliability engineering framework covering
 * error budget calculation, burn rate monitoring, policy enforcement, stakeholder communication, incident correlation,
 * and continuous reliability improvement through data-driven decision making.
 * @inputs { services: array, slos: object, reportingPeriod: string, alertThresholds: object, stakeholders: array }
 * @outputs { success: boolean, errorBudgets: array, burnRateAnalysis: object, recommendations: array, policyDecisions: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/devops-sre-platform/error-budget-management', {
 *   services: ['payment-api', 'checkout-service', 'user-service'],
 *   slos: {
 *     availability: { target: 99.9, window: '30d' },
 *     latency: { target: 200, percentile: 95, window: '30d' },
 *     errorRate: { target: 0.1, window: '30d' }
 *   },
 *   reportingPeriod: '30d',
 *   alertThresholds: {
 *     burnRateFast: 14.4,  // 2% budget in 1 hour
 *     burnRateSlow: 6.0    // 5% budget in 6 hours
 *   },
 *   stakeholders: ['engineering', 'product', 'leadership'],
 *   environment: 'production'
 * });
 *
 * @references
 * - Google SRE Book - Embracing Risk: https://sre.google/sre-book/embracing-risk/
 * - Google SRE Workbook - Implementing SLOs: https://sre.google/workbook/implementing-slos/
 * - The Site Reliability Workbook - Error Budgets: https://sre.google/workbook/error-budget-policy/
 * - Alex Hidalgo - Implementing Service Level Objectives: https://www.alex-hidalgo.com/
 * - Sloth - SLO Toolkit: https://github.com/slok/sloth
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    services = [],
    slos = {
      availability: { target: 99.9, window: '30d' },
      latency: { target: 500, percentile: 95, window: '30d' },
      errorRate: { target: 1.0, window: '30d' }
    },
    reportingPeriod = '30d', // '30d', '7d', '1d'
    alertThresholds = {
      burnRateFast: 14.4,   // 2% budget in 1 hour (for critical alerts)
      burnRateSlow: 6.0,    // 5% budget in 6 hours (for warning alerts)
      budgetRemaining: 10.0 // Alert when <10% budget remains
    },
    stakeholders = ['engineering', 'product', 'leadership'],
    environment = 'production',
    incidentCorrelation = true,
    autoFreeze = false, // Automatically freeze deployments when budget exhausted
    policyEnforcement = true,
    outputDir = 'error-budget-output',
    monitoringPlatform = 'prometheus', // 'prometheus', 'datadog', 'newrelic', 'dynatrace'
    notificationChannels = ['slack', 'email', 'pagerduty']
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const errorBudgets = [];
  const burnRateAlerts = [];
  const policyDecisions = [];
  const recommendations = [];

  ctx.log('info', `Starting Error Budget Management Process for ${services.length} services`);
  ctx.log('info', `Reporting Period: ${reportingPeriod}, Environment: ${environment}`);
  ctx.log('info', `SLO Targets - Availability: ${slos.availability?.target}%, Latency P${slos.latency?.percentile}: ${slos.latency?.target}ms, Error Rate: ${slos.errorRate?.target}%`);

  // ============================================================================
  // PHASE 1: SLO CONFIGURATION AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Validating SLO configuration and calculating error budgets');

  const sloValidation = await ctx.task(sloConfigurationTask, {
    services,
    slos,
    reportingPeriod,
    environment,
    monitoringPlatform,
    outputDir
  });

  artifacts.push(...sloValidation.artifacts);

  ctx.log('info', `SLO Configuration validated - ${sloValidation.validSLOs} valid SLOs across ${services.length} services`);

  // Quality Gate: SLO configuration review
  await ctx.breakpoint({
    question: `SLO configuration validated for ${services.length} services. ${sloValidation.validSLOs} valid SLOs configured. Review SLO definitions and error budget calculations?`,
    title: 'SLO Configuration Review',
    context: {
      runId: ctx.runId,
      sloConfiguration: {
        services: services.length,
        validSLOs: sloValidation.validSLOs,
        reportingPeriod,
        sloTargets: slos
      },
      errorBudgetCalculations: sloValidation.budgetCalculations,
      files: sloValidation.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 2: COLLECT OBSERVABILITY DATA
  // ============================================================================

  ctx.log('info', 'Phase 2: Collecting observability data for SLI measurement');

  const dataCollection = await ctx.task(collectObservabilityDataTask, {
    services,
    slos,
    reportingPeriod,
    environment,
    monitoringPlatform,
    sloValidation,
    outputDir
  });

  artifacts.push(...dataCollection.artifacts);

  ctx.log('info', `Data collection complete - ${dataCollection.dataPoints} data points collected from ${dataCollection.sources.length} sources`);

  // ============================================================================
  // PHASE 3: CALCULATE ERROR BUDGETS
  // ============================================================================

  ctx.log('info', 'Phase 3: Calculating error budgets and burn rates');

  // Calculate error budgets for each service in parallel
  const errorBudgetResults = await ctx.parallel.all(
    services.map(service => async () => {
      const result = await ctx.task(calculateErrorBudgetTask, {
        service,
        slos,
        reportingPeriod,
        dataCollection,
        sloValidation,
        outputDir
      });
      return result;
    })
  );

  errorBudgets.push(...errorBudgetResults);
  artifacts.push(...errorBudgetResults.flatMap(r => r.artifacts));

  const totalBudgetRemaining = errorBudgets.reduce((sum, eb) => sum + eb.budgetRemainingPercent, 0) / errorBudgets.length;

  ctx.log('info', `Error budgets calculated - Average budget remaining: ${totalBudgetRemaining.toFixed(2)}%`);

  // Quality Gate: Low budget warning
  const criticalServices = errorBudgets.filter(eb => eb.budgetRemainingPercent < alertThresholds.budgetRemaining);
  if (criticalServices.length > 0) {
    await ctx.breakpoint({
      question: `${criticalServices.length} service(s) have less than ${alertThresholds.budgetRemaining}% error budget remaining: ${criticalServices.map(s => s.service).join(', ')}. Review budget consumption?`,
      title: 'Low Error Budget Warning',
      context: {
        runId: ctx.runId,
        criticalServices: criticalServices.map(s => ({
          service: s.service,
          budgetRemaining: `${s.budgetRemainingPercent.toFixed(2)}%`,
          status: s.status,
          daysUntilExhausted: s.daysUntilExhausted
        })),
        recommendation: 'Consider deployment freeze or reduced release velocity',
        files: criticalServices.map(s => ({ path: s.reportPath, format: 'markdown', label: `${s.service} Error Budget Report` }))
      }
    });
  }

  // ============================================================================
  // PHASE 4: BURN RATE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing error budget burn rates');

  const burnRateAnalysis = await ctx.task(burnRateAnalysisTask, {
    services,
    errorBudgets,
    alertThresholds,
    reportingPeriod,
    dataCollection,
    outputDir
  });

  artifacts.push(...burnRateAnalysis.artifacts);

  ctx.log('info', `Burn rate analysis complete - ${burnRateAnalysis.fastBurnServices.length} services with fast burn rate`);

  // Quality Gate: Fast burn rate alert
  if (burnRateAnalysis.fastBurnServices.length > 0) {
    await ctx.breakpoint({
      question: `Fast burn rate detected! ${burnRateAnalysis.fastBurnServices.length} service(s) consuming error budget rapidly: ${burnRateAnalysis.fastBurnServices.join(', ')}. Investigate immediately?`,
      title: 'Fast Burn Rate Alert',
      context: {
        runId: ctx.runId,
        fastBurnServices: burnRateAnalysis.fastBurnDetails,
        burnRateThreshold: alertThresholds.burnRateFast,
        projectedExhaustion: burnRateAnalysis.projectedExhaustion,
        recommendation: 'Immediate investigation required - likely ongoing incident',
        files: burnRateAnalysis.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 5: INCIDENT CORRELATION
  // ============================================================================

  if (incidentCorrelation) {
    ctx.log('info', 'Phase 5: Correlating error budget consumption with incidents');

    const incidentCorrelationResult = await ctx.task(incidentCorrelationTask, {
      services,
      errorBudgets,
      burnRateAnalysis,
      reportingPeriod,
      environment,
      outputDir
    });

    artifacts.push(...incidentCorrelationResult.artifacts);

    ctx.log('info', `Incident correlation complete - ${incidentCorrelationResult.correlatedIncidents} incidents correlated with budget consumption`);

    // Quality Gate: High-impact incidents review
    if (incidentCorrelationResult.highImpactIncidents.length > 0) {
      await ctx.breakpoint({
        question: `${incidentCorrelationResult.highImpactIncidents.length} high-impact incident(s) identified consuming significant error budget. Review incidents and budget impact?`,
        title: 'High-Impact Incidents Review',
        context: {
          runId: ctx.runId,
          highImpactIncidents: incidentCorrelationResult.highImpactIncidents.map(inc => ({
            incidentId: inc.incidentId,
            service: inc.service,
            budgetConsumed: `${inc.budgetConsumedPercent.toFixed(2)}%`,
            duration: inc.duration,
            impact: inc.impact
          })),
          files: incidentCorrelationResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
        }
      });
    }
  }

  // ============================================================================
  // PHASE 6: TOIL AND RELIABILITY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Analyzing toil and reliability patterns');

  const toilAnalysis = await ctx.task(toilReliabilityAnalysisTask, {
    services,
    errorBudgets,
    burnRateAnalysis,
    incidentCorrelation: incidentCorrelation ? burnRateAnalysis : null,
    reportingPeriod,
    outputDir
  });

  artifacts.push(...toilAnalysis.artifacts);

  ctx.log('info', `Toil analysis complete - ${toilAnalysis.toilHotspots.length} toil hotspots identified`);

  // ============================================================================
  // PHASE 7: ERROR BUDGET POLICY ENFORCEMENT
  // ============================================================================

  if (policyEnforcement) {
    ctx.log('info', 'Phase 7: Enforcing error budget policies');

    const policyEnforcement = await ctx.task(errorBudgetPolicyTask, {
      services,
      errorBudgets,
      burnRateAnalysis,
      toilAnalysis,
      alertThresholds,
      autoFreeze,
      stakeholders,
      outputDir
    });

    policyDecisions.push(...policyEnforcement.decisions);
    artifacts.push(...policyEnforcement.artifacts);

    ctx.log('info', `Policy enforcement complete - ${policyEnforcement.decisions.length} policy decisions made`);

    // Quality Gate: Policy decisions requiring approval
    const criticalDecisions = policyEnforcement.decisions.filter(d => d.requiresApproval);
    if (criticalDecisions.length > 0) {
      await ctx.breakpoint({
        question: `${criticalDecisions.length} critical policy decision(s) require approval: ${criticalDecisions.map(d => d.action).join(', ')}. Review and approve?`,
        title: 'Policy Decisions Requiring Approval',
        context: {
          runId: ctx.runId,
          decisions: criticalDecisions.map(d => ({
            service: d.service,
            action: d.action,
            reason: d.reason,
            impact: d.impact,
            recommendation: d.recommendation
          })),
          files: policyEnforcement.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
        }
      });
    }
  }

  // ============================================================================
  // PHASE 8: STAKEHOLDER REPORTING
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating stakeholder reports');

  const stakeholderReporting = await ctx.task(stakeholderReportingTask, {
    services,
    errorBudgets,
    burnRateAnalysis,
    toilAnalysis,
    policyDecisions,
    stakeholders,
    reportingPeriod,
    slos,
    outputDir
  });

  artifacts.push(...stakeholderReporting.artifacts);

  ctx.log('info', `Stakeholder reports generated - ${stakeholderReporting.reports.length} reports for ${stakeholders.length} stakeholder groups`);

  // ============================================================================
  // PHASE 9: RECOMMENDATION GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Generating reliability improvement recommendations');

  const recommendationGeneration = await ctx.task(generateRecommendationsTask, {
    services,
    errorBudgets,
    burnRateAnalysis,
    toilAnalysis,
    incidentCorrelation: incidentCorrelation ? burnRateAnalysis : null,
    reportingPeriod,
    slos,
    outputDir
  });

  recommendations.push(...recommendationGeneration.recommendations);
  artifacts.push(...recommendationGeneration.artifacts);

  ctx.log('info', `Recommendations generated - ${recommendations.length} actionable recommendations`);

  // Quality Gate: Review high-priority recommendations
  const highPriorityRecs = recommendations.filter(r => r.priority === 'critical' || r.priority === 'high');
  if (highPriorityRecs.length > 0) {
    await ctx.breakpoint({
      question: `${highPriorityRecs.length} high-priority recommendation(s) generated. Review and prioritize for action?`,
      title: 'Reliability Improvement Recommendations',
      context: {
        runId: ctx.runId,
        recommendations: highPriorityRecs.map(r => ({
          priority: r.priority,
          category: r.category,
          service: r.service,
          recommendation: r.recommendation,
          expectedImpact: r.expectedImpact,
          effort: r.estimatedEffort
        })),
        files: recommendationGeneration.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 10: MONITORING AND ALERTING SETUP
  // ============================================================================

  ctx.log('info', 'Phase 10: Configuring error budget monitoring and alerting');

  const monitoringSetup = await ctx.task(setupErrorBudgetMonitoringTask, {
    services,
    errorBudgets,
    slos,
    alertThresholds,
    notificationChannels,
    monitoringPlatform,
    outputDir
  });

  artifacts.push(...monitoringSetup.artifacts);

  ctx.log('info', `Monitoring configured - ${monitoringSetup.alerts.length} error budget alerts, ${monitoringSetup.dashboards.length} dashboards created`);

  // ============================================================================
  // PHASE 11: HISTORICAL TREND ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 11: Analyzing historical error budget trends');

  const trendAnalysis = await ctx.task(historicalTrendAnalysisTask, {
    services,
    errorBudgets,
    reportingPeriod,
    environment,
    outputDir
  });

  artifacts.push(...trendAnalysis.artifacts);

  ctx.log('info', `Trend analysis complete - ${trendAnalysis.trendsIdentified} trends identified`);

  // ============================================================================
  // PHASE 12: DOCUMENTATION AND KNOWLEDGE BASE
  // ============================================================================

  ctx.log('info', 'Phase 12: Generating error budget documentation');

  const documentation = await ctx.task(generateErrorBudgetDocumentationTask, {
    services,
    errorBudgets,
    burnRateAnalysis,
    toilAnalysis,
    policyDecisions,
    recommendations,
    stakeholderReporting,
    monitoringSetup,
    trendAnalysis,
    slos,
    reportingPeriod,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  ctx.log('info', `Documentation generated - Report: ${documentation.reportPath}`);

  // Final Breakpoint: Error Budget Management Complete
  await ctx.breakpoint({
    question: `Error Budget Management Complete. Average budget remaining: ${totalBudgetRemaining.toFixed(2)}%. ${criticalServices.length} service(s) below threshold. ${recommendations.length} recommendations. Approve and distribute reports?`,
    title: 'Final Error Budget Review',
    context: {
      runId: ctx.runId,
      summary: {
        servicesAnalyzed: services.length,
        averageBudgetRemaining: `${totalBudgetRemaining.toFixed(2)}%`,
        criticalServices: criticalServices.length,
        fastBurnServices: burnRateAnalysis.fastBurnServices.length,
        policyDecisions: policyDecisions.length,
        recommendations: recommendations.length,
        reportingPeriod
      },
      budgetStatus: errorBudgets.map(eb => ({
        service: eb.service,
        budgetRemaining: `${eb.budgetRemainingPercent.toFixed(2)}%`,
        status: eb.status,
        burnRate: eb.currentBurnRate
      })),
      topRecommendations: recommendations.slice(0, 5),
      files: [
        { path: documentation.reportPath, format: 'markdown', label: 'Error Budget Management Report' },
        { path: documentation.executiveSummaryPath, format: 'markdown', label: 'Executive Summary' },
        ...stakeholderReporting.reports.map(r => ({ path: r.path, format: r.format, label: r.label }))
      ]
    }
  });

  const endTime = ctx.now();
  const totalDuration = endTime - startTime;

  return {
    success: true,
    servicesAnalyzed: services.length,
    reportingPeriod,
    environment,
    errorBudgets: errorBudgets.map(eb => ({
      service: eb.service,
      budgetRemainingPercent: eb.budgetRemainingPercent,
      budgetConsumedPercent: eb.budgetConsumedPercent,
      status: eb.status,
      currentBurnRate: eb.currentBurnRate,
      projectedExhaustion: eb.projectedExhaustion,
      sloCompliance: eb.sloCompliance
    })),
    summary: {
      averageBudgetRemaining: totalBudgetRemaining,
      criticalServicesCount: criticalServices.length,
      fastBurnServicesCount: burnRateAnalysis.fastBurnServices.length,
      healthyServicesCount: errorBudgets.filter(eb => eb.status === 'healthy').length
    },
    burnRateAnalysis: {
      fastBurnServices: burnRateAnalysis.fastBurnServices,
      slowBurnServices: burnRateAnalysis.slowBurnServices,
      averageBurnRate: burnRateAnalysis.averageBurnRate,
      projectedExhaustion: burnRateAnalysis.projectedExhaustion
    },
    incidentCorrelation: incidentCorrelation ? {
      correlatedIncidents: burnRateAnalysis.correlatedIncidents || 0,
      highImpactIncidents: burnRateAnalysis.highImpactIncidents || [],
      budgetConsumedByIncidents: burnRateAnalysis.budgetConsumedByIncidents || 0
    } : null,
    toilAnalysis: {
      toilHotspots: toilAnalysis.toilHotspots.length,
      topToilCategories: toilAnalysis.topCategories,
      reliabilityScore: toilAnalysis.reliabilityScore
    },
    policyDecisions: policyDecisions.map(d => ({
      service: d.service,
      action: d.action,
      reason: d.reason,
      implemented: d.implemented,
      impact: d.impact
    })),
    recommendations: recommendations.map(r => ({
      priority: r.priority,
      category: r.category,
      service: r.service,
      recommendation: r.recommendation,
      expectedImpact: r.expectedImpact,
      estimatedEffort: r.estimatedEffort
    })),
    monitoring: {
      alertsConfigured: monitoringSetup.alerts.length,
      dashboardsCreated: monitoringSetup.dashboards.length,
      platform: monitoringPlatform,
      channels: notificationChannels
    },
    trends: {
      trendsIdentified: trendAnalysis.trendsIdentified,
      overallTrend: trendAnalysis.overallTrend,
      forecasts: trendAnalysis.forecasts
    },
    artifacts,
    documentation: {
      reportPath: documentation.reportPath,
      executiveSummaryPath: documentation.executiveSummaryPath,
      stakeholderReports: stakeholderReporting.reports
    },
    duration: totalDuration,
    metadata: {
      processId: 'specializations/devops-sre-platform/error-budget-management',
      processSlug: 'error-budget-management',
      category: 'Reliability Engineering',
      specializationSlug: 'devops-sre-platform',
      timestamp: startTime,
      reportingPeriod,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: SLO Configuration
export const sloConfigurationTask = defineTask('slo-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1: SLO Configuration and Validation',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Site Reliability Engineer specializing in SLO definition',
      task: 'Validate SLO configuration and calculate error budgets',
      context: {
        services: args.services,
        slos: args.slos,
        reportingPeriod: args.reportingPeriod,
        environment: args.environment,
        monitoringPlatform: args.monitoringPlatform,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Validate SLO definitions for each service:',
        '   - Availability SLO: target percentage (e.g., 99.9%)',
        '   - Latency SLO: target latency at percentile (e.g., p95 < 200ms)',
        '   - Error Rate SLO: target error rate (e.g., < 0.1%)',
        '2. For each SLO, calculate error budget:',
        '   - Error Budget = (100% - SLO Target)',
        '   - Example: 99.9% availability → 0.1% error budget',
        '3. Convert error budget to time allowance:',
        '   - 30 days = 43,200 minutes',
        '   - 0.1% error budget = 43.2 minutes downtime allowed',
        '4. Calculate error budget in requests (for availability/error rate):',
        '   - If 10M requests/month, 0.1% = 10,000 failed requests allowed',
        '5. Define SLI (Service Level Indicator) queries:',
        '   - Availability SLI: (successful requests / total requests)',
        '   - Latency SLI: (requests under threshold / total requests)',
        '   - Error Rate SLI: (error requests / total requests)',
        '6. Validate reporting window configuration',
        '7. Check SLO targets are achievable and realistic',
        '8. Identify missing SLO definitions',
        '9. Create SLO configuration files',
        '10. Document error budget calculations'
      ],
      outputFormat: 'JSON object with SLO validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'validSLOs', 'budgetCalculations', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        validSLOs: { type: 'number', description: 'Number of valid SLOs' },
        sloDefinitions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              service: { type: 'string' },
              sloType: { type: 'string', enum: ['availability', 'latency', 'error-rate'] },
              target: { type: 'number' },
              window: { type: 'string' },
              sliQuery: { type: 'string' },
              valid: { type: 'boolean' }
            }
          }
        },
        budgetCalculations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              service: { type: 'string' },
              sloType: { type: 'string' },
              errorBudgetPercent: { type: 'number' },
              errorBudgetMinutes: { type: 'number' },
              errorBudgetRequests: { type: 'number' }
            }
          }
        },
        missingDefinitions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'error-budget', 'slo-configuration']
}));

// Phase 2: Collect Observability Data
export const collectObservabilityDataTask = defineTask('collect-observability-data', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2: Collect Observability Data',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Observability Engineer',
      task: 'Collect metrics and data for SLI calculation',
      context: {
        services: args.services,
        slos: args.slos,
        reportingPeriod: args.reportingPeriod,
        environment: args.environment,
        monitoringPlatform: args.monitoringPlatform,
        sloValidation: args.sloValidation,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Query monitoring platform for SLI metrics:',
        '   - Prometheus: Use PromQL queries',
        '   - Datadog: Use Datadog API queries',
        '   - New Relic: Use NRQL queries',
        '2. For each service, collect:',
        '   - Total request count',
        '   - Successful request count',
        '   - Failed request count (4xx, 5xx)',
        '   - Request latency distribution (p50, p95, p99)',
        '   - Error rate percentage',
        '3. Query data for reporting period (30d, 7d, 1d)',
        '4. Calculate actual SLI values:',
        '   - Availability: (successful / total) * 100',
        '   - Latency: percentage of requests under threshold',
        '   - Error Rate: (errors / total) * 100',
        '5. Verify data completeness and quality',
        '6. Handle missing data or gaps',
        '7. Aggregate data per service',
        '8. Calculate time series for burn rate analysis',
        '9. Export raw data for analysis',
        '10. Document data collection methodology'
      ],
      outputFormat: 'JSON object with collected observability data'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'dataPoints', 'sources', 'serviceMetrics', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        dataPoints: { type: 'number', description: 'Total data points collected' },
        sources: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              platform: { type: 'string' },
              endpoint: { type: 'string' },
              status: { type: 'string' }
            }
          }
        },
        serviceMetrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              service: { type: 'string' },
              totalRequests: { type: 'number' },
              successfulRequests: { type: 'number' },
              failedRequests: { type: 'number' },
              errorRate: { type: 'number' },
              latencyP50: { type: 'number' },
              latencyP95: { type: 'number' },
              latencyP99: { type: 'number' },
              availability: { type: 'number' },
              dataCompleteness: { type: 'number', description: 'Percentage of complete data' }
            }
          }
        },
        timeSeries: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              service: { type: 'string' },
              timestamps: { type: 'array', items: { type: 'string' } },
              values: { type: 'array', items: { type: 'number' } }
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
  labels: ['agent', 'error-budget', 'data-collection']
}));

// Phase 3: Calculate Error Budget
export const calculateErrorBudgetTask = defineTask('calculate-error-budget', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Calculate Error Budget - ${args.service}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SRE Error Budget Analyst',
      task: 'Calculate error budget consumption and remaining budget',
      context: {
        service: args.service,
        slos: args.slos,
        reportingPeriod: args.reportingPeriod,
        dataCollection: args.dataCollection,
        sloValidation: args.sloValidation,
        outputDir: args.outputDir
      },
      instructions: [
        '1. For the service, calculate error budget for each SLO:',
        '   - Availability Error Budget',
        '   - Latency Error Budget',
        '   - Error Rate Error Budget',
        '2. Calculate actual SLI performance from collected data',
        '3. Calculate error budget consumed:',
        '   - Budget Consumed = (SLO Target - Actual SLI)',
        '   - Example: 99.9% target, 99.7% actual → 0.2% consumed (out of 0.1% budget)',
        '4. Calculate error budget remaining:',
        '   - Budget Remaining = Error Budget - Budget Consumed',
        '   - Example: 0.1% budget - 0.2% consumed = -0.1% (exhausted)',
        '5. Convert to percentages:',
        '   - Budget Remaining % = (Budget Remaining / Error Budget) * 100',
        '6. Calculate current burn rate:',
        '   - Burn Rate = Budget Consumed / Time Elapsed',
        '7. Project when budget will be exhausted:',
        '   - Days Until Exhausted = Budget Remaining / Daily Burn Rate',
        '8. Determine status:',
        '   - Healthy: >50% budget remaining',
        '   - Warning: 10-50% budget remaining',
        '   - Critical: <10% budget remaining',
        '   - Exhausted: 0% or negative budget',
        '9. Analyze compliance with each SLO',
        '10. Generate error budget report for service'
      ],
      outputFormat: 'JSON object with error budget calculation'
    },
    outputSchema: {
      type: 'object',
      required: ['service', 'budgetRemainingPercent', 'budgetConsumedPercent', 'status', 'reportPath', 'artifacts'],
      properties: {
        service: { type: 'string' },
        sloCompliance: {
          type: 'object',
          properties: {
            availability: {
              type: 'object',
              properties: {
                target: { type: 'number' },
                actual: { type: 'number' },
                compliant: { type: 'boolean' }
              }
            },
            latency: {
              type: 'object',
              properties: {
                target: { type: 'number' },
                actual: { type: 'number' },
                compliant: { type: 'boolean' }
              }
            },
            errorRate: {
              type: 'object',
              properties: {
                target: { type: 'number' },
                actual: { type: 'number' },
                compliant: { type: 'boolean' }
              }
            }
          }
        },
        errorBudget: {
          type: 'object',
          properties: {
            totalBudget: { type: 'number', description: 'Total error budget (percentage)' },
            consumed: { type: 'number', description: 'Budget consumed (percentage)' },
            remaining: { type: 'number', description: 'Budget remaining (percentage)' }
          }
        },
        budgetRemainingPercent: { type: 'number', description: 'Percentage of budget remaining' },
        budgetConsumedPercent: { type: 'number', description: 'Percentage of budget consumed' },
        currentBurnRate: { type: 'number', description: 'Current burn rate (budget % per hour)' },
        projectedExhaustion: { type: 'string', description: 'Projected date when budget exhausted' },
        daysUntilExhausted: { type: 'number' },
        status: { type: 'string', enum: ['healthy', 'warning', 'critical', 'exhausted'] },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'error-budget', 'calculation', args.service]
}));

// Phase 4: Burn Rate Analysis
export const burnRateAnalysisTask = defineTask('burn-rate-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4: Burn Rate Analysis',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SRE Burn Rate Analyst',
      task: 'Analyze error budget burn rates and detect anomalies',
      context: {
        services: args.services,
        errorBudgets: args.errorBudgets,
        alertThresholds: args.alertThresholds,
        reportingPeriod: args.reportingPeriod,
        dataCollection: args.dataCollection,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Calculate multi-window burn rates for each service:',
        '   - 1-hour burn rate: short-term rapid consumption',
        '   - 6-hour burn rate: medium-term trends',
        '   - 1-day burn rate: daily consumption pattern',
        '   - 3-day burn rate: weekly trends',
        '2. Detect fast burn rate (critical alerts):',
        '   - Fast Burn: Consuming >2% of monthly budget in 1 hour',
        '   - Threshold: burn rate > 14.4x normal rate',
        '   - Indicates: Likely ongoing incident',
        '3. Detect slow burn rate (warning alerts):',
        '   - Slow Burn: Consuming >5% of monthly budget in 6 hours',
        '   - Threshold: burn rate > 6x normal rate',
        '   - Indicates: Elevated error rate or degradation',
        '4. Compare current burn rate to historical average',
        '5. Identify services with anomalous burn patterns',
        '6. Calculate projected budget exhaustion dates',
        '7. Analyze burn rate trends (increasing, stable, decreasing)',
        '8. Identify burn rate spikes and correlate with time',
        '9. Generate burn rate visualizations',
        '10. Create burn rate alert recommendations'
      ],
      outputFormat: 'JSON object with burn rate analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['fastBurnServices', 'slowBurnServices', 'averageBurnRate', 'artifacts'],
      properties: {
        fastBurnServices: {
          type: 'array',
          items: { type: 'string' },
          description: 'Services with critical fast burn rate'
        },
        fastBurnDetails: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              service: { type: 'string' },
              burnRate: { type: 'number' },
              budgetConsumedLastHour: { type: 'number' },
              projectedExhaustionHours: { type: 'number' }
            }
          }
        },
        slowBurnServices: {
          type: 'array',
          items: { type: 'string' },
          description: 'Services with warning slow burn rate'
        },
        averageBurnRate: { type: 'number', description: 'Average burn rate across all services' },
        burnRateAnalysis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              service: { type: 'string' },
              burnRate1h: { type: 'number' },
              burnRate6h: { type: 'number' },
              burnRate1d: { type: 'number' },
              burnRate3d: { type: 'number' },
              trend: { type: 'string', enum: ['increasing', 'stable', 'decreasing'] },
              anomalous: { type: 'boolean' }
            }
          }
        },
        projectedExhaustion: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              service: { type: 'string' },
              exhaustionDate: { type: 'string' },
              daysRemaining: { type: 'number' }
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
  labels: ['agent', 'error-budget', 'burn-rate']
}));

// Phase 5: Incident Correlation
export const incidentCorrelationTask = defineTask('incident-correlation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5: Incident Correlation',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SRE Incident Analyst',
      task: 'Correlate error budget consumption with incidents',
      context: {
        services: args.services,
        errorBudgets: args.errorBudgets,
        burnRateAnalysis: args.burnRateAnalysis,
        reportingPeriod: args.reportingPeriod,
        environment: args.environment,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Query incident management system for incidents in reporting period',
        '2. For each incident, calculate error budget consumed:',
        '   - Incident duration',
        '   - Affected services',
        '   - Error rate during incident',
        '   - Availability impact',
        '3. Correlate incidents with burn rate spikes',
        '4. Identify high-impact incidents (>5% budget consumed)',
        '5. Calculate percentage of budget consumed by incidents vs. steady-state',
        '6. Categorize incidents by impact:',
        '   - Critical: >10% budget consumed',
        '   - High: 5-10% budget consumed',
        '   - Medium: 1-5% budget consumed',
        '   - Low: <1% budget consumed',
        '7. Analyze incident patterns (frequency, MTTR, recurrence)',
        '8. Identify services with frequent small incidents vs. rare large incidents',
        '9. Calculate incident-driven vs. BAU error budget consumption',
        '10. Generate incident impact report'
      ],
      outputFormat: 'JSON object with incident correlation analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['correlatedIncidents', 'highImpactIncidents', 'artifacts'],
      properties: {
        correlatedIncidents: { type: 'number', description: 'Total incidents correlated' },
        highImpactIncidents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              incidentId: { type: 'string' },
              service: { type: 'string' },
              startTime: { type: 'string' },
              duration: { type: 'string' },
              budgetConsumedPercent: { type: 'number' },
              impact: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              category: { type: 'string' }
            }
          }
        },
        incidentBreakdown: {
          type: 'object',
          properties: {
            criticalIncidents: { type: 'number' },
            highIncidents: { type: 'number' },
            mediumIncidents: { type: 'number' },
            lowIncidents: { type: 'number' }
          }
        },
        budgetConsumedByIncidents: { type: 'number', description: 'Percentage consumed by incidents' },
        budgetConsumedByBAU: { type: 'number', description: 'Percentage consumed by steady-state errors' },
        incidentPatterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string' },
              frequency: { type: 'number' },
              services: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'error-budget', 'incident-correlation']
}));

// Phase 6: Toil and Reliability Analysis
export const toilReliabilityAnalysisTask = defineTask('toil-reliability-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6: Toil and Reliability Analysis',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SRE Reliability Analyst',
      task: 'Analyze toil patterns and reliability metrics',
      context: {
        services: args.services,
        errorBudgets: args.errorBudgets,
        burnRateAnalysis: args.burnRateAnalysis,
        incidentCorrelation: args.incidentCorrelation,
        reportingPeriod: args.reportingPeriod,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify toil sources consuming error budget:',
        '   - Manual interventions',
        '   - Repetitive incidents',
        '   - Known issues without permanent fixes',
        '   - Configuration drift',
        '   - Capacity issues',
        '2. Calculate toil impact on error budget',
        '3. Identify toil hotspots (services with high toil burden)',
        '4. Categorize toil by type:',
        '   - Alerting noise (false positives)',
        '   - Manual scaling interventions',
        '   - Deployment rollbacks',
        '   - Data quality issues',
        '   - Dependency failures',
        '5. Calculate reliability metrics:',
        '   - MTBF (Mean Time Between Failures)',
        '   - MTTR (Mean Time To Recovery)',
        '   - Change failure rate',
        '   - Deployment frequency impact',
        '6. Assess system reliability maturity (basic, intermediate, advanced)',
        '7. Identify automation opportunities',
        '8. Calculate ROI of toil reduction',
        '9. Generate toil reduction roadmap',
        '10. Create reliability improvement recommendations'
      ],
      outputFormat: 'JSON object with toil and reliability analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['toilHotspots', 'topCategories', 'reliabilityScore', 'artifacts'],
      properties: {
        toilHotspots: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              service: { type: 'string' },
              toilBudgetPercent: { type: 'number' },
              primaryToilType: { type: 'string' },
              frequency: { type: 'number' }
            }
          }
        },
        topCategories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              budgetImpact: { type: 'number' },
              occurrences: { type: 'number' }
            }
          }
        },
        reliabilityMetrics: {
          type: 'object',
          properties: {
            mtbf: { type: 'number', description: 'Mean Time Between Failures (hours)' },
            mttr: { type: 'number', description: 'Mean Time To Recovery (minutes)' },
            changeFailureRate: { type: 'number', description: 'Percentage' },
            deploymentFrequency: { type: 'number', description: 'Deployments per day' }
          }
        },
        reliabilityScore: { type: 'number', description: 'Overall reliability score 0-100' },
        maturityLevel: { type: 'string', enum: ['basic', 'intermediate', 'advanced', 'expert'] },
        automationOpportunities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              opportunity: { type: 'string' },
              potentialSavings: { type: 'number', description: 'Budget % saved' },
              effort: { type: 'string', enum: ['low', 'medium', 'high'] },
              priority: { type: 'number' }
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
  labels: ['agent', 'error-budget', 'toil-analysis']
}));

// Phase 7: Error Budget Policy
export const errorBudgetPolicyTask = defineTask('error-budget-policy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7: Error Budget Policy Enforcement',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SRE Policy Enforcement Engineer',
      task: 'Enforce error budget policies and make deployment decisions',
      context: {
        services: args.services,
        errorBudgets: args.errorBudgets,
        burnRateAnalysis: args.burnRateAnalysis,
        toilAnalysis: args.toilAnalysis,
        alertThresholds: args.alertThresholds,
        autoFreeze: args.autoFreeze,
        stakeholders: args.stakeholders,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Apply error budget policy rules:',
        '   - Healthy (>50% budget): Normal velocity, no restrictions',
        '   - Warning (10-50% budget): Reduce release velocity, focus on reliability',
        '   - Critical (<10% budget): Deployment freeze, reliability sprints only',
        '   - Exhausted (0% budget): Hard freeze, incident response only',
        '2. For each service, evaluate current policy status',
        '3. Make policy decisions:',
        '   - Allow/block deployments',
        '   - Require reliability improvements',
        '   - Mandate incident reviews',
        '   - Enforce SLO review',
        '4. Generate policy recommendations:',
        '   - Reduce feature velocity',
        '   - Increase reliability work',
        '   - Improve testing',
        '   - Add monitoring/alerting',
        '5. Implement auto-freeze if configured and budget exhausted',
        '6. Calculate impact of policy decisions on product velocity',
        '7. Identify exceptions that may warrant policy override',
        '8. Document policy decisions with rationale',
        '9. Create stakeholder communication plan',
        '10. Generate policy enforcement report'
      ],
      outputFormat: 'JSON object with policy decisions'
    },
    outputSchema: {
      type: 'object',
      required: ['decisions', 'artifacts'],
      properties: {
        decisions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              service: { type: 'string' },
              policyStatus: { type: 'string', enum: ['healthy', 'warning', 'critical', 'exhausted'] },
              action: { type: 'string', enum: ['allow-deployments', 'reduce-velocity', 'deployment-freeze', 'hard-freeze'] },
              reason: { type: 'string' },
              requiresApproval: { type: 'boolean' },
              implemented: { type: 'boolean' },
              impact: { type: 'string', description: 'Impact on product velocity' },
              recommendation: { type: 'string' }
            }
          }
        },
        freezeActions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              service: { type: 'string' },
              action: { type: 'string' },
              automated: { type: 'boolean' },
              timestamp: { type: 'string' }
            }
          }
        },
        exceptionRequests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              service: { type: 'string' },
              requestor: { type: 'string' },
              justification: { type: 'string' },
              approved: { type: 'boolean' }
            }
          }
        },
        velocityImpact: {
          type: 'object',
          properties: {
            servicesAffected: { type: 'number' },
            deploymentsBlocked: { type: 'number' },
            estimatedDelay: { type: 'string' }
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
  labels: ['agent', 'error-budget', 'policy-enforcement']
}));

// Phase 8: Stakeholder Reporting
export const stakeholderReportingTask = defineTask('stakeholder-reporting', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 8: Stakeholder Reporting',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SRE Communications Specialist',
      task: 'Generate stakeholder-specific error budget reports',
      context: {
        services: args.services,
        errorBudgets: args.errorBudgets,
        burnRateAnalysis: args.burnRateAnalysis,
        toilAnalysis: args.toilAnalysis,
        policyDecisions: args.policyDecisions,
        stakeholders: args.stakeholders,
        reportingPeriod: args.reportingPeriod,
        slos: args.slos,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create stakeholder-specific reports:',
        '   - Engineering: Technical details, metrics, action items',
        '   - Product: Business impact, velocity impact, trade-offs',
        '   - Leadership: Executive summary, strategic recommendations',
        '2. Engineering Report:',
        '   - Error budget status per service',
        '   - Burn rate analysis',
        '   - Incident correlation',
        '   - Technical recommendations',
        '   - Toil hotspots and automation opportunities',
        '3. Product Report:',
        '   - Overall reliability health',
        '   - Policy decisions and deployment impact',
        '   - Customer-facing SLO compliance',
        '   - Trade-offs (features vs. reliability)',
        '   - Roadmap implications',
        '4. Leadership Report:',
        '   - Executive summary (1-page)',
        '   - Key metrics and trends',
        '   - Strategic risks',
        '   - Investment recommendations',
        '   - Competitive positioning (reliability)',
        '5. Include visualizations:',
        '   - Error budget charts',
        '   - Burn rate trends',
        '   - SLO compliance scorecards',
        '6. Use appropriate language and detail level for each audience',
        '7. Highlight actionable insights',
        '8. Include success stories and improvements',
        '9. Format reports professionally (Markdown, PDF)',
        '10. Create distribution plan'
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
              path: { type: 'string' },
              format: { type: 'string', enum: ['markdown', 'pdf', 'html'] },
              label: { type: 'string' },
              keyMessages: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        executiveSummary: {
          type: 'object',
          properties: {
            overallHealth: { type: 'string', enum: ['excellent', 'good', 'fair', 'poor'] },
            keyMetrics: { type: 'object' },
            topRisks: { type: 'array', items: { type: 'string' } },
            topRecommendations: { type: 'array', items: { type: 'string' } }
          }
        },
        distributionPlan: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stakeholder: { type: 'string' },
              recipients: { type: 'array', items: { type: 'string' } },
              channel: { type: 'string' },
              frequency: { type: 'string' }
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
  labels: ['agent', 'error-budget', 'stakeholder-reporting']
}));

// Phase 9: Generate Recommendations
export const generateRecommendationsTask = defineTask('generate-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 9: Generate Reliability Recommendations',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior SRE / Reliability Consultant',
      task: 'Generate actionable reliability improvement recommendations',
      context: {
        services: args.services,
        errorBudgets: args.errorBudgets,
        burnRateAnalysis: args.burnRateAnalysis,
        toilAnalysis: args.toilAnalysis,
        incidentCorrelation: args.incidentCorrelation,
        reportingPeriod: args.reportingPeriod,
        slos: args.slos,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze error budget consumption patterns and identify root causes',
        '2. Generate recommendations by category:',
        '   - Monitoring & Observability: Improve visibility',
        '   - Incident Response: Reduce MTTR',
        '   - Toil Reduction: Automate manual work',
        '   - Architecture: Improve resilience',
        '   - Testing: Prevent regressions',
        '   - Capacity: Right-size resources',
        '   - Process: Improve practices',
        '3. For each recommendation:',
        '   - Specific action items',
        '   - Expected error budget impact',
        '   - Estimated effort (low, medium, high)',
        '   - Priority (critical, high, medium, low)',
        '   - Owner/team',
        '   - Timeline',
        '4. Prioritize recommendations by ROI:',
        '   - High impact, low effort: Quick wins',
        '   - High impact, high effort: Strategic investments',
        '   - Low impact, low effort: Incremental improvements',
        '5. Include specific technical recommendations:',
        '   - Add retry logic with exponential backoff',
        '   - Implement circuit breakers',
        '   - Add caching layer',
        '   - Improve database query performance',
        '   - Scale horizontally',
        '6. Include process recommendations:',
        '   - Conduct postmortems for all SEV-1/SEV-2',
        '   - Implement chaos engineering',
        '   - Add pre-production testing',
        '   - Improve deployment process',
        '7. Calculate expected error budget savings',
        '8. Create implementation roadmap',
        '9. Identify dependencies and blockers',
        '10. Document recommendations with examples'
      ],
      outputFormat: 'JSON object with recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'artifacts'],
      properties: {
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              category: { type: 'string', enum: ['monitoring', 'incident-response', 'toil', 'architecture', 'testing', 'capacity', 'process'] },
              service: { type: 'string' },
              recommendation: { type: 'string' },
              actionItems: { type: 'array', items: { type: 'string' } },
              expectedImpact: { type: 'string', description: 'Expected error budget savings' },
              estimatedEffort: { type: 'string', enum: ['low', 'medium', 'high'] },
              owner: { type: 'string' },
              timeline: { type: 'string' },
              dependencies: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        quickWins: {
          type: 'array',
          items: { type: 'string' },
          description: 'High impact, low effort recommendations'
        },
        strategicInvestments: {
          type: 'array',
          items: { type: 'string' },
          description: 'High impact, high effort recommendations'
        },
        implementationRoadmap: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string' },
              duration: { type: 'string' },
              recommendations: { type: 'array', items: { type: 'string' } },
              expectedSavings: { type: 'string' }
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
  labels: ['agent', 'error-budget', 'recommendations']
}));

// Phase 10: Setup Error Budget Monitoring
export const setupErrorBudgetMonitoringTask = defineTask('setup-error-budget-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 10: Setup Error Budget Monitoring',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SRE Monitoring Specialist',
      task: 'Configure error budget monitoring, alerting, and dashboards',
      context: {
        services: args.services,
        errorBudgets: args.errorBudgets,
        slos: args.slos,
        alertThresholds: args.alertThresholds,
        notificationChannels: args.notificationChannels,
        monitoringPlatform: args.monitoringPlatform,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create error budget alerting rules:',
        '   - Critical: Fast burn rate (>14.4x) - Page immediately',
        '   - High: Slow burn rate (>6x) - Slack alert',
        '   - Medium: Low budget (<10% remaining) - Email notification',
        '   - Low: Budget exhausted - Deployment freeze notification',
        '2. Configure multi-window burn rate alerts:',
        '   - 1h/5m window: 2% budget burned in 1 hour',
        '   - 6h/30m window: 5% budget burned in 6 hours',
        '3. Create Grafana dashboards:',
        '   - Error Budget Overview: All services, budget status',
        '   - Service Error Budget: Per-service detailed view',
        '   - Burn Rate Dashboard: Multi-window burn rates',
        '   - SLO Compliance: SLO targets vs actuals',
        '4. Add dashboard panels:',
        '   - Error budget gauge (remaining %)',
        '   - Burn rate chart (time series)',
        '   - SLI compliance chart',
        '   - Budget consumption heatmap',
        '   - Incident correlation timeline',
        '5. Configure alerting:',
        '   - Prometheus AlertManager rules',
        '   - Datadog monitors',
        '   - New Relic alert policies',
        '6. Set up notification routing:',
        '   - Critical → PagerDuty',
        '   - High → Slack #reliability-alerts',
        '   - Medium → Email to SRE team',
        '7. Create recording rules for efficiency',
        '8. Add annotations for incidents and deployments',
        '9. Export dashboard and alert configurations',
        '10. Document monitoring setup'
      ],
      outputFormat: 'JSON object with monitoring configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['alerts', 'dashboards', 'artifacts'],
      properties: {
        alerts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              service: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              condition: { type: 'string' },
              threshold: { type: 'string' },
              window: { type: 'string' },
              channel: { type: 'string' }
            }
          }
        },
        dashboards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['overview', 'service-detail', 'burn-rate', 'slo-compliance'] },
              url: { type: 'string' },
              panels: { type: 'number' }
            }
          }
        },
        recordingRules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              query: { type: 'string' }
            }
          }
        },
        notificationRouting: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              severity: { type: 'string' },
              channels: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'error-budget', 'monitoring-setup']
}));

// Phase 11: Historical Trend Analysis
export const historicalTrendAnalysisTask = defineTask('historical-trend-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 11: Historical Trend Analysis',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SRE Data Analyst',
      task: 'Analyze historical error budget trends and forecast future consumption',
      context: {
        services: args.services,
        errorBudgets: args.errorBudgets,
        reportingPeriod: args.reportingPeriod,
        environment: args.environment,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Collect historical error budget data (last 3-6 months)',
        '2. Analyze trends:',
        '   - Month-over-month budget consumption',
        '   - Seasonal patterns',
        '   - Improvement or degradation trends',
        '3. Compare current period to previous periods',
        '4. Identify trend patterns:',
        '   - Improving: Decreasing consumption over time',
        '   - Stable: Consistent consumption',
        '   - Degrading: Increasing consumption over time',
        '   - Volatile: High variance in consumption',
        '5. Calculate trend metrics:',
        '   - Average monthly consumption',
        '   - Standard deviation',
        '   - Trend direction (slope)',
        '6. Forecast future budget consumption:',
        '   - Linear projection',
        '   - Moving average',
        '   - Confidence intervals',
        '7. Identify anomalous periods and correlate with events',
        '8. Analyze impact of reliability improvements',
        '9. Generate trend visualizations',
        '10. Create forecast reports'
      ],
      outputFormat: 'JSON object with trend analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['trendsIdentified', 'overallTrend', 'forecasts', 'artifacts'],
      properties: {
        trendsIdentified: { type: 'number' },
        overallTrend: { type: 'string', enum: ['improving', 'stable', 'degrading', 'volatile'] },
        serviceTrends: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              service: { type: 'string' },
              trend: { type: 'string', enum: ['improving', 'stable', 'degrading', 'volatile'] },
              changePercent: { type: 'number' },
              variance: { type: 'number' }
            }
          }
        },
        historicalMetrics: {
          type: 'object',
          properties: {
            averageMonthlyConsumption: { type: 'number' },
            bestMonth: { type: 'object' },
            worstMonth: { type: 'object' },
            standardDeviation: { type: 'number' }
          }
        },
        forecasts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              service: { type: 'string' },
              nextMonthProjection: { type: 'number' },
              confidenceInterval: { type: 'string' },
              riskLevel: { type: 'string', enum: ['low', 'medium', 'high'] }
            }
          }
        },
        anomalies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              period: { type: 'string' },
              service: { type: 'string' },
              consumption: { type: 'number' },
              reason: { type: 'string' }
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
  labels: ['agent', 'error-budget', 'trend-analysis']
}));

// Phase 12: Generate Documentation
export const generateErrorBudgetDocumentationTask = defineTask('generate-error-budget-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 12: Generate Error Budget Documentation',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Documentation Specialist for SRE',
      task: 'Generate comprehensive error budget management documentation',
      context: {
        services: args.services,
        errorBudgets: args.errorBudgets,
        burnRateAnalysis: args.burnRateAnalysis,
        toilAnalysis: args.toilAnalysis,
        policyDecisions: args.policyDecisions,
        recommendations: args.recommendations,
        stakeholderReporting: args.stakeholderReporting,
        monitoringSetup: args.monitoringSetup,
        trendAnalysis: args.trendAnalysis,
        slos: args.slos,
        reportingPeriod: args.reportingPeriod,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create comprehensive error budget report',
        '2. Executive Summary (1 page):',
        '   - Overall error budget health',
        '   - Key findings and risks',
        '   - Top 3 recommendations',
        '   - Action items',
        '3. Error Budget Status:',
        '   - Per-service budget breakdown',
        '   - SLO compliance summary',
        '   - Critical services requiring attention',
        '4. Burn Rate Analysis:',
        '   - Current burn rates',
        '   - Fast/slow burn alerts',
        '   - Projected exhaustion dates',
        '5. Incident Impact:',
        '   - Incidents correlated with budget consumption',
        '   - High-impact incidents',
        '   - Incident patterns',
        '6. Toil and Reliability:',
        '   - Toil hotspots',
        '   - Automation opportunities',
        '   - Reliability metrics (MTBF, MTTR)',
        '7. Policy Decisions:',
        '   - Deployment freeze status',
        '   - Policy recommendations',
        '   - Velocity impact',
        '8. Recommendations:',
        '   - Prioritized action items',
        '   - Implementation roadmap',
        '   - Expected impact',
        '9. Historical Trends:',
        '   - Trend analysis',
        '   - Forecasts',
        '   - Improvements over time',
        '10. Appendices:',
        '    - Detailed metrics',
        '    - Methodology',
        '    - Glossary',
        '11. Format as professional Markdown document',
        '12. Include charts and visualizations'
      ],
      outputFormat: 'JSON object with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummaryPath', 'artifacts'],
      properties: {
        reportPath: { type: 'string', description: 'Main error budget report path' },
        executiveSummaryPath: { type: 'string', description: 'Executive summary path' },
        technicalReportPath: { type: 'string', description: 'Detailed technical report' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        criticalRisks: { type: 'array', items: { type: 'string' } },
        topRecommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'error-budget', 'documentation']
}));
