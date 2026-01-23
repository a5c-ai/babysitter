/**
 * @process specializations/security-compliance/soc2-compliance
 * @description SOC 2 Compliance Preparation Process - Comprehensive SOC 2 audit readiness process covering
 * Trust Services Criteria (TSC) assessment, control implementation, evidence collection, audit preparation,
 * Type I and Type II reporting, control testing, and continuous compliance monitoring. Implements AICPA
 * SOC 2 framework across Security, Availability, Processing Integrity, Confidentiality, and Privacy criteria.
 * @specialization Security & Compliance
 * @category Compliance & Governance
 * @inputs { organization: string, reportType: string, trustServiceCategories?: string[], auditTimeline?: string }
 * @outputs { success: boolean, complianceScore: number, controls: object[], gaps: object[], readinessLevel: string, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/security-compliance/soc2-compliance', {
 *   organization: 'Acme SaaS Inc.',
 *   reportType: 'Type II', // 'Type I' or 'Type II'
 *   trustServiceCategories: ['Security', 'Availability', 'Confidentiality'], // 'Security' (required), 'Availability', 'Processing Integrity', 'Confidentiality', 'Privacy'
 *   auditTimeline: '6-months', // '3-months', '6-months', '12-months'
 *   scope: {
 *     systems: ['production-environment', 'customer-data-platform'],
 *     services: ['SaaS platform', 'API services'],
 *     locations: ['US-East', 'US-West'],
 *     period: { start: '2024-01-01', end: '2024-12-31' }
 *   },
 *   existingControls: true,
 *   automateEvidenceCollection: true,
 *   continuousMonitoring: true,
 *   auditorSelected: false
 * });
 *
 * @references
 * - AICPA SOC 2 Trust Services Criteria: https://www.aicpa.org/soc-for-service-organizations
 * - SOC 2 Trust Services Criteria (2020): https://us.aicpa.org/content/dam/aicpa/interestareas/frc/assuranceadvisoryservices/downloadabledocuments/trust-services-criteria.pdf
 * - AICPA SOC 2 Guide: https://www.aicpa.org/resources/download/2017-trust-services-criteria-guide
 * - SOC 2 Type II Audit Guide: https://www.aicpa.org/soc4so
 * - Cloud Security Alliance SOC 2 Guidance: https://cloudsecurityalliance.org/
 * - NIST Cybersecurity Framework to SOC 2 Mapping: https://www.nist.gov/cyberframework
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organization,
    reportType = 'Type II', // 'Type I' (point-in-time) or 'Type II' (period of time)
    trustServiceCategories = ['Security', 'Availability', 'Confidentiality'], // Security is always required
    auditTimeline = '6-months',
    scope = {
      systems: [],
      services: [],
      locations: [],
      period: { start: null, end: null }
    },
    outputDir = 'soc2-compliance-output',
    existingControls = false,
    automateEvidenceCollection = true,
    continuousMonitoring = true,
    auditorSelected = false,
    frameworkMappings = ['NIST-CSF', 'ISO-27001'], // Map to other frameworks
    includeSubServiceOrgs = false,
    riskAssessmentRequired = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let complianceScore = 0;
  const controls = [];
  const gaps = [];
  const evidenceItems = [];
  const phases = [];

  // Validate that Security category is always included
  if (!trustServiceCategories.includes('Security')) {
    trustServiceCategories.unshift('Security');
  }

  ctx.log('info', `Starting SOC 2 Compliance Preparation for ${organization}`);
  ctx.log('info', `Report Type: ${reportType}, Categories: ${trustServiceCategories.join(', ')}`);
  ctx.log('info', `Audit Timeline: ${auditTimeline}, Scope: ${scope.systems?.length || 0} systems, ${scope.services?.length || 0} services`);

  // ============================================================================
  // PHASE 1: SCOPE DEFINITION AND BOUNDARY DETERMINATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining audit scope and system boundaries');

  const scopeDefinitionResult = await ctx.task(defineScopeAndBoundariesTask, {
    organization,
    reportType,
    scope,
    trustServiceCategories,
    includeSubServiceOrgs,
    outputDir
  });

  artifacts.push(...scopeDefinitionResult.artifacts);
  phases.push({ phase: 'scope-definition', result: scopeDefinitionResult });

  ctx.log('info', `Scope defined - ${scopeDefinitionResult.inScopeSystemsCount} systems, ${scopeDefinitionResult.inScopeServicesCount} services in scope`);

  // Quality Gate: Scope review
  await ctx.breakpoint({
    question: `SOC 2 scope defined for ${organization}. ${scopeDefinitionResult.inScopeSystemsCount} systems, ${scopeDefinitionResult.inScopeServicesCount} services, ${scopeDefinitionResult.trustServiceCategories.length} TSC categories. Review scope before proceeding?`,
    title: 'SOC 2 Scope Definition Review',
    context: {
      runId: ctx.runId,
      scope: {
        organization,
        reportType,
        inScopeSystemsCount: scopeDefinitionResult.inScopeSystemsCount,
        inScopeServicesCount: scopeDefinitionResult.inScopeServicesCount,
        trustServiceCategories: scopeDefinitionResult.trustServiceCategories,
        auditPeriod: scopeDefinitionResult.auditPeriod,
        subServiceOrgs: scopeDefinitionResult.subServiceOrgs
      },
      files: scopeDefinitionResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 2: TSC CRITERIA ASSESSMENT - SECURITY (REQUIRED)
  // ============================================================================

  ctx.log('info', 'Phase 2: Assessing Trust Services Criteria - Security (Common Criteria)');

  const securityCriteriaResult = await ctx.task(assessSecurityCriteriaTask, {
    organization,
    reportType,
    scope: scopeDefinitionResult.scope,
    existingControls,
    outputDir
  });

  artifacts.push(...securityCriteriaResult.artifacts);
  controls.push(...securityCriteriaResult.controls);
  gaps.push(...securityCriteriaResult.gaps);
  phases.push({ phase: 'security-criteria', result: securityCriteriaResult });

  ctx.log('info', `Security criteria assessed - ${securityCriteriaResult.controls.length} controls evaluated, ${securityCriteriaResult.gaps.length} gaps identified`);

  // ============================================================================
  // PHASE 3: TSC CRITERIA ASSESSMENT - AVAILABILITY (IF SELECTED)
  // ============================================================================

  let availabilityCriteriaResult = null;
  if (trustServiceCategories.includes('Availability')) {
    ctx.log('info', 'Phase 3: Assessing Trust Services Criteria - Availability');

    availabilityCriteriaResult = await ctx.task(assessAvailabilityCriteriaTask, {
      organization,
      reportType,
      scope: scopeDefinitionResult.scope,
      existingControls,
      outputDir
    });

    artifacts.push(...availabilityCriteriaResult.artifacts);
    controls.push(...availabilityCriteriaResult.controls);
    gaps.push(...availabilityCriteriaResult.gaps);
    phases.push({ phase: 'availability-criteria', result: availabilityCriteriaResult });

    ctx.log('info', `Availability criteria assessed - ${availabilityCriteriaResult.controls.length} controls evaluated, ${availabilityCriteriaResult.gaps.length} gaps identified`);
  }

  // ============================================================================
  // PHASE 4: TSC CRITERIA ASSESSMENT - PROCESSING INTEGRITY (IF SELECTED)
  // ============================================================================

  let processingIntegrityCriteriaResult = null;
  if (trustServiceCategories.includes('Processing Integrity')) {
    ctx.log('info', 'Phase 4: Assessing Trust Services Criteria - Processing Integrity');

    processingIntegrityCriteriaResult = await ctx.task(assessProcessingIntegrityCriteriaTask, {
      organization,
      reportType,
      scope: scopeDefinitionResult.scope,
      existingControls,
      outputDir
    });

    artifacts.push(...processingIntegrityCriteriaResult.artifacts);
    controls.push(...processingIntegrityCriteriaResult.controls);
    gaps.push(...processingIntegrityCriteriaResult.gaps);
    phases.push({ phase: 'processing-integrity-criteria', result: processingIntegrityCriteriaResult });

    ctx.log('info', `Processing Integrity criteria assessed - ${processingIntegrityCriteriaResult.controls.length} controls evaluated, ${processingIntegrityCriteriaResult.gaps.length} gaps identified`);
  }

  // ============================================================================
  // PHASE 5: TSC CRITERIA ASSESSMENT - CONFIDENTIALITY (IF SELECTED)
  // ============================================================================

  let confidentialityCriteriaResult = null;
  if (trustServiceCategories.includes('Confidentiality')) {
    ctx.log('info', 'Phase 5: Assessing Trust Services Criteria - Confidentiality');

    confidentialityCriteriaResult = await ctx.task(assessConfidentialityCriteriaTask, {
      organization,
      reportType,
      scope: scopeDefinitionResult.scope,
      existingControls,
      outputDir
    });

    artifacts.push(...confidentialityCriteriaResult.artifacts);
    controls.push(...confidentialityCriteriaResult.controls);
    gaps.push(...confidentialityCriteriaResult.gaps);
    phases.push({ phase: 'confidentiality-criteria', result: confidentialityCriteriaResult });

    ctx.log('info', `Confidentiality criteria assessed - ${confidentialityCriteriaResult.controls.length} controls evaluated, ${confidentialityCriteriaResult.gaps.length} gaps identified`);
  }

  // ============================================================================
  // PHASE 6: TSC CRITERIA ASSESSMENT - PRIVACY (IF SELECTED)
  // ============================================================================

  let privacyCriteriaResult = null;
  if (trustServiceCategories.includes('Privacy')) {
    ctx.log('info', 'Phase 6: Assessing Trust Services Criteria - Privacy');

    privacyCriteriaResult = await ctx.task(assessPrivacyCriteriaTask, {
      organization,
      reportType,
      scope: scopeDefinitionResult.scope,
      existingControls,
      outputDir
    });

    artifacts.push(...privacyCriteriaResult.artifacts);
    controls.push(...privacyCriteriaResult.controls);
    gaps.push(...privacyCriteriaResult.gaps);
    phases.push({ phase: 'privacy-criteria', result: privacyCriteriaResult });

    ctx.log('info', `Privacy criteria assessed - ${privacyCriteriaResult.controls.length} controls evaluated, ${privacyCriteriaResult.gaps.length} gaps identified`);
  }

  // Quality Gate: TSC criteria assessment review
  await ctx.breakpoint({
    question: `TSC criteria assessment complete. ${controls.length} total controls evaluated across ${trustServiceCategories.length} categories. ${gaps.length} gaps identified. Review criteria assessment?`,
    title: 'TSC Criteria Assessment Review',
    context: {
      runId: ctx.runId,
      assessment: {
        totalControls: controls.length,
        totalGaps: gaps.length,
        categories: trustServiceCategories,
        securityControls: securityCriteriaResult.controls.length,
        securityGaps: securityCriteriaResult.gaps.length,
        availabilityControls: availabilityCriteriaResult?.controls.length || 0,
        availabilityGaps: availabilityCriteriaResult?.gaps.length || 0,
        processingIntegrityControls: processingIntegrityCriteriaResult?.controls.length || 0,
        processingIntegrityGaps: processingIntegrityCriteriaResult?.gaps.length || 0,
        confidentialityControls: confidentialityCriteriaResult?.controls.length || 0,
        confidentialityGaps: confidentialityCriteriaResult?.gaps.length || 0,
        privacyControls: privacyCriteriaResult?.controls.length || 0,
        privacyGaps: privacyCriteriaResult?.gaps.length || 0
      },
      topGaps: gaps.slice(0, 10).map(g => ({
        controlId: g.controlId,
        category: g.category,
        severity: g.severity,
        description: g.description
      })),
      files: artifacts.filter(a => a.label && a.label.includes('criteria')).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 7: RISK ASSESSMENT AND THREAT ANALYSIS
  // ============================================================================

  if (riskAssessmentRequired) {
    ctx.log('info', 'Phase 7: Conducting risk assessment and threat analysis');

    const riskAssessmentResult = await ctx.task(conductRiskAssessmentTask, {
      organization,
      scope: scopeDefinitionResult.scope,
      controls,
      gaps,
      trustServiceCategories,
      outputDir
    });

    artifacts.push(...riskAssessmentResult.artifacts);
    phases.push({ phase: 'risk-assessment', result: riskAssessmentResult });

    ctx.log('info', `Risk assessment complete - ${riskAssessmentResult.risksIdentified} risks identified, ${riskAssessmentResult.criticalRisks} critical`);
  }

  // ============================================================================
  // PHASE 8: GAP REMEDIATION PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 8: Creating gap remediation plan');

  const remediationPlanResult = await ctx.task(createRemediationPlanTask, {
    organization,
    gaps,
    controls,
    auditTimeline,
    reportType,
    outputDir
  });

  artifacts.push(...remediationPlanResult.artifacts);
  phases.push({ phase: 'remediation-plan', result: remediationPlanResult });

  ctx.log('info', `Remediation plan created - ${remediationPlanResult.remediationActions} actions across ${remediationPlanResult.phases.length} phases`);

  // Quality Gate: Remediation plan review
  await ctx.breakpoint({
    question: `Gap remediation plan created with ${remediationPlanResult.remediationActions} actions over ${remediationPlanResult.estimatedTimeline}. ${remediationPlanResult.criticalActions} critical actions. Approve remediation plan?`,
    title: 'Gap Remediation Plan Review',
    context: {
      runId: ctx.runId,
      remediation: {
        totalActions: remediationPlanResult.remediationActions,
        criticalActions: remediationPlanResult.criticalActions,
        highActions: remediationPlanResult.highActions,
        phases: remediationPlanResult.phases.length,
        estimatedTimeline: remediationPlanResult.estimatedTimeline,
        estimatedEffort: remediationPlanResult.estimatedEffort
      },
      priorityActions: remediationPlanResult.actions.slice(0, 10).map(a => ({
        id: a.id,
        priority: a.priority,
        description: a.description,
        controlId: a.controlId,
        estimatedEffort: a.estimatedEffort
      })),
      files: remediationPlanResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 9: CONTROL IMPLEMENTATION AND DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Implementing controls and documenting policies');

  const controlImplementationResult = await ctx.task(implementControlsTask, {
    organization,
    gaps,
    remediationPlan: remediationPlanResult,
    controls,
    trustServiceCategories,
    outputDir
  });

  artifacts.push(...controlImplementationResult.artifacts);
  phases.push({ phase: 'control-implementation', result: controlImplementationResult });

  ctx.log('info', `Control implementation complete - ${controlImplementationResult.controlsImplemented} controls implemented, ${controlImplementationResult.policiesDocumented} policies documented`);

  // ============================================================================
  // PHASE 10: EVIDENCE COLLECTION AND MANAGEMENT
  // ============================================================================

  ctx.log('info', 'Phase 10: Setting up evidence collection and management');

  const evidenceCollectionResult = await ctx.task(setupEvidenceCollectionTask, {
    organization,
    reportType,
    controls,
    scope: scopeDefinitionResult.scope,
    auditPeriod: scopeDefinitionResult.auditPeriod,
    automateEvidenceCollection,
    outputDir
  });

  artifacts.push(...evidenceCollectionResult.artifacts);
  evidenceItems.push(...evidenceCollectionResult.evidenceItems);
  phases.push({ phase: 'evidence-collection', result: evidenceCollectionResult });

  ctx.log('info', `Evidence collection setup complete - ${evidenceCollectionResult.evidenceItems.length} evidence items configured, ${evidenceCollectionResult.automatedItems} automated`);

  // Quality Gate: Evidence collection review
  await ctx.breakpoint({
    question: `Evidence collection configured for ${evidenceCollectionResult.evidenceItems.length} items. ${evidenceCollectionResult.automatedItems} automated, ${evidenceCollectionResult.manualItems} manual. Review evidence collection setup?`,
    title: 'Evidence Collection Review',
    context: {
      runId: ctx.runId,
      evidence: {
        totalItems: evidenceCollectionResult.evidenceItems.length,
        automatedItems: evidenceCollectionResult.automatedItems,
        manualItems: evidenceCollectionResult.manualItems,
        continuousMonitoring: evidenceCollectionResult.continuousMonitoring,
        evidenceTypes: evidenceCollectionResult.evidenceTypes
      },
      sampleEvidence: evidenceCollectionResult.evidenceItems.slice(0, 15).map(e => ({
        controlId: e.controlId,
        evidenceType: e.evidenceType,
        frequency: e.frequency,
        automated: e.automated,
        source: e.source
      })),
      files: evidenceCollectionResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 11: CONTROL TESTING (TYPE II ONLY)
  // ============================================================================

  let controlTestingResult = null;
  if (reportType === 'Type II') {
    ctx.log('info', 'Phase 11: Performing control testing for Type II audit');

    controlTestingResult = await ctx.task(performControlTestingTask, {
      organization,
      controls,
      evidenceItems,
      auditPeriod: scopeDefinitionResult.auditPeriod,
      testingSamples: true,
      outputDir
    });

    artifacts.push(...controlTestingResult.artifacts);
    phases.push({ phase: 'control-testing', result: controlTestingResult });

    ctx.log('info', `Control testing complete - ${controlTestingResult.controlsTested} controls tested, ${controlTestingResult.exceptions} exceptions identified`);

    // Quality Gate: Control testing review
    await ctx.breakpoint({
      question: `Control testing complete for Type II audit. ${controlTestingResult.controlsTested} controls tested, ${controlTestingResult.exceptions} exceptions found. Review test results?`,
      title: 'Control Testing Review',
      context: {
        runId: ctx.runId,
        testing: {
          controlsTested: controlTestingResult.controlsTested,
          testsPerformed: controlTestingResult.testsPerformed,
          exceptions: controlTestingResult.exceptions,
          effectivenessRate: controlTestingResult.effectivenessRate,
          categoriesWithExceptions: controlTestingResult.categoriesWithExceptions
        },
        exceptionsList: controlTestingResult.exceptionsList.map(ex => ({
          controlId: ex.controlId,
          category: ex.category,
          severity: ex.severity,
          description: ex.description,
          remediation: ex.remediation
        })),
        files: controlTestingResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 12: CONTINUOUS MONITORING SETUP (IF ENABLED)
  // ============================================================================

  let monitoringResult = null;
  if (continuousMonitoring) {
    ctx.log('info', 'Phase 12: Setting up continuous compliance monitoring');

    monitoringResult = await ctx.task(setupContinuousMonitoringTask, {
      organization,
      controls,
      evidenceItems,
      trustServiceCategories,
      automateEvidenceCollection,
      outputDir
    });

    artifacts.push(...monitoringResult.artifacts);
    phases.push({ phase: 'continuous-monitoring', result: monitoringResult });

    ctx.log('info', `Continuous monitoring configured - ${monitoringResult.monitoredControls} controls, ${monitoringResult.alertsConfigured} alerts configured`);
  }

  // ============================================================================
  // PHASE 13: FRAMEWORK MAPPING (IF REQUESTED)
  // ============================================================================

  let frameworkMappingResult = null;
  if (frameworkMappings.length > 0) {
    ctx.log('info', 'Phase 13: Mapping SOC 2 controls to other frameworks');

    frameworkMappingResult = await ctx.task(mapToFrameworksTask, {
      organization,
      controls,
      trustServiceCategories,
      targetFrameworks: frameworkMappings,
      outputDir
    });

    artifacts.push(...frameworkMappingResult.artifacts);
    phases.push({ phase: 'framework-mapping', result: frameworkMappingResult });

    ctx.log('info', `Framework mapping complete - Mapped to ${frameworkMappingResult.frameworksMapped.length} frameworks`);
  }

  // ============================================================================
  // PHASE 14: AUDIT PREPARATION AND READINESS ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 14: Preparing for audit and assessing readiness');

  const auditPreparationResult = await ctx.task(prepareForAuditTask, {
    organization,
    reportType,
    scope: scopeDefinitionResult.scope,
    controls,
    gaps,
    evidenceItems,
    controlTesting: controlTestingResult,
    auditorSelected,
    outputDir
  });

  artifacts.push(...auditPreparationResult.artifacts);
  phases.push({ phase: 'audit-preparation', result: auditPreparationResult });

  ctx.log('info', `Audit preparation complete - Readiness level: ${auditPreparationResult.readinessLevel}`);

  // ============================================================================
  // PHASE 15: DOCUMENTATION PACKAGE GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 15: Generating comprehensive SOC 2 documentation package');

  const documentationResult = await ctx.task(generateDocumentationPackageTask, {
    organization,
    reportType,
    trustServiceCategories,
    scopeDefinition: scopeDefinitionResult,
    controls,
    gaps,
    remediationPlan: remediationPlanResult,
    evidenceCollection: evidenceCollectionResult,
    controlTesting: controlTestingResult,
    auditPreparation: auditPreparationResult,
    frameworkMapping: frameworkMappingResult,
    outputDir
  });

  artifacts.push(...documentationResult.artifacts);
  phases.push({ phase: 'documentation', result: documentationResult });

  ctx.log('info', `Documentation package generated - ${documentationResult.documentsGenerated} documents created`);

  // ============================================================================
  // PHASE 16: COMPLIANCE SCORE CALCULATION
  // ============================================================================

  ctx.log('info', 'Phase 16: Calculating SOC 2 compliance score and readiness level');

  const scoringResult = await ctx.task(calculateComplianceScoreTask, {
    organization,
    reportType,
    controls,
    gaps,
    evidenceCollection: evidenceCollectionResult,
    controlTesting: controlTestingResult,
    auditPreparation: auditPreparationResult,
    trustServiceCategories,
    outputDir
  });

  complianceScore = scoringResult.complianceScore;
  const readinessLevel = scoringResult.readinessLevel;
  artifacts.push(...scoringResult.artifacts);
  phases.push({ phase: 'scoring', result: scoringResult });

  ctx.log('info', `SOC 2 Compliance Score: ${complianceScore}/100, Readiness Level: ${readinessLevel}`);

  // Final Breakpoint: SOC 2 preparation complete
  await ctx.breakpoint({
    question: `SOC 2 Compliance Preparation Complete for ${organization}. Compliance Score: ${complianceScore}/100, Readiness: ${readinessLevel}. ${reportType} audit preparation for ${trustServiceCategories.join(', ')}. Approve SOC 2 readiness?`,
    title: 'Final SOC 2 Compliance Review',
    context: {
      runId: ctx.runId,
      summary: {
        organization,
        reportType,
        complianceScore,
        readinessLevel,
        trustServiceCategories,
        totalControls: controls.length,
        totalGaps: gaps.length,
        criticalGaps: gaps.filter(g => g.severity === 'critical').length,
        evidenceItems: evidenceItems.length,
        automatedEvidence: evidenceCollectionResult.automatedItems,
        documentationComplete: documentationResult.documentsGenerated
      },
      categoriesBreakdown: {
        security: {
          controls: securityCriteriaResult.controls.length,
          gaps: securityCriteriaResult.gaps.length
        },
        availability: availabilityCriteriaResult ? {
          controls: availabilityCriteriaResult.controls.length,
          gaps: availabilityCriteriaResult.gaps.length
        } : null,
        processingIntegrity: processingIntegrityCriteriaResult ? {
          controls: processingIntegrityCriteriaResult.controls.length,
          gaps: processingIntegrityCriteriaResult.gaps.length
        } : null,
        confidentiality: confidentialityCriteriaResult ? {
          controls: confidentialityCriteriaResult.controls.length,
          gaps: confidentialityCriteriaResult.gaps.length
        } : null,
        privacy: privacyCriteriaResult ? {
          controls: privacyCriteriaResult.controls.length,
          gaps: privacyCriteriaResult.gaps.length
        } : null
      },
      controlTesting: reportType === 'Type II' && controlTestingResult ? {
        controlsTested: controlTestingResult.controlsTested,
        exceptions: controlTestingResult.exceptions,
        effectivenessRate: controlTestingResult.effectivenessRate
      } : null,
      readinessAssessment: auditPreparationResult.readinessAssessment,
      verdict: scoringResult.verdict,
      recommendation: scoringResult.recommendation,
      files: [
        { path: documentationResult.masterReportPath, format: 'markdown', label: 'SOC 2 Compliance Master Report' },
        { path: documentationResult.systemDescriptionPath, format: 'markdown', label: 'System Description' },
        { path: documentationResult.controlMatrixPath, format: 'xlsx', label: 'Control Matrix' },
        { path: scoringResult.readinessSummaryPath, format: 'json', label: 'Readiness Summary' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    organization,
    reportType,
    complianceScore,
    readinessLevel,
    trustServiceCategories,
    auditTimeline,
    scope: scopeDefinitionResult.scope,
    controls: {
      total: controls.length,
      byCategory: {
        security: securityCriteriaResult.controls.length,
        availability: availabilityCriteriaResult?.controls.length || 0,
        processingIntegrity: processingIntegrityCriteriaResult?.controls.length || 0,
        confidentiality: confidentialityCriteriaResult?.controls.length || 0,
        privacy: privacyCriteriaResult?.controls.length || 0
      },
      implemented: controlImplementationResult.controlsImplemented,
      tested: controlTestingResult?.controlsTested || 0,
      effectivenesRate: controlTestingResult?.effectivenessRate || 0
    },
    gaps: {
      total: gaps.length,
      critical: gaps.filter(g => g.severity === 'critical').length,
      high: gaps.filter(g => g.severity === 'high').length,
      medium: gaps.filter(g => g.severity === 'medium').length,
      low: gaps.filter(g => g.severity === 'low').length,
      remediationPlan: {
        actions: remediationPlanResult.remediationActions,
        phases: remediationPlanResult.phases.length,
        estimatedTimeline: remediationPlanResult.estimatedTimeline,
        estimatedEffort: remediationPlanResult.estimatedEffort
      }
    },
    evidence: {
      totalItems: evidenceItems.length,
      automated: evidenceCollectionResult.automatedItems,
      manual: evidenceCollectionResult.manualItems,
      evidenceTypes: evidenceCollectionResult.evidenceTypes,
      continuousMonitoring: continuousMonitoring ? monitoringResult : null
    },
    controlTesting: reportType === 'Type II' ? {
      controlsTested: controlTestingResult.controlsTested,
      testsPerformed: controlTestingResult.testsPerformed,
      exceptions: controlTestingResult.exceptions,
      effectivenessRate: controlTestingResult.effectivenessRate
    } : null,
    auditReadiness: {
      readinessLevel: auditPreparationResult.readinessLevel,
      readinessScore: auditPreparationResult.readinessScore,
      readinessAssessment: auditPreparationResult.readinessAssessment,
      blockers: auditPreparationResult.blockers,
      recommendations: auditPreparationResult.recommendations
    },
    frameworkMapping: frameworkMappingResult ? {
      frameworksMapped: frameworkMappingResult.frameworksMapped,
      coverage: frameworkMappingResult.coverage
    } : null,
    artifacts,
    documentation: {
      masterReportPath: documentationResult.masterReportPath,
      systemDescriptionPath: documentationResult.systemDescriptionPath,
      controlMatrixPath: documentationResult.controlMatrixPath,
      readinessSummaryPath: scoringResult.readinessSummaryPath
    },
    duration,
    metadata: {
      processId: 'specializations/security-compliance/soc2-compliance',
      processSlug: 'soc2-compliance',
      category: 'security-compliance',
      specializationSlug: 'security-compliance',
      timestamp: startTime,
      auditTimeline,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: Define Scope and Boundaries
export const defineScopeAndBoundariesTask = defineTask('define-scope-boundaries', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Define SOC 2 Scope and Boundaries - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SOC 2 Compliance Specialist',
      task: 'Define audit scope, system boundaries, and in-scope components',
      context: {
        organization: args.organization,
        reportType: args.reportType,
        scope: args.scope,
        trustServiceCategories: args.trustServiceCategories,
        includeSubServiceOrgs: args.includeSubServiceOrgs,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define SOC 2 audit scope:',
        '   - Systems and infrastructure in scope',
        '   - Services and applications in scope',
        '   - Geographic locations covered',
        '   - Organizational units included',
        '   - Audit period (Type I: point-in-time, Type II: period)',
        '2. Identify system boundaries:',
        '   - Physical boundaries (data centers, offices)',
        '   - Logical boundaries (networks, systems, applications)',
        '   - People boundaries (employees, contractors, third parties)',
        '   - Data boundaries (data types, data flows)',
        '3. Document in-scope components:',
        '   - Production environments',
        '   - Development and staging environments (if applicable)',
        '   - Network infrastructure',
        '   - Security infrastructure (firewalls, IDS/IPS, SIEM)',
        '   - Application layer',
        '   - Database layer',
        '   - Third-party integrations',
        '4. Identify sub-service organizations (if applicable):',
        '   - Cloud providers (AWS, Azure, GCP)',
        '   - SaaS vendors',
        '   - Managed service providers',
        '   - Document carve-out vs inclusive approach',
        '5. Define Trust Service Categories to be evaluated:',
        '   - Security (Common Criteria - always required)',
        '   - Availability',
        '   - Processing Integrity',
        '   - Confidentiality',
        '   - Privacy',
        '6. Determine audit period:',
        '   - Type I: Specific date (point-in-time)',
        '   - Type II: Minimum 6 months (3, 6, 12 months typical)',
        '7. Create system description outline',
        '8. Document scope exclusions and justifications',
        '9. Generate scope definition document'
      ],
      outputFormat: 'JSON object with scope definition'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'scope', 'trustServiceCategories', 'auditPeriod', 'inScopeSystemsCount', 'inScopeServicesCount', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        scope: {
          type: 'object',
          properties: {
            systems: { type: 'array', items: { type: 'string' } },
            services: { type: 'array', items: { type: 'string' } },
            locations: { type: 'array', items: { type: 'string' } },
            organizationalUnits: { type: 'array', items: { type: 'string' } }
          }
        },
        systemBoundaries: {
          type: 'object',
          properties: {
            physical: { type: 'array', items: { type: 'string' } },
            logical: { type: 'array', items: { type: 'string' } },
            people: { type: 'array', items: { type: 'string' } },
            data: { type: 'array', items: { type: 'string' } }
          }
        },
        trustServiceCategories: { type: 'array', items: { type: 'string' } },
        auditPeriod: {
          type: 'object',
          properties: {
            start: { type: 'string' },
            end: { type: 'string' },
            duration: { type: 'string' }
          }
        },
        inScopeSystemsCount: { type: 'number' },
        inScopeServicesCount: { type: 'number' },
        subServiceOrgs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              service: { type: 'string' },
              approach: { type: 'string', enum: ['carve-out', 'inclusive'] },
              hasSOC2: { type: 'boolean' }
            }
          }
        },
        exclusions: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'soc2-compliance', 'scope-definition']
}));

// Phase 2: Assess Security Criteria (Common Criteria)
export const assessSecurityCriteriaTask = defineTask('assess-security-criteria', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Assess Security TSC - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SOC 2 Security Controls Assessor',
      task: 'Assess Security Trust Services Criteria (Common Criteria) controls',
      context: {
        organization: args.organization,
        reportType: args.reportType,
        scope: args.scope,
        existingControls: args.existingControls,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Assess Security Common Criteria controls (CC):',
        '   - CC1: Control Environment (COSO principle)',
        '     * CC1.1: Integrity and ethical values',
        '     * CC1.2: Board independence and oversight',
        '     * CC1.3: Management authority and responsibility',
        '     * CC1.4: Competence of personnel',
        '     * CC1.5: Accountability',
        '   - CC2: Communication and Information',
        '     * CC2.1: Internal communication',
        '     * CC2.2: External communication',
        '     * CC2.3: Quality information',
        '   - CC3: Risk Assessment',
        '     * CC3.1: Risk identification',
        '     * CC3.2: Risk analysis',
        '     * CC3.3: Risk response',
        '     * CC3.4: Changes affecting risks',
        '   - CC4: Monitoring Activities',
        '     * CC4.1: Ongoing and separate evaluations',
        '     * CC4.2: Communication of deficiencies',
        '   - CC5: Control Activities',
        '     * CC5.1: Policies and procedures',
        '     * CC5.2: Technology controls',
        '     * CC5.3: Vendor management',
        '   - CC6: Logical and Physical Access Controls',
        '     * CC6.1: Access control policies',
        '     * CC6.2: Authentication and authorization',
        '     * CC6.3: Access provisioning and de-provisioning',
        '     * CC6.4: Physical access restrictions',
        '     * CC6.5: Access review',
        '     * CC6.6: Encryption',
        '     * CC6.7: Network security',
        '     * CC6.8: Vulnerability management',
        '   - CC7: System Operations',
        '     * CC7.1: Change management',
        '     * CC7.2: Configuration management',
        '     * CC7.3: Security incidents',
        '     * CC7.4: Threat detection and monitoring',
        '     * CC7.5: Business continuity and disaster recovery',
        '   - CC8: Change Management',
        '     * CC8.1: System changes',
        '   - CC9: Risk Mitigation',
        '     * CC9.1: Risk mitigation activities',
        '     * CC9.2: Risk treatment',
        '2. For each control point:',
        '   - Document existing control (if any)',
        '   - Assess control design effectiveness',
        '   - Assess control operating effectiveness (Type II)',
        '   - Identify gaps or deficiencies',
        '   - Determine control owner',
        '   - Identify evidence requirements',
        '3. Rate control maturity: Not Implemented, Partially Implemented, Implemented, Effective',
        '4. Identify compensating controls',
        '5. Document control descriptions and test procedures',
        '6. Generate Security TSC assessment report'
      ],
      outputFormat: 'JSON object with Security criteria assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'controls', 'gaps', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        controls: {
          type: 'array',
          items: {
            type: 'object',
            required: ['controlId', 'category', 'subCategory', 'description', 'maturity'],
            properties: {
              controlId: { type: 'string' },
              category: { type: 'string', enum: ['CC1', 'CC2', 'CC3', 'CC4', 'CC5', 'CC6', 'CC7', 'CC8', 'CC9'] },
              subCategory: { type: 'string' },
              description: { type: 'string' },
              existingControl: { type: 'string' },
              maturity: { type: 'string', enum: ['Not Implemented', 'Partially Implemented', 'Implemented', 'Effective'] },
              controlOwner: { type: 'string' },
              evidenceRequired: { type: 'array', items: { type: 'string' } },
              testProcedure: { type: 'string' }
            }
          }
        },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              controlId: { type: 'string' },
              category: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              description: { type: 'string' },
              remediation: { type: 'string' }
            }
          }
        },
        controlEffectiveness: { type: 'number', description: 'Percentage of effective controls' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'soc2-compliance', 'security-criteria']
}));

// Phase 3: Assess Availability Criteria
export const assessAvailabilityCriteriaTask = defineTask('assess-availability-criteria', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Assess Availability TSC - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SOC 2 Availability Controls Assessor',
      task: 'Assess Availability Trust Services Criteria controls',
      context: {
        organization: args.organization,
        reportType: args.reportType,
        scope: args.scope,
        existingControls: args.existingControls,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Assess Availability criteria controls (A):',
        '   - A1.1: Availability commitments documented',
        '   - A1.2: System availability and performance monitoring',
        '   - A1.3: Environmental protections (physical)',
        '2. Evaluate system availability:',
        '   - Uptime commitments and SLAs',
        '   - Redundancy and failover mechanisms',
        '   - Load balancing and scaling',
        '   - Capacity planning and management',
        '   - Performance monitoring and alerting',
        '3. Assess infrastructure resilience:',
        '   - Geographic redundancy',
        '   - High availability architecture',
        '   - Auto-scaling capabilities',
        '   - Database replication and backup',
        '4. Review incident response for availability:',
        '   - Incident detection and alerting',
        '   - Incident response procedures',
        '   - Communication during outages',
        '   - Post-incident analysis',
        '5. Evaluate business continuity and disaster recovery:',
        '   - DR plan documentation',
        '   - RTO and RPO targets',
        '   - Backup and recovery procedures',
        '   - DR testing frequency and results',
        '6. Assess physical environmental protections:',
        '   - Data center environmental controls',
        '   - Power redundancy (UPS, generators)',
        '   - Fire suppression',
        '   - Climate control',
        '7. For each control, identify gaps and evidence',
        '8. Generate Availability TSC assessment report'
      ],
      outputFormat: 'JSON object with Availability criteria assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'controls', 'gaps', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        controls: {
          type: 'array',
          items: {
            type: 'object',
            required: ['controlId', 'category', 'description', 'maturity'],
            properties: {
              controlId: { type: 'string' },
              category: { type: 'string' },
              description: { type: 'string' },
              existingControl: { type: 'string' },
              maturity: { type: 'string', enum: ['Not Implemented', 'Partially Implemented', 'Implemented', 'Effective'] },
              controlOwner: { type: 'string' },
              evidenceRequired: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              controlId: { type: 'string' },
              category: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              description: { type: 'string' },
              remediation: { type: 'string' }
            }
          }
        },
        uptimeMetrics: {
          type: 'object',
          properties: {
            currentUptime: { type: 'number' },
            targetUptime: { type: 'number' },
            slaCommitment: { type: 'string' }
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
  labels: ['agent', 'soc2-compliance', 'availability-criteria']
}));

// Phase 4: Assess Processing Integrity Criteria
export const assessProcessingIntegrityCriteriaTask = defineTask('assess-processing-integrity-criteria', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Assess Processing Integrity TSC - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SOC 2 Processing Integrity Controls Assessor',
      task: 'Assess Processing Integrity Trust Services Criteria controls',
      context: {
        organization: args.organization,
        reportType: args.reportType,
        scope: args.scope,
        existingControls: args.existingControls,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Assess Processing Integrity criteria controls (PI):',
        '   - PI1.1: Processing integrity commitments documented',
        '   - PI1.2: Data input controls',
        '   - PI1.3: Data processing controls',
        '   - PI1.4: Data output controls',
        '   - PI1.5: Error detection and correction',
        '2. Evaluate data input controls:',
        '   - Input validation and sanitization',
        '   - Authorization for data entry',
        '   - Duplicate detection',
        '   - Data formatting and type checking',
        '3. Assess data processing controls:',
        '   - Processing logic validation',
        '   - Calculation accuracy controls',
        '   - Transaction processing completeness',
        '   - Reconciliation procedures',
        '   - Processing logs and audit trails',
        '4. Review data output controls:',
        '   - Output authorization',
        '   - Output distribution controls',
        '   - Output accuracy verification',
        '   - Report reconciliation',
        '5. Evaluate error handling:',
        '   - Error detection mechanisms',
        '   - Error logging and tracking',
        '   - Error correction procedures',
        '   - Exception handling processes',
        '6. Assess data integrity controls:',
        '   - Data accuracy',
        '   - Data completeness',
        '   - Data consistency',
        '   - Data timeliness',
        '7. Review processing commitments:',
        '   - Service level commitments for processing',
        '   - Processing accuracy standards',
        '   - Data quality standards',
        '8. For each control, identify gaps and evidence',
        '9. Generate Processing Integrity TSC assessment report'
      ],
      outputFormat: 'JSON object with Processing Integrity criteria assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'controls', 'gaps', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        controls: {
          type: 'array',
          items: {
            type: 'object',
            required: ['controlId', 'category', 'description', 'maturity'],
            properties: {
              controlId: { type: 'string' },
              category: { type: 'string' },
              description: { type: 'string' },
              existingControl: { type: 'string' },
              maturity: { type: 'string', enum: ['Not Implemented', 'Partially Implemented', 'Implemented', 'Effective'] },
              controlOwner: { type: 'string' },
              evidenceRequired: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              controlId: { type: 'string' },
              category: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              description: { type: 'string' },
              remediation: { type: 'string' }
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
  labels: ['agent', 'soc2-compliance', 'processing-integrity-criteria']
}));

// Phase 5: Assess Confidentiality Criteria
export const assessConfidentialityCriteriaTask = defineTask('assess-confidentiality-criteria', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Assess Confidentiality TSC - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SOC 2 Confidentiality Controls Assessor',
      task: 'Assess Confidentiality Trust Services Criteria controls',
      context: {
        organization: args.organization,
        reportType: args.reportType,
        scope: args.scope,
        existingControls: args.existingControls,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Assess Confidentiality criteria controls (C):',
        '   - C1.1: Confidentiality commitments documented',
        '   - C1.2: Confidential information identified',
        '2. Identify confidential information:',
        '   - Trade secrets',
        '   - Proprietary business information',
        '   - Strategic plans and pricing',
        '   - Customer confidential data',
        '   - Intellectual property',
        '3. Evaluate confidentiality controls:',
        '   - Data classification scheme',
        '   - Access controls for confidential data',
        '   - Encryption of confidential data (at rest and in transit)',
        '   - Confidentiality agreements (NDAs)',
        '   - Data handling procedures',
        '4. Assess protection mechanisms:',
        '   - Role-based access control for confidential information',
        '   - Segregation of duties',
        '   - Need-to-know access principles',
        '   - Data masking and tokenization',
        '   - Secure disposal procedures',
        '5. Review confidential data lifecycle:',
        '   - Collection and creation',
        '   - Storage and retention',
        '   - Use and processing',
        '   - Sharing and disclosure',
        '   - Destruction and disposal',
        '6. Evaluate third-party confidentiality:',
        '   - Vendor NDAs',
        '   - Sub-processor agreements',
        '   - Confidentiality clauses in contracts',
        '7. Assess employee and contractor controls:',
        '   - Background checks',
        '   - Confidentiality training',
        '   - Confidentiality agreements',
        '   - Access termination procedures',
        '8. For each control, identify gaps and evidence',
        '9. Generate Confidentiality TSC assessment report'
      ],
      outputFormat: 'JSON object with Confidentiality criteria assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'controls', 'gaps', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        controls: {
          type: 'array',
          items: {
            type: 'object',
            required: ['controlId', 'category', 'description', 'maturity'],
            properties: {
              controlId: { type: 'string' },
              category: { type: 'string' },
              description: { type: 'string' },
              existingControl: { type: 'string' },
              maturity: { type: 'string', enum: ['Not Implemented', 'Partially Implemented', 'Implemented', 'Effective'] },
              controlOwner: { type: 'string' },
              evidenceRequired: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              controlId: { type: 'string' },
              category: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              description: { type: 'string' },
              remediation: { type: 'string' }
            }
          }
        },
        confidentialDataInventory: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dataType: { type: 'string' },
              classification: { type: 'string' },
              location: { type: 'string' },
              protectionLevel: { type: 'string' }
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
  labels: ['agent', 'soc2-compliance', 'confidentiality-criteria']
}));

// Phase 6: Assess Privacy Criteria
export const assessPrivacyCriteriaTask = defineTask('assess-privacy-criteria', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Assess Privacy TSC - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SOC 2 Privacy Controls Assessor',
      task: 'Assess Privacy Trust Services Criteria controls',
      context: {
        organization: args.organization,
        reportType: args.reportType,
        scope: args.scope,
        existingControls: args.existingControls,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Assess Privacy criteria controls (P) - GAPP Principles:',
        '   - P1: Notice and Communication',
        '     * P1.1: Privacy notice provided',
        '   - P2: Choice and Consent',
        '     * P2.1: Consent obtained for collection',
        '   - P3: Collection',
        '     * P3.1: Personal information collected for disclosed purposes',
        '     * P3.2: Collection methods are fair and lawful',
        '   - P4: Use, Retention, and Disposal',
        '     * P4.1: PI used for disclosed purposes',
        '     * P4.2: Retention and disposal',
        '     * P4.3: De-identification',
        '   - P5: Access',
        '     * P5.1: Access to PI provided',
        '     * P5.2: Correction and amendment',
        '   - P6: Disclosure to Third Parties',
        '     * P6.1: Disclosure with consent',
        '     * P6.2: Third-party agreements',
        '   - P7: Security for Privacy',
        '     * P7.1: Security controls protect PI',
        '   - P8: Quality',
        '     * P8.1: PI quality maintained',
        '   - P9: Monitoring and Enforcement',
        '     * P9.1: Privacy compliance monitoring',
        '2. Review privacy notice and transparency:',
        '   - Privacy policy completeness',
        '   - Notice at collection',
        '   - Changes to privacy practices',
        '   - Contact information for privacy inquiries',
        '3. Assess consent mechanisms:',
        '   - Opt-in vs opt-out',
        '   - Granular consent options',
        '   - Consent withdrawal mechanisms',
        '   - Consent records and proof',
        '4. Evaluate data subject rights:',
        '   - Right to access (DSAR process)',
        '   - Right to rectification',
        '   - Right to erasure/deletion',
        '   - Right to data portability',
        '   - Right to object',
        '5. Assess data minimization:',
        '   - Collection limited to necessary data',
        '   - Purpose limitation',
        '   - Storage limitation',
        '6. Review third-party data sharing:',
        '   - Data processing agreements',
        '   - Sub-processor management',
        '   - Transfer impact assessments',
        '7. Evaluate privacy by design:',
        '   - Privacy impact assessments',
        '   - Privacy in system development',
        '   - Default privacy settings',
        '8. For each control, identify gaps and evidence',
        '9. Generate Privacy TSC assessment report'
      ],
      outputFormat: 'JSON object with Privacy criteria assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'controls', 'gaps', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        controls: {
          type: 'array',
          items: {
            type: 'object',
            required: ['controlId', 'category', 'principle', 'description', 'maturity'],
            properties: {
              controlId: { type: 'string' },
              category: { type: 'string' },
              principle: { type: 'string' },
              description: { type: 'string' },
              existingControl: { type: 'string' },
              maturity: { type: 'string', enum: ['Not Implemented', 'Partially Implemented', 'Implemented', 'Effective'] },
              controlOwner: { type: 'string' },
              evidenceRequired: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              controlId: { type: 'string' },
              category: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              description: { type: 'string' },
              remediation: { type: 'string' }
            }
          }
        },
        privacyNotice: {
          type: 'object',
          properties: {
            exists: { type: 'boolean' },
            lastUpdated: { type: 'string' },
            completeness: { type: 'string' }
          }
        },
        dataSubjectRights: {
          type: 'object',
          properties: {
            accessRequestProcess: { type: 'boolean' },
            deletionProcess: { type: 'boolean' },
            portabilitySupported: { type: 'boolean' }
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
  labels: ['agent', 'soc2-compliance', 'privacy-criteria']
}));

// Continuing with remaining task definitions...
// Phase 7: Conduct Risk Assessment
export const conductRiskAssessmentTask = defineTask('conduct-risk-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Conduct Risk Assessment - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Risk Assessment Specialist',
      task: 'Conduct comprehensive risk assessment for SOC 2 compliance',
      context: args,
      instructions: [
        '1. Identify risks to Trust Services Criteria',
        '2. Assess likelihood and impact of identified risks',
        '3. Evaluate existing controls against risks',
        '4. Identify residual risks',
        '5. Prioritize risks based on severity',
        '6. Document risk treatment decisions',
        '7. Generate risk assessment report'
      ],
      outputFormat: 'JSON object with risk assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'risksIdentified', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        risksIdentified: { type: 'number' },
        criticalRisks: { type: 'number' },
        highRisks: { type: 'number' },
        risks: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'soc2-compliance', 'risk-assessment']
}));

// Phase 8: Create Remediation Plan
export const createRemediationPlanTask = defineTask('create-remediation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Create Gap Remediation Plan - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Compliance Remediation Planner',
      task: 'Create comprehensive gap remediation plan with timelines',
      context: args,
      instructions: [
        '1. Prioritize gaps by severity and audit timeline',
        '2. Define remediation actions for each gap',
        '3. Assign owners and responsibilities',
        '4. Estimate effort and resources',
        '5. Create phased implementation timeline',
        '6. Define success criteria and verification methods',
        '7. Identify dependencies and blockers',
        '8. Generate remediation roadmap and Gantt chart'
      ],
      outputFormat: 'JSON object with remediation plan'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'remediationActions', 'phases', 'estimatedTimeline', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        remediationActions: { type: 'number' },
        criticalActions: { type: 'number' },
        highActions: { type: 'number' },
        phases: { type: 'array' },
        actions: { type: 'array' },
        estimatedTimeline: { type: 'string' },
        estimatedEffort: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'soc2-compliance', 'remediation-plan']
}));

// Phase 9: Implement Controls
export const implementControlsTask = defineTask('implement-controls', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Implement Controls - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Control Implementation Specialist',
      task: 'Implement and document SOC 2 controls',
      context: args,
      instructions: [
        '1. Implement technical controls',
        '2. Document policies and procedures',
        '3. Configure automated controls',
        '4. Conduct employee training',
        '5. Establish control monitoring',
        '6. Document control descriptions',
        '7. Generate implementation evidence'
      ],
      outputFormat: 'JSON object with implementation status'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'controlsImplemented', 'policiesDocumented', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        controlsImplemented: { type: 'number' },
        policiesDocumented: { type: 'number' },
        technicalControls: { type: 'number' },
        administrativeControls: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'soc2-compliance', 'control-implementation']
}));

// Phase 10: Setup Evidence Collection
export const setupEvidenceCollectionTask = defineTask('setup-evidence-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Setup Evidence Collection - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Evidence Management Specialist',
      task: 'Setup evidence collection processes and automation',
      context: args,
      instructions: [
        '1. Identify evidence requirements for each control',
        '2. Setup automated evidence collection where possible',
        '3. Define manual evidence collection procedures',
        '4. Establish evidence naming and organization',
        '5. Configure evidence repositories',
        '6. Create evidence collection schedule',
        '7. Setup evidence tracking system',
        '8. Generate evidence collection guide'
      ],
      outputFormat: 'JSON object with evidence collection setup'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'evidenceItems', 'automatedItems', 'manualItems', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        evidenceItems: { type: 'array' },
        automatedItems: { type: 'number' },
        manualItems: { type: 'number' },
        evidenceTypes: { type: 'array' },
        continuousMonitoring: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'soc2-compliance', 'evidence-collection']
}));

// Phase 11: Perform Control Testing (Type II)
export const performControlTestingTask = defineTask('perform-control-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Perform Control Testing - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Control Testing Specialist',
      task: 'Perform control testing for Type II SOC 2 audit',
      context: args,
      instructions: [
        '1. Select testing samples based on control frequency',
        '2. Test design effectiveness of controls',
        '3. Test operating effectiveness over audit period',
        '4. Document test procedures and results',
        '5. Identify control exceptions and deficiencies',
        '6. Assess severity of exceptions',
        '7. Document compensating controls',
        '8. Generate control testing report'
      ],
      outputFormat: 'JSON object with control testing results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'controlsTested', 'testsPerformed', 'exceptions', 'effectivenessRate', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        controlsTested: { type: 'number' },
        testsPerformed: { type: 'number' },
        exceptions: { type: 'number' },
        exceptionsList: { type: 'array' },
        effectivenessRate: { type: 'number' },
        categoriesWithExceptions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'soc2-compliance', 'control-testing']
}));

// Phase 12: Setup Continuous Monitoring
export const setupContinuousMonitoringTask = defineTask('setup-continuous-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Setup Continuous Monitoring - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Continuous Compliance Monitoring Specialist',
      task: 'Setup continuous compliance monitoring and alerting',
      context: args,
      instructions: [
        '1. Configure automated control monitoring',
        '2. Setup compliance dashboards',
        '3. Configure alerts for control failures',
        '4. Establish monitoring schedules',
        '5. Setup automated evidence collection',
        '6. Configure compliance reporting',
        '7. Document monitoring procedures'
      ],
      outputFormat: 'JSON object with monitoring setup'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'monitoredControls', 'alertsConfigured', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        monitoredControls: { type: 'number' },
        alertsConfigured: { type: 'number' },
        dashboardsCreated: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'soc2-compliance', 'continuous-monitoring']
}));

// Phase 13: Map to Frameworks
export const mapToFrameworksTask = defineTask('map-to-frameworks', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 13: Map to Other Frameworks - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Framework Mapping Specialist',
      task: 'Map SOC 2 controls to other compliance frameworks',
      context: args,
      instructions: [
        '1. Map SOC 2 controls to target frameworks',
        '2. Identify overlapping requirements',
        '3. Document control reusability',
        '4. Identify additional requirements',
        '5. Calculate framework coverage',
        '6. Generate mapping matrix',
        '7. Create framework comparison report'
      ],
      outputFormat: 'JSON object with framework mappings'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'frameworksMapped', 'coverage', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        frameworksMapped: { type: 'array' },
        coverage: { type: 'object' },
        mappings: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'soc2-compliance', 'framework-mapping']
}));

// Phase 14: Prepare for Audit
export const prepareForAuditTask = defineTask('prepare-for-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 14: Prepare for SOC 2 Audit - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SOC 2 Audit Preparation Specialist',
      task: 'Prepare organization for SOC 2 audit and assess readiness',
      context: args,
      instructions: [
        '1. Assess audit readiness across all categories',
        '2. Verify evidence completeness',
        '3. Conduct internal pre-audit review',
        '4. Prepare audit logistics and schedule',
        '5. Brief stakeholders on audit process',
        '6. Prepare audit response team',
        '7. Identify and address readiness blockers',
        '8. Generate readiness assessment report'
      ],
      outputFormat: 'JSON object with audit readiness'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'readinessLevel', 'readinessScore', 'readinessAssessment', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        readinessLevel: { type: 'string', enum: ['Not Ready', 'Partially Ready', 'Ready', 'Audit Ready'] },
        readinessScore: { type: 'number' },
        readinessAssessment: { type: 'object' },
        blockers: { type: 'array' },
        recommendations: { type: 'array' },
        evidenceCompleteness: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'soc2-compliance', 'audit-preparation']
}));

// Phase 15: Generate Documentation Package
export const generateDocumentationPackageTask = defineTask('generate-documentation-package', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 15: Generate Documentation Package - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SOC 2 Documentation Specialist',
      task: 'Generate comprehensive SOC 2 documentation package',
      context: args,
      instructions: [
        '1. Create System Description document',
        '2. Generate Control Matrix (by TSC category)',
        '3. Create Policy and Procedure documents',
        '4. Compile Evidence Binder',
        '5. Generate Management Assertion letter',
        '6. Create Executive Summary',
        '7. Prepare Audit Response Package',
        '8. Generate comprehensive compliance report'
      ],
      outputFormat: 'JSON object with documentation package'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'documentsGenerated', 'masterReportPath', 'systemDescriptionPath', 'controlMatrixPath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        documentsGenerated: { type: 'number' },
        masterReportPath: { type: 'string' },
        systemDescriptionPath: { type: 'string' },
        controlMatrixPath: { type: 'string' },
        policyDocuments: { type: 'array' },
        evidenceBinderPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'soc2-compliance', 'documentation']
}));

// Phase 16: Calculate Compliance Score
export const calculateComplianceScoreTask = defineTask('calculate-compliance-score', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 16: Calculate SOC 2 Compliance Score - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SOC 2 Compliance Scoring Specialist',
      task: 'Calculate SOC 2 compliance score and readiness level',
      context: args,
      instructions: [
        '1. Calculate weighted compliance score (0-100)',
        '2. Assess control maturity by category',
        '3. Evaluate evidence completeness',
        '4. Assess control testing results (Type II)',
        '5. Evaluate gap remediation progress',
        '6. Determine overall readiness level',
        '7. Identify strengths and improvement areas',
        '8. Generate compliance scorecard'
      ],
      outputFormat: 'JSON object with compliance score'
    },
    outputSchema: {
      type: 'object',
      required: ['complianceScore', 'readinessLevel', 'verdict', 'recommendation', 'readinessSummaryPath', 'artifacts'],
      properties: {
        complianceScore: { type: 'number', minimum: 0, maximum: 100 },
        readinessLevel: { type: 'string', enum: ['Not Ready', 'Partially Ready', 'Ready', 'Audit Ready'] },
        categoryScores: { type: 'object' },
        verdict: { type: 'string' },
        recommendation: { type: 'string' },
        strengths: { type: 'array' },
        improvements: { type: 'array' },
        readinessSummaryPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'soc2-compliance', 'scoring']
}));
