/**
 * @process specializations/qa-testing-automation/mobile-testing
 * @description Mobile App Testing Automation - Comprehensive mobile testing automation for iOS and Android using Appium,
 * including native gestures, device features, cross-platform validation, real device testing, and CI/CD integration
 * with quality gates and iterative refinement loops.
 * @inputs { appName: string, platforms: array, appFiles: object, testScenarios?: array, deviceMatrix?: object, cloudProvider?: string }
 * @outputs { success: boolean, testSuiteStats: object, deviceCoverage: object, testExecutionReport: object, stabilityScore: number }
 *
 * @example
 * const result = await orchestrate('specializations/qa-testing-automation/mobile-testing', {
 *   appName: 'E-Commerce Mobile App',
 *   platforms: ['iOS', 'Android'],
 *   appFiles: {
 *     ios: { path: './build/App.ipa', bundleId: 'com.example.app' },
 *     android: { path: './build/app-release.apk', package: 'com.example.app' }
 *   },
 *   testScenarios: ['Login', 'Product Search', 'Cart Management', 'Checkout', 'Profile'],
 *   deviceMatrix: {
 *     ios: [
 *       { deviceName: 'iPhone 14 Pro', platformVersion: '16.0' },
 *       { deviceName: 'iPhone 12', platformVersion: '15.0' }
 *     ],
 *     android: [
 *       { deviceName: 'Pixel 6', platformVersion: '13.0' },
 *       { deviceName: 'Samsung Galaxy S22', platformVersion: '12.0' }
 *     ]
 *   },
 *   cloudProvider: 'BrowserStack',
 *   acceptanceCriteria: { testCoverage: 85, passRate: 90, platformParity: 95 }
 * });
 *
 * @references
 * - Appium Documentation: https://appium.io/docs/en/latest/
 * - Mobile Testing Best Practices: https://www.browserstack.com/guide/mobile-testing-best-practices
 * - Appium Page Object: https://webdriver.io/docs/pageobjects/
 * - Cloud Device Labs: https://www.browserstack.com/, https://saucelabs.com/
 * - Mobile Gestures: https://appium.io/docs/en/commands/interactions/touch/
 * - Real Device Testing: https://appium.io/docs/en/writing-running-appium/running-tests/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    appName,
    platforms = ['iOS', 'Android'],
    appFiles,
    testScenarios = [],
    deviceMatrix = {},
    cloudProvider = null, // 'BrowserStack', 'Sauce Labs', 'AWS Device Farm', null for local
    realDeviceTesting = false,
    acceptanceCriteria = {
      testCoverage: 85,
      passRate: 90,
      platformParity: 95,
      maxExecutionTime: 45,
      flakiness: 5
    },
    outputDir = 'mobile-testing-output',
    cicdPlatform = 'GitHub Actions',
    parallelExecution = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let testSuiteStats = {};
  let stabilityScore = 0;

  ctx.log('info', `Starting Mobile App Testing Automation for ${appName}`);
  ctx.log('info', `Platforms: ${platforms.join(', ')}`);
  ctx.log('info', `Cloud Provider: ${cloudProvider || 'Local Emulators/Simulators'}`);

  // ============================================================================
  // PHASE 1: ENVIRONMENT SETUP AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Setting up Appium environment and validating configuration');

  const environmentSetup = await ctx.task(environmentSetupTask, {
    appName,
    platforms,
    appFiles,
    cloudProvider,
    deviceMatrix,
    outputDir
  });

  if (!environmentSetup.success) {
    return {
      success: false,
      error: 'Environment setup failed - Appium configuration or app files invalid',
      details: environmentSetup,
      metadata: {
        processId: 'specializations/qa-testing-automation/mobile-testing',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...environmentSetup.artifacts);

  // Quality Gate: Environment must be properly configured
  await ctx.breakpoint({
    question: `Phase 1 Complete: Appium environment configured. ${environmentSetup.devicesConfigured} device(s) configured across ${platforms.length} platform(s). Appium Doctor: ${environmentSetup.appiumDoctorStatus}. Proceed with test development?`,
    title: 'Environment Setup Review',
    context: {
      runId: ctx.runId,
      platforms,
      devicesConfigured: environmentSetup.devicesConfigured,
      appiumVersion: environmentSetup.appiumVersion,
      appiumDoctorStatus: environmentSetup.appiumDoctorStatus,
      cloudProviderConnected: environmentSetup.cloudProviderConnected,
      files: environmentSetup.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // PHASE 2: TEST SCENARIO ANALYSIS AND PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing mobile app features and planning test scenarios');

  const scenarioPlanning = await ctx.task(scenarioPlanningTask, {
    appName,
    platforms,
    appFiles,
    testScenarios,
    acceptanceCriteria,
    outputDir
  });

  artifacts.push(...scenarioPlanning.artifacts);

  // Quality Gate: Sufficient test coverage planned
  const scenarioCount = scenarioPlanning.plannedScenarios.length;
  if (scenarioCount < 10) {
    await ctx.breakpoint({
      question: `Only ${scenarioCount} test scenarios planned. Mobile apps typically require 15-25 scenarios for comprehensive coverage. Review scenarios and approve to continue?`,
      title: 'Test Scenario Coverage Review',
      context: {
        runId: ctx.runId,
        scenarioCount,
        plannedScenarios: scenarioPlanning.plannedScenarios.map(s => ({ name: s.name, priority: s.priority })),
        recommendation: 'Consider adding more scenarios for edge cases, gestures, and device features',
        files: scenarioPlanning.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 3: MOBILE SCREEN OBJECTS DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Building mobile screen objects with locator strategies');

  const screenObjectDevelopment = await ctx.task(screenObjectDevelopmentTask, {
    appName,
    platforms,
    plannedScenarios: scenarioPlanning.plannedScenarios,
    appFiles,
    outputDir
  });

  artifacts.push(...screenObjectDevelopment.artifacts);

  // Quality Gate: Screen objects for both platforms
  const iosScreens = screenObjectDevelopment.screenObjects.filter(s => s.platform === 'iOS').length;
  const androidScreens = screenObjectDevelopment.screenObjects.filter(s => s.platform === 'Android').length;

  if (platforms.includes('iOS') && platforms.includes('Android')) {
    const parity = Math.min(iosScreens, androidScreens) / Math.max(iosScreens, androidScreens) * 100;
    if (parity < 80) {
      await ctx.breakpoint({
        question: `Platform parity warning: iOS screens: ${iosScreens}, Android screens: ${androidScreens}. Parity: ${parity.toFixed(0)}%. Target: >80%. Review and approve?`,
        title: 'Cross-Platform Screen Parity',
        context: {
          runId: ctx.runId,
          iosScreens,
          androidScreens,
          parity,
          screenObjects: screenObjectDevelopment.screenObjects.map(s => ({ name: s.name, platform: s.platform })),
          files: screenObjectDevelopment.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
        }
      });
    }
  }

  // ============================================================================
  // PHASE 4: DEVICE CAPABILITY CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Configuring device capabilities for test execution');

  const deviceConfiguration = await ctx.task(deviceConfigurationTask, {
    appName,
    platforms,
    deviceMatrix,
    appFiles,
    cloudProvider,
    realDeviceTesting,
    outputDir
  });

  artifacts.push(...deviceConfiguration.artifacts);

  // ============================================================================
  // PHASE 5: PARALLEL TEST IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing mobile test automation in parallel');

  // Parallelize test implementation for different scenario categories
  const [
    authenticationTests,
    coreFeatureTests,
    gestureTests,
    deviceFeatureTests
  ] = await ctx.parallel.all([
    () => ctx.task(authenticationTestsTask, {
      appName,
      platforms,
      scenarios: scenarioPlanning.plannedScenarios.filter(s => s.category === 'authentication'),
      screenObjects: screenObjectDevelopment.screenObjects,
      deviceCapabilities: deviceConfiguration.capabilities,
      outputDir
    }),
    () => ctx.task(coreFeatureTestsTask, {
      appName,
      platforms,
      scenarios: scenarioPlanning.plannedScenarios.filter(s => s.category === 'core-feature'),
      screenObjects: screenObjectDevelopment.screenObjects,
      deviceCapabilities: deviceConfiguration.capabilities,
      outputDir
    }),
    () => ctx.task(gestureTestsTask, {
      appName,
      platforms,
      scenarios: scenarioPlanning.plannedScenarios.filter(s => s.category === 'gesture'),
      screenObjects: screenObjectDevelopment.screenObjects,
      deviceCapabilities: deviceConfiguration.capabilities,
      outputDir
    }),
    () => ctx.task(deviceFeatureTestsTask, {
      appName,
      platforms,
      scenarios: scenarioPlanning.plannedScenarios.filter(s => s.category === 'device-feature'),
      screenObjects: screenObjectDevelopment.screenObjects,
      deviceCapabilities: deviceConfiguration.capabilities,
      outputDir
    })
  ]);

  artifacts.push(
    ...authenticationTests.artifacts,
    ...coreFeatureTests.artifacts,
    ...gestureTests.artifacts,
    ...deviceFeatureTests.artifacts
  );

  const totalTestsImplemented =
    authenticationTests.testCount +
    coreFeatureTests.testCount +
    gestureTests.testCount +
    deviceFeatureTests.testCount;

  ctx.log('info', `Total mobile tests implemented: ${totalTestsImplemented}`);

  // ============================================================================
  // PHASE 6: INITIAL TEST EXECUTION - EMULATORS/SIMULATORS
  // ============================================================================

  ctx.log('info', 'Phase 6: Running initial test execution on emulators/simulators');

  const initialExecution = await ctx.task(testExecutionTask, {
    appName,
    platforms,
    deviceCapabilities: deviceConfiguration.capabilities,
    executionType: 'emulator',
    parallelExecution,
    outputDir
  });

  artifacts.push(...initialExecution.artifacts);

  // Quality Gate: Initial pass rate
  const initialPassRate = initialExecution.passRate;
  if (initialPassRate < 40) {
    await ctx.breakpoint({
      question: `Initial test execution pass rate: ${initialPassRate}%. Below 40% threshold. This indicates significant issues. Review failures and continue debugging?`,
      title: 'Initial Execution Results - Low Pass Rate',
      context: {
        runId: ctx.runId,
        passRate: initialPassRate,
        totalTests: initialExecution.totalTests,
        passed: initialExecution.passed,
        failed: initialExecution.failed,
        platformBreakdown: initialExecution.platformBreakdown,
        topFailures: initialExecution.topFailureReasons,
        files: initialExecution.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 7: DEBUGGING AND TEST FIXES
  // ============================================================================

  ctx.log('info', 'Phase 7: Debugging test failures and implementing fixes');

  const debuggingPhase = await ctx.task(debuggingAndFixesTask, {
    appName,
    platforms,
    executionResults: initialExecution,
    screenObjects: screenObjectDevelopment.screenObjects,
    scenarios: scenarioPlanning.plannedScenarios,
    outputDir
  });

  artifacts.push(...debuggingPhase.artifacts);

  // ============================================================================
  // PHASE 8: CROSS-PLATFORM PARITY VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Validating cross-platform test parity');

  const parityValidation = await ctx.task(crossPlatformParityTask, {
    appName,
    platforms,
    authenticationTests,
    coreFeatureTests,
    gestureTests,
    deviceFeatureTests,
    executionResults: initialExecution,
    acceptanceCriteria,
    outputDir
  });

  artifacts.push(...parityValidation.artifacts);

  // Quality Gate: Platform parity
  const parityScore = parityValidation.parityScore;
  if (parityScore < acceptanceCriteria.platformParity) {
    await ctx.breakpoint({
      question: `Cross-platform parity score: ${parityScore}%. Target: ${acceptanceCriteria.platformParity}%. Platform differences detected. Review parity gaps and approve to proceed?`,
      title: 'Platform Parity Quality Gate',
      context: {
        runId: ctx.runId,
        parityScore,
        targetParity: acceptanceCriteria.platformParity,
        parityGaps: parityValidation.parityGaps,
        recommendation: parityValidation.recommendation,
        files: parityValidation.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 9: GESTURE AND INTERACTION TESTING
  // ============================================================================

  ctx.log('info', 'Phase 9: Validating mobile-specific gestures and interactions');

  const gestureValidation = await ctx.task(gestureValidationTask, {
    appName,
    platforms,
    gestureTests,
    deviceCapabilities: deviceConfiguration.capabilities,
    outputDir
  });

  artifacts.push(...gestureValidation.artifacts);

  // Quality Gate: Gesture coverage
  const gesturesCovered = gestureValidation.gesturesCovered;
  const expectedGestures = ['tap', 'swipe', 'scroll', 'long-press', 'pinch', 'drag'];
  const gestureCoverage = (gesturesCovered.length / expectedGestures.length) * 100;

  if (gestureCoverage < 70) {
    await ctx.breakpoint({
      question: `Gesture coverage: ${gestureCoverage.toFixed(0)}% (${gesturesCovered.length}/${expectedGestures.length} gestures). Missing: ${expectedGestures.filter(g => !gesturesCovered.includes(g)).join(', ')}. Approve to continue?`,
      title: 'Gesture Coverage Review',
      context: {
        runId: ctx.runId,
        gestureCoverage,
        gesturesCovered,
        missingGestures: expectedGestures.filter(g => !gesturesCovered.includes(g)),
        files: gestureValidation.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 10: DEVICE FEATURE TESTING
  // ============================================================================

  ctx.log('info', 'Phase 10: Testing device-specific features');

  const deviceFeatureValidation = await ctx.task(deviceFeatureValidationTask, {
    appName,
    platforms,
    deviceFeatureTests,
    deviceCapabilities: deviceConfiguration.capabilities,
    outputDir
  });

  artifacts.push(...deviceFeatureValidation.artifacts);

  // ============================================================================
  // PHASE 11: TEST STABILITY IMPROVEMENTS
  // ============================================================================

  ctx.log('info', 'Phase 11: Improving test stability and eliminating flakiness');

  const stabilityImprovements = await ctx.task(stabilityImprovementsTask, {
    appName,
    platforms,
    executionResults: initialExecution,
    debuggingResults: debuggingPhase,
    outputDir
  });

  artifacts.push(...stabilityImprovements.artifacts);

  // ============================================================================
  // PHASE 12: REAL DEVICE TESTING (if enabled)
  // ============================================================================

  let realDeviceExecution = null;
  if (realDeviceTesting && cloudProvider) {
    ctx.log('info', 'Phase 12: Running tests on real devices via cloud provider');

    realDeviceExecution = await ctx.task(testExecutionTask, {
      appName,
      platforms,
      deviceCapabilities: deviceConfiguration.realDeviceCapabilities,
      executionType: 'real-device',
      parallelExecution,
      cloudProvider,
      outputDir
    });

    artifacts.push(...realDeviceExecution.artifacts);

    // Quality Gate: Real device vs emulator parity
    const realDevicePassRate = realDeviceExecution.passRate;
    const emulatorPassRate = initialExecution.passRate;
    const deviceParity = Math.abs(realDevicePassRate - emulatorPassRate);

    if (deviceParity > 10) {
      await ctx.breakpoint({
        question: `Real device pass rate: ${realDevicePassRate}%, Emulator pass rate: ${emulatorPassRate}%. Difference: ${deviceParity.toFixed(1)}%. Investigate device-specific issues?`,
        title: 'Real Device vs Emulator Parity',
        context: {
          runId: ctx.runId,
          realDevicePassRate,
          emulatorPassRate,
          deviceParity,
          realDeviceIssues: realDeviceExecution.deviceSpecificIssues,
          files: realDeviceExecution.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
        }
      });
    }
  }

  // ============================================================================
  // PHASE 13: FINAL TEST EXECUTION
  // ============================================================================

  ctx.log('info', 'Phase 13: Running final comprehensive test execution');

  const finalExecution = await ctx.task(testExecutionTask, {
    appName,
    platforms,
    deviceCapabilities: deviceConfiguration.capabilities,
    executionType: 'final',
    parallelExecution,
    outputDir
  });

  artifacts.push(...finalExecution.artifacts);

  const finalPassRate = finalExecution.passRate;
  const flakinessRate = finalExecution.flakinessRate;

  // Quality Gate: Final pass rate
  if (finalPassRate < acceptanceCriteria.passRate) {
    await ctx.breakpoint({
      question: `Final test pass rate: ${finalPassRate}%. Target: ${acceptanceCriteria.passRate}%. Below acceptance criteria. Review and decide to proceed or iterate?`,
      title: 'Pass Rate Quality Gate',
      context: {
        runId: ctx.runId,
        finalPassRate,
        targetPassRate: acceptanceCriteria.passRate,
        totalTests: finalExecution.totalTests,
        platformBreakdown: finalExecution.platformBreakdown,
        recommendation: 'Consider additional debugging or adjust acceptance criteria',
        files: finalExecution.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // Quality Gate: Flakiness rate
  if (flakinessRate > acceptanceCriteria.flakiness) {
    await ctx.breakpoint({
      question: `Flakiness rate: ${flakinessRate}%. Target: <${acceptanceCriteria.flakiness}%. Mobile tests are inherently more flaky. Continue or stabilize further?`,
      title: 'Flakiness Quality Gate',
      context: {
        runId: ctx.runId,
        flakinessRate,
        targetFlakiness: acceptanceCriteria.flakiness,
        flakyTests: finalExecution.flakyTests,
        recommendation: 'Apply additional waits and retry mechanisms',
        files: stabilityImprovements.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 14: CODE REVIEW AND BEST PRACTICES
  // ============================================================================

  ctx.log('info', 'Phase 14: Conducting code review and validating mobile testing best practices');

  const codeReview = await ctx.task(codeReviewTask, {
    appName,
    platforms,
    screenObjects: screenObjectDevelopment.screenObjects,
    testFiles: [
      ...authenticationTests.testFiles,
      ...coreFeatureTests.testFiles,
      ...gestureTests.testFiles,
      ...deviceFeatureTests.testFiles
    ],
    executionResults: finalExecution,
    outputDir
  });

  artifacts.push(...codeReview.artifacts);

  // Quality Gate: Code review
  if (codeReview.criticalIssues.length > 0) {
    await ctx.breakpoint({
      question: `Code review identified ${codeReview.criticalIssues.length} critical issue(s) in mobile test code. Review and approve fixes?`,
      title: 'Code Review Critical Issues',
      context: {
        runId: ctx.runId,
        criticalIssues: codeReview.criticalIssues,
        suggestions: codeReview.suggestions,
        bestPracticeViolations: codeReview.bestPracticeViolations,
        files: codeReview.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 15: CI/CD INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 15: Configuring CI/CD pipeline integration for mobile tests');

  const cicdIntegration = await ctx.task(cicdIntegrationTask, {
    appName,
    platforms,
    cloudProvider,
    deviceConfiguration,
    executionResults: finalExecution,
    cicdPlatform,
    parallelExecution,
    outputDir
  });

  artifacts.push(...cicdIntegration.artifacts);

  // ============================================================================
  // PHASE 16: DOCUMENTATION GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 16: Generating comprehensive mobile test documentation');

  const documentation = await ctx.task(documentationGenerationTask, {
    appName,
    platforms,
    scenarioPlanning,
    screenObjectDevelopment,
    deviceConfiguration,
    authenticationTests,
    coreFeatureTests,
    gestureTests,
    deviceFeatureTests,
    gestureValidation,
    deviceFeatureValidation,
    executionResults: finalExecution,
    realDeviceExecution,
    stabilityImprovements,
    codeReview,
    cicdIntegration,
    cloudProvider,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // ============================================================================
  // PHASE 17: FINAL ASSESSMENT AND METRICS
  // ============================================================================

  ctx.log('info', 'Phase 17: Computing final mobile test suite metrics and assessment');

  const finalAssessment = await ctx.task(finalAssessmentTask, {
    appName,
    platforms,
    scenarioPlanning,
    screenObjectDevelopment,
    deviceConfiguration,
    authenticationTests,
    coreFeatureTests,
    gestureTests,
    deviceFeatureTests,
    parityValidation,
    gestureValidation,
    deviceFeatureValidation,
    finalExecution,
    realDeviceExecution,
    stabilityImprovements,
    codeReview,
    cicdIntegration,
    acceptanceCriteria,
    outputDir
  });

  testSuiteStats = finalAssessment.testSuiteStats;
  stabilityScore = finalAssessment.stabilityScore;
  artifacts.push(...finalAssessment.artifacts);

  ctx.log('info', `Mobile test suite stability score: ${stabilityScore}/100`);
  ctx.log('info', `Total tests: ${testSuiteStats.totalTests}, Pass rate: ${testSuiteStats.passRate}%`);
  ctx.log('info', `Platform parity: ${testSuiteStats.platformParity}%`);

  // Final Breakpoint: Mobile Test Suite Approval
  await ctx.breakpoint({
    question: `Mobile App Testing Automation Complete for ${appName}. Stability Score: ${stabilityScore}/100, Pass Rate: ${testSuiteStats.passRate}%, Platform Parity: ${testSuiteStats.platformParity}%. Approve test suite for production use?`,
    title: 'Final Mobile Test Suite Review',
    context: {
      runId: ctx.runId,
      summary: {
        appName,
        platforms,
        totalTests: testSuiteStats.totalTests,
        passRate: testSuiteStats.passRate,
        flakinessRate: testSuiteStats.flakinessRate,
        stabilityScore,
        platformParity: testSuiteStats.platformParity,
        scenariosCovered: scenarioPlanning.plannedScenarios.length,
        screenObjects: screenObjectDevelopment.screenObjects.length,
        devicesCovered: deviceConfiguration.totalDevices,
        gesturesCovered: gestureValidation.gesturesCovered.length,
        realDeviceTesting: realDeviceTesting && realDeviceExecution !== null,
        cicdReady: cicdIntegration.ready,
        cloudProvider: cloudProvider || 'Local'
      },
      acceptanceCriteria,
      verdict: finalAssessment.verdict,
      recommendation: finalAssessment.recommendation,
      files: [
        { path: documentation.testSuiteDocPath, format: 'markdown', label: 'Mobile Test Suite Documentation' },
        { path: finalAssessment.metricsReportPath, format: 'json', label: 'Metrics Report' },
        { path: finalExecution.reportPath, format: 'html', label: 'Test Execution Report' },
        { path: codeReview.reviewReportPath, format: 'markdown', label: 'Code Review Report' },
        { path: parityValidation.parityReportPath, format: 'json', label: 'Platform Parity Report' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    appName,
    platforms,
    cloudProvider: cloudProvider || 'Local',
    stabilityScore,
    testSuiteStats: {
      totalTests: testSuiteStats.totalTests,
      passRate: testSuiteStats.passRate,
      flakinessRate: testSuiteStats.flakinessRate,
      platformParity: testSuiteStats.platformParity,
      averageExecutionTime: testSuiteStats.averageExecutionTime,
      scenariosCovered: scenarioPlanning.plannedScenarios.length,
      screenObjectsCreated: screenObjectDevelopment.screenObjects.length,
      authenticationTests: authenticationTests.testCount,
      coreFeatureTests: coreFeatureTests.testCount,
      gestureTests: gestureTests.testCount,
      deviceFeatureTests: deviceFeatureTests.testCount
    },
    deviceCoverage: {
      totalDevices: deviceConfiguration.totalDevices,
      iosDevices: deviceConfiguration.iosDeviceCount,
      androidDevices: deviceConfiguration.androidDeviceCount,
      realDevices: realDeviceTesting ? deviceConfiguration.realDeviceCapabilities.length : 0,
      emulators: deviceConfiguration.capabilities.length
    },
    testExecutionReport: {
      passed: finalExecution.passed,
      failed: finalExecution.failed,
      skipped: finalExecution.skipped,
      flakyTests: finalExecution.flakyTests,
      platformBreakdown: finalExecution.platformBreakdown,
      reportPath: finalExecution.reportPath,
      realDeviceResults: realDeviceExecution ? {
        passed: realDeviceExecution.passed,
        failed: realDeviceExecution.failed,
        passRate: realDeviceExecution.passRate
      } : null
    },
    crossPlatformParity: {
      parityScore: parityValidation.parityScore,
      parityGaps: parityValidation.parityGaps,
      parityReportPath: parityValidation.parityReportPath
    },
    gestureTesting: {
      gesturesCovered: gestureValidation.gesturesCovered,
      gestureCoverage: (gestureValidation.gesturesCovered.length / 6) * 100,
      gestureValidationReport: gestureValidation.reportPath
    },
    deviceFeatureTesting: {
      featuresCovered: deviceFeatureValidation.featuresCovered,
      featureValidationReport: deviceFeatureValidation.reportPath
    },
    qualityGates: {
      passRateMet: finalPassRate >= acceptanceCriteria.passRate,
      flakinessMet: flakinessRate <= acceptanceCriteria.flakiness,
      platformParityMet: parityValidation.parityScore >= acceptanceCriteria.platformParity,
      executionTimeMet: testSuiteStats.averageExecutionTime <= acceptanceCriteria.maxExecutionTime,
      coverageMet: finalAssessment.coverageScore >= acceptanceCriteria.testCoverage
    },
    cicdIntegration: {
      ready: cicdIntegration.ready,
      pipelineConfigPath: cicdIntegration.pipelineConfigPath,
      parallelExecutionEnabled: parallelExecution,
      platform: cicdPlatform
    },
    artifacts,
    documentation: {
      testSuiteDocPath: documentation.testSuiteDocPath,
      usageGuidePath: documentation.usageGuidePath,
      troubleshootingPath: documentation.troubleshootingPath,
      deviceSetupGuidePath: documentation.deviceSetupGuidePath
    },
    finalAssessment: {
      verdict: finalAssessment.verdict,
      recommendation: finalAssessment.recommendation,
      productionReady: finalAssessment.productionReady,
      metricsReportPath: finalAssessment.metricsReportPath
    },
    duration,
    metadata: {
      processId: 'specializations/qa-testing-automation/mobile-testing',
      timestamp: startTime,
      platforms,
      cloudProvider: cloudProvider || 'Local',
      realDeviceTesting,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: Environment Setup and Validation
export const environmentSetupTask = defineTask('environment-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Appium Environment Setup - ${args.appName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Mobile Test Automation Engineer specializing in Appium',
      task: 'Set up and validate Appium environment for mobile testing',
      context: {
        appName: args.appName,
        platforms: args.platforms,
        appFiles: args.appFiles,
        cloudProvider: args.cloudProvider,
        deviceMatrix: args.deviceMatrix,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Verify Node.js installation and version (>=14.x)',
        '2. Install Appium globally (npm install -g appium)',
        '3. Install Appium Doctor and run diagnostics (appium-doctor --ios --android)',
        '4. Install platform-specific drivers (appium driver install uiautomator2, appium driver install xcuitest)',
        '5. Verify Xcode and iOS Simulator setup (for iOS)',
        '6. Verify Android SDK, emulator, and ANDROID_HOME (for Android)',
        '7. Validate app files exist and are accessible',
        '8. Set up cloud provider credentials if using BrowserStack/Sauce Labs',
        '9. Configure device capabilities for each platform',
        '10. Test Appium server startup and device connection',
        '11. Create framework directory structure',
        '12. Install required npm packages (webdriverio, @wdio/appium-service, etc.)',
        '13. Generate environment setup report'
      ],
      outputFormat: 'JSON object with environment setup status and configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'appiumVersion', 'appiumDoctorStatus', 'devicesConfigured', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        appiumVersion: { type: 'string' },
        appiumDoctorStatus: { type: 'string', enum: ['passed', 'warnings', 'failed'] },
        devicesConfigured: { type: 'number' },
        platforms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              platform: { type: 'string' },
              driverInstalled: { type: 'boolean' },
              deviceReady: { type: 'boolean' },
              appValidated: { type: 'boolean' }
            }
          }
        },
        cloudProviderConnected: { type: 'boolean' },
        frameworkDependencies: { type: 'array', items: { type: 'string' } },
        configurationFiles: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'mobile-testing', 'appium', 'environment-setup']
}));

// Phase 2: Scenario Planning
export const scenarioPlanningTask = defineTask('scenario-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Mobile Test Scenario Planning - ${args.appName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Mobile QA Strategist',
      task: 'Analyze mobile app and plan comprehensive test scenarios',
      context: {
        appName: args.appName,
        platforms: args.platforms,
        appFiles: args.appFiles,
        testScenarios: args.testScenarios,
        acceptanceCriteria: args.acceptanceCriteria,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze provided test scenarios or identify critical mobile user flows',
        '2. Categorize scenarios: authentication, core-feature, gesture, device-feature',
        '3. Identify cross-platform vs platform-specific scenarios',
        '4. Plan gesture testing: tap, swipe, scroll, long-press, pinch, drag',
        '5. Plan device feature testing: camera, GPS, notifications, orientation, network conditions',
        '6. Define test data requirements for each scenario',
        '7. Identify edge cases and error scenarios',
        '8. Prioritize scenarios by business impact and risk',
        '9. Plan for offline/online mode testing if applicable',
        '10. Create scenario mapping document with acceptance criteria',
        '11. Estimate test automation complexity',
        '12. Generate test scenario catalog'
      ],
      outputFormat: 'JSON object with planned scenarios categorized and prioritized'
    },
    outputSchema: {
      type: 'object',
      required: ['plannedScenarios', 'categoryBreakdown', 'artifacts'],
      properties: {
        plannedScenarios: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              category: { type: 'string', enum: ['authentication', 'core-feature', 'gesture', 'device-feature', 'performance'] },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              platforms: { type: 'array', items: { type: 'string' } },
              description: { type: 'string' },
              steps: { type: 'array', items: { type: 'string' } },
              expectedResult: { type: 'string' },
              testDataNeeded: { type: 'object' },
              gestures: { type: 'array', items: { type: 'string' } },
              deviceFeatures: { type: 'array', items: { type: 'string' } },
              complexity: { type: 'string', enum: ['low', 'medium', 'high'] }
            }
          },
          minItems: 10
        },
        categoryBreakdown: {
          type: 'object',
          properties: {
            authentication: { type: 'number' },
            coreFeature: { type: 'number' },
            gesture: { type: 'number' },
            deviceFeature: { type: 'number' },
            performance: { type: 'number' }
          }
        },
        platformSpecificScenarios: { type: 'number' },
        crossPlatformScenarios: { type: 'number' },
        totalEstimatedTests: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'mobile-testing', 'test-planning', 'scenario-design']
}));

// Phase 3: Screen Object Development
export const screenObjectDevelopmentTask = defineTask('screen-object-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Mobile Screen Objects Development - ${args.appName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Mobile Test Automation Developer',
      task: 'Build mobile screen objects with platform-specific locators',
      context: {
        appName: args.appName,
        platforms: args.platforms,
        plannedScenarios: args.plannedScenarios,
        appFiles: args.appFiles,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify all unique screens across planned scenarios',
        '2. Create base MobileScreen class with common mobile methods',
        '3. Implement screen classes for each platform (iOS and Android)',
        '4. Use accessibility IDs as primary locator strategy',
        '5. Add fallback locators (XPath, class name, text)',
        '6. Implement mobile-specific actions: tap, swipe, scroll, type',
        '7. Add gesture methods: swipeUp, swipeDown, swipeLeft, swipeRight',
        '8. Implement wait strategies for mobile elements',
        '9. Add screenshot capture methods',
        '10. Create platform-specific locator management',
        '11. Implement fluent interface pattern',
        '12. Document screen objects with usage examples'
      ],
      outputFormat: 'JSON object with screen objects for both platforms'
    },
    outputSchema: {
      type: 'object',
      required: ['screenObjects', 'baseClasses', 'artifacts'],
      properties: {
        screenObjects: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              platform: { type: 'string', enum: ['iOS', 'Android', 'cross-platform'] },
              path: { type: 'string' },
              elementCount: { type: 'number' },
              elements: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    locatorStrategy: { type: 'string' },
                    iosLocator: { type: 'string' },
                    androidLocator: { type: 'string' }
                  }
                }
              },
              actionMethods: { type: 'array', items: { type: 'string' } },
              gestureMethods: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        baseClasses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              className: { type: 'string' },
              path: { type: 'string' },
              methods: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        locatorStrategy: { type: 'string' },
        platformParity: { type: 'number', description: 'Percentage of screens available on both platforms' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'mobile-testing', 'screen-objects', 'page-objects']
}));

// Phase 4: Device Configuration
export const deviceConfigurationTask = defineTask('device-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Device Capability Configuration - ${args.appName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Mobile DevOps Engineer',
      task: 'Configure device capabilities for test execution',
      context: {
        appName: args.appName,
        platforms: args.platforms,
        deviceMatrix: args.deviceMatrix,
        appFiles: args.appFiles,
        cloudProvider: args.cloudProvider,
        realDeviceTesting: args.realDeviceTesting,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create device capability configurations for each platform',
        '2. Configure iOS capabilities: deviceName, platformVersion, app, bundleId, automationName (XCUITest)',
        '3. Configure Android capabilities: deviceName, platformVersion, app, appPackage, appActivity, automationName (UiAutomator2)',
        '4. Set up emulator/simulator capabilities',
        '5. Configure real device capabilities if enabled',
        '6. Set up cloud provider capabilities (BrowserStack, Sauce Labs)',
        '7. Configure common capabilities: newCommandTimeout, autoAcceptAlerts, orientation',
        '8. Set up parallel execution capabilities',
        '9. Configure screenshot and video recording settings',
        '10. Create capability files for different environments',
        '11. Document device selection strategy',
        '12. Generate capability configuration report'
      ],
      outputFormat: 'JSON object with device capabilities'
    },
    outputSchema: {
      type: 'object',
      required: ['capabilities', 'totalDevices', 'artifacts'],
      properties: {
        capabilities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              platform: { type: 'string' },
              deviceName: { type: 'string' },
              platformVersion: { type: 'string' },
              deviceType: { type: 'string', enum: ['emulator', 'simulator', 'real-device'] },
              capabilityFile: { type: 'string' },
              appPath: { type: 'string' }
            }
          }
        },
        realDeviceCapabilities: {
          type: 'array',
          items: { type: 'object' }
        },
        totalDevices: { type: 'number' },
        iosDeviceCount: { type: 'number' },
        androidDeviceCount: { type: 'number' },
        cloudProviderConfig: {
          type: 'object',
          properties: {
            provider: { type: 'string' },
            configured: { type: 'boolean' },
            availableDevices: { type: 'number' }
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
  labels: ['agent', 'mobile-testing', 'device-configuration', 'appium']
}));

// Phase 5.1: Authentication Tests
export const authenticationTestsTask = defineTask('authentication-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Authentication Tests - ${args.appName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Mobile Test Automation Engineer',
      task: 'Implement authentication test scenarios for mobile app',
      context: {
        appName: args.appName,
        platforms: args.platforms,
        scenarios: args.scenarios,
        screenObjects: args.screenObjects,
        deviceCapabilities: args.deviceCapabilities,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Implement login tests (valid/invalid credentials, biometric)',
        '2. Create signup/registration tests',
        '3. Implement password reset tests',
        '4. Test social login (if applicable)',
        '5. Test remember me functionality',
        '6. Test logout and session management',
        '7. Test app lock/unlock (if applicable)',
        '8. Implement tests for both iOS and Android',
        '9. Use screen objects and follow mobile best practices',
        '10. Add proper wait strategies for async operations',
        '11. Handle platform-specific authentication flows',
        '12. Generate test implementation report'
      ],
      outputFormat: 'JSON object with implemented authentication tests'
    },
    outputSchema: {
      type: 'object',
      required: ['testCount', 'testFiles', 'artifacts'],
      properties: {
        testCount: { type: 'number' },
        testFiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              testName: { type: 'string' },
              platforms: { type: 'array', items: { type: 'string' } },
              scenario: { type: 'string' }
            }
          }
        },
        coverageByPlatform: {
          type: 'object',
          properties: {
            iOS: { type: 'number' },
            Android: { type: 'number' }
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
  labels: ['agent', 'mobile-testing', 'authentication', 'test-implementation']
}));

// Phase 5.2: Core Feature Tests
export const coreFeatureTestsTask = defineTask('core-feature-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Core Feature Tests - ${args.appName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Mobile Test Automation Engineer',
      task: 'Implement core feature test scenarios',
      context: {
        appName: args.appName,
        platforms: args.platforms,
        scenarios: args.scenarios,
        screenObjects: args.screenObjects,
        deviceCapabilities: args.deviceCapabilities,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Implement primary business workflow tests',
        '2. Create search and filter tests',
        '3. Implement form submission tests',
        '4. Test list views and detail views',
        '5. Test navigation and menu functionality',
        '6. Implement CRUD operation tests',
        '7. Test offline functionality if applicable',
        '8. Test app state preservation',
        '9. Handle platform-specific UI differences',
        '10. Add validation for data persistence',
        '11. Test deep linking if applicable',
        '12. Generate comprehensive test suite'
      ],
      outputFormat: 'JSON object with core feature tests'
    },
    outputSchema: {
      type: 'object',
      required: ['testCount', 'testFiles', 'artifacts'],
      properties: {
        testCount: { type: 'number' },
        testFiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              testName: { type: 'string' },
              platforms: { type: 'array', items: { type: 'string' } },
              scenario: { type: 'string' }
            }
          }
        },
        coverageByPlatform: {
          type: 'object',
          properties: {
            iOS: { type: 'number' },
            Android: { type: 'number' }
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
  labels: ['agent', 'mobile-testing', 'core-features', 'test-implementation']
}));

// Phase 5.3: Gesture Tests
export const gestureTestsTask = defineTask('gesture-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Gesture Tests - ${args.appName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Mobile Interaction Testing Specialist',
      task: 'Implement mobile gesture test scenarios',
      context: {
        appName: args.appName,
        platforms: args.platforms,
        scenarios: args.scenarios,
        screenObjects: args.screenObjects,
        deviceCapabilities: args.deviceCapabilities,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Implement tap gesture tests (single tap, double tap)',
        '2. Create swipe gesture tests (up, down, left, right)',
        '3. Implement scroll tests (vertical and horizontal)',
        '4. Test long-press gesture',
        '5. Test pinch zoom gesture (if applicable)',
        '6. Test drag and drop gesture (if applicable)',
        '7. Test pull-to-refresh gesture',
        '8. Test multi-finger gestures if needed',
        '9. Verify gesture responsiveness and accuracy',
        '10. Handle platform-specific gesture differences',
        '11. Add visual verification for gesture results',
        '12. Generate gesture test report'
      ],
      outputFormat: 'JSON object with gesture tests'
    },
    outputSchema: {
      type: 'object',
      required: ['testCount', 'testFiles', 'gesturesCovered', 'artifacts'],
      properties: {
        testCount: { type: 'number' },
        testFiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              testName: { type: 'string' },
              gesture: { type: 'string' },
              platforms: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        gesturesCovered: {
          type: 'array',
          items: { type: 'string' }
        },
        coverageByPlatform: {
          type: 'object',
          properties: {
            iOS: { type: 'number' },
            Android: { type: 'number' }
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
  labels: ['agent', 'mobile-testing', 'gestures', 'test-implementation']
}));

// Phase 5.4: Device Feature Tests
export const deviceFeatureTestsTask = defineTask('device-feature-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Device Feature Tests - ${args.appName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Mobile Device Testing Specialist',
      task: 'Implement device-specific feature tests',
      context: {
        appName: args.appName,
        platforms: args.platforms,
        scenarios: args.scenarios,
        screenObjects: args.screenObjects,
        deviceCapabilities: args.deviceCapabilities,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Test device orientation changes (portrait/landscape)',
        '2. Implement network condition tests (online/offline/poor connection)',
        '3. Test push notification handling (if applicable)',
        '4. Test camera integration (if applicable)',
        '5. Test GPS/location services (if applicable)',
        '6. Test phone call interruptions',
        '7. Test app backgrounding and foregrounding',
        '8. Test battery optimization impact',
        '9. Test permissions handling',
        '10. Test app updates and version migrations',
        '11. Handle platform-specific device features',
        '12. Generate device feature test report'
      ],
      outputFormat: 'JSON object with device feature tests'
    },
    outputSchema: {
      type: 'object',
      required: ['testCount', 'testFiles', 'featuresCovered', 'artifacts'],
      properties: {
        testCount: { type: 'number' },
        testFiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              testName: { type: 'string' },
              deviceFeature: { type: 'string' },
              platforms: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        featuresCovered: {
          type: 'array',
          items: { type: 'string' }
        },
        coverageByPlatform: {
          type: 'object',
          properties: {
            iOS: { type: 'number' },
            Android: { type: 'number' }
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
  labels: ['agent', 'mobile-testing', 'device-features', 'test-implementation']
}));

// Phase 6: Test Execution
export const testExecutionTask = defineTask('test-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Test Execution (${args.executionType}) - ${args.appName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Mobile Test Execution Engineer',
      task: `Execute mobile test suite on ${args.executionType === 'real-device' ? 'real devices' : 'emulators/simulators'}`,
      context: {
        appName: args.appName,
        platforms: args.platforms,
        deviceCapabilities: args.deviceCapabilities,
        executionType: args.executionType,
        parallelExecution: args.parallelExecution,
        cloudProvider: args.cloudProvider,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Start Appium server(s)',
        '2. Launch test execution with configured capabilities',
        '3. Run tests in parallel if enabled',
        '4. Capture test results (passed, failed, skipped)',
        '5. Identify flaky tests',
        '6. Analyze failures by platform and device',
        '7. Capture screenshots and logs for failures',
        '8. Generate video recordings if configured',
        '9. Calculate pass rate per platform',
        '10. Identify top failure reasons',
        '11. Calculate execution time and performance metrics',
        '12. Generate detailed execution report with platform breakdown'
      ],
      outputFormat: 'JSON object with test execution results'
    },
    outputSchema: {
      type: 'object',
      required: ['totalTests', 'passed', 'failed', 'passRate', 'flakinessRate', 'platformBreakdown', 'artifacts'],
      properties: {
        totalTests: { type: 'number' },
        passed: { type: 'number' },
        failed: { type: 'number' },
        skipped: { type: 'number' },
        passRate: { type: 'number' },
        flakinessRate: { type: 'number' },
        executionTime: { type: 'number', description: 'Minutes' },
        platformBreakdown: {
          type: 'object',
          properties: {
            iOS: {
              type: 'object',
              properties: {
                passed: { type: 'number' },
                failed: { type: 'number' },
                passRate: { type: 'number' }
              }
            },
            Android: {
              type: 'object',
              properties: {
                passed: { type: 'number' },
                failed: { type: 'number' },
                passRate: { type: 'number' }
              }
            }
          }
        },
        flakyTests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testName: { type: 'string' },
              platform: { type: 'string' },
              flakinessScore: { type: 'number' }
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
              platform: { type: 'string' }
            }
          }
        },
        deviceSpecificIssues: {
          type: 'array',
          items: { type: 'string' }
        },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'mobile-testing', 'test-execution', args.executionType]
}));

// Phase 7: Debugging and Fixes
export const debuggingAndFixesTask = defineTask('debugging-fixes', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Test Debugging and Fixes - ${args.appName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Mobile Test Debugging Expert',
      task: 'Debug mobile test failures and implement fixes',
      context: {
        appName: args.appName,
        platforms: args.platforms,
        executionResults: args.executionResults,
        screenObjects: args.screenObjects,
        scenarios: args.scenarios,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze test failures from execution results',
        '2. Categorize failures: locator issues, timing, platform differences, app bugs',
        '3. Fix locator issues (update accessibility IDs, XPath)',
        '4. Resolve timing issues (add explicit waits, handle async operations)',
        '5. Fix platform-specific failures',
        '6. Update screen objects with corrected locators',
        '7. Add retry logic for known flaky operations',
        '8. Handle app-specific exceptions',
        '9. Document actual app bugs found',
        '10. Re-run fixed tests to verify resolution',
        '11. Track improvement metrics',
        '12. Generate debugging report'
      ],
      outputFormat: 'JSON object with debugging results and fixes'
    },
    outputSchema: {
      type: 'object',
      required: ['totalIssuesFixed', 'remainingIssues', 'artifacts'],
      properties: {
        totalIssuesFixed: { type: 'number' },
        fixedIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testName: { type: 'string' },
              platform: { type: 'string' },
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
              platform: { type: 'string' },
              issueType: { type: 'string' },
              reason: { type: 'string' }
            }
          }
        },
        appBugsFound: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              platform: { type: 'string' },
              severity: { type: 'string' }
            }
          }
        },
        improvementRate: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'mobile-testing', 'debugging', 'test-fixes']
}));

// Phase 8: Cross-Platform Parity
export const crossPlatformParityTask = defineTask('cross-platform-parity', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Cross-Platform Parity Validation - ${args.appName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Mobile Cross-Platform QA Analyst',
      task: 'Validate test and feature parity across iOS and Android',
      context: {
        appName: args.appName,
        platforms: args.platforms,
        authenticationTests: args.authenticationTests,
        coreFeatureTests: args.coreFeatureTests,
        gestureTests: args.gestureTests,
        deviceFeatureTests: args.deviceFeatureTests,
        executionResults: args.executionResults,
        acceptanceCriteria: args.acceptanceCriteria,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Compare test coverage across iOS and Android',
        '2. Identify platform-specific tests vs cross-platform tests',
        '3. Analyze pass rates for each platform',
        '4. Identify feature parity gaps',
        '5. Compare UI/UX differences',
        '6. Validate business logic consistency',
        '7. Check performance differences',
        '8. Identify platform-specific bugs',
        '9. Calculate parity score (0-100)',
        '10. Document acceptable differences',
        '11. Generate parity gap report',
        '12. Provide recommendations for improvement'
      ],
      outputFormat: 'JSON object with parity analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['parityScore', 'parityGaps', 'recommendation', 'artifacts'],
      properties: {
        parityScore: { type: 'number', minimum: 0, maximum: 100 },
        testCoverageComparison: {
          type: 'object',
          properties: {
            iOS: { type: 'number' },
            Android: { type: 'number' },
            crossPlatform: { type: 'number' }
          }
        },
        passRateComparison: {
          type: 'object',
          properties: {
            iOS: { type: 'number' },
            Android: { type: 'number' }
          }
        },
        parityGaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              feature: { type: 'string' },
              missingOn: { type: 'string' },
              impact: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              reason: { type: 'string' }
            }
          }
        },
        platformSpecificFeatures: {
          type: 'object',
          properties: {
            iOS: { type: 'array', items: { type: 'string' } },
            Android: { type: 'array', items: { type: 'string' } }
          }
        },
        recommendation: { type: 'string' },
        parityReportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'mobile-testing', 'cross-platform', 'parity-validation']
}));

// Phase 9: Gesture Validation
export const gestureValidationTask = defineTask('gesture-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Gesture Validation - ${args.appName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Mobile Interaction QA Specialist',
      task: 'Validate mobile gesture coverage and accuracy',
      context: {
        appName: args.appName,
        platforms: args.platforms,
        gestureTests: args.gestureTests,
        deviceCapabilities: args.deviceCapabilities,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Verify all standard gestures are covered: tap, swipe, scroll, long-press, pinch, drag',
        '2. Validate gesture accuracy and responsiveness',
        '3. Test gesture edge cases',
        '4. Verify gesture behavior across different screen sizes',
        '5. Validate platform-specific gesture differences',
        '6. Test multi-touch gestures if applicable',
        '7. Verify gesture animations and transitions',
        '8. Test gesture conflicts and priorities',
        '9. Generate gesture coverage matrix',
        '10. Document gesture best practices',
        '11. Provide recommendations for missing gestures',
        '12. Generate gesture validation report'
      ],
      outputFormat: 'JSON object with gesture validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['gesturesCovered', 'coveragePercentage', 'reportPath', 'artifacts'],
      properties: {
        gesturesCovered: {
          type: 'array',
          items: { type: 'string' }
        },
        coveragePercentage: { type: 'number' },
        gestureAccuracy: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gesture: { type: 'string' },
              platform: { type: 'string' },
              accuracy: { type: 'string', enum: ['excellent', 'good', 'fair', 'poor'] }
            }
          }
        },
        missingGestures: { type: 'array', items: { type: 'string' } },
        gestureIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gesture: { type: 'string' },
              issue: { type: 'string' },
              platform: { type: 'string' }
            }
          }
        },
        recommendation: { type: 'string' },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'mobile-testing', 'gesture-validation', 'interaction-testing']
}));

// Phase 10: Device Feature Validation
export const deviceFeatureValidationTask = defineTask('device-feature-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Device Feature Validation - ${args.appName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Mobile Device Feature QA Specialist',
      task: 'Validate device-specific feature coverage',
      context: {
        appName: args.appName,
        platforms: args.platforms,
        deviceFeatureTests: args.deviceFeatureTests,
        deviceCapabilities: args.deviceCapabilities,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Verify all device features are tested: orientation, network, notifications, camera, GPS, permissions',
        '2. Validate feature behavior across platforms',
        '3. Test app behavior during interruptions',
        '4. Verify background/foreground handling',
        '5. Test permission handling flows',
        '6. Validate network condition handling',
        '7. Test device feature integration',
        '8. Verify platform-specific implementations',
        '9. Generate device feature coverage matrix',
        '10. Document device feature limitations',
        '11. Provide recommendations for missing features',
        '12. Generate feature validation report'
      ],
      outputFormat: 'JSON object with device feature validation'
    },
    outputSchema: {
      type: 'object',
      required: ['featuresCovered', 'coveragePercentage', 'reportPath', 'artifacts'],
      properties: {
        featuresCovered: {
          type: 'array',
          items: { type: 'string' }
        },
        coveragePercentage: { type: 'number' },
        featureValidation: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              feature: { type: 'string' },
              platform: { type: 'string' },
              status: { type: 'string', enum: ['passed', 'failed', 'not-applicable'] }
            }
          }
        },
        missingFeatures: { type: 'array', items: { type: 'string' } },
        featureIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              feature: { type: 'string' },
              issue: { type: 'string' },
              platform: { type: 'string' }
            }
          }
        },
        recommendation: { type: 'string' },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'mobile-testing', 'device-features', 'feature-validation']
}));

// Phase 11: Stability Improvements
export const stabilityImprovementsTask = defineTask('stability-improvements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Mobile Test Stability Improvements - ${args.appName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Mobile Test Stability Engineer',
      task: 'Eliminate flakiness and improve mobile test stability',
      context: {
        appName: args.appName,
        platforms: args.platforms,
        executionResults: args.executionResults,
        debuggingResults: args.debuggingResults,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify flaky tests from execution history',
        '2. Analyze root causes: timing, network, app state, device-specific',
        '3. Replace hard waits with intelligent explicit waits',
        '4. Implement proper wait-for-element strategies',
        '5. Add retry mechanisms for known flaky operations',
        '6. Ensure test isolation and proper cleanup',
        '7. Handle app state resets between tests',
        '8. Implement network condition stabilization',
        '9. Add platform-specific stability improvements',
        '10. Run stability validation (10x execution)',
        '11. Track flakiness reduction metrics',
        '12. Generate stability improvement report'
      ],
      outputFormat: 'JSON object with stability improvements'
    },
    outputSchema: {
      type: 'object',
      required: ['stabilityScore', 'flakinessReduction', 'improvementsMade', 'artifacts'],
      properties: {
        stabilityScore: { type: 'number', minimum: 0, maximum: 100 },
        flakinessReduction: { type: 'number' },
        improvementsMade: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testName: { type: 'string' },
              platform: { type: 'string' },
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
              platform: { type: 'string' },
              flakinessRate: { type: 'number' }
            }
          }
        },
        stabilityPatterns: {
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
  labels: ['agent', 'mobile-testing', 'stability', 'flakiness-elimination']
}));

// Phase 14: Code Review
export const codeReviewTask = defineTask('code-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 14: Mobile Test Code Review - ${args.appName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior Mobile Test Automation Architect',
      task: 'Conduct code review of mobile test suite',
      context: {
        appName: args.appName,
        platforms: args.platforms,
        screenObjects: args.screenObjects,
        testFiles: args.testFiles,
        executionResults: args.executionResults,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Review screen object implementation',
        '2. Check mobile-specific best practices (waits, gestures, locators)',
        '3. Verify proper use of accessibility IDs',
        '4. Review platform-specific code organization',
        '5. Check for code duplication',
        '6. Verify wait strategy implementation',
        '7. Review error handling and retry logic',
        '8. Check test data management',
        '9. Verify screenshot and logging practices',
        '10. Review naming conventions',
        '11. Check security (no hardcoded credentials)',
        '12. Generate code review report with recommendations'
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
              issue: { type: 'string' },
              severity: { type: 'string' },
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
        bestPracticeViolations: { type: 'array', items: { type: 'string' } },
        reviewReportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'mobile-testing', 'code-review', 'quality-assurance']
}));

// Phase 15: CI/CD Integration
export const cicdIntegrationTask = defineTask('cicd-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 15: CI/CD Integration - ${args.appName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Mobile DevOps Engineer',
      task: 'Configure CI/CD pipeline for mobile test automation',
      context: {
        appName: args.appName,
        platforms: args.platforms,
        cloudProvider: args.cloudProvider,
        deviceConfiguration: args.deviceConfiguration,
        executionResults: args.executionResults,
        cicdPlatform: args.cicdPlatform,
        parallelExecution: args.parallelExecution,
        outputDir: args.outputDir
      },
      instructions: [
        `1. Create ${args.cicdPlatform} workflow for mobile tests`,
        '2. Configure app build stages (iOS and Android)',
        '3. Set up Appium server in pipeline',
        '4. Configure emulator/simulator setup',
        '5. Integrate cloud device provider if applicable',
        '6. Configure parallel test execution',
        '7. Set up artifact upload (APK/IPA, test reports, screenshots)',
        '8. Configure test result reporting',
        '9. Add mobile-specific quality gates',
        '10. Set up notifications for failures',
        '11. Configure scheduled runs',
        '12. Document pipeline setup and maintenance'
      ],
      outputFormat: 'JSON object with CI/CD integration status'
    },
    outputSchema: {
      type: 'object',
      required: ['ready', 'pipelineConfigPath', 'stages', 'artifacts'],
      properties: {
        ready: { type: 'boolean' },
        pipelineConfigPath: { type: 'string' },
        stages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              platform: { type: 'string' },
              commands: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        parallelJobsConfigured: { type: 'number' },
        cloudProviderIntegrated: { type: 'boolean' },
        artifactStorageConfigured: { type: 'boolean' },
        qualityGatesConfigured: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'mobile-testing', 'cicd', 'devops']
}));

// Phase 16: Documentation Generation
export const documentationGenerationTask = defineTask('documentation-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 16: Mobile Test Documentation - ${args.appName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Documentation Specialist',
      task: 'Generate comprehensive mobile test documentation',
      context: {
        appName: args.appName,
        platforms: args.platforms,
        scenarioPlanning: args.scenarioPlanning,
        screenObjectDevelopment: args.screenObjectDevelopment,
        deviceConfiguration: args.deviceConfiguration,
        executionResults: args.executionResults,
        realDeviceExecution: args.realDeviceExecution,
        cloudProvider: args.cloudProvider,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create mobile test suite overview',
        '2. Document Appium setup instructions',
        '3. Write device setup guide (emulators, simulators, real devices)',
        '4. Document screen object patterns',
        '5. Create test execution guide',
        '6. Document gesture and interaction testing',
        '7. Write troubleshooting guide for common mobile issues',
        '8. Document cloud provider setup',
        '9. Create platform-specific notes',
        '10. Document CI/CD integration',
        '11. Write contribution guidelines',
        '12. Generate README with quick start'
      ],
      outputFormat: 'JSON object with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['testSuiteDocPath', 'usageGuidePath', 'deviceSetupGuidePath', 'artifacts'],
      properties: {
        testSuiteDocPath: { type: 'string' },
        usageGuidePath: { type: 'string' },
        deviceSetupGuidePath: { type: 'string' },
        troubleshootingPath: { type: 'string' },
        appiumSetupPath: { type: 'string' },
        platformNotesPath: { type: 'string' },
        readmePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'mobile-testing', 'documentation']
}));

// Phase 17: Final Assessment
export const finalAssessmentTask = defineTask('final-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 17: Final Mobile Test Assessment - ${args.appName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Mobile QA Lead and Test Strategy Expert',
      task: 'Conduct final assessment of mobile test suite',
      context: {
        appName: args.appName,
        platforms: args.platforms,
        scenarioPlanning: args.scenarioPlanning,
        screenObjectDevelopment: args.screenObjectDevelopment,
        deviceConfiguration: args.deviceConfiguration,
        finalExecution: args.finalExecution,
        realDeviceExecution: args.realDeviceExecution,
        parityValidation: args.parityValidation,
        gestureValidation: args.gestureValidation,
        deviceFeatureValidation: args.deviceFeatureValidation,
        stabilityImprovements: args.stabilityImprovements,
        codeReview: args.codeReview,
        cicdIntegration: args.cicdIntegration,
        acceptanceCriteria: args.acceptanceCriteria,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Calculate overall test coverage',
        '2. Compute stability score (0-100)',
        '3. Assess platform parity achievement',
        '4. Evaluate gesture and device feature coverage',
        '5. Review execution performance',
        '6. Assess maintainability',
        '7. Evaluate CI/CD integration',
        '8. Compare against acceptance criteria',
        '9. Assess production readiness',
        '10. Provide verdict and recommendations',
        '11. Identify next steps for improvement',
        '12. Generate comprehensive assessment report'
      ],
      outputFormat: 'JSON object with final assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['testSuiteStats', 'stabilityScore', 'productionReady', 'verdict', 'artifacts'],
      properties: {
        testSuiteStats: {
          type: 'object',
          properties: {
            totalTests: { type: 'number' },
            passRate: { type: 'number' },
            flakinessRate: { type: 'number' },
            platformParity: { type: 'number' },
            averageExecutionTime: { type: 'number' },
            gestureCoverage: { type: 'number' },
            deviceFeatureCoverage: { type: 'number' }
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
            platformParity: { type: 'boolean' },
            flakiness: { type: 'boolean' }
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
  labels: ['agent', 'mobile-testing', 'final-assessment', 'metrics']
}));
