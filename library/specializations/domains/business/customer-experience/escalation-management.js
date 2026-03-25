/**
 * @process customer-experience/escalation-management
 * @description Structured workflow for escalating complex issues through support tiers with clear handoff protocols and communication standards
 * @inputs { ticket: object, currentAgent: object, escalationReason: string, customerContext: object, targetTier: number }
 * @outputs { success: boolean, escalationRecord: object, handoffPackage: object, communicationPlan: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    ticket = {},
    currentAgent = {},
    escalationReason = '',
    customerContext = {},
    targetTier = 2,
    outputDir = 'escalation-output',
    urgencyLevel = 'standard'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Escalation Management for ticket: ${ticket.id || 'unknown'}`);

  // ============================================================================
  // PHASE 1: ESCALATION VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Validating escalation request');
  const escalationValidation = await ctx.task(escalationValidationTask, {
    ticket,
    currentAgent,
    escalationReason,
    targetTier,
    outputDir
  });

  artifacts.push(...escalationValidation.artifacts);

  // ============================================================================
  // PHASE 2: CASE DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Documenting case history and context');
  const caseDocumentation = await ctx.task(caseDocumentationTask, {
    ticket,
    currentAgent,
    escalationReason,
    customerContext,
    escalationValidation,
    outputDir
  });

  artifacts.push(...caseDocumentation.artifacts);

  // ============================================================================
  // PHASE 3: RECEIVING TEAM SELECTION
  // ============================================================================

  ctx.log('info', 'Phase 3: Selecting receiving team and agent');
  const teamSelection = await ctx.task(teamSelectionTask, {
    ticket,
    targetTier,
    caseDocumentation,
    urgencyLevel,
    outputDir
  });

  artifacts.push(...teamSelection.artifacts);

  // ============================================================================
  // PHASE 4: HANDOFF PACKAGE PREPARATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Preparing handoff package');
  const handoffPackage = await ctx.task(handoffPackageTask, {
    ticket,
    caseDocumentation,
    teamSelection,
    customerContext,
    outputDir
  });

  artifacts.push(...handoffPackage.artifacts);

  // ============================================================================
  // PHASE 5: CUSTOMER COMMUNICATION PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 5: Planning customer communication');
  const customerCommunication = await ctx.task(customerCommunicationTask, {
    ticket,
    customerContext,
    teamSelection,
    urgencyLevel,
    outputDir
  });

  artifacts.push(...customerCommunication.artifacts);

  // ============================================================================
  // PHASE 6: INTERNAL NOTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Preparing internal notifications');
  const internalNotification = await ctx.task(internalNotificationTask, {
    ticket,
    currentAgent,
    teamSelection,
    caseDocumentation,
    urgencyLevel,
    outputDir
  });

  artifacts.push(...internalNotification.artifacts);

  // ============================================================================
  // PHASE 7: ESCALATION QUALITY CHECK
  // ============================================================================

  ctx.log('info', 'Phase 7: Performing escalation quality check');
  const qualityCheck = await ctx.task(qualityCheckTask, {
    escalationValidation,
    caseDocumentation,
    teamSelection,
    handoffPackage,
    customerCommunication,
    internalNotification,
    outputDir
  });

  artifacts.push(...qualityCheck.artifacts);

  const qualityScore = qualityCheck.qualityScore;
  const escalationReady = qualityScore >= 85;

  await ctx.breakpoint({
    question: `Escalation prepared for ticket ${ticket.id}. Target: Tier ${targetTier}. Quality score: ${qualityScore}/100. ${escalationReady ? 'Ready to escalate!' : 'May need additional documentation.'} Proceed?`,
    title: 'Escalation Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        qualityScore,
        escalationReady,
        ticketId: ticket.id,
        targetTier,
        receivingTeam: teamSelection.selectedTeam,
        receivingAgent: teamSelection.selectedAgent?.name,
        escalationReason
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    qualityScore,
    escalationReady,
    escalationRecord: {
      ticketId: ticket.id,
      fromTier: currentAgent.tier || 1,
      toTier: targetTier,
      reason: escalationReason,
      timestamp: startTime,
      validation: escalationValidation.validationResult
    },
    handoffPackage: {
      summary: handoffPackage.summary,
      troubleshooting: handoffPackage.troubleshootingHistory,
      recommendations: handoffPackage.recommendations,
      attachments: handoffPackage.attachments
    },
    routing: {
      selectedTeam: teamSelection.selectedTeam,
      selectedAgent: teamSelection.selectedAgent,
      queue: teamSelection.queue
    },
    communicationPlan: {
      customerMessage: customerCommunication.message,
      internalNotifications: internalNotification.notifications,
      followUpSchedule: customerCommunication.followUpSchedule
    },
    artifacts,
    duration,
    metadata: {
      processId: 'customer-experience/escalation-management',
      timestamp: startTime,
      ticketId: ticket.id,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const escalationValidationTask = defineTask('escalation-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate escalation request',
  agent: {
    name: 'escalation-validator',
    prompt: {
      role: 'escalation management specialist',
      task: 'Validate that escalation is appropriate and meets criteria for the target tier',
      context: args,
      instructions: [
        'Review escalation criteria for target tier',
        'Validate that current tier troubleshooting is complete',
        'Verify escalation reason meets policy requirements',
        'Check for required documentation completion',
        'Assess if escalation can be avoided',
        'Identify any missing prerequisites',
        'Validate customer tier allows escalation path',
        'Document validation outcome',
        'Generate validation report'
      ],
      outputFormat: 'JSON with validationResult, criteriaChecks, missingPrerequisites, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['validationResult', 'criteriaChecks', 'artifacts'],
      properties: {
        validationResult: { type: 'string', enum: ['approved', 'conditional', 'rejected'] },
        criteriaChecks: { type: 'array', items: { type: 'object' } },
        missingPrerequisites: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'escalation', 'validation']
}));

export const caseDocumentationTask = defineTask('case-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document case history and context',
  agent: {
    name: 'case-documenter',
    prompt: {
      role: 'support documentation specialist',
      task: 'Create comprehensive case documentation for escalation handoff',
      context: args,
      instructions: [
        'Summarize customer issue and impact',
        'Document all troubleshooting steps attempted',
        'Record customer communications and sentiment',
        'Compile relevant logs and error messages',
        'Document system configurations checked',
        'List related tickets or known issues',
        'Record time invested and SLA status',
        'Capture customer expectations and urgency',
        'Generate case documentation package'
      ],
      outputFormat: 'JSON with issueSummary, troubleshootingHistory, communications, technicalData, timeline, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['issueSummary', 'troubleshootingHistory', 'artifacts'],
      properties: {
        issueSummary: { type: 'string' },
        troubleshootingHistory: { type: 'array', items: { type: 'object' } },
        communications: { type: 'array', items: { type: 'object' } },
        technicalData: { type: 'object' },
        timeline: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'escalation', 'documentation']
}));

export const teamSelectionTask = defineTask('team-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select receiving team and agent',
  agent: {
    name: 'team-selector',
    prompt: {
      role: 'escalation routing specialist',
      task: 'Select appropriate receiving team and agent for escalation',
      context: args,
      instructions: [
        'Identify specialized teams for issue type',
        'Check team availability and capacity',
        'Match issue complexity to team expertise',
        'Consider timezone and business hours',
        'Evaluate individual agent workload',
        'Check for agent-customer relationship history',
        'Apply escalation routing rules',
        'Select primary and backup assignments',
        'Generate team selection report'
      ],
      outputFormat: 'JSON with selectedTeam, selectedAgent, queue, backupAgent, routing reasoning, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedTeam', 'queue', 'artifacts'],
      properties: {
        selectedTeam: { type: 'string' },
        selectedAgent: { type: 'object' },
        queue: { type: 'string' },
        backupAgent: { type: 'object' },
        routingReasoning: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'escalation', 'routing']
}));

export const handoffPackageTask = defineTask('handoff-package', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare handoff package',
  agent: {
    name: 'handoff-preparer',
    prompt: {
      role: 'escalation handoff specialist',
      task: 'Prepare comprehensive handoff package for receiving team',
      context: args,
      instructions: [
        'Create executive summary of issue',
        'Compile complete troubleshooting history',
        'Organize technical evidence and logs',
        'Document customer context and business impact',
        'Include recommended next steps',
        'Attach relevant documentation and resources',
        'Highlight critical information',
        'Format for easy receiving team consumption',
        'Generate handoff package'
      ],
      outputFormat: 'JSON with summary, troubleshootingHistory, recommendations, attachments, criticalInfo, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'troubleshootingHistory', 'recommendations', 'artifacts'],
      properties: {
        summary: { type: 'string' },
        troubleshootingHistory: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        attachments: { type: 'array', items: { type: 'object' } },
        criticalInfo: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'escalation', 'handoff']
}));

export const customerCommunicationTask = defineTask('customer-communication', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan customer communication',
  agent: {
    name: 'communication-planner',
    prompt: {
      role: 'customer communication specialist',
      task: 'Plan customer communication about escalation and set expectations',
      context: args,
      instructions: [
        'Draft escalation notification message',
        'Explain what escalation means for resolution',
        'Set realistic expectations on timeline',
        'Introduce receiving team or agent',
        'Provide updated contact information',
        'Schedule follow-up communications',
        'Address any customer concerns proactively',
        'Maintain relationship continuity',
        'Generate communication plan'
      ],
      outputFormat: 'JSON with message, expectations, followUpSchedule, contactInfo, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['message', 'followUpSchedule', 'artifacts'],
      properties: {
        message: { type: 'string' },
        expectations: { type: 'object' },
        followUpSchedule: { type: 'array', items: { type: 'object' } },
        contactInfo: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'escalation', 'communication']
}));

export const internalNotificationTask = defineTask('internal-notification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare internal notifications',
  agent: {
    name: 'notification-preparer',
    prompt: {
      role: 'internal communications specialist',
      task: 'Prepare internal notifications for escalation stakeholders',
      context: args,
      instructions: [
        'Notify receiving team of incoming escalation',
        'Alert relevant managers if needed',
        'Update account team if strategic customer',
        'Notify CSM for health score impact',
        'Log escalation in tracking systems',
        'Set up monitoring alerts',
        'Schedule handoff meeting if needed',
        'Document notification recipients',
        'Generate notification package'
      ],
      outputFormat: 'JSON with notifications, recipients, alerts, meetings, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['notifications', 'recipients', 'artifacts'],
      properties: {
        notifications: { type: 'array', items: { type: 'object' } },
        recipients: { type: 'array', items: { type: 'object' } },
        alerts: { type: 'array', items: { type: 'object' } },
        meetings: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'escalation', 'notification']
}));

export const qualityCheckTask = defineTask('quality-check', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform escalation quality check',
  agent: {
    name: 'quality-checker',
    prompt: {
      role: 'escalation quality specialist',
      task: 'Verify escalation package quality and completeness',
      context: args,
      instructions: [
        'Verify validation criteria met (weight: 15%)',
        'Check documentation completeness (weight: 25%)',
        'Validate team selection appropriateness (weight: 20%)',
        'Review handoff package quality (weight: 25%)',
        'Assess communication plan adequacy (weight: 10%)',
        'Verify notification coverage (weight: 5%)',
        'Calculate overall quality score',
        'Identify gaps or missing elements',
        'Generate quality check report'
      ],
      outputFormat: 'JSON with qualityScore, componentScores, gaps, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['qualityScore', 'componentScores', 'artifacts'],
      properties: {
        qualityScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: { type: 'object' },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'escalation', 'quality-check']
}));
