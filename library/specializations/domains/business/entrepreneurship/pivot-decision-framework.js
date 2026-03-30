/**
 * @process specializations/domains/business/entrepreneurship/pivot-decision-framework
 * @description Pivot Decision Framework Process - Structured process for making data-driven pivot or persevere decisions when facing validation challenges.
 * @inputs { companyName: string, currentStrategy: string, evidenceSummary: object, runway: number, teamCapabilities?: array }
 * @outputs { success: boolean, decision: string, pivotOptions: array, newDirectionPlan: object, evidenceAnalysis: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/entrepreneurship/pivot-decision-framework', {
 *   companyName: 'PivotCo',
 *   currentStrategy: 'B2B SaaS for HR teams',
 *   evidenceSummary: { pmfScore: 35, growth: '2% MoM' },
 *   runway: 8
 * });
 *
 * @references
 * - Lean Startup: https://theleanstartup.com/
 * - Customer Development - Steve Blank
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { companyName, currentStrategy, evidenceSummary = {}, runway, teamCapabilities = [] } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Pivot Decision Framework for ${companyName}`);

  // Phase 1: Evidence Compilation
  const evidenceCompilation = await ctx.task(evidenceCompilationTask, { companyName, evidenceSummary });
  artifacts.push(...(evidenceCompilation.artifacts || []));

  // Phase 2: Progress Assessment
  const progressAssessment = await ctx.task(progressAssessmentTask, { companyName, evidenceCompilation, currentStrategy });
  artifacts.push(...(progressAssessment.artifacts || []));

  // Phase 3: Runway and Resource Analysis
  const runwayAnalysis = await ctx.task(runwayAnalysisTask, { companyName, runway, teamCapabilities });
  artifacts.push(...(runwayAnalysis.artifacts || []));

  // Phase 4: Pivot Options Generation
  const pivotOptions = await ctx.task(pivotOptionsTask, { companyName, currentStrategy, evidenceCompilation, teamCapabilities });
  artifacts.push(...(pivotOptions.artifacts || []));

  // Breakpoint: Review options
  await ctx.breakpoint({
    question: `Review pivot options for ${companyName}. ${pivotOptions.options?.length || 0} options identified. Continue with analysis?`,
    title: 'Pivot Options Review',
    context: { runId: ctx.runId, companyName, optionCount: pivotOptions.options?.length || 0, files: artifacts }
  });

  // Phase 5: Options Analysis
  const optionsAnalysis = await ctx.task(optionsAnalysisTask, { companyName, pivotOptions, teamCapabilities, runwayAnalysis });
  artifacts.push(...(optionsAnalysis.artifacts || []));

  // Phase 6: Decision Framework
  const decisionFramework = await ctx.task(decisionFrameworkTask, { companyName, progressAssessment, optionsAnalysis, runwayAnalysis });
  artifacts.push(...(decisionFramework.artifacts || []));

  // Phase 7: Communication Planning
  const communicationPlan = await ctx.task(communicationPlanTask, { companyName, decisionFramework });
  artifacts.push(...(communicationPlan.artifacts || []));

  // Phase 8: New Direction Plan
  const newDirectionPlan = await ctx.task(newDirectionPlanTask, { companyName, decisionFramework, optionsAnalysis });
  artifacts.push(...(newDirectionPlan.artifacts || []));

  await ctx.breakpoint({
    question: `Pivot decision for ${companyName}: ${decisionFramework.decision}. Confidence: ${decisionFramework.confidence}. Approve?`,
    title: 'Pivot Decision Complete',
    context: { runId: ctx.runId, decision: decisionFramework.decision, confidence: decisionFramework.confidence, files: artifacts }
  });

  const endTime = ctx.now();

  return {
    success: true, companyName,
    decision: decisionFramework.decision,
    pivotOptions: pivotOptions.options,
    newDirectionPlan,
    evidenceAnalysis: evidenceCompilation,
    communicationPlan,
    artifacts, duration: endTime - startTime,
    metadata: { processId: 'specializations/domains/business/entrepreneurship/pivot-decision-framework', timestamp: startTime, version: '1.0.0' }
  };
}

export const evidenceCompilationTask = defineTask('evidence-compilation', (args, taskCtx) => ({
  kind: 'agent', title: `Evidence Compilation - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Lean Startup Analyst', task: 'Compile and organize validation evidence', context: args,
    instructions: ['1. Gather quantitative metrics', '2. Compile qualitative feedback', '3. Organize by hypothesis', '4. Assess evidence quality', '5. Identify patterns', '6. Document customer insights', '7. Compile experiment results', '8. Note conflicting signals', '9. Create evidence summary', '10. Score evidence strength'],
    outputFormat: 'JSON with evidence, patterns, strength' },
    outputSchema: { type: 'object', required: ['evidence', 'patterns'], properties: { evidence: { type: 'array', items: { type: 'object' } }, patterns: { type: 'array', items: { type: 'string' } }, strength: { type: 'object' }, conflicts: { type: 'array', items: { type: 'string' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'pivot', 'evidence']
}));

export const progressAssessmentTask = defineTask('progress-assessment', (args, taskCtx) => ({
  kind: 'agent', title: `Progress Assessment - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Startup Strategy Expert', task: 'Assess progress toward PMF and milestones', context: args,
    instructions: ['1. Assess PMF progress', '2. Compare to milestones', '3. Evaluate traction velocity', '4. Assess learning rate', '5. Identify blockers', '6. Evaluate market response', '7. Assess team effectiveness', '8. Calculate time to milestones', '9. Compare to expectations', '10. Create progress scorecard'],
    outputFormat: 'JSON with progress, gaps, velocity' },
    outputSchema: { type: 'object', required: ['progress', 'gaps'], properties: { progress: { type: 'object' }, gaps: { type: 'array', items: { type: 'string' } }, velocity: { type: 'object' }, blockers: { type: 'array', items: { type: 'string' } }, scorecard: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'pivot', 'progress']
}));

export const runwayAnalysisTask = defineTask('runway-analysis', (args, taskCtx) => ({
  kind: 'agent', title: `Runway Analysis - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Startup Finance Expert', task: 'Analyze runway and resource constraints', context: args,
    instructions: ['1. Calculate remaining runway', '2. Model different scenarios', '3. Assess resource flexibility', '4. Identify cost reduction options', '5. Calculate time to decisions', '6. Assess fundraising feasibility', '7. Model pivot resource needs', '8. Identify critical deadlines', '9. Create runway scenarios', '10. Define decision timeline'],
    outputFormat: 'JSON with runway, scenarios, deadlines' },
    outputSchema: { type: 'object', required: ['runway', 'scenarios'], properties: { runway: { type: 'number' }, scenarios: { type: 'object' }, deadlines: { type: 'array', items: { type: 'object' } }, costOptions: { type: 'array', items: { type: 'string' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'pivot', 'runway']
}));

export const pivotOptionsTask = defineTask('pivot-options', (args, taskCtx) => ({
  kind: 'agent', title: `Pivot Options Generation - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Pivot Strategy Expert', task: 'Generate pivot alternatives', context: args,
    instructions: ['1. Identify zoom-in pivot options', '2. Identify zoom-out pivot options', '3. Explore customer segment pivots', '4. Explore customer need pivot', '5. Explore platform pivot', '6. Explore business model pivot', '7. Explore channel pivot', '8. Explore technology pivot', '9. Generate persevere scenarios', '10. Document all options'],
    outputFormat: 'JSON with options, types, rationale' },
    outputSchema: { type: 'object', required: ['options'], properties: { options: { type: 'array', items: { type: 'object', properties: { type: { type: 'string' }, description: { type: 'string' }, rationale: { type: 'string' } } } }, persevereScenarios: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'pivot', 'options']
}));

export const optionsAnalysisTask = defineTask('options-analysis', (args, taskCtx) => ({
  kind: 'agent', title: `Options Analysis - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Strategy Analysis Expert', task: 'Analyze pivot options against criteria', context: args,
    instructions: ['1. Score market opportunity', '2. Assess team capability fit', '3. Evaluate resource requirements', '4. Estimate time to validation', '5. Assess risk levels', '6. Compare to current path', '7. Evaluate competitive landscape', '8. Assess founder passion fit', '9. Rank options', '10. Create comparison matrix'],
    outputFormat: 'JSON with analysis, rankings, matrix' },
    outputSchema: { type: 'object', required: ['analysis', 'rankings'], properties: { analysis: { type: 'array', items: { type: 'object' } }, rankings: { type: 'array', items: { type: 'string' } }, comparisonMatrix: { type: 'object' }, recommendations: { type: 'array', items: { type: 'string' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'pivot', 'analysis']
}));

export const decisionFrameworkTask = defineTask('decision-framework', (args, taskCtx) => ({
  kind: 'agent', title: `Decision Framework - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Startup Decision Expert', task: 'Make pivot or persevere decision', context: args,
    instructions: ['1. Apply decision criteria', '2. Weigh evidence strength', '3. Consider runway constraints', '4. Evaluate option quality', '5. Make recommendation', '6. Assess confidence level', '7. Identify decision risks', '8. Define reversibility', '9. Document decision rationale', '10. Create decision summary'],
    outputFormat: 'JSON with decision, confidence, rationale' },
    outputSchema: { type: 'object', required: ['decision', 'confidence', 'rationale'], properties: { decision: { type: 'string', enum: ['pivot', 'persevere', 'partial-pivot'] }, confidence: { type: 'string' }, rationale: { type: 'string' }, risks: { type: 'array', items: { type: 'string' } }, reversibility: { type: 'string' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'pivot', 'decision']
}));

export const communicationPlanTask = defineTask('communication-plan', (args, taskCtx) => ({
  kind: 'agent', title: `Communication Plan - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Stakeholder Communication Expert', task: 'Plan decision communication', context: args,
    instructions: ['1. Identify stakeholders', '2. Create messaging framework', '3. Plan team communication', '4. Plan investor communication', '5. Plan customer communication', '6. Create FAQ document', '7. Plan timing and sequence', '8. Prepare for questions', '9. Create internal narrative', '10. Plan external narrative'],
    outputFormat: 'JSON with stakeholders, messaging, timeline' },
    outputSchema: { type: 'object', required: ['stakeholders', 'messaging'], properties: { stakeholders: { type: 'array', items: { type: 'string' } }, messaging: { type: 'object' }, timeline: { type: 'object' }, faq: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'pivot', 'communication']
}));

export const newDirectionPlanTask = defineTask('new-direction-plan', (args, taskCtx) => ({
  kind: 'agent', title: `New Direction Plan - ${args.companyName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Strategy Execution Expert', task: 'Create new direction execution plan', context: args,
    instructions: ['1. Define new direction clearly', '2. Set 90-day milestones', '3. Identify first experiments', '4. Plan resource reallocation', '5. Define success metrics', '6. Create timeline', '7. Identify quick wins', '8. Plan team transitions', '9. Define checkpoints', '10. Create execution roadmap'],
    outputFormat: 'JSON with direction, milestones, roadmap' },
    outputSchema: { type: 'object', required: ['direction', 'milestones'], properties: { direction: { type: 'string' }, milestones: { type: 'array', items: { type: 'object' } }, experiments: { type: 'array', items: { type: 'object' } }, resourcePlan: { type: 'object' }, successMetrics: { type: 'array', items: { type: 'string' } }, roadmap: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['entrepreneurship', 'pivot', 'execution']
}));
