/**
 * @process digital-marketing/meta-ads-campaign
 * @description Process for creating, managing, and optimizing advertising campaigns on Meta platforms (Facebook, Instagram, Audience Network), including audience building, creative development, Advantage+ configuration, and Conversions API setup
 * @inputs { campaignBrief: object, audienceData: object, creativeAssets: array, pixelConfig: object, outputDir: string }
 * @outputs { success: boolean, campaigns: array, audienceSegments: array, creativeLibrary: array, performanceBaseline: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    campaignBrief = {},
    audienceData = {},
    creativeAssets = [],
    pixelConfig = {},
    outputDir = 'meta-ads-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Meta Ads Campaign Management process');

  // Task 1: Define Campaign Objectives
  ctx.log('info', 'Phase 1: Defining campaign objectives and strategy');
  const objectivesResult = await ctx.task(metaCampaignObjectivesTask, {
    campaignBrief,
    outputDir
  });
  artifacts.push(...objectivesResult.artifacts);

  // Task 2: Build Custom and Lookalike Audiences
  ctx.log('info', 'Phase 2: Building Custom and Lookalike audiences');
  const audienceBuilding = await ctx.task(audienceBuildingTask, {
    audienceData,
    campaignBrief,
    objectives: objectivesResult,
    outputDir
  });
  artifacts.push(...audienceBuilding.artifacts);

  // Task 3: Develop Creative Assets
  ctx.log('info', 'Phase 3: Developing creative assets');
  const creativeDevResult = await ctx.task(creativeDevlopmentTask, {
    campaignBrief,
    creativeAssets,
    audiences: audienceBuilding,
    outputDir
  });
  artifacts.push(...creativeDevResult.artifacts);

  // Task 4: Configure Campaign Structure and Placements
  ctx.log('info', 'Phase 4: Configuring campaign structure and placements');
  const campaignConfig = await ctx.task(campaignConfigurationTask, {
    campaignBrief,
    objectives: objectivesResult,
    audiences: audienceBuilding,
    creatives: creativeDevResult,
    outputDir
  });
  artifacts.push(...campaignConfig.artifacts);

  // Task 5: Set Up Conversions API
  ctx.log('info', 'Phase 5: Setting up Conversions API for server-side tracking');
  const capiSetup = await ctx.task(conversionsApiSetupTask, {
    pixelConfig,
    campaignBrief,
    outputDir
  });
  artifacts.push(...capiSetup.artifacts);

  // Task 6: Implement A/B Testing
  ctx.log('info', 'Phase 6: Implementing A/B testing for creative and audiences');
  const abTestSetup = await ctx.task(abTestingSetupTask, {
    campaignConfig,
    creatives: creativeDevResult,
    audiences: audienceBuilding,
    outputDir
  });
  artifacts.push(...abTestSetup.artifacts);

  // Task 7: Create Monitoring and Optimization Plan
  ctx.log('info', 'Phase 7: Creating monitoring and optimization plan');
  const optimizationPlan = await ctx.task(monitoringOptimizationTask, {
    campaignConfig,
    objectives: objectivesResult,
    abTestSetup,
    outputDir
  });
  artifacts.push(...optimizationPlan.artifacts);

  // Breakpoint: Review campaign setup
  await ctx.breakpoint({
    question: `Meta Ads campaign setup complete. ${campaignConfig.campaignCount} campaigns configured with ${audienceBuilding.totalAudiences} audience segments. Ready to launch?`,
    title: 'Meta Ads Campaign Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        campaignCount: campaignConfig.campaignCount,
        adSetCount: campaignConfig.adSetCount,
        audienceCount: audienceBuilding.totalAudiences,
        creativeCount: creativeDevResult.totalCreatives,
        capiConfigured: capiSetup.configured
      }
    }
  });

  // Task 8: Generate Performance Analysis Framework
  ctx.log('info', 'Phase 8: Generating performance analysis framework');
  const analysisFramework = await ctx.task(performanceAnalysisTask, {
    campaignConfig,
    objectives: objectivesResult,
    optimizationPlan,
    outputDir
  });
  artifacts.push(...analysisFramework.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    campaigns: campaignConfig.campaigns,
    audienceSegments: audienceBuilding.audiences,
    creativeLibrary: creativeDevResult.creativeLibrary,
    performanceBaseline: analysisFramework.baseline,
    capiConfiguration: capiSetup.configuration,
    abTests: abTestSetup.tests,
    optimizationPlan: optimizationPlan.plan,
    artifacts,
    duration,
    metadata: {
      processId: 'digital-marketing/meta-ads-campaign',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: Meta Campaign Objectives
export const metaCampaignObjectivesTask = defineTask('meta-campaign-objectives', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define Meta campaign objectives and strategy',
  agent: {
    name: 'meta-strategist',
    prompt: {
      role: 'Meta advertising strategist',
      task: 'Define campaign objectives aligned with Meta Ads campaign objectives framework',
      context: args,
      instructions: [
        'Analyze business objectives and map to Meta campaign objectives',
        'Select appropriate campaign objective (Awareness, Traffic, Engagement, Leads, App Promotion, Sales)',
        'Define optimization goals and conversion events',
        'Set performance targets and benchmarks',
        'Plan campaign budget and pacing strategy',
        'Document funnel strategy and audience journey',
        'Create measurement framework aligned with objectives'
      ],
      outputFormat: 'JSON with objectives, optimizationGoal, targets, budgetStrategy, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['objectives', 'optimizationGoal', 'artifacts'],
      properties: {
        objectives: {
          type: 'object',
          properties: {
            campaignObjective: { type: 'string' },
            businessGoal: { type: 'string' },
            funnelStage: { type: 'string' }
          }
        },
        optimizationGoal: { type: 'string' },
        conversionEvent: { type: 'string' },
        targets: { type: 'object' },
        budgetStrategy: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'meta-ads', 'objectives', 'strategy']
}));

// Task 2: Audience Building
export const audienceBuildingTask = defineTask('audience-building', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Build Custom and Lookalike audiences',
  agent: {
    name: 'audience-builder',
    prompt: {
      role: 'Meta audience targeting specialist',
      task: 'Build Custom Audiences and Lookalike Audiences for targeting',
      context: args,
      instructions: [
        'Create Custom Audiences from customer data (email, phone)',
        'Build website Custom Audiences from pixel data',
        'Create engagement Custom Audiences (video viewers, page engagers)',
        'Build Lookalike Audiences from best-performing Custom Audiences',
        'Define Lookalike percentages (1%, 2%, 5%, 10%)',
        'Create interest-based audiences as backup',
        'Define exclusion audiences to avoid audience overlap',
        'Document audience refresh and maintenance schedule'
      ],
      outputFormat: 'JSON with audiences, customAudiences, lookalikeAudiences, totalAudiences, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['audiences', 'totalAudiences', 'artifacts'],
      properties: {
        audiences: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              source: { type: 'string' },
              estimatedSize: { type: 'number' }
            }
          }
        },
        customAudiences: { type: 'array', items: { type: 'object' } },
        lookalikeAudiences: { type: 'array', items: { type: 'object' } },
        exclusionAudiences: { type: 'array', items: { type: 'string' } },
        totalAudiences: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'meta-ads', 'audiences', 'targeting']
}));

// Task 3: Creative Development
export const creativeDevlopmentTask = defineTask('creative-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop creative assets',
  agent: {
    name: 'creative-developer',
    prompt: {
      role: 'Meta creative specialist',
      task: 'Develop and organize creative assets for Meta advertising',
      context: args,
      instructions: [
        'Audit existing creative assets for Meta compatibility',
        'Define creative specifications for each placement',
        'Create image ad variations (1:1, 4:5, 9:16 ratios)',
        'Develop video ad concepts and scripts',
        'Create carousel ad sequences',
        'Write compelling ad copy and CTAs',
        'Organize creative library with naming conventions',
        'Define creative testing hypotheses'
      ],
      outputFormat: 'JSON with creativeLibrary, specifications, copyVariations, totalCreatives, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['creativeLibrary', 'totalCreatives', 'artifacts'],
      properties: {
        creativeLibrary: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              format: { type: 'string' },
              placements: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        specifications: { type: 'object' },
        copyVariations: { type: 'array', items: { type: 'object' } },
        totalCreatives: { type: 'number' },
        testingHypotheses: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'meta-ads', 'creative', 'assets']
}));

// Task 4: Campaign Configuration
export const campaignConfigurationTask = defineTask('campaign-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure campaign structure and placements',
  agent: {
    name: 'campaign-configurator',
    prompt: {
      role: 'Meta campaign configuration specialist',
      task: 'Configure campaign structure, ad sets, and placement strategies',
      context: args,
      instructions: [
        'Design campaign structure (CBO vs ABO approach)',
        'Configure ad set targeting and budget',
        'Select optimal placements (automatic vs manual)',
        'Set up Advantage+ campaign options',
        'Configure delivery optimization settings',
        'Set schedule and dayparting if applicable',
        'Define ad set naming conventions',
        'Document campaign configuration details'
      ],
      outputFormat: 'JSON with campaigns, adSets, placements, campaignCount, adSetCount, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['campaigns', 'campaignCount', 'adSetCount', 'artifacts'],
      properties: {
        campaigns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              objective: { type: 'string' },
              budgetOptimization: { type: 'string' },
              budget: { type: 'number' }
            }
          }
        },
        adSets: { type: 'array', items: { type: 'object' } },
        placements: { type: 'object' },
        campaignCount: { type: 'number' },
        adSetCount: { type: 'number' },
        advantagePlusSettings: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'meta-ads', 'configuration', 'structure']
}));

// Task 5: Conversions API Setup
export const conversionsApiSetupTask = defineTask('conversions-api-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up Conversions API for server-side tracking',
  agent: {
    name: 'capi-specialist',
    prompt: {
      role: 'Meta Conversions API specialist',
      task: 'Implement Conversions API for server-side event tracking',
      context: args,
      instructions: [
        'Audit current Meta Pixel implementation',
        'Define events to track via Conversions API',
        'Document CAPI implementation requirements',
        'Configure event deduplication strategy',
        'Set up event match quality optimization',
        'Define customer information parameters to pass',
        'Create testing and validation procedures',
        'Document integration with e-commerce platforms if applicable'
      ],
      outputFormat: 'JSON with configuration, events, implementation, configured, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['configuration', 'configured', 'artifacts'],
      properties: {
        configuration: {
          type: 'object',
          properties: {
            pixelId: { type: 'string' },
            accessToken: { type: 'string' },
            events: { type: 'array', items: { type: 'string' } }
          }
        },
        events: { type: 'array', items: { type: 'object' } },
        implementation: { type: 'object' },
        deduplication: { type: 'object' },
        configured: { type: 'boolean' },
        testingProcedures: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'meta-ads', 'capi', 'tracking']
}));

// Task 6: A/B Testing Setup
export const abTestingSetupTask = defineTask('ab-testing-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement A/B testing for creative and audiences',
  agent: {
    name: 'ab-testing-specialist',
    prompt: {
      role: 'Meta A/B testing specialist',
      task: 'Design and implement A/B tests for creative and audience optimization',
      context: args,
      instructions: [
        'Define testing hypotheses for creative elements',
        'Design audience split tests',
        'Configure Meta A/B test framework',
        'Set statistical significance thresholds',
        'Define test duration and sample sizes',
        'Create test monitoring schedule',
        'Document winner selection criteria',
        'Plan iteration strategy based on results'
      ],
      outputFormat: 'JSON with tests, hypotheses, configuration, monitoringSchedule, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['tests', 'artifacts'],
      properties: {
        tests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              hypothesis: { type: 'string' },
              variables: { type: 'array', items: { type: 'string' } },
              duration: { type: 'string' }
            }
          }
        },
        hypotheses: { type: 'array', items: { type: 'string' } },
        configuration: { type: 'object' },
        monitoringSchedule: { type: 'object' },
        winnerCriteria: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'meta-ads', 'ab-testing', 'optimization']
}));

// Task 7: Monitoring and Optimization Plan
export const monitoringOptimizationTask = defineTask('monitoring-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create monitoring and optimization plan',
  agent: {
    name: 'optimization-planner',
    prompt: {
      role: 'Meta campaign optimization specialist',
      task: 'Create comprehensive monitoring and optimization plan',
      context: args,
      instructions: [
        'Define key metrics to monitor daily/weekly',
        'Set performance thresholds and alerts',
        'Create optimization decision tree',
        'Define budget reallocation triggers',
        'Plan creative refresh schedule',
        'Document audience fatigue indicators',
        'Create scaling criteria and procedures',
        'Develop troubleshooting playbook'
      ],
      outputFormat: 'JSON with plan, metrics, thresholds, optimizationRules, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'artifacts'],
      properties: {
        plan: {
          type: 'object',
          properties: {
            dailyChecks: { type: 'array', items: { type: 'string' } },
            weeklyOptimizations: { type: 'array', items: { type: 'string' } },
            monthlyReviews: { type: 'array', items: { type: 'string' } }
          }
        },
        metrics: { type: 'array', items: { type: 'object' } },
        thresholds: { type: 'object' },
        optimizationRules: { type: 'array', items: { type: 'object' } },
        scalingCriteria: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'meta-ads', 'monitoring', 'optimization']
}));

// Task 8: Performance Analysis Framework
export const performanceAnalysisTask = defineTask('performance-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate performance analysis framework',
  agent: {
    name: 'performance-analyst',
    prompt: {
      role: 'Meta performance analyst',
      task: 'Create performance analysis framework and reporting structure',
      context: args,
      instructions: [
        'Define performance baseline metrics',
        'Create reporting dashboard structure',
        'Set up automated reporting schedule',
        'Define ROI calculation methodology',
        'Create attribution analysis framework',
        'Document benchmarking approach',
        'Design executive summary template',
        'Plan insights and recommendations format'
      ],
      outputFormat: 'JSON with baseline, reportingStructure, dashboards, roiMethodology, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['baseline', 'artifacts'],
      properties: {
        baseline: {
          type: 'object',
          properties: {
            metrics: { type: 'object' },
            benchmarks: { type: 'object' },
            targets: { type: 'object' }
          }
        },
        reportingStructure: { type: 'object' },
        dashboards: { type: 'array', items: { type: 'object' } },
        roiMethodology: { type: 'object' },
        attributionFramework: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'meta-ads', 'performance', 'analytics']
}));
