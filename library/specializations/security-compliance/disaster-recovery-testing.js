/**
 * @process specializations/security-compliance/disaster-recovery-testing
 * @description Disaster Recovery Testing - Comprehensive framework for planning, executing, and validating disaster recovery
 * procedures to ensure business continuity. Includes DR plan review, test scenario development, execution of failover/failback
 * procedures, recovery time objective (RTO) and recovery point objective (RPO) validation, stakeholder communication,
 * post-test analysis, and continuous improvement of DR capabilities.
 * @inputs { organizationName: string, drScope?: array, testType?: string, rtoTarget?: number, rpoTarget?: number, criticalSystems?: array }
 * @outputs { success: boolean, testScore: number, drReadinessScore: number, rtoAchieved: number, rpoAchieved: number, findings: array, recommendations: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/security-compliance/disaster-recovery-testing', {
 *   organizationName: 'Acme Corporation',
 *   drScope: ['infrastructure', 'applications', 'data', 'communications'],
 *   testType: 'full-interruption', // 'tabletop', 'walkthrough', 'simulation', 'parallel', 'full-interruption'
 *   rtoTarget: 4, // hours
 *   rpoTarget: 1, // hours
 *   criticalSystems: ['customer-database', 'payment-processing', 'web-application'],
 *   disasterScenario: 'datacenter-outage', // 'datacenter-outage', 'ransomware', 'natural-disaster', 'cyber-attack', 'hardware-failure'
 *   includeFailback: true,
 *   stakeholderInvolvement: ['IT', 'security', 'operations', 'executives', 'communications'],
 *   regulatoryRequirements: ['SOC2', 'ISO22301', 'HIPAA'],
 *   outputDir: 'dr-testing-output'
 * });
 *
 * @references
 * - NIST SP 800-34: Contingency Planning Guide: https://csrc.nist.gov/publications/detail/sp/800-34/rev-1/final
 * - ISO 22301 Business Continuity Management: https://www.iso.org/standard/75106.html
 * - NIST SP 800-84: Guide to Test, Training, and Exercise Programs: https://csrc.nist.gov/publications/detail/sp/800-84/final
 * - FEMA National Exercise Program: https://www.fema.gov/emergency-managers/national-preparedness/exercises
 * - SANS Disaster Recovery Testing: https://www.sans.org/white-papers/
 * - BCI Good Practice Guidelines: https://www.thebci.org/training-qualifications/good-practice-guidelines.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationName,
    drScope = ['infrastructure', 'applications', 'data', 'communications', 'personnel'],
    testType = 'simulation', // 'tabletop', 'walkthrough', 'simulation', 'parallel', 'full-interruption'
    rtoTarget = 4, // Recovery Time Objective in hours
    rpoTarget = 1, // Recovery Point Objective in hours
    criticalSystems = [],
    disasterScenario = 'datacenter-outage',
    includeFailback = true,
    stakeholderInvolvement = ['IT', 'security', 'operations', 'executives'],
    regulatoryRequirements = [],
    outputDir = 'dr-testing-output',
    drPlanLocation = null, // Path to existing DR plan
    notificationChannels = ['email', 'sms', 'phone', 'slack'],
    budgetConstraints = null,
    previousTestResults = null,
    automatedRecovery = false
  } = inputs;

  const startTime = ctx.now();
  const testId = `DR-TEST-${Date.now()}`;
  const artifacts = [];
  let testScore = 0;
  let drReadinessScore = 0;
  let rtoAchieved = 0;
  let rpoAchieved = 0;
  const findings = [];
  const recommendations = [];

  ctx.log('info', `Starting Disaster Recovery Testing Process for ${organizationName}`);
  ctx.log('info', `Test ID: ${testId}, Test Type: ${testType}, Scenario: ${disasterScenario}`);
  ctx.log('info', `RTO Target: ${rtoTarget}h, RPO Target: ${rpoTarget}h, Critical Systems: ${criticalSystems.length}`);

  // ============================================================================
  // PHASE 1: DR PLAN REVIEW AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Reviewing and validating disaster recovery plan');

  const planReview = await ctx.task(reviewDRPlanTask, {
    testId,
    organizationName,
    drPlanLocation,
    drScope,
    criticalSystems,
    rtoTarget,
    rpoTarget,
    regulatoryRequirements,
    outputDir
  });

  artifacts.push(...planReview.artifacts);
  findings.push(...planReview.findings);

  ctx.log('info', `DR Plan Review Complete - Plan Status: ${planReview.planStatus}, Gaps: ${planReview.gapsIdentified}`);

  // Quality Gate: DR Plan Readiness
  if (planReview.planStatus !== 'current' || planReview.gapsIdentified > 5) {
    await ctx.breakpoint({
      question: `DR Plan review for ${organizationName} identified ${planReview.gapsIdentified} gaps. Plan status: ${planReview.planStatus}. Major gaps include: ${planReview.majorGaps.join(', ')}. Update plan before proceeding with test?`,
      title: 'DR Plan Readiness Review',
      context: {
        runId: ctx.runId,
        testId,
        planStatus: planReview.planStatus,
        gapsIdentified: planReview.gapsIdentified,
        majorGaps: planReview.majorGaps,
        lastReviewDate: planReview.lastReviewDate,
        recommendation: 'Address critical gaps in DR plan before conducting full test',
        files: planReview.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 2: TEST OBJECTIVES AND SCOPE DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 2: Defining test objectives, scope, and success criteria');

  const testPlanning = await ctx.task(defineTestObjectivesTask, {
    testId,
    organizationName,
    testType,
    drScope,
    criticalSystems,
    disasterScenario,
    rtoTarget,
    rpoTarget,
    includeFailback,
    planReview,
    regulatoryRequirements,
    outputDir
  });

  artifacts.push(...testPlanning.artifacts);

  ctx.log('info', `Test Planning Complete - ${testPlanning.testObjectives.length} objectives, ${testPlanning.successCriteria.length} success criteria`);

  // Quality Gate: Test Plan Approval
  await ctx.breakpoint({
    question: `DR Test plan for ${disasterScenario} scenario ready. Test type: ${testType}. ${testPlanning.testObjectives.length} objectives defined. Systems in scope: ${testPlanning.systemsInScope.length}. Approve test plan and schedule?`,
    title: 'DR Test Plan Approval',
    context: {
      runId: ctx.runId,
      testId,
      testType,
      disasterScenario,
      testObjectives: testPlanning.testObjectives,
      systemsInScope: testPlanning.systemsInScope,
      successCriteria: testPlanning.successCriteria,
      estimatedDuration: testPlanning.estimatedDuration,
      businessImpact: testPlanning.businessImpact,
      files: testPlanning.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 3: STAKEHOLDER COORDINATION AND COMMUNICATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Coordinating stakeholders and establishing communication channels');

  const stakeholderCoordination = await ctx.task(coordinateStakeholdersTask, {
    testId,
    organizationName,
    testType,
    testPlanning,
    stakeholderInvolvement,
    notificationChannels,
    disasterScenario,
    outputDir
  });

  artifacts.push(...stakeholderCoordination.artifacts);

  ctx.log('info', `Stakeholder Coordination Complete - ${stakeholderCoordination.stakeholdersNotified} notified, ${stakeholderCoordination.rolesAssigned} roles assigned`);

  // Quality Gate: Stakeholder Readiness
  if (!stakeholderCoordination.allRolesAssigned) {
    await ctx.breakpoint({
      question: `DR Test stakeholder coordination incomplete. Missing roles: ${stakeholderCoordination.missingRoles.join(', ')}. Critical for test execution. Assign missing roles before proceeding?`,
      title: 'Stakeholder Readiness Check',
      context: {
        runId: ctx.runId,
        testId,
        stakeholdersNotified: stakeholderCoordination.stakeholdersNotified,
        rolesAssigned: stakeholderCoordination.rolesAssigned,
        missingRoles: stakeholderCoordination.missingRoles,
        communicationChannels: stakeholderCoordination.communicationChannels,
        recommendation: 'All key roles must be assigned before DR test execution',
        files: stakeholderCoordination.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 4: PRE-TEST BASELINE AND PREPARATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Establishing baseline and preparing test environment');

  const baselinePreparation = await ctx.task(establishBaselineTask, {
    testId,
    organizationName,
    testType,
    criticalSystems,
    drScope,
    testPlanning,
    outputDir
  });

  artifacts.push(...baselinePreparation.artifacts);

  ctx.log('info', `Baseline Established - ${baselinePreparation.systemsDocumented} systems documented, ${baselinePreparation.checkpointsCreated} recovery checkpoints created`);

  // ============================================================================
  // PHASE 5: DISASTER SCENARIO SIMULATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Initiating disaster scenario simulation');

  const disasterSimulation = await ctx.task(simulateDisasterTask, {
    testId,
    organizationName,
    testType,
    disasterScenario,
    criticalSystems,
    testPlanning,
    baselinePreparation,
    automatedRecovery,
    outputDir
  });

  artifacts.push(...disasterSimulation.artifacts);
  findings.push(...disasterSimulation.findings);

  const disasterInitiatedAt = ctx.now();

  ctx.log('info', `Disaster Scenario Simulated - Type: ${disasterSimulation.simulationType}, Impact: ${disasterSimulation.impactLevel}`);

  // Quality Gate: Disaster Simulation Verification
  await ctx.breakpoint({
    question: `Disaster scenario "${disasterScenario}" has been simulated. ${disasterSimulation.systemsAffected} systems affected. Impact level: ${disasterSimulation.impactLevel}. Ready to proceed with recovery procedures?`,
    title: 'Disaster Simulation Verification',
    context: {
      runId: ctx.runId,
      testId,
      disasterScenario,
      systemsAffected: disasterSimulation.systemsAffected,
      impactLevel: disasterSimulation.impactLevel,
      affectedSystems: disasterSimulation.affectedSystemsList,
      simulationDetails: disasterSimulation.simulationDetails,
      files: disasterSimulation.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 6: NOTIFICATION AND ESCALATION PROCEDURES
  // ============================================================================

  ctx.log('info', 'Phase 6: Testing notification and escalation procedures');

  const notificationTest = await ctx.task(testNotificationProceduresTask, {
    testId,
    organizationName,
    disasterScenario,
    stakeholderCoordination,
    notificationChannels,
    testPlanning,
    outputDir
  });

  artifacts.push(...notificationTest.artifacts);
  findings.push(...notificationTest.findings);

  ctx.log('info', `Notification Test Complete - ${notificationTest.notificationsSent} sent, ${notificationTest.notificationsReceived} confirmed received`);

  // ============================================================================
  // PHASE 7: RECOVERY PROCEDURES EXECUTION
  // ============================================================================

  ctx.log('info', 'Phase 7: Executing disaster recovery procedures');

  const recoveryExecution = await ctx.task(executeRecoveryProceduresTask, {
    testId,
    organizationName,
    testType,
    disasterScenario,
    criticalSystems,
    testPlanning,
    baselinePreparation,
    disasterSimulation,
    stakeholderCoordination,
    automatedRecovery,
    outputDir
  });

  artifacts.push(...recoveryExecution.artifacts);
  findings.push(...recoveryExecution.findings);

  const recoveryCompletedAt = ctx.now();
  rtoAchieved = (recoveryCompletedAt - disasterInitiatedAt) / (1000 * 60 * 60); // hours

  ctx.log('info', `Recovery Execution Complete - Success: ${recoveryExecution.recoverySuccessful}, Systems Recovered: ${recoveryExecution.systemsRecovered}/${recoveryExecution.totalSystems}, RTO Achieved: ${rtoAchieved.toFixed(2)}h`);

  // Quality Gate: Recovery Success Verification
  if (!recoveryExecution.recoverySuccessful) {
    await ctx.breakpoint({
      question: `Disaster recovery execution incomplete. Only ${recoveryExecution.systemsRecovered}/${recoveryExecution.totalSystems} systems recovered. RTO target: ${rtoTarget}h, Achieved: ${rtoAchieved.toFixed(2)}h. Recovery issues: ${recoveryExecution.recoveryIssues.join(', ')}. Continue with failback or address issues?`,
      title: 'Recovery Execution Issues',
      context: {
        runId: ctx.runId,
        testId,
        systemsRecovered: recoveryExecution.systemsRecovered,
        totalSystems: recoveryExecution.totalSystems,
        rtoTarget,
        rtoAchieved: rtoAchieved.toFixed(2),
        recoveryIssues: recoveryExecution.recoveryIssues,
        failedSystems: recoveryExecution.failedSystems,
        recommendation: 'Address recovery issues before proceeding with failback',
        files: recoveryExecution.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 8: DATA INTEGRITY AND RPO VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Validating data integrity and recovery point objective');

  const [
    dataIntegrityValidation,
    rpoValidation,
    applicationValidation
  ] = await ctx.parallel.all([
    () => ctx.task(validateDataIntegrityTask, {
      testId,
      organizationName,
      criticalSystems,
      baselinePreparation,
      recoveryExecution,
      outputDir
    }),
    () => ctx.task(validateRPOTask, {
      testId,
      organizationName,
      criticalSystems,
      rpoTarget,
      baselinePreparation,
      disasterSimulation,
      recoveryExecution,
      outputDir
    }),
    () => ctx.task(validateApplicationFunctionalityTask, {
      testId,
      organizationName,
      criticalSystems,
      testPlanning,
      recoveryExecution,
      outputDir
    })
  ]);

  artifacts.push(
    ...dataIntegrityValidation.artifacts,
    ...rpoValidation.artifacts,
    ...applicationValidation.artifacts
  );
  findings.push(
    ...dataIntegrityValidation.findings,
    ...rpoValidation.findings,
    ...applicationValidation.findings
  );

  rpoAchieved = rpoValidation.actualRPO;

  ctx.log('info', `Validation Complete - Data Integrity: ${dataIntegrityValidation.integrityScore}%, RPO Achieved: ${rpoAchieved.toFixed(2)}h, Application Functionality: ${applicationValidation.functionalityScore}%`);

  // Quality Gate: Data Integrity Check
  if (dataIntegrityValidation.integrityScore < 95 || dataIntegrityValidation.dataLossDetected) {
    await ctx.breakpoint({
      question: `Data integrity issues detected. Integrity score: ${dataIntegrityValidation.integrityScore}%. Data loss: ${dataIntegrityValidation.dataLossDetected}. Records affected: ${dataIntegrityValidation.recordsAffected}. RPO target: ${rpoTarget}h, Achieved: ${rpoAchieved.toFixed(2)}h. Investigate data issues?`,
      title: 'Data Integrity Concerns',
      context: {
        runId: ctx.runId,
        testId,
        integrityScore: dataIntegrityValidation.integrityScore,
        dataLossDetected: dataIntegrityValidation.dataLossDetected,
        recordsAffected: dataIntegrityValidation.recordsAffected,
        corruptedFiles: dataIntegrityValidation.corruptedFiles,
        rpoTarget,
        rpoAchieved: rpoAchieved.toFixed(2),
        recommendation: 'Investigate backup and replication procedures',
        files: [
          ...dataIntegrityValidation.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown', label: a.label })),
          ...rpoValidation.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown', label: a.label }))
        ]
      }
    });
  }

  // ============================================================================
  // PHASE 9: FAILBACK PROCEDURES (IF INCLUDED)
  // ============================================================================

  let failbackResult = null;

  if (includeFailback) {
    ctx.log('info', 'Phase 9: Executing failback procedures to primary environment');

    failbackResult = await ctx.task(executeFailbackProceduresTask, {
      testId,
      organizationName,
      testType,
      criticalSystems,
      testPlanning,
      baselinePreparation,
      recoveryExecution,
      dataIntegrityValidation,
      outputDir
    });

    artifacts.push(...failbackResult.artifacts);
    findings.push(...failbackResult.findings);

    ctx.log('info', `Failback Complete - Success: ${failbackResult.failbackSuccessful}, Systems Restored: ${failbackResult.systemsRestoredToPrimary}/${failbackResult.totalSystems}`);

    // Quality Gate: Failback Verification
    if (!failbackResult.failbackSuccessful) {
      await ctx.breakpoint({
        question: `Failback procedures incomplete. ${failbackResult.systemsRestoredToPrimary}/${failbackResult.totalSystems} systems restored to primary. Failback issues: ${failbackResult.failbackIssues.join(', ')}. Continue or rollback?`,
        title: 'Failback Verification',
        context: {
          runId: ctx.runId,
          testId,
          failbackSuccessful: failbackResult.failbackSuccessful,
          systemsRestoredToPrimary: failbackResult.systemsRestoredToPrimary,
          totalSystems: failbackResult.totalSystems,
          failbackIssues: failbackResult.failbackIssues,
          recommendation: 'Review failback procedures and replication configuration',
          files: failbackResult.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown', label: a.label }))
        }
      });
    }
  } else {
    ctx.log('info', 'Phase 9: Failback procedures not included in this test');
  }

  // ============================================================================
  // PHASE 10: PERFORMANCE AND CAPACITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 10: Assessing DR environment performance and capacity');

  const performanceAssessment = await ctx.task(assessPerformanceCapacityTask, {
    testId,
    organizationName,
    criticalSystems,
    testPlanning,
    recoveryExecution,
    applicationValidation,
    baselinePreparation,
    outputDir
  });

  artifacts.push(...performanceAssessment.artifacts);
  findings.push(...performanceAssessment.findings);

  ctx.log('info', `Performance Assessment Complete - Performance Score: ${performanceAssessment.performanceScore}%, Capacity Adequate: ${performanceAssessment.capacityAdequate}`);

  // ============================================================================
  // PHASE 11: DOCUMENTATION AND TIMELINE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 11: Documenting test execution and analyzing timeline');

  const timelineAnalysis = await ctx.task(analyzeTestTimelineTask, {
    testId,
    organizationName,
    testType,
    disasterScenario,
    startTime,
    disasterInitiatedAt,
    recoveryCompletedAt,
    rtoTarget,
    rpoTarget,
    rtoAchieved,
    rpoAchieved,
    testPlanning,
    notificationTest,
    recoveryExecution,
    failbackResult,
    outputDir
  });

  artifacts.push(...timelineAnalysis.artifacts);

  ctx.log('info', `Timeline Analysis Complete - Total Test Duration: ${timelineAnalysis.totalTestDuration}h, RTO Met: ${timelineAnalysis.rtoMet}, RPO Met: ${timelineAnalysis.rpoMet}`);

  // ============================================================================
  // PHASE 12: FINDINGS AND ISSUES ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 12: Analyzing findings and identifying issues');

  const findingsAnalysis = await ctx.task(analyzeFindingsTask, {
    testId,
    organizationName,
    testType,
    disasterScenario,
    findings,
    planReview,
    notificationTest,
    recoveryExecution,
    dataIntegrityValidation,
    applicationValidation,
    performanceAssessment,
    timelineAnalysis,
    outputDir
  });

  artifacts.push(...findingsAnalysis.artifacts);

  ctx.log('info', `Findings Analysis Complete - ${findingsAnalysis.criticalFindings} critical, ${findingsAnalysis.highFindings} high, ${findingsAnalysis.mediumFindings} medium findings`);

  // ============================================================================
  // PHASE 13: RECOMMENDATIONS AND CORRECTIVE ACTIONS
  // ============================================================================

  ctx.log('info', 'Phase 13: Generating recommendations and corrective actions');

  const recommendationsResult = await ctx.task(generateRecommendationsTask, {
    testId,
    organizationName,
    testType,
    findingsAnalysis,
    planReview,
    timelineAnalysis,
    rtoTarget,
    rpoTarget,
    rtoAchieved,
    rpoAchieved,
    recoveryExecution,
    performanceAssessment,
    regulatoryRequirements,
    outputDir
  });

  artifacts.push(...recommendationsResult.artifacts);
  recommendations.push(...recommendationsResult.recommendations);

  ctx.log('info', `Recommendations Generated - ${recommendationsResult.immediateActions} immediate, ${recommendationsResult.shortTermActions} short-term, ${recommendationsResult.longTermActions} long-term`);

  // ============================================================================
  // PHASE 14: POST-TEST REPORT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 14: Generating comprehensive post-test report');

  const testReport = await ctx.task(generateTestReportTask, {
    testId,
    organizationName,
    testType,
    disasterScenario,
    startTime,
    testPlanning,
    stakeholderCoordination,
    disasterSimulation,
    notificationTest,
    recoveryExecution,
    dataIntegrityValidation,
    rpoValidation,
    applicationValidation,
    failbackResult,
    performanceAssessment,
    timelineAnalysis,
    findingsAnalysis,
    recommendationsResult,
    rtoTarget,
    rpoTarget,
    rtoAchieved,
    rpoAchieved,
    regulatoryRequirements,
    outputDir
  });

  artifacts.push(...testReport.artifacts);

  // ============================================================================
  // PHASE 15: DR READINESS SCORING AND ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 15: Calculating DR readiness and test effectiveness scores');

  const scoringResult = await ctx.task(calculateDRScoresTask, {
    testId,
    organizationName,
    testType,
    rtoTarget,
    rpoTarget,
    rtoAchieved,
    rpoAchieved,
    planReview,
    recoveryExecution,
    dataIntegrityValidation,
    applicationValidation,
    performanceAssessment,
    notificationTest,
    failbackResult,
    findingsAnalysis,
    regulatoryRequirements,
    outputDir
  });

  testScore = scoringResult.testScore;
  drReadinessScore = scoringResult.drReadinessScore;
  artifacts.push(...scoringResult.artifacts);

  ctx.log('info', `DR Readiness Score: ${drReadinessScore}/100, Test Execution Score: ${testScore}/100`);

  // Final Breakpoint: DR Test Complete
  await ctx.breakpoint({
    question: `Disaster Recovery Test Complete for ${organizationName}. DR Readiness: ${drReadinessScore}/100, Test Score: ${testScore}/100. RTO Target: ${rtoTarget}h, Achieved: ${rtoAchieved.toFixed(2)}h. RPO Target: ${rpoTarget}h, Achieved: ${rpoAchieved.toFixed(2)}h. ${findingsAnalysis.criticalFindings} critical findings. Review results and approve corrective actions?`,
    title: 'Final DR Test Review',
    context: {
      runId: ctx.runId,
      summary: {
        testId,
        organizationName,
        testType,
        disasterScenario,
        drReadinessScore,
        testScore,
        rtoTarget,
        rtoAchieved: rtoAchieved.toFixed(2),
        rtoMet: timelineAnalysis.rtoMet,
        rpoTarget,
        rpoAchieved: rpoAchieved.toFixed(2),
        rpoMet: timelineAnalysis.rpoMet,
        totalTestDuration: timelineAnalysis.totalTestDuration,
        systemsRecovered: recoveryExecution.systemsRecovered,
        totalSystems: recoveryExecution.totalSystems,
        dataIntegrityScore: dataIntegrityValidation.integrityScore,
        applicationFunctionalityScore: applicationValidation.functionalityScore,
        failbackIncluded: includeFailback,
        failbackSuccessful: failbackResult ? failbackResult.failbackSuccessful : null
      },
      findings: {
        totalFindings: findingsAnalysis.totalFindings,
        criticalFindings: findingsAnalysis.criticalFindings,
        highFindings: findingsAnalysis.highFindings,
        mediumFindings: findingsAnalysis.mediumFindings,
        lowFindings: findingsAnalysis.lowFindings
      },
      recommendations: {
        immediate: recommendationsResult.immediateActions,
        shortTerm: recommendationsResult.shortTermActions,
        longTerm: recommendationsResult.longTermActions
      },
      readinessAssessment: scoringResult.readinessAssessment,
      verdict: scoringResult.verdict,
      topRecommendation: scoringResult.topRecommendation,
      files: [
        { path: testReport.reportPath, format: 'markdown', label: 'DR Test Report' },
        { path: timelineAnalysis.timelinePath, format: 'json', label: 'Test Timeline' },
        { path: findingsAnalysis.findingsReportPath, format: 'markdown', label: 'Findings Report' },
        { path: recommendationsResult.recommendationsPath, format: 'markdown', label: 'Recommendations' },
        { path: scoringResult.scorecardPath, format: 'json', label: 'DR Scorecard' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    testId,
    organizationName,
    testType,
    disasterScenario,
    testScore,
    drReadinessScore,
    rto: {
      target: rtoTarget,
      achieved: parseFloat(rtoAchieved.toFixed(2)),
      met: timelineAnalysis.rtoMet,
      variance: parseFloat((rtoAchieved - rtoTarget).toFixed(2))
    },
    rpo: {
      target: rpoTarget,
      achieved: parseFloat(rpoAchieved.toFixed(2)),
      met: timelineAnalysis.rpoMet,
      variance: parseFloat((rpoAchieved - rpoTarget).toFixed(2))
    },
    recovery: {
      successful: recoveryExecution.recoverySuccessful,
      systemsRecovered: recoveryExecution.systemsRecovered,
      totalSystems: recoveryExecution.totalSystems,
      recoveryRate: (recoveryExecution.systemsRecovered / recoveryExecution.totalSystems * 100),
      dataIntegrityScore: dataIntegrityValidation.integrityScore,
      applicationFunctionalityScore: applicationValidation.functionalityScore,
      performanceScore: performanceAssessment.performanceScore
    },
    failback: failbackResult ? {
      included: true,
      successful: failbackResult.failbackSuccessful,
      systemsRestoredToPrimary: failbackResult.systemsRestoredToPrimary,
      totalSystems: failbackResult.totalSystems
    } : {
      included: false
    },
    findings: {
      total: findingsAnalysis.totalFindings,
      critical: findingsAnalysis.criticalFindings,
      high: findingsAnalysis.highFindings,
      medium: findingsAnalysis.mediumFindings,
      low: findingsAnalysis.lowFindings,
      findingsList: findings
    },
    recommendations: {
      immediate: recommendationsResult.immediateActions,
      shortTerm: recommendationsResult.shortTermActions,
      longTerm: recommendationsResult.longTermActions,
      recommendationsList: recommendations
    },
    timeline: {
      testStarted: new Date(startTime).toISOString(),
      disasterInitiated: new Date(disasterInitiatedAt).toISOString(),
      recoveryCompleted: new Date(recoveryCompletedAt).toISOString(),
      testCompleted: new Date(endTime).toISOString(),
      totalTestDuration: timelineAnalysis.totalTestDuration,
      recoveryDuration: rtoAchieved
    },
    stakeholders: {
      notified: stakeholderCoordination.stakeholdersNotified,
      rolesAssigned: stakeholderCoordination.rolesAssigned,
      allRolesAssigned: stakeholderCoordination.allRolesAssigned
    },
    notifications: {
      sent: notificationTest.notificationsSent,
      received: notificationTest.notificationsReceived,
      successRate: notificationTest.notificationSuccessRate
    },
    planReview: {
      planStatus: planReview.planStatus,
      gapsIdentified: planReview.gapsIdentified,
      planNeedsUpdate: planReview.gapsIdentified > 0
    },
    assessment: {
      drReadiness: scoringResult.readinessAssessment,
      testEffectiveness: scoringResult.testEffectiveness,
      verdict: scoringResult.verdict,
      topRecommendation: scoringResult.topRecommendation
    },
    artifacts,
    documentation: {
      testReportPath: testReport.reportPath,
      executiveSummaryPath: testReport.executiveSummaryPath,
      timelinePath: timelineAnalysis.timelinePath,
      findingsReportPath: findingsAnalysis.findingsReportPath,
      recommendationsPath: recommendationsResult.recommendationsPath,
      scorecardPath: scoringResult.scorecardPath
    },
    duration,
    metadata: {
      processId: 'specializations/security-compliance/disaster-recovery-testing',
      processSlug: 'disaster-recovery-testing',
      category: 'Risk Management',
      specializationSlug: 'security-compliance',
      timestamp: startTime,
      testType,
      disasterScenario,
      regulatoryRequirements,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: Review DR Plan
export const reviewDRPlanTask = defineTask('review-dr-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Review Disaster Recovery Plan - ${args.testId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Disaster Recovery Planning Specialist',
      task: 'Review and validate disaster recovery plan for completeness and currency',
      context: {
        testId: args.testId,
        organizationName: args.organizationName,
        drPlanLocation: args.drPlanLocation,
        drScope: args.drScope,
        criticalSystems: args.criticalSystems,
        rtoTarget: args.rtoTarget,
        rpoTarget: args.rpoTarget,
        regulatoryRequirements: args.regulatoryRequirements,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Locate and review the organization\'s disaster recovery plan',
        '2. Verify plan currency:',
        '   - Last review/update date',
        '   - Plan version and ownership',
        '   - Scheduled review frequency',
        '3. Assess plan completeness for each scope area:',
        '   - Infrastructure recovery procedures',
        '   - Application recovery procedures',
        '   - Data backup and restoration procedures',
        '   - Communication and notification procedures',
        '   - Personnel roles and responsibilities',
        '4. Validate critical elements:',
        '   - Disaster scenarios and triggers',
        '   - RTO and RPO definitions for each system',
        '   - Recovery priorities and dependencies',
        '   - Contact lists and call trees (current and accurate)',
        '   - Vendor and third-party contacts',
        '   - DR site information and access procedures',
        '5. Check for documented procedures:',
        '   - Step-by-step recovery instructions',
        '   - Failover and failback procedures',
        '   - Data restoration procedures',
        '   - System validation and testing steps',
        '6. Verify resource availability:',
        '   - DR site capacity and readiness',
        '   - Backup infrastructure availability',
        '   - Required tools and software',
        '   - Network connectivity and bandwidth',
        '7. Review against regulatory requirements (SOC2, ISO22301, HIPAA, etc.)',
        '8. Identify gaps, outdated information, and missing procedures',
        '9. Assess plan\'s alignment with current IT environment',
        '10. Document plan status (current, needs-update, outdated)',
        '11. Create gap analysis report with prioritized recommendations',
        '12. Generate DR plan review summary'
      ],
      outputFormat: 'JSON object with DR plan review results'
    },
    outputSchema: {
      type: 'object',
      required: ['planStatus', 'gapsIdentified', 'findings', 'artifacts'],
      properties: {
        planStatus: { type: 'string', enum: ['current', 'needs-update', 'outdated', 'missing'] },
        lastReviewDate: { type: 'string' },
        planVersion: { type: 'string' },
        planOwner: { type: 'string' },
        gapsIdentified: { type: 'number' },
        majorGaps: { type: 'array', items: { type: 'string' } },
        completenessScore: { type: 'number', minimum: 0, maximum: 100 },
        scopeCoverage: {
          type: 'object',
          properties: {
            infrastructure: { type: 'boolean' },
            applications: { type: 'boolean' },
            data: { type: 'boolean' },
            communications: { type: 'boolean' },
            personnel: { type: 'boolean' }
          }
        },
        criticalSystemsCovered: { type: 'number', description: 'Number of critical systems with documented procedures' },
        contactListsCurrent: { type: 'boolean' },
        rtoRpoDocumented: { type: 'boolean' },
        drSiteReady: { type: 'boolean' },
        regulatoryCompliance: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              framework: { type: 'string' },
              compliant: { type: 'boolean' },
              gaps: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        findings: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'disaster-recovery', 'plan-review']
}));

// Phase 2: Define Test Objectives
export const defineTestObjectivesTask = defineTask('define-test-objectives', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Define Test Objectives and Scope - ${args.testId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DR Testing Coordinator',
      task: 'Define test objectives, scope, and success criteria for disaster recovery test',
      context: {
        testId: args.testId,
        organizationName: args.organizationName,
        testType: args.testType,
        drScope: args.drScope,
        criticalSystems: args.criticalSystems,
        disasterScenario: args.disasterScenario,
        rtoTarget: args.rtoTarget,
        rpoTarget: args.rpoTarget,
        includeFailback: args.includeFailback,
        planReview: args.planReview,
        regulatoryRequirements: args.regulatoryRequirements,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define test objectives based on test type:',
        '   - Tabletop: Review procedures, identify gaps, train personnel',
        '   - Walkthrough: Validate procedures step-by-step without execution',
        '   - Simulation: Execute procedures in test environment',
        '   - Parallel: Run DR systems alongside production',
        '   - Full Interruption: Complete failover to DR with production downtime',
        '2. Set specific, measurable test objectives (8-12 objectives):',
        '   - Validate RTO and RPO targets',
        '   - Test failover procedures',
        '   - Verify data recovery and integrity',
        '   - Test application functionality in DR environment',
        '   - Validate communication procedures',
        '   - Test staff readiness and knowledge',
        '   - Verify vendor and third-party coordination',
        '   - Test monitoring and alerting systems',
        '3. Define test scope:',
        '   - Systems and applications in scope',
        '   - Infrastructure components to test',
        '   - Data sets to recover',
        '   - Personnel involved',
        '   - Timeframe and schedule',
        '4. Establish success criteria for each objective:',
        '   - RTO met: Recovery completed within target time',
        '   - RPO met: Data loss within acceptable limits',
        '   - All critical systems operational',
        '   - Data integrity validated (>99% accuracy)',
        '   - Application functionality verified (100% of critical functions)',
        '   - Communication procedures successful (>95% notification delivery)',
        '5. Define test phases and timeline:',
        '   - Pre-test preparation phase',
        '   - Disaster simulation phase',
        '   - Recovery execution phase',
        '   - Validation phase',
        '   - Failback phase (if included)',
        '   - Post-test analysis phase',
        '6. Identify systems and dependencies in scope',
        '7. Document risks and mitigation strategies',
        '8. Estimate test duration and resource requirements',
        '9. Define business impact and acceptable downtime',
        '10. Create detailed test plan document',
        '11. Establish rollback procedures in case of test failure'
      ],
      outputFormat: 'JSON object with test plan details'
    },
    outputSchema: {
      type: 'object',
      required: ['testObjectives', 'successCriteria', 'systemsInScope', 'estimatedDuration', 'artifacts'],
      properties: {
        testObjectives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              objective: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              measurable: { type: 'boolean' }
            }
          }
        },
        successCriteria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              target: { type: 'string' },
              measurement: { type: 'string' }
            }
          }
        },
        systemsInScope: { type: 'array', items: { type: 'string' } },
        infrastructureInScope: { type: 'array', items: { type: 'string' } },
        applicationsInScope: { type: 'array', items: { type: 'string' } },
        dataInScope: { type: 'array', items: { type: 'string' } },
        testPhases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string' },
              duration: { type: 'string' },
              activities: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        estimatedDuration: { type: 'string' },
        businessImpact: { type: 'string', enum: ['none', 'minimal', 'moderate', 'significant'] },
        risks: { type: 'array', items: { type: 'string' } },
        mitigations: { type: 'array', items: { type: 'string' } },
        rollbackProcedures: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'disaster-recovery', 'test-planning']
}));

// Phase 3: Coordinate Stakeholders
export const coordinateStakeholdersTask = defineTask('coordinate-stakeholders', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Coordinate Stakeholders and Communication - ${args.testId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DR Test Coordinator',
      task: 'Coordinate stakeholders, assign roles, and establish communication channels',
      context: {
        testId: args.testId,
        organizationName: args.organizationName,
        testType: args.testType,
        testPlanning: args.testPlanning,
        stakeholderInvolvement: args.stakeholderInvolvement,
        notificationChannels: args.notificationChannels,
        disasterScenario: args.disasterScenario,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify all stakeholders required for DR test:',
        '   - DR Test Coordinator (overall test management)',
        '   - Incident Commander (simulated disaster response)',
        '   - Technical Recovery Team (infrastructure, applications, data)',
        '   - Security Team (security validation)',
        '   - Network Team (connectivity and network recovery)',
        '   - Database Team (data recovery and validation)',
        '   - Application Team (application recovery and validation)',
        '   - Communications Lead (internal and external communications)',
        '   - Business Representatives (business validation)',
        '   - Executive Sponsor (approval and oversight)',
        '   - Vendor/Third-party Contacts (if needed)',
        '2. Assign roles and responsibilities:',
        '   - Create RACI matrix (Responsible, Accountable, Consulted, Informed)',
        '   - Document specific tasks for each role',
        '   - Identify decision makers for each phase',
        '3. Notify all stakeholders:',
        '   - Send test notification with date, time, objectives',
        '   - Provide test plan and procedures',
        '   - Share contact information and communication channels',
        '   - Confirm attendance and availability',
        '4. Establish communication channels:',
        '   - Primary: Conference bridge, Slack/Teams channel, War room',
        '   - Backup: Phone, email, SMS',
        '   - Emergency: Executive escalation path',
        '5. Set up DR test command center:',
        '   - Physical or virtual war room',
        '   - Communication tools and platforms',
        '   - Monitoring dashboards',
        '   - Documentation and logging systems',
        '6. Schedule pre-test briefing and kickoff meeting',
        '7. Distribute test procedures and runbooks',
        '8. Verify all participants have necessary access and credentials',
        '9. Create communication plan with notification templates',
        '10. Document stakeholder roster with contact information'
      ],
      outputFormat: 'JSON object with stakeholder coordination details'
    },
    outputSchema: {
      type: 'object',
      required: ['stakeholdersNotified', 'rolesAssigned', 'allRolesAssigned', 'communicationChannels', 'artifacts'],
      properties: {
        stakeholdersNotified: { type: 'number' },
        rolesAssigned: { type: 'number' },
        allRolesAssigned: { type: 'boolean' },
        missingRoles: { type: 'array', items: { type: 'string' } },
        stakeholderRoster: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              role: { type: 'string' },
              team: { type: 'string' },
              contact: { type: 'string' },
              primaryChannel: { type: 'string' }
            }
          }
        },
        communicationChannels: {
          type: 'object',
          properties: {
            primary: { type: 'array', items: { type: 'string' } },
            backup: { type: 'array', items: { type: 'string' } },
            emergency: { type: 'array', items: { type: 'string' } }
          }
        },
        warRoomUrl: { type: 'string' },
        conferenceDetails: { type: 'string' },
        kickoffMeetingScheduled: { type: 'boolean' },
        kickoffDateTime: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'disaster-recovery', 'coordination']
}));

// Phase 4: Establish Baseline
export const establishBaselineTask = defineTask('establish-baseline', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Establish Baseline and Prepare Environment - ${args.testId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DR Test Preparation Specialist',
      task: 'Establish baseline and prepare test environment for disaster recovery test',
      context: {
        testId: args.testId,
        organizationName: args.organizationName,
        testType: args.testType,
        criticalSystems: args.criticalSystems,
        drScope: args.drScope,
        testPlanning: args.testPlanning,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Document current production environment state:',
        '   - System configurations and versions',
        '   - Application versions and configurations',
        '   - Database sizes and record counts',
        '   - Network topology and connectivity',
        '   - Performance metrics (CPU, memory, disk, network)',
        '   - Active transactions and sessions',
        '2. Create recovery checkpoints:',
        '   - Take snapshots of VMs and systems',
        '   - Document database checkpoints with timestamps',
        '   - Record last backup timestamps and locations',
        '   - Capture application state',
        '3. Verify backup availability and integrity:',
        '   - Check last successful backup date/time',
        '   - Verify backup completeness',
        '   - Test backup accessibility',
        '   - Validate backup restoration capability',
        '4. Prepare DR environment:',
        '   - Verify DR site capacity and readiness',
        '   - Check network connectivity to DR site',
        '   - Verify DR system resources (compute, storage, network)',
        '   - Validate access credentials and permissions',
        '   - Prepare monitoring and logging infrastructure',
        '5. Document system dependencies:',
        '   - Application dependencies and integration points',
        '   - Database dependencies',
        '   - External service dependencies',
        '   - Recovery order and priorities',
        '6. Create baseline data set for validation:',
        '   - Sample records from each critical database',
        '   - File checksums for critical files',
        '   - Transaction logs and timestamps',
        '7. Set up test monitoring and logging:',
        '   - Enable detailed logging on all systems',
        '   - Configure monitoring dashboards',
        '   - Set up automated alerting',
        '8. Verify rollback capability',
        '9. Generate baseline report with all measurements'
      ],
      outputFormat: 'JSON object with baseline and preparation details'
    },
    outputSchema: {
      type: 'object',
      required: ['baselineEstablished', 'systemsDocumented', 'checkpointsCreated', 'artifacts'],
      properties: {
        baselineEstablished: { type: 'boolean' },
        systemsDocumented: { type: 'number' },
        checkpointsCreated: { type: 'number' },
        baselineTimestamp: { type: 'string' },
        productionState: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              system: { type: 'string' },
              version: { type: 'string' },
              status: { type: 'string' },
              recordCount: { type: 'number' },
              lastBackup: { type: 'string' }
            }
          }
        },
        backupVerification: {
          type: 'object',
          properties: {
            backupsAvailable: { type: 'boolean' },
            lastBackupDate: { type: 'string' },
            backupIntegrityVerified: { type: 'boolean' },
            backupLocation: { type: 'string' }
          }
        },
        drEnvironmentReady: { type: 'boolean' },
        drSiteCapacity: { type: 'string' },
        networkConnectivity: { type: 'string' },
        monitoringEnabled: { type: 'boolean' },
        rollbackCapability: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'disaster-recovery', 'baseline']
}));

// Phase 5: Simulate Disaster
export const simulateDisasterTask = defineTask('simulate-disaster', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Simulate Disaster Scenario - ${args.testId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Disaster Simulation Specialist',
      task: 'Simulate disaster scenario according to test type and plan',
      context: {
        testId: args.testId,
        organizationName: args.organizationName,
        testType: args.testType,
        disasterScenario: args.disasterScenario,
        criticalSystems: args.criticalSystems,
        testPlanning: args.testPlanning,
        baselinePreparation: args.baselinePreparation,
        automatedRecovery: args.automatedRecovery,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Execute disaster simulation based on test type:',
        '   - Tabletop: Describe scenario, discuss response (no actual changes)',
        '   - Walkthrough: Step through procedures (no system changes)',
        '   - Simulation: Simulate failure in test environment',
        '   - Parallel: Switch to DR while production continues',
        '   - Full Interruption: Actual shutdown of production systems',
        '2. Implement disaster scenario:',
        '   - Datacenter Outage: Simulate network/power failure to primary datacenter',
        '   - Ransomware: Simulate encryption of systems and data',
        '   - Natural Disaster: Simulate geographic region unavailability',
        '   - Cyber Attack: Simulate security breach requiring isolation',
        '   - Hardware Failure: Simulate critical hardware component failure',
        '3. For simulation/parallel/full-interruption tests:',
        '   - Shut down or isolate affected systems in controlled manner',
        '   - Disable network connectivity to simulated failed components',
        '   - Trigger failover mechanisms (manual or automated)',
        '   - Document exact time of disaster initiation',
        '4. Record disaster impact:',
        '   - Systems affected',
        '   - Services unavailable',
        '   - Data at risk',
        '   - Users impacted',
        '5. Verify disaster simulation:',
        '   - Confirm systems are down/unavailable as expected',
        '   - Verify monitoring and alerting triggers',
        '   - Check that appropriate alarms fired',
        '6. Document simulation details:',
        '   - Disaster type and scope',
        '   - Systems affected',
        '   - Impact level',
        '   - Simulation timestamp',
        '7. Monitor for unintended impacts',
        '8. Prepare for recovery phase',
        '9. Generate disaster simulation report'
      ],
      outputFormat: 'JSON object with disaster simulation details'
    },
    outputSchema: {
      type: 'object',
      required: ['simulationType', 'systemsAffected', 'impactLevel', 'simulationDetails', 'findings', 'artifacts'],
      properties: {
        simulationType: { type: 'string' },
        disasterInitiatedAt: { type: 'string' },
        systemsAffected: { type: 'number' },
        affectedSystemsList: { type: 'array', items: { type: 'string' } },
        impactLevel: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
        servicesUnavailable: { type: 'array', items: { type: 'string' } },
        usersImpacted: { type: 'number' },
        monitoringTriggered: { type: 'boolean' },
        alertsFired: { type: 'array', items: { type: 'string' } },
        simulationDetails: {
          type: 'object',
          properties: {
            scenario: { type: 'string' },
            method: { type: 'string' },
            scope: { type: 'string' },
            controlledShutdown: { type: 'boolean' }
          }
        },
        unintendedImpacts: { type: 'array', items: { type: 'string' } },
        findings: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'disaster-recovery', 'simulation']
}));

// Phase 6: Test Notification Procedures
export const testNotificationProceduresTask = defineTask('test-notification-procedures', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Test Notification and Escalation Procedures - ${args.testId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DR Communications Specialist',
      task: 'Test notification and escalation procedures for disaster recovery',
      context: {
        testId: args.testId,
        organizationName: args.organizationName,
        disasterScenario: args.disasterScenario,
        stakeholderCoordination: args.stakeholderCoordination,
        notificationChannels: args.notificationChannels,
        testPlanning: args.testPlanning,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Test notification procedures:',
        '   - Trigger automated alerting systems',
        '   - Send notifications via all configured channels (email, SMS, phone, Slack)',
        '   - Activate call trees and escalation procedures',
        '   - Notify executives and business stakeholders',
        '2. Test each notification channel:',
        '   - Email notifications',
        '   - SMS/text message alerts',
        '   - Phone calls (automated and manual)',
        '   - Collaboration platform messages (Slack, Teams)',
        '   - Mobile app push notifications',
        '3. Measure notification effectiveness:',
        '   - Time from disaster to first notification sent',
        '   - Notification delivery success rate',
        '   - Time to acknowledgment by recipients',
        '   - Percentage of stakeholders reached',
        '4. Test escalation procedures:',
        '   - Primary contact response',
        '   - Escalation to backup contacts',
        '   - Executive notification',
        '   - Vendor/third-party notification',
        '5. Verify communication content:',
        '   - Clear description of incident',
        '   - Impact assessment',
        '   - Required actions',
        '   - Contact information',
        '   - Status update frequency',
        '6. Test backup communication methods:',
        '   - If primary fails, verify backup channels work',
        '   - Test out-of-band communication',
        '7. Document notification timeline:',
        '   - When each notification was sent',
        '   - When each was received/acknowledged',
        '   - Any delivery failures',
        '8. Identify notification gaps and failures',
        '9. Record stakeholder feedback on notifications',
        '10. Generate notification effectiveness report'
      ],
      outputFormat: 'JSON object with notification test results'
    },
    outputSchema: {
      type: 'object',
      required: ['notificationsSent', 'notificationsReceived', 'notificationSuccessRate', 'findings', 'artifacts'],
      properties: {
        notificationsSent: { type: 'number' },
        notificationsReceived: { type: 'number' },
        notificationSuccessRate: { type: 'number', description: 'Percentage' },
        timeToFirstNotification: { type: 'number', description: 'Seconds from disaster to first notification' },
        channelResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              channel: { type: 'string' },
              sent: { type: 'number' },
              delivered: { type: 'number' },
              acknowledged: { type: 'number' },
              successRate: { type: 'number' }
            }
          }
        },
        escalationTested: { type: 'boolean' },
        escalationSuccessful: { type: 'boolean' },
        executivesNotified: { type: 'boolean' },
        vendorsNotified: { type: 'boolean' },
        notificationTimeline: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              timestamp: { type: 'string' },
              recipient: { type: 'string' },
              channel: { type: 'string' },
              status: { type: 'string', enum: ['sent', 'delivered', 'acknowledged', 'failed'] }
            }
          }
        },
        failedNotifications: { type: 'array', items: { type: 'string' } },
        findings: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'disaster-recovery', 'notifications']
}));

// Phase 7: Execute Recovery Procedures
export const executeRecoveryProceduresTask = defineTask('execute-recovery-procedures', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Execute Disaster Recovery Procedures - ${args.testId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Disaster Recovery Engineer',
      task: 'Execute disaster recovery procedures to restore critical systems',
      context: {
        testId: args.testId,
        organizationName: args.organizationName,
        testType: args.testType,
        disasterScenario: args.disasterScenario,
        criticalSystems: args.criticalSystems,
        testPlanning: args.testPlanning,
        baselinePreparation: args.baselinePreparation,
        disasterSimulation: args.disasterSimulation,
        stakeholderCoordination: args.stakeholderCoordination,
        automatedRecovery: args.automatedRecovery,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Execute recovery procedures following documented DR plan:',
        '   - Follow recovery priority order (critical systems first)',
        '   - Execute procedures step-by-step as documented',
        '   - Use recovery runbooks and checklists',
        '   - Coordinate across recovery teams',
        '2. Infrastructure recovery:',
        '   - Activate DR site infrastructure',
        '   - Establish network connectivity',
        '   - Bring up core services (DNS, DHCP, Active Directory)',
        '   - Provision compute and storage resources',
        '   - Configure load balancers and firewalls',
        '3. Data recovery:',
        '   - Restore databases from backups',
        '   - Apply transaction logs',
        '   - Verify replication status',
        '   - Restore file systems and object storage',
        '   - Mount storage volumes',
        '4. Application recovery:',
        '   - Deploy application components in dependency order',
        '   - Configure application settings for DR environment',
        '   - Restore application data',
        '   - Start application services',
        '   - Verify application startup',
        '5. Service recovery:',
        '   - Restore dependent services',
        '   - Configure integrations',
        '   - Update DNS records to point to DR environment',
        '   - Enable external access',
        '6. Execute automated recovery where applicable:',
        '   - Trigger automated failover procedures',
        '   - Run recovery automation scripts',
        '   - Use infrastructure-as-code for rapid deployment',
        '7. Monitor recovery progress:',
        '   - Track system recovery status',
        '   - Monitor resource utilization',
        '   - Check for errors and issues',
        '   - Document recovery timeline',
        '8. Document each recovery action:',
        '   - Action taken',
        '   - Time of action',
        '   - Result (success/failure)',
        '   - Issues encountered',
        '   - Time to complete',
        '9. Coordinate with stakeholders throughout recovery',
        '10. Identify deviations from DR plan',
        '11. Record lessons learned during recovery',
        '12. Generate recovery execution report'
      ],
      outputFormat: 'JSON object with recovery execution results'
    },
    outputSchema: {
      type: 'object',
      required: ['recoverySuccessful', 'systemsRecovered', 'totalSystems', 'recoveryActions', 'findings', 'artifacts'],
      properties: {
        recoverySuccessful: { type: 'boolean' },
        systemsRecovered: { type: 'number' },
        totalSystems: { type: 'number' },
        recoveryStartedAt: { type: 'string' },
        recoveryCompletedAt: { type: 'string' },
        recoveryDuration: { type: 'number', description: 'Seconds' },
        recoveryActions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              timestamp: { type: 'string' },
              action: { type: 'string' },
              system: { type: 'string' },
              result: { type: 'string', enum: ['success', 'partial', 'failed'] },
              duration: { type: 'number' },
              notes: { type: 'string' }
            }
          }
        },
        infrastructureRecovered: { type: 'boolean' },
        dataRecovered: { type: 'boolean' },
        applicationsRecovered: { type: 'number' },
        servicesRecovered: { type: 'number' },
        automatedRecoveryUsed: { type: 'boolean' },
        automatedRecoverySuccessRate: { type: 'number' },
        failedSystems: { type: 'array', items: { type: 'string' } },
        recoveryIssues: { type: 'array', items: { type: 'string' } },
        deviationsFromPlan: { type: 'array', items: { type: 'string' } },
        findings: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'disaster-recovery', 'recovery-execution']
}));

// Phase 8.1: Validate Data Integrity
export const validateDataIntegrityTask = defineTask('validate-data-integrity', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Validate Data Integrity - ${args.testId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Integrity Specialist',
      task: 'Validate data integrity after disaster recovery',
      context: {
        testId: args.testId,
        organizationName: args.organizationName,
        criticalSystems: args.criticalSystems,
        baselinePreparation: args.baselinePreparation,
        recoveryExecution: args.recoveryExecution,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Compare recovered data against baseline:',
        '   - Database record counts',
        '   - File counts and sizes',
        '   - Checksum verification for critical files',
        '   - Sample data comparison',
        '2. Verify database integrity:',
        '   - Run database consistency checks',
        '   - Verify indexes and constraints',
        '   - Check for corruption',
        '   - Validate referential integrity',
        '3. Verify file system integrity:',
        '   - Check file system consistency',
        '   - Verify critical files present',
        '   - Compare file checksums',
        '   - Check for corrupted files',
        '4. Test data accessibility:',
        '   - Query databases',
        '   - Read files',
        '   - Verify permissions',
        '5. Identify data loss:',
        '   - Missing records',
        '   - Missing files',
        '   - Data gaps',
        '   - Timestamp analysis',
        '6. Calculate data integrity score (0-100%)',
        '7. Document any data corruption or loss',
        '8. Generate data integrity report'
      ],
      outputFormat: 'JSON object with data integrity results'
    },
    outputSchema: {
      type: 'object',
      required: ['integrityScore', 'dataLossDetected', 'findings', 'artifacts'],
      properties: {
        integrityScore: { type: 'number', minimum: 0, maximum: 100 },
        dataLossDetected: { type: 'boolean' },
        recordsAffected: { type: 'number' },
        filesAffected: { type: 'number' },
        corruptedFiles: { type: 'array', items: { type: 'string' } },
        missingRecords: { type: 'number' },
        databaseIntegrity: {
          type: 'object',
          properties: {
            consistencyCheckPassed: { type: 'boolean' },
            corruptionDetected: { type: 'boolean' },
            recordCountMatch: { type: 'boolean' }
          }
        },
        fileSystemIntegrity: {
          type: 'object',
          properties: {
            fsCheckPassed: { type: 'boolean' },
            checksumVerified: { type: 'boolean' },
            allFilesPresent: { type: 'boolean' }
          }
        },
        findings: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'disaster-recovery', 'data-validation']
}));

// Phase 8.2: Validate RPO
export const validateRPOTask = defineTask('validate-rpo', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Validate Recovery Point Objective (RPO) - ${args.testId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'RPO Validation Specialist',
      task: 'Validate recovery point objective and measure data loss',
      context: {
        testId: args.testId,
        organizationName: args.organizationName,
        criticalSystems: args.criticalSystems,
        rpoTarget: args.rpoTarget,
        baselinePreparation: args.baselinePreparation,
        disasterSimulation: args.disasterSimulation,
        recoveryExecution: args.recoveryExecution,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Determine recovery point for each system:',
        '   - Last successful backup timestamp',
        '   - Last replicated transaction',
        '   - Last checkpoint',
        '2. Calculate actual RPO:',
        '   - Time from disaster initiation to last recoverable data point',
        '   - Measured in hours or minutes',
        '   - Calculate for each critical system',
        '3. Compare actual RPO to target RPO:',
        '   - RPO met if actual <= target',
        '   - Calculate variance',
        '4. Identify data loss window:',
        '   - Transactions lost',
        '   - Time period of lost data',
        '   - Business impact of data loss',
        '5. Verify recovery point consistency across systems:',
        '   - Check for timing discrepancies',
        '   - Verify related systems recovered to same point',
        '6. Document RPO for each system',
        '7. Calculate overall RPO achievement',
        '8. Generate RPO validation report'
      ],
      outputFormat: 'JSON object with RPO validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['actualRPO', 'rpoMet', 'findings', 'artifacts'],
      properties: {
        actualRPO: { type: 'number', description: 'Achieved RPO in hours' },
        rpoMet: { type: 'boolean' },
        rpoVariance: { type: 'number', description: 'Difference between target and actual' },
        systemRPOs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              system: { type: 'string' },
              targetRPO: { type: 'number' },
              actualRPO: { type: 'number' },
              rpoMet: { type: 'boolean' },
              lastRecoveryPoint: { type: 'string' }
            }
          }
        },
        dataLossWindow: { type: 'string', description: 'Time period of data loss' },
        transactionsLost: { type: 'number' },
        consistencyAcrossSystems: { type: 'boolean' },
        findings: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'disaster-recovery', 'rpo-validation']
}));

// Phase 8.3: Validate Application Functionality
export const validateApplicationFunctionalityTask = defineTask('validate-application-functionality', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Validate Application Functionality - ${args.testId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Application Validation Specialist',
      task: 'Validate application functionality in DR environment',
      context: {
        testId: args.testId,
        organizationName: args.organizationName,
        criticalSystems: args.criticalSystems,
        testPlanning: args.testPlanning,
        recoveryExecution: args.recoveryExecution,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Test critical application functions:',
        '   - User authentication and authorization',
        '   - Core business transactions',
        '   - Data read/write operations',
        '   - Integration points with other systems',
        '   - API endpoints',
        '2. Run application health checks:',
        '   - Application startup successful',
        '   - All services running',
        '   - Dependencies connected',
        '   - Configuration correct',
        '3. Execute smoke tests:',
        '   - Basic functionality tests',
        '   - Critical user workflows',
        '   - Transaction processing',
        '4. Validate application performance:',
        '   - Response times acceptable',
        '   - Throughput adequate',
        '   - No significant degradation',
        '5. Test user access:',
        '   - Users can log in',
        '   - Proper authorization',
        '   - Data visible and accessible',
        '6. Verify integrations:',
        '   - External API connectivity',
        '   - Third-party service integration',
        '   - Inter-application communication',
        '7. Test reporting and analytics:',
        '   - Reports generate correctly',
        '   - Data queries work',
        '   - Dashboards display data',
        '8. Document any functional issues',
        '9. Calculate functionality score (% of tests passed)',
        '10. Generate application validation report'
      ],
      outputFormat: 'JSON object with application validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['functionalityScore', 'criticalFunctionsPassing', 'findings', 'artifacts'],
      properties: {
        functionalityScore: { type: 'number', minimum: 0, maximum: 100 },
        criticalFunctionsPassing: { type: 'number' },
        totalCriticalFunctions: { type: 'number' },
        testResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              application: { type: 'string' },
              test: { type: 'string' },
              result: { type: 'string', enum: ['pass', 'fail', 'partial'] },
              notes: { type: 'string' }
            }
          }
        },
        authenticationWorking: { type: 'boolean' },
        transactionsWorking: { type: 'boolean' },
        integrationsWorking: { type: 'boolean' },
        performanceAcceptable: { type: 'boolean' },
        functionalIssues: { type: 'array', items: { type: 'string' } },
        findings: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'disaster-recovery', 'app-validation']
}));

// Phase 9: Execute Failback Procedures
export const executeFailbackProceduresTask = defineTask('execute-failback-procedures', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Execute Failback to Primary Environment - ${args.testId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Failback Specialist',
      task: 'Execute failback procedures to restore operations to primary environment',
      context: {
        testId: args.testId,
        organizationName: args.organizationName,
        testType: args.testType,
        criticalSystems: args.criticalSystems,
        testPlanning: args.testPlanning,
        baselinePreparation: args.baselinePreparation,
        recoveryExecution: args.recoveryExecution,
        dataIntegrityValidation: args.dataIntegrityValidation,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Prepare primary environment for failback:',
        '   - Verify primary site is available and operational',
        '   - Check primary infrastructure health',
        '   - Ensure adequate capacity',
        '2. Synchronize data from DR to primary:',
        '   - Replicate any new transactions from DR environment',
        '   - Update databases with changes made during DR',
        '   - Sync file systems',
        '   - Apply transaction logs',
        '3. Verify data synchronization:',
        '   - Compare record counts',
        '   - Verify replication status',
        '   - Check for data consistency',
        '4. Execute failback procedures:',
        '   - Gracefully shut down DR applications',
        '   - Switch DNS/load balancers back to primary',
        '   - Start applications on primary environment',
        '   - Re-establish primary as active',
        '   - Set DR back to standby mode',
        '5. Validate failback:',
        '   - Verify applications running on primary',
        '   - Test functionality',
        '   - Check performance',
        '   - Verify data integrity',
        '6. Re-establish DR capability:',
        '   - Configure replication from primary to DR',
        '   - Verify backups resume',
        '   - Ensure DR site ready for next event',
        '7. Document failback process:',
        '   - Actions taken',
        '   - Time required',
        '   - Issues encountered',
        '8. Verify normal operations restored',
        '9. Generate failback execution report'
      ],
      outputFormat: 'JSON object with failback results'
    },
    outputSchema: {
      type: 'object',
      required: ['failbackSuccessful', 'systemsRestoredToPrimary', 'totalSystems', 'findings', 'artifacts'],
      properties: {
        failbackSuccessful: { type: 'boolean' },
        systemsRestoredToPrimary: { type: 'number' },
        totalSystems: { type: 'number' },
        failbackStartedAt: { type: 'string' },
        failbackCompletedAt: { type: 'string' },
        failbackDuration: { type: 'number', description: 'Seconds' },
        dataSynchronized: { type: 'boolean' },
        primarySiteOperational: { type: 'boolean' },
        drSiteSetToStandby: { type: 'boolean' },
        replicationReestablished: { type: 'boolean' },
        failbackActions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              timestamp: { type: 'string' },
              action: { type: 'string' },
              result: { type: 'string', enum: ['success', 'partial', 'failed'] }
            }
          }
        },
        failbackIssues: { type: 'array', items: { type: 'string' } },
        findings: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'disaster-recovery', 'failback']
}));

// Phase 10: Assess Performance and Capacity
export const assessPerformanceCapacityTask = defineTask('assess-performance-capacity', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Assess DR Environment Performance and Capacity - ${args.testId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Performance and Capacity Analyst',
      task: 'Assess DR environment performance and capacity adequacy',
      context: {
        testId: args.testId,
        organizationName: args.organizationName,
        criticalSystems: args.criticalSystems,
        testPlanning: args.testPlanning,
        recoveryExecution: args.recoveryExecution,
        applicationValidation: args.applicationValidation,
        baselinePreparation: args.baselinePreparation,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Compare DR performance to production baseline:',
        '   - CPU utilization',
        '   - Memory utilization',
        '   - Disk I/O performance',
        '   - Network throughput and latency',
        '   - Application response times',
        '2. Assess DR capacity adequacy:',
        '   - Compute capacity (can handle production workload?)',
        '   - Storage capacity (sufficient for data growth?)',
        '   - Network capacity (bandwidth adequate?)',
        '   - Database capacity (concurrent users supported?)',
        '3. Identify performance bottlenecks:',
        '   - Resource constraints',
        '   - Configuration issues',
        '   - Architectural limitations',
        '4. Test under load (if possible):',
        '   - Simulate normal user load',
        '   - Test peak load handling',
        '   - Verify scalability',
        '5. Assess high availability features:',
        '   - Redundancy in DR environment',
        '   - Failover capability within DR',
        '   - Load balancing effectiveness',
        '6. Evaluate cost vs performance:',
        '   - DR environment cost',
        '   - Performance vs cost trade-offs',
        '   - Right-sizing recommendations',
        '7. Calculate performance score (0-100)',
        '8. Document capacity gaps and risks',
        '9. Generate performance assessment report'
      ],
      outputFormat: 'JSON object with performance assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['performanceScore', 'capacityAdequate', 'findings', 'artifacts'],
      properties: {
        performanceScore: { type: 'number', minimum: 0, maximum: 100 },
        capacityAdequate: { type: 'boolean' },
        performanceMetrics: {
          type: 'object',
          properties: {
            cpuUtilization: { type: 'number' },
            memoryUtilization: { type: 'number' },
            diskIOPS: { type: 'number' },
            networkLatency: { type: 'number' },
            appResponseTime: { type: 'number' }
          }
        },
        baselineComparison: {
          type: 'object',
          properties: {
            cpuComparison: { type: 'string', enum: ['better', 'similar', 'worse'] },
            memoryComparison: { type: 'string', enum: ['better', 'similar', 'worse'] },
            diskComparison: { type: 'string', enum: ['better', 'similar', 'worse'] },
            networkComparison: { type: 'string', enum: ['better', 'similar', 'worse'] },
            responseTimeComparison: { type: 'string', enum: ['better', 'similar', 'worse'] }
          }
        },
        capacityAssessment: {
          type: 'object',
          properties: {
            computeCapacity: { type: 'string', enum: ['adequate', 'marginal', 'insufficient'] },
            storageCapacity: { type: 'string', enum: ['adequate', 'marginal', 'insufficient'] },
            networkCapacity: { type: 'string', enum: ['adequate', 'marginal', 'insufficient'] }
          }
        },
        bottlenecksIdentified: { type: 'array', items: { type: 'string' } },
        capacityGaps: { type: 'array', items: { type: 'string' } },
        findings: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'disaster-recovery', 'performance']
}));

// Phase 11: Analyze Test Timeline
export const analyzeTestTimelineTask = defineTask('analyze-test-timeline', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Analyze Test Timeline and Metrics - ${args.testId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DR Test Analyst',
      task: 'Analyze test timeline and calculate RTO/RPO metrics',
      context: {
        testId: args.testId,
        organizationName: args.organizationName,
        testType: args.testType,
        disasterScenario: args.disasterScenario,
        startTime: args.startTime,
        disasterInitiatedAt: args.disasterInitiatedAt,
        recoveryCompletedAt: args.recoveryCompletedAt,
        rtoTarget: args.rtoTarget,
        rpoTarget: args.rpoTarget,
        rtoAchieved: args.rtoAchieved,
        rpoAchieved: args.rpoAchieved,
        testPlanning: args.testPlanning,
        notificationTest: args.notificationTest,
        recoveryExecution: args.recoveryExecution,
        failbackResult: args.failbackResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create detailed test timeline:',
        '   - Test start time',
        '   - Disaster simulation time',
        '   - First notification sent time',
        '   - Recovery initiation time',
        '   - Each recovery milestone',
        '   - Recovery completion time',
        '   - Failback time (if applicable)',
        '   - Test completion time',
        '2. Calculate key metrics:',
        '   - Total test duration',
        '   - Time to detect disaster (if applicable)',
        '   - Time to first notification',
        '   - Time to recovery initiation',
        '   - Recovery duration (actual RTO)',
        '   - Failback duration',
        '3. Compare actual vs target:',
        '   - RTO: Compare actual recovery time to target',
        '   - RPO: Compare actual data loss to target',
        '   - Determine if objectives were met',
        '4. Analyze recovery phases:',
        '   - Time spent in each phase',
        '   - Bottlenecks and delays',
        '   - Fastest/slowest components',
        '5. Calculate recovery efficiency:',
        '   - Planned vs actual duration',
        '   - Resource utilization',
        '   - Team coordination effectiveness',
        '6. Identify timing issues:',
        '   - Unexpected delays',
        '   - Procedures that took longer than expected',
        '   - Dependencies that caused delays',
        '7. Document milestone achievements',
        '8. Generate timeline visualization',
        '9. Create metrics dashboard',
        '10. Generate timeline analysis report'
      ],
      outputFormat: 'JSON object with timeline analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['totalTestDuration', 'rtoMet', 'rpoMet', 'timeline', 'timelinePath', 'artifacts'],
      properties: {
        totalTestDuration: { type: 'number', description: 'Hours' },
        rtoMet: { type: 'boolean' },
        rpoMet: { type: 'boolean' },
        timeline: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              timestamp: { type: 'string' },
              event: { type: 'string' },
              phase: { type: 'string' },
              elapsed: { type: 'number', description: 'Seconds from disaster' }
            }
          }
        },
        metrics: {
          type: 'object',
          properties: {
            timeToFirstNotification: { type: 'number', description: 'Seconds' },
            timeToRecoveryInitiation: { type: 'number', description: 'Seconds' },
            recoveryDuration: { type: 'number', description: 'Hours' },
            failbackDuration: { type: 'number', description: 'Hours' }
          }
        },
        phaseAnalysis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string' },
              duration: { type: 'number', description: 'Hours' },
              plannedDuration: { type: 'number', description: 'Hours' },
              variance: { type: 'number' }
            }
          }
        },
        bottlenecks: { type: 'array', items: { type: 'string' } },
        delayedComponents: { type: 'array', items: { type: 'string' } },
        timelinePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'disaster-recovery', 'timeline-analysis']
}));

// Phase 12: Analyze Findings
export const analyzeFindingsTask = defineTask('analyze-findings', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Analyze Findings and Issues - ${args.testId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DR Test Analyst',
      task: 'Analyze findings and categorize issues discovered during DR test',
      context: {
        testId: args.testId,
        organizationName: args.organizationName,
        testType: args.testType,
        disasterScenario: args.disasterScenario,
        findings: args.findings,
        planReview: args.planReview,
        notificationTest: args.notificationTest,
        recoveryExecution: args.recoveryExecution,
        dataIntegrityValidation: args.dataIntegrityValidation,
        applicationValidation: args.applicationValidation,
        performanceAssessment: args.performanceAssessment,
        timelineAnalysis: args.timelineAnalysis,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Collect all findings from test phases',
        '2. Categorize findings by type:',
        '   - DR plan issues (outdated, incomplete, inaccurate)',
        '   - Procedure issues (unclear, missing steps, errors)',
        '   - Technical issues (failures, errors, misconfigurations)',
        '   - Communication issues (notification failures, unclear messaging)',
        '   - Data issues (integrity, loss, corruption)',
        '   - Performance issues (slow recovery, capacity problems)',
        '   - Personnel issues (knowledge gaps, training needs)',
        '   - Process issues (coordination, dependencies)',
        '3. Classify findings by severity:',
        '   - Critical: RTO/RPO not met, data loss, recovery failure',
        '   - High: Major delays, significant issues, workarounds required',
        '   - Medium: Minor delays, non-critical issues, improvements needed',
        '   - Low: Documentation updates, minor enhancements',
        '4. Prioritize findings by impact:',
        '   - Impact on recovery success',
        '   - Impact on RTO/RPO',
        '   - Impact on business operations',
        '   - Risk to organization',
        '5. Identify root causes for critical/high findings:',
        '   - Why did the issue occur?',
        '   - What were contributing factors?',
        '   - Could it have been prevented?',
        '6. Group related findings:',
        '   - Common themes',
        '   - Systemic issues',
        '   - Repeated problems',
        '7. Document positive findings (what went well)',
        '8. Create findings summary with statistics',
        '9. Generate detailed findings report'
      ],
      outputFormat: 'JSON object with findings analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['totalFindings', 'criticalFindings', 'highFindings', 'mediumFindings', 'lowFindings', 'findingsReportPath', 'artifacts'],
      properties: {
        totalFindings: { type: 'number' },
        criticalFindings: { type: 'number' },
        highFindings: { type: 'number' },
        mediumFindings: { type: 'number' },
        lowFindings: { type: 'number' },
        findingsByCategory: {
          type: 'object',
          properties: {
            planIssues: { type: 'number' },
            procedureIssues: { type: 'number' },
            technicalIssues: { type: 'number' },
            communicationIssues: { type: 'number' },
            dataIssues: { type: 'number' },
            performanceIssues: { type: 'number' },
            personnelIssues: { type: 'number' },
            processIssues: { type: 'number' }
          }
        },
        criticalFindingsList: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              finding: { type: 'string' },
              category: { type: 'string' },
              rootCause: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        positiveFindings: { type: 'array', items: { type: 'string' } },
        systemicIssues: { type: 'array', items: { type: 'string' } },
        findingsReportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'disaster-recovery', 'findings-analysis']
}));

// Phase 13: Generate Recommendations
export const generateRecommendationsTask = defineTask('generate-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 13: Generate Recommendations and Corrective Actions - ${args.testId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DR Improvement Specialist',
      task: 'Generate prioritized recommendations and corrective action plan',
      context: {
        testId: args.testId,
        organizationName: args.organizationName,
        testType: args.testType,
        findingsAnalysis: args.findingsAnalysis,
        planReview: args.planReview,
        timelineAnalysis: args.timelineAnalysis,
        rtoTarget: args.rtoTarget,
        rpoTarget: args.rpoTarget,
        rtoAchieved: args.rtoAchieved,
        rpoAchieved: args.rpoAchieved,
        recoveryExecution: args.recoveryExecution,
        performanceAssessment: args.performanceAssessment,
        regulatoryRequirements: args.regulatoryRequirements,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Generate recommendations for each critical/high finding',
        '2. Categorize recommendations by timeframe:',
        '   - Immediate Actions (0-30 days): Critical issues requiring urgent attention',
        '     * RTO/RPO failures',
        '     * Data integrity issues',
        '     * Critical recovery failures',
        '   - Short-term Actions (1-3 months): High priority improvements',
        '     * DR plan updates',
        '     * Procedure improvements',
        '     * Training and documentation',
        '     * Performance optimization',
        '   - Long-term Actions (3-12 months): Strategic improvements',
        '     * DR infrastructure upgrades',
        '     * Automation initiatives',
        '     * Architecture enhancements',
        '     * Process maturity improvements',
        '3. Prioritize recommendations by:',
        '   - Impact on RTO/RPO',
        '   - Risk reduction',
        '   - Regulatory compliance',
        '   - Implementation effort',
        '   - Cost vs benefit',
        '4. For each recommendation, include:',
        '   - Specific action to take',
        '   - Rationale and expected benefit',
        '   - Owner/responsible party',
        '   - Target completion date',
        '   - Success criteria',
        '   - Resource requirements',
        '5. Address specific areas:',
        '   - DR plan updates needed',
        '   - Procedure improvements',
        '   - Technical enhancements',
        '   - Capacity and performance improvements',
        '   - Training and awareness',
        '   - Automation opportunities',
        '   - Communication improvements',
        '6. Include regulatory compliance recommendations if applicable',
        '7. Create action plan with tracking mechanism',
        '8. Generate recommendations report with roadmap',
        '9. Provide executive summary of critical actions'
      ],
      outputFormat: 'JSON object with recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['immediateActions', 'shortTermActions', 'longTermActions', 'recommendations', 'recommendationsPath', 'artifacts'],
      properties: {
        immediateActions: { type: 'number' },
        shortTermActions: { type: 'number' },
        longTermActions: { type: 'number' },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              timeframe: { type: 'string', enum: ['immediate', 'short-term', 'long-term'] },
              category: { type: 'string' },
              recommendation: { type: 'string' },
              rationale: { type: 'string' },
              expectedBenefit: { type: 'string' },
              owner: { type: 'string' },
              targetDate: { type: 'string' },
              effort: { type: 'string', enum: ['low', 'medium', 'high'] },
              cost: { type: 'string', enum: ['low', 'medium', 'high'] }
            }
          }
        },
        criticalActions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              dueDate: { type: 'string' },
              owner: { type: 'string' }
            }
          }
        },
        recommendationsPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'disaster-recovery', 'recommendations']
}));

// Phase 14: Generate Test Report
export const generateTestReportTask = defineTask('generate-test-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 14: Generate DR Test Report - ${args.testId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DR Documentation Specialist',
      task: 'Generate comprehensive disaster recovery test report',
      context: {
        testId: args.testId,
        organizationName: args.organizationName,
        testType: args.testType,
        disasterScenario: args.disasterScenario,
        startTime: args.startTime,
        testPlanning: args.testPlanning,
        stakeholderCoordination: args.stakeholderCoordination,
        disasterSimulation: args.disasterSimulation,
        notificationTest: args.notificationTest,
        recoveryExecution: args.recoveryExecution,
        dataIntegrityValidation: args.dataIntegrityValidation,
        rpoValidation: args.rpoValidation,
        applicationValidation: args.applicationValidation,
        failbackResult: args.failbackResult,
        performanceAssessment: args.performanceAssessment,
        timelineAnalysis: args.timelineAnalysis,
        findingsAnalysis: args.findingsAnalysis,
        recommendationsResult: args.recommendationsResult,
        rtoTarget: args.rtoTarget,
        rpoTarget: args.rpoTarget,
        rtoAchieved: args.rtoAchieved,
        rpoAchieved: args.rpoAchieved,
        regulatoryRequirements: args.regulatoryRequirements,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create executive summary:',
        '   - Test overview (type, scenario, date)',
        '   - Key results (RTO/RPO, success rate)',
        '   - Critical findings',
        '   - Top recommendations',
        '   - Overall assessment',
        '2. Document test objectives and scope:',
        '   - Test goals',
        '   - Systems tested',
        '   - Test methodology',
        '   - Success criteria',
        '3. Describe test execution:',
        '   - Timeline of events',
        '   - Disaster simulation details',
        '   - Recovery procedures executed',
        '   - Stakeholder participation',
        '4. Present test results:',
        '   - RTO results (target vs actual)',
        '   - RPO results (target vs actual)',
        '   - System recovery status',
        '   - Data integrity results',
        '   - Application functionality results',
        '   - Performance assessment',
        '   - Notification effectiveness',
        '   - Failback results (if applicable)',
        '5. Detail findings and issues:',
        '   - Critical findings',
        '   - High priority findings',
        '   - Categorized findings',
        '   - Root cause analysis',
        '6. Present recommendations:',
        '   - Immediate actions',
        '   - Short-term improvements',
        '   - Long-term enhancements',
        '   - Prioritized action plan',
        '7. Include supporting data:',
        '   - Detailed timeline',
        '   - Test metrics',
        '   - Participant feedback',
        '   - Evidence and screenshots',
        '8. Add appendices:',
        '   - Test plan',
        '   - Recovery procedures',
        '   - Contact lists',
        '   - Detailed logs',
        '9. Format as professional Markdown report',
        '10. Create executive summary slide deck'
      ],
      outputFormat: 'JSON object with report details'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummaryPath', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummaryPath: { type: 'string' },
        executiveSummary: { type: 'string', description: 'Brief executive summary text' },
        testOverview: { type: 'string' },
        keyResults: { type: 'array', items: { type: 'string' } },
        overallAssessment: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'disaster-recovery', 'reporting']
}));

// Phase 15: Calculate DR Scores
export const calculateDRScoresTask = defineTask('calculate-dr-scores', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 15: Calculate DR Readiness and Test Scores - ${args.testId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DR Assessment Specialist',
      task: 'Calculate disaster recovery readiness score and test effectiveness score',
      context: {
        testId: args.testId,
        organizationName: args.organizationName,
        testType: args.testType,
        rtoTarget: args.rtoTarget,
        rpoTarget: args.rpoTarget,
        rtoAchieved: args.rtoAchieved,
        rpoAchieved: args.rpoAchieved,
        planReview: args.planReview,
        recoveryExecution: args.recoveryExecution,
        dataIntegrityValidation: args.dataIntegrityValidation,
        applicationValidation: args.applicationValidation,
        performanceAssessment: args.performanceAssessment,
        notificationTest: args.notificationTest,
        failbackResult: args.failbackResult,
        findingsAnalysis: args.findingsAnalysis,
        regulatoryRequirements: args.regulatoryRequirements,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Calculate Test Execution Score (0-100):',
        '   - Test completed successfully (20%)',
        '   - All test objectives achieved (20%)',
        '   - Proper documentation (15%)',
        '   - Stakeholder participation (15%)',
        '   - Test rigor (tabletop=50, walkthrough=60, simulation=80, parallel=90, full=100) (15%)',
        '   - Minimal unplanned issues (15%)',
        '2. Calculate DR Readiness Score (0-100):',
        '   - RTO Achievement (25% weight):',
        '     * RTO met = 100 points',
        '     * Within 20% of target = 75 points',
        '     * Within 50% of target = 50 points',
        '     * Over 50% of target = 25 points',
        '   - RPO Achievement (25% weight):',
        '     * RPO met = 100 points',
        '     * Within 20% of target = 75 points',
        '     * Within 50% of target = 50 points',
        '     * Over 50% of target = 25 points',
        '   - Recovery Success Rate (20% weight):',
        '     * % of systems successfully recovered',
        '   - Data Integrity (10% weight):',
        '     * Data integrity score from validation',
        '   - Application Functionality (10% weight):',
        '     * Application functionality score from validation',
        '   - DR Plan Quality (5% weight):',
        '     * Plan completeness score from review',
        '   - Notification Effectiveness (5% weight):',
        '     * Notification success rate',
        '3. Assess DR readiness level:',
        '   - Excellent (90-100): Comprehensive DR capability, meets all objectives',
        '   - Good (75-89): Strong DR capability with minor gaps',
        '   - Fair (60-74): Adequate DR capability but needs improvement',
        '   - Poor (0-59): Significant DR gaps, critical improvements needed',
        '4. Evaluate test effectiveness:',
        '   - Valuable insights gained',
        '   - Issues identified',
        '   - Improvements recommended',
        '   - ROI of test',
        '5. Assess regulatory compliance readiness',
        '6. Provide overall verdict and assessment',
        '7. Identify top priority recommendation',
        '8. Generate DR scorecard with component scores',
        '9. Create assessment summary document'
      ],
      outputFormat: 'JSON object with DR scores and assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['testScore', 'drReadinessScore', 'readinessAssessment', 'verdict', 'topRecommendation', 'scorecardPath', 'artifacts'],
      properties: {
        testScore: { type: 'number', minimum: 0, maximum: 100 },
        drReadinessScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            rtoAchievement: { type: 'number' },
            rpoAchievement: { type: 'number' },
            recoverySuccessRate: { type: 'number' },
            dataIntegrity: { type: 'number' },
            applicationFunctionality: { type: 'number' },
            drPlanQuality: { type: 'number' },
            notificationEffectiveness: { type: 'number' },
            performanceAdequacy: { type: 'number' }
          }
        },
        readinessAssessment: { type: 'string', enum: ['excellent', 'good', 'fair', 'poor'] },
        testEffectiveness: { type: 'string' },
        verdict: { type: 'string', description: 'Overall DR capability verdict' },
        topRecommendation: { type: 'string' },
        strengths: { type: 'array', items: { type: 'string' } },
        weaknesses: { type: 'array', items: { type: 'string' } },
        regulatoryReadiness: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              regulation: { type: 'string' },
              readiness: { type: 'string', enum: ['compliant', 'gaps-identified', 'non-compliant'] }
            }
          }
        },
        scorecardPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'disaster-recovery', 'scoring']
}));
