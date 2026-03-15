/**
 * @process specializations/domains/business/public-relations/reputation-recovery-strategy
 * @description Develop and execute strategies to rebuild organizational reputation following negative events using evidence-based approaches and third-party validation
 * @specialization Public Relations and Communications
 * @category Reputation Management
 * @inputs { reputationDamage: object, organization: object, stakeholderImpact: object, resources: object }
 * @outputs { success: boolean, recoveryStrategy: object, actionPlan: object, measurementFramework: object, quality: number }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    reputationDamage,
    organization,
    stakeholderImpact = {},
    resources = {},
    timeframe = '12 months',
    targetQuality = 85
  } = inputs;

  // Phase 1: Damage Assessment
  await ctx.breakpoint({
    question: 'Starting reputation recovery strategy. Assess reputation damage scope?',
    title: 'Phase 1: Damage Assessment',
    context: {
      runId: ctx.runId,
      phase: 'damage-assessment',
      organization: organization.name
    }
  });

  const damageAssessment = await ctx.task(assessReputationDamageTask, {
    reputationDamage,
    organization,
    stakeholderImpact
  });

  // Phase 2: Stakeholder Recovery Prioritization
  await ctx.breakpoint({
    question: 'Damage assessed. Prioritize stakeholder recovery?',
    title: 'Phase 2: Stakeholder Prioritization',
    context: {
      runId: ctx.runId,
      phase: 'stakeholder-prioritization',
      damageLevel: damageAssessment.overallDamageLevel
    }
  });

  const stakeholderPrioritization = await ctx.task(prioritizeStakeholderRecoveryTask, {
    damageAssessment,
    stakeholderImpact,
    organization
  });

  // Phase 3: Recovery Strategy Development
  await ctx.breakpoint({
    question: 'Stakeholders prioritized. Develop recovery strategy?',
    title: 'Phase 3: Strategy Development',
    context: {
      runId: ctx.runId,
      phase: 'strategy-development'
    }
  });

  const [recoveryStrategy, messagingStrategy] = await Promise.all([
    ctx.task(developRecoveryStrategyTask, {
      damageAssessment,
      stakeholderPrioritization,
      organization,
      timeframe
    }),
    ctx.task(developRecoveryMessagingTask, {
      damageAssessment,
      stakeholderPrioritization,
      organization
    })
  ]);

  // Phase 4: Third-Party Validation Planning
  await ctx.breakpoint({
    question: 'Strategy developed. Plan third-party validation?',
    title: 'Phase 4: Third-Party Validation',
    context: {
      runId: ctx.runId,
      phase: 'third-party-validation'
    }
  });

  const thirdPartyValidation = await ctx.task(planThirdPartyValidationTask, {
    recoveryStrategy,
    damageAssessment,
    organization
  });

  // Phase 5: Stakeholder Engagement Plan
  await ctx.breakpoint({
    question: 'Validation planned. Develop stakeholder engagement plan?',
    title: 'Phase 5: Stakeholder Engagement',
    context: {
      runId: ctx.runId,
      phase: 'stakeholder-engagement'
    }
  });

  const stakeholderEngagement = await ctx.task(developStakeholderEngagementTask, {
    stakeholderPrioritization,
    recoveryStrategy,
    messagingStrategy
  });

  // Phase 6: Communications Action Plan
  await ctx.breakpoint({
    question: 'Engagement planned. Create communications action plan?',
    title: 'Phase 6: Communications Plan',
    context: {
      runId: ctx.runId,
      phase: 'communications-plan'
    }
  });

  const communicationsPlan = await ctx.task(createCommunicationsPlanTask, {
    messagingStrategy,
    stakeholderEngagement,
    thirdPartyValidation,
    timeframe
  });

  // Phase 7: Operational Recovery Actions
  await ctx.breakpoint({
    question: 'Communications planned. Define operational recovery actions?',
    title: 'Phase 7: Operational Actions',
    context: {
      runId: ctx.runId,
      phase: 'operational-actions'
    }
  });

  const operationalActions = await ctx.task(defineOperationalActionsTask, {
    damageAssessment,
    recoveryStrategy,
    organization
  });

  // Phase 8: Measurement Framework
  await ctx.breakpoint({
    question: 'Actions defined. Establish measurement framework?',
    title: 'Phase 8: Measurement Framework',
    context: {
      runId: ctx.runId,
      phase: 'measurement-framework'
    }
  });

  const measurementFramework = await ctx.task(establishMeasurementFrameworkTask, {
    recoveryStrategy,
    damageAssessment,
    timeframe
  });

  // Phase 9: Quality Validation
  await ctx.breakpoint({
    question: 'Validate recovery strategy quality?',
    title: 'Phase 9: Quality Validation',
    context: {
      runId: ctx.runId,
      phase: 'quality-validation',
      targetQuality
    }
  });

  const qualityResult = await ctx.task(validateRecoveryStrategyTask, {
    damageAssessment,
    recoveryStrategy,
    messagingStrategy,
    thirdPartyValidation,
    stakeholderEngagement,
    communicationsPlan,
    operationalActions,
    measurementFramework,
    targetQuality
  });

  const quality = qualityResult.score;

  if (quality >= targetQuality) {
    return {
      success: true,
      recoveryStrategy: {
        strategy: recoveryStrategy,
        messaging: messagingStrategy,
        thirdPartyValidation
      },
      actionPlan: {
        stakeholderEngagement,
        communicationsPlan,
        operationalActions,
        timeline: recoveryStrategy.timeline
      },
      measurementFramework,
      damageAssessment: damageAssessment.summary,
      quality,
      targetQuality,
      metadata: {
        processId: 'specializations/domains/business/public-relations/reputation-recovery-strategy',
        timestamp: ctx.now(),
        organization: organization.name,
        timeframe
      }
    };
  } else {
    return {
      success: false,
      qualityGateFailed: true,
      quality,
      targetQuality,
      gaps: qualityResult.gaps,
      recommendations: qualityResult.recommendations,
      metadata: {
        processId: 'specializations/domains/business/public-relations/reputation-recovery-strategy',
        timestamp: ctx.now()
      }
    };
  }
}

// Task Definitions

export const assessReputationDamageTask = defineTask('assess-reputation-damage', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess Reputation Damage',
  agent: {
    name: 'damage-assessor',
    prompt: {
      role: 'Reputation research specialist assessing damage scope',
      task: 'Comprehensively assess reputation damage',
      context: args,
      instructions: [
        'Quantify overall reputation impact',
        'Assess damage by stakeholder group',
        'Evaluate brand attribute damage',
        'Measure trust and credibility impact',
        'Assess business impact (sales, partnerships)',
        'Evaluate employee morale and engagement',
        'Compare to pre-event baseline',
        'Identify most damaged reputation dimensions'
      ],
      outputFormat: 'JSON with overallDamageLevel, stakeholderDamage, brandAttributes, trustImpact, businessImpact, employeeImpact, baselineComparison, damagedDimensions, summary'
    },
    outputSchema: {
      type: 'object',
      required: ['overallDamageLevel', 'stakeholderDamage', 'summary'],
      properties: {
        overallDamageLevel: { type: 'string' },
        stakeholderDamage: { type: 'object' },
        brandAttributes: { type: 'object' },
        trustImpact: { type: 'object' },
        businessImpact: { type: 'object' },
        employeeImpact: { type: 'object' },
        baselineComparison: { type: 'object' },
        damagedDimensions: { type: 'array', items: { type: 'object' } },
        summary: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'damage-assessment']
}));

export const prioritizeStakeholderRecoveryTask = defineTask('prioritize-stakeholder-recovery', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prioritize Stakeholder Recovery',
  agent: {
    name: 'stakeholder-recovery-prioritizer',
    prompt: {
      role: 'Stakeholder strategist prioritizing recovery efforts',
      task: 'Prioritize stakeholder groups for recovery focus',
      context: args,
      instructions: [
        'Rank stakeholders by damage severity',
        'Assess stakeholder strategic importance',
        'Evaluate recovery difficulty by group',
        'Consider resource requirements',
        'Identify quick wins vs. long-term efforts',
        'Consider stakeholder interdependencies',
        'Define recovery sequence',
        'Allocate effort by stakeholder'
      ],
      outputFormat: 'JSON with prioritizedStakeholders array (stakeholder, damageSeverity, importance, recoveryDifficulty, effort), recoverySequence, quickWins, longTermEfforts'
    },
    outputSchema: {
      type: 'object',
      required: ['prioritizedStakeholders', 'recoverySequence'],
      properties: {
        prioritizedStakeholders: { type: 'array', items: { type: 'object' } },
        recoverySequence: { type: 'array', items: { type: 'string' } },
        quickWins: { type: 'array', items: { type: 'object' } },
        longTermEfforts: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'stakeholder-prioritization']
}));

export const developRecoveryStrategyTask = defineTask('develop-recovery-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Recovery Strategy',
  agent: {
    name: 'recovery-strategist',
    prompt: {
      role: 'Reputation recovery specialist developing strategic approach',
      task: 'Develop comprehensive reputation recovery strategy',
      context: args,
      instructions: [
        'Define recovery approach (rebuild, rebrand, reinforce)',
        'Set recovery objectives and targets',
        'Define phased recovery timeline',
        'Identify key recovery initiatives',
        'Define resource allocation',
        'Plan leadership visibility strategy',
        'Define corporate actions needed',
        'Create recovery roadmap'
      ],
      outputFormat: 'JSON with approach, objectives, timeline, initiatives, resourceAllocation, leadershipStrategy, corporateActions, roadmap'
    },
    outputSchema: {
      type: 'object',
      required: ['approach', 'objectives', 'timeline', 'initiatives'],
      properties: {
        approach: { type: 'string' },
        objectives: { type: 'array', items: { type: 'object' } },
        timeline: { type: 'object' },
        initiatives: { type: 'array', items: { type: 'object' } },
        resourceAllocation: { type: 'object' },
        leadershipStrategy: { type: 'object' },
        corporateActions: { type: 'array', items: { type: 'object' } },
        roadmap: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'recovery-strategy']
}));

export const developRecoveryMessagingTask = defineTask('develop-recovery-messaging', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Recovery Messaging',
  agent: {
    name: 'recovery-messaging-developer',
    prompt: {
      role: 'Communications strategist developing recovery messaging',
      task: 'Develop messaging strategy for reputation recovery',
      context: args,
      instructions: [
        'Define recovery narrative arc',
        'Develop accountability messaging',
        'Create action and progress messaging',
        'Develop stakeholder-specific messages',
        'Define proof points and evidence',
        'Create milestone communication approach',
        'Define tone and voice for recovery',
        'Plan message evolution over time'
      ],
      outputFormat: 'JSON with narrativeArc, accountabilityMessaging, actionMessaging, stakeholderMessages, proofPoints, milestoneApproach, toneVoice, messageEvolution'
    },
    outputSchema: {
      type: 'object',
      required: ['narrativeArc', 'accountabilityMessaging', 'actionMessaging'],
      properties: {
        narrativeArc: { type: 'object' },
        accountabilityMessaging: { type: 'object' },
        actionMessaging: { type: 'object' },
        stakeholderMessages: { type: 'object' },
        proofPoints: { type: 'array', items: { type: 'object' } },
        milestoneApproach: { type: 'object' },
        toneVoice: { type: 'object' },
        messageEvolution: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'recovery-messaging']
}));

export const planThirdPartyValidationTask = defineTask('plan-third-party-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan Third-Party Validation',
  agent: {
    name: 'validation-planner',
    prompt: {
      role: 'Credibility building specialist planning third-party validation',
      task: 'Plan third-party validation to support recovery',
      context: args,
      instructions: [
        'Identify credible third-party validators',
        'Plan independent audit or review',
        'Identify industry certification opportunities',
        'Plan expert endorsement strategy',
        'Identify analyst and media validation',
        'Plan customer testimonial strategy',
        'Define timeline for validation milestones',
        'Create validation communication plan'
      ],
      outputFormat: 'JSON with validators, auditPlan, certifications, expertEndorsements, analystValidation, testimonialStrategy, validationTimeline, communicationPlan'
    },
    outputSchema: {
      type: 'object',
      required: ['validators', 'validationTimeline'],
      properties: {
        validators: { type: 'array', items: { type: 'object' } },
        auditPlan: { type: 'object' },
        certifications: { type: 'array', items: { type: 'object' } },
        expertEndorsements: { type: 'array', items: { type: 'object' } },
        analystValidation: { type: 'object' },
        testimonialStrategy: { type: 'object' },
        validationTimeline: { type: 'object' },
        communicationPlan: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'third-party-validation']
}));

export const developStakeholderEngagementTask = defineTask('develop-stakeholder-engagement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Stakeholder Engagement Plan',
  agent: {
    name: 'stakeholder-engagement-developer',
    prompt: {
      role: 'Stakeholder relations specialist developing engagement plan',
      task: 'Develop stakeholder engagement plan for recovery',
      context: args,
      instructions: [
        'Define engagement approach per stakeholder',
        'Plan leadership outreach and listening',
        'Develop dialogue and feedback mechanisms',
        'Plan stakeholder advisory involvement',
        'Define engagement frequency and touchpoints',
        'Create escalation protocols',
        'Plan relationship repair activities',
        'Define engagement success metrics'
      ],
      outputFormat: 'JSON with engagementApproaches, leadershipOutreach, dialogueMechanisms, advisoryInvolvement, touchpoints, escalationProtocols, repairActivities, successMetrics'
    },
    outputSchema: {
      type: 'object',
      required: ['engagementApproaches', 'touchpoints'],
      properties: {
        engagementApproaches: { type: 'object' },
        leadershipOutreach: { type: 'object' },
        dialogueMechanisms: { type: 'array', items: { type: 'object' } },
        advisoryInvolvement: { type: 'object' },
        touchpoints: { type: 'object' },
        escalationProtocols: { type: 'object' },
        repairActivities: { type: 'array', items: { type: 'object' } },
        successMetrics: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'stakeholder-engagement']
}));

export const createCommunicationsPlanTask = defineTask('create-communications-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Communications Plan',
  agent: {
    name: 'communications-planner',
    prompt: {
      role: 'Communications planning specialist creating recovery comms plan',
      task: 'Create comprehensive communications plan for recovery',
      context: args,
      instructions: [
        'Define communications phases and cadence',
        'Plan channel strategy for recovery',
        'Create content calendar',
        'Plan proactive vs. reactive communications',
        'Define spokesperson strategy',
        'Plan internal communications',
        'Define social media approach',
        'Create media relations plan'
      ],
      outputFormat: 'JSON with phases, channels, contentCalendar, proactiveReactive, spokespersonStrategy, internalComms, socialMediaApproach, mediaRelationsPlan'
    },
    outputSchema: {
      type: 'object',
      required: ['phases', 'channels', 'contentCalendar'],
      properties: {
        phases: { type: 'array', items: { type: 'object' } },
        channels: { type: 'object' },
        contentCalendar: { type: 'object' },
        proactiveReactive: { type: 'object' },
        spokespersonStrategy: { type: 'object' },
        internalComms: { type: 'object' },
        socialMediaApproach: { type: 'object' },
        mediaRelationsPlan: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'communications-plan']
}));

export const defineOperationalActionsTask = defineTask('define-operational-actions', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define Operational Recovery Actions',
  agent: {
    name: 'operational-actions-planner',
    prompt: {
      role: 'Operations strategist defining recovery actions',
      task: 'Define operational actions to support reputation recovery',
      context: args,
      instructions: [
        'Identify root cause remediation actions',
        'Define policy and process changes',
        'Plan governance improvements',
        'Define accountability measures',
        'Plan training and capability building',
        'Define product or service improvements',
        'Plan compliance enhancements',
        'Create operational action timeline'
      ],
      outputFormat: 'JSON with rootCauseRemediation, policyChanges, governanceImprovements, accountabilityMeasures, trainingPlan, serviceImprovements, complianceEnhancements, actionTimeline'
    },
    outputSchema: {
      type: 'object',
      required: ['rootCauseRemediation', 'actionTimeline'],
      properties: {
        rootCauseRemediation: { type: 'array', items: { type: 'object' } },
        policyChanges: { type: 'array', items: { type: 'object' } },
        governanceImprovements: { type: 'array', items: { type: 'object' } },
        accountabilityMeasures: { type: 'array', items: { type: 'object' } },
        trainingPlan: { type: 'object' },
        serviceImprovements: { type: 'array', items: { type: 'object' } },
        complianceEnhancements: { type: 'array', items: { type: 'object' } },
        actionTimeline: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'operational-actions']
}));

export const establishMeasurementFrameworkTask = defineTask('establish-measurement-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish Measurement Framework',
  agent: {
    name: 'measurement-framework-builder',
    prompt: {
      role: 'PR measurement specialist establishing recovery metrics',
      task: 'Establish measurement framework for recovery tracking',
      context: args,
      instructions: [
        'Define reputation recovery KPIs',
        'Set recovery milestones and targets',
        'Establish tracking cadence',
        'Define stakeholder perception metrics',
        'Plan sentiment and coverage tracking',
        'Define business impact metrics',
        'Create recovery dashboard',
        'Define reporting approach'
      ],
      outputFormat: 'JSON with kpis, milestones, trackingCadence, perceptionMetrics, sentimentTracking, businessMetrics, dashboard, reportingApproach'
    },
    outputSchema: {
      type: 'object',
      required: ['kpis', 'milestones', 'trackingCadence'],
      properties: {
        kpis: { type: 'array', items: { type: 'object' } },
        milestones: { type: 'array', items: { type: 'object' } },
        trackingCadence: { type: 'string' },
        perceptionMetrics: { type: 'array', items: { type: 'object' } },
        sentimentTracking: { type: 'object' },
        businessMetrics: { type: 'array', items: { type: 'object' } },
        dashboard: { type: 'object' },
        reportingApproach: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'measurement-framework']
}));

export const validateRecoveryStrategyTask = defineTask('validate-recovery-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate Recovery Strategy Quality',
  agent: {
    name: 'recovery-strategy-validator',
    prompt: {
      role: 'Reputation recovery quality assessor',
      task: 'Validate reputation recovery strategy quality',
      context: args,
      instructions: [
        'Assess strategy comprehensiveness',
        'Evaluate messaging authenticity',
        'Review third-party validation plan',
        'Assess stakeholder engagement depth',
        'Evaluate communications plan feasibility',
        'Review operational action adequacy',
        'Assess measurement framework rigor',
        'Provide overall quality score (0-100)'
      ],
      outputFormat: 'JSON with score, passed, strategyScore, messagingScore, validationScore, engagementScore, commsScore, operationalScore, measurementScore, gaps, recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'passed'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        passed: { type: 'boolean' },
        strategyScore: { type: 'number' },
        messagingScore: { type: 'number' },
        validationScore: { type: 'number' },
        engagementScore: { type: 'number' },
        commsScore: { type: 'number' },
        operationalScore: { type: 'number' },
        measurementScore: { type: 'number' },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'quality-validation']
}));
