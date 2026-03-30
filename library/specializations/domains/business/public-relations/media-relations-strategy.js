/**
 * @process specializations/domains/business/public-relations/media-relations-strategy
 * @description Define target media outlets, journalists, and influencers aligned with organizational goals using PESO model integration
 * @specialization Public Relations and Communications
 * @category Media Relations
 * @inputs { organizationProfile: object, goals: string[], targetAudience: object, industryVertical: string, geographicScope: string[] }
 * @outputs { success: boolean, strategy: object, mediaTiers: object[], pitchStrategies: object[], relationshipPlan: object, quality: number }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationProfile,
    goals = [],
    targetAudience = {},
    industryVertical,
    geographicScope = ['national'],
    pesoModelWeights = { paid: 25, earned: 35, shared: 20, owned: 20 },
    targetQuality = 85
  } = inputs;

  // Phase 1: Organizational Assessment and Goal Alignment
  await ctx.breakpoint({
    question: 'Starting media relations strategy development. Analyze organizational context and goals?',
    title: 'Phase 1: Organizational Assessment',
    context: {
      runId: ctx.runId,
      phase: 'organizational-assessment',
      organizationProfile,
      goals
    }
  });

  const orgAssessment = await ctx.task(analyzeOrganizationalContextTask, {
    organizationProfile,
    goals,
    industryVertical
  });

  // Phase 2: Media Landscape Analysis
  await ctx.breakpoint({
    question: 'Organization assessed. Analyze media landscape and identify target outlets?',
    title: 'Phase 2: Media Landscape Analysis',
    context: {
      runId: ctx.runId,
      phase: 'media-landscape',
      industry: industryVertical,
      geographicScope
    }
  });

  const [mediaLandscape, competitorAnalysis] = await Promise.all([
    ctx.task(analyzeMediaLandscapeTask, {
      industryVertical,
      geographicScope,
      targetAudience,
      orgAssessment
    }),
    ctx.task(analyzeCompetitorMediaPresenceTask, {
      industryVertical,
      organizationProfile
    })
  ]);

  // Phase 3: Media Tiering and Prioritization
  await ctx.breakpoint({
    question: 'Media landscape analyzed. Create media tier structure?',
    title: 'Phase 3: Media Tiering',
    context: {
      runId: ctx.runId,
      phase: 'media-tiering',
      outletsIdentified: mediaLandscape.outletCount,
      journalistsIdentified: mediaLandscape.journalistCount
    }
  });

  const mediaTiers = await ctx.task(createMediaTieringTask, {
    mediaLandscape,
    goals,
    targetAudience,
    organizationProfile
  });

  // Phase 4: PESO Model Integration
  await ctx.breakpoint({
    question: 'Media tiers created. Develop PESO model integration strategy?',
    title: 'Phase 4: PESO Model Integration',
    context: {
      runId: ctx.runId,
      phase: 'peso-integration',
      pesoModelWeights
    }
  });

  const pesoStrategy = await ctx.task(developPesoStrategyTask, {
    mediaTiers,
    pesoModelWeights,
    goals,
    organizationProfile
  });

  // Phase 5: Pitch Strategy Development
  await ctx.breakpoint({
    question: 'PESO strategy defined. Develop pitch strategies for each tier?',
    title: 'Phase 5: Pitch Strategy Development',
    context: {
      runId: ctx.runId,
      phase: 'pitch-strategy',
      tiers: mediaTiers.tiers.length
    }
  });

  const pitchStrategies = await ctx.task(developPitchStrategiesTask, {
    mediaTiers,
    pesoStrategy,
    goals,
    organizationProfile,
    competitorAnalysis
  });

  // Phase 6: Relationship Building Plan
  await ctx.breakpoint({
    question: 'Pitch strategies developed. Create relationship building plan?',
    title: 'Phase 6: Relationship Building Plan',
    context: {
      runId: ctx.runId,
      phase: 'relationship-building'
    }
  });

  const relationshipPlan = await ctx.task(createRelationshipPlanTask, {
    mediaTiers,
    pitchStrategies,
    goals
  });

  // Phase 7: Quality Validation
  await ctx.breakpoint({
    question: 'Validate media relations strategy quality?',
    title: 'Phase 7: Quality Validation',
    context: {
      runId: ctx.runId,
      phase: 'quality-validation',
      targetQuality
    }
  });

  const qualityResult = await ctx.task(validateStrategyQualityTask, {
    orgAssessment,
    mediaLandscape,
    mediaTiers,
    pesoStrategy,
    pitchStrategies,
    relationshipPlan,
    targetQuality
  });

  const quality = qualityResult.score;

  if (quality >= targetQuality) {
    return {
      success: true,
      strategy: {
        organizationalContext: orgAssessment,
        mediaLandscape: mediaLandscape.summary,
        competitorInsights: competitorAnalysis.summary,
        pesoStrategy
      },
      mediaTiers: mediaTiers.tiers,
      pitchStrategies: pitchStrategies.strategies,
      relationshipPlan,
      quality,
      targetQuality,
      recommendations: qualityResult.recommendations,
      metadata: {
        processId: 'specializations/domains/business/public-relations/media-relations-strategy',
        timestamp: ctx.now(),
        industryVertical,
        geographicScope
      }
    };
  } else {
    return {
      success: false,
      qualityGateFailed: true,
      quality,
      targetQuality,
      recommendations: qualityResult.recommendations,
      issues: qualityResult.issues,
      metadata: {
        processId: 'specializations/domains/business/public-relations/media-relations-strategy',
        timestamp: ctx.now()
      }
    };
  }
}

// Task Definitions

export const analyzeOrganizationalContextTask = defineTask('analyze-org-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Organizational Context and Goals',
  agent: {
    name: 'org-context-analyzer',
    prompt: {
      role: 'Strategic communications consultant specializing in media relations',
      task: 'Analyze organizational context and communication goals for media strategy',
      context: args,
      instructions: [
        'Review organization profile, mission, values, and market position',
        'Analyze stated communication and PR goals',
        'Identify key messages and value propositions',
        'Assess current media presence and brand awareness',
        'Identify spokespersons and subject matter experts',
        'Determine newsworthy angles and story opportunities',
        'Map competitive positioning in the media landscape',
        'Identify potential challenges and sensitivities',
        'Define success metrics aligned with business objectives'
      ],
      outputFormat: 'JSON with assessment summary, keyMessages, spokespersons, storyAngles, challenges, successMetrics'
    },
    outputSchema: {
      type: 'object',
      required: ['assessment', 'keyMessages', 'storyAngles'],
      properties: {
        assessment: { type: 'object' },
        keyMessages: { type: 'array', items: { type: 'string' } },
        spokespersons: { type: 'array', items: { type: 'object' } },
        storyAngles: { type: 'array', items: { type: 'object' } },
        challenges: { type: 'array', items: { type: 'string' } },
        successMetrics: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'org-analysis']
}));

export const analyzeMediaLandscapeTask = defineTask('analyze-media-landscape', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Media Landscape',
  agent: {
    name: 'media-landscape-analyzer',
    prompt: {
      role: 'Media research specialist with extensive journalist network knowledge',
      task: 'Analyze media landscape and identify target outlets and journalists',
      context: args,
      instructions: [
        'Research media outlets covering the industry vertical',
        'Identify tier 1, 2, and 3 publications (national, trade, local)',
        'Map key journalists, editors, and reporters by beat',
        'Research influencers and thought leaders in the space',
        'Analyze outlet reach, demographics, and audience alignment',
        'Identify podcast and broadcast media opportunities',
        'Research digital-native and emerging media platforms',
        'Note journalist preferences and pitch formats',
        'Document editorial calendars and key events'
      ],
      outputFormat: 'JSON with outlets array, journalists array, influencers, outletCount, journalistCount, summary'
    },
    outputSchema: {
      type: 'object',
      required: ['outlets', 'journalists', 'outletCount', 'journalistCount'],
      properties: {
        outlets: { type: 'array', items: { type: 'object' } },
        journalists: { type: 'array', items: { type: 'object' } },
        influencers: { type: 'array', items: { type: 'object' } },
        outletCount: { type: 'number' },
        journalistCount: { type: 'number' },
        summary: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'media-landscape']
}));

export const analyzeCompetitorMediaPresenceTask = defineTask('analyze-competitor-media', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Competitor Media Presence',
  agent: {
    name: 'competitor-media-analyzer',
    prompt: {
      role: 'Competitive intelligence analyst specializing in media coverage',
      task: 'Analyze competitor media presence and coverage patterns',
      context: args,
      instructions: [
        'Identify key competitors and their media strategies',
        'Analyze competitor share of voice in target publications',
        'Document competitor spokesperson visibility',
        'Identify outlets where competitors receive frequent coverage',
        'Analyze competitor messaging and positioning in media',
        'Note gaps and opportunities for differentiation',
        'Track competitor thought leadership activities',
        'Assess competitor crisis communication patterns'
      ],
      outputFormat: 'JSON with competitors array, shareOfVoice, coveragePatterns, gaps, opportunities, summary'
    },
    outputSchema: {
      type: 'object',
      required: ['competitors', 'gaps', 'opportunities'],
      properties: {
        competitors: { type: 'array', items: { type: 'object' } },
        shareOfVoice: { type: 'object' },
        coveragePatterns: { type: 'array', items: { type: 'object' } },
        gaps: { type: 'array', items: { type: 'string' } },
        opportunities: { type: 'array', items: { type: 'string' } },
        summary: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'competitor-analysis']
}));

export const createMediaTieringTask = defineTask('create-media-tiering', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Media Tier Structure',
  agent: {
    name: 'media-tier-strategist',
    prompt: {
      role: 'Media relations strategist specializing in outlet prioritization',
      task: 'Create tiered media target list aligned with organizational goals',
      context: args,
      instructions: [
        'Create Tier 1: Top-priority national/global outlets with high impact',
        'Create Tier 2: Important trade and industry publications',
        'Create Tier 3: Regional, local, and niche outlets',
        'Create Tier 4: Digital-native, blogs, and emerging platforms',
        'Assign priority scores based on reach, relevance, and influence',
        'Map journalists to each tier with contact approach strategies',
        'Define engagement frequency for each tier',
        'Create media list with outlet profiles and key contacts',
        'Include influencer tier for social and digital amplification'
      ],
      outputFormat: 'JSON with tiers array (tier level, outlets, journalists, priority, engagement frequency), summary'
    },
    outputSchema: {
      type: 'object',
      required: ['tiers'],
      properties: {
        tiers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              level: { type: 'number' },
              name: { type: 'string' },
              outlets: { type: 'array' },
              journalists: { type: 'array' },
              priority: { type: 'string' },
              engagementFrequency: { type: 'string' }
            }
          }
        },
        summary: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'media-tiering']
}));

export const developPesoStrategyTask = defineTask('develop-peso-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop PESO Model Integration Strategy',
  agent: {
    name: 'peso-strategist',
    prompt: {
      role: 'Integrated communications strategist expert in PESO model',
      task: 'Develop comprehensive PESO model integration strategy',
      context: args,
      instructions: [
        'Define Paid media strategy: sponsored content, native advertising, paid influencers',
        'Define Earned media strategy: press coverage, media relations, awards',
        'Define Shared media strategy: social amplification, community engagement, partnerships',
        'Define Owned media strategy: corporate blog, newsroom, email communications',
        'Create integration points between PESO elements',
        'Define content repurposing strategy across PESO',
        'Establish measurement framework for each PESO element',
        'Allocate budget and resources based on PESO weights',
        'Create content calendar integrating all PESO elements'
      ],
      outputFormat: 'JSON with paid, earned, shared, owned strategies, integrationPoints, contentCalendar, budgetAllocation'
    },
    outputSchema: {
      type: 'object',
      required: ['paid', 'earned', 'shared', 'owned'],
      properties: {
        paid: { type: 'object' },
        earned: { type: 'object' },
        shared: { type: 'object' },
        owned: { type: 'object' },
        integrationPoints: { type: 'array', items: { type: 'object' } },
        contentCalendar: { type: 'object' },
        budgetAllocation: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'peso-model']
}));

export const developPitchStrategiesTask = defineTask('develop-pitch-strategies', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Pitch Strategies',
  agent: {
    name: 'pitch-strategist',
    prompt: {
      role: 'Media relations specialist expert in journalist engagement',
      task: 'Develop pitch strategies for each media tier',
      context: args,
      instructions: [
        'Create tier-specific pitch approaches and angles',
        'Develop exclusive vs. wide-release pitch strategies',
        'Define story angles for different outlet types',
        'Create pitch templates for various news hooks',
        'Define embargo and exclusive strategies',
        'Develop follow-up and nurture sequences',
        'Create reactive pitching protocols for breaking news',
        'Define pitch timing strategies by outlet type',
        'Create personalization guidelines for key journalists'
      ],
      outputFormat: 'JSON with strategies array (tier, approach, angles, templates, timing), exclusiveStrategy, followUpProtocol'
    },
    outputSchema: {
      type: 'object',
      required: ['strategies'],
      properties: {
        strategies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tier: { type: 'number' },
              approach: { type: 'string' },
              angles: { type: 'array' },
              templates: { type: 'array' },
              timing: { type: 'object' }
            }
          }
        },
        exclusiveStrategy: { type: 'object' },
        followUpProtocol: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'pitch-strategy']
}));

export const createRelationshipPlanTask = defineTask('create-relationship-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Relationship Building Plan',
  agent: {
    name: 'relationship-planner',
    prompt: {
      role: 'Media relationship manager specializing in journalist relations',
      task: 'Create comprehensive media relationship building plan',
      context: args,
      instructions: [
        'Define relationship building activities for each journalist tier',
        'Create journalist engagement calendar (briefings, events, 1:1 meetings)',
        'Develop value-add engagement strategies (insights, data, expert access)',
        'Create relationship tracking and CRM approach',
        'Define touchpoint frequency by relationship tier',
        'Develop rapport-building strategies beyond pitching',
        'Create protocol for maintaining relationships during quiet periods',
        'Define escalation paths for relationship issues',
        'Establish metrics for relationship health tracking'
      ],
      outputFormat: 'JSON with activities, engagementCalendar, valueAddStrategies, trackingApproach, metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['activities', 'engagementCalendar'],
      properties: {
        activities: { type: 'array', items: { type: 'object' } },
        engagementCalendar: { type: 'object' },
        valueAddStrategies: { type: 'array', items: { type: 'object' } },
        trackingApproach: { type: 'object' },
        metrics: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'relationship-building']
}));

export const validateStrategyQualityTask = defineTask('validate-strategy-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate Media Relations Strategy Quality',
  agent: {
    name: 'strategy-quality-validator',
    prompt: {
      role: 'PR strategy quality assurance specialist',
      task: 'Assess media relations strategy quality and completeness',
      context: args,
      instructions: [
        'Evaluate alignment between goals and media strategy',
        'Assess completeness of media landscape coverage',
        'Validate tiering logic and prioritization',
        'Review PESO model integration effectiveness',
        'Evaluate pitch strategy differentiation and creativity',
        'Assess relationship building plan feasibility',
        'Check for measurement and success metrics',
        'Identify gaps and areas for improvement',
        'Provide overall quality score (0-100)'
      ],
      outputFormat: 'JSON with score, passed, alignment, completeness, recommendations, issues'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'passed'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        passed: { type: 'boolean' },
        alignment: { type: 'number' },
        completeness: { type: 'number' },
        recommendations: { type: 'array', items: { type: 'string' } },
        issues: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'quality-validation']
}));
