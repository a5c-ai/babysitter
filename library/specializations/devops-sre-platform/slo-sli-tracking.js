/**
 * @process specializations/devops-sre-platform/slo-sli-tracking
 * @description SLO/SLI Definition and Tracking - Comprehensive process for defining Service Level Objectives (SLOs),
 * identifying Service Level Indicators (SLIs), implementing error budget tracking, creating SLO dashboards,
 * and establishing alerting for SLO violations. Follows Google SRE best practices for reliability engineering
 * with quarterly review cycles and error budget policies.
 * @inputs { projectName: string, services: array, targetAvailability?: number, targetLatencyP95?: number, reviewCycle?: string }
 * @outputs { success: boolean, sloScore: number, slis: array, slos: array, errorBudgetPolicy: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/devops-sre-platform/slo-sli-tracking', {
 *   projectName: 'E-commerce Platform',
 *   services: ['api-gateway', 'payment-service', 'order-service', 'inventory-service'],
 *   targetAvailability: 99.9,
 *   targetLatencyP95: 200,
 *   targetErrorRate: 0.1,
 *   reviewCycle: 'quarterly',
 *   environment: 'production',
 *   stakeholders: ['engineering-lead', 'product-manager', 'sre-team'],
 *   businessCriticalFlows: ['checkout', 'payment-processing', 'order-placement']
 * });
 *
 * @references
 * - Google SRE Book - SLOs: https://sre.google/sre-book/service-level-objectives/
 * - Implementing Service Level Objectives: https://www.oreilly.com/library/view/implementing-service-level/9781492076803/
 * - SLO Workbook: https://sre.google/workbook/implementing-slos/
 * - Error Budget Policy: https://sre.google/workbook/error-budget-policy/
 * - SLI Menu: https://landing.google.com/sre/workbook/chapters/slo-engineering-case-studies/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    services = [],
    targetAvailability = 99.9, // 99.9% availability (three nines)
    targetLatencyP95 = 500, // milliseconds
    targetLatencyP99 = 1000, // milliseconds
    targetErrorRate = 1.0, // percentage
    reviewCycle = 'quarterly', // 'monthly', 'quarterly', 'yearly'
    environment = 'production',
    stakeholders = [],
    businessCriticalFlows = [],
    errorBudgetWindow = 30, // days
    sloViolationThreshold = 0.9, // alert when SLO consumption reaches 90%
    monitoringPlatform = 'prometheus', // 'prometheus', 'datadog', 'newrelic', 'cloudwatch'
    dashboardTool = 'grafana', // 'grafana', 'datadog', 'kibana'
    outputDir = 'slo-sli-tracking-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let sloScore = 0;
  const slis = [];
  const slos = [];
  let errorBudgetPolicy = null;

  ctx.log('info', `Starting SLO/SLI Definition and Tracking for ${projectName}`);
  ctx.log('info', `Target Availability: ${targetAvailability}%, Services: ${services.length}, Review Cycle: ${reviewCycle}`);

  // ============================================================================
  // PHASE 1: IDENTIFY USER JOURNEYS AND CRITICAL SERVICES
  // ============================================================================

  ctx.log('info', 'Phase 1: Identifying user journeys and critical services');

  const userJourneyResult = await ctx.task(identifyUserJourneysTask, {
    projectName,
    services,
    businessCriticalFlows,
    stakeholders,
    outputDir
  });

  artifacts.push(...userJourneyResult.artifacts);

  ctx.log('info', `User Journeys Identified - Critical Journeys: ${userJourneyResult.criticalJourneys.length}, Services Mapped: ${userJourneyResult.serviceMappings.length}`);

  // Quality Gate: User journey review
  await ctx.breakpoint({
    question: `User journeys identified for ${projectName}. Found ${userJourneyResult.criticalJourneys.length} critical journeys. Review and confirm these represent user-facing functionality?`,
    title: 'User Journey Review',
    context: {
      runId: ctx.runId,
      criticalJourneys: userJourneyResult.criticalJourneys.slice(0, 10),
      serviceMappings: userJourneyResult.serviceMappings.slice(0, 10),
      recommendation: 'Ensure all business-critical user flows are captured',
      files: userJourneyResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 2: DEFINE SERVICE LEVEL INDICATORS (SLIs)
  // ============================================================================

  ctx.log('info', 'Phase 2: Defining Service Level Indicators (SLIs)');

  const sliDefinitionResult = await ctx.task(defineSLIsTask, {
    projectName,
    services,
    userJourneyResult,
    targetAvailability,
    targetLatencyP95,
    targetLatencyP99,
    targetErrorRate,
    monitoringPlatform,
    outputDir
  });

  slis.push(...sliDefinitionResult.slis);
  artifacts.push(...sliDefinitionResult.artifacts);

  ctx.log('info', `SLIs Defined - Total: ${sliDefinitionResult.slis.length}, Availability SLIs: ${sliDefinitionResult.availabilitySLIs}, Latency SLIs: ${sliDefinitionResult.latencySLIs}`);

  // Quality Gate: SLI definition review
  await ctx.breakpoint({
    question: `${sliDefinitionResult.slis.length} SLIs defined for ${projectName}. Availability: ${sliDefinitionResult.availabilitySLIs}, Latency: ${sliDefinitionResult.latencySLIs}, Error Rate: ${sliDefinitionResult.errorRateSLIs}. Review SLI definitions?`,
    title: 'SLI Definition Review',
    context: {
      runId: ctx.runId,
      sliCount: sliDefinitionResult.slis.length,
      breakdown: {
        availability: sliDefinitionResult.availabilitySLIs,
        latency: sliDefinitionResult.latencySLIs,
        errorRate: sliDefinitionResult.errorRateSLIs,
        custom: sliDefinitionResult.customSLIs
      },
      topSLIs: sliDefinitionResult.slis.slice(0, 10),
      files: sliDefinitionResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 3: SET SERVICE LEVEL OBJECTIVES (SLOs)
  // ============================================================================

  ctx.log('info', 'Phase 3: Setting Service Level Objectives (SLOs)');

  const sloDefinitionResult = await ctx.task(setSLOsTask, {
    projectName,
    services,
    slis: sliDefinitionResult.slis,
    targetAvailability,
    targetLatencyP95,
    targetLatencyP99,
    targetErrorRate,
    errorBudgetWindow,
    stakeholders,
    outputDir
  });

  slos.push(...sloDefinitionResult.slos);
  artifacts.push(...sloDefinitionResult.artifacts);

  ctx.log('info', `SLOs Set - Total: ${sloDefinitionResult.slos.length}, Critical SLOs: ${sloDefinitionResult.criticalSLOs.length}`);

  // Quality Gate: SLO target review
  await ctx.breakpoint({
    question: `${sloDefinitionResult.slos.length} SLOs defined with targets. Critical SLOs: ${sloDefinitionResult.criticalSLOs.length}. Are these targets achievable and aligned with business needs?`,
    title: 'SLO Target Review',
    context: {
      runId: ctx.runId,
      sloCount: sloDefinitionResult.slos.length,
      criticalSLOs: sloDefinitionResult.criticalSLOs,
      averageTarget: sloDefinitionResult.averageTarget,
      recommendation: 'Ensure SLO targets are ambitious but achievable',
      files: sloDefinitionResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 4: CALCULATE ERROR BUDGETS
  // ============================================================================

  ctx.log('info', 'Phase 4: Calculating error budgets');

  const errorBudgetResult = await ctx.task(calculateErrorBudgetsTask, {
    projectName,
    slos: sloDefinitionResult.slos,
    errorBudgetWindow,
    environment,
    outputDir
  });

  artifacts.push(...errorBudgetResult.artifacts);

  ctx.log('info', `Error Budgets Calculated - Total SLOs: ${errorBudgetResult.errorBudgets.length}, Average Budget: ${errorBudgetResult.averageErrorBudget}%`);

  // ============================================================================
  // PHASE 5: IMPLEMENT SLI MEASUREMENT AND DATA COLLECTION
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing SLI measurement and data collection');

  const sliImplementationResult = await ctx.task(implementSLIMeasurementTask, {
    projectName,
    services,
    slis: sliDefinitionResult.slis,
    monitoringPlatform,
    environment,
    outputDir
  });

  artifacts.push(...sliImplementationResult.artifacts);

  ctx.log('info', `SLI Measurement Implemented - Queries: ${sliImplementationResult.queries.length}, Data Sources: ${sliImplementationResult.dataSources.length}`);

  // Quality Gate: SLI measurement verification
  if (!sliImplementationResult.allSLIsImplemented) {
    await ctx.breakpoint({
      question: `SLI measurement implementation incomplete. ${sliImplementationResult.unimplementedSLIs.length} SLIs missing measurement. Address before proceeding?`,
      title: 'SLI Measurement Verification',
      context: {
        runId: ctx.runId,
        implementedCount: sliImplementationResult.implementedCount,
        totalCount: sliDefinitionResult.slis.length,
        unimplementedSLIs: sliImplementationResult.unimplementedSLIs,
        recommendation: 'All SLIs should have measurement queries defined',
        files: sliImplementationResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 6: CREATE SLO DASHBOARDS
  // ============================================================================

  ctx.log('info', 'Phase 6: Creating SLO dashboards');

  const dashboardResult = await ctx.task(createSLODashboardsTask, {
    projectName,
    services,
    slis: sliDefinitionResult.slis,
    slos: sloDefinitionResult.slos,
    errorBudgets: errorBudgetResult.errorBudgets,
    dashboardTool,
    monitoringPlatform,
    outputDir
  });

  artifacts.push(...dashboardResult.artifacts);

  ctx.log('info', `SLO Dashboards Created - Dashboards: ${dashboardResult.dashboards.length}, Panels: ${dashboardResult.totalPanels}`);

  // Quality Gate: Dashboard review
  await ctx.breakpoint({
    question: `${dashboardResult.dashboards.length} SLO dashboards created. Review dashboards: ${dashboardResult.dashboards.map(d => d.name).join(', ')}`,
    title: 'SLO Dashboard Review',
    context: {
      runId: ctx.runId,
      dashboards: dashboardResult.dashboards.map(d => ({
        name: d.name,
        type: d.type,
        panelCount: d.panelCount,
        url: d.url
      })),
      files: dashboardResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 7: IMPLEMENT SLO ALERTING
  // ============================================================================

  ctx.log('info', 'Phase 7: Implementing SLO alerting');

  const alertingResult = await ctx.task(implementSLOAlertingTask, {
    projectName,
    slos: sloDefinitionResult.slos,
    errorBudgets: errorBudgetResult.errorBudgets,
    sloViolationThreshold,
    monitoringPlatform,
    environment,
    outputDir
  });

  artifacts.push(...alertingResult.artifacts);

  ctx.log('info', `SLO Alerting Implemented - Alerts: ${alertingResult.alerts.length}, Burn Rate Alerts: ${alertingResult.burnRateAlerts.length}`);

  // Quality Gate: Alerting configuration review
  await ctx.breakpoint({
    question: `SLO alerting configured with ${alertingResult.alerts.length} alert rules. Burn rate alerts: ${alertingResult.burnRateAlerts.length}. Test alerts?`,
    title: 'SLO Alerting Review',
    context: {
      runId: ctx.runId,
      alerting: {
        totalAlerts: alertingResult.alerts.length,
        burnRateAlerts: alertingResult.burnRateAlerts.length,
        budgetExhaustionAlerts: alertingResult.budgetExhaustionAlerts.length,
        fastBurnAlerts: alertingResult.fastBurnAlerts,
        slowBurnAlerts: alertingResult.slowBurnAlerts
      },
      topAlerts: alertingResult.alerts.slice(0, 10),
      files: alertingResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 8: DEFINE ERROR BUDGET POLICY
  // ============================================================================

  ctx.log('info', 'Phase 8: Defining error budget policy');

  const policyResult = await ctx.task(defineErrorBudgetPolicyTask, {
    projectName,
    slos: sloDefinitionResult.slos,
    errorBudgets: errorBudgetResult.errorBudgets,
    stakeholders,
    reviewCycle,
    outputDir
  });

  errorBudgetPolicy = policyResult.policy;
  artifacts.push(...policyResult.artifacts);

  ctx.log('info', `Error Budget Policy Defined - Policy Levels: ${policyResult.policyLevels}, Actions: ${policyResult.actions.length}`);

  // Quality Gate: Error budget policy review
  await ctx.breakpoint({
    question: `Error budget policy defined with ${policyResult.policyLevels} levels and ${policyResult.actions.length} actions. Review policy: When budget < 50%, ${policyResult.policy.level50Action}. When budget < 10%, ${policyResult.policy.level10Action}`,
    title: 'Error Budget Policy Review',
    context: {
      runId: ctx.runId,
      policy: {
        policyLevels: policyResult.policyLevels,
        actions: policyResult.actions,
        escalationPath: policyResult.escalationPath,
        reviewCycle: policyResult.reviewCycle
      },
      files: policyResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 9: CREATE SLO REPORTING AND TRACKING
  // ============================================================================

  ctx.log('info', 'Phase 9: Creating SLO reporting and tracking');

  const reportingResult = await ctx.task(createSLOReportingTask, {
    projectName,
    services,
    slis: sliDefinitionResult.slis,
    slos: sloDefinitionResult.slos,
    errorBudgets: errorBudgetResult.errorBudgets,
    errorBudgetPolicy: policyResult.policy,
    reviewCycle,
    stakeholders,
    outputDir
  });

  artifacts.push(...reportingResult.artifacts);

  ctx.log('info', `SLO Reporting Created - Reports: ${reportingResult.reports.length}, Review Schedule: ${reportingResult.reviewSchedule}`);

  // ============================================================================
  // PHASE 10: VALIDATE SLO IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Validating SLO implementation');

  const validationResult = await ctx.task(validateSLOImplementationTask, {
    projectName,
    slis: sliDefinitionResult.slis,
    slos: sloDefinitionResult.slos,
    sliImplementation: sliImplementationResult,
    dashboards: dashboardResult.dashboards,
    alerts: alertingResult.alerts,
    outputDir
  });

  artifacts.push(...validationResult.artifacts);

  ctx.log('info', `Validation Complete - Coverage: ${validationResult.coverage}%, Issues: ${validationResult.issues.length}`);

  // Quality Gate: Validation review
  if (validationResult.issues.length > 0) {
    await ctx.breakpoint({
      question: `SLO implementation validation found ${validationResult.issues.length} issues. Coverage: ${validationResult.coverage}%. Review and address issues?`,
      title: 'SLO Validation Review',
      context: {
        runId: ctx.runId,
        validation: {
          coverage: validationResult.coverage,
          issuesCount: validationResult.issues.length,
          criticalIssues: validationResult.criticalIssues,
          passed: validationResult.passed
        },
        issues: validationResult.issues,
        files: validationResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 11: CONDUCT BASELINE MEASUREMENT
  // ============================================================================

  ctx.log('info', 'Phase 11: Conducting baseline measurement');

  const baselineResult = await ctx.task(conductBaselineMeasurementTask, {
    projectName,
    slis: sliDefinitionResult.slis,
    slos: sloDefinitionResult.slos,
    sliImplementation: sliImplementationResult,
    measurementPeriod: 7, // days
    outputDir
  });

  artifacts.push(...baselineResult.artifacts);

  ctx.log('info', `Baseline Measurement Complete - Period: ${baselineResult.measurementPeriod} days, SLO Compliance: ${baselineResult.overallCompliance}%`);

  // Quality Gate: Baseline review
  await ctx.breakpoint({
    question: `Baseline measurement complete over ${baselineResult.measurementPeriod} days. Overall SLO compliance: ${baselineResult.overallCompliance}%. ${baselineResult.slosViolated} SLOs violated. Review baseline data?`,
    title: 'Baseline Measurement Review',
    context: {
      runId: ctx.runId,
      baseline: {
        measurementPeriod: `${baselineResult.measurementPeriod} days`,
        overallCompliance: `${baselineResult.overallCompliance}%`,
        slosMet: baselineResult.slosMet,
        slosViolated: baselineResult.slosViolated,
        averageErrorBudgetRemaining: `${baselineResult.averageErrorBudgetRemaining}%`
      },
      violatedSLOs: baselineResult.violatedSLOs,
      recommendation: baselineResult.recommendation,
      files: baselineResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 12: GENERATE DOCUMENTATION AND TRAINING
  // ============================================================================

  ctx.log('info', 'Phase 12: Generating documentation and training materials');

  const documentationResult = await ctx.task(generateSLODocumentationTask, {
    projectName,
    services,
    userJourneys: userJourneyResult.criticalJourneys,
    slis: sliDefinitionResult.slis,
    slos: sloDefinitionResult.slos,
    errorBudgets: errorBudgetResult.errorBudgets,
    errorBudgetPolicy: policyResult.policy,
    dashboards: dashboardResult.dashboards,
    alerts: alertingResult.alerts,
    baselineResult,
    reviewCycle,
    outputDir
  });

  artifacts.push(...documentationResult.artifacts);

  ctx.log('info', `Documentation Generated - Documents: ${documentationResult.documents.length}, Training Modules: ${documentationResult.trainingModules.length}`);

  // ============================================================================
  // PHASE 13: CALCULATE SLO MATURITY SCORE
  // ============================================================================

  ctx.log('info', 'Phase 13: Calculating SLO maturity score');

  const scoringResult = await ctx.task(calculateSLOMaturityScoreTask, {
    projectName,
    sliDefinitionResult,
    sloDefinitionResult,
    errorBudgetResult,
    sliImplementationResult,
    dashboardResult,
    alertingResult,
    policyResult,
    reportingResult,
    validationResult,
    baselineResult,
    outputDir
  });

  sloScore = scoringResult.sloMaturityScore;
  artifacts.push(...scoringResult.artifacts);

  ctx.log('info', `SLO Maturity Score: ${sloScore}/100 - Level: ${scoringResult.maturityLevel}`);

  // Final Breakpoint: SLO/SLI tracking setup complete
  await ctx.breakpoint({
    question: `SLO/SLI Definition and Tracking Complete for ${projectName}. Maturity Score: ${sloScore}/100 (${scoringResult.maturityLevel}). ${slos.length} SLOs defined, ${slis.length} SLIs tracked. Baseline compliance: ${baselineResult.overallCompliance}%. Approve for production use?`,
    title: 'Final SLO/SLI Setup Review',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        sloMaturityScore: sloScore,
        maturityLevel: scoringResult.maturityLevel,
        sliCount: slis.length,
        sloCount: slos.length,
        dashboardsCreated: dashboardResult.dashboards.length,
        alertsConfigured: alertingResult.alerts.length,
        baselineCompliance: `${baselineResult.overallCompliance}%`,
        reviewCycle: reviewCycle
      },
      breakdown: {
        sliDefinition: scoringResult.componentScores.sliDefinition,
        sloTargets: scoringResult.componentScores.sloTargets,
        errorBudgets: scoringResult.componentScores.errorBudgets,
        measurement: scoringResult.componentScores.measurement,
        dashboards: scoringResult.componentScores.dashboards,
        alerting: scoringResult.componentScores.alerting,
        policy: scoringResult.componentScores.policy,
        baseline: scoringResult.componentScores.baseline
      },
      errorBudgetPolicy: {
        policyLevels: policyResult.policyLevels,
        reviewCycle: policyResult.reviewCycle,
        escalationPath: policyResult.escalationPath
      },
      verdict: scoringResult.verdict,
      recommendation: scoringResult.recommendation,
      files: [
        { path: documentationResult.mainDocPath, format: 'markdown', label: 'SLO/SLI Documentation' },
        { path: policyResult.policyPath, format: 'markdown', label: 'Error Budget Policy' },
        { path: scoringResult.summaryPath, format: 'json', label: 'SLO Maturity Score Summary' },
        { path: dashboardResult.dashboardsConfigPath, format: 'json', label: 'SLO Dashboards Configuration' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    sloMaturityScore: sloScore,
    maturityLevel: scoringResult.maturityLevel,
    slis: slis.map(sli => ({
      name: sli.name,
      type: sli.type,
      service: sli.service,
      metric: sli.metric,
      measurement: sli.measurement
    })),
    slos: slos.map(slo => ({
      name: slo.name,
      sli: slo.sli,
      target: slo.target,
      window: slo.window,
      criticality: slo.criticality
    })),
    errorBudgetPolicy: {
      window: errorBudgetPolicy.window,
      policyLevels: errorBudgetPolicy.policyLevels,
      actions: errorBudgetPolicy.actions,
      reviewCycle: errorBudgetPolicy.reviewCycle,
      escalationPath: errorBudgetPolicy.escalationPath
    },
    implementation: {
      slisMeasured: sliImplementationResult.implementedCount,
      totalSLIs: slis.length,
      dashboardsCreated: dashboardResult.dashboards.length,
      alertsConfigured: alertingResult.alerts.length,
      burnRateAlerts: alertingResult.burnRateAlerts.length
    },
    baseline: {
      measurementPeriod: `${baselineResult.measurementPeriod} days`,
      overallCompliance: baselineResult.overallCompliance,
      slosMet: baselineResult.slosMet,
      slosViolated: baselineResult.slosViolated,
      averageErrorBudgetRemaining: baselineResult.averageErrorBudgetRemaining
    },
    dashboards: dashboardResult.dashboards.map(d => ({
      name: d.name,
      type: d.type,
      url: d.url,
      panelCount: d.panelCount
    })),
    alerts: {
      totalAlerts: alertingResult.alerts.length,
      burnRateAlerts: alertingResult.burnRateAlerts.length,
      budgetExhaustionAlerts: alertingResult.budgetExhaustionAlerts.length,
      fastBurnAlerts: alertingResult.fastBurnAlerts,
      slowBurnAlerts: alertingResult.slowBurnAlerts
    },
    validation: {
      coverage: validationResult.coverage,
      passed: validationResult.passed,
      issues: validationResult.issues.length,
      criticalIssues: validationResult.criticalIssues
    },
    artifacts,
    documentation: {
      mainDocPath: documentationResult.mainDocPath,
      policyPath: policyResult.policyPath,
      summaryPath: scoringResult.summaryPath,
      dashboardsConfigPath: dashboardResult.dashboardsConfigPath,
      trainingModules: documentationResult.trainingModules
    },
    duration,
    metadata: {
      processId: 'specializations/devops-sre-platform/slo-sli-tracking',
      processSlug: 'slo-sli-tracking',
      category: 'devops-sre-platform',
      specializationSlug: 'devops-sre-platform',
      timestamp: startTime,
      environment,
      reviewCycle,
      monitoringPlatform,
      dashboardTool,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: Identify User Journeys
export const identifyUserJourneysTask = defineTask('identify-user-journeys', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Identify User Journeys - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SRE and Product Analyst',
      task: 'Identify critical user journeys and map them to services',
      context: {
        projectName: args.projectName,
        services: args.services,
        businessCriticalFlows: args.businessCriticalFlows,
        stakeholders: args.stakeholders,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify all user-facing journeys (login, checkout, search, etc.)',
        '2. Prioritize journeys by business criticality',
        '3. Map each journey to the services it depends on',
        '4. Identify entry points for each journey (API endpoints, URLs)',
        '5. Determine expected user behavior and success criteria',
        '6. Calculate estimated traffic for each journey',
        '7. Identify revenue-generating journeys',
        '8. Document journey flows and dependencies',
        '9. Classify journeys by criticality (critical, high, medium, low)',
        '10. Create user journey map document'
      ],
      outputFormat: 'JSON object with user journey analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'criticalJourneys', 'serviceMappings', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        criticalJourneys: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              criticality: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              services: { type: 'array', items: { type: 'string' } },
              entryPoints: { type: 'array', items: { type: 'string' } },
              estimatedTraffic: { type: 'string' },
              revenueImpact: { type: 'boolean' }
            }
          }
        },
        serviceMappings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              service: { type: 'string' },
              journeys: { type: 'array', items: { type: 'string' } },
              criticality: { type: 'string' }
            }
          }
        },
        totalJourneys: { type: 'number' },
        criticalJourneysCount: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'slo-sli-tracking', 'user-journeys']
}));

// Phase 2: Define SLIs
export const defineSLIsTask = defineTask('define-slis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Define Service Level Indicators - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SRE and SLO Specialist',
      task: 'Define Service Level Indicators (SLIs) for critical user journeys',
      context: {
        projectName: args.projectName,
        services: args.services,
        userJourneyResult: args.userJourneyResult,
        targetAvailability: args.targetAvailability,
        targetLatencyP95: args.targetLatencyP95,
        targetLatencyP99: args.targetLatencyP99,
        targetErrorRate: args.targetErrorRate,
        monitoringPlatform: args.monitoringPlatform,
        outputDir: args.outputDir
      },
      instructions: [
        '1. For each critical user journey, identify measurable SLIs',
        '2. Define Availability SLIs: successful requests / total requests',
        '3. Define Latency SLIs: request duration (p50, p95, p99)',
        '4. Define Error Rate SLIs: error responses / total requests',
        '5. Define Throughput SLIs: requests per second',
        '6. Consider custom SLIs for business metrics (conversion rate, etc.)',
        '7. Specify measurement method (request logs, metrics, synthetic probes)',
        '8. Define aggregation period (1m, 5m, 1h, 1d, 30d)',
        '9. Identify data source for each SLI (Prometheus, logs, traces)',
        '10. Document SLI specification for each indicator',
        '11. Use SRE workbook SLI menu as reference',
        '12. Create SLI definition document'
      ],
      outputFormat: 'JSON object with SLI definitions'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'slis', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        slis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['availability', 'latency', 'error-rate', 'throughput', 'custom'] },
              service: { type: 'string' },
              journey: { type: 'string' },
              metric: { type: 'string' },
              measurement: { type: 'string' },
              aggregationPeriod: { type: 'string' },
              dataSource: { type: 'string' },
              specification: { type: 'string' }
            }
          }
        },
        availabilitySLIs: { type: 'number' },
        latencySLIs: { type: 'number' },
        errorRateSLIs: { type: 'number' },
        throughputSLIs: { type: 'number' },
        customSLIs: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'slo-sli-tracking', 'sli-definition']
}));

// Phase 3: Set SLOs
export const setSLOsTask = defineTask('set-slos', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Set Service Level Objectives - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SRE and Reliability Engineer',
      task: 'Set Service Level Objectives (SLOs) with target values',
      context: {
        projectName: args.projectName,
        services: args.services,
        slis: args.slis,
        targetAvailability: args.targetAvailability,
        targetLatencyP95: args.targetLatencyP95,
        targetLatencyP99: args.targetLatencyP99,
        targetErrorRate: args.targetErrorRate,
        errorBudgetWindow: args.errorBudgetWindow,
        stakeholders: args.stakeholders,
        outputDir: args.outputDir
      },
      instructions: [
        '1. For each SLI, set an appropriate SLO target',
        '2. Availability SLOs: Express as percentage (99.9%, 99.95%, 99.99%)',
        '3. Latency SLOs: Express as milliseconds at percentile (p95 < 200ms)',
        '4. Error Rate SLOs: Express as percentage (< 1%)',
        '5. Consider user expectations and business requirements',
        '6. Set ambitious but achievable targets',
        '7. Define measurement window (rolling 30d, calendar month)',
        '8. Specify SLO criticality (critical, high, medium)',
        '9. Document rationale for each target',
        '10. Consider dependencies between SLOs',
        '11. Align with existing SLAs if any',
        '12. Create SLO specification document'
      ],
      outputFormat: 'JSON object with SLO definitions'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'slos', 'criticalSLOs', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        slos: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              sli: { type: 'string' },
              target: { type: 'number' },
              unit: { type: 'string' },
              window: { type: 'string' },
              criticality: { type: 'string', enum: ['critical', 'high', 'medium'] },
              rationale: { type: 'string' },
              measurement: { type: 'string' }
            }
          }
        },
        criticalSLOs: {
          type: 'array',
          items: { type: 'string' }
        },
        averageTarget: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'slo-sli-tracking', 'slo-definition']
}));

// Phase 4: Calculate Error Budgets
export const calculateErrorBudgetsTask = defineTask('calculate-error-budgets', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Calculate Error Budgets - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SRE Error Budget Specialist',
      task: 'Calculate error budgets for each SLO',
      context: {
        projectName: args.projectName,
        slos: args.slos,
        errorBudgetWindow: args.errorBudgetWindow,
        environment: args.environment,
        outputDir: args.outputDir
      },
      instructions: [
        '1. For each SLO, calculate error budget: (100% - SLO target)',
        '2. Example: 99.9% SLO → 0.1% error budget → 43.2 minutes/month downtime',
        '3. Convert error budget to time units (minutes, hours)',
        '4. Calculate error budget for different windows (daily, weekly, monthly)',
        '5. Determine acceptable failure rate',
        '6. Calculate request-based error budget (if applicable)',
        '7. Define error budget consumption rate thresholds',
        '8. Create error budget visualization formulas',
        '9. Document error budget calculations',
        '10. Create error budget reference table'
      ],
      outputFormat: 'JSON object with error budget calculations'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'errorBudgets', 'averageErrorBudget', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        errorBudgets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              slo: { type: 'string' },
              sloTarget: { type: 'number' },
              errorBudgetPercentage: { type: 'number' },
              errorBudgetTime: { type: 'string', description: 'e.g., "43.2 minutes/month"' },
              dailyBudget: { type: 'string' },
              weeklyBudget: { type: 'string' },
              monthlyBudget: { type: 'string' },
              acceptableFailureRate: { type: 'number' }
            }
          }
        },
        averageErrorBudget: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'slo-sli-tracking', 'error-budget']
}));

// Phase 5: Implement SLI Measurement
export const implementSLIMeasurementTask = defineTask('implement-sli-measurement', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Implement SLI Measurement - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Observability Engineer',
      task: 'Implement SLI measurement queries and data collection',
      context: {
        projectName: args.projectName,
        services: args.services,
        slis: args.slis,
        monitoringPlatform: args.monitoringPlatform,
        environment: args.environment,
        outputDir: args.outputDir
      },
      instructions: [
        '1. For each SLI, create measurement query',
        '2. Prometheus queries:',
        '   - Availability: sum(rate(http_requests_total{status!~"5.."}[5m])) / sum(rate(http_requests_total[5m]))',
        '   - Latency: histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))',
        '   - Error Rate: sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))',
        '3. Define recording rules for complex queries',
        '4. Configure appropriate aggregation and labels',
        '5. Test queries return valid data',
        '6. Optimize query performance',
        '7. Document query logic',
        '8. Create query library file',
        '9. Verify data sources are instrumented',
        '10. List any missing instrumentation'
      ],
      outputFormat: 'JSON object with SLI measurement implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'queries', 'implementedCount', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        queries: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sli: { type: 'string' },
              query: { type: 'string' },
              platform: { type: 'string' },
              recordingRule: { type: 'string' },
              tested: { type: 'boolean' }
            }
          }
        },
        recordingRules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              expr: { type: 'string' },
              labels: { type: 'object' }
            }
          }
        },
        dataSources: { type: 'array', items: { type: 'string' } },
        implementedCount: { type: 'number' },
        allSLIsImplemented: { type: 'boolean' },
        unimplementedSLIs: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'slo-sli-tracking', 'measurement']
}));

// Phase 6: Create SLO Dashboards
export const createSLODashboardsTask = defineTask('create-slo-dashboards', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Create SLO Dashboards - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Dashboard Designer and SRE',
      task: 'Create comprehensive SLO monitoring dashboards',
      context: {
        projectName: args.projectName,
        services: args.services,
        slis: args.slis,
        slos: args.slos,
        errorBudgets: args.errorBudgets,
        dashboardTool: args.dashboardTool,
        monitoringPlatform: args.monitoringPlatform,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create SLO Overview Dashboard:',
        '   - SLO compliance status for all services',
        '   - Error budget remaining gauges',
        '   - SLO trend over time',
        '   - Recent SLO violations',
        '2. Create Service-Level SLO Dashboards (one per service):',
        '   - All SLIs for the service',
        '   - SLO targets and current values',
        '   - Error budget burn rate',
        '   - Historical SLO compliance',
        '3. Create Error Budget Dashboard:',
        '   - Error budget remaining by SLO',
        '   - Burn rate (fast vs. slow burn)',
        '   - Projected budget exhaustion date',
        '   - Budget consumption timeline',
        '4. Add dashboard features:',
        '   - Color coding (green: OK, yellow: warning, red: violation)',
        '   - Time range selector',
        '   - Service/SLO filters',
        '   - Links to runbooks',
        '5. Export dashboards as JSON',
        '6. Document dashboard usage'
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
              type: { type: 'string', enum: ['slo-overview', 'service-slo', 'error-budget', 'custom'] },
              description: { type: 'string' },
              service: { type: 'string' },
              panelCount: { type: 'number' },
              url: { type: 'string' },
              variables: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        totalPanels: { type: 'number' },
        dashboardsConfigPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'slo-sli-tracking', 'dashboards']
}));

// Phase 7: Implement SLO Alerting
export const implementSLOAlertingTask = defineTask('implement-slo-alerting', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Implement SLO Alerting - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SRE Alerting Specialist',
      task: 'Implement SLO-based alerting with burn rate alerts',
      context: {
        projectName: args.projectName,
        slos: args.slos,
        errorBudgets: args.errorBudgets,
        sloViolationThreshold: args.sloViolationThreshold,
        monitoringPlatform: args.monitoringPlatform,
        environment: args.environment,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Implement multi-window multi-burn-rate alerts (MWMB):',
        '   - Fast burn (1h + 5m windows): Alert if budget will exhaust in < 2 days',
        '   - Slow burn (6h + 30m windows): Alert if budget will exhaust in < 7 days',
        '2. Create SLO violation alerts:',
        '   - Alert when SLO target is breached',
        '   - Use appropriate time windows to avoid false positives',
        '3. Create error budget exhaustion alerts:',
        '   - Alert at 90% budget consumed',
        '   - Alert at 100% budget consumed',
        '4. Add alert metadata:',
        '   - SLO name and target',
        '   - Current value and threshold',
        '   - Error budget remaining',
        '   - Runbook link',
        '   - Dashboard link',
        '5. Configure alert severity:',
        '   - Critical: Fast burn or 100% budget exhausted',
        '   - High: Slow burn or 90% budget exhausted',
        '   - Medium: SLO violation',
        '6. Set up notification routing',
        '7. Test alerts with simulated failures',
        '8. Document alert definitions'
      ],
      outputFormat: 'JSON object with alerting configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'alerts', 'burnRateAlerts', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        alerts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              slo: { type: 'string' },
              type: { type: 'string', enum: ['fast-burn', 'slow-burn', 'slo-violation', 'budget-exhaustion'] },
              severity: { type: 'string', enum: ['critical', 'high', 'medium'] },
              condition: { type: 'string' },
              window: { type: 'string' },
              threshold: { type: 'string' },
              runbookUrl: { type: 'string' }
            }
          }
        },
        burnRateAlerts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              slo: { type: 'string' },
              fastBurnAlert: { type: 'object' },
              slowBurnAlert: { type: 'object' }
            }
          }
        },
        budgetExhaustionAlerts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              slo: { type: 'string' },
              threshold: { type: 'number' },
              alert: { type: 'object' }
            }
          }
        },
        fastBurnAlerts: { type: 'number' },
        slowBurnAlerts: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'slo-sli-tracking', 'alerting']
}));

// Phase 8: Define Error Budget Policy
export const defineErrorBudgetPolicyTask = defineTask('define-error-budget-policy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Define Error Budget Policy - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SRE Policy and Process Lead',
      task: 'Define error budget policy with escalation procedures',
      context: {
        projectName: args.projectName,
        slos: args.slos,
        errorBudgets: args.errorBudgets,
        stakeholders: args.stakeholders,
        reviewCycle: args.reviewCycle,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define error budget policy levels:',
        '   - 100%-75% remaining: Normal operations, continue feature development',
        '   - 75%-50% remaining: Caution, prioritize reliability improvements',
        '   - 50%-25% remaining: Focus on reliability, freeze non-critical features',
        '   - 25%-0% remaining: Incident mode, halt feature development',
        '   - 0% remaining: Feature freeze, all hands on reliability',
        '2. Define actions for each level:',
        '   - Communication: Who to notify',
        '   - Operational changes: What to prioritize',
        '   - Feature development: Continue, slow, or freeze',
        '   - Reliability work: What to focus on',
        '3. Define escalation path:',
        '   - Team level → Engineering lead → VP Engineering → CTO',
        '4. Define exception process for critical features',
        '5. Set review cadence (weekly, monthly, quarterly)',
        '6. Define SLO revision process',
        '7. Create policy document',
        '8. Get stakeholder approval'
      ],
      outputFormat: 'JSON object with error budget policy'
    },
    outputSchema: {
      type: 'object',
      required: ['policy', 'policyLevels', 'actions', 'policyPath', 'artifacts'],
      properties: {
        policy: {
          type: 'object',
          properties: {
            window: { type: 'string' },
            policyLevels: { type: 'number' },
            level100Action: { type: 'string' },
            level75Action: { type: 'string' },
            level50Action: { type: 'string' },
            level25Action: { type: 'string' },
            level0Action: { type: 'string' },
            escalationPath: { type: 'array', items: { type: 'string' } },
            exceptionProcess: { type: 'string' },
            reviewCycle: { type: 'string' }
          }
        },
        policyLevels: { type: 'number' },
        actions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              level: { type: 'string' },
              budgetRemaining: { type: 'string' },
              action: { type: 'string' },
              notification: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        escalationPath: { type: 'array', items: { type: 'string' } },
        reviewCycle: { type: 'string' },
        policyPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'slo-sli-tracking', 'policy']
}));

// Phase 9: Create SLO Reporting
export const createSLOReportingTask = defineTask('create-slo-reporting', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Create SLO Reporting - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SRE Reporting Specialist',
      task: 'Create SLO reporting and tracking mechanisms',
      context: {
        projectName: args.projectName,
        services: args.services,
        slis: args.slis,
        slos: args.slos,
        errorBudgets: args.errorBudgets,
        errorBudgetPolicy: args.errorBudgetPolicy,
        reviewCycle: args.reviewCycle,
        stakeholders: args.stakeholders,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create weekly SLO status report template',
        '2. Create monthly SLO review report template',
        '3. Create quarterly SLO retrospective template',
        '4. Define report content:',
        '   - SLO compliance summary',
        '   - Error budget status',
        '   - SLO violations and incidents',
        '   - Trends and patterns',
        '   - Recommendations for improvements',
        '5. Set up automated report generation',
        '6. Define report distribution list',
        '7. Create SLO review meeting agenda',
        '8. Define SLO revision criteria',
        '9. Create tracking spreadsheet/database',
        '10. Document reporting process'
      ],
      outputFormat: 'JSON object with reporting configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'reports', 'reviewSchedule', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        reports: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['weekly', 'monthly', 'quarterly', 'ad-hoc'] },
              frequency: { type: 'string' },
              recipients: { type: 'array', items: { type: 'string' } },
              templatePath: { type: 'string' }
            }
          }
        },
        reviewSchedule: { type: 'string' },
        distributionList: { type: 'array', items: { type: 'string' } },
        meetingAgenda: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'slo-sli-tracking', 'reporting']
}));

// Phase 10: Validate SLO Implementation
export const validateSLOImplementationTask = defineTask('validate-slo-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Validate SLO Implementation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SRE Quality Assurance Engineer',
      task: 'Validate SLO implementation completeness and correctness',
      context: {
        projectName: args.projectName,
        slis: args.slis,
        slos: args.slos,
        sliImplementation: args.sliImplementation,
        dashboards: args.dashboards,
        alerts: args.alerts,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Verify all SLIs have measurement queries',
        '2. Verify all SLOs have targets defined',
        '3. Verify all SLIs are visualized in dashboards',
        '4. Verify all critical SLOs have alerts',
        '5. Test SLI queries return valid data',
        '6. Test dashboards load and display correctly',
        '7. Test alerts fire when thresholds are breached',
        '8. Verify error budget calculations are correct',
        '9. Check for missing components',
        '10. Calculate coverage percentage',
        '11. Identify issues and gaps',
        '12. Generate validation report'
      ],
      outputFormat: 'JSON object with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'coverage', 'passed', 'issues', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        coverage: { type: 'number', description: 'Validation coverage percentage' },
        passed: { type: 'boolean' },
        validation: {
          type: 'object',
          properties: {
            slisMeasured: { type: 'boolean' },
            slosTargeted: { type: 'boolean' },
            dashboardsCreated: { type: 'boolean' },
            alertsConfigured: { type: 'boolean' },
            queriesTested: { type: 'boolean' },
            dashboardsTested: { type: 'boolean' },
            alertsTested: { type: 'boolean' }
          }
        },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              component: { type: 'string' },
              issue: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              recommendation: { type: 'string' }
            }
          }
        },
        criticalIssues: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'slo-sli-tracking', 'validation']
}));

// Phase 11: Conduct Baseline Measurement
export const conductBaselineMeasurementTask = defineTask('conduct-baseline-measurement', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Conduct Baseline Measurement - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SRE Data Analyst',
      task: 'Conduct baseline measurement of SLO compliance',
      context: {
        projectName: args.projectName,
        slis: args.slis,
        slos: args.slos,
        sliImplementation: args.sliImplementation,
        measurementPeriod: args.measurementPeriod,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Collect SLI data over baseline measurement period',
        '2. For each SLO, calculate compliance percentage',
        '3. Identify SLOs that are met vs. violated',
        '4. Calculate error budget consumption',
        '5. Calculate average, min, max for each SLI',
        '6. Identify trends and patterns',
        '7. Compare against targets',
        '8. Assess if targets are achievable',
        '9. Recommend SLO adjustments if needed',
        '10. Generate baseline measurement report'
      ],
      outputFormat: 'JSON object with baseline measurement results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'measurementPeriod', 'overallCompliance', 'slosMet', 'slosViolated', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        measurementPeriod: { type: 'number', description: 'Days' },
        overallCompliance: { type: 'number', description: 'Average SLO compliance percentage' },
        slosMet: { type: 'number' },
        slosViolated: { type: 'number' },
        averageErrorBudgetRemaining: { type: 'number' },
        violatedSLOs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              slo: { type: 'string' },
              target: { type: 'number' },
              actual: { type: 'number' },
              gap: { type: 'number' }
            }
          }
        },
        sloCompliance: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              slo: { type: 'string' },
              target: { type: 'number' },
              actual: { type: 'number' },
              met: { type: 'boolean' },
              errorBudgetRemaining: { type: 'number' }
            }
          }
        },
        recommendation: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'slo-sli-tracking', 'baseline']
}));

// Phase 12: Generate SLO Documentation
export const generateSLODocumentationTask = defineTask('generate-slo-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Generate SLO Documentation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Writer and SRE',
      task: 'Generate comprehensive SLO documentation and training materials',
      context: {
        projectName: args.projectName,
        services: args.services,
        userJourneys: args.userJourneys,
        slis: args.slis,
        slos: args.slos,
        errorBudgets: args.errorBudgets,
        errorBudgetPolicy: args.errorBudgetPolicy,
        dashboards: args.dashboards,
        alerts: args.alerts,
        baselineResult: args.baselineResult,
        reviewCycle: args.reviewCycle,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create main SLO documentation covering:',
        '   - Introduction to SLOs and why they matter',
        '   - User journeys and service mapping',
        '   - SLI definitions and measurements',
        '   - SLO targets and rationale',
        '   - Error budget policy',
        '   - Dashboards and monitoring',
        '   - Alerting and incident response',
        '   - Review and reporting process',
        '2. Create SLO reference guide (quick reference)',
        '3. Create dashboard usage guide',
        '4. Create alerting runbook',
        '5. Create error budget policy document',
        '6. Create training materials:',
        '   - SLO fundamentals presentation',
        '   - Dashboard walkthrough',
        '   - Error budget management guide',
        '   - SLO review meeting guide',
        '7. Create FAQ document',
        '8. Format as professional Markdown'
      ],
      outputFormat: 'JSON object with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'mainDocPath', 'documents', 'trainingModules', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        mainDocPath: { type: 'string' },
        documents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              path: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        trainingModules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              type: { type: 'string' },
              path: { type: 'string' },
              duration: { type: 'string' }
            }
          }
        },
        faqPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'slo-sli-tracking', 'documentation']
}));

// Phase 13: Calculate SLO Maturity Score
export const calculateSLOMaturityScoreTask = defineTask('calculate-slo-maturity-score', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 13: Calculate SLO Maturity Score - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SRE Assessment Specialist',
      task: 'Calculate SLO maturity score and provide final assessment',
      context: {
        projectName: args.projectName,
        sliDefinitionResult: args.sliDefinitionResult,
        sloDefinitionResult: args.sloDefinitionResult,
        errorBudgetResult: args.errorBudgetResult,
        sliImplementationResult: args.sliImplementationResult,
        dashboardResult: args.dashboardResult,
        alertingResult: args.alertingResult,
        policyResult: args.policyResult,
        reportingResult: args.reportingResult,
        validationResult: args.validationResult,
        baselineResult: args.baselineResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Calculate weighted SLO maturity score (0-100):',
        '   - SLI Definition (15% weight):',
        '     * Comprehensive SLI coverage',
        '     * User journey mapping',
        '     * SLI specifications',
        '   - SLO Targets (15% weight):',
        '     * Appropriate targets set',
        '     * Stakeholder alignment',
        '     * Target rationale documented',
        '   - Error Budgets (10% weight):',
        '     * Error budgets calculated',
        '     * Budget policy defined',
        '     * Budget tracking implemented',
        '   - Measurement (20% weight):',
        '     * All SLIs measured',
        '     * Queries optimized',
        '     * Data collection reliable',
        '   - Dashboards (15% weight):',
        '     * Overview and service dashboards',
        '     * Error budget visualization',
        '     * Dashboard usability',
        '   - Alerting (15% weight):',
        '     * Burn rate alerts',
        '     * Budget exhaustion alerts',
        '     * Alert testing',
        '   - Policy and Process (10% weight):',
        '     * Error budget policy',
        '     * Review cadence',
        '     * Escalation procedures',
        '   - Baseline and Compliance (0% weight - informational):',
        '     * Baseline measured',
        '     * SLO compliance assessed',
        '2. Assess maturity level (basic, intermediate, advanced, expert)',
        '3. Identify strengths and gaps',
        '4. Provide overall verdict',
        '5. Generate recommendations',
        '6. Create maturity assessment report'
      ],
      outputFormat: 'JSON object with maturity score'
    },
    outputSchema: {
      type: 'object',
      required: ['sloMaturityScore', 'maturityLevel', 'verdict', 'summaryPath', 'artifacts'],
      properties: {
        sloMaturityScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            sliDefinition: { type: 'number' },
            sloTargets: { type: 'number' },
            errorBudgets: { type: 'number' },
            measurement: { type: 'number' },
            dashboards: { type: 'number' },
            alerting: { type: 'number' },
            policy: { type: 'number' },
            baseline: { type: 'number' }
          }
        },
        maturityLevel: { type: 'string', enum: ['basic', 'intermediate', 'advanced', 'expert'] },
        maturityDescription: { type: 'string' },
        verdict: { type: 'string' },
        strengths: { type: 'array', items: { type: 'string' } },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendation: { type: 'string' },
        nextSteps: { type: 'array', items: { type: 'string' } },
        summaryPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'slo-sli-tracking', 'scoring']
}));
