/**
 * @process specializations/security-compliance/business-continuity
 * @description Business Continuity Planning - Comprehensive framework for ensuring organizational resilience through
 * business impact analysis, risk assessment, recovery strategy development, disaster recovery planning, crisis management,
 * continuity plan documentation, testing and validation, and ongoing maintenance to minimize disruption and ensure rapid
 * recovery from disruptive events.
 * @inputs { organizationName?: string, businessUnits?: array, criticalSystems?: array, rpo?: string, rto?: string, complianceRequirements?: array, scope?: string, outputDir?: string }
 * @outputs { success: boolean, bcpId: string, businessImpactAnalysis: object, riskAssessment: object, recoveryStrategies: object, disasterRecovery: object, crisisManagement: object, bcpDocument: object, testResults?: object, metrics: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/security-compliance/business-continuity', {
 *   organizationName: 'Acme Corporation',
 *   businessUnits: ['IT Operations', 'Customer Service', 'Finance', 'Sales'],
 *   criticalSystems: ['customer-database', 'payment-processing', 'email-system', 'erp-system'],
 *   rpo: '4 hours',
 *   rto: '24 hours',
 *   complianceRequirements: ['SOC2', 'ISO22301', 'GDPR'],
 *   scope: 'enterprise-wide'
 * });
 *
 * @references
 * - ISO 22301 - Business Continuity Management: https://www.iso.org/standard/75106.html
 * - NIST SP 800-34 - Contingency Planning Guide: https://csrc.nist.gov/publications/detail/sp/800-34/rev-1/final
 * - DRI International BCM Professional Practices: https://drii.org/resources/professionalpractices
 * - BCI Good Practice Guidelines: https://www.thebci.org/training-qualifications/good-practice-guidelines.html
 * - FEMA Continuity Guidance: https://www.fema.gov/emergency-managers/national-preparedness/continuity
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationName = 'Organization',
    businessUnits = [],
    criticalSystems = [],
    rpo = '4 hours', // Recovery Point Objective
    rto = '24 hours', // Recovery Time Objective
    complianceRequirements = [],
    scope = 'enterprise-wide',
    outputDir = 'business-continuity-planning-output',
    includeDisasterRecovery = true,
    includeCrisisManagement = true,
    performTesting = true,
    maxTolerableDowntime = '72 hours',
    budgetConstraints = null,
    geographicScope = 'multi-site',
    stakeholders = []
  } = inputs;

  const startTime = ctx.now();
  const bcpId = `BCP-${Date.now()}`;
  const artifacts = [];

  ctx.log('info', `Starting Business Continuity Planning Process for ${organizationName} (${bcpId})`);
  ctx.log('info', `Scope: ${scope}, RTO: ${rto}, RPO: ${rpo}`);

  // ============================================================================
  // PHASE 1: BUSINESS CONTINUITY PROGRAM INITIALIZATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Business Continuity Program Initialization');

  const programInitialization = await ctx.task(programInitializationTask, {
    bcpId,
    organizationName,
    businessUnits,
    scope,
    complianceRequirements,
    stakeholders,
    outputDir
  });

  artifacts.push(...programInitialization.artifacts);

  ctx.log('info', `Program Initialization Complete - Governance: ${programInitialization.governanceEstablished}, Stakeholders: ${programInitialization.stakeholdersIdentified}`);

  // Quality Gate: Program approval
  await ctx.breakpoint({
    question: `Business Continuity Program for ${organizationName} initialized. Governance structure: ${programInitialization.governanceStructure}. Stakeholders identified: ${programInitialization.stakeholdersIdentified}. Approve program scope and proceed?`,
    title: 'BCP Program Initialization Approval',
    context: {
      runId: ctx.runId,
      bcpId,
      organizationName,
      scope,
      governanceStructure: programInitialization.governanceStructure,
      bcpOwner: programInitialization.bcpOwner,
      steeringCommittee: programInitialization.steeringCommittee,
      recommendation: 'Verify program scope, governance, and stakeholder engagement before proceeding',
      files: programInitialization.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // PHASE 2: BUSINESS IMPACT ANALYSIS (BIA)
  // ============================================================================

  ctx.log('info', 'Phase 2: Conducting Business Impact Analysis');

  const businessImpactAnalysis = await ctx.task(businessImpactAnalysisTask, {
    bcpId,
    organizationName,
    businessUnits,
    criticalSystems,
    rpo,
    rto,
    maxTolerableDowntime,
    outputDir
  });

  artifacts.push(...businessImpactAnalysis.artifacts);

  const criticalProcesses = businessImpactAnalysis.criticalProcesses || [];
  const missionCriticalCount = criticalProcesses.filter(p => p.priority === 'mission-critical').length;

  ctx.log('info', `BIA Complete - Critical Processes: ${criticalProcesses.length}, Mission-Critical: ${missionCriticalCount}`);

  // Quality Gate: BIA review
  await ctx.breakpoint({
    question: `Business Impact Analysis for ${organizationName} completed. Identified ${criticalProcesses.length} critical business processes (${missionCriticalCount} mission-critical). Review findings and approve before proceeding to risk assessment?`,
    title: 'Business Impact Analysis Review',
    context: {
      runId: ctx.runId,
      bcpId,
      criticalProcessesCount: criticalProcesses.length,
      missionCriticalCount,
      totalFinancialImpact: businessImpactAnalysis.totalFinancialImpact,
      rtoCompliance: businessImpactAnalysis.rtoCompliance,
      rpoCompliance: businessImpactAnalysis.rpoCompliance,
      recommendation: 'Validate critical process identification and impact assessments with business unit leaders',
      files: businessImpactAnalysis.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // PHASE 3: RISK ASSESSMENT AND THREAT IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Conducting Risk Assessment and Threat Identification');

  const riskAssessment = await ctx.task(riskAssessmentTask, {
    bcpId,
    organizationName,
    businessUnits,
    criticalSystems,
    criticalProcesses,
    geographicScope,
    businessImpactAnalysis,
    outputDir
  });

  artifacts.push(...riskAssessment.artifacts);

  const highRiskThreats = riskAssessment.threats.filter(t => t.riskLevel === 'high' || t.riskLevel === 'critical').length;

  ctx.log('info', `Risk Assessment Complete - Threats Identified: ${riskAssessment.threats.length}, High/Critical Risk: ${highRiskThreats}`);

  // ============================================================================
  // PHASE 4: PARALLEL STRATEGY DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Developing Recovery and Continuity Strategies');

  const [
    recoveryStrategies,
    alternativeSites,
    dataBackupStrategy
  ] = await ctx.parallel.all([
    () => ctx.task(recoveryStrategiesTask, {
      bcpId,
      organizationName,
      criticalProcesses,
      criticalSystems,
      businessImpactAnalysis,
      riskAssessment,
      rto,
      rpo,
      budgetConstraints,
      outputDir
    }),
    () => ctx.task(alternativeSitesTask, {
      bcpId,
      organizationName,
      businessUnits,
      criticalProcesses,
      geographicScope,
      budgetConstraints,
      outputDir
    }),
    () => ctx.task(dataBackupStrategyTask, {
      bcpId,
      organizationName,
      criticalSystems,
      rpo,
      rto,
      outputDir
    })
  ]);

  artifacts.push(
    ...recoveryStrategies.artifacts,
    ...alternativeSites.artifacts,
    ...dataBackupStrategy.artifacts
  );

  ctx.log('info', `Strategy Development Complete - Recovery Strategies: ${recoveryStrategies.strategiesCount}, Backup Strategy: ${dataBackupStrategy.backupTier}`);

  // Quality Gate: Strategy approval
  await ctx.breakpoint({
    question: `Recovery strategies developed for ${organizationName}. ${recoveryStrategies.strategiesCount} strategies identified. Alternative sites: ${alternativeSites.sitesIdentified}. Backup strategy: ${dataBackupStrategy.backupTier}. Approve strategies and budget allocation?`,
    title: 'Recovery Strategy Approval',
    context: {
      runId: ctx.runId,
      bcpId,
      strategiesCount: recoveryStrategies.strategiesCount,
      estimatedCost: recoveryStrategies.estimatedTotalCost,
      alternativeSites: alternativeSites.sitesIdentified,
      backupStrategy: dataBackupStrategy.backupTier,
      rtoAchievable: recoveryStrategies.rtoAchievable,
      rpoAchievable: dataBackupStrategy.rpoAchievable,
      recommendation: 'Verify strategies meet RTO/RPO objectives and fit within budget constraints',
      files: [
        ...recoveryStrategies.artifacts.map(a => ({ path: a.path, format: a.format || 'json' })),
        ...alternativeSites.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      ]
    }
  });

  // ============================================================================
  // PHASE 5: DISASTER RECOVERY PLANNING (if enabled)
  // ============================================================================

  let disasterRecovery = null;

  if (includeDisasterRecovery) {
    ctx.log('info', 'Phase 5: Developing Disaster Recovery Plans');

    disasterRecovery = await ctx.task(disasterRecoveryPlanTask, {
      bcpId,
      organizationName,
      criticalSystems,
      dataBackupStrategy,
      recoveryStrategies,
      rto,
      rpo,
      outputDir
    });

    artifacts.push(...disasterRecovery.artifacts);

    ctx.log('info', `Disaster Recovery Plans Complete - DR Plans: ${disasterRecovery.drPlansCreated}, Systems Covered: ${disasterRecovery.systemsCovered}`);
  } else {
    ctx.log('info', 'Phase 5: Disaster Recovery Planning skipped (not requested)');
  }

  // ============================================================================
  // PHASE 6: CRISIS MANAGEMENT AND COMMUNICATION PLANNING
  // ============================================================================

  let crisisManagement = null;

  if (includeCrisisManagement) {
    ctx.log('info', 'Phase 6: Developing Crisis Management and Communication Plans');

    crisisManagement = await ctx.task(crisisManagementTask, {
      bcpId,
      organizationName,
      businessUnits,
      stakeholders,
      riskAssessment,
      programInitialization,
      outputDir
    });

    artifacts.push(...crisisManagement.artifacts);

    ctx.log('info', `Crisis Management Plans Complete - Crisis Scenarios: ${crisisManagement.crisisScenariosPlanned}, Communication Templates: ${crisisManagement.communicationTemplates}`);
  } else {
    ctx.log('info', 'Phase 6: Crisis Management Planning skipped (not requested)');
  }

  // ============================================================================
  // PHASE 7: INCIDENT RESPONSE PROCEDURES DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 7: Developing Incident Response Procedures');

  const incidentResponseProcedures = await ctx.task(incidentResponseProceduresTask, {
    bcpId,
    organizationName,
    criticalProcesses,
    riskAssessment,
    recoveryStrategies,
    crisisManagement,
    outputDir
  });

  artifacts.push(...incidentResponseProcedures.artifacts);

  ctx.log('info', `Incident Response Procedures Complete - Playbooks Created: ${incidentResponseProcedures.playbooksCreated}`);

  // ============================================================================
  // PHASE 8: BUSINESS CONTINUITY PLAN DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Creating Comprehensive BCP Documentation');

  const bcpDocument = await ctx.task(bcpDocumentationTask, {
    bcpId,
    organizationName,
    scope,
    programInitialization,
    businessImpactAnalysis,
    riskAssessment,
    recoveryStrategies,
    alternativeSites,
    dataBackupStrategy,
    disasterRecovery,
    crisisManagement,
    incidentResponseProcedures,
    complianceRequirements,
    outputDir
  });

  artifacts.push(...bcpDocument.artifacts);

  ctx.log('info', `BCP Documentation Complete - Main Document: ${bcpDocument.mainDocumentPath}, Appendices: ${bcpDocument.appendicesCount}`);

  // Quality Gate: BCP document review
  await ctx.breakpoint({
    question: `Business Continuity Plan for ${organizationName} documented. Document includes ${bcpDocument.sectionsCount} sections, ${bcpDocument.appendicesCount} appendices. Review comprehensive BCP before proceeding to validation and testing?`,
    title: 'BCP Documentation Review',
    context: {
      runId: ctx.runId,
      bcpId,
      organizationName,
      mainDocumentPath: bcpDocument.mainDocumentPath,
      sectionsCount: bcpDocument.sectionsCount,
      appendicesCount: bcpDocument.appendicesCount,
      pageCount: bcpDocument.pageCount,
      complianceAlignment: bcpDocument.complianceAlignment,
      recommendation: 'Review BCP with steering committee and obtain formal approval before testing',
      files: [
        { path: bcpDocument.mainDocumentPath, format: 'markdown', label: 'Business Continuity Plan' },
        ...bcpDocument.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      ]
    }
  });

  // ============================================================================
  // PHASE 9: ROLES AND RESPONSIBILITIES DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 9: Defining Roles and Responsibilities');

  const rolesResponsibilities = await ctx.task(rolesResponsibilitiesTask, {
    bcpId,
    organizationName,
    businessUnits,
    criticalProcesses,
    programInitialization,
    crisisManagement,
    outputDir
  });

  artifacts.push(...rolesResponsibilities.artifacts);

  ctx.log('info', `Roles and Responsibilities Complete - Teams Defined: ${rolesResponsibilities.teamsDefinedCount}, Roles Assigned: ${rolesResponsibilities.rolesAssignedCount}`);

  // ============================================================================
  // PHASE 10: TRAINING AND AWARENESS PROGRAM DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 10: Developing Training and Awareness Program');

  const trainingProgram = await ctx.task(trainingProgramTask, {
    bcpId,
    organizationName,
    businessUnits,
    bcpDocument,
    rolesResponsibilities,
    incidentResponseProcedures,
    outputDir
  });

  artifacts.push(...trainingProgram.artifacts);

  ctx.log('info', `Training Program Complete - Training Modules: ${trainingProgram.trainingModulesCreated}, Target Audience: ${trainingProgram.targetAudienceSize}`);

  // ============================================================================
  // PHASE 11: BCP TESTING AND VALIDATION (if enabled)
  // ============================================================================

  let testResults = null;

  if (performTesting) {
    ctx.log('info', 'Phase 11: Planning BCP Testing and Validation');

    const testPlanning = await ctx.task(testPlanningTask, {
      bcpId,
      organizationName,
      criticalProcesses,
      recoveryStrategies,
      disasterRecovery,
      bcpDocument,
      rolesResponsibilities,
      outputDir
    });

    artifacts.push(...testPlanning.artifacts);

    ctx.log('info', `Test Planning Complete - Test Scenarios: ${testPlanning.testScenariosPlanned}`);

    // Quality Gate: Test execution approval
    await ctx.breakpoint({
      question: `BCP Test Plan ready for ${organizationName}. ${testPlanning.testScenariosPlanned} test scenarios planned. Tests include: ${testPlanning.testTypes.join(', ')}. Schedule and approve test execution?`,
      title: 'BCP Testing Approval',
      context: {
        runId: ctx.runId,
        bcpId,
        testScenariosPlanned: testPlanning.testScenariosPlanned,
        testTypes: testPlanning.testTypes,
        estimatedDuration: testPlanning.estimatedDuration,
        businessImpact: testPlanning.estimatedBusinessImpact,
        recommendation: 'Coordinate test timing with business operations to minimize disruption',
        files: testPlanning.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });

    // Execute testing (simulation)
    testResults = await ctx.task(testExecutionTask, {
      bcpId,
      organizationName,
      testPlanning,
      criticalProcesses,
      recoveryStrategies,
      rolesResponsibilities,
      outputDir
    });

    artifacts.push(...testResults.artifacts);

    ctx.log('info', `BCP Testing Complete - Tests Executed: ${testResults.testsExecuted}, Success Rate: ${testResults.successRate}%`);

    // Quality Gate: Test results review
    if (testResults.successRate < 80) {
      await ctx.breakpoint({
        question: `BCP Testing for ${organizationName} completed with ${testResults.successRate}% success rate. ${testResults.issuesIdentified} issues found. Review test results and address failures before finalizing BCP?`,
        title: 'BCP Test Results Review',
        context: {
          runId: ctx.runId,
          bcpId,
          testsExecuted: testResults.testsExecuted,
          testsPassed: testResults.testsPassed,
          testsFailed: testResults.testsFailed,
          successRate: testResults.successRate,
          issuesIdentified: testResults.issuesIdentified,
          criticalIssues: testResults.criticalIssues,
          recommendation: 'Address critical issues and retest before considering BCP production-ready',
          files: testResults.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
        }
      });
    }
  } else {
    ctx.log('info', 'Phase 11: BCP Testing skipped (not requested)');
  }

  // ============================================================================
  // PHASE 12: MAINTENANCE AND REVIEW PROCEDURES
  // ============================================================================

  ctx.log('info', 'Phase 12: Establishing Maintenance and Review Procedures');

  const maintenanceProcedures = await ctx.task(maintenanceProceduresTask, {
    bcpId,
    organizationName,
    bcpDocument,
    testResults,
    complianceRequirements,
    outputDir
  });

  artifacts.push(...maintenanceProcedures.artifacts);

  ctx.log('info', `Maintenance Procedures Complete - Review Cycle: ${maintenanceProcedures.reviewCycle}, Update Triggers: ${maintenanceProcedures.updateTriggersCount}`);

  // ============================================================================
  // PHASE 13: COMPLIANCE VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 13: Validating Compliance Requirements');

  const complianceValidation = await ctx.task(complianceValidationTask, {
    bcpId,
    organizationName,
    complianceRequirements,
    bcpDocument,
    businessImpactAnalysis,
    riskAssessment,
    testResults,
    outputDir
  });

  artifacts.push(...complianceValidation.artifacts);

  const complianceGaps = complianceValidation.gapsIdentified || 0;

  ctx.log('info', `Compliance Validation Complete - Requirements Met: ${complianceValidation.requirementsMet}/${complianceValidation.totalRequirements}, Gaps: ${complianceGaps}`);

  // Quality Gate: Compliance gaps
  if (complianceGaps > 0) {
    await ctx.breakpoint({
      question: `Compliance validation for ${organizationName} identified ${complianceGaps} gaps against requirements: ${complianceRequirements.join(', ')}. Review gaps and create remediation plan?`,
      title: 'Compliance Gaps Identified',
      context: {
        runId: ctx.runId,
        bcpId,
        complianceRequirements,
        requirementsMet: complianceValidation.requirementsMet,
        totalRequirements: complianceValidation.totalRequirements,
        gapsIdentified: complianceGaps,
        gaps: complianceValidation.gaps,
        recommendation: 'Address compliance gaps before BCP approval and implementation',
        files: complianceValidation.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 14: EXECUTIVE SUMMARY AND REPORTING
  // ============================================================================

  ctx.log('info', 'Phase 14: Generating Executive Summary and Final Reports');

  const executiveReport = await ctx.task(executiveReportTask, {
    bcpId,
    organizationName,
    scope,
    startTime,
    programInitialization,
    businessImpactAnalysis,
    riskAssessment,
    recoveryStrategies,
    disasterRecovery,
    crisisManagement,
    bcpDocument,
    testResults,
    complianceValidation,
    maintenanceProcedures,
    outputDir
  });

  artifacts.push(...executiveReport.artifacts);

  ctx.log('info', `Executive Report Complete - Report Path: ${executiveReport.reportPath}`);

  // ============================================================================
  // PHASE 15: BCP IMPLEMENTATION AND DEPLOYMENT
  // ============================================================================

  ctx.log('info', 'Phase 15: Planning BCP Implementation and Deployment');

  const implementationPlan = await ctx.task(implementationPlanTask, {
    bcpId,
    organizationName,
    businessUnits,
    bcpDocument,
    trainingProgram,
    rolesResponsibilities,
    maintenanceProcedures,
    complianceValidation,
    outputDir
  });

  artifacts.push(...implementationPlan.artifacts);

  ctx.log('info', `Implementation Plan Complete - Phases: ${implementationPlan.implementationPhases}, Estimated Timeline: ${implementationPlan.estimatedTimeline}`);

  // Final Breakpoint: BCP Program Review
  await ctx.breakpoint({
    question: `Business Continuity Planning for ${organizationName} complete. BCP covers ${criticalProcesses.length} critical processes, ${recoveryStrategies.strategiesCount} recovery strategies. Testing: ${performTesting ? `${testResults.successRate}% success rate` : 'not performed'}. Compliance: ${complianceValidation.requirementsMet}/${complianceValidation.totalRequirements} requirements met. Approve and implement BCP?`,
    title: 'Final BCP Program Review',
    context: {
      runId: ctx.runId,
      summary: {
        bcpId,
        organizationName,
        scope,
        criticalProcessesCount: criticalProcesses.length,
        missionCriticalCount,
        threatsIdentified: riskAssessment.threats.length,
        highRiskThreats,
        recoveryStrategiesCount: recoveryStrategies.strategiesCount,
        alternativeSites: alternativeSites.sitesIdentified,
        disasterRecoveryPlans: disasterRecovery ? disasterRecovery.drPlansCreated : 0,
        testingPerformed: performTesting,
        testSuccessRate: testResults ? testResults.successRate : null,
        complianceStatus: `${complianceValidation.requirementsMet}/${complianceValidation.totalRequirements}`,
        complianceGaps,
        estimatedImplementationTimeline: implementationPlan.estimatedTimeline
      },
      recommendation: executiveReport.recommendation,
      nextSteps: implementationPlan.nextSteps,
      files: [
        { path: executiveReport.reportPath, format: 'markdown', label: 'Executive Summary' },
        { path: bcpDocument.mainDocumentPath, format: 'markdown', label: 'Business Continuity Plan' },
        { path: implementationPlan.planPath, format: 'markdown', label: 'Implementation Plan' },
        ...(testResults ? [{ path: testResults.summaryReportPath, format: 'markdown', label: 'Test Results' }] : [])
      ]
    }
  });

  const endTime = ctx.now();
  const totalDuration = endTime - startTime;

  return {
    success: true,
    bcpId,
    organizationName,
    scope,
    businessUnits,
    criticalSystems,
    rto,
    rpo,
    programInitialization: {
      governanceEstablished: programInitialization.governanceEstablished,
      bcpOwner: programInitialization.bcpOwner,
      steeringCommittee: programInitialization.steeringCommittee
    },
    businessImpactAnalysis: {
      criticalProcessesCount: criticalProcesses.length,
      missionCriticalCount,
      totalFinancialImpact: businessImpactAnalysis.totalFinancialImpact,
      rtoCompliance: businessImpactAnalysis.rtoCompliance,
      rpoCompliance: businessImpactAnalysis.rpoCompliance
    },
    riskAssessment: {
      threatsIdentified: riskAssessment.threats.length,
      highRiskThreats,
      topThreats: riskAssessment.topThreats,
      riskRegister: riskAssessment.riskRegisterPath
    },
    recoveryStrategies: {
      strategiesCount: recoveryStrategies.strategiesCount,
      estimatedCost: recoveryStrategies.estimatedTotalCost,
      rtoAchievable: recoveryStrategies.rtoAchievable,
      rpoAchievable: dataBackupStrategy.rpoAchievable,
      alternativeSites: alternativeSites.sitesIdentified,
      backupStrategy: dataBackupStrategy.backupTier
    },
    disasterRecovery: disasterRecovery ? {
      drPlansCreated: disasterRecovery.drPlansCreated,
      systemsCovered: disasterRecovery.systemsCovered,
      drRunbooksPath: disasterRecovery.drRunbooksPath
    } : null,
    crisisManagement: crisisManagement ? {
      crisisScenariosPlanned: crisisManagement.crisisScenariosPlanned,
      communicationTemplates: crisisManagement.communicationTemplates,
      escalationProcedures: crisisManagement.escalationProceduresPath
    } : null,
    incidentResponse: {
      playbooksCreated: incidentResponseProcedures.playbooksCreated,
      playbooksPath: incidentResponseProcedures.playbooksPath
    },
    bcpDocument: {
      mainDocumentPath: bcpDocument.mainDocumentPath,
      sectionsCount: bcpDocument.sectionsCount,
      appendicesCount: bcpDocument.appendicesCount,
      pageCount: bcpDocument.pageCount,
      complianceAlignment: bcpDocument.complianceAlignment
    },
    rolesResponsibilities: {
      teamsDefinedCount: rolesResponsibilities.teamsDefinedCount,
      rolesAssignedCount: rolesResponsibilities.rolesAssignedCount,
      contactListPath: rolesResponsibilities.contactListPath
    },
    training: {
      trainingModulesCreated: trainingProgram.trainingModulesCreated,
      targetAudienceSize: trainingProgram.targetAudienceSize,
      trainingPlanPath: trainingProgram.trainingPlanPath
    },
    testing: testResults ? {
      testsExecuted: testResults.testsExecuted,
      testsPassed: testResults.testsPassed,
      testsFailed: testResults.testsFailed,
      successRate: testResults.successRate,
      issuesIdentified: testResults.issuesIdentified,
      criticalIssues: testResults.criticalIssues,
      summaryReportPath: testResults.summaryReportPath
    } : null,
    maintenance: {
      reviewCycle: maintenanceProcedures.reviewCycle,
      updateTriggersCount: maintenanceProcedures.updateTriggersCount,
      maintenancePlanPath: maintenanceProcedures.maintenancePlanPath
    },
    compliance: {
      requirementsMet: complianceValidation.requirementsMet,
      totalRequirements: complianceValidation.totalRequirements,
      gapsIdentified: complianceGaps,
      complianceReportPath: complianceValidation.complianceReportPath
    },
    implementation: {
      implementationPhases: implementationPlan.implementationPhases,
      estimatedTimeline: implementationPlan.estimatedTimeline,
      planPath: implementationPlan.planPath,
      nextSteps: implementationPlan.nextSteps
    },
    executiveReport: {
      reportPath: executiveReport.reportPath,
      recommendation: executiveReport.recommendation
    },
    metrics: {
      totalDuration,
      criticalProcessesCovered: criticalProcesses.length,
      threatsAssessed: riskAssessment.threats.length,
      strategiesDeveloped: recoveryStrategies.strategiesCount,
      complianceScore: (complianceValidation.requirementsMet / complianceValidation.totalRequirements * 100).toFixed(1),
      testSuccessRate: testResults ? testResults.successRate : null,
      bcpReadiness: executiveReport.bcpReadinessScore
    },
    artifacts,
    duration: totalDuration,
    metadata: {
      processId: 'specializations/security-compliance/business-continuity',
      timestamp: startTime,
      complianceRequirements,
      includeDisasterRecovery,
      includeCrisisManagement,
      performTesting,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: Program Initialization
export const programInitializationTask = defineTask('program-initialization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: BCP Program Initialization - ${args.bcpId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Business Continuity Program Manager',
      task: 'Initialize Business Continuity Planning program and establish governance',
      context: {
        bcpId: args.bcpId,
        organizationName: args.organizationName,
        businessUnits: args.businessUnits,
        scope: args.scope,
        complianceRequirements: args.complianceRequirements,
        stakeholders: args.stakeholders,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define BCP program scope and objectives',
        '2. Establish BCP governance structure (steering committee, working groups)',
        '3. Identify and assign BCP Owner/Program Manager',
        '4. Define steering committee membership (executives, business unit leaders)',
        '5. Identify key stakeholders across organization',
        '6. Define BCP policy and guiding principles',
        '7. Establish BCP program budget and resources',
        '8. Define success criteria and KPIs',
        '9. Create program charter document',
        '10. Establish communication and reporting structure',
        '11. Define roles: BCP Owner, Business Unit Coordinators, Technical Leads',
        '12. Obtain executive sponsorship and commitment',
        '13. Create stakeholder engagement plan',
        '14. Document program initialization artifacts'
      ],
      outputFormat: 'JSON object with program initialization details'
    },
    outputSchema: {
      type: 'object',
      required: ['governanceEstablished', 'bcpOwner', 'steeringCommittee', 'stakeholdersIdentified', 'artifacts'],
      properties: {
        governanceEstablished: { type: 'boolean' },
        governanceStructure: { type: 'string', description: 'Description of governance structure' },
        bcpOwner: { type: 'string' },
        steeringCommittee: { type: 'array', items: { type: 'string' } },
        stakeholdersIdentified: { type: 'number' },
        stakeholders: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              role: { type: 'string' },
              businessUnit: { type: 'string' },
              contactInfo: { type: 'string' }
            }
          }
        },
        programCharter: { type: 'string' },
        bcpPolicy: { type: 'string' },
        scopeDefinition: { type: 'string' },
        successCriteria: { type: 'array', items: { type: 'string' } },
        budgetAllocated: { type: 'string' },
        executiveSponsor: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-continuity', 'initialization']
}));

// Phase 2: Business Impact Analysis
export const businessImpactAnalysisTask = defineTask('business-impact-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Business Impact Analysis - ${args.bcpId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Business Impact Analysis Specialist',
      task: 'Conduct comprehensive business impact analysis to identify critical business processes and functions',
      context: {
        bcpId: args.bcpId,
        organizationName: args.organizationName,
        businessUnits: args.businessUnits,
        criticalSystems: args.criticalSystems,
        rpo: args.rpo,
        rto: args.rto,
        maxTolerableDowntime: args.maxTolerableDowntime,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify all business processes and functions across organization',
        '2. Assess criticality of each process (mission-critical, essential, important, non-critical)',
        '3. Determine dependencies between processes and systems',
        '4. Identify upstream and downstream dependencies',
        '5. Assess financial impact of process disruption (revenue loss, penalties, recovery costs)',
        '6. Calculate hourly/daily financial impact for each critical process',
        '7. Assess operational impact (service delivery, customer satisfaction, productivity)',
        '8. Evaluate regulatory and compliance impact of disruption',
        '9. Assess reputation and brand impact',
        '10. Determine Maximum Tolerable Downtime (MTD) for each process',
        '11. Define Recovery Time Objective (RTO) for each process',
        '12. Define Recovery Point Objective (RPO) for data-dependent processes',
        '13. Identify minimum resources required for process recovery',
        '14. Prioritize processes by business criticality and time sensitivity',
        '15. Document BIA findings with quantitative impact assessments',
        '16. Create BIA report with process prioritization matrix'
      ],
      outputFormat: 'JSON object with business impact analysis findings'
    },
    outputSchema: {
      type: 'object',
      required: ['criticalProcesses', 'totalFinancialImpact', 'rtoCompliance', 'artifacts'],
      properties: {
        criticalProcesses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              processName: { type: 'string' },
              businessUnit: { type: 'string' },
              priority: { type: 'string', enum: ['mission-critical', 'essential', 'important', 'non-critical'] },
              financialImpact: { type: 'string', description: 'Financial impact per hour/day' },
              operationalImpact: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              complianceImpact: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'none'] },
              reputationImpact: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'none'] },
              mtd: { type: 'string', description: 'Maximum Tolerable Downtime' },
              rto: { type: 'string', description: 'Recovery Time Objective' },
              rpo: { type: 'string', description: 'Recovery Point Objective' },
              dependencies: { type: 'array', items: { type: 'string' } },
              minimumResources: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        totalFinancialImpact: { type: 'string' },
        processCount: { type: 'number' },
        missionCriticalCount: { type: 'number' },
        rtoCompliance: { type: 'boolean', description: 'Can target RTO be met?' },
        rpoCompliance: { type: 'boolean', description: 'Can target RPO be met?' },
        dependencyMap: { type: 'string', description: 'Path to dependency visualization' },
        biaReportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-continuity', 'bia']
}));

// Phase 3: Risk Assessment
export const riskAssessmentTask = defineTask('risk-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Risk Assessment and Threat Identification - ${args.bcpId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Risk Assessment Specialist',
      task: 'Identify and assess threats and risks to business continuity',
      context: {
        bcpId: args.bcpId,
        organizationName: args.organizationName,
        businessUnits: args.businessUnits,
        criticalSystems: args.criticalSystems,
        criticalProcesses: args.criticalProcesses,
        geographicScope: args.geographicScope,
        businessImpactAnalysis: args.businessImpactAnalysis,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify natural disaster threats (earthquake, flood, hurricane, wildfire, tornado)',
        '2. Identify technology threats (hardware failure, software failure, cyber attack, data loss)',
        '3. Identify infrastructure threats (power outage, telecom failure, building damage)',
        '4. Identify human threats (key personnel loss, insider threat, terrorism, civil unrest)',
        '5. Identify supply chain threats (vendor failure, logistics disruption)',
        '6. Identify pandemic/health crisis threats',
        '7. Assess geographic-specific risks based on facility locations',
        '8. Assess likelihood of each threat (rare, unlikely, possible, likely, almost certain)',
        '9. Assess consequence/impact of each threat (insignificant, minor, moderate, major, catastrophic)',
        '10. Calculate risk level = likelihood × impact',
        '11. Prioritize risks as Critical, High, Medium, Low',
        '12. Identify existing controls and mitigation measures',
        '13. Assess residual risk after controls',
        '14. Identify risk treatment options (accept, mitigate, transfer, avoid)',
        '15. Create risk register with all identified threats',
        '16. Generate risk heat map visualization',
        '17. Document risk assessment findings'
      ],
      outputFormat: 'JSON object with risk assessment findings'
    },
    outputSchema: {
      type: 'object',
      required: ['threats', 'topThreats', 'riskRegisterPath', 'artifacts'],
      properties: {
        threats: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              category: { type: 'string', enum: ['natural-disaster', 'technology', 'infrastructure', 'human', 'supply-chain', 'health', 'other'] },
              description: { type: 'string' },
              likelihood: { type: 'string', enum: ['rare', 'unlikely', 'possible', 'likely', 'almost-certain'] },
              impact: { type: 'string', enum: ['insignificant', 'minor', 'moderate', 'major', 'catastrophic'] },
              riskLevel: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
              riskScore: { type: 'number' },
              affectedProcesses: { type: 'array', items: { type: 'string' } },
              existingControls: { type: 'array', items: { type: 'string' } },
              residualRisk: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
              treatment: { type: 'string', enum: ['accept', 'mitigate', 'transfer', 'avoid'] }
            }
          }
        },
        topThreats: { type: 'array', items: { type: 'string' } },
        threatsByCategoryCount: { type: 'object' },
        criticalRisksCount: { type: 'number' },
        highRisksCount: { type: 'number' },
        riskRegisterPath: { type: 'string' },
        riskHeatMapPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-continuity', 'risk-assessment']
}));

// Phase 4.1: Recovery Strategies
export const recoveryStrategiesTask = defineTask('recovery-strategies', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Recovery Strategies Development - ${args.bcpId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Business Continuity Recovery Strategist',
      task: 'Develop recovery strategies for critical business processes',
      context: {
        bcpId: args.bcpId,
        organizationName: args.organizationName,
        criticalProcesses: args.criticalProcesses,
        criticalSystems: args.criticalSystems,
        businessImpactAnalysis: args.businessImpactAnalysis,
        riskAssessment: args.riskAssessment,
        rto: args.rto,
        rpo: args.rpo,
        budgetConstraints: args.budgetConstraints,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Develop recovery strategies for each mission-critical process',
        '2. Identify manual workaround procedures when technology unavailable',
        '3. Define alternate process workflows for degraded operations',
        '4. Identify alternate suppliers and vendors',
        '5. Define work from home / remote work strategies',
        '6. Identify alternate work sites and facilities',
        '7. Define technology recovery strategies (failover, backup systems, cloud recovery)',
        '8. Define data recovery strategies aligned with RPO',
        '9. Identify critical personnel backup and cross-training needs',
        '10. Define communication strategies during disruption',
        '11. Assess cost vs. benefit for each strategy',
        '12. Validate strategies meet RTO/RPO requirements',
        '13. Identify resource requirements (people, technology, facilities)',
        '14. Document recovery strategy for each critical process',
        '15. Estimate total cost for all recovery strategies',
        '16. Create recovery strategy summary matrix'
      ],
      outputFormat: 'JSON object with recovery strategies'
    },
    outputSchema: {
      type: 'object',
      required: ['strategiesCount', 'rtoAchievable', 'estimatedTotalCost', 'artifacts'],
      properties: {
        strategiesCount: { type: 'number' },
        strategies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              processName: { type: 'string' },
              primaryStrategy: { type: 'string' },
              manualWorkarounds: { type: 'array', items: { type: 'string' } },
              alternateWorkflows: { type: 'array', items: { type: 'string' } },
              technologyRecovery: { type: 'string' },
              dataRecovery: { type: 'string' },
              resourceRequirements: { type: 'array', items: { type: 'string' } },
              estimatedCost: { type: 'string' },
              rtoTarget: { type: 'string' },
              rtoAchievable: { type: 'boolean' },
              dependencies: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        rtoAchievable: { type: 'boolean' },
        estimatedTotalCost: { type: 'string' },
        costBreakdown: { type: 'object' },
        strategyMatrixPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-continuity', 'recovery-strategies']
}));

// Phase 4.2: Alternative Sites
export const alternativeSitesTask = defineTask('alternative-sites', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Alternative Sites and Facilities Planning - ${args.bcpId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Facilities Continuity Planner',
      task: 'Identify and plan alternative work sites and facilities',
      context: {
        bcpId: args.bcpId,
        organizationName: args.organizationName,
        businessUnits: args.businessUnits,
        criticalProcesses: args.criticalProcesses,
        geographicScope: args.geographicScope,
        budgetConstraints: args.budgetConstraints,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify alternative work site requirements based on critical processes',
        '2. Assess current facility locations and vulnerabilities',
        '3. Identify hot site options (fully equipped, ready to use)',
        '4. Identify warm site options (partially equipped, requires setup)',
        '5. Identify cold site options (empty space, requires full setup)',
        '6. Assess work from home / remote work capabilities',
        '7. Identify reciprocal agreements with partner organizations',
        '8. Assess mobile/portable facilities options',
        '9. Evaluate geographic dispersion to avoid common threats',
        '10. Assess capacity requirements for each site',
        '11. Evaluate technology infrastructure at alternate sites',
        '12. Assess security and access control requirements',
        '13. Evaluate cost for each alternative site option',
        '14. Compare options and recommend optimal solution',
        '15. Document site selection criteria and decisions'
      ],
      outputFormat: 'JSON object with alternative sites plan'
    },
    outputSchema: {
      type: 'object',
      required: ['sitesIdentified', 'recommendedApproach', 'artifacts'],
      properties: {
        sitesIdentified: { type: 'number' },
        alternateSites: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              siteName: { type: 'string' },
              type: { type: 'string', enum: ['hot-site', 'warm-site', 'cold-site', 'work-from-home', 'reciprocal', 'mobile'] },
              location: { type: 'string' },
              capacity: { type: 'string' },
              capabilities: { type: 'array', items: { type: 'string' } },
              readinessTime: { type: 'string' },
              cost: { type: 'string' },
              supportedProcesses: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        recommendedApproach: { type: 'string' },
        workFromHomeCapable: { type: 'boolean' },
        totalEstimatedCost: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-continuity', 'alternative-sites']
}));

// Phase 4.3: Data Backup Strategy
export const dataBackupStrategyTask = defineTask('data-backup-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Data Backup Strategy Development - ${args.bcpId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Protection Specialist',
      task: 'Develop comprehensive data backup and recovery strategy',
      context: {
        bcpId: args.bcpId,
        organizationName: args.organizationName,
        criticalSystems: args.criticalSystems,
        rpo: args.rpo,
        rto: args.rto,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify all critical data and databases',
        '2. Classify data by criticality (mission-critical, essential, important)',
        '3. Define backup frequency for each data classification (continuous, hourly, daily, weekly)',
        '4. Define backup types (full, incremental, differential)',
        '5. Implement 3-2-1 backup rule: 3 copies, 2 different media, 1 offsite',
        '6. Define offsite/cloud backup strategy',
        '7. Define backup retention policies',
        '8. Assess backup infrastructure capacity and performance',
        '9. Define backup monitoring and verification procedures',
        '10. Test restore procedures and validate recoverability',
        '11. Calculate if RPO requirements can be met with proposed strategy',
        '12. Define backup security (encryption at rest and in transit)',
        '13. Document backup runbooks and procedures',
        '14. Estimate backup infrastructure costs'
      ],
      outputFormat: 'JSON object with backup strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['backupTier', 'rpoAchievable', 'artifacts'],
      properties: {
        backupTier: { type: 'string', enum: ['tier-0-continuous', 'tier-1-hourly', 'tier-2-daily', 'tier-3-weekly'] },
        backupFrequency: { type: 'string' },
        backupTypes: { type: 'array', items: { type: 'string' } },
        offsiteBackup: { type: 'boolean' },
        cloudBackup: { type: 'boolean' },
        encryptionEnabled: { type: 'boolean' },
        rpoAchievable: { type: 'boolean' },
        rtoAchievable: { type: 'boolean' },
        retentionPolicy: { type: 'string' },
        backupLocations: { type: 'array', items: { type: 'string' } },
        estimatedCost: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-continuity', 'backup-strategy']
}));

// Phase 5: Disaster Recovery Plan
export const disasterRecoveryPlanTask = defineTask('disaster-recovery-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Disaster Recovery Plans Development - ${args.bcpId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Disaster Recovery Specialist',
      task: 'Develop comprehensive disaster recovery plans for IT systems',
      context: {
        bcpId: args.bcpId,
        organizationName: args.organizationName,
        criticalSystems: args.criticalSystems,
        dataBackupStrategy: args.dataBackupStrategy,
        recoveryStrategies: args.recoveryStrategies,
        rto: args.rto,
        rpo: args.rpo,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create DR plan for each critical system',
        '2. Define system recovery priority based on business criticality',
        '3. Document pre-disaster preparation steps',
        '4. Define disaster declaration criteria',
        '5. Document step-by-step recovery procedures',
        '6. Define failover procedures for redundant systems',
        '7. Document data restoration procedures',
        '8. Define system validation and testing after recovery',
        '9. Document rollback procedures if recovery fails',
        '10. Identify required recovery tools and resources',
        '11. Define DR team roles and responsibilities',
        '12. Create detailed DR runbooks for each system',
        '13. Document dependencies and recovery order',
        '14. Define success criteria for recovery',
        '15. Include troubleshooting guides'
      ],
      outputFormat: 'JSON object with disaster recovery plans'
    },
    outputSchema: {
      type: 'object',
      required: ['drPlansCreated', 'systemsCovered', 'drRunbooksPath', 'artifacts'],
      properties: {
        drPlansCreated: { type: 'number' },
        systemsCovered: { type: 'number' },
        drPlans: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              systemName: { type: 'string' },
              priority: { type: 'string', enum: ['p0-mission-critical', 'p1-essential', 'p2-important', 'p3-normal'] },
              rto: { type: 'string' },
              rpo: { type: 'string' },
              recoveryStrategy: { type: 'string', enum: ['failover', 'restore-from-backup', 'rebuild', 'manual-recovery'] },
              dependencies: { type: 'array', items: { type: 'string' } },
              drTeam: { type: 'array', items: { type: 'string' } },
              runbookPath: { type: 'string' }
            }
          }
        },
        drRunbooksPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-continuity', 'disaster-recovery']
}));

// Phase 6: Crisis Management
export const crisisManagementTask = defineTask('crisis-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Crisis Management and Communication Planning - ${args.bcpId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Crisis Management Specialist',
      task: 'Develop crisis management and communication plans',
      context: {
        bcpId: args.bcpId,
        organizationName: args.organizationName,
        businessUnits: args.businessUnits,
        stakeholders: args.stakeholders,
        riskAssessment: args.riskAssessment,
        programInitialization: args.programInitialization,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define crisis management team structure',
        '2. Identify Crisis Management Team (CMT) members and roles',
        '3. Define crisis severity levels and escalation criteria',
        '4. Develop crisis decision-making framework',
        '5. Create crisis communication plan for internal stakeholders',
        '6. Create communication plan for external stakeholders (customers, media, regulators)',
        '7. Develop communication templates for different crisis scenarios',
        '8. Define media relations and public relations procedures',
        '9. Create stakeholder notification lists and contact trees',
        '10. Define crisis command center setup and operation',
        '11. Develop crisis management procedures for different scenarios',
        '12. Define log keeping and documentation during crisis',
        '13. Create crisis status reporting templates',
        '14. Define escalation procedures to executives and board',
        '15. Document crisis management workflows'
      ],
      outputFormat: 'JSON object with crisis management plans'
    },
    outputSchema: {
      type: 'object',
      required: ['crisisScenariosPlanned', 'communicationTemplates', 'escalationProceduresPath', 'artifacts'],
      properties: {
        crisisScenariosPlanned: { type: 'number' },
        crisisManagementTeam: { type: 'array', items: { type: 'string' } },
        severityLevels: { type: 'array', items: { type: 'string' } },
        communicationTemplates: { type: 'number' },
        stakeholderGroups: { type: 'array', items: { type: 'string' } },
        escalationProceduresPath: { type: 'string' },
        crisisCommandCenterLocation: { type: 'string' },
        mediaRelationsProcedures: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-continuity', 'crisis-management']
}));

// Phase 7: Incident Response Procedures
export const incidentResponseProceduresTask = defineTask('incident-response-procedures', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Incident Response Procedures Development - ${args.bcpId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Incident Response Coordinator',
      task: 'Develop incident response procedures and playbooks',
      context: {
        bcpId: args.bcpId,
        organizationName: args.organizationName,
        criticalProcesses: args.criticalProcesses,
        riskAssessment: args.riskAssessment,
        recoveryStrategies: args.recoveryStrategies,
        crisisManagement: args.crisisManagement,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Develop incident response playbooks for each threat scenario',
        '2. Define incident detection and notification procedures',
        '3. Document initial assessment and triage procedures',
        '4. Define incident classification and severity determination',
        '5. Create response procedures for each incident type',
        '6. Define incident escalation triggers and procedures',
        '7. Document recovery activation criteria',
        '8. Create checklists for immediate response actions',
        '9. Define roles and responsibilities during incidents',
        '10. Document coordination with external parties (emergency services, vendors)',
        '11. Define incident logging and documentation requirements',
        '12. Create status reporting templates and cadence',
        '13. Define incident closure and post-incident review procedures',
        '14. Include decision trees for common scenarios'
      ],
      outputFormat: 'JSON object with incident response procedures'
    },
    outputSchema: {
      type: 'object',
      required: ['playbooksCreated', 'playbooksPath', 'artifacts'],
      properties: {
        playbooksCreated: { type: 'number' },
        playbooks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenario: { type: 'string' },
              threatType: { type: 'string' },
              severity: { type: 'string' },
              responseSteps: { type: 'array', items: { type: 'string' } },
              escalationTriggers: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        playbooksPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-continuity', 'incident-response']
}));

// Phase 8: BCP Documentation
export const bcpDocumentationTask = defineTask('bcp-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: BCP Documentation Creation - ${args.bcpId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Business Continuity Documentation Specialist',
      task: 'Create comprehensive Business Continuity Plan documentation',
      context: {
        bcpId: args.bcpId,
        organizationName: args.organizationName,
        scope: args.scope,
        programInitialization: args.programInitialization,
        businessImpactAnalysis: args.businessImpactAnalysis,
        riskAssessment: args.riskAssessment,
        recoveryStrategies: args.recoveryStrategies,
        alternativeSites: args.alternativeSites,
        dataBackupStrategy: args.dataBackupStrategy,
        disasterRecovery: args.disasterRecovery,
        crisisManagement: args.crisisManagement,
        incidentResponseProcedures: args.incidentResponseProcedures,
        complianceRequirements: args.complianceRequirements,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create comprehensive BCP master document in Markdown format',
        '2. Include executive summary with key objectives and scope',
        '3. Document BCP governance structure and roles',
        '4. Include BIA findings with critical processes prioritization',
        '5. Document risk assessment with threat analysis',
        '6. Detail recovery strategies for each critical process',
        '7. Document alternative site and facility plans',
        '8. Include data backup and recovery procedures',
        '9. Integrate disaster recovery plans',
        '10. Include crisis management and communication plans',
        '11. Document incident response procedures and playbooks',
        '12. Include organizational charts and contact lists',
        '13. Add appendices with detailed runbooks and checklists',
        '14. Document version control and maintenance procedures',
        '15. Ensure document meets compliance requirements',
        '16. Create quick reference guides for key personnel',
        '17. Format document professionally with clear navigation'
      ],
      outputFormat: 'JSON object with BCP documentation details'
    },
    outputSchema: {
      type: 'object',
      required: ['mainDocumentPath', 'sectionsCount', 'appendicesCount', 'artifacts'],
      properties: {
        mainDocumentPath: { type: 'string' },
        sectionsCount: { type: 'number' },
        appendicesCount: { type: 'number' },
        pageCount: { type: 'number' },
        sections: { type: 'array', items: { type: 'string' } },
        complianceAlignment: { type: 'object' },
        quickReferenceGuidePath: { type: 'string' },
        versionNumber: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-continuity', 'documentation']
}));

// Phase 9: Roles and Responsibilities
export const rolesResponsibilitiesTask = defineTask('roles-responsibilities', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Roles and Responsibilities Definition - ${args.bcpId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Organizational Design Specialist',
      task: 'Define detailed roles and responsibilities for business continuity',
      context: {
        bcpId: args.bcpId,
        organizationName: args.organizationName,
        businessUnits: args.businessUnits,
        criticalProcesses: args.criticalProcesses,
        programInitialization: args.programInitialization,
        crisisManagement: args.crisisManagement,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define BCP Owner role and responsibilities',
        '2. Define Business Continuity Manager responsibilities',
        '3. Define Business Unit Coordinator roles for each unit',
        '4. Define Crisis Management Team roles',
        '5. Define Disaster Recovery Team roles',
        '6. Define damage assessment team roles',
        '7. Define salvage and recovery team roles',
        '8. Define IT recovery team roles',
        '9. Define communications team roles',
        '10. Define alternate site setup team roles',
        '11. Assign primary and backup personnel for each role',
        '12. Create detailed RACI matrix (Responsible, Accountable, Consulted, Informed)',
        '13. Document role-specific responsibilities and authorities',
        '14. Create emergency contact lists with 24/7 contact information',
        '15. Define succession planning for key roles'
      ],
      outputFormat: 'JSON object with roles and responsibilities'
    },
    outputSchema: {
      type: 'object',
      required: ['teamsDefinedCount', 'rolesAssignedCount', 'contactListPath', 'artifacts'],
      properties: {
        teamsDefinedCount: { type: 'number' },
        rolesAssignedCount: { type: 'number' },
        teams: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              teamName: { type: 'string' },
              purpose: { type: 'string' },
              roles: { type: 'array', items: { type: 'object' } }
            }
          }
        },
        raciMatrixPath: { type: 'string' },
        contactListPath: { type: 'string' },
        successionPlanPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-continuity', 'roles']
}));

// Phase 10: Training Program
export const trainingProgramTask = defineTask('training-program', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Training and Awareness Program Development - ${args.bcpId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Training and Development Specialist',
      task: 'Develop comprehensive BCP training and awareness program',
      context: {
        bcpId: args.bcpId,
        organizationName: args.organizationName,
        businessUnits: args.businessUnits,
        bcpDocument: args.bcpDocument,
        rolesResponsibilities: args.rolesResponsibilities,
        incidentResponseProcedures: args.incidentResponseProcedures,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Develop BCP awareness training for all employees',
        '2. Create role-specific training for BCP team members',
        '3. Develop Crisis Management Team training',
        '4. Create Disaster Recovery Team technical training',
        '5. Develop training on incident response procedures',
        '6. Create training modules with presentations and materials',
        '7. Develop interactive scenarios and case studies',
        '8. Create quick reference guides and job aids',
        '9. Define training delivery methods (classroom, e-learning, hands-on)',
        '10. Define training schedule and frequency',
        '11. Create training assessment and competency validation',
        '12. Develop BCP awareness communications campaign',
        '13. Define training record keeping and tracking',
        '14. Create new hire BCP orientation materials'
      ],
      outputFormat: 'JSON object with training program details'
    },
    outputSchema: {
      type: 'object',
      required: ['trainingModulesCreated', 'targetAudienceSize', 'trainingPlanPath', 'artifacts'],
      properties: {
        trainingModulesCreated: { type: 'number' },
        targetAudienceSize: { type: 'number' },
        trainingModules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              moduleName: { type: 'string' },
              targetAudience: { type: 'string' },
              duration: { type: 'string' },
              deliveryMethod: { type: 'string' },
              frequency: { type: 'string' }
            }
          }
        },
        trainingSchedule: { type: 'string' },
        trainingPlanPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-continuity', 'training']
}));

// Phase 11.1: Test Planning
export const testPlanningTask = defineTask('test-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: BCP Test Planning - ${args.bcpId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'BCP Test Coordinator',
      task: 'Plan comprehensive BCP testing program',
      context: {
        bcpId: args.bcpId,
        organizationName: args.organizationName,
        criticalProcesses: args.criticalProcesses,
        recoveryStrategies: args.recoveryStrategies,
        disasterRecovery: args.disasterRecovery,
        bcpDocument: args.bcpDocument,
        rolesResponsibilities: args.rolesResponsibilities,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define BCP testing objectives and success criteria',
        '2. Plan tabletop exercises for crisis management team',
        '3. Plan structured walkthroughs of recovery procedures',
        '4. Plan simulation exercises for specific scenarios',
        '5. Plan parallel tests (run recovery systems alongside production)',
        '6. Plan full interruption tests (actual failover to recovery)',
        '7. Define test scenarios covering different threat types',
        '8. Define scope and boundaries for each test',
        '9. Identify test participants and observers',
        '10. Create test scripts and scenario descriptions',
        '11. Define test evaluation criteria and metrics',
        '12. Identify business impact of testing',
        '13. Schedule tests to minimize business disruption',
        '14. Create test documentation templates',
        '15. Define test rollback procedures if issues occur'
      ],
      outputFormat: 'JSON object with test planning details'
    },
    outputSchema: {
      type: 'object',
      required: ['testScenariosPlanned', 'testTypes', 'estimatedDuration', 'artifacts'],
      properties: {
        testScenariosPlanned: { type: 'number' },
        testTypes: { type: 'array', items: { type: 'string' } },
        testScenarios: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenarioName: { type: 'string' },
              testType: { type: 'string' },
              scope: { type: 'string' },
              participants: { type: 'array', items: { type: 'string' } },
              duration: { type: 'string' },
              successCriteria: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        estimatedDuration: { type: 'string' },
        estimatedBusinessImpact: { type: 'string' },
        testSchedulePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-continuity', 'test-planning']
}));

// Phase 11.2: Test Execution
export const testExecutionTask = defineTask('test-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: BCP Test Execution - ${args.bcpId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'BCP Test Coordinator',
      task: 'Execute and evaluate BCP tests',
      context: {
        bcpId: args.bcpId,
        organizationName: args.organizationName,
        testPlanning: args.testPlanning,
        criticalProcesses: args.criticalProcesses,
        recoveryStrategies: args.recoveryStrategies,
        rolesResponsibilities: args.rolesResponsibilities,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Execute planned test scenarios (simulate execution)',
        '2. Document test execution with timestamps and observations',
        '3. Evaluate achievement of RTO/RPO objectives',
        '4. Assess effectiveness of recovery procedures',
        '5. Evaluate team performance and coordination',
        '6. Identify gaps in procedures or documentation',
        '7. Document issues and failures encountered',
        '8. Categorize issues by severity (critical, high, medium, low)',
        '9. Assess communication effectiveness during test',
        '10. Evaluate decision-making processes',
        '11. Collect feedback from test participants',
        '12. Generate test results summary for each scenario',
        '13. Calculate overall test success rate',
        '14. Create corrective action items for identified issues',
        '15. Generate comprehensive test report with findings and recommendations'
      ],
      outputFormat: 'JSON object with test execution results'
    },
    outputSchema: {
      type: 'object',
      required: ['testsExecuted', 'testsPassed', 'testsFailed', 'successRate', 'summaryReportPath', 'artifacts'],
      properties: {
        testsExecuted: { type: 'number' },
        testsPassed: { type: 'number' },
        testsFailed: { type: 'number' },
        successRate: { type: 'number', description: 'Percentage of tests passed' },
        issuesIdentified: { type: 'number' },
        criticalIssues: { type: 'number' },
        testResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenarioName: { type: 'string' },
              testType: { type: 'string' },
              result: { type: 'string', enum: ['passed', 'passed-with-issues', 'failed'] },
              rtoAchieved: { type: 'boolean' },
              rpoAchieved: { type: 'boolean' },
              issuesFound: { type: 'array', items: { type: 'string' } },
              recommendations: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        correctiveActions: { type: 'array', items: { type: 'object' } },
        summaryReportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-continuity', 'test-execution']
}));

// Phase 12: Maintenance Procedures
export const maintenanceProceduresTask = defineTask('maintenance-procedures', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Maintenance and Review Procedures - ${args.bcpId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'BCP Maintenance Coordinator',
      task: 'Establish BCP maintenance and review procedures',
      context: {
        bcpId: args.bcpId,
        organizationName: args.organizationName,
        bcpDocument: args.bcpDocument,
        testResults: args.testResults,
        complianceRequirements: args.complianceRequirements,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define BCP review and update schedule (annual, semi-annual, quarterly)',
        '2. Identify triggers for BCP updates (organizational changes, new threats, test findings)',
        '3. Define change management process for BCP updates',
        '4. Establish version control and document management procedures',
        '5. Define process for updating contact information',
        '6. Create procedure for incorporating lessons learned from tests',
        '7. Define procedure for incorporating lessons from actual incidents',
        '8. Establish BCP audit and compliance review schedule',
        '9. Define process for reviewing and updating risk assessments',
        '10. Create procedure for validating recovery strategies remain viable',
        '11. Define process for reviewing and renewing vendor contracts',
        '12. Establish metrics tracking and reporting procedures',
        '13. Define quality assurance review process',
        '14. Create BCP maintenance calendar with all scheduled activities'
      ],
      outputFormat: 'JSON object with maintenance procedures'
    },
    outputSchema: {
      type: 'object',
      required: ['reviewCycle', 'updateTriggersCount', 'maintenancePlanPath', 'artifacts'],
      properties: {
        reviewCycle: { type: 'string', description: 'How often BCP is formally reviewed' },
        updateTriggersCount: { type: 'number' },
        updateTriggers: { type: 'array', items: { type: 'string' } },
        maintenanceActivities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              activity: { type: 'string' },
              frequency: { type: 'string' },
              owner: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        versionControl: { type: 'string' },
        auditSchedule: { type: 'string' },
        maintenancePlanPath: { type: 'string' },
        maintenanceCalendarPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-continuity', 'maintenance']
}));

// Phase 13: Compliance Validation
export const complianceValidationTask = defineTask('compliance-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 13: Compliance Validation - ${args.bcpId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Compliance Validation Specialist',
      task: 'Validate BCP compliance with regulatory and industry requirements',
      context: {
        bcpId: args.bcpId,
        organizationName: args.organizationName,
        complianceRequirements: args.complianceRequirements,
        bcpDocument: args.bcpDocument,
        businessImpactAnalysis: args.businessImpactAnalysis,
        riskAssessment: args.riskAssessment,
        testResults: args.testResults,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Map BCP components to compliance requirements (ISO 22301, SOC2, GDPR, etc.)',
        '2. Validate BCP scope meets compliance requirements',
        '3. Check BIA meets regulatory documentation requirements',
        '4. Validate risk assessment completeness and methodology',
        '5. Check recovery strategies align with compliance standards',
        '6. Validate testing requirements are met',
        '7. Check documentation standards compliance',
        '8. Validate roles and responsibilities meet requirements',
        '9. Check training and awareness requirements',
        '10. Validate maintenance and review procedures',
        '11. Identify any compliance gaps or deficiencies',
        '12. Generate compliance mapping matrix',
        '13. Create gap remediation plan for identified deficiencies',
        '14. Generate compliance validation report'
      ],
      outputFormat: 'JSON object with compliance validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['requirementsMet', 'totalRequirements', 'gapsIdentified', 'complianceReportPath', 'artifacts'],
      properties: {
        requirementsMet: { type: 'number' },
        totalRequirements: { type: 'number' },
        gapsIdentified: { type: 'number' },
        complianceMapping: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              framework: { type: 'string' },
              requirement: { type: 'string' },
              status: { type: 'string', enum: ['met', 'partially-met', 'not-met'] },
              evidence: { type: 'string' },
              gap: { type: 'string' }
            }
          }
        },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              framework: { type: 'string' },
              requirement: { type: 'string' },
              gap: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              remediation: { type: 'string' }
            }
          }
        },
        complianceScore: { type: 'number', description: 'Percentage of requirements met' },
        complianceReportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-continuity', 'compliance']
}));

// Phase 14: Executive Report
export const executiveReportTask = defineTask('executive-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 14: Executive Summary and Reporting - ${args.bcpId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Executive Communications Specialist',
      task: 'Generate executive summary and final BCP reports',
      context: {
        bcpId: args.bcpId,
        organizationName: args.organizationName,
        scope: args.scope,
        startTime: args.startTime,
        programInitialization: args.programInitialization,
        businessImpactAnalysis: args.businessImpactAnalysis,
        riskAssessment: args.riskAssessment,
        recoveryStrategies: args.recoveryStrategies,
        disasterRecovery: args.disasterRecovery,
        crisisManagement: args.crisisManagement,
        bcpDocument: args.bcpDocument,
        testResults: args.testResults,
        complianceValidation: args.complianceValidation,
        maintenanceProcedures: args.maintenanceProcedures,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Write executive summary for board and senior leadership',
        '2. Highlight BCP program objectives and scope',
        '3. Summarize critical business processes and dependencies',
        '4. Present key risk findings and top threats',
        '5. Summarize recovery strategies and capabilities',
        '6. Present RTO/RPO compliance status',
        '7. Summarize testing results and readiness',
        '8. Present compliance validation status',
        '9. Highlight investment required and cost-benefit analysis',
        '10. Present BCP readiness score and maturity level',
        '11. Outline implementation plan and timeline',
        '12. Present key recommendations and next steps',
        '13. Include supporting metrics and KPIs',
        '14. Format as professional executive presentation',
        '15. Create one-page executive summary',
        '16. Generate comprehensive final report'
      ],
      outputFormat: 'JSON object with executive report'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'recommendation', 'bcpReadinessScore', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummaryPath: { type: 'string' },
        bcpReadinessScore: { type: 'number', minimum: 0, maximum: 100 },
        maturityLevel: { type: 'string', enum: ['initial', 'developing', 'defined', 'managed', 'optimized'] },
        keyFindings: { type: 'array', items: { type: 'string' } },
        topRisks: { type: 'array', items: { type: 'string' } },
        investmentRequired: { type: 'string' },
        timelineEstimate: { type: 'string' },
        recommendation: { type: 'string' },
        metrics: {
          type: 'object',
          properties: {
            criticalProcessesCovered: { type: 'number' },
            threatsAssessed: { type: 'number' },
            recoveryStrategies: { type: 'number' },
            testSuccessRate: { type: 'number' },
            complianceScore: { type: 'number' }
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
  labels: ['agent', 'business-continuity', 'executive-report']
}));

// Phase 15: Implementation Plan
export const implementationPlanTask = defineTask('implementation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 15: Implementation Planning - ${args.bcpId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'BCP Implementation Manager',
      task: 'Create detailed BCP implementation and deployment plan',
      context: {
        bcpId: args.bcpId,
        organizationName: args.organizationName,
        businessUnits: args.businessUnits,
        bcpDocument: args.bcpDocument,
        trainingProgram: args.trainingProgram,
        rolesResponsibilities: args.rolesResponsibilities,
        maintenanceProcedures: args.maintenanceProcedures,
        complianceValidation: args.complianceValidation,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define BCP implementation phases and milestones',
        '2. Create detailed implementation timeline',
        '3. Identify dependencies between implementation activities',
        '4. Define Phase 1: BCP Approval and Communication',
        '5. Define Phase 2: Training Rollout',
        '6. Define Phase 3: Technology and Infrastructure Setup',
        '7. Define Phase 4: Process Integration',
        '8. Define Phase 5: Initial Testing',
        '9. Define Phase 6: Full Operational Capability',
        '10. Assign owners and resources for each phase',
        '11. Define success criteria for each phase',
        '12. Identify risks to implementation and mitigation',
        '13. Define change management approach',
        '14. Create implementation tracking and reporting plan',
        '15. Define Go-Live criteria and transition plan'
      ],
      outputFormat: 'JSON object with implementation plan'
    },
    outputSchema: {
      type: 'object',
      required: ['implementationPhases', 'estimatedTimeline', 'planPath', 'nextSteps', 'artifacts'],
      properties: {
        implementationPhases: { type: 'number' },
        phases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phaseName: { type: 'string' },
              duration: { type: 'string' },
              activities: { type: 'array', items: { type: 'string' } },
              owner: { type: 'string' },
              successCriteria: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        estimatedTimeline: { type: 'string' },
        implementationRisks: { type: 'array', items: { type: 'object' } },
        resourceRequirements: { type: 'string' },
        nextSteps: { type: 'array', items: { type: 'string' } },
        planPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-continuity', 'implementation']
}));
