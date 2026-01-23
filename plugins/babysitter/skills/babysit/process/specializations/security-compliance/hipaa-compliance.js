/**
 * @process security-compliance/hipaa-compliance
 * @description HIPAA Compliance Framework - Comprehensive framework for implementing and validating HIPAA compliance
 * covering Protected Health Information (PHI) protection, administrative safeguards, physical safeguards, technical safeguards,
 * Business Associate Agreement (BAA) management, risk analysis, and security rule compliance for healthcare organizations.
 * @inputs { scope?: string, entities?: array, assessmentType?: string, includeBAA?: boolean, existingControls?: object, riskAnalysisRequired?: boolean }
 * @outputs { success: boolean, complianceScore: number, gaps: array, safeguards: object, riskAnalysis: object, baaStatus: object, remediationPlan: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/security-compliance/hipaa-compliance', {
 *   scope: 'full-assessment',
 *   entities: ['covered-entity', 'business-associate'],
 *   assessmentType: 'comprehensive',
 *   includeBAA: true,
 *   existingControls: {
 *     encryption: true,
 *     accessControls: true,
 *     auditLogs: true
 *   },
 *   riskAnalysisRequired: true,
 *   complianceFrameworks: ['HIPAA-Security-Rule', 'HIPAA-Privacy-Rule', 'HITECH'],
 *   generateDocumentation: true
 * });
 *
 * @references
 * - HIPAA Security Rule: https://www.hhs.gov/hipaa/for-professionals/security/index.html
 * - HIPAA Privacy Rule: https://www.hhs.gov/hipaa/for-professionals/privacy/index.html
 * - HITECH Act: https://www.hhs.gov/hipaa/for-professionals/special-topics/hitech-act-enforcement-interim-final-rule/index.html
 * - NIST HIPAA Security Rule Toolkit: https://csrc.nist.gov/projects/hipaa-security-rule-toolkit
 * - OCR Audit Protocol: https://www.hhs.gov/hipaa/for-professionals/compliance-enforcement/audit/protocol/index.html
 * - HHS Breach Notification Rule: https://www.hhs.gov/hipaa/for-professionals/breach-notification/index.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    scope = 'full-assessment',
    entities = ['covered-entity'],
    assessmentType = 'comprehensive',
    includeBAA = false,
    existingControls = {},
    riskAnalysisRequired = true,
    complianceFrameworks = ['HIPAA-Security-Rule', 'HIPAA-Privacy-Rule'],
    generateDocumentation = true,
    outputDir = 'hipaa-compliance-output',
    organizationName = 'Organization',
    phiSystems = [],
    breachProtocols = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const complianceGaps = [];
  const remediationActions = [];

  ctx.log('info', `Starting HIPAA Compliance Assessment for ${organizationName}`);
  ctx.log('info', `Scope: ${scope}, Entity Types: ${entities.join(', ')}, Risk Analysis: ${riskAnalysisRequired}`);

  // Task 1: Initial Scope and Requirements Analysis
  ctx.log('info', 'Task 1: Analyzing HIPAA compliance scope and requirements');
  const scopeAnalysis = await ctx.task(scopeRequirementsTask, {
    scope,
    entities,
    assessmentType,
    complianceFrameworks,
    organizationName,
    phiSystems,
    outputDir
  });

  if (!scopeAnalysis.success) {
    return {
      success: false,
      error: 'Scope and requirements analysis failed',
      details: scopeAnalysis,
      metadata: { processId: 'security-compliance/hipaa-compliance', timestamp: startTime }
    };
  }

  artifacts.push(...scopeAnalysis.artifacts);
  const applicableRequirements = scopeAnalysis.applicableRequirements;

  // Task 2: PHI Inventory and Data Flow Analysis
  ctx.log('info', 'Task 2: Conducting PHI inventory and data flow analysis');
  const phiInventory = await ctx.task(phiInventoryTask, {
    phiSystems,
    organizationName,
    entities,
    outputDir
  });

  artifacts.push(...phiInventory.artifacts);
  const phiDataFlows = phiInventory.dataFlows;

  // Task 3: Administrative Safeguards Assessment
  ctx.log('info', 'Task 3: Assessing HIPAA Administrative Safeguards');
  const administrativeSafeguards = await ctx.task(administrativeSafeguardsTask, {
    organizationName,
    existingControls,
    applicableRequirements,
    outputDir
  });

  artifacts.push(...administrativeSafeguards.artifacts);
  complianceGaps.push(...administrativeSafeguards.gaps);

  // Task 4: Physical Safeguards Assessment
  ctx.log('info', 'Task 4: Assessing HIPAA Physical Safeguards');
  const physicalSafeguards = await ctx.task(physicalSafeguardsTask, {
    organizationName,
    phiSystems,
    existingControls,
    applicableRequirements,
    outputDir
  });

  artifacts.push(...physicalSafeguards.artifacts);
  complianceGaps.push(...physicalSafeguards.gaps);

  // Task 5: Technical Safeguards Assessment
  ctx.log('info', 'Task 5: Assessing HIPAA Technical Safeguards');
  const technicalSafeguards = await ctx.task(technicalSafeguardsTask, {
    organizationName,
    phiSystems,
    phiDataFlows,
    existingControls,
    applicableRequirements,
    outputDir
  });

  artifacts.push(...technicalSafeguards.artifacts);
  complianceGaps.push(...technicalSafeguards.gaps);

  // Task 6: Security Risk Analysis (Required by HIPAA)
  let riskAnalysisResults = null;
  if (riskAnalysisRequired) {
    ctx.log('info', 'Task 6: Conducting HIPAA Security Risk Analysis');
    riskAnalysisResults = await ctx.task(securityRiskAnalysisTask, {
      organizationName,
      phiSystems,
      phiDataFlows,
      administrativeSafeguards,
      physicalSafeguards,
      technicalSafeguards,
      outputDir
    });

    artifacts.push(...riskAnalysisResults.artifacts);
    complianceGaps.push(...riskAnalysisResults.identifiedRisks);
  }

  // Task 7: Business Associate Agreement (BAA) Assessment
  let baaAssessment = null;
  if (includeBAA || entities.includes('business-associate')) {
    ctx.log('info', 'Task 7: Assessing Business Associate Agreement compliance');
    baaAssessment = await ctx.task(baaManagementTask, {
      organizationName,
      entities,
      phiSystems,
      outputDir
    });

    artifacts.push(...baaAssessment.artifacts);
    complianceGaps.push(...baaAssessment.gaps);
  }

  // Task 8: Privacy Rule Compliance Assessment
  ctx.log('info', 'Task 8: Assessing HIPAA Privacy Rule compliance');
  const privacyRuleAssessment = await ctx.task(privacyRuleTask, {
    organizationName,
    entities,
    phiSystems,
    phiDataFlows,
    applicableRequirements,
    outputDir
  });

  artifacts.push(...privacyRuleAssessment.artifacts);
  complianceGaps.push(...privacyRuleAssessment.gaps);

  // Task 9: Breach Notification Rule Compliance
  if (breachProtocols) {
    ctx.log('info', 'Task 9: Assessing Breach Notification Rule compliance');
    const breachNotificationAssessment = await ctx.task(breachNotificationTask, {
      organizationName,
      entities,
      phiSystems,
      outputDir
    });

    artifacts.push(...breachNotificationAssessment.artifacts);
    complianceGaps.push(...breachNotificationAssessment.gaps);
  }

  // Task 10: HITECH Act Compliance Assessment
  if (complianceFrameworks.includes('HITECH')) {
    ctx.log('info', 'Task 10: Assessing HITECH Act compliance');
    const hitechAssessment = await ctx.task(hitechComplianceTask, {
      organizationName,
      entities,
      riskAnalysisResults,
      breachProtocols,
      outputDir
    });

    artifacts.push(...hitechAssessment.artifacts);
    complianceGaps.push(...hitechAssessment.gaps);
  }

  // Task 11: Policies and Procedures Review
  ctx.log('info', 'Task 11: Reviewing HIPAA policies and procedures');
  const policiesReview = await ctx.task(policiesProceduresTask, {
    organizationName,
    applicableRequirements,
    administrativeSafeguards,
    physicalSafeguards,
    technicalSafeguards,
    outputDir
  });

  artifacts.push(...policiesReview.artifacts);
  complianceGaps.push(...policiesReview.gaps);

  // Task 12: Training and Awareness Assessment
  ctx.log('info', 'Task 12: Assessing workforce training and awareness');
  const trainingAssessment = await ctx.task(trainingAwarenessTask, {
    organizationName,
    entities,
    outputDir
  });

  artifacts.push(...trainingAssessment.artifacts);
  complianceGaps.push(...trainingAssessment.gaps);

  // Task 13: Incident Response and Contingency Planning
  ctx.log('info', 'Task 13: Assessing incident response and contingency plans');
  const incidentResponseAssessment = await ctx.task(incidentResponseContingencyTask, {
    organizationName,
    phiSystems,
    breachProtocols,
    outputDir
  });

  artifacts.push(...incidentResponseAssessment.artifacts);
  complianceGaps.push(...incidentResponseAssessment.gaps);

  // Task 14: Compliance Score Calculation
  ctx.log('info', 'Task 14: Calculating overall HIPAA compliance score');
  const complianceScoring = await ctx.task(complianceScoringTask, {
    administrativeSafeguards,
    physicalSafeguards,
    technicalSafeguards,
    riskAnalysisResults,
    baaAssessment,
    privacyRuleAssessment,
    policiesReview,
    trainingAssessment,
    incidentResponseAssessment,
    complianceGaps,
    outputDir
  });

  artifacts.push(...complianceScoring.artifacts);
  const complianceScore = complianceScoring.score;

  // Task 15: Gap Analysis and Prioritization
  ctx.log('info', 'Task 15: Conducting gap analysis and prioritization');
  const gapAnalysis = await ctx.task(gapAnalysisPrioritizationTask, {
    complianceGaps,
    complianceScore,
    riskAnalysisResults,
    applicableRequirements,
    outputDir
  });

  artifacts.push(...gapAnalysis.artifacts);

  // Task 16: Remediation Plan Generation
  ctx.log('info', 'Task 16: Generating HIPAA compliance remediation plan');
  const remediationPlan = await ctx.task(remediationPlanTask, {
    gapAnalysis,
    complianceGaps,
    riskAnalysisResults,
    complianceScore,
    organizationName,
    outputDir
  });

  artifacts.push(...remediationPlan.artifacts);

  // Task 17: Comprehensive Compliance Report
  ctx.log('info', 'Task 17: Generating comprehensive HIPAA compliance report');
  const complianceReport = await ctx.task(complianceReportTask, {
    organizationName,
    scope,
    entities,
    complianceScore,
    phiInventory,
    administrativeSafeguards,
    physicalSafeguards,
    technicalSafeguards,
    riskAnalysisResults,
    baaAssessment,
    privacyRuleAssessment,
    policiesReview,
    trainingAssessment,
    incidentResponseAssessment,
    gapAnalysis,
    remediationPlan,
    complianceFrameworks,
    outputDir
  });

  artifacts.push(...complianceReport.artifacts);

  // Breakpoint: Review compliance findings
  await ctx.breakpoint({
    question: `HIPAA Compliance Assessment complete for ${organizationName}. Compliance Score: ${complianceScore}/100. ${complianceGaps.length} gaps identified. Review findings and remediation plan?`,
    title: 'HIPAA Compliance Assessment Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        complianceScore,
        totalGaps: complianceGaps.length,
        criticalGaps: complianceGaps.filter(g => g.severity === 'critical').length,
        highGaps: complianceGaps.filter(g => g.severity === 'high').length,
        mediumGaps: complianceGaps.filter(g => g.severity === 'medium').length,
        administrativeSafeguardsScore: administrativeSafeguards.score,
        physicalSafeguardsScore: physicalSafeguards.score,
        technicalSafeguardsScore: technicalSafeguards.score,
        riskAnalysisComplete: riskAnalysisRequired && riskAnalysisResults !== null,
        baaCompliance: baaAssessment ? baaAssessment.compliant : 'N/A',
        privacyRuleCompliance: privacyRuleAssessment.compliant
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    complianceScore,
    overallCompliance: complianceScore >= 80 ? 'compliant' : 'non-compliant',
    gaps: complianceGaps,
    safeguards: {
      administrative: {
        score: administrativeSafeguards.score,
        compliant: administrativeSafeguards.compliant,
        findings: administrativeSafeguards.findings,
        gaps: administrativeSafeguards.gaps
      },
      physical: {
        score: physicalSafeguards.score,
        compliant: physicalSafeguards.compliant,
        findings: physicalSafeguards.findings,
        gaps: physicalSafeguards.gaps
      },
      technical: {
        score: technicalSafeguards.score,
        compliant: technicalSafeguards.compliant,
        findings: technicalSafeguards.findings,
        gaps: technicalSafeguards.gaps
      }
    },
    riskAnalysis: riskAnalysisResults ? {
      completed: true,
      highRisks: riskAnalysisResults.highRisks,
      mediumRisks: riskAnalysisResults.mediumRisks,
      lowRisks: riskAnalysisResults.lowRisks,
      threatScenarios: riskAnalysisResults.threatScenarios,
      riskReportPath: riskAnalysisResults.reportPath
    } : { completed: false },
    baaStatus: baaAssessment ? {
      compliant: baaAssessment.compliant,
      activeBAAs: baaAssessment.activeBAAs,
      missingBAAs: baaAssessment.missingBAAs,
      expiringBAAs: baaAssessment.expiringBAAs,
      gaps: baaAssessment.gaps
    } : null,
    privacyRule: {
      compliant: privacyRuleAssessment.compliant,
      score: privacyRuleAssessment.score,
      findings: privacyRuleAssessment.findings
    },
    policies: {
      compliant: policiesReview.compliant,
      existingPolicies: policiesReview.existingPolicies,
      missingPolicies: policiesReview.missingPolicies,
      outdatedPolicies: policiesReview.outdatedPolicies
    },
    training: {
      compliant: trainingAssessment.compliant,
      trainedStaff: trainingAssessment.trainedStaff,
      totalStaff: trainingAssessment.totalStaff,
      trainingGaps: trainingAssessment.gaps
    },
    incidentResponse: {
      compliant: incidentResponseAssessment.compliant,
      hasIncidentPlan: incidentResponseAssessment.hasIncidentPlan,
      hasBreachProtocol: incidentResponseAssessment.hasBreachProtocol,
      hasContingencyPlan: incidentResponseAssessment.hasContingencyPlan
    },
    phiProtection: {
      phiSystemsInventoried: phiInventory.systemsCount,
      dataFlowsMapped: phiInventory.dataFlowsCount,
      encryptionStatus: technicalSafeguards.encryptionStatus,
      accessControlsStatus: technicalSafeguards.accessControlsStatus
    },
    remediationPlan: {
      totalActions: remediationPlan.totalActions,
      criticalActions: remediationPlan.criticalActions,
      highPriorityActions: remediationPlan.highPriorityActions,
      estimatedEffort: remediationPlan.estimatedEffort,
      estimatedCost: remediationPlan.estimatedCost,
      prioritizedActions: remediationPlan.prioritizedActions,
      timeline: remediationPlan.timeline
    },
    artifacts,
    duration,
    metadata: {
      processId: 'security-compliance/hipaa-compliance',
      timestamp: startTime,
      organizationName,
      scope,
      entities,
      complianceFrameworks,
      outputDir
    }
  };
}

// Task 1: Scope and Requirements Analysis
export const scopeRequirementsTask = defineTask('scope-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze HIPAA compliance scope and requirements',
  agent: {
    name: 'hipaa-analyst',
    prompt: {
      role: 'HIPAA compliance analyst',
      task: 'Analyze organization scope and determine applicable HIPAA requirements',
      context: args,
      instructions: [
        'Determine if organization is a Covered Entity, Business Associate, or both',
        'Identify applicable HIPAA rules (Security Rule, Privacy Rule, Breach Notification)',
        'Assess if HITECH Act requirements apply',
        'Identify PHI systems and applications in scope',
        'Determine required vs. addressable implementation specifications',
        'Map organizational functions to HIPAA requirements',
        'Identify exemptions or special circumstances',
        'Document scope boundaries and exclusions',
        'Create comprehensive requirements matrix',
        'Save scope analysis to output directory'
      ],
      outputFormat: 'JSON with success, applicableRequirements, entityTypes, phiSystems, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'applicableRequirements', 'entityTypes', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        applicableRequirements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rule: { type: 'string' },
              standard: { type: 'string' },
              implementation: { type: 'string', enum: ['required', 'addressable'] },
              description: { type: 'string' }
            }
          }
        },
        entityTypes: { type: 'array', items: { type: 'string' } },
        inScopeSystems: { type: 'array', items: { type: 'string' } },
        outOfScopeSystems: { type: 'array', items: { type: 'string' } },
        specialCircumstances: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'hipaa', 'scope-analysis']
}));

// Task 2: PHI Inventory and Data Flow Analysis
export const phiInventoryTask = defineTask('phi-inventory', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct PHI inventory and data flow analysis',
  agent: {
    name: 'data-flow-analyst',
    prompt: {
      role: 'healthcare data security specialist',
      task: 'Create comprehensive inventory of PHI and map data flows',
      context: args,
      instructions: [
        'Identify all systems that create, receive, maintain, or transmit PHI',
        'Document PHI data elements (demographics, diagnoses, treatment, payment)',
        'Map PHI data flows between systems and with third parties',
        'Identify PHI storage locations (databases, file servers, cloud)',
        'Document PHI in motion (networks, APIs, integrations)',
        'Identify PHI at rest (backups, archives, mobile devices)',
        'Map third-party PHI sharing and Business Associates',
        'Document PHI retention and disposal processes',
        'Classify PHI sensitivity levels',
        'Create data flow diagrams',
        'Save PHI inventory and data flows to output directory'
      ],
      outputFormat: 'JSON with systems, dataFlows, storage locations, third parties, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['systemsCount', 'dataFlows', 'dataFlowsCount', 'artifacts'],
      properties: {
        systemsCount: { type: 'number' },
        phiSystems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              phiElements: { type: 'array', items: { type: 'string' } },
              location: { type: 'string' },
              classification: { type: 'string' }
            }
          }
        },
        dataFlows: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              from: { type: 'string' },
              to: { type: 'string' },
              phiType: { type: 'string' },
              method: { type: 'string' },
              encrypted: { type: 'boolean' }
            }
          }
        },
        dataFlowsCount: { type: 'number' },
        storageLocations: { type: 'array' },
        thirdParties: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'hipaa', 'phi-inventory', 'data-flow']
}));

// Task 3: Administrative Safeguards Assessment
export const administrativeSafeguardsTask = defineTask('administrative-safeguards', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess HIPAA Administrative Safeguards',
  agent: {
    name: 'administrative-safeguards-auditor',
    prompt: {
      role: 'HIPAA administrative safeguards specialist',
      task: 'Assess compliance with HIPAA Administrative Safeguards',
      context: args,
      instructions: [
        'Security Management Process (§164.308(a)(1)): Risk analysis, risk management, sanction policy, information system activity review',
        'Assigned Security Responsibility (§164.308(a)(2)): Designated security official',
        'Workforce Security (§164.308(a)(3)): Authorization, workforce clearance, termination procedures',
        'Information Access Management (§164.308(a)(4)): Access authorization, access establishment and modification',
        'Security Awareness and Training (§164.308(a)(5)): Security reminders, protection from malicious software, log-in monitoring, password management',
        'Security Incident Procedures (§164.308(a)(6)): Response and reporting',
        'Contingency Plan (§164.308(a)(7)): Data backup, disaster recovery, emergency mode operation, testing, applications and data criticality analysis',
        'Evaluation (§164.308(a)(8)): Periodic technical and non-technical evaluation',
        'Business Associate Contracts (§164.308(b)(1)): Written contract or other arrangement',
        'Assess implementation of each standard',
        'Identify gaps and non-compliance areas',
        'Document findings with evidence',
        'Calculate administrative safeguards compliance score',
        'Save assessment report to output directory'
      ],
      outputFormat: 'JSON with score, compliant, findings, gaps, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'compliant', 'findings', 'gaps', 'artifacts'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        compliant: { type: 'boolean' },
        findings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              standard: { type: 'string' },
              status: { type: 'string', enum: ['compliant', 'partially-compliant', 'non-compliant', 'not-assessed'] },
              evidence: { type: 'string' },
              notes: { type: 'string' }
            }
          }
        },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              standard: { type: 'string' },
              gap: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              remediation: { type: 'string' }
            }
          }
        },
        strengths: { type: 'array', items: { type: 'string' } },
        weaknesses: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'hipaa', 'administrative-safeguards']
}));

// Task 4: Physical Safeguards Assessment
export const physicalSafeguardsTask = defineTask('physical-safeguards', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess HIPAA Physical Safeguards',
  agent: {
    name: 'physical-safeguards-auditor',
    prompt: {
      role: 'HIPAA physical security specialist',
      task: 'Assess compliance with HIPAA Physical Safeguards',
      context: args,
      instructions: [
        'Facility Access Controls (§164.310(a)(1)): Contingency operations, facility security plan, access control and validation procedures, maintenance records',
        'Workstation Use (§164.310(b)): Proper functions and physical attributes of workstations',
        'Workstation Security (§164.310(c)): Physical safeguards for workstations that access PHI',
        'Device and Media Controls (§164.310(d)(1)): Disposal, media re-use, accountability, data backup and storage',
        'Assess physical access controls to facilities with PHI',
        'Review visitor logs and access badge systems',
        'Assess workstation positioning and privacy',
        'Review mobile device security',
        'Assess secure disposal procedures',
        'Review media handling and tracking',
        'Document findings with evidence',
        'Calculate physical safeguards compliance score',
        'Save assessment report to output directory'
      ],
      outputFormat: 'JSON with score, compliant, findings, gaps, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'compliant', 'findings', 'gaps', 'artifacts'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        compliant: { type: 'boolean' },
        findings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              standard: { type: 'string' },
              status: { type: 'string', enum: ['compliant', 'partially-compliant', 'non-compliant', 'not-assessed'] },
              evidence: { type: 'string' },
              notes: { type: 'string' }
            }
          }
        },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              standard: { type: 'string' },
              gap: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              remediation: { type: 'string' }
            }
          }
        },
        facilityAssessment: { type: 'object' },
        workstationAssessment: { type: 'object' },
        mediaControlsAssessment: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'hipaa', 'physical-safeguards']
}));

// Task 5: Technical Safeguards Assessment
export const technicalSafeguardsTask = defineTask('technical-safeguards', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess HIPAA Technical Safeguards',
  agent: {
    name: 'technical-safeguards-auditor',
    prompt: {
      role: 'HIPAA technical security specialist',
      task: 'Assess compliance with HIPAA Technical Safeguards',
      context: args,
      instructions: [
        'Access Control (§164.312(a)(1)): Unique user identification, emergency access procedure, automatic logoff, encryption and decryption',
        'Audit Controls (§164.312(b)): Hardware, software, and/or procedural mechanisms to record and examine activity',
        'Integrity (§164.312(c)(1)): Mechanisms to authenticate PHI has not been altered or destroyed',
        'Person or Entity Authentication (§164.312(d)): Verify person or entity seeking access is who they claim to be',
        'Transmission Security (§164.312(e)(1)): Integrity controls and encryption for PHI transmission',
        'Assess unique user IDs and authentication mechanisms',
        'Review access controls and least privilege implementation',
        'Assess audit logging and monitoring capabilities',
        'Review encryption at rest and in transit',
        'Assess integrity controls and checksums',
        'Review session management and automatic logoff',
        'Assess emergency access procedures',
        'Review technical access controls to PHI systems',
        'Document findings with evidence',
        'Calculate technical safeguards compliance score',
        'Save assessment report to output directory'
      ],
      outputFormat: 'JSON with score, compliant, findings, gaps, encryptionStatus, accessControlsStatus, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'compliant', 'findings', 'gaps', 'encryptionStatus', 'accessControlsStatus', 'artifacts'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        compliant: { type: 'boolean' },
        findings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              standard: { type: 'string' },
              status: { type: 'string', enum: ['compliant', 'partially-compliant', 'non-compliant', 'not-assessed'] },
              evidence: { type: 'string' },
              notes: { type: 'string' }
            }
          }
        },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              standard: { type: 'string' },
              gap: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              remediation: { type: 'string' }
            }
          }
        },
        encryptionStatus: {
          type: 'object',
          properties: {
            atRest: { type: 'string', enum: ['implemented', 'partial', 'not-implemented'] },
            inTransit: { type: 'string', enum: ['implemented', 'partial', 'not-implemented'] },
            algorithms: { type: 'array', items: { type: 'string' } }
          }
        },
        accessControlsStatus: {
          type: 'object',
          properties: {
            uniqueUserIds: { type: 'boolean' },
            mfaImplemented: { type: 'boolean' },
            roleBasedAccess: { type: 'boolean' },
            leastPrivilege: { type: 'boolean' }
          }
        },
        auditLogging: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'hipaa', 'technical-safeguards']
}));

// Task 6: Security Risk Analysis
export const securityRiskAnalysisTask = defineTask('security-risk-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct HIPAA Security Risk Analysis',
  agent: {
    name: 'risk-analyst',
    prompt: {
      role: 'HIPAA security risk analyst',
      task: 'Conduct comprehensive security risk analysis as required by HIPAA',
      context: args,
      instructions: [
        'Identify threats to PHI (internal and external)',
        'Assess vulnerabilities in PHI systems and processes',
        'Determine likelihood of threat occurrence',
        'Assess potential impact of PHI breach or compromise',
        'Calculate risk levels (likelihood × impact)',
        'Identify threat scenarios (ransomware, insider threat, data breach)',
        'Assess existing security controls effectiveness',
        'Determine residual risk after controls',
        'Prioritize risks by severity',
        'Document risk analysis methodology',
        'Generate threat and vulnerability register',
        'Create risk treatment recommendations',
        'Save risk analysis report to output directory'
      ],
      outputFormat: 'JSON with highRisks, mediumRisks, lowRisks, threatScenarios, reportPath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['identifiedRisks', 'highRisks', 'mediumRisks', 'lowRisks', 'reportPath', 'artifacts'],
      properties: {
        identifiedRisks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              threat: { type: 'string' },
              vulnerability: { type: 'string' },
              likelihood: { type: 'string', enum: ['low', 'medium', 'high'] },
              impact: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
              riskLevel: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
              affectedAssets: { type: 'array', items: { type: 'string' } },
              currentControls: { type: 'array', items: { type: 'string' } },
              residualRisk: { type: 'string' },
              recommendation: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
            }
          }
        },
        highRisks: { type: 'number' },
        mediumRisks: { type: 'number' },
        lowRisks: { type: 'number' },
        threatScenarios: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenario: { type: 'string' },
              likelihood: { type: 'string' },
              impact: { type: 'string' },
              mitigations: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'hipaa', 'risk-analysis']
}));

// Task 7: Business Associate Agreement Management
export const baaManagementTask = defineTask('baa-management', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess Business Associate Agreement compliance',
  agent: {
    name: 'baa-specialist',
    prompt: {
      role: 'HIPAA BAA compliance specialist',
      task: 'Assess Business Associate Agreement management and compliance',
      context: args,
      instructions: [
        'Identify all Business Associates that handle PHI',
        'Review existing BAA agreements for required provisions',
        'Required provisions: permitted uses, safeguards, reporting, subcontractors, termination, return/destruction',
        'Identify missing BAAs for vendors/partners handling PHI',
        'Review BAA renewal and expiration dates',
        'Assess subcontractor BAA chain compliance',
        'Review Business Associate due diligence process',
        'Assess Business Associate monitoring and oversight',
        'Review breach notification requirements in BAAs',
        'Identify BAA gaps and non-compliance',
        'Generate BAA compliance matrix',
        'Save BAA assessment to output directory'
      ],
      outputFormat: 'JSON with compliant, activeBAAs, missingBAAs, expiringBAAs, gaps, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['compliant', 'activeBAAs', 'missingBAAs', 'gaps', 'artifacts'],
      properties: {
        compliant: { type: 'boolean' },
        activeBAAs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              businessAssociate: { type: 'string' },
              baaDate: { type: 'string' },
              expirationDate: { type: 'string' },
              status: { type: 'string', enum: ['active', 'expiring', 'expired'] },
              compliantProvisions: { type: 'boolean' }
            }
          }
        },
        missingBAAs: { type: 'array', items: { type: 'string' } },
        expiringBAAs: { type: 'array', items: { type: 'string' } },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              businessAssociate: { type: 'string' },
              gap: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
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
  labels: ['agent', 'hipaa', 'baa', 'business-associates']
}));

// Task 8: Privacy Rule Compliance
export const privacyRuleTask = defineTask('privacy-rule', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess HIPAA Privacy Rule compliance',
  agent: {
    name: 'privacy-specialist',
    prompt: {
      role: 'HIPAA privacy compliance specialist',
      task: 'Assess compliance with HIPAA Privacy Rule',
      context: args,
      instructions: [
        'Notice of Privacy Practices (§164.520): Written notice to individuals',
        'Rights to Request Privacy Protection (§164.522): Request restrictions on uses/disclosures',
        'Access of Individuals to PHI (§164.524): Right to access PHI',
        'Amendment of PHI (§164.526): Right to request amendment',
        'Accounting of Disclosures (§164.528): Tracking PHI disclosures',
        'Minimum Necessary (§164.502(b)): Limit uses and disclosures to minimum necessary',
        'Uses and Disclosures of PHI (§164.502, §164.506): Permitted and required uses/disclosures',
        'Assess Notice of Privacy Practices distribution',
        'Review patient rights implementation (access, amendment, accounting)',
        'Assess minimum necessary standard application',
        'Review authorization forms and consent procedures',
        'Assess marketing and fundraising compliance',
        'Review de-identification procedures if applicable',
        'Document findings and gaps',
        'Save Privacy Rule assessment to output directory'
      ],
      outputFormat: 'JSON with compliant, score, findings, gaps, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['compliant', 'score', 'findings', 'gaps', 'artifacts'],
      properties: {
        compliant: { type: 'boolean' },
        score: { type: 'number', minimum: 0, maximum: 100 },
        findings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              requirement: { type: 'string' },
              status: { type: 'string', enum: ['compliant', 'partially-compliant', 'non-compliant'] },
              evidence: { type: 'string' },
              notes: { type: 'string' }
            }
          }
        },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              requirement: { type: 'string' },
              gap: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              remediation: { type: 'string' }
            }
          }
        },
        patientRights: { type: 'object' },
        minimumNecessary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'hipaa', 'privacy-rule']
}));

// Task 9: Breach Notification Rule
export const breachNotificationTask = defineTask('breach-notification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess Breach Notification Rule compliance',
  agent: {
    name: 'breach-notification-specialist',
    prompt: {
      role: 'HIPAA breach notification specialist',
      task: 'Assess compliance with HIPAA Breach Notification Rule',
      context: args,
      instructions: [
        'Review breach identification and assessment procedures',
        'Assess breach notification to individuals (60 days)',
        'Assess breach notification to HHS (OCR)',
        'Assess notification to media (500+ individuals)',
        'Review breach log and documentation',
        'Assess breach risk assessment methodology',
        'Review notification templates and procedures',
        'Assess Business Associate breach reporting requirements',
        'Review breach response and investigation procedures',
        'Document findings and gaps',
        'Save breach notification assessment to output directory'
      ],
      outputFormat: 'JSON with compliant, hasBreachProcedures, gaps, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['compliant', 'hasBreachProcedures', 'gaps', 'artifacts'],
      properties: {
        compliant: { type: 'boolean' },
        hasBreachProcedures: { type: 'boolean' },
        breachLog: { type: 'object' },
        notificationProcedures: { type: 'object' },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              area: { type: 'string' },
              gap: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
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
  labels: ['agent', 'hipaa', 'breach-notification']
}));

// Task 10: HITECH Act Compliance
export const hitechComplianceTask = defineTask('hitech-compliance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess HITECH Act compliance',
  agent: {
    name: 'hitech-specialist',
    prompt: {
      role: 'HITECH Act compliance specialist',
      task: 'Assess compliance with HITECH Act requirements',
      context: args,
      instructions: [
        'Breach notification requirements for unsecured PHI',
        'Enhanced enforcement penalties',
        'Business Associate direct liability',
        'Sale of PHI restrictions',
        'Marketing restrictions',
        'Accounting of disclosures for EHR',
        'Patient access to EHR in electronic format',
        'Audit controls requirements',
        'Document findings and gaps',
        'Save HITECH compliance assessment to output directory'
      ],
      outputFormat: 'JSON with compliant, findings, gaps, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['compliant', 'findings', 'gaps', 'artifacts'],
      properties: {
        compliant: { type: 'boolean' },
        findings: { type: 'array' },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              requirement: { type: 'string' },
              gap: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
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
  labels: ['agent', 'hipaa', 'hitech']
}));

// Task 11: Policies and Procedures Review
export const policiesProceduresTask = defineTask('policies-procedures', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review HIPAA policies and procedures',
  agent: {
    name: 'policy-reviewer',
    prompt: {
      role: 'HIPAA policy specialist',
      task: 'Review HIPAA policies and procedures for completeness and currency',
      context: args,
      instructions: [
        'Identify required HIPAA policies and procedures',
        'Review existing policies for completeness',
        'Assess policy approval and distribution',
        'Review policy update and review procedures',
        'Identify missing or outdated policies',
        'Assess sanctions policy and enforcement',
        'Review workforce acknowledgment of policies',
        'Assess policy documentation and retention',
        'Document policy gaps and recommendations',
        'Save policies review to output directory'
      ],
      outputFormat: 'JSON with compliant, existingPolicies, missingPolicies, outdatedPolicies, gaps, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['compliant', 'existingPolicies', 'missingPolicies', 'gaps', 'artifacts'],
      properties: {
        compliant: { type: 'boolean' },
        existingPolicies: { type: 'array', items: { type: 'string' } },
        missingPolicies: { type: 'array', items: { type: 'string' } },
        outdatedPolicies: { type: 'array', items: { type: 'string' } },
        policyReviewDate: { type: 'string' },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              policy: { type: 'string' },
              gap: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
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
  labels: ['agent', 'hipaa', 'policies']
}));

// Task 12: Training and Awareness Assessment
export const trainingAwarenessTask = defineTask('training-awareness', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess workforce training and awareness',
  agent: {
    name: 'training-specialist',
    prompt: {
      role: 'HIPAA training specialist',
      task: 'Assess HIPAA workforce training and security awareness',
      context: args,
      instructions: [
        'Review HIPAA training program and curriculum',
        'Assess initial training for new workforce members',
        'Review periodic refresher training',
        'Assess training completion and documentation',
        'Review training content coverage (Privacy, Security, Breach)',
        'Assess role-based training',
        'Review security awareness activities',
        'Assess training effectiveness measurement',
        'Identify training gaps and non-compliant staff',
        'Document findings and recommendations',
        'Save training assessment to output directory'
      ],
      outputFormat: 'JSON with compliant, trainedStaff, totalStaff, gaps, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['compliant', 'trainedStaff', 'totalStaff', 'gaps', 'artifacts'],
      properties: {
        compliant: { type: 'boolean' },
        trainedStaff: { type: 'number' },
        totalStaff: { type: 'number' },
        trainingCompletionRate: { type: 'number' },
        trainingProgram: { type: 'object' },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              area: { type: 'string' },
              gap: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
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
  labels: ['agent', 'hipaa', 'training']
}));

// Task 13: Incident Response and Contingency Planning
export const incidentResponseContingencyTask = defineTask('incident-response-contingency', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess incident response and contingency plans',
  agent: {
    name: 'incident-response-specialist',
    prompt: {
      role: 'HIPAA incident response specialist',
      task: 'Assess incident response and contingency planning compliance',
      context: args,
      instructions: [
        'Review security incident response plan',
        'Assess incident identification and reporting procedures',
        'Review breach assessment and notification procedures',
        'Assess data backup plan and testing',
        'Review disaster recovery plan',
        'Assess emergency mode operation procedures',
        'Review contingency plan testing and updates',
        'Assess applications and data criticality analysis',
        'Review business continuity planning',
        'Document findings and gaps',
        'Save incident response assessment to output directory'
      ],
      outputFormat: 'JSON with compliant, hasIncidentPlan, hasBreachProtocol, hasContingencyPlan, gaps, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['compliant', 'hasIncidentPlan', 'hasBreachProtocol', 'hasContingencyPlan', 'gaps', 'artifacts'],
      properties: {
        compliant: { type: 'boolean' },
        hasIncidentPlan: { type: 'boolean' },
        hasBreachProtocol: { type: 'boolean' },
        hasContingencyPlan: { type: 'boolean' },
        lastTested: { type: 'string' },
        backupFrequency: { type: 'string' },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              area: { type: 'string' },
              gap: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
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
  labels: ['agent', 'hipaa', 'incident-response', 'contingency']
}));

// Task 14: Compliance Scoring
export const complianceScoringTask = defineTask('compliance-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate overall HIPAA compliance score',
  agent: {
    name: 'compliance-scorer',
    prompt: {
      role: 'HIPAA compliance analyst',
      task: 'Calculate comprehensive HIPAA compliance score',
      context: args,
      instructions: [
        'Calculate weighted scores for each HIPAA category',
        'Administrative Safeguards: 30% weight',
        'Physical Safeguards: 15% weight',
        'Technical Safeguards: 30% weight',
        'Privacy Rule: 15% weight',
        'Policies and Training: 10% weight',
        'Factor in critical gaps and high-severity findings',
        'Apply penalties for missing required implementations',
        'Calculate overall compliance score 0-100',
        'Determine compliance status (compliant >= 80, needs improvement 60-79, non-compliant < 60)',
        'Generate compliance scorecard',
        'Save scoring report to output directory'
      ],
      outputFormat: 'JSON with score, breakdown, complianceStatus, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'breakdown', 'complianceStatus', 'artifacts'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        breakdown: {
          type: 'object',
          properties: {
            administrativeSafeguards: { type: 'number' },
            physicalSafeguards: { type: 'number' },
            technicalSafeguards: { type: 'number' },
            privacyRule: { type: 'number' },
            policiesTraining: { type: 'number' },
            riskAnalysis: { type: 'number' },
            baa: { type: 'number' }
          }
        },
        complianceStatus: { type: 'string', enum: ['compliant', 'needs-improvement', 'non-compliant'] },
        criticalGaps: { type: 'number' },
        highGaps: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'hipaa', 'scoring']
}));

// Task 15: Gap Analysis and Prioritization
export const gapAnalysisPrioritizationTask = defineTask('gap-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct gap analysis and prioritization',
  agent: {
    name: 'gap-analyst',
    prompt: {
      role: 'HIPAA compliance analyst',
      task: 'Analyze compliance gaps and prioritize remediation',
      context: args,
      instructions: [
        'Consolidate all identified gaps from assessments',
        'Categorize gaps by HIPAA requirement',
        'Assess gap severity and risk level',
        'Prioritize gaps: Critical (immediate), High (30 days), Medium (90 days), Low (180 days)',
        'Group related gaps for efficient remediation',
        'Identify quick wins (low effort, high impact)',
        'Assess resource requirements for each gap',
        'Create prioritized gap remediation roadmap',
        'Document gap analysis findings',
        'Save gap analysis report to output directory'
      ],
      outputFormat: 'JSON with prioritizedGaps, quickWins, roadmap, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['prioritizedGaps', 'quickWins', 'artifacts'],
      properties: {
        prioritizedGaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gap: { type: 'string' },
              category: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              effort: { type: 'string', enum: ['low', 'medium', 'high'] },
              impact: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
              timeline: { type: 'string' }
            }
          }
        },
        quickWins: { type: 'array', items: { type: 'string' } },
        roadmap: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'hipaa', 'gap-analysis']
}));

// Task 16: Remediation Plan Generation
export const remediationPlanTask = defineTask('remediation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate HIPAA compliance remediation plan',
  agent: {
    name: 'remediation-planner',
    prompt: {
      role: 'HIPAA remediation specialist',
      task: 'Generate comprehensive remediation plan for HIPAA compliance gaps',
      context: args,
      instructions: [
        'Create detailed remediation actions for each gap',
        'Assign ownership and accountability',
        'Define success criteria and validation',
        'Estimate effort, cost, and timeline',
        'Create phased implementation plan',
        'Phase 1: Critical gaps (0-30 days)',
        'Phase 2: High priority gaps (30-90 days)',
        'Phase 3: Medium priority gaps (90-180 days)',
        'Phase 4: Low priority and continuous improvement (180+ days)',
        'Define milestones and checkpoints',
        'Create resource allocation plan',
        'Document dependencies and risks',
        'Generate project plan for remediation',
        'Save remediation plan to output directory'
      ],
      outputFormat: 'JSON with totalActions, prioritizedActions, timeline, estimatedEffort, estimatedCost, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalActions', 'criticalActions', 'highPriorityActions', 'prioritizedActions', 'timeline', 'artifacts'],
      properties: {
        totalActions: { type: 'number' },
        criticalActions: { type: 'number' },
        highPriorityActions: { type: 'number' },
        prioritizedActions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              gap: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              owner: { type: 'string' },
              timeline: { type: 'string' },
              effort: { type: 'string' },
              cost: { type: 'string' },
              successCriteria: { type: 'string' }
            }
          }
        },
        timeline: { type: 'object' },
        estimatedEffort: { type: 'string' },
        estimatedCost: { type: 'string' },
        phases: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'hipaa', 'remediation']
}));

// Task 17: Compliance Report Generation
export const complianceReportTask = defineTask('compliance-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive HIPAA compliance report',
  agent: {
    name: 'compliance-reporter',
    prompt: {
      role: 'HIPAA compliance documentation specialist',
      task: 'Generate comprehensive HIPAA compliance assessment report',
      context: args,
      instructions: [
        'Create executive summary with key findings',
        'Document assessment scope and methodology',
        'Present compliance score and status',
        'Detail findings for each HIPAA safeguard category',
        'Present risk analysis results and threat scenarios',
        'Document PHI protection status',
        'Present BAA compliance status',
        'Detail Privacy Rule and Breach Notification compliance',
        'Present gap analysis and prioritization',
        'Include remediation plan summary',
        'Provide detailed findings appendices',
        'Add compliance matrices and checklists',
        'Format as professional Markdown report',
        'Generate executive presentation deck',
        'Save comprehensive report to output directory'
      ],
      outputFormat: 'JSON with reportPath, executiveSummary, keyFindings, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummary', 'keyFindings', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        criticalRecommendations: { type: 'array', items: { type: 'string' } },
        complianceStatus: { type: 'string' },
        presentationPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'hipaa', 'reporting']
}));
