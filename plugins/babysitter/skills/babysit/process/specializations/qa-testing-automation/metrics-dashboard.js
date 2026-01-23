/**
 * @process specializations/qa-testing-automation/metrics-dashboard
 * @description Test Automation Metrics Dashboard - Build comprehensive quality metrics dashboard for tracking test execution,
 * coverage, flakiness, automation ROI, defect trends, and quality gates with real-time visualization, alerting, and reporting.
 * @inputs { projectName: string, testSources?: array, cicdPlatform?: string, metricsTools?: array, alertingConfig?: object }
 * @outputs { success: boolean, dashboardUrl: string, metricsCollected: array, alertsConfigured: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/qa-testing-automation/metrics-dashboard', {
 *   projectName: 'E-Commerce Platform',
 *   testSources: [
 *     { type: 'playwright', path: 'tests/e2e' },
 *     { type: 'jest', path: 'tests/unit' },
 *     { type: 'cypress', path: 'tests/integration' }
 *   ],
 *   cicdPlatform: 'GitHub Actions',
 *   metricsTools: ['Allure', 'Grafana', 'ReportPortal'],
 *   alertingConfig: {
 *     channels: ['slack', 'email'],
 *     thresholds: {
 *       passRate: 95,
 *       flakinessRate: 5,
 *       coverageMin: 80
 *     }
 *   }
 * });
 *
 * @references
 * - Test Metrics: https://martinfowler.com/articles/testing-culture.html
 * - Quality Dashboards: https://www.infoq.com/articles/quality-metrics-dashboard/
 * - Grafana Dashboards: https://grafana.com/docs/grafana/latest/dashboards/
 * - Allure Reports: https://docs.qameta.io/allure/
 * - Test Analytics: https://testing.googleblog.com/2020/08/code-coverage-best-practices.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    testSources = [],
    cicdPlatform = 'GitHub Actions',
    metricsTools = ['Allure', 'Grafana'],
    alertingConfig = {
      channels: ['slack'],
      thresholds: {
        passRate: 95,
        flakinessRate: 5,
        coverageMin: 80,
        avgDuration: 600
      }
    },
    historicalDataDays = 90,
    dashboardType = 'grafana', // 'grafana', 'custom-web', 'allure', 'reportportal'
    dataRetentionDays = 180,
    outputDir = 'qa-metrics-dashboard'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let metricsScore = 0;

  ctx.log('info', `Starting Test Automation Metrics Dashboard Setup: ${projectName}`);
  ctx.log('info', `Dashboard Type: ${dashboardType}, CI/CD: ${cicdPlatform}`);
  ctx.log('info', `Test Sources: ${testSources.length} configured`);

  // ============================================================================
  // PHASE 1: METRICS REQUIREMENTS AND KPI DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining metrics requirements and KPIs');

  const metricsRequirements = await ctx.task(metricsRequirementsTask, {
    projectName,
    testSources,
    alertingConfig,
    outputDir
  });

  artifacts.push(...metricsRequirements.artifacts);

  // Quality Gate: Comprehensive metrics coverage
  if (metricsRequirements.kpiCount < 15) {
    await ctx.breakpoint({
      question: `Phase 1: Only ${metricsRequirements.kpiCount} KPIs defined (recommended: 15+). Current categories: ${metricsRequirements.categories.join(', ')}. Add more metrics before proceeding?`,
      title: 'Metrics Requirements Review',
      context: {
        runId: ctx.runId,
        kpiCount: metricsRequirements.kpiCount,
        categories: metricsRequirements.categories,
        missingCategories: metricsRequirements.missingCategories,
        files: metricsRequirements.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 2: DATA SOURCES INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Integrating test result data sources');

  const dataSourceIntegration = await ctx.task(dataSourceIntegrationTask, {
    projectName,
    testSources,
    cicdPlatform,
    metricsRequirements,
    outputDir
  });

  artifacts.push(...dataSourceIntegration.artifacts);

  // Quality Gate: All test sources integrated
  if (dataSourceIntegration.integratedSources < testSources.length) {
    await ctx.breakpoint({
      question: `Phase 2: Only ${dataSourceIntegration.integratedSources}/${testSources.length} test sources integrated. Failed: ${dataSourceIntegration.failedSources.join(', ')}. Fix integration issues?`,
      title: 'Data Source Integration Issues',
      context: {
        runId: ctx.runId,
        integratedSources: dataSourceIntegration.integratedSources,
        failedSources: dataSourceIntegration.failedSources,
        integrationErrors: dataSourceIntegration.errors,
        files: dataSourceIntegration.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 3: DATA PIPELINE AND STORAGE SETUP
  // ============================================================================

  ctx.log('info', 'Phase 3: Setting up data pipeline and storage');

  const dataPipeline = await ctx.task(dataPipelineSetupTask, {
    projectName,
    dataSourceIntegration,
    metricsRequirements,
    dataRetentionDays,
    historicalDataDays,
    outputDir
  });

  artifacts.push(...dataPipeline.artifacts);

  // Quality Gate: Data pipeline operational
  if (!dataPipeline.pipelineOperational) {
    await ctx.breakpoint({
      question: `Phase 3: Data pipeline not operational. Issues: ${dataPipeline.issues.join(', ')}. Database: ${dataPipeline.databaseStatus}, ETL: ${dataPipeline.etlStatus}. Fix pipeline?`,
      title: 'Data Pipeline Issues',
      context: {
        runId: ctx.runId,
        pipelineOperational: dataPipeline.pipelineOperational,
        databaseStatus: dataPipeline.databaseStatus,
        etlStatus: dataPipeline.etlStatus,
        issues: dataPipeline.issues,
        files: dataPipeline.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 4: METRICS CALCULATION ENGINE
  // ============================================================================

  ctx.log('info', 'Phase 4: Building metrics calculation engine');

  const metricsEngine = await ctx.task(metricsCalculationEngineTask, {
    projectName,
    metricsRequirements,
    dataPipeline,
    outputDir
  });

  artifacts.push(...metricsEngine.artifacts);

  // ============================================================================
  // PHASE 5: DASHBOARD UI DESIGN AND LAYOUT
  // ============================================================================

  ctx.log('info', 'Phase 5: Designing dashboard UI and layout');

  const dashboardDesign = await ctx.task(dashboardDesignTask, {
    projectName,
    dashboardType,
    metricsRequirements,
    metricsEngine,
    outputDir
  });

  artifacts.push(...dashboardDesign.artifacts);

  // Quality Gate: Dashboard design review
  await ctx.breakpoint({
    question: `Phase 5 Complete: Dashboard designed with ${dashboardDesign.widgetCount} widgets across ${dashboardDesign.sections.length} sections. Layout: ${dashboardDesign.layout}. Approve design?`,
    title: 'Dashboard Design Review',
    context: {
      runId: ctx.runId,
      sections: dashboardDesign.sections,
      widgetCount: dashboardDesign.widgetCount,
      layout: dashboardDesign.layout,
      mockupPath: dashboardDesign.mockupPath,
      files: dashboardDesign.artifacts.map(a => ({ path: a.path, format: a.format || 'image' }))
    }
  });

  // ============================================================================
  // PHASE 6: PARALLEL DASHBOARD COMPONENTS IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Implementing dashboard components in parallel');

  // Execute dashboard component tasks in parallel
  const [
    executionMetricsResult,
    coverageMetricsResult,
    flakinessMetricsResult,
    performanceMetricsResult,
    qualityGatesResult,
    trendAnalysisResult
  ] = await ctx.parallel.all([
    () => ctx.task(executionMetricsWidgetTask, {
      projectName,
      metricsEngine,
      dashboardDesign,
      dashboardType,
      outputDir
    }),
    () => ctx.task(coverageMetricsWidgetTask, {
      projectName,
      metricsEngine,
      dashboardDesign,
      dashboardType,
      outputDir
    }),
    () => ctx.task(flakinessMetricsWidgetTask, {
      projectName,
      metricsEngine,
      dashboardDesign,
      dashboardType,
      outputDir
    }),
    () => ctx.task(performanceMetricsWidgetTask, {
      projectName,
      metricsEngine,
      dashboardDesign,
      dashboardType,
      outputDir
    }),
    () => ctx.task(qualityGatesWidgetTask, {
      projectName,
      metricsEngine,
      alertingConfig,
      dashboardDesign,
      dashboardType,
      outputDir
    }),
    () => ctx.task(trendAnalysisWidgetTask, {
      projectName,
      metricsEngine,
      historicalDataDays,
      dashboardDesign,
      dashboardType,
      outputDir
    })
  ]);

  artifacts.push(
    ...executionMetricsResult.artifacts,
    ...coverageMetricsResult.artifacts,
    ...flakinessMetricsResult.artifacts,
    ...performanceMetricsResult.artifacts,
    ...qualityGatesResult.artifacts,
    ...trendAnalysisResult.artifacts
  );

  ctx.log('info', `Dashboard widgets implemented: Execution, Coverage, Flakiness, Performance, Quality Gates, Trends`);

  // ============================================================================
  // PHASE 7: DEFECT METRICS AND ROI TRACKING
  // ============================================================================

  ctx.log('info', 'Phase 7: Implementing defect metrics and automation ROI tracking');

  const [
    defectMetricsResult,
    roiMetricsResult
  ] = await ctx.parallel.all([
    () => ctx.task(defectMetricsWidgetTask, {
      projectName,
      metricsEngine,
      dashboardDesign,
      dashboardType,
      outputDir
    }),
    () => ctx.task(automationROIWidgetTask, {
      projectName,
      metricsEngine,
      dashboardDesign,
      dashboardType,
      outputDir
    })
  ]);

  artifacts.push(...defectMetricsResult.artifacts, ...roiMetricsResult.artifacts);

  // ============================================================================
  // PHASE 8: ALERTING AND NOTIFICATION SYSTEM
  // ============================================================================

  ctx.log('info', 'Phase 8: Configuring alerting and notification system');

  const alertingSystem = await ctx.task(alertingSystemTask, {
    projectName,
    alertingConfig,
    metricsEngine,
    qualityGatesResult,
    outputDir
  });

  artifacts.push(...alertingSystem.artifacts);

  // Quality Gate: Alerting configured
  if (!alertingSystem.alertsConfigured) {
    await ctx.breakpoint({
      question: `Phase 8: Alerting not fully configured. ${alertingSystem.configuredChannels}/${alertingConfig.channels.length} channels configured. Fix alerting?`,
      title: 'Alerting Configuration Issues',
      context: {
        runId: ctx.runId,
        configuredChannels: alertingSystem.configuredChannels,
        failedChannels: alertingSystem.failedChannels,
        alertRulesCreated: alertingSystem.alertRulesCreated,
        files: alertingSystem.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 9: CI/CD INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Integrating dashboard with CI/CD pipeline');

  const cicdIntegration = await ctx.task(cicdDashboardIntegrationTask, {
    projectName,
    cicdPlatform,
    dataPipeline,
    metricsEngine,
    dashboardType,
    outputDir
  });

  artifacts.push(...cicdIntegration.artifacts);

  // ============================================================================
  // PHASE 10: DASHBOARD DEPLOYMENT
  // ============================================================================

  ctx.log('info', 'Phase 10: Deploying dashboard');

  const dashboardDeployment = await ctx.task(dashboardDeploymentTask, {
    projectName,
    dashboardType,
    dashboardDesign,
    executionMetricsResult,
    coverageMetricsResult,
    flakinessMetricsResult,
    performanceMetricsResult,
    qualityGatesResult,
    trendAnalysisResult,
    defectMetricsResult,
    roiMetricsResult,
    dataPipeline,
    cicdIntegration,
    outputDir
  });

  artifacts.push(...dashboardDeployment.artifacts);

  const dashboardUrl = dashboardDeployment.dashboardUrl;

  // Quality Gate: Dashboard accessible
  if (!dashboardDeployment.dashboardAccessible) {
    await ctx.breakpoint({
      question: `Phase 10: Dashboard deployed but not accessible. Deployment status: ${dashboardDeployment.status}. URL: ${dashboardUrl}. Debug deployment?`,
      title: 'Dashboard Deployment Issues',
      context: {
        runId: ctx.runId,
        dashboardUrl,
        deploymentStatus: dashboardDeployment.status,
        accessibilityIssues: dashboardDeployment.issues,
        files: dashboardDeployment.artifacts.map(a => ({ path: a.path, format: a.format || 'log' }))
      }
    });
  }

  // ============================================================================
  // PHASE 11: SAMPLE DATA POPULATION AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 11: Populating sample data and validating metrics');

  const dataValidation = await ctx.task(dataValidationTask, {
    projectName,
    dashboardUrl,
    metricsEngine,
    dataPipeline,
    dataSourceIntegration,
    outputDir
  });

  artifacts.push(...dataValidation.artifacts);

  // Quality Gate: Data accuracy validation
  if (dataValidation.accuracy < 95) {
    await ctx.breakpoint({
      question: `Phase 11: Data accuracy only ${dataValidation.accuracy}% (target: 95%+). Issues: ${dataValidation.accuracyIssues.join(', ')}. Fix data pipeline?`,
      title: 'Data Accuracy Issues',
      context: {
        runId: ctx.runId,
        accuracy: dataValidation.accuracy,
        accuracyIssues: dataValidation.accuracyIssues,
        sampleDataLoaded: dataValidation.sampleDataLoaded,
        files: dataValidation.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 12: DOCUMENTATION AND USER GUIDE
  // ============================================================================

  ctx.log('info', 'Phase 12: Creating documentation and user guide');

  const documentation = await ctx.task(dashboardDocumentationTask, {
    projectName,
    dashboardUrl,
    metricsRequirements,
    dashboardDesign,
    alertingSystem,
    cicdIntegration,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // ============================================================================
  // PHASE 13: DASHBOARD QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Phase 13: Scoring dashboard quality and completeness');

  const qualityAssessment = await ctx.task(dashboardQualityAssessmentTask, {
    projectName,
    metricsRequirements,
    dataSourceIntegration,
    dataPipeline,
    dashboardDeployment,
    dataValidation,
    alertingSystem,
    documentation,
    outputDir
  });

  metricsScore = qualityAssessment.overallScore;
  artifacts.push(...qualityAssessment.artifacts);

  ctx.log('info', `Dashboard Quality Score: ${metricsScore}/100`);

  // Quality Gate: Dashboard quality threshold
  const dashboardQualityMet = metricsScore >= 80;

  // ============================================================================
  // PHASE 14: USER ACCEPTANCE AND TRAINING
  // ============================================================================

  ctx.log('info', 'Phase 14: Conducting user acceptance and training');

  const userAcceptance = await ctx.task(userAcceptanceTask, {
    projectName,
    dashboardUrl,
    documentation,
    metricsRequirements,
    outputDir
  });

  artifacts.push(...userAcceptance.artifacts);

  // Final Breakpoint: Dashboard Review and Approval
  await ctx.breakpoint({
    question: `Test Automation Metrics Dashboard Complete for ${projectName}! Quality Score: ${metricsScore}/100. Dashboard URL: ${dashboardUrl}. ${dataSourceIntegration.integratedSources} data sources integrated, ${alertingSystem.alertRulesCreated} alert rules configured. Dashboard quality: ${dashboardQualityMet ? 'EXCELLENT' : 'ACCEPTABLE'}. Approve for production use?`,
    title: 'Dashboard Setup Complete - Final Approval',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        dashboardUrl,
        qualityScore: metricsScore,
        dashboardQualityMet,
        metricsCollected: metricsRequirements.kpiCount,
        dataSourcesIntegrated: dataSourceIntegration.integratedSources,
        alertsConfigured: alertingSystem.alertRulesCreated,
        dashboardType,
        dataAccuracy: dataValidation.accuracy,
        userAcceptancePassed: userAcceptance.passed
      },
      keyMetrics: metricsRequirements.keyMetrics,
      alertThresholds: alertingConfig.thresholds,
      nextSteps: userAcceptance.nextSteps,
      files: [
        { path: dashboardDeployment.dashboardConfigPath, format: 'json', label: 'Dashboard Configuration' },
        { path: documentation.userGuidePath, format: 'markdown', label: 'User Guide' },
        { path: documentation.metricsGlossaryPath, format: 'markdown', label: 'Metrics Glossary' },
        { path: qualityAssessment.assessmentReportPath, format: 'markdown', label: 'Quality Assessment' },
        { path: userAcceptance.trainingMaterialsPath, format: 'markdown', label: 'Training Materials' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: dashboardQualityMet && dataValidation.accuracy >= 90,
    projectName,
    dashboardUrl,
    dashboardType,
    qualityScore: metricsScore,
    dashboardQualityMet,
    metricsCollected: {
      categories: metricsRequirements.categories,
      kpiCount: metricsRequirements.kpiCount,
      keyMetrics: metricsRequirements.keyMetrics
    },
    dataSources: {
      total: testSources.length,
      integrated: dataSourceIntegration.integratedSources,
      failed: dataSourceIntegration.failedSources
    },
    dataPipeline: {
      operational: dataPipeline.pipelineOperational,
      database: dataPipeline.databaseType,
      etlFrequency: dataPipeline.etlFrequency,
      retentionDays: dataRetentionDays
    },
    dashboardComponents: {
      executionMetrics: executionMetricsResult.implemented,
      coverageMetrics: coverageMetricsResult.implemented,
      flakinessMetrics: flakinessMetricsResult.implemented,
      performanceMetrics: performanceMetricsResult.implemented,
      qualityGates: qualityGatesResult.implemented,
      trendAnalysis: trendAnalysisResult.implemented,
      defectMetrics: defectMetricsResult.implemented,
      automationROI: roiMetricsResult.implemented
    },
    alertsConfigured: {
      total: alertingSystem.alertRulesCreated,
      channels: alertingSystem.configuredChannels,
      thresholds: alertingConfig.thresholds
    },
    cicdIntegration: {
      platform: cicdPlatform,
      integrated: cicdIntegration.integrated,
      automatedReporting: cicdIntegration.automatedReporting
    },
    dataValidation: {
      accuracy: dataValidation.accuracy,
      sampleDataLoaded: dataValidation.sampleDataLoaded,
      validationPassed: dataValidation.validationPassed
    },
    documentation: {
      userGuideCreated: documentation.userGuideCreated,
      metricsGlossaryCreated: documentation.metricsGlossaryCreated,
      apiDocsCreated: documentation.apiDocsCreated
    },
    userAcceptance: {
      passed: userAcceptance.passed,
      trainingCompleted: userAcceptance.trainingCompleted,
      feedbackCollected: userAcceptance.feedbackCollected
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/qa-testing-automation/metrics-dashboard',
      timestamp: startTime,
      dashboardType,
      cicdPlatform,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: Metrics Requirements and KPI Definition
export const metricsRequirementsTask = defineTask('metrics-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Metrics Requirements Definition - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'QA Metrics and Analytics Architect',
      task: 'Define comprehensive quality metrics requirements and KPIs for test automation dashboard',
      context: {
        projectName: args.projectName,
        testSources: args.testSources,
        alertingConfig: args.alertingConfig,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define test execution metrics: pass rate, fail rate, skip rate, total tests',
        '2. Define test coverage metrics: code coverage (line, branch, function), critical path coverage',
        '3. Define flakiness metrics: flaky test count, flakiness rate, flaky test history',
        '4. Define performance metrics: average test duration, total suite duration, slowest tests',
        '5. Define quality gate metrics: gate pass/fail, gate violations, blocked releases',
        '6. Define defect metrics: defect density, defect leakage, defect detection rate, mean time to detect',
        '7. Define automation metrics: automation ratio, automation ROI, maintenance effort',
        '8. Define trend metrics: pass rate trend, coverage trend, duration trend, defect trend',
        '9. Define velocity metrics: test additions, test removals, test modifications',
        '10. Define environment metrics: test environment stability, build frequency',
        '11. Categorize metrics: execution, coverage, quality, performance, trends, defects, ROI',
        '12. Define calculation formulas for each metric',
        '13. Set target thresholds and alert conditions',
        '14. Create metrics requirements specification document',
        '15. Save requirements to output directory'
      ],
      outputFormat: 'JSON with metrics categories, KPIs, formulas, thresholds, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['kpiCount', 'categories', 'keyMetrics', 'missingCategories', 'artifacts'],
      properties: {
        kpiCount: { type: 'number', description: 'Total number of KPIs defined' },
        categories: {
          type: 'array',
          items: { type: 'string' },
          description: 'Metric categories defined'
        },
        keyMetrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              category: { type: 'string' },
              formula: { type: 'string' },
              unit: { type: 'string' },
              threshold: { type: 'object' },
              alertCondition: { type: 'string' }
            }
          }
        },
        missingCategories: {
          type: 'array',
          items: { type: 'string' },
          description: 'Recommended categories not yet defined'
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'qa-metrics', 'dashboard', 'requirements']
}));

// Phase 2: Data Source Integration
export const dataSourceIntegrationTask = defineTask('data-source-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Data Source Integration - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Test Data Integration Engineer',
      task: 'Integrate all test result data sources into metrics pipeline',
      context: {
        projectName: args.projectName,
        testSources: args.testSources,
        cicdPlatform: args.cicdPlatform,
        metricsRequirements: args.metricsRequirements,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify test result formats for each source (JUnit XML, Allure JSON, TAP, etc.)',
        '2. Create parsers for each test result format',
        '3. Extract test execution data: test name, status, duration, error message, stack trace',
        '4. Extract coverage data from coverage reports (Istanbul, nyc, Cobertura)',
        '5. Parse CI/CD build data: build number, timestamp, branch, commit hash',
        '6. Integrate with test frameworks: Jest, Playwright, Cypress, Mocha, pytest',
        '7. Create data collectors for each source',
        '8. Implement data normalization (standardize formats)',
        '9. Set up data validation and error handling',
        '10. Configure polling or webhook triggers for real-time updates',
        '11. Test integration with sample data from each source',
        '12. Document integration points and data schemas',
        '13. Create integration configuration files',
        '14. Return integration status and errors'
      ],
      outputFormat: 'JSON with integration status, parsers created, errors, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['integratedSources', 'failedSources', 'parsers', 'errors', 'artifacts'],
      properties: {
        integratedSources: { type: 'number' },
        failedSources: {
          type: 'array',
          items: { type: 'string' }
        },
        parsers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              source: { type: 'string' },
              format: { type: 'string' },
              parserPath: { type: 'string' },
              tested: { type: 'boolean' }
            }
          }
        },
        dataSchemas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              source: { type: 'string' },
              schema: { type: 'object' }
            }
          }
        },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              source: { type: 'string' },
              error: { type: 'string' }
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
  labels: ['agent', 'qa-metrics', 'dashboard', 'integration']
}));

// Phase 3: Data Pipeline and Storage Setup
export const dataPipelineSetupTask = defineTask('data-pipeline-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Data Pipeline Setup - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Pipeline Engineer',
      task: 'Set up data pipeline and storage for metrics data',
      context: {
        projectName: args.projectName,
        dataSourceIntegration: args.dataSourceIntegration,
        metricsRequirements: args.metricsRequirements,
        dataRetentionDays: args.dataRetentionDays,
        historicalDataDays: args.historicalDataDays,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Choose storage solution: PostgreSQL, InfluxDB, TimescaleDB, or Elasticsearch',
        '2. Design database schema for test results, metrics, and time-series data',
        '3. Create tables/collections: test_runs, test_cases, coverage_data, metrics_snapshots',
        '4. Set up ETL pipeline: Extract (from sources) → Transform (normalize) → Load (to DB)',
        '5. Implement data aggregation queries for metrics calculation',
        '6. Configure data retention policies (archive old data after retention period)',
        '7. Set up incremental data loading (avoid reprocessing)',
        '8. Create indexes for query performance',
        '9. Implement data backup and recovery',
        '10. Set up data validation checks',
        '11. Configure ETL scheduling (real-time, hourly, daily)',
        '12. Test pipeline with sample data',
        '13. Monitor pipeline health and performance',
        '14. Document database schema and ETL logic'
      ],
      outputFormat: 'JSON with pipeline status, database config, ETL jobs, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['pipelineOperational', 'databaseStatus', 'etlStatus', 'issues', 'artifacts'],
      properties: {
        pipelineOperational: { type: 'boolean' },
        databaseType: { type: 'string' },
        databaseStatus: { type: 'string', enum: ['connected', 'error', 'not-configured'] },
        databaseSchema: {
          type: 'object',
          properties: {
            tables: { type: 'array', items: { type: 'string' } },
            indexes: { type: 'array', items: { type: 'string' } }
          }
        },
        etlStatus: { type: 'string', enum: ['operational', 'partial', 'failed'] },
        etlFrequency: { type: 'string', description: 'real-time, hourly, daily' },
        etlJobs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              schedule: { type: 'string' },
              status: { type: 'string' }
            }
          }
        },
        retentionPolicyConfigured: { type: 'boolean' },
        issues: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'qa-metrics', 'dashboard', 'data-pipeline']
}));

// Phase 4: Metrics Calculation Engine
export const metricsCalculationEngineTask = defineTask('metrics-calculation-engine', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Metrics Calculation Engine - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Metrics Engineering Specialist',
      task: 'Build metrics calculation engine with aggregation and computation logic',
      context: {
        projectName: args.projectName,
        metricsRequirements: args.metricsRequirements,
        dataPipeline: args.dataPipeline,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Implement calculation functions for each metric from requirements',
        '2. Pass Rate = (passed tests / total tests) * 100',
        '3. Flakiness Rate = (flaky tests / total tests) * 100',
        '4. Defect Leakage = (production defects / total defects) * 100',
        '5. Automation ROI = (time saved - automation cost) / automation cost',
        '6. Mean Time To Detect (MTTD) = average time between defect injection and detection',
        '7. Test Execution Trend = time-series aggregation of pass rates',
        '8. Coverage Trend = time-series aggregation of code coverage',
        '9. Implement aggregation queries (daily, weekly, monthly rollups)',
        '10. Create metric snapshot scheduler (capture metrics at intervals)',
        '11. Implement metric comparison (current vs previous, current vs target)',
        '12. Add metric forecasting (trend projection)',
        '13. Create API endpoints for metric retrieval',
        '14. Optimize query performance with caching',
        '15. Test calculation accuracy with known data',
        '16. Document calculation logic and formulas'
      ],
      outputFormat: 'JSON with calculation functions, API endpoints, accuracy validation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['functionsImplemented', 'apiEndpoints', 'calculationAccuracy', 'artifacts'],
      properties: {
        functionsImplemented: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metricName: { type: 'string' },
              functionPath: { type: 'string' },
              formula: { type: 'string' },
              tested: { type: 'boolean' }
            }
          }
        },
        apiEndpoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              endpoint: { type: 'string' },
              method: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        cachingEnabled: { type: 'boolean' },
        calculationAccuracy: { type: 'number', minimum: 0, maximum: 100 },
        performanceOptimized: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'qa-metrics', 'dashboard', 'calculations']
}));

// Phase 5: Dashboard Design
export const dashboardDesignTask = defineTask('dashboard-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Dashboard UI Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'UI/UX Designer specializing in data visualization',
      task: 'Design comprehensive dashboard UI with effective data visualizations',
      context: {
        projectName: args.projectName,
        dashboardType: args.dashboardType,
        metricsRequirements: args.metricsRequirements,
        metricsEngine: args.metricsEngine,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design dashboard layout with logical sections',
        '2. Section 1: Executive Summary (KPIs, overall health, quality score)',
        '3. Section 2: Test Execution Metrics (pass/fail/skip rates, trend charts)',
        '4. Section 3: Code Coverage Metrics (overall coverage, coverage heatmap)',
        '5. Section 4: Flakiness Analysis (flaky test list, flakiness trend)',
        '6. Section 5: Performance Metrics (average duration, slowest tests)',
        '7. Section 6: Quality Gates (gate status, violations, blocked releases)',
        '8. Section 7: Defect Metrics (defect density, leakage, MTTD)',
        '9. Section 8: Automation ROI (time saved, cost analysis)',
        '10. Section 9: Trend Analysis (historical trends, forecasts)',
        '11. Choose visualization types: line charts, bar charts, pie charts, heatmaps, gauges',
        '12. Design color scheme for pass/fail/warning states',
        '13. Add drill-down capabilities (click chart to see details)',
        '14. Design responsive layout (desktop, tablet, mobile)',
        '15. Create mockups and wireframes',
        '16. Document widget specifications'
      ],
      outputFormat: 'JSON with dashboard layout, sections, widgets, mockup path, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['sections', 'widgetCount', 'layout', 'mockupPath', 'artifacts'],
      properties: {
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              widgets: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    widgetType: { type: 'string' },
                    metricName: { type: 'string' },
                    visualizationType: { type: 'string' },
                    size: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        widgetCount: { type: 'number' },
        layout: { type: 'string', description: 'grid, masonry, responsive' },
        colorScheme: {
          type: 'object',
          properties: {
            pass: { type: 'string' },
            fail: { type: 'string' },
            warning: { type: 'string' },
            neutral: { type: 'string' }
          }
        },
        mockupPath: { type: 'string' },
        responsive: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'qa-metrics', 'dashboard', 'design', 'ux']
}));

// Phase 6.1: Execution Metrics Widget
export const executionMetricsWidgetTask = defineTask('execution-metrics-widget', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Test Execution Metrics Widget - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Dashboard Developer',
      task: 'Implement test execution metrics widget with visualizations',
      context: {
        projectName: args.projectName,
        metricsEngine: args.metricsEngine,
        dashboardDesign: args.dashboardDesign,
        dashboardType: args.dashboardType,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create pass/fail/skip rate gauge charts',
        '2. Add total test count display',
        '3. Create test execution trend line chart (last 30 days)',
        '4. Add test suite duration bar chart',
        '5. Display recent test runs table',
        '6. Add pass rate comparison (current vs previous)',
        '7. Implement color coding (green: pass, red: fail, yellow: skip)',
        '8. Add tooltips with detailed information',
        '9. Implement drill-down to failed test details',
        '10. Configure auto-refresh interval',
        '11. Add export functionality (CSV, PDF)',
        '12. Test widget with real data',
        '13. Optimize rendering performance',
        '14. Document widget configuration'
      ],
      outputFormat: 'JSON with widget implementation status, features, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['implemented', 'visualizations', 'features', 'artifacts'],
      properties: {
        implemented: { type: 'boolean' },
        visualizations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              metric: { type: 'string' },
              interactive: { type: 'boolean' }
            }
          }
        },
        features: {
          type: 'array',
          items: { type: 'string' }
        },
        widgetPath: { type: 'string' },
        tested: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'qa-metrics', 'dashboard', 'execution-metrics']
}));

// Phase 6.2: Coverage Metrics Widget
export const coverageMetricsWidgetTask = defineTask('coverage-metrics-widget', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Code Coverage Metrics Widget - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Dashboard Developer',
      task: 'Implement code coverage metrics widget with visualizations',
      context: {
        projectName: args.projectName,
        metricsEngine: args.metricsEngine,
        dashboardDesign: args.dashboardDesign,
        dashboardType: args.dashboardType,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create overall coverage percentage gauge',
        '2. Add line, branch, function coverage breakdowns',
        '3. Create coverage heatmap by module/component',
        '4. Add coverage trend line chart',
        '5. Display low-coverage files table (below threshold)',
        '6. Add coverage delta (current vs previous)',
        '7. Implement color-coded coverage zones (red: <50%, yellow: 50-80%, green: >80%)',
        '8. Add drill-down to file-level coverage reports',
        '9. Display critical path coverage separately',
        '10. Configure coverage thresholds and warnings',
        '11. Test widget with coverage data',
        '12. Document coverage calculation methods'
      ],
      outputFormat: 'JSON with widget implementation status, visualizations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['implemented', 'coverageTypes', 'visualizations', 'artifacts'],
      properties: {
        implemented: { type: 'boolean' },
        coverageTypes: {
          type: 'array',
          items: { type: 'string' },
          description: 'line, branch, function, statement'
        },
        visualizations: {
          type: 'array',
          items: { type: 'string' }
        },
        thresholdsConfigured: { type: 'boolean' },
        heatmapEnabled: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'qa-metrics', 'dashboard', 'coverage-metrics']
}));

// Phase 6.3: Flakiness Metrics Widget
export const flakinessMetricsWidgetTask = defineTask('flakiness-metrics-widget', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Test Flakiness Metrics Widget - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Dashboard Developer',
      task: 'Implement test flakiness tracking and analysis widget',
      context: {
        projectName: args.projectName,
        metricsEngine: args.metricsEngine,
        dashboardDesign: args.dashboardDesign,
        dashboardType: args.dashboardType,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Calculate flakiness: test passes sometimes, fails sometimes (intermittent)',
        '2. Create flakiness rate gauge (flaky tests / total tests)',
        '3. Display top 10 flaky tests table with failure rates',
        '4. Add flakiness trend over time',
        '5. Show flaky test history (pass/fail pattern)',
        '6. Calculate flaky test impact (time wasted on re-runs)',
        '7. Add flaky test annotations (known issues, tickets)',
        '8. Implement quarantine status tracking',
        '9. Color code by severity (red: >20% flaky, yellow: 5-20%, green: <5%)',
        '10. Add drill-down to flaky test execution logs',
        '11. Test flakiness detection algorithm',
        '12. Document flakiness criteria'
      ],
      outputFormat: 'JSON with widget implementation, flakiness detection, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['implemented', 'detectionAlgorithm', 'features', 'artifacts'],
      properties: {
        implemented: { type: 'boolean' },
        detectionAlgorithm: { type: 'string', description: 'How flakiness is detected' },
        features: {
          type: 'array',
          items: { type: 'string' }
        },
        quarantineSupport: { type: 'boolean' },
        impactCalculation: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'qa-metrics', 'dashboard', 'flakiness']
}));

// Phase 6.4: Performance Metrics Widget
export const performanceMetricsWidgetTask = defineTask('performance-metrics-widget', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Test Performance Metrics Widget - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Dashboard Developer',
      task: 'Implement test execution performance metrics widget',
      context: {
        projectName: args.projectName,
        metricsEngine: args.metricsEngine,
        dashboardDesign: args.dashboardDesign,
        dashboardType: args.dashboardType,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Display average test suite duration',
        '2. Create duration trend chart (over time)',
        '3. Show top 10 slowest tests table',
        '4. Add test duration distribution histogram',
        '5. Calculate and display duration percentiles (p50, p95, p99)',
        '6. Add performance regression detection (tests getting slower)',
        '7. Display parallel execution metrics (if applicable)',
        '8. Show resource utilization (CPU, memory) if available',
        '9. Add duration comparison (current vs baseline)',
        '10. Implement slow test alerts (exceeding thresholds)',
        '11. Test performance data collection',
        '12. Document performance thresholds'
      ],
      outputFormat: 'JSON with widget implementation, metrics tracked, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['implemented', 'metricsTracked', 'features', 'artifacts'],
      properties: {
        implemented: { type: 'boolean' },
        metricsTracked: {
          type: 'array',
          items: { type: 'string' }
        },
        features: {
          type: 'array',
          items: { type: 'string' }
        },
        regressionDetection: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'qa-metrics', 'dashboard', 'performance']
}));

// Phase 6.5: Quality Gates Widget
export const qualityGatesWidgetTask = defineTask('quality-gates-widget', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Quality Gates Metrics Widget - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Dashboard Developer',
      task: 'Implement quality gates tracking and violation monitoring widget',
      context: {
        projectName: args.projectName,
        metricsEngine: args.metricsEngine,
        alertingConfig: args.alertingConfig,
        dashboardDesign: args.dashboardDesign,
        dashboardType: args.dashboardType,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Display quality gate status: PASSED, FAILED, WARNING',
        '2. List all quality gate rules with pass/fail status',
        '3. Show gate violations: which rules failed and by how much',
        '4. Create gate pass rate trend',
        '5. Display blocked releases/deployments due to gate failures',
        '6. Add gate violation history',
        '7. Show gate rules: pass rate >= 95%, coverage >= 80%, flakiness <= 5%',
        '8. Implement configurable gate thresholds from alertingConfig',
        '9. Add gate override tracking (who, when, why)',
        '10. Color code by severity (red: gate failed, yellow: warning, green: passed)',
        '11. Test gate evaluation logic',
        '12. Document gate definitions and thresholds'
      ],
      outputFormat: 'JSON with widget implementation, gate rules, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['implemented', 'gateRules', 'features', 'artifacts'],
      properties: {
        implemented: { type: 'boolean' },
        gateRules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rule: { type: 'string' },
              threshold: { type: 'number' },
              operator: { type: 'string' }
            }
          }
        },
        features: {
          type: 'array',
          items: { type: 'string' }
        },
        overrideTracking: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'qa-metrics', 'dashboard', 'quality-gates']
}));

// Phase 6.6: Trend Analysis Widget
export const trendAnalysisWidgetTask = defineTask('trend-analysis-widget', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Trend Analysis Widget - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Dashboard Developer and Data Analyst',
      task: 'Implement historical trend analysis and forecasting widget',
      context: {
        projectName: args.projectName,
        metricsEngine: args.metricsEngine,
        historicalDataDays: args.historicalDataDays,
        dashboardDesign: args.dashboardDesign,
        dashboardType: args.dashboardType,
        outputDir: args.outputDir
      },
      instructions: [
        `1. Create multi-line trend chart for key metrics over ${args.historicalDataDays} days`,
        '2. Show pass rate trend, coverage trend, flakiness trend',
        '3. Add moving averages (7-day, 30-day) to smooth trends',
        '4. Implement trend direction indicators (up/down arrows, percentage change)',
        '5. Add anomaly detection (highlight unusual data points)',
        '6. Create time range selector (last 7 days, 30 days, 90 days, custom)',
        '7. Add comparison mode (compare current period vs previous period)',
        '8. Implement simple forecasting (linear projection)',
        '9. Show improvement/regression highlights',
        '10. Add trend annotations (releases, incidents, changes)',
        '11. Test trend calculations with historical data',
        '12. Document trend analysis methods'
      ],
      outputFormat: 'JSON with widget implementation, trends tracked, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['implemented', 'trendsTracked', 'features', 'artifacts'],
      properties: {
        implemented: { type: 'boolean' },
        trendsTracked: {
          type: 'array',
          items: { type: 'string' }
        },
        features: {
          type: 'array',
          items: { type: 'string' }
        },
        anomalyDetection: { type: 'boolean' },
        forecasting: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'qa-metrics', 'dashboard', 'trends', 'analytics']
}));

// Phase 7.1: Defect Metrics Widget
export const defectMetricsWidgetTask = defineTask('defect-metrics-widget', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Defect Metrics Widget - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Dashboard Developer and Quality Analyst',
      task: 'Implement defect tracking and quality metrics widget',
      context: {
        projectName: args.projectName,
        metricsEngine: args.metricsEngine,
        dashboardDesign: args.dashboardDesign,
        dashboardType: args.dashboardType,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Calculate defect density: defects per 1000 lines of code',
        '2. Calculate defect leakage: production defects / total defects',
        '3. Calculate defect detection rate: tests detecting defects / total defects',
        '4. Display mean time to detect (MTTD): avg time between injection and detection',
        '5. Show defect trend: defects found over time',
        '6. Create defect severity distribution (critical, high, medium, low)',
        '7. Add defect source breakdown (unit tests, integration, E2E, production)',
        '8. Display defect resolution time metrics',
        '9. Show defect escape rate (defects escaping to next phase)',
        '10. Add defect prevention metrics (code reviews, static analysis)',
        '11. Integrate with issue trackers (Jira, GitHub Issues) if available',
        '12. Test defect data collection and calculations'
      ],
      outputFormat: 'JSON with widget implementation, defect metrics, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['implemented', 'defectMetrics', 'features', 'artifacts'],
      properties: {
        implemented: { type: 'boolean' },
        defectMetrics: {
          type: 'array',
          items: { type: 'string' }
        },
        features: {
          type: 'array',
          items: { type: 'string' }
        },
        issueTrackerIntegration: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'qa-metrics', 'dashboard', 'defects', 'quality']
}));

// Phase 7.2: Automation ROI Widget
export const automationROIWidgetTask = defineTask('automation-roi-widget', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Test Automation ROI Widget - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Dashboard Developer and Business Analyst',
      task: 'Implement test automation ROI and cost-benefit analysis widget',
      context: {
        projectName: args.projectName,
        metricsEngine: args.metricsEngine,
        dashboardDesign: args.dashboardDesign,
        dashboardType: args.dashboardType,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Calculate automation ratio: automated tests / total tests',
        '2. Calculate time saved: (manual execution time - automated execution time) * run frequency',
        '3. Calculate automation cost: development + maintenance + infrastructure',
        '4. Calculate ROI: (time saved - automation cost) / automation cost * 100',
        '5. Display break-even point: when ROI becomes positive',
        '6. Show automation coverage by test type (unit, integration, E2E)',
        '7. Add automation trend: automation ratio over time',
        '8. Display maintenance effort: time spent maintaining automated tests',
        '9. Show test execution frequency and volume',
        '10. Calculate cost per test run',
        '11. Add automation health score (stability, maintainability, coverage)',
        '12. Document ROI calculation assumptions and formulas'
      ],
      outputFormat: 'JSON with widget implementation, ROI metrics, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['implemented', 'roiMetrics', 'features', 'artifacts'],
      properties: {
        implemented: { type: 'boolean' },
        roiMetrics: {
          type: 'array',
          items: { type: 'string' }
        },
        features: {
          type: 'array',
          items: { type: 'string' }
        },
        roiCalculated: { type: 'boolean' },
        breakEvenAnalysis: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'qa-metrics', 'dashboard', 'roi', 'business-value']
}));

// Phase 8: Alerting and Notification System
export const alertingSystemTask = defineTask('alerting-system', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Alerting and Notification System - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DevOps Engineer specializing in monitoring and alerting',
      task: 'Configure comprehensive alerting and notification system for quality metrics',
      context: {
        projectName: args.projectName,
        alertingConfig: args.alertingConfig,
        metricsEngine: args.metricsEngine,
        qualityGatesResult: args.qualityGatesResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Set up alert rules for each threshold from alertingConfig',
        '2. Create alert: Pass rate < 95% → send notification',
        '3. Create alert: Flakiness rate > 5% → send notification',
        '4. Create alert: Coverage < 80% → send notification',
        '5. Create alert: Average duration > 600s → send notification',
        '6. Create alert: Quality gate failed → send notification',
        '7. Configure Slack integration for real-time alerts',
        '8. Configure email notifications for daily/weekly summaries',
        '9. Add alert severity levels (critical, warning, info)',
        '10. Implement alert deduplication (avoid spam)',
        '11. Add alert silencing/snoozing capabilities',
        '12. Create alert dashboard showing active alerts',
        '13. Configure alert escalation policies',
        '14. Test alerting with simulated threshold breaches',
        '15. Document alerting configuration and channels'
      ],
      outputFormat: 'JSON with alert configuration, channels, rules, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['alertsConfigured', 'configuredChannels', 'alertRulesCreated', 'failedChannels', 'artifacts'],
      properties: {
        alertsConfigured: { type: 'boolean' },
        configuredChannels: { type: 'number' },
        failedChannels: {
          type: 'array',
          items: { type: 'string' }
        },
        alertRulesCreated: { type: 'number' },
        alertRules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              condition: { type: 'string' },
              threshold: { type: 'number' },
              severity: { type: 'string' },
              channels: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        deduplicationEnabled: { type: 'boolean' },
        escalationConfigured: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'qa-metrics', 'dashboard', 'alerting', 'notifications']
}));

// Phase 9: CI/CD Dashboard Integration
export const cicdDashboardIntegrationTask = defineTask('cicd-dashboard-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: CI/CD Integration - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DevOps CI/CD Engineer',
      task: 'Integrate metrics dashboard with CI/CD pipeline for automated reporting',
      context: {
        projectName: args.projectName,
        cicdPlatform: args.cicdPlatform,
        dataPipeline: args.dataPipeline,
        metricsEngine: args.metricsEngine,
        dashboardType: args.dashboardType,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Add pipeline step to publish test results to metrics database',
        '2. Configure automatic metrics upload after test execution',
        '3. Add build metadata: build number, branch, commit, timestamp',
        '4. Create pipeline badge showing current quality gate status',
        '5. Add PR comments with test metrics summary',
        '6. Configure dashboard link in CI/CD notifications',
        '7. Set up automated daily/weekly metrics reports',
        '8. Add metrics collection to deployment pipeline',
        '9. Configure dashboard API authentication for CI/CD',
        '10. Test metrics flow from pipeline to dashboard',
        '11. Document CI/CD integration steps',
        '12. Create integration examples for common pipelines'
      ],
      outputFormat: 'JSON with integration status, pipeline config, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['integrated', 'automatedReporting', 'features', 'artifacts'],
      properties: {
        integrated: { type: 'boolean' },
        pipelineStepsAdded: {
          type: 'array',
          items: { type: 'string' }
        },
        automatedReporting: { type: 'boolean' },
        features: {
          type: 'array',
          items: { type: 'string' }
        },
        badgeUrl: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'qa-metrics', 'dashboard', 'cicd', 'integration']
}));

// Phase 10: Dashboard Deployment
export const dashboardDeploymentTask = defineTask('dashboard-deployment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Dashboard Deployment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DevOps Deployment Engineer',
      task: 'Deploy metrics dashboard to production environment',
      context: {
        projectName: args.projectName,
        dashboardType: args.dashboardType,
        dashboardDesign: args.dashboardDesign,
        executionMetricsResult: args.executionMetricsResult,
        coverageMetricsResult: args.coverageMetricsResult,
        flakinessMetricsResult: args.flakinessMetricsResult,
        performanceMetricsResult: args.performanceMetricsResult,
        qualityGatesResult: args.qualityGatesResult,
        trendAnalysisResult: args.trendAnalysisResult,
        defectMetricsResult: args.defectMetricsResult,
        roiMetricsResult: args.roiMetricsResult,
        dataPipeline: args.dataPipeline,
        cicdIntegration: args.cicdIntegration,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Package dashboard application and dependencies',
        '2. Configure production environment (database connections, API keys)',
        '3. Set up web server (Nginx, Apache) or container (Docker)',
        '4. Deploy dashboard to hosting platform (AWS, Azure, self-hosted)',
        '5. Configure SSL/TLS certificates for HTTPS',
        '6. Set up authentication and authorization (SSO, RBAC)',
        '7. Configure firewall rules and network access',
        '8. Set up automated backups for dashboard configuration',
        '9. Configure logging and monitoring for dashboard itself',
        '10. Test dashboard accessibility from different networks',
        '11. Verify all widgets load correctly with real data',
        '12. Set up dashboard health checks',
        '13. Document deployment architecture and configuration',
        '14. Create rollback plan'
      ],
      outputFormat: 'JSON with deployment status, dashboard URL, accessibility check, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['dashboardAccessible', 'dashboardUrl', 'status', 'issues', 'artifacts'],
      properties: {
        dashboardAccessible: { type: 'boolean' },
        dashboardUrl: { type: 'string' },
        status: { type: 'string', enum: ['deployed', 'partial', 'failed'] },
        deploymentPlatform: { type: 'string' },
        authenticationEnabled: { type: 'boolean' },
        sslConfigured: { type: 'boolean' },
        healthCheckUrl: { type: 'string' },
        dashboardConfigPath: { type: 'string' },
        issues: {
          type: 'array',
          items: { type: 'string' }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'qa-metrics', 'dashboard', 'deployment', 'devops']
}));

// Phase 11: Data Validation
export const dataValidationTask = defineTask('data-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Data Validation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Quality Assurance Data Analyst',
      task: 'Validate metrics data accuracy and dashboard correctness',
      context: {
        projectName: args.projectName,
        dashboardUrl: args.dashboardUrl,
        metricsEngine: args.metricsEngine,
        dataPipeline: args.dataPipeline,
        dataSourceIntegration: args.dataSourceIntegration,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Load sample test result data into system',
        '2. Verify test results are correctly parsed from all sources',
        '3. Check metric calculations against expected values',
        '4. Validate pass rate calculation: manually count vs dashboard display',
        '5. Validate coverage calculation: source data vs dashboard display',
        '6. Verify trend charts show correct historical data',
        '7. Test data refresh: run new tests, verify dashboard updates',
        '8. Check for data anomalies or outliers',
        '9. Validate timestamp accuracy and timezone handling',
        '10. Verify drill-down functionality shows correct detailed data',
        '11. Test dashboard with edge cases (zero tests, all failed, missing data)',
        '12. Calculate data accuracy percentage',
        '13. Document validation results and any discrepancies'
      ],
      outputFormat: 'JSON with validation results, accuracy percentage, issues, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['validationPassed', 'accuracy', 'sampleDataLoaded', 'accuracyIssues', 'artifacts'],
      properties: {
        validationPassed: { type: 'boolean' },
        accuracy: { type: 'number', minimum: 0, maximum: 100 },
        sampleDataLoaded: { type: 'boolean' },
        metricsValidated: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              expected: { type: 'number' },
              actual: { type: 'number' },
              match: { type: 'boolean' }
            }
          }
        },
        accuracyIssues: {
          type: 'array',
          items: { type: 'string' }
        },
        edgeCasesTested: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'qa-metrics', 'dashboard', 'validation', 'data-quality']
}));

// Phase 12: Dashboard Documentation
export const dashboardDocumentationTask = defineTask('dashboard-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Dashboard Documentation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Writer specializing in data visualization',
      task: 'Create comprehensive dashboard documentation and user guide',
      context: {
        projectName: args.projectName,
        dashboardUrl: args.dashboardUrl,
        metricsRequirements: args.metricsRequirements,
        dashboardDesign: args.dashboardDesign,
        alertingSystem: args.alertingSystem,
        cicdIntegration: args.cicdIntegration,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create user guide: how to access and navigate dashboard',
        '2. Document each widget: what it shows, how to interpret it',
        '3. Create metrics glossary: definitions and calculation formulas',
        '4. Explain quality thresholds and alert conditions',
        '5. Document drill-down capabilities and how to use them',
        '6. Explain trend analysis and forecasting features',
        '7. Document alerting channels and configuration',
        '8. Create troubleshooting guide for common issues',
        '9. Document API endpoints for programmatic access',
        '10. Add screenshot examples for each major feature',
        '11. Create FAQ section based on common questions',
        '12. Document best practices for using metrics',
        '13. Add integration guide for CI/CD platforms',
        '14. Create quick start guide for new users',
        '15. Document maintenance and update procedures'
      ],
      outputFormat: 'JSON with documentation paths, completeness status, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['userGuideCreated', 'metricsGlossaryCreated', 'userGuidePath', 'metricsGlossaryPath', 'artifacts'],
      properties: {
        userGuideCreated: { type: 'boolean' },
        userGuidePath: { type: 'string' },
        metricsGlossaryCreated: { type: 'boolean' },
        metricsGlossaryPath: { type: 'string' },
        apiDocsCreated: { type: 'boolean' },
        apiDocsPath: { type: 'string' },
        troubleshootingGuideCreated: { type: 'boolean' },
        faqCreated: { type: 'boolean' },
        screenshotsIncluded: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'qa-metrics', 'dashboard', 'documentation']
}));

// Phase 13: Dashboard Quality Assessment
export const dashboardQualityAssessmentTask = defineTask('dashboard-quality-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 13: Dashboard Quality Assessment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior QA Architect and Dashboard Auditor',
      task: 'Assess overall dashboard quality, completeness, and effectiveness',
      context: {
        projectName: args.projectName,
        metricsRequirements: args.metricsRequirements,
        dataSourceIntegration: args.dataSourceIntegration,
        dataPipeline: args.dataPipeline,
        dashboardDeployment: args.dashboardDeployment,
        dataValidation: args.dataValidation,
        alertingSystem: args.alertingSystem,
        documentation: args.documentation,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Evaluate metrics coverage: are all key metrics included? (weight: 20%)',
        '2. Assess data accuracy: validation results and data quality (weight: 25%)',
        '3. Evaluate visualization effectiveness: clarity, usability, design (weight: 15%)',
        '4. Assess alerting completeness: all critical thresholds covered? (weight: 15%)',
        '5. Evaluate performance: dashboard load time, query performance (weight: 10%)',
        '6. Assess documentation quality: completeness, clarity, examples (weight: 10%)',
        '7. Evaluate user experience: ease of use, navigation, accessibility (weight: 5%)',
        '8. Calculate weighted overall score (0-100)',
        '9. Identify gaps and missing features',
        '10. Provide specific recommendations for improvement',
        '11. Assess production readiness',
        '12. Generate comprehensive assessment report'
      ],
      outputFormat: 'JSON with overall score, component scores, recommendations, report path, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'recommendations', 'assessmentReportPath', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            metricsCoverage: { type: 'number' },
            dataAccuracy: { type: 'number' },
            visualizationEffectiveness: { type: 'number' },
            alertingCompleteness: { type: 'number' },
            performance: { type: 'number' },
            documentation: { type: 'number' },
            userExperience: { type: 'number' }
          }
        },
        gaps: {
          type: 'array',
          items: { type: 'string' }
        },
        recommendations: {
          type: 'array',
          items: { type: 'string' }
        },
        productionReady: { type: 'boolean' },
        assessmentReportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'qa-metrics', 'dashboard', 'quality-assessment', 'validation']
}));

// Phase 14: User Acceptance and Training
export const userAcceptanceTask = defineTask('user-acceptance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 14: User Acceptance and Training - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'QA Team Lead and Training Facilitator',
      task: 'Conduct user acceptance testing and team training for dashboard',
      context: {
        projectName: args.projectName,
        dashboardUrl: args.dashboardUrl,
        documentation: args.documentation,
        metricsRequirements: args.metricsRequirements,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create user acceptance test plan',
        '2. Identify key user personas: QA engineers, developers, managers, executives',
        '3. Conduct UAT sessions with representatives from each persona',
        '4. Test dashboard usability: can users find information they need?',
        '5. Test dashboard accuracy: do metrics match expectations?',
        '6. Collect feedback on missing features or improvements',
        '7. Create training materials: slides, videos, demos',
        '8. Conduct training sessions for QA team',
        '9. Create quick reference cards for common tasks',
        '10. Set up feedback channel for ongoing improvements',
        '11. Document user feedback and action items',
        '12. Create dashboard adoption plan',
        '13. Define success metrics for dashboard adoption',
        '14. Schedule follow-up training and support sessions'
      ],
      outputFormat: 'JSON with UAT results, training completion, feedback, next steps, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'trainingCompleted', 'feedbackCollected', 'nextSteps', 'trainingMaterialsPath', 'artifacts'],
      properties: {
        passed: { type: 'boolean' },
        uatSessions: { type: 'number' },
        participantCount: { type: 'number' },
        trainingCompleted: { type: 'boolean' },
        trainingMaterialsPath: { type: 'string' },
        feedbackCollected: { type: 'boolean' },
        userFeedback: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              persona: { type: 'string' },
              feedback: { type: 'string' },
              rating: { type: 'number' },
              suggestions: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        nextSteps: {
          type: 'array',
          items: { type: 'string' }
        },
        adoptionPlan: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'qa-metrics', 'dashboard', 'user-acceptance', 'training']
}));
