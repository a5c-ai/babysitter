/**
 * @process arts-culture/arts-advocacy
 * @description Arts advocacy process for engaging legislators, building coalitions, and advocating for arts funding and cultural policy at local, state, and federal levels
 * @inputs {
 *   advocacyGoals: { policyObjectives: string[], fundingTargets: object, legislativePriorities: string[] },
 *   jurisdiction: { level: 'local' | 'state' | 'federal', location: string },
 *   stakeholders: { artsOrganizations: string[], artists: string[], businessAllies: string[], civicPartners: string[] },
 *   targetAudience: { legislators: string[], agencies: string[], committees: string[] },
 *   resources: { budget: number, staff: number, volunteers: number },
 *   timeline: { advocacyCycle: string, keyDates: object }
 * }
 * @outputs {
 *   landscapeAnalysis: object,
 *   coalitionStrategy: object,
 *   messagingFramework: object,
 *   legislativeStrategy: object,
 *   grassrootsplan: object,
 *   mediaStrategy: object,
 *   advocacyToolkit: object,
 *   campaignPlan: object
 * }
 * @recommendedSkills SK-AC-015 (arts-advocacy-communication), SK-AC-010 (cultural-policy-analysis), SK-AC-013 (stakeholder-facilitation)
 * @recommendedAgents AG-AC-009 (cultural-policy-agent), AG-AC-002 (arts-administrator-agent)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  // Phase 1: Policy Landscape Analysis
  const landscapeAnalysis = await ctx.task(landscapeAnalysisTask, {
    jurisdiction: inputs.jurisdiction,
    advocacyGoals: inputs.advocacyGoals,
    targetAudience: inputs.targetAudience
  });

  // Phase 2: Stakeholder and Coalition Mapping
  const coalitionStrategy = await ctx.task(coalitionMappingTask, {
    stakeholders: inputs.stakeholders,
    advocacyGoals: inputs.advocacyGoals,
    landscapeAnalysis: landscapeAnalysis
  });

  // Phase 3: Message Development and Framing
  const messagingFramework = await ctx.task(messageDevelopmentTask, {
    advocacyGoals: inputs.advocacyGoals,
    targetAudience: inputs.targetAudience,
    landscapeAnalysis: landscapeAnalysis
  });

  // Phase 4: Legislative Strategy Development
  const legislativeStrategy = await ctx.task(legislativeStrategyTask, {
    advocacyGoals: inputs.advocacyGoals,
    targetAudience: inputs.targetAudience,
    landscapeAnalysis: landscapeAnalysis,
    timeline: inputs.timeline
  });

  // Breakpoint: Strategy Review
  await ctx.breakpoint('strategy-review', {
    title: 'Advocacy Strategy Review',
    description: 'Review advocacy strategy, messaging, and legislative approach before campaign launch',
    context: {
      landscapeAnalysis: landscapeAnalysis,
      coalitionStrategy: coalitionStrategy,
      messagingFramework: messagingFramework,
      legislativeStrategy: legislativeStrategy
    }
  });

  // Phase 5: Grassroots Mobilization Planning
  const grassrootsPlan = await ctx.task(grassrootsMobilizationTask, {
    stakeholders: inputs.stakeholders,
    coalitionStrategy: coalitionStrategy,
    messagingFramework: messagingFramework,
    resources: inputs.resources
  });

  // Phase 6: Media and Communications Strategy
  const mediaStrategy = await ctx.task(mediaStrategyTask, {
    messagingFramework: messagingFramework,
    advocacyGoals: inputs.advocacyGoals,
    timeline: inputs.timeline
  });

  // Phase 7: Advocacy Toolkit Development
  const advocacyToolkit = await ctx.task(toolkitDevelopmentTask, {
    messagingFramework: messagingFramework,
    legislativeStrategy: legislativeStrategy,
    grassrootsPlan: grassrootsPlan,
    targetAudience: inputs.targetAudience
  });

  // Phase 8: Campaign Implementation Plan
  const campaignPlan = await ctx.task(campaignImplementationTask, {
    legislativeStrategy: legislativeStrategy,
    grassrootsPlan: grassrootsPlan,
    mediaStrategy: mediaStrategy,
    timeline: inputs.timeline,
    resources: inputs.resources
  });

  // Final Breakpoint: Campaign Launch Approval
  await ctx.breakpoint('campaign-approval', {
    title: 'Advocacy Campaign Launch Approval',
    description: 'Approve advocacy campaign plan and materials for launch',
    context: {
      campaignPlan: campaignPlan,
      advocacyToolkit: advocacyToolkit
    }
  });

  return {
    landscapeAnalysis: landscapeAnalysis,
    coalitionStrategy: coalitionStrategy,
    messagingFramework: messagingFramework,
    legislativeStrategy: legislativeStrategy,
    grassrootsPlan: grassrootsPlan,
    mediaStrategy: mediaStrategy,
    advocacyToolkit: advocacyToolkit,
    campaignPlan: campaignPlan
  };
}

export const landscapeAnalysisTask = defineTask('landscape-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Policy Landscape Analysis',
  agent: {
    name: 'arts-policy-analyst',
    prompt: {
      role: 'Arts policy analyst with expertise in legislative analysis and political landscape assessment',
      task: 'Analyze policy and political landscape for arts advocacy',
      context: args,
      instructions: [
        'Research current arts funding levels and appropriations',
        'Analyze relevant legislation and policy proposals',
        'Map legislative champions and opponents',
        'Assess committee structures and jurisdictions',
        'Identify key decision points in budget/legislative calendar',
        'Analyze political dynamics and voting patterns',
        'Research peer jurisdiction policies and funding',
        'Identify regulatory and administrative opportunities',
        'Assess current advocacy efforts and gaps',
        'Document recent wins and setbacks in arts policy'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['fundingAnalysis', 'legislativeEnvironment', 'politicalDynamics', 'opportunities'],
      properties: {
        fundingAnalysis: { type: 'object' },
        legislativeEnvironment: { type: 'object' },
        keyLegislators: { type: 'array' },
        committeeAnalysis: { type: 'array' },
        politicalDynamics: { type: 'object' },
        peerBenchmarks: { type: 'array' },
        opportunities: { type: 'array' },
        threats: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['analysis', 'policy', 'landscape']
}));

export const coalitionMappingTask = defineTask('coalition-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Stakeholder and Coalition Mapping',
  agent: {
    name: 'coalition-strategist',
    prompt: {
      role: 'Coalition building strategist with expertise in arts advocacy and stakeholder engagement',
      task: 'Map stakeholders and develop coalition building strategy',
      context: args,
      instructions: [
        'Identify potential coalition partners across sectors',
        'Map existing relationships and alliance opportunities',
        'Assess partner capacity and resources',
        'Identify business community allies and champions',
        'Map education sector partnership opportunities',
        'Identify tourism and economic development allies',
        'Assess labor and workforce development partners',
        'Develop coalition governance structure',
        'Create partner engagement and recruitment plan',
        'Establish coalition communication protocols'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['potentialPartners', 'coalitionStructure', 'engagementPlan'],
      properties: {
        potentialPartners: { type: 'array' },
        partnerAnalysis: { type: 'object' },
        businessAllies: { type: 'array' },
        sectorPartners: { type: 'object' },
        coalitionStructure: { type: 'object' },
        engagementPlan: { type: 'object' },
        communicationProtocols: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['coalition', 'stakeholders', 'strategy']
}));

export const messageDevelopmentTask = defineTask('message-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Message Development and Framing',
  agent: {
    name: 'communications-strategist',
    prompt: {
      role: 'Communications strategist with expertise in advocacy messaging and narrative development',
      task: 'Develop messaging framework and key narratives for arts advocacy',
      context: args,
      instructions: [
        'Develop overarching advocacy narrative',
        'Create audience-specific message frames',
        'Develop economic impact messaging',
        'Create education and workforce messages',
        'Develop community and quality of life frames',
        'Create equity and access messaging',
        'Develop talking points for key issues',
        'Create compelling statistics and proof points',
        'Develop storytelling guidelines and examples',
        'Test and refine messages with target audiences'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['coreNarrative', 'audienceMessages', 'talkingPoints', 'proofPoints'],
      properties: {
        coreNarrative: { type: 'string' },
        valueProposition: { type: 'string' },
        audienceMessages: { type: 'object' },
        economicMessages: { type: 'array' },
        educationMessages: { type: 'array' },
        equityMessages: { type: 'array' },
        talkingPoints: { type: 'array' },
        proofPoints: { type: 'array' },
        stories: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['messaging', 'communications', 'narrative']
}));

export const legislativeStrategyTask = defineTask('legislative-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Legislative Strategy Development',
  agent: {
    name: 'legislative-strategist',
    prompt: {
      role: 'Legislative strategist with expertise in government relations and advocacy tactics',
      task: 'Develop comprehensive legislative advocacy strategy',
      context: args,
      instructions: [
        'Identify legislative vehicles and opportunities',
        'Develop appropriations advocacy strategy',
        'Create legislator engagement and education plan',
        'Design constituent engagement approach',
        'Develop committee hearing strategy',
        'Create bill tracking and monitoring plan',
        'Design amendment and markup strategies',
        'Develop regulatory and administrative approaches',
        'Create legislative champion cultivation plan',
        'Design opposition response strategies'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['legislativeVehicles', 'appropriationsStrategy', 'engagementPlan', 'tactics'],
      properties: {
        legislativeVehicles: { type: 'array' },
        appropriationsStrategy: { type: 'object' },
        legislatorEngagement: { type: 'object' },
        committeeStrategy: { type: 'object' },
        billTracking: { type: 'object' },
        championCultivation: { type: 'array' },
        oppositionResponse: { type: 'object' },
        tactics: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['legislative', 'strategy', 'government-relations']
}));

export const grassrootsMobilizationTask = defineTask('grassroots-mobilization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Grassroots Mobilization Planning',
  agent: {
    name: 'grassroots-organizer',
    prompt: {
      role: 'Grassroots organizer with expertise in arts advocacy mobilization and community engagement',
      task: 'Develop grassroots mobilization strategy for arts advocacy',
      context: args,
      instructions: [
        'Design constituent mobilization strategy',
        'Create advocacy ambassador program',
        'Develop arts advocacy day planning',
        'Design letter writing and petition campaigns',
        'Create social media advocacy strategy',
        'Develop community meeting and event strategy',
        'Design artist engagement and activation',
        'Create student and youth mobilization plan',
        'Develop phone banking and text campaigns',
        'Design volunteer recruitment and training'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['mobilizationStrategy', 'ambassadorProgram', 'campaignTactics', 'volunteerPlan'],
      properties: {
        mobilizationStrategy: { type: 'object' },
        ambassadorProgram: { type: 'object' },
        advocacyDayPlan: { type: 'object' },
        letterCampaigns: { type: 'array' },
        socialMediaStrategy: { type: 'object' },
        communityEvents: { type: 'array' },
        artistActivation: { type: 'object' },
        youthMobilization: { type: 'object' },
        volunteerPlan: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['grassroots', 'mobilization', 'organizing']
}));

export const mediaStrategyTask = defineTask('media-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Media and Communications Strategy',
  agent: {
    name: 'media-strategist',
    prompt: {
      role: 'Media strategist with expertise in earned media, public relations, and advocacy communications',
      task: 'Develop media and communications strategy for arts advocacy',
      context: args,
      instructions: [
        'Develop earned media strategy and press plan',
        'Create op-ed and editorial placement strategy',
        'Design social media campaign strategy',
        'Develop spokesperson preparation and training',
        'Create press event and announcement plan',
        'Design digital advertising strategy',
        'Develop content calendar and publishing plan',
        'Create crisis communications protocols',
        'Design metrics and measurement approach',
        'Develop media list and relationship building'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['earnedMediaStrategy', 'socialMediaPlan', 'contentCalendar', 'metrics'],
      properties: {
        earnedMediaStrategy: { type: 'object' },
        pressEventPlan: { type: 'array' },
        opEdStrategy: { type: 'object' },
        socialMediaPlan: { type: 'object' },
        digitalAdvertising: { type: 'object' },
        contentCalendar: { type: 'object' },
        spokespersonPlan: { type: 'object' },
        crisisProtocols: { type: 'object' },
        metrics: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['media', 'communications', 'public-relations']
}));

export const toolkitDevelopmentTask = defineTask('toolkit-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Advocacy Toolkit Development',
  agent: {
    name: 'advocacy-specialist',
    prompt: {
      role: 'Advocacy specialist with expertise in toolkit development and advocate training',
      task: 'Develop comprehensive advocacy toolkit and materials',
      context: args,
      instructions: [
        'Create legislator meeting guide and protocols',
        'Develop one-pagers and fact sheets',
        'Create customizable letter and email templates',
        'Develop social media graphics and copy',
        'Create testimony templates and guidelines',
        'Develop story collection and sharing guidelines',
        'Create advocacy training curriculum',
        'Develop impact calculator and data tools',
        'Create coalition partner materials',
        'Develop digital advocacy action tools'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['meetingGuide', 'factSheets', 'templates', 'trainingMaterials'],
      properties: {
        meetingGuide: { type: 'object' },
        factSheets: { type: 'array' },
        letterTemplates: { type: 'array' },
        socialMediaAssets: { type: 'object' },
        testimonyTemplates: { type: 'array' },
        storyGuidelines: { type: 'object' },
        trainingMaterials: { type: 'object' },
        dataTools: { type: 'object' },
        partnerMaterials: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['toolkit', 'materials', 'training']
}));

export const campaignImplementationTask = defineTask('campaign-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Campaign Implementation Plan',
  agent: {
    name: 'campaign-manager',
    prompt: {
      role: 'Campaign manager with expertise in advocacy campaign implementation and coordination',
      task: 'Develop comprehensive advocacy campaign implementation plan',
      context: args,
      instructions: [
        'Create detailed campaign timeline and milestones',
        'Develop resource allocation and budget plan',
        'Assign roles and responsibilities',
        'Create coordination and communication systems',
        'Develop rapid response protocols',
        'Create progress tracking and reporting systems',
        'Design stakeholder update and engagement schedule',
        'Develop contingency and adaptation plans',
        'Create success metrics and evaluation plan',
        'Design post-campaign assessment process'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['timeline', 'resourcePlan', 'coordinationSystems', 'successMetrics'],
      properties: {
        timeline: { type: 'object' },
        milestones: { type: 'array' },
        resourcePlan: { type: 'object' },
        rolesResponsibilities: { type: 'object' },
        coordinationSystems: { type: 'object' },
        rapidResponse: { type: 'object' },
        trackingReporting: { type: 'object' },
        contingencyPlans: { type: 'array' },
        successMetrics: { type: 'object' },
        evaluationPlan: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['campaign', 'implementation', 'coordination']
}));
