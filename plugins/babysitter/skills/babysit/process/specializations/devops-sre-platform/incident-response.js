/**
 * @process specializations/devops-sre-platform/incident-response
 * @description Incident Response Process - Structured incident management framework covering detection, triage, investigation,
 * mitigation, resolution, and post-incident analysis with defined roles, communication protocols, severity levels, and
 * runbook execution to minimize MTTR and improve system reliability.
 * @inputs { incidentType?: string, severity?: string, affectedServices?: array, alertSource?: string, description?: string, onCallTeam?: string }
 * @outputs { success: boolean, incidentId: string, severity: string, resolution: object, mttr: number, actionItems: array, postmortemPath?: string }
 *
 * @example
 * const result = await orchestrate('specializations/devops-sre-platform/incident-response', {
 *   incidentType: 'service-outage',
 *   severity: 'SEV-1',
 *   affectedServices: ['payment-api', 'checkout-service'],
 *   alertSource: 'prometheus',
 *   description: 'Payment API responding with 500 errors, affecting checkout flow',
 *   onCallTeam: 'platform-team'
 * });
 *
 * @references
 * - Google SRE Book - Managing Incidents: https://sre.google/sre-book/managing-incidents/
 * - PagerDuty Incident Response: https://response.pagerduty.com/
 * - Atlassian Incident Management: https://www.atlassian.com/incident-management
 * - FireHydrant: https://firehydrant.io/blog/incident-response-process/
 * - Incident.io Best Practices: https://incident.io/guide/incident-response-process
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    incidentType = 'unknown',
    severity = 'SEV-3',
    affectedServices = [],
    alertSource = 'manual',
    description = '',
    onCallTeam = 'default-oncall',
    incidentManagementTool = 'pagerduty', // 'pagerduty', 'opsgenie', 'incident.io', 'jira'
    communicationChannel = 'slack',
    runbookUrl = null,
    customerFacing = true,
    automatedMitigation = true,
    postmortemRequired = null, // null = auto-determine based on severity
    outputDir = 'incident-response-output',
    timeZone = 'UTC'
  } = inputs;

  const startTime = ctx.now();
  const incidentId = `INC-${Date.now()}`;
  const artifacts = [];
  let mttr = 0;
  let incidentResolved = false;

  ctx.log('info', `Starting Incident Response Process for ${incidentId}`);
  ctx.log('info', `Severity: ${severity}, Type: ${incidentType}, Affected Services: ${affectedServices.join(', ')}`);

  // ============================================================================
  // PHASE 1: INCIDENT DETECTION AND ALERT
  // ============================================================================

  ctx.log('info', 'Phase 1: Incident Detection and Alert Processing');

  const incidentDetection = await ctx.task(incidentDetectionTask, {
    incidentId,
    incidentType,
    severity,
    affectedServices,
    alertSource,
    description,
    customerFacing,
    outputDir
  });

  artifacts.push(...incidentDetection.artifacts);

  // Determine actual severity based on impact analysis
  const actualSeverity = incidentDetection.severityRecommendation || severity;

  ctx.log('info', `Incident detected - Severity: ${actualSeverity}, Impact: ${incidentDetection.impactLevel}`);

  // ============================================================================
  // PHASE 2: INCIDENT DECLARATION AND TEAM MOBILIZATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Declaring incident and mobilizing response team');

  const incidentDeclaration = await ctx.task(incidentDeclarationTask, {
    incidentId,
    incidentType,
    severity: actualSeverity,
    affectedServices,
    description,
    incidentDetection,
    onCallTeam,
    incidentManagementTool,
    communicationChannel,
    outputDir
  });

  artifacts.push(...incidentDeclaration.artifacts);

  // Quality Gate: Team mobilization
  if (!incidentDeclaration.teamMobilized) {
    await ctx.breakpoint({
      question: `Incident ${incidentId} declared but team mobilization incomplete. Missing roles: ${incidentDeclaration.missingRoles.join(', ')}. Manually assign roles and continue?`,
      title: 'Incident Team Mobilization',
      context: {
        runId: ctx.runId,
        incidentId,
        severity: actualSeverity,
        incidentCommander: incidentDeclaration.incidentCommander,
        missingRoles: incidentDeclaration.missingRoles,
        warRoomUrl: incidentDeclaration.warRoomUrl,
        recommendation: 'Ensure all critical roles are filled before proceeding',
        files: incidentDeclaration.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 3: INITIAL ASSESSMENT AND IMPACT ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Conducting initial assessment and impact analysis');

  const impactAssessment = await ctx.task(impactAssessmentTask, {
    incidentId,
    severity: actualSeverity,
    affectedServices,
    incidentDetection,
    customerFacing,
    outputDir
  });

  artifacts.push(...impactAssessment.artifacts);

  ctx.log('info', `Impact Assessment - Customers Affected: ${impactAssessment.customersAffected}, Business Impact: ${impactAssessment.businessImpact}`);

  // Quality Gate: High severity impact verification
  if ((actualSeverity === 'SEV-1' || actualSeverity === 'SEV-2') && impactAssessment.customersAffected > 1000) {
    await ctx.breakpoint({
      question: `High severity incident ${incidentId} affecting ${impactAssessment.customersAffected} customers. Verify impact assessment and escalation? Consider invoking emergency procedures.`,
      title: 'High Severity Impact Verification',
      context: {
        runId: ctx.runId,
        incidentId,
        severity: actualSeverity,
        customersAffected: impactAssessment.customersAffected,
        businessImpact: impactAssessment.businessImpact,
        revenueImpact: impactAssessment.estimatedRevenueImpact,
        recommendation: 'Verify executive notification and customer communications are initiated',
        files: impactAssessment.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 4: PARALLEL INVESTIGATION AND DIAGNOSTICS
  // ============================================================================

  ctx.log('info', 'Phase 4: Running parallel investigation and diagnostics');

  // Run multiple diagnostic tasks in parallel
  const [
    logAnalysis,
    metricsAnalysis,
    traceAnalysis
  ] = await ctx.parallel.all([
    () => ctx.task(logAnalysisTask, {
      incidentId,
      affectedServices,
      startTime,
      outputDir
    }),
    () => ctx.task(metricsAnalysisTask, {
      incidentId,
      affectedServices,
      startTime,
      outputDir
    }),
    () => ctx.task(traceAnalysisTask, {
      incidentId,
      affectedServices,
      startTime,
      outputDir
    })
  ]);

  artifacts.push(
    ...logAnalysis.artifacts,
    ...metricsAnalysis.artifacts,
    ...traceAnalysis.artifacts
  );

  // ============================================================================
  // PHASE 5: ROOT CAUSE INVESTIGATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Conducting root cause investigation');

  const rootCauseInvestigation = await ctx.task(rootCauseInvestigationTask, {
    incidentId,
    incidentType,
    affectedServices,
    logAnalysis,
    metricsAnalysis,
    traceAnalysis,
    impactAssessment,
    runbookUrl,
    outputDir
  });

  artifacts.push(...rootCauseInvestigation.artifacts);

  const rootCauseIdentified = rootCauseInvestigation.rootCauseConfidence > 0.7;

  ctx.log('info', `Root Cause Investigation - Identified: ${rootCauseIdentified}, Confidence: ${rootCauseInvestigation.rootCauseConfidence}`);

  // Quality Gate: Root cause confidence
  if (!rootCauseIdentified && (actualSeverity === 'SEV-1' || actualSeverity === 'SEV-2')) {
    await ctx.breakpoint({
      question: `Root cause for ${incidentId} not clearly identified (confidence: ${rootCauseInvestigation.rootCauseConfidence}). Review investigation findings and hypotheses before proceeding with mitigation?`,
      title: 'Root Cause Investigation Review',
      context: {
        runId: ctx.runId,
        incidentId,
        severity: actualSeverity,
        hypotheses: rootCauseInvestigation.hypotheses,
        investigationFindings: rootCauseInvestigation.findings,
        recommendation: 'Consider additional investigation or proceed with mitigation based on strongest hypothesis',
        files: rootCauseInvestigation.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 6: MITIGATION STRATEGY DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 6: Developing mitigation strategy');

  const mitigationStrategy = await ctx.task(mitigationStrategyTask, {
    incidentId,
    severity: actualSeverity,
    rootCauseInvestigation,
    affectedServices,
    impactAssessment,
    automatedMitigation,
    outputDir
  });

  artifacts.push(...mitigationStrategy.artifacts);

  // Quality Gate: Mitigation strategy approval (for high severity or risky mitigations)
  if (mitigationStrategy.requiresApproval) {
    await ctx.breakpoint({
      question: `Mitigation strategy for ${incidentId} requires approval. Strategy: ${mitigationStrategy.primaryStrategy}. Risk: ${mitigationStrategy.riskLevel}. Approve mitigation?`,
      title: 'Mitigation Strategy Approval',
      context: {
        runId: ctx.runId,
        incidentId,
        severity: actualSeverity,
        primaryStrategy: mitigationStrategy.primaryStrategy,
        mitigationSteps: mitigationStrategy.mitigationSteps,
        estimatedDuration: mitigationStrategy.estimatedDuration,
        riskLevel: mitigationStrategy.riskLevel,
        rollbackPlan: mitigationStrategy.rollbackPlan,
        files: mitigationStrategy.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 7: MITIGATION EXECUTION
  // ============================================================================

  ctx.log('info', 'Phase 7: Executing mitigation plan');

  const mitigationExecution = await ctx.task(mitigationExecutionTask, {
    incidentId,
    severity: actualSeverity,
    mitigationStrategy,
    affectedServices,
    automatedMitigation,
    outputDir
  });

  artifacts.push(...mitigationExecution.artifacts);

  incidentResolved = mitigationExecution.mitigationSuccessful;

  ctx.log('info', `Mitigation Execution - Success: ${incidentResolved}, Time: ${mitigationExecution.executionTime}s`);

  // Quality Gate: Mitigation verification
  if (!incidentResolved) {
    await ctx.breakpoint({
      question: `Mitigation for ${incidentId} not successful. Status: ${mitigationExecution.status}. Issues: ${mitigationExecution.issues.join(', ')}. Execute fallback strategy or rollback?`,
      title: 'Mitigation Failed - Decision Required',
      context: {
        runId: ctx.runId,
        incidentId,
        severity: actualSeverity,
        mitigationStatus: mitigationExecution.status,
        issues: mitigationExecution.issues,
        fallbackStrategy: mitigationExecution.fallbackStrategy,
        rollbackAvailable: mitigationExecution.rollbackAvailable,
        recommendation: 'Review mitigation results and choose next action',
        files: mitigationExecution.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 8: VERIFICATION AND MONITORING
  // ============================================================================

  ctx.log('info', 'Phase 8: Verifying mitigation and monitoring recovery');

  const verificationMonitoring = await ctx.task(verificationMonitoringTask, {
    incidentId,
    affectedServices,
    mitigationExecution,
    impactAssessment,
    outputDir
  });

  artifacts.push(...verificationMonitoring.artifacts);

  const systemStable = verificationMonitoring.systemStable;

  ctx.log('info', `Verification Complete - System Stable: ${systemStable}, Health Score: ${verificationMonitoring.healthScore}`);

  // Quality Gate: System stability verification
  if (!systemStable) {
    await ctx.breakpoint({
      question: `System not stable after mitigation for ${incidentId}. Health Score: ${verificationMonitoring.healthScore}/100. Unstable services: ${verificationMonitoring.unstableServices.join(', ')}. Continue monitoring or re-investigate?`,
      title: 'System Stability Verification',
      context: {
        runId: ctx.runId,
        incidentId,
        healthScore: verificationMonitoring.healthScore,
        unstableServices: verificationMonitoring.unstableServices,
        stabilityIssues: verificationMonitoring.stabilityIssues,
        recommendation: 'Monitor for additional time or re-investigate if degradation continues',
        files: verificationMonitoring.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 9: CUSTOMER COMMUNICATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Managing customer communications');

  const customerCommunication = await ctx.task(customerCommunicationTask, {
    incidentId,
    severity: actualSeverity,
    customerFacing,
    impactAssessment,
    incidentResolved,
    rootCauseInvestigation,
    outputDir
  });

  artifacts.push(...customerCommunication.artifacts);

  // ============================================================================
  // PHASE 10: INCIDENT RESOLUTION AND DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Resolving incident and documenting timeline');

  const incidentResolution = await ctx.task(incidentResolutionTask, {
    incidentId,
    severity: actualSeverity,
    startTime,
    incidentDetection,
    rootCauseInvestigation,
    mitigationStrategy,
    mitigationExecution,
    verificationMonitoring,
    customerCommunication,
    incidentManagementTool,
    outputDir
  });

  artifacts.push(...incidentResolution.artifacts);

  mttr = incidentResolution.mttr;

  ctx.log('info', `Incident Resolved - MTTR: ${mttr}s (${(mttr / 60).toFixed(1)} minutes)`);

  // ============================================================================
  // PHASE 11: ACTION ITEMS AND FOLLOW-UPS
  // ============================================================================

  ctx.log('info', 'Phase 11: Identifying action items and follow-ups');

  const actionItems = await ctx.task(actionItemsTask, {
    incidentId,
    severity: actualSeverity,
    rootCauseInvestigation,
    mitigationStrategy,
    verificationMonitoring,
    incidentResolution,
    outputDir
  });

  artifacts.push(...actionItems.artifacts);

  ctx.log('info', `Action Items Identified - Total: ${actionItems.actionItemsList.length}, Priority: ${actionItems.priorityCount.high} high, ${actionItems.priorityCount.medium} medium`);

  // ============================================================================
  // PHASE 12: POSTMORTEM GENERATION (if required)
  // ============================================================================

  let postmortem = null;
  const requiresPostmortem = postmortemRequired !== null ? postmortemRequired : (actualSeverity === 'SEV-1' || actualSeverity === 'SEV-2');

  if (requiresPostmortem) {
    ctx.log('info', 'Phase 12: Generating postmortem document');

    postmortem = await ctx.task(postmortemTask, {
      incidentId,
      severity: actualSeverity,
      incidentType,
      affectedServices,
      startTime,
      mttr,
      incidentDetection,
      impactAssessment,
      rootCauseInvestigation,
      mitigationStrategy,
      mitigationExecution,
      verificationMonitoring,
      customerCommunication,
      incidentResolution,
      actionItems,
      outputDir
    });

    artifacts.push(...postmortem.artifacts);

    // Quality Gate: Postmortem review
    await ctx.breakpoint({
      question: `Postmortem for ${incidentId} generated. Review postmortem document, validate timeline, root cause, and action items before sharing with stakeholders?`,
      title: 'Postmortem Review',
      context: {
        runId: ctx.runId,
        incidentId,
        severity: actualSeverity,
        mttr,
        summary: postmortem.executiveSummary,
        rootCause: postmortem.rootCause,
        actionItemsCount: actionItems.actionItemsList.length,
        lessonsLearned: postmortem.lessonsLearned,
        files: [
          { path: postmortem.postmortemPath, format: 'markdown', label: 'Postmortem Document' },
          { path: incidentResolution.timelinePath, format: 'json', label: 'Incident Timeline' },
          { path: actionItems.actionItemsPath, format: 'markdown', label: 'Action Items' }
        ]
      }
    });
  }

  // ============================================================================
  // PHASE 13: METRICS AND REPORTING
  // ============================================================================

  ctx.log('info', 'Phase 13: Computing incident metrics and generating report');

  const metricsReporting = await ctx.task(metricsReportingTask, {
    incidentId,
    severity: actualSeverity,
    incidentType,
    affectedServices,
    startTime,
    mttr,
    incidentDetection,
    impactAssessment,
    rootCauseInvestigation,
    mitigationExecution,
    verificationMonitoring,
    actionItems,
    outputDir
  });

  artifacts.push(...metricsReporting.artifacts);

  // Final Breakpoint: Incident Response Complete
  await ctx.breakpoint({
    question: `Incident Response Complete for ${incidentId}. MTTR: ${(mttr / 60).toFixed(1)} minutes. Incident resolved: ${incidentResolved}. System stable: ${systemStable}. Close incident?`,
    title: 'Final Incident Response Review',
    context: {
      runId: ctx.runId,
      summary: {
        incidentId,
        severity: actualSeverity,
        incidentType,
        affectedServices,
        mttr: `${(mttr / 60).toFixed(1)} minutes`,
        incidentResolved,
        systemStable,
        customersAffected: impactAssessment.customersAffected,
        businessImpact: impactAssessment.businessImpact,
        rootCauseIdentified,
        actionItemsCount: actionItems.actionItemsList.length,
        postmortemGenerated: requiresPostmortem
      },
      metrics: metricsReporting.metrics,
      recommendation: metricsReporting.recommendation,
      files: [
        { path: incidentResolution.resolutionPath, format: 'json', label: 'Incident Resolution Summary' },
        { path: metricsReporting.reportPath, format: 'markdown', label: 'Incident Report' },
        { path: actionItems.actionItemsPath, format: 'markdown', label: 'Action Items' },
        ...(postmortem ? [{ path: postmortem.postmortemPath, format: 'markdown', label: 'Postmortem' }] : [])
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
    affectedServices,
    alertSource,
    resolution: {
      resolved: incidentResolved,
      systemStable,
      rootCause: rootCauseInvestigation.rootCause,
      rootCauseConfidence: rootCauseInvestigation.rootCauseConfidence,
      mitigationStrategy: mitigationStrategy.primaryStrategy,
      mitigationSuccessful: mitigationExecution.mitigationSuccessful
    },
    impact: {
      customersAffected: impactAssessment.customersAffected,
      businessImpact: impactAssessment.businessImpact,
      estimatedRevenueImpact: impactAssessment.estimatedRevenueImpact,
      customerFacing
    },
    timeline: {
      detectedAt: incidentDetection.detectedAt,
      declaredAt: incidentDeclaration.declaredAt,
      mitigatedAt: mitigationExecution.mitigatedAt,
      resolvedAt: incidentResolution.resolvedAt,
      mttr,
      mttrMinutes: (mttr / 60).toFixed(1)
    },
    team: {
      incidentCommander: incidentDeclaration.incidentCommander,
      techLead: incidentDeclaration.techLead,
      commsLead: incidentDeclaration.commsLead,
      warRoomUrl: incidentDeclaration.warRoomUrl
    },
    actionItems: actionItems.actionItemsList.map(item => ({
      priority: item.priority,
      category: item.category,
      description: item.description,
      owner: item.owner,
      dueDate: item.dueDate
    })),
    postmortem: postmortem ? {
      generated: true,
      postmortemPath: postmortem.postmortemPath,
      executiveSummary: postmortem.executiveSummary,
      lessonsLearned: postmortem.lessonsLearned
    } : null,
    metrics: {
      detectionTime: incidentDetection.detectionTime,
      investigationTime: rootCauseInvestigation.investigationTime,
      mitigationTime: mitigationExecution.executionTime,
      verificationTime: verificationMonitoring.verificationTime,
      totalMTTR: mttr,
      healthScore: verificationMonitoring.healthScore
    },
    artifacts,
    incidentReport: {
      reportPath: metricsReporting.reportPath,
      resolutionPath: incidentResolution.resolutionPath,
      timelinePath: incidentResolution.timelinePath
    },
    duration: totalDuration,
    metadata: {
      processId: 'specializations/devops-sre-platform/incident-response',
      timestamp: startTime,
      incidentManagementTool,
      communicationChannel,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: Incident Detection
export const incidentDetectionTask = defineTask('incident-detection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Incident Detection - ${args.incidentId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Site Reliability Engineer',
      task: 'Detect and analyze incident alert to determine severity and initial impact',
      context: {
        incidentId: args.incidentId,
        incidentType: args.incidentType,
        severity: args.severity,
        affectedServices: args.affectedServices,
        alertSource: args.alertSource,
        description: args.description,
        customerFacing: args.customerFacing,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Parse and validate incident alert details',
        '2. Determine incident type (service outage, performance degradation, security breach, data loss)',
        '3. Identify affected services and dependencies',
        '4. Assess initial impact level (isolated, multiple services, platform-wide)',
        '5. Recommend severity classification (SEV-1: critical outage, SEV-2: major degradation, SEV-3: minor issue, SEV-4: low impact)',
        '6. Determine if incident is customer-facing',
        '7. Calculate alert detection time',
        '8. Identify relevant monitoring dashboards and runbooks',
        '9. Create initial incident record',
        '10. Document detection details'
      ],
      outputFormat: 'JSON object with incident detection details'
    },
    outputSchema: {
      type: 'object',
      required: ['detectedAt', 'severityRecommendation', 'impactLevel', 'artifacts'],
      properties: {
        detectedAt: { type: 'string', description: 'ISO timestamp when incident was detected' },
        severityRecommendation: { type: 'string', enum: ['SEV-1', 'SEV-2', 'SEV-3', 'SEV-4'] },
        impactLevel: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
        detectionTime: { type: 'number', description: 'Seconds from incident start to detection' },
        affectedServicesConfirmed: { type: 'array', items: { type: 'string' } },
        dependentServices: { type: 'array', items: { type: 'string' } },
        monitoringDashboards: { type: 'array', items: { type: 'string' } },
        relevantRunbooks: { type: 'array', items: { type: 'string' } },
        customerFacingConfirmed: { type: 'boolean' },
        initialHypothesis: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'incident-response', 'detection']
}));

// Phase 2: Incident Declaration
export const incidentDeclarationTask = defineTask('incident-declaration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Incident Declaration - ${args.incidentId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Incident Commander',
      task: 'Declare incident and mobilize response team',
      context: {
        incidentId: args.incidentId,
        incidentType: args.incidentType,
        severity: args.severity,
        affectedServices: args.affectedServices,
        description: args.description,
        incidentDetection: args.incidentDetection,
        onCallTeam: args.onCallTeam,
        incidentManagementTool: args.incidentManagementTool,
        communicationChannel: args.communicationChannel,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create incident in incident management tool (PagerDuty, Opsgenie)',
        '2. Assign Incident Commander role',
        '3. Assign Technical Lead role',
        '4. Assign Communications Lead role (for SEV-1/SEV-2)',
        '5. Assign Scribe role to document actions',
        '6. Page on-call team based on severity',
        '7. Create dedicated incident war room (Slack channel, Zoom)',
        '8. Set up incident status page if customer-facing',
        '9. Notify stakeholders based on severity (executives for SEV-1)',
        '10. Document declaration time and team roster'
      ],
      outputFormat: 'JSON object with incident declaration details'
    },
    outputSchema: {
      type: 'object',
      required: ['declaredAt', 'teamMobilized', 'incidentCommander', 'artifacts'],
      properties: {
        declaredAt: { type: 'string', description: 'ISO timestamp when incident was declared' },
        teamMobilized: { type: 'boolean' },
        incidentCommander: { type: 'string' },
        techLead: { type: 'string' },
        commsLead: { type: 'string' },
        scribe: { type: 'string' },
        warRoomUrl: { type: 'string', description: 'URL to incident war room/channel' },
        statusPageCreated: { type: 'boolean' },
        stakeholdersNotified: { type: 'array', items: { type: 'string' } },
        missingRoles: { type: 'array', items: { type: 'string' } },
        incidentUrl: { type: 'string', description: 'URL to incident in management tool' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'incident-response', 'declaration']
}));

// Phase 3: Impact Assessment
export const impactAssessmentTask = defineTask('impact-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Impact Assessment - ${args.incidentId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SRE Analyst',
      task: 'Assess business and customer impact of incident',
      context: {
        incidentId: args.incidentId,
        severity: args.severity,
        affectedServices: args.affectedServices,
        incidentDetection: args.incidentDetection,
        customerFacing: args.customerFacing,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Calculate number of affected customers/users',
        '2. Assess geographic distribution of impact',
        '3. Identify affected critical user journeys (login, checkout, payment)',
        '4. Estimate revenue impact ($/hour for SEV-1)',
        '5. Assess impact on SLAs and SLOs',
        '6. Identify regulatory or compliance implications',
        '7. Assess reputation and brand impact',
        '8. Calculate error rates and success rates',
        '9. Determine partial vs. complete service degradation',
        '10. Create impact assessment report'
      ],
      outputFormat: 'JSON object with impact assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['customersAffected', 'businessImpact', 'artifacts'],
      properties: {
        customersAffected: { type: 'number' },
        affectedRegions: { type: 'array', items: { type: 'string' } },
        criticalJourneysImpacted: { type: 'array', items: { type: 'string' } },
        estimatedRevenueImpact: { type: 'string', description: 'e.g., "$10K/hour"' },
        businessImpact: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
        sloViolations: { type: 'array', items: { type: 'object' } },
        complianceImplications: { type: 'array', items: { type: 'string' } },
        reputationRisk: { type: 'string', enum: ['high', 'medium', 'low'] },
        errorRate: { type: 'number', description: 'Current error rate percentage' },
        successRate: { type: 'number', description: 'Current success rate percentage' },
        degradationType: { type: 'string', enum: ['complete-outage', 'partial-degradation', 'intermittent'] },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'incident-response', 'impact-assessment']
}));

// Phase 4.1: Log Analysis
export const logAnalysisTask = defineTask('log-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Log Analysis - ${args.incidentId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Log Analysis Engineer',
      task: 'Analyze application and system logs for incident investigation',
      context: {
        incidentId: args.incidentId,
        affectedServices: args.affectedServices,
        startTime: args.startTime,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Query logs from affected services (last 1 hour)',
        '2. Identify error patterns and stack traces',
        '3. Find first occurrence of errors',
        '4. Analyze error frequency and trends',
        '5. Identify correlated events across services',
        '6. Extract relevant error messages and codes',
        '7. Identify recent deployments or changes',
        '8. Analyze resource-related warnings (OOM, disk full)',
        '9. Create timeline of significant log events',
        '10. Generate log analysis report'
      ],
      outputFormat: 'JSON object with log analysis findings'
    },
    outputSchema: {
      type: 'object',
      required: ['errorPatternsFound', 'findings', 'artifacts'],
      properties: {
        errorPatternsFound: { type: 'boolean' },
        errorPatterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string' },
              service: { type: 'string' },
              frequency: { type: 'number' },
              firstOccurrence: { type: 'string' }
            }
          }
        },
        findings: { type: 'array', items: { type: 'string' } },
        recentDeployments: { type: 'array', items: { type: 'object' } },
        correlatedEvents: { type: 'array', items: { type: 'object' } },
        criticalErrors: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'incident-response', 'investigation', 'logs']
}));

// Phase 4.2: Metrics Analysis
export const metricsAnalysisTask = defineTask('metrics-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Metrics Analysis - ${args.incidentId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Observability Engineer',
      task: 'Analyze system and application metrics for anomalies',
      context: {
        incidentId: args.incidentId,
        affectedServices: args.affectedServices,
        startTime: args.startTime,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Query metrics from Prometheus/CloudWatch for affected services',
        '2. Analyze request rate trends (sudden drops or spikes)',
        '3. Analyze error rate trends (4xx, 5xx)',
        '4. Analyze latency metrics (p95, p99)',
        '5. Check resource utilization (CPU, memory, disk, network)',
        '6. Identify saturation points (connection pools, threads)',
        '7. Compare current metrics to baseline',
        '8. Detect anomalies using statistical analysis',
        '9. Correlate metric changes with timeline',
        '10. Generate metrics analysis report with graphs'
      ],
      outputFormat: 'JSON object with metrics analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['anomaliesDetected', 'findings', 'artifacts'],
      properties: {
        anomaliesDetected: { type: 'boolean' },
        anomalies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              service: { type: 'string' },
              anomalyType: { type: 'string', enum: ['spike', 'drop', 'saturation', 'high-variance'] },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              startedAt: { type: 'string' }
            }
          }
        },
        currentMetrics: {
          type: 'object',
          properties: {
            requestRate: { type: 'number' },
            errorRate: { type: 'number' },
            latencyP95: { type: 'number' },
            latencyP99: { type: 'number' },
            cpuUsage: { type: 'number' },
            memoryUsage: { type: 'number' }
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
  labels: ['agent', 'incident-response', 'investigation', 'metrics']
}));

// Phase 4.3: Trace Analysis
export const traceAnalysisTask = defineTask('trace-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Distributed Trace Analysis - ${args.incidentId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Distributed Systems Engineer',
      task: 'Analyze distributed traces to identify slow or failing service calls',
      context: {
        incidentId: args.incidentId,
        affectedServices: args.affectedServices,
        startTime: args.startTime,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Query traces from Jaeger/Zipkin/X-Ray for affected services',
        '2. Identify failed or slow traces',
        '3. Analyze request flow across services',
        '4. Identify slowest spans and bottlenecks',
        '5. Detect timeout or connection errors',
        '6. Identify failing downstream dependencies',
        '7. Analyze retry patterns and cascading failures',
        '8. Compare trace patterns to normal baseline',
        '9. Extract example traces showing failures',
        '10. Generate trace analysis report'
      ],
      outputFormat: 'JSON object with trace analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['issuesFound', 'findings', 'artifacts'],
      properties: {
        issuesFound: { type: 'boolean' },
        slowSpans: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              service: { type: 'string' },
              operation: { type: 'string' },
              duration: { type: 'number', description: 'Milliseconds' }
            }
          }
        },
        failingDependencies: { type: 'array', items: { type: 'string' } },
        cascadingFailures: { type: 'boolean' },
        exampleFailedTraces: { type: 'array', items: { type: 'string' } },
        findings: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'incident-response', 'investigation', 'traces']
}));

// Phase 5: Root Cause Investigation
export const rootCauseInvestigationTask = defineTask('root-cause-investigation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Root Cause Investigation - ${args.incidentId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior SRE / Root Cause Analyst',
      task: 'Investigate root cause using observability data and runbooks',
      context: {
        incidentId: args.incidentId,
        incidentType: args.incidentType,
        affectedServices: args.affectedServices,
        logAnalysis: args.logAnalysis,
        metricsAnalysis: args.metricsAnalysis,
        traceAnalysis: args.traceAnalysis,
        impactAssessment: args.impactAssessment,
        runbookUrl: args.runbookUrl,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Synthesize findings from logs, metrics, and traces',
        '2. Follow relevant runbook procedures if available',
        '3. Develop hypotheses for root cause',
        '4. Prioritize hypotheses by likelihood',
        '5. Test hypotheses using additional investigation',
        '6. Apply 5 Whys analysis to drill down',
        '7. Identify triggering event or change',
        '8. Determine primary vs. contributing factors',
        '9. Assess confidence level in root cause (0-1)',
        '10. Document investigation steps and findings'
      ],
      outputFormat: 'JSON object with root cause investigation'
    },
    outputSchema: {
      type: 'object',
      required: ['rootCause', 'rootCauseConfidence', 'hypotheses', 'findings', 'artifacts'],
      properties: {
        rootCause: { type: 'string', description: 'Identified root cause' },
        rootCauseConfidence: { type: 'number', minimum: 0, maximum: 1 },
        rootCauseCategory: { type: 'string', enum: ['code-bug', 'configuration', 'infrastructure', 'dependency', 'capacity', 'human-error', 'unknown'] },
        triggeringEvent: { type: 'string', description: 'What triggered the incident' },
        contributingFactors: { type: 'array', items: { type: 'string' } },
        hypotheses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              hypothesis: { type: 'string' },
              likelihood: { type: 'string', enum: ['high', 'medium', 'low'] },
              tested: { type: 'boolean' },
              result: { type: 'string' }
            }
          }
        },
        investigationSteps: { type: 'array', items: { type: 'string' } },
        investigationTime: { type: 'number', description: 'Seconds spent investigating' },
        findings: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'incident-response', 'root-cause']
}));

// Phase 6: Mitigation Strategy
export const mitigationStrategyTask = defineTask('mitigation-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Mitigation Strategy - ${args.incidentId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Incident Response Engineer',
      task: 'Develop mitigation strategy to restore service',
      context: {
        incidentId: args.incidentId,
        severity: args.severity,
        rootCauseInvestigation: args.rootCauseInvestigation,
        affectedServices: args.affectedServices,
        impactAssessment: args.impactAssessment,
        automatedMitigation: args.automatedMitigation,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Develop primary mitigation strategy based on root cause',
        '2. Common strategies: rollback deployment, restart services, scale resources, toggle feature flags, failover to backup',
        '3. Define detailed mitigation steps',
        '4. Estimate mitigation duration',
        '5. Assess risk level of mitigation (low, medium, high)',
        '6. Develop rollback plan in case mitigation fails',
        '7. Develop fallback strategy',
        '8. Determine if approval required (based on risk and severity)',
        '9. Identify automation opportunities',
        '10. Document mitigation strategy'
      ],
      outputFormat: 'JSON object with mitigation strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['primaryStrategy', 'mitigationSteps', 'requiresApproval', 'artifacts'],
      properties: {
        primaryStrategy: { type: 'string', description: 'Primary mitigation approach' },
        strategyType: { type: 'string', enum: ['rollback', 'restart', 'scale', 'failover', 'feature-toggle', 'configuration-change', 'manual-fix'] },
        mitigationSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'number' },
              action: { type: 'string' },
              command: { type: 'string' },
              expectedResult: { type: 'string' }
            }
          }
        },
        estimatedDuration: { type: 'string', description: 'e.g., "10 minutes"' },
        riskLevel: { type: 'string', enum: ['low', 'medium', 'high'] },
        requiresApproval: { type: 'boolean' },
        rollbackPlan: { type: 'string' },
        fallbackStrategy: { type: 'string' },
        canAutomate: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'incident-response', 'mitigation']
}));

// Phase 7: Mitigation Execution
export const mitigationExecutionTask = defineTask('mitigation-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Mitigation Execution - ${args.incidentId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Operations Engineer',
      task: 'Execute mitigation plan to restore service',
      context: {
        incidentId: args.incidentId,
        severity: args.severity,
        mitigationStrategy: args.mitigationStrategy,
        affectedServices: args.affectedServices,
        automatedMitigation: args.automatedMitigation,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Execute mitigation steps in order',
        '2. Document each action taken with timestamp',
        '3. Monitor system response after each step',
        '4. Check error rates and metrics during mitigation',
        '5. If automated mitigation available, execute safely',
        '6. Handle failures gracefully, execute fallback if needed',
        '7. Communicate progress to incident channel',
        '8. Verify mitigation success criteria',
        '9. Track execution time',
        '10. Document mitigation results'
      ],
      outputFormat: 'JSON object with mitigation execution results'
    },
    outputSchema: {
      type: 'object',
      required: ['mitigationSuccessful', 'status', 'executionTime', 'artifacts'],
      properties: {
        mitigationSuccessful: { type: 'boolean' },
        status: { type: 'string', enum: ['success', 'partial', 'failed', 'rollback-required'] },
        executedSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'number' },
              action: { type: 'string' },
              result: { type: 'string' },
              timestamp: { type: 'string' }
            }
          }
        },
        executionTime: { type: 'number', description: 'Seconds to execute mitigation' },
        mitigatedAt: { type: 'string', description: 'ISO timestamp when mitigation completed' },
        issues: { type: 'array', items: { type: 'string' } },
        fallbackStrategy: { type: 'string' },
        rollbackAvailable: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'incident-response', 'mitigation', 'execution']
}));

// Phase 8: Verification and Monitoring
export const verificationMonitoringTask = defineTask('verification-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Verification and Monitoring - ${args.incidentId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Monitoring Specialist',
      task: 'Verify mitigation success and monitor system stability',
      context: {
        incidentId: args.incidentId,
        affectedServices: args.affectedServices,
        mitigationExecution: args.mitigationExecution,
        impactAssessment: args.impactAssessment,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Monitor affected services for stability (15-30 minutes)',
        '2. Verify error rates returned to normal',
        '3. Verify latency metrics returned to baseline',
        '4. Verify request success rate is healthy (>99%)',
        '5. Check resource utilization is within normal range',
        '6. Verify no cascading issues in dependent services',
        '7. Run smoke tests on critical user journeys',
        '8. Calculate system health score (0-100)',
        '9. Identify any remaining unstable services',
        '10. Document verification results'
      ],
      outputFormat: 'JSON object with verification results'
    },
    outputSchema: {
      type: 'object',
      required: ['systemStable', 'healthScore', 'artifacts'],
      properties: {
        systemStable: { type: 'boolean' },
        healthScore: { type: 'number', minimum: 0, maximum: 100 },
        verificationTime: { type: 'number', description: 'Seconds spent monitoring' },
        metricsNormal: {
          type: 'object',
          properties: {
            errorRate: { type: 'boolean' },
            latency: { type: 'boolean' },
            throughput: { type: 'boolean' },
            resources: { type: 'boolean' }
          }
        },
        currentMetrics: {
          type: 'object',
          properties: {
            errorRate: { type: 'number' },
            latencyP95: { type: 'number' },
            successRate: { type: 'number' }
          }
        },
        smokeTestsPassed: { type: 'boolean' },
        unstableServices: { type: 'array', items: { type: 'string' } },
        stabilityIssues: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'incident-response', 'verification']
}));

// Phase 9: Customer Communication
export const customerCommunicationTask = defineTask('customer-communication', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Customer Communication - ${args.incidentId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Communications Lead',
      task: 'Manage customer communications and status updates',
      context: {
        incidentId: args.incidentId,
        severity: args.severity,
        customerFacing: args.customerFacing,
        impactAssessment: args.impactAssessment,
        incidentResolved: args.incidentResolved,
        rootCauseInvestigation: args.rootCauseInvestigation,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Determine if customer communication required (customer-facing incidents)',
        '2. Draft initial status page update (investigating)',
        '3. Provide regular updates every 30-60 minutes for SEV-1/SEV-2',
        '4. Use clear, non-technical language',
        '5. Draft update when mitigation applied (monitoring)',
        '6. Draft resolution message when incident resolved',
        '7. Include estimated time to resolution (ETR) if known',
        '8. Avoid premature commitments',
        '9. Prepare internal stakeholder updates',
        '10. Document all communications'
      ],
      outputFormat: 'JSON object with customer communication details'
    },
    outputSchema: {
      type: 'object',
      required: ['communicationsIssued', 'artifacts'],
      properties: {
        communicationsIssued: { type: 'number', description: 'Number of updates issued' },
        statusPageUpdates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              timestamp: { type: 'string' },
              status: { type: 'string', enum: ['investigating', 'identified', 'monitoring', 'resolved'] },
              message: { type: 'string' }
            }
          }
        },
        customerFacingRequired: { type: 'boolean' },
        internalUpdatesIssued: { type: 'number' },
        escalatedToExecutives: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'incident-response', 'communication']
}));

// Phase 10: Incident Resolution
export const incidentResolutionTask = defineTask('incident-resolution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Incident Resolution - ${args.incidentId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Incident Commander',
      task: 'Close incident and document resolution',
      context: {
        incidentId: args.incidentId,
        severity: args.severity,
        startTime: args.startTime,
        incidentDetection: args.incidentDetection,
        rootCauseInvestigation: args.rootCauseInvestigation,
        mitigationStrategy: args.mitigationStrategy,
        mitigationExecution: args.mitigationExecution,
        verificationMonitoring: args.verificationMonitoring,
        customerCommunication: args.customerCommunication,
        incidentManagementTool: args.incidentManagementTool,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Confirm system is stable and incident is resolved',
        '2. Calculate MTTR (Mean Time To Resolution)',
        '3. Calculate MTTD (Mean Time To Detection)',
        '4. Calculate MTTI (Mean Time To Investigation)',
        '5. Calculate MTTM (Mean Time To Mitigation)',
        '6. Create comprehensive incident timeline',
        '7. Document resolution summary',
        '8. Update incident status to resolved in management tool',
        '9. Close war room and incident channels',
        '10. Thank team members for their response'
      ],
      outputFormat: 'JSON object with incident resolution details'
    },
    outputSchema: {
      type: 'object',
      required: ['resolvedAt', 'mttr', 'timeline', 'resolutionPath', 'artifacts'],
      properties: {
        resolvedAt: { type: 'string', description: 'ISO timestamp when incident was resolved' },
        mttr: { type: 'number', description: 'Mean Time To Resolution in seconds' },
        mttd: { type: 'number', description: 'Mean Time To Detection in seconds' },
        mtti: { type: 'number', description: 'Mean Time To Investigation in seconds' },
        mttm: { type: 'number', description: 'Mean Time To Mitigation in seconds' },
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
        resolutionSummary: { type: 'string' },
        resolutionPath: { type: 'string' },
        timelinePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'incident-response', 'resolution']
}));

// Phase 11: Action Items
export const actionItemsTask = defineTask('action-items', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Action Items - ${args.incidentId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Process Improvement Lead',
      task: 'Identify action items and follow-ups to prevent recurrence',
      context: {
        incidentId: args.incidentId,
        severity: args.severity,
        rootCauseInvestigation: args.rootCauseInvestigation,
        mitigationStrategy: args.mitigationStrategy,
        verificationMonitoring: args.verificationMonitoring,
        incidentResolution: args.incidentResolution,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify immediate action items (hot fixes, temporary measures)',
        '2. Identify short-term improvements (1-2 weeks)',
        '3. Identify long-term improvements (1-3 months)',
        '4. Create action items for monitoring improvements',
        '5. Create action items for runbook updates',
        '6. Create action items for automation opportunities',
        '7. Create action items for architectural improvements',
        '8. Assign priority to each action item (critical, high, medium, low)',
        '9. Assign owners and due dates',
        '10. Track action items in project management tool (Jira)'
      ],
      outputFormat: 'JSON object with action items'
    },
    outputSchema: {
      type: 'object',
      required: ['actionItemsList', 'priorityCount', 'actionItemsPath', 'artifacts'],
      properties: {
        actionItemsList: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              category: { type: 'string', enum: ['code-fix', 'monitoring', 'automation', 'runbook', 'architecture', 'process'] },
              description: { type: 'string' },
              rationale: { type: 'string' },
              owner: { type: 'string' },
              dueDate: { type: 'string' },
              estimatedEffort: { type: 'string' }
            }
          }
        },
        priorityCount: {
          type: 'object',
          properties: {
            critical: { type: 'number' },
            high: { type: 'number' },
            medium: { type: 'number' },
            low: { type: 'number' }
          }
        },
        preventionMeasures: { type: 'array', items: { type: 'string' } },
        actionItemsPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'incident-response', 'action-items']
}));

// Phase 12: Postmortem
export const postmortemTask = defineTask('postmortem', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Postmortem Generation - ${args.incidentId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SRE / Technical Writer',
      task: 'Generate comprehensive blameless postmortem document',
      context: {
        incidentId: args.incidentId,
        severity: args.severity,
        incidentType: args.incidentType,
        affectedServices: args.affectedServices,
        startTime: args.startTime,
        mttr: args.mttr,
        incidentDetection: args.incidentDetection,
        impactAssessment: args.impactAssessment,
        rootCauseInvestigation: args.rootCauseInvestigation,
        mitigationStrategy: args.mitigationStrategy,
        mitigationExecution: args.mitigationExecution,
        verificationMonitoring: args.verificationMonitoring,
        customerCommunication: args.customerCommunication,
        incidentResolution: args.incidentResolution,
        actionItems: args.actionItems,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create blameless postmortem following best practices',
        '2. Include executive summary',
        '3. Document incident timeline',
        '4. Describe what happened (impact, scope, duration)',
        '5. Explain root cause analysis',
        '6. Describe contributing factors',
        '7. Document what went well',
        '8. Document what could be improved',
        '9. Include lessons learned',
        '10. List action items with owners',
        '11. Add supporting evidence (graphs, logs)',
        '12. Format as Markdown document'
      ],
      outputFormat: 'JSON object with postmortem details'
    },
    outputSchema: {
      type: 'object',
      required: ['postmortemPath', 'executiveSummary', 'rootCause', 'lessonsLearned', 'artifacts'],
      properties: {
        postmortemPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        rootCause: { type: 'string' },
        impactSummary: { type: 'string' },
        whatWentWell: { type: 'array', items: { type: 'string' } },
        whatCouldBeImproved: { type: 'array', items: { type: 'string' } },
        lessonsLearned: { type: 'array', items: { type: 'string' } },
        supportingEvidence: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'incident-response', 'postmortem']
}));

// Phase 13: Metrics and Reporting
export const metricsReportingTask = defineTask('metrics-reporting', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 13: Metrics and Reporting - ${args.incidentId}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SRE Metrics Analyst',
      task: 'Calculate incident metrics and generate final report',
      context: {
        incidentId: args.incidentId,
        severity: args.severity,
        incidentType: args.incidentType,
        affectedServices: args.affectedServices,
        startTime: args.startTime,
        mttr: args.mttr,
        incidentDetection: args.incidentDetection,
        impactAssessment: args.impactAssessment,
        rootCauseInvestigation: args.rootCauseInvestigation,
        mitigationExecution: args.mitigationExecution,
        verificationMonitoring: args.verificationMonitoring,
        actionItems: args.actionItems,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Calculate all incident metrics (MTTR, MTTD, MTTI, MTTM)',
        '2. Compare metrics to historical averages',
        '3. Calculate SLO impact (error budget consumed)',
        '4. Assess incident response effectiveness',
        '5. Identify response process improvements',
        '6. Generate executive incident report',
        '7. Create metrics dashboard',
        '8. Provide recommendations for improvement',
        '9. Track incident trends',
        '10. Document all metrics'
      ],
      outputFormat: 'JSON object with metrics and report'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'reportPath', 'recommendation', 'artifacts'],
      properties: {
        metrics: {
          type: 'object',
          properties: {
            mttr: { type: 'number', description: 'Mean Time To Resolution (seconds)' },
            mttd: { type: 'number', description: 'Mean Time To Detection (seconds)' },
            mtti: { type: 'number', description: 'Mean Time To Investigation (seconds)' },
            mttm: { type: 'number', description: 'Mean Time To Mitigation (seconds)' },
            errorBudgetConsumed: { type: 'number', description: 'Percentage of monthly error budget' },
            responseEffectiveness: { type: 'number', description: 'Score 0-100' }
          }
        },
        comparisonToAverage: {
          type: 'object',
          properties: {
            mttrComparison: { type: 'string', description: 'e.g., "20% faster than average"' },
            trend: { type: 'string', enum: ['improving', 'stable', 'degrading'] }
          }
        },
        reportPath: { type: 'string' },
        recommendation: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'incident-response', 'metrics', 'reporting']
}));
