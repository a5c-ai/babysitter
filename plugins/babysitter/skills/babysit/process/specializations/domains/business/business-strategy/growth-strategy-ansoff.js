/**
 * @process business-strategy/growth-strategy-ansoff
 * @description Strategic growth planning using Ansoff Matrix framework to evaluate market penetration, market development, product development, and diversification options
 * @inputs { organizationContext: object, currentProducts: array, currentMarkets: array, growthTargets: object, outputDir: string }
 * @outputs { success: boolean, ansoffAnalysis: object, growthStrategies: array, implementationPlan: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationContext = {},
    currentProducts = [],
    currentMarkets = [],
    growthTargets = {},
    outputDir = 'growth-strategy-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Ansoff Growth Strategy Process');

  // Phase 1: Current State Assessment
  ctx.log('info', 'Phase 1: Assessing current state');
  const currentStateAssessment = await ctx.task(currentStateTask, { organizationContext, currentProducts, currentMarkets, outputDir });
  artifacts.push(...currentStateAssessment.artifacts);

  // Phase 2: Growth Gap Analysis
  ctx.log('info', 'Phase 2: Analyzing growth gaps');
  const growthGapAnalysis = await ctx.task(growthGapTask, { currentStateAssessment, growthTargets, outputDir });
  artifacts.push(...growthGapAnalysis.artifacts);

  // Phase 3: Market Penetration Analysis
  ctx.log('info', 'Phase 3: Analyzing market penetration opportunities');
  const marketPenetration = await ctx.task(marketPenetrationTask, { currentStateAssessment, currentProducts, currentMarkets, outputDir });
  artifacts.push(...marketPenetration.artifacts);

  // Phase 4: Market Development Analysis
  ctx.log('info', 'Phase 4: Analyzing market development opportunities');
  const marketDevelopment = await ctx.task(marketDevelopmentTask, { currentProducts, organizationContext, outputDir });
  artifacts.push(...marketDevelopment.artifacts);

  // Phase 5: Product Development Analysis
  ctx.log('info', 'Phase 5: Analyzing product development opportunities');
  const productDevelopment = await ctx.task(productDevelopmentTask, { currentMarkets, organizationContext, outputDir });
  artifacts.push(...productDevelopment.artifacts);

  // Phase 6: Diversification Analysis
  ctx.log('info', 'Phase 6: Analyzing diversification opportunities');
  const diversification = await ctx.task(diversificationTask, { organizationContext, outputDir });
  artifacts.push(...diversification.artifacts);

  // Phase 7: Risk Assessment
  ctx.log('info', 'Phase 7: Assessing strategic risks');
  const riskAssessment = await ctx.task(riskAssessmentTask, { marketPenetration, marketDevelopment, productDevelopment, diversification, outputDir });
  artifacts.push(...riskAssessment.artifacts);

  // Phase 8: Strategy Prioritization
  ctx.log('info', 'Phase 8: Prioritizing growth strategies');
  const strategyPrioritization = await ctx.task(strategyPrioritizationTask, { marketPenetration, marketDevelopment, productDevelopment, diversification, riskAssessment, growthTargets, outputDir });
  artifacts.push(...strategyPrioritization.artifacts);

  // Phase 9: Resource Requirements
  ctx.log('info', 'Phase 9: Defining resource requirements');
  const resourceRequirements = await ctx.task(resourceRequirementsTask, { strategyPrioritization, outputDir });
  artifacts.push(...resourceRequirements.artifacts);

  // Phase 10: Implementation Planning
  ctx.log('info', 'Phase 10: Planning implementation');
  const implementationPlan = await ctx.task(implementationPlanTask, { strategyPrioritization, resourceRequirements, outputDir });
  artifacts.push(...implementationPlan.artifacts);

  // Phase 11: Generate Report
  ctx.log('info', 'Phase 11: Generating growth strategy report');
  const strategyReport = await ctx.task(strategyReportTask, { currentStateAssessment, marketPenetration, marketDevelopment, productDevelopment, diversification, strategyPrioritization, implementationPlan, outputDir });
  artifacts.push(...strategyReport.artifacts);

  const endTime = ctx.now();

  return {
    success: true,
    ansoffAnalysis: {
      marketPenetration: marketPenetration.opportunities,
      marketDevelopment: marketDevelopment.opportunities,
      productDevelopment: productDevelopment.opportunities,
      diversification: diversification.opportunities
    },
    growthStrategies: strategyPrioritization.prioritizedStrategies,
    riskAssessment: riskAssessment.assessment,
    implementationPlan: implementationPlan.plan,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'business-strategy/growth-strategy-ansoff', timestamp: startTime }
  };
}

export const currentStateTask = defineTask('current-state', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess current state',
  agent: {
    name: 'strategy-analyst',
    prompt: {
      role: 'strategic analyst',
      task: 'Assess current products, markets, and competitive position',
      context: args,
      instructions: ['Analyze current product portfolio', 'Assess current market presence', 'Evaluate competitive position', 'Document growth baseline', 'Save assessment to output directory'],
      outputFormat: 'JSON with assessment (object), productPortfolio (array), marketPresence (array), artifacts'
    },
    outputSchema: { type: 'object', required: ['assessment', 'artifacts'], properties: { assessment: { type: 'object' }, productPortfolio: { type: 'array' }, marketPresence: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'ansoff', 'current-state']
}));

export const growthGapTask = defineTask('growth-gap', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze growth gaps',
  agent: {
    name: 'gap-analyst',
    prompt: {
      role: 'growth planning analyst',
      task: 'Analyze gap between current trajectory and growth targets',
      context: args,
      instructions: ['Calculate organic growth trajectory', 'Identify growth gaps to targets', 'Quantify required additional growth', 'Prioritize gap closure strategies', 'Save analysis to output directory'],
      outputFormat: 'JSON with gaps (object), requiredGrowth (number), gapAnalysis (object), artifacts'
    },
    outputSchema: { type: 'object', required: ['gaps', 'artifacts'], properties: { gaps: { type: 'object' }, requiredGrowth: { type: 'number' }, gapAnalysis: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'ansoff', 'gap-analysis']
}));

export const marketPenetrationTask = defineTask('market-penetration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze market penetration',
  agent: {
    name: 'penetration-analyst',
    prompt: {
      role: 'market penetration strategist',
      task: 'Identify market penetration opportunities (existing products, existing markets)',
      context: args,
      instructions: ['Analyze market share expansion potential', 'Identify competitive displacement opportunities', 'Evaluate pricing and promotion strategies', 'Assess customer acquisition opportunities', 'Save analysis to output directory'],
      outputFormat: 'JSON with opportunities (array), strategies (array), potentialGrowth (number), artifacts'
    },
    outputSchema: { type: 'object', required: ['opportunities', 'artifacts'], properties: { opportunities: { type: 'array' }, strategies: { type: 'array' }, potentialGrowth: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'ansoff', 'market-penetration']
}));

export const marketDevelopmentTask = defineTask('market-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze market development',
  agent: {
    name: 'market-development-analyst',
    prompt: {
      role: 'market development strategist',
      task: 'Identify market development opportunities (existing products, new markets)',
      context: args,
      instructions: ['Identify new geographic markets', 'Identify new customer segments', 'Evaluate new distribution channels', 'Assess market entry barriers', 'Save analysis to output directory'],
      outputFormat: 'JSON with opportunities (array), newMarkets (array), entryStrategies (array), artifacts'
    },
    outputSchema: { type: 'object', required: ['opportunities', 'artifacts'], properties: { opportunities: { type: 'array' }, newMarkets: { type: 'array' }, entryStrategies: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'ansoff', 'market-development']
}));

export const productDevelopmentTask = defineTask('product-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze product development',
  agent: {
    name: 'product-development-analyst',
    prompt: {
      role: 'product development strategist',
      task: 'Identify product development opportunities (new products, existing markets)',
      context: args,
      instructions: ['Identify product extension opportunities', 'Evaluate new product development', 'Assess innovation pipeline', 'Analyze customer unmet needs', 'Save analysis to output directory'],
      outputFormat: 'JSON with opportunities (array), productIdeas (array), developmentPriorities (array), artifacts'
    },
    outputSchema: { type: 'object', required: ['opportunities', 'artifacts'], properties: { opportunities: { type: 'array' }, productIdeas: { type: 'array' }, developmentPriorities: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'ansoff', 'product-development']
}));

export const diversificationTask = defineTask('diversification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze diversification',
  agent: {
    name: 'diversification-analyst',
    prompt: {
      role: 'diversification strategist',
      task: 'Identify diversification opportunities (new products, new markets)',
      context: args,
      instructions: ['Evaluate related diversification options', 'Assess unrelated diversification opportunities', 'Analyze M&A targets for diversification', 'Evaluate strategic partnerships', 'Save analysis to output directory'],
      outputFormat: 'JSON with opportunities (array), relatedOptions (array), unrelatedOptions (array), artifacts'
    },
    outputSchema: { type: 'object', required: ['opportunities', 'artifacts'], properties: { opportunities: { type: 'array' }, relatedOptions: { type: 'array' }, unrelatedOptions: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'ansoff', 'diversification']
}));

export const riskAssessmentTask = defineTask('risk-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess strategic risks',
  agent: {
    name: 'risk-analyst',
    prompt: {
      role: 'strategic risk analyst',
      task: 'Assess risks of each growth strategy quadrant',
      context: args,
      instructions: ['Assess market penetration risks', 'Assess market development risks', 'Assess product development risks', 'Assess diversification risks', 'Save assessment to output directory'],
      outputFormat: 'JSON with assessment (object), riskMatrix (object), mitigations (array), artifacts'
    },
    outputSchema: { type: 'object', required: ['assessment', 'artifacts'], properties: { assessment: { type: 'object' }, riskMatrix: { type: 'object' }, mitigations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'ansoff', 'risk']
}));

export const strategyPrioritizationTask = defineTask('strategy-prioritization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prioritize growth strategies',
  agent: {
    name: 'strategy-prioritizer',
    prompt: {
      role: 'growth strategy prioritization specialist',
      task: 'Prioritize growth strategies across Ansoff quadrants',
      context: args,
      instructions: ['Score all opportunities', 'Balance risk and reward', 'Create growth portfolio', 'Define strategy mix', 'Save prioritization to output directory'],
      outputFormat: 'JSON with prioritizedStrategies (array), strategyMix (object), growthPortfolio (object), artifacts'
    },
    outputSchema: { type: 'object', required: ['prioritizedStrategies', 'artifacts'], properties: { prioritizedStrategies: { type: 'array' }, strategyMix: { type: 'object' }, growthPortfolio: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'ansoff', 'prioritization']
}));

export const resourceRequirementsTask = defineTask('resource-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define resource requirements',
  agent: {
    name: 'resource-planner',
    prompt: {
      role: 'strategic resource planner',
      task: 'Define resource requirements for prioritized strategies',
      context: args,
      instructions: ['Identify capital requirements', 'Identify capability requirements', 'Identify talent requirements', 'Assess resource gaps', 'Save requirements to output directory'],
      outputFormat: 'JSON with requirements (object), investmentNeeds (object), capabilityGaps (array), artifacts'
    },
    outputSchema: { type: 'object', required: ['requirements', 'artifacts'], properties: { requirements: { type: 'object' }, investmentNeeds: { type: 'object' }, capabilityGaps: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'ansoff', 'resources']
}));

export const implementationPlanTask = defineTask('implementation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan implementation',
  agent: {
    name: 'implementation-planner',
    prompt: {
      role: 'growth strategy implementation planner',
      task: 'Create implementation plan for growth strategies',
      context: args,
      instructions: ['Sequence initiatives', 'Define milestones', 'Create governance structure', 'Define success metrics', 'Save plan to output directory'],
      outputFormat: 'JSON with plan (object), initiatives (array), milestones (array), artifacts'
    },
    outputSchema: { type: 'object', required: ['plan', 'artifacts'], properties: { plan: { type: 'object' }, initiatives: { type: 'array' }, milestones: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'ansoff', 'implementation']
}));

export const strategyReportTask = defineTask('strategy-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate growth strategy report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'growth strategy consultant and technical writer',
      task: 'Generate comprehensive Ansoff growth strategy report',
      context: args,
      instructions: ['Create executive summary', 'Present Ansoff matrix analysis', 'Document prioritized strategies', 'Include implementation roadmap', 'Save report to output directory'],
      outputFormat: 'JSON with reportPath (string), executiveSummary (string), artifacts'
    },
    outputSchema: { type: 'object', required: ['reportPath', 'artifacts'], properties: { reportPath: { type: 'string' }, executiveSummary: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'ansoff', 'reporting']
}));
