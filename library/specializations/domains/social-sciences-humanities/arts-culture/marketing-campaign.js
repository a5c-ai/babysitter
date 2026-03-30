/**
 * @process arts-culture/marketing-campaign
 * @description Structured approach to developing and executing marketing strategies for exhibitions, performances, and cultural programs including audience segmentation, messaging, and channel optimization
 * @inputs { campaignName: string, programType: string, targetAudiences: array, budget: number, timeline: object }
 * @outputs { success: boolean, campaignStrategy: object, contentPlan: object, channelMix: object, artifacts: array }
 * @recommendedSkills SK-AC-007 (audience-analytics), SK-AC-014 (digital-engagement-strategy), SK-AC-008 (interpretive-writing)
 * @recommendedAgents AG-AC-008 (marketing-communications-agent)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    campaignName,
    programType = 'exhibition',
    targetAudiences = [],
    budget = 25000,
    timeline = {},
    organizationBrand = {},
    outputDir = 'marketing-campaign-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Audience Research and Segmentation
  ctx.log('info', 'Conducting audience research and segmentation');
  const audienceResearch = await ctx.task(audienceResearchTask, {
    campaignName,
    programType,
    targetAudiences,
    outputDir
  });

  if (!audienceResearch.success) {
    return {
      success: false,
      error: 'Audience research failed',
      details: audienceResearch,
      metadata: { processId: 'arts-culture/marketing-campaign', timestamp: startTime }
    };
  }

  artifacts.push(...audienceResearch.artifacts);

  // Task 2: Campaign Strategy Development
  ctx.log('info', 'Developing campaign strategy');
  const campaignStrategy = await ctx.task(campaignStrategyTask, {
    campaignName,
    programType,
    audienceSegments: audienceResearch.segments,
    budget,
    timeline,
    outputDir
  });

  artifacts.push(...campaignStrategy.artifacts);

  // Task 3: Messaging and Creative Brief
  ctx.log('info', 'Developing messaging and creative brief');
  const messagingBrief = await ctx.task(messagingBriefTask, {
    campaignName,
    programType,
    audienceSegments: audienceResearch.segments,
    organizationBrand,
    outputDir
  });

  artifacts.push(...messagingBrief.artifacts);

  // Task 4: Channel Strategy
  ctx.log('info', 'Developing channel strategy and media mix');
  const channelStrategy = await ctx.task(channelStrategyTask, {
    campaignName,
    audienceSegments: audienceResearch.segments,
    budget,
    timeline,
    outputDir
  });

  artifacts.push(...channelStrategy.artifacts);

  // Task 5: Content Plan
  ctx.log('info', 'Creating content plan and calendar');
  const contentPlan = await ctx.task(contentPlanTask, {
    campaignName,
    programType,
    messagingBrief: messagingBrief.brief,
    channelStrategy: channelStrategy.channels,
    timeline,
    outputDir
  });

  artifacts.push(...contentPlan.artifacts);

  // Task 6: Digital Marketing Plan
  ctx.log('info', 'Developing digital marketing plan');
  const digitalPlan = await ctx.task(digitalMarketingTask, {
    campaignName,
    audienceSegments: audienceResearch.segments,
    budget: budget * 0.5,
    channelStrategy: channelStrategy.channels,
    outputDir
  });

  artifacts.push(...digitalPlan.artifacts);

  // Breakpoint: Review campaign strategy
  await ctx.breakpoint({
    question: `Marketing campaign strategy for "${campaignName}" complete. Budget: $${budget.toLocaleString()}. ${audienceResearch.segments.length} audience segments targeted. Review and approve?`,
    title: 'Marketing Campaign Strategy Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        campaignName,
        programType,
        totalBudget: budget,
        audienceSegments: audienceResearch.segments.length,
        channels: channelStrategy.channels.length
      }
    }
  });

  // Task 7: Partnership and PR Strategy
  ctx.log('info', 'Developing partnership and PR strategy');
  const partnershipPR = await ctx.task(partnershipPRTask, {
    campaignName,
    programType,
    audienceSegments: audienceResearch.segments,
    outputDir
  });

  artifacts.push(...partnershipPR.artifacts);

  // Task 8: Measurement and Analytics
  ctx.log('info', 'Creating measurement and analytics framework');
  const measurementPlan = await ctx.task(measurementTask, {
    campaignName,
    campaignStrategy: campaignStrategy.strategy,
    channelStrategy: channelStrategy.channels,
    outputDir
  });

  artifacts.push(...measurementPlan.artifacts);

  // Task 9: Campaign Documentation
  ctx.log('info', 'Generating campaign documentation package');
  const campaignDocs = await ctx.task(campaignDocumentationTask, {
    campaignName,
    audienceResearch,
    campaignStrategy,
    messagingBrief,
    channelStrategy,
    contentPlan,
    digitalPlan,
    partnershipPR,
    measurementPlan,
    outputDir
  });

  artifacts.push(...campaignDocs.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    campaignStrategy: {
      strategy: campaignStrategy.strategy,
      objectives: campaignStrategy.objectives,
      positioning: campaignStrategy.positioning
    },
    audiences: {
      segments: audienceResearch.segments,
      personas: audienceResearch.personas
    },
    messaging: messagingBrief.brief,
    contentPlan: {
      calendar: contentPlan.calendar,
      assets: contentPlan.assets
    },
    channelMix: {
      channels: channelStrategy.channels,
      budget: channelStrategy.budgetAllocation,
      digital: digitalPlan.plan
    },
    partnerships: partnershipPR.partnerships,
    measurement: measurementPlan.framework,
    artifacts,
    duration,
    metadata: {
      processId: 'arts-culture/marketing-campaign',
      timestamp: startTime,
      campaignName
    }
  };
}

// Task 1: Audience Research
export const audienceResearchTask = defineTask('audience-research', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct audience research',
  agent: {
    name: 'audience-researcher',
    prompt: {
      role: 'arts marketing researcher',
      task: 'Conduct audience research and segmentation for cultural program',
      context: args,
      instructions: [
        'Analyze existing audience data and demographics',
        'Identify key audience segments',
        'Create audience personas',
        'Analyze audience motivations and barriers',
        'Identify audience media consumption habits',
        'Research competitor audience strategies',
        'Identify underserved audience segments',
        'Document audience insights and opportunities'
      ],
      outputFormat: 'JSON with success, segments, personas, insights, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'segments', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        segments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              demographics: { type: 'object' },
              motivations: { type: 'array' },
              channels: { type: 'array' }
            }
          }
        },
        personas: { type: 'array' },
        insights: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'marketing', 'audience', 'research']
}));

// Task 2: Campaign Strategy
export const campaignStrategyTask = defineTask('campaign-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop campaign strategy',
  agent: {
    name: 'marketing-strategist',
    prompt: {
      role: 'arts marketing strategist',
      task: 'Develop comprehensive marketing campaign strategy',
      context: args,
      instructions: [
        'Define campaign objectives and KPIs',
        'Develop campaign positioning',
        'Create campaign phases and timeline',
        'Define target reach and frequency',
        'Allocate budget by phase and channel',
        'Plan integrated marketing approach',
        'Define call-to-action strategy',
        'Create campaign success criteria'
      ],
      outputFormat: 'JSON with strategy, objectives, positioning, phases, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'objectives', 'artifacts'],
      properties: {
        strategy: {
          type: 'object',
          properties: {
            overview: { type: 'string' },
            phases: { type: 'array' },
            integration: { type: 'object' }
          }
        },
        objectives: { type: 'array' },
        positioning: { type: 'object' },
        kpis: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'marketing', 'strategy', 'campaign']
}));

// Task 3: Messaging Brief
export const messagingBriefTask = defineTask('messaging-brief', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop messaging brief',
  agent: {
    name: 'creative-strategist',
    prompt: {
      role: 'creative strategist',
      task: 'Develop messaging framework and creative brief',
      context: args,
      instructions: [
        'Develop key messaging hierarchy',
        'Create headline and tagline options',
        'Define tone and voice guidelines',
        'Develop audience-specific messaging',
        'Create proof points and supporting messages',
        'Define visual direction and guidelines',
        'Create creative brief for production',
        'Define brand compliance requirements'
      ],
      outputFormat: 'JSON with brief, messaging, creative, guidelines, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['brief', 'artifacts'],
      properties: {
        brief: {
          type: 'object',
          properties: {
            keyMessage: { type: 'string' },
            headlines: { type: 'array' },
            tone: { type: 'object' },
            visual: { type: 'object' }
          }
        },
        messaging: { type: 'object' },
        creative: { type: 'object' },
        guidelines: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'marketing', 'messaging', 'creative']
}));

// Task 4: Channel Strategy
export const channelStrategyTask = defineTask('channel-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop channel strategy',
  agent: {
    name: 'media-planner',
    prompt: {
      role: 'media planner',
      task: 'Develop channel strategy and media mix',
      context: args,
      instructions: [
        'Identify optimal marketing channels',
        'Develop media mix by audience segment',
        'Allocate budget across channels',
        'Plan owned, earned, paid media balance',
        'Define channel-specific tactics',
        'Plan channel sequencing and timing',
        'Identify partnership opportunities',
        'Create media calendar framework'
      ],
      outputFormat: 'JSON with channels, budgetAllocation, mediaMix, calendar, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['channels', 'budgetAllocation', 'artifacts'],
      properties: {
        channels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              budget: { type: 'number' },
              tactics: { type: 'array' }
            }
          }
        },
        budgetAllocation: { type: 'object' },
        mediaMix: { type: 'object' },
        calendar: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'marketing', 'channels', 'media']
}));

// Task 5: Content Plan
export const contentPlanTask = defineTask('content-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create content plan',
  agent: {
    name: 'content-strategist',
    prompt: {
      role: 'content strategist',
      task: 'Create comprehensive content plan and calendar',
      context: args,
      instructions: [
        'Define content types and formats',
        'Create content calendar',
        'Plan content production timeline',
        'Define content by channel',
        'Plan user-generated content strategy',
        'Create asset list and specifications',
        'Plan content repurposing strategy',
        'Define content approval workflow'
      ],
      outputFormat: 'JSON with calendar, assets, production, workflow, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['calendar', 'assets', 'artifacts'],
      properties: {
        calendar: {
          type: 'object',
          properties: {
            schedule: { type: 'array' },
            milestones: { type: 'array' },
            deadlines: { type: 'array' }
          }
        },
        assets: { type: 'array' },
        production: { type: 'object' },
        workflow: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'marketing', 'content', 'calendar']
}));

// Task 6: Digital Marketing
export const digitalMarketingTask = defineTask('digital-marketing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop digital marketing plan',
  agent: {
    name: 'digital-marketer',
    prompt: {
      role: 'digital marketing specialist',
      task: 'Develop comprehensive digital marketing plan',
      context: args,
      instructions: [
        'Plan social media strategy by platform',
        'Develop email marketing campaign',
        'Plan paid digital advertising',
        'Develop SEO and content optimization',
        'Plan website landing pages',
        'Design digital conversion funnel',
        'Plan remarketing and retargeting',
        'Define digital tracking and pixels'
      ],
      outputFormat: 'JSON with plan, social, email, advertising, seo, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'artifacts'],
      properties: {
        plan: {
          type: 'object',
          properties: {
            social: { type: 'object' },
            email: { type: 'object' },
            advertising: { type: 'object' },
            seo: { type: 'object' }
          }
        },
        social: { type: 'object' },
        email: { type: 'object' },
        advertising: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'marketing', 'digital', 'advertising']
}));

// Task 7: Partnership and PR
export const partnershipPRTask = defineTask('partnership-pr', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop partnership and PR strategy',
  agent: {
    name: 'pr-partnership-specialist',
    prompt: {
      role: 'PR and partnership specialist',
      task: 'Develop partnership and public relations strategy',
      context: args,
      instructions: [
        'Identify media targets and outlets',
        'Create press release schedule',
        'Plan media previews and events',
        'Identify promotional partners',
        'Develop community partnerships',
        'Plan influencer engagement',
        'Create media kit components',
        'Define PR success metrics'
      ],
      outputFormat: 'JSON with partnerships, pr, media, influencers, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['partnerships', 'pr', 'artifacts'],
      properties: {
        partnerships: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              partner: { type: 'string' },
              type: { type: 'string' },
              benefits: { type: 'array' }
            }
          }
        },
        pr: { type: 'object' },
        media: { type: 'array' },
        influencers: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'marketing', 'pr', 'partnerships']
}));

// Task 8: Measurement
export const measurementTask = defineTask('measurement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create measurement framework',
  agent: {
    name: 'analytics-specialist',
    prompt: {
      role: 'marketing analytics specialist',
      task: 'Create measurement and analytics framework',
      context: args,
      instructions: [
        'Define KPIs by objective',
        'Set up tracking and attribution',
        'Create reporting dashboard',
        'Plan A/B testing approach',
        'Define optimization criteria',
        'Plan post-campaign analysis',
        'Create ROI measurement framework',
        'Define reporting frequency and format'
      ],
      outputFormat: 'JSON with framework, kpis, tracking, reporting, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['framework', 'artifacts'],
      properties: {
        framework: {
          type: 'object',
          properties: {
            kpis: { type: 'array' },
            tracking: { type: 'object' },
            reporting: { type: 'object' }
          }
        },
        kpis: { type: 'array' },
        tracking: { type: 'object' },
        reporting: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'marketing', 'measurement', 'analytics']
}));

// Task 9: Campaign Documentation
export const campaignDocumentationTask = defineTask('campaign-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate campaign documentation',
  agent: {
    name: 'campaign-documenter',
    prompt: {
      role: 'marketing documentation specialist',
      task: 'Generate comprehensive campaign documentation package',
      context: args,
      instructions: [
        'Compile campaign brief document',
        'Create channel playbooks',
        'Document content specifications',
        'Create vendor briefing materials',
        'Generate budget tracking tools',
        'Create timeline and milestone tracker',
        'Compile all creative briefs',
        'Create campaign management checklist'
      ],
      outputFormat: 'JSON with documentation, playbooks, tools, checklist, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentation', 'artifacts'],
      properties: {
        documentation: {
          type: 'object',
          properties: {
            brief: { type: 'string' },
            playbooks: { type: 'array' },
            specifications: { type: 'array' }
          }
        },
        playbooks: { type: 'array' },
        tools: { type: 'array' },
        checklist: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'marketing', 'documentation', 'campaign']
}));
