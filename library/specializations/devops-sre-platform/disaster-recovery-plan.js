/**
 * @process specializations/devops-sre-platform/disaster-recovery-plan
 * @description Disaster Recovery Plan Creation - Comprehensive process for developing and implementing disaster recovery
 * strategies including business impact analysis, recovery objectives definition (RTO/RPO), backup strategies, failover
 * procedures, and recovery testing. Ensures business continuity through documented recovery procedures and automated
 * disaster recovery mechanisms.
 * @inputs { projectName: string, infrastructure?: string, criticalSystems?: array, dataRetention?: number, complianceRequirements?: array }
 * @outputs { success: boolean, rpo: number, rto: number, recoveryStrategies: array, testingSchedule: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/devops-sre-platform/disaster-recovery-plan', {
 *   projectName: 'E-commerce Platform DR Plan',
 *   infrastructure: 'multi-cloud',
 *   criticalSystems: ['payment-processor', 'order-management', 'customer-database', 'inventory-system'],
 *   dataRetention: 90,
 *   complianceRequirements: ['PCI-DSS', 'SOC2', 'GDPR'],
 *   businessContinuityRequirements: {
 *     maxDowntimeMinutes: 60,
 *     maxDataLossMinutes: 15
 *   }
 * });
 *
 * @references
 * - NIST Disaster Recovery Guide: https://www.nist.gov/publications/contingency-planning-guide-federal-information-systems
 * - AWS Disaster Recovery: https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/
 * - Azure Business Continuity: https://learn.microsoft.com/en-us/azure/reliability/
 * - Google Cloud DR Planning: https://cloud.google.com/architecture/dr-scenarios-planning-guide
 * - ISO 22301 Business Continuity: https://www.iso.org/standard/75106.html
 * - Site Reliability Engineering: https://sre.google/workbook/implementing-slos/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    infrastructure = 'cloud', // 'cloud', 'on-premise', 'hybrid', 'multi-cloud'
    criticalSystems = [],
    dataRetention = 30, // days
    complianceRequirements = [],
    businessContinuityRequirements = {
      maxDowntimeMinutes: 240,
      maxDataLossMinutes: 60
    },
    environment = 'production',
    cloudProviders = ['aws'], // ['aws', 'azure', 'gcp']
    disasterScenarios = ['region-outage', 'datacenter-failure', 'cyber-attack', 'natural-disaster'],
    backupStrategy = 'automated', // 'automated', 'manual', 'hybrid'
    testingFrequency = 'quarterly', // 'monthly', 'quarterly', 'semi-annual', 'annual'
    outputDir = 'disaster-recovery-output',
    budgetConstraints = 'moderate' // 'tight', 'moderate', 'flexible'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const recoveryStrategies = [];
  let rto = 0; // Recovery Time Objective in minutes
  let rpo = 0; // Recovery Point Objective in minutes
  let testingSchedule = {};

  ctx.log('info', `Starting Disaster Recovery Plan Creation for ${projectName}`);
  ctx.log('info', `Infrastructure: ${infrastructure}, Environment: ${environment}`);
  ctx.log('info', `Critical Systems: ${criticalSystems.length}, Compliance: ${complianceRequirements.join(', ')}`);

  // ============================================================================
  // PHASE 1: BUSINESS IMPACT ANALYSIS (BIA)
  // ============================================================================

  ctx.log('info', 'Phase 1: Conducting Business Impact Analysis');

  const biaResult = await ctx.task(businessImpactAnalysisTask, {
    projectName,
    criticalSystems,
    businessContinuityRequirements,
    complianceRequirements,
    environment,
    outputDir
  });

  artifacts.push(...biaResult.artifacts);

  ctx.log('info', `Business Impact Analysis complete - ${biaResult.criticalProcesses.length} critical processes identified`);

  // Quality Gate: BIA Review
  await ctx.breakpoint({
    question: `Business Impact Analysis complete. Identified ${biaResult.criticalProcesses.length} critical processes and ${biaResult.dependencies.length} key dependencies. Maximum tolerable downtime: ${biaResult.maxTolerableDowntime} minutes. Review and approve?`,
    title: 'Business Impact Analysis Review',
    context: {
      runId: ctx.runId,
      bia: {
        criticalProcesses: biaResult.criticalProcesses.slice(0, 10),
        maxTolerableDowntime: biaResult.maxTolerableDowntime,
        estimatedFinancialImpact: biaResult.estimatedFinancialImpact,
        complianceImpact: biaResult.complianceImpact
      },
      files: biaResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 2: RISK ASSESSMENT AND THREAT MODELING
  // ============================================================================

  ctx.log('info', 'Phase 2: Conducting risk assessment and threat modeling');

  const riskAssessment = await ctx.task(riskAssessmentTask, {
    projectName,
    infrastructure,
    criticalSystems,
    disasterScenarios,
    biaResult,
    cloudProviders,
    outputDir
  });

  artifacts.push(...riskAssessment.artifacts);

  ctx.log('info', `Risk Assessment complete - ${riskAssessment.identifiedRisks.length} risks identified, ${riskAssessment.criticalRisks.length} critical`);

  // Quality Gate: Risk Assessment Review
  await ctx.breakpoint({
    question: `Risk Assessment identified ${riskAssessment.criticalRisks.length} critical risks requiring immediate attention. Top risks: ${riskAssessment.topRisks.slice(0, 3).join(', ')}. Review risk mitigation strategies?`,
    title: 'Risk Assessment Review',
    context: {
      runId: ctx.runId,
      riskAssessment: {
        totalRisks: riskAssessment.identifiedRisks.length,
        criticalRisks: riskAssessment.criticalRisks.length,
        topRisks: riskAssessment.topRisks.slice(0, 5),
        riskScore: riskAssessment.overallRiskScore
      },
      files: riskAssessment.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 3: DEFINE RTO AND RPO OBJECTIVES
  // ============================================================================

  ctx.log('info', 'Phase 3: Defining Recovery Time Objective (RTO) and Recovery Point Objective (RPO)');

  const objectivesResult = await ctx.task(defineRecoveryObjectivesTask, {
    projectName,
    biaResult,
    riskAssessment,
    businessContinuityRequirements,
    criticalSystems,
    budgetConstraints,
    outputDir
  });

  artifacts.push(...objectivesResult.artifacts);

  rto = objectivesResult.rto;
  rpo = objectivesResult.rpo;

  ctx.log('info', `Recovery objectives defined - RTO: ${rto} minutes, RPO: ${rpo} minutes`);

  // Quality Gate: RTO/RPO Approval
  await ctx.breakpoint({
    question: `Recovery objectives defined - RTO: ${rto} minutes, RPO: ${rpo} minutes. These objectives require ${objectivesResult.estimatedCost}/month. Budget: ${budgetConstraints}. Approve objectives?`,
    title: 'RTO/RPO Objectives Approval',
    context: {
      runId: ctx.runId,
      objectives: {
        rto,
        rpo,
        rtoBySystems: objectivesResult.rtoBySystems,
        rpoBySystems: objectivesResult.rpoBySystems,
        estimatedCost: objectivesResult.estimatedCost,
        costBreakdown: objectivesResult.costBreakdown
      },
      files: objectivesResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 4: BACKUP STRATEGY DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 4: Designing comprehensive backup strategy');

  const backupStrategyResult = await ctx.task(designBackupStrategyTask, {
    projectName,
    infrastructure,
    criticalSystems,
    rpo,
    dataRetention,
    complianceRequirements,
    backupStrategy,
    cloudProviders,
    outputDir
  });

  artifacts.push(...backupStrategyResult.artifacts);
  recoveryStrategies.push({
    type: 'backup',
    details: backupStrategyResult
  });

  ctx.log('info', `Backup strategy designed - ${backupStrategyResult.backupTypes.length} backup types, ${backupStrategyResult.backupFrequency} frequency`);

  // Quality Gate: Backup Strategy Review
  await ctx.breakpoint({
    question: `Backup strategy designed with ${backupStrategyResult.backupTypes.length} backup types: ${backupStrategyResult.backupTypes.join(', ')}. Backup frequency: ${backupStrategyResult.backupFrequency}. Storage required: ${backupStrategyResult.estimatedStorage}. Approve strategy?`,
    title: 'Backup Strategy Review',
    context: {
      runId: ctx.runId,
      backupStrategy: {
        backupTypes: backupStrategyResult.backupTypes,
        backupFrequency: backupStrategyResult.backupFrequency,
        retentionPolicies: backupStrategyResult.retentionPolicies,
        estimatedStorage: backupStrategyResult.estimatedStorage,
        estimatedCost: backupStrategyResult.estimatedCost
      },
      files: backupStrategyResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 5: HIGH AVAILABILITY AND REDUNDANCY DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 5: Designing high availability and redundancy architecture');

  const haRedundancyResult = await ctx.task(designHARedundancyTask, {
    projectName,
    infrastructure,
    criticalSystems,
    rto,
    cloudProviders,
    disasterScenarios,
    budgetConstraints,
    outputDir
  });

  artifacts.push(...haRedundancyResult.artifacts);
  recoveryStrategies.push({
    type: 'high-availability',
    details: haRedundancyResult
  });

  ctx.log('info', `HA/Redundancy architecture designed - Strategy: ${haRedundancyResult.haStrategy}, Redundancy: ${haRedundancyResult.redundancyLevel}`);

  // ============================================================================
  // PHASE 6: FAILOVER AND FAILBACK PROCEDURES
  // ============================================================================

  ctx.log('info', 'Phase 6: Developing failover and failback procedures');

  const failoverProcedures = await ctx.task(developFailoverProceduresTask, {
    projectName,
    infrastructure,
    criticalSystems,
    haRedundancyResult,
    rto,
    cloudProviders,
    outputDir
  });

  artifacts.push(...failoverProcedures.artifacts);
  recoveryStrategies.push({
    type: 'failover',
    details: failoverProcedures
  });

  ctx.log('info', `Failover procedures developed - ${failoverProcedures.procedures.length} procedures, ${failoverProcedures.automationLevel}% automated`);

  // Quality Gate: Failover Procedures Review
  await ctx.breakpoint({
    question: `Failover procedures developed for ${failoverProcedures.procedures.length} systems. Automation level: ${failoverProcedures.automationLevel}%. Manual steps: ${failoverProcedures.manualSteps.length}. Review procedures before implementation?`,
    title: 'Failover Procedures Review',
    context: {
      runId: ctx.runId,
      failover: {
        proceduresCount: failoverProcedures.procedures.length,
        automationLevel: failoverProcedures.automationLevel,
        manualSteps: failoverProcedures.manualSteps.length,
        estimatedFailoverTime: failoverProcedures.estimatedFailoverTime,
        estimatedFailbackTime: failoverProcedures.estimatedFailbackTime
      },
      files: failoverProcedures.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 7: DATA REPLICATION AND SYNCHRONIZATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Designing data replication and synchronization strategy');

  const replicationStrategy = await ctx.task(designReplicationStrategyTask, {
    projectName,
    infrastructure,
    criticalSystems,
    rpo,
    cloudProviders,
    disasterScenarios,
    outputDir
  });

  artifacts.push(...replicationStrategy.artifacts);
  recoveryStrategies.push({
    type: 'replication',
    details: replicationStrategy
  });

  ctx.log('info', `Replication strategy designed - Method: ${replicationStrategy.replicationMethod}, Latency: ${replicationStrategy.replicationLatency}ms`);

  // ============================================================================
  // PHASE 8: RECOVERY RUNBOOKS AND DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Creating recovery runbooks and documentation');

  const runbooksResult = await ctx.task(createRecoveryRunbooksTask, {
    projectName,
    criticalSystems,
    disasterScenarios,
    backupStrategyResult,
    failoverProcedures,
    replicationStrategy,
    rto,
    rpo,
    outputDir
  });

  artifacts.push(...runbooksResult.artifacts);

  ctx.log('info', `Recovery runbooks created - ${runbooksResult.runbooks.length} runbooks covering ${disasterScenarios.length} scenarios`);

  // ============================================================================
  // PHASE 9: INCIDENT COMMAND STRUCTURE AND COMMUNICATION PLAN
  // ============================================================================

  ctx.log('info', 'Phase 9: Establishing incident command structure and communication plan');

  const incidentCommandResult = await ctx.task(establishIncidentCommandTask, {
    projectName,
    criticalSystems,
    disasterScenarios,
    complianceRequirements,
    outputDir
  });

  artifacts.push(...incidentCommandResult.artifacts);

  ctx.log('info', `Incident command structure established - ${incidentCommandResult.roles.length} roles, ${incidentCommandResult.communicationChannels.length} communication channels`);

  // ============================================================================
  // PHASE 10: DISASTER RECOVERY TESTING PLAN
  // ============================================================================

  ctx.log('info', 'Phase 10: Developing disaster recovery testing plan');

  const testingPlanResult = await ctx.task(developDRTestingPlanTask, {
    projectName,
    criticalSystems,
    disasterScenarios,
    testingFrequency,
    rto,
    rpo,
    recoveryStrategies,
    complianceRequirements,
    outputDir
  });

  artifacts.push(...testingPlanResult.artifacts);
  testingSchedule = testingPlanResult.testingSchedule;

  ctx.log('info', `DR testing plan developed - ${testingPlanResult.testScenarios.length} test scenarios, ${testingFrequency} frequency`);

  // Quality Gate: DR Testing Plan Review
  await ctx.breakpoint({
    question: `DR testing plan developed with ${testingPlanResult.testScenarios.length} test scenarios. Testing frequency: ${testingFrequency}. First test scheduled: ${testingPlanResult.firstTestDate}. Approve testing plan?`,
    title: 'DR Testing Plan Review',
    context: {
      runId: ctx.runId,
      testing: {
        testScenariosCount: testingPlanResult.testScenarios.length,
        testingFrequency,
        testTypes: testingPlanResult.testTypes,
        firstTestDate: testingPlanResult.firstTestDate,
        estimatedDuration: testingPlanResult.estimatedTestDuration
      },
      files: testingPlanResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 11: MONITORING AND ALERTING FOR DR READINESS
  // ============================================================================

  ctx.log('info', 'Phase 11: Implementing monitoring and alerting for DR readiness');

  const drMonitoringResult = await ctx.task(implementDRMonitoringTask, {
    projectName,
    criticalSystems,
    backupStrategyResult,
    replicationStrategy,
    rto,
    rpo,
    outputDir
  });

  artifacts.push(...drMonitoringResult.artifacts);

  ctx.log('info', `DR monitoring implemented - ${drMonitoringResult.monitors.length} monitors, ${drMonitoringResult.alerts.length} alerts configured`);

  // ============================================================================
  // PHASE 12: COMPLIANCE AND AUDIT REQUIREMENTS
  // ============================================================================

  ctx.log('info', 'Phase 12: Addressing compliance and audit requirements');

  const complianceResult = await ctx.task(addressComplianceRequirementsTask, {
    projectName,
    complianceRequirements,
    biaResult,
    backupStrategyResult,
    testingPlanResult,
    dataRetention,
    outputDir
  });

  artifacts.push(...complianceResult.artifacts);

  ctx.log('info', `Compliance requirements addressed - ${complianceRequirements.length} frameworks, ${complianceResult.controlsImplemented} controls implemented`);

  // ============================================================================
  // PHASE 13: COST ANALYSIS AND OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 13: Conducting cost analysis and optimization');

  const costAnalysisResult = await ctx.task(analyzeDRCostsTask, {
    projectName,
    backupStrategyResult,
    haRedundancyResult,
    replicationStrategy,
    testingPlanResult,
    budgetConstraints,
    outputDir
  });

  artifacts.push(...costAnalysisResult.artifacts);

  ctx.log('info', `Cost analysis complete - Estimated monthly cost: ${costAnalysisResult.totalMonthlyCost}, Annual: ${costAnalysisResult.totalAnnualCost}`);

  // Quality Gate: Cost Review
  if (costAnalysisResult.budgetExceeded) {
    await ctx.breakpoint({
      question: `DR plan exceeds budget by ${costAnalysisResult.budgetOverage}%. Current: ${costAnalysisResult.totalMonthlyCost}/month, Budget: ${budgetConstraints}. Review cost optimization recommendations?`,
      title: 'DR Cost Budget Review',
      context: {
        runId: ctx.runId,
        costs: {
          totalMonthlyCost: costAnalysisResult.totalMonthlyCost,
          totalAnnualCost: costAnalysisResult.totalAnnualCost,
          costBreakdown: costAnalysisResult.costBreakdown,
          budgetConstraints,
          budgetExceeded: costAnalysisResult.budgetExceeded,
          optimizationRecommendations: costAnalysisResult.optimizationRecommendations
        },
        files: costAnalysisResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 14: TRAINING AND AWARENESS PROGRAM
  // ============================================================================

  ctx.log('info', 'Phase 14: Developing training and awareness program');

  const trainingProgramResult = await ctx.task(developTrainingProgramTask, {
    projectName,
    criticalSystems,
    runbooksResult,
    incidentCommandResult,
    testingPlanResult,
    outputDir
  });

  artifacts.push(...trainingProgramResult.artifacts);

  ctx.log('info', `Training program developed - ${trainingProgramResult.trainingModules.length} modules, ${trainingProgramResult.targetAudience.length} target audiences`);

  // ============================================================================
  // PHASE 15: DR PLAN DOCUMENTATION AND FINALIZATION
  // ============================================================================

  ctx.log('info', 'Phase 15: Finalizing disaster recovery plan documentation');

  const drPlanDocumentation = await ctx.task(finalizeDRPlanDocumentationTask, {
    projectName,
    environment,
    infrastructure,
    criticalSystems,
    biaResult,
    riskAssessment,
    rto,
    rpo,
    recoveryStrategies,
    runbooksResult,
    incidentCommandResult,
    testingSchedule,
    drMonitoringResult,
    complianceResult,
    costAnalysisResult,
    trainingProgramResult,
    outputDir
  });

  artifacts.push(...drPlanDocumentation.artifacts);

  ctx.log('info', `DR Plan documentation complete - Main document: ${drPlanDocumentation.mainDocumentPath}`);

  // ============================================================================
  // PHASE 16: DR READINESS ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 16: Conducting final DR readiness assessment');

  const readinessAssessment = await ctx.task(assessDRReadinessTask, {
    projectName,
    criticalSystems,
    rto,
    rpo,
    recoveryStrategies,
    testingPlanResult,
    drMonitoringResult,
    complianceResult,
    trainingProgramResult,
    outputDir
  });

  artifacts.push(...readinessAssessment.artifacts);

  const readinessScore = readinessAssessment.readinessScore;

  ctx.log('info', `DR Readiness Assessment complete - Score: ${readinessScore}/100, Status: ${readinessAssessment.readinessStatus}`);

  // Final Breakpoint: DR Plan Complete
  await ctx.breakpoint({
    question: `Disaster Recovery Plan complete for ${projectName}. Readiness Score: ${readinessScore}/100. RTO: ${rto} minutes, RPO: ${rpo} minutes. Status: ${readinessAssessment.readinessStatus}. Approve for production deployment?`,
    title: 'Final DR Plan Review and Approval',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        environment,
        infrastructure,
        readinessScore,
        readinessStatus: readinessAssessment.readinessStatus,
        rto,
        rpo,
        criticalSystemsCount: criticalSystems.length,
        recoveryStrategiesCount: recoveryStrategies.length,
        runbooksCount: runbooksResult.runbooks.length,
        testScenariosCount: testingPlanResult.testScenarios.length,
        totalMonthlyCost: costAnalysisResult.totalMonthlyCost,
        complianceFrameworks: complianceRequirements.length
      },
      keyMetrics: {
        rto: `${rto} minutes`,
        rpo: `${rpo} minutes`,
        backupFrequency: backupStrategyResult.backupFrequency,
        haStrategy: haRedundancyResult.haStrategy,
        failoverAutomation: `${failoverProcedures.automationLevel}%`,
        replicationMethod: replicationStrategy.replicationMethod,
        readinessScore: `${readinessScore}/100`
      },
      gaps: readinessAssessment.gaps,
      recommendation: readinessAssessment.recommendation,
      files: [
        { path: drPlanDocumentation.mainDocumentPath, format: 'markdown', label: 'Disaster Recovery Plan' },
        { path: readinessAssessment.assessmentReportPath, format: 'markdown', label: 'DR Readiness Assessment' },
        { path: costAnalysisResult.costReportPath, format: 'json', label: 'Cost Analysis Report' },
        { path: runbooksResult.runbookIndexPath, format: 'markdown', label: 'Recovery Runbooks Index' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    environment,
    infrastructure,
    readinessScore,
    readinessStatus: readinessAssessment.readinessStatus,
    rto,
    rpo,
    objectives: {
      rto,
      rpo,
      rtoBySystems: objectivesResult.rtoBySystems,
      rpoBySystems: objectivesResult.rpoBySystems
    },
    recoveryStrategies: recoveryStrategies.map(rs => ({
      type: rs.type,
      summary: rs.details.summary || rs.details.strategy || rs.type
    })),
    backup: {
      backupTypes: backupStrategyResult.backupTypes,
      backupFrequency: backupStrategyResult.backupFrequency,
      retentionDays: dataRetention,
      estimatedStorage: backupStrategyResult.estimatedStorage
    },
    highAvailability: {
      haStrategy: haRedundancyResult.haStrategy,
      redundancyLevel: haRedundancyResult.redundancyLevel,
      multiRegion: haRedundancyResult.multiRegion,
      multiCloud: haRedundancyResult.multiCloud
    },
    failover: {
      proceduresCount: failoverProcedures.procedures.length,
      automationLevel: failoverProcedures.automationLevel,
      estimatedFailoverTime: failoverProcedures.estimatedFailoverTime,
      estimatedFailbackTime: failoverProcedures.estimatedFailbackTime
    },
    replication: {
      method: replicationStrategy.replicationMethod,
      latency: replicationStrategy.replicationLatency,
      coverage: replicationStrategy.replicationCoverage
    },
    runbooks: {
      count: runbooksResult.runbooks.length,
      scenarios: disasterScenarios,
      runbookIndexPath: runbooksResult.runbookIndexPath
    },
    testingSchedule: {
      frequency: testingFrequency,
      testScenariosCount: testingPlanResult.testScenarios.length,
      firstTestDate: testingPlanResult.firstTestDate,
      testTypes: testingPlanResult.testTypes
    },
    monitoring: {
      monitorsCount: drMonitoringResult.monitors.length,
      alertsCount: drMonitoringResult.alerts.length,
      dashboardsCreated: drMonitoringResult.dashboardsCreated
    },
    compliance: {
      frameworks: complianceRequirements,
      controlsImplemented: complianceResult.controlsImplemented,
      auditReadiness: complianceResult.auditReadiness
    },
    costs: {
      totalMonthlyCost: costAnalysisResult.totalMonthlyCost,
      totalAnnualCost: costAnalysisResult.totalAnnualCost,
      costBreakdown: costAnalysisResult.costBreakdown,
      budgetConstraints,
      budgetExceeded: costAnalysisResult.budgetExceeded
    },
    training: {
      modulesCount: trainingProgramResult.trainingModules.length,
      targetAudiences: trainingProgramResult.targetAudience,
      trainingSchedule: trainingProgramResult.trainingSchedule
    },
    incidentCommand: {
      rolesCount: incidentCommandResult.roles.length,
      communicationChannels: incidentCommandResult.communicationChannels.length,
      escalationLevels: incidentCommandResult.escalationLevels
    },
    businessImpact: {
      criticalProcesses: biaResult.criticalProcesses.length,
      maxTolerableDowntime: biaResult.maxTolerableDowntime,
      estimatedFinancialImpact: biaResult.estimatedFinancialImpact
    },
    risks: {
      totalRisks: riskAssessment.identifiedRisks.length,
      criticalRisks: riskAssessment.criticalRisks.length,
      overallRiskScore: riskAssessment.overallRiskScore,
      topRisks: riskAssessment.topRisks.slice(0, 5)
    },
    readiness: {
      score: readinessScore,
      status: readinessAssessment.readinessStatus,
      gaps: readinessAssessment.gaps,
      strengths: readinessAssessment.strengths,
      recommendation: readinessAssessment.recommendation
    },
    artifacts,
    documentation: {
      mainDocumentPath: drPlanDocumentation.mainDocumentPath,
      executiveSummaryPath: drPlanDocumentation.executiveSummaryPath,
      assessmentReportPath: readinessAssessment.assessmentReportPath,
      costReportPath: costAnalysisResult.costReportPath
    },
    duration,
    metadata: {
      processId: 'specializations/devops-sre-platform/disaster-recovery-plan',
      processSlug: 'disaster-recovery-plan',
      category: 'devops-sre-platform',
      specializationSlug: 'devops-sre-platform',
      timestamp: startTime,
      infrastructure,
      criticalSystemsCount: criticalSystems.length,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: Business Impact Analysis
export const businessImpactAnalysisTask = defineTask('business-impact-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Business Impact Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Business Continuity Analyst',
      task: 'Conduct comprehensive business impact analysis to identify critical processes and dependencies',
      context: {
        projectName: args.projectName,
        criticalSystems: args.criticalSystems,
        businessContinuityRequirements: args.businessContinuityRequirements,
        complianceRequirements: args.complianceRequirements,
        environment: args.environment,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify all critical business processes and their dependencies on IT systems',
        '2. For each critical system, determine:',
        '   - Business functions it supports',
        '   - Revenue impact if unavailable',
        '   - Customer impact if unavailable',
        '   - Compliance/regulatory impact if unavailable',
        '   - Reputational impact',
        '3. Assess dependencies between systems (database, APIs, third-party services)',
        '4. Determine Maximum Tolerable Downtime (MTD) for each process',
        '5. Calculate financial impact per hour of downtime',
        '6. Identify critical data and its importance',
        '7. Assess impact of data loss (1 hour, 4 hours, 24 hours)',
        '8. Document stakeholder requirements and expectations',
        '9. Prioritize systems based on business impact (Tier 1, 2, 3)',
        '10. Create Business Impact Analysis report with recommendations'
      ],
      outputFormat: 'JSON object with business impact analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'criticalProcesses', 'dependencies', 'maxTolerableDowntime', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        criticalProcesses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              tier: { type: 'string', enum: ['tier-1', 'tier-2', 'tier-3'] },
              systems: { type: 'array', items: { type: 'string' } },
              mtd: { type: 'number', description: 'Maximum Tolerable Downtime in minutes' },
              financialImpactPerHour: { type: 'string' },
              customerImpact: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
            }
          }
        },
        dependencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              system: { type: 'string' },
              dependsOn: { type: 'array', items: { type: 'string' } },
              dependencyType: { type: 'string', enum: ['required', 'optional'] }
            }
          }
        },
        maxTolerableDowntime: { type: 'number', description: 'Overall MTD in minutes' },
        estimatedFinancialImpact: { type: 'string', description: 'Financial impact per hour' },
        complianceImpact: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              framework: { type: 'string' },
              requirements: { type: 'array', items: { type: 'string' } },
              penalties: { type: 'string' }
            }
          }
        },
        tierPrioritization: {
          type: 'object',
          properties: {
            tier1Count: { type: 'number' },
            tier2Count: { type: 'number' },
            tier3Count: { type: 'number' }
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
  labels: ['agent', 'disaster-recovery', 'bia']
}));

// Phase 2: Risk Assessment
export const riskAssessmentTask = defineTask('risk-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Risk Assessment and Threat Modeling - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Risk Assessment Specialist',
      task: 'Conduct risk assessment and threat modeling for disaster scenarios',
      context: {
        projectName: args.projectName,
        infrastructure: args.infrastructure,
        criticalSystems: args.criticalSystems,
        disasterScenarios: args.disasterScenarios,
        biaResult: args.biaResult,
        cloudProviders: args.cloudProviders,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify and assess disaster scenarios:',
        '   - Region/datacenter outage',
        '   - Natural disasters (earthquake, flood, fire)',
        '   - Cyber attacks (ransomware, DDoS)',
        '   - Hardware failures',
        '   - Software failures and bugs',
        '   - Human errors',
        '   - Third-party service failures',
        '   - Network failures',
        '2. For each scenario, assess:',
        '   - Likelihood (rare, unlikely, possible, likely, almost certain)',
        '   - Impact (negligible, minor, moderate, major, catastrophic)',
        '   - Risk level = Likelihood × Impact',
        '3. Identify single points of failure in architecture',
        '4. Assess cloud provider-specific risks',
        '5. Evaluate existing controls and their effectiveness',
        '6. Calculate risk scores for each critical system',
        '7. Identify top 10 risks requiring immediate attention',
        '8. Recommend risk mitigation strategies',
        '9. Create risk heat map and risk register',
        '10. Document all findings in risk assessment report'
      ],
      outputFormat: 'JSON object with risk assessment details'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'identifiedRisks', 'criticalRisks', 'topRisks', 'overallRiskScore', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        identifiedRisks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              riskId: { type: 'string' },
              scenario: { type: 'string' },
              likelihood: { type: 'string', enum: ['rare', 'unlikely', 'possible', 'likely', 'almost-certain'] },
              impact: { type: 'string', enum: ['negligible', 'minor', 'moderate', 'major', 'catastrophic'] },
              riskLevel: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
              affectedSystems: { type: 'array', items: { type: 'string' } },
              existingControls: { type: 'array', items: { type: 'string' } },
              mitigationStrategy: { type: 'string' }
            }
          }
        },
        criticalRisks: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of critical risk IDs'
        },
        topRisks: {
          type: 'array',
          items: { type: 'string' },
          description: 'Top 10 risks by risk score'
        },
        singlePointsOfFailure: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              component: { type: 'string' },
              impact: { type: 'string' },
              mitigation: { type: 'string' }
            }
          }
        },
        overallRiskScore: { type: 'number', minimum: 0, maximum: 100 },
        riskHeatMapPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'disaster-recovery', 'risk-assessment']
}));

// Phase 3: Define Recovery Objectives
export const defineRecoveryObjectivesTask = defineTask('define-recovery-objectives', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Define RTO and RPO Objectives - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Disaster Recovery Architect',
      task: 'Define Recovery Time Objective (RTO) and Recovery Point Objective (RPO) for each system',
      context: {
        projectName: args.projectName,
        biaResult: args.biaResult,
        riskAssessment: args.riskAssessment,
        businessContinuityRequirements: args.businessContinuityRequirements,
        criticalSystems: args.criticalSystems,
        budgetConstraints: args.budgetConstraints,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Based on Business Impact Analysis, define RTO for each critical system:',
        '   - Tier 1 (Mission Critical): RTO < 1 hour',
        '   - Tier 2 (Business Critical): RTO < 4 hours',
        '   - Tier 3 (Important): RTO < 24 hours',
        '2. Define RPO for each system based on data criticality:',
        '   - Real-time data: RPO < 15 minutes',
        '   - Transactional data: RPO < 1 hour',
        '   - Analytical data: RPO < 24 hours',
        '3. Consider business continuity requirements (max downtime, max data loss)',
        '4. Balance objectives with budget constraints:',
        '   - Lower RTO/RPO = Higher cost',
        '   - Tight budget may require trade-offs',
        '5. Estimate cost implications for each RTO/RPO target',
        '6. Calculate overall system RTO and RPO (based on most critical system)',
        '7. Document justification for each objective',
        '8. Identify cost optimization opportunities',
        '9. Create RTO/RPO matrix by system and tier',
        '10. Generate objectives summary report'
      ],
      outputFormat: 'JSON object with RTO and RPO objectives'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'rto', 'rpo', 'rtoBySystems', 'rpoBySystems', 'estimatedCost', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        rto: { type: 'number', description: 'Overall Recovery Time Objective in minutes' },
        rpo: { type: 'number', description: 'Overall Recovery Point Objective in minutes' },
        rtoBySystems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              system: { type: 'string' },
              tier: { type: 'string' },
              rto: { type: 'number', description: 'RTO in minutes' },
              justification: { type: 'string' }
            }
          }
        },
        rpoBySystems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              system: { type: 'string' },
              tier: { type: 'string' },
              rpo: { type: 'number', description: 'RPO in minutes' },
              justification: { type: 'string' }
            }
          }
        },
        estimatedCost: { type: 'string', description: 'Estimated monthly cost' },
        costBreakdown: {
          type: 'object',
          properties: {
            tier1: { type: 'string' },
            tier2: { type: 'string' },
            tier3: { type: 'string' }
          }
        },
        budgetAlignment: { type: 'boolean', description: 'Objectives align with budget' },
        tradeOffs: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'disaster-recovery', 'rto-rpo']
}));

// Phase 4: Design Backup Strategy
export const designBackupStrategyTask = defineTask('design-backup-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Design Comprehensive Backup Strategy - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Backup and Recovery Specialist',
      task: 'Design comprehensive backup strategy to meet RPO requirements',
      context: {
        projectName: args.projectName,
        infrastructure: args.infrastructure,
        criticalSystems: args.criticalSystems,
        rpo: args.rpo,
        dataRetention: args.dataRetention,
        complianceRequirements: args.complianceRequirements,
        backupStrategy: args.backupStrategy,
        cloudProviders: args.cloudProviders,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design backup types and frequency based on RPO:',
        '   - Full backups: Weekly or monthly',
        '   - Incremental backups: Daily or continuous',
        '   - Differential backups: As needed',
        '   - Transaction log backups: Every 15-60 minutes (for databases)',
        '   - Snapshot backups: Hourly or as needed',
        '2. Define backup scope for each system:',
        '   - Application data',
        '   - Configuration files',
        '   - Database backups',
        '   - System state',
        '   - Virtual machine images',
        '3. Implement 3-2-1 backup rule:',
        '   - 3 copies of data',
        '   - 2 different media types',
        '   - 1 offsite copy',
        '4. Define retention policies based on compliance requirements',
        '5. Choose backup storage locations:',
        '   - Primary: Same region',
        '   - Secondary: Different region',
        '   - Archive: Cold storage (S3 Glacier, Azure Archive)',
        '6. Design backup automation and scheduling',
        '7. Plan backup verification and testing procedures',
        '8. Estimate storage requirements and costs',
        '9. Document backup procedures and restore procedures',
        '10. Create backup strategy document with architecture diagrams'
      ],
      outputFormat: 'JSON object with backup strategy details'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'backupTypes', 'backupFrequency', 'retentionPolicies', 'estimatedStorage', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        backupTypes: {
          type: 'array',
          items: { type: 'string', enum: ['full', 'incremental', 'differential', 'transaction-log', 'snapshot'] }
        },
        backupFrequency: { type: 'string', description: 'e.g., Full: Weekly, Incremental: Daily' },
        backupSchedule: {
          type: 'object',
          properties: {
            full: { type: 'string' },
            incremental: { type: 'string' },
            differential: { type: 'string' },
            transactionLog: { type: 'string' },
            snapshot: { type: 'string' }
          }
        },
        retentionPolicies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              backupType: { type: 'string' },
              retentionDays: { type: 'number' },
              archiveAfterDays: { type: 'number' }
            }
          }
        },
        storageLocations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              location: { type: 'string' },
              type: { type: 'string', enum: ['primary', 'secondary', 'archive'] },
              provider: { type: 'string' },
              region: { type: 'string' }
            }
          }
        },
        estimatedStorage: { type: 'string', description: 'Estimated storage required (e.g., 5 TB)' },
        estimatedCost: { type: 'string', description: 'Estimated monthly cost' },
        backupAutomation: { type: 'boolean' },
        verificationSchedule: { type: 'string' },
        rule321Compliant: { type: 'boolean', description: '3-2-1 backup rule compliance' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'disaster-recovery', 'backup']
}));

// Phase 5: Design HA and Redundancy
export const designHARedundancyTask = defineTask('design-ha-redundancy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Design High Availability and Redundancy - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'High Availability Architect',
      task: 'Design high availability and redundancy architecture to meet RTO requirements',
      context: {
        projectName: args.projectName,
        infrastructure: args.infrastructure,
        criticalSystems: args.criticalSystems,
        rto: args.rto,
        cloudProviders: args.cloudProviders,
        disasterScenarios: args.disasterScenarios,
        budgetConstraints: args.budgetConstraints,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design HA strategy based on RTO requirements:',
        '   - RTO < 1 hour: Active-Active multi-region',
        '   - RTO < 4 hours: Active-Passive with warm standby',
        '   - RTO < 24 hours: Cold standby or backup/restore',
        '2. Design redundancy at each layer:',
        '   - Application: Multiple instances, load balancing',
        '   - Database: Read replicas, multi-AZ deployment',
        '   - Storage: RAID, replicated storage',
        '   - Network: Multiple paths, redundant connections',
        '   - Infrastructure: Multi-AZ, multi-region',
        '3. Choose HA architecture pattern:',
        '   - Pilot Light: Minimal infrastructure running, scale on demand',
        '   - Warm Standby: Scaled-down replica running',
        '   - Hot Standby: Full-scale replica running',
        '   - Active-Active: Traffic distributed across regions',
        '4. Design for multi-region deployment if needed',
        '5. Consider multi-cloud strategy for critical systems',
        '6. Implement health checks and auto-recovery',
        '7. Design load balancing and traffic routing (DNS, Global Load Balancer)',
        '8. Plan for capacity and scaling during failover',
        '9. Estimate costs for each HA strategy',
        '10. Create HA architecture diagrams and documentation'
      ],
      outputFormat: 'JSON object with HA and redundancy design'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'haStrategy', 'redundancyLevel', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        haStrategy: { type: 'string', enum: ['pilot-light', 'warm-standby', 'hot-standby', 'active-active'] },
        redundancyLevel: { type: 'string', enum: ['single-az', 'multi-az', 'multi-region', 'multi-cloud'] },
        multiRegion: { type: 'boolean' },
        multiCloud: { type: 'boolean' },
        architecturePattern: { type: 'string' },
        redundancyByLayer: {
          type: 'object',
          properties: {
            application: { type: 'string' },
            database: { type: 'string' },
            storage: { type: 'string' },
            network: { type: 'string' }
          }
        },
        regions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              provider: { type: 'string' },
              region: { type: 'string' },
              role: { type: 'string', enum: ['primary', 'secondary', 'disaster-recovery'] }
            }
          }
        },
        loadBalancing: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            healthChecks: { type: 'boolean' },
            autoRecovery: { type: 'boolean' }
          }
        },
        estimatedCost: { type: 'string' },
        summary: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'disaster-recovery', 'high-availability']
}));

// Phase 6: Develop Failover Procedures
export const developFailoverProceduresTask = defineTask('develop-failover-procedures', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Develop Failover and Failback Procedures - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Disaster Recovery Engineer',
      task: 'Develop detailed failover and failback procedures',
      context: {
        projectName: args.projectName,
        infrastructure: args.infrastructure,
        criticalSystems: args.criticalSystems,
        haRedundancyResult: args.haRedundancyResult,
        rto: args.rto,
        cloudProviders: args.cloudProviders,
        outputDir: args.outputDir
      },
      instructions: [
        '1. For each critical system, develop failover procedure:',
        '   - Pre-failover checks and validation',
        '   - Step-by-step failover actions',
        '   - Post-failover validation and testing',
        '   - Rollback procedure if failover fails',
        '2. Define automated vs manual failover decisions:',
        '   - Automated: Health check failures, region outages',
        '   - Manual: Planned maintenance, complex scenarios',
        '3. Document DNS and traffic routing changes',
        '4. Define database failover procedures (promote replica, point applications)',
        '5. Document application configuration changes needed',
        '6. Define data synchronization procedures',
        '7. Develop failback procedures (return to primary after recovery):',
        '   - Verify primary is healthy',
        '   - Sync data from secondary to primary',
        '   - Failback to primary',
        '   - Post-failback validation',
        '8. Create decision trees for failover scenarios',
        '9. Define roles and responsibilities for failover execution',
        '10. Estimate failover and failback time for each system',
        '11. Calculate automation percentage',
        '12. Document all procedures in executable runbooks'
      ],
      outputFormat: 'JSON object with failover procedures'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'procedures', 'automationLevel', 'estimatedFailoverTime', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        procedures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              system: { type: 'string' },
              automatedFailover: { type: 'boolean' },
              failoverSteps: { type: 'array', items: { type: 'string' } },
              failbackSteps: { type: 'array', items: { type: 'string' } },
              estimatedTime: { type: 'string' },
              validationChecks: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        automationLevel: { type: 'number', description: 'Percentage of automated procedures' },
        manualSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              system: { type: 'string' },
              step: { type: 'string' },
              reason: { type: 'string' }
            }
          }
        },
        estimatedFailoverTime: { type: 'string', description: 'Estimated time to complete failover' },
        estimatedFailbackTime: { type: 'string', description: 'Estimated time to complete failback' },
        decisionTrees: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenario: { type: 'string' },
              path: { type: 'string' }
            }
          }
        },
        rolesResponsibilities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              role: { type: 'string' },
              responsibilities: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'disaster-recovery', 'failover']
}));

// Phase 7: Design Replication Strategy
export const designReplicationStrategyTask = defineTask('design-replication-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Design Data Replication Strategy - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Replication Architect',
      task: 'Design data replication and synchronization strategy',
      context: {
        projectName: args.projectName,
        infrastructure: args.infrastructure,
        criticalSystems: args.criticalSystems,
        rpo: args.rpo,
        cloudProviders: args.cloudProviders,
        disasterScenarios: args.disasterScenarios,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design replication method based on RPO:',
        '   - Synchronous replication: RPO = 0 (no data loss)',
        '   - Asynchronous replication: RPO > 0 (minimal data loss)',
        '   - Semi-synchronous: Balance between performance and durability',
        '2. For each data store, define replication:',
        '   - Database: Master-slave, multi-master, cluster replication',
        '   - File storage: rsync, continuous sync, object replication',
        '   - Object storage: Cross-region replication (S3, Azure Blob)',
        '   - Block storage: Volume snapshots, replication',
        '3. Design replication topology:',
        '   - Primary → Secondary (unidirectional)',
        '   - Bidirectional (active-active)',
        '   - Hub and spoke',
        '4. Consider replication lag and monitoring',
        '5. Design conflict resolution for multi-master scenarios',
        '6. Plan for bandwidth and network requirements',
        '7. Estimate replication latency',
        '8. Design replication for compliance (GDPR data residency)',
        '9. Document replication configuration and monitoring',
        '10. Create replication architecture diagrams'
      ],
      outputFormat: 'JSON object with replication strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'replicationMethod', 'replicationLatency', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        replicationMethod: { type: 'string', enum: ['synchronous', 'asynchronous', 'semi-synchronous'] },
        replicationTopology: { type: 'string', enum: ['primary-secondary', 'bidirectional', 'hub-spoke'] },
        replicationByDataStore: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dataStore: { type: 'string' },
              method: { type: 'string' },
              frequency: { type: 'string' },
              latency: { type: 'string' }
            }
          }
        },
        replicationLatency: { type: 'string', description: 'Average replication latency in ms' },
        replicationCoverage: { type: 'number', description: 'Percentage of data replicated' },
        conflictResolution: { type: 'string' },
        networkRequirements: {
          type: 'object',
          properties: {
            bandwidth: { type: 'string' },
            estimatedTraffic: { type: 'string' }
          }
        },
        strategy: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'disaster-recovery', 'replication']
}));

// Phase 8: Create Recovery Runbooks
export const createRecoveryRunbooksTask = defineTask('create-recovery-runbooks', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Create Recovery Runbooks - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Documentation Specialist',
      task: 'Create comprehensive recovery runbooks for disaster scenarios',
      context: {
        projectName: args.projectName,
        criticalSystems: args.criticalSystems,
        disasterScenarios: args.disasterScenarios,
        backupStrategyResult: args.backupStrategyResult,
        failoverProcedures: args.failoverProcedures,
        replicationStrategy: args.replicationStrategy,
        rto: args.rto,
        rpo: args.rpo,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create a runbook for each disaster scenario:',
        '   - Region outage recovery',
        '   - Datacenter failure recovery',
        '   - Cyber attack recovery (ransomware)',
        '   - Data corruption recovery',
        '   - Complete system failure recovery',
        '2. For each runbook, include:',
        '   - Scenario description and triggers',
        '   - Impact assessment steps',
        '   - Decision criteria (when to invoke DR)',
        '   - Step-by-step recovery procedures',
        '   - Commands and scripts to execute',
        '   - Validation and testing steps',
        '   - Rollback procedures',
        '   - Expected recovery time',
        '   - Roles and contact information',
        '3. Create system-specific recovery runbooks',
        '4. Document backup restore procedures',
        '5. Document failover execution procedures',
        '6. Include troubleshooting guides',
        '7. Add checklists and decision trees',
        '8. Include example scenarios and walkthroughs',
        '9. Format runbooks in Markdown for easy reading',
        '10. Create runbook index for quick navigation'
      ],
      outputFormat: 'JSON object with runbook details'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'runbooks', 'runbookIndexPath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        runbooks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              scenario: { type: 'string' },
              systems: { type: 'array', items: { type: 'string' } },
              estimatedRecoveryTime: { type: 'string' },
              path: { type: 'string' },
              tags: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        runbookIndexPath: { type: 'string' },
        runbooksByScenario: {
          type: 'object',
          additionalProperties: { type: 'array', items: { type: 'string' } }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'disaster-recovery', 'runbooks']
}));

// Phase 9: Establish Incident Command
export const establishIncidentCommandTask = defineTask('establish-incident-command', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Establish Incident Command Structure - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Incident Management Specialist',
      task: 'Establish incident command structure and communication plan for disaster recovery',
      context: {
        projectName: args.projectName,
        criticalSystems: args.criticalSystems,
        disasterScenarios: args.disasterScenarios,
        complianceRequirements: args.complianceRequirements,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define incident command structure and roles:',
        '   - Incident Commander: Overall authority and decision-making',
        '   - Technical Lead: Technical recovery execution',
        '   - Communications Lead: Stakeholder communications',
        '   - Scribe: Document timeline and actions',
        '   - Subject Matter Experts: System-specific expertise',
        '2. Define escalation levels and triggers:',
        '   - Level 1: Minor incident, handled by on-call team',
        '   - Level 2: Major incident, escalate to management',
        '   - Level 3: Disaster, invoke DR plan, executive notification',
        '3. Establish communication channels:',
        '   - Primary: Dedicated Slack/Teams channel',
        '   - Conference bridge for voice communication',
        '   - Status page for customer updates',
        '   - Email distribution lists',
        '4. Define notification procedures:',
        '   - Internal stakeholders',
        '   - Customers',
        '   - Regulators (if required)',
        '   - Partners and vendors',
        '5. Create communication templates:',
        '   - Initial notification',
        '   - Regular status updates',
        '   - Resolution notification',
        '   - Post-incident report',
        '6. Define decision-making authority and approval gates',
        '7. Establish war room procedures',
        '8. Document contact information and escalation paths',
        '9. Create incident severity matrix',
        '10. Develop communication plan document'
      ],
      outputFormat: 'JSON object with incident command structure'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'roles', 'communicationChannels', 'escalationLevels', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        roles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              role: { type: 'string' },
              responsibilities: { type: 'array', items: { type: 'string' } },
              authority: { type: 'string' },
              primaryContact: { type: 'string' },
              backupContact: { type: 'string' }
            }
          }
        },
        escalationLevels: { type: 'number' },
        escalationMatrix: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              level: { type: 'string' },
              severity: { type: 'string' },
              criteria: { type: 'array', items: { type: 'string' } },
              notificationRequired: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        communicationChannels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              channel: { type: 'string' },
              type: { type: 'string', enum: ['chat', 'email', 'phone', 'status-page'] },
              purpose: { type: 'string' }
            }
          }
        },
        notificationProcedures: {
          type: 'object',
          properties: {
            internal: { type: 'array', items: { type: 'string' } },
            external: { type: 'array', items: { type: 'string' } }
          }
        },
        communicationTemplates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
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
  labels: ['agent', 'disaster-recovery', 'incident-command']
}));

// Phase 10: Develop DR Testing Plan
export const developDRTestingPlanTask = defineTask('develop-dr-testing-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Develop DR Testing Plan - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Disaster Recovery Testing Specialist',
      task: 'Develop comprehensive disaster recovery testing plan',
      context: {
        projectName: args.projectName,
        criticalSystems: args.criticalSystems,
        disasterScenarios: args.disasterScenarios,
        testingFrequency: args.testingFrequency,
        rto: args.rto,
        rpo: args.rpo,
        recoveryStrategies: args.recoveryStrategies,
        complianceRequirements: args.complianceRequirements,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define DR testing types:',
        '   - Tabletop exercise: Walk through procedures without execution',
        '   - Simulated test: Execute recovery in test environment',
        '   - Parallel test: Run recovery in parallel with production',
        '   - Full failover test: Actually failover production (highest risk)',
        '2. Create test scenarios for each disaster type',
        '3. For each test scenario, define:',
        '   - Test objectives and success criteria',
        '   - Systems and components in scope',
        '   - Test procedures and steps',
        '   - Expected outcomes',
        '   - Validation checks',
        '   - Rollback plan',
        '4. Define testing frequency:',
        '   - Tabletop: Quarterly',
        '   - Simulated: Semi-annual',
        '   - Full failover: Annual',
        '5. Create testing schedule for next 12 months',
        '6. Define test metrics to measure:',
        '   - Actual RTO vs target RTO',
        '   - Actual RPO vs target RPO',
        '   - Success rate',
        '   - Issues identified',
        '7. Define test documentation requirements',
        '8. Establish post-test review process',
        '9. Define continuous improvement process based on test results',
        '10. Document testing plan with schedules and procedures'
      ],
      outputFormat: 'JSON object with DR testing plan'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'testScenarios', 'testingSchedule', 'testTypes', 'firstTestDate', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        testScenarios: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              testType: { type: 'string', enum: ['tabletop', 'simulated', 'parallel', 'full-failover'] },
              scenario: { type: 'string' },
              systems: { type: 'array', items: { type: 'string' } },
              objectives: { type: 'array', items: { type: 'string' } },
              successCriteria: { type: 'array', items: { type: 'string' } },
              estimatedDuration: { type: 'string' }
            }
          }
        },
        testTypes: { type: 'array', items: { type: 'string' } },
        testingSchedule: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testName: { type: 'string' },
              testType: { type: 'string' },
              scheduledDate: { type: 'string' },
              participants: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        firstTestDate: { type: 'string', description: 'Date of first scheduled test' },
        testMetrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              target: { type: 'string' }
            }
          }
        },
        estimatedTestDuration: { type: 'string' },
        postTestReviewProcess: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'disaster-recovery', 'testing']
}));

// Phase 11: Implement DR Monitoring
export const implementDRMonitoringTask = defineTask('implement-dr-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Implement DR Monitoring and Alerting - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Monitoring and Observability Engineer',
      task: 'Implement monitoring and alerting for disaster recovery readiness',
      context: {
        projectName: args.projectName,
        criticalSystems: args.criticalSystems,
        backupStrategyResult: args.backupStrategyResult,
        replicationStrategy: args.replicationStrategy,
        rto: args.rto,
        rpo: args.rpo,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Monitor backup health and status:',
        '   - Backup job success/failure',
        '   - Backup age (last successful backup)',
        '   - Backup size and growth trends',
        '   - Backup verification status',
        '2. Monitor replication health:',
        '   - Replication lag',
        '   - Replication status (up-to-date, lagging, failed)',
        '   - Data consistency',
        '3. Monitor HA and failover readiness:',
        '   - Secondary/standby system health',
        '   - Failover readiness checks',
        '   - Cross-region connectivity',
        '4. Create alerts for DR issues:',
        '   - Backup failure (critical)',
        '   - Backup age exceeds RPO (critical)',
        '   - Replication lag exceeds threshold (high)',
        '   - Standby system unhealthy (high)',
        '   - Backup storage capacity (medium)',
        '5. Create DR readiness dashboard showing:',
        '   - Backup status by system',
        '   - Replication status',
        '   - Last successful DR test',
        '   - Time since last backup',
        '   - DR readiness score',
        '6. Implement automated DR health checks',
        '7. Set up alerting channels (PagerDuty, email, Slack)',
        '8. Document monitoring and alerting configuration',
        '9. Create monitoring runbook',
        '10. Test alerts to ensure they fire correctly'
      ],
      outputFormat: 'JSON object with DR monitoring configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'monitors', 'alerts', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        monitors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['backup', 'replication', 'failover-readiness', 'health-check'] },
              system: { type: 'string' },
              metric: { type: 'string' },
              threshold: { type: 'string' }
            }
          }
        },
        alerts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              condition: { type: 'string' },
              threshold: { type: 'string' },
              notificationChannel: { type: 'string' }
            }
          }
        },
        dashboardsCreated: { type: 'number' },
        dashboards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              url: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        healthChecks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              check: { type: 'string' },
              frequency: { type: 'string' },
              automated: { type: 'boolean' }
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
  labels: ['agent', 'disaster-recovery', 'monitoring']
}));

// Phase 12: Address Compliance Requirements
export const addressComplianceRequirementsTask = defineTask('address-compliance-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Address Compliance and Audit Requirements - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Compliance and Audit Specialist',
      task: 'Address compliance and audit requirements for disaster recovery',
      context: {
        projectName: args.projectName,
        complianceRequirements: args.complianceRequirements,
        biaResult: args.biaResult,
        backupStrategyResult: args.backupStrategyResult,
        testingPlanResult: args.testingPlanResult,
        dataRetention: args.dataRetention,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Map DR plan to compliance requirements:',
        '   - PCI-DSS: Section 12.10 (Incident Response Plan)',
        '   - SOC 2: CC9.1 (Risk of business disruption)',
        '   - HIPAA: 164.308(a)(7) (Contingency Plan)',
        '   - GDPR: Article 32 (Security of processing)',
        '   - ISO 27001: A.17 (Business continuity management)',
        '2. Document how DR plan meets each compliance control',
        '3. Implement required data retention policies',
        '4. Ensure backup encryption meets compliance standards',
        '5. Document incident response procedures for compliance',
        '6. Implement audit logging for DR activities:',
        '   - Backup creation and deletion',
        '   - Restore operations',
        '   - Failover events',
        '   - DR test execution',
        '7. Prepare audit evidence and documentation',
        '8. Create compliance checklist for DR plan',
        '9. Document data sovereignty and residency compliance',
        '10. Generate compliance report mapping controls to implementations'
      ],
      outputFormat: 'JSON object with compliance details'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'controlsImplemented', 'auditReadiness', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        complianceMapping: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              framework: { type: 'string' },
              control: { type: 'string' },
              requirement: { type: 'string' },
              implementation: { type: 'string' },
              evidence: { type: 'string' },
              status: { type: 'string', enum: ['implemented', 'partially-implemented', 'not-implemented'] }
            }
          }
        },
        controlsImplemented: { type: 'number', description: 'Number of controls fully implemented' },
        controlsPartial: { type: 'number' },
        controlsNotImplemented: { type: 'number' },
        dataRetentionCompliance: { type: 'boolean' },
        encryptionCompliance: { type: 'boolean' },
        auditReadiness: { type: 'number', description: 'Audit readiness score 0-100' },
        auditLogging: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            logsRetained: { type: 'string' },
            logsProtected: { type: 'boolean' }
          }
        },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              framework: { type: 'string' },
              control: { type: 'string' },
              gap: { type: 'string' },
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
  labels: ['agent', 'disaster-recovery', 'compliance']
}));

// Phase 13: Analyze DR Costs
export const analyzeDRCostsTask = defineTask('analyze-dr-costs', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 13: Cost Analysis and Optimization - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Cloud Financial Analyst',
      task: 'Analyze disaster recovery costs and identify optimization opportunities',
      context: {
        projectName: args.projectName,
        backupStrategyResult: args.backupStrategyResult,
        haRedundancyResult: args.haRedundancyResult,
        replicationStrategy: args.replicationStrategy,
        testingPlanResult: args.testingPlanResult,
        budgetConstraints: args.budgetConstraints,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Calculate total DR costs:',
        '   - Backup storage costs',
        '   - Replication bandwidth and storage',
        '   - Standby/secondary infrastructure costs',
        '   - Monitoring and tooling costs',
        '   - DR testing costs',
        '   - Personnel costs (on-call, training)',
        '2. Break down costs by category and system',
        '3. Calculate monthly and annual costs',
        '4. Compare costs to budget constraints',
        '5. Identify cost optimization opportunities:',
        '   - Use cheaper storage tiers for older backups',
        '   - Optimize backup frequency vs storage costs',
        '   - Right-size standby infrastructure',
        '   - Use spot instances for DR testing',
        '   - Optimize replication bandwidth',
        '6. Perform cost-benefit analysis:',
        '   - Cost of DR vs cost of downtime',
        '   - ROI calculation',
        '7. Identify cost vs performance trade-offs',
        '8. Calculate TCO (Total Cost of Ownership) for 1, 3, 5 years',
        '9. Provide budget recommendations and alternatives',
        '10. Create cost analysis report with optimization recommendations'
      ],
      outputFormat: 'JSON object with cost analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'totalMonthlyCost', 'totalAnnualCost', 'costBreakdown', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        totalMonthlyCost: { type: 'string', description: 'Total monthly DR cost' },
        totalAnnualCost: { type: 'string', description: 'Total annual DR cost' },
        costBreakdown: {
          type: 'object',
          properties: {
            backupStorage: { type: 'string' },
            replication: { type: 'string' },
            standbyInfrastructure: { type: 'string' },
            monitoring: { type: 'string' },
            testing: { type: 'string' },
            personnel: { type: 'string' },
            other: { type: 'string' }
          }
        },
        budgetConstraints: { type: 'string' },
        budgetExceeded: { type: 'boolean' },
        budgetOverage: { type: 'number', description: 'Percentage over budget' },
        optimizationRecommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              area: { type: 'string' },
              currentCost: { type: 'string' },
              optimizedCost: { type: 'string' },
              savings: { type: 'string' },
              recommendation: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        costBenefitAnalysis: {
          type: 'object',
          properties: {
            estimatedDowntimeCostPerHour: { type: 'string' },
            drCostPerMonth: { type: 'string' },
            breakEvenDowntimeHours: { type: 'number' },
            roi: { type: 'string' }
          }
        },
        tco: {
          type: 'object',
          properties: {
            year1: { type: 'string' },
            year3: { type: 'string' },
            year5: { type: 'string' }
          }
        },
        costReportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'disaster-recovery', 'cost-analysis']
}));

// Phase 14: Develop Training Program
export const developTrainingProgramTask = defineTask('develop-training-program', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 14: Develop Training and Awareness Program - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Training and Development Specialist',
      task: 'Develop comprehensive training and awareness program for disaster recovery',
      context: {
        projectName: args.projectName,
        criticalSystems: args.criticalSystems,
        runbooksResult: args.runbooksResult,
        incidentCommandResult: args.incidentCommandResult,
        testingPlanResult: args.testingPlanResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify target audiences and their training needs:',
        '   - Incident commanders and leads',
        '   - On-call engineers and SREs',
        '   - System administrators',
        '   - Development teams',
        '   - Management and executives',
        '2. Develop training modules:',
        '   - DR plan overview and objectives',
        '   - Roles and responsibilities',
        '   - Recovery procedures and runbooks',
        '   - Incident command structure',
        '   - Communication protocols',
        '   - Hands-on DR testing exercises',
        '3. Create training materials:',
        '   - Presentation slides',
        '   - Video tutorials',
        '   - Interactive simulations',
        '   - Hands-on labs',
        '   - Quick reference guides',
        '4. Define training delivery methods:',
        '   - Instructor-led training',
        '   - Self-paced online courses',
        '   - DR simulation exercises',
        '   - Tabletop exercises',
        '5. Create training schedule for next 12 months',
        '6. Define training completion requirements and tracking',
        '7. Develop awareness campaigns (posters, emails, newsletters)',
        '8. Create post-training assessment and certification',
        '9. Plan for regular refresher training',
        '10. Document training program with materials and schedules'
      ],
      outputFormat: 'JSON object with training program details'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'trainingModules', 'targetAudience', 'trainingSchedule', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        trainingModules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              targetAudience: { type: 'array', items: { type: 'string' } },
              duration: { type: 'string' },
              deliveryMethod: { type: 'string', enum: ['instructor-led', 'self-paced', 'simulation', 'hands-on'] },
              topics: { type: 'array', items: { type: 'string' } },
              materialsPath: { type: 'string' }
            }
          }
        },
        targetAudience: { type: 'array', items: { type: 'string' } },
        trainingSchedule: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              moduleName: { type: 'string' },
              scheduledDate: { type: 'string' },
              audience: { type: 'string' },
              deliveryMethod: { type: 'string' }
            }
          }
        },
        trainingMaterials: {
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
        certificationRequired: { type: 'boolean' },
        refresherTrainingFrequency: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'disaster-recovery', 'training']
}));

// Phase 15: Finalize DR Plan Documentation
export const finalizeDRPlanDocumentationTask = defineTask('finalize-dr-plan-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 15: Finalize DR Plan Documentation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Documentation Lead',
      task: 'Finalize comprehensive disaster recovery plan documentation',
      context: {
        projectName: args.projectName,
        environment: args.environment,
        infrastructure: args.infrastructure,
        criticalSystems: args.criticalSystems,
        biaResult: args.biaResult,
        riskAssessment: args.riskAssessment,
        rto: args.rto,
        rpo: args.rpo,
        recoveryStrategies: args.recoveryStrategies,
        runbooksResult: args.runbooksResult,
        incidentCommandResult: args.incidentCommandResult,
        testingSchedule: args.testingSchedule,
        drMonitoringResult: args.drMonitoringResult,
        complianceResult: args.complianceResult,
        costAnalysisResult: args.costAnalysisResult,
        trainingProgramResult: args.trainingProgramResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create comprehensive DR Plan document including:',
        '   - Executive Summary',
        '   - Introduction and purpose',
        '   - Scope and objectives',
        '   - Business Impact Analysis summary',
        '   - Risk Assessment summary',
        '   - Recovery objectives (RTO/RPO)',
        '   - Recovery strategies',
        '   - Backup and replication strategy',
        '   - High availability architecture',
        '   - Failover procedures',
        '   - Incident command structure',
        '   - Communication plan',
        '   - Recovery runbooks index',
        '   - Testing plan and schedule',
        '   - Training program',
        '   - Monitoring and alerting',
        '   - Compliance mapping',
        '   - Cost analysis',
        '   - Maintenance and review procedures',
        '   - Appendices (contact lists, checklists, templates)',
        '2. Create executive summary (2-3 pages) for leadership',
        '3. Include architecture diagrams and flowcharts',
        '4. Add version control and change log',
        '5. Define document review and update schedule',
        '6. Create quick reference guides for common scenarios',
        '7. Generate table of contents and index',
        '8. Format document professionally (Markdown with PDF export)',
        '9. Create document distribution list',
        '10. Package all documentation and artifacts'
      ],
      outputFormat: 'JSON object with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'mainDocumentPath', 'executiveSummaryPath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        mainDocumentPath: { type: 'string', description: 'Main DR plan document path' },
        executiveSummaryPath: { type: 'string', description: 'Executive summary path' },
        quickReferenceGuidePath: { type: 'string' },
        documentVersion: { type: 'string' },
        lastReviewDate: { type: 'string' },
        nextReviewDate: { type: 'string' },
        reviewFrequency: { type: 'string' },
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
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'disaster-recovery', 'documentation']
}));

// Phase 16: Assess DR Readiness
export const assessDRReadinessTask = defineTask('assess-dr-readiness', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 16: Assess DR Readiness - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Disaster Recovery Auditor',
      task: 'Conduct final disaster recovery readiness assessment',
      context: {
        projectName: args.projectName,
        criticalSystems: args.criticalSystems,
        rto: args.rto,
        rpo: args.rpo,
        recoveryStrategies: args.recoveryStrategies,
        testingPlanResult: args.testingPlanResult,
        drMonitoringResult: args.drMonitoringResult,
        complianceResult: args.complianceResult,
        trainingProgramResult: args.trainingProgramResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Assess DR readiness across all dimensions:',
        '   - Backup and recovery: 25% weight',
        '     * Backup coverage complete',
        '     * Backup tested and verified',
        '     * Restore procedures documented',
        '     * RPO met',
        '   - High availability and redundancy: 20% weight',
        '     * HA architecture implemented',
        '     * Redundancy at all layers',
        '     * Multi-region deployment (if required)',
        '   - Failover capabilities: 20% weight',
        '     * Failover procedures documented',
        '     * Failover tested',
        '     * Automation level acceptable',
        '     * RTO met',
        '   - Documentation and runbooks: 15% weight',
        '     * DR plan complete and approved',
        '     * Recovery runbooks created',
        '     * Procedures clear and actionable',
        '   - Monitoring and alerting: 10% weight',
        '     * DR monitoring implemented',
        '     * Alerts configured',
        '     * Dashboards created',
        '   - Training and awareness: 5% weight',
        '     * Team trained on DR procedures',
        '     * Roles and responsibilities clear',
        '   - Compliance and audit: 5% weight',
        '     * Compliance requirements met',
        '     * Audit trail in place',
        '2. Calculate weighted readiness score (0-100)',
        '3. Determine readiness status:',
        '   - 90-100: Excellent - Production ready',
        '   - 75-89: Good - Minor improvements needed',
        '   - 60-74: Fair - Moderate improvements needed',
        '   - < 60: Poor - Significant work required',
        '4. Identify gaps and weaknesses',
        '5. Identify strengths and best practices',
        '6. Provide actionable recommendations',
        '7. Assess risk of proceeding to production',
        '8. Create DR readiness scorecard',
        '9. Generate executive readiness report',
        '10. Provide go/no-go recommendation for production'
      ],
      outputFormat: 'JSON object with readiness assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['readinessScore', 'readinessStatus', 'gaps', 'recommendation', 'assessmentReportPath', 'artifacts'],
      properties: {
        readinessScore: { type: 'number', minimum: 0, maximum: 100 },
        readinessStatus: { type: 'string', enum: ['excellent', 'good', 'fair', 'poor'] },
        componentScores: {
          type: 'object',
          properties: {
            backupRecovery: { type: 'number' },
            highAvailability: { type: 'number' },
            failoverCapabilities: { type: 'number' },
            documentation: { type: 'number' },
            monitoring: { type: 'number' },
            training: { type: 'number' },
            compliance: { type: 'number' }
          }
        },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              area: { type: 'string' },
              gap: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              recommendation: { type: 'string' }
            }
          }
        },
        strengths: {
          type: 'array',
          items: { type: 'string' }
        },
        productionReady: { type: 'boolean', description: 'Ready for production deployment' },
        goNoGoDecision: { type: 'string', enum: ['go', 'go-with-conditions', 'no-go'] },
        recommendation: { type: 'string', description: 'Overall recommendation and next steps' },
        riskAssessment: {
          type: 'object',
          properties: {
            riskLevel: { type: 'string', enum: ['low', 'medium', 'high'] },
            riskFactors: { type: 'array', items: { type: 'string' } }
          }
        },
        assessmentReportPath: { type: 'string' },
        scorecardPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'disaster-recovery', 'readiness-assessment']
}));
