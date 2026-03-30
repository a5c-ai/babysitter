/**
 * @process domains/science/scientific-discovery/causal-inference-observational
 * @description Apply quasi-experimental methods for causal relationships - Guides researchers through
 * rigorous causal inference from observational data using modern causal identification strategies.
 * @inputs { researchQuestion: string, treatment: string, outcome: string, data: object, confounders?: array }
 * @outputs { success: boolean, causalEstimate: object, robustnessChecks: array, assumptions: array, recommendations: array }
 *
 * @example
 * const result = await orchestrate('domains/science/scientific-discovery/causal-inference-observational', {
 *   researchQuestion: 'Does education affect earnings?',
 *   treatment: 'years_of_education',
 *   outcome: 'annual_income',
 *   data: { source: 'census_data.csv', n: 50000 },
 *   confounders: ['family_income', 'ability', 'location']
 * });
 *
 * @references
 * - Angrist, J.D. & Pischke, J.S. (2009). Mostly Harmless Econometrics
 * - Pearl, J. (2009). Causality: Models, Reasoning, and Inference
 * - Imbens, G.W. & Rubin, D.B. (2015). Causal Inference for Statistics
 * - Hernán, M.A. & Robins, J.M. (2020). Causal Inference: What If
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { researchQuestion, treatment, outcome, data, confounders = [], outputDir = 'causal-output', minimumRobustnessScore = 70 } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Causal Inference Analysis for: ${researchQuestion}`);

  const causalFramework = await ctx.task(causalFrameworkTask, { researchQuestion, treatment, outcome, confounders, outputDir });
  artifacts.push(...causalFramework.artifacts);

  const dagConstruction = await ctx.task(dagConstructionTask, { treatment, outcome, confounders, framework: causalFramework, outputDir });
  artifacts.push(...dagConstruction.artifacts);

  const identificationStrategy = await ctx.task(identificationStrategyTask, { dag: dagConstruction, treatment, outcome, data, outputDir });
  artifacts.push(...identificationStrategy.artifacts);

  await ctx.breakpoint({
    question: `Causal framework established. Strategy: ${identificationStrategy.strategy || 'N/A'}. ${identificationStrategy.assumptions?.length || 0} key assumptions. Review before estimation?`,
    title: 'Causal Identification Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })), summary: { strategy: identificationStrategy.strategy || 'N/A', assumptions: identificationStrategy.assumptions?.length || 0 }}
  });

  const propensityScoreAnalysis = await ctx.task(propensityScoreTask, { treatment, confounders, data, identificationStrategy, outputDir });
  artifacts.push(...propensityScoreAnalysis.artifacts);

  const matchingAnalysis = await ctx.task(matchingAnalysisTask, { treatment, outcome, confounders, propensityScores: propensityScoreAnalysis, data, outputDir });
  artifacts.push(...matchingAnalysis.artifacts);

  const regressionAnalysis = await ctx.task(regressionAnalysisTask, { treatment, outcome, confounders, data, identificationStrategy, outputDir });
  artifacts.push(...regressionAnalysis.artifacts);

  const ivAnalysis = await ctx.task(instrumentalVariablesTask, { treatment, outcome, data, identificationStrategy, outputDir });
  artifacts.push(...ivAnalysis.artifacts);

  const sensitivityAnalysis = await ctx.task(causalSensitivityTask, { estimates: { matching: matchingAnalysis, regression: regressionAnalysis, iv: ivAnalysis }, assumptions: identificationStrategy.assumptions, outputDir });
  artifacts.push(...sensitivityAnalysis.artifacts);

  const robustnessChecks = await ctx.task(robustnessChecksTask, { estimates: { matching: matchingAnalysis, regression: regressionAnalysis, iv: ivAnalysis }, sensitivityAnalysis, outputDir });
  artifacts.push(...robustnessChecks.artifacts);

  const qualityScore = await ctx.task(causalQualityScoringTask, { identificationStrategy, propensityScoreAnalysis, matchingAnalysis, regressionAnalysis, sensitivityAnalysis, robustnessChecks, minimumRobustnessScore, outputDir });
  artifacts.push(...qualityScore.artifacts);

  await ctx.breakpoint({
    question: `Causal analysis complete. Estimate: ${matchingAnalysis.estimate?.value || 'N/A'}. Robustness: ${robustnessChecks.overallRobustness || 'N/A'}. Quality: ${qualityScore.overallScore}/100. Approve?`,
    title: 'Causal Inference Approval',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })), summary: { estimate: matchingAnalysis.estimate?.value || 'N/A', robustness: robustnessChecks.overallRobustness || 'N/A', qualityScore: qualityScore.overallScore }}
  });

  return {
    success: true, researchQuestion, causalEstimate: { primary: matchingAnalysis.estimate, alternatives: { regression: regressionAnalysis.estimate, iv: ivAnalysis.estimate } },
    robustnessChecks: robustnessChecks.checks, assumptions: identificationStrategy.assumptions,
    recommendations: sensitivityAnalysis.recommendations, qualityScore: { overall: qualityScore.overallScore },
    artifacts, duration: ctx.now() - startTime,
    metadata: { processId: 'domains/science/scientific-discovery/causal-inference-observational', timestamp: startTime, outputDir }
  };
}

export const causalFrameworkTask = defineTask('causal-framework', (args, taskCtx) => ({
  kind: 'agent', title: 'Establish causal framework',
  agent: { name: 'causal-reasoning-analyst', skills: ['causal-inference-engine', 'statistical-test-selector', 'regression-analyzer'], prompt: { role: 'Causal inference methodologist', task: 'Establish the causal framework for the research question', context: args, instructions: ['Define the causal estimand clearly', 'Specify potential outcomes framework', 'Define treatment and control conditions', 'Identify the target population', 'Specify the causal quantity of interest (ATE, ATT, LATE)'], outputFormat: 'JSON with estimand, potentialOutcomes, treatmentDefinition, targetPopulation, causalQuantity, artifacts' }, outputSchema: { type: 'object', required: ['estimand', 'causalQuantity', 'artifacts'], properties: { estimand: { type: 'string' }, potentialOutcomes: { type: 'object' }, treatmentDefinition: { type: 'object' }, targetPopulation: { type: 'string' }, causalQuantity: { type: 'string' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'causal-inference']
}));

export const dagConstructionTask = defineTask('dag-construction', (args, taskCtx) => ({
  kind: 'agent', title: 'Construct causal DAG',
  agent: { name: 'causal-reasoning-analyst', skills: ['causal-inference-engine', 'statistical-test-selector', 'regression-analyzer'], prompt: { role: 'Causal graph specialist', task: 'Construct directed acyclic graph (DAG) for causal relationships', context: args, instructions: ['List all relevant variables', 'Draw causal arrows based on theory', 'Identify confounders (common causes)', 'Identify colliders', 'Identify mediators', 'Check for cycles and fix'], outputFormat: 'JSON with dag, variables, confounders, colliders, mediators, causalPaths, artifacts' }, outputSchema: { type: 'object', required: ['dag', 'confounders', 'artifacts'], properties: { dag: { type: 'object' }, variables: { type: 'array' }, confounders: { type: 'array' }, colliders: { type: 'array' }, mediators: { type: 'array' }, causalPaths: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'causal-inference']
}));

export const identificationStrategyTask = defineTask('identification-strategy', (args, taskCtx) => ({
  kind: 'agent', title: 'Develop identification strategy',
  agent: { name: 'causal-reasoning-analyst', skills: ['causal-inference-engine', 'statistical-test-selector', 'regression-analyzer'], prompt: { role: 'Identification strategist', task: 'Develop strategy for causal identification', context: args, instructions: ['Evaluate selection on observables assumption', 'Consider instrumental variables', 'Evaluate regression discontinuity opportunities', 'Consider difference-in-differences', 'Document key identifying assumptions', 'Recommend primary strategy'], outputFormat: 'JSON with strategy, assumptions, selectionOnObservables, instrumentalVariables, regressionDiscontinuity, differencesInDifferences, recommendation, artifacts' }, outputSchema: { type: 'object', required: ['strategy', 'assumptions', 'artifacts'], properties: { strategy: { type: 'string' }, assumptions: { type: 'array', items: { type: 'object', properties: { assumption: { type: 'string' }, testable: { type: 'boolean' }, plausibility: { type: 'string' } } } }, selectionOnObservables: { type: 'object' }, instrumentalVariables: { type: 'object' }, regressionDiscontinuity: { type: 'object' }, differencesInDifferences: { type: 'object' }, recommendation: { type: 'string' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'causal-inference']
}));

export const propensityScoreTask = defineTask('propensity-score', (args, taskCtx) => ({
  kind: 'agent', title: 'Propensity score analysis',
  agent: { name: 'causal-reasoning-analyst', skills: ['causal-inference-engine', 'statistical-test-selector', 'regression-analyzer'], prompt: { role: 'Propensity score analyst', task: 'Estimate and evaluate propensity scores', context: args, instructions: ['Specify propensity score model', 'Estimate propensity scores', 'Check overlap/common support', 'Evaluate balance after weighting', 'Trim extreme propensity scores', 'Document model specification'], outputFormat: 'JSON with model, propensityScores, overlap, balance, trimming, diagnostics, artifacts' }, outputSchema: { type: 'object', required: ['model', 'overlap', 'artifacts'], properties: { model: { type: 'object' }, propensityScores: { type: 'object' }, overlap: { type: 'object' }, balance: { type: 'object' }, trimming: { type: 'object' }, diagnostics: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'causal-inference']
}));

export const matchingAnalysisTask = defineTask('matching-analysis', (args, taskCtx) => ({
  kind: 'agent', title: 'Matching analysis',
  agent: { name: 'causal-reasoning-analyst', skills: ['causal-inference-engine', 'statistical-test-selector', 'regression-analyzer'], prompt: { role: 'Matching estimator specialist', task: 'Estimate causal effects using matching methods', context: args, instructions: ['Apply propensity score matching', 'Apply covariate matching', 'Check covariate balance after matching', 'Estimate treatment effect', 'Calculate standard errors', 'Document matching diagnostics'], outputFormat: 'JSON with matchingMethod, estimate, standardError, covariateBalance, matchQuality, diagnostics, artifacts' }, outputSchema: { type: 'object', required: ['estimate', 'matchingMethod', 'artifacts'], properties: { matchingMethod: { type: 'string' }, estimate: { type: 'object', properties: { value: { type: 'number' }, standardError: { type: 'number' }, confidenceInterval: { type: 'array' } } }, standardError: { type: 'number' }, covariateBalance: { type: 'object' }, matchQuality: { type: 'object' }, diagnostics: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'causal-inference']
}));

export const regressionAnalysisTask = defineTask('regression-analysis', (args, taskCtx) => ({
  kind: 'agent', title: 'Regression analysis',
  agent: { name: 'causal-reasoning-analyst', skills: ['causal-inference-engine', 'statistical-test-selector', 'regression-analyzer'], prompt: { role: 'Regression analyst', task: 'Estimate causal effects using regression methods', context: args, instructions: ['Specify regression model', 'Include all confounders', 'Consider functional form', 'Estimate with robust standard errors', 'Check regression diagnostics', 'Compare OLS, weighted, and doubly robust'], outputFormat: 'JSON with regressionModel, estimate, robustSE, diagnostics, specifications, doublyRobust, artifacts' }, outputSchema: { type: 'object', required: ['estimate', 'regressionModel', 'artifacts'], properties: { regressionModel: { type: 'object' }, estimate: { type: 'object' }, robustSE: { type: 'number' }, diagnostics: { type: 'array' }, specifications: { type: 'array' }, doublyRobust: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'causal-inference']
}));

export const instrumentalVariablesTask = defineTask('instrumental-variables', (args, taskCtx) => ({
  kind: 'agent', title: 'Instrumental variables analysis',
  agent: { name: 'causal-reasoning-analyst', skills: ['causal-inference-engine', 'statistical-test-selector', 'regression-analyzer'], prompt: { role: 'Instrumental variables specialist', task: 'Evaluate and apply instrumental variables if applicable', context: args, instructions: ['Identify potential instruments', 'Test instrument relevance (first stage)', 'Assess exclusion restriction plausibility', 'Estimate 2SLS if instruments available', 'Test for weak instruments', 'Document IV assumptions'], outputFormat: 'JSON with instruments, relevanceTest, exclusionAssessment, estimate, weakInstrumentTest, assumptions, artifacts' }, outputSchema: { type: 'object', required: ['instruments', 'artifacts'], properties: { instruments: { type: 'array' }, relevanceTest: { type: 'object' }, exclusionAssessment: { type: 'object' }, estimate: { type: 'object' }, weakInstrumentTest: { type: 'object' }, assumptions: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'causal-inference']
}));

export const causalSensitivityTask = defineTask('causal-sensitivity', (args, taskCtx) => ({
  kind: 'agent', title: 'Sensitivity analysis',
  agent: { name: 'causal-reasoning-analyst', skills: ['causal-inference-engine', 'statistical-test-selector', 'regression-analyzer'], prompt: { role: 'Sensitivity analysis specialist', task: 'Assess sensitivity of causal estimates to assumption violations', context: args, instructions: ['Apply Rosenbaum bounds', 'Conduct omitted variable bias analysis', 'Apply E-value analysis', 'Test sensitivity to unobserved confounding', 'Document sensitivity thresholds', 'Generate recommendations'], outputFormat: 'JSON with rosenbaumBounds, omittedVariableBias, eValue, sensitivityToUnobserved, thresholds, recommendations, artifacts' }, outputSchema: { type: 'object', required: ['sensitivityToUnobserved', 'recommendations', 'artifacts'], properties: { rosenbaumBounds: { type: 'object' }, omittedVariableBias: { type: 'object' }, eValue: { type: 'object' }, sensitivityToUnobserved: { type: 'object' }, thresholds: { type: 'array' }, recommendations: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'causal-inference']
}));

export const robustnessChecksTask = defineTask('robustness-checks', (args, taskCtx) => ({
  kind: 'agent', title: 'Robustness checks',
  agent: { name: 'causal-reasoning-analyst', skills: ['causal-inference-engine', 'statistical-test-selector', 'regression-analyzer'], prompt: { role: 'Robustness assessment specialist', task: 'Conduct comprehensive robustness checks', context: args, instructions: ['Compare estimates across methods', 'Test alternative specifications', 'Conduct placebo tests', 'Check for heterogeneous effects', 'Test subsample robustness', 'Calculate overall robustness score'], outputFormat: 'JSON with checks, methodComparison, alternativeSpecs, placeboTests, heterogeneity, subsampleTests, overallRobustness, artifacts' }, outputSchema: { type: 'object', required: ['checks', 'overallRobustness', 'artifacts'], properties: { checks: { type: 'array' }, methodComparison: { type: 'object' }, alternativeSpecs: { type: 'array' }, placeboTests: { type: 'array' }, heterogeneity: { type: 'object' }, subsampleTests: { type: 'array' }, overallRobustness: { type: 'string' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'causal-inference']
}));

export const causalQualityScoringTask = defineTask('causal-quality-scoring', (args, taskCtx) => ({
  kind: 'agent', title: 'Score causal analysis quality',
  agent: { name: 'causal-reasoning-analyst', skills: ['causal-inference-engine', 'statistical-test-selector', 'regression-analyzer'], prompt: { role: 'Causal inference auditor', task: 'Score the quality of the causal inference analysis', context: args, instructions: ['Score identification strategy', 'Score propensity score quality', 'Score estimation methods', 'Score sensitivity analysis', 'Score robustness checks', 'Calculate overall score'], outputFormat: 'JSON with overallScore, identificationScore, propensityScore, estimationScore, sensitivityScore, robustnessScore, artifacts' }, outputSchema: { type: 'object', required: ['overallScore', 'artifacts'], properties: { overallScore: { type: 'number' }, identificationScore: { type: 'number' }, propensityScore: { type: 'number' }, estimationScore: { type: 'number' }, sensitivityScore: { type: 'number' }, robustnessScore: { type: 'number' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'causal-inference']
}));
