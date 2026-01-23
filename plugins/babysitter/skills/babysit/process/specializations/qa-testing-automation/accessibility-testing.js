/**
 * @process specializations/qa-testing-automation/accessibility-testing
 * @description Accessibility Testing Automation - Implement automated accessibility testing to ensure WCAG 2.1/2.2 compliance,
 * keyboard navigation, screen reader compatibility, and inclusive design validation with automated quality gates and remediation tracking.
 * @inputs { projectName: string, wcagLevel: string, pages: array, framework: string, reportingFormat?: string, remediationRequired?: boolean, includeManualTests?: boolean }
 * @outputs { success: boolean, complianceLevel: string, violations: array, recommendations: array, reports: array, remediationPlan?: object }
 *
 * @example
 * const result = await orchestrate('specializations/qa-testing-automation/accessibility-testing', {
 *   projectName: 'E-Commerce Platform',
 *   wcagLevel: 'AA',
 *   pages: ['/home', '/products', '/checkout', '/account'],
 *   framework: 'playwright',
 *   reportingFormat: 'html',
 *   remediationRequired: true,
 *   includeManualTests: true
 * });
 *
 * @references
 * - WCAG 2.1: https://www.w3.org/WAI/WCAG21/quickref/
 * - WCAG 2.2: https://www.w3.org/WAI/WCAG22/quickref/
 * - axe-core: https://github.com/dequelabs/axe-core
 * - Pa11y: https://pa11y.org/
 * - Lighthouse Accessibility: https://developers.google.com/web/tools/lighthouse
 * - ARIA Practices: https://www.w3.org/WAI/ARIA/apg/
 * - WebAIM: https://webaim.org/
 * - Playwright Accessibility Testing: https://playwright.dev/docs/accessibility-testing
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    wcagLevel = 'AA',
    pages = [],
    components = [],
    framework = 'playwright',
    reportingFormat = 'html',
    remediationRequired = false,
    includeManualTests = false,
    keyboardNavigationTests = true,
    colorContrastTests = true,
    screenReaderTests = false,
    baseUrl = 'http://localhost:3000',
    outputDir = 'accessibility-testing-output',
    breakOnCritical = true,
    autoRemediation = false
  } = inputs;

  const startTime = ctx.now();
  const violations = [];
  const recommendations = [];
  const reports = [];
  const artifacts = [];

  ctx.log('info', `Starting Accessibility Testing Automation: ${projectName}`);
  ctx.log('info', `WCAG Level: ${wcagLevel}, Pages: ${pages.length}, Framework: ${framework}`);

  // ============================================================================
  // PHASE 1: ACCESSIBILITY STANDARDS REVIEW
  // ============================================================================

  ctx.log('info', 'Phase 1: Reviewing WCAG standards and requirements');
  const standardsReview = await ctx.task(wcagStandardsReviewTask, {
    projectName,
    wcagLevel,
    framework,
    outputDir
  });

  if (!standardsReview.success) {
    return {
      success: false,
      error: 'WCAG standards review failed',
      details: standardsReview,
      metadata: { processId: 'specializations/qa-testing-automation/accessibility-testing', timestamp: startTime }
    };
  }

  artifacts.push(...standardsReview.artifacts);
  recommendations.push(...standardsReview.recommendations);

  // ============================================================================
  // PHASE 2: ACCESSIBILITY TESTING FRAMEWORK SETUP
  // ============================================================================

  ctx.log('info', 'Phase 2: Setting up accessibility testing framework');
  const frameworkSetup = await ctx.task(accessibilityFrameworkSetupTask, {
    projectName,
    framework,
    wcagLevel,
    reportingFormat,
    baseUrl,
    outputDir
  });

  if (!frameworkSetup.success) {
    return {
      success: false,
      error: 'Accessibility framework setup failed',
      details: frameworkSetup,
      metadata: { processId: 'specializations/qa-testing-automation/accessibility-testing', timestamp: startTime }
    };
  }

  artifacts.push(...frameworkSetup.artifacts);

  // Breakpoint: Review framework setup
  await ctx.breakpoint({
    question: `Accessibility testing framework configured with ${frameworkSetup.toolsInstalled.join(', ')}. Review setup and approve to proceed with automated scanning?`,
    title: 'Framework Setup Review',
    context: {
      runId: ctx.runId,
      framework: frameworkSetup,
      wcagLevel,
      files: frameworkSetup.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 3: AUTOMATED ACCESSIBILITY SCANNING
  // ============================================================================

  ctx.log('info', 'Phase 3: Running automated accessibility scans on all pages');

  const scanResults = [];
  let criticalViolationsFound = false;

  for (const page of pages) {
    ctx.log('info', `Scanning page: ${page}`);

    const pageScan = await ctx.task(automatedAccessibilityScanTask, {
      projectName,
      page,
      baseUrl,
      wcagLevel,
      framework: frameworkSetup.frameworkConfig,
      outputDir
    });

    scanResults.push({
      page,
      result: pageScan,
      timestamp: ctx.now()
    });

    violations.push(...pageScan.violations);
    artifacts.push(...pageScan.artifacts);

    // Check for critical violations
    const criticalCount = pageScan.violations.filter(v => v.impact === 'critical' || v.impact === 'serious').length;
    if (criticalCount > 0) {
      criticalViolationsFound = true;
      ctx.log('warning', `Page ${page}: ${criticalCount} critical/serious violations found`);
    } else {
      ctx.log('info', `Page ${page}: No critical violations`);
    }
  }

  // Quality Gate: Critical violations check
  if (criticalViolationsFound && breakOnCritical) {
    await ctx.breakpoint({
      question: `Critical accessibility violations detected across ${scanResults.length} pages. Review violations and decide: Fix now, continue scanning, or abort?`,
      title: 'Critical Accessibility Violations Detected',
      context: {
        runId: ctx.runId,
        summary: {
          totalPages: pages.length,
          totalViolations: violations.length,
          criticalViolations: violations.filter(v => v.impact === 'critical').length,
          seriousViolations: violations.filter(v => v.impact === 'serious').length
        },
        topViolations: violations
          .filter(v => v.impact === 'critical' || v.impact === 'serious')
          .slice(0, 10),
        files: scanResults.map(s => ({ path: s.result.reportPath, format: 'html', label: `Scan: ${s.page}` }))
      }
    });
  }

  // ============================================================================
  // PHASE 4: COMPONENT-LEVEL ACCESSIBILITY TESTING
  // ============================================================================

  let componentResults = [];
  if (components.length > 0) {
    ctx.log('info', 'Phase 4: Testing accessibility of individual components');

    for (const component of components) {
      ctx.log('info', `Testing component: ${component.name}`);

      const componentTest = await ctx.task(componentAccessibilityTestTask, {
        projectName,
        component,
        wcagLevel,
        framework: frameworkSetup.frameworkConfig,
        outputDir
      });

      componentResults.push({
        component: component.name,
        result: componentTest,
        timestamp: ctx.now()
      });

      violations.push(...componentTest.violations);
      artifacts.push(...componentTest.artifacts);
    }
  }

  // ============================================================================
  // PHASE 5: KEYBOARD NAVIGATION TESTING
  // ============================================================================

  let keyboardResults = null;
  if (keyboardNavigationTests) {
    ctx.log('info', 'Phase 5: Testing keyboard navigation and focus management');

    keyboardResults = await ctx.task(keyboardNavigationTestTask, {
      projectName,
      pages,
      baseUrl,
      framework: frameworkSetup.frameworkConfig,
      outputDir
    });

    violations.push(...keyboardResults.violations);
    recommendations.push(...keyboardResults.recommendations);
    artifacts.push(...keyboardResults.artifacts);

    ctx.log('info', `Keyboard navigation: ${keyboardResults.passed} passed, ${keyboardResults.failed} failed`);
  }

  // ============================================================================
  // PHASE 6: COLOR CONTRAST ANALYSIS
  // ============================================================================

  let colorContrastResults = null;
  if (colorContrastTests) {
    ctx.log('info', 'Phase 6: Analyzing color contrast ratios');

    colorContrastResults = await ctx.task(colorContrastAnalysisTask, {
      projectName,
      pages,
      baseUrl,
      wcagLevel,
      framework: frameworkSetup.frameworkConfig,
      outputDir
    });

    violations.push(...colorContrastResults.violations);
    recommendations.push(...colorContrastResults.recommendations);
    artifacts.push(...colorContrastResults.artifacts);

    ctx.log('info', `Color contrast: ${colorContrastResults.passing} elements pass, ${colorContrastResults.failing} fail`);
  }

  // ============================================================================
  // PHASE 7: SCREEN READER COMPATIBILITY TESTING
  // ============================================================================

  let screenReaderResults = null;
  if (screenReaderTests) {
    ctx.log('info', 'Phase 7: Testing screen reader compatibility');

    screenReaderResults = await ctx.task(screenReaderCompatibilityTask, {
      projectName,
      pages,
      baseUrl,
      outputDir
    });

    violations.push(...screenReaderResults.violations);
    recommendations.push(...screenReaderResults.recommendations);
    artifacts.push(...screenReaderResults.artifacts);

    ctx.log('info', `Screen reader compatibility: ${screenReaderResults.compatible ? 'PASS' : 'FAIL'}`);
  }

  // ============================================================================
  // PHASE 8: MANUAL TESTING GUIDE GENERATION
  // ============================================================================

  let manualTestingGuide = null;
  if (includeManualTests) {
    ctx.log('info', 'Phase 8: Generating manual accessibility testing guide');

    manualTestingGuide = await ctx.task(manualTestingGuideTask, {
      projectName,
      pages,
      components,
      wcagLevel,
      automatedFindings: violations,
      outputDir
    });

    artifacts.push(...manualTestingGuide.artifacts);
    recommendations.push(...manualTestingGuide.recommendations);
  }

  // ============================================================================
  // PHASE 9: VIOLATION ANALYSIS AND PRIORITIZATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Analyzing and prioritizing accessibility violations');
  const violationAnalysis = await ctx.task(violationAnalysisTask, {
    projectName,
    violations,
    wcagLevel,
    scanResults,
    componentResults,
    keyboardResults,
    colorContrastResults,
    screenReaderResults,
    outputDir
  });

  artifacts.push(...violationAnalysis.artifacts);

  const prioritizedViolations = violationAnalysis.prioritizedViolations;
  const complianceScore = violationAnalysis.complianceScore;
  const complianceLevel = violationAnalysis.complianceLevel;

  ctx.log('info', `Compliance score: ${complianceScore}/100, Level: ${complianceLevel}`);

  // Quality Gate: Compliance level check
  const meetsCompliance = complianceLevel === wcagLevel ||
    (wcagLevel === 'AA' && complianceLevel === 'AAA') ||
    (wcagLevel === 'A' && ['AA', 'AAA'].includes(complianceLevel));

  if (!meetsCompliance) {
    await ctx.breakpoint({
      question: `Application does not meet WCAG ${wcagLevel} compliance. Current level: ${complianceLevel}, Score: ${complianceScore}/100. ${prioritizedViolations.length} violations found. Review and approve remediation plan?`,
      title: 'WCAG Compliance Gap Detected',
      context: {
        runId: ctx.runId,
        compliance: {
          target: wcagLevel,
          current: complianceLevel,
          score: complianceScore,
          gap: 100 - complianceScore
        },
        violationSummary: violationAnalysis.summary,
        topViolations: prioritizedViolations.slice(0, 15),
        files: [
          { path: violationAnalysis.reportPath, format: 'html', label: 'Violation Analysis Report' },
          { path: violationAnalysis.summaryPath, format: 'json', label: 'Violation Summary' }
        ]
      }
    });
  }

  // ============================================================================
  // PHASE 10: COMPREHENSIVE ACCESSIBILITY REPORT
  // ============================================================================

  ctx.log('info', 'Phase 10: Generating comprehensive accessibility report');
  const accessibilityReport = await ctx.task(comprehensiveReportTask, {
    projectName,
    wcagLevel,
    complianceScore,
    complianceLevel,
    scanResults,
    componentResults,
    keyboardResults,
    colorContrastResults,
    screenReaderResults,
    violations,
    recommendations,
    violationAnalysis,
    reportingFormat,
    outputDir
  });

  artifacts.push(...accessibilityReport.artifacts);
  reports.push(...accessibilityReport.reports);

  // ============================================================================
  // PHASE 11: REMEDIATION PLAN GENERATION
  // ============================================================================

  let remediationPlan = null;
  if (remediationRequired) {
    ctx.log('info', 'Phase 11: Generating remediation plan');

    remediationPlan = await ctx.task(remediationPlanTask, {
      projectName,
      prioritizedViolations,
      wcagLevel,
      complianceScore,
      complianceLevel,
      recommendations,
      autoRemediation,
      outputDir
    });

    artifacts.push(...remediationPlan.artifacts);

    // Breakpoint: Review remediation plan
    await ctx.breakpoint({
      question: `Remediation plan created with ${remediationPlan.tasks.length} tasks (${remediationPlan.estimatedEffort} hours estimated). Review plan and approve for implementation?`,
      title: 'Remediation Plan Review',
      context: {
        runId: ctx.runId,
        plan: {
          totalTasks: remediationPlan.tasks.length,
          criticalTasks: remediationPlan.tasks.filter(t => t.priority === 'critical').length,
          highTasks: remediationPlan.tasks.filter(t => t.priority === 'high').length,
          estimatedEffort: remediationPlan.estimatedEffort,
          expectedImpact: remediationPlan.expectedComplianceImprovement
        },
        quickWins: remediationPlan.quickWins,
        files: [
          { path: remediationPlan.planPath, format: 'markdown', label: 'Remediation Plan' },
          { path: remediationPlan.taskListPath, format: 'json', label: 'Task List' }
        ]
      }
    });
  }

  // ============================================================================
  // PHASE 12: CI/CD INTEGRATION SETUP
  // ============================================================================

  ctx.log('info', 'Phase 12: Setting up CI/CD integration');
  const cicdIntegration = await ctx.task(cicdIntegrationTask, {
    projectName,
    framework: frameworkSetup.frameworkConfig,
    wcagLevel,
    pages,
    breakOnCritical,
    outputDir
  });

  artifacts.push(...cicdIntegration.artifacts);

  // ============================================================================
  // PHASE 13: ACCESSIBILITY MONITORING SETUP
  // ============================================================================

  ctx.log('info', 'Phase 13: Setting up continuous accessibility monitoring');
  const monitoringSetup = await ctx.task(accessibilityMonitoringTask, {
    projectName,
    wcagLevel,
    complianceScore,
    pages,
    framework: frameworkSetup.frameworkConfig,
    alertThresholds: {
      complianceScoreThreshold: 85,
      criticalViolationsThreshold: 0,
      seriousViolationsThreshold: 5
    },
    outputDir
  });

  artifacts.push(...monitoringSetup.artifacts);

  // ============================================================================
  // PHASE 14: FINAL ACCESSIBILITY REVIEW
  // ============================================================================

  ctx.log('info', 'Phase 14: Conducting final accessibility review');
  const finalReview = await ctx.task(finalAccessibilityReviewTask, {
    projectName,
    wcagLevel,
    complianceScore,
    complianceLevel,
    meetsCompliance,
    violations,
    recommendations,
    remediationPlan,
    accessibilityReport,
    outputDir
  });

  artifacts.push(...finalReview.artifacts);

  // Final Breakpoint: Deployment approval
  await ctx.breakpoint({
    question: `Accessibility testing complete. WCAG ${wcagLevel} compliance: ${meetsCompliance ? 'ACHIEVED' : 'NOT MET'} (Score: ${complianceScore}/100). ${violations.length} total violations found. ${finalReview.verdict}. Approve for deployment?`,
    title: 'Final Accessibility Approval',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        wcagLevel,
        complianceLevel,
        complianceScore,
        meetsCompliance,
        totalViolations: violations.length,
        criticalViolations: violations.filter(v => v.impact === 'critical').length,
        seriousViolations: violations.filter(v => v.impact === 'serious').length,
        pagesScanned: pages.length,
        componentsScanned: components.length
      },
      verdict: finalReview.verdict,
      recommendation: finalReview.recommendation,
      deploymentReady: finalReview.deploymentReady,
      files: [
        { path: accessibilityReport.mainReportPath, format: 'html', label: 'Main Accessibility Report' },
        { path: violationAnalysis.reportPath, format: 'html', label: 'Violation Analysis' },
        { path: finalReview.reportPath, format: 'markdown', label: 'Final Review' },
        ...(remediationPlan ? [{ path: remediationPlan.planPath, format: 'markdown', label: 'Remediation Plan' }] : [])
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    complianceLevel,
    complianceScore,
    meetsCompliance,
    wcagTarget: wcagLevel,
    violations: {
      total: violations.length,
      critical: violations.filter(v => v.impact === 'critical').length,
      serious: violations.filter(v => v.impact === 'serious').length,
      moderate: violations.filter(v => v.impact === 'moderate').length,
      minor: violations.filter(v => v.impact === 'minor').length,
      details: violations
    },
    recommendations,
    testResults: {
      pageScans: scanResults.length,
      componentTests: componentResults.length,
      keyboardNavigationPassed: keyboardResults?.passed || 0,
      keyboardNavigationFailed: keyboardResults?.failed || 0,
      colorContrastPassing: colorContrastResults?.passing || 0,
      colorContrastFailing: colorContrastResults?.failing || 0,
      screenReaderCompatible: screenReaderResults?.compatible || null
    },
    reports,
    remediationPlan: remediationPlan ? {
      totalTasks: remediationPlan.tasks.length,
      estimatedEffort: remediationPlan.estimatedEffort,
      expectedImprovement: remediationPlan.expectedComplianceImprovement,
      planPath: remediationPlan.planPath
    } : null,
    cicdIntegration: {
      configured: cicdIntegration.success,
      pipelinePath: cicdIntegration.pipelineConfigPath
    },
    monitoring: {
      enabled: monitoringSetup.success,
      dashboardUrl: monitoringSetup.dashboardUrl
    },
    finalReview: {
      verdict: finalReview.verdict,
      deploymentReady: finalReview.deploymentReady,
      recommendation: finalReview.recommendation,
      concerns: finalReview.concerns
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/qa-testing-automation/accessibility-testing',
      timestamp: startTime,
      framework,
      wcagLevel,
      reportingFormat
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: WCAG Standards Review
export const wcagStandardsReviewTask = defineTask('wcag-standards-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: WCAG Standards Review - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Accessibility Specialist and WCAG Expert',
      task: 'Review WCAG 2.1/2.2 standards and create accessibility testing requirements',
      context: {
        projectName: args.projectName,
        wcagLevel: args.wcagLevel,
        framework: args.framework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Review WCAG 2.1 and 2.2 guidelines for the specified compliance level',
        '2. List all applicable success criteria for the target level (A, AA, or AAA)',
        '3. Identify which criteria can be tested automatically vs manually',
        '4. Create a checklist of accessibility requirements to validate',
        '5. Document testing approach for each success criterion',
        '6. Identify common accessibility patterns to test (forms, navigation, media, etc.)',
        '7. Define expected outcomes for compliant implementation',
        '8. Create reference documentation with WCAG links',
        '9. Provide recommendations for testing tools and approaches',
        '10. Generate standards compliance checklist'
      ],
      outputFormat: 'JSON object with standards review and requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'successCriteria', 'recommendations', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        wcagVersion: { type: 'string' },
        targetLevel: { type: 'string' },
        successCriteria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              level: { type: 'string' },
              description: { type: 'string' },
              testable: { type: 'string', enum: ['automated', 'manual', 'both'] },
              testingApproach: { type: 'string' }
            }
          }
        },
        automatedTestable: { type: 'number', description: 'Count of automated testable criteria' },
        manualTestable: { type: 'number', description: 'Count of manual testable criteria' },
        recommendations: {
          type: 'array',
          items: { type: 'string' }
        },
        checklistPath: { type: 'string', description: 'Path to compliance checklist' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'accessibility', 'wcag', 'standards-review']
}));

// Phase 2: Accessibility Framework Setup
export const accessibilityFrameworkSetupTask = defineTask('accessibility-framework-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Accessibility Framework Setup - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Test Automation Engineer specializing in Accessibility Testing',
      task: 'Set up comprehensive accessibility testing framework with tools and configuration',
      context: {
        projectName: args.projectName,
        framework: args.framework,
        wcagLevel: args.wcagLevel,
        reportingFormat: args.reportingFormat,
        baseUrl: args.baseUrl,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Install accessibility testing tools (axe-core, Pa11y, Lighthouse)',
        '2. Configure test framework (Playwright/Cypress) with accessibility plugins',
        '3. Set up axe-core with WCAG level configuration',
        '4. Configure Pa11y for automated scanning',
        '5. Set up Lighthouse for accessibility audits',
        '6. Create accessibility testing utilities and helpers',
        '7. Configure reporting (HTML, JSON, JUnit)',
        '8. Set up violation categorization and prioritization',
        '9. Create sample accessibility test demonstrating framework usage',
        '10. Document framework setup and usage',
        '11. Create configuration files for CI/CD integration',
        '12. Verify tool installation and basic functionality'
      ],
      outputFormat: 'JSON object with framework setup confirmation'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'toolsInstalled', 'frameworkConfig', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        toolsInstalled: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of installed accessibility tools'
        },
        frameworkConfig: {
          type: 'object',
          properties: {
            framework: { type: 'string' },
            wcagLevel: { type: 'string' },
            axeConfig: { type: 'string' },
            pa11yConfig: { type: 'string' },
            lighthouseConfig: { type: 'string' }
          }
        },
        sampleTestPath: { type: 'string', description: 'Path to sample test file' },
        configPaths: {
          type: 'object',
          properties: {
            axe: { type: 'string' },
            pa11y: { type: 'string' },
            lighthouse: { type: 'string' }
          }
        },
        reportingSetup: {
          type: 'object',
          properties: {
            format: { type: 'string' },
            outputPath: { type: 'string' }
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
  labels: ['agent', 'accessibility', 'framework-setup', 'automation']
}));

// Phase 3: Automated Accessibility Scan
export const automatedAccessibilityScanTask = defineTask('automated-accessibility-scan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Automated Scan - ${args.page}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Accessibility Testing Engineer',
      task: 'Run comprehensive automated accessibility scan on specified page',
      context: {
        projectName: args.projectName,
        page: args.page,
        baseUrl: args.baseUrl,
        wcagLevel: args.wcagLevel,
        framework: args.framework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Navigate to the specified page',
        '2. Run axe-core accessibility scan with WCAG rules',
        '3. Run Pa11y scan for additional coverage',
        '4. Run Lighthouse accessibility audit',
        '5. Aggregate violations from all tools',
        '6. Categorize violations by WCAG criterion',
        '7. Prioritize violations by impact (critical, serious, moderate, minor)',
        '8. Generate detailed violation reports with code snippets',
        '9. Capture screenshots of violated elements',
        '10. Provide remediation guidance for each violation',
        '11. Calculate accessibility score for the page',
        '12. Generate HTML and JSON reports'
      ],
      outputFormat: 'JSON object with scan results and violations'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'violations', 'score', 'reportPath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        page: { type: 'string' },
        score: { type: 'number', minimum: 0, maximum: 100 },
        violations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              impact: { type: 'string', enum: ['critical', 'serious', 'moderate', 'minor'] },
              description: { type: 'string' },
              wcagCriterion: { type: 'string' },
              wcagLevel: { type: 'string' },
              help: { type: 'string' },
              helpUrl: { type: 'string' },
              nodes: { type: 'array' },
              remediation: { type: 'string' }
            }
          }
        },
        passes: { type: 'number', description: 'Number of passed checks' },
        inapplicable: { type: 'number', description: 'Number of inapplicable checks' },
        incomplete: { type: 'number', description: 'Number of incomplete checks' },
        reportPath: { type: 'string', description: 'Path to HTML report' },
        jsonReportPath: { type: 'string', description: 'Path to JSON report' },
        screenshotPath: { type: 'string', description: 'Path to page screenshot' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'accessibility', 'automated-scan', 'wcag']
}));

// Phase 4: Component Accessibility Test
export const componentAccessibilityTestTask = defineTask('component-accessibility-test', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Component Test - ${args.component.name}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Component Testing Specialist',
      task: 'Test accessibility of individual UI component in isolation',
      context: {
        projectName: args.projectName,
        component: args.component,
        wcagLevel: args.wcagLevel,
        framework: args.framework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Render component in isolation with various props/states',
        '2. Run axe-core on component in all relevant states',
        '3. Test keyboard navigation within component',
        '4. Verify ARIA attributes and roles',
        '5. Test focus management and focus trapping if applicable',
        '6. Verify semantic HTML structure',
        '7. Test with various input combinations',
        '8. Check for proper labeling and descriptions',
        '9. Verify color contrast within component',
        '10. Document accessibility patterns used',
        '11. Generate component-specific accessibility report',
        '12. Provide component-specific remediation guidance'
      ],
      outputFormat: 'JSON object with component test results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'violations', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        componentName: { type: 'string' },
        violations: { type: 'array' },
        ariaValid: { type: 'boolean' },
        keyboardNavigable: { type: 'boolean' },
        semanticHtml: { type: 'boolean' },
        labelingComplete: { type: 'boolean' },
        focusManagement: { type: 'string', enum: ['correct', 'issues', 'not-applicable'] },
        accessibilityPatterns: { type: 'array', items: { type: 'string' } },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'accessibility', 'component-testing']
}));

// Phase 5: Keyboard Navigation Test
export const keyboardNavigationTestTask = defineTask('keyboard-navigation-test', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Keyboard Navigation Testing - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Keyboard Accessibility Specialist',
      task: 'Test keyboard-only navigation and interaction across all pages',
      context: {
        projectName: args.projectName,
        pages: args.pages,
        baseUrl: args.baseUrl,
        framework: args.framework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. For each page, test Tab key navigation through all interactive elements',
        '2. Verify Shift+Tab works for reverse navigation',
        '3. Test Enter/Space key activation of buttons and links',
        '4. Test arrow key navigation in menus, tabs, and lists',
        '5. Verify Escape key closes modals and dropdowns',
        '6. Test custom keyboard shortcuts if defined',
        '7. Verify visible focus indicators on all elements',
        '8. Check focus order is logical and follows visual flow',
        '9. Ensure no keyboard traps (focus can always escape)',
        '10. Test skip links and landmark navigation',
        '11. Document any keyboard navigation issues',
        '12. Generate keyboard accessibility report with pass/fail for each page'
      ],
      outputFormat: 'JSON object with keyboard navigation test results'
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'failed', 'violations', 'recommendations', 'artifacts'],
      properties: {
        passed: { type: 'number' },
        failed: { type: 'number' },
        violations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              page: { type: 'string' },
              issue: { type: 'string' },
              impact: { type: 'string' },
              element: { type: 'string' },
              remediation: { type: 'string' }
            }
          }
        },
        focusIndicatorsVisible: { type: 'boolean' },
        noKeyboardTraps: { type: 'boolean' },
        logicalFocusOrder: { type: 'boolean' },
        skipLinksPresent: { type: 'boolean' },
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
  labels: ['agent', 'accessibility', 'keyboard-navigation']
}));

// Phase 6: Color Contrast Analysis
export const colorContrastAnalysisTask = defineTask('color-contrast-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Color Contrast Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Visual Accessibility Specialist',
      task: 'Analyze color contrast ratios across all pages for WCAG compliance',
      context: {
        projectName: args.projectName,
        pages: args.pages,
        baseUrl: args.baseUrl,
        wcagLevel: args.wcagLevel,
        framework: args.framework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Scan all pages for text elements',
        '2. Calculate contrast ratios for all text against backgrounds',
        '3. For WCAG AA: verify 4.5:1 for normal text, 3:1 for large text',
        '4. For WCAG AAA: verify 7:1 for normal text, 4.5:1 for large text',
        '5. Check contrast for interactive elements (buttons, links)',
        '6. Verify contrast for focus indicators',
        '7. Check contrast for icons and graphical elements',
        '8. Identify all failing contrast combinations',
        '9. Provide color suggestions that meet requirements',
        '10. Generate visual contrast report with side-by-side comparisons',
        '11. Create heatmap of contrast issues across pages',
        '12. Document all contrast violations with remediation suggestions'
      ],
      outputFormat: 'JSON object with color contrast analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['passing', 'failing', 'violations', 'recommendations', 'artifacts'],
      properties: {
        passing: { type: 'number' },
        failing: { type: 'number' },
        violations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              page: { type: 'string' },
              element: { type: 'string' },
              foreground: { type: 'string' },
              background: { type: 'string' },
              ratio: { type: 'number' },
              required: { type: 'number' },
              wcagLevel: { type: 'string' },
              suggestedColors: { type: 'array' }
            }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        reportPath: { type: 'string' },
        heatmapPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'accessibility', 'color-contrast', 'wcag']
}));

// Phase 7: Screen Reader Compatibility
export const screenReaderCompatibilityTask = defineTask('screen-reader-compatibility', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Screen Reader Compatibility - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Assistive Technology Specialist',
      task: 'Test and document screen reader compatibility',
      context: {
        projectName: args.projectName,
        pages: args.pages,
        baseUrl: args.baseUrl,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Document testing procedure for NVDA, JAWS, and VoiceOver',
        '2. Verify page structure is announced correctly (landmarks, headings)',
        '3. Test form field labels and descriptions are read properly',
        '4. Verify button and link text is descriptive',
        '5. Check ARIA live regions announce dynamic content',
        '6. Test modal dialogs announce correctly and trap focus',
        '7. Verify image alt text is appropriate and meaningful',
        '8. Check tables are properly structured with headers',
        '9. Test skip links and navigation shortcuts',
        '10. Document screen reader specific issues',
        '11. Create manual testing checklist for screen readers',
        '12. Provide recommendations for improved screen reader UX'
      ],
      outputFormat: 'JSON object with screen reader compatibility results'
    },
    outputSchema: {
      type: 'object',
      required: ['compatible', 'violations', 'recommendations', 'artifacts'],
      properties: {
        compatible: { type: 'boolean' },
        testedScreenReaders: { type: 'array', items: { type: 'string' } },
        violations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              page: { type: 'string' },
              issue: { type: 'string' },
              severity: { type: 'string' },
              affectedScreenReaders: { type: 'array' },
              remediation: { type: 'string' }
            }
          }
        },
        landmarksCorrect: { type: 'boolean' },
        headingsStructured: { type: 'boolean' },
        formsAccessible: { type: 'boolean' },
        ariaLiveRegionsFunctional: { type: 'boolean' },
        recommendations: { type: 'array', items: { type: 'string' } },
        manualTestingChecklistPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'accessibility', 'screen-reader', 'assistive-technology']
}));

// Phase 8: Manual Testing Guide
export const manualTestingGuideTask = defineTask('manual-testing-guide', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Manual Testing Guide Generation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Accessibility QA Lead',
      task: 'Create comprehensive manual accessibility testing guide',
      context: {
        projectName: args.projectName,
        pages: args.pages,
        components: args.components,
        wcagLevel: args.wcagLevel,
        automatedFindings: args.automatedFindings,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify WCAG criteria that require manual testing',
        '2. Create test procedures for screen reader testing',
        '3. Document keyboard navigation test scenarios',
        '4. Create zoom and magnification testing guide',
        '5. Document cognitive and learning disability considerations',
        '6. Create seizure and physical reaction testing procedures',
        '7. Document mobile accessibility testing procedures',
        '8. Create test case templates for each manual test type',
        '9. Provide decision trees for subjective accessibility criteria',
        '10. Create checklists for manual testers',
        '11. Document expected vs actual result templates',
        '12. Provide training materials for manual accessibility testing'
      ],
      outputFormat: 'JSON object with manual testing guide'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'artifacts'],
      properties: {
        manualTestCases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              testProcedure: { type: 'string' },
              expectedResult: { type: 'string' }
            }
          }
        },
        screenReaderGuide: { type: 'string' },
        keyboardTestingGuide: { type: 'string' },
        cognitiveAccessibilityGuide: { type: 'string' },
        recommendations: { type: 'array', items: { type: 'string' } },
        checklistPath: { type: 'string' },
        trainingMaterialsPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'accessibility', 'manual-testing', 'documentation']
}));

// Phase 9: Violation Analysis
export const violationAnalysisTask = defineTask('violation-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Violation Analysis and Prioritization - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior Accessibility Analyst',
      task: 'Analyze all accessibility violations and prioritize remediation',
      context: {
        projectName: args.projectName,
        violations: args.violations,
        wcagLevel: args.wcagLevel,
        scanResults: args.scanResults,
        componentResults: args.componentResults,
        keyboardResults: args.keyboardResults,
        colorContrastResults: args.colorContrastResults,
        screenReaderResults: args.screenReaderResults,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Aggregate all violations from different test phases',
        '2. Deduplicate violations found in multiple scans',
        '3. Categorize violations by WCAG principle (Perceivable, Operable, Understandable, Robust)',
        '4. Prioritize by impact (critical, serious, moderate, minor)',
        '5. Calculate compliance score based on violations and passed checks',
        '6. Determine overall WCAG compliance level achieved',
        '7. Identify most common violation patterns',
        '8. Group related violations for efficient remediation',
        '9. Estimate effort required to fix each violation',
        '10. Calculate potential compliance improvement per fix',
        '11. Create prioritized remediation roadmap',
        '12. Generate comprehensive violation analysis report'
      ],
      outputFormat: 'JSON object with violation analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['complianceScore', 'complianceLevel', 'prioritizedViolations', 'summary', 'reportPath', 'artifacts'],
      properties: {
        complianceScore: { type: 'number', minimum: 0, maximum: 100 },
        complianceLevel: { type: 'string', enum: ['A', 'AA', 'AAA', 'Non-compliant'] },
        prioritizedViolations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              priority: { type: 'number' },
              impact: { type: 'string' },
              violationId: { type: 'string' },
              wcagCriterion: { type: 'string' },
              occurrences: { type: 'number' },
              affectedPages: { type: 'array' },
              estimatedEffort: { type: 'string' },
              complianceImpact: { type: 'number' }
            }
          }
        },
        summary: {
          type: 'object',
          properties: {
            totalViolations: { type: 'number' },
            criticalViolations: { type: 'number' },
            seriousViolations: { type: 'number' },
            moderateViolations: { type: 'number' },
            minorViolations: { type: 'number' },
            mostCommonViolations: { type: 'array' },
            principleBreakdown: { type: 'object' }
          }
        },
        reportPath: { type: 'string' },
        summaryPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'accessibility', 'analysis', 'prioritization']
}));

// Phase 10: Comprehensive Report
export const comprehensiveReportTask = defineTask('comprehensive-accessibility-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Comprehensive Accessibility Report - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Accessibility Documentation Specialist',
      task: 'Generate comprehensive accessibility testing report',
      context: {
        projectName: args.projectName,
        wcagLevel: args.wcagLevel,
        complianceScore: args.complianceScore,
        complianceLevel: args.complianceLevel,
        scanResults: args.scanResults,
        componentResults: args.componentResults,
        keyboardResults: args.keyboardResults,
        colorContrastResults: args.colorContrastResults,
        screenReaderResults: args.screenReaderResults,
        violations: args.violations,
        recommendations: args.recommendations,
        violationAnalysis: args.violationAnalysis,
        reportingFormat: args.reportingFormat,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create executive summary with key findings and compliance status',
        '2. Document testing methodology and tools used',
        '3. Present compliance score and level achieved',
        '4. Summarize violations by category and severity',
        '5. Include detailed violation listings with screenshots',
        '6. Document keyboard navigation results',
        '7. Present color contrast analysis findings',
        '8. Include screen reader compatibility results',
        '9. Provide component-level accessibility assessment',
        '10. List all recommendations with priorities',
        '11. Include WCAG success criteria mapping',
        '12. Generate reports in requested formats (HTML, PDF, Markdown)',
        '13. Create visualizations (charts, graphs, heatmaps)',
        '14. Provide links to detailed sub-reports'
      ],
      outputFormat: 'JSON object with comprehensive report details'
    },
    outputSchema: {
      type: 'object',
      required: ['reports', 'artifacts'],
      properties: {
        mainReportPath: { type: 'string' },
        executiveSummaryPath: { type: 'string' },
        reports: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              path: { type: 'string' },
              format: { type: 'string' }
            }
          }
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
        wcagMapping: { type: 'string', description: 'Path to WCAG criteria mapping document' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'accessibility', 'reporting', 'documentation']
}));

// Phase 11: Remediation Plan
export const remediationPlanTask = defineTask('remediation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Remediation Plan Generation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Accessibility Remediation Strategist',
      task: 'Create actionable remediation plan to address accessibility violations',
      context: {
        projectName: args.projectName,
        prioritizedViolations: args.prioritizedViolations,
        wcagLevel: args.wcagLevel,
        complianceScore: args.complianceScore,
        complianceLevel: args.complianceLevel,
        recommendations: args.recommendations,
        autoRemediation: args.autoRemediation,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create remediation tasks for each prioritized violation',
        '2. Group related violations into single remediation efforts',
        '3. Estimate effort (hours/days) for each task',
        '4. Assign priority (critical, high, medium, low)',
        '5. Define acceptance criteria for each fix',
        '6. Identify quick wins (high impact, low effort)',
        '7. Create phased remediation roadmap',
        '8. Calculate expected compliance improvement per phase',
        '9. Document technical implementation details',
        '10. Provide code examples for common fixes',
        '11. If auto-remediation enabled, generate fix suggestions',
        '12. Create tracking system for remediation progress',
        '13. Generate remediation plan document in Markdown'
      ],
      outputFormat: 'JSON object with remediation plan'
    },
    outputSchema: {
      type: 'object',
      required: ['tasks', 'estimatedEffort', 'expectedComplianceImprovement', 'quickWins', 'planPath', 'artifacts'],
      properties: {
        tasks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              priority: { type: 'string' },
              effort: { type: 'string' },
              affectedViolations: { type: 'array' },
              acceptanceCriteria: { type: 'array' },
              implementationNotes: { type: 'string' },
              codeExample: { type: 'string' }
            }
          }
        },
        estimatedEffort: { type: 'string', description: 'Total estimated hours' },
        expectedComplianceImprovement: { type: 'string', description: 'Expected score improvement' },
        quickWins: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              task: { type: 'string' },
              effort: { type: 'string' },
              impact: { type: 'string' }
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
              expectedImprovement: { type: 'number' }
            }
          }
        },
        planPath: { type: 'string' },
        taskListPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'accessibility', 'remediation', 'planning']
}));

// Phase 12: CI/CD Integration
export const cicdIntegrationTask = defineTask('cicd-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: CI/CD Integration - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DevOps Engineer specializing in Quality Gates',
      task: 'Set up CI/CD integration for automated accessibility testing',
      context: {
        projectName: args.projectName,
        framework: args.framework,
        wcagLevel: args.wcagLevel,
        pages: args.pages,
        breakOnCritical: args.breakOnCritical,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create CI/CD pipeline configuration for accessibility tests',
        '2. Configure test execution as part of pull request checks',
        '3. Set up quality gates (fail build on critical violations)',
        '4. Configure parallel test execution for faster feedback',
        '5. Set up artifact storage for accessibility reports',
        '6. Configure notifications for accessibility violations',
        '7. Create GitHub Actions / GitLab CI / Jenkins pipeline',
        '8. Set up baseline comparison (new vs existing violations)',
        '9. Configure accessibility regression prevention',
        '10. Create npm scripts for local testing',
        '11. Document CI/CD setup and usage',
        '12. Provide examples of pipeline integration'
      ],
      outputFormat: 'JSON object with CI/CD integration details'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'pipelineConfigPath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        pipelineConfigPath: { type: 'string' },
        ciPlatform: { type: 'string', description: 'GitHub Actions, GitLab CI, Jenkins, etc.' },
        qualityGates: {
          type: 'object',
          properties: {
            breakOnCritical: { type: 'boolean' },
            maxSeriousViolations: { type: 'number' },
            minimumScore: { type: 'number' }
          }
        },
        npmScripts: { type: 'array', items: { type: 'string' } },
        notificationChannels: { type: 'array', items: { type: 'string' } },
        documentationPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'accessibility', 'cicd', 'automation']
}));

// Phase 13: Accessibility Monitoring
export const accessibilityMonitoringTask = defineTask('accessibility-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 13: Accessibility Monitoring Setup - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Observability Engineer',
      task: 'Set up continuous accessibility monitoring and alerting',
      context: {
        projectName: args.projectName,
        wcagLevel: args.wcagLevel,
        complianceScore: args.complianceScore,
        pages: args.pages,
        framework: args.framework,
        alertThresholds: args.alertThresholds,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Set up scheduled accessibility scans (daily/weekly)',
        '2. Create accessibility metrics dashboard',
        '3. Track compliance score over time',
        '4. Monitor violation trends and patterns',
        '5. Set up alerts for regression (new violations)',
        '6. Configure alerts for compliance score drops',
        '7. Create accessibility health metrics',
        '8. Set up historical data retention',
        '9. Generate weekly accessibility reports',
        '10. Configure stakeholder notifications',
        '11. Create monitoring documentation',
        '12. Provide dashboard access instructions'
      ],
      outputFormat: 'JSON object with monitoring setup details'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'dashboardUrl', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        dashboardUrl: { type: 'string' },
        scanSchedule: { type: 'string' },
        metrics: {
          type: 'array',
          items: { type: 'string' }
        },
        alerts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              condition: { type: 'string' },
              threshold: { type: 'string' }
            }
          }
        },
        reportingFrequency: { type: 'string' },
        notificationRecipients: { type: 'array', items: { type: 'string' } },
        documentationPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'accessibility', 'monitoring', 'observability']
}));

// Phase 14: Final Accessibility Review
export const finalAccessibilityReviewTask = defineTask('final-accessibility-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 14: Final Accessibility Review - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Principal Accessibility Consultant',
      task: 'Conduct final comprehensive accessibility review and provide deployment recommendation',
      context: {
        projectName: args.projectName,
        wcagLevel: args.wcagLevel,
        complianceScore: args.complianceScore,
        complianceLevel: args.complianceLevel,
        meetsCompliance: args.meetsCompliance,
        violations: args.violations,
        recommendations: args.recommendations,
        remediationPlan: args.remediationPlan,
        accessibilityReport: args.accessibilityReport,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Review overall WCAG compliance status',
        '2. Assess whether target compliance level is achieved',
        '3. Evaluate severity and impact of remaining violations',
        '4. Review remediation plan feasibility',
        '5. Assess deployment readiness from accessibility perspective',
        '6. Identify any blocking accessibility issues',
        '7. Evaluate inclusive design implementation',
        '8. Review accessibility testing coverage',
        '9. Assess maintainability of accessibility implementation',
        '10. Provide clear deployment recommendation (approve/conditional/reject)',
        '11. List strengths and positive accessibility features',
        '12. Document concerns and risk areas',
        '13. Suggest follow-up actions and improvements',
        '14. Generate final review report'
      ],
      outputFormat: 'JSON object with final review and verdict'
    },
    outputSchema: {
      type: 'object',
      required: ['verdict', 'deploymentReady', 'recommendation', 'reportPath', 'artifacts'],
      properties: {
        verdict: { type: 'string', description: 'Overall accessibility assessment' },
        deploymentReady: { type: 'boolean' },
        complianceAchieved: { type: 'boolean' },
        confidence: { type: 'number', minimum: 0, maximum: 100 },
        recommendation: { type: 'string', enum: ['approve', 'conditional-approve', 'remediate-first', 'reject'] },
        strengths: { type: 'array', items: { type: 'string' } },
        concerns: { type: 'array', items: { type: 'string' } },
        blockingIssues: { type: 'array', items: { type: 'string' } },
        followUpActions: { type: 'array', items: { type: 'string' } },
        riskAssessment: {
          type: 'object',
          properties: {
            legalRisk: { type: 'string', enum: ['low', 'medium', 'high'] },
            reputationRisk: { type: 'string', enum: ['low', 'medium', 'high'] },
            userImpactRisk: { type: 'string', enum: ['low', 'medium', 'high'] }
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
  labels: ['agent', 'accessibility', 'review', 'final-approval']
}));
