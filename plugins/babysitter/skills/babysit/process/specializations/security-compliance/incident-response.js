/**
 * @process specializations/security-compliance/incident-response
 * @description Security Incident Response Plan - Comprehensive framework for handling security incidents including classification,
 * response procedures, digital forensics, stakeholder communication, containment, eradication, recovery, and post-incident analysis
 * to minimize damage and ensure systematic recovery from security breaches.
 * @inputs { incidentType?: string, severity?: string, affectedSystems?: array, detectionSource?: string, description?: string, securityTeam?: string, requiresForensics?: boolean }
 * @outputs { success: boolean, incidentId: string, severity: string, classification: object, response: object, forensics?: object, containment: object, eradication: object, recovery: object, postMortem: object, lessonsLearned: array }
 *
 * @example
 * const result = await orchestrate('specializations/security-compliance/incident-response', {
 *   incidentType: 'data-breach',
 *   severity: 'critical',
 *   affectedSystems: ['customer-database', 'web-application'],
 *   detectionSource: 'siem-alert',
 *   description: 'Unauthorized access detected to customer database with potential data exfiltration',
 *   securityTeam: 'security-operations',
 *   requiresForensics: true
 * });
 *
 * @references
 * - NIST Computer Security Incident Handling Guide: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-61r2.pdf
 * - SANS Incident Handler's Handbook: https://www.sans.org/white-papers/33901/
 * - ISO/IEC 27035 - Incident Management: https://www.iso.org/standard/78973.html
 * - CISA Incident Response Guide: https://www.cisa.gov/sites/default/files/publications/Federal_Government_Cybersecurity_Incident_and_Vulnerability_Response_Playbooks_508C.pdf
 * - FIRST Best Practices: https://www.first.org/resources/guides/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    incidentType = 'unknown',
    severity = 'medium',
    affectedSystems = [],
    detectionSource = 'manual-report',
    description = '',
    securityTeam = 'default-security-team',
    requiresForensics = null, // null = auto-determine based on severity
    regulatoryNotificationRequired = null, // null = auto-determine
    lawEnforcementContact = null, // null = determine based on incident type
    outputDir = 'security-incident-response-output',
    timeZone = 'UTC',
    complianceFrameworks = [] // ['GDPR', 'HIPAA', 'PCI-DSS', 'SOX', etc.]
  } = inputs;

  const startTime = ctx.now();
  const incidentId = `SEC-INC-${Date.now()}`;
  const artifacts = [];
  let incidentResolved = false;
  let forensicsRequired = requiresForensics;

  ctx.log('info', `Starting Security Incident Response Process for ${incidentId}`);
  ctx.log('info', `Severity: ${severity}, Type: ${incidentType}, Affected Systems: ${affectedSystems.join(', ')}`);

  // ============================================================================
  // PHASE 1: INCIDENT DETECTION AND INITIAL TRIAGE
  // ============================================================================

  ctx.log('info', 'Phase 1: Incident Detection and Initial Triage');

  const initialTriage = await ctx.task(initialTriageTask, {
    incidentId,
    incidentType,
    severity,
    affectedSystems,
    detectionSource,
    description,
    outputDir
  });

  artifacts.push(...initialTriage.artifacts);

  // Determine actual severity based on triage
  const actualSeverity = initialTriage.severityRecommendation || severity;

  // Auto-determine if forensics required
  if (forensicsRequired === null) {
    forensicsRequired = actualSeverity === 'critical' || actualSeverity === 'high' ||
                       incidentType.includes('breach') || incidentType.includes('ransomware');
  }

  ctx.log('info', `Initial Triage Complete - Severity: ${actualSeverity}, Forensics Required: ${forensicsRequired}`);

  // ============================================================================
  // PHASE 2: INCIDENT CLASSIFICATION AND CATEGORIZATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Incident Classification and Categorization');

  const classification = await ctx.task(classificationTask, {
    incidentId,
    incidentType,
    severity: actualSeverity,
    affectedSystems,
    initialTriage,
    complianceFrameworks,
    outputDir
  });

  artifacts.push(...classification.artifacts);

  // Determine regulatory notification requirements
  const regulatoryNotification = regulatoryNotificationRequired !== null ?
    regulatoryNotificationRequired : classification.regulatoryNotificationRequired;

  ctx.log('info', `Classification Complete - Category: ${classification.incidentCategory}, Regulatory Notification: ${regulatoryNotification}`);

  // Quality Gate: Classification review
  await ctx.breakpoint({
    question: `Incident ${incidentId} classified as ${classification.incidentCategory} with severity ${actualSeverity}. Regulatory notification required: ${regulatoryNotification}. Proceed with response?`,
    title: 'Incident Classification Review',
    context: {
      runId: ctx.runId,
      incidentId,
      severity: actualSeverity,
      category: classification.incidentCategory,
      attackVector: classification.attackVector,
      potentialImpact: classification.potentialImpact,
      regulatoryNotification,
      complianceFrameworks: classification.applicableCompliance,
      recommendation: 'Verify classification accuracy before proceeding with response',
      files: classification.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // PHASE 3: INCIDENT DECLARATION AND TEAM MOBILIZATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Declaring security incident and mobilizing response team');

  const incidentDeclaration = await ctx.task(declarationMobilizationTask, {
    incidentId,
    incidentType,
    severity: actualSeverity,
    classification,
    affectedSystems,
    securityTeam,
    forensicsRequired,
    regulatoryNotification,
    lawEnforcementContact,
    outputDir
  });

  artifacts.push(...incidentDeclaration.artifacts);

  // Quality Gate: Team mobilization
  if (!incidentDeclaration.teamMobilized) {
    await ctx.breakpoint({
      question: `Security incident ${incidentId} declared but team mobilization incomplete. Missing roles: ${incidentDeclaration.missingRoles.join(', ')}. Critical for security incident response. Manually assign roles?`,
      title: 'Security Incident Team Mobilization',
      context: {
        runId: ctx.runId,
        incidentId,
        severity: actualSeverity,
        incidentCommander: incidentDeclaration.incidentCommander,
        securityLead: incidentDeclaration.securityLead,
        missingRoles: incidentDeclaration.missingRoles,
        warRoomUrl: incidentDeclaration.warRoomUrl,
        recommendation: 'Security incidents require full team with specialized roles before proceeding',
        files: incidentDeclaration.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 4: CONTAINMENT STRATEGY DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Developing containment strategy');

  const containmentStrategy = await ctx.task(containmentStrategyTask, {
    incidentId,
    severity: actualSeverity,
    classification,
    affectedSystems,
    initialTriage,
    outputDir
  });

  artifacts.push(...containmentStrategy.artifacts);

  // Quality Gate: Containment strategy approval
  if (containmentStrategy.requiresApproval) {
    await ctx.breakpoint({
      question: `Containment strategy for ${incidentId} requires approval. Strategy: ${containmentStrategy.primaryStrategy}. Business Impact: ${containmentStrategy.businessImpact}. Approve containment actions?`,
      title: 'Containment Strategy Approval',
      context: {
        runId: ctx.runId,
        incidentId,
        severity: actualSeverity,
        primaryStrategy: containmentStrategy.primaryStrategy,
        containmentSteps: containmentStrategy.containmentSteps,
        businessImpact: containmentStrategy.businessImpact,
        estimatedDowntime: containmentStrategy.estimatedDowntime,
        riskOfNotContaining: containmentStrategy.riskOfNotContaining,
        files: containmentStrategy.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 5: EVIDENCE COLLECTION AND FORENSICS (if required)
  // ============================================================================

  let forensicsData = null;

  if (forensicsRequired) {
    ctx.log('info', 'Phase 5: Evidence Collection and Digital Forensics');

    forensicsData = await ctx.task(forensicsCollectionTask, {
      incidentId,
      severity: actualSeverity,
      classification,
      affectedSystems,
      containmentStrategy,
      lawEnforcementContact,
      outputDir
    });

    artifacts.push(...forensicsData.artifacts);

    ctx.log('info', `Forensics Collection Complete - Evidence Items: ${forensicsData.evidenceItems.length}, Chain of Custody Established: ${forensicsData.chainOfCustodyEstablished}`);

    // Quality Gate: Forensics evidence preservation
    if (!forensicsData.chainOfCustodyEstablished) {
      await ctx.breakpoint({
        question: `Evidence collection for ${incidentId} completed but chain of custody not properly established. This may impact legal proceedings. Review and establish proper chain of custody?`,
        title: 'Forensics Chain of Custody',
        context: {
          runId: ctx.runId,
          incidentId,
          evidenceItems: forensicsData.evidenceItems.length,
          chainOfCustodyIssues: forensicsData.chainOfCustodyIssues,
          recommendation: 'Ensure proper evidence handling for potential legal/regulatory requirements',
          files: forensicsData.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
        }
      });
    }
  } else {
    ctx.log('info', 'Phase 5: Forensics not required for this incident, proceeding to containment execution');
  }

  // ============================================================================
  // PHASE 6: CONTAINMENT EXECUTION
  // ============================================================================

  ctx.log('info', 'Phase 6: Executing containment procedures');

  const containmentExecution = await ctx.task(containmentExecutionTask, {
    incidentId,
    severity: actualSeverity,
    containmentStrategy,
    affectedSystems,
    forensicsCompleted: forensicsRequired,
    outputDir
  });

  artifacts.push(...containmentExecution.artifacts);

  const containmentSuccessful = containmentExecution.containmentSuccessful;

  ctx.log('info', `Containment Execution - Success: ${containmentSuccessful}, Time: ${containmentExecution.executionTime}s`);

  // Quality Gate: Containment verification
  if (!containmentSuccessful) {
    await ctx.breakpoint({
      question: `Containment for ${incidentId} not successful. Status: ${containmentExecution.status}. Threat may still be active. Execute emergency containment or escalate?`,
      title: 'Containment Failed - Critical Decision Required',
      context: {
        runId: ctx.runId,
        incidentId,
        severity: actualSeverity,
        containmentStatus: containmentExecution.status,
        failureReasons: containmentExecution.failureReasons,
        emergencyActions: containmentExecution.emergencyActions,
        threatStillActive: containmentExecution.threatStillActive,
        recommendation: 'Critical security incident requires immediate containment to prevent further damage',
        files: containmentExecution.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 7: PARALLEL INVESTIGATION AND IMPACT ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 7: Conducting parallel investigation and impact assessment');

  const [
    threatIntelligence,
    impactAssessment,
    vulnerabilityAnalysis
  ] = await ctx.parallel.all([
    () => ctx.task(threatIntelligenceTask, {
      incidentId,
      classification,
      containmentExecution,
      forensicsData,
      outputDir
    }),
    () => ctx.task(impactAssessmentTask, {
      incidentId,
      severity: actualSeverity,
      affectedSystems,
      classification,
      containmentExecution,
      complianceFrameworks,
      outputDir
    }),
    () => ctx.task(vulnerabilityAnalysisTask, {
      incidentId,
      affectedSystems,
      classification,
      containmentExecution,
      outputDir
    })
  ]);

  artifacts.push(
    ...threatIntelligence.artifacts,
    ...impactAssessment.artifacts,
    ...vulnerabilityAnalysis.artifacts
  );

  ctx.log('info', `Investigation Complete - Data Compromised: ${impactAssessment.dataCompromised}, IOCs Identified: ${threatIntelligence.iocsIdentified.length}`);

  // Quality Gate: High-impact data breach notification
  if (impactAssessment.dataCompromised && impactAssessment.recordsAffected > 500) {
    await ctx.breakpoint({
      question: `Data breach confirmed for ${incidentId}. Records affected: ${impactAssessment.recordsAffected}. Sensitive data types: ${impactAssessment.sensitiveDataTypes.join(', ')}. Regulatory notification deadlines: ${impactAssessment.notificationDeadlines}. Proceed with notification procedures?`,
      title: 'Data Breach Notification Required',
      context: {
        runId: ctx.runId,
        incidentId,
        severity: actualSeverity,
        recordsAffected: impactAssessment.recordsAffected,
        sensitiveDataTypes: impactAssessment.sensitiveDataTypes,
        notificationDeadlines: impactAssessment.notificationDeadlines,
        regulatoryRequirements: impactAssessment.regulatoryRequirements,
        recommendation: 'Initiate breach notification procedures according to regulatory requirements',
        files: impactAssessment.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 8: ERADICATION STRATEGY AND EXECUTION
  // ============================================================================

  ctx.log('info', 'Phase 8: Developing and executing eradication strategy');

  const eradication = await ctx.task(eradicationTask, {
    incidentId,
    severity: actualSeverity,
    classification,
    affectedSystems,
    threatIntelligence,
    vulnerabilityAnalysis,
    containmentExecution,
    outputDir
  });

  artifacts.push(...eradication.artifacts);

  const eradicationSuccessful = eradication.eradicationSuccessful;

  ctx.log('info', `Eradication Complete - Success: ${eradicationSuccessful}, Malware Removed: ${eradication.malwareRemoved}, Backdoors Closed: ${eradication.backdoorsClosed}`);

  // Quality Gate: Eradication verification
  if (!eradicationSuccessful) {
    await ctx.breakpoint({
      question: `Eradication for ${incidentId} incomplete. Remaining threats: ${eradication.remainingThreats.join(', ')}. System may be re-compromised. Additional eradication steps required?`,
      title: 'Eradication Incomplete',
      context: {
        runId: ctx.runId,
        incidentId,
        severity: actualSeverity,
        eradicationStatus: eradication.status,
        remainingThreats: eradication.remainingThreats,
        verificationResults: eradication.verificationResults,
        recommendation: 'Complete eradication before proceeding to recovery',
        files: eradication.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 9: RECOVERY AND RESTORATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Recovery and system restoration');

  const recovery = await ctx.task(recoveryTask, {
    incidentId,
    severity: actualSeverity,
    affectedSystems,
    eradication,
    vulnerabilityAnalysis,
    outputDir
  });

  artifacts.push(...recovery.artifacts);

  const recoverySuccessful = recovery.recoverySuccessful;

  ctx.log('info', `Recovery Complete - Success: ${recoverySuccessful}, Systems Restored: ${recovery.systemsRestored}/${recovery.totalSystems}`);

  // Quality Gate: Recovery verification
  if (!recoverySuccessful) {
    await ctx.breakpoint({
      question: `Recovery for ${incidentId} incomplete. Systems restored: ${recovery.systemsRestored}/${recovery.totalSystems}. Continue monitoring or perform additional recovery?`,
      title: 'Recovery Verification',
      context: {
        runId: ctx.runId,
        incidentId,
        systemsRestored: recovery.systemsRestored,
        totalSystems: recovery.totalSystems,
        recoveryIssues: recovery.recoveryIssues,
        monitoringStatus: recovery.monitoringStatus,
        recommendation: 'Verify all systems fully operational before closing incident',
        files: recovery.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  incidentResolved = containmentSuccessful && eradicationSuccessful && recoverySuccessful;

  // ============================================================================
  // PHASE 10: STAKEHOLDER COMMUNICATION AND NOTIFICATIONS
  // ============================================================================

  ctx.log('info', 'Phase 10: Managing stakeholder communications and regulatory notifications');

  const communications = await ctx.task(communicationsTask, {
    incidentId,
    severity: actualSeverity,
    classification,
    impactAssessment,
    incidentResolved,
    regulatoryNotification,
    complianceFrameworks,
    outputDir
  });

  artifacts.push(...communications.artifacts);

  ctx.log('info', `Communications Complete - Internal Updates: ${communications.internalCommunications}, External Notifications: ${communications.externalNotifications}, Regulatory Filings: ${communications.regulatoryFilings}`);

  // ============================================================================
  // PHASE 11: POST-INCIDENT ANALYSIS AND DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 11: Conducting post-incident analysis');

  const postIncidentAnalysis = await ctx.task(postIncidentAnalysisTask, {
    incidentId,
    severity: actualSeverity,
    classification,
    startTime,
    initialTriage,
    containmentExecution,
    forensicsData,
    threatIntelligence,
    impactAssessment,
    vulnerabilityAnalysis,
    eradication,
    recovery,
    communications,
    outputDir
  });

  artifacts.push(...postIncidentAnalysis.artifacts);

  const timeToContain = postIncidentAnalysis.metrics.timeToContain;
  const timeToEradicate = postIncidentAnalysis.metrics.timeToEradicate;
  const timeToRecover = postIncidentAnalysis.metrics.timeToRecover;

  ctx.log('info', `Post-Incident Analysis Complete - Time to Contain: ${(timeToContain / 60).toFixed(1)} min, Time to Eradicate: ${(timeToEradicate / 60).toFixed(1)} min, Time to Recover: ${(timeToRecover / 60).toFixed(1)} min`);

  // ============================================================================
  // PHASE 12: LESSONS LEARNED AND RECOMMENDATIONS
  // ============================================================================

  ctx.log('info', 'Phase 12: Capturing lessons learned and generating recommendations');

  const lessonsLearned = await ctx.task(lessonsLearnedTask, {
    incidentId,
    severity: actualSeverity,
    classification,
    postIncidentAnalysis,
    vulnerabilityAnalysis,
    threatIntelligence,
    impactAssessment,
    outputDir
  });

  artifacts.push(...lessonsLearned.artifacts);

  ctx.log('info', `Lessons Learned - Immediate Actions: ${lessonsLearned.immediateActions.length}, Short-term: ${lessonsLearned.shortTermImprovements.length}, Long-term: ${lessonsLearned.longTermImprovements.length}`);

  // ============================================================================
  // PHASE 13: POST-MORTEM REPORT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 13: Generating comprehensive post-mortem report');

  const postMortemReport = await ctx.task(postMortemReportTask, {
    incidentId,
    severity: actualSeverity,
    incidentType,
    affectedSystems,
    startTime,
    initialTriage,
    classification,
    containmentExecution,
    forensicsData,
    threatIntelligence,
    impactAssessment,
    vulnerabilityAnalysis,
    eradication,
    recovery,
    communications,
    postIncidentAnalysis,
    lessonsLearned,
    outputDir
  });

  artifacts.push(...postMortemReport.artifacts);

  // Quality Gate: Post-mortem review
  await ctx.breakpoint({
    question: `Post-mortem report for ${incidentId} generated. Review timeline, findings, impact assessment, and recommendations before sharing with stakeholders and closing incident?`,
    title: 'Security Incident Post-Mortem Review',
    context: {
      runId: ctx.runId,
      incidentId,
      severity: actualSeverity,
      incidentResolved,
      executiveSummary: postMortemReport.executiveSummary,
      totalImpact: postMortemReport.totalImpact,
      rootCause: postMortemReport.rootCause,
      lessonsLearnedCount: lessonsLearned.immediateActions.length + lessonsLearned.shortTermImprovements.length + lessonsLearned.longTermImprovements.length,
      files: [
        { path: postMortemReport.reportPath, format: 'markdown', label: 'Post-Mortem Report' },
        { path: postIncidentAnalysis.timelinePath, format: 'json', label: 'Incident Timeline' },
        { path: lessonsLearned.recommendationsPath, format: 'markdown', label: 'Recommendations' }
      ]
    }
  });

  // ============================================================================
  // PHASE 14: METRICS AND CONTINUOUS IMPROVEMENT
  // ============================================================================

  ctx.log('info', 'Phase 14: Computing security metrics and continuous improvement actions');

  const metricsAndImprovement = await ctx.task(metricsImprovementTask, {
    incidentId,
    severity: actualSeverity,
    classification,
    postIncidentAnalysis,
    impactAssessment,
    lessonsLearned,
    outputDir
  });

  artifacts.push(...metricsAndImprovement.artifacts);

  // Final Breakpoint: Security Incident Response Complete
  await ctx.breakpoint({
    question: `Security Incident Response Complete for ${incidentId}. Incident resolved: ${incidentResolved}. Data compromised: ${impactAssessment.dataCompromised}. Regulatory notifications: ${communications.regulatoryFilings}. Close incident and implement recommendations?`,
    title: 'Final Security Incident Review',
    context: {
      runId: ctx.runId,
      summary: {
        incidentId,
        severity: actualSeverity,
        incidentType,
        category: classification.incidentCategory,
        affectedSystems,
        incidentResolved,
        timeToContain: `${(timeToContain / 60).toFixed(1)} minutes`,
        timeToEradicate: `${(timeToEradicate / 60).toFixed(1)} minutes`,
        timeToRecover: `${(timeToRecover / 60).toFixed(1)} minutes`,
        dataCompromised: impactAssessment.dataCompromised,
        recordsAffected: impactAssessment.recordsAffected,
        forensicsPerformed: forensicsRequired,
        regulatoryNotificationsMade: communications.regulatoryFilings,
        lessonsLearnedCount: lessonsLearned.immediateActions.length + lessonsLearned.shortTermImprovements.length + lessonsLearned.longTermImprovements.length
      },
      metrics: metricsAndImprovement.metrics,
      recommendation: metricsAndImprovement.recommendation,
      files: [
        { path: postMortemReport.reportPath, format: 'markdown', label: 'Post-Mortem Report' },
        { path: metricsAndImprovement.metricsReportPath, format: 'markdown', label: 'Security Metrics Report' },
        { path: lessonsLearned.recommendationsPath, format: 'markdown', label: 'Recommendations' },
        ...(forensicsData ? [{ path: forensicsData.forensicsReportPath, format: 'markdown', label: 'Forensics Report' }] : [])
      ]
    }
  });

  const endTime = ctx.now();
  const totalDuration = endTime - startTime;

  return {
    success: true,
    incidentId,
    severity: actualSeverity,
    incidentType,
    affectedSystems,
    detectionSource,
    classification: {
      category: classification.incidentCategory,
      attackVector: classification.attackVector,
      attackerProfile: classification.attackerProfile,
      confidenceLevel: classification.confidenceLevel,
      applicableCompliance: classification.applicableCompliance
    },
    response: {
      resolved: incidentResolved,
      contained: containmentSuccessful,
      eradicated: eradicationSuccessful,
      recovered: recoverySuccessful,
      containmentStrategy: containmentStrategy.primaryStrategy,
      eradicationActions: eradication.actionsPerformed
    },
    forensics: forensicsData ? {
      performed: true,
      evidenceItems: forensicsData.evidenceItems.length,
      chainOfCustody: forensicsData.chainOfCustodyEstablished,
      forensicsReportPath: forensicsData.forensicsReportPath,
      iocsIdentified: threatIntelligence.iocsIdentified
    } : null,
    containment: {
      successful: containmentSuccessful,
      strategy: containmentStrategy.primaryStrategy,
      executionTime: containmentExecution.executionTime,
      businessImpact: containmentStrategy.businessImpact
    },
    eradication: {
      successful: eradicationSuccessful,
      malwareRemoved: eradication.malwareRemoved,
      backdoorsClosed: eradication.backdoorsClosed,
      vulnerabilitiesPatched: eradication.vulnerabilitiesPatched
    },
    recovery: {
      successful: recoverySuccessful,
      systemsRestored: recovery.systemsRestored,
      totalSystems: recovery.totalSystems,
      recoveryTime: recovery.recoveryTime
    },
    impact: {
      dataCompromised: impactAssessment.dataCompromised,
      recordsAffected: impactAssessment.recordsAffected,
      sensitiveDataTypes: impactAssessment.sensitiveDataTypes,
      estimatedCost: impactAssessment.estimatedCost,
      reputationImpact: impactAssessment.reputationImpact,
      regulatoryPenalties: impactAssessment.regulatoryPenalties
    },
    communications: {
      internalCommunications: communications.internalCommunications,
      externalNotifications: communications.externalNotifications,
      regulatoryFilings: communications.regulatoryFilings,
      customerNotifications: communications.customerNotifications,
      mediaStatements: communications.mediaStatements
    },
    threatIntelligence: {
      iocsIdentified: threatIntelligence.iocsIdentified,
      attackerProfile: threatIntelligence.attackerProfile,
      attackTechniques: threatIntelligence.attackTechniques,
      relatedIncidents: threatIntelligence.relatedIncidents
    },
    timeline: {
      detectedAt: initialTriage.detectedAt,
      declaredAt: incidentDeclaration.declaredAt,
      containedAt: containmentExecution.containedAt,
      eradicatedAt: eradication.eradicatedAt,
      recoveredAt: recovery.recoveredAt,
      timeToContain,
      timeToEradicate,
      timeToRecover,
      totalResponseTime: totalDuration
    },
    team: {
      incidentCommander: incidentDeclaration.incidentCommander,
      securityLead: incidentDeclaration.securityLead,
      forensicsLead: incidentDeclaration.forensicsLead,
      commsLead: incidentDeclaration.commsLead,
      warRoomUrl: incidentDeclaration.warRoomUrl
    },
    postMortem: {
      reportPath: postMortemReport.reportPath,
      executiveSummary: postMortemReport.executiveSummary,
      rootCause: postMortemReport.rootCause,
      totalImpact: postMortemReport.totalImpact,
      whatWentWell: postMortemReport.whatWentWell,
      whatCouldImprove: postMortemReport.whatCouldImprove
    },
    lessonsLearned: [
      ...lessonsLearned.immediateActions.map(a => ({ ...a, timeframe: 'immediate' })),
      ...lessonsLearned.shortTermImprovements.map(a => ({ ...a, timeframe: 'short-term' })),
      ...lessonsLearned.longTermImprovements.map(a => ({ ...a, timeframe: 'long-term' }))
    ],
    metrics: {
      detectionTime: postIncidentAnalysis.metrics.detectionTime,
      containmentTime: postIncidentAnalysis.metrics.timeToContain,
      eradicationTime: postIncidentAnalysis.metrics.timeToEradicate,
      recoveryTime: postIncidentAnalysis.metrics.timeToRecover,
      totalResponseTime: totalDuration,
      responseEffectiveness: metricsAndImprovement.metrics.responseEffectiveness,
      securityPostureImprovement: metricsAndImprovement.securityPostureImprovement
    },
    artifacts,
    duration: totalDuration,
    metadata: {
      processId: 'specializations/security-compliance/incident-response',
      timestamp: startTime,
      securityTeam,
      forensicsRequired,
      regulatoryNotificationRequired: regulatoryNotification,
      complianceFrameworks,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: Initial Triage
export const initialTriageTask = defineTask('initial-triage', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Initial Triage - ${args.incidentId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Incident Response Analyst',
      task: 'Perform initial triage of security incident',
      context: {
        incidentId: args.incidentId,
        incidentType: args.incidentType,
        severity: args.severity,
        affectedSystems: args.affectedSystems,
        detectionSource: args.detectionSource,
        description: args.description,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Validate and parse incident report details',
        '2. Determine incident type (malware, phishing, data breach, unauthorized access, DDoS, ransomware, insider threat)',
        '3. Identify affected systems, networks, and data',
        '4. Assess initial severity (critical, high, medium, low)',
        '5. Critical = active data breach, ransomware, nation-state attack',
        '6. High = confirmed malware, unauthorized access, data exfiltration',
        '7. Medium = suspicious activity, attempted breach, phishing',
        '8. Low = policy violation, minor security event',
        '9. Document initial indicators of compromise (IOCs)',
        '10. Establish incident timeline starting point',
        '11. Determine urgency and required response speed',
        '12. Create initial incident record with triage findings'
      ],
      outputFormat: 'JSON object with triage assessment and severity recommendation'
    },
    outputSchema: {
      type: 'object',
      required: ['detectedAt', 'severityRecommendation', 'urgency', 'artifacts'],
      properties: {
        detectedAt: { type: 'string', description: 'ISO timestamp when incident was detected' },
        severityRecommendation: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
        urgency: { type: 'string', enum: ['immediate', 'urgent', 'normal', 'low'] },
        affectedSystemsConfirmed: { type: 'array', items: { type: 'string' } },
        initialIOCs: { type: 'array', items: { type: 'string' } },
        scopeAssessment: { type: 'string', enum: ['contained', 'spreading', 'widespread', 'unknown'] },
        threatActive: { type: 'boolean' },
        dataAtRisk: { type: 'boolean' },
        triageNotes: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-incident', 'triage']
}));

// Phase 2: Classification
export const classificationTask = defineTask('classification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Incident Classification - ${args.incidentId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Classification Specialist',
      task: 'Classify and categorize security incident',
      context: {
        incidentId: args.incidentId,
        incidentType: args.incidentType,
        severity: args.severity,
        affectedSystems: args.affectedSystems,
        initialTriage: args.initialTriage,
        complianceFrameworks: args.complianceFrameworks,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Classify incident category (malware infection, data breach, account compromise, DDoS, ransomware, APT, insider threat)',
        '2. Identify attack vector (phishing, exploit, credential theft, social engineering, supply chain, misconfiguration)',
        '3. Determine attack phase (reconnaissance, initial access, execution, persistence, privilege escalation, defense evasion, credential access, discovery, lateral movement, collection, exfiltration, impact)',
        '4. Assess attacker sophistication (script kiddie, organized crime, nation-state, insider)',
        '5. Identify potential attacker motivation (financial, espionage, sabotage, activism, testing)',
        '6. Map to MITRE ATT&CK framework techniques',
        '7. Determine if incident is targeted or opportunistic',
        '8. Assess potential for data breach and regulatory impact',
        '9. Identify applicable compliance frameworks (GDPR, HIPAA, PCI-DSS, SOX, etc.)',
        '10. Determine if regulatory notification required',
        '11. Estimate confidence level in classification',
        '12. Document classification rationale'
      ],
      outputFormat: 'JSON object with incident classification details'
    },
    outputSchema: {
      type: 'object',
      required: ['incidentCategory', 'attackVector', 'attackPhase', 'confidenceLevel', 'artifacts'],
      properties: {
        incidentCategory: { type: 'string' },
        attackVector: { type: 'string' },
        attackPhase: { type: 'array', items: { type: 'string' } },
        mitreAttackTechniques: { type: 'array', items: { type: 'string' } },
        attackerProfile: {
          type: 'object',
          properties: {
            sophistication: { type: 'string', enum: ['low', 'medium', 'high', 'advanced'] },
            motivation: { type: 'string' },
            type: { type: 'string', enum: ['opportunistic', 'targeted', 'unknown'] }
          }
        },
        potentialImpact: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
        dataBreach: { type: 'boolean' },
        applicableCompliance: { type: 'array', items: { type: 'string' } },
        regulatoryNotificationRequired: { type: 'boolean' },
        notificationDeadlines: { type: 'array', items: { type: 'object' } },
        confidenceLevel: { type: 'number', minimum: 0, maximum: 1 },
        classificationNotes: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-incident', 'classification']
}));

// Phase 3: Declaration and Mobilization
export const declarationMobilizationTask = defineTask('declaration-mobilization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Incident Declaration and Team Mobilization - ${args.incidentId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Incident Commander',
      task: 'Declare security incident and mobilize response team',
      context: {
        incidentId: args.incidentId,
        incidentType: args.incidentType,
        severity: args.severity,
        classification: args.classification,
        affectedSystems: args.affectedSystems,
        securityTeam: args.securityTeam,
        forensicsRequired: args.forensicsRequired,
        regulatoryNotification: args.regulatoryNotification,
        lawEnforcementContact: args.lawEnforcementContact,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Formally declare security incident in incident management system',
        '2. Assign Incident Commander (overall coordination)',
        '3. Assign Security Lead (technical investigation and response)',
        '4. Assign Forensics Lead (evidence collection and analysis) if forensics required',
        '5. Assign Communications Lead (stakeholder and regulatory communication)',
        '6. Assign Legal Counsel (regulatory and legal guidance)',
        '7. Assign CISO/Security Executive for critical incidents',
        '8. Create dedicated security incident war room (Slack, Teams, Zoom)',
        '9. Activate security incident response plan',
        '10. Notify security team and on-call responders',
        '11. Notify executive leadership for critical/high severity',
        '12. Contact law enforcement if required (FBI, Secret Service)',
        '13. Engage external security consultants if needed',
        '14. Establish communication protocols',
        '15. Document team roster and contact information'
      ],
      outputFormat: 'JSON object with team mobilization details'
    },
    outputSchema: {
      type: 'object',
      required: ['declaredAt', 'teamMobilized', 'incidentCommander', 'securityLead', 'artifacts'],
      properties: {
        declaredAt: { type: 'string', description: 'ISO timestamp when incident was declared' },
        teamMobilized: { type: 'boolean' },
        incidentCommander: { type: 'string' },
        securityLead: { type: 'string' },
        forensicsLead: { type: 'string' },
        commsLead: { type: 'string' },
        legalCounsel: { type: 'string' },
        executiveSponsor: { type: 'string' },
        warRoomUrl: { type: 'string', description: 'URL to incident war room/channel' },
        incidentResponsePlanActivated: { type: 'boolean' },
        lawEnforcementNotified: { type: 'boolean' },
        lawEnforcementContact: { type: 'string' },
        externalConsultantsEngaged: { type: 'boolean' },
        stakeholdersNotified: { type: 'array', items: { type: 'string' } },
        missingRoles: { type: 'array', items: { type: 'string' } },
        incidentUrl: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-incident', 'declaration']
}));

// Phase 4: Containment Strategy
export const containmentStrategyTask = defineTask('containment-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Containment Strategy Development - ${args.incidentId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Containment Specialist',
      task: 'Develop containment strategy to prevent incident spread',
      context: {
        incidentId: args.incidentId,
        severity: args.severity,
        classification: args.classification,
        affectedSystems: args.affectedSystems,
        initialTriage: args.initialTriage,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Assess threat spread risk and urgency',
        '2. Develop short-term containment strategy (immediate actions to limit spread)',
        '3. Short-term examples: isolate infected systems, disable compromised accounts, block malicious IPs/domains',
        '4. Develop long-term containment strategy (sustained containment until eradication)',
        '5. Long-term examples: network segmentation, enhanced monitoring, access restrictions',
        '6. Prioritize containment actions by criticality and impact',
        '7. Assess business impact of each containment action',
        '8. Estimate downtime and service disruption',
        '9. Develop rollback plan for containment actions',
        '10. Identify systems to isolate or shut down',
        '11. Define network segmentation changes',
        '12. Specify account and access restrictions',
        '13. Define firewall and security control changes',
        '14. Assess risk of not containing vs. business impact of containment',
        '15. Determine if approval required for high-impact actions',
        '16. Document containment strategy and rationale'
      ],
      outputFormat: 'JSON object with containment strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['primaryStrategy', 'containmentSteps', 'businessImpact', 'artifacts'],
      properties: {
        primaryStrategy: { type: 'string', description: 'Primary containment approach' },
        shortTermActions: { type: 'array', items: { type: 'string' } },
        longTermActions: { type: 'array', items: { type: 'string' } },
        containmentSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'number' },
              action: { type: 'string' },
              system: { type: 'string' },
              priority: { type: 'string', enum: ['immediate', 'high', 'medium', 'low'] },
              estimatedDowntime: { type: 'string' }
            }
          }
        },
        systemsToIsolate: { type: 'array', items: { type: 'string' } },
        accountsToDisable: { type: 'array', items: { type: 'string' } },
        networkSegmentation: { type: 'array', items: { type: 'string' } },
        firewallChanges: { type: 'array', items: { type: 'string' } },
        businessImpact: { type: 'string', enum: ['minimal', 'moderate', 'significant', 'severe'] },
        estimatedDowntime: { type: 'string' },
        riskOfNotContaining: { type: 'string' },
        rollbackPlan: { type: 'string' },
        requiresApproval: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-incident', 'containment']
}));

// Phase 5: Forensics Collection
export const forensicsCollectionTask = defineTask('forensics-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Evidence Collection and Digital Forensics - ${args.incidentId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Digital Forensics Specialist',
      task: 'Collect and preserve digital evidence for investigation and potential legal proceedings',
      context: {
        incidentId: args.incidentId,
        severity: args.severity,
        classification: args.classification,
        affectedSystems: args.affectedSystems,
        containmentStrategy: args.containmentStrategy,
        lawEnforcementContact: args.lawEnforcementContact,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Establish chain of custody procedures',
        '2. Identify systems and data requiring forensic collection',
        '3. Prioritize volatile evidence (memory, network connections, running processes)',
        '4. Create forensic disk images of affected systems',
        '5. Preserve memory dumps for malware analysis',
        '6. Collect and preserve log files (system, application, network, security)',
        '7. Document network traffic captures',
        '8. Preserve email and communication records if relevant',
        '9. Collect user account and access logs',
        '10. Document system configurations and state',
        '11. Collect malware samples in safe manner',
        '12. Hash all evidence items for integrity verification',
        '13. Document evidence collection process with timestamps',
        '14. Store evidence securely with access controls',
        '15. Maintain detailed chain of custody log',
        '16. Coordinate with law enforcement if involved',
        '17. Generate forensic collection report'
      ],
      outputFormat: 'JSON object with forensics collection details'
    },
    outputSchema: {
      type: 'object',
      required: ['evidenceItems', 'chainOfCustodyEstablished', 'forensicsReportPath', 'artifacts'],
      properties: {
        evidenceItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string', enum: ['disk-image', 'memory-dump', 'log-file', 'network-capture', 'malware-sample', 'configuration', 'other'] },
              source: { type: 'string' },
              collectedAt: { type: 'string' },
              hash: { type: 'string' },
              size: { type: 'string' },
              location: { type: 'string' },
              custodian: { type: 'string' }
            }
          }
        },
        chainOfCustodyEstablished: { type: 'boolean' },
        chainOfCustodyIssues: { type: 'array', items: { type: 'string' } },
        volatileEvidenceCollected: { type: 'boolean' },
        diskImagesCreated: { type: 'number' },
        logFilesPreserved: { type: 'number' },
        malwareSamplesCollected: { type: 'number' },
        lawEnforcementCoordinated: { type: 'boolean' },
        evidenceStorageLocation: { type: 'string' },
        forensicsReportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-incident', 'forensics']
}));

// Phase 6: Containment Execution
export const containmentExecutionTask = defineTask('containment-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Containment Execution - ${args.incidentId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Operations Engineer',
      task: 'Execute containment procedures to prevent incident spread',
      context: {
        incidentId: args.incidentId,
        severity: args.severity,
        containmentStrategy: args.containmentStrategy,
        affectedSystems: args.affectedSystems,
        forensicsCompleted: args.forensicsCompleted,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Execute containment steps in priority order',
        '2. Isolate compromised systems from network',
        '3. Disable compromised user accounts and credentials',
        '4. Block malicious IP addresses and domains at firewall',
        '5. Implement network segmentation changes',
        '6. Apply emergency security patches if needed',
        '7. Increase monitoring and logging on affected systems',
        '8. Document each action with timestamp and result',
        '9. Verify containment effectiveness after each action',
        '10. Monitor for signs of continued malicious activity',
        '11. Coordinate with system owners and business teams',
        '12. Handle failures and execute fallback procedures',
        '13. Verify threat is contained and not spreading',
        '14. Document containment execution results',
        '15. Report containment status to incident commander'
      ],
      outputFormat: 'JSON object with containment execution results'
    },
    outputSchema: {
      type: 'object',
      required: ['containmentSuccessful', 'status', 'executionTime', 'containedAt', 'artifacts'],
      properties: {
        containmentSuccessful: { type: 'boolean' },
        status: { type: 'string', enum: ['contained', 'partially-contained', 'failed', 'monitoring'] },
        executedActions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              system: { type: 'string' },
              result: { type: 'string', enum: ['success', 'partial', 'failed'] },
              timestamp: { type: 'string' },
              notes: { type: 'string' }
            }
          }
        },
        systemsIsolated: { type: 'number' },
        accountsDisabled: { type: 'number' },
        ipAddressesBlocked: { type: 'number' },
        executionTime: { type: 'number', description: 'Seconds to execute containment' },
        containedAt: { type: 'string', description: 'ISO timestamp when containment completed' },
        threatStillActive: { type: 'boolean' },
        failureReasons: { type: 'array', items: { type: 'string' } },
        emergencyActions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-incident', 'containment', 'execution']
}));

// Phase 7.1: Threat Intelligence
export const threatIntelligenceTask = defineTask('threat-intelligence', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Threat Intelligence Analysis - ${args.incidentId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Threat Intelligence Analyst',
      task: 'Analyze threat intelligence and identify indicators of compromise',
      context: {
        incidentId: args.incidentId,
        classification: args.classification,
        containmentExecution: args.containmentExecution,
        forensicsData: args.forensicsData,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Extract indicators of compromise (IOCs) from evidence',
        '2. IOC types: IP addresses, domains, URLs, file hashes, email addresses, registry keys, malware signatures',
        '3. Search threat intelligence feeds for IOC matches',
        '4. Identify known malware families and campaigns',
        '5. Correlate with MITRE ATT&CK techniques',
        '6. Research threat actor TTPs (Tactics, Techniques, Procedures)',
        '7. Identify similar incidents in threat intelligence databases',
        '8. Assess if part of larger campaign or targeted attack',
        '9. Determine threat actor attribution if possible',
        '10. Identify additional IOCs from threat intelligence',
        '11. Generate IOC feed for detection and blocking',
        '12. Document threat intelligence findings',
        '13. Share IOCs with security community if appropriate'
      ],
      outputFormat: 'JSON object with threat intelligence analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['iocsIdentified', 'findings', 'artifacts'],
      properties: {
        iocsIdentified: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['ip', 'domain', 'url', 'file-hash', 'email', 'registry-key', 'malware-signature', 'other'] },
              value: { type: 'string' },
              confidence: { type: 'string', enum: ['low', 'medium', 'high', 'confirmed'] },
              source: { type: 'string' },
              firstSeen: { type: 'string' }
            }
          }
        },
        malwareFamilies: { type: 'array', items: { type: 'string' } },
        campaigns: { type: 'array', items: { type: 'string' } },
        attackerProfile: {
          type: 'object',
          properties: {
            attribution: { type: 'string' },
            motivation: { type: 'string' },
            sophistication: { type: 'string' },
            confidence: { type: 'string', enum: ['low', 'medium', 'high'] }
          }
        },
        attackTechniques: { type: 'array', items: { type: 'string' } },
        relatedIncidents: { type: 'array', items: { type: 'string' } },
        findings: { type: 'array', items: { type: 'string' } },
        iocFeedPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-incident', 'threat-intelligence']
}));

// Phase 7.2: Impact Assessment
export const impactAssessmentTask = defineTask('impact-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Impact Assessment - ${args.incidentId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Impact Analyst',
      task: 'Assess business, data, and regulatory impact of security incident',
      context: {
        incidentId: args.incidentId,
        severity: args.severity,
        affectedSystems: args.affectedSystems,
        classification: args.classification,
        containmentExecution: args.containmentExecution,
        complianceFrameworks: args.complianceFrameworks,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Assess if data was compromised or exfiltrated',
        '2. Identify types of data affected (PII, PHI, PCI, IP, credentials)',
        '3. Estimate number of records/individuals affected',
        '4. Assess confidentiality, integrity, and availability impact',
        '5. Evaluate business operations impact',
        '6. Estimate financial impact (direct costs, lost revenue, recovery costs)',
        '7. Assess reputation and brand damage',
        '8. Evaluate regulatory and compliance implications',
        '9. Determine breach notification requirements (GDPR, HIPAA, state laws)',
        '10. Calculate notification deadlines (72 hours for GDPR)',
        '11. Assess potential regulatory penalties',
        '12. Evaluate legal liability and litigation risk',
        '13. Document impact assessment findings',
        '14. Provide recommendations for impact mitigation'
      ],
      outputFormat: 'JSON object with impact assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['dataCompromised', 'businessImpact', 'artifacts'],
      properties: {
        dataCompromised: { type: 'boolean' },
        dataExfiltrated: { type: 'boolean' },
        sensitiveDataTypes: { type: 'array', items: { type: 'string' } },
        recordsAffected: { type: 'number' },
        individualsAffected: { type: 'number' },
        confidentialityImpact: { type: 'string', enum: ['none', 'low', 'medium', 'high'] },
        integrityImpact: { type: 'string', enum: ['none', 'low', 'medium', 'high'] },
        availabilityImpact: { type: 'string', enum: ['none', 'low', 'medium', 'high'] },
        businessImpact: { type: 'string', enum: ['minimal', 'moderate', 'significant', 'severe'] },
        operationalDisruption: { type: 'string' },
        estimatedCost: { type: 'string' },
        revenueImpact: { type: 'string' },
        reputationImpact: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
        regulatoryRequirements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              regulation: { type: 'string' },
              notificationRequired: { type: 'boolean' },
              deadline: { type: 'string' },
              penalties: { type: 'string' }
            }
          }
        },
        notificationDeadlines: { type: 'string' },
        regulatoryPenalties: { type: 'string' },
        legalLiability: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-incident', 'impact-assessment']
}));

// Phase 7.3: Vulnerability Analysis
export const vulnerabilityAnalysisTask = defineTask('vulnerability-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Vulnerability Analysis - ${args.incidentId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Vulnerability Analyst',
      task: 'Identify vulnerabilities that enabled the security incident',
      context: {
        incidentId: args.incidentId,
        affectedSystems: args.affectedSystems,
        classification: args.classification,
        containmentExecution: args.containmentExecution,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify technical vulnerabilities exploited in attack',
        '2. Analyze unpatched software and missing security updates',
        '3. Identify configuration weaknesses and misconfigurations',
        '4. Assess weak authentication and access controls',
        '5. Review security control gaps that enabled attack',
        '6. Identify human factors (phishing susceptibility, insider threat)',
        '7. Analyze process and procedural weaknesses',
        '8. Map vulnerabilities to CVE database if applicable',
        '9. Assess CVSS scores for technical vulnerabilities',
        '10. Prioritize vulnerabilities by exploitability and impact',
        '11. Identify similar vulnerabilities in other systems',
        '12. Recommend remediation actions for each vulnerability',
        '13. Document vulnerability analysis findings'
      ],
      outputFormat: 'JSON object with vulnerability analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'findings', 'artifacts'],
      properties: {
        vulnerabilities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string', enum: ['technical', 'configuration', 'access-control', 'human', 'process', 'other'] },
              description: { type: 'string' },
              cveId: { type: 'string' },
              cvssScore: { type: 'number' },
              exploited: { type: 'boolean' },
              affectedSystems: { type: 'array', items: { type: 'string' } },
              remediation: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
            }
          }
        },
        rootCause: { type: 'string' },
        contributingFactors: { type: 'array', items: { type: 'string' } },
        securityControlGaps: { type: 'array', items: { type: 'string' } },
        similarSystemsAtRisk: { type: 'array', items: { type: 'string' } },
        findings: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-incident', 'vulnerability-analysis']
}));

// Phase 8: Eradication
export const eradicationTask = defineTask('eradication', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Eradication - ${args.incidentId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Remediation Specialist',
      task: 'Eradicate threat completely from environment',
      context: {
        incidentId: args.incidentId,
        severity: args.severity,
        classification: args.classification,
        affectedSystems: args.affectedSystems,
        threatIntelligence: args.threatIntelligence,
        vulnerabilityAnalysis: args.vulnerabilityAnalysis,
        containmentExecution: args.containmentExecution,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Remove malware from all infected systems',
        '2. Delete malicious files, scripts, and executables',
        '3. Remove unauthorized user accounts and backdoors',
        '4. Revoke compromised credentials and certificates',
        '5. Remove malicious registry entries and scheduled tasks',
        '6. Clean infected systems or rebuild from clean images',
        '7. Patch vulnerabilities that enabled the attack',
        '8. Apply security updates and configuration hardening',
        '9. Remove attacker persistence mechanisms',
        '10. Reset passwords for all potentially compromised accounts',
        '11. Rotate encryption keys and API tokens',
        '12. Search entire environment for additional compromises',
        '13. Verify complete removal using security scanning',
        '14. Document eradication actions performed',
        '15. Confirm no attacker presence remains'
      ],
      outputFormat: 'JSON object with eradication results'
    },
    outputSchema: {
      type: 'object',
      required: ['eradicationSuccessful', 'status', 'eradicatedAt', 'artifacts'],
      properties: {
        eradicationSuccessful: { type: 'boolean' },
        status: { type: 'string', enum: ['complete', 'in-progress', 'incomplete'] },
        actionsPerformed: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              system: { type: 'string' },
              result: { type: 'string', enum: ['success', 'partial', 'failed'] },
              timestamp: { type: 'string' }
            }
          }
        },
        malwareRemoved: { type: 'number' },
        backdoorsClosed: { type: 'number' },
        accountsRevoked: { type: 'number' },
        credentialsReset: { type: 'number' },
        vulnerabilitiesPatched: { type: 'number' },
        systemsRebuilt: { type: 'number' },
        verificationResults: { type: 'string' },
        remainingThreats: { type: 'array', items: { type: 'string' } },
        eradicatedAt: { type: 'string', description: 'ISO timestamp when eradication completed' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-incident', 'eradication']
}));

// Phase 9: Recovery
export const recoveryTask = defineTask('recovery', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Recovery and Restoration - ${args.incidentId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'System Recovery Specialist',
      task: 'Restore systems to normal operations',
      context: {
        incidentId: args.incidentId,
        severity: args.severity,
        affectedSystems: args.affectedSystems,
        eradication: args.eradication,
        vulnerabilityAnalysis: args.vulnerabilityAnalysis,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Verify threat is completely eradicated before recovery',
        '2. Restore systems from clean backups if needed',
        '3. Validate backup integrity before restoration',
        '4. Rebuild compromised systems from trusted sources',
        '5. Apply all security patches and hardening',
        '6. Restore data from verified clean backups',
        '7. Gradually restore services in controlled manner',
        '8. Test systems thoroughly before production',
        '9. Implement additional security monitoring',
        '10. Verify no signs of re-infection during recovery',
        '11. Restore network connectivity in phases',
        '12. Validate business operations functionality',
        '13. Monitor systems closely for anomalies',
        '14. Document recovery process and results',
        '15. Confirm normal operations restored'
      ],
      outputFormat: 'JSON object with recovery results'
    },
    outputSchema: {
      type: 'object',
      required: ['recoverySuccessful', 'systemsRestored', 'totalSystems', 'recoveredAt', 'artifacts'],
      properties: {
        recoverySuccessful: { type: 'boolean' },
        systemsRestored: { type: 'number' },
        totalSystems: { type: 'number' },
        recoveryActions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              system: { type: 'string' },
              action: { type: 'string', enum: ['restored-from-backup', 'rebuilt', 'patched', 'validated'] },
              result: { type: 'string', enum: ['success', 'partial', 'failed'] },
              timestamp: { type: 'string' }
            }
          }
        },
        backupsRestored: { type: 'number' },
        systemsRebuilt: { type: 'number' },
        servicesRestored: { type: 'array', items: { type: 'string' } },
        testingPerformed: { type: 'boolean' },
        monitoringEnhanced: { type: 'boolean' },
        recoveryIssues: { type: 'array', items: { type: 'string' } },
        monitoringStatus: { type: 'string' },
        recoveryTime: { type: 'number', description: 'Seconds to complete recovery' },
        recoveredAt: { type: 'string', description: 'ISO timestamp when recovery completed' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-incident', 'recovery']
}));

// Phase 10: Communications
export const communicationsTask = defineTask('communications', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Stakeholder Communications - ${args.incidentId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Communications Lead',
      task: 'Manage internal, external, and regulatory communications',
      context: {
        incidentId: args.incidentId,
        severity: args.severity,
        classification: args.classification,
        impactAssessment: args.impactAssessment,
        incidentResolved: args.incidentResolved,
        regulatoryNotification: args.regulatoryNotification,
        complianceFrameworks: args.complianceFrameworks,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Develop communication plan and messaging',
        '2. Internal communications: employees, executives, board',
        '3. External communications: customers, partners, vendors',
        '4. Regulatory notifications: GDPR, HIPAA, PCI-DSS, state breach laws',
        '5. Law enforcement coordination if required',
        '6. Media and public relations if necessary',
        '7. Customer breach notifications (email, letter)',
        '8. Status page updates for service incidents',
        '9. Coordinate with legal counsel on all communications',
        '10. Ensure accurate, timely, and compliant messaging',
        '11. Document all communications sent',
        '12. Track notification deadlines and compliance',
        '13. Provide regular updates throughout incident',
        '14. Final resolution communication to all stakeholders'
      ],
      outputFormat: 'JSON object with communications details'
    },
    outputSchema: {
      type: 'object',
      required: ['internalCommunications', 'externalNotifications', 'regulatoryFilings', 'artifacts'],
      properties: {
        internalCommunications: { type: 'number', description: 'Number of internal updates issued' },
        externalNotifications: { type: 'number', description: 'Number of external notifications' },
        regulatoryFilings: { type: 'number', description: 'Number of regulatory notifications' },
        customerNotifications: { type: 'number' },
        mediaStatements: { type: 'number' },
        communications: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['internal', 'customer', 'regulatory', 'media', 'law-enforcement', 'partner'] },
              recipient: { type: 'string' },
              method: { type: 'string', enum: ['email', 'letter', 'portal', 'phone', 'press-release'] },
              sentAt: { type: 'string' },
              content: { type: 'string' }
            }
          }
        },
        regulatoryFilingsCompleted: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              regulation: { type: 'string' },
              filed: { type: 'boolean' },
              filedAt: { type: 'string' },
              confirmationNumber: { type: 'string' }
            }
          }
        },
        deadlinesMet: { type: 'boolean' },
        missedDeadlines: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-incident', 'communications']
}));

// Phase 11: Post-Incident Analysis
export const postIncidentAnalysisTask = defineTask('post-incident-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Post-Incident Analysis - ${args.incidentId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Analyst',
      task: 'Conduct comprehensive post-incident analysis',
      context: {
        incidentId: args.incidentId,
        severity: args.severity,
        classification: args.classification,
        startTime: args.startTime,
        initialTriage: args.initialTriage,
        containmentExecution: args.containmentExecution,
        forensicsData: args.forensicsData,
        threatIntelligence: args.threatIntelligence,
        impactAssessment: args.impactAssessment,
        vulnerabilityAnalysis: args.vulnerabilityAnalysis,
        eradication: args.eradication,
        recovery: args.recovery,
        communications: args.communications,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create comprehensive incident timeline',
        '2. Calculate key metrics (time to detect, contain, eradicate, recover)',
        '3. Analyze response effectiveness',
        '4. Identify what went well during response',
        '5. Identify what could be improved',
        '6. Assess adherence to incident response plan',
        '7. Evaluate team coordination and communication',
        '8. Review tool effectiveness',
        '9. Assess detection capabilities',
        '10. Analyze response time and efficiency',
        '11. Document root cause and contributing factors',
        '12. Summarize total impact',
        '13. Generate detailed analysis report'
      ],
      outputFormat: 'JSON object with post-incident analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'timeline', 'timelinePath', 'artifacts'],
      properties: {
        metrics: {
          type: 'object',
          properties: {
            detectionTime: { type: 'number', description: 'Time from incident start to detection (seconds)' },
            timeToContain: { type: 'number', description: 'Time to contain incident (seconds)' },
            timeToEradicate: { type: 'number', description: 'Time to eradicate threat (seconds)' },
            timeToRecover: { type: 'number', description: 'Time to restore operations (seconds)' },
            totalResponseTime: { type: 'number', description: 'Total time from detection to recovery (seconds)' },
            responseEffectiveness: { type: 'number', minimum: 0, maximum: 100 }
          }
        },
        timeline: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              timestamp: { type: 'string' },
              phase: { type: 'string' },
              event: { type: 'string' },
              actor: { type: 'string' }
            }
          }
        },
        whatWentWell: { type: 'array', items: { type: 'string' } },
        whatCouldImprove: { type: 'array', items: { type: 'string' } },
        planAdherence: { type: 'string', enum: ['full', 'partial', 'minimal', 'none'] },
        toolEffectiveness: { type: 'object' },
        detectionCapability: { type: 'string', enum: ['excellent', 'good', 'fair', 'poor'] },
        timelinePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-incident', 'post-incident-analysis']
}));

// Phase 12: Lessons Learned
export const lessonsLearnedTask = defineTask('lessons-learned', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Lessons Learned - ${args.incidentId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Improvement Lead',
      task: 'Capture lessons learned and generate improvement recommendations',
      context: {
        incidentId: args.incidentId,
        severity: args.severity,
        classification: args.classification,
        postIncidentAnalysis: args.postIncidentAnalysis,
        vulnerabilityAnalysis: args.vulnerabilityAnalysis,
        threatIntelligence: args.threatIntelligence,
        impactAssessment: args.impactAssessment,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify immediate security improvements (0-7 days)',
        '2. Immediate: patch critical vulnerabilities, block IOCs, revoke credentials',
        '3. Identify short-term improvements (1-4 weeks)',
        '4. Short-term: enhance monitoring, update procedures, security training',
        '5. Identify long-term strategic improvements (1-6 months)',
        '6. Long-term: architecture changes, new tools, process redesign',
        '7. Recommend detection capability enhancements',
        '8. Recommend response process improvements',
        '9. Recommend security control additions',
        '10. Recommend training and awareness improvements',
        '11. Create action items with owners and timelines',
        '12. Prioritize by risk reduction and feasibility',
        '13. Document lessons learned clearly',
        '14. Generate recommendations report'
      ],
      outputFormat: 'JSON object with lessons learned and recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['immediateActions', 'shortTermImprovements', 'longTermImprovements', 'recommendationsPath', 'artifacts'],
      properties: {
        immediateActions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              owner: { type: 'string' },
              dueDate: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        shortTermImprovements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              improvement: { type: 'string' },
              category: { type: 'string', enum: ['detection', 'response', 'prevention', 'training', 'process'] },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] },
              owner: { type: 'string' },
              estimatedEffort: { type: 'string' }
            }
          }
        },
        longTermImprovements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              improvement: { type: 'string' },
              category: { type: 'string', enum: ['architecture', 'tooling', 'process', 'governance', 'culture'] },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] },
              strategicValue: { type: 'string' },
              estimatedEffort: { type: 'string' }
            }
          }
        },
        detectionEnhancements: { type: 'array', items: { type: 'string' } },
        responseImprovements: { type: 'array', items: { type: 'string' } },
        preventionMeasures: { type: 'array', items: { type: 'string' } },
        trainingNeeds: { type: 'array', items: { type: 'string' } },
        recommendationsPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-incident', 'lessons-learned']
}));

// Phase 13: Post-Mortem Report
export const postMortemReportTask = defineTask('post-mortem-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 13: Post-Mortem Report Generation - ${args.incidentId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Documentation Specialist',
      task: 'Generate comprehensive security incident post-mortem report',
      context: {
        incidentId: args.incidentId,
        severity: args.severity,
        incidentType: args.incidentType,
        affectedSystems: args.affectedSystems,
        startTime: args.startTime,
        initialTriage: args.initialTriage,
        classification: args.classification,
        containmentExecution: args.containmentExecution,
        forensicsData: args.forensicsData,
        threatIntelligence: args.threatIntelligence,
        impactAssessment: args.impactAssessment,
        vulnerabilityAnalysis: args.vulnerabilityAnalysis,
        eradication: args.eradication,
        recovery: args.recovery,
        communications: args.communications,
        postIncidentAnalysis: args.postIncidentAnalysis,
        lessonsLearned: args.lessonsLearned,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Write executive summary for leadership',
        '2. Document incident overview and classification',
        '3. Present detailed timeline of events',
        '4. Describe attack vector and techniques',
        '5. Document impact assessment (data, financial, operational)',
        '6. Describe containment, eradication, and recovery actions',
        '7. Present forensics findings and threat intelligence',
        '8. Document root cause analysis',
        '9. Include what went well during response',
        '10. Include what could be improved',
        '11. Present lessons learned',
        '12. Include all recommendations with priorities',
        '13. Add supporting evidence and IOCs',
        '14. Include response metrics and effectiveness',
        '15. Format as comprehensive Markdown document',
        '16. Make report suitable for stakeholder review'
      ],
      outputFormat: 'JSON object with post-mortem report structure'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummary', 'rootCause', 'totalImpact', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        incidentOverview: { type: 'string' },
        rootCause: { type: 'string' },
        attackNarrative: { type: 'string' },
        totalImpact: { type: 'string' },
        responseActions: { type: 'string' },
        whatWentWell: { type: 'array', items: { type: 'string' } },
        whatCouldImprove: { type: 'array', items: { type: 'string' } },
        lessonsLearned: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'object' } },
        iocsSummary: { type: 'array', items: { type: 'string' } },
        metrics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-incident', 'post-mortem']
}));

// Phase 14: Metrics and Continuous Improvement
export const metricsImprovementTask = defineTask('metrics-improvement', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 14: Security Metrics and Continuous Improvement - ${args.incidentId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Metrics Analyst',
      task: 'Compute security metrics and track continuous improvement',
      context: {
        incidentId: args.incidentId,
        severity: args.severity,
        classification: args.classification,
        postIncidentAnalysis: args.postIncidentAnalysis,
        impactAssessment: args.impactAssessment,
        lessonsLearned: args.lessonsLearned,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Calculate all security incident metrics',
        '2. Compare to historical incident metrics',
        '3. Assess security posture improvement opportunities',
        '4. Track implementation of lessons learned',
        '5. Measure response effectiveness improvements',
        '6. Create security metrics dashboard',
        '7. Identify trends in security incidents',
        '8. Recommend continuous improvement actions',
        '9. Define KPIs for tracking progress',
        '10. Generate metrics report for stakeholders'
      ],
      outputFormat: 'JSON object with security metrics and improvement tracking'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'metricsReportPath', 'recommendation', 'artifacts'],
      properties: {
        metrics: {
          type: 'object',
          properties: {
            detectionTime: { type: 'number' },
            containmentTime: { type: 'number' },
            eradicationTime: { type: 'number' },
            recoveryTime: { type: 'number' },
            totalResponseTime: { type: 'number' },
            responseEffectiveness: { type: 'number', minimum: 0, maximum: 100 },
            impactScore: { type: 'number', minimum: 0, maximum: 100 }
          }
        },
        comparisonToAverage: {
          type: 'object',
          properties: {
            detectionComparison: { type: 'string' },
            containmentComparison: { type: 'string' },
            trend: { type: 'string', enum: ['improving', 'stable', 'degrading'] }
          }
        },
        securityPostureImprovement: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              area: { type: 'string' },
              currentState: { type: 'string' },
              targetState: { type: 'string' },
              improvementActions: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        kpis: { type: 'array', items: { type: 'object' } },
        metricsReportPath: { type: 'string' },
        recommendation: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-incident', 'metrics', 'continuous-improvement']
}));
