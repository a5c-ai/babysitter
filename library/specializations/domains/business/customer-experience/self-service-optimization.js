/**
 * @process customer-experience/self-service-optimization
 * @description Continuous improvement process for enhancing self-service effectiveness through analytics and content optimization
 * @inputs { analyticsData: object, searchData: array, contentMetrics: object, userBehavior: object }
 * @outputs { success: boolean, optimizationPlan: object, improvements: array, metrics: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    analyticsData = {},
    searchData = [],
    contentMetrics = {},
    userBehavior = {},
    outputDir = 'self-service-output',
    targetDeflectionRate = 70
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Self-Service Optimization Process');

  // ============================================================================
  // PHASE 1: USAGE ANALYTICS REVIEW
  // ============================================================================

  ctx.log('info', 'Phase 1: Reviewing self-service usage analytics');
  const usageAnalytics = await ctx.task(usageAnalyticsTask, {
    analyticsData,
    userBehavior,
    outputDir
  });

  artifacts.push(...usageAnalytics.artifacts);

  // ============================================================================
  // PHASE 2: SEARCH EFFECTIVENESS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing search effectiveness');
  const searchAnalysis = await ctx.task(searchAnalysisTask, {
    searchData,
    contentMetrics,
    outputDir
  });

  artifacts.push(...searchAnalysis.artifacts);

  // ============================================================================
  // PHASE 3: CONTENT GAP IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Identifying content gaps');
  const contentGaps = await ctx.task(contentGapsTask, {
    searchAnalysis,
    usageAnalytics,
    contentMetrics,
    outputDir
  });

  artifacts.push(...contentGaps.artifacts);

  // ============================================================================
  // PHASE 4: USER JOURNEY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing user journeys');
  const journeyAnalysis = await ctx.task(journeyAnalysisTask, {
    userBehavior,
    usageAnalytics,
    searchAnalysis,
    outputDir
  });

  artifacts.push(...journeyAnalysis.artifacts);

  // ============================================================================
  // PHASE 5: DEFLECTION RATE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Analyzing deflection rates');
  const deflectionAnalysis = await ctx.task(deflectionAnalysisTask, {
    usageAnalytics,
    journeyAnalysis,
    targetDeflectionRate,
    outputDir
  });

  artifacts.push(...deflectionAnalysis.artifacts);

  // ============================================================================
  // PHASE 6: OPTIMIZATION RECOMMENDATIONS
  // ============================================================================

  ctx.log('info', 'Phase 6: Generating optimization recommendations');
  const optimizationRecommendations = await ctx.task(optimizationRecommendationsTask, {
    usageAnalytics,
    searchAnalysis,
    contentGaps,
    journeyAnalysis,
    deflectionAnalysis,
    outputDir
  });

  artifacts.push(...optimizationRecommendations.artifacts);

  // ============================================================================
  // PHASE 7: IMPLEMENTATION PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 7: Planning implementation');
  const implementationPlan = await ctx.task(implementationPlanTask, {
    optimizationRecommendations,
    contentGaps,
    outputDir
  });

  artifacts.push(...implementationPlan.artifacts);

  // ============================================================================
  // PHASE 8: SUCCESS METRICS DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 8: Defining success metrics');
  const successMetrics = await ctx.task(successMetricsTask, {
    deflectionAnalysis,
    optimizationRecommendations,
    targetDeflectionRate,
    outputDir
  });

  artifacts.push(...successMetrics.artifacts);

  const currentDeflectionRate = deflectionAnalysis.currentRate;
  const targetMet = currentDeflectionRate >= targetDeflectionRate;

  await ctx.breakpoint({
    question: `Self-service optimization analysis complete. Current deflection rate: ${currentDeflectionRate}%. Target: ${targetDeflectionRate}%. ${targetMet ? 'Target met!' : 'Optimization needed.'} Improvements identified: ${optimizationRecommendations.recommendations?.length || 0}. Review and implement?`,
    title: 'Self-Service Optimization Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        currentDeflectionRate,
        targetDeflectionRate,
        targetMet,
        contentGapsFound: contentGaps.gaps?.length || 0,
        recommendationsCount: optimizationRecommendations.recommendations?.length || 0,
        searchIssues: searchAnalysis.issues?.length || 0
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    currentDeflectionRate,
    targetMet,
    usageMetrics: usageAnalytics.metrics,
    searchEffectiveness: searchAnalysis.effectiveness,
    contentGaps: contentGaps.gaps,
    journeyInsights: journeyAnalysis.insights,
    deflectionAnalysis: {
      currentRate: deflectionAnalysis.currentRate,
      byChannel: deflectionAnalysis.byChannel,
      trends: deflectionAnalysis.trends
    },
    optimizationPlan: {
      recommendations: optimizationRecommendations.recommendations,
      implementation: implementationPlan.plan,
      timeline: implementationPlan.timeline
    },
    metrics: successMetrics.metrics,
    artifacts,
    duration,
    metadata: {
      processId: 'customer-experience/self-service-optimization',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const usageAnalyticsTask = defineTask('usage-analytics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review self-service usage analytics',
  agent: {
    name: 'usage-analyst',
    prompt: {
      role: 'self-service analytics specialist',
      task: 'Analyze self-service channel usage patterns and metrics',
      context: args,
      instructions: [
        'Analyze overall self-service volume',
        'Review traffic by channel and entry point',
        'Analyze session duration and depth',
        'Review bounce and exit rates',
        'Identify peak usage times',
        'Analyze device and platform distribution',
        'Review user segment behavior',
        'Identify trending topics',
        'Generate usage analytics report'
      ],
      outputFormat: 'JSON with metrics, channels, sessions, bounceRates, peaks, segments, trends, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'sessions', 'artifacts'],
      properties: {
        metrics: { type: 'object' },
        channels: { type: 'object' },
        sessions: { type: 'object' },
        bounceRates: { type: 'object' },
        peaks: { type: 'array', items: { type: 'object' } },
        segments: { type: 'object' },
        trends: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'self-service', 'analytics']
}));

export const searchAnalysisTask = defineTask('search-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze search effectiveness',
  agent: {
    name: 'search-analyst',
    prompt: {
      role: 'search optimization specialist',
      task: 'Analyze self-service search effectiveness and issues',
      context: args,
      instructions: [
        'Analyze search query patterns',
        'Identify zero-result searches',
        'Review click-through rates',
        'Analyze search refinement patterns',
        'Identify failed searches',
        'Review search to resolution path',
        'Analyze search term effectiveness',
        'Identify search improvement opportunities',
        'Generate search analysis report'
      ],
      outputFormat: 'JSON with effectiveness, queries, zeroResults, clickThrough, failures, issues, improvements, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['effectiveness', 'issues', 'artifacts'],
      properties: {
        effectiveness: { type: 'number', minimum: 0, maximum: 100 },
        queries: { type: 'object' },
        zeroResults: { type: 'array', items: { type: 'object' } },
        clickThrough: { type: 'object' },
        failures: { type: 'array', items: { type: 'object' } },
        issues: { type: 'array', items: { type: 'object' } },
        improvements: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'self-service', 'search']
}));

export const contentGapsTask = defineTask('content-gaps', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify content gaps',
  agent: {
    name: 'content-gap-analyst',
    prompt: {
      role: 'knowledge content analyst',
      task: 'Identify gaps in self-service content',
      context: args,
      instructions: [
        'Identify topics with no content',
        'Find content with low resolution rates',
        'Identify outdated content',
        'Find content lacking depth',
        'Identify missing procedural content',
        'Find gaps in troubleshooting guides',
        'Identify FAQ gaps',
        'Prioritize content gaps by impact',
        'Generate content gap report'
      ],
      outputFormat: 'JSON with gaps, noContent, lowResolution, outdated, lackingDepth, priorities, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['gaps', 'priorities', 'artifacts'],
      properties: {
        gaps: { type: 'array', items: { type: 'object' } },
        noContent: { type: 'array', items: { type: 'string' } },
        lowResolution: { type: 'array', items: { type: 'object' } },
        outdated: { type: 'array', items: { type: 'object' } },
        lackingDepth: { type: 'array', items: { type: 'object' } },
        priorities: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'self-service', 'content-gaps']
}));

export const journeyAnalysisTask = defineTask('journey-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze user journeys',
  agent: {
    name: 'journey-analyst',
    prompt: {
      role: 'customer journey analyst',
      task: 'Analyze self-service user journeys and paths',
      context: args,
      instructions: [
        'Map common user paths',
        'Identify drop-off points',
        'Analyze successful resolution paths',
        'Identify friction points',
        'Analyze channel switching behavior',
        'Review escalation triggers',
        'Identify optimization opportunities',
        'Create journey improvement recommendations',
        'Generate journey analysis report'
      ],
      outputFormat: 'JSON with paths, dropOffs, successPaths, frictionPoints, channelSwitching, insights, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['paths', 'insights', 'artifacts'],
      properties: {
        paths: { type: 'array', items: { type: 'object' } },
        dropOffs: { type: 'array', items: { type: 'object' } },
        successPaths: { type: 'array', items: { type: 'object' } },
        frictionPoints: { type: 'array', items: { type: 'object' } },
        channelSwitching: { type: 'object' },
        insights: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'self-service', 'journey']
}));

export const deflectionAnalysisTask = defineTask('deflection-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze deflection rates',
  agent: {
    name: 'deflection-analyst',
    prompt: {
      role: 'self-service deflection specialist',
      task: 'Analyze ticket deflection rates and opportunities',
      context: args,
      instructions: [
        'Calculate overall deflection rate',
        'Analyze deflection by topic',
        'Analyze deflection by channel',
        'Identify high-deflection content',
        'Identify low-deflection content',
        'Analyze deflection trends',
        'Compare to target rate',
        'Identify deflection improvement opportunities',
        'Generate deflection analysis report'
      ],
      outputFormat: 'JSON with currentRate, byTopic, byChannel, highDeflection, lowDeflection, trends, opportunities, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['currentRate', 'trends', 'artifacts'],
      properties: {
        currentRate: { type: 'number', minimum: 0, maximum: 100 },
        byTopic: { type: 'object' },
        byChannel: { type: 'object' },
        highDeflection: { type: 'array', items: { type: 'object' } },
        lowDeflection: { type: 'array', items: { type: 'object' } },
        trends: { type: 'object' },
        opportunities: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'self-service', 'deflection']
}));

export const optimizationRecommendationsTask = defineTask('optimization-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate optimization recommendations',
  agent: {
    name: 'optimization-specialist',
    prompt: {
      role: 'self-service optimization specialist',
      task: 'Generate actionable optimization recommendations',
      context: args,
      instructions: [
        'Prioritize content improvements',
        'Recommend search enhancements',
        'Suggest navigation improvements',
        'Recommend UX optimizations',
        'Suggest chatbot improvements',
        'Recommend personalization opportunities',
        'Suggest proactive guidance features',
        'Calculate impact potential',
        'Generate recommendations report'
      ],
      outputFormat: 'JSON with recommendations, content, search, navigation, ux, chatbot, personalization, impact, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'impact', 'artifacts'],
      properties: {
        recommendations: { type: 'array', items: { type: 'object' } },
        content: { type: 'array', items: { type: 'object' } },
        search: { type: 'array', items: { type: 'object' } },
        navigation: { type: 'array', items: { type: 'object' } },
        ux: { type: 'array', items: { type: 'object' } },
        chatbot: { type: 'array', items: { type: 'object' } },
        personalization: { type: 'array', items: { type: 'object' } },
        impact: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'self-service', 'optimization']
}));

export const implementationPlanTask = defineTask('implementation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan implementation',
  agent: {
    name: 'implementation-planner',
    prompt: {
      role: 'implementation project manager',
      task: 'Create implementation plan for optimization recommendations',
      context: args,
      instructions: [
        'Prioritize recommendations by impact and effort',
        'Create phased implementation plan',
        'Define resource requirements',
        'Set implementation timeline',
        'Identify quick wins',
        'Define dependencies',
        'Plan testing and validation',
        'Define rollback procedures',
        'Generate implementation plan'
      ],
      outputFormat: 'JSON with plan, phases, resources, timeline, quickWins, dependencies, testing, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'timeline', 'artifacts'],
      properties: {
        plan: { type: 'object' },
        phases: { type: 'array', items: { type: 'object' } },
        resources: { type: 'object' },
        timeline: { type: 'object' },
        quickWins: { type: 'array', items: { type: 'object' } },
        dependencies: { type: 'array', items: { type: 'object' } },
        testing: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'self-service', 'implementation']
}));

export const successMetricsTask = defineTask('success-metrics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define success metrics',
  agent: {
    name: 'metrics-specialist',
    prompt: {
      role: 'self-service metrics specialist',
      task: 'Define success metrics for optimization initiatives',
      context: args,
      instructions: [
        'Define deflection rate targets',
        'Define search effectiveness targets',
        'Define resolution rate targets',
        'Define CSAT improvement targets',
        'Create measurement methodology',
        'Define baseline measurements',
        'Set milestone targets',
        'Design metrics dashboard',
        'Generate success metrics documentation'
      ],
      outputFormat: 'JSON with metrics, targets, methodology, baselines, milestones, dashboard, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'targets', 'artifacts'],
      properties: {
        metrics: { type: 'array', items: { type: 'object' } },
        targets: { type: 'object' },
        methodology: { type: 'object' },
        baselines: { type: 'object' },
        milestones: { type: 'array', items: { type: 'object' } },
        dashboard: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'self-service', 'metrics']
}));
