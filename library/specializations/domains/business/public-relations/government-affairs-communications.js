/**
 * @process specializations/domains/business/public-relations/government-affairs-communications
 * @description Manage communications with government officials, regulators, and policy makers, track legislative developments, and coordinate advocacy messaging
 * @specialization Public Relations and Communications
 * @category Stakeholder Communications
 * @inputs { organization: object, policyPriorities: object[], regulatoryLandscape: object, governmentContacts: object[] }
 * @outputs { success: boolean, gaStrategy: object, advocacyPlan: object, stakeholderEngagement: object, quality: number }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organization,
    policyPriorities = [],
    regulatoryLandscape = {},
    governmentContacts = [],
    industryAssociations = [],
    targetQuality = 85
  } = inputs;

  // Phase 1: Policy Landscape Analysis
  await ctx.breakpoint({
    question: 'Starting government affairs communications. Analyze policy landscape?',
    title: 'Phase 1: Landscape Analysis',
    context: {
      runId: ctx.runId,
      phase: 'landscape-analysis',
      organization: organization.name
    }
  });

  const [policyAnalysis, regulatoryAnalysis] = await Promise.all([
    ctx.task(analyzePolicyLandscapeTask, {
      policyPriorities,
      organization
    }),
    ctx.task(analyzeRegulatoryEnvironmentTask, {
      regulatoryLandscape,
      organization
    })
  ]);

  // Phase 2: Stakeholder Mapping (Government)
  await ctx.breakpoint({
    question: 'Landscape analyzed. Map government stakeholders?',
    title: 'Phase 2: Government Stakeholder Mapping',
    context: {
      runId: ctx.runId,
      phase: 'stakeholder-mapping'
    }
  });

  const governmentStakeholderMap = await ctx.task(mapGovernmentStakeholdersTask, {
    governmentContacts,
    policyPriorities,
    regulatoryLandscape
  });

  // Phase 3: Advocacy Position Development
  await ctx.breakpoint({
    question: 'Stakeholders mapped. Develop advocacy positions?',
    title: 'Phase 3: Advocacy Positions',
    context: {
      runId: ctx.runId,
      phase: 'advocacy-positions'
    }
  });

  const advocacyPositions = await ctx.task(developAdvocacyPositionsTask, {
    policyPriorities,
    policyAnalysis,
    organization
  });

  // Phase 4: Messaging Framework (Government)
  await ctx.breakpoint({
    question: 'Positions developed. Create government affairs messaging?',
    title: 'Phase 4: Messaging Framework',
    context: {
      runId: ctx.runId,
      phase: 'messaging-framework'
    }
  });

  const messagingFramework = await ctx.task(createGaMessagingTask, {
    advocacyPositions,
    governmentStakeholderMap,
    organization
  });

  // Phase 5: Engagement Strategy
  await ctx.breakpoint({
    question: 'Messaging created. Develop engagement strategy?',
    title: 'Phase 5: Engagement Strategy',
    context: {
      runId: ctx.runId,
      phase: 'engagement-strategy'
    }
  });

  const engagementStrategy = await ctx.task(developGaEngagementTask, {
    governmentStakeholderMap,
    advocacyPositions,
    messagingFramework
  });

  // Phase 6: Coalition Building Plan
  await ctx.breakpoint({
    question: 'Engagement strategy defined. Plan coalition building?',
    title: 'Phase 6: Coalition Building',
    context: {
      runId: ctx.runId,
      phase: 'coalition-building',
      associationCount: industryAssociations.length
    }
  });

  const coalitionPlan = await ctx.task(planCoalitionBuildingTask, {
    industryAssociations,
    advocacyPositions,
    policyPriorities
  });

  // Phase 7: Legislative Tracking System
  await ctx.breakpoint({
    question: 'Coalition planned. Set up legislative tracking?',
    title: 'Phase 7: Legislative Tracking',
    context: {
      runId: ctx.runId,
      phase: 'legislative-tracking'
    }
  });

  const legislativeTracking = await ctx.task(setupLegislativeTrackingTask, {
    policyPriorities,
    regulatoryLandscape
  });

  // Phase 8: Quality Validation
  await ctx.breakpoint({
    question: 'Validate government affairs communications quality?',
    title: 'Phase 8: Quality Validation',
    context: {
      runId: ctx.runId,
      phase: 'quality-validation',
      targetQuality
    }
  });

  const qualityResult = await ctx.task(validateGaCommsQualityTask, {
    policyAnalysis,
    regulatoryAnalysis,
    governmentStakeholderMap,
    advocacyPositions,
    messagingFramework,
    engagementStrategy,
    coalitionPlan,
    legislativeTracking,
    targetQuality
  });

  const quality = qualityResult.score;

  if (quality >= targetQuality) {
    return {
      success: true,
      gaStrategy: {
        policyAnalysis: policyAnalysis.summary,
        regulatoryAnalysis: regulatoryAnalysis.summary,
        advocacyPositions: advocacyPositions.positions,
        messagingFramework
      },
      advocacyPlan: {
        engagementStrategy,
        coalitionPlan,
        legislativeTracking
      },
      stakeholderEngagement: governmentStakeholderMap,
      quality,
      targetQuality,
      metadata: {
        processId: 'specializations/domains/business/public-relations/government-affairs-communications',
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
        processId: 'specializations/domains/business/public-relations/government-affairs-communications',
        timestamp: ctx.now()
      }
    };
  }
}

// Task Definitions

export const analyzePolicyLandscapeTask = defineTask('analyze-policy-landscape', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Policy Landscape',
  agent: {
    name: 'policy-landscape-analyst',
    prompt: {
      role: 'Government affairs specialist analyzing policy environment',
      task: 'Analyze policy landscape affecting organization',
      context: args,
      instructions: [
        'Identify current legislative initiatives affecting organization',
        'Track pending legislation and regulatory changes',
        'Assess political environment and trends',
        'Identify policy opportunities and threats',
        'Map key policy makers and committees',
        'Assess timing and urgency of policy actions',
        'Identify regulatory agency priorities',
        'Analyze competitor policy positions'
      ],
      outputFormat: 'JSON with legislativeInitiatives, pendingChanges, politicalEnvironment, opportunities, threats, keyPolicyMakers, timing, regulatoryPriorities, competitorPositions, summary'
    },
    outputSchema: {
      type: 'object',
      required: ['legislativeInitiatives', 'opportunities', 'threats', 'summary'],
      properties: {
        legislativeInitiatives: { type: 'array', items: { type: 'object' } },
        pendingChanges: { type: 'array', items: { type: 'object' } },
        politicalEnvironment: { type: 'object' },
        opportunities: { type: 'array', items: { type: 'object' } },
        threats: { type: 'array', items: { type: 'object' } },
        keyPolicyMakers: { type: 'array', items: { type: 'object' } },
        timing: { type: 'object' },
        regulatoryPriorities: { type: 'array', items: { type: 'object' } },
        competitorPositions: { type: 'array', items: { type: 'object' } },
        summary: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'policy-analysis']
}));

export const analyzeRegulatoryEnvironmentTask = defineTask('analyze-regulatory-environment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Regulatory Environment',
  agent: {
    name: 'regulatory-analyst',
    prompt: {
      role: 'Regulatory affairs specialist analyzing compliance landscape',
      task: 'Analyze regulatory environment and requirements',
      context: args,
      instructions: [
        'Map relevant regulatory agencies and jurisdictions',
        'Identify current regulatory requirements',
        'Track proposed rule changes and comment periods',
        'Assess enforcement trends and priorities',
        'Identify compliance gaps and risks',
        'Map regulatory decision-makers',
        'Assess industry regulatory relationships',
        'Identify advocacy opportunities in regulatory process'
      ],
      outputFormat: 'JSON with agencies, currentRequirements, proposedChanges, enforcementTrends, complianceGaps, decisionMakers, industryRelationships, advocacyOpportunities, summary'
    },
    outputSchema: {
      type: 'object',
      required: ['agencies', 'currentRequirements', 'summary'],
      properties: {
        agencies: { type: 'array', items: { type: 'object' } },
        currentRequirements: { type: 'array', items: { type: 'object' } },
        proposedChanges: { type: 'array', items: { type: 'object' } },
        enforcementTrends: { type: 'array', items: { type: 'object' } },
        complianceGaps: { type: 'array', items: { type: 'object' } },
        decisionMakers: { type: 'array', items: { type: 'object' } },
        industryRelationships: { type: 'object' },
        advocacyOpportunities: { type: 'array', items: { type: 'object' } },
        summary: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'regulatory-analysis']
}));

export const mapGovernmentStakeholdersTask = defineTask('map-government-stakeholders', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map Government Stakeholders',
  agent: {
    name: 'government-stakeholder-mapper',
    prompt: {
      role: 'Government relations specialist mapping key contacts',
      task: 'Map government and regulatory stakeholders',
      context: args,
      instructions: [
        'Identify key legislators and their staff',
        'Map relevant committee members',
        'Identify regulatory agency contacts',
        'Assess relationship status with each contact',
        'Map influence networks and advisors',
        'Identify district/local connections',
        'Assess positions and potential alignment',
        'Prioritize engagement targets'
      ],
      outputFormat: 'JSON with legislators, committeeMembers, regulators, relationshipStatus, influenceNetworks, localConnections, positionAlignment, engagementPriority'
    },
    outputSchema: {
      type: 'object',
      required: ['legislators', 'regulators', 'engagementPriority'],
      properties: {
        legislators: { type: 'array', items: { type: 'object' } },
        committeeMembers: { type: 'array', items: { type: 'object' } },
        regulators: { type: 'array', items: { type: 'object' } },
        relationshipStatus: { type: 'object' },
        influenceNetworks: { type: 'array', items: { type: 'object' } },
        localConnections: { type: 'array', items: { type: 'object' } },
        positionAlignment: { type: 'object' },
        engagementPriority: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'government-stakeholders']
}));

export const developAdvocacyPositionsTask = defineTask('develop-advocacy-positions', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Advocacy Positions',
  agent: {
    name: 'advocacy-position-developer',
    prompt: {
      role: 'Policy strategist developing advocacy positions',
      task: 'Develop clear advocacy positions on priority issues',
      context: args,
      instructions: [
        'Define position on each policy priority',
        'Develop rationale and evidence base',
        'Create supporting data and research',
        'Identify economic impact arguments',
        'Develop constituent impact narratives',
        'Create position papers and one-pagers',
        'Define acceptable compromises',
        'Align with broader industry positions'
      ],
      outputFormat: 'JSON with positions array (issue, position, rationale, evidence, economicImpact, constituentNarrative, compromises), positionPapers, industryAlignment'
    },
    outputSchema: {
      type: 'object',
      required: ['positions'],
      properties: {
        positions: { type: 'array', items: { type: 'object' } },
        positionPapers: { type: 'array', items: { type: 'object' } },
        industryAlignment: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'advocacy-positions']
}));

export const createGaMessagingTask = defineTask('create-ga-messaging', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Government Affairs Messaging',
  agent: {
    name: 'ga-messaging-creator',
    prompt: {
      role: 'Government communications specialist creating messaging',
      task: 'Create messaging framework for government affairs',
      context: args,
      instructions: [
        'Develop core policy messages',
        'Create audience-specific messaging variations',
        'Develop talking points for meetings',
        'Create testimony preparation materials',
        'Develop regulatory comment templates',
        'Create grassroots activation messaging',
        'Develop media/op-ed messaging on policy',
        'Ensure compliance with lobbying disclosure'
      ],
      outputFormat: 'JSON with coreMessages, audienceVariations, talkingPoints, testimonyMaterials, commentTemplates, grassrootsMessaging, mediaMessaging, complianceNotes'
    },
    outputSchema: {
      type: 'object',
      required: ['coreMessages', 'talkingPoints'],
      properties: {
        coreMessages: { type: 'array', items: { type: 'object' } },
        audienceVariations: { type: 'object' },
        talkingPoints: { type: 'array', items: { type: 'object' } },
        testimonyMaterials: { type: 'object' },
        commentTemplates: { type: 'array', items: { type: 'object' } },
        grassrootsMessaging: { type: 'object' },
        mediaMessaging: { type: 'object' },
        complianceNotes: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'ga-messaging']
}));

export const developGaEngagementTask = defineTask('develop-ga-engagement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Government Engagement Strategy',
  agent: {
    name: 'ga-engagement-developer',
    prompt: {
      role: 'Government relations strategist developing engagement plan',
      task: 'Develop government affairs engagement strategy',
      context: args,
      instructions: [
        'Define engagement approach per stakeholder',
        'Plan meeting and briefing strategy',
        'Schedule fly-ins and Hill visits',
        'Plan regulatory comment submissions',
        'Define testimony opportunities',
        'Plan site visits and facility tours',
        'Develop executive engagement program',
        'Create engagement tracking system'
      ],
      outputFormat: 'JSON with engagementApproaches, meetingStrategy, hillVisits, regulatoryComments, testimonyPlan, siteVisits, executiveEngagement, trackingSystem'
    },
    outputSchema: {
      type: 'object',
      required: ['engagementApproaches', 'meetingStrategy'],
      properties: {
        engagementApproaches: { type: 'object' },
        meetingStrategy: { type: 'object' },
        hillVisits: { type: 'array', items: { type: 'object' } },
        regulatoryComments: { type: 'array', items: { type: 'object' } },
        testimonyPlan: { type: 'object' },
        siteVisits: { type: 'array', items: { type: 'object' } },
        executiveEngagement: { type: 'object' },
        trackingSystem: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'ga-engagement']
}));

export const planCoalitionBuildingTask = defineTask('plan-coalition-building', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan Coalition Building',
  agent: {
    name: 'coalition-planner',
    prompt: {
      role: 'Coalition strategist planning advocacy partnerships',
      task: 'Plan coalition building for advocacy efforts',
      context: args,
      instructions: [
        'Identify potential coalition partners',
        'Assess alignment on policy positions',
        'Define coalition structure options',
        'Plan industry association engagement',
        'Identify grassroots partnership opportunities',
        'Define coalition messaging and coordination',
        'Plan joint advocacy activities',
        'Create coalition governance approach'
      ],
      outputFormat: 'JSON with potentialPartners, alignmentAssessment, structureOptions, associationEngagement, grassrootsPartners, messagingCoordination, jointActivities, governance'
    },
    outputSchema: {
      type: 'object',
      required: ['potentialPartners', 'alignmentAssessment'],
      properties: {
        potentialPartners: { type: 'array', items: { type: 'object' } },
        alignmentAssessment: { type: 'object' },
        structureOptions: { type: 'array', items: { type: 'object' } },
        associationEngagement: { type: 'object' },
        grassrootsPartners: { type: 'array', items: { type: 'object' } },
        messagingCoordination: { type: 'object' },
        jointActivities: { type: 'array', items: { type: 'object' } },
        governance: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'coalition-building']
}));

export const setupLegislativeTrackingTask = defineTask('setup-legislative-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Setup Legislative Tracking',
  agent: {
    name: 'legislative-tracking-setup',
    prompt: {
      role: 'Legislative affairs specialist setting up tracking systems',
      task: 'Setup legislative and regulatory tracking system',
      context: args,
      instructions: [
        'Define bills and regulations to track',
        'Setup tracking tools and alerts',
        'Define tracking cadence and reporting',
        'Create status tracking dashboard',
        'Define action triggers and thresholds',
        'Setup comment period tracking',
        'Create hearing and markup calendar',
        'Define escalation protocols'
      ],
      outputFormat: 'JSON with trackingList, tools, cadence, dashboard, actionTriggers, commentPeriods, calendar, escalationProtocols'
    },
    outputSchema: {
      type: 'object',
      required: ['trackingList', 'cadence', 'actionTriggers'],
      properties: {
        trackingList: { type: 'array', items: { type: 'object' } },
        tools: { type: 'array', items: { type: 'object' } },
        cadence: { type: 'string' },
        dashboard: { type: 'object' },
        actionTriggers: { type: 'array', items: { type: 'object' } },
        commentPeriods: { type: 'array', items: { type: 'object' } },
        calendar: { type: 'object' },
        escalationProtocols: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'legislative-tracking']
}));

export const validateGaCommsQualityTask = defineTask('validate-ga-comms-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate Government Affairs Communications Quality',
  agent: {
    name: 'ga-comms-quality-validator',
    prompt: {
      role: 'Government affairs quality assessor',
      task: 'Validate government affairs communications quality',
      context: args,
      instructions: [
        'Assess policy analysis thoroughness',
        'Evaluate stakeholder mapping completeness',
        'Review advocacy position clarity',
        'Assess messaging framework effectiveness',
        'Evaluate engagement strategy feasibility',
        'Review coalition plan viability',
        'Assess legislative tracking comprehensiveness',
        'Provide overall quality score (0-100)'
      ],
      outputFormat: 'JSON with score, passed, policyScore, stakeholderScore, positionScore, messagingScore, engagementScore, coalitionScore, trackingScore, gaps, recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'passed'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        passed: { type: 'boolean' },
        policyScore: { type: 'number' },
        stakeholderScore: { type: 'number' },
        positionScore: { type: 'number' },
        messagingScore: { type: 'number' },
        engagementScore: { type: 'number' },
        coalitionScore: { type: 'number' },
        trackingScore: { type: 'number' },
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
