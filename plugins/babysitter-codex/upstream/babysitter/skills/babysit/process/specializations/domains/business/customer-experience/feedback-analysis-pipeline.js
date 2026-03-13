/**
 * @process customer-experience/feedback-analysis-pipeline
 * @description Automated process for aggregating feedback from multiple channels, applying sentiment analysis, and prioritizing improvements
 * @inputs { feedbackSources: array, feedbackData: array, analysisConfig: object, prioritizationRules: object }
 * @outputs { success: boolean, aggregatedFeedback: object, sentimentAnalysis: object, prioritizedImprovements: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    feedbackSources = [],
    feedbackData = [],
    analysisConfig = {},
    prioritizationRules = {},
    outputDir = 'feedback-analysis-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Customer Feedback Analysis Pipeline');

  // ============================================================================
  // PHASE 1: FEEDBACK AGGREGATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Aggregating feedback from all sources');
  const feedbackAggregation = await ctx.task(feedbackAggregationTask, {
    feedbackSources,
    feedbackData,
    outputDir
  });

  artifacts.push(...feedbackAggregation.artifacts);

  // ============================================================================
  // PHASE 2: DATA CLEANING AND NORMALIZATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Cleaning and normalizing feedback data');
  const dataCleaning = await ctx.task(dataCleaningTask, {
    feedbackAggregation,
    analysisConfig,
    outputDir
  });

  artifacts.push(...dataCleaning.artifacts);

  // ============================================================================
  // PHASE 3: SENTIMENT ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Performing sentiment analysis');
  const sentimentAnalysis = await ctx.task(sentimentAnalysisTask, {
    dataCleaning,
    analysisConfig,
    outputDir
  });

  artifacts.push(...sentimentAnalysis.artifacts);

  // ============================================================================
  // PHASE 4: THEME EXTRACTION
  // ============================================================================

  ctx.log('info', 'Phase 4: Extracting themes and topics');
  const themeExtraction = await ctx.task(themeExtractionTask, {
    dataCleaning,
    sentimentAnalysis,
    outputDir
  });

  artifacts.push(...themeExtraction.artifacts);

  // ============================================================================
  // PHASE 5: CATEGORIZATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Categorizing feedback');
  const categorization = await ctx.task(categorizationTask, {
    dataCleaning,
    themeExtraction,
    analysisConfig,
    outputDir
  });

  artifacts.push(...categorization.artifacts);

  // ============================================================================
  // PHASE 6: IMPACT ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 6: Assessing feedback impact');
  const impactAssessment = await ctx.task(impactAssessmentTask, {
    categorization,
    sentimentAnalysis,
    themeExtraction,
    outputDir
  });

  artifacts.push(...impactAssessment.artifacts);

  // ============================================================================
  // PHASE 7: PRIORITIZATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Prioritizing improvements');
  const prioritization = await ctx.task(prioritizationTask, {
    impactAssessment,
    categorization,
    sentimentAnalysis,
    prioritizationRules,
    outputDir
  });

  artifacts.push(...prioritization.artifacts);

  // ============================================================================
  // PHASE 8: REPORT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating analysis report');
  const analysisReport = await ctx.task(analysisReportTask, {
    feedbackAggregation,
    sentimentAnalysis,
    themeExtraction,
    categorization,
    impactAssessment,
    prioritization,
    outputDir
  });

  artifacts.push(...analysisReport.artifacts);

  const feedbackCount = feedbackAggregation.totalFeedback;
  const overallSentiment = sentimentAnalysis.overallSentiment;

  await ctx.breakpoint({
    question: `Feedback analysis complete. Total feedback: ${feedbackCount}. Overall sentiment: ${overallSentiment}. Themes identified: ${themeExtraction.themes?.length || 0}. Priority improvements: ${prioritization.topPriorities?.length || 0}. Review and distribute?`,
    title: 'Feedback Analysis Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        feedbackCount,
        overallSentiment,
        sourcesAnalyzed: feedbackSources.length,
        themesIdentified: themeExtraction.themes?.length || 0,
        categoriesFound: Object.keys(categorization.categories || {}).length,
        priorityImprovements: prioritization.topPriorities?.length || 0
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    feedbackCount,
    overallSentiment,
    aggregatedFeedback: {
      total: feedbackAggregation.totalFeedback,
      bySources: feedbackAggregation.bySource,
      dateRange: feedbackAggregation.dateRange
    },
    sentimentAnalysis: {
      overall: sentimentAnalysis.overallSentiment,
      distribution: sentimentAnalysis.distribution,
      bySource: sentimentAnalysis.bySource,
      trends: sentimentAnalysis.trends
    },
    themes: themeExtraction.themes,
    categories: categorization.categories,
    prioritizedImprovements: prioritization.topPriorities,
    impactAssessment: impactAssessment.impacts,
    report: analysisReport.report,
    artifacts,
    duration,
    metadata: {
      processId: 'customer-experience/feedback-analysis-pipeline',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const feedbackAggregationTask = defineTask('feedback-aggregation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Aggregate feedback from all sources',
  agent: {
    name: 'feedback-aggregator',
    prompt: {
      role: 'feedback data specialist',
      task: 'Aggregate customer feedback from multiple sources into unified dataset',
      context: args,
      instructions: [
        'Connect to all feedback sources',
        'Extract feedback from support tickets',
        'Extract feedback from surveys',
        'Extract feedback from social media',
        'Extract feedback from reviews',
        'Extract feedback from in-app feedback',
        'Normalize data structure',
        'Deduplicate feedback items',
        'Generate aggregation summary'
      ],
      outputFormat: 'JSON with totalFeedback, bySource, dateRange, dataStructure, deduplication, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalFeedback', 'bySource', 'artifacts'],
      properties: {
        totalFeedback: { type: 'number' },
        bySource: { type: 'object' },
        dateRange: { type: 'object' },
        dataStructure: { type: 'object' },
        deduplication: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'feedback-analysis', 'aggregation']
}));

export const dataCleaningTask = defineTask('data-cleaning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Clean and normalize feedback data',
  agent: {
    name: 'data-cleaner',
    prompt: {
      role: 'data quality specialist',
      task: 'Clean and normalize feedback data for analysis',
      context: args,
      instructions: [
        'Remove spam and bot responses',
        'Normalize text encoding',
        'Standardize date formats',
        'Handle missing values',
        'Remove PII if configured',
        'Correct common typos',
        'Standardize language',
        'Validate data quality',
        'Generate cleaning report'
      ],
      outputFormat: 'JSON with cleanedData, removedItems, qualityMetrics, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['cleanedData', 'qualityMetrics', 'artifacts'],
      properties: {
        cleanedData: { type: 'object' },
        removedItems: { type: 'number' },
        qualityMetrics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'feedback-analysis', 'cleaning']
}));

export const sentimentAnalysisTask = defineTask('sentiment-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform sentiment analysis',
  agent: {
    name: 'sentiment-analyst',
    prompt: {
      role: 'sentiment analysis specialist',
      task: 'Analyze sentiment across all feedback items',
      context: args,
      instructions: [
        'Apply sentiment classification (positive, neutral, negative)',
        'Calculate sentiment scores',
        'Identify emotion categories',
        'Analyze sentiment by source',
        'Analyze sentiment by topic',
        'Identify sentiment trends',
        'Flag high-emotion feedback',
        'Calculate confidence scores',
        'Generate sentiment report'
      ],
      outputFormat: 'JSON with overallSentiment, distribution, bySource, trends, emotions, confidence, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallSentiment', 'distribution', 'artifacts'],
      properties: {
        overallSentiment: { type: 'string', enum: ['positive', 'neutral', 'negative'] },
        distribution: { type: 'object' },
        bySource: { type: 'object' },
        trends: { type: 'object' },
        emotions: { type: 'object' },
        confidence: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'feedback-analysis', 'sentiment']
}));

export const themeExtractionTask = defineTask('theme-extraction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Extract themes and topics',
  agent: {
    name: 'theme-extractor',
    prompt: {
      role: 'text analytics specialist',
      task: 'Extract key themes and topics from feedback',
      context: args,
      instructions: [
        'Apply topic modeling',
        'Extract key themes',
        'Identify recurring patterns',
        'Extract feature mentions',
        'Identify pain points',
        'Extract praise themes',
        'Identify emerging themes',
        'Calculate theme frequency',
        'Generate theme analysis report'
      ],
      outputFormat: 'JSON with themes, topics, painPoints, praise, emerging, frequency, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['themes', 'topics', 'artifacts'],
      properties: {
        themes: { type: 'array', items: { type: 'object' } },
        topics: { type: 'array', items: { type: 'object' } },
        painPoints: { type: 'array', items: { type: 'object' } },
        praise: { type: 'array', items: { type: 'object' } },
        emerging: { type: 'array', items: { type: 'object' } },
        frequency: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'feedback-analysis', 'themes']
}));

export const categorizationTask = defineTask('categorization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Categorize feedback',
  agent: {
    name: 'feedback-categorizer',
    prompt: {
      role: 'feedback categorization specialist',
      task: 'Categorize feedback into actionable categories',
      context: args,
      instructions: [
        'Apply category taxonomy',
        'Categorize by product area',
        'Categorize by feedback type',
        'Categorize by urgency',
        'Categorize by customer segment',
        'Apply multi-label classification',
        'Identify uncategorized items',
        'Calculate category distribution',
        'Generate categorization report'
      ],
      outputFormat: 'JSON with categories, byProductArea, byType, byUrgency, bySegment, distribution, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['categories', 'distribution', 'artifacts'],
      properties: {
        categories: { type: 'object' },
        byProductArea: { type: 'object' },
        byType: { type: 'object' },
        byUrgency: { type: 'object' },
        bySegment: { type: 'object' },
        distribution: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'feedback-analysis', 'categorization']
}));

export const impactAssessmentTask = defineTask('impact-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess feedback impact',
  agent: {
    name: 'impact-assessor',
    prompt: {
      role: 'customer impact analyst',
      task: 'Assess business impact of feedback themes',
      context: args,
      instructions: [
        'Calculate theme frequency impact',
        'Assess sentiment intensity',
        'Correlate with customer value',
        'Estimate churn risk impact',
        'Assess revenue impact',
        'Calculate reach and scope',
        'Identify strategic implications',
        'Prioritize by impact score',
        'Generate impact assessment report'
      ],
      outputFormat: 'JSON with impacts, frequencyImpact, sentimentImpact, churnRisk, revenueImpact, strategic, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['impacts', 'artifacts'],
      properties: {
        impacts: { type: 'array', items: { type: 'object' } },
        frequencyImpact: { type: 'object' },
        sentimentImpact: { type: 'object' },
        churnRisk: { type: 'object' },
        revenueImpact: { type: 'object' },
        strategic: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'feedback-analysis', 'impact']
}));

export const prioritizationTask = defineTask('prioritization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prioritize improvements',
  agent: {
    name: 'prioritization-engine',
    prompt: {
      role: 'improvement prioritization specialist',
      task: 'Prioritize improvement opportunities from feedback analysis',
      context: args,
      instructions: [
        'Apply prioritization framework',
        'Score by impact and effort',
        'Consider strategic alignment',
        'Factor in customer segment value',
        'Identify quick wins',
        'Create prioritized backlog',
        'Group related improvements',
        'Document prioritization rationale',
        'Generate prioritization report'
      ],
      outputFormat: 'JSON with topPriorities, scoredItems, quickWins, backlog, rationale, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['topPriorities', 'scoredItems', 'artifacts'],
      properties: {
        topPriorities: { type: 'array', items: { type: 'object' } },
        scoredItems: { type: 'array', items: { type: 'object' } },
        quickWins: { type: 'array', items: { type: 'object' } },
        backlog: { type: 'array', items: { type: 'object' } },
        rationale: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'feedback-analysis', 'prioritization']
}));

export const analysisReportTask = defineTask('analysis-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate analysis report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'feedback analysis reporter',
      task: 'Generate comprehensive feedback analysis report',
      context: args,
      instructions: [
        'Create executive summary',
        'Present sentiment overview',
        'Highlight key themes',
        'Show category breakdown',
        'Present impact assessment',
        'List prioritized improvements',
        'Include recommendations',
        'Create visualizations',
        'Generate comprehensive report'
      ],
      outputFormat: 'JSON with report, executiveSummary, visualizations, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['report', 'executiveSummary', 'artifacts'],
      properties: {
        report: { type: 'object' },
        executiveSummary: { type: 'string' },
        visualizations: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'feedback-analysis', 'reporting']
}));
