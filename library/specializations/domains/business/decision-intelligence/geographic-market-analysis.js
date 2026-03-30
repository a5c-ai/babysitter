/**
 * @process specializations/domains/business/decision-intelligence/geographic-market-analysis
 * @description Geographic Market Analysis - Assessment of geographic markets for expansion opportunities including
 * market attractiveness, competitive intensity, and entry barriers.
 * @inputs { projectName: string, candidateMarkets: array, evaluationCriteria?: object, productContext?: object, constraints?: object }
 * @outputs { success: boolean, marketAssessments: array, attractivenessRanking: array, entryStrategy: object, implementationPlan: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/decision-intelligence/geographic-market-analysis', {
 *   projectName: 'APAC Market Expansion Analysis',
 *   candidateMarkets: ['Japan', 'Singapore', 'Australia', 'India'],
 *   productContext: { category: 'Enterprise SaaS' },
 *   evaluationCriteria: { minMarketSize: '$100M', maxCompetitiveIntensity: 'medium' }
 * });
 *
 * @references
 * - IDC Regional Market Analysis: https://www.idc.com/
 * - Market Entry Strategy Frameworks
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    candidateMarkets = [],
    evaluationCriteria = {},
    productContext = {},
    constraints = {},
    outputDir = 'geographic-analysis-output'
  } = inputs;

  // Phase 1: Market Screening
  const marketScreening = await ctx.task(marketScreeningTask, {
    projectName,
    candidateMarkets,
    evaluationCriteria,
    productContext
  });

  // Phase 2: Market Sizing by Geography
  const marketSizing = await ctx.task(geographicSizingTask, {
    projectName,
    candidateMarkets: marketScreening.shortlistedMarkets,
    productContext
  });

  // Phase 3: Competitive Landscape Analysis
  const competitiveLandscape = await ctx.task(competitiveLandscapeTask, {
    projectName,
    candidateMarkets: marketScreening.shortlistedMarkets,
    productContext
  });

  // Phase 4: Entry Barriers Assessment
  const entryBarriers = await ctx.task(entryBarriersTask, {
    projectName,
    candidateMarkets: marketScreening.shortlistedMarkets,
    productContext,
    constraints
  });

  // Phase 5: Regulatory and Compliance Analysis
  const regulatoryAnalysis = await ctx.task(regulatoryAnalysisTask, {
    projectName,
    candidateMarkets: marketScreening.shortlistedMarkets,
    productContext
  });

  // Breakpoint: Review market assessments
  await ctx.breakpoint({
    question: `Review geographic market assessments for ${projectName}. Are the analyses comprehensive?`,
    title: 'Market Assessment Review',
    context: {
      runId: ctx.runId,
      projectName,
      marketCount: marketScreening.shortlistedMarkets?.length || 0
    }
  });

  // Phase 6: Market Attractiveness Scoring
  const attractivenessScoring = await ctx.task(attractivenessScoringTask, {
    projectName,
    marketSizing,
    competitiveLandscape,
    entryBarriers,
    regulatoryAnalysis,
    evaluationCriteria
  });

  // Phase 7: Entry Strategy Development
  const entryStrategy = await ctx.task(entryStrategyTask, {
    projectName,
    attractivenessScoring,
    entryBarriers,
    constraints
  });

  // Phase 8: Implementation Planning
  const implementationPlan = await ctx.task(geographicImplementationTask, {
    projectName,
    entryStrategy,
    attractivenessScoring,
    constraints
  });

  return {
    success: true,
    projectName,
    marketScreening,
    marketAssessments: {
      sizing: marketSizing,
      competitive: competitiveLandscape,
      barriers: entryBarriers,
      regulatory: regulatoryAnalysis
    },
    attractivenessRanking: attractivenessScoring.rankings,
    entryStrategy,
    implementationPlan,
    metadata: {
      processId: 'specializations/domains/business/decision-intelligence/geographic-market-analysis',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const marketScreeningTask = defineTask('market-screening', (args, taskCtx) => ({
  kind: 'agent',
  title: `Market Screening - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Market Screening Analyst',
      task: 'Screen candidate markets using initial criteria',
      context: args,
      instructions: [
        '1. Apply minimum market size thresholds',
        '2. Assess basic market accessibility',
        '3. Evaluate political and economic stability',
        '4. Check regulatory feasibility',
        '5. Assess currency and financial risks',
        '6. Evaluate language and cultural distance',
        '7. Check infrastructure readiness',
        '8. Create shortlist of viable markets'
      ],
      outputFormat: 'JSON object with market screening results'
    },
    outputSchema: {
      type: 'object',
      required: ['shortlistedMarkets', 'screeningCriteria', 'eliminated'],
      properties: {
        shortlistedMarkets: { type: 'array' },
        screeningCriteria: { type: 'array' },
        eliminated: { type: 'array' },
        rationale: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'geographic', 'screening']
}));

export const geographicSizingTask = defineTask('geographic-sizing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Market Sizing by Geography - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Market Sizing Analyst',
      task: 'Size markets for each candidate geography',
      context: args,
      instructions: [
        '1. Estimate TAM per market',
        '2. Estimate SAM per market',
        '3. Project market growth rates',
        '4. Identify market maturity stage',
        '5. Analyze segment composition',
        '6. Assess seasonality and cyclicality',
        '7. Compare relative market sizes',
        '8. Document data sources and assumptions'
      ],
      outputFormat: 'JSON object with market sizing'
    },
    outputSchema: {
      type: 'object',
      required: ['marketSizes', 'growth', 'maturity'],
      properties: {
        marketSizes: { type: 'object' },
        tam: { type: 'object' },
        sam: { type: 'object' },
        growth: { type: 'object' },
        maturity: { type: 'object' },
        assumptions: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'geographic', 'sizing']
}));

export const competitiveLandscapeTask = defineTask('competitive-landscape', (args, taskCtx) => ({
  kind: 'agent',
  title: `Competitive Landscape Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Competitive Analyst',
      task: 'Analyze competitive landscape in each market',
      context: args,
      instructions: [
        '1. Identify key competitors per market',
        '2. Analyze market share distribution',
        '3. Assess competitive intensity',
        '4. Identify local vs global competitors',
        '5. Analyze competitive positioning',
        '6. Assess competitor strengths in each market',
        '7. Identify competitive gaps',
        '8. Evaluate likelihood of competitive response'
      ],
      outputFormat: 'JSON object with competitive landscape'
    },
    outputSchema: {
      type: 'object',
      required: ['competitors', 'marketShare', 'intensity'],
      properties: {
        competitors: { type: 'object' },
        marketShare: { type: 'object' },
        intensity: { type: 'object' },
        positioning: { type: 'object' },
        gaps: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'geographic', 'competitive']
}));

export const entryBarriersTask = defineTask('entry-barriers', (args, taskCtx) => ({
  kind: 'agent',
  title: `Entry Barriers Assessment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Market Entry Analyst',
      task: 'Assess entry barriers for each market',
      context: args,
      instructions: [
        '1. Evaluate capital requirements',
        '2. Assess distribution channel access',
        '3. Evaluate brand building requirements',
        '4. Assess technology adaptation needs',
        '5. Evaluate local talent availability',
        '6. Assess partnership requirements',
        '7. Evaluate time to market',
        '8. Quantify entry barrier severity'
      ],
      outputFormat: 'JSON object with entry barriers assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['barriers', 'severity', 'mitigation'],
      properties: {
        barriers: { type: 'object' },
        capital: { type: 'object' },
        distribution: { type: 'object' },
        talent: { type: 'object' },
        severity: { type: 'object' },
        mitigation: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'geographic', 'barriers']
}));

export const regulatoryAnalysisTask = defineTask('regulatory-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Regulatory and Compliance Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Regulatory Compliance Analyst',
      task: 'Analyze regulatory requirements by market',
      context: args,
      instructions: [
        '1. Identify industry-specific regulations',
        '2. Assess data privacy requirements',
        '3. Evaluate licensing requirements',
        '4. Analyze tax and corporate structures',
        '5. Assess employment regulations',
        '6. Evaluate import/export restrictions',
        '7. Identify pending regulatory changes',
        '8. Estimate compliance costs'
      ],
      outputFormat: 'JSON object with regulatory analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['regulations', 'compliance', 'costs'],
      properties: {
        regulations: { type: 'object' },
        dataPrivacy: { type: 'object' },
        licensing: { type: 'object' },
        tax: { type: 'object' },
        compliance: { type: 'object' },
        costs: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'geographic', 'regulatory']
}));

export const attractivenessScoringTask = defineTask('attractiveness-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Market Attractiveness Scoring - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Market Attractiveness Analyst',
      task: 'Score and rank markets by attractiveness',
      context: args,
      instructions: [
        '1. Define attractiveness dimensions',
        '2. Weight dimensions by importance',
        '3. Score each market on dimensions',
        '4. Calculate weighted attractiveness scores',
        '5. Create attractiveness matrix',
        '6. Rank markets by overall score',
        '7. Identify top priority markets',
        '8. Document scoring rationale'
      ],
      outputFormat: 'JSON object with attractiveness scoring'
    },
    outputSchema: {
      type: 'object',
      required: ['dimensions', 'scores', 'rankings'],
      properties: {
        dimensions: { type: 'array' },
        weights: { type: 'object' },
        scores: { type: 'object' },
        matrix: { type: 'object' },
        rankings: { type: 'array' },
        rationale: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'geographic', 'attractiveness']
}));

export const entryStrategyTask = defineTask('entry-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Entry Strategy Development - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Market Entry Strategist',
      task: 'Develop entry strategies for priority markets',
      context: args,
      instructions: [
        '1. Define entry mode options (direct, partner, acquisition)',
        '2. Evaluate entry mode fit per market',
        '3. Recommend optimal entry strategy',
        '4. Define go-to-market approach',
        '5. Plan resource requirements',
        '6. Define market sequencing',
        '7. Identify partnership opportunities',
        '8. Estimate investment requirements'
      ],
      outputFormat: 'JSON object with entry strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['strategies', 'sequencing', 'investments'],
      properties: {
        strategies: { type: 'object' },
        entryModes: { type: 'object' },
        gtm: { type: 'object' },
        sequencing: { type: 'array' },
        partnerships: { type: 'array' },
        investments: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'geographic', 'strategy']
}));

export const geographicImplementationTask = defineTask('geographic-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implementation Planning - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Market Entry Project Manager',
      task: 'Create implementation plan for market entry',
      context: args,
      instructions: [
        '1. Define implementation phases',
        '2. Create detailed workstreams',
        '3. Identify resource requirements',
        '4. Define timeline and milestones',
        '5. Plan organizational structure',
        '6. Define success metrics',
        '7. Create risk mitigation plan',
        '8. Define governance and review cadence'
      ],
      outputFormat: 'JSON object with implementation plan'
    },
    outputSchema: {
      type: 'object',
      required: ['phases', 'timeline', 'resources'],
      properties: {
        phases: { type: 'array' },
        workstreams: { type: 'array' },
        resources: { type: 'object' },
        timeline: { type: 'object' },
        organization: { type: 'object' },
        metrics: { type: 'array' },
        risks: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'geographic', 'implementation']
}));
