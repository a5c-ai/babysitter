/**
 * @process business-strategy/bcg-portfolio-analysis
 * @description Portfolio management analysis using BCG Growth-Share Matrix for resource allocation decisions
 * @inputs { organizationName: string, businessUnits: array, marketData: object, financialData: object }
 * @outputs { success: boolean, bcgMatrix: object, portfolioBalance: object, resourceAllocation: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationName = 'Organization',
    businessUnits = [],
    marketData = {},
    financialData = {},
    outputDir = 'bcg-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting BCG Portfolio Analysis for ${organizationName}`);

  // ============================================================================
  // PHASE 1: MARKET GROWTH RATE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing market growth rates for each business unit');
  const marketGrowthAnalysis = await ctx.task(marketGrowthAnalysisTask, {
    organizationName,
    businessUnits,
    marketData,
    outputDir
  });

  artifacts.push(...marketGrowthAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: RELATIVE MARKET SHARE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing relative market share for each business unit');
  const marketShareAnalysis = await ctx.task(marketShareAnalysisTask, {
    organizationName,
    businessUnits,
    marketData,
    outputDir
  });

  artifacts.push(...marketShareAnalysis.artifacts);

  // ============================================================================
  // PHASE 3: BCG MATRIX CLASSIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Classifying business units on BCG matrix');
  const bcgClassification = await ctx.task(bcgClassificationTask, {
    organizationName,
    marketGrowthAnalysis,
    marketShareAnalysis,
    businessUnits,
    outputDir
  });

  artifacts.push(...bcgClassification.artifacts);

  // ============================================================================
  // PHASE 4: CASH FLOW ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing cash flow by BCG category');
  const cashFlowAnalysis = await ctx.task(cashFlowAnalysisTask, {
    organizationName,
    bcgClassification,
    financialData,
    outputDir
  });

  artifacts.push(...cashFlowAnalysis.artifacts);

  // ============================================================================
  // PHASE 5: PORTFOLIO BALANCE ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 5: Assessing portfolio balance');
  const portfolioBalance = await ctx.task(portfolioBalanceTask, {
    organizationName,
    bcgClassification,
    cashFlowAnalysis,
    outputDir
  });

  artifacts.push(...portfolioBalance.artifacts);

  // ============================================================================
  // PHASE 6: STRATEGIC RECOMMENDATIONS
  // ============================================================================

  ctx.log('info', 'Phase 6: Developing strategic recommendations for each quadrant');
  const strategicRecommendations = await ctx.task(bcgStrategicRecommendationsTask, {
    organizationName,
    bcgClassification,
    portfolioBalance,
    cashFlowAnalysis,
    outputDir
  });

  artifacts.push(...strategicRecommendations.artifacts);

  // ============================================================================
  // PHASE 7: RESOURCE ALLOCATION PLAN
  // ============================================================================

  ctx.log('info', 'Phase 7: Creating resource allocation plan');
  const resourceAllocation = await ctx.task(resourceAllocationTask, {
    organizationName,
    bcgClassification,
    strategicRecommendations,
    financialData,
    outputDir
  });

  artifacts.push(...resourceAllocation.artifacts);

  // ============================================================================
  // PHASE 8: GENERATE COMPREHENSIVE REPORT
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating comprehensive BCG Portfolio report');
  const bcgReport = await ctx.task(bcgReportTask, {
    organizationName,
    marketGrowthAnalysis,
    marketShareAnalysis,
    bcgClassification,
    cashFlowAnalysis,
    portfolioBalance,
    strategicRecommendations,
    resourceAllocation,
    outputDir
  });

  artifacts.push(...bcgReport.artifacts);

  // Breakpoint: Review BCG Portfolio analysis
  await ctx.breakpoint({
    question: `BCG Portfolio analysis complete for ${organizationName}. Portfolio balance: ${portfolioBalance.balanceScore}/100. Review and approve?`,
    title: 'BCG Portfolio Analysis Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        organizationName,
        bcgDistribution: {
          stars: bcgClassification.stars?.length || 0,
          cashCows: bcgClassification.cashCows?.length || 0,
          questionMarks: bcgClassification.questionMarks?.length || 0,
          dogs: bcgClassification.dogs?.length || 0
        },
        portfolioBalanceScore: portfolioBalance.balanceScore
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    organizationName,
    bcgMatrix: {
      stars: bcgClassification.stars,
      cashCows: bcgClassification.cashCows,
      questionMarks: bcgClassification.questionMarks,
      dogs: bcgClassification.dogs
    },
    portfolioBalance: portfolioBalance.assessment,
    resourceAllocation: resourceAllocation.plan,
    strategicRecommendations: strategicRecommendations.recommendations,
    reportPath: bcgReport.reportPath,
    artifacts,
    duration,
    metadata: {
      processId: 'business-strategy/bcg-portfolio-analysis',
      timestamp: startTime,
      organizationName,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Market Growth Rate Analysis
export const marketGrowthAnalysisTask = defineTask('market-growth-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze market growth rates',
  agent: {
    name: 'market-growth-analyst',
    prompt: {
      role: 'market analysis specialist',
      task: 'Analyze market growth rates for each business unit',
      context: args,
      instructions: [
        'Calculate market growth rate for each business unit\'s market',
        'Determine average industry growth rate as baseline',
        'Classify markets as high growth (above average) or low growth (below average)',
        'Project growth trajectories for each market',
        'Identify market lifecycle stage for each unit',
        'Assess sustainability of growth rates',
        'Generate market growth analysis report'
      ],
      outputFormat: 'JSON with growthRates (array with unit, market, growthRate, classification), averageGrowth, highGrowthThreshold, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['growthRates', 'artifacts'],
      properties: {
        growthRates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              unit: { type: 'string' },
              market: { type: 'string' },
              growthRate: { type: 'number' },
              classification: { type: 'string', enum: ['high', 'low'] }
            }
          }
        },
        averageGrowth: { type: 'number' },
        highGrowthThreshold: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'bcg', 'market-growth']
}));

// Task 2: Market Share Analysis
export const marketShareAnalysisTask = defineTask('market-share-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze relative market share',
  agent: {
    name: 'market-share-analyst',
    prompt: {
      role: 'competitive position analyst',
      task: 'Analyze relative market share for each business unit',
      context: args,
      instructions: [
        'Calculate market share for each business unit',
        'Identify largest competitor for each unit',
        'Calculate relative market share (our share / largest competitor share)',
        'Classify as high share (RMS > 1.0) or low share (RMS < 1.0)',
        'Analyze market share trends over time',
        'Assess competitive position strength',
        'Generate market share analysis report'
      ],
      outputFormat: 'JSON with shareAnalysis (array with unit, marketShare, largestCompetitor, relativeShare, classification), shareThreshold, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['shareAnalysis', 'artifacts'],
      properties: {
        shareAnalysis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              unit: { type: 'string' },
              marketShare: { type: 'number' },
              largestCompetitor: { type: 'string' },
              competitorShare: { type: 'number' },
              relativeShare: { type: 'number' },
              classification: { type: 'string', enum: ['high', 'low'] }
            }
          }
        },
        shareThreshold: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'bcg', 'market-share']
}));

// Task 3: BCG Matrix Classification
export const bcgClassificationTask = defineTask('bcg-classification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Classify business units on BCG matrix',
  agent: {
    name: 'bcg-classifier',
    prompt: {
      role: 'portfolio analyst',
      task: 'Classify business units into BCG matrix quadrants',
      context: args,
      instructions: [
        'Stars: High growth, High share - invest for future growth',
        'Cash Cows: Low growth, High share - harvest for cash generation',
        'Question Marks: High growth, Low share - selective investment needed',
        'Dogs: Low growth, Low share - divest or restructure',
        'Plot each business unit on BCG matrix',
        'Size bubbles by revenue or assets',
        'Analyze position within each quadrant',
        'Generate BCG matrix visualization'
      ],
      outputFormat: 'JSON with stars, cashCows, questionMarks, dogs (arrays with unit details), bcgMatrix (full classification), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['stars', 'cashCows', 'questionMarks', 'dogs', 'artifacts'],
      properties: {
        stars: { type: 'array', items: { type: 'object' } },
        cashCows: { type: 'array', items: { type: 'object' } },
        questionMarks: { type: 'array', items: { type: 'object' } },
        dogs: { type: 'array', items: { type: 'object' } },
        bcgMatrix: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'bcg', 'classification']
}));

// Task 4: Cash Flow Analysis
export const cashFlowAnalysisTask = defineTask('cash-flow-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze cash flow by BCG category',
  agent: {
    name: 'cash-flow-analyst',
    prompt: {
      role: 'financial analyst',
      task: 'Analyze cash flow characteristics by BCG category',
      context: args,
      instructions: [
        'Analyze cash generation from Cash Cows',
        'Analyze cash consumption by Stars',
        'Analyze investment needs for Question Marks',
        'Analyze cash drain from Dogs',
        'Calculate net cash flow by category',
        'Assess cash self-sufficiency of portfolio',
        'Identify funding gaps and surpluses',
        'Generate cash flow analysis report'
      ],
      outputFormat: 'JSON with cashFlowByCategory, netCashFlow, cashSelfSufficiency, fundingGaps, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['cashFlowByCategory', 'netCashFlow', 'artifacts'],
      properties: {
        cashFlowByCategory: {
          type: 'object',
          properties: {
            stars: { type: 'object' },
            cashCows: { type: 'object' },
            questionMarks: { type: 'object' },
            dogs: { type: 'object' }
          }
        },
        netCashFlow: { type: 'number' },
        cashSelfSufficiency: { type: 'boolean' },
        fundingGaps: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'bcg', 'cash-flow']
}));

// Task 5: Portfolio Balance Assessment
export const portfolioBalanceTask = defineTask('portfolio-balance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess portfolio balance',
  agent: {
    name: 'portfolio-analyst',
    prompt: {
      role: 'portfolio strategy specialist',
      task: 'Assess overall portfolio balance and health',
      context: args,
      instructions: [
        'Assess balance across BCG quadrants',
        'Evaluate succession pipeline (Question Marks -> Stars -> Cash Cows)',
        'Identify portfolio gaps (missing quadrant representation)',
        'Assess portfolio age and lifecycle balance',
        'Evaluate revenue concentration risk',
        'Calculate portfolio balance score (0-100)',
        'Identify portfolio restructuring needs',
        'Generate portfolio balance assessment report'
      ],
      outputFormat: 'JSON with assessment, balanceScore, successionPipeline, gaps, risks, restructuringNeeds, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['assessment', 'balanceScore', 'artifacts'],
      properties: {
        assessment: { type: 'object' },
        balanceScore: { type: 'number', minimum: 0, maximum: 100 },
        successionPipeline: { type: 'object' },
        gaps: { type: 'array', items: { type: 'string' } },
        risks: { type: 'array', items: { type: 'string' } },
        restructuringNeeds: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'bcg', 'portfolio-balance']
}));

// Task 6: Strategic Recommendations
export const bcgStrategicRecommendationsTask = defineTask('bcg-strategic-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop strategic recommendations for each quadrant',
  agent: {
    name: 'strategy-advisor',
    prompt: {
      role: 'portfolio strategy advisor',
      task: 'Develop strategic recommendations for each BCG category',
      context: args,
      instructions: [
        'Stars: Recommend investment strategies for continued growth',
        'Cash Cows: Recommend harvesting strategies and efficiency improvements',
        'Question Marks: Recommend invest or divest decisions',
        'Dogs: Recommend turnaround, divest, or liquidation strategies',
        'Prioritize recommendations by impact',
        'Identify synergies between units',
        'Recommend portfolio rebalancing actions',
        'Generate strategic recommendations report'
      ],
      outputFormat: 'JSON with recommendations (by category), prioritizedActions, synergies, rebalancingActions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'artifacts'],
      properties: {
        recommendations: {
          type: 'object',
          properties: {
            stars: { type: 'array', items: { type: 'object' } },
            cashCows: { type: 'array', items: { type: 'object' } },
            questionMarks: { type: 'array', items: { type: 'object' } },
            dogs: { type: 'array', items: { type: 'object' } }
          }
        },
        prioritizedActions: { type: 'array', items: { type: 'string' } },
        synergies: { type: 'array', items: { type: 'object' } },
        rebalancingActions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'bcg', 'strategic-recommendations']
}));

// Task 7: Resource Allocation Plan
export const resourceAllocationTask = defineTask('resource-allocation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create resource allocation plan',
  agent: {
    name: 'resource-allocator',
    prompt: {
      role: 'resource allocation strategist',
      task: 'Create resource allocation plan based on BCG analysis',
      context: args,
      instructions: [
        'Allocate investment capital by BCG category',
        'Direct cash flows from Cash Cows to Stars and Question Marks',
        'Define resource reallocation from Dogs',
        'Prioritize capital allocation to high-priority units',
        'Define performance metrics for each unit',
        'Create allocation timeline',
        'Identify quick wins and long-term investments',
        'Generate resource allocation plan document'
      ],
      outputFormat: 'JSON with plan, capitalAllocation, cashFlowDirection, timeline, metrics, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'capitalAllocation', 'artifacts'],
      properties: {
        plan: { type: 'object' },
        capitalAllocation: { type: 'object' },
        cashFlowDirection: { type: 'object' },
        timeline: { type: 'object' },
        metrics: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'bcg', 'resource-allocation']
}));

// Task 8: BCG Report Generation
export const bcgReportTask = defineTask('bcg-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive BCG Portfolio report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'portfolio strategy report author',
      task: 'Generate comprehensive BCG Portfolio analysis report',
      context: args,
      instructions: [
        'Create executive summary with key findings',
        'Present BCG matrix visualization',
        'Document classification rationale for each unit',
        'Include cash flow analysis',
        'Present portfolio balance assessment',
        'Document strategic recommendations',
        'Include resource allocation plan',
        'Add implementation roadmap',
        'Format as professional Markdown report',
        'Save report to output directory'
      ],
      outputFormat: 'JSON with reportPath, executiveSummary, keyFindings, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummary', 'keyFindings', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'bcg', 'reporting']
}));
