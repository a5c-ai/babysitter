/**
 * @process sales/competitive-battle-cards
 * @description Process for gathering competitive intelligence and creating actionable battle cards for sales teams to use in competitive situations.
 * @inputs { competitor: string, products: array, marketSegment: string, existingIntel?: object, salesFeedback?: array }
 * @outputs { success: boolean, battleCard: object, talkTracks: array, trapQuestions: array, winStrategies: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('sales/competitive-battle-cards', {
 *   competitor: 'Acme Corp',
 *   products: ['Product A', 'Product B'],
 *   marketSegment: 'Enterprise',
 *   existingIntel: { strengths: [], weaknesses: [] }
 * });
 *
 * @references
 * - Seismic Competitive Intelligence: https://seismic.com/
 * - Klue Competitive Enablement: https://klue.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    competitor,
    products = [],
    marketSegment,
    existingIntel = {},
    salesFeedback = [],
    outputDir = 'battle-card-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Creating Battle Card for ${competitor}`);

  // Phase 1: Intelligence Gathering
  const intelGathering = await ctx.task(intelligenceGatheringTask, { competitor, marketSegment, existingIntel, outputDir });
  artifacts.push(...(intelGathering.artifacts || []));

  // Phase 2: SWOT Analysis
  const swotAnalysis = await ctx.task(competitorSwotTask, { competitor, intelGathering, products, outputDir });
  artifacts.push(...(swotAnalysis.artifacts || []));

  // Phase 3: Positioning Analysis
  const positioningAnalysis = await ctx.task(positioningAnalysisTask, { competitor, swotAnalysis, products, marketSegment, outputDir });
  artifacts.push(...(positioningAnalysis.artifacts || []));

  // Phase 4: Win/Loss Pattern Analysis
  const winLossPatterns = await ctx.task(winLossPatternsTask, { competitor, salesFeedback, outputDir });
  artifacts.push(...(winLossPatterns.artifacts || []));

  // Phase 5: Talk Track Development
  const talkTracks = await ctx.task(talkTrackDevelopmentTask, { competitor, swotAnalysis, positioningAnalysis, outputDir });
  artifacts.push(...(talkTracks.artifacts || []));

  // Phase 6: Trap Questions
  const trapQuestions = await ctx.task(trapQuestionsTask, { competitor, swotAnalysis, outputDir });
  artifacts.push(...(trapQuestions.artifacts || []));

  // Phase 7: Win Strategies
  const winStrategies = await ctx.task(winStrategiesTask, {
    competitor, swotAnalysis, positioningAnalysis, winLossPatterns, outputDir
  });
  artifacts.push(...(winStrategies.artifacts || []));

  // Phase 8: Battle Card Compilation
  const battleCardCompilation = await ctx.task(battleCardCompilationTask, {
    competitor, swotAnalysis, positioningAnalysis, talkTracks, trapQuestions, winStrategies, outputDir
  });
  artifacts.push(...(battleCardCompilation.artifacts || []));

  await ctx.breakpoint({
    question: `Battle card complete for ${competitor}. Review before distribution?`,
    title: 'Competitive Battle Card Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })) }
  });

  return {
    success: true,
    competitor,
    battleCard: battleCardCompilation.battleCard,
    talkTracks: talkTracks.tracks,
    trapQuestions: trapQuestions.questions,
    winStrategies: winStrategies.strategies,
    artifacts,
    metadata: { processId: 'sales/competitive-battle-cards', timestamp: startTime }
  };
}

export const intelligenceGatheringTask = defineTask('intelligence-gathering', (args, taskCtx) => ({
  kind: 'agent',
  title: `Intelligence Gathering - ${args.competitor}`,
  agent: {
    name: 'competitive-analyst',
    prompt: {
      role: 'Competitive intelligence analyst',
      task: 'Gather competitive intelligence',
      context: args,
      instructions: ['Research competitor products', 'Analyze pricing models', 'Identify target customers', 'Document recent news and changes']
    },
    outputSchema: { type: 'object', required: ['intel', 'artifacts'], properties: { intel: { type: 'object' }, sources: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'competitive', 'intelligence']
}));

export const competitorSwotTask = defineTask('competitor-swot', (args, taskCtx) => ({
  kind: 'agent',
  title: `SWOT Analysis - ${args.competitor}`,
  agent: {
    name: 'competitive-analyst',
    prompt: {
      role: 'SWOT analysis specialist',
      task: 'Conduct SWOT analysis of competitor',
      context: args,
      instructions: ['Identify strengths', 'Document weaknesses', 'Analyze opportunities', 'Assess threats']
    },
    outputSchema: { type: 'object', required: ['swot', 'artifacts'], properties: { swot: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'competitive', 'swot']
}));

export const positioningAnalysisTask = defineTask('positioning-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Positioning Analysis - ${args.competitor}`,
  agent: {
    name: 'competitive-analyst',
    prompt: {
      role: 'Positioning analyst',
      task: 'Analyze competitive positioning',
      context: args,
      instructions: ['Compare positioning', 'Identify differentiators', 'Map feature comparison', 'Analyze messaging']
    },
    outputSchema: { type: 'object', required: ['positioning', 'artifacts'], properties: { positioning: { type: 'object' }, comparison: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'competitive', 'positioning']
}));

export const winLossPatternsTask = defineTask('win-loss-patterns', (args, taskCtx) => ({
  kind: 'agent',
  title: `Win/Loss Patterns - ${args.competitor}`,
  agent: {
    name: 'competitive-analyst',
    prompt: {
      role: 'Win/loss analyst',
      task: 'Analyze win/loss patterns against competitor',
      context: args,
      instructions: ['Analyze win patterns', 'Identify loss reasons', 'Document best practices', 'Identify common scenarios']
    },
    outputSchema: { type: 'object', required: ['patterns', 'artifacts'], properties: { patterns: { type: 'object' }, winReasons: { type: 'array' }, lossReasons: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'competitive', 'win-loss']
}));

export const talkTrackDevelopmentTask = defineTask('talk-track-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Talk Tracks - ${args.competitor}`,
  agent: {
    name: 'sales-enablement',
    prompt: {
      role: 'Talk track developer',
      task: 'Develop competitive talk tracks',
      context: args,
      instructions: ['Create positioning statements', 'Develop objection responses', 'Build comparison talking points', 'Design transition phrases']
    },
    outputSchema: { type: 'object', required: ['tracks', 'artifacts'], properties: { tracks: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'competitive', 'talk-tracks']
}));

export const trapQuestionsTask = defineTask('trap-questions', (args, taskCtx) => ({
  kind: 'agent',
  title: `Trap Questions - ${args.competitor}`,
  agent: {
    name: 'sales-enablement',
    prompt: {
      role: 'Trap question specialist',
      task: 'Create trap questions to expose competitor weaknesses',
      context: args,
      instructions: ['Design trap questions', 'Target known weaknesses', 'Create follow-up probes', 'Provide expected responses']
    },
    outputSchema: { type: 'object', required: ['questions', 'artifacts'], properties: { questions: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'competitive', 'trap-questions']
}));

export const winStrategiesTask = defineTask('win-strategies', (args, taskCtx) => ({
  kind: 'agent',
  title: `Win Strategies - ${args.competitor}`,
  agent: {
    name: 'sales-strategist',
    prompt: {
      role: 'Competitive win strategist',
      task: 'Develop win strategies against competitor',
      context: args,
      instructions: ['Define win themes', 'Create deal strategies', 'Identify ideal scenarios', 'Document counter-tactics']
    },
    outputSchema: { type: 'object', required: ['strategies', 'artifacts'], properties: { strategies: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'competitive', 'win-strategies']
}));

export const battleCardCompilationTask = defineTask('battle-card-compilation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Battle Card Compilation - ${args.competitor}`,
  agent: {
    name: 'sales-enablement',
    prompt: {
      role: 'Battle card designer',
      task: 'Compile final battle card',
      context: args,
      instructions: ['Format battle card', 'Create one-pager', 'Build quick reference', 'Design for usability']
    },
    outputSchema: { type: 'object', required: ['battleCard', 'artifacts'], properties: { battleCard: { type: 'object' }, quickReference: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'competitive', 'battle-card']
}));
