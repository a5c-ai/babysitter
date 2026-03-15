/**
 * @process specializations/security-compliance/security-policies
 * @description Security Policy Documentation Process - Comprehensive security policy development, documentation, and
 * management process covering information security policies, procedures, standards, and guidelines. Implements
 * policy frameworks aligned with ISO 27001, NIST, CIS Controls, and industry best practices. Includes policy
 * lifecycle management, stakeholder review, approval workflows, and continuous policy maintenance.
 * @specialization Security & Compliance
 * @category Governance
 * @inputs { organization: string, policyScope?: string[], frameworks?: string[], industryVertical?: string }
 * @outputs { success: boolean, policiesCreated: number, proceduresCreated: number, standardsCreated: number, policies: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/security-compliance/security-policies', {
 *   organization: 'Acme Corporation',
 *   policyScope: ['information-security', 'data-protection', 'access-control', 'incident-response'],
 *   frameworks: ['ISO-27001', 'NIST-CSF', 'CIS-Controls'],
 *   industryVertical: 'financial-services', // 'healthcare', 'saas', 'ecommerce', 'fintech'
 *   complianceRequirements: ['SOC2', 'GDPR', 'PCI-DSS'],
 *   existingPolicies: false,
 *   policyReviewCycle: 'annual', // 'quarterly', 'semi-annual', 'annual'
 *   organizationSize: 'medium', // 'small' (<50), 'medium' (50-500), 'large' (>500)
 *   approvalWorkflow: true,
 *   versionControl: true,
 *   employeeAcknowledgment: true,
 *   policyTraining: true
 * });
 *
 * @references
 * - ISO/IEC 27001:2022 Information Security Management: https://www.iso.org/standard/27001
 * - NIST Cybersecurity Framework: https://www.nist.gov/cyberframework
 * - NIST SP 800-53 Security Controls: https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final
 * - CIS Controls: https://www.cisecurity.org/controls
 * - SANS Security Policy Templates: https://www.sans.org/information-security-policy/
 * - ISO 27002:2022 Code of Practice: https://www.iso.org/standard/75652.html
 * - NIST SP 800-12 Security Handbook: https://csrc.nist.gov/publications/detail/sp/800-12/rev-1/final
 * - Policy Framework Best Practices: https://www.isaca.org/resources/isaca-journal/issues/2019/volume-1/developing-an-information-security-policy-framework
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organization,
    policyScope = [
      'information-security',
      'acceptable-use',
      'access-control',
      'data-protection',
      'incident-response',
      'business-continuity',
      'change-management',
      'vendor-management',
      'physical-security',
      'asset-management'
    ],
    frameworks = ['ISO-27001', 'NIST-CSF', 'CIS-Controls'],
    industryVertical = 'general',
    complianceRequirements = [],
    existingPolicies = false,
    policyReviewCycle = 'annual',
    organizationSize = 'medium',
    outputDir = 'security-policies-output',
    approvalWorkflow = true,
    versionControl = true,
    employeeAcknowledgment = true,
    policyTraining = true,
    includeStandards = true,
    includeProcedures = true,
    includeGuidelines = true,
    executiveSummary = true,
    multiLanguage = false,
    languages = ['en']
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const policies = [];
  const procedures = [];
  const standards = [];
  const guidelines = [];
  const phases = [];
  let policiesCreated = 0;
  let proceduresCreated = 0;
  let standardsCreated = 0;

  ctx.log('info', `Starting Security Policy Documentation for ${organization}`);
  ctx.log('info', `Policy Scope: ${policyScope.length} policy areas, Frameworks: ${frameworks.join(', ')}`);
  ctx.log('info', `Industry: ${industryVertical}, Compliance: ${complianceRequirements.join(', ')}`);

  // ============================================================================
  // PHASE 1: POLICY FRAMEWORK ASSESSMENT AND PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 1: Assessing current policy framework and planning');

  const frameworkAssessmentResult = await ctx.task(assessPolicyFrameworkTask, {
    organization,
    policyScope,
    frameworks,
    complianceRequirements,
    industryVertical,
    existingPolicies,
    organizationSize,
    outputDir
  });

  artifacts.push(...frameworkAssessmentResult.artifacts);
  phases.push({ phase: 'framework-assessment', result: frameworkAssessmentResult });

  ctx.log('info', `Framework assessment complete - ${frameworkAssessmentResult.gapsIdentified} gaps identified, ${frameworkAssessmentResult.policiesRequired} policies required`);

  // Quality Gate: Framework assessment review
  await ctx.breakpoint({
    question: `Policy framework assessed for ${organization}. ${frameworkAssessmentResult.policiesRequired} policies required, ${frameworkAssessmentResult.gapsIdentified} gaps identified. Review framework assessment?`,
    title: 'Policy Framework Assessment Review',
    context: {
      runId: ctx.runId,
      assessment: {
        organization,
        industryVertical,
        organizationSize,
        policiesRequired: frameworkAssessmentResult.policiesRequired,
        gapsIdentified: frameworkAssessmentResult.gapsIdentified,
        frameworks,
        complianceRequirements,
        policyScope
      },
      gaps: frameworkAssessmentResult.gaps.slice(0, 10),
      recommendations: frameworkAssessmentResult.recommendations,
      files: frameworkAssessmentResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 2: POLICY HIERARCHY AND STRUCTURE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing policy hierarchy and document structure');

  const policyStructureResult = await ctx.task(designPolicyStructureTask, {
    organization,
    policyScope,
    frameworks,
    includeStandards,
    includeProcedures,
    includeGuidelines,
    organizationSize,
    outputDir
  });

  artifacts.push(...policyStructureResult.artifacts);
  phases.push({ phase: 'policy-structure', result: policyStructureResult });

  ctx.log('info', `Policy structure designed - ${policyStructureResult.hierarchyLevels} levels, ${policyStructureResult.documentTypes} document types`);

  // ============================================================================
  // PHASE 3: INFORMATION SECURITY MASTER POLICY
  // ============================================================================

  ctx.log('info', 'Phase 3: Creating Information Security Master Policy');

  const masterPolicyResult = await ctx.task(createMasterSecurityPolicyTask, {
    organization,
    frameworks,
    complianceRequirements,
    industryVertical,
    organizationSize,
    policyStructure: policyStructureResult.structure,
    outputDir
  });

  artifacts.push(...masterPolicyResult.artifacts);
  policies.push(masterPolicyResult.policy);
  policiesCreated++;
  phases.push({ phase: 'master-policy', result: masterPolicyResult });

  ctx.log('info', `Master security policy created - ${masterPolicyResult.sectionsCount} sections, ${masterPolicyResult.wordCount} words`);

  // ============================================================================
  // PHASE 4: ACCESS CONTROL AND IDENTITY MANAGEMENT POLICIES
  // ============================================================================

  let accessControlResult = null;
  if (policyScope.includes('access-control') || policyScope.includes('identity-management')) {
    ctx.log('info', 'Phase 4: Creating Access Control and Identity Management policies');

    accessControlResult = await ctx.task(createAccessControlPoliciesTask, {
      organization,
      frameworks,
      complianceRequirements,
      includeProcedures,
      includeStandards,
      organizationSize,
      outputDir
    });

    artifacts.push(...accessControlResult.artifacts);
    policies.push(...accessControlResult.policies);
    procedures.push(...accessControlResult.procedures);
    standards.push(...accessControlResult.standards);
    policiesCreated += accessControlResult.policies.length;
    proceduresCreated += accessControlResult.procedures.length;
    standardsCreated += accessControlResult.standards.length;
    phases.push({ phase: 'access-control-policies', result: accessControlResult });

    ctx.log('info', `Access control policies created - ${accessControlResult.policies.length} policies, ${accessControlResult.procedures.length} procedures`);
  }

  // ============================================================================
  // PHASE 5: DATA PROTECTION AND PRIVACY POLICIES
  // ============================================================================

  let dataProtectionResult = null;
  if (policyScope.includes('data-protection') || policyScope.includes('privacy')) {
    ctx.log('info', 'Phase 5: Creating Data Protection and Privacy policies');

    dataProtectionResult = await ctx.task(createDataProtectionPoliciesTask, {
      organization,
      frameworks,
      complianceRequirements,
      industryVertical,
      includeProcedures,
      includeStandards,
      outputDir
    });

    artifacts.push(...dataProtectionResult.artifacts);
    policies.push(...dataProtectionResult.policies);
    procedures.push(...dataProtectionResult.procedures);
    standards.push(...dataProtectionResult.standards);
    policiesCreated += dataProtectionResult.policies.length;
    proceduresCreated += dataProtectionResult.procedures.length;
    standardsCreated += dataProtectionResult.standards.length;
    phases.push({ phase: 'data-protection-policies', result: dataProtectionResult });

    ctx.log('info', `Data protection policies created - ${dataProtectionResult.policies.length} policies, ${dataProtectionResult.procedures.length} procedures`);
  }

  // ============================================================================
  // PHASE 6: INCIDENT RESPONSE AND BUSINESS CONTINUITY POLICIES
  // ============================================================================

  let incidentResponseResult = null;
  if (policyScope.includes('incident-response') || policyScope.includes('business-continuity')) {
    ctx.log('info', 'Phase 6: Creating Incident Response and Business Continuity policies');

    incidentResponseResult = await ctx.task(createIncidentResponsePoliciesTask, {
      organization,
      frameworks,
      complianceRequirements,
      includeProcedures,
      includeStandards,
      organizationSize,
      outputDir
    });

    artifacts.push(...incidentResponseResult.artifacts);
    policies.push(...incidentResponseResult.policies);
    procedures.push(...incidentResponseResult.procedures);
    standards.push(...incidentResponseResult.standards);
    policiesCreated += incidentResponseResult.policies.length;
    proceduresCreated += incidentResponseResult.procedures.length;
    standardsCreated += incidentResponseResult.standards.length;
    phases.push({ phase: 'incident-response-policies', result: incidentResponseResult });

    ctx.log('info', `Incident response policies created - ${incidentResponseResult.policies.length} policies, ${incidentResponseResult.procedures.length} procedures`);
  }

  // ============================================================================
  // PHASE 7: ACCEPTABLE USE AND SECURITY AWARENESS POLICIES
  // ============================================================================

  let acceptableUseResult = null;
  if (policyScope.includes('acceptable-use') || policyScope.includes('security-awareness')) {
    ctx.log('info', 'Phase 7: Creating Acceptable Use and Security Awareness policies');

    acceptableUseResult = await ctx.task(createAcceptableUsePoliciesTask, {
      organization,
      frameworks,
      industryVertical,
      includeProcedures,
      includeGuidelines,
      organizationSize,
      outputDir
    });

    artifacts.push(...acceptableUseResult.artifacts);
    policies.push(...acceptableUseResult.policies);
    procedures.push(...acceptableUseResult.procedures);
    guidelines.push(...acceptableUseResult.guidelines);
    policiesCreated += acceptableUseResult.policies.length;
    proceduresCreated += acceptableUseResult.procedures.length;
    phases.push({ phase: 'acceptable-use-policies', result: acceptableUseResult });

    ctx.log('info', `Acceptable use policies created - ${acceptableUseResult.policies.length} policies, ${acceptableUseResult.guidelines.length} guidelines`);
  }

  // ============================================================================
  // PHASE 8: ASSET MANAGEMENT AND PHYSICAL SECURITY POLICIES
  // ============================================================================

  let assetManagementResult = null;
  if (policyScope.includes('asset-management') || policyScope.includes('physical-security')) {
    ctx.log('info', 'Phase 8: Creating Asset Management and Physical Security policies');

    assetManagementResult = await ctx.task(createAssetManagementPoliciesTask, {
      organization,
      frameworks,
      complianceRequirements,
      includeProcedures,
      includeStandards,
      outputDir
    });

    artifacts.push(...assetManagementResult.artifacts);
    policies.push(...assetManagementResult.policies);
    procedures.push(...assetManagementResult.procedures);
    standards.push(...assetManagementResult.standards);
    policiesCreated += assetManagementResult.policies.length;
    proceduresCreated += assetManagementResult.procedures.length;
    standardsCreated += assetManagementResult.standards.length;
    phases.push({ phase: 'asset-management-policies', result: assetManagementResult });

    ctx.log('info', `Asset management policies created - ${assetManagementResult.policies.length} policies, ${assetManagementResult.procedures.length} procedures`);
  }

  // Quality Gate: Core policies review
  await ctx.breakpoint({
    question: `Core security policies created. ${policiesCreated} policies, ${proceduresCreated} procedures, ${standardsCreated} standards. Review core policies before continuing?`,
    title: 'Core Policies Review',
    context: {
      runId: ctx.runId,
      summary: {
        policiesCreated,
        proceduresCreated,
        standardsCreated,
        guidelinesCreated: guidelines.length,
        totalDocuments: policiesCreated + proceduresCreated + standardsCreated + guidelines.length
      },
      policiesByCategory: {
        master: 1,
        accessControl: accessControlResult?.policies.length || 0,
        dataProtection: dataProtectionResult?.policies.length || 0,
        incidentResponse: incidentResponseResult?.policies.length || 0,
        acceptableUse: acceptableUseResult?.policies.length || 0,
        assetManagement: assetManagementResult?.policies.length || 0
      },
      files: artifacts.filter(a => a.type === 'policy').slice(0, 15).map(a => ({ path: a.path, format: a.format || 'markdown', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 9: VENDOR AND THIRD-PARTY MANAGEMENT POLICIES
  // ============================================================================

  let vendorManagementResult = null;
  if (policyScope.includes('vendor-management') || policyScope.includes('third-party')) {
    ctx.log('info', 'Phase 9: Creating Vendor and Third-Party Management policies');

    vendorManagementResult = await ctx.task(createVendorManagementPoliciesTask, {
      organization,
      frameworks,
      complianceRequirements,
      includeProcedures,
      includeStandards,
      outputDir
    });

    artifacts.push(...vendorManagementResult.artifacts);
    policies.push(...vendorManagementResult.policies);
    procedures.push(...vendorManagementResult.procedures);
    standards.push(...vendorManagementResult.standards);
    policiesCreated += vendorManagementResult.policies.length;
    proceduresCreated += vendorManagementResult.procedures.length;
    standardsCreated += vendorManagementResult.standards.length;
    phases.push({ phase: 'vendor-management-policies', result: vendorManagementResult });

    ctx.log('info', `Vendor management policies created - ${vendorManagementResult.policies.length} policies, ${vendorManagementResult.procedures.length} procedures`);
  }

  // ============================================================================
  // PHASE 10: CHANGE MANAGEMENT AND SYSTEM DEVELOPMENT POLICIES
  // ============================================================================

  let changeManagementResult = null;
  if (policyScope.includes('change-management') || policyScope.includes('system-development')) {
    ctx.log('info', 'Phase 10: Creating Change Management and System Development policies');

    changeManagementResult = await ctx.task(createChangeManagementPoliciesTask, {
      organization,
      frameworks,
      complianceRequirements,
      includeProcedures,
      includeStandards,
      outputDir
    });

    artifacts.push(...changeManagementResult.artifacts);
    policies.push(...changeManagementResult.policies);
    procedures.push(...changeManagementResult.procedures);
    standards.push(...changeManagementResult.standards);
    policiesCreated += changeManagementResult.policies.length;
    proceduresCreated += changeManagementResult.procedures.length;
    standardsCreated += changeManagementResult.standards.length;
    phases.push({ phase: 'change-management-policies', result: changeManagementResult });

    ctx.log('info', `Change management policies created - ${changeManagementResult.policies.length} policies, ${changeManagementResult.procedures.length} procedures`);
  }

  // ============================================================================
  // PHASE 11: CRYPTOGRAPHY AND ENCRYPTION POLICIES
  // ============================================================================

  let cryptographyResult = null;
  if (policyScope.includes('cryptography') || policyScope.includes('encryption')) {
    ctx.log('info', 'Phase 11: Creating Cryptography and Encryption policies');

    cryptographyResult = await ctx.task(createCryptographyPoliciesTask, {
      organization,
      frameworks,
      complianceRequirements,
      includeProcedures,
      includeStandards,
      outputDir
    });

    artifacts.push(...cryptographyResult.artifacts);
    policies.push(...cryptographyResult.policies);
    procedures.push(...cryptographyResult.procedures);
    standards.push(...cryptographyResult.standards);
    policiesCreated += cryptographyResult.policies.length;
    proceduresCreated += cryptographyResult.procedures.length;
    standardsCreated += cryptographyResult.standards.length;
    phases.push({ phase: 'cryptography-policies', result: cryptographyResult });

    ctx.log('info', `Cryptography policies created - ${cryptographyResult.policies.length} policies, ${cryptographyResult.standards.length} standards`);
  }

  // ============================================================================
  // PHASE 12: CLOUD SECURITY AND REMOTE WORK POLICIES
  // ============================================================================

  let cloudSecurityResult = null;
  if (policyScope.includes('cloud-security') || policyScope.includes('remote-work')) {
    ctx.log('info', 'Phase 12: Creating Cloud Security and Remote Work policies');

    cloudSecurityResult = await ctx.task(createCloudSecurityPoliciesTask, {
      organization,
      frameworks,
      complianceRequirements,
      includeProcedures,
      includeStandards,
      outputDir
    });

    artifacts.push(...cloudSecurityResult.artifacts);
    policies.push(...cloudSecurityResult.policies);
    procedures.push(...cloudSecurityResult.procedures);
    standards.push(...cloudSecurityResult.standards);
    policiesCreated += cloudSecurityResult.policies.length;
    proceduresCreated += cloudSecurityResult.procedures.length;
    standardsCreated += cloudSecurityResult.standards.length;
    phases.push({ phase: 'cloud-security-policies', result: cloudSecurityResult });

    ctx.log('info', `Cloud security policies created - ${cloudSecurityResult.policies.length} policies, ${cloudSecurityResult.procedures.length} procedures`);
  }

  // ============================================================================
  // PHASE 13: POLICY APPROVAL WORKFLOW AND VERSION CONTROL
  // ============================================================================

  if (approvalWorkflow || versionControl) {
    ctx.log('info', 'Phase 13: Setting up policy approval workflow and version control');

    const approvalWorkflowResult = await ctx.task(setupApprovalWorkflowTask, {
      organization,
      policies,
      procedures,
      standards,
      approvalWorkflow,
      versionControl,
      organizationSize,
      outputDir
    });

    artifacts.push(...approvalWorkflowResult.artifacts);
    phases.push({ phase: 'approval-workflow', result: approvalWorkflowResult });

    ctx.log('info', `Approval workflow setup - ${approvalWorkflowResult.approversAssigned} approvers assigned, ${approvalWorkflowResult.workflowsCreated} workflows created`);
  }

  // ============================================================================
  // PHASE 14: POLICY ACKNOWLEDGMENT AND TRAINING PROGRAM
  // ============================================================================

  if (employeeAcknowledgment || policyTraining) {
    ctx.log('info', 'Phase 14: Creating policy acknowledgment and training program');

    const trainingProgramResult = await ctx.task(createTrainingProgramTask, {
      organization,
      policies,
      procedures,
      guidelines,
      employeeAcknowledgment,
      policyTraining,
      organizationSize,
      outputDir
    });

    artifacts.push(...trainingProgramResult.artifacts);
    phases.push({ phase: 'training-program', result: trainingProgramResult });

    ctx.log('info', `Training program created - ${trainingProgramResult.trainingModules} modules, ${trainingProgramResult.acknowledgmentForms} acknowledgment forms`);

    // Quality Gate: Training program review
    await ctx.breakpoint({
      question: `Policy training program created with ${trainingProgramResult.trainingModules} modules and ${trainingProgramResult.acknowledgmentForms} acknowledgment forms. Review training program?`,
      title: 'Policy Training Program Review',
      context: {
        runId: ctx.runId,
        training: {
          trainingModules: trainingProgramResult.trainingModules,
          acknowledgmentForms: trainingProgramResult.acknowledgmentForms,
          estimatedDuration: trainingProgramResult.estimatedDuration,
          deliveryMethods: trainingProgramResult.deliveryMethods
        },
        files: trainingProgramResult.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 15: POLICY REVIEW AND MAINTENANCE SCHEDULE
  // ============================================================================

  ctx.log('info', 'Phase 15: Creating policy review and maintenance schedule');

  const maintenanceScheduleResult = await ctx.task(createMaintenanceScheduleTask, {
    organization,
    policies,
    procedures,
    standards,
    policyReviewCycle,
    outputDir
  });

  artifacts.push(...maintenanceScheduleResult.artifacts);
  phases.push({ phase: 'maintenance-schedule', result: maintenanceScheduleResult });

  ctx.log('info', `Maintenance schedule created - ${maintenanceScheduleResult.reviewSchedules} review schedules, next review: ${maintenanceScheduleResult.nextReviewDate}`);

  // ============================================================================
  // PHASE 16: FRAMEWORK AND COMPLIANCE MAPPING
  // ============================================================================

  ctx.log('info', 'Phase 16: Mapping policies to frameworks and compliance requirements');

  const frameworkMappingResult = await ctx.task(mapPolicyToFrameworksTask, {
    organization,
    policies,
    procedures,
    standards,
    frameworks,
    complianceRequirements,
    outputDir
  });

  artifacts.push(...frameworkMappingResult.artifacts);
  phases.push({ phase: 'framework-mapping', result: frameworkMappingResult });

  ctx.log('info', `Framework mapping complete - Mapped to ${frameworkMappingResult.frameworksMapped.length} frameworks, ${frameworkMappingResult.complianceCoverage}% compliance coverage`);

  // ============================================================================
  // PHASE 17: EXECUTIVE SUMMARY AND POLICY HANDBOOK
  // ============================================================================

  ctx.log('info', 'Phase 17: Creating executive summary and policy handbook');

  const policyHandbookResult = await ctx.task(createPolicyHandbookTask, {
    organization,
    policies,
    procedures,
    standards,
    guidelines,
    frameworkMapping: frameworkMappingResult,
    executiveSummary,
    multiLanguage,
    languages,
    outputDir
  });

  artifacts.push(...policyHandbookResult.artifacts);
  phases.push({ phase: 'policy-handbook', result: policyHandbookResult });

  ctx.log('info', `Policy handbook created - ${policyHandbookResult.handbookPages} pages, ${policyHandbookResult.languageVersions} language versions`);

  // Final Breakpoint: Security policy documentation complete
  await ctx.breakpoint({
    question: `Security Policy Documentation Complete for ${organization}. ${policiesCreated} policies, ${proceduresCreated} procedures, ${standardsCreated} standards created. Approve final policy package?`,
    title: 'Final Security Policy Package Review',
    context: {
      runId: ctx.runId,
      summary: {
        organization,
        policiesCreated,
        proceduresCreated,
        standardsCreated,
        guidelinesCreated: guidelines.length,
        totalDocuments: policiesCreated + proceduresCreated + standardsCreated + guidelines.length,
        frameworks,
        complianceRequirements,
        policyReviewCycle,
        approvalWorkflow,
        versionControl
      },
      policiesByCategory: policyScope.reduce((acc, scope) => {
        const policyCount = policies.filter(p => p.category === scope).length;
        if (policyCount > 0) acc[scope] = policyCount;
        return acc;
      }, {}),
      frameworkCoverage: {
        frameworksMapped: frameworkMappingResult.frameworksMapped,
        complianceCoverage: frameworkMappingResult.complianceCoverage,
        controlsMapped: frameworkMappingResult.controlsMapped
      },
      maintenanceSchedule: {
        reviewCycle: policyReviewCycle,
        nextReviewDate: maintenanceScheduleResult.nextReviewDate,
        scheduledReviews: maintenanceScheduleResult.reviewSchedules
      },
      files: [
        { path: policyHandbookResult.handbookPath, format: 'pdf', label: 'Security Policy Handbook' },
        { path: masterPolicyResult.policyPath, format: 'markdown', label: 'Information Security Master Policy' },
        { path: frameworkMappingResult.mappingMatrixPath, format: 'xlsx', label: 'Framework Mapping Matrix' },
        { path: maintenanceScheduleResult.schedulePath, format: 'json', label: 'Policy Maintenance Schedule' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    organization,
    policiesCreated,
    proceduresCreated,
    standardsCreated,
    guidelinesCreated: guidelines.length,
    totalDocuments: policiesCreated + proceduresCreated + standardsCreated + guidelines.length,
    policies: policies.map(p => ({
      name: p.name,
      category: p.category,
      version: p.version,
      status: p.status,
      path: p.path
    })),
    procedures: procedures.map(p => ({
      name: p.name,
      category: p.category,
      relatedPolicy: p.relatedPolicy,
      path: p.path
    })),
    standards: standards.map(s => ({
      name: s.name,
      category: s.category,
      relatedPolicy: s.relatedPolicy,
      path: s.path
    })),
    guidelines: guidelines.map(g => ({
      name: g.name,
      category: g.category,
      path: g.path
    })),
    frameworkCoverage: {
      frameworks: frameworkMappingResult.frameworksMapped,
      complianceCoverage: frameworkMappingResult.complianceCoverage,
      controlsMapped: frameworkMappingResult.controlsMapped
    },
    approvalWorkflow: approvalWorkflow ? {
      workflowsCreated: phases.find(p => p.phase === 'approval-workflow')?.result.workflowsCreated || 0,
      approversAssigned: phases.find(p => p.phase === 'approval-workflow')?.result.approversAssigned || 0
    } : null,
    trainingProgram: policyTraining ? {
      trainingModules: phases.find(p => p.phase === 'training-program')?.result.trainingModules || 0,
      acknowledgmentForms: phases.find(p => p.phase === 'training-program')?.result.acknowledgmentForms || 0,
      estimatedDuration: phases.find(p => p.phase === 'training-program')?.result.estimatedDuration || 'N/A'
    } : null,
    maintenanceSchedule: {
      reviewCycle: policyReviewCycle,
      nextReviewDate: maintenanceScheduleResult.nextReviewDate,
      reviewSchedules: maintenanceScheduleResult.reviewSchedules
    },
    policyHandbook: {
      handbookPath: policyHandbookResult.handbookPath,
      pages: policyHandbookResult.handbookPages,
      languageVersions: policyHandbookResult.languageVersions
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/security-compliance/security-policies',
      processSlug: 'security-policies',
      category: 'security-compliance',
      specializationSlug: 'security-compliance',
      timestamp: startTime,
      policyScope,
      frameworks,
      industryVertical,
      organizationSize,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: Assess Policy Framework
export const assessPolicyFrameworkTask = defineTask('assess-policy-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Assess Policy Framework - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Policy Framework Architect',
      task: 'Assess current policy framework and identify gaps',
      context: {
        organization: args.organization,
        policyScope: args.policyScope,
        frameworks: args.frameworks,
        complianceRequirements: args.complianceRequirements,
        industryVertical: args.industryVertical,
        existingPolicies: args.existingPolicies,
        organizationSize: args.organizationSize,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Assess current policy framework state:',
        '   - Inventory existing policies (if any)',
        '   - Evaluate policy coverage and completeness',
        '   - Assess policy currency and relevance',
        '   - Review policy structure and organization',
        '2. Analyze framework requirements:',
        '   - Map ISO 27001 policy requirements (Annex A controls)',
        '   - Map NIST CSF policy categories (Identify, Protect, Detect, Respond, Recover)',
        '   - Map CIS Controls policy requirements',
        '   - Identify industry-specific policy requirements',
        '3. Evaluate compliance requirements:',
        '   - SOC 2 policy requirements (if applicable)',
        '   - GDPR policy requirements (if applicable)',
        '   - PCI DSS policy requirements (if applicable)',
        '   - HIPAA policy requirements (if applicable)',
        '   - Industry-specific compliance policies',
        '4. Identify policy gaps and priorities:',
        '   - Critical missing policies',
        '   - Outdated or incomplete policies',
        '   - Policy conflicts or inconsistencies',
        '   - Compliance-driven policy needs',
        '5. Determine required policy areas:',
        '   - Information security master policy',
        '   - Domain-specific policies (access control, data protection, etc.)',
        '   - Supporting procedures and standards',
        '   - Guidelines and best practices',
        '6. Assess organizational context:',
        '   - Organization size and structure',
        '   - Industry vertical considerations',
        '   - Risk appetite and tolerance',
        '   - Regulatory environment',
        '7. Create policy development roadmap',
        '8. Generate framework assessment report with gap analysis'
      ],
      outputFormat: 'JSON object with framework assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'policiesRequired', 'gapsIdentified', 'gaps', 'recommendations', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        currentState: {
          type: 'object',
          properties: {
            existingPolicies: { type: 'number' },
            policyAge: { type: 'string' },
            completeness: { type: 'number' },
            structure: { type: 'string' }
          }
        },
        policiesRequired: { type: 'number' },
        gapsIdentified: { type: 'number' },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              policyArea: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              description: { type: 'string' },
              framework: { type: 'string' },
              complianceImpact: { type: 'string' }
            }
          }
        },
        frameworkRequirements: {
          type: 'object',
          properties: {
            iso27001: { type: 'array' },
            nistCsf: { type: 'array' },
            cisControls: { type: 'array' }
          }
        },
        complianceMapping: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } },
        developmentRoadmap: {
          type: 'object',
          properties: {
            phases: { type: 'array' },
            estimatedTimeline: { type: 'string' }
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
  labels: ['agent', 'security-policies', 'framework-assessment']
}));

// Phase 2: Design Policy Structure
export const designPolicyStructureTask = defineTask('design-policy-structure', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Design Policy Structure - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Policy Architect',
      task: 'Design policy hierarchy, structure, and document taxonomy',
      context: args,
      instructions: [
        '1. Define policy hierarchy levels:',
        '   - Level 1: Master policies (high-level strategic direction)',
        '   - Level 2: Domain-specific policies (detailed requirements)',
        '   - Level 3: Standards (technical specifications and baselines)',
        '   - Level 4: Procedures (step-by-step instructions)',
        '   - Level 5: Guidelines (best practices and recommendations)',
        '2. Create document taxonomy and naming conventions:',
        '   - Policy naming standards',
        '   - Document numbering scheme',
        '   - Version control format',
        '   - File naming conventions',
        '3. Define standard policy structure:',
        '   - Purpose and scope',
        '   - Policy statement',
        '   - Roles and responsibilities',
        '   - Compliance and enforcement',
        '   - Review and revision',
        '   - Related documents',
        '   - Definitions and terms',
        '4. Design document templates:',
        '   - Policy template',
        '   - Procedure template',
        '   - Standard template',
        '   - Guideline template',
        '5. Create policy relationships and dependencies map',
        '6. Define document metadata requirements',
        '7. Establish document approval authority',
        '8. Generate policy structure documentation'
      ],
      outputFormat: 'JSON object with policy structure design'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'hierarchyLevels', 'documentTypes', 'structure', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        hierarchyLevels: { type: 'number' },
        documentTypes: { type: 'number' },
        structure: {
          type: 'object',
          properties: {
            hierarchy: { type: 'array' },
            taxonomy: { type: 'object' },
            namingConventions: { type: 'object' },
            templates: { type: 'array' }
          }
        },
        policyTemplate: { type: 'object' },
        procedureTemplate: { type: 'object' },
        standardTemplate: { type: 'object' },
        guidelineTemplate: { type: 'object' },
        relationshipMap: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-policies', 'policy-structure']
}));

// Phase 3: Create Master Security Policy
export const createMasterSecurityPolicyTask = defineTask('create-master-security-policy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Create Information Security Master Policy - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior Security Policy Writer',
      task: 'Create comprehensive Information Security Master Policy',
      context: args,
      instructions: [
        '1. Create master policy document structure:',
        '   - Executive Summary',
        '   - Policy Purpose and Objectives',
        '   - Scope and Applicability',
        '   - Information Security Principles',
        '   - Governance Structure',
        '   - Roles and Responsibilities',
        '   - Risk Management Approach',
        '   - Compliance and Legal Requirements',
        '   - Policy Enforcement',
        '   - Policy Review and Maintenance',
        '   - Related Policies and Documents',
        '2. Define information security principles:',
        '   - CIA triad (Confidentiality, Integrity, Availability)',
        '   - Defense in depth',
        '   - Least privilege',
        '   - Separation of duties',
        '   - Need to know',
        '   - Security by design',
        '3. Document governance structure:',
        '   - Information Security Steering Committee',
        '   - Chief Information Security Officer (CISO) role',
        '   - Security operations team',
        '   - Policy owners and administrators',
        '4. Define roles and responsibilities:',
        '   - Executive management',
        '   - CISO and security team',
        '   - IT operations',
        '   - Business unit owners',
        '   - All employees and contractors',
        '5. Document risk management approach:',
        '   - Risk assessment methodology',
        '   - Risk acceptance criteria',
        '   - Risk treatment strategies',
        '6. Address compliance requirements:',
        '   - Applicable regulations and standards',
        '   - Compliance monitoring',
        '   - Audit requirements',
        '7. Define policy enforcement and consequences',
        '8. Establish policy review cycle and version control',
        '9. Generate comprehensive master policy document'
      ],
      outputFormat: 'JSON object with master security policy'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'policy', 'policyPath', 'sectionsCount', 'wordCount', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        policy: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            version: { type: 'string' },
            category: { type: 'string' },
            status: { type: 'string' },
            effectiveDate: { type: 'string' },
            reviewDate: { type: 'string' },
            owner: { type: 'string' },
            approver: { type: 'string' }
          }
        },
        policyPath: { type: 'string' },
        sectionsCount: { type: 'number' },
        wordCount: { type: 'number' },
        securityPrinciples: { type: 'array' },
        governanceStructure: { type: 'object' },
        rolesResponsibilities: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-policies', 'master-policy']
}));

// Phase 4: Create Access Control Policies
export const createAccessControlPoliciesTask = defineTask('create-access-control-policies', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Create Access Control Policies - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Access Control Policy Specialist',
      task: 'Create comprehensive access control and identity management policies',
      context: args,
      instructions: [
        '1. Create Access Control Policy:',
        '   - Access control principles (least privilege, need to know)',
        '   - Access request and approval process',
        '   - User access provisioning',
        '   - Access review and recertification',
        '   - Access revocation',
        '   - Privileged access management',
        '2. Create Identity Management Policy:',
        '   - User identification and authentication',
        '   - Identity lifecycle management',
        '   - Single sign-on (SSO) requirements',
        '   - Multi-factor authentication (MFA)',
        '   - Password management',
        '   - Account management',
        '3. Create Authentication Policy/Standard:',
        '   - Password complexity requirements',
        '   - Password rotation policy',
        '   - Authentication methods',
        '   - Session management',
        '   - Failed login attempts',
        '4. Create Privileged Access Management Policy:',
        '   - Administrative account management',
        '   - Privileged session monitoring',
        '   - Just-in-time access',
        '   - Break-glass procedures',
        '5. Create supporting procedures:',
        '   - User onboarding procedure',
        '   - User offboarding procedure',
        '   - Access request procedure',
        '   - Access review procedure',
        '   - Password reset procedure',
        '6. Create access control standards:',
        '   - Role-based access control (RBAC) standard',
        '   - Network access control standard',
        '   - Application access control standard',
        '7. Generate access control policy package'
      ],
      outputFormat: 'JSON object with access control policies'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'policies', 'procedures', 'standards', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        policies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              category: { type: 'string' },
              version: { type: 'string' },
              status: { type: 'string' },
              path: { type: 'string' }
            }
          }
        },
        procedures: { type: 'array' },
        standards: { type: 'array' },
        accessControlPrinciples: { type: 'array' },
        authenticationRequirements: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-policies', 'access-control']
}));

// Phase 5: Create Data Protection Policies
export const createDataProtectionPoliciesTask = defineTask('create-data-protection-policies', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Create Data Protection Policies - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Protection Policy Specialist',
      task: 'Create comprehensive data protection and privacy policies',
      context: args,
      instructions: [
        '1. Create Data Protection Policy:',
        '   - Data classification scheme',
        '   - Data handling requirements',
        '   - Data retention and disposal',
        '   - Data encryption requirements',
        '   - Data loss prevention (DLP)',
        '2. Create Privacy Policy:',
        '   - Personal data collection principles',
        '   - Consent management',
        '   - Data subject rights',
        '   - Privacy by design',
        '   - Cross-border data transfers',
        '3. Create Data Classification Policy/Standard:',
        '   - Classification levels (Public, Internal, Confidential, Restricted)',
        '   - Classification criteria',
        '   - Labeling and marking requirements',
        '   - Handling requirements by classification',
        '4. Create Data Retention Policy:',
        '   - Retention periods by data type',
        '   - Retention justification',
        '   - Disposal methods',
        '   - Legal hold procedures',
        '5. Create Encryption Policy/Standard:',
        '   - Data at rest encryption',
        '   - Data in transit encryption',
        '   - Encryption algorithms and key lengths',
        '   - Key management requirements',
        '6. Create supporting procedures:',
        '   - Data classification procedure',
        '   - Data disposal procedure',
        '   - Data breach response procedure',
        '   - Privacy impact assessment procedure',
        '7. Address GDPR requirements (if applicable)',
        '8. Generate data protection policy package'
      ],
      outputFormat: 'JSON object with data protection policies'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'policies', 'procedures', 'standards', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        policies: { type: 'array' },
        procedures: { type: 'array' },
        standards: { type: 'array' },
        dataClassificationLevels: { type: 'array' },
        encryptionRequirements: { type: 'object' },
        retentionSchedule: { type: 'object' },
        gdprCompliance: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-policies', 'data-protection']
}));

// Phase 6: Create Incident Response Policies
export const createIncidentResponsePoliciesTask = defineTask('create-incident-response-policies', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Create Incident Response Policies - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Incident Response Policy Specialist',
      task: 'Create comprehensive incident response and business continuity policies',
      context: args,
      instructions: [
        '1. Create Security Incident Response Policy:',
        '   - Incident definition and classification',
        '   - Incident response team and roles',
        '   - Incident response phases (NIST framework)',
        '   - Incident reporting requirements',
        '   - Communication protocols',
        '   - Post-incident review',
        '2. Create Business Continuity Policy:',
        '   - Business continuity objectives',
        '   - Critical business functions',
        '   - Recovery time objectives (RTO)',
        '   - Recovery point objectives (RPO)',
        '   - Business continuity team',
        '3. Create Disaster Recovery Policy:',
        '   - Disaster scenarios',
        '   - Recovery strategies',
        '   - Disaster recovery team',
        '   - Testing and maintenance',
        '4. Create supporting procedures:',
        '   - Incident detection and triage procedure',
        '   - Incident containment procedure',
        '   - Incident eradication procedure',
        '   - System recovery procedure',
        '   - Business continuity plan activation procedure',
        '   - Disaster recovery procedure',
        '5. Define incident severity levels and escalation',
        '6. Create incident communication templates',
        '7. Document testing and exercise requirements',
        '8. Generate incident response policy package'
      ],
      outputFormat: 'JSON object with incident response policies'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'policies', 'procedures', 'standards', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        policies: { type: 'array' },
        procedures: { type: 'array' },
        standards: { type: 'array' },
        incidentCategories: { type: 'array' },
        severityLevels: { type: 'array' },
        responseTeam: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-policies', 'incident-response']
}));

// Phase 7: Create Acceptable Use Policies
export const createAcceptableUsePoliciesTask = defineTask('create-acceptable-use-policies', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Create Acceptable Use Policies - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Acceptable Use Policy Specialist',
      task: 'Create acceptable use and security awareness policies',
      context: args,
      instructions: [
        '1. Create Acceptable Use Policy:',
        '   - Authorized use of IT resources',
        '   - Prohibited activities',
        '   - Personal use guidelines',
        '   - Email and communication standards',
        '   - Internet and web browsing',
        '   - Social media use',
        '   - Software installation restrictions',
        '   - Bring Your Own Device (BYOD) guidelines',
        '2. Create Email and Communication Policy:',
        '   - Email usage standards',
        '   - Email retention',
        '   - Confidential information in email',
        '   - External communications',
        '   - Instant messaging and collaboration tools',
        '3. Create Mobile Device Policy:',
        '   - Device security requirements',
        '   - Mobile device management (MDM)',
        '   - Lost or stolen device reporting',
        '   - Personal vs. corporate devices',
        '4. Create Social Media Policy:',
        '   - Corporate social media guidelines',
        '   - Personal social media use',
        '   - Disclosure requirements',
        '   - Confidential information protection',
        '5. Create Security Awareness Policy:',
        '   - Employee security responsibilities',
        '   - Security training requirements',
        '   - Phishing awareness',
        '   - Social engineering awareness',
        '6. Create supporting guidelines:',
        '   - Clean desk/clear screen guideline',
        '   - Password management guideline',
        '   - Secure remote work guideline',
        '7. Define consequences for policy violations',
        '8. Generate acceptable use policy package'
      ],
      outputFormat: 'JSON object with acceptable use policies'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'policies', 'procedures', 'guidelines', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        policies: { type: 'array' },
        procedures: { type: 'array' },
        guidelines: { type: 'array' },
        prohibitedActivities: { type: 'array' },
        securityResponsibilities: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-policies', 'acceptable-use']
}));

// Phase 8: Create Asset Management Policies
export const createAssetManagementPoliciesTask = defineTask('create-asset-management-policies', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Create Asset Management Policies - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Asset Management Policy Specialist',
      task: 'Create asset management and physical security policies',
      context: args,
      instructions: [
        '1. Create Asset Management Policy:',
        '   - Asset inventory requirements',
        '   - Asset classification',
        '   - Asset ownership and custodianship',
        '   - Asset lifecycle management',
        '   - Asset disposal',
        '2. Create Physical Security Policy:',
        '   - Facility access controls',
        '   - Visitor management',
        '   - Security zones',
        '   - Environmental controls',
        '   - Equipment security',
        '   - Media handling and storage',
        '3. Create Media Handling Policy:',
        '   - Media classification',
        '   - Media storage and protection',
        '   - Media transportation',
        '   - Media sanitization and disposal',
        '4. Create supporting procedures and standards',
        '5. Generate asset management policy package'
      ],
      outputFormat: 'JSON object with asset management policies'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'policies', 'procedures', 'standards', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        policies: { type: 'array' },
        procedures: { type: 'array' },
        standards: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-policies', 'asset-management']
}));

// Phase 9: Create Vendor Management Policies
export const createVendorManagementPoliciesTask = defineTask('create-vendor-management-policies', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Create Vendor Management Policies - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Vendor Management Policy Specialist',
      task: 'Create vendor and third-party management policies',
      context: args,
      instructions: [
        '1. Create Vendor Management Policy',
        '2. Create Third-Party Risk Management Policy',
        '3. Create vendor security assessment procedures',
        '4. Generate vendor management policy package'
      ],
      outputFormat: 'JSON object with vendor management policies'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'policies', 'procedures', 'standards', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        policies: { type: 'array' },
        procedures: { type: 'array' },
        standards: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-policies', 'vendor-management']
}));

// Phase 10: Create Change Management Policies
export const createChangeManagementPoliciesTask = defineTask('create-change-management-policies', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Create Change Management Policies - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Change Management Policy Specialist',
      task: 'Create change management and system development policies',
      context: args,
      instructions: [
        '1. Create Change Management Policy',
        '2. Create Secure Software Development Lifecycle (SDLC) Policy',
        '3. Create supporting procedures',
        '4. Generate change management policy package'
      ],
      outputFormat: 'JSON object with change management policies'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'policies', 'procedures', 'standards', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        policies: { type: 'array' },
        procedures: { type: 'array' },
        standards: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-policies', 'change-management']
}));

// Phase 11: Create Cryptography Policies
export const createCryptographyPoliciesTask = defineTask('create-cryptography-policies', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Create Cryptography Policies - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Cryptography Policy Specialist',
      task: 'Create cryptography and encryption policies',
      context: args,
      instructions: [
        '1. Create Cryptography Policy',
        '2. Create Key Management Standard',
        '3. Create supporting procedures',
        '4. Generate cryptography policy package'
      ],
      outputFormat: 'JSON object with cryptography policies'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'policies', 'procedures', 'standards', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        policies: { type: 'array' },
        procedures: { type: 'array' },
        standards: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-policies', 'cryptography']
}));

// Phase 12: Create Cloud Security Policies
export const createCloudSecurityPoliciesTask = defineTask('create-cloud-security-policies', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Create Cloud Security Policies - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Cloud Security Policy Specialist',
      task: 'Create cloud security and remote work policies',
      context: args,
      instructions: [
        '1. Create Cloud Security Policy',
        '2. Create Remote Work Policy',
        '3. Create supporting procedures and standards',
        '4. Generate cloud security policy package'
      ],
      outputFormat: 'JSON object with cloud security policies'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'policies', 'procedures', 'standards', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        policies: { type: 'array' },
        procedures: { type: 'array' },
        standards: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-policies', 'cloud-security']
}));

// Phase 13: Setup Approval Workflow
export const setupApprovalWorkflowTask = defineTask('setup-approval-workflow', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 13: Setup Approval Workflow - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Policy Governance Specialist',
      task: 'Setup policy approval workflow and version control',
      context: args,
      instructions: [
        '1. Design approval workflow',
        '2. Assign policy owners and approvers',
        '3. Setup version control system',
        '4. Create approval tracking mechanism',
        '5. Generate workflow documentation'
      ],
      outputFormat: 'JSON object with approval workflow'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'workflowsCreated', 'approversAssigned', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        workflowsCreated: { type: 'number' },
        approversAssigned: { type: 'number' },
        versionControl: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-policies', 'approval-workflow']
}));

// Phase 14: Create Training Program
export const createTrainingProgramTask = defineTask('create-training-program', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 14: Create Training Program - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Training Specialist',
      task: 'Create policy acknowledgment and training program',
      context: args,
      instructions: [
        '1. Design training curriculum',
        '2. Create training modules by policy area',
        '3. Create policy acknowledgment forms',
        '4. Design training delivery methods',
        '5. Create training tracking system',
        '6. Generate training materials'
      ],
      outputFormat: 'JSON object with training program'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'trainingModules', 'acknowledgmentForms', 'estimatedDuration', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        trainingModules: { type: 'number' },
        acknowledgmentForms: { type: 'number' },
        estimatedDuration: { type: 'string' },
        deliveryMethods: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-policies', 'training-program']
}));

// Phase 15: Create Maintenance Schedule
export const createMaintenanceScheduleTask = defineTask('create-maintenance-schedule', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 15: Create Maintenance Schedule - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Policy Lifecycle Management Specialist',
      task: 'Create policy review and maintenance schedule',
      context: args,
      instructions: [
        '1. Create review schedule for all policies',
        '2. Assign review owners',
        '3. Define review triggers',
        '4. Create maintenance tracking system',
        '5. Generate maintenance schedule'
      ],
      outputFormat: 'JSON object with maintenance schedule'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'reviewSchedules', 'nextReviewDate', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        reviewSchedules: { type: 'number' },
        nextReviewDate: { type: 'string' },
        reviewOwners: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-policies', 'maintenance-schedule']
}));

// Phase 16: Map Policy to Frameworks
export const mapPolicyToFrameworksTask = defineTask('map-policy-to-frameworks', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 16: Map Policy to Frameworks - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Framework Mapping Specialist',
      task: 'Map policies to security frameworks and compliance requirements',
      context: args,
      instructions: [
        '1. Map policies to ISO 27001 controls',
        '2. Map policies to NIST CSF categories',
        '3. Map policies to CIS Controls',
        '4. Map policies to compliance requirements',
        '5. Calculate coverage percentages',
        '6. Generate mapping matrix'
      ],
      outputFormat: 'JSON object with framework mappings'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'frameworksMapped', 'complianceCoverage', 'controlsMapped', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        frameworksMapped: { type: 'array' },
        complianceCoverage: { type: 'number' },
        controlsMapped: { type: 'number' },
        mappingMatrixPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-policies', 'framework-mapping']
}));

// Phase 17: Create Policy Handbook
export const createPolicyHandbookTask = defineTask('create-policy-handbook', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 17: Create Policy Handbook - ${args.organization}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Policy Documentation Specialist',
      task: 'Create comprehensive policy handbook and executive summary',
      context: args,
      instructions: [
        '1. Compile all policies into handbook',
        '2. Create table of contents and index',
        '3. Create executive summary',
        '4. Generate cross-reference matrix',
        '5. Create multi-language versions if required',
        '6. Generate final policy handbook'
      ],
      outputFormat: 'JSON object with policy handbook'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'handbookPath', 'handbookPages', 'languageVersions', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        handbookPath: { type: 'string' },
        handbookPages: { type: 'number' },
        languageVersions: { type: 'number' },
        executiveSummaryPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-policies', 'policy-handbook']
}));
