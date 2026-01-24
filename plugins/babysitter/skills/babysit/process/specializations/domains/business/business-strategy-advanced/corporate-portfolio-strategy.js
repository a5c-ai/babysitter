/**
 * @process business-strategy/corporate-portfolio-strategy
 * @description Corporate-level portfolio strategy including vertical integration, horizontal integration, diversification, and restructuring decisions
 * @inputs { organizationName: string, businessUnits: array, industryContext: object, corporateResources: object }
 * @outputs { success: boolean, portfolioStrategy: object, integrationOpportunities: object, restructuringPlan: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationName = 'Organization',
    businessUnits = [],
    industryContext = {},
    corporateResources = {},
    outputDir = 'corporate-portfolio-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Corporate Portfolio Strategy for ${organizationName}`);

  // Phase 1: Vertical Integration Analysis
  ctx.log('info', 'Phase 1: Analyzing vertical integration opportunities');
  const verticalIntegration = await ctx.task(verticalIntegrationTask, {
    organizationName, businessUnits, industryContext, outputDir
  });
  artifacts.push(...verticalIntegration.artifacts);

  // Phase 2: Horizontal Integration Analysis
  ctx.log('info', 'Phase 2: Analyzing horizontal integration options');
  const horizontalIntegration = await ctx.task(horizontalIntegrationTask, {
    organizationName, businessUnits, industryContext, outputDir
  });
  artifacts.push(...horizontalIntegration.artifacts);

  // Phase 3: Diversification Strategy Analysis
  ctx.log('info', 'Phase 3: Analyzing diversification strategies');
  const diversificationStrategy = await ctx.task(diversificationStrategyTask, {
    organizationName, businessUnits, corporateResources, outputDir
  });
  artifacts.push(...diversificationStrategy.artifacts);

  // Phase 4: Restructuring Needs Assessment
  ctx.log('info', 'Phase 4: Assessing restructuring needs');
  const restructuringAssessment = await ctx.task(restructuringAssessmentTask, {
    organizationName, businessUnits, outputDir
  });
  artifacts.push(...restructuringAssessment.artifacts);

  // Phase 5: Synergy Analysis
  ctx.log('info', 'Phase 5: Calculating portfolio synergies');
  const synergyAnalysis = await ctx.task(synergyAnalysisTask, {
    organizationName, businessUnits, verticalIntegration, horizontalIntegration, outputDir
  });
  artifacts.push(...synergyAnalysis.artifacts);

  // Phase 6: Parenting Advantage Assessment
  ctx.log('info', 'Phase 6: Assessing corporate parenting advantage');
  const parentingAdvantage = await ctx.task(parentingAdvantageTask, {
    organizationName, businessUnits, corporateResources, outputDir
  });
  artifacts.push(...parentingAdvantage.artifacts);

  // Phase 7: Portfolio Optimization Recommendations
  ctx.log('info', 'Phase 7: Developing portfolio optimization recommendations');
  const portfolioOptimization = await ctx.task(portfolioOptimizationTask, {
    organizationName, verticalIntegration, horizontalIntegration, diversificationStrategy,
    restructuringAssessment, synergyAnalysis, parentingAdvantage, outputDir
  });
  artifacts.push(...portfolioOptimization.artifacts);

  // Phase 8: Generate Report
  ctx.log('info', 'Phase 8: Generating comprehensive report');
  const portfolioReport = await ctx.task(corporatePortfolioReportTask, {
    organizationName, verticalIntegration, horizontalIntegration, diversificationStrategy,
    restructuringAssessment, synergyAnalysis, parentingAdvantage, portfolioOptimization, outputDir
  });
  artifacts.push(...portfolioReport.artifacts);

  await ctx.breakpoint({
    question: `Corporate portfolio strategy complete for ${organizationName}. Review recommendations?`,
    title: 'Corporate Portfolio Strategy Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })) }
  });

  return {
    success: true, organizationName,
    portfolioStrategy: portfolioOptimization.strategy,
    integrationOpportunities: { vertical: verticalIntegration.opportunities, horizontal: horizontalIntegration.opportunities },
    restructuringPlan: restructuringAssessment.plan,
    synergyValuation: synergyAnalysis.valuation,
    artifacts, duration: ctx.now() - startTime,
    metadata: { processId: 'business-strategy/corporate-portfolio-strategy', timestamp: startTime, outputDir }
  };
}

export const verticalIntegrationTask = defineTask('vertical-integration', (args, taskCtx) => ({
  kind: 'agent', title: 'Analyze vertical integration opportunities',
  agent: {
    name: 'integration-analyst',
    prompt: {
      role: 'corporate strategy analyst',
      task: 'Analyze vertical integration opportunities (forward and backward)',
      context: args,
      instructions: ['Assess backward integration opportunities (suppliers)', 'Assess forward integration opportunities (customers/channels)', 'Evaluate make vs. buy decisions', 'Analyze transaction cost implications', 'Score integration opportunities by strategic value', 'Generate vertical integration analysis']
    },
    outputSchema: { type: 'object', required: ['opportunities', 'artifacts'], properties: { opportunities: { type: 'array' }, backwardIntegration: { type: 'array' }, forwardIntegration: { type: 'array' }, recommendations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'corporate-portfolio', 'vertical-integration']
}));

export const horizontalIntegrationTask = defineTask('horizontal-integration', (args, taskCtx) => ({
  kind: 'agent', title: 'Analyze horizontal integration options',
  agent: {
    name: 'ma-analyst',
    prompt: {
      role: 'M&A and integration specialist',
      task: 'Analyze horizontal integration opportunities through M&A and alliances',
      context: args,
      instructions: ['Identify M&A targets in same industry', 'Evaluate strategic alliance opportunities', 'Assess market share consolidation potential', 'Analyze competitive positioning benefits', 'Estimate synergies and integration costs', 'Generate horizontal integration analysis']
    },
    outputSchema: { type: 'object', required: ['opportunities', 'artifacts'], properties: { opportunities: { type: 'array' }, maTargets: { type: 'array' }, alliances: { type: 'array' }, synergies: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'corporate-portfolio', 'horizontal-integration']
}));

export const diversificationStrategyTask = defineTask('diversification-strategy', (args, taskCtx) => ({
  kind: 'agent', title: 'Analyze diversification strategies',
  agent: {
    name: 'diversification-analyst',
    prompt: {
      role: 'corporate diversification strategist',
      task: 'Analyze related and unrelated diversification opportunities',
      context: args,
      instructions: ['Evaluate related diversification opportunities', 'Assess unrelated diversification options', 'Analyze core competence leverage potential', 'Evaluate risk-return profile of diversification', 'Recommend diversification strategy', 'Generate diversification analysis']
    },
    outputSchema: { type: 'object', required: ['strategy', 'artifacts'], properties: { strategy: { type: 'object' }, relatedDiversification: { type: 'array' }, unrelatedDiversification: { type: 'array' }, recommendations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'corporate-portfolio', 'diversification']
}));

export const restructuringAssessmentTask = defineTask('restructuring-assessment', (args, taskCtx) => ({
  kind: 'agent', title: 'Assess restructuring needs',
  agent: {
    name: 'restructuring-analyst',
    prompt: {
      role: 'corporate restructuring specialist',
      task: 'Assess divestiture, spin-off, and turnaround needs',
      context: args,
      instructions: ['Identify underperforming units for turnaround', 'Evaluate divestiture candidates', 'Assess spin-off opportunities', 'Analyze restructuring value creation potential', 'Develop restructuring plan', 'Generate restructuring assessment']
    },
    outputSchema: { type: 'object', required: ['plan', 'artifacts'], properties: { plan: { type: 'object' }, divestitures: { type: 'array' }, spinoffs: { type: 'array' }, turnarounds: { type: 'array' }, valueCreation: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'corporate-portfolio', 'restructuring']
}));

export const synergyAnalysisTask = defineTask('synergy-analysis', (args, taskCtx) => ({
  kind: 'agent', title: 'Calculate portfolio synergies',
  agent: {
    name: 'synergy-analyst',
    prompt: {
      role: 'synergy valuation specialist',
      task: 'Calculate and value portfolio synergies',
      context: args,
      instructions: ['Identify revenue synergies', 'Identify cost synergies', 'Quantify synergy values', 'Assess synergy realization risks', 'Create synergy capture roadmap', 'Generate synergy analysis']
    },
    outputSchema: { type: 'object', required: ['valuation', 'artifacts'], properties: { valuation: { type: 'object' }, revenueSynergies: { type: 'array' }, costSynergies: { type: 'array' }, captureRoadmap: { type: 'object' }, risks: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'corporate-portfolio', 'synergies']
}));

export const parentingAdvantageTask = defineTask('parenting-advantage', (args, taskCtx) => ({
  kind: 'agent', title: 'Assess corporate parenting advantage',
  agent: {
    name: 'parenting-analyst',
    prompt: {
      role: 'corporate parenting specialist',
      task: 'Assess parenting advantage and corporate value-add',
      context: args,
      instructions: ['Evaluate parenting opportunities for each unit', 'Assess corporate capabilities and resources', 'Identify parenting advantage sources', 'Evaluate fit between parent and businesses', 'Recommend parenting approach', 'Generate parenting advantage assessment']
    },
    outputSchema: { type: 'object', required: ['assessment', 'artifacts'], properties: { assessment: { type: 'object' }, parentingOpportunities: { type: 'array' }, valueAddSources: { type: 'array' }, fitAssessment: { type: 'object' }, recommendations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'corporate-portfolio', 'parenting']
}));

export const portfolioOptimizationTask = defineTask('portfolio-optimization', (args, taskCtx) => ({
  kind: 'agent', title: 'Develop portfolio optimization recommendations',
  agent: {
    name: 'optimization-strategist',
    prompt: {
      role: 'portfolio optimization specialist',
      task: 'Develop comprehensive portfolio optimization recommendations',
      context: args,
      instructions: ['Synthesize integration and restructuring analyses', 'Prioritize portfolio actions by value creation', 'Develop implementation sequencing', 'Create portfolio transformation roadmap', 'Generate optimization recommendations']
    },
    outputSchema: { type: 'object', required: ['strategy', 'artifacts'], properties: { strategy: { type: 'object' }, prioritizedActions: { type: 'array' }, roadmap: { type: 'object' }, valueCreation: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'corporate-portfolio', 'optimization']
}));

export const corporatePortfolioReportTask = defineTask('corporate-portfolio-report', (args, taskCtx) => ({
  kind: 'agent', title: 'Generate corporate portfolio strategy report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'strategy report author',
      task: 'Generate comprehensive corporate portfolio strategy report',
      context: args,
      instructions: ['Create executive summary', 'Present integration analysis', 'Document diversification strategy', 'Include restructuring assessment', 'Present synergy valuation', 'Document optimization recommendations', 'Format as Markdown report']
    },
    outputSchema: { type: 'object', required: ['reportPath', 'artifacts'], properties: { reportPath: { type: 'string' }, executiveSummary: { type: 'string' }, keyFindings: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'corporate-portfolio', 'reporting']
}));
