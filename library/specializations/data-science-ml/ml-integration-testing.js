/**
 * @process specializations/data-science-ml/ml-integration-testing
 * @description ML System Integration Testing - Validate end-to-end ML pipeline integration across data ingestion,
 * preprocessing, model training, serving, and monitoring components with quality gates and validation loops.
 * @inputs { systemName: string, components: array, testEnvironment: string, integrationScenarios?: array, performanceRequirements?: object, targetCoverage?: number }
 * @outputs { success: boolean, testResults: object, integrationScore: number, performanceMetrics: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/data-science-ml/ml-integration-testing', {
 *   systemName: 'Recommendation Engine',
 *   components: ['data-pipeline', 'feature-store', 'model-service', 'monitoring'],
 *   testEnvironment: 'staging',
 *   integrationScenarios: [
 *     { name: 'end-to-end-prediction', type: 'e2e' },
 *     { name: 'model-update-rollout', type: 'deployment' },
 *     { name: 'data-drift-detection', type: 'monitoring' }
 *   ],
 *   performanceRequirements: {
 *     latency: { p95: 100, p99: 200 },
 *     throughput: { min: 1000 },
 *     accuracy: { min: 0.85 }
 *   },
 *   targetCoverage: 85
 * });
 *
 * @references
 * - ML Testing: A Guide: https://madewithml.com/courses/mlops/testing/
 * - Google ML Testing Best Practices: https://developers.google.com/machine-learning/testing-debugging
 * - AWS ML Testing: https://aws.amazon.com/blogs/machine-learning/testing-approaches-for-amazon-sagemaker-ml-models/
 * - Microsoft ML Testing: https://learn.microsoft.com/en-us/azure/architecture/guide/testing/mission-critical-deployment-testing
 * - Integration Testing Patterns: https://martinfowler.com/articles/microservice-testing/
 * - ML Observability: https://neptune.ai/blog/ml-model-testing
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    systemName,
    components = [],
    testEnvironment = 'staging',
    integrationScenarios = [],
    performanceRequirements = {},
    targetCoverage = 85,
    dataFixtures = null,
    modelVersions = null,
    timeoutMinutes = 30,
    outputDir = 'ml-integration-testing-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const testResults = [];
  let integrationScore = 0;

  ctx.log('info', `Starting ML System Integration Testing: ${systemName}`);
  ctx.log('info', `Test Environment: ${testEnvironment}`);
  ctx.log('info', `Components: ${components.join(', ')}`);

  // ============================================================================
  // PHASE 1: TEST ENVIRONMENT SETUP AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Setting up and validating test environment');
  const envSetup = await ctx.task(testEnvironmentSetupTask, {
    systemName,
    testEnvironment,
    components,
    outputDir
  });

  if (!envSetup.success) {
    return {
      success: false,
      error: 'Test environment setup failed',
      details: envSetup,
      metadata: { processId: 'specializations/data-science-ml/ml-integration-testing', timestamp: startTime }
    };
  }

  artifacts.push(...envSetup.artifacts);

  // Quality Gate: Verify all required components are available
  if (envSetup.unavailableComponents.length > 0) {
    await ctx.breakpoint({
      question: `${envSetup.unavailableComponents.length} component(s) unavailable: ${envSetup.unavailableComponents.join(', ')}. Continue with partial integration testing?`,
      title: 'Component Availability Warning',
      context: {
        runId: ctx.runId,
        unavailableComponents: envSetup.unavailableComponents,
        availableComponents: envSetup.availableComponents,
        files: envSetup.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 2: TEST DATA AND FIXTURES PREPARATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Preparing test data and fixtures');
  const testDataPrep = await ctx.task(testDataPreparationTask, {
    systemName,
    components,
    dataFixtures,
    testEnvironment,
    outputDir
  });

  if (!testDataPrep.success) {
    return {
      success: false,
      error: 'Test data preparation failed',
      details: testDataPrep,
      metadata: { processId: 'specializations/data-science-ml/ml-integration-testing', timestamp: startTime }
    };
  }

  artifacts.push(...testDataPrep.artifacts);

  // ============================================================================
  // PHASE 3: COMPONENT HEALTH CHECKS (PARALLEL)
  // ============================================================================

  ctx.log('info', 'Phase 3: Running component health checks in parallel');

  const healthCheckTasks = envSetup.availableComponents.map(component =>
    () => ctx.task(componentHealthCheckTask, {
      systemName,
      component,
      testEnvironment,
      outputDir
    })
  );

  const healthCheckResults = await ctx.parallel.all(healthCheckTasks);

  const unhealthyComponents = healthCheckResults.filter(r => !r.healthy);
  artifacts.push(...healthCheckResults.flatMap(r => r.artifacts));

  // Quality Gate: All components must be healthy
  if (unhealthyComponents.length > 0) {
    await ctx.breakpoint({
      question: `${unhealthyComponents.length} component(s) failed health checks: ${unhealthyComponents.map(c => c.component).join(', ')}. Review and approve to continue?`,
      title: 'Component Health Check Failures',
      context: {
        runId: ctx.runId,
        unhealthyComponents: unhealthyComponents.map(c => ({
          component: c.component,
          issues: c.issues
        })),
        files: unhealthyComponents.flatMap(c => c.artifacts).map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 4: INTEGRATION SCENARIO PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 4: Planning integration test scenarios');
  const scenarioPlanning = await ctx.task(integrationScenarioPlanningTask, {
    systemName,
    components: envSetup.availableComponents,
    userScenarios: integrationScenarios,
    performanceRequirements,
    targetCoverage,
    outputDir
  });

  artifacts.push(...scenarioPlanning.artifacts);

  // Breakpoint: Review test plan
  await ctx.breakpoint({
    question: `Integration test plan generated with ${scenarioPlanning.scenarios.length} scenarios covering ${scenarioPlanning.estimatedCoverage}% of system. Review and approve to execute?`,
    title: 'Integration Test Plan Review',
    context: {
      runId: ctx.runId,
      scenarios: scenarioPlanning.scenarios.map(s => ({
        name: s.name,
        type: s.type,
        components: s.components,
        estimatedDuration: s.estimatedDuration
      })),
      estimatedCoverage: scenarioPlanning.estimatedCoverage,
      files: scenarioPlanning.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // PHASE 5: UNIT INTEGRATION TESTS (COMPONENT PAIRS)
  // ============================================================================

  ctx.log('info', 'Phase 5: Running unit integration tests for component pairs');

  const unitIntegrationTasks = scenarioPlanning.componentPairs.map(pair =>
    () => ctx.task(unitIntegrationTestTask, {
      systemName,
      componentA: pair.from,
      componentB: pair.to,
      testData: testDataPrep.fixtures[pair.fixtureKey],
      testEnvironment,
      outputDir
    })
  );

  const unitIntegrationResults = await ctx.parallel.all(unitIntegrationTasks);

  testResults.push(...unitIntegrationResults.map(r => ({
    phase: 'unit-integration',
    type: 'component-pair',
    ...r
  })));

  artifacts.push(...unitIntegrationResults.flatMap(r => r.artifacts));

  const failedUnitTests = unitIntegrationResults.filter(r => !r.passed);
  const unitIntegrationPassRate = ((unitIntegrationResults.length - failedUnitTests.length) / unitIntegrationResults.length) * 100;

  ctx.log('info', `Unit integration pass rate: ${unitIntegrationPassRate.toFixed(2)}%`);

  // Quality Gate: Minimum pass rate for unit integration
  if (unitIntegrationPassRate < 80) {
    await ctx.breakpoint({
      question: `Unit integration pass rate: ${unitIntegrationPassRate.toFixed(2)}%. ${failedUnitTests.length} test(s) failed. Review failures and approve to continue?`,
      title: 'Unit Integration Test Failures',
      context: {
        runId: ctx.runId,
        passRate: unitIntegrationPassRate,
        failedTests: failedUnitTests.map(t => ({
          componentA: t.componentA,
          componentB: t.componentB,
          error: t.error
        })),
        files: failedUnitTests.flatMap(t => t.artifacts).map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 6: END-TO-END INTEGRATION TESTS
  // ============================================================================

  ctx.log('info', 'Phase 6: Running end-to-end integration tests');

  const e2eScenarios = scenarioPlanning.scenarios.filter(s => s.type === 'e2e');
  const e2eTestResults = [];

  for (const scenario of e2eScenarios) {
    ctx.log('info', `Running E2E scenario: ${scenario.name}`);

    const e2eResult = await ctx.task(endToEndIntegrationTestTask, {
      systemName,
      scenario,
      testData: testDataPrep.fixtures[scenario.fixtureKey],
      performanceRequirements,
      testEnvironment,
      outputDir
    });

    e2eTestResults.push(e2eResult);
    testResults.push({
      phase: 'e2e-integration',
      type: 'end-to-end',
      scenario: scenario.name,
      ...e2eResult
    });

    artifacts.push(...e2eResult.artifacts);

    // Quality Gate: Critical E2E scenarios must pass
    if (scenario.critical && !e2eResult.passed) {
      await ctx.breakpoint({
        question: `Critical E2E scenario "${scenario.name}" failed: ${e2eResult.error}. Review and approve to continue?`,
        title: 'Critical E2E Test Failure',
        context: {
          runId: ctx.runId,
          scenario: scenario.name,
          error: e2eResult.error,
          logs: e2eResult.logs,
          files: e2eResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
        }
      });
    }
  }

  const e2ePassRate = (e2eTestResults.filter(r => r.passed).length / e2eTestResults.length) * 100;
  ctx.log('info', `E2E integration pass rate: ${e2ePassRate.toFixed(2)}%`);

  // ============================================================================
  // PHASE 7: PERFORMANCE AND LOAD INTEGRATION TESTS
  // ============================================================================

  ctx.log('info', 'Phase 7: Running performance and load integration tests');

  const performanceScenarios = scenarioPlanning.scenarios.filter(s => s.type === 'performance' || s.type === 'load');

  const performanceTasks = performanceScenarios.map(scenario =>
    () => ctx.task(performanceIntegrationTestTask, {
      systemName,
      scenario,
      testData: testDataPrep.fixtures[scenario.fixtureKey],
      performanceRequirements,
      testEnvironment,
      outputDir
    })
  );

  const performanceResults = await ctx.parallel.all(performanceTasks);

  testResults.push(...performanceResults.map(r => ({
    phase: 'performance-integration',
    type: r.testType,
    ...r
  })));

  artifacts.push(...performanceResults.flatMap(r => r.artifacts));

  // Quality Gate: Performance requirements must be met
  const performanceViolations = performanceResults.filter(r => !r.meetsRequirements);
  if (performanceViolations.length > 0) {
    await ctx.breakpoint({
      question: `${performanceViolations.length} performance test(s) failed to meet requirements. Review metrics and approve to continue?`,
      title: 'Performance Requirements Not Met',
      context: {
        runId: ctx.runId,
        violations: performanceViolations.map(v => ({
          scenario: v.scenario,
          metric: v.violatedMetric,
          actual: v.actualValue,
          required: v.requiredValue
        })),
        files: performanceViolations.flatMap(v => v.artifacts).map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 8: DATA QUALITY AND MODEL BEHAVIOR INTEGRATION TESTS
  // ============================================================================

  ctx.log('info', 'Phase 8: Running data quality and model behavior integration tests');

  const [
    dataPipelineTest,
    modelBehaviorTest,
    dataDriftTest,
    modelDriftTest
  ] = await ctx.parallel.all([
    () => ctx.task(dataPipelineIntegrationTestTask, {
      systemName,
      testData: testDataPrep.fixtures.dataPipeline,
      testEnvironment,
      outputDir
    }),
    () => ctx.task(modelBehaviorIntegrationTestTask, {
      systemName,
      modelVersions,
      testData: testDataPrep.fixtures.modelBehavior,
      testEnvironment,
      outputDir
    }),
    () => ctx.task(dataDriftIntegrationTestTask, {
      systemName,
      testData: testDataPrep.fixtures.dataDrift,
      testEnvironment,
      outputDir
    }),
    () => ctx.task(modelDriftIntegrationTestTask, {
      systemName,
      modelVersions,
      testData: testDataPrep.fixtures.modelDrift,
      testEnvironment,
      outputDir
    })
  ]);

  testResults.push(
    { phase: 'data-quality-integration', type: 'data-pipeline', ...dataPipelineTest },
    { phase: 'model-behavior-integration', type: 'model-behavior', ...modelBehaviorTest },
    { phase: 'drift-detection-integration', type: 'data-drift', ...dataDriftTest },
    { phase: 'drift-detection-integration', type: 'model-drift', ...modelDriftTest }
  );

  artifacts.push(
    ...dataPipelineTest.artifacts,
    ...modelBehaviorTest.artifacts,
    ...dataDriftTest.artifacts,
    ...modelDriftTest.artifacts
  );

  // ============================================================================
  // PHASE 9: FAILURE RECOVERY AND RESILIENCE TESTS
  // ============================================================================

  ctx.log('info', 'Phase 9: Running failure recovery and resilience tests');

  const resilienceScenarios = scenarioPlanning.scenarios.filter(s => s.type === 'resilience' || s.type === 'failure');

  const resilienceResults = [];
  for (const scenario of resilienceScenarios) {
    ctx.log('info', `Running resilience scenario: ${scenario.name}`);

    const resilienceResult = await ctx.task(resilienceIntegrationTestTask, {
      systemName,
      scenario,
      testEnvironment,
      outputDir
    });

    resilienceResults.push(resilienceResult);
    testResults.push({
      phase: 'resilience-integration',
      type: 'resilience',
      scenario: scenario.name,
      ...resilienceResult
    });

    artifacts.push(...resilienceResult.artifacts);
  }

  // ============================================================================
  // PHASE 10: MONITORING AND OBSERVABILITY INTEGRATION TESTS
  // ============================================================================

  ctx.log('info', 'Phase 10: Running monitoring and observability integration tests');

  const monitoringTest = await ctx.task(monitoringIntegrationTestTask, {
    systemName,
    components: envSetup.availableComponents,
    testEnvironment,
    outputDir
  });

  testResults.push({
    phase: 'monitoring-integration',
    type: 'observability',
    ...monitoringTest
  });

  artifacts.push(...monitoringTest.artifacts);

  // ============================================================================
  // PHASE 11: INTEGRATION TEST COVERAGE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 11: Analyzing integration test coverage');

  const coverageAnalysis = await ctx.task(integrationCoverageAnalysisTask, {
    systemName,
    components,
    scenarios: scenarioPlanning.scenarios,
    testResults,
    targetCoverage,
    outputDir
  });

  artifacts.push(...coverageAnalysis.artifacts);

  // Quality Gate: Coverage threshold
  const actualCoverage = coverageAnalysis.overallCoverage;
  if (actualCoverage < targetCoverage) {
    await ctx.breakpoint({
      question: `Integration test coverage: ${actualCoverage.toFixed(2)}%/${targetCoverage}%. Coverage target not met. Review gaps and approve to continue?`,
      title: 'Coverage Target Not Met',
      context: {
        runId: ctx.runId,
        actualCoverage,
        targetCoverage,
        uncoveredComponents: coverageAnalysis.uncoveredComponents,
        uncoveredInteractions: coverageAnalysis.uncoveredInteractions,
        files: coverageAnalysis.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 12: INTEGRATION SCORE CALCULATION
  // ============================================================================

  ctx.log('info', 'Phase 12: Calculating overall integration score');

  const scoringResult = await ctx.task(integrationScoringTask, {
    systemName,
    testResults,
    coverageAnalysis,
    performanceResults,
    healthCheckResults,
    targetCoverage,
    outputDir
  });

  integrationScore = scoringResult.overallScore;
  artifacts.push(...scoringResult.artifacts);

  ctx.log('info', `Overall integration score: ${integrationScore.toFixed(2)}/100`);

  // ============================================================================
  // PHASE 13: COMPREHENSIVE TEST REPORT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 13: Generating comprehensive test report');

  const testReport = await ctx.task(integrationTestReportTask, {
    systemName,
    components,
    testEnvironment,
    testResults,
    coverageAnalysis,
    scoringResult,
    integrationScore,
    performanceRequirements,
    targetCoverage,
    outputDir
  });

  artifacts.push(...testReport.artifacts);

  // ============================================================================
  // PHASE 14: FINAL REVIEW AND APPROVAL
  // ============================================================================

  ctx.log('info', 'Phase 14: Final integration testing review');

  const finalReview = await ctx.task(finalIntegrationReviewTask, {
    systemName,
    integrationScore,
    testResults,
    coverageAnalysis,
    performanceResults,
    resilienceResults,
    monitoringTest,
    testReport,
    outputDir
  });

  artifacts.push(...finalReview.artifacts);

  // Final Breakpoint: Deployment approval
  const allTestsPassed = testResults.every(t => t.passed !== false);
  await ctx.breakpoint({
    question: `Integration testing complete. Score: ${integrationScore.toFixed(2)}/100. Coverage: ${actualCoverage.toFixed(2)}%. ${finalReview.verdict}. Approve system for deployment?`,
    title: 'Final Integration Test Approval',
    context: {
      runId: ctx.runId,
      summary: {
        systemName,
        integrationScore,
        coverage: actualCoverage,
        targetCoverage,
        totalTests: testResults.length,
        passedTests: testResults.filter(t => t.passed !== false).length,
        failedTests: testResults.filter(t => t.passed === false).length,
        allTestsPassed
      },
      verdict: finalReview.verdict,
      recommendation: finalReview.recommendation,
      files: [
        { path: testReport.reportPath, format: 'markdown', label: 'Test Report' },
        { path: coverageAnalysis.reportPath, format: 'markdown', label: 'Coverage Report' },
        { path: scoringResult.reportPath, format: 'json', label: 'Scoring Details' },
        { path: finalReview.reportPath, format: 'markdown', label: 'Final Review' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: allTestsPassed && integrationScore >= 70,
    systemName,
    testEnvironment,
    integrationScore,
    integrationPassed: allTestsPassed,
    coverage: {
      overall: actualCoverage,
      target: targetCoverage,
      met: actualCoverage >= targetCoverage
    },
    testResults: {
      total: testResults.length,
      passed: testResults.filter(t => t.passed !== false).length,
      failed: testResults.filter(t => t.passed === false).length,
      byPhase: {
        unitIntegration: unitIntegrationResults.length,
        e2eIntegration: e2eTestResults.length,
        performance: performanceResults.length,
        dataQuality: 1,
        modelBehavior: 1,
        drift: 2,
        resilience: resilienceResults.length,
        monitoring: 1
      }
    },
    performanceMetrics: {
      latency: performanceResults.find(r => r.metrics?.latency)?.metrics?.latency || null,
      throughput: performanceResults.find(r => r.metrics?.throughput)?.metrics?.throughput || null,
      accuracy: modelBehaviorTest.accuracy || null,
      meetsRequirements: performanceViolations.length === 0
    },
    finalReview: {
      verdict: finalReview.verdict,
      approved: finalReview.approved,
      recommendation: finalReview.recommendation,
      concerns: finalReview.concerns
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/data-science-ml/ml-integration-testing',
      timestamp: startTime,
      testEnvironment
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: Test Environment Setup
export const testEnvironmentSetupTask = defineTask('test-environment-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Test Environment Setup - ${args.systemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'MLOps Engineer specializing in testing infrastructure',
      task: 'Set up and validate test environment for ML system integration testing',
      context: {
        systemName: args.systemName,
        testEnvironment: args.testEnvironment,
        components: args.components,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Verify test environment exists and is accessible',
        '2. Check each component is deployed and reachable',
        '3. Validate component versions match expected versions',
        '4. Set up test namespaces or isolation if needed',
        '5. Configure test credentials and access tokens',
        '6. Initialize test database or storage if required',
        '7. Set up logging and tracing for test execution',
        '8. Create test output directories',
        '9. Verify network connectivity between components',
        '10. Document unavailable or unhealthy components',
        '11. Return setup status with component availability'
      ],
      outputFormat: 'JSON object with setup status and component details'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'availableComponents', 'unavailableComponents', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        testEnvironment: { type: 'string' },
        availableComponents: { type: 'array', items: { type: 'string' } },
        unavailableComponents: { type: 'array', items: { type: 'string' } },
        componentVersions: {
          type: 'object',
          additionalProperties: { type: 'string' }
        },
        networkTopology: {
          type: 'object',
          description: 'Map of component connections'
        },
        testCredentials: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'integration-testing', 'setup', 'environment']
}));

// Phase 2: Test Data Preparation
export const testDataPreparationTask = defineTask('test-data-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Test Data Preparation - ${args.systemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Test Engineer specializing in test data management',
      task: 'Prepare test data fixtures for integration testing scenarios',
      context: {
        systemName: args.systemName,
        components: args.components,
        dataFixtures: args.dataFixtures,
        testEnvironment: args.testEnvironment,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Generate or load test data fixtures for each component',
        '2. Create synthetic data covering edge cases and normal scenarios',
        '3. Prepare golden datasets with expected outputs',
        '4. Set up test data for data pipeline integration',
        '5. Create test data for model behavior validation',
        '6. Generate data drift scenarios (shifted distributions)',
        '7. Prepare load test data (high volume)',
        '8. Create malformed data for error handling tests',
        '9. Set up test data versioning and tracking',
        '10. Save all fixtures to test environment storage',
        '11. Document test data characteristics and usage',
        '12. Return fixture paths and metadata'
      ],
      outputFormat: 'JSON object with test data fixtures and paths'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'fixtures', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        fixtures: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              rows: { type: 'number' },
              type: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        fixtureSummary: {
          type: 'object',
          properties: {
            totalFixtures: { type: 'number' },
            totalRows: { type: 'number' },
            storageSize: { type: 'string' }
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
  labels: ['agent', 'integration-testing', 'test-data', 'preparation']
}));

// Phase 3: Component Health Check
export const componentHealthCheckTask = defineTask('component-health-check', (args, taskCtx) => ({
  kind: 'agent',
  title: `Component Health Check - ${args.component}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Site Reliability Engineer',
      task: 'Perform comprehensive health check on ML system component',
      context: {
        systemName: args.systemName,
        component: args.component,
        testEnvironment: args.testEnvironment,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Call component health endpoint or status API',
        '2. Check component uptime and availability',
        '3. Verify resource usage (CPU, memory, disk)',
        '4. Test basic component functionality',
        '5. Check dependency health (databases, message queues, etc.)',
        '6. Validate configuration and environment variables',
        '7. Check logs for recent errors or warnings',
        '8. Test authentication and authorization',
        '9. Measure response time for health check',
        '10. Document any issues or degraded performance',
        '11. Return health status with detailed metrics'
      ],
      outputFormat: 'JSON object with health status and metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['component', 'healthy', 'artifacts'],
      properties: {
        component: { type: 'string' },
        healthy: { type: 'boolean' },
        status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy', 'unreachable'] },
        uptime: { type: 'number', description: 'Uptime in seconds' },
        responseTime: { type: 'number', description: 'Health check response time in ms' },
        resourceUsage: {
          type: 'object',
          properties: {
            cpu: { type: 'number' },
            memory: { type: 'number' },
            disk: { type: 'number' }
          }
        },
        dependencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              healthy: { type: 'boolean' }
            }
          }
        },
        issues: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'integration-testing', 'health-check', `component-${args.component}`]
}));

// Phase 4: Integration Scenario Planning
export const integrationScenarioPlanningTask = defineTask('integration-scenario-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Integration Scenario Planning - ${args.systemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior Test Architect specializing in ML systems',
      task: 'Plan comprehensive integration test scenarios covering all component interactions',
      context: {
        systemName: args.systemName,
        components: args.components,
        userScenarios: args.userScenarios,
        performanceRequirements: args.performanceRequirements,
        targetCoverage: args.targetCoverage,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze component architecture and identify all integration points',
        '2. Map component pairs and data flows',
        '3. Design unit integration tests for each component pair',
        '4. Design end-to-end integration scenarios',
        '5. Design performance and load test scenarios',
        '6. Design data quality integration tests',
        '7. Design model behavior integration tests',
        '8. Design failure and resilience scenarios',
        '9. Design monitoring and observability tests',
        '10. Incorporate user-provided scenarios',
        '11. Estimate test coverage for planned scenarios',
        '12. Prioritize scenarios by criticality',
        '13. Estimate duration and resource requirements',
        '14. Generate test plan document with all scenarios'
      ],
      outputFormat: 'JSON object with test scenarios and coverage estimate'
    },
    outputSchema: {
      type: 'object',
      required: ['scenarios', 'componentPairs', 'estimatedCoverage', 'artifacts'],
      properties: {
        scenarios: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['e2e', 'performance', 'load', 'resilience', 'failure', 'data-quality', 'model-behavior'] },
              components: { type: 'array', items: { type: 'string' } },
              description: { type: 'string' },
              fixtureKey: { type: 'string' },
              critical: { type: 'boolean' },
              estimatedDuration: { type: 'number' }
            }
          }
        },
        componentPairs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              from: { type: 'string' },
              to: { type: 'string' },
              fixtureKey: { type: 'string' }
            }
          }
        },
        estimatedCoverage: { type: 'number', minimum: 0, maximum: 100 },
        totalScenarios: { type: 'number' },
        criticalScenarios: { type: 'number' },
        estimatedDuration: { type: 'number', description: 'Total estimated duration in minutes' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'integration-testing', 'planning', 'scenarios']
}));

// Phase 5: Unit Integration Test (Component Pair)
export const unitIntegrationTestTask = defineTask('unit-integration-test', (args, taskCtx) => ({
  kind: 'agent',
  title: `Unit Integration Test - ${args.componentA} → ${args.componentB}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Integration Test Engineer',
      task: 'Test integration between two ML system components',
      context: {
        systemName: args.systemName,
        componentA: args.componentA,
        componentB: args.componentB,
        testData: args.testData,
        testEnvironment: args.testEnvironment,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Send test data from component A',
        '2. Verify component A processes and sends data correctly',
        '3. Verify component B receives data correctly',
        '4. Check data format and schema compatibility',
        '5. Verify data transformation or enrichment',
        '6. Test error handling for invalid data',
        '7. Test retry logic for transient failures',
        '8. Measure latency between components',
        '9. Verify logging and tracing propagation',
        '10. Check idempotency if applicable',
        '11. Document any integration issues',
        '12. Return pass/fail status with metrics'
      ],
      outputFormat: 'JSON object with test results'
    },
    outputSchema: {
      type: 'object',
      required: ['componentA', 'componentB', 'passed', 'artifacts'],
      properties: {
        componentA: { type: 'string' },
        componentB: { type: 'string' },
        passed: { type: 'boolean' },
        testCases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              passed: { type: 'boolean' },
              duration: { type: 'number' }
            }
          }
        },
        latency: { type: 'number', description: 'Average latency in ms' },
        dataValidation: {
          type: 'object',
          properties: {
            schemaValid: { type: 'boolean' },
            dataLoss: { type: 'boolean' },
            transformation: { type: 'string' }
          }
        },
        error: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'integration-testing', 'unit-integration', `${args.componentA}-${args.componentB}`]
}));

// Phase 6: End-to-End Integration Test
export const endToEndIntegrationTestTask = defineTask('end-to-end-integration-test', (args, taskCtx) => ({
  kind: 'agent',
  title: `E2E Integration Test - ${args.scenario.name}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'End-to-End Test Engineer',
      task: 'Execute end-to-end integration test scenario across entire ML system',
      context: {
        systemName: args.systemName,
        scenario: args.scenario,
        testData: args.testData,
        performanceRequirements: args.performanceRequirements,
        testEnvironment: args.testEnvironment,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Initialize test scenario with test data',
        '2. Trigger data ingestion at system entry point',
        '3. Monitor data flow through each component',
        '4. Verify data transformations at each stage',
        '5. Validate model predictions or outputs',
        '6. Check result delivery to end users or systems',
        '7. Measure end-to-end latency',
        '8. Verify all system logs and traces',
        '9. Check monitoring metrics and alerts',
        '10. Validate data consistency across components',
        '11. Test rollback or compensation if applicable',
        '12. Compare actual vs expected results',
        '13. Document any deviations or failures',
        '14. Return comprehensive test results'
      ],
      outputFormat: 'JSON object with E2E test results'
    },
    outputSchema: {
      type: 'object',
      required: ['scenario', 'passed', 'artifacts'],
      properties: {
        scenario: { type: 'string' },
        passed: { type: 'boolean' },
        endToEndLatency: { type: 'number', description: 'Total E2E latency in ms' },
        componentLatencies: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        results: {
          type: 'object',
          properties: {
            expected: {},
            actual: {},
            match: { type: 'boolean' }
          }
        },
        dataFlow: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              component: { type: 'string' },
              timestamp: { type: 'string' },
              dataValid: { type: 'boolean' }
            }
          }
        },
        error: { type: 'string' },
        logs: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'integration-testing', 'e2e', `scenario-${args.scenario.name}`]
}));

// Phase 7: Performance Integration Test
export const performanceIntegrationTestTask = defineTask('performance-integration-test', (args, taskCtx) => ({
  kind: 'agent',
  title: `Performance Integration Test - ${args.scenario.name}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Performance Test Engineer',
      task: 'Execute performance and load integration test',
      context: {
        systemName: args.systemName,
        scenario: args.scenario,
        testData: args.testData,
        performanceRequirements: args.performanceRequirements,
        testEnvironment: args.testEnvironment,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Set up load generation for test scenario',
        '2. Gradually increase load to target throughput',
        '3. Monitor system latency (p50, p95, p99)',
        '4. Monitor system throughput (requests/sec)',
        '5. Track resource utilization (CPU, memory, network)',
        '6. Measure model inference time',
        '7. Check for performance degradation over time',
        '8. Identify bottlenecks in component interactions',
        '9. Test auto-scaling behavior if applicable',
        '10. Run sustained load test for stability',
        '11. Compare metrics against requirements',
        '12. Generate performance report with charts',
        '13. Return performance test results'
      ],
      outputFormat: 'JSON object with performance metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['scenario', 'testType', 'meetsRequirements', 'artifacts'],
      properties: {
        scenario: { type: 'string' },
        testType: { type: 'string', enum: ['performance', 'load', 'stress', 'soak'] },
        meetsRequirements: { type: 'boolean' },
        metrics: {
          type: 'object',
          properties: {
            latency: {
              type: 'object',
              properties: {
                p50: { type: 'number' },
                p95: { type: 'number' },
                p99: { type: 'number' },
                max: { type: 'number' }
              }
            },
            throughput: {
              type: 'object',
              properties: {
                requestsPerSec: { type: 'number' },
                peak: { type: 'number' }
              }
            },
            resourceUtilization: {
              type: 'object',
              properties: {
                cpu: { type: 'number' },
                memory: { type: 'number' },
                network: { type: 'number' }
              }
            }
          }
        },
        violatedMetric: { type: 'string' },
        actualValue: { type: 'number' },
        requiredValue: { type: 'number' },
        bottlenecks: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'integration-testing', 'performance', `scenario-${args.scenario.name}`]
}));

// Phase 8: Data Pipeline Integration Test
export const dataPipelineIntegrationTestTask = defineTask('data-pipeline-integration-test', (args, taskCtx) => ({
  kind: 'agent',
  title: `Data Pipeline Integration Test - ${args.systemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Engineer specializing in pipeline testing',
      task: 'Test data pipeline integration including ingestion, transformation, and validation',
      context: {
        systemName: args.systemName,
        testData: args.testData,
        testEnvironment: args.testEnvironment,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Trigger data ingestion from test source',
        '2. Verify data lands in staging/raw storage',
        '3. Test data validation and quality checks',
        '4. Verify data transformations and feature engineering',
        '5. Check data lands in feature store or training storage',
        '6. Validate schema consistency throughout pipeline',
        '7. Test incremental vs full refresh logic',
        '8. Verify data lineage and metadata tracking',
        '9. Test error handling for malformed data',
        '10. Check pipeline monitoring and alerting',
        '11. Measure pipeline latency and throughput',
        '12. Return integration test results'
      ],
      outputFormat: 'JSON object with data pipeline test results'
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'artifacts'],
      properties: {
        passed: { type: 'boolean' },
        pipelineStages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stage: { type: 'string' },
              passed: { type: 'boolean' },
              duration: { type: 'number' },
              rowsProcessed: { type: 'number' }
            }
          }
        },
        dataQuality: {
          type: 'object',
          properties: {
            completeness: { type: 'number' },
            validity: { type: 'number' },
            consistency: { type: 'number' }
          }
        },
        schemaValidation: { type: 'boolean' },
        lineageTracking: { type: 'boolean' },
        error: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'integration-testing', 'data-pipeline']
}));

// Phase 8: Model Behavior Integration Test
export const modelBehaviorIntegrationTestTask = defineTask('model-behavior-integration-test', (args, taskCtx) => ({
  kind: 'agent',
  title: `Model Behavior Integration Test - ${args.systemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Engineer specializing in model testing',
      task: 'Test model behavior integration including serving, inference, and output validation',
      context: {
        systemName: args.systemName,
        modelVersions: args.modelVersions,
        testData: args.testData,
        testEnvironment: args.testEnvironment,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Load model from model registry or storage',
        '2. Send test inputs to model serving endpoint',
        '3. Verify model predictions against expected outputs',
        '4. Test model behavior on edge cases',
        '5. Validate prediction format and schema',
        '6. Check model confidence scores or probabilities',
        '7. Test multi-model scenarios if applicable',
        '8. Verify model versioning and A/B testing',
        '9. Test model fallback or default behavior',
        '10. Measure inference latency and throughput',
        '11. Check model monitoring metrics',
        '12. Return model behavior test results'
      ],
      outputFormat: 'JSON object with model behavior test results'
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'artifacts'],
      properties: {
        passed: { type: 'boolean' },
        modelVersion: { type: 'string' },
        testCases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              passed: { type: 'boolean' },
              expected: {},
              actual: {},
              confidence: { type: 'number' }
            }
          }
        },
        accuracy: { type: 'number' },
        inferenceLatency: { type: 'number' },
        throughput: { type: 'number' },
        error: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'integration-testing', 'model-behavior']
}));

// Phase 8: Data Drift Integration Test
export const dataDriftIntegrationTestTask = defineTask('data-drift-integration-test', (args, taskCtx) => ({
  kind: 'agent',
  title: `Data Drift Integration Test - ${args.systemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Monitoring Engineer',
      task: 'Test data drift detection and alerting integration',
      context: {
        systemName: args.systemName,
        testData: args.testData,
        testEnvironment: args.testEnvironment,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Send baseline data through system',
        '2. Send drifted data with distribution shifts',
        '3. Verify drift detection triggers',
        '4. Check drift metrics calculation (KS test, PSI, etc.)',
        '5. Verify drift alerts are generated',
        '6. Test drift visualization dashboards',
        '7. Check drift logging and tracking',
        '8. Test automatic retraining triggers if applicable',
        '9. Validate drift thresholds and sensitivity',
        '10. Return drift detection test results'
      ],
      outputFormat: 'JSON object with data drift test results'
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'driftDetected', 'artifacts'],
      properties: {
        passed: { type: 'boolean' },
        driftDetected: { type: 'boolean' },
        driftMetrics: {
          type: 'object',
          properties: {
            ks_statistic: { type: 'number' },
            psi: { type: 'number' },
            wassersteinDistance: { type: 'number' }
          }
        },
        alertsTriggered: { type: 'boolean' },
        retrainingTriggered: { type: 'boolean' },
        error: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'integration-testing', 'data-drift']
}));

// Phase 8: Model Drift Integration Test
export const modelDriftIntegrationTestTask = defineTask('model-drift-integration-test', (args, taskCtx) => ({
  kind: 'agent',
  title: `Model Drift Integration Test - ${args.systemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Monitoring Engineer',
      task: 'Test model drift detection and performance degradation monitoring',
      context: {
        systemName: args.systemName,
        modelVersions: args.modelVersions,
        testData: args.testData,
        testEnvironment: args.testEnvironment,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Send test data with known ground truth',
        '2. Collect model predictions over time',
        '3. Verify performance metrics calculation',
        '4. Test performance degradation detection',
        '5. Check model drift alerts',
        '6. Verify performance monitoring dashboards',
        '7. Test A/B testing or champion/challenger comparison',
        '8. Validate model rollback triggers if applicable',
        '9. Check model performance logging',
        '10. Return model drift test results'
      ],
      outputFormat: 'JSON object with model drift test results'
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'performanceDegraded', 'artifacts'],
      properties: {
        passed: { type: 'boolean' },
        performanceDegraded: { type: 'boolean' },
        performanceMetrics: {
          type: 'object',
          properties: {
            baseline: { type: 'number' },
            current: { type: 'number' },
            degradation: { type: 'number' }
          }
        },
        alertsTriggered: { type: 'boolean' },
        rollbackTriggered: { type: 'boolean' },
        error: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'integration-testing', 'model-drift']
}));

// Phase 9: Resilience Integration Test
export const resilienceIntegrationTestTask = defineTask('resilience-integration-test', (args, taskCtx) => ({
  kind: 'agent',
  title: `Resilience Integration Test - ${args.scenario.name}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Chaos Engineering Specialist',
      task: 'Test system resilience and failure recovery',
      context: {
        systemName: args.systemName,
        scenario: args.scenario,
        testEnvironment: args.testEnvironment,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Inject failure scenario (component crash, network partition, etc.)',
        '2. Monitor system behavior during failure',
        '3. Verify error handling and graceful degradation',
        '4. Test retry logic and circuit breakers',
        '5. Check failover to backup systems',
        '6. Verify data consistency during failure',
        '7. Test system recovery after failure resolved',
        '8. Measure recovery time and data loss',
        '9. Verify monitoring alerts triggered',
        '10. Check system returns to healthy state',
        '11. Return resilience test results'
      ],
      outputFormat: 'JSON object with resilience test results'
    },
    outputSchema: {
      type: 'object',
      required: ['scenario', 'passed', 'artifacts'],
      properties: {
        scenario: { type: 'string' },
        passed: { type: 'boolean' },
        failureInjected: { type: 'string' },
        gracefulDegradation: { type: 'boolean' },
        recovery: {
          type: 'object',
          properties: {
            successful: { type: 'boolean' },
            timeToRecover: { type: 'number' },
            dataLoss: { type: 'boolean' }
          }
        },
        alertsTriggered: { type: 'boolean' },
        error: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'integration-testing', 'resilience', `scenario-${args.scenario.name}`]
}));

// Phase 10: Monitoring Integration Test
export const monitoringIntegrationTestTask = defineTask('monitoring-integration-test', (args, taskCtx) => ({
  kind: 'agent',
  title: `Monitoring Integration Test - ${args.systemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Observability Engineer',
      task: 'Test monitoring and observability integration across ML system',
      context: {
        systemName: args.systemName,
        components: args.components,
        testEnvironment: args.testEnvironment,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Verify all components emit metrics',
        '2. Check metrics are collected in monitoring system',
        '3. Test log aggregation from all components',
        '4. Verify distributed tracing works end-to-end',
        '5. Test custom ML metrics (accuracy, drift, etc.)',
        '6. Verify monitoring dashboards display data',
        '7. Test alert rules and notifications',
        '8. Check SLI/SLO tracking',
        '9. Test anomaly detection on metrics',
        '10. Verify monitoring data retention',
        '11. Return monitoring integration test results'
      ],
      outputFormat: 'JSON object with monitoring test results'
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'artifacts'],
      properties: {
        passed: { type: 'boolean' },
        metricsCollected: { type: 'boolean' },
        logsAggregated: { type: 'boolean' },
        tracingWorking: { type: 'boolean' },
        dashboardsOperational: { type: 'boolean' },
        alertsConfigured: { type: 'boolean' },
        componentsMonitored: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              component: { type: 'string' },
              metricsEmitted: { type: 'number' },
              healthy: { type: 'boolean' }
            }
          }
        },
        error: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'integration-testing', 'monitoring', 'observability']
}));

// Phase 11: Integration Coverage Analysis
export const integrationCoverageAnalysisTask = defineTask('integration-coverage-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Coverage Analysis - ${args.systemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Test Coverage Analyst',
      task: 'Analyze integration test coverage across all components and interactions',
      context: {
        systemName: args.systemName,
        components: args.components,
        scenarios: args.scenarios,
        testResults: args.testResults,
        targetCoverage: args.targetCoverage,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Map all component interactions in the system',
        '2. Identify which interactions were tested',
        '3. Calculate coverage percentage by interaction',
        '4. Calculate coverage percentage by component',
        '5. Identify uncovered components or interactions',
        '6. Analyze test scenario coverage by type',
        '7. Check coverage of edge cases and error paths',
        '8. Compare actual vs target coverage',
        '9. Identify coverage gaps and prioritize',
        '10. Generate recommendations for additional tests',
        '11. Create coverage report with visualizations',
        '12. Return coverage analysis results'
      ],
      outputFormat: 'JSON object with coverage metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['overallCoverage', 'uncoveredComponents', 'uncoveredInteractions', 'artifacts'],
      properties: {
        overallCoverage: { type: 'number', minimum: 0, maximum: 100 },
        componentCoverage: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        interactionCoverage: { type: 'number' },
        scenarioCoverage: {
          type: 'object',
          properties: {
            e2e: { type: 'number' },
            performance: { type: 'number' },
            resilience: { type: 'number' },
            monitoring: { type: 'number' }
          }
        },
        uncoveredComponents: { type: 'array', items: { type: 'string' } },
        uncoveredInteractions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              from: { type: 'string' },
              to: { type: 'string' }
            }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'integration-testing', 'coverage', 'analysis']
}));

// Phase 12: Integration Scoring
export const integrationScoringTask = defineTask('integration-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Integration Scoring - ${args.systemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior QA Engineer and Integration Test Lead',
      task: 'Calculate overall integration score based on test results and quality metrics',
      context: {
        systemName: args.systemName,
        testResults: args.testResults,
        coverageAnalysis: args.coverageAnalysis,
        performanceResults: args.performanceResults,
        healthCheckResults: args.healthCheckResults,
        targetCoverage: args.targetCoverage,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Calculate pass rate across all test types',
        '2. Weight test types by importance (E2E: 30%, Unit: 20%, Performance: 20%, Resilience: 15%, Data: 10%, Monitoring: 5%)',
        '3. Factor in coverage percentage',
        '4. Consider performance requirement compliance',
        '5. Account for component health',
        '6. Evaluate critical vs non-critical test failures',
        '7. Calculate weighted overall score (0-100)',
        '8. Identify critical issues impacting score',
        '9. Generate score breakdown by dimension',
        '10. Provide recommendations for improvement',
        '11. Return integration score with details'
      ],
      outputFormat: 'JSON object with integration score and breakdown'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'scoreBreakdown', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        scoreBreakdown: {
          type: 'object',
          properties: {
            e2eTests: { type: 'number' },
            unitIntegrationTests: { type: 'number' },
            performanceTests: { type: 'number' },
            resilienceTests: { type: 'number' },
            dataQualityTests: { type: 'number' },
            monitoringTests: { type: 'number' },
            coverage: { type: 'number' }
          }
        },
        passRate: { type: 'number' },
        criticalIssues: { type: 'array', items: { type: 'string' } },
        warnings: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'integration-testing', 'scoring']
}));

// Phase 13: Integration Test Report
export const integrationTestReportTask = defineTask('integration-test-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 13: Test Report Generation - ${args.systemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Writer and QA Reporter',
      task: 'Generate comprehensive integration test report',
      context: {
        systemName: args.systemName,
        components: args.components,
        testEnvironment: args.testEnvironment,
        testResults: args.testResults,
        coverageAnalysis: args.coverageAnalysis,
        scoringResult: args.scoringResult,
        integrationScore: args.integrationScore,
        performanceRequirements: args.performanceRequirements,
        targetCoverage: args.targetCoverage,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create executive summary with key findings',
        '2. Document test environment and setup',
        '3. List all components tested',
        '4. Summarize test results by phase and type',
        '5. Present integration score and breakdown',
        '6. Show coverage metrics and gaps',
        '7. Report performance test results',
        '8. Document resilience and failure recovery tests',
        '9. Highlight critical issues and failures',
        '10. Include visualizations (charts, graphs)',
        '11. Provide actionable recommendations',
        '12. Format as professional Markdown report',
        '13. Save report and supporting artifacts'
      ],
      outputFormat: 'JSON object with report path and summary'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummary', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        testSummary: {
          type: 'object',
          properties: {
            totalTests: { type: 'number' },
            passed: { type: 'number' },
            failed: { type: 'number' },
            passRate: { type: 'number' }
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
  labels: ['agent', 'integration-testing', 'reporting', 'documentation']
}));

// Phase 14: Final Integration Review
export const finalIntegrationReviewTask = defineTask('final-integration-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 14: Final Review - ${args.systemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Principal Engineer and System Architect',
      task: 'Conduct final comprehensive review of integration testing results and provide deployment recommendation',
      context: {
        systemName: args.systemName,
        integrationScore: args.integrationScore,
        testResults: args.testResults,
        coverageAnalysis: args.coverageAnalysis,
        performanceResults: args.performanceResults,
        resilienceResults: args.resilienceResults,
        monitoringTest: args.monitoringTest,
        testReport: args.testReport,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Review overall integration score and test pass rate',
        '2. Assess coverage and identify critical gaps',
        '3. Evaluate performance against requirements',
        '4. Review resilience and failure recovery capability',
        '5. Assess monitoring and observability readiness',
        '6. Identify any blocking issues for deployment',
        '7. Evaluate system readiness for production',
        '8. Provide clear deployment recommendation (approve/reject/conditional)',
        '9. List strengths of the integration',
        '10. List concerns and risks',
        '11. Suggest follow-up actions or improvements',
        '12. Generate final review report',
        '13. Return verdict and recommendation'
      ],
      outputFormat: 'JSON object with verdict and deployment recommendation'
    },
    outputSchema: {
      type: 'object',
      required: ['verdict', 'approved', 'recommendation', 'artifacts'],
      properties: {
        verdict: { type: 'string', description: 'Overall assessment' },
        approved: { type: 'boolean', description: 'Approved for deployment' },
        confidence: { type: 'number', minimum: 0, maximum: 100 },
        recommendation: { type: 'string', description: 'Deployment recommendation' },
        strengths: { type: 'array', items: { type: 'string' } },
        concerns: { type: 'array', items: { type: 'string' } },
        blockingIssues: { type: 'array', items: { type: 'string' } },
        followUpActions: { type: 'array', items: { type: 'string' } },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'integration-testing', 'final-review', 'deployment-approval']
}));
