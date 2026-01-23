/**
 * @process specializations/qa-testing-automation/cross-browser-testing
 * @description Cross-Browser/Device Testing - Comprehensive cross-browser and cross-device testing to ensure
 * application compatibility across different browsers, operating systems, devices, and viewport sizes with
 * cloud testing platforms, parallel execution, and compatibility issue tracking.
 * @inputs { projectName: string, applicationUrl: string, browserMatrix?: array, cloudPlatform?: string, testFramework?: string, priorityCombinations?: array }
 * @outputs { success: boolean, coverageMatrix: object, compatibilityReport: object, knownIssues: array, testExecutionStats: object }
 *
 * @example
 * const result = await orchestrate('specializations/qa-testing-automation/cross-browser-testing', {
 *   projectName: 'E-Commerce Platform',
 *   applicationUrl: 'https://staging.example.com',
 *   browserMatrix: [
 *     { browser: 'Chrome', version: 'latest', os: 'Windows 10' },
 *     { browser: 'Firefox', version: 'latest', os: 'macOS' },
 *     { browser: 'Safari', version: 'latest', os: 'macOS' },
 *     { browser: 'Edge', version: 'latest', os: 'Windows 11' }
 *   ],
 *   cloudPlatform: 'BrowserStack',
 *   testFramework: 'playwright',
 *   priorityCombinations: ['Chrome-Windows', 'Safari-macOS', 'Mobile-iOS'],
 *   acceptanceCriteria: { coverage: 90, criticalBugs: 0, executionTime: 60 }
 * });
 *
 * @references
 * - BrowserStack: https://www.browserstack.com/docs
 * - Sauce Labs: https://docs.saucelabs.com/
 * - Playwright Cross-Browser: https://playwright.dev/docs/browsers
 * - Responsive Testing: https://web.dev/responsive-web-design-basics/
 * - Browser Compatibility: https://caniuse.com/
 * - Cross-Browser Testing Guide: https://developer.mozilla.org/en-US/docs/Learn/Tools_and_testing/Cross_browser_testing
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    applicationUrl,
    browserMatrix = [],
    cloudPlatform = 'BrowserStack', // 'BrowserStack', 'Sauce Labs', 'LambdaTest', 'local'
    testFramework = 'playwright',
    priorityCombinations = [],
    acceptanceCriteria = {
      coverage: 90,
      criticalBugs: 0,
      executionTime: 60,
      passRate: 95,
      responsiveBreakpoints: 5
    },
    outputDir = 'cross-browser-testing-output',
    parallelExecution = true,
    responsiveTesting = true,
    viewportSizes = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1920, height: 1080 },
      { name: 'mobile-landscape', width: 667, height: 375 },
      { name: 'large-desktop', width: 2560, height: 1440 }
    ],
    existingTestSuite = null
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let coverageMatrix = {};
  let compatibilityReport = {};

  ctx.log('info', `Starting Cross-Browser/Device Testing: ${projectName}`);
  ctx.log('info', `Application URL: ${applicationUrl}`);
  ctx.log('info', `Cloud Platform: ${cloudPlatform}`);
  ctx.log('info', `Test Framework: ${testFramework}`);

  // ============================================================================
  // PHASE 1: BROWSER/DEVICE MATRIX DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining browser and device matrix');

  const matrixDefinition = await ctx.task(matrixDefinitionTask, {
    projectName,
    applicationUrl,
    browserMatrix,
    priorityCombinations,
    responsiveTesting,
    viewportSizes,
    cloudPlatform,
    outputDir
  });

  if (!matrixDefinition.success || matrixDefinition.combinations.length === 0) {
    return {
      success: false,
      error: 'Failed to define browser/device matrix',
      details: matrixDefinition,
      metadata: {
        processId: 'specializations/qa-testing-automation/cross-browser-testing',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...matrixDefinition.artifacts);

  // Quality Gate: Matrix coverage must be comprehensive
  if (matrixDefinition.priorityCombinations.length < 3) {
    await ctx.breakpoint({
      question: `Only ${matrixDefinition.priorityCombinations.length} priority browser/device combinations defined. Minimum recommended is 3-5. Review matrix and approve?`,
      title: 'Browser Matrix Review',
      context: {
        runId: ctx.runId,
        totalCombinations: matrixDefinition.combinations.length,
        priorityCombinations: matrixDefinition.priorityCombinations,
        browserCoverage: matrixDefinition.browserCoverage,
        osCoverage: matrixDefinition.osCoverage,
        files: matrixDefinition.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 2: CLOUD TESTING PLATFORM SETUP
  // ============================================================================

  ctx.log('info', 'Phase 2: Setting up cloud testing platform integration');

  const platformSetup = await ctx.task(cloudPlatformSetupTask, {
    projectName,
    cloudPlatform,
    testFramework,
    matrixDefinition,
    parallelExecution,
    outputDir
  });

  artifacts.push(...platformSetup.artifacts);

  // Quality Gate: Platform integration must be successful
  if (!platformSetup.success || !platformSetup.connectionVerified) {
    await ctx.breakpoint({
      question: `Cloud platform setup encountered issues. Connection verified: ${platformSetup.connectionVerified}. Review setup and retry?`,
      title: 'Platform Setup Issues',
      context: {
        runId: ctx.runId,
        cloudPlatform,
        connectionVerified: platformSetup.connectionVerified,
        setupIssues: platformSetup.issues || [],
        recommendation: 'Verify API credentials and network connectivity',
        files: platformSetup.artifacts.map(a => ({ path: a.path, format: a.format || 'code' }))
      }
    });
  }

  // ============================================================================
  // PHASE 3: TEST FRAMEWORK INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Integrating cross-browser capabilities with test framework');

  const frameworkIntegration = await ctx.task(frameworkIntegrationTask, {
    projectName,
    testFramework,
    cloudPlatform,
    platformSetup,
    matrixDefinition,
    existingTestSuite,
    outputDir
  });

  artifacts.push(...frameworkIntegration.artifacts);

  // Quality Gate: Framework must support all required browsers
  const unsupportedBrowsers = frameworkIntegration.unsupportedBrowsers || [];
  if (unsupportedBrowsers.length > 0) {
    await ctx.breakpoint({
      question: `${unsupportedBrowsers.length} browser(s) not fully supported: ${unsupportedBrowsers.join(', ')}. Continue with supported browsers or adjust matrix?`,
      title: 'Browser Support Warning',
      context: {
        runId: ctx.runId,
        unsupportedBrowsers,
        supportedBrowsers: frameworkIntegration.supportedBrowsers,
        recommendation: 'Consider alternative testing approach for unsupported browsers',
        files: frameworkIntegration.artifacts.map(a => ({ path: a.path, format: a.format || 'code' }))
      }
    });
  }

  // ============================================================================
  // PHASE 4: CROSS-BROWSER TEST SUITE CREATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Creating or adapting test suite for cross-browser execution');

  const testSuiteCreation = await ctx.task(testSuiteCreationTask, {
    projectName,
    applicationUrl,
    testFramework,
    matrixDefinition,
    frameworkIntegration,
    existingTestSuite,
    outputDir
  });

  artifacts.push(...testSuiteCreation.artifacts);

  // Quality Gate: Test suite must cover critical user flows
  const criticalFlowCoverage = testSuiteCreation.criticalFlowCoverage || 0;
  if (criticalFlowCoverage < 80) {
    await ctx.breakpoint({
      question: `Critical flow coverage: ${criticalFlowCoverage}%. Target is 80%+. Add more tests or proceed with current coverage?`,
      title: 'Test Coverage Warning',
      context: {
        runId: ctx.runId,
        criticalFlowCoverage,
        testCount: testSuiteCreation.testCount,
        coveredFlows: testSuiteCreation.coveredFlows,
        missingFlows: testSuiteCreation.missingFlows,
        files: testSuiteCreation.artifacts.map(a => ({ path: a.path, format: a.format || 'code' }))
      }
    });
  }

  // ============================================================================
  // PHASE 5: RESPONSIVE DESIGN TESTING
  // ============================================================================

  if (responsiveTesting) {
    ctx.log('info', 'Phase 5: Implementing responsive design testing across viewports');

    const responsiveTests = await ctx.task(responsiveTestingTask, {
      projectName,
      applicationUrl,
      viewportSizes,
      testSuiteCreation,
      testFramework,
      outputDir
    });

    artifacts.push(...responsiveTests.artifacts);

    // Quality Gate: All critical viewports must be tested
    if (responsiveTests.viewportsCovered < viewportSizes.length) {
      await ctx.breakpoint({
        question: `Responsive testing covered ${responsiveTests.viewportsCovered}/${viewportSizes.length} viewports. Some viewports skipped. Review and approve?`,
        title: 'Responsive Coverage Review',
        context: {
          runId: ctx.runId,
          viewportsCovered: responsiveTests.viewportsCovered,
          totalViewports: viewportSizes.length,
          coveredViewports: responsiveTests.coveredViewportNames,
          skippedViewports: responsiveTests.skippedViewports,
          files: responsiveTests.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
        }
      });
    }
  }

  // ============================================================================
  // PHASE 6: BROWSER-SPECIFIC TEST CREATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Creating browser-specific compatibility tests');

  const browserSpecificTests = await ctx.task(browserSpecificTestsTask, {
    projectName,
    matrixDefinition,
    testSuiteCreation,
    testFramework,
    outputDir
  });

  artifacts.push(...browserSpecificTests.artifacts);

  // ============================================================================
  // PHASE 7: PARALLEL EXECUTION CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Configuring parallel test execution');

  const parallelConfig = await ctx.task(parallelExecutionConfigTask, {
    projectName,
    matrixDefinition,
    platformSetup,
    testSuiteCreation,
    browserSpecificTests,
    parallelExecution,
    cloudPlatform,
    outputDir
  });

  artifacts.push(...parallelConfig.artifacts);

  // Quality Gate: Parallel execution must be optimized
  const estimatedExecutionTime = parallelConfig.estimatedExecutionTime;
  if (estimatedExecutionTime > acceptanceCriteria.executionTime) {
    await ctx.breakpoint({
      question: `Estimated execution time: ${estimatedExecutionTime} minutes. Target: ${acceptanceCriteria.executionTime} minutes. Adjust parallelization or proceed?`,
      title: 'Execution Time Warning',
      context: {
        runId: ctx.runId,
        estimatedExecutionTime,
        targetExecutionTime: acceptanceCriteria.executionTime,
        parallelWorkers: parallelConfig.parallelWorkers,
        recommendation: 'Consider increasing parallel workers or optimizing test suite',
        files: parallelConfig.artifacts.map(a => ({ path: a.path, format: a.format || 'code' }))
      }
    });
  }

  // ============================================================================
  // PHASE 8: INITIAL CROSS-BROWSER TEST EXECUTION
  // ============================================================================

  ctx.log('info', 'Phase 8: Running initial cross-browser test execution');

  const initialExecution = await ctx.task(testExecutionTask, {
    projectName,
    applicationUrl,
    matrixDefinition,
    testSuiteCreation,
    parallelConfig,
    cloudPlatform,
    outputDir,
    executionType: 'initial'
  });

  artifacts.push(...initialExecution.artifacts);

  // Quality Gate: Initial execution should show reasonable pass rate
  const initialPassRate = initialExecution.overallPassRate;
  if (initialPassRate < 50) {
    await ctx.breakpoint({
      question: `Initial test execution pass rate: ${initialPassRate}%. Below 50% threshold. This may indicate widespread compatibility issues. Review results and debug?`,
      title: 'Low Pass Rate Warning',
      context: {
        runId: ctx.runId,
        overallPassRate: initialPassRate,
        totalTests: initialExecution.totalTests,
        passed: initialExecution.passed,
        failed: initialExecution.failed,
        browserResults: initialExecution.resultsByBrowser,
        topFailures: initialExecution.topFailureReasons,
        files: initialExecution.artifacts.map(a => ({ path: a.path, format: a.format || 'html' }))
      }
    });
  }

  // ============================================================================
  // PHASE 9: COMPATIBILITY ISSUE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 9: Analyzing browser-specific compatibility issues');

  const compatibilityAnalysis = await ctx.task(compatibilityAnalysisTask, {
    projectName,
    executionResults: initialExecution,
    matrixDefinition,
    testSuiteCreation,
    outputDir
  });

  artifacts.push(...compatibilityAnalysis.artifacts);

  const criticalCompatibilityIssues = compatibilityAnalysis.criticalIssues || [];

  // Quality Gate: Critical compatibility issues must be reviewed
  if (criticalCompatibilityIssues.length > 0) {
    await ctx.breakpoint({
      question: `${criticalCompatibilityIssues.length} critical browser compatibility issue(s) identified. Review issues and plan fixes?`,
      title: 'Critical Compatibility Issues',
      context: {
        runId: ctx.runId,
        criticalIssues: criticalCompatibilityIssues.map(i => ({
          browser: i.browser,
          issue: i.description,
          affectedTests: i.affectedTests,
          severity: i.severity
        })),
        totalIssues: compatibilityAnalysis.totalIssues,
        issuesByBrowser: compatibilityAnalysis.issuesByBrowser,
        files: compatibilityAnalysis.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
      }
    });
  }

  // ============================================================================
  // PHASE 10: COMPATIBILITY FIX IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Implementing fixes for compatibility issues');

  const compatibilityFixes = await ctx.task(compatibilityFixesTask, {
    projectName,
    compatibilityAnalysis,
    testSuiteCreation,
    matrixDefinition,
    testFramework,
    outputDir
  });

  artifacts.push(...compatibilityFixes.artifacts);

  // ============================================================================
  // PHASE 11: BROWSER-SPECIFIC WORKAROUNDS
  // ============================================================================

  ctx.log('info', 'Phase 11: Creating browser-specific workarounds and polyfills');

  const workaroundImplementation = await ctx.task(workaroundImplementationTask, {
    projectName,
    compatibilityAnalysis,
    compatibilityFixes,
    matrixDefinition,
    outputDir
  });

  artifacts.push(...workaroundImplementation.artifacts);

  // ============================================================================
  // PHASE 12: FINAL CROSS-BROWSER EXECUTION
  // ============================================================================

  ctx.log('info', 'Phase 12: Running final cross-browser test execution');

  const finalExecution = await ctx.task(testExecutionTask, {
    projectName,
    applicationUrl,
    matrixDefinition,
    testSuiteCreation,
    parallelConfig,
    cloudPlatform,
    outputDir,
    executionType: 'final'
  });

  artifacts.push(...finalExecution.artifacts);

  const finalPassRate = finalExecution.overallPassRate;
  const criticalBrowserFailures = finalExecution.criticalBrowserFailures || 0;

  // Quality Gate: Final pass rate must meet acceptance criteria
  if (finalPassRate < acceptanceCriteria.passRate) {
    await ctx.breakpoint({
      question: `Final pass rate: ${finalPassRate}%. Target: ${acceptanceCriteria.passRate}%. Below acceptance criteria. Review failures and decide to iterate or proceed?`,
      title: 'Pass Rate Quality Gate',
      context: {
        runId: ctx.runId,
        finalPassRate,
        targetPassRate: acceptanceCriteria.passRate,
        totalTests: finalExecution.totalTests,
        passed: finalExecution.passed,
        failed: finalExecution.failed,
        browserResults: finalExecution.resultsByBrowser,
        recommendation: 'Review browser-specific failures and consider additional fixes',
        files: finalExecution.artifacts.map(a => ({ path: a.path, format: a.format || 'html' }))
      }
    });
  }

  // Quality Gate: Critical browser failures
  if (criticalBrowserFailures > acceptanceCriteria.criticalBugs) {
    await ctx.breakpoint({
      question: `${criticalBrowserFailures} critical browser failure(s) detected on priority browsers. Target: ${acceptanceCriteria.criticalBugs}. Address critical issues or proceed with known limitations?`,
      title: 'Critical Browser Failures',
      context: {
        runId: ctx.runId,
        criticalBrowserFailures,
        targetCriticalBugs: acceptanceCriteria.criticalBugs,
        affectedBrowsers: finalExecution.criticalFailureBrowsers,
        recommendation: 'Critical issues on priority browsers should be resolved before release',
        files: finalExecution.artifacts.map(a => ({ path: a.path, format: a.format || 'html' }))
      }
    });
  }

  // ============================================================================
  // PHASE 13: COVERAGE MATRIX VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 13: Validating browser/device coverage matrix');

  const coverageValidation = await ctx.task(coverageValidationTask, {
    projectName,
    matrixDefinition,
    finalExecution,
    acceptanceCriteria,
    outputDir
  });

  coverageMatrix = coverageValidation.coverageMatrix;
  artifacts.push(...coverageValidation.artifacts);

  const actualCoverage = coverageValidation.actualCoverage;

  // Quality Gate: Coverage must meet acceptance criteria
  if (actualCoverage < acceptanceCriteria.coverage) {
    await ctx.breakpoint({
      question: `Browser/device coverage: ${actualCoverage}%. Target: ${acceptanceCriteria.coverage}%. Increase coverage or accept current level?`,
      title: 'Coverage Quality Gate',
      context: {
        runId: ctx.runId,
        actualCoverage,
        targetCoverage: acceptanceCriteria.coverage,
        coverageMatrix: coverageValidation.coverageMatrix,
        uncoveredCombinations: coverageValidation.uncoveredCombinations,
        files: coverageValidation.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 14: ISSUE TRACKING AND DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 14: Documenting known issues and workarounds');

  const issueDocumentation = await ctx.task(issueDocumentationTask, {
    projectName,
    compatibilityAnalysis,
    compatibilityFixes,
    workaroundImplementation,
    finalExecution,
    matrixDefinition,
    outputDir
  });

  artifacts.push(...issueDocumentation.artifacts);

  // ============================================================================
  // PHASE 15: CI/CD INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 15: Integrating cross-browser tests into CI/CD pipeline');

  const cicdIntegration = await ctx.task(cicdIntegrationTask, {
    projectName,
    cloudPlatform,
    matrixDefinition,
    parallelConfig,
    testSuiteCreation,
    outputDir
  });

  artifacts.push(...cicdIntegration.artifacts);

  // Quality Gate: CI/CD integration must be functional
  if (!cicdIntegration.success) {
    await ctx.breakpoint({
      question: `CI/CD integration encountered issues. Pipeline configured: ${cicdIntegration.pipelineConfigured}. Review integration and retry?`,
      title: 'CI/CD Integration Issues',
      context: {
        runId: ctx.runId,
        pipelineConfigured: cicdIntegration.pipelineConfigured,
        integrationIssues: cicdIntegration.issues || [],
        recommendation: 'Verify pipeline configuration and credentials',
        files: cicdIntegration.artifacts.map(a => ({ path: a.path, format: a.format || 'yaml' }))
      }
    });
  }

  // ============================================================================
  // PHASE 16: REPORTING AND DASHBOARD SETUP
  // ============================================================================

  ctx.log('info', 'Phase 16: Setting up cross-browser test reporting and dashboards');

  const reportingSetup = await ctx.task(reportingSetupTask, {
    projectName,
    matrixDefinition,
    finalExecution,
    coverageValidation,
    issueDocumentation,
    cloudPlatform,
    outputDir
  });

  artifacts.push(...reportingSetup.artifacts);

  // ============================================================================
  // PHASE 17: FINAL ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 17: Conducting final cross-browser testing assessment');

  const finalAssessment = await ctx.task(finalAssessmentTask, {
    projectName,
    matrixDefinition,
    testSuiteCreation,
    finalExecution,
    compatibilityAnalysis,
    compatibilityFixes,
    coverageValidation,
    issueDocumentation,
    cicdIntegration,
    reportingSetup,
    acceptanceCriteria,
    outputDir
  });

  compatibilityReport = finalAssessment.compatibilityReport;
  artifacts.push(...finalAssessment.artifacts);

  ctx.log('info', `Cross-browser testing score: ${finalAssessment.overallScore}/100`);
  ctx.log('info', `Browser coverage: ${actualCoverage}%, Pass rate: ${finalPassRate}%`);

  // Final Breakpoint: Cross-Browser Testing Approval
  await ctx.breakpoint({
    question: `Cross-Browser Testing Complete for ${projectName}. Overall Score: ${finalAssessment.overallScore}/100, Coverage: ${actualCoverage}%, Pass Rate: ${finalPassRate}%. Approve cross-browser testing for production release?`,
    title: 'Final Cross-Browser Testing Review',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        overallScore: finalAssessment.overallScore,
        browsersCovered: matrixDefinition.combinations.length,
        priorityBrowsersCovered: matrixDefinition.priorityCombinations.length,
        testCount: testSuiteCreation.testCount,
        passRate: finalPassRate,
        coverage: actualCoverage,
        criticalIssues: compatibilityAnalysis.criticalIssues.length,
        knownIssues: issueDocumentation.knownIssues.length,
        executionTime: finalExecution.totalExecutionTime,
        cicdReady: cicdIntegration.success
      },
      acceptanceCriteria,
      verdict: finalAssessment.verdict,
      recommendation: finalAssessment.recommendation,
      productionReadiness: finalAssessment.productionReady,
      files: [
        { path: reportingSetup.mainReportPath, format: 'html', label: 'Cross-Browser Test Report' },
        { path: coverageValidation.matrixReportPath, format: 'json', label: 'Coverage Matrix' },
        { path: issueDocumentation.knownIssuesPath, format: 'markdown', label: 'Known Issues' },
        { path: finalAssessment.assessmentReportPath, format: 'markdown', label: 'Final Assessment' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: finalAssessment.productionReady,
    projectName,
    applicationUrl,
    cloudPlatform,
    testFramework,
    overallScore: finalAssessment.overallScore,
    coverageMatrix: {
      totalCombinations: matrixDefinition.combinations.length,
      priorityCombinations: matrixDefinition.priorityCombinations.length,
      actualCoverage,
      targetCoverage: acceptanceCriteria.coverage,
      browsersCovered: coverageValidation.browsersCovered,
      devicesCovered: coverageValidation.devicesCovered,
      osCovered: coverageValidation.osCovered,
      viewportsCovered: responsiveTesting ? coverageValidation.viewportsCovered : 'N/A'
    },
    compatibilityReport: {
      totalIssues: compatibilityAnalysis.totalIssues,
      criticalIssues: compatibilityAnalysis.criticalIssues.length,
      highPriorityIssues: compatibilityAnalysis.highPriorityIssues.length,
      mediumPriorityIssues: compatibilityAnalysis.mediumPriorityIssues.length,
      lowPriorityIssues: compatibilityAnalysis.lowPriorityIssues.length,
      issuesByBrowser: compatibilityAnalysis.issuesByBrowser,
      fixedIssues: compatibilityFixes.fixedIssuesCount,
      workaroundsImplemented: workaroundImplementation.workaroundsCount
    },
    knownIssues: issueDocumentation.knownIssues.map(issue => ({
      browser: issue.browser,
      description: issue.description,
      severity: issue.severity,
      workaround: issue.workaround,
      status: issue.status
    })),
    testExecutionStats: {
      totalTests: testSuiteCreation.testCount,
      totalExecutions: finalExecution.totalExecutions,
      overallPassRate: finalPassRate,
      browserSpecificPassRates: finalExecution.browserPassRates,
      totalExecutionTime: finalExecution.totalExecutionTime,
      averageExecutionTime: finalExecution.averageExecutionTime,
      parallelWorkers: parallelConfig.parallelWorkers,
      estimatedSpeedup: parallelConfig.estimatedSpeedup
    },
    qualityGates: {
      coverageMet: actualCoverage >= acceptanceCriteria.coverage,
      passRateMet: finalPassRate >= acceptanceCriteria.passRate,
      criticalBugsMet: criticalBrowserFailures <= acceptanceCriteria.criticalBugs,
      executionTimeMet: finalExecution.totalExecutionTime <= acceptanceCriteria.executionTime
    },
    cicdIntegration: {
      success: cicdIntegration.success,
      platform: cicdIntegration.platform,
      pipelineConfigPath: cicdIntegration.pipelineConfigPath,
      parallelExecutionEnabled: parallelExecution
    },
    reporting: {
      mainReportPath: reportingSetup.mainReportPath,
      coverageMatrixPath: coverageValidation.matrixReportPath,
      knownIssuesPath: issueDocumentation.knownIssuesPath,
      dashboardUrl: reportingSetup.dashboardUrl
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/qa-testing-automation/cross-browser-testing',
      timestamp: startTime,
      cloudPlatform,
      testFramework,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: Browser/Device Matrix Definition
export const matrixDefinitionTask = defineTask('matrix-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Browser/Device Matrix Definition - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Cross-Browser Testing Strategist and QA Architect',
      task: 'Define comprehensive browser, device, and OS combination matrix for testing',
      context: {
        projectName: args.projectName,
        applicationUrl: args.applicationUrl,
        browserMatrix: args.browserMatrix,
        priorityCombinations: args.priorityCombinations,
        responsiveTesting: args.responsiveTesting,
        viewportSizes: args.viewportSizes,
        cloudPlatform: args.cloudPlatform,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze provided browser matrix or create comprehensive default matrix',
        '2. Include major browsers: Chrome, Firefox, Safari, Edge, Opera',
        '3. Cover multiple browser versions (latest, latest-1, latest-2)',
        '4. Define OS combinations: Windows 10/11, macOS, Linux',
        '5. Add mobile browsers: Chrome Mobile, Safari Mobile, Samsung Internet',
        '6. Define mobile devices: iPhone, iPad, Android phones/tablets',
        '7. Prioritize combinations based on analytics or user base',
        '8. Identify 3-5 priority combinations (most critical for business)',
        '9. Include viewport sizes for responsive testing if enabled',
        '10. Generate test coverage matrix document',
        '11. Calculate total test execution estimates',
        '12. Document matrix rationale and business justification'
      ],
      outputFormat: 'JSON object with browser/device matrix, priorities, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'combinations', 'priorityCombinations', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        combinations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              browser: { type: 'string' },
              version: { type: 'string' },
              os: { type: 'string' },
              device: { type: 'string' },
              viewport: { type: 'object' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
            }
          },
          minItems: 5
        },
        priorityCombinations: {
          type: 'array',
          items: { type: 'string' },
          minItems: 3,
          description: 'IDs of priority browser/device combinations'
        },
        browserCoverage: {
          type: 'object',
          properties: {
            chrome: { type: 'number' },
            firefox: { type: 'number' },
            safari: { type: 'number' },
            edge: { type: 'number' },
            other: { type: 'number' }
          }
        },
        osCoverage: {
          type: 'array',
          items: { type: 'string' }
        },
        deviceCoverage: {
          type: 'object',
          properties: {
            desktop: { type: 'number' },
            mobile: { type: 'number' },
            tablet: { type: 'number' }
          }
        },
        estimatedTestExecutions: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cross-browser', 'matrix-definition', 'test-planning']
}));

// Phase 2: Cloud Testing Platform Setup
export const cloudPlatformSetupTask = defineTask('cloud-platform-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Cloud Testing Platform Setup - ${args.cloudPlatform}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Cloud Testing Infrastructure Engineer',
      task: 'Configure cloud testing platform for cross-browser test execution',
      context: {
        projectName: args.projectName,
        cloudPlatform: args.cloudPlatform,
        testFramework: args.testFramework,
        matrixDefinition: args.matrixDefinition,
        parallelExecution: args.parallelExecution,
        outputDir: args.outputDir
      },
      instructions: [
        `1. Set up ${args.cloudPlatform} account and API credentials`,
        '2. Install platform-specific SDK/libraries',
        '3. Configure authentication (API keys, tokens)',
        '4. Set up browser capabilities for each matrix combination',
        '5. Configure test execution settings (timeouts, retries)',
        '6. Set up video recording and screenshot capture',
        '7. Configure network throttling if needed',
        '8. Set up parallel execution limits based on plan',
        '9. Configure test result reporting integration',
        '10. Verify platform connectivity with test connection',
        '11. Create configuration files for platform',
        '12. Document platform setup and credentials management'
      ],
      outputFormat: 'JSON object with platform setup status, config, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'connectionVerified', 'configuration', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        connectionVerified: { type: 'boolean' },
        configuration: {
          type: 'object',
          properties: {
            platform: { type: 'string' },
            apiEndpoint: { type: 'string' },
            maxParallelSessions: { type: 'number' },
            videoRecording: { type: 'boolean' },
            screenshotsEnabled: { type: 'boolean' },
            networkThrottling: { type: 'boolean' }
          }
        },
        capabilities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              combinationId: { type: 'string' },
              capability: { type: 'object' }
            }
          }
        },
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
  labels: ['agent', 'cross-browser', 'cloud-platform', 'infrastructure']
}));

// Phase 3: Test Framework Integration
export const frameworkIntegrationTask = defineTask('framework-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Test Framework Integration - ${args.testFramework}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Test Automation Framework Engineer',
      task: 'Integrate cross-browser capabilities with existing test framework',
      context: {
        projectName: args.projectName,
        testFramework: args.testFramework,
        cloudPlatform: args.cloudPlatform,
        platformSetup: args.platformSetup,
        matrixDefinition: args.matrixDefinition,
        existingTestSuite: args.existingTestSuite,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Install framework-specific cross-browser plugins',
        '2. Configure framework to use cloud platform',
        '3. Create browser launcher utilities for each matrix combination',
        '4. Implement browser-specific setup and teardown',
        '5. Configure parallel execution with framework',
        '6. Add browser info to test context',
        '7. Create helper utilities for browser-specific operations',
        '8. Implement cross-browser screenshot utilities',
        '9. Configure test retries for cross-browser tests',
        '10. Verify all browsers in matrix are supported',
        '11. Create sample cross-browser test',
        '12. Document framework integration patterns'
      ],
      outputFormat: 'JSON object with integration status, utilities, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['integrationComplete', 'supportedBrowsers', 'artifacts'],
      properties: {
        integrationComplete: { type: 'boolean' },
        supportedBrowsers: {
          type: 'array',
          items: { type: 'string' }
        },
        unsupportedBrowsers: {
          type: 'array',
          items: { type: 'string' }
        },
        utilities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              purpose: { type: 'string' },
              filePath: { type: 'string' }
            }
          }
        },
        sampleTestPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cross-browser', 'framework-integration', 'test-automation']
}));

// Phase 4: Cross-Browser Test Suite Creation
export const testSuiteCreationTask = defineTask('test-suite-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Cross-Browser Test Suite - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior Test Automation Engineer',
      task: 'Create or adapt test suite for cross-browser execution',
      context: {
        projectName: args.projectName,
        applicationUrl: args.applicationUrl,
        testFramework: args.testFramework,
        matrixDefinition: args.matrixDefinition,
        frameworkIntegration: args.frameworkIntegration,
        existingTestSuite: args.existingTestSuite,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify critical user flows for cross-browser testing',
        '2. Create or adapt E2E tests for browser compatibility',
        '3. Implement core functionality tests (login, navigation, forms)',
        '4. Add UI interaction tests (clicks, inputs, dropdowns)',
        '5. Create CSS/layout validation tests',
        '6. Add JavaScript functionality tests',
        '7. Implement AJAX/fetch request tests',
        '8. Create file upload/download tests',
        '9. Add local storage/cookie tests',
        '10. Ensure tests are browser-agnostic (no hardcoded assumptions)',
        '11. Add proper waits and synchronization',
        '12. Tag tests by criticality and browser requirements'
      ],
      outputFormat: 'JSON object with test suite details, coverage, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'testCount', 'coveredFlows', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        testCount: { type: 'number' },
        testFiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              filePath: { type: 'string' },
              testName: { type: 'string' },
              userFlow: { type: 'string' },
              criticality: { type: 'string' }
            }
          }
        },
        coveredFlows: {
          type: 'array',
          items: { type: 'string' }
        },
        missingFlows: {
          type: 'array',
          items: { type: 'string' }
        },
        criticalFlowCoverage: { type: 'number', description: 'Percentage of critical flows covered' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cross-browser', 'test-suite', 'e2e-testing']
}));

// Phase 5: Responsive Design Testing
export const responsiveTestingTask = defineTask('responsive-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Responsive Design Testing - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Responsive Design Testing Specialist',
      task: 'Implement responsive design testing across multiple viewport sizes',
      context: {
        projectName: args.projectName,
        applicationUrl: args.applicationUrl,
        viewportSizes: args.viewportSizes,
        testSuiteCreation: args.testSuiteCreation,
        testFramework: args.testFramework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create viewport configuration for each breakpoint',
        '2. Implement responsive layout tests',
        '3. Test mobile navigation (hamburger menu, mobile-specific nav)',
        '4. Validate touch interactions on mobile viewports',
        '5. Test responsive images and media queries',
        '6. Verify scrolling behavior across viewports',
        '7. Test form layouts and usability on small screens',
        '8. Validate text readability and font sizing',
        '9. Check button sizes for touch targets (minimum 44x44px)',
        '10. Test orientation changes (portrait/landscape)',
        '11. Capture viewport-specific screenshots',
        '12. Document responsive issues and breakpoint behavior'
      ],
      outputFormat: 'JSON object with responsive test results and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['viewportsCovered', 'coveredViewportNames', 'artifacts'],
      properties: {
        viewportsCovered: { type: 'number' },
        coveredViewportNames: {
          type: 'array',
          items: { type: 'string' }
        },
        skippedViewports: {
          type: 'array',
          items: { type: 'string' }
        },
        responsiveTests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testName: { type: 'string' },
              viewport: { type: 'string' },
              passed: { type: 'boolean' },
              issues: { type: 'array' }
            }
          }
        },
        breakpointValidation: {
          type: 'object',
          description: 'Validation results for each breakpoint'
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cross-browser', 'responsive-testing', 'viewport-testing']
}));

// Phase 6: Browser-Specific Test Creation
export const browserSpecificTestsTask = defineTask('browser-specific-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Browser-Specific Compatibility Tests - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Browser Compatibility Testing Expert',
      task: 'Create browser-specific compatibility tests',
      context: {
        projectName: args.projectName,
        matrixDefinition: args.matrixDefinition,
        testSuiteCreation: args.testSuiteCreation,
        testFramework: args.testFramework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create CSS feature support tests (flexbox, grid, custom properties)',
        '2. Test JavaScript API compatibility (Fetch, Promises, async/await)',
        '3. Validate HTML5 features (localStorage, sessionStorage, Web Workers)',
        '4. Test browser-specific rendering (vendor prefixes)',
        '5. Validate form validation and input types',
        '6. Test WebSocket and Server-Sent Events support',
        '7. Validate Service Worker and PWA features',
        '8. Test WebGL and Canvas rendering',
        '9. Validate audio/video codec support',
        '10. Test clipboard API and file API',
        '11. Validate browser performance (page load, JavaScript execution)',
        '12. Document browser-specific quirks and workarounds'
      ],
      outputFormat: 'JSON object with browser-specific tests and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['testCount', 'featureTests', 'artifacts'],
      properties: {
        testCount: { type: 'number' },
        featureTests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              feature: { type: 'string' },
              testName: { type: 'string' },
              browsers: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        compatibilityChecks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              check: { type: 'string' },
              supportedBrowsers: { type: 'array' },
              unsupportedBrowsers: { type: 'array' }
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
  labels: ['agent', 'cross-browser', 'browser-specific', 'compatibility-testing']
}));

// Phase 7: Parallel Execution Configuration
export const parallelExecutionConfigTask = defineTask('parallel-execution-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Parallel Execution Configuration - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Test Execution Performance Engineer',
      task: 'Configure parallel execution for cross-browser tests',
      context: {
        projectName: args.projectName,
        matrixDefinition: args.matrixDefinition,
        platformSetup: args.platformSetup,
        testSuiteCreation: args.testSuiteCreation,
        browserSpecificTests: args.browserSpecificTests,
        parallelExecution: args.parallelExecution,
        cloudPlatform: args.cloudPlatform,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Determine optimal number of parallel workers based on cloud plan',
        '2. Configure test sharding by browser/device combination',
        '3. Implement intelligent test distribution',
        '4. Configure browser instance isolation',
        '5. Set up parallel execution timeout settings',
        '6. Configure resource limits and throttling',
        '7. Implement result aggregation from parallel runs',
        '8. Set up parallel execution monitoring',
        '9. Calculate estimated execution time with parallelization',
        '10. Optimize test order for fastest feedback',
        '11. Configure retry logic for flaky tests',
        '12. Document parallel execution configuration'
      ],
      outputFormat: 'JSON object with parallel config and execution estimates'
    },
    outputSchema: {
      type: 'object',
      required: ['parallelWorkers', 'estimatedExecutionTime', 'artifacts'],
      properties: {
        parallelWorkers: { type: 'number' },
        shardingStrategy: { type: 'string' },
        estimatedExecutionTime: { type: 'number', description: 'Estimated time in minutes' },
        estimatedSpeedup: { type: 'number', description: 'Speedup multiplier vs sequential' },
        workerConfiguration: {
          type: 'object',
          properties: {
            maxWorkers: { type: 'number' },
            timeout: { type: 'number' },
            retries: { type: 'number' }
          }
        },
        testDistribution: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              worker: { type: 'number' },
              browsers: { type: 'array' },
              testCount: { type: 'number' }
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
  labels: ['agent', 'cross-browser', 'parallel-execution', 'performance']
}));

// Phase 8 & 12: Test Execution (reusable for initial and final)
export const testExecutionTask = defineTask('test-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Test Execution (${args.executionType}) - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Cross-Browser Test Execution Engineer',
      task: `Execute cross-browser test suite (${args.executionType} run)`,
      context: {
        projectName: args.projectName,
        applicationUrl: args.applicationUrl,
        matrixDefinition: args.matrixDefinition,
        testSuiteCreation: args.testSuiteCreation,
        parallelConfig: args.parallelConfig,
        cloudPlatform: args.cloudPlatform,
        executionType: args.executionType,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Execute test suite across all browser/device combinations',
        '2. Run tests in parallel using configured workers',
        '3. Capture test results for each browser/device',
        '4. Record screenshots on test failures',
        '5. Capture video recordings if enabled',
        '6. Log browser console errors and warnings',
        '7. Capture network logs and performance metrics',
        '8. Aggregate results from parallel executions',
        '9. Calculate pass rate by browser, OS, device',
        '10. Identify browser-specific failures',
        '11. Detect critical browser failures',
        '12. Generate HTML execution report with browser breakdown'
      ],
      outputFormat: 'JSON object with execution results by browser'
    },
    outputSchema: {
      type: 'object',
      required: ['totalTests', 'totalExecutions', 'passed', 'failed', 'overallPassRate', 'artifacts'],
      properties: {
        totalTests: { type: 'number' },
        totalExecutions: { type: 'number', description: 'Tests * Browser combinations' },
        passed: { type: 'number' },
        failed: { type: 'number' },
        skipped: { type: 'number' },
        overallPassRate: { type: 'number', description: 'Overall pass rate percentage' },
        totalExecutionTime: { type: 'number', description: 'Total time in minutes' },
        averageExecutionTime: { type: 'number', description: 'Average time per combination' },
        resultsByBrowser: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              browser: { type: 'string' },
              version: { type: 'string' },
              os: { type: 'string' },
              passed: { type: 'number' },
              failed: { type: 'number' },
              passRate: { type: 'number' }
            }
          }
        },
        browserPassRates: {
          type: 'object',
          description: 'Pass rates by browser type'
        },
        criticalBrowserFailures: { type: 'number' },
        criticalFailureBrowsers: {
          type: 'array',
          items: { type: 'string' }
        },
        topFailureReasons: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              reason: { type: 'string' },
              count: { type: 'number' },
              browsers: { type: 'array' }
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
  labels: ['agent', 'cross-browser', 'test-execution', args.executionType]
}));

// Phase 9: Compatibility Issue Analysis
export const compatibilityAnalysisTask = defineTask('compatibility-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Compatibility Issue Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Browser Compatibility Analysis Expert',
      task: 'Analyze browser-specific compatibility issues from test results',
      context: {
        projectName: args.projectName,
        executionResults: args.executionResults,
        matrixDefinition: args.matrixDefinition,
        testSuiteCreation: args.testSuiteCreation,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze test failures by browser/device',
        '2. Identify browser-specific failure patterns',
        '3. Categorize issues (CSS, JavaScript, HTML, performance)',
        '4. Determine root causes (missing features, polyfills, vendor prefixes)',
        '5. Prioritize issues by severity and browser importance',
        '6. Identify critical issues blocking key functionality',
        '7. Group similar issues across browsers',
        '8. Analyze console errors and warnings',
        '9. Review network logs for API compatibility',
        '10. Check for timing and race condition issues',
        '11. Document browser-specific workarounds needed',
        '12. Generate compatibility analysis report'
      ],
      outputFormat: 'JSON object with categorized compatibility issues'
    },
    outputSchema: {
      type: 'object',
      required: ['totalIssues', 'criticalIssues', 'issuesByBrowser', 'artifacts'],
      properties: {
        totalIssues: { type: 'number' },
        criticalIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              browser: { type: 'string' },
              description: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              category: { type: 'string' },
              affectedTests: { type: 'array' },
              rootCause: { type: 'string' }
            }
          }
        },
        highPriorityIssues: { type: 'array' },
        mediumPriorityIssues: { type: 'array' },
        lowPriorityIssues: { type: 'array' },
        issuesByBrowser: {
          type: 'object',
          additionalProperties: {
            type: 'array',
            items: { type: 'object' }
          }
        },
        issuesByCategory: {
          type: 'object',
          properties: {
            css: { type: 'number' },
            javascript: { type: 'number' },
            html: { type: 'number' },
            performance: { type: 'number' },
            layout: { type: 'number' },
            other: { type: 'number' }
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
  labels: ['agent', 'cross-browser', 'compatibility-analysis', 'issue-detection']
}));

// Phase 10: Compatibility Fix Implementation
export const compatibilityFixesTask = defineTask('compatibility-fixes', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Compatibility Fix Implementation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Cross-Browser Compatibility Engineer',
      task: 'Implement fixes for identified browser compatibility issues',
      context: {
        projectName: args.projectName,
        compatibilityAnalysis: args.compatibilityAnalysis,
        testSuiteCreation: args.testSuiteCreation,
        matrixDefinition: args.matrixDefinition,
        testFramework: args.testFramework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Prioritize fixes based on severity and browser importance',
        '2. Fix CSS compatibility issues (vendor prefixes, fallbacks)',
        '3. Add polyfills for missing JavaScript features',
        '4. Implement browser detection for conditional code',
        '5. Fix layout and rendering issues',
        '6. Update selectors for browser-specific elements',
        '7. Add explicit waits for browser-specific timing',
        '8. Implement feature detection instead of browser sniffing',
        '9. Update test code to handle browser differences',
        '10. Verify fixes with targeted test runs',
        '11. Document each fix and rationale',
        '12. Track remaining unfixed issues'
      ],
      outputFormat: 'JSON object with fix implementation results'
    },
    outputSchema: {
      type: 'object',
      required: ['fixedIssuesCount', 'fixedIssues', 'artifacts'],
      properties: {
        fixedIssuesCount: { type: 'number' },
        fixedIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issueId: { type: 'string' },
              browser: { type: 'string' },
              fixDescription: { type: 'string' },
              approach: { type: 'string' },
              verified: { type: 'boolean' }
            }
          }
        },
        unfixedIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issueId: { type: 'string' },
              reason: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        polyfillsAdded: {
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
  labels: ['agent', 'cross-browser', 'compatibility-fixes', 'implementation']
}));

// Phase 11: Browser-Specific Workarounds
export const workaroundImplementationTask = defineTask('workaround-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Browser-Specific Workarounds - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Browser Workaround Specialist',
      task: 'Implement browser-specific workarounds and conditional logic',
      context: {
        projectName: args.projectName,
        compatibilityAnalysis: args.compatibilityAnalysis,
        compatibilityFixes: args.compatibilityFixes,
        matrixDefinition: args.matrixDefinition,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Review unfixed compatibility issues requiring workarounds',
        '2. Implement browser-specific test code paths',
        '3. Add conditional logic based on browser capabilities',
        '4. Create browser-specific helper utilities',
        '5. Implement graceful degradation strategies',
        '6. Add progressive enhancement for modern browsers',
        '7. Create fallback mechanisms for unsupported features',
        '8. Implement browser-specific wait strategies',
        '9. Add browser-specific assertions where needed',
        '10. Document all workarounds and their reasons',
        '11. Mark workarounds for future removal',
        '12. Verify workarounds with targeted tests'
      ],
      outputFormat: 'JSON object with workaround implementations'
    },
    outputSchema: {
      type: 'object',
      required: ['workaroundsCount', 'workarounds', 'artifacts'],
      properties: {
        workaroundsCount: { type: 'number' },
        workarounds: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              browser: { type: 'string' },
              issue: { type: 'string' },
              workaround: { type: 'string' },
              temporary: { type: 'boolean' },
              removalCriteria: { type: 'string' }
            }
          }
        },
        browserSpecificUtilities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              purpose: { type: 'string' },
              browsers: { type: 'array' }
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
  labels: ['agent', 'cross-browser', 'workarounds', 'browser-specific']
}));

// Phase 13: Coverage Matrix Validation
export const coverageValidationTask = defineTask('coverage-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 13: Coverage Matrix Validation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Test Coverage Analyst',
      task: 'Validate browser/device coverage matrix against execution results',
      context: {
        projectName: args.projectName,
        matrixDefinition: args.matrixDefinition,
        finalExecution: args.finalExecution,
        acceptanceCriteria: args.acceptanceCriteria,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Calculate actual coverage percentage vs planned matrix',
        '2. Verify all priority combinations were tested',
        '3. Check browser version coverage (latest, latest-1, latest-2)',
        '4. Validate OS coverage (Windows, macOS, Linux)',
        '5. Verify device type coverage (desktop, mobile, tablet)',
        '6. Check viewport/responsive coverage',
        '7. Identify any skipped or untested combinations',
        '8. Calculate coverage by browser family',
        '9. Assess coverage of critical vs non-critical combinations',
        '10. Generate coverage heatmap visualization',
        '11. Document coverage gaps and justification',
        '12. Create comprehensive coverage matrix report'
      ],
      outputFormat: 'JSON object with coverage validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['actualCoverage', 'coverageMatrix', 'artifacts'],
      properties: {
        actualCoverage: { type: 'number', description: 'Percentage of planned coverage achieved' },
        coverageMatrix: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              tested: { type: 'boolean' },
              passRate: { type: 'number' },
              testCount: { type: 'number' }
            }
          }
        },
        browsersCovered: {
          type: 'object',
          properties: {
            chrome: { type: 'boolean' },
            firefox: { type: 'boolean' },
            safari: { type: 'boolean' },
            edge: { type: 'boolean' }
          }
        },
        devicesCovered: {
          type: 'object',
          properties: {
            desktop: { type: 'boolean' },
            mobile: { type: 'boolean' },
            tablet: { type: 'boolean' }
          }
        },
        osCovered: {
          type: 'array',
          items: { type: 'string' }
        },
        viewportsCovered: { type: 'number' },
        uncoveredCombinations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              combination: { type: 'string' },
              reason: { type: 'string' }
            }
          }
        },
        matrixReportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cross-browser', 'coverage-validation', 'metrics']
}));

// Phase 14: Issue Tracking and Documentation
export const issueDocumentationTask = defineTask('issue-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 14: Issue Tracking and Documentation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Documentation Specialist',
      task: 'Document known compatibility issues and workarounds',
      context: {
        projectName: args.projectName,
        compatibilityAnalysis: args.compatibilityAnalysis,
        compatibilityFixes: args.compatibilityFixes,
        workaroundImplementation: args.workaroundImplementation,
        finalExecution: args.finalExecution,
        matrixDefinition: args.matrixDefinition,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Compile all known compatibility issues',
        '2. Document issue details (browser, version, OS, description)',
        '3. Link issues to affected test cases',
        '4. Document implemented fixes and their locations',
        '5. Document workarounds with usage instructions',
        '6. Add reproduction steps for each issue',
        '7. Include screenshots/videos of issues when available',
        '8. Document browser-specific limitations',
        '9. Create known issues matrix by browser',
        '10. Add recommendations for users/developers',
        '11. Document when issues are expected to be resolved',
        '12. Generate comprehensive known issues document'
      ],
      outputFormat: 'JSON object with documented issues and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['knownIssues', 'knownIssuesPath', 'artifacts'],
      properties: {
        knownIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              browser: { type: 'string' },
              version: { type: 'string' },
              os: { type: 'string' },
              description: { type: 'string' },
              severity: { type: 'string' },
              workaround: { type: 'string' },
              status: { type: 'string', enum: ['open', 'fixed', 'wont-fix', 'workaround'] },
              affectedTests: { type: 'array' },
              reportedDate: { type: 'string' }
            }
          }
        },
        issuesByBrowser: {
          type: 'object',
          description: 'Issues grouped by browser'
        },
        issuesBySeverity: {
          type: 'object',
          properties: {
            critical: { type: 'number' },
            high: { type: 'number' },
            medium: { type: 'number' },
            low: { type: 'number' }
          }
        },
        knownIssuesPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cross-browser', 'documentation', 'issue-tracking']
}));

// Phase 15: CI/CD Integration
export const cicdIntegrationTask = defineTask('cicd-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 15: CI/CD Integration - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DevOps CI/CD Engineer',
      task: 'Integrate cross-browser tests into CI/CD pipeline',
      context: {
        projectName: args.projectName,
        cloudPlatform: args.cloudPlatform,
        matrixDefinition: args.matrixDefinition,
        parallelConfig: args.parallelConfig,
        testSuiteCreation: args.testSuiteCreation,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create CI/CD pipeline configuration for cross-browser tests',
        '2. Configure cloud platform credentials as secrets',
        '3. Set up test execution stages (priority browsers first)',
        '4. Configure parallel matrix builds',
        '5. Add browser-specific test execution commands',
        '6. Configure artifact upload (reports, screenshots, videos)',
        '7. Set up browser-specific quality gates',
        '8. Add notification for browser-specific failures',
        '9. Configure scheduled runs for extended browser matrix',
        '10. Add PR checks for priority browsers',
        '11. Optimize pipeline for fast feedback',
        '12. Document pipeline configuration and maintenance'
      ],
      outputFormat: 'JSON object with CI/CD integration status'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'pipelineConfigured', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        pipelineConfigured: { type: 'boolean' },
        platform: { type: 'string' },
        pipelineConfigPath: { type: 'string' },
        stages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              browsers: { type: 'array' },
              parallel: { type: 'boolean' }
            }
          }
        },
        qualityGates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gate: { type: 'string' },
              threshold: { type: 'string' }
            }
          }
        },
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
  labels: ['agent', 'cross-browser', 'cicd', 'devops']
}));

// Phase 16: Reporting and Dashboard Setup
export const reportingSetupTask = defineTask('reporting-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 16: Reporting and Dashboard - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Test Reporting Engineer',
      task: 'Set up comprehensive cross-browser test reporting and dashboards',
      context: {
        projectName: args.projectName,
        matrixDefinition: args.matrixDefinition,
        finalExecution: args.finalExecution,
        coverageValidation: args.coverageValidation,
        issueDocumentation: args.issueDocumentation,
        cloudPlatform: args.cloudPlatform,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Generate HTML test report with browser breakdown',
        '2. Create coverage matrix visualization',
        '3. Generate browser comparison charts',
        '4. Create pass rate trends by browser',
        '5. Build compatibility issues dashboard',
        '6. Add screenshots and videos to report',
        '7. Generate executive summary report',
        '8. Create detailed technical report',
        '9. Set up real-time test results dashboard',
        '10. Configure report hosting and access',
        '11. Add filters for browser, OS, device',
        '12. Document report interpretation guide'
      ],
      outputFormat: 'JSON object with reporting setup details'
    },
    outputSchema: {
      type: 'object',
      required: ['mainReportPath', 'dashboardUrl', 'artifacts'],
      properties: {
        mainReportPath: { type: 'string' },
        dashboardUrl: { type: 'string' },
        reportTypes: {
          type: 'array',
          items: { type: 'string' }
        },
        visualizations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              path: { type: 'string' },
              type: { type: 'string' }
            }
          }
        },
        executiveSummaryPath: { type: 'string' },
        technicalReportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cross-browser', 'reporting', 'dashboard']
}));

// Phase 17: Final Assessment
export const finalAssessmentTask = defineTask('final-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 17: Final Assessment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'QA Lead and Cross-Browser Testing Expert',
      task: 'Conduct final assessment of cross-browser testing implementation',
      context: {
        projectName: args.projectName,
        matrixDefinition: args.matrixDefinition,
        testSuiteCreation: args.testSuiteCreation,
        finalExecution: args.finalExecution,
        compatibilityAnalysis: args.compatibilityAnalysis,
        compatibilityFixes: args.compatibilityFixes,
        coverageValidation: args.coverageValidation,
        issueDocumentation: args.issueDocumentation,
        cicdIntegration: args.cicdIntegration,
        reportingSetup: args.reportingSetup,
        acceptanceCriteria: args.acceptanceCriteria,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Calculate overall cross-browser testing score (0-100)',
        '2. Assess browser/device coverage completeness',
        '3. Evaluate test execution performance',
        '4. Review compatibility issue resolution rate',
        '5. Assess critical browser support quality',
        '6. Evaluate CI/CD integration completeness',
        '7. Review reporting and documentation quality',
        '8. Compare results against acceptance criteria',
        '9. Determine production readiness',
        '10. Identify remaining risks and limitations',
        '11. Provide recommendations for improvement',
        '12. Generate final assessment report'
      ],
      outputFormat: 'JSON object with final assessment and verdict'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'productionReady', 'compatibilityReport', 'verdict', 'recommendation', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        productionReady: { type: 'boolean' },
        criteriaScores: {
          type: 'object',
          properties: {
            coverage: { type: 'number' },
            passRate: { type: 'number' },
            criticalBrowsers: { type: 'number' },
            compatibilityFixes: { type: 'number' },
            executionPerformance: { type: 'number' },
            cicdIntegration: { type: 'number' },
            documentation: { type: 'number' },
            reporting: { type: 'number' }
          }
        },
        compatibilityReport: {
          type: 'object',
          properties: {
            totalIssuesFound: { type: 'number' },
            issuesFixed: { type: 'number' },
            issuesWithWorkarounds: { type: 'number' },
            openIssues: { type: 'number' },
            criticalOpenIssues: { type: 'number' }
          }
        },
        verdict: { type: 'string' },
        recommendation: { type: 'string' },
        strengths: { type: 'array', items: { type: 'string' } },
        weaknesses: { type: 'array', items: { type: 'string' } },
        risks: { type: 'array', items: { type: 'string' } },
        nextSteps: { type: 'array', items: { type: 'string' } },
        assessmentReportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cross-browser', 'assessment', 'final-review']
}));
