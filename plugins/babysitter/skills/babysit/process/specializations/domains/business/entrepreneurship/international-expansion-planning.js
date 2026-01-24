/**
 * @process specializations/domains/business/entrepreneurship/international-expansion-planning
 * @description International Expansion Planning Process - Structured approach to planning and executing international market expansion for startups.
 * @inputs { companyName: string, homeMarket: string, targetMarkets: array, product: string, resources?: object }
 * @outputs { success: boolean, marketAnalysis: array, entryStrategy: object, localizationPlan: object, expansionRoadmap: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/entrepreneurship/international-expansion-planning', {
 *   companyName: 'GlobalTech',
 *   homeMarket: 'United States',
 *   targetMarkets: ['United Kingdom', 'Germany', 'Japan'],
 *   product: 'B2B SaaS platform'
 * });
 *
 * @references
 * - Born Global (McKinsey): https://www.mckinsey.com/
 * - International Entrepreneurship: https://www.amazon.com/International-Entrepreneurship-Oviatt/dp/1782545492
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { companyName, homeMarket, targetMarkets = [], product, resources = {} } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting International Expansion Planning for ${companyName}`);

  // Phase 1: Expansion Readiness Assessment
  const readinessAssessment = await ctx.task(readinessAssessmentTask, { companyName, homeMarket, product, resources });
  artifacts.push(...(readinessAssessment.artifacts || []));

  // Phase 2: Market Analysis
  const marketAnalysis = await ctx.task(marketAnalysisTask, { companyName, targetMarkets, product });
  artifacts.push(...(marketAnalysis.artifacts || []));

  // Phase 3: Market Prioritization
  const marketPrioritization = await ctx.task(marketPrioritizationTask, { companyName, marketAnalysis, resources });
  artifacts.push(...(marketPrioritization.artifacts || []));

  // Breakpoint: Review market prioritization
  await ctx.breakpoint({
    question: `Review market prioritization for ${companyName}. Priority market: ${marketPrioritization.priorityMarket}. Proceed with entry strategy?`,
    title: 'Market Prioritization Review',
    context: { runId: ctx.runId, companyName, priorityMarket: marketPrioritization.priorityMarket, files: artifacts }
  });

  // Phase 4: Entry Strategy Development
  const entryStrategy = await ctx.task(entryStrategyTask, { companyName, marketPrioritization, product });
  artifacts.push(...(entryStrategy.artifacts || []));

  // Phase 5: Regulatory and Legal Analysis
  const regulatoryAnalysis = await ctx.task(regulatoryAnalysisTask, { companyName, targetMarkets: marketPrioritization.prioritizedMarkets });
  artifacts.push(...(regulatoryAnalysis.artifacts || []));

  // Phase 6: Localization Planning
  const localizationPlan = await ctx.task(localizationPlanTask, { companyName, marketPrioritization, product });
  artifacts.push(...(localizationPlan.artifacts || []));

  // Phase 7: Go-to-Market Adaptation
  const gtmAdaptation = await ctx.task(gtmAdaptationTask, { companyName, marketPrioritization, entryStrategy });
  artifacts.push(...(gtmAdaptation.artifacts || []));

  // Phase 8: Operations Setup Planning
  const operationsSetup = await ctx.task(operationsSetupTask, { companyName, marketPrioritization, entryStrategy });
  artifacts.push(...(operationsSetup.artifacts || []));

  // Phase 9: Financial Planning
  const financialPlanning = await ctx.task(financialPlanningTask, { companyName, marketPrioritization, entryStrategy, resources });
  artifacts.push(...(financialPlanning.artifacts || []));

  // Phase 10: Expansion Roadmap
  const expansionRoadmap = await ctx.task(expansionRoadmapTask, {
    companyName, marketPrioritization, entryStrategy, localizationPlan, gtmAdaptation, operationsSetup, financialPlanning
  });
  artifacts.push(...(expansionRoadmap.artifacts || []));

  const endTime = ctx.now();

  return {
    success: true, companyName,
    marketAnalysis: marketAnalysis.markets,
    entryStrategy,
    localizationPlan,
    expansionRoadmap,
    regulatoryAnalysis,
    financialPlanning,
    artifacts, duration: endTime - startTime,
    metadata: { processId: 'specializations/domains/business/entrepreneurship/international-expansion-planning', timestamp: startTime, version: '1.0.0' }
  };
}

export const readinessAssessmentTask = defineTask('readiness-assessment', (args, taskCtx) => ({
  kind: 'agent', title: `Expansion Readiness Assessment - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'International Expansion Expert', task: 'Assess expansion readiness', context: args,
    instructions: ['1. Assess product readiness', '2. Evaluate team readiness', '3. Assess financial readiness', '4. Evaluate operational capacity', '5. Review technology scalability', '6. Assess market position', '7. Evaluate support capabilities', '8. Review partnership readiness', '9. Identify gaps and risks', '10. Create readiness scorecard'],
    outputFormat: 'JSON with readinessScore, gaps, recommendations' },
    outputSchema: { type: 'object', required: ['readinessScore', 'gaps'], properties: { readinessScore: { type: 'number' }, gaps: { type: 'array', items: { type: 'string' } }, recommendations: { type: 'array', items: { type: 'string' } }, scorecard: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'international', 'readiness']
}));

export const marketAnalysisTask = defineTask('market-analysis', (args, taskCtx) => ({
  kind: 'agent', title: `International Market Analysis - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'International Market Research Expert', task: 'Analyze target markets', context: args,
    instructions: ['1. Research market size for each target', '2. Analyze market growth rates', '3. Research competitive landscape', '4. Analyze cultural factors', '5. Research regulatory environment', '6. Analyze economic factors', '7. Research technology adoption', '8. Analyze customer behavior', '9. Identify market opportunities', '10. Create market profiles'],
    outputFormat: 'JSON with markets, opportunities, risks' },
    outputSchema: { type: 'object', required: ['markets'], properties: { markets: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, size: { type: 'string' }, growth: { type: 'string' }, opportunity: { type: 'string' } } } }, opportunities: { type: 'array', items: { type: 'string' } }, risks: { type: 'array', items: { type: 'string' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'international', 'market-analysis']
}));

export const marketPrioritizationTask = defineTask('market-prioritization', (args, taskCtx) => ({
  kind: 'agent', title: `Market Prioritization - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Market Strategy Expert', task: 'Prioritize target markets', context: args,
    instructions: ['1. Score market attractiveness', '2. Score competitive intensity', '3. Score market accessibility', '4. Score resource requirements', '5. Score strategic fit', '6. Calculate composite scores', '7. Create prioritization matrix', '8. Identify quick wins', '9. Recommend sequencing', '10. Document prioritization rationale'],
    outputFormat: 'JSON with prioritizedMarkets, priorityMarket, scores' },
    outputSchema: { type: 'object', required: ['prioritizedMarkets', 'priorityMarket'], properties: { prioritizedMarkets: { type: 'array', items: { type: 'string' } }, priorityMarket: { type: 'string' }, scores: { type: 'object' }, sequencing: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'international', 'prioritization']
}));

export const entryStrategyTask = defineTask('entry-strategy', (args, taskCtx) => ({
  kind: 'agent', title: `Entry Strategy Development - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'International Strategy Expert', task: 'Develop market entry strategy', context: args,
    instructions: ['1. Evaluate direct entry options', '2. Evaluate partnership options', '3. Evaluate acquisition options', '4. Analyze entry costs', '5. Analyze speed to market', '6. Analyze control requirements', '7. Evaluate risk profiles', '8. Select optimal entry mode', '9. Define entry timeline', '10. Document entry strategy'],
    outputFormat: 'JSON with entryMode, rationale, timeline' },
    outputSchema: { type: 'object', required: ['entryMode', 'rationale'], properties: { entryMode: { type: 'string' }, rationale: { type: 'string' }, alternatives: { type: 'array', items: { type: 'object' } }, timeline: { type: 'object' }, costs: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'international', 'entry-strategy']
}));

export const regulatoryAnalysisTask = defineTask('regulatory-analysis', (args, taskCtx) => ({
  kind: 'agent', title: `Regulatory and Legal Analysis - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'International Legal Expert', task: 'Analyze regulatory requirements', context: args,
    instructions: ['1. Research data privacy laws (GDPR, etc.)', '2. Analyze corporate structure requirements', '3. Research tax implications', '4. Analyze employment laws', '5. Research industry regulations', '6. Analyze intellectual property', '7. Research import/export requirements', '8. Analyze consumer protection', '9. Identify compliance requirements', '10. Create regulatory checklist'],
    outputFormat: 'JSON with regulations, compliance, risks' },
    outputSchema: { type: 'object', required: ['regulations', 'compliance'], properties: { regulations: { type: 'array', items: { type: 'object' } }, compliance: { type: 'array', items: { type: 'object' } }, risks: { type: 'array', items: { type: 'string' } }, checklist: { type: 'array', items: { type: 'string' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'international', 'regulatory']
}));

export const localizationPlanTask = defineTask('localization-plan', (args, taskCtx) => ({
  kind: 'agent', title: `Localization Planning - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Localization Expert', task: 'Create localization plan', context: args,
    instructions: ['1. Plan product localization', '2. Plan content translation', '3. Plan cultural adaptation', '4. Plan pricing localization', '5. Plan payment methods', '6. Plan support localization', '7. Plan marketing localization', '8. Define localization timeline', '9. Estimate localization costs', '10. Create localization roadmap'],
    outputFormat: 'JSON with localizationPlan, timeline, costs' },
    outputSchema: { type: 'object', required: ['localizationPlan', 'timeline'], properties: { localizationPlan: { type: 'object' }, productChanges: { type: 'array', items: { type: 'object' } }, timeline: { type: 'object' }, costs: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'international', 'localization']
}));

export const gtmAdaptationTask = defineTask('gtm-adaptation', (args, taskCtx) => ({
  kind: 'agent', title: `GTM Adaptation - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'International Marketing Expert', task: 'Adapt go-to-market strategy', context: args,
    instructions: ['1. Adapt positioning', '2. Adapt messaging', '3. Adapt channel strategy', '4. Adapt pricing strategy', '5. Plan local partnerships', '6. Adapt sales approach', '7. Plan local marketing', '8. Define local KPIs', '9. Create launch plan', '10. Document GTM playbook'],
    outputFormat: 'JSON with gtmStrategy, channels, partnerships' },
    outputSchema: { type: 'object', required: ['gtmStrategy', 'channels'], properties: { gtmStrategy: { type: 'object' }, channels: { type: 'array', items: { type: 'object' } }, partnerships: { type: 'array', items: { type: 'object' } }, launchPlan: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'international', 'gtm']
}));

export const operationsSetupTask = defineTask('operations-setup', (args, taskCtx) => ({
  kind: 'agent', title: `Operations Setup Planning - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'International Operations Expert', task: 'Plan operations setup', context: args,
    instructions: ['1. Plan legal entity setup', '2. Plan banking setup', '3. Plan office/remote setup', '4. Plan hiring approach', '5. Plan vendor relationships', '6. Plan technology setup', '7. Plan support operations', '8. Plan financial operations', '9. Create setup checklist', '10. Document operations playbook'],
    outputFormat: 'JSON with operationsPlan, checklist, timeline' },
    outputSchema: { type: 'object', required: ['operationsPlan', 'checklist'], properties: { operationsPlan: { type: 'object' }, checklist: { type: 'array', items: { type: 'string' } }, timeline: { type: 'object' }, vendors: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'international', 'operations']
}));

export const financialPlanningTask = defineTask('financial-planning', (args, taskCtx) => ({
  kind: 'agent', title: `Financial Planning - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'International Finance Expert', task: 'Create financial plan for expansion', context: args,
    instructions: ['1. Estimate expansion investment', '2. Project market revenues', '3. Model cost structure', '4. Plan currency management', '5. Model break-even timeline', '6. Create cash flow projections', '7. Plan for contingencies', '8. Model different scenarios', '9. Define financial milestones', '10. Create financial model'],
    outputFormat: 'JSON with financialPlan, projections, investment' },
    outputSchema: { type: 'object', required: ['financialPlan', 'investment'], properties: { financialPlan: { type: 'object' }, investment: { type: 'object' }, projections: { type: 'object' }, breakEven: { type: 'object' }, scenarios: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'international', 'finance']
}));

export const expansionRoadmapTask = defineTask('expansion-roadmap', (args, taskCtx) => ({
  kind: 'agent', title: `Expansion Roadmap - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Program Management Expert', task: 'Create expansion roadmap', context: args,
    instructions: ['1. Define expansion phases', '2. Create detailed timeline', '3. Define milestones', '4. Assign ownership', '5. Identify dependencies', '6. Plan resource allocation', '7. Define checkpoints', '8. Create risk mitigation plan', '9. Define success metrics', '10. Document expansion plan'],
    outputFormat: 'JSON with roadmap, phases, milestones' },
    outputSchema: { type: 'object', required: ['roadmap', 'phases'], properties: { roadmap: { type: 'object' }, phases: { type: 'array', items: { type: 'object' } }, milestones: { type: 'array', items: { type: 'object' } }, risks: { type: 'array', items: { type: 'object' } }, successMetrics: { type: 'array', items: { type: 'string' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'international', 'roadmap']
}));
