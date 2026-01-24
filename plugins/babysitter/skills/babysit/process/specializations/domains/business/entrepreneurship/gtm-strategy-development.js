/**
 * @process specializations/domains/business/entrepreneurship/gtm-strategy-development
 * @description Go-to-Market Strategy Development Process - Comprehensive process to develop go-to-market strategy including positioning, messaging, channel strategy, and launch planning.
 * @inputs { companyName: string, product: string, targetMarket: string, competitors?: array, launchTimeline?: string }
 * @outputs { success: boolean, gtmStrategy: object, positioning: object, channelPlan: object, launchPlaybook: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/entrepreneurship/gtm-strategy-development', {
 *   companyName: 'LaunchCo',
 *   product: 'AI-powered analytics platform',
 *   targetMarket: 'Mid-market B2B SaaS companies',
 *   launchTimeline: 'Q2 2026'
 * });
 *
 * @references
 * - Crossing the Chasm: https://www.amazon.com/Crossing-Chasm-Geoffrey-Moore/dp/0062292986
 * - Obviously Awesome: https://www.aprildunford.com/obviously-awesome
 * - Traction: https://www.tractionbook.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    companyName,
    product,
    targetMarket,
    competitors = [],
    launchTimeline = ''
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting GTM Strategy Development for ${companyName}`);

  // Phase 1: Target Customer Definition
  const targetCustomers = await ctx.task(targetCustomersTask, { companyName, targetMarket, product });
  artifacts.push(...(targetCustomers.artifacts || []));

  // Phase 2: Positioning Development
  const positioning = await ctx.task(positioningTask, { companyName, product, targetCustomers, competitors });
  artifacts.push(...(positioning.artifacts || []));

  // Phase 3: Messaging Framework
  const messaging = await ctx.task(messagingTask, { companyName, positioning, targetCustomers });
  artifacts.push(...(messaging.artifacts || []));

  // Phase 4: Channel Strategy
  const channelStrategy = await ctx.task(channelStrategyTask, { companyName, targetCustomers, positioning });
  artifacts.push(...(channelStrategy.artifacts || []));

  // Phase 5: Pricing Strategy
  const pricingStrategy = await ctx.task(pricingStrategyTask, { companyName, product, positioning, competitors });
  artifacts.push(...(pricingStrategy.artifacts || []));

  // Breakpoint: Review GTM strategy
  await ctx.breakpoint({
    question: `Review GTM strategy for ${companyName}. Positioning: "${positioning.statement}". Continue with launch planning?`,
    title: 'GTM Strategy Review',
    context: { runId: ctx.runId, companyName, files: artifacts }
  });

  // Phase 6: Launch Planning
  const launchPlan = await ctx.task(launchPlanTask, { companyName, launchTimeline, channelStrategy, messaging });
  artifacts.push(...(launchPlan.artifacts || []));

  // Phase 7: Success Metrics
  const successMetrics = await ctx.task(successMetricsTask, { companyName, channelStrategy, launchPlan });
  artifacts.push(...(successMetrics.artifacts || []));

  // Phase 8: GTM Playbook Assembly
  const gtmPlaybook = await ctx.task(gtmPlaybookTask, {
    companyName, targetCustomers, positioning, messaging, channelStrategy, pricingStrategy, launchPlan, successMetrics
  });
  artifacts.push(...(gtmPlaybook.artifacts || []));

  const endTime = ctx.now();

  return {
    success: true, companyName,
    gtmStrategy: gtmPlaybook,
    positioning, channelPlan: channelStrategy, launchPlaybook: launchPlan, successMetrics,
    artifacts, duration: endTime - startTime,
    metadata: { processId: 'specializations/domains/business/entrepreneurship/gtm-strategy-development', timestamp: startTime, version: '1.0.0' }
  };
}

export const targetCustomersTask = defineTask('target-customers', (args, taskCtx) => ({
  kind: 'agent', title: `Target Customer Definition - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'GTM Strategy Expert', task: 'Define target customer segments and personas', context: args,
    instructions: ['1. Define target customer segments', '2. Create buyer personas', '3. Map buying committee', '4. Identify pain points', '5. Define ideal customer profile', '6. Map customer journey', '7. Identify decision criteria', '8. Define beachhead segment', '9. Assess segment accessibility', '10. Prioritize segments'],
    outputFormat: 'JSON with segments, personas, icp, beachhead' },
    outputSchema: { type: 'object', required: ['segments', 'personas', 'icp'], properties: { segments: { type: 'array', items: { type: 'object' } }, personas: { type: 'array', items: { type: 'object' } }, icp: { type: 'object' }, beachhead: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'gtm', 'customers']
}));

export const positioningTask = defineTask('positioning', (args, taskCtx) => ({
  kind: 'agent', title: `Positioning Development - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Positioning Expert', task: 'Develop product positioning', context: args,
    instructions: ['1. Identify competitive alternatives', '2. Define unique attributes', '3. Map attribute to value', '4. Identify best-fit customers', '5. Define market category', '6. Create positioning statement', '7. Test positioning clarity', '8. Develop elevator pitch', '9. Create positioning matrix', '10. Plan repositioning triggers'],
    outputFormat: 'JSON with statement, attributes, category' },
    outputSchema: { type: 'object', required: ['statement', 'attributes', 'category'], properties: { statement: { type: 'string' }, attributes: { type: 'array', items: { type: 'string' } }, category: { type: 'string' }, elevatorPitch: { type: 'string' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'gtm', 'positioning']
}));

export const messagingTask = defineTask('messaging', (args, taskCtx) => ({
  kind: 'agent', title: `Messaging Framework - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Messaging Expert', task: 'Create messaging framework', context: args,
    instructions: ['1. Create value propositions', '2. Develop key messages per segment', '3. Create proof points', '4. Develop objection handling', '5. Create tagline options', '6. Develop story framework', '7. Create messaging hierarchy', '8. Plan A/B tests', '9. Create persona-specific messaging', '10. Develop competitive messaging'],
    outputFormat: 'JSON with valueProps, keyMessages, tagline' },
    outputSchema: { type: 'object', required: ['valueProps', 'keyMessages'], properties: { valueProps: { type: 'array', items: { type: 'string' } }, keyMessages: { type: 'array', items: { type: 'object' } }, tagline: { type: 'string' }, objectionHandling: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'gtm', 'messaging']
}));

export const channelStrategyTask = defineTask('channel-strategy', (args, taskCtx) => ({
  kind: 'agent', title: `Channel Strategy - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Channel Strategy Expert', task: 'Develop channel strategy', context: args,
    instructions: ['1. Identify all potential channels', '2. Score channels by fit', '3. Prioritize channels', '4. Design channel mix', '5. Plan content strategy', '6. Define sales motion', '7. Plan partnerships', '8. Budget channel investments', '9. Define channel metrics', '10. Create channel playbooks'],
    outputFormat: 'JSON with channels, priorities, budget' },
    outputSchema: { type: 'object', required: ['channels', 'priorities'], properties: { channels: { type: 'array', items: { type: 'object' } }, priorities: { type: 'array', items: { type: 'string' } }, contentStrategy: { type: 'object' }, salesMotion: { type: 'object' }, budget: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'gtm', 'channels']
}));

export const pricingStrategyTask = defineTask('pricing-strategy', (args, taskCtx) => ({
  kind: 'agent', title: `Pricing Strategy - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Pricing Strategy Expert', task: 'Develop pricing strategy', context: args,
    instructions: ['1. Research competitive pricing', '2. Define pricing model', '3. Create pricing tiers', '4. Define packaging', '5. Plan pricing experiments', '6. Set initial price points', '7. Plan pricing evolution', '8. Create pricing page design', '9. Define discount policy', '10. Plan enterprise pricing'],
    outputFormat: 'JSON with model, tiers, pricePoints' },
    outputSchema: { type: 'object', required: ['model', 'tiers'], properties: { model: { type: 'string' }, tiers: { type: 'array', items: { type: 'object' } }, pricePoints: { type: 'object' }, discountPolicy: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'gtm', 'pricing']
}));

export const launchPlanTask = defineTask('launch-plan', (args, taskCtx) => ({
  kind: 'agent', title: `Launch Planning - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Product Launch Expert', task: 'Create launch plan', context: args,
    instructions: ['1. Define launch type', '2. Create launch timeline', '3. Plan pre-launch activities', '4. Design launch day activities', '5. Plan post-launch follow-up', '6. Create press strategy', '7. Plan influencer outreach', '8. Design launch assets', '9. Plan internal readiness', '10. Create contingency plans'],
    outputFormat: 'JSON with timeline, activities, milestones' },
    outputSchema: { type: 'object', required: ['timeline', 'activities'], properties: { timeline: { type: 'object' }, activities: { type: 'array', items: { type: 'object' } }, milestones: { type: 'array', items: { type: 'object' } }, pressStrategy: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'gtm', 'launch']
}));

export const successMetricsTask = defineTask('success-metrics', (args, taskCtx) => ({
  kind: 'agent', title: `Success Metrics - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'GTM Metrics Expert', task: 'Define success metrics', context: args,
    instructions: ['1. Define launch success metrics', '2. Set 30/60/90 day targets', '3. Define channel metrics', '4. Create funnel metrics', '5. Define leading indicators', '6. Set up tracking', '7. Create dashboards', '8. Plan reporting cadence', '9. Define pivot triggers', '10. Create measurement plan'],
    outputFormat: 'JSON with metrics, targets, tracking' },
    outputSchema: { type: 'object', required: ['metrics', 'targets'], properties: { metrics: { type: 'array', items: { type: 'object' } }, targets: { type: 'object' }, funnelMetrics: { type: 'object' }, dashboards: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'gtm', 'metrics']
}));

export const gtmPlaybookTask = defineTask('gtm-playbook', (args, taskCtx) => ({
  kind: 'agent', title: `GTM Playbook Assembly - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'GTM Strategy Expert', task: 'Assemble complete GTM playbook', context: args,
    instructions: ['1. Compile all GTM elements', '2. Create executive summary', '3. Document assumptions', '4. Create action plan', '5. Assign owners', '6. Create timeline view', '7. Document dependencies', '8. Create checklist', '9. Plan for iteration', '10. Create presentation version'],
    outputFormat: 'JSON with playbook, executiveSummary, actionPlan' },
    outputSchema: { type: 'object', required: ['playbook', 'executiveSummary'], properties: { playbook: { type: 'object' }, executiveSummary: { type: 'string' }, actionPlan: { type: 'array', items: { type: 'object' } }, checklist: { type: 'array', items: { type: 'string' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'gtm', 'playbook']
}));
