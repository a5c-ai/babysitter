/**
 * @process specializations/ux-ui-design/wcag-compliance
 * @description WCAG Compliance Validation - Comprehensive WCAG 2.1/2.2 Level AA/AAA compliance validation with automated testing,
 * manual assessment, screen reader validation, keyboard navigation testing, and detailed remediation planning for accessible web experiences.
 * @inputs { projectName: string, applicationUrl: string, wcagLevel: string, scope: array, testingApproach?: string, remediationRequired?: boolean, generateVPAT?: boolean }
 * @outputs { success: boolean, complianceLevel: string, complianceScore: number, violations: array, testResults: object, remediationPlan: object, vpatReport: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/ux-ui-design/wcag-compliance', {
 *   projectName: 'E-Commerce Platform',
 *   applicationUrl: 'https://example.com',
 *   wcagLevel: 'AA',
 *   scope: ['home', 'products', 'cart', 'checkout', 'account'],
 *   testingApproach: 'comprehensive',
 *   remediationRequired: true,
 *   generateVPAT: false
 * });
 *
 * @references
 * - WCAG 2.1: https://www.w3.org/WAI/WCAG21/quickref/
 * - WCAG 2.2: https://www.w3.org/WAI/WCAG22/quickref/
 * - axe-core: https://github.com/dequelabs/axe-core
 * - WAVE: https://wave.webaim.org/
 * - Lighthouse: https://developers.google.com/web/tools/lighthouse
 * - ARIA Practices: https://www.w3.org/WAI/ARIA/apg/
 * - VPAT: https://www.itic.org/policy/accessibility/vpat
 * - Section 508: https://www.section508.gov/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    applicationUrl,
    wcagLevel = 'AA',
    scope = [],
    testingApproach = 'comprehensive',
    remediationRequired = true,
    generateVPAT = false,
    includeScreenReaderTests = true,
    includeKeyboardTests = true,
    includeColorContrastTests = true,
    includeManualTests = true,
    outputDir = 'wcag-compliance-output',
    automatedTooling = ['axe', 'wave', 'lighthouse'],
    screenReaders = ['NVDA', 'JAWS', 'VoiceOver'],
    breakOnCritical = false,
    complianceThreshold = 85
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const violations = [];
  const testResults = {
    automated: {},
    keyboard: {},
    screenReader: {},
    colorContrast: {},
    manual: {}
  };

  ctx.log('info', `Starting WCAG Compliance Validation: ${projectName}`);
  ctx.log('info', `Target: ${applicationUrl}, WCAG Level: ${wcagLevel}, Scope: ${scope.length} pages/flows`);

  // ============================================================================
  // PHASE 1: WCAG COMPLIANCE STANDARDS REVIEW
  // ============================================================================

  ctx.log('info', 'Phase 1: Reviewing WCAG compliance standards and success criteria');
  const standardsReview = await ctx.task(wcagStandardsReviewTask, {
    projectName,
    wcagLevel,
    scope,
    testingApproach,
    outputDir
  });

  artifacts.push(...standardsReview.artifacts);

  // ============================================================================
  // PHASE 2: AUTOMATED COMPLIANCE TESTING SETUP
  // ============================================================================

  ctx.log('info', 'Phase 2: Setting up automated WCAG compliance testing framework');
  const testingSetup = await ctx.task(complianceTestingSetupTask, {
    projectName,
    applicationUrl,
    wcagLevel,
    automatedTooling,
    outputDir
  });

  artifacts.push(...testingSetup.artifacts);

  // Breakpoint: Review testing setup
  await ctx.breakpoint({
    question: `WCAG compliance testing framework configured with ${testingSetup.toolsConfigured.join(', ')}. ${standardsReview.applicableCriteria.length} success criteria identified for Level ${wcagLevel}. Review setup and approve to proceed?`,
    title: 'Testing Framework Setup Review',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        wcagLevel,
        toolsConfigured: testingSetup.toolsConfigured.length,
        successCriteria: standardsReview.applicableCriteria.length,
        automatedTestable: standardsReview.automatedTestable,
        manualTestable: standardsReview.manualTestable
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 3: AUTOMATED ACCESSIBILITY SCANNING
  // ============================================================================

  ctx.log('info', 'Phase 3: Running automated WCAG compliance scans across all pages');

  const automatedResults = [];
  let criticalViolationsFound = false;

  // Parallel scanning for efficiency
  const scanTasks = scope.map(pageOrFlow =>
    ctx.task(automatedWCAGScanTask, {
      projectName,
      applicationUrl,
      pageOrFlow,
      wcagLevel,
      standardsReview,
      testingSetup,
      outputDir
    })
  );

  const scanResults = await ctx.parallel.all(scanTasks);

  scanResults.forEach(result => {
    automatedResults.push(result);
    violations.push(...result.violations);
    artifacts.push(...result.artifacts);

    const criticalCount = result.violations.filter(v => v.impact === 'critical' || v.impact === 'serious').length;
    if (criticalCount > 0) {
      criticalViolationsFound = true;
      ctx.log('warning', `${result.pageOrFlow}: ${criticalCount} critical/serious WCAG violations found`);
    }
  });

  testResults.automated = {
    totalScans: automatedResults.length,
    totalViolations: violations.length,
    averageScore: automatedResults.reduce((sum, r) => sum + r.score, 0) / automatedResults.length,
    results: automatedResults
  };

  ctx.log('info', `Automated scanning complete: ${violations.length} violations found across ${scope.length} pages`);

  // Quality Gate: Critical violations check
  if (criticalViolationsFound && breakOnCritical) {
    await ctx.breakpoint({
      question: `Critical WCAG compliance violations detected. ${violations.filter(v => v.impact === 'critical').length} critical and ${violations.filter(v => v.impact === 'serious').length} serious violations found. Review and decide: Continue testing, fix now, or abort?`,
      title: 'Critical WCAG Violations Detected',
      context: {
        runId: ctx.runId,
        summary: {
          totalViolations: violations.length,
          criticalViolations: violations.filter(v => v.impact === 'critical').length,
          seriousViolations: violations.filter(v => v.impact === 'serious').length,
          averageScore: testResults.automated.averageScore
        },
        topViolations: violations
          .filter(v => v.impact === 'critical' || v.impact === 'serious')
          .slice(0, 10),
        files: automatedResults.map(r => ({ path: r.reportPath, format: 'html', label: `Scan: ${r.pageOrFlow}` }))
      }
    });
  }

  // ============================================================================
  // PHASE 4: KEYBOARD NAVIGATION TESTING
  // ============================================================================

  let keyboardResults = null;
  if (includeKeyboardTests) {
    ctx.log('info', 'Phase 4: Testing keyboard-only navigation and focus management');

    keyboardResults = await ctx.task(keyboardNavigationComplianceTask, {
      projectName,
      applicationUrl,
      scope,
      wcagLevel,
      standardsReview,
      outputDir
    });

    violations.push(...keyboardResults.violations);
    artifacts.push(...keyboardResults.artifacts);

    testResults.keyboard = {
      totalTests: keyboardResults.totalTests,
      passed: keyboardResults.passed,
      failed: keyboardResults.failed,
      score: keyboardResults.score,
      focusIndicatorsValid: keyboardResults.focusIndicatorsValid,
      noKeyboardTraps: keyboardResults.noKeyboardTraps
    };

    ctx.log('info', `Keyboard navigation: ${keyboardResults.passed}/${keyboardResults.totalTests} passed (${keyboardResults.score}/100)`);
  }

  // ============================================================================
  // PHASE 5: SCREEN READER COMPATIBILITY TESTING
  // ============================================================================

  let screenReaderResults = null;
  if (includeScreenReaderTests) {
    ctx.log('info', 'Phase 5: Testing screen reader compatibility with NVDA, JAWS, and VoiceOver');

    screenReaderResults = await ctx.task(screenReaderComplianceTask, {
      projectName,
      applicationUrl,
      scope,
      wcagLevel,
      screenReaders,
      standardsReview,
      outputDir
    });

    violations.push(...screenReaderResults.violations);
    artifacts.push(...screenReaderResults.artifacts);

    testResults.screenReader = {
      compatible: screenReaderResults.compatible,
      testedScreenReaders: screenReaderResults.testedScreenReaders,
      compatibilityScore: screenReaderResults.compatibilityScore,
      landmarksCorrect: screenReaderResults.landmarksCorrect,
      ariaImplementation: screenReaderResults.ariaImplementation
    };

    ctx.log('info', `Screen reader compatibility: ${screenReaderResults.compatible ? 'PASS' : 'FAIL'} (Score: ${screenReaderResults.compatibilityScore}/100)`);
  }

  // ============================================================================
  // PHASE 6: COLOR CONTRAST VALIDATION
  // ============================================================================

  let colorContrastResults = null;
  if (includeColorContrastTests) {
    ctx.log('info', 'Phase 6: Validating color contrast ratios for WCAG compliance');

    colorContrastResults = await ctx.task(colorContrastComplianceTask, {
      projectName,
      applicationUrl,
      scope,
      wcagLevel,
      standardsReview,
      outputDir
    });

    violations.push(...colorContrastResults.violations);
    artifacts.push(...colorContrastResults.artifacts);

    testResults.colorContrast = {
      totalElements: colorContrastResults.totalElements,
      passing: colorContrastResults.passing,
      failing: colorContrastResults.failing,
      complianceRate: colorContrastResults.complianceRate,
      averageRatio: colorContrastResults.averageRatio
    };

    ctx.log('info', `Color contrast: ${colorContrastResults.passing}/${colorContrastResults.totalElements} elements pass (${colorContrastResults.complianceRate}%)`);
  }

  // ============================================================================
  // PHASE 7: SEMANTIC HTML AND ARIA VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Validating semantic HTML structure and ARIA implementation');
  const semanticValidation = await ctx.task(semanticHTMLAriaValidationTask, {
    projectName,
    applicationUrl,
    scope,
    wcagLevel,
    standardsReview,
    outputDir
  });

  violations.push(...semanticValidation.violations);
  artifacts.push(...semanticValidation.artifacts);

  ctx.log('info', `Semantic HTML & ARIA: ${semanticValidation.validElements}/${semanticValidation.totalElements} valid (${semanticValidation.score}/100)`);

  // ============================================================================
  // PHASE 8: FORMS AND INPUT ACCESSIBILITY VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Validating forms and input accessibility');
  const formsValidation = await ctx.task(formsAccessibilityComplianceTask, {
    projectName,
    applicationUrl,
    scope,
    wcagLevel,
    standardsReview,
    outputDir
  });

  violations.push(...formsValidation.violations);
  artifacts.push(...formsValidation.artifacts);

  ctx.log('info', `Forms accessibility: ${formsValidation.accessibleForms}/${formsValidation.totalForms} forms accessible`);

  // ============================================================================
  // PHASE 9: MULTIMEDIA ACCESSIBILITY VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Validating multimedia content accessibility');
  const multimediaValidation = await ctx.task(multimediaAccessibilityComplianceTask, {
    projectName,
    applicationUrl,
    scope,
    wcagLevel,
    standardsReview,
    outputDir
  });

  violations.push(...multimediaValidation.violations);
  artifacts.push(...multimediaValidation.artifacts);

  ctx.log('info', `Multimedia accessibility: ${multimediaValidation.compliantMedia}/${multimediaValidation.totalMedia} items compliant`);

  // ============================================================================
  // PHASE 10: MANUAL TESTING PROCEDURES
  // ============================================================================

  let manualTestResults = null;
  if (includeManualTests) {
    ctx.log('info', 'Phase 10: Executing manual WCAG compliance testing procedures');

    manualTestResults = await ctx.task(manualWCAGComplianceTestTask, {
      projectName,
      applicationUrl,
      scope,
      wcagLevel,
      standardsReview,
      automatedResults,
      outputDir
    });

    violations.push(...manualTestResults.violations);
    artifacts.push(...manualTestResults.artifacts);

    testResults.manual = {
      totalTests: manualTestResults.totalTests,
      passed: manualTestResults.passed,
      failed: manualTestResults.failed,
      incomplete: manualTestResults.incomplete,
      testCoverage: manualTestResults.testCoverage
    };

    ctx.log('info', `Manual testing: ${manualTestResults.passed}/${manualTestResults.totalTests} criteria passed`);
  }

  // Breakpoint: Review testing results
  await ctx.breakpoint({
    question: `WCAG compliance testing complete. ${violations.length} total violations found. Automated score: ${testResults.automated.averageScore}/100. Review results and approve to proceed with compliance analysis?`,
    title: 'Testing Results Review',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        wcagLevel,
        totalViolations: violations.length,
        criticalViolations: violations.filter(v => v.impact === 'critical').length,
        seriousViolations: violations.filter(v => v.impact === 'serious').length,
        automatedScore: testResults.automated.averageScore,
        keyboardScore: keyboardResults?.score || null,
        screenReaderScore: screenReaderResults?.compatibilityScore || null,
        colorContrastRate: colorContrastResults?.complianceRate || null
      },
      testResults,
      files: artifacts.filter(a => a.reportPath || a.path).slice(0, 15).map(a => ({
        path: a.reportPath || a.path,
        format: a.format || 'html',
        label: a.label
      }))
    }
  });

  // ============================================================================
  // PHASE 11: WCAG COMPLIANCE ANALYSIS AND SCORING
  // ============================================================================

  ctx.log('info', 'Phase 11: Analyzing WCAG compliance and calculating compliance score');
  const complianceAnalysis = await ctx.task(wcagComplianceAnalysisTask, {
    projectName,
    wcagLevel,
    standardsReview,
    violations,
    testResults,
    automatedResults,
    keyboardResults,
    screenReaderResults,
    colorContrastResults,
    semanticValidation,
    formsValidation,
    multimediaValidation,
    manualTestResults,
    outputDir
  });

  artifacts.push(...complianceAnalysis.artifacts);

  const complianceScore = complianceAnalysis.complianceScore;
  const achievedComplianceLevel = complianceAnalysis.complianceLevel;
  const meetsCompliance = complianceAnalysis.meetsTargetLevel;
  const prioritizedViolations = complianceAnalysis.prioritizedViolations;

  ctx.log('info', `Compliance analysis: Score ${complianceScore}/100, Level ${achievedComplianceLevel} achieved`);

  // Quality Gate: Compliance threshold check
  if (complianceScore < complianceThreshold || !meetsCompliance) {
    await ctx.breakpoint({
      question: `WCAG ${wcagLevel} compliance ${meetsCompliance ? 'partially' : 'not'} achieved. Current level: ${achievedComplianceLevel}, Score: ${complianceScore}/100 (Threshold: ${complianceThreshold}). ${prioritizedViolations.length} violations require remediation. Review and approve to proceed?`,
      title: 'WCAG Compliance Gap Detected',
      context: {
        runId: ctx.runId,
        compliance: {
          target: wcagLevel,
          achieved: achievedComplianceLevel,
          score: complianceScore,
          threshold: complianceThreshold,
          gap: Math.max(0, complianceThreshold - complianceScore),
          meetsCompliance
        },
        violationBreakdown: complianceAnalysis.violationsByPrinciple,
        topViolations: prioritizedViolations.slice(0, 15),
        files: [
          { path: complianceAnalysis.reportPath, format: 'html', label: 'Compliance Analysis Report' },
          { path: complianceAnalysis.summaryPath, format: 'json', label: 'Compliance Summary' }
        ]
      }
    });
  }

  // ============================================================================
  // PHASE 12: SUCCESS CRITERIA MAPPING AND DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 12: Mapping violations to WCAG success criteria');
  const criteriaMapping = await ctx.task(successCriteriaMappingTask, {
    projectName,
    wcagLevel,
    standardsReview,
    violations,
    prioritizedViolations,
    complianceAnalysis,
    outputDir
  });

  artifacts.push(...criteriaMapping.artifacts);

  // ============================================================================
  // PHASE 13: COMPREHENSIVE WCAG COMPLIANCE REPORT
  // ============================================================================

  ctx.log('info', 'Phase 13: Generating comprehensive WCAG compliance report');
  const complianceReport = await ctx.task(comprehensiveComplianceReportTask, {
    projectName,
    applicationUrl,
    wcagLevel,
    complianceScore,
    achievedComplianceLevel,
    standardsReview,
    testResults,
    violations,
    prioritizedViolations,
    complianceAnalysis,
    criteriaMapping,
    keyboardResults,
    screenReaderResults,
    colorContrastResults,
    semanticValidation,
    formsValidation,
    multimediaValidation,
    manualTestResults,
    outputDir
  });

  artifacts.push(...complianceReport.artifacts);

  // ============================================================================
  // PHASE 14: VPAT GENERATION (OPTIONAL)
  // ============================================================================

  let vpatReport = null;
  if (generateVPAT) {
    ctx.log('info', 'Phase 14: Generating VPAT (Voluntary Product Accessibility Template)');

    vpatReport = await ctx.task(vpatGenerationTask, {
      projectName,
      applicationUrl,
      wcagLevel,
      complianceScore,
      achievedComplianceLevel,
      standardsReview,
      criteriaMapping,
      prioritizedViolations,
      complianceAnalysis,
      outputDir
    });

    artifacts.push(...vpatReport.artifacts);
  }

  // ============================================================================
  // PHASE 15: REMEDIATION PLAN GENERATION
  // ============================================================================

  let remediationPlan = null;
  if (remediationRequired) {
    ctx.log('info', 'Phase 15: Generating WCAG compliance remediation plan');

    remediationPlan = await ctx.task(wcagRemediationPlanTask, {
      projectName,
      wcagLevel,
      complianceScore,
      achievedComplianceLevel,
      complianceThreshold,
      prioritizedViolations,
      complianceAnalysis,
      criteriaMapping,
      outputDir
    });

    artifacts.push(...remediationPlan.artifacts);

    // Breakpoint: Review remediation plan
    await ctx.breakpoint({
      question: `Remediation plan created with ${remediationPlan.totalTasks} tasks across ${remediationPlan.phases.length} phases. Estimated effort: ${remediationPlan.estimatedEffort}. Expected score improvement: +${remediationPlan.expectedImprovementScore} points. Review and approve plan?`,
      title: 'Remediation Plan Review',
      context: {
        runId: ctx.runId,
        plan: {
          totalTasks: remediationPlan.totalTasks,
          phases: remediationPlan.phases.length,
          criticalTasks: remediationPlan.criticalTasks,
          highPriorityTasks: remediationPlan.highPriorityTasks,
          estimatedEffort: remediationPlan.estimatedEffort,
          quickWins: remediationPlan.quickWins.length,
          expectedScore: Math.min(100, complianceScore + remediationPlan.expectedImprovementScore)
        },
        files: [
          { path: remediationPlan.planPath, format: 'markdown', label: 'Remediation Plan' },
          { path: remediationPlan.roadmapPath, format: 'markdown', label: 'Implementation Roadmap' },
          { path: complianceReport.mainReportPath, format: 'html', label: 'Compliance Report' }
        ]
      }
    });
  }

  // ============================================================================
  // PHASE 16: FINAL WCAG COMPLIANCE ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 16: Conducting final WCAG compliance assessment');
  const finalAssessment = await ctx.task(finalComplianceAssessmentTask, {
    projectName,
    applicationUrl,
    wcagLevel,
    complianceScore,
    achievedComplianceLevel,
    meetsCompliance,
    complianceThreshold,
    violations,
    prioritizedViolations,
    complianceAnalysis,
    remediationPlan,
    complianceReport,
    outputDir
  });

  artifacts.push(...finalAssessment.artifacts);

  // Final Breakpoint: Review complete compliance validation
  await ctx.breakpoint({
    question: `WCAG compliance validation complete. Target: ${wcagLevel}, Achieved: ${achievedComplianceLevel}, Score: ${complianceScore}/100. ${meetsCompliance ? 'COMPLIANCE ACHIEVED' : 'COMPLIANCE NOT MET'}. ${violations.length} violations found, ${remediationPlan ? remediationPlan.totalTasks + ' remediation tasks created' : 'no remediation plan'}. ${finalAssessment.verdict}. Approve final deliverables?`,
    title: 'Final WCAG Compliance Assessment',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        applicationUrl,
        targetWcagLevel: wcagLevel,
        achievedComplianceLevel,
        complianceScore,
        meetsCompliance,
        totalViolations: violations.length,
        criticalViolations: violations.filter(v => v.impact === 'critical').length,
        seriousViolations: violations.filter(v => v.impact === 'serious').length,
        remediationTasks: remediationPlan ? remediationPlan.totalTasks : 0,
        estimatedRemediationEffort: remediationPlan ? remediationPlan.estimatedEffort : 'N/A'
      },
      testResultsSummary: {
        automatedScore: testResults.automated.averageScore,
        keyboardScore: testResults.keyboard?.score || null,
        screenReaderScore: testResults.screenReader?.compatibilityScore || null,
        colorContrastRate: testResults.colorContrast?.complianceRate || null,
        manualTestsPassed: testResults.manual?.passed || null
      },
      assessment: {
        verdict: finalAssessment.verdict,
        deploymentReady: finalAssessment.deploymentReady,
        recommendation: finalAssessment.recommendation,
        strengths: finalAssessment.strengths,
        concerns: finalAssessment.concerns,
        nextSteps: finalAssessment.nextSteps
      },
      files: [
        { path: complianceReport.mainReportPath, format: 'html', label: 'Main WCAG Compliance Report' },
        { path: complianceReport.executiveSummaryPath, format: 'pdf', label: 'Executive Summary' },
        { path: complianceAnalysis.reportPath, format: 'html', label: 'Compliance Analysis' },
        { path: criteriaMapping.mappingPath, format: 'html', label: 'Success Criteria Mapping' },
        ...(remediationPlan ? [{ path: remediationPlan.planPath, format: 'markdown', label: 'Remediation Plan' }] : []),
        ...(vpatReport ? [{ path: vpatReport.vpatPath, format: 'html', label: 'VPAT Report' }] : []),
        { path: finalAssessment.reportPath, format: 'markdown', label: 'Final Assessment' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    applicationUrl,
    complianceLevel: achievedComplianceLevel,
    complianceScore,
    targetComplianceLevel: wcagLevel,
    meetsCompliance,
    complianceGap: meetsCompliance ? 0 : Math.max(0, complianceThreshold - complianceScore),
    violations: {
      total: violations.length,
      critical: violations.filter(v => v.impact === 'critical').length,
      serious: violations.filter(v => v.impact === 'serious').length,
      moderate: violations.filter(v => v.impact === 'moderate').length,
      minor: violations.filter(v => v.impact === 'minor').length,
      details: prioritizedViolations
    },
    testResults: {
      automated: {
        averageScore: testResults.automated.averageScore,
        totalScans: testResults.automated.totalScans,
        totalViolations: testResults.automated.totalViolations
      },
      keyboard: keyboardResults ? {
        score: keyboardResults.score,
        passed: keyboardResults.passed,
        failed: keyboardResults.failed,
        focusIndicatorsValid: keyboardResults.focusIndicatorsValid,
        noKeyboardTraps: keyboardResults.noKeyboardTraps
      } : null,
      screenReader: screenReaderResults ? {
        compatible: screenReaderResults.compatible,
        compatibilityScore: screenReaderResults.compatibilityScore,
        testedScreenReaders: screenReaderResults.testedScreenReaders,
        ariaImplementation: screenReaderResults.ariaImplementation
      } : null,
      colorContrast: colorContrastResults ? {
        complianceRate: colorContrastResults.complianceRate,
        passing: colorContrastResults.passing,
        failing: colorContrastResults.failing,
        averageRatio: colorContrastResults.averageRatio
      } : null,
      semantic: {
        score: semanticValidation.score,
        validElements: semanticValidation.validElements,
        totalElements: semanticValidation.totalElements
      },
      forms: {
        accessibleForms: formsValidation.accessibleForms,
        totalForms: formsValidation.totalForms
      },
      multimedia: {
        compliantMedia: multimediaValidation.compliantMedia,
        totalMedia: multimediaValidation.totalMedia
      },
      manual: manualTestResults ? {
        passed: manualTestResults.passed,
        failed: manualTestResults.failed,
        incomplete: manualTestResults.incomplete,
        testCoverage: manualTestResults.testCoverage
      } : null
    },
    complianceAnalysis: {
      violationsByPrinciple: complianceAnalysis.violationsByPrinciple,
      violationsBySeverity: complianceAnalysis.violationsBySeverity,
      successCriteriaPassed: complianceAnalysis.successCriteriaPassed,
      successCriteriaFailed: complianceAnalysis.successCriteriaFailed,
      complianceByLevel: complianceAnalysis.complianceByLevel
    },
    remediationPlan: remediationPlan ? {
      totalTasks: remediationPlan.totalTasks,
      phases: remediationPlan.phases,
      estimatedEffort: remediationPlan.estimatedEffort,
      expectedImprovementScore: remediationPlan.expectedImprovementScore,
      quickWins: remediationPlan.quickWins,
      planPath: remediationPlan.planPath,
      roadmapPath: remediationPlan.roadmapPath
    } : null,
    vpatReport: vpatReport ? {
      vpatPath: vpatReport.vpatPath,
      vpatVersion: vpatReport.vpatVersion,
      complianceSummary: vpatReport.complianceSummary
    } : null,
    finalAssessment: {
      verdict: finalAssessment.verdict,
      deploymentReady: finalAssessment.deploymentReady,
      recommendation: finalAssessment.recommendation,
      confidence: finalAssessment.confidence,
      strengths: finalAssessment.strengths,
      concerns: finalAssessment.concerns,
      nextSteps: finalAssessment.nextSteps,
      riskAssessment: finalAssessment.riskAssessment
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/ux-ui-design/wcag-compliance',
      timestamp: startTime,
      wcagLevel,
      testingApproach,
      scope: scope.length,
      automatedTooling
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
      role: 'WCAG Expert and Compliance Specialist',
      task: 'Review WCAG 2.1/2.2 standards and create comprehensive success criteria checklist',
      context: args,
      instructions: [
        '1. Review WCAG 2.1 and WCAG 2.2 guidelines for the specified compliance level',
        '2. Document all applicable success criteria for target level (A, AA, or AAA)',
        '3. Organize criteria by POUR principles (Perceivable, Operable, Understandable, Robust)',
        '4. Identify which criteria are testable through automated tools vs manual testing',
        '5. Document testing procedures for each success criterion',
        '6. Create comprehensive compliance checklist mapped to success criteria',
        '7. Identify conformance requirements and exceptions',
        '8. Document applicable legal standards (Section 508, ADA, EN 301 549)',
        '9. Provide guidance on conformance claims and documentation',
        '10. Generate WCAG compliance requirements document'
      ],
      outputFormat: 'JSON object with WCAG standards review and requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['applicableCriteria', 'automatedTestable', 'manualTestable', 'complianceChecklist', 'artifacts'],
      properties: {
        wcagVersion: { type: 'string' },
        targetLevel: { type: 'string', enum: ['A', 'AA', 'AAA'] },
        applicableCriteria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterionId: { type: 'string' },
              criterionName: { type: 'string' },
              level: { type: 'string' },
              principle: { type: 'string', enum: ['Perceivable', 'Operable', 'Understandable', 'Robust'] },
              guideline: { type: 'string' },
              description: { type: 'string' },
              testingMethod: { type: 'string', enum: ['automated', 'manual', 'both'] },
              conformanceRequirement: { type: 'string' }
            }
          }
        },
        automatedTestable: { type: 'number' },
        manualTestable: { type: 'number' },
        complianceChecklist: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              testProcedure: { type: 'string' },
              successIndicators: { type: 'array', items: { type: 'string' } },
              failureExamples: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        legalStandards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              standard: { type: 'string' },
              applicability: { type: 'string' },
              requirements: { type: 'string' }
            }
          }
        },
        conformanceGuidance: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'wcag', 'compliance', 'standards-review']
}));

// Phase 2: Compliance Testing Setup
export const complianceTestingSetupTask = defineTask('compliance-testing-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Compliance Testing Setup - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Accessibility Testing Engineer',
      task: 'Set up comprehensive WCAG compliance testing framework with automated tools',
      context: args,
      instructions: [
        '1. Configure axe-core for automated WCAG compliance testing',
        '2. Set up WAVE (Web Accessibility Evaluation Tool) integration',
        '3. Configure Lighthouse accessibility audit with WCAG focus',
        '4. Set up Pa11y for automated WCAG scanning',
        '5. Configure testing framework for the specified WCAG level',
        '6. Create testing utilities and helper functions',
        '7. Set up violation categorization by WCAG criterion and severity',
        '8. Configure HTML, JSON, and XML report generation',
        '9. Set up screenshot capture for violations',
        '10. Create accessibility testing configuration files',
        '11. Document tool setup and usage procedures',
        '12. Verify all tools are correctly configured and functional'
      ],
      outputFormat: 'JSON object with testing framework setup details'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'toolsConfigured', 'frameworkConfig', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        toolsConfigured: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of configured accessibility testing tools'
        },
        frameworkConfig: {
          type: 'object',
          properties: {
            wcagLevel: { type: 'string' },
            axeConfig: { type: 'object' },
            waveConfig: { type: 'object' },
            lighthouseConfig: { type: 'object' },
            pa11yConfig: { type: 'object' }
          }
        },
        testingUtilities: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of created testing utilities'
        },
        reportingConfig: {
          type: 'object',
          properties: {
            formats: { type: 'array', items: { type: 'string' } },
            outputDirectory: { type: 'string' }
          }
        },
        configPaths: {
          type: 'object',
          properties: {
            axe: { type: 'string' },
            wave: { type: 'string' },
            lighthouse: { type: 'string' },
            pa11y: { type: 'string' }
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
  labels: ['agent', 'wcag', 'testing-setup', 'automation']
}));

// Phase 3: Automated WCAG Scan
export const automatedWCAGScanTask = defineTask('automated-wcag-scan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Automated WCAG Scan - ${args.pageOrFlow}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'WCAG Compliance Testing Engineer',
      task: 'Execute comprehensive automated WCAG compliance scan using multiple tools',
      context: args,
      instructions: [
        '1. Navigate to the specified page or flow',
        '2. Run axe-core with WCAG 2.1/2.2 rules for the target level',
        '3. Execute WAVE accessibility evaluation',
        '4. Run Lighthouse accessibility audit',
        '5. Execute Pa11y scan with WCAG runner',
        '6. Aggregate violations from all tools and deduplicate',
        '7. Map each violation to specific WCAG success criteria',
        '8. Categorize violations by impact (critical, serious, moderate, minor)',
        '9. Categorize violations by POUR principle',
        '10. Generate detailed violation reports with code snippets and DOM locations',
        '11. Capture screenshots highlighting violated elements',
        '12. Provide specific remediation guidance for each violation',
        '13. Calculate WCAG compliance score for the page (0-100)',
        '14. Generate comprehensive scan report in HTML and JSON formats'
      ],
      outputFormat: 'JSON object with automated scan results and violations'
    },
    outputSchema: {
      type: 'object',
      required: ['pageOrFlow', 'score', 'violations', 'reportPath', 'artifacts'],
      properties: {
        pageOrFlow: { type: 'string' },
        score: { type: 'number', minimum: 0, maximum: 100 },
        violations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              wcagCriterion: { type: 'string' },
              wcagLevel: { type: 'string' },
              wcagPrinciple: { type: 'string', enum: ['Perceivable', 'Operable', 'Understandable', 'Robust'] },
              impact: { type: 'string', enum: ['critical', 'serious', 'moderate', 'minor'] },
              description: { type: 'string' },
              help: { type: 'string' },
              helpUrl: { type: 'string' },
              element: { type: 'string' },
              selector: { type: 'string' },
              html: { type: 'string' },
              remediation: { type: 'string' },
              toolsReporting: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        passed: { type: 'number', description: 'Number of passed checks' },
        inapplicable: { type: 'number', description: 'Number of inapplicable checks' },
        incomplete: { type: 'number', description: 'Number of incomplete checks' },
        toolResults: {
          type: 'object',
          properties: {
            axe: { type: 'object' },
            wave: { type: 'object' },
            lighthouse: { type: 'object' },
            pa11y: { type: 'object' }
          }
        },
        reportPath: { type: 'string' },
        jsonReportPath: { type: 'string' },
        screenshotPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'wcag', 'automated-scan', 'compliance']
}));

// Phase 4: Keyboard Navigation Compliance
export const keyboardNavigationComplianceTask = defineTask('keyboard-navigation-compliance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Keyboard Navigation Compliance - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Keyboard Accessibility Specialist',
      task: 'Validate keyboard-only navigation compliance with WCAG 2.1.1, 2.1.2, 2.4.3, 2.4.7',
      context: args,
      instructions: [
        '1. Test Tab key navigation through all interactive elements on each page',
        '2. Verify Shift+Tab reverse navigation works correctly (WCAG 2.1.1)',
        '3. Test Enter and Space key activation for buttons and links',
        '4. Test arrow key navigation in custom widgets (menus, tabs, sliders)',
        '5. Verify Escape key dismisses modals and dropdowns',
        '6. Test for visible and distinctive focus indicators (WCAG 2.4.7)',
        '7. Verify focus order is logical and matches visual order (WCAG 2.4.3)',
        '8. Test for keyboard traps - ensure focus can always escape (WCAG 2.1.2)',
        '9. Verify skip links allow bypassing repetitive content',
        '10. Test focus management in single-page applications and dynamic content',
        '11. Document keyboard shortcuts and verify no conflicts',
        '12. Map violations to specific WCAG success criteria',
        '13. Generate keyboard accessibility compliance report with pass/fail per criterion'
      ],
      outputFormat: 'JSON object with keyboard navigation compliance results'
    },
    outputSchema: {
      type: 'object',
      required: ['totalTests', 'passed', 'failed', 'score', 'violations', 'artifacts'],
      properties: {
        totalTests: { type: 'number' },
        passed: { type: 'number' },
        failed: { type: 'number' },
        score: { type: 'number', minimum: 0, maximum: 100 },
        violations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              page: { type: 'string' },
              wcagCriterion: { type: 'string' },
              issue: { type: 'string' },
              impact: { type: 'string' },
              element: { type: 'string' },
              remediation: { type: 'string' }
            }
          }
        },
        focusIndicatorsValid: { type: 'boolean', description: 'WCAG 2.4.7 compliance' },
        noKeyboardTraps: { type: 'boolean', description: 'WCAG 2.1.2 compliance' },
        logicalFocusOrder: { type: 'boolean', description: 'WCAG 2.4.3 compliance' },
        skipLinksPresent: { type: 'boolean', description: 'WCAG 2.4.1 best practice' },
        keyboardAccessible: { type: 'boolean', description: 'WCAG 2.1.1 compliance' },
        testResultsByPage: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              page: { type: 'string' },
              passed: { type: 'number' },
              failed: { type: 'number' }
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
  labels: ['agent', 'wcag', 'keyboard-navigation', 'compliance']
}));

// Phase 5: Screen Reader Compliance
export const screenReaderComplianceTask = defineTask('screen-reader-compliance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Screen Reader Compliance - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Screen Reader Accessibility Expert',
      task: 'Validate screen reader compatibility and WCAG 1.3.1, 4.1.2, 4.1.3 compliance',
      context: args,
      instructions: [
        '1. Test with NVDA (NonVisual Desktop Access) on Windows/Firefox',
        '2. Test with JAWS (Job Access With Speech) on Windows/Chrome',
        '3. Test with VoiceOver on macOS/Safari',
        '4. Verify page structure is announced correctly - landmarks (WCAG 1.3.1)',
        '5. Verify heading hierarchy is logical and complete (WCAG 1.3.1)',
        '6. Test form field labels, instructions, and error messages (WCAG 4.1.2)',
        '7. Verify ARIA roles, states, and properties are correct (WCAG 4.1.2)',
        '8. Test ARIA live regions announce dynamic content appropriately (WCAG 4.1.3)',
        '9. Verify modal dialogs announce correctly and trap focus',
        '10. Test image alt text is meaningful and contextual (WCAG 1.1.1)',
        '11. Verify table structure with proper headers (WCAG 1.3.1)',
        '12. Test button and link text is descriptive (WCAG 2.4.4, 2.4.9)',
        '13. Document screen reader specific issues mapped to WCAG criteria',
        '14. Generate screen reader compatibility matrix and compliance report'
      ],
      outputFormat: 'JSON object with screen reader compliance results'
    },
    outputSchema: {
      type: 'object',
      required: ['compatible', 'compatibilityScore', 'testedScreenReaders', 'violations', 'artifacts'],
      properties: {
        compatible: { type: 'boolean' },
        compatibilityScore: { type: 'number', minimum: 0, maximum: 100 },
        testedScreenReaders: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              screenReader: { type: 'string' },
              browser: { type: 'string' },
              compatibility: { type: 'string', enum: ['excellent', 'good', 'fair', 'poor'] },
              majorIssues: { type: 'number' }
            }
          }
        },
        violations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              page: { type: 'string' },
              wcagCriterion: { type: 'string' },
              issue: { type: 'string' },
              severity: { type: 'string' },
              affectedScreenReaders: { type: 'array', items: { type: 'string' } },
              userImpact: { type: 'string' },
              remediation: { type: 'string' }
            }
          }
        },
        landmarksCorrect: { type: 'boolean', description: 'WCAG 1.3.1 landmarks compliance' },
        headingStructureValid: { type: 'boolean', description: 'WCAG 1.3.1 heading hierarchy' },
        ariaImplementation: { type: 'string', enum: ['excellent', 'good', 'fair', 'poor'], description: 'WCAG 4.1.2 compliance' },
        liveRegionsFunctional: { type: 'boolean', description: 'WCAG 4.1.3 compliance' },
        alternativeTextProvided: { type: 'boolean', description: 'WCAG 1.1.1 compliance' },
        reportPath: { type: 'string' },
        compatibilityMatrixPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'wcag', 'screen-reader', 'compliance']
}));

// Phase 6: Color Contrast Compliance
export const colorContrastComplianceTask = defineTask('color-contrast-compliance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Color Contrast Compliance - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Visual Accessibility Specialist',
      task: 'Validate color contrast ratios for WCAG 1.4.3, 1.4.6, 1.4.11 compliance',
      context: args,
      instructions: [
        '1. Scan all text elements across pages and calculate contrast ratios',
        '2. For WCAG AA (1.4.3): verify 4.5:1 for normal text, 3:1 for large text (18pt+ or 14pt+ bold)',
        '3. For WCAG AAA (1.4.6): verify 7:1 for normal text, 4.5:1 for large text',
        '4. Test contrast for interactive elements (buttons, links, form controls) (WCAG 1.4.11)',
        '5. Verify 3:1 contrast for UI components and graphical objects (WCAG 1.4.11)',
        '6. Verify 3:1 contrast for focus indicators (WCAG 2.4.7 + 1.4.11)',
        '7. Test with color blindness simulators (protanopia, deuteranopia, tritanopia)',
        '8. Verify information is not conveyed by color alone (WCAG 1.4.1)',
        '9. Identify all failing contrast combinations',
        '10. Provide accessible color suggestions that meet WCAG requirements',
        '11. Document violations mapped to WCAG success criteria',
        '12. Generate visual contrast report with side-by-side comparisons',
        '13. Create heatmap visualization of contrast issues'
      ],
      outputFormat: 'JSON object with color contrast compliance analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['totalElements', 'passing', 'failing', 'complianceRate', 'violations', 'artifacts'],
      properties: {
        totalElements: { type: 'number' },
        passing: { type: 'number' },
        failing: { type: 'number' },
        complianceRate: { type: 'number', minimum: 0, maximum: 100 },
        averageRatio: { type: 'number' },
        violations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              page: { type: 'string' },
              wcagCriterion: { type: 'string' },
              element: { type: 'string' },
              selector: { type: 'string' },
              foreground: { type: 'string' },
              background: { type: 'string' },
              currentRatio: { type: 'number' },
              requiredRatio: { type: 'number' },
              wcagLevel: { type: 'string' },
              impact: { type: 'string' },
              suggestedColors: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    foreground: { type: 'string' },
                    background: { type: 'string' },
                    ratio: { type: 'number' }
                  }
                }
              }
            }
          }
        },
        colorBlindnessIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              wcagCriterion: { type: 'string' },
              issue: { type: 'string' },
              affectedElements: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        textContrast: {
          type: 'object',
          properties: {
            aa_normal: { type: 'number', description: 'Elements meeting AA normal text' },
            aa_large: { type: 'number', description: 'Elements meeting AA large text' },
            aaa_normal: { type: 'number', description: 'Elements meeting AAA normal text' },
            aaa_large: { type: 'number', description: 'Elements meeting AAA large text' }
          }
        },
        uiComponentContrast: {
          type: 'object',
          properties: {
            passing: { type: 'number', description: 'Components meeting 1.4.11' },
            failing: { type: 'number' }
          }
        },
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
  labels: ['agent', 'wcag', 'color-contrast', 'compliance']
}));

// Phase 7: Semantic HTML and ARIA Validation
export const semanticHTMLAriaValidationTask = defineTask('semantic-html-aria-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Semantic HTML & ARIA Validation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Semantic Web and ARIA Specialist',
      task: 'Validate semantic HTML structure and ARIA implementation for WCAG 1.3.1, 4.1.1, 4.1.2 compliance',
      context: args,
      instructions: [
        '1. Validate HTML5 semantic structure (header, nav, main, article, section, aside, footer)',
        '2. Verify proper heading hierarchy (h1-h6) without skipping levels (WCAG 1.3.1)',
        '3. Validate ARIA roles, states, and properties are correctly implemented (WCAG 4.1.2)',
        '4. Verify ARIA roles match semantic HTML where applicable',
        '5. Check for ARIA attribute spelling and value errors (WCAG 4.1.1)',
        '6. Validate landmark regions are properly defined',
        '7. Verify form elements have proper roles and accessible names (WCAG 4.1.2)',
        '8. Check for duplicate IDs which break ARIA references (WCAG 4.1.1)',
        '9. Verify required ARIA attributes are present (aria-required, aria-invalid, etc.)',
        '10. Validate custom widgets follow ARIA Authoring Practices patterns',
        '11. Check for invalid HTML that affects accessibility (WCAG 4.1.1)',
        '12. Map violations to WCAG success criteria',
        '13. Generate semantic HTML and ARIA validation report'
      ],
      outputFormat: 'JSON object with semantic and ARIA validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['totalElements', 'validElements', 'score', 'violations', 'artifacts'],
      properties: {
        totalElements: { type: 'number' },
        validElements: { type: 'number' },
        score: { type: 'number', minimum: 0, maximum: 100 },
        violations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              page: { type: 'string' },
              wcagCriterion: { type: 'string' },
              type: { type: 'string', enum: ['semantic', 'aria', 'html-validation'] },
              element: { type: 'string' },
              issue: { type: 'string' },
              severity: { type: 'string' },
              remediation: { type: 'string' }
            }
          }
        },
        semanticStructure: {
          type: 'object',
          properties: {
            landmarksPresent: { type: 'boolean' },
            headingHierarchyValid: { type: 'boolean' },
            semanticElementsUsed: { type: 'boolean' }
          }
        },
        ariaImplementation: {
          type: 'object',
          properties: {
            rolesValid: { type: 'boolean' },
            statesValid: { type: 'boolean' },
            propertiesValid: { type: 'boolean' },
            requiredAttributesPresent: { type: 'boolean' }
          }
        },
        htmlValidation: {
          type: 'object',
          properties: {
            noDuplicateIds: { type: 'boolean' },
            validHtml: { type: 'boolean' },
            parsingErrors: { type: 'number' }
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
  labels: ['agent', 'wcag', 'semantic-html', 'aria', 'compliance']
}));

// Phase 8: Forms Accessibility Compliance
export const formsAccessibilityComplianceTask = defineTask('forms-accessibility-compliance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Forms Accessibility Compliance - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Forms Accessibility Specialist',
      task: 'Validate forms accessibility for WCAG 1.3.1, 3.3.1, 3.3.2, 3.3.3, 3.3.4, 4.1.2 compliance',
      context: args,
      instructions: [
        '1. Verify all form fields have associated visible labels or aria-label (WCAG 1.3.1, 4.1.2)',
        '2. Check for clear field instructions and help text (WCAG 3.3.2)',
        '3. Test error identification is clear and programmatically determined (WCAG 3.3.1)',
        '4. Verify error messages provide suggestions for correction (WCAG 3.3.3)',
        '5. Test error prevention for legal/financial transactions (WCAG 3.3.4, 3.3.6)',
        '6. Verify required field indicators are not color-only (WCAG 1.4.1)',
        '7. Check fieldset and legend usage for grouped controls (WCAG 1.3.1)',
        '8. Test autocomplete attributes for personal information (WCAG 1.3.5)',
        '9. Verify clear submit and reset button labels',
        '10. Test validation timing and user control',
        '11. Verify success confirmation messages are accessible',
        '12. Map form violations to WCAG success criteria',
        '13. Generate forms accessibility compliance report'
      ],
      outputFormat: 'JSON object with forms accessibility compliance results'
    },
    outputSchema: {
      type: 'object',
      required: ['totalForms', 'accessibleForms', 'violations', 'artifacts'],
      properties: {
        totalForms: { type: 'number' },
        accessibleForms: { type: 'number' },
        totalFields: { type: 'number' },
        accessibleFields: { type: 'number' },
        violations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              page: { type: 'string' },
              formName: { type: 'string' },
              wcagCriterion: { type: 'string' },
              issue: { type: 'string' },
              severity: { type: 'string' },
              field: { type: 'string' },
              remediation: { type: 'string' }
            }
          }
        },
        labelingComplete: { type: 'boolean', description: 'WCAG 1.3.1, 4.1.2 compliance' },
        errorIdentification: { type: 'boolean', description: 'WCAG 3.3.1 compliance' },
        errorSuggestions: { type: 'boolean', description: 'WCAG 3.3.3 compliance' },
        errorPrevention: { type: 'boolean', description: 'WCAG 3.3.4 compliance' },
        autocompletePresent: { type: 'boolean', description: 'WCAG 1.3.5 compliance' },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'wcag', 'forms', 'compliance']
}));

// Phase 9: Multimedia Accessibility Compliance
export const multimediaAccessibilityComplianceTask = defineTask('multimedia-accessibility-compliance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Multimedia Accessibility Compliance - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Multimedia Accessibility Specialist',
      task: 'Validate multimedia content accessibility for WCAG 1.2.x, 1.4.2, 2.2.2, 2.3.1 compliance',
      context: args,
      instructions: [
        '1. Check for synchronized captions on all video content (WCAG 1.2.2, 1.2.4)',
        '2. Verify audio descriptions for video content (WCAG 1.2.3, 1.2.5)',
        '3. Check for transcripts for audio-only content (WCAG 1.2.1)',
        '4. Verify media player controls are keyboard accessible (WCAG 2.1.1)',
        '5. Check for pause/stop controls for auto-playing media (WCAG 1.4.2)',
        '6. Verify pause/stop for moving, blinking, scrolling content (WCAG 2.2.2)',
        '7. Test no flashing content exceeds 3 flashes per second (WCAG 2.3.1)',
        '8. Verify volume controls and mute functionality',
        '9. Check for sign language interpretation if applicable (WCAG 1.2.6 AAA)',
        '10. Verify alternative formats available for complex media',
        '11. Test media with screen readers for accessible controls',
        '12. Map multimedia violations to WCAG success criteria',
        '13. Generate multimedia accessibility compliance report'
      ],
      outputFormat: 'JSON object with multimedia accessibility compliance results'
    },
    outputSchema: {
      type: 'object',
      required: ['totalMedia', 'compliantMedia', 'violations', 'artifacts'],
      properties: {
        totalMedia: { type: 'number' },
        compliantMedia: { type: 'number' },
        violations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              page: { type: 'string' },
              mediaType: { type: 'string', enum: ['video', 'audio', 'animation'] },
              wcagCriterion: { type: 'string' },
              issue: { type: 'string' },
              severity: { type: 'string' },
              remediation: { type: 'string' }
            }
          }
        },
        captionsCoverage: {
          type: 'object',
          properties: {
            videosWithCaptions: { type: 'number' },
            totalVideos: { type: 'number' },
            coveragePercentage: { type: 'number' }
          },
          description: 'WCAG 1.2.2 compliance'
        },
        audioDescriptions: {
          type: 'object',
          properties: {
            videosWithDescriptions: { type: 'number' },
            totalVideos: { type: 'number' }
          },
          description: 'WCAG 1.2.3, 1.2.5 compliance'
        },
        transcripts: { type: 'boolean', description: 'WCAG 1.2.1 compliance' },
        autoPlayControlled: { type: 'boolean', description: 'WCAG 1.4.2 compliance' },
        noFlashingContent: { type: 'boolean', description: 'WCAG 2.3.1 compliance' },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'wcag', 'multimedia', 'compliance']
}));

// Phase 10: Manual WCAG Compliance Testing
export const manualWCAGComplianceTestTask = defineTask('manual-wcag-compliance-test', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Manual WCAG Compliance Testing - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Manual Accessibility Tester and WCAG Expert',
      task: 'Execute manual testing procedures for WCAG criteria not fully testable by automation',
      context: args,
      instructions: [
        '1. Test content reflow and zoom up to 200% without loss (WCAG 1.4.4, 1.4.10)',
        '2. Verify meaningful link and button text (WCAG 2.4.4, 2.4.9)',
        '3. Test reading order and content sequence (WCAG 1.3.2)',
        '4. Verify consistent navigation across pages (WCAG 3.2.3)',
        '5. Test consistent identification of components (WCAG 3.2.4)',
        '6. Assess content clarity and reading level (WCAG 3.1.5 AAA)',
        '7. Test for time-based content controls and warnings (WCAG 2.2.1)',
        '8. Verify context changes are user-initiated (WCAG 3.2.1, 3.2.2)',
        '9. Test touch target sizes (minimum 44x44px) (WCAG 2.5.5)',
        '10. Verify pointer cancellation (WCAG 2.5.2)',
        '11. Test motion actuation and device orientation (WCAG 2.5.4)',
        '12. Document all manual testing findings with evidence',
        '13. Map results to WCAG success criteria and generate report'
      ],
      outputFormat: 'JSON object with manual testing results'
    },
    outputSchema: {
      type: 'object',
      required: ['totalTests', 'passed', 'failed', 'incomplete', 'violations', 'artifacts'],
      properties: {
        totalTests: { type: 'number' },
        passed: { type: 'number' },
        failed: { type: 'number' },
        incomplete: { type: 'number' },
        testCoverage: { type: 'number', minimum: 0, maximum: 100 },
        violations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              page: { type: 'string' },
              wcagCriterion: { type: 'string' },
              testName: { type: 'string' },
              issue: { type: 'string' },
              severity: { type: 'string' },
              evidence: { type: 'string' },
              userImpact: { type: 'string' },
              remediation: { type: 'string' }
            }
          }
        },
        criteriaResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              result: { type: 'string', enum: ['pass', 'fail', 'incomplete', 'not-applicable'] },
              notes: { type: 'string' }
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
  labels: ['agent', 'wcag', 'manual-testing', 'compliance']
}));

// Phase 11: WCAG Compliance Analysis
export const wcagComplianceAnalysisTask = defineTask('wcag-compliance-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: WCAG Compliance Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior WCAG Compliance Analyst',
      task: 'Analyze all test results and calculate comprehensive WCAG compliance score and level',
      context: args,
      instructions: [
        '1. Aggregate all violations from automated and manual testing',
        '2. Deduplicate violations found by multiple methods',
        '3. Map each violation to specific WCAG 2.1/2.2 success criteria',
        '4. Categorize violations by POUR principles (Perceivable, Operable, Understandable, Robust)',
        '5. Categorize violations by severity (critical, serious, moderate, minor)',
        '6. Calculate success criteria pass/fail for each level (A, AA, AAA)',
        '7. Determine overall WCAG conformance level achieved (A, AA, AAA, or Non-compliant)',
        '8. Calculate weighted compliance score (0-100) based on criteria passed',
        '9. Identify most common violation patterns',
        '10. Group related violations for efficient remediation',
        '11. Estimate impact on users with different disabilities',
        '12. Calculate compliance rate by WCAG principle and level',
        '13. Generate comprehensive compliance analysis report with visualizations'
      ],
      outputFormat: 'JSON object with comprehensive compliance analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['complianceScore', 'complianceLevel', 'meetsTargetLevel', 'prioritizedViolations', 'reportPath', 'artifacts'],
      properties: {
        complianceScore: { type: 'number', minimum: 0, maximum: 100 },
        complianceLevel: { type: 'string', enum: ['A', 'AA', 'AAA', 'Non-compliant'] },
        meetsTargetLevel: { type: 'boolean' },
        successCriteriaPassed: { type: 'number' },
        successCriteriaFailed: { type: 'number' },
        successCriteriaTested: { type: 'number' },
        complianceByLevel: {
          type: 'object',
          properties: {
            levelA: { type: 'object', properties: { passed: { type: 'number' }, failed: { type: 'number' }, rate: { type: 'number' } } },
            levelAA: { type: 'object', properties: { passed: { type: 'number' }, failed: { type: 'number' }, rate: { type: 'number' } } },
            levelAAA: { type: 'object', properties: { passed: { type: 'number' }, failed: { type: 'number' }, rate: { type: 'number' } } }
          }
        },
        violationsByPrinciple: {
          type: 'object',
          properties: {
            perceivable: { type: 'number' },
            operable: { type: 'number' },
            understandable: { type: 'number' },
            robust: { type: 'number' }
          }
        },
        violationsBySeverity: {
          type: 'object',
          properties: {
            critical: { type: 'number' },
            serious: { type: 'number' },
            moderate: { type: 'number' },
            minor: { type: 'number' }
          }
        },
        prioritizedViolations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              priority: { type: 'number' },
              wcagCriterion: { type: 'string' },
              wcagLevel: { type: 'string' },
              principle: { type: 'string' },
              violationId: { type: 'string' },
              title: { type: 'string' },
              impact: { type: 'string' },
              occurrences: { type: 'number' },
              affectedPages: { type: 'array', items: { type: 'string' } },
              userImpact: { type: 'string' },
              remediationEffort: { type: 'string' }
            }
          }
        },
        mostCommonViolations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              wcagCriterion: { type: 'string' },
              count: { type: 'number' },
              description: { type: 'string' }
            }
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
  labels: ['agent', 'wcag', 'compliance-analysis']
}));

// Phase 12: Success Criteria Mapping
export const successCriteriaMappingTask = defineTask('success-criteria-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Success Criteria Mapping - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'WCAG Documentation Specialist',
      task: 'Create comprehensive mapping of violations to WCAG success criteria with conformance claims',
      context: args,
      instructions: [
        '1. Create detailed mapping of each violation to specific WCAG success criteria',
        '2. Document conformance status for each criterion (Supports, Partially Supports, Does Not Support, Not Applicable)',
        '3. Provide detailed remarks explaining conformance status',
        '4. Document testing method used for each criterion',
        '5. Map criteria to POUR principles and guidelines',
        '6. Create conformance claim statements for each level (A, AA, AAA)',
        '7. Document scope of conformance and any exceptions',
        '8. Identify success criteria that require manual testing vs automated',
        '9. Create traceability matrix linking violations to criteria to pages',
        '10. Generate compliance checklist with pass/fail status',
        '11. Document accessibility support baseline (browsers/assistive tech)',
        '12. Generate comprehensive success criteria mapping report in HTML and spreadsheet formats'
      ],
      outputFormat: 'JSON object with success criteria mapping details'
    },
    outputSchema: {
      type: 'object',
      required: ['criteriaMapping', 'conformanceClaims', 'mappingPath', 'artifacts'],
      properties: {
        criteriaMapping: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              level: { type: 'string' },
              principle: { type: 'string' },
              guideline: { type: 'string' },
              conformanceStatus: { type: 'string', enum: ['Supports', 'Partially Supports', 'Does Not Support', 'Not Applicable'] },
              remarks: { type: 'string' },
              relatedViolations: { type: 'array', items: { type: 'string' } },
              testingMethod: { type: 'string' },
              affectedPages: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        conformanceClaims: {
          type: 'object',
          properties: {
            levelA: { type: 'string' },
            levelAA: { type: 'string' },
            levelAAA: { type: 'string' }
          }
        },
        scopeOfConformance: { type: 'string' },
        accessibilitySupportBaseline: {
          type: 'object',
          properties: {
            browsers: { type: 'array', items: { type: 'string' } },
            assistiveTechnologies: { type: 'array', items: { type: 'string' } }
          }
        },
        traceabilityMatrix: { type: 'string', description: 'Path to traceability matrix' },
        complianceChecklist: { type: 'string', description: 'Path to compliance checklist' },
        mappingPath: { type: 'string' },
        spreadsheetPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'wcag', 'criteria-mapping', 'documentation']
}));

// Phase 13: Comprehensive Compliance Report
export const comprehensiveComplianceReportTask = defineTask('comprehensive-compliance-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 13: Comprehensive Compliance Report - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'WCAG Compliance Documentation Specialist',
      task: 'Generate comprehensive WCAG compliance validation report with all findings',
      context: args,
      instructions: [
        '1. Create executive summary with key findings and compliance status',
        '2. Document testing methodology, tools, and scope',
        '3. Present WCAG conformance level achieved and compliance score',
        '4. Summarize violations by principle, level, and severity',
        '5. Include detailed violation listings with evidence and remediation guidance',
        '6. Document automated testing results (axe, WAVE, Lighthouse)',
        '7. Present keyboard navigation compliance findings',
        '8. Document screen reader compatibility results',
        '9. Include color contrast analysis findings',
        '10. Present semantic HTML and ARIA validation results',
        '11. Document forms and multimedia accessibility findings',
        '12. Include manual testing results and observations',
        '13. Present success criteria mapping and conformance claims',
        '14. Include WCAG compliance visualizations (charts, graphs, matrices)',
        '15. Generate report in multiple formats (HTML, PDF, Markdown, DOCX)',
        '16. Include all sub-reports and detailed technical findings'
      ],
      outputFormat: 'JSON object with comprehensive report details'
    },
    outputSchema: {
      type: 'object',
      required: ['mainReportPath', 'executiveSummaryPath', 'artifacts'],
      properties: {
        mainReportPath: { type: 'string' },
        executiveSummaryPath: { type: 'string' },
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
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              section: { type: 'string' },
              path: { type: 'string' }
            }
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
        appendices: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
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
  labels: ['agent', 'wcag', 'reporting', 'documentation']
}));

// Phase 14: VPAT Generation
export const vpatGenerationTask = defineTask('vpat-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 14: VPAT Generation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Accessibility Compliance and VPAT Specialist',
      task: 'Generate VPAT (Voluntary Product Accessibility Template) documentation for procurement',
      context: args,
      instructions: [
        '1. Use VPAT 2.5 template covering WCAG 2.2, Section 508, EN 301 549',
        '2. Complete product information section (name, version, date, contact)',
        '3. Document evaluation methods and tools used',
        '4. Complete WCAG 2.2 Level A conformance table',
        '5. Complete WCAG 2.2 Level AA conformance table',
        '6. Complete WCAG 2.2 Level AAA conformance table (if applicable)',
        '7. For each success criterion: indicate Supports, Partially Supports, Does Not Support, or Not Applicable',
        '8. Provide detailed remarks and explanations for each criterion',
        '9. Document all known accessibility issues and limitations',
        '10. Complete Section 508 conformance table (if applicable)',
        '11. Complete EN 301 549 conformance table (if applicable)',
        '12. Include contact information for accessibility questions',
        '13. Format VPAT in accessible HTML and generate PDF version',
        '14. Ensure VPAT document itself meets accessibility standards'
      ],
      outputFormat: 'JSON object with VPAT generation details'
    },
    outputSchema: {
      type: 'object',
      required: ['vpatPath', 'vpatVersion', 'complianceSummary', 'artifacts'],
      properties: {
        vpatPath: { type: 'string' },
        vpatVersion: { type: 'string' },
        productInfo: {
          type: 'object',
          properties: {
            productName: { type: 'string' },
            productVersion: { type: 'string' },
            reportDate: { type: 'string' },
            contactInfo: { type: 'string' }
          }
        },
        complianceSummary: {
          type: 'object',
          properties: {
            levelA: {
              type: 'object',
              properties: {
                supports: { type: 'number' },
                partiallySupports: { type: 'number' },
                doesNotSupport: { type: 'number' },
                notApplicable: { type: 'number' }
              }
            },
            levelAA: {
              type: 'object',
              properties: {
                supports: { type: 'number' },
                partiallySupports: { type: 'number' },
                doesNotSupport: { type: 'number' },
                notApplicable: { type: 'number' }
              }
            },
            levelAAA: {
              type: 'object',
              properties: {
                supports: { type: 'number' },
                partiallySupports: { type: 'number' },
                doesNotSupport: { type: 'number' },
                notApplicable: { type: 'number' }
              }
            }
          }
        },
        formats: {
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
  labels: ['agent', 'wcag', 'vpat', 'procurement']
}));

// Phase 15: WCAG Remediation Plan
export const wcagRemediationPlanTask = defineTask('wcag-remediation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 15: WCAG Remediation Plan - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Accessibility Remediation Strategist',
      task: 'Create comprehensive WCAG compliance remediation plan with phased approach',
      context: args,
      instructions: [
        '1. Review all prioritized WCAG violations and compliance gaps',
        '2. Group violations by WCAG success criteria for efficient remediation',
        '3. Create specific remediation tasks with clear acceptance criteria',
        '4. Estimate effort for each task (hours/days) and required expertise',
        '5. Assign priority based on WCAG level, severity, and user impact',
        '6. Identify dependencies between remediation tasks',
        '7. Define remediation phases: Phase 1 (Level A critical), Phase 2 (Level AA), Phase 3 (Level AAA/enhancements)',
        '8. Identify quick wins for early compliance improvement',
        '9. Calculate expected compliance score improvement per phase',
        '10. Provide detailed implementation guidance with code examples',
        '11. Define testing and validation approach for each fix',
        '12. Create timeline and milestone tracking',
        '13. Generate comprehensive remediation plan document and roadmap visualization'
      ],
      outputFormat: 'JSON object with WCAG remediation plan'
    },
    outputSchema: {
      type: 'object',
      required: ['totalTasks', 'phases', 'estimatedEffort', 'expectedImprovementScore', 'quickWins', 'planPath', 'roadmapPath', 'artifacts'],
      properties: {
        totalTasks: { type: 'number' },
        criticalTasks: { type: 'number' },
        highPriorityTasks: { type: 'number' },
        phases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'number' },
              name: { type: 'string' },
              focusLevel: { type: 'string' },
              objectives: { type: 'array', items: { type: 'string' } },
              tasks: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    taskId: { type: 'string' },
                    title: { type: 'string' },
                    wcagCriteria: { type: 'array', items: { type: 'string' } },
                    priority: { type: 'string' },
                    effort: { type: 'string' },
                    affectedViolations: { type: 'array', items: { type: 'string' } },
                    acceptanceCriteria: { type: 'array', items: { type: 'string' } },
                    implementationGuidance: { type: 'string' },
                    codeExample: { type: 'string' },
                    testingApproach: { type: 'string' }
                  }
                }
              },
              estimatedDuration: { type: 'string' },
              expectedComplianceImprovement: { type: 'number' }
            }
          }
        },
        estimatedEffort: { type: 'string' },
        expectedImprovementScore: { type: 'number' },
        expectedComplianceLevel: { type: 'string' },
        quickWins: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              task: { type: 'string' },
              wcagCriteria: { type: 'array', items: { type: 'string' } },
              effort: { type: 'string' },
              impact: { type: 'string' },
              benefit: { type: 'string' }
            }
          }
        },
        timeline: {
          type: 'object',
          properties: {
            startDate: { type: 'string' },
            targetCompletionDate: { type: 'string' },
            milestones: { type: 'array', items: { type: 'object' } }
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
  labels: ['agent', 'wcag', 'remediation', 'planning']
}));

// Phase 16: Final Compliance Assessment
export const finalComplianceAssessmentTask = defineTask('final-compliance-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 16: Final Compliance Assessment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Principal WCAG Compliance Consultant',
      task: 'Conduct final comprehensive WCAG compliance assessment and provide deployment recommendation',
      context: args,
      instructions: [
        '1. Review overall WCAG compliance status and achieved level',
        '2. Assess whether target conformance level is met',
        '3. Evaluate severity and user impact of remaining violations',
        '4. Review quality and feasibility of remediation plan',
        '5. Assess legal and regulatory compliance risk (ADA, Section 508)',
        '6. Evaluate deployment readiness from accessibility perspective',
        '7. Identify any blocking WCAG conformance issues',
        '8. Assess organizational accessibility maturity and capability',
        '9. Document accessibility strengths and positive implementations',
        '10. Document critical concerns and compliance gaps',
        '11. Provide clear deployment recommendation (approve/conditional/remediate-first/reject)',
        '12. Define next steps and follow-up validation requirements',
        '13. Provide confidence assessment (0-100) in compliance validation',
        '14. Generate final assessment report with verdict'
      ],
      outputFormat: 'JSON object with final compliance assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['verdict', 'deploymentReady', 'recommendation', 'confidence', 'reportPath', 'artifacts'],
      properties: {
        verdict: { type: 'string' },
        deploymentReady: { type: 'boolean' },
        complianceAchieved: { type: 'boolean' },
        confidence: { type: 'number', minimum: 0, maximum: 100 },
        recommendation: { type: 'string', enum: ['approve', 'conditional-approve', 'remediate-first', 'reject'] },
        strengths: { type: 'array', items: { type: 'string' } },
        concerns: { type: 'array', items: { type: 'string' } },
        blockingIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              wcagCriterion: { type: 'string' },
              issue: { type: 'string' },
              severity: { type: 'string' }
            }
          }
        },
        nextSteps: { type: 'array', items: { type: 'string' } },
        followUpValidation: {
          type: 'object',
          properties: {
            required: { type: 'boolean' },
            timeline: { type: 'string' },
            scope: { type: 'array', items: { type: 'string' } }
          }
        },
        riskAssessment: {
          type: 'object',
          properties: {
            legalRisk: { type: 'string', enum: ['low', 'medium', 'high'] },
            reputationRisk: { type: 'string', enum: ['low', 'medium', 'high'] },
            userExclusionRisk: { type: 'string', enum: ['low', 'medium', 'high'] },
            regulatoryRisk: { type: 'string', enum: ['low', 'medium', 'high'] }
          }
        },
        complianceReadiness: {
          type: 'object',
          properties: {
            technicalReadiness: { type: 'string', enum: ['ready', 'partial', 'not-ready'] },
            documentationReadiness: { type: 'string', enum: ['ready', 'partial', 'not-ready'] },
            organizationalReadiness: { type: 'string', enum: ['ready', 'partial', 'not-ready'] }
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
  labels: ['agent', 'wcag', 'final-assessment', 'compliance']
}));
