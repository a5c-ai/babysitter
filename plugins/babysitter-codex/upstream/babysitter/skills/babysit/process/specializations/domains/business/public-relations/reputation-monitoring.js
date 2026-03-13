/**
 * @process specializations/domains/business/public-relations/reputation-monitoring
 * @description Implement continuous monitoring of media coverage, social sentiment, and stakeholder perceptions with periodic reputation audits using established metrics
 * @specialization Public Relations and Communications
 * @category Reputation Management
 * @inputs { organization: object, monitoringScope: object, baselineMetrics: object, alertThresholds: object }
 * @outputs { success: boolean, monitoringFramework: object, dashboards: object, alertSystem: object, quality: number }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organization,
    monitoringScope = {},
    baselineMetrics = {},
    alertThresholds = {},
    competitors = [],
    targetQuality = 85
  } = inputs;

  // Phase 1: Monitoring Requirements Analysis
  await ctx.breakpoint({
    question: 'Starting reputation monitoring setup. Analyze monitoring requirements?',
    title: 'Phase 1: Requirements Analysis',
    context: {
      runId: ctx.runId,
      phase: 'requirements-analysis',
      organization: organization.name
    }
  });

  const requirementsAnalysis = await ctx.task(analyzeMonitoringRequirementsTask, {
    organization,
    monitoringScope,
    competitors
  });

  // Phase 2: Monitoring Framework Design
  await ctx.breakpoint({
    question: 'Requirements analyzed. Design monitoring framework?',
    title: 'Phase 2: Framework Design',
    context: {
      runId: ctx.runId,
      phase: 'framework-design'
    }
  });

  const [mediaMonitoring, socialMonitoring] = await Promise.all([
    ctx.task(designMediaMonitoringTask, {
      requirementsAnalysis,
      organization
    }),
    ctx.task(designSocialMonitoringTask, {
      requirementsAnalysis,
      organization
    })
  ]);

  // Phase 3: Sentiment Analysis Setup
  await ctx.breakpoint({
    question: 'Monitoring designed. Configure sentiment analysis?',
    title: 'Phase 3: Sentiment Analysis',
    context: {
      runId: ctx.runId,
      phase: 'sentiment-analysis'
    }
  });

  const sentimentFramework = await ctx.task(configureSentimentAnalysisTask, {
    mediaMonitoring,
    socialMonitoring,
    organization
  });

  // Phase 4: Metrics and KPI Definition
  await ctx.breakpoint({
    question: 'Sentiment configured. Define reputation metrics and KPIs?',
    title: 'Phase 4: Metrics Definition',
    context: {
      runId: ctx.runId,
      phase: 'metrics-definition'
    }
  });

  const metricsFramework = await ctx.task(defineReputationMetricsTask, {
    baselineMetrics,
    requirementsAnalysis,
    sentimentFramework
  });

  // Phase 5: Alert System Configuration
  await ctx.breakpoint({
    question: 'Metrics defined. Configure alert and escalation system?',
    title: 'Phase 5: Alert System',
    context: {
      runId: ctx.runId,
      phase: 'alert-system'
    }
  });

  const alertSystem = await ctx.task(configureAlertSystemTask, {
    alertThresholds,
    metricsFramework,
    organization
  });

  // Phase 6: Dashboard and Reporting
  await ctx.breakpoint({
    question: 'Alerts configured. Design dashboards and reporting?',
    title: 'Phase 6: Dashboards',
    context: {
      runId: ctx.runId,
      phase: 'dashboards'
    }
  });

  const [dashboards, reportingCadence] = await Promise.all([
    ctx.task(designDashboardsTask, {
      metricsFramework,
      alertSystem,
      organization
    }),
    ctx.task(defineReportingCadenceTask, {
      metricsFramework,
      organization
    })
  ]);

  // Phase 7: Reputation Audit Framework
  await ctx.breakpoint({
    question: 'Dashboards designed. Define periodic audit framework?',
    title: 'Phase 7: Audit Framework',
    context: {
      runId: ctx.runId,
      phase: 'audit-framework'
    }
  });

  const auditFramework = await ctx.task(defineAuditFrameworkTask, {
    metricsFramework,
    organization,
    baselineMetrics
  });

  // Phase 8: Competitive Benchmarking
  await ctx.breakpoint({
    question: 'Audit framework defined. Configure competitive benchmarking?',
    title: 'Phase 8: Competitive Benchmarking',
    context: {
      runId: ctx.runId,
      phase: 'competitive-benchmarking',
      competitorCount: competitors.length
    }
  });

  const competitiveBenchmarking = await ctx.task(configureCompetitiveBenchmarkingTask, {
    competitors,
    metricsFramework,
    organization
  });

  // Phase 9: Quality Validation
  await ctx.breakpoint({
    question: 'Validate reputation monitoring framework quality?',
    title: 'Phase 9: Quality Validation',
    context: {
      runId: ctx.runId,
      phase: 'quality-validation',
      targetQuality
    }
  });

  const qualityResult = await ctx.task(validateMonitoringQualityTask, {
    mediaMonitoring,
    socialMonitoring,
    sentimentFramework,
    metricsFramework,
    alertSystem,
    dashboards,
    auditFramework,
    competitiveBenchmarking,
    targetQuality
  });

  const quality = qualityResult.score;

  if (quality >= targetQuality) {
    return {
      success: true,
      monitoringFramework: {
        mediaMonitoring,
        socialMonitoring,
        sentimentFramework,
        metricsFramework,
        auditFramework,
        competitiveBenchmarking
      },
      dashboards,
      reportingCadence,
      alertSystem,
      quality,
      targetQuality,
      metadata: {
        processId: 'specializations/domains/business/public-relations/reputation-monitoring',
        timestamp: ctx.now(),
        organization: organization.name
      }
    };
  } else {
    return {
      success: false,
      qualityGateFailed: true,
      quality,
      targetQuality,
      gaps: qualityResult.gaps,
      recommendations: qualityResult.recommendations,
      metadata: {
        processId: 'specializations/domains/business/public-relations/reputation-monitoring',
        timestamp: ctx.now()
      }
    };
  }
}

// Task Definitions

export const analyzeMonitoringRequirementsTask = defineTask('analyze-monitoring-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Monitoring Requirements',
  agent: {
    name: 'monitoring-requirements-analyst',
    prompt: {
      role: 'Reputation monitoring specialist analyzing requirements',
      task: 'Analyze reputation monitoring requirements',
      context: args,
      instructions: [
        'Identify key reputation drivers for organization',
        'Define monitoring scope (geographic, language, topics)',
        'Identify critical stakeholder groups to monitor',
        'Map key issues and topics to track',
        'Identify media and social channels to cover',
        'Define competitor set for benchmarking',
        'Assess current monitoring capabilities',
        'Identify integration requirements'
      ],
      outputFormat: 'JSON with reputationDrivers, scope, stakeholders, topics, channels, competitors, currentCapabilities, integrationNeeds'
    },
    outputSchema: {
      type: 'object',
      required: ['reputationDrivers', 'scope', 'topics', 'channels'],
      properties: {
        reputationDrivers: { type: 'array', items: { type: 'string' } },
        scope: { type: 'object' },
        stakeholders: { type: 'array', items: { type: 'object' } },
        topics: { type: 'array', items: { type: 'string' } },
        channels: { type: 'array', items: { type: 'object' } },
        competitors: { type: 'array', items: { type: 'object' } },
        currentCapabilities: { type: 'object' },
        integrationNeeds: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'monitoring-requirements']
}));

export const designMediaMonitoringTask = defineTask('design-media-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design Media Monitoring',
  agent: {
    name: 'media-monitoring-designer',
    prompt: {
      role: 'Media intelligence specialist designing monitoring systems',
      task: 'Design comprehensive media monitoring approach',
      context: args,
      instructions: [
        'Define keyword and query strategy',
        'Identify media sources to monitor (news, broadcast, trade)',
        'Configure geographic coverage',
        'Define language requirements',
        'Set up Boolean search logic',
        'Configure outlet tiering and weighting',
        'Define clipping and archiving approach',
        'Plan media monitoring tool selection/configuration'
      ],
      outputFormat: 'JSON with keywordStrategy, sources, geographicCoverage, languages, searchLogic, outletTiering, archivingApproach, toolConfiguration'
    },
    outputSchema: {
      type: 'object',
      required: ['keywordStrategy', 'sources', 'searchLogic'],
      properties: {
        keywordStrategy: { type: 'object' },
        sources: { type: 'array', items: { type: 'object' } },
        geographicCoverage: { type: 'array', items: { type: 'string' } },
        languages: { type: 'array', items: { type: 'string' } },
        searchLogic: { type: 'object' },
        outletTiering: { type: 'object' },
        archivingApproach: { type: 'object' },
        toolConfiguration: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'media-monitoring']
}));

export const designSocialMonitoringTask = defineTask('design-social-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design Social Monitoring',
  agent: {
    name: 'social-monitoring-designer',
    prompt: {
      role: 'Social listening specialist designing monitoring systems',
      task: 'Design comprehensive social media monitoring',
      context: args,
      instructions: [
        'Define social platforms to monitor',
        'Configure keyword and hashtag tracking',
        'Set up brand mention monitoring',
        'Define influencer and stakeholder tracking',
        'Configure forum and community monitoring',
        'Set up review site monitoring',
        'Plan social listening tool configuration',
        'Define data collection and privacy compliance'
      ],
      outputFormat: 'JSON with platforms, keywords, brandMentions, influencerTracking, forumMonitoring, reviewSites, toolConfiguration, privacyCompliance'
    },
    outputSchema: {
      type: 'object',
      required: ['platforms', 'keywords', 'brandMentions'],
      properties: {
        platforms: { type: 'array', items: { type: 'object' } },
        keywords: { type: 'object' },
        brandMentions: { type: 'object' },
        influencerTracking: { type: 'object' },
        forumMonitoring: { type: 'object' },
        reviewSites: { type: 'array', items: { type: 'object' } },
        toolConfiguration: { type: 'object' },
        privacyCompliance: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'social-monitoring']
}));

export const configureSentimentAnalysisTask = defineTask('configure-sentiment-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure Sentiment Analysis',
  agent: {
    name: 'sentiment-configurator',
    prompt: {
      role: 'Sentiment analysis specialist configuring analysis framework',
      task: 'Configure sentiment analysis for reputation monitoring',
      context: args,
      instructions: [
        'Define sentiment classification approach (positive, negative, neutral)',
        'Configure topic-level sentiment analysis',
        'Set up entity-level sentiment extraction',
        'Define sentiment scoring methodology',
        'Configure emotion detection where relevant',
        'Set up automated vs. manual classification rules',
        'Define quality assurance for sentiment accuracy',
        'Plan sentiment trend analysis approach'
      ],
      outputFormat: 'JSON with classificationApproach, topicSentiment, entitySentiment, scoringMethodology, emotionDetection, classificationRules, qaProcess, trendAnalysis'
    },
    outputSchema: {
      type: 'object',
      required: ['classificationApproach', 'scoringMethodology'],
      properties: {
        classificationApproach: { type: 'object' },
        topicSentiment: { type: 'object' },
        entitySentiment: { type: 'object' },
        scoringMethodology: { type: 'object' },
        emotionDetection: { type: 'object' },
        classificationRules: { type: 'object' },
        qaProcess: { type: 'object' },
        trendAnalysis: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'sentiment-analysis']
}));

export const defineReputationMetricsTask = defineTask('define-reputation-metrics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define Reputation Metrics',
  agent: {
    name: 'reputation-metrics-designer',
    prompt: {
      role: 'PR measurement specialist defining reputation KPIs',
      task: 'Define comprehensive reputation metrics and KPIs',
      context: args,
      instructions: [
        'Define share of voice metrics',
        'Configure sentiment score tracking',
        'Define message pull-through metrics',
        'Set up reach and impressions tracking',
        'Define engagement rate metrics',
        'Configure reputation index or score',
        'Define stakeholder perception metrics',
        'Set up Barcelona Principles aligned metrics'
      ],
      outputFormat: 'JSON with shareOfVoice, sentimentScore, messagePullThrough, reachMetrics, engagementMetrics, reputationIndex, stakeholderPerception, barcelonaAlignment'
    },
    outputSchema: {
      type: 'object',
      required: ['shareOfVoice', 'sentimentScore', 'reputationIndex'],
      properties: {
        shareOfVoice: { type: 'object' },
        sentimentScore: { type: 'object' },
        messagePullThrough: { type: 'object' },
        reachMetrics: { type: 'object' },
        engagementMetrics: { type: 'object' },
        reputationIndex: { type: 'object' },
        stakeholderPerception: { type: 'object' },
        barcelonaAlignment: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'reputation-metrics']
}));

export const configureAlertSystemTask = defineTask('configure-alert-system', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure Alert System',
  agent: {
    name: 'alert-system-configurator',
    prompt: {
      role: 'Monitoring operations specialist configuring alert systems',
      task: 'Configure reputation alert and escalation system',
      context: args,
      instructions: [
        'Define alert trigger thresholds',
        'Configure real-time vs. batch alerting',
        'Set up volume spike detection',
        'Configure sentiment shift alerts',
        'Define crisis indicator alerts',
        'Set up executive mention alerts',
        'Configure escalation protocols',
        'Define alert recipients and channels'
      ],
      outputFormat: 'JSON with triggers, alertTiming, volumeSpike, sentimentShift, crisisIndicators, executiveMentions, escalationProtocols, recipients'
    },
    outputSchema: {
      type: 'object',
      required: ['triggers', 'escalationProtocols', 'recipients'],
      properties: {
        triggers: { type: 'array', items: { type: 'object' } },
        alertTiming: { type: 'object' },
        volumeSpike: { type: 'object' },
        sentimentShift: { type: 'object' },
        crisisIndicators: { type: 'array', items: { type: 'object' } },
        executiveMentions: { type: 'object' },
        escalationProtocols: { type: 'object' },
        recipients: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'alert-system']
}));

export const designDashboardsTask = defineTask('design-dashboards', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design Dashboards',
  agent: {
    name: 'dashboard-designer',
    prompt: {
      role: 'Business intelligence specialist designing reputation dashboards',
      task: 'Design reputation monitoring dashboards',
      context: args,
      instructions: [
        'Design executive summary dashboard',
        'Create real-time monitoring dashboard',
        'Design media coverage dashboard',
        'Create social media dashboard',
        'Design sentiment analysis dashboard',
        'Create competitive comparison dashboard',
        'Design trend analysis views',
        'Define user access and permissions'
      ],
      outputFormat: 'JSON with executiveDashboard, realtimeDashboard, mediaDashboard, socialDashboard, sentimentDashboard, competitiveDashboard, trendViews, accessPermissions'
    },
    outputSchema: {
      type: 'object',
      required: ['executiveDashboard', 'realtimeDashboard'],
      properties: {
        executiveDashboard: { type: 'object' },
        realtimeDashboard: { type: 'object' },
        mediaDashboard: { type: 'object' },
        socialDashboard: { type: 'object' },
        sentimentDashboard: { type: 'object' },
        competitiveDashboard: { type: 'object' },
        trendViews: { type: 'array', items: { type: 'object' } },
        accessPermissions: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'dashboards']
}));

export const defineReportingCadenceTask = defineTask('define-reporting-cadence', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define Reporting Cadence',
  agent: {
    name: 'reporting-cadence-planner',
    prompt: {
      role: 'PR reporting specialist defining monitoring reports',
      task: 'Define reputation monitoring reporting cadence',
      context: args,
      instructions: [
        'Define daily monitoring summary format',
        'Create weekly report template',
        'Design monthly analysis report',
        'Plan quarterly reputation review',
        'Define annual reputation audit report',
        'Create ad-hoc issue reports',
        'Define report distribution lists',
        'Plan automated vs. curated reporting'
      ],
      outputFormat: 'JSON with dailySummary, weeklyReport, monthlyAnalysis, quarterlyReview, annualAudit, issueReports, distributionLists, automationPlan'
    },
    outputSchema: {
      type: 'object',
      required: ['weeklyReport', 'monthlyAnalysis'],
      properties: {
        dailySummary: { type: 'object' },
        weeklyReport: { type: 'object' },
        monthlyAnalysis: { type: 'object' },
        quarterlyReview: { type: 'object' },
        annualAudit: { type: 'object' },
        issueReports: { type: 'object' },
        distributionLists: { type: 'array', items: { type: 'object' } },
        automationPlan: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'reporting-cadence']
}));

export const defineAuditFrameworkTask = defineTask('define-audit-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define Audit Framework',
  agent: {
    name: 'reputation-audit-designer',
    prompt: {
      role: 'Reputation research specialist designing audit framework',
      task: 'Define periodic reputation audit framework',
      context: args,
      instructions: [
        'Define audit methodology (RepTrak, custom)',
        'Plan stakeholder survey approach',
        'Define brand tracking questions',
        'Plan media audit methodology',
        'Define employee perception tracking',
        'Plan customer perception research',
        'Define audit frequency and timing',
        'Create audit reporting format'
      ],
      outputFormat: 'JSON with methodology, stakeholderSurvey, brandTracking, mediaAudit, employeePerception, customerPerception, frequency, reportFormat'
    },
    outputSchema: {
      type: 'object',
      required: ['methodology', 'stakeholderSurvey', 'frequency'],
      properties: {
        methodology: { type: 'object' },
        stakeholderSurvey: { type: 'object' },
        brandTracking: { type: 'object' },
        mediaAudit: { type: 'object' },
        employeePerception: { type: 'object' },
        customerPerception: { type: 'object' },
        frequency: { type: 'string' },
        reportFormat: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'audit-framework']
}));

export const configureCompetitiveBenchmarkingTask = defineTask('configure-competitive-benchmarking', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure Competitive Benchmarking',
  agent: {
    name: 'competitive-benchmarking-configurator',
    prompt: {
      role: 'Competitive intelligence specialist configuring benchmarking',
      task: 'Configure competitive reputation benchmarking',
      context: args,
      instructions: [
        'Define competitor set and rationale',
        'Configure share of voice comparison',
        'Set up sentiment comparison tracking',
        'Define coverage comparison metrics',
        'Configure message comparison analysis',
        'Set up executive visibility comparison',
        'Define social presence comparison',
        'Create competitive reporting views'
      ],
      outputFormat: 'JSON with competitorSet, shareOfVoiceComparison, sentimentComparison, coverageComparison, messageComparison, executiveComparison, socialComparison, reportingViews'
    },
    outputSchema: {
      type: 'object',
      required: ['competitorSet', 'shareOfVoiceComparison'],
      properties: {
        competitorSet: { type: 'array', items: { type: 'object' } },
        shareOfVoiceComparison: { type: 'object' },
        sentimentComparison: { type: 'object' },
        coverageComparison: { type: 'object' },
        messageComparison: { type: 'object' },
        executiveComparison: { type: 'object' },
        socialComparison: { type: 'object' },
        reportingViews: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'competitive-benchmarking']
}));

export const validateMonitoringQualityTask = defineTask('validate-monitoring-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate Monitoring Framework Quality',
  agent: {
    name: 'monitoring-quality-validator',
    prompt: {
      role: 'PR measurement quality assessor',
      task: 'Validate reputation monitoring framework quality',
      context: args,
      instructions: [
        'Assess media monitoring coverage',
        'Evaluate social monitoring completeness',
        'Review sentiment analysis accuracy approach',
        'Assess metrics framework robustness',
        'Evaluate alert system effectiveness',
        'Review dashboard usability',
        'Assess audit framework rigor',
        'Provide overall quality score (0-100)'
      ],
      outputFormat: 'JSON with score, passed, mediaScore, socialScore, sentimentScore, metricsScore, alertScore, dashboardScore, auditScore, gaps, recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'passed'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        passed: { type: 'boolean' },
        mediaScore: { type: 'number' },
        socialScore: { type: 'number' },
        sentimentScore: { type: 'number' },
        metricsScore: { type: 'number' },
        alertScore: { type: 'number' },
        dashboardScore: { type: 'number' },
        auditScore: { type: 'number' },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'quality-validation']
}));
