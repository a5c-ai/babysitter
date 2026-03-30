/**
 * @process customer-experience/closed-loop-feedback
 * @description Process for systematically following up with customers on their feedback and communicating improvements made
 * @inputs { feedbackItems: array, improvementActions: array, customerContacts: object, communicationConfig: object }
 * @outputs { success: boolean, followUpPlan: object, communicationsSent: array, closureReport: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    feedbackItems = [],
    improvementActions = [],
    customerContacts = {},
    communicationConfig = {},
    outputDir = 'closed-loop-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Closed-Loop Feedback Response Process');

  // ============================================================================
  // PHASE 1: FEEDBACK PRIORITIZATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Prioritizing feedback for follow-up');
  const feedbackPrioritization = await ctx.task(feedbackPrioritizationTask, {
    feedbackItems,
    outputDir
  });

  artifacts.push(...feedbackPrioritization.artifacts);

  // ============================================================================
  // PHASE 2: ACTION MAPPING
  // ============================================================================

  ctx.log('info', 'Phase 2: Mapping feedback to improvement actions');
  const actionMapping = await ctx.task(actionMappingTask, {
    feedbackPrioritization,
    improvementActions,
    outputDir
  });

  artifacts.push(...actionMapping.artifacts);

  // ============================================================================
  // PHASE 3: COMMUNICATION PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 3: Planning customer communications');
  const communicationPlanning = await ctx.task(communicationPlanningTask, {
    feedbackPrioritization,
    actionMapping,
    customerContacts,
    communicationConfig,
    outputDir
  });

  artifacts.push(...communicationPlanning.artifacts);

  // ============================================================================
  // PHASE 4: MESSAGE GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Generating personalized messages');
  const messageGeneration = await ctx.task(messageGenerationTask, {
    communicationPlanning,
    actionMapping,
    feedbackPrioritization,
    outputDir
  });

  artifacts.push(...messageGeneration.artifacts);

  // ============================================================================
  // PHASE 5: DELIVERY SCHEDULING
  // ============================================================================

  ctx.log('info', 'Phase 5: Scheduling message delivery');
  const deliveryScheduling = await ctx.task(deliverySchedulingTask, {
    messageGeneration,
    communicationConfig,
    customerContacts,
    outputDir
  });

  artifacts.push(...deliveryScheduling.artifacts);

  // ============================================================================
  // PHASE 6: TRACKING SETUP
  // ============================================================================

  ctx.log('info', 'Phase 6: Setting up response tracking');
  const trackingSetup = await ctx.task(trackingSetupTask, {
    deliveryScheduling,
    feedbackPrioritization,
    outputDir
  });

  artifacts.push(...trackingSetup.artifacts);

  // ============================================================================
  // PHASE 7: CLOSURE REPORTING
  // ============================================================================

  ctx.log('info', 'Phase 7: Generating closure report');
  const closureReport = await ctx.task(closureReportTask, {
    feedbackPrioritization,
    actionMapping,
    communicationPlanning,
    deliveryScheduling,
    trackingSetup,
    outputDir
  });

  artifacts.push(...closureReport.artifacts);

  const feedbackCount = feedbackPrioritization.prioritizedItems?.length || 0;
  const communicationsPlanned = communicationPlanning.communications?.length || 0;

  await ctx.breakpoint({
    question: `Closed-loop feedback plan complete. Feedback items: ${feedbackCount}. Communications planned: ${communicationsPlanned}. Actions mapped: ${actionMapping.mappings?.length || 0}. Review and execute?`,
    title: 'Closed-Loop Feedback Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        feedbackCount,
        communicationsPlanned,
        actionsMapped: actionMapping.mappings?.length || 0,
        messagesGenerated: messageGeneration.messages?.length || 0,
        scheduledDeliveries: deliveryScheduling.schedule?.length || 0
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    feedbackCount,
    communicationsPlanned,
    followUpPlan: {
      prioritizedFeedback: feedbackPrioritization.prioritizedItems,
      actionMappings: actionMapping.mappings,
      communications: communicationPlanning.communications
    },
    messages: messageGeneration.messages,
    deliverySchedule: deliveryScheduling.schedule,
    tracking: trackingSetup.configuration,
    closureReport: closureReport.report,
    artifacts,
    duration,
    metadata: {
      processId: 'customer-experience/closed-loop-feedback',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const feedbackPrioritizationTask = defineTask('feedback-prioritization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prioritize feedback for follow-up',
  agent: {
    name: 'feedback-prioritizer',
    prompt: {
      role: 'customer feedback specialist',
      task: 'Prioritize feedback items for closed-loop follow-up',
      context: args,
      instructions: [
        'Score feedback by customer value',
        'Prioritize detractor feedback',
        'Consider feedback recency',
        'Assess actionability of feedback',
        'Identify feedback with resolution',
        'Group related feedback items',
        'Flag urgent follow-ups needed',
        'Create prioritized queue',
        'Generate prioritization report'
      ],
      outputFormat: 'JSON with prioritizedItems, urgentItems, groupings, criteria, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['prioritizedItems', 'artifacts'],
      properties: {
        prioritizedItems: { type: 'array', items: { type: 'object' } },
        urgentItems: { type: 'array', items: { type: 'object' } },
        groupings: { type: 'array', items: { type: 'object' } },
        criteria: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'closed-loop', 'prioritization']
}));

export const actionMappingTask = defineTask('action-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map feedback to improvement actions',
  agent: {
    name: 'action-mapper',
    prompt: {
      role: 'improvement tracking specialist',
      task: 'Map feedback items to completed or planned improvement actions',
      context: args,
      instructions: [
        'Match feedback to completed improvements',
        'Match feedback to planned improvements',
        'Identify feedback without matching action',
        'Document action status (completed, in-progress, planned)',
        'Create feedback-to-action links',
        'Identify actions addressing multiple feedback',
        'Flag feedback requiring new actions',
        'Calculate coverage metrics',
        'Generate action mapping report'
      ],
      outputFormat: 'JSON with mappings, unmapped, coverage, multiActionFeedback, newActionsNeeded, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['mappings', 'coverage', 'artifacts'],
      properties: {
        mappings: { type: 'array', items: { type: 'object' } },
        unmapped: { type: 'array', items: { type: 'object' } },
        coverage: { type: 'object' },
        multiActionFeedback: { type: 'array', items: { type: 'object' } },
        newActionsNeeded: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'closed-loop', 'mapping']
}));

export const communicationPlanningTask = defineTask('communication-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan customer communications',
  agent: {
    name: 'communication-planner',
    prompt: {
      role: 'customer communication specialist',
      task: 'Plan personalized communications for feedback follow-up',
      context: args,
      instructions: [
        'Determine communication type per feedback',
        'Select appropriate channel (email, phone, in-app)',
        'Plan communication timing',
        'Define communication owner',
        'Create communication templates',
        'Plan escalation communications',
        'Define follow-up sequences',
        'Set response expectations',
        'Generate communication plan'
      ],
      outputFormat: 'JSON with communications, channels, timing, owners, templates, sequences, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['communications', 'channels', 'artifacts'],
      properties: {
        communications: { type: 'array', items: { type: 'object' } },
        channels: { type: 'object' },
        timing: { type: 'object' },
        owners: { type: 'array', items: { type: 'object' } },
        templates: { type: 'array', items: { type: 'object' } },
        sequences: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'closed-loop', 'planning']
}));

export const messageGenerationTask = defineTask('message-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate personalized messages',
  agent: {
    name: 'message-generator',
    prompt: {
      role: 'customer communication writer',
      task: 'Generate personalized follow-up messages for each customer',
      context: args,
      instructions: [
        'Reference original feedback',
        'Acknowledge customer concern',
        'Communicate action taken or planned',
        'Explain improvement impact',
        'Express appreciation for feedback',
        'Include next steps if applicable',
        'Personalize with customer name and context',
        'Maintain brand voice',
        'Generate message package'
      ],
      outputFormat: 'JSON with messages, templates used, personalization, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['messages', 'artifacts'],
      properties: {
        messages: { type: 'array', items: { type: 'object' } },
        templatesUsed: { type: 'array', items: { type: 'string' } },
        personalization: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'closed-loop', 'messages']
}));

export const deliverySchedulingTask = defineTask('delivery-scheduling', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Schedule message delivery',
  agent: {
    name: 'delivery-scheduler',
    prompt: {
      role: 'communication delivery specialist',
      task: 'Schedule optimal delivery times for follow-up communications',
      context: args,
      instructions: [
        'Determine optimal send times',
        'Consider customer timezone',
        'Avoid over-communication',
        'Batch related communications',
        'Schedule follow-up reminders',
        'Plan retry for failed deliveries',
        'Set delivery windows',
        'Configure delivery preferences',
        'Generate delivery schedule'
      ],
      outputFormat: 'JSON with schedule, batches, retryPolicy, windows, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['schedule', 'artifacts'],
      properties: {
        schedule: { type: 'array', items: { type: 'object' } },
        batches: { type: 'array', items: { type: 'object' } },
        retryPolicy: { type: 'object' },
        windows: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'closed-loop', 'scheduling']
}));

export const trackingSetupTask = defineTask('tracking-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up response tracking',
  agent: {
    name: 'tracking-specialist',
    prompt: {
      role: 'response tracking specialist',
      task: 'Configure tracking for closed-loop communication responses',
      context: args,
      instructions: [
        'Set up delivery tracking',
        'Configure open and click tracking',
        'Set up response detection',
        'Configure satisfaction re-survey triggers',
        'Define success metrics',
        'Set up alerting for negative responses',
        'Configure follow-up automation',
        'Define closure criteria',
        'Generate tracking configuration'
      ],
      outputFormat: 'JSON with configuration, metrics, alerts, automation, closureCriteria, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['configuration', 'metrics', 'artifacts'],
      properties: {
        configuration: { type: 'object' },
        metrics: { type: 'array', items: { type: 'object' } },
        alerts: { type: 'array', items: { type: 'object' } },
        automation: { type: 'object' },
        closureCriteria: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'closed-loop', 'tracking']
}));

export const closureReportTask = defineTask('closure-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate closure report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'closed-loop reporting specialist',
      task: 'Generate comprehensive closed-loop feedback report',
      context: args,
      instructions: [
        'Summarize feedback addressed',
        'Report actions communicated',
        'Present communication metrics',
        'Document customer responses',
        'Calculate closure rates',
        'Identify open items',
        'Provide recommendations',
        'Create executive summary',
        'Generate comprehensive report'
      ],
      outputFormat: 'JSON with report, summary, metrics, openItems, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['report', 'summary', 'artifacts'],
      properties: {
        report: { type: 'object' },
        summary: { type: 'string' },
        metrics: { type: 'object' },
        openItems: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'closed-loop', 'reporting']
}));
