/**
 * @process digital-marketing/social-content-calendar
 * @description Ongoing process for planning, creating, scheduling, and managing social media content across platforms, ensuring consistent brand presence and engagement
 * @inputs { contentStrategy: object, brandAssets: object, campaignCalendar: object, trendingTopics: array, outputDir: string }
 * @outputs { success: boolean, scheduledContent: array, publishedPosts: array, engagementReports: array, contentPerformanceAnalysis: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    contentStrategy = {},
    brandAssets = {},
    campaignCalendar = {},
    trendingTopics = [],
    outputDir = 'social-content-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Social Content Calendar Management process');

  // Task 1: Plan Monthly/Weekly Content Themes
  ctx.log('info', 'Phase 1: Planning monthly/weekly content themes');
  const themePlanning = await ctx.task(contentThemePlanningTask, {
    contentStrategy,
    campaignCalendar,
    outputDir
  });
  artifacts.push(...themePlanning.artifacts);

  // Task 2: Ideate Content Aligned with Pillars
  ctx.log('info', 'Phase 2: Ideating content aligned with pillars and campaigns');
  const contentIdeation = await ctx.task(contentIdeationTask, {
    themePlanning,
    contentStrategy,
    trendingTopics,
    outputDir
  });
  artifacts.push(...contentIdeation.artifacts);

  // Task 3: Create Content (Copy, Images, Videos)
  ctx.log('info', 'Phase 3: Creating content assets');
  const contentCreation = await ctx.task(contentCreationTask, {
    contentIdeation,
    brandAssets,
    outputDir
  });
  artifacts.push(...contentCreation.artifacts);

  // Task 4: Review and Approve Content
  ctx.log('info', 'Phase 4: Content review and approval');
  const contentReview = await ctx.task(contentReviewTask, {
    contentCreation,
    brandAssets,
    outputDir
  });
  artifacts.push(...contentReview.artifacts);

  // Breakpoint: Approve content for scheduling
  await ctx.breakpoint({
    question: `${contentReview.approvedCount}/${contentReview.totalContent} content pieces approved. ${contentReview.pendingCount} pending review. Proceed to scheduling?`,
    title: 'Content Approval Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        approvedContent: contentReview.approvedCount,
        pendingContent: contentReview.pendingCount,
        rejectedContent: contentReview.rejectedCount
      }
    }
  });

  // Task 5: Schedule Posts Across Platforms
  ctx.log('info', 'Phase 5: Scheduling posts across platforms');
  const scheduling = await ctx.task(contentSchedulingTask, {
    contentReview,
    contentStrategy,
    outputDir
  });
  artifacts.push(...scheduling.artifacts);

  // Task 6: Monitor Publishing and Engagement
  ctx.log('info', 'Phase 6: Setting up publishing monitoring');
  const publishingMonitor = await ctx.task(publishingMonitoringTask, {
    scheduling,
    outputDir
  });
  artifacts.push(...publishingMonitor.artifacts);

  // Task 7: Response and Engagement Management
  ctx.log('info', 'Phase 7: Setting up response and engagement management');
  const engagementMgmt = await ctx.task(engagementManagementTask, {
    scheduling,
    contentStrategy,
    outputDir
  });
  artifacts.push(...engagementMgmt.artifacts);

  // Task 8: Track Real-time Opportunities
  ctx.log('info', 'Phase 8: Setting up real-time opportunity tracking');
  const realtimeTracking = await ctx.task(realtimeOpportunityTask, {
    trendingTopics,
    contentStrategy,
    outputDir
  });
  artifacts.push(...realtimeTracking.artifacts);

  // Task 9: Analyze Content Performance
  ctx.log('info', 'Phase 9: Creating content performance analysis');
  const performanceAnalysis = await ctx.task(performanceAnalysisTask, {
    scheduling,
    contentStrategy,
    outputDir
  });
  artifacts.push(...performanceAnalysis.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    scheduledContent: scheduling.scheduledPosts,
    contentCalendar: scheduling.calendar,
    engagementProtocols: engagementMgmt.protocols,
    monitoringSetup: publishingMonitor.setup,
    realtimeAlerts: realtimeTracking.alerts,
    contentPerformanceAnalysis: performanceAnalysis.analysis,
    artifacts,
    duration,
    metadata: {
      processId: 'digital-marketing/social-content-calendar',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task definitions
export const contentThemePlanningTask = defineTask('content-theme-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan monthly/weekly content themes',
  agent: {
    name: 'content-planner',
    prompt: {
      role: 'social media content planner',
      task: 'Plan monthly and weekly content themes aligned with strategy',
      context: args,
      instructions: [
        'Review content strategy and pillars',
        'Align themes with campaign calendar',
        'Incorporate seasonal and holiday content',
        'Plan content mix by theme',
        'Define weekly focus areas',
        'Identify key dates and events',
        'Balance promotional and value content',
        'Create theme documentation'
      ],
      outputFormat: 'JSON with themes, monthlyPlan, weeklyPlan, keyDates, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['themes', 'artifacts'],
      properties: {
        themes: { type: 'array', items: { type: 'object' } },
        monthlyPlan: { type: 'object' },
        weeklyPlan: { type: 'object' },
        keyDates: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'social-media', 'content-planning', 'themes']
}));

export const contentIdeationTask = defineTask('content-ideation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Ideate content aligned with pillars and campaigns',
  agent: {
    name: 'content-ideator',
    prompt: {
      role: 'social media content creator',
      task: 'Generate content ideas aligned with pillars, themes, and trends',
      context: args,
      instructions: [
        'Generate content ideas for each pillar',
        'Incorporate trending topics where relevant',
        'Create content for each platform',
        'Develop series and recurring content ideas',
        'Plan interactive content (polls, questions)',
        'Include user-generated content opportunities',
        'Document content formats per idea',
        'Prioritize ideas by impact and effort'
      ],
      outputFormat: 'JSON with contentIdeas, ideaCount, byPillar, byPlatform, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['contentIdeas', 'ideaCount', 'artifacts'],
      properties: {
        contentIdeas: { type: 'array', items: { type: 'object' } },
        ideaCount: { type: 'number' },
        byPillar: { type: 'object' },
        byPlatform: { type: 'object' },
        trendingContent: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'social-media', 'content-ideation']
}));

export const contentCreationTask = defineTask('content-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create content assets',
  agent: {
    name: 'content-creator',
    prompt: {
      role: 'social media content creator',
      task: 'Create content copy, image specs, and video concepts',
      context: args,
      instructions: [
        'Write copy for each content piece',
        'Adapt copy for each platform',
        'Create image specifications and briefs',
        'Develop video scripts and storyboards',
        'Include hashtag strategy',
        'Add call-to-action for each post',
        'Ensure brand voice consistency',
        'Document all content assets'
      ],
      outputFormat: 'JSON with contentAssets, copyVariations, imageSpecs, videoSpecs, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['contentAssets', 'artifacts'],
      properties: {
        contentAssets: { type: 'array', items: { type: 'object' } },
        copyVariations: { type: 'array', items: { type: 'object' } },
        imageSpecs: { type: 'array', items: { type: 'object' } },
        videoSpecs: { type: 'array', items: { type: 'object' } },
        hashtagStrategy: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'social-media', 'content-creation']
}));

export const contentReviewTask = defineTask('content-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review and approve content',
  agent: {
    name: 'content-reviewer',
    prompt: {
      role: 'social media content reviewer',
      task: 'Review content for brand alignment and quality',
      context: args,
      instructions: [
        'Review copy for brand voice compliance',
        'Check for spelling and grammar errors',
        'Verify hashtag appropriateness',
        'Validate image/video specifications',
        'Check link accuracy',
        'Ensure legal/compliance requirements met',
        'Document review feedback',
        'Approve or flag for revision'
      ],
      outputFormat: 'JSON with reviewResults, approvedCount, pendingCount, rejectedCount, totalContent, feedback, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reviewResults', 'approvedCount', 'totalContent', 'artifacts'],
      properties: {
        reviewResults: { type: 'array', items: { type: 'object' } },
        approvedCount: { type: 'number' },
        pendingCount: { type: 'number' },
        rejectedCount: { type: 'number' },
        totalContent: { type: 'number' },
        feedback: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'social-media', 'content-review', 'approval']
}));

export const contentSchedulingTask = defineTask('content-scheduling', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Schedule posts across platforms',
  agent: {
    name: 'content-scheduler',
    prompt: {
      role: 'social media scheduler',
      task: 'Schedule approved content across all platforms',
      context: args,
      instructions: [
        'Determine optimal posting times',
        'Schedule content by platform',
        'Ensure proper content spacing',
        'Set up cross-posting where appropriate',
        'Configure platform-specific features',
        'Set up first comment strategies',
        'Create scheduling documentation',
        'Generate content calendar view'
      ],
      outputFormat: 'JSON with scheduledPosts, calendar, postingTimes, crossPosting, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['scheduledPosts', 'calendar', 'artifacts'],
      properties: {
        scheduledPosts: { type: 'array', items: { type: 'object' } },
        calendar: { type: 'object' },
        postingTimes: { type: 'object' },
        crossPosting: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'social-media', 'scheduling']
}));

export const publishingMonitoringTask = defineTask('publishing-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up publishing monitoring',
  agent: {
    name: 'publishing-monitor',
    prompt: {
      role: 'social media publishing specialist',
      task: 'Set up monitoring for published content and engagement',
      context: args,
      instructions: [
        'Configure publishing success alerts',
        'Set up failed publish notifications',
        'Create engagement monitoring dashboards',
        'Define early performance indicators',
        'Set up comment/mention alerts',
        'Configure sentiment monitoring',
        'Create monitoring checklist',
        'Document escalation procedures'
      ],
      outputFormat: 'JSON with setup, alerts, dashboards, monitoringChecklist, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['setup', 'artifacts'],
      properties: {
        setup: { type: 'object' },
        alerts: { type: 'array', items: { type: 'object' } },
        dashboards: { type: 'array', items: { type: 'object' } },
        monitoringChecklist: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'social-media', 'monitoring', 'publishing']
}));

export const engagementManagementTask = defineTask('engagement-management', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up response and engagement management',
  agent: {
    name: 'engagement-manager',
    prompt: {
      role: 'social media community manager',
      task: 'Set up protocols for responding to comments and messages',
      context: args,
      instructions: [
        'Define response time targets',
        'Create response templates',
        'Set up response workflow',
        'Configure auto-responses where appropriate',
        'Define escalation triggers',
        'Create FAQ response library',
        'Document tone guidelines for responses',
        'Set up response tracking'
      ],
      outputFormat: 'JSON with protocols, responseTemplates, workflow, autoResponses, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['protocols', 'artifacts'],
      properties: {
        protocols: { type: 'object' },
        responseTemplates: { type: 'array', items: { type: 'object' } },
        workflow: { type: 'object' },
        autoResponses: { type: 'array', items: { type: 'object' } },
        faqLibrary: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'social-media', 'engagement', 'community']
}));

export const realtimeOpportunityTask = defineTask('realtime-opportunity', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up real-time opportunity tracking',
  agent: {
    name: 'trend-tracker',
    prompt: {
      role: 'social media trend analyst',
      task: 'Set up tracking for real-time content opportunities',
      context: args,
      instructions: [
        'Configure trend monitoring tools',
        'Set up relevant hashtag tracking',
        'Define newsjacking criteria',
        'Create rapid response workflow',
        'Set up competitor activity alerts',
        'Define brand mention triggers',
        'Create opportunity evaluation criteria',
        'Document approval fast-track process'
      ],
      outputFormat: 'JSON with trackingSetup, alerts, criteria, rapidResponseWorkflow, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['trackingSetup', 'alerts', 'artifacts'],
      properties: {
        trackingSetup: { type: 'object' },
        alerts: { type: 'array', items: { type: 'object' } },
        criteria: { type: 'object' },
        rapidResponseWorkflow: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'social-media', 'trends', 'real-time']
}));

export const performanceAnalysisTask = defineTask('performance-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create content performance analysis',
  agent: {
    name: 'performance-analyst',
    prompt: {
      role: 'social media analytics specialist',
      task: 'Create framework for analyzing content performance',
      context: args,
      instructions: [
        'Define key performance metrics',
        'Create performance benchmarks',
        'Design performance dashboard',
        'Set up automated reporting',
        'Define top/bottom performer criteria',
        'Create content optimization recommendations framework',
        'Plan A/B testing approach',
        'Document insights capture process'
      ],
      outputFormat: 'JSON with analysis, metrics, dashboards, reportingSchedule, testingPlan, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'artifacts'],
      properties: {
        analysis: { type: 'object' },
        metrics: { type: 'array', items: { type: 'object' } },
        dashboards: { type: 'array', items: { type: 'object' } },
        reportingSchedule: { type: 'object' },
        testingPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'social-media', 'analytics', 'performance']
}));
