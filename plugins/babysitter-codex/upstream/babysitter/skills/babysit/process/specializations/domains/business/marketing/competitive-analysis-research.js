/**
 * @process marketing/competitive-analysis-research
 * @description Monitor competitor positioning, messaging, campaigns, and market share. Create competitive battlecards and identify differentiation opportunities.
 * @inputs { competitors: array, market: string, ownBrand: object, dataSource: array }
 * @outputs { success: boolean, competitorProfiles: array, battlecards: array, differentiationOpportunities: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    competitors = [],
    market = '',
    ownBrand = {},
    dataSources = [],
    outputDir = 'competitive-analysis-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Competitive Analysis Research');

  const competitorMapping = await ctx.task(competitorMappingTask, { competitors, market, outputDir });
  artifacts.push(...competitorMapping.artifacts);

  const positioningAnalysis = await ctx.task(competitorPositioningTask, { competitorMapping, ownBrand, outputDir });
  artifacts.push(...positioningAnalysis.artifacts);

  const messagingAnalysis = await ctx.task(competitorMessagingTask, { competitorMapping, outputDir });
  artifacts.push(...messagingAnalysis.artifacts);

  const campaignAnalysis = await ctx.task(competitorCampaignTask, { competitorMapping, outputDir });
  artifacts.push(...campaignAnalysis.artifacts);

  const marketShareAnalysis = await ctx.task(marketShareAnalysisTask, { competitorMapping, market, outputDir });
  artifacts.push(...marketShareAnalysis.artifacts);

  const swotAnalysis = await ctx.task(competitorSwotTask, { competitorMapping, positioningAnalysis, ownBrand, outputDir });
  artifacts.push(...swotAnalysis.artifacts);

  const battlecardCreation = await ctx.task(battlecardCreationTask, { competitorMapping, positioningAnalysis, messagingAnalysis, swotAnalysis, ownBrand, outputDir });
  artifacts.push(...battlecardCreation.artifacts);

  const differentiationAnalysis = await ctx.task(differentiationOpportunitiesTask, { positioningAnalysis, swotAnalysis, ownBrand, outputDir });
  artifacts.push(...differentiationAnalysis.artifacts);

  const qualityAssessment = await ctx.task(competitiveAnalysisQualityTask, { competitorMapping, positioningAnalysis, battlecardCreation, differentiationAnalysis, outputDir });
  artifacts.push(...qualityAssessment.artifacts);

  const analysisScore = qualityAssessment.overallScore;

  await ctx.breakpoint({
    question: `Competitive analysis complete. Quality score: ${analysisScore}/100. Review and approve?`,
    title: 'Competitive Analysis Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })) }
  });

  return {
    success: true,
    analysisScore,
    competitorProfiles: competitorMapping.profiles,
    battlecards: battlecardCreation.battlecards,
    differentiationOpportunities: differentiationAnalysis.opportunities,
    marketShare: marketShareAnalysis.analysis,
    swotAnalyses: swotAnalysis.analyses,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'marketing/competitive-analysis-research', timestamp: startTime, outputDir }
  };
}

export const competitorMappingTask = defineTask('competitor-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map competitive landscape',
  agent: {
    name: 'competitive-mapper',
    prompt: {
      role: 'Competitive intelligence analyst',
      task: 'Map and profile competitors',
      context: args,
      instructions: ['Identify direct competitors', 'Identify indirect competitors', 'Create competitor profiles', 'Assess competitor strengths', 'Document competitive landscape']
    },
    outputSchema: { type: 'object', required: ['profiles', 'landscape', 'artifacts'], properties: { profiles: { type: 'array' }, landscape: { type: 'object' }, direct: { type: 'array' }, indirect: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'competitive-analysis', 'mapping']
}));

export const competitorPositioningTask = defineTask('competitor-positioning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze competitor positioning',
  agent: {
    name: 'positioning-analyst',
    prompt: {
      role: 'Brand positioning analyst',
      task: 'Analyze competitor positioning strategies',
      context: args,
      instructions: ['Analyze positioning statements', 'Map positioning dimensions', 'Create positioning map', 'Identify positioning gaps', 'Compare to own brand']
    },
    outputSchema: { type: 'object', required: ['analysis', 'positioningMap', 'artifacts'], properties: { analysis: { type: 'array' }, positioningMap: { type: 'object' }, gaps: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'competitive-analysis', 'positioning']
}));

export const competitorMessagingTask = defineTask('competitor-messaging', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze competitor messaging',
  agent: {
    name: 'messaging-analyst',
    prompt: {
      role: 'Competitive messaging analyst',
      task: 'Analyze competitor messaging and communications',
      context: args,
      instructions: ['Analyze key messages', 'Review taglines and slogans', 'Assess tone and voice', 'Analyze value propositions', 'Identify messaging patterns']
    },
    outputSchema: { type: 'object', required: ['analysis', 'messages', 'artifacts'], properties: { analysis: { type: 'array' }, messages: { type: 'object' }, patterns: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'competitive-analysis', 'messaging']
}));

export const competitorCampaignTask = defineTask('competitor-campaign', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze competitor campaigns',
  agent: {
    name: 'campaign-analyst',
    prompt: {
      role: 'Competitive marketing analyst',
      task: 'Analyze competitor marketing campaigns',
      context: args,
      instructions: ['Track recent campaigns', 'Analyze campaign themes', 'Assess channel usage', 'Estimate campaign budgets', 'Identify successful tactics']
    },
    outputSchema: { type: 'object', required: ['campaigns', 'analysis', 'artifacts'], properties: { campaigns: { type: 'array' }, analysis: { type: 'object' }, tactics: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'competitive-analysis', 'campaigns']
}));

export const marketShareAnalysisTask = defineTask('market-share-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze market share',
  agent: {
    name: 'market-analyst',
    prompt: {
      role: 'Market share analyst',
      task: 'Analyze competitor market share',
      context: args,
      instructions: ['Estimate market shares', 'Track share trends', 'Analyze share of voice', 'Assess market dynamics', 'Project future shares']
    },
    outputSchema: { type: 'object', required: ['analysis', 'shares', 'artifacts'], properties: { analysis: { type: 'object' }, shares: { type: 'object' }, trends: { type: 'array' }, projections: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'competitive-analysis', 'market-share']
}));

export const competitorSwotTask = defineTask('competitor-swot', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct SWOT analysis',
  agent: {
    name: 'swot-analyst',
    prompt: {
      role: 'Strategic analyst',
      task: 'Conduct SWOT analysis for each competitor',
      context: args,
      instructions: ['Identify competitor strengths', 'Identify competitor weaknesses', 'Assess opportunities', 'Assess threats', 'Compare to own brand']
    },
    outputSchema: { type: 'object', required: ['analyses', 'comparison', 'artifacts'], properties: { analyses: { type: 'array' }, comparison: { type: 'object' }, implications: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'competitive-analysis', 'swot']
}));

export const battlecardCreationTask = defineTask('battlecard-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create competitive battlecards',
  agent: {
    name: 'battlecard-creator',
    prompt: {
      role: 'Competitive enablement specialist',
      task: 'Create competitive battlecards for sales team',
      context: args,
      instructions: ['Create competitor overview', 'Document key differentiators', 'Prepare objection handling', 'Create win strategies', 'Develop quick reference']
    },
    outputSchema: { type: 'object', required: ['battlecards', 'artifacts'], properties: { battlecards: { type: 'array' }, templates: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'competitive-analysis', 'battlecards']
}));

export const differentiationOpportunitiesTask = defineTask('differentiation-opportunities', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify differentiation opportunities',
  agent: {
    name: 'differentiation-analyst',
    prompt: {
      role: 'Competitive strategy analyst',
      task: 'Identify differentiation opportunities',
      context: args,
      instructions: ['Identify positioning gaps', 'Find underserved needs', 'Assess capability advantages', 'Identify messaging opportunities', 'Prioritize opportunities']
    },
    outputSchema: { type: 'object', required: ['opportunities', 'prioritization', 'artifacts'], properties: { opportunities: { type: 'array' }, prioritization: { type: 'object' }, recommendations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'competitive-analysis', 'differentiation']
}));

export const competitiveAnalysisQualityTask = defineTask('competitive-analysis-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess analysis quality',
  agent: {
    name: 'analysis-validator',
    prompt: {
      role: 'Competitive intelligence director',
      task: 'Assess overall competitive analysis quality',
      context: args,
      instructions: ['Evaluate coverage', 'Assess depth of analysis', 'Review battlecard quality', 'Assess actionability', 'Calculate overall score']
    },
    outputSchema: { type: 'object', required: ['overallScore', 'componentScores', 'artifacts'], properties: { overallScore: { type: 'number' }, componentScores: { type: 'object' }, recommendations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'competitive-analysis', 'quality-assessment']
}));
