/**
 * @process specializations/security-compliance/gdpr-compliance
 * @description GDPR Compliance Assessment Process - Comprehensive evaluation of General Data Protection Regulation
 * compliance covering data mapping, legal basis determination, consent management, Data Protection Impact Assessment
 * (DPIA), data subject rights implementation, breach notification procedures, and overall compliance posture to ensure
 * regulatory adherence and minimize legal risk.
 * @specialization Security & Compliance
 * @category Privacy & Data Protection
 * @inputs { organization: string, scope?: string, dataProcessingActivities?: object[], complianceLevel?: string }
 * @outputs { success: boolean, complianceScore: number, dataMapping: object, legalBasis: object[], consentManagement: object, dpia: object, dataSubjectRights: object, breachNotification: object, gaps: array, recommendations: array }
 *
 * @example
 * const result = await orchestrate('specializations/security-compliance/gdpr-compliance', {
 *   organization: 'Acme Corporation',
 *   scope: 'eu-operations',
 *   dataProcessingActivities: [
 *     { name: 'Customer CRM', purpose: 'customer-relationship-management', dataTypes: ['name', 'email', 'phone'] },
 *     { name: 'Marketing Analytics', purpose: 'marketing', dataTypes: ['email', 'behavior-data'] }
 *   ],
 *   complianceLevel: 'comprehensive', // 'basic', 'standard', 'comprehensive'
 *   assessmentDepth: 'full', // 'quick', 'standard', 'full'
 *   includeDocumentation: true,
 *   generateDPIA: true
 * });
 *
 * @references
 * - GDPR Official Text: https://gdpr-info.eu/
 * - ICO GDPR Guide: https://ico.org.uk/for-organisations/guide-to-data-protection/guide-to-the-general-data-protection-regulation-gdpr/
 * - EDPB Guidelines: https://edpb.europa.eu/our-work-tools/general-guidance/gdpr-guidelines-recommendations-best-practices_en
 * - GDPR Checklist: https://gdpr.eu/checklist/
 * - CNIL GDPR Guide: https://www.cnil.fr/en/rgpd-guide
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organization,
    scope = 'all-operations',
    dataProcessingActivities = [],
    complianceLevel = 'standard', // 'basic', 'standard', 'comprehensive'
    assessmentDepth = 'standard', // 'quick', 'standard', 'full'
    includeDocumentation = true,
    generateDPIA = true,
    dataProtectionOfficer = null,
    outputDir = 'gdpr-compliance-assessment-output',
    existingPolicies = [],
    previousAssessment = null
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const phases = [];
  let complianceScore = 0;
  let overallVerdict = 'unknown';

  ctx.log('info', `Starting GDPR Compliance Assessment for ${organization}`);
  ctx.log('info', `Scope: ${scope}, Level: ${complianceLevel}, Depth: ${assessmentDepth}`);

  // ============================================================================
  // PHASE 1: GDPR SCOPE AND APPLICABILITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 1: Assessing GDPR scope and applicability');

  const scopeAssessment = await ctx.task(scopeApplicabilityTask, {
    organization,
    scope,
    dataProcessingActivities,
    complianceLevel,
    outputDir
  });

  artifacts.push(...scopeAssessment.artifacts);
  phases.push({ phase: 'scope-assessment', result: scopeAssessment });

  ctx.log('info', `Scope Assessment Complete - GDPR Applies: ${scopeAssessment.gdprApplies}, Controller Type: ${scopeAssessment.controllerType}, Territorial Scope: ${scopeAssessment.territorialScope}`);

  // Early exit if GDPR doesn't apply
  if (!scopeAssessment.gdprApplies) {
    ctx.log('info', 'GDPR does not apply to this organization. Assessment complete.');

    return {
      success: true,
      gdprApplies: false,
      reason: scopeAssessment.reasonNotApplicable,
      recommendation: scopeAssessment.recommendation,
      artifacts,
      duration: ctx.now() - startTime,
      metadata: {
        processId: 'specializations/security-compliance/gdpr-compliance',
        timestamp: startTime,
        organization,
        outputDir
      }
    };
  }

  // ============================================================================
  // PHASE 2: DATA MAPPING AND INVENTORY
  // ============================================================================

  ctx.log('info', 'Phase 2: Conducting data mapping and inventory (Article 30)');

  const dataMapping = await ctx.task(dataMappingTask, {
    organization,
    scope,
    dataProcessingActivities,
    assessmentDepth,
    controllerType: scopeAssessment.controllerType,
    outputDir
  });

  artifacts.push(...dataMapping.artifacts);
  phases.push({ phase: 'data-mapping', result: dataMapping });

  ctx.log('info', `Data Mapping Complete - Processing Activities: ${dataMapping.processingActivities.length}, Data Categories: ${dataMapping.dataCategories.length}, Data Subjects: ${dataMapping.dataSubjectCategories.length}`);

  // Quality Gate: Data mapping review
  await ctx.breakpoint({
    question: `Data mapping identified ${dataMapping.processingActivities.length} processing activities, ${dataMapping.dataCategories.length} data categories, and ${dataMapping.dataSubjectCategories.length} data subject categories. Review completeness before proceeding?`,
    title: 'Data Mapping Review',
    context: {
      runId: ctx.runId,
      organization,
      processingActivities: dataMapping.processingActivities.length,
      personalDataCategories: dataMapping.dataCategories.length,
      specialCategories: dataMapping.specialCategories.length,
      dataSubjects: dataMapping.dataSubjectCategories.length,
      dataFlows: dataMapping.dataFlows.length,
      thirdPartyProcessors: dataMapping.thirdPartyProcessors.length,
      recommendation: 'Verify all processing activities and personal data types are captured',
      files: dataMapping.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 3: LEGAL BASIS ASSESSMENT (ARTICLE 6)
  // ============================================================================

  ctx.log('info', 'Phase 3: Assessing legal basis for data processing (Article 6)');

  const legalBasis = await ctx.task(legalBasisTask, {
    organization,
    dataMapping,
    assessmentDepth,
    outputDir
  });

  artifacts.push(...legalBasis.artifacts);
  phases.push({ phase: 'legal-basis', result: legalBasis });

  ctx.log('info', `Legal Basis Assessment Complete - Activities with Valid Basis: ${legalBasis.activitiesWithValidBasis}/${legalBasis.totalActivities}, Gaps: ${legalBasis.gaps.length}`);

  // ============================================================================
  // PHASE 4: CONSENT MANAGEMENT ASSESSMENT (ARTICLE 7)
  // ============================================================================

  ctx.log('info', 'Phase 4: Assessing consent management mechanisms (Article 7)');

  const consentManagement = await ctx.task(consentManagementTask, {
    organization,
    dataMapping,
    legalBasis,
    assessmentDepth,
    outputDir
  });

  artifacts.push(...consentManagement.artifacts);
  phases.push({ phase: 'consent-management', result: consentManagement });

  ctx.log('info', `Consent Management Assessment Complete - Compliant: ${consentManagement.compliant}, Consent Mechanisms: ${consentManagement.consentMechanisms.length}`);

  // ============================================================================
  // PHASE 5: DATA SUBJECT RIGHTS IMPLEMENTATION (ARTICLES 12-23)
  // ============================================================================

  ctx.log('info', 'Phase 5: Assessing data subject rights implementation (Articles 12-23)');

  const dataSubjectRights = await ctx.task(dataSubjectRightsTask, {
    organization,
    dataMapping,
    assessmentDepth,
    outputDir
  });

  artifacts.push(...dataSubjectRights.artifacts);
  phases.push({ phase: 'data-subject-rights', result: dataSubjectRights });

  ctx.log('info', `Data Subject Rights Assessment Complete - Rights Implemented: ${dataSubjectRights.rightsImplemented.length}/8, Implementation Score: ${dataSubjectRights.implementationScore}%`);

  // Quality Gate: Data subject rights review
  if (dataSubjectRights.criticalGaps.length > 0) {
    await ctx.breakpoint({
      question: `Critical gaps found in data subject rights implementation: ${dataSubjectRights.criticalGaps.join(', ')}. These are mandatory GDPR requirements. Review and address?`,
      title: 'Critical GDPR Rights Gaps Detected',
      context: {
        runId: ctx.runId,
        organization,
        criticalGaps: dataSubjectRights.criticalGaps,
        rightsImplemented: dataSubjectRights.rightsImplemented,
        rightsMissing: dataSubjectRights.rightsMissing,
        implementationScore: dataSubjectRights.implementationScore,
        recommendation: 'All eight data subject rights must be implemented for GDPR compliance',
        files: dataSubjectRights.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 6: DATA PROTECTION IMPACT ASSESSMENT (ARTICLE 35)
  // ============================================================================

  let dpiaResult = null;

  if (generateDPIA || dataMapping.highRiskProcessing) {
    ctx.log('info', 'Phase 6: Conducting Data Protection Impact Assessment (Article 35)');

    dpiaResult = await ctx.task(dpiaTask, {
      organization,
      dataMapping,
      legalBasis,
      assessmentDepth,
      outputDir
    });

    artifacts.push(...dpiaResult.artifacts);
    phases.push({ phase: 'dpia', result: dpiaResult });

    ctx.log('info', `DPIA Complete - High Risk Activities: ${dpiaResult.highRiskActivities.length}, DPIA Required: ${dpiaResult.dpiaRequired}, Overall Risk Level: ${dpiaResult.overallRiskLevel}`);

    // Quality Gate: High-risk processing review
    if (dpiaResult.dpiaRequired && dpiaResult.overallRiskLevel === 'high') {
      await ctx.breakpoint({
        question: `High-risk data processing identified requiring mandatory DPIA. Risk level: ${dpiaResult.overallRiskLevel}. Activities: ${dpiaResult.highRiskActivities.length}. Prior consultation with DPA may be required. Review DPIA findings?`,
        title: 'High-Risk Processing - DPIA Required',
        context: {
          runId: ctx.runId,
          organization,
          overallRiskLevel: dpiaResult.overallRiskLevel,
          highRiskActivities: dpiaResult.highRiskActivities.length,
          priorConsultationRequired: dpiaResult.priorConsultationRequired,
          riskMitigations: dpiaResult.mitigations.length,
          residualRisk: dpiaResult.residualRisk,
          recommendation: 'High-risk processing requires completed DPIA and may require prior consultation with supervisory authority',
          files: dpiaResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
        }
      });
    }
  } else {
    ctx.log('info', 'Phase 6: DPIA generation skipped - no high-risk processing identified');
  }

  // ============================================================================
  // PHASE 7: SECURITY MEASURES ASSESSMENT (ARTICLE 32)
  // ============================================================================

  ctx.log('info', 'Phase 7: Assessing technical and organizational security measures (Article 32)');

  const securityMeasures = await ctx.task(securityMeasuresTask, {
    organization,
    dataMapping,
    dpiaResult,
    assessmentDepth,
    outputDir
  });

  artifacts.push(...securityMeasures.artifacts);
  phases.push({ phase: 'security-measures', result: securityMeasures });

  ctx.log('info', `Security Measures Assessment Complete - Compliance Score: ${securityMeasures.complianceScore}%, Gaps: ${securityMeasures.gaps.length}`);

  // ============================================================================
  // PHASE 8: DATA BREACH NOTIFICATION PROCEDURES (ARTICLES 33-34)
  // ============================================================================

  ctx.log('info', 'Phase 8: Assessing data breach notification procedures (Articles 33-34)');

  const breachNotification = await ctx.task(breachNotificationTask, {
    organization,
    dataMapping,
    dataProtectionOfficer,
    assessmentDepth,
    outputDir
  });

  artifacts.push(...breachNotification.artifacts);
  phases.push({ phase: 'breach-notification', result: breachNotification });

  ctx.log('info', `Breach Notification Assessment Complete - Procedures Established: ${breachNotification.proceduresEstablished}, 72-Hour Process Ready: ${breachNotification.rapidResponseCapable}`);

  // ============================================================================
  // PHASE 9: DATA PROTECTION OFFICER (DPO) ASSESSMENT (ARTICLES 37-39)
  // ============================================================================

  ctx.log('info', 'Phase 9: Assessing Data Protection Officer requirements (Articles 37-39)');

  const dpoAssessment = await ctx.task(dpoAssessmentTask, {
    organization,
    dataMapping,
    scopeAssessment,
    dataProtectionOfficer,
    assessmentDepth,
    outputDir
  });

  artifacts.push(...dpoAssessment.artifacts);
  phases.push({ phase: 'dpo-assessment', result: dpoAssessment });

  ctx.log('info', `DPO Assessment Complete - DPO Required: ${dpoAssessment.dpoRequired}, DPO Appointed: ${dpoAssessment.dpoAppointed}`);

  // ============================================================================
  // PHASE 10: INTERNATIONAL DATA TRANSFERS (CHAPTER V)
  // ============================================================================

  ctx.log('info', 'Phase 10: Assessing international data transfers (Chapter V)');

  const dataTransfers = await ctx.task(dataTransfersTask, {
    organization,
    dataMapping,
    assessmentDepth,
    outputDir
  });

  artifacts.push(...dataTransfers.artifacts);
  phases.push({ phase: 'data-transfers', result: dataTransfers });

  ctx.log('info', `Data Transfers Assessment Complete - International Transfers: ${dataTransfers.internationalTransfers.length}, Compliant: ${dataTransfers.transfersCompliant}`);

  // Quality Gate: International transfers review
  if (dataTransfers.internationalTransfers.length > 0 && !dataTransfers.transfersCompliant) {
    await ctx.breakpoint({
      question: `Non-compliant international data transfers detected. Transfers to: ${dataTransfers.nonCompliantDestinations.join(', ')}. Transfer mechanisms: ${dataTransfers.inadequateMechanisms.join(', ')}. This is a critical GDPR violation. Review and remediate?`,
      title: 'Non-Compliant International Data Transfers',
      context: {
        runId: ctx.runId,
        organization,
        internationalTransfers: dataTransfers.internationalTransfers.length,
        nonCompliantTransfers: dataTransfers.nonCompliantTransfers.length,
        nonCompliantDestinations: dataTransfers.nonCompliantDestinations,
        inadequateMechanisms: dataTransfers.inadequateMechanisms,
        recommendation: 'All international data transfers must have valid legal mechanisms (adequacy decision, SCCs, BCRs, etc.)',
        files: dataTransfers.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 11: RECORDS OF PROCESSING ACTIVITIES (ARTICLE 30)
  // ============================================================================

  ctx.log('info', 'Phase 11: Assessing records of processing activities (Article 30)');

  const processingRecords = await ctx.task(processingRecordsTask, {
    organization,
    dataMapping,
    scopeAssessment,
    assessmentDepth,
    outputDir
  });

  artifacts.push(...processingRecords.artifacts);
  phases.push({ phase: 'processing-records', result: processingRecords });

  ctx.log('info', `Processing Records Assessment Complete - Records Maintained: ${processingRecords.recordsMaintained}, Completeness: ${processingRecords.completenessScore}%`);

  // ============================================================================
  // PHASE 12: PRIVACY BY DESIGN AND DEFAULT (ARTICLE 25)
  // ============================================================================

  ctx.log('info', 'Phase 12: Assessing privacy by design and default (Article 25)');

  const privacyByDesign = await ctx.task(privacyByDesignTask, {
    organization,
    dataMapping,
    assessmentDepth,
    outputDir
  });

  artifacts.push(...privacyByDesign.artifacts);
  phases.push({ phase: 'privacy-by-design', result: privacyByDesign });

  ctx.log('info', `Privacy by Design Assessment Complete - Implementation Level: ${privacyByDesign.implementationLevel}, Score: ${privacyByDesign.score}%`);

  // ============================================================================
  // PHASE 13: THIRD-PARTY PROCESSOR COMPLIANCE (ARTICLE 28)
  // ============================================================================

  ctx.log('info', 'Phase 13: Assessing third-party processor compliance (Article 28)');

  const processorCompliance = await ctx.task(processorComplianceTask, {
    organization,
    dataMapping,
    assessmentDepth,
    outputDir
  });

  artifacts.push(...processorCompliance.artifacts);
  phases.push({ phase: 'processor-compliance', result: processorCompliance });

  ctx.log('info', `Processor Compliance Assessment Complete - Processors: ${processorCompliance.totalProcessors}, Compliant Agreements: ${processorCompliance.compliantAgreements}/${processorCompliance.totalProcessors}`);

  // ============================================================================
  // PHASE 14: GAP ANALYSIS AND COMPLIANCE SCORING
  // ============================================================================

  ctx.log('info', 'Phase 14: Conducting comprehensive gap analysis and compliance scoring');

  const gapAnalysis = await ctx.task(gapAnalysisTask, {
    organization,
    scopeAssessment,
    dataMapping,
    legalBasis,
    consentManagement,
    dataSubjectRights,
    dpiaResult,
    securityMeasures,
    breachNotification,
    dpoAssessment,
    dataTransfers,
    processingRecords,
    privacyByDesign,
    processorCompliance,
    assessmentDepth,
    outputDir
  });

  artifacts.push(...gapAnalysis.artifacts);
  phases.push({ phase: 'gap-analysis', result: gapAnalysis });

  complianceScore = gapAnalysis.overallComplianceScore;
  overallVerdict = gapAnalysis.verdict;

  ctx.log('info', `Gap Analysis Complete - Compliance Score: ${complianceScore}%, Critical Gaps: ${gapAnalysis.criticalGaps.length}, High Priority Gaps: ${gapAnalysis.highPriorityGaps.length}`);

  // Quality Gate: Critical gaps review
  if (gapAnalysis.criticalGaps.length > 0) {
    await ctx.breakpoint({
      question: `${gapAnalysis.criticalGaps.length} critical GDPR compliance gaps identified. These pose significant regulatory risk and potential fines. Review critical gaps and remediation plan?`,
      title: 'Critical GDPR Compliance Gaps Detected',
      context: {
        runId: ctx.runId,
        organization,
        complianceScore,
        verdict: overallVerdict,
        criticalGaps: gapAnalysis.criticalGaps.length,
        highPriorityGaps: gapAnalysis.highPriorityGaps.length,
        totalGaps: gapAnalysis.totalGaps,
        estimatedFineRisk: gapAnalysis.estimatedFineRisk,
        recommendation: 'Address critical gaps immediately to reduce regulatory risk',
        files: gapAnalysis.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 15: REMEDIATION ROADMAP GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 15: Generating GDPR compliance remediation roadmap');

  const remediationRoadmap = await ctx.task(remediationRoadmapTask, {
    organization,
    gapAnalysis,
    complianceScore,
    assessmentDepth,
    outputDir
  });

  artifacts.push(...remediationRoadmap.artifacts);
  phases.push({ phase: 'remediation-roadmap', result: remediationRoadmap });

  ctx.log('info', `Remediation Roadmap Generated - Phases: ${remediationRoadmap.phases.length}, Total Actions: ${remediationRoadmap.totalActions}, Estimated Timeline: ${remediationRoadmap.estimatedTimeline}`);

  // ============================================================================
  // PHASE 16: COMPLIANCE DOCUMENTATION GENERATION
  // ============================================================================

  if (includeDocumentation) {
    ctx.log('info', 'Phase 16: Generating comprehensive compliance documentation');

    const documentation = await ctx.task(documentationGenerationTask, {
      organization,
      scopeAssessment,
      dataMapping,
      legalBasis,
      consentManagement,
      dataSubjectRights,
      dpiaResult,
      securityMeasures,
      breachNotification,
      dpoAssessment,
      dataTransfers,
      processingRecords,
      privacyByDesign,
      processorCompliance,
      gapAnalysis,
      remediationRoadmap,
      complianceScore,
      overallVerdict,
      outputDir
    });

    artifacts.push(...documentation.artifacts);
    phases.push({ phase: 'documentation', result: documentation });

    ctx.log('info', `Documentation Generated - Report: ${documentation.reportPath}, Policy Templates: ${documentation.policyTemplates.length}`);
  }

  // Final Breakpoint: GDPR Compliance Assessment Complete
  await ctx.breakpoint({
    question: `GDPR Compliance Assessment Complete for ${organization}. Overall Compliance Score: ${complianceScore}%, Verdict: ${overallVerdict}. Critical Gaps: ${gapAnalysis.criticalGaps.length}, Total Recommendations: ${remediationRoadmap.totalActions}. Review assessment and approve remediation plan?`,
    title: 'GDPR Compliance Assessment Complete',
    context: {
      runId: ctx.runId,
      summary: {
        organization,
        scope,
        complianceScore,
        verdict: overallVerdict,
        gdprApplies: scopeAssessment.gdprApplies,
        controllerType: scopeAssessment.controllerType,
        processingActivities: dataMapping.processingActivities.length,
        dataSubjects: dataMapping.dataSubjectCategories.length,
        dpiaRequired: dpiaResult ? dpiaResult.dpiaRequired : false,
        dpoRequired: dpoAssessment.dpoRequired,
        internationalTransfers: dataTransfers.internationalTransfers.length
      },
      gaps: {
        total: gapAnalysis.totalGaps,
        critical: gapAnalysis.criticalGaps.length,
        high: gapAnalysis.highPriorityGaps.length,
        medium: gapAnalysis.mediumPriorityGaps.length,
        low: gapAnalysis.lowPriorityGaps.length
      },
      remediation: {
        phases: remediationRoadmap.phases.length,
        totalActions: remediationRoadmap.totalActions,
        estimatedTimeline: remediationRoadmap.estimatedTimeline,
        estimatedBudget: remediationRoadmap.estimatedBudget
      },
      riskAssessment: {
        estimatedFineRisk: gapAnalysis.estimatedFineRisk,
        reputationRisk: gapAnalysis.reputationRisk,
        operationalRisk: gapAnalysis.operationalRisk
      },
      recommendation: gapAnalysis.recommendation,
      files: includeDocumentation ? [
        { path: phases.find(p => p.phase === 'documentation').result.reportPath, format: 'markdown', label: 'GDPR Compliance Assessment Report' },
        { path: remediationRoadmap.roadmapPath, format: 'markdown', label: 'Remediation Roadmap' },
        { path: gapAnalysis.gapAnalysisPath, format: 'markdown', label: 'Gap Analysis' }
      ] : [
        { path: remediationRoadmap.roadmapPath, format: 'markdown', label: 'Remediation Roadmap' },
        { path: gapAnalysis.gapAnalysisPath, format: 'markdown', label: 'Gap Analysis' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    organization,
    scope,
    gdprApplies: scopeAssessment.gdprApplies,
    complianceScore,
    verdict: overallVerdict,
    dataMapping: {
      processingActivities: dataMapping.processingActivities.length,
      dataCategories: dataMapping.dataCategories.length,
      specialCategories: dataMapping.specialCategories.length,
      dataSubjectCategories: dataMapping.dataSubjectCategories.length,
      thirdPartyProcessors: dataMapping.thirdPartyProcessors.length,
      dataFlows: dataMapping.dataFlows.length
    },
    legalBasis: {
      activitiesWithValidBasis: legalBasis.activitiesWithValidBasis,
      totalActivities: legalBasis.totalActivities,
      mostCommonBasis: legalBasis.mostCommonBasis,
      gaps: legalBasis.gaps.length
    },
    consentManagement: {
      compliant: consentManagement.compliant,
      consentMechanisms: consentManagement.consentMechanisms.length,
      score: consentManagement.complianceScore
    },
    dataSubjectRights: {
      rightsImplemented: dataSubjectRights.rightsImplemented,
      rightsMissing: dataSubjectRights.rightsMissing,
      implementationScore: dataSubjectRights.implementationScore,
      criticalGaps: dataSubjectRights.criticalGaps.length
    },
    dpia: dpiaResult ? {
      dpiaRequired: dpiaResult.dpiaRequired,
      highRiskActivities: dpiaResult.highRiskActivities.length,
      overallRiskLevel: dpiaResult.overallRiskLevel,
      priorConsultationRequired: dpiaResult.priorConsultationRequired,
      mitigations: dpiaResult.mitigations.length
    } : null,
    securityMeasures: {
      complianceScore: securityMeasures.complianceScore,
      implementedControls: securityMeasures.implementedControls.length,
      gaps: securityMeasures.gaps.length
    },
    breachNotification: {
      proceduresEstablished: breachNotification.proceduresEstablished,
      rapidResponseCapable: breachNotification.rapidResponseCapable,
      complianceScore: breachNotification.complianceScore
    },
    dpoAssessment: {
      dpoRequired: dpoAssessment.dpoRequired,
      dpoAppointed: dpoAssessment.dpoAppointed,
      compliant: dpoAssessment.compliant
    },
    dataTransfers: {
      internationalTransfers: dataTransfers.internationalTransfers.length,
      transfersCompliant: dataTransfers.transfersCompliant,
      nonCompliantTransfers: dataTransfers.nonCompliantTransfers.length
    },
    processingRecords: {
      recordsMaintained: processingRecords.recordsMaintained,
      completenessScore: processingRecords.completenessScore
    },
    privacyByDesign: {
      implementationLevel: privacyByDesign.implementationLevel,
      score: privacyByDesign.score
    },
    processorCompliance: {
      totalProcessors: processorCompliance.totalProcessors,
      compliantAgreements: processorCompliance.compliantAgreements,
      nonCompliantProcessors: processorCompliance.nonCompliantProcessors.length
    },
    gaps: [
      ...gapAnalysis.criticalGaps.map(g => ({ ...g, priority: 'critical' })),
      ...gapAnalysis.highPriorityGaps.map(g => ({ ...g, priority: 'high' })),
      ...gapAnalysis.mediumPriorityGaps.map(g => ({ ...g, priority: 'medium' })),
      ...gapAnalysis.lowPriorityGaps.map(g => ({ ...g, priority: 'low' }))
    ],
    totalGaps: gapAnalysis.totalGaps,
    recommendations: remediationRoadmap.recommendations,
    remediation: {
      phases: remediationRoadmap.phases,
      totalActions: remediationRoadmap.totalActions,
      estimatedTimeline: remediationRoadmap.estimatedTimeline,
      estimatedBudget: remediationRoadmap.estimatedBudget,
      quickWins: remediationRoadmap.quickWins
    },
    riskAssessment: {
      estimatedFineRisk: gapAnalysis.estimatedFineRisk,
      reputationRisk: gapAnalysis.reputationRisk,
      operationalRisk: gapAnalysis.operationalRisk
    },
    artifacts,
    phases,
    documentation: includeDocumentation ? {
      reportPath: phases.find(p => p.phase === 'documentation').result.reportPath,
      policyTemplates: phases.find(p => p.phase === 'documentation').result.policyTemplates,
      procedureDocuments: phases.find(p => p.phase === 'documentation').result.procedureDocuments
    } : null,
    duration,
    metadata: {
      processId: 'specializations/security-compliance/gdpr-compliance',
      processSlug: 'gdpr-compliance',
      category: 'security-compliance',
      specializationSlug: 'security-compliance',
      timestamp: startTime,
      complianceLevel,
      assessmentDepth,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: Scope and Applicability Assessment
export const scopeApplicabilityTask = defineTask('scope-applicability', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: GDPR Scope and Applicability Assessment - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'GDPR Compliance Expert specializing in territorial and material scope',
      task: 'Determine if GDPR applies to the organization and define scope of assessment',
      context: {
        organization: args.organization,
        scope: args.scope,
        dataProcessingActivities: args.dataProcessingActivities,
        complianceLevel: args.complianceLevel,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Determine if GDPR applies based on territorial scope (Article 3):',
        '   - Establishment in EU: Organization has establishment in EU member state',
        '   - Targeting EU residents: Offering goods/services to EU data subjects',
        '   - Monitoring EU residents: Monitoring behavior of EU data subjects',
        '2. Identify whether organization is:',
        '   - Data Controller: Determines purposes and means of processing',
        '   - Data Processor: Processes data on behalf of controller',
        '   - Joint Controller: Jointly determines purposes and means',
        '   - Third Party: Separate controller with own purposes',
        '3. Assess material scope (Article 2):',
        '   - Processing of personal data',
        '   - Wholly or partly by automated means',
        '   - Manual processing as part of filing system',
        '4. Identify exemptions if applicable:',
        '   - Purely personal/household activities',
        '   - National security',
        '   - Law enforcement (covered by LED)',
        '5. Determine geographic scope of operations',
        '6. Identify EU member states where data subjects are located',
        '7. Determine lead supervisory authority if applicable',
        '8. Assess cross-border processing',
        '9. Document scope determination rationale',
        '10. Create scope assessment report'
      ],
      outputFormat: 'JSON object with GDPR applicability and scope assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['gdprApplies', 'controllerType', 'territorialScope', 'artifacts'],
      properties: {
        gdprApplies: { type: 'boolean' },
        territorialScope: {
          type: 'string',
          enum: ['establishment-in-eu', 'targeting-eu-residents', 'monitoring-eu-residents', 'not-applicable']
        },
        controllerType: {
          type: 'string',
          enum: ['controller', 'processor', 'joint-controller', 'not-applicable']
        },
        materiaScopeApplies: { type: 'boolean' },
        exemptions: { type: 'array', items: { type: 'string' } },
        euMemberStates: { type: 'array', items: { type: 'string' }, description: 'EU states where data subjects located' },
        leadSupervisoryAuthority: { type: 'string' },
        crossBorderProcessing: { type: 'boolean' },
        estimatedDataSubjects: { type: 'number' },
        reasonNotApplicable: { type: 'string' },
        recommendation: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'gdpr-compliance', 'scope']
}));

// Phase 2: Data Mapping and Inventory (Article 30)
export const dataMappingTask = defineTask('data-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Data Mapping and Inventory - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Protection and Privacy Analyst',
      task: 'Create comprehensive data inventory and processing activity records (Article 30 ROPA)',
      context: {
        organization: args.organization,
        scope: args.scope,
        dataProcessingActivities: args.dataProcessingActivities,
        assessmentDepth: args.assessmentDepth,
        controllerType: args.controllerType,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify all data processing activities',
        '2. For each processing activity, document (Article 30):',
        '   - Name and contact details of controller/processor',
        '   - Purposes of processing',
        '   - Categories of data subjects (customers, employees, prospects, etc.)',
        '   - Categories of personal data (name, email, IP address, etc.)',
        '   - Categories of special category data (Article 9): health, racial/ethnic origin, political opinions, religious beliefs, trade union membership, genetic data, biometric data, sex life, sexual orientation',
        '   - Categories of recipients (internal departments, third parties)',
        '   - International data transfers',
        '   - Retention periods or criteria',
        '   - Technical and organizational security measures',
        '3. Map data flows:',
        '   - Data sources (collection points)',
        '   - Data storage locations',
        '   - Data processing locations',
        '   - Data sharing/transfers',
        '   - Data destruction/deletion',
        '4. Identify third-party processors and sub-processors',
        '5. Classify data sensitivity levels',
        '6. Identify high-risk processing activities requiring DPIA',
        '7. Create visual data flow diagrams',
        '8. Generate Records of Processing Activities (ROPA) document',
        '9. Create data inventory spreadsheet'
      ],
      outputFormat: 'JSON object with comprehensive data mapping'
    },
    outputSchema: {
      type: 'object',
      required: ['processingActivities', 'dataCategories', 'dataSubjectCategories', 'artifacts'],
      properties: {
        processingActivities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              purpose: { type: 'string' },
              dataSubjects: { type: 'array', items: { type: 'string' } },
              personalDataCategories: { type: 'array', items: { type: 'string' } },
              specialCategories: { type: 'array', items: { type: 'string' } },
              recipients: { type: 'array', items: { type: 'string' } },
              internationalTransfers: { type: 'boolean' },
              retentionPeriod: { type: 'string' },
              securityMeasures: { type: 'array', items: { type: 'string' } },
              riskLevel: { type: 'string', enum: ['low', 'medium', 'high'] }
            }
          }
        },
        dataCategories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              examples: { type: 'array', items: { type: 'string' } },
              sensitivity: { type: 'string', enum: ['normal', 'sensitive', 'special-category'] }
            }
          }
        },
        specialCategories: {
          type: 'array',
          items: { type: 'string' },
          description: 'Article 9 special categories of data'
        },
        dataSubjectCategories: {
          type: 'array',
          items: { type: 'string' },
          description: 'Types of data subjects (customers, employees, etc.)'
        },
        dataFlows: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              source: { type: 'string' },
              destination: { type: 'string' },
              dataCategories: { type: 'array', items: { type: 'string' } },
              purpose: { type: 'string' }
            }
          }
        },
        thirdPartyProcessors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              service: { type: 'string' },
              dataProcessed: { type: 'array', items: { type: 'string' } },
              location: { type: 'string' },
              dpaInPlace: { type: 'boolean' }
            }
          }
        },
        highRiskProcessing: { type: 'boolean' },
        totalDataSubjectsEstimate: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'gdpr-compliance', 'data-mapping']
}));

// Phase 3: Legal Basis Assessment (Article 6)
export const legalBasisTask = defineTask('legal-basis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Legal Basis Assessment - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Privacy Legal Analyst',
      task: 'Assess legal basis for each data processing activity under Article 6 GDPR',
      context: {
        organization: args.organization,
        dataMapping: args.dataMapping,
        assessmentDepth: args.assessmentDepth,
        outputDir: args.outputDir
      },
      instructions: [
        '1. For each processing activity, identify legal basis under Article 6(1):',
        '   a) Consent: Data subject has given clear consent',
        '   b) Contract: Processing necessary for contract performance',
        '   c) Legal obligation: Processing necessary to comply with legal obligation',
        '   d) Vital interests: Processing necessary to protect vital interests',
        '   e) Public task: Processing necessary for public task or official authority',
        '   f) Legitimate interests: Processing necessary for legitimate interests (controller or third party)',
        '2. For special category data (Article 9), identify additional legal basis:',
        '   - Explicit consent',
        '   - Employment/social security law',
        '   - Vital interests',
        '   - Legitimate activities of foundation/association',
        '   - Data made public by data subject',
        '   - Legal claims',
        '   - Substantial public interest',
        '   - Health/social care',
        '   - Public health',
        '   - Archiving/research/statistics',
        '3. Assess if legal basis is appropriate and documented',
        '4. Identify processing activities without valid legal basis',
        '5. For legitimate interests basis, verify legitimate interests assessment (LIA) conducted',
        '6. Verify legal basis is communicated to data subjects',
        '7. Document legal basis for each processing activity',
        '8. Identify gaps and recommendations'
      ],
      outputFormat: 'JSON object with legal basis assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['activitiesWithValidBasis', 'totalActivities', 'gaps', 'artifacts'],
      properties: {
        legalBasisAssessment: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              activityId: { type: 'string' },
              activityName: { type: 'string' },
              legalBasis: {
                type: 'string',
                enum: ['consent', 'contract', 'legal-obligation', 'vital-interests', 'public-task', 'legitimate-interests', 'none']
              },
              specialCategoryBasis: { type: 'string' },
              documented: { type: 'boolean' },
              liaConducted: { type: 'boolean' },
              communicatedToSubjects: { type: 'boolean' },
              valid: { type: 'boolean' },
              issues: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        activitiesWithValidBasis: { type: 'number' },
        totalActivities: { type: 'number' },
        mostCommonBasis: { type: 'string' },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              activityId: { type: 'string' },
              gap: { type: 'string' },
              recommendation: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
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
  labels: ['agent', 'gdpr-compliance', 'legal-basis']
}));

// Phase 4: Consent Management Assessment (Article 7)
export const consentManagementTask = defineTask('consent-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Consent Management Assessment - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Consent and Privacy Specialist',
      task: 'Assess consent management mechanisms for GDPR compliance',
      context: {
        organization: args.organization,
        dataMapping: args.dataMapping,
        legalBasis: args.legalBasis,
        assessmentDepth: args.assessmentDepth,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify all processing activities relying on consent',
        '2. Assess consent mechanisms against GDPR requirements (Article 7):',
        '   - Freely given: Not conditional, no imbalance of power',
        '   - Specific: Separate consent for each purpose',
        '   - Informed: Clear information about processing',
        '   - Unambiguous: Clear affirmative action (no pre-ticked boxes)',
        '   - Granular: Separate consent for different purposes',
        '   - Easy to withdraw: As easy to withdraw as to give',
        '   - Documented: Records of consent maintained',
        '3. For special category data, verify explicit consent obtained',
        '4. Assess consent language for clarity and transparency',
        '5. Verify no bundled consent (consent not condition for service unless necessary)',
        '6. Check withdrawal mechanisms are easily accessible',
        '7. Verify consent records maintained with:',
        '   - Who consented',
        '   - When consented',
        '   - What was consented to',
        '   - How consent was obtained',
        '8. Assess age verification for children under 16 (Article 8)',
        '9. Review cookie consent mechanisms',
        '10. Identify consent management gaps and recommendations'
      ],
      outputFormat: 'JSON object with consent management assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['compliant', 'consentMechanisms', 'complianceScore', 'artifacts'],
      properties: {
        compliant: { type: 'boolean' },
        consentMechanisms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              mechanism: { type: 'string' },
              processingActivities: { type: 'array', items: { type: 'string' } },
              freelyGiven: { type: 'boolean' },
              specific: { type: 'boolean' },
              informed: { type: 'boolean' },
              unambiguous: { type: 'boolean' },
              granular: { type: 'boolean' },
              withdrawalEasy: { type: 'boolean' },
              documented: { type: 'boolean' },
              compliant: { type: 'boolean' },
              issues: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        consentRecordsSystem: { type: 'boolean' },
        ageVerificationRequired: { type: 'boolean' },
        ageVerificationImplemented: { type: 'boolean' },
        cookieConsentCompliant: { type: 'boolean' },
        complianceScore: { type: 'number', minimum: 0, maximum: 100 },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gap: { type: 'string' },
              recommendation: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
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
  labels: ['agent', 'gdpr-compliance', 'consent']
}));

// Phase 5: Data Subject Rights Implementation (Articles 12-23)
export const dataSubjectRightsTask = defineTask('data-subject-rights', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Data Subject Rights Implementation - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Protection Rights Specialist',
      task: 'Assess implementation of all eight data subject rights under GDPR',
      context: {
        organization: args.organization,
        dataMapping: args.dataMapping,
        assessmentDepth: args.assessmentDepth,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Assess implementation of all eight data subject rights:',
        '   a) Right to be informed (Articles 13-14): Privacy notices, transparency',
        '   b) Right of access (Article 15): Subject access requests (SAR)',
        '   c) Right to rectification (Article 16): Correct inaccurate data',
        '   d) Right to erasure/"Right to be forgotten" (Article 17): Delete data',
        '   e) Right to restrict processing (Article 18): Temporarily halt processing',
        '   f) Right to data portability (Article 20): Receive data in machine-readable format',
        '   g) Right to object (Article 21): Object to processing',
        '   h) Rights related to automated decision-making (Article 22): No solely automated decisions',
        '2. For each right, assess:',
        '   - Procedures established',
        '   - Response timeframes (1 month, extendable by 2 months)',
        '   - Free of charge (unless manifestly unfounded/excessive)',
        '   - Identity verification process',
        '   - Request tracking system',
        '   - Staff training',
        '   - Technical capability to fulfill requests',
        '3. Review privacy notices for completeness (Articles 13-14):',
        '   - Identity of controller',
        '   - Contact details of DPO',
        '   - Purposes and legal basis',
        '   - Legitimate interests',
        '   - Recipients',
        '   - International transfers',
        '   - Retention periods',
        '   - Rights of data subjects',
        '   - Right to withdraw consent',
        '   - Right to lodge complaint',
        '   - Automated decision-making',
        '4. Assess SAR process capability',
        '5. Verify data portability technical implementation',
        '6. Review automated decision-making processes',
        '7. Identify critical gaps in rights implementation'
      ],
      outputFormat: 'JSON object with data subject rights assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['rightsImplemented', 'rightsMissing', 'implementationScore', 'artifacts'],
      properties: {
        rightsAssessment: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              right: {
                type: 'string',
                enum: ['informed', 'access', 'rectification', 'erasure', 'restriction', 'portability', 'objection', 'automated-decisions']
              },
              implemented: { type: 'boolean' },
              proceduresEstablished: { type: 'boolean' },
              timeframeCompliant: { type: 'boolean' },
              freeOfCharge: { type: 'boolean' },
              identityVerification: { type: 'boolean' },
              trackingSystem: { type: 'boolean' },
              staffTrained: { type: 'boolean' },
              technicalCapability: { type: 'boolean' },
              compliant: { type: 'boolean' },
              issues: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        rightsImplemented: { type: 'array', items: { type: 'string' } },
        rightsMissing: { type: 'array', items: { type: 'string' } },
        privacyNoticesCompliant: { type: 'boolean' },
        sarProcessCapable: { type: 'boolean' },
        dataPortabilityTechnicalCapability: { type: 'boolean' },
        automatedDecisionMaking: { type: 'boolean' },
        implementationScore: { type: 'number', minimum: 0, maximum: 100 },
        criticalGaps: { type: 'array', items: { type: 'string' } },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              right: { type: 'string' },
              gap: { type: 'string' },
              recommendation: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
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
  labels: ['agent', 'gdpr-compliance', 'data-subject-rights']
}));

// Phase 6: Data Protection Impact Assessment - DPIA (Article 35)
export const dpiaTask = defineTask('dpia', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Data Protection Impact Assessment (DPIA) - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Protection Impact Assessment Specialist',
      task: 'Conduct Data Protection Impact Assessment for high-risk processing',
      context: {
        organization: args.organization,
        dataMapping: args.dataMapping,
        legalBasis: args.legalBasis,
        assessmentDepth: args.assessmentDepth,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify high-risk processing activities requiring DPIA (Article 35(3)):',
        '   - Systematic and extensive automated processing with legal/similar effects',
        '   - Large-scale processing of special category data',
        '   - Systematic monitoring of publicly accessible areas at large scale',
        '   - Use of new technologies',
        '   - Profiling with legal/similar effects',
        '   - Processing that prevents data subjects from exercising rights',
        '   - Matching/combining datasets',
        '   - Processing of vulnerable data subjects (children)',
        '   - Large-scale processing of biometric data',
        '2. For each high-risk activity, conduct DPIA including:',
        '   - Systematic description of processing operations and purposes',
        '   - Assessment of necessity and proportionality',
        '   - Assessment of risks to rights and freedoms of data subjects',
        '   - Measures to address risks (security, safeguards, mechanisms)',
        '3. Assess risks using methodology:',
        '   - Likelihood: remote, possible, probable',
        '   - Severity: limited, significant, severe',
        '   - Risk level: low, medium, high',
        '4. Identify mitigation measures',
        '5. Calculate residual risk after mitigations',
        '6. Determine if prior consultation with supervisory authority required (Article 36):',
        '   - High residual risk after mitigations',
        '   - Controller cannot take sufficient measures',
        '7. Seek views of data subjects or their representatives where appropriate',
        '8. Document DPIA findings comprehensively',
        '9. Generate formal DPIA report'
      ],
      outputFormat: 'JSON object with DPIA assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['dpiaRequired', 'highRiskActivities', 'overallRiskLevel', 'artifacts'],
      properties: {
        dpiaRequired: { type: 'boolean' },
        highRiskActivities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              activityId: { type: 'string' },
              activityName: { type: 'string' },
              riskFactors: { type: 'array', items: { type: 'string' } },
              risks: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    risk: { type: 'string' },
                    likelihood: { type: 'string', enum: ['remote', 'possible', 'probable'] },
                    severity: { type: 'string', enum: ['limited', 'significant', 'severe'] },
                    riskLevel: { type: 'string', enum: ['low', 'medium', 'high'] }
                  }
                }
              },
              dpiaCompleted: { type: 'boolean' }
            }
          }
        },
        overallRiskLevel: { type: 'string', enum: ['low', 'medium', 'high'] },
        mitigations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              activityId: { type: 'string' },
              risk: { type: 'string' },
              mitigation: { type: 'string' },
              residualRisk: { type: 'string', enum: ['low', 'medium', 'high'] }
            }
          }
        },
        residualRisk: { type: 'string', enum: ['low', 'medium', 'high'] },
        priorConsultationRequired: { type: 'boolean' },
        dataSubjectViewsSought: { type: 'boolean' },
        dpiaDocumentation: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'gdpr-compliance', 'dpia']
}));

// Additional task definitions would follow the same pattern for:
// - Phase 7: Security Measures Assessment (Article 32)
// - Phase 8: Data Breach Notification Procedures (Articles 33-34)
// - Phase 9: DPO Assessment (Articles 37-39)
// - Phase 10: International Data Transfers (Chapter V)
// - Phase 11: Processing Records Assessment (Article 30)
// - Phase 12: Privacy by Design and Default (Article 25)
// - Phase 13: Third-Party Processor Compliance (Article 28)
// - Phase 14: Gap Analysis and Compliance Scoring
// - Phase 15: Remediation Roadmap Generation
// - Phase 16: Documentation Generation

// Placeholder task definitions for remaining phases (shortened for brevity)
export const securityMeasuresTask = defineTask('security-measures', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Security Measures Assessment - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security and Privacy Compliance Analyst',
      task: 'Assess technical and organizational security measures (Article 32)',
      context: args,
      instructions: [
        '1. Assess security measures appropriate to risk level',
        '2. Evaluate pseudonymization and encryption',
        '3. Assess confidentiality, integrity, availability, resilience',
        '4. Review security testing and evaluation processes',
        '5. Assess incident response capabilities',
        '6. Document security gaps and recommendations'
      ],
      outputFormat: 'JSON object with security measures assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['complianceScore', 'implementedControls', 'gaps', 'artifacts'],
      properties: {
        complianceScore: { type: 'number', minimum: 0, maximum: 100 },
        implementedControls: { type: 'array' },
        gaps: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'gdpr-compliance', 'security']
}));

export const breachNotificationTask = defineTask('breach-notification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Breach Notification Procedures - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Breach Response Specialist',
      task: 'Assess data breach notification procedures (Articles 33-34)',
      context: args,
      instructions: [
        '1. Review breach detection capabilities',
        '2. Assess 72-hour notification capability to supervisory authority',
        '3. Review breach documentation procedures',
        '4. Assess data subject notification procedures',
        '5. Verify breach response plan exists',
        '6. Document gaps and recommendations'
      ],
      outputFormat: 'JSON object with breach notification assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['proceduresEstablished', 'rapidResponseCapable', 'complianceScore', 'artifacts'],
      properties: {
        proceduresEstablished: { type: 'boolean' },
        rapidResponseCapable: { type: 'boolean' },
        complianceScore: { type: 'number', minimum: 0, maximum: 100 },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'gdpr-compliance', 'breach']
}));

export const dpoAssessmentTask = defineTask('dpo-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: DPO Assessment - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Protection Officer Compliance Specialist',
      task: 'Assess DPO requirements and appointment (Articles 37-39)',
      context: args,
      instructions: [
        '1. Determine if DPO appointment mandatory (Article 37)',
        '2. Verify DPO has been appointed if required',
        '3. Assess DPO qualifications and independence',
        '4. Verify DPO has sufficient resources and access',
        '5. Check DPO contact details published',
        '6. Document findings and recommendations'
      ],
      outputFormat: 'JSON object with DPO assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['dpoRequired', 'dpoAppointed', 'compliant', 'artifacts'],
      properties: {
        dpoRequired: { type: 'boolean' },
        dpoAppointed: { type: 'boolean' },
        compliant: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'gdpr-compliance', 'dpo']
}));

export const dataTransfersTask = defineTask('data-transfers', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: International Data Transfers - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'International Data Transfer Compliance Specialist',
      task: 'Assess international data transfers (Chapter V)',
      context: args,
      instructions: [
        '1. Identify all international data transfers',
        '2. Assess transfer mechanisms: adequacy decisions, SCCs, BCRs, derogations',
        '3. Review transfer impact assessments post-Schrems II',
        '4. Assess supplementary measures for transfers',
        '5. Verify documentation of transfer mechanisms',
        '6. Document non-compliant transfers and recommendations'
      ],
      outputFormat: 'JSON object with data transfers assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['internationalTransfers', 'transfersCompliant', 'nonCompliantTransfers', 'artifacts'],
      properties: {
        internationalTransfers: { type: 'array' },
        transfersCompliant: { type: 'boolean' },
        nonCompliantTransfers: { type: 'number' },
        nonCompliantDestinations: { type: 'array', items: { type: 'string' } },
        inadequateMechanisms: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'gdpr-compliance', 'data-transfers']
}));

export const processingRecordsTask = defineTask('processing-records', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Processing Records Assessment - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Records Management Compliance Analyst',
      task: 'Assess records of processing activities (Article 30)',
      context: args,
    instructions: [
        '1. Verify records of processing activities (ROPA) maintained',
        '2. Assess completeness of ROPA documentation',
        '3. Check ROPA includes all required information',
        '4. Verify ROPA is up to date',
        '5. Assess format and accessibility of ROPA',
        '6. Document gaps and recommendations'
      ],
      outputFormat: 'JSON object with processing records assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['recordsMaintained', 'completenessScore', 'artifacts'],
      properties: {
        recordsMaintained: { type: 'boolean' },
        completenessScore: { type: 'number', minimum: 0, maximum: 100 },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'gdpr-compliance', 'records']
}));

export const privacyByDesignTask = defineTask('privacy-by-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Privacy by Design and Default - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Privacy Engineering Specialist',
      task: 'Assess privacy by design and default implementation (Article 25)',
      context: args,
      instructions: [
        '1. Assess privacy by design implementation',
        '2. Evaluate privacy by default settings',
        '3. Review data minimization practices',
        '4. Assess privacy-enhancing technologies',
        '5. Review development lifecycle privacy integration',
        '6. Document findings and recommendations'
      ],
      outputFormat: 'JSON object with privacy by design assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['implementationLevel', 'score', 'artifacts'],
      properties: {
        implementationLevel: { type: 'string', enum: ['none', 'basic', 'intermediate', 'advanced'] },
        score: { type: 'number', minimum: 0, maximum: 100 },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'gdpr-compliance', 'privacy-by-design']
}));

export const processorComplianceTask = defineTask('processor-compliance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 13: Third-Party Processor Compliance - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Third-Party Risk and Compliance Analyst',
      task: 'Assess third-party processor compliance (Article 28)',
      context: args,
      instructions: [
        '1. Review all processor relationships',
        '2. Verify Data Processing Agreements (DPAs) in place',
        '3. Assess DPA content for GDPR requirements',
        '4. Review processor security and compliance certifications',
        '5. Assess sub-processor authorization processes',
        '6. Document non-compliant processor relationships'
      ],
      outputFormat: 'JSON object with processor compliance assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['totalProcessors', 'compliantAgreements', 'nonCompliantProcessors', 'artifacts'],
      properties: {
        totalProcessors: { type: 'number' },
        compliantAgreements: { type: 'number' },
        nonCompliantProcessors: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'gdpr-compliance', 'processors']
}));

export const gapAnalysisTask = defineTask('gap-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 14: Gap Analysis and Compliance Scoring - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'GDPR Compliance Auditor',
      task: 'Conduct comprehensive gap analysis and calculate compliance score',
      context: args,
      instructions: [
        '1. Consolidate findings from all assessment phases',
        '2. Categorize gaps by severity: critical, high, medium, low',
        '3. Calculate weighted compliance score',
        '4. Assess regulatory risk and potential fines',
        '5. Determine overall compliance verdict',
        '6. Prioritize gaps for remediation',
        '7. Generate comprehensive gap analysis report'
      ],
      outputFormat: 'JSON object with gap analysis and compliance scoring'
    },
    outputSchema: {
      type: 'object',
      required: ['overallComplianceScore', 'verdict', 'totalGaps', 'criticalGaps', 'gapAnalysisPath', 'artifacts'],
      properties: {
        overallComplianceScore: { type: 'number', minimum: 0, maximum: 100 },
        verdict: { type: 'string', enum: ['compliant', 'mostly-compliant', 'partially-compliant', 'non-compliant'] },
        totalGaps: { type: 'number' },
        criticalGaps: { type: 'array' },
        highPriorityGaps: { type: 'array' },
        mediumPriorityGaps: { type: 'array' },
        lowPriorityGaps: { type: 'array' },
        estimatedFineRisk: { type: 'string' },
        reputationRisk: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
        operationalRisk: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
        recommendation: { type: 'string' },
        gapAnalysisPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'gdpr-compliance', 'gap-analysis']
}));

export const remediationRoadmapTask = defineTask('remediation-roadmap', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 15: Remediation Roadmap Generation - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Compliance Program Manager',
      task: 'Generate prioritized GDPR compliance remediation roadmap',
      context: args,
      instructions: [
        '1. Prioritize gaps by regulatory risk and business impact',
        '2. Create phased remediation plan',
        '3. Identify quick wins for immediate implementation',
        '4. Estimate effort and resources for each action',
        '5. Create implementation timeline',
        '6. Assign ownership and accountability',
        '7. Define success criteria and milestones',
        '8. Generate detailed remediation roadmap document'
      ],
      outputFormat: 'JSON object with remediation roadmap'
    },
    outputSchema: {
      type: 'object',
      required: ['phases', 'totalActions', 'estimatedTimeline', 'roadmapPath', 'artifacts'],
      properties: {
        phases: { type: 'array' },
        totalActions: { type: 'number' },
        estimatedTimeline: { type: 'string' },
        estimatedBudget: { type: 'string' },
        quickWins: { type: 'array' },
        recommendations: { type: 'array' },
        roadmapPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'gdpr-compliance', 'remediation']
}));

export const documentationGenerationTask = defineTask('documentation-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 16: Compliance Documentation Generation - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Compliance Documentation Specialist',
      task: 'Generate comprehensive GDPR compliance documentation package',
      context: args,
      instructions: [
        '1. Generate executive summary report',
        '2. Create detailed assessment report with all findings',
        '3. Generate policy templates: privacy policy, cookie policy, retention policy',
        '4. Create procedure documents: SAR, breach notification, consent management',
        '5. Generate ROPA template',
        '6. Create DPO appointment documentation if needed',
        '7. Generate data processing agreements template',
        '8. Create training materials',
        '9. Format all documentation professionally',
        '10. Package documentation for stakeholder distribution'
      ],
      outputFormat: 'JSON object with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'policyTemplates', 'procedureDocuments', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummaryPath: { type: 'string' },
        policyTemplates: { type: 'array', items: { type: 'string' } },
        procedureDocuments: { type: 'array', items: { type: 'string' } },
        trainingMaterials: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'gdpr-compliance', 'documentation']
}));
