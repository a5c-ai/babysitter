/**
 * @process specializations/ux-ui-design/design-qa
 * @description Design QA and Visual Regression Testing - Comprehensive design quality assurance process ensuring
 * pixel-perfect implementation, design system compliance, cross-browser consistency, responsive design verification,
 * and visual regression prevention through automated screenshot comparison and design validation.
 * @inputs { projectName: string, designFiles: array, implementationUrl: string, pages?: array, components?: array, tool?: string, designSystem?: object, viewports?: array, browsers?: array }
 * @outputs { success: boolean, complianceScore: number, visualDifferences: array, pixelPerfectScore: number, designSystemCompliance: object, testResults: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/ux-ui-design/design-qa', {
 *   projectName: 'E-Commerce Platform',
 *   designFiles: ['figma://project/dashboard', 'figma://project/checkout'],
 *   implementationUrl: 'https://staging.example.com',
 *   pages: ['/dashboard', '/products', '/checkout'],
 *   components: ['navigation', 'product-card', 'button', 'form-input'],
 *   tool: 'percy',
 *   designSystem: {
 *     tokens: 'design-tokens.json',
 *     components: 'component-library',
 *     guidelines: 'design-guidelines.md'
 *   },
 *   viewports: ['mobile-375', 'tablet-768', 'desktop-1440'],
 *   browsers: ['chrome', 'firefox', 'safari'],
 *   toleranceLevel: 'strict',
 *   includeAccessibility: true
 * });
 *
 * @references
 * - Percy Visual Testing: https://percy.io/
 * - Chromatic: https://www.chromatic.com/
 * - BackstopJS: https://github.com/garris/BackstopJS
 * - Playwright Visual Comparison: https://playwright.dev/docs/test-snapshots
 * - Design QA Best Practices: https://www.smashingmagazine.com/
 * - Visual Regression Testing: https://www.browserstack.com/guide/visual-regression-testing
 * - Design System Testing: https://storybook.js.org/docs/react/writing-tests/visual-testing
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    designFiles = [],
    implementationUrl,
    pages = [],
    components = [],
    tool = 'percy', // 'percy', 'chromatic', 'backstop', 'playwright', 'applitools'
    designSystem = {},
    viewports = ['mobile-375', 'tablet-768', 'desktop-1440'],
    browsers = ['chrome', 'firefox', 'safari'],
    toleranceLevel = 'strict', // 'strict', 'moderate', 'relaxed'
    includeAccessibility = true,
    includeDarkMode = false,
    includeInteractiveStates = true,
    pixelPerfectThreshold = 0.05, // 0.05% pixel difference tolerance
    layoutShiftThreshold = 0.02, // 2% layout shift tolerance
    colorDifferenceThreshold = 2, // Delta-E color difference (0-100 scale)
    typographyTolerance = 1, // 1px tolerance for font metrics
    spacingTolerance = 2, // 2px tolerance for spacing
    outputDir = 'design-qa-output',
    automatedBaseline = true,
    cicdIntegration = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const visualDifferences = [];
  let complianceScore = 0;
  let pixelPerfectScore = 0;
  let designSystemCompliance = {};
  let testResults = {};

  ctx.log('info', `Starting Design QA and Visual Regression Testing: ${projectName}`);
  ctx.log('info', `Implementation: ${implementationUrl}, Tool: ${tool}, Tolerance: ${toleranceLevel}`);
  ctx.log('info', `Pages: ${pages.length}, Components: ${components.length}, Viewports: ${viewports.length}, Browsers: ${browsers.length}`);

  // ============================================================================
  // PHASE 1: DESIGN QA STRATEGY AND PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 1: Planning design QA and visual regression strategy');

  const qaStrategy = await ctx.task(designQaStrategyTask, {
    projectName,
    designFiles,
    implementationUrl,
    pages,
    components,
    tool,
    designSystem,
    viewports,
    browsers,
    toleranceLevel,
    includeAccessibility,
    includeDarkMode,
    includeInteractiveStates,
    outputDir
  });

  if (!qaStrategy.success) {
    return {
      success: false,
      error: 'Design QA strategy planning failed',
      details: qaStrategy,
      metadata: {
        processId: 'specializations/ux-ui-design/design-qa',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...qaStrategy.artifacts);

  // Quality Gate: Strategy review
  await ctx.breakpoint({
    question: `Design QA strategy planned. ${qaStrategy.totalTestScenarios} test scenarios across ${pages.length} pages and ${components.length} components. Coverage: ${qaStrategy.coveragePercentage}%. Tolerance level: ${toleranceLevel}. Review and approve strategy?`,
    title: 'Design QA Strategy Review',
    context: {
      runId: ctx.runId,
      strategy: {
        totalTestScenarios: qaStrategy.totalTestScenarios,
        pages: pages.length,
        components: components.length,
        viewports: viewports.length,
        browsers: browsers.length,
        coveragePercentage: qaStrategy.coveragePercentage,
        estimatedBaselines: qaStrategy.estimatedBaselines,
        tooling: tool,
        toleranceLevel
      },
      testScope: qaStrategy.testScope,
      files: qaStrategy.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 2: DESIGN SYSTEM COMPLIANCE VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Validating design system compliance');

  const designSystemValidation = await ctx.task(designSystemComplianceTask, {
    projectName,
    implementationUrl,
    designSystem,
    pages,
    components,
    colorDifferenceThreshold,
    typographyTolerance,
    spacingTolerance,
    outputDir
  });

  designSystemCompliance = designSystemValidation.complianceResults;
  artifacts.push(...designSystemValidation.artifacts);

  const dsComplianceScore = designSystemValidation.overallComplianceScore;

  ctx.log('info', `Design system compliance: ${dsComplianceScore}/100`);

  // ============================================================================
  // PHASE 3: VISUAL REGRESSION TOOL SETUP
  // ============================================================================

  ctx.log('info', 'Phase 3: Setting up visual regression testing tools');

  const toolSetup = await ctx.task(visualRegressionToolSetupTask, {
    projectName,
    tool,
    viewports,
    browsers,
    pixelPerfectThreshold,
    layoutShiftThreshold,
    colorDifferenceThreshold,
    automatedBaseline,
    cicdIntegration,
    outputDir
  });

  if (!toolSetup.success) {
    return {
      success: false,
      error: 'Visual regression tool setup failed',
      details: toolSetup,
      metadata: {
        processId: 'specializations/ux-ui-design/design-qa',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...toolSetup.artifacts);

  ctx.log('info', `Tool setup complete: ${toolSetup.toolsConfigured.join(', ')}`);

  // ============================================================================
  // PHASE 4: DESIGN FILE ANALYSIS AND EXTRACTION
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing design files and extracting specifications');

  const designAnalysis = await ctx.task(designFileAnalysisTask, {
    projectName,
    designFiles,
    designSystem,
    pages,
    components,
    outputDir
  });

  artifacts.push(...designAnalysis.artifacts);

  const designSpecs = designAnalysis.specifications;
  const designAssets = designAnalysis.extractedAssets;

  ctx.log('info', `Design analysis complete: ${designSpecs.length} specifications extracted`);

  // ============================================================================
  // PHASE 5: VIEWPORT AND BREAKPOINT CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Configuring viewports, breakpoints, and device emulation');

  const viewportConfig = await ctx.task(viewportBreakpointConfigTask, {
    projectName,
    viewports,
    browsers,
    designSystem,
    deviceEmulation: true,
    orientation: ['portrait', 'landscape'],
    pixelRatios: [1, 2, 3],
    outputDir
  });

  artifacts.push(...viewportConfig.artifacts);

  ctx.log('info', `Configured ${viewportConfig.totalConfigurations} viewport/browser combinations`);

  // ============================================================================
  // PHASE 6: BASELINE SCREENSHOT CAPTURE
  // ============================================================================

  ctx.log('info', 'Phase 6: Capturing baseline screenshots from design files');

  const baselineCapture = await ctx.task(baselineScreenshotCaptureTask, {
    projectName,
    designFiles,
    designAnalysis,
    pages,
    components,
    viewportConfig: viewportConfig.configurations,
    includeInteractiveStates,
    includeDarkMode,
    outputDir
  });

  artifacts.push(...baselineCapture.artifacts);

  const baselinesCreated = baselineCapture.baselineCount;

  ctx.log('info', `Baseline capture: ${baselinesCreated} baseline screenshots created`);

  // Quality Gate: Baseline review
  await ctx.breakpoint({
    question: `Baseline capture complete. ${baselinesCreated} baseline screenshots captured from design files across ${viewportConfig.totalConfigurations} configurations. Review baselines and approve to proceed with comparison?`,
    title: 'Baseline Screenshot Review',
    context: {
      runId: ctx.runId,
      baselines: {
        total: baselinesCreated,
        pages: baselineCapture.pageBaselines.length,
        components: baselineCapture.componentBaselines.length,
        configurations: viewportConfig.totalConfigurations
      },
      baselineDetails: baselineCapture.baselineDetails,
      files: baselineCapture.sampleBaselines.map(b => ({
        path: b.imagePath,
        format: 'image',
        label: `Baseline: ${b.name} @ ${b.viewport}`
      }))
    }
  });

  // ============================================================================
  // PHASE 7: IMPLEMENTATION SCREENSHOT CAPTURE
  // ============================================================================

  ctx.log('info', 'Phase 7: Capturing implementation screenshots');

  const implementationCapture = await ctx.task(implementationScreenshotCaptureTask, {
    projectName,
    implementationUrl,
    pages,
    components,
    viewportConfig: viewportConfig.configurations,
    includeInteractiveStates,
    includeDarkMode,
    waitForStability: true,
    disableAnimations: true,
    outputDir
  });

  artifacts.push(...implementationCapture.artifacts);

  const implementationScreenshots = implementationCapture.screenshotCount;

  ctx.log('info', `Implementation capture: ${implementationScreenshots} screenshots captured`);

  // ============================================================================
  // PHASE 8: PIXEL-PERFECT COMPARISON
  // ============================================================================

  ctx.log('info', 'Phase 8: Running pixel-perfect visual comparison');

  const pixelComparison = await ctx.task(pixelPerfectComparisonTask, {
    projectName,
    baselineCapture,
    implementationCapture,
    pixelPerfectThreshold,
    layoutShiftThreshold,
    colorDifferenceThreshold,
    outputDir
  });

  artifacts.push(...pixelComparison.artifacts);

  pixelPerfectScore = pixelComparison.pixelPerfectScore;
  visualDifferences.push(...pixelComparison.differences);

  ctx.log('info', `Pixel-perfect comparison: Score ${pixelPerfectScore}/100, ${pixelComparison.differences.length} differences found`);

  // Quality Gate: Pixel-perfect review
  if (pixelComparison.criticalDifferences.length > 0) {
    await ctx.breakpoint({
      question: `Pixel-perfect comparison found ${pixelComparison.criticalDifferences.length} critical difference(s) and ${pixelComparison.differences.length} total differences. Pixel-perfect score: ${pixelPerfectScore}/100. Review differences and approve to continue?`,
      title: 'Pixel-Perfect Comparison Results',
      context: {
        runId: ctx.runId,
        comparison: {
          pixelPerfectScore,
          totalDifferences: pixelComparison.differences.length,
          criticalDifferences: pixelComparison.criticalDifferences.length,
          moderateDifferences: pixelComparison.moderateDifferences.length,
          minorDifferences: pixelComparison.minorDifferences.length
        },
        criticalIssues: pixelComparison.criticalDifferences.slice(0, 10),
        files: [
          { path: pixelComparison.reportPath, format: 'html', label: 'Comparison Report' },
          ...pixelComparison.diffImages.slice(0, 5).map(img => ({
            path: img.path,
            format: 'image',
            label: `Diff: ${img.name}`
          }))
        ]
      }
    });
  }

  // ============================================================================
  // PHASE 9: TYPOGRAPHY VERIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Verifying typography implementation');

  const typographyVerification = await ctx.task(typographyVerificationTask, {
    projectName,
    implementationUrl,
    designSpecs,
    designSystem,
    pages,
    components,
    typographyTolerance,
    outputDir
  });

  artifacts.push(...typographyVerification.artifacts);

  const typographyScore = typographyVerification.complianceScore;

  ctx.log('info', `Typography verification: ${typographyScore}/100, ${typographyVerification.issues.length} issues found`);

  // ============================================================================
  // PHASE 10: SPACING AND LAYOUT VERIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Verifying spacing and layout implementation');

  const spacingVerification = await ctx.task(spacingLayoutVerificationTask, {
    projectName,
    implementationUrl,
    designSpecs,
    designSystem,
    pages,
    components,
    spacingTolerance,
    layoutShiftThreshold,
    outputDir
  });

  artifacts.push(...spacingVerification.artifacts);

  const spacingScore = spacingVerification.complianceScore;

  ctx.log('info', `Spacing verification: ${spacingScore}/100, ${spacingVerification.issues.length} issues found`);

  // ============================================================================
  // PHASE 11: COLOR ACCURACY VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 11: Validating color accuracy');

  const colorValidation = await ctx.task(colorAccuracyValidationTask, {
    projectName,
    implementationUrl,
    designSpecs,
    designSystem,
    pages,
    components,
    colorDifferenceThreshold,
    outputDir
  });

  artifacts.push(...colorValidation.artifacts);

  const colorScore = colorValidation.complianceScore;

  ctx.log('info', `Color validation: ${colorScore}/100, ${colorValidation.issues.length} issues found`);

  // ============================================================================
  // PHASE 12: INTERACTIVE STATES TESTING
  // ============================================================================

  let interactiveStatesResults = null;
  if (includeInteractiveStates) {
    ctx.log('info', 'Phase 12: Testing interactive states (hover, focus, active, disabled)');

    interactiveStatesResults = await ctx.task(interactiveStatesTestingTask, {
      projectName,
      implementationUrl,
      components,
      designSpecs,
      viewportConfig: viewportConfig.configurations,
      states: ['default', 'hover', 'focus', 'active', 'disabled', 'error', 'loading'],
      outputDir
    });

    artifacts.push(...interactiveStatesResults.artifacts);

    ctx.log('info', `Interactive states: ${interactiveStatesResults.testsPassed}/${interactiveStatesResults.totalTests} tests passed`);
  }

  // ============================================================================
  // PHASE 13: RESPONSIVE DESIGN VERIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 13: Verifying responsive design implementation');

  const responsiveVerification = await ctx.task(responsiveDesignVerificationTask, {
    projectName,
    implementationUrl,
    pages,
    components,
    viewportConfig: viewportConfig.configurations,
    designSpecs,
    layoutShiftThreshold,
    outputDir
  });

  artifacts.push(...responsiveVerification.artifacts);

  const responsiveScore = responsiveVerification.complianceScore;

  ctx.log('info', `Responsive verification: ${responsiveScore}/100, ${responsiveVerification.issues.length} issues found`);

  // ============================================================================
  // PHASE 14: CROSS-BROWSER CONSISTENCY TESTING
  // ============================================================================

  ctx.log('info', 'Phase 14: Testing cross-browser visual consistency');

  const crossBrowserTest = await ctx.task(crossBrowserConsistencyTask, {
    projectName,
    implementationUrl,
    pages,
    components,
    browsers,
    viewportConfig: viewportConfig.configurations,
    pixelPerfectThreshold,
    outputDir
  });

  artifacts.push(...crossBrowserTest.artifacts);

  const crossBrowserScore = crossBrowserTest.consistencyScore;

  ctx.log('info', `Cross-browser testing: ${crossBrowserScore}/100, ${crossBrowserTest.inconsistencies.length} inconsistencies found`);

  // Quality Gate: Cross-browser review
  if (crossBrowserTest.criticalInconsistencies.length > 0) {
    await ctx.breakpoint({
      question: `Cross-browser testing found ${crossBrowserTest.criticalInconsistencies.length} critical inconsistency/inconsistencies across browsers. Consistency score: ${crossBrowserScore}/100. Review browser-specific issues and approve to continue?`,
      title: 'Cross-Browser Consistency Review',
      context: {
        runId: ctx.runId,
        crossBrowser: {
          consistencyScore: crossBrowserScore,
          totalInconsistencies: crossBrowserTest.inconsistencies.length,
          criticalInconsistencies: crossBrowserTest.criticalInconsistencies.length,
          browsersCovered: browsers.length
        },
        criticalIssues: crossBrowserTest.criticalInconsistencies,
        files: [
          { path: crossBrowserTest.reportPath, format: 'html', label: 'Cross-Browser Report' },
          ...crossBrowserTest.comparisonImages.slice(0, 5).map(img => ({
            path: img.path,
            format: 'image',
            label: `Browser: ${img.browser}`
          }))
        ]
      }
    });
  }

  // ============================================================================
  // PHASE 15: DARK MODE VERIFICATION (OPTIONAL)
  // ============================================================================

  let darkModeResults = null;
  if (includeDarkMode) {
    ctx.log('info', 'Phase 15: Verifying dark mode implementation');

    darkModeResults = await ctx.task(darkModeVerificationTask, {
      projectName,
      implementationUrl,
      pages,
      components,
      designFiles,
      viewportConfig: viewportConfig.configurations,
      colorDifferenceThreshold,
      outputDir
    });

    artifacts.push(...darkModeResults.artifacts);

    ctx.log('info', `Dark mode verification: ${darkModeResults.complianceScore}/100, ${darkModeResults.issues.length} issues found`);
  }

  // ============================================================================
  // PHASE 16: ACCESSIBILITY VISUAL VALIDATION (OPTIONAL)
  // ============================================================================

  let accessibilityResults = null;
  if (includeAccessibility) {
    ctx.log('info', 'Phase 16: Validating visual accessibility (contrast, focus indicators, touch targets)');

    accessibilityResults = await ctx.task(visualAccessibilityValidationTask, {
      projectName,
      implementationUrl,
      pages,
      components,
      designSystem,
      wcagLevel: 'AA',
      outputDir
    });

    artifacts.push(...accessibilityResults.artifacts);

    ctx.log('info', `Accessibility validation: ${accessibilityResults.accessibilityScore}/100, ${accessibilityResults.violations.length} violations found`);
  }

  // ============================================================================
  // PHASE 17: VISUAL REGRESSION ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 17: Analyzing visual regressions and categorizing differences');

  const regressionAnalysis = await ctx.task(visualRegressionAnalysisTask, {
    projectName,
    visualDifferences,
    pixelComparison,
    typographyVerification,
    spacingVerification,
    colorValidation,
    responsiveVerification,
    crossBrowserTest,
    toleranceLevel,
    outputDir
  });

  artifacts.push(...regressionAnalysis.artifacts);

  const regressions = regressionAnalysis.regressions;
  const intentionalChanges = regressionAnalysis.intentionalChanges;
  const falsePositives = regressionAnalysis.falsePositives;

  ctx.log('info', `Regression analysis: ${regressions.length} true regressions, ${intentionalChanges.length} intentional changes, ${falsePositives.length} false positives`);

  // ============================================================================
  // PHASE 18: DESIGN DEVIATION REPORT
  // ============================================================================

  ctx.log('info', 'Phase 18: Generating design deviation report');

  const deviationReport = await ctx.task(designDeviationReportTask, {
    projectName,
    pixelPerfectScore,
    designSystemCompliance,
    typographyVerification,
    spacingVerification,
    colorValidation,
    responsiveVerification,
    crossBrowserTest,
    interactiveStatesResults,
    darkModeResults,
    accessibilityResults,
    regressionAnalysis,
    outputDir
  });

  artifacts.push(...deviationReport.artifacts);

  // ============================================================================
  // PHASE 19: REMEDIATION PLAN CREATION
  // ============================================================================

  ctx.log('info', 'Phase 19: Creating design QA remediation plan');

  const remediationPlan = await ctx.task(designQaRemediationPlanTask, {
    projectName,
    regressions,
    pixelComparison,
    typographyVerification,
    spacingVerification,
    colorValidation,
    responsiveVerification,
    crossBrowserTest,
    prioritizeByImpact: true,
    outputDir
  });

  artifacts.push(...remediationPlan.artifacts);

  // Quality Gate: Remediation plan review
  await ctx.breakpoint({
    question: `Design QA remediation plan created with ${remediationPlan.totalTasks} tasks across ${remediationPlan.categories.length} categories. ${remediationPlan.criticalTasks} critical tasks identified. Estimated effort: ${remediationPlan.estimatedEffort}. Review and approve for implementation?`,
    title: 'Design QA Remediation Plan Review',
    context: {
      runId: ctx.runId,
      remediation: {
        totalTasks: remediationPlan.totalTasks,
        criticalTasks: remediationPlan.criticalTasks,
        highPriorityTasks: remediationPlan.highPriorityTasks,
        estimatedEffort: remediationPlan.estimatedEffort,
        categories: remediationPlan.categories,
        quickWins: remediationPlan.quickWins.length
      },
      topIssues: remediationPlan.prioritizedTasks.slice(0, 10),
      files: [
        { path: remediationPlan.planPath, format: 'markdown', label: 'Remediation Plan' },
        { path: remediationPlan.roadmapPath, format: 'markdown', label: 'Implementation Roadmap' }
      ]
    }
  });

  // ============================================================================
  // PHASE 20: VISUAL REGRESSION TEST SUITE GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 20: Generating automated visual regression test suite');

  const testSuiteGeneration = await ctx.task(visualRegressionTestSuiteTask, {
    projectName,
    pages,
    components,
    viewportConfig: viewportConfig.configurations,
    baselineCapture,
    tool: toolSetup.toolConfig,
    cicdIntegration,
    outputDir
  });

  artifacts.push(...testSuiteGeneration.artifacts);
  testResults = testSuiteGeneration.testSuite;

  ctx.log('info', `Test suite generated: ${testSuiteGeneration.testCount} automated tests`);

  // ============================================================================
  // PHASE 21: CI/CD INTEGRATION SETUP
  // ============================================================================

  let cicdSetup = null;
  if (cicdIntegration) {
    ctx.log('info', 'Phase 21: Setting up CI/CD pipeline integration');

    cicdSetup = await ctx.task(cicdIntegrationSetupTask, {
      projectName,
      tool: toolSetup.toolConfig,
      testSuite: testSuiteGeneration.testSuite,
      thresholds: {
        pixelPerfectThreshold,
        layoutShiftThreshold,
        colorDifferenceThreshold
      },
      qualityGates: {
        minPixelPerfectScore: 95,
        maxCriticalDifferences: 0,
        maxModerateDifferences: 5
      },
      outputDir
    });

    artifacts.push(...cicdSetup.artifacts);

    ctx.log('info', `CI/CD integration configured: ${cicdSetup.pipelineStages.length} pipeline stages`);
  }

  // ============================================================================
  // PHASE 22: DESIGN HANDOFF VALIDATION CHECKLIST
  // ============================================================================

  ctx.log('info', 'Phase 22: Generating design handoff validation checklist');

  const handoffChecklist = await ctx.task(designHandoffChecklistTask, {
    projectName,
    pixelPerfectScore,
    designSystemCompliance,
    typographyVerification,
    spacingVerification,
    colorValidation,
    responsiveVerification,
    crossBrowserTest,
    interactiveStatesResults,
    darkModeResults,
    accessibilityResults,
    outputDir
  });

  artifacts.push(...handoffChecklist.artifacts);

  // ============================================================================
  // PHASE 23: COMPREHENSIVE DESIGN QA REPORT
  // ============================================================================

  ctx.log('info', 'Phase 23: Generating comprehensive design QA report');

  const comprehensiveReport = await ctx.task(comprehensiveDesignQaReportTask, {
    projectName,
    qaStrategy,
    designSystemCompliance,
    pixelPerfectScore,
    typographyVerification,
    spacingVerification,
    colorValidation,
    responsiveVerification,
    crossBrowserTest,
    interactiveStatesResults,
    darkModeResults,
    accessibilityResults,
    regressionAnalysis,
    deviationReport,
    remediationPlan,
    handoffChecklist,
    testResults,
    outputDir
  });

  artifacts.push(...comprehensiveReport.artifacts);

  // ============================================================================
  // PHASE 24: FINAL DESIGN QA ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 24: Conducting final design QA assessment');

  const finalAssessment = await ctx.task(finalDesignQaAssessmentTask, {
    projectName,
    pixelPerfectScore,
    designSystemCompliance: dsComplianceScore,
    typographyScore,
    spacingScore,
    colorScore,
    responsiveScore,
    crossBrowserScore,
    interactiveStatesResults,
    darkModeResults,
    accessibilityResults,
    regressionAnalysis,
    remediationPlan,
    toleranceLevel,
    outputDir
  });

  artifacts.push(...finalAssessment.artifacts);

  complianceScore = finalAssessment.overallComplianceScore;
  const productionReady = finalAssessment.productionReady;

  // Final Breakpoint: Design QA approval
  await ctx.breakpoint({
    question: `Design QA Complete! ${projectName}: Overall compliance score ${complianceScore}/100, Pixel-perfect score ${pixelPerfectScore}/100. ${regressions.length} regression(s) found, ${remediationPlan.totalTasks} remediation task(s) identified. Production ready: ${productionReady}. ${finalAssessment.verdict}. Approve final design QA deliverables?`,
    title: 'Design QA Complete',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        overallComplianceScore: complianceScore,
        pixelPerfectScore,
        designSystemComplianceScore: dsComplianceScore,
        typographyScore,
        spacingScore,
        colorScore,
        responsiveScore,
        crossBrowserScore,
        totalDifferences: visualDifferences.length,
        regressions: regressions.length,
        remediationTasks: remediationPlan.totalTasks,
        productionReady
      },
      scores: {
        pixelPerfect: pixelPerfectScore,
        designSystem: dsComplianceScore,
        typography: typographyScore,
        spacing: spacingScore,
        color: colorScore,
        responsive: responsiveScore,
        crossBrowser: crossBrowserScore,
        interactiveStates: interactiveStatesResults?.complianceScore || null,
        darkMode: darkModeResults?.complianceScore || null,
        accessibility: accessibilityResults?.accessibilityScore || null
      },
      assessment: {
        verdict: finalAssessment.verdict,
        recommendation: finalAssessment.recommendation,
        productionReady,
        strengths: finalAssessment.strengths,
        concerns: finalAssessment.concerns,
        nextSteps: finalAssessment.nextSteps
      },
      files: [
        { path: comprehensiveReport.mainReportPath, format: 'html', label: 'Comprehensive Design QA Report' },
        { path: deviationReport.reportPath, format: 'pdf', label: 'Design Deviation Report' },
        { path: remediationPlan.planPath, format: 'markdown', label: 'Remediation Plan' },
        { path: handoffChecklist.checklistPath, format: 'markdown', label: 'Design Handoff Checklist' },
        { path: testSuiteGeneration.testSuitePath, format: 'code', label: 'Visual Regression Test Suite' },
        { path: finalAssessment.reportPath, format: 'markdown', label: 'Final Assessment' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: productionReady || complianceScore >= 80,
    projectName,
    complianceScore,
    pixelPerfectScore,
    designSystemComplianceScore: dsComplianceScore,
    visualDifferences: {
      total: visualDifferences.length,
      critical: visualDifferences.filter(d => d.severity === 'critical').length,
      moderate: visualDifferences.filter(d => d.severity === 'moderate').length,
      minor: visualDifferences.filter(d => d.severity === 'minor').length,
      details: visualDifferences
    },
    designSystemCompliance: {
      overallScore: dsComplianceScore,
      colorCompliance: designSystemValidation.colorCompliance,
      typographyCompliance: designSystemValidation.typographyCompliance,
      spacingCompliance: designSystemValidation.spacingCompliance,
      componentCompliance: designSystemValidation.componentCompliance
    },
    scores: {
      pixelPerfect: pixelPerfectScore,
      designSystem: dsComplianceScore,
      typography: typographyScore,
      spacing: spacingScore,
      color: colorScore,
      responsive: responsiveScore,
      crossBrowser: crossBrowserScore,
      interactiveStates: interactiveStatesResults?.complianceScore || null,
      darkMode: darkModeResults?.complianceScore || null,
      accessibility: accessibilityResults?.accessibilityScore || null
    },
    testResults: {
      totalTests: testSuiteGeneration.testCount,
      baselinesCreated,
      implementationScreenshots,
      testSuitePath: testSuiteGeneration.testSuitePath,
      cicdIntegrated: cicdIntegration
    },
    regressionAnalysis: {
      regressions: regressions.length,
      intentionalChanges: intentionalChanges.length,
      falsePositives: falsePositives.length,
      details: regressionAnalysis.summary
    },
    remediationPlan: {
      totalTasks: remediationPlan.totalTasks,
      criticalTasks: remediationPlan.criticalTasks,
      highPriorityTasks: remediationPlan.highPriorityTasks,
      estimatedEffort: remediationPlan.estimatedEffort,
      quickWins: remediationPlan.quickWins,
      planPath: remediationPlan.planPath
    },
    cicdIntegration: cicdSetup ? {
      configured: true,
      pipelineStages: cicdSetup.pipelineStages,
      qualityGates: cicdSetup.qualityGates,
      configPath: cicdSetup.configPath
    } : null,
    finalAssessment: {
      verdict: finalAssessment.verdict,
      recommendation: finalAssessment.recommendation,
      productionReady,
      strengths: finalAssessment.strengths,
      concerns: finalAssessment.concerns,
      nextSteps: finalAssessment.nextSteps
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/ux-ui-design/design-qa',
      timestamp: startTime,
      tool,
      toleranceLevel,
      viewports: viewports.length,
      browsers: browsers.length,
      pages: pages.length,
      components: components.length
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: Design QA Strategy
export const designQaStrategyTask = defineTask('design-qa-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Design QA Strategy - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior UX/UI Designer and Design QA Specialist',
      task: 'Plan comprehensive design QA and visual regression testing strategy',
      context: args,
      instructions: [
        '1. Analyze design files and identify all pages, components, and UI elements to test',
        '2. Map design specifications to implementation URLs',
        '3. Define test scope: pages, components, interactive states, responsive breakpoints',
        '4. Identify critical user flows and high-priority UI components',
        '5. Determine tolerance levels based on design system maturity and project requirements',
        '6. Select appropriate visual regression testing tool (Percy, Chromatic, BackstopJS, etc.)',
        '7. Plan viewport and device coverage (mobile, tablet, desktop, orientation)',
        '8. Define cross-browser testing strategy',
        '9. Plan for interactive states testing (hover, focus, active, disabled, error)',
        '10. Determine dark mode testing requirements (if applicable)',
        '11. Calculate estimated baseline count and test scenarios',
        '12. Estimate test coverage percentage',
        '13. Create design QA strategy document and test plan'
      ],
      outputFormat: 'JSON object with design QA strategy details'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'totalTestScenarios', 'estimatedBaselines', 'coveragePercentage', 'testScope', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        totalTestScenarios: { type: 'number' },
        estimatedBaselines: { type: 'number' },
        coveragePercentage: { type: 'number', minimum: 0, maximum: 100 },
        testScope: {
          type: 'object',
          properties: {
            pages: { type: 'array', items: { type: 'string' } },
            components: { type: 'array', items: { type: 'string' } },
            interactiveStates: { type: 'array', items: { type: 'string' } },
            viewports: { type: 'array', items: { type: 'string' } },
            browsers: { type: 'array', items: { type: 'string' } }
          }
        },
        criticalFlows: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              flow: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              pages: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        toolRecommendation: {
          type: 'object',
          properties: {
            recommendedTool: { type: 'string' },
            rationale: { type: 'string' },
            alternatives: { type: 'array', items: { type: 'string' } }
          }
        },
        testingApproach: {
          type: 'object',
          properties: {
            pixelPerfect: { type: 'boolean' },
            designSystemCompliance: { type: 'boolean' },
            responsive: { type: 'boolean' },
            crossBrowser: { type: 'boolean' },
            interactiveStates: { type: 'boolean' },
            darkMode: { type: 'boolean' },
            accessibility: { type: 'boolean' }
          }
        },
        strategyDocPath: { type: 'string' },
        testPlanPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-qa', 'strategy', 'visual-regression']
}));

// Phase 2: Design System Compliance
export const designSystemComplianceTask = defineTask('design-system-compliance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Design System Compliance Validation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Design System Specialist',
      task: 'Validate implementation against design system tokens, components, and guidelines',
      context: args,
      instructions: [
        '1. Parse design system tokens (colors, typography, spacing, borders, shadows)',
        '2. Audit implementation for color token usage and compliance',
        '3. Verify typography token usage (font families, sizes, weights, line heights)',
        '4. Check spacing token usage (margins, padding, gaps)',
        '5. Validate component usage and consistency with component library',
        '6. Identify hardcoded values and design system violations',
        '7. Check for deprecated token usage',
        '8. Verify semantic token usage (primary, secondary, success, error, etc.)',
        '9. Validate responsive token usage across breakpoints',
        '10. Calculate design system compliance score',
        '11. Generate compliance report with violations and recommendations',
        '12. Create design system deviation list'
      ],
      outputFormat: 'JSON object with design system compliance results'
    },
    outputSchema: {
      type: 'object',
      required: ['complianceResults', 'overallComplianceScore', 'artifacts'],
      properties: {
        complianceResults: {
          type: 'object',
          properties: {
            colorCompliance: { type: 'number', minimum: 0, maximum: 100 },
            typographyCompliance: { type: 'number', minimum: 0, maximum: 100 },
            spacingCompliance: { type: 'number', minimum: 0, maximum: 100 },
            componentCompliance: { type: 'number', minimum: 0, maximum: 100 }
          }
        },
        overallComplianceScore: { type: 'number', minimum: 0, maximum: 100 },
        violations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['color', 'typography', 'spacing', 'component'] },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              element: { type: 'string' },
              page: { type: 'string' },
              expectedValue: { type: 'string' },
              actualValue: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        hardcodedValues: {
          type: 'object',
          properties: {
            colors: { type: 'number' },
            fontSizes: { type: 'number' },
            spacingValues: { type: 'number' },
            total: { type: 'number' }
          }
        },
        deprecatedTokenUsage: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              token: { type: 'string' },
              locations: { type: 'array', items: { type: 'string' } },
              replacement: { type: 'string' }
            }
          }
        },
        complianceReportPath: { type: 'string' },
        deviationListPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-qa', 'design-system', 'compliance']
}));

// Phase 3: Visual Regression Tool Setup
export const visualRegressionToolSetupTask = defineTask('visual-regression-tool-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Visual Regression Tool Setup - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Visual Testing Engineer',
      task: 'Set up and configure visual regression testing tools and infrastructure',
      context: args,
      instructions: [
        '1. Install and configure selected visual regression tool (Percy, Chromatic, BackstopJS, etc.)',
        '2. Set up tool-specific configuration files',
        '3. Configure viewport sizes and device emulation',
        '4. Set up browser configurations (Chrome, Firefox, Safari, Edge)',
        '5. Configure pixel-perfect comparison thresholds',
        '6. Set up layout shift detection thresholds',
        '7. Configure color difference thresholds (Delta-E)',
        '8. Set up screenshot capture settings (full page, element-specific, wait conditions)',
        '9. Configure baseline storage and management',
        '10. Set up diff image generation and reporting',
        '11. Configure automated baseline updates (if enabled)',
        '12. Integrate with CI/CD pipeline (if enabled)',
        '13. Generate tool configuration documentation'
      ],
      outputFormat: 'JSON object with tool setup results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'toolsConfigured', 'toolConfig', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        toolsConfigured: { type: 'array', items: { type: 'string' } },
        toolConfig: {
          type: 'object',
          properties: {
            tool: { type: 'string' },
            version: { type: 'string' },
            configPath: { type: 'string' },
            baselineDirectory: { type: 'string' },
            screenshotDirectory: { type: 'string' },
            diffDirectory: { type: 'string' }
          }
        },
        thresholds: {
          type: 'object',
          properties: {
            pixelDifference: { type: 'number' },
            layoutShift: { type: 'number' },
            colorDifference: { type: 'number' }
          }
        },
        viewportConfigurations: { type: 'array' },
        browserConfigurations: { type: 'array' },
        captureSettings: {
          type: 'object',
          properties: {
            fullPage: { type: 'boolean' },
            waitForNetworkIdle: { type: 'boolean' },
            disableAnimations: { type: 'boolean' },
            clipToElement: { type: 'boolean' }
          }
        },
        configDocPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-qa', 'visual-regression', 'tool-setup']
}));

// Phase 4: Design File Analysis
export const designFileAnalysisTask = defineTask('design-file-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Design File Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Design Specification Analyst',
      task: 'Analyze design files and extract specifications for validation',
      context: args,
      instructions: [
        '1. Connect to design files (Figma, Sketch, Adobe XD, etc.)',
        '2. Extract page designs and component libraries',
        '3. Parse design specifications (colors, typography, spacing, dimensions)',
        '4. Extract color values and color usage patterns',
        '5. Extract typography specifications (font families, sizes, weights, line heights)',
        '6. Extract spacing and layout specifications',
        '7. Document component variants and states',
        '8. Extract interaction specifications (hover, focus, active states)',
        '9. Document responsive design specifications and breakpoints',
        '10. Export design assets (icons, images, illustrations)',
        '11. Create design specification document',
        '12. Generate design-to-implementation mapping'
      ],
      outputFormat: 'JSON object with design analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['specifications', 'extractedAssets', 'artifacts'],
      properties: {
        specifications: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              page: { type: 'string' },
              component: { type: 'string' },
              colors: { type: 'array' },
              typography: { type: 'object' },
              spacing: { type: 'object' },
              dimensions: { type: 'object' },
              states: { type: 'array' }
            }
          }
        },
        extractedAssets: {
          type: 'object',
          properties: {
            images: { type: 'array' },
            icons: { type: 'array' },
            illustrations: { type: 'array' },
            total: { type: 'number' }
          }
        },
        colorPalette: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              hex: { type: 'string' },
              rgb: { type: 'object' },
              usage: { type: 'string' }
            }
          }
        },
        typographySpecs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              style: { type: 'string' },
              fontFamily: { type: 'string' },
              fontSize: { type: 'string' },
              fontWeight: { type: 'string' },
              lineHeight: { type: 'string' },
              letterSpacing: { type: 'string' }
            }
          }
        },
        spacingSystem: {
          type: 'object',
          properties: {
            baseUnit: { type: 'number' },
            scale: { type: 'array' }
          }
        },
        specDocPath: { type: 'string' },
        mappingDocPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-qa', 'design-analysis', 'specification']
}));

// Phase 5: Viewport and Breakpoint Configuration
export const viewportBreakpointConfigTask = defineTask('viewport-breakpoint-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Viewport Configuration - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Responsive Design Specialist',
      task: 'Configure viewports, breakpoints, and device emulation for testing',
      context: args,
      instructions: [
        '1. Define mobile viewport configurations (320px, 375px, 414px)',
        '2. Define tablet viewport configurations (768px, 834px, 1024px)',
        '3. Define desktop viewport configurations (1280px, 1440px, 1920px)',
        '4. Configure device-specific emulation (iPhone, iPad, Android devices)',
        '5. Set up portrait and landscape orientations',
        '6. Configure pixel density ratios (1x, 2x, 3x for retina displays)',
        '7. Map viewports to design system breakpoints',
        '8. Configure browser-specific viewport settings',
        '9. Set up custom viewports based on analytics data (if available)',
        '10. Create viewport configuration matrix',
        '11. Calculate total test configurations (viewports × browsers × states)',
        '12. Generate viewport configuration documentation'
      ],
      outputFormat: 'JSON object with viewport configurations'
    },
    outputSchema: {
      type: 'object',
      required: ['configurations', 'totalConfigurations', 'artifacts'],
      properties: {
        configurations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              width: { type: 'number' },
              height: { type: 'number' },
              deviceScaleFactor: { type: 'number' },
              deviceType: { type: 'string', enum: ['mobile', 'tablet', 'desktop'] },
              orientation: { type: 'string', enum: ['portrait', 'landscape'] },
              userAgent: { type: 'string' }
            }
          }
        },
        totalConfigurations: { type: 'number' },
        breakpointMapping: {
          type: 'object',
          properties: {
            mobile: { type: 'array' },
            tablet: { type: 'array' },
            desktop: { type: 'array' }
          }
        },
        deviceEmulation: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              device: { type: 'string' },
              viewport: { type: 'string' },
              userAgent: { type: 'string' }
            }
          }
        },
        configMatrixPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-qa', 'viewport', 'responsive']
}));

// Phase 6: Baseline Screenshot Capture
export const baselineScreenshotCaptureTask = defineTask('baseline-screenshot-capture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Baseline Screenshot Capture - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Visual Testing Engineer',
      task: 'Capture baseline screenshots from design files and specifications',
      context: args,
      instructions: [
        '1. Export design files as high-fidelity images (PNG with transparency support)',
        '2. Capture page designs at all specified viewports',
        '3. Capture component designs in all variants and states',
        '4. Capture interactive states (default, hover, focus, active, disabled, error)',
        '5. Capture responsive variations at each breakpoint',
        '6. Capture dark mode variations (if applicable)',
        '7. Ensure consistent naming convention for baselines',
        '8. Organize baselines by page/component, viewport, and state',
        '9. Generate metadata for each baseline (dimensions, viewport, state)',
        '10. Verify baseline quality and completeness',
        '11. Store baselines in version-controlled repository',
        '12. Generate baseline inventory document'
      ],
      outputFormat: 'JSON object with baseline capture results'
    },
    outputSchema: {
      type: 'object',
      required: ['baselineCount', 'pageBaselines', 'componentBaselines', 'artifacts'],
      properties: {
        baselineCount: { type: 'number' },
        pageBaselines: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              page: { type: 'string' },
              viewports: { type: 'array' },
              states: { type: 'array' },
              count: { type: 'number' },
              baselinePaths: { type: 'array' }
            }
          }
        },
        componentBaselines: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              component: { type: 'string' },
              variants: { type: 'array' },
              states: { type: 'array' },
              count: { type: 'number' },
              baselinePaths: { type: 'array' }
            }
          }
        },
        baselineDetails: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              type: { type: 'string', enum: ['page', 'component'] },
              viewport: { type: 'string' },
              state: { type: 'string' },
              imagePath: { type: 'string' },
              metadata: { type: 'object' }
            }
          }
        },
        sampleBaselines: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              viewport: { type: 'string' },
              imagePath: { type: 'string' }
            }
          }
        },
        baselineInventoryPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-qa', 'baseline', 'screenshot']
}));

// Phase 7: Implementation Screenshot Capture
export const implementationScreenshotCaptureTask = defineTask('implementation-screenshot-capture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Implementation Screenshot Capture - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Automated Testing Engineer',
      task: 'Capture screenshots of live implementation for comparison with baselines',
      context: args,
      instructions: [
        '1. Navigate to implementation URL',
        '2. Capture screenshots of all specified pages at all viewports',
        '3. Capture screenshots of all components in isolation (if using Storybook/component library)',
        '4. Capture interactive states by simulating user interactions (hover, focus, etc.)',
        '5. Wait for page stability (network idle, no animations, fonts loaded)',
        '6. Disable animations and transitions for consistent captures',
        '7. Handle dynamic content (mask timestamps, random data, user-specific content)',
        '8. Capture full-page screenshots and element-specific screenshots',
        '9. Ensure screenshots match baseline dimensions',
        '10. Handle cookie banners, popups, and overlays',
        '11. Organize screenshots with matching naming convention to baselines',
        '12. Generate screenshot capture report'
      ],
      outputFormat: 'JSON object with implementation screenshot results'
    },
    outputSchema: {
      type: 'object',
      required: ['screenshotCount', 'pageScreenshots', 'componentScreenshots', 'artifacts'],
      properties: {
        screenshotCount: { type: 'number' },
        pageScreenshots: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              page: { type: 'string' },
              viewports: { type: 'array' },
              states: { type: 'array' },
              count: { type: 'number' },
              screenshotPaths: { type: 'array' }
            }
          }
        },
        componentScreenshots: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              component: { type: 'string' },
              variants: { type: 'array' },
              states: { type: 'array' },
              count: { type: 'number' },
              screenshotPaths: { type: 'array' }
            }
          }
        },
        captureIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              page: { type: 'string' },
              issue: { type: 'string' },
              resolution: { type: 'string' }
            }
          }
        },
        screenshotReportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-qa', 'screenshot', 'implementation']
}));

// Phase 8: Pixel-Perfect Comparison
export const pixelPerfectComparisonTask = defineTask('pixel-perfect-comparison', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Pixel-Perfect Comparison - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Visual Comparison Specialist',
      task: 'Perform pixel-perfect comparison between baseline designs and implementation screenshots',
      context: args,
      instructions: [
        '1. Load baseline and implementation screenshot pairs',
        '2. Perform pixel-by-pixel comparison',
        '3. Calculate pixel difference percentage',
        '4. Detect layout shifts and misalignments',
        '5. Calculate color differences using Delta-E or perceptual color distance',
        '6. Generate diff images highlighting differences (red for removed, green for added, yellow for changed)',
        '7. Categorize differences by severity (critical, moderate, minor)',
        '8. Calculate pixel-perfect score (100 = perfect match, 0 = completely different)',
        '9. Identify anti-aliasing differences vs. actual design differences',
        '10. Flag critical differences that exceed thresholds',
        '11. Generate visual comparison report with side-by-side images',
        '12. Create prioritized list of visual differences'
      ],
      outputFormat: 'JSON object with pixel-perfect comparison results'
    },
    outputSchema: {
      type: 'object',
      required: ['pixelPerfectScore', 'differences', 'criticalDifferences', 'reportPath', 'artifacts'],
      properties: {
        pixelPerfectScore: { type: 'number', minimum: 0, maximum: 100 },
        totalComparisons: { type: 'number' },
        perfectMatches: { type: 'number' },
        differences: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              page: { type: 'string' },
              component: { type: 'string' },
              viewport: { type: 'string' },
              state: { type: 'string' },
              pixelDifferencePercent: { type: 'number' },
              layoutShiftPercent: { type: 'number' },
              colorDifference: { type: 'number' },
              severity: { type: 'string', enum: ['critical', 'moderate', 'minor'] },
              description: { type: 'string' },
              baselineImage: { type: 'string' },
              implementationImage: { type: 'string' },
              diffImage: { type: 'string' }
            }
          }
        },
        criticalDifferences: { type: 'array' },
        moderateDifferences: { type: 'array' },
        minorDifferences: { type: 'array' },
        diffImages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              path: { type: 'string' },
              viewport: { type: 'string' }
            }
          }
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
  labels: ['agent', 'design-qa', 'pixel-perfect', 'comparison']
}));

// Phase 9: Typography Verification
export const typographyVerificationTask = defineTask('typography-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Typography Verification - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Typography QA Specialist',
      task: 'Verify typography implementation matches design specifications',
      context: args,
      instructions: [
        '1. Extract computed typography styles from implementation (font-family, font-size, font-weight, line-height, letter-spacing)',
        '2. Compare with design specifications from design files',
        '3. Verify font loading and font-family fallbacks',
        '4. Check font-weight usage (ensure correct weights are loaded)',
        '5. Verify font-size accuracy (allow tolerance for browser rounding)',
        '6. Check line-height values against design specs',
        '7. Verify letter-spacing (tracking) values',
        '8. Check text-transform, text-decoration usage',
        '9. Verify responsive typography (font-size changes at breakpoints)',
        '10. Identify hardcoded font values vs. design token usage',
        '11. Calculate typography compliance score',
        '12. Generate typography verification report with violations'
      ],
      outputFormat: 'JSON object with typography verification results'
    },
    outputSchema: {
      type: 'object',
      required: ['complianceScore', 'issues', 'artifacts'],
      properties: {
        complianceScore: { type: 'number', minimum: 0, maximum: 100 },
        totalElements: { type: 'number' },
        compliantElements: { type: 'number' },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              element: { type: 'string' },
              page: { type: 'string' },
              property: { type: 'string' },
              expected: { type: 'string' },
              actual: { type: 'string' },
              difference: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
            }
          }
        },
        fontLoadingIssues: { type: 'array' },
        hardcodedFonts: { type: 'array' },
        verificationReportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-qa', 'typography', 'verification']
}));

// Phase 10: Spacing and Layout Verification
export const spacingLayoutVerificationTask = defineTask('spacing-layout-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Spacing and Layout Verification - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Layout QA Specialist',
      task: 'Verify spacing, margins, padding, and layout implementation',
      context: args,
      instructions: [
        '1. Extract computed spacing values (margin, padding, gap)',
        '2. Compare with design specifications',
        '3. Verify spacing token usage vs. hardcoded values',
        '4. Check box-model consistency',
        '5. Verify grid and flexbox layout implementation',
        '6. Check responsive spacing changes at breakpoints',
        '7. Verify container widths and max-widths',
        '8. Check element positioning and alignment',
        '9. Detect layout shifts and unexpected overflows',
        '10. Verify z-index layering',
        '11. Calculate spacing compliance score',
        '12. Generate spacing verification report'
      ],
      outputFormat: 'JSON object with spacing verification results'
    },
    outputSchema: {
      type: 'object',
      required: ['complianceScore', 'issues', 'artifacts'],
      properties: {
        complianceScore: { type: 'number', minimum: 0, maximum: 100 },
        totalElements: { type: 'number' },
        compliantElements: { type: 'number' },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              element: { type: 'string' },
              page: { type: 'string' },
              property: { type: 'string' },
              expected: { type: 'string' },
              actual: { type: 'string' },
              difference: { type: 'number' },
              severity: { type: 'string' }
            }
          }
        },
        layoutShifts: { type: 'array' },
        overflowIssues: { type: 'array' },
        hardcodedSpacing: { type: 'array' },
        verificationReportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-qa', 'spacing', 'layout']
}));

// Phase 11: Color Accuracy Validation
export const colorAccuracyValidationTask = defineTask('color-accuracy-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Color Accuracy Validation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Color QA Specialist',
      task: 'Validate color accuracy and design system color token usage',
      context: args,
      instructions: [
        '1. Extract computed color values from implementation (color, background-color, border-color)',
        '2. Compare with design specification colors',
        '3. Calculate color difference using Delta-E (perceptual color distance)',
        '4. Verify design system color token usage',
        '5. Identify hardcoded color values',
        '6. Check color accessibility (contrast ratios)',
        '7. Verify semantic color usage (primary, success, error, warning)',
        '8. Check hover, focus, and active state colors',
        '9. Verify gradient implementations',
        '10. Check opacity and transparency values',
        '11. Calculate color compliance score',
        '12. Generate color validation report'
      ],
      outputFormat: 'JSON object with color validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['complianceScore', 'issues', 'artifacts'],
      properties: {
        complianceScore: { type: 'number', minimum: 0, maximum: 100 },
        totalElements: { type: 'number' },
        compliantElements: { type: 'number' },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              element: { type: 'string' },
              page: { type: 'string' },
              property: { type: 'string' },
              expected: { type: 'string' },
              actual: { type: 'string' },
              deltaE: { type: 'number' },
              severity: { type: 'string' }
            }
          }
        },
        hardcodedColors: { type: 'array' },
        contrastIssues: { type: 'array' },
        validationReportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-qa', 'color', 'validation']
}));

// Phase 12: Interactive States Testing
export const interactiveStatesTestingTask = defineTask('interactive-states-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Interactive States Testing - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Interaction QA Specialist',
      task: 'Test and validate interactive states (hover, focus, active, disabled, error)',
      context: args,
      instructions: [
        '1. Identify all interactive elements (buttons, links, inputs, cards, etc.)',
        '2. Capture default state screenshots',
        '3. Simulate hover state and capture screenshots',
        '4. Simulate focus state (keyboard navigation) and capture screenshots',
        '5. Simulate active/pressed state and capture screenshots',
        '6. Capture disabled state screenshots',
        '7. Capture error state screenshots (for form elements)',
        '8. Capture loading state screenshots',
        '9. Compare state screenshots with design specifications',
        '10. Verify state transition animations (if applicable)',
        '11. Verify focus indicators meet accessibility requirements',
        '12. Generate interactive states test report'
      ],
      outputFormat: 'JSON object with interactive states test results'
    },
    outputSchema: {
      type: 'object',
      required: ['complianceScore', 'totalTests', 'testsPassed', 'testsFailed', 'artifacts'],
      properties: {
        complianceScore: { type: 'number', minimum: 0, maximum: 100 },
        totalTests: { type: 'number' },
        testsPassed: { type: 'number' },
        testsFailed: { type: 'number' },
        testResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              component: { type: 'string' },
              state: { type: 'string' },
              passed: { type: 'boolean' },
              issues: { type: 'array' },
              screenshotPath: { type: 'string' }
            }
          }
        },
        missingStates: { type: 'array' },
        focusIndicatorIssues: { type: 'array' },
        testReportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-qa', 'interactive-states', 'testing']
}));

// Phase 13: Responsive Design Verification
export const responsiveDesignVerificationTask = defineTask('responsive-design-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 13: Responsive Design Verification - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Responsive Design QA Specialist',
      task: 'Verify responsive design implementation across all breakpoints',
      context: args,
      instructions: [
        '1. Test all pages and components at mobile viewports (320px-767px)',
        '2. Test at tablet viewports (768px-1023px)',
        '3. Test at desktop viewports (1024px+)',
        '4. Verify breakpoint transitions are smooth',
        '5. Check for horizontal scrolling issues',
        '6. Verify touch targets meet minimum size requirements (44x44px)',
        '7. Check responsive images and media queries',
        '8. Verify responsive typography scaling',
        '9. Check responsive spacing and layout reflow',
        '10. Test portrait and landscape orientations',
        '11. Verify mobile navigation patterns (hamburger menus, etc.)',
        '12. Generate responsive verification report'
      ],
      outputFormat: 'JSON object with responsive verification results'
    },
    outputSchema: {
      type: 'object',
      required: ['complianceScore', 'issues', 'artifacts'],
      properties: {
        complianceScore: { type: 'number', minimum: 0, maximum: 100 },
        viewportsTested: { type: 'number' },
        viewportsPassed: { type: 'number' },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              page: { type: 'string' },
              viewport: { type: 'string' },
              issue: { type: 'string' },
              severity: { type: 'string' },
              screenshotPath: { type: 'string' }
            }
          }
        },
        horizontalScrollIssues: { type: 'array' },
        touchTargetIssues: { type: 'array' },
        layoutBreaks: { type: 'array' },
        verificationReportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-qa', 'responsive', 'verification']
}));

// Phase 14: Cross-Browser Consistency
export const crossBrowserConsistencyTask = defineTask('cross-browser-consistency', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 14: Cross-Browser Consistency Testing - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Cross-Browser QA Specialist',
      task: 'Test visual consistency across different browsers and identify rendering differences',
      context: args,
      instructions: [
        '1. Capture screenshots in Chrome/Chromium',
        '2. Capture screenshots in Firefox',
        '3. Capture screenshots in Safari (if available)',
        '4. Capture screenshots in Edge',
        '5. Compare screenshots across browsers for each page/viewport combination',
        '6. Identify browser-specific rendering differences',
        '7. Check for CSS compatibility issues',
        '8. Verify font rendering consistency',
        '9. Check for layout differences',
        '10. Identify browser-specific bugs',
        '11. Calculate cross-browser consistency score',
        '12. Generate cross-browser comparison report'
      ],
      outputFormat: 'JSON object with cross-browser test results'
    },
    outputSchema: {
      type: 'object',
      required: ['consistencyScore', 'inconsistencies', 'criticalInconsistencies', 'reportPath', 'artifacts'],
      properties: {
        consistencyScore: { type: 'number', minimum: 0, maximum: 100 },
        browsersTested: { type: 'array', items: { type: 'string' } },
        totalComparisons: { type: 'number' },
        consistentViews: { type: 'number' },
        inconsistencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              page: { type: 'string' },
              viewport: { type: 'string' },
              browsers: { type: 'array' },
              difference: { type: 'string' },
              severity: { type: 'string' },
              screenshotPaths: { type: 'object' }
            }
          }
        },
        criticalInconsistencies: { type: 'array' },
        browserSpecificIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              browser: { type: 'string' },
              issue: { type: 'string' },
              pages: { type: 'array' }
            }
          }
        },
        comparisonImages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              browser: { type: 'string' },
              path: { type: 'string' }
            }
          }
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
  labels: ['agent', 'design-qa', 'cross-browser', 'consistency']
}));

// Phase 15: Dark Mode Verification
export const darkModeVerificationTask = defineTask('dark-mode-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 15: Dark Mode Verification - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Dark Mode QA Specialist',
      task: 'Verify dark mode implementation and color scheme accuracy',
      context: args,
      instructions: [
        '1. Enable dark mode/theme in implementation',
        '2. Capture dark mode screenshots for all pages and components',
        '3. Compare with dark mode design specifications',
        '4. Verify dark mode color token usage',
        '5. Check contrast ratios in dark mode (WCAG AA/AAA)',
        '6. Verify smooth theme switching (no flash of unstyled content)',
        '7. Check for missed elements still using light mode colors',
        '8. Verify images and media in dark mode context',
        '9. Test user preference detection (prefers-color-scheme)',
        '10. Verify dark mode state persistence',
        '11. Calculate dark mode compliance score',
        '12. Generate dark mode verification report'
      ],
      outputFormat: 'JSON object with dark mode verification results'
    },
    outputSchema: {
      type: 'object',
      required: ['complianceScore', 'issues', 'artifacts'],
      properties: {
        complianceScore: { type: 'number', minimum: 0, maximum: 100 },
        darkModeScreenshots: { type: 'number' },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              page: { type: 'string' },
              element: { type: 'string' },
              issue: { type: 'string' },
              severity: { type: 'string' },
              screenshotPath: { type: 'string' }
            }
          }
        },
        contrastIssues: { type: 'array' },
        missedElements: { type: 'array' },
        verificationReportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-qa', 'dark-mode', 'verification']
}));

// Phase 16: Visual Accessibility Validation
export const visualAccessibilityValidationTask = defineTask('visual-accessibility-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 16: Visual Accessibility Validation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Accessibility Visual QA Specialist',
      task: 'Validate visual aspects of accessibility (contrast, focus, touch targets)',
      context: args,
      instructions: [
        '1. Validate color contrast ratios (WCAG AA: 4.5:1 normal text, 3:1 large text)',
        '2. Check contrast for interactive elements (WCAG 2.2: 3:1 for UI components)',
        '3. Verify visible focus indicators on all interactive elements',
        '4. Check focus indicator contrast (WCAG 2.2: 3:1 against adjacent colors)',
        '5. Verify touch target sizes (minimum 44x44px for WCAG AA)',
        '6. Check spacing between touch targets',
        '7. Verify text resize up to 200% without loss of content',
        '8. Check reflow at 320px viewport width',
        '9. Verify no information conveyed by color alone',
        '10. Check for proper visual hierarchy',
        '11. Calculate visual accessibility score',
        '12. Generate visual accessibility report'
      ],
      outputFormat: 'JSON object with visual accessibility results'
    },
    outputSchema: {
      type: 'object',
      required: ['accessibilityScore', 'violations', 'artifacts'],
      properties: {
        accessibilityScore: { type: 'number', minimum: 0, maximum: 100 },
        wcagLevel: { type: 'string' },
        violations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['contrast', 'focus-indicator', 'touch-target', 'reflow', 'text-resize'] },
              element: { type: 'string' },
              page: { type: 'string' },
              wcagCriterion: { type: 'string' },
              severity: { type: 'string' },
              actual: { type: 'string' },
              required: { type: 'string' },
              remediation: { type: 'string' }
            }
          }
        },
        contrastViolations: { type: 'number' },
        focusIndicatorIssues: { type: 'number' },
        touchTargetIssues: { type: 'number' },
        accessibilityReportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-qa', 'accessibility', 'validation']
}));

// Phase 17: Visual Regression Analysis
export const visualRegressionAnalysisTask = defineTask('visual-regression-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 17: Visual Regression Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Visual Regression Analyst',
      task: 'Analyze and categorize visual differences (regressions vs. intentional changes vs. false positives)',
      context: args,
      instructions: [
        '1. Review all visual differences identified',
        '2. Categorize differences: true regressions, intentional changes, false positives',
        '3. Analyze regression patterns (common issues across multiple pages)',
        '4. Assess impact of each regression on user experience',
        '5. Prioritize regressions by severity and impact',
        '6. Identify root causes (CSS issues, missing assets, browser bugs, etc.)',
        '7. Group related regressions for efficient remediation',
        '8. Flag anti-aliasing and sub-pixel rendering differences as low priority',
        '9. Identify systemic issues (design system violations, etc.)',
        '10. Calculate regression impact score',
        '11. Generate regression analysis report',
        '12. Create regression remediation priority list'
      ],
      outputFormat: 'JSON object with regression analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['regressions', 'intentionalChanges', 'falsePositives', 'summary', 'artifacts'],
      properties: {
        regressions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string' },
              severity: { type: 'string' },
              impact: { type: 'string' },
              rootCause: { type: 'string' },
              affectedPages: { type: 'array' },
              remediation: { type: 'string' }
            }
          }
        },
        intentionalChanges: { type: 'array' },
        falsePositives: { type: 'array' },
        regressionPatterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string' },
              occurrences: { type: 'number' },
              affectedElements: { type: 'array' }
            }
          }
        },
        systemicIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              category: { type: 'string' },
              impact: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        summary: {
          type: 'object',
          properties: {
            totalDifferences: { type: 'number' },
            trueRegressions: { type: 'number' },
            intentionalChanges: { type: 'number' },
            falsePositives: { type: 'number' },
            criticalRegressions: { type: 'number' },
            highPriorityRegressions: { type: 'number' }
          }
        },
        analysisReportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-qa', 'regression', 'analysis']
}));

// Phase 18: Design Deviation Report
export const designDeviationReportTask = defineTask('design-deviation-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 18: Design Deviation Report - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Design QA Documentation Specialist',
      task: 'Generate comprehensive design deviation report documenting all discrepancies',
      context: args,
      instructions: [
        '1. Compile all design QA findings (pixel-perfect, typography, spacing, color, etc.)',
        '2. Organize deviations by category and severity',
        '3. Document each deviation with before/after comparisons',
        '4. Include visual evidence (screenshots, diff images)',
        '5. Provide impact assessment for each deviation',
        '6. Include recommendations for remediation',
        '7. Highlight design system violations',
        '8. Document accessibility concerns',
        '9. Create executive summary with key metrics',
        '10. Generate detailed deviation catalog',
        '11. Export report in multiple formats (HTML, PDF, Markdown)',
        '12. Include interactive elements for drill-down analysis'
      ],
      outputFormat: 'JSON object with deviation report details'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummary', 'deviationCount', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: {
          type: 'object',
          properties: {
            totalDeviations: { type: 'number' },
            criticalDeviations: { type: 'number' },
            designSystemViolations: { type: 'number' },
            accessibilityIssues: { type: 'number' },
            overallScore: { type: 'number' }
          }
        },
        deviationCount: { type: 'number' },
        deviationsByCategory: {
          type: 'object',
          properties: {
            pixelPerfect: { type: 'number' },
            typography: { type: 'number' },
            spacing: { type: 'number' },
            color: { type: 'number' },
            responsive: { type: 'number' },
            crossBrowser: { type: 'number' },
            interactiveStates: { type: 'number' },
            accessibility: { type: 'number' }
          }
        },
        deviationsBySeverity: {
          type: 'object',
          properties: {
            critical: { type: 'number' },
            high: { type: 'number' },
            medium: { type: 'number' },
            low: { type: 'number' }
          }
        },
        reportFormats: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              format: { type: 'string' },
              path: { type: 'string' }
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
  labels: ['agent', 'design-qa', 'deviation', 'report']
}));

// Phase 19: Design QA Remediation Plan
export const designQaRemediationPlanTask = defineTask('design-qa-remediation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 19: Design QA Remediation Plan - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Design QA Remediation Strategist',
      task: 'Create actionable remediation plan for design QA issues',
      context: args,
      instructions: [
        '1. Compile all design QA issues and regressions',
        '2. Prioritize issues by severity, impact, and effort',
        '3. Group related issues for efficient remediation',
        '4. Create remediation tasks with clear acceptance criteria',
        '5. Estimate effort for each task (hours/days)',
        '6. Identify quick wins (high impact, low effort)',
        '7. Organize tasks into phases (critical, high priority, nice-to-have)',
        '8. Provide implementation guidance and code examples',
        '9. Define testing and validation approach',
        '10. Calculate expected improvement in compliance score',
        '11. Create remediation roadmap with timeline',
        '12. Generate detailed remediation plan document'
      ],
      outputFormat: 'JSON object with remediation plan'
    },
    outputSchema: {
      type: 'object',
      required: ['totalTasks', 'criticalTasks', 'highPriorityTasks', 'estimatedEffort', 'quickWins', 'categories', 'planPath', 'artifacts'],
      properties: {
        totalTasks: { type: 'number' },
        criticalTasks: { type: 'number' },
        highPriorityTasks: { type: 'number' },
        estimatedEffort: { type: 'string' },
        categories: { type: 'array', items: { type: 'string' } },
        prioritizedTasks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              taskId: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              category: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              severity: { type: 'string' },
              effort: { type: 'string', enum: ['low', 'medium', 'high'] },
              impact: { type: 'string' },
              affectedPages: { type: 'array' },
              acceptanceCriteria: { type: 'array' },
              implementation: { type: 'string' },
              testing: { type: 'string' }
            }
          }
        },
        quickWins: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              task: { type: 'string' },
              impact: { type: 'string' },
              effort: { type: 'string' },
              benefit: { type: 'string' }
            }
          }
        },
        phases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'number' },
              name: { type: 'string' },
              tasks: { type: 'array' },
              estimatedDuration: { type: 'string' },
              expectedImprovementScore: { type: 'number' }
            }
          }
        },
        planPath: { type: 'string' },
        roadmapPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-qa', 'remediation', 'planning']
}));

// Phase 20: Visual Regression Test Suite
export const visualRegressionTestSuiteTask = defineTask('visual-regression-test-suite', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 20: Visual Regression Test Suite Generation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Test Automation Engineer',
      task: 'Generate automated visual regression test suite for continuous testing',
      context: args,
      instructions: [
        '1. Generate test suite configuration based on tool (Percy, Chromatic, BackstopJS, etc.)',
        '2. Create test scenarios for all pages and components',
        '3. Include viewport and browser configurations',
        '4. Set up baseline management (create, update, approve)',
        '5. Configure diff thresholds and tolerances',
        '6. Add dynamic content masking rules',
        '7. Configure wait conditions and stability checks',
        '8. Set up parallel test execution',
        '9. Configure test reporting and notifications',
        '10. Add CI/CD integration scripts',
        '11. Create test suite documentation',
        '12. Generate example test files and helper functions'
      ],
      outputFormat: 'JSON object with test suite details'
    },
    outputSchema: {
      type: 'object',
      required: ['testSuite', 'testCount', 'testSuitePath', 'artifacts'],
      properties: {
        testSuite: {
          type: 'object',
          properties: {
            tool: { type: 'string' },
            framework: { type: 'string' },
            configPath: { type: 'string' },
            testDirectory: { type: 'string' }
          }
        },
        testCount: { type: 'number' },
        testScenarios: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['page', 'component'] },
              viewports: { type: 'array' },
              browsers: { type: 'array' },
              states: { type: 'array' },
              testFilePath: { type: 'string' }
            }
          }
        },
        configFiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              file: { type: 'string' },
              path: { type: 'string' },
              purpose: { type: 'string' }
            }
          }
        },
        helperFunctions: {
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
        testSuitePath: { type: 'string' },
        documentationPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-qa', 'test-suite', 'automation']
}));

// Phase 21: CI/CD Integration Setup
export const cicdIntegrationSetupTask = defineTask('cicd-integration-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 21: CI/CD Integration Setup - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DevOps and CI/CD Specialist',
      task: 'Set up CI/CD pipeline integration for automated visual regression testing',
      context: args,
      instructions: [
        '1. Create CI/CD pipeline configuration (GitHub Actions, GitLab CI, Jenkins, etc.)',
        '2. Set up automated baseline comparison on pull requests',
        '3. Configure quality gates (fail build if critical differences found)',
        '4. Set up visual regression reports in PR comments',
        '5. Configure baseline approval workflow',
        '6. Set up notifications for regression detection',
        '7. Configure parallel test execution for faster feedback',
        '8. Set up artifact storage for screenshots and diffs',
        '9. Configure scheduled regression tests',
        '10. Add performance optimizations (caching, incremental tests)',
        '11. Set up monitoring and alerting',
        '12. Generate CI/CD integration documentation'
      ],
      outputFormat: 'JSON object with CI/CD setup details'
    },
    outputSchema: {
      type: 'object',
      required: ['pipelineStages', 'qualityGates', 'configPath', 'artifacts'],
      properties: {
        pipelineStages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stage: { type: 'string' },
              description: { type: 'string' },
              tasks: { type: 'array' },
              configSnippet: { type: 'string' }
            }
          }
        },
        qualityGates: {
          type: 'object',
          properties: {
            minPixelPerfectScore: { type: 'number' },
            maxCriticalDifferences: { type: 'number' },
            maxModerateDifferences: { type: 'number' },
            failOnRegression: { type: 'boolean' }
          }
        },
        workflows: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              workflow: { type: 'string' },
              trigger: { type: 'string' },
              configPath: { type: 'string' }
            }
          }
        },
        notifications: {
          type: 'object',
          properties: {
            slack: { type: 'boolean' },
            email: { type: 'boolean' },
            prComments: { type: 'boolean' }
          }
        },
        configPath: { type: 'string' },
        documentationPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-qa', 'cicd', 'integration']
}));

// Phase 22: Design Handoff Validation Checklist
export const designHandoffChecklistTask = defineTask('design-handoff-checklist', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 22: Design Handoff Validation Checklist - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Design Handoff Specialist',
      task: 'Generate comprehensive design handoff validation checklist',
      context: args,
      instructions: [
        '1. Create checklist for pixel-perfect implementation',
        '2. Add design system compliance checklist items',
        '3. Include typography verification checklist',
        '4. Add spacing and layout verification items',
        '5. Include color accuracy checklist',
        '6. Add responsive design verification items',
        '7. Include cross-browser consistency checklist',
        '8. Add interactive states validation items',
        '9. Include dark mode checklist (if applicable)',
        '10. Add accessibility validation items',
        '11. Include asset delivery checklist',
        '12. Generate checklist document with pass/fail status'
      ],
      outputFormat: 'JSON object with handoff checklist'
    },
    outputSchema: {
      type: 'object',
      required: ['checklistPath', 'totalItems', 'passedItems', 'artifacts'],
      properties: {
        checklistPath: { type: 'string' },
        totalItems: { type: 'number' },
        passedItems: { type: 'number' },
        failedItems: { type: 'number' },
        completionPercentage: { type: 'number' },
        checklistCategories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    item: { type: 'string' },
                    status: { type: 'string', enum: ['passed', 'failed', 'pending', 'n/a'] },
                    notes: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        criticalIssues: { type: 'array' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-qa', 'handoff', 'checklist']
}));

// Phase 23: Comprehensive Design QA Report
export const comprehensiveDesignQaReportTask = defineTask('comprehensive-design-qa-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 23: Comprehensive Design QA Report - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Design QA Documentation Specialist',
      task: 'Generate comprehensive design QA report with all findings and recommendations',
      context: args,
      instructions: [
        '1. Create executive summary with key metrics and scores',
        '2. Compile all test results (pixel-perfect, typography, spacing, color, etc.)',
        '3. Document design system compliance assessment',
        '4. Include responsive design verification results',
        '5. Present cross-browser consistency findings',
        '6. Document interactive states test results',
        '7. Include dark mode verification (if applicable)',
        '8. Present accessibility validation results',
        '9. Document visual regression analysis',
        '10. Include remediation plan summary',
        '11. Add design handoff checklist',
        '12. Generate report in multiple formats (HTML with interactive charts, PDF, Markdown)',
        '13. Include visual evidence (screenshots, diff images, comparison sliders)',
        '14. Add recommendations and next steps'
      ],
      outputFormat: 'JSON object with comprehensive report details'
    },
    outputSchema: {
      type: 'object',
      required: ['mainReportPath', 'executiveSummaryPath', 'artifacts'],
      properties: {
        mainReportPath: { type: 'string' },
        executiveSummaryPath: { type: 'string' },
        reportSections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              section: { type: 'string' },
              path: { type: 'string' },
              format: { type: 'string' }
            }
          }
        },
        keyMetrics: {
          type: 'object',
          properties: {
            overallScore: { type: 'number' },
            pixelPerfectScore: { type: 'number' },
            designSystemCompliance: { type: 'number' },
            accessibilityScore: { type: 'number' },
            totalIssues: { type: 'number' },
            criticalIssues: { type: 'number' }
          }
        },
        visualizations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              title: { type: 'string' },
              path: { type: 'string' }
            }
          }
        },
        reportFormats: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              format: { type: 'string' },
              path: { type: 'string' }
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
  labels: ['agent', 'design-qa', 'report', 'documentation']
}));

// Phase 24: Final Design QA Assessment
export const finalDesignQaAssessmentTask = defineTask('final-design-qa-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 24: Final Design QA Assessment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Principal Design QA Consultant',
      task: 'Conduct final comprehensive design QA assessment and provide verdict',
      context: args,
      instructions: [
        '1. Review all design QA scores (pixel-perfect, design system, typography, spacing, color, responsive, cross-browser)',
        '2. Calculate overall compliance score based on weighted criteria',
        '3. Assess severity and impact of remaining issues',
        '4. Evaluate production readiness',
        '5. Review remediation plan feasibility',
        '6. Assess design system compliance maturity',
        '7. Identify design QA strengths and positive aspects',
        '8. Document critical concerns and blockers',
        '9. Provide clear verdict (production-ready, ready-with-plan, needs-remediation)',
        '10. Make recommendation (approve, conditional-approve, remediate-first)',
        '11. Define next steps and follow-up actions',
        '12. Generate final assessment report'
      ],
      outputFormat: 'JSON object with final assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['overallComplianceScore', 'productionReady', 'verdict', 'recommendation', 'strengths', 'concerns', 'nextSteps', 'reportPath', 'artifacts'],
      properties: {
        overallComplianceScore: { type: 'number', minimum: 0, maximum: 100 },
        productionReady: { type: 'boolean' },
        verdict: { type: 'string' },
        recommendation: { type: 'string', enum: ['approve-deployment', 'approve-with-plan', 'conditional-approve', 'remediate-critical-first', 'major-remediation-required'] },
        readinessLevel: { type: 'string', enum: ['production-ready', 'ready-with-plan', 'needs-minor-fixes', 'needs-remediation', 'significant-issues'] },
        strengths: {
          type: 'array',
          items: { type: 'string' }
        },
        concerns: {
          type: 'array',
          items: { type: 'string' }
        },
        criticalConcerns: {
          type: 'array',
          items: { type: 'string' }
        },
        riskAssessment: {
          type: 'object',
          properties: {
            brandRisk: { type: 'string', enum: ['low', 'medium', 'high'] },
            userExperienceRisk: { type: 'string', enum: ['low', 'medium', 'high'] },
            accessibilityRisk: { type: 'string', enum: ['low', 'medium', 'high'] },
            crossBrowserRisk: { type: 'string', enum: ['low', 'medium', 'high'] }
          }
        },
        scoreBreakdown: {
          type: 'object',
          properties: {
            pixelPerfect: { type: 'number' },
            designSystem: { type: 'number' },
            typography: { type: 'number' },
            spacing: { type: 'number' },
            color: { type: 'number' },
            responsive: { type: 'number' },
            crossBrowser: { type: 'number' },
            interactiveStates: { type: 'number' },
            darkMode: { type: 'number' },
            accessibility: { type: 'number' }
          }
        },
        nextSteps: {
          type: 'array',
          items: { type: 'string' }
        },
        followUpTimeline: { type: 'string' },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-qa', 'assessment', 'verdict']
}));
