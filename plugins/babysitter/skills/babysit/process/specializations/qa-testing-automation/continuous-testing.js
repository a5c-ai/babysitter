/**
 * @process specializations/qa-testing-automation/continuous-testing
 * @description Continuous Testing Pipeline - Implement automated continuous testing across the entire software delivery lifecycle,
 * integrating tests at every stage from commit to production with quality gates, parallel execution, fast feedback loops,
 * and comprehensive test orchestration for shift-left and shift-right testing practices.
 * @inputs { projectPath: string, repositoryUrl: string, cicdPlatform?: string, testStrategy?: object, qualityGates?: object }
 * @outputs { success: boolean, pipelineConfig: object, testMetrics: object, integrationStatus: object, continuousTestingScore: number }
 *
 * @example
 * const result = await orchestrate('specializations/qa-testing-automation/continuous-testing', {
 *   projectPath: '/path/to/project',
 *   repositoryUrl: 'https://github.com/org/repo',
 *   cicdPlatform: 'github-actions',
 *   testStrategy: {
 *     unit: { enabled: true, threshold: 80, timeout: 300 },
 *     integration: { enabled: true, threshold: 70, timeout: 600 },
 *     e2e: { enabled: true, threshold: 90, timeout: 1800 },
 *     performance: { enabled: true, threshold: 95 },
 *     security: { enabled: true, blocking: true }
 *   },
 *   qualityGates: {
 *     coverage: 80,
 *     passRate: 95,
 *     performanceBudget: 3000,
 *     securityScan: 'blocking'
 *   }
 * });
 *
 * @references
 * - Continuous Testing: https://martinfowler.com/articles/continuousIntegration.html
 * - Testing Pyramid: https://martinfowler.com/articles/practical-test-pyramid.html
 * - Shift-Left Testing: https://www.ibm.com/topics/shift-left-testing
 * - Shift-Right Testing: https://www.dynatrace.com/news/blog/what-is-shift-right-testing/
 * - CI/CD Best Practices: https://www.atlassian.com/continuous-delivery/principles
 * - Test Automation Patterns: https://www.selenium.dev/documentation/test_practices/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectPath,
    repositoryUrl,
    cicdPlatform = 'github-actions', // 'github-actions', 'gitlab-ci', 'jenkins', 'azure-devops'
    testStrategy = {
      unit: { enabled: true, threshold: 80, timeout: 300 },
      integration: { enabled: true, threshold: 70, timeout: 600 },
      e2e: { enabled: true, threshold: 90, timeout: 1800 },
      api: { enabled: true, threshold: 85, timeout: 600 },
      performance: { enabled: true, threshold: 95 },
      security: { enabled: true, blocking: true },
      visual: { enabled: false, threshold: 95 },
      accessibility: { enabled: true, threshold: 90 }
    },
    qualityGates = {
      coverage: 80,
      passRate: 95,
      performanceBudget: 3000,
      securityScan: 'blocking',
      flakinessThreshold: 5,
      buildTime: 1200
    },
    parallelization = {
      enabled: true,
      maxWorkers: 4,
      sharding: true
    },
    environmentConfig = {
      staging: 'https://staging.example.com',
      production: 'https://production.example.com'
    },
    notificationChannels = ['slack', 'email'],
    outputDir = 'continuous-testing-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let pipelineConfig = {};
  let testMetrics = {};
  let continuousTestingScore = 0;

  ctx.log('info', `Starting Continuous Testing Pipeline Implementation for ${projectPath}`);
  ctx.log('info', `CI/CD Platform: ${cicdPlatform}, Repository: ${repositoryUrl}`);

  // ============================================================================
  // PHASE 1: CURRENT STATE ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 1: Assessing current testing and CI/CD state');

  const currentStateAssessment = await ctx.task(assessCurrentStateTask, {
    projectPath,
    repositoryUrl,
    cicdPlatform,
    outputDir
  });

  if (!currentStateAssessment.success) {
    return {
      success: false,
      error: 'Failed to assess current state',
      details: currentStateAssessment,
      metadata: {
        processId: 'specializations/qa-testing-automation/continuous-testing',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...currentStateAssessment.artifacts);

  // Quality Gate: Minimum baseline assessment
  if (currentStateAssessment.maturityScore < 30) {
    await ctx.breakpoint({
      question: `Current testing maturity score: ${currentStateAssessment.maturityScore}/100. Very low baseline. Review assessment and approve to continue with implementation?`,
      title: 'Low Testing Maturity Warning',
      context: {
        runId: ctx.runId,
        maturityScore: currentStateAssessment.maturityScore,
        gaps: currentStateAssessment.gaps,
        recommendation: 'Consider starting with foundational test automation before full continuous testing pipeline',
        files: currentStateAssessment.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 2: TEST INFRASTRUCTURE SETUP
  // ============================================================================

  ctx.log('info', 'Phase 2: Setting up test infrastructure and frameworks');

  const testInfrastructure = await ctx.task(setupTestInfrastructureTask, {
    projectPath,
    testStrategy,
    parallelization,
    currentState: currentStateAssessment,
    outputDir
  });

  artifacts.push(...testInfrastructure.artifacts);

  // Quality Gate: Infrastructure readiness
  if (!testInfrastructure.allFrameworksConfigured) {
    await ctx.breakpoint({
      question: `Test infrastructure setup incomplete. ${testInfrastructure.configuredFrameworks.length}/${testInfrastructure.requiredFrameworks.length} frameworks configured. Review and approve to proceed?`,
      title: 'Infrastructure Setup Review',
      context: {
        runId: ctx.runId,
        configured: testInfrastructure.configuredFrameworks,
        missing: testInfrastructure.missingFrameworks,
        files: testInfrastructure.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 3: PARALLEL TEST STRATEGY DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 3: Designing comprehensive test strategy and test pyramid');

  const testStrategyDesign = await ctx.task(designTestStrategyTask, {
    projectPath,
    testStrategy,
    currentState: currentStateAssessment,
    infrastructure: testInfrastructure,
    qualityGates,
    outputDir
  });

  artifacts.push(...testStrategyDesign.artifacts);

  // Quality Gate: Strategy completeness
  const strategyCompleteness = testStrategyDesign.completenessScore;
  if (strategyCompleteness < 70) {
    await ctx.breakpoint({
      question: `Test strategy completeness: ${strategyCompleteness}%. Below 70% threshold. Review strategy gaps and approve?`,
      title: 'Test Strategy Completeness Review',
      context: {
        runId: ctx.runId,
        completenessScore: strategyCompleteness,
        coverage: testStrategyDesign.testPyramid,
        gaps: testStrategyDesign.gaps,
        files: testStrategyDesign.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 4: PARALLEL CI/CD PIPELINE CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Configuring CI/CD pipeline stages in parallel');

  // Parallelize pipeline stage configuration
  const [
    preCommitConfig,
    commitStageConfig,
    acceptanceStageConfig,
    productionStageConfig
  ] = await ctx.parallel.all([
    () => ctx.task(configurePreCommitStageTask, {
      projectPath,
      testStrategy,
      qualityGates,
      outputDir
    }),
    () => ctx.task(configureCommitStageTask, {
      projectPath,
      testStrategy,
      parallelization,
      qualityGates,
      cicdPlatform,
      outputDir
    }),
    () => ctx.task(configureAcceptanceStageTask, {
      projectPath,
      testStrategy,
      environmentConfig,
      qualityGates,
      cicdPlatform,
      outputDir
    }),
    () => ctx.task(configureProductionStageTask, {
      projectPath,
      testStrategy,
      environmentConfig,
      qualityGates,
      cicdPlatform,
      outputDir
    })
  ]);

  artifacts.push(
    ...preCommitConfig.artifacts,
    ...commitStageConfig.artifacts,
    ...acceptanceStageConfig.artifacts,
    ...productionStageConfig.artifacts
  );

  ctx.log('info', 'All CI/CD pipeline stages configured');

  // ============================================================================
  // PHASE 5: QUALITY GATES IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing quality gates at each stage');

  const qualityGatesImpl = await ctx.task(implementQualityGatesTask, {
    projectPath,
    qualityGates,
    testStrategy,
    pipelineStages: {
      preCommit: preCommitConfig,
      commit: commitStageConfig,
      acceptance: acceptanceStageConfig,
      production: productionStageConfig
    },
    cicdPlatform,
    outputDir
  });

  artifacts.push(...qualityGatesImpl.artifacts);

  // Quality Gate: Quality gates configuration
  if (qualityGatesImpl.gatesConfigured < qualityGatesImpl.totalGates) {
    await ctx.breakpoint({
      question: `${qualityGatesImpl.gatesConfigured}/${qualityGatesImpl.totalGates} quality gates configured. Review missing gates and approve?`,
      title: 'Quality Gates Configuration Review',
      context: {
        runId: ctx.runId,
        configured: qualityGatesImpl.configuredGates,
        missing: qualityGatesImpl.missingGates,
        blocking: qualityGatesImpl.blockingGates,
        files: qualityGatesImpl.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 6: PARALLEL TEST TYPE IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Implementing different test types in parallel');

  // Parallelize test implementation by type
  const [
    unitTestsImpl,
    integrationTestsImpl,
    apiTestsImpl,
    e2eTestsImpl
  ] = await ctx.parallel.all([
    () => ctx.task(implementUnitTestsTask, {
      projectPath,
      testStrategy: testStrategy.unit,
      infrastructure: testInfrastructure,
      outputDir
    }),
    () => ctx.task(implementIntegrationTestsTask, {
      projectPath,
      testStrategy: testStrategy.integration,
      infrastructure: testInfrastructure,
      outputDir
    }),
    () => ctx.task(implementApiTestsTask, {
      projectPath,
      testStrategy: testStrategy.api,
      infrastructure: testInfrastructure,
      outputDir
    }),
    () => ctx.task(implementE2eTestsTask, {
      projectPath,
      testStrategy: testStrategy.e2e,
      infrastructure: testInfrastructure,
      environmentConfig,
      outputDir
    })
  ]);

  artifacts.push(
    ...unitTestsImpl.artifacts,
    ...integrationTestsImpl.artifacts,
    ...apiTestsImpl.artifacts,
    ...e2eTestsImpl.artifacts
  );

  const totalTestsImplemented =
    unitTestsImpl.testCount +
    integrationTestsImpl.testCount +
    apiTestsImpl.testCount +
    e2eTestsImpl.testCount;

  ctx.log('info', `Total tests implemented: ${totalTestsImplemented}`);

  // ============================================================================
  // PHASE 7: PERFORMANCE AND SECURITY TESTING
  // ============================================================================

  ctx.log('info', 'Phase 7: Setting up performance and security testing');

  const [
    performanceTesting,
    securityTesting
  ] = await ctx.parallel.all([
    () => ctx.task(setupPerformanceTestingTask, {
      projectPath,
      testStrategy: testStrategy.performance,
      qualityGates,
      environmentConfig,
      outputDir
    }),
    () => ctx.task(setupSecurityTestingTask, {
      projectPath,
      testStrategy: testStrategy.security,
      qualityGates,
      cicdPlatform,
      outputDir
    })
  ]);

  artifacts.push(
    ...performanceTesting.artifacts,
    ...securityTesting.artifacts
  );

  // Quality Gate: Security testing must be configured if blocking
  if (qualityGates.securityScan === 'blocking' && !securityTesting.configured) {
    await ctx.breakpoint({
      question: `Security testing marked as blocking but not configured. This is a critical gap. Review and decide to proceed or fix?`,
      title: 'Security Testing Configuration Missing',
      context: {
        runId: ctx.runId,
        securityConfig: securityTesting,
        recommendation: 'Configure security scanning tools before proceeding to production',
        files: securityTesting.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 8: TEST EXECUTION AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Validating pipeline with initial test execution');

  const pipelineValidation = await ctx.task(validatePipelineTask, {
    projectPath,
    cicdPlatform,
    pipelineStages: {
      preCommit: preCommitConfig,
      commit: commitStageConfig,
      acceptance: acceptanceStageConfig,
      production: productionStageConfig
    },
    testImplementations: {
      unit: unitTestsImpl,
      integration: integrationTestsImpl,
      api: apiTestsImpl,
      e2e: e2eTestsImpl,
      performance: performanceTesting,
      security: securityTesting
    },
    qualityGates,
    outputDir
  });

  artifacts.push(...pipelineValidation.artifacts);

  const validationPassRate = pipelineValidation.passRate;

  // Quality Gate: Initial pipeline validation
  if (validationPassRate < 70) {
    await ctx.breakpoint({
      question: `Pipeline validation pass rate: ${validationPassRate}%. Below 70% threshold. Review failures and approve to continue debugging?`,
      title: 'Pipeline Validation Results',
      context: {
        runId: ctx.runId,
        passRate: validationPassRate,
        totalStages: pipelineValidation.totalStages,
        passed: pipelineValidation.passedStages,
        failed: pipelineValidation.failedStages,
        failures: pipelineValidation.failures,
        files: pipelineValidation.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 9: FEEDBACK MECHANISMS AND NOTIFICATIONS
  // ============================================================================

  ctx.log('info', 'Phase 9: Configuring feedback loops and notifications');

  const feedbackMechanisms = await ctx.task(configureFeedbackMechanismsTask, {
    projectPath,
    cicdPlatform,
    notificationChannels,
    qualityGates,
    outputDir
  });

  artifacts.push(...feedbackMechanisms.artifacts);

  // ============================================================================
  // PHASE 10: TEST DATA MANAGEMENT
  // ============================================================================

  ctx.log('info', 'Phase 10: Setting up test data management and isolation');

  const testDataManagement = await ctx.task(setupTestDataManagementTask, {
    projectPath,
    testStrategy,
    environmentConfig,
    outputDir
  });

  artifacts.push(...testDataManagement.artifacts);

  // ============================================================================
  // PHASE 11: MONITORING AND OBSERVABILITY
  // ============================================================================

  ctx.log('info', 'Phase 11: Implementing test monitoring and observability');

  const monitoringSetup = await ctx.task(setupMonitoringTask, {
    projectPath,
    cicdPlatform,
    testStrategy,
    qualityGates,
    environmentConfig,
    outputDir
  });

  artifacts.push(...monitoringSetup.artifacts);

  // ============================================================================
  // PHASE 12: FLAKINESS DETECTION AND REMEDIATION
  // ============================================================================

  ctx.log('info', 'Phase 12: Setting up flakiness detection and remediation');

  const flakinessManagement = await ctx.task(setupFlakinessManagementTask, {
    projectPath,
    qualityGates,
    testImplementations: {
      unit: unitTestsImpl,
      integration: integrationTestsImpl,
      api: apiTestsImpl,
      e2e: e2eTestsImpl
    },
    outputDir
  });

  artifacts.push(...flakinessManagement.artifacts);

  // ============================================================================
  // PHASE 13: PARALLEL EXECUTION OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 13: Optimizing parallel test execution');

  const parallelOptimization = await ctx.task(optimizeParallelExecutionTask, {
    projectPath,
    parallelization,
    testImplementations: {
      unit: unitTestsImpl,
      integration: integrationTestsImpl,
      api: apiTestsImpl,
      e2e: e2eTestsImpl
    },
    qualityGates,
    outputDir
  });

  artifacts.push(...parallelOptimization.artifacts);

  const optimizedBuildTime = parallelOptimization.buildTime;

  // Quality Gate: Build time performance
  if (optimizedBuildTime > qualityGates.buildTime) {
    await ctx.breakpoint({
      question: `Optimized build time: ${optimizedBuildTime}s exceeds target: ${qualityGates.buildTime}s. Review optimization opportunities and approve?`,
      title: 'Build Time Performance Review',
      context: {
        runId: ctx.runId,
        currentBuildTime: optimizedBuildTime,
        targetBuildTime: qualityGates.buildTime,
        bottlenecks: parallelOptimization.bottlenecks,
        recommendations: parallelOptimization.recommendations,
        files: parallelOptimization.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 14: SHIFT-RIGHT TESTING (PRODUCTION MONITORING)
  // ============================================================================

  ctx.log('info', 'Phase 14: Implementing shift-right testing in production');

  const shiftRightTesting = await ctx.task(implementShiftRightTestingTask, {
    projectPath,
    environmentConfig,
    monitoringSetup,
    outputDir
  });

  artifacts.push(...shiftRightTesting.artifacts);

  // ============================================================================
  // PHASE 15: DOCUMENTATION AND ONBOARDING
  // ============================================================================

  ctx.log('info', 'Phase 15: Generating documentation and onboarding materials');

  const documentation = await ctx.task(generateDocumentationTask, {
    projectPath,
    cicdPlatform,
    testStrategy,
    pipelineStages: {
      preCommit: preCommitConfig,
      commit: commitStageConfig,
      acceptance: acceptanceStageConfig,
      production: productionStageConfig
    },
    qualityGates,
    testImplementations: {
      unit: unitTestsImpl,
      integration: integrationTestsImpl,
      api: apiTestsImpl,
      e2e: e2eTestsImpl,
      performance: performanceTesting,
      security: securityTesting
    },
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // ============================================================================
  // PHASE 16: FINAL PIPELINE EXECUTION AND METRICS
  // ============================================================================

  ctx.log('info', 'Phase 16: Running final end-to-end pipeline execution');

  const finalExecution = await ctx.task(executeFinalPipelineTask, {
    projectPath,
    cicdPlatform,
    repositoryUrl,
    outputDir
  });

  artifacts.push(...finalExecution.artifacts);

  const finalPassRate = finalExecution.passRate;
  const finalCoverage = finalExecution.coverage;
  const finalBuildTime = finalExecution.buildTime;

  // Quality Gate: Final execution metrics
  if (finalPassRate < qualityGates.passRate) {
    await ctx.breakpoint({
      question: `Final pipeline pass rate: ${finalPassRate}%. Target: ${qualityGates.passRate}%. Below acceptance criteria. Review and decide to proceed or iterate?`,
      title: 'Final Pipeline Execution Review',
      context: {
        runId: ctx.runId,
        passRate: finalPassRate,
        targetPassRate: qualityGates.passRate,
        coverage: finalCoverage,
        targetCoverage: qualityGates.coverage,
        buildTime: finalBuildTime,
        recommendation: 'Consider additional test stabilization or adjust quality gates',
        files: finalExecution.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // Quality Gate: Test coverage
  if (finalCoverage < qualityGates.coverage) {
    await ctx.breakpoint({
      question: `Test coverage: ${finalCoverage}%. Target: ${qualityGates.coverage}%. Coverage gap exists. Approve to proceed or add more tests?`,
      title: 'Test Coverage Quality Gate',
      context: {
        runId: ctx.runId,
        coverage: finalCoverage,
        targetCoverage: qualityGates.coverage,
        uncoveredAreas: finalExecution.uncoveredAreas,
        recommendation: 'Add tests for uncovered critical paths or adjust coverage target',
        files: finalExecution.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 17: CONTINUOUS IMPROVEMENT SETUP
  // ============================================================================

  ctx.log('info', 'Phase 17: Setting up continuous improvement mechanisms');

  const continuousImprovement = await ctx.task(setupContinuousImprovementTask, {
    projectPath,
    testMetrics: {
      currentState: currentStateAssessment,
      validation: pipelineValidation,
      finalExecution
    },
    qualityGates,
    outputDir
  });

  artifacts.push(...continuousImprovement.artifacts);

  // ============================================================================
  // PHASE 18: FINAL ASSESSMENT AND SCORING
  // ============================================================================

  ctx.log('info', 'Phase 18: Computing continuous testing maturity score');

  const finalAssessment = await ctx.task(computeFinalAssessmentTask, {
    projectPath,
    currentState: currentStateAssessment,
    testInfrastructure,
    testStrategyDesign,
    pipelineStages: {
      preCommit: preCommitConfig,
      commit: commitStageConfig,
      acceptance: acceptanceStageConfig,
      production: productionStageConfig
    },
    qualityGates: qualityGatesImpl,
    testImplementations: {
      unit: unitTestsImpl,
      integration: integrationTestsImpl,
      api: apiTestsImpl,
      e2e: e2eTestsImpl,
      performance: performanceTesting,
      security: securityTesting
    },
    pipelineValidation,
    feedbackMechanisms,
    monitoringSetup,
    flakinessManagement,
    parallelOptimization,
    shiftRightTesting,
    finalExecution,
    continuousImprovement,
    qualityGates,
    outputDir
  });

  pipelineConfig = finalAssessment.pipelineConfig;
  testMetrics = finalAssessment.testMetrics;
  continuousTestingScore = finalAssessment.continuousTestingScore;
  artifacts.push(...finalAssessment.artifacts);

  ctx.log('info', `Continuous Testing Maturity Score: ${continuousTestingScore}/100`);
  ctx.log('info', `Pipeline Pass Rate: ${finalPassRate}%, Coverage: ${finalCoverage}%`);

  // Final Breakpoint: Continuous Testing Pipeline Approval
  await ctx.breakpoint({
    question: `Continuous Testing Pipeline Complete. Maturity Score: ${continuousTestingScore}/100, Pass Rate: ${finalPassRate}%, Coverage: ${finalCoverage}%. Approve pipeline for production use?`,
    title: 'Final Continuous Testing Pipeline Review',
    context: {
      runId: ctx.runId,
      summary: {
        projectPath,
        cicdPlatform,
        continuousTestingScore,
        passRate: finalPassRate,
        coverage: finalCoverage,
        buildTime: finalBuildTime,
        totalTests: totalTestsImplemented,
        stagesConfigured: 4,
        qualityGatesConfigured: qualityGatesImpl.gatesConfigured,
        parallelizationEnabled: parallelization.enabled,
        shiftRightEnabled: shiftRightTesting.enabled
      },
      qualityGatesMet: finalAssessment.qualityGatesMet,
      verdict: finalAssessment.verdict,
      recommendation: finalAssessment.recommendation,
      files: [
        { path: documentation.pipelineDocPath, format: 'markdown', label: 'Pipeline Documentation' },
        { path: finalAssessment.metricsReportPath, format: 'json', label: 'Metrics Report' },
        { path: finalExecution.reportPath, format: 'html', label: 'Pipeline Execution Report' },
        { path: documentation.onboardingGuidePath, format: 'markdown', label: 'Onboarding Guide' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectPath,
    repositoryUrl,
    cicdPlatform,
    continuousTestingScore,
    pipelineConfig: {
      stages: ['pre-commit', 'commit', 'acceptance', 'production'],
      preCommitStage: {
        hooks: preCommitConfig.hooks,
        checks: preCommitConfig.checks,
        executionTime: preCommitConfig.executionTime
      },
      commitStage: {
        tests: commitStageConfig.tests,
        parallelization: commitStageConfig.parallelization,
        executionTime: commitStageConfig.executionTime
      },
      acceptanceStage: {
        tests: acceptanceStageConfig.tests,
        environment: acceptanceStageConfig.environment,
        executionTime: acceptanceStageConfig.executionTime
      },
      productionStage: {
        deploymentStrategy: productionStageConfig.deploymentStrategy,
        monitoring: productionStageConfig.monitoring,
        rollback: productionStageConfig.rollback
      }
    },
    testMetrics: {
      totalTests: totalTestsImplemented,
      unitTests: unitTestsImpl.testCount,
      integrationTests: integrationTestsImpl.testCount,
      apiTests: apiTestsImpl.testCount,
      e2eTests: e2eTestsImpl.testCount,
      performanceTests: performanceTesting.testCount || 0,
      securityTests: securityTesting.testCount || 0,
      coverage: finalCoverage,
      passRate: finalPassRate,
      buildTime: finalBuildTime,
      flakinessRate: flakinessManagement.flakinessRate,
      parallelizationFactor: parallelOptimization.parallelizationFactor
    },
    qualityGates: {
      coverageMet: finalCoverage >= qualityGates.coverage,
      passRateMet: finalPassRate >= qualityGates.passRate,
      buildTimeMet: finalBuildTime <= qualityGates.buildTime,
      flakinessMet: flakinessManagement.flakinessRate <= qualityGates.flakinessThreshold,
      securityMet: securityTesting.scanPassed
    },
    integrationStatus: {
      cicdIntegrated: true,
      monitoringIntegrated: monitoringSetup.integrated,
      notificationsConfigured: feedbackMechanisms.configured,
      shiftRightEnabled: shiftRightTesting.enabled,
      testDataManagement: testDataManagement.configured
    },
    feedback: {
      channels: feedbackMechanisms.channels,
      feedbackTime: feedbackMechanisms.averageFeedbackTime,
      notificationRules: feedbackMechanisms.rules
    },
    monitoring: {
      dashboards: monitoringSetup.dashboards,
      metrics: monitoringSetup.metrics,
      alerts: monitoringSetup.alerts
    },
    continuousImprovement: {
      enabled: continuousImprovement.enabled,
      reviewCadence: continuousImprovement.reviewCadence,
      improvementAreas: continuousImprovement.areas
    },
    artifacts,
    documentation: {
      pipelineDocPath: documentation.pipelineDocPath,
      testStrategyDocPath: documentation.testStrategyDocPath,
      onboardingGuidePath: documentation.onboardingGuidePath,
      troubleshootingPath: documentation.troubleshootingPath
    },
    finalAssessment: {
      verdict: finalAssessment.verdict,
      recommendation: finalAssessment.recommendation,
      productionReady: finalAssessment.productionReady,
      metricsReportPath: finalAssessment.metricsReportPath
    },
    duration,
    metadata: {
      processId: 'specializations/qa-testing-automation/continuous-testing',
      timestamp: startTime,
      cicdPlatform,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: Current State Assessment
export const assessCurrentStateTask = defineTask('assess-current-state', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Current State Assessment - ${args.projectPath}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior DevOps Engineer and Testing Architect',
      task: 'Assess current testing and CI/CD maturity state',
      context: {
        projectPath: args.projectPath,
        repositoryUrl: args.repositoryUrl,
        cicdPlatform: args.cicdPlatform,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze existing test coverage and test types present',
        '2. Evaluate current CI/CD pipeline configuration and stages',
        '3. Assess test automation maturity level (0-100 scale)',
        '4. Identify existing quality gates and enforcement',
        '5. Review current build and test execution times',
        '6. Analyze test failure rates and flakiness',
        '7. Assess feedback loop speed (time from commit to results)',
        '8. Identify gaps in testing pyramid (unit, integration, E2E)',
        '9. Evaluate monitoring and observability of tests',
        '10. Document current pain points and bottlenecks'
      ],
      outputFormat: 'JSON object with maturity assessment and gap analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'maturityScore', 'currentPipeline', 'gaps', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        maturityScore: { type: 'number', minimum: 0, maximum: 100 },
        currentPipeline: {
          type: 'object',
          properties: {
            exists: { type: 'boolean' },
            platform: { type: 'string' },
            stages: { type: 'array', items: { type: 'string' } },
            avgBuildTime: { type: 'number' },
            avgFeedbackTime: { type: 'number' }
          }
        },
        testingMetrics: {
          type: 'object',
          properties: {
            totalTests: { type: 'number' },
            unitTests: { type: 'number' },
            integrationTests: { type: 'number' },
            e2eTests: { type: 'number' },
            coverage: { type: 'number' },
            passRate: { type: 'number' },
            flakinessRate: { type: 'number' }
          }
        },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              area: { type: 'string' },
              severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
              description: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        strengths: { type: 'array', items: { type: 'string' } },
        painPoints: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'continuous-testing', 'assessment', 'ci-cd']
}));

// Phase 2: Test Infrastructure Setup
export const setupTestInfrastructureTask = defineTask('setup-test-infrastructure', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Test Infrastructure Setup - ${args.projectPath}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Test Infrastructure Engineer',
      task: 'Set up comprehensive test infrastructure and frameworks',
      context: {
        projectPath: args.projectPath,
        testStrategy: args.testStrategy,
        parallelization: args.parallelization,
        currentState: args.currentState,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Set up unit testing framework (Jest, Mocha, pytest, JUnit)',
        '2. Configure integration testing infrastructure',
        '3. Set up E2E testing framework (Playwright, Cypress, Selenium)',
        '4. Configure API testing tools (Postman, REST Assured, Supertest)',
        '5. Set up performance testing tools (k6, JMeter, Gatling)',
        '6. Configure security scanning tools (OWASP ZAP, Snyk, SonarQube)',
        '7. Set up test reporters and result formatters',
        '8. Configure parallel execution capabilities',
        '9. Set up test artifact storage and retention',
        '10. Create test execution scripts and utilities'
      ],
      outputFormat: 'JSON object with infrastructure configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'configuredFrameworks', 'allFrameworksConfigured', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        configuredFrameworks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              framework: { type: 'string' },
              version: { type: 'string' },
              configPath: { type: 'string' },
              parallelEnabled: { type: 'boolean' }
            }
          }
        },
        requiredFrameworks: { type: 'array', items: { type: 'string' } },
        missingFrameworks: { type: 'array', items: { type: 'string' } },
        allFrameworksConfigured: { type: 'boolean' },
        parallelizationConfig: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            maxWorkers: { type: 'number' },
            sharding: { type: 'boolean' },
            distributedExecution: { type: 'boolean' }
          }
        },
        testReporting: {
          type: 'object',
          properties: {
            reporters: { type: 'array', items: { type: 'string' } },
            artifactStorage: { type: 'string' },
            retentionDays: { type: 'number' }
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
  labels: ['agent', 'continuous-testing', 'infrastructure', 'test-frameworks']
}));

// Phase 3: Test Strategy Design
export const designTestStrategyTask = defineTask('design-test-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Test Strategy Design - ${args.projectPath}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Test Strategy Architect',
      task: 'Design comprehensive continuous testing strategy',
      context: {
        projectPath: args.projectPath,
        testStrategy: args.testStrategy,
        currentState: args.currentState,
        infrastructure: args.infrastructure,
        qualityGates: args.qualityGates,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design test pyramid strategy (unit 70%, integration 20%, E2E 10%)',
        '2. Define test selection criteria for each pipeline stage',
        '3. Plan test data management strategy',
        '4. Design test isolation and cleanup strategies',
        '5. Define retry and failure handling strategies',
        '6. Plan for test environment management',
        '7. Design smoke, regression, and full test suites',
        '8. Define test tagging and categorization strategy',
        '9. Plan for contract testing and service virtualization',
        '10. Create test coverage goals per component'
      ],
      outputFormat: 'JSON object with comprehensive test strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'testPyramid', 'completenessScore', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        testPyramid: {
          type: 'object',
          properties: {
            unit: { type: 'object', properties: { percentage: { type: 'number' }, count: { type: 'number' } } },
            integration: { type: 'object', properties: { percentage: { type: 'number' }, count: { type: 'number' } } },
            e2e: { type: 'object', properties: { percentage: { type: 'number' }, count: { type: 'number' } } },
            balanced: { type: 'boolean' }
          }
        },
        pipelineStages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stage: { type: 'string' },
              testTypes: { type: 'array', items: { type: 'string' } },
              selectionCriteria: { type: 'string' },
              executionTime: { type: 'number' }
            }
          }
        },
        testSuites: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              testCount: { type: 'number' },
              executionTrigger: { type: 'string' }
            }
          }
        },
        testDataStrategy: {
          type: 'object',
          properties: {
            approach: { type: 'string' },
            generation: { type: 'string' },
            isolation: { type: 'boolean' },
            cleanup: { type: 'string' }
          }
        },
        completenessScore: { type: 'number', minimum: 0, maximum: 100 },
        gaps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'continuous-testing', 'strategy', 'test-pyramid']
}));

// Phase 4.1: Pre-Commit Stage Configuration
export const configurePreCommitStageTask = defineTask('configure-pre-commit-stage', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4.1: Pre-Commit Stage Configuration - ${args.projectPath}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DevOps Engineer',
      task: 'Configure pre-commit hooks and local development checks',
      context: {
        projectPath: args.projectPath,
        testStrategy: args.testStrategy,
        qualityGates: args.qualityGates,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Set up Git pre-commit hooks (Husky or pre-commit)',
        '2. Configure fast unit test execution (< 30 seconds)',
        '3. Add linting and code formatting checks',
        '4. Configure static type checking',
        '5. Add commit message validation',
        '6. Set up file size and naming checks',
        '7. Configure pre-push hooks for additional checks',
        '8. Add bypass mechanism (--no-verify) with logging',
        '9. Optimize hook execution time',
        '10. Create documentation for developers'
      ],
      outputFormat: 'JSON object with pre-commit configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'hooks', 'checks', 'executionTime', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        hooks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              hook: { type: 'string' },
              tool: { type: 'string' },
              checks: { type: 'array', items: { type: 'string' } },
              executionTime: { type: 'number' }
            }
          }
        },
        checks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              check: { type: 'string' },
              enabled: { type: 'boolean' },
              blocking: { type: 'boolean' }
            }
          }
        },
        executionTime: { type: 'number', description: 'Total hook execution time in seconds' },
        bypassMechanism: { type: 'object', properties: { enabled: { type: 'boolean' }, logged: { type: 'boolean' } } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'continuous-testing', 'pre-commit', 'shift-left']
}));

// Phase 4.2: Commit Stage Configuration
export const configureCommitStageTask = defineTask('configure-commit-stage', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4.2: Commit Stage Configuration - ${args.projectPath}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CI/CD Pipeline Engineer',
      task: 'Configure commit stage with fast feedback tests',
      context: {
        projectPath: args.projectPath,
        testStrategy: args.testStrategy,
        parallelization: args.parallelization,
        qualityGates: args.qualityGates,
        cicdPlatform: args.cicdPlatform,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure CI pipeline trigger on every commit/PR',
        '2. Set up parallel unit test execution',
        '3. Configure integration tests for critical paths',
        '4. Add code coverage collection and reporting',
        '5. Set up linting and static analysis',
        '6. Configure security scanning (dependency check)',
        '7. Add build artifact generation',
        '8. Set up test result reporting and notifications',
        '9. Configure failure fast strategy',
        '10. Optimize for < 10 minute execution time'
      ],
      outputFormat: 'JSON object with commit stage configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'tests', 'parallelization', 'executionTime', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        tests: {
          type: 'object',
          properties: {
            unit: { type: 'object', properties: { enabled: { type: 'boolean' }, count: { type: 'number' } } },
            integration: { type: 'object', properties: { enabled: { type: 'boolean' }, count: { type: 'number' } } },
            api: { type: 'object', properties: { enabled: { type: 'boolean' }, count: { type: 'number' } } }
          }
        },
        parallelization: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            workers: { type: 'number' },
            sharding: { type: 'boolean' },
            speedup: { type: 'number', description: 'Speedup factor from parallelization' }
          }
        },
        coverage: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            threshold: { type: 'number' },
            reportPath: { type: 'string' }
          }
        },
        securityScanning: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            tools: { type: 'array', items: { type: 'string' } },
            blocking: { type: 'boolean' }
          }
        },
        executionTime: { type: 'number', description: 'Target execution time in seconds' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'continuous-testing', 'commit-stage', 'ci-pipeline']
}));

// Phase 4.3: Acceptance Stage Configuration
export const configureAcceptanceStageTask = defineTask('configure-acceptance-stage', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4.3: Acceptance Stage Configuration - ${args.projectPath}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Test Automation Lead',
      task: 'Configure acceptance stage with comprehensive E2E and acceptance tests',
      context: {
        projectPath: args.projectPath,
        testStrategy: args.testStrategy,
        environmentConfig: args.environmentConfig,
        qualityGates: args.qualityGates,
        cicdPlatform: args.cicdPlatform,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure E2E test execution against staging environment',
        '2. Set up API contract testing',
        '3. Configure visual regression testing',
        '4. Set up accessibility testing',
        '5. Configure performance testing',
        '6. Add database migration validation',
        '7. Set up cross-browser testing (if applicable)',
        '8. Configure smoke tests post-deployment',
        '9. Add comprehensive test reporting',
        '10. Set up quality gate validation'
      ],
      outputFormat: 'JSON object with acceptance stage configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'tests', 'environment', 'executionTime', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        tests: {
          type: 'object',
          properties: {
            e2e: { type: 'object', properties: { enabled: { type: 'boolean' }, count: { type: 'number' } } },
            api: { type: 'object', properties: { enabled: { type: 'boolean' }, count: { type: 'number' } } },
            visual: { type: 'object', properties: { enabled: { type: 'boolean' }, count: { type: 'number' } } },
            accessibility: { type: 'object', properties: { enabled: { type: 'boolean' }, count: { type: 'number' } } },
            performance: { type: 'object', properties: { enabled: { type: 'boolean' }, count: { type: 'number' } } }
          }
        },
        environment: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            url: { type: 'string' },
            managed: { type: 'boolean' },
            provisioning: { type: 'string' }
          }
        },
        crossBrowser: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            browsers: { type: 'array', items: { type: 'string' } }
          }
        },
        executionTime: { type: 'number', description: 'Target execution time in seconds' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'continuous-testing', 'acceptance-stage', 'e2e-testing']
}));

// Phase 4.4: Production Stage Configuration
export const configureProductionStageTask = defineTask('configure-production-stage', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4.4: Production Stage Configuration - ${args.projectPath}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Production Engineering Lead',
      task: 'Configure production deployment and monitoring stage',
      context: {
        projectPath: args.projectPath,
        testStrategy: args.testStrategy,
        environmentConfig: args.environmentConfig,
        qualityGates: args.qualityGates,
        cicdPlatform: args.cicdPlatform,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure deployment strategy (blue-green, canary, rolling)',
        '2. Set up smoke tests post-production deployment',
        '3. Configure synthetic monitoring',
        '4. Set up health checks and readiness probes',
        '5. Configure production traffic shadowing/mirroring',
        '6. Set up chaos testing (optional)',
        '7. Configure rollback automation on failure',
        '8. Add production metrics collection',
        '9. Set up alerting for production issues',
        '10. Configure progressive delivery gates'
      ],
      outputFormat: 'JSON object with production stage configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'deploymentStrategy', 'monitoring', 'rollback', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        deploymentStrategy: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['blue-green', 'canary', 'rolling', 'recreate'] },
            progressive: { type: 'boolean' },
            automatedRollback: { type: 'boolean' }
          }
        },
        smokeTests: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            count: { type: 'number' },
            timeout: { type: 'number' }
          }
        },
        monitoring: {
          type: 'object',
          properties: {
            synthetic: { type: 'boolean' },
            healthChecks: { type: 'boolean' },
            metricsCollection: { type: 'boolean' },
            alerting: { type: 'boolean' }
          }
        },
        rollback: {
          type: 'object',
          properties: {
            automated: { type: 'boolean' },
            triggers: { type: 'array', items: { type: 'string' } },
            timeout: { type: 'number' }
          }
        },
        chaosTesting: { type: 'object', properties: { enabled: { type: 'boolean' } } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'continuous-testing', 'production-stage', 'deployment']
}));

// Phase 5: Quality Gates Implementation
export const implementQualityGatesTask = defineTask('implement-quality-gates', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Quality Gates Implementation - ${args.projectPath}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Quality Engineering Lead',
      task: 'Implement quality gates at each pipeline stage',
      context: {
        projectPath: args.projectPath,
        qualityGates: args.qualityGates,
        testStrategy: args.testStrategy,
        pipelineStages: args.pipelineStages,
        cicdPlatform: args.cicdPlatform,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Implement coverage quality gate (minimum % required)',
        '2. Set up pass rate quality gate',
        '3. Configure performance budget quality gate',
        '4. Implement security scan quality gate (blocking)',
        '5. Set up flakiness threshold gate',
        '6. Configure build time budget gate',
        '7. Add code quality metrics gate (complexity, duplication)',
        '8. Set up accessibility compliance gate',
        '9. Configure deployment approval gates',
        '10. Implement gate bypass mechanism with audit trail'
      ],
      outputFormat: 'JSON object with quality gates configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['gatesConfigured', 'totalGates', 'configuredGates', 'artifacts'],
      properties: {
        gatesConfigured: { type: 'number' },
        totalGates: { type: 'number' },
        configuredGates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gate: { type: 'string' },
              stage: { type: 'string' },
              threshold: { type: 'number' },
              blocking: { type: 'boolean' },
              bypassAllowed: { type: 'boolean' }
            }
          }
        },
        missingGates: { type: 'array', items: { type: 'string' } },
        blockingGates: { type: 'array', items: { type: 'string' } },
        bypassMechanism: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            requiresApproval: { type: 'boolean' },
            auditLogged: { type: 'boolean' }
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
  labels: ['agent', 'continuous-testing', 'quality-gates', 'governance']
}));

// Phase 6.1: Unit Tests Implementation
export const implementUnitTestsTask = defineTask('implement-unit-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6.1: Unit Tests Implementation - ${args.projectPath}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Test Automation Engineer',
      task: 'Implement comprehensive unit tests',
      context: {
        projectPath: args.projectPath,
        testStrategy: args.testStrategy,
        infrastructure: args.infrastructure,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify all testable units (functions, methods, classes)',
        '2. Implement unit tests with high coverage (80%+)',
        '3. Follow AAA pattern (Arrange, Act, Assert)',
        '4. Add test fixtures and mocks',
        '5. Implement parameterized tests for edge cases',
        '6. Add mutation testing for test quality validation',
        '7. Ensure tests are fast (< 1ms per test)',
        '8. Implement test isolation (no shared state)',
        '9. Add descriptive test names and documentation',
        '10. Configure parallel execution'
      ],
      outputFormat: 'JSON object with unit tests implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'testCount', 'coverage', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        testCount: { type: 'number' },
        coverage: { type: 'number', minimum: 0, maximum: 100 },
        testsByComponent: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              component: { type: 'string' },
              testCount: { type: 'number' },
              coverage: { type: 'number' }
            }
          }
        },
        executionTime: { type: 'number', description: 'Average execution time per test in ms' },
        isolated: { type: 'boolean' },
        parallelEnabled: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'continuous-testing', 'unit-tests', 'test-implementation']
}));

// Phase 6.2: Integration Tests Implementation
export const implementIntegrationTestsTask = defineTask('implement-integration-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6.2: Integration Tests Implementation - ${args.projectPath}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Integration Test Engineer',
      task: 'Implement integration tests for component interactions',
      context: {
        projectPath: args.projectPath,
        testStrategy: args.testStrategy,
        infrastructure: args.infrastructure,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify integration points (DB, APIs, services)',
        '2. Implement database integration tests with test containers',
        '3. Add service integration tests',
        '4. Implement message queue integration tests',
        '5. Add file system and external service integration tests',
        '6. Set up test databases and cleanup',
        '7. Implement contract tests for APIs',
        '8. Add integration test fixtures',
        '9. Ensure test data isolation',
        '10. Configure execution with real dependencies'
      ],
      outputFormat: 'JSON object with integration tests implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'testCount', 'integrationPoints', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        testCount: { type: 'number' },
        integrationPoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              testCount: { type: 'number' },
              testContainers: { type: 'boolean' }
            }
          }
        },
        testDataManagement: {
          type: 'object',
          properties: {
            isolation: { type: 'boolean' },
            cleanup: { type: 'boolean' },
            fixtures: { type: 'number' }
          }
        },
        executionTime: { type: 'number', description: 'Average execution time in seconds' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'continuous-testing', 'integration-tests', 'test-implementation']
}));

// Phase 6.3: API Tests Implementation
export const implementApiTestsTask = defineTask('implement-api-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6.3: API Tests Implementation - ${args.projectPath}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'API Test Automation Engineer',
      task: 'Implement comprehensive API tests',
      context: {
        projectPath: args.projectPath,
        testStrategy: args.testStrategy,
        infrastructure: args.infrastructure,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify all API endpoints to test',
        '2. Implement positive path API tests',
        '3. Add negative testing (error cases, validation)',
        '4. Implement schema validation tests',
        '5. Add authentication and authorization tests',
        '6. Implement data-driven API tests',
        '7. Add API contract tests (consumer/provider)',
        '8. Implement API response time assertions',
        '9. Add comprehensive assertion coverage',
        '10. Configure API test data and mocking'
      ],
      outputFormat: 'JSON object with API tests implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'testCount', 'endpoints', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        testCount: { type: 'number' },
        endpoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              endpoint: { type: 'string' },
              method: { type: 'string' },
              testCount: { type: 'number' },
              schemaValidation: { type: 'boolean' }
            }
          }
        },
        contractTesting: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            provider: { type: 'string' },
            consumerContracts: { type: 'number' }
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
  labels: ['agent', 'continuous-testing', 'api-tests', 'test-implementation']
}));

// Phase 6.4: E2E Tests Implementation
export const implementE2eTestsTask = defineTask('implement-e2e-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6.4: E2E Tests Implementation - ${args.projectPath}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'E2E Test Automation Engineer',
      task: 'Implement end-to-end tests for critical user journeys',
      context: {
        projectPath: args.projectPath,
        testStrategy: args.testStrategy,
        infrastructure: args.infrastructure,
        environmentConfig: args.environmentConfig,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify critical user journeys (5-10 journeys)',
        '2. Implement Page Object Model for screens',
        '3. Create E2E tests for each critical journey',
        '4. Add authentication and user flows',
        '5. Implement data setup and teardown',
        '6. Add retry logic for flaky tests',
        '7. Configure screenshots and video recording on failure',
        '8. Implement cross-browser testing (if needed)',
        '9. Add accessibility checks in E2E tests',
        '10. Optimize test execution time'
      ],
      outputFormat: 'JSON object with E2E tests implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'testCount', 'journeys', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        testCount: { type: 'number' },
        journeys: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              journey: { type: 'string' },
              testCount: { type: 'number' },
              pageObjects: { type: 'number' }
            }
          }
        },
        pageObjectModel: {
          type: 'object',
          properties: {
            implemented: { type: 'boolean' },
            pageObjects: { type: 'number' }
          }
        },
        retryStrategy: { type: 'object', properties: { enabled: { type: 'boolean' }, maxRetries: { type: 'number' } } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'continuous-testing', 'e2e-tests', 'test-implementation']
}));

// Phase 7.1: Performance Testing Setup
export const setupPerformanceTestingTask = defineTask('setup-performance-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7.1: Performance Testing Setup - ${args.projectPath}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Performance Test Engineer',
      task: 'Set up performance testing and benchmarking',
      context: {
        projectPath: args.projectPath,
        testStrategy: args.testStrategy,
        qualityGates: args.qualityGates,
        environmentConfig: args.environmentConfig,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Set up performance testing tool (k6, JMeter, Gatling)',
        '2. Define performance test scenarios (load, stress, spike)',
        '3. Implement load tests with realistic user patterns',
        '4. Add stress tests to identify breaking points',
        '5. Configure performance budgets and thresholds',
        '6. Set up performance metrics collection',
        '7. Add performance regression detection',
        '8. Configure performance test reporting',
        '9. Implement continuous performance testing',
        '10. Add performance test data generation'
      ],
      outputFormat: 'JSON object with performance testing setup'
    },
    outputSchema: {
      type: 'object',
      required: ['configured', 'testScenarios', 'artifacts'],
      properties: {
        configured: { type: 'boolean' },
        tool: { type: 'string' },
        testScenarios: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenario: { type: 'string' },
              type: { type: 'string' },
              virtualUsers: { type: 'number' },
              duration: { type: 'number' }
            }
          }
        },
        testCount: { type: 'number' },
        performanceBudgets: {
          type: 'object',
          properties: {
            responseTime: { type: 'number' },
            throughput: { type: 'number' },
            errorRate: { type: 'number' }
          }
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
  labels: ['agent', 'continuous-testing', 'performance-testing', 'benchmarking']
}));

// Phase 7.2: Security Testing Setup
export const setupSecurityTestingTask = defineTask('setup-security-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7.2: Security Testing Setup - ${args.projectPath}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Test Engineer',
      task: 'Set up security testing and vulnerability scanning',
      context: {
        projectPath: args.projectPath,
        testStrategy: args.testStrategy,
        qualityGates: args.qualityGates,
        cicdPlatform: args.cicdPlatform,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Set up SAST (Static Application Security Testing)',
        '2. Configure DAST (Dynamic Application Security Testing)',
        '3. Add dependency vulnerability scanning (Snyk, Dependabot)',
        '4. Implement secret scanning (detect hardcoded credentials)',
        '5. Configure license compliance checking',
        '6. Add container image scanning',
        '7. Set up API security testing (OWASP Top 10)',
        '8. Configure security quality gates',
        '9. Add security test reporting and dashboards',
        '10. Implement vulnerability tracking and remediation'
      ],
      outputFormat: 'JSON object with security testing setup'
    },
    outputSchema: {
      type: 'object',
      required: ['configured', 'tools', 'scanPassed', 'artifacts'],
      properties: {
        configured: { type: 'boolean' },
        tools: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tool: { type: 'string' },
              type: { type: 'string', enum: ['SAST', 'DAST', 'SCA', 'secrets', 'license', 'container'] },
              enabled: { type: 'boolean' },
              blocking: { type: 'boolean' }
            }
          }
        },
        testCount: { type: 'number' },
        vulnerabilities: {
          type: 'object',
          properties: {
            critical: { type: 'number' },
            high: { type: 'number' },
            medium: { type: 'number' },
            low: { type: 'number' }
          }
        },
        scanPassed: { type: 'boolean' },
        complianceChecks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              check: { type: 'string' },
              passed: { type: 'boolean' }
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
  labels: ['agent', 'continuous-testing', 'security-testing', 'vulnerability-scanning']
}));

// Phase 8: Pipeline Validation
export const validatePipelineTask = defineTask('validate-pipeline', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Pipeline Validation - ${args.projectPath}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CI/CD Validation Engineer',
      task: 'Validate complete pipeline execution',
      context: {
        projectPath: args.projectPath,
        cicdPlatform: args.cicdPlatform,
        pipelineStages: args.pipelineStages,
        testImplementations: args.testImplementations,
        qualityGates: args.qualityGates,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Execute full pipeline end-to-end',
        '2. Validate each stage execution and results',
        '3. Check quality gates enforcement',
        '4. Verify test result reporting',
        '5. Validate artifact generation and storage',
        '6. Check notification and feedback mechanisms',
        '7. Verify parallel execution and sharding',
        '8. Validate failure handling and retry logic',
        '9. Check execution time against targets',
        '10. Generate validation report with pass/fail status'
      ],
      outputFormat: 'JSON object with pipeline validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'totalStages', 'passedStages', 'failedStages', 'passRate', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        totalStages: { type: 'number' },
        passedStages: { type: 'number' },
        failedStages: { type: 'number' },
        passRate: { type: 'number', minimum: 0, maximum: 100 },
        stageResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stage: { type: 'string' },
              passed: { type: 'boolean' },
              executionTime: { type: 'number' },
              issues: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        failures: { type: 'array', items: { type: 'string' } },
        qualityGatesEnforced: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'continuous-testing', 'pipeline-validation', 'ci-cd']
}));

// Phase 9: Feedback Mechanisms Configuration
export const configureFeedbackMechanismsTask = defineTask('configure-feedback-mechanisms', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Feedback Mechanisms Configuration - ${args.projectPath}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DevOps Communication Engineer',
      task: 'Configure feedback loops and notifications',
      context: {
        projectPath: args.projectPath,
        cicdPlatform: args.cicdPlatform,
        notificationChannels: args.notificationChannels,
        qualityGates: args.qualityGates,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure Slack/Teams notifications for build status',
        '2. Set up email notifications for failures',
        '3. Add PR/commit status checks integration',
        '4. Configure test result dashboards',
        '5. Set up metrics and trend visualization',
        '6. Add flaky test notifications',
        '7. Configure quality gate failure notifications',
        '8. Set up escalation policies for critical failures',
        '9. Add test execution summaries to PR comments',
        '10. Measure and optimize feedback time'
      ],
      outputFormat: 'JSON object with feedback configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['configured', 'channels', 'averageFeedbackTime', 'artifacts'],
      properties: {
        configured: { type: 'boolean' },
        channels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              channel: { type: 'string' },
              enabled: { type: 'boolean' },
              events: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        rules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rule: { type: 'string' },
              trigger: { type: 'string' },
              recipients: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        averageFeedbackTime: { type: 'number', description: 'Average feedback time in seconds' },
        dashboards: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'continuous-testing', 'feedback', 'notifications']
}));

// Phase 10: Test Data Management Setup
export const setupTestDataManagementTask = defineTask('setup-test-data-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Test Data Management Setup - ${args.projectPath}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Test Data Management Specialist',
      task: 'Set up test data management and isolation',
      context: {
        projectPath: args.projectPath,
        testStrategy: args.testStrategy,
        environmentConfig: args.environmentConfig,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design test data generation strategy',
        '2. Implement test data factories and builders',
        '3. Set up test data isolation per test run',
        '4. Configure test data cleanup and teardown',
        '5. Implement synthetic data generation',
        '6. Add test data versioning and snapshots',
        '7. Set up test database provisioning',
        '8. Configure test data anonymization for production data',
        '9. Implement test data seeding automation',
        '10. Add test data documentation'
      ],
      outputFormat: 'JSON object with test data management configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['configured', 'strategy', 'isolation', 'artifacts'],
      properties: {
        configured: { type: 'boolean' },
        strategy: { type: 'string', enum: ['synthetic', 'masked', 'subset', 'factories'] },
        isolation: { type: 'boolean' },
        cleanup: { type: 'boolean' },
        factories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              generationMethod: { type: 'string' }
            }
          }
        },
        databaseProvisioning: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            tool: { type: 'string' },
            seedingAutomated: { type: 'boolean' }
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
  labels: ['agent', 'continuous-testing', 'test-data', 'data-management']
}));

// Phase 11: Monitoring Setup
export const setupMonitoringTask = defineTask('setup-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Monitoring and Observability Setup - ${args.projectPath}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Observability Engineer',
      task: 'Set up test monitoring and observability',
      context: {
        projectPath: args.projectPath,
        cicdPlatform: args.cicdPlatform,
        testStrategy: args.testStrategy,
        qualityGates: args.qualityGates,
        environmentConfig: args.environmentConfig,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Set up test execution metrics dashboards',
        '2. Configure test trend analysis and visualization',
        '3. Add test coverage tracking over time',
        '4. Set up flakiness detection and tracking',
        '5. Configure test execution time monitoring',
        '6. Add quality gate pass/fail tracking',
        '7. Set up test failure categorization and root cause analysis',
        '8. Configure historical test data retention',
        '9. Add alerting for test health degradation',
        '10. Implement test analytics and insights'
      ],
      outputFormat: 'JSON object with monitoring configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['integrated', 'dashboards', 'metrics', 'alerts', 'artifacts'],
      properties: {
        integrated: { type: 'boolean' },
        dashboards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              url: { type: 'string' },
              metrics: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        metrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              tracked: { type: 'boolean' },
              visualization: { type: 'string' }
            }
          }
        },
        alerts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              alert: { type: 'string' },
              condition: { type: 'string' },
              severity: { type: 'string' }
            }
          }
        },
        trendAnalysis: { type: 'boolean' },
        historicalRetention: { type: 'number', description: 'Days of historical data retention' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'continuous-testing', 'monitoring', 'observability']
}));

// Phase 12: Flakiness Management Setup
export const setupFlakinessManagementTask = defineTask('setup-flakiness-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Flakiness Detection and Management - ${args.projectPath}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Test Reliability Engineer',
      task: 'Set up flakiness detection and remediation',
      context: {
        projectPath: args.projectPath,
        qualityGates: args.qualityGates,
        testImplementations: args.testImplementations,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Implement flaky test detection (multiple runs)',
        '2. Set up automatic flaky test quarantine',
        '3. Configure flakiness scoring and tracking',
        '4. Add flaky test retry with exponential backoff',
        '5. Implement flakiness root cause analysis',
        '6. Set up flaky test reporting and dashboards',
        '7. Configure automatic flaky test creation of issues',
        '8. Add flakiness trends and patterns analysis',
        '9. Implement test stabilization recommendations',
        '10. Set up flakiness quality gate enforcement'
      ],
      outputFormat: 'JSON object with flakiness management configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['configured', 'flakinessRate', 'quarantineEnabled', 'artifacts'],
      properties: {
        configured: { type: 'boolean' },
        flakinessRate: { type: 'number', minimum: 0, maximum: 100 },
        flakyTests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              test: { type: 'string' },
              flakinessScore: { type: 'number' },
              occurrences: { type: 'number' },
              quarantined: { type: 'boolean' }
            }
          }
        },
        quarantineEnabled: { type: 'boolean' },
        retryStrategy: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            maxRetries: { type: 'number' },
            backoff: { type: 'string' }
          }
        },
        automaticIssueCreation: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'continuous-testing', 'flakiness', 'test-reliability']
}));

// Phase 13: Parallel Execution Optimization
export const optimizeParallelExecutionTask = defineTask('optimize-parallel-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 13: Parallel Execution Optimization - ${args.projectPath}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Performance Optimization Engineer',
      task: 'Optimize parallel test execution for speed',
      context: {
        projectPath: args.projectPath,
        parallelization: args.parallelization,
        testImplementations: args.testImplementations,
        qualityGates: args.qualityGates,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze test execution times and bottlenecks',
        '2. Optimize test sharding and distribution',
        '3. Configure optimal worker count',
        '4. Implement test balancing across workers',
        '5. Optimize test startup and teardown times',
        '6. Add test result caching and incremental execution',
        '7. Configure distributed test execution (cloud runners)',
        '8. Optimize test dependencies and isolation',
        '9. Measure speedup factor from parallelization',
        '10. Generate optimization recommendations'
      ],
      outputFormat: 'JSON object with optimization results'
    },
    outputSchema: {
      type: 'object',
      required: ['optimized', 'buildTime', 'parallelizationFactor', 'bottlenecks', 'artifacts'],
      properties: {
        optimized: { type: 'boolean' },
        buildTime: { type: 'number', description: 'Optimized build time in seconds' },
        previousBuildTime: { type: 'number' },
        parallelizationFactor: { type: 'number', description: 'Speedup from parallelization' },
        workerConfig: {
          type: 'object',
          properties: {
            workers: { type: 'number' },
            shards: { type: 'number' },
            distributedExecution: { type: 'boolean' }
          }
        },
        bottlenecks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              area: { type: 'string' },
              impact: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        caching: { type: 'object', properties: { enabled: { type: 'boolean' }, hitRate: { type: 'number' } } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'continuous-testing', 'optimization', 'parallelization']
}));

// Phase 14: Shift-Right Testing Implementation
export const implementShiftRightTestingTask = defineTask('implement-shift-right-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 14: Shift-Right Testing Implementation - ${args.projectPath}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Production Testing Engineer',
      task: 'Implement shift-right testing in production',
      context: {
        projectPath: args.projectPath,
        environmentConfig: args.environmentConfig,
        monitoringSetup: args.monitoringSetup,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Set up synthetic monitoring in production',
        '2. Implement feature flags for progressive rollout',
        '3. Configure A/B testing infrastructure',
        '4. Set up canary deployments with automated testing',
        '5. Implement chaos engineering experiments',
        '6. Configure production smoke tests',
        '7. Add real user monitoring (RUM)',
        '8. Set up error tracking and alerting',
        '9. Implement production health dashboards',
        '10. Configure automatic rollback on production issues'
      ],
      outputFormat: 'JSON object with shift-right testing configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['enabled', 'syntheticMonitoring', 'featureFlags', 'artifacts'],
      properties: {
        enabled: { type: 'boolean' },
        syntheticMonitoring: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            checks: { type: 'number' },
            frequency: { type: 'string' }
          }
        },
        featureFlags: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            provider: { type: 'string' },
            flags: { type: 'number' }
          }
        },
        canaryDeployments: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            trafficPercentage: { type: 'number' },
            automatedTesting: { type: 'boolean' }
          }
        },
        chaosEngineering: { type: 'object', properties: { enabled: { type: 'boolean' } } },
        realUserMonitoring: { type: 'boolean' },
        automaticRollback: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'continuous-testing', 'shift-right', 'production-testing']
}));

// Phase 15: Documentation Generation
export const generateDocumentationTask = defineTask('generate-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 15: Documentation Generation - ${args.projectPath}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Documentation Specialist',
      task: 'Generate comprehensive continuous testing documentation',
      context: {
        projectPath: args.projectPath,
        cicdPlatform: args.cicdPlatform,
        testStrategy: args.testStrategy,
        pipelineStages: args.pipelineStages,
        qualityGates: args.qualityGates,
        testImplementations: args.testImplementations,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create pipeline overview documentation',
        '2. Document test strategy and pyramid',
        '3. Write onboarding guide for developers',
        '4. Document quality gates and thresholds',
        '5. Create troubleshooting guide',
        '6. Document test execution procedures',
        '7. Write monitoring and alerting guide',
        '8. Create test data management documentation',
        '9. Document best practices and patterns',
        '10. Generate architecture diagrams and flowcharts'
      ],
      outputFormat: 'JSON object with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'pipelineDocPath', 'onboardingGuidePath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        pipelineDocPath: { type: 'string' },
        testStrategyDocPath: { type: 'string' },
        onboardingGuidePath: { type: 'string' },
        troubleshootingPath: { type: 'string' },
        qualityGatesDocPath: { type: 'string' },
        bestPracticesPath: { type: 'string' },
        architectureDiagramPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'continuous-testing', 'documentation', 'technical-writing']
}));

// Phase 16: Final Pipeline Execution
export const executeFinalPipelineTask = defineTask('execute-final-pipeline', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 16: Final Pipeline Execution - ${args.projectPath}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CI/CD Execution Engineer',
      task: 'Execute final end-to-end pipeline and collect metrics',
      context: {
        projectPath: args.projectPath,
        cicdPlatform: args.cicdPlatform,
        repositoryUrl: args.repositoryUrl,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Trigger full pipeline execution',
        '2. Monitor all stages and collect results',
        '3. Calculate pass rate across all test types',
        '4. Measure overall test coverage',
        '5. Measure total build and test execution time',
        '6. Identify any quality gate failures',
        '7. Collect test failure details and categorization',
        '8. Identify uncovered areas and gaps',
        '9. Generate comprehensive execution report',
        '10. Provide production readiness assessment'
      ],
      outputFormat: 'JSON object with final execution results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'passRate', 'coverage', 'buildTime', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        passRate: { type: 'number', minimum: 0, maximum: 100 },
        coverage: { type: 'number', minimum: 0, maximum: 100 },
        buildTime: { type: 'number', description: 'Total build time in seconds' },
        testResults: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            passed: { type: 'number' },
            failed: { type: 'number' },
            skipped: { type: 'number' }
          }
        },
        qualityGateResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gate: { type: 'string' },
              passed: { type: 'boolean' },
              actual: { type: 'number' },
              threshold: { type: 'number' }
            }
          }
        },
        uncoveredAreas: { type: 'array', items: { type: 'string' } },
        reportPath: { type: 'string' },
        productionReady: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'continuous-testing', 'final-execution', 'validation']
}));

// Phase 17: Continuous Improvement Setup
export const setupContinuousImprovementTask = defineTask('setup-continuous-improvement', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 17: Continuous Improvement Setup - ${args.projectPath}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Continuous Improvement Lead',
      task: 'Set up continuous improvement mechanisms for testing',
      context: {
        projectPath: args.projectPath,
        testMetrics: args.testMetrics,
        qualityGates: args.qualityGates,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Set up test metrics baseline and tracking',
        '2. Define improvement areas and KPIs',
        '3. Configure automated test health reports',
        '4. Set up regular retrospective process',
        '5. Implement test suite optimization suggestions',
        '6. Configure test debt tracking',
        '7. Set up periodic quality review cadence',
        '8. Implement test effectiveness measurements',
        '9. Add test ROI tracking',
        '10. Create continuous improvement roadmap'
      ],
      outputFormat: 'JSON object with continuous improvement configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['enabled', 'reviewCadence', 'areas', 'artifacts'],
      properties: {
        enabled: { type: 'boolean' },
        reviewCadence: { type: 'string' },
        areas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              area: { type: 'string' },
              baseline: { type: 'number' },
              target: { type: 'number' },
              priority: { type: 'string' }
            }
          }
        },
        kpis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              kpi: { type: 'string' },
              current: { type: 'number' },
              target: { type: 'number' }
            }
          }
        },
        automatedReports: { type: 'boolean' },
        retrospectiveProcess: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'continuous-testing', 'continuous-improvement', 'optimization']
}));

// Phase 18: Final Assessment and Scoring
export const computeFinalAssessmentTask = defineTask('compute-final-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 18: Final Assessment and Scoring - ${args.projectPath}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Continuous Testing Maturity Assessor',
      task: 'Compute final continuous testing maturity score and readiness',
      context: {
        projectPath: args.projectPath,
        currentState: args.currentState,
        testInfrastructure: args.testInfrastructure,
        testStrategyDesign: args.testStrategyDesign,
        pipelineStages: args.pipelineStages,
        qualityGates: args.qualityGates,
        testImplementations: args.testImplementations,
        pipelineValidation: args.pipelineValidation,
        feedbackMechanisms: args.feedbackMechanisms,
        monitoringSetup: args.monitoringSetup,
        flakinessManagement: args.flakinessManagement,
        parallelOptimization: args.parallelOptimization,
        shiftRightTesting: args.shiftRightTesting,
        finalExecution: args.finalExecution,
        continuousImprovement: args.continuousImprovement,
        qualityGates: args.qualityGates,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Calculate continuous testing maturity score (0-100)',
        '2. Assess test pyramid balance and completeness',
        '3. Evaluate pipeline efficiency and performance',
        '4. Assess quality gate effectiveness',
        '5. Evaluate feedback loop speed',
        '6. Assess test reliability and stability',
        '7. Evaluate monitoring and observability maturity',
        '8. Assess shift-left and shift-right practices',
        '9. Provide production readiness verdict',
        '10. Generate comprehensive assessment report with recommendations'
      ],
      outputFormat: 'JSON object with final assessment and metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['continuousTestingScore', 'pipelineConfig', 'testMetrics', 'productionReady', 'verdict', 'artifacts'],
      properties: {
        continuousTestingScore: { type: 'number', minimum: 0, maximum: 100 },
        maturityDimensions: {
          type: 'object',
          properties: {
            automation: { type: 'number' },
            coverage: { type: 'number' },
            speed: { type: 'number' },
            reliability: { type: 'number' },
            observability: { type: 'number' },
            shiftLeft: { type: 'number' },
            shiftRight: { type: 'number' }
          }
        },
        pipelineConfig: {
          type: 'object',
          properties: {
            stages: { type: 'number' },
            qualityGates: { type: 'number' },
            parallelizationEnabled: { type: 'boolean' },
            shiftRightEnabled: { type: 'boolean' }
          }
        },
        testMetrics: {
          type: 'object',
          properties: {
            totalTests: { type: 'number' },
            coverage: { type: 'number' },
            passRate: { type: 'number' },
            buildTime: { type: 'number' },
            feedbackTime: { type: 'number' },
            flakinessRate: { type: 'number' }
          }
        },
        qualityGatesMet: {
          type: 'object',
          properties: {
            coverage: { type: 'boolean' },
            passRate: { type: 'boolean' },
            buildTime: { type: 'boolean' },
            flakiness: { type: 'boolean' }
          }
        },
        productionReady: { type: 'boolean' },
        verdict: { type: 'string' },
        recommendation: { type: 'string' },
        strengths: { type: 'array', items: { type: 'string' } },
        areasForImprovement: { type: 'array', items: { type: 'string' } },
        nextSteps: { type: 'array', items: { type: 'string' } },
        metricsReportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'continuous-testing', 'assessment', 'maturity-scoring']
}));
