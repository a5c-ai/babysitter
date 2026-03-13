/**
 * @process specializations/domains/business/entrepreneurship/growth-experiment-design
 * @description Growth Experiment Design and Execution Process - Systematic approach to designing, running, and analyzing growth experiments with statistical rigor.
 * @inputs { companyName: string, growthGoal: string, currentMetrics: object, hypotheses?: array, budget?: number }
 * @outputs { success: boolean, experimentDesigns: array, executionPlan: object, analysisFramework: object, learningDocumentation: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/entrepreneurship/growth-experiment-design', {
 *   companyName: 'GrowthLab',
 *   growthGoal: 'Increase activation rate from 30% to 50%',
 *   currentMetrics: { activation: 30, retention7d: 25 }
 * });
 *
 * @references
 * - Hacking Growth (Sean Ellis): https://www.amazon.com/Hacking-Growth-Morgan-Brown/dp/045149721X
 * - Trustworthy Online Controlled Experiments: https://www.amazon.com/Trustworthy-Online-Controlled-Experiments-Practical/dp/1108724264
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { companyName, growthGoal, currentMetrics = {}, hypotheses = [], budget = 0 } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Growth Experiment Design for ${companyName}`);

  // Phase 1: Growth Model Analysis
  const growthModel = await ctx.task(growthModelTask, { companyName, currentMetrics, growthGoal });
  artifacts.push(...(growthModel.artifacts || []));

  // Phase 2: Hypothesis Generation
  const hypothesisGeneration = await ctx.task(hypothesisGenerationTask, { companyName, growthModel, hypotheses });
  artifacts.push(...(hypothesisGeneration.artifacts || []));

  // Phase 3: Hypothesis Prioritization
  const hypothesisPrioritization = await ctx.task(hypothesisPrioritizationTask, { companyName, hypothesisGeneration, budget });
  artifacts.push(...(hypothesisPrioritization.artifacts || []));

  // Breakpoint: Review prioritized hypotheses
  await ctx.breakpoint({
    question: `Review prioritized hypotheses for ${companyName}. Top hypothesis: ${hypothesisPrioritization.topHypothesis}. Proceed with experiment design?`,
    title: 'Hypothesis Prioritization Review',
    context: { runId: ctx.runId, companyName, topHypothesis: hypothesisPrioritization.topHypothesis, files: artifacts }
  });

  // Phase 4: Experiment Design
  const experimentDesign = await ctx.task(experimentDesignTask, { companyName, hypothesisPrioritization });
  artifacts.push(...(experimentDesign.artifacts || []));

  // Phase 5: Statistical Planning
  const statisticalPlanning = await ctx.task(statisticalPlanningTask, { companyName, experimentDesign, currentMetrics });
  artifacts.push(...(statisticalPlanning.artifacts || []));

  // Phase 6: Execution Planning
  const executionPlan = await ctx.task(executionPlanTask, { companyName, experimentDesign, statisticalPlanning });
  artifacts.push(...(executionPlan.artifacts || []));

  // Phase 7: Monitoring Framework
  const monitoringFramework = await ctx.task(monitoringFrameworkTask, { companyName, experimentDesign, statisticalPlanning });
  artifacts.push(...(monitoringFramework.artifacts || []));

  // Phase 8: Analysis Framework
  const analysisFramework = await ctx.task(analysisFrameworkTask, { companyName, experimentDesign, statisticalPlanning });
  artifacts.push(...(analysisFramework.artifacts || []));

  // Phase 9: Learning Documentation
  const learningDocumentation = await ctx.task(learningDocumentationTask, { companyName, experimentDesign });
  artifacts.push(...(learningDocumentation.artifacts || []));

  const endTime = ctx.now();

  return {
    success: true, companyName,
    experimentDesigns: experimentDesign.experiments,
    executionPlan,
    analysisFramework,
    learningDocumentation,
    artifacts, duration: endTime - startTime,
    metadata: { processId: 'specializations/domains/business/entrepreneurship/growth-experiment-design', timestamp: startTime, version: '1.0.0' }
  };
}

export const growthModelTask = defineTask('growth-model', (args, taskCtx) => ({
  kind: 'agent', title: `Growth Model Analysis - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Growth Strategy Expert', task: 'Analyze growth model and levers', context: args,
    instructions: ['1. Map growth funnel stages', '2. Identify key metrics per stage', '3. Calculate conversion rates', '4. Identify growth levers', '5. Quantify lever impact', '6. Map dependencies', '7. Identify constraints', '8. Calculate growth ceiling', '9. Prioritize levers', '10. Create growth model diagram'],
    outputFormat: 'JSON with growthModel, levers, metrics' },
    outputSchema: { type: 'object', required: ['growthModel', 'levers'], properties: { growthModel: { type: 'object' }, levers: { type: 'array', items: { type: 'object' } }, metrics: { type: 'object' }, constraints: { type: 'array', items: { type: 'string' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'growth', 'model']
}));

export const hypothesisGenerationTask = defineTask('hypothesis-generation', (args, taskCtx) => ({
  kind: 'agent', title: `Hypothesis Generation - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Growth Experimentation Expert', task: 'Generate growth hypotheses', context: args,
    instructions: ['1. Brainstorm acquisition hypotheses', '2. Brainstorm activation hypotheses', '3. Brainstorm retention hypotheses', '4. Brainstorm referral hypotheses', '5. Brainstorm revenue hypotheses', '6. Structure hypotheses properly', '7. Define expected impact', '8. Identify quick wins', '9. Identify moonshots', '10. Document all hypotheses'],
    outputFormat: 'JSON with hypotheses, categories' },
    outputSchema: { type: 'object', required: ['hypotheses'], properties: { hypotheses: { type: 'array', items: { type: 'object', properties: { statement: { type: 'string' }, category: { type: 'string' }, expectedImpact: { type: 'string' } } } }, categories: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'growth', 'hypothesis']
}));

export const hypothesisPrioritizationTask = defineTask('hypothesis-prioritization', (args, taskCtx) => ({
  kind: 'agent', title: `Hypothesis Prioritization - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Growth Strategy Expert', task: 'Prioritize hypotheses using ICE/RICE', context: args,
    instructions: ['1. Apply ICE scoring (Impact, Confidence, Ease)', '2. Apply RICE scoring (Reach, Impact, Confidence, Effort)', '3. Consider budget constraints', '4. Consider team capabilities', '5. Consider timeline', '6. Rank hypotheses', '7. Select top candidates', '8. Identify dependencies', '9. Create testing roadmap', '10. Document prioritization rationale'],
    outputFormat: 'JSON with prioritizedList, topHypothesis, scores' },
    outputSchema: { type: 'object', required: ['prioritizedList', 'topHypothesis'], properties: { prioritizedList: { type: 'array', items: { type: 'object' } }, topHypothesis: { type: 'string' }, scores: { type: 'object' }, roadmap: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'growth', 'prioritization']
}));

export const experimentDesignTask = defineTask('experiment-design', (args, taskCtx) => ({
  kind: 'agent', title: `Experiment Design - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Experimentation Expert', task: 'Design controlled experiments', context: args,
    instructions: ['1. Define experiment objective', '2. Define control and treatment', '3. Define randomization unit', '4. Define success metrics', '5. Define guardrail metrics', '6. Define segment criteria', '7. Plan experiment variants', '8. Define experiment duration', '9. Plan rollout strategy', '10. Document experiment brief'],
    outputFormat: 'JSON with experiments, variants, metrics' },
    outputSchema: { type: 'object', required: ['experiments'], properties: { experiments: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, hypothesis: { type: 'string' }, control: { type: 'string' }, treatment: { type: 'string' }, metrics: { type: 'array', items: { type: 'string' } } } } }, variants: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'growth', 'experiment-design']
}));

export const statisticalPlanningTask = defineTask('statistical-planning', (args, taskCtx) => ({
  kind: 'agent', title: `Statistical Planning - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Statistical Analysis Expert', task: 'Plan statistical analysis approach', context: args,
    instructions: ['1. Calculate sample size requirements', '2. Define statistical power', '3. Define significance level', '4. Choose statistical tests', '5. Plan for multiple comparisons', '6. Define minimum detectable effect', '7. Plan for novelty effects', '8. Plan for network effects', '9. Define stopping criteria', '10. Create statistical analysis plan'],
    outputFormat: 'JSON with sampleSize, power, tests, analysisplan' },
    outputSchema: { type: 'object', required: ['sampleSize', 'statisticalPlan'], properties: { sampleSize: { type: 'number' }, power: { type: 'number' }, significanceLevel: { type: 'number' }, tests: { type: 'array', items: { type: 'string' } }, statisticalPlan: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'growth', 'statistics']
}));

export const executionPlanTask = defineTask('execution-plan', (args, taskCtx) => ({
  kind: 'agent', title: `Execution Planning - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Growth Operations Expert', task: 'Create experiment execution plan', context: args,
    instructions: ['1. Define implementation steps', '2. Assign responsibilities', '3. Create timeline', '4. Define QA checklist', '5. Plan instrumentation', '6. Define launch criteria', '7. Plan communication', '8. Define escalation procedures', '9. Create rollback plan', '10. Document execution playbook'],
    outputFormat: 'JSON with executionPlan, timeline, checklist' },
    outputSchema: { type: 'object', required: ['executionPlan', 'timeline'], properties: { executionPlan: { type: 'object' }, timeline: { type: 'array', items: { type: 'object' } }, checklist: { type: 'array', items: { type: 'string' } }, rollbackPlan: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'growth', 'execution']
}));

export const monitoringFrameworkTask = defineTask('monitoring-framework', (args, taskCtx) => ({
  kind: 'agent', title: `Monitoring Framework - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Experimentation Operations Expert', task: 'Create experiment monitoring framework', context: args,
    instructions: ['1. Define monitoring dashboards', '2. Set up alerts', '3. Define health checks', '4. Plan daily reviews', '5. Define intervention triggers', '6. Create data quality checks', '7. Plan for anomaly detection', '8. Define reporting cadence', '9. Create monitoring playbook', '10. Document escalation procedures'],
    outputFormat: 'JSON with monitoringPlan, dashboards, alerts' },
    outputSchema: { type: 'object', required: ['monitoringPlan', 'alerts'], properties: { monitoringPlan: { type: 'object' }, dashboards: { type: 'array', items: { type: 'object' } }, alerts: { type: 'array', items: { type: 'object' } }, healthChecks: { type: 'array', items: { type: 'string' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'growth', 'monitoring']
}));

export const analysisFrameworkTask = defineTask('analysis-framework', (args, taskCtx) => ({
  kind: 'agent', title: `Analysis Framework - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Growth Analytics Expert', task: 'Create results analysis framework', context: args,
    instructions: ['1. Define analysis workflow', '2. Create analysis templates', '3. Plan segmentation analysis', '4. Plan heterogeneous treatment effects', '5. Define decision criteria', '6. Plan sensitivity analysis', '7. Create visualization templates', '8. Define interpretation guidelines', '9. Plan peer review process', '10. Document analysis playbook'],
    outputFormat: 'JSON with analysisFramework, templates, criteria' },
    outputSchema: { type: 'object', required: ['analysisFramework', 'decisionCriteria'], properties: { analysisFramework: { type: 'object' }, templates: { type: 'array', items: { type: 'object' } }, decisionCriteria: { type: 'object' }, visualizations: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'growth', 'analysis']
}));

export const learningDocumentationTask = defineTask('learning-documentation', (args, taskCtx) => ({
  kind: 'agent', title: `Learning Documentation - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Knowledge Management Expert', task: 'Create learning documentation framework', context: args,
    instructions: ['1. Create experiment report template', '2. Define learning capture process', '3. Create knowledge repository', '4. Plan for pattern recognition', '5. Define sharing cadence', '6. Create case study templates', '7. Plan for institutional memory', '8. Define metadata schema', '9. Plan for searchability', '10. Document knowledge management playbook'],
    outputFormat: 'JSON with learningFramework, templates, repository' },
    outputSchema: { type: 'object', required: ['learningFramework', 'templates'], properties: { learningFramework: { type: 'object' }, templates: { type: 'array', items: { type: 'object' } }, repository: { type: 'object' }, sharingCadence: { type: 'string' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'growth', 'learning']
}));
