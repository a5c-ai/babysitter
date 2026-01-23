/**
 * @process specializations/qa-testing-automation/visual-regression
 * @description Visual Regression Testing Setup - Comprehensive visual regression testing framework implementing
 * baseline capture, visual comparison, threshold configuration, responsive testing, and automated visual quality gates
 * with Percy, BackstopJS, or Playwright visual testing capabilities.
 * @inputs { projectName: string, applicationUrl: string, pages?: array, components?: array, framework?: string, tool?: string, viewports?: array, baselineStrategy?: string }
 * @outputs { success: boolean, baselinesCaptured: number, comparisonResults: object, visualTests: array, cicdIntegration: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/qa-testing-automation/visual-regression', {
 *   projectName: 'E-Commerce Platform',
 *   applicationUrl: 'https://staging.example.com',
 *   pages: ['/home', '/products', '/cart', '/checkout'],
 *   components: ['navigation', 'product-card', 'checkout-form'],
 *   framework: 'playwright',
 *   tool: 'percy',
 *   viewports: ['mobile', 'tablet', 'desktop'],
 *   baselineStrategy: 'branch',
 *   thresholds: { pixelDiff: 0.1, layoutShift: 0.05 },
 *   maskDynamicContent: true
 * });
 *
 * @references
 * - Percy: https://percy.io/
 * - BackstopJS: https://github.com/garris/BackstopJS
 * - Playwright Visual Testing: https://playwright.dev/docs/test-snapshots
 * - Cypress Visual Testing: https://docs.cypress.io/guides/tooling/visual-testing
 * - Applitools Eyes: https://applitools.com/
 * - Chromatic: https://www.chromatic.com/
 * - Visual Regression Testing Best Practices: https://testingjavascript.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    applicationUrl,
    pages = [],
    components = [],
    framework = 'playwright',
    tool = 'percy', // 'percy', 'backstop', 'playwright', 'applitools', 'chromatic'
    viewports = ['mobile', 'tablet', 'desktop'],
    baselineStrategy = 'branch', // 'branch', 'main', 'manual'
    thresholds = {
      pixelDiff: 0.1, // 0.1% pixel difference tolerance
      layoutShift: 0.05 // 5% layout shift tolerance
    },
    maskDynamicContent = true,
    animationHandling = 'disable', // 'disable', 'wait', 'skip'
    crossBrowserTesting = false,
    browsers = ['chromium'],
    outputDir = 'visual-regression-output',
    captureFullPage = true,
    cicdIntegration = true,
    acceptanceCriteria = {
      maxVisualDifferences: 5,
      criticalDifferenceThreshold: 1.0,
      autoApproveMinorChanges: false
    }
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const visualTests = [];
  let baselinesCaptured = 0;
  let comparisonResults = {};

  ctx.log('info', `Starting Visual Regression Testing Setup: ${projectName}`);
  ctx.log('info', `Tool: ${tool}, Framework: ${framework}, Viewports: ${viewports.join(', ')}`);
  ctx.log('info', `Pages: ${pages.length}, Components: ${components.length}`);

  // ============================================================================
  // PHASE 1: VISUAL REGRESSION STRATEGY PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 1: Planning visual regression testing strategy');

  const strategyPlanning = await ctx.task(visualRegressionStrategyTask, {
    projectName,
    applicationUrl,
    pages,
    components,
    framework,
    tool,
    viewports,
    baselineStrategy,
    thresholds,
    crossBrowserTesting,
    browsers,
    outputDir
  });

  if (!strategyPlanning.success) {
    return {
      success: false,
      error: 'Visual regression strategy planning failed',
      details: strategyPlanning,
      metadata: {
        processId: 'specializations/qa-testing-automation/visual-regression',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...strategyPlanning.artifacts);

  // Quality Gate: Strategy review
  await ctx.breakpoint({
    question: `Visual regression strategy planned. Tool: ${tool}, ${strategyPlanning.totalScenarios} test scenarios identified across ${viewports.length} viewport(s). Baseline strategy: ${baselineStrategy}. Review and approve strategy?`,
    title: 'Visual Regression Strategy Review',
    context: {
      runId: ctx.runId,
      strategy: {
        tool,
        framework,
        totalScenarios: strategyPlanning.totalScenarios,
        viewports,
        baselineStrategy,
        estimatedBaselines: strategyPlanning.estimatedBaselines
      },
      testCoverage: strategyPlanning.testCoverage,
      files: strategyPlanning.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 2: TOOL SETUP AND CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Setting up visual regression testing tools');

  const toolSetup = await ctx.task(visualRegressionToolSetupTask, {
    projectName,
    tool,
    framework,
    viewports,
    thresholds,
    maskDynamicContent,
    animationHandling,
    crossBrowserTesting,
    browsers,
    captureFullPage,
    outputDir
  });

  if (!toolSetup.success) {
    return {
      success: false,
      error: 'Visual regression tool setup failed',
      details: toolSetup,
      metadata: {
        processId: 'specializations/qa-testing-automation/visual-regression',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...toolSetup.artifacts);

  ctx.log('info', `Tool setup complete: ${toolSetup.toolsInstalled.join(', ')}`);

  // ============================================================================
  // PHASE 3: VIEWPORT AND RESPONSIVE CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Configuring viewports and responsive breakpoints');

  const viewportConfig = await ctx.task(viewportConfigurationTask, {
    projectName,
    viewports,
    customViewports: inputs.customViewports || [],
    deviceEmulation: inputs.deviceEmulation || {},
    tool: toolSetup.toolConfig,
    outputDir
  });

  artifacts.push(...viewportConfig.artifacts);

  ctx.log('info', `Configured ${viewportConfig.viewports.length} viewport(s) for testing`);

  // ============================================================================
  // PHASE 4: DYNAMIC CONTENT MASKING STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 4: Implementing dynamic content masking');

  const maskingStrategy = await ctx.task(dynamicContentMaskingTask, {
    projectName,
    pages,
    components,
    maskDynamicContent,
    animationHandling,
    tool: toolSetup.toolConfig,
    outputDir
  });

  artifacts.push(...maskingStrategy.artifacts);

  // ============================================================================
  // PHASE 5: BASELINE CAPTURE
  // ============================================================================

  ctx.log('info', 'Phase 5: Capturing visual baselines');

  const baselineResults = [];

  // Capture page baselines
  for (const page of pages) {
    ctx.log('info', `Capturing baselines for page: ${page}`);

    const pageBaseline = await ctx.task(capturePageBaselinesTask, {
      projectName,
      page,
      applicationUrl,
      viewports: viewportConfig.viewports,
      maskingStrategy: maskingStrategy.maskingRules,
      tool: toolSetup.toolConfig,
      captureFullPage,
      outputDir
    });

    baselineResults.push({
      page,
      result: pageBaseline,
      baselinesCount: pageBaseline.baselinesCaptured
    });

    baselinesCaptured += pageBaseline.baselinesCaptured;
    artifacts.push(...pageBaseline.artifacts);

    ctx.log('info', `Page ${page}: ${pageBaseline.baselinesCaptured} baseline(s) captured`);
  }

  // Capture component baselines if specified
  const componentBaselineResults = [];
  if (components.length > 0) {
    ctx.log('info', 'Capturing component baselines');

    for (const component of components) {
      ctx.log('info', `Capturing baselines for component: ${component}`);

      const componentBaseline = await ctx.task(captureComponentBaselinesTask, {
        projectName,
        component,
        viewports: viewportConfig.viewports,
        tool: toolSetup.toolConfig,
        outputDir
      });

      componentBaselineResults.push({
        component,
        result: componentBaseline,
        baselinesCount: componentBaseline.baselinesCaptured
      });

      baselinesCaptured += componentBaseline.baselinesCaptured;
      artifacts.push(...componentBaseline.artifacts);
    }
  }

  ctx.log('info', `Total baselines captured: ${baselinesCaptured}`);

  // Quality Gate: Baseline review
  await ctx.breakpoint({
    question: `Baseline capture complete. ${baselinesCaptured} baseline images captured across ${pages.length} page(s) and ${components.length} component(s). Review baselines and approve to proceed with visual tests?`,
    title: 'Baseline Capture Review',
    context: {
      runId: ctx.runId,
      baselines: {
        total: baselinesCaptured,
        pages: baselineResults.length,
        components: componentBaselineResults.length,
        viewportsPerTest: viewportConfig.viewports.length
      },
      baselineLocations: [...baselineResults, ...componentBaselineResults].map(b => ({
        name: b.page || b.component,
        count: b.baselinesCount,
        path: b.result.baselinePath
      })),
      files: baselineResults
        .slice(0, 5)
        .map(b => ({ path: b.result.sampleImagePath, format: 'image', label: `Baseline: ${b.page}` }))
    }
  });

  // ============================================================================
  // PHASE 6: VISUAL TEST IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Implementing visual regression tests');

  const testImplementation = await ctx.task(visualTestImplementationTask, {
    projectName,
    pages,
    components,
    viewports: viewportConfig.viewports,
    baselineResults,
    componentBaselineResults,
    tool: toolSetup.toolConfig,
    maskingStrategy: maskingStrategy.maskingRules,
    framework,
    outputDir
  });

  visualTests.push(...testImplementation.visualTests);
  artifacts.push(...testImplementation.artifacts);

  ctx.log('info', `${testImplementation.testCount} visual regression test(s) implemented`);

  // ============================================================================
  // PHASE 7: THRESHOLD AND TOLERANCE CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Configuring thresholds and tolerance levels');

  const thresholdConfig = await ctx.task(thresholdConfigurationTask, {
    projectName,
    thresholds,
    acceptanceCriteria,
    tool: toolSetup.toolConfig,
    visualTests: testImplementation.visualTests,
    outputDir
  });

  artifacts.push(...thresholdConfig.artifacts);

  // ============================================================================
  // PHASE 8: INITIAL VISUAL COMPARISON RUN
  // ============================================================================

  ctx.log('info', 'Phase 8: Running initial visual comparison tests');

  const initialComparison = await ctx.task(visualComparisonTask, {
    projectName,
    applicationUrl,
    visualTests: testImplementation.visualTests,
    thresholdConfig: thresholdConfig.configuration,
    tool: toolSetup.toolConfig,
    runType: 'initial',
    outputDir
  });

  comparisonResults = initialComparison;
  artifacts.push(...initialComparison.artifacts);

  const totalDifferences = initialComparison.differencesFound;
  const criticalDifferences = initialComparison.criticalDifferences;

  ctx.log('info', `Initial comparison: ${totalDifferences} difference(s) found, ${criticalDifferences} critical`);

  // Quality Gate: Initial comparison results
  if (totalDifferences > 0) {
    await ctx.breakpoint({
      question: `Initial visual comparison found ${totalDifferences} difference(s), including ${criticalDifferences} critical difference(s). This is expected for first run. Review differences and approve to continue?`,
      title: 'Initial Visual Comparison Results',
      context: {
        runId: ctx.runId,
        comparison: {
          totalTests: initialComparison.totalTests,
          passed: initialComparison.passed,
          failed: initialComparison.failed,
          differences: totalDifferences,
          criticalDifferences
        },
        topDifferences: initialComparison.topDifferences.slice(0, 10),
        files: [
          { path: initialComparison.reportPath, format: 'html', label: 'Visual Comparison Report' },
          ...initialComparison.diffImages.slice(0, 5).map(img => ({ path: img, format: 'image', label: 'Diff' }))
        ]
      }
    });
  }

  // ============================================================================
  // PHASE 9: DIFFERENCE ANALYSIS AND CATEGORIZATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Analyzing and categorizing visual differences');

  const differenceAnalysis = await ctx.task(visualDifferenceAnalysisTask, {
    projectName,
    comparisonResults: initialComparison,
    thresholds,
    acceptanceCriteria,
    outputDir
  });

  artifacts.push(...differenceAnalysis.artifacts);

  const intentionalChanges = differenceAnalysis.intentionalChanges;
  const regressions = differenceAnalysis.regressions;
  const falsePositives = differenceAnalysis.falsePositives;

  ctx.log('info', `Analysis: ${intentionalChanges.length} intentional, ${regressions.length} regressions, ${falsePositives.length} false positives`);

  // ============================================================================
  // PHASE 10: BASELINE UPDATE STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 10: Implementing baseline update strategy');

  const baselineUpdateStrategy = await ctx.task(baselineUpdateStrategyTask, {
    projectName,
    differenceAnalysis,
    baselineStrategy,
    acceptanceCriteria,
    tool: toolSetup.toolConfig,
    outputDir
  });

  artifacts.push(...baselineUpdateStrategy.artifacts);

  // Quality Gate: Baseline update approval
  if (baselineUpdateStrategy.updatesRequired.length > 0) {
    await ctx.breakpoint({
      question: `${baselineUpdateStrategy.updatesRequired.length} baseline(s) require update based on intentional changes. Review updates and approve baseline refresh?`,
      title: 'Baseline Update Approval',
      context: {
        runId: ctx.runId,
        updates: {
          count: baselineUpdateStrategy.updatesRequired.length,
          intentionalChanges: intentionalChanges.length,
          affectedTests: baselineUpdateStrategy.affectedTests
        },
        updatesRequired: baselineUpdateStrategy.updatesRequired,
        files: [
          { path: baselineUpdateStrategy.updatePlanPath, format: 'markdown', label: 'Update Plan' }
        ]
      }
    });
  }

  // ============================================================================
  // PHASE 11: REGRESSION REMEDIATION
  // ============================================================================

  let remediationResults = null;
  if (regressions.length > 0) {
    ctx.log('info', 'Phase 11: Creating regression remediation plan');

    remediationResults = await ctx.task(visualRegressionRemediationTask, {
      projectName,
      regressions,
      differenceAnalysis,
      outputDir
    });

    artifacts.push(...remediationResults.artifacts);

    // Quality Gate: Regression review
    await ctx.breakpoint({
      question: `${regressions.length} visual regression(s) detected. Review regressions and remediation plan. Approve to continue or halt for fixes?`,
      title: 'Visual Regression Detected',
      context: {
        runId: ctx.runId,
        regressions: {
          count: regressions.length,
          critical: regressions.filter(r => r.severity === 'critical').length,
          high: regressions.filter(r => r.severity === 'high').length
        },
        topRegressions: regressions.slice(0, 10),
        remediationPlan: remediationResults.remediationTasks,
        files: [
          { path: remediationResults.reportPath, format: 'markdown', label: 'Regression Report' },
          ...regressions.slice(0, 3).map(r => ({ path: r.diffImagePath, format: 'image', label: `Regression: ${r.testName}` }))
        ]
      }
    });
  }

  // ============================================================================
  // PHASE 12: FALSE POSITIVE ELIMINATION
  // ============================================================================

  ctx.log('info', 'Phase 12: Eliminating false positives');

  const falsePositiveElimination = await ctx.task(falsePositiveEliminationTask, {
    projectName,
    falsePositives,
    thresholdConfig: thresholdConfig.configuration,
    maskingStrategy: maskingStrategy.maskingRules,
    tool: toolSetup.toolConfig,
    outputDir
  });

  artifacts.push(...falsePositiveElimination.artifacts);

  ctx.log('info', `${falsePositiveElimination.eliminatedCount} false positive(s) eliminated`);

  // ============================================================================
  // PHASE 13: CROSS-BROWSER VISUAL TESTING
  // ============================================================================

  let crossBrowserResults = null;
  if (crossBrowserTesting) {
    ctx.log('info', 'Phase 13: Running cross-browser visual tests');

    crossBrowserResults = await ctx.task(crossBrowserVisualTestTask, {
      projectName,
      applicationUrl,
      visualTests: testImplementation.visualTests,
      browsers,
      viewports: viewportConfig.viewports,
      tool: toolSetup.toolConfig,
      outputDir
    });

    artifacts.push(...crossBrowserResults.artifacts);

    ctx.log('info', `Cross-browser testing: ${crossBrowserResults.browserTestsRun} test(s) across ${browsers.length} browser(s)`);
  }

  // ============================================================================
  // PHASE 14: VISUAL TEST OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 14: Optimizing visual tests for performance');

  const testOptimization = await ctx.task(visualTestOptimizationTask, {
    projectName,
    visualTests: testImplementation.visualTests,
    comparisonResults: initialComparison,
    tool: toolSetup.toolConfig,
    outputDir
  });

  artifacts.push(...testOptimization.artifacts);

  ctx.log('info', `Test optimization: ${testOptimization.speedupFactor}x faster execution`);

  // ============================================================================
  // PHASE 15: REPORTING AND REVIEW WORKFLOW
  // ============================================================================

  ctx.log('info', 'Phase 15: Setting up reporting and review workflow');

  const reportingSetup = await ctx.task(visualRegressionReportingTask, {
    projectName,
    comparisonResults: initialComparison,
    differenceAnalysis,
    baselineUpdateStrategy,
    remediationResults,
    crossBrowserResults,
    testOptimization,
    tool: toolSetup.toolConfig,
    outputDir
  });

  artifacts.push(...reportingSetup.artifacts);

  // ============================================================================
  // PHASE 16: CI/CD PIPELINE INTEGRATION
  // ============================================================================

  let cicdIntegrationResult = null;
  if (cicdIntegration) {
    ctx.log('info', 'Phase 16: Integrating with CI/CD pipeline');

    cicdIntegrationResult = await ctx.task(visualRegressionCICDTask, {
      projectName,
      tool: toolSetup.toolConfig,
      baselineStrategy,
      thresholdConfig: thresholdConfig.configuration,
      acceptanceCriteria,
      visualTests: testImplementation.visualTests,
      outputDir
    });

    artifacts.push(...cicdIntegrationResult.artifacts);

    ctx.log('info', 'CI/CD integration configured');
  }

  // ============================================================================
  // PHASE 17: VISUAL TESTING DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 17: Generating visual testing documentation');

  const documentation = await ctx.task(visualRegressionDocumentationTask, {
    projectName,
    tool,
    framework,
    strategyPlanning,
    toolSetup,
    viewportConfig,
    maskingStrategy,
    thresholdConfig,
    baselineUpdateStrategy,
    testImplementation,
    reportingSetup,
    cicdIntegrationResult,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // ============================================================================
  // PHASE 18: FINAL VALIDATION AND APPROVAL
  // ============================================================================

  ctx.log('info', 'Phase 18: Conducting final validation');

  const finalValidation = await ctx.task(visualRegressionValidationTask, {
    projectName,
    baselinesCaptured,
    visualTests: testImplementation.visualTests,
    comparisonResults: initialComparison,
    differenceAnalysis,
    regressions,
    acceptanceCriteria,
    cicdIntegrationResult,
    outputDir
  });

  artifacts.push(...finalValidation.artifacts);

  const validationScore = finalValidation.validationScore;
  const productionReady = finalValidation.productionReady;

  // Final Breakpoint: Visual regression setup approval
  await ctx.breakpoint({
    question: `Visual Regression Testing Setup Complete! Validation score: ${validationScore}/100. ${baselinesCaptured} baselines, ${visualTests.length} tests, ${regressions.length} regressions. Production ready: ${productionReady}. Approve for deployment?`,
    title: 'Visual Regression Setup Complete',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        tool,
        framework,
        baselinesCaptured,
        totalTests: visualTests.length,
        viewports: viewports.length,
        pages: pages.length,
        components: components.length,
        validationScore,
        productionReady
      },
      results: {
        totalDifferences,
        intentionalChanges: intentionalChanges.length,
        regressions: regressions.length,
        falsePositives: falsePositives.length,
        eliminatedFalsePositives: falsePositiveElimination.eliminatedCount
      },
      cicdIntegration: cicdIntegrationResult?.configured || false,
      crossBrowserTesting: crossBrowserResults?.browserTestsRun || 0,
      verdict: finalValidation.verdict,
      recommendation: finalValidation.recommendation,
      files: [
        { path: reportingSetup.mainReportPath, format: 'html', label: 'Visual Regression Report' },
        { path: documentation.setupGuidePath, format: 'markdown', label: 'Setup Guide' },
        { path: finalValidation.reportPath, format: 'markdown', label: 'Validation Report' },
        ...(differenceAnalysis.diffSummaryPath ? [{ path: differenceAnalysis.diffSummaryPath, format: 'html', label: 'Difference Summary' }] : [])
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: productionReady,
    projectName,
    tool,
    framework,
    baselinesCaptured,
    comparisonResults: {
      totalTests: initialComparison.totalTests,
      passed: initialComparison.passed,
      failed: initialComparison.failed,
      differences: totalDifferences,
      criticalDifferences,
      reportPath: initialComparison.reportPath
    },
    visualTests: visualTests.map(vt => ({
      name: vt.name,
      page: vt.page,
      component: vt.component,
      viewports: vt.viewports,
      status: vt.status
    })),
    differenceAnalysis: {
      intentionalChanges: intentionalChanges.length,
      regressions: regressions.length,
      falsePositives: falsePositives.length,
      eliminatedFalsePositives: falsePositiveElimination.eliminatedCount
    },
    baselineUpdates: {
      required: baselineUpdateStrategy.updatesRequired.length,
      strategy: baselineStrategy
    },
    remediation: remediationResults ? {
      regressionsFound: regressions.length,
      tasksCreated: remediationResults.remediationTasks.length,
      estimatedEffort: remediationResults.estimatedEffort
    } : null,
    crossBrowserTesting: crossBrowserResults ? {
      enabled: true,
      browsers: browsers.length,
      testsRun: crossBrowserResults.browserTestsRun,
      differences: crossBrowserResults.crossBrowserDifferences
    } : null,
    optimization: {
      speedupFactor: testOptimization.speedupFactor,
      executionTime: testOptimization.optimizedExecutionTime
    },
    cicdIntegration: cicdIntegrationResult ? {
      configured: cicdIntegrationResult.configured,
      pipelinePath: cicdIntegrationResult.pipelineConfigPath,
      qualityGatesEnabled: cicdIntegrationResult.qualityGatesEnabled
    } : null,
    validation: {
      score: validationScore,
      productionReady,
      verdict: finalValidation.verdict,
      recommendation: finalValidation.recommendation
    },
    artifacts,
    documentation: {
      setupGuide: documentation.setupGuidePath,
      usageGuide: documentation.usageGuidePath,
      troubleshooting: documentation.troubleshootingPath
    },
    duration,
    metadata: {
      processId: 'specializations/qa-testing-automation/visual-regression',
      timestamp: startTime,
      tool,
      framework,
      viewports: viewports.length,
      baselineStrategy
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: Visual Regression Strategy Planning
export const visualRegressionStrategyTask = defineTask('visual-regression-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Visual Regression Strategy - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Visual Testing Architect',
      task: 'Plan comprehensive visual regression testing strategy',
      context: {
        projectName: args.projectName,
        applicationUrl: args.applicationUrl,
        pages: args.pages,
        components: args.components,
        framework: args.framework,
        tool: args.tool,
        viewports: args.viewports,
        baselineStrategy: args.baselineStrategy,
        thresholds: args.thresholds,
        crossBrowserTesting: args.crossBrowserTesting,
        browsers: args.browsers,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze pages and components to identify visual testing scenarios',
        '2. Determine critical visual elements requiring regression coverage',
        '3. Plan viewport testing strategy across device breakpoints',
        '4. Design baseline capture and management strategy',
        '5. Define test coverage: which pages/components at which viewports',
        '6. Identify dynamic content requiring masking or special handling',
        '7. Plan for animations, transitions, and interactive states',
        '8. Determine cross-browser testing requirements',
        '9. Define threshold and tolerance levels for acceptable differences',
        '10. Create test scenario matrix (page × viewport × browser)',
        '11. Estimate baseline count and storage requirements',
        '12. Document strategy with rationale and best practices'
      ],
      outputFormat: 'JSON object with strategy plan'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'totalScenarios', 'estimatedBaselines', 'testCoverage', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        totalScenarios: { type: 'number', description: 'Total test scenarios planned' },
        estimatedBaselines: { type: 'number', description: 'Total baseline images to capture' },
        testCoverage: {
          type: 'object',
          properties: {
            pages: { type: 'array' },
            components: { type: 'array' },
            viewports: { type: 'array' },
            browsers: { type: 'array' },
            totalCombinations: { type: 'number' }
          }
        },
        criticalVisualElements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              element: { type: 'string' },
              importance: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              testingStrategy: { type: 'string' }
            }
          }
        },
        dynamicContentAreas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              area: { type: 'string' },
              handlingStrategy: { type: 'string' }
            }
          }
        },
        storageEstimate: { type: 'string', description: 'Estimated storage for baselines' },
        strategyDocumentPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'visual-regression', 'strategy', 'planning']
}));

// Phase 2: Visual Regression Tool Setup
export const visualRegressionToolSetupTask = defineTask('visual-regression-tool-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Tool Setup - ${args.tool} - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Visual Testing Engineer',
      task: 'Set up and configure visual regression testing tools',
      context: {
        projectName: args.projectName,
        tool: args.tool,
        framework: args.framework,
        viewports: args.viewports,
        thresholds: args.thresholds,
        maskDynamicContent: args.maskDynamicContent,
        animationHandling: args.animationHandling,
        crossBrowserTesting: args.crossBrowserTesting,
        browsers: args.browsers,
        captureFullPage: args.captureFullPage,
        outputDir: args.outputDir
      },
      instructions: [
        `1. Install ${args.tool} visual regression testing tool`,
        `2. Install ${args.framework} integration for ${args.tool}`,
        '3. Configure viewport sizes and device emulation',
        '4. Set up baseline storage directory structure',
        '5. Configure image comparison engine and algorithms',
        '6. Set pixel difference thresholds',
        '7. Configure screenshot capture settings (full page, element, viewport)',
        '8. Set up animation and transition handling',
        '9. Configure masking utilities for dynamic content',
        '10. Set up cross-browser testing if required',
        '11. Create configuration files (backstop.json, percy.yml, etc.)',
        '12. Implement helper utilities and wrappers',
        '13. Verify tool installation with sample test'
      ],
      outputFormat: 'JSON object with tool setup details'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'toolsInstalled', 'toolConfig', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        toolsInstalled: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of installed tools and dependencies'
        },
        toolConfig: {
          type: 'object',
          properties: {
            tool: { type: 'string' },
            framework: { type: 'string' },
            configFilePath: { type: 'string' },
            baselineDir: { type: 'string' },
            comparisonDir: { type: 'string' },
            reportDir: { type: 'string' }
          }
        },
        thresholdConfig: {
          type: 'object',
          properties: {
            pixelDiff: { type: 'number' },
            layoutShift: { type: 'number' },
            misMatchTolerance: { type: 'number' }
          }
        },
        captureSettings: {
          type: 'object',
          properties: {
            fullPage: { type: 'boolean' },
            waitForFonts: { type: 'boolean' },
            waitForImages: { type: 'boolean' },
            disableAnimations: { type: 'boolean' }
          }
        },
        helperUtilitiesPath: { type: 'string' },
        sampleTestPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'visual-regression', 'tool-setup', 'configuration']
}));

// Phase 3: Viewport Configuration
export const viewportConfigurationTask = defineTask('viewport-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Viewport Configuration - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Responsive Testing Specialist',
      task: 'Configure viewports and responsive breakpoints for visual testing',
      context: {
        projectName: args.projectName,
        viewports: args.viewports,
        customViewports: args.customViewports,
        deviceEmulation: args.deviceEmulation,
        tool: args.tool,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define standard viewport configurations (mobile, tablet, desktop)',
        '2. Add custom viewport configurations if specified',
        '3. Configure device-specific settings (retina, pixel ratio)',
        '4. Set up orientation testing (portrait/landscape)',
        '5. Configure user agent strings for device emulation',
        '6. Define viewport labels and naming conventions',
        '7. Create viewport utility functions',
        '8. Document viewport strategy',
        '9. Verify viewport configurations',
        '10. Generate viewport configuration file'
      ],
      outputFormat: 'JSON object with viewport configurations'
    },
    outputSchema: {
      type: 'object',
      required: ['viewports', 'artifacts'],
      properties: {
        viewports: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              width: { type: 'number' },
              height: { type: 'number' },
              deviceScaleFactor: { type: 'number' },
              isMobile: { type: 'boolean' },
              hasTouch: { type: 'boolean' },
              orientation: { type: 'string' }
            }
          }
        },
        totalViewports: { type: 'number' },
        deviceCategories: {
          type: 'object',
          properties: {
            mobile: { type: 'number' },
            tablet: { type: 'number' },
            desktop: { type: 'number' }
          }
        },
        configurationPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'visual-regression', 'viewport', 'responsive']
}));

// Phase 4: Dynamic Content Masking
export const dynamicContentMaskingTask = defineTask('dynamic-content-masking', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Dynamic Content Masking - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Visual Testing Engineer',
      task: 'Implement masking strategy for dynamic and time-sensitive content',
      context: {
        projectName: args.projectName,
        pages: args.pages,
        components: args.components,
        maskDynamicContent: args.maskDynamicContent,
        animationHandling: args.animationHandling,
        tool: args.tool,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify dynamic content areas (timestamps, user-specific data, counters)',
        '2. Identify animated elements requiring special handling',
        '3. Create masking rules for each dynamic content type',
        '4. Define CSS selectors for elements to mask',
        '5. Implement animation disabling or stabilization',
        '6. Handle loading states and async content',
        '7. Mask ads, analytics, and third-party widgets',
        '8. Configure wait conditions for dynamic content',
        '9. Create masking utility functions',
        '10. Document masking strategy and rationale',
        '11. Test masking effectiveness'
      ],
      outputFormat: 'JSON object with masking configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['maskingRules', 'artifacts'],
      properties: {
        maskingRules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              selector: { type: 'string' },
              maskType: { type: 'string', enum: ['hide', 'blur', 'overlay', 'placeholder'] },
              reason: { type: 'string' },
              appliesTo: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        animationHandling: {
          type: 'object',
          properties: {
            strategy: { type: 'string' },
            selectors: { type: 'array', items: { type: 'string' } },
            cssInjection: { type: 'string' }
          }
        },
        waitConditions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              selector: { type: 'string' },
              timeout: { type: 'number' }
            }
          }
        },
        maskingUtilitiesPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'visual-regression', 'masking', 'dynamic-content']
}));

// Phase 5: Capture Page Baselines
export const capturePageBaselinesTask = defineTask('capture-page-baselines', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Capture Baselines - ${args.page}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Visual Testing Engineer',
      task: 'Capture visual baseline screenshots for specified page',
      context: {
        projectName: args.projectName,
        page: args.page,
        applicationUrl: args.applicationUrl,
        viewports: args.viewports,
        maskingStrategy: args.maskingStrategy,
        tool: args.tool,
        captureFullPage: args.captureFullPage,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Navigate to the specified page',
        '2. Wait for page load and network idle',
        '3. Apply masking rules to dynamic content',
        '4. Disable animations if configured',
        '5. For each viewport: resize and capture baseline screenshot',
        '6. Capture full page if configured, otherwise viewport only',
        '7. Save baseline images with naming convention: page_viewport.png',
        '8. Generate metadata for each baseline (timestamp, viewport, hash)',
        '9. Verify baseline quality and completeness',
        '10. Create baseline index/manifest',
        '11. Return baseline capture results'
      ],
      outputFormat: 'JSON object with baseline capture results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'baselinesCaptured', 'baselinePath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        page: { type: 'string' },
        baselinesCaptured: { type: 'number' },
        baselines: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              viewport: { type: 'string' },
              imagePath: { type: 'string' },
              imageSize: { type: 'string' },
              hash: { type: 'string' },
              timestamp: { type: 'string' }
            }
          }
        },
        baselinePath: { type: 'string' },
        sampleImagePath: { type: 'string' },
        manifestPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'visual-regression', 'baseline', 'capture']
}));

// Phase 5b: Capture Component Baselines
export const captureComponentBaselinesTask = defineTask('capture-component-baselines', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Capture Component Baselines - ${args.component}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Component Testing Engineer',
      task: 'Capture visual baseline screenshots for UI component in isolation',
      context: {
        projectName: args.projectName,
        component: args.component,
        viewports: args.viewports,
        tool: args.tool,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Render component in isolation (Storybook, component playground)',
        '2. Test component in various states (default, hover, active, disabled)',
        '3. Test with different prop combinations',
        '4. For each viewport and state: capture baseline screenshot',
        '5. Use component-specific naming: component_state_viewport.png',
        '6. Generate metadata for each baseline',
        '7. Create component baseline manifest',
        '8. Return capture results'
      ],
      outputFormat: 'JSON object with component baseline results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'baselinesCaptured', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        component: { type: 'string' },
        baselinesCaptured: { type: 'number' },
        states: { type: 'array', items: { type: 'string' } },
        baselines: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              state: { type: 'string' },
              viewport: { type: 'string' },
              imagePath: { type: 'string' },
              hash: { type: 'string' }
            }
          }
        },
        baselinePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'visual-regression', 'component', 'baseline']
}));

// Phase 6: Visual Test Implementation
export const visualTestImplementationTask = defineTask('visual-test-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Visual Test Implementation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Test Automation Engineer',
      task: 'Implement automated visual regression tests',
      context: {
        projectName: args.projectName,
        pages: args.pages,
        components: args.components,
        viewports: args.viewports,
        baselineResults: args.baselineResults,
        componentBaselineResults: args.componentBaselineResults,
        tool: args.tool,
        maskingStrategy: args.maskingStrategy,
        framework: args.framework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create visual test files for each page and component',
        '2. Implement test setup and teardown',
        '3. Add navigation and page load logic',
        '4. Apply masking and wait conditions',
        '5. Implement screenshot capture with baseline comparison',
        '6. Add viewport iteration logic',
        '7. Implement assertion logic for visual differences',
        '8. Add test metadata and labeling',
        '9. Create test utilities for common visual test patterns',
        '10. Organize tests by feature/page/component',
        '11. Add test documentation and comments',
        '12. Verify tests are runnable and pass with baselines'
      ],
      outputFormat: 'JSON object with implemented visual tests'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'testCount', 'visualTests', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        testCount: { type: 'number' },
        visualTests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              testFilePath: { type: 'string' },
              page: { type: 'string' },
              component: { type: 'string' },
              viewports: { type: 'array', items: { type: 'string' } },
              baselineCount: { type: 'number' },
              status: { type: 'string' }
            }
          }
        },
        testUtilitiesPath: { type: 'string' },
        testOrganization: {
          type: 'object',
          properties: {
            pageTests: { type: 'number' },
            componentTests: { type: 'number' },
            totalScenarios: { type: 'number' }
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
  labels: ['agent', 'visual-regression', 'test-implementation', 'automation']
}));

// Phase 7: Threshold Configuration
export const thresholdConfigurationTask = defineTask('threshold-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Threshold Configuration - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Visual Testing Configuration Specialist',
      task: 'Configure thresholds and tolerance levels for visual differences',
      context: {
        projectName: args.projectName,
        thresholds: args.thresholds,
        acceptanceCriteria: args.acceptanceCriteria,
        tool: args.tool,
        visualTests: args.visualTests,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define global threshold settings (pixel diff, layout shift)',
        '2. Configure per-test threshold overrides for special cases',
        '3. Set up difference categorization (critical, major, minor, acceptable)',
        '4. Define acceptable anti-aliasing tolerance',
        '5. Configure color difference thresholds',
        '6. Set layout shift detection sensitivity',
        '7. Define auto-approval rules for minor changes',
        '8. Create threshold profiles for different test types',
        '9. Document threshold rationale',
        '10. Generate threshold configuration file'
      ],
      outputFormat: 'JSON object with threshold configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['configuration', 'artifacts'],
      properties: {
        configuration: {
          type: 'object',
          properties: {
            global: {
              type: 'object',
              properties: {
                pixelDiffThreshold: { type: 'number' },
                layoutShiftThreshold: { type: 'number' },
                antiAliasingTolerance: { type: 'number' },
                colorDiffThreshold: { type: 'number' }
              }
            },
            differenceCategories: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  category: { type: 'string' },
                  threshold: { type: 'number' },
                  autoApprove: { type: 'boolean' }
                }
              }
            },
            perTestOverrides: { type: 'array' }
          }
        },
        thresholdProfiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              settings: { type: 'object' }
            }
          }
        },
        configurationPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'visual-regression', 'threshold', 'configuration']
}));

// Phase 8: Visual Comparison
export const visualComparisonTask = defineTask('visual-comparison', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Visual Comparison - ${args.runType} - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Visual Testing Engineer',
      task: 'Run visual comparison tests against baselines',
      context: {
        projectName: args.projectName,
        applicationUrl: args.applicationUrl,
        visualTests: args.visualTests,
        thresholdConfig: args.thresholdConfig,
        tool: args.tool,
        runType: args.runType,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Execute all visual regression tests',
        '2. Capture current screenshots for comparison',
        '3. Compare current screenshots against baselines',
        '4. Calculate pixel differences and change percentages',
        '5. Apply threshold rules to categorize differences',
        '6. Generate diff images highlighting changes',
        '7. Identify critical visual regressions',
        '8. Calculate pass/fail status for each test',
        '9. Aggregate comparison results',
        '10. Generate visual comparison report (HTML/JSON)',
        '11. Capture screenshots of failed tests',
        '12. Return comprehensive comparison results'
      ],
      outputFormat: 'JSON object with comparison results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'totalTests', 'passed', 'failed', 'differencesFound', 'reportPath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        totalTests: { type: 'number' },
        passed: { type: 'number' },
        failed: { type: 'number' },
        differencesFound: { type: 'number' },
        criticalDifferences: { type: 'number' },
        differences: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testName: { type: 'string' },
              page: { type: 'string' },
              viewport: { type: 'string' },
              diffPercentage: { type: 'number' },
              category: { type: 'string' },
              diffImagePath: { type: 'string' },
              baselinePath: { type: 'string' },
              currentPath: { type: 'string' }
            }
          }
        },
        topDifferences: {
          type: 'array',
          description: 'Top 10 differences by severity'
        },
        reportPath: { type: 'string' },
        diffImages: { type: 'array', items: { type: 'string' } },
        jsonReportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'visual-regression', 'comparison', 'testing']
}));

// Phase 9: Visual Difference Analysis
export const visualDifferenceAnalysisTask = defineTask('visual-difference-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Difference Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Visual Regression Analyst',
      task: 'Analyze and categorize visual differences',
      context: {
        projectName: args.projectName,
        comparisonResults: args.comparisonResults,
        thresholds: args.thresholds,
        acceptanceCriteria: args.acceptanceCriteria,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Review all detected visual differences',
        '2. Categorize differences as: intentional changes, regressions, or false positives',
        '3. Analyze difference patterns (layout shifts, color changes, missing elements)',
        '4. Assess severity and impact of each difference',
        '5. Identify root causes (code changes, data issues, rendering issues)',
        '6. Group related differences',
        '7. Prioritize differences for review',
        '8. Determine which differences require baseline updates',
        '9. Flag critical regressions requiring immediate attention',
        '10. Generate analysis report with categorization',
        '11. Provide recommendations for each category'
      ],
      outputFormat: 'JSON object with difference analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['intentionalChanges', 'regressions', 'falsePositives', 'artifacts'],
      properties: {
        intentionalChanges: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testName: { type: 'string' },
              reason: { type: 'string' },
              requiresBaselineUpdate: { type: 'boolean' },
              diffPercentage: { type: 'number' }
            }
          }
        },
        regressions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testName: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              issueType: { type: 'string' },
              likelyRootCause: { type: 'string' },
              affectedArea: { type: 'string' },
              diffImagePath: { type: 'string' }
            }
          }
        },
        falsePositives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testName: { type: 'string' },
              reason: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        analysisSum mary: {
          type: 'object',
          properties: {
            totalDifferences: { type: 'number' },
            intentional: { type: 'number' },
            regressions: { type: 'number' },
            falsePositives: { type: 'number' },
            criticalRegressions: { type: 'number' }
          }
        },
        reportPath: { type: 'string' },
        diffSummaryPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'visual-regression', 'analysis', 'categorization']
}));

// Additional task definitions would continue here following the same pattern...
// For brevity, I'll add a few more key tasks:

// Phase 10: Baseline Update Strategy
export const baselineUpdateStrategyTask = defineTask('baseline-update-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Baseline Update Strategy - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Visual Testing Lead',
      task: 'Create baseline update and management strategy',
      context: {
        projectName: args.projectName,
        differenceAnalysis: args.differenceAnalysis,
        baselineStrategy: args.baselineStrategy,
        acceptanceCriteria: args.acceptanceCriteria,
        tool: args.tool,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Review intentional changes requiring baseline updates',
        '2. Determine update strategy (manual approval, auto-update, branch-based)',
        '3. Create baseline update plan with affected tests',
        '4. Generate commands/scripts for baseline updates',
        '5. Implement version control for baselines',
        '6. Plan baseline branching strategy (feature, main, release)',
        '7. Document baseline update procedures',
        '8. Create baseline approval workflow',
        '9. Generate update plan document',
        '10. Return update requirements'
      ],
      outputFormat: 'JSON object with baseline update strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['updatesRequired', 'affectedTests', 'updatePlanPath', 'artifacts'],
      properties: {
        updatesRequired: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testName: { type: 'string' },
              currentBaseline: { type: 'string' },
              newBaseline: { type: 'string' },
              updateCommand: { type: 'string' }
            }
          }
        },
        affectedTests: { type: 'number' },
        updateStrategy: { type: 'string' },
        branchingStrategy: { type: 'string' },
        approvalWorkflow: { type: 'string' },
        updatePlanPath: { type: 'string' },
        updateScriptPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'visual-regression', 'baseline', 'strategy']
}));

// Remaining task definitions (Phase 11-18) would follow similar patterns
// Including: visualRegressionRemediationTask, falsePositiveEliminationTask,
// crossBrowserVisualTestTask, visualTestOptimizationTask,
// visualRegressionReportingTask, visualRegressionCICDTask,
// visualRegressionDocumentationTask, visualRegressionValidationTask

// For brevity, adding the final validation task:

// Phase 18: Visual Regression Validation
export const visualRegressionValidationTask = defineTask('visual-regression-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 18: Final Validation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior Visual Testing Architect',
      task: 'Validate visual regression testing setup and provide deployment recommendation',
      context: {
        projectName: args.projectName,
        baselinesCaptured: args.baselinesCaptured,
        visualTests: args.visualTests,
        comparisonResults: args.comparisonResults,
        differenceAnalysis: args.differenceAnalysis,
        regressions: args.regressions,
        acceptanceCriteria: args.acceptanceCriteria,
        cicdIntegrationResult: args.cicdIntegrationResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Validate baseline coverage is complete',
        '2. Verify all visual tests are implemented and passing',
        '3. Check threshold configurations are appropriate',
        '4. Validate masking strategy effectiveness',
        '5. Assess false positive rate',
        '6. Review regression detection accuracy',
        '7. Validate CI/CD integration',
        '8. Check documentation completeness',
        '9. Calculate validation score (0-100)',
        '10. Determine production readiness',
        '11. Provide deployment recommendation',
        '12. Generate validation report'
      ],
      outputFormat: 'JSON object with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['validationScore', 'productionReady', 'verdict', 'recommendation', 'reportPath', 'artifacts'],
      properties: {
        validationScore: { type: 'number', minimum: 0, maximum: 100 },
        productionReady: { type: 'boolean' },
        qualityGates: {
          type: 'object',
          properties: {
            baselineCoverage: { type: 'boolean' },
            testsImplemented: { type: 'boolean' },
            thresholdsConfigured: { type: 'boolean' },
            cicdIntegrated: { type: 'boolean' },
            documentationComplete: { type: 'boolean' },
            regressionsResolved: { type: 'boolean' }
          }
        },
        verdict: { type: 'string' },
        recommendation: { type: 'string', enum: ['approve', 'conditional-approve', 'review-required'] },
        strengths: { type: 'array', items: { type: 'string' } },
        concerns: { type: 'array', items: { type: 'string' } },
        nextSteps: { type: 'array', items: { type: 'string' } },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'visual-regression', 'validation', 'final-approval']
}));

// Stub implementations for remaining tasks (11-17) to complete the structure
export const visualRegressionRemediationTask = defineTask('visual-regression-remediation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Regression Remediation - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Visual QA Engineer', task: 'Create remediation plan for visual regressions', context: args, instructions: ['Create remediation tasks', 'Prioritize by severity', 'Estimate effort', 'Document fixes'], outputFormat: 'JSON with remediation plan' }, outputSchema: { type: 'object', required: ['remediationTasks', 'estimatedEffort', 'reportPath', 'artifacts'], properties: { remediationTasks: { type: 'array' }, estimatedEffort: { type: 'string' }, reportPath: { type: 'string' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'visual-regression', 'remediation']
}));

export const falsePositiveEliminationTask = defineTask('false-positive-elimination', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: False Positive Elimination - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Visual Testing Engineer', task: 'Eliminate false positives through improved masking and thresholds', context: args, instructions: ['Analyze false positives', 'Adjust masking', 'Tune thresholds', 'Re-run tests'], outputFormat: 'JSON with elimination results' }, outputSchema: { type: 'object', required: ['eliminatedCount', 'artifacts'], properties: { eliminatedCount: { type: 'number' }, adjustedMasks: { type: 'array' }, adjustedThresholds: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'visual-regression', 'false-positives']
}));

export const crossBrowserVisualTestTask = defineTask('cross-browser-visual-test', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 13: Cross-Browser Visual Testing - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Cross-Browser Testing Engineer', task: 'Run visual tests across multiple browsers', context: args, instructions: ['Run tests on each browser', 'Compare cross-browser differences', 'Document rendering variations'], outputFormat: 'JSON with cross-browser results' }, outputSchema: { type: 'object', required: ['browserTestsRun', 'crossBrowserDifferences', 'artifacts'], properties: { browserTestsRun: { type: 'number' }, crossBrowserDifferences: { type: 'number' }, browsers: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'visual-regression', 'cross-browser']
}));

export const visualTestOptimizationTask = defineTask('visual-test-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 14: Test Optimization - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Performance Engineer', task: 'Optimize visual test execution performance', context: args, instructions: ['Enable parallel execution', 'Optimize screenshot capture', 'Reduce test duration'], outputFormat: 'JSON with optimization results' }, outputSchema: { type: 'object', required: ['speedupFactor', 'optimizedExecutionTime', 'artifacts'], properties: { speedupFactor: { type: 'number' }, optimizedExecutionTime: { type: 'string' }, optimizations: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'visual-regression', 'optimization']
}));

export const visualRegressionReportingTask = defineTask('visual-regression-reporting', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 15: Reporting Setup - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'QA Reporting Specialist', task: 'Set up visual regression reporting and review workflow', context: args, instructions: ['Generate HTML reports', 'Create review dashboard', 'Set up approval workflow'], outputFormat: 'JSON with reporting setup' }, outputSchema: { type: 'object', required: ['mainReportPath', 'artifacts'], properties: { mainReportPath: { type: 'string' }, dashboardUrl: { type: 'string' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'visual-regression', 'reporting']
}));

export const visualRegressionCICDTask = defineTask('visual-regression-cicd', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 16: CI/CD Integration - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'DevOps Engineer', task: 'Integrate visual regression testing into CI/CD pipeline', context: args, instructions: ['Create pipeline config', 'Set up quality gates', 'Configure baseline management'], outputFormat: 'JSON with CI/CD integration' }, outputSchema: { type: 'object', required: ['configured', 'pipelineConfigPath', 'qualityGatesEnabled', 'artifacts'], properties: { configured: { type: 'boolean' }, pipelineConfigPath: { type: 'string' }, qualityGatesEnabled: { type: 'boolean' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'visual-regression', 'cicd']
}));

export const visualRegressionDocumentationTask = defineTask('visual-regression-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 17: Documentation - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Technical Writer', task: 'Generate comprehensive visual regression testing documentation', context: args, instructions: ['Create setup guide', 'Write usage documentation', 'Document troubleshooting'], outputFormat: 'JSON with documentation paths' }, outputSchema: { type: 'object', required: ['setupGuidePath', 'usageGuidePath', 'troubleshootingPath', 'artifacts'], properties: { setupGuidePath: { type: 'string' }, usageGuidePath: { type: 'string' }, troubleshootingPath: { type: 'string' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'visual-regression', 'documentation']
}));
