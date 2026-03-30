/**
 * @process specializations/domains/business/public-relations/internal-communications-strategy
 * @description Develop comprehensive employee communications strategy including channel mix, content themes, cascade protocols, and engagement measurement using ADKAR change model
 * @specialization Public Relations and Communications
 * @category Internal Communications
 * @inputs { organization: object, employeeBase: object, currentChannels: object[], strategicPriorities: object[] }
 * @outputs { success: boolean, strategy: object, channelPlan: object, contentFramework: object, quality: number }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organization,
    employeeBase = {},
    currentChannels = [],
    strategicPriorities = [],
    cultureGoals = {},
    targetQuality = 85
  } = inputs;

  // Phase 1: Internal Communications Audit
  await ctx.breakpoint({
    question: 'Starting internal communications strategy. Audit current state?',
    title: 'Phase 1: Communications Audit',
    context: {
      runId: ctx.runId,
      phase: 'communications-audit',
      organization: organization.name
    }
  });

  const [commsAudit, employeeAnalysis] = await Promise.all([
    ctx.task(auditInternalCommsTask, {
      currentChannels,
      organization
    }),
    ctx.task(analyzeEmployeeBaseTask, {
      employeeBase,
      organization
    })
  ]);

  // Phase 2: Strategy Framework Development
  await ctx.breakpoint({
    question: 'Audit complete. Develop strategy framework?',
    title: 'Phase 2: Strategy Framework',
    context: {
      runId: ctx.runId,
      phase: 'strategy-framework'
    }
  });

  const strategyFramework = await ctx.task(developStrategyFrameworkTask, {
    commsAudit,
    employeeAnalysis,
    strategicPriorities,
    cultureGoals
  });

  // Phase 3: Channel Strategy
  await ctx.breakpoint({
    question: 'Framework developed. Define channel strategy?',
    title: 'Phase 3: Channel Strategy',
    context: {
      runId: ctx.runId,
      phase: 'channel-strategy'
    }
  });

  const channelStrategy = await ctx.task(defineChannelStrategyTask, {
    commsAudit,
    employeeAnalysis,
    strategyFramework
  });

  // Phase 4: Content Framework (ADKAR Integration)
  await ctx.breakpoint({
    question: 'Channels defined. Create content framework with ADKAR model?',
    title: 'Phase 4: Content Framework',
    context: {
      runId: ctx.runId,
      phase: 'content-framework'
    }
  });

  const contentFramework = await ctx.task(createContentFrameworkTask, {
    strategyFramework,
    channelStrategy,
    strategicPriorities
  });

  // Phase 5: Cascade Protocol Development
  await ctx.breakpoint({
    question: 'Content framework ready. Develop cascade protocols?',
    title: 'Phase 5: Cascade Protocols',
    context: {
      runId: ctx.runId,
      phase: 'cascade-protocols'
    }
  });

  const cascadeProtocols = await ctx.task(developCascadeProtocolsTask, {
    organization,
    channelStrategy,
    employeeAnalysis
  });

  // Phase 6: Leader Communication Enablement
  await ctx.breakpoint({
    question: 'Cascade defined. Plan leader communication enablement?',
    title: 'Phase 6: Leader Enablement',
    context: {
      runId: ctx.runId,
      phase: 'leader-enablement'
    }
  });

  const leaderEnablement = await ctx.task(planLeaderEnablementTask, {
    cascadeProtocols,
    strategyFramework,
    organization
  });

  // Phase 7: Engagement Measurement Framework
  await ctx.breakpoint({
    question: 'Enablement planned. Define engagement measurement?',
    title: 'Phase 7: Measurement Framework',
    context: {
      runId: ctx.runId,
      phase: 'measurement-framework'
    }
  });

  const measurementFramework = await ctx.task(defineMeasurementFrameworkTask, {
    strategyFramework,
    channelStrategy,
    contentFramework
  });

  // Phase 8: Quality Validation
  await ctx.breakpoint({
    question: 'Validate internal communications strategy quality?',
    title: 'Phase 8: Quality Validation',
    context: {
      runId: ctx.runId,
      phase: 'quality-validation',
      targetQuality
    }
  });

  const qualityResult = await ctx.task(validateInternalCommsStrategyTask, {
    commsAudit,
    strategyFramework,
    channelStrategy,
    contentFramework,
    cascadeProtocols,
    leaderEnablement,
    measurementFramework,
    targetQuality
  });

  const quality = qualityResult.score;

  if (quality >= targetQuality) {
    return {
      success: true,
      strategy: {
        framework: strategyFramework,
        cascadeProtocols,
        leaderEnablement,
        measurementFramework
      },
      channelPlan: channelStrategy,
      contentFramework,
      auditInsights: commsAudit.insights,
      quality,
      targetQuality,
      metadata: {
        processId: 'specializations/domains/business/public-relations/internal-communications-strategy',
        timestamp: ctx.now(),
        organization: organization.name
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
        processId: 'specializations/domains/business/public-relations/internal-communications-strategy',
        timestamp: ctx.now()
      }
    };
  }
}

// Task Definitions

export const auditInternalCommsTask = defineTask('audit-internal-comms', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Audit Internal Communications',
  agent: {
    name: 'internal-comms-auditor',
    prompt: {
      role: 'Internal communications specialist auditing current state',
      task: 'Audit current internal communications effectiveness',
      context: args,
      instructions: [
        'Assess current channel effectiveness',
        'Evaluate content quality and relevance',
        'Measure employee reach and engagement',
        'Identify communication gaps',
        'Assess leadership communication effectiveness',
        'Evaluate two-way communication mechanisms',
        'Benchmark against best practices',
        'Identify improvement opportunities'
      ],
      outputFormat: 'JSON with channelEffectiveness, contentAssessment, reachEngagement, gaps, leadershipComms, twoWayMechanisms, benchmarks, opportunities, insights'
    },
    outputSchema: {
      type: 'object',
      required: ['channelEffectiveness', 'gaps', 'insights'],
      properties: {
        channelEffectiveness: { type: 'object' },
        contentAssessment: { type: 'object' },
        reachEngagement: { type: 'object' },
        gaps: { type: 'array', items: { type: 'object' } },
        leadershipComms: { type: 'object' },
        twoWayMechanisms: { type: 'object' },
        benchmarks: { type: 'object' },
        opportunities: { type: 'array', items: { type: 'object' } },
        insights: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'internal-comms-audit']
}));

export const analyzeEmployeeBaseTask = defineTask('analyze-employee-base', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Employee Base',
  agent: {
    name: 'employee-base-analyst',
    prompt: {
      role: 'Employee communications analyst understanding workforce',
      task: 'Analyze employee base for communications planning',
      context: args,
      instructions: [
        'Segment employee population',
        'Understand channel access by segment',
        'Identify information needs by group',
        'Assess communication preferences',
        'Understand geographic and shift considerations',
        'Identify frontline vs. desk worker needs',
        'Assess language requirements',
        'Identify high-influence employee groups'
      ],
      outputFormat: 'JSON with segments, channelAccess, informationNeeds, preferences, geographicConsiderations, frontlineNeeds, languageRequirements, influenceGroups'
    },
    outputSchema: {
      type: 'object',
      required: ['segments', 'channelAccess', 'informationNeeds'],
      properties: {
        segments: { type: 'array', items: { type: 'object' } },
        channelAccess: { type: 'object' },
        informationNeeds: { type: 'object' },
        preferences: { type: 'object' },
        geographicConsiderations: { type: 'array', items: { type: 'object' } },
        frontlineNeeds: { type: 'object' },
        languageRequirements: { type: 'array', items: { type: 'string' } },
        influenceGroups: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'employee-analysis']
}));

export const developStrategyFrameworkTask = defineTask('develop-strategy-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Strategy Framework',
  agent: {
    name: 'strategy-framework-developer',
    prompt: {
      role: 'Internal communications strategist developing framework',
      task: 'Develop comprehensive internal communications strategy framework',
      context: args,
      instructions: [
        'Define internal communications vision',
        'Establish strategic objectives',
        'Define guiding principles',
        'Align with business and culture goals',
        'Define key messages and themes',
        'Establish tone and voice guidelines',
        'Define governance and ownership',
        'Create strategy roadmap'
      ],
      outputFormat: 'JSON with vision, objectives, principles, businessAlignment, keyMessages, toneVoice, governance, roadmap'
    },
    outputSchema: {
      type: 'object',
      required: ['vision', 'objectives', 'keyMessages'],
      properties: {
        vision: { type: 'string' },
        objectives: { type: 'array', items: { type: 'object' } },
        principles: { type: 'array', items: { type: 'string' } },
        businessAlignment: { type: 'object' },
        keyMessages: { type: 'array', items: { type: 'object' } },
        toneVoice: { type: 'object' },
        governance: { type: 'object' },
        roadmap: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'strategy-framework']
}));

export const defineChannelStrategyTask = defineTask('define-channel-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define Channel Strategy',
  agent: {
    name: 'channel-strategist',
    prompt: {
      role: 'Multi-channel communications specialist defining channel mix',
      task: 'Define internal communications channel strategy',
      context: args,
      instructions: [
        'Define channel ecosystem and roles',
        'Assign content types to channels',
        'Define channel for each employee segment',
        'Establish channel hierarchy',
        'Define push vs. pull channel strategy',
        'Plan digital workplace integration',
        'Define mobile strategy',
        'Create channel governance'
      ],
      outputFormat: 'JSON with channelEcosystem, contentAssignment, segmentChannels, channelHierarchy, pushPullStrategy, digitalWorkplace, mobileStrategy, channelGovernance'
    },
    outputSchema: {
      type: 'object',
      required: ['channelEcosystem', 'contentAssignment'],
      properties: {
        channelEcosystem: { type: 'array', items: { type: 'object' } },
        contentAssignment: { type: 'object' },
        segmentChannels: { type: 'object' },
        channelHierarchy: { type: 'object' },
        pushPullStrategy: { type: 'object' },
        digitalWorkplace: { type: 'object' },
        mobileStrategy: { type: 'object' },
        channelGovernance: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'channel-strategy']
}));

export const createContentFrameworkTask = defineTask('create-content-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Content Framework (ADKAR)',
  agent: {
    name: 'content-framework-creator',
    prompt: {
      role: 'Content strategist creating ADKAR-integrated framework',
      task: 'Create content framework using ADKAR change model',
      context: args,
      instructions: [
        'Define content pillars and themes',
        'Map content to ADKAR stages (Awareness, Desire, Knowledge, Ability, Reinforcement)',
        'Create content types for each stage',
        'Define storytelling approach',
        'Plan executive communications content',
        'Define employee-generated content approach',
        'Create editorial calendar framework',
        'Define content governance'
      ],
      outputFormat: 'JSON with contentPillars, adkarMapping, contentTypes, storytellingApproach, executiveContent, employeeGenerated, editorialCalendar, contentGovernance'
    },
    outputSchema: {
      type: 'object',
      required: ['contentPillars', 'adkarMapping', 'contentTypes'],
      properties: {
        contentPillars: { type: 'array', items: { type: 'object' } },
        adkarMapping: { type: 'object' },
        contentTypes: { type: 'array', items: { type: 'object' } },
        storytellingApproach: { type: 'object' },
        executiveContent: { type: 'object' },
        employeeGenerated: { type: 'object' },
        editorialCalendar: { type: 'object' },
        contentGovernance: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'content-framework']
}));

export const developCascadeProtocolsTask = defineTask('develop-cascade-protocols', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Cascade Protocols',
  agent: {
    name: 'cascade-protocol-developer',
    prompt: {
      role: 'Communications cascade specialist developing protocols',
      task: 'Develop message cascade protocols',
      context: args,
      instructions: [
        'Define cascade levels and sequence',
        'Create timing protocols for different message types',
        'Define leader briefing process',
        'Create talking points and FAQ process',
        'Define feedback loop mechanisms',
        'Create urgency/priority classifications',
        'Define confidentiality protocols',
        'Create cascade measurement approach'
      ],
      outputFormat: 'JSON with cascadeLevels, timingProtocols, leaderBriefing, talkingPointsProcess, feedbackLoops, priorityClassifications, confidentiality, measurement'
    },
    outputSchema: {
      type: 'object',
      required: ['cascadeLevels', 'timingProtocols', 'leaderBriefing'],
      properties: {
        cascadeLevels: { type: 'array', items: { type: 'object' } },
        timingProtocols: { type: 'object' },
        leaderBriefing: { type: 'object' },
        talkingPointsProcess: { type: 'object' },
        feedbackLoops: { type: 'array', items: { type: 'object' } },
        priorityClassifications: { type: 'array', items: { type: 'object' } },
        confidentiality: { type: 'object' },
        measurement: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'cascade-protocols']
}));

export const planLeaderEnablementTask = defineTask('plan-leader-enablement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan Leader Communication Enablement',
  agent: {
    name: 'leader-enablement-planner',
    prompt: {
      role: 'Leadership communications specialist planning enablement',
      task: 'Plan leader communication enablement program',
      context: args,
      instructions: [
        'Define leader communication expectations',
        'Create leader communication toolkit',
        'Plan leader communication training',
        'Develop team meeting guidance',
        'Create one-on-one conversation guides',
        'Develop difficult conversation support',
        'Plan leader feedback mechanisms',
        'Create leader communication recognition'
      ],
      outputFormat: 'JSON with expectations, toolkit, training, teamMeetingGuidance, oneOnOneGuides, difficultConversations, feedbackMechanisms, recognition'
    },
    outputSchema: {
      type: 'object',
      required: ['expectations', 'toolkit', 'training'],
      properties: {
        expectations: { type: 'object' },
        toolkit: { type: 'array', items: { type: 'object' } },
        training: { type: 'object' },
        teamMeetingGuidance: { type: 'object' },
        oneOnOneGuides: { type: 'array', items: { type: 'object' } },
        difficultConversations: { type: 'object' },
        feedbackMechanisms: { type: 'array', items: { type: 'object' } },
        recognition: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'leader-enablement']
}));

export const defineMeasurementFrameworkTask = defineTask('define-measurement-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define Engagement Measurement Framework',
  agent: {
    name: 'measurement-framework-definer',
    prompt: {
      role: 'Internal communications measurement specialist',
      task: 'Define engagement measurement framework',
      context: args,
      instructions: [
        'Define reach and delivery metrics',
        'Establish engagement metrics',
        'Define understanding metrics',
        'Create behavior change metrics',
        'Establish sentiment tracking',
        'Define channel-specific metrics',
        'Create dashboard and reporting approach',
        'Define improvement feedback loop'
      ],
      outputFormat: 'JSON with reachMetrics, engagementMetrics, understandingMetrics, behaviorMetrics, sentimentTracking, channelMetrics, dashboard, feedbackLoop'
    },
    outputSchema: {
      type: 'object',
      required: ['reachMetrics', 'engagementMetrics'],
      properties: {
        reachMetrics: { type: 'array', items: { type: 'object' } },
        engagementMetrics: { type: 'array', items: { type: 'object' } },
        understandingMetrics: { type: 'array', items: { type: 'object' } },
        behaviorMetrics: { type: 'array', items: { type: 'object' } },
        sentimentTracking: { type: 'object' },
        channelMetrics: { type: 'object' },
        dashboard: { type: 'object' },
        feedbackLoop: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'measurement-framework']
}));

export const validateInternalCommsStrategyTask = defineTask('validate-internal-comms-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate Internal Communications Strategy Quality',
  agent: {
    name: 'internal-comms-strategy-validator',
    prompt: {
      role: 'Internal communications quality assessor',
      task: 'Validate internal communications strategy quality',
      context: args,
      instructions: [
        'Assess audit thoroughness',
        'Evaluate strategy framework clarity',
        'Review channel strategy completeness',
        'Assess content framework effectiveness',
        'Evaluate cascade protocol practicality',
        'Review leader enablement adequacy',
        'Assess measurement framework rigor',
        'Provide overall quality score (0-100)'
      ],
      outputFormat: 'JSON with score, passed, auditScore, frameworkScore, channelScore, contentScore, cascadeScore, enablementScore, measurementScore, gaps, recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'passed'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        passed: { type: 'boolean' },
        auditScore: { type: 'number' },
        frameworkScore: { type: 'number' },
        channelScore: { type: 'number' },
        contentScore: { type: 'number' },
        cascadeScore: { type: 'number' },
        enablementScore: { type: 'number' },
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
