/**
 * @process digital-marketing/competitive-intelligence
 * @description Process for monitoring competitor marketing activities and analyzing market trends to inform strategic decisions and identify opportunities
 * @inputs { competitorList: array, monitoringToolsAccess: object, industryContext: object, outputDir: string }
 * @outputs { success: boolean, competitiveIntelligenceReports: array, trendAnalysis: object, opportunityRecommendations: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    competitorList = [],
    monitoringToolsAccess = {},
    industryContext = {},
    outputDir = 'competitive-intel-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Competitive Intelligence and Market Analysis process');

  // Task 1: Define Competitive Set
  ctx.log('info', 'Phase 1: Defining competitive set and monitoring scope');
  const competitiveSet = await ctx.task(competitiveSetDefinitionTask, {
    competitorList,
    industryContext,
    outputDir
  });
  artifacts.push(...competitiveSet.artifacts);

  // Task 2: Set Up Competitive Tracking
  ctx.log('info', 'Phase 2: Setting up competitive tracking tools');
  const trackingSetup = await ctx.task(competitiveTrackingSetupTask, {
    competitiveSet,
    monitoringToolsAccess,
    outputDir
  });
  artifacts.push(...trackingSetup.artifacts);

  // Task 3: Monitor Competitor Advertising
  ctx.log('info', 'Phase 3: Monitoring competitor paid advertising');
  const adMonitoring = await ctx.task(competitorAdMonitoringTask, {
    competitiveSet,
    trackingSetup,
    outputDir
  });
  artifacts.push(...adMonitoring.artifacts);

  // Task 4: Track Competitor Content and SEO
  ctx.log('info', 'Phase 4: Tracking competitor content and SEO');
  const contentSeoTracking = await ctx.task(competitorContentSeoTask, {
    competitiveSet,
    trackingSetup,
    outputDir
  });
  artifacts.push(...contentSeoTracking.artifacts);

  // Task 5: Analyze Competitor Social Media
  ctx.log('info', 'Phase 5: Analyzing competitor social media');
  const socialAnalysis = await ctx.task(competitorSocialAnalysisTask, {
    competitiveSet,
    trackingSetup,
    outputDir
  });
  artifacts.push(...socialAnalysis.artifacts);

  // Task 6: Monitor Industry Trends
  ctx.log('info', 'Phase 6: Monitoring industry trends and news');
  const trendMonitoring = await ctx.task(industryTrendMonitoringTask, {
    industryContext,
    trackingSetup,
    outputDir
  });
  artifacts.push(...trendMonitoring.artifacts);

  // Task 7: Compile Intelligence Reports
  ctx.log('info', 'Phase 7: Compiling competitive intelligence reports');
  const intelligenceReports = await ctx.task(intelligenceReportCompilationTask, {
    adMonitoring,
    contentSeoTracking,
    socialAnalysis,
    trendMonitoring,
    outputDir
  });
  artifacts.push(...intelligenceReports.artifacts);

  // Breakpoint: Review intelligence
  await ctx.breakpoint({
    question: `Competitive intelligence gathering complete. ${competitiveSet.competitorCount} competitors tracked. ${trendMonitoring.trendCount} industry trends identified. Review findings?`,
    title: 'Competitive Intelligence Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        competitorsTracked: competitiveSet.competitorCount,
        trendsIdentified: trendMonitoring.trendCount,
        opportunitiesFound: intelligenceReports.opportunityCount
      }
    }
  });

  // Task 8: Identify Gaps and Opportunities
  ctx.log('info', 'Phase 8: Identifying competitive gaps and opportunities');
  const gapOpportunityAnalysis = await ctx.task(gapOpportunityTask, {
    intelligenceReports,
    competitiveSet,
    outputDir
  });
  artifacts.push(...gapOpportunityAnalysis.artifacts);

  // Task 9: Share Insights
  ctx.log('info', 'Phase 9: Creating insight sharing framework');
  const insightSharing = await ctx.task(insightSharingTask, {
    intelligenceReports,
    gapOpportunityAnalysis,
    outputDir
  });
  artifacts.push(...insightSharing.artifacts);

  // Task 10: Update Analysis Regularly
  ctx.log('info', 'Phase 10: Creating regular update framework');
  const updateFramework = await ctx.task(regularUpdateTask, {
    trackingSetup,
    intelligenceReports,
    outputDir
  });
  artifacts.push(...updateFramework.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    competitiveIntelligenceReports: intelligenceReports.reports,
    trendAnalysis: trendMonitoring.analysis,
    opportunityRecommendations: gapOpportunityAnalysis.recommendations,
    competitorProfiles: competitiveSet.profiles,
    adIntelligence: adMonitoring.intelligence,
    contentAnalysis: contentSeoTracking.analysis,
    socialIntelligence: socialAnalysis.intelligence,
    insightFramework: insightSharing.framework,
    updateSchedule: updateFramework.schedule,
    artifacts,
    duration,
    metadata: {
      processId: 'digital-marketing/competitive-intelligence',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task definitions
export const competitiveSetDefinitionTask = defineTask('competitive-set-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define competitive set and monitoring scope',
  agent: {
    name: 'competitive-analyst',
    prompt: {
      role: 'competitive intelligence analyst',
      task: 'Define competitive set and scope of monitoring',
      context: args,
      instructions: [
        'Identify direct competitors',
        'Identify indirect competitors',
        'Define monitoring priorities',
        'Create competitor profiles',
        'Define comparison criteria',
        'Set monitoring scope per competitor',
        'Identify emerging competitors',
        'Document competitive landscape'
      ],
      outputFormat: 'JSON with competitors, competitorCount, profiles, priorities, landscape, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['competitors', 'competitorCount', 'profiles', 'artifacts'],
      properties: {
        competitors: { type: 'array', items: { type: 'object' } },
        competitorCount: { type: 'number' },
        profiles: { type: 'array', items: { type: 'object' } },
        priorities: { type: 'object' },
        landscape: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'competitive-intelligence', 'competitive-set']
}));

export const competitiveTrackingSetupTask = defineTask('competitive-tracking-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up competitive tracking tools',
  agent: {
    name: 'tracking-specialist',
    prompt: {
      role: 'competitive tracking specialist',
      task: 'Set up tools for competitive tracking',
      context: args,
      instructions: [
        'Configure SEO tracking tools',
        'Set up ad tracking tools',
        'Configure social monitoring',
        'Set up news alerts',
        'Configure website change tracking',
        'Set up review monitoring',
        'Document tracking configuration',
        'Create tracking dashboard'
      ],
      outputFormat: 'JSON with setup, tools, configuration, dashboards, documentation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['setup', 'artifacts'],
      properties: {
        setup: { type: 'object' },
        tools: { type: 'array', items: { type: 'object' } },
        configuration: { type: 'object' },
        dashboards: { type: 'array', items: { type: 'object' } },
        documentation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'competitive-intelligence', 'tracking-setup']
}));

export const competitorAdMonitoringTask = defineTask('competitor-ad-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Monitor competitor paid advertising',
  agent: {
    name: 'ad-intelligence-analyst',
    prompt: {
      role: 'advertising intelligence analyst',
      task: 'Monitor and analyze competitor paid advertising',
      context: args,
      instructions: [
        'Track competitor PPC campaigns',
        'Monitor display advertising',
        'Track social advertising',
        'Analyze ad creative',
        'Track ad spend estimates',
        'Monitor landing pages',
        'Analyze messaging themes',
        'Document advertising intelligence'
      ],
      outputFormat: 'JSON with intelligence, campaigns, creative, spendEstimates, themes, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['intelligence', 'artifacts'],
      properties: {
        intelligence: { type: 'object' },
        campaigns: { type: 'array', items: { type: 'object' } },
        creative: { type: 'array', items: { type: 'object' } },
        spendEstimates: { type: 'object' },
        themes: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'competitive-intelligence', 'advertising']
}));

export const competitorContentSeoTask = defineTask('competitor-content-seo', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Track competitor content and SEO',
  agent: {
    name: 'content-seo-analyst',
    prompt: {
      role: 'content and SEO analyst',
      task: 'Track and analyze competitor content and SEO strategies',
      context: args,
      instructions: [
        'Track competitor keyword rankings',
        'Monitor content publishing',
        'Analyze content strategy',
        'Track backlink acquisition',
        'Monitor technical SEO changes',
        'Analyze site structure changes',
        'Track content performance',
        'Document content intelligence'
      ],
      outputFormat: 'JSON with analysis, rankings, contentStrategy, backlinks, technicalChanges, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'artifacts'],
      properties: {
        analysis: { type: 'object' },
        rankings: { type: 'object' },
        contentStrategy: { type: 'object' },
        backlinks: { type: 'object' },
        technicalChanges: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'competitive-intelligence', 'content', 'seo']
}));

export const competitorSocialAnalysisTask = defineTask('competitor-social-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze competitor social media',
  agent: {
    name: 'social-intelligence-analyst',
    prompt: {
      role: 'social media intelligence analyst',
      task: 'Analyze competitor social media presence and strategy',
      context: args,
      instructions: [
        'Track follower growth',
        'Analyze posting frequency',
        'Monitor engagement rates',
        'Track content themes',
        'Analyze campaign activity',
        'Monitor influencer partnerships',
        'Track share of voice',
        'Document social intelligence'
      ],
      outputFormat: 'JSON with intelligence, followerData, engagement, themes, campaigns, shareOfVoice, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['intelligence', 'artifacts'],
      properties: {
        intelligence: { type: 'object' },
        followerData: { type: 'object' },
        engagement: { type: 'object' },
        themes: { type: 'array', items: { type: 'string' } },
        campaigns: { type: 'array', items: { type: 'object' } },
        shareOfVoice: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'competitive-intelligence', 'social-media']
}));

export const industryTrendMonitoringTask = defineTask('industry-trend-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Monitor industry trends and news',
  agent: {
    name: 'trend-analyst',
    prompt: {
      role: 'industry trend analyst',
      task: 'Monitor and analyze industry trends and news',
      context: args,
      instructions: [
        'Track industry news',
        'Monitor emerging trends',
        'Analyze market changes',
        'Track technology shifts',
        'Monitor regulatory changes',
        'Track consumer behavior trends',
        'Identify early signals',
        'Document trend analysis'
      ],
      outputFormat: 'JSON with analysis, trends, trendCount, news, signals, documentation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'trendCount', 'artifacts'],
      properties: {
        analysis: { type: 'object' },
        trends: { type: 'array', items: { type: 'object' } },
        trendCount: { type: 'number' },
        news: { type: 'array', items: { type: 'object' } },
        signals: { type: 'array', items: { type: 'object' } },
        documentation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'competitive-intelligence', 'trends', 'industry']
}));

export const intelligenceReportCompilationTask = defineTask('intelligence-report-compilation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compile competitive intelligence reports',
  agent: {
    name: 'intelligence-compiler',
    prompt: {
      role: 'competitive intelligence report writer',
      task: 'Compile comprehensive competitive intelligence reports',
      context: args,
      instructions: [
        'Create executive summary',
        'Compile advertising intelligence',
        'Summarize content/SEO findings',
        'Present social media analysis',
        'Include trend insights',
        'Identify key opportunities',
        'Create actionable recommendations',
        'Format professional reports'
      ],
      outputFormat: 'JSON with reports, executiveSummary, opportunities, opportunityCount, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reports', 'opportunityCount', 'artifacts'],
      properties: {
        reports: { type: 'array', items: { type: 'object' } },
        executiveSummary: { type: 'string' },
        opportunities: { type: 'array', items: { type: 'object' } },
        opportunityCount: { type: 'number' },
        recommendations: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'competitive-intelligence', 'reports']
}));

export const gapOpportunityTask = defineTask('gap-opportunity', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify competitive gaps and opportunities',
  agent: {
    name: 'opportunity-analyst',
    prompt: {
      role: 'competitive opportunity analyst',
      task: 'Identify gaps and opportunities from competitive analysis',
      context: args,
      instructions: [
        'Analyze competitive gaps',
        'Identify underserved areas',
        'Find messaging opportunities',
        'Identify channel opportunities',
        'Assess first-mover opportunities',
        'Prioritize opportunities',
        'Create recommendations',
        'Document opportunity analysis'
      ],
      outputFormat: 'JSON with gaps, opportunities, recommendations, prioritization, documentation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['gaps', 'recommendations', 'artifacts'],
      properties: {
        gaps: { type: 'array', items: { type: 'object' } },
        opportunities: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'object' } },
        prioritization: { type: 'array', items: { type: 'object' } },
        documentation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'competitive-intelligence', 'gaps', 'opportunities']
}));

export const insightSharingTask = defineTask('insight-sharing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create insight sharing framework',
  agent: {
    name: 'insight-curator',
    prompt: {
      role: 'competitive insight curator',
      task: 'Create framework for sharing competitive insights',
      context: args,
      instructions: [
        'Define stakeholder needs',
        'Create insight formats',
        'Plan distribution channels',
        'Create alert mechanisms',
        'Design insight dashboards',
        'Plan regular briefings',
        'Create self-service access',
        'Document sharing procedures'
      ],
      outputFormat: 'JSON with framework, formats, distribution, alerts, dashboards, procedures, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['framework', 'artifacts'],
      properties: {
        framework: { type: 'object' },
        formats: { type: 'array', items: { type: 'object' } },
        distribution: { type: 'object' },
        alerts: { type: 'array', items: { type: 'object' } },
        dashboards: { type: 'array', items: { type: 'object' } },
        procedures: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'competitive-intelligence', 'insights', 'sharing']
}));

export const regularUpdateTask = defineTask('regular-update', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create regular update framework',
  agent: {
    name: 'update-planner',
    prompt: {
      role: 'competitive intelligence program manager',
      task: 'Create framework for regular intelligence updates',
      context: args,
      instructions: [
        'Define update frequency',
        'Create update schedule',
        'Plan deep-dive analyses',
        'Set up automated monitoring',
        'Define refresh triggers',
        'Plan quarterly reviews',
        'Create maintenance procedures',
        'Document update framework'
      ],
      outputFormat: 'JSON with schedule, frequency, automations, triggers, reviewPlan, procedures, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['schedule', 'artifacts'],
      properties: {
        schedule: { type: 'object' },
        frequency: { type: 'object' },
        automations: { type: 'array', items: { type: 'object' } },
        triggers: { type: 'array', items: { type: 'object' } },
        reviewPlan: { type: 'object' },
        procedures: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'competitive-intelligence', 'updates', 'maintenance']
}));
