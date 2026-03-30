/**
 * @process customer-experience/csat-collection
 * @description Process for collecting customer satisfaction feedback at key touchpoints and generating actionable insights
 * @inputs { touchpoints: array, surveyConfig: object, responseData: array, benchmarks: object }
 * @outputs { success: boolean, csatMetrics: object, touchpointAnalysis: object, insights: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    touchpoints = [],
    surveyConfig = {},
    responseData = [],
    benchmarks = {},
    outputDir = 'csat-output',
    targetCSAT = 85
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting CSAT Collection and Analysis Process');

  // ============================================================================
  // PHASE 1: TOUCHPOINT MAPPING
  // ============================================================================

  ctx.log('info', 'Phase 1: Mapping customer touchpoints');
  const touchpointMapping = await ctx.task(touchpointMappingTask, {
    touchpoints,
    surveyConfig,
    outputDir
  });

  artifacts.push(...touchpointMapping.artifacts);

  // ============================================================================
  // PHASE 2: SURVEY CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Configuring CSAT surveys');
  const surveyConfiguration = await ctx.task(surveyConfigurationTask, {
    touchpointMapping,
    surveyConfig,
    outputDir
  });

  artifacts.push(...surveyConfiguration.artifacts);

  // ============================================================================
  // PHASE 3: RESPONSE COLLECTION
  // ============================================================================

  ctx.log('info', 'Phase 3: Analyzing collected responses');
  const responseCollection = await ctx.task(responseCollectionTask, {
    responseData,
    touchpointMapping,
    outputDir
  });

  artifacts.push(...responseCollection.artifacts);

  // ============================================================================
  // PHASE 4: CSAT CALCULATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Calculating CSAT metrics');
  const csatCalculation = await ctx.task(csatCalculationTask, {
    responseCollection,
    benchmarks,
    targetCSAT,
    outputDir
  });

  artifacts.push(...csatCalculation.artifacts);

  // ============================================================================
  // PHASE 5: TOUCHPOINT ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Analyzing touchpoint performance');
  const touchpointAnalysis = await ctx.task(touchpointAnalysisTask, {
    csatCalculation,
    touchpointMapping,
    responseCollection,
    outputDir
  });

  artifacts.push(...touchpointAnalysis.artifacts);

  // ============================================================================
  // PHASE 6: TREND ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Analyzing CSAT trends');
  const trendAnalysis = await ctx.task(trendAnalysisTask, {
    csatCalculation,
    touchpointAnalysis,
    benchmarks,
    outputDir
  });

  artifacts.push(...trendAnalysis.artifacts);

  // ============================================================================
  // PHASE 7: INSIGHT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Generating actionable insights');
  const insightGeneration = await ctx.task(insightGenerationTask, {
    csatCalculation,
    touchpointAnalysis,
    trendAnalysis,
    responseCollection,
    outputDir
  });

  artifacts.push(...insightGeneration.artifacts);

  // ============================================================================
  // PHASE 8: REPORT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating CSAT report');
  const csatReport = await ctx.task(csatReportTask, {
    csatCalculation,
    touchpointAnalysis,
    trendAnalysis,
    insightGeneration,
    benchmarks,
    outputDir
  });

  artifacts.push(...csatReport.artifacts);

  const overallCSAT = csatCalculation.overallCSAT;
  const targetMet = overallCSAT >= targetCSAT;

  await ctx.breakpoint({
    question: `CSAT analysis complete. Overall CSAT: ${overallCSAT}%. Target: ${targetCSAT}%. ${targetMet ? 'Target met!' : 'Below target.'} Touchpoints analyzed: ${touchpointAnalysis.touchpoints?.length || 0}. Review and distribute?`,
    title: 'CSAT Analysis Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        overallCSAT,
        targetMet,
        responseCount: responseCollection.totalResponses,
        touchpointsAnalyzed: touchpointAnalysis.touchpoints?.length || 0,
        insightsGenerated: insightGeneration.insights?.length || 0,
        topPerformingTouchpoint: touchpointAnalysis.topPerformer,
        lowestPerformingTouchpoint: touchpointAnalysis.lowestPerformer
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    overallCSAT,
    targetMet,
    csatMetrics: {
      overall: csatCalculation.overallCSAT,
      byTouchpoint: csatCalculation.byTouchpoint,
      byChannel: csatCalculation.byChannel,
      bySegment: csatCalculation.bySegment,
      distribution: csatCalculation.distribution
    },
    touchpointAnalysis: {
      touchpoints: touchpointAnalysis.touchpoints,
      topPerformer: touchpointAnalysis.topPerformer,
      lowestPerformer: touchpointAnalysis.lowestPerformer,
      improvements: touchpointAnalysis.improvements
    },
    trends: trendAnalysis.trends,
    insights: insightGeneration.insights,
    report: csatReport.report,
    artifacts,
    duration,
    metadata: {
      processId: 'customer-experience/csat-collection',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const touchpointMappingTask = defineTask('touchpoint-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map customer touchpoints',
  agent: {
    name: 'touchpoint-mapper',
    prompt: {
      role: 'customer journey specialist',
      task: 'Map customer touchpoints for CSAT collection',
      context: args,
      instructions: [
        'Identify key customer touchpoints',
        'Categorize touchpoints by journey stage',
        'Define touchpoint measurement criteria',
        'Map touchpoints to channels',
        'Identify survey trigger events',
        'Define optimal survey timing',
        'Set sampling rules per touchpoint',
        'Document touchpoint owners',
        'Generate touchpoint map'
      ],
      outputFormat: 'JSON with touchpoints, categories, triggers, timing, sampling, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['touchpoints', 'triggers', 'artifacts'],
      properties: {
        touchpoints: { type: 'array', items: { type: 'object' } },
        categories: { type: 'object' },
        triggers: { type: 'array', items: { type: 'object' } },
        timing: { type: 'object' },
        sampling: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'csat', 'touchpoints']
}));

export const surveyConfigurationTask = defineTask('survey-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure CSAT surveys',
  agent: {
    name: 'survey-configurator',
    prompt: {
      role: 'survey design specialist',
      task: 'Configure CSAT surveys for each touchpoint',
      context: args,
      instructions: [
        'Design CSAT scale (1-5 or 1-7)',
        'Create touchpoint-specific questions',
        'Design follow-up questions',
        'Configure survey delivery method',
        'Set up response routing',
        'Configure reminder logic',
        'Define survey expiration',
        'Set up real-time alerts',
        'Generate survey configuration'
      ],
      outputFormat: 'JSON with surveys, scale, questions, delivery, routing, alerts, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['surveys', 'scale', 'artifacts'],
      properties: {
        surveys: { type: 'array', items: { type: 'object' } },
        scale: { type: 'object' },
        questions: { type: 'array', items: { type: 'object' } },
        delivery: { type: 'object' },
        routing: { type: 'object' },
        alerts: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'csat', 'configuration']
}));

export const responseCollectionTask = defineTask('response-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze collected responses',
  agent: {
    name: 'response-collector',
    prompt: {
      role: 'survey response analyst',
      task: 'Analyze and organize collected CSAT responses',
      context: args,
      instructions: [
        'Validate response data quality',
        'Calculate response rates by touchpoint',
        'Organize responses by segment',
        'Identify incomplete responses',
        'Flag invalid or spam responses',
        'Calculate collection coverage',
        'Identify response patterns',
        'Document collection issues',
        'Generate collection summary'
      ],
      outputFormat: 'JSON with totalResponses, responseRates, segments, quality, coverage, patterns, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalResponses', 'responseRates', 'artifacts'],
      properties: {
        totalResponses: { type: 'number' },
        responseRates: { type: 'object' },
        segments: { type: 'object' },
        quality: { type: 'object' },
        coverage: { type: 'object' },
        patterns: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'csat', 'collection']
}));

export const csatCalculationTask = defineTask('csat-calculation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate CSAT metrics',
  agent: {
    name: 'csat-calculator',
    prompt: {
      role: 'CSAT metrics specialist',
      task: 'Calculate CSAT scores and metrics across dimensions',
      context: args,
      instructions: [
        'Calculate overall CSAT percentage',
        'Calculate CSAT by touchpoint',
        'Calculate CSAT by channel',
        'Calculate CSAT by customer segment',
        'Analyze score distribution',
        'Compare to benchmarks',
        'Calculate statistical confidence',
        'Identify outliers',
        'Generate CSAT metrics report'
      ],
      outputFormat: 'JSON with overallCSAT, byTouchpoint, byChannel, bySegment, distribution, benchmarkComparison, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallCSAT', 'byTouchpoint', 'artifacts'],
      properties: {
        overallCSAT: { type: 'number', minimum: 0, maximum: 100 },
        byTouchpoint: { type: 'object' },
        byChannel: { type: 'object' },
        bySegment: { type: 'object' },
        distribution: { type: 'object' },
        benchmarkComparison: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'csat', 'calculation']
}));

export const touchpointAnalysisTask = defineTask('touchpoint-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze touchpoint performance',
  agent: {
    name: 'touchpoint-analyst',
    prompt: {
      role: 'touchpoint performance analyst',
      task: 'Analyze CSAT performance at each touchpoint',
      context: args,
      instructions: [
        'Rank touchpoints by CSAT score',
        'Identify top performing touchpoints',
        'Identify lowest performing touchpoints',
        'Analyze touchpoint trends',
        'Identify improvement opportunities',
        'Correlate touchpoint CSAT with outcomes',
        'Calculate touchpoint impact scores',
        'Prioritize improvement areas',
        'Generate touchpoint analysis report'
      ],
      outputFormat: 'JSON with touchpoints, topPerformer, lowestPerformer, trends, improvements, correlations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['touchpoints', 'topPerformer', 'lowestPerformer', 'artifacts'],
      properties: {
        touchpoints: { type: 'array', items: { type: 'object' } },
        topPerformer: { type: 'object' },
        lowestPerformer: { type: 'object' },
        trends: { type: 'object' },
        improvements: { type: 'array', items: { type: 'object' } },
        correlations: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'csat', 'touchpoint-analysis']
}));

export const trendAnalysisTask = defineTask('trend-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze CSAT trends',
  agent: {
    name: 'trend-analyst',
    prompt: {
      role: 'CSAT trend analyst',
      task: 'Analyze CSAT trends over time',
      context: args,
      instructions: [
        'Calculate CSAT trends over time',
        'Identify improving touchpoints',
        'Identify declining touchpoints',
        'Detect seasonal patterns',
        'Correlate with operational changes',
        'Project future performance',
        'Compare to benchmark trends',
        'Identify inflection points',
        'Generate trend analysis report'
      ],
      outputFormat: 'JSON with trends, improving, declining, patterns, projections, correlations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['trends', 'artifacts'],
      properties: {
        trends: { type: 'object' },
        improving: { type: 'array', items: { type: 'object' } },
        declining: { type: 'array', items: { type: 'object' } },
        patterns: { type: 'array', items: { type: 'object' } },
        projections: { type: 'object' },
        correlations: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'csat', 'trends']
}));

export const insightGenerationTask = defineTask('insight-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate actionable insights',
  agent: {
    name: 'insight-generator',
    prompt: {
      role: 'customer insights specialist',
      task: 'Generate actionable insights from CSAT data',
      context: args,
      instructions: [
        'Synthesize key findings',
        'Identify root causes of low CSAT',
        'Highlight success factors',
        'Generate actionable recommendations',
        'Prioritize improvement initiatives',
        'Calculate potential impact',
        'Identify quick wins',
        'Document strategic insights',
        'Generate insights report'
      ],
      outputFormat: 'JSON with insights, rootCauses, successFactors, recommendations, quickWins, strategicInsights, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['insights', 'recommendations', 'artifacts'],
      properties: {
        insights: { type: 'array', items: { type: 'object' } },
        rootCauses: { type: 'array', items: { type: 'object' } },
        successFactors: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'object' } },
        quickWins: { type: 'array', items: { type: 'object' } },
        strategicInsights: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'csat', 'insights']
}));

export const csatReportTask = defineTask('csat-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate CSAT report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'CSAT reporting specialist',
      task: 'Generate comprehensive CSAT report for stakeholders',
      context: args,
      instructions: [
        'Create executive summary',
        'Present overall CSAT metrics',
        'Show touchpoint performance',
        'Present trend analysis',
        'Highlight key insights',
        'Include recommendations',
        'Create visualizations',
        'Add appendix with details',
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
  labels: ['agent', 'csat', 'reporting']
}));
