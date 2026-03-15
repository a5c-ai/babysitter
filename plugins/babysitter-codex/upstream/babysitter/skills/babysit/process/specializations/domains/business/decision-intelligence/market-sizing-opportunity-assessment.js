/**
 * @process specializations/domains/business/decision-intelligence/market-sizing-opportunity-assessment
 * @description Market Sizing and Opportunity Assessment - Quantitative methodology for estimating total
 * addressable market, serviceable addressable market, and market opportunity prioritization.
 * @inputs { projectName: string, marketContext: object, products?: array, geographies?: array, segments?: array }
 * @outputs { success: boolean, tamAnalysis: object, samAnalysis: object, somAnalysis: object, opportunityPrioritization: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/decision-intelligence/market-sizing-opportunity-assessment', {
 *   projectName: 'Cloud Security Market Sizing',
 *   marketContext: { industry: 'Cybersecurity', subSegment: 'Cloud Security' },
 *   geographies: ['North America', 'Europe', 'APAC'],
 *   segments: ['Enterprise', 'Mid-Market', 'SMB']
 * });
 *
 * @references
 * - McKinsey Market Sizing: https://www.mckinsey.com/business-functions/mckinsey-analytics/our-insights
 * - TAM SAM SOM Framework: Business Strategy Fundamentals
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    marketContext = {},
    products = [],
    geographies = [],
    segments = [],
    outputDir = 'market-sizing-output'
  } = inputs;

  // Phase 1: Market Definition and Scoping
  const marketDefinition = await ctx.task(marketDefinitionTask, {
    projectName,
    marketContext,
    products,
    geographies,
    segments
  });

  // Phase 2: Data Source Identification
  const dataSources = await ctx.task(dataSourceIdentificationTask, {
    projectName,
    marketDefinition,
    marketContext
  });

  // Phase 3: TAM (Total Addressable Market) Analysis
  const tamAnalysis = await ctx.task(tamAnalysisTask, {
    projectName,
    marketDefinition,
    dataSources,
    geographies
  });

  // Phase 4: SAM (Serviceable Addressable Market) Analysis
  const samAnalysis = await ctx.task(samAnalysisTask, {
    projectName,
    tamAnalysis,
    marketDefinition,
    products,
    segments
  });

  // Phase 5: SOM (Serviceable Obtainable Market) Analysis
  const somAnalysis = await ctx.task(somAnalysisTask, {
    projectName,
    samAnalysis,
    marketContext
  });

  // Breakpoint: Review market sizing
  await ctx.breakpoint({
    question: `Review market sizing analysis for ${projectName}. Are the estimates well-supported?`,
    title: 'Market Sizing Review',
    context: {
      runId: ctx.runId,
      projectName,
      tam: tamAnalysis.totalMarket,
      sam: samAnalysis.serviceableMarket,
      som: somAnalysis.obtainableMarket
    }
  });

  // Phase 6: Market Growth Analysis
  const growthAnalysis = await ctx.task(growthAnalysisTask, {
    projectName,
    tamAnalysis,
    samAnalysis,
    marketContext
  });

  // Phase 7: Opportunity Prioritization
  const opportunityPrioritization = await ctx.task(opportunityPrioritizationTask, {
    projectName,
    tamAnalysis,
    samAnalysis,
    somAnalysis,
    growthAnalysis,
    segments,
    geographies
  });

  // Phase 8: Strategic Recommendations
  const strategicRecommendations = await ctx.task(marketStrategyRecommendationsTask, {
    projectName,
    opportunityPrioritization,
    marketDefinition,
    growthAnalysis
  });

  return {
    success: true,
    projectName,
    marketDefinition,
    dataSources,
    tamAnalysis,
    samAnalysis,
    somAnalysis,
    growthAnalysis,
    opportunityPrioritization,
    strategicRecommendations,
    metadata: {
      processId: 'specializations/domains/business/decision-intelligence/market-sizing-opportunity-assessment',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const marketDefinitionTask = defineTask('market-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Market Definition and Scoping - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Market Research Strategist',
      task: 'Define and scope the market for sizing analysis',
      context: args,
      instructions: [
        '1. Define market boundaries and scope',
        '2. Identify relevant product/service categories',
        '3. Define customer segments to include',
        '4. Specify geographic boundaries',
        '5. Identify adjacent and substitute markets',
        '6. Define market lifecycle stage',
        '7. Document market inclusion/exclusion criteria',
        '8. Create market taxonomy and structure'
      ],
      outputFormat: 'JSON object with market definition'
    },
    outputSchema: {
      type: 'object',
      required: ['scope', 'segments', 'boundaries'],
      properties: {
        scope: { type: 'object' },
        segments: { type: 'array' },
        boundaries: { type: 'object' },
        taxonomy: { type: 'object' },
        adjacentMarkets: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'market-sizing', 'definition']
}));

export const dataSourceIdentificationTask = defineTask('data-source-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Data Source Identification - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Market Research Data Specialist',
      task: 'Identify and assess data sources for market sizing',
      context: args,
      instructions: [
        '1. Identify primary research opportunities',
        '2. Catalog secondary research sources',
        '3. Identify industry analyst reports',
        '4. Find government and census data',
        '5. Identify trade association data',
        '6. Assess data quality and reliability',
        '7. Identify data gaps and limitations',
        '8. Plan triangulation methodology'
      ],
      outputFormat: 'JSON object with data sources'
    },
    outputSchema: {
      type: 'object',
      required: ['primarySources', 'secondarySources', 'triangulation'],
      properties: {
        primarySources: { type: 'array' },
        secondarySources: { type: 'array' },
        analystReports: { type: 'array' },
        governmentData: { type: 'array' },
        dataQuality: { type: 'object' },
        triangulation: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'market-sizing', 'data-sources']
}));

export const tamAnalysisTask = defineTask('tam-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `TAM Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Market Sizing Analyst',
      task: 'Calculate Total Addressable Market using multiple methodologies',
      context: args,
      instructions: [
        '1. Apply top-down market sizing approach',
        '2. Apply bottom-up market sizing approach',
        '3. Apply value-theory market sizing',
        '4. Segment TAM by geography',
        '5. Segment TAM by customer type',
        '6. Segment TAM by product category',
        '7. Triangulate estimates and reconcile',
        '8. Document assumptions and sensitivities'
      ],
      outputFormat: 'JSON object with TAM analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['totalMarket', 'methodology', 'segmentation'],
      properties: {
        totalMarket: { type: 'number' },
        topDownEstimate: { type: 'number' },
        bottomUpEstimate: { type: 'number' },
        methodology: { type: 'object' },
        segmentation: { type: 'object' },
        assumptions: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'market-sizing', 'tam']
}));

export const samAnalysisTask = defineTask('sam-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `SAM Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Market Sizing Analyst',
      task: 'Calculate Serviceable Addressable Market',
      context: args,
      instructions: [
        '1. Apply product/service fit filters to TAM',
        '2. Apply geographic reach constraints',
        '3. Apply channel capability constraints',
        '4. Apply regulatory and compliance filters',
        '5. Apply technology compatibility filters',
        '6. Segment SAM by priority segments',
        '7. Calculate SAM as percentage of TAM',
        '8. Document filtering criteria and rationale'
      ],
      outputFormat: 'JSON object with SAM analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['serviceableMarket', 'filters', 'segmentation'],
      properties: {
        serviceableMarket: { type: 'number' },
        percentageOfTam: { type: 'number' },
        filters: { type: 'array' },
        segmentation: { type: 'object' },
        rationale: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'market-sizing', 'sam']
}));

export const somAnalysisTask = defineTask('som-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `SOM Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Market Sizing Analyst',
      task: 'Calculate Serviceable Obtainable Market',
      context: args,
      instructions: [
        '1. Analyze competitive dynamics and market share',
        '2. Assess current market position and penetration',
        '3. Evaluate sales and marketing capacity',
        '4. Apply realistic growth rate assumptions',
        '5. Consider competitive response scenarios',
        '6. Calculate realistic market share targets',
        '7. Project SOM over planning horizon',
        '8. Develop best/base/worst case scenarios'
      ],
      outputFormat: 'JSON object with SOM analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['obtainableMarket', 'marketShareTarget', 'scenarios'],
      properties: {
        obtainableMarket: { type: 'number' },
        percentageOfSam: { type: 'number' },
        marketShareTarget: { type: 'number' },
        scenarios: { type: 'object' },
        projections: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'market-sizing', 'som']
}));

export const growthAnalysisTask = defineTask('growth-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Market Growth Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Market Growth Analyst',
      task: 'Analyze market growth dynamics and projections',
      context: args,
      instructions: [
        '1. Analyze historical market growth rates',
        '2. Identify growth drivers and headwinds',
        '3. Project market CAGR by segment',
        '4. Identify high-growth segments',
        '5. Analyze market lifecycle position',
        '6. Assess disruption and substitution risks',
        '7. Create growth scenarios',
        '8. Identify inflection points'
      ],
      outputFormat: 'JSON object with growth analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['historicalGrowth', 'projectedGrowth', 'drivers'],
      properties: {
        historicalGrowth: { type: 'object' },
        projectedGrowth: { type: 'object' },
        cagr: { type: 'number' },
        drivers: { type: 'array' },
        headwinds: { type: 'array' },
        scenarios: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'market-sizing', 'growth']
}));

export const opportunityPrioritizationTask = defineTask('opportunity-prioritization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Opportunity Prioritization - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Strategic Market Analyst',
      task: 'Prioritize market opportunities based on attractiveness',
      context: args,
      instructions: [
        '1. Define opportunity attractiveness criteria',
        '2. Score segments on market size',
        '3. Score segments on growth rate',
        '4. Score segments on competitive intensity',
        '5. Score segments on strategic fit',
        '6. Create opportunity attractiveness matrix',
        '7. Rank and prioritize opportunities',
        '8. Recommend focus areas and sequencing'
      ],
      outputFormat: 'JSON object with opportunity prioritization'
    },
    outputSchema: {
      type: 'object',
      required: ['criteria', 'scores', 'prioritization'],
      properties: {
        criteria: { type: 'array' },
        scores: { type: 'object' },
        matrix: { type: 'object' },
        prioritization: { type: 'array' },
        recommendations: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'market-sizing', 'prioritization']
}));

export const marketStrategyRecommendationsTask = defineTask('market-strategy-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: `Strategic Recommendations - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Market Strategy Consultant',
      task: 'Develop strategic recommendations from market sizing analysis',
      context: args,
      instructions: [
        '1. Synthesize key market insights',
        '2. Define target market strategy',
        '3. Recommend segment prioritization',
        '4. Define geographic expansion sequence',
        '5. Recommend product/market fit priorities',
        '6. Define competitive positioning strategy',
        '7. Recommend investment levels',
        '8. Create strategic action plan'
      ],
      outputFormat: 'JSON object with strategic recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['insights', 'recommendations', 'actionPlan'],
      properties: {
        insights: { type: 'array' },
        targetStrategy: { type: 'object' },
        segmentPriorities: { type: 'array' },
        recommendations: { type: 'array' },
        investmentLevels: { type: 'object' },
        actionPlan: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'market-sizing', 'strategy']
}));
