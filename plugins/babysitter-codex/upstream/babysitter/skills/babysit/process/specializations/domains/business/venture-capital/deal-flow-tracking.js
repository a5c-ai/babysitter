/**
 * @process venture-capital/deal-flow-tracking
 * @description Systematic tracking of investment opportunities through the funnel including initial contact, meetings, diligence stages, and outcomes using relationship intelligence tools
 * @inputs { fundName: string, pipelineData: object, trackingPeriod: string, crmIntegration: boolean }
 * @outputs { success: boolean, pipelineMetrics: object, stageAnalysis: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    fundName,
    pipelineData = {},
    trackingPeriod = 'quarterly',
    crmIntegration = true,
    outputDir = 'deal-flow-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Pipeline Data Extraction
  ctx.log('info', 'Extracting deal pipeline data from CRM');
  const pipelineExtraction = await ctx.task(pipelineDataExtractionTask, {
    fundName,
    pipelineData,
    crmIntegration,
    outputDir
  });

  if (!pipelineExtraction.success) {
    return {
      success: false,
      error: 'Pipeline data extraction failed',
      details: pipelineExtraction,
      metadata: { processId: 'venture-capital/deal-flow-tracking', timestamp: startTime }
    };
  }

  artifacts.push(...pipelineExtraction.artifacts);

  // Task 2: Stage Conversion Analysis
  ctx.log('info', 'Analyzing conversion rates across pipeline stages');
  const conversionAnalysis = await ctx.task(stageConversionAnalysisTask, {
    pipelineData: pipelineExtraction.deals,
    trackingPeriod,
    outputDir
  });

  artifacts.push(...conversionAnalysis.artifacts);

  // Task 3: Source Attribution Analysis
  ctx.log('info', 'Analyzing deal source attribution and quality');
  const sourceAnalysis = await ctx.task(sourceAttributionTask, {
    deals: pipelineExtraction.deals,
    trackingPeriod,
    outputDir
  });

  artifacts.push(...sourceAnalysis.artifacts);

  // Task 4: Velocity and Timing Analysis
  ctx.log('info', 'Analyzing deal velocity and timing metrics');
  const velocityAnalysis = await ctx.task(velocityAnalysisTask, {
    deals: pipelineExtraction.deals,
    conversionData: conversionAnalysis,
    outputDir
  });

  artifacts.push(...velocityAnalysis.artifacts);

  // Task 5: Relationship Intelligence Mapping
  ctx.log('info', 'Mapping relationship networks and touchpoints');
  const relationshipMapping = await ctx.task(relationshipMappingTask, {
    deals: pipelineExtraction.deals,
    crmIntegration,
    outputDir
  });

  artifacts.push(...relationshipMapping.artifacts);

  // Task 6: Pipeline Health Assessment
  ctx.log('info', 'Assessing overall pipeline health');
  const healthAssessment = await ctx.task(pipelineHealthTask, {
    conversionAnalysis,
    sourceAnalysis,
    velocityAnalysis,
    relationshipMapping,
    outputDir
  });

  artifacts.push(...healthAssessment.artifacts);

  // Breakpoint: Review pipeline analysis
  await ctx.breakpoint({
    question: `Deal flow analysis complete for ${fundName}. Pipeline health score: ${healthAssessment.healthScore}/100. Review findings?`,
    title: 'Deal Flow Tracking Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        totalDeals: pipelineExtraction.totalDeals,
        activeDeals: pipelineExtraction.activeDeals,
        conversionRate: conversionAnalysis.overallConversionRate,
        averageVelocity: velocityAnalysis.averageDaysToClose,
        healthScore: healthAssessment.healthScore
      }
    }
  });

  // Task 7: Generate Pipeline Report
  ctx.log('info', 'Generating deal flow report');
  const pipelineReport = await ctx.task(pipelineReportTask, {
    fundName,
    pipelineExtraction,
    conversionAnalysis,
    sourceAnalysis,
    velocityAnalysis,
    relationshipMapping,
    healthAssessment,
    trackingPeriod,
    outputDir
  });

  artifacts.push(...pipelineReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    pipelineMetrics: {
      totalDeals: pipelineExtraction.totalDeals,
      activeDeals: pipelineExtraction.activeDeals,
      closedDeals: pipelineExtraction.closedDeals,
      passedDeals: pipelineExtraction.passedDeals
    },
    stageAnalysis: {
      conversionRates: conversionAnalysis.stageConversions,
      overallConversion: conversionAnalysis.overallConversionRate,
      bottlenecks: conversionAnalysis.bottlenecks
    },
    sourcePerformance: sourceAnalysis.sourceRankings,
    velocityMetrics: {
      averageDaysToClose: velocityAnalysis.averageDaysToClose,
      medianDaysToClose: velocityAnalysis.medianDaysToClose,
      velocityByStage: velocityAnalysis.stageVelocity
    },
    healthScore: healthAssessment.healthScore,
    recommendations: healthAssessment.recommendations,
    artifacts,
    duration,
    metadata: {
      processId: 'venture-capital/deal-flow-tracking',
      timestamp: startTime,
      fundName,
      trackingPeriod
    }
  };
}

// Task 1: Pipeline Data Extraction
export const pipelineDataExtractionTask = defineTask('pipeline-data-extraction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Extract and normalize deal pipeline data',
  agent: {
    name: 'crm-data-extractor',
    prompt: {
      role: 'VC operations analyst',
      task: 'Extract and normalize deal pipeline data from CRM and tracking systems',
      context: args,
      instructions: [
        'Connect to CRM system and extract all deal records',
        'Normalize deal data across different entry formats',
        'Categorize deals by current pipeline stage',
        'Extract all contact and meeting history',
        'Identify deal sources and referral chains',
        'Calculate days in current stage for each deal',
        'Flag stale deals requiring attention',
        'Export normalized dataset for analysis'
      ],
      outputFormat: 'JSON with deals array, stage counts, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'deals', 'totalDeals', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        deals: { type: 'array' },
        totalDeals: { type: 'number' },
        activeDeals: { type: 'number' },
        closedDeals: { type: 'number' },
        passedDeals: { type: 'number' },
        stageBreakdown: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'deal-flow', 'crm']
}));

// Task 2: Stage Conversion Analysis
export const stageConversionAnalysisTask = defineTask('stage-conversion-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze pipeline stage conversion rates',
  agent: {
    name: 'conversion-analyst',
    prompt: {
      role: 'VC analytics specialist',
      task: 'Analyze conversion rates between pipeline stages',
      context: args,
      instructions: [
        'Calculate conversion rates between each pipeline stage',
        'Identify bottleneck stages with lowest conversion',
        'Compare conversion rates across time periods',
        'Analyze conversion by deal size and sector',
        'Calculate win rates and pass rates',
        'Identify patterns in deals that convert vs pass',
        'Generate conversion funnel visualization data',
        'Provide stage-specific recommendations'
      ],
      outputFormat: 'JSON with stage conversions, bottlenecks, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['stageConversions', 'overallConversionRate', 'artifacts'],
      properties: {
        stageConversions: { type: 'object' },
        overallConversionRate: { type: 'number' },
        bottlenecks: { type: 'array', items: { type: 'string' } },
        conversionBySegment: { type: 'object' },
        trends: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'conversion', 'analytics']
}));

// Task 3: Source Attribution Analysis
export const sourceAttributionTask = defineTask('source-attribution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze deal source performance',
  agent: {
    name: 'source-analyst',
    prompt: {
      role: 'VC business development analyst',
      task: 'Analyze deal sources and their quality metrics',
      context: args,
      instructions: [
        'Categorize all deal sources (referrals, outbound, inbound, events)',
        'Calculate volume and conversion by source',
        'Identify highest performing referral partners',
        'Analyze source quality by deal outcome',
        'Calculate cost per deal by source',
        'Identify underperforming channels',
        'Track proprietary vs competitive deal ratio',
        'Recommend source optimization strategies'
      ],
      outputFormat: 'JSON with source rankings, metrics, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['sourceRankings', 'sourceMetrics', 'artifacts'],
      properties: {
        sourceRankings: { type: 'array' },
        sourceMetrics: { type: 'object' },
        topReferrers: { type: 'array' },
        proprietaryDealRatio: { type: 'number' },
        channelRecommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'source-attribution', 'business-development']
}));

// Task 4: Velocity and Timing Analysis
export const velocityAnalysisTask = defineTask('velocity-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze deal velocity and timing',
  agent: {
    name: 'velocity-analyst',
    prompt: {
      role: 'VC operations analyst',
      task: 'Analyze deal velocity and time-in-stage metrics',
      context: args,
      instructions: [
        'Calculate average and median days in each stage',
        'Identify deals exceeding normal stage duration',
        'Analyze velocity trends over time',
        'Compare velocity by deal type and size',
        'Calculate time from first contact to close',
        'Identify velocity patterns in won vs lost deals',
        'Flag aging deals requiring action',
        'Recommend process improvements for velocity'
      ],
      outputFormat: 'JSON with velocity metrics, aging deals, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['averageDaysToClose', 'stageVelocity', 'artifacts'],
      properties: {
        averageDaysToClose: { type: 'number' },
        medianDaysToClose: { type: 'number' },
        stageVelocity: { type: 'object' },
        agingDeals: { type: 'array' },
        velocityTrends: { type: 'object' },
        processRecommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'velocity', 'timing']
}));

// Task 5: Relationship Intelligence Mapping
export const relationshipMappingTask = defineTask('relationship-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map relationship networks and touchpoints',
  agent: {
    name: 'relationship-analyst',
    prompt: {
      role: 'VC relationship intelligence specialist',
      task: 'Map and analyze relationship networks driving deal flow',
      context: args,
      instructions: [
        'Map relationship paths to each deal',
        'Identify most connected team members',
        'Analyze touchpoint frequency and quality',
        'Calculate relationship strength scores',
        'Identify warm introduction opportunities',
        'Map co-investor relationship networks',
        'Analyze advisor and board member connections',
        'Recommend relationship development priorities'
      ],
      outputFormat: 'JSON with relationship maps, scores, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['relationshipNetwork', 'strengthScores', 'artifacts'],
      properties: {
        relationshipNetwork: { type: 'object' },
        strengthScores: { type: 'object' },
        topConnectors: { type: 'array' },
        warmIntroOpportunities: { type: 'array' },
        developmentPriorities: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'relationships', 'networking']
}));

// Task 6: Pipeline Health Assessment
export const pipelineHealthTask = defineTask('pipeline-health', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess overall pipeline health',
  agent: {
    name: 'pipeline-health-assessor',
    prompt: {
      role: 'VC portfolio manager',
      task: 'Assess overall pipeline health and provide recommendations',
      context: args,
      instructions: [
        'Calculate overall pipeline health score (0-100)',
        'Assess pipeline coverage relative to targets',
        'Evaluate stage distribution balance',
        'Analyze deal quality indicators',
        'Identify pipeline gaps and risks',
        'Compare to historical benchmarks',
        'Generate priority action items',
        'Create executive summary of pipeline status'
      ],
      outputFormat: 'JSON with health score, gaps, recommendations, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['healthScore', 'recommendations', 'artifacts'],
      properties: {
        healthScore: { type: 'number', minimum: 0, maximum: 100 },
        pipelineCoverage: { type: 'number' },
        stageBalance: { type: 'object' },
        qualityIndicators: { type: 'object' },
        gaps: { type: 'array', items: { type: 'string' } },
        risks: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'pipeline-health', 'assessment']
}));

// Task 7: Pipeline Report Generation
export const pipelineReportTask = defineTask('pipeline-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate deal flow report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'VC operations specialist',
      task: 'Generate comprehensive deal flow and pipeline report',
      context: args,
      instructions: [
        'Create executive summary of pipeline status',
        'Include key metrics dashboard data',
        'Document conversion funnel analysis',
        'Present source performance rankings',
        'Show velocity and timing analysis',
        'Include relationship intelligence highlights',
        'List priority action items',
        'Format as professional LP-ready report'
      ],
      outputFormat: 'JSON with report path, key findings, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'keyFindings', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        executiveSummary: { type: 'string' },
        dashboardData: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'reporting', 'documentation']
}));
