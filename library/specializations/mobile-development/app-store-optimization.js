/**
 * @process specializations/mobile-development/app-store-optimization
 * @description App Store Optimization (ASO) Strategy - Optimize app visibility and conversion rates
 * in iOS App Store and Google Play Store through keyword research, metadata optimization, and A/B testing.
 * @inputs { appName: string, platforms: array, targetMarkets?: array, competitors?: array }
 * @outputs { success: boolean, asoStrategy: object, keywords: array, recommendations: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/mobile-development/app-store-optimization', {
 *   appName: 'MyApp',
 *   platforms: ['ios', 'android'],
 *   targetMarkets: ['US', 'UK', 'DE'],
 *   competitors: ['CompetitorApp1', 'CompetitorApp2']
 * });
 *
 * @references
 * - App Store Search Ads: https://searchads.apple.com/
 * - Google Play Console: https://play.google.com/console
 * - ASO Best Practices: https://developer.apple.com/app-store/product-page/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    appName,
    platforms = ['ios', 'android'],
    targetMarkets = ['US'],
    competitors = [],
    outputDir = 'aso-strategy'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting ASO Strategy: ${appName}`);
  ctx.log('info', `Platforms: ${platforms.join(', ')}, Markets: ${targetMarkets.join(', ')}`);

  const phases = [
    { name: 'market-research', title: 'Market Research' },
    { name: 'competitor-analysis', title: 'Competitor Analysis' },
    { name: 'keyword-research', title: 'Keyword Research' },
    { name: 'keyword-optimization', title: 'Keyword Optimization' },
    { name: 'title-subtitle-optimization', title: 'Title and Subtitle Optimization' },
    { name: 'description-optimization', title: 'Description Optimization' },
    { name: 'visual-asset-strategy', title: 'Visual Asset Strategy' },
    { name: 'screenshot-optimization', title: 'Screenshot Optimization' },
    { name: 'preview-video-strategy', title: 'Preview Video Strategy' },
    { name: 'ratings-reviews-strategy', title: 'Ratings and Reviews Strategy' },
    { name: 'localization-strategy', title: 'Localization Strategy' },
    { name: 'ab-testing-plan', title: 'A/B Testing Plan' },
    { name: 'performance-tracking', title: 'Performance Tracking Setup' },
    { name: 'iteration-plan', title: 'Iteration and Improvement Plan' }
  ];

  for (const phase of phases) {
    ctx.log('info', `Processing: ${phase.title}`);
    const result = await ctx.task(createASOTask(phase.name, phase.title), {
      appName, platforms, targetMarkets, competitors, outputDir
    });
    artifacts.push(...result.artifacts);
  }

  await ctx.breakpoint({
    question: `ASO strategy complete for ${appName}. Ready to implement optimizations?`,
    title: 'ASO Strategy Review',
    context: { runId: ctx.runId, appName, platforms, targetMarkets }
  });

  const endTime = ctx.now();
  return {
    success: true,
    appName,
    platforms,
    targetMarkets,
    asoStrategy: { status: 'complete', phases: phases.length },
    keywords: [],
    recommendations: [],
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/mobile-development/app-store-optimization', timestamp: startTime }
  };
}

function createASOTask(name, title) {
  return (args, taskCtx) => ({
    kind: 'agent',
    title: `${title} - ${args.appName}`,
    skill: { name: 'aso-strategy' },
    agent: {
      name: 'mobile-devops',
      prompt: {
        role: 'App Store Optimization Specialist',
        task: `Execute ${title.toLowerCase()} for ASO strategy`,
        context: args,
        instructions: [
          `1. Analyze ${title.toLowerCase()} requirements`,
          `2. Research best practices for ${args.platforms.join(' and ')}`,
          `3. Generate actionable recommendations`,
          `4. Document findings and strategy`,
          `5. Create implementation checklist`
        ],
        outputFormat: 'JSON with ASO details'
      },
      outputSchema: {
        type: 'object',
        required: ['recommendations', 'artifacts'],
        properties: { recommendations: { type: 'array' }, artifacts: { type: 'array' } }
      }
    },
    io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
    labels: ['mobile', 'aso', name]
  });
}

export const marketResearchTask = createASOTask('market-research', 'Market Research');
export const competitorAnalysisTask = createASOTask('competitor-analysis', 'Competitor Analysis');
export const keywordResearchTask = createASOTask('keyword-research', 'Keyword Research');
export const keywordOptimizationTask = createASOTask('keyword-optimization', 'Keyword Optimization');
export const titleSubtitleTask = createASOTask('title-subtitle-optimization', 'Title and Subtitle Optimization');
export const descriptionTask = createASOTask('description-optimization', 'Description Optimization');
export const visualAssetTask = createASOTask('visual-asset-strategy', 'Visual Asset Strategy');
export const screenshotTask = createASOTask('screenshot-optimization', 'Screenshot Optimization');
export const previewVideoTask = createASOTask('preview-video-strategy', 'Preview Video Strategy');
export const ratingsReviewsTask = createASOTask('ratings-reviews-strategy', 'Ratings and Reviews Strategy');
export const localizationTask = createASOTask('localization-strategy', 'Localization Strategy');
export const abTestingTask = createASOTask('ab-testing-plan', 'A/B Testing Plan');
export const performanceTrackingTask = createASOTask('performance-tracking', 'Performance Tracking Setup');
export const iterationPlanTask = createASOTask('iteration-plan', 'Iteration and Improvement Plan');
