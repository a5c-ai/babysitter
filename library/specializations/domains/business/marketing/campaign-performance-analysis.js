/**
 * @process marketing/campaign-performance-analysis
 * @description Track campaign metrics against KPIs, analyze results by channel and audience segment, document learnings, and create optimization recommendations.
 * @inputs { campaignName: string, campaignData: object, kpis: array, channels: array, segments: array, benchmarks: object }
 * @outputs { success: boolean, performanceReport: object, channelAnalysis: object, segmentAnalysis: object, recommendations: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    campaignName = 'Campaign',
    campaignData = {},
    kpis = [],
    channels = [],
    segments = [],
    benchmarks = {},
    outputDir = 'campaign-analysis-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Campaign Performance Analysis for ${campaignName}`);

  // ============================================================================
  // PHASE 1: DATA COLLECTION AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Collecting and validating campaign data');
  const dataValidation = await ctx.task(dataCollectionValidationTask, {
    campaignName,
    campaignData,
    channels,
    outputDir
  });

  artifacts.push(...dataValidation.artifacts);

  // ============================================================================
  // PHASE 2: KPI PERFORMANCE TRACKING
  // ============================================================================

  ctx.log('info', 'Phase 2: Tracking performance against KPIs');
  const kpiTracking = await ctx.task(kpiPerformanceTrackingTask, {
    campaignName,
    campaignData,
    kpis,
    benchmarks,
    dataValidation,
    outputDir
  });

  artifacts.push(...kpiTracking.artifacts);

  // ============================================================================
  // PHASE 3: CHANNEL PERFORMANCE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Analyzing performance by channel');
  const channelAnalysis = await ctx.task(channelPerformanceAnalysisTask, {
    campaignName,
    campaignData,
    channels,
    kpiTracking,
    benchmarks,
    outputDir
  });

  artifacts.push(...channelAnalysis.artifacts);

  // ============================================================================
  // PHASE 4: AUDIENCE SEGMENT ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing performance by audience segment');
  const segmentAnalysis = await ctx.task(segmentPerformanceAnalysisTask, {
    campaignName,
    campaignData,
    segments,
    kpiTracking,
    outputDir
  });

  artifacts.push(...segmentAnalysis.artifacts);

  // ============================================================================
  // PHASE 5: CREATIVE PERFORMANCE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Analyzing creative performance');
  const creativeAnalysis = await ctx.task(creativePerformanceAnalysisTask, {
    campaignName,
    campaignData,
    channelAnalysis,
    outputDir
  });

  artifacts.push(...creativeAnalysis.artifacts);

  // ============================================================================
  // PHASE 6: CONVERSION FUNNEL ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Analyzing conversion funnel');
  const funnelAnalysis = await ctx.task(conversionFunnelAnalysisTask, {
    campaignName,
    campaignData,
    kpiTracking,
    channelAnalysis,
    outputDir
  });

  artifacts.push(...funnelAnalysis.artifacts);

  // ============================================================================
  // PHASE 7: ROI AND EFFICIENCY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 7: Analyzing ROI and efficiency');
  const roiAnalysis = await ctx.task(roiEfficiencyAnalysisTask, {
    campaignName,
    campaignData,
    kpiTracking,
    channelAnalysis,
    benchmarks,
    outputDir
  });

  artifacts.push(...roiAnalysis.artifacts);

  // ============================================================================
  // PHASE 8: LEARNINGS DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Documenting campaign learnings');
  const learningsDocumentation = await ctx.task(learningsDocumentationTask, {
    campaignName,
    kpiTracking,
    channelAnalysis,
    segmentAnalysis,
    creativeAnalysis,
    funnelAnalysis,
    roiAnalysis,
    outputDir
  });

  artifacts.push(...learningsDocumentation.artifacts);

  // ============================================================================
  // PHASE 9: OPTIMIZATION RECOMMENDATIONS
  // ============================================================================

  ctx.log('info', 'Phase 9: Developing optimization recommendations');
  const optimizationRecommendations = await ctx.task(optimizationRecommendationsTask, {
    campaignName,
    kpiTracking,
    channelAnalysis,
    segmentAnalysis,
    creativeAnalysis,
    funnelAnalysis,
    roiAnalysis,
    learningsDocumentation,
    outputDir
  });

  artifacts.push(...optimizationRecommendations.artifacts);

  // ============================================================================
  // PHASE 10: EXECUTIVE SUMMARY REPORT
  // ============================================================================

  ctx.log('info', 'Phase 10: Generating executive summary report');
  const executiveSummary = await ctx.task(executiveSummaryReportTask, {
    campaignName,
    kpiTracking,
    channelAnalysis,
    segmentAnalysis,
    roiAnalysis,
    learningsDocumentation,
    optimizationRecommendations,
    outputDir
  });

  artifacts.push(...executiveSummary.artifacts);

  const campaignScore = kpiTracking.overallScore;
  const goalsAchieved = campaignScore >= 80;

  // Breakpoint: Review campaign analysis
  await ctx.breakpoint({
    question: `Campaign analysis complete. Performance score: ${campaignScore}/100. ${goalsAchieved ? 'Campaign met goals!' : 'Campaign underperformed against goals.'} Review and approve?`,
    title: 'Campaign Performance Review & Approval',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        campaignScore,
        goalsAchieved,
        campaignName,
        totalArtifacts: artifacts.length,
        kpisTracked: kpiTracking.kpiResults?.length || 0,
        channelsAnalyzed: channelAnalysis.channels?.length || 0,
        recommendationCount: optimizationRecommendations.recommendations?.length || 0
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    campaignName,
    campaignScore,
    goalsAchieved,
    performanceReport: {
      kpiResults: kpiTracking.kpiResults,
      overallScore: kpiTracking.overallScore,
      summary: executiveSummary.summary
    },
    channelAnalysis: {
      channels: channelAnalysis.channels,
      topPerformer: channelAnalysis.topPerformer,
      underperformers: channelAnalysis.underperformers
    },
    segmentAnalysis: {
      segments: segmentAnalysis.segments,
      topSegment: segmentAnalysis.topSegment,
      insights: segmentAnalysis.insights
    },
    creativeAnalysis: {
      topCreatives: creativeAnalysis.topCreatives,
      insights: creativeAnalysis.insights
    },
    funnelAnalysis: {
      stages: funnelAnalysis.stages,
      dropOffPoints: funnelAnalysis.dropOffPoints
    },
    roiAnalysis: {
      roi: roiAnalysis.roi,
      efficiency: roiAnalysis.efficiency,
      costMetrics: roiAnalysis.costMetrics
    },
    learnings: learningsDocumentation.learnings,
    recommendations: optimizationRecommendations.recommendations,
    artifacts,
    duration,
    metadata: {
      processId: 'marketing/campaign-performance-analysis',
      timestamp: startTime,
      campaignName,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Data Collection and Validation
export const dataCollectionValidationTask = defineTask('data-collection-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Collect and validate campaign data',
  agent: {
    name: 'data-analyst',
    prompt: {
      role: 'marketing data analyst',
      task: 'Collect, consolidate, and validate campaign data from all sources',
      context: args,
      instructions: [
        'Identify all data sources for campaign metrics',
        'Consolidate data from multiple platforms',
        'Validate data accuracy and completeness',
        'Identify and flag data discrepancies',
        'Normalize data across channels',
        'Create unified data schema',
        'Document data quality issues',
        'Prepare cleaned dataset for analysis',
        'Generate data validation report'
      ],
      outputFormat: 'JSON with dataSources (array), dataQuality (object), discrepancies (array), cleanedData (object), validationReport (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['dataSources', 'dataQuality', 'artifacts'],
      properties: {
        dataSources: { type: 'array', items: { type: 'string' } },
        dataQuality: {
          type: 'object',
          properties: {
            completeness: { type: 'number' },
            accuracy: { type: 'number' },
            issues: { type: 'array', items: { type: 'string' } }
          }
        },
        discrepancies: { type: 'array', items: { type: 'string' } },
        cleanedData: { type: 'object' },
        validationReport: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'campaign-analysis', 'data-validation']
}));

// Task 2: KPI Performance Tracking
export const kpiPerformanceTrackingTask = defineTask('kpi-performance-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Track performance against KPIs',
  agent: {
    name: 'kpi-analyst',
    prompt: {
      role: 'marketing performance analyst',
      task: 'Track and analyze campaign performance against defined KPIs',
      context: args,
      instructions: [
        'Calculate actual performance for each KPI',
        'Compare actuals to targets',
        'Calculate variance and percentage achievement',
        'Benchmark against historical performance',
        'Identify KPIs that exceeded or missed targets',
        'Analyze trends over campaign period',
        'Calculate overall campaign score',
        'Identify leading indicators of performance',
        'Generate KPI tracking report'
      ],
      outputFormat: 'JSON with kpiResults (array), overallScore (number 0-100), achievements (object), misses (object), trends (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['kpiResults', 'overallScore', 'artifacts'],
      properties: {
        kpiResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              kpi: { type: 'string' },
              target: { type: 'number' },
              actual: { type: 'number' },
              variance: { type: 'number' },
              achievement: { type: 'number' },
              status: { type: 'string' }
            }
          }
        },
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        achievements: { type: 'object' },
        misses: { type: 'object' },
        trends: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'campaign-analysis', 'kpi-tracking']
}));

// Task 3: Channel Performance Analysis
export const channelPerformanceAnalysisTask = defineTask('channel-performance-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze performance by channel',
  agent: {
    name: 'channel-analyst',
    prompt: {
      role: 'media performance analyst',
      task: 'Analyze campaign performance across all marketing channels',
      context: args,
      instructions: [
        'Calculate key metrics for each channel',
        'Compare channel performance against benchmarks',
        'Identify top and bottom performing channels',
        'Analyze cost efficiency by channel',
        'Calculate channel contribution to conversions',
        'Assess channel synergies and interactions',
        'Identify channel optimization opportunities',
        'Compare paid vs organic performance',
        'Generate channel analysis report'
      ],
      outputFormat: 'JSON with channels (array), topPerformer (object), underperformers (array), efficiency (object), attribution (object), synergies (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['channels', 'topPerformer', 'underperformers', 'artifacts'],
      properties: {
        channels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              channel: { type: 'string' },
              spend: { type: 'number' },
              impressions: { type: 'number' },
              clicks: { type: 'number' },
              conversions: { type: 'number' },
              cpa: { type: 'number' },
              roas: { type: 'number' }
            }
          }
        },
        topPerformer: { type: 'object' },
        underperformers: { type: 'array' },
        efficiency: { type: 'object' },
        attribution: { type: 'object' },
        synergies: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'campaign-analysis', 'channel-performance']
}));

// Task 4: Segment Performance Analysis
export const segmentPerformanceAnalysisTask = defineTask('segment-performance-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze performance by audience segment',
  agent: {
    name: 'segment-analyst',
    prompt: {
      role: 'audience analytics specialist',
      task: 'Analyze campaign performance across audience segments',
      context: args,
      instructions: [
        'Calculate performance metrics by segment',
        'Identify highest and lowest performing segments',
        'Analyze segment response rates',
        'Compare segment conversion rates',
        'Assess segment-specific messaging effectiveness',
        'Identify unexpected segment behaviors',
        'Calculate segment-level ROI',
        'Recommend segment prioritization',
        'Generate segment analysis report'
      ],
      outputFormat: 'JSON with segments (array), topSegment (object), insights (array), segmentRoi (object), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['segments', 'topSegment', 'insights', 'artifacts'],
      properties: {
        segments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              segment: { type: 'string' },
              reach: { type: 'number' },
              engagementRate: { type: 'number' },
              conversionRate: { type: 'number' },
              cpa: { type: 'number' }
            }
          }
        },
        topSegment: { type: 'object' },
        insights: { type: 'array', items: { type: 'string' } },
        segmentRoi: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'campaign-analysis', 'segment-performance']
}));

// Task 5: Creative Performance Analysis
export const creativePerformanceAnalysisTask = defineTask('creative-performance-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze creative performance',
  agent: {
    name: 'creative-analyst',
    prompt: {
      role: 'creative performance specialist',
      task: 'Analyze performance of creative assets across the campaign',
      context: args,
      instructions: [
        'Evaluate performance of different creative versions',
        'Analyze headline and copy effectiveness',
        'Assess visual element performance',
        'Compare creative performance by channel',
        'Identify creative fatigue patterns',
        'Analyze CTA effectiveness',
        'Assess format performance (video, static, carousel)',
        'Identify winning creative elements',
        'Generate creative analysis report'
      ],
      outputFormat: 'JSON with creatives (array), topCreatives (array), insights (array), fatigue (object), ctaPerformance (object), formatAnalysis (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['creatives', 'topCreatives', 'insights', 'artifacts'],
      properties: {
        creatives: { type: 'array' },
        topCreatives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              creative: { type: 'string' },
              ctr: { type: 'number' },
              conversionRate: { type: 'number' },
              winningElements: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        insights: { type: 'array', items: { type: 'string' } },
        fatigue: { type: 'object' },
        ctaPerformance: { type: 'object' },
        formatAnalysis: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'campaign-analysis', 'creative-performance']
}));

// Task 6: Conversion Funnel Analysis
export const conversionFunnelAnalysisTask = defineTask('conversion-funnel-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze conversion funnel',
  agent: {
    name: 'funnel-analyst',
    prompt: {
      role: 'conversion optimization specialist',
      task: 'Analyze campaign conversion funnel and identify optimization opportunities',
      context: args,
      instructions: [
        'Map campaign conversion funnel stages',
        'Calculate conversion rates between stages',
        'Identify drop-off points',
        'Analyze time to conversion',
        'Compare funnel performance by channel',
        'Identify friction points',
        'Assess landing page performance',
        'Calculate funnel efficiency',
        'Generate funnel analysis report'
      ],
      outputFormat: 'JSON with stages (array), dropOffPoints (array), conversionRates (object), timeToConversion (object), frictionPoints (array), landingPagePerformance (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['stages', 'dropOffPoints', 'conversionRates', 'artifacts'],
      properties: {
        stages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stage: { type: 'string' },
              volume: { type: 'number' },
              conversionRate: { type: 'number' }
            }
          }
        },
        dropOffPoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stage: { type: 'string' },
              dropOffRate: { type: 'number' },
              cause: { type: 'string' }
            }
          }
        },
        conversionRates: { type: 'object' },
        timeToConversion: { type: 'object' },
        frictionPoints: { type: 'array', items: { type: 'string' } },
        landingPagePerformance: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'campaign-analysis', 'funnel-analysis']
}));

// Task 7: ROI and Efficiency Analysis
export const roiEfficiencyAnalysisTask = defineTask('roi-efficiency-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze ROI and efficiency',
  agent: {
    name: 'roi-analyst',
    prompt: {
      role: 'marketing finance analyst',
      task: 'Calculate and analyze campaign ROI and efficiency metrics',
      context: args,
      instructions: [
        'Calculate overall campaign ROI',
        'Compute ROAS (Return on Ad Spend)',
        'Calculate cost per acquisition (CPA)',
        'Analyze cost per lead (CPL)',
        'Calculate customer lifetime value contribution',
        'Compare efficiency against benchmarks',
        'Identify cost optimization opportunities',
        'Assess budget utilization',
        'Generate ROI analysis report'
      ],
      outputFormat: 'JSON with roi (object), efficiency (object), costMetrics (object), budgetUtilization (object), benchmarkComparison (object), optimizationOpportunities (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['roi', 'efficiency', 'costMetrics', 'artifacts'],
      properties: {
        roi: {
          type: 'object',
          properties: {
            overall: { type: 'number' },
            byChannel: { type: 'object' }
          }
        },
        efficiency: {
          type: 'object',
          properties: {
            roas: { type: 'number' },
            cpa: { type: 'number' },
            cpl: { type: 'number' }
          }
        },
        costMetrics: { type: 'object' },
        budgetUtilization: {
          type: 'object',
          properties: {
            planned: { type: 'number' },
            actual: { type: 'number' },
            variance: { type: 'number' }
          }
        },
        benchmarkComparison: { type: 'object' },
        optimizationOpportunities: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'campaign-analysis', 'roi-analysis']
}));

// Task 8: Learnings Documentation
export const learningsDocumentationTask = defineTask('learnings-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document campaign learnings',
  agent: {
    name: 'insights-specialist',
    prompt: {
      role: 'marketing insights manager',
      task: 'Document key learnings and insights from campaign performance',
      context: args,
      instructions: [
        'Summarize what worked well',
        'Document what did not work',
        'Identify surprising findings',
        'Extract audience insights',
        'Document channel learnings',
        'Capture creative insights',
        'Identify process improvements',
        'Create reusable playbook elements',
        'Generate learnings document'
      ],
      outputFormat: 'JSON with learnings (array), whatWorked (array), whatDidntWork (array), surprises (array), audienceInsights (array), channelLearnings (array), processImprovements (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['learnings', 'whatWorked', 'whatDidntWork', 'artifacts'],
      properties: {
        learnings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              learning: { type: 'string' },
              category: { type: 'string' },
              impact: { type: 'string' },
              applicability: { type: 'string' }
            }
          }
        },
        whatWorked: { type: 'array', items: { type: 'string' } },
        whatDidntWork: { type: 'array', items: { type: 'string' } },
        surprises: { type: 'array', items: { type: 'string' } },
        audienceInsights: { type: 'array', items: { type: 'string' } },
        channelLearnings: { type: 'array', items: { type: 'string' } },
        processImprovements: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'campaign-analysis', 'learnings']
}));

// Task 9: Optimization Recommendations
export const optimizationRecommendationsTask = defineTask('optimization-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop optimization recommendations',
  agent: {
    name: 'optimization-strategist',
    prompt: {
      role: 'performance marketing strategist',
      task: 'Develop actionable optimization recommendations based on campaign analysis',
      context: args,
      instructions: [
        'Prioritize optimization opportunities',
        'Recommend budget reallocation',
        'Suggest creative optimizations',
        'Recommend audience targeting changes',
        'Propose channel mix adjustments',
        'Suggest funnel improvements',
        'Recommend testing opportunities',
        'Define implementation priorities',
        'Generate recommendations document'
      ],
      outputFormat: 'JSON with recommendations (array), budgetReallocation (object), creativeOptimizations (array), targetingChanges (array), channelAdjustments (array), testingOpportunities (array), implementationPlan (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'implementationPlan', 'artifacts'],
      properties: {
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              category: { type: 'string' },
              priority: { type: 'string' },
              impact: { type: 'string' },
              effort: { type: 'string' }
            }
          }
        },
        budgetReallocation: { type: 'object' },
        creativeOptimizations: { type: 'array', items: { type: 'string' } },
        targetingChanges: { type: 'array', items: { type: 'string' } },
        channelAdjustments: { type: 'array', items: { type: 'string' } },
        testingOpportunities: { type: 'array', items: { type: 'string' } },
        implementationPlan: {
          type: 'object',
          properties: {
            immediate: { type: 'array', items: { type: 'string' } },
            shortTerm: { type: 'array', items: { type: 'string' } },
            longTerm: { type: 'array', items: { type: 'string' } }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'campaign-analysis', 'optimization']
}));

// Task 10: Executive Summary Report
export const executiveSummaryReportTask = defineTask('executive-summary-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate executive summary report',
  agent: {
    name: 'report-writer',
    prompt: {
      role: 'marketing communications specialist',
      task: 'Generate executive summary report of campaign performance',
      context: args,
      instructions: [
        'Create executive summary of results',
        'Highlight key achievements',
        'Summarize performance vs goals',
        'Present top insights',
        'Summarize ROI and efficiency',
        'Present key recommendations',
        'Create data visualizations',
        'Format for stakeholder presentation',
        'Generate executive report document'
      ],
      outputFormat: 'JSON with summary (object), highlights (array), keyMetrics (object), insights (array), recommendations (array), visualizations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'highlights', 'keyMetrics', 'artifacts'],
      properties: {
        summary: {
          type: 'object',
          properties: {
            overview: { type: 'string' },
            verdict: { type: 'string' },
            score: { type: 'number' }
          }
        },
        highlights: { type: 'array', items: { type: 'string' } },
        keyMetrics: {
          type: 'object',
          properties: {
            reach: { type: 'number' },
            engagement: { type: 'number' },
            conversions: { type: 'number' },
            roi: { type: 'number' }
          }
        },
        insights: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        visualizations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'campaign-analysis', 'executive-report']
}));
