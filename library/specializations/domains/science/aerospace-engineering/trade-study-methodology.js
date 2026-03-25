/**
 * @process specializations/domains/science/aerospace-engineering/trade-study-methodology
 * @description Systematic methodology for conducting aerospace trade studies including alternatives analysis,
 * weighted criteria evaluation, and decision documentation.
 * @inputs { projectName: string, tradeStudyScope: object, alternatives: array, stakeholders?: array }
 * @outputs { success: boolean, tradeMatrix: object, recommendation: object, sensitivityAnalysis: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, tradeStudyScope, alternatives, stakeholders = [] } = inputs;

  const problemDefinition = await ctx.task(problemDefinitionTask, { projectName, tradeStudyScope, stakeholders });
  const criteriaDefinition = await ctx.task(criteriaDefinitionTask, { projectName, problemDefinition, stakeholders });

  await ctx.breakpoint({
    question: `${criteriaDefinition.criteria.length} evaluation criteria defined for ${projectName}. Proceed with weighting?`,
    title: 'Criteria Definition Review',
    context: { runId: ctx.runId, criteriaDefinition }
  });

  const criteriaWeighting = await ctx.task(criteriaWeightingTask, { projectName, criteria: criteriaDefinition, stakeholders });
  const alternativesAnalysis = await ctx.task(alternativesAnalysisTask, { projectName, alternatives, criteria: criteriaDefinition });
  const scoringMatrix = await ctx.task(scoringMatrixTask, { projectName, alternatives: alternativesAnalysis, weights: criteriaWeighting });

  if (scoringMatrix.topAlternatives.length > 1 && scoringMatrix.scoreDifferential < 0.1) {
    await ctx.breakpoint({
      question: `Top alternatives within 10% score differential. Conduct sensitivity analysis?`,
      title: 'Close Decision Warning',
      context: { runId: ctx.runId, topAlternatives: scoringMatrix.topAlternatives }
    });
  }

  const sensitivityAnalysis = await ctx.task(sensitivityAnalysisTask, { projectName, scoringMatrix, criteriaWeighting });
  const recommendation = await ctx.task(recommendationTask, { projectName, scoringMatrix, sensitivityAnalysis });
  const report = await ctx.task(tradeStudyReportTask, { projectName, problemDefinition, criteriaDefinition, scoringMatrix, sensitivityAnalysis, recommendation });

  await ctx.breakpoint({
    question: `Trade study complete for ${projectName}. Recommended: ${recommendation.selected}. Approve?`,
    title: 'Trade Study Approval',
    context: { runId: ctx.runId, summary: { selected: recommendation.selected, score: recommendation.score, confidence: recommendation.confidence } }
  });

  return { success: true, projectName, tradeMatrix: scoringMatrix, recommendation, sensitivityAnalysis, report, metadata: { processId: 'trade-study-methodology', timestamp: ctx.now() } };
}

export const problemDefinitionTask = defineTask('problem-definition', (args, taskCtx) => ({
  kind: 'agent', title: `Problem Definition - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Systems Engineer', task: 'Define trade study problem', context: args,
    instructions: ['1. Define decision context', '2. Identify constraints', '3. Define objectives', '4. Establish boundaries', '5. Document assumptions'],
    outputFormat: 'JSON object with problem definition'
  }, outputSchema: { type: 'object', required: ['objectives', 'constraints'], properties: { objectives: { type: 'array', items: { type: 'string' } }, constraints: { type: 'array', items: { type: 'object' } } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['trade-study', 'aerospace']
}));

export const criteriaDefinitionTask = defineTask('criteria-definition', (args, taskCtx) => ({
  kind: 'agent', title: `Criteria Definition - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Trade Study Lead', task: 'Define evaluation criteria', context: args,
    instructions: ['1. Identify MOEs/MOPs', '2. Define technical criteria', '3. Define cost criteria', '4. Define schedule criteria', '5. Define risk criteria', '6. Ensure measurability'],
    outputFormat: 'JSON object with criteria'
  }, outputSchema: { type: 'object', required: ['criteria'], properties: { criteria: { type: 'array', items: { type: 'object' } } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['trade-study', 'aerospace']
}));

export const criteriaWeightingTask = defineTask('criteria-weighting', (args, taskCtx) => ({
  kind: 'agent', title: `Criteria Weighting - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Decision Analyst', task: 'Weight evaluation criteria', context: args,
    instructions: ['1. Apply pairwise comparison', '2. Use AHP method', '3. Normalize weights', '4. Check consistency ratio', '5. Document rationale'],
    outputFormat: 'JSON object with weighted criteria'
  }, outputSchema: { type: 'object', required: ['weights', 'consistencyRatio'], properties: { weights: { type: 'object' }, consistencyRatio: { type: 'number' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['trade-study', 'aerospace']
}));

export const alternativesAnalysisTask = defineTask('alternatives-analysis', (args, taskCtx) => ({
  kind: 'agent', title: `Alternatives Analysis - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Systems Analyst', task: 'Analyze trade alternatives', context: args,
    instructions: ['1. Characterize each alternative', '2. Assess technical performance', '3. Estimate costs', '4. Estimate schedule', '5. Assess risks', '6. Document data sources'],
    outputFormat: 'JSON object with alternatives analysis'
  }, outputSchema: { type: 'object', required: ['alternatives'], properties: { alternatives: { type: 'array', items: { type: 'object' } } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['trade-study', 'aerospace']
}));

export const scoringMatrixTask = defineTask('scoring-matrix', (args, taskCtx) => ({
  kind: 'agent', title: `Scoring Matrix - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Trade Study Analyst', task: 'Generate scoring matrix', context: args,
    instructions: ['1. Score each alternative', '2. Apply weights', '3. Calculate weighted scores', '4. Rank alternatives', '5. Identify top performers', '6. Document scoring rationale'],
    outputFormat: 'JSON object with scoring matrix'
  }, outputSchema: { type: 'object', required: ['matrix', 'topAlternatives', 'scoreDifferential'], properties: { matrix: { type: 'object' }, topAlternatives: { type: 'array', items: { type: 'string' } }, scoreDifferential: { type: 'number' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['trade-study', 'aerospace']
}));

export const sensitivityAnalysisTask = defineTask('sensitivity-analysis', (args, taskCtx) => ({
  kind: 'agent', title: `Sensitivity Analysis - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Sensitivity Analyst', task: 'Conduct sensitivity analysis', context: args,
    instructions: ['1. Vary criteria weights', '2. Vary scoring assumptions', '3. Identify decision drivers', '4. Find breakpoints', '5. Assess robustness', '6. Document findings'],
    outputFormat: 'JSON object with sensitivity analysis'
  }, outputSchema: { type: 'object', required: ['robustness', 'keyDrivers'], properties: { robustness: { type: 'number' }, keyDrivers: { type: 'array', items: { type: 'string' } }, breakpoints: { type: 'object' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['trade-study', 'aerospace']
}));

export const recommendationTask = defineTask('recommendation', (args, taskCtx) => ({
  kind: 'agent', title: `Recommendation - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Trade Study Lead', task: 'Formulate recommendation', context: args,
    instructions: ['1. Synthesize analysis', '2. Select recommended alternative', '3. Document rationale', '4. Identify implementation risks', '5. Define next steps'],
    outputFormat: 'JSON object with recommendation'
  }, outputSchema: { type: 'object', required: ['selected', 'score', 'confidence'], properties: { selected: { type: 'string' }, score: { type: 'number' }, confidence: { type: 'number' }, rationale: { type: 'string' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['trade-study', 'aerospace']
}));

export const tradeStudyReportTask = defineTask('trade-study-report', (args, taskCtx) => ({
  kind: 'agent', title: `Trade Study Report - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Trade Study Report Author', task: 'Generate trade study report', context: args,
    instructions: ['1. Create executive summary', '2. Document methodology', '3. Present analysis', '4. Present sensitivity', '5. Document recommendation', '6. Generate markdown'],
    outputFormat: 'JSON object with report'
  }, outputSchema: { type: 'object', required: ['report', 'markdown'], properties: { report: { type: 'object' }, markdown: { type: 'string' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['trade-study', 'aerospace']
}));
