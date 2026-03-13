/**
 * @process digital-marketing/influencer-campaign
 * @description End-to-end process for planning and executing influencer marketing campaigns, from strategy development through influencer selection, content creation, and performance measurement
 * @inputs { campaignBrief: object, budget: number, brandGuidelines: object, targetAudienceDefinition: object, outputDir: string }
 * @outputs { success: boolean, influencerShortlist: array, contracts: array, creativeBriefs: array, contentApprovals: array, campaignPerformanceReport: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    campaignBrief = {},
    budget = 50000,
    brandGuidelines = {},
    targetAudienceDefinition = {},
    outputDir = 'influencer-campaign-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Influencer Campaign Planning and Execution process');

  // Task 1: Define Campaign Objectives and KPIs
  ctx.log('info', 'Phase 1: Defining campaign objectives and KPIs');
  const objectivesResult = await ctx.task(campaignObjectivesTask, {
    campaignBrief,
    budget,
    outputDir
  });
  artifacts.push(...objectivesResult.artifacts);

  // Task 2: Establish Budget and Timeline
  ctx.log('info', 'Phase 2: Establishing budget and timeline');
  const budgetTimeline = await ctx.task(budgetTimelineTask, {
    campaignBrief,
    budget,
    objectives: objectivesResult,
    outputDir
  });
  artifacts.push(...budgetTimeline.artifacts);

  // Task 3: Identify Target Influencer Criteria
  ctx.log('info', 'Phase 3: Identifying target influencer criteria');
  const influencerCriteria = await ctx.task(influencerCriteriaTask, {
    targetAudienceDefinition,
    campaignBrief,
    brandGuidelines,
    outputDir
  });
  artifacts.push(...influencerCriteria.artifacts);

  // Task 4: Research and Shortlist Influencers
  ctx.log('info', 'Phase 4: Researching and shortlisting potential influencers');
  const influencerResearch = await ctx.task(influencerResearchTask, {
    influencerCriteria,
    budget,
    outputDir
  });
  artifacts.push(...influencerResearch.artifacts);

  // Task 5: Vet Influencers
  ctx.log('info', 'Phase 5: Vetting influencers for audience quality and brand fit');
  const influencerVetting = await ctx.task(influencerVettingTask, {
    shortlist: influencerResearch,
    brandGuidelines,
    outputDir
  });
  artifacts.push(...influencerVetting.artifacts);

  // Task 6: Outreach and Negotiation
  ctx.log('info', 'Phase 6: Conducting outreach and negotiating terms');
  const outreachNegotiation = await ctx.task(outreachNegotiationTask, {
    vettedInfluencers: influencerVetting,
    budget,
    campaignBrief,
    outputDir
  });
  artifacts.push(...outreachNegotiation.artifacts);

  // Task 7: Develop Creative Brief
  ctx.log('info', 'Phase 7: Developing creative brief and guidelines');
  const creativeBrief = await ctx.task(creativeBriefTask, {
    campaignBrief,
    brandGuidelines,
    confirmedInfluencers: outreachNegotiation,
    outputDir
  });
  artifacts.push(...creativeBrief.artifacts);

  // Breakpoint: Review before content creation
  await ctx.breakpoint({
    question: `Influencer campaign setup complete. ${influencerVetting.approvedCount} influencers approved with total budget allocation of ${budgetTimeline.allocatedBudget}. Proceed to content creation?`,
    title: 'Influencer Campaign Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        approvedInfluencers: influencerVetting.approvedCount,
        totalBudget: budget,
        allocatedBudget: budgetTimeline.allocatedBudget,
        campaignDuration: budgetTimeline.duration
      }
    }
  });

  // Task 8: Onboard Influencers
  ctx.log('info', 'Phase 8: Onboarding influencers and providing materials');
  const onboarding = await ctx.task(influencerOnboardingTask, {
    confirmedInfluencers: outreachNegotiation,
    creativeBrief,
    brandGuidelines,
    outputDir
  });
  artifacts.push(...onboarding.artifacts);

  // Task 9: Content Review and Approval
  ctx.log('info', 'Phase 9: Reviewing and approving content');
  const contentReview = await ctx.task(contentReviewApprovalTask, {
    creativeBrief,
    brandGuidelines,
    outputDir
  });
  artifacts.push(...contentReview.artifacts);

  // Task 10: Coordinate Publishing
  ctx.log('info', 'Phase 10: Coordinating publishing schedule');
  const publishingCoordination = await ctx.task(publishingCoordinationTask, {
    contentReview,
    campaignBrief,
    outputDir
  });
  artifacts.push(...publishingCoordination.artifacts);

  // Task 11: Monitor Campaign Performance
  ctx.log('info', 'Phase 11: Setting up campaign performance monitoring');
  const performanceMonitoring = await ctx.task(performanceMonitoringTask, {
    publishingCoordination,
    objectives: objectivesResult,
    outputDir
  });
  artifacts.push(...performanceMonitoring.artifacts);

  // Task 12: Analyze Results and Calculate ROI
  ctx.log('info', 'Phase 12: Creating results analysis and ROI framework');
  const resultsAnalysis = await ctx.task(resultsAnalysisTask, {
    performanceMonitoring,
    objectives: objectivesResult,
    budget,
    outputDir
  });
  artifacts.push(...resultsAnalysis.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    influencerShortlist: influencerVetting.approvedInfluencers,
    contracts: outreachNegotiation.contracts,
    creativeBriefs: creativeBrief.briefs,
    contentApprovals: contentReview.approvals,
    campaignPerformanceReport: resultsAnalysis.reportFramework,
    publishingSchedule: publishingCoordination.schedule,
    onboardingMaterials: onboarding.materials,
    artifacts,
    duration,
    metadata: {
      processId: 'digital-marketing/influencer-campaign',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task definitions
export const campaignObjectivesTask = defineTask('campaign-objectives', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define campaign objectives and KPIs',
  agent: {
    name: 'influencer-strategist',
    prompt: {
      role: 'influencer marketing strategist',
      task: 'Define clear campaign objectives and measurable KPIs',
      context: args,
      instructions: [
        'Define primary campaign objective (awareness, engagement, conversions)',
        'Set measurable KPIs (EMV, reach, engagement rate, conversions)',
        'Establish success criteria and benchmarks',
        'Define target audience for influencer content',
        'Identify content themes and messaging',
        'Set tracking and attribution approach',
        'Document campaign strategy'
      ],
      outputFormat: 'JSON with objectives, kpis, successCriteria, targetAudience, contentThemes, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['objectives', 'kpis', 'artifacts'],
      properties: {
        objectives: { type: 'object' },
        kpis: { type: 'array', items: { type: 'object' } },
        successCriteria: { type: 'array', items: { type: 'string' } },
        targetAudience: { type: 'object' },
        contentThemes: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'influencer-marketing', 'objectives', 'strategy']
}));

export const budgetTimelineTask = defineTask('budget-timeline', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish budget and timeline',
  agent: {
    name: 'campaign-planner',
    prompt: {
      role: 'influencer campaign planner',
      task: 'Establish detailed budget allocation and campaign timeline',
      context: args,
      instructions: [
        'Allocate budget across influencer tiers',
        'Plan budget for production and amplification',
        'Create campaign timeline and milestones',
        'Define deliverables schedule',
        'Set payment terms and schedule',
        'Plan contingency budget',
        'Document budget and timeline'
      ],
      outputFormat: 'JSON with budgetAllocation, allocatedBudget, timeline, duration, milestones, paymentSchedule, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['budgetAllocation', 'allocatedBudget', 'timeline', 'artifacts'],
      properties: {
        budgetAllocation: { type: 'object' },
        allocatedBudget: { type: 'number' },
        timeline: { type: 'object' },
        duration: { type: 'string' },
        milestones: { type: 'array', items: { type: 'object' } },
        paymentSchedule: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'influencer-marketing', 'budget', 'timeline']
}));

export const influencerCriteriaTask = defineTask('influencer-criteria', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify target influencer criteria',
  agent: {
    name: 'influencer-criteria-specialist',
    prompt: {
      role: 'influencer selection specialist',
      task: 'Define criteria for identifying ideal influencer partners',
      context: args,
      instructions: [
        'Define follower count ranges by tier',
        'Specify platform requirements',
        'Define audience demographic requirements',
        'Set engagement rate minimums',
        'Identify content style preferences',
        'Define brand safety requirements',
        'Set category/niche requirements',
        'Document selection criteria'
      ],
      outputFormat: 'JSON with criteria, tiers, platforms, audienceRequirements, engagementMinimums, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['criteria', 'artifacts'],
      properties: {
        criteria: { type: 'object' },
        tiers: { type: 'array', items: { type: 'object' } },
        platforms: { type: 'array', items: { type: 'string' } },
        audienceRequirements: { type: 'object' },
        engagementMinimums: { type: 'object' },
        contentStylePreferences: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'influencer-marketing', 'criteria', 'selection']
}));

export const influencerResearchTask = defineTask('influencer-research', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Research and shortlist potential influencers',
  agent: {
    name: 'influencer-researcher',
    prompt: {
      role: 'influencer research specialist',
      task: 'Research and create shortlist of potential influencer partners',
      context: args,
      instructions: [
        'Search influencer databases and platforms',
        'Identify influencers matching criteria',
        'Compile initial shortlist',
        'Gather basic metrics and data',
        'Assess content quality and style',
        'Check previous brand partnerships',
        'Prioritize by fit and availability',
        'Create research documentation'
      ],
      outputFormat: 'JSON with shortlist, shortlistCount, metrics, prioritization, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['shortlist', 'shortlistCount', 'artifacts'],
      properties: {
        shortlist: { type: 'array', items: { type: 'object' } },
        shortlistCount: { type: 'number' },
        metrics: { type: 'object' },
        prioritization: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'influencer-marketing', 'research', 'shortlist']
}));

export const influencerVettingTask = defineTask('influencer-vetting', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Vet influencers for audience quality and brand fit',
  agent: {
    name: 'influencer-vetter',
    prompt: {
      role: 'influencer vetting specialist',
      task: 'Thoroughly vet shortlisted influencers for quality and brand safety',
      context: args,
      instructions: [
        'Analyze audience authenticity (fake followers check)',
        'Verify engagement authenticity',
        'Assess brand fit and alignment',
        'Review content history for controversies',
        'Check competitor partnerships',
        'Evaluate audience demographics accuracy',
        'Assess content quality and professionalism',
        'Create vetting scorecard'
      ],
      outputFormat: 'JSON with approvedInfluencers, approvedCount, rejectedInfluencers, vettingScores, brandSafetyFlags, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['approvedInfluencers', 'approvedCount', 'artifacts'],
      properties: {
        approvedInfluencers: { type: 'array', items: { type: 'object' } },
        approvedCount: { type: 'number' },
        rejectedInfluencers: { type: 'array', items: { type: 'object' } },
        vettingScores: { type: 'object' },
        brandSafetyFlags: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'influencer-marketing', 'vetting', 'brand-safety']
}));

export const outreachNegotiationTask = defineTask('outreach-negotiation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct outreach and negotiate terms',
  agent: {
    name: 'influencer-negotiator',
    prompt: {
      role: 'influencer partnerships manager',
      task: 'Conduct outreach to influencers and negotiate partnership terms',
      context: args,
      instructions: [
        'Draft personalized outreach messages',
        'Present campaign opportunity',
        'Negotiate rates and deliverables',
        'Discuss usage rights and exclusivity',
        'Agree on timeline and milestones',
        'Draft partnership contracts',
        'Confirm all terms and expectations',
        'Document negotiation outcomes'
      ],
      outputFormat: 'JSON with contracts, confirmedInfluencers, rates, deliverables, usageRights, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['contracts', 'artifacts'],
      properties: {
        contracts: { type: 'array', items: { type: 'object' } },
        confirmedInfluencers: { type: 'array', items: { type: 'object' } },
        rates: { type: 'object' },
        deliverables: { type: 'array', items: { type: 'object' } },
        usageRights: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'influencer-marketing', 'outreach', 'negotiation']
}));

export const creativeBriefTask = defineTask('creative-brief', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop creative brief and guidelines',
  agent: {
    name: 'creative-director',
    prompt: {
      role: 'influencer creative director',
      task: 'Develop detailed creative brief and content guidelines for influencers',
      context: args,
      instructions: [
        'Define key messages and talking points',
        'Specify required brand elements',
        'Outline content format requirements',
        'Provide brand voice guidelines',
        'Include disclosure requirements (FTC)',
        'Specify dos and don\'ts',
        'Provide inspiration and examples',
        'Create individual briefs if needed'
      ],
      outputFormat: 'JSON with briefs, keyMessages, brandElements, disclosureRequirements, dosAndDonts, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['briefs', 'artifacts'],
      properties: {
        briefs: { type: 'array', items: { type: 'object' } },
        keyMessages: { type: 'array', items: { type: 'string' } },
        brandElements: { type: 'object' },
        disclosureRequirements: { type: 'object' },
        dosAndDonts: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'influencer-marketing', 'creative-brief', 'guidelines']
}));

export const influencerOnboardingTask = defineTask('influencer-onboarding', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Onboard influencers and provide materials',
  agent: {
    name: 'onboarding-coordinator',
    prompt: {
      role: 'influencer onboarding coordinator',
      task: 'Onboard confirmed influencers and provide all necessary materials',
      context: args,
      instructions: [
        'Create onboarding package',
        'Share creative briefs and guidelines',
        'Provide product samples/access',
        'Set up communication channels',
        'Share tracking links and codes',
        'Conduct kickoff calls if needed',
        'Answer questions and clarify expectations',
        'Document onboarding completion'
      ],
      outputFormat: 'JSON with materials, onboardingStatus, trackingCodes, communicationSetup, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['materials', 'artifacts'],
      properties: {
        materials: { type: 'array', items: { type: 'object' } },
        onboardingStatus: { type: 'object' },
        trackingCodes: { type: 'array', items: { type: 'object' } },
        communicationSetup: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'influencer-marketing', 'onboarding']
}));

export const contentReviewApprovalTask = defineTask('content-review-approval', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review and approve content',
  agent: {
    name: 'content-reviewer',
    prompt: {
      role: 'influencer content reviewer',
      task: 'Review influencer content submissions and manage approval process',
      context: args,
      instructions: [
        'Create content review checklist',
        'Review content against brief',
        'Check brand guidelines compliance',
        'Verify disclosure compliance',
        'Provide constructive feedback',
        'Track revisions and resubmissions',
        'Document approval status',
        'Manage approval workflow'
      ],
      outputFormat: 'JSON with approvals, reviewChecklist, feedback, revisionRequests, approvalWorkflow, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['approvals', 'artifacts'],
      properties: {
        approvals: { type: 'array', items: { type: 'object' } },
        reviewChecklist: { type: 'array', items: { type: 'object' } },
        feedback: { type: 'array', items: { type: 'object' } },
        revisionRequests: { type: 'array', items: { type: 'object' } },
        approvalWorkflow: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'influencer-marketing', 'content-review', 'approval']
}));

export const publishingCoordinationTask = defineTask('publishing-coordination', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Coordinate publishing schedule',
  agent: {
    name: 'publishing-coordinator',
    prompt: {
      role: 'influencer publishing coordinator',
      task: 'Coordinate content publishing schedule across all influencers',
      context: args,
      instructions: [
        'Create publishing calendar',
        'Coordinate optimal posting times',
        'Ensure content spacing and pacing',
        'Coordinate with broader marketing calendar',
        'Set up publishing reminders',
        'Verify tracking is active',
        'Monitor publishing completion',
        'Document publishing schedule'
      ],
      outputFormat: 'JSON with schedule, publishingCalendar, coordination, reminders, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['schedule', 'artifacts'],
      properties: {
        schedule: { type: 'object' },
        publishingCalendar: { type: 'array', items: { type: 'object' } },
        coordination: { type: 'object' },
        reminders: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'influencer-marketing', 'publishing', 'coordination']
}));

export const performanceMonitoringTask = defineTask('performance-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up campaign performance monitoring',
  agent: {
    name: 'performance-monitor',
    prompt: {
      role: 'influencer campaign analyst',
      task: 'Set up and execute campaign performance monitoring',
      context: args,
      instructions: [
        'Set up real-time tracking dashboards',
        'Monitor content performance metrics',
        'Track engagement and reach',
        'Monitor conversion tracking',
        'Identify top-performing content',
        'Flag underperforming content',
        'Track against KPIs',
        'Create monitoring reports'
      ],
      outputFormat: 'JSON with dashboards, metrics, tracking, alerts, reports, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['dashboards', 'artifacts'],
      properties: {
        dashboards: { type: 'array', items: { type: 'object' } },
        metrics: { type: 'object' },
        tracking: { type: 'object' },
        alerts: { type: 'array', items: { type: 'object' } },
        reports: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'influencer-marketing', 'performance', 'monitoring']
}));

export const resultsAnalysisTask = defineTask('results-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create results analysis and ROI framework',
  agent: {
    name: 'results-analyst',
    prompt: {
      role: 'influencer marketing analyst',
      task: 'Analyze campaign results and calculate ROI',
      context: args,
      instructions: [
        'Compile all performance data',
        'Calculate EMV (Earned Media Value)',
        'Measure against KPIs',
        'Calculate campaign ROI',
        'Identify top-performing influencers',
        'Analyze content performance patterns',
        'Generate insights and learnings',
        'Create comprehensive report'
      ],
      outputFormat: 'JSON with reportFramework, emv, roi, kpiPerformance, topPerformers, insights, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportFramework', 'artifacts'],
      properties: {
        reportFramework: { type: 'object' },
        emv: { type: 'number' },
        roi: { type: 'number' },
        kpiPerformance: { type: 'object' },
        topPerformers: { type: 'array', items: { type: 'object' } },
        insights: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'influencer-marketing', 'results', 'roi']
}));
