/**
 * @process specializations/domains/business/entrepreneurship/traction-channel-identification
 * @description Traction Channel Identification Process (Bullseye Framework) - Systematic process to identify, test, and prioritize customer acquisition channels using the Bullseye Framework.
 * @inputs { companyName: string, product: string, targetCustomers: array, currentChannels?: array, budget?: number }
 * @outputs { success: boolean, channelBrainstorm: array, testPlans: array, winningChannel: object, focusRecommendation: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/entrepreneurship/traction-channel-identification', {
 *   companyName: 'GrowthCo',
 *   product: 'Developer tools platform',
 *   targetCustomers: ['Software developers', 'Tech startups']
 * });
 *
 * @references
 * - Traction (Weinberg & Mares): https://www.tractionbook.com/
 * - Bullseye Framework: https://www.tractionbook.com/bullseye-framework
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { companyName, product, targetCustomers = [], currentChannels = [], budget = 0 } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Traction Channel Identification for ${companyName}`);

  // Phase 1: 19 Channels Brainstorm
  const channelBrainstorm = await ctx.task(channelBrainstormTask, { companyName, product, targetCustomers });
  artifacts.push(...(channelBrainstorm.artifacts || []));

  // Phase 2: Channel Ranking
  const channelRanking = await ctx.task(channelRankingTask, { companyName, channelBrainstorm, targetCustomers, budget });
  artifacts.push(...(channelRanking.artifacts || []));

  // Phase 3: Top 3 Selection
  const top3Selection = await ctx.task(top3SelectionTask, { companyName, channelRanking });
  artifacts.push(...(top3Selection.artifacts || []));

  // Breakpoint: Review channel selection
  await ctx.breakpoint({
    question: `Review top 3 channels for ${companyName}: ${top3Selection.channels?.join(', ')}. Proceed with test design?`,
    title: 'Channel Selection Review',
    context: { runId: ctx.runId, companyName, channels: top3Selection.channels, files: artifacts }
  });

  // Phase 4: Test Design
  const testDesign = await ctx.task(testDesignTask, { companyName, top3Selection, budget });
  artifacts.push(...(testDesign.artifacts || []));

  // Phase 5: Test Execution Framework
  const testExecution = await ctx.task(testExecutionTask, { companyName, testDesign });
  artifacts.push(...(testExecution.artifacts || []));

  // Phase 6: Results Analysis Framework
  const resultsAnalysis = await ctx.task(resultsAnalysisTask, { companyName, testDesign });
  artifacts.push(...(resultsAnalysis.artifacts || []));

  // Phase 7: Winning Channel Identification
  const winningChannel = await ctx.task(winningChannelTask, { companyName, resultsAnalysis });
  artifacts.push(...(winningChannel.artifacts || []));

  // Phase 8: Focus Recommendation
  const focusRecommendation = await ctx.task(focusRecommendationTask, { companyName, winningChannel });
  artifacts.push(...(focusRecommendation.artifacts || []));

  const endTime = ctx.now();

  return {
    success: true, companyName,
    channelBrainstorm: channelBrainstorm.channels,
    testPlans: testDesign.tests,
    winningChannel: winningChannel,
    focusRecommendation,
    artifacts, duration: endTime - startTime,
    metadata: { processId: 'specializations/domains/business/entrepreneurship/traction-channel-identification', timestamp: startTime, version: '1.0.0' }
  };
}

export const channelBrainstormTask = defineTask('channel-brainstorm', (args, taskCtx) => ({
  kind: 'agent', title: `19 Channels Brainstorm - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Traction Expert', task: 'Brainstorm all 19 traction channels', context: args,
    instructions: ['1. Viral Marketing', '2. Public Relations', '3. Unconventional PR', '4. SEM', '5. Social and Display Ads', '6. Offline Ads', '7. SEO', '8. Content Marketing', '9. Email Marketing', '10. Engineering as Marketing', '11. Targeting Blogs', '12. Business Development', '13. Sales', '14. Affiliate Programs', '15. Existing Platforms', '16. Trade Shows', '17. Offline Events', '18. Speaking Engagements', '19. Community Building'],
    outputFormat: 'JSON with all 19 channels and applicability' },
    outputSchema: { type: 'object', required: ['channels'], properties: { channels: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, applicability: { type: 'string' }, ideas: { type: 'array', items: { type: 'string' } } } } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'traction', 'brainstorm']
}));

export const channelRankingTask = defineTask('channel-ranking', (args, taskCtx) => ({
  kind: 'agent', title: `Channel Ranking - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Growth Strategy Expert', task: 'Rank channels by potential', context: args,
    instructions: ['1. Score by expected volume', '2. Score by cost efficiency', '3. Score by speed to results', '4. Score by scalability', '5. Score by targeting ability', '6. Score by competitive density', '7. Consider team capabilities', '8. Consider budget constraints', '9. Create composite ranking', '10. Identify outer/middle/inner ring'],
    outputFormat: 'JSON with rankings, scores, rings' },
    outputSchema: { type: 'object', required: ['rankings', 'rings'], properties: { rankings: { type: 'array', items: { type: 'object' } }, rings: { type: 'object', properties: { outer: { type: 'array' }, middle: { type: 'array' }, inner: { type: 'array' } } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'traction', 'ranking']
}));

export const top3SelectionTask = defineTask('top3-selection', (args, taskCtx) => ({
  kind: 'agent', title: `Top 3 Selection - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Channel Selection Expert', task: 'Select top 3 channels for testing', context: args,
    instructions: ['1. Select from inner ring', '2. Validate selection criteria', '3. Ensure diversity of approaches', '4. Confirm testability', '5. Check resource requirements', '6. Define selection rationale', '7. Identify dependencies', '8. Confirm team buy-in', '9. Document alternatives', '10. Create selection summary'],
    outputFormat: 'JSON with selected channels, rationale' },
    outputSchema: { type: 'object', required: ['channels', 'rationale'], properties: { channels: { type: 'array', items: { type: 'string' } }, rationale: { type: 'array', items: { type: 'string' } }, alternatives: { type: 'array', items: { type: 'string' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'traction', 'selection']
}));

export const testDesignTask = defineTask('test-design', (args, taskCtx) => ({
  kind: 'agent', title: `Test Design - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Growth Experiment Expert', task: 'Design small-scale channel tests', context: args,
    instructions: ['1. Define test hypothesis', '2. Set test budget', '3. Define test duration', '4. Create test execution plan', '5. Define success metrics', '6. Set up tracking', '7. Define minimum sample', '8. Plan creative/content', '9. Define test variants', '10. Create test brief'],
    outputFormat: 'JSON with tests, budgets, metrics' },
    outputSchema: { type: 'object', required: ['tests'], properties: { tests: { type: 'array', items: { type: 'object', properties: { channel: { type: 'string' }, hypothesis: { type: 'string' }, budget: { type: 'number' }, duration: { type: 'string' }, metrics: { type: 'array', items: { type: 'string' } } } } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'traction', 'testing']
}));

export const testExecutionTask = defineTask('test-execution', (args, taskCtx) => ({
  kind: 'agent', title: `Test Execution Framework - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Test Execution Expert', task: 'Create test execution framework', context: args,
    instructions: ['1. Create execution timeline', '2. Assign ownership', '3. Set up tools and tracking', '4. Create daily check-in process', '5. Define escalation criteria', '6. Plan mid-test adjustments', '7. Create reporting template', '8. Define completion criteria', '9. Plan data collection', '10. Create execution checklist'],
    outputFormat: 'JSON with timeline, checklist, reporting' },
    outputSchema: { type: 'object', required: ['timeline', 'checklist'], properties: { timeline: { type: 'object' }, checklist: { type: 'array', items: { type: 'string' } }, reportingTemplate: { type: 'object' }, escalationCriteria: { type: 'array', items: { type: 'string' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'traction', 'execution']
}));

export const resultsAnalysisTask = defineTask('results-analysis', (args, taskCtx) => ({
  kind: 'agent', title: `Results Analysis Framework - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Growth Analytics Expert', task: 'Create results analysis framework', context: args,
    instructions: ['1. Define analysis metrics', '2. Create comparison framework', '3. Define statistical requirements', '4. Plan cohort analysis', '5. Create CAC calculations', '6. Plan LTV estimates', '7. Define payback analysis', '8. Create scaling projections', '9. Plan qualitative analysis', '10. Create decision criteria'],
    outputFormat: 'JSON with analysisFramework, metrics, criteria' },
    outputSchema: { type: 'object', required: ['analysisFramework', 'decisionCriteria'], properties: { analysisFramework: { type: 'object' }, metrics: { type: 'array', items: { type: 'string' } }, decisionCriteria: { type: 'object' }, scalingProjections: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'traction', 'analysis']
}));

export const winningChannelTask = defineTask('winning-channel', (args, taskCtx) => ({
  kind: 'agent', title: `Winning Channel Identification - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Channel Strategy Expert', task: 'Identify winning channel from tests', context: args,
    instructions: ['1. Compare test results', '2. Apply decision criteria', '3. Assess scalability', '4. Evaluate unit economics', '5. Consider team fit', '6. Assess competitive advantage', '7. Project growth potential', '8. Identify winning channel', '9. Document selection rationale', '10. Plan for runner-ups'],
    outputFormat: 'JSON with winner, rationale, projections' },
    outputSchema: { type: 'object', required: ['winner', 'rationale'], properties: { winner: { type: 'string' }, rationale: { type: 'string' }, metrics: { type: 'object' }, scalabilityAssessment: { type: 'object' }, runnerUps: { type: 'array', items: { type: 'string' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'traction', 'winner']
}));

export const focusRecommendationTask = defineTask('focus-recommendation', (args, taskCtx) => ({
  kind: 'agent', title: `Focus Recommendation - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Growth Strategy Expert', task: 'Create focus and optimization plan', context: args,
    instructions: ['1. Define focus channel', '2. Create optimization roadmap', '3. Set scaling milestones', '4. Define resource allocation', '5. Plan team structure', '6. Create playbook outline', '7. Define success metrics', '8. Plan for diversification', '9. Set review cadence', '10. Create focus summary'],
    outputFormat: 'JSON with focus, roadmap, milestones' },
    outputSchema: { type: 'object', required: ['focus', 'roadmap'], properties: { focus: { type: 'string' }, roadmap: { type: 'array', items: { type: 'object' } }, milestones: { type: 'array', items: { type: 'object' } }, resourceAllocation: { type: 'object' }, diversificationPlan: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'traction', 'focus']
}));
