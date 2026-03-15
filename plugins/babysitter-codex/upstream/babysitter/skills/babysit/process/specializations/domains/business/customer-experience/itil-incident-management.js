/**
 * @process customer-experience/itil-incident-management
 * @description Structured process for incident detection, logging, categorization, investigation, and resolution following ITIL best practices
 * @inputs { incident: object, affectedServices: array, impactAssessment: object, knowledgeBase: object }
 * @outputs { success: boolean, incidentRecord: object, resolutionReport: object, postIncidentReview: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    incident = {},
    affectedServices = [],
    impactAssessment = {},
    knowledgeBase = {},
    outputDir = 'incident-management-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting ITIL Incident Management for incident: ${incident.id || 'new'}`);

  // ============================================================================
  // PHASE 1: INCIDENT DETECTION AND LOGGING
  // ============================================================================

  ctx.log('info', 'Phase 1: Detecting and logging incident');
  const incidentLogging = await ctx.task(incidentLoggingTask, {
    incident,
    affectedServices,
    outputDir
  });

  artifacts.push(...incidentLogging.artifacts);

  // ============================================================================
  // PHASE 2: CATEGORIZATION AND PRIORITIZATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Categorizing and prioritizing incident');
  const categorizationResult = await ctx.task(categorizationTask, {
    incidentLogging,
    impactAssessment,
    affectedServices,
    outputDir
  });

  artifacts.push(...categorizationResult.artifacts);

  // ============================================================================
  // PHASE 3: INITIAL DIAGNOSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Performing initial diagnosis');
  const initialDiagnosis = await ctx.task(initialDiagnosisTask, {
    incidentLogging,
    categorizationResult,
    knowledgeBase,
    outputDir
  });

  artifacts.push(...initialDiagnosis.artifacts);

  // ============================================================================
  // PHASE 4: ESCALATION DETERMINATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Determining escalation needs');
  const escalationDetermination = await ctx.task(escalationDeterminationTask, {
    incidentLogging,
    categorizationResult,
    initialDiagnosis,
    outputDir
  });

  artifacts.push(...escalationDetermination.artifacts);

  // ============================================================================
  // PHASE 5: INVESTIGATION AND DIAGNOSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Investigating and diagnosing');
  const investigation = await ctx.task(investigationTask, {
    incidentLogging,
    initialDiagnosis,
    escalationDetermination,
    knowledgeBase,
    outputDir
  });

  artifacts.push(...investigation.artifacts);

  // ============================================================================
  // PHASE 6: RESOLUTION AND RECOVERY
  // ============================================================================

  ctx.log('info', 'Phase 6: Planning resolution and recovery');
  const resolutionPlan = await ctx.task(resolutionTask, {
    investigation,
    incidentLogging,
    affectedServices,
    outputDir
  });

  artifacts.push(...resolutionPlan.artifacts);

  // ============================================================================
  // PHASE 7: INCIDENT CLOSURE
  // ============================================================================

  ctx.log('info', 'Phase 7: Preparing incident closure');
  const incidentClosure = await ctx.task(closureTask, {
    incidentLogging,
    resolutionPlan,
    investigation,
    outputDir
  });

  artifacts.push(...incidentClosure.artifacts);

  // ============================================================================
  // PHASE 8: POST-INCIDENT REVIEW
  // ============================================================================

  ctx.log('info', 'Phase 8: Conducting post-incident review');
  const postIncidentReview = await ctx.task(postIncidentReviewTask, {
    incidentLogging,
    investigation,
    resolutionPlan,
    incidentClosure,
    outputDir
  });

  artifacts.push(...postIncidentReview.artifacts);

  const incidentPriority = categorizationResult.priority;
  const resolutionSuccess = incidentClosure.closureStatus === 'resolved';

  await ctx.breakpoint({
    question: `Incident management complete for ${incident.id || 'incident'}. Priority: ${incidentPriority}. Status: ${incidentClosure.closureStatus}. Root cause identified: ${investigation.rootCauseIdentified ? 'Yes' : 'No'}. Review and close?`,
    title: 'Incident Management Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        incidentId: incident.id,
        priority: incidentPriority,
        status: incidentClosure.closureStatus,
        resolutionSuccess,
        rootCauseIdentified: investigation.rootCauseIdentified,
        escalated: escalationDetermination.escalationRequired,
        timeToResolve: incidentClosure.timeToResolve
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    resolutionSuccess,
    incidentRecord: {
      id: incidentLogging.incidentId,
      category: categorizationResult.category,
      priority: categorizationResult.priority,
      impact: categorizationResult.impact,
      urgency: categorizationResult.urgency
    },
    diagnosis: {
      initialFindings: initialDiagnosis.findings,
      rootCause: investigation.rootCause,
      rootCauseIdentified: investigation.rootCauseIdentified
    },
    resolution: {
      plan: resolutionPlan.plan,
      actions: resolutionPlan.actions,
      workaround: resolutionPlan.workaround
    },
    closure: {
      status: incidentClosure.closureStatus,
      timeToResolve: incidentClosure.timeToResolve,
      customerNotified: incidentClosure.customerNotified
    },
    postIncidentReview: {
      lessons: postIncidentReview.lessonsLearned,
      improvements: postIncidentReview.improvements,
      problemTicket: postIncidentReview.problemTicketCreated
    },
    artifacts,
    duration,
    metadata: {
      processId: 'customer-experience/itil-incident-management',
      timestamp: startTime,
      incidentId: incident.id,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const incidentLoggingTask = defineTask('incident-logging', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Detect and log incident',
  agent: {
    name: 'incident-logger',
    prompt: {
      role: 'ITIL incident management specialist',
      task: 'Log incident with complete details following ITIL standards',
      context: args,
      instructions: [
        'Generate unique incident ID',
        'Record incident source and detection method',
        'Document reporter information',
        'Record timestamp and duration',
        'Document affected services and users',
        'Capture initial symptoms and description',
        'Record related incidents or changes',
        'Capture initial evidence and logs',
        'Generate incident logging record'
      ],
      outputFormat: 'JSON with incidentId, source, reporter, timestamp, affectedItems, symptoms, relatedItems, evidence, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['incidentId', 'timestamp', 'artifacts'],
      properties: {
        incidentId: { type: 'string' },
        source: { type: 'string' },
        reporter: { type: 'object' },
        timestamp: { type: 'string' },
        affectedItems: { type: 'array', items: { type: 'object' } },
        symptoms: { type: 'array', items: { type: 'string' } },
        relatedItems: { type: 'array', items: { type: 'object' } },
        evidence: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'incident-management', 'logging']
}));

export const categorizationTask = defineTask('categorization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Categorize and prioritize incident',
  agent: {
    name: 'incident-categorizer',
    prompt: {
      role: 'ITIL categorization specialist',
      task: 'Categorize incident and determine priority based on impact and urgency',
      context: args,
      instructions: [
        'Assign incident category and subcategory',
        'Assess impact on users and business',
        'Assess urgency based on business needs',
        'Calculate priority using impact/urgency matrix',
        'Identify affected configuration items',
        'Assign SLA targets based on priority',
        'Identify service level impacts',
        'Document categorization rationale',
        'Generate categorization record'
      ],
      outputFormat: 'JSON with category, subcategory, impact, urgency, priority, slaTargets, configItems, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['category', 'priority', 'artifacts'],
      properties: {
        category: { type: 'string' },
        subcategory: { type: 'string' },
        impact: { type: 'string', enum: ['high', 'medium', 'low'] },
        urgency: { type: 'string', enum: ['high', 'medium', 'low'] },
        priority: { type: 'string', enum: ['P1', 'P2', 'P3', 'P4'] },
        slaTargets: { type: 'object' },
        configItems: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'incident-management', 'categorization']
}));

export const initialDiagnosisTask = defineTask('initial-diagnosis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform initial diagnosis',
  agent: {
    name: 'initial-diagnostician',
    prompt: {
      role: 'first-line support specialist',
      task: 'Perform initial diagnosis and attempt quick resolution',
      context: args,
      instructions: [
        'Review incident symptoms',
        'Search knowledge base for known solutions',
        'Check for known errors and workarounds',
        'Attempt standard troubleshooting steps',
        'Document diagnosis findings',
        'Identify if quick resolution possible',
        'Document attempted solutions',
        'Determine if escalation needed',
        'Generate initial diagnosis report'
      ],
      outputFormat: 'JSON with findings, knownSolutions, troubleshooting, quickResolutionPossible, attemptedSolutions, escalationNeeded, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['findings', 'escalationNeeded', 'artifacts'],
      properties: {
        findings: { type: 'array', items: { type: 'string' } },
        knownSolutions: { type: 'array', items: { type: 'object' } },
        troubleshooting: { type: 'array', items: { type: 'object' } },
        quickResolutionPossible: { type: 'boolean' },
        attemptedSolutions: { type: 'array', items: { type: 'object' } },
        escalationNeeded: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'incident-management', 'diagnosis']
}));

export const escalationDeterminationTask = defineTask('escalation-determination', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Determine escalation needs',
  agent: {
    name: 'escalation-assessor',
    prompt: {
      role: 'escalation management specialist',
      task: 'Determine if functional or hierarchical escalation is required',
      context: args,
      instructions: [
        'Assess if functional escalation needed',
        'Assess if hierarchical escalation needed',
        'Identify escalation target team or level',
        'Determine escalation urgency',
        'Document escalation criteria met',
        'Prepare escalation handoff',
        'Notify relevant stakeholders',
        'Update incident record',
        'Generate escalation determination'
      ],
      outputFormat: 'JSON with escalationRequired, escalationType, targetTeam, urgency, criteria, stakeholders, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['escalationRequired', 'artifacts'],
      properties: {
        escalationRequired: { type: 'boolean' },
        escalationType: { type: 'string', enum: ['functional', 'hierarchical', 'both', 'none'] },
        targetTeam: { type: 'object' },
        urgency: { type: 'string' },
        criteria: { type: 'array', items: { type: 'string' } },
        stakeholders: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'incident-management', 'escalation']
}));

export const investigationTask = defineTask('investigation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Investigate and diagnose',
  agent: {
    name: 'incident-investigator',
    prompt: {
      role: 'technical investigation specialist',
      task: 'Conduct thorough investigation to identify root cause',
      context: args,
      instructions: [
        'Review all available evidence',
        'Analyze logs and system data',
        'Correlate events and timeline',
        'Identify potential root causes',
        'Test hypotheses',
        'Document investigation steps',
        'Identify definitive root cause',
        'Document known error if applicable',
        'Generate investigation report'
      ],
      outputFormat: 'JSON with rootCause, rootCauseIdentified, evidence, timeline, hypotheses, investigationSteps, knownError, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['rootCauseIdentified', 'investigationSteps', 'artifacts'],
      properties: {
        rootCause: { type: 'string' },
        rootCauseIdentified: { type: 'boolean' },
        evidence: { type: 'array', items: { type: 'object' } },
        timeline: { type: 'array', items: { type: 'object' } },
        hypotheses: { type: 'array', items: { type: 'object' } },
        investigationSteps: { type: 'array', items: { type: 'object' } },
        knownError: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'incident-management', 'investigation']
}));

export const resolutionTask = defineTask('resolution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan resolution and recovery',
  agent: {
    name: 'resolution-planner',
    prompt: {
      role: 'incident resolution specialist',
      task: 'Plan and execute incident resolution and service recovery',
      context: args,
      instructions: [
        'Develop resolution plan',
        'Identify workaround if permanent fix not available',
        'Plan resolution actions',
        'Assess resolution risks',
        'Plan service recovery steps',
        'Document change requirements',
        'Plan verification testing',
        'Coordinate with affected teams',
        'Generate resolution plan'
      ],
      outputFormat: 'JSON with plan, actions, workaround, risks, recoverySteps, changeRequirements, verification, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'actions', 'artifacts'],
      properties: {
        plan: { type: 'string' },
        actions: { type: 'array', items: { type: 'object' } },
        workaround: { type: 'object' },
        risks: { type: 'array', items: { type: 'object' } },
        recoverySteps: { type: 'array', items: { type: 'object' } },
        changeRequirements: { type: 'array', items: { type: 'object' } },
        verification: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'incident-management', 'resolution']
}));

export const closureTask = defineTask('closure', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare incident closure',
  agent: {
    name: 'closure-specialist',
    prompt: {
      role: 'incident closure specialist',
      task: 'Prepare and execute incident closure procedures',
      context: args,
      instructions: [
        'Verify resolution effectiveness',
        'Confirm user satisfaction',
        'Document closure category',
        'Calculate time to resolve',
        'Update knowledge base if applicable',
        'Send closure notification',
        'Archive incident documentation',
        'Update metrics and reporting',
        'Generate closure record'
      ],
      outputFormat: 'JSON with closureStatus, verificationComplete, customerNotified, timeToResolve, kbUpdated, notifications, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['closureStatus', 'timeToResolve', 'artifacts'],
      properties: {
        closureStatus: { type: 'string', enum: ['resolved', 'closed-workaround', 'closed-unresolved'] },
        verificationComplete: { type: 'boolean' },
        customerNotified: { type: 'boolean' },
        timeToResolve: { type: 'string' },
        kbUpdated: { type: 'boolean' },
        notifications: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'incident-management', 'closure']
}));

export const postIncidentReviewTask = defineTask('post-incident-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct post-incident review',
  agent: {
    name: 'pir-facilitator',
    prompt: {
      role: 'post-incident review specialist',
      task: 'Conduct post-incident review and identify improvements',
      context: args,
      instructions: [
        'Review incident timeline',
        'Analyze response effectiveness',
        'Identify what went well',
        'Identify areas for improvement',
        'Document lessons learned',
        'Create improvement action items',
        'Determine if problem ticket needed',
        'Update procedures if required',
        'Generate post-incident review report'
      ],
      outputFormat: 'JSON with lessonsLearned, improvements, whatWentWell, actionItems, problemTicketCreated, procedureUpdates, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['lessonsLearned', 'improvements', 'artifacts'],
      properties: {
        lessonsLearned: { type: 'array', items: { type: 'string' } },
        improvements: { type: 'array', items: { type: 'object' } },
        whatWentWell: { type: 'array', items: { type: 'string' } },
        actionItems: { type: 'array', items: { type: 'object' } },
        problemTicketCreated: { type: 'boolean' },
        procedureUpdates: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'incident-management', 'pir']
}));
