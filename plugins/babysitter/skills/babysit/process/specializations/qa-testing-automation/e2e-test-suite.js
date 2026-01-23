/**
 * @process specializations/qa-testing-automation/e2e-test-suite
 * @description End-to-End Test Suite Development - Comprehensive E2E test automation for critical user journeys,
 * covering authentication, core workflows, and business-critical scenarios with Page Object Model pattern,
 * test data management, stability improvements, and quality gates.
 * @inputs { projectName: string, applicationUrl: string, userJourneys?: array, frameworkType?: string, testDataRequirements?: object }
 * @outputs { success: boolean, testSuiteStats: object, pageObjects: array, testExecutionReport: object, stabilityScore: number }
 *
 * @example
 * const result = await orchestrate('specializations/qa-testing-automation/e2e-test-suite', {
 *   projectName: 'E-commerce Platform',
 *   applicationUrl: 'https://staging.example.com',
 *   userJourneys: ['User Registration', 'Product Search', 'Checkout Flow', 'Order Management'],
 *   frameworkType: 'playwright',
 *   testDataRequirements: { users: 10, products: 50, orders: 20 },
 *   acceptanceCriteria: { testCoverage: 90, passRate: 95, flakiness: 5 }
 * });
 *
 * @references
 * - Page Object Model: https://playwright.dev/docs/pom
 * - Testing Best Practices: https://martinfowler.com/articles/practical-test-pyramid.html
 * - Playwright Documentation: https://playwright.dev/
 * - Cypress Documentation: https://docs.cypress.io/
 * - Test Automation Patterns: https://www.selenium.dev/documentation/test_practices/
 * - Flaky Test Prevention: https://testing.googleblog.com/2016/05/flaky-tests-at-google-and-how-we.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    applicationUrl,
    userJourneys = [],
    frameworkType = 'playwright', // 'playwright', 'cypress', 'selenium'
    testDataRequirements = {},
    acceptanceCriteria = {
      testCoverage: 90,
      passRate: 95,
      flakiness: 5,
      maxExecutionTime: 30
    },
    outputDir = 'e2e-test-suite-output',
    environmentType = 'staging',
    parallelExecutionEnabled = true,
    visualRegressionEnabled = false
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let testSuiteStats = {};
  let stabilityScore = 0;

  ctx.log('info', `Starting End-to-End Test Suite Development for ${projectName}`);
  ctx.log('info', `Application URL: ${applicationUrl}, Framework: ${frameworkType}`);

  // ============================================================================
  // PHASE 1: JOURNEY IDENTIFICATION AND ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Identifying and analyzing critical user journeys');

  const journeyAnalysis = await ctx.task(journeyIdentificationTask, {
    projectName,
    applicationUrl,
    userJourneys,
    testDataRequirements,
    outputDir
  });

  if (!journeyAnalysis.success || journeyAnalysis.identifiedJourneys.length === 0) {
    return {
      success: false,
      error: 'Failed to identify critical user journeys',
      details: journeyAnalysis,
      metadata: {
        processId: 'specializations/qa-testing-automation/e2e-test-suite',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...journeyAnalysis.artifacts);

  // Quality Gate: Minimum journey coverage
  if (journeyAnalysis.identifiedJourneys.length < 5) {
    await ctx.breakpoint({
      question: `Only ${journeyAnalysis.identifiedJourneys.length} critical journeys identified. Minimum recommended is 5. Review and approve to continue?`,
      title: 'Journey Coverage Review',
      context: {
        runId: ctx.runId,
        identifiedJourneys: journeyAnalysis.identifiedJourneys,
        recommendation: 'Consider adding more critical user journeys for comprehensive coverage',
        files: journeyAnalysis.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 2: TEST DESIGN AND SCENARIO CREATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing test scenarios and test cases');

  const testDesign = await ctx.task(testDesignTask, {
    projectName,
    applicationUrl,
    identifiedJourneys: journeyAnalysis.identifiedJourneys,
    acceptanceCriteria,
    frameworkType,
    outputDir
  });

  artifacts.push(...testDesign.artifacts);

  // Quality Gate: Test scenario completeness
  const totalScenarios = testDesign.testScenarios.length;
  if (totalScenarios < 10) {
    await ctx.breakpoint({
      question: `${totalScenarios} test scenarios created. Best practice recommends 10-20 scenarios for critical paths. Continue?`,
      title: 'Test Scenario Review',
      context: {
        runId: ctx.runId,
        scenarioCount: totalScenarios,
        scenarios: testDesign.testScenarios.map(s => ({ journey: s.journey, title: s.title })),
        files: testDesign.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 3: PAGE OBJECT MODEL DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Building Page Objects for all application screens');

  const pageObjectDevelopment = await ctx.task(pageObjectDevelopmentTask, {
    projectName,
    applicationUrl,
    identifiedJourneys: journeyAnalysis.identifiedJourneys,
    testScenarios: testDesign.testScenarios,
    frameworkType,
    outputDir
  });

  artifacts.push(...pageObjectDevelopment.artifacts);

  // Quality Gate: Page Object coverage
  const screensCovered = pageObjectDevelopment.pageObjects.length;
  if (screensCovered < journeyAnalysis.estimatedScreenCount * 0.8) {
    await ctx.breakpoint({
      question: `Page Objects created for ${screensCovered}/${journeyAnalysis.estimatedScreenCount} screens. Coverage at ${((screensCovered / journeyAnalysis.estimatedScreenCount) * 100).toFixed(0)}%. Approve to proceed?`,
      title: 'Page Object Coverage Warning',
      context: {
        runId: ctx.runId,
        screensCovered,
        estimatedScreens: journeyAnalysis.estimatedScreenCount,
        pageObjects: pageObjectDevelopment.pageObjects.map(po => po.name),
        recommendation: 'Consider adding Page Objects for remaining critical screens',
        files: pageObjectDevelopment.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 4: TEST DATA SETUP
  // ============================================================================

  ctx.log('info', 'Phase 4: Creating test data and fixtures');

  const testDataSetup = await ctx.task(testDataSetupTask, {
    projectName,
    testDataRequirements,
    testScenarios: testDesign.testScenarios,
    environmentType,
    outputDir
  });

  artifacts.push(...testDataSetup.artifacts);

  // Quality Gate: Test data availability
  if (!testDataSetup.dataReady || testDataSetup.dataGaps.length > 0) {
    await ctx.breakpoint({
      question: `Test data setup completed with ${testDataSetup.dataGaps.length} gaps identified. Review data gaps and approve to continue?`,
      title: 'Test Data Review',
      context: {
        runId: ctx.runId,
        dataReady: testDataSetup.dataReady,
        dataGaps: testDataSetup.dataGaps,
        availableData: testDataSetup.availableData,
        files: testDataSetup.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 5: PARALLEL TEST IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing automated E2E tests in parallel');

  // Parallelize test implementation for different journey categories
  const [
    authenticationTests,
    coreWorkflowTests,
    dataManagementTests
  ] = await ctx.parallel.all([
    () => ctx.task(authenticationTestsTask, {
      projectName,
      testScenarios: testDesign.testScenarios.filter(s => s.category === 'authentication'),
      pageObjects: pageObjectDevelopment.pageObjects,
      testData: testDataSetup.testDatasets,
      frameworkType,
      outputDir
    }),
    () => ctx.task(coreWorkflowTestsTask, {
      projectName,
      testScenarios: testDesign.testScenarios.filter(s => s.category === 'core-workflow'),
      pageObjects: pageObjectDevelopment.pageObjects,
      testData: testDataSetup.testDatasets,
      frameworkType,
      outputDir
    }),
    () => ctx.task(dataManagementTestsTask, {
      projectName,
      testScenarios: testDesign.testScenarios.filter(s => s.category === 'data-management'),
      pageObjects: pageObjectDevelopment.pageObjects,
      testData: testDataSetup.testDatasets,
      frameworkType,
      outputDir
    })
  ]);

  artifacts.push(
    ...authenticationTests.artifacts,
    ...coreWorkflowTests.artifacts,
    ...dataManagementTests.artifacts
  );

  const totalTestsImplemented =
    authenticationTests.testCount +
    coreWorkflowTests.testCount +
    dataManagementTests.testCount;

  ctx.log('info', `Total tests implemented: ${totalTestsImplemented}`);

  // ============================================================================
  // PHASE 6: INITIAL TEST EXECUTION
  // ============================================================================

  ctx.log('info', 'Phase 6: Running tests and debugging failures');

  const initialExecution = await ctx.task(testExecutionTask, {
    projectName,
    applicationUrl,
    frameworkType,
    parallelExecutionEnabled,
    outputDir,
    executionType: 'initial'
  });

  artifacts.push(...initialExecution.artifacts);

  // Quality Gate: Initial test pass rate
  const initialPassRate = initialExecution.passRate;
  if (initialPassRate < 50) {
    await ctx.breakpoint({
      question: `Initial test execution pass rate: ${initialPassRate}%. Below 50% threshold. This is expected for initial run. Review failures and continue debugging?`,
      title: 'Initial Execution Results',
      context: {
        runId: ctx.runId,
        passRate: initialPassRate,
        totalTests: initialExecution.totalTests,
        passed: initialExecution.passed,
        failed: initialExecution.failed,
        failureReasons: initialExecution.topFailureReasons,
        files: initialExecution.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 7: DEBUGGING AND FIXES
  // ============================================================================

  ctx.log('info', 'Phase 7: Debugging test failures and implementing fixes');

  const debuggingPhase = await ctx.task(debuggingAndFixesTask, {
    projectName,
    executionResults: initialExecution,
    pageObjects: pageObjectDevelopment.pageObjects,
    testScenarios: testDesign.testScenarios,
    frameworkType,
    outputDir
  });

  artifacts.push(...debuggingPhase.artifacts);

  // ============================================================================
  // PHASE 8: STABILITY IMPROVEMENTS
  // ============================================================================

  ctx.log('info', 'Phase 8: Eliminating test flakiness and improving stability');

  const stabilityImprovements = await ctx.task(stabilityImprovementsTask, {
    projectName,
    executionResults: initialExecution,
    debuggingResults: debuggingPhase,
    frameworkType,
    outputDir
  });

  artifacts.push(...stabilityImprovements.artifacts);

  // ============================================================================
  // PHASE 9: FINAL TEST EXECUTION
  // ============================================================================

  ctx.log('info', 'Phase 9: Running final test execution to validate stability');

  const finalExecution = await ctx.task(testExecutionTask, {
    projectName,
    applicationUrl,
    frameworkType,
    parallelExecutionEnabled,
    outputDir,
    executionType: 'final'
  });

  artifacts.push(...finalExecution.artifacts);

  const finalPassRate = finalExecution.passRate;
  const flakinessRate = finalExecution.flakinessRate;

  // Quality Gate: Final test pass rate
  if (finalPassRate < acceptanceCriteria.passRate) {
    await ctx.breakpoint({
      question: `Final test pass rate: ${finalPassRate}%. Target: ${acceptanceCriteria.passRate}%. Below acceptance criteria. Review and decide to proceed or iterate?`,
      title: 'Pass Rate Quality Gate',
      context: {
        runId: ctx.runId,
        finalPassRate,
        targetPassRate: acceptanceCriteria.passRate,
        totalTests: finalExecution.totalTests,
        passed: finalExecution.passed,
        failed: finalExecution.failed,
        recommendation: 'Consider additional debugging iteration or adjust acceptance criteria',
        files: finalExecution.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // Quality Gate: Flakiness rate
  if (flakinessRate > acceptanceCriteria.flakiness) {
    await ctx.breakpoint({
      question: `Flakiness rate: ${flakinessRate}%. Target: <${acceptanceCriteria.flakiness}%. Above threshold. Continue or stabilize further?`,
      title: 'Flakiness Quality Gate',
      context: {
        runId: ctx.runId,
        flakinessRate,
        targetFlakiness: acceptanceCriteria.flakiness,
        flakyTests: finalExecution.flakyTests,
        recommendation: 'Apply additional stability improvements or use test quarantine',
        files: stabilityImprovements.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 10: CODE REVIEW AND REFINEMENT
  // ============================================================================

  ctx.log('info', 'Phase 10: Conducting code review and test refinement');

  const codeReview = await ctx.task(codeReviewTask, {
    projectName,
    pageObjects: pageObjectDevelopment.pageObjects,
    testFiles: [
      ...authenticationTests.testFiles,
      ...coreWorkflowTests.testFiles,
      ...dataManagementTests.testFiles
    ],
    frameworkType,
    executionResults: finalExecution,
    outputDir
  });

  artifacts.push(...codeReview.artifacts);

  // Quality Gate: Code review approval
  if (codeReview.criticalIssues.length > 0) {
    await ctx.breakpoint({
      question: `Code review identified ${codeReview.criticalIssues.length} critical issues. Review issues and approve fixes?`,
      title: 'Code Review Critical Issues',
      context: {
        runId: ctx.runId,
        criticalIssues: codeReview.criticalIssues,
        suggestions: codeReview.suggestions,
        bestPractices: codeReview.bestPracticeViolations,
        files: codeReview.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 11: VISUAL REGRESSION SETUP (if enabled)
  // ============================================================================

  let visualRegression = null;
  if (visualRegressionEnabled) {
    ctx.log('info', 'Phase 11: Setting up visual regression testing');

    visualRegression = await ctx.task(visualRegressionSetupTask, {
      projectName,
      applicationUrl,
      pageObjects: pageObjectDevelopment.pageObjects,
      frameworkType,
      outputDir
    });

    artifacts.push(...visualRegression.artifacts);
  }

  // ============================================================================
  // PHASE 12: DOCUMENTATION GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 12: Generating comprehensive test suite documentation');

  const documentation = await ctx.task(documentationGenerationTask, {
    projectName,
    journeyAnalysis,
    testDesign,
    pageObjectDevelopment,
    testDataSetup,
    executionResults: finalExecution,
    stabilityImprovements,
    codeReview,
    visualRegression,
    frameworkType,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // ============================================================================
  // PHASE 13: CI/CD INTEGRATION VERIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 13: Verifying CI/CD integration readiness');

  const cicdIntegration = await ctx.task(cicdIntegrationTask, {
    projectName,
    frameworkType,
    parallelExecutionEnabled,
    executionResults: finalExecution,
    outputDir
  });

  artifacts.push(...cicdIntegration.artifacts);

  // ============================================================================
  // PHASE 14: FINAL ASSESSMENT AND METRICS
  // ============================================================================

  ctx.log('info', 'Phase 14: Computing final test suite metrics and assessment');

  const finalAssessment = await ctx.task(finalAssessmentTask, {
    projectName,
    journeyAnalysis,
    testDesign,
    pageObjectDevelopment,
    testDataSetup,
    authenticationTests,
    coreWorkflowTests,
    dataManagementTests,
    finalExecution,
    stabilityImprovements,
    codeReview,
    visualRegression,
    cicdIntegration,
    acceptanceCriteria,
    outputDir
  });

  testSuiteStats = finalAssessment.testSuiteStats;
  stabilityScore = finalAssessment.stabilityScore;
  artifacts.push(...finalAssessment.artifacts);

  ctx.log('info', `Test suite stability score: ${stabilityScore}/100`);
  ctx.log('info', `Total tests: ${testSuiteStats.totalTests}, Pass rate: ${testSuiteStats.passRate}%`);

  // Final Breakpoint: E2E Test Suite Approval
  await ctx.breakpoint({
    question: `E2E Test Suite Development Complete for ${projectName}. Stability Score: ${stabilityScore}/100, Pass Rate: ${testSuiteStats.passRate}%. Approve test suite for production use?`,
    title: 'Final E2E Test Suite Review',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        totalTests: testSuiteStats.totalTests,
        passRate: testSuiteStats.passRate,
        flakinessRate: testSuiteStats.flakinessRate,
        stabilityScore,
        journeysCovered: journeyAnalysis.identifiedJourneys.length,
        pageObjects: pageObjectDevelopment.pageObjects.length,
        executionTime: testSuiteStats.averageExecutionTime,
        cicdReady: cicdIntegration.ready
      },
      acceptanceCriteria,
      verdict: finalAssessment.verdict,
      recommendation: finalAssessment.recommendation,
      files: [
        { path: documentation.testSuiteDocPath, format: 'markdown', label: 'Test Suite Documentation' },
        { path: finalAssessment.metricsReportPath, format: 'json', label: 'Metrics Report' },
        { path: finalExecution.reportPath, format: 'html', label: 'Test Execution Report' },
        { path: codeReview.reviewReportPath, format: 'markdown', label: 'Code Review Report' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    applicationUrl,
    frameworkType,
    stabilityScore,
    testSuiteStats: {
      totalTests: testSuiteStats.totalTests,
      passRate: testSuiteStats.passRate,
      flakinessRate: testSuiteStats.flakinessRate,
      averageExecutionTime: testSuiteStats.averageExecutionTime,
      journeysCovered: journeyAnalysis.identifiedJourneys.length,
      testScenarios: testDesign.testScenarios.length,
      pageObjectsCreated: pageObjectDevelopment.pageObjects.length,
      authenticatio nTests: authenticationTests.testCount,
      coreWorkflowTests: coreWorkflowTests.testCount,
      dataManagementTests: dataManagementTests.testCount
    },
    pageObjects: pageObjectDevelopment.pageObjects.map(po => ({
      name: po.name,
      path: po.path,
      elements: po.elementCount
    })),
    testExecutionReport: {
      passed: finalExecution.passed,
      failed: finalExecution.failed,
      skipped: finalExecution.skipped,
      flakyTests: finalExecution.flakyTests,
      reportPath: finalExecution.reportPath
    },
    qualityGates: {
      passRateMet: finalPassRate >= acceptanceCriteria.passRate,
      flakinessMet: flakinessRate <= acceptanceCriteria.flakiness,
      executionTimeMet: testSuiteStats.averageExecutionTime <= acceptanceCriteria.maxExecutionTime,
      coverageMet: finalAssessment.coverageScore >= acceptanceCriteria.testCoverage
    },
    cicdIntegration: {
      ready: cicdIntegration.ready,
      pipelineConfigPath: cicdIntegration.pipelineConfigPath,
      parallelExecutionEnabled
    },
    artifacts,
    documentation: {
      testSuiteDocPath: documentation.testSuiteDocPath,
      usageGuidePath: documentation.usageGuidePath,
      troubleshootingPath: documentation.troubleshootingPath
    },
    visualRegression: visualRegression ? {
      enabled: true,
      baselinesCaptured: visualRegression.baselinesCaptured,
      configPath: visualRegression.configPath
    } : null,
    finalAssessment: {
      verdict: finalAssessment.verdict,
      recommendation: finalAssessment.recommendation,
      productionReady: finalAssessment.productionReady,
      metricsReportPath: finalAssessment.metricsReportPath
    },
    duration,
    metadata: {
      processId: 'specializations/qa-testing-automation/e2e-test-suite',
      timestamp: startTime,
      frameworkType,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: Journey Identification
export const journeyIdentificationTask = defineTask('journey-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Critical User Journey Identification - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior QA Architect and Test Strategist',
      task: 'Identify and analyze critical user journeys for E2E test automation',
      context: {
        projectName: args.projectName,
        applicationUrl: args.applicationUrl,
        userJourneys: args.userJourneys,
        testDataRequirements: args.testDataRequirements,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze provided user journeys or identify 5-10 critical user journeys',
        '2. Prioritize journeys by business impact, usage frequency, and risk',
        '3. Map each journey to specific user flows and screens',
        '4. Identify preconditions, test data requirements, and expected outcomes',
        '5. Estimate number of screens/pages involved in each journey',
        '6. Define acceptance criteria for each journey',
        '7. Identify edge cases and error scenarios within each journey',
        '8. Categorize journeys (authentication, core-workflow, data-management, etc.)',
        '9. Create journey mapping document with detailed flow diagrams',
        '10. Document estimated test complexity and automation feasibility'
      ],
      outputFormat: 'JSON object with identified journeys and analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'identifiedJourneys', 'estimatedScreenCount', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        identifiedJourneys: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              category: { type: 'string', enum: ['authentication', 'core-workflow', 'data-management', 'reporting', 'admin'] },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              description: { type: 'string' },
              userFlow: { type: 'array', items: { type: 'string' } },
              screensInvolved: { type: 'array', items: { type: 'string' } },
              preconditions: { type: 'array', items: { type: 'string' } },
              testDataNeeded: { type: 'object' },
              acceptanceCriteria: { type: 'array', items: { type: 'string' } },
              complexity: { type: 'string', enum: ['low', 'medium', 'high'] },
              estimatedTestCases: { type: 'number' }
            }
          },
          minItems: 5
        },
        estimatedScreenCount: { type: 'number', description: 'Total unique screens across all journeys' },
        categoryBreakdown: {
          type: 'object',
          properties: {
            authentication: { type: 'number' },
            coreWorkflow: { type: 'number' },
            dataManagement: { type: 'number' },
            reporting: { type: 'number' },
            admin: { type: 'number' }
          }
        },
        totalEstimatedTests: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'e2e-testing', 'journey-identification', 'test-planning']
}));

// Phase 2: Test Design
export const testDesignTask = defineTask('test-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Test Scenario and Test Case Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Test Design Specialist with expertise in E2E testing',
      task: 'Create comprehensive test scenarios and test cases for identified journeys',
      context: {
        projectName: args.projectName,
        applicationUrl: args.applicationUrl,
        identifiedJourneys: args.identifiedJourneys,
        acceptanceCriteria: args.acceptanceCriteria,
        frameworkType: args.frameworkType,
        outputDir: args.outputDir
      },
      instructions: [
        '1. For each journey, design 2-5 positive test scenarios (happy paths)',
        '2. Design 1-3 negative test scenarios (error handling, validation)',
        '3. Create detailed test cases with step-by-step actions',
        '4. Define test data requirements for each test case',
        '5. Specify expected results and assertions',
        '6. Identify reusable test steps and common patterns',
        '7. Design tests for boundary conditions and edge cases',
        '8. Plan for cross-browser and responsive testing where applicable',
        '9. Create test case traceability matrix linking to journeys',
        '10. Generate test design documentation with BDD-style scenarios'
      ],
      outputFormat: 'JSON object with test scenarios and test cases'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'testScenarios', 'reusableSteps', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        testScenarios: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              journey: { type: 'string' },
              category: { type: 'string' },
              title: { type: 'string' },
              type: { type: 'string', enum: ['positive', 'negative', 'edge-case'] },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              description: { type: 'string' },
              preconditions: { type: 'array', items: { type: 'string' } },
              testSteps: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    step: { type: 'number' },
                    action: { type: 'string' },
                    expectedResult: { type: 'string' },
                    assertions: { type: 'array', items: { type: 'string' } }
                  }
                }
              },
              testData: { type: 'object' },
              tags: { type: 'array', items: { type: 'string' } }
            }
          },
          minItems: 10
        },
        reusableSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              usageCount: { type: 'number' }
            }
          }
        },
        traceabilityMatrix: { type: 'array' },
        estimatedAutomationEffort: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'e2e-testing', 'test-design', 'test-scenarios']
}));

// Phase 3: Page Object Development
export const pageObjectDevelopmentTask = defineTask('page-object-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Page Object Model Development - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Test Automation Engineer specializing in Page Object Model',
      task: 'Build comprehensive Page Objects for all application screens using POM pattern',
      context: {
        projectName: args.projectName,
        applicationUrl: args.applicationUrl,
        identifiedJourneys: args.identifiedJourneys,
        testScenarios: args.testScenarios,
        frameworkType: args.frameworkType,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify all unique screens/pages across all user journeys',
        '2. Create Page Object class for each screen following POM best practices',
        '3. Define element locators using best practices (data-testid, semantic selectors)',
        '4. Implement page-specific action methods (click, fill, select, etc.)',
        '5. Add assertion/verification methods for page state validation',
        '6. Implement explicit waits and element availability checks',
        '7. Create base Page Object class with common functionality',
        '8. Add component objects for reusable UI components (modals, nav, forms)',
        '9. Implement Page Object chaining for fluent test writing',
        '10. Generate Page Object documentation and usage examples'
      ],
      outputFormat: 'JSON object with Page Objects and implementation details'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'pageObjects', 'componentObjects', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        pageObjects: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              path: { type: 'string' },
              url: { type: 'string' },
              elementCount: { type: 'number' },
              elements: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    locator: { type: 'string' },
                    locatorStrategy: { type: 'string' }
                  }
                }
              },
              actionMethods: { type: 'array', items: { type: 'string' } },
              verificationMethods: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        componentObjects: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              path: { type: 'string' },
              description: { type: 'string' },
              reusabilityCount: { type: 'number' }
            }
          }
        },
        basePageObject: {
          type: 'object',
          properties: {
            path: { type: 'string' },
            commonMethods: { type: 'array', items: { type: 'string' } }
          }
        },
        locatorStrategy: { type: 'string', description: 'Primary locator strategy used' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'e2e-testing', 'page-objects', 'test-automation']
}));

// Phase 4: Test Data Setup
export const testDataSetupTask = defineTask('test-data-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Test Data and Fixtures Setup - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Test Data Management Specialist',
      task: 'Create comprehensive test data and fixtures for E2E testing',
      context: {
        projectName: args.projectName,
        testDataRequirements: args.testDataRequirements,
        testScenarios: args.testScenarios,
        environmentType: args.environmentType,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze test data requirements across all test scenarios',
        '2. Design test data strategy (fixtures, factories, seeders)',
        '3. Create user account test data (various roles, permissions)',
        '4. Generate product/entity test data matching business rules',
        '5. Create test data for edge cases (boundary values, special characters)',
        '6. Implement data factories using Faker.js or similar for dynamic data',
        '7. Create JSON fixtures for static test data',
        '8. Implement test data isolation strategy (unique data per test)',
        '9. Add data cleanup utilities for teardown',
        '10. Document test data management patterns and usage'
      ],
      outputFormat: 'JSON object with test data and management strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['dataReady', 'availableData', 'dataGaps', 'artifacts'],
      properties: {
        dataReady: { type: 'boolean' },
        testDatasets: {
          type: 'object',
          properties: {
            users: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  username: { type: 'string' },
                  role: { type: 'string' },
                  dataType: { type: 'string', enum: ['fixture', 'dynamic'] }
                }
              }
            },
            products: { type: 'array' },
            orders: { type: 'array' },
            custom: { type: 'object' }
          }
        },
        dataFactories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              path: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        fixtures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              path: { type: 'string' },
              recordCount: { type: 'number' }
            }
          }
        },
        availableData: {
          type: 'object',
          description: 'Summary of available test data by category'
        },
        dataGaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              description: { type: 'string' },
              impact: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
            }
          }
        },
        cleanupStrategy: { type: 'string' },
        isolationStrategy: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'e2e-testing', 'test-data', 'fixtures']
}));

// Phase 5.1: Authentication Tests Implementation
export const authenticationTestsTask = defineTask('authentication-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Authentication Tests Implementation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Test Automation Engineer',
      task: 'Implement E2E tests for authentication user journeys',
      context: {
        projectName: args.projectName,
        testScenarios: args.testScenarios,
        pageObjects: args.pageObjects,
        testData: args.testData,
        frameworkType: args.frameworkType,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Implement login tests (valid credentials, invalid credentials, MFA)',
        '2. Implement registration/signup tests with validation',
        '3. Create password reset/forgot password tests',
        '4. Implement logout and session management tests',
        '5. Add tests for role-based access control',
        '6. Create tests for session expiry and timeout',
        '7. Implement social login tests if applicable',
        '8. Add security tests (SQL injection, XSS in auth forms)',
        '9. Use Page Objects and follow framework best practices',
        '10. Add proper assertions and error handling'
      ],
      outputFormat: 'JSON object with implemented authentication tests'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'testCount', 'testFiles', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        testCount: { type: 'number' },
        testFiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              testName: { type: 'string' },
              category: { type: 'string' },
              estimatedDuration: { type: 'string' }
            }
          }
        },
        coverageByScenario: {
          type: 'object',
          description: 'Test coverage by authentication scenario'
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'e2e-testing', 'authentication', 'test-implementation']
}));

// Phase 5.2: Core Workflow Tests Implementation
export const coreWorkflowTestsTask = defineTask('core-workflow-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Core Workflow Tests Implementation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Test Automation Engineer',
      task: 'Implement E2E tests for core workflow user journeys',
      context: {
        projectName: args.projectName,
        testScenarios: args.testScenarios,
        pageObjects: args.pageObjects,
        testData: args.testData,
        frameworkType: args.frameworkType,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Implement primary business workflow tests (e.g., checkout, booking)',
        '2. Create search and filter functionality tests',
        '3. Implement form submission and validation tests',
        '4. Add multi-step process tests',
        '5. Create tests for navigation and menu functionality',
        '6. Implement file upload/download tests if applicable',
        '7. Add tests for notifications and alerts',
        '8. Create tests for in-app messaging or communications',
        '9. Use Page Objects and maintain test independence',
        '10. Add comprehensive assertions for business logic'
      ],
      outputFormat: 'JSON object with implemented core workflow tests'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'testCount', 'testFiles', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        testCount: { type: 'number' },
        testFiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              testName: { type: 'string' },
              category: { type: 'string' },
              estimatedDuration: { type: 'string' }
            }
          }
        },
        coverageByScenario: {
          type: 'object',
          description: 'Test coverage by core workflow scenario'
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'e2e-testing', 'core-workflow', 'test-implementation']
}));

// Phase 5.3: Data Management Tests Implementation
export const dataManagementTestsTask = defineTask('data-management-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Data Management Tests Implementation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Test Automation Engineer',
      task: 'Implement E2E tests for data management user journeys',
      context: {
        projectName: args.projectName,
        testScenarios: args.testScenarios,
        pageObjects: args.pageObjects,
        testData: args.testData,
        frameworkType: args.frameworkType,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Implement CRUD (Create, Read, Update, Delete) operation tests',
        '2. Create data listing and pagination tests',
        '3. Implement sorting and filtering tests',
        '4. Add bulk operations tests (bulk delete, bulk edit)',
        '5. Create tests for data export functionality',
        '6. Implement tests for data import/upload',
        '7. Add tests for data validation rules',
        '8. Create tests for related data and associations',
        '9. Ensure proper data cleanup in teardown',
        '10. Add assertions for data integrity'
      ],
      outputFormat: 'JSON object with implemented data management tests'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'testCount', 'testFiles', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        testCount: { type: 'number' },
        testFiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              testName: { type: 'string' },
              category: { type: 'string' },
              estimatedDuration: { type: 'string' }
            }
          }
        },
        coverageByScenario: {
          type: 'object',
          description: 'Test coverage by data management scenario'
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'e2e-testing', 'data-management', 'test-implementation']
}));

// Phase 6: Test Execution
export const testExecutionTask = defineTask('test-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Test Suite Execution - ${args.executionType} - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Test Execution Specialist',
      task: 'Execute E2E test suite and analyze results',
      context: {
        projectName: args.projectName,
        applicationUrl: args.applicationUrl,
        frameworkType: args.frameworkType,
        parallelExecutionEnabled: args.parallelExecutionEnabled,
        executionType: args.executionType,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure test execution environment',
        '2. Run E2E test suite (parallel if enabled)',
        '3. Capture test execution results (passed, failed, skipped)',
        '4. Identify flaky tests (inconsistent pass/fail)',
        '5. Analyze failure reasons and categorize',
        '6. Capture screenshots and videos for failures',
        '7. Generate HTML test report',
        '8. Calculate pass rate, flakiness rate, execution time',
        '9. Identify top failure reasons and error patterns',
        '10. Generate execution summary and recommendations'
      ],
      outputFormat: 'JSON object with test execution results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'totalTests', 'passed', 'failed', 'passRate', 'flakinessRate', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        totalTests: { type: 'number' },
        passed: { type: 'number' },
        failed: { type: 'number' },
        skipped: { type: 'number' },
        passRate: { type: 'number', description: 'Pass rate percentage' },
        flakinessRate: { type: 'number', description: 'Flakiness rate percentage' },
        executionTime: { type: 'number', description: 'Total execution time in minutes' },
        flakyTests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testName: { type: 'string' },
              flakinessScore: { type: 'number' },
              reason: { type: 'string' }
            }
          }
        },
        topFailureReasons: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              reason: { type: 'string' },
              count: { type: 'number' },
              affectedTests: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        reportPath: { type: 'string', description: 'Path to HTML test report' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'e2e-testing', 'test-execution', 'test-results']
}));

// Phase 7: Debugging and Fixes
export const debuggingAndFixesTask = defineTask('debugging-fixes', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Test Debugging and Fixes - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Test Debugging Expert',
      task: 'Debug test failures and implement fixes',
      context: {
        projectName: args.projectName,
        executionResults: args.executionResults,
        pageObjects: args.pageObjects,
        testScenarios: args.testScenarios,
        frameworkType: args.frameworkType,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze all test failures from execution results',
        '2. Categorize failures (locator issues, timing, test data, app bugs)',
        '3. Fix locator issues (update selectors, use better locator strategies)',
        '4. Resolve timing issues (add explicit waits, fix race conditions)',
        '5. Fix test data issues (update fixtures, factories)',
        '6. Update Page Objects with corrected locators and methods',
        '7. Add error handling and retry logic where appropriate',
        '8. Document actual application bugs found (separate from test issues)',
        '9. Re-run fixed tests to verify resolution',
        '10. Generate debugging report with fixes applied'
      ],
      outputFormat: 'JSON object with debugging results and fixes'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'totalIssuesFixed', 'remainingIssues', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        totalIssuesFixed: { type: 'number' },
        fixedIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testName: { type: 'string' },
              issueType: { type: 'string' },
              fix: { type: 'string' },
              resolved: { type: 'boolean' }
            }
          }
        },
        remainingIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testName: { type: 'string' },
              issueType: { type: 'string' },
              reason: { type: 'string' },
              recommendedAction: { type: 'string' }
            }
          }
        },
        applicationBugsFound: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              severity: { type: 'string' },
              foundInTest: { type: 'string' }
            }
          }
        },
        improvementRate: { type: 'number', description: 'Percentage of issues fixed' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'e2e-testing', 'debugging', 'test-fixes']
}));

// Phase 8: Stability Improvements
export const stabilityImprovementsTask = defineTask('stability-improvements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Test Stability Improvements - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Test Stability Engineer',
      task: 'Eliminate test flakiness and improve overall test stability',
      context: {
        projectName: args.projectName,
        executionResults: args.executionResults,
        debuggingResults: args.debuggingResults,
        frameworkType: args.frameworkType,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify all flaky tests from multiple test runs',
        '2. Analyze root causes (timing, race conditions, test dependencies)',
        '3. Replace hard waits with intelligent explicit waits',
        '4. Ensure test isolation (no shared state, proper cleanup)',
        '5. Add retry logic for known intermittent issues',
        '6. Implement proper test setup and teardown',
        '7. Add network request stabilization (wait for API calls)',
        '8. Implement idempotent test design',
        '9. Add test execution order independence',
        '10. Run stability validation (execute tests 5-10 times)'
      ],
      outputFormat: 'JSON object with stability improvements'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'stabilityScore', 'improvementsMade', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        stabilityScore: { type: 'number', minimum: 0, maximum: 100 },
        flakinessReduction: { type: 'number', description: 'Percentage reduction in flakiness' },
        improvementsMade: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testName: { type: 'string' },
              issue: { type: 'string' },
              improvement: { type: 'string' },
              verified: { type: 'boolean' }
            }
          }
        },
        remainingFlakyTests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testName: { type: 'string' },
              flakinessRate: { type: 'number' },
              recommendedAction: { type: 'string' }
            }
          }
        },
        stabilityPatterns: {
          type: 'array',
          items: { type: 'string' },
          description: 'Stability patterns and best practices applied'
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'e2e-testing', 'stability', 'flakiness-elimination']
}));

// Phase 10: Code Review
export const codeReviewTask = defineTask('code-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Test Code Review and Refinement - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior Test Automation Architect and Code Reviewer',
      task: 'Conduct comprehensive code review of test suite',
      context: {
        projectName: args.projectName,
        pageObjects: args.pageObjects,
        testFiles: args.testFiles,
        frameworkType: args.frameworkType,
        executionResults: args.executionResults,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Review Page Object implementation for best practices',
        '2. Check test code quality, readability, and maintainability',
        '3. Verify proper use of assertions and error messages',
        '4. Review test data management approach',
        '5. Check for code duplication and refactoring opportunities',
        '6. Verify proper use of waits and synchronization',
        '7. Review naming conventions and test organization',
        '8. Check error handling and test resilience',
        '9. Identify security issues (hardcoded credentials, sensitive data)',
        '10. Generate code review report with prioritized suggestions'
      ],
      outputFormat: 'JSON object with code review results'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'criticalIssues', 'suggestions', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        criticalIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              file: { type: 'string' },
              line: { type: 'number' },
              issue: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              recommendation: { type: 'string' }
            }
          }
        },
        suggestions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              suggestion: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        bestPracticeViolations: {
          type: 'array',
          items: { type: 'string' }
        },
        refactoringOpportunities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              area: { type: 'string' },
              description: { type: 'string' },
              benefit: { type: 'string' }
            }
          }
        },
        securityConcerns: { type: 'array', items: { type: 'string' } },
        reviewReportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'e2e-testing', 'code-review', 'quality-assurance']
}));

// Phase 11: Visual Regression Setup
export const visualRegressionSetupTask = defineTask('visual-regression-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Visual Regression Testing Setup - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Visual Testing Specialist',
      task: 'Set up visual regression testing for E2E test suite',
      context: {
        projectName: args.projectName,
        applicationUrl: args.applicationUrl,
        pageObjects: args.pageObjects,
        frameworkType: args.frameworkType,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure visual testing tool (Playwright screenshots, Percy, BackstopJS)',
        '2. Identify critical screens for visual testing',
        '3. Capture baseline screenshots for all critical screens',
        '4. Configure viewport sizes for responsive testing',
        '5. Mask dynamic content (timestamps, user-specific data)',
        '6. Set visual difference thresholds',
        '7. Integrate visual tests with existing E2E tests',
        '8. Configure visual regression in CI/CD pipeline',
        '9. Create visual test review workflow',
        '10. Generate visual testing documentation'
      ],
      outputFormat: 'JSON object with visual regression setup'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'baselinesCaptured', 'configPath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        baselinesCaptured: { type: 'number' },
        visualTestScreens: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              screenName: { type: 'string' },
              viewports: { type: 'array', items: { type: 'string' } },
              baselinePath: { type: 'string' }
            }
          }
        },
        configPath: { type: 'string' },
        thresholdSettings: {
          type: 'object',
          properties: {
            pixelMatchThreshold: { type: 'number' },
            ignoreRegions: { type: 'array' }
          }
        },
        cicdIntegrated: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'e2e-testing', 'visual-regression', 'ui-testing']
}));

// Phase 12: Documentation Generation
export const documentationGenerationTask = defineTask('documentation-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Test Suite Documentation Generation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Documentation Specialist',
      task: 'Generate comprehensive E2E test suite documentation',
      context: {
        projectName: args.projectName,
        journeyAnalysis: args.journeyAnalysis,
        testDesign: args.testDesign,
        pageObjectDevelopment: args.pageObjectDevelopment,
        testDataSetup: args.testDataSetup,
        executionResults: args.executionResults,
        stabilityImprovements: args.stabilityImprovements,
        codeReview: args.codeReview,
        visualRegression: args.visualRegression,
        frameworkType: args.frameworkType,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create test suite overview document',
        '2. Document architecture and framework structure',
        '3. Write usage guide (how to run tests, add new tests)',
        '4. Document Page Object patterns and conventions',
        '5. Create test data management guide',
        '6. Document troubleshooting common issues',
        '7. Write contribution guidelines for new team members',
        '8. Create test coverage report',
        '9. Document CI/CD integration steps',
        '10. Generate README with quick start guide'
      ],
      outputFormat: 'JSON object with documentation paths and summary'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'testSuiteDocPath', 'usageGuidePath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        testSuiteDocPath: { type: 'string', description: 'Main test suite documentation' },
        usageGuidePath: { type: 'string', description: 'How to use the test suite' },
        architectureDocPath: { type: 'string' },
        troubleshootingPath: { type: 'string' },
        contributionGuidePath: { type: 'string' },
        coverageReportPath: { type: 'string' },
        readmePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'e2e-testing', 'documentation', 'technical-writing']
}));

// Phase 13: CI/CD Integration
export const cicdIntegrationTask = defineTask('cicd-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 13: CI/CD Integration Verification - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DevOps Engineer specializing in Test Automation',
      task: 'Verify CI/CD integration readiness for E2E test suite',
      context: {
        projectName: args.projectName,
        frameworkType: args.frameworkType,
        parallelExecutionEnabled: args.parallelExecutionEnabled,
        executionResults: args.executionResults,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create CI/CD pipeline configuration (GitHub Actions, GitLab CI, Jenkins)',
        '2. Configure test execution stages (unit, integration, E2E)',
        '3. Set up parallel test execution in pipeline',
        '4. Configure artifact storage (test reports, screenshots, videos)',
        '5. Set up test failure notifications (Slack, email, MS Teams)',
        '6. Configure test result reporting and dashboards',
        '7. Add quality gates (pass rate thresholds, flakiness checks)',
        '8. Set up scheduled test execution (nightly, weekly)',
        '9. Document pipeline configuration and maintenance',
        '10. Verify pipeline with test run'
      ],
      outputFormat: 'JSON object with CI/CD integration status'
    },
    outputSchema: {
      type: 'object',
      required: ['ready', 'pipelineConfigPath', 'artifacts'],
      properties: {
        ready: { type: 'boolean' },
        pipelineConfigPath: { type: 'string' },
        pipelineType: { type: 'string' },
        stages: { type: 'array', items: { type: 'string' } },
        parallelJobsConfigured: { type: 'number' },
        artifactStorageConfigured: { type: 'boolean' },
        notificationsConfigured: { type: 'boolean' },
        qualityGatesConfigured: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gate: { type: 'string' },
              threshold: { type: 'string' }
            }
          }
        },
        scheduledRunsConfigured: { type: 'boolean' },
        testRunVerified: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'e2e-testing', 'cicd', 'devops']
}));

// Phase 14: Final Assessment
export const finalAssessmentTask = defineTask('final-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 14: Final Assessment and Metrics - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'QA Lead and Test Strategy Expert',
      task: 'Conduct final assessment of E2E test suite and compute metrics',
      context: {
        projectName: args.projectName,
        journeyAnalysis: args.journeyAnalysis,
        testDesign: args.testDesign,
        pageObjectDevelopment: args.pageObjectDevelopment,
        testDataSetup: args.testDataSetup,
        authenticationTests: args.authenticationTests,
        coreWorkflowTests: args.coreWorkflowTests,
        dataManagementTests: args.dataManagementTests,
        finalExecution: args.finalExecution,
        stabilityImprovements: args.stabilityImprovements,
        codeReview: args.codeReview,
        visualRegression: args.visualRegression,
        cicdIntegration: args.cicdIntegration,
        acceptanceCriteria: args.acceptanceCriteria,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Calculate test coverage across all user journeys',
        '2. Compute overall stability score (0-100)',
        '3. Assess test suite maintainability',
        '4. Evaluate execution performance (time, parallelization)',
        '5. Assess test data management effectiveness',
        '6. Review code quality and best practices adherence',
        '7. Evaluate CI/CD integration completeness',
        '8. Compare results against acceptance criteria',
        '9. Provide production readiness verdict',
        '10. Generate comprehensive metrics report with recommendations'
      ],
      outputFormat: 'JSON object with final assessment and metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['testSuiteStats', 'stabilityScore', 'productionReady', 'verdict', 'recommendation', 'artifacts'],
      properties: {
        testSuiteStats: {
          type: 'object',
          properties: {
            totalTests: { type: 'number' },
            passRate: { type: 'number' },
            flakinessRate: { type: 'number' },
            averageExecutionTime: { type: 'number', description: 'Minutes' },
            parallelizationFactor: { type: 'number' },
            codeQualityScore: { type: 'number' }
          }
        },
        stabilityScore: { type: 'number', minimum: 0, maximum: 100 },
        coverageScore: { type: 'number', minimum: 0, maximum: 100 },
        maintainabilityScore: { type: 'number', minimum: 0, maximum: 100 },
        productionReady: { type: 'boolean' },
        acceptanceCriteriaMet: {
          type: 'object',
          properties: {
            testCoverage: { type: 'boolean' },
            passRate: { type: 'boolean' },
            flakiness: { type: 'boolean' },
            executionTime: { type: 'boolean' }
          }
        },
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
  labels: ['agent', 'e2e-testing', 'assessment', 'metrics']
}));
