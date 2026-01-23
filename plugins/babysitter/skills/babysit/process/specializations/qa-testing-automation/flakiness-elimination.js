/**
 * @process specializations/qa-testing-automation/flakiness-elimination
 * @description Test Flakiness Elimination - Systematically identify, analyze, and eliminate flaky tests to improve
 * test reliability and build confidence in the test suite through root cause analysis, stabilization techniques,
 * and continuous monitoring.
 * @inputs { testSuite: string, executionHistory?: array, cicdPlatform?: string, testFramework?: string, targetFlakiness?: number, quarantineEnabled?: boolean }
 * @outputs { success: boolean, flakinessRate: number, stabilizedTests: array, quarantinedTests: array, recommendations: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/qa-testing-automation/flakiness-elimination', {
 *   testSuite: './tests/e2e',
 *   executionHistory: [
 *     { testId: 'test-1', runs: 100, failures: 15, passRate: 85 },
 *     { testId: 'test-2', runs: 100, failures: 3, passRate: 97 }
 *   ],
 *   cicdPlatform: 'github-actions',
 *   testFramework: 'playwright',
 *   targetFlakiness: 2,
 *   quarantineEnabled: true
 * });
 *
 * @references
 * - Google Testing Blog - Flaky Tests: https://testing.googleblog.com/2016/05/flaky-tests-at-google-and-how-we.html
 * - Martin Fowler - Eradicating Non-Determinism: https://martinfowler.com/articles/nonDeterminism.html
 * - Microsoft - Analyzing Flaky Tests: https://www.microsoft.com/en-us/research/publication/empirically-revisiting-analyzing-flaky-tests/
 * - Playwright - Best Practices: https://playwright.dev/docs/best-practices
 * - TestProject - Flaky Tests Guide: https://blog.testproject.io/2020/06/23/how-to-handle-flaky-tests/
 * - Cypress - Flakiness Guide: https://docs.cypress.io/guides/references/best-practices#Flake-Resistant-Tests
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    testSuite,
    executionHistory = null,
    cicdPlatform = 'jenkins',
    testFramework = 'playwright',
    targetFlakiness = 2,
    quarantineEnabled = true,
    runCount = 10,
    parallelRuns = false,
    environmentDetails = null,
    outputDir = 'flakiness-elimination-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const stabilizedTests = [];
  const quarantinedTests = [];

  ctx.log('info', `Starting Test Flakiness Elimination Process`);
  ctx.log('info', `Test Suite: ${testSuite}`);
  ctx.log('info', `Target Flakiness Rate: ${targetFlakiness}%`);
  ctx.log('info', `Test Framework: ${testFramework}`);

  // ============================================================================
  // PHASE 1: FLAKINESS DETECTION AND ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Detecting and analyzing flaky tests');

  const flakinessDetection = await ctx.task(flakinessDetectionTask, {
    testSuite,
    executionHistory,
    runCount,
    parallelRuns,
    testFramework,
    cicdPlatform,
    outputDir
  });

  if (!flakinessDetection.success) {
    return {
      success: false,
      error: 'Flakiness detection failed',
      details: flakinessDetection,
      metadata: { processId: 'specializations/qa-testing-automation/flakiness-elimination', timestamp: startTime }
    };
  }

  artifacts.push(...flakinessDetection.artifacts);

  const flakyTests = flakinessDetection.flakyTests;
  const currentFlakinessRate = flakinessDetection.flakinessRate;

  ctx.log('info', `Detected ${flakyTests.length} flaky tests (${currentFlakinessRate.toFixed(2)}% flakiness rate)`);

  // Quality Gate: Check if flakiness rate is within acceptable threshold
  if (currentFlakinessRate <= targetFlakiness) {
    ctx.log('info', `Flakiness rate ${currentFlakinessRate.toFixed(2)}% is within target ${targetFlakiness}%`);

    await ctx.breakpoint({
      question: `Flakiness rate ${currentFlakinessRate.toFixed(2)}% is within target. Continue with preventive analysis or complete process?`,
      title: 'Flakiness Target Already Met',
      context: {
        runId: ctx.runId,
        currentFlakinessRate,
        targetFlakiness,
        flakyTests: flakyTests.map(t => ({ test: t.testName, failureRate: t.failureRate })),
        files: flakinessDetection.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 2: ROOT CAUSE CATEGORIZATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing root causes of flaky tests');

  const rootCauseAnalysis = await ctx.task(rootCauseAnalysisTask, {
    flakyTests,
    testSuite,
    testFramework,
    environmentDetails,
    outputDir
  });

  artifacts.push(...rootCauseAnalysis.artifacts);

  const categorizedTests = rootCauseAnalysis.categorizedTests;
  const rootCauseDistribution = rootCauseAnalysis.distribution;

  ctx.log('info', `Root cause distribution:`);
  Object.entries(rootCauseDistribution).forEach(([cause, count]) => {
    ctx.log('info', `  - ${cause}: ${count} tests`);
  });

  // Breakpoint: Review root cause analysis
  await ctx.breakpoint({
    question: `Root cause analysis complete. ${categorizedTests.length} tests categorized. Review findings and approve stabilization plan?`,
    title: 'Root Cause Analysis Review',
    context: {
      runId: ctx.runId,
      totalFlakyTests: flakyTests.length,
      rootCauseDistribution,
      categorizedTests: categorizedTests.map(t => ({
        test: t.testName,
        rootCause: t.rootCause,
        confidence: t.confidence,
        recommendation: t.recommendation
      })),
      files: rootCauseAnalysis.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // PHASE 3: STABILIZATION STRATEGY PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 3: Planning stabilization strategies');

  const stabilizationPlan = await ctx.task(stabilizationPlanningTask, {
    categorizedTests,
    rootCauseDistribution,
    testFramework,
    targetFlakiness,
    quarantineEnabled,
    outputDir
  });

  artifacts.push(...stabilizationPlan.artifacts);

  const stabilizationStrategies = stabilizationPlan.strategies;
  const prioritizedTests = stabilizationPlan.prioritizedTests;

  ctx.log('info', `Stabilization plan created with ${stabilizationStrategies.length} strategies`);

  // Breakpoint: Review and approve stabilization plan
  await ctx.breakpoint({
    question: `Stabilization plan created for ${prioritizedTests.length} tests. Review plan and approve execution?`,
    title: 'Stabilization Plan Approval',
    context: {
      runId: ctx.runId,
      totalTests: prioritizedTests.length,
      strategies: stabilizationStrategies.map(s => ({
        category: s.category,
        testCount: s.testCount,
        estimatedEffort: s.estimatedEffort,
        techniques: s.techniques
      })),
      files: stabilizationPlan.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // PHASE 4: TIMING ISSUES STABILIZATION (PARALLEL)
  // ============================================================================

  ctx.log('info', 'Phase 4: Stabilizing tests with timing issues');

  const timingTests = categorizedTests.filter(t => t.rootCause === 'timing' || t.rootCause === 'race_condition');

  if (timingTests.length > 0) {
    const timingStabilizationTasks = timingTests.map(test =>
      () => ctx.task(timingIssueStabilizationTask, {
        test,
        testSuite,
        testFramework,
        outputDir
      })
    );

    const timingResults = await ctx.parallel.all(timingStabilizationTasks);

    stabilizedTests.push(...timingResults.filter(r => r.stabilized).map(r => ({
      testName: r.testName,
      category: 'timing',
      changesMade: r.changesMade
    })));

    artifacts.push(...timingResults.flatMap(r => r.artifacts));

    ctx.log('info', `Stabilized ${stabilizedTests.length}/${timingTests.length} timing-related tests`);
  }

  // ============================================================================
  // PHASE 5: TEST ISOLATION STABILIZATION (PARALLEL)
  // ============================================================================

  ctx.log('info', 'Phase 5: Stabilizing tests with isolation issues');

  const isolationTests = categorizedTests.filter(t => t.rootCause === 'test_dependency' || t.rootCause === 'shared_state');

  if (isolationTests.length > 0) {
    const isolationStabilizationTasks = isolationTests.map(test =>
      () => ctx.task(testIsolationStabilizationTask, {
        test,
        testSuite,
        testFramework,
        outputDir
      })
    );

    const isolationResults = await ctx.parallel.all(isolationStabilizationTasks);

    const isolationStabilized = isolationResults.filter(r => r.stabilized).map(r => ({
      testName: r.testName,
      category: 'isolation',
      changesMade: r.changesMade
    }));

    stabilizedTests.push(...isolationStabilized);
    artifacts.push(...isolationResults.flatMap(r => r.artifacts));

    ctx.log('info', `Stabilized ${isolationStabilized.length}/${isolationTests.length} isolation-related tests`);
  }

  // ============================================================================
  // PHASE 6: ENVIRONMENT ISSUES STABILIZATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Stabilizing tests with environment issues');

  const environmentTests = categorizedTests.filter(t => t.rootCause === 'environment' || t.rootCause === 'infrastructure');

  if (environmentTests.length > 0) {
    const environmentStabilization = await ctx.task(environmentIssueStabilizationTask, {
      tests: environmentTests,
      testSuite,
      environmentDetails,
      cicdPlatform,
      outputDir
    });

    if (environmentStabilization.stabilized > 0) {
      stabilizedTests.push(...environmentStabilization.stabilizedTests.map(t => ({
        testName: t.testName,
        category: 'environment',
        changesMade: t.changesMade
      })));
    }

    artifacts.push(...environmentStabilization.artifacts);

    ctx.log('info', `Stabilized ${environmentStabilization.stabilized}/${environmentTests.length} environment-related tests`);
  }

  // ============================================================================
  // PHASE 7: NETWORK/API ISSUES STABILIZATION (PARALLEL)
  // ============================================================================

  ctx.log('info', 'Phase 7: Stabilizing tests with network/API issues');

  const networkTests = categorizedTests.filter(t => t.rootCause === 'network' || t.rootCause === 'external_dependency');

  if (networkTests.length > 0) {
    const networkStabilizationTasks = networkTests.map(test =>
      () => ctx.task(networkIssueStabilizationTask, {
        test,
        testSuite,
        testFramework,
        outputDir
      })
    );

    const networkResults = await ctx.parallel.all(networkStabilizationTasks);

    const networkStabilized = networkResults.filter(r => r.stabilized).map(r => ({
      testName: r.testName,
      category: 'network',
      changesMade: r.changesMade
    }));

    stabilizedTests.push(...networkStabilized);
    artifacts.push(...networkResults.flatMap(r => r.artifacts));

    ctx.log('info', `Stabilized ${networkStabilized.length}/${networkTests.length} network-related tests`);
  }

  // ============================================================================
  // PHASE 8: TEST DESIGN ISSUES STABILIZATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Stabilizing tests with design issues');

  const designTests = categorizedTests.filter(t => t.rootCause === 'test_design' || t.rootCause === 'brittle_assertions');

  if (designTests.length > 0) {
    const designStabilization = await ctx.task(testDesignStabilizationTask, {
      tests: designTests,
      testSuite,
      testFramework,
      outputDir
    });

    if (designStabilization.stabilized > 0) {
      stabilizedTests.push(...designStabilization.stabilizedTests.map(t => ({
        testName: t.testName,
        category: 'design',
        changesMade: t.changesMade
      })));
    }

    artifacts.push(...designStabilization.artifacts);

    ctx.log('info', `Stabilized ${designStabilization.stabilized}/${designTests.length} design-related tests`);
  }

  // ============================================================================
  // PHASE 9: QUARANTINE REMAINING FLAKY TESTS
  // ============================================================================

  ctx.log('info', 'Phase 9: Quarantining remaining unstabilized tests');

  const unstabilizedTests = categorizedTests.filter(t =>
    !stabilizedTests.some(st => st.testName === t.testName)
  );

  if (quarantineEnabled && unstabilizedTests.length > 0) {
    const quarantineResult = await ctx.task(testQuarantineTask, {
      tests: unstabilizedTests,
      testSuite,
      testFramework,
      cicdPlatform,
      outputDir
    });

    quarantinedTests.push(...quarantineResult.quarantinedTests.map(t => ({
      testName: t.testName,
      rootCause: t.rootCause,
      reason: t.quarantineReason
    })));

    artifacts.push(...quarantineResult.artifacts);

    ctx.log('info', `Quarantined ${quarantinedTests.length} remaining flaky tests`);
  }

  // ============================================================================
  // PHASE 10: VALIDATION - RE-RUN TESTS
  // ============================================================================

  ctx.log('info', 'Phase 10: Validating stabilization by re-running tests');

  const validationResult = await ctx.task(stabilizationValidationTask, {
    stabilizedTests,
    testSuite,
    runCount: runCount * 2, // More runs for validation
    testFramework,
    outputDir
  });

  artifacts.push(...validationResult.artifacts);

  const validatedStabilizations = validationResult.validatedTests;
  const newFlakinessRate = validationResult.flakinessRate;

  ctx.log('info', `Validation complete: ${validatedStabilizations.length}/${stabilizedTests.length} tests confirmed stable`);
  ctx.log('info', `New flakiness rate: ${newFlakinessRate.toFixed(2)}% (was ${currentFlakinessRate.toFixed(2)}%)`);

  // Quality Gate: Check if target flakiness rate achieved
  const targetMet = newFlakinessRate <= targetFlakiness;

  if (!targetMet) {
    await ctx.breakpoint({
      question: `Target flakiness rate not met: ${newFlakinessRate.toFixed(2)}% > ${targetFlakiness}%. Continue with additional iterations or complete process?`,
      title: 'Target Flakiness Not Met',
      context: {
        runId: ctx.runId,
        currentRate: newFlakinessRate,
        targetRate: targetFlakiness,
        stabilized: validatedStabilizations.length,
        quarantined: quarantinedTests.length,
        remaining: unstabilizedTests.length - quarantinedTests.length,
        files: validationResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 11: MONITORING SETUP
  // ============================================================================

  ctx.log('info', 'Phase 11: Setting up flakiness monitoring');

  const monitoringSetup = await ctx.task(flakinessMonitoringSetupTask, {
    testSuite,
    testFramework,
    cicdPlatform,
    targetFlakiness,
    outputDir
  });

  artifacts.push(...monitoringSetup.artifacts);

  ctx.log('info', 'Flakiness monitoring dashboard and alerts configured');

  // ============================================================================
  // PHASE 12: BEST PRACTICES DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 12: Generating best practices documentation');

  const bestPracticesDoc = await ctx.task(bestPracticesDocumentationTask, {
    categorizedTests,
    stabilizedTests,
    rootCauseDistribution,
    testFramework,
    outputDir
  });

  artifacts.push(...bestPracticesDoc.artifacts);

  ctx.log('info', 'Best practices documentation generated');

  // ============================================================================
  // PHASE 13: COMPREHENSIVE REPORT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 13: Generating comprehensive flakiness elimination report');

  const finalReport = await ctx.task(flakinessEliminationReportTask, {
    originalFlakinessRate: currentFlakinessRate,
    newFlakinessRate,
    targetFlakiness,
    flakyTests: flakyTests.length,
    stabilizedTests: validatedStabilizations.length,
    quarantinedTests: quarantinedTests.length,
    rootCauseDistribution,
    testSuite,
    outputDir
  });

  artifacts.push(...finalReport.artifacts);

  // ============================================================================
  // PHASE 14: FINAL REVIEW AND APPROVAL
  // ============================================================================

  ctx.log('info', 'Phase 14: Final review and approval');

  const improvement = currentFlakinessRate - newFlakinessRate;
  const improvementPercent = (improvement / currentFlakinessRate) * 100;

  await ctx.breakpoint({
    question: `Flakiness elimination complete. Reduced flakiness from ${currentFlakinessRate.toFixed(2)}% to ${newFlakinessRate.toFixed(2)}% (${improvementPercent.toFixed(1)}% improvement). Target ${targetMet ? 'MET' : 'NOT MET'}. Approve and merge changes?`,
    title: 'Final Flakiness Elimination Approval',
    context: {
      runId: ctx.runId,
      summary: {
        originalRate: currentFlakinessRate,
        newRate: newFlakinessRate,
        targetRate: targetFlakiness,
        improvement: improvementPercent,
        targetMet,
        totalFlakyTests: flakyTests.length,
        stabilized: validatedStabilizations.length,
        quarantined: quarantinedTests.length,
        remaining: flakyTests.length - validatedStabilizations.length - quarantinedTests.length
      },
      breakdown: {
        timingIssues: stabilizedTests.filter(t => t.category === 'timing').length,
        isolationIssues: stabilizedTests.filter(t => t.category === 'isolation').length,
        environmentIssues: stabilizedTests.filter(t => t.category === 'environment').length,
        networkIssues: stabilizedTests.filter(t => t.category === 'network').length,
        designIssues: stabilizedTests.filter(t => t.category === 'design').length
      },
      files: [
        { path: finalReport.reportPath, format: 'markdown', label: 'Final Report' },
        { path: bestPracticesDoc.documentPath, format: 'markdown', label: 'Best Practices' },
        { path: monitoringSetup.dashboardConfigPath, format: 'json', label: 'Monitoring Config' },
        { path: validationResult.reportPath, format: 'json', label: 'Validation Results' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: targetMet,
    flakinessRate: newFlakinessRate,
    originalFlakinessRate: currentFlakinessRate,
    improvement: {
      absolute: improvement,
      percentage: improvementPercent
    },
    targetFlakiness,
    targetMet,
    testSummary: {
      totalFlaky: flakyTests.length,
      stabilized: validatedStabilizations.length,
      quarantined: quarantinedTests.length,
      remaining: flakyTests.length - validatedStabilizations.length - quarantinedTests.length
    },
    stabilizedTests: validatedStabilizations.map(t => ({
      testName: t.testName,
      category: stabilizedTests.find(st => st.testName === t.testName)?.category || 'unknown',
      originalFailureRate: flakyTests.find(ft => ft.testName === t.testName)?.failureRate || 0,
      newFailureRate: t.newFailureRate
    })),
    quarantinedTests,
    rootCauseDistribution,
    monitoringSetup: {
      dashboardUrl: monitoringSetup.dashboardUrl,
      alertsConfigured: monitoringSetup.alertsConfigured
    },
    recommendations: finalReport.recommendations,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/qa-testing-automation/flakiness-elimination',
      timestamp: startTime,
      testFramework,
      testSuite
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: Flakiness Detection
export const flakinessDetectionTask = defineTask('flakiness-detection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Flakiness Detection - ${args.testSuite}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior Test Engineer specializing in test stability and reliability',
      task: 'Detect flaky tests through repeated execution and statistical analysis',
      context: {
        testSuite: args.testSuite,
        executionHistory: args.executionHistory,
        runCount: args.runCount,
        parallelRuns: args.parallelRuns,
        testFramework: args.testFramework,
        cicdPlatform: args.cicdPlatform,
        outputDir: args.outputDir
      },
      instructions: [
        '1. If executionHistory provided, analyze historical test pass/fail patterns',
        '2. If no history, run test suite multiple times (runCount) to detect flakiness',
        '3. Track each test execution result (pass/fail) across all runs',
        '4. Calculate failure rate for each test (failures / total runs)',
        '5. Identify tests with 0 < failure rate < 100% as flaky',
        '6. Calculate overall flakiness rate (flaky tests / total tests)',
        '7. Collect failure logs, screenshots, and error messages for flaky tests',
        '8. Identify patterns in failures (specific environments, times, conditions)',
        '9. Calculate confidence scores for flakiness classification',
        '10. Generate initial flakiness heatmap by test and category',
        '11. Create detailed flakiness detection report with statistics',
        '12. Return comprehensive flakiness analysis'
      ],
      outputFormat: 'JSON object with flaky tests and analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'flakyTests', 'flakinessRate', 'totalTests', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        flakyTests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testName: { type: 'string' },
              testPath: { type: 'string' },
              failureRate: { type: 'number', minimum: 0, maximum: 100 },
              totalRuns: { type: 'number' },
              failures: { type: 'number' },
              passes: { type: 'number' },
              failurePattern: { type: 'string', description: 'e.g., intermittent, environment-specific, time-dependent' },
              errorMessages: { type: 'array', items: { type: 'string' } },
              confidence: { type: 'number', description: 'Confidence score 0-100' }
            }
          }
        },
        flakinessRate: { type: 'number', description: 'Percentage of tests that are flaky' },
        totalTests: { type: 'number' },
        stableTests: { type: 'number' },
        executionSummary: {
          type: 'object',
          properties: {
            totalRuns: { type: 'number' },
            duration: { type: 'number' },
            parallelExecution: { type: 'boolean' }
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
  labels: ['agent', 'test-automation', 'flakiness', 'detection']
}));

// Phase 2: Root Cause Analysis
export const rootCauseAnalysisTask = defineTask('root-cause-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Root Cause Analysis - ${args.flakyTests.length} tests`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Test Automation Architect specializing in test stability',
      task: 'Analyze root causes of flaky tests and categorize by issue type',
      context: {
        flakyTests: args.flakyTests,
        testSuite: args.testSuite,
        testFramework: args.testFramework,
        environmentDetails: args.environmentDetails,
        outputDir: args.outputDir
      },
      instructions: [
        '1. For each flaky test, analyze failure logs and error messages',
        '2. Identify root cause categories:',
        '   - Timing issues (hardcoded waits, element not ready)',
        '   - Race conditions (async operations, parallel execution)',
        '   - Test dependencies (execution order, shared state)',
        '   - Shared state (global variables, database state)',
        '   - Environment issues (resource availability, configuration)',
        '   - Infrastructure (CI/CD environment, network instability)',
        '   - Network issues (API timeouts, external service flakiness)',
        '   - External dependencies (third-party services)',
        '   - Test design (brittle selectors, tight assertions)',
        '   - Brittle assertions (over-specified expectations)',
        '3. Analyze test code to confirm root cause hypothesis',
        '4. Assign confidence score to each categorization (0-100)',
        '5. Provide specific evidence for each categorization',
        '6. Generate recommended stabilization approach for each test',
        '7. Calculate root cause distribution statistics',
        '8. Identify common patterns across multiple tests',
        '9. Create root cause analysis report with examples',
        '10. Return categorized tests with recommendations'
      ],
      outputFormat: 'JSON object with categorized tests and analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['categorizedTests', 'distribution', 'artifacts'],
      properties: {
        categorizedTests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testName: { type: 'string' },
              testPath: { type: 'string' },
              rootCause: {
                type: 'string',
                enum: ['timing', 'race_condition', 'test_dependency', 'shared_state',
                       'environment', 'infrastructure', 'network', 'external_dependency',
                       'test_design', 'brittle_assertions', 'unknown']
              },
              confidence: { type: 'number', minimum: 0, maximum: 100 },
              evidence: { type: 'array', items: { type: 'string' } },
              recommendation: { type: 'string' },
              estimatedEffort: { type: 'string', enum: ['low', 'medium', 'high'] },
              priority: { type: 'number', minimum: 1, maximum: 10 }
            }
          }
        },
        distribution: {
          type: 'object',
          description: 'Count of tests by root cause category',
          additionalProperties: { type: 'number' }
        },
        commonPatterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string' },
              affectedTests: { type: 'number' },
              description: { type: 'string' }
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
  labels: ['agent', 'test-automation', 'flakiness', 'root-cause-analysis']
}));

// Phase 3: Stabilization Planning
export const stabilizationPlanningTask = defineTask('stabilization-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Stabilization Planning - ${args.categorizedTests.length} tests`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Test Strategy Lead',
      task: 'Create comprehensive stabilization plan with prioritization and strategies',
      context: {
        categorizedTests: args.categorizedTests,
        rootCauseDistribution: args.rootCauseDistribution,
        testFramework: args.testFramework,
        targetFlakiness: args.targetFlakiness,
        quarantineEnabled: args.quarantineEnabled,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Prioritize tests by:',
        '   - Criticality (business impact)',
        '   - Failure rate (higher rate = higher priority)',
        '   - Root cause effort (quick wins first)',
        '   - Dependencies (blockers first)',
        '2. Group tests by root cause category for batch stabilization',
        '3. Define stabilization strategies per category:',
        '   - Timing: Replace sleep() with explicit waits',
        '   - Race conditions: Add synchronization, proper async handling',
        '   - Test dependencies: Implement proper setup/teardown',
        '   - Shared state: Add test isolation, database cleanup',
        '   - Environment: Stabilize infrastructure, add retries',
        '   - Network: Add proper timeouts, retry logic, mocking',
        '   - Test design: Improve selectors, relax assertions',
        '4. Estimate effort for each test (hours)',
        '5. Create execution plan with phases and dependencies',
        '6. Identify tests for potential quarantine (high effort, low value)',
        '7. Define success criteria for each stabilization',
        '8. Calculate expected improvement in flakiness rate',
        '9. Generate detailed stabilization plan document',
        '10. Return comprehensive plan with timelines'
      ],
      outputFormat: 'JSON object with stabilization plan'
    },
    outputSchema: {
      type: 'object',
      required: ['strategies', 'prioritizedTests', 'artifacts'],
      properties: {
        strategies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              testCount: { type: 'number' },
              techniques: { type: 'array', items: { type: 'string' } },
              estimatedEffort: { type: 'string' },
              expectedImprovement: { type: 'number' }
            }
          }
        },
        prioritizedTests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testName: { type: 'string' },
              priority: { type: 'number' },
              rootCause: { type: 'string' },
              strategy: { type: 'string' },
              estimatedHours: { type: 'number' },
              expectedSuccess: { type: 'number' }
            }
          }
        },
        executionPlan: {
          type: 'object',
          properties: {
            phases: { type: 'array' },
            totalEstimatedHours: { type: 'number' },
            expectedFinalFlakiness: { type: 'number' }
          }
        },
        quarantineCandidates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testName: { type: 'string' },
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
  labels: ['agent', 'test-automation', 'flakiness', 'planning']
}));

// Phase 4: Timing Issue Stabilization
export const timingIssueStabilizationTask = defineTask('timing-issue-stabilization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Timing Stabilization - ${args.test.testName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Test Automation Engineer',
      task: 'Stabilize test with timing or race condition issues',
      context: {
        test: args.test,
        testSuite: args.testSuite,
        testFramework: args.testFramework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Read test code and identify timing-related issues',
        '2. Replace sleep/delay calls with explicit waits:',
        `   - ${args.testFramework === 'playwright' ? 'page.waitForSelector(), waitForLoadState()' : 'waitUntil(), wait()'}`,
        '3. Add proper synchronization for async operations',
        '4. Replace hard timeouts with dynamic element-ready checks',
        '5. Add retry logic for transient timing issues',
        '6. Ensure page/element is in expected state before action',
        '7. Add appropriate timeout configurations',
        '8. Implement proper wait conditions:',
        '   - Element visible',
        '   - Element enabled/clickable',
        '   - Network idle',
        '   - Animation complete',
        '9. Test stabilized version multiple times to verify',
        '10. Document changes made and reasoning',
        '11. Return stabilization result with verification'
      ],
      outputFormat: 'JSON object with stabilization result'
    },
    outputSchema: {
      type: 'object',
      required: ['testName', 'stabilized', 'artifacts'],
      properties: {
        testName: { type: 'string' },
        stabilized: { type: 'boolean' },
        changesMade: { type: 'array', items: { type: 'string' } },
        verificationRuns: { type: 'number' },
        verificationPassRate: { type: 'number' },
        codeChanges: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'test-automation', 'flakiness', 'timing', args.test.testName]
}));

// Phase 5: Test Isolation Stabilization
export const testIsolationStabilizationTask = defineTask('test-isolation-stabilization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Isolation Stabilization - ${args.test.testName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Test Automation Engineer',
      task: 'Stabilize test with isolation and dependency issues',
      context: {
        test: args.test,
        testSuite: args.testSuite,
        testFramework: args.testFramework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze test dependencies and execution order',
        '2. Identify shared state between tests (global vars, DB, files)',
        '3. Implement proper beforeEach/afterEach hooks for setup/teardown',
        '4. Add database cleanup or rollback after test',
        '5. Reset application state between tests',
        '6. Remove dependencies on other test execution order',
        '7. Ensure test can run independently and in any order',
        '8. Add test data isolation (unique IDs, separate namespaces)',
        '9. Clear caches, sessions, and cookies between tests',
        '10. Implement proper resource cleanup (connections, files)',
        '11. Verify test passes in isolation and when run with full suite',
        '12. Document isolation strategy implemented'
      ],
      outputFormat: 'JSON object with stabilization result'
    },
    outputSchema: {
      type: 'object',
      required: ['testName', 'stabilized', 'artifacts'],
      properties: {
        testName: { type: 'string' },
        stabilized: { type: 'boolean' },
        changesMade: { type: 'array', items: { type: 'string' } },
        isolationStrategy: { type: 'string' },
        verificationRuns: { type: 'number' },
        verificationPassRate: { type: 'number' },
        independentExecutionVerified: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'test-automation', 'flakiness', 'isolation', args.test.testName]
}));

// Phase 6: Environment Issue Stabilization
export const environmentIssueStabilizationTask = defineTask('environment-issue-stabilization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Environment Stabilization - ${args.tests.length} tests`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DevOps Engineer specializing in test infrastructure',
      task: 'Stabilize environment and infrastructure issues affecting tests',
      context: {
        tests: args.tests,
        testSuite: args.testSuite,
        environmentDetails: args.environmentDetails,
        cicdPlatform: args.cicdPlatform,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze environment-related failures across all tests',
        '2. Identify common infrastructure issues:',
        '   - Resource contention (CPU, memory)',
        '   - Disk space issues',
        '   - Port conflicts',
        '   - Docker/container instability',
        '   - CI/CD agent variability',
        '3. Stabilize test environment:',
        '   - Pin dependencies and versions',
        '   - Add resource allocation guarantees',
        '   - Implement environment health checks',
        '   - Add pre-test environment validation',
        '4. Improve CI/CD configuration:',
        '   - Use consistent agents/runners',
        '   - Add environment preparation steps',
        '   - Configure proper resource limits',
        '5. Add environment monitoring and diagnostics',
        '6. Implement environment reset between test runs',
        '7. Document environment requirements and setup',
        '8. Verify tests pass consistently in stabilized environment'
      ],
      outputFormat: 'JSON object with environment stabilization results'
    },
    outputSchema: {
      type: 'object',
      required: ['stabilized', 'stabilizedTests', 'artifacts'],
      properties: {
        stabilized: { type: 'number', description: 'Count of stabilized tests' },
        stabilizedTests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testName: { type: 'string' },
              changesMade: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        environmentChanges: { type: 'array', items: { type: 'string' } },
        cicdChanges: { type: 'array', items: { type: 'string' } },
        verificationRuns: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'test-automation', 'flakiness', 'environment']
}));

// Phase 7: Network Issue Stabilization
export const networkIssueStabilizationTask = defineTask('network-issue-stabilization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Network Stabilization - ${args.test.testName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Test Automation Engineer',
      task: 'Stabilize test with network and external dependency issues',
      context: {
        test: args.test,
        testSuite: args.testSuite,
        testFramework: args.testFramework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify network calls and external dependencies in test',
        '2. Implement proper retry logic for network requests:',
        '   - Exponential backoff',
        '   - Maximum retry attempts',
        '   - Retry only on transient errors',
        '3. Add appropriate timeout configurations:',
        '   - Connection timeout',
        '   - Request timeout',
        '   - Overall test timeout',
        '4. Consider mocking external services for stability:',
        '   - Use tools like Mock Service Worker (MSW)',
        '   - Create stub responses for third-party APIs',
        '5. Add network condition validation before test',
        '6. Implement graceful handling of network failures',
        '7. Add network request interceptors for debugging',
        '8. Configure proper wait conditions for API responses',
        '9. Add assertions for network response states',
        '10. Verify test passes with various network conditions'
      ],
      outputFormat: 'JSON object with stabilization result'
    },
    outputSchema: {
      type: 'object',
      required: ['testName', 'stabilized', 'artifacts'],
      properties: {
        testName: { type: 'string' },
        stabilized: { type: 'boolean' },
        changesMade: { type: 'array', items: { type: 'string' } },
        retryLogicAdded: { type: 'boolean' },
        mockingImplemented: { type: 'boolean' },
        timeoutsConfigured: { type: 'boolean' },
        verificationRuns: { type: 'number' },
        verificationPassRate: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'test-automation', 'flakiness', 'network', args.test.testName]
}));

// Phase 8: Test Design Stabilization
export const testDesignStabilizationTask = defineTask('test-design-stabilization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design Stabilization - ${args.tests.length} tests`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior Test Automation Architect',
      task: 'Improve test design to eliminate brittleness and flakiness',
      context: {
        tests: args.tests,
        testSuite: args.testSuite,
        testFramework: args.testFramework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze test design issues in affected tests',
        '2. Improve element selectors:',
        '   - Use stable data-testid attributes',
        '   - Avoid fragile CSS selectors',
        '   - Prefer semantic selectors over positional',
        '3. Relax over-specified assertions:',
        '   - Focus on essential behavior',
        '   - Avoid asserting implementation details',
        '   - Use flexible matchers (contains, matches)',
        '4. Improve test structure:',
        '   - Single responsibility per test',
        '   - Clear arrange-act-assert pattern',
        '   - Proper abstraction in Page Objects',
        '5. Handle dynamic content appropriately:',
        '   - Ignore changing timestamps/IDs',
        '   - Use partial matching for dynamic data',
        '   - Focus on stable elements',
        '6. Add proper error handling and logging',
        '7. Implement retry logic at appropriate levels',
        '8. Document test assumptions and preconditions',
        '9. Refactor complex tests into simpler scenarios',
        '10. Verify improved tests are stable and maintainable'
      ],
      outputFormat: 'JSON object with design stabilization results'
    },
    outputSchema: {
      type: 'object',
      required: ['stabilized', 'stabilizedTests', 'artifacts'],
      properties: {
        stabilized: { type: 'number' },
        stabilizedTests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testName: { type: 'string' },
              changesMade: { type: 'array', items: { type: 'string' } },
              designImprovements: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        verificationRuns: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'test-automation', 'flakiness', 'design']
}));

// Phase 9: Test Quarantine
export const testQuarantineTask = defineTask('test-quarantine', (args, taskCtx) => ({
  kind: 'agent',
  title: `Test Quarantine - ${args.tests.length} tests`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Test Infrastructure Engineer',
      task: 'Quarantine unstabilized flaky tests to protect build stability',
      context: {
        tests: args.tests,
        testSuite: args.testSuite,
        testFramework: args.testFramework,
        cicdPlatform: args.cicdPlatform,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create quarantine mechanism based on test framework:',
        `   - ${args.testFramework === 'playwright' ? 'Use test.skip() or @quarantine tag' : 'Use skip/xdescribe'}`,
        '2. Tag each quarantined test with metadata:',
        '   - Quarantine date',
        '   - Root cause',
        '   - Issue tracking number',
        '   - Assigned owner',
        '3. Move quarantined tests to separate test suite/file',
        '4. Configure CI/CD to skip quarantined tests in main pipeline',
        '5. Set up separate quarantine test runs (daily/weekly)',
        '6. Create tracking dashboard for quarantined tests',
        '7. Set up alerts for tests remaining in quarantine > 30 days',
        '8. Document quarantine process and SLA',
        '9. Create issue tickets for each quarantined test',
        '10. Generate quarantine report with actionable next steps'
      ],
      outputFormat: 'JSON object with quarantine results'
    },
    outputSchema: {
      type: 'object',
      required: ['quarantinedTests', 'artifacts'],
      properties: {
        quarantinedTests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testName: { type: 'string' },
              rootCause: { type: 'string' },
              quarantineReason: { type: 'string' },
              quarantineDate: { type: 'string' },
              issueNumber: { type: 'string' },
              assignedTo: { type: 'string' }
            }
          }
        },
        quarantineMechanism: { type: 'string' },
        cicdConfigured: { type: 'boolean' },
        trackingSetup: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'test-automation', 'flakiness', 'quarantine']
}));

// Phase 10: Stabilization Validation
export const stabilizationValidationTask = defineTask('stabilization-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Validation - ${args.stabilizedTests.length} tests`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'QA Validation Engineer',
      task: 'Validate that stabilized tests are now reliable through repeated execution',
      context: {
        stabilizedTests: args.stabilizedTests,
        testSuite: args.testSuite,
        runCount: args.runCount,
        testFramework: args.testFramework,
        outputDir: args.outputDir
      },
      instructions: [
        `1. Re-run each stabilized test ${args.runCount} times`,
        '2. Track pass/fail results for each run',
        '3. Calculate new failure rate for each test',
        '4. Compare new failure rate to original baseline',
        '5. Mark test as validated if failure rate < 2%',
        '6. Flag tests that remain flaky for further investigation',
        '7. Calculate overall flakiness rate after stabilization',
        '8. Measure improvement percentage',
        '9. Test in various conditions (parallel, different environments)',
        '10. Generate validation report with statistics',
        '11. Identify any regressions or new issues',
        '12. Return comprehensive validation results'
      ],
      outputFormat: 'JSON object with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['validatedTests', 'flakinessRate', 'reportPath', 'artifacts'],
      properties: {
        validatedTests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testName: { type: 'string' },
              validated: { type: 'boolean' },
              totalRuns: { type: 'number' },
              passes: { type: 'number' },
              failures: { type: 'number' },
              newFailureRate: { type: 'number' },
              improvement: { type: 'number', description: 'Percentage improvement' }
            }
          }
        },
        flakinessRate: { type: 'number' },
        totalValidated: { type: 'number' },
        stillFlaky: { type: 'number' },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'test-automation', 'flakiness', 'validation']
}));

// Phase 11: Flakiness Monitoring Setup
export const flakinessMonitoringSetupTask = defineTask('flakiness-monitoring-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Monitoring Setup`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DevOps Engineer specializing in test observability',
      task: 'Set up continuous flakiness monitoring and alerting',
      context: {
        testSuite: args.testSuite,
        testFramework: args.testFramework,
        cicdPlatform: args.cicdPlatform,
        targetFlakiness: args.targetFlakiness,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Set up test result tracking database/system',
        '2. Configure test execution data collection:',
        '   - Test name, duration, result (pass/fail)',
        '   - Timestamp, environment, CI build ID',
        '   - Error messages and stack traces',
        '3. Create flakiness metrics:',
        '   - Test pass rate over time',
        '   - Flakiness rate (suite and per-test)',
        '   - Time to stabilize',
        '   - Quarantine metrics',
        '4. Build monitoring dashboard with:',
        '   - Overall flakiness rate trend',
        '   - Most flaky tests ranking',
        '   - Flakiness by category',
        '   - Historical trends',
        '   - Quarantine status',
        '5. Configure alerts:',
        `   - Flakiness rate exceeds ${args.targetFlakiness}%`,
        '   - Individual test failure rate > 5%',
        '   - New flaky tests detected',
        '   - Quarantined tests exceeding SLA',
        '6. Integrate with CI/CD for automatic reporting',
        '7. Set up weekly flakiness health reports',
        '8. Document monitoring setup and usage'
      ],
      outputFormat: 'JSON object with monitoring setup details'
    },
    outputSchema: {
      type: 'object',
      required: ['dashboardUrl', 'alertsConfigured', 'artifacts'],
      properties: {
        dashboardUrl: { type: 'string' },
        dashboardConfigPath: { type: 'string' },
        alertsConfigured: { type: 'boolean' },
        alertChannels: { type: 'array', items: { type: 'string' } },
        metricsTracked: { type: 'array', items: { type: 'string' } },
        dataRetentionDays: { type: 'number' },
        reportSchedule: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'test-automation', 'flakiness', 'monitoring']
}));

// Phase 12: Best Practices Documentation
export const bestPracticesDocumentationTask = defineTask('best-practices-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Best Practices Documentation`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Writer specializing in test automation',
      task: 'Document best practices for preventing and fixing flaky tests',
      context: {
        categorizedTests: args.categorizedTests,
        stabilizedTests: args.stabilizedTests,
        rootCauseDistribution: args.rootCauseDistribution,
        testFramework: args.testFramework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Document common flaky test patterns encountered',
        '2. Create best practices guide covering:',
        '   - Timing and synchronization best practices',
        '   - Test isolation techniques',
        '   - Environment stability requirements',
        '   - Network/API testing patterns',
        '   - Test design principles',
        '3. Provide code examples for each pattern:',
        '   - Before (flaky) vs After (stable)',
        '   - Framework-specific implementations',
        '4. Document anti-patterns to avoid',
        '5. Create checklists for writing stable tests',
        '6. Document troubleshooting guide for flakiness',
        '7. Include lessons learned from this stabilization',
        '8. Create onboarding guide for new team members',
        '9. Document monitoring and maintenance procedures',
        '10. Format as comprehensive Markdown guide with examples'
      ],
      outputFormat: 'JSON object with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['documentPath', 'artifacts'],
      properties: {
        documentPath: { type: 'string' },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              path: { type: 'string' },
              examples: { type: 'number' }
            }
          }
        },
        codeExamples: { type: 'number' },
        checklistsCreated: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'test-automation', 'flakiness', 'documentation']
}));

// Phase 13: Final Report
export const flakinessEliminationReportTask = defineTask('flakiness-elimination-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 13: Final Report Generation`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'QA Manager and Technical Reporter',
      task: 'Generate comprehensive flakiness elimination final report',
      context: {
        originalFlakinessRate: args.originalFlakinessRate,
        newFlakinessRate: args.newFlakinessRate,
        targetFlakiness: args.targetFlakiness,
        flakyTests: args.flakyTests,
        stabilizedTests: args.stabilizedTests,
        quarantinedTests: args.quarantinedTests,
        rootCauseDistribution: args.rootCauseDistribution,
        testSuite: args.testSuite,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create executive summary with key achievements',
        '2. Present flakiness reduction metrics:',
        '   - Original vs new flakiness rate',
        '   - Improvement percentage',
        '   - Target achievement status',
        '3. Summarize root cause findings with distribution',
        '4. Detail stabilization efforts by category',
        '5. List all stabilized tests with before/after metrics',
        '6. Document quarantined tests and action plan',
        '7. Show validation results and confidence levels',
        '8. Present monitoring setup and ongoing process',
        '9. Include visualizations:',
        '   - Flakiness reduction chart',
        '   - Root cause distribution pie chart',
        '   - Before/after comparison',
        '10. Provide actionable recommendations for continuous improvement',
        '11. Document ROI and business impact',
        '12. Create maintenance and monitoring plan',
        '13. Format as professional Markdown report'
      ],
      outputFormat: 'JSON object with report details'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'recommendations', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyAchievements: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        roi: {
          type: 'object',
          properties: {
            timesSaved: { type: 'string' },
            confidenceImprovement: { type: 'string' },
            futurePreventionValue: { type: 'string' }
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
  labels: ['agent', 'test-automation', 'flakiness', 'reporting']
}));
