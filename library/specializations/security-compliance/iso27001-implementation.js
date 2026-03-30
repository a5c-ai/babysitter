/**
 * @process specializations/security-compliance/iso27001-implementation
 * @description ISO 27001 Implementation Process - Comprehensive Information Security Management System (ISMS)
 * implementation following ISO/IEC 27001:2022 standards. Covers ISMS setup, context establishment, leadership
 * commitment, risk assessment, Statement of Applicability (SOA), Annex A controls implementation, policy
 * documentation, internal audit, management review, and certification audit preparation.
 * @specialization Security & Compliance
 * @category Information Security Governance
 * @inputs { organization: string, scope: string, industry?: string, certificationTimeline?: string, existingControls?: object }
 * @outputs { success: boolean, ismsDocumentation: object, riskAssessment: object, annexAControls: object[], certificationReadiness: object }
 *
 * @example
 * const result = await orchestrate('specializations/security-compliance/iso27001-implementation', {
 *   organization: 'Acme Corp',
 *   scope: 'IT services and cloud infrastructure for financial services clients',
 *   industry: 'financial-services',
 *   certificationTimeline: '12-months',
 *   existingControls: {
 *     accessControl: 'partial',
 *     encryption: 'implemented',
 *     backups: 'implemented'
 *   },
 *   implementationDepth: 'comprehensive', // 'basic', 'standard', 'comprehensive'
 *   targetCertificationBody: 'BSI' // 'BSI', 'ISOQAR', 'NQA', etc.
 * });
 *
 * @references
 * - ISO/IEC 27001:2022: https://www.iso.org/standard/27001
 * - ISO/IEC 27002:2022 Controls: https://www.iso.org/standard/75652.html
 * - NIST ISO 27001 Implementation: https://csrc.nist.gov/projects/risk-management/sp800-53-controls
 * - BSI ISO 27001 Guidance: https://www.bsigroup.com/en-GB/iso-27001-information-security/
 * - ISMS.online ISO 27001 Toolkit: https://www.isms.online/iso-27001/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organization,
    scope,
    industry = 'general',
    certificationTimeline = '12-months',
    existingControls = {},
    implementationDepth = 'standard', // 'basic', 'standard', 'comprehensive'
    targetCertificationBody = 'ISO-Accredited',
    outputDir = 'iso27001-implementation-output',
    includeAuditPreparation = true,
    generatePoliciesTemplates = true,
    includeGapAnalysis = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const phases = [];
  let certificationReadiness = 0;

  ctx.log('info', `Starting ISO 27001 Implementation for ${organization}`);
  ctx.log('info', `Scope: ${scope}, Timeline: ${certificationTimeline}, Depth: ${implementationDepth}`);

  // ============================================================================
  // PHASE 1: ISMS SCOPING AND CONTEXT ESTABLISHMENT (Clause 4)
  // ============================================================================

  ctx.log('info', 'Phase 1: Establishing ISMS scope and organizational context (ISO 27001 Clause 4)');

  const contextEstablishment = await ctx.task(establishOrganizationalContextTask, {
    organization,
    scope,
    industry,
    implementationDepth,
    outputDir
  });

  artifacts.push(...contextEstablishment.artifacts);
  phases.push({ phase: 'context-establishment', clause: '4', result: contextEstablishment });

  ctx.log('info', `Context established - ${contextEstablishment.stakeholders.length} stakeholders, ${contextEstablishment.internalIssues.length} internal issues, ${contextEstablishment.externalIssues.length} external issues`);

  // Quality Gate: Context review
  await ctx.breakpoint({
    question: `ISMS context established for ${organization}. Scope: "${contextEstablishment.ismsScope}". Identified ${contextEstablishment.stakeholders.length} stakeholders. Review context?`,
    title: 'ISMS Context Establishment Review',
    context: {
      runId: ctx.runId,
      organization,
      ismsScope: contextEstablishment.ismsScope,
      stakeholders: contextEstablishment.stakeholders.length,
      internalIssues: contextEstablishment.internalIssues.length,
      externalIssues: contextEstablishment.externalIssues.length,
      files: contextEstablishment.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 2: LEADERSHIP COMMITMENT AND POLICY (Clause 5)
  // ============================================================================

  ctx.log('info', 'Phase 2: Establishing leadership commitment and information security policy (ISO 27001 Clause 5)');

  const leadershipPolicy = await ctx.task(establishLeadershipPolicyTask, {
    organization,
    scope,
    contextEstablishment,
    generatePoliciesTemplates,
    outputDir
  });

  artifacts.push(...leadershipPolicy.artifacts);
  phases.push({ phase: 'leadership-policy', clause: '5', result: leadershipPolicy });

  ctx.log('info', `Leadership policy established - Information Security Policy created, roles defined`);

  // ============================================================================
  // PHASE 3: GAP ANALYSIS (Optional)
  // ============================================================================

  let gapAnalysis = null;
  if (includeGapAnalysis) {
    ctx.log('info', 'Phase 3: Conducting ISO 27001 gap analysis');

    gapAnalysis = await ctx.task(conductGapAnalysisTask, {
      organization,
      scope,
      existingControls,
      contextEstablishment,
      outputDir
    });

    artifacts.push(...gapAnalysis.artifacts);
    phases.push({ phase: 'gap-analysis', result: gapAnalysis });

    ctx.log('info', `Gap analysis complete - ${gapAnalysis.totalGaps} gaps identified, ${gapAnalysis.criticalGaps} critical`);

    // Quality Gate: Gap analysis review
    await ctx.breakpoint({
      question: `Gap analysis complete. ${gapAnalysis.totalGaps} gaps identified (${gapAnalysis.criticalGaps} critical). Compliance: ${gapAnalysis.currentComplianceLevel}%. Review gaps?`,
      title: 'Gap Analysis Review',
      context: {
        runId: ctx.runId,
        totalGaps: gapAnalysis.totalGaps,
        criticalGaps: gapAnalysis.criticalGaps,
        highGaps: gapAnalysis.highGaps,
        currentCompliance: gapAnalysis.currentComplianceLevel,
        files: gapAnalysis.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 4: RISK ASSESSMENT AND TREATMENT (Clause 6)
  // ============================================================================

  ctx.log('info', 'Phase 4: Conducting information security risk assessment (ISO 27001 Clause 6.1)');

  const riskAssessment = await ctx.task(conductRiskAssessmentTask, {
    organization,
    scope,
    contextEstablishment,
    gapAnalysis,
    industry,
    implementationDepth,
    outputDir
  });

  artifacts.push(...riskAssessment.artifacts);
  phases.push({ phase: 'risk-assessment', clause: '6.1', result: riskAssessment });

  ctx.log('info', `Risk assessment complete - ${riskAssessment.totalRisks} risks identified, ${riskAssessment.criticalRisks} critical, ${riskAssessment.highRisks} high`);

  // Quality Gate: Risk assessment review
  await ctx.breakpoint({
    question: `Risk assessment complete. ${riskAssessment.totalRisks} risks identified. Critical: ${riskAssessment.criticalRisks}, High: ${riskAssessment.highRisks}. Overall risk score: ${riskAssessment.overallRiskScore}/100. Review risks?`,
    title: 'Risk Assessment Review',
    context: {
      runId: ctx.runId,
      totalRisks: riskAssessment.totalRisks,
      criticalRisks: riskAssessment.criticalRisks,
      highRisks: riskAssessment.highRisks,
      overallRiskScore: riskAssessment.overallRiskScore,
      files: riskAssessment.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 5: RISK TREATMENT PLAN (Clause 6.1.3)
  // ============================================================================

  ctx.log('info', 'Phase 5: Developing risk treatment plan (ISO 27001 Clause 6.1.3)');

  const riskTreatmentPlan = await ctx.task(developRiskTreatmentPlanTask, {
    organization,
    riskAssessment,
    existingControls,
    outputDir
  });

  artifacts.push(...riskTreatmentPlan.artifacts);
  phases.push({ phase: 'risk-treatment-plan', clause: '6.1.3', result: riskTreatmentPlan });

  ctx.log('info', `Risk treatment plan developed - ${riskTreatmentPlan.treatments.length} treatments, ${riskTreatmentPlan.controlsToImplement} controls to implement`);

  // ============================================================================
  // PHASE 6: STATEMENT OF APPLICABILITY (SOA) - ANNEX A CONTROLS (Clause 6.1.3d)
  // ============================================================================

  ctx.log('info', 'Phase 6: Creating Statement of Applicability (SOA) - Annex A controls selection (ISO 27001 Clause 6.1.3d)');

  const statementOfApplicability = await ctx.task(createStatementOfApplicabilityTask, {
    organization,
    scope,
    riskAssessment,
    riskTreatmentPlan,
    existingControls,
    industry,
    implementationDepth,
    outputDir
  });

  artifacts.push(...statementOfApplicability.artifacts);
  phases.push({ phase: 'statement-of-applicability', clause: '6.1.3d', result: statementOfApplicability });

  ctx.log('info', `SOA created - ${statementOfApplicability.applicableControls} applicable controls, ${statementOfApplicability.notApplicableControls} not applicable`);

  // Quality Gate: SOA review
  await ctx.breakpoint({
    question: `Statement of Applicability (SOA) created. ${statementOfApplicability.applicableControls} applicable controls, ${statementOfApplicability.notApplicableControls} not applicable. Control coverage: ${statementOfApplicability.controlCoverage}%. Review SOA?`,
    title: 'Statement of Applicability Review',
    context: {
      runId: ctx.runId,
      applicableControls: statementOfApplicability.applicableControls,
      notApplicableControls: statementOfApplicability.notApplicableControls,
      implementedControls: statementOfApplicability.implementedControls,
      plannedControls: statementOfApplicability.plannedControls,
      controlCoverage: statementOfApplicability.controlCoverage,
      files: statementOfApplicability.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 7: ISMS DOCUMENTATION (Clause 7.5)
  // ============================================================================

  ctx.log('info', 'Phase 7: Creating ISMS documentation and procedures (ISO 27001 Clause 7.5)');

  const ismsDocumentation = await ctx.task(createISMSDocumentationTask, {
    organization,
    scope,
    contextEstablishment,
    leadershipPolicy,
    riskAssessment,
    riskTreatmentPlan,
    statementOfApplicability,
    generatePoliciesTemplates,
    implementationDepth,
    outputDir
  });

  artifacts.push(...ismsDocumentation.artifacts);
  phases.push({ phase: 'isms-documentation', clause: '7.5', result: ismsDocumentation });

  ctx.log('info', `ISMS documentation created - ${ismsDocumentation.policies.length} policies, ${ismsDocumentation.procedures.length} procedures, ${ismsDocumentation.workInstructions.length} work instructions`);

  // ============================================================================
  // PHASE 8: ANNEX A CONTROLS IMPLEMENTATION PLAN (Organizational, People, Physical, Technological)
  // ============================================================================

  ctx.log('info', 'Phase 8: Creating Annex A controls implementation plan');

  const controlsImplementationPlan = await ctx.task(createControlsImplementationPlanTask, {
    organization,
    statementOfApplicability,
    riskTreatmentPlan,
    certificationTimeline,
    outputDir
  });

  artifacts.push(...controlsImplementationPlan.artifacts);
  phases.push({ phase: 'controls-implementation-plan', result: controlsImplementationPlan });

  ctx.log('info', `Controls implementation plan created - ${controlsImplementationPlan.phases.length} implementation phases over ${certificationTimeline}`);

  // Quality Gate: Implementation plan review
  await ctx.breakpoint({
    question: `Controls implementation plan created. ${controlsImplementationPlan.totalActions} actions across ${controlsImplementationPlan.phases.length} phases. Timeline: ${certificationTimeline}. Review plan?`,
    title: 'Controls Implementation Plan Review',
    context: {
      runId: ctx.runId,
      totalActions: controlsImplementationPlan.totalActions,
      phases: controlsImplementationPlan.phases.length,
      estimatedEffort: controlsImplementationPlan.estimatedEffort,
      timeline: certificationTimeline,
      files: controlsImplementationPlan.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 9: COMPETENCE AND AWARENESS (Clause 7.2 & 7.3)
  // ============================================================================

  ctx.log('info', 'Phase 9: Developing competence and awareness program (ISO 27001 Clause 7.2 & 7.3)');

  const competenceAwareness = await ctx.task(developCompetenceAwarenessProgramTask, {
    organization,
    scope,
    statementOfApplicability,
    outputDir
  });

  artifacts.push(...competenceAwareness.artifacts);
  phases.push({ phase: 'competence-awareness', clause: '7.2-7.3', result: competenceAwareness });

  ctx.log('info', `Competence and awareness program developed - ${competenceAwareness.trainingModules.length} training modules`);

  // ============================================================================
  // PHASE 10: ISMS OPERATIONAL PLANNING (Clause 8)
  // ============================================================================

  ctx.log('info', 'Phase 10: Establishing ISMS operational planning and control (ISO 27001 Clause 8)');

  const operationalPlanning = await ctx.task(establishOperationalPlanningTask, {
    organization,
    scope,
    riskTreatmentPlan,
    statementOfApplicability,
    outputDir
  });

  artifacts.push(...operationalPlanning.artifacts);
  phases.push({ phase: 'operational-planning', clause: '8', result: operationalPlanning });

  ctx.log('info', `Operational planning established - ${operationalPlanning.operationalProcedures.length} operational procedures`);

  // ============================================================================
  // PHASE 11: MONITORING, MEASUREMENT, ANALYSIS (Clause 9.1)
  // ============================================================================

  ctx.log('info', 'Phase 11: Establishing monitoring, measurement, and analysis (ISO 27001 Clause 9.1)');

  const monitoringMeasurement = await ctx.task(establishMonitoringMeasurementTask, {
    organization,
    statementOfApplicability,
    riskAssessment,
    outputDir
  });

  artifacts.push(...monitoringMeasurement.artifacts);
  phases.push({ phase: 'monitoring-measurement', clause: '9.1', result: monitoringMeasurement });

  ctx.log('info', `Monitoring and measurement established - ${monitoringMeasurement.kpis.length} KPIs, ${monitoringMeasurement.metrics.length} metrics`);

  // ============================================================================
  // PHASE 12: INTERNAL AUDIT PROGRAM (Clause 9.2)
  // ============================================================================

  ctx.log('info', 'Phase 12: Establishing internal audit program (ISO 27001 Clause 9.2)');

  const internalAuditProgram = await ctx.task(establishInternalAuditProgramTask, {
    organization,
    scope,
    statementOfApplicability,
    includeAuditPreparation,
    outputDir
  });

  artifacts.push(...internalAuditProgram.artifacts);
  phases.push({ phase: 'internal-audit-program', clause: '9.2', result: internalAuditProgram });

  ctx.log('info', `Internal audit program established - ${internalAuditProgram.auditSchedule.length} audits scheduled`);

  // ============================================================================
  // PHASE 13: MANAGEMENT REVIEW (Clause 9.3)
  // ============================================================================

  ctx.log('info', 'Phase 13: Establishing management review process (ISO 27001 Clause 9.3)');

  const managementReview = await ctx.task(establishManagementReviewTask, {
    organization,
    scope,
    riskAssessment,
    statementOfApplicability,
    outputDir
  });

  artifacts.push(...managementReview.artifacts);
  phases.push({ phase: 'management-review', clause: '9.3', result: managementReview });

  ctx.log('info', `Management review process established - ${managementReview.reviewFrequency} reviews scheduled`);

  // ============================================================================
  // PHASE 14: CONTINUAL IMPROVEMENT (Clause 10)
  // ============================================================================

  ctx.log('info', 'Phase 14: Establishing continual improvement process (ISO 27001 Clause 10)');

  const continualImprovement = await ctx.task(establishContinualImprovementTask, {
    organization,
    scope,
    riskAssessment,
    outputDir
  });

  artifacts.push(...continualImprovement.artifacts);
  phases.push({ phase: 'continual-improvement', clause: '10', result: continualImprovement });

  ctx.log('info', `Continual improvement process established - Nonconformity and corrective action procedures defined`);

  // ============================================================================
  // PHASE 15: CERTIFICATION AUDIT PREPARATION
  // ============================================================================

  let certificationPreparation = null;
  if (includeAuditPreparation) {
    ctx.log('info', 'Phase 15: Preparing for certification audit');

    certificationPreparation = await ctx.task(prepareCertificationAuditTask, {
      organization,
      scope,
      contextEstablishment,
      leadershipPolicy,
      riskAssessment,
      statementOfApplicability,
      ismsDocumentation,
      internalAuditProgram,
      managementReview,
      targetCertificationBody,
      certificationTimeline,
      outputDir
    });

    artifacts.push(...certificationPreparation.artifacts);
    phases.push({ phase: 'certification-preparation', result: certificationPreparation });
    certificationReadiness = certificationPreparation.readinessScore;

    ctx.log('info', `Certification preparation complete - Readiness score: ${certificationReadiness}/100`);

    // Quality Gate: Certification readiness
    await ctx.breakpoint({
      question: `Certification audit preparation complete. Readiness score: ${certificationReadiness}/100. Status: ${certificationPreparation.readinessLevel}. ${certificationPreparation.remainingActions} remaining actions. Proceed with certification?`,
      title: 'Certification Readiness Review',
      context: {
        runId: ctx.runId,
        readinessScore: certificationReadiness,
        readinessLevel: certificationPreparation.readinessLevel,
        remainingActions: certificationPreparation.remainingActions,
        criticalGaps: certificationPreparation.criticalGaps,
        recommendation: certificationPreparation.recommendation,
        files: certificationPreparation.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 16: ISMS IMPLEMENTATION ROADMAP AND FINAL REPORT
  // ============================================================================

  ctx.log('info', 'Phase 16: Creating ISMS implementation roadmap and final report');

  const implementationRoadmap = await ctx.task(createImplementationRoadmapTask, {
    organization,
    scope,
    contextEstablishment,
    gapAnalysis,
    riskAssessment,
    statementOfApplicability,
    controlsImplementationPlan,
    certificationPreparation,
    certificationTimeline,
    phases,
    outputDir
  });

  artifacts.push(...implementationRoadmap.artifacts);
  phases.push({ phase: 'implementation-roadmap', result: implementationRoadmap });

  ctx.log('info', `ISMS implementation roadmap created - ${implementationRoadmap.milestones.length} milestones, ${implementationRoadmap.totalActions} actions`);

  // Final Breakpoint: ISO 27001 Implementation complete
  await ctx.breakpoint({
    question: `ISO 27001 Implementation planning complete for ${organization}. Certification readiness: ${certificationReadiness}/100. ${statementOfApplicability.applicableControls} controls to implement. Timeline: ${certificationTimeline}. Approve implementation plan?`,
    title: 'Final ISO 27001 Implementation Review',
    context: {
      runId: ctx.runId,
      summary: {
        organization,
        scope,
        certificationReadiness,
        applicableControls: statementOfApplicability.applicableControls,
        totalRisks: riskAssessment.totalRisks,
        criticalRisks: riskAssessment.criticalRisks,
        implementationActions: implementationRoadmap.totalActions,
        milestones: implementationRoadmap.milestones.length,
        estimatedTimeline: certificationTimeline
      },
      recommendation: implementationRoadmap.recommendation,
      files: [
        { path: implementationRoadmap.roadmapPath, format: 'markdown', label: 'ISMS Implementation Roadmap' },
        { path: statementOfApplicability.soaPath, format: 'json', label: 'Statement of Applicability' },
        { path: riskAssessment.riskRegisterPath, format: 'json', label: 'Risk Register' },
        { path: ismsDocumentation.ismsManualPath, format: 'markdown', label: 'ISMS Manual' },
        ...(certificationPreparation ? [{ path: certificationPreparation.auditPreparationPath, format: 'markdown', label: 'Certification Audit Preparation' }] : [])
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    organization,
    scope,
    industry,
    certificationReadiness,
    ismsDocumentation: {
      ismsManualPath: ismsDocumentation.ismsManualPath,
      policies: ismsDocumentation.policies,
      procedures: ismsDocumentation.procedures,
      workInstructions: ismsDocumentation.workInstructions
    },
    riskAssessment: {
      totalRisks: riskAssessment.totalRisks,
      criticalRisks: riskAssessment.criticalRisks,
      highRisks: riskAssessment.highRisks,
      overallRiskScore: riskAssessment.overallRiskScore,
      riskRegisterPath: riskAssessment.riskRegisterPath
    },
    annexAControls: {
      applicableControls: statementOfApplicability.applicableControls,
      notApplicableControls: statementOfApplicability.notApplicableControls,
      implementedControls: statementOfApplicability.implementedControls,
      plannedControls: statementOfApplicability.plannedControls,
      controlCoverage: statementOfApplicability.controlCoverage,
      soaPath: statementOfApplicability.soaPath
    },
    implementationPlan: {
      totalActions: controlsImplementationPlan.totalActions,
      phases: controlsImplementationPlan.phases,
      estimatedEffort: controlsImplementationPlan.estimatedEffort,
      timeline: certificationTimeline
    },
    certificationPreparation: certificationPreparation ? {
      readinessScore: certificationReadiness,
      readinessLevel: certificationPreparation.readinessLevel,
      remainingActions: certificationPreparation.remainingActions,
      criticalGaps: certificationPreparation.criticalGaps,
      auditPreparationPath: certificationPreparation.auditPreparationPath
    } : null,
    gapAnalysis: gapAnalysis ? {
      totalGaps: gapAnalysis.totalGaps,
      criticalGaps: gapAnalysis.criticalGaps,
      currentComplianceLevel: gapAnalysis.currentComplianceLevel
    } : null,
    roadmap: {
      milestones: implementationRoadmap.milestones,
      totalActions: implementationRoadmap.totalActions,
      roadmapPath: implementationRoadmap.roadmapPath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/security-compliance/iso27001-implementation',
      processSlug: 'iso27001-implementation',
      category: 'security-compliance',
      specializationSlug: 'security-compliance',
      timestamp: startTime,
      implementationDepth,
      targetCertificationBody,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: Establish Organizational Context (Clause 4)
export const establishOrganizationalContextTask = defineTask('establish-organizational-context', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Establish Organizational Context - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ISO 27001 Lead Implementer',
      task: 'Establish organizational context for ISMS (ISO 27001 Clause 4)',
      context: {
        organization: args.organization,
        scope: args.scope,
        industry: args.industry,
        implementationDepth: args.implementationDepth,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Understand the organization and its context (Clause 4.1):',
        '   - Internal issues: organizational structure, culture, processes, IT infrastructure',
        '   - External issues: legal, regulatory, market, competitive environment',
        '   - Identify stakeholders: customers, employees, regulators, partners, suppliers',
        '2. Understand needs and expectations of interested parties (Clause 4.2):',
        '   - Customer expectations (data protection, availability)',
        '   - Regulatory requirements (GDPR, HIPAA, PCI-DSS, industry-specific)',
        '   - Employee expectations (security, privacy)',
        '   - Partner/supplier requirements',
        '   - Business objectives alignment',
        '3. Determine ISMS scope (Clause 4.3):',
        '   - Define boundaries: locations, systems, processes, services',
        '   - Identify exclusions with justification',
        '   - Consider dependencies and interfaces',
        '   - Document scope statement',
        '4. Identify information assets:',
        '   - Data assets (databases, documents, intellectual property)',
        '   - Software assets (applications, systems)',
        '   - Physical assets (servers, devices, facilities)',
        '   - People assets (key personnel, specialized knowledge)',
        '   - Services (cloud services, managed services)',
        '5. Understand information flows',
        '6. Identify business-critical processes',
        '7. Create ISMS context document',
        '8. Generate stakeholder analysis matrix'
      ],
      outputFormat: 'JSON object with organizational context'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'ismsScope', 'stakeholders', 'internalIssues', 'externalIssues', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        ismsScope: { type: 'string', description: 'Defined ISMS scope statement' },
        scopeBoundaries: {
          type: 'object',
          properties: {
            locations: { type: 'array', items: { type: 'string' } },
            systems: { type: 'array', items: { type: 'string' } },
            processes: { type: 'array', items: { type: 'string' } },
            services: { type: 'array', items: { type: 'string' } },
            exclusions: { type: 'array', items: { type: 'object' } }
          }
        },
        stakeholders: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stakeholder: { type: 'string' },
              type: { type: 'string', enum: ['customer', 'employee', 'regulator', 'partner', 'supplier', 'shareholder'] },
              expectations: { type: 'array', items: { type: 'string' } },
              requirements: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        internalIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              category: { type: 'string' },
              impact: { type: 'string', enum: ['Low', 'Medium', 'High'] }
            }
          }
        },
        externalIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              category: { type: 'string' },
              impact: { type: 'string', enum: ['Low', 'Medium', 'High'] }
            }
          }
        },
        informationAssets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              asset: { type: 'string' },
              type: { type: 'string', enum: ['data', 'software', 'physical', 'people', 'service'] },
              classification: { type: 'string', enum: ['Public', 'Internal', 'Confidential', 'Restricted'] },
              owner: { type: 'string' }
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
  labels: ['agent', 'iso27001', 'context', 'clause-4']
}));

// Phase 2: Establish Leadership and Policy (Clause 5)
export const establishLeadershipPolicyTask = defineTask('establish-leadership-policy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Establish Leadership Commitment and Policy - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ISO 27001 Policy Expert',
      task: 'Establish leadership commitment and information security policy (ISO 27001 Clause 5)',
      context: {
        organization: args.organization,
        scope: args.scope,
        contextEstablishment: args.contextEstablishment,
        generatePoliciesTemplates: args.generatePoliciesTemplates,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Establish leadership commitment (Clause 5.1):',
        '   - Define top management responsibilities',
        '   - Document leadership commitment statement',
        '   - Ensure information security policy alignment with business objectives',
        '   - Establish ISMS objectives',
        '   - Ensure resource allocation',
        '   - Promote continual improvement',
        '2. Create Information Security Policy (Clause 5.2):',
        '   - Policy purpose and scope',
        '   - Information security objectives',
        '   - Commitment to satisfy requirements',
        '   - Commitment to continual improvement',
        '   - Alignment with organizational context',
        '   - Approval and communication requirements',
        '3. Define organizational roles and responsibilities (Clause 5.3):',
        '   - ISMS Management Representative/Information Security Manager',
        '   - Information Security Committee',
        '   - Asset owners',
        '   - System administrators',
        '   - Internal auditors',
        '   - All employees (general responsibilities)',
        '4. Create RACI matrix for ISMS roles',
        '5. Define escalation procedures',
        '6. Document approval workflow',
        '7. Create policy communication plan',
        '8. Generate policy templates if requested'
      ],
      outputFormat: 'JSON object with leadership and policy documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'informationSecurityPolicy', 'roles', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        informationSecurityPolicy: {
          type: 'object',
          properties: {
            purpose: { type: 'string' },
            scope: { type: 'string' },
            objectives: { type: 'array', items: { type: 'string' } },
            commitments: { type: 'array', items: { type: 'string' } },
            policyStatement: { type: 'string' },
            approver: { type: 'string' },
            reviewFrequency: { type: 'string' }
          }
        },
        roles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              role: { type: 'string' },
              responsibilities: { type: 'array', items: { type: 'string' } },
              authority: { type: 'string' },
              reportingTo: { type: 'string' }
            }
          }
        },
        raciMatrix: { type: 'object', description: 'RACI matrix for ISMS activities' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'iso27001', 'leadership', 'policy', 'clause-5']
}));

// Phase 3: Conduct Gap Analysis
export const conductGapAnalysisTask = defineTask('conduct-gap-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Conduct ISO 27001 Gap Analysis - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ISO 27001 Auditor',
      task: 'Conduct comprehensive gap analysis against ISO 27001 requirements',
      context: {
        organization: args.organization,
        scope: args.scope,
        existingControls: args.existingControls,
        contextEstablishment: args.contextEstablishment,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Assess current state against ISO 27001:2022 requirements:',
        '   - Clause 4: Context of the organization',
        '   - Clause 5: Leadership',
        '   - Clause 6: Planning',
        '   - Clause 7: Support',
        '   - Clause 8: Operation',
        '   - Clause 9: Performance evaluation',
        '   - Clause 10: Improvement',
        '2. Assess existing controls against Annex A (93 controls):',
        '   - Organizational controls (37)',
        '   - People controls (8)',
        '   - Physical controls (14)',
        '   - Technological controls (34)',
        '3. For each requirement, assess status:',
        '   - Fully Implemented',
        '   - Partially Implemented',
        '   - Not Implemented',
        '   - Not Applicable',
        '4. Identify gaps:',
        '   - Critical gaps (immediate risk)',
        '   - High gaps (significant risk)',
        '   - Medium gaps (moderate risk)',
        '   - Low gaps (minor risk)',
        '5. Calculate current compliance level (%)',
        '6. Identify quick wins (high value, low effort)',
        '7. Estimate effort to close gaps',
        '8. Prioritize gaps by risk and compliance importance',
        '9. Create gap analysis report with findings',
        '10. Generate remediation roadmap'
      ],
      outputFormat: 'JSON object with gap analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'totalGaps', 'currentComplianceLevel', 'gaps', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        totalGaps: { type: 'number' },
        criticalGaps: { type: 'number' },
        highGaps: { type: 'number' },
        mediumGaps: { type: 'number' },
        lowGaps: { type: 'number' },
        currentComplianceLevel: { type: 'number', description: 'Current compliance percentage' },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            required: ['requirement', 'clause', 'status', 'severity'],
            properties: {
              requirement: { type: 'string' },
              clause: { type: 'string' },
              currentStatus: { type: 'string', enum: ['Fully Implemented', 'Partially Implemented', 'Not Implemented', 'Not Applicable'] },
              severity: { type: 'string', enum: ['Critical', 'High', 'Medium', 'Low'] },
              gapDescription: { type: 'string' },
              recommendation: { type: 'string' },
              estimatedEffort: { type: 'string' }
            }
          }
        },
        quickWins: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gap: { type: 'string' },
              benefit: { type: 'string' },
              effort: { type: 'string' }
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
  labels: ['agent', 'iso27001', 'gap-analysis']
}));

// Phase 4: Conduct Risk Assessment (Clause 6.1)
export const conductRiskAssessmentTask = defineTask('conduct-risk-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Conduct Risk Assessment - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Information Security Risk Assessor',
      task: 'Conduct comprehensive information security risk assessment (ISO 27001 Clause 6.1)',
      context: {
        organization: args.organization,
        scope: args.scope,
        contextEstablishment: args.contextEstablishment,
        gapAnalysis: args.gapAnalysis,
        industry: args.industry,
        implementationDepth: args.implementationDepth,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Establish risk assessment criteria (Clause 6.1.2a):',
        '   - Risk acceptance criteria',
        '   - Risk evaluation criteria (likelihood, impact)',
        '   - Criteria for performing risk assessments',
        '2. Identify information security risks (Clause 6.1.2b):',
        '   - Identify threats (malware, hacking, human error, natural disasters)',
        '   - Identify vulnerabilities (technical, organizational, physical)',
        '   - Identify assets at risk (from context establishment)',
        '   - Consider consequences of loss (confidentiality, integrity, availability)',
        '3. Analyze risks (Clause 6.1.2c):',
        '   - Assess likelihood: Low (1), Medium (2), High (3)',
        '   - Assess impact: Low (1), Medium (2), High (3), Critical (4)',
        '   - Calculate risk score: Likelihood x Impact',
        '   - Consider existing controls and residual risk',
        '4. Evaluate risks against criteria (Clause 6.1.2d):',
        '   - Critical: Risk score 9-12 (immediate action)',
        '   - High: Risk score 6-8 (urgent action)',
        '   - Medium: Risk score 3-5 (action required)',
        '   - Low: Risk score 1-2 (monitor)',
        '5. Identify risk owners for each risk',
        '6. Map risks to information assets',
        '7. Consider industry-specific risks (financial, healthcare, etc.)',
        '8. Calculate overall risk score (0-100)',
        '9. Create comprehensive risk register',
        '10. Generate risk assessment report with heat map'
      ],
      outputFormat: 'JSON object with risk assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'risks', 'totalRisks', 'overallRiskScore', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        totalRisks: { type: 'number' },
        criticalRisks: { type: 'number' },
        highRisks: { type: 'number' },
        mediumRisks: { type: 'number' },
        lowRisks: { type: 'number' },
        overallRiskScore: { type: 'number', minimum: 0, maximum: 100 },
        risks: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'title', 'asset', 'threat', 'vulnerability', 'likelihood', 'impact', 'riskLevel'],
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              asset: { type: 'string' },
              threat: { type: 'string' },
              vulnerability: { type: 'string' },
              likelihood: { type: 'string', enum: ['Low', 'Medium', 'High'] },
              impact: { type: 'string', enum: ['Low', 'Medium', 'High', 'Critical'] },
              riskScore: { type: 'number' },
              riskLevel: { type: 'string', enum: ['Low', 'Medium', 'High', 'Critical'] },
              consequences: {
                type: 'object',
                properties: {
                  confidentiality: { type: 'string' },
                  integrity: { type: 'string' },
                  availability: { type: 'string' }
                }
              },
              existingControls: { type: 'array', items: { type: 'string' } },
              residualRisk: { type: 'string' },
              riskOwner: { type: 'string' }
            }
          }
        },
        riskRegisterPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'iso27001', 'risk-assessment', 'clause-6']
}));

// Phase 5: Develop Risk Treatment Plan (Clause 6.1.3)
export const developRiskTreatmentPlanTask = defineTask('develop-risk-treatment-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Develop Risk Treatment Plan - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Risk Treatment Specialist',
      task: 'Develop risk treatment plan (ISO 27001 Clause 6.1.3)',
      context: {
        organization: args.organization,
        riskAssessment: args.riskAssessment,
        existingControls: args.existingControls,
        outputDir: args.outputDir
      },
      instructions: [
        '1. For each risk, select risk treatment option (Clause 6.1.3a-c):',
        '   - Modify: Apply security controls to reduce risk',
        '   - Retain: Accept the risk (with justification)',
        '   - Avoid: Remove the risk source or activity',
        '   - Share: Transfer risk (insurance, outsourcing)',
        '2. For risks to be modified, identify appropriate controls:',
        '   - Reference Annex A controls (ISO 27001:2022)',
        '   - Reference industry best practices',
        '   - Consider cost vs. benefit',
        '   - Map to risk mitigation',
        '3. Document risk treatment decisions:',
        '   - Treatment option selected',
        '   - Justification',
        '   - Controls to be implemented',
        '   - Responsible party',
        '   - Timeline',
        '   - Expected residual risk',
        '4. Identify controls to implement (new)',
        '5. Identify controls to improve (existing)',
        '6. Define risk acceptance criteria and process',
        '7. Obtain risk acceptance approval for retained risks',
        '8. Create risk treatment plan document',
        '9. Map treatments to Annex A controls',
        '10. Calculate expected risk reduction'
      ],
      outputFormat: 'JSON object with risk treatment plan'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'treatments', 'controlsToImplement', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        treatments: {
          type: 'array',
          items: {
            type: 'object',
            required: ['riskId', 'treatmentOption', 'controls'],
            properties: {
              riskId: { type: 'string' },
              riskTitle: { type: 'string' },
              treatmentOption: { type: 'string', enum: ['Modify', 'Retain', 'Avoid', 'Share'] },
              justification: { type: 'string' },
              controls: { type: 'array', items: { type: 'string' } },
              annexAMapping: { type: 'array', items: { type: 'string' } },
              responsibleParty: { type: 'string' },
              timeline: { type: 'string' },
              expectedResidualRisk: { type: 'string' },
              approvalRequired: { type: 'boolean' },
              approvedBy: { type: 'string' }
            }
          }
        },
        controlsToImplement: { type: 'number', description: 'Number of new controls to implement' },
        controlsToImprove: { type: 'number', description: 'Number of existing controls to improve' },
        risksAccepted: { type: 'number', description: 'Number of risks accepted/retained' },
        expectedRiskReduction: { type: 'number', description: 'Expected overall risk score reduction' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'iso27001', 'risk-treatment', 'clause-6']
}));

// Phase 6: Create Statement of Applicability (SOA) - Annex A (Clause 6.1.3d)
export const createStatementOfApplicabilityTask = defineTask('create-statement-of-applicability', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Create Statement of Applicability (SOA) - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ISO 27001 Controls Specialist',
      task: 'Create Statement of Applicability (SOA) with Annex A controls selection (ISO 27001 Clause 6.1.3d)',
      context: {
        organization: args.organization,
        scope: args.scope,
        riskAssessment: args.riskAssessment,
        riskTreatmentPlan: args.riskTreatmentPlan,
        existingControls: args.existingControls,
        industry: args.industry,
        implementationDepth: args.implementationDepth,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Review all 93 Annex A controls (ISO 27001:2022):',
        '',
        '   ORGANIZATIONAL CONTROLS (5.1-5.37):',
        '   5.1 Policies for information security',
        '   5.2 Information security roles and responsibilities',
        '   5.3 Segregation of duties',
        '   5.4 Management responsibilities',
        '   5.5 Contact with authorities',
        '   5.6 Contact with special interest groups',
        '   5.7 Threat intelligence',
        '   5.8 Information security in project management',
        '   5.9 Inventory of information and other associated assets',
        '   5.10 Acceptable use of information and other associated assets',
        '   5.11 Return of assets',
        '   5.12 Classification of information',
        '   5.13 Labelling of information',
        '   5.14 Information transfer',
        '   5.15 Access control',
        '   5.16 Identity management',
        '   5.17 Authentication information',
        '   5.18 Access rights',
        '   5.19 Information security in supplier relationships',
        '   5.20 Addressing information security within supplier agreements',
        '   5.21 Managing information security in the ICT supply chain',
        '   5.22 Monitoring, review and change management of supplier services',
        '   5.23 Information security for use of cloud services',
        '   5.24 Information security incident management planning and preparation',
        '   5.25 Assessment and decision on information security events',
        '   5.26 Response to information security incidents',
        '   5.27 Learning from information security incidents',
        '   5.28 Collection of evidence',
        '   5.29 Information security during disruption',
        '   5.30 ICT readiness for business continuity',
        '   5.31 Legal, statutory, regulatory and contractual requirements',
        '   5.32 Intellectual property rights',
        '   5.33 Protection of records',
        '   5.34 Privacy and protection of PII',
        '   5.35 Independent review of information security',
        '   5.36 Compliance with policies, rules and standards for information security',
        '   5.37 Documented operating procedures',
        '',
        '   PEOPLE CONTROLS (6.1-6.8):',
        '   6.1 Screening',
        '   6.2 Terms and conditions of employment',
        '   6.3 Information security awareness, education and training',
        '   6.4 Disciplinary process',
        '   6.5 Responsibilities after termination or change of employment',
        '   6.6 Confidentiality or non-disclosure agreements',
        '   6.7 Remote working',
        '   6.8 Information security event reporting',
        '',
        '   PHYSICAL CONTROLS (7.1-7.14):',
        '   7.1 Physical security perimeters',
        '   7.2 Physical entry',
        '   7.3 Securing offices, rooms and facilities',
        '   7.4 Physical security monitoring',
        '   7.5 Protecting against physical and environmental threats',
        '   7.6 Working in secure areas',
        '   7.7 Clear desk and clear screen',
        '   7.8 Equipment siting and protection',
        '   7.9 Security of assets off-premises',
        '   7.10 Storage media',
        '   7.11 Supporting utilities',
        '   7.12 Cabling security',
        '   7.13 Equipment maintenance',
        '   7.14 Secure disposal or re-use of equipment',
        '',
        '   TECHNOLOGICAL CONTROLS (8.1-8.34):',
        '   8.1 User endpoint devices',
        '   8.2 Privileged access rights',
        '   8.3 Information access restriction',
        '   8.4 Access to source code',
        '   8.5 Secure authentication',
        '   8.6 Capacity management',
        '   8.7 Protection against malware',
        '   8.8 Management of technical vulnerabilities',
        '   8.9 Configuration management',
        '   8.10 Information deletion',
        '   8.11 Data masking',
        '   8.12 Data leakage prevention',
        '   8.13 Information backup',
        '   8.14 Redundancy of information processing facilities',
        '   8.15 Logging',
        '   8.16 Monitoring activities',
        '   8.17 Clock synchronization',
        '   8.18 Use of privileged utility programs',
        '   8.19 Installation of software on operational systems',
        '   8.20 Networks security',
        '   8.21 Security of network services',
        '   8.22 Segregation of networks',
        '   8.23 Web filtering',
        '   8.24 Use of cryptography',
        '   8.25 Secure development life cycle',
        '   8.26 Application security requirements',
        '   8.27 Secure system architecture and engineering principles',
        '   8.28 Secure coding',
        '   8.29 Security testing in development and acceptance',
        '   8.30 Outsourced development',
        '   8.31 Separation of development, test and production environments',
        '   8.32 Change management',
        '   8.33 Test information',
        '   8.34 Protection of information systems during audit testing',
        '',
        '2. For each control, determine applicability:',
        '   - Applicable: Relevant to organization and needed for risk treatment',
        '   - Not Applicable: Not relevant with justification',
        '3. For applicable controls, document:',
        '   - Current implementation status: Implemented, Partially Implemented, Not Implemented, Planned',
        '   - Justification for inclusion',
        '   - Related risks addressed',
        '   - Implementation owner',
        '   - Implementation timeline',
        '   - Evidence of implementation',
        '4. For non-applicable controls, provide justification:',
        '   - Why control is not relevant',
        '   - Alternative controls (if any)',
        '5. Calculate control coverage metrics:',
        '   - % Applicable controls',
        '   - % Implemented',
        '   - % Partially implemented',
        '   - % Not implemented',
        '6. Map SOA to risk treatment plan',
        '7. Create comprehensive SOA document',
        '8. Generate control implementation matrix'
      ],
      outputFormat: 'JSON object with Statement of Applicability'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'controls', 'applicableControls', 'notApplicableControls', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        controls: {
          type: 'array',
          items: {
            type: 'object',
            required: ['controlId', 'controlName', 'applicability', 'status'],
            properties: {
              controlId: { type: 'string' },
              controlName: { type: 'string' },
              category: { type: 'string', enum: ['Organizational', 'People', 'Physical', 'Technological'] },
              applicability: { type: 'string', enum: ['Applicable', 'Not Applicable'] },
              status: { type: 'string', enum: ['Implemented', 'Partially Implemented', 'Not Implemented', 'Planned', 'N/A'] },
              justification: { type: 'string' },
              relatedRisks: { type: 'array', items: { type: 'string' } },
              implementationOwner: { type: 'string' },
              implementationTimeline: { type: 'string' },
              evidence: { type: 'string' }
            }
          }
        },
        applicableControls: { type: 'number' },
        notApplicableControls: { type: 'number' },
        implementedControls: { type: 'number' },
        partiallyImplementedControls: { type: 'number' },
        notImplementedControls: { type: 'number' },
        plannedControls: { type: 'number' },
        controlCoverage: { type: 'number', description: '% of applicable controls implemented or planned' },
        soaPath: { type: 'string', description: 'Statement of Applicability document path' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'iso27001', 'soa', 'annex-a', 'clause-6']
}));

// Phase 7: Create ISMS Documentation (Clause 7.5)
export const createISMSDocumentationTask = defineTask('create-isms-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Create ISMS Documentation - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ISO 27001 Documentation Specialist',
      task: 'Create comprehensive ISMS documentation (ISO 27001 Clause 7.5)',
      context: {
        organization: args.organization,
        scope: args.scope,
        contextEstablishment: args.contextEstablishment,
        leadershipPolicy: args.leadershipPolicy,
        riskAssessment: args.riskAssessment,
        riskTreatmentPlan: args.riskTreatmentPlan,
        statementOfApplicability: args.statementOfApplicability,
        generatePoliciesTemplates: args.generatePoliciesTemplates,
        implementationDepth: args.implementationDepth,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create ISMS Manual (Level 1 Documentation):',
        '   - ISMS scope and boundaries',
        '   - Information security policy',
        '   - Risk assessment methodology',
        '   - Risk treatment plan summary',
        '   - Statement of Applicability summary',
        '   - ISMS roles and responsibilities',
        '   - ISMS processes overview',
        '2. Create Information Security Policies (Level 2 Documentation):',
        '   - Information Security Policy (master)',
        '   - Access Control Policy',
        '   - Acceptable Use Policy',
        '   - Password Policy',
        '   - Incident Management Policy',
        '   - Business Continuity Policy',
        '   - Data Classification Policy',
        '   - Data Protection/Privacy Policy',
        '   - Change Management Policy',
        '   - Backup and Recovery Policy',
        '   - Physical Security Policy',
        '   - Remote Access Policy',
        '   - Supplier Management Policy',
        '   - Cryptography Policy',
        '3. Create ISMS Procedures (Level 3 Documentation):',
        '   - Risk Assessment Procedure',
        '   - Risk Treatment Procedure',
        '   - Access Control Procedure',
        '   - Incident Management Procedure',
        '   - Business Continuity Procedure',
        '   - Backup and Recovery Procedure',
        '   - Change Management Procedure',
        '   - Document Control Procedure',
        '   - Internal Audit Procedure',
        '   - Management Review Procedure',
        '   - Nonconformity and Corrective Action Procedure',
        '   - Asset Management Procedure',
        '4. Create Work Instructions (Level 4 Documentation):',
        '   - User account creation/deletion',
        '   - Backup execution and verification',
        '   - Incident logging and escalation',
        '   - Vulnerability assessment',
        '   - Security monitoring',
        '5. Create required records and forms:',
        '   - Risk register',
        '   - SOA document',
        '   - Incident log',
        '   - Change log',
        '   - Internal audit reports',
        '   - Management review records',
        '   - Training records',
        '6. Establish document control:',
        '   - Version control',
        '   - Approval workflow',
        '   - Document repository',
        '   - Review frequency',
        '7. Create documentation index',
        '8. Generate policy and procedure templates'
      ],
      outputFormat: 'JSON object with ISMS documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'ismsManualPath', 'policies', 'procedures', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        ismsManualPath: { type: 'string' },
        policies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              policyName: { type: 'string' },
              policyPath: { type: 'string' },
              version: { type: 'string' },
              owner: { type: 'string' },
              approver: { type: 'string' },
              reviewDate: { type: 'string' }
            }
          }
        },
        procedures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              procedureName: { type: 'string' },
              procedurePath: { type: 'string' },
              version: { type: 'string' },
              owner: { type: 'string' }
            }
          }
        },
        workInstructions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              instructionName: { type: 'string' },
              instructionPath: { type: 'string' }
            }
          }
        },
        documentationIndex: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'iso27001', 'documentation', 'clause-7']
}));

// Phase 8: Create Controls Implementation Plan
export const createControlsImplementationPlanTask = defineTask('create-controls-implementation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Create Controls Implementation Plan - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ISMS Implementation Manager',
      task: 'Create Annex A controls implementation plan',
      context: {
        organization: args.organization,
        statementOfApplicability: args.statementOfApplicability,
        riskTreatmentPlan: args.riskTreatmentPlan,
        certificationTimeline: args.certificationTimeline,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Extract all controls requiring implementation from SOA',
        '2. Group controls by implementation phases:',
        '   - Phase 1 (0-3 months): Quick wins, critical controls',
        '   - Phase 2 (3-6 months): High-priority controls',
        '   - Phase 3 (6-9 months): Medium-priority controls',
        '   - Phase 4 (9-12 months): Low-priority, polish, audit prep',
        '3. For each control, define implementation actions:',
        '   - Action description',
        '   - Related Annex A control',
        '   - Owner/responsible party',
        '   - Dependencies',
        '   - Estimated effort (person-days)',
        '   - Required resources (budget, tools, personnel)',
        '   - Success criteria',
        '   - Verification method',
        '4. Identify control dependencies and prerequisites',
        '5. Create implementation timeline/Gantt chart',
        '6. Estimate total implementation cost',
        '7. Define milestones and checkpoints',
        '8. Create implementation tracking mechanism',
        '9. Generate implementation plan document'
      ],
      outputFormat: 'JSON object with controls implementation plan'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'phases', 'totalActions', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        totalActions: { type: 'number' },
        phases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string' },
              duration: { type: 'string' },
              priority: { type: 'string' },
              actions: { type: 'number' },
              controls: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        actions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              actionId: { type: 'string' },
              phase: { type: 'string' },
              description: { type: 'string' },
              annexAControl: { type: 'string' },
              owner: { type: 'string' },
              dependencies: { type: 'array', items: { type: 'string' } },
              estimatedEffort: { type: 'string' },
              requiredResources: { type: 'string' },
              successCriteria: { type: 'string' },
              verificationMethod: { type: 'string' }
            }
          }
        },
        estimatedEffort: { type: 'string', description: 'Total person-days' },
        estimatedCost: { type: 'string' },
        milestones: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              milestone: { type: 'string' },
              targetDate: { type: 'string' },
              deliverables: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'iso27001', 'implementation-plan', 'annex-a']
}));

// Phase 9: Develop Competence and Awareness Program (Clause 7.2 & 7.3)
export const developCompetenceAwarenessProgramTask = defineTask('develop-competence-awareness-program', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Develop Competence and Awareness Program - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Awareness Training Specialist',
      task: 'Develop competence and awareness program (ISO 27001 Clause 7.2 & 7.3)',
      context: {
        organization: args.organization,
        scope: args.scope,
        statementOfApplicability: args.statementOfApplicability,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Determine required competencies for ISMS roles (Clause 7.2):',
        '   - Information Security Manager',
        '   - Internal auditors',
        '   - System administrators',
        '   - Developers',
        '   - All employees',
        '2. Create awareness program (Clause 7.3):',
        '   - Information security policy',
        '   - Individual contributions to ISMS',
        '   - Implications of non-conformity',
        '3. Design training modules:',
        '   - General security awareness (all employees)',
        '   - Role-specific training (technical staff)',
        '   - ISMS training (management)',
        '   - ISO 27001 awareness',
        '   - Incident response training',
        '   - Data protection/privacy training',
        '   - Phishing awareness',
        '   - Secure coding (developers)',
        '4. Define training delivery methods:',
        '   - In-person sessions',
        '   - E-learning modules',
        '   - Video tutorials',
        '   - Simulations (phishing, incident response)',
        '5. Create training schedule',
        '6. Define competence assessment methods',
        '7. Establish training record keeping',
        '8. Create awareness campaign materials',
        '9. Generate training plan and materials'
      ],
      outputFormat: 'JSON object with competence and awareness program'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'trainingModules', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        competencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              role: { type: 'string' },
              requiredCompetencies: { type: 'array', items: { type: 'string' } },
              trainingRequired: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        trainingModules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              moduleName: { type: 'string' },
              audience: { type: 'string' },
              duration: { type: 'string' },
              deliveryMethod: { type: 'string' },
              frequency: { type: 'string' },
              content: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        trainingSchedule: { type: 'string' },
        assessmentMethods: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'iso27001', 'training', 'awareness', 'clause-7']
}));

// Phase 10: Establish Operational Planning (Clause 8)
export const establishOperationalPlanningTask = defineTask('establish-operational-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Establish Operational Planning - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ISMS Operations Manager',
      task: 'Establish ISMS operational planning and control (ISO 27001 Clause 8)',
      context: {
        organization: args.organization,
        scope: args.scope,
        riskTreatmentPlan: args.riskTreatmentPlan,
        statementOfApplicability: args.statementOfApplicability,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Plan implementation of risk treatment (Clause 8.1):',
        '   - Define criteria for risk treatment',
        '   - Control implementation processes',
        '   - Integration with business processes',
        '2. Conduct information security risk assessment (Clause 8.2):',
        '   - Regular risk assessment schedule',
        '   - Trigger events for ad-hoc assessments',
        '   - Risk assessment documentation',
        '3. Implement risk treatment plan (Clause 8.3):',
        '   - Control implementation procedures',
        '   - Change management integration',
        '   - Verification of implementation',
        '4. Create operational procedures for:',
        '   - Daily security operations',
        '   - Access provisioning/deprovisioning',
        '   - Incident handling',
        '   - Change management',
        '   - Backup and recovery',
        '   - Patch management',
        '   - Vulnerability management',
        '   - Security monitoring',
        '5. Define operational roles and handoffs',
        '6. Establish operational metrics',
        '7. Create run books for common tasks',
        '8. Generate operational procedures manual'
      ],
      outputFormat: 'JSON object with operational planning'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'operationalProcedures', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        operationalProcedures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              procedureName: { type: 'string' },
              purpose: { type: 'string' },
              frequency: { type: 'string' },
              owner: { type: 'string' },
              inputs: { type: 'array', items: { type: 'string' } },
              outputs: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        riskAssessmentSchedule: { type: 'string' },
        operationalMetrics: {
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
  labels: ['agent', 'iso27001', 'operations', 'clause-8']
}));

// Phase 11: Establish Monitoring and Measurement (Clause 9.1)
export const establishMonitoringMeasurementTask = defineTask('establish-monitoring-measurement', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Establish Monitoring and Measurement - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ISMS Performance Analyst',
      task: 'Establish monitoring, measurement, analysis, and evaluation (ISO 27001 Clause 9.1)',
      context: {
        organization: args.organization,
        statementOfApplicability: args.statementOfApplicability,
        riskAssessment: args.riskAssessment,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Determine what needs monitoring and measurement:',
        '   - Information security processes',
        '   - Controls effectiveness',
        '   - ISMS performance',
        '   - Risk levels',
        '   - Compliance status',
        '2. Define Key Performance Indicators (KPIs):',
        '   - Number of security incidents',
        '   - Time to detect/respond to incidents',
        '   - Vulnerability remediation time',
        '   - Patch compliance rate',
        '   - Training completion rate',
        '   - Control effectiveness scores',
        '   - Risk reduction metrics',
        '3. Define measurement methods:',
        '   - Automated monitoring (SIEM, scanning tools)',
        '   - Manual reviews',
        '   - Audits',
        '   - Surveys',
        '4. Establish measurement frequency',
        '5. Define reporting mechanisms and dashboards',
        '6. Establish baselines and targets',
        '7. Create monitoring and measurement procedure',
        '8. Generate KPI dashboard design'
      ],
      outputFormat: 'JSON object with monitoring and measurement program'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'kpis', 'metrics', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        kpis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              kpiName: { type: 'string' },
              description: { type: 'string' },
              measurementMethod: { type: 'string' },
              frequency: { type: 'string' },
              target: { type: 'string' },
              owner: { type: 'string' }
            }
          }
        },
        metrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metricName: { type: 'string' },
              category: { type: 'string' },
              dataSource: { type: 'string' },
              frequency: { type: 'string' }
            }
          }
        },
        monitoringTools: { type: 'array', items: { type: 'string' } },
        reportingSchedule: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'iso27001', 'monitoring', 'measurement', 'clause-9']
}));

// Phase 12: Establish Internal Audit Program (Clause 9.2)
export const establishInternalAuditProgramTask = defineTask('establish-internal-audit-program', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Establish Internal Audit Program - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ISO 27001 Internal Auditor',
      task: 'Establish internal audit program (ISO 27001 Clause 9.2)',
      context: {
        organization: args.organization,
        scope: args.scope,
        statementOfApplicability: args.statementOfApplicability,
        includeAuditPreparation: args.includeAuditPreparation,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Establish internal audit program (Clause 9.2):',
        '   - Audit frequency (at least annually)',
        '   - Audit scope (all ISMS clauses, applicable Annex A controls)',
        '   - Audit criteria (ISO 27001 requirements)',
        '   - Audit methodology',
        '2. Create internal audit procedure:',
        '   - Audit planning',
        '   - Audit execution',
        '   - Audit reporting',
        '   - Follow-up on findings',
        '3. Develop audit schedule:',
        '   - Annual audit plan',
        '   - Quarterly/monthly mini-audits',
        '   - Ad-hoc audits',
        '4. Create audit checklists:',
        '   - Clause 4-10 requirements',
        '   - Annex A controls (applicable)',
        '5. Define auditor requirements:',
        '   - Competence requirements',
        '   - Independence requirements',
        '   - Training needs',
        '6. Identify/train internal auditors',
        '7. Create audit report templates',
        '8. Define nonconformity classification:',
        '   - Major nonconformity',
        '   - Minor nonconformity',
        '   - Observation',
        '9. Establish corrective action tracking',
        '10. Generate audit program documentation'
      ],
      outputFormat: 'JSON object with internal audit program'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'auditSchedule', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        auditFrequency: { type: 'string' },
        auditSchedule: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              auditName: { type: 'string' },
              scope: { type: 'string' },
              scheduledDate: { type: 'string' },
              auditor: { type: 'string' },
              areas: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        auditChecklists: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              checklistName: { type: 'string' },
              area: { type: 'string' },
              questions: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        auditorRequirements: {
          type: 'object',
          properties: {
            competencies: { type: 'array', items: { type: 'string' } },
            training: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'iso27001', 'internal-audit', 'clause-9']
}));

// Phase 13: Establish Management Review (Clause 9.3)
export const establishManagementReviewTask = defineTask('establish-management-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 13: Establish Management Review Process - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ISMS Management Coordinator',
      task: 'Establish management review process (ISO 27001 Clause 9.3)',
      context: {
        organization: args.organization,
        scope: args.scope,
        riskAssessment: args.riskAssessment,
        statementOfApplicability: args.statementOfApplicability,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Establish management review process (Clause 9.3):',
        '   - Review frequency (at least annually, recommend quarterly)',
        '   - Participants (top management, ISMS manager, key stakeholders)',
        '   - Agenda and review inputs',
        '   - Decision-making process',
        '2. Define management review inputs (Clause 9.3.2):',
        '   - Status of actions from previous reviews',
        '   - Changes in external/internal issues',
        '   - Feedback on ISMS performance (incidents, metrics, KPIs)',
        '   - Results of risk assessments',
        '   - Results of internal audits',
        '   - Fulfillment of information security objectives',
        '   - Feedback from interested parties',
        '   - Opportunities for continual improvement',
        '3. Define management review outputs (Clause 9.3.3):',
        '   - Decisions on continual improvement',
        '   - Changes to ISMS',
        '   - Resource needs',
        '4. Create management review procedure',
        '5. Design management review meeting agenda',
        '6. Create management review report template',
        '7. Define action tracking mechanism',
        '8. Generate management review schedule'
      ],
      outputFormat: 'JSON object with management review process'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'reviewFrequency', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        reviewFrequency: { type: 'string' },
        participants: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              role: { type: 'string' },
              responsibilities: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        reviewInputs: { type: 'array', items: { type: 'string' } },
        reviewOutputs: { type: 'array', items: { type: 'string' } },
        agenda: { type: 'array', items: { type: 'string' } },
        reviewSchedule: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              reviewDate: { type: 'string' },
              focus: { type: 'string' }
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
  labels: ['agent', 'iso27001', 'management-review', 'clause-9']
}));

// Phase 14: Establish Continual Improvement (Clause 10)
export const establishContinualImprovementTask = defineTask('establish-continual-improvement', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 14: Establish Continual Improvement Process - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Quality Improvement Manager',
      task: 'Establish continual improvement process (ISO 27001 Clause 10)',
      context: {
        organization: args.organization,
        scope: args.scope,
        riskAssessment: args.riskAssessment,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Establish nonconformity and corrective action process (Clause 10.1):',
        '   - Nonconformity identification',
        '   - Nonconformity analysis (root cause)',
        '   - Corrective action determination',
        '   - Corrective action implementation',
        '   - Effectiveness review',
        '   - Documentation and record keeping',
        '2. Create nonconformity log template',
        '3. Define corrective action procedure:',
        '   - Immediate containment',
        '   - Root cause analysis (5 Whys, Fishbone)',
        '   - Corrective action planning',
        '   - Implementation',
        '   - Verification',
        '   - Closure',
        '4. Establish continual improvement process (Clause 10.2):',
        '   - Improvement identification sources (audits, reviews, incidents)',
        '   - Improvement evaluation',
        '   - Improvement implementation',
        '   - Improvement tracking',
        '5. Create improvement register',
        '6. Define improvement metrics',
        '7. Establish continuous improvement culture',
        '8. Generate continual improvement procedure'
      ],
      outputFormat: 'JSON object with continual improvement process'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        nonconformityProcess: {
          type: 'object',
          properties: {
            identificationSources: { type: 'array', items: { type: 'string' } },
            analysisMethod: { type: 'array', items: { type: 'string' } },
            correctionTimelines: { type: 'object' }
          }
        },
        improvementProcess: {
          type: 'object',
          properties: {
            improvementSources: { type: 'array', items: { type: 'string' } },
            evaluationCriteria: { type: 'array', items: { type: 'string' } },
            trackingMethod: { type: 'string' }
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
  labels: ['agent', 'iso27001', 'continual-improvement', 'clause-10']
}));

// Phase 15: Prepare for Certification Audit
export const prepareCertificationAuditTask = defineTask('prepare-certification-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 15: Prepare for Certification Audit - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ISO 27001 Certification Consultant',
      task: 'Prepare for ISO 27001 certification audit',
      context: {
        organization: args.organization,
        scope: args.scope,
        contextEstablishment: args.contextEstablishment,
        leadershipPolicy: args.leadershipPolicy,
        riskAssessment: args.riskAssessment,
        statementOfApplicability: args.statementOfApplicability,
        ismsDocumentation: args.ismsDocumentation,
        internalAuditProgram: args.internalAuditProgram,
        managementReview: args.managementReview,
        targetCertificationBody: args.targetCertificationBody,
        certificationTimeline: args.certificationTimeline,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Understand certification audit process:',
        '   - Stage 1 audit (documentation review)',
        '   - Stage 2 audit (on-site implementation review)',
        '   - Surveillance audits (ongoing)',
        '   - Recertification audit (every 3 years)',
        '2. Prepare for Stage 1 audit (documentation review):',
        '   - ISMS scope document',
        '   - Information security policy',
        '   - Risk assessment and treatment',
        '   - Statement of Applicability',
        '   - ISMS procedures and processes',
        '   - Internal audit reports',
        '   - Management review records',
        '3. Prepare for Stage 2 audit (implementation review):',
        '   - Evidence of control implementation',
        '   - Operational records',
        '   - Training records',
        '   - Incident logs',
        '   - Change logs',
        '   - Access control evidence',
        '   - Backup logs',
        '   - Employee interviews preparation',
        '4. Conduct readiness assessment:',
        '   - Clause-by-clause compliance check',
        '   - Annex A controls evidence review',
        '   - Documentation completeness',
        '   - Operational evidence availability',
        '   - Employee awareness level',
        '5. Identify certification readiness gaps',
        '6. Calculate certification readiness score (0-100)',
        '7. Create audit preparation checklist',
        '8. Conduct mock audit (if time permits)',
        '9. Prepare audit response team',
        '10. Generate audit preparation guide'
      ],
      outputFormat: 'JSON object with certification audit preparation'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'readinessScore', 'readinessLevel', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        readinessScore: { type: 'number', minimum: 0, maximum: 100 },
        readinessLevel: { type: 'string', enum: ['Not Ready', 'Partially Ready', 'Ready', 'Fully Ready'] },
        stage1Readiness: {
          type: 'object',
          properties: {
            documentationComplete: { type: 'boolean' },
            missingDocuments: { type: 'array', items: { type: 'string' } }
          }
        },
        stage2Readiness: {
          type: 'object',
          properties: {
            controlsImplemented: { type: 'number' },
            evidenceAvailable: { type: 'number' },
            missingEvidence: { type: 'array', items: { type: 'string' } }
          }
        },
        readinessGaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gap: { type: 'string' },
              severity: { type: 'string', enum: ['Critical', 'High', 'Medium', 'Low'] },
              remediation: { type: 'string' }
            }
          }
        },
        criticalGaps: { type: 'number' },
        remainingActions: { type: 'number' },
        recommendation: { type: 'string' },
        auditPreparationPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'iso27001', 'certification', 'audit-preparation']
}));

// Phase 16: Create Implementation Roadmap
export const createImplementationRoadmapTask = defineTask('create-implementation-roadmap', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 16: Create ISMS Implementation Roadmap - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ISMS Project Manager',
      task: 'Create comprehensive ISMS implementation roadmap and final report',
      context: {
        organization: args.organization,
        scope: args.scope,
        contextEstablishment: args.contextEstablishment,
        gapAnalysis: args.gapAnalysis,
        riskAssessment: args.riskAssessment,
        statementOfApplicability: args.statementOfApplicability,
        controlsImplementationPlan: args.controlsImplementationPlan,
        certificationPreparation: args.certificationPreparation,
        certificationTimeline: args.certificationTimeline,
        phases: args.phases,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Consolidate all implementation phases and activities',
        '2. Create executive summary:',
        '   - Organization overview',
        '   - ISMS scope',
        '   - Current state (gap analysis)',
        '   - Risk profile',
        '   - Implementation approach',
        '   - Timeline and milestones',
        '   - Resource requirements',
        '   - Expected outcomes',
        '3. Create detailed roadmap:',
        '   - Timeline (month-by-month or quarter-by-quarter)',
        '   - Key activities per phase',
        '   - Deliverables per phase',
        '   - Dependencies',
        '   - Resource allocation',
        '   - Budget estimates',
        '4. Define major milestones:',
        '   - ISMS documentation complete',
        '   - Critical controls implemented',
        '   - Internal audit complete',
        '   - Management review complete',
        '   - Stage 1 audit ready',
        '   - Stage 2 audit ready',
        '   - ISO 27001 certification achieved',
        '5. Identify success criteria and KPIs',
        '6. Define risk management for implementation',
        '7. Create governance structure',
        '8. Define communication plan',
        '9. Create comprehensive implementation report',
        '10. Generate roadmap visualization (Gantt chart, timeline)'
      ],
      outputFormat: 'JSON object with implementation roadmap'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'roadmapPath', 'milestones', 'totalActions', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        executiveSummary: {
          type: 'object',
          properties: {
            organization: { type: 'string' },
            scope: { type: 'string' },
            currentState: { type: 'string' },
            targetState: { type: 'string' },
            approach: { type: 'string' },
            timeline: { type: 'string' }
          }
        },
        milestones: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              milestone: { type: 'string' },
              targetDate: { type: 'string' },
              status: { type: 'string', enum: ['Not Started', 'In Progress', 'Completed'] },
              deliverables: { type: 'array', items: { type: 'string' } },
              dependencies: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        totalActions: { type: 'number' },
        estimatedBudget: { type: 'string' },
        estimatedEffort: { type: 'string' },
        keyRisks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              risk: { type: 'string' },
              mitigation: { type: 'string' }
            }
          }
        },
        successCriteria: { type: 'array', items: { type: 'string' } },
        recommendation: { type: 'string' },
        roadmapPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'iso27001', 'implementation-roadmap', 'project-management']
}));
