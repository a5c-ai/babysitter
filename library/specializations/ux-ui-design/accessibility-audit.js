/**
 * @process specializations/ux-ui-design/accessibility-audit
 * @description Accessibility Audit and Remediation - Comprehensive accessibility evaluation with WCAG compliance assessment, barrier identification,
 * inclusive design recommendations, and actionable remediation roadmap for creating accessible digital experiences.
 * @inputs { projectName: string, productUrl: string, wcagLevel: string, scope: array, userPersonas: array, assistiveTechnologies: array, includeRemediation?: boolean, includeUsabilityTesting?: boolean }
 * @outputs { success: boolean, complianceLevel: string, complianceScore: number, barriers: array, recommendations: array, remediationPlan: object, usabilityReport: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/ux-ui-design/accessibility-audit', {
 *   projectName: 'E-Commerce Platform',
 *   productUrl: 'https://example.com',
 *   wcagLevel: 'AA',
 *   scope: ['home', 'product-listing', 'product-detail', 'checkout', 'account'],
 *   userPersonas: ['screen-reader-user', 'keyboard-only-user', 'low-vision-user', 'cognitive-disability-user'],
 *   assistiveTechnologies: ['NVDA', 'JAWS', 'VoiceOver', 'Dragon'],
 *   includeRemediation: true,
 *   includeUsabilityTesting: true
 * });
 *
 * @references
 * - WCAG 2.1: https://www.w3.org/WAI/WCAG21/quickref/
 * - WCAG 2.2: https://www.w3.org/WAI/WCAG22/quickref/
 * - ARIA Authoring Practices: https://www.w3.org/WAI/ARIA/apg/
 * - WebAIM: https://webaim.org/
 * - Deque Accessibility: https://www.deque.com/
 * - A11Y Project: https://www.a11yproject.com/
 * - Inclusive Design Principles: https://inclusivedesignprinciples.org/
 * - Section 508: https://www.section508.gov/
 * - EN 301 549: https://www.etsi.org/deliver/etsi_en/301500_301599/301549/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    productUrl,
    wcagLevel = 'AA',
    scope = [],
    userPersonas = [],
    assistiveTechnologies = ['NVDA', 'JAWS', 'VoiceOver'],
    includeRemediation = true,
    includeUsabilityTesting = false,
    complianceStandards = ['WCAG 2.1', 'WCAG 2.2'],
    outputDir = 'accessibility-audit-output',
    performAutomatedScanning = true,
    performManualTesting = true,
    performUsabilityTesting = false,
    generateVPAT = false,
    prioritizeByImpact = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const barriers = [];
  const recommendations = [];

  ctx.log('info', `Starting Accessibility Audit and Remediation: ${projectName}`);
  ctx.log('info', `Target: ${productUrl}, WCAG Level: ${wcagLevel}, Scope: ${scope.length} pages/flows`);

  // ============================================================================
  // PHASE 1: ACCESSIBILITY AUDIT PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 1: Planning comprehensive accessibility audit');
  const auditPlan = await ctx.task(accessibilityAuditPlanningTask, {
    projectName,
    productUrl,
    wcagLevel,
    scope,
    userPersonas,
    assistiveTechnologies,
    complianceStandards,
    outputDir
  });

  artifacts.push(...auditPlan.artifacts);

  // ============================================================================
  // PHASE 2: WCAG COMPLIANCE STANDARDS REVIEW
  // ============================================================================

  ctx.log('info', 'Phase 2: Reviewing WCAG compliance standards and success criteria');
  const complianceReview = await ctx.task(wcagComplianceReviewTask, {
    projectName,
    wcagLevel,
    complianceStandards,
    scope,
    outputDir
  });

  artifacts.push(...complianceReview.artifacts);
  recommendations.push(...complianceReview.recommendations);

  // ============================================================================
  // PHASE 3: AUTOMATED ACCESSIBILITY SCANNING
  // ============================================================================

  let automatedScanResults = null;
  if (performAutomatedScanning) {
    ctx.log('info', 'Phase 3: Running automated accessibility scans');

    const scanTasks = scope.map(pageOrFlow =>
      ctx.task(automatedAccessibilityScanTask, {
        projectName,
        productUrl,
        pageOrFlow,
        wcagLevel,
        complianceReview,
        outputDir
      })
    );

    automatedScanResults = await ctx.parallel.all(scanTasks);

    automatedScanResults.forEach(result => {
      barriers.push(...result.barriers);
      artifacts.push(...result.artifacts);
    });

    ctx.log('info', `Automated scanning complete: ${barriers.length} potential barriers identified`);
  }

  // ============================================================================
  // PHASE 4: MANUAL ACCESSIBILITY TESTING
  // ============================================================================

  let manualTestResults = null;
  if (performManualTesting) {
    ctx.log('info', 'Phase 4: Conducting manual accessibility testing');

    manualTestResults = await ctx.task(manualAccessibilityTestingTask, {
      projectName,
      productUrl,
      scope,
      wcagLevel,
      complianceReview,
      automatedScanResults,
      assistiveTechnologies,
      outputDir
    });

    barriers.push(...manualTestResults.barriers);
    recommendations.push(...manualTestResults.recommendations);
    artifacts.push(...manualTestResults.artifacts);

    ctx.log('info', `Manual testing complete: ${manualTestResults.barriers.length} additional barriers identified`);
  }

  // Breakpoint: Review initial audit findings
  await ctx.breakpoint({
    question: `Initial accessibility audit complete. ${barriers.length} total barriers identified. Review findings and approve to continue with barrier analysis and prioritization?`,
    title: 'Initial Audit Findings Review',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        totalBarriers: barriers.length,
        automatedBarriers: automatedScanResults ? automatedScanResults.reduce((sum, r) => sum + r.barriers.length, 0) : 0,
        manualBarriers: manualTestResults ? manualTestResults.barriers.length : 0,
        scope: scope.length
      },
      files: artifacts.slice(0, 10).map(a => ({
        path: a.path,
        format: a.format || 'html',
        label: a.label
      }))
    }
  });

  // ============================================================================
  // PHASE 5: KEYBOARD NAVIGATION ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 5: Assessing keyboard navigation and focus management');
  const keyboardAssessment = await ctx.task(keyboardNavigationAssessmentTask, {
    projectName,
    productUrl,
    scope,
    outputDir
  });

  barriers.push(...keyboardAssessment.barriers);
  recommendations.push(...keyboardAssessment.recommendations);
  artifacts.push(...keyboardAssessment.artifacts);

  // ============================================================================
  // PHASE 6: SCREEN READER COMPATIBILITY EVALUATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Evaluating screen reader compatibility');
  const screenReaderEvaluation = await ctx.task(screenReaderCompatibilityTask, {
    projectName,
    productUrl,
    scope,
    assistiveTechnologies,
    automatedScanResults,
    outputDir
  });

  barriers.push(...screenReaderEvaluation.barriers);
  recommendations.push(...screenReaderEvaluation.recommendations);
  artifacts.push(...screenReaderEvaluation.artifacts);

  // ============================================================================
  // PHASE 7: COLOR CONTRAST AND VISUAL DESIGN ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 7: Analyzing color contrast and visual design accessibility');
  const visualDesignAnalysis = await ctx.task(colorContrastVisualAnalysisTask, {
    projectName,
    productUrl,
    scope,
    wcagLevel,
    outputDir
  });

  barriers.push(...visualDesignAnalysis.barriers);
  recommendations.push(...visualDesignAnalysis.recommendations);
  artifacts.push(...visualDesignAnalysis.artifacts);

  // ============================================================================
  // PHASE 8: CONTENT AND COGNITIVE ACCESSIBILITY REVIEW
  // ============================================================================

  ctx.log('info', 'Phase 8: Reviewing content clarity and cognitive accessibility');
  const cognitiveReview = await ctx.task(contentCognitiveAccessibilityTask, {
    projectName,
    productUrl,
    scope,
    wcagLevel,
    outputDir
  });

  barriers.push(...cognitiveReview.barriers);
  recommendations.push(...cognitiveReview.recommendations);
  artifacts.push(...cognitiveReview.artifacts);

  // ============================================================================
  // PHASE 9: FORMS AND INTERACTIVE ELEMENTS ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 9: Assessing forms and interactive elements accessibility');
  const formsAssessment = await ctx.task(formsInteractiveElementsTask, {
    projectName,
    productUrl,
    scope,
    wcagLevel,
    outputDir
  });

  barriers.push(...formsAssessment.barriers);
  recommendations.push(...formsAssessment.recommendations);
  artifacts.push(...formsAssessment.artifacts);

  // ============================================================================
  // PHASE 10: MULTIMEDIA AND RICH MEDIA ACCESSIBILITY
  // ============================================================================

  ctx.log('info', 'Phase 10: Evaluating multimedia and rich media accessibility');
  const multimediaEvaluation = await ctx.task(multimediaAccessibilityTask, {
    projectName,
    productUrl,
    scope,
    wcagLevel,
    outputDir
  });

  barriers.push(...multimediaEvaluation.barriers);
  recommendations.push(...multimediaEvaluation.recommendations);
  artifacts.push(...multimediaEvaluation.artifacts);

  // ============================================================================
  // PHASE 11: BARRIER ANALYSIS AND PRIORITIZATION
  // ============================================================================

  ctx.log('info', 'Phase 11: Analyzing and prioritizing accessibility barriers');
  const barrierAnalysis = await ctx.task(barrierAnalysisPrioritizationTask, {
    projectName,
    barriers,
    wcagLevel,
    userPersonas,
    prioritizeByImpact,
    outputDir
  });

  const prioritizedBarriers = barrierAnalysis.prioritizedBarriers;
  const complianceScore = barrierAnalysis.complianceScore;
  const achievedComplianceLevel = barrierAnalysis.complianceLevel;

  artifacts.push(...barrierAnalysis.artifacts);

  ctx.log('info', `Barrier analysis complete: Compliance score ${complianceScore}/100, Level: ${achievedComplianceLevel}`);

  // ============================================================================
  // PHASE 12: USABILITY TESTING WITH ASSISTIVE TECHNOLOGIES (OPTIONAL)
  // ============================================================================

  let usabilityReport = null;
  if (includeUsabilityTesting || performUsabilityTesting) {
    ctx.log('info', 'Phase 12: Conducting usability testing with assistive technologies');

    usabilityReport = await ctx.task(assistiveTechnologyUsabilityTask, {
      projectName,
      productUrl,
      scope,
      userPersonas,
      assistiveTechnologies,
      prioritizedBarriers,
      outputDir
    });

    recommendations.push(...usabilityReport.recommendations);
    artifacts.push(...usabilityReport.artifacts);
  }

  // ============================================================================
  // PHASE 13: INCLUSIVE DESIGN RECOMMENDATIONS
  // ============================================================================

  ctx.log('info', 'Phase 13: Generating inclusive design recommendations');
  const inclusiveDesignRecs = await ctx.task(inclusiveDesignRecommendationsTask, {
    projectName,
    prioritizedBarriers,
    userPersonas,
    keyboardAssessment,
    screenReaderEvaluation,
    visualDesignAnalysis,
    cognitiveReview,
    usabilityReport,
    outputDir
  });

  recommendations.push(...inclusiveDesignRecs.recommendations);
  artifacts.push(...inclusiveDesignRecs.artifacts);

  // ============================================================================
  // PHASE 14: COMPREHENSIVE AUDIT REPORT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 14: Generating comprehensive accessibility audit report');
  const auditReport = await ctx.task(comprehensiveAuditReportTask, {
    projectName,
    productUrl,
    wcagLevel,
    complianceScore,
    achievedComplianceLevel,
    complianceStandards,
    scope,
    barriers,
    prioritizedBarriers,
    recommendations,
    keyboardAssessment,
    screenReaderEvaluation,
    visualDesignAnalysis,
    cognitiveReview,
    formsAssessment,
    multimediaEvaluation,
    barrierAnalysis,
    usabilityReport,
    inclusiveDesignRecs,
    outputDir
  });

  artifacts.push(...auditReport.artifacts);

  // ============================================================================
  // PHASE 15: VPAT (VOLUNTARY PRODUCT ACCESSIBILITY TEMPLATE) GENERATION (OPTIONAL)
  // ============================================================================

  let vpatReport = null;
  if (generateVPAT) {
    ctx.log('info', 'Phase 15: Generating VPAT (Voluntary Product Accessibility Template)');

    vpatReport = await ctx.task(vpatGenerationTask, {
      projectName,
      productUrl,
      wcagLevel,
      complianceScore,
      achievedComplianceLevel,
      complianceReview,
      prioritizedBarriers,
      barrierAnalysis,
      outputDir
    });

    artifacts.push(...vpatReport.artifacts);
  }

  // ============================================================================
  // PHASE 16: REMEDIATION PLAN CREATION
  // ============================================================================

  let remediationPlan = null;
  if (includeRemediation) {
    ctx.log('info', 'Phase 16: Creating actionable remediation plan');

    remediationPlan = await ctx.task(remediationPlanCreationTask, {
      projectName,
      prioritizedBarriers,
      recommendations,
      inclusiveDesignRecs,
      wcagLevel,
      complianceScore,
      achievedComplianceLevel,
      outputDir
    });

    artifacts.push(...remediationPlan.artifacts);

    // Breakpoint: Review remediation plan
    await ctx.breakpoint({
      question: `Remediation plan created with ${remediationPlan.phases.length} phases and ${remediationPlan.totalTasks} tasks. Estimated effort: ${remediationPlan.estimatedEffort}. Expected compliance improvement: +${remediationPlan.expectedImprovementScore} points. Review and approve for implementation?`,
      title: 'Remediation Plan Review',
      context: {
        runId: ctx.runId,
        plan: {
          totalTasks: remediationPlan.totalTasks,
          phases: remediationPlan.phases.length,
          criticalBarriers: remediationPlan.criticalBarriers,
          highPriorityBarriers: remediationPlan.highPriorityBarriers,
          estimatedEffort: remediationPlan.estimatedEffort,
          quickWins: remediationPlan.quickWins.length,
          expectedScore: complianceScore + remediationPlan.expectedImprovementScore
        },
        files: [
          { path: remediationPlan.planPath, format: 'markdown', label: 'Remediation Plan' },
          { path: remediationPlan.roadmapPath, format: 'markdown', label: 'Implementation Roadmap' },
          { path: auditReport.mainReportPath, format: 'html', label: 'Accessibility Audit Report' }
        ]
      }
    });
  }

  // ============================================================================
  // PHASE 17: ACCESSIBILITY GOVERNANCE RECOMMENDATIONS
  // ============================================================================

  ctx.log('info', 'Phase 17: Developing accessibility governance recommendations');
  const governanceRecs = await ctx.task(accessibilityGovernanceTask, {
    projectName,
    complianceScore,
    achievedComplianceLevel,
    wcagLevel,
    prioritizedBarriers,
    remediationPlan,
    outputDir
  });

  recommendations.push(...governanceRecs.recommendations);
  artifacts.push(...governanceRecs.artifacts);

  // ============================================================================
  // PHASE 18: FINAL ACCESSIBILITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 18: Conducting final accessibility assessment and recommendations');
  const finalAssessment = await ctx.task(finalAccessibilityAssessmentTask, {
    projectName,
    wcagLevel,
    complianceScore,
    achievedComplianceLevel,
    targetComplianceLevel: wcagLevel,
    barriers,
    prioritizedBarriers,
    recommendations,
    remediationPlan,
    usabilityReport,
    auditReport,
    outputDir
  });

  artifacts.push(...finalAssessment.artifacts);

  const meetsCompliance = achievedComplianceLevel === wcagLevel ||
    (wcagLevel === 'AA' && achievedComplianceLevel === 'AAA') ||
    (wcagLevel === 'A' && ['AA', 'AAA'].includes(achievedComplianceLevel));

  // Final Breakpoint: Review complete audit
  await ctx.breakpoint({
    question: `Accessibility audit complete. WCAG ${wcagLevel} compliance: ${meetsCompliance ? 'ACHIEVED' : 'NOT MET'} (Current: ${achievedComplianceLevel}, Score: ${complianceScore}/100). ${barriers.length} barriers identified, ${recommendations.length} recommendations provided. ${finalAssessment.verdict}. Approve final audit deliverables?`,
    title: 'Final Accessibility Audit Approval',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        productUrl,
        targetWcagLevel: wcagLevel,
        achievedComplianceLevel,
        complianceScore,
        meetsCompliance,
        totalBarriers: barriers.length,
        criticalBarriers: prioritizedBarriers.filter(b => b.severity === 'critical').length,
        highPriorityBarriers: prioritizedBarriers.filter(b => b.severity === 'high').length,
        totalRecommendations: recommendations.length,
        remediationPhases: remediationPlan ? remediationPlan.phases.length : 0,
        estimatedRemediationEffort: remediationPlan ? remediationPlan.estimatedEffort : 'N/A'
      },
      assessment: {
        verdict: finalAssessment.verdict,
        readinessLevel: finalAssessment.readinessLevel,
        strengths: finalAssessment.strengths,
        criticalConcerns: finalAssessment.criticalConcerns,
        nextSteps: finalAssessment.nextSteps
      },
      files: [
        { path: auditReport.mainReportPath, format: 'html', label: 'Main Accessibility Audit Report' },
        { path: auditReport.executiveSummaryPath, format: 'pdf', label: 'Executive Summary' },
        { path: barrierAnalysis.reportPath, format: 'html', label: 'Barrier Analysis Report' },
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
    productUrl,
    complianceLevel: achievedComplianceLevel,
    complianceScore,
    targetComplianceLevel: wcagLevel,
    meetsCompliance,
    complianceGap: meetsCompliance ? 0 : 100 - complianceScore,
    barriers: {
      total: barriers.length,
      critical: prioritizedBarriers.filter(b => b.severity === 'critical').length,
      high: prioritizedBarriers.filter(b => b.severity === 'high').length,
      medium: prioritizedBarriers.filter(b => b.severity === 'medium').length,
      low: prioritizedBarriers.filter(b => b.severity === 'low').length,
      details: prioritizedBarriers
    },
    recommendations: {
      total: recommendations.length,
      details: recommendations
    },
    assessmentResults: {
      keyboardNavigation: {
        score: keyboardAssessment.score,
        issues: keyboardAssessment.barriers.length,
        status: keyboardAssessment.status
      },
      screenReaderCompatibility: {
        compatible: screenReaderEvaluation.compatible,
        testedTechnologies: screenReaderEvaluation.testedTechnologies,
        issues: screenReaderEvaluation.barriers.length
      },
      visualDesign: {
        contrastIssues: visualDesignAnalysis.contrastIssues,
        designIssues: visualDesignAnalysis.designIssues,
        score: visualDesignAnalysis.score
      },
      cognitiveAccessibility: {
        score: cognitiveReview.score,
        issues: cognitiveReview.barriers.length
      },
      forms: {
        accessible: formsAssessment.accessible,
        issues: formsAssessment.barriers.length
      },
      multimedia: {
        accessible: multimediaEvaluation.accessible,
        issues: multimediaEvaluation.barriers.length
      }
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
    usabilityReport: usabilityReport ? {
      participantCount: usabilityReport.participantCount,
      successRate: usabilityReport.successRate,
      keyFindings: usabilityReport.keyFindings,
      reportPath: usabilityReport.reportPath
    } : null,
    vpatReport: vpatReport ? {
      vpatPath: vpatReport.vpatPath,
      complianceSummary: vpatReport.complianceSummary
    } : null,
    finalAssessment: {
      verdict: finalAssessment.verdict,
      readinessLevel: finalAssessment.readinessLevel,
      recommendation: finalAssessment.recommendation,
      strengths: finalAssessment.strengths,
      concerns: finalAssessment.concerns,
      nextSteps: finalAssessment.nextSteps
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/ux-ui-design/accessibility-audit',
      timestamp: startTime,
      wcagLevel,
      complianceStandards,
      scope: scope.length,
      userPersonas: userPersonas.length,
      assistiveTechnologies: assistiveTechnologies.length
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: Accessibility Audit Planning
export const accessibilityAuditPlanningTask = defineTask('accessibility-audit-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Accessibility Audit Planning - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior Accessibility Consultant and UX Researcher',
      task: 'Plan comprehensive accessibility audit with scope definition, methodology, and success criteria',
      context: args,
      instructions: [
        '1. Define audit scope: pages, user flows, components, and features to evaluate',
        '2. Identify target user personas with disabilities (visual, auditory, motor, cognitive)',
        '3. Select appropriate assistive technologies for testing',
        '4. Define WCAG conformance level and applicable standards (WCAG 2.1, 2.2, Section 508, EN 301 549)',
        '5. Establish audit methodology: automated testing, manual testing, usability testing',
        '6. Create audit timeline and resource plan',
        '7. Define success criteria for compliance and usability',
        '8. Identify key stakeholders and reporting requirements',
        '9. Document audit scope, methodology, and plan',
        '10. Create audit kickoff documentation'
      ],
      outputFormat: 'JSON object with audit plan details'
    },
    outputSchema: {
      type: 'object',
      required: ['scopeItems', 'userPersonas', 'methodology', 'successCriteria', 'artifacts'],
      properties: {
        scopeItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['page', 'flow', 'component', 'feature'] },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              description: { type: 'string' }
            }
          }
        },
        userPersonas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              disabilityType: { type: 'string' },
              assistiveTechnology: { type: 'string' },
              primaryChallenges: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        methodology: {
          type: 'object',
          properties: {
            automatedTesting: { type: 'boolean' },
            manualTesting: { type: 'boolean' },
            usabilityTesting: { type: 'boolean' },
            expertReview: { type: 'boolean' },
            tools: { type: 'array', items: { type: 'string' } }
          }
        },
        timeline: {
          type: 'object',
          properties: {
            estimatedDuration: { type: 'string' },
            phases: { type: 'array', items: { type: 'string' } }
          }
        },
        successCriteria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              target: { type: 'string' }
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
  labels: ['agent', 'accessibility', 'audit-planning', 'ux']
}));

// Phase 2: WCAG Compliance Review
export const wcagComplianceReviewTask = defineTask('wcag-compliance-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: WCAG Compliance Standards Review - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'WCAG Expert and Accessibility Standards Specialist',
      task: 'Review WCAG standards and create comprehensive compliance checklist',
      context: args,
      instructions: [
        '1. Review WCAG 2.1 and 2.2 guidelines for target conformance level (A, AA, or AAA)',
        '2. Document all applicable success criteria for the scope',
        '3. Organize criteria by POUR principles (Perceivable, Operable, Understandable, Robust)',
        '4. Identify criteria testable through automated tools vs. manual testing',
        '5. Document testing procedures for each success criterion',
        '6. Create compliance checklist for audit execution',
        '7. Identify conformance requirements and exceptions',
        '8. Document applicable legal standards (Section 508, ADA, EN 301 549)',
        '9. Provide guidance on conformance claims',
        '10. Generate WCAG compliance reference document'
      ],
      outputFormat: 'JSON object with compliance review details'
    },
    outputSchema: {
      type: 'object',
      required: ['applicableCriteria', 'complianceChecklist', 'recommendations', 'artifacts'],
      properties: {
        wcagVersion: { type: 'string' },
        conformanceLevel: { type: 'string', enum: ['A', 'AA', 'AAA'] },
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
              testingMethod: { type: 'string', enum: ['automated', 'manual', 'both'] }
            }
          }
        },
        complianceChecklist: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              testProcedure: { type: 'string' },
              successIndicators: { type: 'array', items: { type: 'string' } }
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
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'accessibility', 'wcag', 'compliance']
}));

// Phase 3: Automated Accessibility Scan
export const automatedAccessibilityScanTask = defineTask('automated-accessibility-scan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Automated Scan - ${args.pageOrFlow}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Accessibility Testing Engineer',
      task: 'Execute automated accessibility scan using multiple tools and aggregate findings',
      context: args,
      instructions: [
        '1. Run axe-core automated accessibility scan',
        '2. Run WAVE (Web Accessibility Evaluation Tool) scan',
        '3. Run Lighthouse accessibility audit',
        '4. Scan for missing alt text, poor contrast, missing labels',
        '5. Check semantic HTML structure and landmarks',
        '6. Validate ARIA attributes and roles',
        '7. Check keyboard accessibility (tabindex, focus indicators)',
        '8. Identify duplicate IDs and invalid HTML',
        '9. Aggregate and deduplicate findings from multiple tools',
        '10. Map findings to WCAG success criteria',
        '11. Categorize by severity (critical, serious, moderate, minor)',
        '12. Generate scan report with code snippets and remediation guidance'
      ],
      outputFormat: 'JSON object with scan results'
    },
    outputSchema: {
      type: 'object',
      required: ['barriers', 'scanSummary', 'artifacts'],
      properties: {
        pageOrFlow: { type: 'string' },
        barriers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'serious', 'moderate', 'minor'] },
              wcagCriterion: { type: 'string' },
              wcagLevel: { type: 'string' },
              description: { type: 'string' },
              element: { type: 'string' },
              location: { type: 'string' },
              impact: { type: 'string' },
              remediation: { type: 'string' },
              toolsReporting: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        scanSummary: {
          type: 'object',
          properties: {
            totalIssues: { type: 'number' },
            criticalIssues: { type: 'number' },
            seriousIssues: { type: 'number' },
            moderateIssues: { type: 'number' },
            minorIssues: { type: 'number' },
            passed: { type: 'number' },
            incomplete: { type: 'number' }
          }
        },
        toolResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tool: { type: 'string' },
              issuesFound: { type: 'number' },
              score: { type: 'number' }
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
  labels: ['agent', 'accessibility', 'automated-scan', 'wcag']
}));

// Phase 4: Manual Accessibility Testing
export const manualAccessibilityTestingTask = defineTask('manual-accessibility-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Manual Accessibility Testing - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Manual Accessibility Tester and WCAG Expert',
      task: 'Conduct comprehensive manual accessibility testing for criteria not testable by automation',
      context: args,
      instructions: [
        '1. Test keyboard-only navigation through all interactive elements',
        '2. Verify logical focus order and visible focus indicators',
        '3. Test for keyboard traps and ensure all functionality is keyboard accessible',
        '4. Verify skip links, landmarks, and heading structure',
        '5. Test forms for proper labeling, error identification, and instructions',
        '6. Verify meaningful link text and button labels',
        '7. Check content reflow and zoom up to 200%',
        '8. Test for time-based content controls (pause, stop, hide)',
        '9. Verify caption and transcript availability for media',
        '10. Test error prevention and recovery mechanisms',
        '11. Assess content clarity, reading level, and cognitive load',
        '12. Document all manual testing findings with evidence'
      ],
      outputFormat: 'JSON object with manual testing results'
    },
    outputSchema: {
      type: 'object',
      required: ['barriers', 'recommendations', 'artifacts'],
      properties: {
        barriers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string' },
              severity: { type: 'string' },
              wcagCriterion: { type: 'string' },
              wcagLevel: { type: 'string' },
              description: { type: 'string' },
              location: { type: 'string' },
              userImpact: { type: 'string' },
              affectedPersonas: { type: 'array', items: { type: 'string' } },
              remediation: { type: 'string' },
              evidence: { type: 'string' }
            }
          }
        },
        testCoverage: {
          type: 'object',
          properties: {
            criteriaTested: { type: 'number' },
            totalCriteria: { type: 'number' },
            coveragePercentage: { type: 'number' }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'accessibility', 'manual-testing', 'wcag']
}));

// Phase 5: Keyboard Navigation Assessment
export const keyboardNavigationAssessmentTask = defineTask('keyboard-navigation-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Keyboard Navigation Assessment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Keyboard Accessibility Specialist',
      task: 'Comprehensively assess keyboard accessibility and focus management',
      context: args,
      instructions: [
        '1. Test Tab key navigation through all interactive elements',
        '2. Verify Shift+Tab reverse navigation works correctly',
        '3. Test Enter and Space key activation for buttons and links',
        '4. Test arrow key navigation in custom widgets (menus, tabs, sliders)',
        '5. Verify Escape key dismisses modals and dropdowns',
        '6. Test for visible and distinctive focus indicators',
        '7. Verify focus order matches visual order',
        '8. Test for keyboard traps (focus cannot escape)',
        '9. Verify skip links allow bypassing repetitive content',
        '10. Test focus management in single-page applications',
        '11. Document keyboard shortcuts and conflicts',
        '12. Generate keyboard accessibility report with scores per page/flow'
      ],
      outputFormat: 'JSON object with keyboard assessment results'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'status', 'barriers', 'recommendations', 'artifacts'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        status: { type: 'string', enum: ['excellent', 'good', 'fair', 'poor'] },
        barriers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              severity: { type: 'string' },
              location: { type: 'string' },
              wcagCriterion: { type: 'string' },
              remediation: { type: 'string' }
            }
          }
        },
        focusIndicators: {
          type: 'object',
          properties: {
            visible: { type: 'boolean' },
            distinctive: { type: 'boolean' },
            issues: { type: 'array', items: { type: 'string' } }
          }
        },
        keyboardTraps: { type: 'array', items: { type: 'string' } },
        skipLinks: {
          type: 'object',
          properties: {
            present: { type: 'boolean' },
            functional: { type: 'boolean' }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
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

// Phase 6: Screen Reader Compatibility
export const screenReaderCompatibilityTask = defineTask('screen-reader-compatibility', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Screen Reader Compatibility - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Screen Reader Accessibility Expert',
      task: 'Evaluate screen reader compatibility and assistive technology support',
      context: args,
      instructions: [
        '1. Test with NVDA (NonVisual Desktop Access) on Windows/Firefox',
        '2. Test with JAWS (Job Access With Speech) on Windows/Chrome',
        '3. Test with VoiceOver on macOS/Safari and iOS/Safari',
        '4. Verify page structure is announced (landmarks, headings, lists)',
        '5. Test form field labels, instructions, and error messages',
        '6. Verify ARIA live regions announce dynamic content',
        '7. Test modal dialogs trap focus and announce correctly',
        '8. Verify image alt text is meaningful and contextual',
        '9. Test table structure with proper headers',
        '10. Verify link and button text is descriptive',
        '11. Document screen reader specific issues and incompatibilities',
        '12. Generate screen reader compatibility matrix'
      ],
      outputFormat: 'JSON object with screen reader evaluation results'
    },
    outputSchema: {
      type: 'object',
      required: ['compatible', 'testedTechnologies', 'barriers', 'recommendations', 'artifacts'],
      properties: {
        compatible: { type: 'boolean' },
        testedTechnologies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              technology: { type: 'string' },
              browser: { type: 'string' },
              compatibility: { type: 'string', enum: ['excellent', 'good', 'fair', 'poor'] },
              majorIssues: { type: 'number' }
            }
          }
        },
        barriers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              severity: { type: 'string' },
              affectedTechnologies: { type: 'array', items: { type: 'string' } },
              wcagCriterion: { type: 'string' },
              userImpact: { type: 'string' },
              remediation: { type: 'string' }
            }
          }
        },
        structureAssessment: {
          type: 'object',
          properties: {
            landmarksCorrect: { type: 'boolean' },
            headingsStructured: { type: 'boolean' },
            ariaImplementation: { type: 'string', enum: ['excellent', 'good', 'fair', 'poor'] }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
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

// Phase 7: Color Contrast and Visual Design Analysis
export const colorContrastVisualAnalysisTask = defineTask('color-contrast-visual-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Color Contrast and Visual Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Visual Accessibility Designer',
      task: 'Analyze color contrast, visual design, and visual accessibility',
      context: args,
      instructions: [
        '1. Measure color contrast ratios for all text elements',
        '2. For WCAG AA: verify 4.5:1 for normal text, 3:1 for large text (18pt+)',
        '3. For WCAG AAA: verify 7:1 for normal text, 4.5:1 for large text',
        '4. Check contrast for interactive elements (buttons, links, form controls)',
        '5. Verify 3:1 contrast for focus indicators and UI components',
        '6. Test with color blindness simulators (protanopia, deuteranopia, tritanopia)',
        '7. Verify information is not conveyed by color alone',
        '8. Check text resize up to 200% without loss of content',
        '9. Test reflow at 320px viewport width',
        '10. Assess spacing and touch target sizes (minimum 44x44px)',
        '11. Document all contrast and visual design issues',
        '12. Provide color palette recommendations'
      ],
      outputFormat: 'JSON object with visual accessibility analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'contrastIssues', 'designIssues', 'barriers', 'recommendations', 'artifacts'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        contrastIssues: {
          type: 'number',
          description: 'Number of contrast issues found'
        },
        designIssues: {
          type: 'number',
          description: 'Number of design issues found'
        },
        barriers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              element: { type: 'string' },
              issue: { type: 'string' },
              severity: { type: 'string' },
              currentRatio: { type: 'number' },
              requiredRatio: { type: 'number' },
              wcagCriterion: { type: 'string' },
              remediation: { type: 'string' },
              suggestedColors: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        colorBlindnessIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              issue: { type: 'string' },
              affectedElements: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        touchTargets: {
          type: 'object',
          properties: {
            totalTested: { type: 'number' },
            tooSmall: { type: 'number' },
            tooClose: { type: 'number' }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'accessibility', 'color-contrast', 'visual-design']
}));

// Phase 8: Content and Cognitive Accessibility
export const contentCognitiveAccessibilityTask = defineTask('content-cognitive-accessibility', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Content and Cognitive Accessibility - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Content Accessibility and Cognitive Disability Specialist',
      task: 'Evaluate content clarity, readability, and cognitive accessibility',
      context: args,
      instructions: [
        '1. Assess content clarity and plain language usage',
        '2. Evaluate reading level (aim for 8th-9th grade for general audience)',
        '3. Check for clear headings and logical content structure',
        '4. Verify consistent navigation and predictable interactions',
        '5. Assess error prevention and clear error messages',
        '6. Check for clear instructions and help text',
        '7. Evaluate cognitive load and information density',
        '8. Verify timeout warnings and time extension options',
        '9. Check for clear visual hierarchy and spacing',
        '10. Assess use of icons, images, and visual cues to support understanding',
        '11. Evaluate form complexity and progressive disclosure',
        '12. Document cognitive accessibility barriers and recommendations'
      ],
      outputFormat: 'JSON object with cognitive accessibility evaluation'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'barriers', 'recommendations', 'artifacts'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        readabilityScore: {
          type: 'object',
          properties: {
            fleschKincaidGrade: { type: 'number' },
            target: { type: 'number' },
            meetsTarget: { type: 'boolean' }
          }
        },
        barriers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              severity: { type: 'string' },
              location: { type: 'string' },
              wcagCriterion: { type: 'string' },
              userImpact: { type: 'string' },
              remediation: { type: 'string' }
            }
          }
        },
        contentQuality: {
          type: 'object',
          properties: {
            clearHeadings: { type: 'boolean' },
            consistentNavigation: { type: 'boolean' },
            clearInstructions: { type: 'boolean' },
            errorPrevention: { type: 'boolean' }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'accessibility', 'cognitive', 'content']
}));

// Phase 9: Forms and Interactive Elements
export const formsInteractiveElementsTask = defineTask('forms-interactive-elements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Forms and Interactive Elements - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Forms Accessibility Specialist',
      task: 'Assess accessibility of forms and interactive elements',
      context: args,
      instructions: [
        '1. Verify all form fields have associated labels (visible or aria-label)',
        '2. Check for clear field instructions and help text',
        '3. Test error identification and clear error messages',
        '4. Verify error suggestions and correction guidance',
        '5. Test required field indicators (not just asterisks)',
        '6. Verify fieldset and legend for grouped controls',
        '7. Test autocomplete attributes for personal information',
        '8. Check for clear submit and reset button labels',
        '9. Test validation timing (on blur, on submit)',
        '10. Verify success confirmation messages',
        '11. Test complex widgets (date pickers, sliders, autocomplete)',
        '12. Document form accessibility issues and recommendations'
      ],
      outputFormat: 'JSON object with forms accessibility assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['accessible', 'barriers', 'recommendations', 'artifacts'],
      properties: {
        accessible: { type: 'boolean' },
        formsAssessed: { type: 'number' },
        barriers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              formName: { type: 'string' },
              issue: { type: 'string' },
              severity: { type: 'string' },
              field: { type: 'string' },
              wcagCriterion: { type: 'string' },
              remediation: { type: 'string' }
            }
          }
        },
        labelingIssues: { type: 'number' },
        errorHandlingIssues: { type: 'number' },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'accessibility', 'forms']
}));

// Phase 10: Multimedia Accessibility
export const multimediaAccessibilityTask = defineTask('multimedia-accessibility', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Multimedia Accessibility - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Multimedia Accessibility Specialist',
      task: 'Evaluate accessibility of multimedia content (video, audio, animations)',
      context: args,
      instructions: [
        '1. Check for captions on all video content (synchronized and accurate)',
        '2. Verify audio descriptions for video content with visual information',
        '3. Check for transcripts for audio-only content',
        '4. Verify media player controls are keyboard accessible',
        '5. Check for pause/stop controls for auto-playing media',
        '6. Verify no flashing content exceeds 3 flashes per second',
        '7. Test volume controls and mute functionality',
        '8. Check for sign language interpretation (if applicable for AAA)',
        '9. Verify alternative formats available for complex media',
        '10. Test media with screen readers',
        '11. Document multimedia accessibility barriers',
        '12. Provide remediation guidance for multimedia content'
      ],
      outputFormat: 'JSON object with multimedia accessibility evaluation'
    },
    outputSchema: {
      type: 'object',
      required: ['accessible', 'barriers', 'recommendations', 'artifacts'],
      properties: {
        accessible: { type: 'boolean' },
        mediaItemsAssessed: { type: 'number' },
        barriers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              mediaType: { type: 'string', enum: ['video', 'audio', 'animation'] },
              location: { type: 'string' },
              issue: { type: 'string' },
              severity: { type: 'string' },
              wcagCriterion: { type: 'string' },
              remediation: { type: 'string' }
            }
          }
        },
        captionsCoverage: {
          type: 'object',
          properties: {
            totalVideos: { type: 'number' },
            withCaptions: { type: 'number' },
            coveragePercentage: { type: 'number' }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'accessibility', 'multimedia']
}));

// Phase 11: Barrier Analysis and Prioritization
export const barrierAnalysisPrioritizationTask = defineTask('barrier-analysis-prioritization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Barrier Analysis and Prioritization - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior Accessibility Analyst',
      task: 'Analyze all barriers, calculate compliance score, and prioritize remediation',
      context: args,
      instructions: [
        '1. Aggregate all barriers from automated and manual testing',
        '2. Deduplicate barriers found by multiple methods',
        '3. Map each barrier to WCAG success criteria',
        '4. Categorize by POUR principles',
        '5. Assess severity: critical (blocker), high, medium, low',
        '6. Assess user impact by affected personas',
        '7. Calculate WCAG compliance score based on criteria passed/failed',
        '8. Determine achieved conformance level (A, AA, AAA, or Non-compliant)',
        '9. Prioritize barriers by: severity, user impact, frequency, remediation effort',
        '10. Identify quick wins (high impact, low effort)',
        '11. Group related barriers for efficient remediation',
        '12. Generate prioritized barrier list and compliance report'
      ],
      outputFormat: 'JSON object with barrier analysis and compliance assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['complianceScore', 'complianceLevel', 'prioritizedBarriers', 'reportPath', 'artifacts'],
      properties: {
        complianceScore: { type: 'number', minimum: 0, maximum: 100 },
        complianceLevel: { type: 'string', enum: ['A', 'AA', 'AAA', 'Non-compliant'] },
        prioritizedBarriers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              barrierId: { type: 'string' },
              title: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              priority: { type: 'number' },
              wcagCriterion: { type: 'string' },
              wcagLevel: { type: 'string' },
              principle: { type: 'string' },
              description: { type: 'string' },
              userImpact: { type: 'string' },
              affectedPersonas: { type: 'array', items: { type: 'string' } },
              frequency: { type: 'string' },
              locations: { type: 'array', items: { type: 'string' } },
              remediationEffort: { type: 'string', enum: ['low', 'medium', 'high'] },
              remediationGuidance: { type: 'string' }
            }
          }
        },
        barriersByPrinciple: {
          type: 'object',
          properties: {
            perceivable: { type: 'number' },
            operable: { type: 'number' },
            understandable: { type: 'number' },
            robust: { type: 'number' }
          }
        },
        barriersBySeverity: {
          type: 'object',
          properties: {
            critical: { type: 'number' },
            high: { type: 'number' },
            medium: { type: 'number' },
            low: { type: 'number' }
          }
        },
        quickWins: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              barrier: { type: 'string' },
              impact: { type: 'string' },
              effort: { type: 'string' }
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
  labels: ['agent', 'accessibility', 'analysis', 'prioritization']
}));

// Phase 12: Assistive Technology Usability Testing
export const assistiveTechnologyUsabilityTask = defineTask('assistive-technology-usability', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Assistive Technology Usability Testing - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'UX Researcher specializing in Assistive Technology Usability',
      task: 'Conduct usability testing with users of assistive technologies',
      context: args,
      instructions: [
        '1. Recruit participants matching user personas (screen reader users, keyboard-only users, etc.)',
        '2. Design task-based usability scenarios for key user flows',
        '3. Conduct moderated usability sessions with assistive technologies',
        '4. Observe task completion rates, time on task, and errors',
        '5. Collect qualitative feedback on user experience',
        '6. Identify usability barriers beyond WCAG compliance',
        '7. Document pain points and friction in user journeys',
        '8. Assess user satisfaction and perceived accessibility',
        '9. Compare performance across different assistive technologies',
        '10. Synthesize findings and recommendations',
        '11. Prioritize improvements based on user feedback',
        '12. Generate comprehensive usability testing report'
      ],
      outputFormat: 'JSON object with usability testing results'
    },
    outputSchema: {
      type: 'object',
      required: ['participantCount', 'successRate', 'keyFindings', 'recommendations', 'reportPath', 'artifacts'],
      properties: {
        participantCount: { type: 'number' },
        participantProfiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              persona: { type: 'string' },
              assistiveTechnology: { type: 'string' },
              experienceLevel: { type: 'string' }
            }
          }
        },
        successRate: {
          type: 'object',
          properties: {
            overall: { type: 'number' },
            byTask: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  task: { type: 'string' },
                  successRate: { type: 'number' },
                  avgTimeSeconds: { type: 'number' }
                }
              }
            }
          }
        },
        keyFindings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              finding: { type: 'string' },
              severity: { type: 'string' },
              affectedTasks: { type: 'array', items: { type: 'string' } },
              participantQuotes: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        usabilityIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              impact: { type: 'string' },
              frequency: { type: 'string' },
              recommendation: { type: 'string' }
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
  labels: ['agent', 'accessibility', 'usability-testing', 'user-research']
}));

// Phase 13: Inclusive Design Recommendations
export const inclusiveDesignRecommendationsTask = defineTask('inclusive-design-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 13: Inclusive Design Recommendations - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Inclusive Design Strategist',
      task: 'Develop comprehensive inclusive design recommendations',
      context: args,
      instructions: [
        '1. Review all audit findings and user feedback',
        '2. Identify patterns in accessibility barriers',
        '3. Recommend inclusive design patterns (progressive enhancement, responsive design)',
        '4. Suggest accessible component library or design system',
        '5. Recommend design tokens for color, spacing, typography',
        '6. Provide ARIA patterns for custom components',
        '7. Recommend inclusive content strategy',
        '8. Suggest accessible design process integration',
        '9. Recommend tools for designers (Figma plugins, contrast checkers)',
        '10. Provide training recommendations for design team',
        '11. Suggest accessibility testing in design phase',
        '12. Generate inclusive design guidelines document'
      ],
      outputFormat: 'JSON object with inclusive design recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'designPatterns', 'artifacts'],
      properties: {
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              recommendation: { type: 'string' },
              priority: { type: 'string' },
              impact: { type: 'string' },
              implementationGuidance: { type: 'string' }
            }
          }
        },
        designPatterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string' },
              useCase: { type: 'string' },
              accessibility: { type: 'string' },
              example: { type: 'string' }
            }
          }
        },
        designSystemRecommendations: {
          type: 'object',
          properties: {
            componentLibrary: { type: 'string' },
            designTokens: { type: 'array', items: { type: 'string' } },
            ariaPatterns: { type: 'array', items: { type: 'string' } }
          }
        },
        toolRecommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tool: { type: 'string' },
              purpose: { type: 'string' },
              link: { type: 'string' }
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
  labels: ['agent', 'accessibility', 'inclusive-design', 'ux']
}));

// Phase 14: Comprehensive Audit Report
export const comprehensiveAuditReportTask = defineTask('comprehensive-audit-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 14: Comprehensive Audit Report - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Accessibility Documentation Specialist',
      task: 'Generate comprehensive accessibility audit report with all findings',
      context: args,
      instructions: [
        '1. Create executive summary with key findings and compliance status',
        '2. Document audit methodology and scope',
        '3. Present WCAG compliance assessment and score',
        '4. Summarize barriers by principle, severity, and persona impact',
        '5. Include detailed barrier descriptions with evidence',
        '6. Document keyboard navigation findings',
        '7. Present screen reader compatibility results',
        '8. Include color contrast and visual design findings',
        '9. Document cognitive accessibility assessment',
        '10. Present forms and multimedia findings',
        '11. Include usability testing insights (if conducted)',
        '12. Provide prioritized recommendations',
        '13. Generate report in HTML, PDF, and accessible formats',
        '14. Include charts, screenshots, and visualizations'
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

// Phase 15: VPAT Generation (Optional)
export const vpatGenerationTask = defineTask('vpat-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 15: VPAT Generation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Accessibility Compliance Specialist',
      task: 'Generate VPAT (Voluntary Product Accessibility Template) documentation',
      context: args,
      instructions: [
        '1. Use VPAT 2.5 template (covering WCAG 2.2, Section 508, EN 301 549)',
        '2. Complete product information section',
        '3. Document evaluation methods and tools used',
        '4. Complete WCAG 2.2 Level A and AA conformance tables',
        '5. For each success criterion, indicate: Supports, Partially Supports, Does Not Support, or Not Applicable',
        '6. Provide remarks and explanations for each criterion',
        '7. Document known accessibility issues',
        '8. Complete Section 508 and EN 301 549 tables (if applicable)',
        '9. Include contact information for accessibility questions',
        '10. Format VPAT in accessible HTML and PDF',
        '11. Ensure VPAT itself is accessible',
        '12. Generate final VPAT document for procurement purposes'
      ],
      outputFormat: 'JSON object with VPAT details'
    },
    outputSchema: {
      type: 'object',
      required: ['vpatPath', 'complianceSummary', 'artifacts'],
      properties: {
        vpatPath: { type: 'string' },
        vpatVersion: { type: 'string' },
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
  labels: ['agent', 'accessibility', 'vpat', 'compliance']
}));

// Phase 16: Remediation Plan Creation
export const remediationPlanCreationTask = defineTask('remediation-plan-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 16: Remediation Plan Creation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Accessibility Remediation Strategist',
      task: 'Create actionable remediation plan with phased approach',
      context: args,
      instructions: [
        '1. Review all prioritized barriers and recommendations',
        '2. Group barriers by component, page, or pattern for efficient remediation',
        '3. Create remediation tasks with clear acceptance criteria',
        '4. Estimate effort for each task (hours/days)',
        '5. Assign priority (critical, high, medium, low)',
        '6. Identify dependencies between remediation tasks',
        '7. Define phases: Phase 1 (critical barriers), Phase 2 (high priority), Phase 3 (medium/low)',
        '8. Identify quick wins for early momentum',
        '9. Calculate expected compliance improvement per phase',
        '10. Provide implementation guidance and code examples',
        '11. Define testing and validation approach',
        '12. Generate remediation plan document and roadmap'
      ],
      outputFormat: 'JSON object with remediation plan'
    },
    outputSchema: {
      type: 'object',
      required: ['totalTasks', 'phases', 'estimatedEffort', 'expectedImprovementScore', 'quickWins', 'planPath', 'roadmapPath', 'artifacts'],
      properties: {
        totalTasks: { type: 'number' },
        criticalBarriers: { type: 'number' },
        highPriorityBarriers: { type: 'number' },
        phases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'number' },
              name: { type: 'string' },
              objectives: { type: 'array', items: { type: 'string' } },
              tasks: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    taskId: { type: 'string' },
                    title: { type: 'string' },
                    description: { type: 'string' },
                    priority: { type: 'string' },
                    effort: { type: 'string' },
                    barriers: { type: 'array', items: { type: 'string' } },
                    acceptanceCriteria: { type: 'array', items: { type: 'string' } },
                    implementation: { type: 'string' },
                    testing: { type: 'string' }
                  }
                }
              },
              estimatedDuration: { type: 'string' },
              expectedImprovement: { type: 'number' }
            }
          }
        },
        estimatedEffort: { type: 'string' },
        expectedImprovementScore: { type: 'number' },
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
  labels: ['agent', 'accessibility', 'remediation', 'planning']
}));

// Phase 17: Accessibility Governance
export const accessibilityGovernanceTask = defineTask('accessibility-governance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 17: Accessibility Governance - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Accessibility Program Manager',
      task: 'Develop accessibility governance and continuous improvement strategy',
      context: args,
      instructions: [
        '1. Recommend accessibility policy and standards',
        '2. Define roles and responsibilities (accessibility champion, testers)',
        '3. Establish accessibility in design and development process',
        '4. Recommend accessibility training for team',
        '5. Define accessibility testing cadence (per sprint, per release)',
        '6. Establish accessibility quality gates in CI/CD',
        '7. Recommend accessibility monitoring and regression testing',
        '8. Define accessibility metrics and KPIs',
        '9. Establish accessibility issue tracking and escalation',
        '10. Recommend user feedback mechanisms',
        '11. Define accessibility documentation requirements',
        '12. Create accessibility governance plan'
      ],
      outputFormat: 'JSON object with governance recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'artifacts'],
      properties: {
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              area: { type: 'string' },
              recommendation: { type: 'string' },
              priority: { type: 'string' },
              implementation: { type: 'string' }
            }
          }
        },
        rolesAndResponsibilities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              role: { type: 'string' },
              responsibilities: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        processIntegration: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string' },
              activities: { type: 'array', items: { type: 'string' } },
              deliverables: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        metricsAndKPIs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              target: { type: 'string' },
              frequency: { type: 'string' }
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
  labels: ['agent', 'accessibility', 'governance', 'process']
}));

// Phase 18: Final Accessibility Assessment
export const finalAccessibilityAssessmentTask = defineTask('final-accessibility-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 18: Final Accessibility Assessment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Principal Accessibility Consultant',
      task: 'Conduct final comprehensive accessibility assessment and provide verdict',
      context: args,
      instructions: [
        '1. Review overall WCAG compliance status and score',
        '2. Assess whether target conformance level is achieved',
        '3. Evaluate severity and impact of remaining barriers',
        '4. Review quality and feasibility of remediation plan',
        '5. Assess organizational readiness for accessibility',
        '6. Evaluate inclusive design implementation',
        '7. Assess legal and regulatory compliance risk',
        '8. Identify accessibility strengths and positive aspects',
        '9. Document critical concerns and blockers',
        '10. Provide clear verdict and recommendation',
        '11. Define next steps and follow-up actions',
        '12. Generate final assessment report'
      ],
      outputFormat: 'JSON object with final assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['verdict', 'readinessLevel', 'recommendation', 'strengths', 'concerns', 'criticalConcerns', 'nextSteps', 'reportPath', 'artifacts'],
      properties: {
        verdict: { type: 'string' },
        readinessLevel: { type: 'string', enum: ['production-ready', 'ready-with-plan', 'needs-remediation', 'significant-barriers'] },
        complianceAchieved: { type: 'boolean' },
        recommendation: { type: 'string', enum: ['approve-deployment', 'approve-with-plan', 'remediate-critical-first', 'major-remediation-required'] },
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
            legalRisk: { type: 'string', enum: ['low', 'medium', 'high'] },
            reputationRisk: { type: 'string', enum: ['low', 'medium', 'high'] },
            userExclusionRisk: { type: 'string', enum: ['low', 'medium', 'high'] }
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
  labels: ['agent', 'accessibility', 'final-assessment', 'verdict']
}));
