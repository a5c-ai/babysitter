/**
 * @process customer-experience/ticket-triage-routing
 * @description Intelligent process for categorizing, prioritizing, and routing support tickets based on severity, customer tier, and agent expertise
 * @inputs { ticket: object, customerProfile: object, agentPool: array, routingRules: object }
 * @outputs { success: boolean, triageResult: object, routing: object, prioritization: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    ticket = {},
    customerProfile = {},
    agentPool = [],
    routingRules = {},
    outputDir = 'triage-output',
    slaDefinitions = {}
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Ticket Triage and Routing for ticket: ${ticket.id || 'new'}`);

  // ============================================================================
  // PHASE 1: TICKET CATEGORIZATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Categorizing ticket content and type');
  const categorization = await ctx.task(categorizationTask, {
    ticket,
    customerProfile,
    outputDir
  });

  artifacts.push(...categorization.artifacts);

  // ============================================================================
  // PHASE 2: SEVERITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 2: Assessing ticket severity and impact');
  const severityAssessment = await ctx.task(severityAssessmentTask, {
    ticket,
    categorization,
    customerProfile,
    outputDir
  });

  artifacts.push(...severityAssessment.artifacts);

  // ============================================================================
  // PHASE 3: PRIORITY CALCULATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Calculating ticket priority');
  const priorityCalculation = await ctx.task(priorityCalculationTask, {
    ticket,
    categorization,
    severityAssessment,
    customerProfile,
    slaDefinitions,
    outputDir
  });

  artifacts.push(...priorityCalculation.artifacts);

  // ============================================================================
  // PHASE 4: SKILL MATCHING
  // ============================================================================

  ctx.log('info', 'Phase 4: Matching required skills and expertise');
  const skillMatching = await ctx.task(skillMatchingTask, {
    categorization,
    severityAssessment,
    agentPool,
    outputDir
  });

  artifacts.push(...skillMatching.artifacts);

  // ============================================================================
  // PHASE 5: AGENT SELECTION
  // ============================================================================

  ctx.log('info', 'Phase 5: Selecting optimal agent for routing');
  const agentSelection = await ctx.task(agentSelectionTask, {
    ticket,
    categorization,
    priorityCalculation,
    skillMatching,
    agentPool,
    routingRules,
    outputDir
  });

  artifacts.push(...agentSelection.artifacts);

  // ============================================================================
  // PHASE 6: SLA ASSIGNMENT
  // ============================================================================

  ctx.log('info', 'Phase 6: Assigning SLA targets');
  const slaAssignment = await ctx.task(slaAssignmentTask, {
    ticket,
    priorityCalculation,
    customerProfile,
    slaDefinitions,
    outputDir
  });

  artifacts.push(...slaAssignment.artifacts);

  // ============================================================================
  // PHASE 7: ROUTING DECISION VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Validating routing decision');
  const routingValidation = await ctx.task(routingValidationTask, {
    ticket,
    categorization,
    severityAssessment,
    priorityCalculation,
    agentSelection,
    slaAssignment,
    outputDir
  });

  artifacts.push(...routingValidation.artifacts);

  const validationScore = routingValidation.confidenceScore;
  const routingApproved = validationScore >= 80;

  await ctx.breakpoint({
    question: `Ticket triage complete. Priority: ${priorityCalculation.priority}. Assigned to: ${agentSelection.selectedAgent?.name || 'Queue'}. Confidence: ${validationScore}%. ${routingApproved ? 'Routing approved!' : 'Manual review recommended.'} Proceed?`,
    title: 'Ticket Triage Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        validationScore,
        routingApproved,
        ticketId: ticket.id,
        category: categorization.category,
        severity: severityAssessment.severity,
        priority: priorityCalculation.priority,
        assignedAgent: agentSelection.selectedAgent?.name,
        slaTarget: slaAssignment.responseTarget
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    validationScore,
    routingApproved,
    triageResult: {
      category: categorization.category,
      subcategory: categorization.subcategory,
      tags: categorization.tags,
      sentiment: categorization.sentiment
    },
    severityAssessment: {
      severity: severityAssessment.severity,
      impact: severityAssessment.impact,
      urgency: severityAssessment.urgency
    },
    prioritization: {
      priority: priorityCalculation.priority,
      score: priorityCalculation.score,
      factors: priorityCalculation.factors
    },
    routing: {
      selectedAgent: agentSelection.selectedAgent,
      queue: agentSelection.queue,
      alternates: agentSelection.alternateAgents,
      reasoning: agentSelection.reasoning
    },
    sla: {
      responseTarget: slaAssignment.responseTarget,
      resolutionTarget: slaAssignment.resolutionTarget,
      escalationTime: slaAssignment.escalationTime
    },
    artifacts,
    duration,
    metadata: {
      processId: 'customer-experience/ticket-triage-routing',
      timestamp: startTime,
      ticketId: ticket.id,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const categorizationTask = defineTask('categorization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Categorize ticket content and type',
  agent: {
    name: 'ticket-categorizer',
    prompt: {
      role: 'support ticket analyst',
      task: 'Analyze and categorize ticket content, identify issue type, and extract key information',
      context: args,
      instructions: [
        'Analyze ticket subject and description',
        'Identify primary category (bug, feature request, how-to, billing, etc.)',
        'Determine subcategory and specific issue type',
        'Extract product or feature area affected',
        'Identify keywords and tags',
        'Detect customer sentiment (frustrated, neutral, positive)',
        'Check for duplicate or related tickets',
        'Extract any error codes or technical details',
        'Generate categorization report'
      ],
      outputFormat: 'JSON with category, subcategory, productArea, tags, sentiment, duplicateCheck, technicalDetails, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['category', 'subcategory', 'artifacts'],
      properties: {
        category: { type: 'string' },
        subcategory: { type: 'string' },
        productArea: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        sentiment: { type: 'string', enum: ['frustrated', 'concerned', 'neutral', 'positive'] },
        duplicateCheck: { type: 'object' },
        technicalDetails: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ticket-triage', 'categorization']
}));

export const severityAssessmentTask = defineTask('severity-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess ticket severity and impact',
  agent: {
    name: 'severity-assessor',
    prompt: {
      role: 'support severity analyst',
      task: 'Assess ticket severity based on business impact, user impact, and urgency',
      context: args,
      instructions: [
        'Evaluate business impact (revenue, compliance, reputation)',
        'Assess number of users affected',
        'Determine if workaround exists',
        'Evaluate system availability impact',
        'Consider customer tier and strategic importance',
        'Assess data security implications',
        'Calculate urgency based on time sensitivity',
        'Assign severity level (critical, high, medium, low)',
        'Generate severity assessment report'
      ],
      outputFormat: 'JSON with severity, impact, urgency, userCount, workaroundAvailable, securityImpact, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['severity', 'impact', 'urgency', 'artifacts'],
      properties: {
        severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
        impact: { type: 'object' },
        urgency: { type: 'string', enum: ['immediate', 'high', 'medium', 'low'] },
        userCount: { type: 'number' },
        workaroundAvailable: { type: 'boolean' },
        securityImpact: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ticket-triage', 'severity']
}));

export const priorityCalculationTask = defineTask('priority-calculation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate ticket priority',
  agent: {
    name: 'priority-calculator',
    prompt: {
      role: 'support prioritization specialist',
      task: 'Calculate composite ticket priority based on severity, customer tier, and business factors',
      context: args,
      instructions: [
        'Apply severity weighting to priority score',
        'Factor in customer tier multiplier',
        'Consider customer health score impact',
        'Apply business criticality factors',
        'Factor in SLA proximity',
        'Consider ticket age and wait time',
        'Apply any manual priority overrides',
        'Calculate final priority score and level',
        'Generate priority calculation report'
      ],
      outputFormat: 'JSON with priority, score, factors, tierMultiplier, slaUrgency, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['priority', 'score', 'factors', 'artifacts'],
      properties: {
        priority: { type: 'string', enum: ['P1', 'P2', 'P3', 'P4'] },
        score: { type: 'number', minimum: 0, maximum: 100 },
        factors: { type: 'array', items: { type: 'object' } },
        tierMultiplier: { type: 'number' },
        slaUrgency: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ticket-triage', 'priority']
}));

export const skillMatchingTask = defineTask('skill-matching', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Match required skills and expertise',
  agent: {
    name: 'skill-matcher',
    prompt: {
      role: 'support resource specialist',
      task: 'Identify required skills and expertise to resolve the ticket effectively',
      context: args,
      instructions: [
        'Identify technical skills required',
        'Determine product expertise needed',
        'Assess language requirements',
        'Identify certification requirements',
        'Evaluate escalation tier needed',
        'Check for specialized knowledge requirements',
        'Match skills to available agent pool',
        'Rank agents by skill match score',
        'Generate skill matching report'
      ],
      outputFormat: 'JSON with requiredSkills, productExpertise, tierRequired, matchedAgents, skillGaps, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['requiredSkills', 'tierRequired', 'matchedAgents', 'artifacts'],
      properties: {
        requiredSkills: { type: 'array', items: { type: 'string' } },
        productExpertise: { type: 'array', items: { type: 'string' } },
        tierRequired: { type: 'number' },
        matchedAgents: { type: 'array', items: { type: 'object' } },
        skillGaps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ticket-triage', 'skills']
}));

export const agentSelectionTask = defineTask('agent-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select optimal agent for routing',
  agent: {
    name: 'routing-engine',
    prompt: {
      role: 'support routing specialist',
      task: 'Select optimal agent for ticket assignment based on skills, availability, and workload',
      context: args,
      instructions: [
        'Check agent availability and current workload',
        'Apply skill match scoring',
        'Consider agent performance metrics',
        'Factor in customer relationship history',
        'Apply round-robin or load balancing rules',
        'Check timezone alignment',
        'Consider agent specialization',
        'Select primary and alternate agents',
        'Generate routing decision report'
      ],
      outputFormat: 'JSON with selectedAgent, queue, alternateAgents, reasoning, workloadImpact, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedAgent', 'queue', 'reasoning', 'artifacts'],
      properties: {
        selectedAgent: { type: 'object' },
        queue: { type: 'string' },
        alternateAgents: { type: 'array', items: { type: 'object' } },
        reasoning: { type: 'string' },
        workloadImpact: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ticket-triage', 'routing']
}));

export const slaAssignmentTask = defineTask('sla-assignment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assign SLA targets',
  agent: {
    name: 'sla-manager',
    prompt: {
      role: 'SLA management specialist',
      task: 'Assign appropriate SLA targets based on priority and customer tier',
      context: args,
      instructions: [
        'Look up SLA policy for customer tier',
        'Apply priority-based response times',
        'Set first response target',
        'Set resolution target',
        'Define escalation thresholds',
        'Calculate business hours considerations',
        'Set warning thresholds',
        'Document SLA commitments',
        'Generate SLA assignment report'
      ],
      outputFormat: 'JSON with responseTarget, resolutionTarget, escalationTime, warningThresholds, businessHours, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['responseTarget', 'resolutionTarget', 'artifacts'],
      properties: {
        responseTarget: { type: 'string' },
        resolutionTarget: { type: 'string' },
        escalationTime: { type: 'string' },
        warningThresholds: { type: 'object' },
        businessHours: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ticket-triage', 'sla']
}));

export const routingValidationTask = defineTask('routing-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate routing decision',
  agent: {
    name: 'routing-validator',
    prompt: {
      role: 'quality assurance specialist',
      task: 'Validate routing decision quality and identify any concerns',
      context: args,
      instructions: [
        'Verify categorization accuracy',
        'Validate severity assessment',
        'Confirm priority calculation',
        'Verify skill match appropriateness',
        'Validate agent selection logic',
        'Confirm SLA assignment accuracy',
        'Calculate confidence score',
        'Identify any routing concerns',
        'Generate validation report'
      ],
      outputFormat: 'JSON with confidenceScore, validations, concerns, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['confidenceScore', 'validations', 'artifacts'],
      properties: {
        confidenceScore: { type: 'number', minimum: 0, maximum: 100 },
        validations: { type: 'object' },
        concerns: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ticket-triage', 'validation']
}));
