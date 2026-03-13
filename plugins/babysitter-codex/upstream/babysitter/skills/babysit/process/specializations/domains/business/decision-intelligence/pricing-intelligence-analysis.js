/**
 * @process specializations/domains/business/decision-intelligence/pricing-intelligence-analysis
 * @description Pricing Intelligence Analysis - Systematic monitoring and analysis of market pricing dynamics,
 * competitor pricing strategies, and price elasticity factors.
 * @inputs { projectName: string, productContext: object, competitors: array, marketContext?: object, dataAccess?: object }
 * @outputs { success: boolean, pricingLandscape: object, competitorPricing: object, elasticityAnalysis: object, pricingRecommendations: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/decision-intelligence/pricing-intelligence-analysis', {
 *   projectName: 'SaaS Pricing Intelligence',
 *   productContext: { category: 'Enterprise Software', model: 'Subscription' },
 *   competitors: ['Competitor A', 'Competitor B', 'Competitor C'],
 *   marketContext: { segment: 'Enterprise', geography: 'North America' }
 * });
 *
 * @references
 * - Bain Pricing Excellence: https://www.bain.com/insights/
 * - Price Intelligently: https://www.priceintelligently.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    productContext = {},
    competitors = [],
    marketContext = {},
    dataAccess = {},
    outputDir = 'pricing-intelligence-output'
  } = inputs;

  // Phase 1: Pricing Data Collection Strategy
  const dataCollectionStrategy = await ctx.task(pricingDataCollectionTask, {
    projectName,
    productContext,
    competitors,
    dataAccess
  });

  // Phase 2: Competitor Pricing Analysis
  const competitorPricingAnalysis = await ctx.task(competitorPricingTask, {
    projectName,
    competitors,
    productContext,
    dataCollectionStrategy
  });

  // Phase 3: Pricing Model Analysis
  const pricingModelAnalysis = await ctx.task(pricingModelTask, {
    projectName,
    competitorPricingAnalysis,
    productContext
  });

  // Phase 4: Value Metrics Analysis
  const valueMetricsAnalysis = await ctx.task(valueMetricsTask, {
    projectName,
    competitorPricingAnalysis,
    pricingModelAnalysis,
    productContext
  });

  // Phase 5: Price Elasticity Analysis
  const elasticityAnalysis = await ctx.task(elasticityAnalysisTask, {
    projectName,
    productContext,
    marketContext,
    competitorPricingAnalysis
  });

  // Breakpoint: Review pricing intelligence
  await ctx.breakpoint({
    question: `Review pricing intelligence analysis for ${projectName}. Are the competitive insights accurate?`,
    title: 'Pricing Intelligence Review',
    context: {
      runId: ctx.runId,
      projectName,
      competitorCount: competitors.length,
      pricingModels: pricingModelAnalysis.models?.length || 0
    }
  });

  // Phase 6: Pricing Opportunity Identification
  const opportunityAnalysis = await ctx.task(pricingOpportunityTask, {
    projectName,
    competitorPricingAnalysis,
    elasticityAnalysis,
    valueMetricsAnalysis
  });

  // Phase 7: Pricing Recommendations
  const pricingRecommendations = await ctx.task(pricingRecommendationsTask, {
    projectName,
    competitorPricingAnalysis,
    elasticityAnalysis,
    opportunityAnalysis,
    productContext
  });

  // Phase 8: Monitoring System Setup
  const monitoringSystem = await ctx.task(pricingMonitoringTask, {
    projectName,
    competitors,
    dataCollectionStrategy,
    productContext
  });

  return {
    success: true,
    projectName,
    dataCollectionStrategy,
    pricingLandscape: {
      competitorPricing: competitorPricingAnalysis,
      pricingModels: pricingModelAnalysis,
      valueMetrics: valueMetricsAnalysis
    },
    competitorPricing: competitorPricingAnalysis,
    elasticityAnalysis,
    opportunityAnalysis,
    pricingRecommendations,
    monitoringSystem,
    metadata: {
      processId: 'specializations/domains/business/decision-intelligence/pricing-intelligence-analysis',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const pricingDataCollectionTask = defineTask('pricing-data-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Pricing Data Collection Strategy - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Pricing Intelligence Analyst',
      task: 'Design pricing data collection strategy',
      context: args,
      instructions: [
        '1. Identify pricing data sources (public, scraped, subscribed)',
        '2. Design competitor price monitoring approach',
        '3. Plan promotional and discount tracking',
        '4. Identify channel-specific pricing needs',
        '5. Design data quality validation',
        '6. Plan historical pricing data collection',
        '7. Define data refresh frequency',
        '8. Document ethical and legal considerations'
      ],
      outputFormat: 'JSON object with data collection strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['sources', 'methods', 'frequency'],
      properties: {
        sources: { type: 'array' },
        methods: { type: 'array' },
        monitoring: { type: 'object' },
        frequency: { type: 'object' },
        validation: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'pricing', 'data-collection']
}));

export const competitorPricingTask = defineTask('competitor-pricing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Competitor Pricing Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Competitive Pricing Analyst',
      task: 'Analyze competitor pricing strategies and positions',
      context: args,
      instructions: [
        '1. Document competitor price points',
        '2. Analyze pricing tiers and packages',
        '3. Track promotional and discount patterns',
        '4. Identify pricing positioning (premium, value, economy)',
        '5. Analyze pricing changes over time',
        '6. Map feature-price relationships',
        '7. Compare price-value ratios',
        '8. Identify pricing anomalies and outliers'
      ],
      outputFormat: 'JSON object with competitor pricing analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['pricePoints', 'positioning', 'trends'],
      properties: {
        pricePoints: { type: 'object' },
        tiers: { type: 'object' },
        promotions: { type: 'array' },
        positioning: { type: 'object' },
        trends: { type: 'array' },
        featurePricing: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'pricing', 'competitive']
}));

export const pricingModelTask = defineTask('pricing-model', (args, taskCtx) => ({
  kind: 'agent',
  title: `Pricing Model Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Pricing Strategy Expert',
      task: 'Analyze pricing models and structures in the market',
      context: args,
      instructions: [
        '1. Identify pricing models (subscription, usage, perpetual)',
        '2. Analyze pricing metrics and units',
        '3. Evaluate tiering strategies',
        '4. Analyze bundling approaches',
        '5. Identify freemium strategies',
        '6. Analyze contract terms and commitments',
        '7. Evaluate pricing complexity',
        '8. Identify innovative pricing approaches'
      ],
      outputFormat: 'JSON object with pricing model analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['models', 'metrics', 'tiering'],
      properties: {
        models: { type: 'array' },
        metrics: { type: 'array' },
        tiering: { type: 'object' },
        bundling: { type: 'object' },
        contracts: { type: 'object' },
        innovations: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'pricing', 'models']
}));

export const valueMetricsTask = defineTask('value-metrics', (args, taskCtx) => ({
  kind: 'agent',
  title: `Value Metrics Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Value-Based Pricing Expert',
      task: 'Analyze value metrics and customer value drivers',
      context: args,
      instructions: [
        '1. Identify value metrics used in pricing',
        '2. Analyze value metric alignment with customer value',
        '3. Evaluate metric scalability and fairness',
        '4. Compare value metric effectiveness',
        '5. Identify emerging value metrics',
        '6. Analyze customer perception of value',
        '7. Evaluate metric predictability',
        '8. Recommend optimal value metrics'
      ],
      outputFormat: 'JSON object with value metrics analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['valueMetrics', 'alignment', 'recommendations'],
      properties: {
        valueMetrics: { type: 'array' },
        alignment: { type: 'object' },
        effectiveness: { type: 'object' },
        perception: { type: 'object' },
        recommendations: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'pricing', 'value']
}));

export const elasticityAnalysisTask = defineTask('elasticity-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Price Elasticity Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Pricing Economics Analyst',
      task: 'Analyze price elasticity and demand sensitivity',
      context: args,
      instructions: [
        '1. Estimate price elasticity of demand',
        '2. Analyze elasticity by segment',
        '3. Evaluate cross-price elasticity',
        '4. Assess promotional response curves',
        '5. Analyze willingness to pay distributions',
        '6. Identify price thresholds and barriers',
        '7. Model demand curves',
        '8. Assess competitive response dynamics'
      ],
      outputFormat: 'JSON object with elasticity analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['elasticity', 'segmentAnalysis', 'demandCurves'],
      properties: {
        elasticity: { type: 'object' },
        segmentAnalysis: { type: 'object' },
        crossElasticity: { type: 'object' },
        willingnessToPay: { type: 'object' },
        demandCurves: { type: 'array' },
        thresholds: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'pricing', 'elasticity']
}));

export const pricingOpportunityTask = defineTask('pricing-opportunity', (args, taskCtx) => ({
  kind: 'agent',
  title: `Pricing Opportunity Identification - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Pricing Opportunity Analyst',
      task: 'Identify pricing opportunities and gaps',
      context: args,
      instructions: [
        '1. Identify price gap opportunities',
        '2. Analyze under-monetized segments',
        '3. Identify packaging optimization opportunities',
        '4. Evaluate promotional effectiveness gaps',
        '5. Identify value extraction opportunities',
        '6. Analyze competitive response opportunities',
        '7. Identify pricing leakage areas',
        '8. Quantify opportunity value'
      ],
      outputFormat: 'JSON object with pricing opportunities'
    },
    outputSchema: {
      type: 'object',
      required: ['opportunities', 'gaps', 'value'],
      properties: {
        opportunities: { type: 'array' },
        gaps: { type: 'array' },
        packaging: { type: 'array' },
        leakage: { type: 'array' },
        value: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'pricing', 'opportunities']
}));

export const pricingRecommendationsTask = defineTask('pricing-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: `Pricing Recommendations - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Pricing Strategy Consultant',
      task: 'Develop pricing strategy recommendations',
      context: args,
      instructions: [
        '1. Synthesize pricing intelligence insights',
        '2. Recommend pricing positioning',
        '3. Suggest pricing model optimization',
        '4. Recommend tiering and packaging changes',
        '5. Suggest competitive response strategies',
        '6. Define implementation roadmap',
        '7. Model revenue impact scenarios',
        '8. Identify risks and mitigations'
      ],
      outputFormat: 'JSON object with pricing recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'impact', 'roadmap'],
      properties: {
        recommendations: { type: 'array' },
        positioning: { type: 'object' },
        modelChanges: { type: 'array' },
        impact: { type: 'object' },
        roadmap: { type: 'object' },
        risks: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'pricing', 'recommendations']
}));

export const pricingMonitoringTask = defineTask('pricing-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Pricing Monitoring System Setup - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Pricing Monitoring Specialist',
      task: 'Design ongoing pricing monitoring system',
      context: args,
      instructions: [
        '1. Define monitoring scope and competitors',
        '2. Configure price tracking automation',
        '3. Set up price change alerts',
        '4. Design pricing dashboard',
        '5. Plan reporting cadence',
        '6. Define escalation triggers',
        '7. Plan competitive response protocols',
        '8. Design effectiveness measurement'
      ],
      outputFormat: 'JSON object with monitoring system'
    },
    outputSchema: {
      type: 'object',
      required: ['monitoring', 'alerts', 'reporting'],
      properties: {
        monitoring: { type: 'object' },
        automation: { type: 'object' },
        alerts: { type: 'array' },
        dashboard: { type: 'object' },
        reporting: { type: 'object' },
        protocols: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'pricing', 'monitoring']
}));
