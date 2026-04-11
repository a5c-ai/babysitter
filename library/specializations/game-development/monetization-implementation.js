/**
 * @process specializations/game-development/monetization-implementation
 * @description Monetization System Implementation Process - Design and implement monetization systems including
 * in-app purchases, virtual economy, battle pass, subscriptions, and ethical monetization practices.
 * @inputs { projectName: string, monetizationModel?: string, currencies?: array, outputDir?: string }
 * @outputs { success: boolean, monetizationDoc: string, storeIntegration: object, economyModel: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    monetizationModel = 'free-to-play',
    currencies = ['premium', 'soft'],
    platforms = ['mobile'],
    ethicalGuidelines = true,
    outputDir = 'monetization-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Monetization Implementation: ${projectName}`);

  // Phase 1: Monetization Strategy
  const strategy = await ctx.task(monetizationStrategyTask, { projectName, monetizationModel, ethicalGuidelines, outputDir });
  artifacts.push(...strategy.artifacts);

  // Phase 2: Virtual Economy Design
  const economyDesign = await ctx.task(virtualEconomyTask, { projectName, currencies, monetizationModel, outputDir });
  artifacts.push(...economyDesign.artifacts);

  // Phase 3: Store Implementation
  const storeImpl = await ctx.task(storeImplementationTask, { projectName, platforms, economyDesign, outputDir });
  artifacts.push(...storeImpl.artifacts);

  // Phase 4: IAP Integration
  const iapIntegration = await ctx.task(iapIntegrationTask, { projectName, platforms, storeImpl, outputDir });
  artifacts.push(...iapIntegration.artifacts);

  // Phase 5: Monetization Testing
  const testing = await ctx.task(monetizationTestingTask, { projectName, storeImpl, iapIntegration, outputDir });
  artifacts.push(...testing.artifacts);

  // Phase 6: Ethics Review
  if (ethicalGuidelines) {
    const ethicsReview = await ctx.task(ethicsReviewTask, { projectName, strategy, economyDesign, outputDir });
    artifacts.push(...ethicsReview.artifacts);
  }

  await ctx.breakpoint({
    question: `Monetization implementation complete for ${projectName}. ${storeImpl.productCount} products. IAP integration: ${iapIntegration.integrated}. Review?`,
    title: 'Monetization Review',
    context: { runId: ctx.runId, strategy, economyDesign, storeImpl }
  });

  return {
    success: true,
    projectName,
    monetizationDoc: strategy.docPath,
    storeIntegration: { products: storeImpl.productCount, integrated: iapIntegration.integrated },
    economyModel: economyDesign.modelDetails,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/game-development/monetization-implementation', timestamp: startTime, outputDir }
  };
}

export const monetizationStrategyTask = defineTask('monetization-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Monetization Strategy - ${args.projectName}`,
  agent: {
    name: 'monetization-analyst-agent',
    prompt: { role: 'Monetization Designer', task: 'Define monetization strategy', context: args, instructions: ['1. Define monetization pillars', '2. Plan revenue streams', '3. Define pricing strategy', '4. Create ethical guidelines'] },
    outputSchema: { type: 'object', required: ['docPath', 'revenueStreams', 'artifacts'], properties: { docPath: { type: 'string' }, revenueStreams: { type: 'array' }, pricingStrategy: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'monetization', 'strategy']
}));

export const virtualEconomyTask = defineTask('virtual-economy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Virtual Economy - ${args.projectName}`,
  agent: {
    name: 'economy-designer-agent',
    prompt: { role: 'Economy Designer', task: 'Design virtual economy', context: args, instructions: ['1. Define currencies and exchange', '2. Design resource sinks/faucets', '3. Model economy simulation', '4. Set price points'] },
    outputSchema: { type: 'object', required: ['modelDetails', 'currencies', 'artifacts'], properties: { modelDetails: { type: 'object' }, currencies: { type: 'array' }, pricePoints: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'monetization', 'economy']
}));

export const storeImplementationTask = defineTask('store-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Store Implementation - ${args.projectName}`,
  agent: {
    name: 'ui-programmer-agent',
    prompt: { role: 'UI Programmer', task: 'Implement in-game store', context: args, instructions: ['1. Build store UI', '2. Implement product catalog', '3. Add purchase flow', '4. Implement receipts'] },
    outputSchema: { type: 'object', required: ['productCount', 'storeReady', 'artifacts'], properties: { productCount: { type: 'number' }, storeReady: { type: 'boolean' }, purchaseFlow: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'monetization', 'store']
}));

export const iapIntegrationTask = defineTask('iap-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `IAP Integration - ${args.projectName}`,
  agent: {
    name: 'gameplay-programmer-agent',
    prompt: { role: 'Platform Engineer', task: 'Integrate IAP systems', context: args, instructions: ['1. Integrate platform stores', '2. Implement purchase validation', '3. Handle edge cases', '4. Test purchase flows'] },
    outputSchema: { type: 'object', required: ['integrated', 'platforms', 'artifacts'], properties: { integrated: { type: 'boolean' }, platforms: { type: 'array' }, validation: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'monetization', 'iap']
}));

export const monetizationTestingTask = defineTask('monetization-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Monetization Testing - ${args.projectName}`,
  agent: {
    name: 'game-qa-agent',
    prompt: { role: 'QA Engineer', task: 'Test monetization systems', context: args, instructions: ['1. Test all purchase flows', '2. Test refunds', '3. Test edge cases', '4. Verify receipt validation'] },
    outputSchema: { type: 'object', required: ['testsPassed', 'issues', 'artifacts'], properties: { testsPassed: { type: 'number' }, issues: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'monetization', 'testing']
}));

export const ethicsReviewTask = defineTask('ethics-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Ethics Review - ${args.projectName}`,
  agent: {
    name: 'ethics-reviewer-agent',
    prompt: { role: 'Ethics Reviewer', task: 'Review monetization ethics', context: args, instructions: ['1. Review for predatory practices', '2. Check age-appropriate design', '3. Verify spend limits', '4. Review disclosures'] },
    outputSchema: { type: 'object', required: ['passed', 'recommendations', 'artifacts'], properties: { passed: { type: 'boolean' }, recommendations: { type: 'array' }, concerns: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'monetization', 'ethics']
}));
