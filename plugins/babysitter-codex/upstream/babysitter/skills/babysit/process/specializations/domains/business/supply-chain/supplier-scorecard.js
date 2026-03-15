/**
 * @process specializations/domains/business/supply-chain/supplier-scorecard
 * @description Supplier Performance Scorecard - Track and report supplier performance metrics including OTIF
 * (On-Time In-Full), quality, cost, responsiveness, and sustainability with trend analysis and action tracking.
 * @inputs { suppliers?: array, performanceData?: object, scorecardPeriod?: string, benchmarks?: object }
 * @outputs { success: boolean, scorecards: array, rankings: array, actionItems: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/supply-chain/supplier-scorecard', {
 *   suppliers: ['Supplier A', 'Supplier B', 'Supplier C'],
 *   performanceData: { otif: {...}, quality: {...}, cost: {...} },
 *   scorecardPeriod: 'Q4-2024',
 *   benchmarks: { otif: 0.95, quality: 0.99 }
 * });
 *
 * @references
 * - ASCM SCOR Model: https://www.ascm.org/topics/scor/
 * - Supplier Performance Management: https://www.gartner.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    suppliers = [],
    performanceData = {},
    scorecardPeriod = 'current',
    benchmarks = {},
    weights = {},
    outputDir = 'supplier-scorecard-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Supplier Performance Scorecard Process');

  // ============================================================================
  // PHASE 1: DATA COLLECTION AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Collecting and validating performance data');

  const dataCollection = await ctx.task(performanceDataCollectionTask, {
    suppliers,
    performanceData,
    scorecardPeriod,
    outputDir
  });

  artifacts.push(...dataCollection.artifacts);

  // ============================================================================
  // PHASE 2: DELIVERY PERFORMANCE SCORING
  // ============================================================================

  ctx.log('info', 'Phase 2: Scoring delivery performance');

  const deliveryScoring = await ctx.task(deliveryScoringTask, {
    suppliers,
    dataCollection,
    benchmarks,
    outputDir
  });

  artifacts.push(...deliveryScoring.artifacts);

  // ============================================================================
  // PHASE 3: QUALITY PERFORMANCE SCORING
  // ============================================================================

  ctx.log('info', 'Phase 3: Scoring quality performance');

  const qualityScoring = await ctx.task(qualityScoringTask, {
    suppliers,
    dataCollection,
    benchmarks,
    outputDir
  });

  artifacts.push(...qualityScoring.artifacts);

  // ============================================================================
  // PHASE 4: COST PERFORMANCE SCORING
  // ============================================================================

  ctx.log('info', 'Phase 4: Scoring cost performance');

  const costScoring = await ctx.task(costScoringTask, {
    suppliers,
    dataCollection,
    benchmarks,
    outputDir
  });

  artifacts.push(...costScoring.artifacts);

  // ============================================================================
  // PHASE 5: RESPONSIVENESS SCORING
  // ============================================================================

  ctx.log('info', 'Phase 5: Scoring responsiveness');

  const responsivenessScoring = await ctx.task(responsivenessScoringTask, {
    suppliers,
    dataCollection,
    benchmarks,
    outputDir
  });

  artifacts.push(...responsivenessScoring.artifacts);

  // ============================================================================
  // PHASE 6: SUSTAINABILITY SCORING
  // ============================================================================

  ctx.log('info', 'Phase 6: Scoring sustainability');

  const sustainabilityScoring = await ctx.task(sustainabilityScoringTask, {
    suppliers,
    dataCollection,
    benchmarks,
    outputDir
  });

  artifacts.push(...sustainabilityScoring.artifacts);

  // ============================================================================
  // PHASE 7: COMPOSITE SCORECARD GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Generating composite scorecards');

  const compositeScorecards = await ctx.task(compositeScoreCardTask, {
    suppliers,
    deliveryScoring,
    qualityScoring,
    costScoring,
    responsivenessScoring,
    sustainabilityScoring,
    weights,
    outputDir
  });

  artifacts.push(...compositeScorecards.artifacts);

  // Breakpoint: Review scorecards
  await ctx.breakpoint({
    question: `Scorecards generated for ${suppliers.length} suppliers. Top performer: ${compositeScorecards.topPerformer}. Review scorecards?`,
    title: 'Supplier Scorecard Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'json' })),
      summary: {
        supplierCount: suppliers.length,
        topPerformer: compositeScorecards.topPerformer,
        rankings: compositeScorecards.rankings.slice(0, 5)
      }
    }
  });

  // ============================================================================
  // PHASE 8: TREND ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 8: Analyzing performance trends');

  const trendAnalysis = await ctx.task(trendAnalysisTask, {
    suppliers,
    compositeScorecards,
    dataCollection,
    outputDir
  });

  artifacts.push(...trendAnalysis.artifacts);

  // ============================================================================
  // PHASE 9: ACTION ITEM GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Generating action items');

  const actionItems = await ctx.task(actionItemGenerationTask, {
    compositeScorecards,
    trendAnalysis,
    benchmarks,
    outputDir
  });

  artifacts.push(...actionItems.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    scorecards: compositeScorecards.scorecards,
    rankings: compositeScorecards.rankings,
    topPerformer: compositeScorecards.topPerformer,
    categoryScores: {
      delivery: deliveryScoring.scores,
      quality: qualityScoring.scores,
      cost: costScoring.scores,
      responsiveness: responsivenessScoring.scores,
      sustainability: sustainabilityScoring.scores
    },
    trends: trendAnalysis.trends,
    actionItems: actionItems.items,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/business/supply-chain/supplier-scorecard',
      timestamp: startTime,
      scorecardPeriod,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const performanceDataCollectionTask = defineTask('performance-data-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1: Performance Data Collection',
  agent: {
    name: 'data-collector',
    prompt: {
      role: 'Supplier Performance Data Analyst',
      task: 'Collect and validate supplier performance data',
      context: args,
      instructions: [
        '1. Collect delivery data (POs, receipts, dates)',
        '2. Collect quality data (defects, returns, NCRs)',
        '3. Collect cost data (pricing, variances)',
        '4. Collect responsiveness data (response times)',
        '5. Collect sustainability data (certifications, metrics)',
        '6. Validate data completeness',
        '7. Identify data quality issues',
        '8. Document data sources'
      ],
      outputFormat: 'JSON with collected performance data'
    },
    outputSchema: {
      type: 'object',
      required: ['deliveryData', 'qualityData', 'costData', 'artifacts'],
      properties: {
        deliveryData: { type: 'object' },
        qualityData: { type: 'object' },
        costData: { type: 'object' },
        responsivenessData: { type: 'object' },
        sustainabilityData: { type: 'object' },
        dataQuality: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'scorecard', 'data-collection']
}));

export const deliveryScoringTask = defineTask('delivery-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2: Delivery Performance Scoring',
  agent: {
    name: 'delivery-scorer',
    prompt: {
      role: 'Delivery Performance Analyst',
      task: 'Score supplier delivery performance',
      context: args,
      instructions: [
        '1. Calculate On-Time Delivery (OTD) rate',
        '2. Calculate OTIF (On-Time In-Full) rate',
        '3. Measure lead time compliance',
        '4. Calculate delivery accuracy',
        '5. Score against benchmarks',
        '6. Identify delivery issues',
        '7. Calculate weighted delivery score',
        '8. Document delivery performance'
      ],
      outputFormat: 'JSON with delivery scores'
    },
    outputSchema: {
      type: 'object',
      required: ['scores', 'metrics', 'artifacts'],
      properties: {
        scores: { type: 'object' },
        metrics: { type: 'object' },
        otdRate: { type: 'object' },
        otifRate: { type: 'object' },
        issues: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'scorecard', 'delivery']
}));

export const qualityScoringTask = defineTask('quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3: Quality Performance Scoring',
  agent: {
    name: 'quality-scorer',
    prompt: {
      role: 'Quality Performance Analyst',
      task: 'Score supplier quality performance',
      context: args,
      instructions: [
        '1. Calculate defect rate (PPM)',
        '2. Calculate return rate',
        '3. Measure first pass yield',
        '4. Track corrective action closure rate',
        '5. Assess quality certifications',
        '6. Score against benchmarks',
        '7. Calculate weighted quality score',
        '8. Document quality performance'
      ],
      outputFormat: 'JSON with quality scores'
    },
    outputSchema: {
      type: 'object',
      required: ['scores', 'metrics', 'artifacts'],
      properties: {
        scores: { type: 'object' },
        metrics: { type: 'object' },
        defectRate: { type: 'object' },
        returnRate: { type: 'object' },
        issues: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'scorecard', 'quality']
}));

export const costScoringTask = defineTask('cost-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4: Cost Performance Scoring',
  agent: {
    name: 'cost-scorer',
    prompt: {
      role: 'Cost Performance Analyst',
      task: 'Score supplier cost performance',
      context: args,
      instructions: [
        '1. Calculate price variance vs. contract',
        '2. Measure cost reduction achievements',
        '3. Calculate total cost of ownership',
        '4. Assess invoice accuracy',
        '5. Evaluate payment terms compliance',
        '6. Score against benchmarks',
        '7. Calculate weighted cost score',
        '8. Document cost performance'
      ],
      outputFormat: 'JSON with cost scores'
    },
    outputSchema: {
      type: 'object',
      required: ['scores', 'metrics', 'artifacts'],
      properties: {
        scores: { type: 'object' },
        metrics: { type: 'object' },
        priceVariance: { type: 'object' },
        costReductions: { type: 'object' },
        issues: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'scorecard', 'cost']
}));

export const responsivenessScoringTask = defineTask('responsiveness-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5: Responsiveness Scoring',
  agent: {
    name: 'responsiveness-scorer',
    prompt: {
      role: 'Responsiveness Analyst',
      task: 'Score supplier responsiveness',
      context: args,
      instructions: [
        '1. Measure quote turnaround time',
        '2. Measure issue response time',
        '3. Assess flexibility to changes',
        '4. Evaluate communication quality',
        '5. Measure problem resolution time',
        '6. Score against benchmarks',
        '7. Calculate weighted responsiveness score',
        '8. Document responsiveness performance'
      ],
      outputFormat: 'JSON with responsiveness scores'
    },
    outputSchema: {
      type: 'object',
      required: ['scores', 'metrics', 'artifacts'],
      properties: {
        scores: { type: 'object' },
        metrics: { type: 'object' },
        responseTimes: { type: 'object' },
        flexibility: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'scorecard', 'responsiveness']
}));

export const sustainabilityScoringTask = defineTask('sustainability-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6: Sustainability Scoring',
  agent: {
    name: 'sustainability-scorer',
    prompt: {
      role: 'Sustainability Analyst',
      task: 'Score supplier sustainability performance',
      context: args,
      instructions: [
        '1. Assess environmental certifications',
        '2. Evaluate carbon footprint data',
        '3. Review waste reduction efforts',
        '4. Assess social responsibility practices',
        '5. Review diversity and inclusion metrics',
        '6. Score against benchmarks',
        '7. Calculate weighted sustainability score',
        '8. Document sustainability performance'
      ],
      outputFormat: 'JSON with sustainability scores'
    },
    outputSchema: {
      type: 'object',
      required: ['scores', 'metrics', 'artifacts'],
      properties: {
        scores: { type: 'object' },
        metrics: { type: 'object' },
        certifications: { type: 'object' },
        environmentalMetrics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'scorecard', 'sustainability']
}));

export const compositeScoreCardTask = defineTask('composite-scorecard', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7: Composite Scorecard Generation',
  agent: {
    name: 'scorecard-generator',
    prompt: {
      role: 'Scorecard Generation Specialist',
      task: 'Generate composite supplier scorecards',
      context: args,
      instructions: [
        '1. Apply category weights',
        '2. Calculate weighted composite score',
        '3. Rank suppliers by overall score',
        '4. Identify top performer',
        '5. Identify underperformers',
        '6. Generate individual scorecards',
        '7. Create comparative analysis',
        '8. Generate scorecard visualizations'
      ],
      outputFormat: 'JSON with composite scorecards'
    },
    outputSchema: {
      type: 'object',
      required: ['scorecards', 'rankings', 'topPerformer', 'artifacts'],
      properties: {
        scorecards: { type: 'array' },
        rankings: { type: 'array' },
        topPerformer: { type: 'string' },
        underperformers: { type: 'array' },
        comparativeAnalysis: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'scorecard', 'composite']
}));

export const trendAnalysisTask = defineTask('trend-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 8: Performance Trend Analysis',
  agent: {
    name: 'trend-analyst',
    prompt: {
      role: 'Performance Trend Analyst',
      task: 'Analyze supplier performance trends',
      context: args,
      instructions: [
        '1. Compare to previous periods',
        '2. Calculate trend direction by metric',
        '3. Identify improving suppliers',
        '4. Identify declining suppliers',
        '5. Analyze root causes of trends',
        '6. Project future performance',
        '7. Identify risk indicators',
        '8. Document trend analysis'
      ],
      outputFormat: 'JSON with trend analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['trends', 'improving', 'declining', 'artifacts'],
      properties: {
        trends: { type: 'object' },
        improving: { type: 'array' },
        declining: { type: 'array' },
        rootCauses: { type: 'object' },
        riskIndicators: { type: 'array' },
        projections: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'scorecard', 'trends']
}));

export const actionItemGenerationTask = defineTask('action-item-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 9: Action Item Generation',
  agent: {
    name: 'action-generator',
    prompt: {
      role: 'Supplier Action Planning Specialist',
      task: 'Generate action items from scorecard results',
      context: args,
      instructions: [
        '1. Identify performance gaps vs. benchmarks',
        '2. Prioritize action items by impact',
        '3. Assign owners to action items',
        '4. Set due dates',
        '5. Define corrective actions',
        '6. Schedule supplier discussions',
        '7. Create improvement plans',
        '8. Document action items'
      ],
      outputFormat: 'JSON with action items'
    },
    outputSchema: {
      type: 'object',
      required: ['items', 'priorities', 'artifacts'],
      properties: {
        items: { type: 'array' },
        priorities: { type: 'object' },
        correctiveActions: { type: 'array' },
        meetingsScheduled: { type: 'array' },
        improvementPlans: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'scorecard', 'action-items']
}));
