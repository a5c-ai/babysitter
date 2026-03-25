/**
 * @process digital-marketing/ppc-campaign-setup
 * @description End-to-end process for setting up and launching paid search campaigns on Google Ads and Microsoft Advertising, including account structure design, keyword research, ad copy creation, bidding strategy configuration, and conversion tracking implementation
 * @inputs { campaignBrief: object, budget: number, targetAudience: object, landingPages: array, conversionGoals: array, outputDir: string }
 * @outputs { success: boolean, campaigns: array, keywordLists: array, adCopyAssets: array, trackingDocumentation: object, launchChecklist: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    campaignBrief = {},
    budget = 10000,
    targetAudience = {},
    landingPages = [],
    conversionGoals = [],
    outputDir = 'ppc-campaign-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting PPC Campaign Setup and Launch process');

  // Task 1: Define Campaign Objectives and KPIs
  ctx.log('info', 'Phase 1: Defining campaign objectives and KPIs');
  const objectivesResult = await ctx.task(campaignObjectivesTask, {
    campaignBrief,
    budget,
    conversionGoals,
    outputDir
  });
  artifacts.push(...objectivesResult.artifacts);

  // Task 2: Keyword Research and Competitive Analysis
  ctx.log('info', 'Phase 2: Conducting keyword research and competitive analysis');
  const keywordResearch = await ctx.task(keywordResearchTask, {
    campaignBrief,
    targetAudience,
    objectives: objectivesResult,
    outputDir
  });
  artifacts.push(...keywordResearch.artifacts);

  // Task 3: Campaign and Ad Group Structure Design
  ctx.log('info', 'Phase 3: Designing campaign and ad group structure');
  const structureDesign = await ctx.task(campaignStructureTask, {
    campaignBrief,
    keywordResearch,
    objectives: objectivesResult,
    outputDir
  });
  artifacts.push(...structureDesign.artifacts);

  // Task 4: Ad Copy Creation
  ctx.log('info', 'Phase 4: Writing ad copy variations');
  const adCopyResult = await ctx.task(adCopyCreationTask, {
    campaignBrief,
    structureDesign,
    landingPages,
    keywordResearch,
    outputDir
  });
  artifacts.push(...adCopyResult.artifacts);

  // Task 5: Bidding Strategy Configuration
  ctx.log('info', 'Phase 5: Configuring bidding strategies and budget allocation');
  const biddingConfig = await ctx.task(biddingStrategyTask, {
    campaignBrief,
    budget,
    objectives: objectivesResult,
    structureDesign,
    outputDir
  });
  artifacts.push(...biddingConfig.artifacts);

  // Task 6: Audience Targeting and Remarketing Setup
  ctx.log('info', 'Phase 6: Setting up audience targeting and remarketing lists');
  const audienceSetup = await ctx.task(audienceTargetingTask, {
    targetAudience,
    campaignBrief,
    structureDesign,
    outputDir
  });
  artifacts.push(...audienceSetup.artifacts);

  // Task 7: Conversion Tracking Implementation
  ctx.log('info', 'Phase 7: Implementing conversion tracking and goals');
  const trackingSetup = await ctx.task(conversionTrackingTask, {
    conversionGoals,
    landingPages,
    structureDesign,
    outputDir
  });
  artifacts.push(...trackingSetup.artifacts);

  // Task 8: QA and Launch Checklist
  ctx.log('info', 'Phase 8: QA campaign settings and preparing launch checklist');
  const qaResult = await ctx.task(campaignQATask, {
    structureDesign,
    adCopyResult,
    biddingConfig,
    audienceSetup,
    trackingSetup,
    outputDir
  });
  artifacts.push(...qaResult.artifacts);

  // Breakpoint: Review campaign before launch
  await ctx.breakpoint({
    question: `PPC campaign setup complete. ${qaResult.passedChecks}/${qaResult.totalChecks} QA checks passed. Ready to launch?`,
    title: 'PPC Campaign Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        campaignCount: structureDesign.campaignCount,
        adGroupCount: structureDesign.adGroupCount,
        keywordCount: keywordResearch.totalKeywords,
        adVariations: adCopyResult.adVariations,
        budget,
        qaScore: qaResult.qaScore
      }
    }
  });

  // Task 9: Launch and Initial Monitoring Plan
  ctx.log('info', 'Phase 9: Creating launch and monitoring plan');
  const launchPlan = await ctx.task(launchMonitoringTask, {
    structureDesign,
    objectives: objectivesResult,
    biddingConfig,
    qaResult,
    outputDir
  });
  artifacts.push(...launchPlan.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    campaigns: structureDesign.campaigns,
    keywordLists: keywordResearch.keywordLists,
    adCopyAssets: adCopyResult.adAssets,
    trackingDocumentation: trackingSetup.documentation,
    launchChecklist: qaResult.checklist,
    objectives: objectivesResult.kpis,
    biddingStrategy: biddingConfig.strategy,
    audienceTargeting: audienceSetup.audiences,
    monitoringPlan: launchPlan.monitoringSchedule,
    artifacts,
    duration,
    metadata: {
      processId: 'digital-marketing/ppc-campaign-setup',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: Campaign Objectives and KPIs Definition
export const campaignObjectivesTask = defineTask('campaign-objectives', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define campaign objectives and KPIs',
  agent: {
    name: 'ppc-strategist',
    prompt: {
      role: 'senior PPC strategist',
      task: 'Define clear campaign objectives, KPIs, and success metrics for the PPC campaign',
      context: args,
      instructions: [
        'Analyze campaign brief and business objectives',
        'Define primary campaign goal (awareness, traffic, leads, sales)',
        'Establish measurable KPIs (CTR, CPC, CPA, ROAS targets)',
        'Set realistic benchmarks based on industry standards',
        'Define conversion funnel stages and micro-conversions',
        'Create attribution model recommendations',
        'Document success criteria and optimization thresholds'
      ],
      outputFormat: 'JSON with objectives, kpis, benchmarks, attributionModel, successCriteria, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['objectives', 'kpis', 'artifacts'],
      properties: {
        objectives: {
          type: 'object',
          properties: {
            primaryGoal: { type: 'string' },
            secondaryGoals: { type: 'array', items: { type: 'string' } },
            targetOutcomes: { type: 'array', items: { type: 'string' } }
          }
        },
        kpis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              target: { type: 'string' },
              benchmark: { type: 'string' }
            }
          }
        },
        benchmarks: { type: 'object' },
        attributionModel: { type: 'string' },
        successCriteria: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ppc', 'objectives', 'kpis']
}));

// Task 2: Keyword Research and Competitive Analysis
export const keywordResearchTask = defineTask('keyword-research', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct keyword research and competitive analysis',
  agent: {
    name: 'keyword-researcher',
    prompt: {
      role: 'PPC keyword research specialist',
      task: 'Perform comprehensive keyword research and competitive analysis for PPC campaign',
      context: args,
      instructions: [
        'Identify seed keywords from campaign brief',
        'Expand keyword list using keyword research tools',
        'Analyze search volume, competition, and CPC estimates',
        'Categorize keywords by intent (informational, commercial, transactional)',
        'Identify negative keywords to exclude',
        'Analyze competitor keywords and ad strategies',
        'Prioritize keywords by relevance and opportunity',
        'Group keywords by theme for ad group structure'
      ],
      outputFormat: 'JSON with keywordLists, competitorAnalysis, negativeKeywords, totalKeywords, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['keywordLists', 'totalKeywords', 'artifacts'],
      properties: {
        keywordLists: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              theme: { type: 'string' },
              keywords: { type: 'array', items: { type: 'string' } },
              avgCpc: { type: 'number' },
              avgVolume: { type: 'number' }
            }
          }
        },
        competitorAnalysis: {
          type: 'object',
          properties: {
            competitors: { type: 'array', items: { type: 'string' } },
            competitorKeywords: { type: 'array', items: { type: 'string' } },
            gaps: { type: 'array', items: { type: 'string' } }
          }
        },
        negativeKeywords: { type: 'array', items: { type: 'string' } },
        totalKeywords: { type: 'number' },
        keywordsByIntent: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ppc', 'keyword-research', 'competitive-analysis']
}));

// Task 3: Campaign and Ad Group Structure Design
export const campaignStructureTask = defineTask('campaign-structure', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design campaign and ad group structure',
  agent: {
    name: 'campaign-architect',
    prompt: {
      role: 'PPC campaign architect',
      task: 'Design optimal campaign and ad group structure for the PPC account',
      context: args,
      instructions: [
        'Design account structure following best practices (SKAG, themed ad groups)',
        'Create campaign hierarchy based on objectives and budget',
        'Define ad group structure with tight keyword themes',
        'Map keywords to appropriate ad groups',
        'Set up campaign settings (networks, locations, devices, schedules)',
        'Plan for brand vs non-brand campaign separation',
        'Document naming conventions for easy management',
        'Create structure visualization'
      ],
      outputFormat: 'JSON with campaigns, adGroups, campaignCount, adGroupCount, structure, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['campaigns', 'campaignCount', 'adGroupCount', 'artifacts'],
      properties: {
        campaigns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              objective: { type: 'string' },
              adGroups: { type: 'array', items: { type: 'string' } },
              settings: { type: 'object' }
            }
          }
        },
        campaignCount: { type: 'number' },
        adGroupCount: { type: 'number' },
        namingConvention: { type: 'string' },
        structureRationale: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ppc', 'campaign-structure', 'account-architecture']
}));

// Task 4: Ad Copy Creation
export const adCopyCreationTask = defineTask('ad-copy-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Write ad copy variations',
  agent: {
    name: 'ad-copywriter',
    prompt: {
      role: 'PPC ad copywriter specialist',
      task: 'Create compelling ad copy variations for responsive search ads',
      context: args,
      instructions: [
        'Write multiple headline variations (15 per ad group)',
        'Create compelling description lines (4 per ad group)',
        'Include primary keywords in headlines and descriptions',
        'Highlight unique value propositions and CTAs',
        'Ensure ad copy aligns with landing page messaging',
        'Create ad extensions (sitelinks, callouts, structured snippets)',
        'A/B test messaging angles (benefit-focused, urgency, social proof)',
        'Ensure character limits compliance'
      ],
      outputFormat: 'JSON with adAssets, adVariations, extensions, copyGuidelines, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['adAssets', 'adVariations', 'artifacts'],
      properties: {
        adAssets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              adGroup: { type: 'string' },
              headlines: { type: 'array', items: { type: 'string' } },
              descriptions: { type: 'array', items: { type: 'string' } },
              finalUrl: { type: 'string' }
            }
          }
        },
        adVariations: { type: 'number' },
        extensions: {
          type: 'object',
          properties: {
            sitelinks: { type: 'array', items: { type: 'object' } },
            callouts: { type: 'array', items: { type: 'string' } },
            structuredSnippets: { type: 'array', items: { type: 'object' } }
          }
        },
        copyGuidelines: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ppc', 'ad-copy', 'creative']
}));

// Task 5: Bidding Strategy Configuration
export const biddingStrategyTask = defineTask('bidding-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure bidding strategies and budget allocation',
  agent: {
    name: 'bidding-specialist',
    prompt: {
      role: 'PPC bidding and budget specialist',
      task: 'Configure optimal bidding strategies and allocate budget across campaigns',
      context: args,
      instructions: [
        'Select appropriate bidding strategy based on objectives (Manual CPC, Target CPA, Maximize Conversions, Target ROAS)',
        'Set initial bids based on keyword research and competition',
        'Allocate budget across campaigns based on priorities',
        'Configure bid adjustments (device, location, time, audience)',
        'Set up portfolio bid strategies if applicable',
        'Define budget pacing and spending limits',
        'Create bid management rules and automation',
        'Document bidding strategy rationale'
      ],
      outputFormat: 'JSON with strategy, budgetAllocation, bidAdjustments, automationRules, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'budgetAllocation', 'artifacts'],
      properties: {
        strategy: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            target: { type: 'string' },
            rationale: { type: 'string' }
          }
        },
        budgetAllocation: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              campaign: { type: 'string' },
              dailyBudget: { type: 'number' },
              monthlyBudget: { type: 'number' }
            }
          }
        },
        bidAdjustments: { type: 'object' },
        automationRules: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ppc', 'bidding', 'budget']
}));

// Task 6: Audience Targeting and Remarketing Setup
export const audienceTargetingTask = defineTask('audience-targeting', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up audience targeting and remarketing lists',
  agent: {
    name: 'audience-specialist',
    prompt: {
      role: 'PPC audience targeting specialist',
      task: 'Configure audience targeting and create remarketing lists',
      context: args,
      instructions: [
        'Define in-market audiences relevant to the campaign',
        'Configure affinity audiences for broader targeting',
        'Create custom intent audiences based on keywords',
        'Set up remarketing lists (website visitors, converters, cart abandoners)',
        'Configure Customer Match for existing customer targeting',
        'Create similar audiences based on converters',
        'Set audience bid adjustments',
        'Define exclusion audiences to avoid wasted spend'
      ],
      outputFormat: 'JSON with audiences, remarketingLists, audienceBids, exclusions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['audiences', 'artifacts'],
      properties: {
        audiences: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              name: { type: 'string' },
              targeting: { type: 'string' },
              bidAdjustment: { type: 'number' }
            }
          }
        },
        remarketingLists: { type: 'array', items: { type: 'object' } },
        customIntentAudiences: { type: 'array', items: { type: 'object' } },
        exclusions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ppc', 'audience', 'remarketing']
}));

// Task 7: Conversion Tracking Implementation
export const conversionTrackingTask = defineTask('conversion-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement conversion tracking and goals',
  agent: {
    name: 'tracking-specialist',
    prompt: {
      role: 'conversion tracking specialist',
      task: 'Implement comprehensive conversion tracking for the PPC campaign',
      context: args,
      instructions: [
        'Define conversion actions (purchases, leads, signups, calls)',
        'Set up Google Ads conversion tracking tags',
        'Configure conversion values and attribution settings',
        'Implement enhanced conversions for better accuracy',
        'Set up offline conversion tracking if applicable',
        'Create conversion goals in Google Analytics',
        'Implement cross-device conversion tracking',
        'Document tracking implementation and testing procedures'
      ],
      outputFormat: 'JSON with conversionActions, trackingTags, documentation, testingProcedures, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['conversionActions', 'documentation', 'artifacts'],
      properties: {
        conversionActions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              value: { type: 'number' },
              attribution: { type: 'string' }
            }
          }
        },
        trackingTags: { type: 'array', items: { type: 'object' } },
        documentation: {
          type: 'object',
          properties: {
            implementation: { type: 'string' },
            testing: { type: 'string' },
            maintenance: { type: 'string' }
          }
        },
        testingProcedures: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ppc', 'conversion-tracking', 'analytics']
}));

// Task 8: Campaign QA and Launch Checklist
export const campaignQATask = defineTask('campaign-qa', (args, taskCtx) => ({
  kind: 'agent',
  title: 'QA campaign settings and prepare launch checklist',
  agent: {
    name: 'qa-specialist',
    prompt: {
      role: 'PPC QA specialist',
      task: 'Perform comprehensive QA on campaign settings and create launch checklist',
      context: args,
      instructions: [
        'Verify campaign structure and naming conventions',
        'Check keyword match types and negative keywords',
        'Review ad copy for errors and policy compliance',
        'Validate landing page URLs and functionality',
        'Verify tracking implementation and test conversions',
        'Check bidding settings and budget allocation',
        'Review audience targeting configurations',
        'Create comprehensive launch checklist',
        'Document any issues requiring resolution'
      ],
      outputFormat: 'JSON with checklist, passedChecks, totalChecks, qaScore, issues, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['checklist', 'passedChecks', 'totalChecks', 'qaScore', 'artifacts'],
      properties: {
        checklist: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              item: { type: 'string' },
              status: { type: 'string', enum: ['passed', 'failed', 'warning'] },
              notes: { type: 'string' }
            }
          }
        },
        passedChecks: { type: 'number' },
        totalChecks: { type: 'number' },
        qaScore: { type: 'number' },
        issues: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ppc', 'qa', 'launch-checklist']
}));

// Task 9: Launch and Initial Monitoring Plan
export const launchMonitoringTask = defineTask('launch-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create launch and monitoring plan',
  agent: {
    name: 'campaign-manager',
    prompt: {
      role: 'PPC campaign manager',
      task: 'Create launch plan and initial monitoring schedule for the campaign',
      context: args,
      instructions: [
        'Define launch sequence and timeline',
        'Create day 1-7 monitoring checklist',
        'Set up automated alerts for key metrics',
        'Define optimization triggers and thresholds',
        'Create reporting schedule and templates',
        'Plan first optimization review milestones',
        'Document escalation procedures',
        'Create campaign management playbook'
      ],
      outputFormat: 'JSON with launchPlan, monitoringSchedule, alerts, optimizationTriggers, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['launchPlan', 'monitoringSchedule', 'artifacts'],
      properties: {
        launchPlan: {
          type: 'object',
          properties: {
            launchDate: { type: 'string' },
            sequence: { type: 'array', items: { type: 'string' } },
            stakeholders: { type: 'array', items: { type: 'string' } }
          }
        },
        monitoringSchedule: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              day: { type: 'string' },
              tasks: { type: 'array', items: { type: 'string' } },
              metrics: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        alerts: { type: 'array', items: { type: 'object' } },
        optimizationTriggers: { type: 'array', items: { type: 'object' } },
        reportingSchedule: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ppc', 'launch', 'monitoring']
}));
