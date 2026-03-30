/**
 * @process specializations/ux-ui-design/responsive-design
 * @description Responsive Design Implementation - Comprehensive responsive design process for creating adaptive,
 * mobile-first interfaces that work seamlessly across all devices and screen sizes, including breakpoint strategy,
 * fluid layouts, responsive typography, touch optimization, performance testing, and cross-device validation.
 * @inputs { projectName: string, pages?: array, components?: array, designSystem?: object, breakpoints?: object, approach?: string, performanceTargets?: object }
 * @outputs { success: boolean, responsiveDesigns: object, breakpointStrategy: object, testResults: object, performanceMetrics: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/ux-ui-design/responsive-design', {
 *   projectName: 'E-Commerce Platform',
 *   pages: ['home', 'product-listing', 'product-detail', 'checkout', 'account'],
 *   components: ['navigation', 'hero', 'product-card', 'footer', 'forms'],
 *   designSystem: { colors: {}, typography: {}, spacing: {} },
 *   breakpoints: { mobile: 320, tablet: 768, desktop: 1024, wide: 1440 },
 *   approach: 'mobile-first',
 *   performanceTargets: { lcp: '2.5s', fid: '100ms', cls: '0.1' }
 * });
 *
 * @references
 * - Responsive Web Design: https://alistapart.com/article/responsive-web-design/
 * - Mobile First: https://www.lukew.com/ff/entry.asp?933
 * - Responsive Images: https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images
 * - CSS Grid Layout: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout
 * - Flexbox Guide: https://css-tricks.com/snippets/css/a-guide-to-flexbox/
 * - Media Queries: https://developer.mozilla.org/en-US/docs/Web/CSS/Media_Queries
 * - Touch Target Guidelines: https://web.dev/accessible-tap-targets/
 * - Core Web Vitals: https://web.dev/vitals/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    pages = [],
    components = [],
    designSystem = null,
    breakpoints = {
      mobile: 320,
      mobileLarge: 480,
      tablet: 768,
      desktop: 1024,
      desktopLarge: 1280,
      wide: 1440
    },
    approach = 'mobile-first', // 'mobile-first', 'desktop-first', 'content-first'
    performanceTargets = {
      lcp: '2.5s', // Largest Contentful Paint
      fid: '100ms', // First Input Delay
      cls: '0.1', // Cumulative Layout Shift
      tti: '3.8s' // Time to Interactive
    },
    testDevices = ['iPhone SE', 'iPhone 14', 'iPad', 'Samsung Galaxy S21', 'Desktop 1920x1080'],
    includeAccessibility = true,
    includeTouchOptimization = true,
    includePerformanceTesting = true,
    outputDir = 'responsive-design-output',
    browserTargets = ['Chrome', 'Firefox', 'Safari', 'Edge'],
    contentStrategy = 'responsive', // 'responsive', 'adaptive', 'hybrid'
    imageStrategy = 'srcset-art-direction' // 'srcset', 'picture', 'srcset-art-direction'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let responsiveDesigns = {};
  let breakpointStrategy = {};
  let testResults = {};
  let performanceMetrics = {};
  const recommendations = [];

  ctx.log('info', `Starting Responsive Design Implementation: ${projectName}`);
  ctx.log('info', `Approach: ${approach}, Pages: ${pages.length}, Components: ${components.length}`);
  ctx.log('info', `Breakpoints: ${Object.entries(breakpoints).map(([name, width]) => `${name}:${width}px`).join(', ')}`);

  // ============================================================================
  // PHASE 1: RESPONSIVE DESIGN AUDIT AND ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Auditing existing designs and analyzing responsive requirements');

  const designAudit = await ctx.task(responsiveDesignAuditTask, {
    projectName,
    pages,
    components,
    designSystem,
    breakpoints,
    approach,
    outputDir
  });

  if (!designAudit.success) {
    return {
      success: false,
      error: 'Responsive design audit failed',
      details: designAudit,
      metadata: {
        processId: 'specializations/ux-ui-design/responsive-design',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...designAudit.artifacts);
  recommendations.push(...designAudit.recommendations);

  // Quality Gate: Design completeness check
  const missingDesigns = designAudit.missingDesigns || [];
  if (missingDesigns.length > 0) {
    await ctx.breakpoint({
      question: `Design audit found ${missingDesigns.length} missing responsive design(s): ${missingDesigns.join(', ')}. Review and create missing designs?`,
      title: 'Design Completeness Check',
      context: {
        runId: ctx.runId,
        missingDesigns,
        auditSummary: designAudit.summary,
        files: designAudit.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 2: BREAKPOINT STRATEGY DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 2: Defining breakpoint strategy and responsive grid system');

  const breakpointStrategyResult = await ctx.task(breakpointStrategyTask, {
    projectName,
    breakpoints,
    approach,
    designAudit,
    pages,
    components,
    contentStrategy,
    outputDir
  });

  artifacts.push(...breakpointStrategyResult.artifacts);
  breakpointStrategy = breakpointStrategyResult.strategy;

  ctx.log('info', `Breakpoint strategy defined: ${breakpointStrategy.breakpoints.length} breakpoints, ${breakpointStrategy.approach} approach`);

  // Breakpoint: Review breakpoint strategy
  await ctx.breakpoint({
    question: `Breakpoint strategy defined with ${breakpointStrategy.breakpoints.length} breakpoints using ${approach} approach. Review and approve strategy?`,
    title: 'Breakpoint Strategy Review',
    context: {
      runId: ctx.runId,
      strategy: breakpointStrategy,
      gridSystem: breakpointStrategyResult.gridSystem,
      files: [{
        path: breakpointStrategyResult.strategyDocPath,
        format: 'markdown',
        label: 'Breakpoint Strategy Document'
      }, {
        path: breakpointStrategyResult.gridSpecPath,
        format: 'json',
        label: 'Grid System Specification'
      }]
    }
  });

  // ============================================================================
  // PHASE 3: RESPONSIVE LAYOUT DESIGN (PARALLEL BY PAGE)
  // ============================================================================

  ctx.log('info', 'Phase 3: Designing responsive layouts for all pages in parallel');

  const layoutDesignTasks = pages.map(page =>
    () => ctx.task(responsiveLayoutDesignTask, {
      projectName,
      page,
      breakpointStrategy,
      approach,
      designAudit,
      designSystem,
      outputDir
    })
  );

  const layoutDesigns = await ctx.parallel.all(layoutDesignTasks);

  artifacts.push(...layoutDesigns.flatMap(d => d.artifacts));

  const layoutIssues = layoutDesigns.filter(d => d.issues && d.issues.length > 0);
  if (layoutIssues.length > 0) {
    ctx.log('warning', `Layout design issues found in ${layoutIssues.length} page(s)`);
  }

  // ============================================================================
  // PHASE 4: COMPONENT RESPONSIVE DESIGN (PARALLEL)
  // ============================================================================

  ctx.log('info', 'Phase 4: Designing responsive behavior for all components in parallel');

  const componentDesignTasks = components.map(component =>
    () => ctx.task(responsiveComponentDesignTask, {
      projectName,
      component,
      breakpointStrategy,
      approach,
      designSystem,
      includeTouchOptimization,
      outputDir
    })
  );

  const componentDesigns = await ctx.parallel.all(componentDesignTasks);

  artifacts.push(...componentDesigns.flatMap(d => d.artifacts));

  const componentIssues = componentDesigns.filter(d => d.issues && d.issues.length > 0);
  if (componentIssues.length > 0) {
    ctx.log('warning', `Responsive design issues found in ${componentIssues.length} component(s)`);
  }

  // ============================================================================
  // PHASE 5: RESPONSIVE TYPOGRAPHY AND SPACING
  // ============================================================================

  ctx.log('info', 'Phase 5: Designing responsive typography and spacing scales');

  const typographySpacing = await ctx.task(responsiveTypographySpacingTask, {
    projectName,
    breakpointStrategy,
    designSystem,
    layoutDesigns,
    componentDesigns,
    approach,
    outputDir
  });

  artifacts.push(...typographySpacing.artifacts);
  recommendations.push(...typographySpacing.recommendations);

  // ============================================================================
  // PHASE 6: RESPONSIVE IMAGE AND MEDIA STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 6: Defining responsive image and media strategy');

  const imageMediaStrategy = await ctx.task(responsiveImageMediaTask, {
    projectName,
    breakpointStrategy,
    imageStrategy,
    pages,
    performanceTargets,
    outputDir
  });

  artifacts.push(...imageMediaStrategy.artifacts);
  recommendations.push(...imageMediaStrategy.recommendations);

  // ============================================================================
  // PHASE 7: TOUCH TARGET OPTIMIZATION
  // ============================================================================

  let touchOptimization = null;
  if (includeTouchOptimization) {
    ctx.log('info', 'Phase 7: Optimizing touch targets for mobile devices');

    touchOptimization = await ctx.task(touchTargetOptimizationTask, {
      projectName,
      pages,
      components,
      layoutDesigns,
      componentDesigns,
      breakpointStrategy,
      outputDir
    });

    artifacts.push(...touchOptimization.artifacts);
    recommendations.push(...touchOptimization.recommendations);

    // Quality Gate: Touch target compliance
    const touchIssues = touchOptimization.violations || [];
    if (touchIssues.length > 0) {
      await ctx.breakpoint({
        question: `Found ${touchIssues.length} touch target violations (minimum 44x44px). ${touchOptimization.criticalIssues} are critical. Review and fix?`,
        title: 'Touch Target Compliance',
        context: {
          runId: ctx.runId,
          violations: touchIssues.slice(0, 20),
          criticalIssues: touchOptimization.criticalIssues,
          complianceRate: touchOptimization.complianceRate,
          files: [{
            path: touchOptimization.reportPath,
            format: 'html',
            label: 'Touch Target Audit Report'
          }]
        }
      });
    }
  }

  // ============================================================================
  // PHASE 8: RESPONSIVE NAVIGATION DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 8: Designing responsive navigation patterns');

  const navigationDesign = await ctx.task(responsiveNavigationDesignTask, {
    projectName,
    breakpointStrategy,
    layoutDesigns,
    approach,
    includeTouchOptimization,
    outputDir
  });

  artifacts.push(...navigationDesign.artifacts);

  // ============================================================================
  // PHASE 9: ACCESSIBILITY VALIDATION
  // ============================================================================

  let accessibilityValidation = null;
  if (includeAccessibility) {
    ctx.log('info', 'Phase 9: Validating accessibility across responsive breakpoints');

    accessibilityValidation = await ctx.task(responsiveAccessibilityTask, {
      projectName,
      breakpointStrategy,
      layoutDesigns,
      componentDesigns,
      navigationDesign,
      typographySpacing,
      touchOptimization,
      outputDir
    });

    artifacts.push(...accessibilityValidation.artifacts);
    recommendations.push(...accessibilityValidation.recommendations);

    // Quality Gate: Accessibility compliance
    const a11yIssues = accessibilityValidation.violations || [];
    if (a11yIssues.length > 0) {
      const criticalA11y = a11yIssues.filter(v => v.severity === 'critical').length;

      await ctx.breakpoint({
        question: `Found ${a11yIssues.length} accessibility issues in responsive designs (${criticalA11y} critical). Review and remediate?`,
        title: 'Responsive Accessibility Review',
        context: {
          runId: ctx.runId,
          totalIssues: a11yIssues.length,
          criticalIssues: criticalA11y,
          issues: a11yIssues.slice(0, 15),
          complianceScore: accessibilityValidation.complianceScore,
          files: [{
            path: accessibilityValidation.reportPath,
            format: 'html',
            label: 'Accessibility Report'
          }]
        }
      });
    }
  }

  // ============================================================================
  // PHASE 10: CROSS-DEVICE TESTING
  // ============================================================================

  ctx.log('info', 'Phase 10: Testing responsive designs across devices');

  const crossDeviceTesting = await ctx.task(crossDeviceTestingTask, {
    projectName,
    pages,
    testDevices,
    breakpointStrategy,
    browserTargets,
    layoutDesigns,
    componentDesigns,
    outputDir
  });

  artifacts.push(...crossDeviceTesting.artifacts);
  testResults = crossDeviceTesting.results;

  const failedTests = testResults.failed || 0;
  if (failedTests > 0) {
    ctx.log('warning', `${failedTests} cross-device tests failed`);
  }

  // Quality Gate: Cross-device testing results
  const testPassRate = (testResults.passed / testResults.total) * 100;
  if (testPassRate < 95) {
    await ctx.breakpoint({
      question: `Cross-device testing: ${testPassRate.toFixed(1)}% pass rate (${testResults.passed}/${testResults.total} tests passed). ${failedTests} failures. Review and fix issues?`,
      title: 'Cross-Device Testing Results',
      context: {
        runId: ctx.runId,
        passRate: testPassRate,
        testResults,
        failedDevices: crossDeviceTesting.failedDevices,
        files: [{
          path: crossDeviceTesting.reportPath,
          format: 'html',
          label: 'Cross-Device Test Report'
        }, {
          path: crossDeviceTesting.screenshotsPath,
          format: 'directory',
          label: 'Device Screenshots'
        }]
      }
    });
  }

  // ============================================================================
  // PHASE 11: PERFORMANCE TESTING
  // ============================================================================

  let performanceTesting = null;
  if (includePerformanceTesting) {
    ctx.log('info', 'Phase 11: Testing responsive performance across breakpoints');

    performanceTesting = await ctx.task(responsivePerformanceTestingTask, {
      projectName,
      pages,
      breakpointStrategy,
      performanceTargets,
      testDevices,
      imageMediaStrategy,
      outputDir
    });

    artifacts.push(...performanceTesting.artifacts);
    performanceMetrics = performanceTesting.metrics;

    // Quality Gate: Performance targets
    const meetsTargets = performanceTesting.meetsAllTargets;
    if (!meetsTargets) {
      const failedMetrics = performanceTesting.failedMetrics || [];

      await ctx.breakpoint({
        question: `Performance targets not met. ${failedMetrics.length} metric(s) failed: ${failedMetrics.map(m => m.metric).join(', ')}. Optimize and retest?`,
        title: 'Responsive Performance Review',
        context: {
          runId: ctx.runId,
          meetsTargets,
          targets: performanceTargets,
          metrics: performanceMetrics,
          failedMetrics,
          files: [{
            path: performanceTesting.reportPath,
            format: 'html',
            label: 'Performance Report'
          }, {
            path: performanceTesting.lighthousePath,
            format: 'json',
            label: 'Lighthouse Results'
          }]
        }
      });
    }
  }

  // ============================================================================
  // PHASE 12: RESPONSIVE DESIGN SYSTEM DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 12: Generating responsive design system documentation');

  const designSystemDocs = await ctx.task(responsiveDesignSystemDocsTask, {
    projectName,
    breakpointStrategy,
    layoutDesigns,
    componentDesigns,
    typographySpacing,
    imageMediaStrategy,
    navigationDesign,
    touchOptimization,
    designSystem,
    outputDir
  });

  artifacts.push(...designSystemDocs.artifacts);

  // ============================================================================
  // PHASE 13: IMPLEMENTATION GUIDELINES
  // ============================================================================

  ctx.log('info', 'Phase 13: Creating implementation guidelines and code examples');

  const implementationGuide = await ctx.task(implementationGuidelinesTask, {
    projectName,
    breakpointStrategy,
    layoutDesigns,
    componentDesigns,
    typographySpacing,
    imageMediaStrategy,
    navigationDesign,
    approach,
    browserTargets,
    outputDir
  });

  artifacts.push(...implementationGuide.artifacts);

  // ============================================================================
  // PHASE 14: RESPONSIVE QA CHECKLIST
  // ============================================================================

  ctx.log('info', 'Phase 14: Generating responsive QA checklist and testing guide');

  const qaChecklist = await ctx.task(responsiveQAChecklistTask, {
    projectName,
    pages,
    components,
    breakpointStrategy,
    testDevices,
    performanceTargets,
    includeAccessibility,
    includeTouchOptimization,
    crossDeviceTesting,
    performanceTesting,
    accessibilityValidation,
    outputDir
  });

  artifacts.push(...qaChecklist.artifacts);

  // ============================================================================
  // PHASE 15: COMPREHENSIVE RESPONSIVE DESIGN REPORT
  // ============================================================================

  ctx.log('info', 'Phase 15: Generating comprehensive responsive design report');

  const comprehensiveReport = await ctx.task(comprehensiveResponsiveReportTask, {
    projectName,
    approach,
    breakpointStrategy,
    layoutDesigns,
    componentDesigns,
    typographySpacing,
    imageMediaStrategy,
    navigationDesign,
    touchOptimization,
    accessibilityValidation,
    crossDeviceTesting,
    performanceTesting,
    recommendations,
    outputDir
  });

  artifacts.push(...comprehensiveReport.artifacts);

  responsiveDesigns = {
    layouts: layoutDesigns,
    components: componentDesigns,
    typography: typographySpacing,
    images: imageMediaStrategy,
    navigation: navigationDesign
  };

  // ============================================================================
  // PHASE 16: FINAL RESPONSIVE DESIGN REVIEW
  // ============================================================================

  ctx.log('info', 'Phase 16: Conducting final responsive design review');

  const finalReview = await ctx.task(finalResponsiveReviewTask, {
    projectName,
    approach,
    breakpointStrategy,
    responsiveDesigns,
    testResults,
    performanceMetrics,
    accessibilityValidation,
    touchOptimization,
    recommendations,
    performanceTargets,
    includeAccessibility,
    includeTouchOptimization,
    outputDir
  });

  artifacts.push(...finalReview.artifacts);

  // Final Breakpoint: Design approval
  const approvalNeeded = !finalReview.readyForImplementation;

  await ctx.breakpoint({
    question: `Responsive design ${finalReview.readyForImplementation ? 'COMPLETE' : 'NEEDS REVIEW'}. ${pages.length} pages, ${components.length} components across ${breakpointStrategy.breakpoints.length} breakpoints. Cross-device tests: ${testPassRate.toFixed(1)}% pass rate. ${finalReview.verdict}. Approve for implementation?`,
    title: 'Final Responsive Design Approval',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        approach,
        pagesDesigned: pages.length,
        componentsDesigned: components.length,
        breakpoints: breakpointStrategy.breakpoints.length,
        testPassRate,
        performanceMet: performanceTesting?.meetsAllTargets,
        accessibilityCompliant: accessibilityValidation?.compliant,
        touchOptimized: touchOptimization?.complianceRate
      },
      verdict: finalReview.verdict,
      readyForImplementation: finalReview.readyForImplementation,
      blockers: finalReview.blockers,
      recommendations: finalReview.topRecommendations,
      files: [
        { path: comprehensiveReport.mainReportPath, format: 'html', label: 'Comprehensive Report' },
        { path: designSystemDocs.documentationPath, format: 'markdown', label: 'Design System Docs' },
        { path: implementationGuide.guidePath, format: 'markdown', label: 'Implementation Guide' },
        { path: qaChecklist.checklistPath, format: 'markdown', label: 'QA Checklist' },
        { path: finalReview.reportPath, format: 'markdown', label: 'Final Review' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    approach,
    breakpointStrategy: {
      approach: breakpointStrategy.approach,
      breakpoints: breakpointStrategy.breakpoints,
      gridSystem: breakpointStrategy.gridSystem
    },
    responsiveDesigns: {
      layouts: {
        total: layoutDesigns.length,
        successful: layoutDesigns.filter(d => d.success).length,
        withIssues: layoutIssues.length
      },
      components: {
        total: componentDesigns.length,
        successful: componentDesigns.filter(d => d.success).length,
        withIssues: componentIssues.length
      },
      typography: typographySpacing.scales,
      images: imageMediaStrategy.strategy,
      navigation: navigationDesign.pattern
    },
    testResults: {
      crossDevice: {
        total: testResults.total,
        passed: testResults.passed,
        failed: testResults.failed,
        passRate: testPassRate,
        devices: testDevices.length,
        browsers: browserTargets.length
      },
      performance: performanceTesting ? {
        meetsTargets: performanceTesting.meetsAllTargets,
        metrics: performanceMetrics,
        failedMetrics: performanceTesting.failedMetrics?.length || 0
      } : null,
      accessibility: accessibilityValidation ? {
        compliant: accessibilityValidation.compliant,
        issues: accessibilityValidation.violations?.length || 0,
        criticalIssues: accessibilityValidation.violations?.filter(v => v.severity === 'critical').length || 0,
        complianceScore: accessibilityValidation.complianceScore
      } : null,
      touchTargets: touchOptimization ? {
        complianceRate: touchOptimization.complianceRate,
        violations: touchOptimization.violations?.length || 0,
        criticalIssues: touchOptimization.criticalIssues
      } : null
    },
    finalReview: {
      verdict: finalReview.verdict,
      readyForImplementation: finalReview.readyForImplementation,
      confidence: finalReview.confidence,
      strengths: finalReview.strengths,
      blockers: finalReview.blockers,
      recommendations: finalReview.topRecommendations
    },
    artifacts,
    recommendations,
    duration,
    metadata: {
      processId: 'specializations/ux-ui-design/responsive-design',
      timestamp: startTime,
      approach,
      breakpointCount: breakpointStrategy.breakpoints.length,
      pagesDesigned: pages.length,
      componentsDesigned: components.length
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: Responsive Design Audit
export const responsiveDesignAuditTask = defineTask('responsive-design-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Responsive Design Audit - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'UX/UI Designer specializing in Responsive Design',
      task: 'Audit existing designs and analyze responsive design requirements',
      context: {
        projectName: args.projectName,
        pages: args.pages,
        components: args.components,
        designSystem: args.designSystem,
        breakpoints: args.breakpoints,
        approach: args.approach,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Review all provided pages and components for existing designs',
        '2. Identify which pages/components have responsive designs vs. single breakpoint',
        '3. Analyze content complexity and layout requirements for each page',
        '4. Identify responsive design patterns needed (fluid grids, flexible images, media queries)',
        '5. Review design system for responsive tokens and components',
        '6. Identify missing responsive designs that need to be created',
        '7. Analyze content priority for mobile-first approach',
        '8. Document layout complexity and responsive challenges',
        '9. Create audit summary with findings and recommendations',
        '10. Generate list of design deliverables needed',
        '11. Identify potential responsive design issues or constraints',
        '12. Provide recommendations for responsive design approach'
      ],
      outputFormat: 'JSON object with audit findings and recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'summary', 'missingDesigns', 'recommendations', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        summary: {
          type: 'object',
          properties: {
            totalPages: { type: 'number' },
            totalComponents: { type: 'number' },
            pagesWithResponsiveDesigns: { type: 'number' },
            componentsWithResponsiveDesigns: { type: 'number' },
            designSystemMaturity: { type: 'string', enum: ['none', 'basic', 'intermediate', 'advanced'] }
          }
        },
        missingDesigns: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of pages/components missing responsive designs'
        },
        layoutComplexity: {
          type: 'object',
          properties: {
            simple: { type: 'array', items: { type: 'string' } },
            moderate: { type: 'array', items: { type: 'string' } },
            complex: { type: 'array', items: { type: 'string' } }
          }
        },
        responsiveChallenges: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              page: { type: 'string' },
              challenge: { type: 'string' },
              severity: { type: 'string', enum: ['low', 'medium', 'high'] }
            }
          }
        },
        contentPriority: {
          type: 'object',
          description: 'Content hierarchy for mobile-first design'
        },
        recommendations: {
          type: 'array',
          items: { type: 'string' }
        },
        auditReportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'responsive-design', 'audit', 'ux-ui']
}));

// Phase 2: Breakpoint Strategy
export const breakpointStrategyTask = defineTask('breakpoint-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Breakpoint Strategy - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Responsive Design Architect',
      task: 'Define comprehensive breakpoint strategy and responsive grid system',
      context: {
        projectName: args.projectName,
        breakpoints: args.breakpoints,
        approach: args.approach,
        designAudit: args.designAudit,
        pages: args.pages,
        components: args.components,
        contentStrategy: args.contentStrategy,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze provided breakpoints and content requirements',
        '2. Define breakpoint strategy (mobile-first, desktop-first, or content-first)',
        '3. Establish major and minor breakpoints based on content and design needs',
        '4. Design fluid grid system with responsive columns',
        '5. Define container widths and max-widths for each breakpoint',
        '6. Establish spacing scale that adapts across breakpoints',
        '7. Define viewport meta tag strategy',
        '8. Document media query approach (min-width, max-width, or both)',
        '9. Create responsive grid specifications (12-column, flexbox, CSS Grid)',
        '10. Define gutter sizes for each breakpoint',
        '11. Establish content reflow strategies',
        '12. Document breakpoint naming conventions',
        '13. Create visual breakpoint diagram',
        '14. Generate CSS/SCSS breakpoint mixins or custom properties'
      ],
      outputFormat: 'JSON object with breakpoint strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'gridSystem', 'strategyDocPath', 'artifacts'],
      properties: {
        strategy: {
          type: 'object',
          properties: {
            approach: { type: 'string', enum: ['mobile-first', 'desktop-first', 'content-first'] },
            breakpoints: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  minWidth: { type: 'number' },
                  maxWidth: { type: 'number' },
                  containerWidth: { type: 'string' },
                  columns: { type: 'number' },
                  gutter: { type: 'string' },
                  margin: { type: 'string' }
                }
              }
            },
            mediaQueryStrategy: { type: 'string' }
          }
        },
        gridSystem: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['flexbox', 'css-grid', 'hybrid'] },
            columns: { type: 'number' },
            baseGutter: { type: 'string' },
            baseMargin: { type: 'string' },
            fluidGrid: { type: 'boolean' }
          }
        },
        spacingScale: {
          type: 'object',
          description: 'Responsive spacing scale across breakpoints'
        },
        strategyDocPath: { type: 'string' },
        gridSpecPath: { type: 'string' },
        mediaQueryMixinsPath: { type: 'string' },
        visualDiagramPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'responsive-design', 'breakpoints', 'grid-system']
}));

// Phase 3: Responsive Layout Design
export const responsiveLayoutDesignTask = defineTask('responsive-layout-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Layout Design - ${args.page}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'UX/UI Designer',
      task: 'Design responsive layouts for specific page across all breakpoints',
      context: {
        projectName: args.projectName,
        page: args.page,
        breakpointStrategy: args.breakpointStrategy,
        approach: args.approach,
        designAudit: args.designAudit,
        designSystem: args.designSystem,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze content and layout requirements for the page',
        '2. Design layout for each breakpoint following the defined approach',
        '3. Create responsive wireframes showing layout at each breakpoint',
        '4. Define content reflow and stacking behavior',
        '5. Specify column spans and grid usage at each breakpoint',
        '6. Design responsive navigation placement',
        '7. Define image and media scaling behavior',
        '8. Specify spacing and padding adjustments across breakpoints',
        '9. Design responsive hero sections and featured content',
        '10. Plan sidebar and auxiliary content behavior',
        '11. Create layout specifications with measurements',
        '12. Document layout patterns and reusable structures',
        '13. Identify any layout challenges or issues',
        '14. Generate design files (Figma/Sketch) or mockups for each breakpoint'
      ],
      outputFormat: 'JSON object with responsive layout designs'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'page', 'layouts', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        page: { type: 'string' },
        layouts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              breakpoint: { type: 'string' },
              layoutType: { type: 'string' },
              columns: { type: 'number' },
              contentFlow: { type: 'string' },
              designFile: { type: 'string' }
            }
          }
        },
        contentHierarchy: {
          type: 'object',
          description: 'Content priority and stacking order for mobile'
        },
        layoutPatterns: {
          type: 'array',
          items: { type: 'string' }
        },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              breakpoint: { type: 'string' },
              issue: { type: 'string' },
              severity: { type: 'string' }
            }
          }
        },
        specificationPath: { type: 'string' },
        wireframesPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'responsive-design', 'layout', 'wireframes']
}));

// Phase 4: Responsive Component Design
export const responsiveComponentDesignTask = defineTask('responsive-component-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Component Design - ${args.component}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'UI Component Designer',
      task: 'Design responsive behavior for UI component across breakpoints',
      context: {
        projectName: args.projectName,
        component: args.component,
        breakpointStrategy: args.breakpointStrategy,
        approach: args.approach,
        designSystem: args.designSystem,
        includeTouchOptimization: args.includeTouchOptimization,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze component structure and interactive elements',
        '2. Design component appearance at each breakpoint',
        '3. Define responsive sizing and scaling behavior',
        '4. Specify touch target sizes for mobile (minimum 44x44px)',
        '5. Design stacked vs. horizontal layouts across breakpoints',
        '6. Define responsive typography within component',
        '7. Specify padding, margin, and spacing adjustments',
        '8. Design responsive iconography and imagery',
        '9. Define interaction states (hover, active, focus) for all breakpoints',
        '10. Document component variants for different breakpoints',
        '11. Create responsive component specifications',
        '12. Identify accessibility considerations per breakpoint',
        '13. Document any breakpoint-specific behavior or interactions',
        '14. Generate design files or mockups for component variations'
      ],
      outputFormat: 'JSON object with responsive component design'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'component', 'variations', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        component: { type: 'string' },
        variations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              breakpoint: { type: 'string' },
              layout: { type: 'string', enum: ['stacked', 'horizontal', 'grid', 'hybrid'] },
              minTouchTarget: { type: 'string' },
              responsiveBehavior: { type: 'string' },
              designFile: { type: 'string' }
            }
          }
        },
        touchTargets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              element: { type: 'string' },
              size: { type: 'string' },
              meetsMinimum: { type: 'boolean' }
            }
          }
        },
        responsiveStates: { type: 'object' },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              breakpoint: { type: 'string' },
              issue: { type: 'string' },
              severity: { type: 'string' }
            }
          }
        },
        specificationPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'responsive-design', 'component', 'ui-design']
}));

// Phase 5: Responsive Typography and Spacing
export const responsiveTypographySpacingTask = defineTask('responsive-typography-spacing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Typography & Spacing - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Typography and Visual Design Specialist',
      task: 'Design responsive typography and spacing scales across breakpoints',
      context: {
        projectName: args.projectName,
        breakpointStrategy: args.breakpointStrategy,
        designSystem: args.designSystem,
        layoutDesigns: args.layoutDesigns,
        componentDesigns: args.componentDesigns,
        approach: args.approach,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define responsive type scale using fluid typography or breakpoint-based',
        '2. Establish base font size for each breakpoint (typically 16px)',
        '3. Create modular scale for headings across breakpoints',
        '4. Define line-height adjustments for different screen sizes',
        '5. Specify optimal line length (50-75 characters) at each breakpoint',
        '6. Design responsive spacing scale (margins, paddings, gaps)',
        '7. Create fluid spacing using viewport units or calc()',
        '8. Define minimum and maximum font sizes',
        '9. Establish responsive hierarchy with size, weight, and spacing',
        '10. Design responsive letter-spacing adjustments',
        '11. Specify font loading strategy for performance',
        '12. Create CSS custom properties or SCSS variables',
        '13. Document typography usage guidelines',
        '14. Generate code snippets for implementation'
      ],
      outputFormat: 'JSON object with responsive typography and spacing'
    },
    outputSchema: {
      type: 'object',
      required: ['scales', 'recommendations', 'artifacts'],
      properties: {
        scales: {
          type: 'object',
          properties: {
            typography: {
              type: 'object',
              description: 'Font sizes, line-heights, and scales per breakpoint'
            },
            spacing: {
              type: 'object',
              description: 'Spacing scale (margins, paddings) per breakpoint'
            },
            fluidTypography: {
              type: 'boolean',
              description: 'Whether fluid typography is used'
            }
          }
        },
        typeScale: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              breakpoint: { type: 'string' },
              fontSize: { type: 'string' },
              lineHeight: { type: 'string' },
              letterSpacing: { type: 'string' }
            }
          }
        },
        spacingScale: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              breakpoint: { type: 'string' },
              value: { type: 'string' }
            }
          }
        },
        recommendations: {
          type: 'array',
          items: { type: 'string' }
        },
        cssVariablesPath: { type: 'string' },
        documentationPath: { type: 'string' },
        codeSnippetsPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'responsive-design', 'typography', 'spacing']
}));

// Phase 6: Responsive Image and Media
export const responsiveImageMediaTask = defineTask('responsive-image-media', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Image & Media Strategy - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Frontend Performance and Media Optimization Specialist',
      task: 'Define responsive image and media strategy for optimal performance',
      context: {
        projectName: args.projectName,
        breakpointStrategy: args.breakpointStrategy,
        imageStrategy: args.imageStrategy,
        pages: args.pages,
        performanceTargets: args.performanceTargets,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define responsive image strategy (srcset, picture element, art direction)',
        '2. Specify image sizes for each breakpoint',
        '3. Create srcset declarations with appropriate descriptors (w, x)',
        '4. Design art direction rules for picture element if needed',
        '5. Define image format strategy (WebP, AVIF, fallbacks)',
        '6. Specify lazy loading strategy for images',
        '7. Define responsive video embedding strategy',
        '8. Create aspect ratio preservation techniques',
        '9. Specify image compression targets',
        '10. Design background image responsive strategy',
        '11. Define icon delivery strategy (SVG, icon fonts, sprites)',
        '12. Create image optimization guidelines',
        '13. Document CDN and image service integration',
        '14. Generate code examples for responsive images'
      ],
      outputFormat: 'JSON object with image and media strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'recommendations', 'artifacts'],
      properties: {
        strategy: {
          type: 'object',
          properties: {
            approach: { type: 'string' },
            formats: { type: 'array', items: { type: 'string' } },
            lazyLoading: { type: 'boolean' },
            artDirection: { type: 'boolean' }
          }
        },
        imageSizes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              breakpoint: { type: 'string' },
              maxWidth: { type: 'string' },
              recommendedSizes: { type: 'array' }
            }
          }
        },
        srcsetTemplates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              template: { type: 'string' },
              example: { type: 'string' }
            }
          }
        },
        videoStrategy: {
          type: 'object',
          properties: {
            embedType: { type: 'string' },
            responsiveWrapper: { type: 'boolean' },
            autoplay: { type: 'string' }
          }
        },
        compressionTargets: {
          type: 'object',
          description: 'Image quality and file size targets'
        },
        recommendations: {
          type: 'array',
          items: { type: 'string' }
        },
        strategyDocPath: { type: 'string' },
        codeExamplesPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'responsive-design', 'images', 'media', 'performance']
}));

// Phase 7: Touch Target Optimization
export const touchTargetOptimizationTask = defineTask('touch-target-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Touch Target Optimization - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Mobile UX Specialist',
      task: 'Audit and optimize touch targets for mobile devices',
      context: {
        projectName: args.projectName,
        pages: args.pages,
        components: args.components,
        layoutDesigns: args.layoutDesigns,
        componentDesigns: args.componentDesigns,
        breakpointStrategy: args.breakpointStrategy,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Audit all interactive elements across pages and components',
        '2. Verify touch target sizes meet minimum 44x44px (WCAG 2.1 AA)',
        '3. Check spacing between adjacent touch targets (minimum 8px)',
        '4. Identify elements that need size increase on mobile',
        '5. Verify tap area includes padding for easier targeting',
        '6. Check thumb reach zones for primary actions',
        '7. Analyze button and link sizing across breakpoints',
        '8. Verify form input sizes on mobile devices',
        '9. Check navigation menu item touch targets',
        '10. Audit modal close buttons and overlay touch areas',
        '11. Document all touch target violations',
        '12. Provide specific remediation for each violation',
        '13. Generate compliance report with pass/fail status',
        '14. Create visual heat map of touch target issues'
      ],
      outputFormat: 'JSON object with touch target audit results'
    },
    outputSchema: {
      type: 'object',
      required: ['complianceRate', 'violations', 'criticalIssues', 'recommendations', 'reportPath', 'artifacts'],
      properties: {
        complianceRate: { type: 'number', minimum: 0, maximum: 100 },
        totalElements: { type: 'number' },
        compliantElements: { type: 'number' },
        violations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              page: { type: 'string' },
              element: { type: 'string' },
              currentSize: { type: 'string' },
              minimumRequired: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              recommendation: { type: 'string' }
            }
          }
        },
        criticalIssues: { type: 'number' },
        thumbReachAnalysis: {
          type: 'object',
          properties: {
            primaryActionsInReach: { type: 'boolean' },
            issues: { type: 'array' }
          }
        },
        recommendations: {
          type: 'array',
          items: { type: 'string' }
        },
        reportPath: { type: 'string' },
        heatMapPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'responsive-design', 'mobile', 'touch-targets', 'accessibility']
}));

// Phase 8: Responsive Navigation Design
export const responsiveNavigationDesignTask = defineTask('responsive-navigation-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Navigation Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Navigation and Information Architecture Designer',
      task: 'Design responsive navigation patterns across breakpoints',
      context: {
        projectName: args.projectName,
        breakpointStrategy: args.breakpointStrategy,
        layoutDesigns: args.layoutDesigns,
        approach: args.approach,
        includeTouchOptimization: args.includeTouchOptimization,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design mobile navigation pattern (hamburger, bottom nav, tab bar)',
        '2. Create tablet navigation layout (hybrid approach)',
        '3. Design desktop navigation (horizontal, mega menu, or sidebar)',
        '4. Define navigation breakpoints and transitions',
        '5. Design mobile menu overlay or slide-out drawer',
        '6. Specify touch-friendly menu item sizes',
        '7. Design nested navigation and sub-menu behavior',
        '8. Create breadcrumb navigation responsive behavior',
        '9. Design search functionality placement across breakpoints',
        '10. Define mobile menu animation and transitions',
        '11. Specify keyboard navigation and focus management',
        '12. Design sticky/fixed navigation behavior',
        '13. Create navigation accessibility specifications',
        '14. Document navigation interaction patterns'
      ],
      outputFormat: 'JSON object with responsive navigation design'
    },
    outputSchema: {
      type: 'object',
      required: ['pattern', 'navigationDesigns', 'artifacts'],
      properties: {
        pattern: {
          type: 'object',
          properties: {
            mobile: { type: 'string' },
            tablet: { type: 'string' },
            desktop: { type: 'string' }
          }
        },
        navigationDesigns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              breakpoint: { type: 'string' },
              type: { type: 'string' },
              placement: { type: 'string' },
              interaction: { type: 'string' },
              designFile: { type: 'string' }
            }
          }
        },
        mobileMenuSpec: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            animation: { type: 'string' },
            overlay: { type: 'boolean' },
            closeButton: { type: 'string' }
          }
        },
        accessibility: {
          type: 'object',
          properties: {
            keyboardNavigation: { type: 'boolean' },
            ariaLabels: { type: 'object' },
            focusManagement: { type: 'string' }
          }
        },
        specificationPath: { type: 'string' },
        interactionDocPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'responsive-design', 'navigation', 'mobile-menu']
}));

// Phase 9: Responsive Accessibility
export const responsiveAccessibilityTask = defineTask('responsive-accessibility', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Accessibility Validation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Accessibility Specialist',
      task: 'Validate accessibility across responsive breakpoints',
      context: {
        projectName: args.projectName,
        breakpointStrategy: args.breakpointStrategy,
        layoutDesigns: args.layoutDesigns,
        componentDesigns: args.componentDesigns,
        navigationDesign: args.navigationDesign,
        typographySpacing: args.typographySpacing,
        touchOptimization: args.touchOptimization,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Verify WCAG 2.1 AA compliance at all breakpoints',
        '2. Check color contrast meets requirements on all screen sizes',
        '3. Verify touch target sizes (44x44px minimum)',
        '4. Test keyboard navigation across breakpoints',
        '5. Verify focus indicators are visible at all sizes',
        '6. Check text scaling up to 200% without loss of content',
        '7. Verify orientation support (portrait and landscape)',
        '8. Check reflow at 320px width (WCAG 2.1 Reflow criterion)',
        '9. Verify ARIA labels and semantic HTML',
        '10. Test screen reader compatibility at different breakpoints',
        '11. Check heading hierarchy consistency across breakpoints',
        '12. Verify form labels and error messages are accessible',
        '13. Document all accessibility violations',
        '14. Generate WCAG compliance report'
      ],
      outputFormat: 'JSON object with accessibility validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['compliant', 'complianceScore', 'violations', 'recommendations', 'reportPath', 'artifacts'],
      properties: {
        compliant: { type: 'boolean' },
        complianceScore: { type: 'number', minimum: 0, maximum: 100 },
        wcagLevel: { type: 'string', enum: ['A', 'AA', 'AAA', 'Non-compliant'] },
        violations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              breakpoint: { type: 'string' },
              page: { type: 'string' },
              issue: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              remediation: { type: 'string' }
            }
          }
        },
        colorContrast: {
          type: 'object',
          properties: {
            passed: { type: 'number' },
            failed: { type: 'number' },
            failedElements: { type: 'array' }
          }
        },
        touchTargets: {
          type: 'object',
          properties: {
            compliant: { type: 'boolean' },
            violations: { type: 'number' }
          }
        },
        keyboardNavigation: {
          type: 'object',
          properties: {
            accessible: { type: 'boolean' },
            issues: { type: 'array' }
          }
        },
        textScaling: {
          type: 'object',
          properties: {
            supported: { type: 'boolean' },
            issues: { type: 'array' }
          }
        },
        recommendations: {
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
  labels: ['agent', 'responsive-design', 'accessibility', 'wcag']
}));

// Phase 10: Cross-Device Testing
export const crossDeviceTestingTask = defineTask('cross-device-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Cross-Device Testing - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'QA Engineer specializing in Responsive Testing',
      task: 'Test responsive designs across multiple devices and browsers',
      context: {
        projectName: args.projectName,
        pages: args.pages,
        testDevices: args.testDevices,
        breakpointStrategy: args.breakpointStrategy,
        browserTargets: args.browserTargets,
        layoutDesigns: args.layoutDesigns,
        componentDesigns: args.componentDesigns,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Set up testing environment with device emulators and real devices',
        '2. Test each page on all specified devices and browsers',
        '3. Verify layout rendering at each breakpoint',
        '4. Test orientation changes (portrait to landscape)',
        '5. Verify touch interactions on mobile devices',
        '6. Test scrolling behavior and parallax effects',
        '7. Verify navigation functionality across devices',
        '8. Test form inputs and interactions on touch devices',
        '9. Capture screenshots at each breakpoint for each device',
        '10. Document layout issues, overflow, and rendering bugs',
        '11. Test edge cases (very small screens, very large screens)',
        '12. Verify consistent behavior across browsers',
        '13. Create device compatibility matrix',
        '14. Generate comprehensive test report with screenshots'
      ],
      outputFormat: 'JSON object with cross-device test results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'reportPath', 'artifacts'],
      properties: {
        results: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            passed: { type: 'number' },
            failed: { type: 'number' },
            passRate: { type: 'number' }
          }
        },
        deviceResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              device: { type: 'string' },
              browser: { type: 'string' },
              passed: { type: 'number' },
              failed: { type: 'number' },
              issues: { type: 'array' }
            }
          }
        },
        failedDevices: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              device: { type: 'string' },
              browser: { type: 'string' },
              page: { type: 'string' },
              issue: { type: 'string' },
              severity: { type: 'string' }
            }
          }
        },
        layoutIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              page: { type: 'string' },
              device: { type: 'string' },
              breakpoint: { type: 'string' },
              issue: { type: 'string' },
              screenshot: { type: 'string' }
            }
          }
        },
        compatibilityMatrix: { type: 'string', description: 'Path to compatibility matrix' },
        reportPath: { type: 'string' },
        screenshotsPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'responsive-design', 'testing', 'cross-device', 'qa']
}));

// Phase 11: Responsive Performance Testing
export const responsivePerformanceTestingTask = defineTask('responsive-performance-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Performance Testing - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Performance Engineer',
      task: 'Test responsive performance across breakpoints and devices',
      context: {
        projectName: args.projectName,
        pages: args.pages,
        breakpointStrategy: args.breakpointStrategy,
        performanceTargets: args.performanceTargets,
        testDevices: args.testDevices,
        imageMediaStrategy: args.imageMediaStrategy,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Run Lighthouse audits for mobile and desktop',
        '2. Measure Core Web Vitals (LCP, FID, CLS) at each breakpoint',
        '3. Test page load times on 3G, 4G, and WiFi',
        '4. Measure Time to Interactive (TTI) across devices',
        '5. Verify image loading and optimization',
        '6. Test lazy loading effectiveness',
        '7. Measure JavaScript bundle size impact',
        '8. Test CSS performance and critical CSS',
        '9. Verify font loading strategy performance',
        '10. Measure layout shift (CLS) during responsive resizing',
        '11. Test animation and transition performance',
        '12. Verify resource prioritization',
        '13. Compare performance against targets',
        '14. Generate performance optimization recommendations'
      ],
      outputFormat: 'JSON object with performance test results'
    },
    outputSchema: {
      type: 'object',
      required: ['meetsAllTargets', 'metrics', 'reportPath', 'artifacts'],
      properties: {
        meetsAllTargets: { type: 'boolean' },
        metrics: {
          type: 'object',
          properties: {
            lcp: { type: 'object', properties: { value: { type: 'string' }, passed: { type: 'boolean' } } },
            fid: { type: 'object', properties: { value: { type: 'string' }, passed: { type: 'boolean' } } },
            cls: { type: 'object', properties: { value: { type: 'string' }, passed: { type: 'boolean' } } },
            tti: { type: 'object', properties: { value: { type: 'string' }, passed: { type: 'boolean' } } }
          }
        },
        lighthouseScores: {
          type: 'object',
          properties: {
            performance: { type: 'number' },
            accessibility: { type: 'number' },
            bestPractices: { type: 'number' },
            seo: { type: 'number' }
          }
        },
        performanceByDevice: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              device: { type: 'string' },
              lcp: { type: 'string' },
              fid: { type: 'string' },
              cls: { type: 'string' },
              score: { type: 'number' }
            }
          }
        },
        failedMetrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              target: { type: 'string' },
              actual: { type: 'string' },
              device: { type: 'string' }
            }
          }
        },
        optimizations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              recommendation: { type: 'string' },
              impact: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        reportPath: { type: 'string' },
        lighthousePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'responsive-design', 'performance', 'core-web-vitals']
}));

// Phase 12: Responsive Design System Documentation
export const responsiveDesignSystemDocsTask = defineTask('responsive-design-system-docs', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Design System Documentation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Design System Documentation Specialist',
      task: 'Generate comprehensive responsive design system documentation',
      context: {
        projectName: args.projectName,
        breakpointStrategy: args.breakpointStrategy,
        layoutDesigns: args.layoutDesigns,
        componentDesigns: args.componentDesigns,
        typographySpacing: args.typographySpacing,
        imageMediaStrategy: args.imageMediaStrategy,
        navigationDesign: args.navigationDesign,
        touchOptimization: args.touchOptimization,
        designSystem: args.designSystem,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Document responsive breakpoint strategy and rationale',
        '2. Create responsive grid system documentation',
        '3. Document responsive typography scale and usage',
        '4. Create responsive spacing scale documentation',
        '5. Document responsive image and media guidelines',
        '6. Create component responsive behavior documentation',
        '7. Document responsive navigation patterns',
        '8. Create touch target guidelines for mobile',
        '9. Document responsive layout patterns',
        '10. Create accessibility guidelines for responsive design',
        '11. Document responsive design principles',
        '12. Create visual examples for each breakpoint',
        '13. Generate Storybook or style guide documentation',
        '14. Create quick reference guide for developers'
      ],
      outputFormat: 'JSON object with design system documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['documentationPath', 'artifacts'],
      properties: {
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              path: { type: 'string' },
              topics: { type: 'array' }
            }
          }
        },
        breakpointGuide: { type: 'string' },
        gridSystemGuide: { type: 'string' },
        typographyGuide: { type: 'string' },
        componentGuide: { type: 'string' },
        layoutPatternsGuide: { type: 'string' },
        accessibilityGuide: { type: 'string' },
        quickReference: { type: 'string' },
        storybookPath: { type: 'string' },
        documentationPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'responsive-design', 'documentation', 'design-system']
}));

// Phase 13: Implementation Guidelines
export const implementationGuidelinesTask = defineTask('implementation-guidelines', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 13: Implementation Guidelines - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Frontend Developer and Technical Writer',
      task: 'Create implementation guidelines and code examples for responsive designs',
      context: {
        projectName: args.projectName,
        breakpointStrategy: args.breakpointStrategy,
        layoutDesigns: args.layoutDesigns,
        componentDesigns: args.componentDesigns,
        typographySpacing: args.typographySpacing,
        imageMediaStrategy: args.imageMediaStrategy,
        navigationDesign: args.navigationDesign,
        approach: args.approach,
        browserTargets: args.browserTargets,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create HTML/CSS code examples for responsive layouts',
        '2. Generate media query snippets for all breakpoints',
        '3. Create flexbox and CSS Grid examples',
        '4. Generate responsive typography CSS examples',
        '5. Create responsive image implementation examples (srcset, picture)',
        '6. Generate mobile navigation code examples',
        '7. Create responsive component code templates',
        '8. Document browser compatibility and fallbacks',
        '9. Create SCSS/CSS custom properties for breakpoints',
        '10. Generate JavaScript code for responsive behavior if needed',
        '11. Document testing approach for responsive implementations',
        '12. Create progressive enhancement examples',
        '13. Document common responsive pitfalls to avoid',
        '14. Generate complete implementation checklist'
      ],
      outputFormat: 'JSON object with implementation guidelines'
    },
    outputSchema: {
      type: 'object',
      required: ['guidePath', 'codeExamples', 'artifacts'],
      properties: {
        codeExamples: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              language: { type: 'string' },
              code: { type: 'string' },
              filePath: { type: 'string' }
            }
          }
        },
        mediaQuerySnippets: { type: 'string' },
        layoutExamples: { type: 'string' },
        componentExamples: { type: 'string' },
        imageImplementation: { type: 'string' },
        navigationImplementation: { type: 'string' },
        browserCompatibility: { type: 'string' },
        testingApproach: { type: 'string' },
        commonPitfalls: { type: 'array', items: { type: 'string' } },
        implementationChecklist: { type: 'string' },
        guidePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'responsive-design', 'implementation', 'code-examples']
}));

// Phase 14: Responsive QA Checklist
export const responsiveQAChecklistTask = defineTask('responsive-qa-checklist', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 14: QA Checklist - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'QA Lead',
      task: 'Generate comprehensive responsive QA checklist and testing guide',
      context: {
        projectName: args.projectName,
        pages: args.pages,
        components: args.components,
        breakpointStrategy: args.breakpointStrategy,
        testDevices: args.testDevices,
        performanceTargets: args.performanceTargets,
        includeAccessibility: args.includeAccessibility,
        includeTouchOptimization: args.includeTouchOptimization,
        crossDeviceTesting: args.crossDeviceTesting,
        performanceTesting: args.performanceTesting,
        accessibilityValidation: args.accessibilityValidation,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create responsive design QA checklist covering all breakpoints',
        '2. Generate visual regression testing checklist',
        '3. Create cross-browser testing checklist',
        '4. Generate mobile-specific testing checklist',
        '5. Create touch interaction testing checklist',
        '6. Generate accessibility testing checklist',
        '7. Create performance testing checklist',
        '8. Generate orientation change testing checklist',
        '9. Create form and input testing checklist',
        '10. Generate navigation testing checklist',
        '11. Create image and media loading checklist',
        '12. Document testing tools and setup',
        '13. Create bug reporting template',
        '14. Generate comprehensive testing guide'
      ],
      outputFormat: 'JSON object with QA checklist'
    },
    outputSchema: {
      type: 'object',
      required: ['checklistPath', 'artifacts'],
      properties: {
        checklists: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              items: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        responsiveChecklist: { type: 'array' },
        visualRegressionChecklist: { type: 'array' },
        crossBrowserChecklist: { type: 'array' },
        mobileChecklist: { type: 'array' },
        accessibilityChecklist: { type: 'array' },
        performanceChecklist: { type: 'array' },
        testingTools: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tool: { type: 'string' },
              purpose: { type: 'string' },
              setup: { type: 'string' }
            }
          }
        },
        bugReportTemplate: { type: 'string' },
        testingGuidePath: { type: 'string' },
        checklistPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'responsive-design', 'qa', 'testing', 'checklist']
}));

// Phase 15: Comprehensive Responsive Report
export const comprehensiveResponsiveReportTask = defineTask('comprehensive-responsive-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 15: Comprehensive Report - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Documentation Specialist',
      task: 'Generate comprehensive responsive design report',
      context: {
        projectName: args.projectName,
        approach: args.approach,
        breakpointStrategy: args.breakpointStrategy,
        layoutDesigns: args.layoutDesigns,
        componentDesigns: args.componentDesigns,
        typographySpacing: args.typographySpacing,
        imageMediaStrategy: args.imageMediaStrategy,
        navigationDesign: args.navigationDesign,
        touchOptimization: args.touchOptimization,
        accessibilityValidation: args.accessibilityValidation,
        crossDeviceTesting: args.crossDeviceTesting,
        performanceTesting: args.performanceTesting,
        recommendations: args.recommendations,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create executive summary of responsive design project',
        '2. Document responsive design approach and strategy',
        '3. Summarize breakpoint strategy and grid system',
        '4. Document all layout designs across breakpoints',
        '5. Summarize component responsive behaviors',
        '6. Present typography and spacing scales',
        '7. Document image and media strategy',
        '8. Summarize navigation patterns',
        '9. Present cross-device testing results',
        '10. Document performance metrics and results',
        '11. Present accessibility compliance status',
        '12. Include visual examples and screenshots',
        '13. Compile all recommendations',
        '14. Generate HTML report with interactive elements'
      ],
      outputFormat: 'JSON object with comprehensive report'
    },
    outputSchema: {
      type: 'object',
      required: ['mainReportPath', 'artifacts'],
      properties: {
        executiveSummary: { type: 'string' },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              content: { type: 'string' },
              path: { type: 'string' }
            }
          }
        },
        visualExamples: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              breakpoint: { type: 'string' },
              imagePath: { type: 'string' }
            }
          }
        },
        statistics: {
          type: 'object',
          properties: {
            pagesDesigned: { type: 'number' },
            componentsDesigned: { type: 'number' },
            breakpoints: { type: 'number' },
            testsPassed: { type: 'number' },
            testsTotal: { type: 'number' }
          }
        },
        mainReportPath: { type: 'string' },
        pdfReportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'responsive-design', 'reporting', 'documentation']
}));

// Phase 16: Final Responsive Review
export const finalResponsiveReviewTask = defineTask('final-responsive-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 16: Final Review - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior UX/UI Designer and Technical Lead',
      task: 'Conduct final responsive design review and provide implementation recommendation',
      context: {
        projectName: args.projectName,
        approach: args.approach,
        breakpointStrategy: args.breakpointStrategy,
        responsiveDesigns: args.responsiveDesigns,
        testResults: args.testResults,
        performanceMetrics: args.performanceMetrics,
        accessibilityValidation: args.accessibilityValidation,
        touchOptimization: args.touchOptimization,
        recommendations: args.recommendations,
        performanceTargets: args.performanceTargets,
        includeAccessibility: args.includeAccessibility,
        includeTouchOptimization: args.includeTouchOptimization,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Review overall responsive design completeness',
        '2. Assess whether all breakpoints are properly designed',
        '3. Evaluate cross-device testing results',
        '4. Review performance metrics against targets',
        '5. Assess accessibility compliance',
        '6. Review touch target optimization',
        '7. Evaluate design consistency across breakpoints',
        '8. Assess implementation readiness',
        '9. Identify any blocking issues',
        '10. Evaluate mobile-first approach effectiveness',
        '11. Review responsive patterns and best practices usage',
        '12. Assess maintainability and scalability',
        '13. Identify strengths and positive aspects',
        '14. Provide clear implementation recommendation',
        '15. List top priority recommendations',
        '16. Generate final review report'
      ],
      outputFormat: 'JSON object with final review and verdict'
    },
    outputSchema: {
      type: 'object',
      required: ['verdict', 'readyForImplementation', 'confidence', 'reportPath', 'artifacts'],
      properties: {
        verdict: { type: 'string', description: 'Overall assessment of responsive design' },
        readyForImplementation: { type: 'boolean' },
        confidence: { type: 'number', minimum: 0, maximum: 100 },
        completeness: { type: 'number', minimum: 0, maximum: 100 },
        strengths: {
          type: 'array',
          items: { type: 'string' },
          description: 'Positive aspects of responsive design'
        },
        blockers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              recommendation: { type: 'string' }
            }
          }
        },
        concerns: {
          type: 'array',
          items: { type: 'string' }
        },
        topRecommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              priority: { type: 'number' },
              recommendation: { type: 'string' },
              impact: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        qualityAssessment: {
          type: 'object',
          properties: {
            designQuality: { type: 'number', minimum: 0, maximum: 100 },
            consistency: { type: 'number', minimum: 0, maximum: 100 },
            accessibility: { type: 'number', minimum: 0, maximum: 100 },
            performance: { type: 'number', minimum: 0, maximum: 100 },
            mobileFriendliness: { type: 'number', minimum: 0, maximum: 100 }
          }
        },
        nextSteps: {
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
  labels: ['agent', 'responsive-design', 'final-review', 'approval']
}));
