/**
 * @process domains/science/scientific-discovery/multi-criteria-decision-analysis-structured
 * @description Structure complex decisions with multiple objectives - Guides decision-makers through
 * rigorous multi-criteria decision analysis (MCDA) to make transparent, defensible choices.
 * @inputs { decision: string, alternatives: array, criteria: array, stakeholders?: array }
 * @outputs { success: boolean, ranking: array, sensitivityAnalysis: object, recommendation: object, documentation: object }
 *
 * @example
 * const result = await orchestrate('domains/science/scientific-discovery/multi-criteria-decision-analysis-structured', {
 *   decision: 'Select new office location',
 *   alternatives: ['Downtown', 'Suburbs', 'Remote-first'],
 *   criteria: ['Cost', 'Employee satisfaction', 'Client access', 'Growth potential'],
 *   stakeholders: ['Executive team', 'Employees', 'Clients']
 * });
 *
 * @references
 * - Belton, V. & Stewart, T. (2002). Multiple Criteria Decision Analysis: An Integrated Approach
 * - Keeney, R.L. & Raiffa, H. (1993). Decisions with Multiple Objectives
 * - Saaty, T.L. (1980). The Analytic Hierarchy Process
 * - Greco, S. et al. (2016). Multiple Criteria Decision Analysis: State of the Art Surveys
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { decision, alternatives = [], criteria = [], stakeholders = [], outputDir = 'mcda-output', minimumConsensusScore = 70 } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Multi-Criteria Decision Analysis for: ${decision}`);

  const problemStructuring = await ctx.task(problemStructuringTask, { decision, alternatives, criteria, stakeholders, outputDir });
  artifacts.push(...problemStructuring.artifacts);

  const valueTreeConstruction = await ctx.task(valueTreeTask, { criteria, problemStructuring, outputDir });
  artifacts.push(...valueTreeConstruction.artifacts);

  const alternativeGeneration = await ctx.task(alternativeGenerationTask, { alternatives, decision, valueTree: valueTreeConstruction, outputDir });
  artifacts.push(...alternativeGeneration.artifacts);

  await ctx.breakpoint({
    question: `Problem structured. ${alternativeGeneration.alternatives?.length || 0} alternatives, ${valueTreeConstruction.criteria?.length || 0} criteria. Review structure before scoring?`,
    title: 'MCDA Structure Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })), summary: { alternatives: alternativeGeneration.alternatives?.length || 0, criteria: valueTreeConstruction.criteria?.length || 0 }}
  });

  const criteriaWeighting = await ctx.task(criteriaWeightingTask, { criteria: valueTreeConstruction.criteria, stakeholders, outputDir });
  artifacts.push(...criteriaWeighting.artifacts);

  const performanceScoring = await ctx.task(performanceScoringTask, { alternatives: alternativeGeneration.alternatives, criteria: valueTreeConstruction.criteria, outputDir });
  artifacts.push(...performanceScoring.artifacts);

  const valueFunction = await ctx.task(valueFunctionTask, { performanceScoring, criteria: valueTreeConstruction.criteria, outputDir });
  artifacts.push(...valueFunction.artifacts);

  const aggregation = await ctx.task(aggregationTask, { valueFunction, weights: criteriaWeighting.weights, alternatives: alternativeGeneration.alternatives, outputDir });
  artifacts.push(...aggregation.artifacts);

  const sensitivityAnalysis = await ctx.task(mcdaSensitivityTask, { aggregation, weights: criteriaWeighting.weights, valueFunction, outputDir });
  artifacts.push(...sensitivityAnalysis.artifacts);

  const robustnessAnalysis = await ctx.task(mcdaRobustnessTask, { aggregation, sensitivityAnalysis, alternatives: alternativeGeneration.alternatives, outputDir });
  artifacts.push(...robustnessAnalysis.artifacts);

  const recommendationGeneration = await ctx.task(mcdaRecommendationTask, { aggregation, sensitivityAnalysis, robustnessAnalysis, decision, outputDir });
  artifacts.push(...recommendationGeneration.artifacts);

  const qualityScore = await ctx.task(mcdaQualityScoringTask, { problemStructuring, criteriaWeighting, performanceScoring, aggregation, sensitivityAnalysis, minimumConsensusScore, outputDir });
  artifacts.push(...qualityScore.artifacts);

  await ctx.breakpoint({
    question: `MCDA complete. Top choice: "${aggregation.ranking?.[0]?.alternative || 'N/A'}". Robustness: ${robustnessAnalysis.robustnessLevel || 'N/A'}. Quality: ${qualityScore.overallScore}/100. Approve?`,
    title: 'MCDA Approval',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })), summary: { topChoice: aggregation.ranking?.[0]?.alternative || 'N/A', robustness: robustnessAnalysis.robustnessLevel || 'N/A', qualityScore: qualityScore.overallScore }}
  });

  return {
    success: true, decision, ranking: aggregation.ranking, sensitivityAnalysis: sensitivityAnalysis,
    recommendation: recommendationGeneration, documentation: { valueTree: valueTreeConstruction, weights: criteriaWeighting, scores: performanceScoring },
    qualityScore: { overall: qualityScore.overallScore }, artifacts, duration: ctx.now() - startTime,
    metadata: { processId: 'domains/science/scientific-discovery/multi-criteria-decision-analysis-structured', timestamp: startTime, outputDir }
  };
}

export const problemStructuringTask = defineTask('problem-structuring', (args, taskCtx) => ({
  kind: 'agent', title: 'Structure the decision problem',
  skill: { name: 'hypothesis-generator' },
  agent: { name: 'decision-analyst', skills: ['hypothesis-generator', 'bayesian-inference-engine'], prompt: { role: 'Decision analyst', task: 'Structure the multi-criteria decision problem', context: args, instructions: ['Define decision context clearly', 'Identify decision makers and stakeholders', 'Clarify decision scope and constraints', 'Identify objectives and sub-objectives', 'Define success criteria', 'Document problem boundaries'], outputFormat: 'JSON with decisionContext, decisionMakers, scope, constraints, objectives, successCriteria, boundaries, artifacts' }, outputSchema: { type: 'object', required: ['decisionContext', 'objectives', 'artifacts'], properties: { decisionContext: { type: 'string' }, decisionMakers: { type: 'array' }, scope: { type: 'object' }, constraints: { type: 'array' }, objectives: { type: 'array' }, successCriteria: { type: 'array' }, boundaries: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'mcda']
}));

export const valueTreeTask = defineTask('value-tree', (args, taskCtx) => ({
  kind: 'agent', title: 'Construct value tree',
  skill: { name: 'hypothesis-generator' },
  agent: { name: 'decision-analyst', skills: ['hypothesis-generator', 'bayesian-inference-engine'], prompt: { role: 'Value modeling specialist', task: 'Construct hierarchical value tree for criteria', context: args, instructions: ['Organize criteria hierarchically', 'Ensure criteria are MECE (mutually exclusive, collectively exhaustive)', 'Define measurable attributes for each criterion', 'Check for redundancy', 'Verify completeness', 'Document value tree structure'], outputFormat: 'JSON with valueTree, criteria, attributes, hierarchy, redundancyCheck, completenessCheck, artifacts' }, outputSchema: { type: 'object', required: ['valueTree', 'criteria', 'artifacts'], properties: { valueTree: { type: 'object' }, criteria: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, attribute: { type: 'string' }, direction: { type: 'string' } } } }, attributes: { type: 'array' }, hierarchy: { type: 'object' }, redundancyCheck: { type: 'object' }, completenessCheck: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'mcda']
}));

export const alternativeGenerationTask = defineTask('alternative-generation', (args, taskCtx) => ({
  kind: 'agent', title: 'Generate and refine alternatives',
  skill: { name: 'hypothesis-generator' },
  agent: { name: 'decision-analyst', skills: ['hypothesis-generator', 'bayesian-inference-engine'], prompt: { role: 'Alternative generation specialist', task: 'Generate and refine decision alternatives', context: args, instructions: ['Review provided alternatives', 'Generate additional creative alternatives', 'Ensure alternatives are distinct and viable', 'Check alternatives cover solution space', 'Screen out dominated alternatives', 'Document final alternative set'], outputFormat: 'JSON with alternatives, generatedAlternatives, screeningResults, dominanceCheck, finalSet, artifacts' }, outputSchema: { type: 'object', required: ['alternatives', 'finalSet', 'artifacts'], properties: { alternatives: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, description: { type: 'string' } } } }, generatedAlternatives: { type: 'array' }, screeningResults: { type: 'object' }, dominanceCheck: { type: 'object' }, finalSet: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'mcda']
}));

export const criteriaWeightingTask = defineTask('criteria-weighting', (args, taskCtx) => ({
  kind: 'agent', title: 'Weight criteria',
  skill: { name: 'hypothesis-generator' },
  agent: { name: 'decision-analyst', skills: ['hypothesis-generator', 'bayesian-inference-engine'], prompt: { role: 'Weighting specialist', task: 'Elicit and aggregate criteria weights', context: args, instructions: ['Apply swing weighting method', 'Consider AHP pairwise comparisons', 'Check for consistency', 'Aggregate stakeholder weights if multiple', 'Normalize weights to sum to 1', 'Document weighting rationale'], outputFormat: 'JSON with weights, swingWeights, ahpWeights, consistencyCheck, aggregatedWeights, normalizedWeights, rationale, artifacts' }, outputSchema: { type: 'object', required: ['weights', 'normalizedWeights', 'artifacts'], properties: { weights: { type: 'object' }, swingWeights: { type: 'object' }, ahpWeights: { type: 'object' }, consistencyCheck: { type: 'object' }, aggregatedWeights: { type: 'object' }, normalizedWeights: { type: 'object' }, rationale: { type: 'string' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'mcda']
}));

export const performanceScoringTask = defineTask('performance-scoring', (args, taskCtx) => ({
  kind: 'agent', title: 'Score alternative performance',
  skill: { name: 'hypothesis-generator' },
  agent: { name: 'decision-analyst', skills: ['hypothesis-generator', 'bayesian-inference-engine'], prompt: { role: 'Performance assessment specialist', task: 'Score each alternative on each criterion', context: args, instructions: ['Define performance scales for each criterion', 'Score each alternative on each criterion', 'Use available data where possible', 'Apply expert judgment for qualitative criteria', 'Document scoring uncertainty', 'Create performance matrix'], outputFormat: 'JSON with performanceMatrix, scales, scores, dataUsed, expertJudgments, uncertainty, artifacts' }, outputSchema: { type: 'object', required: ['performanceMatrix', 'scores', 'artifacts'], properties: { performanceMatrix: { type: 'object' }, scales: { type: 'object' }, scores: { type: 'object' }, dataUsed: { type: 'array' }, expertJudgments: { type: 'array' }, uncertainty: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'mcda']
}));

export const valueFunctionTask = defineTask('value-function', (args, taskCtx) => ({
  kind: 'agent', title: 'Construct value functions',
  skill: { name: 'hypothesis-generator' },
  agent: { name: 'decision-analyst', skills: ['hypothesis-generator', 'bayesian-inference-engine'], prompt: { role: 'Value function specialist', task: 'Construct value functions to normalize scores', context: args, instructions: ['Define value function shape for each criterion', 'Determine if linear or non-linear', 'Set anchor points (0 = worst, 100 = best)', 'Apply value functions to performance scores', 'Document value function rationale', 'Create normalized value matrix'], outputFormat: 'JSON with valueFunctions, functionShapes, anchorPoints, normalizedValues, valueMatrix, rationale, artifacts' }, outputSchema: { type: 'object', required: ['valueFunctions', 'valueMatrix', 'artifacts'], properties: { valueFunctions: { type: 'object' }, functionShapes: { type: 'object' }, anchorPoints: { type: 'object' }, normalizedValues: { type: 'object' }, valueMatrix: { type: 'object' }, rationale: { type: 'string' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'mcda']
}));

export const aggregationTask = defineTask('aggregation', (args, taskCtx) => ({
  kind: 'agent', title: 'Aggregate to overall scores',
  skill: { name: 'hypothesis-generator' },
  agent: { name: 'decision-analyst', skills: ['hypothesis-generator', 'bayesian-inference-engine'], prompt: { role: 'Aggregation specialist', task: 'Aggregate criterion scores to overall values', context: args, instructions: ['Apply weighted sum aggregation', 'Calculate overall value for each alternative', 'Create ranking', 'Calculate value differences', 'Identify ties or near-ties', 'Document aggregation method'], outputFormat: 'JSON with overallValues, ranking, valueDifferences, ties, aggregationMethod, artifacts' }, outputSchema: { type: 'object', required: ['overallValues', 'ranking', 'artifacts'], properties: { overallValues: { type: 'object' }, ranking: { type: 'array', items: { type: 'object', properties: { alternative: { type: 'string' }, value: { type: 'number' }, rank: { type: 'number' } } } }, valueDifferences: { type: 'object' }, ties: { type: 'array' }, aggregationMethod: { type: 'string' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'mcda']
}));

export const mcdaSensitivityTask = defineTask('mcda-sensitivity', (args, taskCtx) => ({
  kind: 'agent', title: 'Sensitivity analysis',
  skill: { name: 'hypothesis-generator' },
  agent: { name: 'decision-analyst', skills: ['hypothesis-generator', 'bayesian-inference-engine'], prompt: { role: 'Sensitivity analysis specialist', task: 'Analyze sensitivity of results to inputs', context: args, instructions: ['Vary each weight and observe ranking changes', 'Identify critical weights where ranking changes', 'Analyze score sensitivity', 'Create tornado diagrams', 'Identify robust conclusions', 'Document sensitivity findings'], outputFormat: 'JSON with weightSensitivity, criticalWeights, scoreSensitivity, tornadoDiagrams, robustConclusions, findings, artifacts' }, outputSchema: { type: 'object', required: ['weightSensitivity', 'robustConclusions', 'artifacts'], properties: { weightSensitivity: { type: 'object' }, criticalWeights: { type: 'array' }, scoreSensitivity: { type: 'object' }, tornadoDiagrams: { type: 'array' }, robustConclusions: { type: 'array' }, findings: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'mcda']
}));

export const mcdaRobustnessTask = defineTask('mcda-robustness', (args, taskCtx) => ({
  kind: 'agent', title: 'Robustness analysis',
  skill: { name: 'hypothesis-generator' },
  agent: { name: 'decision-analyst', skills: ['hypothesis-generator', 'bayesian-inference-engine'], prompt: { role: 'Robustness analyst', task: 'Assess robustness of the decision recommendation', context: args, instructions: ['Test multiple aggregation methods', 'Apply stochastic dominance tests', 'Consider regret-based analysis', 'Test under different weight scenarios', 'Assess overall robustness level', 'Identify conditions for ranking reversal'], outputFormat: 'JSON with aggregationMethodTests, stochasticDominance, regretAnalysis, weightScenarios, robustnessLevel, reversalConditions, artifacts' }, outputSchema: { type: 'object', required: ['robustnessLevel', 'reversalConditions', 'artifacts'], properties: { aggregationMethodTests: { type: 'array' }, stochasticDominance: { type: 'object' }, regretAnalysis: { type: 'object' }, weightScenarios: { type: 'array' }, robustnessLevel: { type: 'string' }, reversalConditions: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'mcda']
}));

export const mcdaRecommendationTask = defineTask('mcda-recommendation', (args, taskCtx) => ({
  kind: 'agent', title: 'Generate recommendation',
  skill: { name: 'hypothesis-generator' },
  agent: { name: 'decision-analyst', skills: ['hypothesis-generator', 'bayesian-inference-engine'], prompt: { role: 'Decision recommendation specialist', task: 'Generate final recommendation from MCDA', context: args, instructions: ['State recommended alternative', 'Explain key factors driving recommendation', 'Note caveats and conditions', 'Suggest implementation considerations', 'Identify monitoring needs', 'Document decision rationale'], outputFormat: 'JSON with recommendation, keyFactors, caveats, implementationConsiderations, monitoringNeeds, rationale, artifacts' }, outputSchema: { type: 'object', required: ['recommendation', 'rationale', 'artifacts'], properties: { recommendation: { type: 'object', properties: { alternative: { type: 'string' }, confidence: { type: 'string' } } }, keyFactors: { type: 'array' }, caveats: { type: 'array' }, implementationConsiderations: { type: 'array' }, monitoringNeeds: { type: 'array' }, rationale: { type: 'string' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'mcda']
}));

export const mcdaQualityScoringTask = defineTask('mcda-quality-scoring', (args, taskCtx) => ({
  kind: 'agent', title: 'Score MCDA quality',
  skill: { name: 'hypothesis-generator' },
  agent: { name: 'decision-analyst', skills: ['hypothesis-generator', 'bayesian-inference-engine'], prompt: { role: 'MCDA quality auditor', task: 'Score the quality of the multi-criteria decision analysis', context: args, instructions: ['Score problem structuring', 'Score criteria weighting rigor', 'Score performance assessment', 'Score sensitivity analysis', 'Score overall transparency', 'Calculate overall score'], outputFormat: 'JSON with overallScore, structuringScore, weightingScore, assessmentScore, sensitivityScore, transparencyScore, artifacts' }, outputSchema: { type: 'object', required: ['overallScore', 'artifacts'], properties: { overallScore: { type: 'number' }, structuringScore: { type: 'number' }, weightingScore: { type: 'number' }, assessmentScore: { type: 'number' }, sensitivityScore: { type: 'number' }, transparencyScore: { type: 'number' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'mcda']
}));
