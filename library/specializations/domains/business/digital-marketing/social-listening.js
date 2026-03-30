/**
 * @process digital-marketing/social-listening
 * @description Process for monitoring brand mentions, industry conversations, and audience sentiment across social platforms and the web, enabling proactive engagement and crisis management
 * @inputs { brandKeywords: array, competitorList: array, industryTopics: array, alertThresholds: object, outputDir: string }
 * @outputs { success: boolean, monitoringDashboards: array, sentimentReports: array, competitiveIntelligence: object, crisisAlerts: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    brandKeywords = [],
    competitorList = [],
    industryTopics = [],
    alertThresholds = {},
    outputDir = 'social-listening-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Social Listening and Brand Monitoring process');

  // Task 1: Configure Monitoring Queries
  ctx.log('info', 'Phase 1: Configuring monitoring queries');
  const queryConfig = await ctx.task(monitoringQueryConfigTask, {
    brandKeywords,
    competitorList,
    industryTopics,
    outputDir
  });
  artifacts.push(...queryConfig.artifacts);

  // Task 2: Set Up Critical Alerts
  ctx.log('info', 'Phase 2: Setting up alerts for critical mentions');
  const alertSetup = await ctx.task(criticalAlertSetupTask, {
    queryConfig,
    alertThresholds,
    outputDir
  });
  artifacts.push(...alertSetup.artifacts);

  // Task 3: Monitor Brand Mentions and Sentiment
  ctx.log('info', 'Phase 3: Setting up brand mention and sentiment monitoring');
  const brandMonitoring = await ctx.task(brandMentionMonitoringTask, {
    queryConfig,
    brandKeywords,
    outputDir
  });
  artifacts.push(...brandMonitoring.artifacts);

  // Task 4: Track Competitor Activities
  ctx.log('info', 'Phase 4: Setting up competitor activity tracking');
  const competitorTracking = await ctx.task(competitorTrackingTask, {
    competitorList,
    queryConfig,
    outputDir
  });
  artifacts.push(...competitorTracking.artifacts);

  // Task 5: Identify Trending Topics
  ctx.log('info', 'Phase 5: Setting up trending topic identification');
  const trendIdentification = await ctx.task(trendIdentificationTask, {
    industryTopics,
    queryConfig,
    outputDir
  });
  artifacts.push(...trendIdentification.artifacts);

  // Task 6: Analyze Sentiment Patterns
  ctx.log('info', 'Phase 6: Creating sentiment analysis framework');
  const sentimentAnalysis = await ctx.task(sentimentAnalysisTask, {
    brandMonitoring,
    alertThresholds,
    outputDir
  });
  artifacts.push(...sentimentAnalysis.artifacts);

  // Task 7: Generate Insights and Recommendations
  ctx.log('info', 'Phase 7: Creating insights and recommendations framework');
  const insightsFramework = await ctx.task(insightsRecommendationsTask, {
    brandMonitoring,
    competitorTracking,
    trendIdentification,
    sentimentAnalysis,
    outputDir
  });
  artifacts.push(...insightsFramework.artifacts);

  // Task 8: Create Crisis Escalation Protocol
  ctx.log('info', 'Phase 8: Creating crisis escalation protocol');
  const crisisProtocol = await ctx.task(crisisEscalationTask, {
    alertSetup,
    alertThresholds,
    outputDir
  });
  artifacts.push(...crisisProtocol.artifacts);

  // Breakpoint: Review monitoring setup
  await ctx.breakpoint({
    question: `Social listening setup complete. ${queryConfig.totalQueries} queries configured with ${alertSetup.alertCount} alerts. Review and activate?`,
    title: 'Social Listening Setup Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        totalQueries: queryConfig.totalQueries,
        alertCount: alertSetup.alertCount,
        competitorsTracked: competitorList.length,
        crisisProtocolReady: crisisProtocol.protocolReady
      }
    }
  });

  // Task 9: Create Brand Health Reporting
  ctx.log('info', 'Phase 9: Creating brand health reporting framework');
  const brandHealthReporting = await ctx.task(brandHealthReportingTask, {
    brandMonitoring,
    sentimentAnalysis,
    competitorTracking,
    outputDir
  });
  artifacts.push(...brandHealthReporting.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    monitoringDashboards: brandMonitoring.dashboards,
    sentimentReports: sentimentAnalysis.reportTemplates,
    competitiveIntelligence: competitorTracking.intelligence,
    crisisAlerts: crisisProtocol.alerts,
    trendingInsights: trendIdentification.insights,
    brandHealthMetrics: brandHealthReporting.metrics,
    queryConfiguration: queryConfig.queries,
    artifacts,
    duration,
    metadata: {
      processId: 'digital-marketing/social-listening',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task definitions
export const monitoringQueryConfigTask = defineTask('monitoring-query-config', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure monitoring queries',
  agent: {
    name: 'listening-specialist',
    prompt: {
      role: 'social listening specialist',
      task: 'Configure comprehensive monitoring queries for brand, competitors, and industry',
      context: args,
      instructions: [
        'Create brand mention queries (including misspellings)',
        'Set up product/service specific queries',
        'Configure competitor monitoring queries',
        'Create industry topic queries',
        'Define Boolean query logic',
        'Set up sentiment-specific queries',
        'Configure language and region filters',
        'Document query taxonomy'
      ],
      outputFormat: 'JSON with queries, totalQueries, queryCategories, filters, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['queries', 'totalQueries', 'artifacts'],
      properties: {
        queries: { type: 'array', items: { type: 'object' } },
        totalQueries: { type: 'number' },
        queryCategories: { type: 'object' },
        filters: { type: 'object' },
        booleanLogic: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'social-listening', 'queries', 'configuration']
}));

export const criticalAlertSetupTask = defineTask('critical-alert-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up alerts for critical mentions',
  agent: {
    name: 'alert-specialist',
    prompt: {
      role: 'social monitoring alert specialist',
      task: 'Configure alerts for critical brand mentions and situations',
      context: args,
      instructions: [
        'Define alert triggers and thresholds',
        'Set up volume spike alerts',
        'Configure negative sentiment alerts',
        'Create influencer mention alerts',
        'Set up media coverage alerts',
        'Define alert routing and recipients',
        'Configure alert frequency and batching',
        'Document alert response procedures'
      ],
      outputFormat: 'JSON with alerts, alertCount, triggers, routing, responseProcedures, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['alerts', 'alertCount', 'artifacts'],
      properties: {
        alerts: { type: 'array', items: { type: 'object' } },
        alertCount: { type: 'number' },
        triggers: { type: 'object' },
        routing: { type: 'object' },
        responseProcedures: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'social-listening', 'alerts']
}));

export const brandMentionMonitoringTask = defineTask('brand-mention-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up brand mention and sentiment monitoring',
  agent: {
    name: 'brand-monitor',
    prompt: {
      role: 'brand monitoring specialist',
      task: 'Set up comprehensive brand mention and sentiment monitoring',
      context: args,
      instructions: [
        'Configure brand mention tracking',
        'Set up sentiment classification',
        'Create source categorization',
        'Track mention volume trends',
        'Identify key influencer mentions',
        'Monitor share of voice',
        'Create monitoring dashboards',
        'Document monitoring protocols'
      ],
      outputFormat: 'JSON with monitoringSetup, dashboards, sentimentConfig, volumeTracking, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['monitoringSetup', 'dashboards', 'artifacts'],
      properties: {
        monitoringSetup: { type: 'object' },
        dashboards: { type: 'array', items: { type: 'object' } },
        sentimentConfig: { type: 'object' },
        volumeTracking: { type: 'object' },
        shareOfVoice: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'social-listening', 'brand-monitoring', 'sentiment']
}));

export const competitorTrackingTask = defineTask('competitor-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up competitor activity tracking',
  agent: {
    name: 'competitive-tracker',
    prompt: {
      role: 'competitive intelligence specialist',
      task: 'Set up tracking for competitor social media activities',
      context: args,
      instructions: [
        'Configure competitor mention tracking',
        'Monitor competitor campaign launches',
        'Track competitor content performance',
        'Identify competitor messaging themes',
        'Monitor competitor audience sentiment',
        'Track competitive share of voice',
        'Create competitive comparison dashboards',
        'Document competitive insights process'
      ],
      outputFormat: 'JSON with tracking, intelligence, dashboards, comparisonMetrics, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['tracking', 'intelligence', 'artifacts'],
      properties: {
        tracking: { type: 'object' },
        intelligence: { type: 'object' },
        dashboards: { type: 'array', items: { type: 'object' } },
        comparisonMetrics: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'social-listening', 'competitive-intelligence']
}));

export const trendIdentificationTask = defineTask('trend-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up trending topic identification',
  agent: {
    name: 'trend-identifier',
    prompt: {
      role: 'trend analysis specialist',
      task: 'Set up identification of trending topics and conversations',
      context: args,
      instructions: [
        'Configure trend detection algorithms',
        'Set up industry topic tracking',
        'Monitor emerging conversations',
        'Identify relevant hashtag trends',
        'Track topic velocity and growth',
        'Create trend relevance scoring',
        'Set up trend alerts',
        'Document trend response process'
      ],
      outputFormat: 'JSON with trendTracking, insights, relevanceScoring, alerts, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['trendTracking', 'insights', 'artifacts'],
      properties: {
        trendTracking: { type: 'object' },
        insights: { type: 'object' },
        relevanceScoring: { type: 'object' },
        alerts: { type: 'array', items: { type: 'object' } },
        responseProcess: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'social-listening', 'trends']
}));

export const sentimentAnalysisTask = defineTask('sentiment-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create sentiment analysis framework',
  agent: {
    name: 'sentiment-analyst',
    prompt: {
      role: 'sentiment analysis specialist',
      task: 'Create framework for analyzing sentiment patterns',
      context: args,
      instructions: [
        'Define sentiment categories and scoring',
        'Create sentiment trend tracking',
        'Identify sentiment drivers',
        'Set up emotion analysis',
        'Create sentiment benchmarks',
        'Define sentiment alert thresholds',
        'Create sentiment report templates',
        'Document sentiment analysis methodology'
      ],
      outputFormat: 'JSON with framework, categories, reportTemplates, benchmarks, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['framework', 'reportTemplates', 'artifacts'],
      properties: {
        framework: { type: 'object' },
        categories: { type: 'array', items: { type: 'object' } },
        reportTemplates: { type: 'array', items: { type: 'object' } },
        benchmarks: { type: 'object' },
        emotionAnalysis: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'social-listening', 'sentiment-analysis']
}));

export const insightsRecommendationsTask = defineTask('insights-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create insights and recommendations framework',
  agent: {
    name: 'insights-specialist',
    prompt: {
      role: 'social insights specialist',
      task: 'Create framework for generating insights and recommendations',
      context: args,
      instructions: [
        'Define insight categories and templates',
        'Create actionable recommendation framework',
        'Set up insight prioritization criteria',
        'Define stakeholder reporting needs',
        'Create insight delivery workflow',
        'Set up insight tracking and follow-up',
        'Define success metrics for insights',
        'Document insights process'
      ],
      outputFormat: 'JSON with insightFramework, recommendationTemplates, prioritization, workflow, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['insightFramework', 'artifacts'],
      properties: {
        insightFramework: { type: 'object' },
        recommendationTemplates: { type: 'array', items: { type: 'object' } },
        prioritization: { type: 'object' },
        workflow: { type: 'object' },
        stakeholderNeeds: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'social-listening', 'insights', 'recommendations']
}));

export const crisisEscalationTask = defineTask('crisis-escalation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create crisis escalation protocol',
  agent: {
    name: 'crisis-specialist',
    prompt: {
      role: 'crisis management specialist',
      task: 'Create protocol for escalating potential crisis situations',
      context: args,
      instructions: [
        'Define crisis severity levels',
        'Create crisis detection criteria',
        'Set up escalation workflow',
        'Define stakeholder notification matrix',
        'Create crisis response templates',
        'Set up crisis war room procedures',
        'Define de-escalation criteria',
        'Document post-crisis review process'
      ],
      outputFormat: 'JSON with protocol, alerts, severityLevels, escalationWorkflow, protocolReady, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['protocol', 'protocolReady', 'artifacts'],
      properties: {
        protocol: { type: 'object' },
        alerts: { type: 'array', items: { type: 'object' } },
        severityLevels: { type: 'array', items: { type: 'object' } },
        escalationWorkflow: { type: 'object' },
        responseTemplates: { type: 'array', items: { type: 'object' } },
        protocolReady: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'social-listening', 'crisis-management', 'escalation']
}));

export const brandHealthReportingTask = defineTask('brand-health-reporting', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create brand health reporting framework',
  agent: {
    name: 'brand-health-analyst',
    prompt: {
      role: 'brand health analyst',
      task: 'Create framework for brand health metrics and reporting',
      context: args,
      instructions: [
        'Define brand health metrics',
        'Create brand health scorecard',
        'Set up trend tracking',
        'Define competitive comparison metrics',
        'Create reporting dashboards',
        'Set up automated reporting schedule',
        'Define action thresholds',
        'Document brand health methodology'
      ],
      outputFormat: 'JSON with metrics, scorecard, dashboards, reportingSchedule, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'artifacts'],
      properties: {
        metrics: { type: 'array', items: { type: 'object' } },
        scorecard: { type: 'object' },
        dashboards: { type: 'array', items: { type: 'object' } },
        reportingSchedule: { type: 'object' },
        actionThresholds: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'social-listening', 'brand-health', 'reporting']
}));
