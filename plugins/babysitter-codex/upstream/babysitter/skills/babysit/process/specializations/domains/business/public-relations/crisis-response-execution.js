/**
 * @process specializations/domains/business/public-relations/crisis-response-execution
 * @description Implement rapid response protocols including situation assessment, message development, stakeholder prioritization, and coordinated multi-channel communications within critical first hours
 * @specialization Public Relations and Communications
 * @category Crisis Communications
 * @inputs { crisis: object, crisisPlan: object, initialAssessment: object, availableSpokespersons: object[] }
 * @outputs { success: boolean, responseActions: object[], communicationsSent: object[], status: object, quality: number }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    crisis,
    crisisPlan,
    initialAssessment = {},
    availableSpokespersons = [],
    targetQuality = 85
  } = inputs;

  // Phase 1: Rapid Situation Assessment (First 15 Minutes)
  await ctx.breakpoint({
    question: 'CRISIS ALERT: Beginning rapid situation assessment. Evaluate severity and facts?',
    title: 'Phase 1: Rapid Assessment',
    context: {
      runId: ctx.runId,
      phase: 'rapid-assessment',
      crisis: crisis.type,
      reportedAt: crisis.timestamp
    }
  });

  const situationAssessment = await ctx.task(conductRapidAssessmentTask, {
    crisis,
    initialAssessment,
    crisisPlan
  });

  // Phase 2: Team Activation
  await ctx.breakpoint({
    question: `Severity: ${situationAssessment.severity}. Activate crisis team per protocol?`,
    title: 'Phase 2: Team Activation',
    context: {
      runId: ctx.runId,
      phase: 'team-activation',
      severity: situationAssessment.severity
    }
  });

  const teamActivation = await ctx.task(activateCrisisTeamTask, {
    situationAssessment,
    crisisPlan,
    availableSpokespersons
  });

  // Phase 3: Stakeholder Prioritization
  await ctx.breakpoint({
    question: 'Team activated. Prioritize stakeholder notifications?',
    title: 'Phase 3: Stakeholder Prioritization',
    context: {
      runId: ctx.runId,
      phase: 'stakeholder-prioritization',
      teamMembers: teamActivation.activatedMembers.length
    }
  });

  const stakeholderPrioritization = await ctx.task(prioritizeStakeholdersTask, {
    situationAssessment,
    crisisPlan
  });

  // Phase 4: Message Development (First 30 Minutes)
  await ctx.breakpoint({
    question: 'Stakeholders prioritized. Develop initial response messages?',
    title: 'Phase 4: Message Development',
    context: {
      runId: ctx.runId,
      phase: 'message-development',
      priorityStakeholders: stakeholderPrioritization.priority1.length
    }
  });

  const [coreMessages, channelMessages] = await Promise.all([
    ctx.task(developCoreMessagesTask, {
      situationAssessment,
      crisisPlan,
      stakeholderPrioritization
    }),
    ctx.task(adaptMessagesForChannelsTask, {
      situationAssessment,
      crisisPlan,
      stakeholderPrioritization
    })
  ]);

  // Phase 5: Legal and Compliance Review
  await ctx.breakpoint({
    question: 'Messages drafted. Conduct rapid legal/compliance review?',
    title: 'Phase 5: Legal Review',
    context: {
      runId: ctx.runId,
      phase: 'legal-review',
      messagesCount: coreMessages.messages.length
    }
  });

  const legalReview = await ctx.task(conductLegalReviewTask, {
    coreMessages,
    channelMessages,
    situationAssessment
  });

  // Phase 6: Message Approval
  await ctx.breakpoint({
    question: 'Legal review complete. Obtain executive approval for communications?',
    title: 'Phase 6: Message Approval',
    context: {
      runId: ctx.runId,
      phase: 'message-approval',
      legalIssues: legalReview.issues.length
    }
  });

  const approvedMessages = await ctx.task(obtainMessageApprovalTask, {
    coreMessages: legalReview.approvedMessages,
    channelMessages: legalReview.approvedChannelMessages,
    teamActivation
  });

  // Phase 7: Multi-Channel Communication Execution (First Hour)
  await ctx.breakpoint({
    question: 'Messages approved. Execute coordinated multi-channel communications?',
    title: 'Phase 7: Communication Execution',
    context: {
      runId: ctx.runId,
      phase: 'communication-execution',
      approvedMessages: approvedMessages.messages.length
    }
  });

  const communicationExecution = await ctx.task(executeMultiChannelCommsTask, {
    approvedMessages,
    stakeholderPrioritization,
    channelMessages: legalReview.approvedChannelMessages
  });

  // Phase 8: Media Response Coordination
  await ctx.breakpoint({
    question: 'Initial communications sent. Coordinate media response?',
    title: 'Phase 8: Media Response',
    context: {
      runId: ctx.runId,
      phase: 'media-response',
      communicationsSent: communicationExecution.sent.length
    }
  });

  const mediaResponse = await ctx.task(coordinateMediaResponseTask, {
    situationAssessment,
    approvedMessages,
    availableSpokespersons,
    communicationExecution
  });

  // Phase 9: Monitoring and Status Update
  await ctx.breakpoint({
    question: 'Media response coordinated. Establish monitoring and update protocols?',
    title: 'Phase 9: Monitoring Setup',
    context: {
      runId: ctx.runId,
      phase: 'monitoring-setup'
    }
  });

  const [monitoringSetup, statusReport] = await Promise.all([
    ctx.task(setupCrisisMonitoringTask, {
      crisis,
      situationAssessment,
      communicationExecution
    }),
    ctx.task(generateStatusReportTask, {
      situationAssessment,
      teamActivation,
      communicationExecution,
      mediaResponse
    })
  ]);

  // Phase 10: Response Quality Assessment
  const qualityResult = await ctx.task(assessResponseQualityTask, {
    situationAssessment,
    teamActivation,
    coreMessages,
    communicationExecution,
    mediaResponse,
    targetQuality
  });

  const quality = qualityResult.score;

  return {
    success: quality >= targetQuality,
    responseActions: [
      { phase: 'assessment', action: 'Rapid situation assessment', status: 'complete', time: situationAssessment.assessmentTime },
      { phase: 'activation', action: 'Crisis team activation', status: 'complete', membersActivated: teamActivation.activatedMembers.length },
      { phase: 'messages', action: 'Message development and approval', status: 'complete', messagesApproved: approvedMessages.messages.length },
      { phase: 'communications', action: 'Multi-channel communications', status: 'complete', sent: communicationExecution.sent.length },
      { phase: 'media', action: 'Media response coordination', status: mediaResponse.status }
    ],
    communicationsSent: communicationExecution.sent,
    status: {
      severity: situationAssessment.severity,
      currentPhase: statusReport.currentPhase,
      nextActions: statusReport.nextActions,
      monitoring: monitoringSetup.status
    },
    mediaStatus: mediaResponse.summary,
    quality,
    targetQuality,
    recommendations: qualityResult.recommendations,
    metadata: {
      processId: 'specializations/domains/business/public-relations/crisis-response-execution',
      timestamp: ctx.now(),
      crisisId: crisis.id,
      responseTimeMinutes: statusReport.elapsedMinutes
    }
  };
}

// Task Definitions

export const conductRapidAssessmentTask = defineTask('conduct-rapid-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct Rapid Situation Assessment',
  agent: {
    name: 'rapid-assessor',
    prompt: {
      role: 'Crisis assessment specialist conducting rapid situation evaluation',
      task: 'Conduct rapid situation assessment within first 15 minutes',
      context: args,
      instructions: [
        'Gather known facts and separate from speculation',
        'Identify information gaps and unknowns',
        'Assess severity using crisis plan matrix',
        'Determine crisis type (victim, accidental, preventable)',
        'Identify immediate risks and potential escalation',
        'Assess media and public awareness level',
        'Determine regulatory notification requirements',
        'Identify key stakeholders immediately affected',
        'Recommend initial response posture'
      ],
      outputFormat: 'JSON with facts, unknowns, severity, crisisType, risks, mediaAwareness, regulatoryTriggers, affectedStakeholders, responsePosure, assessmentTime'
    },
    outputSchema: {
      type: 'object',
      required: ['facts', 'severity', 'crisisType'],
      properties: {
        facts: { type: 'array', items: { type: 'string' } },
        unknowns: { type: 'array', items: { type: 'string' } },
        severity: { type: 'string' },
        crisisType: { type: 'string' },
        risks: { type: 'array', items: { type: 'object' } },
        mediaAwareness: { type: 'string' },
        regulatoryTriggers: { type: 'array', items: { type: 'object' } },
        affectedStakeholders: { type: 'array', items: { type: 'string' } },
        responsePosture: { type: 'string' },
        assessmentTime: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'rapid-assessment']
}));

export const activateCrisisTeamTask = defineTask('activate-crisis-team', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Activate Crisis Team',
  agent: {
    name: 'team-activator',
    prompt: {
      role: 'Crisis operations coordinator activating response team',
      task: 'Activate crisis team per severity level and protocols',
      context: args,
      instructions: [
        'Identify required team members per severity level',
        'Initiate team notification via established channels',
        'Confirm team member availability and response',
        'Identify backups for unavailable members',
        'Establish crisis command location (physical or virtual)',
        'Set up communication channels for team',
        'Assign spokesperson based on availability',
        'Document team activation time and roster'
      ],
      outputFormat: 'JSON with activatedMembers, unavailable, backups, commandLocation, communicationChannel, spokesperson, activationTime'
    },
    outputSchema: {
      type: 'object',
      required: ['activatedMembers', 'spokesperson', 'activationTime'],
      properties: {
        activatedMembers: { type: 'array', items: { type: 'object' } },
        unavailable: { type: 'array', items: { type: 'object' } },
        backups: { type: 'array', items: { type: 'object' } },
        commandLocation: { type: 'string' },
        communicationChannel: { type: 'object' },
        spokesperson: { type: 'object' },
        activationTime: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'team-activation']
}));

export const prioritizeStakeholdersTask = defineTask('prioritize-stakeholders', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prioritize Stakeholder Notifications',
  agent: {
    name: 'stakeholder-prioritizer',
    prompt: {
      role: 'Stakeholder communications specialist',
      task: 'Prioritize stakeholders for notification based on crisis assessment',
      context: args,
      instructions: [
        'Identify Priority 1 stakeholders (immediate notification required)',
        'Identify Priority 2 stakeholders (notify within first hour)',
        'Identify Priority 3 stakeholders (notify within first 4 hours)',
        'Consider regulatory notification deadlines',
        'Identify stakeholders with contractual notification requirements',
        'Determine notification sequence within priority groups',
        'Identify stakeholders requiring personal outreach vs. broadcast',
        'Flag stakeholders with special handling requirements'
      ],
      outputFormat: 'JSON with priority1, priority2, priority3 arrays, notificationSequence, specialHandling, regulatoryDeadlines'
    },
    outputSchema: {
      type: 'object',
      required: ['priority1', 'priority2', 'priority3'],
      properties: {
        priority1: { type: 'array', items: { type: 'object' } },
        priority2: { type: 'array', items: { type: 'object' } },
        priority3: { type: 'array', items: { type: 'object' } },
        notificationSequence: { type: 'array', items: { type: 'string' } },
        specialHandling: { type: 'array', items: { type: 'object' } },
        regulatoryDeadlines: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'stakeholder-prioritization']
}));

export const developCoreMessagesTask = defineTask('develop-core-messages', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Core Crisis Messages',
  agent: {
    name: 'core-message-developer',
    prompt: {
      role: 'Crisis communications writer developing rapid response messages',
      task: 'Develop core messages for crisis response',
      context: args,
      instructions: [
        'Acknowledge the situation factually',
        'Express appropriate concern/empathy per SCCT guidance',
        'State what is known and what is being done',
        'Commit to transparency and updates',
        'Define key messages (3-5 max)',
        'Ensure consistency across all stakeholder messages',
        'Avoid speculation and premature conclusions',
        'Include appropriate call to action'
      ],
      outputFormat: 'JSON with messages array (keyMessage, supportingPoints), acknowledgment, empathyStatement, actionCommitment, updateCommitment'
    },
    outputSchema: {
      type: 'object',
      required: ['messages', 'acknowledgment'],
      properties: {
        messages: { type: 'array', items: { type: 'object' } },
        acknowledgment: { type: 'string' },
        empathyStatement: { type: 'string' },
        actionCommitment: { type: 'string' },
        updateCommitment: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'core-messages']
}));

export const adaptMessagesForChannelsTask = defineTask('adapt-messages-channels', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Adapt Messages for Channels',
  agent: {
    name: 'channel-adapter',
    prompt: {
      role: 'Multi-channel communications specialist',
      task: 'Adapt core messages for each communication channel and stakeholder',
      context: args,
      instructions: [
        'Adapt messages for employee communications',
        'Adapt messages for customer communications',
        'Adapt messages for media/press statement',
        'Adapt messages for social media',
        'Adapt messages for investor/board communications',
        'Adapt messages for partner/vendor communications',
        'Ensure consistency while optimizing for channel',
        'Consider character limits and format requirements'
      ],
      outputFormat: 'JSON with channelMessages object (employee, customer, media, social, investor, partner), formatNotes'
    },
    outputSchema: {
      type: 'object',
      required: ['channelMessages'],
      properties: {
        channelMessages: {
          type: 'object',
          properties: {
            employee: { type: 'object' },
            customer: { type: 'object' },
            media: { type: 'object' },
            social: { type: 'object' },
            investor: { type: 'object' },
            partner: { type: 'object' }
          }
        },
        formatNotes: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'channel-adaptation']
}));

export const conductLegalReviewTask = defineTask('conduct-legal-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct Rapid Legal Review',
  agent: {
    name: 'legal-reviewer',
    prompt: {
      role: 'Crisis communications legal counsel conducting rapid review',
      task: 'Conduct rapid legal and compliance review of crisis messages',
      context: args,
      instructions: [
        'Review for statements that could imply liability',
        'Check regulatory compliance of statements',
        'Ensure no premature admissions or blame assignment',
        'Verify factual accuracy of stated claims',
        'Check for potential defamation issues',
        'Review privacy and confidentiality compliance',
        'Flag required legal disclaimers',
        'Provide rapid approval or required changes'
      ],
      outputFormat: 'JSON with approved, issues array, requiredChanges, approvedMessages, approvedChannelMessages, disclaimers'
    },
    outputSchema: {
      type: 'object',
      required: ['approved', 'approvedMessages'],
      properties: {
        approved: { type: 'boolean' },
        issues: { type: 'array', items: { type: 'object' } },
        requiredChanges: { type: 'array', items: { type: 'object' } },
        approvedMessages: { type: 'object' },
        approvedChannelMessages: { type: 'object' },
        disclaimers: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'legal-review']
}));

export const obtainMessageApprovalTask = defineTask('obtain-message-approval', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Obtain Message Approval',
  agent: {
    name: 'approval-coordinator',
    prompt: {
      role: 'Crisis communications coordinator managing approval workflow',
      task: 'Obtain executive approval for crisis communications',
      context: args,
      instructions: [
        'Present messages to designated approver(s)',
        'Document approval or change requests',
        'Incorporate approved changes rapidly',
        'Obtain final sign-off with timestamp',
        'Document approver identity and authority',
        'Handle approval escalation if needed',
        'Maintain approval audit trail'
      ],
      outputFormat: 'JSON with approved, messages array, approver, approvalTime, changes, auditTrail'
    },
    outputSchema: {
      type: 'object',
      required: ['approved', 'messages', 'approver'],
      properties: {
        approved: { type: 'boolean' },
        messages: { type: 'array', items: { type: 'object' } },
        approver: { type: 'object' },
        approvalTime: { type: 'string' },
        changes: { type: 'array', items: { type: 'object' } },
        auditTrail: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'message-approval']
}));

export const executeMultiChannelCommsTask = defineTask('execute-multi-channel-comms', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Execute Multi-Channel Communications',
  agent: {
    name: 'comms-executor',
    prompt: {
      role: 'Communications operations specialist executing crisis messaging',
      task: 'Execute coordinated multi-channel crisis communications',
      context: args,
      instructions: [
        'Send Priority 1 stakeholder notifications',
        'Publish employee communications via internal channels',
        'Issue press statement to media',
        'Post social media updates',
        'Send customer notifications',
        'Notify partners and vendors',
        'Coordinate timing across channels',
        'Document send times and delivery confirmation'
      ],
      outputFormat: 'JSON with sent array (channel, stakeholder, message, time, status), pending, failed, timeline'
    },
    outputSchema: {
      type: 'object',
      required: ['sent'],
      properties: {
        sent: { type: 'array', items: { type: 'object' } },
        pending: { type: 'array', items: { type: 'object' } },
        failed: { type: 'array', items: { type: 'object' } },
        timeline: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'comms-execution']
}));

export const coordinateMediaResponseTask = defineTask('coordinate-media-response', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Coordinate Media Response',
  agent: {
    name: 'media-response-coordinator',
    prompt: {
      role: 'Media relations specialist managing crisis press response',
      task: 'Coordinate media response and journalist inquiries',
      context: args,
      instructions: [
        'Monitor incoming media inquiries',
        'Triage and prioritize journalist requests',
        'Provide approved statement to inquiring media',
        'Schedule spokesperson availability if needed',
        'Track media coverage as it emerges',
        'Prepare reactive Q&A for journalist questions',
        'Coordinate any interviews or briefings',
        'Document all media interactions'
      ],
      outputFormat: 'JSON with inquiries, responses, interviewsScheduled, coverageTracking, status, summary'
    },
    outputSchema: {
      type: 'object',
      required: ['inquiries', 'status', 'summary'],
      properties: {
        inquiries: { type: 'array', items: { type: 'object' } },
        responses: { type: 'array', items: { type: 'object' } },
        interviewsScheduled: { type: 'array', items: { type: 'object' } },
        coverageTracking: { type: 'array', items: { type: 'object' } },
        status: { type: 'string' },
        summary: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'media-response']
}));

export const setupCrisisMonitoringTask = defineTask('setup-crisis-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Setup Crisis Monitoring',
  agent: {
    name: 'monitoring-setup',
    prompt: {
      role: 'Crisis monitoring specialist establishing tracking systems',
      task: 'Setup comprehensive crisis monitoring and tracking',
      context: args,
      instructions: [
        'Activate media monitoring for crisis keywords',
        'Setup social media listening alerts',
        'Establish stakeholder feedback monitoring',
        'Create internal situation tracking dashboard',
        'Set monitoring cadence and reporting schedule',
        'Assign monitoring responsibilities',
        'Define escalation triggers from monitoring',
        'Setup sentiment tracking'
      ],
      outputFormat: 'JSON with status, mediaMonitoring, socialMonitoring, feedbackChannels, reportingSchedule, escalationTriggers'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'mediaMonitoring', 'reportingSchedule'],
      properties: {
        status: { type: 'string' },
        mediaMonitoring: { type: 'object' },
        socialMonitoring: { type: 'object' },
        feedbackChannels: { type: 'array', items: { type: 'object' } },
        reportingSchedule: { type: 'object' },
        escalationTriggers: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'monitoring-setup']
}));

export const generateStatusReportTask = defineTask('generate-status-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate Crisis Status Report',
  agent: {
    name: 'status-reporter',
    prompt: {
      role: 'Crisis operations analyst generating situation reports',
      task: 'Generate crisis response status report',
      context: args,
      instructions: [
        'Summarize current situation and developments',
        'Document actions taken and timing',
        'Report communications sent and reach',
        'Note media coverage and sentiment',
        'Identify outstanding issues and risks',
        'Define next actions and responsibilities',
        'Calculate elapsed time from crisis onset',
        'Provide executive summary for leadership'
      ],
      outputFormat: 'JSON with currentPhase, situationSummary, actionsTaken, communicationsReport, mediaReport, nextActions, elapsedMinutes, executiveSummary'
    },
    outputSchema: {
      type: 'object',
      required: ['currentPhase', 'nextActions', 'elapsedMinutes'],
      properties: {
        currentPhase: { type: 'string' },
        situationSummary: { type: 'object' },
        actionsTaken: { type: 'array', items: { type: 'object' } },
        communicationsReport: { type: 'object' },
        mediaReport: { type: 'object' },
        nextActions: { type: 'array', items: { type: 'object' } },
        elapsedMinutes: { type: 'number' },
        executiveSummary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'status-report']
}));

export const assessResponseQualityTask = defineTask('assess-response-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess Crisis Response Quality',
  agent: {
    name: 'response-quality-assessor',
    prompt: {
      role: 'Crisis response quality analyst',
      task: 'Assess quality and effectiveness of crisis response',
      context: args,
      instructions: [
        'Evaluate response time against best practices',
        'Assess message quality and consistency',
        'Evaluate stakeholder coverage completeness',
        'Review team coordination effectiveness',
        'Assess media response adequacy',
        'Identify gaps or missed steps',
        'Provide overall quality score (0-100)',
        'Generate recommendations for improvement'
      ],
      outputFormat: 'JSON with score, responseTimeScore, messageQualityScore, coverageScore, coordinationScore, gaps, recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['score'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        responseTimeScore: { type: 'number' },
        messageQualityScore: { type: 'number' },
        coverageScore: { type: 'number' },
        coordinationScore: { type: 'number' },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'quality-assessment']
}));
