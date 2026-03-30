/**
 * @process marketing/integrated-campaign-planning
 * @description Develop cross-channel campaign strategy including objectives, target audience, messaging, channel mix (PESO model), budget allocation, timeline, and success metrics.
 * @inputs { campaignName: string, businessObjectives: object, targetAudience: object, budget: number, timeline: object, brandGuidelines: object }
 * @outputs { success: boolean, campaignStrategy: object, channelMix: object, budget: object, timeline: object, kpis: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    campaignName = 'Campaign',
    businessObjectives = {},
    targetAudience = {},
    budget = 0,
    timeline = {},
    brandGuidelines = {},
    outputDir = 'campaign-planning-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Integrated Campaign Planning for ${campaignName}`);

  // ============================================================================
  // PHASE 1: CAMPAIGN OBJECTIVES DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining campaign objectives and KPIs');
  const objectivesDefinition = await ctx.task(campaignObjectivesTask, {
    campaignName,
    businessObjectives,
    targetAudience,
    outputDir
  });

  artifacts.push(...objectivesDefinition.artifacts);

  // ============================================================================
  // PHASE 2: AUDIENCE STRATEGY DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 2: Developing audience targeting strategy');
  const audienceStrategy = await ctx.task(audienceStrategyTask, {
    campaignName,
    targetAudience,
    objectivesDefinition,
    outputDir
  });

  artifacts.push(...audienceStrategy.artifacts);

  // ============================================================================
  // PHASE 3: MESSAGING FRAMEWORK
  // ============================================================================

  ctx.log('info', 'Phase 3: Creating messaging framework');
  const messagingFramework = await ctx.task(messagingFrameworkTask, {
    campaignName,
    objectivesDefinition,
    audienceStrategy,
    brandGuidelines,
    outputDir
  });

  artifacts.push(...messagingFramework.artifacts);

  // ============================================================================
  // PHASE 4: CHANNEL MIX PLANNING (PESO MODEL)
  // ============================================================================

  ctx.log('info', 'Phase 4: Planning channel mix using PESO model');
  const channelMixPlan = await ctx.task(channelMixPlanningTask, {
    campaignName,
    objectivesDefinition,
    audienceStrategy,
    messagingFramework,
    budget,
    outputDir
  });

  artifacts.push(...channelMixPlan.artifacts);

  // ============================================================================
  // PHASE 5: BUDGET ALLOCATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Allocating campaign budget');
  const budgetAllocation = await ctx.task(budgetAllocationTask, {
    campaignName,
    budget,
    channelMixPlan,
    objectivesDefinition,
    outputDir
  });

  artifacts.push(...budgetAllocation.artifacts);

  // ============================================================================
  // PHASE 6: TIMELINE AND MILESTONES
  // ============================================================================

  ctx.log('info', 'Phase 6: Developing campaign timeline and milestones');
  const campaignTimeline = await ctx.task(campaignTimelineTask, {
    campaignName,
    timeline,
    channelMixPlan,
    budgetAllocation,
    outputDir
  });

  artifacts.push(...campaignTimeline.artifacts);

  // ============================================================================
  // PHASE 7: CREATIVE BRIEF DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 7: Developing creative brief');
  const creativeBrief = await ctx.task(creativeBriefTask, {
    campaignName,
    objectivesDefinition,
    audienceStrategy,
    messagingFramework,
    channelMixPlan,
    brandGuidelines,
    outputDir
  });

  artifacts.push(...creativeBrief.artifacts);

  // ============================================================================
  // PHASE 8: MEASUREMENT FRAMEWORK
  // ============================================================================

  ctx.log('info', 'Phase 8: Creating measurement and reporting framework');
  const measurementFramework = await ctx.task(measurementFrameworkTask, {
    campaignName,
    objectivesDefinition,
    channelMixPlan,
    budgetAllocation,
    outputDir
  });

  artifacts.push(...measurementFramework.artifacts);

  // ============================================================================
  // PHASE 9: CAMPAIGN PLAN QUALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 9: Assessing campaign plan quality');
  const qualityAssessment = await ctx.task(campaignPlanQualityTask, {
    campaignName,
    objectivesDefinition,
    audienceStrategy,
    messagingFramework,
    channelMixPlan,
    budgetAllocation,
    campaignTimeline,
    creativeBrief,
    measurementFramework,
    outputDir
  });

  artifacts.push(...qualityAssessment.artifacts);

  const campaignScore = qualityAssessment.overallScore;
  const qualityMet = campaignScore >= 80;

  // Breakpoint: Review campaign plan
  await ctx.breakpoint({
    question: `Campaign plan complete. Quality score: ${campaignScore}/100. ${qualityMet ? 'Plan meets quality standards!' : 'Plan may need refinement.'} Review and approve?`,
    title: 'Campaign Plan Review & Approval',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        campaignScore,
        qualityMet,
        campaignName,
        totalArtifacts: artifacts.length,
        totalBudget: budget,
        channelCount: channelMixPlan.channels?.length || 0,
        kpiCount: measurementFramework.kpis?.length || 0
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    campaignName,
    campaignScore,
    qualityMet,
    campaignStrategy: {
      objectives: objectivesDefinition.objectives,
      audience: audienceStrategy.segments,
      messaging: messagingFramework.keyMessages
    },
    channelMix: {
      paid: channelMixPlan.paid,
      earned: channelMixPlan.earned,
      shared: channelMixPlan.shared,
      owned: channelMixPlan.owned
    },
    budget: {
      total: budgetAllocation.totalBudget,
      allocation: budgetAllocation.channelAllocation,
      contingency: budgetAllocation.contingency
    },
    timeline: {
      phases: campaignTimeline.phases,
      milestones: campaignTimeline.milestones,
      duration: campaignTimeline.duration
    },
    kpis: measurementFramework.kpis,
    creativeBrief: creativeBrief.brief,
    artifacts,
    duration,
    metadata: {
      processId: 'marketing/integrated-campaign-planning',
      timestamp: startTime,
      campaignName,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Campaign Objectives Definition
export const campaignObjectivesTask = defineTask('campaign-objectives', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define campaign objectives and KPIs',
  agent: {
    name: 'campaign-strategist',
    prompt: {
      role: 'senior marketing strategist and campaign planner',
      task: 'Define clear, measurable campaign objectives aligned with business goals',
      context: args,
      instructions: [
        'Translate business objectives into campaign objectives',
        'Apply SMART criteria (Specific, Measurable, Achievable, Relevant, Time-bound)',
        'Define primary and secondary campaign objectives',
        'Identify awareness, consideration, and conversion goals',
        'Set quantitative targets for each objective',
        'Align objectives with marketing funnel stages',
        'Define leading and lagging indicators',
        'Establish baseline metrics for comparison',
        'Generate campaign objectives document'
      ],
      outputFormat: 'JSON with objectives (array), primaryObjective (object), secondaryObjectives (array), targets (object), funnelAlignment (object), baselines (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['objectives', 'primaryObjective', 'targets', 'artifacts'],
      properties: {
        objectives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              objective: { type: 'string' },
              type: { type: 'string' },
              target: { type: 'string' },
              timeline: { type: 'string' }
            }
          }
        },
        primaryObjective: {
          type: 'object',
          properties: {
            objective: { type: 'string' },
            metric: { type: 'string' },
            target: { type: 'number' }
          }
        },
        secondaryObjectives: { type: 'array' },
        targets: { type: 'object' },
        funnelAlignment: { type: 'object' },
        baselines: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'campaign-planning', 'objectives']
}));

// Task 2: Audience Strategy Development
export const audienceStrategyTask = defineTask('audience-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop audience targeting strategy',
  agent: {
    name: 'audience-strategist',
    prompt: {
      role: 'audience insights and targeting specialist',
      task: 'Develop comprehensive audience targeting strategy for campaign execution',
      context: args,
      instructions: [
        'Define primary and secondary target audience segments',
        'Create detailed audience profiles with demographics and psychographics',
        'Identify audience pain points and motivations',
        'Map audience journey stages and touchpoints',
        'Define targeting criteria for each channel',
        'Identify look-alike and expansion audiences',
        'Develop audience prioritization matrix',
        'Define personalization opportunities',
        'Generate audience strategy document'
      ],
      outputFormat: 'JSON with segments (array), primaryAudience (object), secondaryAudiences (array), targetingCriteria (object), journeyMap (object), personalization (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['segments', 'primaryAudience', 'targetingCriteria', 'artifacts'],
      properties: {
        segments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              size: { type: 'string' },
              priority: { type: 'string' },
              characteristics: { type: 'object' }
            }
          }
        },
        primaryAudience: { type: 'object' },
        secondaryAudiences: { type: 'array' },
        targetingCriteria: {
          type: 'object',
          properties: {
            demographic: { type: 'object' },
            behavioral: { type: 'object' },
            contextual: { type: 'object' }
          }
        },
        journeyMap: { type: 'object' },
        personalization: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'campaign-planning', 'audience']
}));

// Task 3: Messaging Framework
export const messagingFrameworkTask = defineTask('messaging-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create messaging framework',
  agent: {
    name: 'messaging-strategist',
    prompt: {
      role: 'creative strategist and copywriter',
      task: 'Develop compelling messaging framework aligned with brand and audience',
      context: args,
      instructions: [
        'Define campaign theme and big idea',
        'Create key message hierarchy',
        'Develop audience-specific message variations',
        'Create channel-appropriate messaging adaptations',
        'Define call-to-action strategy',
        'Develop proof points and supporting messages',
        'Ensure brand voice consistency',
        'Create message testing plan',
        'Generate messaging framework document'
      ],
      outputFormat: 'JSON with campaignTheme (string), bigIdea (string), keyMessages (array), audienceMessages (object), channelMessages (object), ctaStrategy (object), proofPoints (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['campaignTheme', 'keyMessages', 'ctaStrategy', 'artifacts'],
      properties: {
        campaignTheme: { type: 'string' },
        bigIdea: { type: 'string' },
        keyMessages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              priority: { type: 'string' },
              audience: { type: 'string' }
            }
          }
        },
        audienceMessages: { type: 'object' },
        channelMessages: { type: 'object' },
        ctaStrategy: {
          type: 'object',
          properties: {
            primary: { type: 'string' },
            secondary: { type: 'array', items: { type: 'string' } }
          }
        },
        proofPoints: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'campaign-planning', 'messaging']
}));

// Task 4: Channel Mix Planning (PESO Model)
export const channelMixPlanningTask = defineTask('channel-mix-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan channel mix using PESO model',
  agent: {
    name: 'channel-planner',
    prompt: {
      role: 'integrated media planner and PESO model expert',
      task: 'Plan optimal channel mix using PESO (Paid, Earned, Shared, Owned) framework',
      context: args,
      instructions: [
        'Define Paid media strategy (advertising, sponsored content)',
        'Plan Earned media approach (PR, influencer, media relations)',
        'Design Shared media tactics (social media, community)',
        'Optimize Owned media assets (website, email, content)',
        'Map channels to funnel stages and objectives',
        'Define channel roles and integration points',
        'Identify channel synergies and dependencies',
        'Recommend channel priorities based on audience behavior',
        'Generate PESO channel mix document'
      ],
      outputFormat: 'JSON with paid (object), earned (object), shared (object), owned (object), channels (array), integration (object), priorities (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['paid', 'earned', 'shared', 'owned', 'channels', 'artifacts'],
      properties: {
        paid: {
          type: 'object',
          properties: {
            channels: { type: 'array', items: { type: 'string' } },
            tactics: { type: 'array' },
            role: { type: 'string' }
          }
        },
        earned: {
          type: 'object',
          properties: {
            channels: { type: 'array', items: { type: 'string' } },
            tactics: { type: 'array' },
            role: { type: 'string' }
          }
        },
        shared: {
          type: 'object',
          properties: {
            channels: { type: 'array', items: { type: 'string' } },
            tactics: { type: 'array' },
            role: { type: 'string' }
          }
        },
        owned: {
          type: 'object',
          properties: {
            channels: { type: 'array', items: { type: 'string' } },
            tactics: { type: 'array' },
            role: { type: 'string' }
          }
        },
        channels: { type: 'array' },
        integration: { type: 'object' },
        priorities: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'campaign-planning', 'channel-mix', 'peso']
}));

// Task 5: Budget Allocation
export const budgetAllocationTask = defineTask('budget-allocation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Allocate campaign budget',
  agent: {
    name: 'budget-planner',
    prompt: {
      role: 'marketing finance manager and media buyer',
      task: 'Allocate campaign budget optimally across channels and activities',
      context: args,
      instructions: [
        'Allocate budget across PESO channels based on priorities',
        'Define budget split by campaign phase',
        'Allocate for creative development and production',
        'Set aside testing and optimization budget',
        'Plan contingency reserve',
        'Define budget flexibility and reallocation rules',
        'Create budget tracking and reporting framework',
        'Estimate expected ROI by channel',
        'Generate budget allocation document'
      ],
      outputFormat: 'JSON with totalBudget (number), channelAllocation (object), phaseAllocation (object), creativeProduction (number), testing (number), contingency (number), roiEstimates (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalBudget', 'channelAllocation', 'contingency', 'artifacts'],
      properties: {
        totalBudget: { type: 'number' },
        channelAllocation: {
          type: 'object',
          properties: {
            paid: { type: 'number' },
            earned: { type: 'number' },
            shared: { type: 'number' },
            owned: { type: 'number' }
          }
        },
        phaseAllocation: { type: 'object' },
        creativeProduction: { type: 'number' },
        testing: { type: 'number' },
        contingency: { type: 'number' },
        roiEstimates: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'campaign-planning', 'budget']
}));

// Task 6: Campaign Timeline
export const campaignTimelineTask = defineTask('campaign-timeline', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop campaign timeline and milestones',
  agent: {
    name: 'project-planner',
    prompt: {
      role: 'marketing project manager and campaign coordinator',
      task: 'Develop comprehensive campaign timeline with phases and milestones',
      context: args,
      instructions: [
        'Define campaign phases (planning, production, launch, optimization, wrap-up)',
        'Set key milestones and decision points',
        'Create detailed activity timeline',
        'Define dependencies and critical path',
        'Plan resource allocation across phases',
        'Build in buffer for approvals and iterations',
        'Create go-live checklist',
        'Define escalation and contingency plans',
        'Generate campaign timeline document'
      ],
      outputFormat: 'JSON with phases (array), milestones (array), duration (string), criticalPath (array), goLiveChecklist (array), contingencyPlan (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['phases', 'milestones', 'duration', 'artifacts'],
      properties: {
        phases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string' },
              duration: { type: 'string' },
              activities: { type: 'array', items: { type: 'string' } },
              deliverables: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        milestones: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              milestone: { type: 'string' },
              date: { type: 'string' },
              owner: { type: 'string' }
            }
          }
        },
        duration: { type: 'string' },
        criticalPath: { type: 'array', items: { type: 'string' } },
        goLiveChecklist: { type: 'array', items: { type: 'string' } },
        contingencyPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'campaign-planning', 'timeline']
}));

// Task 7: Creative Brief Development
export const creativeBriefTask = defineTask('creative-brief', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop creative brief',
  agent: {
    name: 'creative-director',
    prompt: {
      role: 'creative director and brand strategist',
      task: 'Develop comprehensive creative brief to guide campaign execution',
      context: args,
      instructions: [
        'Summarize campaign background and context',
        'Define creative challenge and opportunity',
        'Articulate target audience insights',
        'State key message and proposition',
        'Define desired consumer response',
        'List mandatory elements and brand guidelines',
        'Specify deliverables and formats needed',
        'Set timeline and approval process',
        'Include competitive context and differentiation',
        'Generate creative brief document'
      ],
      outputFormat: 'JSON with brief (object), challenge (string), insights (array), proposition (string), desiredResponse (string), mandatories (array), deliverables (array), approvalProcess (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['brief', 'challenge', 'proposition', 'deliverables', 'artifacts'],
      properties: {
        brief: {
          type: 'object',
          properties: {
            background: { type: 'string' },
            objective: { type: 'string' },
            audience: { type: 'string' },
            message: { type: 'string' },
            tone: { type: 'string' }
          }
        },
        challenge: { type: 'string' },
        insights: { type: 'array', items: { type: 'string' } },
        proposition: { type: 'string' },
        desiredResponse: { type: 'string' },
        mandatories: { type: 'array', items: { type: 'string' } },
        deliverables: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              deliverable: { type: 'string' },
              format: { type: 'string' },
              quantity: { type: 'number' }
            }
          }
        },
        approvalProcess: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'campaign-planning', 'creative-brief']
}));

// Task 8: Measurement Framework
export const measurementFrameworkTask = defineTask('measurement-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create measurement and reporting framework',
  agent: {
    name: 'analytics-strategist',
    prompt: {
      role: 'marketing analytics director and measurement specialist',
      task: 'Create comprehensive measurement framework for campaign performance tracking',
      context: args,
      instructions: [
        'Define KPIs aligned with campaign objectives',
        'Set targets and benchmarks for each KPI',
        'Define leading and lagging indicators',
        'Create measurement methodology for each channel',
        'Plan tracking implementation and tagging',
        'Define attribution approach',
        'Create reporting cadence and templates',
        'Plan optimization triggers and thresholds',
        'Generate measurement framework document'
      ],
      outputFormat: 'JSON with kpis (array), targets (object), attribution (object), trackingPlan (object), reportingCadence (object), optimizationTriggers (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['kpis', 'targets', 'trackingPlan', 'artifacts'],
      properties: {
        kpis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              kpi: { type: 'string' },
              definition: { type: 'string' },
              target: { type: 'string' },
              source: { type: 'string' }
            }
          }
        },
        targets: { type: 'object' },
        attribution: {
          type: 'object',
          properties: {
            model: { type: 'string' },
            rationale: { type: 'string' }
          }
        },
        trackingPlan: {
          type: 'object',
          properties: {
            tools: { type: 'array', items: { type: 'string' } },
            implementation: { type: 'array' }
          }
        },
        reportingCadence: {
          type: 'object',
          properties: {
            daily: { type: 'array', items: { type: 'string' } },
            weekly: { type: 'array', items: { type: 'string' } },
            monthly: { type: 'array', items: { type: 'string' } }
          }
        },
        optimizationTriggers: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'campaign-planning', 'measurement']
}));

// Task 9: Campaign Plan Quality Assessment
export const campaignPlanQualityTask = defineTask('campaign-plan-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess campaign plan quality',
  agent: {
    name: 'campaign-validator',
    prompt: {
      role: 'chief marketing officer and campaign strategist',
      task: 'Assess overall campaign plan quality and readiness for execution',
      context: args,
      instructions: [
        'Evaluate objectives clarity and measurability (weight: 15%)',
        'Assess audience targeting precision (weight: 15%)',
        'Review messaging relevance and differentiation (weight: 15%)',
        'Evaluate channel mix appropriateness (weight: 15%)',
        'Assess budget allocation efficiency (weight: 10%)',
        'Review timeline feasibility (weight: 10%)',
        'Evaluate creative brief completeness (weight: 10%)',
        'Assess measurement framework robustness (weight: 10%)',
        'Calculate weighted overall score (0-100)',
        'Identify gaps and recommendations'
      ],
      outputFormat: 'JSON with overallScore (number 0-100), componentScores (object), gaps (array), recommendations (array), strengths (array), readinessLevel (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'recommendations', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            objectives: { type: 'number' },
            audience: { type: 'number' },
            messaging: { type: 'number' },
            channelMix: { type: 'number' },
            budget: { type: 'number' },
            timeline: { type: 'number' },
            creativeBrief: { type: 'number' },
            measurement: { type: 'number' }
          }
        },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        strengths: { type: 'array', items: { type: 'string' } },
        readinessLevel: { type: 'string', enum: ['ready', 'minor-revisions', 'major-revisions'] },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'campaign-planning', 'quality-assessment']
}));
