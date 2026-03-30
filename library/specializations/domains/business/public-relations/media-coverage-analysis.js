/**
 * @process specializations/domains/business/public-relations/media-coverage-analysis
 * @description Analyze media coverage for message pull-through, sentiment, share of voice, and quality metrics, creating actionable reports for stakeholder communication
 * @specialization Public Relations and Communications
 * @category Measurement and Analytics
 * @inputs { coverageData: object, analysisScope: object, messagingFramework: object, competitors: object[] }
 * @outputs { success: boolean, analysisReport: object, insights: object[], recommendations: object[], quality: number }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    coverageData,
    analysisScope = {},
    messagingFramework = {},
    competitors = [],
    targetQuality = 85
  } = inputs;

  // Phase 1: Coverage Quantification
  await ctx.breakpoint({
    question: 'Starting media coverage analysis. Quantify coverage volume?',
    title: 'Phase 1: Coverage Quantification',
    context: {
      runId: ctx.runId,
      phase: 'coverage-quantification',
      analysisScope
    }
  });

  const coverageQuantification = await ctx.task(quantifyCoverageTask, {
    coverageData,
    analysisScope
  });

  // Phase 2: Message Pull-Through Analysis
  await ctx.breakpoint({
    question: 'Coverage quantified. Analyze message pull-through?',
    title: 'Phase 2: Message Pull-Through',
    context: {
      runId: ctx.runId,
      phase: 'message-pull-through',
      coverageVolume: coverageQuantification.totalItems
    }
  });

  const messagePullThrough = await ctx.task(analyzeMessagePullThroughTask, {
    coverageData,
    messagingFramework
  });

  // Phase 3: Sentiment Analysis
  await ctx.breakpoint({
    question: 'Messages analyzed. Conduct sentiment analysis?',
    title: 'Phase 3: Sentiment Analysis',
    context: {
      runId: ctx.runId,
      phase: 'sentiment-analysis'
    }
  });

  const sentimentAnalysis = await ctx.task(analyzeSentimentTask, {
    coverageData,
    analysisScope
  });

  // Phase 4: Share of Voice Analysis
  await ctx.breakpoint({
    question: 'Sentiment analyzed. Calculate share of voice?',
    title: 'Phase 4: Share of Voice',
    context: {
      runId: ctx.runId,
      phase: 'share-of-voice',
      competitorCount: competitors.length
    }
  });

  const shareOfVoice = await ctx.task(analyzeShareOfVoiceTask, {
    coverageData,
    competitors,
    analysisScope
  });

  // Phase 5: Quality Assessment
  await ctx.breakpoint({
    question: 'SOV calculated. Assess coverage quality?',
    title: 'Phase 5: Quality Assessment',
    context: {
      runId: ctx.runId,
      phase: 'quality-assessment'
    }
  });

  const qualityAssessment = await ctx.task(assessCoverageQualityTask, {
    coverageData,
    analysisScope
  });

  // Phase 6: Trend Analysis
  await ctx.breakpoint({
    question: 'Quality assessed. Analyze coverage trends?',
    title: 'Phase 6: Trend Analysis',
    context: {
      runId: ctx.runId,
      phase: 'trend-analysis'
    }
  });

  const trendAnalysis = await ctx.task(analyzeTrendsTask, {
    coverageQuantification,
    sentimentAnalysis,
    shareOfVoice,
    analysisScope
  });

  // Phase 7: Insights Generation
  await ctx.breakpoint({
    question: 'Trends analyzed. Generate insights and recommendations?',
    title: 'Phase 7: Insights Generation',
    context: {
      runId: ctx.runId,
      phase: 'insights-generation'
    }
  });

  const [insights, recommendations] = await Promise.all([
    ctx.task(generateInsightsTask, {
      coverageQuantification,
      messagePullThrough,
      sentimentAnalysis,
      shareOfVoice,
      qualityAssessment,
      trendAnalysis
    }),
    ctx.task(developRecommendationsTask, {
      messagePullThrough,
      sentimentAnalysis,
      shareOfVoice,
      qualityAssessment,
      trendAnalysis
    })
  ]);

  // Phase 8: Report Compilation
  await ctx.breakpoint({
    question: 'Insights generated. Compile analysis report?',
    title: 'Phase 8: Report Compilation',
    context: {
      runId: ctx.runId,
      phase: 'report-compilation',
      targetQuality
    }
  });

  const analysisReport = await ctx.task(compileAnalysisReportTask, {
    coverageQuantification,
    messagePullThrough,
    sentimentAnalysis,
    shareOfVoice,
    qualityAssessment,
    trendAnalysis,
    insights,
    recommendations,
    targetQuality
  });

  const quality = analysisReport.qualityScore;

  if (quality >= targetQuality) {
    return {
      success: true,
      analysisReport: {
        executiveSummary: analysisReport.executiveSummary,
        coverageQuantification,
        messagePullThrough,
        sentimentAnalysis,
        shareOfVoice,
        qualityAssessment,
        trendAnalysis
      },
      insights: insights.insights,
      recommendations: recommendations.recommendations,
      quality,
      targetQuality,
      metadata: {
        processId: 'specializations/domains/business/public-relations/media-coverage-analysis',
        timestamp: ctx.now(),
        analysisScope,
        coverageItems: coverageQuantification.totalItems
      }
    };
  } else {
    return {
      success: false,
      qualityGateFailed: true,
      quality,
      targetQuality,
      gaps: analysisReport.gaps,
      recommendations: analysisReport.improvementRecommendations,
      metadata: {
        processId: 'specializations/domains/business/public-relations/media-coverage-analysis',
        timestamp: ctx.now()
      }
    };
  }
}

// Task Definitions

export const quantifyCoverageTask = defineTask('quantify-coverage', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Quantify Coverage',
  agent: {
    name: 'coverage-quantifier',
    prompt: {
      role: 'Media analyst quantifying coverage metrics',
      task: 'Quantify media coverage volume and reach',
      context: args,
      instructions: [
        'Count total coverage items',
        'Calculate total reach/impressions',
        'Break down by media type (print, broadcast, online)',
        'Break down by outlet tier',
        'Break down by geography',
        'Calculate coverage over time',
        'Identify peak coverage periods',
        'Compare to previous periods'
      ],
      outputFormat: 'JSON with totalItems, totalReach, byMediaType, byOutletTier, byGeography, overTime, peakPeriods, periodComparison'
    },
    outputSchema: {
      type: 'object',
      required: ['totalItems', 'totalReach', 'byMediaType'],
      properties: {
        totalItems: { type: 'number' },
        totalReach: { type: 'number' },
        byMediaType: { type: 'object' },
        byOutletTier: { type: 'object' },
        byGeography: { type: 'object' },
        overTime: { type: 'array', items: { type: 'object' } },
        peakPeriods: { type: 'array', items: { type: 'object' } },
        periodComparison: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'coverage-quantification']
}));

export const analyzeMessagePullThroughTask = defineTask('analyze-message-pull-through', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Message Pull-Through',
  agent: {
    name: 'message-analyzer',
    prompt: {
      role: 'Message analysis specialist measuring pull-through',
      task: 'Analyze message pull-through in media coverage',
      context: args,
      instructions: [
        'Map coverage to key messages',
        'Calculate pull-through rate per message',
        'Identify most effective messages',
        'Identify messages not gaining traction',
        'Analyze spokesperson quote usage',
        'Assess message accuracy and context',
        'Identify message distortion or misinterpretation',
        'Compare pull-through by outlet type'
      ],
      outputFormat: 'JSON with messagePullThrough array (message, rate, volume), overallRate, topMessages, lowPerformers, spokespersonQuotes, accuracyAssessment, distortions, byOutletType'
    },
    outputSchema: {
      type: 'object',
      required: ['messagePullThrough', 'overallRate'],
      properties: {
        messagePullThrough: { type: 'array', items: { type: 'object' } },
        overallRate: { type: 'number' },
        topMessages: { type: 'array', items: { type: 'object' } },
        lowPerformers: { type: 'array', items: { type: 'object' } },
        spokespersonQuotes: { type: 'object' },
        accuracyAssessment: { type: 'object' },
        distortions: { type: 'array', items: { type: 'object' } },
        byOutletType: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'message-pull-through']
}));

export const analyzeSentimentTask = defineTask('analyze-sentiment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Sentiment',
  agent: {
    name: 'sentiment-analyzer',
    prompt: {
      role: 'Sentiment analysis specialist',
      task: 'Analyze sentiment in media coverage',
      context: args,
      instructions: [
        'Classify coverage sentiment (positive, neutral, negative)',
        'Calculate sentiment distribution',
        'Analyze sentiment by topic',
        'Analyze sentiment by outlet type',
        'Track sentiment over time',
        'Identify sentiment drivers',
        'Flag highly negative coverage',
        'Compare sentiment to benchmarks'
      ],
      outputFormat: 'JSON with sentimentDistribution, byTopic, byOutletType, overTime, sentimentDrivers, highlyNegative, benchmarkComparison'
    },
    outputSchema: {
      type: 'object',
      required: ['sentimentDistribution', 'overTime'],
      properties: {
        sentimentDistribution: { type: 'object' },
        byTopic: { type: 'object' },
        byOutletType: { type: 'object' },
        overTime: { type: 'array', items: { type: 'object' } },
        sentimentDrivers: { type: 'array', items: { type: 'object' } },
        highlyNegative: { type: 'array', items: { type: 'object' } },
        benchmarkComparison: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'sentiment-analysis']
}));

export const analyzeShareOfVoiceTask = defineTask('analyze-share-of-voice', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Share of Voice',
  agent: {
    name: 'sov-analyzer',
    prompt: {
      role: 'Competitive media analyst calculating share of voice',
      task: 'Analyze share of voice vs. competitors',
      context: args,
      instructions: [
        'Calculate overall share of voice',
        'Calculate SOV by media type',
        'Calculate SOV by topic/issue',
        'Calculate SOV by geography',
        'Track SOV over time',
        'Identify SOV gains and losses',
        'Analyze competitor coverage themes',
        'Identify competitive whitespace'
      ],
      outputFormat: 'JSON with overallSov, byMediaType, byTopic, byGeography, overTime, gainsAndLosses, competitorThemes, whitespace'
    },
    outputSchema: {
      type: 'object',
      required: ['overallSov', 'byTopic', 'overTime'],
      properties: {
        overallSov: { type: 'object' },
        byMediaType: { type: 'object' },
        byTopic: { type: 'object' },
        byGeography: { type: 'object' },
        overTime: { type: 'array', items: { type: 'object' } },
        gainsAndLosses: { type: 'object' },
        competitorThemes: { type: 'object' },
        whitespace: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'share-of-voice']
}));

export const assessCoverageQualityTask = defineTask('assess-coverage-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess Coverage Quality',
  agent: {
    name: 'quality-assessor',
    prompt: {
      role: 'Media quality analyst assessing coverage',
      task: 'Assess quality of media coverage',
      context: args,
      instructions: [
        'Assess prominence and placement',
        'Evaluate headline quality',
        'Assess visual/multimedia inclusion',
        'Evaluate source credibility',
        'Assess story depth and context',
        'Evaluate spokesperson treatment',
        'Assess exclusive vs. wire coverage',
        'Calculate quality score'
      ],
      outputFormat: 'JSON with prominenceScore, headlineQuality, multimediaInclusion, sourceCredibility, storyDepth, spokespersonTreatment, exclusiveRatio, overallQualityScore'
    },
    outputSchema: {
      type: 'object',
      required: ['prominenceScore', 'overallQualityScore'],
      properties: {
        prominenceScore: { type: 'object' },
        headlineQuality: { type: 'object' },
        multimediaInclusion: { type: 'object' },
        sourceCredibility: { type: 'object' },
        storyDepth: { type: 'object' },
        spokespersonTreatment: { type: 'object' },
        exclusiveRatio: { type: 'object' },
        overallQualityScore: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'quality-assessment']
}));

export const analyzeTrendsTask = defineTask('analyze-trends', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Trends',
  agent: {
    name: 'trend-analyzer',
    prompt: {
      role: 'Media trends analyst identifying patterns',
      task: 'Analyze coverage trends and patterns',
      context: args,
      instructions: [
        'Identify coverage volume trends',
        'Analyze sentiment trend direction',
        'Track SOV trend movement',
        'Identify emerging topics',
        'Detect narrative shifts',
        'Identify journalist/outlet trends',
        'Assess seasonal patterns',
        'Project future trends'
      ],
      outputFormat: 'JSON with volumeTrends, sentimentTrends, sovTrends, emergingTopics, narrativeShifts, journalistTrends, seasonalPatterns, futureProjections'
    },
    outputSchema: {
      type: 'object',
      required: ['volumeTrends', 'sentimentTrends', 'emergingTopics'],
      properties: {
        volumeTrends: { type: 'object' },
        sentimentTrends: { type: 'object' },
        sovTrends: { type: 'object' },
        emergingTopics: { type: 'array', items: { type: 'object' } },
        narrativeShifts: { type: 'array', items: { type: 'object' } },
        journalistTrends: { type: 'array', items: { type: 'object' } },
        seasonalPatterns: { type: 'object' },
        futureProjections: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'trend-analysis']
}));

export const generateInsightsTask = defineTask('generate-insights', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate Insights',
  agent: {
    name: 'insights-generator',
    prompt: {
      role: 'Strategic communications analyst generating insights',
      task: 'Generate actionable insights from coverage analysis',
      context: args,
      instructions: [
        'Synthesize key findings across metrics',
        'Identify significant patterns and anomalies',
        'Explain performance drivers',
        'Identify success factors',
        'Identify areas of concern',
        'Connect coverage to business context',
        'Prioritize insights by impact',
        'Frame insights for different audiences'
      ],
      outputFormat: 'JSON with insights array (insight, evidence, significance, audience), keyFindings, successFactors, concerns, businessContext'
    },
    outputSchema: {
      type: 'object',
      required: ['insights', 'keyFindings'],
      properties: {
        insights: { type: 'array', items: { type: 'object' } },
        keyFindings: { type: 'array', items: { type: 'object' } },
        successFactors: { type: 'array', items: { type: 'object' } },
        concerns: { type: 'array', items: { type: 'object' } },
        businessContext: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'insights-generation']
}));

export const developRecommendationsTask = defineTask('develop-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Recommendations',
  agent: {
    name: 'recommendations-developer',
    prompt: {
      role: 'PR strategy consultant developing recommendations',
      task: 'Develop actionable recommendations from analysis',
      context: args,
      instructions: [
        'Recommend messaging adjustments',
        'Suggest media targeting changes',
        'Recommend spokesperson optimization',
        'Suggest competitive response strategies',
        'Recommend content and story approaches',
        'Suggest measurement improvements',
        'Prioritize recommendations by impact',
        'Define success metrics for recommendations'
      ],
      outputFormat: 'JSON with recommendations array (recommendation, rationale, priority, expectedImpact, successMetrics), messagingAdjustments, targetingChanges, spokespersonOptimization, competitiveResponse'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations'],
      properties: {
        recommendations: { type: 'array', items: { type: 'object' } },
        messagingAdjustments: { type: 'array', items: { type: 'object' } },
        targetingChanges: { type: 'array', items: { type: 'object' } },
        spokespersonOptimization: { type: 'array', items: { type: 'object' } },
        competitiveResponse: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'recommendations']
}));

export const compileAnalysisReportTask = defineTask('compile-analysis-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compile Analysis Report',
  agent: {
    name: 'report-compiler',
    prompt: {
      role: 'PR reporting specialist compiling analysis',
      task: 'Compile comprehensive media coverage analysis report',
      context: args,
      instructions: [
        'Create executive summary',
        'Compile quantitative findings',
        'Compile qualitative findings',
        'Integrate insights and recommendations',
        'Create data visualizations narrative',
        'Add methodology notes',
        'Include appendices and data tables',
        'Assess report quality'
      ],
      outputFormat: 'JSON with executiveSummary, quantitativeFindings, qualitativeFindings, insightsRecommendations, visualizations, methodology, appendices, qualityScore, gaps, improvementRecommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['executiveSummary', 'qualityScore'],
      properties: {
        executiveSummary: { type: 'object' },
        quantitativeFindings: { type: 'object' },
        qualitativeFindings: { type: 'object' },
        insightsRecommendations: { type: 'object' },
        visualizations: { type: 'array', items: { type: 'object' } },
        methodology: { type: 'object' },
        appendices: { type: 'array', items: { type: 'object' } },
        qualityScore: { type: 'number', minimum: 0, maximum: 100 },
        gaps: { type: 'array', items: { type: 'string' } },
        improvementRecommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'report-compilation']
}));
